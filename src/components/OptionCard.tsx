import { useLayoutEffect, useRef } from "react";
import type { FieldId, QuizCard, SymbolMap } from "../types.ts";
import { FieldValue } from "./FieldValue.tsx";

export type OptionState = "idle" | "correct" | "wrong" | "missed";

// Font-size bounds, in cqh (percent of the box height). Because the answer box
// keeps a fixed aspect ratio, a font sized in cqh is scale-invariant: the text
// wraps to the same lines at any window size, so the box and its text grow and
// shrink together and the text-to-box ratio never changes.
const FIT_MAX = 6.5;
const FIT_MIN = 2.6;

// Finds the largest cqh font-size at which the content stops overflowing, so a
// long oracle text fits its box without a scrollbar — the way a printed card
// shrinks its rules text to fit. Binary search, run once per content change
// (deps); no resize handling needed since the cqh size scales with the box.
function useFitText(active: boolean, deps: unknown[]) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    const fits = () =>
      el.scrollHeight <= el.clientHeight + 0.5 &&
      el.scrollWidth <= el.clientWidth + 0.5;

    let cancelled = false;
    const fit = () => {
      if (cancelled || !el.isConnected) return;
      el.style.fontSize = `${FIT_MAX}cqh`;
      if (fits()) return;
      let lo = FIT_MIN;
      let hi = FIT_MAX;
      while (hi - lo > 0.05) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}cqh`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}cqh`;
    };

    fit();
    // The card fonts load async; text metrics change once they do, so re-fit.
    document.fonts?.ready.then(fit);
    return () => {
      cancelled = true;
    };
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
