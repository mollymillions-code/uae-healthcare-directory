#!/usr/bin/env node
/**
 * fix-saudi-data.mjs
 * ------------------
 * Fixes data quality issues in data/parsed/saudi_providers.json (930 records):
 *   1. Arabic-only names (699) → transliterate to English, keep Arabic in nameAr
 *   2. Generic/meaningless names (6) → disambiguate with city name
 *   3. "other" city (382) → expand bounding boxes for 18+ new cities, assign region
 *   4. Phone normalization (28) → add +966 prefix
 *   5. Remove near-duplicates (same name+city or very close location with subset names)
 *   6. Category verification
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/parsed/saudi_providers.json");

// --- Load data ---
const raw = readFileSync(DATA_PATH, "utf-8");
const providers = JSON.parse(raw);
const totalBefore = providers.length;

// --- Counters ---
const stats = {
  arabicTransliterated: 0,
  genericDisambiguated: 0,
  cityReassigned: 0,
  cityRegionAdded: 0,
  phoneNormalized: 0,
  duplicatesRemoved: 0,
  categoriesVerified: 0,
};

const detailedLog = [];

// =============================================================================
// 1. ARABIC TRANSLITERATION
// =============================================================================

/** Common Arabic healthcare term → English */
const TERM_MAP = [
  // Facility types (order matters — longer/more specific first)
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

  // Titles & royalty
  { ar: "الملك", en: "King" },
  { ar: "الأمير", en: "Prince" },
  { ar: "الأميرة", en: "Princess" },
  { ar: "الشيخ", en: "Sheikh" },

  // Common descriptors
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

  // Medical specialties
  { ar: "طوارئ", en: "Emergency" },
  { ar: "النساء والولادة", en: "Obstetrics & Gynecology" },
  { ar: "أمراض الكلي", en: "Nephrology" },
  { ar: "أمراض الكلى", en: "Nephrology" },
  { ar: "العيون", en: "Ophthalmology" },
  { ar: "جراحة اليوم الواحد", en: "Day Surgery" },
  { ar: "للخدمات الانسانية", en: "Humanitarian Services" },
  { ar: "الخدمات الطبية", en: "Medical Services" },

  // Common Arabic words that appear without hamza/diacritics
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

  // Common facility-related words
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

  // Organizations
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

  // Possessives and connectors
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
  // Diacritics (tashkeel) — strip them
  "\u064B": "", "\u064C": "", "\u064D": "", "\u064E": "",
  "\u064F": "", "\u0650": "", "\u0651": "", "\u0652": "",
  // Common ligatures
  "لا": "la",
};

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
  "الدحو": "Al Dahw",
  "الخرمة": "Al Khurmah",
  "عفيف": "Afif",
  "حوطة سدير": "Hawtat Sudayr",
  "البجادية": "Al Bajadiyah",
  "ضرية": "Dariyah",
  "قبة": "Qubba",
  "الشنان": "Al Shinan",
  "سميراء": "Sumayrah",
  "وثيلان": "Wathilan",
  "العريقين": "Al Areeqain",
  "خباش": "Khabash",
  "حبونا": "Habuna",
  "يدمة": "Yadamah",
  "ضليع رشيد": "Dhulayy Rashid",
  "المظيلف": "Al Muzaylif",
  "الحوية": "Al Hawiyah",
  "بني مالك": "Bani Malik",
  "صوير": "Suwayr",
  "موقق": "Mawqaq",
  "بقعاء": "Baqa'a",
  "قصيباء": "Qusaiba",
  "الغزالة": "Al Ghazala",
  "سلوى": "Salwa",
  "البطحاء": "Al Batha",
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
  "فارس": "Fares",
  "الهداج": "Al Haddaj",
  "غسان": "Ghassan",
  "نجيب": "Najib",
  "فرعون": "Pharaon",
  "دلة": "Dallah",
  "المانع": "Al Mana",
  "المعالي": "Al Maali",
  "الزقزوق": "Al Zaqzouq",
  "المملكة": "Al Mamlaka",
  "الرواد": "Al Ruwwad",
  "القمة": "Al Qimma",
  "الفليو": "Al Felew",
  "أستر سند": "Aster Sanad",
  "الأسرة": "Al Usra",
  "العمران": "Al Omran",
  "الحسو": "Al Hasu",
  "الرفيعة": "Al Rufa'ah",
  "العليا": "Al Olaya",
  "مجموعة الحكمي الطبية": "Al Hakimi Medical Group",
  "نمرة": "Nimra",
  "الوعلان": "Al Waalan",
  "برج الدواء": "Pharmacy Tower",
  "عيتدتي": "Ayatdati",
  "نون": "Noon",
  "الصلب": "Al Sulb",
  "الصفة": "Al Safa",
  "الرديفة": "Al Rudayfah",
  "الخشيبي": "Al Khushaibi",
  "البسيتين": "Al Busaytin",
  "الجوي": "Al Jawi",
  "النخيل": "Al Nakheel",
  "البادرية": "Al Badriyah",
  "الوسيع": "Al Wasia",
  "المضحاه": "Al Mudhah",
  "النويعمة": "Al Nuwaimah",
  "الربيعية": "Al Rubaiyah",
  "البديع": "Al Badi",
  "ديحمة": "Deehma",
  "سامودة": "Samoudah",
  "أم سدرة": "Umm Sidrah",
  "شوية": "Shuwayya",
  "غامد الزناد": "Ghamid Al Zinad",
  "حزرة الجديد": "Hazra Al Jadeed",
  "حي قرطبة": "Qurtuba District",
  "الشرق": "Al Sharq",
  "حي عبدالله فؤاد": "Abdullah Fouad District",
  "عقلة بن داني": "Uqlat bin Dani",
  "البكرة": "Al Bukra",
  "النمرية": "Al Namriyyah",
  "الأسياح": "Al Asyah",
  "مركز هيئة": "Authority Center",
  "عيون": "Uyun",
  "الحديثة": "Al Haditha",
  "علقان": "Alqan",
  "الخرار": "Al Kharrar",
};

