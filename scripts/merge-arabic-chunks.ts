/**
 * Merge Arabic translation chunk files into providers-scraped.json.
 * Adds descriptionAr and reviewSummaryAr to each provider.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const CHUNKS_DIR = join(process.cwd(), "scripts/arabic-chunks");

function main() {
  const providers = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Loaded ${providers.length} providers`);

  const chunkFiles = readdirSync(CHUNKS_DIR).filter((f) => f.startsWith("ar-") && f.endsWith(".json")).sort();
  console.log(`Found ${chunkFiles.length} Arabic chunk files`);

  let merged = 0;
  for (const file of chunkFiles) {
    const chunk = JSON.parse(readFileSync(join(CHUNKS_DIR, file), "utf-8"));
    let fileMerged = 0;
    for (const [indexStr, data] of Object.entries(chunk)) {
      const idx = parseInt(indexStr);
      if (idx < 0 || idx >= providers.length) continue;
      const ar = data as { descriptionAr?: string; reviewSummaryAr?: string[] };
      if (ar.descriptionAr) providers[idx].descriptionAr = ar.descriptionAr;
      if (ar.reviewSummaryAr?.length) providers[idx].reviewSummaryAr = ar.reviewSummaryAr;
      fileMerged++;
    }
    merged += fileMerged;
    console.log(`  ${file}: ${fileMerged} merged`);
  }

  let withAr = 0, withArReview = 0;
  for (const p of providers) {
    if (p.descriptionAr) withAr++;
    if (p.reviewSummaryAr?.length) withArReview++;
  }

  console.log(`\n=== Merge complete ===`);
  console.log(`Total merged: ${merged}`);
  console.log(`With descriptionAr: ${withAr} / ${providers.length}`);
  console.log(`With reviewSummaryAr: ${withArReview} / ${providers.length}`);

  writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
  console.log(`Saved to ${PROVIDERS_PATH}`);
}

main();
