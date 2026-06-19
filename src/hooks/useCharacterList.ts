"use client";

import { useCallback, useEffect, useState } from "react";
import type { CharacterSummary } from "@/lib/types/character";
import {
  listCharacters,
  createNewCharacter,
  deleteCharacter as removeCharacter,
} from "@/lib/storage";

export function useCharacterList() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setCharacters(listCharacters());
  }, []);

  useEffect(() => {
    refresh();
    setIsLoaded(true);
  }, [refresh]);

  const addCharacter = useCallback(() => {
    const character = createNewCharacter();
    refresh();
    return character;
  }, [refresh]);

  const deleteCharacter = useCallback(
    (id: string) => {
      removeCharacter(id);
      refresh();
    },
    [refresh]
  );

  return { characters, isLoaded, addCharacter, deleteCharacter, refresh };
}
