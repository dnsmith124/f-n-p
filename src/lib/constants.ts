import type { AttributeKey, MagicSchool } from "./types/character";

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

export const MAX_LEVEL = 15;
export const MAX_LUCK_TOKENS_DEFAULT = 2;

export const CHARACTER_VERSION = 1;
