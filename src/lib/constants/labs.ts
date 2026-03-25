/**
 * UAE Lab Test & Diagnostic Price Comparison data.
 *
 * Pricing is based on publicly available data from lab websites, aggregator
 * platforms (LabTestsDubai, ServiceMarket, DarDoc), and walk-in price lists
 * (2024-2025). Actual prices may vary by location, insurance, and promotions.
 * Users should confirm pricing directly with the lab before booking.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface LabProfile {
  slug: string;
  name: string;
  type: "chain" | "hospital" | "home-service" | "boutique";
  foundedYear: number;
  headquarters: string;
  /** Regulators the lab is licensed under */
  regulators: ("dha" | "doh" | "mohap")[];
  /** Cities with branches */
  cities: string[];
  branchCount: number;
  website: string;
  phone: string;
  /** Accreditations */
  accreditations: string[];
  /** Home collection available */
  homeCollection: boolean;
  /** Home collection fee in AED (0 = free) */
  homeCollectionFee: number;
  /** Typical turnaround time for routine tests */
  turnaroundHours: number;
  /** Operating hours */
  operatingHours: string;
  /** Key differentiators */
  highlights: string[];
  /** Brief description */
  description: string;
}

export type TestCategory =
  | "blood-routine"
  | "vitamins-minerals"
  | "hormones"
  | "diabetes"
  | "liver"
  | "kidney"
  | "cardiac"
  | "thyroid"
  | "allergy"
  | "fertility"
  | "cancer-screening"
  | "std-screening"
  | "imaging"
  | "urine-stool";

export interface LabTest {
  slug: string;
  name: string;
  shortName: string;
  category: TestCategory;
  /** What the test measures / why it's ordered */
  description: string;
  /** Fasting required */
  fastingRequired: boolean;
  /** Sample type */
  sampleType: "blood" | "urine" | "stool" | "swab" | "imaging" | "other";
  /** Typical turnaround in hours */
  turnaroundHours: number;
  /** Common reasons to order */
  commonReasons: string[];
}

export interface LabTestPrice {
  labSlug: string;
  testSlug: string;
  /** Price in AED */
  price: number;
  /** Discounted price if currently on offer */
  discountedPrice?: number;
  /** Notes (e.g. "part of package only") */
  notes?: string;
}

export interface HealthPackage {
  id: string;
  labSlug: string;
  name: string;
  /** Target audience */
  targetAudience: string;
  /** Price in AED */
  price: number;
  /** Discounted price if on offer */
  discountedPrice?: number;
  /** Tests included (by slug) */
  testSlugs: string[];
  /** Number of biomarkers / parameters */
  biomarkerCount: number;
  /** Key inclusions as display strings */
  includes: string[];
  /** Suitable for */
  suitableFor: ("male" | "female" | "all")[];
}

// ─── Test Categories ────────────────────────────────────────────────────────────

export const TEST_CATEGORIES: { slug: TestCategory; name: string; icon: string }[] = [
  { slug: "blood-routine", name: "Blood Tests", icon: "Droplets" },
  { slug: "vitamins-minerals", name: "Vitamins & Minerals", icon: "Sun" },
  { slug: "hormones", name: "Hormones", icon: "Activity" },
  { slug: "diabetes", name: "Diabetes", icon: "Gauge" },
  { slug: "liver", name: "Liver Function", icon: "Scan" },
  { slug: "kidney", name: "Kidney Function", icon: "Filter" },
  { slug: "cardiac", name: "Heart & Cardiac", icon: "Heart" },
  { slug: "thyroid", name: "Thyroid", icon: "Zap" },
  { slug: "allergy", name: "Allergy & Intolerance", icon: "AlertTriangle" },
  { slug: "fertility", name: "Fertility", icon: "Baby" },
  { slug: "cancer-screening", name: "Cancer Screening", icon: "Search" },
  { slug: "std-screening", name: "STD Screening", icon: "ShieldAlert" },
  { slug: "imaging", name: "Imaging & Radiology", icon: "ScanLine" },
  { slug: "urine-stool", name: "Urine & Stool", icon: "TestTubes" },
];

// ─── Lab Profiles ───────────────────────────────────────────────────────────────

