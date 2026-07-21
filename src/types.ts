// A single quizzable card, as produced by scripts/fetch-cards.mjs.
export interface QuizCard {
  id: string;
  // Scryfall set code this card belongs to (e.g. "msh", "hob").
  set: string;
  name: string;
  artCrop: string;
  // Full card image (Scryfall `normal`), shown after answering to review the
  // whole card.
  image: string;
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

// One selectable set, from sets.json (written by scripts/fetch-cards.mjs).
// `count` is the number of quiz cards the set contributes; `released` is the
// Scryfall release date (ISO) used to pick the newest set as the default.
export interface SetInfo {
  code: string;
  name: string;
  released: string;
  count: number;
  // The set's symbol as a monochrome SVG url (Scryfall `icon_svg_uri`), masked
  // with a rarity colour to stand in for the printed set symbol. Optional so
  // older sets.json files without it still load.
  icon?: string;
}

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
