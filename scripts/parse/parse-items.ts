/**
 * Fixed items parser — see parse-items.ts for the original implementation.
 * Run: npm run parse:items:v2
 */
import {
  loadWorkbook,
  sheetToUnmergedGrid,
  cellToString,
  cellToNumber,
  type CellValue,
} from "./utils/xlsx";
import { toKebabId, normalizeWhitespace, cleanDescription, deduplicateId, toTitleCase } from "./utils/strings";
import {
  resolveProjectPath,
  writeJsonOutput,
  log,
  createSummary,
  printSummary,
  type ParseSummary,
} from "./utils/io";

interface ItemData {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  rarity: string;
  originalItem?: string;
  damage?: string;
  damageType?: string;
  training?: string;
  grip?: string;
  attribute?: string;
  rareAttribute?: string;
  range?: string;
  material?: string;
  weight?: number;
  value?: number;
  guard?: string;
  reload?: string;
  bonus?: string;
  resistances?: string;
  armorClass?: string;
  additionalEffects?: string;
  effect?: string;
  type?: string;
  charges?: string;
  blockRoll?: string;
  durability?: string;
  bashDmg?: string;
  parry?: string;
  blockBonus?: string;
  description?: string;
  curseEffects?: string;
}

const RARITY_MAP: Record<string, string> = {
  "common gear": "common",
  "rare gear": "rare",
  "parallel gear": "parallel",
  "legendary gear": "legendary",
  rings: "rare",
  artifacts: "rare",
  "mods & enchanting": "n/a",
  "food & raw materials": "common",
  crafting: "n/a",
};

const CARD_PLACEHOLDER_NAMES = /^(ring name|armor name|item name)$/i;
const MOD_LEFT_SKIP = /^(title granted|weapon mods|armor mods|shield mods|mod material|raw materials|creation|category)$/i;
const MOD_RIGHT_SKIP = /^(title granted|weapon$|enchantments|armor$|armor mods|shield mods|mod material|arthosium|weaving)$/i;
const LEFT_SECTION_HEADERS = /^(weapon mods|armor mods|shield mods)$/i;
const MOD_MATERIAL_HEADER = /^mod material$/i;

type SmithingSection = "weapon" | "armor" | "shield";
type ModGrantSection = SmithingSection | "weaving";

interface ModGrant {
  name: string;
  effect: string;
  value?: number;
  section: ModGrantSection;
}

function normalizeMaterialKey(name: string): string {
  return name.trim().toLowerCase();
}

function capitalizeSection(section: ModGrantSection): string {
  return section.charAt(0).toUpperCase() + section.slice(1);
}

function formatModGrants(grants: ModGrant[]): string {
  return grants
    .map((g) => {
      const valuePart = g.value != null ? `${g.value} SV` : "n/a SV";
      return `${g.name} (${capitalizeSection(g.section)}, ${valuePart}): ${g.effect}`;
    })
    .join("\n");
}

function collectSmithingModEffects(grid: CellValue[][]): Map<string, ModGrant[]> {
  const byMaterial = new Map<string, ModGrant[]>();
  let section: SmithingSection = "weapon";
  let pastMaterials = false;

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[0]);
    if (!title) continue;

    if (LEFT_SECTION_HEADERS.test(title)) {
      if (/weapon/i.test(title)) section = "weapon";
      else if (/armor/i.test(title)) section = "armor";
      else section = "shield";
      continue;
    }

    if (MOD_MATERIAL_HEADER.test(title)) {
      pastMaterials = true;
      continue;
    }

    if (pastMaterials || MOD_LEFT_SKIP.test(title)) continue;
    if (title === title.toUpperCase() && title.length > 3 && !title.match(/\d/)) continue;

    const material = str(grid[r]?.[4]);
    if (!material) continue;

    const effectText = str(grid[r]?.[1]);
    if (!effectText) continue;

    const grant: ModGrant = {
      name: normalizeWhitespace(title),
      effect: cleanDescription(effectText),
      value: num(grid[r]?.[3]),
      section,
    };

    const key = normalizeMaterialKey(material);
    const existing = byMaterial.get(key);
    if (existing) existing.push(grant);
    else byMaterial.set(key, [grant]);
  }

  return byMaterial;
}

