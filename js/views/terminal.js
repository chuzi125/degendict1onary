import { CATEGORIES } from '../data/categories.js';
import { getRelatedWords, getFeaturedWord, getRandomWord, getWordsByCategory, searchWords } from '../lib/dictionary.js';
import { $, esc } from '../lib/utils.js';
import { state } from '../state.js';

export function defineHtml(w){
  const rel = getRelatedWords(w);
  return `<div class="o"><b>${esc(w.term)}</b><div class="dim">${esc(w.pronunciation||'')}</div><div style="margin:6px 0">${esc(w.definition)}</div><div class="dim">category: ${esc(w.categories.join(', '))}${rel.length?' · related: ':''}${rel.map(r=>`<a href="#/word/${esc(r.slug)}">${esc(r.term.toLowerCase())}</a>`).join(', ')}</div></div>`;
}
export function terminalHtml(interactive,w){
  if(!interactive){
    return `<div class="tm"><div class="bar"><i></i><i></i><i></i>&nbsp;degen@dictionary</div><div class="body"><div class="cmd">&gt; define ${esc(w.term.toLowerCase())}</div>${defineHtml(w)}</div></div>`;
  }
  if(!state.termOut){ const f=getFeaturedWord(); state.termOut=[`<div class="cmd">&gt; define ${esc(f.term.toLowerCase())}</div>`+defineHtml(f)]; }
  return `<div class="tm"><div class="bar"><i></i><i></i><i></i>&nbsp;degen@dictionary · type "help"</div><div class="body" id="tmBody" aria-live="polite">${state.termOut.join('')}</div>
  <form id="tmForm"><span aria-hidden="true">&gt;</span><label class="sr" for="tmIn">Terminal command</label><input id="tmIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="define wagmi"></form></div>`;
}
export function runCmd(raw){
  const c = raw.trim(); if(!c) return '';
  const [cmd,...rest] = c.split(/\s+/); const arg = rest.join(' ');
  const head = `<div class="cmd">&gt; ${esc(c)}</div>`;
  const lc = cmd.toLowerCase();
  if(lc==='help') return head+`<div class="o dim">define &lt;word&gt; · random · list [category] · clear</div>`;
  if(lc==='random'){ const w=getRandomWord(); return head+defineHtml(w); }
  if(lc==='list'){ const cat = CATEGORIES.find(x=>x.toLowerCase()===arg.toLowerCase())||'ALL'; return head+`<div class="o">${getWordsByCategory(cat).map(w=>`<a href="#/word/${esc(w.slug)}">${esc(w.term.toLowerCase())}</a>`).join(' · ')}</div>`; }
  if(lc==='define' && arg){
    const r = searchWords(arg)[0];
    return head+(r?defineHtml(r):`<div class="o dim">no entry for "${esc(arg)}". ngmi.</div>`);
  }
  if(lc==='define') return head+`<div class="o dim">usage: define &lt;word&gt;</div>`;
  return head+`<div class="o dim">command not found: ${esc(cmd)}. try "help".</div>`;
}

export function bindTerminal(){
  const f = $('#tmForm');
  if(!f) return;
  f.addEventListener('submit',e=>{
    e.preventDefault(); const inp=$('#tmIn'); const v=inp.value; inp.value='';
    if(v.trim().toLowerCase()==='clear'){ state.termOut=[]; }
    else state.termOut.push(runCmd(v));
    const b=$('#tmBody'); b.innerHTML=state.termOut.join(''); b.scrollTop=b.scrollHeight;
  });
}
