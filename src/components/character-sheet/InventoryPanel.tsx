"use client";

import { useCallback, useState } from "react";
import type { Character, InventoryItem, InventoryState } from "@/lib/types/character";
import type { ItemData } from "@/lib/types/game-data";
import { EditableField } from "@/components/ui/EditableField";
import { ResourceTracker } from "@/components/ui/ResourceTracker";
import { ItemPickerModal } from "@/components/items/ItemPickerModal";
import { generateId } from "@/lib/utils";
import { buildInventoryNotes } from "@/lib/item-utils";

interface InventoryPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function InventoryPanel({ character, onUpdate }: InventoryPanelProps) {
  const inv = character.inventory;
  const [showCatalog, setShowCatalog] = useState(false);

  const addFromCatalog = useCallback(
    (itemData: ItemData) => {
      const item: InventoryItem = {
        id: generateId(),
        name: itemData.name,
        quantity: 1,
        weight: itemData.weight ?? 0,
        notes: buildInventoryNotes(itemData),
      };
      onUpdate((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, items: [...prev.inventory.items, item] },
      }));
    },
    [onUpdate]
  );

  const updateInv = useCallback(
    <K extends keyof InventoryState>(field: K, value: InventoryState[K]) => {
      onUpdate((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, [field]: value },
      }));
    },
    [onUpdate]
  );

  const addItem = useCallback(() => {
    const item: InventoryItem = {
      id: generateId(),
      name: "",
      quantity: 1,
      weight: 0,
      notes: "",
    };
    onUpdate((prev) => ({
      ...prev,
      inventory: { ...prev.inventory, items: [...prev.inventory.items, item] },
    }));
  }, [onUpdate]);

  const updateItem = useCallback(
    (id: string, field: keyof InventoryItem, value: unknown) => {
      onUpdate((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          items: prev.inventory.items.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
          ),
        },
      }));
    },
    [onUpdate]
  );

  const removeItem = useCallback(
    (id: string) => {
      onUpdate((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          items: prev.inventory.items.filter((item) => item.id !== id),
        },
      }));
    },
    [onUpdate]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <EditableField
          value={inv.silver}
          onChange={(v) => updateInv("silver", v as number)}
          type="number"
          min={0}
          label="Silver (SV)"
        />
        <div>
          <ResourceTracker
            label="Luck"
            current={inv.luckTokens}
            max={inv.luckTokensMax}
            onCurrentChange={(v) => updateInv("luckTokens", v)}
            onMaxChange={(v) => updateInv("luckTokensMax", v)}
            color="bg-accent"
          />
        </div>
      </div>

      <ResourceTracker
        label="Weight"
        current={inv.encumbranceCurrent}
        max={inv.encumbranceMax}
        onCurrentChange={(v) => updateInv("encumbranceCurrent", v)}
        onMaxChange={(v) => updateInv("encumbranceMax", v)}
        color="bg-secondary"
      />

      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
          Items
        </h4>
        {inv.items.length === 0 ? (
          <p className="text-xs text-text-muted italic py-2">Inventory is empty</p>
        ) : (
          <div className="space-y-1">
            {inv.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 bg-surface border border-border-light rounded px-2 py-1"
              >
                <EditableField
                  value={item.name}
                  onChange={(v) => updateItem(item.id, "name", String(v))}
                  placeholder="Item name"
                  className="flex-1 text-xs"
                  displayClassName="text-xs"
                  inputClassName="text-xs"
                />
                <EditableField
                  value={item.quantity}
                  onChange={(v) => updateItem(item.id, "quantity", v)}
                  type="number"
                  min={0}
                  className="w-10 text-xs text-center"
                  displayClassName="text-xs text-center"
                  inputClassName="text-xs text-center w-10"
                />
                <span className="text-[10px] text-text-muted">x</span>
                <EditableField
                  value={item.weight}
                  onChange={(v) => updateItem(item.id, "weight", v)}
                  type="number"
                  min={0}
                  className="w-10 text-xs text-center"
                  displayClassName="text-xs text-center"
                  inputClassName="text-xs text-center w-10"
                />
                <span className="text-[10px] text-text-muted">wt</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-text-muted hover:text-danger text-xs ml-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={addItem}
            className="flex-1 py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
          >
            + Add Item
          </button>
          <button
            onClick={() => setShowCatalog(true)}
            className="flex-1 py-1.5 rounded-lg border border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors text-xs"
          >
            + From Catalog
          </button>
        </div>
      </div>

      <ItemPickerModal
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelect={addFromCatalog}
        title="Add from Catalog"
      />
    </div>
  );
}
