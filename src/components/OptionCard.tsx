import { useLayoutEffect, useRef } from "react";
import type { FieldId, QuizCard, SymbolMap } from "../types.ts";
import { FieldValue } from "./FieldValue.tsx";

export type OptionState = "idle" | "correct" | "wrong" | "missed";

// Font-size bounds (px) for fitting oracle text into a fixed-size box.
const FIT_MAX = 15;
const FIT_MIN = 6.5;

// Shrinks the referenced element's font-size until its content stops
// overflowing, so a long oracle text fits its box without a scrollbar — the way
// a printed card shrinks its rules text to fit. Binary search between FIT_MIN
// and FIT_MAX; re-runs when the content (deps) or the box size (ResizeObserver)
// changes. A no-op when inactive (short answers already fit).
function useFitText(active: boolean, deps: unknown[]) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    const fits = () =>
      el.scrollHeight <= el.clientHeight + 0.5 &&
      el.scrollWidth <= el.clientWidth + 0.5;

    const fit = () => {
      el.style.fontSize = `${FIT_MAX}px`;
      if (fits()) return;
      let lo = FIT_MIN;
      let hi = FIT_MAX;
      while (hi - lo > 0.3) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// One choice tile in the grid, showing the quizzed part (oracle text, mana
// cost, …) of a candidate card, laid out like a card's text box.
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
  // Oracle text is dense and gets fit-to-box; the short parts are a line or two
  // and read better a touch larger.
  const short = quizField !== "oracleText";
  const fitRef = useFitText(!short, [card.id, quizField]);

  return (
    <div className="option-slot">
      <button
        type="button"
        className={`option option--${state}${short ? " option--short" : ""}`}
        onClick={onPick}
        disabled={disabled}
      >
        <span className="option-index">{index + 1}</span>
        <span className="option-text" ref={short ? undefined : fitRef}>
          <FieldValue field={quizField} card={card} symbols={symbols} />
        </span>
      </button>
    </div>
  );
}
