// CLI used by the Python bridge. Text in, PNG + reply text out.
import fs from 'node:fs';
import { buildReply } from './reply.mjs';

let text = '';
let out = '';
let asJson = false;

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--text') text = args[++i] ?? '';
  else if (a === '--out') out = args[++i] ?? '';
  else if (a === '--json') asJson = true;
  else text += (text ? ' ' : '') + a;
}

if (!text.trim()) {
  console.error('usage: node server/reply-cli.mjs "@degendictionary wagmi as a trading card" --out card.png --json');
  process.exit(1);
}

try {
  const r = await buildReply(text);
  if (!r.ok) {
    console.log(JSON.stringify(r));
    process.exit(2);
  }
  if (out) fs.writeFileSync(out, r.buffer);
  const payload = {
    ok: true,
    word: r.word.slug,
    term: r.word.term,
    template: r.template,
    format: r.format,
    replyText: r.replyText,
    imageBytes: r.buffer.length,
    ...(out ? { imagePath: out } : {})
  };
  console.log(asJson ? JSON.stringify(payload) : payload.replyText);
} catch (e) {
  console.log(JSON.stringify({ ok: false, replyText: String(e?.message || e) }));
  process.exit(3);
}