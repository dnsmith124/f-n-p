"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useGameData } from "@/hooks/useGameData";
import { AppHeader } from "@/components/ui/AppHeader";
import { ItemCard } from "@/components/items/ItemCard";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { ITEM_CATEGORIES, ITEM_RARITIES } from "@/lib/constants";
import { itemMatchesSearch, normalizeRarity, getRecipeGroup } from "@/lib/item-utils";
import { loadCharacter } from "@/lib/storage";

function getItemsBackNav(from: string | null): { backHref: string; backLabel: string } {
  const safeFrom =
    from?.startsWith("/") && !from.startsWith("//") ? from : null;

  if (!safeFrom || safeFrom === "/") {
    return { backHref: "/", backLabel: "Home" };
  }

  const charMatch = safeFrom.match(/^\/character\/([^/]+)$/);
  if (charMatch) {
    const character = loadCharacter(charMatch[1]);
    return { backHref: safeFrom, backLabel: character?.name || "Character" };
  }

  if (safeFrom === "/character/new") {
    return { backHref: safeFrom, backLabel: "New Character" };
  }

  return { backHref: safeFrom, backLabel: "Back" };
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsPageFallback />}>
      <ItemsPageContent />
    </Suspense>
  );
}

function ItemsPageFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="max-w-2xl mx-auto w-full p-4 pb-8">
        <div className="text-center py-4 mb-2">
          <h1 className="text-lg font-bold tracking-wide text-primary uppercase">
            Item Reference
          </h1>
        </div>
      </div>
    </div>
  );
}

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { backHref, backLabel } = useMemo(() => getItemsBackNav(from), [from]);
  const { items } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  const selectedCatDef = useMemo(
    () => ITEM_CATEGORIES.find((c) => c.value === selectedCategory) ?? null,
    [selectedCategory]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCatDef) {
        if (item.category !== selectedCatDef.category) return false;
        if (selectedCatDef.subcategory && item.subcategory !== selectedCatDef.subcategory) return false;
      }
      if (selectedRarity && normalizeRarity(item.rarity) !== selectedRarity) return false;
      if (!itemMatchesSearch(item, searchQuery)) return false;
      return true;
    });
  }, [items, selectedCatDef, selectedRarity, searchQuery]);

  const itemToCatValue = (item: { category: string; subcategory: string }): string => {
    const match = ITEM_CATEGORIES.find(
      (c) => c.category === item.category && (!c.subcategory || c.subcategory === item.subcategory)
    );
    return match?.value ?? item.category;
  };

  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();

    for (const item of filteredItems) {
      let key: string;
      if (!selectedCatDef) {
        key = itemToCatValue(item);
      } else if (selectedCategory === "recipe") {
        key = getRecipeGroup(item);
      } else {
        key = item.subcategory;
      }
      const group = groups.get(key);
      if (group) group.push(item);
      else groups.set(key, [item]);
    }
    return groups;
  }, [filteredItems, selectedCatDef, selectedCategory]);

  const getGroupLabel = (key: string): string => {
    if (selectedCatDef) return key;
    const cat = ITEM_CATEGORIES.find((c) => c.value === key);
    return cat?.label ?? key;
  };

  const handleCategoryClick = (value: string | null) => {
    setSelectedCategory(value);
  };

  const handleRarityClick = (value: string | null) => {
    setSelectedRarity(value);
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader backHref={backHref} backLabel={backLabel} />

      <div className="max-w-2xl mx-auto w-full p-4 pb-8">
        <div className="text-center py-4 mb-2">
          <h1 className="text-lg font-bold tracking-wide text-primary uppercase">
            Item Reference
          </h1>
          <p className="text-[10px] text-text-muted mt-0.5">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-accent"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
          <ChipButton
            label="All"
            active={selectedCategory === null}
            onClick={() => handleCategoryClick(null)}
          />
          {ITEM_CATEGORIES.map((cat) => (
            <ChipButton
              key={cat.value}
              label={cat.label}
              active={selectedCategory === cat.value}
              onClick={() =>
                handleCategoryClick(selectedCategory === cat.value ? null : cat.value)
              }
            />
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
          <ChipButton
            label="Any Rarity"
            active={selectedRarity === null}
            onClick={() => handleRarityClick(null)}
          />
          {ITEM_RARITIES.map((r) => (
            <ChipButton
              key={r.value}
              label={r.label}
              active={selectedRarity === r.value}
              onClick={() =>
                handleRarityClick(selectedRarity === r.value ? null : r.value)
              }
            />
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-sm text-text-muted italic py-8 text-center">
            No items match your filters
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedItems.entries()).map(([group, groupItems]) => (
              <CollapsibleSection
                key={group}
                title={getGroupLabel(group)}
                badge={groupItems.length}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {groupItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-surface border-border-light text-text-secondary hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}
