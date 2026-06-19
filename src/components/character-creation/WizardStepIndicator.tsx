"use client";

import { WIZARD_STEPS } from "@/lib/wizard-utils";

interface WizardStepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepReachable: (step: number) => boolean;
}

export function WizardStepIndicator({
  currentStep,
  onStepClick,
  isStepReachable,
}: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 w-full">
      {WIZARD_STEPS.map((step, i) => {
        const isCurrent = i === currentStep;
        const isCompleted = i < currentStep;
        const reachable = isStepReachable(i);

        return (
          <button
            key={i}
            type="button"
            onClick={() => reachable && onStepClick(i)}
            disabled={!reachable}
            className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
              reachable ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div
              className={`w-full h-1.5 rounded-full transition-colors ${
                isCurrent
                  ? "bg-accent"
                  : isCompleted
                    ? "bg-accent/40"
                    : "bg-border-light"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isCurrent
                  ? "text-accent"
                  : isCompleted
                    ? "text-text-secondary"
                    : "text-text-muted"
              }`}
            >
              {step.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
