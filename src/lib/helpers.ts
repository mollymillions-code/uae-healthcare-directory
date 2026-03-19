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
  return `/images/categories/${imageFile}.png`;
}

export function getCityImagePath(citySlug: string): string {
  return `/images/cities/${citySlug}.png`;
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Always use the canonical domain — the directory app is proxied through
  // www.zavis.ai via Vercel rewrites, so the .vercel.app URL should never
  // appear in canonicals, schema, or sitemaps.
  return "https://www.zavis.ai";
}
