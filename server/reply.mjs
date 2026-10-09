// REPLY — the full pipeline: tweet text in, {image, reply text} out.
//
// Still nothing X-specific here. Whatever eventually calls buildReply() with
// real tweet text (see server/README.md for the trigger options and their
// tradeoffs) gets back a PNG buffer and reply copy ready to post.

import { parseIntent } from './parse-intent.mjs';
import { renderCard as defaultRender } from './render.mjs';

const SITE = 'degendictionary.vercel.app';
const MAX_LEN = 260; // conservative; X auto-shortens links so real headroom is larger

const NOT_FOUND_REPLY =
  `Couldn't find that one in the Degen Dictionary. Try tagging me with a word ` +
  `— e.g. "wagmi" or "rekt as a trading card" — or browse the full dictionary: ${SITE}`;

function truncate(text, max){
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

/**
 * @param {string} tweetText
 * @param {{ render?: Function }} [opts] - inject a fake render() for testing
 * @returns {Promise<{ ok: true, buffer: Buffer, word: object, template: string, format: string, replyText: string }
 *                 | { ok: false, replyText: string }>}
 */
export async function buildReply(tweetText, { render = defaultRender } = {}){
  const intent = parseIntent(tweetText);
  if (!intent.word) {
    return { ok: false, replyText: NOT_FOUND_REPLY };
  }

  const { word, template, format } = intent;
  const def = word.shortDefinition || word.definition;
  const link = `${SITE}/#/word/${word.slug}`;
  const budget = MAX_LEN - word.term.length - link.length - 6; // room for " — " and newlines
  const body = def.length > budget ? truncate(def, Math.max(budget, 20)) : def;
  const replyText = `${word.term} — ${body}\n\n${link}`;

  const buffer = await render(word, { template, format });
  return { ok: true, buffer, word, template, format, replyText };
}
