/**
 * Import scraped MOHAP data into the app's data format.
 * Reads mohap_all_listings.json → transforms → writes providers.json
 * which the data.ts layer reads at build time.
 */

import * as fs from "fs";
import * as path from "path";

const PARSED_DIR = path.resolve("data/parsed");
const OUTPUT_FILE = path.resolve("src/lib/providers-scraped.json");

interface MOHAPListing {
  name: string;
  facilityType: string;
  emirate: string;
  specialty?: string;
  detailUrl: string;
}

// ─── Mappings ──────────────────────────────────────────────────────────────────

const EMIRATE_CITY_MAP: Record<string, string> = {
  "Dubai": "dubai",
  "Abu Dhabi": "abu-dhabi",
  "Sharjah": "sharjah",
  "Ajman": "ajman",
  "Ras Al Khaima": "ras-al-khaimah",
  "Ras Al Khaimah": "ras-al-khaimah",
  "Fujairah": "fujairah",
  "Umm al-Quwain": "umm-al-quwain",
  "Umm Al Quwain": "umm-al-quwain",
};

const FACILITY_TYPE_MAP: Record<string, string> = {
  "Pharmacy": "pharmacy",
  "Drug Store": "pharmacy",
  "Medical Warehouse": "pharmacy",
  "Medical Warehouse for Re-Export": "pharmacy",
  "Medical Store": "pharmacy",
  "Marketing Office": "pharmacy",
  "General Hospital": "hospitals",
  "Specialized Hospital": "hospitals",
  "Day Surgery Center": "hospitals",
  "General Medicine Clinic": "clinics",
  "Polyclinic": "clinics",
  "Medical Center": "clinics",
  "Support Health Service Center": "clinics",
  "Specialized Clinic": "clinics",
  "School Clinic": "clinics",
  "Telehealth Center: General Medicine Clinic": "clinics",
  "General Dental Clinic": "dental",
  "Specialized Dental Clinic": "dental",
  "Support Health Service Center: Dental Lab": "dental",
  "Nursery Clinic": "pediatrics",
  "Medical Laboratory": "labs-diagnostics",
  "Diagnostic Center": "labs-diagnostics",
  "Radiology Center": "radiology-imaging",
  "Rehabilitation Center": "physiotherapy",
  "Home Healthcare Center": "home-healthcare",
  "Optical Center": "ophthalmology",
};

const CATEGORY_NAMES: Record<string, string> = {
  "hospitals": "Hospitals & Medical Centers",
  "clinics": "General Clinics & Polyclinics",
  "dental": "Dental Clinics",
  "pharmacy": "Pharmacies",
  "labs-diagnostics": "Labs & Diagnostics",
  "radiology-imaging": "Radiology & Imaging",
  "physiotherapy": "Physiotherapy & Rehabilitation",
  "home-healthcare": "Home Healthcare",
  "ophthalmology": "Eye Care & Ophthalmology",
  "pediatrics": "Pediatrics & Child Health",
  "dermatology": "Dermatology & Skin Care",
  "cardiology": "Cardiology & Heart Care",
  "mental-health": "Mental Health & Psychology",
  "orthopedics": "Orthopedics & Sports Medicine",
  "emergency-care": "Emergency & Urgent Care",
  "alternative-medicine": "Alternative & Holistic Medicine",
  "wellness-spas": "Wellness Centers & Medical Spas",
};

