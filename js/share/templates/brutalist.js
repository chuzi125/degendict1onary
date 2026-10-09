// Share template: brutalist. Self-contained renderer, no schema changes needed.
// render(ctx, width, height, entry, { s: scale, m: margin })
import { F, fit, block, txt, cardDef, attrib } from '../canvas.js';
import { serial } from '../../lib/utils.js';

export default { name:'Brutalist', description:'Loud', render(c,W,H,e,o){
    const {s,m}=o; c.fillStyle='#ffe600'; c.fillRect(0,0,W,H);
    const k='#0a0a0a';
    txt(c,e.categories[0].toUpperCase()+' /',m,m*.8,{font:`700 ${22*s}px ${F.mono}`,color:k,ls:3*s});
    txt(c,serial(e),W-m,m*.8,{font:`700 ${22*s}px ${F.mono}`,color:k,align:'right',ls:3*s});
    const wide=W/H>1.5;
    const top=m*.8+56*s;
    if(!wide){
      const th=(H-top)*.46;
      const tf=fit(c,e.term.toUpperCase(),{family:F.disp,weight:700,maxW:W-2*m,maxH:th,max:420*s,min:56*s,lh:.88});
      block(c,tf,m-6*s,top,k);
      const by=top+th+m*.3, bx=m*2.4;
      c.fillStyle=k; c.fillRect(bx,by,W-bx,H-by-m*1.15);
      const df=fit(c,cardDef(e),{family:F.disp,weight:500,maxW:W-bx-2*m*.8,maxH:H-by-m*1.15-m*1.2,max:52*s,min:24*s,lh:1.22});
      block(c,df,bx+m*.8,by+m*.7,'#ffe600');
    } else {
      const tw=(W-2*m)*.56;
      const tf=fit(c,e.term.toUpperCase(),{family:F.disp,weight:700,maxW:tw,maxH:H-top-m*1.6,max:400*s,min:56*s,lh:.88});
      block(c,tf,m-6*s,top,k);
      const bx=m+tw+m*.4, by=top+m*.9;
      c.fillStyle=k; c.fillRect(bx,by,W-bx,H-by-m*1.15);
      const df=fit(c,cardDef(e),{family:F.disp,weight:500,maxW:W-bx-m*1.6,maxH:H-by-m*1.15-m*1.4,max:44*s,min:20*s,lh:1.22});
      block(c,df,bx+m*.8,by+m*.7,'#ffe600');
    }
    txt(c,attrib(e),m,H-m*.7,{font:`700 ${18*s}px ${F.mono}`,color:k,base:'bottom',ls:1*s});
    txt(c,'NOT FINANCIAL ADVICE',W-m,H-m*.7,{font:`500 ${16*s}px ${F.mono}`,color:k,align:'right',base:'bottom',ls:2*s});
  }};
