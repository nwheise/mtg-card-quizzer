import type { FieldId, QuizCard, Round } from "../types.ts";
import { FIELDS } from "./fields.ts";

const OPTION_COUNT = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds a round for `card`: the correct option plus distractors drawn from the
// same set, all showing the value of `quizField` (oracle text, mana cost, …).
// Distractors prefer cards sharing the prompt's primary type (e.g. other
// creatures) so the choices feel plausible, falling back to any card if there
// aren't enough. Cards whose value for this field is identical to the correct
// answer — or that don't have the field at all — are skipped so there's never
// an ambiguous or blank choice.
export function buildRound(
  card: QuizCard,
  allCards: QuizCard[],
  quizField: FieldId,
): Round {
  const field = FIELDS[quizField];
  const correctValue = field.value(card);

  const others = allCards.filter(
    (c) => c.id !== card.id && field.has(c) && field.value(c) !== correctValue,
  );

  const sameType = shuffle(
    others.filter((c) => c.primaryType === card.primaryType),
  );
  const rest = shuffle(others.filter((c) => c.primaryType !== card.primaryType));

  const distractors: QuizCard[] = [];
  const seenValues = new Set<string>([correctValue]);
  for (const pool of [sameType, rest]) {
    for (const c of pool) {
      if (distractors.length >= OPTION_COUNT - 1) break;
      const value = field.value(c);
      if (seenValues.has(value)) continue;
      seenValues.add(value);
      distractors.push(c);
    }
  }

  const options = shuffle([card, ...distractors]);
  return {
    card,
    quizField,
    options,
    correctIndex: options.findIndex((c) => c.id === card.id),
  };
}
