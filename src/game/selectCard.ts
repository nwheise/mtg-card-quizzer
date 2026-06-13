import type { QuizCard } from "../types.ts";
import { weightFor, type Progress } from "./progress.ts";

// Weighted-random pick of the next prompt card. Cards the user keeps missing
// carry higher weight (see progress.ts) and so resurface more often. The
// immediately-previous card is excluded so the same card never repeats twice
// in a row.
export function selectCard(
  cards: QuizCard[],
  progress: Progress,
  previousId: string | null,
): QuizCard {
  const pool = cards.filter((c) => c.id !== previousId);
  const candidates = pool.length > 0 ? pool : cards;

  const total = candidates.reduce(
    (sum, c) => sum + weightFor(progress, c.id),
    0,
  );

  let roll = Math.random() * total;
  for (const card of candidates) {
    roll -= weightFor(progress, card.id);
    if (roll <= 0) return card;
  }
  // Floating-point fallback.
  return candidates[candidates.length - 1];
}
