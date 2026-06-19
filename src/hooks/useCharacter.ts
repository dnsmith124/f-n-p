"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/types/character";
import { loadCharacter, saveCharacter } from "@/lib/storage";
import { applyDerivedStats } from "@/lib/utils";

const MAX_UNDO = 50;

export function useCharacter(id: string) {
  const [character, setCharacterState] = useState<Character | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStack = useRef<Character[]>([]);
  const redoStack = useRef<Character[]>([]);
  const characterRef = useRef<Character | null>(null);

  useEffect(() => {
    const loaded = loadCharacter(id);
    const initial = loaded ? applyDerivedStats(loaded) : null;
    setCharacterState(initial);
    characterRef.current = initial;
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
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
      const prev = characterRef.current;
      if (!prev) return;
      undoStack.current.push(prev);
      if (undoStack.current.length > MAX_UNDO) {
        undoStack.current.shift();
      }
      redoStack.current = [];
      setCanUndo(true);
      setCanRedo(false);
      const updated = applyDerivedStats(updater(prev));
      characterRef.current = updated;
      setCharacterState(updated);
      persistCharacter(updated);
    },
    [persistCharacter]
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev || !characterRef.current) return;
    redoStack.current.push(characterRef.current);
    characterRef.current = prev;
    setCharacterState(prev);
    persistCharacter(prev);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, [persistCharacter]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next || !characterRef.current) return;
    undoStack.current.push(characterRef.current);
    characterRef.current = next;
    setCharacterState(next);
    persistCharacter(next);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, [persistCharacter]);

  const updateField = useCallback(
    <K extends keyof Character>(field: K, value: Character[K]) => {
      updateCharacter((prev) => ({ ...prev, [field]: value }));
    },
    [updateCharacter]
  );

  return { character, isLoaded, updateCharacter, updateField, undo, redo, canUndo, canRedo };
}
