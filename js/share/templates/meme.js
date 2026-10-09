// Share template: meme. Self-contained renderer, no schema changes needed.
// render(ctx, width, height, entry, { s: scale, m: margin })
import { F, fit, block, txt, cardDef, attrib } from '../canvas.js';

export default { name:'Meme', description:'Playful', render(c,W,H,e,o){
    const {s,m}=o; c.fillStyle='#2340ff'; c.fillRect(0,0,W,H);
    c.fillStyle='rgba(255,255,255,.07)'; for(let i=0;i<W;i+=40*s) for(let j=0;j<H;j+=40*s){ c.fillRect(i,j,3*s,3*s); }
    const wide=W/H>1.5; const cw=W-2*m;
    // sticker
    const stW=wide?cw*.6:cw*.94, stH=wide?H*.48:H*.24;
    const tf=fit(c,e.term.toUpperCase(),{family:F.disp,weight:700,maxW:stW-70*s,maxH:stH-56*s,max:230*s,min:44*s,lh:1});
    const th=tf.lines.length*tf.size*tf.lh;
    const bw=Math.min(stW,Math.max(...tf.lines.map(l=>{c.font=`700 ${tf.size}px ${F.disp}`;return c.measureText(l).width}))+70*s), bh=th+56*s;
    c.save(); c.translate(m+8*s,m+bh/2+10*s); c.rotate(-.035);
    c.fillStyle='#000'; c.fillRect(-6*s+10*s,-bh/2+10*s,bw,bh);
    c.fillStyle='#ffe600'; c.fillRect(-6*s,-bh/2,bw,bh);
    c.strokeStyle='#000'; c.lineWidth=4*s; c.strokeRect(-6*s,-bh/2,bw,bh);
    block(c,tf,-6*s+35*s,-bh/2+28*s,'#000');
    c.restore();
    let y=m+bh+50*s; const ex=(e.examples&&e.examples[0]);
    const left=wide?m:m, boxW=wide?cw*.6:cw;
    if(e.pronunciation){ txt(c,e.pronunciation,m,y,{font:`400 ${30*s}px ${F.mono}`,color:'rgba(255,255,255,.75)'}); y+=54*s; }
    const areaBot=H-m-60*s;
    const def=fit(c,cardDef(e),{family:F.disp,weight:500,maxW:boxW,maxH:(areaBot-y)*(ex?.5:1),max:50*s,min:22*s,lh:1.25});
    y=block(c,def,left,y,'#fff');
    if(ex){
      y+=34*s; const q='“'+ex.text+'”'; const bx=wide?m+cw*.64:m, bwid=wide?cw*.36:cw;
      const by0=wide?m+20*s:y, bmax=wide?H-m-100*s-by0:areaBot-y;
      const qf=fit(c,q,{family:F.mono,weight:500,maxW:bwid-56*s,maxH:bmax-56*s,max:34*s,min:16*s,lh:1.4});
      const qh=qf.lines.length*qf.size*qf.lh+56*s;
      c.fillStyle='#fff'; c.beginPath(); c.roundRect(bx,by0,bwid,qh,12*s); c.fill();
      block(c,qf,bx+28*s,by0+28*s,'#0a0a0a');
    }
    txt(c,attrib(e),m,H-m,{font:`500 ${18*s}px ${F.mono}`,color:'rgba(255,255,255,.75)',base:'bottom',ls:1*s});
    txt(c,'wagmi (probably)',W-m,H-m,{font:`400 ${16*s}px ${F.mono}`,color:'rgba(255,255,255,.5)',align:'right',base:'bottom'});
  }};