/**
 * Transliterate an Arabic string to Latin characters.
 * Strategy:
 *   1. Replace known terms (facility types, titles, place names) with English
 *   2. Romanize remaining Arabic characters letter-by-letter
 *   3. Clean up spacing and capitalization
 */
function transliterateArabic(arabicName) {
  let result = arabicName.trim();

  // First pass: replace known multi-word terms (longest first to avoid partial matches)
  const allTerms = [...TERM_MAP.map(t => ({ ar: t.ar, en: t.en }))];
  // Add place names
  for (const [ar, en] of Object.entries(PLACE_NAMES)) {
    allTerms.push({ ar, en });
  }
  // Sort by Arabic string length descending so longer matches take priority
  allTerms.sort((a, b) => b.ar.length - a.ar.length);

  for (const { ar, en } of allTerms) {
    if (result.includes(ar)) {
      result = result.replace(new RegExp(escapeRegex(ar), "g"), ` ${en} `);
    }
  }

  // Second pass: romanize any remaining Arabic characters
  let romanized = "";
  for (const char of result) {
    if (CHAR_MAP[char] !== undefined) {
      romanized += CHAR_MAP[char];
    } else if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(char)) {
      // Unknown Arabic character — skip (diacritics, etc.)
      romanized += "";
    } else {
      romanized += char;
    }
  }

  // Clean up: collapse spaces, trim, capitalize words
  romanized = romanized
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

  // Fix "Al -" → "Al-" and other connector issues
  romanized = romanized
    .replace(/\bAl\s+/g, "Al ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s*-\s+/g, " - ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Remove stray Arabic preposition artifacts: "B " at start of words (from ب)
  romanized = romanized
    .replace(/\bBal\b/g, "")
    .replace(/\bB\s+/g, "")
    .replace(/\bBa\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Reorder: move facility type from start to end for natural English
  // "Hospital King Saud General" → "King Saud General Hospital"
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
      // Don't reorder if the rest is just a descriptor like "General" or "National"
      if (rest && !/^(General|National|Central|Private|Specialist|Medical|New)$/i.test(rest)) {
        romanized = `${rest} ${prefix}`;
        break;
      }
    }
  }

  return romanized;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasArabic(str) {
  return /[\u0600-\u06FF]/.test(str);
}

function isArabicOnly(str) {
  // Contains Arabic and no Latin letters
  return hasArabic(str) && !/[a-zA-Z]/.test(str);
}

// =============================================================================
// 2. EXPANDED SAUDI CITY BOUNDING BOXES
// =============================================================================

/**
 * Bounding boxes: [south, north, west, east]
 * Each box is generous (~0.2-0.5 deg) to catch surrounding areas.
 */
