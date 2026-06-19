import type {
  Character,
  EquipmentSlot,
  CharacterAttributes,
  AttributeKey,
} from "./types/character";
import { CHARACTER_VERSION, MAX_LUCK_TOKENS_DEFAULT } from "./constants";
import meritThresholds from "../../data/merit-thresholds.json";
import tribesData from "../../data/tribes.json";
import classesData from "../../data/classes.json";
import trainingsData from "../../data/trainings.json";
import type { TribeData, ClassData, TrainingData } from "./types/game-data";

export function generateId(): string {
  return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function emptySlot(): EquipmentSlot {
  return {
    name: "",
    description: "",
    weight: 0,
    isBroken: false,
    properties: "",
  };
}

export function defaultAttributes(): CharacterAttributes {
  return { str: 0, acc: 0, fns: 0, spd: 0, int: 0, mem: 0, vit: 0, cha: 0, srv: 0 };
}

export function levelFromMerit(merit: number): number {
  let level = 1;
  for (const t of meritThresholds) {
    if (merit >= t.meritRequired) level = t.level;
    else break;
  }
  return level;
}

export function derivedCritRate(fns: number): number {
  return 20 - fns;
}

export function findTribe(tribeId: string): TribeData | undefined {
  return (tribesData as TribeData[]).find((t) => t.id === tribeId);
}

export function spellMemoryUsed(character: Character): number {
  return character.magic.learnedSpells.reduce((sum, s) => sum + s.spellMemoryCost, 0);
}

export function applyDerivedStats(character: Character): Character {
  const level = levelFromMerit(character.merit);
  const critRate = derivedCritRate(character.attributes.fns);
  const tribe = findTribe(character.tribe);

  const evasion = tribe
    ? tribe.evasionBase + character.attributes.fns
    : character.combatStats.evasion;
  const movement = tribe
    ? tribe.movementBase + character.attributes.spd
    : character.combatStats.movement;
  const spellMemoryCurrent = spellMemoryUsed(character);

  if (
    level === character.level &&
    critRate === character.combatStats.critRate &&
    evasion === character.combatStats.evasion &&
    movement === character.combatStats.movement &&
    spellMemoryCurrent === character.magic.spellMemoryCurrent
  ) {
    return character;
  }

  return {
    ...character,
    level,
    combatStats: { ...character.combatStats, critRate, evasion, movement },
    magic: { ...character.magic, spellMemoryCurrent },
  };
}

export function applyTribeStats(
  character: Character,
  tribeId: string,
  startingBonus?: { name: string; description: string },
): Character {
  const tribe = findTribe(tribeId);
  if (!tribe) return { ...character, tribe: tribeId };

  const attrs = { ...defaultAttributes() };
  for (const [key, val] of Object.entries(tribe.attributeBonuses)) {
    if (key in attrs) attrs[key as AttributeKey] = val as number;
  }

  const hpMax = tribe.startingHP + attrs.vit;
  const staminaMax = tribe.startingStamina + attrs.vit;
  const encumbranceMax = tribe.encumbranceBase + attrs.str;
  const spellMemoryMax = tribe.spellMemoryBase + attrs.mem;

  const skillsWithoutTribeBonus = character.skills.filter((s) => s.source !== "tribe");
  const skills = startingBonus
    ? [
        ...skillsWithoutTribeBonus,
        {
          id: generateId(),
          name: startingBonus.name,
          source: "tribe" as const,
          description: startingBonus.description,
        },
      ]
    : skillsWithoutTribeBonus;

  return {
    ...character,
    tribe: tribeId,
    attributes: attrs,
    skills,
    combatStats: {
      ...character.combatStats,
      hpMax,
      hpCurrent: hpMax,
      staminaMax,
      staminaCurrent: staminaMax,
    },
    magic: {
      ...character.magic,
      spellDie: tribe.spellDie,
      spellMemoryMax,
    },
    inventory: {
      ...character.inventory,
      encumbranceMax,
    },
  };
}

function findClass(classId: string): ClassData | undefined {
  return (classesData as ClassData[]).find((c) => c.id === classId);
}

export function applyClassTrainings(character: Character, classId: string): Character {
  const cls = findClass(classId);
  if (!cls) return { ...character, class: classId };

  const allTrainings = trainingsData as TrainingData[];
  const trainingsByName = new Map(allTrainings.map((t) => [t.name.toLowerCase(), t]));

  const withoutOldClass = character.trainings.filter((t) => t.source !== "class");
  const existingNames = new Set(withoutOldClass.map((t) => t.name.toLowerCase()));

  const newEntries = cls.startingTrainings
    .map((name) => {
      const match = trainingsByName.get(name.toLowerCase());
      if (!match) return null;
      if (existingNames.has(match.name.toLowerCase())) return null;
      return { id: match.id, name: match.name, isAdvanced: match.isAdvanced, source: "class" as const };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return {
    ...character,
    class: classId,
    trainings: [...withoutOldClass, ...newEntries],
  };
}

export function createDefaultCharacter(): Character {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    version: CHARACTER_VERSION,
    name: "New Character",
    tribe: "",
    class: "",
    specialization: "",
    level: 1,
    merit: 0,
    zodiac: "",
    attributes: defaultAttributes(),
    combatStats: {
      hpCurrent: 0,
      hpMax: 0,
      staminaCurrent: 0,
      staminaMax: 0,
      evasion: 0,
      armor: 0,
      barrier: 0,
      movement: 0,
      critRate: 0,
      meleeDmgBonus: 0,
      rangedDmgBonus: 0,
      spellDmgBonus: 0,
      weaknesses: "",
      resistances: "",
    },
    magic: {
      spellDie: "",
      spellMemoryCurrent: 0,
      spellMemoryMax: 0,
      scalingAttribute: "",
      learnedSpells: [],
    },
    skills: [],
    talents: [],
    trainings: [],
    languages: [],
    equipment: {
      armamentSlots: [emptySlot(), emptySlot(), emptySlot()],
      holdoutWeapon: emptySlot(),
      torsoArmor: emptySlot(),
      helmet: emptySlot(),
      gloves: emptySlot(),
      footwear: emptySlot(),
      ring: emptySlot(),
      artifact: emptySlot(),
      toolbelt: [emptySlot(), emptySlot()],
    },
    inventory: {
      items: [],
      encumbranceCurrent: 0,
      encumbranceMax: 0,
      silver: 0,
      marksOfParha: 0,
      luckTokens: 0,
      luckTokensMax: MAX_LUCK_TOKENS_DEFAULT,
    },
    notes: "",
  };
}
