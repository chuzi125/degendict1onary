import { getRelatedWords } from '../lib/dictionary.js';
import { esc, serial, ico, pips, setMeta, wordUrl } from '../lib/utils.js';
import { state } from '../state.js';
import { terminalHtml } from './terminal.js';

export function viewWord(w){
  const rel = getRelatedWords(w);
  const desc = `What does ${w.term} mean? ${w.definition}`;
  setMeta(`${w.term} — Degen Dictionary`,desc,wordUrl(w));
  return `<div class="wrap">
    <a class="back" href="#/">${ico.back}DICTIONARY <span style="color:var(--dim)">/ ${esc(w.term)}</span></a>
    <article class="wordhead">
      <span class="cap">ENTRY ${serial(w)}${w.rarity?' · '+esc(w.rarity).toUpperCase():''}</span>
      <h1>${esc(w.term)}</h1>
      ${w.pronunciation?`<div class="pron">${esc(w.pronunciation)}</div>`:''}
      <p class="def">${esc(w.definition)}</p>
      <div class="metarow">
        ${w.categories.map(c=>`<a class="tag" href="#/" data-gocat="${esc(c)}">${esc(c)}</a>`).join('')}
        ${w.degenScore?`<span class="score">DEGEN SCORE ${pips(w.degenScore)}<b>${w.degenScore}/10</b></span>`:''}
      </div>
      <div class="actions">
        <button class="btn primary" data-act="share">${ico.share}SHARE THIS DEGEN</button>
        <button class="btn" data-act="copylink" id="copyLinkBtn">${ico.copy}COPY LINK</button>
        <button class="btn" data-act="random">${ico.shuffle}I'M FEELING DEGEN</button>
      </div>
      ${state.term?`<div class="wtm">${terminalHtml(false,w)}</div>`:''}
    </article>
    <div class="cols">
      <div>
        ${w.examples&&w.examples.length?`<section class="sec"><h2 class="cap">IN THE WILD</h2>${w.examples.map(x=>`<div class="ex"><q>${esc(x.text)}</q>${x.attribution?`<cite>— ${esc(x.attribution)}</cite>`:''}</div>`).join('')}</section>`:''}
        ${w.origin?`<section class="sec"><h2 class="cap">ORIGIN</h2><p class="ctx">${esc(w.origin)}</p></section>`:''}
        ${w.context?`<section class="sec"><h2 class="cap">CONTEXT</h2><p class="ctx">${esc(w.context)}</p></section>`:''}
        ${w.aliases&&w.aliases.length?`<section class="sec"><h2 class="cap">ALSO WRITTEN AS</h2><div class="metarow" style="margin:0">${w.aliases.map(a=>`<span class="tag">${esc(a)}</span>`).join('')}</div></section>`:''}
      </div>
      <aside>${rel.length?`<section class="sec"><h2 class="cap">RELATED</h2><div class="rel">${rel.map(r=>`<a href="#/word/${esc(r.slug)}"><b>${esc(r.term)}</b><span>${esc(r.shortDefinition||r.definition)}</span></a>`).join('')}</div></section>`:''}</aside>
    </div>
  </div>`;
}
