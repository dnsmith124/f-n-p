"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface EditableFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
  placeholder?: string;
  label?: string;
  showSign?: boolean;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
}

export function EditableField({
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder = "—",
  label,
  showSign = false,
  className = "",
  inputClassName = "",
  displayClassName = "",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    setIsEditing(false);
    if (type === "number") {
      let num = parseFloat(editValue) || 0;
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      if (num !== value) onChange(num);
      setEditValue(String(num));
    } else {
      if (editValue !== value) onChange(editValue);
    }
  }, [editValue, onChange, type, min, max, value]);

  const isEmpty = value === "" || (value === 0 && type !== "number");

  const displayValue = isEmpty
    ? placeholder
    : type === "number" && showSign && Number(value) > 0
      ? `+${value}`
      : String(value);

  const showMuted = isEmpty;

  if (isEditing) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type={type}
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
          min={min}
          max={max}
          className={`w-full bg-surface border border-accent rounded px-2 py-1 text-text outline-none focus:ring-1 focus:ring-accent ${inputClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
          {label}
        </label>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className={`w-full text-left px-2 py-1 rounded border border-transparent hover:border-border-light transition-colors cursor-text ${
          showMuted ? "text-text-muted italic" : "text-text"
        } ${displayClassName}`}
      >
        {displayValue}
      </button>
    </div>
  );
}
