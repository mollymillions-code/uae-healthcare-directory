import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug,
  getCategories,
  getAreasByCity,
  getTopRatedProviders,
  getProviderCountByCategoryAndCity,
  getProviderCountByCity,
  getProviderCountByAreaAndCity,
} from "@/lib/data";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  itemListSchema,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  isValidGccCountry,
  getGccCountry,
  cityBelongsToCountry,
  countryDirectoryUrl,
  COUNTRY_LOCALES,
} from "@/lib/country-directory-utils";

export const revalidate = 43200;

interface Props {
  params: { country: string; city: string };
}

export function generateStaticParams() {
  // Pre-render nothing — ISR on first visit
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getGccCountry(params.country);
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

export default async function CountryCityPage({ params }: Props) {
  if (!isValidGccCountry(params.country)) notFound();

  const country = getGccCountry(params.country)!;
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

  const topSpecialties = catsWithCounts.slice(0, 5).map((c) => c.name).join(", ");

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
            {getEditorialBlurb(city.name, country.name, total, country.regulators, categories.length, areas.length)}
          </p>

          <div
            className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6"
            data-answer-block="true"
          >
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
              According to the {country.name} Healthcare Directory by Zavis, as of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}, {city.name} has {total > 0 ? `${total}+` : "a growing number of"} registered healthcare providers listed across {categories.length} medical specialties{areas.length > 0 ? ` and ${areas.length} neighborhoods` : ""}.
              {" "}Healthcare in {city.name} is regulated by {country.regulators.join(" and ")}.
              {" "}All listings include verified contact details, Google ratings from real patient reviews,
              accepted insurance plans, operating hours, and directions.
              Data sourced from official government licensed facility registers.
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
                      {area.count} {area.count === 1 ? "provider" : "providers"}
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
