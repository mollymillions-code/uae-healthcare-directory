/**
 * Master Data Pipeline — Orchestrates all scraper sources
 *
 * Data Source Hierarchy (ranked by authority):
 *
 * Tier 1 — Official Licensed Registers (FREE, authoritative)
 *   1. DHA (Dubai Health Authority) — Dubai facilities
 *   2. DOH (Department of Health Abu Dhabi) — Abu Dhabi + Al Ain facilities
 *   3. MOHAP (Ministry of Health & Prevention) — Sharjah, Ajman, RAK, Fujairah, UAQ
 *
 * Tier 2 — Enrichment (FREE tier)
 *   4. Google Places API — ratings, reviews, photos, place_id, operating hours
 *      (Free: $200/month credit covers ~11,000 Place Details requests)
 *
 * Tier 3 — Manual Curation
 *   5. Clinic self-service claims — owners update their own info
 *
 * Pipeline Flow:
 *   Scrape DHA/DOH/MOHAP → Deduplicate → Map to categories → Geocode → Enrich with Google → Store
 */

import { scrapeDHAFacilities, transformDHAFacilities } from "./dha-scraper";
import { scrapeAllListings, transformToProviders } from "./mohap-scraper";
import { slugify } from "../helpers";

interface ScrapedProvider {
  name: string;
  nameAr?: string;
  citySlug: string;
  areaSlug?: string | null;
  categorySlug: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  licenseNumber?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Run the full scraping pipeline
 */
export async function runPipeline() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  UAE Open Healthcare Directory — Data Pipeline");
  console.log("═══════════════════════════════════════════════════════\n");

  // Step 1: Scrape all sources
  console.log("Step 1: Scraping official registers...\n");

  const [dhaRaw, mohapListings] = await Promise.all([
    scrapeDHAFacilities(),
    scrapeAllListings(1, 5), // Start with 5 pages for testing
  ]);

  console.log(`\n  DHA:   ${dhaRaw.length} facilities`);
  console.log(`  MOHAP: ${mohapListings.length} listings`);

  // Step 2: Transform to our format
  console.log("\nStep 2: Transforming data...\n");

  const dhaProviders = transformDHAFacilities(dhaRaw);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mohapProviders = transformToProviders(mohapListings as any);

  const allProviders: ScrapedProvider[] = [
    ...dhaProviders,
    ...mohapProviders,
  ];

  console.log(`  Total active providers: ${allProviders.length}`);

  // Step 3: Deduplicate (by name + city, fuzzy)
  console.log("\nStep 3: Deduplicating...\n");

  const deduped = deduplicateProviders(allProviders);
  console.log(`  After dedup: ${deduped.length} unique providers`);

  // Step 4: Generate slugs
  console.log("\nStep 4: Generating slugs...\n");

  const withSlugs = deduped.map((p) => ({
    ...p,
    slug: `${slugify(p.name)}-${p.citySlug}`,
  }));

  // Step 5: Enrich with Google (optional, requires API key)
  // This step would:
  // - Search Google Places for each provider by name + address
  // - Get place_id, rating, review_count, photos, operating_hours
  // - Match by name similarity to avoid false positives

  console.log("\nStep 5: Google enrichment (skipped — requires API key)\n");

  // Step 6: Output summary
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Pipeline complete. ${withSlugs.length} providers ready for import.`);
  console.log("═══════════════════════════════════════════════════════\n");

  // Group by city
  const byCityCount: Record<string, number> = {};
  for (const p of withSlugs) {
    byCityCount[p.citySlug] = (byCityCount[p.citySlug] || 0) + 1;
  }
  console.log("  By city:");
  for (const [city, count] of Object.entries(byCityCount).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${city}: ${count}`);
  }

  // Group by category
  const byCatCount: Record<string, number> = {};
  for (const p of withSlugs) {
    byCatCount[p.categorySlug] = (byCatCount[p.categorySlug] || 0) + 1;
  }
  console.log("\n  By category:");
  for (const [cat, count] of Object.entries(byCatCount).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count}`);
  }

  return withSlugs;
}

/**
 * Deduplicate providers by normalized name + city
 */
function deduplicateProviders(providers: ScrapedProvider[]): ScrapedProvider[] {
  const seen = new Map<string, ScrapedProvider>();

  for (const p of providers) {
    const key = `${normalizeName(p.name)}::${p.citySlug}`;
    if (!seen.has(key)) {
      seen.set(key, p);
    } else {
      // Merge: prefer the entry with more data
      const existing = seen.get(key)!;
      seen.set(key, {
        ...existing,
        phone: existing.phone || p.phone,
        email: existing.email || p.email,
        website: existing.website || p.website,
        nameAr: existing.nameAr || p.nameAr,
        licenseNumber: existing.licenseNumber || p.licenseNumber,
        latitude: existing.latitude || p.latitude,
        longitude: existing.longitude || p.longitude,
      });
    }
  }

  return Array.from(seen.values());
}

/**
 * Normalize facility name for deduplication
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    // Remove common suffixes
    .replace(/\s*(llc|fz|fze|l\.l\.c|branch|br)\s*$/i, "")
    .trim();
}

// Run if executed directly
if (require.main === module) {
  runPipeline().catch(console.error);
}
