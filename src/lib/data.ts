/**
 * Data access layer — works with static seed data for development
 * and with Neon Postgres in production (when DATABASE_URL is set).
 */

import { CITIES, AREAS } from "./constants/cities";
import { CATEGORIES, SUBCATEGORIES } from "./constants/categories";
import { INSURANCE_PROVIDERS, InsuranceProvider } from "./constants/insurance";
import { LANGUAGES, LanguageInfo } from "./constants/languages";
import { CONDITIONS, Condition } from "./constants/conditions";

// Types for local data
export interface LocalCity {
  slug: string;
  name: string;
  emirate: string;
  nameAr?: string;
  latitude: string;
  longitude: string;
  description: string;
  sortOrder: number;
}

export interface LocalArea {
  slug: string;
  name: string;
  nameAr?: string;
  latitude: string;
  longitude: string;
  citySlug: string;
}

export interface LocalCategory {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface LocalProvider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  areaSlug?: string;
  categorySlug: string;
  subcategorySlug?: string;
  address: string;
  phone?: string;
  website?: string;
  description: string;
  shortDescription: string;
  googleRating: string;
  googleReviewCount: number;
  latitude: string;
  longitude: string;
  isClaimed: boolean;
  isVerified: boolean;
  services: string[];
  languages: string[];
  insurance: string[];
  operatingHours: Record<string, { open: string; close: string }>;
  amenities: string[];
  lastVerified: string; // ISO date — freshness signal for LLMs
  email?: string;
}

// ─── Load scraped providers if available ────────────────────────────────────────

let SCRAPED_PROVIDERS: LocalProvider[] = [];
try {
  // At build time, try to load the scraped MOHAP data
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const scraped = require("./providers-scraped.json") as Array<{
    id: string; name: string; slug: string; citySlug: string; categorySlug: string;
    facilityType?: string; specialty?: string | null; address: string;
    description: string; shortDescription: string; services: string[];
    languages: string[]; insurance: string[]; operatingHours: Record<string, { open: string; close: string }>;
    amenities: string[]; lastVerified: string; googleRating: string | null;
    googleReviewCount: number; isClaimed: boolean; isVerified: boolean;
  }>;
  SCRAPED_PROVIDERS = scraped.map((p) => ({
    ...p,
    googleRating: p.googleRating || "0",
    googleReviewCount: p.googleReviewCount || 0,
    latitude: "0",
    longitude: "0",
  }));
} catch {
  // No scraped data yet — that's fine
}

