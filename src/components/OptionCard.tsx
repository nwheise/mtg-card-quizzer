import type { FieldId, QuizCard, SymbolMap } from "../types.ts";
import { FieldValue } from "./FieldValue.tsx";

export type OptionState = "idle" | "correct" | "wrong" | "missed";

// One choice tile in the grid, showing the quizzed part (oracle text, mana
// cost, …) of a candidate card.
// - idle: awaiting selection (clickable)
// - correct: the tile the user picked, and it was right
// - wrong: the tile the user picked, and it was wrong
// - missed: the correct answer, revealed after a wrong pick
export function OptionCard({
  card,
  quizField,
  symbols,
  state,
  index,
  disabled,
  onPick,
}: {
  card: QuizCard;
  quizField: FieldId;
  symbols: SymbolMap;
  state: OptionState;
  index: number;
  disabled: boolean;
  onPick: () => void;
}) {
  // Oracle text wants tight, multi-line reading; the short parts read better
  // a touch larger.
  const short = quizField !== "oracleText";
  return (
    <button
      type="button"
      className={`option option--${state}${short ? " option--short" : ""}`}
      onClick={onPick}
      disabled={disabled}
    >
      <span className="option-key">{index + 1}</span>
      <span className="option-text">
        <FieldValue field={quizField} card={card} symbols={symbols} />
      </span>
    </button>
  );
}
