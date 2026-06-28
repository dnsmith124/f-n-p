"use client";

import type { Character, CombatStats } from "@/lib/types/character";
import type { CharacterStatBreakdowns } from "@/lib/stat-breakdown";
import { GearStatField } from "@/components/ui/GearStatField";
import { ResourceTracker } from "@/components/ui/ResourceTracker";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { WeakResistEditor } from "@/components/character-sheet/WeakResistEditor";
import { SituationalEffectsPanel } from "@/components/character-sheet/SituationalEffectsPanel";

interface CombatStatsPanelProps {
  character: Character;
  breakdowns: CharacterStatBreakdowns;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function CombatStatsPanel({ character, breakdowns, onUpdate }: CombatStatsPanelProps) {
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
          labelText="HP"
          current={cs.hpCurrent}
          max={cs.hpMax}
          onCurrentChange={(v) => updateStat("hpCurrent", v)}
          onMaxChange={(v) => updateStat("hpMax", v)}
          color="bg-danger"
        />
        <ResourceTracker
          label="Stamina"
          labelText="Stamina"
          current={cs.staminaCurrent}
          max={cs.staminaMax}
          onCurrentChange={(v) => updateStat("staminaCurrent", v)}
          onMaxChange={(v) => updateStat("staminaMax", v)}
          color="bg-highlight"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <GearStatField
          label="EVA"
          breakdown={breakdowns.evasion}
          onBaseChange={character.tribe ? undefined : (v) => updateStat("evasion", v)}
          hintTitle="Evasion"
        />
        <GearStatField
          label="ARM"
          breakdown={breakdowns.armor}
          onBaseChange={(v) => updateStat("armor", v)}
          hintTitle="Armor"
        />
        <GearStatField
          label="BAR"
          breakdown={breakdowns.barrier}
          onBaseChange={(v) => updateStat("barrier", v)}
          hintTitle="Barrier"
        />
        <GearStatField
          label="MOVE"
          breakdown={breakdowns.movement}
          onBaseChange={character.tribe ? undefined : (v) => updateStat("movement", v)}
          hintTitle="Movement"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <GearStatField
          label="Crit"
          breakdown={breakdowns.critRate}
          hintTitle="Critical Hit Rate (20 − FNS)"
          showSign
        />
        <GearStatField
          label="Melee+"
          breakdown={breakdowns.meleeDmgBonus}
          hintTitle="Melee Damage Bonus (STR)"
          showSign
        />
        <GearStatField
          label="Ranged+"
          breakdown={breakdowns.rangedDmgBonus}
          hintTitle="Ranged Damage Bonus (ACC)"
          showSign
        />
        <GearStatField
          label="Spell+"
          breakdown={breakdowns.spellDmgBonus}
          onBaseChange={(v) => updateStat("spellDmgBonus", v)}
          hintTitle="Spell Damage Bonus"
          showSign
        />
      </div>

      <CollapsibleSection title="Situational Effects" defaultOpen={false}>
        <SituationalEffectsPanel effects={breakdowns.situationalEffects} />
      </CollapsibleSection>

      <CollapsibleSection title="Weak / Resist" defaultOpen={false}>
        <WeakResistEditor
          weaknesses={cs.weaknesses}
          resistances={cs.resistances}
          gearWeaknesses={breakdowns.gearWeaknesses}
          gearResistances={breakdowns.gearResistances}
          onWeaknessesChange={(entries) => updateStat("weaknesses", entries)}
          onResistancesChange={(entries) => updateStat("resistances", entries)}
        />
      </CollapsibleSection>
    </div>
  );
}
