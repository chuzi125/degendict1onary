import { send, query, readJson, canvasHint, replyPayload } from '../server/api-lib.mjs';
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  const text = (await readJson(req)).text ?? query(req).text ?? '';
  try {
    const { status, body } = await replyPayload(text);
    send(res, status, body);
  } catch (e) {
    const hint = canvasHint(e);
    send(res, hint ? 503 : 500, { ok: false, error: hint || String(e?.message || e) });
  }
}