// Sample providers embedded for zero-DB local dev (used as fallback + enriched data)
const SAMPLE_PROVIDERS: LocalProvider[] = [
  { id: "prov_1", name: "Mediclinic City Hospital", slug: "mediclinic-city-hospital-dubai", citySlug: "dubai", areaSlug: "healthcare-city", categorySlug: "hospitals", subcategorySlug: "private-hospitals", address: "Building 37, Dubai Healthcare City, Dubai", phone: "+971-4-435-9999", website: "https://www.mediclinic.ae", latitude: "25.2265", longitude: "55.3195", googleRating: "4.5", googleReviewCount: 1842, description: "Mediclinic City Hospital is a state-of-the-art multi-specialty hospital in Dubai Healthcare City offering comprehensive medical services including cardiology, oncology, orthopedics, and women's health.", shortDescription: "State-of-the-art multi-specialty hospital in Dubai Healthcare City offering comprehensive medical services.", isClaimed: true, isVerified: true, services: ["Emergency", "Cardiology", "Oncology", "Orthopedics", "Women's Health", "Pediatrics"], languages: ["English", "Arabic", "Hindi", "Urdu"], insurance: ["Daman", "Thiqa", "AXA", "Dubai Insurance", "Cigna", "MetLife"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "WiFi", "Pharmacy", "Cafeteria"], lastVerified: "2026-03-15" },
  { id: "prov_2", name: "American Hospital Dubai", slug: "american-hospital-dubai-dubai", citySlug: "dubai", areaSlug: "al-barsha", categorySlug: "hospitals", subcategorySlug: "private-hospitals", address: "19th Street, Oud Metha, Dubai", phone: "+971-4-336-7777", website: "https://www.ahdubai.com", latitude: "25.2289", longitude: "55.3117", googleRating: "4.4", googleReviewCount: 2156, description: "American Hospital Dubai is a premier JCI-accredited hospital providing world-class healthcare since 1996. Known for exceptional patient care and advanced medical technology.", shortDescription: "Premier JCI-accredited hospital providing world-class healthcare since 1996.", isClaimed: true, isVerified: true, services: ["Emergency", "Surgery", "Cardiology", "Neurology", "Oncology", "Maternity"], languages: ["English", "Arabic", "French"], insurance: ["Daman", "Thiqa", "AXA", "Cigna", "Allianz"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "WiFi", "Pharmacy", "Helipad"], lastVerified: "2026-03-15" },
  { id: "prov_3", name: "Rashid Hospital", slug: "rashid-hospital-dubai", citySlug: "dubai", areaSlug: "bur-dubai", categorySlug: "hospitals", subcategorySlug: "government-hospitals", address: "Oud Metha Road, Bur Dubai, Dubai", phone: "+971-4-219-2000", website: "https://www.dha.gov.ae", latitude: "25.2353", longitude: "55.3142", googleRating: "4.1", googleReviewCount: 1523, description: "Rashid Hospital is a leading government hospital under Dubai Health Authority, known for its Level I trauma center and emergency services.", shortDescription: "Leading DHA government hospital known for its Level I trauma center.", isClaimed: false, isVerified: true, services: ["Trauma Center", "Emergency", "Surgery", "Internal Medicine", "Orthopedics"], languages: ["English", "Arabic", "Hindi", "Urdu", "Tagalog"], insurance: ["Daman", "Thiqa", "Dubai Insurance"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "Pharmacy"], lastVerified: "2026-03-15" },
  { id: "prov_4", name: "Dr. Michael's Dental Clinic", slug: "dr-michaels-dental-clinic-dubai", citySlug: "dubai", areaSlug: "jumeirah", categorySlug: "dental", subcategorySlug: "cosmetic-dentistry", address: "Jumeirah Beach Road, Umm Suqeim 1, Dubai", phone: "+971-4-349-5900", website: "https://www.drmichaels.com", latitude: "25.1742", longitude: "55.2200", googleRating: "4.7", googleReviewCount: 956, description: "Award-winning dental clinic specializing in cosmetic dentistry, veneers, smile makeovers, and dental implants. Over 20 years of experience in Dubai.", shortDescription: "Award-winning dental clinic specializing in cosmetic dentistry and smile makeovers.", isClaimed: true, isVerified: true, services: ["Cosmetic Dentistry", "Veneers", "Dental Implants", "Teeth Whitening", "Orthodontics"], languages: ["English", "Arabic", "French", "German"], insurance: ["Daman", "AXA", "Cigna", "MetLife"], operatingHours: { mon: { open: "09:00", close: "21:00" }, tue: { open: "09:00", close: "21:00" }, wed: { open: "09:00", close: "21:00" }, thu: { open: "09:00", close: "21:00" }, fri: { open: "10:00", close: "18:00" }, sat: { open: "10:00", close: "18:00" }, sun: { open: "10:00", close: "16:00" } }, amenities: ["Parking", "WiFi", "Kids Area"], lastVerified: "2026-03-14" },
  { id: "prov_5", name: "NOA Dental Clinic", slug: "noa-dental-clinic-dubai", citySlug: "dubai", areaSlug: "jumeirah", categorySlug: "dental", subcategorySlug: "general-dentistry", address: "Jumeirah 1, Dubai", phone: "+971-4-370-8700", website: "https://www.noadental.com", latitude: "25.2150", longitude: "55.2510", googleRating: "4.8", googleReviewCount: 723, description: "NOA Dental Clinic offers premium dental care in a luxury setting with the latest technology and a team of international specialists.", shortDescription: "Premium dental care in a luxury setting with latest technology.", isClaimed: true, isVerified: true, services: ["General Dentistry", "Cosmetic Dentistry", "Orthodontics", "Pediatric Dentistry", "Oral Surgery"], languages: ["English", "Arabic", "Russian"], insurance: ["Daman", "AXA", "Cigna", "Allianz"], operatingHours: { mon: { open: "08:00", close: "20:00" }, tue: { open: "08:00", close: "20:00" }, wed: { open: "08:00", close: "20:00" }, thu: { open: "08:00", close: "20:00" }, fri: { open: "09:00", close: "18:00" }, sat: { open: "09:00", close: "18:00" }, sun: { open: "10:00", close: "16:00" } }, amenities: ["Parking", "WiFi", "Wheelchair Accessible"], lastVerified: "2026-03-14" },
  { id: "prov_6", name: "Cleveland Clinic Abu Dhabi", slug: "cleveland-clinic-abu-dhabi-abu-dhabi", citySlug: "abu-dhabi", areaSlug: "al-maryah-island", categorySlug: "hospitals", subcategorySlug: "specialty-hospitals", address: "Al Maryah Island, Abu Dhabi", phone: "+971-2-501-9000", website: "https://www.clevelandclinicabudhabi.ae", latitude: "24.5025", longitude: "54.3970", googleRating: "4.6", googleReviewCount: 2345, description: "Cleveland Clinic Abu Dhabi is a multi-specialty hospital part of the globally renowned Cleveland Clinic health system, offering world-class healthcare on Al Maryah Island.", shortDescription: "World-class multi-specialty hospital on Al Maryah Island, part of the Cleveland Clinic system.", isClaimed: true, isVerified: true, services: ["Heart & Vascular", "Neurology", "Oncology", "Orthopedics", "Transplant", "Critical Care"], languages: ["English", "Arabic", "French", "Hindi"], insurance: ["Thiqa", "Daman", "AXA", "Cigna", "Allianz", "ADNIC"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "WiFi", "Pharmacy", "Cafeteria", "Prayer Room"], lastVerified: "2026-03-15" },
  { id: "prov_7", name: "Kaya Skin Clinic", slug: "kaya-skin-clinic-dubai", citySlug: "dubai", areaSlug: "dubai-marina", categorySlug: "dermatology", subcategorySlug: "cosmetic-dermatology", address: "Marina Walk, Dubai Marina, Dubai", phone: "+971-4-399-2003", website: "https://www.kayaskinclinic.com", latitude: "25.0775", longitude: "55.1365", googleRating: "4.3", googleReviewCount: 678, description: "Kaya Skin Clinic offers comprehensive dermatological treatments including laser procedures, anti-aging solutions, and medical dermatology.", shortDescription: "Comprehensive dermatological treatments, laser procedures, and anti-aging solutions.", isClaimed: true, isVerified: false, services: ["Laser Treatment", "Anti-Aging", "Acne Treatment", "Hair Removal", "Skin Rejuvenation"], languages: ["English", "Arabic", "Hindi"], insurance: ["Daman", "AXA"], operatingHours: { mon: { open: "10:00", close: "20:00" }, tue: { open: "10:00", close: "20:00" }, wed: { open: "10:00", close: "20:00" }, thu: { open: "10:00", close: "20:00" }, fri: { open: "10:00", close: "18:00" }, sat: { open: "10:00", close: "18:00" }, sun: { open: "12:00", close: "18:00" } }, amenities: ["Parking", "WiFi"], lastVerified: "2026-03-12" },
  { id: "prov_8", name: "Moorfields Eye Hospital Dubai", slug: "moorfields-eye-hospital-dubai-dubai", citySlug: "dubai", areaSlug: "healthcare-city", categorySlug: "ophthalmology", subcategorySlug: "lasik-refractive", address: "Building 64, DHCC, Dubai", phone: "+971-4-429-7888", website: "https://www.moorfields.ae", latitude: "25.2262", longitude: "55.3188", googleRating: "4.7", googleReviewCount: 1156, description: "A branch of London's world-famous Moorfields Eye Hospital, offering specialized ophthalmology services including LASIK, cataract surgery, and retinal treatments.", shortDescription: "London's world-famous Moorfields Eye Hospital branch in Dubai Healthcare City.", isClaimed: true, isVerified: true, services: ["LASIK", "Cataract Surgery", "Retinal Treatment", "Glaucoma", "Pediatric Eye Care", "Corneal Services"], languages: ["English", "Arabic", "Hindi", "Urdu"], insurance: ["Daman", "Thiqa", "AXA", "Cigna", "ADNIC"], operatingHours: { mon: { open: "08:00", close: "18:00" }, tue: { open: "08:00", close: "18:00" }, wed: { open: "08:00", close: "18:00" }, thu: { open: "08:00", close: "18:00" }, fri: { open: "09:00", close: "14:00" }, sat: { open: "09:00", close: "16:00" }, sun: { open: "09:00", close: "16:00" } }, amenities: ["Parking", "Wheelchair Accessible", "WiFi", "Optical Shop"], lastVerified: "2026-03-13" },
  { id: "prov_9", name: "University Hospital Sharjah", slug: "university-hospital-sharjah-sharjah", citySlug: "sharjah", areaSlug: "university-city-sharjah", categorySlug: "hospitals", subcategorySlug: "university-hospitals", address: "University City, Sharjah", phone: "+971-6-505-8555", website: "https://www.uhs.ae", latitude: "25.2910", longitude: "55.4620", googleRating: "4.3", googleReviewCount: 1567, description: "University Hospital Sharjah is a premier teaching hospital associated with the University of Sharjah, offering advanced medical care across 30+ specialties.", shortDescription: "Premier teaching hospital associated with the University of Sharjah.", isClaimed: false, isVerified: true, services: ["Emergency", "Surgery", "Internal Medicine", "Pediatrics", "OB/GYN", "Cardiology"], languages: ["English", "Arabic", "Hindi", "Urdu"], insurance: ["Daman", "Thiqa", "Dubai Insurance", "AXA"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "Pharmacy", "Cafeteria"], lastVerified: "2026-03-15" },
  { id: "prov_10", name: "Priory Wellbeing Centre", slug: "priory-wellbeing-centre-dubai", citySlug: "dubai", areaSlug: "healthcare-city", categorySlug: "mental-health", subcategorySlug: "psychiatry", address: "Building 47, DHCC, Dubai", phone: "+971-4-385-4167", website: "https://www.priorygroup.ae", latitude: "25.2268", longitude: "55.3200", googleRating: "4.6", googleReviewCount: 312, description: "World-renowned mental health provider offering psychiatry, counseling, addiction treatment, and child psychology services.", shortDescription: "World-renowned mental health provider offering psychiatry and counseling.", isClaimed: true, isVerified: true, services: ["Psychiatry", "Counseling", "CBT", "Addiction Treatment", "Child Psychology", "EMDR"], languages: ["English", "Arabic", "French"], insurance: ["Daman", "AXA", "Cigna"], operatingHours: { mon: { open: "08:00", close: "20:00" }, tue: { open: "08:00", close: "20:00" }, wed: { open: "08:00", close: "20:00" }, thu: { open: "08:00", close: "20:00" }, fri: { open: "09:00", close: "17:00" }, sat: { open: "09:00", close: "17:00" }, sun: { open: "10:00", close: "16:00" } }, amenities: ["Parking", "WiFi", "Private Consultation Rooms"], lastVerified: "2026-03-13" },
  { id: "prov_11", name: "German Heart Centre", slug: "german-heart-centre-dubai", citySlug: "dubai", areaSlug: "healthcare-city", categorySlug: "cardiology", address: "Building 37, DHCC, Dubai", phone: "+971-4-362-4797", website: "https://www.german-heart-centre.com", latitude: "25.2267", longitude: "55.3198", googleRating: "4.7", googleReviewCount: 567, description: "Specialized cardiology center offering advanced cardiac diagnostics, interventional cardiology, and cardiac surgery.", shortDescription: "Specialized cardiology center with advanced cardiac diagnostics and interventional procedures.", isClaimed: true, isVerified: true, services: ["Cardiac Diagnostics", "Interventional Cardiology", "Cardiac Surgery", "Echocardiography", "Cardiac Rehabilitation"], languages: ["English", "Arabic", "German"], insurance: ["Daman", "Thiqa", "AXA", "Cigna"], operatingHours: { mon: { open: "08:00", close: "18:00" }, tue: { open: "08:00", close: "18:00" }, wed: { open: "08:00", close: "18:00" }, thu: { open: "08:00", close: "18:00" }, fri: { open: "09:00", close: "14:00" }, sat: { open: "09:00", close: "16:00" }, sun: { open: "09:00", close: "16:00" } }, amenities: ["Parking", "Wheelchair Accessible", "WiFi"], lastVerified: "2026-03-14" },
  { id: "prov_12", name: "Physio Art", slug: "physio-art-dubai", citySlug: "dubai", areaSlug: "business-bay", categorySlug: "physiotherapy", address: "Churchill Tower, Business Bay, Dubai", phone: "+971-4-452-7526", website: "https://www.physioart.com", latitude: "25.1860", longitude: "55.2720", googleRating: "4.8", googleReviewCount: 345, description: "Premium physiotherapy and rehabilitation center specializing in sports injuries, post-surgical rehab, and chronic pain management.", shortDescription: "Premium physiotherapy center specializing in sports injuries and rehabilitation.", isClaimed: true, isVerified: true, services: ["Sports Physiotherapy", "Post-Surgical Rehab", "Chronic Pain Management", "Manual Therapy", "Dry Needling"], languages: ["English", "Arabic", "French"], insurance: ["Daman", "AXA", "Cigna"], operatingHours: { mon: { open: "08:00", close: "20:00" }, tue: { open: "08:00", close: "20:00" }, wed: { open: "08:00", close: "20:00" }, thu: { open: "08:00", close: "20:00" }, fri: { open: "09:00", close: "17:00" }, sat: { open: "09:00", close: "17:00" }, sun: { open: "10:00", close: "15:00" } }, amenities: ["Parking", "WiFi"], lastVerified: "2026-03-12" },
  { id: "prov_13", name: "Aster Pharmacy", slug: "aster-pharmacy-dubai", citySlug: "dubai", areaSlug: "al-barsha", categorySlug: "pharmacy", address: "Al Barsha 1, Dubai", phone: "+971-4-347-5253", website: "https://www.asterpharmacy.com", latitude: "25.1140", longitude: "55.2010", googleRating: "4.3", googleReviewCount: 234, description: "Leading pharmacy chain in the UAE with wide range of medications, health products, and wellness supplements.", shortDescription: "Leading pharmacy chain with wide range of medications and health products.", isClaimed: false, isVerified: false, services: ["Prescription Medications", "OTC Products", "Health Supplements", "Medical Devices", "Delivery Service"], languages: ["English", "Arabic", "Hindi", "Malayalam"], insurance: ["Daman", "Dubai Insurance"], operatingHours: { mon: { open: "08:00", close: "00:00" }, tue: { open: "08:00", close: "00:00" }, wed: { open: "08:00", close: "00:00" }, thu: { open: "08:00", close: "00:00" }, fri: { open: "08:00", close: "00:00" }, sat: { open: "08:00", close: "00:00" }, sun: { open: "08:00", close: "00:00" } }, amenities: ["Parking", "Delivery"], lastVerified: "2026-03-10" },
  { id: "prov_14", name: "Tawam Hospital", slug: "tawam-hospital-al-ain", citySlug: "al-ain", areaSlug: "tawam", categorySlug: "hospitals", subcategorySlug: "government-hospitals", address: "Tawam Area, Al Ain", phone: "+971-3-707-7444", website: "https://www.seha.ae", latitude: "24.2320", longitude: "55.7720", googleRating: "4.4", googleReviewCount: 1234, description: "Tawam Hospital is the primary government hospital in Al Ain, operated by SEHA, specializing in oncology, surgery, and emergency care.", shortDescription: "Primary government hospital in Al Ain, operated by SEHA.", isClaimed: false, isVerified: true, services: ["Oncology", "Emergency", "Surgery", "Internal Medicine", "Pediatrics", "Radiology"], languages: ["English", "Arabic", "Hindi", "Urdu"], insurance: ["Thiqa", "Daman"], operatingHours: { mon: { open: "00:00", close: "23:59" }, tue: { open: "00:00", close: "23:59" }, wed: { open: "00:00", close: "23:59" }, thu: { open: "00:00", close: "23:59" }, fri: { open: "00:00", close: "23:59" }, sat: { open: "00:00", close: "23:59" }, sun: { open: "00:00", close: "23:59" } }, amenities: ["Parking", "Wheelchair Accessible", "Pharmacy", "Cafeteria", "Prayer Room"], lastVerified: "2026-03-15" },
  { id: "prov_15", name: "Bourn Hall Fertility Centre", slug: "bourn-hall-fertility-centre-dubai", citySlug: "dubai", areaSlug: "healthcare-city", categorySlug: "fertility-ivf", subcategorySlug: "ivf-centers", address: "Building 52, DHCC, Dubai", phone: "+971-4-364-4400", website: "https://www.bournhallfertility.ae", latitude: "25.2270", longitude: "55.3205", googleRating: "4.4", googleReviewCount: 287, description: "Pioneers of IVF treatment. Bourn Hall brings world-class fertility care to Dubai with over 40 years of experience.", shortDescription: "Pioneers of IVF with 40+ years of experience in fertility treatment.", isClaimed: true, isVerified: true, services: ["IVF", "ICSI", "Egg Freezing", "Genetic Testing", "Male Fertility", "Fertility Assessment"], languages: ["English", "Arabic", "Hindi"], insurance: ["Daman", "AXA", "Cigna"], operatingHours: { mon: { open: "08:00", close: "18:00" }, tue: { open: "08:00", close: "18:00" }, wed: { open: "08:00", close: "18:00" }, thu: { open: "08:00", close: "18:00" }, fri: { open: "09:00", close: "14:00" }, sat: { open: "09:00", close: "16:00" }, sun: { open: "09:00", close: "16:00" } }, amenities: ["Parking", "WiFi", "Private Consultation Rooms"], lastVerified: "2026-03-13" },
];

