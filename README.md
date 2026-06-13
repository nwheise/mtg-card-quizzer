# MSH Card Quizzer

A flashcard-style web app for learning the Magic: The Gathering **Marvel Super
Heroes** (set code `MSH`) set. It shows a card's art, name, mana cost, and type,
then asks you to pick its rules text from six options — training fast "see the
card → recall what it does" recognition.

It's a fully static single-page app (no backend). Card data comes from
[Scryfall](https://scryfall.com) and is pre-fetched into `public/cards.json`.

## How it works

- Each round shows one card (art crop + name + mana cost + primary type) and six
  oracle-text options of the **same type** — the correct one plus five
  distractors. Power/toughness is shown on each option for creatures.
- Several cleanups keep the options legible and spoiler-free: reminder text is
  stripped, ability words are italicized, mana symbols are rendered, and the
  card's **own name is blacked out** of its rules text so it can't give itself
  away.
- Sagas are cropped to just their art (their frame bakes rules text into the
  art image), and double-faced cards (e.g. *Bruce Banner // The Incredible
  Hulk*) are quizzed as two separate cards.
- Missed cards resurface more often (lightweight spaced repetition), with
  per-card progress and your best streak saved to `localStorage`.

## Develop

```bash
npm install
npm run fetch   # download/refresh MSH data -> public/cards.json + symbols.json
npm run dev     # start the dev server
npm run build   # type-check + production build into dist/
```

`npm run fetch` pulls the set from Scryfall; re-run it to pick up data/art
updates (the set releases 2026-06-26, so details may still change).
