import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCardV2 } from "@/components/directory-v2/cards/ProviderCardV2";
import { CityCard } from "@/components/directory-v2/cards/CityCard";
import { SpecialtyTile } from "@/components/directory-v2/cards/SpecialtyTile";
import { ProviderListPaginated } from "@/components/directory/ProviderListPaginated";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";
import dynamic from "next/dynamic";
const GoogleMapEmbed = dynamic(
  () =>
    import("@/components/maps/GoogleMapEmbed").then(
      (mod) => mod.GoogleMapEmbed
    ),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-surface-cream animate-pulse rounded-z-md" />,
  }
);
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  itemListSchema,
  medicalOrganizationSchema,
  generateFacetAnswerBlock,
  generateFacetFaqs,
  generateProviderParagraph,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl, getCategoryImagePath } from "@/lib/helpers";
import {
  getCategories,
  getProviderCountByCity,
  getCityBySlug,
  getAreasByCity,
  getAreaBySlug,
  getTopRatedProviders,
  getProviderCountByCategoryAndCity,
  getProviderCountByAreaAndCity,
  getProviders,
  getInsuranceProviders,
} from "@/lib/data";
import { safe } from "@/lib/safeData";
import {
  isValidGccCountry,
  getGccCountry,
  getCitiesByCountry,
  cityBelongsToCountry,
  countryDirectoryUrl,
  countryBestUrl,
  COUNTRY_LOCALES,
} from "@/lib/country-directory-utils";
import {
  getCategoryImageUrl,
  hasValidHours,
  formatVerifiedDate,
  resolveSegments,
} from "@/lib/directory-utils";
import {
  getPrimaryProviderImageUrl,
  isUsableProviderImageUrl,
} from "@/lib/media/provider-images";
import { buildFaqDayLine, normalizeDayName, formatHoursRange } from "@/lib/hours-utils";
import {
  ChevronRight,
  MapPin,
  Phone,
  Globe,
  Clock,
  Shield,
  Languages,
  Stethoscope,
  CheckCircle,
  ExternalLink,
  Calendar,
  MessageSquareQuote,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/* ==========================================================================
   Shared helpers for the new UAE-mirrored design
   ========================================================================== */

const GCC_REGULATOR_SHORT: Record<string, string> = {
  qa: "MOPH",
  sa: "MOH",
  bh: "NHRA",
  kw: "MOH",
};

function getCountryRegulatorShort(countryCode: string): string {
  return GCC_REGULATOR_SHORT[countryCode] ?? "Official";
}

/* ==========================================================================
   1. Country Directory Home — e.g. /qa/directory
   ========================================================================== */

export async function generateGccDirectoryMetadata(
  countryCode: string
): Promise<Metadata> {
  const country = getGccCountry(countryCode);
  if (!country) return {};

  const cities = getCitiesByCountry(country.code);
  const cityCounts = await Promise.all(
    cities.map((c) => getProviderCountByCity(c.slug))
  );
  const totalProviders = cityCounts.reduce((sum, n) => sum + n, 0);
  const base = getBaseUrl();
  const url = `${base}${countryDirectoryUrl(country.code)}`;
  const year = new Date().getFullYear();
  const countPrefix =
    totalProviders > 0 ? `${totalProviders}+ Providers in ` : "";

  return {
    title: truncateTitle(
      `${countPrefix}${country.name} Healthcare Directory [${year}]`
    ),
    description: truncateDescription(
      `Find & compare healthcare providers across ${cities.length} cities in ${country.name}. Hospitals, clinics & specialists regulated by ${country.regulators.join(", ")}. Ratings, reviews & insurance. Free directory.`
    ),
    openGraph: {
      type: "website",
      title: `${country.name} Healthcare Directory | Zavis`,
      description: `Free directory of healthcare providers in ${country.name}. Browse ${cities.length} cities, compare ratings, insurance & specialties.`,
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      url,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${country.name} Healthcare Directory`,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
  };
}

function getCountryOverview(
  countryName: string,
  totalProviders: number,
  cityCount: number,
  regulators: string[],
  topCities: string[]
): string {
  const regStr = regulators.join(" and ");
  const cityList = topCities.slice(0, 4).join(", ");
  if (totalProviders > 0) {
    return `The ${countryName} Healthcare Directory by Zavis lists ${totalProviders.toLocaleString()}+ licensed healthcare providers across ${cityCount} cities including ${cityList}. Healthcare in ${countryName} is regulated by ${regStr}, which oversees licensing, quality standards, and patient safety for all public and private facilities. The directory covers hospitals, clinics, dental practices, pharmacies, specialist centers, and more — each listing includes verified contact details, Google patient ratings, accepted insurance plans, operating hours, and directions. All data is sourced from official government health authority registers.`;
  }
  return `The ${countryName} Healthcare Directory by Zavis covers ${cityCount} cities including ${cityList}. Healthcare in ${countryName} is regulated by ${regStr}. Provider data is being compiled from official government registers and will include hospitals, clinics, dental practices, pharmacies, and specialist centers with verified contact details, ratings, and insurance information.`;
}

export async function GccDirectoryHome({
  countryCode,
}: {
  countryCode: string;
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const cities = getCitiesByCountry(country.code);
  const base = getBaseUrl();
  const categories = getCategories();
  const regulatorShort = getCountryRegulatorShort(country.code);

  const cityCounts = await safe(
    Promise.all(cities.map((c) => getProviderCountByCity(c.slug))),
    cities.map(() => 0) as number[],
    "gccCityCounts"
  );
  const cityCountMap = Object.fromEntries(
    cities.map((c, i) => [c.slug, cityCounts[i]])
  );
  const totalProviders = cityCounts.reduce((sum, n) => sum + n, 0);

  const sortedCities = [...cities].sort((a, b) => a.sortOrder - b.sortOrder);
  const topCityNames = sortedCities.slice(0, 4).map((c) => c.name);

  const countryFaqs = [
    {
      question: `How is healthcare regulated in ${country.name}?`,
      answer: `Healthcare in ${country.name} is regulated by ${country.regulators.join(" and ")}. These authorities are responsible for licensing healthcare facilities and professionals, setting quality standards, enforcing patient safety protocols, and overseeing both public and private healthcare sectors across the country.`,
    },
    {
      question: `How many healthcare providers are listed in the ${country.name} directory?`,
      answer:
        totalProviders > 0
          ? `The Zavis ${country.name} Healthcare Directory currently lists ${totalProviders.toLocaleString()}+ healthcare providers across ${cities.length} cities. This includes hospitals, clinics, dental practices, pharmacies, labs, and specialist centers. The directory is updated regularly with data from official ${country.regulators.join(" and ")} registers.`
          : `The ${country.name} Healthcare Directory is actively being populated with data from official ${country.regulators.join(" and ")} registers. It will cover hospitals, clinics, dental practices, pharmacies, and specialist centers across ${cities.length} cities.`,
    },
    {
      question: `What cities are covered in the ${country.name} healthcare directory?`,
      answer: `The directory covers ${cities.length} cities in ${country.name}: ${sortedCities.map((c) => c.name).join(", ")}. Each city page provides a breakdown of healthcare providers by medical specialty and neighborhood.`,
    },
    {
      question: `Is the ${country.name} healthcare directory free to use?`,
      answer: `Yes, the ${country.name} Healthcare Directory by Zavis is completely free for patients and visitors. You can browse providers, compare ratings, check insurance acceptance, and find contact details without any account or payment. Healthcare providers can also claim their listing for free.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          {
            name: country.name,
            url: `${base}${countryDirectoryUrl(country.code)}`,
          },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(countryFaqs)} />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.18),transparent_70%)]" />
          <div className="absolute -top-16 -left-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">{country.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                {regulatorShort} Verified
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Healthcare in {country.name}.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                {totalProviders > 0
                  ? `${totalProviders.toLocaleString()} licensed providers across ${cities.length} cities. Regulated by ${country.regulators.join(", ")}.`
                  : `${cities.length} cities. Regulated by ${country.regulators.join(", ")}. Provider data coming soon.`}
              </p>
            </div>

            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: totalProviders > 0 ? totalProviders.toLocaleString() : "Soon", l: "Licensed providers" },
                  { n: cities.length.toString(), l: "Cities covered" },
                  { n: categories.length.toString(), l: "Specialties" },
                  { n: country.regulators.length.toString(), l: "Regulators" },
                ].map((s) => (
                  <div key={s.l} className="bg-white rounded-z-md border border-ink-line px-4 py-3">
                    <p className="font-display font-semibold text-ink text-z-h2 leading-none">{s.n}</p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AEO answer block */}
          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {getCountryOverview(
                country.name,
                totalProviders,
                cities.length,
                country.regulators,
                topCityNames
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Cities grid ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Browse by city
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              {country.name}, city by city.
            </h2>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedCities.map((city, idx) => {
            const count = cityCountMap[city.slug] ?? 0;
            const isLarge = idx === 0;
            return (
              <div key={city.slug} className={isLarge ? "col-span-2 row-span-2" : ""}>
                <CityCard
                  slug={city.slug}
                  name={city.name}
                  href={countryDirectoryUrl(country.code, city.slug)}
                  providerCount={count}
                  regulator={`${regulatorShort} Verified`}
                  size={isLarge ? "lg" : "md"}
                  priority={idx < 2}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Medical specialties ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Medical specialties
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            What do you need in {country.name}?
          </h2>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {categories.slice(0, 15).map((cat) => {
            const firstCity = sortedCities[0];
            return (
              <SpecialtyTile
                key={cat.slug}
                slug={cat.slug}
                name={cat.name}
                href={
                  firstCity
                    ? countryDirectoryUrl(country.code, firstCity.slug, cat.slug)
                    : countryDirectoryUrl(country.code)
                }
                useImage
              />
            );
          })}
        </div>
      </section>

      {/* ─── Claim-listing CTA (dark) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-12 lg:p-16">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-3">
                For healthcare providers in {country.name}
              </p>
              <h2 className="font-display font-semibold text-white text-display-lg tracking-[-0.02em] leading-[1.05]">
                {country.name} Healthcare Directory.
              </h2>
              <p className="font-sans text-white/70 text-z-body mt-4 max-w-lg leading-relaxed">
                {totalProviders > 0
                  ? `${totalProviders.toLocaleString()} licensed providers from official ${country.regulators.join(" & ")} registers. Free. Open. No paywall.`
                  : `Directory launching soon for ${country.name}. Powered by official ${country.regulators.join(" & ")} data.`}
              </p>
              <Link
                href="/claim"
                className="mt-7 inline-flex items-center gap-2 rounded-z-pill bg-accent hover:bg-accent-light text-white font-sans font-semibold text-z-body-sm px-6 py-3.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,200,83,0.5)]"
              >
                Claim your listing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {country.name} healthcare.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={countryFaqs} />
        </div>
      </section>
    </>
  );
}

/* ==========================================================================
   2. City Page — e.g. /qa/directory/doha
   ========================================================================== */

function getEditorialBlurb(
  cityName: string,
  countryName: string,
  total: number,
  regulators: string[],
  categoryCount: number,
  areaCount: number
): string {
  const regStr = regulators.join(" and ");
  if (total > 0) {
    return `${cityName} is home to ${total} healthcare facilities listed in the Zavis ${countryName} Healthcare Directory, regulated by ${regStr}. Providers span ${categoryCount} medical specialties${areaCount > 0 ? ` across ${areaCount} neighborhoods` : ""}. Each listing includes verified contact details, Google patient ratings, accepted insurance plans, operating hours, and directions — sourced from official government health authority registers.`;
  }
  return `Healthcare provider data for ${cityName}, ${countryName} is being compiled from official ${regStr} registers. The directory will cover hospitals, clinics, dental practices, pharmacies, and specialist providers across the city.`;
}

export async function generateGccCityMetadata(
  countryCode: string,
  params: { city: string }
): Promise<Metadata> {
  const country = getGccCountry(countryCode);
  if (!country) return {};
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) return {};

  const count = await getProviderCountByCity(city.slug);
  const year = new Date().getFullYear();
  const base = getBaseUrl();
  const url = `${base}${countryDirectoryUrl(country.code, city.slug)}`;

  return {
    title: truncateTitle(
      `${count > 0 ? count + "+ " : ""}Healthcare Providers in ${city.name}, ${country.name} [${year}]`
    ),
    description: truncateDescription(
      `Find & compare healthcare providers in ${city.name}, ${country.name}. Hospitals, clinics & specialists. Regulated by ${country.regulators.join(", ")}. Free directory.`
    ),
    ...(count === 0 && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `Healthcare Providers in ${city.name}, ${country.name}`,
      description: `Browse healthcare providers in ${city.name}. Compare ratings, insurance & specialties.`,
      type: "website",
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      url,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Healthcare in ${city.name}, ${country.name}`,
        },
      ],
    },
  };
}

export async function GccCityPage({
  countryCode,
  params,
}: {
  countryCode: string;
  params: { city: string };
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) notFound();

  const categories = getCategories();
  const areas = getAreasByCity(city.slug);
  const base = getBaseUrl();
  const regulatorShort = getCountryRegulatorShort(country.code);

  const [topProviders, total, catCounts, areaCounts] = await Promise.all([
    safe(
      getTopRatedProviders(city.slug, 12),
      [] as Awaited<ReturnType<typeof getTopRatedProviders>>,
      "gccTopProviders"
    ),
    safe(getProviderCountByCity(city.slug), 0, "gccCityTotal"),
    safe(
      Promise.all(
        categories.map((cat) =>
          getProviderCountByCategoryAndCity(cat.slug, city.slug)
        )
      ),
      categories.map(() => 0) as number[],
      "gccCatCounts"
    ),
    safe(
      Promise.all(
        areas.map((area) =>
          getProviderCountByAreaAndCity(area.slug, city.slug)
        )
      ),
      areas.map(() => 0) as number[],
      "gccAreaCounts"
    ),
  ]);

  const catsWithCounts = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .filter((cat) => cat.count > 0);

  const areasWithCounts = areas.map((area, i) => ({
    ...area,
    count: areaCounts[i],
  }));

  const ratedProviders = topProviders.filter(
    (p) => Number(p.googleRating) > 0
  );
  const featuredProviders = ratedProviders.length > 0
    ? ratedProviders.slice(0, 8)
    : topProviders
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8);

  const topSpecialties = catsWithCounts
    .slice(0, 5)
    .map((c) => c.name)
    .join(", ");

  const faqs = [
    {
      question: `How many healthcare providers are in ${city.name}, ${country.name}?`,
      answer: `The Zavis Healthcare Directory lists ${total > 0 ? total + "+" : "a growing number of"} healthcare providers in ${city.name}, ${country.name} across ${categories.length} medical specialties. All facilities are regulated by ${country.regulators.join(" and ")}. Data is sourced from official government health authority registers and verified regularly.`,
    },
    {
      question: `What types of healthcare are available in ${city.name}?`,
      answer: `${city.name} offers a wide range of healthcare services including ${topSpecialties}${catsWithCounts.length > 5 ? `, and ${catsWithCounts.length - 5} more specialties` : ""}. Providers range from large multi-specialty hospitals to neighborhood clinics and specialist practices.`,
    },
    {
      question: `How is healthcare regulated in ${country.name}?`,
      answer: `Healthcare in ${country.name} is regulated by ${country.regulators.join(" and ")}. These authorities oversee licensing, quality standards, and patient safety across all public and private healthcare facilities in the country.`,
    },
    {
      question: `Does ${city.name} have emergency healthcare services?`,
      answer: `Yes, ${city.name} has emergency healthcare services available through government and private hospitals. Major hospitals in the city operate 24/7 emergency departments. For emergencies, residents and visitors can also contact national emergency services.`,
    },
    {
      question: `What languages do healthcare providers speak in ${city.name}?`,
      answer: `Healthcare providers in ${city.name} typically offer services in Arabic and English. Many facilities also have staff fluent in Hindi, Urdu, Filipino, and other languages spoken by the expatriate community in ${country.name}.`,
    },
  ];

  const filterShortcuts = [
    { href: countryDirectoryUrl(country.code, city.slug, "24-hour"), label: "24-hour care", sub: "Open now & overnight" },
    { href: countryDirectoryUrl(country.code, city.slug, "emergency"), label: "Emergency care", sub: "24/7 emergency departments" },
    { href: countryDirectoryUrl(country.code, city.slug, "walk-in"), label: "Walk-in clinics", sub: "No appointment needed" },
    { href: countryBestUrl(country.code, city.slug), label: `Best in ${city.name}`, sub: "Top-rated by reviews" },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          {
            name: country.name,
            url: `${base}${countryDirectoryUrl(country.code)}`,
          },
          {
            name: city.name,
            url: `${base}${countryDirectoryUrl(country.code, city.slug)}`,
          },
        ])}
      />
      <JsonLd
        data={itemListSchema(
          `Top Healthcare Providers in ${city.name}`,
          featuredProviders,
          city.name,
          base,
          { countryCode: country.code, countryPrefix: country.code }
        )}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.18),transparent_70%)]" />
          <div className="absolute -top-16 -left-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={countryDirectoryUrl(country.code)} className="hover:text-ink transition-colors">
              {country.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">{city.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                {regulatorShort} Verified
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Healthcare in {city.name}.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                {getEditorialBlurb(
                  city.name,
                  country.name,
                  total,
                  country.regulators,
                  categories.length,
                  areas.length
                )}
              </p>
            </div>

            <div className="lg:col-span-4">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                {[
                  { n: total > 0 ? total.toLocaleString() : "Soon", l: "Licensed providers" },
                  { n: catsWithCounts.length.toString(), l: "Specialties covered" },
                  { n: areas.length.toString(), l: "Neighborhoods" },
                ].map((s) => (
                  <div key={s.l} className="bg-white rounded-z-md border border-ink-line px-4 py-3">
                    <p className="font-display font-semibold text-ink text-z-h2 leading-none">{s.n}</p>
                    <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AEO answer block */}
          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              According to the {country.name} Healthcare Directory by Zavis, as of{" "}
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })},{" "}
              {city.name} has{" "}
              <span className="font-semibold text-ink">
                {total > 0 ? `${total}+` : "a growing number of"}
              </span>{" "}
              registered healthcare providers listed across {categories.length} medical specialties
              {areas.length > 0 ? ` and ${areas.length} neighborhoods` : ""}. Healthcare in {city.name}{" "}
              is regulated by {country.regulators.join(" and ")}. All listings include verified
              contact details, Google ratings from real patient reviews, accepted insurance plans,
              operating hours, and directions. Data sourced from official government licensed
              facility registers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Specialties grid ─── */}
      {catsWithCounts.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Medical specialties
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              What do you need in {city.name}?
            </h2>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {catsWithCounts.map((cat) => (
              <SpecialtyTile
                key={cat.slug}
                slug={cat.slug}
                name={cat.name}
                href={countryDirectoryUrl(country.code, city.slug, cat.slug)}
                providerCount={cat.count}
                useImage
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Neighborhoods ─── */}
      {areasWithCounts.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Neighborhoods
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Find care near you in {city.name}.
            </h2>
          </header>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 border-t border-ink-line pt-4">
            {areasWithCounts.map((area) => (
              <li key={area.slug}>
                <Link
                  href={countryDirectoryUrl(country.code, city.slug, area.slug)}
                  className="flex items-center justify-between py-2.5 group"
                >
                  <span className="font-sans text-z-body text-ink group-hover:underline decoration-1 underline-offset-2">
                    {area.name}
                  </span>
                  {area.count > 0 && (
                    <span className="font-sans text-z-caption text-ink-muted">
                      {area.count} {area.count === 1 ? "provider" : "providers"}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Filter shortcuts ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Narrow your search
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Filter providers in {city.name}.
          </h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filterShortcuts.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex items-center gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-ink text-z-body leading-tight">{f.label}</p>
                <p className="font-sans text-z-caption text-ink-muted mt-0.5">{f.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured providers ─── */}
      {featuredProviders.length > 0 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Top-rated in {city.name}
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Providers patients love here.
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 z-stagger">
            {featuredProviders.map((p, i) => {
              const cat = categories.find((c) => c.slug === p.categorySlug);
              return (
                <ProviderCardV2
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  categoryName={cat?.name ?? null}
                  address={p.address ?? null}
                  googleRating={p.googleRating}
                  googleReviewCount={p.googleReviewCount}
                  isClaimed={p.isClaimed}
                  isVerified={p.isVerified}
                  photos={p.photos ?? []}
                  coverImageUrl={p.coverImageUrl ?? null}
                  priority={i < 4}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {city.name} healthcare.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} />
        </div>
      </section>
    </>
  );
}

/* ==========================================================================
   3. Segments (Catch-All) Page — e.g. /qa/directory/doha/hospitals
   ========================================================================== */

export async function generateGccSegmentsMetadata(
  countryCode: string,
  params: { city: string; segments: string[] },
  searchParams?: { page?: string }
): Promise<Metadata> {
  void searchParams;
  const country = getGccCountry(countryCode);
  if (!country) return {};
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) return {};

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) return {};
  const base = getBaseUrl();
  const locale = COUNTRY_LOCALES[country.code] ?? "en";

  switch (resolved.type) {
    case "city-category": {
      const { total } = await getProviders({
        citySlug: city.slug,
        categorySlug: resolved.category.slug,
        limit: 1,
      });
      const year = new Date().getFullYear();
      const url = `${base}${countryDirectoryUrl(country.code, city.slug, resolved.category.slug)}`;
      return {
        title: (() => {
          const full = `${total} Best ${resolved.category.name} in ${city.name}, ${country.name} [${year}]`;
          if (full.length <= 58) return full;
          const short = `${total} ${resolved.category.name} in ${city.name}, ${country.name} [${year}]`;
          if (short.length <= 58) return short;
          const shorter = `${total} ${resolved.category.name} in ${city.name} [${year}]`;
          if (shorter.length <= 58) return shorter;
          return truncateTitle(`${resolved.category.name} in ${city.name}, ${country.name} [${year}]`);
        })(),
        description: truncateDescription(
          `Compare ${total} ${resolved.category.name.toLowerCase()} in ${city.name}, ${country.name}. Ratings, reviews, insurance accepted & hours. Free directory.`
        ),
        ...(total === 0 && { robots: { index: false, follow: true } }),
        alternates: { canonical: url },
        openGraph: {
          title: `${resolved.category.name} in ${city.name}, ${country.name}`,
          description: `${total} ${resolved.category.name.toLowerCase()} in ${city.name}. Browse verified listings.`,
          type: "website",
          locale,
          siteName: `${country.name} Healthcare Directory by Zavis`,
          url,
          images: [
            {
              url: getCategoryImageUrl(resolved.category.slug, base),
              width: 1200,
              height: 630,
              alt: `${resolved.category.name} in ${city.name}`,
            },
          ],
        },
      };
    }
    case "city-area": {
      const { total } = await getProviders({
        citySlug: city.slug,
        areaSlug: resolved.area.slug,
        limit: 1,
      });
      const year = new Date().getFullYear();
      const url = `${base}${countryDirectoryUrl(country.code, city.slug, resolved.area.slug)}`;
      return {
        title: truncateTitle(
          `${total} Providers in ${resolved.area.name}, ${city.name} [${year}]`
        ),
        description: truncateDescription(
          `Compare ${total} healthcare providers in ${resolved.area.name}, ${city.name}, ${country.name}. Free directory.`
        ),
        alternates: { canonical: url },
        ...(total === 0 && { robots: { index: false, follow: true } }),
        openGraph: {
          title: `Healthcare in ${resolved.area.name}, ${city.name}`,
          description: `${total} healthcare providers in ${resolved.area.name}, ${city.name}.`,
          type: "website",
          locale,
          siteName: `${country.name} Healthcare Directory by Zavis`,
          url,
        },
      };
    }
    case "area-category": {
      const { total } = await getProviders({
        citySlug: city.slug,
        areaSlug: resolved.area.slug,
        categorySlug: resolved.category.slug,
        limit: 1,
      });
      const year = new Date().getFullYear();
      const url = `${base}${countryDirectoryUrl(country.code, city.slug, resolved.area.slug, resolved.category.slug)}`;
      return {
        title: truncateTitle(
          `${total} ${resolved.category.name} in ${resolved.area.name}, ${city.name} [${year}]`
        ),
        description: truncateDescription(
          `Compare ${total} ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}, ${country.name}. Free directory.`
        ),
        ...(total === 0 && { robots: { index: false, follow: true } }),
        alternates: { canonical: url },
        openGraph: {
          title: `${resolved.category.name} in ${resolved.area.name}, ${city.name}`,
          description: `${total} ${resolved.category.name.toLowerCase()} in ${resolved.area.name}, ${city.name}.`,
          type: "website",
          locale,
          siteName: `${country.name} Healthcare Directory by Zavis`,
          url,
        },
      };
    }
    case "listing": {
      const url = `${base}${countryDirectoryUrl(country.code, city.slug, resolved.category.slug, resolved.provider.slug)}`;
      const prov = resolved.provider;
      const providerOgImage =
        getPrimaryProviderImageUrl(prov, { absoluteOnly: true }) ??
        getCategoryImageUrl(resolved.category.slug, base);

      // Clean legal/branch suffixes before title construction — matches UAE pattern.
      const cleanName = (name: string): string =>
        name
          .replace(/\s*[-–—]\s*(Branch|Br\.?)\s*\d*\s*$/i, "")
          .replace(/\s*\bL\.?\s*L\.?\s*C\.?\b\s*$/i, "")
          .replace(/\s*\bW\.?\s*L\.?\s*L\.?\b\s*$/i, "")
          .replace(/\s*\bFZ[- ]?LLC\b\s*$/i, "")
          .replace(/\s*\bF[. ]?Z[. ]?E\.?\b\s*$/i, "")
          .replace(/\s+/g, " ")
          .trim();
      const providerDisplay = cleanName(prov.name) || prov.name;

      // Root layout template will append " | Zavis" — DO NOT include it inline
      // or we get "{title} | Zavis | Zavis". Budget 52 chars for the inner title.
      const maxTitleLen = 52;
      const idealTitle = `${providerDisplay}, ${city.name} — Reviews, Doctors & Insurance`;
      let seoTitle: string;
      if (idealTitle.length <= maxTitleLen) {
        seoTitle = idealTitle;
      } else {
        const shortTitle = `${providerDisplay} — Reviews & Insurance`;
        if (shortTitle.length <= maxTitleLen) {
          seoTitle = shortTitle;
        } else {
          // Word-boundary trim on the provider name — never slice mid-word
          // (especially important for Arabic provider names).
          const tail = " — Reviews";
          const nameBudget = maxTitleLen - tail.length;
          let trimmedName = providerDisplay;
          if (trimmedName.length > nameBudget) {
            const lastSpace = trimmedName.lastIndexOf(" ", nameBudget);
            trimmedName = (lastSpace > 0
              ? trimmedName.slice(0, lastSpace)
              : trimmedName.slice(0, nameBudget)).trim();
          }
          seoTitle = `${trimmedName}${tail}`;
        }
      }

      const descParts: string[] = [];
      if (prov.googleRating && Number(prov.googleRating) > 0) {
        const reviewBit = prov.googleReviewCount
          ? ` (${prov.googleReviewCount} reviews)`
          : "";
        descParts.push(`\u2605 ${prov.googleRating}/5${reviewBit}`);
      }
      if (prov.services && prov.services.length > 0) {
        descParts.push(
          `Services: ${prov.services.slice(0, 3).join(", ")}`
        );
      }
      if (prov.insurance && prov.insurance.length > 0) {
        descParts.push(
          `Insurance: ${prov.insurance.slice(0, 3).join(", ")}`
        );
      }
      if (prov.phone) {
        descParts.push("\u260E Contact info available");
      }
      const descBody =
        descParts.length > 0
          ? descParts.join(". ") + "."
          : prov.shortDescription || "";
      const seoDesc = truncateDescription(
        `${prov.name}: ${descBody} Hours & directions on Zavis.`
      );

      const isRichEnough = Boolean(
        (prov.googleRating && Number(prov.googleRating) > 0) ||
          prov.phone ||
          prov.website ||
          (prov.services && prov.services.length > 0)
      );

      return {
        title: seoTitle,
        description: seoDesc,
        ...(!isRichEnough && { robots: { index: false, follow: true } }),
        alternates: { canonical: url },
        openGraph: {
          title: `${prov.name} | ${resolved.category.name} in ${city.name}`,
          description: prov.shortDescription || "",
          type: "website",
          locale,
          siteName: `${country.name} Healthcare Directory by Zavis`,
          url,
          images: [
            {
              url: providerOgImage,
              width: 1200,
              height: 630,
              alt: `${prov.name} — ${resolved.category.name} in ${city.name}`,
            },
          ],
        },
      };
    }
    default:
      return {};
  }
}

export async function GccSegmentsPage({
  countryCode,
  params,
  searchParams,
}: {
  countryCode: string;
  params: { city: string; segments: string[] };
  searchParams?: { page?: string };
}) {
  void searchParams;
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) notFound();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const base = getBaseUrl();

  // --- City + Category Page ---
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total } = await safe(
      getProviders({
        citySlug: city.slug,
        categorySlug: category.slug,
        page: 1,
        limit: 20,
        sort: "rating",
      }),
      { providers: [] as Awaited<ReturnType<typeof getProviders>>["providers"], total: 0, page: 1, totalPages: 0 },
      "gccCityCategoryProviders"
    );
    const areas = getAreasByCity(city.slug);
    const topProvider = providers[0];
    const countryOpts = {
      countryName: country.name,
      countryCode: country.code,
      regulators: country.regulators,
    };
    const schemaOpts = {
      countryCode: country.code,
      countryPrefix: country.code,
    };
    const facetFaqs = generateFacetFaqs(
      city,
      category,
      null,
      total,
      countryOpts
    );
    const regulatorShortCC = getCountryRegulatorShort(country.code);

    return (
      <>
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: base },
            {
              name: country.name,
              url: `${base}${countryDirectoryUrl(country.code)}`,
            },
            {
              name: city.name,
              url: `${base}${countryDirectoryUrl(country.code, city.slug)}`,
            },
            { name: category.name },
          ])}
        />
        <JsonLd
          data={itemListSchema(
            `${category.name} in ${city.name}`,
            providers,
            city.name,
            base,
            schemaOpts
          )}
        />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: country.name, href: countryDirectoryUrl(country.code) },
            { label: city.name, href: countryDirectoryUrl(country.code, city.slug) },
            { label: category.name },
          ]}
          eyebrow={`${regulatorShortCC} Verified · ${city.name}`}
          title={`${category.name} in ${city.name}.`}
          subtitle={
            <>
              {total} verified {total === 1 ? "provider" : "providers"} in {city.name},{" "}
              {country.name}. Regulated by {country.regulators.join(" and ")}.
            </>
          }
          aeoAnswer={
            <>
              {generateFacetAnswerBlock(
                city,
                category,
                null,
                total,
                topProvider,
                countryOpts
              )}
            </>
          }
          providers={providers.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            citySlug: p.citySlug,
            categorySlug: p.categorySlug,
            categoryName: category.name,
            address: p.address ?? null,
            googleRating: p.googleRating,
            googleReviewCount: p.googleReviewCount,
            isClaimed: p.isClaimed,
            isVerified: p.isVerified,
            photos: p.photos ?? [],
            coverImageUrl: p.coverImageUrl ?? null,
          }))}
          total={total}
          pagination={
            <Suspense fallback={null}>
              <ProviderListPaginated
                providers={providers}
                currentPage={1}
                totalCount={total}
                pageSize={20}
                baseUrl={countryDirectoryUrl(country.code, city.slug, category.slug)}
                emptyMessage={`No ${category.name.toLowerCase()} found in ${city.name} yet.`}
              />
            </Suspense>
          }
          belowGrid={
            <>
              {providers.some((p) => Number(p.googleRating) > 0) && (
                <section>
                  <Link
                    href={countryBestUrl(country.code, city.slug, category.slug)}
                    className="group relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-1">
                        Curated ranking
                      </p>
                      <p className="font-display font-semibold text-white text-z-h2 tracking-tight">
                        See the best {category.name} in {city.name}.
                      </p>
                      <p className="font-sans text-white/60 text-z-caption mt-1">
                        Top-rated providers, ranked by patient reviews.
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </section>
              )}

              {areas.length > 0 && (
                <section>
                  <header className="mb-4">
                    <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                      Browse by area
                    </p>
                    <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                      {category.name} by neighborhood.
                    </h2>
                  </header>
                  <ul className="flex flex-wrap gap-2">
                    {areas.map((a) => (
                      <li key={a.slug}>
                        <Link
                          href={countryDirectoryUrl(country.code, city.slug, a.slug, category.slug)}
                          className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                        >
                          {a.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Questions
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    About {category.name.toLowerCase()} in {city.name}.
                  </h2>
                </header>
                <div className="max-w-3xl">
                  <FaqSection faqs={facetFaqs} />
                </div>
              </section>

              {(() => {
                const allCategories = getCategories();
                const siblings = allCategories
                  .filter((c) => c.slug !== category.slug)
                  .slice(0, 8);
                if (siblings.length === 0) return null;
                return (
                  <section>
                    <header className="mb-4">
                      <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                        Other specialties
                      </p>
                      <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                        More care in {city.name}.
                      </h2>
                    </header>
                    <ul className="flex flex-wrap gap-2">
                      {siblings.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={countryDirectoryUrl(country.code, city.slug, c.slug)}
                            className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })()}
            </>
          }
        />

      </>
    );
  }

  // --- City + Area Page ---
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const { providers, total } = await safe(
      getProviders({
        citySlug: city.slug,
        areaSlug: area.slug,
        sort: "rating",
        limit: 20,
      }),
      { providers: [] as Awaited<ReturnType<typeof getProviders>>["providers"], total: 0, page: 1, totalPages: 0 },
      "gccCityAreaProviders"
    );
    const categories = getCategories();
    const categoryNameBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
    const regulatorShortCA = getCountryRegulatorShort(country.code);

    const areaFaqs = [
      {
        question: `How many healthcare providers are in ${area.name}, ${city.name}?`,
        answer: `The Zavis Healthcare Directory lists ${total} healthcare providers in ${area.name}, ${city.name}, ${country.name}. Data from official ${country.regulators.join(", ")} registers.`,
      },
      {
        question: `What medical specialties are available in ${area.name}?`,
        answer: `Healthcare providers in ${area.name}, ${city.name} cover specialties including hospitals, dental clinics, dermatology, ophthalmology, and more.`,
      },
    ];

    return (
      <>
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: base },
            { name: country.name, url: `${base}${countryDirectoryUrl(country.code)}` },
            { name: city.name, url: `${base}${countryDirectoryUrl(country.code, city.slug)}` },
            { name: area.name },
          ])}
        />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(areaFaqs)} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: country.name, href: countryDirectoryUrl(country.code) },
            { label: city.name, href: countryDirectoryUrl(country.code, city.slug) },
            { label: area.name },
          ]}
          eyebrow={`${regulatorShortCA} Verified · ${area.name}`}
          title={`Healthcare in ${area.name}, ${city.name}.`}
          subtitle={
            <>
              {total} {total === 1 ? "provider" : "providers"} serving {area.name} in {city.name},{" "}
              {country.name}.
            </>
          }
          aeoAnswer={
            <>
              {area.name} in {city.name} has{" "}
              <span className="font-semibold text-ink">{total}</span> healthcare{" "}
              {total === 1 ? "provider" : "providers"}. Data from official{" "}
              {country.regulators.join(", ")} registers.
            </>
          }
          providers={providers.map((p) => ({
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
          total={total}
          belowGrid={
            <>
              <section>
                <header className="mb-4">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Specialties
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    Specialties in {area.name}.
                  </h2>
                </header>
                <ul className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={countryDirectoryUrl(country.code, city.slug, area.slug, cat.slug)}
                        className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Questions
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    About {area.name}.
                  </h2>
                </header>
                <div className="max-w-3xl">
                  <FaqSection faqs={areaFaqs} />
                </div>
              </section>
            </>
          }
        />

      </>
    );
  }

  // --- Area + Category Facet Page ---
  if (resolved.type === "area-category") {
    const { area, category } = resolved;
    const { providers, total } = await safe(
      getProviders({
        citySlug: city.slug,
        areaSlug: area.slug,
        categorySlug: category.slug,
        sort: "rating",
        limit: 50,
      }),
      { providers: [] as Awaited<ReturnType<typeof getProviders>>["providers"], total: 0, page: 1, totalPages: 0 },
      "gccAreaCategoryProviders"
    );
    if (total === 0) notFound();
    const topProvider = providers[0];
    const countryOptsAC = {
      countryName: country.name,
      countryCode: country.code,
      regulators: country.regulators,
    };
    const schemaOptsAC = {
      countryCode: country.code,
      countryPrefix: country.code,
    };
    const facetFaqs = generateFacetFaqs(
      city,
      category,
      area,
      total,
      countryOptsAC
    );
    const regulatorShortAC = getCountryRegulatorShort(country.code);

    return (
      <>
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: base },
            { name: country.name, url: `${base}${countryDirectoryUrl(country.code)}` },
            { name: city.name, url: `${base}${countryDirectoryUrl(country.code, city.slug)}` },
            { name: area.name, url: `${base}${countryDirectoryUrl(country.code, city.slug, area.slug)}` },
            { name: category.name },
          ])}
        />
        <JsonLd
          data={itemListSchema(
            `${category.name} in ${area.name}, ${city.name}`,
            providers,
            city.name,
            base,
            schemaOptsAC
          )}
        />
        <JsonLd data={faqPageSchema(facetFaqs)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <ListingsTemplate
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: country.name, href: countryDirectoryUrl(country.code) },
            { label: city.name, href: countryDirectoryUrl(country.code, city.slug) },
            { label: area.name, href: countryDirectoryUrl(country.code, city.slug, area.slug) },
            { label: category.name },
          ]}
          eyebrow={`${regulatorShortAC} Verified · ${area.name}`}
          title={`${category.name} in ${area.name}, ${city.name}.`}
          subtitle={
            <>
              {total} verified {total === 1 ? "provider" : "providers"} serving {area.name} in{" "}
              {city.name}, {country.name}.
            </>
          }
          aeoAnswer={
            <>
              {generateFacetAnswerBlock(
                city,
                category,
                area,
                total,
                topProvider,
                countryOptsAC
              )}
            </>
          }
          providers={providers.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            citySlug: p.citySlug,
            categorySlug: p.categorySlug,
            categoryName: category.name,
            address: p.address ?? null,
            googleRating: p.googleRating,
            googleReviewCount: p.googleReviewCount,
            isClaimed: p.isClaimed,
            isVerified: p.isVerified,
            photos: p.photos ?? [],
            coverImageUrl: p.coverImageUrl ?? null,
          }))}
          total={total}
          belowGrid={
            <>
              {providers.length === 0 && (
                <section className="text-center">
                  <p className="font-sans text-z-body text-ink-muted mb-2">
                    No {category.name.toLowerCase()} found in {area.name} yet.
                  </p>
                  <Link
                    href={countryDirectoryUrl(country.code, city.slug, category.slug)}
                    className="font-sans text-z-body-sm text-accent-deep hover:underline"
                  >
                    View all {category.name.toLowerCase()} in {city.name} →
                  </Link>
                </section>
              )}

              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Questions
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    About {category.name.toLowerCase()} in {area.name}.
                  </h2>
                </header>
                <div className="max-w-3xl">
                  <FaqSection faqs={facetFaqs} />
                </div>
              </section>
            </>
          }
        />
      </>
    );
  }

  // --- Individual Listing Page ---
  if (resolved.type === "listing") {
    const { category, provider } = resolved;
    const area = provider.areaSlug
      ? getAreaBySlug(city.slug, provider.areaSlug)
      : null;
    const nearbyProviders = (
      await getTopRatedProviders(city.slug, 4)
    ).filter((p) => p.id !== provider.id);
    const sameCategoryResult = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      areaSlug: area?.slug,
      limit: 7,
      sort: "rating",
    });
    const sameCategoryProviders = sameCategoryResult.providers
      .filter((p) => p.id !== provider.id)
      .slice(0, 6);
    const sameCategoryTotal =
      sameCategoryResult.total > 0 ? sameCategoryResult.total - 1 : 0;

    const allInsurers = getInsuranceProviders();
    const insurerSlugMap = new Map<string, string>();
    for (const ins of allInsurers) {
      insurerSlugMap.set(ins.name.toLowerCase(), ins.slug);
    }

    const hasValidRating = Number(provider.googleRating) > 0;
    const areaName = area?.name || "";
    const locationLabel = areaName ? `${areaName}, ${city.name}` : city.name;

    const answerBlock = `According to the ${country.name} Healthcare Directory by Zavis, ${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} in ${areaName ? areaName + ", " : ""}${city.name}, ${country.name}${hasValidHours(provider.operatingHours) && provider.operatingHours.mon ? `, open ${provider.operatingHours.mon.open === "00:00" ? "24/7" : `${provider.operatingHours.mon.open}\u2013${provider.operatingHours.mon.close}`}` : ""}. ${provider.services.length > 0 ? `Services: ${provider.services.slice(0, 4).join(", ")}.` : ""} ${provider.insurance.length > 0 ? "Insurance accepted." : ""} ${hasValidRating ? `Google rating: ${provider.googleRating}/5 from ${provider.googleReviewCount?.toLocaleString()} reviews.` : ""} ${provider.phone ? `Contact: ${provider.phone}.` : ""} Data sourced from official ${country.regulators.join(", ")} registers. Last verified: ${formatVerifiedDate(provider.lastVerified)}.`;

    const providerFaqs: { question: string; answer: string }[] = [
      {
        question: `What are the opening hours of ${provider.name} in ${city.name}?`,
        answer: (() => {
          if (!hasValidHours(provider.operatingHours)) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.`;
          }
          const dayLines = Object.entries(provider.operatingHours)
            .map(([d, h]) => buildFaqDayLine(d, h?.open, h?.close))
            .filter(Boolean);
          if (dayLines.length === 0) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.`;
          }
          return `${provider.name} in ${city.name} operates on the following schedule: ${dayLines.join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}.`;
        })(),
      },
      {
        question: `Which insurance plans does ${provider.name} accept?`,
        answer:
          provider.insurance.length > 0
            ? `${provider.name} accepts the following insurance plans: ${provider.insurance.join(", ")}. Always confirm coverage details directly with the provider before your visit.`
            : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.`,
      },
      {
        question: `What medical services are available at ${provider.name}?`,
        answer:
          provider.services.length > 0
            ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official ${country.regulators.join(", ")} records.`
            : `Contact ${provider.name} for a full list of available medical services.`,
      },
      {
        question: `How do I get to ${provider.name} in ${locationLabel}?`,
        answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, ${country.name}.${parseFloat(provider.latitude) !== 0 ? " You can find directions via Google Maps." : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}`,
      },
    ];
    if (
      hasValidRating &&
      provider.googleReviewCount &&
      provider.googleReviewCount > 0
    ) {
      providerFaqs.push({
        question: `What is the Google rating of ${provider.name}?`,
        answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google.`,
      });
    }
    if (provider.languages.length > 0) {
      providerFaqs.push({
        question: `What languages do staff speak at ${provider.name}?`,
        answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.`,
      });
    }
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOperating =
        new Date().getFullYear() - provider.yearEstablished;
      providerFaqs.push({
        question: `How long has ${provider.name} been operating?`,
        answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOperating > 0 ? `, making it a healthcare provider with ${yearsOperating} years of experience in ${city.name}` : ""}.`,
      });
    }

    const providerProfileUrl = countryDirectoryUrl(
      country.code,
      city.slug,
      category.slug,
      provider.slug
    );
    const lat = parseFloat(provider.latitude);
    const lng = parseFloat(provider.longitude);
    const hasValidCoords = lat !== 0 && lng !== 0;
    const providerFaqsRich: { question: string; answer: string }[] = [
      {
        question: `What are the opening hours of ${provider.name} in ${city.name}?`,
        answer: (() => {
          if (!hasValidHours(provider.operatingHours)) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>`;
          }
          const dayLines = Object.entries(provider.operatingHours)
            .map(([d, h]) => buildFaqDayLine(d, h?.open, h?.close))
            .filter(Boolean);
          if (dayLines.length === 0) {
            return `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>`;
          }
          return `${provider.name} in ${city.name} operates on the following schedule: ${dayLines.join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}. <a href="${providerProfileUrl}">View full profile</a>`;
        })(),
      },
      {
        question: `Which insurance plans does ${provider.name} accept?`,
        answer:
          provider.insurance.length > 0
            ? `${provider.name} accepts the following insurance plans: ${provider.insurance.map((insName) => { const slug = insurerSlugMap.get(insName.toLowerCase()); return slug ? `<a href="/insurance/${slug}">${insName}</a>` : insName; }).join(", ")}. Always confirm coverage details directly with the provider before your visit.`
            : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.`,
      },
      {
        question: `What medical services are available at ${provider.name}?`,
        answer:
          provider.services.length > 0
            ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official ${country.regulators.join(", ")} records. See all <a href="${countryDirectoryUrl(country.code, city.slug, category.slug)}">${category.name} in ${city.name}</a>`
            : `Contact ${provider.name} for a full list of available medical services.`,
      },
      {
        question: `How do I get to ${provider.name} in ${locationLabel}?`,
        answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, ${country.name}.${hasValidCoords ? ` <a href="https://maps.google.com/?q=${lat},${lng}">Get directions</a>` : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}`,
      },
    ];
    if (
      hasValidRating &&
      provider.googleReviewCount &&
      provider.googleReviewCount > 0
    ) {
      providerFaqsRich.push({
        question: `What is the Google rating of ${provider.name}?`,
        answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google. <a href="${providerProfileUrl}">View full profile and reviews</a>`,
      });
    }
    if (provider.languages.length > 0) {
      providerFaqsRich.push({
        question: `What languages do staff speak at ${provider.name}?`,
        answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.`,
      });
    }
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOp =
        new Date().getFullYear() - provider.yearEstablished;
      providerFaqsRich.push({
        question: `How long has ${provider.name} been operating?`,
        answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOp > 0 ? `, making it a healthcare provider with ${yearsOp} years of experience in ${city.name}` : ""}.`,
      });
    }

    const heroImageUrl = isUsableProviderImageUrl(provider.coverImageUrl)
      ? provider.coverImageUrl
      : getCategoryImagePath(category.slug);

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd
          data={medicalOrganizationSchema(provider, city, category, area, city.slug, {
            countryCode: country.code,
            countryPrefix: country.code,
            currency: country.currency,
            regulators: country.regulators,
          })}
        />
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: base },
            {
              name: country.name,
              url: `${base}${countryDirectoryUrl(country.code)}`,
            },
            {
              name: city.name,
              url: `${base}${countryDirectoryUrl(country.code, city.slug)}`,
            },
            {
              name: category.name,
              url: `${base}${countryDirectoryUrl(country.code, city.slug, category.slug)}`,
            },
            { name: provider.name },
          ])}
        />
        <JsonLd data={faqPageSchema(providerFaqsRich)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            {
              label: country.name,
              href: countryDirectoryUrl(country.code),
            },
            {
              label: city.name,
              href: countryDirectoryUrl(country.code, city.slug),
            },
            {
              label: category.name,
              href: countryDirectoryUrl(
                country.code,
                city.slug,
                category.slug
              ),
            },
            { label: provider.name },
          ]}
        />

        {/* Listing hero banner with category image */}
        <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-2xl">
          <Image
            src={heroImageUrl}
            alt={`${provider.name} — ${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl text-white tracking-tight">
                {provider.name}
              </h1>
              {provider.isVerified && (
                <CheckCircle className="h-6 w-6 text-[#006828]" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">
                {category.name}
              </span>
              {area && (
                <span className="inline-block bg-white/20 text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">
                  {area.name}
                </span>
              )}
            </div>
            {hasValidRating && (
              <div className="flex items-center gap-1.5">
                <span className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]">
                  {provider.googleRating}/5 ★
                </span>
                {provider.googleReviewCount && (
                  <span className="font-['Geist',sans-serif] text-sm text-white/60">
                    ({provider.googleReviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Answer block */}
            <div
              className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
              data-answer-block="true"
              data-last-verified={provider.lastVerified}
            >
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
                {answerBlock}
              </p>
            </div>

            {/* About */}
            <div
              className="border border-black/[0.06] rounded-2xl p-6 mb-5"
              data-section="about"
            >
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">
                About {provider.name}
              </h2>
              {provider.description ? (
                <>
                  <div className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed whitespace-pre-line">
                    {provider.description}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed mt-3">
                    {generateProviderParagraph(
                      provider,
                      city,
                      category,
                      area,
                      country.name
                    )}
                  </p>
                </>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">
                  {generateProviderParagraph(
                    provider,
                    city,
                    category,
                    area,
                    country.name
                  )}
                </p>
              )}
              <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-3">
                Source: Official {country.regulators.join(", ")} register. Last
                verified: {formatVerifiedDate(provider.lastVerified)}.
              </p>
            </div>

            {/* Services */}
            {provider.services.length > 0 && (
              <div
                className="border border-black/[0.06] rounded-2xl p-6 mb-5"
                data-section="services"
              >
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                  <Stethoscope className="h-5 w-5 text-[#006828]" /> Services
                </h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">
                  {provider.name} provides these services in {city.name}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((s) => (
                    <span
                      key={s}
                      className="inline-block font-['Geist',sans-serif] border border-[#006828]/20 text-[#006828] text-sm px-3 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <Link
                  href={countryDirectoryUrl(
                    country.code,
                    city.slug,
                    category.slug
                  )}
                  className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors"
                >
                  Browse all {category.name} in {city.name}{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Hours — normalizeDayName + formatHoursRange handle all legacy
                 key/value shapes in operating_hours JSONB (full English day
                 names, 3-letter lowercase, 12-hour AM/PM, 24-hour, broken
                 scrape artifacts). Rows with unknown day keys or malformed
                 times are silently dropped instead of rendering "undefined".
                 Same fix pattern as src/lib/hours-utils.ts#buildFaqDayLine. */}
            {(() => {
              if (
                !provider.operatingHours ||
                Object.keys(provider.operatingHours).length === 0
              ) {
                return null;
              }
              const rows = Object.entries(provider.operatingHours)
                .map(([d, h]) => {
                  const day = normalizeDayName(d);
                  const range = formatHoursRange(h?.open, h?.close);
                  if (!day || !range) return null;
                  return { key: d, day, range };
                })
                .filter(
                  (
                    row
                  ): row is { key: string; day: string; range: string } =>
                    row !== null
                );
              if (rows.length === 0) return null;
              return (
                <div
                  className="border border-black/[0.06] rounded-2xl p-6 mb-5"
                  data-section="hours"
                >
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                    <Clock className="h-5 w-5 text-[#006828]" /> Operating
                    Hours
                  </h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {rows.map((row) => (
                      <div
                        key={row.key}
                        className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0"
                      >
                        <span className="font-['Geist',sans-serif] text-black/40">
                          {row.day}
                        </span>
                        <span className="font-['Geist',sans-serif] font-medium text-[#1c1c1c]">
                          {row.range}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Insurance */}
            {provider.insurance.length > 0 && (
              <div
                className="border border-black/[0.06] rounded-2xl p-6 mb-5"
                data-section="insurance"
              >
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                  <Shield className="h-5 w-5 text-[#006828]" /> Accepted
                  Insurance
                </h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">
                  {provider.name} accepts these insurance plans:
                </p>
                <div className="flex flex-wrap gap-2">
                  {provider.insurance.map((i) => {
                    const insurerSlug = insurerSlugMap.get(i.toLowerCase());
                    return insurerSlug ? (
                      <Link
                        key={i}
                        href={`/insurance/${insurerSlug}`}
                        className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/30 hover:text-[#006828] transition-colors"
                      >
                        {i}
                      </Link>
                    ) : (
                      <span
                        key={i}
                        className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06]"
                      >
                        {i}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patient reviews — v2 bulky block when available, else legacy bullets */}
            {provider.reviewSummaryV2 ? (
              <div
                className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]"
                data-section="reviews"
              >
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] flex items-center gap-2 tracking-tight">
                    <MessageSquareQuote className="h-5 w-5 text-[#006828]" /> What patients say
                  </h2>
                  {hasValidRating && (
                    <div className="flex items-center gap-1.5 font-['Geist',sans-serif] text-sm">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm leading-none ${
                              i < Math.round(Number(provider.googleRating))
                                ? "text-[#006828]"
                                : "text-black/15"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="font-medium text-[#1c1c1c]">
                        {provider.googleRating}
                      </span>
                      <span className="text-black/40">
                        ({provider.googleReviewCount?.toLocaleString()} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">
                    Overall sentiment
                  </h3>
                  <p className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                    {provider.reviewSummaryV2.overall_sentiment}
                  </p>
                </div>

                {provider.reviewSummaryV2.what_stood_out &&
                  provider.reviewSummaryV2.what_stood_out.length > 0 && (
                    <div className="mb-5">
                      <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-2">
                        What stood out
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {provider.reviewSummaryV2.what_stood_out.map((t, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/60"
                          >
                            <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                            <span>
                              {t.theme}
                              {t.mention_count > 1 && (
                                <span className="text-black/30 text-xs ml-1">
                                  ({t.mention_count} mentions)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {provider.reviewSummaryV2.snippets &&
                  provider.reviewSummaryV2.snippets.length > 0 && (
                    <div className="mb-3">
                      <h3 className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wider text-black/40 mb-3">
                        Recent patient voices
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {provider.reviewSummaryV2.snippets.map((s, i) => (
                          // No microdata attrs — JSON-LD ships reviews nested
                          // under the MedicalBusiness (itemReviewed implicit).
                          <article
                            key={i}
                            className="bg-white rounded-xl p-4 border border-black/[0.04]"
                          >
                            <div className="flex items-center gap-0.5 mb-2">
                              {Array.from({ length: 5 }).map((_, starIdx) => (
                                <span
                                  key={starIdx}
                                  className={`text-sm leading-none ${
                                    starIdx < s.rating
                                      ? "text-[#006828]"
                                      : "text-black/15"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed italic mb-2">
                              {s.text_fragment}
                            </p>
                            <p className="font-['Geist',sans-serif] text-xs text-black/40">
                              <span className="font-medium">
                                {s.author_display}
                              </span>
                              {s.relative_time && <span> · {s.relative_time}</span>}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}

                <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                  Themes and patient voices synthesized from{" "}
                  {provider.googleReviewCount?.toLocaleString() || "recent"}{" "}
                  Google reviews.{" "}
                  {provider.googleMapsUri && (
                    <a
                      href={provider.googleMapsUri}
                      target="_blank"
                      rel="nofollow noopener"
                      className="text-[#006828] hover:underline"
                    >
                      Read original reviews on Google Maps →
                    </a>
                  )}
                </p>
              </div>
            ) : (
              provider.reviewSummary &&
              provider.reviewSummary.length > 0 &&
              provider.reviewSummary[0] !== "No patient reviews available yet" && (
                <div
                  className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]"
                  data-section="reviews"
                >
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                    <MessageSquareQuote className="h-5 w-5 text-[#006828]" /> What patients say
                  </h2>
                  <ul className="space-y-2">
                    {provider.reviewSummary.map((point: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/50"
                      >
                        <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {hasValidRating && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                      Based on {provider.googleReviewCount?.toLocaleString()} Google reviews. Rating: {provider.googleRating}/5 stars.
                    </p>
                  )}
                </div>
              )
            )}

            {/* Languages */}
            {provider.languages.length > 0 && (
              <div
                className="border border-black/[0.06] rounded-2xl p-6 mb-5"
                data-section="languages"
              >
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                  <Languages className="h-5 w-5 text-[#006828]" /> Languages
                  Spoken
                </h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/50">
                  Staff at {provider.name} speak:{" "}
                  {provider.languages.join(", ")}.
                </p>
              </div>
            )}

            {/* Map */}
            <div
              className="border border-black/[0.06] rounded-2xl p-6 mb-5"
              data-section="location"
            >
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                <MapPin className="h-5 w-5 text-[#006828]" /> Location
              </h2>
              <div className="rounded-xl overflow-hidden">
                <GoogleMapEmbed
                  query={`${provider.name}, ${provider.address}`}
                />
              </div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-3">
                {provider.address}
              </p>
            </div>

            <div className="flex items-center gap-2 font-['Geist',sans-serif] text-xs text-black/30 mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Last verified: {formatVerifiedDate(provider.lastVerified)}{" "}
                &middot; Data from official {country.regulators.join(", ")}{" "}
                register
              </span>
            </div>

            <div className="bg-[#006828]/[0.04] rounded-2xl p-6">
              <FaqSection
                faqs={providerFaqs}
                title={`${provider.name} — FAQ`}
              />
            </div>

            {/* Same-category providers for internal linking */}
            {sameCategoryProviders.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mt-5">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">
                  More {category.name} in {area?.name || city.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sameCategoryProviders.map((sp) => (
                    <Link
                      key={sp.id}
                      href={countryDirectoryUrl(
                        country.code,
                        sp.citySlug,
                        sp.categorySlug,
                        sp.slug
                      )}
                      className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/20 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                          {sp.name}
                        </p>
                        {Number(sp.googleRating) > 0 && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">
                            {sp.googleRating}/5 ★ &middot;{" "}
                            {sp.googleReviewCount?.toLocaleString()} reviews
                          </p>
                        )}
                        {sp.areaSlug && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/25 mt-0.5">
                            {getAreaBySlug(city.slug, sp.areaSlug)?.name ||
                              sp.areaSlug}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {sameCategoryTotal > sameCategoryProviders.length && (
                  <Link
                    href={countryDirectoryUrl(
                      country.code,
                      city.slug,
                      category.slug
                    )}
                    className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors"
                  >
                    View all {sameCategoryTotal} {category.name} in{" "}
                    {area?.name || city.name}{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="border border-black/[0.06] rounded-2xl p-6">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">
                  Contact
                </h2>
                <div className="space-y-3">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                      className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"
                    >
                      <Phone className="h-4 w-4" /> {provider.phone}
                    </a>
                  )}
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"
                    >
                      <Globe className="h-4 w-4" /> Website{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <div className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50">
                    <MapPin className="h-4 w-4" /> {provider.address}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                      className="flex items-center justify-center gap-2 w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
                    >
                      <Phone className="h-4 w-4" /> Call Now
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"
                  >
                    <MapPin className="h-4 w-4" /> Directions
                  </a>
                </div>
              </div>

              {nearbyProviders.length > 0 && (
                <div className="border border-black/[0.06] rounded-2xl p-6">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">
                    Nearby
                  </h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link
                        key={np.id}
                        href={countryDirectoryUrl(
                          country.code,
                          np.citySlug,
                          np.categorySlug,
                          np.slug
                        )}
                        className="block font-['Geist',sans-serif] text-sm hover:text-[#006828] transition-colors"
                      >
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">
                          {np.name}
                        </p>
                        {Number(np.googleRating) > 0 && (
                          <p className="font-['Geist',sans-serif] text-xs text-black/30">
                            {np.googleRating} stars
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky mobile CTA bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.06] p-3 flex gap-2 z-40 lg:hidden">
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#006828] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full"
          >
            <MapPin className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>
    );
  }

  // Fallback for unhandled resolved types
  notFound();
}
