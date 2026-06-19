import {
  loadWorkbook,
  sheetToUnmergedGrid,
  cellToString,
  cellToNumber,
  getDataSheetNames,
  type CellValue,
} from "./utils/xlsx";
import { toKebabId, normalizeWhitespace, cleanDescription, abbrToAttributeKey } from "./utils/strings";
import {
  resolveProjectPath,
  writeJsonOutput,
  log,
  createSummary,
  printSummary,
  type ParseSummary,
} from "./utils/io";

interface TribeData {
  id: string;
  name: string;
  description: string;
  physicalDescription: string;
  attributeBonuses: Record<string, number>;
  startingHP: number;
  startingStamina: number;
  evasionBase: number;
  movementBase: number;
  spellDie: string;
  spellMemoryBase: number;
  scalingAttribute: string;
  encumbranceBase: number;
  startingTrainings: string[];
  startingLanguages: string[];
  startingBonuses: { name: string; description: string }[];
  advancementBonuses: { name: string; description: string }[];
  gameplayNotes: string[];
}

interface ZodiacData {
  id: string;
  name: string;
  description: string;
}

const SKIP_SHEETS = ["blank"];
const ATTR_ROWS: Record<string, number> = {
  STRENGTH: 1,
  ACCURACY: 2,
  FINESSE: 3,
  SPEED: 4,
  INTELLIGENCE: 5,
  MEMORY: 6,
  VITALITY: 7,
  CHARISMA: 8,
  SURVIVAL: 9,
};

function extractTribeDescription(grid: CellValue[][]): string {
  const parts: string[] = [];
  for (let r = 2; r <= 12; r++) {
    const v = cellToString(grid[r]?.[0]);
    if (!v) continue;
    if (v.toLowerCase() === "physical description") break;
    parts.push(v);
  }
  return cleanDescription(parts.join(" "));
}

function extractPhysicalDescription(grid: CellValue[][]): string {
  const parts: string[] = [];
  let started = false;
  for (let r = 0; r < Math.min(30, grid.length); r++) {
    const v = cellToString(grid[r]?.[0]);
    if (v?.toLowerCase() === "physical description") {
      started = true;
      continue;
    }
    if (started) {
      if (!v) break;
      if (v.toLowerCase() === "advancement bonuses") break;
      parts.push(v);
    }
  }
  return cleanDescription(parts.join(" "));
}

function extractAttributeBonuses(grid: CellValue[][]): Record<string, number> {
  const bonuses: Record<string, number> = {};

  for (let r = 1; r <= 9; r++) {
    const attrName = cellToString(grid[r]?.[5]);
    const attrVal = grid[r]?.[6];
    if (!attrName) continue;

    const key = abbrToAttributeKey(attrName);
    if (!key) continue;

    const valStr = cellToString(attrVal);
    if (valStr === "-" || valStr === "") continue;

    const num = cellToNumber(attrVal);
    if (num !== 0) bonuses[key] = num;
  }

  return bonuses;
}

function extractStartingStats(grid: CellValue[][]): {
  startingHP: number;
  evasionBase: number;
  startingStamina: number;
  movementBase: number;
  spellDie: string;
  spellMemoryBase: number;
  encumbranceBase: number;
  scalingAttribute: string;
} {
  const stats = {
    startingHP: 0,
    evasionBase: 0,
    startingStamina: 0,
    movementBase: 0,
    spellDie: "",
    spellMemoryBase: 0,
    encumbranceBase: 0,
    scalingAttribute: "",
  };

  for (let r = 11; r <= 20; r++) {
    const label = cellToString(grid[r]?.[5])?.toLowerCase() || "";
    const val = grid[r]?.[6];
    const addAttr = cellToString(grid[r]?.[7]);

    if (label.includes("hp")) {
      stats.startingHP = cellToNumber(val);
    } else if (label.includes("evasion")) {
      stats.evasionBase = cellToNumber(val);
    } else if (label.includes("stamina")) {
      stats.startingStamina = cellToNumber(val);
    } else if (label.includes("movement")) {
      stats.movementBase = cellToNumber(val);
    } else if (label.includes("spellcasting die") || label.includes("spell die")) {
      stats.spellDie = cellToString(val);
    } else if (label.includes("spell memory")) {
      stats.spellMemoryBase = cellToNumber(val);
    } else if (label.includes("encumbrance")) {
      stats.encumbranceBase = cellToNumber(val);
    }

    if (label.includes("spell memory") && addAttr) {
      stats.scalingAttribute = addAttr;
    }
  }

  return stats;
}

function extractStartingBonuses(
  grid: CellValue[][],
  summary: ParseSummary,
  sheetName: string
): { name: string; description: string }[] {
  const bonuses: { name: string; description: string }[] = [];

  const selectRow = (() => {
    for (let r = 0; r <= 3; r++) {
      const v = cellToString(grid[r]?.[9])?.toLowerCase() || "";
      if (v.includes("select")) return r;
    }
    return 1;
  })();

  let r = selectRow + 1;
  while (r < Math.min(25, grid.length)) {
    const name = cellToString(grid[r]?.[9]);
    if (!name) { r++; continue; }

    const isUpperCase = name === name.toUpperCase() && name.length > 3;
    if (!isUpperCase) { r++; continue; }

    const descParts: string[] = [];
    for (let dr = r + 1; dr < Math.min(r + 6, grid.length); dr++) {
      const dv = cellToString(grid[dr]?.[9]);
      if (!dv) break;
      if (dv === dv.toUpperCase() && dv.length > 3 && !dv.match(/\d/)) break;
      descParts.push(dv);
    }

    bonuses.push({
      name: normalizeWhitespace(name),
      description: cleanDescription(descParts.join(" ")),
    });

    r += descParts.length + 1;
  }

  return bonuses;
}

