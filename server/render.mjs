// RENDER — produces the same share-card PNGs as the website, server-side.
//
// This works because the templates (js/share/templates/*.js) only ever touch
// the Canvas 2D API (ctx.fillText, ctx.measureText, etc.) — never the DOM, never
// `document` or `window`. So the exact same template code that draws a card in
// someone's browser can draw it in Node, given something that implements that
// API off-screen.
//
// Split in two on purpose:
//   - renderCardCore(ctx, ...)  — the real logic. Canvas-library-agnostic,
//     fully unit-testable with a fake ctx (see server/render.test.mjs), and
//     that's how it's tested in this project — no network or native build
//     tools needed.
//   - renderCard(...)          — a thin wrapper that creates a real off-screen
//     canvas via @napi-rs/canvas and calls the core. This part needs a package
//     install and could NOT be tested in the environment this project was
//     built in (no package registry access there). Test it yourself once
//     installed: `node server/render.mjs wagmi card square out.png`.
//
// Setup:
//   npm install @napi-rs/canvas
//   Put .ttf files for Instrument Serif, Space Grotesk, Inter, and JetBrains
//   Mono in server/fonts/ (all free on Google Fonts) so cards use the real
//   brand fonts. Missing files degrade to the system default font rather
//   than crashing — cards will render, just not pixel-identical to the site.

import { TEMPLATES } from '../js/share/templates/index.js';
import { FORMATS } from '../js/share/formats.js';

/**
 * The actual rendering logic. `ctx` must implement the subset of the Canvas 2D
 * API the templates use (fillRect, fillText, measureText, save/restore,
 * translate/rotate, roundRect, strokeRect, beginPath/clip, etc. — see
 * js/share/canvas.js for the full list). Returns nothing; draws onto `ctx`.
 */
export function renderCardCore(ctx, entry, { template = 'editorial', format = 'square' } = {}){
  const tpl = TEMPLATES[template];
  if (!tpl) throw new Error(`Unknown template "${template}". Options: ${Object.keys(TEMPLATES).join(', ')}`);
  const fmt = FORMATS[format];
  if (!fmt) throw new Error(`Unknown format "${format}". Options: ${Object.keys(FORMATS).join(', ')}`);
  if (!entry) throw new Error('renderCardCore: entry is required');

  const s = Math.min(fmt.w, fmt.h) / 1080;
  tpl.render(ctx, fmt.w, fmt.h, entry, { s, m: 76 * s });
  return { width: fmt.w, height: fmt.h };
}

// --- Node-canvas-library-specific wrapper (untested here — see header) ---

let _fontsRegistered = false;
async function ensureFonts(){
  if (_fontsRegistered) return;
  _fontsRegistered = true;
  try {
    const { GlobalFonts } = await import('@napi-rs/canvas');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = new URL('./fonts/', import.meta.url);
    const want = [
      ['InstrumentSerif-Regular.ttf', 'Instrument Serif'],
      ['InstrumentSerif-Italic.ttf', 'Instrument Serif'],
      ['SpaceGrotesk-Medium.ttf', 'Space Grotesk'],
      ['SpaceGrotesk-Bold.ttf', 'Space Grotesk'],
      ['Inter-Regular.ttf', 'Inter'],
      ['JetBrainsMono-Regular.ttf', 'JetBrains Mono'],
      ['JetBrainsMono-Medium.ttf', 'JetBrains Mono'],
      ['JetBrainsMono-Bold.ttf', 'JetBrains Mono'],
    ];
    for (const [file, family] of want) {
      const p = path.default.join(new URL(dir).pathname, file);
      if (fs.default.existsSync(p)) GlobalFonts.registerFromPath(p, family);
    }
  } catch {
    // @napi-rs/canvas not installed yet, or no fonts/ dir — render() will
    // still work, just with default system fonts until this is set up.
  }
}

/**
 * Render a word to a PNG buffer. Requires `npm install @napi-rs/canvas`.
 * @returns {Promise<Buffer>}
 */
export async function renderCard(entry, opts = {}){
  await ensureFonts();
  const { createCanvas } = await import('@napi-rs/canvas');
  const fmt = FORMATS[opts.format || 'square'];
  if (!fmt) throw new Error(`Unknown format "${opts.format}". Options: ${Object.keys(FORMATS).join(', ')}`);
  const canvas = createCanvas(fmt.w, fmt.h);
  const ctx = canvas.getContext('2d');
  renderCardCore(ctx, entry, opts);
  return canvas.toBuffer('image/png');
}

/** CLI: node server/render.mjs <slug> [template] [format] [outFile] */
if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, template = 'editorial', format = 'square', outFile] = process.argv.slice(2);
  if (!slug) {
    console.log('usage: node server/render.mjs <slug> [template] [format] [outFile]');
    process.exit(1);
  }
  const { getWordBySlug } = await import('../js/lib/dictionary.js');
  const entry = getWordBySlug(slug);
  if (!entry) { console.error(`No entry "${slug}"`); process.exit(1); }
  const buf = await renderCard(entry, { template, format });
  const fs = await import('node:fs');
  const out = outFile || `${slug}-${template}-${format}.png`;
  fs.writeFileSync(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}