function collectWeavingModEffectsInto(
  grid: CellValue[][],
  byMaterial: Map<string, ModGrant[]>
): void {
  let inWeaving = false;
  let pastRightMaterials = false;

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[7]);
    if (!title) continue;

    if (/^weaving$/i.test(title) || /^arthosium$/i.test(title)) {
      inWeaving = true;
      continue;
    }

    if (MOD_MATERIAL_HEADER.test(title)) {
      pastRightMaterials = true;
      inWeaving = false;
      continue;
    }

    if (pastRightMaterials || !inWeaving) continue;
    if (MOD_RIGHT_SKIP.test(title)) continue;
    if (title === title.toUpperCase() && title.length > 3 && !title.match(/\d/)) continue;

    const material = str(grid[r]?.[9]);
    if (!material) continue;

    const effectText = str(grid[r]?.[8]);
    if (!effectText) continue;

    const grant: ModGrant = {
      name: normalizeWhitespace(title),
      effect: cleanDescription(effectText),
      value: num(grid[r]?.[10]),
      section: "weaving",
    };

    const key = normalizeMaterialKey(material);
    const existing = byMaterial.get(key);
    if (existing) existing.push(grant);
    else byMaterial.set(key, [grant]);
  }
}

function parseEyeStoneMaterials(
  grid: CellValue[][],
  byMaterial: Map<string, ModGrant[]>
): ItemData[] {
  const items: ItemData[] = [];
  let pastHeader = false;

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[0]);
    if (!title) continue;

    if (MOD_MATERIAL_HEADER.test(title)) {
      pastHeader = true;
      continue;
    }

    if (!pastHeader) continue;

    const description = str(grid[r]?.[1]);
    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(title),
      category: "mod",
      subcategory: "eye-stone",
      rarity: normalizeRarity(str(grid[r]?.[3]) || "n/a"),
      description: description ? cleanDescription(description) : undefined,
      value: num(grid[r]?.[2]),
    };

    const grants = byMaterial.get(normalizeMaterialKey(title));
    if (grants?.length) {
      item.effect = formatModGrants(grants);
    }

    items.push(item);
  }

  return items;
}

function parseArthreadMaterials(
  grid: CellValue[][],
  byMaterial: Map<string, ModGrant[]>
): ItemData[] {
  const items: ItemData[] = [];
  let pastHeader = false;

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[7]);
    if (!title) continue;

    if (MOD_MATERIAL_HEADER.test(title)) {
      pastHeader = true;
      continue;
    }

    if (!pastHeader) continue;

    const description = str(grid[r]?.[8]);
    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(title),
      category: "mod",
      subcategory: "arthread",
      rarity: normalizeRarity(str(grid[r]?.[9]) || "n/a"),
      description: description ? cleanDescription(description) : undefined,
      value: num(grid[r]?.[10]),
    };

    const grants = byMaterial.get(normalizeMaterialKey(title));
    if (grants?.length) {
      item.effect = formatModGrants(grants);
    }

    items.push(item);
  }

  return items;
}

function parseEnchantments(grid: CellValue[][]): ItemData[] {
  const items: ItemData[] = [];
  let section: "weapon" | "armor" = "weapon";
  let inWeaving = false;
  let pastRightMaterials = false;

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[7]);
    if (!title) continue;

    if (/^weapon$/i.test(title)) {
      section = "weapon";
      inWeaving = false;
      continue;
    }
    if (/^armor$/i.test(title) || /^enchantments$/i.test(title)) {
      section = "armor";
      inWeaving = false;
      continue;
    }
    if (/^weaving$/i.test(title) || /^arthosium$/i.test(title)) {
      inWeaving = true;
      continue;
    }
    if (MOD_MATERIAL_HEADER.test(title)) {
      pastRightMaterials = true;
      inWeaving = false;
      continue;
    }

    if (inWeaving || pastRightMaterials) continue;
    if (MOD_RIGHT_SKIP.test(title)) continue;
    if (title === title.toUpperCase() && title.length > 3 && !title.match(/\d/)) continue;

    const effectText = str(grid[r]?.[8]);
    if (!effectText) continue;

    const school = str(grid[r]?.[12]);
    items.push({
      id: "",
      name: normalizeWhitespace(title),
      category: "enchantment",
      subcategory: section,
      rarity: "n/a",
      effect: cleanDescription(effectText),
      value: num(grid[r]?.[10]),
      description: school && school !== "-" ? school : undefined,
    });
  }

  return items;
}
const CRAFT_RECIPE_SKIP = /^(armorer|weaponsmith|weaver|weaving)/i;
const CRAFT_MATERIAL_SKIP = /^(weapon subtype|shield subtype|crafting material list)$/i;
const VALID_CRAFT_RARITIES = /^(common|uncomm(?:on)?\.?|rare|legendary|legendry|crafted|raw mat|craft mat|n\/a)$/i;

type ShieldLayout = "common" | "rare" | "parallel";
type LeftSectionKind = "melee" | "ranged" | "channeling" | "channeling-spellbook" | "shield";

const SHIELD_COLUMNS: Record<
  ShieldLayout,
  {
    blockRoll: number;
    durability: number;
    bashDmg: number;
    parry: number;
    blockBonus: number;
    rareAttribute: number;
    material: number;
    weight: number;
    type: number;
    value: number;
  }
