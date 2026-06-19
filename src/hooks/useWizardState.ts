"use client";

import { useReducer, useMemo, useCallback } from "react";
import type { AttributeKey, MagicSchool } from "@/lib/types/character";
import {
  type WizardState,
  INITIAL_WIZARD_STATE,
  WIZARD_STEPS,
  isStepValid,
  computePreviewCharacter,
} from "@/lib/wizard-utils";

type WizardAction =
  | { type: "SET_TRIBE"; tribeId: string; startingBonus: { name: string; description: string } | null }
  | { type: "SET_STARTING_BONUS"; startingBonus: { name: string; description: string } }
  | { type: "SET_CLASS"; classId: string }
  | { type: "SET_MAGIC_SCHOOL"; school: MagicSchool }
  | { type: "SET_FIGHTER_TRAINING"; training: string }
  | { type: "SET_ATTR_PLUS"; attr: AttributeKey | null }
  | { type: "SET_ATTR_MINUS"; attr: AttributeKey | null }
  | { type: "SET_ZODIAC"; zodiacId: string }
  | { type: "SET_NAME"; name: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; step: number };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_TRIBE":
      return {
        ...state,
        tribeId: action.tribeId,
        startingBonus: action.startingBonus,
        attrPlus: null,
        attrMinus: null,
      };

    case "SET_STARTING_BONUS":
      return {
        ...state,
        startingBonus: action.startingBonus,
        attrPlus: null,
        attrMinus: null,
      };

    case "SET_CLASS":
      return {
        ...state,
        classId: action.classId,
        magicSchool: null,
        fighterFavoredTraining: "",
      };

    case "SET_MAGIC_SCHOOL":
      return { ...state, magicSchool: action.school };

    case "SET_FIGHTER_TRAINING":
      return { ...state, fighterFavoredTraining: action.training };

    case "SET_ATTR_PLUS":
      return { ...state, attrPlus: action.attr };

    case "SET_ATTR_MINUS":
      return { ...state, attrMinus: action.attr };

    case "SET_ZODIAC":
      return { ...state, zodiacId: action.zodiacId };

    case "SET_NAME":
      return { ...state, characterName: action.name };

    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, WIZARD_STEPS.length - 1),
      };

    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };

    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };

    default:
      return state;
  }
}

export function useWizardState() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_WIZARD_STATE);

  const preview = useMemo(() => computePreviewCharacter(state), [state]);

  const currentStepValid = isStepValid(state, state.currentStep);

  const hasAnyChoices =
    state.tribeId !== "" ||
    state.classId !== "" ||
    state.characterName !== "";

  const canGoNext = currentStepValid && state.currentStep < WIZARD_STEPS.length - 1;
  const canGoBack = state.currentStep > 0;
  const isLastStep = state.currentStep === WIZARD_STEPS.length - 1;

  const canCreate =
    isStepValid(state, 0) &&
    isStepValid(state, 1) &&
    isStepValid(state, 2) &&
    isStepValid(state, 3);

  const goNext = useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
  const goBack = useCallback(() => dispatch({ type: "PREV_STEP" }), []);

  return {
    state,
    dispatch,
    preview,
    currentStepValid,
    hasAnyChoices,
    canGoNext,
    canGoBack,
    isLastStep,
    canCreate,
    goNext,
    goBack,
  };
}
