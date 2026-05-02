// ============================================================================
// Healthcare role taxonomy for the UAE jobs market.
//
// The discipline_slug field on `jobs` and `candidate_profiles` is the
// fine-grained role tag and is the primary programmatic-SEO entry point
// (one indexable hub per discipline, plus discipline×city pages).
//
// `role` is the high-level family. `discipline_slug` is the actual job-title
// segment used in URLs and search-query intent.
//
// Sources for the taxonomy:
//  - DHA / DOH / MOHAP licensing categories (pharmacist, dentist, RN, etc.)
//  - Bayt and Naukrigulf UAE healthcare-job query distribution
//  - Common UAE clinic-org-chart roles observed across hospital websites
// ============================================================================

export type Role =
  | "physician"
  | "nurse"
  | "allied_health"
  | "dental"
  | "imaging"
  | "pharmacy"
  | "support"
  | "management"
  | "sales"
  | "other";

export interface Discipline {
  slug: string;
  role: Role;
  name: string;
  nameAr?: string;
  /** plural form used in hub headings */
  plural: string;
  /** singular search-intent string e.g. "lab technician jobs in UAE" */
  searchIntent: string;
  /** short two-line description for the hub hero */
  blurb: string;
  /** 2026 UAE salary band, AED/month, mid-experience midpoint reference */
  salaryRefAed?: { min: number; max: number };
  /** which UAE health regulator's license is most relevant */
  licenseAuthority?: "dha" | "doh" | "mohap" | "shared";
  /** dataflow verification typically required for international hires */
  dataflowExpected?: boolean;
}

