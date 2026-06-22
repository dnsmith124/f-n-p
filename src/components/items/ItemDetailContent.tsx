"use client";

import type { ItemData } from "@/lib/types/game-data";
import { normalizeRarity } from "@/lib/item-utils";

interface ItemDetailContentProps {
  item: ItemData;
}

function StatRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary text-right ml-2">{value}</span>
    </div>
  );
}

function WeaponStats({ item }: { item: ItemData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4">
        <StatRow label="Damage" value={item.damage ? `${item.damage} ${item.damageType ?? ""}`.trim() : undefined} />
        <StatRow label="Training" value={item.training} />
        <StatRow label="Grip" value={item.grip} />
        <StatRow label="Attribute" value={item.attribute} />
        <StatRow label="Range" value={item.range} />
        <StatRow label="Material" value={item.material} />
        <StatRow label="Guard" value={item.guard} />
        <StatRow label="Reload" value={item.reload} />
      </div>
      {item.rareAttribute && <StatRow label="Rare Attribute" value={item.rareAttribute} />}
    </>
  );
}

function ArmorStats({ item }: { item: ItemData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4">
        <StatRow label="Bonus" value={item.bonus} />
        <StatRow label="Armor Class" value={item.armorClass} />
        <StatRow label="Material" value={item.material} />
        <StatRow label="Resistances" value={item.resistances} />
      </div>
      {item.additionalEffects && (
        <div className="text-xs text-text-secondary mt-1">{item.additionalEffects}</div>
      )}
    </>
  );
}

function ShieldStats({ item }: { item: ItemData }) {
  return (
    <div className="grid grid-cols-2 gap-x-4">
      <StatRow label="Block" value={item.blockRoll} />
      <StatRow label="Durability" value={item.durability} />
      <StatRow label="Bash" value={item.bashDmg} />
      <StatRow label="Parry" value={item.parry} />
      <StatRow label="Block Bonus" value={item.blockBonus} />
      <StatRow label="Material" value={item.material} />
      <StatRow label="Training" value={item.training} />
    </div>
  );
}

export function ItemDetailContent({ item }: ItemDetailContentProps) {
  const cat = item.category;
  const rarity = normalizeRarity(item.rarity);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1 text-[10px]">
        <span className="px-1.5 py-0.5 rounded bg-surface-raised text-text-muted border border-border-light">
          {item.subcategory}
        </span>
        {rarity !== "other" && rarity !== "n/a" && (
          <span className="px-1.5 py-0.5 rounded bg-surface-raised text-text-muted border border-border-light capitalize">
            {rarity}
          </span>
        )}
      </div>

      {(cat === "weapon" || cat === "legendary-weapon") && <WeaponStats item={item} />}
      {cat === "armor" && <ArmorStats item={item} />}
      {cat === "shield" && <ShieldStats item={item} />}

      {cat === "mod" && item.description && (
        <div className="text-xs text-text-muted italic">{item.description}</div>
      )}

      {cat === "mod" && item.effect && (
        <div className="text-xs text-text-secondary whitespace-pre-line">{item.effect}</div>
      )}

      {cat === "enchantment" && item.effect && (
        <div className="text-xs text-text-secondary">{item.effect}</div>
      )}

      {cat === "enchantment" && item.description && (
        <StatRow label="Magic School" value={item.description} />
      )}

      {(cat === "supply" || cat === "food") && item.effect && (
        <div className="text-xs text-text-secondary">{item.effect}</div>
      )}

      {(cat === "ring" || cat === "artifact" || cat === "legendary-weapon") && item.description && (
        <div className="text-xs text-text-secondary">{item.description}</div>
      )}

      {(cat === "ring" || cat === "artifact") && item.charges && (
        <StatRow label="Charges" value={item.charges} />
      )}

      {cat === "crafting" && item.material && (
        <StatRow label="Materials" value={item.material} />
      )}

      <div className="flex gap-4 pt-1 border-t border-border-light mt-1.5">
        {item.value != null && item.value > 0 && (
          <span className="text-[10px] text-text-muted">{item.value} SV</span>
        )}
        {item.weight != null && item.weight > 0 && (
          <span className="text-[10px] text-text-muted">Wt {item.weight}</span>
        )}
      </div>
    </div>
  );
}