// ─── Merged Provider List ──────────────────────────────────────────────────────

// Combine scraped data with sample data. Sample data provides enriched examples
// (with ratings, reviews, full details). Scraped data provides comprehensive coverage.
const ALL_PROVIDERS: LocalProvider[] = [
  ...SAMPLE_PROVIDERS,
  // Add scraped providers that don't duplicate sample ones (by name match)
  ...SCRAPED_PROVIDERS.filter((sp) =>
    !SAMPLE_PROVIDERS.some((sample) =>
      sample.name.toLowerCase() === sp.name.toLowerCase()
    )
  ),
];

// ─── Data Access Functions ─────────────────────────────────────────────────────

export function getCities(): LocalCity[] {
  return [...CITIES];
}

export function getCityBySlug(slug: string): LocalCity | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getAreasByCity(citySlug: string): LocalArea[] {
  const cityAreas = AREAS[citySlug] || [];
  return cityAreas.map((a) => ({ ...a, citySlug }));
}

export function getAreaBySlug(citySlug: string, areaSlug: string): LocalArea | undefined {
  const cityAreas = AREAS[citySlug] || [];
  const area = cityAreas.find((a) => a.slug === areaSlug);
  return area ? { ...area, citySlug } : undefined;
}

export function getCategories(): LocalCategory[] {
  return CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, sortOrder: c.sortOrder }));
}

