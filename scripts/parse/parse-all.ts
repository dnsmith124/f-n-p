import { parseClasses } from "./parse-classes";
import { parseItems } from "./parse-items";
import { parseTribes } from "./parse-tribes";
import { parseSpells } from "./parse-spells";
import type { ParseSummary } from "./utils/io";

async function main() {
  console.log("=== Parsing all source documents ===\n");

  const summaries: ParseSummary[] = [];

  summaries.push(await parseClasses());
  console.log();
  summaries.push(await parseItems());
  console.log();
  summaries.push(await parseTribes());
  console.log();
  summaries.push(await parseSpells());

  console.log("\n=== Parse Summary ===");
  for (const s of summaries) {
    const parts = [
      `${s.parsed} parsed`,
      `${s.skipped} skipped`,
      `${s.warnings} warnings`,
    ];
    if (s.errors > 0) parts.push(`${s.errors} errors`);
    console.log(`  ${s.parser.padEnd(10)} ${parts.join(", ")}`);
  }

  const totalErrors = summaries.reduce((n, s) => n + s.errors, 0);
  if (totalErrors > 0) {
    console.log(`\n⚠ ${totalErrors} error(s) encountered. Check output above.`);
    process.exit(1);
  }

  console.log("\n✓ All parsing complete");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
