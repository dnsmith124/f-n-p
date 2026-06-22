"use client";

import { useState } from "react";
import type { Character } from "@/lib/types/character";
import { TabBar, type Tab } from "@/components/ui/TabBar";
import { AttributesPanel } from "./AttributesPanel";
import { CombatStatsPanel } from "./CombatStatsPanel";
import { MagicPanel } from "./MagicPanel";
import { SkillsPanel } from "./SkillsPanel";
import { TalentsPanel } from "./TalentsPanel";
import { TrainingsPanel } from "./TrainingsPanel";
import { LanguagesPanel } from "./LanguagesPanel";
import { EquipmentPanel } from "./EquipmentPanel";
import { InventoryPanel } from "./InventoryPanel";
import { EditableField } from "@/components/ui/EditableField";

interface CharacterSheetTabsProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

const STAT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const MAGIC_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const SKILLS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const GEAR_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const BAG_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const TABS: Tab[] = [
  { id: "stats", label: "Stats", icon: STAT_ICON },
  { id: "magic", label: "Magic", icon: MAGIC_ICON },
  { id: "skills", label: "Skills", icon: SKILLS_ICON },
  { id: "gear", label: "Gear", icon: GEAR_ICON },
  { id: "bag", label: "Bag", icon: BAG_ICON },
];

export function CharacterSheetTabs({
  character,
  onUpdate,
}: CharacterSheetTabsProps) {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="flex flex-col md:flex-row flex-1">
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-3">
        {activeTab === "stats" && (
          <div className="space-y-4">
            <AttributesPanel character={character} onUpdate={onUpdate} />
            <CombatStatsPanel character={character} onUpdate={onUpdate} />
          </div>
        )}
        {activeTab === "magic" && (
          <MagicPanel character={character} onUpdate={onUpdate} />
        )}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Skills & Abilities
              </h3>
              <SkillsPanel character={character} onUpdate={onUpdate} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Talents
              </h3>
              <TalentsPanel character={character} onUpdate={onUpdate} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Trainings
              </h3>
              <TrainingsPanel character={character} onUpdate={onUpdate} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Languages
              </h3>
              <LanguagesPanel character={character} onUpdate={onUpdate} />
            </div>
          </div>
        )}
        {activeTab === "gear" && (
          <EquipmentPanel character={character} onUpdate={onUpdate} />
        )}
        {activeTab === "bag" && (
          <div className="space-y-4">
            <InventoryPanel character={character} onUpdate={onUpdate} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Notes
              </h3>
              <EditableField
                value={character.notes}
                onChange={(v) =>
                  onUpdate((p) => ({ ...p, notes: String(v) }))
                }
                placeholder="Free-form notes..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
