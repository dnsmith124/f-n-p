"use client";

import { useCallback } from "react";
import { useGameData } from "@/hooks/useGameData";
import type { WizardState } from "@/lib/wizard-utils";
import tribeNames from "../../../data/tribe-names.json";

interface IdentityStepProps {
  state: WizardState;
  onSetName: (name: string) => void;
  onSetZodiac: (zodiacId: string) => void;
}

const allNames = Object.values(tribeNames).flat();

export function IdentityStep({
  state,
  onSetName,
  onSetZodiac,
}: IdentityStepProps) {
  const { zodiac } = useGameData();

  const handleRandomName = useCallback(() => {
    const pool =
      (tribeNames as Record<string, string[]>)[state.tribeId] ?? allNames;
    const name = pool[Math.floor(Math.random() * pool.length)];
    onSetName(name);
  }, [state.tribeId, onSetName]);

  const handleRandomZodiac = useCallback(() => {
    const z = zodiac[Math.floor(Math.random() * zodiac.length)];
    onSetZodiac(z.id);
  }, [zodiac, onSetZodiac]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text">Name Your Character</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Give your adventurer a name.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={state.characterName}
            onChange={(e) => onSetName(e.target.value)}
            placeholder="Enter character name..."
            className="flex-1 px-3 py-2.5 rounded-lg border border-border-light bg-surface text-text text-base font-bold placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <button
            type="button"
            onClick={handleRandomName}
            title="Random name from tribe lore"
            className="px-3 py-2.5 rounded-lg border border-border-light bg-surface hover:bg-surface-raised text-text-muted hover:text-text transition-colors shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
              />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1">
          Or tap the shuffle button for a name from{" "}
          {state.tribeId
            ? "your tribe's known historical names"
            : "known historical names"}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-text">Zodiac</h3>
          <button
            type="button"
            onClick={handleRandomZodiac}
            title="Random zodiac"
            className="px-2.5 py-1.5 rounded-lg border border-border-light bg-surface hover:bg-surface-raised text-text-muted hover:text-text transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
              />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-text-muted mt-0.5 italic">
          &ldquo;This choice should not be overthought as it is very likely to
          mean nothing / never even come up during gameplay.&rdquo;
        </p>

        <div className="mt-2 space-y-1">
          {zodiac.map((z) => {
            const isSelected = state.zodiacId === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() =>
                  onSetZodiac(isSelected ? "" : z.id)
                }
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-border-light bg-surface hover:border-border"
                }`}
              >
                <span className="text-xs font-bold">{z.name}</span>
                {isSelected && (
                  <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                    {z.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
