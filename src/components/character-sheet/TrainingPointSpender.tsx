"use client";

import { useState, useCallback } from "react";
import type { Character, AttributeKey, TrainingEntry } from "@/lib/types/character";
import { useGameData } from "@/hooks/useGameData";
import { ATTRIBUTE_KEYS, ATTRIBUTE_ABBR, ATTRIBUTE_MAX } from "@/lib/constants";
import { generateId } from "@/lib/utils";

interface TrainingPointSpenderProps {
  character: Character;
  onUpdate: (character: Character) => void;
}

export function TrainingPointSpender({
  character,
  onUpdate,
}: TrainingPointSpenderProps) {
  const { trainings: trainingData } = useGameData();
  const [showTrainingPicker, setShowTrainingPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"basic" | "advanced">("basic");
  const [history, setHistory] = useState<Character[]>([]);

  const available = character.trainingPointsUnspent;
  const knownNames = new Set(character.trainings.map((t) => t.name.toLowerCase()));

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev, character]);
  }, [character]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      onUpdate(prev[prev.length - 1]);
      return prev.slice(0, -1);
    });
  }, [onUpdate]);

  const spendAttribute = useCallback(
    (key: AttributeKey) => {
      if (available < 1) return;
      if (character.attributes[key] >= ATTRIBUTE_MAX) return;
      pushHistory();
      onUpdate({
        ...character,
        trainingPointsUnspent: available - 1,
        attributes: {
          ...character.attributes,
          [key]: character.attributes[key] + 1,
        },
      });
    },
    [character, available, onUpdate, pushHistory]
  );

  const spendTraining = useCallback(
    (name: string, isAdvanced: boolean, cost: number) => {
      if (available < cost) return;
      if (knownNames.has(name.toLowerCase())) return;
      pushHistory();
      const entry: TrainingEntry = {
        id: generateId(),
        name,
        isAdvanced,
        source: "manual",
      };
      onUpdate({
        ...character,
        trainingPointsUnspent: available - cost,
        trainings: [...character.trainings, entry],
      });
      setShowTrainingPicker(false);
    },
    [character, available, knownNames, onUpdate, pushHistory]
  );

  const openPicker = (mode: "basic" | "advanced") => {
    setPickerMode(mode);
    setShowTrainingPicker(true);
  };

  const cost = pickerMode === "advanced" ? 2 : 1;
  const filteredTrainings = trainingData.filter((t) =>
    pickerMode === "advanced" ? t.isAdvanced : !t.isAdvanced
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
          Training Points
        </h4>
        <span className="text-xs font-bold text-accent">
          {available} remaining
        </span>
      </div>
      <p className="text-[11px] text-text-secondary">
        Spend 1 TP to raise an attribute (+1, max +7) or learn a training.
        Advanced trainings cost 2 TP.
      </p>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">
            Attributes (+1 each)
          </p>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="text-[10px] uppercase tracking-wider font-bold text-text-muted hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Undo
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ATTRIBUTE_KEYS.map((key) => {
            const atMax = character.attributes[key] >= ATTRIBUTE_MAX;
            const disabled = available < 1 || atMax;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => spendAttribute(key)}
                className={`px-2 py-1.5 rounded border text-xs font-mono transition-colors ${
                  disabled
                    ? "border-border-light text-text-muted opacity-40 cursor-not-allowed"
                    : "border-border-light hover:border-accent hover:bg-accent/5 cursor-pointer"
                }`}
              >
                {ATTRIBUTE_ABBR[key]}{" "}
                {character.attributes[key] > 0 ? "+" : ""}
                {character.attributes[key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={available < 1}
          onClick={() => openPicker("basic")}
          className="flex-1 py-1.5 rounded-lg border border-border-light text-xs hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Training (1 TP)
        </button>
        <button
          type="button"
          disabled={available < 2}
          onClick={() => openPicker("advanced")}
          className="flex-1 py-1.5 rounded-lg border border-border-light text-xs hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Advanced (2 TP)
        </button>
      </div>

      {showTrainingPicker && (
        <div className="border border-border-light rounded-lg max-h-40 overflow-y-auto">
          {filteredTrainings.map((t) => {
            const isKnown = knownNames.has(t.name.toLowerCase());
            return (
              <button
                key={t.id}
                type="button"
                disabled={isKnown || available < cost}
                onClick={() => spendTraining(t.name, t.isAdvanced, cost)}
                className={`w-full text-left px-2 py-1.5 text-xs border-b border-border-light last:border-0 ${
                  isKnown || available < cost
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface-raised cursor-pointer"
                }`}
              >
                <span className="font-medium">{t.name}</span>
                <p className="text-[10px] text-text-muted line-clamp-1">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
