#!/usr/bin/env node
/**
 * Import Istanbul healthcare providers from Google Places into production DB.
 *
 * Discovery uses Places API New Text Search with an Istanbul bounding box.
 * Enrichment/photos are intentionally left to comprehensive-enrich-places.mjs
 * so all countries share the same details/R2 pipeline.
 */

import pg from "pg";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // env file is optional
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const OVERWRITE = args.includes("--overwrite");
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const MAX_QUERIES = Number(getArg("max-queries", "100000"));
const MAX_RESULTS_PER_QUERY = Number(getArg("max-results-per-query", "20"));
const MIN_REVIEW_COUNT = Number(getArg("min-reviews", "0"));
const REFERER = process.env.GOOGLE_PLACES_REFERER || "https://www.zavis.ai/";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY && !DRY_RUN) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 4 });

const ISTANBUL_BOX = {
  low: { latitude: 40.78, longitude: 28.45 },
  high: { latitude: 41.35, longitude: 29.55 },
};

const DISTRICTS = [
  "Adalar",
  "Arnavutkoy",
  "Atasehir",
  "Avcilar",
  "Bagcilar",
  "Bahcelievler",
  "Bakirkoy",
  "Basaksehir",
  "Bayrampasa",
  "Besiktas",
  "Beykoz",
  "Beylikduzu",
  "Beyoglu",
  "Buyukcekmece",
  "Catalca",
  "Cekmekoy",
  "Esenler",
  "Esenyurt",
  "Eyupsultan",
  "Fatih",
  "Gaziosmanpasa",
  "Gungoren",
  "Kadikoy",
  "Kagithane",
  "Kartal",
  "Kucukcekmece",
  "Maltepe",
  "Pendik",
  "Sancaktepe",
  "Sariyer",
  "Silivri",
  "Sile",
  "Sisli",
  "Sultanbeyli",
  "Sultangazi",
  "Tuzla",
  "Umraniye",
  "Uskudar",
  "Zeytinburnu",
];

const SEARCHES = [
  { term: "hospital", category: "hospitals", facilityType: "hospital" },
  { term: "private hospital", category: "hospitals", facilityType: "hospital" },
  { term: "medical clinic", category: "clinics", facilityType: "clinic" },
  { term: "polyclinic", category: "clinics", facilityType: "polyclinic" },
  { term: "family medicine clinic", category: "clinics", facilityType: "clinic" },
  { term: "urgent care clinic", category: "emergency-care", facilityType: "urgent_care" },
  { term: "pharmacy", category: "pharmacy", facilityType: "pharmacy" },
  { term: "dental clinic", category: "dental", facilityType: "dental_clinic" },
  { term: "dentist", category: "dental", facilityType: "dental_clinic" },
  { term: "dermatology clinic", category: "dermatology", facilityType: "specialty_clinic" },
  { term: "hair transplant clinic", category: "dermatology", facilityType: "specialty_clinic" },
  { term: "plastic surgery clinic", category: "cosmetic-plastic", facilityType: "specialty_clinic" },
  { term: "eye clinic", category: "ophthalmology", facilityType: "eye_clinic" },
  { term: "ophthalmology clinic", category: "ophthalmology", facilityType: "eye_clinic" },
  { term: "ENT clinic", category: "ent", facilityType: "specialty_clinic" },
  { term: "cardiology clinic", category: "cardiology", facilityType: "specialty_clinic" },
  { term: "orthopedic clinic", category: "orthopedics", facilityType: "specialty_clinic" },
  { term: "physiotherapy clinic", category: "physiotherapy", facilityType: "rehabilitation_center" },
  { term: "rehabilitation center", category: "physiotherapy", facilityType: "rehabilitation_center" },
  { term: "medical laboratory", category: "labs-diagnostics", facilityType: "laboratory" },
  { term: "radiology center", category: "radiology-imaging", facilityType: "diagnostic_imaging" },
  { term: "IVF clinic", category: "fertility-ivf", facilityType: "specialty_clinic" },
  { term: "gynecology clinic", category: "ob-gyn", facilityType: "specialty_clinic" },
  { term: "pediatric clinic", category: "pediatrics", facilityType: "specialty_clinic" },
  { term: "mental health clinic", category: "mental-health", facilityType: "mental_health_clinic" },
  { term: "psychologist", category: "mental-health", facilityType: "mental_health_clinic" },
  { term: "urology clinic", category: "urology", facilityType: "specialty_clinic" },
  { term: "gastroenterology clinic", category: "gastroenterology", facilityType: "specialty_clinic" },
  { term: "oncology clinic", category: "oncology", facilityType: "specialty_clinic" },
  { term: "neurology clinic", category: "neurology", facilityType: "specialty_clinic" },
  { term: "nephrology clinic", category: "nephrology", facilityType: "specialty_clinic" },
  { term: "dietitian nutrition clinic", category: "nutrition-dietetics", facilityType: "nutrition_clinic" },
  { term: "home healthcare", category: "home-healthcare", facilityType: "home_healthcare" },
  { term: "medical equipment store", category: "medical-equipment", facilityType: "medical_equipment" },
  { term: "medical spa", category: "wellness-spas", facilityType: "medical_spa" },
  { term: "acupuncture clinic", category: "alternative-medicine", facilityType: "alternative_medicine" },
];

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function providerId(placeId) {
  return `tr_gplaces_${crypto.createHash("sha1").update(placeId).digest("hex").slice(0, 16)}`;
}

