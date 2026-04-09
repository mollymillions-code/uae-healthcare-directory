#!/usr/bin/env node
/**
 * scrape-saudi-comprehensive.mjs
 * ===============================
 * Comprehensive Saudi Arabia healthcare provider scraper using Overpass API.
 *
 * Strategy:
 *   - Query ALL healthcare amenity types (hospital, clinic, pharmacy, dentist,
 *     doctors, laboratory, centre, etc.)
 *   - Split Saudi Arabia into 4 geographic quadrants to avoid timeouts
 *   - 30-second delays between queries to avoid rate limiting
 *   - 3 retries with exponential backoff per query
 *   - Arabic → English transliteration
 *   - Phone normalization (+966)
 *   - Deduplication by normalized name + coordinate proximity (100m)
 *
 * Run: node scripts/scrape-saudi-comprehensive.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../data/parsed/saudi_providers.json");

// =============================================================================
// CONFIGURATION
// =============================================================================

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const QUERY_TIMEOUT = 180; // seconds — Overpass server-side timeout
const FETCH_TIMEOUT = 300000; // ms — client-side fetch timeout (5 min)
const DELAY_BETWEEN_QUERIES = 30000; // ms — 30s between queries
const MAX_RETRIES = 3;
const USER_AGENT = "Zavis-Healthcare-Scraper/2.0 (zavis.ai)";

/**
 * Saudi Arabia split into 4 quadrants by lat/lng.
 * Full Saudi bounding box: lat 16–32, lng 36–56
 */
const QUADRANTS = [
  { name: "Northwest", latMin: 24, latMax: 32, lngMin: 36, lngMax: 43 },
  { name: "Northeast", latMin: 24, latMax: 32, lngMin: 43, lngMax: 56 },
  { name: "Southwest", latMin: 16, latMax: 24, lngMin: 36, lngMax: 43 },
  { name: "Southeast", latMin: 16, latMax: 24, lngMin: 43, lngMax: 56 },
];

/**
 * Amenity/healthcare types to query, with their Overpass key and value.
 */
const QUERY_TYPES = [
  { key: "amenity", value: "hospital" },
  { key: "amenity", value: "clinic" },
  { key: "amenity", value: "pharmacy" },
  { key: "amenity", value: "dentist" },
  { key: "amenity", value: "doctors" },
  { key: "healthcare", value: "laboratory" },
  { key: "healthcare", value: "clinic" },
  { key: "healthcare", value: "hospital" },
  { key: "healthcare", value: "pharmacy" },
  { key: "healthcare", value: "centre" },
];

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

function mapCategory(key, value) {
  if (key === "amenity" && value === "hospital") return "hospitals";
  if (key === "healthcare" && value === "hospital") return "hospitals";
  if (key === "amenity" && value === "clinic") return "clinics";
  if (key === "amenity" && value === "doctors") return "clinics";
  if (key === "healthcare" && value === "clinic") return "clinics";
  if (key === "healthcare" && value === "centre") return "clinics";
  if (key === "amenity" && value === "pharmacy") return "pharmacy";
  if (key === "healthcare" && value === "pharmacy") return "pharmacy";
  if (key === "amenity" && value === "dentist") return "dental";
  if (key === "healthcare" && value === "laboratory") return "labs-diagnostics";
  return "clinics";
}

function mapFacilityType(tags) {
  if (tags?.healthcare === "laboratory") return "Laboratory";
  if (tags?.amenity === "dentist") return "Dental Clinic";
  if (tags?.amenity === "pharmacy" || tags?.healthcare === "pharmacy") return "Pharmacy";
  if (tags?.amenity === "hospital" || tags?.healthcare === "hospital") {
    if (
      tags?.["operator:type"] === "government" ||
      tags?.operator?.toLowerCase()?.includes("ministry")
    )
      return "Government Hospital";
    return "Hospital";
  }
  if (tags?.amenity === "clinic" || tags?.amenity === "doctors" ||
      tags?.healthcare === "clinic" || tags?.healthcare === "centre") {
    return "Medical Clinic";
  }
  return "Healthcare Facility";
}

// =============================================================================
// CITY BOUNDING BOXES (expanded from fix-saudi-data.mjs + new cities)
// =============================================================================

