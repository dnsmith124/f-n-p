"use client";

import { type ReactNode } from "react";
import { useInlineNumberEdit } from "@/hooks/useInlineNumberEdit";

interface ResourceTrackerProps {
  label: ReactNode;
  labelText?: string;
  current: number;
  max: number;
  onCurrentChange?: (value: number) => void;
  onMaxChange?: (value: number) => void;
  readOnlyCurrent?: boolean;
  maxBase?: number;
  color?: string;
}

export function ResourceTracker({
  label,
  labelText,
  current,
  max,
  onCurrentChange,
  onMaxChange,
  readOnlyCurrent = false,
  maxBase,
  color = "bg-primary",
}: ResourceTrackerProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const isLow = max > 0 && current / max <= 0.25;
  const hasGearMaxBonus = maxBase !== undefined && maxBase !== max;
  const editableMax = maxBase ?? max;
  const ariaName = labelText ?? "resource";

  const { isEditing, editValue, setEditValue, inputRef, startEditing, commit, cancel } =
    useInlineNumberEdit({
      value: editableMax,
      onCommit: onMaxChange,
      min: 0,
      max: 999,
    });

  const maxDisplay = (
    <>
      {isEditing && onMaxChange ?
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
          min={0}
          max={999}
          className="w-14 text-center text-sm font-medium bg-surface border border-accent rounded outline-none focus:ring-1 focus:ring-accent"
        />
      : onMaxChange ?
        <button
          type="button"
          onClick={startEditing}
          className="min-w-14 text-center text-sm font-medium cursor-text hover:underline decoration-accent"
          title={
            hasGearMaxBonus ?
              `Base max ${editableMax}, effective ${max}`
            : undefined
          }
        >
          {max}
        </button>
      : <span className="min-w-14 text-center text-sm font-medium">{max}</span>}
      {hasGearMaxBonus && !isEditing && (
        <span className="text-[9px] text-accent" title="Includes gear bonus">
          *
        </span>
      )}
    </>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary w-16 shrink-0">
          {label}
        </span>
        <div className="flex items-center gap-0.5 flex-wrap">
          {!readOnlyCurrent && onCurrentChange && (
            <button
              type="button"
              onClick={() => onCurrentChange(Math.max(-99, current - 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary active:scale-95 transition-all text-lg font-bold leading-none"
              aria-label={`Decrease ${ariaName}`}
            >
              −
            </button>
          )}
          <span
            className={`min-w-14 text-center text-sm font-bold ${isLow ? "text-danger" : ""}`}
          >
            {current}
          </span>
          {!readOnlyCurrent && onCurrentChange && (
            <button
              type="button"
              onClick={() => onCurrentChange(Math.min(max, current + 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary active:scale-95 transition-all text-lg font-bold leading-none"
              aria-label={`Increase ${ariaName}`}
            >
              +
            </button>
          )}
          <span className="text-text-muted">/</span>
          {maxDisplay}
        </div>
      </div>
      <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isLow ? "bg-danger" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