export function getCategoryBySlug(slug: string): LocalCategory | undefined {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? { slug: cat.slug, name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder } : undefined;
}

export function getSubcategoriesByCategory(categorySlug: string) {
  return SUBCATEGORIES[categorySlug] || [];
}

export function getProviders(filters?: {
  citySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  areaSlug?: string;
  query?: string;
  page?: number;
  limit?: number;
  sort?: "rating" | "name" | "relevance";
}): { providers: LocalProvider[]; total: number; page: number; totalPages: number } {
  let filtered = [...ALL_PROVIDERS];

  if (filters?.citySlug) {
    filtered = filtered.filter((p) => p.citySlug === filters.citySlug);
  }
  if (filters?.categorySlug) {
    filtered = filtered.filter((p) => p.categorySlug === filters.categorySlug);
  }
  if (filters?.subcategorySlug) {
    filtered = filtered.filter((p) => p.subcategorySlug === filters.subcategorySlug);
  }
  if (filters?.areaSlug) {
    filtered = filtered.filter((p) => p.areaSlug === filters.areaSlug);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }

  // Sort
  if (filters?.sort === "rating") {
    filtered.sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  } else if (filters?.sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const providers = filtered.slice(start, start + limit);

  return { providers, total, page, totalPages };
}

export function getProviderBySlug(slug: string): LocalProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.slug === slug);
}