const CITIES = [
  // --- Major cities ---
  { slug: "riyadh",           name: "Riyadh",            bbox: [24.45, 25.05, 46.40, 47.00] },
  { slug: "jeddah",           name: "Jeddah",            bbox: [21.30, 21.85, 39.00, 39.45] },
  { slug: "mecca",            name: "Mecca",             bbox: [21.30, 21.55, 39.70, 40.00] },
  { slug: "medina",           name: "Medina",            bbox: [24.30, 24.65, 39.45, 39.80] },
  { slug: "dammam",           name: "Dammam",            bbox: [26.30, 26.60, 49.85, 50.25] },
  { slug: "khobar",           name: "Khobar",            bbox: [26.15, 26.40, 50.10, 50.30] },
  { slug: "dhahran",          name: "Dhahran",           bbox: [26.25, 26.40, 50.05, 50.20] },
  { slug: "al-ahsa",          name: "Al Ahsa",           bbox: [25.20, 25.60, 49.40, 49.85] },
  { slug: "buraidah",         name: "Buraidah",          bbox: [26.20, 26.50, 43.80, 44.15] },
  { slug: "hail",             name: "Hail",              bbox: [27.40, 27.65, 41.55, 41.85] },
  { slug: "tabuk",            name: "Tabuk",             bbox: [28.25, 28.55, 36.45, 36.75] },
  { slug: "taif",             name: "Taif",              bbox: [21.15, 21.50, 40.30, 40.65] },
  { slug: "abha",             name: "Abha",              bbox: [18.10, 18.35, 42.40, 42.65] },
  { slug: "najran",           name: "Najran",            bbox: [17.40, 17.65, 44.10, 44.40] },
  { slug: "jazan",            name: "Jazan",             bbox: [16.80, 17.20, 42.50, 43.00] },

  // --- Secondary cities (from fix-saudi-data.mjs + user-requested additions) ---
  { slug: "khamis-mushait",   name: "Khamis Mushait",    bbox: [18.25, 18.45, 42.60, 42.85] },
  { slug: "jubail",           name: "Jubail",            bbox: [26.85, 27.15, 49.50, 49.80] },
  { slug: "yanbu",            name: "Yanbu",             bbox: [23.95, 24.20, 37.95, 38.25] },
  { slug: "al-qatif",         name: "Al Qatif",          bbox: [26.50, 26.75, 49.90, 50.15] },
  { slug: "hafar-al-batin",   name: "Hafar Al-Batin",    bbox: [28.30, 28.55, 45.85, 46.15] },
  { slug: "sakaka",           name: "Sakaka",            bbox: [29.70, 30.10, 39.90, 40.40] },
  { slug: "arar",             name: "Arar",              bbox: [30.90, 31.30, 40.90, 41.50] },
  { slug: "al-baha",          name: "Al Baha",           bbox: [19.90, 20.25, 41.30, 41.75] },
  { slug: "bisha",            name: "Bisha",             bbox: [19.40, 19.85, 41.80, 42.15] },
  { slug: "rabigh",           name: "Rabigh",            bbox: [22.70, 23.05, 38.95, 39.20] },
  { slug: "dawadmi",          name: "Dawadmi",           bbox: [24.35, 24.65, 44.30, 44.60] },
  { slug: "al-majmaah",       name: "Al Majmaah",        bbox: [25.75, 26.00, 45.20, 45.55] },
  { slug: "qunfudhah",        name: "Qunfudhah",         bbox: [19.00, 19.30, 40.95, 41.25] },
  { slug: "al-lith",          name: "Al Lith",           bbox: [20.05, 20.30, 40.10, 40.45] },
  { slug: "wadi-al-dawasir",  name: "Wadi Al-Dawasir",   bbox: [20.30, 20.65, 44.55, 45.05] },
  { slug: "turaif",           name: "Turaif",            bbox: [31.30, 31.60, 38.50, 38.85] },
  { slug: "al-kharj",         name: "Al Kharj",          bbox: [24.05, 24.30, 47.25, 47.55] },
  { slug: "unaizah",          name: "Unaizah",           bbox: [26.05, 26.22, 43.95, 44.15] },
  { slug: "al-rass",          name: "Al Rass",           bbox: [25.80, 26.00, 43.45, 43.65] },
  { slug: "al-zulfi",         name: "Al Zulfi",          bbox: [26.20, 26.35, 44.75, 44.95] },
  { slug: "shaqra",           name: "Shaqra",            bbox: [25.18, 25.35, 45.20, 45.45] },
  { slug: "afif",             name: "Afif",              bbox: [23.85, 24.10, 42.80, 43.05] },

  // --- Tertiary / smaller cities ---
  { slug: "khafji",           name: "Khafji",            bbox: [28.30, 28.55, 48.30, 48.60] },
  { slug: "al-qurayyat",      name: "Al Qurayyat",       bbox: [31.20, 31.50, 37.25, 37.55] },
  { slug: "sharurah",         name: "Sharurah",          bbox: [17.35, 17.60, 46.90, 47.25] },
  { slug: "turba",            name: "Turba",             bbox: [21.10, 21.35, 41.50, 41.80] },
  { slug: "al-muwayh",        name: "Al Muwayh",         bbox: [22.30, 22.55, 41.55, 41.85] },
  { slug: "nuairiyah",        name: "Nuairiyah",         bbox: [27.35, 27.60, 48.30, 48.60] },
  { slug: "al-sulayyil",      name: "Al Sulayyil",       bbox: [20.35, 20.60, 45.30, 45.70] },

  // --- Region-level catchalls (lower priority, checked last) ---
  { slug: "qassim",           name: "Qassim",            bbox: [25.80, 26.55, 43.45, 44.20] },
  { slug: "jazan-region",     name: "Jazan Region",      bbox: [16.40, 17.60, 42.00, 43.30] },
];

