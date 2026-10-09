import { setMeta } from '../lib/utils.js';

export function viewAbout(){
  setMeta('About — Degen Dictionary','Why this dictionary exists and how to read it.',location.href);
  return `<div class="wrap"><div class="prose"><span class="cap">ABOUT</span><h1>A field guide, not a glossary.</h1>
  <p>Crypto has its own language, and it moves faster than any textbook. Degen Dictionary keeps a running record of the words people actually use, with short definitions, real-sounding examples and the honest version of where each term came from.</p>
  <p>Every entry links to the words around it, so one lookup turns into ten. Every entry can become a card you can post.</p>
  <p class="note">Where a term's origin is uncertain, we say so. The degen score is a joke: a vibes-based number for fun, not a measure of risk and not financial advice.</p>
  <div style="margin-top:28px"><a class="btn primary" href="#/">OPEN THE DICTIONARY</a></div></div></div>`;
}
