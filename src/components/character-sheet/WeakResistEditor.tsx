"use client";

import { useCallback, useState } from "react";
import type {
  DamageModifierEntry,
  DamageModifierLevel,
  DamageType,
} from "@/lib/types/character";
import { Badge } from "@/components/ui/Badge";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { EditableSelect } from "@/components/ui/EditableSelect";
import { DAMAGE_MODIFIER_LEVELS, DAMAGE_TYPES } from "@/lib/constants";
import { formatDamageModifierEntry, generateId } from "@/lib/utils";

interface WeakResistEditorProps {
  weaknesses: DamageModifierEntry[];
  resistances: DamageModifierEntry[];
  onWeaknessesChange: (entries: DamageModifierEntry[]) => void;
  onResistancesChange: (entries: DamageModifierEntry[]) => void;
}

const LEVEL_OPTIONS = DAMAGE_MODIFIER_LEVELS.map((option) => ({
  value: option.value,
  label:
    option.value === "immunity"
      ? "(X) Immunity"
      : option.value === "absorb"
        ? "(Ab) Absorb"
        : `${option.label} ${option.hint.split(" ")[0]}`,
}));

const KIND_OPTIONS = [
  { value: "weakness", label: "Weakness" },
  { value: "resistance", label: "Resistance" },
];

function ActiveEntries({
  label,
  entries,
  emptyLabel,
  variant,
  onRemove,
}: {
  label: string;
  entries: DamageModifierEntry[];
  emptyLabel: string;
  variant: "danger" | "accent";
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted">{label}</h4>
      <div className="flex flex-wrap gap-1">
        {entries.length === 0 && (
          <span className="text-xs text-text-muted italic">{emptyLabel}</span>
        )}
        {entries.map((entry) => (
          <Badge key={entry.id} variant={variant} onRemove={() => onRemove(entry.id)}>
            {formatDamageModifierEntry(entry)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function WeakResistEditor({
  weaknesses,
  resistances,
  onWeaknessesChange,
  onResistancesChange,
}: WeakResistEditorProps) {
  const [damageType, setDamageType] = useState<DamageType | "">("");
  const [level, setLevel] = useState<DamageModifierLevel | "">("");
  const [kind, setKind] = useState<"weakness" | "resistance" | "">("");

  const removeWeakness = useCallback(
    (id: string) => {
      onWeaknessesChange(weaknesses.filter((entry) => entry.id !== id));
    },
    [onWeaknessesChange, weaknesses]
  );

  const removeResistance = useCallback(
    (id: string) => {
      onResistancesChange(resistances.filter((entry) => entry.id !== id));
    },
    [onResistancesChange, resistances]
  );

  const addEntry = useCallback(() => {
    if (!damageType || !level || !kind) return;

    const entry: DamageModifierEntry = {
      id: generateId(),
      damageType,
      level,
    };

    if (kind === "weakness") {
      onWeaknessesChange([...weaknesses, entry]);
    } else {
      onResistancesChange([...resistances, entry]);
    }

    setDamageType("");
    setLevel("");
    setKind("");
  }, [
    damageType,
    kind,
    level,
    onResistancesChange,
    onWeaknessesChange,
    resistances,
    weaknesses,
  ]);

  const canAdd = damageType !== "" && level !== "" && kind !== "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActiveEntries
          label="Weaknesses"
          entries={weaknesses}
          emptyLabel="None"
          variant="danger"
          onRemove={removeWeakness}
        />
        <ActiveEntries
          label="Resistances"
          entries={resistances}
          emptyLabel="None"
          variant="accent"
          onRemove={removeResistance}
        />
      </div>

      <CollapsibleSection title="Explanation" defaultOpen={false}>
        <div className="space-y-0.5">
          {DAMAGE_MODIFIER_LEVELS.map((option) => (
            <p key={option.value} className="text-[10px] text-text-muted leading-snug">
              <span className="font-mono text-text-secondary">{option.label}</span>{" "}
              {option.hint}
            </p>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Add new" defaultOpen={false}>
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <EditableSelect
              value={damageType}
              onChange={(value) => setDamageType(value as DamageType | "")}
              options={DAMAGE_TYPES}
              label="Damage type"
              placeholder="Select type"
            />
            <EditableSelect
              value={level}
              onChange={(value) => setLevel(value as DamageModifierLevel | "")}
              options={LEVEL_OPTIONS}
              label="Level"
              placeholder="Select level"
            />
            <EditableSelect
              value={kind}
              onChange={(value) => setKind(value as "weakness" | "resistance" | "")}
              options={KIND_OPTIONS}
              label="Weak / Resist"
              placeholder="Select"
            />
          </div>
          <button
            type="button"
            onClick={addEntry}
            disabled={!canAdd}
            className="w-full py-1.5 rounded-lg border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:border-dashed disabled:border-border disabled:text-text-muted border-border text-text-secondary hover:border-accent hover:text-accent"
          >
            Add entry
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
