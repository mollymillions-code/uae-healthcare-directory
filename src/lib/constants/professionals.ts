/**
 * DHA Sheryan Professional Directory — Constants & Slug Mappings
 *
 * Source: DHA Sheryan REST API (scraped 2026-04-03)
 * Total: 99,520 healthcare professionals in Dubai
 */

// ─── Categories ──────────────────────────────────────────────────────────────

export interface ProfessionalCategory {
  slug: string;
  name: string;
  nameAr: string;
  apiName: string; // exact name from DHA API
  count: number;
  icon: string;
  description: string;
}

export const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  {
    slug: "physicians",
    name: "Physicians & Doctors",
    nameAr: "الأطباء",
    apiName: "Physician",
    count: 24186,
    icon: "Stethoscope",
    description: "Licensed physicians including general practitioners, specialists, and consultants across all medical disciplines in Dubai.",
  },
  {
    slug: "dentists",
    name: "Dentists",
    nameAr: "أطباء الأسنان",
    apiName: "Dentist",
    count: 7713,
    icon: "Smile",
    description: "Licensed dental professionals including general dentists, orthodontists, endodontists, and oral surgeons practicing in Dubai.",
  },
  {
    slug: "nurses",
    name: "Nurses & Midwives",
    nameAr: "الممرضون والقابلات",
    apiName: "Nurse and Midwife",
    count: 34733,
    icon: "HeartPulse",
    description: "Registered nurses, assistant nurses, and midwives licensed by Dubai Health Authority.",
  },
  {
    slug: "allied-health",
    name: "Allied Health Professionals",
    nameAr: "المهنيون الصحيون المساندون",
    apiName: "Allied Health",
    count: 32888,
    icon: "Users",
    description: "Pharmacists, physiotherapists, lab technologists, optometrists, psychologists, and other allied health professionals in Dubai.",
  },
];

// ─── Physician Specialties (merged Specialist + Consultant) ──────────────────

export interface MedicalSpecialty {
  slug: string;
  name: string;
  nameAr: string;
  category: string; // parent category slug
  searchTerms: string[]; // common search queries
  relatedDirectoryCategory?: string; // maps to existing directory category slug
  count: number;
}

