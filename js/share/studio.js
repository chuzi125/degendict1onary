import { getRelatedWords } from '../lib/dictionary.js';
import { $, $$, ico, wordUrl } from '../lib/utils.js';
import { TEMPLATES } from './templates/index.js';
import { FORMATS } from './formats.js';

const studioOv=$('#studioOv'), cv=$('#cv'), stage=$('#stage'), shStatus=$('#shStatus');
const sh = { entry:null, tpl:'editorial', fmt:'portrait', token:0, prev:null };
const canClipImg = !!(navigator.clipboard && window.ClipboardItem);
function status(msg,err){ shStatus.textContent=msg||''; shStatus.classList.toggle('err',!!err); if(msg) setTimeout(()=>{ if(shStatus.textContent===msg) shStatus.textContent=''; },2600); }
export function openStudio(e){
  if(!e) return; sh.entry=e; sh.prev=document.activeElement;
  studioOv.classList.add('open'); document.body.style.overflow='hidden';
  buildStudioControls(); renderCard(); $('#tplOpts button').focus();
}
export function closeStudio(){
  studioOv.classList.remove('open'); document.body.style.overflow='';
  if(sh.prev&&sh.prev.focus) sh.prev.focus();
}
$('#studioClose').addEventListener('click',closeStudio);
studioOv.addEventListener('mousedown',e=>{ if(e.target===studioOv) closeStudio(); });
function buildStudioControls(){
  $('#tplOpts').innerHTML = Object.entries(TEMPLATES).map(([id,t])=>`<button class="opt" data-tpl="${id}" aria-pressed="${sh.tpl===id}"><b>${t.name}</b><small>${t.description}</small></button>`).join('');
  $('#fmtOpts').innerHTML = Object.entries(FORMATS).map(([id,f])=>`<button class="opt" data-fmt="${id}" aria-pressed="${sh.fmt===id}"><b>${f.name}</b><small>${f.note}</small></button>`).join('');
  $('#shareActs').innerHTML = `
    <button class="btn primary" data-sh="dl">${ico.dl}DOWNLOAD PNG</button>
    ${canClipImg?`<button class="btn" data-sh="copyimg">${ico.img}COPY IMAGE</button>`:''}
    ${navigator.share?`<button class="btn" data-sh="native">${ico.share}SHARE</button>`:''}
    <button class="btn" data-sh="link">${ico.copy}COPY LINK</button>
    <button class="btn" data-sh="remix">${ico.remix}REMIX</button>`;
}
$('.studio').addEventListener('click',e=>{
  const t=e.target.closest('[data-tpl]'); if(t){ sh.tpl=t.dataset.tpl; $$('[data-tpl]').forEach(b=>b.setAttribute('aria-pressed',b===t)); renderCard(); return; }
  const f=e.target.closest('[data-fmt]'); if(f){ sh.fmt=f.dataset.fmt; $$('[data-fmt]').forEach(b=>b.setAttribute('aria-pressed',b===f)); renderCard(); return; }
  const a=e.target.closest('[data-sh]'); if(a) shareAct(a.dataset.sh,a);
});
async function loadFonts(e){
  const s=e.term+' '+e.definition;
  try{ await Promise.race([Promise.all(['400 40px "Instrument Serif"','italic 400 40px "Instrument Serif"','500 40px "Space Grotesk"','700 40px "Space Grotesk"','400 40px Inter','400 40px "JetBrains Mono"','500 40px "JetBrains Mono"','700 40px "JetBrains Mono"'].map(f=>document.fonts.load(f,s))),new Promise(r=>setTimeout(r,2500))]); }catch(err){}
}
async function renderCard(){
  const tok=++sh.token, e=sh.entry, F0=FORMATS[sh.fmt];
  stage.classList.add('load');
  await loadFonts(e);
  if(tok!==sh.token) return;
  try{
    cv.width=F0.w; cv.height=F0.h;
    const c=cv.getContext('2d'); c.clearRect(0,0,F0.w,F0.h);
    const s=Math.min(F0.w,F0.h)/1080;
    TEMPLATES[sh.tpl].render(c,F0.w,F0.h,e,{s,m:76*s});
    cv.setAttribute('aria-label',`${TEMPLATES[sh.tpl].name} share card for ${e.term}: ${e.definition}`);
  }catch(err){ console.error(err); status("Couldn't draw this card. Try another template.",true); }
  stage.classList.remove('load');
}
const toBlob = () => new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error('blob')),'image/png'));
const fname = () => `degen-dictionary-${sh.entry.slug}-${sh.tpl}-${sh.fmt}.png`;
async function shareAct(kind,btn){
  const e=sh.entry;
  try{
    if(kind==='dl'){
      const b=await toBlob(); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=fname(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); status('Saved. Go post it.');
    } else if(kind==='copyimg'){
      const b=await toBlob(); await navigator.clipboard.write([new ClipboardItem({'image/png':b})]); status('Image copied.');
    } else if(kind==='native'){
      const b=await toBlob(); const file=new File([b],fname(),{type:'image/png'});
      const data={title:`${e.term} — Degen Dictionary`,text:`${e.term}: ${e.definition}`,url:wordUrl(e)};
      if(navigator.canShare && navigator.canShare({files:[file]})) data.files=[file];
      await navigator.share(data);
    } else if(kind==='link'){
      const url=wordUrl(e);
      if(navigator.clipboard&&window.isSecureContext) await navigator.clipboard.writeText(url);
      else { const t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); const ok=document.execCommand('copy'); t.remove(); if(!ok) throw 0; }
      status('Link copied.');
    } else if(kind==='remix'){
      const ids=Object.keys(TEMPLATES).filter(i=>i!==sh.tpl); sh.tpl=ids[Math.floor(Math.random()*ids.length)];
      $$('[data-tpl]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tpl===sh.tpl)); renderCard();
    }
  }catch(err){
    if(err && err.name==='AbortError') return;
    status(kind==='copyimg'?"Clipboard said no. Download it instead.":kind==='link'?"Couldn't copy. Select the URL from the address bar.":"That didn't work. Try again.",true);
  }
}

export const isStudioOpen = () => studioOv.classList.contains('open');