> = {
  common: {
    blockRoll: 1,
    durability: 2,
    bashDmg: 3,
    parry: 4,
    blockBonus: 5,
    rareAttribute: -1,
    material: 7,
    weight: 8,
    type: 9,
    value: 10,
  },
  rare: {
    blockRoll: 1,
    durability: 2,
    bashDmg: 3,
    parry: 4,
    blockBonus: 5,
    rareAttribute: 6,
    material: 7,
    weight: 9,
    type: 10,
    value: 11,
  },
  parallel: {
    blockRoll: 2,
    durability: 3,
    bashDmg: 4,
    parry: 5,
    blockBonus: 6,
    rareAttribute: 7,
    material: 8,
    weight: 10,
    type: 11,
    value: 12,
  },
};

function isValidCraftRarity(value: string | undefined): boolean {
  if (!value) return false;
  return VALID_CRAFT_RARITIES.test(value.trim());
}

function isShieldHeader(grid: CellValue[][], row: number): boolean {
  const leftCell = cellToString(grid[row]?.[0])?.toLowerCase() || "";
  if (!leftCell.includes("offhand") && !leftCell.includes("shield")) return false;
  for (const col of [1, 2]) {
    const label = cellToString(grid[row]?.[col])?.toLowerCase() || "";
    if (label.includes("block") || label.includes("dmg") || label.includes("durability")) {
      return true;
    }
  }
  return false;
}

function str(v: CellValue | undefined): string {
  const s = cellToString(v);
  return s === "-" ? "" : s;
}

function num(v: CellValue | undefined): number | undefined {
  const s = cellToString(v);
  if (!s || s === "-") return undefined;
  const n = cellToNumber(v);
  return n === 0 && s !== "0" ? undefined : n;
}

function normalizeRarity(value: string | undefined): string {
  if (!value) return "common";
  let r = value.toLowerCase().replace(/\.$/, "").trim();
  if (r === "uncomm") r = "uncommon";
  if (r === "legendry") r = "legendary";
  return r;
}

function isLegendaryTitle(name: string): boolean {
  if (!name || name.length < 3 || CARD_PLACEHOLDER_NAMES.test(name)) return false;
  if (name.includes(":")) return false;
  return name === name.toUpperCase() && /[A-Z]/.test(name);
}

function cardColumnText(grid: CellValue[][], row: number, col: number): string {
  for (let c = col; c <= col + 2; c++) {
    const text = str(grid[row]?.[c]);
    if (text) return text;
  }
  return "";
}

function isCardTitle(name: string, grid: CellValue[][], row: number, col: number): boolean {
  if (!name || name.length < 3 || CARD_PLACEHOLDER_NAMES.test(name)) return false;
  const chargesRow = str(grid[row + 1]?.[col]).toLowerCase();
  if (!chargesRow.startsWith("charges")) return false;
  if (/^curse effect|^value:/i.test(name)) return false;
  return true;
}

function armorSubcategory(gearType: string): string {
  const t = gearType.toLowerCase();
  if (t.includes("helm")) return "helmet";
  if (t.includes("glove") || t.includes("gauntlet")) return "gloves";
  if (t.includes("foot") || t.includes("leg")) return "footwear";
  return "body-armor";
}

function parseRareWeaponSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  subcategory: string
): ItemData[] {
  const items: ItemData[] = [];
  const hdr = grid[headerRow] || [];
  const col10Label = cellToString(hdr[10]).toLowerCase();
  const isReload = col10Label.includes("reload");

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "weapon",
      subcategory,
      rarity,
      damage: str(grid[r]?.[1]),
      damageType: str(grid[r]?.[2]),
      training: str(grid[r]?.[3]),
      grip: str(grid[r]?.[4]),
      attribute: str(grid[r]?.[5]),
      rareAttribute: str(grid[r]?.[6]),
      range: str(grid[r]?.[7]),
      material: str(grid[r]?.[8]),
      weight: num(grid[r]?.[9]),
      value: num(grid[r]?.[11]),
    };

    if (isReload) item.reload = str(grid[r]?.[10]);
    else item.guard = str(grid[r]?.[10]);

    items.push(item);
  }
  return items;
}

function parseParallelWeaponSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  subcategory: string
): ItemData[] {
  const items: ItemData[] = [];
  const hdr = grid[headerRow] || [];
  const col11Label = cellToString(hdr[11]).toLowerCase();
  const isReload = col11Label.includes("reload");

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "weapon",
      subcategory,
      rarity,
      originalItem: str(grid[r]?.[1]) || undefined,
      damage: str(grid[r]?.[2]),
      damageType: str(grid[r]?.[3]),
      training: str(grid[r]?.[4]),
      grip: str(grid[r]?.[5]),
      attribute: str(grid[r]?.[6]),
      rareAttribute: str(grid[r]?.[7]),
      range: str(grid[r]?.[8]),
      material: str(grid[r]?.[9]),
      weight: num(grid[r]?.[10]),
      value: num(grid[r]?.[12]),
    };

    if (isReload) item.reload = str(grid[r]?.[11]);
    else item.guard = str(grid[r]?.[11]);

    items.push(item);
  }
  return items;
}

function parseCommonWeaponSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  subcategory: string
): ItemData[] {
  const items: ItemData[] = [];
  const hdr = grid[headerRow] || [];
  const col9Label = cellToString(hdr[9]).toLowerCase();
  const isReload = col9Label.includes("reload");

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "weapon",
      subcategory,
      rarity,
      damage: str(grid[r]?.[1]),
      damageType: str(grid[r]?.[2]),
      training: str(grid[r]?.[3]),
      grip: str(grid[r]?.[4]),
      attribute: str(grid[r]?.[5]),
      range: str(grid[r]?.[6]),
      material: str(grid[r]?.[7]),
      weight: num(grid[r]?.[8]),
      value: num(grid[r]?.[10]),
    };

    if (isReload) item.reload = str(grid[r]?.[9]);
    else item.guard = str(grid[r]?.[9]);

    items.push(item);
  }
  return items;
}

function parseChannelingSpellbookSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  isParallel: boolean
): ItemData[] {
  const items: ItemData[] = [];

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const effectSource = isParallel ? str(grid[r]?.[2]) : str(grid[r]?.[1]);
    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "weapon",
      subcategory: "channeling",
      rarity,
      effect: effectSource ? cleanDescription(effectSource) : undefined,
    };

    if (isParallel) {
      item.originalItem = str(grid[r]?.[1]) || undefined;
      item.training = str(grid[r]?.[8]) || undefined;
      item.grip = str(grid[r]?.[10]) || undefined;
      item.value = num(grid[r]?.[11]);
      item.weight = num(grid[r]?.[12]);
    } else if (rarity === "rare") {
      item.rareAttribute = str(grid[r]?.[7]) || undefined;
      item.grip = str(grid[r]?.[9]) || undefined;
      item.value = num(grid[r]?.[10]);
      item.weight = num(grid[r]?.[11]);
    } else {
      item.training = str(grid[r]?.[6]) || undefined;
      item.weight = num(grid[r]?.[8]);
      item.grip = str(grid[r]?.[9]) || undefined;
      item.value = num(grid[r]?.[10]);
    }

    items.push(item);
  }

  return items;
}

function parseSupplySection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  startCol: number
): ItemData[] {
  const items: ItemData[] = [];
  const hdr = grid[headerRow] || [];
  const hasMatCol = cellToString(hdr[startCol + 6]).toLowerCase().includes("material");

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[startCol]);
    if (!name) continue;

    const effectStr = str(grid[r]?.[startCol + 1]);
    const typeStr = str(grid[r]?.[startCol + 7]);
    const materialStr = hasMatCol ? str(grid[r]?.[startCol + 6]) : undefined;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "supply",
      subcategory: typeStr?.toLowerCase() || "consumable",
      rarity,
      effect: effectStr ? cleanDescription(effectStr) : undefined,
      type: typeStr || undefined,
      material: materialStr || undefined,
      weight: num(grid[r]?.[startCol + 8]),
      value: num(grid[r]?.[startCol + 9]),
    });
  }
  return items;
}

function parseArmorSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  startCol: number,
  subcategory: string
): ItemData[] {
  const items: ItemData[] = [];

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[startCol]);
    if (!name) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "armor",
      subcategory,
      rarity,
      bonus: str(grid[r]?.[startCol + 1]),
      resistances: str(grid[r]?.[startCol + 2]),
      additionalEffects: str(grid[r]?.[startCol + 5]),
      material: str(grid[r]?.[startCol + 6]),
      armorClass: str(grid[r]?.[startCol + 7]),
      weight: num(grid[r]?.[startCol + 8]),
      value: num(grid[r]?.[startCol + 9]),
    });
  }
  return items;
}

function parseShieldSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  layout: ShieldLayout
): ItemData[] {
  const items: ItemData[] = [];
  const cols = SHIELD_COLUMNS[layout];

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const typeVal = str(grid[r]?.[cols.type]);
    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "shield",
      subcategory: "shield",
      rarity,
      blockRoll: str(grid[r]?.[cols.blockRoll]),
      durability: str(grid[r]?.[cols.durability]),
      bashDmg: str(grid[r]?.[cols.bashDmg]),
      parry: str(grid[r]?.[cols.parry]),
      blockBonus: str(grid[r]?.[cols.blockBonus]),
      material: str(grid[r]?.[cols.material]),
      weight: num(grid[r]?.[cols.weight]),
      value: num(grid[r]?.[cols.value]),
    };

    if (cols.rareAttribute >= 0) {
      item.rareAttribute = str(grid[r]?.[cols.rareAttribute]) || undefined;
    }

    if (typeVal === "Shield") item.type = "Shield";
    else if (typeVal) item.grip = typeVal;

    items.push(item);
  }
  return items;
}

