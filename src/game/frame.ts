import type { QuizCard } from "../types.ts";

// Which Magic frame colour a card wears. Mirrors the printed frames: mono-
// coloured cards take their colour, multicolour cards are gold, colourless
// nonland permanents are the artifact "steel", and lands are brown.
export type FrameId =
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
