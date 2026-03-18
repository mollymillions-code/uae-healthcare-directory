/**
 * DOH (Department of Health Abu Dhabi) Licensed Facilities Scraper
 *
 * Source: DOH maintains a public registry of licensed healthcare facilities
 * in Abu Dhabi Emirate (Abu Dhabi city + Al Ain).
 * URL: https://www.doh.gov.ae/en/health-facilities
 *
 * DOH data gives us:
 * - Facility name (English + Arabic)
 * - License number
 * - Facility type / category
 * - Location / city (Abu Dhabi or Al Ain)
 * - Contact details
 * - License status
 */

interface DOHFacility {
  facilityName: string;
  facilityNameAr?: string;
  licenseNumber: string;
  facilityType: string;
  city: "Abu Dhabi" | "Al Ain";
  address: string;
  area?: string;
  phone?: string;
  email?: string;
  website?: string;
  licenseStatus: string;
}

// DOH facility type → our category mapping
const DOH_CATEGORY_MAP: Record<string, string> = {
  "Hospital": "hospitals",
  "Clinic": "clinics",
  "Polyclinic": "clinics",
  "Medical Center": "clinics",
  "Medical Centre": "clinics",
  "Dental Clinic": "dental",
  "Dental Center": "dental",
  "Dental Centre": "dental",
  "Pharmacy": "pharmacy",
  "Laboratory": "labs-diagnostics",
  "Diagnostic Center": "labs-diagnostics",
  "Radiology": "radiology-imaging",
  "Home Care": "home-healthcare",
  "Rehabilitation": "physiotherapy",
  "Optical": "ophthalmology",
};

// Abu Dhabi area mapping
const DOH_AREA_MAP_ABU_DHABI: Record<string, string> = {
  "Khalifa City": "khalifa-city",
  "Al Reem Island": "al-reem-island",
  "Reem Island": "al-reem-island",
  "Al Maryah Island": "al-maryah-island",
  "Maryah Island": "al-maryah-island",
  "Corniche": "corniche",
  "Al Mushrif": "al-mushrif",
  "MBZ": "mohammed-bin-zayed-city",
  "Mohammed Bin Zayed": "mohammed-bin-zayed-city",
  "Al Bateen": "al-bateen",
  "Al Khalidiya": "al-khalidiya",
  "Khalidiya": "al-khalidiya",
  "Tourist Club": "tourist-club-area",
  "Al Shamkha": "al-shamkha",
  "Saadiyat": "saadiyat-island",
  "Yas Island": "yas-island",
};

// Al Ain area mapping
const DOH_AREA_MAP_AL_AIN: Record<string, string> = {
  "Al Jimi": "al-jimi",
  "Jimi": "al-jimi",
  "Al Muwaiji": "al-muwaiji",
  "Al Sarooj": "al-sarooj",
  "Tawam": "tawam",
  "Al Hili": "al-hili",
  "Hili": "al-hili",
};

function mapDOHCategory(facilityType: string): string {
  if (DOH_CATEGORY_MAP[facilityType]) return DOH_CATEGORY_MAP[facilityType];

  const lower = facilityType.toLowerCase();
  if (lower.includes("hospital")) return "hospitals";
  if (lower.includes("dental")) return "dental";
  if (lower.includes("pharmacy")) return "pharmacy";
  if (lower.includes("clinic")) return "clinics";
  if (lower.includes("lab")) return "labs-diagnostics";

  return "clinics";
}

function mapDOHCity(city: string): string {
  if (city.toLowerCase().includes("al ain")) return "al-ain";
  return "abu-dhabi";
}

function mapDOHArea(address: string, city: string): string | null {
  const areaMap = city.toLowerCase().includes("al ain")
    ? DOH_AREA_MAP_AL_AIN
    : DOH_AREA_MAP_ABU_DHABI;

  const upper = address.toUpperCase();
  for (const [name, slug] of Object.entries(areaMap)) {
    if (upper.includes(name.toUpperCase())) return slug;
  }
  return null;
}

/**
 * Scrape DOH facilities.
 *
 * In production:
 * 1. Hit DOH's health facilities portal
 * 2. Try: https://www.doh.gov.ae/en/health-facilities
 * 3. Check for API endpoints in network tab
 * 4. Or use Firecrawl/Playwright to scrape
 */
export async function scrapeDOHFacilities(): Promise<DOHFacility[]> {
  console.log("🏥 DOH Scraper: Starting...");
  console.log("  DOH Scraper: Scaffold ready. Connect to DOH portal to fetch real data.");
  console.log("  Known DOH endpoints to investigate:");
  console.log("  - https://www.doh.gov.ae/en/health-facilities");
  console.log("  - https://www.doh.gov.ae/en/find-a-health-facility");

  return [];
}

export function transformDOHFacilities(facilities: DOHFacility[]) {
  return facilities
    .filter((f) => f.licenseStatus.toLowerCase() === "active")
    .map((f) => ({
      name: f.facilityName,
      nameAr: f.facilityNameAr,
      citySlug: mapDOHCity(f.city),
      areaSlug: mapDOHArea(f.address, f.city),
      categorySlug: mapDOHCategory(f.facilityType),
      address: f.address,
      phone: f.phone,
      email: f.email,
      website: f.website,
      licenseNumber: f.licenseNumber,
    }));
}
