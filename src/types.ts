// A single quizzable card, as produced by scripts/fetch-cards.mjs.
export interface QuizCard {
  id: string;
  name: string;
  artCrop: string;
  oracleText: string;
  typeLine: string;
  primaryType: string;
  manaCost: string;
  power?: string;
  toughness?: string;
  rarity: string;
  colors: string[];
}

// Map of mana/symbol token (e.g. "{R}") to its SVG url, from symbols.json.
export type SymbolMap = Record<string, string>;

// One round of the quiz: the prompt card plus the 9 oracle-text options.
export interface Round {
  card: QuizCard;
  options: QuizCard[]; // length 9, shuffled; one of them is `card`
  correctIndex: number;
}
