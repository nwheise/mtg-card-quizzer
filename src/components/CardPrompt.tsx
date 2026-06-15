import type { FieldId, QuizCard, SymbolMap } from "../types.ts";
import type { Settings } from "../game/settings.ts";
import { FIELDS } from "../game/fields.ts";
import { SymbolText } from "./SymbolText.tsx";
import { FieldValue } from "./FieldValue.tsx";

// The prompt, styled to echo the top of a real Magic card: a title bar with the
// name on the left (and the mana cost on the right, when it's prompt info), the
// art below, and the type line beneath that. Which parts appear is driven by
// the player's settings — anything routed to "quiz" or "hidden" is left off so
// it can't spoil the answer.
export function CardPrompt({
  card,
  symbols,
  settings,
}: {
  card: QuizCard;
  symbols: SymbolMap;
  settings: Settings;
}) {
  // Sagas use a different frame: their rules text lives in a left-hand column
  // that Scryfall's art_crop includes, which spoils the card. We crop to the
  // right portion of that image, which is just the art.
  const isSaga = /\bSaga\b/.test(card.typeLine);

  const showCost = settings.manaCost === "prompt" && FIELDS.manaCost.has(card);
  const showSubtype =
    settings.typeLine === "prompt" && FIELDS.typeLine.has(card);

  // Parts shown as labeled rows beneath the type line. (Mana cost and the
  // subtype get bespoke placement above, so they're excluded here.)
  const infoFields = (
    ["keywords", "powerToughness", "oracleText"] as FieldId[]
  ).filter((id) => settings[id] === "prompt" && FIELDS[id].has(card));

  return (
    <div className="card-prompt">
      <div className="card-frame">
        <div className="card-titlebar">
          <span className="card-title-name">{card.name}</span>
          {showCost && (
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
        <div className="card-typeline">
          {card.primaryType}
          {showSubtype && ` — ${FIELDS.typeLine.value(card)}`}
        </div>

        {infoFields.length > 0 && (
          <div className="card-prompt-info">
            {infoFields.map((id) => (
              <div className="prompt-field" key={id}>
                <span className="prompt-field-label">{FIELDS[id].label}</span>
                <span className="prompt-field-value">
                  <FieldValue field={id} card={card} symbols={symbols} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
