# Degen Dictionary — reply bot

Tag the account, get back a share-card image of the word you asked for, in whatever
template/format you specified. This folder is the "brain": it takes tweet text,
figures out what you want, and produces a PNG + reply text. **It doesn't use the
X API and doesn't talk to X at all.**

## What's built and tested here

| File | What it does | Tested how |
|---|---|---|
| `parse-intent.mjs` | tweet text → `{word, template, format}` | 25 test cases (`node server/parse-intent.test.mjs`), no deps, no network |
| `render.mjs` (`renderCardCore`) | draws the actual card, reusing the site's own templates | 450 calls across every template × format × word |
| `reply.mjs` | glues the two together → `{image buffer, reply text}` | tested with a fake renderer injected |
| `render.mjs` (`renderCard`, the `@napi-rs/canvas` wrapper) | turns that drawing into a real PNG file | **not tested** — needs a package install this project's build environment couldn't reach. Small and isolated on purpose; see below. |

## The part this README can't hand you: how you learn someone tagged you

This is a real constraint, not a missing feature. Reading mentions means reading
*from* X, and there is no free, no-API way to do that without logging into the
account and scraping X's private, undocumented endpoints — which X's Terms of
Service explicitly prohibit, risks the account getting suspended, and depends on
endpoints that can change or get blocked at any time with no warning. That's why
this project doesn't include that part: it's not a code gap, it's deliberately
left as your call, because it's a cost/risk decision, not an engineering one.

Your real options, roughly cheapest/lowest-effort to most reliable:

1. **A compliant automation platform** (Zapier, Make, n8n, etc.) with a
   "new mention" trigger for X and a "post reply" action. The platform has its own
   agreement with X baked into what you pay them, so you're not holding an X API
   key yourself. Often has a limited free tier; check current pricing and whether
   their mention-trigger actually fires promptly (some poll on a delay).
2. **X API, paid tier, direct.** Free tier is write-only (can't read mentions at
   all). Reading mentions requires at least the paid Basic tier; reliable/frequent
   polling usually means Pro. **Prices and what each tier includes change
   often — check developer.x.com directly before committing**, since even recent
   write-ups disagree on exact current numbers.
3. **Manual trigger**, while you decide: paste a tweet's text into
   `node server/parse-intent.mjs "<text>"` or call `buildReply()` yourself and
   post the result by hand. Not a bot, but it proves the whole pipeline works
   end to end with zero ongoing cost.

Whichever you pick, the code that uses it is one function call:
```js
import { buildReply } from './server/reply.mjs';
const result = await buildReply(tweetText); // tweetText from wherever your trigger gives it to you
if (result.ok) {
  // result.buffer is a PNG Buffer, result.replyText is the caption
  // -> hand both to whatever posts the reply (your automation platform's
  //    action, or an X API call if you went that route)
} else {
  // result.replyText is a friendly "couldn't find that word" message
}
```

## Setting up image rendering

```bash
cd server
npm install @napi-rs/canvas
```

`@napi-rs/canvas` was picked because it ships prebuilt binaries — no native
compiler toolchain needed, which matters if you're deploying to something like a
Vercel serverless function (the more common `node-canvas` package needs system
libraries like Cairo and Pango that most serverless hosts don't have).

For cards to use the real brand fonts, download the free `.ttf` files for
**Instrument Serif**, **Space Grotesk**, **Inter**, and **JetBrains Mono** from
Google Fonts and put them in `server/fonts/` using the filenames listed at the
top of `render.mjs`. Missing font files don't break anything — cards still
render, just with a generic system font instead of the exact brand look. Verify
this yourself once installed:

```bash
node server/render.mjs wagmi editorial square test.png
open test.png   # or just check the file exists/looks right
```

## Testing what's here right now (no installs needed)

```bash
node server/parse-intent.test.mjs    # intent parser, 25 cases
node server/render.test.mjs          # template rendering, 450 calls, no real canvas needed
node server/reply.test.mjs           # full pipeline with a fake renderer
```

## A known, accepted limitation

Free-text parsing is inherently fuzzy. A handful of this dictionary's aliases are
ordinary English words in disguise (`"when"` is an alias for WEN, `"wen"`
literally means "when" in crypto slang) — a tweet that happens to use one of
those words conversationally can occasionally trigger an unintended match. This
is a content/data tradeoff, not a bug: tightening it further would also block
legitimate short requests. If it matters for your use case, review
`js/data/dictionary.js` aliases for anything too generic.
