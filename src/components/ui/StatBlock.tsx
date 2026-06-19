"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ATTRIBUTE_ABBR, ATTRIBUTE_DESCRIPTIONS, ATTRIBUTE_MIN, ATTRIBUTE_MAX } from "@/lib/constants";
import type { AttributeKey } from "@/lib/types/character";

interface StatBlockProps {
  attrKey: AttributeKey;
  value: number;
  onChange: (value: number) => void;
}

export function StatBlock({ attrKey, value, onChange }: StatBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setEditValue(String(value)), [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    setIsEditing(false);
    let num = parseInt(editValue) || 0;
    num = Math.max(ATTRIBUTE_MIN, Math.min(ATTRIBUTE_MAX, num));
    if (num !== value) onChange(num);
    setEditValue(String(num));
  }, [editValue, onChange, value]);

  const valueColor =
    value > 0
      ? "text-green-700 [data-theme=bioluminescent-dark]_&:text-green-400"
      : value < 0
        ? "text-danger"
        : "text-text-muted";

  return (
    <div
      className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-surface border border-border-light"
      title={ATTRIBUTE_DESCRIPTIONS[attrKey]}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {ATTRIBUTE_ABBR[attrKey]}
      </span>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setEditValue(String(value));
              setIsEditing(false);
            }
          }}
          min={ATTRIBUTE_MIN}
          max={ATTRIBUTE_MAX}
          className="w-12 text-center text-lg font-bold bg-surface border border-accent rounded outline-none focus:ring-1 focus:ring-accent"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`text-xl font-bold cursor-text hover:underline decoration-accent ${valueColor}`}
        >
          {value > 0 ? `+${value}` : value}
        </button>
      )}
    </div>
  );
}
