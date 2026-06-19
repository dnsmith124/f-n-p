import type { Character } from "./types/character";
import type { ClassData, ClassProgression } from "./types/game-data";
import { generateId } from "./utils";
import classesData from "../../data/classes.json";
import talentsData from "../../data/talents.json";
import type { TalentData } from "./types/game-data";

export const ADVANCEMENT_LEVELS = [3, 6, 9, 12, 15] as const;

const TALENT_GRANTS: Record<string, string> = {
  "Basic Chemistry": "Alchemist",
  Craftsman: "Armorer",
  "Lock Breaker": "Lockpick",
};

function findClass(classId: string): ClassData | undefined {
  return (classesData as ClassData[]).find((c) => c.id === classId);
}

function findTalentByName(name: string): TalentData | undefined {
  return (talentsData as TalentData[]).find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
}

export function getAbilitiesAtLevel(
  classId: string,
  level: number
): ClassProgression[] {
  const cls = findClass(classId);
  if (!cls) return [];
  return cls.progression.filter((p) => p.level === level);
}

/** @deprecated Use getAbilitiesAtLevel(classId, 1) */
export function getLevel1PathOptions(classId: string): ClassProgression[] {
  return getAbilitiesAtLevel(classId, 1);
}

export function getOwnedClassAbilityNames(character: Character): Set<string> {
  return new Set(
    character.skills.filter((s) => s.source === "class").map((s) => s.name)
  );
}

export function findProgressionEntryByAbility(
  classId: string,
  abilityName: string
): ClassProgression | undefined {
  const cls = findClass(classId);
  if (!cls) return undefined;
  return cls.progression.find((p) => p.ability === abilityName);
}

export function findProgressionEntryForCharacter(
  character: Character,
  abilityName: string
): ClassProgression | undefined {
  const current = findProgressionEntryByAbility(character.class, abilityName);
  if (current) return current;

  const baseId = getBaseClassId(character.class);
  if (baseId !== character.class) {
    return findProgressionEntryByAbility(baseId, abilityName);
  }
  return undefined;
}

export function getBaseClassId(classId: string): string {
  const cls = findClass(classId);
  if (!cls || cls.type === "base") return classId;
  const parent = cls.parentClasses[0];
  if (!parent) return classId;
  return parent.toLowerCase();
}

export function getEligiblePromotionClasses(baseClassId: string): ClassData[] {
  const baseId = baseClassId.toLowerCase();
  return (classesData as ClassData[]).filter(
    (c) =>
      (c.type === "advanced" || c.type === "hybrid") &&
      c.parentClasses.some((p) => p.toLowerCase() === baseId)
  );
}

export function getAvailableAbilityChoices(
  character: Character,
  level: number,
  promotionClassId?: string
): ClassProgression[] {
  const owned = getOwnedClassAbilityNames(character);
  const choices: ClassProgression[] = [];
  const seen = new Set<string>();

  const addEntry = (entry: ClassProgression) => {
    if (!owned.has(entry.ability) && !seen.has(entry.ability)) {
      seen.add(entry.ability);
      choices.push(entry);
    }
  };

  if (level === 6 && promotionClassId) {
    for (const entry of getAbilitiesAtLevel(promotionClassId, 6)) {
      addEntry(entry);
    }
    const baseId = getBaseClassId(character.class);
    for (let l = 1; l <= 5; l++) {
      for (const entry of getAbilitiesAtLevel(baseId, l)) {
        addEntry(entry);
      }
    }
  } else {
    const classId = character.class;
    for (const entry of getAbilitiesAtLevel(classId, level)) {
      addEntry(entry);
    }
    for (let l = 1; l < level; l++) {
      for (const entry of getAbilitiesAtLevel(classId, l)) {
        addEntry(entry);
      }
    }
    const baseId = getBaseClassId(classId);
    if (baseId !== classId && level > 6) {
      for (let l = 1; l <= 5; l++) {
        for (const entry of getAbilitiesAtLevel(baseId, l)) {
          addEntry(entry);
        }
      }
    }
  }

  return choices.sort(
    (a, b) => a.level - b.level || a.ability.localeCompare(b.ability)
  );
}

export function hasClassAbility(
  character: Character,
  abilityName: string,
  classLevel?: number
): boolean {
  return character.skills.some(
    (s) =>
      s.source === "class" &&
      s.name === abilityName &&
      (classLevel === undefined || s.classLevel === classLevel)
  );
}

export function applyProgressionAbility(
  character: Character,
  entry: ClassProgression
): Character {
  if (hasClassAbility(character, entry.ability)) {
    return character;
  }

  let c: Character = {
    ...character,
    skills: [
      ...character.skills,
      {
        id: generateId(),
        name: entry.ability,
        source: "class",
        description: entry.description,
        abilityType: entry.type,
        classLevel: entry.level,
      },
    ],
  };

  const talentName = TALENT_GRANTS[entry.ability];
  if (talentName) {
    const talent = findTalentByName(talentName);
    if (talent && !c.talents.some((t) => t.name === talent.name)) {
      c = {
        ...c,
        talents: [
          ...c.talents,
          {
            id: talent.id,
            name: talent.name,
            description: talent.description,
          },
        ],
      };
    }
  }

  if (entry.ability === "Memorization") {
    c = {
      ...c,
      magic: {
        ...c.magic,
        spellMemoryMax: c.magic.spellMemoryMax + 1,
      },
    };
  }

  return c;
}

export function computeUnresolvedLevels(character: Character): number[] {
  const resolved = new Set(character.resolvedLevels ?? []);
  const unresolved: number[] = [];

  if (character.class && !resolved.has(1) && character.level >= 1) {
    unresolved.push(1);
  }

  for (let lvl = 2; lvl <= character.level; lvl++) {
    if (!resolved.has(lvl)) {
      unresolved.push(lvl);
    }
  }

  return unresolved.sort((a, b) => a - b);
}

export function isAdvancementLevel(level: number): boolean {
  return (ADVANCEMENT_LEVELS as readonly number[]).includes(level);
}

export function applyLevelUpHp(
  character: Character,
  level: number,
  vitIncreasedThisLevel: boolean
): Character {
  let hpGain = 1;
  if (vitIncreasedThisLevel) hpGain += 1;
  if (character.class === "fighter" && level >= 2) hpGain += 1;

  return {
    ...character,
    combatStats: {
      ...character.combatStats,
      hpMax: character.combatStats.hpMax + hpGain,
      hpCurrent: character.combatStats.hpCurrent + hpGain,
    },
  };
}

export function applySelectedClassAbility(
  character: Character,
  abilityName: string
): Character {
  const entry = findProgressionEntryForCharacter(character, abilityName);
  if (!entry) return character;
  return applyProgressionAbility(character, entry);
}
