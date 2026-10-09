import { getWordIndex } from './dictionary.js';

export const $ = (s,el=document) => el.querySelector(s);
export const $$ = (s,el=document) => [...el.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function hi(text,q){
  const t = String(text); if(!q) return esc(t);
  const i = t.toLowerCase().indexOf(q.toLowerCase().trim());
  if(i<0 || !q.trim()) return esc(t);
  const n = q.trim().length;
  return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+n))+'</mark>'+esc(t.slice(i+n));
}
export const serial = w => String(getWordIndex(w)+1).padStart(3,'0');
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ico = {
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  share:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="1"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  dl:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  img:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/></svg>',
  remix:'<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>'
};
export const pips = (n=0) => `<span class="pips ${n>=8?'hot':''}" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;

export function setMeta(title,desc,url){
  document.title = title;
  const set = (sel,attr,val,make) => { let el=$(sel); if(!el){ el=document.createElement(make.tag); Object.entries(make.attrs).forEach(([k,v])=>el.setAttribute(k,v)); document.head.appendChild(el);} el.setAttribute(attr,val); };
  set('meta[name=description]','content',desc,{tag:'meta',attrs:{name:'description'}});
  set('meta[property="og:title"]','content',title,{tag:'meta',attrs:{property:'og:title'}});
  set('meta[property="og:description"]','content',desc,{tag:'meta',attrs:{property:'og:description'}});
  set('meta[property="og:url"]','content',url,{tag:'meta',attrs:{property:'og:url'}});
  set('meta[name="twitter:title"]','content',title,{tag:'meta',attrs:{name:'twitter:title'}});
  set('meta[name="twitter:description"]','content',desc,{tag:'meta',attrs:{name:'twitter:description'}});
  set('link[rel=canonical]','href',url,{tag:'link',attrs:{rel:'canonical'}});
}
export const wordUrl = w => location.href.split('#')[0] + '#/word/' + w.slug;
