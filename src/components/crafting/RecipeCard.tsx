"use client";

import type { ItemData } from "@/lib/types/game-data";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { getRarityCssClass, normalizeRarity } from "@/lib/item-utils";

interface RecipeCardProps {
  item: ItemData;
}

function StatRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary text-right ml-2">{value}</span>
    </div>
  );
}

export function RecipeCard({ item }: RecipeCardProps) {
  const rarityCss = getRarityCssClass(item.rarity);
  const rarity = normalizeRarity(item.rarity);

  return (
    <CollapsibleSection
      title={item.name}
      defaultOpen={false}
      badge={item.material || undefined}
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
        <StatRow label="Materials" value={item.material} />
      </div>
    </CollapsibleSection>
  );
}
