"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/character";
import type { WizardState } from "@/lib/wizard-utils";
import { useGameData } from "@/hooks/useGameData";
import { ATTRIBUTE_KEYS, ATTRIBUTE_ABBR } from "@/lib/constants";

interface CharacterPreviewProps {
  state: WizardState;
  preview: Character;
}

export function CharacterPreview({ state, preview }: CharacterPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { tribes, classes } = useGameData();
  const tribe = tribes.find((t) => t.id === state.tribeId);
  const cls = classes.find((c) => c.id === state.classId);

  const hasContent = state.tribeId || state.classId;
  if (!hasContent) return null;

  return (
    <div className="border border-border-light rounded-lg overflow-hidden bg-surface mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-raised transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Preview
          </h3>
          <span className="text-[10px] text-text-muted">
            {[tribe?.name, cls?.name].filter(Boolean).join(" / ")}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-3 pb-2 border-t border-border-light pt-2 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {ATTRIBUTE_KEYS.map((attr) => {
              const val = preview.attributes[attr];
              return (
                <div
                  key={attr}
                  className="flex items-center justify-between px-1.5 py-0.5 rounded bg-surface-raised"
                >
                  <span className="text-[9px] font-bold font-mono text-text-muted">
                    {ATTRIBUTE_ABBR[attr]}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      val > 0
                        ? "text-highlight"
                        : val < 0
                          ? "text-danger"
                          : "text-text-muted"
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { label: "HP", value: preview.combatStats.hpMax },
              { label: "STA", value: preview.combatStats.staminaMax },
              { label: "EVA", value: preview.combatStats.evasion },
              { label: "MOV", value: preview.combatStats.movement },
              { label: "ENC", value: preview.inventory.encumbranceMax },
              { label: "SPM", value: preview.magic.spellMemoryMax },
            ].map((s) => (
              <span
                key={s.label}
                className="text-[9px] bg-surface-raised rounded px-1.5 py-0.5 font-mono"
              >
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
