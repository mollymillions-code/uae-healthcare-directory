import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowRight,
  CheckCircle,
  Clock,
  FlaskConical,
  Droplets,
  Sun,
  Activity,
  Gauge,
  Filter,
  Heart,
  Zap,
  AlertTriangle,
  Baby,
  Search,
  ShieldAlert,
  TestTubes,
  Scan,
  Shield,
  Microscope,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_TESTS,
  LAB_TEST_PRICES,
  TEST_CATEGORIES,
  getLabsByCity,
  getPricesForLab,
  getPackagesForLab,
  formatPrice,
  getTestsByCategory,
  type TestCategory,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

// ─── Static Params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const params: { city: string; category: string }[] = [];

  for (const city of CITIES) {
    const homeLabSlugs = new Set(
      getLabsByCity(city.slug)
        .filter((l) => l.homeCollection)
        .map((l) => l.slug)
    );
    if (homeLabSlugs.size === 0) continue;

    for (const cat of TEST_CATEGORIES) {
      if (cat.slug === "imaging") continue;
      const catTests = new Set(
        LAB_TESTS.filter((t) => t.category === cat.slug).map((t) => t.slug)
      );
      const hasPrices = LAB_TEST_PRICES.some(
        (p) => homeLabSlugs.has(p.labSlug) && catTests.has(p.testSlug)
      );
      if (hasPrices) {
        params.push({ city: city.slug, category: cat.slug });
      }
    }
  }

  return params;
}

export const revalidate = 43200;

// ─── Category-Specific Content ────────────────────────────────────────────────

