"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/types/character";
import { loadCharacter, saveCharacter } from "@/lib/storage";
import { applyDerivedStats } from "@/lib/utils";

export function useCharacter(id: string) {
  const [character, setCharacterState] = useState<Character | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = loadCharacter(id);
    setCharacterState(loaded ? applyDerivedStats(loaded) : null);
    setIsLoaded(true);
  }, [id]);

  const persistCharacter = useCallback((updated: Character) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveCharacter(updated);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const updateCharacter = useCallback(
    (updater: (prev: Character) => Character) => {
      setCharacterState((prev) => {
        if (!prev) return prev;
        const updated = applyDerivedStats(updater(prev));
        persistCharacter(updated);
        return updated;
      });
    },
    [persistCharacter]
  );

  const updateField = useCallback(
    <K extends keyof Character>(field: K, value: Character[K]) => {
      updateCharacter((prev) => ({ ...prev, [field]: value }));
    },
    [updateCharacter]
  );

  return { character, isLoaded, updateCharacter, updateField };
}