export const LAB_PROFILES: LabProfile[] = [
  {
    slug: "al-borg-diagnostics",
    name: "Al Borg Diagnostics",
    type: "chain",
    foundedYear: 1999,
    headquarters: "Riyadh, KSA",
    regulators: ["dha", "doh", "mohap"],
    cities: ["dubai", "abu-dhabi", "sharjah", "al-ain", "ras-al-khaimah"],
    branchCount: 17,
    website: "https://alborgdx.com/uae",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["CAP", "JCI", "ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 50,
    turnaroundHours: 24,
    operatingHours: "Sat-Thu 7:00 AM - 10:00 PM, Fri 2:00 PM - 10:00 PM",
    highlights: [
      "Largest private lab chain in GCC",
      "Exclusive Quest Diagnostics partner",
      "2,000+ tests available",
      "15,000+ daily walk-in clients across GCC",
    ],
    description:
      "Al Borg Diagnostics is the largest private laboratory network in the GCC with 67 labs across MENA. The exclusive partner of Quest Diagnostics USA, Al Borg offers over 2,000 clinical tests with CAP and JCI accreditation across 17 UAE branches.",
  },
  {
    slug: "thumbay-labs",
    name: "Thumbay Labs",
    type: "chain",
    foundedYear: 2008,
    headquarters: "Ajman, UAE",
    regulators: ["dha", "mohap"],
    cities: ["dubai", "ajman", "sharjah", "fujairah"],
    branchCount: 8,
    website: "https://thumbaylabs.com",
    phone: "+971-6-XXX-XXXX",
    accreditations: ["CAP", "ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 24,
    operatingHours: "Sat-Thu 7:30 AM - 9:00 PM, Fri 9:00 AM - 6:00 PM",
    highlights: [
      "Part of Thumbay Group (Gulf Medical University)",
      "Free home collection",
      "CAP-accredited since 2015",
      "Strong presence in Northern Emirates",
    ],
    description:
      "Thumbay Labs is one of the largest private clinical laboratory chains in the UAE, part of the Thumbay Group which also operates Gulf Medical University. CAP-accredited with branches across Dubai, Ajman, Sharjah, and Fujairah.",
  },
  {
    slug: "national-reference-laboratory",
    name: "National Reference Laboratory (NRL)",
    type: "chain",
    foundedYear: 2010,
    headquarters: "Abu Dhabi, UAE",
    regulators: ["doh"],
    cities: ["abu-dhabi", "al-ain"],
    branchCount: 12,
    website: "https://nrl.ae",
    phone: "+971-2-XXX-XXXX",
    accreditations: ["CAP", "ISO 15189", "ISO 17025"],
    homeCollection: true,
    homeCollectionFee: 75,
    turnaroundHours: 24,
    operatingHours: "Sun-Thu 7:00 AM - 8:00 PM, Sat 8:00 AM - 4:00 PM",
    highlights: [
      "Part of M42/Mubadala Health network",
      "250+ B2B healthcare clients",
      "Reference laboratory for complex cases",
      "Advanced molecular diagnostics",
    ],
    description:
      "National Reference Laboratory (NRL) is Abu Dhabi's leading clinical reference laboratory, part of the M42/Mubadala Health ecosystem. Serving 250+ healthcare clients, NRL specializes in complex diagnostic testing including molecular diagnostics, genetic testing, and toxicology.",
  },
  {
    slug: "purelab",
    name: "PureLab",
    type: "chain",
    foundedYear: 2023,
    headquarters: "Abu Dhabi, UAE",
    regulators: ["doh"],
    cities: ["abu-dhabi"],
    branchCount: 1,
    website: "https://purehealth.ae",
    phone: "+971-2-XXX-XXXX",
    accreditations: ["CAP", "ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 12,
    operatingHours: "24/7",
    highlights: [
      "UAE's largest AI-powered standalone lab",
      "70,000 sq ft, 7-storey facility",
      "30M+ samples/year capacity",
      "Part of PureHealth group",
    ],
    description:
      "PureLab is the UAE's largest and most advanced AI-powered standalone diagnostic laboratory. A subsidiary of PureHealth (the Middle East's largest healthcare group), the 70,000 sq ft Abu Dhabi facility can process over 30 million samples annually with AI-assisted diagnostics.",
  },
  {
    slug: "unilabs",
    name: "Unilabs",
    type: "chain",
    foundedYear: 1987,
    headquarters: "Geneva, Switzerland",
    regulators: ["dha"],
    cities: ["dubai"],
    branchCount: 3,
    website: "https://unilabs.ae",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["CAP", "ISO 15189", "UKAS"],
    homeCollection: true,
    homeCollectionFee: 100,
    turnaroundHours: 24,
    operatingHours: "Sat-Thu 7:00 AM - 9:00 PM",
    highlights: [
      "European diagnostic leader (16 countries)",
      "Advanced pathology & imaging",
      "DHCC-based flagship",
      "Specialised cancer diagnostics",
    ],
    description:
      "Unilabs is a leading European diagnostics company operating across 16 countries. Their UAE presence, based in Dubai Healthcare City, offers clinical laboratory services, advanced pathology, and imaging with a focus on quality and specialised cancer diagnostics.",
  },
  {
    slug: "menalabs",
    name: "MenaLabs (Cerba HealthCare)",
    type: "chain",
    foundedYear: 2012,
    headquarters: "Dubai, UAE",
    regulators: ["dha", "doh"],
    cities: ["dubai", "abu-dhabi"],
    branchCount: 4,
    website: "https://menalabs.ae",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["CAP", "ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 50,
    turnaroundHours: 24,
    operatingHours: "Sat-Thu 7:30 AM - 8:00 PM, Fri 9:00 AM - 5:00 PM",
    highlights: [
      "Part of French Cerba HealthCare group",
      "Hub-and-spoke central lab model",
      "B2B and B2C testing",
      "Occupational health testing",
    ],
    description:
      "MenaLabs, part of French diagnostic giant Cerba HealthCare, operates a hub-and-spoke laboratory model with central labs in Abu Dhabi and Dubai. Specialising in both clinical and occupational health testing for B2B and direct-to-consumer clients.",
  },
  {
    slug: "medsol-diagnostics",
    name: "Medsol Diagnostics",
    type: "chain",
    foundedYear: 2010,
    headquarters: "Dubai, UAE",
    regulators: ["dha", "mohap"],
    cities: ["dubai", "sharjah", "abu-dhabi"],
    branchCount: 5,
    website: "https://medsoldiagnostics.com",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 18,
    operatingHours: "Sat-Thu 7:00 AM - 10:00 PM, Fri 2:00 PM - 10:00 PM",
    highlights: [
      "Affordable pricing focus",
      "Free home collection",
      "Walk-in friendly",
      "Same-day results for routine tests",
    ],
    description:
      "Medsol Diagnostics (Vittals Medicare) offers affordable clinical laboratory services across Dubai, Sharjah, and Abu Dhabi. Known for competitive pricing, free home collection, and fast turnaround times for routine blood work.",
  },
  {
    slug: "metropolis-star",
    name: "STAR Metropolis Clinical Laboratories",
    type: "chain",
    foundedYear: 2013,
    headquarters: "Dubai, UAE",
    regulators: ["dha"],
    cities: ["dubai"],
    branchCount: 3,
    website: "https://starmetropolisme.com",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["CAP", "NABL", "ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 50,
    turnaroundHours: 24,
    operatingHours: "Sat-Thu 7:00 AM - 9:00 PM",
    highlights: [
      "Indian Metropolis Healthcare's Middle East arm",
      "4,000+ tests available",
      "Strong in specialised pathology",
      "Genetic testing capabilities",
    ],
    description:
      "STAR Metropolis Clinical Laboratories is the Middle East arm of India's Metropolis Healthcare, one of the largest pathology chains globally. Offering 4,000+ clinical and specialised tests with CAP accreditation from their Dubai facilities.",
  },
  {
    slug: "alpha-medical-lab",
    name: "Alpha Medical Laboratory",
    type: "boutique",
    foundedYear: 2005,
    headquarters: "Dubai, UAE",
    regulators: ["dha"],
    cities: ["dubai"],
    branchCount: 2,
    website: "https://alphamedilab.ae",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["ISO 15189"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 18,
    operatingHours: "Sat-Thu 7:30 AM - 9:30 PM, Fri 9:00 AM - 5:00 PM",
    highlights: [
      "Walk-in friendly, no appointment needed",
      "Free home collection in Dubai",
      "Competitive walk-in pricing",
      "Fast routine results",
    ],
    description:
      "Alpha Medical Laboratory is a Dubai-based standalone diagnostic lab specialising in clinical pathology. Popular with walk-in patients for affordable blood work with free home collection across Dubai.",
  },
  {
    slug: "dardoc",
    name: "DarDoc",
    type: "home-service",
    foundedYear: 2020,
    headquarters: "Dubai, UAE",
    regulators: ["dha", "doh"],
    cities: ["dubai", "abu-dhabi"],
    branchCount: 0,
    website: "https://dardoc.com",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["DHA Licensed"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 24,
    operatingHours: "Daily 7:00 AM - 11:00 PM",
    highlights: [
      "100% home-based testing",
      "App-based booking",
      "DHA-certified nurses",
      "200+ lab tests available",
    ],
    description:
      "DarDoc is a health-tech platform offering at-home lab testing via DHA-certified nurses. With an app-based booking system covering Dubai and Abu Dhabi, DarDoc brings the lab to your door with results delivered digitally within 24 hours.",
  },
  {
    slug: "healthchecks360",
    name: "Healthchecks360",
    type: "home-service",
    foundedYear: 2013,
    headquarters: "Dubai, UAE",
    regulators: ["dha", "mohap"],
    cities: ["dubai", "sharjah", "ajman"],
    branchCount: 0,
    website: "https://healthchecks360.com",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["DHA Licensed"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 24,
    operatingHours: "Daily 7:00 AM - 10:00 PM",
    highlights: [
      "4,000+ tests available",
      "Founded 2013 — earliest UAE lab aggregator",
      "Partners with DHA/MOH-licensed labs",
      "Free home collection",
    ],
    description:
      "Healthchecks360 is a UAE health-tech marketplace founded in 2013, partnering with DHA and MOH-licensed diagnostic providers. Offering 4,000+ tests with free home sample collection and digital results across Dubai and the Northern Emirates.",
  },
  {
    slug: "servicemarket",
    name: "ServiceMarket Lab Tests",
    type: "home-service",
    foundedYear: 2014,
    headquarters: "Dubai, UAE",
    regulators: ["dha", "doh", "mohap"],
    cities: ["dubai", "abu-dhabi", "sharjah"],
    branchCount: 0,
    website: "https://servicemarket.com",
    phone: "+971-4-XXX-XXXX",
    accreditations: ["Partner labs are DHA/DOH licensed"],
    homeCollection: true,
    homeCollectionFee: 0,
    turnaroundHours: 24,
    operatingHours: "Daily 8:00 AM - 8:00 PM",
    highlights: [
      "Marketplace model — multiple lab partners",
      "Starting from AED 99",
      "Price comparison across partner labs",
      "Covers Dubai, Abu Dhabi, Sharjah",
    ],
    description:
      "ServiceMarket is a home services marketplace that connects patients with DHA/DOH-licensed diagnostic labs for at-home blood testing. Compare prices across partner labs and book home collection starting from AED 99.",
  },
];

// ─── Lab Tests ──────────────────────────────────────────────────────────────────

export const LAB_TESTS: LabTest[] = [
  // Blood Routine
  {
    slug: "cbc",
    name: "Complete Blood Count (CBC)",
    shortName: "CBC",
    category: "blood-routine",
    description:
      "Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets. The most commonly ordered blood test worldwide.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Routine check-up", "Fatigue", "Infection screening", "Anemia detection"],
  },
  {
    slug: "lipid-profile",
    name: "Lipid Profile (Cholesterol Panel)",
    shortName: "Lipid Panel",
    category: "blood-routine",
    description:
      "Measures total cholesterol, LDL, HDL, triglycerides, and VLDL. Essential for cardiovascular risk assessment.",
    fastingRequired: true,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Heart disease risk", "Annual check-up", "Statin monitoring", "Family history of high cholesterol"],
  },
  {
    slug: "esr",
    name: "Erythrocyte Sedimentation Rate (ESR)",
    shortName: "ESR",
    category: "blood-routine",
    description:
      "Measures how quickly red blood cells settle in a test tube, indicating inflammation in the body.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 4,
    commonReasons: ["Inflammation detection", "Autoimmune monitoring", "Infection tracking"],
  },
  {
    slug: "iron-studies",
    name: "Iron Studies (Serum Iron, TIBC, Ferritin)",
    shortName: "Iron Panel",
    category: "blood-routine",
    description:
      "Measures serum iron, total iron-binding capacity (TIBC), and ferritin to evaluate iron deficiency or overload.",
    fastingRequired: true,
    sampleType: "blood",
    turnaroundHours: 12,
    commonReasons: ["Fatigue", "Anemia investigation", "Heavy menstruation", "Hair loss"],
  },

  // Vitamins & Minerals
  {
    slug: "vitamin-d",
    name: "Vitamin D (25-Hydroxy)",
    shortName: "Vitamin D",
    category: "vitamins-minerals",
    description:
      "Measures 25-hydroxyvitamin D levels. Extremely common in the UAE due to widespread deficiency despite abundant sunlight (indoor lifestyle, clothing).",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Bone pain", "Fatigue", "Muscle weakness", "Routine screening in UAE"],
  },
  {
    slug: "vitamin-b12",
    name: "Vitamin B12 (Cobalamin)",
    shortName: "Vitamin B12",
    category: "vitamins-minerals",
    description:
      "Measures B12 levels essential for nerve function, red blood cell production, and DNA synthesis.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Fatigue", "Numbness/tingling", "Vegetarian/vegan diet", "Memory issues"],
  },
  {
    slug: "folate",
    name: "Folate (Folic Acid)",
    shortName: "Folate",
    category: "vitamins-minerals",
    description:
      "Measures folate levels important for cell division, DNA synthesis, and pregnancy.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Pre-pregnancy planning", "Anemia investigation", "Fatigue"],
  },
  {
    slug: "calcium",
    name: "Calcium (Serum)",
    shortName: "Calcium",
    category: "vitamins-minerals",
    description:
      "Measures blood calcium levels important for bone health, nerve function, and muscle contraction.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Bone health", "Parathyroid evaluation", "Muscle cramps", "Vitamin D follow-up"],
  },
  {
    slug: "magnesium",
    name: "Magnesium (Serum)",
    shortName: "Magnesium",
    category: "vitamins-minerals",
    description:
      "Measures magnesium levels involved in 300+ enzymatic reactions in the body.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Muscle cramps", "Heart palpitations", "Fatigue", "Sleep issues"],
  },

  // Diabetes
  {
    slug: "fasting-glucose",
    name: "Fasting Blood Glucose",
    shortName: "Fasting Glucose",
    category: "diabetes",
    description:
      "Measures blood sugar after 8-12 hours of fasting. Primary screening test for diabetes.",
    fastingRequired: true,
    sampleType: "blood",
    turnaroundHours: 4,
    commonReasons: ["Diabetes screening", "Pre-diabetes monitoring", "Annual check-up"],
  },
  {
    slug: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    shortName: "HbA1c",
    category: "diabetes",
    description:
      "Measures average blood sugar over the past 2-3 months. Key test for diabetes diagnosis and monitoring.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Diabetes monitoring", "Diabetes diagnosis", "Treatment adjustment"],
  },
  {
    slug: "insulin-fasting",
    name: "Insulin (Fasting)",
    shortName: "Fasting Insulin",
    category: "diabetes",
    description:
      "Measures fasting insulin levels to assess insulin resistance, a precursor to Type 2 diabetes.",
    fastingRequired: true,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Insulin resistance screening", "PCOS evaluation", "Weight management"],
  },

  // Liver Function
  {
    slug: "lft",
    name: "Liver Function Test (LFT)",
    shortName: "LFT",
    category: "liver",
    description:
      "Panel measuring ALT, AST, ALP, GGT, bilirubin, albumin, and total protein to assess liver health.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Liver health check", "Medication monitoring", "Alcohol use", "Fatty liver"],
  },
  {
    slug: "hepatitis-b",
    name: "Hepatitis B Surface Antigen (HBsAg)",
    shortName: "Hepatitis B",
    category: "liver",
    description:
      "Detects active Hepatitis B virus infection. Required for UAE visa medical screening.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Visa medical", "Occupational health", "Screening", "Vaccination follow-up"],
  },

  // Kidney Function
  {
    slug: "kft",
    name: "Kidney Function Test (KFT/RFT)",
    shortName: "KFT",
    category: "kidney",
    description:
      "Panel measuring creatinine, BUN, eGFR, uric acid, and electrolytes to assess kidney health.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Kidney health check", "Diabetes monitoring", "Medication monitoring", "Hypertension"],
  },
  {
    slug: "uric-acid",
    name: "Uric Acid",
    shortName: "Uric Acid",
    category: "kidney",
    description:
      "Measures uric acid levels to assess risk of gout and kidney stones.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Gout symptoms", "Kidney stone history", "Joint pain"],
  },

  // Cardiac
  {
    slug: "troponin",
    name: "Troponin (High-Sensitivity)",
    shortName: "Troponin",
    category: "cardiac",
    description:
      "Detects cardiac troponin levels to diagnose heart attack and myocardial injury.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 2,
    commonReasons: ["Chest pain", "Heart attack rule-out", "Cardiac monitoring"],
  },
  {
    slug: "crp",
    name: "C-Reactive Protein (CRP / hs-CRP)",
    shortName: "CRP",
    category: "cardiac",
    description:
      "Measures inflammation marker linked to cardiovascular disease risk.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 6,
    commonReasons: ["Heart disease risk", "Inflammation monitoring", "Autoimmune tracking"],
  },
  {
    slug: "bnp",
    name: "BNP / NT-proBNP",
    shortName: "BNP",
    category: "cardiac",
    description:
      "Measures brain natriuretic peptide to assess heart failure risk and severity.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 12,
    commonReasons: ["Shortness of breath", "Heart failure monitoring", "Edema evaluation"],
  },

  // Thyroid
  {
    slug: "tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    shortName: "TSH",
    category: "thyroid",
    description:
      "Primary screening test for thyroid function. Elevated TSH suggests hypothyroidism; low TSH suggests hyperthyroidism.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 12,
    commonReasons: ["Fatigue", "Weight changes", "Hair loss", "Thyroid screening"],
  },
  {
    slug: "thyroid-panel",
    name: "Thyroid Panel (TSH, FT3, FT4)",
    shortName: "Thyroid Panel",
    category: "thyroid",
    description:
      "Comprehensive thyroid assessment measuring TSH, Free T3, and Free T4 hormones.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Thyroid disorder diagnosis", "Medication adjustment", "Fatigue investigation"],
  },

  // Hormones
  {
    slug: "testosterone",
    name: "Testosterone (Total)",
    shortName: "Testosterone",
    category: "hormones",
    description:
      "Measures total testosterone levels important for male health, energy, and muscle mass.",
    fastingRequired: true,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Low energy", "Muscle loss", "Libido changes", "Male infertility"],
  },
  {
    slug: "cortisol",
    name: "Cortisol (Morning)",
    shortName: "Cortisol",
    category: "hormones",
    description:
      "Measures the stress hormone cortisol, typically drawn in the morning when levels peak.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Fatigue", "Weight gain", "Adrenal function", "Stress assessment"],
  },
  {
    slug: "prolactin",
    name: "Prolactin",
    shortName: "Prolactin",
    category: "hormones",
    description:
      "Measures prolactin hormone levels, important for fertility and pituitary function.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Irregular periods", "Galactorrhea", "Pituitary evaluation", "Male infertility"],
  },

  // Fertility
  {
    slug: "amh",
    name: "Anti-Mullerian Hormone (AMH)",
    shortName: "AMH",
    category: "fertility",
    description:
      "Measures ovarian reserve — the remaining egg supply. Key test for fertility planning and IVF assessment.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 48,
    commonReasons: ["Fertility planning", "IVF assessment", "PCOS evaluation", "Ovarian reserve check"],
  },
  {
    slug: "fsh",
    name: "Follicle Stimulating Hormone (FSH)",
    shortName: "FSH",
    category: "fertility",
    description:
      "Measures FSH levels important for reproductive function in both men and women.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Fertility evaluation", "Menopause assessment", "Irregular periods"],
  },
  {
    slug: "estradiol",
    name: "Estradiol (E2)",
    shortName: "Estradiol",
    category: "fertility",
    description:
      "Measures the primary female sex hormone, important for reproductive health and bone density.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Fertility evaluation", "Menopause symptoms", "IVF monitoring"],
  },

  // Allergy
  {
    slug: "ige-total",
    name: "Total IgE (Immunoglobulin E)",
    shortName: "Total IgE",
    category: "allergy",
    description:
      "Measures total IgE antibody levels as a general indicator of allergic response.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Allergy screening", "Asthma evaluation", "Eczema investigation"],
  },
  {
    slug: "food-intolerance-panel",
    name: "Food Intolerance Panel (IgG, 96 foods)",
    shortName: "Food Intolerance 96",
    category: "allergy",
    description:
      "Tests IgG antibodies against 96 common foods to identify potential food intolerances.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 72,
    commonReasons: ["Bloating", "Digestive issues", "Skin problems", "Chronic fatigue"],
  },

  // Cancer Screening
  {
    slug: "psa",
    name: "Prostate-Specific Antigen (PSA)",
    shortName: "PSA",
    category: "cancer-screening",
    description:
      "Screens for prostate cancer in men over 50. Elevated levels may indicate prostate cancer, BPH, or prostatitis.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Prostate cancer screening", "Men over 50", "Family history", "Urinary symptoms"],
  },
  {
    slug: "ca-125",
    name: "CA-125 (Ovarian Cancer Marker)",
    shortName: "CA-125",
    category: "cancer-screening",
    description:
      "Tumor marker used to monitor ovarian cancer treatment and detect recurrence.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Ovarian cancer monitoring", "Pelvic mass evaluation", "Endometriosis"],
  },
  {
    slug: "cea",
    name: "Carcinoembryonic Antigen (CEA)",
    shortName: "CEA",
    category: "cancer-screening",
    description:
      "Tumor marker used primarily to monitor colorectal cancer treatment and detect recurrence.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["Colorectal cancer monitoring", "Smoker screening", "GI cancer follow-up"],
  },

  // STD Screening
  {
    slug: "hiv-test",
    name: "HIV 1/2 Antigen/Antibody (4th Gen)",
    shortName: "HIV Test",
    category: "std-screening",
    description:
      "Fourth-generation HIV test detecting both antigen and antibodies for early and reliable diagnosis.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["STD screening", "Pre-marital testing", "Visa medical", "Routine screening"],
  },
  {
    slug: "vdrl",
    name: "VDRL / RPR (Syphilis Screen)",
    shortName: "Syphilis Test",
    category: "std-screening",
    description:
      "Screening test for syphilis infection using VDRL or RPR methodology.",
    fastingRequired: false,
    sampleType: "blood",
    turnaroundHours: 24,
    commonReasons: ["STD screening", "Pre-marital testing", "Visa medical"],
  },

  // Urine & Stool
  {
    slug: "urinalysis",
    name: "Urinalysis (Complete Urine Examination)",
    shortName: "Urinalysis",
    category: "urine-stool",
    description:
      "Complete urine examination checking for infection, kidney disease, diabetes, and other conditions.",
    fastingRequired: false,
    sampleType: "urine",
    turnaroundHours: 4,
    commonReasons: ["UTI symptoms", "Kidney check", "Diabetes monitoring", "Pre-operative"],
  },
  {
    slug: "stool-analysis",
    name: "Stool Analysis (Complete)",
    shortName: "Stool Analysis",
    category: "urine-stool",
    description:
      "Examines stool for parasites, bacteria, blood, and digestive function indicators.",
    fastingRequired: false,
    sampleType: "stool",
    turnaroundHours: 24,
    commonReasons: ["Digestive issues", "Diarrhea", "Parasite screening", "Blood in stool"],
  },
];