interface CategoryContent {
  /** What the category measures and why it matters */
  whatItMeasures: string;
  /** Why home collection is particularly convenient for this category */
  whyHomeConvenient: string;
  /** Preparation tips (fasting, timing, etc.) */
  prepTips: string;
  /** Specific fasting note (empty if not applicable) */
  fastingNote: string;
}

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "blood-routine": {
    whatItMeasures:
      "Routine blood tests — CBC, lipid profile, iron studies, ESR — form the foundation of annual health screening. They assess everything from anaemia and infection risk to cardiovascular health and chronic inflammation. The CBC alone measures 20+ parameters including red cell count, white cell differential, haemoglobin, and platelet levels. A lipid panel measures total cholesterol, LDL, HDL, triglycerides, and VLDL — the core cardiovascular risk markers.",
    whyHomeConvenient:
      "Routine blood work is the category most naturally suited to home collection. Most people order these tests annually or for chronic disease monitoring, which means they need fasting draws early in the morning. Home collection eliminates the need to drive to a lab while fasting, navigate parking, or wait in a queue. For patients monitoring cholesterol, anaemia, or inflammation markers on a regular basis, the convenience of home collection significantly increases compliance with monitoring schedules.",
    prepTips:
      "Fasting blood tests in this category (lipid profile, fasting glucose, iron studies) require 8–12 hours of fasting. Book a 7–9 AM slot and stop eating by 9–11 PM the night before. Water, black coffee (no milk or sugar), and essential medications are generally acceptable. CBC does not require fasting — it can be drawn at any time. Drink at least 500 ml of water before the draw to make veins more accessible.",
    fastingNote:
      "Lipid profile and iron studies require 8–12 hours of fasting. CBC, ESR, and CRP do not require fasting.",
  },
  "vitamins-minerals": {
    whatItMeasures:
      "Vitamin and mineral testing measures micronutrient levels that are often suboptimal in the UAE population despite a sunny climate and nutrient-rich diet. Vitamin D deficiency affects an estimated 60–80% of UAE residents due to indoor lifestyles, sunscreen use, and clothing coverage. Vitamin B12 deficiency is prevalent among vegetarians, vegans, and those on long-term metformin or proton pump inhibitor therapy. Magnesium, calcium, and folate are frequently checked alongside vitamin D and B12 as part of a fatigue or metabolic workup.",
    whyHomeConvenient:
      "Vitamin and mineral tests do not require fasting in most cases, which means the home collection visit can be scheduled at any convenient time — morning, afternoon, or early evening. For patients with chronic fatigue, these tests are often ordered together as a panel. Home collection makes it easy to combine them all in a single visit without multiple trips to the lab.",
    prepTips:
      "Most vitamin and mineral tests do not require fasting — Vitamin D, B12, folate, calcium, and magnesium can all be drawn at any time of day. Drink sufficient water before the draw. If your doctor has ordered a morning cortisol test alongside your vitamins, draw must be before 9 AM. Tell the phlebotomist which supplements you are taking — some labs prefer a note about B12 supplementation for accurate result interpretation.",
    fastingNote:
      "No fasting required for Vitamin D, B12, folate, calcium, or magnesium. These can be drawn at any time of day.",
  },
  hormones: {
    whatItMeasures:
      "Hormone testing measures the chemical messengers that regulate metabolism, reproduction, mood, energy, and stress response. Common panels include testosterone (male and female), cortisol (adrenal function and stress), prolactin (pituitary function and fertility), and estradiol (female reproductive health and menopause evaluation). Hormones are among the most time-sensitive of all blood tests — cortisol, testosterone, and LH must be drawn in the morning when levels are at their circadian peak for accurate interpretation.",
    whyHomeConvenient:
      "Morning-only hormone tests are perhaps the most compelling use case for home collection. Testosterone, cortisol, and LH must be drawn before 9 AM for clinically meaningful results — a requirement that is difficult to meet with a walk-in visit during a working week. A home draw at 7 or 8 AM eliminates the rush entirely. For women tracking follicular-phase hormones (FSH, LH, estradiol), being able to schedule the draw on the correct cycle day without rearranging work is a significant convenience.",
    prepTips:
      "Cortisol and testosterone must be drawn in the morning — ideally 7–9 AM — when levels naturally peak. Schedule your home collection for this window. Do not eat before a testosterone or insulin draw (8-hour fast required). For female cycle-dependent tests (FSH, LH, estradiol, progesterone), confirm with your doctor which cycle day is appropriate before booking. Prolactin requires the patient to be calm and avoid exercise for at least 1 hour before the draw.",
    fastingNote:
      "Testosterone and insulin require 8-hour fasting. Cortisol and prolactin do not require fasting but have strict timing requirements (morning draw).",
  },
  diabetes: {
    whatItMeasures:
      "Diabetes tests measure blood sugar control and insulin response. Fasting blood glucose is the primary screening test for Type 2 diabetes and pre-diabetes. HbA1c (glycated haemoglobin) provides a 2–3 month average blood sugar reading — the gold standard for diabetes monitoring. Fasting insulin assesses insulin resistance, which often precedes Type 2 diabetes by years. Given the UAE's high diabetes prevalence (estimated 17–19% of adults), these tests are among the most frequently ordered in the country.",
    whyHomeConvenient:
      "Diabetes monitoring tests are ordered repeatedly — every 3–6 months for diagnosed patients, annually for at-risk individuals. Home collection means patients with diabetes do not need to travel to a lab after an overnight fast, which is particularly beneficial for those with mobility issues or who live far from their preferred lab. For fasting glucose, the home visit can be scheduled immediately after waking, which is the ideal physiological state for the test.",
    prepTips:
      "Fasting blood glucose and fasting insulin require 8–12 hours of complete fasting (no food or caloric beverages). HbA1c does not require fasting and can be drawn at any time — it measures the past 2–3 months, so recent meals do not affect the result. Book fasting glucose and insulin for an early morning slot (7–9 AM). Take your regular diabetes medications only after the blood draw unless your doctor advises otherwise — some medications alter glucose readings.",
    fastingNote:
      "Fasting glucose and fasting insulin require 8–12 hours of fasting. HbA1c does not require fasting.",
  },
  liver: {
    whatItMeasures:
      "Liver function tests (LFTs) measure enzymes (ALT, AST, ALP, GGT), proteins (albumin, total protein), and bilirubin to assess liver health, detect fatty liver disease, monitor medication hepatotoxicity, and screen for viral hepatitis. The UAE has a significant burden of non-alcoholic fatty liver disease (NAFLD), driven by high rates of obesity, Type 2 diabetes, and sedentary lifestyles. Hepatitis B surface antigen testing is part of the mandatory UAE visa medical and is also offered as a standalone test.",
    whyHomeConvenient:
      "LFT monitoring is often ordered on a regular schedule for patients on medications (statins, methotrexate, antiretrovirals) or those managing chronic liver conditions. Home collection makes it simple to maintain monitoring frequency without the inconvenience of regular lab visits. For early-morning fasting LFT draws, the home visit eliminates the practical challenge of reaching a lab before breaking fast.",
    prepTips:
      "Standard LFTs require 8–12 hours of fasting for accurate results — especially for bilirubin and GGT, which can be transiently elevated after eating. Hepatitis B antigen and antibody tests do not require fasting. Avoid alcohol for 24–48 hours before an LFT. If you take hepatotoxic medications (statins, NSAIDs, antibiotics), do not stop them before testing unless your doctor instructs — the test is designed to capture your current liver status on medication.",
    fastingNote:
      "LFT (ALT, AST, ALP, GGT, bilirubin) requires 8–12 hours of fasting. Hepatitis B antigen testing does not require fasting.",
  },
  kidney: {
    whatItMeasures:
      "Kidney function tests (KFT/RFT) measure creatinine, blood urea nitrogen (BUN), eGFR, uric acid, and electrolytes to assess how well the kidneys are filtering waste. Early detection of chronic kidney disease (CKD) is critical because symptoms appear only when 50–70% of kidney function is already lost. Uric acid is also used to assess gout risk and kidney stone likelihood. Patients with diabetes, hypertension, or family history of kidney disease are typically monitored every 6–12 months.",
    whyHomeConvenient:
      "Regular kidney function monitoring for patients with diabetes or hypertension is a compelling use case for home collection — particularly for elderly patients or those with limited mobility for whom frequent lab visits are burdensome. Morning fasting draws for creatinine and BUN align naturally with home collection booking windows.",
    prepTips:
      "KFT requires an 8-hour fast for accurate creatinine and urea readings. Avoid intense exercise for 24 hours before the draw — strenuous activity raises creatinine transiently. Stay well hydrated: drink 500 ml of water the evening before and 300 ml on the morning of the draw. For uric acid testing, avoid purine-rich foods (red meat, organ meats, shellfish) and alcohol for 24–48 hours prior.",
    fastingNote:
      "KFT (creatinine, BUN, eGFR, electrolytes) requires an 8-hour fast. Uric acid does not require fasting.",
  },
  cardiac: {
    whatItMeasures:
      "Cardiac blood tests assess heart health through inflammation markers (hs-CRP), heart failure indicators (BNP, NT-proBNP), and acute myocardial injury markers (high-sensitivity troponin). hs-CRP is a key component of cardiovascular risk scores — when elevated in the absence of acute infection, it reflects arterial inflammation associated with atherosclerosis. Troponin measurement at home is typically for chronic cardiac monitoring rather than acute chest pain, which requires an emergency department.",
    whyHomeConvenient:
      "For patients with chronic cardiovascular conditions requiring regular biomarker monitoring, home collection removes travel stress — which itself can elevate CRP and blood pressure. Patients post-cardiac event who are recovering at home benefit particularly from a home phlebotomy service for their monitoring labs.",
    prepTips:
      "Most cardiac blood tests (hs-CRP, BNP, troponin) do not require fasting. If you are also ordering a lipid profile at the same visit (which most cardiac patients do), plan for the 8–12 hour fast. Avoid strenuous exercise for 24 hours before a hs-CRP draw, as vigorous exercise temporarily raises CRP. Rest quietly for 5–10 minutes before the blood draw. If you are experiencing acute chest pain, call emergency services — do not wait for a home collection visit.",
    fastingNote:
      "hs-CRP, BNP, and troponin do not require fasting. If ordered alongside a lipid profile, the 8–12 hour fasting requirement applies to the whole visit.",
  },
  thyroid: {
    whatItMeasures:
      "Thyroid tests measure TSH (thyroid stimulating hormone) as the primary screening test, with Free T3 and Free T4 added for a complete thyroid panel when TSH is abnormal. Thyroid disorders are among the most common endocrine conditions globally — hypothyroidism (underactive thyroid) affects an estimated 5–10% of adults, presenting as fatigue, weight gain, and hair loss. Hyperthyroidism presents with palpitations, heat intolerance, and weight loss. Thyroid antibodies (TPO, TgAb) are added when autoimmune thyroid disease (Hashimoto's or Graves') is suspected.",
    whyHomeConvenient:
      "Thyroid tests are among the most frequently repeated diagnostic tests — patients on levothyroxine or carbimazole need TSH monitoring every 6–12 weeks during dose titration. Home collection dramatically reduces the friction of this frequent monitoring cycle. Unlike many hormone tests, TSH can be drawn at any time of day without fasting, making home collection even more flexible.",
    prepTips:
      "Thyroid tests do not require fasting — TSH, FT3, and FT4 can be drawn at any time of day. If you are taking levothyroxine (Synthroid), take your morning dose after the blood draw, not before — this avoids a temporary spike in free T4 that can skew results. If you are not yet on medication, take the test at the same time of day on repeat visits for consistency. Biotin (vitamin B7) supplements can falsely suppress or elevate thyroid test results — stop high-dose biotin at least 48 hours before the draw.",
    fastingNote:
      "No fasting required for TSH, FT3, or FT4. Take levothyroxine after the draw, not before.",
  },
  allergy: {
    whatItMeasures:
      "Allergy blood tests measure IgE antibodies to identify immune responses to specific allergens. Total IgE gives a general indication of allergic activity; specific IgE testing (RAST, ImmunoCAP) identifies reactions to individual allergens — house dust mite, cat dander, grass pollen, specific foods. Food intolerance panels using IgG antibodies (96-food or 200-food panels) test for delayed-onset food sensitivities distinct from classic IgE-mediated allergies. Allergy testing in the UAE is high-volume given desert dust, mould, and a population with diverse global dietary exposures.",
    whyHomeConvenient:
      "Allergy and intolerance testing often involves large multi-panel tests requiring a single blood draw. Home collection is ideal for children with needle anxiety — a calm home environment is less distressing than a clinical lab. For adults with severe dust mite or pollen allergies who find travelling to a lab difficult during high-pollen periods, home collection avoids symptom-triggering exposure.",
    prepTips:
      "Most allergy blood tests do not require fasting. For IgE allergy testing, the draw can happen at any time. Avoid taking antihistamines for 3–5 days before the test if possible — they can suppress IgE levels slightly. However, do not stop asthma medications. Food intolerance (IgG) panels are most informative when drawn before a significant dietary change — test your current diet, not an elimination diet you have already started.",
    fastingNote:
      "No fasting required for allergy and intolerance testing. Avoid antihistamines for 3–5 days if possible.",
  },
  fertility: {
    whatItMeasures:
      "Fertility blood tests assess reproductive hormone levels in both men and women. AMH (anti-Müllerian hormone) is the primary marker of ovarian reserve — the remaining egg supply — and is the first test most fertility clinics order. FSH, LH, and estradiol reflect ovarian and pituitary function and are cycle-day-dependent in women. Testosterone and FSH in men assess testicular function. Prolactin is elevated in certain pituitary conditions that affect fertility. In the UAE, fertility testing has high uptake among couples delaying family planning and expat women approaching their mid-30s.",
    whyHomeConvenient:
      "Fertility testing is often emotionally sensitive. Being able to have blood drawn in the privacy of your own home, on the specific cycle day required, without taking time off work or navigating a clinic environment, is a significant advantage. AMH in particular can be drawn on any cycle day, making it easily schedulable via home collection at any convenient time.",
    prepTips:
      "AMH can be drawn on any cycle day at any time — no fasting or timing requirements. FSH, LH, and estradiol should be drawn on cycle day 2, 3, or 4 (the early follicular phase) unless your doctor specifies otherwise. Testosterone is a morning test (7–9 AM) regardless of cycle. Prolactin should be drawn 60–90 minutes after waking to allow the normal post-waking peak to subside. Avoid vigorous exercise and sexual activity for 24 hours before a prolactin draw. Confirm cycle day requirements with your fertility specialist before booking.",
    fastingNote:
      "No fasting required for AMH, FSH, LH, estradiol, or prolactin. Testosterone requires 8-hour fasting and morning draw (before 9 AM).",
  },
  "cancer-screening": {
    whatItMeasures:
      "Cancer screening blood tests detect tumor markers — proteins or biomarkers elevated in the presence of certain cancers. PSA (prostate-specific antigen) screens for prostate cancer in men over 50. CA-125 monitors for ovarian cancer recurrence or is used for pelvic mass evaluation. CEA (carcinoembryonic antigen) monitors colorectal cancer treatment response. These tests are not definitive cancer diagnoses — they are screening and monitoring tools requiring clinical correlation by a specialist.",
    whyHomeConvenient:
      "For patients under long-term cancer surveillance monitoring PSA or CEA on a regular schedule post-treatment, home collection removes a burdensome clinic trip from their follow-up calendar. Elderly patients with mobility limitations, or those managing active treatment side effects, benefit particularly from home phlebotomy for their regular marker checks.",
    prepTips:
      "PSA testing does not require fasting but does require 48 hours without ejaculation and 24 hours without strenuous exercise, cycling, or direct prostate pressure (including DRE). These activities can transiently elevate PSA. CA-125 and CEA do not require fasting or any specific preparation. All tumor markers should be drawn at the same time of day and ideally at the same lab on repeat monitoring to allow accurate trend analysis — switching labs between draws can introduce assay variability.",
    fastingNote:
      "No fasting required. Avoid ejaculation and cycling for 48 hours before PSA. Draw CA-125 and CEA at the same time of day as previous tests for trend consistency.",
  },
  "std-screening": {
    whatItMeasures:
      "STD screening blood tests detect sexually transmitted infections including HIV (4th generation antigen/antibody), syphilis (VDRL/RPR), Hepatitis B, and Hepatitis C. These tests are part of the mandatory UAE visa medical and are also available for routine personal screening. Fourth-generation HIV tests detect both p24 antigen and antibodies — significantly shortening the window period compared to older antibody-only tests.",
    whyHomeConvenient:
      "Privacy is the primary driver for at-home STD testing. Receiving a blood draw at home for HIV, syphilis, and hepatitis screening avoids potential visibility in a lab waiting room. All results are delivered digitally and confidentially. Home collection for STD panels is particularly popular among expats and those undergoing pre-marital health screening, which is required for UAE nationals marrying under DHA-mandated premarital counselling programmes.",
    prepTips:
      "HIV, syphilis, and hepatitis B/C tests do not require fasting. They can be drawn at any time of day with no dietary preparation. Results are fully confidential and delivered via secure digital channels. If you are testing as part of a UAE visa medical, confirm that the provider issues DOH- or DHA-stamped reports in the format required by the issuing authority.",
    fastingNote:
      "No fasting required for any STD screening blood test.",
  },
  "urine-stool": {
    whatItMeasures:
      "Urine and stool tests complement blood work in routine health screening. Urinalysis checks for UTI markers, protein (kidney damage indicator), glucose (diabetes screening), blood, ketones, and pH. Stool analysis detects parasites, bacteria, occult blood, and digestive function markers. Both are commonly ordered alongside blood panels in comprehensive check-ups and for specific symptom investigation.",
    whyHomeConvenient:
      "Urine and stool samples are self-collected, making them uniquely suited to home collection. The nurse arrives with the appropriate sterile containers. The patient provides the sample in the privacy of their own bathroom, with the nurse ensuring correct collection technique and labelling. There is no need to transport an already-collected sample to a lab — the nurse handles the chain of custody.",
    prepTips:
      "For urinalysis, collect a midstream urine sample (discard the first few seconds of flow) in the sterile container provided by the nurse. First-morning urine is preferred as it is the most concentrated. For stool analysis, avoid antacids, iron supplements, and barium for 3–5 days before collection if possible. If you are testing for occult blood, avoid red meat for 3 days before the draw. Do not mix urine with stool. Samples are sealed and labelled by the nurse immediately after collection.",
    fastingNote:
      "No fasting required for urinalysis or stool analysis.",
  },
};