function placeRating(place) {
  return place.rating ? Number(place.rating).toFixed(1) : null;
}

function inferCategory(place, fallback) {
  const types = new Set((place.types || []).map((t) => String(t).toLowerCase()));
  if (types.has("hospital")) return "hospitals";
  if (types.has("pharmacy")) return "pharmacy";
  if (types.has("dentist") || types.has("dental_clinic")) return "dental";
  if (types.has("physiotherapist")) return "physiotherapy";
  if (types.has("medical_lab")) return "labs-diagnostics";
  return fallback;
}

function shortDescription(name, categorySlug) {
  const label = {
    hospitals: "hospital",
    clinics: "clinic",
    pharmacy: "pharmacy",
    dental: "dental clinic",
    dermatology: "dermatology clinic",
    "cosmetic-plastic": "cosmetic and plastic surgery provider",
    ophthalmology: "eye care provider",
    "labs-diagnostics": "diagnostic provider",
    physiotherapy: "physiotherapy and rehabilitation provider",
  }[categorySlug] || "healthcare provider";
  return `${name} is a ${label} in Istanbul, Turkey.`;
}

function servicesFor(categorySlug, searchTerm) {
  const base = {
    hospitals: ["Emergency care", "Specialist consultations", "Diagnostics", "Inpatient care"],
    clinics: ["General consultations", "Specialist referrals", "Preventive care"],
    pharmacy: ["Prescription dispensing", "OTC medicines", "Pharmacist advice"],
    dental: ["Dental consultation", "Preventive dentistry", "Restorative dentistry"],
    dermatology: ["Dermatology consultation", "Skin treatments", "Hair and scalp care"],
    "cosmetic-plastic": ["Cosmetic consultation", "Aesthetic procedures", "Plastic surgery"],
    ophthalmology: ["Eye consultation", "Vision checks", "Ophthalmology care"],
    ent: ["ENT consultation", "Ear care", "Nose and throat care"],
    cardiology: ["Cardiology consultation", "Heart checks", "Cardiac diagnostics"],
    orthopedics: ["Orthopedic consultation", "Sports injury care", "Joint and bone care"],
    physiotherapy: ["Physiotherapy", "Rehabilitation", "Pain management"],
    "labs-diagnostics": ["Laboratory tests", "Blood tests", "Diagnostic services"],
    "radiology-imaging": ["Medical imaging", "Radiology", "Diagnostic scans"],
    "fertility-ivf": ["Fertility consultation", "IVF care", "Reproductive medicine"],
    "ob-gyn": ["Gynecology consultation", "Women's health", "Pregnancy care"],
    pediatrics: ["Pediatric consultation", "Child health", "Vaccination advice"],
    "mental-health": ["Mental health consultation", "Therapy", "Psychological support"],
    urology: ["Urology consultation", "Urinary health", "Men's health"],
    gastroenterology: ["Gastroenterology consultation", "Digestive health", "Endoscopy referrals"],
    oncology: ["Oncology consultation", "Cancer care coordination", "Treatment referrals"],
    neurology: ["Neurology consultation", "Brain and nerve care", "Neurological assessment"],
    nephrology: ["Nephrology consultation", "Kidney care", "Renal assessment"],
    "nutrition-dietetics": ["Dietitian consultation", "Nutrition plans", "Weight management"],
    "home-healthcare": ["Home nursing", "Home care support", "Patient monitoring"],
    "medical-equipment": ["Medical supplies", "Healthcare equipment", "Patient support products"],
    "wellness-spas": ["Medical aesthetics", "Wellness treatments", "Skin and body treatments"],
    "alternative-medicine": ["Alternative medicine consultation", "Acupuncture", "Holistic care"],
  };
  const list = base[categorySlug] || ["Healthcare consultation"];
  if (/hair transplant/i.test(searchTerm) && !list.includes("Hair transplant consultation")) {
    return ["Hair transplant consultation", "Hair restoration", ...list];
  }
  return list;
}

