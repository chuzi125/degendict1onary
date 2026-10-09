// Share template: terminal. Self-contained renderer, no schema changes needed.
// render(ctx, width, height, entry, { s: scale, m: margin })
import { F, fit, block, txt, regions, cardDef, attrib } from '../canvas.js';
import { getRelatedWords } from '../../lib/dictionary.js';

export default { name:'Terminal', description:'CLI output', render(c,W,H,e,o){
    const {s,m}=o; c.fillStyle='#060906'; c.fillRect(0,0,W,H);
    const g='#5dff8a', dim='#3d6b47', fg='#e8ffe9';
    c.strokeStyle='#15301b'; c.lineWidth=2*s; c.strokeRect(m/2,m/2,W-m,H-m);
    txt(c,'degen@dictionary ~ %',m,m,{font:`500 ${22*s}px ${F.mono}`,color:dim});
    txt(c,'●●●',W-m,m,{font:`400 ${18*s}px ${F.mono}`,color:'#1f4128',align:'right'});
    const cmd=`> define ${e.term.toLowerCase()}`;
    const cf=fit(c,cmd,{family:F.mono,weight:500,maxW:W-2*m,maxH:90*s,max:34*s,min:20*s,lh:1.3});
    let y=block(c,cf,m,m+70*s,g);
    const R=regions(W,H,m,y+30*s,H-m-120*s);
    const tf=fit(c,e.term,{family:F.mono,weight:700,maxW:R.term.w,maxH:R.term.h-(e.pronunciation?60*s:0),max:220*s,min:44*s,lh:1.02});
    let ty=block(c,tf,R.term.x,R.term.y,fg);
    if(e.pronunciation) txt(c,e.pronunciation,R.term.x,ty+10*s,{font:`400 ${30*s}px ${F.mono}`,color:dim});
    const df=fit(c,cardDef(e),{family:F.mono,weight:400,maxW:R.def.w,maxH:R.def.h,max:40*s,min:20*s,lh:1.4});
    let dy=block(c,df,R.def.x,R.def.y,fg);
    const rel=getRelatedWords(e).slice(0,3).map(r=>r.term.toLowerCase()).join(', ');
    const meta=`category: ${e.categories[0].toLowerCase()}${rel?'  ·  related: '+rel:''}`;
    const mf=fit(c,meta,{family:F.mono,weight:400,maxW:W-2*m,maxH:70*s,max:22*s,min:14*s,lh:1.35});
    block(c,mf,m,H-m-mf.lines.length*mf.size*mf.lh-38*s,dim);
    txt(c,'█',m,H-m,{font:`400 ${22*s}px ${F.mono}`,color:g,base:'bottom'});
    txt(c,attrib(e),W-m,H-m,{font:`400 ${18*s}px ${F.mono}`,color:dim,align:'right',base:'bottom',ls:1*s});
  }};
