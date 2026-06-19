"use client";

import { useEffect, useRef, useState } from "react";

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
  const [hintVisible, setHintVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hintVisible) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setHintVisible(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [hintVisible]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
          {label}
        </label>
      )}
      <div ref={containerRef} className="group relative">
        <button
          type="button"
          onClick={() => hint && setHintVisible((visible) => !visible)}
          className={`w-full px-2 py-1 text-left text-text ${
            hint ? "cursor-help" : "cursor-default"
          }`}
          aria-label={hint ? `${label ?? "Value"}: ${value}. ${hint}` : undefined}
        >
          {String(value)}
        </button>
        {hint && (
          <span
            className={`absolute left-0 top-full z-10 mt-0.5 px-1.5 py-0.5 rounded border border-border-light bg-surface-raised text-[10px] text-text-muted whitespace-nowrap shadow-sm transition-opacity ${
              hintVisible
                ? "opacity-100 visible"
                : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
            }`}
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
