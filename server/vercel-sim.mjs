
import http from 'node:http';
import words from '../api/words.js';
import search from '../api/search.js';
import reply from '../api/reply.js';
import render from '../api/render.js';
import wordSlug from '../api/word/[slug].js';

const routes = {
  'GET /api/words': words,
  'GET /api/search': search,
  'POST /api/reply': reply,
  'POST /api/render': render,
};
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(u.searchParams.entries());
  const key = `${req.method} ${u.pathname}`;
  try {
    if (routes[key]) return await routes[key](req, res);
    const m = u.pathname.match(/^\/api\/word\/([^/]+)$/);
    if (req.method === 'GET' && m) { req.query.slug = decodeURIComponent(m[1]); return await wordSlug(req, res); }
    res.writeHead(404, {'content-type':'application/json'}); res.end(JSON.stringify({ok:false,error:'not found'}));
  } catch (e) { res.writeHead(500, {'content-type':'application/json'}); res.end(JSON.stringify({ok:false,error:String(e.message||e)})); }
});
server.listen(3996, () => console.log('vercel-sim on 3996'));
