"use client";

import type { ReactNode } from "react";
import type { ItemData } from "@/lib/types/game-data";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { IngLevelStars } from "./IngLevelStars";
import { getRarityCssClass, normalizeRarity } from "@/lib/item-utils";

interface AlchemyItemCardProps {
  item: ItemData;
  mode: "craftable" | "ingredient";
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between text-xs py-0.5 gap-2">
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-text-secondary text-right">{value}</span>
    </div>
  );
}

export function AlchemyItemCard({ item, mode }: AlchemyItemCardProps) {
  const rarityCss = getRarityCssClass(item.rarity);
  const rarity = normalizeRarity(item.rarity);
  const ingLevel = mode === "craftable" ? item.ingLevelRequired : item.ingLevel;
  const badge = ingLevel ? `ING ${ingLevel}` : undefined;

  return (
    <CollapsibleSection
      title={item.name}
      defaultOpen={false}
      badge={badge}
      className={rarityCss}
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1 text-[10px]">
          {rarity !== "other" && rarity !== "n/a" && (
            <span className="px-1.5 py-0.5 rounded bg-surface-raised text-text-muted border border-border-light capitalize">
              {rarity}
            </span>
          )}
        </div>
        {mode === "craftable" && item.ingLevelRequired != null && (
          <StatRow
            label="ING Lv. Required"
            value={<IngLevelStars level={item.ingLevelRequired} />}
          />
        )}
        {mode === "ingredient" && item.ingLevel != null && (
          <StatRow label="ING Lv." value={<IngLevelStars level={item.ingLevel} />} />
        )}
        {mode === "craftable" && item.effect && (
          <div className="text-xs text-text-secondary">{item.effect}</div>
        )}
        {mode === "ingredient" && item.description && (
          <StatRow label="Biome" value={item.description} />
        )}
        {item.value != null && item.value > 0 && (
          <div className="text-[10px] text-text-muted pt-1 border-t border-border-light">
            {item.value} SV
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
