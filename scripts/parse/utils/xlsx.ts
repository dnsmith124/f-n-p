import * as XLSX from "xlsx";
import { existsSync } from "fs";

export type CellValue = string | number | null;

export function loadWorkbook(path: string): XLSX.WorkBook | null {
  if (!existsSync(path)) return null;
  return XLSX.readFile(path);
}

export function sheetToUnmergedGrid(sheet: XLSX.WorkSheet): CellValue[][] {
  const raw = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    defval: null,
  });

  const grid: CellValue[][] = raw.map((row) => [...row]);

  const merges = sheet["!merges"] ?? [];
  for (const merge of merges) {
    const val = grid[merge.s.r]?.[merge.s.c] ?? null;
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      if (!grid[r]) grid[r] = [];
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        grid[r][c] = val;
      }
    }
  }

  return grid;
}

export function findRowByLabel(
  grid: CellValue[][],
  label: string | RegExp,
  col?: number
): number {
  for (let r = 0; r < grid.length; r++) {
    const cols = col !== undefined ? [col] : grid[r]?.keys() ?? [];
    for (const c of cols) {
      const cell = cellToString(grid[r]?.[c]);
      if (!cell) continue;
      if (typeof label === "string") {
        if (cell.toLowerCase().includes(label.toLowerCase())) return r;
      } else {
        if (label.test(cell)) return r;
      }
    }
  }
  return -1;
}

export function findColumnByLabel(
  grid: CellValue[][],
  label: string | RegExp,
  row?: number
): number {
  const rows = row !== undefined ? [row] : [0, 1, 2, 3, 4];
  for (const r of rows) {
    if (!grid[r]) continue;
    for (let c = 0; c < grid[r].length; c++) {
      const cell = cellToString(grid[r][c]);
      if (!cell) continue;
      if (typeof label === "string") {
        if (cell.toLowerCase().includes(label.toLowerCase())) return c;
      } else {
        if (label.test(cell)) return c;
      }
    }
  }
  return -1;
}

export function extractBlock(
  grid: CellValue[][],
  startRow: number,
  startCol: number,
  endRow?: number,
  endCol?: number
): CellValue[][] {
  const eRow = endRow ?? grid.length;
  const block: CellValue[][] = [];
  for (let r = startRow; r < eRow && r < grid.length; r++) {
    const row = grid[r] ?? [];
    const eCol = endCol ?? row.length;
    block.push(row.slice(startCol, eCol));
  }
  return block;
}

export function extractTableWithHeaders(
  grid: CellValue[][],
  headerRow: number,
  startCol: number,
  endCol?: number,
  endRow?: number
): Record<string, CellValue>[] {
  const headers: string[] = [];
  const row = grid[headerRow] ?? [];
  const eCol = endCol ?? row.length;

  for (let c = startCol; c < eCol; c++) {
    const h = cellToString(row[c]);
    headers.push(h || `col_${c}`);
  }

  const results: Record<string, CellValue>[] = [];
  const eRow = endRow ?? grid.length;

  for (let r = headerRow + 1; r < eRow && r < grid.length; r++) {
    const dataRow = grid[r] ?? [];
    const hasData = dataRow
      .slice(startCol, eCol)
      .some((v) => v !== null && v !== undefined && String(v).trim() !== "");
    if (!hasData) continue;

    const record: Record<string, CellValue> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = dataRow[startCol + i] ?? null;
    }
    results.push(record);
  }

  return results;
}

export function cellToString(value: CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function cellToNumber(value: CellValue | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = parseFloat(String(value).trim());
  return isNaN(n) ? 0 : n;
}

export function getDataSheetNames(
  workbook: XLSX.WorkBook,
  skipPatterns: (string | RegExp)[] = []
): string[] {
  return workbook.SheetNames.filter((name) => {
    const lower = name.toLowerCase();
    return !skipPatterns.some((p) =>
      typeof p === "string" ? lower.includes(p.toLowerCase()) : p.test(name)
    );
  });
}
