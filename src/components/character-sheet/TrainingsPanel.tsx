"use client";

import { useState, useCallback } from "react";
import type { Character, TrainingEntry } from "@/lib/types/character";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";
import { generateId } from "@/lib/utils";

interface TrainingsPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function TrainingsPanel({ character, onUpdate }: TrainingsPanelProps) {
  const { trainings: trainingData } = useGameData();
  const [showPicker, setShowPicker] = useState(false);

  const addTraining = useCallback(
    (name: string, isAdvanced: boolean) => {
      const entry: TrainingEntry = { id: generateId(), name, isAdvanced };
      onUpdate((prev) => ({ ...prev, trainings: [...prev.trainings, entry] }));
      setShowPicker(false);
    },
    [onUpdate]
  );

  const removeTraining = useCallback(
    (id: string) => {
      onUpdate((prev) => ({
        ...prev,
        trainings: prev.trainings.filter((t) => t.id !== id),
      }));
    },
    [onUpdate]
  );

  const knownNames = new Set(character.trainings.map((t) => t.name));
  const standard = character.trainings.filter((t) => !t.isAdvanced);
  const advanced = character.trainings.filter((t) => t.isAdvanced);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
          Standard
        </h4>
        <div className="flex flex-wrap gap-1">
          {standard.length === 0 && (
            <span className="text-xs text-text-muted italic">None</span>
          )}
          {standard.map((t) => (
            <Badge key={t.id} onRemove={() => removeTraining(t.id)}>
              {t.name}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
          Advanced
        </h4>
        <div className="flex flex-wrap gap-1">
          {advanced.length === 0 && (
            <span className="text-xs text-text-muted italic">None</span>
          )}
          {advanced.map((t) => (
            <Badge key={t.id} variant="accent" onRemove={() => removeTraining(t.id)}>
              {t.name}
            </Badge>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
      >
        + Add Training
      </button>

      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Add Training"
      >
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {trainingData.map((t) => {
            const isKnown = knownNames.has(t.name);
            return (
              <button
                key={t.id}
                onClick={() => !isKnown && addTraining(t.name, t.isAdvanced)}
                disabled={isKnown}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  isKnown
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface-raised cursor-pointer"
                }`}
              >
                <span className="font-medium">{t.name}</span>
                {t.isAdvanced && (
                  <span className="ml-2 text-[10px] text-accent">(Advanced)</span>
                )}
                <p className="text-[10px] text-text-muted">{t.description}</p>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
