interface IngLevelStarsProps {
  level: number;
  max?: number;
  className?: string;
}

export function IngLevelStars({ level, max = 5, className = "" }: IngLevelStarsProps) {
  const clamped = Math.max(0, Math.min(max, Math.round(level)));
  return (
    <span
      className={`inline-flex gap-0.5 text-accent ${className}`}
      aria-label={`ING level ${clamped} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < clamped ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}
