import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { createId } from "../id";
import { CITIES, AREAS } from "../constants/cities";
import { CATEGORIES, SUBCATEGORIES } from "../constants/categories";
import {
  cities,
  areas,
  categories,
  subcategories,
  providers,
  faqs,
} from "./schema";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

// Stable IDs for reference data
function cityId(slug: string) { return `city_${slug}`; }
function areaId(citySlug: string, areaSlug: string) { return `area_${citySlug}_${areaSlug}`; }
function catId(slug: string) { return `cat_${slug}`; }
function subcatId(catSlug: string, subSlug: string) { return `subcat_${catSlug}_${subSlug}`; }

async function seedCities() {
  console.log("Seeding cities...");
  await db.insert(cities).values(
    CITIES.map((city) => ({
      id: cityId(city.slug),
      name: city.name,
      slug: city.slug,
      emirate: city.emirate,
      nameAr: city.nameAr,
      latitude: city.latitude,
      longitude: city.longitude,
      description: city.description,
      metaTitle: `Healthcare Directory in ${city.name}, UAE | Find Doctors, Clinics & Hospitals`,
      metaDescription: `Browse healthcare providers in ${city.name}, UAE. Find hospitals, clinics, dentists, and specialists with ratings, reviews, and contact details.`,
      sortOrder: city.sortOrder,
    }))
  ).onConflictDoNothing();
  console.log(`  ✓ ${CITIES.length} cities`);
}

async function seedAreas() {
  console.log("Seeding areas...");
  const allAreas = Object.entries(AREAS).flatMap(([citySlugKey, cityAreas]) =>
    cityAreas.map((area) => ({
      id: areaId(citySlugKey, area.slug),
      cityId: cityId(citySlugKey),
      name: area.name,
      slug: area.slug,
      nameAr: area.nameAr,
      latitude: area.latitude,
      longitude: area.longitude,
    }))
  );
  if (allAreas.length > 0) {
    await db.insert(areas).values(allAreas).onConflictDoNothing();
  }
  console.log(`  ✓ ${allAreas.length} areas`);
}

async function seedCategories() {
  console.log("Seeding categories...");
  await db.insert(categories).values(
    CATEGORIES.map((cat) => ({
      id: catId(cat.slug),
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      description: `Find the best ${cat.name.toLowerCase()} in the UAE. Browse listings with ratings, reviews, contact details, and locations.`,
      metaTitle: `${cat.name} in UAE | Healthcare Directory`,
      metaDescription: `Find ${cat.name.toLowerCase()} across Dubai, Abu Dhabi, Sharjah, and all UAE cities. Ratings, reviews, and contact details.`,
    }))
  ).onConflictDoNothing();
  console.log(`  ✓ ${CATEGORIES.length} categories`);
}

async function seedSubcategories() {
  console.log("Seeding subcategories...");
  const allSubs = Object.entries(SUBCATEGORIES).flatMap(([catSlug, subs]) =>
    subs.map((sub) => ({
      id: subcatId(catSlug, sub.slug),
      categoryId: catId(catSlug),
      name: sub.name,
      slug: sub.slug,
      sortOrder: sub.sortOrder,
    }))
  );
  if (allSubs.length > 0) {
    await db.insert(subcategories).values(allSubs).onConflictDoNothing();
  }
  console.log(`  ✓ ${allSubs.length} subcategories`);
}

