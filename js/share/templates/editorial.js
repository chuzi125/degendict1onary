// Share template: editorial. Self-contained renderer, no schema changes needed.
// render(ctx, width, height, entry, { s: scale, m: margin })
import { F, fit, block, txt, regions, cardDef, attrib } from '../canvas.js';
import { serial } from '../../lib/utils.js';

export default { name:'Editorial', description:'Dictionary page', render(c,W,H,e,o){
    const {s,m}=o; c.fillStyle='#f2eee4'; c.fillRect(0,0,W,H);
    const ink='#15130f', mute='#7b7568';
    txt(c,e.categories.join(' · ').toUpperCase(),m,m,{font:`500 ${20*s}px ${F.mono}`,color:mute,ls:3*s});
    txt(c,'№ '+serial(e),W-m,m,{font:`500 ${20*s}px ${F.mono}`,color:mute,align:'right',ls:3*s});
    c.fillStyle=ink; c.fillRect(m,m+44*s,W-2*m,2*s);
    const R=regions(W,H,m,m+96*s,H-m-70*s);
    const tf=fit(c,e.term,{family:F.serif,weight:400,maxW:R.term.w,maxH:R.term.h-(e.pronunciation?60*s:0),max:320*s,min:54*s,lh:.98});
    let y=block(c,tf,R.term.x,R.term.y,ink);
    if(e.pronunciation) txt(c,e.pronunciation,R.term.x,y+14*s,{font:`italic 400 ${34*s}px ${F.serif}`,color:mute});
    const df=fit(c,cardDef(e),{family:F.sans,weight:400,maxW:R.def.w,maxH:R.def.h,max:R.wide?46*s:52*s,min:24*s,lh:1.32});
    block(c,df,R.def.x,R.def.y+(R.wide?10*s:0),ink);
    c.fillStyle=ink; c.fillRect(m,H-m-40*s,W-2*m,1*s);
    txt(c,attrib(e),m,H-m,{font:`400 ${18*s}px ${F.mono}`,color:mute,base:'bottom',ls:1*s});
    txt(c,'a field guide to crypto slang',W-m,H-m,{font:`italic 400 ${24*s}px ${F.serif}`,color:mute,align:'right',base:'bottom'});
  }};