export const PHYSICIAN_SPECIALTIES: MedicalSpecialty[] = [
  { slug: "general-practitioner", name: "General Practitioner", nameAr: "طبيب عام", category: "physicians", searchTerms: ["GP", "general doctor", "family doctor"], relatedDirectoryCategory: "clinics", count: 6922 },
  { slug: "obstetrics-gynecology", name: "Obstetrics & Gynecology", nameAr: "طب النساء والتوليد", category: "physicians", searchTerms: ["OB/GYN", "gynecologist", "obstetrician", "women's doctor"], relatedDirectoryCategory: "ob-gyn", count: 1510 },
  { slug: "pediatrics", name: "Pediatrics", nameAr: "طب الأطفال", category: "physicians", searchTerms: ["pediatrician", "child doctor", "kids doctor"], relatedDirectoryCategory: "pediatrics", count: 1228 },
  { slug: "family-medicine", name: "Family Medicine", nameAr: "طب الأسرة", category: "physicians", searchTerms: ["family doctor", "family physician"], relatedDirectoryCategory: "clinics", count: 1100 },
  { slug: "dermatology", name: "Dermatology", nameAr: "طب الجلدية", category: "physicians", searchTerms: ["dermatologist", "skin doctor", "skin specialist"], relatedDirectoryCategory: "dermatology", count: 1072 },
  { slug: "anesthesia", name: "Anesthesiology", nameAr: "طب التخدير", category: "physicians", searchTerms: ["anesthesiologist", "anaesthetist"], count: 1056 },
  { slug: "internal-medicine", name: "Internal Medicine", nameAr: "طب الباطنية", category: "physicians", searchTerms: ["internist", "internal medicine doctor"], count: 984 },
  { slug: "orthopedic-surgery", name: "Orthopedic Surgery", nameAr: "جراحة العظام", category: "physicians", searchTerms: ["orthopedic surgeon", "bone doctor", "joint specialist"], relatedDirectoryCategory: "orthopedics", count: 917 },
  { slug: "general-surgery", name: "General Surgery", nameAr: "الجراحة العامة", category: "physicians", searchTerms: ["general surgeon", "surgeon"], count: 729 },
  { slug: "ophthalmology", name: "Ophthalmology", nameAr: "طب العيون", category: "physicians", searchTerms: ["eye doctor", "ophthalmologist", "eye specialist"], relatedDirectoryCategory: "ophthalmology", count: 608 },
  { slug: "otolaryngology", name: "ENT (Otolaryngology)", nameAr: "طب الأنف والأذن والحنجرة", category: "physicians", searchTerms: ["ENT doctor", "ear nose throat", "ENT specialist"], relatedDirectoryCategory: "ent", count: 561 },
  { slug: "plastic-surgery", name: "Plastic & Cosmetic Surgery", nameAr: "الجراحة التجميلية", category: "physicians", searchTerms: ["plastic surgeon", "cosmetic surgeon"], relatedDirectoryCategory: "cosmetic-plastic", count: 518 },
  { slug: "diagnostic-radiology", name: "Diagnostic Radiology", nameAr: "الأشعة التشخيصية", category: "physicians", searchTerms: ["radiologist", "imaging specialist"], relatedDirectoryCategory: "radiology-imaging", count: 472 },
  { slug: "emergency-medicine", name: "Emergency Medicine", nameAr: "طب الطوارئ", category: "physicians", searchTerms: ["ER doctor", "emergency physician"], relatedDirectoryCategory: "emergency-care", count: 427 },
  { slug: "cardiology", name: "Cardiology", nameAr: "طب القلب", category: "physicians", searchTerms: ["cardiologist", "heart doctor", "heart specialist"], relatedDirectoryCategory: "cardiology", count: 394 },
  { slug: "radiology", name: "Radiology", nameAr: "الأشعة", category: "physicians", searchTerms: ["radiologist"], relatedDirectoryCategory: "radiology-imaging", count: 365 },
  { slug: "psychiatry", name: "Psychiatry", nameAr: "الطب النفسي", category: "physicians", searchTerms: ["psychiatrist", "mental health doctor"], relatedDirectoryCategory: "mental-health", count: 362 },
  { slug: "urology", name: "Urology", nameAr: "طب المسالك البولية", category: "physicians", searchTerms: ["urologist", "urology specialist"], relatedDirectoryCategory: "urology", count: 313 },
  { slug: "gastroenterology", name: "Gastroenterology", nameAr: "طب الجهاز الهضمي", category: "physicians", searchTerms: ["gastroenterologist", "stomach doctor", "GI specialist"], relatedDirectoryCategory: "gastroenterology", count: 256 },
  { slug: "neurology", name: "Neurology", nameAr: "طب الأعصاب", category: "physicians", searchTerms: ["neurologist", "brain doctor", "nerve specialist"], relatedDirectoryCategory: "neurology", count: 254 },
  { slug: "clinical-pathology", name: "Clinical Pathology", nameAr: "علم الأمراض السريري", category: "physicians", searchTerms: ["pathologist", "lab doctor"], count: 249 },
  { slug: "endocrinology", name: "Endocrinology", nameAr: "طب الغدد الصماء", category: "physicians", searchTerms: ["endocrinologist", "hormone doctor", "diabetes doctor", "thyroid doctor"], count: 218 },
  { slug: "neurosurgery", name: "Neurosurgery", nameAr: "جراحة الأعصاب", category: "physicians", searchTerms: ["neurosurgeon", "brain surgeon"], relatedDirectoryCategory: "neurology", count: 194 },
  { slug: "pulmonary-disease", name: "Pulmonology", nameAr: "طب الرئة", category: "physicians", searchTerms: ["pulmonologist", "lung doctor", "respiratory doctor"], count: 186 },
  { slug: "critical-care", name: "Critical Care Medicine", nameAr: "طب العناية المركزة", category: "physicians", searchTerms: ["ICU doctor", "critical care specialist", "intensivist"], count: 176 },
  { slug: "nephrology", name: "Nephrology", nameAr: "طب الكلى", category: "physicians", searchTerms: ["nephrologist", "kidney doctor"], relatedDirectoryCategory: "nephrology", count: 154 },
  { slug: "interventional-cardiology", name: "Interventional Cardiology", nameAr: "القسطرة القلبية", category: "physicians", searchTerms: ["interventional cardiologist"], relatedDirectoryCategory: "cardiology", count: 120 },
  { slug: "rheumatology", name: "Rheumatology", nameAr: "طب الروماتيزم", category: "physicians", searchTerms: ["rheumatologist", "arthritis doctor", "joint pain specialist"], count: 108 },
  { slug: "medical-oncology", name: "Medical Oncology", nameAr: "طب الأورام", category: "physicians", searchTerms: ["oncologist", "cancer doctor"], relatedDirectoryCategory: "oncology", count: 107 },
  { slug: "neonatology", name: "Neonatology", nameAr: "طب حديثي الولادة", category: "physicians", searchTerms: ["neonatologist", "newborn doctor"], relatedDirectoryCategory: "pediatrics", count: 104 },
  { slug: "anatomic-pathology", name: "Anatomic Pathology", nameAr: "علم التشريح المرضي", category: "physicians", searchTerms: ["anatomic pathologist"], count: 95 },
  { slug: "vascular-surgery", name: "Vascular Surgery", nameAr: "جراحة الأوعية الدموية", category: "physicians", searchTerms: ["vascular surgeon"], count: 72 },
  { slug: "pediatric-surgery", name: "Pediatric Surgery", nameAr: "جراحة الأطفال", category: "physicians", searchTerms: ["pediatric surgeon", "child surgeon"], relatedDirectoryCategory: "pediatrics", count: 61 },
  { slug: "reproductive-medicine", name: "Reproductive Medicine & IVF", nameAr: "طب الإنجاب وأطفال الأنابيب", category: "physicians", searchTerms: ["fertility doctor", "IVF specialist", "reproductive endocrinologist"], relatedDirectoryCategory: "fertility-ivf", count: 53 },
  { slug: "physical-rehabilitation", name: "Physical Medicine & Rehabilitation", nameAr: "طب إعادة التأهيل", category: "physicians", searchTerms: ["physiatrist", "rehabilitation doctor"], relatedDirectoryCategory: "physiotherapy", count: 53 },
];

