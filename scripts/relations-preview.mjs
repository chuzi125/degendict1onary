// Preview computed related words for every entry (or one slug):
//   node scripts/relations-preview.mjs           # all words
//   node scripts/relations-preview.mjs wagmi      # just one, with score breakdown
import { DICTIONARY } from '../js/data/dictionary.js';
import { getWordBySlug, getRelatedWords } from '../js/lib/dictionary.js';
import { scoreRelated } from '../js/lib/related.js';

const only = process.argv[2];

if (only) {
  const w = getWordBySlug(only);
  if (!w) { console.log(`No entry "${only}"`); process.exit(1); }
  console.log(`${w.term} (${w.slug})\n`);
  scoreRelated(w, DICTIONARY).slice(0,10).forEach(({word,score,breakdown}) => {
    console.log(
      `  ${score.toFixed(3)}  ${word.term.padEnd(24)} ` +
      `cat=${breakdown.cat.toFixed(2)} text=${breakdown.txt.toFixed(2)} mention=${breakdown.men}`
    );
  });
  process.exit(0);
}

let weak = 0;
for (const w of DICTIONARY) {
  const rel = getRelatedWords(w, 4);
  const top = scoreRelated(w, DICTIONARY)[0];
  const flag = !top || top.score < 0.12 ? '  ⚠ weak signal — consider a more specific definition or category' : '';
  console.log(`${w.term.padEnd(26)} -> ${rel.map(r=>r.term).join(', ')}${flag}`);
  if (flag) weak++;
}
console.log(`\n${DICTIONARY.length} words, ${weak} with weak best-match (run with a slug for details, e.g. \`node scripts/relations-preview.mjs ${DICTIONARY[0].slug}\`)`);
