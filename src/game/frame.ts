import type { QuizCard } from "../types.ts";
import type { Settings } from "./settings.ts";
import { FIELDS } from "./fields.ts";

// Which Magic frame colour a card wears. Mirrors the printed frames: mono-
// coloured cards take their colour, multicolour cards are gold, colourless
// nonland permanents are the artifact "steel", and lands are brown. "neutral"
// is the fallback plate used whenever showing the real colour would spoil the
// answer.
export type FrameId =
  | "neutral"
  | "w"
  | "u"
  | "b"
  | "r"
  | "g"
  | "gold"
  | "artifact"
  | "land";

const BY_COLOR: Record<string, FrameId> = {
  W: "w",
  U: "u",
  B: "b",
  R: "r",
  G: "g",
};

export function frameFor(card: QuizCard): FrameId {
  if (card.primaryType === "Land") return "land";
  if (card.colors.length > 1) return "gold";
  if (card.colors.length === 1) return BY_COLOR[card.colors[0]] ?? "artifact";
  return "artifact";
}

// The frame to actually paint, given the player's settings. A card's colour is
// carried by its mana cost, so showing the coloured frame while the mana cost
// is being quizzed (or hidden) would give the answer away — fall back to the
// neutral plate unless the cost is already on show in the prompt.
export function promptFrame(card: QuizCard, settings: Settings): FrameId {
  const costShown = settings.manaCost === "prompt" && FIELDS.manaCost.has(card);
  return costShown ? frameFor(card) : "neutral";
}