export const DENTIST_SPECIALTIES: MedicalSpecialty[] = [
  { slug: "general-dentist", name: "General Dentist", nameAr: "طبيب أسنان عام", category: "dentists", searchTerms: ["dentist", "dental doctor"], relatedDirectoryCategory: "dental", count: 5102 },
  { slug: "orthodontics", name: "Orthodontics", nameAr: "تقويم الأسنان", category: "dentists", searchTerms: ["orthodontist", "braces doctor"], relatedDirectoryCategory: "dental", count: 756 },
  { slug: "endodontics", name: "Endodontics", nameAr: "علاج الجذور", category: "dentists", searchTerms: ["endodontist", "root canal specialist"], relatedDirectoryCategory: "dental", count: 303 },
  { slug: "prosthodontics", name: "Prosthodontics", nameAr: "تركيبات الأسنان", category: "dentists", searchTerms: ["prosthodontist", "dental implant specialist", "denture specialist"], relatedDirectoryCategory: "dental", count: 266 },
  { slug: "pediatric-dentistry", name: "Pediatric Dentistry", nameAr: "طب أسنان الأطفال", category: "dentists", searchTerms: ["pediatric dentist", "children's dentist"], relatedDirectoryCategory: "dental", count: 247 },
  { slug: "oral-maxillofacial-surgery", name: "Oral & Maxillofacial Surgery", nameAr: "جراحة الفم والفكين", category: "dentists", searchTerms: ["oral surgeon", "jaw surgeon", "wisdom tooth extraction"], relatedDirectoryCategory: "dental", count: 249 },
  { slug: "implantology", name: "Dental Implantology", nameAr: "زراعة الأسنان", category: "dentists", searchTerms: ["dental implant doctor", "implantologist"], relatedDirectoryCategory: "dental", count: 223 },
  { slug: "periodontics", name: "Periodontics", nameAr: "أمراض اللثة", category: "dentists", searchTerms: ["periodontist", "gum specialist", "gum disease doctor"], relatedDirectoryCategory: "dental", count: 199 },
  { slug: "restorative-dentistry", name: "Restorative Dentistry", nameAr: "طب الأسنان الترميمي", category: "dentists", searchTerms: ["restorative dentist", "cosmetic dentist"], relatedDirectoryCategory: "dental", count: 41 },
  { slug: "oral-surgery", name: "Oral Surgery", nameAr: "جراحة الفم", category: "dentists", searchTerms: ["oral surgeon"], relatedDirectoryCategory: "dental", count: 46 },
  { slug: "oral-medicine", name: "Oral Medicine", nameAr: "طب الفم", category: "dentists", searchTerms: ["oral medicine specialist"], relatedDirectoryCategory: "dental", count: 11 },
];

