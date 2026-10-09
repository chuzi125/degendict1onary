// node server/parse-intent.test.mjs
import { parseIntent } from './parse-intent.mjs';

const cases = [
  // [tweet text, expected word slug (or null), expected template, expected format]
  ['@degendictionary wagmi', 'wagmi', 'editorial', 'square'],
  ['@degendictionary rekt as a trading card please', 'rekt', 'card', 'square'],
  ['@degendictionary give me ngmi as a brutalist landscape', 'ngmi', 'brutalist', 'landscape'],
  ['@degendictionary terminal gm portrait', 'gm', 'terminal', 'portrait'],
  ['@degendictionary what does fomo mean, meme style pls', 'fomo', 'meme', 'square'],
  ['hey @degendictionary can you do exit liquidity as a trading card?', 'exit-liquidity', 'card', 'square'],
  ['@degendictionary square cope', 'cope', 'editorial', 'square'],
  ['@degendictionary diamond hands card', 'diamond-hands', 'card', 'square'],
  ['@degendictionary DYOR meme landscape 1920x1080', 'dyor', 'meme', 'landscape'],
  ['@degendictionary paper hands please, terminal style, portrait', 'paper-hands', 'terminal', 'portrait'],
  ['@degendictionary check out https://degendictionary.vercel.app/#/word/rug brutalist', null, 'brutalist', 'square'],
  ['@degendictionary @someoneelse ser', 'ser', 'editorial', 'square'],
  ['@degendictionary this isnt a real word xyzqqq123', null, 'editorial', 'square'],
  ['@degendictionary gm', 'gm', 'editorial', 'square'],
  ['@degendictionary buy the dip meme', 'buy-the-dip', 'meme', 'square'],
  // not actual requests — should all resolve to no word
  ['@degendictionary love this account, so useful', null, 'editorial', 'square'],
  ['@degendictionary lol', null, 'editorial', 'square'],
  ['@degendictionary haha nice', null, 'editorial', 'square'],
  ['@degendictionary thanks for this', null, 'editorial', 'square'],
  ['@degendictionary following now', null, 'editorial', 'square'],
  ['@degendictionary 🔥🔥🔥', null, 'editorial', 'square'],
  ['@degendictionary great project, keep it up', null, 'editorial', 'square'],
  ['@degendictionary can you add more words', null, 'editorial', 'square'],
  ['@degendictionary this is so cool man', null, 'editorial', 'square'],
  ['@degendictionary exit liq square', 'exit-liq', 'editorial', 'square'],
];

let pass = 0, fail = 0;
for (const [text, word, tpl, fmt] of cases) {
  const r = parseIntent(text);
  const gotWord = r.word ? r.word.slug : null;
  const ok = gotWord === word && r.template === tpl && r.format === fmt;
  console.log(
    ok ? 'PASS' : 'FAIL',
    JSON.stringify(text), '->', gotWord, r.template, r.format,
    ok ? '' : `(expected ${word} ${tpl} ${fmt})`
  );
  ok ? pass++ : fail++;
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
