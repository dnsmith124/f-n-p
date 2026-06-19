"use client";

import { useState, useCallback } from "react";
import type { Character } from "@/lib/types/character";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";

interface LanguagesPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function LanguagesPanel({ character, onUpdate }: LanguagesPanelProps) {
  const { languages: langData } = useGameData();
  const [showPicker, setShowPicker] = useState(false);

  const addLanguage = useCallback(
    (name: string) => {
      onUpdate((prev) => ({
        ...prev,
        languages: [...prev.languages, name],
      }));
      setShowPicker(false);
    },
    [onUpdate]
  );

  const removeLanguage = useCallback(
    (name: string) => {
      onUpdate((prev) => ({
        ...prev,
        languages: prev.languages.filter((l) => l !== name),
      }));
    },
    [onUpdate]
  );

  const known = new Set(character.languages);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {character.languages.length === 0 && (
          <span className="text-xs text-text-muted italic">No languages known</span>
        )}
        {character.languages.map((lang) => (
          <Badge key={lang} onRemove={() => removeLanguage(lang)}>
            {lang}
          </Badge>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
      >
        + Add Language
      </button>

      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Add Language"
      >
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {langData.map((l) => {
            const isKnown = known.has(l.name);
            return (
              <button
                key={l.id}
                onClick={() => !isKnown && addLanguage(l.name)}
                disabled={isKnown}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  isKnown
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface-raised cursor-pointer"
                }`}
              >
                <span className="font-medium">{l.name}</span>
                {!l.canBeLearned && (
                  <span className="ml-2 text-[10px] text-danger">(Special)</span>
                )}
                <p className="text-[10px] text-text-muted">{l.description}</p>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
