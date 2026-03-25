/**
 * Audience-specific medical pricing guides.
 *
 * Each guide targets a specific user segment searching for healthcare costs in the UAE.
 * Guides are rendered at /pricing/guide/[slug] (UAE-wide) and /pricing/guide/[slug]/[city].
 */

export interface PricingGuide {
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  /** Which procedures to highlight (slugs from PROCEDURES) */
  featuredProcedures: string[];
  /** Audience description for the intro */
  audience: string;
  /** Key tips/advice specific to this audience */
  tips: string[];
  /** SEO search terms */
  searchTerms: string[];
  sortOrder: number;
}

export const PRICING_GUIDES: PricingGuide[] = [
  {
    slug: "without-insurance",
    name: "Medical Costs Without Insurance in UAE",
    description:
      "Complete self-pay price guide for residents without health insurance coverage in the UAE. Find out what you will pay out-of-pocket for the most common medical procedures, how to access affordable care, and where government facilities offer the lowest rates.",
    icon: "ShieldOff",
    featuredProcedures: [
      "gp-consultation",
      "blood-test",
      "x-ray",
      "ultrasound",
      "dental-cleaning",
      "ecg",
      "vitamin-d-test",
      "thyroid-test",
      "ct-scan",
      "health-checkup",
      "specialist-consultation",
      "physiotherapy-session",
      "mammogram",
      "tooth-extraction",
      "root-canal",
      "mri-scan",
      "endoscopy",
      "psychology-session",
      "dental-crown",
      "colonoscopy",
    ],
    audience:
      "Uninsured residents, new arrivals who have not yet received employer insurance, people between jobs, freelancers on visit visas, and anyone paying out-of-pocket for medical care in the UAE.",
    tips: [
      "Visit government hospitals (e.g. Rashid Hospital in Dubai, Sheikh Khalifa Medical City in Abu Dhabi) for the lowest self-pay rates — typically 30-50% cheaper than private facilities.",
      "Ask for the cash-pay or self-pay rate upfront — many private clinics offer a discount of 10-20% for direct cash payment versus insurance billing.",
      "Get blood tests and imaging done at standalone diagnostic centres (labs and radiology centres) rather than hospitals — they are often 40-60% cheaper.",
      "Use MOHAP primary health centres in the northern emirates for GP visits and basic lab work at government-subsidised rates.",
      "Request generic medications instead of branded ones at the pharmacy — generics cost 50-80% less and are equally effective.",
      "For dental care, consider clinics in Sharjah or Ajman where prices are 30-40% lower than Dubai for the same procedures.",
      "Emergency rooms are required by UAE law to treat all patients regardless of insurance status — you will be billed afterwards but will not be turned away.",
      "Consider purchasing short-term health insurance if you expect to need multiple procedures — even a basic plan can save you thousands of dirhams.",
    ],
    searchTerms: [
      "medical costs without insurance UAE",
      "self-pay healthcare Dubai",
      "no insurance doctor visit cost UAE",
      "uninsured medical treatment Dubai",
      "out of pocket healthcare costs UAE",
      "how much does a doctor visit cost without insurance Dubai",
      "cheapest hospital without insurance UAE",
      "self-pay clinic Dubai",
      "medical treatment cost without insurance Abu Dhabi",
      "free healthcare UAE",
    ],
    sortOrder: 1,
  },
  {
    slug: "for-tourists",
    name: "Medical Costs for Tourists & Visitors in UAE",
    description:
      "What tourists and short-term visitors need to know about healthcare costs in the UAE. Walk-in rates, emergency care access, which hospitals welcome tourists, and how travel insurance works with UAE medical facilities.",
    icon: "Plane",
    featuredProcedures: [
      "gp-consultation",
      "x-ray",
      "blood-test",
      "specialist-consultation",
      "dental-cleaning",
      "tooth-extraction",
      "ecg",
      "ultrasound",
      "ct-scan",
      "mri-scan",
      "physiotherapy-session",
      "health-checkup",
    ],
    audience:
      "Tourists visiting the UAE, short-term business travellers, medical tourists considering procedures in Dubai or Abu Dhabi, and visitors on transit or tourist visas who need medical care.",
    tips: [
      "Carry your travel insurance card and policy number at all times — most UAE hospitals can process international insurance claims directly.",
      "For non-emergencies, visit walk-in clinics rather than hospital ERs — walk-in GP consultations cost AED 150-400 versus AED 500-1,500 for ER visits.",
      "All UAE hospitals are legally required to provide emergency treatment regardless of your insurance or visa status — you will be treated first and billed later.",
      "Dubai Healthcare City (DHCC) and Abu Dhabi have hospitals experienced with international patients and medical tourists — they often have multilingual staff.",
      "Keep all medical receipts and documentation for travel insurance reimbursement claims — UAE hospitals provide itemised bills in English.",
      "Pharmacies in the UAE sell many medications over the counter that require prescriptions in other countries — but always bring your regular prescriptions from home.",
      "If you need dental emergency treatment, standalone dental clinics offer much lower rates than hospital dental departments.",
      "Download the DHA (Dubai Health Authority) or SEHA (Abu Dhabi) apps for the nearest healthcare facilities and estimated wait times.",
    ],
    searchTerms: [
      "medical costs for tourists UAE",
      "healthcare cost visitors Dubai",
      "tourist medical treatment Dubai",
      "hospital cost for tourists Abu Dhabi",
      "travel insurance healthcare UAE",
      "walk-in clinic tourist Dubai",
      "medical tourism costs Dubai",
      "emergency room cost tourist UAE",
      "doctor visit cost tourist Dubai",
      "tourist healthcare guide UAE",
    ],
    sortOrder: 2,
  },
  {
    slug: "for-expats",
    name: "Healthcare Costs Guide for Expats in UAE",
    description:
      "Everything expats need to know about healthcare costs in the UAE. What your mandatory insurance covers, typical co-pay amounts, where to save money, and what procedures cost out-of-pocket after insurance.",
    icon: "Globe",
    featuredProcedures: [
      "gp-consultation",
      "specialist-consultation",
      "blood-test",
      "x-ray",
      "mri-scan",
      "ultrasound",
      "dental-cleaning",
      "dental-crown",
      "root-canal",
      "health-checkup",
      "vitamin-d-test",
      "thyroid-test",
      "ecg",
      "mammogram",
      "physiotherapy-session",
      "psychology-session",
      "lasik",
      "endoscopy",
      "colonoscopy",
      "ct-scan",
    ],
    audience:
      "Expatriates living and working in the UAE, newly arrived expats navigating the healthcare system, and expat families planning their healthcare budgets.",
    tips: [
      "Health insurance is mandatory for all UAE residents as of January 2025 — your employer must provide it. Verify your plan tier (basic, enhanced, or premium) and understand your co-pay structure.",
      "Most employer-provided basic plans cover GP visits, specialist consultations, diagnostics, and emergency care. Co-pays are typically 10-20% for outpatient visits.",
      "Enhanced and premium plans often include dental, maternity, optical, and mental health benefits — check your policy document for sub-limits on each.",
      "In-network providers cost less than out-of-network. Always check if a hospital or clinic is in your insurance network before booking to avoid surprise bills.",
      "Pre-authorisation is required for MRI, CT scans, surgeries, and inpatient admissions on most plans. Your doctor's office usually handles this — confirm before your appointment.",
      "Dental coverage varies widely. Basic plans exclude dental entirely; enhanced plans may cover AED 3,000-5,000 per year; premium plans may cover AED 7,000-10,000.",
      "Maternity benefit is available on most plans but typically has a 10-12 month waiting period from policy start. Plan ahead if you are expecting.",
      "Government hospitals (SEHA in Abu Dhabi, DHA in Dubai) often have shorter specialist wait times and lower co-pays than private hospitals for insured patients.",
    ],
    searchTerms: [
      "healthcare costs for expats UAE",
      "expat medical insurance UAE",
      "how much does healthcare cost for expats Dubai",
      "co-pay amounts UAE health insurance",
      "expat health insurance coverage UAE",
      "what does insurance cover in UAE",
      "best value healthcare expats Dubai",
      "expat healthcare guide Abu Dhabi",
      "mandatory health insurance UAE expats",
      "out of pocket costs expats UAE",
    ],
    sortOrder: 3,
  },
  {
    slug: "budget-healthcare",
    name: "Cheapest Healthcare Options in UAE",
    description:
      "Find the most affordable medical care across the UAE. Compare government hospital prices with private clinics, discover the cheapest cities for each procedure, and learn strategies to minimise your healthcare spending.",
    icon: "PiggyBank",
    featuredProcedures: [
      "gp-consultation",
      "blood-test",
      "x-ray",
      "dental-cleaning",
      "vitamin-d-test",
      "thyroid-test",
      "ultrasound",
      "ecg",
      "health-checkup",
      "tooth-extraction",
      "specialist-consultation",
      "physiotherapy-session",
      "mammogram",
      "ct-scan",
      "dental-crown",
      "root-canal",
      "mri-scan",
      "psychology-session",
      "endoscopy",
      "colonoscopy",
    ],
    audience:
      "Budget-conscious residents, families managing healthcare spending, people comparing costs across emirates, and anyone looking for the cheapest medical care in the UAE.",
    tips: [
      "Northern emirates (Sharjah, Ajman, Umm Al Quwain) are consistently 30-40% cheaper than Dubai for the same medical procedures.",
      "Government hospitals offer the lowest prices in every emirate — MOHAP, DHA, and SEHA facilities charge at or below the base tariff rate.",
      "Standalone labs (e.g. Al Borg, Unilabs) charge 40-60% less for blood tests and diagnostics compared to hospital labs.",
      "For dental work, Ajman and Sharjah dental clinics offer the best value — dental cleaning from AED 100 versus AED 200+ in Dubai.",
      "Schedule non-urgent procedures for weekdays — some clinics offer lower rates for off-peak appointments.",
      "Package deals for health checkups (blood work + ECG + ultrasound) are usually 20-30% cheaper than ordering each test separately.",
      "Compare at least three providers before booking any procedure over AED 1,000 — prices for the same procedure can vary by 2-3x across facilities.",
      "MOHAP primary health centres charge government-subsidised rates for UAE residents — GP visits from AED 50-80 in the northern emirates.",
    ],
    searchTerms: [
      "cheapest healthcare UAE",
      "affordable medical care Dubai",
      "budget healthcare options UAE",
      "cheapest hospital UAE",
      "low cost medical treatment Dubai",
      "cheapest city for medical care UAE",
      "affordable clinic Dubai",
      "government hospital prices UAE",
      "cheapest medical procedures UAE",
      "save money on healthcare UAE",
    ],
    sortOrder: 4,
  },
  {
    slug: "premium-healthcare",
    name: "Premium Healthcare in UAE — What You Get for the Price",
    description:
      "A guide to premium and VIP healthcare in the UAE. Understand what you pay for at top-tier facilities, compare premium versus standard pricing, and learn what additional services and amenities premium hospitals offer.",
    icon: "Crown",
    featuredProcedures: [
      "mri-scan",
      "ct-scan",
      "lasik",
      "cataract-surgery",
      "knee-replacement",
      "hip-replacement",
      "rhinoplasty",
      "liposuction",
      "hair-transplant",
      "dental-implant",
      "dental-veneer",
      "ivf",
      "c-section",
      "cardiac-catheterization",
      "echocardiogram",
      "specialist-consultation",
      "health-checkup",
      "botox",
      "dermal-fillers",
      "acl-reconstruction",
    ],
    audience:
      "High-income residents, premium insurance holders, patients seeking VIP healthcare experiences, medical tourists choosing premium facilities, and anyone comparing what premium pricing delivers versus standard care.",
    tips: [
      "Premium hospitals in Dubai Healthcare City, Jumeirah, and Al Maryah Island (Abu Dhabi) typically charge at the top of the DOH tariff range (2.5-3x multiplier).",
      "What you get at a premium facility: private rooms, shorter wait times (often same-day), named consultant access, concierge services, and international accreditation (JCI).",
      "Premium insurance plans (annual premiums AED 15,000-40,000+) cover most of the cost — your co-pay at premium hospitals may be 0-10% for covered procedures.",
      "For cosmetic procedures (rhinoplasty, liposuction, hair transplant), premium facilities offer board-certified surgeons with international training and state-of-the-art equipment.",
      "VIP health checkup packages at premium hospitals cost AED 3,000-8,000 but include comprehensive blood work, cardiac screening, imaging, and specialist consultations in a single visit.",
      "Premium maternity packages (C-section at a private hospital) range from AED 30,000-70,000 and include a private suite, dedicated midwife, and neonatal care.",
      "International hospitals (Cleveland Clinic Abu Dhabi, Mayo Clinic Dubai) offer continuity of care with your medical records accessible across their global network.",
      "For elective surgeries, premium facilities often include follow-up consultations and rehabilitation in the package price — always ask what is bundled.",
    ],
    searchTerms: [
      "premium healthcare UAE",
      "VIP hospital Dubai",
      "best hospitals UAE cost",
      "premium medical treatment Dubai",
      "luxury healthcare Dubai",
      "private hospital prices UAE",
      "top hospital costs Abu Dhabi",
      "premium vs standard hospital UAE",
      "VIP health checkup Dubai",
      "best private hospital Abu Dhabi cost",
    ],
    sortOrder: 5,
  },
  {
    slug: "maternity-costs",
    name: "Complete Maternity & Pregnancy Costs in UAE",
    description:
      "A complete cost breakdown for pregnancy and maternity care in the UAE. From prenatal visits and screening tests through delivery (normal and C-section) to postnatal care and newborn paediatrics. Includes insurance maternity benefit analysis.",
    icon: "Baby",
    featuredProcedures: [
      "normal-delivery",
      "c-section",
      "ultrasound",
      "blood-test",
      "gp-consultation",
      "specialist-consultation",
      "health-checkup",
      "mammogram",
      "ivf",
      "vitamin-d-test",
      "thyroid-test",
      "ecg",
    ],
    audience:
      "Expecting parents, couples planning a pregnancy, women considering maternity hospitals, families budgeting for childbirth, and anyone comparing maternity care costs across UAE cities.",
    tips: [
      "Budget AED 15,000-50,000 for the total pregnancy journey (prenatal care + delivery + postnatal) depending on the facility type and delivery method.",
      "Normal vaginal delivery costs AED 8,000-25,000; C-section costs AED 15,000-45,000. Government hospitals are at the lower end of both ranges.",
      "Most insurance plans cover maternity after a 10-12 month waiting period. Check your policy before conceiving — some plans have maternity sub-limits of AED 10,000-15,000.",
      "Prenatal care costs approximately AED 5,000-12,000 over 9 months (monthly OB-GYN visits, blood tests, 3-4 ultrasounds, and screening tests).",
      "Ask your hospital for a maternity package that bundles prenatal visits, delivery, and hospital stay — packages are typically 15-25% cheaper than paying per visit.",
      "Government hospitals (Latifa Hospital in Dubai, Corniche Hospital in Abu Dhabi) offer the most affordable maternity care with experienced teams.",
      "NICU (neonatal intensive care) costs AED 3,000-10,000 per day if needed. Most insurance plans cover NICU when medically necessary.",
      "Paediatrician visits for your newborn (first year) cost AED 200-500 per visit — plan for 6-8 well-baby visits plus vaccinations in the first 12 months.",
    ],
    searchTerms: [
      "maternity costs UAE",
      "pregnancy cost Dubai",
      "delivery cost UAE",
      "C-section cost Dubai",
      "normal delivery cost Abu Dhabi",
      "maternity hospital prices UAE",
      "prenatal care cost Dubai",
      "childbirth cost UAE",
      "maternity insurance UAE",
      "best maternity hospital Dubai cost",
      "pregnancy budget UAE",
      "IVF cost UAE",
    ],
    sortOrder: 6,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getGuideBySlug(slug: string): PricingGuide | undefined {
  return PRICING_GUIDES.find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return PRICING_GUIDES.map((g) => g.slug);
}
