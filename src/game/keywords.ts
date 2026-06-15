// Derives a card's keyword abilities (Flying, Lifelink, …) from its oracle text.
//
// Scryfall exposes a parsed `keywords` array, but the build-time fetch can't
// always reach it (and it mixes in keyword *actions* like Connive/Crew). The
// ability keywords we want for the quiz are always printed verbatim on the
// card, so we recover them from the oracle text instead. This keeps the result
// identical whether or not cards.json was regenerated against a live API.

// Canonical ability keywords, longest-first so multi-word ones win the match.
// These all appear either alone on a line or in a comma-separated list, and
// never take a trailing word (only a cost like {2} or "from <color>").
const KEYWORDS = [
  "First strike",
  "Double strike",
  "Protection",
  "Deathtouch",
  "Indestructible",
  "Hexproof",
  "Vigilance",
  "Lifelink",
  "Trample",
  "Menace",
  "Defender",
  "Prowess",
  "Reach",
  "Flying",
  "Flash",
  "Haste",
  "Shroud",
  "Intimidate",
  "Skulk",
  "Fear",
  "Ward",
];

// Returns the canonical keyword a token *starts with*, but only when the token
// is "pure" — nothing follows the keyword except its cost ({2}, a number) or a
// "from <x>" clause. This rejects prose lines like "Flying creatures you
// control get +1/+1" while still catching "Ward {2}" and "Protection from red".
function leadingKeyword(token: string): string | null {
  for (const kw of KEYWORDS) {
    const re = new RegExp(`^${kw}(?![A-Za-z])`, "i");
    if (!re.test(token)) continue;
    const rest = token.slice(kw.length).trim();
    if (rest === "" || /^[{\d]/.test(rest) || /^from\b/i.test(rest)) return kw;
  }
  return null;
}

export function deriveKeywords(oracleText: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const raw of oracleText.split("\n")) {
    // Strip reminder text so "Flying (It can't be blocked…)" reads as "Flying".
    const line = raw.replace(/\s*\([^)]*\)/g, "").trim();
    if (!line) continue;
    // A keyword line begins with a keyword; prose ("Whenever…") does not.
    if (!leadingKeyword(line)) continue;
    for (const part of line.split(",")) {
      const kw = leadingKeyword(part.trim());
      if (kw && !seen.has(kw)) {
        seen.add(kw);
        found.push(kw);
      }
    }
  }
  return found;
}
