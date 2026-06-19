"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useCharacter } from "@/hooks/useCharacter";
import { CharacterHeader } from "@/components/character-sheet/CharacterHeader";
import { CharacterSheetTabs } from "@/components/character-sheet/CharacterSheetTabs";
import { LevelUpModal } from "@/components/character-sheet/LevelUpModal";
import { AppHeader } from "@/components/ui/AppHeader";
import { exportCharacter } from "@/lib/storage";
import { computeUnresolvedLevels } from "@/lib/class-progression";
import type { Character } from "@/lib/types/character";

export default function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { character, isLoaded, updateCharacter, undo, redo, canUndo, canRedo } = useCharacter(id);
  const [activeLevelUp, setActiveLevelUp] = useState<number | null>(null);

  useEffect(() => {
    if (!character || activeLevelUp !== null) return;

    const unresolved = computeUnresolvedLevels(character);
    if (unresolved.length === 0) return;

    const next = unresolved[0];
    setActiveLevelUp(next);
  }, [character, activeLevelUp, updateCharacter]);

  const handleLevelUpComplete = useCallback(
    (updated: Character) => {
      updateCharacter(() => updated);
      setActiveLevelUp(null);
    },
    [updateCharacter]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Character not found</p>
        <Link href="/" className="text-accent hover:underline text-sm">
          Back to characters
        </Link>
      </div>
    );
  }

  const handleExport = () => {
    const json = exportCharacter(character.id);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name || "character"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col max-w-2xl mx-auto w-full">
      <AppHeader
        backHref="/"
        backLabel="Home"
        actions={
          <div className="flex items-center gap-0.5">
            {([
              { action: undo, enabled: canUndo, label: "Undo", title: "Undo (Ctrl+Z)", path: "M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" },
              { action: redo, enabled: canRedo, label: "Redo", title: "Redo (Ctrl+Shift+Z)", path: "M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" },
            ] as const).map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                disabled={!btn.enabled}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-25 text-text-muted hover:text-text hover:bg-surface-raised disabled:hover:bg-transparent disabled:hover:text-text-muted disabled:cursor-default"
                aria-label={btn.label}
                title={btn.title}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={btn.path} />
                </svg>
              </button>
            ))}
          </div>
        }
        menuItems={[
          { label: "Export Character", onClick: handleExport },
        ]}
      />

      <div className="p-3">
        <CharacterHeader character={character} onUpdate={updateCharacter} />
      </div>

      <CharacterSheetTabs character={character} onUpdate={updateCharacter} />

      {activeLevelUp !== null && (
        <LevelUpModal
          character={character}
          level={activeLevelUp}
          onComplete={handleLevelUpComplete}
        />
      )}
    </div>
  );
}
