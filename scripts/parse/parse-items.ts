import {
  loadWorkbook,
  sheetToUnmergedGrid,
  cellToString,
  cellToNumber,
  getDataSheetNames,
  findRowByLabel,
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

function findSectionHeaders(
  grid: CellValue[][],
  startCol: number,
  maxRow: number
): { row: number; label: string }[] {
  const headers: { row: number; label: string }[] = [];
  const headerPatterns = [
    /melee weapon/i, /ranged weapon/i, /channeling weapon/i,
    /offhand item/i, /shield/i,
    /supply item/i, /^tools$/i, /combat tool/i,
    /main armor/i, /additional armor/i,
    /helmet/i, /glove/i, /gauntlet/i, /footwear/i, /leg armor/i,
    /parallel melee/i, /parallel ranged/i,
  ];

  for (let r = 0; r < maxRow && r < grid.length; r++) {
    const cell = cellToString(grid[r]?.[startCol]);
    if (!cell) continue;
    if (headerPatterns.some((p) => p.test(cell))) {
      headers.push({ row: r, label: cell });
    }
  }
  return headers;
}

function parseWeaponSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string,
  subcategory: string,
  summary: ParseSummary,
  sheetName: string,
  hasRareAttr: boolean = false
): ItemData[] {
  const items: ItemData[] = [];
  const colOffset = hasRareAttr ? 1 : 0;

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "weapon",
      subcategory,
      rarity,
      damage: str(grid[r]?.[1 + (hasRareAttr ? 1 : 0)]),
      damageType: str(grid[r]?.[2 + (hasRareAttr ? 1 : 0)]),
      training: str(grid[r]?.[3 + (hasRareAttr ? 1 : 0)]),
      grip: str(grid[r]?.[4 + (hasRareAttr ? 1 : 0)]),
      attribute: str(grid[r]?.[5 + (hasRareAttr ? 1 : 0)]),
    };

    if (hasRareAttr) {
      item.rareAttribute = str(grid[r]?.[6 + colOffset]);
      item.range = str(grid[r]?.[7 + colOffset]);
      item.material = str(grid[r]?.[8 + colOffset]);
      item.weight = num(grid[r]?.[9 + colOffset]);
      item.guard = str(grid[r]?.[10 + colOffset]);
      item.value = num(grid[r]?.[11 + colOffset]);
    } else {
      item.range = str(grid[r]?.[6]);
      item.material = str(grid[r]?.[7]);
      item.weight = num(grid[r]?.[8]);
      item.guard = str(grid[r]?.[9]);
      item.value = num(grid[r]?.[10]);
    }

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

    if (isReload) {
      item.reload = str(grid[r]?.[9]);
    } else {
      item.guard = str(grid[r]?.[9]);
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
  startCol: number,
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];
  const hdr = grid[headerRow] || [];

  const hasMatCol = cellToString(hdr[startCol + 6]).toLowerCase().includes("material");
  const typeCol = hasMatCol ? startCol + 7 : startCol + 7;
  const wgtCol = hasMatCol ? startCol + 8 : startCol + 8;
  const valCol = hasMatCol ? startCol + 9 : startCol + 9;

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[startCol]);
    if (!name) continue;

    const effectStr = str(grid[r]?.[startCol + 1]);
    const typeStr = str(grid[r]?.[startCol + 7]);
    const materialStr = hasMatCol ? str(grid[r]?.[startCol + 6]) : undefined;

    const item: ItemData = {
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
    };

    items.push(item);
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

    const item: ItemData = {
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
    };

    items.push(item);
  }
  return items;
}

function parseShieldSection(
  grid: CellValue[][],
  headerRow: number,
  endRow: number,
  rarity: string
): ItemData[] {
  const items: ItemData[] = [];

  for (let r = headerRow + 1; r < endRow && r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "shield",
      subcategory: "shield",
      rarity,
      blockRoll: str(grid[r]?.[1]),
      durability: str(grid[r]?.[2]),
      bashDmg: str(grid[r]?.[3]),
      parry: str(grid[r]?.[4]),
      blockBonus: str(grid[r]?.[5]),
      material: str(grid[r]?.[7]),
      weight: num(grid[r]?.[8]),
      training: str(grid[r]?.[9]),
      value: num(grid[r]?.[10]),
    };

    items.push(item);
  }
  return items;
}

