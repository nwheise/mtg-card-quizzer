# MSH Card Quizzer

A flashcard-style web app for learning the Magic: The Gathering **Marvel Super
Heroes** (set code `MSH`) set. It shows a card's art and name, gives you some of
its info, then asks you to pick another part of it from six options — training
fast "see the card → recall what it does" recognition.

It's a fully static single-page app (no backend). Card data comes from
[Scryfall](https://scryfall.com) and is pre-fetched into `public/cards.json`.

## How it works

- Each round shows one card (art crop + name, plus whatever else you've put in
  the prompt) and six **same-type** options for the part being quizzed — the
  correct one plus five distractors.
- **Customize** (top-right gear) lets you route each part of a card — oracle
  text, mana cost, type line, keywords, power/toughness — to one of three slots:
  shown in the **prompt**, used as a **quiz** item, or **hidden**. Set several
  parts to "quiz" and each round picks one of them at random. By default you're
  given the mana cost and quizzed on the oracle text.
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

`npm run fetch` pulls the set from Scryfall (including each card's keywords);
re-run it to pick up data/art updates (the set releases 2026-06-26, so details
may still change).
