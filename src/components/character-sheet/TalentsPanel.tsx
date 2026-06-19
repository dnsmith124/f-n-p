"use client";

import { useState, useCallback } from "react";
import type { Character, TalentEntry } from "@/lib/types/character";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";
import { generateId } from "@/lib/utils";
import { ATTRIBUTE_ABBR } from "@/lib/constants";
import type { AttributeKey } from "@/lib/types/character";

interface TalentsPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function TalentsPanel({ character, onUpdate }: TalentsPanelProps) {
  const { talents: talentData } = useGameData();
  const [showPicker, setShowPicker] = useState(false);

  const addTalent = useCallback(
    (name: string, description: string) => {
      const talent: TalentEntry = { id: generateId(), name, description };
      onUpdate((prev) => ({ ...prev, talents: [...prev.talents, talent] }));
      setShowPicker(false);
    },
    [onUpdate]
  );

  const removeTalent = useCallback(
    (id: string) => {
      onUpdate((prev) => ({
        ...prev,
        talents: prev.talents.filter((t) => t.id !== id),
      }));
    },
    [onUpdate]
  );

  const knownIds = new Set(character.talents.map((t) => t.name));

  return (
    <div className="space-y-2">
      {character.talents.length === 0 ? (
        <p className="text-xs text-text-muted italic py-2">No talents earned</p>
      ) : (
        character.talents.map((talent) => (
          <CollapsibleSection
            key={talent.id}
            title={talent.name}
            defaultOpen={false}
          >
            <p className="text-xs text-text-secondary">{talent.description}</p>
            <button
              onClick={() => removeTalent(talent.id)}
              className="text-xs text-danger hover:underline mt-2"
            >
              Remove
            </button>
          </CollapsibleSection>
        ))
      )}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
      >
        + Add Talent
      </button>

      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Add Talent"
      >
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {talentData.map((t) => {
            const isKnown = knownIds.has(t.name);
            const reqs = Object.entries(t.requirements)
              .map(
                ([k, v]) => `${ATTRIBUTE_ABBR[k as AttributeKey]} ${v}+`
              )
              .join(", ");

            return (
              <button
                key={t.id}
                onClick={() => !isKnown && addTalent(t.name, t.description)}
                disabled={isKnown}
                className={`w-full text-left px-3 py-2 rounded border border-border-light text-sm transition-colors ${
                  isKnown
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface-raised cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <Badge>{reqs}</Badge>
                </div>
                <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
