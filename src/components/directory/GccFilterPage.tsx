/**
 * Shared filter page component for GCC countries (Qatar, Saudi Arabia, Bahrain, Kuwait).
 * Handles 24-hour, emergency, and walk-in healthcare filter pages for each city.
 *
 * Rewritten to mirror the UAE /directory redesign — uses the ListingsTemplate
 * with the new design tokens (font-display, font-sans, bg-surface-cream,
 * text-ink*, rounded-z-*, text-display-*). All schema output, FAQ text, and
 * URL structure preserved byte-for-byte.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import {
  getCategories,
  get24HourProviders,
  getEmergencyProviders,
  getWalkInProviders,
  type LocalProvider,
} from "@/lib/data";
import { safe } from "@/lib/safeData";
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
  countryDirectoryBasePath,
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

const REGULATORS_SHORT: Record<GccCountryCode, string> = {
  qa: "MOPH Qatar",
  sa: "MOH Saudi",
  bh: "NHRA Bahrain",
  kw: "MOH Kuwait",
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

export async function generateGccFilterMetadata({
  countryCode,
  citySlug,
  filter,
}: Props): Promise<Metadata> {
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
  const providers = await safe(
    getFilteredProviders(filter, city.slug),
    [] as LocalProvider[],
    "gccFilterMetadataProviders"
  );

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(providers.length < 3 && { robots: { index: false, follow: true } }),
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

  const providers = await safe(
    getFilteredProviders(filter, city.slug),
    [] as LocalProvider[],
    "gccFilterProviders"
  );

  const countryName = COUNTRY_NAMES[countryCode];
  const regulator = REGULATORS[countryCode];
  const regulatorShort = REGULATORS_SHORT[countryCode];
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
  const categoryNameBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

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

  const topProvider = sorted[0];
  const topRatingBit =
    topProvider && Number(topProvider.googleRating) > 0
      ? ` The highest-rated is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating based on ${(topProvider.googleReviewCount || 0).toLocaleString()} patient reviews.`
      : "";

  const aeoAnswer = (
    <>
      According to the Zavis Healthcare Directory, there are{" "}
      <span className="font-semibold text-ink">{count}</span>{" "}
      {label.description.toLowerCase()} in {city.name}, {countryName}.
      {topRatingBit} All listings are sourced from official {regulator}{" "}
      licensed facility registers.
    </>
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={itemListSchema(
          `${label.title} in ${city.name}`,
          sorted.slice(0, 20),
          city.name,
          base,
          { countryCode, countryPrefix: countryCode }
        )}
      />

      <ListingsTemplate
        breadcrumbs={[
          { label: countryName, href: `/${countryCode}/directory` },
          { label: city.name, href: `/${countryCode}/directory/${city.slug}` },
          { label: label.title },
        ]}
        eyebrow={`${regulatorShort} Verified · ${city.name}`}
        title={`${label.title} in ${city.name}, ${countryName}.`}
        subtitle={
          <>
            {count} verified facilities · Last updated 2026 · Regulated by{" "}
            {regulator}.
          </>
        }
        aeoAnswer={aeoAnswer}
        providers={sorted.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: categoryNameBySlug[p.categorySlug] ?? null,
          address: p.address ?? null,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: p.photos ?? [],
          coverImageUrl: p.coverImageUrl ?? null,
        }))}
        providerBasePath={countryDirectoryBasePath(countryCode)}
        total={count}
        belowGrid={
          <>
            {categoryLinks.length > 0 && (
              <section>
                <header className="mb-4">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Filter by specialty
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    Narrow by category.
                  </h2>
                </header>
                <ul className="flex flex-wrap gap-2">
                  {categoryLinks.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/${countryCode}/directory/${city.slug}/${cat.slug}`}
                        className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                      >
                        {cat.name}
                        <span className="ml-1.5 text-ink-muted">
                          · {categoryCounts.get(cat.slug)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ListingsCrossLink
                  href={`/${countryCode}/directory/${city.slug}`}
                  label={`Browse all providers in ${city.name}`}
                  sub={`Full ${city.name} healthcare directory`}
                />
                <ListingsCrossLink
                  href={`/${countryCode}/directory`}
                  label={`${countryName} directory home`}
                  sub="All cities across the country"
                />
              </div>
            </section>

            <section className="pt-4">
              <header className="mb-6">
                <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                  Questions
                </p>
                <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                  About {label.title.toLowerCase()} in {city.name}.
                </h2>
              </header>
              <div className="max-w-3xl">
                <FaqSection faqs={faqs} />
              </div>
            </section>
          </>
        }
      />
    </>
  );
}

/** Build static params for cities with at least one provider of the given filter type */
export async function generateGccFilterStaticParams(
  countryCode: GccCountryCode,
  filter: FilterKind
): Promise<{ city: string }[]> {
  const cities = getCitiesByCountry(countryCode);
  const params: { city: string }[] = [];

  for (const city of cities) {
    const providers = await getFilteredProviders(filter, city.slug);
    if (providers.length >= 1) {
      params.push({ city: city.slug });
    }
  }

  return params;
}
