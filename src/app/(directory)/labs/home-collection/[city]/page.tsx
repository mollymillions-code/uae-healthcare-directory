import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowRight,
  Award,
  Shield,
  Microscope,
  TestTube,
  UserCheck,
  Smartphone,
  FileText,
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
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

// ─── Static Params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return CITIES.filter((city) =>
    getLabsByCity(city.slug).some((l) => l.homeCollection)
  ).map((city) => ({ city: city.slug }));
}

export const revalidate = 43200;

// ─── City-Specific Content ────────────────────────────────────────────────────

interface CityHomeContent {
  regulator: string;
  regulatorAbbrev: "DHA" | "DOH" | "MOHAP";
  regulatorFullNote: string;
  turnaround: string;
  intro: string;
  howItWorks: string;
  coverageNote: string;
  areas: string[];
  insuranceNote: string;
  fastingTip: string;
}

const CITY_HOME_CONTENT: Record<string, CityHomeContent> = {
  dubai: {
    regulator: "Dubai Health Authority (DHA)",
    regulatorAbbrev: "DHA",
    regulatorFullNote:
      "All home collection nurses operating in Dubai must hold a current DHA nursing or phlebotomy licence. The DHA inspects home healthcare providers annually and sets mandatory cold-chain transport standards for biological samples.",
    turnaround: "6–24 hours",
    intro:
      "Dubai has the most developed home collection market in the UAE. Home-service platforms like DarDoc and Healthchecks360 were built specifically for the Dubai residential market, deploying DHA-licensed phlebotomists across Jumeirah, JLT, Dubai Marina, Business Bay, Mirdif, and the inner suburbs seven days a week. Traditional lab chains — Al Borg, Medsol, Alpha Medical, STAR Metropolis, Unilabs, and MenaLabs — have added home collection as a parallel service channel to their branch networks. The result is one of the most price-competitive home testing environments in the region.",
    howItWorks:
      "Book via the lab's app or website, or call directly. Choose a time window — most Dubai services run 7 AM to 10 or 11 PM daily, with DarDoc extending to 11 PM. A DHA-licensed nurse arrives at your home, hotel, or office with all sterile equipment. The draw takes 10–15 minutes. Samples are sealed and transported in temperature-controlled containers to the partner lab for processing. Results reach you by app notification, email, or WhatsApp PDF within 6–24 hours for routine tests.",
    coverageNote:
      "Coverage extends across all major Dubai districts including Old Dubai (Deira, Bur Dubai, Al Karama), mid-town (Al Qusais, Al Nahda, Mirdif), new developments (Dubai Marina, JLT, JBR, Palm Jumeirah, Dubai Hills), and business districts (DIFC, Business Bay, DHCC, Downtown). Al Quoz industrial clients and Jebel Ali are covered by select providers — confirm coverage when booking.",
    areas: [
      "Jumeirah", "Dubai Marina", "JLT", "Business Bay", "Downtown Dubai",
      "Deira", "Bur Dubai", "Al Karama", "Mirdif", "Dubai Hills", "Palm Jumeirah",
    ],
    insuranceNote:
      "Most DHA-licensed labs in Dubai are contracted with Daman, AXA Gulf, Cigna, Bupa Arabia, and Dubai Insurance Company. The home collection visit fee is typically treated as an out-of-pocket convenience charge by insurers, but the tests themselves are often reimbursable. DarDoc and ServiceMarket work with select insurance partners — call to confirm your plan.",
    fastingTip:
      "For fasting tests (lipid profile, fasting glucose, HbA1c, insulin, iron studies), book the earliest available morning slot. Stop eating 8–12 hours before. Water, black coffee (no milk or sugar), and regular medications are generally fine unless your doctor advises otherwise. Drinking at least 500 ml of water 30 minutes before collection makes veins easier to access and reduces the chance of a failed draw.",
  },
  "abu-dhabi": {
    regulator: "Department of Health Abu Dhabi (DOH)",
    regulatorAbbrev: "DOH",
    regulatorFullNote:
      "All home collection services in Abu Dhabi must be licensed by the Department of Health (DOH). The DOH requires phlebotomists to hold a current health professional licence, and sample transport must comply with biosafety standards for category B biological substances.",
    turnaround: "12–24 hours",
    intro:
      "Abu Dhabi's home collection market is anchored by two institutional-grade providers: PureLab, the UAE's largest AI-powered standalone diagnostic lab (part of the PureHealth group), and National Reference Laboratory (NRL), the capital's primary clinical reference lab within the M42/Mubadala Health ecosystem. Both offer DOH-supervised home collection. DarDoc (DOH-licensed) and ServiceMarket extend the home-service model to a broader range of price points. PureLab's free home collection and 12-hour turnaround are the standout offering for Abu Dhabi residents.",
    howItWorks:
      "Book online, via app, or by phone with your preferred provider. PureLab and NRL operate extended hours across Abu Dhabi island and the western and eastern suburbs. DarDoc and ServiceMarket have flexible booking windows. A DOH-licensed phlebotomist arrives at your home or office, collects blood (and urine if required), and transports samples to the processing lab. Results for routine tests (CBC, chemistry, thyroid) are ready within 12–24 hours — PureLab is typically faster due to its AI-assisted processing pipeline.",
    coverageNote:
      "Home collection covers Abu Dhabi island (Corniche, Al Reem Island, Al Khalidiyah, Al Maryah Island), mainland suburbs (Khalifa City, Mohammed Bin Zayed City, Al Shamkha, Masdar City), and Al Maqta. Outlying areas such as Al Rahba, Yas Island, and Saadiyat Island are covered by select providers — confirm at booking.",
    areas: [
      "Al Reem Island", "Corniche", "Khalifa City", "Mohammed Bin Zayed City",
      "Al Maryah Island", "Masdar City", "Saadiyat Island", "Yas Island",
    ],
    insuranceNote:
      "Abu Dhabi's Daman (mandatory health insurance) and Thiqa (government employees) programmes cover laboratory tests at DOH-licensed facilities. PureLab and NRL are both contracted with Daman. The home collection visit fee may be covered under enhanced Thiqa benefits — check with your HR department. MenaLabs and Medsol Diagnostics also accept Daman for walk-in tests, though their Abu Dhabi home collection coverage is more limited.",
    fastingTip:
      "Many of the most common tests ordered in Abu Dhabi — lipid profile, fasting glucose, insulin, LFT — require a minimum 8-hour fast. Schedule your home collection for 7–9 AM to minimise disruption to your day. Keep your Emirates ID handy for the nurse's identity verification step. If you are collecting for a government occupational health or visa requirement, confirm that your chosen provider issues official DOH-stamped reports.",
  },
  sharjah: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "Diagnostic laboratories and home healthcare services in Sharjah are licensed by the Ministry of Health and Prevention (MOHAP). MOHAP enforces national clinical laboratory standards and requires home collection nurses to hold a valid MOHAP or equivalent health authority licence.",
    turnaround: "18–24 hours",
    intro:
      "Sharjah is served by three home collection providers with meaningful coverage across the emirate: Thumbay Labs (CAP-accredited, part of Gulf Medical University's Thumbay Group, with a strong Al Nahda and Al Taawun presence), Medsol Diagnostics (free collection, budget-friendly pricing), and Healthchecks360 (a home-service platform with broad Northern Emirates reach). ServiceMarket also covers parts of Sharjah. For Sharjah residents commuting to Dubai, several Dubai-based providers can also reach Al Nahda and Al Qasimia — confirm with the provider at booking.",
    howItWorks:
      "Call or book online with Thumbay Labs, Medsol, or Healthchecks360. Operating hours in Sharjah are typically 7:30 AM to 9 PM (Thumbay) and 7 AM to 10 PM (Healthchecks360). A MOHAP-licensed phlebotomist visits your location with sterile equipment. Samples are transported to the Sharjah processing lab (Thumbay Lab in Ajman, Medsol hub in Dubai, or Healthchecks360's partner lab). Routine results are ready in 18–24 hours. The slightly longer turnaround compared to Dubai reflects transport logistics from the Northern Emirates.",
    coverageNote:
      "Core coverage spans Al Nahda, Al Majaz, Al Taawun, Al Qasimia, Muwaileh, and University City. Areas near the Sharjah–Ajman border (Al Jurf, Al Rashidiya) are accessible from both Sharjah and Ajman-based providers. Remote areas and industrial zones (Hamriyah, Khorfakkan highway corridor) may have limited availability — confirm before booking.",
    areas: [
      "Al Nahda", "Al Majaz", "Al Taawun", "Al Qasimia", "Muwaileh",
      "University City", "Al Rashidiya", "Al Khan", "Al Qulayaa",
    ],
    insuranceNote:
      "MOHAP regulates insurance coverage for lab tests in Sharjah. Most major UAE insurers (Daman, AXA, Cigna, Oman Insurance) cover laboratory tests at MOHAP-licensed facilities. Home collection fees are usually out-of-pocket. Thumbay Labs is widely contracted with UAE corporate health plans — check your employee benefit booklet or insurer portal.",
    fastingTip:
      "For residents in Sharjah ordering fasting blood tests, the morning slot is especially important given slightly longer turnaround times. Book the night before for a 7 AM draw. Inform the phlebotomist of any medications you are taking — some labs request medication lists for accurate result interpretation. Thumbay Labs can issue MOHAP-compliant reports for occupational health and visa purposes.",
  },
  ajman: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "Ajman's diagnostic labs and home healthcare services are regulated by MOHAP. All home collection nurses must hold valid federal health professional licences, and samples are transported to MOHAP-licensed processing laboratories.",
    turnaround: "18–24 hours",
    intro:
      "Thumbay Labs — headquartered in Ajman at Gulf Medical University — is the primary home collection provider serving Ajman residents. With free home collection and CAP accreditation, Thumbay offers the strongest combination of quality and value in the emirate. Healthchecks360 also covers Ajman within its Northern Emirates service area. For Ajman residents near the Sharjah border, Sharjah-based providers (Medsol, ServiceMarket) may also be accessible.",
    howItWorks:
      "Book via Thumbay Labs or Healthchecks360 by phone or their online platforms. A MOHAP-licensed phlebotomist visits your home or office. Because Ajman is compact and the Thumbay Labs processing facility is local, turnaround times are among the better ones in the Northern Emirates — routine blood work is typically ready in 18–24 hours.",
    coverageNote:
      "Coverage spans the main Ajman city area, Al Jurf, Al Nuaimia, Al Rashidiya, and Al Rumaila. Industrial zones and the Ajman Free Zone are served by select providers. Confirm coverage for remote residential areas (Al Hamidiya, Al Tallah) at booking.",
    areas: ["Al Nuaimia", "Al Jurf", "Al Rashidiya", "Al Rumaila", "Al Hamidiya"],
    insuranceNote:
      "Thumbay Labs accepts most major UAE insurance plans including Daman, AXA, NAS, and Oman Insurance. Home collection fees are typically out-of-pocket. For corporate accounts with Thumbay Group (which also operates Gulf Medical University Hospital), bulk billing arrangements may apply.",
    fastingTip:
      "Book morning slots for fasting tests — Thumbay Labs starts home collection at 7:30 AM. Since Thumbay's Ajman headquarters and processing lab are in close proximity, the sample transport window is shorter than for labs that ship to Dubai. This can mean faster results for urgent panels.",
  },
  "ras-al-khaimah": {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "Ras Al Khaimah's healthcare services are regulated by MOHAP. All diagnostic laboratories and home collection services must be licensed under the federal framework, with nurses and phlebotomists holding current national health authority licences.",
    turnaround: "24 hours",
    intro:
      "Al Borg Diagnostics, with its UAE-wide branch network, is the primary home collection provider in Ras Al Khaimah. As the GCC's largest private lab chain, Al Borg offers CAP, JCI, and ISO 15189 accreditation and charges AED 50 for home collection visits. Coverage extends across RAK city and the surrounding residential areas. For residents in Dhayah, Sha'am, or Dafan Al Nakheel, confirm coverage with Al Borg at booking as these areas are further from the main branch network.",
    howItWorks:
      "Book via Al Borg's website or app, or call the RAK branch directly. A licensed phlebotomist arrives at your location within the agreed window. Samples are processed at the local Al Borg facility or transported to the nearest accredited hub. Routine results are ready within 24 hours. For specialised or reference tests, Al Borg may route samples through its Riyadh reference lab, which can extend turnaround to 48–72 hours.",
    coverageNote:
      "Primary coverage spans RAK city (Al Nakheel, Al Qawasim Corniche, Al Uraibi), Khuzam, Al Hamra, Mina Al Arab, and Al Jazeera Al Hamra. Outlying areas (Sha'am, Ghalilah, Khatt) may have limited availability — call to confirm before booking.",
    areas: [
      "Al Nakheel", "Al Qawasim Corniche", "Khuzam", "Al Hamra",
      "Mina Al Arab", "Al Uraibi",
    ],
    insuranceNote:
      "Al Borg Diagnostics is contracted with most UAE and GCC insurance networks. The AED 50 home collection fee is usually not covered by insurance — it is a convenience surcharge. For tests covered by Thiqa, Daman, or corporate plans, the individual test costs are typically reimbursable. Check with your insurer whether Al Borg RAK is included in your in-network list.",
    fastingTip:
      "Schedule morning fasting draws for 7–9 AM to ensure the nurse arrives while you are still fasting. RAK phlebotomists typically carry all equipment; no preparation of your home is needed. For fasting glucose, lipid profile, or insulin tests, drink at least 300–500 ml of water beforehand to aid venous access.",
  },
  fujairah: {
    regulator: "Ministry of Health and Prevention (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "Fujairah's diagnostic and home health services fall under MOHAP federal licensing. All healthcare professionals conducting home visits must hold current national licences, and processing labs must meet MOHAP quality standards for clinical chemistry.",
    turnaround: "24 hours",
    intro:
      "Thumbay Labs' Northern Emirates network extends into Fujairah, making it the primary home collection option for residents on the east coast. Given Fujairah's more dispersed geography compared to Dubai or Abu Dhabi, home collection here is best suited for residents in the main city area. Those in Dibba, Khor Fakkan, or Kalba should confirm availability directly with Thumbay as service reach varies.",
    howItWorks:
      "Book with Thumbay Labs by calling the nearest branch or using their online booking form. A MOHAP-licensed phlebotomist visits your home. Given the logistics involved in getting samples from Fujairah to the processing facility (typically the Ajman or Sharjah hub), turnaround time is approximately 24 hours for routine tests — slightly longer than in Dubai or Abu Dhabi.",
    coverageNote:
      "Core coverage is the Fujairah city area (Al Faseel, Merashid, Rugaylat, Fujairah Corniche). Outlying coastal towns (Dibba, Khor Fakkan, Kalba) may be available on request but require advance planning.",
    areas: ["Fujairah City", "Al Faseel", "Merashid", "Rugaylat"],
    insuranceNote:
      "Thumbay Labs accepts major UAE insurance plans. Given Fujairah's status as part of the federal MOHAP zone, most national insurance plans that cover MOHAP-licensed labs will apply. Home collection fees are out-of-pocket. Call Thumbay to confirm insurance acceptance and whether your specific tests require pre-authorisation.",
    fastingTip:
      "Because sample transport from Fujairah to the processing lab adds time, book fasting tests early in the morning to maximise the window before results are needed. Thumbay aims for 24-hour turnaround; urgent panels may be prioritised if flagged at booking.",
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { city: string };
}): Metadata {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) return { title: "City Not Found" };

  const base = getBaseUrl();
  const homeCollectionLabs = getLabsByCity(city.slug).filter((l) => l.homeCollection);
  const freeCount = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0).length;
  const n = homeCollectionLabs.length;
  const content = CITY_HOME_CONTENT[city.slug];
  const regulatorAbbrev = content?.regulatorAbbrev ?? "UAE health authority";

  return {
    title: `At-Home Blood Tests in ${city.name} — ${n} Lab${n !== 1 ? "s" : ""} With Home Collection | UAE Lab Tests`,
    description:
      `Compare ${n} labs offering at-home blood test collection in ${city.name}. ` +
      `${freeCount} offer free home collection. ` +
      `${regulatorAbbrev}-licensed nurses visit your home. Results within 24 hours. Book online.`,
    alternates: { canonical: `${base}/labs/home-collection/${city.slug}` },
    openGraph: {
      title: `At-Home Blood Tests in ${city.name} — ${n} Labs | UAE Lab Tests`,
      description: `${n} labs offer home blood test collection in ${city.name}. ${freeCount} free. ${regulatorAbbrev}-licensed nurses, digital results within 24h.`,
      url: `${base}/labs/home-collection/${city.slug}`,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomeCollectionCityPage({
  params,
}: {
  params: { city: string };
}) {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const allCityLabs = getLabsByCity(city.slug);
  const homeCollectionLabs = allCityLabs
    .filter((l) => l.homeCollection)
    .sort((a, b) => {
      // Free first, then by cheapest test price
      if (a.homeCollectionFee !== b.homeCollectionFee) return a.homeCollectionFee - b.homeCollectionFee;
      const aMin = getPricesForLab(a.slug).reduce((m, p) => Math.min(m, p.price), Infinity);
      const bMin = getPricesForLab(b.slug).reduce((m, p) => Math.min(m, p.price), Infinity);
      return aMin - bMin;
    });

  if (homeCollectionLabs.length === 0) notFound();

  const freeCollectionLabs = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0);
  const fastestTurnaround = Math.min(...homeCollectionLabs.map((l) => l.turnaroundHours));

  // All home-collection-lab slugs for this city
  const homeLabSlugs = new Set(homeCollectionLabs.map((l) => l.slug));

  // Count distinct tests available via home collection labs
  const homeCollectionTestSlugs = new Set(
    LAB_TEST_PRICES.filter((p) => homeLabSlugs.has(p.labSlug)).map((p) => p.testSlug)
  );

  // Categories represented by those tests (exclude imaging)
  const homeCollectionCategories = TEST_CATEGORIES.filter(
    (cat) =>
      cat.slug !== "imaging" &&
      LAB_TESTS.some((t) => t.category === cat.slug && homeCollectionTestSlugs.has(t.slug))
  );

  // Top 8 popular tests from home-collection labs in this city
  const POPULAR_SLUGS = [
    "cbc", "vitamin-d", "thyroid-panel", "hba1c", "lipid-profile",
    "vitamin-b12", "lft", "kft",
  ];
  const popularHomeTests = POPULAR_SLUGS
    .filter((slug) => homeCollectionTestSlugs.has(slug))
    .map((slug) => {
      const test = LAB_TESTS.find((t) => t.slug === slug)!;
      const prices = LAB_TEST_PRICES.filter(
        (p) => p.testSlug === slug && homeLabSlugs.has(p.labSlug)
      );
      const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : null;
      return { test, minPrice, maxPrice, labCount: prices.length };
    })
    .filter((t) => t.minPrice !== null);

  // Other cities with home collection (for cross-links)
  const otherCitiesWithHome = CITIES.filter(
    (c) =>
      c.slug !== city.slug &&
      getLabsByCity(c.slug).some((l) => l.homeCollection)
  );

  const content = CITY_HOME_CONTENT[city.slug] ?? {
    regulator: "UAE health authority",
    regulatorAbbrev: "UAE",
    regulatorFullNote:
      "All home collection services in this emirate operate under the relevant UAE health authority licensing framework.",
    turnaround: "24 hours",
    intro: `Home blood test collection is available in ${city.name} through licensed diagnostic labs and home-service platforms.`,
    howItWorks:
      "Book online or by phone, choose a time window, and a licensed nurse visits your home or office to draw blood samples. Results are delivered digitally within 24 hours.",
    coverageNote: `Coverage spans the main ${city.name} city area. Confirm availability for your specific district when booking.`,
    areas: [],
    insuranceNote:
      "Most major UAE health insurance plans cover the cost of individual lab tests at licensed facilities. Home collection visit fees are usually out-of-pocket.",
    fastingTip:
      "For fasting tests, stop eating 8–12 hours before your collection. Drink water and take regular medications as normal unless your doctor advises otherwise.",
  };

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Home Collection", url: `${base}/labs/home-collection` },
    { name: city.name },
  ];

  const faqs = [
    {
      question: `How much does home blood test collection cost in ${city.name}?`,
      answer:
        `Home collection fees in ${city.name} range from free to AED ${Math.max(...homeCollectionLabs.map((l) => l.homeCollectionFee))}. ` +
        `${freeCollectionLabs.length > 0 ? `${freeCollectionLabs.map((l) => l.name).join(", ")} offer completely free home collection — you pay only for the tests themselves. ` : ""}` +
        `Individual test prices from home-collection labs are similar to walk-in rates. A basic CBC starts from AED ${popularHomeTests.find((t) => t.test.slug === "cbc")?.minPrice ?? 69}.`,
    },
    {
      question: `How long does it take to get a home collection nurse in ${city.name}?`,
      answer:
        `Most home collection services in ${city.name} aim to send a ${content.regulatorAbbrev}-licensed nurse within 30–90 minutes of booking, or at a pre-booked time slot. ` +
        `Operating hours are typically 7 AM to 9 or 11 PM daily. For fasting draws, book the night before and schedule a 7–8 AM slot to make the wait as short as possible.`,
    },
    {
      question: `Is home blood collection safe in ${city.name}?`,
      answer:
        `Yes. All home collection services in ${city.name} must operate under ${content.regulator} licensing. ` +
        `Phlebotomists use single-use sterile needles and vacutainer systems, follow infection control protocols, and transport samples in validated cold-chain containers to ${content.regulatorAbbrev}-accredited processing labs. ` +
        `The clinical quality of results is equivalent to a walk-in lab visit.`,
    },
    {
      question: `Which areas in ${city.name} are covered for home blood tests?`,
      answer:
        content.coverageNote +
        (content.areas.length > 0
          ? ` Key coverage areas include ${content.areas.slice(0, 6).join(", ")}.`
          : ""),
    },
    {
      question: `Does insurance cover home blood test collection in ${city.name}?`,
      answer: content.insuranceNote,
    },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `At-Home Lab Test Collection in ${city.name}`,
    description: `Compare ${homeCollectionLabs.length} labs offering home blood test collection in ${city.name}. ${freeCollectionLabs.length} free. ${content.regulatorAbbrev}-licensed nurses, results in ${content.turnaround}.`,
    url: `${base}/labs/home-collection/${city.slug}`,
    numberOfItems: homeCollectionLabs.length,
    itemListElement: homeCollectionLabs.map((lab, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalClinic",
        name: lab.name,
        url: `${base}/labs/${lab.slug}`,
        description: lab.description,
      },
    })),
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
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            At-Home Lab Tests in {city.name} — {homeCollectionLabs.length} Lab{homeCollectionLabs.length !== 1 ? "s" : ""} With Home Collection
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {content.intro}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: homeCollectionLabs.length.toString(),
              label: `Labs with home collection in ${city.name}`,
            },
            {
              value: freeCollectionLabs.length.toString(),
              label: "Offer free home collection",
            },
            {
              value: `${fastestTurnaround}h`,
              label: "Fastest turnaround available",
            },
            {
              value: homeCollectionTestSlugs.size.toString(),
              label: "Tests available at home",
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

      {/* Labs offering home collection */}
      <div className="section-header">
        <h2>Labs Offering Home Collection in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          The {homeCollectionLabs.length} labs below all offer home blood test collection
          in {city.name}. Sorted by collection fee (free first), then by lowest
          test price. All operate under {content.regulator} licensing.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {homeCollectionLabs.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest =
            prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
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

      {/* Free vs Paid Comparison Table */}
      <div className="section-header">
        <h2>Free vs Paid Home Collection in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          Of the {homeCollectionLabs.length} labs offering home collection in {city.name},{" "}
          {freeCollectionLabs.length} charge nothing for the visit itself.
          The remaining {homeCollectionLabs.length - freeCollectionLabs.length} labs
          charge a home visit fee on top of the individual test prices.
        </p>
      </div>
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-xs border border-light-200">
          <thead>
            <tr className="bg-light-50">
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Lab</th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">
                Collection Fee
              </th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">
                Turnaround
              </th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">
                Accreditations
              </th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">
                Tests Available
              </th>
            </tr>
          </thead>
          <tbody>
            {homeCollectionLabs.map((lab, i) => {
              const labTestCount = LAB_TEST_PRICES.filter(
                (p) => p.labSlug === lab.slug
              ).length;
              return (
                <tr
                  key={lab.slug}
                  className={i % 2 === 0 ? "bg-white" : "bg-light-50"}
                >
                  <td className="p-3 border-b border-light-200">
                    <Link
                      href={`/labs/${lab.slug}`}
                      className="font-bold text-dark hover:text-accent transition-colors"
                    >
                      {lab.name}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">
                      {lab.type === "home-service"
                        ? "Home-service platform"
                        : "Lab chain"}
                    </div>
                  </td>
                  <td className="p-3 border-b border-light-200">
                    {lab.homeCollectionFee === 0 ? (
                      <span className="font-bold text-accent">Free</span>
                    ) : (
                      <span className="font-medium text-dark">
                        AED {lab.homeCollectionFee}
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-b border-light-200 text-muted">
                    {lab.turnaroundHours}h
                  </td>
                  <td className="p-3 border-b border-light-200 text-muted">
                    {lab.accreditations.slice(0, 3).join(", ")}
                  </td>
                  <td className="p-3 border-b border-light-200 text-muted">
                    {labTestCount > 0 ? `${labTestCount} tests` : "Contact lab"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Test Categories Available */}
      <div className="section-header">
        <h2>Test Categories Available at Home in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          The {homeCollectionCategories.length} categories below all have at least one
          test available from a home-collection lab in {city.name}. Click any
          category to see all available tests with prices from labs offering home
          collection.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {homeCollectionCategories.map((cat) => {
          const catTests = LAB_TESTS.filter(
            (t) => t.category === cat.slug && homeCollectionTestSlugs.has(t.slug)
          );
          return (
            <Link
              key={cat.slug}
              href={`/labs/home-collection/${city.slug}/${cat.slug}`}
              className="border border-light-200 p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-muted mt-1">
                {catTests.length} test{catTests.length !== 1 ? "s" : ""} available at home
              </p>
              <div className="flex items-center gap-1 mt-2 text-accent text-xs font-medium">
                <span>Compare</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Popular Tests for Home Collection */}
      <div className="section-header">
        <h2>Popular Tests for Home Collection in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          Price ranges below are from home-collection labs in {city.name} only.
          Prices are similar to walk-in rates — your only additional cost may be
          the home collection fee (free at {freeCollectionLabs.length} labs).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {popularHomeTests.map(({ test, minPrice, maxPrice, labCount }) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {test.fastingRequired ? "Fasting required · " : "No fasting · "}
                {test.turnaroundHours}h turnaround
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-accent">
                {formatPrice(minPrice!)}
              </p>
              {minPrice !== maxPrice && (
                <p className="text-[10px] text-muted">
                  – {formatPrice(maxPrice!)}
                </p>
              )}
              <p className="text-[10px] text-muted">{labCount} labs</p>
            </div>
          </Link>
        ))}
      </div>

      {/* How home collection works in this city */}
      <div className="section-header">
        <h2>How Home Collection Works in {city.name}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed">{content.howItWorks}</p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            icon: Smartphone,
            step: "1",
            title: "Book Online or by Phone",
            body: `Select your tests and a time window on the lab's website, app, or by calling directly. Most ${city.name} services run 7 AM to 9–11 PM daily. For fasting tests, book the night before and choose a 7–8 AM slot.`,
          },
          {
            icon: UserCheck,
            step: "2",
            title: `${content.regulatorAbbrev}-Licensed Nurse Arrives`,
            body: `A ${content.regulatorAbbrev}-licensed phlebotomist arrives at your home, office, or hotel at the booked time. They carry sterile needles, vacutainers, antiseptic wipes, sample labels, and a cold-chain transport bag.`,
          },
          {
            icon: TestTube,
            step: "3",
            title: "Sample Collected",
            body: "The nurse draws blood (and urine if required) using standard technique. The visit takes 10–15 minutes. Samples are sealed, labelled, and placed in temperature-controlled containers immediately.",
          },
          {
            icon: FileText,
            step: "4",
            title: `Digital Results in ${content.turnaround}`,
            body: "Samples reach the processing lab within hours. Results are delivered via secure app, email, or WhatsApp PDF. Most providers allow you to share results directly with your doctor.",
          },
        ].map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="border border-light-200 p-4 bg-light-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step}
              </div>
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold text-dark text-sm mb-2">{title}</h3>
            <p className="text-xs text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Regulatory note */}
      <div className="bg-light-50 border border-light-200 p-5 mb-10">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              {content.regulator} licensing
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {content.regulatorFullNote}
            </p>
          </div>
        </div>
      </div>

      {/* Fasting prep */}
      <div className="bg-light-50 border border-light-200 p-5 mb-10">
        <div className="flex items-start gap-3">
          <Microscope className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              Preparation tips for home collection in {city.name}
            </p>
            <p className="text-xs text-muted leading-relaxed">{content.fastingTip}</p>
          </div>
        </div>
      </div>

      {/* Insurance note */}
      <div className="bg-light-50 border border-light-200 p-5 mb-10">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              Insurance &amp; coverage in {city.name}
            </p>
            <p className="text-xs text-muted leading-relaxed">{content.insuranceNote}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`Home Blood Test Collection in ${city.name} — Frequently Asked Questions`}
      />

      {/* Other cities */}
      {otherCitiesWithHome.length > 0 && (
        <>
          <div className="section-header mt-8">
            <h2>Home Collection in Other UAE Cities</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {otherCitiesWithHome.map((otherCity) => {
              const otherHomeLabs = getLabsByCity(otherCity.slug).filter(
                (l) => l.homeCollection
              );
              return (
                <Link
                  key={otherCity.slug}
                  href={`/labs/home-collection/${otherCity.slug}`}
                  className="border border-light-200 p-3 hover:border-accent transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                      {otherCity.name}
                    </h3>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
                    <Home className="w-3 h-3 text-accent" />
                    {otherHomeLabs.length} labs
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Browse all */}
      <div className="border border-light-200 p-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold text-dark">
            Compare all home collection services in the UAE
          </p>
          <p className="text-xs text-muted mt-0.5">
            {homeCollectionLabs.length} labs in {city.name} · see all UAE cities
          </p>
        </div>
        <Link
          href="/labs/home-collection"
          className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors flex-shrink-0"
        >
          All cities <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Home collection fee and pricing information
          is based on publicly available data from lab websites and aggregator
          platforms (2024–2025). Actual fees may vary by location, time of day,
          insurance coverage, and promotional offers. Always confirm pricing and
          availability directly with the provider before booking. This directory
          is for informational purposes only and does not constitute medical advice.
          Consult a physician before ordering diagnostic tests. All listed providers
          operate under {content.regulator} licensing. Data last verified March 2026.
        </p>
      </div>
    </div>
  );
}
