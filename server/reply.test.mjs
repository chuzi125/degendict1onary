// node server/reply.test.mjs
// Tests the full pipeline with a fake renderer injected, so it needs no
// @napi-rs/canvas install and makes no real images — just proves the wiring,
// the reply-text formatting, and the length budget are correct.
import { buildReply } from './reply.mjs';
import { DICTIONARY } from '../js/data/dictionary.js';

const fakeRender = async (word, opts) => Buffer.from(`fake-${word.slug}-${opts.template}-${opts.format}`);
let failed = false;

const r1 = await buildReply('@degendictionary rekt as a trading card', { render: fakeRender });
if (!r1.ok || r1.template !== 'card' || r1.format !== 'square' || !r1.replyText.includes('REKT')) {
  console.log('FAIL case1', r1); failed = true;
} else console.log('ok: normal request ->', r1.template, r1.format, `(${r1.replyText.length} chars)`);

const r2 = await buildReply('@degendictionary lol nice', { render: fakeRender });
if (r2.ok || !r2.replyText.toLowerCase().includes("couldn't find")) {
  console.log('FAIL case2', r2); failed = true;
} else console.log('ok: no-word fallback ->', JSON.stringify(r2.replyText.slice(0, 50)) + '...');

for (const word of DICTIONARY) {
  const r = await buildReply('@degendictionary ' + word.slug, { render: fakeRender });
  if (!r.ok) { console.log('FAIL: no match for own slug', word.slug); failed = true; continue; }
  if (r.replyText.length >= 280) { console.log('FAIL: reply too long for', word.slug, r.replyText.length); failed = true; }
}
console.log(`ok: all ${DICTIONARY.length} words produce a reply under 280 chars`);

console.log(failed ? '\nFAILED' : '\nALL OK');
process.exit(failed ? 1 : 0);
