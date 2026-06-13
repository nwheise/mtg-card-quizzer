import type { QuizCard, SymbolMap } from "../types.ts";
import { SymbolText } from "./SymbolText.tsx";

// The prompt, styled to echo the top of a real Magic card: a title bar with the
// name on the left and the mana cost on the right, the art below, and the
// primary type beneath that. Rules text is never shown — that's the recall task.
export function CardPrompt({
  card,
  symbols,
}: {
  card: QuizCard;
  symbols: SymbolMap;
}) {
  // Sagas use a different frame: their rules text lives in a left-hand column
  // that Scryfall's art_crop includes, which spoils the card. We crop to the
  // right portion of that image, which is just the art.
  const isSaga = /\bSaga\b/.test(card.typeLine);

  return (
    <div className="card-prompt">
      <div className="card-frame">
        <div className="card-titlebar">
          <span className="card-title-name">{card.name}</span>
          {card.manaCost && (
            <span className="card-title-cost">
              <SymbolText text={card.manaCost} symbols={symbols} />
            </span>
          )}
        </div>
        <img
          className={`card-art${isSaga ? " card-art--saga" : ""}`}
          src={card.artCrop}
          alt={card.name}
          draggable={false}
        />
        <div className="card-typeline">{card.primaryType}</div>
      </div>
    </div>
  );
}
