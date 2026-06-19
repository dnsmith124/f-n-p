import type { Character, AttributeKey, MagicSchool } from "./types/character";
import {
  createDefaultCharacter,
  applyTribeStats,
  applyClassTrainings,
  applyDerivedStats,
  generateId,
  findTribe,
} from "./utils";

export interface WizardState {
  currentStep: number;
  tribeId: string;
  startingBonus: { name: string; description: string } | null;
  classId: string;
  magicSchool: MagicSchool | null;
  fighterFavoredTraining: string;
  attrPlus: AttributeKey | null;
  attrMinus: AttributeKey | null;
  zodiacId: string;
  characterName: string;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: 0,
  tribeId: "",
  startingBonus: null,
  classId: "",
  magicSchool: null,
  fighterFavoredTraining: "",
  attrPlus: null,
  attrMinus: null,
  zodiacId: "",
  characterName: "",
};

export const WIZARD_STEPS = [
  { label: "Tribe", shortLabel: "Tribe" },
  { label: "Class", shortLabel: "Class" },
  { label: "Attributes", shortLabel: "Attrs" },
  { label: "Identity", shortLabel: "Name" },
  { label: "Review", shortLabel: "Review" },
] as const;

export function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 0:
      return state.tribeId !== "";
    case 1:
      if (state.classId === "") return false;
      if (state.classId === "mage" && !state.magicSchool) return false;
      if (state.classId === "fighter" && !state.fighterFavoredTraining)
        return false;
      return true;
    case 2:
      return (
        state.attrPlus !== null &&
        state.attrMinus !== null &&
        state.attrPlus !== state.attrMinus
      );
    case 3:
      return state.characterName.trim() !== "";
    case 4:
      return true;
    default:
      return false;
  }
}

const MAGIC_SCHOOL_SCALING: Record<MagicSchool, string> = {
  pyromancy: "INT",
  oceansCall: "INT",
  greatStorm: "INT",
  arcadian: "INT",
  twinMoon: "INT",
  phantasm: "INT",
};

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
          scalingAttribute: state.magicSchool
            ? MAGIC_SCHOOL_SCALING[state.magicSchool]
            : "",
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
