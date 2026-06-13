import type { ReactNode } from "react";
import type { SymbolMap } from "../types.ts";
import { cleanOracle } from "../game/formatText.ts";
import { InlineSymbols } from "./SymbolText.tsx";

// Matches an "ability word" prefix at the start of a line, e.g. "Power-up —"
// or "Enrage —". By Magic's typography these are italic; emphasizing them helps
// the eye find the mechanic quickly when scanning options.
const ABILITY_WORD = /^([A-Z][A-Za-z' -]{1,24}?) — /;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The strings to black out: a card's own name spoils which card it is (oracle
// text says "put a +1/+1 counter on Crossbones"). We redact each face's full
// name plus its short "legend" name (the part before the first comma, which is
// what the rules text usually uses). Longest first so the full name wins over
// the short one.
function redactionTargets(cardName: string): string[] {
  const targets = new Set<string>();
  for (const face of cardName.split(" // ")) {
    const full = face.trim();
    if (full) targets.add(full);
    const short = full.split(",")[0].trim();
    if (short) targets.add(short);
  }
  return [...targets].sort((a, b) => b.length - a.length);
}

// Case-sensitive, whole-word match of any name. A leading boundary group (in
// place of a lookbehind, which older Safari lacks) keeps us from matching
// inside another word; the trailing lookahead leaves any possessive "'s" alone.
function buildNameRegex(cardName: string): RegExp | null {
  const targets = redactionTargets(cardName);
  if (targets.length === 0) return null;
  const alt = targets.map(escapeRegExp).join("|");
  return new RegExp(`(^|[^A-Za-z0-9])(${alt})(?![A-Za-z0-9])`, "g");
}

// Renders one line, blacking out the card's own name and drawing mana symbols.
function renderLine(
  line: string,
  symbols: SymbolMap,
  nameRegex: RegExp | null,
): ReactNode {
  if (!nameRegex) return <InlineSymbols text={line} symbols={symbols} />;

  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  nameRegex.lastIndex = 0;
  while ((m = nameRegex.exec(line)) !== null) {
    const boundary = m[1];
    const name = m[2];
    const textEnd = m.index + boundary.length;
    if (textEnd > last) {
      nodes.push(
        <InlineSymbols key={key++} text={line.slice(last, textEnd)} symbols={symbols} />,
      );
    }
    nodes.push(
      <span key={key++} className="redacted" aria-label="this card">
        {name}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    nodes.push(<InlineSymbols key={key++} text={line.slice(last)} symbols={symbols} />);
  }
  return <>{nodes}</>;
}

// Renders cleaned oracle text: reminder text removed, each ability on its own
// line, ability words italicized, "//" shown as a face divider, the card's own
// name blacked out, and mana symbols drawn as icons.
export function OracleText({
  text,
  cardName,
  symbols,
}: {
  text: string;
  cardName: string;
  symbols: SymbolMap;
}) {
  const lines = cleanOracle(text).split("\n");
  const nameRegex = buildNameRegex(cardName);

  return (
    <>
      {lines.map((line, i) => {
        if (line === "//") {
          return <span key={i} className="oracle-divider" aria-hidden />;
        }
        const m = line.match(ABILITY_WORD);
        return (
          <span key={i} className="oracle-line">
            {m && <em className="ability-word">{m[1]}</em>}
            {m && " — "}
            {renderLine(m ? line.slice(m[0].length) : line, symbols, nameRegex)}
          </span>
        );
      })}
    </>
  );
}