function findLegendaryStatStart(grid: CellValue[][], col: number, nameRow: number): number {
  const statC = col + 2;
  for (let r = nameRow + 2; r < Math.min(nameRow + 22, grid.length); r++) {
    const label = str(grid[r]?.[statC]);
    if (label === "DMG" || label === "Bonus 1") return r;
  }
  return -1;
}

function findLegendaryLabelRow(
  grid: CellValue[][],
  col: number,
  startRow: number,
  endRow: number,
  label: string
): number {
  const statC = col + 2;
  for (let r = startRow; r < endRow && r < grid.length; r++) {
    if (str(grid[r]?.[statC]) === label) return r;
  }
  return -1;
}

const LEGENDARY_STAT_LABELS = new Set([
  "DMG", "DMG Type", "Scaling", "Range", "Bonus", "Training", "Weight", "Value",
  "Weapon Attributes", "Weapon Attribute", "Additional Attributes", "Additional Attribute",
  "Bonus 1", "Bonus 2", "Weaknesses", "Resistances",
]);

function collectLegendaryLore(
  grid: CellValue[][],
  col: number,
  nameRow: number
): string {
  const parts: string[] = [];
  const endRow = Math.min(nameRow + 18, grid.length);

  for (let r = nameRow + 2; r < endRow; r++) {
    const text = str(grid[r]?.[col]);
    const statLabel = str(grid[r]?.[col + 2]);
    if (text === "Legendary Trait:" || statLabel === "Legendary Trait:" || statLabel === "Weight") break;
    if (!text || text === "Description / Lore" || text === "Legendary Trait:") continue;
    if (LEGENDARY_STAT_LABELS.has(text)) continue;
    parts.push(text);
  }

  return parts.length > 0 ? cleanDescription(parts.join(" ")) : "";
}

function collectLegendaryTraitText(
  grid: CellValue[][],
  col: number,
  traitRow: number,
  endRow: number
): string {
  const statC = col + 2;
  const parts: string[] = [];
  for (let r = traitRow + 1; r < endRow && r < grid.length; r++) {
    const left = str(grid[r]?.[col]);
    const right = str(grid[r]?.[col + 1]);
    if (left && left !== "Legendary Trait:") parts.push(left);
    else if (right && right !== "Trait Name") parts.push(right);
    if (str(grid[r]?.[statC]) === "Weight") break;
  }
  return parts.length > 0 ? cleanDescription(parts.join(" ")) : "";
}

function parseLegendaryCard(grid: CellValue[][], col: number, nameRow: number): ItemData | null {
  const name = normalizeWhitespace(str(grid[nameRow]?.[col]));
  if (!name) return null;

  const statStart = findLegendaryStatStart(grid, col, nameRow);
  if (statStart < 0) return null;

  const statC = col + 2;
  const statC2 = col + 3;
  const endRow = Math.min(nameRow + 22, grid.length);
  const isArmor = str(grid[statStart]?.[statC]) === "Bonus 1";

  const charges = str(grid[nameRow + 1]?.[statC]);
  const gearType = str(grid[nameRow + 1]?.[statC2]);

  const item: ItemData = {
    id: "",
    name,
    category: isArmor ? "armor" : "legendary-weapon",
    subcategory: isArmor ? armorSubcategory(gearType) : "legendary-weapon",
    rarity: "legendary",
    charges: charges || undefined,
    type: gearType || undefined,
    description: collectLegendaryLore(grid, col, nameRow) || undefined,
  };

  if (isArmor) {
    item.bonus = str(grid[statStart + 1]?.[statC]) || undefined;
    const bonus2 = str(grid[statStart + 1]?.[statC2]);
    if (bonus2) item.additionalEffects = bonus2;

    const weakRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Weaknesses");
    if (weakRow >= 0) {
      const w1 = str(grid[weakRow + 1]?.[statC]);
      const w2 = str(grid[weakRow + 1]?.[statC2]);
      item.resistances = [w1, w2].filter(Boolean).join("; ") || undefined;
    }

    const resistRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Resistances");
    if (resistRow >= 0) {
      const r1 = str(grid[resistRow + 1]?.[statC]);
      const r2 = str(grid[resistRow + 1]?.[statC2]);
      const resist = [r1, r2].filter(Boolean).join("; ");
      if (resist) item.resistances = item.resistances ? `${item.resistances}; ${resist}` : resist;
    }

    item.armorClass = gearType || undefined;
  } else {
    item.damage = str(grid[statStart + 1]?.[statC]) || undefined;
    item.damageType = str(grid[statStart + 1]?.[statC2]) || undefined;

    const scalingRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Scaling");
    if (scalingRow >= 0) {
      item.attribute = str(grid[scalingRow + 1]?.[statC]) || undefined;
      item.range = str(grid[scalingRow + 1]?.[statC2]) || undefined;
    }

    const bonusRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Bonus");
    if (bonusRow >= 0) {
      item.bonus = str(grid[bonusRow + 1]?.[statC]) || undefined;
      item.training = str(grid[bonusRow + 1]?.[statC2]) || undefined;
    }

    const attrRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Weapon Attributes");
    const attrRowAlt = attrRow < 0
      ? findLegendaryLabelRow(grid, col, statStart, endRow, "Weapon Attribute")
      : -1;
    const resolvedAttrRow = attrRow >= 0 ? attrRow : attrRowAlt;
    if (resolvedAttrRow >= 0) {
      const wa = str(grid[resolvedAttrRow + 1]?.[statC]);
      if (wa) item.rareAttribute = wa;
    }
  }

  for (let r = statStart; r < endRow; r++) {
    if (str(grid[r]?.[col]) === "Legendary Trait:") {
      const traitName = str(grid[r]?.[col + 1]);
      if (traitName && traitName !== "Trait Name") item.effect = traitName;
      const traitText = collectLegendaryTraitText(grid, col, r, endRow);
      if (traitText) {
        item.additionalEffects = item.additionalEffects
          ? `${item.additionalEffects} ${traitText}`
          : traitText;
      }
      break;
    }
  }

  const weightRow = findLegendaryLabelRow(grid, col, statStart, endRow, "Weight");
  if (weightRow >= 0) {
    item.weight = num(grid[weightRow + 1]?.[statC]);
    item.value = num(grid[weightRow + 1]?.[statC2]);
  }

  return item;
}