// Sample providers — realistic data for initial UI development
const SAMPLE_PROVIDERS = [
  // Dubai - Hospitals
  { name: "Mediclinic City Hospital", city: "dubai", area: "healthcare-city", cat: "hospitals", subcat: "private-hospitals", address: "Building 37, Dubai Healthcare City, Dubai", phone: "+971-4-435-9999", website: "https://www.mediclinic.ae", lat: "25.2265", lng: "55.3195", rating: "4.5", reviewCount: 1842, description: "Mediclinic City Hospital is a state-of-the-art multi-specialty hospital in Dubai Healthcare City offering comprehensive medical services." },
  { name: "American Hospital Dubai", city: "dubai", area: "al-barsha", cat: "hospitals", subcat: "private-hospitals", address: "19th Street, Oud Metha, Dubai", phone: "+971-4-336-7777", website: "https://www.ahdubai.com", lat: "25.2289", lng: "55.3117", rating: "4.4", reviewCount: 2156, description: "American Hospital Dubai is a premier JCI-accredited hospital providing world-class healthcare since 1996." },
  { name: "Rashid Hospital", city: "dubai", area: "bur-dubai", cat: "hospitals", subcat: "government-hospitals", address: "Oud Metha Road, Bur Dubai, Dubai", phone: "+971-4-219-2000", website: "https://www.dha.gov.ae", lat: "25.2353", lng: "55.3142", rating: "4.1", reviewCount: 1523, description: "Rashid Hospital is a leading government hospital under Dubai Health Authority, known for its trauma center." },
  { name: "Saudi German Hospital", city: "dubai", area: "al-barsha", cat: "hospitals", subcat: "private-hospitals", address: "Hessa Street, Al Barsha 3, Dubai", phone: "+971-4-389-0000", website: "https://www.sghgroup.ae", lat: "25.1068", lng: "55.1978", rating: "4.2", reviewCount: 1341, description: "Saudi German Hospital Dubai is a multi-specialty hospital offering advanced medical care across over 30 specialties." },
  { name: "NMC Royal Hospital", city: "dubai", area: "deira", cat: "hospitals", subcat: "private-hospitals", address: "Dubai Investment Park, Dubai", phone: "+971-4-810-0100", website: "https://www.nmc.ae", lat: "25.0045", lng: "55.1436", rating: "4.0", reviewCount: 987, description: "NMC Royal Hospital provides comprehensive healthcare services including emergency care, surgery, and specialized treatments." },

  // Dubai - Dental
  { name: "Dr. Michael's Dental Clinic", city: "dubai", area: "jumeirah", cat: "dental", subcat: "cosmetic-dentistry", address: "Jumeirah Beach Road, Umm Suqeim 1, Dubai", phone: "+971-4-349-5900", website: "https://www.drmichaels.com", lat: "25.1742", lng: "55.2200", rating: "4.7", reviewCount: 956, description: "Award-winning dental clinic specializing in cosmetic dentistry, veneers, and smile makeovers." },
  { name: "NOA Dental Clinic", city: "dubai", area: "jumeirah", cat: "dental", subcat: "general-dentistry", address: "Jumeirah 1, Dubai", phone: "+971-4-370-8700", website: "https://www.noadental.com", lat: "25.2150", lng: "55.2510", rating: "4.8", reviewCount: 723, description: "NOA Dental Clinic offers premium dental care in a luxury setting with the latest technology." },
  { name: "Versailles Dental Clinic", city: "dubai", area: "jlt", cat: "dental", subcat: "orthodontics", address: "Cluster I, JLT, Dubai", phone: "+971-4-454-2188", website: "https://www.versaillesdental.com", lat: "25.0750", lng: "55.1470", rating: "4.6", reviewCount: 542, description: "Specialists in orthodontics, Invisalign, and teeth straightening treatments." },

  // Dubai - Dermatology
  { name: "Kaya Skin Clinic", city: "dubai", area: "dubai-marina", cat: "dermatology", subcat: "cosmetic-dermatology", address: "Marina Walk, Dubai Marina, Dubai", phone: "+971-4-399-2003", website: "https://www.kayaskinclinic.com", lat: "25.0775", lng: "55.1365", rating: "4.3", reviewCount: 678, description: "Kaya Skin Clinic offers dermatological treatments, laser procedures, and anti-aging solutions." },
  { name: "Medcare Skin Centre", city: "dubai", area: "jumeirah", cat: "dermatology", subcat: "medical-dermatology", address: "Jumeirah Beach Road, Dubai", phone: "+971-4-349-0022", website: "https://www.medcare.ae", lat: "25.2100", lng: "55.2475", rating: "4.5", reviewCount: 445, description: "Comprehensive dermatology center treating skin conditions, eczema, psoriasis, and acne." },

  // Dubai - Mental Health
  { name: "Priory Wellbeing Centre", city: "dubai", area: "healthcare-city", cat: "mental-health", subcat: "psychiatry", address: "Building 47, DHCC, Dubai", phone: "+971-4-385-4167", website: "https://www.priorygroup.ae", lat: "25.2268", lng: "55.3200", rating: "4.6", reviewCount: 312, description: "World-renowned mental health provider offering psychiatry, counseling, and addiction treatment." },

  // Dubai - Eye Care
  { name: "Moorfields Eye Hospital Dubai", city: "dubai", area: "healthcare-city", cat: "ophthalmology", subcat: "lasik-refractive", address: "Building 64, DHCC, Dubai", phone: "+971-4-429-7888", website: "https://www.moorfields.ae", lat: "25.2262", lng: "55.3188", rating: "4.7", reviewCount: 1156, description: "A branch of London's leading eye hospital, offering specialized ophthalmology services." },

  // Dubai - Fertility
  { name: "Bourn Hall Fertility Centre", city: "dubai", area: "healthcare-city", cat: "fertility-ivf", subcat: "ivf-centers", address: "Building 52, DHCC, Dubai", phone: "+971-4-364-4400", website: "https://www.bournhallfertility.ae", lat: "25.2270", lng: "55.3205", rating: "4.4", reviewCount: 287, description: "Pioneers of IVF treatment, Bourn Hall brings world-class fertility care to Dubai." },

  // Abu Dhabi - Hospitals
  { name: "Cleveland Clinic Abu Dhabi", city: "abu-dhabi", area: "al-maryah-island", cat: "hospitals", subcat: "specialty-hospitals", address: "Al Maryah Island, Abu Dhabi", phone: "+971-2-501-9000", website: "https://www.clevelandclinicabudhabi.ae", lat: "24.5025", lng: "54.3970", rating: "4.6", reviewCount: 2345, description: "Cleveland Clinic Abu Dhabi is a multi-specialty hospital offering world-class healthcare on Al Maryah Island." },
  { name: "Sheikh Khalifa Medical City", city: "abu-dhabi", area: "al-khalidiya", cat: "hospitals", subcat: "government-hospitals", address: "Karamah Street, Abu Dhabi", phone: "+971-2-819-0000", website: "https://www.seha.ae", lat: "24.4650", lng: "54.3640", rating: "4.2", reviewCount: 1876, description: "One of Abu Dhabi's largest government hospitals, providing comprehensive medical services." },
  { name: "Burjeel Medical City", city: "abu-dhabi", area: "mohammed-bin-zayed-city", cat: "hospitals", subcat: "private-hospitals", address: "Mohammed Bin Zayed City, Abu Dhabi", phone: "+971-2-508-5555", website: "https://www.burjeel.com", lat: "24.3540", lng: "54.5510", rating: "4.3", reviewCount: 1234, description: "Burjeel Medical City is a flagship healthcare facility offering advanced medical care." },

  // Abu Dhabi - Dental
  { name: "Dr. Joy Dental Clinics", city: "abu-dhabi", area: "khalifa-city", cat: "dental", subcat: "general-dentistry", address: "Khalifa City A, Abu Dhabi", phone: "+971-2-556-4280", website: "https://www.drjoydental.com", lat: "24.4220", lng: "54.5830", rating: "4.5", reviewCount: 534, description: "Comprehensive dental care with multiple branches across Abu Dhabi." },

  // Sharjah - Hospitals
  { name: "University Hospital Sharjah", city: "sharjah", area: "university-city-sharjah", cat: "hospitals", subcat: "university-hospitals", address: "University City, Sharjah", phone: "+971-6-505-8555", website: "https://www.uhs.ae", lat: "25.2910", lng: "55.4620", rating: "4.3", reviewCount: 1567, description: "University Hospital Sharjah is a premier teaching hospital associated with the University of Sharjah." },
  { name: "Zulekha Hospital Sharjah", city: "sharjah", area: "al-nahda-sharjah", cat: "hospitals", subcat: "private-hospitals", address: "Al Nahda, Sharjah", phone: "+971-6-506-6444", website: "https://www.zulekhahospitals.com", lat: "25.3080", lng: "55.3780", rating: "4.1", reviewCount: 1123, description: "Zulekha Hospital is a multi-specialty hospital providing quality healthcare since 1992." },

  // Sharjah - Clinics
  { name: "Thumbay Clinic Sharjah", city: "sharjah", area: "al-qasimia", cat: "clinics", subcat: "multi-specialty-clinics", address: "Al Qasimia, Sharjah", phone: "+971-6-573-1111", website: "https://www.thumbayclinic.com", lat: "25.3520", lng: "55.3910", rating: "4.0", reviewCount: 456, description: "Multi-specialty clinic offering family medicine, pediatrics, and specialist consultations." },

  // Ajman
  { name: "Thumbay University Hospital Ajman", city: "ajman", area: "al-jurf", cat: "hospitals", subcat: "university-hospitals", address: "Al Jurf, Ajman", phone: "+971-6-705-6666", website: "https://www.thumbay.com", lat: "25.4130", lng: "55.5100", rating: "4.2", reviewCount: 876, description: "Academic medical center providing quality healthcare and medical education." },

  // RAK
  { name: "RAK Hospital", city: "ras-al-khaimah", area: "al-nakheel-rak", cat: "hospitals", subcat: "private-hospitals", address: "Al Nakheel, Ras Al Khaimah", phone: "+971-7-207-4444", website: "https://www.rakhospital.com", lat: "25.7890", lng: "55.9560", rating: "4.3", reviewCount: 654, description: "The leading private hospital in Ras Al Khaimah, offering multi-specialty care." },

  // Al Ain
  { name: "Tawam Hospital", city: "al-ain", area: "tawam", cat: "hospitals", subcat: "government-hospitals", address: "Tawam Area, Al Ain", phone: "+971-3-707-7444", website: "https://www.seha.ae", lat: "24.2320", lng: "55.7720", rating: "4.4", reviewCount: 1234, description: "Tawam Hospital is the primary government hospital in Al Ain, operated by SEHA." },
  { name: "NMC Royal Hospital Al Ain", city: "al-ain", area: "al-ain-central", cat: "hospitals", subcat: "private-hospitals", address: "Al Ain City Center, Al Ain", phone: "+971-3-720-6666", website: "https://www.nmc.ae", lat: "24.1920", lng: "55.7610", rating: "4.1", reviewCount: 567, description: "Private multi-specialty hospital providing comprehensive healthcare in Al Ain." },

  // More Dubai specialties
  { name: "HealthBay Polyclinic", city: "dubai", area: "downtown-dubai", cat: "clinics", subcat: "multi-specialty-clinics", address: "Al Wasl Road, Downtown Dubai", phone: "+971-4-348-4848", website: "https://www.healthbayclinic.com", lat: "25.1990", lng: "55.2760", rating: "4.5", reviewCount: 389, description: "Premium multi-specialty polyclinic offering holistic healthcare in Downtown Dubai." },
  { name: "Aster Clinic", city: "dubai", area: "al-karama", cat: "clinics", subcat: "general-practice", address: "Al Karama, Dubai", phone: "+971-4-335-2255", website: "https://www.asterclinics.com", lat: "25.2420", lng: "55.3020", rating: "4.2", reviewCount: 1567, description: "Part of the Aster DM Healthcare network, offering accessible primary and specialty care." },

  { name: "Emirates Hospital Jumeirah", city: "dubai", area: "jumeirah", cat: "hospitals", subcat: "private-hospitals", address: "Jumeirah Beach Road, Jumeirah 2, Dubai", phone: "+971-4-349-6666", website: "https://www.emirateshospital.ae", lat: "25.2100", lng: "55.2500", rating: "4.6", reviewCount: 1890, description: "A luxury private hospital offering premium healthcare services on Jumeirah Beach Road." },

  // Pharmacy
  { name: "Aster Pharmacy", city: "dubai", area: "al-barsha", cat: "pharmacy", address: "Al Barsha 1, Dubai", phone: "+971-4-347-5253", website: "https://www.asterpharmacy.com", lat: "25.1140", lng: "55.2010", rating: "4.3", reviewCount: 234, description: "Leading pharmacy chain in the UAE with wide range of medications and health products." },
  { name: "Life Pharmacy", city: "dubai", area: "dubai-marina", cat: "pharmacy", address: "Marina Mall, Dubai Marina", phone: "+971-4-399-4060", website: "https://www.lifepharmacy.com", lat: "25.0780", lng: "55.1370", rating: "4.4", reviewCount: 567, description: "One of the largest pharmacy chains in the UAE, known for competitive prices." },

  // Labs
  { name: "Al Borg Diagnostics", city: "dubai", area: "deira", cat: "labs-diagnostics", address: "Port Saeed, Deira, Dubai", phone: "+971-4-295-4810", website: "https://www.alborglaboratories.com", lat: "25.2610", lng: "55.3300", rating: "4.1", reviewCount: 876, description: "One of the largest pathology and diagnostics lab networks in the Middle East." },

  // Physiotherapy
  { name: "Physio Art", city: "dubai", area: "business-bay", cat: "physiotherapy", address: "Churchill Tower, Business Bay, Dubai", phone: "+971-4-452-7526", website: "https://www.physioart.com", lat: "25.1860", lng: "55.2720", rating: "4.8", reviewCount: 345, description: "Premium physiotherapy and rehabilitation center specializing in sports injuries and post-surgical rehab." },

  // Home Healthcare
  { name: "Health at Home", city: "dubai", area: "al-quoz", cat: "home-healthcare", subcat: "nursing-care", address: "Al Quoz Industrial Area, Dubai", phone: "+971-4-321-4000", website: "https://www.hah.ae", lat: "25.1470", lng: "55.2330", rating: "4.5", reviewCount: 456, description: "Leading home healthcare provider in the UAE offering nursing, physiotherapy, and elderly care." },

  // Alternative Medicine
  { name: "Dr. Shyam's Ayurveda Centre", city: "dubai", area: "al-karama", cat: "alternative-medicine", subcat: "ayurveda", address: "Karama Centre, Al Karama, Dubai", phone: "+971-4-335-8838", lat: "25.2430", lng: "55.3030", rating: "4.4", reviewCount: 289, description: "Authentic Ayurvedic treatments including Panchakarma therapy, herbal medicine, and wellness consultations." },

  // Wellness
  { name: "DNA Health & Wellness", city: "dubai", area: "jlt", cat: "wellness-spas", address: "Cluster D, JLT, Dubai", phone: "+971-4-430-7071", website: "https://www.dnahealthwellness.com", lat: "25.0740", lng: "55.1450", rating: "4.6", reviewCount: 234, description: "Integrated wellness center offering IV therapy, body composition analysis, and preventive health packages." },

  // Cardiology
  { name: "German Heart Centre", city: "dubai", area: "healthcare-city", cat: "cardiology", address: "Building 37, DHCC, Dubai", phone: "+971-4-362-4797", website: "https://www.german-heart-centre.com", lat: "25.2267", lng: "55.3198", rating: "4.7", reviewCount: 567, description: "Specialized cardiology center offering advanced cardiac diagnostics and interventional procedures." },

  // Pediatrics
  { name: "Kids Heart Medical Centre", city: "dubai", area: "mirdif", cat: "pediatrics", address: "Uptown Mirdif, Dubai", phone: "+971-4-284-3131", lat: "25.2175", lng: "55.4190", rating: "4.6", reviewCount: 412, description: "Pediatric specialty center focusing on children's cardiology and general pediatrics." },

  // Abu Dhabi specialty
  { name: "Healthpoint Hospital", city: "abu-dhabi", area: "yas-island", cat: "orthopedics", address: "Zayed Sports City, Abu Dhabi", phone: "+971-2-492-2300", website: "https://www.healthpoint.ae", lat: "24.4190", lng: "54.4500", rating: "4.5", reviewCount: 789, description: "Abu Dhabi's specialist orthopedic and sports medicine hospital." },

  // Emergency
  { name: "Medcare Emergency", city: "dubai", area: "al-satwa", cat: "emergency-care", address: "Al Satwa, Dubai", phone: "+971-4-349-9111", website: "https://www.medcare.ae", lat: "25.2280", lng: "55.2660", rating: "4.3", reviewCount: 345, description: "24/7 emergency and urgent care services with rapid response times." },
];

