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
  revealed,
}: {
  card: QuizCard;
  symbols: SymbolMap;
  settings: Settings;
  revealed: boolean;
}) {
  // Once the player has answered, replace the (deliberately partial) prompt
  // frame with the full card image so they can review the whole card.
  if (revealed && card.image) {
    return (
      <div className="card-prompt">
        <img
          className="card-full"
          src={card.image}
          alt={card.name}
          draggable={false}
        />
      </div>
    );
  }

  // Sagas use a different frame: their rules text lives in a left-hand column
  // that Scryfall's art_crop includes, which spoils the card. We crop to the
  // right portion of that image, which is just the art.
  const isSaga = /\bSaga\b/.test(card.typeLine);

  const showCost = settings.manaCost === "prompt" && FIELDS.manaCost.has(card);
  const showSubtype =
    settings.typeLine === "prompt" && FIELDS.typeLine.has(card);

  // Power/toughness sits in the frame's bottom-right corner, like a real card.
  const showPT =
    settings.powerToughness === "prompt" && FIELDS.powerToughness.has(card);

  const showOracle =
    settings.oracleText === "prompt" && FIELDS.oracleText.has(card);

  // Parts shown as labeled rows beneath the type line. (Mana cost, the subtype,
  // and power/toughness get bespoke placement, so they're excluded here.)
  // Oracle text already spells out the keywords, so when it's shown we drop the
  // separate keywords row to avoid the redundancy.
  const infoFields = (["keywords", "oracleText"] as FieldId[]).filter((id) => {
    if (settings[id] !== "prompt" || !FIELDS[id].has(card)) return false;
    if (id === "keywords" && showOracle) return false;
    return true;
  });

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

        {showPT && (
          <span className="card-pt">{FIELDS.powerToughness.value(card)}</span>
        )}
      </div>
    </div>
  );
}
