"use client";

import type { Character, AttributeKey } from "@/lib/types/character";
import type { CharacterStatBreakdowns } from "@/lib/stat-breakdown";
import { StatBlock } from "@/components/ui/StatBlock";
import { ATTRIBUTE_KEYS } from "@/lib/constants";

interface AttributesPanelProps {
  character: Character;
  breakdowns: CharacterStatBreakdowns;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function AttributesPanel({ character, breakdowns, onUpdate }: AttributesPanelProps) {
  const handleChange = (key: AttributeKey, value: number) => {
    onUpdate((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Attributes</h3>
      <div className="grid grid-cols-3 gap-2">
      {ATTRIBUTE_KEYS.map((key) => (
        <StatBlock
          key={key}
          attrKey={key}
          value={character.attributes[key]}
          breakdown={breakdowns.attributes[key]}
          onChange={(v) => handleChange(key, v)}
        />
      ))}
      </div>
    </div>
  );
}
