import { send, query, find } from '../server/api-lib.mjs';
export default function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'method not allowed' });
  const q = query(req).q || '';
  send(res, 200, { ok: true, query: q, words: find(q) });
}
