"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { EditableSelect } from "@/components/ui/EditableSelect";
import { DerivedField } from "@/components/ui/DerivedField";
import { TribeSelectorModal } from "./TribeSelectorModal";
import { useGameData } from "@/hooks/useGameData";
import { applyTribeStats } from "@/lib/utils";
import meritThresholds from "../../../data/merit-thresholds.json";

interface CharacterHeaderProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function CharacterHeader({ character, onUpdate }: CharacterHeaderProps) {
  const { tribes, classes } = useGameData();
  const [showTribeModal, setShowTribeModal] = useState(false);

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.name}${c.type !== "base" ? ` (${c.type})` : ""}`,
  }));

  const selectedTribe = tribes.find((t) => t.id === character.tribe);

  const nextThreshold = meritThresholds.find((t) => t.level === character.level + 1);
  const levelHint = nextThreshold
    ? `${character.merit}/${nextThreshold.meritRequired}`
    : "max";

  const handleTribeSelect = (tribeId: string) => {
    onUpdate((prev) => applyTribeStats(prev, tribeId));
  };

  return (
    <div className="bg-surface border border-border-light rounded-lg p-3 space-y-2">
      <EditableField
        value={character.name}
        onChange={(v) => onUpdate((p) => ({ ...p, name: String(v) }))}
        placeholder="Character Name"
        className="text-lg font-bold"
        displayClassName="text-lg font-bold"
        inputClassName="text-lg font-bold"
      />

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
        <EditableSelect
          value={character.class}
          onChange={(v) => onUpdate((p) => ({ ...p, class: v }))}
          options={classOptions}
          label="Class"
          placeholder="Select Class"
        />
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

      <EditableField
        value={character.zodiac}
        onChange={(v) => onUpdate((p) => ({ ...p, zodiac: String(v) }))}
        label="Zodiac"
        placeholder="—"
      />

      <TribeSelectorModal
        isOpen={showTribeModal}
        onClose={() => setShowTribeModal(false)}
        onSelect={handleTribeSelect}
        currentTribeId={character.tribe}
      />
    </div>
  );
}
