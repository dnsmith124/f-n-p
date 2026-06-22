"use client";

import { useState, useMemo } from "react";
import type { ItemData } from "@/lib/types/game-data";
import { useGameData } from "@/hooks/useGameData";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  itemMatchesSearch,
  getItemPreviewStat,
  normalizeRarity,
  getRarityBadgeVariant,
} from "@/lib/item-utils";
import { ITEM_CATEGORIES } from "@/lib/constants";

interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: ItemData) => void;
  title?: string;
  categoryFilter?: string[];
  subcategoryFilter?: string[];
}

export function ItemPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Browse Items",
  categoryFilter,
  subcategoryFilter,
}: ItemPickerModalProps) {
  const { items } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const showCategoryChips = !categoryFilter || categoryFilter.length > 1;

  const availableCategories = useMemo(() => {
    if (!categoryFilter) return ITEM_CATEGORIES;
    return ITEM_CATEGORIES.filter((c) => categoryFilter.includes(c.category));
  }, [categoryFilter]);

  const selectedCatDef = useMemo(
    () => ITEM_CATEGORIES.find((c) => c.value === selectedCategory) ?? null,
    [selectedCategory]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter && !categoryFilter.includes(item.category)) return false;
      if (subcategoryFilter && !subcategoryFilter.includes(item.subcategory)) return false;
      if (selectedCatDef) {
        if (item.category !== selectedCatDef.category) return false;
        if (selectedCatDef.subcategory && item.subcategory !== selectedCatDef.subcategory) return false;
      }
      if (!itemMatchesSearch(item, searchQuery)) return false;
      return true;
    });
  }, [items, categoryFilter, subcategoryFilter, selectedCatDef, searchQuery]);

  const displayItems = filteredItems.slice(0, 50);

  const handleSelect = (item: ItemData) => {
    onSelect(item);
    onClose();
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-accent"
        autoFocus
      />

      {showCategoryChips && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors ${
              selectedCategory === null
                ? "bg-primary text-white border-primary"
                : "bg-surface border-border-light text-text-secondary hover:border-accent"
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
              }
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                selectedCategory === cat.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-border-light text-text-secondary hover:border-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1">
        {displayItems.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4 text-center">
            No items found
          </p>
        ) : (
          displayItems.map((item) => {
            const rarity = normalizeRarity(item.rarity);
            const badgeVariant = getRarityBadgeVariant(item.rarity);
            const preview = getItemPreviewStat(item);

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-raised transition-colors border border-transparent hover:border-border-light"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text truncate">
                    {item.name}
                  </span>
                  {rarity !== "other" && rarity !== "n/a" && rarity !== "common" && (
                    <Badge variant={badgeVariant}>{rarity}</Badge>
                  )}
                </div>
                {preview && (
                  <div className="text-[10px] text-text-muted mt-0.5 truncate">
                    {preview}
                  </div>
                )}
              </button>
            );
          })
        )}
        {filteredItems.length > 50 && (
          <p className="text-[10px] text-text-muted text-center py-2">
            Showing 50 of {filteredItems.length} — refine your search
          </p>
        )}
      </div>
    </Modal>
  );
}
