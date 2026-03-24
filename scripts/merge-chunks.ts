/**
 * Merge all enrichment chunk files into providers-scraped.json.
 * Chunk files take priority over existing data in the main file.
 *
 * Usage: npx tsx scripts/merge-chunks.ts
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const PROVIDERS_PATH = join(process.cwd(), "src/lib/providers-scraped.json");
const CHUNKS_DIR = join(process.cwd(), "scripts/enrichment-chunks");

function main() {
  const providers = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  console.log(`Loaded ${providers.length} providers from main file`);

  // Read all chunk files
  const chunkFiles = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith(".json")).sort();
  console.log(`Found ${chunkFiles.length} chunk files`);

  let totalMerged = 0;
  let totalSkipped = 0;

  for (const file of chunkFiles) {
    const chunkPath = join(CHUNKS_DIR, file);
    const chunk = JSON.parse(readFileSync(chunkPath, "utf-8"));
    const entries = Object.entries(chunk);
    let merged = 0;

    for (const [indexStr, data] of entries) {
      const idx = parseInt(indexStr);
      if (idx < 0 || idx >= providers.length) {
        totalSkipped++;
        continue;
      }

      const enrichment = data as { description?: string; reviewSummary?: string[] };

      if (enrichment.description && enrichment.description.length > 30) {
        providers[idx].description = enrichment.description;
      }
      if (enrichment.reviewSummary && Array.isArray(enrichment.reviewSummary) && enrichment.reviewSummary.length > 0) {
        providers[idx].reviewSummary = enrichment.reviewSummary;
      }
      merged++;
    }

    totalMerged += merged;
    console.log(`  ${file}: ${merged} merged`);
  }

  // Verify coverage
  let withDesc = 0, withReview = 0, missing = 0;
  const missingIndices: number[] = [];

  for (let i = 0; i < providers.length; i++) {
    if (providers[i].reviewSummary?.length > 0) withReview++;
    if (providers[i].description && !providers[i].description.includes("Licensed by") && providers[i].description.length > 50) withDesc++;
    else {
      missing++;
      if (missingIndices.length < 20) missingIndices.push(i);
    }
  }

  console.log(`\n=== Merge complete ===`);
  console.log(`Total merged from chunks: ${totalMerged}`);
  console.log(`Skipped (out of range): ${totalSkipped}`);
  console.log(`With enriched description: ${withDesc} / ${providers.length}`);
  console.log(`With reviewSummary: ${withReview} / ${providers.length}`);
  console.log(`Still missing enrichment: ${missing}`);
  if (missingIndices.length > 0) {
    console.log(`First missing indices: ${missingIndices.join(", ")}`);
  }

  // Write back
  writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
  console.log(`\nSaved to ${PROVIDERS_PATH}`);
}

main();
