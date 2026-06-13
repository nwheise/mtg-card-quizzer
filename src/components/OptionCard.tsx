import type { QuizCard, SymbolMap } from "../types.ts";
import { OracleText } from "./OracleText.tsx";

export type OptionState = "idle" | "correct" | "wrong" | "missed";

// One oracle-text tile in the 3x3 grid.
// - idle: awaiting selection (clickable)
// - correct: the tile the user picked, and it was right
// - wrong: the tile the user picked, and it was wrong
// - missed: the correct answer, revealed after a wrong pick
export function OptionCard({
  card,
  symbols,
  state,
  index,
  disabled,
  onPick,
}: {
  card: QuizCard;
  symbols: SymbolMap;
  state: OptionState;
  index: number;
  disabled: boolean;
  onPick: () => void;
}) {
  const hasPT = card.power != null && card.toughness != null;
  return (
    <button
      type="button"
      className={`option option--${state}${hasPT ? " option--pt" : ""}`}
      onClick={onPick}
      disabled={disabled}
    >
      <span className="option-key">{index + 1}</span>
      <span className="option-text">
        <OracleText text={card.oracleText} cardName={card.name} symbols={symbols} />
      </span>
      {hasPT && (
        <span className="option-pt">
          {card.power}/{card.toughness}
        </span>
      )}
    </button>
  );
}
