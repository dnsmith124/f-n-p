"use client";

import { useState } from "react";
import { useGameData } from "@/hooks/useGameData";
import {
  AttrBonuses,
  BonusSelector,
  StatPills,
} from "@/components/character-sheet/TribeSelectorModal";
import type { WizardState } from "@/lib/wizard-utils";

interface TribeStepProps {
  state: WizardState;
  onSelectTribe: (
    tribeId: string,
    bonus: { name: string; description: string } | null
  ) => void;
  onSelectBonus: (bonus: { name: string; description: string }) => void;
}

export function TribeStep({
  state,
  onSelectTribe,
  onSelectBonus,
}: TribeStepProps) {
  const { tribes } = useGameData();
  const [expandedId, setExpandedId] = useState<string | null>(
    state.tribeId || null
  );
  const [selectedBonuses, setSelectedBonuses] = useState<
    Record<string, string>
  >(() => {
    if (state.tribeId && state.startingBonus) {
      return { [state.tribeId]: state.startingBonus.name };
    }
    return {};
  });

  const isSelectableBonus = (b: { name: string }) =>
    !b.name.match(/^\d+['']\s*\d+/) && b.name !== "ADVANCEMENT BONUSES";

  const handleSelectTribe = (tribeId: string) => {
    const tribe = tribes.find((t) => t.id === tribeId);
    const selectable = tribe?.startingBonuses.filter(isSelectableBonus) ?? [];
    const chosenName = selectedBonuses[tribeId];
    const bonus =
      selectable.find((b) => b.name === chosenName) ?? selectable[0] ?? null;
    onSelectTribe(tribeId, bonus);
  };

  const handleBonusChange = (tribeId: string, bonusName: string) => {
    setSelectedBonuses((prev) => ({ ...prev, [tribeId]: bonusName }));
    if (tribeId === state.tribeId) {
      const tribe = tribes.find((t) => t.id === tribeId);
      const bonus = tribe?.startingBonuses.find((b) => b.name === bonusName);
      if (bonus) onSelectBonus(bonus);
    }
  };

  return (
    <div className="space-y-2">
      <div className="mb-3">
        <h2 className="text-base font-bold text-text">Choose Your Tribe</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Your tribe determines starting stats, attribute bonuses, and unique
          abilities.
        </p>
      </div>

      {tribes.map((tribe) => {
        const isExpanded = expandedId === tribe.id;
        const isSelected = tribe.id === state.tribeId;

        return (
          <div
            key={tribe.id}
            className={`border rounded-lg overflow-hidden transition-colors ${
              isSelected
                ? "border-accent bg-accent/5"
                : "border-border-light bg-surface"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setExpandedId(isExpanded ? null : tribe.id)
              }
              className="w-full text-left px-3 py-2.5 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{tribe.name}</span>
                  {isSelected && (
                    <span className="text-[9px] uppercase tracking-wider text-accent font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <AttrBonuses tribe={tribe} />
              </div>
              <svg
                className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${
                  isExpanded ? "rotate-180" : ""
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

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-border-light pt-2">
                <StatPills tribe={tribe} />

                <p className="text-xs text-text-secondary leading-relaxed">
                  {tribe.description}
                </p>

                {tribe.physicalDescription && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
                      Physical Description
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {tribe.physicalDescription}
                    </p>
                  </div>
                )}

                {tribe.gameplayNotes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
                      Special Rules
                    </h4>
                    <ul className="text-xs text-text-secondary space-y-0.5">
                      {tribe.gameplayNotes.map((note, i) => (
                        <li key={i} className="flex gap-1">
                          <span className="text-text-muted shrink-0">
                            &bull;
                          </span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <BonusSelector
                  tribe={tribe}
                  chosen={selectedBonuses[tribe.id]}
                  onChoose={(name) => handleBonusChange(tribe.id, name)}
                />

                <button
                  type="button"
                  onClick={() => handleSelectTribe(tribe.id)}
                  className={`w-full text-center text-sm font-bold py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-surface-raised text-text-muted"
                      : "bg-accent text-bg hover:opacity-90"
                  }`}
                >
                  {isSelected ? "Selected" : `Select ${tribe.name}`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
