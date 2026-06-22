export type BadgeVariant =
  | "default" | "accent" | "danger" | "arcane"
  | "uncommon" | "rare-item" | "legendary" | "parallel" | "crafted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  onRemove?: () => void;
}

const variantStyles: Record<string, string> = {
  default: "bg-surface-raised text-text-secondary border-border-light",
  accent: "bg-accent/15 text-accent border-accent/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  arcane: "bg-arcane/15 text-arcane border-arcane/30",
  uncommon: "bg-rarity-uncommon/15 text-rarity-uncommon border-rarity-uncommon/30",
  "rare-item": "bg-rarity-rare/15 text-rarity-rare border-rarity-rare/30",
  legendary: "bg-rarity-legendary/15 text-rarity-legendary border-rarity-legendary/30",
  parallel: "bg-rarity-parallel/15 text-rarity-parallel border-rarity-parallel/30",
  crafted: "bg-rarity-crafted/15 text-rarity-crafted border-rarity-crafted/30",
};

export function Badge({ children, variant = "default", onRemove }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${variantStyles[variant]}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:text-danger transition-colors"
          aria-label="Remove"
        >
          x
        </button>
      )}
    </span>
  );
}