// Regulator label per city
function getCityRegulator(citySlug: string): { abbrev: string; full: string } {
  if (citySlug === "dubai") return { abbrev: "DHA", full: "Dubai Health Authority (DHA)" };
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return { abbrev: "DOH", full: "Department of Health Abu Dhabi (DOH)" };
  return { abbrev: "MOHAP", full: "Ministry of Health and Prevention (MOHAP)" };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { city: string; category: string };
}): Metadata {
  const city = CITIES.find((c) => c.slug === params.city);
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!city || !cat) return { title: "Not Found" };

  const base = getBaseUrl();
  const homeLabSlugs = new Set(
    getLabsByCity(city.slug)
      .filter((l) => l.homeCollection)
      .map((l) => l.slug)
  );
  const catTests = new Set(
    LAB_TESTS.filter((t) => t.category === cat.slug).map((t) => t.slug)
  );
  const relevantPrices = LAB_TEST_PRICES.filter(
    (p) => homeLabSlugs.has(p.labSlug) && catTests.has(p.testSlug)
  );
  const labsCount = new Set(relevantPrices.map((p) => p.labSlug)).size;
  const minPrice =
    relevantPrices.length > 0
      ? Math.min(...relevantPrices.map((p) => p.price))
      : null;

  return {
    title: `At-Home ${cat.name} Tests in ${city.name} — Compare ${labsCount} Labs | UAE Lab Tests`,
    description:
      `Compare at-home ${cat.name.toLowerCase()} tests in ${city.name}. ` +
      `${labsCount} lab${labsCount !== 1 ? "s" : ""} offer home collection for ${cat.name.toLowerCase()} blood work. ` +
      `${minPrice ? `From AED ${minPrice}. ` : ""}` +
      `Book online, nurse visits your home, digital results within 24h.`,
    alternates: {
      canonical: `${base}/labs/home-collection/${city.slug}/${cat.slug}`,
    },
    openGraph: {
      title: `At-Home ${cat.name} Tests in ${city.name} — ${labsCount} Labs`,
      description: `${labsCount} labs offer home blood test collection for ${cat.name.toLowerCase()} in ${city.name}. ${minPrice ? `From AED ${minPrice}.` : ""}`,
      url: `${base}/labs/home-collection/${city.slug}/${cat.slug}`,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomeCollectionCityCategoryPage({
  params,
}: {
  params: { city: string; category: string };
}) {
  const city = CITIES.find((c) => c.slug === params.city);
  const cat = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!city || !cat) notFound();

  const base = getBaseUrl();
  const regulator = getCityRegulator(city.slug);

  // Home-collection labs in this city
  const homeCollectionLabs = getLabsByCity(city.slug).filter(
    (l) => l.homeCollection
  );
  const homeLabSlugs = new Set(homeCollectionLabs.map((l) => l.slug));

  // Tests in this category
  const catTests = LAB_TESTS.filter((t) => t.category === cat.slug);
  const catTestSlugs = new Set(catTests.map((t) => t.slug));

  // Prices from home-collection labs for this category's tests
  const relevantPrices = LAB_TEST_PRICES.filter(
    (p) => homeLabSlugs.has(p.labSlug) && catTestSlugs.has(p.testSlug)
  );

  if (relevantPrices.length === 0) notFound();

  // Labs that have prices for at least one test in this category in this city
  const labsOfferingCategory = homeCollectionLabs.filter((lab) =>
    relevantPrices.some((p) => p.labSlug === lab.slug)
  );

  const freeCollectionLabs = labsOfferingCategory.filter(
    (l) => l.homeCollectionFee === 0
  );

  // Per-test summaries
  const testsWithHomePrices = catTests
    .map((test) => {
      const testPrices = relevantPrices.filter((p) => p.testSlug === test.slug);
      if (testPrices.length === 0) return null;
      const minPrice = Math.min(...testPrices.map((p) => p.price));
      const maxPrice = Math.max(...testPrices.map((p) => p.price));
      const labCount = testPrices.length;
      return { test, minPrice, maxPrice, labCount };
    })
    .filter(Boolean) as {
      test: (typeof catTests)[number];
      minPrice: number;
      maxPrice: number;
      labCount: number;
    }[];

  const overallMinPrice =
    testsWithHomePrices.length > 0
      ? Math.min(...testsWithHomePrices.map((t) => t.minPrice))
      : null;

  // Other categories available at home in this city (for cross-links)
  const otherCategories = TEST_CATEGORIES.filter((otherCat) => {
    if (otherCat.slug === cat.slug || otherCat.slug === "imaging") return false;
    const otherCatTestSlugs = new Set(
      LAB_TESTS.filter((t) => t.category === otherCat.slug).map((t) => t.slug)
    );
    return relevantPrices.some((p) =>
      otherCatTestSlugs.has(p.testSlug)
    ) || LAB_TEST_PRICES.some(
      (p) => homeLabSlugs.has(p.labSlug) && otherCatTestSlugs.has(p.testSlug)
    );
  });

  const content: CategoryContent = CATEGORY_CONTENT[cat.slug] ?? {
    whatItMeasures: `${cat.name} tests measure key biomarkers related to ${cat.name.toLowerCase()} health. These tests are widely available from home-collection labs in ${city.name}.`,
    whyHomeConvenient: `Home collection for ${cat.name.toLowerCase()} tests removes the need to travel to a lab. A ${regulator.abbrev}-licensed nurse visits your location, draws the sample, and results are delivered digitally within 24 hours.`,
    prepTips: "Confirm any fasting or timing requirements with your doctor when the test is ordered. Drink water before the draw to improve venous access.",
    fastingNote: "Check with your doctor whether fasting is required for your specific tests.",
  };

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Home Collection", url: `${base}/labs/home-collection` },
    { name: city.name, url: `${base}/labs/home-collection/${city.slug}` },
    { name: cat.name },
  ];

  const faqs = [
    {
      question: `How much does at-home ${cat.name.toLowerCase()} testing cost in ${city.name}?`,
      answer:
        `At-home ${cat.name.toLowerCase()} tests in ${city.name} start from ` +
        `${overallMinPrice ? `AED ${overallMinPrice}` : "competitive rates"} at home-collection labs. ` +
        `${freeCollectionLabs.length > 0 ? `${freeCollectionLabs.map((l) => l.name).join(", ")} offer free home collection — you pay only the test price. ` : ""}` +
        `Test prices are generally similar to walk-in rates; the main cost variable is the collection fee (AED 0–${Math.max(...labsOfferingCategory.map((l) => l.homeCollectionFee))} depending on the lab).`,
    },
    {
      question: `Which labs offer ${cat.name.toLowerCase()} home collection in ${city.name}?`,
      answer:
        `${labsOfferingCategory.length} lab${labsOfferingCategory.length !== 1 ? "s" : ""} offer at-home ${cat.name.toLowerCase()} testing in ${city.name}: ` +
        `${labsOfferingCategory.map((l) => l.name).join(", ")}. ` +
        `All are licensed under ${regulator.full}.`,
    },
    {
      question: `Do I need to fast for ${cat.name.toLowerCase()} home blood tests?`,
      answer: content.fastingNote,
    },
    {
      question: `How long do ${cat.name.toLowerCase()} test results take after home collection in ${city.name}?`,
      answer:
        `Turnaround for ${cat.name.toLowerCase()} tests ranges from ` +
        `${Math.min(...labsOfferingCategory.map((l) => l.turnaroundHours))}h ` +
        `to ${Math.max(...labsOfferingCategory.map((l) => l.turnaroundHours))}h ` +
        `depending on the lab. Results are delivered via secure app, email, or WhatsApp PDF. ` +
        `${labsOfferingCategory.find((l) => l.turnaroundHours === Math.min(...labsOfferingCategory.map((x) => x.turnaroundHours)))?.name} is the fastest at ${Math.min(...labsOfferingCategory.map((l) => l.turnaroundHours))}h.`,
    },
  ];

  // Schema: CollectionPage + ItemList of MedicalTest with AggregateOffer
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `At-Home ${cat.name} Tests in ${city.name}`,
    description: `Compare ${labsOfferingCategory.length} labs offering home collection for ${cat.name.toLowerCase()} tests in ${city.name}. ${freeCollectionLabs.length} free collection. ${regulator.abbrev}-licensed nurses, digital results.`,
    url: `${base}/labs/home-collection/${city.slug}/${cat.slug}`,
    numberOfItems: testsWithHomePrices.length,
    itemListElement: testsWithHomePrices.map(
      ({ test, minPrice, maxPrice, labCount }, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "MedicalTest",
          name: test.name,
          url: `${base}/labs/test/${test.slug}`,
          description: test.description,
          usesDevice: {
            "@type": "MedicalDevice",
            name: "Blood collection vacutainer",
          },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "AED",
            lowPrice: minPrice,
            highPrice: maxPrice,
            offerCount: labCount,
            availability: "https://schema.org/InStock",
          },
        },
      })
    ),
  };

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={collectionPageSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Home Collection", href: "/labs/home-collection" },
          { label: city.name, href: `/labs/home-collection/${city.slug}` },
          { label: cat.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            At-Home {cat.name} Tests in {city.name} — Compare {labsOfferingCategory.length} Lab{labsOfferingCategory.length !== 1 ? "s" : ""}
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-3">{content.whatItMeasures}</p>
          <p className="text-muted leading-relaxed">{content.whyHomeConvenient}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: testsWithHomePrices.length.toString(),
              label: `${cat.name} tests at home in ${city.name}`,
            },
            {
              value: labsOfferingCategory.length.toString(),
              label: "Labs offering home collection",
            },
            {
              value: overallMinPrice ? `AED ${overallMinPrice}` : "—",
              label: "Cheapest home price",
            },
            {
              value: freeCollectionLabs.length.toString(),
              label: "Free home collection",
            },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-light-50 p-4 text-center border border-light-200"
            >
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All tests in this category available at home */}
      <div className="section-header">
        <h2>
          All {cat.name} Tests Available at Home in {city.name}
        </h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          Prices below are from home-collection labs in {city.name} only.
          Click any test for a full price comparison across all UAE labs.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {testsWithHomePrices.map(({ test, minPrice, maxPrice, labCount }) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                {test.description.split(".")[0]}.
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                {test.fastingRequired ? (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 font-medium">
                    Fasting required
                  </span>
                ) : (
                  <span className="bg-light-50 text-muted border border-light-200 px-1.5 py-0.5">
                    No fasting
                  </span>
                )}
                <span className="text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {test.turnaroundHours}h
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-accent">{formatPrice(minPrice)}</p>
              {minPrice !== maxPrice && (
                <p className="text-[10px] text-muted">– {formatPrice(maxPrice)}</p>
              )}
              <p className="text-[10px] text-muted">{labCount} labs</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Labs offering this category at home */}
      <div className="section-header">
        <h2>
          Labs Offering {cat.name} Home Collection in {city.name}
        </h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          All {labsOfferingCategory.length} lab{labsOfferingCategory.length !== 1 ? "s" : ""} below
          are licensed under {regulator.full} and offer home
          sample collection for {cat.name.toLowerCase()} tests in {city.name}.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {labsOfferingCategory
          .sort((a, b) => a.homeCollectionFee - b.homeCollectionFee)
          .map((lab) => {
            const prices = getPricesForLab(lab.slug);
            const packages = getPackagesForLab(lab.slug);
            const cheapest =
              prices.length > 0
                ? Math.min(...prices.map((p) => p.price))
                : undefined;
            return (
              <LabCard
                key={lab.slug}
                lab={lab}
                testCount={prices.length}
                packageCount={packages.length}
                cheapestFrom={cheapest}
              />
            );
          })}
      </div>

      {/* Preparation tips */}
      <div className="section-header">
        <h2>
          How to Prepare for Home {cat.name} Testing in {city.name}
        </h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-4">
          {content.prepTips}
        </p>
        {content.fastingNote && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <Microscope className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Fasting note: </strong>
                {content.fastingNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div className="bg-light-50 border border-light-200 p-5 mb-10">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              {regulator.full} oversight
            </p>
            <p className="text-xs text-muted leading-relaxed">
              All {labsOfferingCategory.length} lab{labsOfferingCategory.length !== 1 ? "s" : ""} offering {cat.name.toLowerCase()} home collection in {city.name} operate under {regulator.full} licensing. Sample collection follows {regulator.abbrev} clinical laboratory standards. Samples are transported in validated cold-chain containers and processed in the same accredited facilities used for walk-in patients. Results carry the same clinical weight as tests drawn at the lab.
            </p>
          </div>
        </div>
      </div>

      {/* Other categories available at home */}
      {otherCategories.length > 0 && (
        <>
          <div className="section-header">
            <h2>Other Test Categories Available at Home in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {otherCategories.slice(0, 8).map((otherCat) => {
              const otherCatTestSlugs = new Set(
                LAB_TESTS.filter((t) => t.category === otherCat.slug).map(
                  (t) => t.slug
                )
              );
              const otherCount = new Set(
                LAB_TEST_PRICES.filter(
                  (p) =>
                    homeLabSlugs.has(p.labSlug) &&
                    otherCatTestSlugs.has(p.testSlug)
                ).map((p) => p.testSlug)
              ).size;
              if (otherCount === 0) return null;
              return (
                <Link
                  key={otherCat.slug}
                  href={`/labs/home-collection/${city.slug}/${otherCat.slug}`}
                  className="border border-light-200 p-3 hover:border-accent transition-colors group"
                >
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                    {otherCat.name}
                  </h3>
                  <p className="text-[11px] text-muted mt-1">
                    {otherCount} test{otherCount !== 1 ? "s" : ""} at home
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-accent text-xs font-medium">
                    <span>Compare</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`At-Home ${cat.name} Tests in ${city.name} — FAQs`}
      />

      {/* Cross-links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-8">
        <Link
          href={`/labs/home-collection/${city.slug}`}
          className="border border-light-200 p-4 hover:border-accent transition-colors group flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
              All home collection labs in {city.name}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {homeCollectionLabs.length} labs · all categories
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
        </Link>
        <Link
          href={`/labs/category/${cat.slug}`}
          className="border border-light-200 p-4 hover:border-accent transition-colors group flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
              {cat.name} tests — all UAE labs
            </p>
            <p className="text-xs text-muted mt-0.5">
              Walk-in and home collection · all cities
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Pricing information is sourced from
          publicly available lab websites and aggregator platforms (2024–2025).
          Actual prices may vary by location, time of day, insurance coverage,
          and promotional offers. Preparation instructions are general guidelines
          — always follow your doctor&apos;s specific instructions for your test
          order. This page is for informational purposes only and does not
          constitute medical advice. All providers listed are licensed under{" "}
          {regulator.full}. Data last verified March 2026.
        </p>
      </div>
    </div>
  );
}
