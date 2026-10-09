import { ico, setMeta } from '../lib/utils.js';

export function viewNotFound(){
  setMeta('NGMI — Degen Dictionary',"This word doesn't exist yet.",location.href);
  return `<div class="wrap"><div class="nf"><span class="cap">404 · ENTRY NOT FOUND</span><h1>NGMI</h1><p>This word doesn't exist yet.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-act="search">${ico.search}SEARCH</button><a class="btn" href="#/">BACK TO DICTIONARY</a></div></div></div>`;
}
