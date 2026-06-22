"use client";

import type { ItemData } from "@/lib/types/game-data";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { getRarityCssClass, getItemPreviewStat } from "@/lib/item-utils";
import { ItemDetailContent } from "./ItemDetailContent";

interface ItemCardProps {
  item: ItemData;
  defaultOpen?: boolean;
}

export function ItemCard({ item, defaultOpen = false }: ItemCardProps) {
  const rarityCss = getRarityCssClass(item.rarity);
  const preview = getItemPreviewStat(item);

  return (
    <CollapsibleSection
      title={item.name}
      defaultOpen={defaultOpen}
      badge={preview || undefined}
      className={rarityCss}
    >
      <ItemDetailContent item={item} />
    </CollapsibleSection>
  );
}
