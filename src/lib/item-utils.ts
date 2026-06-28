import type { ItemData } from "./types/game-data";
import type { BadgeVariant } from "@/components/ui/Badge";
import { ITEM_RARITY_CSS } from "./constants";

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
