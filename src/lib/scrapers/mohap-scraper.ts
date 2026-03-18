/**
 * MOHAP (Ministry of Health and Prevention) Facility Scraper
 *
 * Source: https://mohap.gov.ae/en/about-us/medical-facilities-directory
 * 4,000 facilities across 334 pages (12 per page)
 * Covers: Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain
 * Also includes some Dubai and Abu Dhabi facilities regulated by MOHAP
 *
 * Architecture:
 * 1. Listing scraper: pages through ?page=1..334, extracts cards
 * 2. Detail scraper: visits each facility detail page for full data
 * 3. Raw HTML stored separately from parsed JSON (re-parseable)
 * 4. Random delays (2-5s) between requests
 * 5. Uses agent-browser CLI for headed Chromium
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://mohap.gov.ae/en/about-us/medical-facilities-directory";
const RAW_DIR = path.resolve("data/raw/mohap");
const PARSED_DIR = path.resolve("data/parsed");

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MOHAPFacilityListing {
  name: string;
  facilityType: string;
  emirate: string;
  specialty?: string;
  detailUrl: string;
}

export interface MOHAPFacilityDetail {
  name: string;
  facilityType: string;
  establishmentType: string; // Government / Private
  emirate: string;
  specialties: string[];
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  googleMapsUrl?: string;
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

// ─── Listing Scraper ───────────────────────────────────────────────────────────

/**
 * Scrape a single listing page and extract facility cards
 */
function scrapeListingPage(pageNum: number): MOHAPFacilityListing[] {
  const url = pageNum === 1 ? BASE_URL : `${BASE_URL}?page=${pageNum}`;

  console.log(`  Page ${pageNum}: ${url}`);
  runBrowser(`open "${url}"`);
  randomDelay(2000, 4000);

  // Save raw HTML
  const rawHtml = runBrowser(`eval '(() => document.documentElement.outerHTML)()'`);
  if (rawHtml) {
    const rawPath = path.join(RAW_DIR, `listing_page_${pageNum}.html`);
    fs.writeFileSync(rawPath, rawHtml);
  }

  // Extract facility cards
  const result = runBrowser(`eval '
    (() => {
      const cards = document.querySelectorAll(".aegov-card");
      const data = [];
      for (const card of cards) {
        const name = card.querySelector("h3")?.textContent?.trim() || "";
        if (!name || name.length < 2) continue;
        const link = card.querySelector("h3 a")?.href || "";
        const spans = Array.from(card.querySelectorAll("span")).map(s => s.textContent?.trim()).filter(Boolean);
        data.push({
          name,
          facilityType: spans[0] || "",
          emirate: spans[1] || "",
          specialty: spans[3] || "",
          detailUrl: link
        });
      }
      return JSON.stringify(data);
    })()'`);

  try {
    // agent-browser eval wraps return in quotes — unwrap if needed
    let parsed = result;
    if (parsed.startsWith('"') && parsed.endsWith('"')) {
      parsed = JSON.parse(parsed); // unwrap the outer string
    }
    const data = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`  Failed to parse page ${pageNum}:`, (e as Error).message);
    return [];
  }
}

/**
 * Scrape all listing pages
 */
