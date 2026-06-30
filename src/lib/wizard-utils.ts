import type { Character, AttributeKey, MagicSchool } from "./types/character";
import type { ClassData, TribeData } from "./types/game-data";
import {
  createDefaultCharacter,
  applyTribeStats,
  applyClassTrainings,
  applyClassScaling,
  applySpellSchools,
  applyDerivedStats,
  generateId,
  findTribe,
} from "./utils";
import {
  getAbilitiesAtLevel,
  findProgressionEntryByAbility,
  applyProgressionAbility,
} from "./class-progression";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, MAGIC_SCHOOLS } from "./constants";
import tribesData from "../../data/tribes.json";
import classesData from "../../data/classes.json";
import zodiacData from "../../data/zodiac.json";
import tribeNamesData from "../../data/tribe-names.json";

export interface WizardState {
  currentStep: number;
  creationMode: "scratch" | "random" | null;
  tribeId: string;
  startingBonus: { name: string; description: string } | null;
  classId: string;
  selectedClassAbility: string;
  magicSchool: MagicSchool | null;
  fighterFavoredTraining: string;
  attrPlus: AttributeKey | null;
  attrMinus: AttributeKey | null;
  zodiacId: string;
  characterName: string;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: 0,
  creationMode: null,
  tribeId: "",
  startingBonus: null,
  classId: "",
  selectedClassAbility: "",
  magicSchool: null,
  fighterFavoredTraining: "",
  attrPlus: null,
  attrMinus: null,
  zodiacId: "",
  characterName: "",
};

export const WIZARD_STEPS = [
  { label: "Creation Mode", shortLabel: "Mode" },
  { label: "Tribe", shortLabel: "Tribe" },
  { label: "Class", shortLabel: "Class" },
  { label: "Attributes", shortLabel: "Attrs" },
  { label: "Identity", shortLabel: "Name" },
  { label: "Review", shortLabel: "Review" },
] as const;

export function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 0:
      return state.creationMode !== null;
    case 1:
      return state.tribeId !== "";
    case 2:
      if (state.classId === "") return false;
      if (state.classId === "mage" && !state.magicSchool) return false;
      if (state.classId === "fighter" && !state.fighterFavoredTraining)
        return false;
      if (!state.selectedClassAbility) return false;
      return true;
    case 3:
      return (
        state.attrPlus !== null &&
        state.attrMinus !== null &&
        state.attrPlus !== state.attrMinus
      );
    case 4:
      return state.characterName.trim() !== "";
    case 5:
      return true;
    default:
      return false;
  }
}

function applyTribeAttributeOverrides(
  character: Character,
  state: WizardState
): Character {
  if (
    state.tribeId === "mazmeri" &&
    state.startingBonus?.name === "MERCHANT LINEAGE"
  ) {
    return {
      ...character,
      attributes: {
        ...character.attributes,
        int: character.attributes.int - 1,
        cha: character.attributes.cha + 1,
      },
    };
  }

  if (
    state.tribeId === "uranura" &&
    state.startingBonus?.name === "EVERMARSH SHAMAN"
  ) {
    return {
      ...character,
      attributes: {
        ...character.attributes,
        str: 0,
        int: 0,
      },
    };
  }

  return character;
}

function applyAttributeAllocations(
  character: Character,
  state: WizardState
): Character {
  if (!state.attrPlus || !state.attrMinus) return character;

  const attrs = { ...character.attributes };
  attrs[state.attrPlus] += 1;
  attrs[state.attrMinus] -= 1;

  return { ...character, attributes: attrs };
}

function applyClassBonuses(
  character: Character,
  state: WizardState
): Character {
  let c = { ...character };

  switch (state.classId) {
    case "fighter":
      c = {
        ...c,
        combatStats: {
          ...c.combatStats,
          hpMax: c.combatStats.hpMax + 1,
          hpCurrent: c.combatStats.hpCurrent + 1,
        },
      };
      if (state.fighterFavoredTraining) {
        c = {
          ...c,
          skills: [
            ...c.skills,
            {
              id: generateId(),
              name: `Favored Training: ${state.fighterFavoredTraining}`,
              source: "class" as const,
              description: `+1 ATK with ${state.fighterFavoredTraining} weapons permanently`,
            },
          ],
        };
      }
      break;

    case "scout":
      c = {
        ...c,
        combatStats: {
          ...c.combatStats,
          evasion: c.combatStats.evasion + 1,
        },
        talents: [
          ...c.talents,
          {
            id: generateId(),
            name: "Analyst",
            description:
              "Can learn an enemy unit's weak point (1D20+INT / 13+ grants this knowledge). Can only be done once per unit type per battle.",
          },
        ],
        languages: [...c.languages, "Midnight Code"],
      };
      break;

    case "mage":
      c = {
        ...c,
        magic: {
          ...c.magic,
          spellMemoryMax: c.magic.spellMemoryMax + 1,
        },
      };
      break;

    case "provisioner":
      c = {
        ...c,
        inventory: {
          ...c.inventory,
          encumbranceMax: c.inventory.encumbranceMax + 2,
          silver: 100,
        },
        talents: [
          ...c.talents,
          {
            id: generateId(),
            name: "Chef",
            description: "Can use ingredient items to make meals at camp.",
          },
        ],
      };
      break;

    case "pilgrim":
      c = {
        ...c,
        magic: {
          ...c.magic,
          spellMemoryMax: c.magic.spellMemoryMax + 1,
        },
        languages: [...c.languages, "Ghostwhisper", "Celestial"],
      };
      break;
  }

  return c;
}

