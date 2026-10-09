import { DICTIONARY } from '../data/dictionary.js';
import { CATEGORIES } from '../data/categories.js';
import { getWordsByCategory, getFeaturedWord } from '../lib/dictionary.js';
import { esc, serial, ico, pips, setMeta } from '../lib/utils.js';
import { state } from '../state.js';
import { terminalHtml } from './terminal.js';

function cardHtml(w,i){
  return `<a class="card" href="#/word/${esc(w.slug)}" style="animation-delay:${Math.min(i,12)*18}ms">
    <div><div class="t">${esc(w.term)}</div>${w.pronunciation?`<div class="p">${esc(w.pronunciation)}</div>`:''}</div>
    <div class="d">${esc(w.shortDefinition||w.definition)}</div>
    <div class="m"><span class="cap">${esc(w.categories[0])}</span>${w.degenScore?pips(w.degenScore):''}</div>
  </a>`;
}
export function gridHtml(){
  const list = getWordsByCategory(state.cat).slice().sort((a,b)=>a.term.localeCompare(b.term));
  if(!list.length) return `<div class="empty" style="grid-column:1/-1"><b>NOTHING HERE, SER.</b><span>Try another category.</span></div>`;
  return list.map(cardHtml).join('');
}
export function viewHome(){
  setMeta('Degen Dictionary — A field guide to crypto slang','A searchable field guide to crypto and Web3 slang, concepts, memes and culture. '+DICTIONARY.length+' terms and counting.',location.href.split('#')[0]);
  const f = getFeaturedWord();
  const right = state.term
    ? `<div>${terminalHtml(true)}</div>`
    : `<a class="feat" href="#/word/${f.slug}"><span class="cap">WORD OF THE DAY · ${serial(f)}</span><div class="term">${esc(f.term)}</div><div class="pron">${esc(f.pronunciation||'')}</div><p>${esc(f.shortDefinition||f.definition)}</p><div class="row"><span class="cap">${esc(f.categories.join(' / '))}</span><span class="go">OPEN ${ico.arrow}</span></div></a>`;
  return `<div class="wrap"><section class="hero">
    <div>
      <span class="cap">A FIELD GUIDE TO CRYPTO SLANG · ${DICTIONARY.length} TERMS</span>
      <h1>Learn the words. <em>Sound</em> like you knew.</h1>
      <p class="lead">Slang, concepts and memes from the trenches, defined without the padding. Open one, follow the trail, then make it a card.</p>
      <button class="searchbar" data-act="search">${ico.search}<span>Search a word, alias or meaning</span><kbd>⌘K</kbd></button>
      <div class="hero-actions"><button class="btn go" data-act="random" id="randBtn">${ico.shuffle}I'M FEELING DEGEN</button></div>
    </div>
    ${right}
  </section></div>
  <div class="filters"><div class="scroll" role="group" aria-label="Filter by category">
    ${['ALL',...CATEGORIES].map(c=>`<button class="chip" data-cat="${c}" aria-pressed="${state.cat===c}">${c}<small>${getWordsByCategory(c).length}</small></button>`).join('')}
  </div></div>
  <div class="wrap"><div class="gridhead"><span class="cap" id="gh">${state.cat==='ALL'?'ALL TERMS':state.cat.toUpperCase()} · A–Z</span></div><div class="grid" id="grid">${gridHtml()}</div></div>`;
}