export async function scrapeAllListings(
  startPage = 1,
  endPage = 334
): Promise<MOHAPFacilityListing[]> {
  console.log("🏥 MOHAP Listing Scraper");
  console.log(`  Scraping pages ${startPage} to ${endPage}...\n`);

  ensureDir(RAW_DIR);
  ensureDir(PARSED_DIR);

  const allFacilities: MOHAPFacilityListing[] = [];

  // Check for existing progress
  const progressFile = path.join(PARSED_DIR, "mohap_listings_progress.json");
  if (fs.existsSync(progressFile)) {
    const existing = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    allFacilities.push(...existing.facilities);
    startPage = existing.lastPage + 1;
    console.log(`  Resuming from page ${startPage} (${allFacilities.length} facilities so far)`);
  }

  for (let page = startPage; page <= endPage; page++) {
    const facilities = scrapeListingPage(page);
    allFacilities.push(...facilities);

    // Save progress every 10 pages
    if (page % 10 === 0) {
      fs.writeFileSync(
        progressFile,
        JSON.stringify({ lastPage: page, facilities: allFacilities, scrapedAt: new Date().toISOString() })
      );
      console.log(`  Checkpoint: ${allFacilities.length} facilities after ${page} pages`);
    }

    // Random delay between pages
    if (page < endPage) randomDelay(2000, 5000);
  }

  // Final save
  const outputFile = path.join(PARSED_DIR, "mohap_all_listings.json");
  fs.writeFileSync(outputFile, JSON.stringify(allFacilities, null, 2));
  console.log(`\n✅ Done: ${allFacilities.length} facilities saved to ${outputFile}`);

  return allFacilities;
}

// ─── Detail Scraper ────────────────────────────────────────────────────────────

/**
 * Scrape a single facility detail page
 */
function scrapeDetailPage(facility: MOHAPFacilityListing): MOHAPFacilityDetail | null {
  if (!facility.detailUrl) return null;

  runBrowser(`open "${facility.detailUrl}"`);
  randomDelay(2000, 4000);

  // Save raw HTML
  const safeName = facility.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
  const rawHtml = runBrowser(`eval '(() => document.documentElement.outerHTML)()'`);
  if (rawHtml) {
    fs.writeFileSync(path.join(RAW_DIR, `detail_${safeName}.html`), rawHtml);
  }

  // Extract detail data
  const result = runBrowser(`eval '
    (() => {
      const body = document.querySelector("main")?.innerText || document.body.innerText;

      const extract = (label) => {
        const regex = new RegExp(label + ":\\\\s*(.+?)\\\\n", "i");
        const match = body.match(regex);
        return match ? match[1].trim() : null;
      };

      const facilityType = extract("Facility type") || "";
      const estType = extract("Establishment type") || "";

      // Get specialties
      const specSection = body.match(/Facility specialties\\n([\\s\\S]*?)\\nContact us/);
      const specialties = specSection ? specSection[1].split("\\n").map(s => s.trim()).filter(Boolean) : [];

      // Get contact info
      const email = body.match(/Email:\\s*([^\\n]+)/)?.[1]?.trim();
      const address = body.match(/Full address:\\s*([^\\n]+)/)?.[1]?.trim();
      const phone = address?.match(/(\\+?\\d[\\d\\s-]{8,})/)?.[1]?.trim();

      // Get Google Maps link
      const mapsLink = document.querySelector("a[href*=google.com/maps]")?.href;

      return JSON.stringify({
        facilityType, estType, specialties, email, address, phone, mapsLink
      });
    })()'`);

  try {
    const detail = JSON.parse(result);
    return {
      name: facility.name,
      facilityType: detail.facilityType || facility.facilityType,
      establishmentType: detail.estType || "Private",
      emirate: facility.emirate,
      specialties: detail.specialties || [],
      email: detail.email,
      phone: detail.phone,
      address: detail.address,
      googleMapsUrl: detail.mapsLink,
    };
  } catch {
    return null;
  }
}

/**
 * Scrape details for all facilities (with resume support)
 */