const EXPANDED_CITIES = [
  // ---- Existing cities (from the data) ----
  { slug: "riyadh",         name: "Riyadh",          bbox: [24.45, 24.95, 46.45, 46.95] },
  { slug: "jeddah",         name: "Jeddah",          bbox: [21.35, 21.80, 39.05, 39.40] },
  { slug: "mecca",          name: "Mecca",            bbox: [21.30, 21.55, 39.70, 40.00] },
  { slug: "medina",         name: "Medina",           bbox: [24.35, 24.60, 39.45, 39.75] },
  { slug: "dammam",         name: "Dammam",           bbox: [26.30, 26.60, 49.90, 50.25] },
  { slug: "khobar",         name: "Khobar",           bbox: [26.20, 26.40, 50.10, 50.30] },
  { slug: "dhahran",        name: "Dhahran",          bbox: [26.28, 26.40, 50.08, 50.20] },
  { slug: "al-ahsa",        name: "Al Ahsa",          bbox: [25.25, 25.55, 49.45, 49.80] },
  { slug: "buraidah",       name: "Buraidah",         bbox: [26.20, 26.50, 43.80, 44.10] },
  { slug: "hail",           name: "Hail",             bbox: [27.45, 27.65, 41.55, 41.80] },
  { slug: "tabuk",          name: "Tabuk",            bbox: [28.30, 28.50, 36.45, 36.70] },
  { slug: "taif",           name: "Taif",             bbox: [21.15, 21.50, 40.30, 40.60] },
  { slug: "abha",           name: "Abha",             bbox: [18.15, 18.30, 42.40, 42.65] },
  { slug: "khamis-mushait", name: "Khamis Mushait",   bbox: [18.25, 18.40, 42.60, 42.80] },
  { slug: "najran",         name: "Najran",           bbox: [17.45, 17.60, 44.10, 44.40] },
  { slug: "jubail",         name: "Jubail",           bbox: [26.90, 27.15, 49.50, 49.75] },
  { slug: "yanbu",          name: "Yanbu",            bbox: [23.95, 24.20, 37.95, 38.25] },

  // ---- New cities to reduce "other" ----
  { slug: "qassim",         name: "Qassim",           bbox: [25.80, 26.55, 43.45, 44.20], region: "Qassim" },
  { slug: "al-qatif",       name: "Al Qatif",         bbox: [26.50, 26.70, 49.90, 50.15], region: "Eastern" },
  { slug: "hafar-al-batin", name: "Hafar Al-Batin",   bbox: [28.30, 28.55, 45.85, 46.10], region: "Eastern" },
  { slug: "sakaka",         name: "Sakaka",           bbox: [29.70, 30.10, 39.90, 40.40], region: "Al Jawf" },
  { slug: "arar",           name: "Arar",             bbox: [30.90, 31.30, 40.90, 41.50], region: "Northern Borders" },
  { slug: "al-baha",        name: "Al Baha",          bbox: [19.90, 20.20, 41.30, 41.75], region: "Al Baha" },
  { slug: "bisha",          name: "Bisha",            bbox: [19.40, 19.80, 41.80, 42.10], region: "Asir" },
  { slug: "rabigh",         name: "Rabigh",           bbox: [22.70, 23.00, 39.00, 39.15], region: "Mecca" },
  { slug: "dawadmi",        name: "Dawadmi",          bbox: [24.40, 24.65, 44.30, 44.60], region: "Riyadh" },
  { slug: "al-majmaah",     name: "Al Majmaah",       bbox: [25.75, 26.00, 45.20, 45.50], region: "Riyadh" },
  { slug: "qunfudhah",      name: "Qunfudhah",        bbox: [19.00, 19.25, 40.95, 41.20], region: "Mecca" },
  { slug: "al-lith",        name: "Al Lith",          bbox: [20.05, 20.25, 40.15, 40.40], region: "Mecca" },
  { slug: "wadi-al-dawasir", name: "Wadi Al-Dawasir", bbox: [20.30, 20.60, 44.60, 45.00], region: "Riyadh" },
  { slug: "sharurah",       name: "Sharurah",         bbox: [17.35, 17.60, 46.90, 47.25], region: "Najran" },
  { slug: "turaif",         name: "Turaif",           bbox: [31.35, 31.55, 38.55, 38.80], region: "Northern Borders" },
  { slug: "khafji",         name: "Khafji",           bbox: [28.30, 28.55, 48.35, 48.60], region: "Eastern" },
  { slug: "jazan",          name: "Jazan",            bbox: [16.80, 17.20, 42.50, 43.00], region: "Jazan" },
  { slug: "jazan-region",   name: "Jazan Region",     bbox: [16.40, 17.60, 42.00, 43.30], region: "Jazan" },
  { slug: "al-qurayyat",    name: "Al Qurayyat",      bbox: [31.20, 31.50, 37.25, 37.55], region: "Al Jawf" },

  // More towns in the Taif/Mecca extended region
  { slug: "turba",          name: "Turba",            bbox: [21.10, 21.35, 41.50, 41.80], region: "Mecca" },
  { slug: "al-muwayh",      name: "Al Muwayh",        bbox: [22.30, 22.55, 41.60, 41.85], region: "Mecca" },

  // Nuairiyah / eastern satellite towns
  { slug: "nuairiyah",      name: "Nuairiyah",        bbox: [27.35, 27.60, 48.30, 48.60], region: "Eastern" },
  { slug: "al-jubail-industrial", name: "Al Jubail Industrial", bbox: [26.85, 27.20, 49.50, 49.80], region: "Eastern" },

  // NEOM area
  { slug: "neom",           name: "NEOM",             bbox: [27.80, 28.20, 35.00, 35.50], region: "Tabuk" },

  // Al Sulayyil (south Riyadh region)
  { slug: "al-sulayyil",    name: "Al Sulayyil",      bbox: [20.35, 20.60, 45.30, 45.70], region: "Riyadh" },

  // Unizah (Qassim)
  { slug: "unizah",         name: "Unizah",           bbox: [26.05, 26.20, 43.95, 44.15], region: "Qassim" },
];

