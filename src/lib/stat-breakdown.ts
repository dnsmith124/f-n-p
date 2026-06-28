import type {
  AttributeKey,
  Character,
  CharacterEquipment,
  EquipmentSlot,
  GearResistance,
  StatModifier,
} from "./types/character";
import { ATTRIBUTE_KEYS, MAX_LUCK_TOKENS_DEFAULT } from "./constants";
import { findTribe } from "./utils";
import {
  parseDamageModifierTokens,
  parseStatTokens,
} from "./item-utils";
import { formatDamageModifierEntry } from "./utils";
import type { DamageModifierEntry } from "./types/character";

export interface StatContribution {
  label: string;
  value: number;
}

export interface StatBreakdown {
  base: number;
  contributions: StatContribution[];
  total: number;
}

export interface EncumbranceWeightEntry {
  label: string;
  weight: number;
}

export interface SituationalEffectEntry {
  source: string;
  text: string;
}

export interface CharacterStatBreakdowns {
  attributes: Record<AttributeKey, StatBreakdown>;
  armor: StatBreakdown;
  barrier: StatBreakdown;
  evasion: StatBreakdown;
  movement: StatBreakdown;
  critRate: StatBreakdown;
  meleeDmgBonus: StatBreakdown;
  rangedDmgBonus: StatBreakdown;
  spellDmgBonus: StatBreakdown;
  encumbrance: {
    current: number;
    max: StatBreakdown;
    weightEntries: EncumbranceWeightEntry[];
  };
  luckTokensMax: StatBreakdown;
  gearResistances: GearResistance[];
  gearWeaknesses: GearResistance[];
  situationalEffects: SituationalEffectEntry[];
}

