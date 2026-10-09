// RELATEDNESS ENGINE
//
// Computes "related words" automatically from each entry's own content, so nobody
// has to hand-maintain a related:[...] list per word. That list is a many-to-many
// graph — with N words there are up to N² possible connections to keep in sync,
// which is exactly what got painful once the dictionary passed ~100 entries.
//
// How it scores two words against each other:
//   1. Category overlap   — do they share tags? (CT, Trading, DeFi, ...)
//   2. Text similarity    — TF-IDF cosine similarity over definition + examples +
//                            context + origin. Words that are *about* similar things
//                            end up with similar vocabulary, even without sharing
//                            exact phrases. Common words (the, a, crypto, token...)
//                            are automatically down-weighted because IDF penalizes
//                            anything that shows up in most entries — no hardcoded
//                            domain stopword list needed beyond ordinary English.
//   3. Cross-mention bonus — does one entry's text actually say the other term?
//                            (e.g. a definition that name-drops another word)
//
// Nothing here is hardcoded per-word. Add a new entry to dictionary.js and it is
// automatically scored against every existing word the next time related words
// are requested.
//
// Manual overrides (rare, optional): js/data/related-overrides.js lets you pin
// specific relations the algorithm might not surface on its own. Overrides are
// added first; the algorithm fills any remaining slots.

const STOPWORDS = new Set(`
a about above after again against all am an and any are aren't as at be because been
before being below between both but by can't cannot could couldn't did didn't do does
doesn't doing don't down during each few for from further had hadn't has hasn't have
haven't having he he'd he'll he's her here here's hers herself him himself his how
how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most
mustn't my myself no nor not of off on once only or other ought our ours ourselves out
over own same shan't she she'd she'll she's should shouldn't so some such than that
that's the their theirs them themselves then there there's these they they'd they'll
they're they've this those through to too under until up very was wasn't we we'd we'll
we're we've were weren't what what's when when's where where's which while who who's
whom why why's with won't would wouldn't you you'd you'll you're you've your yours
yourself yourselves also often usually sometimes especially typically generally
someone something somebody anyone anything one two term word phrase used use uses
means meaning refers describe describes described way ways thing things
`.trim().split(/\s+/));

function tokenize(text){
  return String(text||'')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function entryText(w){
  return [w.definition, w.shortDefinition, w.context, w.origin, ...(w.examples||[]).map(x=>x.text)]
    .filter(Boolean).join(' ');
}

function buildIndex(allWords){
  const N = allWords.length;
  const docs = allWords.map(w => tokenize(entryText(w)));
  const df = new Map();
  docs.forEach(tokens => { for(const t of new Set(tokens)) df.set(t,(df.get(t)||0)+1); });
  const idf = t => Math.log((N+1)/((df.get(t)||0)+1)) + 1;

  const vectors = docs.map(tokens => {
    const tf = new Map();
    for(const t of tokens) tf.set(t,(tf.get(t)||0)+1);
    const vec = new Map();
    let norm2 = 0;
    for(const [t,c] of tf){ const w = c*idf(t); vec.set(t,w); norm2 += w*w; }
    return { vec, mag: Math.sqrt(norm2) || 1 };
  });

  const mentionRe = new Map(); // slug -> [RegExp,...] for term + aliases
  allWords.forEach(w => {
    const phrases = [w.term, ...(w.aliases||[])].filter(Boolean);
    const res = phrases.map(p => {
      const esc = p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').trim().replace(/\s+/g,'\\s+');
      return esc ? new RegExp('\\b'+esc+'\\b','i') : null;
    }).filter(Boolean);
    mentionRe.set(w.slug, res);
  });

  return { allWords, vectors, mentionRe };
}

function cosine(a,b){
  const [small,big] = a.vec.size < b.vec.size ? [a,b] : [b,a];
  let dot = 0;
  for(const [t,w] of small.vec){ const w2 = big.vec.get(t); if(w2) dot += w*w2; }
  return dot / (a.mag*b.mag);
}
function jaccard(a,b){
  const A = new Set(a.categories||[]), B = new Set(b.categories||[]);
  if(!A.size && !B.size) return 0;
  let inter = 0; for(const c of A) if(B.has(c)) inter++;
  return inter / (A.size + B.size - inter);
}
function mentions(idx,i,j){
  const wi = idx.allWords[i], wj = idx.allWords[j];
  const ti = entryText(wi), tj = entryText(wj);
  const hitsIJ = (idx.mentionRe.get(wj.slug)||[]).some(re => re.test(ti));
  const hitsJI = (idx.mentionRe.get(wi.slug)||[]).some(re => re.test(tj));
  return (hitsIJ || hitsJI) ? 1 : 0;
}

// Weights: text and category matter most; a direct name-drop is a smaller nudge
// on top of those, not a signal on its own (short slang terms can false-match).
const WEIGHTS = { category: 0.42, text: 0.45, mention: 0.13 };

let cache = null; // memoized index, rebuilt only if the word list identity changes
function getIndex(allWords){
  if(cache && cache.allWords === allWords) return cache;
  cache = buildIndex(allWords);
  return cache;
}

/** Score every other word against `entry`. Returns [{word, score, breakdown}], sorted desc. */
export function scoreRelated(entry, allWords){
  const idx = getIndex(allWords);
  const i = allWords.indexOf(entry);
  if(i < 0) return [];
  const out = [];
  for(let j=0;j<allWords.length;j++){
    if(j===i) continue;
    const cat = jaccard(entry, allWords[j]);
    const txt = cosine(idx.vectors[i], idx.vectors[j]);
    const men = mentions(idx,i,j);
    const score = WEIGHTS.category*cat + WEIGHTS.text*txt + WEIGHTS.mention*men;
    out.push({ word: allWords[j], score, breakdown:{cat,txt,men} });
  }
  out.sort((a,b) => b.score-a.score || a.word.term.localeCompare(b.word.term));
  return out;
}

/**
 * Related words for `entry`. Manual overrides (by slug) are included first,
 * in the order given; remaining slots are filled by the algorithm.
 */
export function computeRelated(entry, allWords, { limit=4, overrides=[] } = {}){
  const picked = [];
  const seen = new Set([entry.slug]);
  for(const slug of overrides){
    const w = allWords.find(x=>x.slug===slug);
    if(w && !seen.has(slug)){ picked.push(w); seen.add(slug); }
  }
  if(picked.length < limit){
    for(const {word} of scoreRelated(entry, allWords)){
      if(picked.length >= limit) break;
      if(seen.has(word.slug)) continue;
      picked.push(word); seen.add(word.slug);
    }
  }
  return picked.slice(0,limit);
}

/** For tooling: find pairs of entries that look like accidental duplicates. */
export function findNearDuplicates(allWords, threshold=0.55){
  const idx = getIndex(allWords);
  const out = [];
  for(let i=0;i<allWords.length;i++){
    for(let j=i+1;j<allWords.length;j++){
      const txt = cosine(idx.vectors[i], idx.vectors[j]);
      const cat = jaccard(allWords[i], allWords[j]);
      const combined = 0.6*txt + 0.4*cat;
      if(combined >= threshold) out.push({ a: allWords[i], b: allWords[j], txt, cat, combined });
    }
  }
  return out.sort((a,b)=>b.combined-a.combined);
}
