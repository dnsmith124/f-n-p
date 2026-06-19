"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizardState } from "@/hooks/useWizardState";
import { finalizeWizardCharacter } from "@/lib/wizard-utils";
import { saveCharacter } from "@/lib/storage";
import { AppHeader } from "@/components/ui/AppHeader";
import { WizardStepIndicator } from "@/components/character-creation/WizardStepIndicator";
import { CharacterPreview } from "@/components/character-creation/CharacterPreview";
import { TribeStep } from "@/components/character-creation/TribeStep";
import { ClassStep } from "@/components/character-creation/ClassStep";
import { AttributeStep } from "@/components/character-creation/AttributeStep";
import { IdentityStep } from "@/components/character-creation/IdentityStep";
import { ReviewStep } from "@/components/character-creation/ReviewStep";
import { isStepValid } from "@/lib/wizard-utils";

export default function NewCharacterPage() {
  const router = useRouter();
  const {
    state,
    dispatch,
    preview,
    canGoNext,
    canGoBack,
    isLastStep,
    canCreate,
    goNext,
    goBack,
    hasAnyChoices,
  } = useWizardState();

  useEffect(() => {
    if (!hasAnyChoices) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasAnyChoices]);

  const handleCreate = useCallback(() => {
    if (!canCreate) return;
    const character = finalizeWizardCharacter(state);
    saveCharacter(character);
    router.push(`/character/${character.id}`);
  }, [canCreate, state, router]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (step <= state.currentStep) {
        dispatch({ type: "GO_TO_STEP", step });
      } else {
        let reachable = true;
        for (let i = 0; i < step; i++) {
          if (!isStepValid(state, i)) {
            reachable = false;
            break;
          }
        }
        if (reachable) dispatch({ type: "GO_TO_STEP", step });
      }
    },
    [state, dispatch]
  );

  const isStepReachable = useCallback(
    (step: number) => {
      if (step <= state.currentStep) return true;
      for (let i = 0; i < step; i++) {
        if (!isStepValid(state, i)) return false;
      }
      return true;
    },
    [state]
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        actions={
          <button
            onClick={() => router.push("/")}
            className="h-8 px-3 flex items-center gap-1 rounded-lg text-text-muted hover:text-text text-xs font-medium transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </button>
        }
      />

      <div className="max-w-2xl mx-auto w-full p-4 pb-28">
        <div className="mb-4">
          <WizardStepIndicator
            currentStep={state.currentStep}
            onStepClick={handleStepClick}
            isStepReachable={isStepReachable}
          />
        </div>

        {state.currentStep !== 4 && (
          <CharacterPreview state={state} preview={preview} />
        )}

        {state.currentStep === 0 && (
          <TribeStep
            state={state}
            onSelectTribe={(tribeId, bonus) =>
              dispatch({ type: "SET_TRIBE", tribeId, startingBonus: bonus })
            }
            onSelectBonus={(bonus) =>
              dispatch({ type: "SET_STARTING_BONUS", startingBonus: bonus })
            }
          />
        )}

        {state.currentStep === 1 && (
          <ClassStep
            state={state}
            onSelectClass={(classId) =>
              dispatch({ type: "SET_CLASS", classId })
            }
            onSelectMagicSchool={(school) =>
              dispatch({ type: "SET_MAGIC_SCHOOL", school })
            }
            onSelectFighterTraining={(training) =>
              dispatch({ type: "SET_FIGHTER_TRAINING", training })
            }
          />
        )}

        {state.currentStep === 2 && (
          <AttributeStep
            state={state}
            preview={preview}
            onSetPlus={(attr) => dispatch({ type: "SET_ATTR_PLUS", attr })}
            onSetMinus={(attr) => dispatch({ type: "SET_ATTR_MINUS", attr })}
          />
        )}

        {state.currentStep === 3 && (
          <IdentityStep
            state={state}
            onSetName={(name) => dispatch({ type: "SET_NAME", name })}
            onSetZodiac={(zodiacId) =>
              dispatch({ type: "SET_ZODIAC", zodiacId })
            }
          />
        )}

        {state.currentStep === 4 && (
          <ReviewStep state={state} preview={preview} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-bg border-t border-border-light">
        <div className="max-w-2xl mx-auto w-full px-4 py-3 flex items-center gap-3">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 rounded-lg border border-border-light text-text-secondary text-sm font-medium hover:bg-surface-raised transition-colors"
            >
              Back
            </button>
          )}

          <div className="flex-1" />

          {isLastStep ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-6 py-2 rounded-lg bg-accent text-bg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Character
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