function parseLegendarySection(grid: CellValue[][]): ItemData[] {
  const items: ItemData[] = [];
  const CARD_COLS = [0, 5, 10, 15];
  const seen = new Set<string>();

  for (let r = 3; r < grid.length; r++) {
    for (const col of CARD_COLS) {
      const rawName = str(grid[r]?.[col]);
      if (!isLegendaryTitle(rawName)) continue;
      const meta = str(grid[r + 1]?.[col]).toLowerCase();
      if (!meta.includes("description")) continue;

      const item = parseLegendaryCard(grid, col, r);
      if (!item || seen.has(item.name)) continue;
      seen.add(item.name);
      items.push(item);
    }
  }

  return items;
}

function parseRingArtifactCards(
  grid: CellValue[][],
  category: string,
  rarity: string
): ItemData[] {
  const items: ItemData[] = [];
  const COLS = [0, 3, 6, 9, 12, 15, 18];
  const seen = new Set<string>();

  for (let r = 3; r < grid.length; r++) {
    for (const col of COLS) {
      const name = str(grid[r]?.[col]);
      if (!isCardTitle(name, grid, r, col)) continue;

      const chargesVal = str(grid[r + 1]?.[col + 1]);
      const descParts: string[] = [];
      const curseParts: string[] = [];
      let inCurse = false;

      for (let dr = r + 2; dr < grid.length; dr++) {
        const cell = cardColumnText(grid, dr, col);
        if (!cell) break;
        const lower = cell.toLowerCase();
        if (lower.startsWith("value:")) break;
        if (isCardTitle(cell, grid, dr, col)) break;
        if (lower.startsWith("curse effect")) {
          inCurse = true;
          continue;
        }
        if (inCurse) curseParts.push(cell);
        else descParts.push(cell);
      }

      const normalizedName = normalizeWhitespace(name);
      if (seen.has(normalizedName)) continue;
      seen.add(normalizedName);

      items.push({
        id: "",
        name: normalizedName,
        category,
        subcategory: category,
        rarity,
        charges: chargesVal || undefined,
        description: descParts.length > 0 ? cleanDescription(descParts.join(" ")) : undefined,
        curseEffects: curseParts.length > 0 ? cleanDescription(curseParts.join(" ")) : undefined,
      });
    }
  }

  return items;
}

function parseModsSection(grid: CellValue[][]): ItemData[] {
  const byMaterial = collectSmithingModEffects(grid);
  collectWeavingModEffectsInto(grid, byMaterial);

  return [
    ...parseEyeStoneMaterials(grid, byMaterial),
    ...parseArthreadMaterials(grid, byMaterial),
    ...parseEnchantments(grid),
  ];
}

