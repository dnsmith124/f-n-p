import { readFileSync } from "fs";
import {
  loadWorkbook,
  sheetToUnmergedGrid,
  cellToString,
  getDataSheetNames,
  type CellValue,
} from "./utils/xlsx";
import { toKebabId, normalizeWhitespace, cleanDescription, toTitleCase } from "./utils/strings";
import {
  resolveProjectPath,
  writeJsonOutput,
  log,
  createSummary,
  printSummary,
  type ParseSummary,
} from "./utils/io";

interface ClassProgression {
  level: number;
  ability: string;
  description: string;
  type?: string;
  path?: string;
}

interface ClassData {
  id: string;
  name: string;
  type: "base" | "advanced" | "hybrid";
  description: string;
  parentClasses: string[];
  startingTrainings: string[];
  startingSkills: string[];
  favoredAttributes: string[];
  statBonuses: string;
  classBonus: string;
  progression: ClassProgression[];
}

const SKIP_SHEETS = ["animal companions", "new (blank) class"];
const PATH_COLS = [0, 3, 6];
const TYPE_COLS = [1, 4, 7];

function parseTrainings(raw: string): string[] {
  if (!raw) return [];
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "(n/a)" || trimmed === "n/a" || trimmed === "none") return [];
  return raw
    .split(/[\/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFavoredAttributes(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractDescription(grid: CellValue[][]): string {
  const val = cellToString(grid[1]?.[6]);
  if (!val || val === "Class Description") {
    for (let r = 2; r <= 6; r++) {
      const v = cellToString(grid[r]?.[6]);
      if (v && v !== "Class Description") return cleanDescription(v);
    }
    return "";
  }
  return cleanDescription(val);
}

function extractParentClasses(grid: CellValue[][]): string[] {
  const r5 = cellToString(grid[5]?.[0]);
  if (!r5) return [];

  const hybridMatch = r5.match(/^(.+?)\s*\/\s*(.+?)\s+HYBRID\s+CLASS/i);
  if (hybridMatch) {
    return [hybridMatch[1].trim(), hybridMatch[2].trim()];
  }

  const masterMatch = r5.match(/MASTER\s+OF\s+(?:THE\s+)?(.+?)\s+CLASS/i);
  if (masterMatch) {
    return [masterMatch[1].trim()];
  }

  return [];
}

function determineClassType(
  grid: CellValue[][],
  parents: string[]
): "base" | "advanced" | "hybrid" {
  const r5 = cellToString(grid[5]?.[0]).toUpperCase();
  if (r5.includes("HYBRID")) return "hybrid";
  if (r5.includes("MASTER")) return "advanced";
  return "base";
}

function extractProgression(
  grid: CellValue[][],
  pathNames: string[],
  summary: ParseSummary,
  sheetName: string
): ClassProgression[] {
  const progression: ClassProgression[] = [];
  const levelPattern = /^(\d+)(?:ST|ND|RD|TH)\s+LEVEL$/i;

  for (let r = 13; r < grid.length; r++) {
    const cell = cellToString(grid[r]?.[0]);
    const match = cell.match(levelPattern);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const skillRow = r + 1;
    const descRow = r + 2;

    if (skillRow >= grid.length) break;

    for (let pi = 0; pi < PATH_COLS.length; pi++) {
      const pc = PATH_COLS[pi];
      const tc = TYPE_COLS[pi];
      const abilityName = cellToString(grid[skillRow]?.[pc]);
      const abilityType = cellToString(grid[skillRow]?.[tc]);

      if (!abilityName) {
        log.warn(
          "classes",
          `Sheet "${sheetName}" level ${level} path ${pi}: empty ability name`,
          summary,
          sheetName
        );
        continue;
      }

      let desc = "";
      for (let dr = descRow; dr < Math.min(descRow + 5, grid.length); dr++) {
        const dv = cellToString(grid[dr]?.[pc]);
        if (!dv) break;
        desc += (desc ? " " : "") + dv;
      }

      progression.push({
        level,
        ability: normalizeWhitespace(abilityName),
        description: cleanDescription(normalizeWhitespace(desc)),
        type: abilityType || undefined,
        path: pathNames[pi] || undefined,
      });
    }
  }

  return progression;
}

function parseClassSheet(
  grid: CellValue[][],
  sheetName: string,
  summary: ParseSummary
): ClassData | null {
  const name = cellToString(grid[1]?.[0]);
  if (!name) {
    log.error("classes", `Sheet "${sheetName}": no class name found at R1[0]`, summary);
    return null;
  }

  const description = extractDescription(grid);
  const parentClasses = extractParentClasses(grid);
  const classType = determineClassType(grid, parentClasses);

  const trainingsRaw = cellToString(grid[8]?.[0]);
  const startingTrainings = parseTrainings(trainingsRaw);
  if (startingTrainings.length === 0) {
    log.warn("classes", `Sheet "${sheetName}": no trainings found at R8[0]`, summary, sheetName);
  }

  const favAttrsRaw = cellToString(grid[8]?.[3]);
  const favoredAttributes = parseFavoredAttributes(favAttrsRaw);

  const statBonuses = cleanDescription(cellToString(grid[10]?.[3]));
  const classBonus = cleanDescription(cellToString(grid[8]?.[6]));

  const pathNames = PATH_COLS.map((c) => cellToString(grid[12]?.[c]));

  const progression = extractProgression(grid, pathNames, summary, sheetName);
  if (progression.length === 0) {
    log.warn("classes", `Sheet "${sheetName}": no progression entries found`, summary, sheetName);
  }

  const id = toKebabId(name);

  return {
    id,
    name: toTitleCase(normalizeWhitespace(name)),
    type: classType,
    description,
    parentClasses,
    startingTrainings,
    startingSkills: [],
    favoredAttributes,
    statBonuses,
    classBonus,
    progression,
  };
}

export async function parseClasses(): Promise<ParseSummary> {
  const summary = createSummary("classes");

  const files = [
    { path: resolveProjectPath("source-docs", "CLASSES (advanced).xlsx"), label: "advanced" },
    { path: resolveProjectPath("source-docs", "CLASSES (Hybrid).xlsx"), label: "hybrid" },
  ];

  const allClasses: ClassData[] = [];

  for (const { path, label } of files) {
    const wb = loadWorkbook(path);
    if (!wb) {
      log.error("classes", `File not found: ${path}`, summary);
      continue;
    }

    log.info("classes", `Parsing ${label} classes from ${path.split("/").pop()}`);

    const sheets = getDataSheetNames(wb, SKIP_SHEETS);
    for (const sheetName of sheets) {
      if (SKIP_SHEETS.some((s) => sheetName.toLowerCase().includes(s))) {
        summary.skippedSheets.push(sheetName);
        continue;
      }

      log.info("classes", `  Sheet: ${sheetName}`);
      const sheet = wb.Sheets[sheetName];
      const grid = sheetToUnmergedGrid(sheet);
      const classData = parseClassSheet(grid, sheetName, summary);

      if (classData) {
        allClasses.push(classData);
        summary.parsed++;
      } else {
        summary.skipped++;
        summary.skippedSheets.push(sheetName);
      }
    }
  }

  const seenIds = new Set<string>();
  for (const c of allClasses) {
    if (seenIds.has(c.id)) {
      log.warn("classes", `Duplicate ID "${c.id}" for class "${c.name}"`, summary);
      let n = 2;
      while (seenIds.has(`${c.id}-${n}`)) n++;
      c.id = `${c.id}-${n}`;
    }
    seenIds.add(c.id);
  }

  allClasses.sort((a, b) => {
    const typeOrder = { base: 0, advanced: 1, hybrid: 2 };
    return typeOrder[a.type] - typeOrder[b.type] || a.name.localeCompare(b.name);
  });

  writeJsonOutput("classes.json", allClasses);
  log.info("classes", `Wrote ${allClasses.length} classes to data/classes.json`);
  printSummary(summary);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseClasses().catch(console.error);
}
