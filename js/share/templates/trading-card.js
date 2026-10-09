// Share template: card. Self-contained renderer, no schema changes needed.
// render(ctx, width, height, entry, { s: scale, m: margin })
import { F, fit, block, txt, regions, cardDef, attrib } from '../canvas.js';

export default { name:'Trading Card', description:'Collectible', render(c,W,H,e,o){
    const {s,m}=o; c.fillStyle='#08080a'; c.fillRect(0,0,W,H);
    const p=m*.55, x=p, y=p, w=W-2*p, h=H-2*p;
    c.fillStyle='#111114'; c.beginPath(); c.roundRect(x,y,w,h,18*s); c.fill();
    c.strokeStyle='#33333a'; c.lineWidth=2*s; c.stroke();
    c.save(); c.beginPath(); c.roundRect(x,y,w,h,18*s); c.clip();
    c.strokeStyle='rgba(255,255,255,.035)'; c.lineWidth=1*s;
    for(let i=-H;i<W+H;i+=28*s){ c.beginPath(); c.moveTo(i,0); c.lineTo(i-H*.6,H); c.stroke(); }
    c.restore();
    const ix=x+m*.6, iw=w-m*1.2;
    // header
    const cat=e.categories[0].toUpperCase();
    c.font=`700 ${20*s}px ${F.mono}`; const cw=c.measureText(cat).width+28*s;
    c.fillStyle='#22c55e'; c.fillRect(ix,y+m*.55,cw,40*s);
    txt(c,cat,ix+14*s,y+m*.55+20*s,{font:`700 ${20*s}px ${F.mono}`,color:'#04150a',base:'middle',ls:2*s});
    txt(c,(e.rarity||'Common').toUpperCase(),ix+iw,y+m*.55+20*s,{font:`500 ${20*s}px ${F.mono}`,color:'#facc15',align:'right',base:'middle',ls:3*s});
    const top=y+m*.55+90*s, bot=y+h-m*.6-110*s;
    const R=regions(W,H,0,top,bot);
    const tx=ix, tw=R.wide?(iw*.48):iw, dx=R.wide?ix+iw*.53:ix, dw=R.wide?iw*.47:iw;
    const th=R.wide?bot-top:(bot-top)*.44;
    const tf=fit(c,e.term,{family:F.mono,weight:700,maxW:tw,maxH:th-(e.pronunciation?56*s:0),max:230*s,min:44*s,lh:1.02});
    let ty=block(c,tf,tx,top,'#f2f2f2');
    if(e.pronunciation) txt(c,e.pronunciation,tx,ty+10*s,{font:`400 ${30*s}px ${F.mono}`,color:'#7a7a84'});
    const dy=R.wide?top:top+th+(bot-top)*.05, dh=R.wide?bot-top:(bot-top)-th-(bot-top)*.05;
    c.fillStyle='#2a2a30'; if(!R.wide) c.fillRect(ix,dy-12*s,iw,2*s);
    const df=fit(c,cardDef(e),{family:F.sans,weight:400,maxW:dw,maxH:dh,max:44*s,min:22*s,lh:1.34});
    block(c,df,dx,dy,'#cfcfd6');
    // score
    const sy=y+h-m*.6-64*s, sc=e.degenScore||0;
    txt(c,'DEGEN SCORE',ix,sy,{font:`500 ${18*s}px ${F.mono}`,color:'#7a7a84',ls:2*s});
    const bw=Math.min(28*s,(iw*.55-9*4*s)/10);
    for(let i=0;i<10;i++){ c.fillStyle=i<sc?(sc>=8?'#facc15':'#22c55e'):'#2a2a30'; c.fillRect(ix+i*(bw+4*s),sy+30*s,bw,22*s); }
    txt(c,sc?sc+'/10':'—',ix+10*(bw+4*s)+10*s,sy+41*s,{font:`700 ${22*s}px ${F.mono}`,color:'#f2f2f2',base:'middle'});
    txt(c,attrib(e),ix+iw,y+h-m*.6,{font:`400 ${17*s}px ${F.mono}`,color:'#5a5a64',align:'right',base:'bottom',ls:1*s});
  }};
