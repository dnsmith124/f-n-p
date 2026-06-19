"use client";

import type { MagicSchool } from "@/lib/types/character";
import { MAGIC_SCHOOL_LABELS, MAGIC_SCHOOL_CSS } from "@/lib/constants";

interface MagicSchoolSelectorProps {
  selected: MagicSchool | null;
  onSelect: (school: MagicSchool) => void;
}

const SCHOOLS: MagicSchool[] = [
  "pyromancy",
  "oceansCall",
  "greatStorm",
  "arcadian",
  "twinMoon",
  "phantasm",
];

export function MagicSchoolSelector({
  selected,
  onSelect,
}: MagicSchoolSelectorProps) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
        Choose School of Magic
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {SCHOOLS.map((school) => {
          const isSelected = school === selected;
          return (
            <button
              key={school}
              type="button"
              onClick={() => onSelect(school)}
              className={`text-left px-2.5 py-2 rounded-lg border transition-colors ${MAGIC_SCHOOL_CSS[school]} ${
                isSelected
                  ? "border-accent ring-1 ring-accent"
                  : "border-border-light hover:border-border"
              }`}
            >
              <span className="text-xs font-bold">
                {MAGIC_SCHOOL_LABELS[school]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
