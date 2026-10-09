// Shared drawing primitives for share cards.
import { serial } from '../lib/utils.js';

export const F = {
  mono:'"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  sans:'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  disp:'"Space Grotesk", Inter, system-ui, sans-serif',
  serif:'"Instrument Serif", Georgia, "Times New Roman", serif'
};
export function wrapLines(c,text,maxW){
  const words = String(text).split(/\s+/).filter(Boolean); const lines=[]; let cur='', broke=false;
  for(const w of words){
    const t = cur? cur+' '+w : w;
    if(c.measureText(t).width<=maxW){ cur=t; continue; }
    if(cur){ lines.push(cur); cur=''; }
    if(c.measureText(w).width<=maxW){ cur=w; continue; }
    broke=true; let chunk='';
    for(const ch of Array.from(w)){ if(c.measureText(chunk+ch).width>maxW && chunk){ lines.push(chunk); chunk=ch; } else chunk+=ch; }
    cur=chunk;
  }
  if(cur) lines.push(cur);
  return {lines,broke};
}
export function fit(c,text,{family,weight=400,style='',maxW,maxH,max,min,lh=1.2}){
  let size=Math.round(max), r;
  for(; size>=min; size-=2){
    c.font=`${style} ${weight} ${size}px ${family}`.trim();
    r=wrapLines(c,text,maxW);
    if(!r.broke && r.lines.length*size*lh<=maxH) return {size,lines:r.lines,family,weight,style,lh};
  }
  size=Math.round(min); c.font=`${style} ${weight} ${size}px ${family}`.trim();
  r=wrapLines(c,text,maxW);
  let lines=r.lines; const n=Math.max(1,Math.floor(maxH/(size*lh)));
  if(lines.length>n){
    lines=lines.slice(0,n); let last=lines[n-1];
    while(last.length>1 && c.measureText(last+'…').width>maxW) last=last.slice(0,-1);
    lines[n-1]=last.trimEnd()+'…';
  }
  return {size,lines,family,weight,style,lh};
}
export function block(c,f,x,y,color,align='left'){
  c.font=`${f.style} ${f.weight} ${f.size}px ${f.family}`.trim(); c.fillStyle=color; c.textAlign=align; c.textBaseline='top';
  f.lines.forEach((l,i)=>c.fillText(l,x,y+i*f.size*f.lh));
  return y+f.lines.length*f.size*f.lh;
}
export function txt(c,s,x,y,{font,color,align='left',base='top',ls=0}){
  c.font=font; c.fillStyle=color; c.textAlign=align; c.textBaseline=base;
  if('letterSpacing' in c) c.letterSpacing=ls+'px';
  c.fillText(s,x,y);
  if('letterSpacing' in c) c.letterSpacing='0px';
}
export function regions(W,H,m,top,bot){
  const wide=W/H>1.5, cw=W-2*m;
  if(wide){ const tw=cw*.48, gap=cw*.05; return {wide,term:{x:m,y:top,w:tw,h:bot-top},def:{x:m+tw+gap,y:top,w:cw-tw-gap,h:bot-top}}; }
  const h=bot-top, th=h*.44, gap=h*.05;
  return {wide,term:{x:m,y:top,w:cw,h:th},def:{x:m,y:top+th+gap,w:cw,h:h-th-gap}};
}
export const cardDef = e => e.definition;
export const attrib = (e) => `degen dictionary · ${serial(e)}`;
