import { useState } from "react";
import type { FieldId, FieldRole } from "../types.ts";
import type { Settings } from "../game/settings.ts";
import { quizFieldIds } from "../game/settings.ts";
import { FIELD_IDS, FIELDS } from "../game/fields.ts";

const ROLES: { id: FieldRole; label: string }[] = [
  { id: "prompt", label: "Prompt" },
  { id: "quiz", label: "Quiz" },
  { id: "hidden", label: "Hidden" },
];

// A small gear/popover for routing each card part to prompt / quiz / hidden.
export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
}) {
  const [open, setOpen] = useState(false);
  const quizCount = quizFieldIds(settings).length;

  function setRole(id: FieldId, role: FieldRole) {
    if (settings[id] === role) return;
    onChange({ ...settings, [id]: role });
  }

  return (
    <div className="settings">
      <button
        type="button"
        className="settings-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        ⚙ Customize
      </button>

      {open && (
        <div className="settings-panel">
          <p className="settings-hint">
            Put each part of the card in the prompt, quiz on it, or hide it.
            When several are set to Quiz, each round picks one at random.
          </p>
          {FIELD_IDS.map((id) => (
            <div className="settings-row" key={id}>
              <span className="settings-row-label">{FIELDS[id].label}</span>
              <div className="role-toggle" role="group">
                {ROLES.map((r) => {
                  const active = settings[id] === r.id;
                  // Don't let the player remove the last remaining quiz item —
                  // there'd be nothing to quiz on.
                  const wouldEmptyQuiz =
                    r.id !== "quiz" && settings[id] === "quiz" && quizCount === 1;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`role-btn${active ? " role-btn--active" : ""}`}
                      aria-pressed={active}
                      disabled={wouldEmptyQuiz}
                      onClick={() => setRole(id, r.id)}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
