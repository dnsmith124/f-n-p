"use client";

import type { Character, CharacterEquipment, EquipmentSlot } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface EquipmentPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

interface SlotEditorProps {
  label: string;
  slot: EquipmentSlot;
  onChange: (slot: EquipmentSlot) => void;
}

function SlotEditor({ label, slot, onChange }: SlotEditorProps) {
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
        <EditableField
          value={slot.name}
          onChange={(v) => update("name", String(v))}
          label="Name"
          placeholder="Empty"
        />
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
        />
      ))}

      <SlotEditor
        label="Holdout Weapon"
        slot={eq.holdoutWeapon}
        onChange={(s) => updateSlot("holdoutWeapon", null, s)}
      />

      <h4 className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
        Armor
      </h4>
      <SlotEditor
        label="Torso"
        slot={eq.torsoArmor}
        onChange={(s) => updateSlot("torsoArmor", null, s)}
      />
      <SlotEditor
        label="Helmet"
        slot={eq.helmet}
        onChange={(s) => updateSlot("helmet", null, s)}
      />
      <SlotEditor
        label="Gloves"
        slot={eq.gloves}
        onChange={(s) => updateSlot("gloves", null, s)}
      />
      <SlotEditor
        label="Footwear"
        slot={eq.footwear}
        onChange={(s) => updateSlot("footwear", null, s)}
      />

      <h4 className="text-[10px] uppercase tracking-wider text-text-muted mt-3">
        Accessories
      </h4>
      <SlotEditor
        label="Ring"
        slot={eq.ring}
        onChange={(s) => updateSlot("ring", null, s)}
      />
      <SlotEditor
        label="Artifact"
        slot={eq.artifact}
        onChange={(s) => updateSlot("artifact", null, s)}
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
        />
      ))}
    </div>
  );
}
