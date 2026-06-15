import type { QuizCard, SymbolMap } from "../types.ts";

// Both files are emitted into /public by scripts/fetch-cards.mjs, so they are
// served from the site root. `import.meta.env.BASE_URL` keeps them resolvable
// when the app is hosted under a sub-path.
const base = import.meta.env.BASE_URL;

export async function loadGameData(): Promise<{
  cards: QuizCard[];
  symbols: SymbolMap;
}> {
  const [cards, symbols] = await Promise.all([
    fetch(`${base}cards.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load cards.json (${r.status})`);
      return r.json() as Promise<QuizCard[]>;
    }),
    fetch(`${base}symbols.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load symbols.json (${r.status})`);
      return r.json() as Promise<SymbolMap>;
    }),
  ]);
  return { cards, symbols };
}