/** Region lookup by coordinate (very broad — covers all of Saudi Arabia) */
const SAUDI_REGIONS = [
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

function findCity(lat, lng) {
  for (const city of EXPANDED_CITIES) {
    const [south, north, west, east] = city.bbox;
    if (lat >= south && lat <= north && lng >= west && lng <= east) {
      return city;
    }
  }
  return null;
}

function findRegion(lat, lng) {
  for (const region of SAUDI_REGIONS) {
    if (lat >= region.lat[0] && lat <= region.lat[1] &&
        lng >= region.lng[0] && lng <= region.lng[1]) {
      return region.name;
    }
  }
  return null;
}

// =============================================================================
// PROCESSING
// =============================================================================

// --- Step 1: Arabic transliteration ---
for (const p of providers) {
  if (isArabicOnly(p.name)) {
    const original = p.name;
    p.nameAr = original;
    p.name = transliterateArabic(original);
    stats.arabicTransliterated++;
    detailedLog.push(`  TRANSLITERATE: "${original}" → "${p.name}"`);
  } else if (hasArabic(p.name) && /[a-zA-Z]/.test(p.name)) {
    // Mixed Arabic+English — keep English parts, transliterate Arabic parts
    // Only set nameAr if not already set
    if (!p.nameAr) {
      p.nameAr = p.name;
    }
  }
}

// --- Step 2: Generic name disambiguation ---
const GENERIC_NAMES = ["مركز صحي", "مستوصف", "Health Center", "Dispensary"];

for (const p of providers) {
  const nameNorm = p.name.trim();
  if (GENERIC_NAMES.includes(nameNorm)) {
    const cityLabel = p.cityName || p.city;
    const oldName = p.name;
    p.name = `${nameNorm} - ${cityLabel}`;
    stats.genericDisambiguated++;
    detailedLog.push(`  DISAMBIGUATE: "${oldName}" → "${p.name}" (city: ${cityLabel})`);
  }
}

// --- Step 3: Reassign "other" city providers ---
const otherBefore = providers.filter(r => r.city === "other").length;

for (const p of providers) {
  if (p.city === "other") {
    const match = findCity(p.lat, p.lng);
    if (match) {
      const oldCity = p.city;
      p.city = match.slug;
      p.cityName = match.name;
      stats.cityReassigned++;
      detailedLog.push(`  CITY REASSIGN: "${p.name}" other → ${match.slug} (${match.name})`);
    } else {
      // Still unmatched — add region to address
      const region = findRegion(p.lat, p.lng);
      if (region) {
        const regionSuffix = `, ${region} Region, Saudi Arabia`;
        if (!p.address) {
          p.address = `${region} Region, Saudi Arabia`;
        } else if (!p.address.includes(region)) {
          p.address += regionSuffix;
        }
        p.cityName = `Other (${region})`;
        stats.cityRegionAdded++;
        detailedLog.push(`  REGION TAG: "${p.name}" → region: ${region} (still "other")`);
      }
    }
  }
}

// --- Step 4: Phone normalization ---
for (const p of providers) {
  if (!p.phone) continue;

  let phone = p.phone.trim();
  const original = phone;

  // Remove spaces, dashes, dots (but keep + and digits)
  phone = phone.replace(/[\s\-\.()]/g, "");

  // Handle prefix "t" (typo in "t920002770")
  if (phone.startsWith("t")) {
    phone = phone.slice(1);
  }

  // Already has +966
  if (phone.startsWith("+966")) {
    p.phone = phone;
    if (phone !== original) {
      stats.phoneNormalized++;
      detailedLog.push(`  PHONE CLEAN: "${original}" → "${phone}"`);
    }
    continue;
  }

  // Handle 00966 prefix → +966
  if (phone.startsWith("00966")) {
    phone = "+" + phone.slice(2);
    p.phone = phone;
    stats.phoneNormalized++;
    detailedLog.push(`  PHONE FIX: "${original}" → "${phone}"`);
    continue;
  }

  // Local format: starts with 0 (e.g., 0112407778) → strip 0, add +966
  if (phone.startsWith("0") && phone.length >= 9) {
    phone = "+966" + phone.slice(1);
    p.phone = phone;
    stats.phoneNormalized++;
    detailedLog.push(`  PHONE FIX: "${original}" → "${phone}"`);
    continue;
  }

  // Starts with 9 (e.g., 920004585) → add +966
  if (/^9\d{8,}$/.test(phone)) {
    phone = "+966" + phone;
    p.phone = phone;
    stats.phoneNormalized++;
    detailedLog.push(`  PHONE FIX: "${original}" → "${phone}"`);
    continue;
  }

  // Starts with 1 (e.g., 138955900 — missing leading 0) → add +966
  if (/^1\d{8}$/.test(phone)) {
    phone = "+966" + phone;
    p.phone = phone;
    stats.phoneNormalized++;
    detailedLog.push(`  PHONE FIX: "${original}" → "${phone}"`);
    continue;
  }

  // Anything else: just set cleaned version
  if (phone !== original) {
    p.phone = phone;
    stats.phoneNormalized++;
    detailedLog.push(`  PHONE CLEAN: "${original}" → "${phone}"`);
  }
}

// --- Step 5: Remove near-duplicates ---
// Strategy: same normalized name + same city = duplicate; keep the one with more data
function richness(p) {
  let score = 0;
  if (p.address) score += 2;
  if (p.phone) score += 2;
  if (p.website) score += 2;
  if (p.operatingHours) score += 1;
  if (p.nameAr) score += 1;
  return score;
}

// Also detect near-dupes: one name is substring of another + very close coords
const toRemove = new Set();

// Group by city
const byCity = {};
providers.forEach((p, i) => {
  if (!byCity[p.city]) byCity[p.city] = [];
  byCity[p.city].push({ ...p, _idx: i });
});

for (const [city, cityProviders] of Object.entries(byCity)) {
  // Exact name duplicates
  const nameGroups = {};
  for (const p of cityProviders) {
    const key = p.name.trim().toLowerCase();
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(p);
  }
  for (const [name, group] of Object.entries(nameGroups)) {
    if (group.length > 1) {
      // Keep the richest record
      group.sort((a, b) => richness(b) - richness(a));
      for (let i = 1; i < group.length; i++) {
        toRemove.add(group[i]._idx);
        detailedLog.push(`  DEDUP EXACT: "${group[i].name}" in ${city} (keeping richer record)`);
      }
    }
  }

  // Near-duplicates: one name contains the other + coords within ~1km
  for (let i = 0; i < cityProviders.length; i++) {
    if (toRemove.has(cityProviders[i]._idx)) continue;
    for (let j = i + 1; j < cityProviders.length; j++) {
      if (toRemove.has(cityProviders[j]._idx)) continue;
      const a = cityProviders[i];
      const b = cityProviders[j];
      const aName = a.name.trim().toLowerCase();
      const bName = b.name.trim().toLowerCase();

      // Skip very short names (avoid matching "Clinic" with everything)
      if (aName.length < 5 || bName.length < 5) continue;

      const isSubset = (aName.includes(bName) || bName.includes(aName));
      if (!isSubset) continue;

      const dlat = Math.abs(a.lat - b.lat);
      const dlng = Math.abs(a.lng - b.lng);
      // ~1km threshold
      if (dlat < 0.015 && dlng < 0.015) {
        // Keep the one with longer name (more specific) and more data
        const keepA = richness(a) >= richness(b) || (richness(a) === richness(b) && aName.length >= bName.length);
        const removeIdx = keepA ? b._idx : a._idx;
        const keepIdx = keepA ? a._idx : b._idx;
        if (!toRemove.has(removeIdx)) {
          toRemove.add(removeIdx);
          detailedLog.push(`  DEDUP NEAR: "${providers[removeIdx].name}" → keeping "${providers[keepIdx].name}" in ${city}`);
        }
      }
    }
  }
}

stats.duplicatesRemoved = toRemove.size;

// Filter out duplicates
const cleaned = providers.filter((_, i) => !toRemove.has(i));

// --- Step 6: Category verification ---
const catCounts = {};
for (const p of cleaned) {
  catCounts[p.category] = (catCounts[p.category] || 0) + 1;
}
const validCats = new Set(["hospitals", "clinics"]);
for (const cat of Object.keys(catCounts)) {
  if (validCats.has(cat)) {
    stats.categoriesVerified++;
  } else {
    detailedLog.push(`  CATEGORY WARNING: unexpected category "${cat}" found (${catCounts[cat]} records)`);
  }
}

// =============================================================================
// WRITE OUTPUT
// =============================================================================

writeFileSync(DATA_PATH, JSON.stringify(cleaned, null, 2) + "\n", "utf-8");

// =============================================================================
// SUMMARY
// =============================================================================

const totalAfter = cleaned.length;
const otherAfter = cleaned.filter(r => r.city === "other").length;
const arabicOnlyAfter = cleaned.filter(r => isArabicOnly(r.name)).length;
const phonesWithout966 = cleaned.filter(r => r.phone && !r.phone.startsWith("+966")).length;

console.log("═══════════════════════════════════════════════════════════════");
console.log("  Saudi Arabia Data Quality Fix — Summary");
console.log("═══════════════════════════════════════════════════════════════\n");

console.log("  BEFORE / AFTER");
console.log("  ──────────────────────────────────────────────────");
console.log(`  Total records:          ${totalBefore}  →  ${totalAfter}  (${totalBefore - totalAfter} removed)`);
console.log(`  Arabic-only names:      699  →  ${arabicOnlyAfter}`);
console.log(`  City "other":           ${otherBefore}  →  ${otherAfter}  (${otherBefore - otherAfter} reassigned)`);
console.log(`  Phones missing +966:    28  →  ${phonesWithout966}`);
console.log("");

console.log("  FIXES APPLIED");
console.log("  ──────────────────────────────────────────────────");
console.log(`  Arabic names transliterated:  ${stats.arabicTransliterated}`);
console.log(`  Generic names disambiguated:  ${stats.genericDisambiguated}`);
console.log(`  Cities reassigned from other: ${stats.cityReassigned}`);
console.log(`  Region tags added (still other): ${stats.cityRegionAdded}`);
console.log(`  Phones normalized:            ${stats.phoneNormalized}`);
console.log(`  Duplicates removed:           ${stats.duplicatesRemoved}`);
console.log(`  Categories verified:          ${stats.categoriesVerified} valid (${Object.keys(catCounts).join(", ")})`);
console.log("");

console.log("  CATEGORY BREAKDOWN");
console.log("  ──────────────────────────────────────────────────");
for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}
console.log("");

console.log("  CITY DISTRIBUTION (top 25)");
console.log("  ──────────────────────────────────────────────────");
const cityCounts = {};
for (const p of cleaned) {
  cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
}
const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
for (const [city, count] of sortedCities.slice(0, 25)) {
  console.log(`  ${city}: ${count}`);
}
if (sortedCities.length > 25) {
  console.log(`  ... and ${sortedCities.length - 25} more cities`);
}
console.log("");

// Print detailed log
console.log("═══════════════════════════════════════════════════════════════");
console.log("  Detailed Changes (first 100 of " + detailedLog.length + ")");
console.log("═══════════════════════════════════════════════════════════════");
for (const line of detailedLog.slice(0, 100)) {
  console.log(line);
}
if (detailedLog.length > 100) {
  console.log(`  ... and ${detailedLog.length - 100} more changes`);
}

console.log("\nDone. File overwritten at:", DATA_PATH);
