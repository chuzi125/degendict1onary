import { DICTIONARY } from '../data/dictionary.js';
import { searchWords } from '../lib/dictionary.js';
import { $, $$, esc, hi } from '../lib/utils.js';

const pal = $('#pal'), palIn = $('#palIn'), palList = $('#palList');
let palItems=[], palIdx=0, palPrev=null;
export function openPalette(){
  if(pal.classList.contains('open')) return;
  palPrev = document.activeElement; pal.classList.add('open'); document.body.style.overflow='hidden';
  palIn.value=''; renderPal(); palIn.focus();
}
export function closePalette(){
  if(!pal.classList.contains('open')) return;
  pal.classList.remove('open'); document.body.style.overflow='';
  if(palPrev && palPrev.focus) palPrev.focus();
}
function renderPal(){
  const q = palIn.value;
  const trending = () => DICTIONARY.slice().sort((a,b)=>(b.degenScore||0)-(a.degenScore||0)).slice(0,8);
  palItems = q.trim() ? searchWords(q).slice(0,40) : trending();
  palIdx = 0;
  if(!palItems.length){
    palList.innerHTML = `<li role="presentation" style="cursor:default"><div class="empty" style="width:100%"><b>NOTHING HERE, SER.</b><span>Try another word.</span></div></li>`;
    palIn.removeAttribute('aria-activedescendant'); return;
  }
  palList.innerHTML = (q.trim()?'':`<li role="presentation" class="lh cap" style="cursor:default;display:block">TRENDING</li>`) + palItems.map((w,i)=>
    `<li role="option" id="po${i}" data-i="${i}" aria-selected="${i===0}"><b>${hi(w.term,q)}</b><span>${hi(w.shortDefinition||w.definition,q)}</span><em>${esc(w.categories[0])}</em></li>`).join('');
  palIn.setAttribute('aria-activedescendant','po0');
}
function setPalIdx(i){
  if(!palItems.length) return;
  palIdx = (i+palItems.length)%palItems.length;
  $$('#palList [role=option]').forEach((li,k)=>li.setAttribute('aria-selected',k===palIdx));
  const el=$('#po'+palIdx); palIn.setAttribute('aria-activedescendant','po'+palIdx); el&&el.scrollIntoView({block:'nearest'});
}
function openPalItem(i){ const w=palItems[i]; if(!w) return; closePalette(); location.hash='#/word/'+w.slug; }
palIn.addEventListener('input',renderPal);
palIn.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){ e.preventDefault(); setPalIdx(palIdx+1); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); setPalIdx(palIdx-1); }
  else if(e.key==='Enter'){ e.preventDefault(); openPalItem(palIdx); }
});
palList.addEventListener('click',e=>{ const li=e.target.closest('[role=option]'); if(li) openPalItem(+li.dataset.i); });
palList.addEventListener('mousemove',e=>{ const li=e.target.closest('[role=option]'); if(li && +li.dataset.i!==palIdx) setPalIdx(+li.dataset.i); });
pal.addEventListener('mousedown',e=>{ if(e.target===pal) closePalette(); });

export const isPaletteOpen = () => pal.classList.contains('open');
