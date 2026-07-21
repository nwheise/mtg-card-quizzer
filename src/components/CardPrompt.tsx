import type { CSSProperties } from "react";
import type { FieldId, QuizCard, SymbolMap } from "../types.ts";
import type { Settings } from "../game/settings.ts";
import { FIELDS } from "../game/fields.ts";
import type { FrameId } from "../game/frame.ts";
import { SymbolText } from "./SymbolText.tsx";
import { FieldValue } from "./FieldValue.tsx";

// The prompt, drawn as a real Magic frame: a title bar with the name (and the
// mana cost on the right, when it's prompt info), an inset art window, the type
// bar, and a parchment text box. Which parts appear is driven by the player's
// settings — anything routed to "quiz" or "hidden" is left off so it can't
// spoil the answer.
export function CardPrompt({
  card,
  quizField,
  frame,
  setIcon,
  symbols,
  settings,
  revealed,
}: {
  card: QuizCard;
  quizField: FieldId;
  frame: FrameId;
  setIcon?: string;
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

  // Parts shown in the text box. (Mana cost, the subtype, and power/toughness
  // get bespoke placement, so they're excluded here.) Oracle text already
  // spells out the keywords, so when it's shown we drop the separate keywords
  // row to avoid the redundancy.
  const infoFields = (["keywords", "oracleText"] as FieldId[]).filter((id) => {
    if (settings[id] !== "prompt" || !FIELDS[id].has(card)) return false;
    if (id === "keywords" && showOracle) return false;
    return true;
  });

  return (
    <div className="card-prompt">
      <div className={`card frame--${frame}`}>
        <div className="card-plate">
          <div className="card-bar card-titlebar">
            <span className="card-title-name">{card.name}</span>
            {showCost && (
              <span className="card-title-cost">
                <SymbolText text={card.manaCost} symbols={symbols} />
              </span>
            )}
          </div>

          <div className={`card-artwindow${isSaga ? " card-artwindow--saga" : ""}`}>
            <img
              className={`card-art${isSaga ? " card-art--saga" : ""}`}
              src={card.artCrop}
              alt={card.name}
              draggable={false}
            />
          </div>

          <div className="card-bar card-typeline">
            <span>
              {card.primaryType}
              {showSubtype && ` — ${FIELDS.typeLine.value(card)}`}
            </span>
            {/* Right end of the type bar, like a printed card: the set symbol
                (Scryfall's monochrome glyph, drawn in the type-line ink) next to
                a rarity-coloured gem. */}
            <span className="rarity-cluster">
              {setIcon && (
                <span
                  className="set-glyph"
                  style={{ "--set-icon": `url("${setIcon}")` } as CSSProperties}
                  aria-label={`${card.set.toUpperCase()} set`}
                />
              )}
              <span
                className={`rarity-gem rarity--${card.rarity}`}
                title={card.rarity}
                aria-label={`${card.rarity} rarity`}
              />
            </span>
          </div>

          {/* Always rendered, even when nothing is routed here — a card without
              a text box doesn't read as a card. When it's empty, the question
              itself sits in it, set like flavour text. */}
          <div className="card-textbox">
            {infoFields.length === 0 && (
              <p className="textbox-placeholder">
                Which {FIELDS[quizField].noun}?
              </p>
            )}
            {infoFields.map((id) => (
              <div className="prompt-field" key={id}>
                {/* Rules text needs no label — it's what a text box is for. */}
                {id !== "oracleText" && (
                  <span className="prompt-field-label">{FIELDS[id].label}</span>
                )}
                <span className="prompt-field-value">
                  <FieldValue field={id} card={card} symbols={symbols} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {showPT && (
          <span className="card-pt">{FIELDS.powerToughness.value(card)}</span>
        )}
      </div>
    </div>
  );
}
