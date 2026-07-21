import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuizCard, Round, SetInfo, SymbolMap } from "./types.ts";
import { loadGameData } from "./data/loadCards.ts";
import { buildRound } from "./game/buildOptions.ts";
import { selectCard } from "./game/selectCard.ts";
import {
  loadProgress,
  recordAnswer,
  saveProgress,
  type Progress,
} from "./game/progress.ts";
import {
  loadSettings,
  saveSettings,
  loadSelectedSets,
  saveSelectedSets,
  cardsInSets,
  eligibleCards,
  pickQuizField,
  type Settings,
} from "./game/settings.ts";
import { FIELDS } from "./game/fields.ts";
import { promptFrame } from "./game/frame.ts";
import { CardPrompt } from "./components/CardPrompt.tsx";
import { OptionsGrid } from "./components/OptionsGrid.tsx";
import { Scoreboard } from "./components/Scoreboard.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";

interface SessionScore {
  answered: number;
  correct: number;
  streak: number;
}

const ZERO_SCORE: SessionScore = { answered: 0, correct: 0, streak: 0 };

export function App() {
  const [cards, setCards] = useState<QuizCard[] | null>(null);
  const [symbols, setSymbols] = useState<SymbolMap>({});
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [round, setRound] = useState<Round | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [score, setScore] = useState<SessionScore>(ZERO_SCORE);
  const headerRef = useRef<HTMLElement>(null);

  // Load card + symbol + set data once.
  useEffect(() => {
    loadGameData()
      .then(({ cards, symbols, sets }) => {
        setSymbols(symbols);
        setSets(sets);
        setSelectedSets(loadSelectedSets(sets));
        setCards(cards);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  // The deck actually in play: only cards from the selected sets.
  const deck = useMemo(
    () => (cards ? cardsInSets(cards, selectedSets) : []),
    [cards, selectedSets],
  );

  const nextRound = useCallback(
    (
      deck: QuizCard[],
      prog: Progress,
      previousId: string | null,
      config: Settings,
    ) => {
      // Only consider cards that have something to quiz under these settings
      // (e.g. power/toughness can't be quizzed on a non-creature).
      const pool = eligibleCards(deck, config);
      const card = selectCard(pool.length > 0 ? pool : deck, prog, previousId);
      const quizField = pickQuizField(card, config);
      setRound(buildRound(card, deck, quizField));
      setPickedIndex(null);
    },
    [],
  );

  // Kick off the first round once data is ready (and there's a deck to play).
  useEffect(() => {
    if (deck.length > 0 && !round) nextRound(deck, progress, null, settings);
  }, [deck, round, progress, settings, nextRound]);

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

      // On narrow screens the options sit below the fold, so after answering
      // scroll back up to reveal the full card. Stop at the divider line under
      // the header rather than the very top, so the card lands just below it.
      const header = headerRef.current;
      if (header && window.matchMedia("(max-width: 899px)").matches) {
        const top = header.getBoundingClientRect().bottom + window.scrollY - 12;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      }
    },
    [round, pickedIndex, score, progress],
  );

  const handleNext = useCallback(() => {
    if (deck.length === 0 || !round || pickedIndex === null) return;
    nextRound(deck, progress, round.card.id, settings);
  }, [deck, round, pickedIndex, progress, settings, nextRound]);

  // Changing what's quizzed invalidates the current round, so start a fresh one.
  const handleSettingsChange = useCallback(
    (next: Settings) => {
      setSettings(next);
      saveSettings(next);
      if (deck.length > 0) nextRound(deck, progress, round?.card.id ?? null, next);
    },
    [deck, progress, round, nextRound],
  );

  // Changing the selected sets swaps the deck out from under the round, so
  // rebuild from the new deck (or clear the round if nothing's selected).
  const handleSetsChange = useCallback(
    (next: string[]) => {
      setSelectedSets(next);
      saveSelectedSets(next);
      if (!cards) return;
      const nextDeck = cardsInSets(cards, next);
      if (nextDeck.length > 0) nextRound(nextDeck, progress, null, settings);
      else setRound(null);
    },
    [cards, progress, settings, nextRound],
  );

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

  const question = round
    ? `Which ${FIELDS[round.quizField].noun} belongs to this card?`
    : "";

  // The prompt card's frame colour, shared by the card and the answer boxes.
  const frame = round ? promptFrame(round.card, settings) : "neutral";
  // The card's set symbol, stamped on the type bar and coloured by rarity.
  const setIcon = round
    ? sets.find((s) => s.code === round.card.set)?.icon
    : undefined;

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

  if (!cards) {
    return (
      <main className="app">
        <div className="message">Loading cards…</div>
      </main>
    );
  }

  const selectedInfo = sets.filter((s) => selectedSets.includes(s.code));
  const subtitle =
    selectedInfo.length === 0
      ? "No sets selected"
      : selectedInfo.length === 1
        ? `Set: ${selectedInfo[0].name} (${selectedInfo[0].code.toUpperCase()})`
        : `Sets: ${selectedInfo.map((s) => s.name).join(", ")}`;

  return (
    <>
      {/* The current card's art, blurred out behind the page, so the room takes
          on the colour of whatever's being quizzed. */}
      <div
        className="backdrop"
        style={{ backgroundImage: `url(${round?.card.artCrop ?? ""})` }}
        aria-hidden
      />
      <div className="backdrop-veil" aria-hidden />

      <main className="app">
        <header className="app-header" ref={headerRef}>
          <div className="app-title">
            <h1>Magic: The Gathering Card Quizzer</h1>
            <p className="app-subtitle">{subtitle}</p>
          </div>
          <div className="header-right">
            <Scoreboard
              answered={score.answered}
              correct={score.correct}
              streak={score.streak}
              bestStreak={progress.bestStreak}
            />
            <SettingsPanel
              settings={settings}
              onChange={handleSettingsChange}
              sets={sets}
              selectedSets={selectedSets}
              onSetsChange={handleSetsChange}
            />
          </div>
        </header>

        {round ? (
          <>
            <CardPrompt
              card={round.card}
              quizField={round.quizField}
              frame={frame}
              setIcon={setIcon}
              symbols={symbols}
              settings={settings}
              revealed={pickedIndex !== null}
            />

            <div className="play">
              <div className="play-bar">
                <p className={`feedback ${answeredCorrectly ? "feedback--ok" : pickedIndex !== null ? "feedback--bad" : ""}`}>
                  {feedback ?? question}
                </p>

                <button
                  type="button"
                  className="next-button"
                  onClick={handleNext}
                  disabled={pickedIndex === null}
                >
                  Next card →
                </button>
              </div>

              <OptionsGrid
                round={round}
                frame={frame}
                symbols={symbols}
                pickedIndex={pickedIndex}
                onPick={handlePick}
              />
            </div>
          </>
        ) : (
          <div className="message">
            {deck.length === 0
              ? "No sets selected — open the settings menu and pick at least one set to start quizzing."
              : "Loading…"}
          </div>
        )}
      </main>
    </>
  );
}
