import type {
  AttributeKey,
  DamageModifierLevel,
  DamageType,
  MagicSchool,
} from "./types/character";

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "str", "acc", "fns",
  "spd", "int", "mem",
  "vit", "cha", "srv",
];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: "Strength",
  acc: "Accuracy",
  fns: "Finesse",
  spd: "Speed",
  int: "Intelligence",
  mem: "Memory",
  vit: "Vitality",
  cha: "Charisma",
  srv: "Survival",
};

export const ATTRIBUTE_ABBR: Record<AttributeKey, string> = {
  str: "STR",
  acc: "ACC",
  fns: "FNS",
  spd: "SPD",
  int: "INT",
  mem: "MEM",
  vit: "VIT",
  cha: "CHA",
  srv: "SRV",
};

export const ATTRIBUTE_DESCRIPTIONS: Record<AttributeKey, string> = {
  str: "Increases melee DMG and encumbrance",
  acc: "Increases ATK rolls and ranged weapon DMG",
  fns: "Increases EVA; each point raises crit rate by 1",
  spd: "Increases movement, blocking, and Martial Maneuver rolls",
  int: "Increases Spellcast rolls",
  mem: "Increases Spell Memory",
  vit: "Increases Maximum HP & Stamina",
  cha: "Increases NPC speech rolls and Luck",
  srv: "Required for lengthy adventures",
};

export const ATTRIBUTE_MIN = -7;
export const ATTRIBUTE_MAX = 7;

export const MAGIC_SCHOOLS: MagicSchool[] = [
  "pyromancy",
  "oceansCall",
  "greatStorm",
  "arcadian",
  "twinMoon",
  "phantasm",
];

const SPELL_DATA_SCHOOL_TO_MAGIC: Record<string, MagicSchool> = {
  pyromancy: "pyromancy",
  "oceans-call": "oceansCall",
  "great-storm": "greatStorm",
  arcadian: "arcadian",
  "twin-moon": "twinMoon",
  phantasm: "phantasm",
  oceansCall: "oceansCall",
  greatStorm: "greatStorm",
  twinMoon: "twinMoon",
};

export const MAGIC_SCHOOL_TO_SPELL_DATA: Record<MagicSchool, string> = {
  pyromancy: "pyromancy",
  oceansCall: "oceans-call",
  greatStorm: "great-storm",
  arcadian: "arcadian",
  twinMoon: "twin-moon",
  phantasm: "phantasm",
};

export function spellDataSchoolToMagicSchool(school: string): MagicSchool | null {
  return SPELL_DATA_SCHOOL_TO_MAGIC[school] ?? null;
}

export function isMagicSchool(value: string): value is MagicSchool {
  return (MAGIC_SCHOOLS as readonly string[]).includes(value);
}

export const MAGIC_SCHOOL_LABELS: Record<MagicSchool, string> = {
  pyromancy: "Pyromancy",
  oceansCall: "Ocean's Call",
  greatStorm: "Great Storm",
  arcadian: "Arcadian Arts",
  twinMoon: "Twin Moon",
  phantasm: "Phantasm Arts",
};

export const MAGIC_SCHOOL_CSS: Record<MagicSchool, string> = {
  pyromancy: "school-pyromancy",
  oceansCall: "school-oceans-call",
  greatStorm: "school-great-storm",
  arcadian: "school-arcadian",
  twinMoon: "school-twin-moon",
  phantasm: "school-phantasm",
};

/** Attribute that scales spell effects for each school of magic. */
export const MAGIC_SCHOOL_SCALING: Record<MagicSchool, string> = {
  pyromancy: "SRV",
  oceansCall: "VIT",
  greatStorm: "SPD",
  arcadian: "SRV",
  twinMoon: "VIT",
  phantasm: "CHA",
};

export const SPELL_SCALING_ATTRIBUTES = ["SRV", "VIT", "SPD", "CHA"] as const;

export const MAX_LEVEL = 15;
export const MAX_LUCK_TOKENS_DEFAULT = 2;

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: "slashing", label: "Slashing" },
  { value: "crushing", label: "Crushing" },
  { value: "piercing", label: "Piercing" },
  { value: "fire", label: "Fire" },
  { value: "ice", label: "Ice" },
  { value: "electric", label: "Electric" },
  { value: "water", label: "Water" },
  { value: "wind", label: "Wind" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "toxic", label: "Toxic" },
  { value: "mind", label: "Mind" },
  { value: "sound", label: "Sound" },
];

export const DAMAGE_MODIFIER_LEVELS: {
  value: DamageModifierLevel;
  label: string;
  hint: string;
}[] = [
  { value: "1", label: "(1)", hint: "1D4 added to or mitigated from DMG roll(s)" },
  { value: "2", label: "(2)", hint: "1D6 added to or mitigated from DMG roll(s)" },
  { value: "3", label: "(3)", hint: "1D8 added to or mitigated from DMG roll(s)" },
  { value: "immunity", label: "(X)", hint: "Immune to specified DMG type" },
  { value: "absorb", label: "(Ab)", hint: "DMG dealt is converted into HP recovery" },
];

export const CHARACTER_VERSION = 2;
