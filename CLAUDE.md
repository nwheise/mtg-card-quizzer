# CLAUDE.md

Guidance for working in this repo.

## What this is

A static (no-backend) Vite + React + TypeScript single-page app for learning the
MTG **Marvel Super Heroes** set (`MSH`). It shows a card (art + name + mana cost
+ primary type) and asks the user to pick its rules text from six same-type
options. See `README.md` for the user-facing overview.

## Commands

```bash
npm install
npm run fetch   # scripts/fetch-cards.mjs: download + normalize MSH -> public/cards.json (+ symbols.json)
npm run dev     # vite dev server (default http://localhost:5173)
npm run build   # tsc -b && vite build  (also the type-check gate)
npm run preview # serve the production build
```

There is no test suite. Verify changes by building and by screenshotting the
running dev server (e.g. with headless Chrome).

## Architecture

- **Data pipeline** — `scripts/fetch-cards.mjs` is run at build/dev time, not in
  the browser. It pulls the set from Scryfall and writes trimmed JSON into
  `public/`, which is committed. The app fetches that JSON at runtime
  (`src/data/loadCards.ts`); it never calls Scryfall directly.
- **Game logic** (`src/game/`, plain TS, no React):
  - `progress.ts` — per-card weights + stats in `localStorage` (spaced
    repetition: a miss raises a card's weight, a correct answer lowers it).
  - `selectCard.ts` — weighted-random next-card pick, never repeats the previous.
  - `buildOptions.ts` — one correct option + 5 distractors of the same
    `primaryType`; dedupes identical oracle text. `OPTION_COUNT` lives here.
  - `formatText.ts` — `cleanOracle()` strips reminder text and tidies whitespace.
- **UI** (`src/components/`): `CardPrompt`, `OptionsGrid` → `OptionCard` →
  `OracleText` (cleaning, ability-word emphasis, name redaction, symbols) and
  `SymbolText`/`InlineSymbols` (mana symbols). `App.tsx` holds the round state
  machine. All styling is in `src/styles.css` (plain CSS, dark theme).

## Things to know before changing data/rendering

- **Scryfall blocks generic fetchers** (403). `fetch-cards.mjs` drives `curl`
  with an explicit `User-Agent`; keep that if you touch the fetch.
- **Double-faced cards are split per face.** `SPLIT_LAYOUTS` (`modal_dfc`,
  `transform`) emit one quiz entry per `card_faces[]` face, each with id
  `<scryfallId>-<i>`. Other layouts stay single entries.
- **Sagas** have rules text baked into Scryfall's `art_crop`. `CardPrompt`
  detects them by type line and crops to the right ~46% (the art) via the
  `card-art--saga` CSS class — don't show the raw art_crop for them.
- **Self-name redaction** lives in `OracleText.tsx`: a card's own name (full +
  pre-comma short name, per face) is blacked out so the text can't spoil the
  answer. Case-sensitive, whole-word, no lookbehind (older-Safari safe).
- **Distractors are same-type by design** (more confusable = better training).
  The prompt shows `primaryType` to match.
- **P/T** is shown only on the options (bottom-right), not the prompt, so stats
  are recalled rather than read off.
- Regenerating data is safe and idempotent: `npm run fetch`. The set releases
  2026-06-26, so re-fetch to pick up Scryfall updates.

## Conventions

- TypeScript is strict; `.ts`/`.tsx` extensions are used in imports (Vite
  bundler resolution). Match the existing dark-theme CSS variables in
  `styles.css`. Keep card/game logic framework-free in `src/game/`.