// ─── Pricing Data ───────────────────────────────────────────────────────────────

export const LAB_TEST_PRICES: LabTestPrice[] = [
  // Al Borg Diagnostics
  { labSlug: "al-borg-diagnostics", testSlug: "cbc", price: 85 },
  { labSlug: "al-borg-diagnostics", testSlug: "lipid-profile", price: 110 },
  { labSlug: "al-borg-diagnostics", testSlug: "esr", price: 50 },
  { labSlug: "al-borg-diagnostics", testSlug: "iron-studies", price: 180 },
  { labSlug: "al-borg-diagnostics", testSlug: "vitamin-d", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "vitamin-b12", price: 110 },
  { labSlug: "al-borg-diagnostics", testSlug: "folate", price: 100 },
  { labSlug: "al-borg-diagnostics", testSlug: "calcium", price: 40 },
  { labSlug: "al-borg-diagnostics", testSlug: "magnesium", price: 45 },
  { labSlug: "al-borg-diagnostics", testSlug: "fasting-glucose", price: 40 },
  { labSlug: "al-borg-diagnostics", testSlug: "hba1c", price: 80 },
  { labSlug: "al-borg-diagnostics", testSlug: "insulin-fasting", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "lft", price: 90 },
  { labSlug: "al-borg-diagnostics", testSlug: "hepatitis-b", price: 85 },
  { labSlug: "al-borg-diagnostics", testSlug: "kft", price: 90 },
  { labSlug: "al-borg-diagnostics", testSlug: "uric-acid", price: 40 },
  { labSlug: "al-borg-diagnostics", testSlug: "troponin", price: 180 },
  { labSlug: "al-borg-diagnostics", testSlug: "crp", price: 70 },
  { labSlug: "al-borg-diagnostics", testSlug: "bnp", price: 250 },
  { labSlug: "al-borg-diagnostics", testSlug: "tsh", price: 80 },
  { labSlug: "al-borg-diagnostics", testSlug: "thyroid-panel", price: 180 },
  { labSlug: "al-borg-diagnostics", testSlug: "testosterone", price: 130 },
  { labSlug: "al-borg-diagnostics", testSlug: "cortisol", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "prolactin", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "amh", price: 350 },
  { labSlug: "al-borg-diagnostics", testSlug: "fsh", price: 100 },
  { labSlug: "al-borg-diagnostics", testSlug: "estradiol", price: 100 },
  { labSlug: "al-borg-diagnostics", testSlug: "ige-total", price: 90 },
  { labSlug: "al-borg-diagnostics", testSlug: "food-intolerance-panel", price: 1200 },
  { labSlug: "al-borg-diagnostics", testSlug: "psa", price: 100 },
  { labSlug: "al-borg-diagnostics", testSlug: "ca-125", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "cea", price: 120 },
  { labSlug: "al-borg-diagnostics", testSlug: "hiv-test", price: 100 },
  { labSlug: "al-borg-diagnostics", testSlug: "vdrl", price: 60 },
  { labSlug: "al-borg-diagnostics", testSlug: "urinalysis", price: 40 },
  { labSlug: "al-borg-diagnostics", testSlug: "stool-analysis", price: 50 },

  // Thumbay Labs
  { labSlug: "thumbay-labs", testSlug: "cbc", price: 75 },
  { labSlug: "thumbay-labs", testSlug: "lipid-profile", price: 95 },
  { labSlug: "thumbay-labs", testSlug: "esr", price: 40 },
  { labSlug: "thumbay-labs", testSlug: "iron-studies", price: 160 },
  { labSlug: "thumbay-labs", testSlug: "vitamin-d", price: 100 },
  { labSlug: "thumbay-labs", testSlug: "vitamin-b12", price: 95 },
  { labSlug: "thumbay-labs", testSlug: "folate", price: 85 },
  { labSlug: "thumbay-labs", testSlug: "calcium", price: 35 },
  { labSlug: "thumbay-labs", testSlug: "magnesium", price: 40 },
  { labSlug: "thumbay-labs", testSlug: "fasting-glucose", price: 35 },
  { labSlug: "thumbay-labs", testSlug: "hba1c", price: 70 },
  { labSlug: "thumbay-labs", testSlug: "insulin-fasting", price: 110 },
  { labSlug: "thumbay-labs", testSlug: "lft", price: 80 },
  { labSlug: "thumbay-labs", testSlug: "hepatitis-b", price: 70 },
  { labSlug: "thumbay-labs", testSlug: "kft", price: 75 },
  { labSlug: "thumbay-labs", testSlug: "uric-acid", price: 35 },
  { labSlug: "thumbay-labs", testSlug: "troponin", price: 160 },
  { labSlug: "thumbay-labs", testSlug: "crp", price: 60 },
  { labSlug: "thumbay-labs", testSlug: "bnp", price: 220 },
  { labSlug: "thumbay-labs", testSlug: "tsh", price: 70 },
  { labSlug: "thumbay-labs", testSlug: "thyroid-panel", price: 160 },
  { labSlug: "thumbay-labs", testSlug: "testosterone", price: 110 },
  { labSlug: "thumbay-labs", testSlug: "cortisol", price: 100 },
  { labSlug: "thumbay-labs", testSlug: "prolactin", price: 100 },
  { labSlug: "thumbay-labs", testSlug: "amh", price: 300 },
  { labSlug: "thumbay-labs", testSlug: "fsh", price: 85 },
  { labSlug: "thumbay-labs", testSlug: "estradiol", price: 90 },
  { labSlug: "thumbay-labs", testSlug: "ige-total", price: 80 },
  { labSlug: "thumbay-labs", testSlug: "food-intolerance-panel", price: 1100 },
  { labSlug: "thumbay-labs", testSlug: "psa", price: 85 },
  { labSlug: "thumbay-labs", testSlug: "ca-125", price: 100 },
  { labSlug: "thumbay-labs", testSlug: "cea", price: 100 },
  { labSlug: "thumbay-labs", testSlug: "hiv-test", price: 90 },
  { labSlug: "thumbay-labs", testSlug: "vdrl", price: 50 },
  { labSlug: "thumbay-labs", testSlug: "urinalysis", price: 35 },
  { labSlug: "thumbay-labs", testSlug: "stool-analysis", price: 40 },

  // Medsol Diagnostics (budget-friendly)
  { labSlug: "medsol-diagnostics", testSlug: "cbc", price: 69 },
  { labSlug: "medsol-diagnostics", testSlug: "lipid-profile", price: 80 },
  { labSlug: "medsol-diagnostics", testSlug: "esr", price: 35 },
  { labSlug: "medsol-diagnostics", testSlug: "iron-studies", price: 140 },
  { labSlug: "medsol-diagnostics", testSlug: "vitamin-d", price: 85 },
  { labSlug: "medsol-diagnostics", testSlug: "vitamin-b12", price: 80 },
  { labSlug: "medsol-diagnostics", testSlug: "folate", price: 75 },
  { labSlug: "medsol-diagnostics", testSlug: "calcium", price: 30 },
  { labSlug: "medsol-diagnostics", testSlug: "magnesium", price: 35 },
  { labSlug: "medsol-diagnostics", testSlug: "fasting-glucose", price: 30 },
  { labSlug: "medsol-diagnostics", testSlug: "hba1c", price: 60 },
  { labSlug: "medsol-diagnostics", testSlug: "insulin-fasting", price: 95 },
  { labSlug: "medsol-diagnostics", testSlug: "lft", price: 65 },
  { labSlug: "medsol-diagnostics", testSlug: "hepatitis-b", price: 60 },
  { labSlug: "medsol-diagnostics", testSlug: "kft", price: 60 },
  { labSlug: "medsol-diagnostics", testSlug: "uric-acid", price: 30 },
  { labSlug: "medsol-diagnostics", testSlug: "troponin", price: 140 },
  { labSlug: "medsol-diagnostics", testSlug: "crp", price: 50 },
  { labSlug: "medsol-diagnostics", testSlug: "bnp", price: 200 },
  { labSlug: "medsol-diagnostics", testSlug: "tsh", price: 60 },
  { labSlug: "medsol-diagnostics", testSlug: "thyroid-panel", price: 130 },
  { labSlug: "medsol-diagnostics", testSlug: "testosterone", price: 100 },
  { labSlug: "medsol-diagnostics", testSlug: "cortisol", price: 90 },
  { labSlug: "medsol-diagnostics", testSlug: "prolactin", price: 90 },
  { labSlug: "medsol-diagnostics", testSlug: "amh", price: 280 },
  { labSlug: "medsol-diagnostics", testSlug: "fsh", price: 80 },
  { labSlug: "medsol-diagnostics", testSlug: "estradiol", price: 80 },
  { labSlug: "medsol-diagnostics", testSlug: "ige-total", price: 70 },
  { labSlug: "medsol-diagnostics", testSlug: "food-intolerance-panel", price: 950 },
  { labSlug: "medsol-diagnostics", testSlug: "psa", price: 75 },
  { labSlug: "medsol-diagnostics", testSlug: "ca-125", price: 90 },
  { labSlug: "medsol-diagnostics", testSlug: "cea", price: 90 },
  { labSlug: "medsol-diagnostics", testSlug: "hiv-test", price: 80 },
  { labSlug: "medsol-diagnostics", testSlug: "vdrl", price: 45 },
  { labSlug: "medsol-diagnostics", testSlug: "urinalysis", price: 30 },
  { labSlug: "medsol-diagnostics", testSlug: "stool-analysis", price: 35 },

  // Unilabs (premium pricing)
  { labSlug: "unilabs", testSlug: "cbc", price: 120 },
  { labSlug: "unilabs", testSlug: "lipid-profile", price: 150 },
  { labSlug: "unilabs", testSlug: "esr", price: 60 },
  { labSlug: "unilabs", testSlug: "iron-studies", price: 220 },
  { labSlug: "unilabs", testSlug: "vitamin-d", price: 150 },
  { labSlug: "unilabs", testSlug: "vitamin-b12", price: 130 },
  { labSlug: "unilabs", testSlug: "folate", price: 120 },
  { labSlug: "unilabs", testSlug: "calcium", price: 50 },
  { labSlug: "unilabs", testSlug: "magnesium", price: 55 },
  { labSlug: "unilabs", testSlug: "fasting-glucose", price: 50 },
  { labSlug: "unilabs", testSlug: "hba1c", price: 100 },
  { labSlug: "unilabs", testSlug: "insulin-fasting", price: 150 },
  { labSlug: "unilabs", testSlug: "lft", price: 120 },
  { labSlug: "unilabs", testSlug: "hepatitis-b", price: 100 },
  { labSlug: "unilabs", testSlug: "kft", price: 110 },
  { labSlug: "unilabs", testSlug: "uric-acid", price: 50 },
  { labSlug: "unilabs", testSlug: "troponin", price: 220 },
  { labSlug: "unilabs", testSlug: "crp", price: 90 },
  { labSlug: "unilabs", testSlug: "bnp", price: 300 },
  { labSlug: "unilabs", testSlug: "tsh", price: 100 },
  { labSlug: "unilabs", testSlug: "thyroid-panel", price: 220 },
  { labSlug: "unilabs", testSlug: "testosterone", price: 160 },
  { labSlug: "unilabs", testSlug: "cortisol", price: 140 },
  { labSlug: "unilabs", testSlug: "prolactin", price: 140 },
  { labSlug: "unilabs", testSlug: "amh", price: 400 },
  { labSlug: "unilabs", testSlug: "fsh", price: 120 },
  { labSlug: "unilabs", testSlug: "estradiol", price: 120 },
  { labSlug: "unilabs", testSlug: "ige-total", price: 110 },
  { labSlug: "unilabs", testSlug: "food-intolerance-panel", price: 1500 },
  { labSlug: "unilabs", testSlug: "psa", price: 120 },
  { labSlug: "unilabs", testSlug: "ca-125", price: 150 },
  { labSlug: "unilabs", testSlug: "cea", price: 150 },
  { labSlug: "unilabs", testSlug: "hiv-test", price: 120 },
  { labSlug: "unilabs", testSlug: "vdrl", price: 70 },
  { labSlug: "unilabs", testSlug: "urinalysis", price: 50 },
  { labSlug: "unilabs", testSlug: "stool-analysis", price: 60 },

  // STAR Metropolis
  { labSlug: "metropolis-star", testSlug: "cbc", price: 80 },
  { labSlug: "metropolis-star", testSlug: "lipid-profile", price: 100 },
  { labSlug: "metropolis-star", testSlug: "esr", price: 45 },
  { labSlug: "metropolis-star", testSlug: "iron-studies", price: 170 },
  { labSlug: "metropolis-star", testSlug: "vitamin-d", price: 110 },
  { labSlug: "metropolis-star", testSlug: "vitamin-b12", price: 100 },
  { labSlug: "metropolis-star", testSlug: "folate", price: 90 },
  { labSlug: "metropolis-star", testSlug: "calcium", price: 38 },
  { labSlug: "metropolis-star", testSlug: "magnesium", price: 42 },
  { labSlug: "metropolis-star", testSlug: "fasting-glucose", price: 38 },
  { labSlug: "metropolis-star", testSlug: "hba1c", price: 75 },
  { labSlug: "metropolis-star", testSlug: "insulin-fasting", price: 115 },
  { labSlug: "metropolis-star", testSlug: "lft", price: 85 },
  { labSlug: "metropolis-star", testSlug: "hepatitis-b", price: 80 },
  { labSlug: "metropolis-star", testSlug: "kft", price: 80 },
  { labSlug: "metropolis-star", testSlug: "uric-acid", price: 38 },
  { labSlug: "metropolis-star", testSlug: "troponin", price: 170 },
  { labSlug: "metropolis-star", testSlug: "crp", price: 65 },
  { labSlug: "metropolis-star", testSlug: "bnp", price: 240 },
  { labSlug: "metropolis-star", testSlug: "tsh", price: 75 },
  { labSlug: "metropolis-star", testSlug: "thyroid-panel", price: 170 },
  { labSlug: "metropolis-star", testSlug: "testosterone", price: 120 },
  { labSlug: "metropolis-star", testSlug: "cortisol", price: 110 },
  { labSlug: "metropolis-star", testSlug: "prolactin", price: 110 },
  { labSlug: "metropolis-star", testSlug: "amh", price: 330 },
  { labSlug: "metropolis-star", testSlug: "fsh", price: 90 },
  { labSlug: "metropolis-star", testSlug: "estradiol", price: 95 },
  { labSlug: "metropolis-star", testSlug: "ige-total", price: 85 },
  { labSlug: "metropolis-star", testSlug: "food-intolerance-panel", price: 1150 },
  { labSlug: "metropolis-star", testSlug: "psa", price: 90 },
  { labSlug: "metropolis-star", testSlug: "ca-125", price: 110 },
  { labSlug: "metropolis-star", testSlug: "cea", price: 110 },
  { labSlug: "metropolis-star", testSlug: "hiv-test", price: 95 },
  { labSlug: "metropolis-star", testSlug: "vdrl", price: 55 },
  { labSlug: "metropolis-star", testSlug: "urinalysis", price: 35 },
  { labSlug: "metropolis-star", testSlug: "stool-analysis", price: 45 },

  // Alpha Medical Lab (budget)
  { labSlug: "alpha-medical-lab", testSlug: "cbc", price: 70 },
  { labSlug: "alpha-medical-lab", testSlug: "lipid-profile", price: 85 },
  { labSlug: "alpha-medical-lab", testSlug: "esr", price: 35 },
  { labSlug: "alpha-medical-lab", testSlug: "iron-studies", price: 145 },
  { labSlug: "alpha-medical-lab", testSlug: "vitamin-d", price: 90 },
  { labSlug: "alpha-medical-lab", testSlug: "vitamin-b12", price: 85 },
  { labSlug: "alpha-medical-lab", testSlug: "folate", price: 80 },
  { labSlug: "alpha-medical-lab", testSlug: "calcium", price: 30 },
  { labSlug: "alpha-medical-lab", testSlug: "magnesium", price: 35 },
  { labSlug: "alpha-medical-lab", testSlug: "fasting-glucose", price: 30 },
  { labSlug: "alpha-medical-lab", testSlug: "hba1c", price: 65 },
  { labSlug: "alpha-medical-lab", testSlug: "insulin-fasting", price: 100 },
  { labSlug: "alpha-medical-lab", testSlug: "lft", price: 65 },
  { labSlug: "alpha-medical-lab", testSlug: "hepatitis-b", price: 65 },
  { labSlug: "alpha-medical-lab", testSlug: "kft", price: 65 },
  { labSlug: "alpha-medical-lab", testSlug: "uric-acid", price: 30 },
  { labSlug: "alpha-medical-lab", testSlug: "tsh", price: 65 },
  { labSlug: "alpha-medical-lab", testSlug: "thyroid-panel", price: 140 },
  { labSlug: "alpha-medical-lab", testSlug: "testosterone", price: 105 },
  { labSlug: "alpha-medical-lab", testSlug: "amh", price: 290 },
  { labSlug: "alpha-medical-lab", testSlug: "psa", price: 80 },
  { labSlug: "alpha-medical-lab", testSlug: "hiv-test", price: 85 },
  { labSlug: "alpha-medical-lab", testSlug: "vdrl", price: 45 },
  { labSlug: "alpha-medical-lab", testSlug: "urinalysis", price: 30 },
  { labSlug: "alpha-medical-lab", testSlug: "stool-analysis", price: 35 },

  // DarDoc (home service pricing — slightly higher)
  { labSlug: "dardoc", testSlug: "cbc", price: 99 },
  { labSlug: "dardoc", testSlug: "lipid-profile", price: 120 },
  { labSlug: "dardoc", testSlug: "vitamin-d", price: 130 },
  { labSlug: "dardoc", testSlug: "vitamin-b12", price: 120 },
  { labSlug: "dardoc", testSlug: "fasting-glucose", price: 50 },
  { labSlug: "dardoc", testSlug: "hba1c", price: 90 },
  { labSlug: "dardoc", testSlug: "lft", price: 100 },
  { labSlug: "dardoc", testSlug: "kft", price: 95 },
  { labSlug: "dardoc", testSlug: "tsh", price: 85 },
  { labSlug: "dardoc", testSlug: "thyroid-panel", price: 190 },
  { labSlug: "dardoc", testSlug: "iron-studies", price: 190 },
  { labSlug: "dardoc", testSlug: "testosterone", price: 140 },
  { labSlug: "dardoc", testSlug: "amh", price: 370 },
  { labSlug: "dardoc", testSlug: "hiv-test", price: 110 },
  { labSlug: "dardoc", testSlug: "urinalysis", price: 45 },

  // MenaLabs
  { labSlug: "menalabs", testSlug: "cbc", price: 90 },
  { labSlug: "menalabs", testSlug: "lipid-profile", price: 115 },
  { labSlug: "menalabs", testSlug: "esr", price: 50 },
  { labSlug: "menalabs", testSlug: "iron-studies", price: 185 },
  { labSlug: "menalabs", testSlug: "vitamin-d", price: 125 },
  { labSlug: "menalabs", testSlug: "vitamin-b12", price: 115 },
  { labSlug: "menalabs", testSlug: "fasting-glucose", price: 42 },
  { labSlug: "menalabs", testSlug: "hba1c", price: 85 },
  { labSlug: "menalabs", testSlug: "lft", price: 95 },
  { labSlug: "menalabs", testSlug: "kft", price: 90 },
  { labSlug: "menalabs", testSlug: "tsh", price: 82 },
  { labSlug: "menalabs", testSlug: "thyroid-panel", price: 185 },
  { labSlug: "menalabs", testSlug: "testosterone", price: 130 },
  { labSlug: "menalabs", testSlug: "amh", price: 360 },
  { labSlug: "menalabs", testSlug: "psa", price: 100 },
  { labSlug: "menalabs", testSlug: "hiv-test", price: 100 },
  { labSlug: "menalabs", testSlug: "urinalysis", price: 40 },

  // NRL
  { labSlug: "national-reference-laboratory", testSlug: "cbc", price: 95 },
  { labSlug: "national-reference-laboratory", testSlug: "lipid-profile", price: 120 },
  { labSlug: "national-reference-laboratory", testSlug: "vitamin-d", price: 135 },
  { labSlug: "national-reference-laboratory", testSlug: "vitamin-b12", price: 120 },
  { labSlug: "national-reference-laboratory", testSlug: "fasting-glucose", price: 45 },
  { labSlug: "national-reference-laboratory", testSlug: "hba1c", price: 85 },
  { labSlug: "national-reference-laboratory", testSlug: "lft", price: 100 },
  { labSlug: "national-reference-laboratory", testSlug: "kft", price: 95 },
  { labSlug: "national-reference-laboratory", testSlug: "tsh", price: 85 },
  { labSlug: "national-reference-laboratory", testSlug: "thyroid-panel", price: 195 },
  { labSlug: "national-reference-laboratory", testSlug: "amh", price: 380 },
  { labSlug: "national-reference-laboratory", testSlug: "hiv-test", price: 100 },

  // PureLab
  { labSlug: "purelab", testSlug: "cbc", price: 90 },
  { labSlug: "purelab", testSlug: "lipid-profile", price: 110 },
  { labSlug: "purelab", testSlug: "vitamin-d", price: 120 },
  { labSlug: "purelab", testSlug: "vitamin-b12", price: 110 },
  { labSlug: "purelab", testSlug: "fasting-glucose", price: 40 },
  { labSlug: "purelab", testSlug: "hba1c", price: 80 },
  { labSlug: "purelab", testSlug: "lft", price: 90 },
  { labSlug: "purelab", testSlug: "kft", price: 85 },
  { labSlug: "purelab", testSlug: "tsh", price: 78 },
  { labSlug: "purelab", testSlug: "thyroid-panel", price: 175 },
  { labSlug: "purelab", testSlug: "amh", price: 340 },
  { labSlug: "purelab", testSlug: "hiv-test", price: 95 },
];

