from pathlib import Path
import json
import os
import subprocess
import sys
import time
import base64
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bot.xclient import DegenXClient  # noqa: E402

STATE = Path(os.environ.get("DEGEN_STATE", ROOT / "bot" / "state.json"))
IMAGE = Path(os.environ.get("DEGEN_IMAGE_OUT", ROOT / "bot" / ".reply-card.png"))
COUNT = int(os.environ.get("DEGEN_MENTION_COUNT", "20"))
POLL_SECONDS = int(os.environ.get("DEGEN_POLL_SECONDS", "60"))
DRY_RUN = os.environ.get("DEGEN_DRY_RUN", "0") == "1"
ONCE = os.environ.get("DEGEN_ONCE", "0") == "1"
REPLY_NOT_FOUND = os.environ.get("DEGEN_REPLY_NOT_FOUND", "1") == "1"
TEXT_FALLBACK = os.environ.get("DEGEN_TEXT_FALLBACK", "1") == "1"

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"last_id": None, "seen": []}

def save_state(st):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(st, indent=2))
    tmp.replace(STATE)

API = os.environ.get("DEGEN_API_URL", "").rstrip("/")

def build_reply_remote(text):
    req = urllib.request.Request(
        API + "/api/reply",
        data=json.dumps({"text": text}).encode(),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        payload = json.loads(r.read())
    if payload.get("ok"):
        IMAGE.write_bytes(base64.b64decode(payload["imageBase64"]))
        payload["imagePath"] = str(IMAGE)
    return payload

def build_reply(text):
    if API:
        return build_reply_remote(text)
    cmd = [
        "node", str(ROOT / "server" / "reply-cli.mjs"),
        "--text", text,
        "--out", str(IMAGE),
        "--json",
    ]
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=90)
    try:
        payload = json.loads((r.stdout or "").strip().splitlines()[-1])
    except Exception:
        payload = {"ok": False, "replyText": (r.stderr or r.stdout or "reply render failed")[:500]}
    if r.returncode != 0 and "ok" not in payload:
        payload = {"ok": False, "replyText": payload}
    return payload

def process_batch(client, st):
    box = client.mentions(COUNT)
    mentions = box.get("mentions", []) if isinstance(box, dict) else []

    if not mentions:
        return st

    numeric = [m for m in mentions if str(m.get("id", "")).isdigit()]
    newest = max(str(m.get("id")) for m in numeric) if numeric else None

    # First run: do not reply to old mentions. Start from now.
    if not st.get("last_id"):
        st["last_id"] = newest
        st["seen"] = st.get("seen", [])[-5000:]
        save_state(st)
        return st

    fresh = [m for m in numeric if str(m.get("id")) > str(st["last_id"])]
    fresh.sort(key=lambda m: str(m.get("id")))

    own = (client._screen_name or "").lower()
    for m in fresh:
        mid = str(m.get("id"))
        if mid in st.get("seen", []):
            continue
        user = (m.get("user") or {}).get("screen_name", "").lower()
        if own and user == own:
            continue

        text = m.get("text", "")
        print(f"[mention] @{user} {mid}: {text[:120]}", flush=True)
        r = build_reply(text)

        if DRY_RUN:
            print(json.dumps({"dry_run": True, "result": r}, indent=2), flush=True)
        else:
            try:
                if r.get("ok"):
                    client.reply_with_media(mid, r["replyText"], IMAGE)
                    print(f"[replied] {mid} with image", flush=True)
                elif REPLY_NOT_FOUND:
                    client.reply(mid, r["replyText"])
                    print(f"[replied] {mid} not-found text", flush=True)
            except Exception as e:
                print(f"[post failed] {mid}: {e}", flush=True)
                if TEXT_FALLBACK and r.get("replyText"):
                    try:
                        client.reply(mid, r["replyText"] + "  (image unavailable)")
                        print(f"[fallback] {mid} text-only", flush=True)
                    except Exception as e2:
                        print(f"[fallback failed] {mid}: {e2}", flush=True)

        seen = st.setdefault("seen", [])
        seen.append(mid)
        st["seen"] = seen[-5000:]

    if newest:
        st["last_id"] = newest
    save_state(st)
    return st

def main():
    with DegenXClient() as client:
        if not client.login_from_cookies():
            raise SystemExit("cookie login failed")
        st = load_state()
        while True:
            st = process_batch(client, st)
            if ONCE:
                break
            time.sleep(POLL_SECONDS)

if __name__ == "__main__":
    main()