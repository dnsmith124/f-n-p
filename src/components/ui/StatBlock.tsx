"use client";

import { HintTooltip } from "./HintTooltip";
import { GearModifiedIndicator } from "./GearModifiedIndicator";
import { useInlineNumberEdit } from "@/hooks/useInlineNumberEdit";
import {
  ATTRIBUTE_ABBR,
  ATTRIBUTE_TOOLTIPS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
} from "@/lib/constants";
import type { AttributeKey } from "@/lib/types/character";
import type { StatBreakdown } from "@/lib/stat-breakdown";
import { formatStatBreakdownBody } from "@/lib/stat-breakdown";

interface StatBlockProps {
  attrKey: AttributeKey;
  value: number;
  breakdown?: StatBreakdown;
  onChange: (value: number) => void;
}

export function StatBlock({ attrKey, value, breakdown, onChange }: StatBlockProps) {
  const effectiveValue = breakdown?.total ?? value;
  const hasGear = (breakdown?.contributions.length ?? 0) > 0;

  const { isEditing, editValue, setEditValue, inputRef, startEditing, commit, cancel } =
    useInlineNumberEdit({
      value,
      onCommit: onChange,
      min: ATTRIBUTE_MIN,
      max: ATTRIBUTE_MAX,
    });

  const valueColor =
    effectiveValue > 0 ?
      "text-green-700 [data-theme=bioluminescent-dark]_&:text-green-400"
    : effectiveValue < 0 ? "text-danger"
    : "text-text-muted";

  const description = ATTRIBUTE_TOOLTIPS[attrKey];
  const breakdownText =
    breakdown && hasGear ?
      "\n\n" + formatStatBreakdownBody(breakdown, {
        formatValue: (v) => (v > 0 ? `+${v}` : String(v)),
      })
    : breakdown && breakdown.total !== breakdown.base ?
      `\n\nEffective: ${effectiveValue > 0 ? `+${effectiveValue}` : effectiveValue}\nBase: ${value > 0 ? `+${value}` : value}`
    : "";

  const tooltipContent = description + breakdownText;

  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-surface border border-border-light">
      <HintTooltip
        panel
        content={tooltipContent}
        ariaLabel={`${ATTRIBUTE_ABBR[attrKey]}: ${description}`}
      >
        <span className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          {ATTRIBUTE_ABBR[attrKey]}
          {hasGear && (
            <GearModifiedIndicator className="ml-1 text-[8px] text-accent normal-case tracking-normal" />
          )}
        </span>
      </HintTooltip>
      {isEditing ?
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          min={ATTRIBUTE_MIN}
          max={ATTRIBUTE_MAX}
          className="w-12 text-center text-lg font-bold bg-surface border border-accent rounded outline-none focus:ring-1 focus:ring-accent"
        />
      : <button
          type="button"
          onClick={startEditing}
          className={`text-lg font-bold cursor-text hover:underline decoration-accent ${valueColor}`}
          title={hasGear ? `Base ${value > 0 ? `+${value}` : value}, effective ${effectiveValue > 0 ? `+${effectiveValue}` : effectiveValue}` : undefined}
        >
          {effectiveValue > 0 ? `+${effectiveValue}` : effectiveValue}
        </button>
      }
    </div>
  );
}