// ─── Health Packages ────────────────────────────────────────────────────────────

export const HEALTH_PACKAGES: HealthPackage[] = [
  // Al Borg packages
  {
    id: "alborg-basic",
    labSlug: "al-borg-diagnostics",
    name: "Basic Health Check",
    targetAudience: "Routine annual screening for adults",
    price: 199,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "lft", "kft", "urinalysis"],
    biomarkerCount: 45,
    includes: ["CBC", "Lipid Profile", "Glucose", "Liver Function", "Kidney Function", "Urinalysis"],
    suitableFor: ["all"],
  },
  {
    id: "alborg-comprehensive",
    labSlug: "al-borg-diagnostics",
    name: "Comprehensive Wellness",
    targetAudience: "Complete health assessment with vitamins and hormones",
    price: 499,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "thyroid-panel", "vitamin-d", "vitamin-b12", "iron-studies", "urinalysis"],
    biomarkerCount: 85,
    includes: ["CBC", "Lipid Profile", "Diabetes Panel", "Liver", "Kidney", "Thyroid Panel", "Vitamin D", "B12", "Iron Studies"],
    suitableFor: ["all"],
  },
  {
    id: "alborg-executive",
    labSlug: "al-borg-diagnostics",
    name: "Executive Health Screen",
    targetAudience: "Premium executive check-up with cardiac & cancer markers",
    price: 899,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "thyroid-panel", "vitamin-d", "vitamin-b12", "iron-studies", "crp", "psa", "cea", "urinalysis", "stool-analysis"],
    biomarkerCount: 120,
    includes: ["All Comprehensive tests", "Cardiac CRP", "Tumor Markers (PSA, CEA)", "Stool Analysis"],
    suitableFor: ["all"],
  },

  // Thumbay packages
  {
    id: "thumbay-basic",
    labSlug: "thumbay-labs",
    name: "Essential Health Panel",
    targetAudience: "Affordable annual screening",
    price: 149,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "lft", "kft"],
    biomarkerCount: 38,
    includes: ["CBC", "Lipid Profile", "Glucose", "Liver Function", "Kidney Function"],
    suitableFor: ["all"],
  },
  {
    id: "thumbay-wellness",
    labSlug: "thumbay-labs",
    name: "Wellness Plus",
    targetAudience: "Standard wellness with vitamins and thyroid",
    price: 349,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "tsh", "vitamin-d", "vitamin-b12", "iron-studies", "urinalysis"],
    biomarkerCount: 72,
    includes: ["CBC", "Lipid Profile", "Diabetes Panel", "Liver", "Kidney", "TSH", "Vitamin D", "B12", "Iron"],
    suitableFor: ["all"],
  },

  // Medsol packages (budget)
  {
    id: "medsol-basic",
    labSlug: "medsol-diagnostics",
    name: "Budget Health Check",
    targetAudience: "Most affordable comprehensive screening in UAE",
    price: 99,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "lft", "kft"],
    biomarkerCount: 35,
    includes: ["CBC", "Lipid Profile", "Glucose", "Liver Function", "Kidney Function"],
    suitableFor: ["all"],
  },
  {
    id: "medsol-standard",
    labSlug: "medsol-diagnostics",
    name: "Standard Wellness",
    targetAudience: "Best value comprehensive screening",
    price: 230,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "tsh", "vitamin-d", "vitamin-b12", "iron-studies", "urinalysis"],
    biomarkerCount: 68,
    includes: ["CBC", "Lipid Profile", "Diabetes Panel", "Liver", "Kidney", "TSH", "Vitamin D", "B12", "Iron"],
    suitableFor: ["all"],
  },
  {
    id: "medsol-womens",
    labSlug: "medsol-diagnostics",
    name: "Women's Health Panel",
    targetAudience: "Comprehensive screening tailored for women",
    price: 399,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "lft", "kft", "thyroid-panel", "vitamin-d", "vitamin-b12", "iron-studies", "folate", "fsh", "estradiol", "prolactin", "calcium"],
    biomarkerCount: 82,
    includes: ["CBC", "Lipid Profile", "Liver", "Kidney", "Full Thyroid", "Vitamins", "Iron", "Fertility Hormones", "Calcium"],
    suitableFor: ["female"],
  },

  // Unilabs (premium)
  {
    id: "unilabs-executive",
    labSlug: "unilabs",
    name: "Executive Diagnostics",
    targetAudience: "Premium executive health assessment",
    price: 999,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "thyroid-panel", "vitamin-d", "vitamin-b12", "iron-studies", "crp", "troponin", "psa", "cea", "ca-125", "urinalysis", "stool-analysis"],
    biomarkerCount: 150,
    includes: ["Full Blood Panel", "Comprehensive Metabolic", "Full Thyroid", "Cardiac Markers", "Tumor Markers", "Vitamins"],
    suitableFor: ["all"],
  },

  // DarDoc (home packages)
  {
    id: "dardoc-athome-basic",
    labSlug: "dardoc",
    name: "At-Home Basic Panel",
    targetAudience: "Essential blood work from the comfort of home",
    price: 199,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "lft", "kft"],
    biomarkerCount: 40,
    includes: ["CBC", "Lipid Profile", "Glucose", "Liver Function", "Kidney Function", "Home Collection Included"],
    suitableFor: ["all"],
  },
  {
    id: "dardoc-athome-comprehensive",
    labSlug: "dardoc",
    name: "At-Home Comprehensive",
    targetAudience: "Full health assessment without leaving home",
    price: 449,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "thyroid-panel", "vitamin-d", "vitamin-b12", "iron-studies"],
    biomarkerCount: 78,
    includes: ["CBC", "Lipid Profile", "Diabetes Panel", "Liver", "Kidney", "Full Thyroid", "Vitamins", "Iron", "Home Collection Included"],
    suitableFor: ["all"],
  },

  // Metropolis
  {
    id: "metropolis-wellness",
    labSlug: "metropolis-star",
    name: "Wellness Check",
    targetAudience: "Standard wellness screening",
    price: 299,
    testSlugs: ["cbc", "lipid-profile", "fasting-glucose", "hba1c", "lft", "kft", "tsh", "vitamin-d", "urinalysis"],
    biomarkerCount: 60,
    includes: ["CBC", "Lipid Profile", "Diabetes Panel", "Liver", "Kidney", "TSH", "Vitamin D"],
    suitableFor: ["all"],
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

export function getLabProfile(slug: string): LabProfile | undefined {
  return LAB_PROFILES.find((l) => l.slug === slug);
}

export function getLabTest(slug: string): LabTest | undefined {
  return LAB_TESTS.find((t) => t.slug === slug);
}

export function getTestsByCategory(category: TestCategory): LabTest[] {
  return LAB_TESTS.filter((t) => t.category === category);
}

export function getPricesForTest(testSlug: string): (LabTestPrice & { labName: string })[] {
  return LAB_TEST_PRICES
    .filter((p) => p.testSlug === testSlug)
    .map((p) => ({
      ...p,
      labName: getLabProfile(p.labSlug)?.name || p.labSlug,
    }))
    .sort((a, b) => a.price - b.price);
}

export function getPricesForLab(labSlug: string): (LabTestPrice & { testName: string })[] {
  return LAB_TEST_PRICES
    .filter((p) => p.labSlug === labSlug)
    .map((p) => ({
      ...p,
      testName: getLabTest(p.testSlug)?.name || p.testSlug,
    }))
    .sort((a, b) => a.price - b.price);
}

export function getPackagesForLab(labSlug: string): HealthPackage[] {
  return HEALTH_PACKAGES.filter((p) => p.labSlug === labSlug);
}

export function getCheapestPriceForTest(testSlug: string): LabTestPrice | undefined {
  const prices = LAB_TEST_PRICES.filter((p) => p.testSlug === testSlug);
  if (prices.length === 0) return undefined;
  return prices.reduce((min, p) => (p.price < min.price ? p : min));
}

export function getMostExpensivePriceForTest(testSlug: string): LabTestPrice | undefined {
  const prices = LAB_TEST_PRICES.filter((p) => p.testSlug === testSlug);
  if (prices.length === 0) return undefined;
  return prices.reduce((max, p) => (p.price > max.price ? p : max));
}

export function formatPrice(price: number): string {
  return `AED ${price.toLocaleString()}`;
}

export function getPriceRange(testSlug: string): { min: number; max: number; labCount: number } | undefined {
  const prices = LAB_TEST_PRICES.filter((p) => p.testSlug === testSlug);
  if (prices.length === 0) return undefined;
  return {
    min: Math.min(...prices.map((p) => p.price)),
    max: Math.max(...prices.map((p) => p.price)),
    labCount: prices.length,
  };
}

export function getTestCategoryLabel(slug: TestCategory): string {
  return TEST_CATEGORIES.find((c) => c.slug === slug)?.name || slug;
}
