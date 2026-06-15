// Player customization, persisted to localStorage. Each card part is routed to
// one of three roles — shown in the prompt, quizzed on, or hidden — and when
// several parts are set to "quiz" each round picks one of them at random.

import type { FieldId, FieldRole, QuizCard } from "../types.ts";
import { FIELD_IDS, FIELDS } from "./fields.ts";

const STORAGE_KEY = "msh-settings-v1";

export type Settings = Record<FieldId, FieldRole>;

// Defaults preserve the original quiz: read the mana cost, recall the oracle
// text. The other parts start hidden and can be opted into.
export const DEFAULT_SETTINGS: Settings = {
  oracleText: "quiz",
  manaCost: "prompt",
  typeLine: "hidden",
  keywords: "hidden",
  powerToughness: "hidden",
};

// A quiz needs something to quiz on; if a stored config somehow has nothing set
// to "quiz", fall back to oracle text.
function ensureQuizable(settings: Settings): Settings {
  return quizFieldIds(settings).length > 0
    ? settings
    : { ...settings, oracleText: "quiz" };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return ensureQuizable({ ...DEFAULT_SETTINGS, ...parsed });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable (private mode / quota) — ignore.
  }
}

export function quizFieldIds(settings: Settings): FieldId[] {
  return FIELD_IDS.filter((id) => settings[id] === "quiz");
}

export function promptFieldIds(settings: Settings): FieldId[] {
  return FIELD_IDS.filter((id) => settings[id] === "prompt");
}

// The quiz fields that actually apply to this card (e.g. power/toughness only
// counts for creatures).
export function availableQuizFields(
  card: QuizCard,
  settings: Settings,
): FieldId[] {
  return quizFieldIds(settings).filter((id) => FIELDS[id].has(card));
}

// Cards that can be quizzed at all under the current settings.
export function eligibleCards(
  cards: QuizCard[],
  settings: Settings,
): QuizCard[] {
  return cards.filter((c) => availableQuizFields(c, settings).length > 0);
}

// Pick which part of `card` to quiz this round, at random among those that
// apply. Falls back to oracle text if nothing applies (shouldn't happen once
// the deck is filtered to eligible cards).
export function pickQuizField(card: QuizCard, settings: Settings): FieldId {
  const fields = availableQuizFields(card, settings);
  return fields.length > 0
    ? fields[Math.floor(Math.random() * fields.length)]
    : "oracleText";
}
