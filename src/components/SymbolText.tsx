import { Fragment } from "react";
import type { SymbolMap } from "../types.ts";

const TOKEN = /(\{[^}]+\})/g;

// Renders a single line of text, replacing {SYMBOL} tokens with their Scryfall
// SVG icons. No newline handling — feed it one line at a time.
export function InlineSymbols({
  text,
  symbols,
}: {
  text: string;
  symbols: SymbolMap;
}) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        const url = symbols[part];
        if (url) {
          return (
            <img
              key={i}
              className="mana-symbol"
              src={url}
              alt={part}
              draggable={false}
            />
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

// Multi-line variant: splits on newlines and renders each line's symbols.
// Used for short strings like a card's mana cost.
export function SymbolText({
  text,
  symbols,
}: {
  text: string;
  symbols: SymbolMap;
}) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <InlineSymbols text={line} symbols={symbols} />
        </Fragment>
      ))}
    </>
  );
}
