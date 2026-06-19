"use client";

import { HintTooltip } from "./HintTooltip";

interface DerivedFieldProps {
  value: string | number;
  label?: string;
  hint?: string;
  className?: string;
}

export function DerivedField({
  value,
  label,
  hint,
  className = "",
}: DerivedFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
          {label}
        </label>
      )}
      <HintTooltip
        content={hint}
        className="w-full"
        ariaLabel={hint ? `${label ?? "Value"}: ${value}. ${hint}` : undefined}
      >
        <button
          type="button"
          className={`w-full px-2 py-1 text-left text-text ${
            hint ? "" : "cursor-default"
          }`}
        >
          {String(value)}
        </button>
      </HintTooltip>
    </div>
  );
}
