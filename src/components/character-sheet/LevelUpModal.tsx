"use client";

import { useState, useCallback, useMemo } from "react";
import type { Character } from "@/lib/types/character";
import type { ClassData } from "@/lib/types/game-data";
import { TrainingPointSpender } from "./TrainingPointSpender";
import { ClassAbilitySelector } from "@/components/character-creation/ClassAbilitySelector";
import {
  isAdvancementLevel,
  getAvailableAbilityChoices,
  getEligiblePromotionClasses,
  getBaseClassId,
  applySelectedClassAbility,
  applyLevelUpHp,
} from "@/lib/class-progression";
import { applyClassTrainings, findTribe, generateId } from "@/lib/utils";

interface LevelUpModalProps {
  character: Character;
  level: number;
  onComplete: (character: Character) => void;
}

export function LevelUpModal({
  character,
  level,
  onComplete,
}: LevelUpModalProps) {
  const [draft, setDraft] = useState<Character>(() => ({
    ...character,
    trainingPointsUnspent:
      level > 1
        ? character.trainingPointsUnspent + 2
        : character.trainingPointsUnspent,
  }));
  const [vitAtStart] = useState(character.attributes.vit);
  const [tpAtStart] = useState(character.trainingPointsUnspent);
  const [promotionClassId, setPromotionClassId] = useState("");
  const [selectedAbility, setSelectedAbility] = useState("");
  const [advancementBonus, setAdvancementBonus] = useState("");

  const tribe = findTribe(draft.tribe);
  const needsAdvancement = isAdvancementLevel(level);
  const availableAdvancements =
    tribe?.advancementBonuses.filter(
      (b) => !draft.advancementBonusesTaken.includes(b.name)
    ) ?? [];

  const isPromotionLevel = level === 6;
  const baseClassId = getBaseClassId(draft.class);
  const promotionOptions = isPromotionLevel
    ? getEligiblePromotionClasses(baseClassId)
    : [];

  const abilityChoices = useMemo(
    () =>
      getAvailableAbilityChoices(
        draft,
        level,
        isPromotionLevel && promotionClassId ? promotionClassId : undefined
      ),
    [draft, level, isPromotionLevel, promotionClassId]
  );

  const vitIncreased = draft.attributes.vit > vitAtStart;

  const tpRemainingThisLevel = Math.max(0, draft.trainingPointsUnspent - tpAtStart);
  const tpFullySpent = level <= 1 || tpRemainingThisLevel === 0;

  const needsAbilityPick = abilityChoices.length > 0;
  const canConfirm =
    tpFullySpent &&
    (!needsAdvancement ||
      advancementBonus !== "" ||
      availableAdvancements.length === 0) &&
    (!isPromotionLevel || !!promotionClassId) &&
    (!needsAbilityPick || selectedAbility !== "");

  const handleConfirm = useCallback(() => {
    let updated = { ...draft };

    if (needsAdvancement && advancementBonus && tribe) {
      const bonus = tribe.advancementBonuses.find(
        (b) => b.name === advancementBonus
      );
      if (bonus) {
        updated = {
          ...updated,
          skills: [
            ...updated.skills,
            {
              id: generateId(),
              name: bonus.name,
              source: "advancement" as const,
              description: bonus.description,
            },
          ],
          advancementBonusesTaken: [
            ...updated.advancementBonusesTaken,
            bonus.name,
          ],
        };
      }
    }

    if (isPromotionLevel && promotionClassId) {
      updated = applyClassTrainings(updated, promotionClassId);
    }

    if (selectedAbility) {
      updated = applySelectedClassAbility(updated, selectedAbility);
    }

    if (level > 1) {
      updated = applyLevelUpHp(updated, level, vitIncreased);
    }
    updated = {
      ...updated,
      resolvedLevels: [...updated.resolvedLevels, level],
    };

    onComplete(updated);
  }, [
    draft,
    needsAdvancement,
    advancementBonus,
    tribe,
    isPromotionLevel,
    promotionClassId,
    selectedAbility,
    level,
    vitIncreased,
    onComplete,
  ]);

  let hpGainPreview = level > 1 ? 1 : 0;
  if (vitIncreased && level > 1) hpGainPreview += 1;
  if (draft.class === "fighter" && level >= 2) hpGainPreview += 1;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-border-light">
          <h2 className="text-base font-bold text-primary">Level {level}!</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Apply your level-up bonuses before continuing.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {level > 1 && (
            <TrainingPointSpender character={draft} onUpdate={setDraft} />
          )}

          {level > 1 && !tpFullySpent && (
            <p className="text-xs text-danger">
              Spend {tpRemainingThisLevel} more training point
              {tpRemainingThisLevel === 1 ? "" : "s"} from this level to
              continue.
            </p>
          )}

          {level > 1 && (
            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                HP Bonus
              </h4>
              <p className="text-xs text-text-secondary">
                +{hpGainPreview} HP on confirm
                {vitIncreased && " (includes +1 for VIT increase this level)"}
                {draft.class === "fighter" &&
                  level >= 2 &&
                  " (includes fighter class bonus)"}
              </p>
            </div>
          )}

          {needsAdvancement && availableAdvancements.length > 0 && (
            <div className="border-t border-border-light pt-3">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Advancement Bonus (Select One)
              </h4>
              <div className="space-y-1">
                {availableAdvancements.map((bonus) => (
                  <label
                    key={bonus.name}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      advancementBonus === bonus.name
                        ? "border-accent bg-accent/5"
                        : "border-border-light hover:border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="advancement-bonus"
                      checked={advancementBonus === bonus.name}
                      onChange={() => setAdvancementBonus(bonus.name)}
                      className="mt-0.5 accent-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-text">
                        {bonus.name}
                      </span>
                      <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                        {bonus.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isPromotionLevel && (
            <div className="border-t border-border-light pt-3 space-y-3">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                Class Promotion (Level 6)
              </h4>
              <PromotionClassPicker
                options={promotionOptions}
                selected={promotionClassId}
                onSelect={(id) => {
                  setPromotionClassId(id);
                  setSelectedAbility("");
                }}
              />
            </div>
          )}

          {abilityChoices.length > 0 &&
            (!isPromotionLevel || promotionClassId) && (
              <div className="border-t border-border-light pt-3">
                <ClassAbilitySelector
                  options={abilityChoices}
                  selected={selectedAbility}
                  onSelect={setSelectedAbility}
                  title={`Choose a Class Ability (Level ${level})`}
                  highlightLevel={level}
                />
              </div>
            )}
        </div>

        <div className="px-4 py-3 border-t border-border-light">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-2 rounded-lg bg-accent text-bg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Level {level}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromotionClassPicker({
  options,
  selected,
  onSelect,
}: {
  options: ClassData[];
  selected: string;
  onSelect: (classId: string) => void;
}) {
  const advanced = options.filter((c) => c.type === "advanced");
  const hybrid = options.filter((c) => c.type === "hybrid");

  const renderGroup = (label: string, items: ClassData[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
          {label}
        </p>
        <div className="space-y-1">
          {items.map((cls) => (
            <label
              key={cls.id}
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                selected === cls.id
                  ? "border-accent bg-accent/5"
                  : "border-border-light hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="promotion-class"
                checked={selected === cls.id}
                onChange={() => onSelect(cls.id)}
                className="mt-0.5 accent-accent"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-text">{cls.name}</span>
                {cls.description && (
                  <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                    {cls.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (options.length === 0) {
    return (
      <p className="text-xs text-text-muted italic">
        No promotion classes available for your base class.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {renderGroup("Advanced Classes", advanced)}
      {renderGroup("Hybrid Classes", hybrid)}
    </div>
  );
}
