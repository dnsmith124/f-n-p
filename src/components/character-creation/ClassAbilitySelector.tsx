"use client";

import type { ClassProgression } from "@/lib/types/game-data";

interface ClassAbilitySelectorProps {
  options: ClassProgression[];
  selected: string;
  onSelect: (ability: string) => void;
  title?: string;
  highlightLevel?: number;
}

export function ClassAbilitySelector({
  options,
  selected,
  onSelect,
  title = "Choose a Class Ability",
  highlightLevel,
}: ClassAbilitySelectorProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
        {title}
      </h4>
      <div className="space-y-1">
        {options.map((option) => {
          const isMissed =
            highlightLevel !== undefined && option.level < highlightLevel;
          return (
            <label
              key={`${option.level}-${option.ability}`}
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                selected === option.ability
                  ? "border-accent bg-accent/5"
                  : "border-border-light hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="class-ability"
                checked={selected === option.ability}
                onChange={() => onSelect(option.ability)}
                className="mt-0.5 accent-accent"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-text">
                    {option.ability}
                  </span>
                  {option.type && (
                    <span className="text-[9px] uppercase text-text-muted">
                      ({option.type})
                    </span>
                  )}
                  {isMissed && (
                    <span className="text-[9px] uppercase text-highlight font-bold">
                      Lv{option.level} missed
                    </span>
                  )}
                  {highlightLevel !== undefined &&
                    option.level === highlightLevel &&
                    !isMissed && (
                      <span className="text-[9px] uppercase text-accent font-bold">
                        Lv{option.level}
                      </span>
                    )}
                </div>
                {option.path && (
                  <span className="text-[10px] text-text-muted">{option.path}</span>
                )}
                <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
