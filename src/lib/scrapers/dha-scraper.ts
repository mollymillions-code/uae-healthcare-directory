/**
 * DHA (Dubai Health Authority) Facility Scraper
 *
 * Sources:
 * 1. DHA Medical Registry: https://www.dha.gov.ae/en/medical-listing/facilities
 * 2. Sheryan REST API: POST /RestService/rest/retrieve/medicaldirectoryfacilitysearch
 *
 * Architecture:
 * - Uses agent-browser CLI for headed Chromium
 * - Scrapes the DHA medical registry facility listing
 * - Stores raw HTML + parsed JSON separately
 * - Random delays (2-5s) between requests
 * - Resume support via progress files
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://www.dha.gov.ae/en/medical-listing/facilities";
const RAW_DIR = path.resolve("data/raw/dha");
const PARSED_DIR = path.resolve("data/parsed");

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DHAFacilityListing {
  name: string;
  nameAr?: string;
  facilityType: string;
  licenseNumber?: string;
  area?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  detailUrl?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function randomDelay(minMs = 2000, maxMs = 5000): void {
  const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  execSync(`sleep ${delay / 1000}`);
}

function runBrowser(command: string): string {
  try {
    return execSync(`agent-browser ${command}`, {
      encoding: "utf-8",
      timeout: 30000,
    }).trim();
  } catch (e: unknown) {
    const error = e as { stderr?: string; message?: string };
    console.error(`  Browser error: ${error.stderr || error.message}`);
    return "";
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── DHA Scraper ───────────────────────────────────────────────────────────────

/**
 * Scrape DHA facility listing page.
 *
 * The DHA medical registry uses AJAX-based loading with the Sheryan REST API.
 * We navigate to the page, wait for data to load, then extract.
 */
