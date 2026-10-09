import { send, readJson, canvasHint, renderPayload } from '../server/api-lib.mjs';
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  const body = await readJson(req);
  try {
    const { status, body: out } = await renderPayload(body.slug, body.template, body.format);
    send(res, status, out);
  } catch (e) {
    const hint = canvasHint(e);
    send(res, hint ? 503 : 500, { ok: false, error: hint || String(e?.message || e) });
  }
}