export const NURSE_SPECIALTIES: MedicalSpecialty[] = [
  { slug: "registered-nurse", name: "Registered Nurse", nameAr: "ممرض مسجل", category: "nurses", searchTerms: ["RN", "registered nurse"], count: 28552 },
  { slug: "assistant-nurse", name: "Assistant Nurse", nameAr: "ممرض مساعد", category: "nurses", searchTerms: ["nursing assistant", "nurse aide"], count: 5725 },
  { slug: "registered-midwife", name: "Registered Midwife", nameAr: "قابلة مسجلة", category: "nurses", searchTerms: ["midwife", "birth attendant"], count: 320 },
  { slug: "practical-nurse", name: "Practical Nurse", nameAr: "ممرض عملي", category: "nurses", searchTerms: ["LPN", "practical nurse"], count: 87 },
];

export const ALLIED_HEALTH_SPECIALTIES: MedicalSpecialty[] = [
  { slug: "pharmacist", name: "Pharmacist", nameAr: "صيدلي", category: "allied-health", searchTerms: ["pharmacist", "pharmacy"], relatedDirectoryCategory: "pharmacy", count: 9388 },
  { slug: "physiotherapist", name: "Physiotherapist", nameAr: "أخصائي علاج طبيعي", category: "allied-health", searchTerms: ["physiotherapist", "physical therapist", "PT"], relatedDirectoryCategory: "physiotherapy", count: 3563 },
  { slug: "aesthetician", name: "Aesthetician & Beauty Therapist", nameAr: "أخصائي تجميل", category: "allied-health", searchTerms: ["aesthetician", "beauty therapist", "skin care specialist"], relatedDirectoryCategory: "wellness-spas", count: 2142 },
  { slug: "lab-technologist", name: "Medical Laboratory Technologist", nameAr: "تقني مختبرات طبية", category: "allied-health", searchTerms: ["lab technologist", "medical technologist"], relatedDirectoryCategory: "labs-diagnostics", count: 2372 },
  { slug: "optometrist", name: "Optometrist", nameAr: "أخصائي بصريات", category: "allied-health", searchTerms: ["optometrist", "eye test", "vision specialist"], relatedDirectoryCategory: "ophthalmology", count: 1851 },
  { slug: "radiography-technologist", name: "Radiography Technologist", nameAr: "تقني أشعة", category: "allied-health", searchTerms: ["X-ray technician", "radiographer"], relatedDirectoryCategory: "radiology-imaging", count: 1591 },
  { slug: "lab-technician", name: "Medical Laboratory Technician", nameAr: "فني مختبرات", category: "allied-health", searchTerms: ["lab technician"], relatedDirectoryCategory: "labs-diagnostics", count: 1211 },
  { slug: "dental-assistant", name: "Dental Assistant", nameAr: "مساعد طبيب أسنان", category: "allied-health", searchTerms: ["dental assistant", "dental nurse"], relatedDirectoryCategory: "dental", count: 841 },
  { slug: "pharmacy-technician", name: "Pharmacy Technician", nameAr: "فني صيدلة", category: "allied-health", searchTerms: ["pharmacy technician", "pharmacy tech"], relatedDirectoryCategory: "pharmacy", count: 832 },
  { slug: "laser-technician", name: "Laser Hair Reduction Technician", nameAr: "فني ليزر", category: "allied-health", searchTerms: ["laser technician", "laser hair removal"], relatedDirectoryCategory: "dermatology", count: 654 },
  { slug: "speech-therapist", name: "Speech Therapist", nameAr: "أخصائي نطق ولغة", category: "allied-health", searchTerms: ["speech therapist", "speech pathologist", "SLP"], count: 553 },
  { slug: "clinical-dietician", name: "Clinical Dietician", nameAr: "أخصائي تغذية سريرية", category: "allied-health", searchTerms: ["dietician", "dietitian", "nutritionist"], relatedDirectoryCategory: "nutrition-dietetics", count: 489 },
  { slug: "occupational-therapist", name: "Occupational Therapist", nameAr: "أخصائي علاج وظيفي", category: "allied-health", searchTerms: ["occupational therapist", "OT"], relatedDirectoryCategory: "physiotherapy", count: 456 },
  { slug: "anesthesia-technician", name: "Anesthesia Technician", nameAr: "فني تخدير", category: "allied-health", searchTerms: ["anesthesia tech"], count: 458 },
  { slug: "clinical-psychologist", name: "Clinical Psychologist", nameAr: "أخصائي نفسي سريري", category: "allied-health", searchTerms: ["psychologist", "therapist", "counselor"], relatedDirectoryCategory: "mental-health", count: 409 },
  { slug: "dental-lab-technician", name: "Dental Lab Technician", nameAr: "فني مختبر أسنان", category: "allied-health", searchTerms: ["dental technician"], relatedDirectoryCategory: "dental", count: 325 },
  { slug: "clinical-pharmacist", name: "Clinical Pharmacist", nameAr: "صيدلي سريري", category: "allied-health", searchTerms: ["clinical pharmacist"], relatedDirectoryCategory: "pharmacy", count: 291 },
  { slug: "audiologist", name: "Audiologist", nameAr: "أخصائي سمعيات", category: "allied-health", searchTerms: ["audiologist", "hearing specialist"], relatedDirectoryCategory: "ent", count: 176 },
  { slug: "nutritionist", name: "Nutritionist", nameAr: "أخصائي تغذية", category: "allied-health", searchTerms: ["nutritionist", "diet expert"], relatedDirectoryCategory: "nutrition-dietetics", count: 182 },
  { slug: "respiratory-therapist", name: "Respiratory Therapist", nameAr: "أخصائي علاج تنفسي", category: "allied-health", searchTerms: ["respiratory therapist", "RT"], count: 171 },
  { slug: "massage-therapist", name: "Massage Therapist", nameAr: "معالج بالتدليك", category: "allied-health", searchTerms: ["massage therapist", "massage therapy"], relatedDirectoryCategory: "wellness-spas", count: 152 },
  { slug: "dental-hygienist", name: "Dental Hygienist", nameAr: "أخصائي صحة أسنان", category: "allied-health", searchTerms: ["dental hygienist", "teeth cleaning"], relatedDirectoryCategory: "dental", count: 148 },
  { slug: "phlebotomist", name: "Phlebotomist", nameAr: "أخصائي سحب دم", category: "allied-health", searchTerms: ["phlebotomist", "blood draw"], relatedDirectoryCategory: "labs-diagnostics", count: 225 },
];

