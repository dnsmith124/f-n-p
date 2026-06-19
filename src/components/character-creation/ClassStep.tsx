"use client";

import { useState } from "react";
import { useGameData } from "@/hooks/useGameData";
import {
  TrainingPills,
  ProgressionTable,
} from "@/components/character-sheet/ClassSelectorModal";
import { MagicSchoolSelector } from "./MagicSchoolSelector";
import type { ClassData } from "@/lib/types/game-data";
import type { MagicSchool } from "@/lib/types/character";
import type { WizardState } from "@/lib/wizard-utils";

interface ClassStepProps {
  state: WizardState;
  onSelectClass: (classId: string) => void;
  onSelectMagicSchool: (school: MagicSchool) => void;
  onSelectFighterTraining: (training: string) => void;
}

function FighterTrainingSelector({
  trainings,
  selected,
  onSelect,
}: {
  trainings: string[];
  selected: string;
  onSelect: (training: string) => void;
}) {
  const weaponTrainings = trainings.filter(
    (t) =>
      !["Light Armor", "Medium Armor", "Shield"].includes(t)
  );

  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
        Favored Weapon Training (+1 ATK)
      </h4>
      <div className="grid grid-cols-2 gap-1">
        {weaponTrainings.map((training) => (
          <label
            key={training}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs ${
              selected === training
                ? "border-accent bg-accent/5 font-bold"
                : "border-border-light hover:border-border"
            }`}
          >
            <input
              type="radio"
              name="fighter-training"
              checked={selected === training}
              onChange={() => onSelect(training)}
              className="accent-[var(--color-accent)]"
            />
            {training}
          </label>
        ))}
      </div>
    </div>
  );
}

function ClassDetailView({
  cls,
  isSelected,
  state,
  onSelect,
  onBack,
  onSelectMagicSchool,
  onSelectFighterTraining,
}: {
  cls: ClassData;
  isSelected: boolean;
  state: WizardState;
  onSelect: () => void;
  onBack: () => void;
  onSelectMagicSchool: (school: MagicSchool) => void;
  onSelectFighterTraining: (training: string) => void;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        All Classes
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-base">{cls.name}</h3>
          {isSelected && (
            <span className="text-[9px] uppercase tracking-wider text-accent font-bold">
              Selected
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        {cls.description}
      </p>

      {cls.favoredAttributes && cls.favoredAttributes.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
            Favored Attributes
          </h4>
          <div className="flex flex-wrap gap-1">
            {cls.favoredAttributes.map((attr) => (
              <span
                key={attr}
                className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5 font-mono text-highlight"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {cls.statBonuses && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
            Stat Bonuses
          </h4>
          <p className="text-xs text-text-secondary">{cls.statBonuses}</p>
        </div>
      )}

      {cls.classBonus && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
            Class Bonus
          </h4>
          <p className="text-xs text-text-secondary">{cls.classBonus}</p>
        </div>
      )}

      {cls.startingTrainings.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
            Starting Trainings
          </h4>
          <TrainingPills trainings={cls.startingTrainings} />
        </div>
      )}

      {cls.progression.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
            Progression
          </h4>
          <ProgressionTable progression={cls.progression} />
        </div>
      )}

      {cls.id === "mage" && (
        <MagicSchoolSelector
          selected={state.magicSchool}
          onSelect={onSelectMagicSchool}
        />
      )}

      {cls.id === "fighter" && (
        <FighterTrainingSelector
          trainings={cls.startingTrainings}
          selected={state.fighterFavoredTraining}
          onSelect={onSelectFighterTraining}
        />
      )}

      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-center text-sm font-bold py-2 rounded-lg transition-colors ${
          isSelected
            ? "bg-surface-raised text-text-muted"
            : "bg-accent text-bg hover:opacity-90"
        }`}
      >
        {isSelected ? "Selected" : `Select ${cls.name}`}
      </button>
    </div>
  );
}

export function ClassStep({
  state,
  onSelectClass,
  onSelectMagicSchool,
  onSelectFighterTraining,
}: ClassStepProps) {
  const { classes } = useGameData();
  const [viewingClassId, setViewingClassId] = useState<string | null>(
    state.classId || null
  );
  const [localFighterTraining, setLocalFighterTraining] = useState(
    state.fighterFavoredTraining
  );
  const [localMagicSchool, setLocalMagicSchool] = useState<MagicSchool | null>(
    state.magicSchool
  );

  const baseClasses = classes.filter((c) => c.type === "base");
  const viewingClass = viewingClassId
    ? baseClasses.find((c) => c.id === viewingClassId)
    : null;

  if (viewingClass) {
    return (
      <ClassDetailView
        cls={viewingClass}
        isSelected={viewingClass.id === state.classId}
        state={{ ...state, fighterFavoredTraining: localFighterTraining, magicSchool: localMagicSchool }}
        onSelect={() => {
          onSelectClass(viewingClass.id);
          if (viewingClass.id === "fighter" && localFighterTraining) {
            onSelectFighterTraining(localFighterTraining);
          }
          if (viewingClass.id === "mage" && localMagicSchool) {
            onSelectMagicSchool(localMagicSchool);
          }
        }}
        onBack={() => setViewingClassId(null)}
        onSelectMagicSchool={(school) => {
          setLocalMagicSchool(school);
          onSelectMagicSchool(school);
        }}
        onSelectFighterTraining={(training) => {
          setLocalFighterTraining(training);
          onSelectFighterTraining(training);
        }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3">
        <h2 className="text-base font-bold text-text">Choose Your Class</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Your class determines starting trainings, abilities, and progression.
        </p>
      </div>

      <div className="space-y-1">
        {baseClasses.map((cls) => {
          const isSelected = cls.id === state.classId;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => setViewingClassId(cls.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border-light bg-surface hover:border-border"
              }`}
            >
              <div>
                <span className="font-bold text-sm">{cls.name}</span>
                {isSelected && (
                  <span className="ml-2 text-[9px] uppercase tracking-wider text-accent font-bold">
                    Selected
                  </span>
                )}
                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                  {cls.description}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-text-muted shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
