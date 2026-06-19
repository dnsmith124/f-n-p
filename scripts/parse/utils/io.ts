import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../..");

export function resolveProjectPath(...segments: string[]): string {
  return resolve(PROJECT_ROOT, ...segments);
}

export function writeJsonOutput(filename: string, data: unknown): void {
  const path = resolveProjectPath("data", filename);
  const json = JSON.stringify(data, null, 2) + "\n";
  writeFileSync(path, json, "utf-8");
}

export interface ParseSummary {
  parser: string;
  parsed: number;
  skipped: number;
  warnings: number;
  errors: number;
  skippedSheets: string[];
  warningSheets: Map<string, number>;
}

export function createSummary(parser: string): ParseSummary {
  return {
    parser,
    parsed: 0,
    skipped: 0,
    warnings: 0,
    errors: 0,
    skippedSheets: [],
    warningSheets: new Map(),
  };
}

export const log = {
  info(parser: string, msg: string) {
    console.log(`[${parser}] ${msg}`);
  },
  warn(parser: string, msg: string, summary?: ParseSummary, sheet?: string) {
    console.log(`[${parser}] ⚠ ${msg}`);
    if (summary) {
      summary.warnings++;
      if (sheet) {
        summary.warningSheets.set(
          sheet,
          (summary.warningSheets.get(sheet) ?? 0) + 1
        );
      }
    }
  },
  error(parser: string, msg: string, summary?: ParseSummary) {
    console.error(`[${parser}] ✖ ${msg}`);
    if (summary) summary.errors++;
  },
};

export function printSummary(summary: ParseSummary): void {
  const { parser, parsed, skipped, warnings, skippedSheets, warningSheets } =
    summary;
  console.log(
    `[${parser}] ✓ Complete: ${parsed} parsed, ${skipped} skipped, ${warnings} warnings`
  );
  if (skippedSheets.length > 0) {
    console.log(`[${parser}]   Skipped sheets: ${skippedSheets.join(", ")}`);
  }
  if (warningSheets.size > 0) {
    const parts = Array.from(warningSheets.entries()).map(
      ([s, n]) => `${s} (${n})`
    );
    console.log(`[${parser}]   ⚠ Sheets with warnings: ${parts.join(", ")}`);
  }
}