// ─── All Specialties (flat list for lookups) ─────────────────────────────────

export const ALL_SPECIALTIES: MedicalSpecialty[] = [
  ...PHYSICIAN_SPECIALTIES,
  ...DENTIST_SPECIALTIES,
  ...NURSE_SPECIALTIES,
  ...ALLIED_HEALTH_SPECIALTIES,
];

const SPECIALTY_BY_SLUG = new Map<string, MedicalSpecialty>(
  ALL_SPECIALTIES.map((s) => [s.slug, s])
);

export function getSpecialtyBySlug(slug: string): MedicalSpecialty | undefined {
  return SPECIALTY_BY_SLUG.get(slug);
}

export function getCategoryBySlug(slug: string): ProfessionalCategory | undefined {
  return PROFESSIONAL_CATEGORIES.find((c) => c.slug === slug);
}

export function getSpecialtiesByCategory(categorySlug: string): MedicalSpecialty[] {
  return ALL_SPECIALTIES.filter((s) => s.category === categorySlug);
}

// ─── DHA API specialty name → slug mapping ───────────────────────────────────

const SPECIALTY_SLUG_MAP: Record<string, string> = {};
for (const s of ALL_SPECIALTIES) {
  // Map both the base name and Specialist/Consultant variants
  SPECIALTY_SLUG_MAP[s.name.toLowerCase()] = s.slug;
}
// Add common DHA API variations
const API_SPECIALTY_MAP: Record<string, string> = {
  "general practitioner": "general-practitioner",
  "specialist obstetrics and gynecology": "obstetrics-gynecology",
  "consultant obstetrics and gynecology": "obstetrics-gynecology",
  "specialist pediatrics": "pediatrics",
  "consultant pediatrics": "pediatrics",
  "specialist family medicine": "family-medicine",
  "consultant family medicine": "family-medicine",
  "specialist dermatology": "dermatology",
  "consultant dermatology": "dermatology",
  "specialist anesthesia": "anesthesia",
  "consultant anesthesia": "anesthesia",
  "specialist internal medicine": "internal-medicine",
  "consultant internal medicine": "internal-medicine",
  "specialist orthopedic surgery": "orthopedic-surgery",
  "consultant orthopedic surgery": "orthopedic-surgery",
  "specialist general surgery": "general-surgery",
  "consultant general surgery": "general-surgery",
  "specialist ophthalmology": "ophthalmology",
  "consultant ophthalmology": "ophthalmology",
  "specialist otolaryngology": "otolaryngology",
  "consultant otolaryngology": "otolaryngology",
  "specialist plastic surgery": "plastic-surgery",
  "consultant plastic surgery": "plastic-surgery",
  "specialist diagnostic radiology": "diagnostic-radiology",
  "consultant diagnostic radiology": "diagnostic-radiology",
  "specialist emergency medicine": "emergency-medicine",
  "consultant emergency medicine": "emergency-medicine",
  "specialist cardiology": "cardiology",
  "consultant cardiology": "cardiology",
  "specialist radiology": "radiology",
  "consultant radiology": "radiology",
  "specialist psychiatry": "psychiatry",
  "consultant psychiatry": "psychiatry",
  "specialist urology": "urology",
  "consultant urology": "urology",
  "specialist gastroenterology": "gastroenterology",
  "consultant gastroenterology": "gastroenterology",
  "specialist neurology": "neurology",
  "consultant neurology": "neurology",
  "specialist endocrinology": "endocrinology",
  "consultant endocrinology": "endocrinology",
  "specialist neurosurgery": "neurosurgery",
  "consultant neurosurgery": "neurosurgery",
  "specialist pulmonary disease": "pulmonary-disease",
  "consultant pulmonary disease": "pulmonary-disease",
  "specialist critical care medicine": "critical-care",
  "consultant critical care medicine": "critical-care",
  "specialist nephrology": "nephrology",
  "consultant nephrology": "nephrology",
  "specialist interventional cardiology": "interventional-cardiology",
  "consultant interventional cardiology": "interventional-cardiology",
  "specialist rheumatology": "rheumatology",
  "consultant rheumatology": "rheumatology",
  "specialist medical oncology": "medical-oncology",
  "consultant medical oncology": "medical-oncology",
  "specialist neonatology": "neonatology",
  "consultant neonatology": "neonatology",
  "specialist vascular surgery": "vascular-surgery",
  "consultant vascular surgery": "vascular-surgery",
  "specialist pediatric surgery": "pediatric-surgery",
  "consultant pediatric surgery": "pediatric-surgery",
  "specialist reproductive medicine and infertility": "reproductive-medicine",
  "consultant reproductive medicine and infertility": "reproductive-medicine",
  "specialist physical medicine and rehabilitation": "physical-rehabilitation",
  "consultant physical medicine and rehabilitation": "physical-rehabilitation",
  "general dentist": "general-dentist",
  "specialist orthodontics": "orthodontics",
  "consultant orthodontics": "orthodontics",
  "specialist endodontics": "endodontics",
  "consultant endodontics": "endodontics",
  "specialist prosthodontics": "prosthodontics",
  "consultant prosthodontics": "prosthodontics",
  "specialist pediatric dentistry": "pediatric-dentistry",
  "consultant pediatric dentistry": "pediatric-dentistry",
  "specialist oral and maxillofacial surgery": "oral-maxillofacial-surgery",
  "consultant oral and maxillofacial surgery": "oral-maxillofacial-surgery",
  "implantology privilege": "implantology",
  "specialist periodontics": "periodontics",
  "consultant periodontics": "periodontics",
  "specialist restorative dentistry": "restorative-dentistry",
  "specialist oral surgery": "oral-surgery",
  "specialist oral medicine": "oral-medicine",
  "registered nurse": "registered-nurse",
  "assistant nurse": "assistant-nurse",
  "registered midwife": "registered-midwife",
  "practical nurse": "practical-nurse",
  "pharmacist": "pharmacist",
  "physiotherapist": "physiotherapist",
  "aesthetician/beauty therapist": "aesthetician",
  "medical laboratory technologist": "lab-technologist",
  "optometrist": "optometrist",
  "radiography technologist": "radiography-technologist",
  "medical laboratory technician": "lab-technician",
  "dental assistant": "dental-assistant",
  "pharmacy technician": "pharmacy-technician",
  "laser hair reduction technician": "laser-technician",
  "speech therapist/speech & language pathologist": "speech-therapist",
  "clinical dietician": "clinical-dietician",
  "occupational therapist": "occupational-therapist",
  "anesthesia technician": "anesthesia-technician",
  "clinical psychologist": "clinical-psychologist",
  "dental lab technician": "dental-lab-technician",
  "clinical pharmacist": "clinical-pharmacist",
  "audiologist": "audiologist",
  "nutritionist": "nutritionist",
  "respiratory therapist": "respiratory-therapist",
  "massage therapist": "massage-therapist",
  "dental hygienist": "dental-hygienist",
  "phlebotomist": "phlebotomist",
};