/**
 * Region lookup for providers that don't match any city.
 */
const REGIONS = [
  { name: "Riyadh",           lat: [23.0, 26.5], lng: [43.5, 47.5] },
  { name: "Mecca",            lat: [19.5, 23.0], lng: [38.5, 42.5] },
  { name: "Medina",           lat: [23.0, 27.0], lng: [36.5, 41.0] },
  { name: "Eastern",          lat: [24.0, 29.0], lng: [47.0, 51.5] },
  { name: "Qassim",           lat: [25.5, 27.0], lng: [42.0, 45.0] },
  { name: "Asir",             lat: [17.5, 20.0], lng: [41.5, 44.0] },
  { name: "Tabuk",            lat: [27.0, 29.5], lng: [34.5, 38.5] },
  { name: "Hail",             lat: [26.5, 28.5], lng: [40.0, 43.5] },
  { name: "Northern Borders", lat: [29.0, 32.0], lng: [38.0, 47.0] },
  { name: "Jazan",            lat: [16.0, 17.8], lng: [41.5, 43.5] },
  { name: "Najran",           lat: [17.0, 20.0], lng: [44.0, 48.5] },
  { name: "Al Jawf",          lat: [29.0, 32.0], lng: [37.0, 41.0] },
  { name: "Al Baha",          lat: [19.5, 20.5], lng: [41.0, 42.0] },
];

function resolveCity(lat, lng) {
  for (const city of CITIES) {
    const [south, north, west, east] = city.bbox;
    if (lat >= south && lat <= north && lng >= west && lng <= east) {
      return { slug: city.slug, name: city.name };
    }
  }
  return null;
}

function resolveRegion(lat, lng) {
  for (const region of REGIONS) {
    if (
      lat >= region.lat[0] && lat <= region.lat[1] &&
      lng >= region.lng[0] && lng <= region.lng[1]
    ) {
      return region.name;
    }
  }
  return null;
}

// =============================================================================
// ARABIC → ENGLISH TRANSLITERATION
// =============================================================================

