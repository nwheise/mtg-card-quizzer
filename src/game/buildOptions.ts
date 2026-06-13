import type { QuizCard, Round } from "../types.ts";

const OPTION_COUNT = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds a round for `card`: the correct option plus 8 distractors drawn from
// the same set. Distractors prefer cards sharing the prompt's primary type
// (e.g. other creatures) so the choices feel plausible, falling back to any
// card if there aren't enough. Cards whose oracle text is identical to the
// correct answer are skipped so there's never an ambiguous duplicate.
export function buildRound(card: QuizCard, allCards: QuizCard[]): Round {
  const others = allCards.filter(
    (c) => c.id !== card.id && c.oracleText !== card.oracleText,
  );

  const sameType = shuffle(
    others.filter((c) => c.primaryType === card.primaryType),
  );
  const rest = shuffle(others.filter((c) => c.primaryType !== card.primaryType));

  const distractors: QuizCard[] = [];
  const seenText = new Set<string>([card.oracleText]);
  for (const pool of [sameType, rest]) {
    for (const c of pool) {
      if (distractors.length >= OPTION_COUNT - 1) break;
      if (seenText.has(c.oracleText)) continue;
      seenText.add(c.oracleText);
      distractors.push(c);
    }
  }

  const options = shuffle([card, ...distractors]);
  return {
    card,
    options,
    correctIndex: options.findIndex((c) => c.id === card.id),
  };
}
