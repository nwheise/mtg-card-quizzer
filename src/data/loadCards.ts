import type { QuizCard, SymbolMap } from "../types.ts";
import { deriveKeywords } from "../game/keywords.ts";

// Both files are emitted into /public by scripts/fetch-cards.mjs, so they are
// served from the site root. `import.meta.env.BASE_URL` keeps them resolvable
// when the app is hosted under a sub-path.
const base = import.meta.env.BASE_URL;

// Newer cards.json (regenerated via `npm run fetch`) carries Scryfall's
// `keywords`; older ones don't, so we derive from oracle text as a fallback
// (see game/keywords.ts).
type StoredCard = Omit<QuizCard, "keywords"> & { keywords?: string[] };

export async function loadGameData(): Promise<{
  cards: QuizCard[];
  symbols: SymbolMap;
}> {
  const [stored, symbols] = await Promise.all([
    fetch(`${base}cards.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load cards.json (${r.status})`);
      return r.json() as Promise<StoredCard[]>;
    }),
    fetch(`${base}symbols.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load symbols.json (${r.status})`);
      return r.json() as Promise<SymbolMap>;
    }),
  ]);
  const cards: QuizCard[] = stored.map((c) => ({
    ...c,
    keywords: c.keywords ?? deriveKeywords(c.oracleText),
  }));
  return { cards, symbols };
}
