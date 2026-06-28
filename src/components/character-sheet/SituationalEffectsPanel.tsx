"use client";

import type { SituationalEffectEntry } from "@/lib/stat-breakdown";

interface SituationalEffectsPanelProps {
  effects: SituationalEffectEntry[];
}

export function SituationalEffectsPanel({ effects }: SituationalEffectsPanelProps) {
  if (effects.length === 0) {
    return <p className="text-xs text-text-muted italic">None</p>;
  }

  return (
    <ul className="space-y-2">
      {effects.map((entry, i) => (
        <li key={`${entry.source}-${i}`} className="text-xs">
          <span className="block text-[9px] uppercase tracking-wider text-text-muted mb-0.5">
            {entry.source}
          </span>
          <span className="text-text leading-relaxed">{entry.text}</span>
        </li>
      ))}
    </ul>
  );
}