function applyStartingLanguages(
  character: Character,
  state: WizardState
): Character {
  const tribe = findTribe(state.tribeId);
  if (!tribe) return character;

  const langs = new Set(character.languages);
  for (const lang of tribe.startingLanguages) {
    langs.add(lang);
  }

  return { ...character, languages: [...langs] };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const isSelectableBonus = (b: { name: string }) =>
  !b.name.match(/^\d+['']\s*\d+/) && b.name !== "ADVANCEMENT BONUSES";

export function generateRandomWizardState(): WizardState {
  const tribes = tribesData as TribeData[];
  const tribe = pickRandom(tribes);

  const selectableBonuses = tribe.startingBonuses.filter(isSelectableBonus);
  const bonus = selectableBonuses.length > 0 ? pickRandom(selectableBonuses) : null;

  const baseClasses = (classesData as ClassData[]).filter((c) => c.type === "base");
  const cls = pickRandom(baseClasses);

  let magicSchool: MagicSchool | null = null;
  let fighterFavoredTraining = "";

  if (cls.id === "mage") {
    magicSchool = pickRandom(MAGIC_SCHOOLS);
  } else if (cls.id === "fighter") {
    const weaponTrainings = cls.startingTrainings.filter(
      (t) => !["Light Armor", "Medium Armor", "Shield"].includes(t)
    );
    fighterFavoredTraining = pickRandom(weaponTrainings);
  }

  const lvl1Abilities = getAbilitiesAtLevel(cls.id, 1);
  const selectedClassAbility = lvl1Abilities.length > 0
    ? pickRandom(lvl1Abilities).ability
    : "";

  const tribeAttrs = tribe.attributeBonuses as Partial<Record<AttributeKey, number>>;
  const eligiblePlus = ATTRIBUTE_KEYS.filter(
    (k) => (tribeAttrs[k] ?? 0) + 1 <= ATTRIBUTE_MAX
  );
  const attrPlus = pickRandom(eligiblePlus);
  const eligibleMinus = ATTRIBUTE_KEYS.filter((k) => k !== attrPlus);
  const attrMinus = pickRandom(eligibleMinus);

  const zodiac = pickRandom(zodiacData as { id: string }[]);

  const namePool =
    (tribeNamesData as Record<string, string[]>)[tribe.id] ??
    Object.values(tribeNamesData as Record<string, string[]>).flat();
  const characterName = pickRandom(namePool);

  return {
    currentStep: 5,
    creationMode: "random",
    tribeId: tribe.id,
    startingBonus: bonus ? { name: bonus.name, description: bonus.description } : null,
    classId: cls.id,
    selectedClassAbility,
    magicSchool,
    fighterFavoredTraining,
    attrPlus,
    attrMinus,
    zodiacId: zodiac.id,
    characterName,
  };
}

export function computePreviewCharacter(state: WizardState): Character {
  let c = createDefaultCharacter();

  if (state.tribeId) {
    c = applyTribeStats(c, state.tribeId, state.startingBonus ?? undefined);
    c = applyTribeAttributeOverrides(c, state);
    c = applyStartingLanguages(c, state);
  }

  if (state.classId) {
    c = applyClassTrainings(c, state.classId);
    c = applyClassBonuses(c, state);
    c = applyClassScaling(c, state.classId, state.magicSchool);
    c = applySpellSchools(c, state.classId, state.magicSchool);
    if (state.selectedClassAbility) {
      const entry = findProgressionEntryByAbility(
        state.classId,
        state.selectedClassAbility
      );
      if (entry) {
        c = applyProgressionAbility(c, entry);
        c = { ...c, resolvedLevels: [1] };
      }
    }
  }

  c = applyAttributeAllocations(c, state);

  if (state.zodiacId) c = { ...c, zodiac: state.zodiacId };
  if (state.characterName) c = { ...c, name: state.characterName };

  c = applyDerivedStats(c);
  return c;
}

export function finalizeWizardCharacter(state: WizardState): Character {
  const c = computePreviewCharacter(state);
  const now = new Date().toISOString();
  return {
    ...c,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}
