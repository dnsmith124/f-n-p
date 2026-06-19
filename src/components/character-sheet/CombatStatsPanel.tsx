"use client";

import type { Character, CombatStats } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { DerivedField } from "@/components/ui/DerivedField";
import { ResourceTracker } from "@/components/ui/ResourceTracker";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface CombatStatsPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function CombatStatsPanel({ character, onUpdate }: CombatStatsPanelProps) {
  const cs = character.combatStats;

  const updateStat = <K extends keyof CombatStats>(field: K, value: CombatStats[K]) => {
    onUpdate((prev) => ({
      ...prev,
      combatStats: { ...prev.combatStats, [field]: value },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <ResourceTracker
          label="HP"
          current={cs.hpCurrent}
          max={cs.hpMax}
          onCurrentChange={(v) => updateStat("hpCurrent", v)}
          onMaxChange={(v) => updateStat("hpMax", v)}
          color="bg-danger"
        />
        <ResourceTracker
          label="Stamina"
          current={cs.staminaCurrent}
          max={cs.staminaMax}
          onCurrentChange={(v) => updateStat("staminaCurrent", v)}
          onMaxChange={(v) => updateStat("staminaMax", v)}
          color="bg-highlight"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {character.tribe ? (
          <DerivedField value={cs.evasion} label="EVA" hint="base+FNS" />
        ) : (
          <EditableField
            value={cs.evasion}
            onChange={(v) => updateStat("evasion", v as number)}
            type="number"
            label="EVA"
          />
        )}
        <EditableField
          value={cs.armor}
          onChange={(v) => updateStat("armor", v as number)}
          type="number"
          label="ARM"
        />
        <EditableField
          value={cs.barrier}
          onChange={(v) => updateStat("barrier", v as number)}
          type="number"
          label="BAR"
        />
        {character.tribe ? (
          <DerivedField value={cs.movement} label="MOVE" hint="base+SPD" />
        ) : (
          <EditableField
            value={cs.movement}
            onChange={(v) => updateStat("movement", v as number)}
            type="number"
            label="MOVE"
          />
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <DerivedField
          value={`${cs.critRate}+`}
          label="Crit"
          hint="= 20−FNS"
        />
        <EditableField
          value={cs.meleeDmgBonus}
          onChange={(v) => updateStat("meleeDmgBonus", v as number)}
          type="number"
          showSign
          label="Melee+"
        />
        <EditableField
          value={cs.rangedDmgBonus}
          onChange={(v) => updateStat("rangedDmgBonus", v as number)}
          type="number"
          showSign
          label="Ranged+"
        />
        <EditableField
          value={cs.spellDmgBonus}
          onChange={(v) => updateStat("spellDmgBonus", v as number)}
          type="number"
          showSign
          label="Spell+"
        />
      </div>

      <CollapsibleSection title="Weak / Resist" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <EditableField
            value={cs.weaknesses}
            onChange={(v) => updateStat("weaknesses", String(v))}
            label="Weaknesses"
            placeholder="None"
          />
          <EditableField
            value={cs.resistances}
            onChange={(v) => updateStat("resistances", String(v))}
            label="Resistances"
            placeholder="None"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