/** Common Arabic healthcare term → English (from fix-saudi-data.mjs) */
const TERM_MAP = [
  { ar: "مستشفى", en: "Hospital" },
  { ar: "المستشفي", en: "Hospital" },
  { ar: "المستشفى", en: "Hospital" },
  { ar: "مستشفي", en: "Hospital" },
  { ar: "مستوصفات", en: "Dispensaries" },
  { ar: "مستوصف", en: "Dispensary" },
  { ar: "مركز صحي", en: "Health Center" },
  { ar: "مركز طبي", en: "Medical Center" },
  { ar: "مركز اسعاف", en: "Ambulance Center" },
  { ar: "مركز إسعاف", en: "Ambulance Center" },
  { ar: "المركز الصحي", en: "Health Center" },
  { ar: "المركز الطبي", en: "Medical Center" },
  { ar: "مركز الرعاية الصحية الأولية", en: "Primary Healthcare Center" },
  { ar: "مركز الرعاية الصحيه", en: "Healthcare Center" },
  { ar: "مركز الرعاية الأولية", en: "Primary Care Center" },
  { ar: "مركز رعاية صحية أولية", en: "Primary Healthcare Center" },
  { ar: "مركز", en: "Center" },
  { ar: "عيادات", en: "Clinics" },
  { ar: "عيادة", en: "Clinic" },
  { ar: "العيادات الخارجية", en: "Outpatient Clinics" },
  { ar: "صيدلية", en: "Pharmacy" },
  { ar: "صيدليات", en: "Pharmacies" },
  { ar: "مختبر", en: "Laboratory" },
  { ar: "مختبرات", en: "Laboratories" },
  { ar: "مجمع عيادات", en: "Polyclinic" },
  { ar: "مجمع", en: "Complex" },
  { ar: "مدينة", en: "City" },
  { ar: "إدارة المختبرات وبنوك الدم والمختبر الإقليمي وفحص ما قبل الزواج", en: "Regional Lab & Blood Bank Administration" },
  { ar: "إدارة", en: "Administration" },
  { ar: "الملك", en: "King" },
  { ar: "الأمير", en: "Prince" },
  { ar: "الأميرة", en: "Princess" },
  { ar: "الشيخ", en: "Sheikh" },
  { ar: "العام", en: "General" },
  { ar: "التخصصي", en: "Specialist" },
  { ar: "التخصصيه", en: "Specialist" },
  { ar: "التخصصية", en: "Specialist" },
  { ar: "الطبي", en: "Medical" },
  { ar: "الطبية", en: "Medical" },
  { ar: "الطبيه", en: "Medical" },
  { ar: "الوطني", en: "National" },
  { ar: "الوطنية", en: "National" },
  { ar: "المركزي", en: "Central" },
  { ar: "الجامعي", en: "University" },
  { ar: "الجناح الشرقي", en: "East Wing" },
  { ar: "الخاص", en: "Private" },
  { ar: "الجديد", en: "New" },
  { ar: "الأسنان", en: "Dental" },
  { ar: "للاسنان", en: "Dental" },
  { ar: "للأسنان", en: "Dental" },
  { ar: "النفسية", en: "Psychiatric" },
  { ar: "النفسي", en: "Psychiatric" },
  { ar: "للصحة النفسية", en: "Mental Health" },
  { ar: "طوارئ", en: "Emergency" },
  { ar: "النساء والولادة", en: "Obstetrics & Gynecology" },
  { ar: "أمراض الكلي", en: "Nephrology" },
  { ar: "أمراض الكلى", en: "Nephrology" },
  { ar: "العيون", en: "Ophthalmology" },
  { ar: "جراحة اليوم الواحد", en: "Day Surgery" },
  { ar: "للخدمات الانسانية", en: "Humanitarian Services" },
  { ar: "الخدمات الطبية", en: "Medical Services" },
  { ar: "الاحمر", en: "Red" },
  { ar: "الأحمر", en: "Red" },
  { ar: "السعودي", en: "Saudi" },
  { ar: "السعودية", en: "Saudi" },
  { ar: "الالماني", en: "German" },
  { ar: "الألماني", en: "German" },
  { ar: "الأهلي", en: "National" },
  { ar: "الاولية", en: "Primary" },
  { ar: "الأولية", en: "Primary" },
  { ar: "الصحية", en: "Health" },
  { ar: "الصحيه", en: "Health" },
  { ar: "صحي", en: "Health" },
  { ar: "صحى", en: "Health" },
  { ar: "العمود الفقري", en: "Spine" },
  { ar: "الاطفال", en: "Children" },
  { ar: "الأطفال", en: "Children" },
  { ar: "لسرطان", en: "Cancer" },
  { ar: "وجراحة", en: "& Surgery" },
  { ar: "القلب", en: "Heart" },
  { ar: "الشامل", en: "Comprehensive" },
  { ar: "التأهيل", en: "Rehabilitation" },
  { ar: "الوحدة الصحية", en: "Health Unit" },
  { ar: "للبنين", en: "for Boys" },
  { ar: "عالم الطب", en: "World of Medicine" },
  { ar: "منبر الهدى", en: "Minbar Al Huda" },
  { ar: "حكومي", en: "Government" },
  { ar: "طب الاسرة", en: "Family Medicine" },
  { ar: "ابن سيناء", en: "Ibn Sina" },
  { ar: "حراء", en: "Hiraa" },
  { ar: "ابن الهيثم", en: "Ibn Al-Haytham" },
  { ar: "الهلال الأحمر", en: "Red Crescent" },
  { ar: "الهلال الاحمر", en: "Red Crescent" },
  { ar: "هيئة الهلال الأحمر", en: "Red Crescent Authority" },
  { ar: "الحرس الوطني", en: "National Guard" },
  { ar: "القوات المسلحة", en: "Armed Forces" },
  { ar: "المواساة", en: "Al Mouwasat" },
  { ar: "الرعاية", en: "Al Raaya" },
  { ar: "الحياة", en: "Al Hayat" },
  { ar: "الأمل", en: "Al Amal" },
  { ar: "الشفاء", en: "Al Shifa" },
  { ar: "رعاية", en: "Raaya" },
  { ar: "نسمة عافية", en: "Nasmat Aafiya" },
  { ar: "بالدمام", en: "in Dammam" },
  { ar: "بالرياض", en: "in Riyadh" },
  { ar: "بجدة", en: "in Jeddah" },
  { ar: "بحائل", en: "in Hail" },
  { ar: "بالمنطقة الشمالية", en: "Northern Region" },
  { ar: "بن", en: "bin" },
  { ar: "بالعمران", en: "Al Omran" },
  { ar: "بمليجة", en: "Mulayjah" },
  { ar: "بعريعرة", en: "Araira" },
];

