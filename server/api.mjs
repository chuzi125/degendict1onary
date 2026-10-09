import http from 'node:http';
import { getAllWords, getWordBySlug, searchWords } from '../js/lib/dictionary.js';
import { buildReply } from './reply.mjs';
import { renderCard } from './render.mjs';

const PORT = Number(process.env.PORT || 3001);

const pub = w => ({
  slug: w.slug,
  term: w.term,
  definition: w.definition,
  shortDefinition: w.shortDefinition || w.definition,
  categories: w.categories || [],
  aliases: w.aliases || [],
  examples: w.examples || [],
  context: w.context || '',
  origin: w.origin || ''
});

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > 1_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = u.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && path === '/api/health') {
      return send(res, 200, { ok: true, words: getAllWords().length });
    }

    if (req.method === 'GET' && path === '/api/words') {
      return send(res, 200, { ok: true, words: getAllWords().map(pub) });
    }

    if (req.method === 'GET' && path.startsWith('/api/words/')) {
      const slug = decodeURIComponent(path.split('/').pop());
      const w = getWordBySlug(slug);
      return w ? send(res, 200, { ok: true, word: pub(w) })
               : send(res, 404, { ok: false, error: 'word not found' });
    }

    if (req.method === 'GET' && path === '/api/search') {
      const q = u.searchParams.get('q') || '';
      return send(res, 200, { ok: true, query: q, words: searchWords(q).map(pub) });
    }

    if (req.method === 'POST' && path === '/api/reply') {
      const body = await readBody(req);
      const text = body.text || body.tweetText || '';
      let r;
      try {
        r = await buildReply(text);
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('@napi-rs/canvas')) {
          return send(res, 503, { ok: false, error: "image rendering not installed — run: npm run setup:server  (cd server && npm install)" });
        }
        throw e;
      }
      if (!r.ok) return send(res, 404, r);
      return send(res, 200, {
        ok: true,
        word: pub(r.word),
        template: r.template,
        format: r.format,
        replyText: r.replyText,
        imageBase64: r.buffer.toString('base64'),
        imageBytes: r.buffer.length
      });
    }

    if (req.method === 'POST' && path === '/api/render') {
      const body = await readBody(req);
      const w = getWordBySlug(body.slug);
      if (!w) return send(res, 404, { ok: false, error: 'word not found' });
      let buffer;
      try {
        buffer = await renderCard(w, { template: body.template || 'editorial', format: body.format || 'square' });
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('@napi-rs/canvas')) {
          return send(res, 503, { ok: false, error: "image rendering not installed — run: npm run setup:server  (cd server && npm install)" });
        }
        throw e;
      }
      return send(res, 200, {
        ok: true,
        word: pub(w),
        template: body.template || 'editorial',
        format: body.format || 'square',
        imageBase64: buffer.toString('base64'),
        imageBytes: buffer.length
      });
    }

    send(res, 404, { ok: false, error: 'not found' });
  } catch (e) {
    send(res, 500, { ok: false, error: String(e?.message || e) });
  }
});

server.listen(PORT, () => console.log(`Degen API on http://localhost:${PORT}`));