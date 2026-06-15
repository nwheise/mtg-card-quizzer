// A single quizzable card, as produced by scripts/fetch-cards.mjs.
export interface QuizCard {
  id: string;
  name: string;
  artCrop: string;
  oracleText: string;
  typeLine: string;
  primaryType: string;
  manaCost: string;
  keywords: string[];
  power?: string;
  toughness?: string;
  rarity: string;
  colors: string[];
}

// Map of mana/symbol token (e.g. "{R}") to its SVG url, from symbols.json.
export type SymbolMap = Record<string, string>;

// The parts of a card the player can independently route (see game/fields.ts).
export type FieldId =
  | "oracleText"
  | "manaCost"
  | "typeLine"
  | "keywords"
  | "powerToughness";

// Where a given card part goes: shown in the prompt, quizzed on, or hidden.
export type FieldRole = "prompt" | "quiz" | "hidden";

// One round of the quiz: the prompt card, which part is being quizzed, and the
// (up to 6) same-type options to choose from.
export interface Round {
  card: QuizCard;
  quizField: FieldId;
  options: QuizCard[]; // shuffled; one of them is `card`
  correctIndex: number;
}
