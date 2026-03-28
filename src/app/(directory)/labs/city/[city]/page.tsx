import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  MapPin,
  Home,
  ChevronRight,
  TrendingDown,
  Activity,
  Microscope,
  BarChart3,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_TESTS,
  TEST_CATEGORIES,
  getLabsByCity,
  getPricesForLab,
  getPackagesForLab,
  getPriceRange,
  getTestsByCategory,
  formatPrice,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

// ─── Static Params ───────────────────────────────────────────────────────────

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export const revalidate = 43200;

// ─── City-Specific Editorial Content ─────────────────────────────────────────

interface CityLabContent {
  regulator: string;
  regulatorAbbrev: string;
  intro: string;
  deepDive: string;
  popularAreas: string[];
  visaMedical: string;
  insuranceTip: string;
  cbcFrom: number;
  vitaminDFrom: number;
  homeCollectionNote: string;
}

const CITY_LAB_CONTENT: Record<string, CityLabContent> = {
  dubai: {
    regulator: "Dubai Health Authority (DHA)",
    regulatorAbbrev: "DHA",
    intro:
      "Dubai has the UAE's most competitive laboratory market, with over a dozen DHA-licensed diagnostic labs spanning every price tier. Deira and Bur Dubai remain the go-to hubs for budget-conscious patients — standalone labs here routinely undercut hospital-based pricing by 30–50%. At the premium end, Dubai Healthcare City (DHCC) hosts international chains like Unilabs and MenaLabs catering to DIFC professionals and medical-tourism patients. Expats in JLT, Dubai Marina, and Business Bay are well-served by home-collection platforms such as DarDoc, which deploy DHA-certified nurses daily between 7 AM and 11 PM.",
    deepDive:
      "Lab testing in Dubai is regulated by the Dubai Health Authority, which mandates quality standards and licensing for every diagnostic facility operating in the emirate. All licensed labs must comply with DHA Clinical Laboratory Standards, and many of the larger chains hold additional international accreditations — CAP (College of American Pathologists), ISO 15189, and JCI — which ensure testing accuracy comparable to European and US labs. For routine blood work (CBC, lipid profile, liver and kidney function), walk-in pricing at standalone labs in Deira, Al Karama, and Al Quoz is typically AED 69–99 for a CBC and AED 85–120 for Vitamin D. Hospital-based labs in Jumeirah or Downtown can charge two to three times as much for identical tests. Visa medical tests — a mandatory requirement for new UAE residents — are processed at DHA-approved centres such as the Al Rashidiya and Bur Dubai clinics, typically costing AED 320–380 all-in. Home collection is widely available across all Dubai districts; most providers guarantee a phlebotomist within 60 minutes. Results for routine tests arrive digitally within 4–24 hours.",
    popularAreas: ["Deira", "Bur Dubai", "Al Karama", "Dubai Healthcare City", "JLT", "Business Bay"],
    visaMedical:
      "Visa medical tests in Dubai are conducted at DHA-approved Preventive Medicine centres in Al Rashidiya, Bur Dubai, and Al Quoz. The standard visa screening (blood group, chest X-ray, HIV, Hepatitis B, TB) costs AED 320–380. Appointments can be booked via the DHA app (Salama) or AMER service centres.",
    insuranceTip:
      "Most DHA-licensed labs in Dubai accept Daman, AXA, Cigna, Bupa, and Dubai Insurance Company. For Thiqa holders (Abu Dhabi government plan), coverage is typically limited to DOH-licensed facilities unless the plan has out-of-emirate benefits. Always confirm insurance acceptance when booking.",
    cbcFrom: 69,
    vitaminDFrom: 85,
    homeCollectionNote:
      "DarDoc, ServiceMarket, and Healthchecks360 all operate home collection in Dubai from 7 AM daily. Many offer free sample collection with results delivered to your phone.",
  },
  "abu-dhabi": {
    regulator: "Department of Health Abu Dhabi (DOH)",
    regulatorAbbrev: "DOH",
    intro:
      "Abu Dhabi's lab ecosystem is anchored by two institutional giants: National Reference Laboratory (NRL), part of the M42/Mubadala Health network and the capital's primary reference lab for complex diagnostics, and PureLab — the UAE's largest AI-powered standalone laboratory at 70,000 sq ft in the Industrial City of Abu Dhabi, capable of processing 30 million samples annually. For residents on Al Reem Island, Al Maryah Island, and Khalifa City, both labs offer home collection. MenaLabs (Cerba HealthCare) and Medsol Diagnostics round out the market with more accessible walk-in pricing.",
    deepDive:
      "All diagnostic laboratories in Abu Dhabi operate under the Department of Health (DOH) licensing framework, which sets rigorous standards for equipment, staff qualifications, and reporting timelines. The emirate has among the highest Thiqa (government employee) insurance coverage rates in the UAE, and many labs are contracted into the Daman network — the DOH-regulated mandatory health insurance scheme. NRL is the default reference laboratory for complex, specialised, and molecular diagnostic work, receiving overflow from clinics and hospitals throughout Abu Dhabi and Al Ain. PureLab, launched in 2023 under PureHealth (the Middle East's largest healthcare conglomerate), has introduced AI-assisted quality checks that reduce result error rates and processing times — routine tests are often ready in 12 hours, faster than the UAE average. For residents in Mohammed Bin Zayed City, Khalifa City, and Al Shamkha, home collection via NRL or DarDoc (DOH-licensed) is the most practical option. Visa medical tests for Abu Dhabi residency visas are processed at dedicated ADPH-approved centres, separate from routine clinical labs.",
    popularAreas: ["Corniche", "Al Reem Island", "Khalifa City", "Al Mushrif", "Mohammed Bin Zayed City"],
    visaMedical:
      "Abu Dhabi residency visa medical tests are conducted at ADPHC (Abu Dhabi Public Health Centre) approved screening centres. The standard package — blood tests, chest X-ray, and infectious disease screening — costs AED 330–400. Book via the ADPHC app or TAMM services platform.",
    insuranceTip:
      "In Abu Dhabi, Thiqa holders (government employees) and Daman Basic insured patients have lab test coverage at DOH-licensed facilities. Most major labs — NRL, PureLab, MenaLabs — are contracted with Daman. Al Borg Diagnostics also accepts Thiqa for eligible tests. Confirm with your insurer whether the specific test requires pre-authorisation.",
    cbcFrom: 75,
    vitaminDFrom: 90,
    homeCollectionNote:
      "NRL and DarDoc both offer home collection across Abu Dhabi island and the mainland suburbs. PureLab also offers mobile phlebotomy. NRL charges AED 75 for home collection; DarDoc is free for most panels.",
  },
  sharjah: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "Sharjah offers some of the most affordable lab testing in the UAE, with a concentration of MOHAP-licensed standalone labs in Al Nahda, Al Majaz, and Al Taawun — all within easy reach of Dubai residents who commute via the E311 or Al Ittihad Road. Thumbay Labs, headquartered in Ajman but with a strong Sharjah presence, is the dominant chain here; Medsol Diagnostics and Healthchecks360 provide budget walk-in options and home collection. The Muwaileh and University City areas near American University of Sharjah have seen growing demand for expat-friendly lab services.",
    deepDive:
      "MOHAP licenses and inspects all diagnostic laboratories operating in Sharjah and the Northern Emirates, enforcing national quality benchmarks for clinical laboratories. Sharjah's lower real-estate costs compared to Dubai translate directly into more competitive lab pricing — a CBC typically costs AED 60–85 at standalone labs here, compared to AED 69–120 in Dubai. For residents who commute between Dubai and Sharjah, some labs in Al Nahda accept both DHA-referred and walk-in patients. Thumbay Labs (CAP-accredited, part of Gulf Medical University's Thumbay Group) offers the best combination of accreditation quality and affordable pricing in the emirate. Healthchecks360 operates across Sharjah for home collection, making it practical for residents in Al Taawun and Al Khan who prefer not to travel. MOHAP-approved visa medical centres in Sharjah process residency screenings for around AED 300–350, slightly below Dubai rates.",
    popularAreas: ["Al Nahda", "Al Majaz", "Al Taawun", "Muwaileh", "Al Qasimia"],
    visaMedical:
      "Sharjah residency visa medicals are processed at MOHAP-approved health centres. The standard package (blood group, HIV, Hepatitis B, chest X-ray, tuberculosis) costs AED 300–350. Processing time is typically same-day at most centres.",
    insuranceTip:
      "In Sharjah, most private insurance plans (AXA, Cigna, Oman Insurance) cover lab tests at MOHAP-licensed facilities. However, government employee Thiqa cards issued in Abu Dhabi may have limited coverage outside DOH-licensed facilities. Check your policy's inter-emirate coverage before booking.",
    cbcFrom: 60,
    vitaminDFrom: 80,
    homeCollectionNote:
      "Healthchecks360 and Medsol Diagnostics both offer free home collection across Sharjah. ServiceMarket also covers parts of Sharjah for at-home blood testing.",
  },
  ajman: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "Ajman is home to Thumbay Labs' headquarters — the CAP-accredited chain affiliated with Gulf Medical University, which draws patients from across the Northern Emirates for its combination of accreditation quality and accessible pricing. The compact emirate is well-served by MOHAP-licensed labs in Al Nuaimia and Ajman Downtown, and benefits from its proximity to Sharjah's lab network. Healthchecks360 provides home collection across Ajman's residential areas.",
    deepDive:
      "MOHAP regulates all clinical laboratories in Ajman, and the emirate's relatively small size means that most residents are within 10 minutes of a licensed diagnostic facility. Thumbay Labs' flagship Ajman branch, co-located with the Thumbay Hospital cluster in Al Jurf, offers the most comprehensive test menu in the emirate — over 1,000 tests with CAP-accredited methodology. For straightforward blood work and routine panels, standalone walk-in labs in Al Nuaimia and Al Rashidiya offer competitive pricing, typically 10–20% below Dubai equivalents for the same tests. Home collection via Healthchecks360 is practical given Ajman's density, usually delivering a phlebotomist within 45 minutes. Visa medical screenings for Ajman-based workers are handled at MOHAP-approved centres in the city, often with same-day results.",
    popularAreas: ["Al Nuaimia", "Al Jurf", "Ajman Downtown", "Al Rashidiya"],
    visaMedical:
      "Ajman residency visa medicals are conducted at MOHAP-approved health centres in Al Nuaimia and Al Jurf. The standard package costs AED 290–340, often the most affordable in the UAE.",
    insuranceTip:
      "Most insurers with UAE-wide networks — AXA, Cigna, Bupa, Oman Insurance — cover tests at MOHAP-licensed Ajman labs. Thumbay Labs is widely recognised across insurance networks given its CAP accreditation.",
    cbcFrom: 60,
    vitaminDFrom: 79,
    homeCollectionNote:
      "Healthchecks360 covers Ajman with free home sample collection. Thumbay Labs also offers home phlebotomy for select panels.",
  },
  "ras-al-khaimah": {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "Ras Al Khaimah's healthcare sector is growing rapidly, with Al Borg Diagnostics — the GCC's largest lab chain and exclusive Quest Diagnostics partner — operating branches here alongside MOHAP-licensed standalone labs in Al Nakheel and the city centre. RAK's proximity to Fujairah and Umm Al Quwain makes it a regional diagnostic hub for the East Coast. Home collection is available but more limited than in Dubai or Abu Dhabi; booking ahead is recommended.",
    deepDive:
      "MOHAP oversees all clinical laboratory licensing in Ras Al Khaimah. The emirate has historically been underserved by diagnostic infrastructure relative to its population size, but Al Borg Diagnostics' entry with ISO 15189 and CAP-accredited facilities has raised the quality bar significantly. Routine blood tests at Al Borg's RAK branches are priced competitively — typically on par with Dubai standalone lab pricing. For residents in Al Hamra and the surrounding tourism and industrial districts, home collection via Al Borg is the most practical option (AED 50 fee). The RAK Government Hospital's in-house lab handles more complex diagnostics, though private labs offer faster turnaround for routine work. MOHAP visa medical centres in RAK process residency screenings, typically at AED 300–360 with same-day results.",
    popularAreas: ["Al Nakheel", "RAK City Centre", "Al Hamra", "Khuzam"],
    visaMedical:
      "RAK residency visa medicals are processed at MOHAP-approved health centres in the city centre. The standard screening costs AED 300–360, with same-day processing for most applicants.",
    insuranceTip:
      "Al Borg Diagnostics is contracted with most major UAE insurers, making it the safest bet for insured patients in RAK. Standalone independent labs may not be on all insurance networks — confirm before booking.",
    cbcFrom: 70,
    vitaminDFrom: 90,
    homeCollectionNote:
      "Al Borg Diagnostics offers home collection in RAK for AED 50. Healthchecks360 covers parts of RAK for their home-service offering.",
  },
  fujairah: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "Fujairah, on the UAE's East Coast, is primarily served by MOHAP-licensed labs attached to the Fujairah Hospital and a cluster of private clinics near the city centre. Al Borg Diagnostics does not yet operate directly in Fujairah, but their RAK branches are accessible for non-urgent testing. Thumbay Labs covers Fujairah through its Northern Emirates network, offering the most recognised accredited private lab option in the emirate.",
    deepDive:
      "MOHAP licenses all diagnostic labs in Fujairah. The emirate has a smaller commercial lab sector than Dubai or Abu Dhabi, with most diagnostic volume flowing through the Fujairah Hospital's lab and a handful of private clinic-attached labs. For residents needing comprehensive panels — extended thyroid, hormone, or tumour marker testing — travelling to RAK or using home-collection aggregators like Healthchecks360 (which ship samples to partner labs in Dubai or Sharjah) is often more practical. Thumbay Labs, through its Northern Emirates presence, is the primary accredited chain for private diagnostic testing in the region. Routine blood tests — CBC, lipid profile, diabetes screening — are available at competitive MOHAP-licensed prices, typically slightly below Dubai rates. Visa medical tests for Fujairah-based employees are processed at MOHAP-approved centres in Fujairah city.",
    popularAreas: ["Fujairah City Centre", "Dibba Al Fujairah"],
    visaMedical:
      "Fujairah residency visa medicals are processed at MOHAP-approved health centres in Fujairah city. Processing typically takes same-day to 24 hours for standard screenings.",
    insuranceTip:
      "In Fujairah, Thumbay Labs is the safest choice for insured patients given its broad insurance network coverage. For smaller independent labs, always verify your plan's network before booking.",
    cbcFrom: 65,
    vitaminDFrom: 85,
    homeCollectionNote:
      "Healthchecks360 covers Fujairah through its partner network. Sample collection agents visit your location; samples are processed at accredited partner labs in Dubai or Sharjah.",
  },
  "umm-al-quwain": {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "Umm Al Quwain is the UAE's least populous emirate, with diagnostic services centred around the main city area through MOHAP-licensed clinics and the UAQ Medical District. For residents requiring comprehensive panels or accredited lab work, Ajman (Thumbay Labs) and Sharjah are accessible within 20–30 minutes. Home-collection platforms like Healthchecks360 serve UAQ residents through their Northern Emirates network.",
    deepDive:
      "MOHAP regulates lab services in Umm Al Quwain. The emirate's small scale means that most diagnostic needs beyond basic blood work are met by travelling to Ajman or Sharjah, or using home-collection aggregators that partner with DHA/MOHAP-licensed labs. For routine tests, the UAQ city centre clinics offer accessible walk-in pricing without the travel. MOHAP visa medical centres in UAQ process residency screenings typically in one day. The emirate's healthcare infrastructure is expanding slowly, with the government prioritising primary care access; complex diagnostics remain most reliably sourced from adjacent Northern Emirates.",
    popularAreas: ["UAQ City Centre", "Al Salamah"],
    visaMedical:
      "UAQ residency visa medicals are processed at MOHAP health centres in the main city area. The standard screening costs approximately AED 290–320.",
    insuranceTip:
      "For insured patients in UAQ, using a home-collection service that partners with DHA/MOHAP-licensed labs ensures your tests are processed at a facility your insurer will recognise. Always confirm with your insurance provider.",
    cbcFrom: 65,
    vitaminDFrom: 82,
    homeCollectionNote:
      "Healthchecks360 covers Umm Al Quwain through their Northern Emirates home-collection network. Results are processed at partner labs in Dubai or Sharjah and delivered digitally.",
  },
  "al-ain": {
    regulator: "Department of Health Abu Dhabi (DOH)",
    regulatorAbbrev: "DOH",
    intro:
      "Al Ain, the Garden City of the UAE, is served by the National Reference Laboratory (NRL) — part of the Mubadala Health / M42 network — with branches covering the city's key districts. Tawam Hospital, the region's tertiary referral centre and a Johns Hopkins Medicine affiliate, has its own in-house laboratory for complex diagnostics. Al Borg Diagnostics operates branches in Al Ain for routine blood work, providing CAP-accredited testing closer to the Abu Dhabi mainland pricing tier.",
    deepDive:
      "All clinical labs in Al Ain operate under the Department of Health Abu Dhabi (DOH) licensing framework — the same regulator as the capital island, reflecting Al Ain's status as Abu Dhabi emirate's second city. NRL's Al Ain branches serve as the primary reference laboratory for the region, handling overflow from Tawam Hospital and the network of private clinics across Al Jimi, Al Muwaiji, and Al Ain Central. For DOH-insured Thiqa holders, NRL and Al Borg are both contracted facilities. Al Borg provides the most accessible walk-in pricing for routine tests in Al Ain, while NRL handles more complex molecular, genetic, and specialised diagnostic work. Home collection is available through NRL (AED 75 fee) and DarDoc (DOH-licensed in Abu Dhabi emirate including Al Ain). Routine tests such as CBC, lipid profile, and Vitamin D are priced on par with Abu Dhabi island labs, typically AED 75–90 for a CBC and AED 90–120 for Vitamin D.",
    popularAreas: ["Al Ain Central", "Al Jimi", "Al Muwaiji", "Tawam", "Al Hili"],
    visaMedical:
      "Al Ain residency visa medicals are conducted at ADPHC-approved screening centres in the city. The standard package costs AED 330–400, consistent with Abu Dhabi emirate pricing.",
    insuranceTip:
      "Thiqa (Abu Dhabi government insurance) covers lab tests at DOH-licensed NRL and Al Borg branches in Al Ain. Daman Basic holders should confirm coverage at the specific branch before booking. Most major private insurers cover Al Borg and NRL.",
    cbcFrom: 75,
    vitaminDFrom: 90,
    homeCollectionNote:
      "NRL offers home collection in Al Ain for AED 75. DarDoc operates in Abu Dhabi emirate (including Al Ain) with free home collection for most panels.",
  },
};

