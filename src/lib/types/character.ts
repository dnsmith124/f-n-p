export type AttributeKey =
  | "str"
  | "acc"
  | "fns"
  | "spd"
  | "int"
  | "mem"
  | "vit"
  | "cha"
  | "srv";

export type CharacterAttributes = Record<AttributeKey, number>;

export type MagicSchool =
  | "pyromancy"
  | "oceansCall"
  | "greatStorm"
  | "arcadian"
  | "twinMoon"
  | "phantasm";

export type SpellTier = "novice" | "advanced" | "master";

export type DamageType =
  | "slashing"
  | "crushing"
  | "piercing"
  | "fire"
  | "ice"
  | "electric"
  | "water"
  | "wind"
  | "dark"
  | "light"
  | "toxic"
  | "mind"
  | "sound";

export type DamageModifierLevel = "1" | "2" | "3" | "immunity" | "absorb";

export interface DamageModifierEntry {
  id: string;
  damageType: DamageType;
  level: DamageModifierLevel;
}

export interface LearnedSpell {
  id: string;
  name: string;
  school: MagicSchool | "equipment" | "divine" | "core";
  tier: SpellTier | "none";
  castCost: number;
  effect: string;
  dmgType: string;
  range: string;
  area: string;
  additionalEffects: string;
  description: string;
  spellMemoryCost: number;
  isCore: boolean;
}

export interface CombatStats {
  hpCurrent: number;
  hpMax: number;
  staminaCurrent: number;
  staminaMax: number;
  evasion: number;
  armor: number;
  barrier: number;
  movement: number;
  critRate: number;
  meleeDmgBonus: number;
  rangedDmgBonus: number;
  spellDmgBonus: number;
  weaknesses: DamageModifierEntry[];
  resistances: DamageModifierEntry[];
}

export interface MagicStats {
  spellDie: string;
  spellMemoryCurrent: number;
  spellMemoryMax: number;
  scalingAttribute: string;
  learnedSpells: LearnedSpell[];
}

export interface SkillEntry {
  id: string;
  name: string;
  source: "tribe" | "class" | "specialization" | "advancement" | "other";
  description: string;
  abilityType?: string;
  classLevel?: number;
}

export interface TalentEntry {
  id: string;
  name: string;
  description: string;
}

export interface TrainingEntry {
  id: string;
  name: string;
  isAdvanced: boolean;
  source?: "class" | "manual";
}

export interface EquipmentSlot {
  name: string;
  description: string;
  weight: number;
  isBroken: boolean;
  properties: string;
}

export interface CharacterEquipment {
  armamentSlots: [EquipmentSlot, EquipmentSlot, EquipmentSlot];
  holdoutWeapon: EquipmentSlot;
  torsoArmor: EquipmentSlot;
  helmet: EquipmentSlot;
  gloves: EquipmentSlot;
  footwear: EquipmentSlot;
  ring: EquipmentSlot;
  artifact: EquipmentSlot;
  toolbelt: [EquipmentSlot, EquipmentSlot];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  notes: string;
}

export interface InventoryState {
  items: InventoryItem[];
  encumbranceCurrent: number;
  encumbranceMax: number;
  silver: number;
  marksOfParha: number;
  luckTokens: number;
  luckTokensMax: number;
}

export interface Character {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;

  name: string;
  tribe: string;
  class: string;
  classPath: string;
  specialization: string;
  level: number;
  merit: number;
  resolvedLevels: number[];
  trainingPointsUnspent: number;
  advancementBonusesTaken: string[];
  zodiac: string;

  attributes: CharacterAttributes;
  combatStats: CombatStats;
  magic: MagicStats;
  skills: SkillEntry[];
  talents: TalentEntry[];
  trainings: TrainingEntry[];
  languages: string[];
  equipment: CharacterEquipment;
  inventory: InventoryState;
  notes: string;
}

export interface CharacterSummary {
  id: string;
  name: string;
  tribe: string;
  class: string;
  level: number;
  updatedAt: string;
}

export interface CharacterListIndex {
  version: number;
  characters: CharacterSummary[];
  lastActiveId: string | null;
}
