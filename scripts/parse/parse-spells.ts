import {
  loadWorkbook,
  sheetToUnmergedGrid,
  cellToString,
  cellToNumber,
  type CellValue,
} from "./utils/xlsx";
import { toKebabId, normalizeWhitespace, cleanDescription } from "./utils/strings";
import {
  resolveProjectPath,
  writeJsonOutput,
  log,
  createSummary,
  printSummary,
  type ParseSummary,
} from "./utils/io";

interface SpellData {
  id: string;
  name: string;
  school: string;
  tier: string;
  castCost: number;
  spellMemoryCost: number;
  effect: string;
  dmgType: string;
  range: string;
  area: string;
  additionalEffects: string;
  description: string;
}

const TIER_MAP: Record<string, string> = {
  "1": "novice",
  "2": "advanced",
  "3": "master",
};

function parseSchoolName(sheetName: string): { school: string; tier: string } {
  const match = sheetName.match(/^(.+?)\s*\((\d)\)$/);
  if (match) {
    return {
      school: toKebabId(match[1].trim()),
      tier: TIER_MAP[match[2]] || match[2],
    };
  }

  if (sheetName.toLowerCase().includes("equipment")) {
    return { school: "equipment", tier: "none" };
  }
  if (sheetName.toLowerCase().includes("divine")) {
    return { school: "divine", tier: "none" };
  }

  return { school: toKebabId(sheetName), tier: "none" };
}

function extractSpellMemoryCost(grid: CellValue[][]): number {
  const headerText = cellToString(grid[0]?.[3]) || "";
  const match = headerText.match(/(\d+)\s*SPELL\s*MEM/i);
  return match ? parseInt(match[1], 10) : 1;
}

function parseSpellSheet(
  grid: CellValue[][],
  sheetName: string,
  summary: ParseSummary
): SpellData[] {
  const spells: SpellData[] = [];
  const { school, tier } = parseSchoolName(sheetName);
  const spellMemoryCost = extractSpellMemoryCost(grid);

  for (let r = 2; r < grid.length; r++) {
    const name = cellToString(grid[r]?.[0]);
    if (!name) continue;

    const castLabel = cellToString(grid[r]?.[1]);
    if (castLabel?.toUpperCase() !== "CAST") continue;

    const dataRow = r + 1;
    if (dataRow >= grid.length) break;

    const castCost = cellToNumber(grid[dataRow]?.[1]);
    const effect = cellToString(grid[dataRow]?.[3]);
    const dmgType = cellToString(grid[dataRow]?.[4]);
    const range = cellToString(grid[dataRow]?.[5]);
    const area = cellToString(grid[dataRow]?.[6]);
    const additionalEffects = cellToString(grid[r]?.[8]);
    const description = cellToString(grid[r]?.[13]);

    if (!name || name === name.toLowerCase()) continue;
    if (name.toUpperCase() === "SPELL NAME" || name.toUpperCase() === "NAME") continue;

    const spell: SpellData = {
      id: toKebabId(`${school}-${tier.substring(0, 3)}-${name}`),
      name: normalizeWhitespace(name),
      school,
      tier,
      castCost,
      spellMemoryCost,
      effect: effect || "",
      dmgType: dmgType || "-",
      range: range || "",
      area: area || "",
      additionalEffects: additionalEffects ? cleanDescription(additionalEffects) : "",
      description: description ? cleanDescription(description) : "",
    };

    spells.push(spell);
  }

  return spells;
}

export async function parseSpells(): Promise<ParseSummary> {
  const summary = createSummary("spells");
  const path = resolveProjectPath("source-docs", "MAGIC.xlsx");
  const wb = loadWorkbook(path);

  if (!wb) {
    log.error("spells", `File not found: ${path}`, summary);
    printSummary(summary);
    return summary;
  }

  const allSpells: SpellData[] = [];
  const existingIds = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    log.info("spells", `Parsing sheet: ${sheetName}`);
    const sheet = wb.Sheets[sheetName];
    const grid = sheetToUnmergedGrid(sheet);

    try {
      const spells = parseSpellSheet(grid, sheetName, summary);

      for (const spell of spells) {
        if (existingIds.has(spell.id)) {
          log.warn("spells", `Duplicate ID "${spell.id}", deduplicating`, summary, sheetName);
          let n = 2;
          while (existingIds.has(`${spell.id}-${n}`)) n++;
          spell.id = `${spell.id}-${n}`;
        }
        existingIds.add(spell.id);
      }

      allSpells.push(...spells);
      summary.parsed += spells.length;
      log.info("spells", `  Found ${spells.length} spells`);
    } catch (err) {
      log.error("spells", `Sheet "${sheetName}": parse error: ${err}`, summary);
      summary.skipped++;
      summary.skippedSheets.push(sheetName);
    }
  }

  writeJsonOutput("spells.json", allSpells);
  log.info("spells", `Wrote ${allSpells.length} spells to data/spells.json`);
  printSummary(summary);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseSpells().catch(console.error);
}