function parseCardItems(
  grid: CellValue[][],
  category: string,
  rarity: string,
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];
  const COLS = [0, 3, 6, 9, 12, 15, 18];

  for (let r = 3; r < grid.length; r++) {
    for (const col of COLS) {
      const name = str(grid[r]?.[col]);
      if (!name) continue;
      if (name.toLowerCase().includes("charges:") || name.toLowerCase() === "description / lore") continue;

      const chargeRow = grid[r + 1];
      const chargesVal = str(chargeRow?.[col + 1]);
      const descParts: string[] = [];
      for (let dr = r + 2; dr < Math.min(r + 8, grid.length); dr++) {
        const dv = str(grid[dr]?.[col]);
        if (!dv) break;
        if (dv.toLowerCase() === "charges:" || dv.toLowerCase().includes("description / lore")) break;
        descParts.push(dv);
      }

      const item: ItemData = {
        id: "",
        name: normalizeWhitespace(name),
        category,
        subcategory: category,
        rarity,
        charges: chargesVal || undefined,
        description: descParts.length > 0 ? cleanDescription(descParts.join(" ")) : undefined,
      };

      const typeVal = str(chargeRow?.[col + 2]);
      if (typeVal) item.type = typeVal;

      items.push(item);
    }

    const nextHeaderRow = grid[r + 8];
    if (nextHeaderRow) {
      const hasNextItem = COLS.some((c) => {
        const v = str(grid[r + 8]?.[c]);
        return v && !v.toLowerCase().includes("charges");
      });
      if (hasNextItem) r += 7;
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function parseModsSection(
  grid: CellValue[][],
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];

  const leftEnd = findNextEmptyCol(grid, 2, 0);
  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[0]);
    if (!title) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(title),
      category: "mod",
      subcategory: "weapon-mod",
      rarity: "n/a",
      effect: str(grid[r]?.[1]) ? cleanDescription(cellToString(grid[r]?.[1])) : undefined,
      value: num(grid[r]?.[3]),
      material: str(grid[r]?.[4]),
    };
    items.push(item);
  }

  for (let r = 3; r < grid.length; r++) {
    const title = str(grid[r]?.[7]);
    if (!title) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(title),
      category: "mod",
      subcategory: "enchantment",
      rarity: "n/a",
      effect: str(grid[r]?.[8]) ? cleanDescription(cellToString(grid[r]?.[8])) : undefined,
      value: num(grid[r]?.[10]),
      description: str(grid[r]?.[12]) || undefined,
    };
    items.push(item);
  }

  return items;
}

function parseFoodSection(
  grid: CellValue[][],
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "food",
      subcategory: str(grid[r]?.[3]) || "common",
      rarity: str(grid[r]?.[3]) || "common",
      effect: str(grid[r]?.[4]) ? cleanDescription(cellToString(grid[r]?.[4])) : undefined,
      value: num(grid[r]?.[2]),
    };
    items.push(item);
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[10]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "food",
      subcategory: str(grid[r]?.[13]) || "common",
      rarity: str(grid[r]?.[13]) || "common",
      effect: str(grid[r]?.[14]) ? cleanDescription(cellToString(grid[r]?.[14])) : undefined,
      value: num(grid[r]?.[12]),
    };
    items.push(item);
  }

  return items;
}

function parseCraftingSection(
  grid: CellValue[][],
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[0]);
    if (!name) continue;
    if (name === name.toUpperCase() && !name.match(/\d/)) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "recipe",
      rarity: str(grid[r]?.[1]) || "common",
      material: [str(grid[r]?.[2]), str(grid[r]?.[3])].filter(Boolean).join(" + ") || undefined,
    };
    items.push(item);
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[5]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "material",
      rarity: str(grid[r]?.[7]) || "common",
      value: num(grid[r]?.[6]),
    };
    items.push(item);
  }

  for (let r = 3; r < grid.length; r++) {
    const name = str(grid[r]?.[13]);
    if (!name) continue;

    const item: ItemData = {
      id: "",
      name: normalizeWhitespace(name),
      category: "crafting",
      subcategory: "ingredient",
      rarity: str(grid[r]?.[15]) || "common",
      value: num(grid[r]?.[14]),
      description: str(grid[r]?.[17]) || undefined,
    };
    items.push(item);
  }

  return items;
}