// Popular tests to highlight per city page (top 6)
const FEATURED_TEST_SLUGS = [
  "cbc",
  "vitamin-d",
  "lipid-profile",
  "thyroid-panel",
  "hba1c",
  "lft",
];

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const base = getBaseUrl();
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return {};

  const labs = getLabsByCity(citySlug);
  const content = CITY_LAB_CONTENT[citySlug];
  const testCount = LAB_TESTS.length;
  const homeCollectionCount = labs.filter((l) => l.homeCollection).length;
  const cbcFrom = content?.cbcFrom ?? 69;
  const regulator = content?.regulatorAbbrev ?? "MOHAP";

  return {
    title: `Lab Tests in ${city.name} — Compare Prices Across ${labs.length} Laboratories | UAE Lab Test Comparison`,
    description: `Compare ${testCount} lab test prices across ${labs.length} diagnostic labs in ${city.name}, UAE. CBC from AED ${cbcFrom}. ${homeCollectionCount} labs offer home collection. ${regulator}-licensed. Find the cheapest blood test in ${city.name}.`,
    alternates: { canonical: `${base}/labs/city/${citySlug}` },
    openGraph: {
      title: `Lab Tests in ${city.name} — Compare Prices Across ${labs.length} Labs`,
      description: `Compare ${testCount} lab test prices across ${labs.length} ${regulator}-licensed diagnostic laboratories in ${city.name}, UAE. Home collection available.`,
      url: `${base}/labs/city/${citySlug}`,
      type: "website",
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LabCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const base = getBaseUrl();

  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const labs = getLabsByCity(citySlug);
  if (labs.length === 0) notFound();

  const content = CITY_LAB_CONTENT[citySlug];
  const homeCollectionLabs = labs.filter((l) => l.homeCollection);

  // Cheapest price across all labs in this city
  const allCityPrices = labs.flatMap((lab) => getPricesForLab(lab.slug));
  const cheapestCityPrice =
    allCityPrices.length > 0
      ? Math.min(...allCityPrices.map((p) => p.price))
      : null;

  // Featured tests with price ranges
  const featuredTests = FEATURED_TEST_SLUGS.map((slug) => {
    const test = LAB_TESTS.find((t) => t.slug === slug);
    if (!test) return null;
    const range = getPriceRange(slug);
    return { ...test, priceRange: range };
  }).filter(Boolean) as (typeof LAB_TESTS[number] & {
    priceRange: ReturnType<typeof getPriceRange>;
  })[];

  // Category test counts
  const categoryTestCounts = TEST_CATEGORIES.map((cat) => ({
    ...cat,
    testCount: getTestsByCategory(cat.slug).length,
  }));

  // FAQ — city-specific
  const faqs = [
    {
      question: `How much does a blood test cost in ${city.name}?`,
      answer: `Blood test prices in ${city.name} start from AED ${content?.cbcFrom ?? 69} for a basic CBC (Complete Blood Count) at standalone diagnostic labs. Vitamin D testing starts from AED ${content?.vitaminDFrom ?? 85}. Comprehensive health check packages covering CBC, lipid profile, glucose, liver, and kidney function are available from AED 99–150 at budget labs, and AED 299–499 for premium wellness panels. Hospital-based labs typically charge 30–50% more than standalone chains for the same tests. All labs in ${city.name} are licensed by the ${content?.regulator ?? "UAE health authority"}.`,
    },
    {
      question: `Can I get a blood test at home in ${city.name}?`,
      answer: `Yes. ${content?.homeCollectionNote ?? `Home blood collection is available in ${city.name} through multiple DHA/MOHAP-licensed providers. A DHA-certified nurse or phlebotomist visits your location and collects samples; results are delivered digitally within 24 hours.`} Most home collection services operate daily from 7 AM to 10–11 PM. Free home collection is available at several labs including Medsol Diagnostics and Thumbay Labs. Some providers charge AED 50–100 for the home visit.`,
    },
    {
      question: `Do I need a prescription for lab tests in ${city.name}?`,
      answer: `No, most standalone diagnostic labs in ${city.name} accept self-referral walk-in patients for routine blood tests without a doctor's prescription. Tests like CBC, Vitamin D, HbA1c, thyroid panel, lipid profile, and liver function are available directly. Home-collection services like DarDoc and Healthchecks360 also operate without prescriptions. Some specialised tests — including genetic testing, molecular diagnostics, certain hormone panels, and biopsy processing — may require a physician's referral. Hospital-based labs in ${city.name} typically require an internal referral from a hospital consultant.`,
    },
    {
      question: `How are labs in ${city.name} regulated?`,
      answer: `All diagnostic laboratories in ${city.name} are licensed and inspected by the ${content?.regulator ?? "UAE health authority"}. The regulator sets standards for equipment calibration, staff qualifications, sample handling, result reporting timelines, and quality control procedures. Many labs hold additional international accreditations on top of the mandatory ${content?.regulatorAbbrev ?? "UAE"} licence — including CAP (College of American Pathologists) accreditation, ISO 15189 (medical laboratories quality standard), and in some cases JCI (Joint Commission International) certification. These international accreditations are voluntary but are widely regarded as markers of premium quality.`,
    },
    {
      question: `Where do I get a visa medical test in ${city.name}?`,
      answer: `${content?.visaMedical ?? `Visa medical tests in ${city.name} are conducted at government-approved health screening centres. The standard package includes blood group typing, HIV test, Hepatitis B antigen, chest X-ray, and tuberculosis screening. Pricing typically ranges from AED 300–400 depending on the emirate. Processing is usually same-day for standard residency visa applications.`}`,
    },
    {
      question: `Which labs in ${city.name} accept health insurance?`,
      answer: `${content?.insuranceTip ?? `Most major diagnostic labs in ${city.name} accept widely used UAE insurance plans including Daman, AXA, Cigna, Bupa, and Oman Insurance. Always confirm that your specific test is covered under your plan and that the lab is on your insurer's network before booking. Some tests may require pre-authorisation from your insurance provider.`} For cash-pay patients, standalone labs generally offer more competitive pricing than hospital-based labs for routine blood work.`,
    },
  ];

  // Schema data
  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: "Lab Test Price Comparison", url: `${base}/labs` },
    { name: `Labs in ${city.name}` },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Diagnostic Laboratories in ${city.name}, UAE`,
    description: `Compare ${LAB_TESTS.length} lab test prices across ${labs.length} ${content?.regulatorAbbrev ?? "UAE"}-licensed diagnostic labs in ${city.name}, UAE.`,
    url: `${base}/labs/city/${citySlug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: labs.length,
      itemListElement: labs.map((lab, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "MedicalOrganization",
          name: lab.name,
          url: `${base}/labs/${lab.slug}`,
          description: lab.description,
          address: {
            "@type": "PostalAddress",
            addressLocality: city.name,
            addressRegion: city.emirate,
            addressCountry: "AE",
          },
        },
      })),
    },
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={collectionPageSchema} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: `${city.name}` },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <FlaskConical className="w-8 h-8 text-[#006828] flex-shrink-0" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Lab Tests in {city.name} — Compare Prices Across {labs.length}{" "}
            Laboratories
          </h1>
        </div>

        {/* Answer block 1 — short editorial intro */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {content?.intro ??
              `Compare lab test prices across ${labs.length} ${content?.regulatorAbbrev ?? "MOHAP"}-licensed diagnostic laboratories in ${city.name}, UAE. CBC from AED ${content?.cbcFrom ?? 69}. Vitamin D from AED ${content?.vitaminDFrom ?? 85}. ${homeCollectionLabs.length} labs offer home sample collection — many for free.`}
          </p>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Microscope className="w-4 h-4" />,
              value: labs.length.toString(),
              label: `Labs in ${city.name}`,
            },
            {
              icon: <Activity className="w-4 h-4" />,
              value: LAB_TESTS.length.toString(),
              label: "Tests available",
            },
            {
              icon: <TrendingDown className="w-4 h-4" />,
              value: cheapestCityPrice
                ? formatPrice(cheapestCityPrice)
                : `AED ${content?.cbcFrom ?? 69}`,
              label: "Cheapest test from",
            },
            {
              icon: <Home className="w-4 h-4" />,
              value: homeCollectionLabs.length.toString(),
              label: "With home collection",
            },
          ].map(({ icon, value, label }) => (
            <div
              key={label}
              className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5 text-center"
            >
              <div className="flex justify-center mb-1 text-[#006828]">{icon}</div>
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Labs in City ─────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Laboratories in {city.name}</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        All {labs.length} diagnostic labs below are licensed by the{" "}
        {content?.regulator ?? "UAE health authority"} and operate in{" "}
        {city.name}. Click any lab to compare its full test menu and prices.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {labs.map((lab) => {
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

      {/* ── Section: Test Categories ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Test Categories</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Browse tests by category. Each category page shows prices for that test
        type across all {labs.length} labs in {city.name}.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {categoryTestCounts.map((cat) => (
          <Link
            key={cat.slug}
            href={`/labs/city/${citySlug}/${cat.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {cat.name}
              </h3>
              <ChevronRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] transition-colors" />
            </div>
            <p className="text-[11px] text-black/40">{cat.testCount} tests</p>
          </Link>
        ))}
      </div>

      {/* ── Section: Popular Tests in City ───────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Popular Tests in {city.name}</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        The most frequently ordered lab tests in {city.name}. Click any test to
        compare prices across all{" "}
        {content?.regulatorAbbrev ?? "UAE"}-licensed labs.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {featuredTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-[#006828]/15 transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-black/40 line-clamp-1">{test.name}</p>
              <span className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5 font-medium capitalize inline-block mt-1">
                {test.category.replace(/-/g, " ")}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              {test.priceRange ? (
                <>
                  <p className="text-sm font-bold text-[#006828]">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-black/40">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-black/40">
                    {test.priceRange.labCount} lab
                    {test.priceRange.labCount !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <p className="font-['Geist',sans-serif] text-xs text-black/40">Prices vary</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Answer block 2 — deep editorial ──────────────────────── */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-10 bg-[#f8f8f6] border border-black/[0.06] p-5" data-answer-block="true">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#006828] flex-shrink-0" />
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
            Lab Testing in {city.name} — What You Need to Know
          </h2>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
          {content?.deepDive ??
            `Lab testing in ${city.name} is regulated by the ${content?.regulator ?? "UAE Ministry of Health and Prevention (MOHAP)"}. All licensed diagnostic laboratories must meet national quality standards and are subject to regular inspection. Most routine blood tests — including CBC, lipid profile, liver and kidney function, and glucose — do not require a doctor's prescription at standalone labs. Vitamin D deficiency is particularly prevalent among UAE residents despite abundant sunshine, due to indoor lifestyles and protective clothing; routine screening is recommended annually. Home collection is available across ${city.name} through multiple licensed providers. Always confirm that your chosen lab is on your insurance plan's network before booking.`}
        </p>

        {/* Popular areas */}
        {content?.popularAreas && content.popularAreas.length > 0 && (
          <div className="mt-4 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">Lab hubs in {city.name}:</span>{" "}
              {content.popularAreas.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <FaqSection
        faqs={faqs}
        title={`Lab Tests in ${city.name} — Frequently Asked Questions`}
      />

      {/* ── Cross-links: other cities ─────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Compare Lab Prices in Other Cities</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CITIES.filter((c) => c.slug !== citySlug).map((otherCity) => {
            const otherLabs = getLabsByCity(otherCity.slug);
            return (
              <Link
                key={otherCity.slug}
                href={`/labs/city/${otherCity.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                    {otherCity.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828]" />
                </div>
                <p className="text-[11px] text-black/40">
                  {otherLabs.length} lab{otherLabs.length !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative, based on
          publicly available pricing from lab websites, aggregator platforms
          (ServiceMarket, Healthchecks360, DarDoc), and published walk-in price
          lists (2024–2025). Actual prices may vary by branch location, insurance
          coverage, ongoing promotions, and specific test methodology. Always
          confirm pricing directly with the laboratory before booking. This page is
          for informational purposes only and does not constitute medical advice.
          Consult a qualified physician before ordering laboratory tests.
          Laboratory data sourced from{" "}
          {content?.regulator ?? "UAE health authority"} licensed facility
          registers. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