export async function scrapeAllDetails(
  facilities: MOHAPFacilityListing[]
): Promise<MOHAPFacilityDetail[]> {
  console.log(`\n🏥 MOHAP Detail Scraper — ${facilities.length} facilities\n`);

  const details: MOHAPFacilityDetail[] = [];
  const progressFile = path.join(PARSED_DIR, "mohap_details_progress.json");

  let startIdx = 0;
  if (fs.existsSync(progressFile)) {
    const existing = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    details.push(...existing.details);
    startIdx = existing.lastIndex + 1;
    console.log(`  Resuming from index ${startIdx} (${details.length} details so far)`);
  }

  for (let i = startIdx; i < facilities.length; i++) {
    console.log(`  [${i + 1}/${facilities.length}] ${facilities[i].name}`);
    const detail = scrapeDetailPage(facilities[i]);
    if (detail) details.push(detail);

    // Save progress every 50
    if (i % 50 === 0 && i > 0) {
      fs.writeFileSync(
        progressFile,
        JSON.stringify({ lastIndex: i, details, scrapedAt: new Date().toISOString() })
      );
      console.log(`  Checkpoint: ${details.length} details scraped`);
    }

    randomDelay(2000, 5000);
  }

  const outputFile = path.join(PARSED_DIR, "mohap_all_details.json");
  fs.writeFileSync(outputFile, JSON.stringify(details, null, 2));
  console.log(`\n✅ Done: ${details.length} facility details saved to ${outputFile}`);

  return details;
}

// ─── Category Mapping ──────────────────────────────────────────────────────────

const MOHAP_CATEGORY_MAP: Record<string, string> = {
  "Pharmacy": "pharmacy",
  "Drug Store": "pharmacy",
  "General Hospital": "hospitals",
  "Specialized Hospital": "hospitals",
  "General Medicine Clinic": "clinics",
  "Polyclinic": "clinics",
  "Medical Center": "clinics",
  "General Dental Clinic": "dental",
  "Specialized Dental Clinic": "dental",
  "Medical Laboratory": "labs-diagnostics",
  "Diagnostic Center": "labs-diagnostics",
  "Radiology Center": "radiology-imaging",
  "Rehabilitation Center": "physiotherapy",
  "Home Healthcare": "home-healthcare",
  "Optical": "ophthalmology",
  "Support Health Service Center": "clinics",
  "Specialized Clinic": "clinics",
  "School Clinic": "clinics",
  "Nursery Clinic": "pediatrics",
  "Day Surgery Center": "hospitals",
  "Medical Warehouse": "pharmacy",
  "Telehealth Center: General Medicine Clinic": "clinics",
};

const EMIRATE_CITY_MAP: Record<string, string> = {
  "Sharjah": "sharjah",
  "Ajman": "ajman",
  "Ras Al Khaima": "ras-al-khaimah",
  "Ras Al Khaimah": "ras-al-khaimah",
  "Fujairah": "fujairah",
  "Umm Al Quwain": "umm-al-quwain",
  "Dubai": "dubai",
  "Abu Dhabi": "abu-dhabi",
};

export function transformToProviders(details: MOHAPFacilityDetail[]) {
  return details
    .filter((d) => d.name && d.name !== "-" && d.name.length > 2)
    .map((d) => ({
      name: d.name,
      citySlug: EMIRATE_CITY_MAP[d.emirate] || "sharjah",
      categorySlug: mapCategory(d.facilityType),
      address: d.address || `${d.emirate}, UAE`,
      phone: d.phone,
      email: d.email,
      specialties: d.specialties,
      establishmentType: d.establishmentType,
      licenseSource: "MOHAP" as const,
    }));
}

function mapCategory(facilityType: string): string {
  if (MOHAP_CATEGORY_MAP[facilityType]) return MOHAP_CATEGORY_MAP[facilityType];
  const lower = facilityType.toLowerCase();
  if (lower.includes("hospital")) return "hospitals";
  if (lower.includes("dental")) return "dental";
  if (lower.includes("pharmacy") || lower.includes("drug")) return "pharmacy";
  if (lower.includes("clinic")) return "clinics";
  if (lower.includes("lab")) return "labs-diagnostics";
  return "clinics";
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const startPage = parseInt(args[0]) || 1;
  const endPage = parseInt(args[1]) || 334;

  // Phase 1: Scrape listings
  const listings = await scrapeAllListings(startPage, endPage);

  // Phase 2: Scrape details (optional, run separately for large datasets)
  if (args.includes("--details")) {
    await scrapeAllDetails(listings);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
