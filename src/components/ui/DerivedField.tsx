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
      <div className="px-2 py-1 text-text">
        {String(value)}
        {hint && (
          <span className="ml-1 text-[10px] text-text-muted">{hint}</span>
        )}
      </div>
    </div>
  );
}
