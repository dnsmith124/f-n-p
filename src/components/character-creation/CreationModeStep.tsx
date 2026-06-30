"use client";

interface CreationModeStepProps {
  selected: "scratch" | "random" | null;
  onSelect: (mode: "scratch" | "random") => void;
}

const OPTIONS = [
  {
    mode: "scratch" as const,
    title: "Create from Scratch",
    description:
      "Choose your tribe, class, attributes, and name step by step.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
        />
      </svg>
    ),
  },
  {
    mode: "random" as const,
    title: "Random Character",
    description:
      "Generate a fully randomized character. You can still tweak any choices before finalizing.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
        />
      </svg>
    ),
  },
];

export function CreationModeStep({
  selected,
  onSelect,
}: CreationModeStepProps) {
  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-text">
          How would you like to create your character?
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Start from scratch for full control, or roll the dice for a surprise.
        </p>
      </div>

      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onSelect(opt.mode)}
            className={`w-full text-left px-4 py-4 rounded-lg border transition-colors ${
              isSelected
                ? "border-accent bg-accent/5"
                : "border-border-light bg-surface hover:bg-surface-raised"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 ${
                  isSelected ? "text-accent" : "text-text-muted"
                }`}
              >
                {opt.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text">
                    {opt.title}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] uppercase tracking-wider text-accent font-bold">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {opt.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
