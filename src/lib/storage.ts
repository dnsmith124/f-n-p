import type {
  Character,
  CharacterListIndex,
  CharacterSummary,
} from "./types/character";
import { createDefaultCharacter, normalizeCharacter } from "./utils";
import { CHARACTER_VERSION } from "./constants";

const INDEX_KEY = "fnp-characters";
const CHARACTER_PREFIX = "fnp-character-";
const APP_VERSION_KEY = "fnp-app-version";

function getIndex(): CharacterListIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { version: 1, characters: [], lastActiveId: null };
}

function setIndex(index: CharacterListIndex) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

function toSummary(c: Character): CharacterSummary {
  return {
    id: c.id,
    name: c.name,
    tribe: c.tribe,
    class: c.class,
    level: c.level,
    updatedAt: c.updatedAt,
  };
}

export function saveCharacter(character: Character) {
  character.updatedAt = new Date().toISOString();
  localStorage.setItem(
    CHARACTER_PREFIX + character.id,
    JSON.stringify(character)
  );

  const index = getIndex();
  const existing = index.characters.findIndex((c) => c.id === character.id);
  const summary = toSummary(character);
  if (existing >= 0) {
    index.characters[existing] = summary;
  } else {
    index.characters.push(summary);
  }
  index.lastActiveId = character.id;
  setIndex(index);
}

export function loadCharacter(id: string): Character | null {
  try {
    const raw = localStorage.getItem(CHARACTER_PREFIX + id);
    if (raw) return normalizeCharacter(JSON.parse(raw));
  } catch {}
  return null;
}

export function deleteCharacter(id: string) {
  localStorage.removeItem(CHARACTER_PREFIX + id);
  const index = getIndex();
  index.characters = index.characters.filter((c) => c.id !== id);
  if (index.lastActiveId === id) {
    index.lastActiveId =
      index.characters.length > 0 ? index.characters[0].id : null;
  }
  setIndex(index);
}

export function listCharacters(): CharacterSummary[] {
  const index = getIndex();
  return [...index.characters].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getLastActiveId(): string | null {
  return getIndex().lastActiveId;
}

export function createNewCharacter(): Character {
  const character = createDefaultCharacter();
  saveCharacter(character);
  return character;
}

export function exportCharacter(id: string): string | null {
  const character = loadCharacter(id);
  if (!character) return null;
  return JSON.stringify(character, null, 2);
}

export function exportAllCharacters(): string {
  const index = getIndex();
  const characters = index.characters
    .map((s) => loadCharacter(s.id))
    .filter(Boolean);
  return JSON.stringify({ version: CHARACTER_VERSION, characters }, null, 2);
}

export function importCharacter(json: string): Character | null {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== "object" || !data.name) return null;

    const existingIndex = getIndex();
    const idCollision = existingIndex.characters.some((c) => c.id === data.id);
    if (idCollision) {
      data.id = crypto.randomUUID();
    }

    data.version = CHARACTER_VERSION;
    data.updatedAt = new Date().toISOString();
    const character = normalizeCharacter(data as Character);
    saveCharacter(character);
    return character;
  } catch {
    return null;
  }
}

export function importAllCharacters(json: string): number {
  try {
    const data = JSON.parse(json);
    const characters: Character[] = data.characters || data;
    if (!Array.isArray(characters)) return 0;

    let count = 0;
    for (const c of characters) {
      if (c && typeof c === "object" && c.name) {
        c.id = crypto.randomUUID();
        c.version = CHARACTER_VERSION;
        c.updatedAt = new Date().toISOString();
        saveCharacter(normalizeCharacter(c));
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

export function migrateStorage() {
  const currentVersion = localStorage.getItem(APP_VERSION_KEY);
  if (currentVersion === String(CHARACTER_VERSION)) return;

  localStorage.setItem(APP_VERSION_KEY, String(CHARACTER_VERSION));
}