export function getSpecialtySlugFromApi(apiSpecialty: string): string | undefined {
  const lower = apiSpecialty.trim().toLowerCase();
  return API_SPECIALTY_MAP[lower] || SPECIALTY_SLUG_MAP[lower];
}

// ─── Facility slug generation ────────────────────────────────────────────────

const slugCache = new Map<string, string>();

export function generateFacilitySlug(name: string): string {
  const cached = slugCache.get(name);
  if (cached !== undefined) return cached;

  const slug = name
    .toLowerCase()
    .replace(/\s*-\s*dubai\s*health\s*/i, "-dh")
    .replace(/\s*(l\.?l\.?c\.?|fz-?llc|fzc|ltd|pvt|branch|br of)\s*/gi, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);

  slugCache.set(name, slug);
  return slug;
}

// ─── Stats for AEO pages ────────────────────────────────────────────────────

export const PROFESSIONAL_STATS = {
  total: 99520,
  physicians: 24186,
  dentists: 7713,
  nurses: 34733,
  alliedHealth: 32888,
  uniqueSpecialties: 434,
  uniqueFacilities: 5505,
  scraped: "2026-04-03",
  source: "DHA Sheryan Medical Registry",
  topFacilities: [
    { name: "Rashid Hospital", staff: 2675 },
    { name: "Dubai Hospital", staff: 1638 },
    { name: "American Hospital Dubai", staff: 1107 },
    { name: "Mediclinic Parkview Hospital", staff: 1012 },
    { name: "Al Jalila Children's Specialty Hospital", staff: 988 },
    { name: "Mediclinic City Hospital", staff: 929 },
    { name: "Al Zahra Hospital", staff: 895 },
    { name: "Latifa Hospital", staff: 874 },
    { name: "Kings College Hospital", staff: 838 },
    { name: "Saudi German Hospital", staff: 818 },
  ],
} as const;