function parseFoodSection(grid: CellValue[][]): ItemData[] {
  const items: ItemData[] = [];

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;
    if (/^raw materials$/i.test(name)) break;
    if (/^item name$/i.test(name)) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "food",
      subcategory: normalizeRarity(str(grid[r]?.[3])),
      rarity: normalizeRarity(str(grid[r]?.[3])),
      effect: str(grid[r]?.[4]) ? cleanDescription(cellToString(grid[r]?.[4])) : undefined,
      value: num(grid[r]?.[2]),
    });
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[10]);
    if (!name) continue;
    if (/^raw materials$/i.test(str(grid[r]?.[0]))) break;
    if (/^spirits$/i.test(name)) continue;
    if (/^item name$/i.test(name)) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "food",
      subcategory: normalizeRarity(str(grid[r]?.[13])),
      rarity: normalizeRarity(str(grid[r]?.[13])),
      effect: str(grid[r]?.[14]) ? cleanDescription(cellToString(grid[r]?.[14])) : undefined,
      value: num(grid[r]?.[12]),
    });
  }

  return items;
}

function parseCraftingSection(grid: CellValue[][]): ItemData[] {
  const items: ItemData[] = [];

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;
    if (CRAFT_RECIPE_SKIP.test(name)) continue;
    if (name === name.toUpperCase() && !name.match(/\d/)) continue;

    const rarityVal = str(grid[r]?.[1]);
    if (!isValidCraftRarity(rarityVal)) continue;
    if (normalizeWhitespace(name).toLowerCase() === rarityVal.toLowerCase()) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "recipe",
      rarity: normalizeRarity(rarityVal),
      material: [str(grid[r]?.[2]), str(grid[r]?.[3])].filter(Boolean).join(" + ") || undefined,
    });
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[5]);
    if (!name) continue;
    if (CRAFT_MATERIAL_SKIP.test(name)) break;
    if (/^crafting material list$/i.test(name)) continue;

    const rarityVal = str(grid[r]?.[7]);
    if (!isValidCraftRarity(rarityVal)) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "material",
      rarity: normalizeRarity(rarityVal),
      value: num(grid[r]?.[6]),
    });
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[13]);
    if (!name) continue;
    if (/^ingredients/i.test(name)) continue;

    const rarityVal = str(grid[r]?.[15]);
    if (rarityVal && !isValidCraftRarity(rarityVal)) continue;

    items.push({
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "ingredient",
      rarity: normalizeRarity(str(grid[r]?.[15])),
      value: num(grid[r]?.[14]),
      description: str(grid[r]?.[17]) || undefined,
    });
  }

  return items;
}

function parseGearSheet(
  grid: CellValue[][],
  rarity: string,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];
  const isRare = rarity === "rare";
  const isParallel = rarity === "parallel";
  const shieldLayout: ShieldLayout = isParallel ? "parallel" : isRare ? "rare" : "common";

  const leftHeaders: { row: number; kind: LeftSectionKind }[] = [];
  const rightHeaders: { row: number; subcategory: string; category: string }[] = [];

  for (let r = 2; r < Math.min(200, grid.length); r++) {
    const leftCell = cellToString(grid[r]?.[0])?.toLowerCase() || "";
    if (leftCell.includes("channeling spellbook")) {
      leftHeaders.push({ row: r, kind: "channeling-spellbook" });
    } else if (leftCell.includes("melee weapon") || leftCell.includes("parallel melee")) {
      leftHeaders.push({ row: r, kind: "melee" });
    } else if (leftCell.includes("ranged weapon") || leftCell.includes("parallel ranged")) {
      leftHeaders.push({ row: r, kind: "ranged" });
    } else if (leftCell.includes("channeling")) {
      leftHeaders.push({ row: r, kind: "channeling" });
    } else if (isShieldHeader(grid, r)) {
      leftHeaders.push({ row: r, kind: "shield" });
    }

    const rightStartCol = isParallel ? 14 : 12;
    const rightCell = cellToString(grid[r]?.[rightStartCol])?.toLowerCase() || "";
    if (rightCell.includes("supply")) {
      rightHeaders.push({ row: r, subcategory: "supply", category: "supply" });
    } else if (rightCell === "tools") {
      rightHeaders.push({ row: r, subcategory: "tool", category: "supply" });
    } else if (rightCell.includes("combat tool")) {
      rightHeaders.push({ row: r, subcategory: "combat-tool", category: "supply" });
    } else if (rightCell.includes("main armor") || rightCell.includes("armor item")) {
      rightHeaders.push({ row: r, subcategory: "body-armor", category: "armor" });
    } else if (rightCell.includes("helmet")) {
      rightHeaders.push({ row: r, subcategory: "helmet", category: "armor" });
    } else if (rightCell.includes("glove") || rightCell.includes("gauntlet")) {
      rightHeaders.push({ row: r, subcategory: "gloves", category: "armor" });
    } else if (rightCell.includes("footwear") || rightCell.includes("leg armor")) {
      rightHeaders.push({ row: r, subcategory: "footwear", category: "armor" });
    }
  }

  for (let i = 0; i < leftHeaders.length; i++) {
    const h = leftHeaders[i];
    const nextRow = leftHeaders[i + 1]?.row ?? grid.length;

    if (h.kind === "shield") {
      items.push(...parseShieldSection(grid, h.row, nextRow, rarity, shieldLayout));
    } else if (h.kind === "channeling-spellbook") {
      items.push(...parseChannelingSpellbookSection(grid, h.row, nextRow, rarity, isParallel));
    } else if (isParallel) {
      items.push(...parseParallelWeaponSection(grid, h.row, nextRow, rarity, h.kind));
    } else if (isRare) {
      items.push(...parseRareWeaponSection(grid, h.row, nextRow, rarity, h.kind));
    } else {
      items.push(...parseCommonWeaponSection(grid, h.row, nextRow, rarity, h.kind));
    }
  }

  const rightStartCol = isParallel ? 14 : 12;
  for (let i = 0; i < rightHeaders.length; i++) {
    const h = rightHeaders[i];
    const nextRow = rightHeaders[i + 1]?.row ?? grid.length;

    if (h.category === "armor") {
      items.push(...parseArmorSection(grid, h.row, nextRow, rarity, rightStartCol, h.subcategory));
    } else {
      items.push(...parseSupplySection(grid, h.row, nextRow, rarity, rightStartCol));
    }
  }

  return items;
}

