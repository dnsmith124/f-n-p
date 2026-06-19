"use client";

interface EditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function EditableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  className = "",
}: EditableSelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border border-border-light rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-accent cursor-pointer ${
          !value ? "text-text-muted italic" : "text-text"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
