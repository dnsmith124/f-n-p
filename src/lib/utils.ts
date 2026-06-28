import type {
  Character,
  EquipmentSlot,
  CharacterAttributes,
  AttributeKey,
  DamageModifierEntry,
  MagicSchool,
} from "./types/character";
import {
  CHARACTER_VERSION,
  isMagicSchool,
  MAGIC_SCHOOL_SCALING,
  MAX_LUCK_TOKENS_DEFAULT,
  spellDataSchoolToMagicSchool,
} from "./constants";
import meritThresholds from "../../data/merit-thresholds.json";
import tribesData from "../../data/tribes.json";
import classesData from "../../data/classes.json";
import trainingsData from "../../data/trainings.json";
import {
  DAMAGE_MODIFIER_LEVELS,
  DAMAGE_TYPES,
} from "./constants";
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
    modifiers: [],
    situationalEffects: [],
  };
}

function normalizeEquipmentSlot(slot: EquipmentSlot): EquipmentSlot {
  return {
    ...slot,
    modifiers: slot.modifiers ?? [],
    situationalEffects: slot.situationalEffects ?? [],
  };
}

function normalizeEquipment(equipment: Character["equipment"]): Character["equipment"] {
  return {
    armamentSlots: equipment.armamentSlots.map(normalizeEquipmentSlot) as Character["equipment"]["armamentSlots"],
    holdoutWeapon: normalizeEquipmentSlot(equipment.holdoutWeapon),
    torsoArmor: normalizeEquipmentSlot(equipment.torsoArmor),
    helmet: normalizeEquipmentSlot(equipment.helmet),
    gloves: normalizeEquipmentSlot(equipment.gloves),
    footwear: normalizeEquipmentSlot(equipment.footwear),
    ring: normalizeEquipmentSlot(equipment.ring),
    artifact: normalizeEquipmentSlot(equipment.artifact),
    toolbelt: equipment.toolbelt.map(normalizeEquipmentSlot) as Character["equipment"]["toolbelt"],
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
  return Math.min(20, 20 - fns);
}

export function findTribe(tribeId: string): TribeData | undefined {
  return (tribesData as TribeData[]).find((t) => t.id === tribeId);
}

export function spellMemoryUsed(character: Character): number {
  return character.magic.learnedSpells.reduce((sum, s) => sum + s.spellMemoryCost, 0);
}

export function normalizeDamageModifiers(value: unknown): DamageModifierEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DamageModifierEntry =>
      entry &&
      typeof entry === "object" &&
      typeof entry.id === "string" &&
      typeof entry.damageType === "string" &&
      typeof entry.level === "string"
  );
}

export function formatDamageModifierEntry(entry: DamageModifierEntry): string {
  const typeLabel =
    DAMAGE_TYPES.find((t) => t.value === entry.damageType)?.label ?? entry.damageType;
  const levelLabel =
    DAMAGE_MODIFIER_LEVELS.find((l) => l.value === entry.level)?.label ?? entry.level;
  return `${typeLabel} ${levelLabel}`;
}

function inferSpellSchools(character: Character): MagicSchool[] {
  const existing = character.magic?.spellSchools;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing.filter(isMagicSchool);
  }

  if (character.class === "pilgrim") return ["twinMoon"];

  const fromSpells = new Set<MagicSchool>();
  for (const spell of character.magic?.learnedSpells ?? []) {
    const school = spellDataSchoolToMagicSchool(spell.school);
    if (school) fromSpells.add(school);
  }
  if (fromSpells.size > 0) return [...fromSpells];

  return [];
}

export function normalizeCharacter(character: Character): Character {
  const weaknesses = normalizeDamageModifiers(character.combatStats.weaknesses);
  const resistances = normalizeDamageModifiers(character.combatStats.resistances);
  const spellSchools = inferSpellSchools(character);

  const normalized: Character = {
    ...character,
    classPath: character.classPath ?? "",
    resolvedLevels: character.resolvedLevels ?? [],
    trainingPointsUnspent: character.trainingPointsUnspent ?? 0,
    advancementBonusesTaken: character.advancementBonusesTaken ?? [],
    skills: (character.skills ?? []).map((s) => ({
      ...s,
      source: s.source ?? "other",
    })),
    equipment: normalizeEquipment(character.equipment),
    combatStats: {
      ...character.combatStats,
      weaknesses,
      resistances,
    },
    magic: {
      ...character.magic,
      spellSchools,
    },
  };

  return normalized;
}

export function spellMatchesKnownSchools(
  spellSchool: string,
  knownSchools: MagicSchool[],
): boolean {
  const school = spellDataSchoolToMagicSchool(spellSchool);
  return school !== null && knownSchools.includes(school);
}

