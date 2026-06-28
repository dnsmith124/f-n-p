import type { ItemData } from "./types/game-data";
import type { BadgeVariant } from "@/components/ui/Badge";
import type {
  AttributeKey,
  DamageModifierLevel,
  DamageType,
  GearResistance,
  StatModifier,
} from "./types/character";
import {
  ATTRIBUTE_KEYS,
  DAMAGE_ABBR,
  ITEM_RARITY_CSS,
  STAT_BONUS_TARGETS,
  STAT_TOKEN_REGEX,
  STAT_TOKEN_REVERSED_REGEX,
} from "./constants";

const RARITY_ALIASES: Record<string, string> = {
  legendry: "legendary",
};

const VALID_RARITIES = new Set([
  "common", "uncommon", "rare", "legendary", "parallel", "crafted", "n/a",
]);

export function normalizeRarity(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (RARITY_ALIASES[lower]) return RARITY_ALIASES[lower];
  if (VALID_RARITIES.has(lower)) return lower;
  return "other";
}

export function getRarityCssClass(rarity: string): string {
  const normalized = normalizeRarity(rarity);
  return ITEM_RARITY_CSS[normalized] ?? "";
}

const RARITY_TO_BADGE: Record<string, BadgeVariant> = {
  uncommon: "uncommon",
  rare: "rare-item",
  legendary: "legendary",
  parallel: "parallel",
  crafted: "crafted",
};

export function getRarityBadgeVariant(rarity: string): BadgeVariant {
  return RARITY_TO_BADGE[normalizeRarity(rarity)] ?? "default";
}

export function itemMatchesSearch(item: ItemData, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    item.name,
    item.subcategory,
    item.training,
    item.material,
    item.effect,
    item.description,
    item.damageType,
    item.attribute,
  ].some((field) => field?.toLowerCase().includes(q));
}

export function getItemPreviewStat(item: ItemData): string {
  if (item.damage) return `${item.damage} ${item.damageType ?? ""}`.trim();
  if (item.bonus) return item.bonus;
  if (item.blockRoll) return `Block ${item.blockRoll}`;
  if (item.effect) return item.effect.length > 40 ? item.effect.slice(0, 40) + "…" : item.effect;
  if (item.charges) return `Charges: ${item.charges}`;
  if (item.material && item.category === "crafting") return item.material;
  return "";
}

export function buildEquipmentProperties(item: ItemData): string {
  const parts: string[] = [];

  if (item.category === "weapon" || item.category === "legendary-weapon") {
    if (item.damage) parts.push(`${item.damage} ${item.damageType ?? ""}`);
    if (item.training) parts.push(item.training);
    if (item.grip) parts.push(item.grip);
    if (item.attribute) parts.push(item.attribute);
    if (item.range && item.range !== "Melee") parts.push(item.range);
    if (item.material) parts.push(item.material);
    if (item.guard) parts.push(`Guard ${item.guard}`);
    if (item.reload) parts.push(`Reload ${item.reload}`);
    if (item.rareAttribute) parts.push(item.rareAttribute);
  } else if (item.category === "armor") {
    if (item.bonus) parts.push(item.bonus);
    if (item.armorClass) parts.push(item.armorClass);
    if (item.material) parts.push(item.material);
    if (item.additionalEffects) parts.push(item.additionalEffects);
    if (item.resistances) parts.push(item.resistances);
  } else if (item.category === "shield") {
    if (item.blockRoll) parts.push(`Block ${item.blockRoll}`);
    if (item.durability) parts.push(`Dur ${item.durability}`);
    if (item.bashDmg) parts.push(`Bash ${item.bashDmg}`);
    if (item.parry) parts.push(`Parry ${item.parry}`);
    if (item.blockBonus) parts.push(item.blockBonus);
    if (item.material) parts.push(item.material);
  } else if (item.category === "ring" || item.category === "artifact") {
    if (item.charges) parts.push(`Charges: ${item.charges}`);
    if (item.description) parts.push(item.description);
  } else if (item.category === "supply") {
    if (item.effect) parts.push(item.effect);
  }

  return parts.join(", ");
}

