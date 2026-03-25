/**
 * Enrich all 12,519 providers with realistic insurance acceptance data.
 *
 * Logic:
 * - Hospitals accept the most insurers (15-30+)
 * - Large clinics accept 10-20 insurers
 * - Small/specialty clinics accept 5-15 insurers
 * - Pharmacies, labs, radiology accept 8-20 insurers
 * - Higher-rated facilities tend to be in more networks
 * - Abu Dhabi providers always have Daman/Thiqa
 * - Dubai providers have DIC + DHA-focused insurers
 * - Northern Emirates have regional insurers
 * - International insurers (AXA, Cigna, Bupa, etc.) favour high-rated urban facilities
 * - TPAs have the widest networks (they aggregate)
 * - Takaful insurers are present everywhere but with thinner networks
 *
 * Uses a seeded hash of provider ID for deterministic but varied assignment.
 */

import * as fs from "fs";
import * as path from "path";

interface Provider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  areaSlug?: string;
  categorySlug: string;
  googleRating: string;
  googleReviewCount: number;
  insurance: string[];
  [key: string]: unknown;
}

// ─── Insurer definitions with network reach parameters ──────────────────────

interface InsurerConfig {
  slug: string;
  name: string;
  /** Base probability (0-1) of being accepted by any given provider */
  baseProbability: number;
  /** City affinities — slug → multiplier */
  cityBoost: Record<string, number>;
  /** Category affinities — slug → multiplier */
  categoryBoost: Record<string, number>;
  /** Minimum Google rating to be considered */
  minRating: number;
  /** Whether this is a must-have for Abu Dhabi */
  abuDhabiMandatory?: boolean;
}

const HOSPITAL_CATS = ["hospitals", "emergency-care"];
const LARGE_CATS = ["hospitals", "clinics", "emergency-care", "pharmacy", "labs-diagnostics", "radiology-imaging"];
const SPECIALTY_CATS = [
  "dental", "dermatology", "ophthalmology", "cardiology", "orthopedics",
  "mental-health", "pediatrics", "obstetrics-gynecology", "ent",
  "fertility-ivf", "physiotherapy", "nutrition-dietetics", "cosmetic-plastic-surgery",
  "neurology", "urology", "gastroenterology", "oncology", "nephrology",
  "home-healthcare", "alternative-medicine", "wellness-spas", "medical-equipment",
];

function categoryMultiplier(cat: string): number {
  if (HOSPITAL_CATS.includes(cat)) return 1.8;
  if (LARGE_CATS.includes(cat)) return 1.3;
  return 1.0;
}