async function seedProviders() {
  console.log("Seeding providers...");
  const providerValues = SAMPLE_PROVIDERS.map((p) => {
    const slug = p.name
      .toLowerCase()
      .replace(/[''\.]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + `-${p.city}`;

    return {
      id: createId("prov"),
      name: p.name,
      slug,
      categoryId: catId(p.cat),
      subcategoryId: p.subcat ? subcatId(p.cat, p.subcat) : null,
      cityId: cityId(p.city),
      areaId: p.area ? areaId(p.city, p.area) : null,
      address: p.address,
      latitude: p.lat,
      longitude: p.lng,
      phone: p.phone,
      website: p.website || null,
      description: p.description,
      shortDescription: p.description.slice(0, 160),
      googleRating: p.rating,
      googleReviewCount: p.reviewCount,
      status: "active",
      services: [],
      languages: ["English", "Arabic"],
      insurance: ["Daman", "Thiqa", "Dubai Insurance", "AXA"],
      operatingHours: {
        mon: { open: "08:00", close: "20:00" },
        tue: { open: "08:00", close: "20:00" },
        wed: { open: "08:00", close: "20:00" },
        thu: { open: "08:00", close: "20:00" },
        fri: { open: "09:00", close: "18:00" },
        sat: { open: "09:00", close: "18:00" },
        sun: { open: "10:00", close: "16:00" },
      },
      amenities: ["Parking", "Wheelchair Accessible", "WiFi"],
    };
  });
  if (providerValues.length > 0) {
    await db.insert(providers).values(providerValues).onConflictDoNothing();
  }
  console.log(`  ✓ ${providerValues.length} providers`);
}

async function seedFaqs() {
  console.log("Seeding FAQs...");
  const allFaqs: { id: string; entityType: string; entityId: string; question: string; answer: string; sortOrder: number }[] = [];

  // City-level FAQs
  for (const city of CITIES) {
    const cityFaqData = [
      { q: `How many healthcare providers are in ${city.name}?`, a: `${city.name} has hundreds of registered healthcare providers including hospitals, clinics, dental practices, and specialty centers. Use our directory to browse all providers by category and area.` },
      { q: `What are the best-rated hospitals in ${city.name}?`, a: `The top-rated hospitals in ${city.name} can be found by sorting our hospital listings by Google rating. Many hospitals maintain ratings above 4.5 stars.` },
      { q: `How do I find a doctor near me in ${city.name}?`, a: `Use our search feature and enable location access to find healthcare providers nearest to you in ${city.name}. You can filter by specialty, area, and rating.` },
      { q: `Which insurance providers are accepted in ${city.name}?`, a: `Most healthcare providers in ${city.name} accept major insurance plans including Daman, Thiqa, Dubai Insurance Company (DIC), AXA, and others. Check individual provider listings for specific insurance acceptance.` },
    ];
    for (let i = 0; i < cityFaqData.length; i++) {
      allFaqs.push({
        id: createId("faq"),
        entityType: "city",
        entityId: cityId(city.slug),
        question: cityFaqData[i].q,
        answer: cityFaqData[i].a,
        sortOrder: i + 1,
      });
    }
  }

  // Category-level FAQs
  for (const cat of CATEGORIES) {
    const catFaqData = [
      { q: `How do I find the best ${cat.name.toLowerCase()} in the UAE?`, a: `Browse our ${cat.name.toLowerCase()} directory to compare providers across all UAE cities. Sort by rating, read Google reviews, and check accepted insurance plans to find the best match.` },
      { q: `Are ${cat.name.toLowerCase()} covered by insurance in the UAE?`, a: `Most major insurance plans in the UAE cover ${cat.name.toLowerCase()} services. Coverage varies by plan — check with your insurance provider and verify acceptance at individual clinics.` },
    ];
    for (let i = 0; i < catFaqData.length; i++) {
      allFaqs.push({
        id: createId("faq"),
        entityType: "category",
        entityId: catId(cat.slug),
        question: catFaqData[i].q,
        answer: catFaqData[i].a,
        sortOrder: i + 1,
      });
    }
  }

  if (allFaqs.length > 0) {
    await db.insert(faqs).values(allFaqs).onConflictDoNothing();
  }
  console.log(`  ✓ ${allFaqs.length} FAQs`);
}

async function main() {
  console.log("🏥 UAE Open Healthcare Directory — Seeding database...\n");
  await seedCities();
  await seedAreas();
  await seedCategories();
  await seedSubcategories();
  await seedProviders();
  await seedFaqs();
  console.log("\n✅ Seeding complete!");
}

main().catch(console.error);
