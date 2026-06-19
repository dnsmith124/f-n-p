"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";
import type { TribeData } from "@/lib/types/game-data";

interface TribeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tribeId: string, startingBonus?: { name: string; description: string }) => void;
  currentTribeId: string;
}

const ATTR_LABELS: Record<string, string> = {
  str: "STR", acc: "ACC", fns: "FNS", spd: "SPD",
  int: "INT", mem: "MEM", vit: "VIT", cha: "CHA", srv: "SRV",
};

export function AttrBonuses({ tribe }: { tribe: TribeData }) {
  const entries = Object.entries(tribe.attributeBonuses).filter(([, v]) => v !== 0);
  if (entries.length === 0) return <span className="text-xs font-mono text-text-muted">(+2) &amp; (-2) chosen by player</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className={`text-xs font-mono ${val > 0 ? "text-highlight" : "text-danger"}`}
        >
          {ATTR_LABELS[key]} {val > 0 ? `+${val}` : val}
        </span>
      ))}
    </span>
  );
}

export function BonusSelector({
  tribe,
  chosen,
  onChoose,
}: {
  tribe: TribeData;
  chosen: string | undefined;
  onChoose: (name: string) => void;
}) {
  const isSelectableBonus = (b: { name: string }) =>
    !b.name.match(/^\d+['']\s*\d+/) && b.name !== "ADVANCEMENT BONUSES";

  const selectable = tribe.startingBonuses.filter(isSelectableBonus);
  if (selectable.length === 0) return null;

  const selected = chosen ?? selectable[0]?.name;
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
        Starting Bonus (Select One)
      </h4>
      <div className="space-y-1">
        {selectable.map((bonus) => (
          <label
            key={bonus.name}
            className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              selected === bonus.name
                ? "border-accent bg-accent/5"
                : "border-border-light hover:border-border"
            }`}
          >
            <input
              type="radio"
              name={`bonus-${tribe.id}`}
              checked={selected === bonus.name}
              onChange={() => onChoose(bonus.name)}
              className="mt-0.5 accent-accent"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-text">{bonus.name}</span>
              <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                {bonus.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export function StatPills({ tribe }: { tribe: TribeData }) {
  const stats = [
    { label: "HP", value: tribe.startingHP },
    { label: "STA", value: tribe.startingStamina },
    { label: "EVA", value: tribe.evasionBase },
    { label: "MOV", value: tribe.movementBase },
    { label: "ENC", value: tribe.encumbranceBase },
    { label: "SPM", value: tribe.spellMemoryBase },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {stats.map((s) => (
        <span key={s.label} className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5 font-mono">
          {s.label} {s.value}
        </span>
      ))}
      <span className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5 font-mono">
        {tribe.spellDie}
      </span>
    </div>
  );
}

export function TribeSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentTribeId,
}: TribeSelectorModalProps) {
  const { tribes } = useGameData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<Record<string, string>>({});

  const handleSelect = (tribeId: string) => {
    const tribe = tribes.find((t) => t.id === tribeId);
    const isSelectable = (b: { name: string }) =>
      !b.name.match(/^\d+['']\s*\d+/) && b.name !== "ADVANCEMENT BONUSES";
    const selectable = tribe?.startingBonuses.filter(isSelectable) ?? [];
    const chosenName = selectedBonus[tribeId];
    const bonus = selectable.find((b) => b.name === chosenName) ?? selectable[0];
    onSelect(tribeId, bonus);
    setExpandedId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Tribe">
      <div className="space-y-2">
        {tribes.map((tribe) => {
          const isExpanded = expandedId === tribe.id;
          const isCurrent = tribe.id === currentTribeId;
          return (
            <div
              key={tribe.id}
              className={`border rounded-lg overflow-hidden transition-colors ${
                isCurrent
                  ? "border-accent bg-accent/5"
                  : "border-border-light bg-surface"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : tribe.id)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{tribe.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] uppercase tracking-wider text-accent font-bold">
                        Current
                      </span>
                    )}
                  </div>
                  <AttrBonuses tribe={tribe} />
                </div>
                <svg
                  className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border-light pt-2">
                  <StatPills tribe={tribe} />

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {tribe.description}
                  </p>

                  {tribe.physicalDescription && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
                        Physical Description
                      </h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {tribe.physicalDescription}
                      </p>
                    </div>
                  )}

                  {tribe.gameplayNotes.length > 0 && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-0.5">
                        Special Rules
                      </h4>
                      <ul className="text-xs text-text-secondary space-y-0.5">
                        {tribe.gameplayNotes.map((note, i) => (
                          <li key={i} className="flex gap-1">
                            <span className="text-text-muted shrink-0">&bull;</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <BonusSelector
                    tribe={tribe}
                    chosen={selectedBonus[tribe.id]}
                    onChoose={(name) =>
                      setSelectedBonus((prev) => ({ ...prev, [tribe.id]: name }))
                    }
                  />

                  <button
                    type="button"
                    onClick={() => handleSelect(tribe.id)}
                    className={`w-full text-center text-sm font-bold py-2 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-surface-raised text-text-muted"
                        : "bg-accent text-bg hover:opacity-90"
                    }`}
                  >
                    {isCurrent ? "Already Selected" : `Select ${tribe.name}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
