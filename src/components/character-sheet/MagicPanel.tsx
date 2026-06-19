"use client";

import { useState, useCallback } from "react";
import type { Character, LearnedSpell, MagicSchool } from "@/lib/types/character";
import { EditableField } from "@/components/ui/EditableField";
import { EditableSelect } from "@/components/ui/EditableSelect";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useGameData } from "@/hooks/useGameData";
import { MAGIC_SCHOOL_CSS, MAGIC_SCHOOL_LABELS } from "@/lib/constants";
import { generateId, spellMemoryUsed } from "@/lib/utils";
import type { SpellData } from "@/lib/types/game-data";

interface MagicPanelProps {
  character: Character;
  onUpdate: (updater: (prev: Character) => Character) => void;
}

export function MagicPanel({ character, onUpdate }: MagicPanelProps) {
  const { spells: allSpells } = useGameData();
  const [showSpellPicker, setShowSpellPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const magic = character.magic;

  const updateMagic = useCallback(
    (field: string, value: unknown) => {
      onUpdate((prev) => ({
        ...prev,
        magic: { ...prev.magic, [field]: value },
      }));
    },
    [onUpdate]
  );

  const addSpellFromData = useCallback(
    (spell: SpellData) => {
      const learned: LearnedSpell = {
        id: generateId(),
        name: spell.name,
        school: spell.school as MagicSchool | "equipment" | "divine" | "core",
        tier: (spell.tier as "novice" | "advanced" | "master") || "none",
        castCost: spell.castCost,
        effect: spell.effect,
        dmgType: spell.dmgType,
        range: spell.range,
        area: spell.area,
        additionalEffects: spell.additionalEffects,
        description: spell.description,
        spellMemoryCost: spell.spellMemoryCost,
        isCore: false,
      };
      onUpdate((prev) => ({
        ...prev,
        magic: {
          ...prev.magic,
          learnedSpells: [...prev.magic.learnedSpells, learned],
        },
      }));
      setShowSpellPicker(false);
      setSearchQuery("");
    },
    [onUpdate]
  );

  const removeSpell = useCallback(
    (spellId: string) => {
      onUpdate((prev) => ({
        ...prev,
        magic: {
          ...prev.magic,
          learnedSpells: prev.magic.learnedSpells.filter((s) => s.id !== spellId),
        },
      }));
    },
    [onUpdate]
  );

  const memoryUsed = spellMemoryUsed(character);
  const memoryRemaining = magic.spellMemoryMax - memoryUsed;
  const learnedNames = new Set(magic.learnedSpells.map((s) => s.name.toLowerCase()));

  const filteredSpells = allSpells.filter(
    (s) =>
      !learnedNames.has(s.name.toLowerCase()) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.school.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const schoolCss = (school: string) =>
    MAGIC_SCHOOL_CSS[school as MagicSchool] || "";

  const schoolLabel = (school: string) =>
    MAGIC_SCHOOL_LABELS[school as MagicSchool] || school;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <EditableSelect
          value={magic.spellDie}
          onChange={(v) => updateMagic("spellDie", v)}
          options={[
            { value: "1D4", label: "1D4" },
            { value: "1D6", label: "1D6" },
            { value: "1D8", label: "1D8" },
            { value: "1D10", label: "1D10" },
            { value: "1D12", label: "1D12" },
          ]}
          label="Spell Die"
          placeholder="Select"
        />
        <EditableSelect
          value={magic.scalingAttribute}
          onChange={(v) => updateMagic("scalingAttribute", v)}
          options={[
            { value: "INT", label: "INT" },
            { value: "CHA", label: "CHA" },
          ]}
          label="Scaling Attr"
          placeholder="Select"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary w-16">
            Memory
          </span>
          <span className="text-sm font-bold">
            {memoryUsed}
          </span>
          <span className="text-text-muted">/</span>
          <EditableField
            value={magic.spellMemoryMax}
            onChange={(v) => updateMagic("spellMemoryMax", v as number)}
            type="number"
            min={0}
            max={999}
            inputClassName="w-14 text-center text-sm"
            displayClassName="text-center text-sm font-medium"
          />
        </div>
        <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              magic.spellMemoryMax > 0 && memoryUsed / magic.spellMemoryMax > 0.75
                ? "bg-danger"
                : "bg-arcane"
            }`}
            style={{
              width: `${magic.spellMemoryMax > 0 ? Math.min(100, (memoryUsed / magic.spellMemoryMax) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Learned Spells
          </h4>
          <button
            onClick={() => setShowSpellPicker(true)}
            className="text-xs text-accent hover:underline"
          >
            + Add Spell
          </button>
        </div>

        {magic.learnedSpells.length === 0 ? (
          <p className="text-xs text-text-muted italic py-2">No spells learned</p>
        ) : (
          <div className="space-y-1">
            {magic.learnedSpells.map((spell) => (
              <CollapsibleSection
                key={spell.id}
                title={spell.name}
                defaultOpen={false}
                className={schoolCss(spell.school)}
                badge={spell.isCore ? "Core" : `${spell.spellMemoryCost}M`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="accent">{schoolLabel(spell.school)}</Badge>
                    {spell.tier !== "none" && <Badge>{spell.tier}</Badge>}
                    {spell.castCost > 0 && <Badge>Cast: {spell.castCost}</Badge>}
                  </div>
                  {spell.effect && (
                    <p><span className="text-text-muted">Effect:</span> {spell.effect}</p>
                  )}
                  {spell.dmgType && (
                    <p><span className="text-text-muted">Type:</span> {spell.dmgType}</p>
                  )}
                  {spell.range && (
                    <p><span className="text-text-muted">Range:</span> {spell.range}</p>
                  )}
                  {spell.area && (
                    <p><span className="text-text-muted">Area:</span> {spell.area}</p>
                  )}
                  {spell.additionalEffects && (
                    <p className="text-text-secondary">{spell.additionalEffects}</p>
                  )}
                  {spell.description && (
                    <p className="italic text-text-muted">{spell.description}</p>
                  )}
                  <button
                    onClick={() => removeSpell(spell.id)}
                    className="text-danger hover:underline mt-1"
                  >
                    Remove Spell
                  </button>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showSpellPicker}
        onClose={() => {
          setShowSpellPicker(false);
          setSearchQuery("");
        }}
        title="Add Spell"
      >
        <input
          type="text"
          placeholder="Search spells..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-accent"
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filteredSpells.slice(0, 50).map((spell) => {
            const exceedsMemory = spell.spellMemoryCost > memoryRemaining;
            return (
              <button
                key={spell.id}
                onClick={() => !exceedsMemory && addSpellFromData(spell)}
                disabled={exceedsMemory}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  exceedsMemory
                    ? "opacity-40 cursor-not-allowed"
                    : `hover:bg-surface-raised ${schoolCss(spell.school)}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{spell.name}</span>
                  {exceedsMemory && (
                    <span className="text-[10px] text-danger">No memory</span>
                  )}
                </div>
                <div className="text-[10px] text-text-muted">
                  {schoolLabel(spell.school)} / {spell.tier} / Cast: {spell.castCost} / Mem: {spell.spellMemoryCost}
                </div>
              </button>
            );
          })}
          {filteredSpells.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No spells found</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