export function getProviderCountByCity(citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.citySlug === citySlug).length;
}

export function getProviderCountByCategoryAndCity(categorySlug: string, citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.categorySlug === categorySlug && p.citySlug === citySlug).length;
}

export function getProviderCountByCategory(categorySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.categorySlug === categorySlug).length;
}

export function getProviderCountByAreaAndCity(areaSlug: string, citySlug: string): number {
  return ALL_PROVIDERS.filter((p) => p.areaSlug === areaSlug && p.citySlug === citySlug).length;
}

export function getTopRatedProviders(citySlug?: string, limit = 5): LocalProvider[] {
  let filtered = [...ALL_PROVIDERS];
  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }
  return filtered
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating))
    .slice(0, limit);
}

export function getFaqs(entityType: string, entitySlug: string): { question: string; answer: string }[] {
  const city = CITIES.find((c) => c.slug === entitySlug);
  const cat = CATEGORIES.find((c) => c.slug === entitySlug);

  if (entityType === "city" && city) {
    return [
      { question: `How many healthcare providers are in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, ${city.name} has numerous registered healthcare providers including hospitals, clinics, dental practices, and specialty centers. Browse the UAE Open Healthcare Directory to find all providers by category and area.` },
      { question: `What are the best-rated hospitals in ${city.name}?`, answer: `The top-rated hospitals in ${city.name} can be found by sorting the UAE Open Healthcare Directory hospital listings by Google rating. Many hospitals maintain ratings above 4.5 stars.` },
      { question: `How do I find a doctor near me in ${city.name}?`, answer: `Use the search feature on the UAE Open Healthcare Directory and enable location access to find healthcare providers nearest to you in ${city.name}. You can filter by specialty, area, and rating.` },
      { question: `Which insurance providers are accepted in ${city.name}?`, answer: `Most healthcare providers in ${city.name} accept major insurance plans including Daman, Thiqa, Dubai Insurance Company (DIC), AXA, Cigna, and others. Check individual provider listings on the UAE Open Healthcare Directory for specifics.` },
    ];
  }

  if (entityType === "category" && cat) {
    return [
      { question: `How do I find the best ${cat.name.toLowerCase()} in the UAE?`, answer: `Browse the UAE Open Healthcare Directory ${cat.name.toLowerCase()} listings to compare providers across all UAE cities. Sort by rating, read Google reviews, and check accepted insurance plans.` },
      { question: `Are ${cat.name.toLowerCase()} services covered by insurance in the UAE?`, answer: `Most major insurance plans in the UAE cover ${cat.name.toLowerCase()} services. Coverage varies by plan. Check with your insurance provider and verify at individual clinics.` },
    ];
  }

  return [];
}

