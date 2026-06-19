"use client";

import { EditableField } from "./EditableField";

interface ResourceTrackerProps {
  label: string;
  current: number;
  max: number;
  onCurrentChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  color?: string;
}

export function ResourceTracker({
  label,
  current,
  max,
  onCurrentChange,
  onMaxChange,
  color = "bg-primary",
}: ResourceTrackerProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const isLow = max > 0 && current / max <= 0.25;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary w-16">
          {label}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onCurrentChange(Math.max(-99, current - 1))}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary active:scale-95 transition-all text-lg font-bold leading-none"
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <EditableField
            value={current}
            onChange={(v) => onCurrentChange(Math.min(v as number, max))}
            type="number"
            min={-99}
            max={max}
            inputClassName="w-14 text-center text-sm"
            displayClassName={`text-center text-sm font-bold ${isLow ? "text-danger" : ""}`}
          />
          <button
            type="button"
            onClick={() => onCurrentChange(Math.min(max, current + 1))}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary active:scale-95 transition-all text-lg font-bold leading-none"
            aria-label={`Increase ${label}`}
          >
            +
          </button>
          <span className="text-text-muted ml-0.5">/</span>
          <EditableField
            value={max}
            onChange={(v) => onMaxChange(v as number)}
            type="number"
            min={0}
            max={999}
            inputClassName="w-14 text-center text-sm"
            displayClassName="text-center text-sm font-medium"
          />
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
