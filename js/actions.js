import { getWordBySlug, getRandomWord } from './lib/dictionary.js';
import { reduceMotion, wordUrl } from './lib/utils.js';

export function currentWord(){ const m=location.hash.match(/^#\/word\/(.+)$/); return m?getWordBySlug(m[1]):null; }

export async function copyLink(btn){
  const w = currentWord(); const url = w?wordUrl(w):location.href;
  const orig = btn.innerHTML;
  try{
    if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
    else { const t=document.createElement('textarea'); t.value=url; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); const ok=document.execCommand('copy'); t.remove(); if(!ok) throw 0; }
    btn.innerHTML = 'COPIED ✓';
  }catch(e){ btn.innerHTML = 'COPY FAILED'; }
  setTimeout(()=>{ btn.innerHTML = orig; },1600);
}

let rndBusy=false;
export function randomWord(btn){
  if(rndBusy) return; const cur=currentWord(); const target=getRandomWord(cur);
  if(reduceMotion()){ location.hash='#/word/'+target.slug; return; }
  rndBusy=true; const orig=btn.innerHTML; document.body.classList.add('cycling');
  let n=0; const total=9;
  const iv=setInterval(()=>{
    n++; const w = n>=total ? target : getRandomWord();
    btn.textContent = w.term;
    if(n>=total){ clearInterval(iv); setTimeout(()=>{ rndBusy=false; document.body.classList.remove('cycling'); btn.innerHTML=orig; location.hash='#/word/'+target.slug; },220); }
  },75);
}