export async function scrapeDHAFacilities(): Promise<DHAFacilityListing[]> {
  console.log("🏥 DHA Facility Scraper");
  console.log(`  Source: ${BASE_URL}\n`);

  ensureDir(RAW_DIR);
  ensureDir(PARSED_DIR);

  // Open the DHA medical listing page
  runBrowser(`open "${BASE_URL}"`);
  randomDelay(5000, 8000); // DHA page loads slowly

  // Try to set items per page to 100
  const selectResult = runBrowser(`eval '
    (() => {
      // Find the items-per-page selector
      const selects = document.querySelectorAll("select");
      for (const sel of selects) {
        const options = Array.from(sel.options);
        const has100 = options.find(o => o.value === "100" || o.text === "100");
        if (has100) {
          sel.value = has100.value;
          sel.dispatchEvent(new Event("change", {bubbles: true}));
          return "Set to 100 items per page";
        }
      }
      return "Could not find items-per-page selector";
    })()'`);

  console.log(`  ${selectResult}`);
  randomDelay(5000, 8000); // Wait for reload

  // Save raw HTML
  const rawHtml = runBrowser(`eval '(() => document.documentElement.outerHTML)()'`);
  if (rawHtml) {
    fs.writeFileSync(path.join(RAW_DIR, "dha_listing.html"), rawHtml);
  }

  // Extract facility data
  const allFacilities: DHAFacilityListing[] = [];
  let hasMore = true;
  let pageNum = 1;

  while (hasMore) {
    console.log(`  Extracting page ${pageNum}...`);

    const result = runBrowser(`eval '
      (() => {
        // Try multiple selectors for facility cards
        const cards = document.querySelectorAll("[class*=facility], [class*=card], .result-item, tr[class*=row]");
        const items = document.querySelectorAll("li, .list-item, [role=listitem]");
        const all = cards.length > 0 ? cards : items;

        const data = [];
        const allText = document.body.innerText;

        // Try to extract structured data
        const links = document.querySelectorAll("a[href*=facility], a[href*=medical]");
        for (const link of links) {
          const name = link.textContent?.trim();
          if (name && name.length > 3 && name.length < 200) {
            data.push({
              name,
              href: link.href,
              context: link.closest("div, li, tr")?.innerText?.replace(/\\n+/g, " | ")?.slice(0, 200)
            });
          }
        }

        // Get total count if visible
        const countMatch = allText.match(/(\\d+)\\s*(?:results|facilities|records)/i);

        return JSON.stringify({
          facilityCount: data.length,
          totalOnPage: countMatch?.[1] || "unknown",
          facilities: data.slice(0, 200)
        });
      })()'`);

    try {
      const parsed = JSON.parse(result);
      console.log(`  Found ${parsed.facilityCount} facilities on page ${pageNum}`);

      for (const f of parsed.facilities) {
        allFacilities.push({
          name: f.name,
          facilityType: extractType(f.context || ""),
          area: extractArea(f.context || ""),
          detailUrl: f.href,
        });
      }

      // Check for next page
      const hasNext = runBrowser(`eval '
        (() => {
          const next = document.querySelector("a[aria-label*=Next], .next-page, [class*=next]");
          return next ? "yes" : "no";
        })()'`);

      if (hasNext === '"yes"' && pageNum < 50) {
        runBrowser(`find text "Next" click`);
        randomDelay(3000, 6000);
        pageNum++;
      } else {
        hasMore = false;
      }
    } catch {
      console.error(`  Failed to parse DHA page ${pageNum}`);
      hasMore = false;
    }
  }

  // Save parsed data
  const outputFile = path.join(PARSED_DIR, "dha_all_listings.json");
  fs.writeFileSync(outputFile, JSON.stringify(allFacilities, null, 2));
  console.log(`\n✅ DHA: ${allFacilities.length} facilities saved to ${outputFile}`);

  runBrowser("close");
  return allFacilities;
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

function extractType(context: string): string {
  const lower = context.toLowerCase();
  if (lower.includes("hospital")) return "Hospital";
  if (lower.includes("dental")) return "Dental Clinic";
  if (lower.includes("pharmacy")) return "Pharmacy";
  if (lower.includes("clinic")) return "Clinic";
  if (lower.includes("laboratory") || lower.includes("lab")) return "Laboratory";
  if (lower.includes("center") || lower.includes("centre")) return "Medical Center";
  return "Healthcare Facility";
}

function extractArea(context: string): string | undefined {
  const areas = [
    "Jumeirah", "Dubai Marina", "Deira", "Bur Dubai", "Al Barsha",
    "JLT", "Downtown", "Business Bay", "Healthcare City", "DHCC",
    "Al Quoz", "Silicon Oasis", "Mirdif", "Al Karama", "Palm Jumeirah",
    "Al Nahda", "International City", "Al Rashidiya", "Al Satwa",
  ];
  for (const area of areas) {
    if (context.toLowerCase().includes(area.toLowerCase())) return area;
  }
  return undefined;
}

// ─── Category Mapping ──────────────────────────────────────────────────────────

const DHA_CATEGORY_MAP: Record<string, string> = {
  "Hospital": "hospitals",
  "Day Surgery Center": "hospitals",
  "Clinic": "clinics",
  "Polyclinic": "clinics",
  "Medical Center": "clinics",
  "Dental Clinic": "dental",
  "Pharmacy": "pharmacy",
  "Laboratory": "labs-diagnostics",
  "Diagnostic Center": "labs-diagnostics",
  "Radiology Center": "radiology-imaging",
  "Rehabilitation Center": "physiotherapy",
  "Home Healthcare": "home-healthcare",
  "Optical": "ophthalmology",
  "Healthcare Facility": "clinics",
};

export function transformDHAFacilities(facilities: DHAFacilityListing[]) {
  return facilities
    .filter((f) => f.name && f.name.length > 2)
    .map((f) => ({
      name: f.name,
      nameAr: f.nameAr,
      citySlug: "dubai" as const,
      areaSlug: f.area?.toLowerCase().replace(/\s+/g, "-"),
      categorySlug: DHA_CATEGORY_MAP[f.facilityType] || "clinics",
      address: f.address || "Dubai, UAE",
      phone: f.phone,
      email: f.email,
      website: f.website,
      licenseNumber: f.licenseNumber,
      licenseSource: "DHA" as const,
    }));
}

// ─── Main ──────────────────────────────────────────────────────────────────────

if (require.main === module) {
  scrapeDHAFacilities().catch(console.error);
}
