"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGameData } from "@/hooks/useGameData";
import { AppHeader } from "@/components/ui/AppHeader";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { RecipeCard } from "@/components/crafting/RecipeCard";
import { AlchemyItemCard } from "@/components/crafting/AlchemyItemCard";
import { ITEM_RARITIES } from "@/lib/constants";
import { loadCharacter } from "@/lib/storage";
import {
  filterCraftingItems,
  getArmorerRecipeGroupOrder,
  groupArmorerRecipes,
  isAlchemyCraftable,
  isForagedIngredient,
} from "@/lib/crafting-utils";

type CraftingType = "armorer" | "alchemy";

function getCraftingBackNav(from: string | null): { backHref: string; backLabel: string } {
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

export default function CraftingPage() {
  return (
    <Suspense fallback={<CraftingPageFallback />}>
      <CraftingPageContent />
    </Suspense>
  );
}

function CraftingPageFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="max-w-2xl mx-auto w-full p-4 pb-8">
        <div className="text-center py-4 mb-2">
          <h1 className="text-lg font-bold tracking-wide text-primary uppercase">
            Crafting Reference
          </h1>
        </div>
      </div>
    </div>
  );
}

function CraftingPageContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { backHref, backLabel } = useMemo(() => getCraftingBackNav(from), [from]);
  const { items } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<CraftingType>("armorer");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => filterCraftingItems(items, selectedType, searchQuery, selectedRarity),
    [items, selectedType, searchQuery, selectedRarity]
  );

  const armorerGroups = useMemo(() => {
    if (selectedType !== "armorer") return null;
    return groupArmorerRecipes(filteredItems);
  }, [selectedType, filteredItems]);

  const alchemyCraftables = useMemo(
    () => filteredItems.filter(isAlchemyCraftable),
    [filteredItems]
  );

  const alchemyIngredients = useMemo(
    () => filteredItems.filter(isForagedIngredient),
    [filteredItems]
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader backHref={backHref} backLabel={backLabel} />

      <div className="max-w-2xl mx-auto w-full p-4 pb-8">
        <div className="text-center py-4 mb-2">
          <h1 className="text-lg font-bold tracking-wide text-primary uppercase">
            Crafting Reference
          </h1>
          <p className="text-[10px] text-text-muted mt-0.5">
            {filteredItems.length} entr{filteredItems.length !== 1 ? "ies" : "y"}
          </p>
        </div>

        <input
          type="text"
          placeholder="Search crafting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-accent"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
          <ChipButton
            label="Armorer"
            active={selectedType === "armorer"}
            onClick={() => setSelectedType("armorer")}
          />
          <ChipButton
            label="Alchemy"
            active={selectedType === "alchemy"}
            onClick={() => setSelectedType("alchemy")}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
          <ChipButton
            label="Any Rarity"
            active={selectedRarity === null}
            onClick={() => setSelectedRarity(null)}
          />
          {ITEM_RARITIES.map((r) => (
            <ChipButton
              key={r.value}
              label={r.label}
              active={selectedRarity === r.value}
              onClick={() =>
                setSelectedRarity(selectedRarity === r.value ? null : r.value)
              }
            />
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-sm text-text-muted italic py-8 text-center">
            No entries match your filters
          </p>
        ) : selectedType === "armorer" && armorerGroups ? (
          <div className="space-y-4">
            {getArmorerRecipeGroupOrder(armorerGroups).map((group) => {
              const groupItems = armorerGroups.get(group);
              if (!groupItems) return null;
              return (
                <CollapsibleSection
                  key={group}
                  title={group}
                  badge={groupItems.length}
                  defaultOpen={false}
                >
                  <div className="space-y-1.5">
                    {groupItems.map((item) => (
                      <RecipeCard key={item.id} item={item} />
                    ))}
                  </div>
                </CollapsibleSection>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {alchemyCraftables.length > 0 && (
              <CollapsibleSection
                title="Craftable Items"
                badge={alchemyCraftables.length}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {alchemyCraftables.map((item) => (
                    <AlchemyItemCard key={item.id} item={item} mode="craftable" />
                  ))}
                </div>
              </CollapsibleSection>
            )}
            {alchemyIngredients.length > 0 && (
              <CollapsibleSection
                title="Ingredients"
                badge={alchemyIngredients.length}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {alchemyIngredients.map((item) => (
                    <AlchemyItemCard key={item.id} item={item} mode="ingredient" />
                  ))}
                </div>
              </CollapsibleSection>
            )}
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