function mapCategory(facilityType: string, specialty?: string): string {
  if (FACILITY_TYPE_MAP[facilityType]) return FACILITY_TYPE_MAP[facilityType];

  // Try specialty mapping
  if (specialty) {
    const specLower = specialty.toLowerCase();
    if (specLower.includes("dental") || specLower.includes("orthodont")) return "dental";
    if (specLower.includes("dermatol") || specLower.includes("skin")) return "dermatology";
    if (specLower.includes("cardio") || specLower.includes("heart")) return "cardiology";
    if (specLower.includes("eye") || specLower.includes("ophthalm") || specLower.includes("optom")) return "ophthalmology";
    if (specLower.includes("ortho") || specLower.includes("sport")) return "orthopedics";
    if (specLower.includes("mental") || specLower.includes("psych")) return "mental-health";
    if (specLower.includes("pediatr") || specLower.includes("child") || specLower.includes("neonat")) return "pediatrics";
    if (specLower.includes("obstet") || specLower.includes("gynec")) return "ob-gyn";
    if (specLower.includes("ent") || specLower.includes("ear")) return "ent";
    if (specLower.includes("neuro")) return "neurology";
    if (specLower.includes("urol")) return "urology";
    if (specLower.includes("gastro")) return "gastroenterology";
    if (specLower.includes("oncol") || specLower.includes("cancer")) return "oncology";
    if (specLower.includes("physio") || specLower.includes("rehab")) return "physiotherapy";
    if (specLower.includes("nutri") || specLower.includes("diet")) return "nutrition-dietetics";
    if (specLower.includes("fertil") || specLower.includes("ivf")) return "fertility-ivf";
    if (specLower.includes("cosmet") || specLower.includes("plastic")) return "cosmetic-plastic";
    if (specLower.includes("emergency") || specLower.includes("urgent")) return "emergency-care";
    if (specLower.includes("radiol")) return "radiology-imaging";
    if (specLower.includes("lab") || specLower.includes("pathol")) return "labs-diagnostics";
    if (specLower.includes("pharm")) return "pharmacy";
  }

  const lower = facilityType.toLowerCase();
  if (lower.includes("hospital")) return "hospitals";
  if (lower.includes("dental")) return "dental";
  if (lower.includes("pharmacy") || lower.includes("drug")) return "pharmacy";
  if (lower.includes("clinic")) return "clinics";
  if (lower.includes("lab")) return "labs-diagnostics";

  return "clinics";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''\.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toTitleCase(str: string): string {
  // Convert "ALL CAPS NAME LLC" to "All Caps Name LLC"
  return str
    .split(" ")
    .map((word) => {
      if (["LLC", "L.L.C", "OPC", "SPC", "FZE", "FZ", "BR", "LTD", "CO", "II", "III", "IV"].includes(word)) return word;
      if (word.length <= 2) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

// ─── Main Transform ────────────────────────────────────────────────────────────

function main() {
  const inputFile = path.join(PARSED_DIR, "mohap_all_listings.json");

  if (!fs.existsSync(inputFile)) {
    console.error("❌ No scraped data found. Run: npm run scrape:mohap first");
    process.exit(1);
  }

  const listings: MOHAPListing[] = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  console.log(`📦 Importing ${listings.length} MOHAP facilities...\n`);

  // Filter out junk entries
  const valid = listings.filter((l) => {
    if (!l.name || l.name === "-" || l.name.length < 3) return false;
    if (!l.emirate) return false;
    return true;
  });

  console.log(`  Valid entries: ${valid.length} (filtered ${listings.length - valid.length} junk)`);

  // Deduplicate by name + emirate
  const seen = new Map<string, MOHAPListing>();
  for (const l of valid) {
    const key = `${l.name.toLowerCase().trim()}::${l.emirate}`;
    if (!seen.has(key)) {
      seen.set(key, l);
    }
  }
  const deduped = Array.from(seen.values());
  console.log(`  After dedup: ${deduped.length} unique facilities`);

  // Transform to provider format
  const providers = deduped.map((l, i) => {
    const citySlug = EMIRATE_CITY_MAP[l.emirate] || "dubai";
    const categorySlug = mapCategory(l.facilityType, l.specialty);
    const name = toTitleCase(l.name.trim());
    const slug = `${slugify(name)}-${citySlug}`;

    return {
      id: `mohap_${i + 1}`,
      name,
      slug,
      citySlug,
      categorySlug,
      facilityType: l.facilityType,
      specialty: l.specialty || null,
      address: `${l.emirate}, UAE`,
      description: `${name} is a ${l.facilityType.toLowerCase()} located in ${l.emirate}, United Arab Emirates. Licensed by the Ministry of Health and Prevention (MOHAP).${l.specialty ? ` Specialty: ${l.specialty}.` : ""}`,
      shortDescription: `${l.facilityType} in ${l.emirate}, UAE.${l.specialty ? ` Specialty: ${l.specialty}.` : ""} Licensed by MOHAP.`,
      services: l.specialty ? l.specialty.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      languages: ["English", "Arabic"],
      insurance: [],
      operatingHours: {},
      amenities: [],
      lastVerified: "2026-03-18",
      licenseSource: "MOHAP",
      detailUrl: l.detailUrl,
      googleRating: null,
      googleReviewCount: 0,
      isClaimed: false,
      isVerified: true, // Licensed by MOHAP = verified
    };
  });

  // Stats
  const byCityCount: Record<string, number> = {};
  const byCatCount: Record<string, number> = {};
  for (const p of providers) {
    byCityCount[p.citySlug] = (byCityCount[p.citySlug] || 0) + 1;
    byCatCount[p.categorySlug] = (byCatCount[p.categorySlug] || 0) + 1;
  }

  console.log("\n  By city:");
  Object.entries(byCityCount).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`    ${c}: ${n}`));
  console.log("\n  By category:");
  Object.entries(byCatCount).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`    ${c}: ${n} (${CATEGORY_NAMES[c] || c})`));

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(providers, null, 2));
  console.log(`\n✅ Written ${providers.length} providers to ${OUTPUT_FILE}`);
}

main();
