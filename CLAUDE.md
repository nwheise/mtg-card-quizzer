# CLAUDE.md

Guidance for working in this repo.

## What this is

A static (no-backend) Vite + React + TypeScript single-page app for learning MTG
sets — currently **Marvel Super Heroes** (`MSH`) and **The Hobbit** (`HOB`). It
shows a card (art + name + primary type + whatever the player routes to the
prompt) and asks them to pick one of its parts from six same-type options. Which
part goes in the prompt vs. is quizzed vs. hidden is player-configurable (oracle
text, mana cost, type line, keywords, P/T); by default the mana cost is shown and
the oracle text is quizzed. The player also picks which set(s) are in play. See
`README.md` for the user-facing overview.

## Commands

```bash
npm install
npm run fetch   # scripts/fetch-cards.mjs: download + normalize every set in SETS -> public/cards.json (+ sets.json, symbols.json)
npm run dev     # vite dev server (default http://localhost:5173)
npm run build   # tsc -b && vite build  (also the type-check gate)
npm run preview # serve the production build
```

There is no test suite. Verify changes by building and by screenshotting the
running dev server (e.g. with headless Chrome).

## Architecture

- **Data pipeline** — `scripts/fetch-cards.mjs` is run at build/dev time, not in
  the browser. It pulls each set in its `SETS` array from Scryfall and writes
  trimmed JSON into `public/`, which is committed. The app fetches that JSON at
  runtime (`src/data/loadCards.ts`); it never calls Scryfall directly. Output is
  one combined `cards.json` (every card tagged with its `set` code) plus a
  `sets.json` manifest (`{code, name, released, count}`, newest first) that
  drives the set picker. **Adding a set = adding its code to `SETS` + re-running
  the fetch**; no app code changes.
- **Game logic** (`src/game/`, plain TS, no React):
  - `fields.ts` — the registry (`FIELDS`) of configurable card parts. Each
    `FieldDef` knows its label, the question noun, how to extract its string
    `value` (used for both rendering and distractor dedupe), and whether a card
    `has` it. Adding a quizzable part means adding an entry here (+ a `FieldId`
    in `types.ts` and a render case in `FieldValue.tsx`).
  - `settings.ts` — player config in `localStorage`. Two independent slices:
    field roles (`msh-settings-v1`: each field's `prompt`/`quiz`/`hidden`) and
    the selected set codes (`msh-selected-sets-v1`). Helpers pick the round's
    quiz field (`pickQuizField`, random among a card's *available* quiz fields),
    filter the deck to `eligibleCards`, and narrow it to the chosen sets
    (`cardsInSets`). A first-time visitor gets `defaultSelectedSets` — just the
    newest set by `released`. Always keeps ≥1 field set to quiz, and the UI
    always keeps ≥1 set selected.
  - `progress.ts` — per-card weights + stats in `localStorage` (spaced
    repetition: a miss raises a card's weight, a correct answer lowers it).
  - `selectCard.ts` — weighted-random next-card pick, never repeats the previous.
  - `buildOptions.ts` — one correct option + 5 distractors showing
    `round.quizField`; dedupes by that field's `value`. Distractors are picked
    from four tiers in order: same set + same `primaryType`, same set, other set
    + same type, then anything. Set is the *stronger* preference, so a question
    stays within one set even when several are selected. `OPTION_COUNT` lives
    here.
  - `formatText.ts` — `cleanOracle()` strips reminder text and tidies whitespace.
  - `frame.ts` — `frameFor()` maps a card to its printed frame colour
    (`w`/`u`/`b`/`r`/`g`/`gold`/`artifact`/`land`); `promptFrame(card, settings)`
    is the one to call — it returns `neutral` instead whenever showing the
    colour would spoil a quizzed mana cost. Drives both the prompt frame and the
    answer-box tint (see Look and feel below). `App` computes it once and passes
    it to `CardPrompt` and `OptionsGrid`.
- **UI** (`src/components/`): `CardPrompt` (renders the prompt-role parts),
  `OptionsGrid` → `OptionCard` → `FieldValue` (dispatches per field to
  `OracleText` — cleaning, ability-word emphasis, name redaction, symbols — or
  `SymbolText`/`InlineSymbols` for mana, or plain text). `SettingsPanel` is the
  gear popover. `App.tsx` holds the round state machine. All styling is in
  `src/styles.css` (plain CSS).
- **Look and feel** — the page imitates a Magic card on a dark table. The
  prompt is a real card frame (`.card` → `.card-plate` → title bar / art window
  / type bar / parchment text box, plus a P/T box on the corner), coloured by
  `frameFor()` via the `--f1`/`--f2`/`--f-ink`/`--f-box` custom properties on
  `.frame--*`. The **answer boxes share that colour**: `OptionsGrid` gets the
  same `frame--*` class, and `.option`'s parchment is mixed from `--f-box`, so a
  blue card's answers sit on pale-blue stock like the card's own text box does.
  The type bar ends in the **set symbol** — `SetInfo.icon` (Scryfall
  `icon_svg_uri`, in `sets.json`) masked with a rarity-coloured gradient
  (`.rarity-pip--icon`); it falls back to a plain rarity lozenge if the icon URL
  is missing. Type is Cinzel (engraved names/labels) + Spectral (rules text), loaded
  from Google Fonts in `index.html` with a system-serif fallback. Keep new
  chrome warm (bronze/gold on near-black) rather than the neutral greys of a
  default dark theme.

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
- **The frame colour is a spoiler.** `promptFrame()` only tints the frame (and
  the answer boxes) with the card's real colour when the mana cost is already
  routed to the prompt; otherwise it returns `neutral`, so a quizzed mana cost
  isn't given away by the colour around the art or under the options.
- **Distractors are same-set and same-type by design** (more confusable = better
  training). The prompt always shows `primaryType` to match; the type line's
  *subtypes* are the configurable `typeLine` field.
- **A set still in spoiler season comes down partial** (HOB was 44 of 108 cards
  as of 2026-07-21) and may include Scryfall placeholder entries whose names are
  wrapped in double quotes. Re-fetch to fill them in.
- **Keywords** come from Scryfall's `keywords` field, recorded by
  `fetch-cards.mjs` into `cards.json` (so `npm run fetch` must have run against a
  reachable `api.scryfall.com` for the keywords field to be populated).
- Regenerating data is safe and idempotent: `npm run fetch`. MSH releases
  2026-06-26 and HOB 2026-08-14, so re-fetch to pick up Scryfall updates.

## Conventions

- TypeScript is strict; `.ts`/`.tsx` extensions are used in imports (Vite
  bundler resolution). Match the existing dark-theme CSS variables in
  `styles.css`. Keep card/game logic framework-free in `src/game/`.