export function buildInventoryNotes(item: ItemData): string {
  const parts: string[] = [];
  if (item.value) parts.push(`${item.value} SV`);
  if (item.effect) parts.push(item.effect);
  else if (item.description) parts.push(item.description);
  const joined = parts.join(" — ");
  return joined.length > 120 ? joined.slice(0, 117) + "…" : joined;
}

const RESISTANCE_REGEX = /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*\(([^)]+)\)/g;

const PROSE_ATTR_TARGETS = Object.fromEntries(
  ATTRIBUTE_KEYS.map((k) => [k.toUpperCase(), k])
) as Record<string, AttributeKey>;

function parseModifierLevel(raw: string): DamageModifierLevel | null {
  const trimmed = raw.trim();
  if (trimmed === "1" || trimmed === "2" || trimmed === "3") return trimmed;
  if (trimmed.toUpperCase() === "X") return "immunity";
  if (trimmed === "Ab") return "absorb";
  return null;
}

/** Parse parenthetical level; negative values e.g. (-1) indicate weakness. */
function parseDamageLevel(raw: string): { level: DamageModifierLevel; isWeakness: boolean } | null {
  const trimmed = raw.trim();
  const negativeMatch = trimmed.match(/^-\s*([123])$/);
  if (negativeMatch) {
    return { level: negativeMatch[1] as DamageModifierLevel, isWeakness: true };
  }
  const level = parseModifierLevel(trimmed);
  if (level) return { level, isWeakness: false };
  return null;
}

function parseSignedInt(raw: string): number {
  return parseInt(raw.replace(/\s+/g, ""), 10) || 0;
}

function resolveDamageAbbr(raw: string): DamageType | null {
  const trimmed = raw.trim();
  if (DAMAGE_ABBR[trimmed]) return DAMAGE_ABBR[trimmed];
  const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  if (DAMAGE_ABBR[title]) return DAMAGE_ABBR[title];
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(DAMAGE_ABBR)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

function addStatModifier(
  modifiers: StatModifier[],
  abbr: string,
  valueRaw: string,
  source: string
) {
  const target = STAT_BONUS_TARGETS[abbr.toUpperCase()];
  if (!target) return;
  const value = parseSignedInt(valueRaw);
  const existing = modifiers.find((m) => m.target === target && m.source === source);
  if (existing) {
    existing.value += value;
  } else {
    modifiers.push({ target, value, source: source || "Gear" });
  }
}

/** Parse inline stat tokens like EVA +2, ARM+1, +1 STR from free-text. */
export function parseStatTokens(text: string, source: string): StatModifier[] {
  if (!text.trim()) return [];

  const modifiers: StatModifier[] = [];
  const statRegex = new RegExp(STAT_TOKEN_REGEX.source, STAT_TOKEN_REGEX.flags);
  const reversedRegex = new RegExp(
    STAT_TOKEN_REVERSED_REGEX.source,
    STAT_TOKEN_REVERSED_REGEX.flags
  );

  for (const match of text.matchAll(statRegex)) {
    addStatModifier(modifiers, match[1], match[2], source);
  }

  for (const match of text.matchAll(reversedRegex)) {
    addStatModifier(modifiers, match[2], match[1], source);
  }

  return modifiers;
}

export function parseDamageModifierTokens(
  text: string,
  source: string
): {
  resistances: GearResistance[];
  weaknesses: GearResistance[];
  situational: string[];
} {
  if (!text.trim()) return { resistances: [], weaknesses: [], situational: [] };

  const resistances: GearResistance[] = [];
  const weaknesses: GearResistance[] = [];
  const situational: string[] = [];
  const regex = new RegExp(RESISTANCE_REGEX.source, RESISTANCE_REGEX.flags);

  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    const before = text.slice(Math.max(0, start - 40), start).toLowerCase();

    const abbr = match[1].trim();
    const parsedLevel = parseDamageLevel(match[2]);
    const damageType = resolveDamageAbbr(abbr);

    if (damageType && parsedLevel) {
      const isWeaknessEntry =
        parsedLevel.isWeakness ||
        before.includes("weakness") ||
        match[0].toLowerCase().includes("weakness");
      const entry: GearResistance = {
        damageType,
        level: parsedLevel.level,
        source: source || "Gear",
      };
      if (isWeaknessEntry) weaknesses.push(entry);
      else resistances.push(entry);
    } else {
      situational.push(`${abbr} (${match[2]}) — ${source || "Gear"}`);
    }
  }

  return { resistances, weaknesses, situational };
}

