import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
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
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug,
  getCategories,
  getAreaBySlug,
  getAreasByCity,
  getProviders,
  getTopRatedProviders,
  getInsuranceProviders,
} from "@/lib/data";
import {
  medicalOrganizationSchema,
  breadcrumbSchema,
  itemListSchema,
  faqPageSchema,
  speakableSchema,
  generateFacetAnswerBlock,
  generateFacetFaqs,
  generateProviderParagraph,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl, getCategoryImagePath } from "@/lib/helpers";
import {
  getCategoryImageUrl,
  hasValidHours,
  formatVerifiedDate,
  resolveSegments,
  DAY_NAMES_EN,
} from "@/lib/directory-utils";
import {
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
import {
  isValidGccCountry,
  getGccCountry,
  cityBelongsToCountry,
  countryDirectoryUrl,
  COUNTRY_LOCALES,
} from "@/lib/country-directory-utils";

export const revalidate = 21600;
export const dynamicParams = true;

interface Props {
  params: { country: string; city: string; segments: string[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getGccCountry(params.country);
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
        title: truncateTitle(
          `${total} Best ${resolved.category.name} in ${city.name}, ${country.name} [${year}]`
        ),
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

      // --- SEO title: hard 60-char cap, high-intent modifiers ---
      const maxTitleLen = 60;
      const seoSuffix = " | Zavis";
      const idealTitle = `${prov.name}, ${city.name} — Reviews, Doctors & Insurance`;
      let seoTitle: string;
      if ((idealTitle + seoSuffix).length <= maxTitleLen) {
        seoTitle = idealTitle + seoSuffix;
      } else {
        const shortTitle = `${prov.name} — Reviews & Insurance`;
        if ((shortTitle + seoSuffix).length <= maxTitleLen) {
          seoTitle = shortTitle + seoSuffix;
        } else {
          const available = maxTitleLen - " — Reviews & Insurance | Zavis".length;
          seoTitle = prov.name.slice(0, available).trim() + " — Reviews & Insurance" + seoSuffix;
        }
      }

      // --- SEO description: max ~155 chars, packed with structured data ---
      const descParts: string[] = [];
      if (prov.googleRating && Number(prov.googleRating) > 0) {
        const reviewBit = prov.googleReviewCount ? ` (${prov.googleReviewCount} reviews)` : "";
        descParts.push(`\u2605 ${prov.googleRating}/5${reviewBit}`);
      }
      if (prov.services && prov.services.length > 0) {
        descParts.push(`Services: ${prov.services.slice(0, 3).join(", ")}`);
      }
      if (prov.insurance && prov.insurance.length > 0) {
        descParts.push(`Insurance: ${prov.insurance.slice(0, 3).join(", ")}`);
      }
      if (prov.phone) {
        descParts.push("\u260E Contact info available");
      }
      const descBody = descParts.length > 0 ? descParts.join(". ") + "." : (prov.shortDescription || "");
      const seoDesc = truncateDescription(`${prov.name}: ${descBody} Hours & directions on Zavis.`);

      // Don't index providers that are too thin (name-only stubs)
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
          images: [{ url: getCategoryImageUrl(resolved.category.slug, base), width: 1200, height: 630, alt: `${prov.name} — ${resolved.category.name} in ${city.name}` }],
        },
      };
    }
    default:
      return {};
  }
}

