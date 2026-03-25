/**
 * Care Journey / Condition Cost Bundles
 *
 * Each journey bundles multiple procedures from PROCEDURES into a total
 * estimated cost for treating a condition or completing a medical journey.
 * Used to answer "How much does it cost to treat [condition] in [city]?"
 */

import { getProcedureBySlug } from "./procedures";
import { CITIES } from "./cities";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CareJourneyStep {
  procedureSlug: string;
  quantity: number;
  isOptional: boolean;
  note?: string;
}

export interface CareJourney {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  whatToExpect: string;
  totalDuration: string;
  steps: CareJourneyStep[];
  searchTerms: string[];
  sortOrder: number;
}

// ─── Journey Data ───────────────────────────────────────────────────────────────

export const CARE_JOURNEYS: CareJourney[] = [
  {
    slug: "pregnancy-and-delivery",
    name: "Pregnancy & Delivery",
    nameAr: "الحمل والولادة",
    description: "Full cost of pregnancy care in the UAE — from the first GP visit through prenatal monitoring, blood work, specialist consultations, and delivery. Covers both normal vaginal delivery and C-section options.",
    whatToExpect: "Your pregnancy journey typically begins with a GP consultation to confirm pregnancy, followed by regular ultrasound scans (one per trimester plus a 20-week anatomy scan), blood tests for screening, and specialist OB-GYN consultations. Delivery takes place at a hospital — either vaginal or via C-section depending on clinical need. Most patients complete 8–12 visits over the 9-month period.",
    totalDuration: "9 months",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 4, isOptional: false, note: "initial + follow-ups" },
      { procedureSlug: "ultrasound", quantity: 4, isOptional: false, note: "one per trimester + anatomy scan" },
      { procedureSlug: "blood-test", quantity: 3, isOptional: false, note: "first trimester, glucose, third trimester" },
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "OB-GYN consultations" },
      { procedureSlug: "normal-delivery", quantity: 1, isOptional: false },
      { procedureSlug: "c-section", quantity: 1, isOptional: true, note: "if medically required" },
    ],
    searchTerms: ["pregnancy cost UAE", "delivery cost Dubai", "how much does it cost to have a baby in UAE", "childbirth cost Dubai", "prenatal care cost", "maternity package Dubai", "C-section cost UAE"],
    sortOrder: 1,
  },
  {
    slug: "dental-makeover",
    name: "Complete Dental Makeover",
    nameAr: "تجميل الأسنان الكامل",
    description: "Total cost of a full dental makeover in the UAE — professional cleaning, whitening, and porcelain veneers for a complete smile transformation. One of the most popular cosmetic dental packages in Dubai.",
    whatToExpect: "A complete dental makeover starts with a professional cleaning to remove plaque and tartar, followed by teeth whitening to brighten your base shade. The main transformation comes from porcelain veneers — thin shells bonded to the front of your teeth. Expect 2–3 visits over 2–4 weeks. Veneers require preparation (light enamel removal), impressions, and fitting.",
    totalDuration: "2–4 weeks",
    steps: [
      { procedureSlug: "dental-cleaning", quantity: 1, isOptional: false },
      { procedureSlug: "teeth-whitening", quantity: 1, isOptional: false },
      { procedureSlug: "dental-veneer", quantity: 6, isOptional: false, note: "6 upper front teeth" },
    ],
    searchTerms: ["dental makeover cost Dubai", "smile makeover UAE", "veneers cost Dubai", "full mouth veneers price", "teeth transformation cost", "cosmetic dentistry Dubai price"],
    sortOrder: 2,
  },
  {
    slug: "knee-injury-treatment",
    name: "Knee Injury Treatment",
    nameAr: "علاج إصابة الركبة",
    description: "Full cost of diagnosing and treating a knee injury in the UAE — from the initial specialist consultation and MRI diagnosis through a complete physiotherapy rehabilitation course, with optional ACL reconstruction surgery.",
    whatToExpect: "Treatment begins with a specialist orthopedic consultation and MRI to assess the injury. For ligament sprains and minor tears, a course of 12 physiotherapy sessions over 6–12 weeks is the standard treatment. If an ACL tear is confirmed, arthroscopic reconstruction surgery may be recommended, followed by 4–6 months of rehabilitation.",
    totalDuration: "3–6 months",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 1, isOptional: false, note: "orthopedic assessment" },
      { procedureSlug: "mri-scan", quantity: 1, isOptional: false, note: "knee MRI" },
      { procedureSlug: "physiotherapy-session", quantity: 12, isOptional: false, note: "rehabilitation course" },
      { procedureSlug: "acl-reconstruction", quantity: 1, isOptional: true, note: "if ACL tear confirmed" },
    ],
    searchTerms: ["knee injury cost UAE", "ACL treatment cost Dubai", "knee MRI and physiotherapy price", "knee rehabilitation cost", "torn ligament treatment UAE", "sports injury cost Dubai"],
    sortOrder: 3,
  },
  {
    slug: "heart-checkup",
    name: "Comprehensive Heart Checkup",
    nameAr: "فحص القلب الشامل",
    description: "Total cost of a thorough cardiac health assessment in the UAE — includes GP screening, ECG, echocardiogram, blood work, and specialist cardiologist review. Recommended for adults over 40 or those with risk factors.",
    whatToExpect: "A comprehensive heart checkup starts with a GP consultation to assess risk factors and order tests. An ECG measures electrical activity, while an echocardiogram provides ultrasound images of the heart. Blood tests check cholesterol, blood sugar, and cardiac biomarkers. A cardiologist reviews all results and provides a risk assessment. The full workup can be completed in 1–2 visits.",
    totalDuration: "1–2 days",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 1, isOptional: false, note: "initial screening" },
      { procedureSlug: "ecg", quantity: 1, isOptional: false },
      { procedureSlug: "echocardiogram", quantity: 1, isOptional: false },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "lipid panel + cardiac markers" },
      { procedureSlug: "specialist-consultation", quantity: 1, isOptional: false, note: "cardiologist review" },
    ],
    searchTerms: ["heart checkup cost UAE", "cardiac screening Dubai", "heart test price", "echocardiogram cost UAE", "full heart assessment price", "cardiology checkup Dubai"],
    sortOrder: 4,
  },
  {
    slug: "back-pain-treatment",
    name: "Back Pain Treatment",
    nameAr: "علاج آلام الظهر",
    description: "Full cost of diagnosing and treating chronic back pain in the UAE — from initial GP visit and imaging through specialist consultation and a complete physiotherapy rehabilitation programme.",
    whatToExpect: "Back pain treatment begins with a GP consultation and X-ray to rule out fractures or structural issues. An MRI may follow to assess disc herniation or soft tissue damage. A specialist (orthopedic or spine surgeon) reviews imaging and recommends a treatment plan. Most patients undergo 10 physiotherapy sessions over 5–10 weeks for pain relief and functional recovery.",
    totalDuration: "2–3 months",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 1, isOptional: false },
      { procedureSlug: "x-ray", quantity: 1, isOptional: false, note: "spinal X-ray" },
      { procedureSlug: "mri-scan", quantity: 1, isOptional: false, note: "lumbar spine MRI" },
      { procedureSlug: "specialist-consultation", quantity: 1, isOptional: false, note: "orthopedic or spine specialist" },
      { procedureSlug: "physiotherapy-session", quantity: 10, isOptional: false, note: "rehabilitation course" },
    ],
    searchTerms: ["back pain treatment cost UAE", "slipped disc treatment Dubai", "spine MRI cost", "physiotherapy for back pain price", "chronic back pain treatment cost", "herniated disc treatment UAE"],
    sortOrder: 5,
  },
  {
    slug: "vision-correction",
    name: "Vision Correction (LASIK)",
    nameAr: "تصحيح النظر بالليزك",
    description: "Total cost of LASIK vision correction in the UAE — includes pre-operative specialist assessments and the LASIK procedure for both eyes. One of the most popular elective procedures in Dubai and Abu Dhabi.",
    whatToExpect: "Vision correction starts with two specialist ophthalmologist consultations — one for initial assessment and corneal mapping, and a second pre-operative check. The LASIK procedure itself takes about 15 minutes for both eyes using a femtosecond laser. Most patients see improved vision within 24 hours, with full stabilisation over 1–3 months. Follow-up visits are included in most clinic packages.",
    totalDuration: "1–3 months (including recovery)",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "pre-operative assessments" },
      { procedureSlug: "lasik", quantity: 1, isOptional: false, note: "both eyes" },
    ],
    searchTerms: ["LASIK cost UAE", "LASIK Dubai price", "laser eye surgery cost", "vision correction price UAE", "LASIK both eyes cost", "eye laser surgery Dubai"],
    sortOrder: 6,
  },
  {
    slug: "ivf-full-cycle",
    name: "Full IVF Cycle",
    nameAr: "دورة أطفال الأنابيب الكاملة",
    description: "Complete cost of one IVF (In Vitro Fertilisation) cycle in the UAE — from initial fertility consultations and hormone tests through ovarian stimulation monitoring, the IVF procedure, and pregnancy confirmation.",
    whatToExpect: "An IVF journey begins with 3 specialist consultations (fertility specialist) for assessment and treatment planning. Blood tests (4 rounds) monitor hormone levels throughout. Ultrasound scans (6 sessions) track follicle development during ovarian stimulation. The IVF procedure includes egg retrieval, fertilisation, and embryo transfer. A pregnancy test confirms the outcome 2 weeks after transfer. One full cycle takes 4–6 weeks of active treatment.",
    totalDuration: "2–3 months",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 3, isOptional: false, note: "fertility specialist" },
      { procedureSlug: "blood-test", quantity: 4, isOptional: false, note: "hormone monitoring" },
      { procedureSlug: "ultrasound", quantity: 6, isOptional: false, note: "follicle tracking" },
      { procedureSlug: "ivf", quantity: 1, isOptional: false, note: "egg retrieval + embryo transfer" },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "pregnancy confirmation (beta-hCG)" },
    ],
    searchTerms: ["IVF cost UAE", "IVF price Dubai", "fertility treatment cost", "in vitro fertilisation price UAE", "IVF cycle cost Abu Dhabi", "IVF package price Dubai"],
    sortOrder: 7,
  },
  {
    slug: "dental-implant-full",
    name: "Full Dental Implant",
    nameAr: "زراعة الأسنان الكاملة",
    description: "Total cost of a single dental implant in the UAE — from initial consultation and X-ray through tooth extraction, implant placement, and final crown fitting. The most durable tooth replacement option available.",
    whatToExpect: "A dental implant journey begins with a specialist consultation and X-ray (or CBCT scan) to assess bone density. If the damaged tooth is still present, extraction is performed first with 2–3 months of healing. The titanium implant is then surgically placed into the jawbone, followed by 3–6 months of osseointegration (bone fusion). Finally, a custom dental crown is fitted on top. Total timeline: 4–9 months.",
    totalDuration: "4–9 months",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 1, isOptional: false, note: "dental surgeon assessment" },
      { procedureSlug: "x-ray", quantity: 1, isOptional: false, note: "dental X-ray or CBCT" },
      { procedureSlug: "tooth-extraction", quantity: 1, isOptional: false, note: "if damaged tooth present" },
      { procedureSlug: "dental-implant", quantity: 1, isOptional: false },
      { procedureSlug: "dental-crown", quantity: 1, isOptional: false, note: "implant-supported crown" },
    ],
    searchTerms: ["dental implant cost UAE", "dental implant price Dubai", "tooth implant full cost", "dental implant and crown price", "single tooth implant cost UAE"],
    sortOrder: 8,
  },
  {
    slug: "weight-loss-surgery-prep",
    name: "Weight Loss Surgery Preparation",
    nameAr: "التحضير لجراحة إنقاص الوزن",
    description: "Total cost of the pre-surgical evaluation for bariatric (weight loss) surgery in the UAE — includes all required medical assessments, blood work, and specialist consultations before the procedure is approved.",
    whatToExpect: "Weight loss surgery preparation involves a thorough medical evaluation. It starts with a GP consultation and comprehensive blood tests. A full health checkup assesses overall fitness for surgery. Two specialist consultations (bariatric surgeon + endocrinologist/nutritionist) determine eligibility. An endoscopy examines the upper GI tract. This evaluation phase typically takes 2–4 weeks before surgery approval.",
    totalDuration: "2–4 weeks",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 1, isOptional: false },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "comprehensive metabolic panel" },
      { procedureSlug: "health-checkup", quantity: 1, isOptional: false },
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "bariatric surgeon + endocrinologist" },
      { procedureSlug: "endoscopy", quantity: 1, isOptional: false, note: "upper GI assessment" },
    ],
    searchTerms: ["bariatric surgery cost UAE", "weight loss surgery preparation cost", "gastric bypass pre-assessment price", "gastric sleeve consultation cost Dubai", "obesity surgery evaluation UAE"],
    sortOrder: 9,
  },
  {
    slug: "mental-health-treatment",
    name: "Mental Health Treatment",
    nameAr: "علاج الصحة النفسية",
    description: "Full cost of a standard mental health treatment programme in the UAE — from initial GP referral and psychiatric assessment through 12 sessions of psychological therapy (CBT, counselling, or psychotherapy).",
    whatToExpect: "Mental health treatment typically starts with a GP consultation for initial assessment and referral. A specialist psychiatrist evaluates the condition and may prescribe medication. The core of treatment is 12 weekly psychology sessions (CBT, counselling, or psychotherapy), usually over 3 months. Progress is reviewed regularly with adjustments as needed.",
    totalDuration: "3–4 months",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 1, isOptional: false, note: "initial assessment and referral" },
      { procedureSlug: "specialist-consultation", quantity: 1, isOptional: false, note: "psychiatrist evaluation" },
      { procedureSlug: "psychology-session", quantity: 12, isOptional: false, note: "weekly therapy sessions" },
    ],
    searchTerms: ["mental health treatment cost UAE", "therapy cost Dubai", "psychologist price UAE", "CBT therapy cost", "counselling price Dubai", "psychiatrist consultation cost UAE", "depression treatment cost"],
    sortOrder: 10,
  },
  {
    slug: "cosmetic-nose-job",
    name: "Rhinoplasty (Nose Job)",
    nameAr: "عملية تجميل الأنف",
    description: "Complete cost of rhinoplasty in the UAE — including pre-operative assessments, the surgical procedure, and post-operative follow-up consultations. One of the most sought-after cosmetic surgeries in the region.",
    whatToExpect: "A rhinoplasty journey begins with two specialist consultations — an initial assessment with computer imaging, and a pre-operative check with blood work. The surgery is performed under general anaesthesia and takes 1–3 hours. Recovery involves 1 week of splint wear and 2–4 weeks of swelling reduction. Three follow-up consultations over 3 months monitor healing and results.",
    totalDuration: "3–6 months (full recovery)",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "pre-operative assessments" },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "pre-operative blood work" },
      { procedureSlug: "rhinoplasty", quantity: 1, isOptional: false },
      { procedureSlug: "specialist-consultation", quantity: 3, isOptional: false, note: "post-operative follow-ups" },
    ],
    searchTerms: ["rhinoplasty cost UAE", "nose job price Dubai", "cosmetic nose surgery cost", "rhinoplasty full price", "nose reshaping cost Abu Dhabi", "nose job Dubai total cost"],
    sortOrder: 11,
  },
  {
    slug: "hair-restoration",
    name: "Hair Transplant",
    nameAr: "زراعة الشعر",
    description: "Full cost of a hair transplant in the UAE — including pre-operative specialist assessments, blood work, and the FUE/FUT transplant procedure. Dubai is a global hub for hair restoration surgery.",
    whatToExpect: "A hair transplant journey starts with two specialist consultations — an initial trichologist or dermatologist assessment to evaluate hair loss pattern and donor area, followed by a pre-operative planning session. Blood tests confirm fitness for surgery. The transplant procedure (FUE or FUT) takes 6–10 hours under local anaesthesia. Results become visible after 6–12 months as transplanted follicles grow.",
    totalDuration: "6–12 months (for full results)",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "assessment + pre-operative planning" },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "pre-operative blood work" },
      { procedureSlug: "hair-transplant", quantity: 1, isOptional: false },
    ],
    searchTerms: ["hair transplant cost UAE", "hair transplant price Dubai", "FUE hair transplant cost", "hair restoration price Abu Dhabi", "hair transplant full cost", "baldness treatment cost Dubai"],
    sortOrder: 12,
  },
  {
    slug: "cataract-treatment",
    name: "Cataract Surgery",
    nameAr: "جراحة الساد (المياه البيضاء)",
    description: "Total cost of cataract surgery in the UAE — including specialist consultations and phacoemulsification surgery for both eyes. The most common surgical procedure for adults over 60.",
    whatToExpect: "Cataract treatment starts with two specialist ophthalmologist consultations — one for diagnosis and lens measurements, and one pre-operative check. Surgery is performed one eye at a time, typically 1–4 weeks apart. Each procedure takes 15–30 minutes using phacoemulsification (ultrasound to break up the cloudy lens) and insertion of an artificial intraocular lens (IOL). Recovery per eye is 1–2 weeks.",
    totalDuration: "1–2 months",
    steps: [
      { procedureSlug: "specialist-consultation", quantity: 2, isOptional: false, note: "diagnosis + pre-operative check" },
      { procedureSlug: "cataract-surgery", quantity: 2, isOptional: false, note: "both eyes, done separately" },
    ],
    searchTerms: ["cataract surgery cost UAE", "cataract operation price Dubai", "cataract both eyes cost", "lens replacement surgery cost UAE", "phacoemulsification price", "cataract treatment cost Abu Dhabi"],
    sortOrder: 13,
  },
  {
    slug: "appendicitis-emergency",
    name: "Appendicitis Treatment",
    nameAr: "علاج التهاب الزائدة الدودية",
    description: "Total cost of emergency appendicitis treatment in the UAE — from emergency GP assessment and diagnostic tests through surgical removal (appendectomy). A common surgical emergency.",
    whatToExpect: "Appendicitis treatment is typically an emergency. It starts with an urgent GP or ER assessment, blood tests to check white blood cell count and inflammation markers, and a CT scan to confirm the diagnosis. Once confirmed, a laparoscopic appendectomy is performed under general anaesthesia, usually within hours. Hospital stay is typically 1–2 days. Full recovery takes 1–3 weeks.",
    totalDuration: "1–3 weeks (including recovery)",
    steps: [
      { procedureSlug: "gp-consultation", quantity: 1, isOptional: false, note: "emergency assessment" },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "WBC + inflammation markers" },
      { procedureSlug: "ct-scan", quantity: 1, isOptional: false, note: "abdominal CT" },
      { procedureSlug: "appendectomy", quantity: 1, isOptional: false },
    ],
    searchTerms: ["appendicitis cost UAE", "appendectomy price Dubai", "appendix removal cost", "emergency surgery cost UAE", "appendicitis treatment total cost", "laparoscopic appendectomy price"],
    sortOrder: 14,
  },
  {
    slug: "annual-wellness",
    name: "Annual Health Checkup",
    nameAr: "الفحص الطبي السنوي",
    description: "Total cost of a comprehensive annual wellness checkup in the UAE — includes general health screening, blood work, vitamin D and thyroid tests, heart screening (ECG), and mammogram for women. Recommended yearly for adults over 30.",
    whatToExpect: "An annual health checkup is typically completed in one visit (2–3 hours) at a clinic or hospital. It includes a general health checkup with vital signs, followed by blood tests for CBC, liver, kidney, and metabolic function. Vitamin D and thyroid tests address two of the most common deficiencies in the UAE. An ECG screens for heart rhythm issues. Women over 40 are recommended a mammogram. Results are usually available within 24–48 hours.",
    totalDuration: "1 day (results in 24–48 hours)",
    steps: [
      { procedureSlug: "health-checkup", quantity: 1, isOptional: false },
      { procedureSlug: "blood-test", quantity: 1, isOptional: false, note: "CBC, liver, kidney, metabolic panel" },
      { procedureSlug: "vitamin-d-test", quantity: 1, isOptional: false },
      { procedureSlug: "thyroid-test", quantity: 1, isOptional: false },
      { procedureSlug: "ecg", quantity: 1, isOptional: false },
      { procedureSlug: "mammogram", quantity: 1, isOptional: true, note: "recommended for women over 40" },
    ],
    searchTerms: ["annual checkup cost UAE", "health screening price Dubai", "full body checkup cost", "wellness checkup price UAE", "preventive health screening cost", "annual medical exam cost Dubai"],
    sortOrder: 15,
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

export function getJourneyBySlug(slug: string): CareJourney | undefined {
  return CARE_JOURNEYS.find((j) => j.slug === slug);
}

export function getAllJourneySlugs(): string[] {
  return CARE_JOURNEYS.map((j) => j.slug);
}

/**
 * Calculate total journey cost for a specific city (or UAE-wide).
 * Returns separate totals for required and optional steps.
 */
export function calculateJourneyCost(
  journey: CareJourney,
  citySlug?: string
): {
  requiredMin: number;
  requiredMax: number;
  requiredTypical: number;
  optionalMin: number;
  optionalMax: number;
  optionalTypical: number;
  totalMin: number;
  totalMax: number;
  totalTypical: number;
  steps: {
    procedureSlug: string;
    procedureName: string;
    quantity: number;
    isOptional: boolean;
    note?: string;
    unitMin: number;
    unitMax: number;
    unitTypical: number;
    subtotalMin: number;
    subtotalMax: number;
    subtotalTypical: number;
  }[];
} {
  let requiredMin = 0;
  let requiredMax = 0;
  let requiredTypical = 0;
  let optionalMin = 0;
  let optionalMax = 0;
  let optionalTypical = 0;

  const steps = journey.steps.map((step) => {
    const proc = getProcedureBySlug(step.procedureSlug);
    if (!proc) {
      return {
        procedureSlug: step.procedureSlug,
        procedureName: step.procedureSlug,
        quantity: step.quantity,
        isOptional: step.isOptional,
        note: step.note,
        unitMin: 0,
        unitMax: 0,
        unitTypical: 0,
        subtotalMin: 0,
        subtotalMax: 0,
        subtotalTypical: 0,
      };
    }

    let unitMin: number;
    let unitMax: number;
    let unitTypical: number;

    if (citySlug && proc.cityPricing[citySlug]) {
      const cp = proc.cityPricing[citySlug];
      unitMin = cp.min;
      unitMax = cp.max;
      unitTypical = cp.typical;
    } else {
      unitMin = proc.priceRange.min;
      unitMax = proc.priceRange.max;
      // UAE-wide typical = average of all city typicals
      const cityValues = Object.values(proc.cityPricing);
      unitTypical = cityValues.length > 0
        ? Math.round(cityValues.reduce((s, c) => s + c.typical, 0) / cityValues.length)
        : Math.round((proc.priceRange.min + proc.priceRange.max) / 2);
    }

    const subtotalMin = unitMin * step.quantity;
    const subtotalMax = unitMax * step.quantity;
    const subtotalTypical = unitTypical * step.quantity;

    if (step.isOptional) {
      optionalMin += subtotalMin;
      optionalMax += subtotalMax;
      optionalTypical += subtotalTypical;
    } else {
      requiredMin += subtotalMin;
      requiredMax += subtotalMax;
      requiredTypical += subtotalTypical;
    }

    return {
      procedureSlug: step.procedureSlug,
      procedureName: proc.name,
      quantity: step.quantity,
      isOptional: step.isOptional,
      note: step.note,
      unitMin,
      unitMax,
      unitTypical,
      subtotalMin,
      subtotalMax,
      subtotalTypical,
    };
  });

  return {
    requiredMin,
    requiredMax,
    requiredTypical,
    optionalMin,
    optionalMax,
    optionalTypical,
    totalMin: requiredMin + optionalMin,
    totalMax: requiredMax + optionalMax,
    totalTypical: requiredTypical + optionalTypical,
    steps,
  };
}

/**
 * Get journey cost for every city, sorted cheapest first.
 */
export function getJourneyCityComparison(journey: CareJourney) {
  return CITIES.map((city) => {
    const cost = calculateJourneyCost(journey, city.slug);
    return {
      citySlug: city.slug,
      cityName: city.name,
      requiredTypical: cost.requiredTypical,
      requiredMin: cost.requiredMin,
      requiredMax: cost.requiredMax,
    };
  }).sort((a, b) => a.requiredTypical - b.requiredTypical);
}
