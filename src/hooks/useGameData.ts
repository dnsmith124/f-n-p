"use client";

import { useMemo } from "react";
import tribesData from "../../data/tribes.json";
import classesData from "../../data/classes.json";
import spellsData from "../../data/spells.json";
import talentsData from "../../data/talents.json";
import languagesData from "../../data/languages.json";
import trainingsData from "../../data/trainings.json";
import meritData from "../../data/merit-thresholds.json";
import diseasesData from "../../data/diseases.json";
import itemsData from "../../data/items.json";
import zodiacData from "../../data/zodiac.json";

import type {
  TribeData,
  ClassData,
  SpellData,
  TalentData,
  LanguageData,
  TrainingData,
  MeritThreshold,
  DiseaseData,
  ItemData,
  ZodiacData,
} from "@/lib/types/game-data";

export function useGameData() {
  return useMemo(
    () => ({
      tribes: tribesData as TribeData[],
      classes: classesData as ClassData[],
      spells: spellsData as SpellData[],
      talents: talentsData as TalentData[],
      languages: languagesData as LanguageData[],
      trainings: trainingsData as TrainingData[],
      meritThresholds: meritData as MeritThreshold[],
      diseases: diseasesData as DiseaseData[],
      items: itemsData as ItemData[],
      zodiac: zodiacData as ZodiacData[],
    }),
    []
  );
}
