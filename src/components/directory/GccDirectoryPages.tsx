import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ProviderListPaginated } from "@/components/directory/ProviderListPaginated";
import dynamic from "next/dynamic";
const GoogleMapEmbed = dynamic(
  () =>
    import("@/components/maps/GoogleMapEmbed").then(
      (mod) => mod.GoogleMapEmbed
    ),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-[#f8f8f6] animate-pulse" />,
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
  DAY_NAMES_EN,
} from "@/lib/directory-utils";
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
} from "lucide-react";

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

  const cityCounts = await Promise.all(
    cities.map((c) => getProviderCountByCity(c.slug))
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

      {/* Hero */}
      <section className="bg-[#1c1c1c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: country.name }]}
          />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.08] text-white tracking-[-0.02em] mb-3">
            Healthcare Directory{" "}
            <span className="text-white/60">in {country.name}</span>
          </h1>
          <p className="font-['Geist',sans-serif] text-white/50 text-sm sm:text-base max-w-xl">
            {totalProviders > 0
              ? `${totalProviders.toLocaleString()} licensed providers across ${cities.length} cities. Regulated by ${country.regulators.join(", ")}.`
              : `${cities.length} cities. Regulated by ${country.regulators.join(", ")}. Provider data coming soon.`}
          </p>
        </div>
      </section>

      {/* AEO Answer Block */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {getCountryOverview(
              country.name,
              totalProviders,
              cities.length,
              country.regulators,
              topCityNames
            )}
          </p>
        </div>
      </section>

      {/* Cities */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">
            Cities in {country.name}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedCities.map((city) => {
            const count = cityCountMap[city.slug] ?? 0;
            return (
              <Link
                key={city.slug}
                href={countryDirectoryUrl(country.code, city.slug)}
                className="flex items-center justify-between bg-white border border-black/[0.06] rounded-xl px-5 py-4 hover:border-[#006828]/15 hover:shadow-card transition-all duration-300 group"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight block">
                    {city.name}
                  </span>
                  {city.description && (
                    <span className="font-['Geist',sans-serif] text-xs text-black/40 line-clamp-1 mt-0.5 block">
                      {city.description.slice(0, 80)}...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {count > 0 ? (
                    <span className="font-['Geist',sans-serif] text-xs text-black/30">
                      {count} {count === 1 ? "provider" : "providers"}
                    </span>
                  ) : (
                    <span className="font-['Geist',sans-serif] text-xs text-black/20">
                      Coming soon
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Browse by Specialty */}
      <section className="bg-[#f8f8f6] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">
              Medical Specialties
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {categories.slice(0, 12).map((cat) => {
              const firstCity = cities[0];
              return (
                <Link
                  key={cat.slug}
                  href={
                    firstCity
                      ? countryDirectoryUrl(
                          country.code,
                          firstCity.slug,
                          cat.slug
                        )
                      : countryDirectoryUrl(country.code)
                  }
                  className="flex items-center justify-between py-3 px-2 border-b border-black/[0.06] hover:bg-white transition-colors group"
                >
                  <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                    {cat.name}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-black/20 group-hover:text-[#006828] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-white mb-2 tracking-tight">
            {country.name} Healthcare Directory
          </h2>
          <p className="font-['Geist',sans-serif] font-medium text-white/50 text-sm sm:text-base max-w-2xl mx-auto">
            {totalProviders > 0
              ? `${totalProviders.toLocaleString()} licensed providers from official ${country.regulators.join(" & ")} registers. Free. Open. No paywall.`
              : `Directory launching soon for ${country.name}. Powered by official ${country.regulators.join(" & ")} data.`}
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <FaqSection
          faqs={countryFaqs}
          title={`${country.name} Healthcare Directory — FAQ`}
        />
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
  const topProviders = await getTopRatedProviders(city.slug, 12);
  const total = await getProviderCountByCity(city.slug);
  const base = getBaseUrl();

  const catCounts = await Promise.all(
    categories.map((cat) =>
      getProviderCountByCategoryAndCity(cat.slug, city.slug)
    )
  );
  const catsWithCounts = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .filter((cat) => cat.count > 0);

  const areaCounts = await Promise.all(
    areas.map((area) => getProviderCountByAreaAndCity(area.slug, city.slug))
  );
  const areasWithCounts = areas.map((area, i) => ({
    ...area,
    count: areaCounts[i],
  }));

  const ratedProviders = topProviders.filter(
    (p) => Number(p.googleRating) > 0
  );
  const hasRatings = ratedProviders.length > 0;
  const featuredProviders = hasRatings
    ? ratedProviders.slice(0, 6)
    : topProviders
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6);

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

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            {
              label: country.name,
              href: countryDirectoryUrl(country.code),
            },
            { label: city.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            Healthcare Providers in {city.name}, {country.name}
          </h1>

          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed mb-4">
            {getEditorialBlurb(
              city.name,
              country.name,
              total,
              country.regulators,
              categories.length,
              areas.length
            )}
          </p>

          <div
            className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
            data-answer-block="true"
          >
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
              According to the {country.name} Healthcare Directory by Zavis, as
              of{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              , {city.name} has{" "}
              {total > 0 ? `${total}+` : "a growing number of"} registered
              healthcare providers listed across {categories.length} medical
              specialties
              {areas.length > 0
                ? ` and ${areas.length} neighborhoods`
                : ""}
              . Healthcare in {city.name} is regulated by{" "}
              {country.regulators.join(" and ")}. All listings include verified
              contact details, Google ratings from real patient reviews, accepted
              insurance plans, operating hours, and directions. Data sourced from
              official government licensed facility registers.
            </p>
          </div>
        </div>

        {/* Categories */}
        {catsWithCounts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Medical Specialties in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catsWithCounts.map((cat) => (
                <CategoryCard
                  key={cat.slug}
                  name={cat.name}
                  slug={cat.slug}
                  icon={cat.icon}
                  citySlug={city.slug}
                  providerCount={cat.count}
                  hrefOverride={countryDirectoryUrl(
                    country.code,
                    city.slug,
                    cat.slug
                  )}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Neighborhoods */}
      {areasWithCounts.length > 0 && (
        <section className="bg-[#f8f8f6] py-10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Areas in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasWithCounts.map((area) => (
                <Link
                  key={area.slug}
                  href={countryDirectoryUrl(
                    country.code,
                    city.slug,
                    area.slug
                  )}
                  className="flex items-center justify-between bg-white border border-black/[0.06] rounded-xl px-4 py-3 font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:shadow-card transition-all duration-300"
                >
                  <span className="font-['Geist',sans-serif] font-medium">
                    {area.name}
                  </span>
                  {area.count > 0 && (
                    <span className="text-black/30 text-xs">
                      {area.count}{" "}
                      {area.count === 1 ? "provider" : "providers"}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Providers */}
      {featuredProviders.length > 0 && (
        <section className="bg-[#f8f8f6] py-10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                Featured Providers in {city.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {featuredProviders.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-start gap-4 py-4 px-2 border-b border-black/[0.06] hover:bg-white transition-colors group"
                >
                  <span className="font-['Geist',sans-serif] text-2xl font-medium text-[#006828]/25 leading-none mt-0.5 w-8 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={countryDirectoryUrl(
                        country.code,
                        p.citySlug,
                        p.categorySlug,
                        p.slug
                      )}
                      className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] hover:text-[#006828] transition-colors tracking-tight"
                    >
                      {p.name}
                    </Link>
                    {hasRatings && Number(p.googleRating) > 0 && (
                      <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">
                        {p.googleRating}/5 stars ·{" "}
                        {p.googleReviewCount?.toLocaleString()} reviews
                      </p>
                    )}
                    {p.shortDescription && (
                      <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-1 line-clamp-1">
                        {p.shortDescription}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FaqSection
          faqs={faqs}
          title={`Healthcare in ${city.name}, ${country.name} — FAQ`}
        />
      </div>
    </>
  );
}

/* ==========================================================================
   3. Segments (Catch-All) Page — e.g. /qa/directory/doha/hospitals
   ========================================================================== */

export async function generateGccSegmentsMetadata(
  countryCode: string,
  params: { city: string; segments: string[] }
): Promise<Metadata> {
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
              url: getCategoryImageUrl(resolved.category.slug, base),
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
}: {
  countryCode: string;
  params: { city: string; segments: string[] };
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) notFound();

  const resolved = await resolveSegments(city.slug, params.segments);
  if (!resolved) notFound();

  const base = getBaseUrl();
  const DAY_NAMES = DAY_NAMES_EN;

  // --- City + Category Page ---
  if (resolved.type === "city-category") {
    const { category } = resolved;
    const { providers, total, totalPages } = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      page: 1,
      limit: 20,
      sort: "rating",
    });
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

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            { label: category.name },
          ]}
        />

        {/* Category hero banner */}
        <div className="relative h-32 w-full mb-6 overflow-hidden rounded-2xl">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-white mb-1 tracking-tight">
              {category.name} in {city.name}, {country.name}
            </h1>
            <p className="font-['Geist',sans-serif] text-sm text-white/70">
              {total} verified {total === 1 ? "provider" : "providers"}
            </p>
          </div>
        </div>

        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {generateFacetAnswerBlock(
              city,
              category,
              null,
              total,
              topProvider,
              countryOpts
            )}
          </p>
        </div>

        {/* Best page callout — only show when there are rated providers */}
        {providers.some((p) => Number(p.googleRating) > 0) && (
          <Link
            href={countryBestUrl(country.code, city.slug, category.slug)}
            className="flex items-center justify-between bg-[#1c1c1c] text-white px-5 py-3.5 mb-6 hover:bg-[#2a2a2a] transition-colors group"
          >
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm tracking-tight">
                See the Best {category.name} in {city.name}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-white/50 mt-0.5">
                Top-rated providers ranked by patient reviews
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors flex-shrink-0" />
          </Link>
        )}

        {areas.length > 0 && (
          <div className="mb-6">
            <p className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c] mb-2">
              Browse by area:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {areas.map((a) => (
                <Link
                  key={a.slug}
                  href={countryDirectoryUrl(
                    country.code,
                    city.slug,
                    a.slug,
                    category.slug
                  )}
                  className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  address={p.address}
                  phone={p.phone}
                  website={p.website}
                  shortDescription={p.shortDescription}
                  googleRating={p.googleRating}
                  googleReviewCount={p.googleReviewCount}
                  isClaimed={p.isClaimed}
                  isVerified={p.isVerified}
                />
              ))}
            </div>
          }
        >
          <ProviderListPaginated
            initialProviders={providers}
            initialTotalPages={totalPages}
            citySlug={city.slug}
            categorySlug={category.slug}
            baseUrl={countryDirectoryUrl(
              country.code,
              city.slug,
              category.slug
            )}
            emptyMessage={`No ${category.name.toLowerCase()} found in ${city.name} yet.`}
          />
        </Suspense>
        <FaqSection
          faqs={facetFaqs}
          title={`${category.name} in ${city.name} — FAQ`}
        />

        {/* Cross-link: Other specialties */}
        {(() => {
          const allCategories = getCategories();
          const siblings = allCategories
            .filter((c) => c.slug !== category.slug)
            .slice(0, 8);
          if (siblings.length === 0) return null;
          return (
            <section className="mt-10 mb-4">
              <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                  Other specialties in {city.name}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {siblings.map((c) => (
                  <Link
                    key={c.slug}
                    href={countryDirectoryUrl(
                      country.code,
                      city.slug,
                      c.slug
                    )}
                    className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/20 hover:bg-[#006828]/[0.04] transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    );
  }

  // --- City + Area Page ---
  if (resolved.type === "city-area") {
    const { area } = resolved;
    const { providers, total } = await getProviders({
      citySlug: city.slug,
      areaSlug: area.slug,
      sort: "rating",
      limit: 20,
    });
    const categories = getCategories();

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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            { name: area.name },
          ])}
        />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(areaFaqs)} />
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
            { label: area.name },
          ]}
        />

        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Healthcare in {area.name}, {city.name}
        </h1>
        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
          data-answer-block="true"
        >
          <p className="text-black/40">
            {area.name} in {city.name} has {total} healthcare{" "}
            {total === 1 ? "provider" : "providers"}. Data from official{" "}
            {country.regulators.join(", ")} registers.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Specialties in {area.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={countryDirectoryUrl(
                  country.code,
                  city.slug,
                  area.slug,
                  cat.slug
                )}
                className="inline-block bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 border border-black/[0.06] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                citySlug={p.citySlug}
                categorySlug={p.categorySlug}
                address={p.address}
                phone={p.phone}
                website={p.website}
                shortDescription={p.shortDescription}
                googleRating={p.googleRating}
                googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed}
                isVerified={p.isVerified}
              />
            ))}
          </div>
        )}

        <FaqSection
          faqs={areaFaqs}
          title={`Healthcare in ${area.name} — FAQ`}
        />
      </div>
    );
  }

  // --- Area + Category Facet Page ---
  if (resolved.type === "area-category") {
    const { area, category } = resolved;
    const { providers, total } = await getProviders({
      citySlug: city.slug,
      areaSlug: area.slug,
      categorySlug: category.slug,
      sort: "rating",
      limit: 50,
    });
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

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              name: area.name,
              url: `${base}${countryDirectoryUrl(country.code, city.slug, area.slug)}`,
            },
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
              label: area.name,
              href: countryDirectoryUrl(
                country.code,
                city.slug,
                area.slug
              ),
            },
            { label: category.name },
          ]}
        />

        <div className="relative h-32 w-full mb-6 overflow-hidden rounded-2xl">
          <Image
            src={getCategoryImagePath(category.slug)}
            alt={`${category.name} in ${area.name}, ${city.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-white tracking-tight mb-1">
              {category.name} in {area.name}, {city.name}
            </h1>
            <p className="font-['Geist',sans-serif] text-sm text-white/70">
              {total} verified {total === 1 ? "provider" : "providers"}
            </p>
          </div>
        </div>

        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {generateFacetAnswerBlock(
              city,
              category,
              area,
              total,
              topProvider,
              countryOptsAC
            )}
          </p>
        </div>

        {providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                citySlug={p.citySlug}
                categorySlug={p.categorySlug}
                address={p.address}
                phone={p.phone}
                website={p.website}
                shortDescription={p.shortDescription}
                googleRating={p.googleRating}
                googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed}
                isVerified={p.isVerified}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-black/40 mb-2">
              No {category.name.toLowerCase()} found in {area.name} yet.
            </p>
            <Link
              href={countryDirectoryUrl(
                country.code,
                city.slug,
                category.slug
              )}
              className="text-[#006828] text-sm"
            >
              View all {category.name.toLowerCase()} in {city.name} &rarr;
            </Link>
          </div>
        )}
        <FaqSection
          faqs={facetFaqs}
          title={`${category.name} in ${area.name} — FAQ`}
        />
      </div>
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
        answer: hasValidHours(provider.operatingHours)
          ? `${provider.name} in ${city.name} operates on the following schedule: ${Object.entries(provider.operatingHours).filter(([, h]) => h && h.open && h.close).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24 hours" : `${h.open}\u2013${h.close}`}`).join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}.`
          : `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.`,
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
        answer: hasValidHours(provider.operatingHours)
          ? `${provider.name} in ${city.name} operates on the following schedule: ${Object.entries(provider.operatingHours).filter(([, h]) => h && h.open && h.close).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24 hours" : `${h.open}\u2013${h.close}`}`).join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}. <a href="${providerProfileUrl}">View full profile</a>`
          : `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>`,
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
            src={
              provider.coverImageUrl || getCategoryImagePath(category.slug)
            }
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

            {/* Hours */}
            {provider.operatingHours &&
              Object.keys(provider.operatingHours).length > 0 && (
                <div
                  className="border border-black/[0.06] rounded-2xl p-6 mb-5"
                  data-section="hours"
                >
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                    <Clock className="h-5 w-5 text-[#006828]" /> Operating
                    Hours
                  </h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(provider.operatingHours).map(([d, h]) => (
                      <div
                        key={d}
                        className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0"
                      >
                        <span className="font-['Geist',sans-serif] text-black/40">
                          {DAY_NAMES[d]}
                        </span>
                        <span className="font-['Geist',sans-serif] font-medium text-[#1c1c1c]">
                          {h.open === "00:00" && h.close === "23:59"
                            ? "24 Hours"
                            : `${h.open} \u2013 ${h.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

            {/* Review highlights */}
            {provider.reviewSummary &&
              provider.reviewSummary.length > 0 &&
              provider.reviewSummary[0] !==
                "No patient reviews available yet" && (
                <div
                  className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]"
                  data-section="reviews"
                >
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight">
                    <MessageSquareQuote className="h-5 w-5 text-[#006828]" />{" "}
                    What patients say
                  </h2>
                  <ul className="space-y-2">
                    {provider.reviewSummary.map(
                      (point: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/50"
                        >
                          <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      )
                    )}
                  </ul>
                  {hasValidRating && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">
                      Based on{" "}
                      {provider.googleReviewCount?.toLocaleString()} Google
                      reviews. Rating: {provider.googleRating}/5 stars.
                    </p>
                  )}
                </div>
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
