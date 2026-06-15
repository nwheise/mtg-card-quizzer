# CLAUDE.md

Guidance for working in this repo.

## What this is

A static (no-backend) Vite + React + TypeScript single-page app for learning the
MTG **Marvel Super Heroes** set (`MSH`). It shows a card (art + name + primary
type + whatever the player routes to the prompt) and asks them to pick one of
its parts from six same-type options. Which part goes in the prompt vs. is
quizzed vs. hidden is player-configurable (oracle text, mana cost, type line,
keywords, P/T); by default the mana cost is shown and the oracle text is
quizzed. See `README.md` for the user-facing overview.

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
  - `fields.ts` — the registry (`FIELDS`) of configurable card parts. Each
    `FieldDef` knows its label, the question noun, how to extract its string
    `value` (used for both rendering and distractor dedupe), and whether a card
    `has` it. Adding a quizzable part means adding an entry here (+ a `FieldId`
    in `types.ts` and a render case in `FieldValue.tsx`).
  - `settings.ts` — player config in `localStorage` (`msh-settings-v1`): each
    field's role (`prompt`/`quiz`/`hidden`). Helpers pick the round's quiz field
    (`pickQuizField`, random among a card's *available* quiz fields) and filter
    the deck to `eligibleCards`. Always keeps ≥1 field set to quiz.
  - `progress.ts` — per-card weights + stats in `localStorage` (spaced
    repetition: a miss raises a card's weight, a correct answer lowers it).
  - `selectCard.ts` — weighted-random next-card pick, never repeats the previous.
  - `buildOptions.ts` — one correct option + 5 distractors of the same
    `primaryType`, showing `round.quizField`; dedupes by that field's `value`.
    `OPTION_COUNT` lives here.
  - `formatText.ts` — `cleanOracle()` strips reminder text and tidies whitespace.
- **UI** (`src/components/`): `CardPrompt` (renders the prompt-role parts),
  `OptionsGrid` → `OptionCard` → `FieldValue` (dispatches per field to
  `OracleText` — cleaning, ability-word emphasis, name redaction, symbols — or
  `SymbolText`/`InlineSymbols` for mana, or plain text). `SettingsPanel` is the
  gear popover. `App.tsx` holds the round state machine. All styling is in
  `src/styles.css` (plain CSS, dark theme).

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
  The prompt always shows `primaryType` to match; the type line's *subtypes* are
  the configurable `typeLine` field.
- **Keywords** come from Scryfall's `keywords` field, recorded by
  `fetch-cards.mjs` into `cards.json` (so `npm run fetch` must have run against a
  reachable `api.scryfall.com` for the keywords field to be populated).
- Regenerating data is safe and idempotent: `npm run fetch`. The set releases
  2026-06-26, so re-fetch to pick up Scryfall updates.

## Conventions

- TypeScript is strict; `.ts`/`.tsx` extensions are used in imports (Vite
  bundler resolution). Match the existing dark-theme CSS variables in
  `styles.css`. Keep card/game logic framework-free in `src/game/`.
