import type { FieldId, QuizCard } from "../types.ts";

// Each configurable part of a card. `value` is the canonical string used both
// to render the part and to dedupe distractors; `has` says whether a card
// actually carries this part (a non-creature has no power/toughness, a vanilla
// creature has no keywords, etc.) so we never quiz on something that's N/A.
export interface FieldDef {
  id: FieldId;
  label: string; // shown in the settings panel and prompt
  noun: string; // fills "Which ___ belongs to this card?"
  value: (card: QuizCard) => string;
  has: (card: QuizCard) => boolean;
}

// The subtype portion of a type line, i.e. everything after the em dash
// ("Creature — Human Spider Hero" -> "Human Spider Hero"). The primary type is
// always shown separately, so this is the only configurable part.
function subtypes(card: QuizCard): string {
  const i = card.typeLine.indexOf("—");
  return i >= 0 ? card.typeLine.slice(i + 1).trim() : "";
}

export const FIELDS: Record<FieldId, FieldDef> = {
  oracleText: {
    id: "oracleText",
    label: "Oracle text",
    noun: "oracle text",
    value: (c) => c.oracleText,
    has: (c) => c.oracleText.trim().length > 0,
  },
  manaCost: {
    id: "manaCost",
    label: "Mana cost",
    noun: "mana cost",
    value: (c) => c.manaCost,
    has: (c) => c.manaCost.trim().length > 0,
  },
  typeLine: {
    id: "typeLine",
    label: "Type line",
    noun: "type line",
    value: subtypes,
    has: (c) => subtypes(c).length > 0,
  },
  keywords: {
    id: "keywords",
    label: "Keywords",
    noun: "set of keywords",
    value: (c) => c.keywords.join(", "),
    has: (c) => c.keywords.length > 0,
  },
  powerToughness: {
    id: "powerToughness",
    label: "Power / toughness",
    noun: "power/toughness",
    value: (c) => `${c.power}/${c.toughness}`,
    has: (c) => c.power != null && c.toughness != null,
  },
};

// Stable display order for the settings panel.
export const FIELD_IDS: FieldId[] = [
  "oracleText",
  "manaCost",
  "typeLine",
  "keywords",
  "powerToughness",
];
