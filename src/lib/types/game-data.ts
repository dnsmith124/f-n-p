import type { AttributeKey } from "./character";

export interface TribeData {
  id: string;
  name: string;
  description: string;
  physicalDescription: string;
  attributeBonuses: Partial<Record<AttributeKey, number>>;
  startingHP: number;
  startingStamina: number;
  evasionBase: number;
  movementBase: number;
  spellDie: string;
  spellMemoryBase: number;
  scalingAttribute: string;
  encumbranceBase: number;
  startingTrainings: string[];
  startingLanguages: string[];
  startingBonuses: StartingBonus[];
  advancementBonuses: AdvancementBonus[];
  gameplayNotes: string[];
}

export interface StartingBonus {
  name: string;
  description: string;
}

export interface AdvancementBonus {
  name: string;
  description: string;
}

export interface ClassData {
  id: string;
  name: string;
  type: "base" | "advanced" | "hybrid";
  description: string;
  parentClasses: string[];
  startingTrainings: string[];
  startingSkills: string[];
  favoredAttributes?: string[];
  statBonuses?: string;
  classBonus?: string;
  progression: ClassProgression[];
}

export interface ClassProgression {
  level: number;
  ability: string;
  description: string;
  type?: string;
  path?: string;
}

export interface SpellData {
  id: string;
  name: string;
  school: string;
  tier: string;
  castCost: number;
  effect: string;
  dmgType: string;
  range: string;
  area: string;
  additionalEffects: string;
  description: string;
  spellMemoryCost: number;
}

export interface TalentData {
  id: string;
  name: string;
  requirements: Partial<Record<AttributeKey, number>>;
  description: string;
}

export interface LanguageData {
  id: string;
  name: string;
  description: string;
  defaultKnownBy: string[];
  canBeLearned: boolean;
}

export interface DiseaseData {
  id: string;
  name: string;
  recoveryThreshold: number;
  effects: string;
  restrictions: string[];
}

export interface TrainingData {
  id: string;
  name: string;
  isAdvanced: boolean;
  description: string;
}

export interface ItemData {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  rarity: string;
  originalItem?: string;
  damage?: string;
  damageType?: string;
  training?: string;
  grip?: string;
  attribute?: string;
  rareAttribute?: string;
  range?: string;
  material?: string;
  weight?: number;
  value?: number;
  guard?: string;
  reload?: string;
  bonus?: string;
  resistances?: string;
  armorClass?: string;
  additionalEffects?: string;
  effect?: string;
  type?: string;
  charges?: string;
  blockRoll?: string;
  durability?: string;
  bashDmg?: string;
  parry?: string;
  blockBonus?: string;
  description?: string;
  curseEffects?: string;
  recipeType?: "armorer";
  ingLevelRequired?: number;
  ingLevel?: number;
  recipeGroup?: string;
}

export interface ZodiacData {
  id: string;
  name: string;
  description: string;
}

export interface MeritThreshold {
  level: number;
  meritRequired: number;
}
