// Cleans Scryfall oracle text for display in option tiles:
// - removes reminder text (the italic parenthetical explanations) — ~20% of the
//   text on a third of the cards, and never the part that identifies a card
// - tidies whitespace left behind by the removal
// Newlines (one ability per line) and the "//" face separator are preserved.
export function cleanOracle(text: string): string {
  return text
    .replace(/\s*\([^)]*\)/g, "") // drop reminder text
    .replace(/[ \t]+\n/g, "\n") // trailing spaces before a break
    .replace(/[ \t]{2,}/g, " ") // collapsed double spaces
    .replace(/\n{2,}/g, "\n") // blank lines left behind
    .trim();
}
