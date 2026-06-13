import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuizCard, Round, SymbolMap } from "./types.ts";
import { loadGameData } from "./data/loadCards.ts";
import { buildRound } from "./game/buildOptions.ts";
import { selectCard } from "./game/selectCard.ts";
import {
  loadProgress,
  recordAnswer,
  saveProgress,
  type Progress,
} from "./game/progress.ts";
import { CardPrompt } from "./components/CardPrompt.tsx";
import { OptionsGrid } from "./components/OptionsGrid.tsx";
import { Scoreboard } from "./components/Scoreboard.tsx";

interface SessionScore {
  answered: number;
  correct: number;
  streak: number;
}

const ZERO_SCORE: SessionScore = { answered: 0, correct: 0, streak: 0 };

export function App() {
  const [cards, setCards] = useState<QuizCard[] | null>(null);
  const [symbols, setSymbols] = useState<SymbolMap>({});
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [round, setRound] = useState<Round | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [score, setScore] = useState<SessionScore>(ZERO_SCORE);

  // Load card + symbol data once.
  useEffect(() => {
    loadGameData()
      .then(({ cards, symbols }) => {
        setSymbols(symbols);
        setCards(cards);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  const nextRound = useCallback(
    (deck: QuizCard[], prog: Progress, previousId: string | null) => {
      const card = selectCard(deck, prog, previousId);
      setRound(buildRound(card, deck));
      setPickedIndex(null);
    },
    [],
  );

  // Kick off the first round once data is ready.
  useEffect(() => {
    if (cards && !round) nextRound(cards, progress, null);
  }, [cards, round, progress, nextRound]);

  const handlePick = useCallback(
    (index: number) => {
      if (!round || pickedIndex !== null) return; // already answered
      setPickedIndex(index);

      const wasCorrect = index === round.correctIndex;
      const newStreak = wasCorrect ? score.streak + 1 : 0;
      setScore({
        answered: score.answered + 1,
        correct: score.correct + (wasCorrect ? 1 : 0),
        streak: newStreak,
      });

      const updated = recordAnswer(
        progress,
        round.card.id,
        wasCorrect,
        newStreak,
      );
      setProgress(updated);
      saveProgress(updated);
    },
    [round, pickedIndex, score, progress],
  );

  const handleNext = useCallback(() => {
    if (!cards || !round || pickedIndex === null) return;
    nextRound(cards, progress, round.card.id);
  }, [cards, round, pickedIndex, progress, nextRound]);

  // Keyboard: 1-9 to pick, Enter/Space to advance.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pickedIndex === null) {
        const n = Number(e.key);
        if (round && n >= 1 && n <= round.options.length) handlePick(n - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickedIndex, round, handlePick, handleNext]);

  const answeredCorrectly =
    pickedIndex !== null && round !== null && pickedIndex === round.correctIndex;

  const feedback = useMemo(() => {
    if (pickedIndex === null) return null;
    return answeredCorrectly ? "Correct!" : "Not quite — the right answer is highlighted.";
  }, [pickedIndex, answeredCorrectly]);

  if (error) {
    return (
      <main className="app">
        <div className="message error">
          <p>Couldn't load card data: {error}</p>
          <p>
            Run <code>npm run fetch</code> to generate{" "}
            <code>public/cards.json</code>, then reload.
          </p>
        </div>
      </main>
    );
  }

  if (!cards || !round) {
    return (
      <main className="app">
        <div className="message">Loading Marvel Super Heroes cards…</div>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>MSH Card Quizzer</h1>
        <Scoreboard
          answered={score.answered}
          correct={score.correct}
          streak={score.streak}
          bestStreak={progress.bestStreak}
        />
      </header>

      <CardPrompt card={round.card} symbols={symbols} />

      <div className="play">
        <p className={`feedback ${answeredCorrectly ? "feedback--ok" : pickedIndex !== null ? "feedback--bad" : ""}`}>
          {feedback ?? "Which oracle text belongs to this card?"}
        </p>

        <OptionsGrid
          round={round}
          symbols={symbols}
          pickedIndex={pickedIndex}
          onPick={handlePick}
        />

        <div className="controls">
          <button
            type="button"
            className="next-button"
            onClick={handleNext}
            disabled={pickedIndex === null}
          >
            Next card →
          </button>
        </div>
      </div>
    </main>
  );
}