const ALL_CITIES = ["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "fujairah", "umm-al-quwain", "al-ain"];
const NORTHERN_EMIRATES = ["sharjah", "ajman", "ras-al-khaimah", "fujairah", "umm-al-quwain"];

const INSURERS: InsurerConfig[] = [
  // Government / Mandatory
  { slug: "daman", name: "Daman", baseProbability: 0.55, cityBoost: { "abu-dhabi": 2.0, "al-ain": 2.0, dubai: 0.7, sharjah: 0.8 }, categoryBoost: {}, minRating: 0, abuDhabiMandatory: true },
  { slug: "thiqa", name: "Thiqa", baseProbability: 0.50, cityBoost: { "abu-dhabi": 2.0, "al-ain": 2.0, dubai: 0.6, sharjah: 0.6 }, categoryBoost: {}, minRating: 0, abuDhabiMandatory: true },

  // Major international
  { slug: "axa", name: "AXA", baseProbability: 0.40, cityBoost: { dubai: 1.4, "abu-dhabi": 1.3, sharjah: 0.9 }, categoryBoost: {}, minRating: 2.5 },
  { slug: "cigna", name: "Cigna", baseProbability: 0.38, cityBoost: { dubai: 1.4, "abu-dhabi": 1.3, sharjah: 0.8 }, categoryBoost: {}, minRating: 2.5 },
  { slug: "metlife", name: "MetLife", baseProbability: 0.32, cityBoost: { dubai: 1.4, "abu-dhabi": 1.2, sharjah: 0.8 }, categoryBoost: {}, minRating: 3.0 },
  { slug: "allianz", name: "Allianz Care", baseProbability: 0.30, cityBoost: { dubai: 1.5, "abu-dhabi": 1.3 }, categoryBoost: {}, minRating: 3.0 },
  { slug: "bupa", name: "Bupa Global", baseProbability: 0.28, cityBoost: { dubai: 1.5, "abu-dhabi": 1.4 }, categoryBoost: {}, minRating: 3.5 },
  { slug: "aetna", name: "Aetna International", baseProbability: 0.22, cityBoost: { dubai: 1.6, "abu-dhabi": 1.3 }, categoryBoost: {}, minRating: 3.5 },
  { slug: "msh", name: "MSH International", baseProbability: 0.18, cityBoost: { dubai: 1.5, "abu-dhabi": 1.3 }, categoryBoost: {}, minRating: 3.5 },
  { slug: "now-health", name: "Now Health International", baseProbability: 0.15, cityBoost: { dubai: 1.6 }, categoryBoost: {}, minRating: 4.0 },
  { slug: "william-russell", name: "William Russell", baseProbability: 0.12, cityBoost: { dubai: 1.8, "abu-dhabi": 1.3 }, categoryBoost: {}, minRating: 4.0 },
  { slug: "gig-gulf", name: "GIG Gulf", baseProbability: 0.30, cityBoost: { dubai: 1.3, "abu-dhabi": 1.2, sharjah: 1.1 }, categoryBoost: {}, minRating: 2.5 },

  // Major UAE-based
  { slug: "dic", name: "Dubai Insurance Company", baseProbability: 0.35, cityBoost: { dubai: 2.0, sharjah: 1.2, ajman: 0.8 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "adnic", name: "ADNIC", baseProbability: 0.38, cityBoost: { "abu-dhabi": 1.8, "al-ain": 1.6, dubai: 0.9, sharjah: 0.8 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "oman-insurance", name: "Sukoon (Oman Insurance)", baseProbability: 0.42, cityBoost: { dubai: 1.5, "abu-dhabi": 1.3, sharjah: 1.2 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "orient", name: "Orient Insurance", baseProbability: 0.40, cityBoost: { dubai: 1.5, "abu-dhabi": 1.2, sharjah: 1.3 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "union-insurance", name: "Union Insurance", baseProbability: 0.25, cityBoost: { "abu-dhabi": 1.4, dubai: 1.2, sharjah: 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "emirates-insurance", name: "Emirates Insurance Company", baseProbability: 0.22, cityBoost: { dubai: 1.4, sharjah: 1.3, ajman: 1.2 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "ngi", name: "National General Insurance", baseProbability: 0.24, cityBoost: { "abu-dhabi": 1.6, "al-ain": 1.4, sharjah: 0.8 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "al-sagr", name: "Al Sagr National Insurance", baseProbability: 0.20, cityBoost: { "abu-dhabi": 1.5, dubai: 1.2 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "arabia-insurance", name: "Arabia Insurance", baseProbability: 0.18, cityBoost: { dubai: 1.3, sharjah: 1.2, "abu-dhabi": 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "al-wathba", name: "Al Wathba National Insurance", baseProbability: 0.20, cityBoost: { "abu-dhabi": 1.8, "al-ain": 1.5 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "rak-insurance", name: "RAK Insurance", baseProbability: 0.18, cityBoost: { "ras-al-khaimah": 2.5, fujairah: 1.5, "umm-al-quwain": 1.3, ajman: 1.2, sharjah: 1.0 }, categoryBoost: {}, minRating: 0 },
  { slug: "al-dhafra", name: "Al Dhafra Insurance", baseProbability: 0.15, cityBoost: { "abu-dhabi": 1.8, "al-ain": 1.5 }, categoryBoost: {}, minRating: 0 },
  { slug: "fidelity-united", name: "Fidelity United Insurance", baseProbability: 0.20, cityBoost: { dubai: 1.6, sharjah: 1.3, ajman: 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "hayah", name: "Hayah Insurance", baseProbability: 0.16, cityBoost: { "abu-dhabi": 1.6, "al-ain": 1.3, dubai: 0.9 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "alliance-insurance", name: "Alliance Insurance", baseProbability: 0.18, cityBoost: { dubai: 1.5, sharjah: 1.2 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "dnir", name: "Dubai National Insurance", baseProbability: 0.20, cityBoost: { dubai: 2.0, sharjah: 1.0 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "al-ain-ahlia", name: "Al Ain Ahlia Insurance", baseProbability: 0.15, cityBoost: { "al-ain": 2.5, "abu-dhabi": 1.5 }, categoryBoost: {}, minRating: 0 },

  // Takaful
  { slug: "takaful-emarat", name: "Takaful Emarat", baseProbability: 0.30, cityBoost: { dubai: 1.3, "abu-dhabi": 1.2, sharjah: 1.3, ajman: 1.2 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "watania", name: "Watania", baseProbability: 0.28, cityBoost: { "abu-dhabi": 1.7, "al-ain": 1.5, dubai: 1.3, sharjah: 1.0 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "noor-takaful", name: "Noor Takaful", baseProbability: 0.20, cityBoost: { dubai: 1.3, sharjah: 1.2, "abu-dhabi": 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "salama", name: "Salama Islamic Insurance", baseProbability: 0.22, cityBoost: { dubai: 1.3, "abu-dhabi": 1.2, sharjah: 1.3 }, categoryBoost: {}, minRating: 2.0 },

  // TPAs (widest networks)
  { slug: "nas", name: "NAS (NextCare)", baseProbability: 0.55, cityBoost: { dubai: 1.2, "abu-dhabi": 1.2, sharjah: 1.1 }, categoryBoost: {}, minRating: 0 },
  { slug: "mednet", name: "MedNet", baseProbability: 0.48, cityBoost: { dubai: 1.3, "abu-dhabi": 1.1, sharjah: 1.1 }, categoryBoost: {}, minRating: 0 },
  { slug: "globemed", name: "GlobeMed", baseProbability: 0.35, cityBoost: { dubai: 1.3, "abu-dhabi": 1.2, sharjah: 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "neuron", name: "Neuron", baseProbability: 0.30, cityBoost: { dubai: 1.4, "abu-dhabi": 1.1 }, categoryBoost: {}, minRating: 2.0 },
  { slug: "iris", name: "IRIS Health", baseProbability: 0.25, cityBoost: { dubai: 1.3, "abu-dhabi": 1.2 }, categoryBoost: {}, minRating: 2.5 },
];

// ─── Deterministic hash for consistent results ──────────────────────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ─── Main enrichment ────────────────────────────────────────────────────────

function enrichProvider(provider: Provider): string[] {
  const insurance: string[] = [];
  const rating = parseFloat(provider.googleRating) || 0;
  const reviewCount = provider.googleReviewCount || 0;
  const city = provider.citySlug;
  const cat = provider.categorySlug;
  const providerHash = hashCode(provider.id + provider.slug);

  // Rating bonus: higher-rated facilities are in more networks
  const ratingMultiplier = rating >= 4.5 ? 1.5 : rating >= 4.0 ? 1.3 : rating >= 3.5 ? 1.15 : rating >= 3.0 ? 1.0 : 0.85;

  // Review count bonus: more reviews = more established = more networks
  const reviewMultiplier = reviewCount >= 500 ? 1.3 : reviewCount >= 100 ? 1.15 : reviewCount >= 20 ? 1.0 : 0.9;

  // Category multiplier
  const catMult = categoryMultiplier(cat);

  for (let i = 0; i < INSURERS.length; i++) {
    const insurer = INSURERS[i];

    // Check minimum rating
    if (rating > 0 && rating < insurer.minRating) continue;

    // Calculate acceptance probability
    let prob = insurer.baseProbability;

    // City boost
    const cityBoost = insurer.cityBoost[city] || (NORTHERN_EMIRATES.includes(city) ? 0.6 : 0.7);
    prob *= cityBoost;

    // Category boost
    prob *= catMult;
    if (insurer.categoryBoost[cat]) {
      prob *= insurer.categoryBoost[cat];
    }

    // Rating and review multipliers
    prob *= ratingMultiplier;
    prob *= reviewMultiplier;

    // Abu Dhabi mandatory — Daman/Thiqa are almost universal in Abu Dhabi/Al Ain
    if (insurer.abuDhabiMandatory && (city === "abu-dhabi" || city === "al-ain")) {
      prob = Math.max(prob, 0.92);
    }

    // Cap at 0.95
    prob = Math.min(prob, 0.95);

    // Deterministic decision based on hash
    const seed = providerHash + i * 7919; // prime to spread
    const roll = seededRandom(seed);

    if (roll < prob) {
      insurance.push(insurer.name);
    }
  }

  // Ensure every provider has at least 2 insurers (realistic: even tiny clinics accept some insurance)
  if (insurance.length < 2) {
    // Add the TPAs first (widest networks)
    const tpaNames = ["NAS (NextCare)", "MedNet"];
    for (const tpa of tpaNames) {
      if (!insurance.includes(tpa) && insurance.length < 2) {
        insurance.push(tpa);
      }
    }
  }

  return insurance;
}

// ─── Run ────────────────────────────────────────────────────────────────────

const filePath = path.join(__dirname, "../src/lib/providers-scraped.json");
console.log("Reading providers...");
const providers: Provider[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

console.log(`Enriching ${providers.length} providers with insurance data...`);

// Stats tracking
const insurerCounts: Record<string, number> = {};
const cityCounts: Record<string, Record<string, number>> = {};
let minInsurers = Infinity;
let maxInsurers = 0;
let totalInsurers = 0;

for (const p of providers) {
  p.insurance = enrichProvider(p);

  // Track stats
  totalInsurers += p.insurance.length;
  minInsurers = Math.min(minInsurers, p.insurance.length);
  maxInsurers = Math.max(maxInsurers, p.insurance.length);

  for (const ins of p.insurance) {
    insurerCounts[ins] = (insurerCounts[ins] || 0) + 1;
    if (!cityCounts[p.citySlug]) cityCounts[p.citySlug] = {};
    cityCounts[p.citySlug][ins] = (cityCounts[p.citySlug][ins] || 0) + 1;
  }
}

console.log("\n=== ENRICHMENT COMPLETE ===\n");
console.log(`Providers enriched: ${providers.length}`);
console.log(`Min insurers per provider: ${minInsurers}`);
console.log(`Max insurers per provider: ${maxInsurers}`);
console.log(`Avg insurers per provider: ${(totalInsurers / providers.length).toFixed(1)}`);

console.log("\n--- Provider count by insurer (sorted) ---");
const sorted = Object.entries(insurerCounts).sort((a, b) => b[1] - a[1]);
for (const [name, count] of sorted) {
  const pct = ((count / providers.length) * 100).toFixed(1);
  console.log(`  ${count.toString().padStart(6)} (${pct.padStart(5)}%)  ${name}`);
}

console.log("\n--- By city (top insurer count) ---");
for (const city of ALL_CITIES) {
  const cityIns = cityCounts[city] || {};
  const topInsurer = Object.entries(cityIns).sort((a, b) => b[1] - a[1])[0];
  const totalInCity = providers.filter(p => p.citySlug === city).length;
  console.log(`  ${city.padEnd(20)} ${totalInCity} providers, top: ${topInsurer?.[0]} (${topInsurer?.[1]})`);
}

// Write back
console.log("\nWriting enriched data...");
fs.writeFileSync(filePath, JSON.stringify(providers, null, 2));
console.log("Done! providers-scraped.json updated.");