export const DISCIPLINES: Discipline[] = [
  // ── Physicians ──────────────────────────────────────────────────────────
  { slug: "general-practitioner", role: "physician", name: "General Practitioner", nameAr: "طبيب عام", plural: "General Practitioners", searchIntent: "general practitioner jobs UAE", blurb: "GP/family-medicine roles across UAE clinics. DHA, DOH and MOHAP licensable.", salaryRefAed: { min: 18000, max: 35000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "specialist-physician", role: "physician", name: "Specialist Physician", nameAr: "طبيب اختصاصي", plural: "Specialist Physicians", searchIntent: "specialist doctor jobs UAE", blurb: "Specialist-grade roles across cardiology, paediatrics, internal medicine, dermatology and other specialties.", salaryRefAed: { min: 30000, max: 65000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "consultant-physician", role: "physician", name: "Consultant Physician", nameAr: "استشاري", plural: "Consultant Physicians", searchIntent: "consultant doctor jobs UAE", blurb: "Senior consultant roles across UAE hospitals and large groups. 10+ years post-fellowship.", salaryRefAed: { min: 55000, max: 110000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "surgeon", role: "physician", name: "Surgeon", nameAr: "جرّاح", plural: "Surgeons", searchIntent: "surgeon jobs UAE", blurb: "General, orthopaedic, plastic, cardiac and neurosurgical posts. Mostly hospital-based.", salaryRefAed: { min: 45000, max: 130000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "anaesthesiologist", role: "physician", name: "Anaesthesiologist", nameAr: "طبيب تخدير", plural: "Anaesthesiologists", searchIntent: "anaesthesiologist jobs UAE", blurb: "Anaesthesia consultant + specialist roles for hospital ORs and ambulatory surgical centres.", salaryRefAed: { min: 40000, max: 95000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "psychiatrist", role: "physician", name: "Psychiatrist", nameAr: "طبيب نفسي", plural: "Psychiatrists", searchIntent: "psychiatrist jobs UAE", blurb: "Psychiatry roles across mental-health-licensed clinics and tertiary hospitals.", salaryRefAed: { min: 35000, max: 90000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Nursing ─────────────────────────────────────────────────────────────
  { slug: "registered-nurse", role: "nurse", name: "Registered Nurse", nameAr: "ممرض/ة مسجل/ة", plural: "Registered Nurses", searchIntent: "registered nurse jobs UAE", blurb: "RN roles in clinics, hospitals and home health. BSN + Dataflow + Prometric or DHA computer-based test typically required.", salaryRefAed: { min: 5500, max: 14000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "icu-nurse", role: "nurse", name: "ICU Nurse", plural: "ICU Nurses", searchIntent: "ICU nurse jobs UAE", blurb: "Critical-care nursing posts in adult ICU, cardiac ICU and neonatal ICU units across hospital networks.", salaryRefAed: { min: 7500, max: 18000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "or-nurse", role: "nurse", name: "Operating Room Nurse", plural: "Operating Room Nurses", searchIntent: "OR nurse jobs UAE", blurb: "Scrub and circulating nurse roles across hospital ORs and ambulatory surgical centres.", salaryRefAed: { min: 7000, max: 17000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "er-nurse", role: "nurse", name: "Emergency Room Nurse", plural: "Emergency Room Nurses", searchIntent: "ER nurse jobs UAE", blurb: "Emergency-department nursing roles in DHA, DOH and MOHAP-licensed hospitals.", salaryRefAed: { min: 7000, max: 17000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "midwife", role: "nurse", name: "Midwife", nameAr: "قابلة", plural: "Midwives", searchIntent: "midwife jobs UAE", blurb: "Midwifery roles in maternity hospitals and birthing-centre programmes.", salaryRefAed: { min: 7000, max: 16000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "school-nurse", role: "nurse", name: "School Nurse", plural: "School Nurses", searchIntent: "school nurse jobs UAE", blurb: "On-site nurse roles for KHDA / ADEK schools and nurseries.", salaryRefAed: { min: 6000, max: 12000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "home-care-nurse", role: "nurse", name: "Home Care Nurse", plural: "Home Care Nurses", searchIntent: "home care nurse jobs UAE", blurb: "Visiting-nurse roles for home-healthcare licensees and post-acute providers.", salaryRefAed: { min: 6000, max: 13000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Allied health (rehab, therapy, dietetics) ───────────────────────────
  { slug: "physiotherapist", role: "allied_health", name: "Physiotherapist", nameAr: "أخصائي علاج طبيعي", plural: "Physiotherapists", searchIntent: "physiotherapist jobs UAE", blurb: "Physiotherapy roles in outpatient clinics, hospitals and post-surgical rehab centres.", salaryRefAed: { min: 8000, max: 22000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "occupational-therapist", role: "allied_health", name: "Occupational Therapist", plural: "Occupational Therapists", searchIntent: "occupational therapist jobs UAE", blurb: "OT roles in paediatric clinics, special-needs centres and rehab units.", salaryRefAed: { min: 8000, max: 22000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "speech-language-pathologist", role: "allied_health", name: "Speech & Language Pathologist", plural: "Speech & Language Pathologists", searchIntent: "speech therapist jobs UAE", blurb: "SLP roles for paediatric therapy clinics and rehab hospitals.", salaryRefAed: { min: 8000, max: 22000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "clinical-dietitian", role: "allied_health", name: "Clinical Dietitian", plural: "Clinical Dietitians", searchIntent: "dietitian jobs UAE", blurb: "Dietitian and nutritionist roles in hospitals, weight-management clinics and corporate-wellness programmes.", salaryRefAed: { min: 7000, max: 17000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "psychologist", role: "allied_health", name: "Clinical Psychologist", plural: "Clinical Psychologists", searchIntent: "psychologist jobs UAE", blurb: "Clinical psychology roles for mental-health licensees and tertiary hospital outpatient programmes.", salaryRefAed: { min: 12000, max: 30000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "audiologist", role: "allied_health", name: "Audiologist", plural: "Audiologists", searchIntent: "audiologist jobs UAE", blurb: "Audiology roles for ENT clinics and paediatric hearing centres.", salaryRefAed: { min: 8000, max: 18000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Imaging / diagnostics ───────────────────────────────────────────────
  { slug: "radiology-technologist", role: "imaging", name: "Radiology Technologist", plural: "Radiology Technologists", searchIntent: "radiology technologist jobs UAE", blurb: "X-ray, CT and general radiographer roles in hospitals and imaging centres.", salaryRefAed: { min: 7000, max: 16000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "mri-technologist", role: "imaging", name: "MRI Technologist", plural: "MRI Technologists", searchIntent: "MRI technologist jobs UAE", blurb: "MRI radiographer roles for diagnostic-imaging centres and tertiary hospitals.", salaryRefAed: { min: 8500, max: 18000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "ct-technologist", role: "imaging", name: "CT Technologist", plural: "CT Technologists", searchIntent: "CT technologist jobs UAE", blurb: "CT scan roles in hospitals and outpatient imaging.", salaryRefAed: { min: 8000, max: 17000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "sonographer", role: "imaging", name: "Sonographer", plural: "Sonographers", searchIntent: "sonographer jobs UAE", blurb: "Ultrasound technologist roles across hospitals, OB/GYN clinics and cardiology imaging.", salaryRefAed: { min: 9000, max: 20000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "mammographer", role: "imaging", name: "Mammographer", plural: "Mammographers", searchIntent: "mammographer jobs UAE", blurb: "Breast-imaging technologist roles for breast-health and women-clinic networks.", salaryRefAed: { min: 8000, max: 17000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "medical-laboratory-scientist", role: "allied_health", name: "Medical Laboratory Scientist", plural: "Medical Laboratory Scientists", searchIntent: "medical laboratory scientist jobs UAE", blurb: "Lab scientist roles in clinical-pathology, microbiology and chemistry labs.", salaryRefAed: { min: 7000, max: 16000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "lab-technician", role: "allied_health", name: "Lab Technician", plural: "Lab Technicians", searchIntent: "lab technician jobs UAE", blurb: "Lab technician roles across hospitals, clinics and standalone diagnostic labs.", salaryRefAed: { min: 5500, max: 12000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "phlebotomist", role: "allied_health", name: "Phlebotomist", plural: "Phlebotomists", searchIntent: "phlebotomist jobs UAE", blurb: "Phlebotomy roles for diagnostic labs, hospitals and home-collection programmes.", salaryRefAed: { min: 4500, max: 9000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Pharmacy ────────────────────────────────────────────────────────────
  { slug: "pharmacist", role: "pharmacy", name: "Pharmacist", nameAr: "صيدلي", plural: "Pharmacists", searchIntent: "pharmacist jobs UAE", blurb: "Community, hospital and clinic pharmacist roles. DHA / DOH / MOHAP licensable.", salaryRefAed: { min: 8000, max: 18000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "pharmacy-technician", role: "pharmacy", name: "Pharmacy Technician", plural: "Pharmacy Technicians", searchIntent: "pharmacy technician jobs UAE", blurb: "Assistant-pharmacist and dispensing-technician roles in pharmacy chains.", salaryRefAed: { min: 4500, max: 9000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "clinical-pharmacist", role: "pharmacy", name: "Clinical Pharmacist", plural: "Clinical Pharmacists", searchIntent: "clinical pharmacist jobs UAE", blurb: "Inpatient and ward-rounds clinical pharmacy roles in tertiary hospitals.", salaryRefAed: { min: 12000, max: 24000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Dental ──────────────────────────────────────────────────────────────
  { slug: "dentist", role: "dental", name: "Dentist", nameAr: "طبيب أسنان", plural: "Dentists", searchIntent: "dentist jobs UAE", blurb: "GP-dentist roles across UAE dental groups. DHA, DOH and MOHAP licensable.", salaryRefAed: { min: 15000, max: 38000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "orthodontist", role: "dental", name: "Orthodontist", plural: "Orthodontists", searchIntent: "orthodontist jobs UAE", blurb: "Orthodontic specialist roles for dental groups with established Invisalign / brace programmes.", salaryRefAed: { min: 25000, max: 60000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "dental-hygienist", role: "dental", name: "Dental Hygienist", plural: "Dental Hygienists", searchIntent: "dental hygienist jobs UAE", blurb: "Hygienist roles in dental-group practices.", salaryRefAed: { min: 6000, max: 13000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "dental-assistant", role: "dental", name: "Dental Assistant", plural: "Dental Assistants", searchIntent: "dental assistant jobs UAE", blurb: "Chairside dental-assistant roles. Often DHA assistant-class licensable.", salaryRefAed: { min: 4000, max: 8000 }, licenseAuthority: "shared", dataflowExpected: false },

  // ── Support / front-office / billing ────────────────────────────────────
  { slug: "medical-receptionist", role: "support", name: "Medical Receptionist", plural: "Medical Receptionists", searchIntent: "medical receptionist jobs UAE", blurb: "Front-desk roles in clinics — patient check-in, scheduling, insurance triage.", salaryRefAed: { min: 3500, max: 7000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "patient-coordinator", role: "support", name: "Patient Coordinator", plural: "Patient Coordinators", searchIntent: "patient coordinator jobs UAE", blurb: "Patient-experience and care-navigator roles for clinic networks.", salaryRefAed: { min: 5000, max: 10000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "insurance-coordinator", role: "support", name: "Insurance Coordinator", plural: "Insurance Coordinators", searchIntent: "insurance coordinator jobs UAE", blurb: "Direct-billing, pre-authorisation and reimbursement-cycle roles for clinics with multi-insurer panels.", salaryRefAed: { min: 5000, max: 11000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "medical-coder", role: "support", name: "Medical Coder", plural: "Medical Coders", searchIntent: "medical coder jobs UAE", blurb: "ICD-10 / CPT coding roles for groups submitting to Daman, DHA Sehaty and ADEK panels. CPC / CCS preferred.", salaryRefAed: { min: 6000, max: 13000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "medical-biller", role: "support", name: "Medical Biller", plural: "Medical Billers", searchIntent: "medical biller jobs UAE", blurb: "Claim submission, denial-management and revenue-cycle roles for clinic groups.", salaryRefAed: { min: 5000, max: 11000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "medical-secretary", role: "support", name: "Medical Secretary", plural: "Medical Secretaries", searchIntent: "medical secretary jobs UAE", blurb: "Executive-support roles for consultants, surgical teams and hospital department heads.", salaryRefAed: { min: 4500, max: 9000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "or-technician", role: "support", name: "OR Technician", plural: "OR Technicians", searchIntent: "OR technician jobs UAE", blurb: "Operating-room scrub-tech and surgical-tech roles in hospitals and surgical centres.", salaryRefAed: { min: 5500, max: 11000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "anaesthesia-technician", role: "support", name: "Anaesthesia Technician", plural: "Anaesthesia Technicians", searchIntent: "anaesthesia technician jobs UAE", blurb: "Anaesthesia-tech roles supporting hospital ORs.", salaryRefAed: { min: 6000, max: 12000 }, licenseAuthority: "shared", dataflowExpected: true },
  { slug: "caregiver", role: "support", name: "Caregiver / Home Health Aide", plural: "Caregivers", searchIntent: "caregiver jobs UAE", blurb: "Home-care assistant roles for elderly and post-acute clients.", salaryRefAed: { min: 3500, max: 7000 }, licenseAuthority: undefined, dataflowExpected: false },

  // ── Management ──────────────────────────────────────────────────────────
  { slug: "clinic-manager", role: "management", name: "Clinic Manager", plural: "Clinic Managers", searchIntent: "clinic manager jobs UAE", blurb: "Operations-manager and centre-head roles for outpatient clinics and small clinic groups.", salaryRefAed: { min: 12000, max: 25000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "practice-manager", role: "management", name: "Practice Manager", plural: "Practice Managers", searchIntent: "practice manager jobs UAE", blurb: "Single-clinic practice-manager roles — staffing, P&L, regulator compliance.", salaryRefAed: { min: 10000, max: 22000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "compliance-officer", role: "management", name: "Compliance Officer", plural: "Compliance Officers", searchIntent: "healthcare compliance officer jobs UAE", blurb: "DHA / DOH / MOHAP licensing and audit-readiness roles for clinic groups, hospitals and labs.", salaryRefAed: { min: 12000, max: 25000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "quality-officer", role: "management", name: "Quality Officer", plural: "Quality Officers", searchIntent: "healthcare quality officer jobs UAE", blurb: "JCI / ISO / DHA-quality programme roles for hospitals and large clinic groups.", salaryRefAed: { min: 12000, max: 25000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "medical-director", role: "management", name: "Medical Director", plural: "Medical Directors", searchIntent: "medical director jobs UAE", blurb: "Clinical-leadership roles — medical director, head of department, department chair.", salaryRefAed: { min: 60000, max: 150000 }, licenseAuthority: "shared", dataflowExpected: true },

  // ── Sales / commercial ──────────────────────────────────────────────────
  { slug: "medical-sales-rep", role: "sales", name: "Medical Sales Rep", plural: "Medical Sales Reps", searchIntent: "medical sales jobs UAE", blurb: "Pharma-rep, medical-device and capital-equipment sales roles across hospital and clinic accounts.", salaryRefAed: { min: 8000, max: 22000 }, licenseAuthority: undefined, dataflowExpected: false },
  { slug: "medical-equipment-specialist", role: "sales", name: "Medical Equipment Specialist", plural: "Medical Equipment Specialists", searchIntent: "medical equipment jobs UAE", blurb: "Capital-equipment, biomedical and product-application specialist roles.", salaryRefAed: { min: 9000, max: 20000 }, licenseAuthority: undefined, dataflowExpected: false },
];

export const DISCIPLINE_BY_SLUG: Record<string, Discipline> = Object.fromEntries(
  DISCIPLINES.map((d) => [d.slug, d])
);

export function getDiscipline(slug: string | null | undefined): Discipline | undefined {
  if (!slug) return undefined;
  return DISCIPLINE_BY_SLUG[slug];
}

export function disciplinesByRole(role: Role): Discipline[] {
  return DISCIPLINES.filter((d) => d.role === role);
}

export const ROLE_LABELS: Record<Role, string> = {
  physician: "Physicians & surgeons",
  nurse: "Nurses & midwives",
  allied_health: "Allied health & therapy",
  dental: "Dental",
  imaging: "Imaging & diagnostics",
  pharmacy: "Pharmacy",
  support: "Front office, billing & technical",
  management: "Management & leadership",
  sales: "Medical sales",
  other: "Other healthcare roles",
};

export const ROLE_ORDER: Role[] = [
  "physician",
  "nurse",
  "allied_health",
  "dental",
  "imaging",
  "pharmacy",
  "support",
  "management",
  "sales",
  "other",
];
