"use client";

import type { Character } from "@/lib/types/character";
import type { WizardState } from "@/lib/wizard-utils";
import { useGameData } from "@/hooks/useGameData";
import { ATTRIBUTE_KEYS, ATTRIBUTE_ABBR, MAGIC_SCHOOL_LABELS } from "@/lib/constants";

interface ReviewStepProps {
  state: WizardState;
  preview: Character;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
        {label}
      </span>
      <span className="text-xs font-bold font-mono text-text">{value}</span>
    </div>
  );
}

export function ReviewStep({ state, preview }: ReviewStepProps) {
  const { tribes, classes, zodiac } = useGameData();
  const tribe = tribes.find((t) => t.id === state.tribeId);
  const cls = classes.find((c) => c.id === state.classId);
  const zod = zodiac.find((z) => z.id === state.zodiacId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-text">Review Your Character</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Confirm your choices before creating your character.
        </p>
      </div>

      <div className="border border-border-light rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-surface-raised border-b border-border-light">
          <h3 className="text-lg font-bold text-text">
            {state.characterName || "Unnamed"}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
            <span>{tribe?.name ?? state.tribeId}</span>
            <span className="text-text-muted">/</span>
            <span>{cls?.name ?? state.classId}</span>
            {zod && (
              <>
                <span className="text-text-muted">/</span>
                <span>{zod.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
              Attributes
            </h4>
            <div className="grid grid-cols-3 gap-1">
              {ATTRIBUTE_KEYS.map((attr) => {
                const val = preview.attributes[attr];
                return (
                  <div
                    key={attr}
                    className="flex items-center justify-between px-2 py-1 rounded bg-surface-raised"
                  >
                    <span className="text-[10px] font-bold font-mono text-text-muted">
                      {ATTRIBUTE_ABBR[attr]}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        val > 0
                          ? "text-highlight"
                          : val < 0
                            ? "text-danger"
                            : "text-text"
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border-light pt-2">
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
              Combat Stats
            </h4>
            <StatRow label="HP" value={preview.combatStats.hpMax} />
            <StatRow label="Stamina" value={preview.combatStats.staminaMax} />
            <StatRow label="Evasion" value={preview.combatStats.evasion} />
            <StatRow label="Movement" value={preview.combatStats.movement} />
            <StatRow label="Crit Rate" value={preview.combatStats.critRate} />
            <StatRow label="Encumbrance" value={preview.inventory.encumbranceMax} />
          </div>

          <div className="border-t border-border-light pt-2">
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
              Magic
            </h4>
            <StatRow label="Spell Die" value={preview.magic.spellDie || "—"} />
            <StatRow label="Spell Memory" value={preview.magic.spellMemoryMax} />
            {state.magicSchool && (
              <StatRow
                label="School"
                value={MAGIC_SCHOOL_LABELS[state.magicSchool]}
              />
            )}
          </div>

          {preview.trainings.length > 0 && (
            <div className="border-t border-border-light pt-2">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Trainings
              </h4>
              <div className="flex flex-wrap gap-1">
                {preview.trainings.map((t) => (
                  <span
                    key={t.id}
                    className={`text-[10px] rounded px-1.5 py-0.5 ${
                      t.isAdvanced
                        ? "bg-accent/20 text-accent"
                        : "bg-surface-raised text-text-secondary"
                    }`}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {preview.skills.length > 0 && (
            <div className="border-t border-border-light pt-2">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Skills & Abilities
              </h4>
              <div className="space-y-1">
                {preview.skills.map((s) => (
                  <div key={s.id} className="text-xs">
                    <span className="font-bold text-text">{s.name}</span>
                    <span className="text-[9px] text-text-muted ml-1">
                      ({s.source})
                    </span>
                    {s.description && (
                      <p className="text-text-secondary text-[11px] leading-snug">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.talents.length > 0 && (
            <div className="border-t border-border-light pt-2">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Talents
              </h4>
              <div className="space-y-1">
                {preview.talents.map((t) => (
                  <div key={t.id} className="text-xs">
                    <span className="font-bold text-text">{t.name}</span>
                    <p className="text-text-secondary text-[11px] leading-snug">
                      {t.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.languages.length > 0 && (
            <div className="border-t border-border-light pt-2">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Languages
              </h4>
              <div className="flex flex-wrap gap-1">
                {preview.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] bg-surface-raised rounded px-1.5 py-0.5 text-text-secondary"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {state.startingBonus && (
            <div className="border-t border-border-light pt-2">
              <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                Starting Bonus
              </h4>
              <div className="text-xs">
                <span className="font-bold text-text">
                  {state.startingBonus.name}
                </span>
                <p className="text-text-secondary text-[11px] leading-snug">
                  {state.startingBonus.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
