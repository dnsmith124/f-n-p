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
      {label &&
        (hint ? (
          <HintTooltip
            content={hint}
            ariaLabel={`${label}: ${hint}`}
            className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5"
          >
            {label}
          </HintTooltip>
        ) : (
          <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
            {label}
          </label>
        ))}
      <div className="w-full px-2 py-1 text-left text-text">{String(value)}</div>
    </div>
  );
}