/** Well-known Arabic place names → English */
const PLACE_NAMES = {
  "الرياض": "Riyadh",
  "جدة": "Jeddah",
  "مكة": "Mecca",
  "المدينة": "Medina",
  "الدمام": "Dammam",
  "الخبر": "Khobar",
  "الأحساء": "Al Ahsa",
  "حائل": "Hail",
  "تبوك": "Tabuk",
  "أبها": "Abha",
  "الطائف": "Taif",
  "نجران": "Najran",
  "عنيزة": "Unizah",
  "بريدة": "Buraidah",
  "القصيم": "Qassim",
  "ينبع": "Yanbu",
  "الجبيل": "Jubail",
  "الظهران": "Dhahran",
  "خميس مشيط": "Khamis Mushait",
  "سكاكا": "Sakaka",
  "عرعر": "Arar",
  "حفر الباطن": "Hafar Al-Batin",
  "القطيف": "Al Qatif",
  "رابغ": "Rabigh",
  "بيشة": "Bisha",
  "المجمعة": "Al Majmaah",
  "شرورة": "Sharurah",
  "الليث": "Al Lith",
  "القنفذة": "Qunfudhah",
  "طريف": "Turaif",
  "الباحة": "Al Baha",
  "الدوادمي": "Dawadmi",
  "جيزان": "Jazan",
  "جازان": "Jazan",
  "صبيا": "Sabya",
  "بيش": "Bish",
  "أحد المسارحة": "Ahad Al Masarihah",
  "فرسان": "Farasan",
  "المبرز": "Al Mubarraz",
  "الهفوف": "Al Hofuf",
  "تربة": "Turba",
  "البكيرية": "Al Bukairiyah",
  "عيون الجواء": "Uyun Al Jiwa",
  "النبهانية": "Al Nabhaniyah",
  "الخفجي": "Khafji",
  "القريات": "Al Qurayyat",
  "العويقيلة": "Al Uwayqilah",
  "طبرجل": "Tabargal",
  "حقل": "Haql",
  "ضباء": "Duba",
  "الوجه": "Al Wajh",
  "تيماء": "Tayma",
  "تمير": "Tumair",
  "حريملاء": "Huraymila",
  "منى": "Mina",
  "الموية": "Al Muwayh",
  "السليل": "Al Sulayyil",
  "بدر": "Badr",
  "مرات": "Marat",
  "الغاط": "Al Ghat",
  "الحليفة": "Al Haleefah",
  "عقلة الصقور": "Uqlat Al Suqur",
  "المهد": "Al Mahd",
  "نفي": "Nifi",
  "الأرطاوية": "Al Artawiyah",
  "الخرمة": "Al Khurmah",
  "عفيف": "Afif",
  "حوطة سدير": "Hawtat Sudayr",
  "ضرية": "Dariyah",
  "الخرج": "Al Kharj",
  "فهد": "Fahd",
  "سعود": "Saud",
  "عبدالعزيز": "Abdulaziz",
  "عبدالمحسن": "Abdulmohsen",
  "عبدالرحمن": "Abdulrahman",
  "سلطان": "Sultan",
  "خالد": "Khalid",
  "فيصل": "Faisal",
  "محمد": "Mohammed",
  "عبدالله": "Abdullah",
  "سلمان": "Salman",
  "نورة": "Noura",
  "نور": "Noor",
  "حسن": "Hassan",
  "الدكتور": "Dr.",
  "دلة": "Dallah",
  "المانع": "Al Mana",
};

