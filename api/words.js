import { send, listWords } from '../server/api-lib.mjs';
export default function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'method not allowed' });
  send(res, 200, { ok: true, words: listWords() });
}