async function searchText(textQuery) {
  const body = {
    textQuery,
    languageCode: "en",
    regionCode: "TR",
    maxResultCount: Math.min(MAX_RESULTS_PER_QUERY, 20),
    locationRestriction: { rectangle: ISTANBUL_BOX },
  };

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.types",
        "places.businessStatus",
        "places.googleMapsUri",
        "places.photos",
      ].join(","),
      "Referer": REFERER,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`${res.status} ${json.error?.status || ""} ${json.error?.message || res.statusText}`);
  }
  return json.places || [];
}

async function ensureCategoryIds() {
  const { rows } = await pool.query("SELECT id, slug FROM categories");
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function existingPlaceIds() {
  const { rows } = await pool.query("SELECT google_place_id FROM providers WHERE google_place_id IS NOT NULL");
  return new Set(rows.map((r) => r.google_place_id));
}

async function upsertProvider(place, search, categoryIds, existingIds) {
  const placeId = place.id;
  const name = place.displayName?.text || "";
  if (!placeId || !name) return { status: "skipped", reason: "missing id/name" };
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
    return { status: "skipped", reason: place.businessStatus };
  }
  if ((place.userRatingCount || 0) < MIN_REVIEW_COUNT) {
    return { status: "skipped", reason: "below min reviews" };
  }

  const categorySlug = inferCategory(place, search.category);
  const categoryId = categoryIds.get(categorySlug);
  if (!categoryId) return { status: "skipped", reason: `missing category ${categorySlug}` };

  const id = providerId(placeId);
  const slugHash = crypto.createHash("sha1").update(placeId).digest("hex").slice(0, 8);
  const slugName = slugify(name) || "provider";
  const slugBase = `${slugName}-istanbul-${slugHash}`;
  const slug = slugBase || id;
  const address = place.formattedAddress || "Istanbul, Turkey";
  const lat = place.location?.latitude ?? null;
  const lng = place.location?.longitude ?? null;
  const rating = placeRating(place);
  const reviewCount = place.userRatingCount || 0;
  const description = shortDescription(name, categorySlug);
  const services = servicesFor(categorySlug, search.term);
  const googleTypes = place.types || [];
  const googlePhotoUrl = place.photos?.[0]?.name || null;

  if (DRY_RUN) {
    return { status: existingIds.has(placeId) ? "exists" : "inserted", id, slug, categorySlug };
  }

  const writeMode = OVERWRITE ? "" : "WHERE providers.google_fetched_at IS NULL";
  await pool.query(
    `INSERT INTO providers (
       id, name, slug, category_id, city_id, address, latitude, longitude,
       google_place_id, google_rating, google_review_count, status,
       category_slug, city_slug, country, facility_type, description,
       short_description, services, languages, amenities, google_types,
       google_maps_uri, google_photo_url, business_status, google_place_details,
       created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, 'city_istanbul', $5, $6, $7,
       $8, $9, $10, 'active',
       $11, 'istanbul', 'tr', $12, $13,
       $14, $15, $16, $17, $18,
       $19, $20, $21, $22,
       NOW(), NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       slug = EXCLUDED.slug,
       category_id = EXCLUDED.category_id,
       category_slug = EXCLUDED.category_slug,
       address = EXCLUDED.address,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       google_rating = EXCLUDED.google_rating,
       google_review_count = EXCLUDED.google_review_count,
       facility_type = EXCLUDED.facility_type,
       description = EXCLUDED.description,
       short_description = EXCLUDED.short_description,
       services = EXCLUDED.services,
       languages = EXCLUDED.languages,
       amenities = EXCLUDED.amenities,
       google_types = EXCLUDED.google_types,
       google_maps_uri = EXCLUDED.google_maps_uri,
       google_photo_url = EXCLUDED.google_photo_url,
       business_status = EXCLUDED.business_status,
       google_place_details = EXCLUDED.google_place_details,
       updated_at = NOW()
       ${writeMode}`,
    [
      id,
      name,
      slug,
      categoryId,
      address,
      lat,
      lng,
      placeId,
      rating,
      reviewCount,
      categorySlug,
      search.facilityType,
      description,
      description,
      JSON.stringify(services),
      JSON.stringify(["Turkish", "English"]),
      JSON.stringify(["Google Maps profile", "Verified location"]),
      JSON.stringify(googleTypes),
      place.googleMapsUri || null,
      googlePhotoUrl,
      place.businessStatus || null,
      JSON.stringify({ searchText: place, matchedSearch: search.term, importedAt: new Date().toISOString() }),
    ],
  );

  return { status: existingIds.has(placeId) ? "updated" : "inserted", id, slug, categorySlug };
}

