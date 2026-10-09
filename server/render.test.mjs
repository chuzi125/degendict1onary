// node server/render.test.mjs
// Tests renderCardCore only — the canvas-library-agnostic drawing logic.
// Does NOT need @napi-rs/canvas installed: uses a lightweight fake 2D context
// (same technique the main site's build used to smoke-test templates).
import { renderCardCore } from './render.mjs';
import { DICTIONARY } from '../js/data/dictionary.js';
import { TEMPLATES } from '../js/share/templates/index.js';
import { FORMATS } from '../js/share/formats.js';

const ctx = new Proxy(
  {
    font: '10px x',
    measureText(t) {
      const m = /(\d+(\.\d+)?)px/.exec(this.font);
      return { width: String(t).length * (m ? +m[1] : 10) * 0.58 };
    },
  },
  {
    get(t, k) { return k in t ? t[k] : () => {}; },
    has() { return true; },
    set(t, k, v) { t[k] = v; return true; },
  }
);

let n = 0, failed = false;
for (const t of Object.keys(TEMPLATES)) {
  for (const f of Object.keys(FORMATS)) {
    for (const w of DICTIONARY) {
      try {
        const r = renderCardCore(ctx, w, { template: t, format: f });
        if (r.width !== FORMATS[f].w || r.height !== FORMATS[f].h) {
          console.log('FAIL size mismatch', t, f, w.slug);
          failed = true;
        }
        n++;
      } catch (e) {
        console.log('FAIL render threw', t, f, w.slug, e.message);
        failed = true;
      }
    }
  }
}
console.log(`renderCardCore: ${n} calls across ${Object.keys(TEMPLATES).length} templates × ${Object.keys(FORMATS).length} formats × ${DICTIONARY.length} words`);

const expectThrow = (label, fn) => {
  try { fn(); console.log('FAIL (expected throw):', label); failed = true; }
  catch (e) { console.log('ok:', label, '->', e.message); }
};
expectThrow('unknown template', () => renderCardCore(ctx, DICTIONARY[0], { template: 'nope', format: 'square' }));
expectThrow('unknown format', () => renderCardCore(ctx, DICTIONARY[0], { template: 'editorial', format: 'nope' }));
expectThrow('missing entry', () => renderCardCore(ctx, null, {}));

console.log(failed ? '\nFAILED' : '\nALL OK');
process.exit(failed ? 1 : 0);
