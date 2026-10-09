// Data access layer. UI code only calls these functions, so swapping local data for an API later means editing this file only.
import { DICTIONARY } from '../data/dictionary.js';
import { RELATED_OVERRIDES } from '../data/related-overrides.js';
import { computeRelated } from './related.js';

export const norm = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
export const getAllWords = () => DICTIONARY;
export const getWordBySlug = slug => { try{ slug = decodeURIComponent(slug||''); }catch(e){ return null } return DICTIONARY.find(w => w.slug === slug.toLowerCase()) || null; };
export const getWordIndex = w => DICTIONARY.indexOf(w);
export const getRandomWord = (except) => { const pool = DICTIONARY.filter(w => w !== except); return pool[Math.floor(Math.random()*pool.length)]; };
export const getWordsByCategory = c => c==='ALL' ? DICTIONARY : DICTIONARY.filter(w => w.categories.includes(c));
// Related words are computed, not hand-written — see lib/related.js for how.
// `limit` defaults to 4 (used across word pages, terminal mode, etc).
export const getRelatedWords = (e, limit=4) => computeRelated(e, DICTIONARY, { limit, overrides: RELATED_OVERRIDES[e.slug] || [] });
export const getFeaturedWord = () => DICTIONARY[Math.floor(Date.now()/864e5) % DICTIONARY.length];
// minScore lets a caller opt out of the weak tiers (40 = bare category name,
// 30 = word appears somewhere in a definition/example). The site's own search
// box wants those — a looser net is good UX when a human is reading results.
// Callers parsing freeform text for an exact target (e.g. the bot's intent
// parser) should pass a higher minScore, since on prose-sized input a common
// word like "what" or "real" can coincidentally substring-match someone's
// example sentence and win by accident otherwise.
// minSubstringLen gates every *fuzzy* tier (startsWith and includes, on both
// term and alias): a short query matching only because it happens to prefix
// or sit inside a longer phrase ("so" starting "so back", "out" inside
// "breakout") is usually a coincidence, not intent. Only exact equality
// (term or alias, tier 100/90) is trusted regardless of query length.
export function searchWords(query, { minScore = 0, minSubstringLen = 0 } = {}){
  const q = norm(query); if(!q) return [];
  const long = q.length >= minSubstringLen;
  const out = [];
  for(const w of DICTIONARY){
    const t = norm(w.term), al = (w.aliases||[]).map(norm);
    let s = 0;
    if(t===q) s=100; else if(al.includes(q)) s=90;
    else if(long && t.startsWith(q)) s=80; else if(long && al.some(a=>a.startsWith(q))) s=70;
    else if(long && t.includes(q)) s=60; else if(long && al.some(a=>a.includes(q))) s=55;
    else if(w.categories.some(c=>norm(c)===q||norm(c).startsWith(q))) s=40;
    else if(norm([w.definition,w.context,w.origin,...(w.examples||[]).map(x=>x.text)].join(' ')).includes(q)) s=30;
    if(s>=minScore && s>0) out.push({w,s});
  }
  return out.sort((a,b)=> b.s-a.s || a.w.term.localeCompare(b.w.term)).map(x=>x.w);
}
