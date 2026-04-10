/**
 * Shared filter page component for GCC countries (Qatar, Saudi Arabia, Bahrain, Kuwait).
 * Handles 24-hour, emergency, and walk-in healthcare filter pages for each city.
 *
 * Mirrors the UAE /directory/[city]/24-hour pattern but parameterized by country code.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategories,
  get24HourProviders,
  getEmergencyProviders,
  getWalkInProviders,
  type LocalProvider,
} from "@/lib/data";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getCitiesByCountry,
  cityBelongsToCountry,
  COUNTRY_NAMES,
  COUNTRY_LOCALES,
  type GccCountryCode,
} from "@/lib/country-directory-utils";

export type FilterKind = "24-hour" | "emergency" | "walk-in";

interface Props {
  countryCode: GccCountryCode;
  citySlug: string;
  filter: FilterKind;
}

// ── Country-specific content ─────────────────────────────────────────────────

const REGULATORS: Record<GccCountryCode, string> = {
  qa: "the Ministry of Public Health (MOPH) and Qatar Council for Healthcare Practitioners (QCHP)",
  sa: "the Saudi Ministry of Health (MOH) and Saudi Commission for Health Specialties (SCFHS)",
  bh: "the National Health Regulatory Authority (NHRA)",
  kw: "the Kuwait Ministry of Health (MOH)",
};

const CURRENCIES: Record<GccCountryCode, { code: string; symbol: string; lowGP: number; highGP: number; lowED: number; highED: number }> = {
  qa: { code: "QAR", symbol: "QAR", lowGP: 200, highGP: 500, lowED: 300, highED: 1200 },
  sa: { code: "SAR", symbol: "SAR", lowGP: 150, highGP: 400, lowED: 250, highED: 1000 },
  bh: { code: "BHD", symbol: "BHD", lowGP: 15, highGP: 40, lowED: 25, highED: 100 },
  kw: { code: "KWD", symbol: "KWD", lowGP: 15, highGP: 50, lowED: 30, highED: 120 },
};

const INSURANCE_PROVIDERS: Record<GccCountryCode, string> = {
  qa: "Qatar Insurance, Daman Health, AXA Qatar, MetLife, and the Hamad Health Card",
  sa: "Bupa Arabia, Tawuniya, MedGulf, Allianz Saudi, and CCHI-mandated plans",
  bh: "Bahrain National Insurance, SIO (Social Insurance Organization), AXA Gulf, and GIG Insurance",
  kw: "Gulf Insurance Group, Warba Insurance, Al Ahleia, and Afiya (mandatory expat health insurance)",
};

const FILTER_LABELS: Record<FilterKind, { title: string; urlSegment: string; description: string }> = {
  "24-hour": {
    title: "24-Hour Healthcare",
    urlSegment: "24-hour",
    description: "24-hour hospitals, pharmacies, clinics and urgent care",
  },
  emergency: {
    title: "Emergency Healthcare",
    urlSegment: "emergency",
    description: "Emergency departments and urgent care centers",
  },
  "walk-in": {
    title: "Walk-In Clinics",
    urlSegment: "walk-in",
    description: "Walk-in clinics and polyclinics accepting appointments without booking",
  },
};

// ── Data fetch ───────────────────────────────────────────────────────────────

async function getFilteredProviders(filter: FilterKind, citySlug: string): Promise<LocalProvider[]> {
  if (filter === "24-hour") return get24HourProviders(citySlug);
  if (filter === "emergency") return getEmergencyProviders(citySlug);
  return getWalkInProviders(citySlug);
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function generateGccFilterMetadata({
  countryCode,
  citySlug,
  filter,
}: Props): Metadata {
  const cities = getCitiesByCountry(countryCode);
  const city = cities.find((c) => c.slug === citySlug);
  if (!city) return {};

  const countryName = COUNTRY_NAMES[countryCode];
  const locale = COUNTRY_LOCALES[countryCode];
  const label = FILTER_LABELS[filter];
  const base = getBaseUrl();
  const url = `${base}/${countryCode}/directory/${city.slug}/${label.urlSegment}`;

  const title = `${label.title} in ${city.name}, ${countryName} | Open Now`;
  const description = `Find ${label.description} in ${city.name}, ${countryName}. All facilities verified against official health authority registers. Updated 2026.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      siteName: "Zavis Healthcare Directory",
      url,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export async function GccFilterPage({ countryCode, citySlug, filter }: Props) {
  if (!cityBelongsToCountry(citySlug, countryCode)) notFound();

  const cities = getCitiesByCountry(countryCode);
  const city = cities.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const providers = await getFilteredProviders(filter, city.slug);
  if (providers.length < 3) notFound();

  const countryName = COUNTRY_NAMES[countryCode];
  const regulator = REGULATORS[countryCode];
  const currency = CURRENCIES[countryCode];
  const insurers = INSURANCE_PROVIDERS[countryCode];
  const label = FILTER_LABELS[filter];

  const base = getBaseUrl();
  const pageUrl = `${base}/${countryCode}/directory/${city.slug}/${label.urlSegment}`;
  const count = providers.length;

  // Sort by rating
  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  // Category cross-links
  const categoryCounts = new Map<string, number>();
  for (const p of providers) {
    categoryCounts.set(p.categorySlug, (categoryCounts.get(p.categorySlug) || 0) + 1);
  }
  const categories = getCategories();
  const categoryLinks = categories.filter((cat) => (categoryCounts.get(cat.slug) || 0) >= 3);

  // ── FAQ content — varies by filter type ───────────────────────────────────
  const faqs = filter === "24-hour"
    ? [
        {
          question: `Which healthcare facilities are open 24 hours in ${city.name}?`,
          answer: `According to the Zavis Healthcare Directory, there are ${count} healthcare facilities in ${city.name}, ${countryName} that operate 24 hours a day, 7 days a week. These include hospitals, pharmacies, clinics, and urgent care centers. All listings are sourced from official ${regulator} licensed facility registers.`,
        },
        {
          question: `Where can I find a 24-hour pharmacy in ${city.name}?`,
          answer: `${city.name} has several 24-hour pharmacies listed in the Zavis Healthcare Directory. Most major hospital pharmacies also operate 24/7. Prescription medications typically require a valid local prescription from a licensed physician.`,
        },
        {
          question: `Do 24-hour facilities in ${city.name} accept insurance?`,
          answer: `Most 24-hour healthcare facilities in ${city.name} accept major ${countryName} insurance plans including ${insurers}. Emergency services are generally covered regardless of plan. Always carry your insurance card and national ID.`,
        },
        {
          question: `How much does a visit to a 24-hour clinic cost in ${city.name}?`,
          answer: `Emergency department visits in ${city.name} typically cost ${currency.symbol} ${currency.lowED}–${currency.highED} before treatment. 24-hour GP consultations range from ${currency.symbol} ${currency.lowGP}–${currency.highGP}. With insurance, you typically pay only the co-payment amount.`,
        },
      ]
    : filter === "emergency"
    ? [
        {
          question: `Where are the emergency hospitals in ${city.name}?`,
          answer: `${city.name}, ${countryName} has ${count} facilities providing emergency or urgent care according to the Zavis Healthcare Directory. These include major hospital emergency departments and dedicated urgent care centers. All are regulated by ${regulator}.`,
        },
        {
          question: `What should I do in a medical emergency in ${countryName}?`,
          answer: `For life-threatening emergencies in ${countryName}, call the national emergency number ${countryCode === "qa" ? "999" : countryCode === "sa" ? "997 (Saudi Red Crescent)" : countryCode === "bh" ? "999" : "112"}. For non-life-threatening issues, you can go directly to any of the ${count} emergency facilities in ${city.name} listed above.`,
        },
        {
          question: `Do emergency rooms in ${city.name} accept walk-ins?`,
          answer: `Yes. Emergency departments in ${city.name} accept walk-ins 24/7. You don't need an appointment. Critical cases are triaged immediately; non-critical visits are seen within 30–120 minutes depending on patient load.`,
        },
        {
          question: `How much does emergency care cost in ${city.name}?`,
          answer: `Emergency visits in ${city.name} typically cost ${currency.symbol} ${currency.lowED}–${currency.highED} without insurance. Most residents carry insurance through ${insurers}, which covers emergency care with low or zero co-pay. Expats and tourists should confirm their coverage before non-urgent visits.`,
        },
      ]
    : [
        {
          question: `Which walk-in clinics are in ${city.name}?`,
          answer: `${city.name}, ${countryName} has ${count} walk-in clinics and polyclinics accepting patients without prior appointments. All are listed in the Zavis Healthcare Directory and regulated by ${regulator}.`,
        },
        {
          question: `Do I need an appointment to visit a walk-in clinic in ${city.name}?`,
          answer: `No. Walk-in clinics in ${city.name} accept patients without appointments during operating hours. Wait times typically range from 15 to 60 minutes depending on the time of day and patient volume. Early morning and late evening slots usually have the shortest waits.`,
        },
        {
          question: `What services do walk-in clinics in ${city.name} offer?`,
          answer: `Walk-in clinics in ${city.name} typically offer general consultations, minor injury care, vaccinations, diagnostic tests, prescriptions, and basic dental and pediatric services. Most polyclinics also have multiple specialists under one roof.`,
        },
        {
          question: `How much does a walk-in consultation cost in ${city.name}?`,
          answer: `Walk-in GP consultations in ${city.name} typically cost ${currency.symbol} ${currency.lowGP}–${currency.highGP} without insurance. Specialist consultations cost more. Most clinics accept ${insurers}.`,
        },
      ];

  const breadcrumbItems = [
    { name: countryName, url: `${base}/${countryCode}/directory` },
    { name: city.name, url: `${base}/${countryCode}/directory/${city.slug}` },
    { name: label.title, url: pageUrl },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={itemListSchema(
          `${label.title} in ${city.name}`,
          sorted.slice(0, 20),
          city.name,
          base
        )}
      />

      <Breadcrumb
        items={[
          { label: countryName, href: `/${countryCode}/directory` },
          { label: city.name, href: `/${countryCode}/directory/${city.slug}` },
          { label: label.title },
        ]}
      />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          {label.title} in {city.name}, {countryName}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
          {count} verified facilities · Last updated 2026
        </p>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the Zavis Healthcare Directory, there are {count}{" "}
            {label.description.toLowerCase()} in {city.name}, {countryName}.
            {sorted[0] && Number(sorted[0].googleRating) > 0 && (
              <>
                {" "}
                The highest-rated is <strong>{sorted[0].name}</strong> with a{" "}
                {sorted[0].googleRating}-star Google rating based on{" "}
                {(sorted[0].googleReviewCount || 0).toLocaleString()} patient reviews.
              </>
            )}{" "}
            All listings are sourced from official {regulator} licensed facility registers.
          </p>
        </div>
      </div>

      {/* Category quick links */}
      {categoryLinks.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-[#1c1c1c] mb-2">Filter by category:</p>
          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${countryCode}/directory/${city.slug}/${cat.slug}`}
                className="inline-block border border-[#006828]/20 text-[#006828] text-sm rounded-full font-['Geist',sans-serif] px-3 py-1.5 hover:bg-[#006828]/[0.04]"
              >
                {cat.name} ({categoryCounts.get(cat.slug)})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Provider grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            All {label.title} in {city.name}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((provider) => (
            <ProviderCard
              key={provider.id}
              name={provider.name}
              slug={provider.slug}
              citySlug={provider.citySlug}
              categorySlug={provider.categorySlug}
              address={provider.address}
              phone={provider.phone}
              website={provider.website}
              shortDescription={provider.shortDescription}
              googleRating={provider.googleRating}
              googleReviewCount={provider.googleReviewCount}
              isClaimed={provider.isClaimed}
              isVerified={provider.isVerified}
            />
          ))}
        </div>
      </section>

      {/* Cross-link */}
      <section className="mb-10">
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Need broader options?{" "}
          <Link
            href={`/${countryCode}/directory/${city.slug}`}
            className="text-[#006828] hover:underline font-medium"
          >
            Browse all healthcare providers in {city.name} &rarr;
          </Link>
        </p>
      </section>

      <FaqSection faqs={faqs} title={`${label.title} in ${city.name} — FAQ`} />
    </div>
  );
}

/** Build static params for cities with 3+ providers of the given filter type */
export async function generateGccFilterStaticParams(
  countryCode: GccCountryCode,
  filter: FilterKind
): Promise<{ city: string }[]> {
  const cities = getCitiesByCountry(countryCode);
  const params: { city: string }[] = [];

  for (const city of cities) {
    const providers = await getFilteredProviders(filter, city.slug);
    if (providers.length >= 3) {
      params.push({ city: city.slug });
    }
  }

  return params;
}
