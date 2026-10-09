from pathlib import Path
import mimetypes
import os
import time
import json

from unyx import UnyxClient
from unyx.client import FEATURES
from unyx.utils import random_delay, SHORT_MIN, SHORT_MAX

DEFAULT_UPLOAD_URL = os.environ.get(
    "UNYX_MEDIA_UPLOAD_URL",
    "https://upload.x.com/i/media/upload.json",
)

IMG_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}

class DegenXClient(UnyxClient):
    def __init__(self, upload_url: str = DEFAULT_UPLOAD_URL):
        super().__init__()
        self.media_upload_url = upload_url

    def upload_media(self, path, media_category="tweet_image"):
        p = Path(path).expanduser()
        if not p.is_file():
            raise FileNotFoundError(str(p))
        data = p.read_bytes()
        if len(data) > 5_000_000:
            raise ValueError("X images must be <= 5MB; compress the card first.")

        media_type = IMG_TYPES.get(p.suffix.lower()) or mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        self._ensure_authed()
        random_delay(SHORT_MIN, SHORT_MAX)

        init = self._v11_post(self.media_upload_url, {
            "command": "INIT",
            "total_bytes": str(len(data)),
            "media_type": media_type,
            "media_category": media_category,
        })
        media_id = str(init.get("media_id_string") or init.get("media_id") or "")
        if not media_id:
            raise RuntimeError(f"media INIT failed: {json.dumps(init)[:300]}")

        h = self._headers()  # no content-type; httpx sets multipart boundary
        resp = self._get_http().request(
            "POST",
            self.media_upload_url,
            headers=h,
            data={"command": "APPEND", "media_id": media_id, "segment_index": "0"},
            files={"media": (p.name, data, media_type)},
        )
        self._update_ct0_from_response(resp)
        if resp.status_code not in (200, 204):
            raise RuntimeError(f"media APPEND failed {resp.status_code}: {resp.text[:300]}")

        fin = self._v11_post(self.media_upload_url, {"command": "FINALIZE", "media_id": media_id})
        info = fin.get("processing_info") or {}
        while info.get("state") in ("pending", "in_progress"):
            time.sleep(max(1, min(5, int(info.get("check_after_secs") or 2))))
            status = self._request("GET", self.media_upload_url, params={
                "command": "STATUS",
                "media_id": media_id,
            })
            info = status.get("processing_info") or {}
        if info.get("state") == "failed":
            raise RuntimeError(f"media processing failed: {json.dumps(info)[:300]}")
        return media_id

    def create_tweet(self, text, reply_to=None, media_paths=None):
        self._ensure_authed()
        random_delay()

        media_entities = []
        for path in media_paths or []:
            media_entities.append({"media_id": self.upload_media(path)})

        vars_ = {
            "tweet_text": text,
            "dark_request": False,
            "media": {
                "media_entities": media_entities,
                "possibly_sensitive": False,
            },
            "semantic_annotation_ids": [],
        }
        if reply_to:
            vars_["reply"] = {
                "in_reply_to_tweet_id": str(reply_to),
                "exclude_reply_user_ids": [],
            }

        result = self._gql("CreateTweet", vars_, FEATURES)
        tweet = (
            result.get("data", {})
            .get("create_tweet", {})
            .get("tweet_results", {})
            .get("result", {})
        )
        rest_id = tweet.get("rest_id", "")
        if not rest_id:
            raise RuntimeError("X silently dropped write: " + json.dumps(result)[:500])
        return {"id": rest_id, "text": text, "reply_to": reply_to}

    def reply_with_media(self, tweet_id, text, image_path):
        return self.create_tweet(text, reply_to=tweet_id, media_paths=[image_path])