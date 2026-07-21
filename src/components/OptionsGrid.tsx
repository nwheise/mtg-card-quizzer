import type { Round, SymbolMap } from "../types.ts";
import { OptionCard, type OptionState } from "./OptionCard.tsx";

// Renders the choices for whichever part is being quizzed this round. Once the
// player has picked, every tile's visual state reflects the outcome (their pick
// + the correct answer).
export function OptionsGrid({
  round,
  symbols,
  pickedIndex,
  onPick,
}: {
  round: Round;
  symbols: SymbolMap;
  pickedIndex: number | null;
  onPick: (index: number) => void;
}) {
  const revealed = pickedIndex !== null;

  function stateFor(index: number): OptionState {
    if (!revealed) return "idle";
    if (index === round.correctIndex) {
      return index === pickedIndex ? "correct" : "missed";
    }
    if (index === pickedIndex) return "wrong";
    return "idle";
  }

  // Short answers (mana cost, P/T, …) get a tighter grid — six one-line tiles
  // stretched to full width read as empty.
  const short = round.quizField !== "oracleText";

  return (
    <div className={`options-grid${short ? " options-grid--short" : ""}`}>
      {round.options.map((card, index) => (
        <OptionCard
          key={card.id}
          card={card}
          quizField={round.quizField}
          symbols={symbols}
          index={index}
          state={stateFor(index)}
          disabled={revealed}
          onPick={() => onPick(index)}
        />
      ))}
    </div>
  );
}