async function main() {
  const categoryIds = await ensureCategoryIds();
  const existingIds = await existingPlaceIds();

  const queries = [];
  for (const search of SEARCHES) {
    queries.push({ search, query: `${search.term} in Istanbul, Turkey` });
  }
  for (const district of DISTRICTS) {
    for (const search of SEARCHES) {
      queries.push({ search, query: `${search.term} in ${district}, Istanbul, Turkey` });
    }
  }

  const limitedQueries = queries.slice(0, MAX_QUERIES);
  const seen = new Map();
  const stats = {
    queries: 0,
    apiResults: 0,
    unique: 0,
    inserted: 0,
    updated: 0,
    exists: 0,
    skipped: 0,
    byCategory: {},
    errors: 0,
  };

  console.log(`Istanbul Google Places import${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(`Queries: ${limitedQueries.length}`);
  console.log(`Max results/query: ${MAX_RESULTS_PER_QUERY}`);
  console.log(`Existing place IDs in DB: ${existingIds.size}`);

  for (const { search, query } of limitedQueries) {
    stats.queries++;
    try {
      const places = DRY_RUN && !API_KEY ? [] : await searchText(query);
      stats.apiResults += places.length;
      for (const place of places) {
        if (!place.id || seen.has(place.id)) continue;
        seen.set(place.id, { place, search });
      }
      if (stats.queries % 25 === 0 || stats.queries === limitedQueries.length) {
        console.log(`  searched ${stats.queries}/${limitedQueries.length}; raw=${stats.apiResults}; unique=${seen.size}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    } catch (err) {
      stats.errors++;
      console.warn(`  search failed: ${query}: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  stats.unique = seen.size;
  console.log(`Upserting ${seen.size} unique places...`);

  for (const { place, search } of seen.values()) {
    const result = await upsertProvider(place, search, categoryIds, existingIds);
    stats[result.status] = (stats[result.status] || 0) + 1;
    if (result.categorySlug) {
      stats.byCategory[result.categorySlug] = (stats.byCategory[result.categorySlug] || 0) + 1;
    }
  }

  console.log(JSON.stringify(stats, null, 2));
  await pool.end();
}

main().catch(async (err) => {
  console.error(err.stack || err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