function extractAdvancementBonuses(
  grid: CellValue[][],
  summary: ParseSummary,
  sheetName: string
): { name: string; description: string }[] {
  const bonuses: { name: string; description: string }[] = [];

  let advRow = -1;
  for (let r = 20; r < grid.length; r++) {
    const v = cellToString(grid[r]?.[0])?.toLowerCase() || "";
    if (v.includes("advancement bonus")) { advRow = r; break; }
  }

  if (advRow === -1) {
    log.warn("tribes", `Sheet "${sheetName}": no advancement bonuses section found`, summary, sheetName);
    return bonuses;
  }

  const cols = [0, 5];
  for (let r = advRow + 2; r < Math.min(advRow + 30, grid.length); r++) {
    for (const col of cols) {
      const name = cellToString(grid[r]?.[col]);
      if (!name) continue;
      if (name === name.toUpperCase() && name.length > 3 && !name.match(/^\d/) && !name.includes("ADVANCEMENT")) {
        const descParts: string[] = [];
        for (let dr = r + 1; dr < Math.min(r + 6, grid.length); dr++) {
          const dv = cellToString(grid[dr]?.[col]);
          if (!dv) break;
          if (dv === dv.toUpperCase() && dv.length > 3 && !dv.match(/\d/)) break;
          descParts.push(dv);
        }

        bonuses.push({
          name: normalizeWhitespace(name),
          description: cleanDescription(descParts.join(" ")),
        });
      }
    }
  }

  return bonuses;
}

function parseTribeSheet(
  grid: CellValue[][],
  sheetName: string,
  summary: ParseSummary
): TribeData | null {
  const name = cellToString(grid[0]?.[0]);
  if (!name) {
    log.error("tribes", `Sheet "${sheetName}": no tribe name at R0[0]`, summary);
    return null;
  }

  const description = extractTribeDescription(grid);
  const physicalDescription = extractPhysicalDescription(grid);
  const attributeBonuses = extractAttributeBonuses(grid);
  const stats = extractStartingStats(grid);
  const startingBonuses = extractStartingBonuses(grid, summary, sheetName);
  const advancementBonuses = extractAdvancementBonuses(grid, summary, sheetName);

  if (Object.keys(attributeBonuses).length === 0) {
    log.warn("tribes", `Sheet "${sheetName}": no attribute bonuses found`, summary, sheetName);
  }

  return {
    id: toKebabId(name),
    name: normalizeWhitespace(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()),
    description,
    physicalDescription,
    attributeBonuses,
    ...stats,
    startingTrainings: [],
    startingLanguages: ["Common"],
    startingBonuses,
    advancementBonuses,
    gameplayNotes: [],
  };
}

function parseZodiacSheet(
  grid: CellValue[][],
  summary: ParseSummary
): ZodiacData[] {
  const signs: ZodiacData[] = [];
  const COLS = [0, 2, 4, 6];

  for (let r = 0; r < grid.length; r += 8) {
    for (const col of COLS) {
      const name = cellToString(grid[r]?.[col]);
      if (!name) continue;

      const descParts: string[] = [];
      for (let dr = r + 2; dr < Math.min(r + 8, grid.length); dr++) {
        const dv = cellToString(grid[dr]?.[col]);
        if (!dv) break;
        if (descParts.length > 0 && descParts[descParts.length - 1] === dv) continue;
        descParts.push(dv);
      }

      signs.push({
        id: toKebabId(name),
        name: normalizeWhitespace(name),
        description: cleanDescription(descParts.join(" ")),
      });
    }
  }

  return signs;
}

export async function parseTribes(): Promise<ParseSummary> {
  const summary = createSummary("tribes");
  const path = resolveProjectPath("source-docs", "TRIBES _ BONUSES.xlsx");
  const wb = loadWorkbook(path);

  if (!wb) {
    log.error("tribes", `File not found: ${path}`, summary);
    printSummary(summary);
    return summary;
  }

  const tribes: TribeData[] = [];
  const zodiac: ZodiacData[] = [];

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.some((s) => sheetName.toLowerCase().includes(s))) {
      summary.skippedSheets.push(sheetName);
      summary.skipped++;
      continue;
    }

    const sheet = wb.Sheets[sheetName];
    const grid = sheetToUnmergedGrid(sheet);

    if (sheetName.toUpperCase() === "ZODIAC") {
      log.info("tribes", `Parsing zodiac from sheet: ${sheetName}`);
      const signs = parseZodiacSheet(grid, summary);
      zodiac.push(...signs);
      summary.parsed += signs.length;
      log.info("tribes", `  Found ${signs.length} zodiac signs`);
      continue;
    }

    log.info("tribes", `Parsing tribe: ${sheetName}`);
    const tribe = parseTribeSheet(grid, sheetName, summary);
    if (tribe) {
      tribes.push(tribe);
      summary.parsed++;
    } else {
      summary.skipped++;
      summary.skippedSheets.push(sheetName);
    }
  }

  writeJsonOutput("tribes.json", tribes);
  log.info("tribes", `Wrote ${tribes.length} tribes to data/tribes.json`);

  writeJsonOutput("zodiac.json", zodiac);
  log.info("tribes", `Wrote ${zodiac.length} zodiac signs to data/zodiac.json`);

  printSummary(summary);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseTribes().catch(console.error);
}