/** Arabic letter → Latin romanization */
const CHAR_MAP = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "a",
  "ب": "b", "ت": "t", "ث": "th", "ج": "j",
  "ح": "h", "خ": "kh", "د": "d", "ذ": "dh",
  "ر": "r", "ز": "z", "س": "s", "ش": "sh",
  "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "q",
  "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a",
  "ة": "a", "ء": "'", "ئ": "'", "ؤ": "'",
  "\u064B": "", "\u064C": "", "\u064D": "", "\u064E": "",
  "\u064F": "", "\u0650": "", "\u0651": "", "\u0652": "",
  "لا": "la",
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasArabic(str) {
  return /[\u0600-\u06FF]/.test(str);
}

function isArabicOnly(str) {
  return hasArabic(str) && !/[a-zA-Z]/.test(str);
}

/**
 * Transliterate an Arabic string to Latin characters.
 * 1. Replace known terms (facility types, titles, place names) with English
 * 2. Romanize remaining Arabic characters letter-by-letter
 * 3. Clean up spacing and capitalization
 */
function transliterateArabic(arabicName) {
  let result = arabicName.trim();

  // Build combined term list sorted by length (longest first)
  const allTerms = [...TERM_MAP.map(t => ({ ar: t.ar, en: t.en }))];
  for (const [ar, en] of Object.entries(PLACE_NAMES)) {
    allTerms.push({ ar, en });
  }
  allTerms.sort((a, b) => b.ar.length - a.ar.length);

  for (const { ar, en } of allTerms) {
    if (result.includes(ar)) {
      result = result.replace(new RegExp(escapeRegex(ar), "g"), ` ${en} `);
    }
  }

  // Romanize remaining Arabic characters
  let romanized = "";
  for (const char of result) {
    if (CHAR_MAP[char] !== undefined) {
      romanized += CHAR_MAP[char];
    } else if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(char)) {
      romanized += "";
    } else {
      romanized += char;
    }
  }

  // Clean up
  romanized = romanized
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

  romanized = romanized
    .replace(/\bAl\s+/g, "Al ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s*-\s+/g, " - ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Clean stray Arabic transliteration artifacts
  romanized = romanized
    .replace(/\bBal\b/g, "")
    .replace(/\bB\s+/g, "")
    .replace(/\bBa\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Reorder: move facility type from start to end for natural English
  const facilityPrefixes = [
    "Primary Healthcare Center", "Primary Care Center", "Healthcare Center",
    "Outpatient Clinics", "Ambulance Center", "Health Center", "Medical Center",
    "Health Unit", "Day Surgery Center",
    "Hospital", "Dispensary", "Dispensaries", "Clinic", "Clinics",
    "Pharmacy", "Pharmacies", "Laboratory", "Laboratories",
    "Polyclinic", "Complex", "Center", "Emergency",
  ];
  for (const prefix of facilityPrefixes) {
    if (romanized.startsWith(prefix + " ") && romanized.length > prefix.length + 1) {
      const rest = romanized.slice(prefix.length + 1).trim();
      if (rest && !/^(General|National|Central|Private|Specialist|Medical|New)$/i.test(rest)) {
        romanized = `${rest} ${prefix}`;
        break;
      }
    }
  }

  return romanized;
}

// =============================================================================
// PHONE NORMALIZATION
// =============================================================================

function normalizePhone(phone) {
  if (!phone) return undefined;

  // Handle multiple phones separated by ; or ,
  const phones = phone.split(/[;,]/).map(p => p.trim()).filter(Boolean);
  const normalized = phones.map(p => {
    let cleaned = p.replace(/[\s\-().]/g, "");
    // Already international
    if (cleaned.startsWith("+966")) return cleaned;
    if (cleaned.startsWith("00966")) return "+" + cleaned.slice(2);
    // Local Saudi number starting with 0
    if (cleaned.startsWith("0") && cleaned.length >= 9) {
      return "+966" + cleaned.slice(1);
    }
    // 9-digit number without prefix
    if (/^\d{9}$/.test(cleaned)) {
      return "+966" + cleaned;
    }
    // Already has + prefix from another country
    if (cleaned.startsWith("+")) return cleaned;
    return p; // return original if can't normalize
  });

  return normalized.join("; ");
}

// =============================================================================
// OVERPASS API QUERIES
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Query a single amenity/healthcare type in a single quadrant.
 * Uses bounding box to limit the query scope.
 */
async function queryOverpass(queryType, quadrant, attempt = 1) {
  const bbox = `${quadrant.latMin},${quadrant.lngMin},${quadrant.latMax},${quadrant.lngMax}`;
  const query = `[out:json][timeout:${QUERY_TIMEOUT}];
(
  node["${queryType.key}"="${queryType.value}"](${bbox});
  way["${queryType.key}"="${queryType.value}"](${bbox});
  relation["${queryType.key}"="${queryType.value}"](${bbox});
);
out body center;`;

  try {
    const resp = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (resp.status === 429 || resp.status === 504) {
      throw new Error(`HTTP ${resp.status} (rate limited or timeout)`);
    }
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data.elements || [];
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const backoff = attempt * 30000; // 30s, 60s, 90s
      console.log(`    RETRY ${attempt}/${MAX_RETRIES} for ${queryType.key}=${queryType.value} in ${quadrant.name} (waiting ${backoff / 1000}s): ${err.message}`);
      await sleep(backoff);
      return queryOverpass(queryType, quadrant, attempt + 1);
    }
    throw err;
  }
}

