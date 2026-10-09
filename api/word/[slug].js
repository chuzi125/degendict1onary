import { send, query, findWord } from '../../server/api-lib.mjs';
export default function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'method not allowed' });
  const slug = query(req).slug || '';
  const word = findWord(slug);
  word ? send(res, 200, { ok: true, word }) : send(res, 404, { ok: false, error: 'word not found' });
}