function findNextEmptyCol(grid: CellValue[][], row: number, startCol: number): number {
  const r = grid[row] || [];
  for (let c = startCol; c < r.length; c++) {
    if (r[c] === null || r[c] === undefined || String(r[c]).trim() === "") return c;
  }
  return r.length;
}

function findSectionEnd(
  grid: CellValue[][],
  startRow: number,
  col: number,
  maxRow: number
): number {
  for (let r = startRow + 1; r < maxRow && r < grid.length; r++) {
    const cell = cellToString(grid[r]?.[col]);
    if (!cell) {
      let allEmpty = true;
      for (let check = r; check < Math.min(r + 3, grid.length); check++) {
        if (cellToString(grid[check]?.[col])) { allEmpty = false; break; }
      }
      if (allEmpty) return r;
    }
  }
  return Math.min(maxRow, grid.length);
}

function parseGearSheet(
  grid: CellValue[][],
  rarity: string,
  summary: ParseSummary,
  sheetName: string
): ItemData[] {
  const items: ItemData[] = [];
  const isRare = rarity === "rare";
  const isParallel = rarity === "parallel";
  const hasExtraCol = isRare || isParallel;

  const leftHeaders: { row: number; label: string; subcategory: string }[] = [];
  const rightHeaders: { row: number; label: string; subcategory: string; category: string }[] = [];

  for (let r = 2; r < Math.min(200, grid.length); r++) {
    const leftCell = cellToString(grid[r]?.[0])?.toLowerCase() || "";
    if (leftCell.includes("melee weapon") || leftCell.includes("parallel melee")) {
      leftHeaders.push({ row: r, label: cellToString(grid[r]?.[0]), subcategory: "melee" });
    } else if (leftCell.includes("ranged weapon") || leftCell.includes("parallel ranged")) {
      leftHeaders.push({ row: r, label: cellToString(grid[r]?.[0]), subcategory: "ranged" });
    } else if (leftCell.includes("channeling")) {
      leftHeaders.push({ row: r, label: cellToString(grid[r]?.[0]), subcategory: "channeling" });
    } else if (leftCell.includes("offhand") || leftCell.includes("shield")) {
      if (cellToString(grid[r]?.[1])?.toLowerCase().includes("block") ||
          cellToString(grid[r]?.[1])?.toLowerCase().includes("dmg")) {
        leftHeaders.push({ row: r, label: cellToString(grid[r]?.[0]), subcategory: "shield" });
      }
    }

    const rightStartCol = isParallel ? 14 : 12;
    const rightCell = cellToString(grid[r]?.[rightStartCol])?.toLowerCase() || "";
    if (rightCell.includes("supply")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "supply", category: "supply" });
    } else if (rightCell === "tools") {
      rightHeaders.push({ row: r, label: "Tools", subcategory: "tool", category: "supply" });
    } else if (rightCell.includes("combat tool")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "combat-tool", category: "supply" });
    } else if (rightCell.includes("main armor") || rightCell.includes("armor item")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "body-armor", category: "armor" });
    } else if (rightCell.includes("additional armor")) {
      // skip label row
    } else if (rightCell.includes("helmet")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "helmet", category: "armor" });
    } else if (rightCell.includes("glove") || rightCell.includes("gauntlet")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "gloves", category: "armor" });
    } else if (rightCell.includes("footwear") || rightCell.includes("leg armor")) {
      rightHeaders.push({ row: r, label: cellToString(grid[r]?.[rightStartCol]), subcategory: "footwear", category: "armor" });
    }
  }

  for (let i = 0; i < leftHeaders.length; i++) {
    const h = leftHeaders[i];
    const nextRow = leftHeaders[i + 1]?.row ?? grid.length;

    if (h.subcategory === "shield") {
      items.push(...parseShieldSection(grid, h.row, nextRow, rarity));
    } else if (hasExtraCol) {
      items.push(...parseWeaponSection(grid, h.row, nextRow, rarity, h.subcategory, summary, sheetName, true));
    } else {
      items.push(...parseCommonWeaponSection(grid, h.row, nextRow, rarity, h.subcategory));
    }
  }

  const rightStartCol = isParallel ? 14 : 12;
  for (let i = 0; i < rightHeaders.length; i++) {
    const h = rightHeaders[i];
    const nextRow = rightHeaders[i + 1]?.row ?? grid.length;

    if (h.category === "armor") {
      items.push(...parseArmorSection(grid, h.row, nextRow, rarity, rightStartCol, h.subcategory));
    } else {
      items.push(...parseSupplySection(grid, h.row, nextRow, rarity, rightStartCol, summary, sheetName));
    }
  }

  return items;
}

