"use client";

import type { AttributeKey } from "@/lib/types/character";
import type { WizardState } from "@/lib/wizard-utils";
import type { Character } from "@/lib/types/character";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_ABBR,
  ATTRIBUTE_DESCRIPTIONS,
  ATTRIBUTE_TOOLTIPS,
  ATTRIBUTE_MAX,
} from "@/lib/constants";
import { HintTooltip } from "@/components/ui/HintTooltip";

interface AttributeStepProps {
  state: WizardState;
  preview: Character;
  onSetPlus: (attr: AttributeKey | null) => void;
  onSetMinus: (attr: AttributeKey | null) => void;
}

export function AttributeStep({
  state,
  preview,
  onSetPlus,
  onSetMinus,
}: AttributeStepProps) {
  const tribeBase = preview.attributes;

  const handleTogglePlus = (attr: AttributeKey) => {
    if (state.attrPlus === attr) {
      onSetPlus(null);
    } else {
      if (state.attrMinus === attr) onSetMinus(null);
      const baseVal = tribeBase[attr] - (state.attrPlus === attr ? 1 : 0);
      if (baseVal + 1 <= ATTRIBUTE_MAX) {
        onSetPlus(attr);
      }
    }
  };

  const handleToggleMinus = (attr: AttributeKey) => {
    if (state.attrMinus === attr) {
      onSetMinus(null);
    } else {
      if (state.attrPlus === attr) onSetPlus(null);
      onSetMinus(attr);
    }
  };

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-text">Allocate Attributes</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Add +1 to one attribute and -1 to another. These stack with your tribe
          bonuses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {ATTRIBUTE_KEYS.map((attr) => {
          const baseVal =
            tribeBase[attr] -
            (state.attrPlus === attr ? 1 : 0) +
            (state.attrMinus === attr ? 1 : 0);
          const finalVal = tribeBase[attr];
          const isPlusSelected = state.attrPlus === attr;
          const isMinusSelected = state.attrMinus === attr;
          const canPlus =
            !state.attrPlus || isPlusSelected
              ? baseVal + 1 <= ATTRIBUTE_MAX
              : false;
          const canMinus = !state.attrMinus || isMinusSelected;

          return (
            <div
              key={attr}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                isPlusSelected
                  ? "border-highlight/40 bg-highlight/5"
                  : isMinusSelected
                    ? "border-danger/40 bg-danger/5"
                    : "border-border-light bg-surface"
              }`}
            >
              <HintTooltip
                panel
                content={ATTRIBUTE_TOOLTIPS[attr]}
                className="flex-1 min-w-0"
                ariaLabel={`${ATTRIBUTE_ABBR[attr]}: ${ATTRIBUTE_DESCRIPTIONS[attr]}`}
              >
                <div>
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <span className="text-xs font-bold font-mono w-8">
                      {ATTRIBUTE_ABBR[attr]}
                    </span>
                    <span
                      className={`text-sm font-bold font-mono w-8 text-center ${
                        finalVal > 0 ?
                          "text-highlight"
                        : finalVal < 0 ? "text-danger"
                        : "text-text"
                      }`}
                    >
                      {finalVal > 0 ? `+${finalVal}` : finalVal}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-snug truncate mt-0.5">
                    {ATTRIBUTE_DESCRIPTIONS[attr]}
                  </p>
                </div>
              </HintTooltip>

              {baseVal !== 0 && (
                <span className="text-[10px] text-text-muted font-mono shrink-0 w-10 text-left">
                  base {baseVal > 0 ? `+${baseVal}` : baseVal}
                </span>
              )}

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMinus(attr)}
                  disabled={!canMinus && !isMinusSelected}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    isMinusSelected
                      ? "bg-danger text-white"
                      : canMinus
                        ? "bg-surface-raised text-text-muted hover:bg-danger/20 hover:text-danger"
                        : "bg-surface-raised text-text-muted/30"
                  }`}
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePlus(attr)}
                  disabled={!canPlus && !isPlusSelected}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    isPlusSelected
                      ? "bg-highlight text-white"
                      : canPlus
                        ? "bg-surface-raised text-text-muted hover:bg-highlight/20 hover:text-highlight"
                        : "bg-surface-raised text-text-muted/30"
                  }`}
                >
                  +1
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-highlight" />
          +1 assigned{state.attrPlus ? `: ${ATTRIBUTE_ABBR[state.attrPlus]}` : ""}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-danger" />
          -1 assigned{state.attrMinus ? `: ${ATTRIBUTE_ABBR[state.attrMinus]}` : ""}
        </span>
      </div>
    </div>
  );
}
