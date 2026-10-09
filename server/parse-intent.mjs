// PARSE-INTENT — turns the text of a tweet into {word, template, format}.
//
// This has nothing to do with X's API. It's a pure function: text in, structured
// intent out. Whatever eventually hands you the tweet text (a paid API tier, an
// automation platform's "new mention" trigger, a manual paste for testing) feeds
// its text through here.
//
// Usage:
//   import { parseIntent } from './parse-intent.mjs';
//   const intent = parseIntent('@degendictionary rekt as a trading card please');
//   // { word: <dictionary entry for REKT>, template: 'card', format: 'square', ... }

import { DICTIONARY } from '../js/data/dictionary.js';
import { searchWords } from '../js/lib/dictionary.js';

const TEMPLATE_ALIASES = {
  editorial: ['editorial', 'dictionary page', 'magazine', 'classic'],
  terminal: ['terminal', 'cli', 'command line', 'console'],
  card: ['trading card', 'tradingcard', 'collectible', 'collector card', 'card'],
  brutalist: ['brutalist', 'brutal', 'loud'],
  meme: ['meme', 'memes', 'playful', 'funny'],
};
const FORMAT_ALIASES = {
  portrait: ['portrait', '1080x1350', '1080×1350', 'story', 'tall'],
  square: ['square', '1080x1080', '1080×1080', 'ig post'],
  landscape: ['landscape', '1920x1080', '1920×1080', 'wide', 'horizontal'],
};
const DEFAULT_TEMPLATE = 'editorial';
const DEFAULT_FORMAT = 'square'; // safest uncropped preview in most reply/timeline contexts

// Filler the person types around the actual request. Stripped only after
// template/format phrases are pulled out, so "trading card" etc. are matched first.
const FILLER = [
  'please','pls','plz','can you','could you','would you','give me','make me',
  'show me','i want','gimme','do','as a','as an','in','style','mode','version',
  'the','a','an','for','me','my','of','pic','picture','image','card for','one',
];

function stripHandlesAndLinks(text){
  return String(text||'')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/@\w+/g, ' ');
}

function extractFirstAlias(text, aliasMap){
  // Longest phrases first, so "trading card" matches before bare "card".
  const flat = Object.entries(aliasMap)
    .flatMap(([id, phrases]) => phrases.map(p => ({ id, phrase: p })))
    .sort((a,b) => b.phrase.length - a.phrase.length);
  const lower = text.toLowerCase();
  for (const { id, phrase } of flat) {
    const re = new RegExp('(^|[^a-z0-9])' + phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '($|[^a-z0-9])', 'i');
    const m = lower.match(re);
    if (m) {
      const start = m.index + (m[1] ? m[1].length : 0);
      const cleaned = text.slice(0, start) + ' ' + text.slice(start + phrase.length);
      return { id, remaining: cleaned };
    }
  }
  return { id: null, remaining: text };
}

function stripFiller(text){
  let out = ' ' + text.toLowerCase() + ' ';
  // longest filler phrases first so "trading card for" doesn't leave stray words
  const sorted = [...FILLER].sort((a,b)=>b.length-a.length);
  for (const f of sorted) {
    out = out.replace(new RegExp('(^|\\s)'+f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s|$)','gi'), ' ');
  }
  return out.replace(/\s+/g,' ').trim();
}

// One text, searched loosely as a whole and then, if that fails, by strict
// 1-3 word windows. Loose-whole-text first because it's the richest signal;
// windows are a strict fallback since a short coincidental phrase match in
// open-ended prose is a real risk (a plain phrase like "so useful" could
// otherwise reconstruct an alias like "so back" by coincidence).
function searchLayered(text){
  let results = searchWords(text);
  if (results.length) return results[0];
  const tokens = text.split(/\s+/).filter(Boolean);
  for (let size = Math.min(3, tokens.length); size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const phrase = tokens.slice(i, i+size).join(' ');
      results = searchWords(phrase, { minScore: 55, minSubstringLen: 5 });
      if (results.length) return results[0];
    }
  }
  return null;
}

function findBestWord(preFillerText, fillerStrippedText, originalText){
  // Try the text *before* filler words are stripped first: stripping words
  // like "the" or "a" helps separate a term from request scaffolding, but
  // can just as easily break a multi-word term that legitimately contains
  // one ("BUY THE DIP" -> stripping "the" leaves "buy dip", which matches
  // nothing). Only fall back to the stripped version if the fuller text
  // didn't match anything on its own, then to the raw original as a last resort.
  return searchLayered(preFillerText)
    || searchLayered(fillerStrippedText)
    || searchWords(originalText, { minScore: 55, minSubstringLen: 5 })[0]
    || null;
}

/**
 * @param {string} text - the tweet text (including your handle, e.g. from a mention)
 * @returns {{ word: object|null, template: string, format: string, matchedPhrase: string|null, raw: string }}
 */
export function parseIntent(text){
  const raw = String(text || '');
  let working = stripHandlesAndLinks(raw);

  const tpl = extractFirstAlias(working, TEMPLATE_ALIASES);
  working = tpl.remaining;
  const fmt = extractFirstAlias(working, FORMAT_ALIASES);
  working = fmt.remaining;

  const candidate = stripFiller(working);
  const word = findBestWord(working.trim(), candidate, stripHandlesAndLinks(raw));

  return {
    word,
    template: tpl.id || DEFAULT_TEMPLATE,
    format: fmt.id || DEFAULT_FORMAT,
    matchedPhrase: candidate || null,
    raw,
  };
}

/** For CLI testing: node server/parse-intent.mjs "<tweet text>" */
if (import.meta.url === `file://${process.argv[1]}`) {
  const text = process.argv.slice(2).join(' ');
  if (!text) { console.log('usage: node server/parse-intent.mjs "@degendictionary rekt as a trading card"'); process.exit(1); }
  const r = parseIntent(text);
  console.log(JSON.stringify({
    word: r.word ? r.word.slug : null,
    template: r.template,
    format: r.format,
    matchedPhrase: r.matchedPhrase,
  }, null, 2));
}
