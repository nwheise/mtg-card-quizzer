import type { Round, SymbolMap } from "../types.ts";
import type { FrameId } from "../game/frame.ts";
import { OptionCard, type OptionState } from "./OptionCard.tsx";

// Renders the choices for whichever part is being quizzed this round. Once the
// player has picked, every tile's visual state reflects the outcome (their pick
// + the correct answer). `frame` tints the answer boxes to match the prompt
// card's colour, the way a real card's text box is tinted.
export function OptionsGrid({
  round,
  frame,
  symbols,
  pickedIndex,
  onPick,
}: {
  round: Round;
  frame: FrameId;
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
  // On a Saga round the answers echo the card's tall chapter-text box, so the
  // tiles go portrait (see .options-grid--tall).
  const tall = !short && /\bSaga\b/.test(round.card.typeLine);

  const modifier = short
    ? " options-grid--short"
    : tall
      ? " options-grid--tall"
      : "";

  return (
    <div className={`options-grid frame--${frame}${modifier}`}>
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
