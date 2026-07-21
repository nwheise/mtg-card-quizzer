import { useState } from "react";
import type { FieldId, FieldRole, SetInfo } from "../types.ts";
import type { Settings } from "../game/settings.ts";
import { quizFieldIds } from "../game/settings.ts";
import { FIELD_IDS, FIELDS } from "../game/fields.ts";

const ROLES: { id: FieldRole; label: string }[] = [
  { id: "prompt", label: "Prompt" },
  { id: "quiz", label: "Quiz" },
  { id: "hidden", label: "Hidden" },
];

// A small gear/popover for choosing which sets are in play and routing each
// card part to prompt / quiz / hidden.
export function SettingsPanel({
  settings,
  onChange,
  sets,
  selectedSets,
  onSetsChange,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  sets: SetInfo[];
  selectedSets: string[];
  onSetsChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const quizCount = quizFieldIds(settings).length;

  function setRole(id: FieldId, role: FieldRole) {
    if (settings[id] === role) return;
    onChange({ ...settings, [id]: role });
  }

  function toggleSet(code: string) {
    const on = selectedSets.includes(code);
    // Don't let the player deselect the last remaining set — there'd be no
    // cards to quiz on.
    if (on && selectedSets.length === 1) return;
    const next = on
      ? selectedSets.filter((c) => c !== code)
      : [...selectedSets, code];
    onSetsChange(next);
  }

  return (
    <div className="settings">
      <button
        type="button"
        className="settings-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Customize"
        title="Customize"
      >
        <svg
          className="settings-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="settings-panel">
          <p className="settings-section-label">Sets</p>
          <p className="settings-hint">
            Choose which sets to quiz from. Each question's wrong answers are
            drawn from the shown card's own set.
          </p>
          {sets.map((s) => {
            const checked = selectedSets.includes(s.code);
            // Can't turn off the last selected set.
            const locked = checked && selectedSets.length === 1;
            return (
              <label className="settings-set-row" key={s.code}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={() => toggleSet(s.code)}
                />
                <span className="settings-set-name">{s.name}</span>
                <span className="settings-set-meta">
                  {s.code.toUpperCase()} · {s.count}
                </span>
              </label>
            );
          })}

          <p className="settings-section-label settings-section-label--spaced">
            Card parts
          </p>
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
