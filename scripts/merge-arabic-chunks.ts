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

  // Build a slug-to-index lookup for array-format chunks
  const slugToIndex = new Map<string, number>();
  for (let i = 0; i < providers.length; i++) {
    if (providers[i].slug) slugToIndex.set(providers[i].slug, i);
    if (providers[i].id) slugToIndex.set(providers[i].id, i);
  }

  let merged = 0;
  for (const file of chunkFiles) {
    const raw = JSON.parse(readFileSync(join(CHUNKS_DIR, file), "utf-8"));
    let fileMerged = 0;

    if (Array.isArray(raw)) {
      // Array format: [{id, descriptionAr, reviewSummaryAr}, ...]
      // Try to extract range from filename: ar-5000-5999.json -> offset 5000
      const rangeMatch = file.match(/ar-(\d+)-/);
      const offset = rangeMatch ? parseInt(rangeMatch[1]) : -1;

      for (let j = 0; j < raw.length; j++) {
        const item = raw[j] as { id?: string; descriptionAr?: string; reviewSummaryAr?: string[] };
        // Try index-based mapping first
        const idx = offset >= 0 ? offset + j : -1;
        if (idx >= 0 && idx < providers.length && item.descriptionAr) {
          providers[idx].descriptionAr = item.descriptionAr;
          if (item.reviewSummaryAr?.length) providers[idx].reviewSummaryAr = item.reviewSummaryAr;
          fileMerged++;
        } else if (item.id) {
          // Fallback: match by id/slug
          const lookupIdx = slugToIndex.get(item.id);
          if (lookupIdx !== undefined && item.descriptionAr) {
            providers[lookupIdx].descriptionAr = item.descriptionAr;
            if (item.reviewSummaryAr?.length) providers[lookupIdx].reviewSummaryAr = item.reviewSummaryAr;
            fileMerged++;
          }
        }
      }
    } else {
      // Dict format: {"index": {descriptionAr, reviewSummaryAr}, ...}
      for (const [indexStr, data] of Object.entries(raw)) {
        const idx = parseInt(indexStr);
        if (isNaN(idx) || idx < 0 || idx >= providers.length) continue;
        const ar = data as { descriptionAr?: string; reviewSummaryAr?: string[] };
        if (ar.descriptionAr) providers[idx].descriptionAr = ar.descriptionAr;
        if (ar.reviewSummaryAr?.length) providers[idx].reviewSummaryAr = ar.reviewSummaryAr;
        fileMerged++;
      }
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
