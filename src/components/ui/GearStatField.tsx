"use client";

import { HintTooltip } from "./HintTooltip";
import { GearModifiedIndicator } from "./GearModifiedIndicator";
import { useInlineNumberEdit } from "@/hooks/useInlineNumberEdit";
import type { StatBreakdown } from "@/lib/stat-breakdown";
import { formatStatBreakdownTooltip } from "@/lib/stat-breakdown";

interface GearStatFieldProps {
  label: string;
  breakdown: StatBreakdown;
  onBaseChange?: (value: number) => void;
  hintTitle?: string;
  showSign?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

function formatDisplayValue(value: number, showSign: boolean): string {
  if (showSign && value > 0) return `+${value}`;
  return String(value);
}

export function GearStatField({
  label,
  breakdown,
  onBaseChange,
  hintTitle,
  showSign = false,
  min = -99,
  max = 999,
  className = "",
}: GearStatFieldProps) {
  const hasGear = breakdown.contributions.length > 0;
  const baseValue = breakdown.base;
  const effectiveValue = breakdown.total;

  const { isEditing, editValue, setEditValue, inputRef, startEditing, commit, cancel } =
    useInlineNumberEdit({
      value: baseValue,
      onCommit: onBaseChange,
      min,
      max,
    });

  const tooltip = formatStatBreakdownTooltip(hintTitle ?? label, breakdown, {
    formatValue: (v) => formatDisplayValue(v, showSign),
  });

  const valueDisplay = formatDisplayValue(effectiveValue, showSign);

  return (
    <div className={className}>
      <HintTooltip
        content={tooltip}
        panel={Boolean(hasGear || hintTitle)}
        ariaLabel={`${label} breakdown`}
        className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5"
      >
        {label}
        {hasGear && <GearModifiedIndicator />}
      </HintTooltip>
      {isEditing && onBaseChange ?
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
          min={min}
          max={max}
          className="w-full px-2 py-1 text-left text-text font-medium bg-surface border border-accent rounded outline-none focus:ring-1 focus:ring-accent"
        />
      : onBaseChange ?
        <button
          type="button"
          onClick={startEditing}
          className="w-full px-2 py-1 text-left text-text font-medium cursor-text hover:underline decoration-accent"
          title={
            hasGear ?
              `Base ${formatDisplayValue(baseValue, showSign)}, effective ${valueDisplay}`
            : undefined
          }
        >
          {valueDisplay}
        </button>
      : <div className="w-full px-2 py-1 text-left text-text font-medium">{valueDisplay}</div>}
    </div>
  );
}
