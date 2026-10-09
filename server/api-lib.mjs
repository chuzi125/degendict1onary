// Shared logic for the Vercel serverless API (api/*.js) and local server/api.mjs.
import { getAllWords, getWordBySlug, searchWords } from '../js/lib/dictionary.js';
import { buildReply } from './reply.mjs';
import { renderCard } from './render.mjs';

export const pub = w => ({
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

export const listWords = () => getAllWords().map(pub);
export const findWord = slug => { const w = getWordBySlug(slug); return w ? pub(w) : null; };
export const find = q => searchWords(q).map(pub);

export function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*'
  });
  res.end(body);
}

export function query(req) {
  if (req.query) return req.query; // Vercel
  const u = new URL(req.url, 'http://localhost');
  return Object.fromEntries(u.searchParams.entries());
}

export function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1_000_000) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('invalid JSON body')); } });
    req.on('error', reject);
  });
}

export function canvasHint(e) {
  const msg = String(e?.message || e);
  return msg.includes('@napi-rs/canvas')
    ? 'image rendering not installed — add @napi-rs/canvas to dependencies and redeploy'
    : null;
}

export async function replyPayload(text) {
  const r = await buildReply(text);
  if (!r.ok) return { status: 404, body: r };
  return { status: 200, body: {
    ok: true, word: pub(r.word), template: r.template, format: r.format,
    replyText: r.replyText, imageBase64: r.buffer.toString('base64'), imageBytes: r.buffer.length
  }};
}

export async function renderPayload(slug, template, format) {
  const w = getWordBySlug(slug);
  if (!w) return { status: 404, body: { ok: false, error: 'word not found' } };
  const buffer = await renderCard(w, { template: template || 'editorial', format: format || 'square' });
  return { status: 200, body: {
    ok: true, word: pub(w), template: template || 'editorial', format: format || 'square',
    imageBase64: buffer.toString('base64'), imageBytes: buffer.length
  }};
}