export default async function CountryCatchAllPage({ params }: Props) {
  if (!isValidGccCountry(params.country)) notFound();

  const country = getGccCountry(params.country)!;
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
    const countryOpts = { countryName: country.name, regulators: country.regulators };
    const schemaOpts = { countryCode: country.code, countryPrefix: country.code };
    const facetFaqs = generateFacetFaqs(city, category, null, total, countryOpts);

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
            {generateFacetAnswerBlock(city, category, null, total, topProvider, countryOpts)}
          </p>
        </div>

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
    const countryOptsAC = { countryName: country.name, regulators: country.regulators };
    const schemaOptsAC = { countryCode: country.code, countryPrefix: country.code };
    const facetFaqs = generateFacetFaqs(city, category, area, total, countryOptsAC);

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
              href: countryDirectoryUrl(country.code, city.slug, area.slug),
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
            {generateFacetAnswerBlock(city, category, area, total, topProvider, countryOptsAC)}
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
    const nearbyProviders = (await getTopRatedProviders(city.slug, 4)).filter((p) => p.id !== provider.id);
    const sameCategoryResult = await getProviders({
      citySlug: city.slug,
      categorySlug: category.slug,
      areaSlug: area?.slug,
      limit: 7,
      sort: "rating",
    });
    const sameCategoryProviders = sameCategoryResult.providers.filter((p) => p.id !== provider.id).slice(0, 6);
    const sameCategoryTotal = sameCategoryResult.total > 0 ? sameCategoryResult.total - 1 : 0;

    // Build insurance slug lookup for linking (link to UAE insurance pages for now)
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
      { question: `What are the opening hours of ${provider.name} in ${city.name}?`, answer: hasValidHours(provider.operatingHours) ? `${provider.name} in ${city.name} operates on the following schedule: ${Object.entries(provider.operatingHours).filter(([, h]) => h && h.open && h.close).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24 hours" : `${h.open}\u2013${h.close}`}`).join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}.` : `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}.` },
      { question: `Which insurance plans does ${provider.name} accept?`, answer: provider.insurance.length > 0 ? `${provider.name} accepts the following insurance plans: ${provider.insurance.join(", ")}. Always confirm coverage details directly with the provider before your visit.` : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.` },
      { question: `What medical services are available at ${provider.name}?`, answer: provider.services.length > 0 ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official ${country.regulators.join(", ")} records.` : `Contact ${provider.name} for a full list of available medical services.` },
      { question: `How do I get to ${provider.name} in ${locationLabel}?`, answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, ${country.name}.${parseFloat(provider.latitude) !== 0 ? " You can find directions via Google Maps." : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}` },
    ];
    if (hasValidRating && provider.googleReviewCount && provider.googleReviewCount > 0) {
      providerFaqs.push({ question: `What is the Google rating of ${provider.name}?`, answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google.` });
    }
    if (provider.languages.length > 0) {
      providerFaqs.push({ question: `What languages do staff speak at ${provider.name}?`, answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.` });
    }
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOperating = new Date().getFullYear() - provider.yearEstablished;
      providerFaqs.push({ question: `How long has ${provider.name} been operating?`, answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOperating > 0 ? `, making it a healthcare provider with ${yearsOperating} years of experience in ${city.name}` : ""}.` });
    }

    // Build HTML-enriched FAQ answers for JSON-LD schema
    const providerProfileUrl = countryDirectoryUrl(country.code, city.slug, category.slug, provider.slug);
    const lat = parseFloat(provider.latitude);
    const lng = parseFloat(provider.longitude);
    const hasValidCoords = lat !== 0 && lng !== 0;
    const providerFaqsRich: { question: string; answer: string }[] = [
      { question: `What are the opening hours of ${provider.name} in ${city.name}?`, answer: hasValidHours(provider.operatingHours) ? `${provider.name} in ${city.name} operates on the following schedule: ${Object.entries(provider.operatingHours).filter(([, h]) => h && h.open && h.close).map(([d, h]) => `${DAY_NAMES[d]}: ${h.open === "00:00" && h.close === "23:59" ? "24 hours" : `${h.open}\u2013${h.close}`}`).join(". ")}. Last verified ${formatVerifiedDate(provider.lastVerified)}. <a href="${providerProfileUrl}">View full profile</a>` : `Contact ${provider.name} directly for current opening hours. Phone: ${provider.phone || "see listing"}. <a href="${providerProfileUrl}">View full profile</a>` },
      { question: `Which insurance plans does ${provider.name} accept?`, answer: provider.insurance.length > 0 ? `${provider.name} accepts the following insurance plans: ${provider.insurance.map((insName) => { const slug = insurerSlugMap.get(insName.toLowerCase()); return slug ? `<a href="/insurance/${slug}">${insName}</a>` : insName; }).join(", ")}. Always confirm coverage details directly with the provider before your visit.` : `Contact ${provider.name} directly to confirm which insurance plans are currently accepted.` },
      { question: `What medical services are available at ${provider.name}?`, answer: provider.services.length > 0 ? `${provider.name} provides the following medical services: ${provider.services.join(", ")}. This information is sourced from official ${country.regulators.join(", ")} records. See all <a href="${countryDirectoryUrl(country.code, city.slug, category.slug)}">${category.name} in ${city.name}</a>` : `Contact ${provider.name} for a full list of available medical services.` },
      { question: `How do I get to ${provider.name} in ${locationLabel}?`, answer: `${provider.name} is located at ${provider.address}${areaName ? `, in the ${areaName} area of ${city.name}` : `, ${city.name}`}, ${country.name}.${hasValidCoords ? ` <a href="https://maps.google.com/?q=${lat},${lng}">Get directions</a>` : ""} ${provider.phone ? `For directions or appointments, call ${provider.phone}.` : ""}` },
    ];
    if (hasValidRating && provider.googleReviewCount && provider.googleReviewCount > 0) {
      providerFaqsRich.push({ question: `What is the Google rating of ${provider.name}?`, answer: `${provider.name} has a rating of ${provider.googleRating}/5 based on ${provider.googleReviewCount.toLocaleString()} patient reviews on Google. <a href="${providerProfileUrl}">View full profile and reviews</a>` });
    }
    if (provider.languages.length > 0) {
      providerFaqsRich.push({ question: `What languages do staff speak at ${provider.name}?`, answer: `Staff at ${provider.name} speak ${provider.languages.join(", ")}. This makes the facility accessible to a diverse patient population in ${city.name}.` });
    }
    if (provider.yearEstablished && provider.yearEstablished > 0) {
      const yearsOp = new Date().getFullYear() - provider.yearEstablished;
      providerFaqsRich.push({ question: `How long has ${provider.name} been operating?`, answer: `${provider.name} has been serving patients since ${provider.yearEstablished}${yearsOp > 0 ? `, making it a healthcare provider with ${yearsOp} years of experience in ${city.name}` : ""}.` });
    }

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={medicalOrganizationSchema(provider, city, category, area, city.slug, { countryCode: country.code, countryPrefix: country.code, currency: country.currency, regulators: country.regulators })} />
        <JsonLd data={breadcrumbSchema([{ name: "Home", url: base }, { name: country.name, url: `${base}${countryDirectoryUrl(country.code)}` }, { name: city.name, url: `${base}${countryDirectoryUrl(country.code, city.slug)}` }, { name: category.name, url: `${base}${countryDirectoryUrl(country.code, city.slug, category.slug)}` }, { name: provider.name }])} />
        <JsonLd data={faqPageSchema(providerFaqsRich)} />
        <JsonLd data={speakableSchema([".answer-block"])} />

        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: country.name, href: countryDirectoryUrl(country.code) }, { label: city.name, href: countryDirectoryUrl(country.code, city.slug) }, { label: category.name, href: countryDirectoryUrl(country.code, city.slug, category.slug) }, { label: provider.name }]} />

        {/* Listing hero banner with category image */}
        <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-2xl">
          <Image src={provider.coverImageUrl || getCategoryImagePath(category.slug)} alt={`${provider.name} — ${category.name} in ${city.name}`} fill className="object-cover" sizes="(max-width: 1280px) 100vw, 1280px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl text-white tracking-tight">{provider.name}</h1>
              {provider.isVerified && <CheckCircle className="h-6 w-6 text-[#006828]" />}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">{category.name}</span>
              {area && <span className="inline-block bg-white/20 text-white text-[11px] font-medium uppercase tracking-wide px-3 py-0.5 rounded-full font-['Geist',sans-serif]">{area.name}</span>}
            </div>
            {hasValidRating && (
              <div className="flex items-center gap-1.5">
                <span className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]">{provider.googleRating}/5 ★</span>
                {provider.googleReviewCount && <span className="font-['Geist',sans-serif] text-sm text-white/60">({provider.googleReviewCount.toLocaleString()} reviews)</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Answer block */}
            <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true" data-last-verified={provider.lastVerified}>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">{answerBlock}</p>
            </div>

            {/* About */}
            <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="about">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">About {provider.name}</h2>
              {provider.description ? (
                <>
                  <div className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed whitespace-pre-line">{provider.description}</div>
                  <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed mt-3">{generateProviderParagraph(provider, city, category, area, country.name)}</p>
                </>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">{generateProviderParagraph(provider, city, category, area, country.name)}</p>
              )}
              <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-3">Source: Official {country.regulators.join(", ")} register. Last verified: {formatVerifiedDate(provider.lastVerified)}.</p>
            </div>

            {/* Services */}
            {provider.services.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="services">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Stethoscope className="h-5 w-5 text-[#006828]" /> Services</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} provides these services in {city.name}:</p>
                <div className="flex flex-wrap gap-2">{provider.services.map((s) => (<span key={s} className="inline-block font-['Geist',sans-serif] border border-[#006828]/20 text-[#006828] text-sm px-3 py-1 rounded-full">{s}</span>))}</div>
                <Link href={countryDirectoryUrl(country.code, city.slug, category.slug)} className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors">Browse all {category.name} in {city.name} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}

            {/* Hours */}
            {provider.operatingHours && Object.keys(provider.operatingHours).length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="hours">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Clock className="h-5 w-5 text-[#006828]" /> Operating Hours</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(provider.operatingHours).map(([d, h]) => (
                    <div key={d} className="flex justify-between text-sm py-1 border-b border-black/[0.06] last:border-b-0">
                      <span className="font-['Geist',sans-serif] text-black/40">{DAY_NAMES[d]}</span>
                      <span className="font-['Geist',sans-serif] font-medium text-[#1c1c1c]">{h.open === "00:00" && h.close === "23:59" ? "24 Hours" : `${h.open} \u2013 ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {provider.insurance.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="insurance">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Shield className="h-5 w-5 text-[#006828]" /> Accepted Insurance</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-3">{provider.name} accepts these insurance plans:</p>
                <div className="flex flex-wrap gap-2">{provider.insurance.map((i) => {
                  const insurerSlug = insurerSlugMap.get(i.toLowerCase());
                  return insurerSlug ? (
                    <Link key={i} href={`/insurance/${insurerSlug}`} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06] hover:border-[#006828]/30 hover:text-[#006828] transition-colors">{i}</Link>
                  ) : (
                    <span key={i} className="inline-block font-['Geist',sans-serif] bg-[#f8f8f6] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg border border-black/[0.06]">{i}</span>
                  );
                })}</div>
              </div>
            )}

            {/* Review highlights */}
            {provider.reviewSummary && provider.reviewSummary.length > 0 && provider.reviewSummary[0] !== "No patient reviews available yet" && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5 bg-[#f8f8f6]" data-section="reviews">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><MessageSquareQuote className="h-5 w-5 text-[#006828]" /> What patients say</h2>
                <ul className="space-y-2">
                  {provider.reviewSummary.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/50">
                      <CheckCircle className="h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {hasValidRating && (
                  <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-4 pt-3 border-t border-black/[0.06]">Based on {provider.googleReviewCount?.toLocaleString()} Google reviews. Rating: {provider.googleRating}/5 stars.</p>
                )}
              </div>
            )}

            {/* Languages */}
            {provider.languages.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="languages">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><Languages className="h-5 w-5 text-[#006828]" /> Languages Spoken</h2>
                <p className="font-['Geist',sans-serif] text-sm text-black/50">Staff at {provider.name} speak: {provider.languages.join(", ")}.</p>
              </div>
            )}

            {/* Map */}
            <div className="border border-black/[0.06] rounded-2xl p-6 mb-5" data-section="location">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 flex items-center gap-2 tracking-tight"><MapPin className="h-5 w-5 text-[#006828]" /> Location</h2>
              <div className="rounded-xl overflow-hidden"><GoogleMapEmbed query={`${provider.name}, ${provider.address}`} /></div>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-3">{provider.address}</p>
            </div>

            <div className="flex items-center gap-2 font-['Geist',sans-serif] text-xs text-black/30 mb-6">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last verified: {formatVerifiedDate(provider.lastVerified)} &middot; Data from official {country.regulators.join(", ")} register</span>
            </div>

            <div className="bg-[#006828]/[0.04] rounded-2xl p-6">
              <FaqSection faqs={providerFaqs} title={`${provider.name} — FAQ`} />
            </div>

            {/* Same-category providers for internal linking */}
            {sameCategoryProviders.length > 0 && (
              <div className="border border-black/[0.06] rounded-2xl p-6 mt-5">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">More {category.name} in {area?.name || city.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sameCategoryProviders.map((sp) => (
                    <Link key={sp.id} href={countryDirectoryUrl(country.code, sp.citySlug, sp.categorySlug, sp.slug)} className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/20 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">{sp.name}</p>
                        {Number(sp.googleRating) > 0 && (<p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">{sp.googleRating}/5 ★ &middot; {sp.googleReviewCount?.toLocaleString()} reviews</p>)}
                        {sp.areaSlug && (<p className="font-['Geist',sans-serif] text-xs text-black/25 mt-0.5">{getAreaBySlug(city.slug, sp.areaSlug)?.name || sp.areaSlug}</p>)}
                      </div>
                    </Link>
                  ))}
                </div>
                {sameCategoryTotal > sameCategoryProviders.length && (
                  <Link href={countryDirectoryUrl(country.code, city.slug, category.slug)} className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm text-[#006828] hover:text-[#004d1c] mt-4 transition-colors">View all {sameCategoryTotal} {category.name} in {area?.name || city.name} <ArrowRight className="h-3.5 w-3.5" /></Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="border border-black/[0.06] rounded-2xl p-6">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-4 tracking-tight">Contact</h2>
                <div className="space-y-3">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"><Phone className="h-4 w-4" /> {provider.phone}</a>}
                  {provider.website && <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50 hover:text-[#006828] transition-colors"><Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" /></a>}
                  <div className="flex items-center gap-3 font-['Geist',sans-serif] text-sm text-black/50"><MapPin className="h-4 w-4" /> {provider.address}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex items-center justify-center gap-2 w-full bg-[#006828] hover:bg-[#004d1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"><Phone className="h-4 w-4" /> Call Now</a>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#1c1c1c] hover:bg-black text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full transition-colors"><MapPin className="h-4 w-4" /> Directions</a>
                </div>
              </div>

              {nearbyProviders.length > 0 && (
                <div className="border border-black/[0.06] rounded-2xl p-6">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] mb-3 tracking-tight">Nearby</h3>
                  <div className="space-y-3">
                    {nearbyProviders.map((np) => (
                      <Link key={np.id} href={countryDirectoryUrl(country.code, np.citySlug, np.categorySlug, np.slug)} className="block font-['Geist',sans-serif] text-sm hover:text-[#006828] transition-colors">
                        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{np.name}</p>
                        {Number(np.googleRating) > 0 && (<p className="font-['Geist',sans-serif] text-xs text-black/30">{np.googleRating} stars</p>)}
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
            <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="flex-1 flex items-center justify-center gap-2 bg-[#006828] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full">
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ", " + provider.address)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1c] text-white font-['Geist',sans-serif] font-medium text-sm py-3 rounded-full">
            <MapPin className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>
    );
  }

  // Fallback for unhandled resolved types (insurance, language, condition, procedures, etc.)
  // These can be added later as the GCC directories expand
  notFound();
}
