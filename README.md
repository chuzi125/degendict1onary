# Degen Dictionary

A searchable field guide to crypto slang. Static site, plain ES modules, **no build step and no dependencies**.

## Run locally

Modules need a web server (opening index.html by double-click won't work).

```bash
npm run dev        # serves on http://localhost:3000
# or: python3 -m http.server 3000
```

## Deploy

Upload this folder to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3. No config needed. Use HTTPS so copy-image and native share work.

## Structure

```
index.html              shell (header, palette + studio containers)
css/styles.css          all styles, design tokens at the top
js/
  app.js                router, global click/keyboard wiring, boot
  state.js              UI state (category filter, terminal mode)
  actions.js            copy link, random word
  data/
    dictionary.js       ALL WORD CONTENT  <-- edit this to add words
    categories.js       category list
  lib/
    dictionary.js       data access layer (only file that touches the data)
    related.js          related-words engine (auto-computed, see below)
    utils.js            DOM helpers, icons, meta tags
  views/                home, word, about, not-found, terminal
  search/palette.js     Cmd/Ctrl+K command palette
  share/
    canvas.js           drawing + text-fitting primitives
    formats.js          export sizes
    studio.js           share studio UI + export/copy/share
    templates/          one file per card template
scripts/
  validate.mjs           data checker (run before every deploy)
  relations-preview.mjs  preview computed related words
```

## Add a word

1. Open `js/data/dictionary.js` and append an object (the field guide is in the comment at the top of the file).
2. Run `npm run validate`. It catches duplicate slugs, unknown categories, bad scores, and *likely duplicate entries* (see below).
3. Deploy. That's it. Search, filters, word page, terminal mode and share cards all pick it up. No UI files change.

**There is no `related` field to fill in.** Related words are computed automatically from
each entry's category and definition/example text (`js/lib/related.js`) — you never write
or maintain a related-words list by hand, and it never goes stale as the dictionary grows.

- Preview what it computes: `node scripts/relations-preview.mjs` (all words) or
  `node scripts/relations-preview.mjs wagmi` (one word, with the score breakdown).
- If the algorithm misses an obvious connection, pin it in `js/data/related-overrides.js`
  (optional, rare — most words need nothing there).
- `npm run validate` also flags entries that look like accidental duplicates of each other
  (e.g. two spellings of the same slang), by the same similarity engine, so pasting in a
  large batch from elsewhere won't silently create redundant entries.

## Add a category

Add the name to `js/data/categories.js`, then use it in any word's `categories`.

## Add a share template

1. Copy `js/share/templates/editorial.js` to a new file and change the drawing code. A template is `{ name, description, render(ctx, W, H, entry, { s, m }) }`.
2. Import it in `js/share/templates/index.js` and add one line to `TEMPLATES`.

Use `fit()` for any text that varies in length so long words and definitions shrink instead of overflowing.

## Add an export format

Add an entry to `js/share/formats.js` (`{ name, w, h, note }`).

## Swap in a database later

Only `js/lib/dictionary.js` reads the data. Replace its functions with fetches to a read API (they'd become async) and nothing in the views needs to know the storage format. Keep secrets and write access server-side, never in this client code.

## Reply bot (optional)

`server/` has the engine for a "tag the account, get a word card back" bot:
parses what was asked for from the tweet text, renders the same share cards the
site uses, server-side. It deliberately does not include a way to detect
mentions without the X API — see `server/README.md` for why, and for the
actual options (a paid API tier, or a compliant automation platform).

## Known limits

- Routes are hash-based (`/#/word/wagmi`). Link-preview crawlers (X, Discord, Telegram) don't run JavaScript, so they see only the homepage title. Per-word previews and search indexing need server rendering (e.g. a Next.js port).
- Related words are algorithmic (`js/lib/related.js`), not hand-curated — see that file's header comment for how, and `js/data/related-overrides.js` to pin an exception.
- Fonts load from Google Fonts. Offline, fallback fonts are used.

## Deploy on Vercel (site + API)

The site and the reply-card API are Vercel-native. `@napi-rs/canvas` ships
prebuilt Linux binaries, so PNG rendering works in serverless functions with
no system packages.

```bash
npm install          # root deps incl. @napi-rs/canvas; package-lock.json must be committed
npx vercel           # or connect the repo in the Vercel dashboard
```

Routes once deployed:

| Route | What |
|---|---|
| `GET /api/words` | all 189 words as JSON |
| `GET /api/word/:slug` | one word |
| `GET /api/search?q=rekt` | search |
| `POST /api/reply` `{text}` | `{replyText, imageBase64}` — the full mention reply |
| `POST /api/render` `{slug,template,format}` | card PNG as base64 |

The hash-routed static site needs no rewrite rules; `vercel.json` is minimal.
Local equivalents: `npm run api` (same handlers via `server/api.mjs`) and
`node server/vercel-sim.mjs` (mounts the exact `api/*.js` handlers for testing).

## The mention bot does NOT run on Vercel

Vercel functions are request/response serverless — no long-running loop, no
persistent cookie session, cron is too coarse, and 30–90s human-like write
delays blow the duration limit. Run the bot as a tiny always-on worker
(Railway, Render, a VPS, or even a laptop) and point it at the deployed API:

```bash
pip install -r requirements.txt
export DEGEN_API_URL=https://your-app.vercel.app   # bot renders via hosted API
export UNYX_COOKIES_JSON='[{"name":"ct0","value":"..."},...]'   # or UNYX_COOKIES=/path/cookies.json
python3 bot/bridge.py
```

`DEGEN_DRY_RUN=1 DEGEN_ONCE=1` rehearses one batch without posting.