export function applyDerivedStats(character: Character, previous?: Character): Character {
  const normalized = normalizeCharacter(character);
  const level = levelFromMerit(normalized.merit);
  const critRate = derivedCritRate(normalized.attributes.fns);
  const meleeDmgBonus = normalized.attributes.str;
  const rangedDmgBonus = normalized.attributes.acc;
  const tribe = findTribe(normalized.tribe);

  const evasion = tribe
    ? tribe.evasionBase + normalized.attributes.fns
    : normalized.combatStats.evasion;
  const movement = tribe
    ? tribe.movementBase + normalized.attributes.spd
    : normalized.combatStats.movement;

  let encumbranceMax = normalized.inventory.encumbranceMax;
  if (tribe) {
    const prevStr =
      previous?.tribe === normalized.tribe ?
        previous.attributes.str
      : normalized.attributes.str;
    const flatExtra =
      previous?.tribe === normalized.tribe ?
        previous.inventory.encumbranceMax - tribe.encumbranceBase - prevStr
      : Math.max(
          0,
          normalized.inventory.encumbranceMax -
            tribe.encumbranceBase -
            normalized.attributes.str
        );
    encumbranceMax = tribe.encumbranceBase + normalized.attributes.str + flatExtra;
  }

  const spellMemoryCurrent = spellMemoryUsed(normalized);

  if (
    level === normalized.level &&
    critRate === normalized.combatStats.critRate &&
    meleeDmgBonus === normalized.combatStats.meleeDmgBonus &&
    rangedDmgBonus === normalized.combatStats.rangedDmgBonus &&
    evasion === normalized.combatStats.evasion &&
    movement === normalized.combatStats.movement &&
    encumbranceMax === normalized.inventory.encumbranceMax &&
    spellMemoryCurrent === normalized.magic.spellMemoryCurrent
  ) {
    return normalized;
  }

  return {
    ...normalized,
    level,
    combatStats: {
      ...normalized.combatStats,
      critRate,
      meleeDmgBonus,
      rangedDmgBonus,
      evasion,
      movement,
    },
    inventory: {
      ...normalized.inventory,
      encumbranceMax,
    },
    magic: { ...normalized.magic, spellMemoryCurrent },
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

const CLASS_FIXED_SCALING: Record<string, string> = {
  pilgrim: MAGIC_SCHOOL_SCALING.twinMoon,
};

export function getScalingAttributeForClass(
  classId: string,
  magicSchool?: MagicSchool | null,
  existingScaling?: string,
): string {
  if (classId === "mage") {
    if (magicSchool) return MAGIC_SCHOOL_SCALING[magicSchool];
    return existingScaling ?? "";
  }

  return CLASS_FIXED_SCALING[classId] ?? "";
}

export function applyClassScaling(
  character: Character,
  classId: string,
  magicSchool?: MagicSchool | null,
): Character {
  const scaling = getScalingAttributeForClass(
    classId,
    magicSchool,
    character.magic.scalingAttribute,
  );

  if (scaling === character.magic.scalingAttribute) return character;

  return {
    ...character,
    magic: { ...character.magic, scalingAttribute: scaling },
  };
}

export function applySpellSchools(
  character: Character,
  classId: string,
  magicSchool?: MagicSchool | null,
): Character {
  const schools: MagicSchool[] = [];
  if (classId === "mage" && magicSchool) {
    schools.push(magicSchool);
  } else if (classId === "pilgrim") {
    schools.push("twinMoon");
  }

  return {
    ...character,
    magic: { ...character.magic, spellSchools: schools },
  };
}

export function addSpellSchool(
  character: Character,
  school: MagicSchool,
): Character {
  if (character.magic.spellSchools.includes(school)) return character;

  const spellSchools = [...character.magic.spellSchools, school];
  const scalingAttribute =
    character.magic.scalingAttribute || MAGIC_SCHOOL_SCALING[school];

  return {
    ...character,
    magic: {
      ...character.magic,
      spellSchools,
      scalingAttribute,
    },
  };
}

export function removeSpellSchool(
  character: Character,
  school: MagicSchool,
): Character {
  if (!character.magic.spellSchools.includes(school)) return character;

  return {
    ...character,
    magic: {
      ...character.magic,
      spellSchools: character.magic.spellSchools.filter((s) => s !== school),
    },
  };
}

export function applyClassTrainings(character: Character, classId: string): Character {
  const cls = findClass(classId);
  if (!cls) return applyClassScaling({ ...character, class: classId }, classId);

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

  return applyClassScaling(
    {
      ...character,
      class: classId,
      trainings: [...withoutOldClass, ...newEntries],
    },
    classId,
  );
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
    classPath: "",
    specialization: "",
    level: 1,
    merit: 0,
    resolvedLevels: [],
    trainingPointsUnspent: 0,
    advancementBonusesTaken: [],
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
      weaknesses: [],
      resistances: [],
    },
    magic: {
      spellDie: "",
      spellMemoryCurrent: 0,
      spellMemoryMax: 0,
      scalingAttribute: "",
      spellSchools: [],
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