export async function parseItems(): Promise<ParseSummary> {
  const summary = createSummary("items");
  const path = resolveProjectPath("source-docs", "ITEMS.xlsx");
  const wb = loadWorkbook(path);

  if (!wb) {
    log.error("items", `File not found: ${path}`, summary);
    printSummary(summary);
    return summary;
  }

  const allItems: ItemData[] = [];
  const existingIds = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    log.info("items", `Parsing sheet: ${sheetName}`);
    const sheet = wb.Sheets[sheetName];
    const grid = sheetToUnmergedGrid(sheet);
    const rarity = RARITY_MAP[sheetName.toLowerCase()] || "common";

    let sheetItems: ItemData[] = [];

    try {
      const lowerName = sheetName.toLowerCase();

      if (lowerName.includes("gear") && !lowerName.includes("legendary")) {
        sheetItems = parseGearSheet(grid, rarity, summary, sheetName);
      } else if (lowerName.includes("legendary")) {
        sheetItems = parseCardItems(grid, "legendary-weapon", "legendary", summary, sheetName);
      } else if (lowerName.includes("ring")) {
        sheetItems = parseCardItems(grid, "ring", "rare", summary, sheetName);
      } else if (lowerName.includes("artifact")) {
        sheetItems = parseCardItems(grid, "artifact", "rare", summary, sheetName);
      } else if (lowerName.includes("mod") || lowerName.includes("enchant")) {
        sheetItems = parseModsSection(grid, summary, sheetName);
      } else if (lowerName.includes("food") || lowerName.includes("material")) {
        sheetItems = parseFoodSection(grid, summary, sheetName);
      } else if (lowerName.includes("craft")) {
        sheetItems = parseCraftingSection(grid, summary, sheetName);
      } else {
        log.warn("items", `Sheet "${sheetName}": unknown layout, skipping`, summary, sheetName);
        summary.skipped++;
        summary.skippedSheets.push(sheetName);
        continue;
      }

      for (const item of sheetItems) {
        if (!item.name) {
          log.warn("items", `Sheet "${sheetName}": item with empty name, skipping`, summary, sheetName);
          continue;
        }
        if (item.name === item.name.toUpperCase() && item.name.length > 3) {
          item.name = toTitleCase(item.name);
        }
        if (item.subcategory) {
          item.subcategory = item.subcategory.toLowerCase().replace(/\.$/, "").trim();
          if (item.subcategory === "uncomm") item.subcategory = "uncommon";
        }
        if (item.rarity) {
          item.rarity = item.rarity.toLowerCase().replace(/\.$/, "").trim();
          if (item.rarity === "uncomm") item.rarity = "uncommon";
        }
        const baseId = toKebabId(`${rarity}-${item.name}`);
        item.id = deduplicateId(baseId, existingIds);
        existingIds.add(item.id);
      }

      log.info("items", `  Found ${sheetItems.length} items`);
      allItems.push(...sheetItems);
      summary.parsed += sheetItems.length;
    } catch (err) {
      log.error("items", `Sheet "${sheetName}": parse error: ${err}`, summary);
      summary.skipped++;
      summary.skippedSheets.push(sheetName);
    }
  }

  const cleaned = allItems.map((item) => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      if (value !== undefined && value !== null && value !== "") {
        result[key] = value;
      }
    }
    return result;
  });

  writeJsonOutput("items.json", cleaned);
  log.info("items", `Wrote ${cleaned.length} items to data/items.json`);
  printSummary(summary);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseItems().catch(console.error);
}
