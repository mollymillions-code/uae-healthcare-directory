export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPhone(phone: string): string {
  return phone.replace(/[^+\d]/g, "");
}

export function formatRating(rating: number | null): string {
  if (!rating) return "N/A";
  return Number(rating).toFixed(1);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/** Map category slug to its AI-generated image path */
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "hospitals": "hospitals", "clinics": "clinics", "dental": "dental",
  "dermatology": "dermatology", "ophthalmology": "ophthalmology",
  "cardiology": "cardiology", "orthopedics": "orthopedics",
  "mental-health": "mental-health", "pediatrics": "pediatrics",
  "ob-gyn": "obstetrics-gynecology", "ent": "ent",
  "fertility-ivf": "fertility", "physiotherapy": "physiotherapy",
  "nutrition-dietetics": "clinics", "pharmacy": "pharmacy",
  "labs-diagnostics": "laboratory", "radiology-imaging": "radiology",
  "home-healthcare": "home-healthcare", "alternative-medicine": "alternative-medicine",
  "cosmetic-plastic": "dermatology", "neurology": "neurology",
  "urology": "urology", "gastroenterology": "gastroenterology",
  "oncology": "oncology", "emergency-care": "hospitals",
  "wellness-spas": "dermatology", "medical-equipment": "medical-equipment",
  "nephrology": "nephrology", "endocrinology": "endocrinology",
  "pulmonology": "pulmonology",
};

export function getCategoryImagePath(categorySlug: string): string {
  const imageFile = CATEGORY_IMAGE_MAP[categorySlug] || "clinics";
  return `/images/categories/${imageFile}.webp`;
}

const CITY_IMAGE_MAP: Record<string, string> = {
  // UAE city assets that exist in public/images/cities.
  dubai: "dubai",
  "abu-dhabi": "abu-dhabi",
  sharjah: "sharjah",
  ajman: "ajman",
  "ras-al-khaimah": "ras-al-khaimah",
  fujairah: "fujairah",
  "umm-al-quwain": "umm-al-quwain",
  "al-ain": "al-ain",

  // GCC city pages currently do not have dedicated city photos. Resolve them
  // to existing regional assets so cards never render broken image URLs.
  doha: "abu-dhabi",
  "al-wakrah": "umm-al-quwain",
  "al-khor": "ras-al-khaimah",
  "al-rayyan": "al-ain",
  "umm-salal": "ajman",
  lusail: "dubai",
  riyadh: "al-ain",
  jeddah: "dubai",
  mecca: "ras-al-khaimah",
  medina: "al-ain",
  dammam: "abu-dhabi",
  khobar: "dubai",
  dhahran: "abu-dhabi",
  tabuk: "ras-al-khaimah",
  abha: "fujairah",
  taif: "al-ain",
  buraidah: "ajman",
  hail: "ras-al-khaimah",
  jazan: "fujairah",
  najran: "al-ain",
  "al-ahsa": "al-ain",
  manama: "abu-dhabi",
  muharraq: "sharjah",
  riffa: "al-ain",
  "isa-town": "ajman",
  sitra: "umm-al-quwain",
  "hamad-town": "ajman",
  budaiya: "ras-al-khaimah",
  "kuwait-city": "abu-dhabi",
  hawalli: "sharjah",
  salmiya: "dubai",
  farwaniya: "ajman",
  jahra: "ras-al-khaimah",
  ahmadi: "al-ain",
  mangaf: "umm-al-quwain",

  // UAE area pages inherit the parent city asset.
  jumeirah: "dubai",
  "dubai-marina": "dubai",
  deira: "dubai",
  "bur-dubai": "dubai",
  "al-barsha": "dubai",
  jlt: "dubai",
  "downtown-dubai": "dubai",
  "business-bay": "dubai",
  "healthcare-city": "dubai",
  "al-quoz": "dubai",
  "silicon-oasis": "dubai",
  "discovery-gardens": "dubai",
  jvc: "dubai",
  "motor-city": "dubai",
  "al-nahda": "dubai",
  "international-city": "dubai",
  "palm-jumeirah": "dubai",
  mirdif: "dubai",
  "al-karama": "dubai",
  "dubai-hills": "dubai",
  "al-rashidiya": "dubai",
  "al-mamzar": "dubai",
  "umm-suqeim": "dubai",
  "al-satwa": "dubai",
  "khalifa-city": "abu-dhabi",
  "al-reem-island": "abu-dhabi",
  "al-maryah-island": "abu-dhabi",
  corniche: "abu-dhabi",
  "al-mushrif": "abu-dhabi",
  "mohammed-bin-zayed-city": "abu-dhabi",
  "al-bateen": "abu-dhabi",
  "al-khalidiya": "abu-dhabi",
  "tourist-club-area": "abu-dhabi",
  "al-shamkha": "abu-dhabi",
  "saadiyat-island": "abu-dhabi",
  "yas-island": "abu-dhabi",
  "al-nahda-sharjah": "sharjah",
  "al-majaz": "sharjah",
  "al-taawun": "sharjah",
  "al-khan": "sharjah",
  muwaileh: "sharjah",
  "university-city-sharjah": "sharjah",
  "al-qasimia": "sharjah",
  "al-mamzar-sharjah": "sharjah",
  "al-nuaimia": "ajman",
  "al-rashidiya-ajman": "ajman",
  "al-jurf": "ajman",
  "ajman-downtown": "ajman",
  "al-nakheel-rak": "ras-al-khaimah",
  "al-hamra-rak": "ras-al-khaimah",
  khuzam: "ras-al-khaimah",
  "rak-city-center": "ras-al-khaimah",
  "fujairah-city-center": "fujairah",
  "dibba-al-fujairah": "fujairah",
  "uaq-city-center": "umm-al-quwain",
  "al-salamah-uaq": "umm-al-quwain",
  "al-jimi": "al-ain",
  "al-muwaiji": "al-ain",
  "al-sarooj": "al-ain",
  "al-ain-central": "al-ain",
  tawam: "al-ain",
  "al-hili": "al-ain",
};

export function getCityImagePath(citySlug: string): string {
  const imageFile = CITY_IMAGE_MAP[citySlug] || "dubai";
  return `/images/cities/${imageFile}.webp`;
}

export function getBaseUrl(): string {
  // Canonical domain is www.zavis.ai — Nginx redirects non-www to www.
  // Must stay www to avoid redirect loops.
  return process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai";
}