/**
 * Parse raw Overpass elements into provider objects.
 */
function parseElements(elements, queryType) {
  const results = [];
  for (const el of elements) {
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    const tags = el.tags || {};

    // Get name — prefer English, fall back to Arabic, then any name
    let name = tags["name:en"] || tags.name || tags["name:ar"] || "";
    let nameAr = tags["name:ar"] || undefined;

    if (!name || !lat || !lng) continue;

    // Transliterate Arabic-only names
    if (isArabicOnly(name)) {
      nameAr = name;
      name = transliterateArabic(name);
    } else if (hasArabic(name) && !nameAr) {
      nameAr = name;
    }

    // Skip if name is still empty after transliteration
    if (!name.trim()) continue;

    // Resolve city
    const city = resolveCity(lat, lng);
    const region = city ? undefined : resolveRegion(lat, lng);

    // Build address
    const address = [
      tags["addr:street"],
      tags["addr:city"],
      tags["addr:postcode"],
    ].filter(Boolean).join(", ") || undefined;

    // Normalize phone
    const phone = normalizePhone(tags.phone || tags["contact:phone"]) || undefined;

    results.push({
      name: name.trim(),
      nameAr: nameAr?.trim() || undefined,
      country: "sa",
      city: city?.slug || "other",
      cityName: city?.name || (region ? `${region} Region` : "Other"),
      region: region || undefined,
      category: mapCategory(queryType.key, queryType.value),
      address,
      phone,
      website: tags.website || tags["contact:website"] || undefined,
      facilityType: mapFacilityType(tags),
      operatingHours: tags.opening_hours || undefined,
      lat,
      lng,
      source: "OSM/Overpass",
      osmId: `${el.type}/${el.id}`,
    });
  }
  return results;
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Haversine distance in meters between two lat/lng points.
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalize a name for deduplication comparison.
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deduplicate providers by:
 * 1. Exact normalized name match → merge (keep the one with more data)
 * 2. Similar name + within 100m → merge
 */
function deduplicate(providers) {
  const deduped = [];
  const used = new Set();

  // Sort by data richness (more fields = better) to prefer richer records
  const scored = providers.map((p, i) => {
    let score = 0;
    if (p.phone) score += 2;
    if (p.website) score += 2;
    if (p.address) score += 1;
    if (p.nameAr) score += 1;
    if (p.operatingHours) score += 1;
    return { provider: p, index: i, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Index by normalized name for fast lookup
  const byName = new Map();
  for (const item of scored) {
    const key = normalizeName(item.provider.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(item);
  }

  for (const item of scored) {
    if (used.has(item.index)) continue;

    const p = item.provider;
    const key = normalizeName(p.name);

    // Check all items with same normalized name
    const sameNameItems = byName.get(key) || [];
    for (const other of sameNameItems) {
      if (other.index === item.index || used.has(other.index)) continue;
      const dist = haversineMeters(p.lat, p.lng, other.provider.lat, other.provider.lng);
      if (dist < 100) {
        // Merge: absorb data from the duplicate
        if (!p.phone && other.provider.phone) p.phone = other.provider.phone;
        if (!p.website && other.provider.website) p.website = other.provider.website;
        if (!p.address && other.provider.address) p.address = other.provider.address;
        if (!p.nameAr && other.provider.nameAr) p.nameAr = other.provider.nameAr;
        if (!p.operatingHours && other.provider.operatingHours) p.operatingHours = other.provider.operatingHours;
        used.add(other.index);
      }
    }

    used.add(item.index);
    deduped.push(p);
  }

  return deduped;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("=== Saudi Arabia Comprehensive Healthcare Scraper ===");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Query types: ${QUERY_TYPES.length}`);
  console.log(`Quadrants: ${QUADRANTS.length}`);
  console.log(`Total queries planned: ${QUERY_TYPES.length * QUADRANTS.length}`);
  console.log(`Delay between queries: ${DELAY_BETWEEN_QUERIES / 1000}s`);
  console.log("");

  let allProviders = [];
  let queryCount = 0;
  let failCount = 0;
  const totalQueries = QUERY_TYPES.length * QUADRANTS.length;

  for (const queryType of QUERY_TYPES) {
    for (const quadrant of QUADRANTS) {
      queryCount++;

      // Wait between queries (skip first)
      if (queryCount > 1) {
        console.log(`  [${queryCount}/${totalQueries}] Waiting ${DELAY_BETWEEN_QUERIES / 1000}s before next query...`);
        await sleep(DELAY_BETWEEN_QUERIES);
      }

      const label = `${queryType.key}=${queryType.value}`;
      console.log(`  [${queryCount}/${totalQueries}] Querying ${label} in ${quadrant.name} (lat ${quadrant.latMin}-${quadrant.latMax}, lng ${quadrant.lngMin}-${quadrant.lngMax})...`);

      try {
        const elements = await queryOverpass(queryType, quadrant);
        const parsed = parseElements(elements, queryType);
        console.log(`    Found ${elements.length} elements → ${parsed.length} valid providers`);
        allProviders.push(...parsed);
      } catch (err) {
        console.error(`    ERROR: ${label} in ${quadrant.name} failed after ${MAX_RETRIES} retries: ${err.message}`);
        failCount++;
        // Continue with other queries
      }
    }
  }

  console.log("");
  console.log(`=== Scraping complete ===`);
  console.log(`Queries: ${queryCount} total, ${failCount} failed`);
  console.log(`Raw providers collected: ${allProviders.length}`);
  console.log("");

  if (allProviders.length === 0) {
    console.error("ERROR: No data collected. Exiting.");
    process.exit(1);
  }

  // --- Deduplication ---
  console.log("Deduplicating...");
  const deduped = deduplicate(allProviders);
  console.log(`After deduplication: ${deduped.length} (removed ${allProviders.length - deduped.length} duplicates)`);
  console.log("");

  // --- Clean undefined fields ---
  const cleaned = deduped.map((p) => {
    const out = {};
    for (const [k, v] of Object.entries(p)) {
      if (v !== undefined && v !== "") out[k] = v;
    }
    return out;
  });

  // --- Summary statistics ---
  const cityStats = {};
  const catStats = {};
  const regionStats = {};

  for (const p of cleaned) {
    cityStats[p.cityName || p.city] = (cityStats[p.cityName || p.city] || 0) + 1;
    catStats[p.category] = (catStats[p.category] || 0) + 1;
    if (p.region) regionStats[p.region] = (regionStats[p.region] || 0) + 1;
  }

  console.log("--- By Category ---");
  Object.entries(catStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  console.log("");
  console.log("--- By City (top 40) ---");
  Object.entries(cityStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  const totalCities = Object.keys(cityStats).length;
  if (totalCities > 40) {
    console.log(`  ... and ${totalCities - 40} more cities`);
  }

  if (Object.keys(regionStats).length > 0) {
    console.log("");
    console.log("--- Unmatched (by region) ---");
    Object.entries(regionStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([r, n]) => console.log(`  ${r}: ${n}`));
  }

  // --- Data quality stats ---
  const withPhone = cleaned.filter((p) => p.phone).length;
  const withWebsite = cleaned.filter((p) => p.website).length;
  const withAddress = cleaned.filter((p) => p.address).length;
  const withArabicName = cleaned.filter((p) => p.nameAr).length;
  const inOther = cleaned.filter((p) => p.city === "other").length;

  console.log("");
  console.log("--- Data Quality ---");
  console.log(`  With phone: ${withPhone} (${((withPhone / cleaned.length) * 100).toFixed(1)}%)`);
  console.log(`  With website: ${withWebsite} (${((withWebsite / cleaned.length) * 100).toFixed(1)}%)`);
  console.log(`  With address: ${withAddress} (${((withAddress / cleaned.length) * 100).toFixed(1)}%)`);
  console.log(`  With Arabic name: ${withArabicName} (${((withArabicName / cleaned.length) * 100).toFixed(1)}%)`);
  console.log(`  In "other" city: ${inOther} (${((inOther / cleaned.length) * 100).toFixed(1)}%)`);

  // --- Write output ---
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(cleaned, null, 2));
  console.log("");
  console.log(`Written ${cleaned.length} providers to ${OUTPUT_PATH}`);
  console.log(`Finished at: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
