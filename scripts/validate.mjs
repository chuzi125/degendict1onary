// Checks dictionary data before you deploy: node scripts/validate.mjs
import { DICTIONARY } from '../js/data/dictionary.js';
import { CATEGORIES } from '../js/data/categories.js';
import { findNearDuplicates } from '../js/lib/related.js';

const errors = [], warns = [];
const slugs = new Set();
for (const w of DICTIONARY) {
  const id = w.slug || w.term || '(unknown)';
  if (!w.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.slug)) errors.push(`${id}: slug must be lowercase letters, numbers and hyphens`);
  if (slugs.has(w.slug)) errors.push(`${id}: duplicate slug`);
  slugs.add(w.slug);
  if (!w.term) errors.push(`${id}: missing term`);
  if (!w.definition) errors.push(`${id}: missing definition`);
  if (!Array.isArray(w.categories) || !w.categories.length) errors.push(`${id}: needs at least one category`);
  (w.categories || []).forEach(c => { if (!CATEGORIES.includes(c)) errors.push(`${id}: unknown category "${c}" (add it to js/data/categories.js)`); });
  if (w.degenScore != null && !(w.degenScore >= 1 && w.degenScore <= 10)) errors.push(`${id}: degenScore must be 1-10`);
  if (w.definition && w.definition.length > 220) warns.push(`${id}: long definition (${w.definition.length} chars), consider adding shortDefinition`);
}
CATEGORIES.forEach(c => { if (!DICTIONARY.some(w => w.categories.includes(c))) warns.push(`category "${c}" has no words`); });

// Related words are computed automatically (lib/related.js), so instead of checking
// a hand-written related list, flag entries that look like accidental duplicates —
// this is the check that would have caught e.g. "paperhands" vs "paper-hands" or
// "exit-liq" vs "exit-liquidity" automatically instead of by hand.
const dupes = findNearDuplicates(DICTIONARY, 0.75);
dupes.forEach(({a,b,combined}) => {
  warns.push(`possible duplicate: "${a.term}" (${a.slug}) / "${b.term}" (${b.slug}) — ${Math.round(combined*100)}% similar. If intentional, ignore; if not, merge and delete one.`);
});

warns.forEach(m => console.log('warn  ', m));
errors.forEach(m => console.log('ERROR ', m));
console.log(`\n${DICTIONARY.length} words · ${errors.length} errors · ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
