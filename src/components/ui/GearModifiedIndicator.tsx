interface GearModifiedIndicatorProps {
  className?: string;
}

export function GearModifiedIndicator({ className = "ml-0.5 text-[8px] text-accent normal-case" }: GearModifiedIndicatorProps) {
  return <span className={className}>*</span>;
}