function finalizeItems(
  sheetItems: ItemData[],
  sheetRarity: string,
  existingIds: Set<string>
): ItemData[] {
  const result: ItemData[] = [];

  for (const item of sheetItems) {
    if (!item.name) continue;

    if (item.name === item.name.toUpperCase() && item.name.length > 3) {
      item.name = toTitleCase(item.name);
    }
    if (item.subcategory) {
      item.subcategory = normalizeRarity(item.subcategory);
    }
    if (item.rarity) {
      item.rarity = normalizeRarity(item.rarity);
    }

    const idRarity = item.rarity && item.rarity !== "n/a" ? item.rarity : sheetRarity;
    const baseId = toKebabId(`${idRarity}-${item.name}`);
    item.id = deduplicateId(baseId, existingIds);
    existingIds.add(item.id);
    result.push(item);
  }

  return result;
}

function stripEmpty(item: ItemData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  }
  return result;
}

export async function parseItems(): Promise<ParseSummary> {
  const summary = createSummary("items-v2");
  const path = resolveProjectPath("source-docs", "ITEMS.xlsx");
  const wb = loadWorkbook(path);

  if (!wb) {
    log.error("items-v2", `File not found: ${path}`, summary);
    printSummary(summary);
    return summary;
  }

  const allItems: ItemData[] = [];
  const existingIds = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    log.info("items-v2", `Parsing sheet: ${sheetName}`);
    const sheet = wb.Sheets[sheetName];
    const grid = sheetToUnmergedGrid(sheet);
    const sheetRarity = RARITY_MAP[sheetName.toLowerCase()] || "common";

    let sheetItems: ItemData[] = [];

    try {
      const lowerName = sheetName.toLowerCase();

      if (lowerName.includes("gear") && !lowerName.includes("legendary")) {
        sheetItems = parseGearSheet(grid, sheetRarity, sheetName);
      } else if (lowerName.includes("legendary")) {
        sheetItems = parseLegendarySection(grid);
      } else if (lowerName.includes("ring")) {
        sheetItems = parseRingArtifactCards(grid, "ring", "rare");
      } else if (lowerName.includes("artifact")) {
        sheetItems = parseRingArtifactCards(grid, "artifact", "rare");
      } else if (lowerName.includes("mod") || lowerName.includes("enchant")) {
        sheetItems = parseModsSection(grid);
      } else if (lowerName.includes("food") || lowerName.includes("material")) {
        sheetItems = parseFoodSection(grid);
      } else if (lowerName.includes("craft")) {
        sheetItems = parseCraftingSection(grid);
      } else {
        log.warn("items-v2", `Sheet "${sheetName}": unknown layout, skipping`, summary, sheetName);
        summary.skipped++;
        summary.skippedSheets.push(sheetName);
        continue;
      }

      const finalized = finalizeItems(sheetItems, sheetRarity, existingIds);
      log.info("items-v2", `  Found ${finalized.length} items`);
      allItems.push(...finalized);
      summary.parsed += finalized.length;
    } catch (err) {
      log.error("items-v2", `Sheet "${sheetName}": parse error: ${err}`, summary);
      summary.skipped++;
      summary.skippedSheets.push(sheetName);
    }
  }

  const cleaned = allItems.map(stripEmpty);
  writeJsonOutput("items.json", cleaned);
  log.info("items-v2", `Wrote ${cleaned.length} items to data/items.json`);
  printSummary(summary);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseItems().catch(console.error);
}
