"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";
import type { ClassData, ClassProgression } from "@/lib/types/game-data";

interface ClassSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (classId: string) => void;
  currentClassId: string;
}

const TYPE_ORDER: ClassData["type"][] = ["base", "advanced", "hybrid"];
const TYPE_LABELS: Record<ClassData["type"], string> = {
  base: "Base Classes",
  advanced: "Advanced Classes",
  hybrid: "Hybrid Classes",
};

export function TrainingPills({ trainings }: { trainings: string[] }) {
  if (trainings.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {trainings.map((t) => (
        <span key={t} className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5">
          {t}
        </span>
      ))}
    </div>
  );
}

export function ProgressionTable({ progression }: { progression: ClassProgression[] }) {
  const paths = [...new Set(progression.map((p) => p.path).filter(Boolean))];

  if (paths.length === 0) {
    return (
      <div className="space-y-1.5">
        {progression.map((p, i) => (
          <div key={i} className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted font-mono shrink-0">Lv{p.level}</span>
              <span className="font-bold text-text">{p.ability}</span>
              {p.type && (
                <span className="text-[9px] uppercase text-text-muted">({p.type})</span>
              )}
            </div>
            <p className="text-text-secondary leading-snug mt-0.5 ml-7">{p.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paths.map((path) => (
        <div key={path}>
          <h5 className="text-[10px] uppercase tracking-wider text-accent font-bold mb-1">
            {path}
          </h5>
          <div className="space-y-1.5">
            {progression
              .filter((p) => p.path === path)
              .map((p, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted font-mono shrink-0">Lv{p.level}</span>
                    <span className="font-bold text-text">{p.ability}</span>
                    {p.type && (
                      <span className="text-[9px] uppercase text-text-muted">({p.type})</span>
                    )}
                  </div>
                  <p className="text-text-secondary leading-snug mt-0.5 ml-7">{p.description}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassListPage({
  classes,
  currentClassId,
  onViewClass,
}: {
  classes: ClassData[];
  currentClassId: string;
  onViewClass: (classId: string) => void;
}) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: classes.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      {grouped.map((group) => (
        <div key={group.type}>
          <h3 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.items.map((cls) => {
              const isCurrent = cls.id === currentClassId;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onViewClass(cls.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between ${
                    isCurrent
                      ? "border-accent bg-accent/5"
                      : "border-border-light bg-surface hover:border-border"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm">{cls.name}</span>
                    {isCurrent && (
                      <span className="ml-2 text-[9px] uppercase tracking-wider text-accent font-bold">
                        Current
                      </span>
                    )}
                    {cls.parentClasses.length > 0 && (
                      <span className="ml-2 text-[10px] text-text-muted">
                        ({cls.parentClasses.join(" + ")})
                      </span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-text-muted shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassDetailPage({
  cls,
  isCurrent,
  onBack,
  onSelect,
}: {
  cls: ClassData;
  isCurrent: boolean;
  onBack: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Classes
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-base">{cls.name}</h3>
          <span className="text-[10px] uppercase tracking-wider text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
            {cls.type}
          </span>
        </div>
        {cls.parentClasses.length > 0 && (
          <p className="text-[10px] text-text-muted">
            Requires: {cls.parentClasses.join(" + ")}
          </p>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">{cls.description}</p>

      {cls.favoredAttributes && cls.favoredAttributes.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
            Favored Attributes
          </h4>
          <div className="flex flex-wrap gap-1">
            {cls.favoredAttributes.map((attr) => (
              <span key={attr} className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5 font-mono text-highlight">
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

      {cls.startingSkills.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
            Starting Skills
          </h4>
          <TrainingPills trainings={cls.startingSkills} />
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

      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-center text-sm font-bold py-2 rounded-lg transition-colors ${
          isCurrent
            ? "bg-surface-raised text-text-muted"
            : "bg-accent text-bg hover:opacity-90"
        }`}
      >
        {isCurrent ? "Already Selected" : `Select ${cls.name}`}
      </button>
    </div>
  );
}

export function ClassSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentClassId,
}: ClassSelectorModalProps) {
  const { classes } = useGameData();
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);

  const viewingClass = viewingClassId ? classes.find((c) => c.id === viewingClassId) : null;

  const handleSelect = (classId: string) => {
    onSelect(classId);
    setViewingClassId(null);
    onClose();
  };

  const handleClose = () => {
    setViewingClassId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={viewingClass ? viewingClass.name : "Select Class"}
    >
      {viewingClass ? (
        <ClassDetailPage
          cls={viewingClass}
          isCurrent={viewingClass.id === currentClassId}
          onBack={() => setViewingClassId(null)}
          onSelect={() => handleSelect(viewingClass.id)}
        />
      ) : (
        <ClassListPage
          classes={classes}
          currentClassId={currentClassId}
          onViewClass={setViewingClassId}
        />
      )}
    </Modal>
  );
}
