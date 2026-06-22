"use client";

import { useState } from "react";
import type { Character, CharacterEquipment, EquipmentSlot } from "@/lib/types/character";
import type { ItemData } from "@/lib/types/game-data";
import { EditableField } from "@/components/ui/EditableField";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { ItemPickerModal } from "@/components/items/ItemPickerModal";
import { buildEquipmentProperties } from "@/lib/item-utils";
import { EQUIPMENT_SLOT_FILTERS } from "@/lib/constants";

interface EquipmentPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

interface SlotEditorProps {
  label: string;
  slot: EquipmentSlot;
  onChange: (slot: EquipmentSlot) => void;
  onBrowse?: () => void;
}

function SlotEditor({ label, slot, onChange, onBrowse }: SlotEditorProps) {
  const update = (field: keyof EquipmentSlot, value: unknown) => {
    onChange({ ...slot, [field]: value });
  };

  return (
    <CollapsibleSection
      title={label}
      defaultOpen={false}
      badge={slot.name || undefined}
    >
      <div className="space-y-1">
        <div className="flex items-end gap-1">
          <EditableField
            value={slot.name}
            onChange={(v) => update("name", String(v))}
            label="Name"
            placeholder="Empty"
            className="flex-1"
          />
          {onBrowse && (
            <button
              onClick={onBrowse}
              className="shrink-0 mb-0.5 p-1.5 rounded text-text-muted hover:text-accent hover:bg-surface-raised transition-colors"
              title="Browse items"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <EditableField
            value={slot.weight}
            onChange={(v) => update("weight", v)}
            type="number"
            min={0}
            label="Weight"
          />
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={slot.isBroken}
                onChange={(e) => update("isBroken", e.target.checked)}
                className="rounded"
              />
              Broken
            </label>
          </div>
        </div>
        <EditableField
          value={slot.properties}
          onChange={(v) => update("properties", String(v))}
          label="Properties"
          placeholder="Attributes, enchants, etc."
        />
        <EditableField
          value={slot.description}
          onChange={(v) => update("description", String(v))}
          label="Description"
          placeholder="—"
        />
      </div>
    </CollapsibleSection>
  );
}

export function EquipmentPanel({ character, onUpdate }: EquipmentPanelProps) {
  const eq = character.equipment;
  const [pickerSlot, setPickerSlot] = useState<{
    key: string;
    index: number | null;
  } | null>(null);

  const updateSlot = (
    path: keyof CharacterEquipment,
    index: number | null,
    slot: EquipmentSlot
  ) => {
    onUpdate((prev) => {
      const newEq = { ...prev.equipment };
      if (index !== null) {
        const arr = [...(newEq[path] as EquipmentSlot[])];
        arr[index] = slot;
        (newEq[path] as EquipmentSlot[]) = arr as typeof newEq[typeof path] extends EquipmentSlot[] ? EquipmentSlot[] : never;
      } else {
        (newEq as Record<string, unknown>)[path] = slot;
      }
      return { ...prev, equipment: newEq as CharacterEquipment };
    });
  };

  const handleItemSelect = (item: ItemData) => {
    if (!pickerSlot) return;
    const slot: EquipmentSlot = {
      name: item.name,
      weight: item.weight ?? 0,
      properties: buildEquipmentProperties(item),
      description: item.description ?? "",
      isBroken: false,
    };
    updateSlot(
      pickerSlot.key as keyof CharacterEquipment,
      pickerSlot.index,
      slot
    );
  };

  const pickerFilter = pickerSlot
    ? EQUIPMENT_SLOT_FILTERS[pickerSlot.key]
    : null;

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted">
        Armaments (3 slots)
      </h4>
      {eq.armamentSlots.map((slot, i) => (
        <SlotEditor
          key={i}
          label={`Armament ${i + 1}`}
          slot={slot}
          onChange={(s) => updateSlot("armamentSlots", i, s)}
          onBrowse={() => setPickerSlot({ key: "armamentSlots", index: i })}
        />
      ))}

      <SlotEditor
        label="Holdout Weapon"
        slot={eq.holdoutWeapon}
        onChange={(s) => updateSlot("holdoutWeapon", null, s)}
        onBrowse={() => setPickerSlot({ key: "holdoutWeapon", index: null })}
      />

      <h4 className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
        Armor
      </h4>
      <SlotEditor
        label="Torso"
        slot={eq.torsoArmor}
        onChange={(s) => updateSlot("torsoArmor", null, s)}
        onBrowse={() => setPickerSlot({ key: "torsoArmor", index: null })}
      />
      <SlotEditor
        label="Helmet"
        slot={eq.helmet}
        onChange={(s) => updateSlot("helmet", null, s)}
        onBrowse={() => setPickerSlot({ key: "helmet", index: null })}
      />
      <SlotEditor
        label="Gloves"
        slot={eq.gloves}
        onChange={(s) => updateSlot("gloves", null, s)}
        onBrowse={() => setPickerSlot({ key: "gloves", index: null })}
      />
      <SlotEditor
        label="Footwear"
        slot={eq.footwear}
        onChange={(s) => updateSlot("footwear", null, s)}
        onBrowse={() => setPickerSlot({ key: "footwear", index: null })}
      />

      <h4 className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
        Accessories
      </h4>
      <SlotEditor
        label="Ring"
        slot={eq.ring}
        onChange={(s) => updateSlot("ring", null, s)}
        onBrowse={() => setPickerSlot({ key: "ring", index: null })}
      />
      <SlotEditor
        label="Artifact"
        slot={eq.artifact}
        onChange={(s) => updateSlot("artifact", null, s)}
        onBrowse={() => setPickerSlot({ key: "artifact", index: null })}
      />

      <h4 className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
        Toolbelt (2 quick-use slots)
      </h4>
      {eq.toolbelt.map((slot, i) => (
        <SlotEditor
          key={i}
          label={`Toolbelt ${i + 1}`}
          slot={slot}
          onChange={(s) => updateSlot("toolbelt", i, s)}
          onBrowse={() => setPickerSlot({ key: "toolbelt", index: i })}
        />
      ))}

      <ItemPickerModal
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={handleItemSelect}
        title="Select Item"
        categoryFilter={pickerFilter?.categories}
        subcategoryFilter={pickerFilter?.subcategories}
      />
    </div>
  );
}
