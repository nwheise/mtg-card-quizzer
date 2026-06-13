// Per-card learning progress, persisted to localStorage so it survives reloads.
// Each card carries a `weight` that drives how often it resurfaces: missing a
// card raises its weight (shows up more), getting it right lowers it.

const STORAGE_KEY = "msh-progress-v1";

export interface CardStat {
  weight: number;
  seen: number;
  correct: number;
  missed: number;
}

export interface Progress {
  cards: Record<string, CardStat>;
  bestStreak: number;
}

export const DEFAULT_WEIGHT = 1;
const MAX_WEIGHT = 16;
const MIN_WEIGHT = 0.25;

// Unseen cards are weighted above the baseline so every card gets surfaced
// before the algorithm settles into drilling the missed ones.
export const UNSEEN_WEIGHT = 4;

function emptyProgress(): Progress {
  return { cards: {}, bestStreak: 0 };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      cards: parsed.cards ?? {},
      bestStreak: parsed.bestStreak ?? 0,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage may be unavailable (private mode / quota) — ignore.
  }
}

// Current weight for a card, accounting for never-seen cards.
export function weightFor(progress: Progress, cardId: string): number {
  const stat = progress.cards[cardId];
  return stat ? stat.weight : UNSEEN_WEIGHT;
}

function statFor(progress: Progress, cardId: string): CardStat {
  return (
    progress.cards[cardId] ?? {
      weight: DEFAULT_WEIGHT,
      seen: 0,
      correct: 0,
      missed: 0,
    }
  );
}

// Returns a new Progress with the card's stats updated after an answer.
export function recordAnswer(
  progress: Progress,
  cardId: string,
  wasCorrect: boolean,
  currentStreak: number,
): Progress {
  const stat = statFor(progress, cardId);
  const weight = wasCorrect
    ? Math.max(stat.weight / 2, MIN_WEIGHT)
    : Math.min(stat.weight * 2 + 1, MAX_WEIGHT);

  return {
    cards: {
      ...progress.cards,
      [cardId]: {
        weight,
        seen: stat.seen + 1,
        correct: stat.correct + (wasCorrect ? 1 : 0),
        missed: stat.missed + (wasCorrect ? 0 : 1),
      },
    },
    bestStreak: Math.max(progress.bestStreak, currentStreak),
  };
}
