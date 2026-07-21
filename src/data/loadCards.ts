import type { QuizCard, SetInfo, SymbolMap } from "../types.ts";

// These files are emitted into /public by scripts/fetch-cards.mjs, so they are
// served from the site root. `import.meta.env.BASE_URL` keeps them resolvable
// when the app is hosted under a sub-path.
const base = import.meta.env.BASE_URL;

async function fetchJson<T>(name: string): Promise<T> {
  const r = await fetch(`${base}${name}`);
  if (!r.ok) throw new Error(`Failed to load ${name} (${r.status})`);
  return r.json() as Promise<T>;
}

export async function loadGameData(): Promise<{
  cards: QuizCard[];
  symbols: SymbolMap;
  sets: SetInfo[];
}> {
  const [cards, symbols, sets] = await Promise.all([
    fetchJson<QuizCard[]>("cards.json"),
    fetchJson<SymbolMap>("symbols.json"),
    fetchJson<SetInfo[]>("sets.json"),
  ]);
  return { cards, symbols, sets };
}
