import { DICTIONARY } from './data/dictionary.js';
import { getWordBySlug } from './lib/dictionary.js';
import { $, $$ } from './lib/utils.js';
import { state, applyTerm } from './state.js';
import { viewHome, gridHtml } from './views/home.js';
import { viewWord } from './views/word.js';
import { viewNotFound } from './views/not-found.js';
import { viewAbout } from './views/about.js';
import { bindTerminal } from './views/terminal.js';
import { currentWord, copyLink, randomWord } from './actions.js';
import { openPalette, closePalette, isPaletteOpen } from './search/palette.js';
import { openStudio, closeStudio, isStudioOpen } from './share/studio.js';

$('#count').textContent = DICTIONARY.length+' terms';

// ---- router (hash based: #/, #/word/<slug>, #/about)
function route(){
  const h = location.hash.replace(/^#/,'') || '/';
  const parts = h.split('/').filter(Boolean);
  const main = $('#main');
  $$('nav.main a').forEach(a=>a.removeAttribute('aria-current'));
  let html;
  if(!parts.length){ html = viewHome(); $('[data-nav=home]').setAttribute('aria-current','page'); }
  else if(parts[0]==='word' && parts[1] && parts.length===2){
    const w = getWordBySlug(parts[1]);
    html = w ? viewWord(w) : viewNotFound();
  }
  else if(parts[0]==='about' && parts.length===1){ html = viewAbout(); $('[data-nav=about]').setAttribute('aria-current','page'); }
  else html = viewNotFound();
  main.innerHTML = html;
  window.scrollTo(0,0);
  bindTerminal();
}
window.addEventListener('hashchange',route);
window.addEventListener('hashchange',route);

// ---- global interactions
document.addEventListener('click',e=>{
  const cat = e.target.closest('[data-cat]');
  if(cat){
    state.cat = cat.dataset.cat;
    $$('[data-cat]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cat===state.cat));
    $('#grid').innerHTML = gridHtml();
    $('#gh').textContent = (state.cat==='ALL'?'ALL TERMS':state.cat.toUpperCase())+' · A–Z';
    return;
  }
  const gc = e.target.closest('[data-gocat]');
  if(gc){ state.cat = gc.dataset.gocat; return; }
  const a = e.target.closest('[data-act]'); if(!a) return;
  const act = a.dataset.act;
  if(act==='search') openPalette();
  if(act==='random') randomWord(a);
  if(act==='share') openStudio(currentWord());
  if(act==='copylink') copyLink(a);
});
$('#openSearch').addEventListener('click',openPalette);
$('#termToggle').addEventListener('click',()=>{ state.term=!state.term; applyTerm(); route(); });

// ---- global keyboard
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); isStudioOpen()||(isPaletteOpen()?closePalette():openPalette()); return; }
  if(e.key==='/' && !e.metaKey && !e.ctrlKey && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.querySelector('.ov.open')){ e.preventDefault(); openPalette(); return; }
  if(e.key==='Escape'){ if(isPaletteOpen()) closePalette(); else if(isStudioOpen()) closeStudio(); }
  if(e.key==='Tab'){ const ov=document.querySelector('.ov.open'); if(ov){ const f=$$('button,input,a[href]',ov).filter(x=>x.offsetParent!==null&&!x.disabled); if(!f.length) return; const first=f[0],last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();} } }
});

// ---- boot
applyTerm(); route();
