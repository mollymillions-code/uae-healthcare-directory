import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowRight, Home, Calculator } from "lucide-react";
import {
  LAB_PROFILES,
  LAB_TESTS,
  LAB_TEST_PRICES,
  getLabTest,
  getLabProfile,
  getLabsByCity,
  getPricesForTestInCity,
  getPriceRangeInCity,
  formatPrice,
  getPricesForLab,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

// ─── Revalidation ──────────────────────────────────────────────────────────────

export const revalidate = 43200;

// ─── Condition Data ────────────────────────────────────────────────────────────

interface ConditionDef {
  slug: string;
  name: string;
  description: string;
  testSlugs: string[];
  /** City-specific health context blurbs */
  cityContext: Record<string, string>;
}

const CONDITIONS: Record<string, ConditionDef> = {
  pcos: {
    slug: "pcos",
    name: "PCOS (Polycystic Ovary Syndrome)",
    description:
      "Polycystic ovary syndrome is a hormonal disorder common among women of reproductive age. Diagnosis typically requires a combination of blood tests measuring androgens, insulin, glucose levels, and reproductive hormones. Early detection helps manage symptoms such as irregular periods, weight gain, acne, and fertility challenges.",
    testSlugs: [
      "testosterone",
      "insulin-fasting",
      "fasting-glucose",
      "hba1c",
      "amh",
      "fsh",
      "estradiol",
      "thyroid-panel",
      "lipid-profile",
    ],
    cityContext: {
      dubai:
        "Dubai Healthcare City and several DHA-licensed labs across Jumeirah, Deira, and Al Barsha offer comprehensive PCOS panels. Many clinics in Dubai bundle hormonal and metabolic tests into a single PCOS screening package.",
      "abu-dhabi":
        "Abu Dhabi has DOH-regulated labs on Al Reem Island and in Khalifa City offering full PCOS assessments. Women in Abu Dhabi can access integrated PCOS care combining lab work with endocrinology consultations.",
      sharjah:
        "Sharjah's labs in Al Nahda and Al Majaz provide affordable PCOS test panels. The proximity to Dubai means patients can compare prices across both emirates easily.",
      ajman:
        "Labs in Ajman offer PCOS screening packages at competitive prices. Patients often benefit from lower overhead costs in the Northern Emirates.",
      "ras-al-khaimah":
        "Ras Al Khaimah has MOHAP-licensed facilities providing PCOS blood work. Home collection services make testing more convenient for residents across the emirate.",
      fujairah:
        "Fujairah residents can access PCOS testing through local MOHAP-licensed labs, with some chain labs offering home sample collection along the eastern coast.",
      "umm-al-quwain":
        "Umm Al Quwain residents have access to PCOS testing through MOHAP-regulated labs. Home collection services extend coverage across the emirate.",
      "al-ain":
        "Al Ain has several DOH-licensed labs near Tawam Hospital and in Al Jimi that offer hormonal panels for PCOS diagnosis at prices generally lower than Abu Dhabi city.",
    },
  },
  diabetes: {
    slug: "diabetes",
    name: "Diabetes",
    description:
      "Diabetes screening measures how your body processes blood sugar. Key markers include fasting glucose, HbA1c (a 3-month average), and insulin levels. The UAE has one of the highest diabetes prevalence rates in the region, making regular screening critical for early intervention and management.",
    testSlugs: [
      "fasting-glucose",
      "hba1c",
      "insulin-fasting",
      "kft",
      "lipid-profile",
      "urinalysis",
    ],
    cityContext: {
      dubai:
        "Dubai has extensive DHA-licensed diabetes screening programs. Labs in Healthcare City, Al Barsha, and Deira offer walk-in glucose and HbA1c tests, often with same-day results.",
      "abu-dhabi":
        "Abu Dhabi's DOH encourages annual diabetes screening for residents over 30. Labs across the capital, from Corniche to Khalifa City, offer comprehensive metabolic panels.",
      sharjah:
        "Sharjah's affordable lab network makes diabetes screening accessible. Several labs in Al Nahda and Muwaileh offer budget-friendly glucose and HbA1c packages.",
      ajman:
        "Ajman's labs provide competitively priced diabetes panels. The emirate's MOHAP-regulated facilities offer fasting glucose and HbA1c testing with quick turnaround.",
      "ras-al-khaimah":
        "Ras Al Khaimah has MOHAP-licensed labs offering diabetes screening at lower price points than Dubai and Abu Dhabi, with home collection available in most areas.",
      fujairah:
        "Fujairah labs offer essential diabetes screening tests. Residents on the eastern coast can access fasting glucose and HbA1c through local facilities.",
      "umm-al-quwain":
        "Umm Al Quwain residents can access diabetes screening through MOHAP-regulated labs, with home collection extending access across the emirate.",
      "al-ain":
        "Al Ain, home to a significant diabetes research community at UAE University, has DOH-licensed labs offering comprehensive diabetes panels near Tawam Hospital and central areas.",
    },
  },
  anemia: {
    slug: "anemia",
    name: "Anemia",
    description:
      "Anemia testing evaluates red blood cell levels, iron stores, and related vitamins. A complete blood count (CBC) is the primary screening tool, supplemented by iron studies, vitamin B12, and folate levels. Anemia is common in the UAE due to dietary factors and the high prevalence of thalassemia trait.",
    testSlugs: ["cbc", "iron-studies", "vitamin-b12", "folate"],
    cityContext: {
      dubai:
        "Dubai labs offer rapid CBC and iron panels, often with results within hours. DHA-licensed labs in Deira and Al Barsha are popular for walk-in blood work.",
      "abu-dhabi":
        "Abu Dhabi's DOH-regulated labs provide comprehensive anemia panels. The emirate's thalassemia screening program means labs are well-equipped for detailed blood analysis.",
      sharjah:
        "Sharjah labs in Al Nahda and Al Majaz offer some of the most affordable CBC and iron study packages in the northern UAE.",
      ajman:
        "Ajman's labs provide basic and advanced anemia panels at competitive rates, accessible from Al Nuaimia and central areas.",
      "ras-al-khaimah":
        "Labs in Ras Al Khaimah offer anemia testing with home collection options, convenient for residents across the emirate's spread-out geography.",
      fujairah:
        "Fujairah residents can access anemia screening through local labs, with CBC results often available the same day.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-licensed labs providing essential blood work including CBC and iron studies.",
      "al-ain":
        "Al Ain labs near Tawam Hospital and Al Jimi offer thorough anemia panels, often at prices lower than the coastal cities.",
    },
  },
  "thyroid-disorders": {
    slug: "thyroid-disorders",
    name: "Thyroid Disorders",
    description:
      "Thyroid function tests measure hormones produced by the thyroid gland, primarily TSH and the full thyroid panel (T3, T4, Free T3, Free T4). Thyroid disorders are among the most common endocrine conditions in the UAE, affecting metabolism, energy, weight, and mood.",
    testSlugs: ["tsh", "thyroid-panel"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer rapid TSH and full thyroid panels. Labs in Healthcare City and Jumeirah specialize in endocrine diagnostics with quick turnaround.",
      "abu-dhabi":
        "Abu Dhabi's labs provide thyroid screening as part of routine health checks. DOH-regulated facilities across the city offer both basic TSH and comprehensive panels.",
      sharjah:
        "Sharjah residents find affordable thyroid testing in labs across Al Nahda and Al Taawun, often bundled with annual health check packages.",
      ajman:
        "Ajman's labs offer thyroid function tests at competitive prices, making routine screening accessible for residents.",
      "ras-al-khaimah":
        "Ras Al Khaimah labs provide thyroid panels with home collection, suited for regular monitoring of thyroid medication dosages.",
      fujairah:
        "Fujairah's labs offer basic and comprehensive thyroid panels through MOHAP-licensed facilities in the city center.",
      "umm-al-quwain":
        "Umm Al Quwain residents can access thyroid testing through local MOHAP-regulated labs and chain lab branches.",
      "al-ain":
        "Al Ain has DOH-licensed labs offering affordable thyroid panels, particularly near the medical district around Tawam Hospital.",
    },
  },
  "heart-disease": {
    slug: "heart-disease",
    name: "Heart Disease",
    description:
      "Cardiac risk screening involves blood tests that measure cholesterol (lipid profile), inflammation markers (CRP), heart-specific enzymes (troponin, BNP), and metabolic indicators (HbA1c, fasting glucose). Cardiovascular disease is a leading cause of mortality in the UAE, making preventive screening essential.",
    testSlugs: [
      "lipid-profile",
      "crp",
      "troponin",
      "bnp",
      "hba1c",
      "fasting-glucose",
    ],
    cityContext: {
      dubai:
        "Dubai has world-class cardiac care facilities. DHA-licensed labs throughout the city offer comprehensive cardiac panels, and many cardiologists in Healthcare City recommend regular lipid and CRP screening.",
      "abu-dhabi":
        "Abu Dhabi's DOH has promoted cardiovascular screening through public health campaigns. Labs on Al Maryah Island and in Khalifa City offer advanced cardiac biomarker panels.",
      sharjah:
        "Sharjah labs offer cardiac screening panels at competitive prices. Residents in Al Majaz and Al Taawun can access lipid profiles and cardiac markers without long waits.",
      ajman:
        "Ajman's labs provide essential cardiac screening tests including lipid profiles and glucose panels at lower price points than neighboring Dubai.",
      "ras-al-khaimah":
        "Ras Al Khaimah's MOHAP-licensed labs offer cardiac risk panels with home collection, making preventive screening convenient across the emirate.",
      fujairah:
        "Fujairah residents can access cardiac screening through local labs, with lipid profiles and glucose tests available at affordable rates.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-regulated labs offering cardiac risk panels. Home collection services extend access to residents across the emirate.",
      "al-ain":
        "Al Ain has DOH-licensed labs with cardiac panels priced competitively. Tawam Hospital's proximity means advanced cardiac biomarkers are readily available.",
    },
  },
  "liver-disease": {
    slug: "liver-disease",
    name: "Liver Disease",
    description:
      "Liver function tests (LFT) measure enzymes and proteins that indicate how well your liver is working. Combined with hepatitis B screening, these tests help detect liver damage, inflammation, and viral hepatitis early. Regular screening is recommended for individuals with risk factors or chronic conditions.",
    testSlugs: ["lft", "hepatitis-b"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer liver function panels with rapid results. Labs in Deira and Healthcare City often include hepatitis B screening in standard liver packages.",
      "abu-dhabi":
        "Abu Dhabi's DOH mandates hepatitis B screening for visa medicals. Labs across the capital offer combined LFT and hepatitis panels at competitive rates.",
      sharjah:
        "Sharjah labs provide affordable liver function testing. Many labs in Al Nahda offer bundled LFT and hepatitis packages.",
      ajman:
        "Ajman's MOHAP-licensed labs offer liver panels at some of the lowest prices in the UAE, convenient for routine monitoring.",
      "ras-al-khaimah":
        "Ras Al Khaimah labs offer liver function and hepatitis screening with home collection, extending access across the emirate.",
      fujairah:
        "Fujairah residents can access liver function tests through local labs, with results typically available within 24 hours.",
      "umm-al-quwain":
        "Umm Al Quwain has labs providing basic and comprehensive liver panels through MOHAP-regulated facilities.",
      "al-ain":
        "Al Ain's DOH-licensed labs offer liver function testing at competitive prices, with several options near the city center and Tawam area.",
    },
  },
  "kidney-disease": {
    slug: "kidney-disease",
    name: "Kidney Disease",
    description:
      "Kidney function tests (KFT) measure creatinine, urea, and electrolytes to assess how well your kidneys filter waste. Additional markers like uric acid and urinalysis help detect early kidney damage. The UAE's high diabetes prevalence makes kidney screening particularly important.",
    testSlugs: ["kft", "uric-acid", "urinalysis"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer comprehensive kidney panels. Labs in Healthcare City and across the city provide KFT with quick turnaround, often bundled with diabetes screening.",
      "abu-dhabi":
        "Abu Dhabi's DOH promotes kidney health screening. Labs throughout the capital offer KFT panels, often combined with diabetes markers for a complete metabolic assessment.",
      sharjah:
        "Sharjah labs in Al Nahda and Al Majaz offer affordable kidney function panels, accessible for routine monitoring.",
      ajman:
        "Ajman's labs provide kidney function tests at competitive prices, making regular monitoring affordable for at-risk populations.",
      "ras-al-khaimah":
        "Ras Al Khaimah's MOHAP-licensed labs offer KFT and urinalysis with home collection, convenient for patients requiring regular monitoring.",
      fujairah:
        "Fujairah residents can access kidney function screening through local MOHAP-licensed labs, with same-day results for routine KFT.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-regulated labs providing kidney function panels at affordable rates.",
      "al-ain":
        "Al Ain's DOH-licensed labs near Tawam Hospital offer kidney function panels, often bundled with diabetes screening for comprehensive metabolic assessment.",
    },
  },
  fertility: {
    slug: "fertility",
    name: "Fertility",
    description:
      "Fertility testing evaluates reproductive hormones critical for conception. AMH indicates ovarian reserve, FSH and estradiol assess ovarian function, prolactin affects ovulation, thyroid function impacts fertility, and testosterone is important for both male and female reproductive health. The UAE has a growing number of fertility clinics and IVF centers.",
    testSlugs: [
      "amh",
      "fsh",
      "estradiol",
      "prolactin",
      "thyroid-panel",
      "testosterone",
    ],
    cityContext: {
      dubai:
        "Dubai is a hub for fertility treatment in the region. DHA-licensed labs in Healthcare City and across the city offer comprehensive fertility panels, often coordinated with IVF clinics.",
      "abu-dhabi":
        "Abu Dhabi's DOH-regulated labs provide fertility hormone panels, with many facilities near the medical district on Al Maryah Island and in Khalifa City.",
      sharjah:
        "Sharjah offers affordable fertility testing through labs in Al Nahda and Al Majaz, providing an alternative to higher-priced Dubai labs just across the border.",
      ajman:
        "Ajman's labs offer fertility hormone panels at competitive rates, making initial fertility screening accessible.",
      "ras-al-khaimah":
        "Ras Al Khaimah's MOHAP-licensed labs provide fertility testing with home collection, convenient for patients undergoing monitored cycles.",
      fujairah:
        "Fujairah residents can access basic fertility panels through local labs, with comprehensive panels available at chain lab branches.",
      "umm-al-quwain":
        "Umm Al Quwain has labs offering fertility hormone tests through MOHAP-regulated facilities and chain lab branches.",
      "al-ain":
        "Al Ain's DOH-licensed labs offer fertility panels at lower prices than coastal cities, with good access near the medical district.",
    },
  },
  "std-screening": {
    slug: "std-screening",
    name: "STD Screening",
    description:
      "STD screening tests detect sexually transmitted infections through blood work and specific antigen/antibody tests. HIV testing, VDRL (syphilis screening), and hepatitis B surface antigen testing form the core panel. Confidential testing is available at licensed laboratories across the UAE.",
    testSlugs: ["hiv-test", "vdrl", "hepatitis-b"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer confidential STD screening. Labs in Healthcare City, Jumeirah, and Deira provide discreet testing with quick results and secure digital reporting.",
      "abu-dhabi":
        "Abu Dhabi's DOH-regulated labs provide confidential STD testing. Several labs across the capital offer private screening rooms and digital result delivery.",
      sharjah:
        "Sharjah labs offer confidential STD panels at affordable prices. Labs in Al Nahda and Al Majaz provide discreet testing services.",
      ajman:
        "Ajman's MOHAP-licensed labs provide confidential STD screening at competitive prices with quick turnaround times.",
      "ras-al-khaimah":
        "Ras Al Khaimah labs offer confidential STD testing through MOHAP-licensed facilities, with some labs providing home collection for added privacy.",
      fujairah:
        "Fujairah residents can access confidential STD screening through local MOHAP-licensed labs, with results delivered digitally.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-regulated labs providing confidential STD testing with home collection options.",
      "al-ain":
        "Al Ain's DOH-licensed labs offer confidential STD screening, with several options providing discrete testing near the city center.",
    },
  },
  "vitamin-deficiency": {
    slug: "vitamin-deficiency",
    name: "Vitamin Deficiency",
    description:
      "Vitamin and mineral deficiency testing measures levels of essential nutrients including vitamin D, vitamin B12, folate, calcium, magnesium, and iron. Vitamin D deficiency is extremely common in the UAE despite abundant sunshine, largely due to indoor lifestyles and limited dietary intake.",
    testSlugs: [
      "vitamin-d",
      "vitamin-b12",
      "folate",
      "calcium",
      "magnesium",
      "iron-studies",
    ],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs frequently report vitamin D deficiency in residents. Labs across the city, from Marina to Deira, offer comprehensive vitamin panels, often as part of annual health check-ups.",
      "abu-dhabi":
        "Abu Dhabi's DOH promotes regular vitamin screening. Labs throughout the capital offer vitamin and mineral panels, with vitamin D testing being one of the most commonly ordered tests.",
      sharjah:
        "Sharjah labs offer some of the most affordable vitamin panels in the UAE. Labs in Al Nahda and Muwaileh provide budget-friendly screening packages.",
      ajman:
        "Ajman's labs offer vitamin deficiency panels at competitive prices, making routine screening accessible for residents.",
      "ras-al-khaimah":
        "Ras Al Khaimah's labs provide vitamin panels with home collection, convenient for routine monitoring of supplementation.",
      fujairah:
        "Fujairah residents can access vitamin testing through local MOHAP-licensed labs, with vitamin D and B12 being the most commonly ordered tests.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-regulated labs offering vitamin panels at affordable rates, with home collection extending access across the emirate.",
      "al-ain":
        "Al Ain's DOH-licensed labs offer affordable vitamin and mineral panels. The inland climate and lifestyle make regular vitamin D screening particularly relevant.",
    },
  },
  "allergy-testing": {
    slug: "allergy-testing",
    name: "Allergy Testing",
    description:
      "Allergy testing measures immunoglobulin E (IgE) levels and food-specific antibodies to identify allergic sensitivities. Total IgE provides an overview of allergic tendency, while food intolerance panels test reactions to specific foods. The UAE's diverse population and dietary habits make allergy testing increasingly relevant.",
    testSlugs: ["ige-total", "food-intolerance-panel"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer comprehensive allergy panels. Labs in Healthcare City and across the city provide IgE testing and food intolerance panels, often with dietitian referrals.",
      "abu-dhabi":
        "Abu Dhabi's DOH-regulated labs provide allergy testing with detailed reporting. Labs on Al Reem Island and in Khalifa City offer both basic IgE and comprehensive food panels.",
      sharjah:
        "Sharjah labs offer affordable allergy testing. Labs in Al Majaz and Al Taawun provide IgE panels at lower prices than Dubai while maintaining licensed quality standards.",
      ajman:
        "Ajman's MOHAP-licensed labs offer allergy panels at competitive rates, making testing accessible for families.",
      "ras-al-khaimah":
        "Ras Al Khaimah's labs provide allergy testing through MOHAP-licensed facilities, with home collection available for blood-based IgE panels.",
      fujairah:
        "Fujairah residents can access allergy testing through local labs, with basic IgE panels available and comprehensive panels through chain lab branches.",
      "umm-al-quwain":
        "Umm Al Quwain has labs offering allergy testing through MOHAP-regulated facilities, with home collection for added convenience.",
      "al-ain":
        "Al Ain's DOH-licensed labs offer allergy panels at affordable prices, with comprehensive food intolerance testing available at chain lab branches.",
    },
  },
  "prostate-health": {
    slug: "prostate-health",
    name: "Prostate Health",
    description:
      "Prostate health screening primarily involves the PSA (prostate-specific antigen) blood test and testosterone levels. PSA is used to screen for prostate enlargement and prostate cancer risk. Men over 50, or over 40 with family history, are advised to get regular PSA screening.",
    testSlugs: ["psa", "testosterone"],
    cityContext: {
      dubai:
        "Dubai's DHA-licensed labs offer PSA screening as part of men's health packages. Labs in Healthcare City and across the city provide rapid PSA results, often coordinated with urology clinics.",
      "abu-dhabi":
        "Abu Dhabi's DOH promotes prostate screening for men over 50. Labs throughout the capital offer PSA testing, often bundled with comprehensive men's health panels.",
      sharjah:
        "Sharjah labs offer affordable PSA testing. Labs in Al Nahda and Al Majaz provide men's health screening at competitive prices.",
      ajman:
        "Ajman's labs offer PSA and testosterone testing at some of the lowest prices in the UAE, making regular screening affordable.",
      "ras-al-khaimah":
        "Ras Al Khaimah's MOHAP-licensed labs provide PSA testing with home collection, convenient for routine annual screening.",
      fujairah:
        "Fujairah residents can access prostate screening through local MOHAP-licensed labs, with PSA results typically available within 24 hours.",
      "umm-al-quwain":
        "Umm Al Quwain has MOHAP-regulated labs offering PSA testing at affordable rates.",
      "al-ain":
        "Al Ain's DOH-licensed labs near Tawam Hospital and in Al Jimi offer prostate screening at prices lower than Abu Dhabi city.",
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCityName(slug: string): string {
  return (
    CITIES.find((c) => c.slug === slug)?.name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

/**
 * For a given condition and city, find labs that offer prices
 * for at least `minTests` of the condition's test slugs.
 */
function getLabsForConditionInCity(
  condition: ConditionDef,
  citySlug: string,
  minTests = 1
) {
  const cityLabs = getLabsByCity(citySlug);
  const conditionTestSet = new Set(condition.testSlugs);

  return cityLabs
    .map((lab) => {
      const labPrices = getPricesForLab(lab.slug);
      const matchingPrices = labPrices.filter((p) =>
        conditionTestSet.has(p.testSlug)
      );
      const matchingTests = new Set(matchingPrices.map((p) => p.testSlug));
      const totalPrice = matchingPrices.reduce((sum, p) => sum + p.price, 0);
      const avgPrice =
        matchingPrices.length > 0
          ? Math.round(totalPrice / matchingPrices.length)
          : 0;

      return {
        lab,
        matchingTestCount: matchingTests.size,
        matchingTests: Array.from(matchingTests),
        totalPrice,
        avgPrice,
        prices: matchingPrices,
      };
    })
    .filter((r) => r.matchingTestCount >= minTests)
    .sort(
      (a, b) =>
        b.matchingTestCount - a.matchingTestCount || a.totalPrice - b.totalPrice
    );
}

/**
 * Calculate the estimated cheapest total cost for a condition in a city
 * by summing the cheapest price for each available test.
 */
function getCheapestEstimate(
  condition: ConditionDef,
  citySlug: string
): { total: number; testCount: number } | undefined {
  let total = 0;
  let testCount = 0;
  for (const testSlug of condition.testSlugs) {
    const range = getPriceRangeInCity(testSlug, citySlug);
    if (range) {
      total += range.min;
      testCount++;
    }
  }
  if (testCount === 0) return undefined;
  return { total, testCount };
}

// ─── Static Params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const params: { condition: string; city: string }[] = [];

  for (const conditionSlug of Object.keys(CONDITIONS)) {
    const condition = CONDITIONS[conditionSlug];
    for (const city of CITIES) {
      // Include this combo only if at least 1 lab in this city
      // offers prices for at least 2 of the condition's tests
      const labs = getLabsForConditionInCity(condition, city.slug, 2);
      if (labs.length > 0) {
        params.push({ condition: conditionSlug, city: city.slug });
      }
    }
  }

  return params;
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { condition: string; city: string };
}): Metadata {
  const condition = CONDITIONS[params.condition];
  const cityName = getCityName(params.city);
  if (!condition) return { title: "Not Found" };

  const base = getBaseUrl();
  const labs = getLabsForConditionInCity(condition, params.city, 1);
  const estimate = getCheapestEstimate(condition, params.city);

  const title = `${condition.name} Tests in ${cityName} — Compare ${labs.length} Labs | UAE Lab Tests`;
  const description =
    `Compare ${condition.name.toLowerCase()} blood tests in ${cityName} across ${labs.length} ${getRegulatorShort(params.city)}-licensed labs. ` +
    (estimate
      ? `Estimated cost from ${formatPrice(estimate.total)} for ${estimate.testCount} tests. `
      : "") +
    `Home collection available. Prices verified March 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/labs/conditions/${params.condition}/${params.city}`,
    },
    openGraph: {
      title: `${condition.name} Tests in ${cityName} — Compare Labs & Prices`,
      description,
      url: `${base}/labs/conditions/${params.condition}/${params.city}`,
    },
  };
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default function ConditionCityPage({
  params,
}: {
  params: { condition: string; city: string };
}) {
  const condition = CONDITIONS[params.condition];
  const city = CITIES.find((c) => c.slug === params.city);
  if (!condition || !city) notFound();

  const base = getBaseUrl();
  const regulator = getRegulator(city.slug);
  const regulatorShort = getRegulatorShort(city.slug);

  // Labs offering condition-related tests in this city
  const conditionLabs = getLabsForConditionInCity(condition, city.slug, 1);

  // Tests with city-specific prices
  const testsWithPrices = condition.testSlugs
    .map((slug) => {
      const test = getLabTest(slug);
      const range = getPriceRangeInCity(slug, city.slug);
      return test && range ? { test, range } : null;
    })
    .filter(Boolean) as { test: NonNullable<ReturnType<typeof getLabTest>>; range: NonNullable<ReturnType<typeof getPriceRangeInCity>> }[];

  // Estimated cheapest total cost
  const estimate = getCheapestEstimate(condition, city.slug);

  // Home collection labs
  const homeCollectionLabs = conditionLabs.filter(
    (l) => l.lab.homeCollection
  );

  // Cross-links: same condition in other cities
  const otherCities = CITIES.filter((c) => c.slug !== city.slug);
  // Cross-links: other conditions in this city
  const otherConditions = Object.values(CONDITIONS).filter(
    (c) => c.slug !== condition.slug
  );

  // City-specific context
  const cityContext =
    condition.cityContext[city.slug] || "";

  // FAQs
  const faqs = [
    {
      question: `How much does ${condition.name.toLowerCase()} testing cost in ${city.name}?`,
      answer: estimate
        ? `A comprehensive ${condition.name.toLowerCase()} panel in ${city.name} costs from approximately ${formatPrice(estimate.total)} when choosing the cheapest ${regulatorShort}-licensed lab for each of the ${estimate.testCount} recommended tests. Individual test prices vary by laboratory. Compare ${conditionLabs.length} labs on this page to find the best value.`
        : `Pricing for ${condition.name.toLowerCase()} tests in ${city.name} varies by laboratory. Contact labs directly or browse individual test pages for current pricing.`,
    },
    {
      question: `Which lab in ${city.name} is cheapest for ${condition.name.toLowerCase()}?`,
      answer:
        conditionLabs.length > 0
          ? `Based on the number of condition-related tests offered and average pricing, ${conditionLabs[0].lab.name} offers ${conditionLabs[0].matchingTestCount} of the ${condition.testSlugs.length} recommended tests for ${condition.name.toLowerCase()} in ${city.name}. ${conditionLabs[0].lab.homeCollection ? `They also offer home sample collection${conditionLabs[0].lab.homeCollectionFee === 0 ? " for free" : ` for AED ${conditionLabs[0].lab.homeCollectionFee}`}.` : "Walk-in service only."} Compare all ${conditionLabs.length} labs above for detailed pricing.`
          : `Contact labs in ${city.name} directly for current ${condition.name.toLowerCase()} pricing.`,
    },
    {
      question: `Can I get ${condition.name.toLowerCase()} tests at home in ${city.name}?`,
      answer:
        homeCollectionLabs.length > 0
          ? `Yes, ${homeCollectionLabs.length} lab${homeCollectionLabs.length > 1 ? "s" : ""} in ${city.name} offer home sample collection for ${condition.name.toLowerCase()} blood tests: ${homeCollectionLabs.map((l) => l.lab.name).join(", ")}. A certified phlebotomist visits your home to collect blood samples. ${homeCollectionLabs.some((l) => l.lab.homeCollectionFee === 0) ? "Some labs offer free home collection." : "Home collection fees apply."} Results are typically delivered digitally.`
          : `Home collection for ${condition.name.toLowerCase()} tests may be limited in ${city.name}. Contact individual labs to check availability.`,
    },
    {
      question: `Do I need a referral for ${condition.name.toLowerCase()} tests in ${city.name}?`,
      answer: `In the UAE, you do not need a doctor's referral to order blood tests at a private laboratory. You can walk in or book online at any ${regulatorShort}-licensed lab in ${city.name} and request ${condition.name.toLowerCase()} tests directly. However, a doctor can help you interpret results and recommend follow-up care. If you are using insurance, some plans may require a referral for coverage.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      {/* JSON-LD: BreadcrumbList */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Tests", url: `${base}/labs` },
          { name: "Conditions", url: `${base}/labs/conditions` },
          {
            name: condition.name,
            url: `${base}/labs/conditions/${condition.slug}`,
          },
          { name: city.name },
        ])}
      />

      {/* JSON-LD: FAQPage */}
      <JsonLd data={faqPageSchema(faqs)} />

      {/* JSON-LD: SpeakableSpecification */}
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Conditions", href: "/labs/conditions" },
          {
            label: condition.name,
            href: `/labs/conditions/${condition.slug}`,
          },
          { label: city.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-[11px] bg-accent-muted text-accent-dark px-2 py-0.5 font-bold uppercase">
            {city.name}
          </span>
          <span className="text-[11px] bg-light-100 text-dark px-2 py-0.5 font-bold uppercase">
            {regulatorShort}-licensed
          </span>
        </div>

        <h1 className="text-3xl font-bold text-dark mb-3">
          {condition.name} Tests in {city.name} — Compare Labs &amp; Prices
        </h1>

        {/* Answer block */}
        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-3">
            {condition.description}
          </p>
          <p className="text-muted leading-relaxed">
            In {city.name},{" "}
            <strong>
              {conditionLabs.length} {regulatorShort}-licensed lab
              {conditionLabs.length !== 1 ? "s" : ""}
            </strong>{" "}
            offer tests relevant to {condition.name.toLowerCase()} screening.
            {testsWithPrices.length > 0 && (
              <>
                {" "}
                Prices are available for{" "}
                <strong>
                  {testsWithPrices.length} of {condition.testSlugs.length}
                </strong>{" "}
                recommended tests.
              </>
            )}
            {estimate && (
              <>
                {" "}
                The estimated minimum cost for a full panel is{" "}
                <strong>{formatPrice(estimate.total)}</strong> when selecting the
                cheapest lab for each test.
              </>
            )}{" "}
            Healthcare in {city.name} is regulated by the {regulator}. All labs
            listed are licensed and verified.
          </p>
          {cityContext && (
            <p className="text-muted leading-relaxed mt-3">{cityContext}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 mb-6">
          <div className="bg-light-50 p-3">
            <p className="text-lg font-bold text-accent">
              {conditionLabs.length}
            </p>
            <p className="text-[11px] text-muted">
              Labs in {city.name}
            </p>
          </div>
          <div className="bg-light-50 p-3">
            <p className="text-lg font-bold text-accent">
              {testsWithPrices.length}
            </p>
            <p className="text-[11px] text-muted">Tests with prices</p>
          </div>
          {estimate && (
            <div className="bg-light-50 p-3">
              <div className="flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-accent" />
                <p className="text-lg font-bold text-accent">
                  {formatPrice(estimate.total)}
                </p>
              </div>
              <p className="text-[11px] text-muted">
                Est. cheapest total
              </p>
            </div>
          )}
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-accent" />
              <p className="text-lg font-bold text-accent">
                {homeCollectionLabs.length}
              </p>
            </div>
            <p className="text-[11px] text-muted">Home collection</p>
          </div>
        </div>
      </div>

      {/* Tests Available in {City} */}
      {testsWithPrices.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>Tests Available in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testsWithPrices.map(({ test, range }) => (
              <Link
                key={test.slug}
                href={`/labs/test/${test.slug}`}
                className="p-4 border border-light-200 bg-light-50 hover:border-accent transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                    {test.shortName}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-[11px] text-muted line-clamp-2 mb-3">
                  {test.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-accent">
                    {formatPrice(range.min)}
                  </span>
                  {range.max > range.min && (
                    <span className="text-[11px] text-muted">
                      – {formatPrice(range.max)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted mt-1">
                  {range.labCount} lab{range.labCount !== 1 ? "s" : ""} in{" "}
                  {city.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Estimated Cost in {City} */}
      {estimate && (
        <section className="mb-10">
          <div className="section-header">
            <h2>Estimated Cost in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="bg-light-50 border border-light-200 p-6">
            <p className="text-muted text-sm leading-relaxed mb-4">
              The table below shows the cheapest available price for each{" "}
              {condition.name.toLowerCase()} test in {city.name}. The total
              represents the minimum you would pay by selecting the cheapest lab
              for each individual test.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-200">
                    <th className="text-left py-2 pr-4 text-xs font-bold text-dark uppercase">
                      Test
                    </th>
                    <th className="text-right py-2 px-4 text-xs font-bold text-dark uppercase">
                      From
                    </th>
                    <th className="text-right py-2 pl-4 text-xs font-bold text-dark uppercase">
                      Labs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {condition.testSlugs.map((slug) => {
                    const test = getLabTest(slug);
                    const range = getPriceRangeInCity(slug, city.slug);
                    if (!test) return null;
                    return (
                      <tr
                        key={slug}
                        className="border-b border-light-100 last:border-b-0"
                      >
                        <td className="py-2 pr-4">
                          <Link
                            href={`/labs/test/${slug}`}
                            className="text-dark hover:text-accent transition-colors font-medium"
                          >
                            {test.shortName}
                          </Link>
                        </td>
                        <td className="py-2 px-4 text-right">
                          {range ? (
                            <span className="font-bold text-accent">
                              {formatPrice(range.min)}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-2 pl-4 text-right text-muted text-xs">
                          {range ? range.labCount : 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-light-300">
                    <td className="py-3 pr-4 font-bold text-dark">
                      Estimated Total
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-accent text-base">
                      {formatPrice(estimate.total)}
                    </td>
                    <td className="py-3 pl-4 text-right text-[11px] text-muted">
                      {estimate.testCount} tests
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[11px] text-muted mt-4">
              Prices shown are the cheapest available in {city.name} per test.
              Actual costs may vary if you choose a single lab for all tests or
              if prices have changed. Some labs offer bundled condition-specific
              packages at a discount.
            </p>
          </div>
        </section>
      )}

      {/* Labs in {City} Offering These Tests */}
      {conditionLabs.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>
              Labs in {city.name} Offering {condition.name} Tests
            </h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="space-y-4">
            {conditionLabs.map(
              ({ lab, matchingTestCount, matchingTests, totalPrice }) => (
                <div
                  key={lab.slug}
                  className="border border-light-200 bg-light-50 p-4 hover:border-accent transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/labs/${lab.slug}`}
                          className="text-sm font-bold text-dark hover:text-accent transition-colors"
                        >
                          {lab.name}
                        </Link>
                        {lab.homeCollection && (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 font-bold uppercase">
                            Home Collection
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mb-2">
                        {lab.type === "chain"
                          ? "Lab chain"
                          : lab.type === "hospital"
                            ? "Hospital lab"
                            : lab.type === "home-service"
                              ? "Home service"
                              : "Boutique lab"}{" "}
                        | {lab.accreditations.join(", ") || "Licensed"} |{" "}
                        {regulatorShort}-regulated
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingTests.map((testSlug) => {
                          const test = getLabTest(testSlug);
                          return (
                            <span
                              key={testSlug}
                              className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-medium"
                            >
                              {test?.shortName || testSlug}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted">
                        {matchingTestCount} of {condition.testSlugs.length} tests
                      </p>
                      <p className="text-sm font-bold text-accent">
                        {formatPrice(totalPrice)}
                      </p>
                      <p className="text-[10px] text-muted">
                        combined price
                      </p>
                      {lab.homeCollection && (
                        <p className="text-[10px] text-muted mt-1">
                          Home fee:{" "}
                          {lab.homeCollectionFee === 0
                            ? "Free"
                            : `AED ${lab.homeCollectionFee}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Home Collection Available? */}
      <section className="mb-10">
        <div className="section-header">
          <h2>Home Collection in {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="bg-light-50 border border-light-200 p-6">
          {homeCollectionLabs.length > 0 ? (
            <>
              <p className="text-sm text-muted leading-relaxed mb-4">
                <strong>{homeCollectionLabs.length}</strong> lab
                {homeCollectionLabs.length !== 1 ? "s" : ""} in {city.name}{" "}
                offer home sample collection for{" "}
                {condition.name.toLowerCase()} tests. A certified
                phlebotomist visits your location to collect blood samples,
                and results are delivered digitally.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {homeCollectionLabs.map(({ lab, matchingTestCount }) => (
                  <div
                    key={lab.slug}
                    className="flex items-center justify-between p-3 border border-light-200 bg-white"
                  >
                    <div>
                      <Link
                        href={`/labs/${lab.slug}`}
                        className="text-xs font-bold text-dark hover:text-accent transition-colors"
                      >
                        {lab.name}
                      </Link>
                      <p className="text-[10px] text-muted">
                        {matchingTestCount} condition tests available
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Home className="w-3 h-3 text-green-600" />
                        <span className="text-[10px] font-bold text-green-700">
                          {lab.homeCollectionFee === 0
                            ? "Free"
                            : `AED ${lab.homeCollectionFee}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted leading-relaxed">
              Home sample collection for {condition.name.toLowerCase()} tests
              may be limited in {city.name}. Contact individual labs to check
              availability, or consider visiting a walk-in lab for sample
              collection.
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`${condition.name} Tests in ${city.name} — FAQ`}
      />

      {/* Cross-links: same condition in other cities */}
      <section className="mt-10 mb-8">
        <div className="section-header">
          <h2>
            {condition.name} Tests in Other Cities
          </h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCities.map((c) => {
            const otherLabs = getLabsForConditionInCity(condition, c.slug, 1);
            return (
              <Link
                key={c.slug}
                href={`/labs/conditions/${condition.slug}/${c.slug}`}
                className="p-3 border border-light-200 hover:border-accent transition-colors group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-accent" />
                  <p className="text-xs font-bold text-dark group-hover:text-accent">
                    {c.name}
                  </p>
                </div>
                <p className="text-[10px] text-muted">
                  {otherLabs.length} lab{otherLabs.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Cross-links: other conditions in this city */}
      <section className="mb-8">
        <div className="section-header">
          <h2>Other Conditions in {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherConditions.map((c) => (
            <Link
              key={c.slug}
              href={`/labs/conditions/${c.slug}/${city.slug}`}
              className="p-3 border border-light-200 hover:border-accent transition-colors group"
            >
              <p className="text-xs font-bold text-dark group-hover:text-accent">
                {c.name}
              </p>
              <p className="text-[10px] text-muted">
                {c.testSlugs.length} tests
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices for{" "}
          {condition.name.toLowerCase()} tests in {city.name} are indicative
          and based on publicly available data from lab websites and
          aggregator platforms. Actual prices may vary by branch, insurance
          coverage, and current promotions. Always confirm pricing directly
          with the laboratory before booking. This page is for informational
          purposes only and does not constitute medical advice. Consult a
          healthcare professional for diagnosis and treatment
          recommendations. All labs listed are licensed by the {regulator}.
          Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