function dedupeSituationalEffects(entries: SituationalEffectEntry[]): SituationalEffectEntry[] {
  const seen = new Set<string>();
  const result: SituationalEffectEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.source}\0${entry.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function slotLabel(slot: EquipmentSlot, fallback: string): string {
  return slot.name.trim() || fallback;
}

function allEquipmentSlots(equipment: CharacterEquipment): { slot: EquipmentSlot; label: string }[] {
  const entries: { slot: EquipmentSlot; label: string }[] = [];

  equipment.armamentSlots.forEach((slot, i) => {
    entries.push({ slot, label: slotLabel(slot, `Armament ${i + 1}`) });
  });
  entries.push({ slot: equipment.holdoutWeapon, label: slotLabel(equipment.holdoutWeapon, "Holdout") });
  entries.push({ slot: equipment.torsoArmor, label: slotLabel(equipment.torsoArmor, "Torso") });
  entries.push({ slot: equipment.helmet, label: slotLabel(equipment.helmet, "Helmet") });
  entries.push({ slot: equipment.gloves, label: slotLabel(equipment.gloves, "Gloves") });
  entries.push({ slot: equipment.footwear, label: slotLabel(equipment.footwear, "Footwear") });
  entries.push({ slot: equipment.ring, label: slotLabel(equipment.ring, "Ring") });
  entries.push({ slot: equipment.artifact, label: slotLabel(equipment.artifact, "Artifact") });
  equipment.toolbelt.forEach((slot, i) => {
    entries.push({ slot, label: slotLabel(slot, `Toolbelt ${i + 1}`) });
  });

  return entries;
}

function slotTextSources(slot: EquipmentSlot): string[] {
  const sources: string[] = [];
  const properties = slot.properties.trim();

  if (properties) sources.push(properties);

  const description = slot.description.trim();
  if (description && description !== properties) {
    sources.push(description);
  }

  for (const effect of slot.situationalEffects ?? []) {
    const trimmed = effect.trim();
    if (!trimmed) continue;
    if (properties.includes(trimmed)) continue;
    sources.push(trimmed);
  }

  return sources;
}

function collectSlotModifiers(
  equipment: CharacterEquipment
): {
  modifiers: StatModifier[];
  resistances: GearResistance[];
  weaknesses: GearResistance[];
  situationalEffects: SituationalEffectEntry[];
  weightEntries: EncumbranceWeightEntry[];
} {
  const modifiers: StatModifier[] = [];
  const resistances: GearResistance[] = [];
  const weaknesses: GearResistance[] = [];
  const situationalEffects: SituationalEffectEntry[] = [];
  const weightEntries: EncumbranceWeightEntry[] = [];

  for (const { slot, label } of allEquipmentSlots(equipment)) {
    if (slot.weight > 0) {
      weightEntries.push({ label, weight: slot.weight });
    }

    if (slot.isBroken) continue;

    modifiers.push(...(slot.modifiers ?? []));

    for (const effect of slot.situationalEffects ?? []) {
      const trimmed = effect.trim();
      if (trimmed) situationalEffects.push({ source: label, text: trimmed });
    }

    const hasStructuredModifiers = (slot.modifiers?.length ?? 0) > 0;

    for (const text of slotTextSources(slot)) {
      if (!hasStructuredModifiers) {
        modifiers.push(...parseStatTokens(text, label));
      }
      const damageParse = parseDamageModifierTokens(text, label);
      resistances.push(...damageParse.resistances);
      weaknesses.push(...damageParse.weaknesses);
      for (const situational of damageParse.situational) {
        situationalEffects.push({ source: label, text: situational });
      }
    }
  }

  return { modifiers, resistances, weaknesses, situationalEffects, weightEntries };
}

function sumModifiersForTarget(
  modifiers: StatModifier[],
  target: StatModifier["target"]
): StatContribution[] {
  const sourceMap = new Map<string, number>();
  for (const mod of modifiers) {
    if (mod.target !== target) continue;
    sourceMap.set(mod.source, (sourceMap.get(mod.source) ?? 0) + mod.value);
  }
  const contributions: StatContribution[] = [];
  for (const [label, value] of sourceMap) {
    if (value !== 0) contributions.push({ label, value });
  }
  return contributions;
}

function buildBreakdown(base: number, contributions: StatContribution[]): StatBreakdown {
  const gearTotal = contributions.reduce((sum, c) => sum + c.value, 0);
  return {
    base,
    contributions,
    total: base + gearTotal,
  };
}

export function formatStatBreakdownBody(
  breakdown: StatBreakdown,
  options?: { formatValue?: (value: number) => string }
): string {
  const format = options?.formatValue ?? ((v: number) => (v > 0 ? `+${v}` : String(v)));
  const lines = [`Base: ${format(breakdown.base)}`];

  for (const c of breakdown.contributions) {
    lines.push(`${c.label}: ${format(c.value)}`);
  }

  lines.push("", `Total: ${format(breakdown.total)}`);
  return lines.join("\n");
}

export function formatStatBreakdownTooltip(
  title: string,
  breakdown: StatBreakdown,
  options?: { formatValue?: (value: number) => string }
): string {
  return [title, "", formatStatBreakdownBody(breakdown, options)].join("\n");
}

export function formatEncumbranceTooltip(
  breakdowns: CharacterStatBreakdowns
): string {
  const lines = ["Encumbrance", "", "Weight carried:"];

  if (breakdowns.encumbrance.weightEntries.length === 0) {
    lines.push("• (none)");
  } else {
    for (const entry of breakdowns.encumbrance.weightEntries) {
      lines.push(`• ${entry.label}: ${entry.weight}`);
    }
  }

  lines.push("", `Current: ${breakdowns.encumbrance.current}`);
  lines.push("", "Max:");
  lines.push(formatStatBreakdownBody(breakdowns.encumbrance.max));

  return lines.join("\n");
}

export function formatGearDamageModifiersTooltip(
  label: string,
  entries: GearResistance[]
): string {
  if (entries.length === 0) return "";

  const lines = [`Gear ${label.toLowerCase()} (from equipment):`, ""];
  for (const entry of entries) {
    const mod: DamageModifierEntry = {
      id: "",
      damageType: entry.damageType,
      level: entry.level,
    };
    lines.push(`• ${formatDamageModifierEntry(mod)} — ${entry.source}`);
  }
  return lines.join("\n");
}

/** @deprecated Use formatGearDamageModifiersTooltip */
export function formatGearResistancesTooltip(resistances: GearResistance[]): string {
  return formatGearDamageModifiersTooltip("Resistances", resistances);
}

export function getStatBreakdowns(character: Character): CharacterStatBreakdowns {
  const { modifiers, resistances, weaknesses, situationalEffects, weightEntries } =
    collectSlotModifiers(character.equipment);

  const inventoryWeightEntries: EncumbranceWeightEntry[] = character.inventory.items
    .filter((item) => item.weight > 0 && item.quantity > 0)
    .map((item) => ({
      label: item.name.trim() || "Inventory item",
      weight: item.weight * item.quantity,
    }));

  const allWeightEntries = [...weightEntries, ...inventoryWeightEntries];
  const encumbranceCurrent = allWeightEntries.reduce((sum, e) => sum + e.weight, 0);

  const attributeBreakdowns = {} as Record<AttributeKey, StatBreakdown>;
  const effectiveAttributes = {} as Record<AttributeKey, number>;

  for (const key of ATTRIBUTE_KEYS) {
    const contributions = sumModifiersForTarget(modifiers, key);
    const base = character.attributes[key];
    attributeBreakdowns[key] = buildBreakdown(base, contributions);
    effectiveAttributes[key] = attributeBreakdowns[key].total;
  }

  const tribe = findTribe(character.tribe);

  const armorContributions = sumModifiersForTarget(modifiers, "armor");
  const barrierContributions = sumModifiersForTarget(modifiers, "barrier");
  const evasionGearContributions = sumModifiersForTarget(modifiers, "evasion");
  const movementGearContributions = sumModifiersForTarget(modifiers, "movement");
  const encumbranceMaxContributions = sumModifiersForTarget(modifiers, "encumbranceMax");
  const luckContributions = sumModifiersForTarget(modifiers, "luckTokensMax");

  const armor = buildBreakdown(character.combatStats.armor, armorContributions);
  const barrier = buildBreakdown(character.combatStats.barrier, barrierContributions);

  let evasion: StatBreakdown;
  if (tribe) {
    const evasionContributions: StatContribution[] = [
      { label: "FNS", value: effectiveAttributes.fns },
      ...evasionGearContributions,
    ];
    evasion = buildBreakdown(tribe.evasionBase, evasionContributions);
  } else {
    evasion = buildBreakdown(character.combatStats.evasion, evasionGearContributions);
  }

  let movement: StatBreakdown;
  if (tribe) {
    const movementContributions: StatContribution[] = [
      { label: "SPD", value: effectiveAttributes.spd },
      ...movementGearContributions,
    ];
    movement = buildBreakdown(tribe.movementBase, movementContributions);
  } else {
    movement = buildBreakdown(character.combatStats.movement, movementGearContributions);
  }

  const strGearContributions = sumModifiersForTarget(modifiers, "str");
  const accGearContributions = sumModifiersForTarget(modifiers, "acc");

  const critTotal = Math.min(20, 20 - effectiveAttributes.fns);
  const critRate: StatBreakdown = {
    base: 20,
    contributions: [{ label: "FNS", value: -effectiveAttributes.fns }],
    total: critTotal,
  };
  const meleeDmgBonus = buildBreakdown(character.attributes.str, strGearContributions);
  const rangedDmgBonus = buildBreakdown(character.attributes.acc, accGearContributions);
  const spellDmgBonus = buildBreakdown(character.combatStats.spellDmgBonus, []);

  let encumbranceMax: StatBreakdown;
  if (tribe) {
    const flatBonus =
      character.inventory.encumbranceMax -
      (tribe.encumbranceBase + character.attributes.str);
    const contributions: StatContribution[] = [
      { label: "STR", value: effectiveAttributes.str },
    ];
    if (flatBonus !== 0) {
      contributions.push({ label: "Bonus", value: flatBonus });
    }
    contributions.push(...encumbranceMaxContributions);
    encumbranceMax = buildBreakdown(tribe.encumbranceBase, contributions);
  } else {
    encumbranceMax = buildBreakdown(
      character.inventory.encumbranceMax,
      encumbranceMaxContributions
    );
  }

  const luckTokensMax = buildBreakdown(
    character.inventory.luckTokensMax || MAX_LUCK_TOKENS_DEFAULT,
    luckContributions
  );

  return {
    attributes: attributeBreakdowns,
    armor,
    barrier,
    evasion,
    movement,
    critRate,
    meleeDmgBonus,
    rangedDmgBonus,
    spellDmgBonus,
    encumbrance: {
      current: encumbranceCurrent,
      max: encumbranceMax,
      weightEntries: allWeightEntries,
    },
    luckTokensMax,
    gearResistances: resistances,
    gearWeaknesses: weaknesses,
    situationalEffects: dedupeSituationalEffects(
      situationalEffects.filter((e) => e.text.trim())
    ),
  };
}