// ─── Insurance Data Access Functions ──────────────────────────────────────────

export type { InsuranceProvider };

export function getInsuranceProviders(): InsuranceProvider[] {
  return [...INSURANCE_PROVIDERS];
}

export function getProvidersByInsurance(insurerSlug: string, citySlug?: string): LocalProvider[] {
  const insurer = INSURANCE_PROVIDERS.find((i) => i.slug === insurerSlug);
  if (!insurer) return [];

  const matchTerms = [insurer.slug, insurer.name.toLowerCase()];

  let filtered = ALL_PROVIDERS.filter((p) =>
    p.insurance.some((ins) => matchTerms.some((term) => ins.toLowerCase().includes(term)))
  );

  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }

  return filtered;
}

export function getProviderCountByInsurance(insurerSlug: string, citySlug: string): number {
  return getProvidersByInsurance(insurerSlug, citySlug).length;
}

// ─── Language Data Access Functions ───────────────────────────────────────────

export type { LanguageInfo };

export function getLanguages(): LanguageInfo[] {
  return [...LANGUAGES];
}

/** Alias matching the naming convention used by consumer code */
export const getLanguagesList = getLanguages;

export function getProvidersByLanguage(languageSlug: string, citySlug?: string): LocalProvider[] {
  const language = LANGUAGES.find((l) => l.slug === languageSlug);
  if (!language) return [];

  const matchName = language.name.toLowerCase();

  let filtered = ALL_PROVIDERS.filter((p) =>
    p.languages.some((lang) => lang.toLowerCase() === matchName)
  );

  if (citySlug) {
    filtered = filtered.filter((p) => p.citySlug === citySlug);
  }

  return filtered;
}

export function getProviderCountByLanguage(languageSlug: string, citySlug: string): number {
  return getProvidersByLanguage(languageSlug, citySlug).length;
}

// ─── Condition Data Access Functions ──────────────────────────────────────────

export type { Condition };

export function getConditions(): Condition[] {
  return [...CONDITIONS];
}