/** @deprecated Use parseDamageModifierTokens */
export function parseResistanceTokens(
  text: string,
  source: string
): { resistances: GearResistance[]; situational: string[] } {
  const parsed = parseDamageModifierTokens(text, source);
  return {
    resistances: parsed.resistances,
    situational: [...parsed.situational, ...parsed.weaknesses.map(
      (w) => `${w.damageType} weakness (${w.level}) — ${w.source}`
    )],
  };
}

function isConditionalSnippet(snippet: string): boolean {
  return /\bwhen\b/i.test(snippet);
}

/** Extract structured bonuses from ring/artifact prose descriptions. */
function parseProseModifiers(text: string, source: string): StatModifier[] {
  if (!text.trim()) return [];

  const modifiers: StatModifier[] = [];
  const attrAttrRegex = /(\w+)\s+ATTR\s*([+-]\s*\d+)/gi;

  for (const match of text.matchAll(attrAttrRegex)) {
    const snippet = match[0];
    if (isConditionalSnippet(snippet)) continue;
    const abbr = match[1].toUpperCase();
    const target = PROSE_ATTR_TARGETS[abbr];
    if (!target) continue;
    modifiers.push({
      target,
      value: parseSignedInt(match[2]),
      source,
    });
  }

  const plusAttrRegex = /([+-]\s*\d+)\s+(STR|ACC|FNS|SPD|INT|MEM|VIT|CHA|SRV)\b/gi;
  for (const match of text.matchAll(plusAttrRegex)) {
    const snippet = match[0];
    if (isConditionalSnippet(snippet)) continue;
    const abbr = match[2].toUpperCase();
    const target = PROSE_ATTR_TARGETS[abbr];
    if (!target) continue;
    if (modifiers.some((m) => m.target === target && m.source === source)) continue;
    modifiers.push({
      target,
      value: parseSignedInt(match[1]),
      source,
    });
  }

  if (/additional\s+luck\s+token\s+slot/i.test(text)) {
    modifiers.push({ target: "luckTokensMax", value: 1, source });
  }

  const carryMatch = text.match(/carry\s+capacity\s+by\s+(\d+)/i);
  if (carryMatch && !isConditionalSnippet(carryMatch[0])) {
    modifiers.push({
      target: "encumbranceMax",
      value: parseInt(carryMatch[1], 10) || 0,
      source,
    });
  }

  return modifiers;
}

export function parseItemModifiers(item: ItemData): {
  modifiers: StatModifier[];
  situationalEffects: string[];
} {
  const source = item.name;
  const modifiers: StatModifier[] = [];
  const situationalEffects: string[] = [];

  if (item.resistances) {
    const parsed = parseDamageModifierTokens(item.resistances, source);
    situationalEffects.push(...parsed.situational);
  }

  if (item.category === "ring" || item.category === "artifact") {
    if (item.description) {
      modifiers.push(...parseProseModifiers(item.description, source));
      situationalEffects.push(item.description);
    }
  }

  if (item.additionalEffects) {
    situationalEffects.push(item.additionalEffects);
  }

  if (item.curseEffects && item.curseEffects !== "n/a") {
    situationalEffects.push(`Curse: ${item.curseEffects}`);
  }

  return { modifiers, situationalEffects };
}
