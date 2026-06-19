"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { EditableSelect } from "@/components/ui/EditableSelect";
import { DerivedField } from "@/components/ui/DerivedField";
import { TribeSelectorModal } from "./TribeSelectorModal";
import { ClassSelectorModal } from "./ClassSelectorModal";
import { useGameData } from "@/hooks/useGameData";
import { applyTribeStats, applyClassTrainings } from "@/lib/utils";
import meritThresholds from "../../../data/merit-thresholds.json";

interface CharacterHeaderProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function CharacterHeader({ character, onUpdate }: CharacterHeaderProps) {
  const { tribes, classes, zodiac } = useGameData();
  const [showTribeModal, setShowTribeModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const selectedClass = classes.find((c) => c.id === character.class);

  const zodiacOptions = zodiac.map((z) => ({
    value: z.id,
    label: z.name,
  }));

  const selectedTribe = tribes.find((t) => t.id === character.tribe);

  const nextThreshold = meritThresholds.find((t) => t.level === character.level + 1);
  const levelHint = nextThreshold
    ? `${character.merit}/${nextThreshold.meritRequired}`
    : "max";

  const handleTribeSelect = (tribeId: string, startingBonus?: { name: string; description: string }) => {
    onUpdate((prev) => applyTribeStats(prev, tribeId, startingBonus));
  };

  return (
    <div className="bg-surface border border-border-light rounded-lg">
      <div className="flex items-center gap-2 p-3">
        <EditableField
          value={character.name}
          onChange={(v) => onUpdate((p) => ({ ...p, name: String(v) }))}
          placeholder="Character Name"
          className="flex-1 text-lg font-bold"
          displayClassName="text-lg font-bold"
          inputClassName="text-lg font-bold"
        />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 p-1 rounded hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
                Tribe
              </label>
              <button
                type="button"
                onClick={() => setShowTribeModal(true)}
                className={`w-full text-left bg-surface border border-border-light rounded px-2 py-1 text-sm outline-none hover:border-accent transition-colors cursor-pointer ${
                  selectedTribe ? "text-text" : "text-text-muted italic"
                }`}
              >
                {selectedTribe ? selectedTribe.name : "Select Tribe"}
              </button>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
                Class
              </label>
              <button
                type="button"
                onClick={() => setShowClassModal(true)}
                className={`w-full text-left bg-surface border border-border-light rounded px-2 py-1 text-sm outline-none hover:border-accent transition-colors cursor-pointer ${
                  selectedClass ? "text-text" : "text-text-muted italic"
                }`}
              >
                {selectedClass ? selectedClass.name : "Select Class"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableField
              value={character.specialization}
              onChange={(v) => onUpdate((p) => ({ ...p, specialization: String(v) }))}
              label="Specialization"
              placeholder="—"
            />
            <DerivedField
              value={character.level}
              label="Level"
              hint={levelHint}
            />
            <EditableField
              value={character.merit}
              onChange={(v) => onUpdate((p) => ({ ...p, merit: v as number }))}
              type="number"
              min={0}
              label="Merit"
            />
          </div>

          <EditableSelect
            value={character.zodiac}
            onChange={(v) => onUpdate((p) => ({ ...p, zodiac: v }))}
            options={zodiacOptions}
            label="Zodiac"
            placeholder="Select Zodiac"
          />
        </div>
      )}

      <TribeSelectorModal
        isOpen={showTribeModal}
        onClose={() => setShowTribeModal(false)}
        onSelect={handleTribeSelect}
        currentTribeId={character.tribe}
      />

      <ClassSelectorModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        onSelect={(classId) => onUpdate((p) => applyClassTrainings(p, classId))}
        currentClassId={character.class}
      />
    </div>
  );
}
