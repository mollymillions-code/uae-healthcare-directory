import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCategories, getCategoryBySlug,
  getLanguagesList, getProvidersByLanguage,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";
import { ListingsTemplate } from "@/components/directory-v2/templates/ListingsTemplate";

export const revalidate = 43200;
// ISR: pages render on first visit and cache for 12h. No generateStaticParams —
// prerendering city × language × category combinations serialized hundreds of DB
// queries during `next build` and exhausted the pg pool (Deploy 6 build failure,
// 2026-04-11). Googlebot discovers these URLs via sitemap.xml and internal links;
// first-visit rendering populates the ISR cache.
export const dynamicParams = true;

interface Props {
  params: { city: string; lang: string; category: string };
}

/* ─── Metadata ─── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const allLangProviders = await safe(
    getProvidersByLanguage(language.slug, city.slug),
    [] as Awaited<ReturnType<typeof getProvidersByLanguage>>,
    "providersByLanguage-meta",
  );
  const count = allLangProviders.filter((p) => p.categorySlug === category.slug).length;
  const base = getBaseUrl();

  return {
    title: `${language.name}-Speaking ${category.name} in ${city.name} | ${count} Providers`,
    description: `Find ${count} ${category.name.toLowerCase()} in ${city.name} with ${language.name}-speaking staff. Browse verified listings with ratings, reviews, insurance details, and contact information. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/language/${language.slug}/${category.slug}` },
    openGraph: {
      title: `${language.name}-Speaking ${category.name} in ${city.name}`,
      description: `${count} verified ${category.name.toLowerCase()} with ${language.name}-speaking staff in ${city.name}, UAE.`,
      url: `${base}/directory/${city.slug}/language/${language.slug}/${category.slug}`,
      type: "website",
    },
  };
}

/* ─── Page ─── */

const LISTING_CAP = 30;

export default async function LanguageCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const allLangProviders = await safe(
    getProvidersByLanguage(language.slug, city.slug),
    [] as Awaited<ReturnType<typeof getProvidersByLanguage>>,
    "providersByLanguage",
  );
  const providers = allLangProviders
    .filter((p) => p.categorySlug === category.slug)
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  const count = providers.length;

  if (count === 0) notFound();

  const base = getBaseUrl();
  const capped = providers.slice(0, LISTING_CAP);
  const cappedForSchema = providers.slice(0, 20);

  // Avoid N additional provider scans on every request. Category and language
  // cross-links below still give users clear escape routes without turning this
  // facet page into an expensive aggregate query.
  const otherLanguages: Array<{ slug: string; name: string }> = [];

  // All categories for this language in this city (for cross-links)
  const allCategories = getCategories();
  const otherCategories = allCategories.filter((c) => {
    if (c.slug === category.slug) return false;
    return allLangProviders.filter((p) => p.categorySlug === c.slug).length >= 2;
  });

  // Total language providers in city (for cross-link)
  const totalLangProviders = allLangProviders.length;

  // Total category providers in city (for cross-link)
  const totalCatProviders = await safe(
    getProviderCountByCategoryAndCity(category.slug, city.slug),
    0,
    "catCountByCity",
  );

  const faqs = [
    {
      question: `How many ${language.name}-speaking ${category.name.toLowerCase()} are in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} ${category.name.toLowerCase()} in ${city.name} with ${language.name}-speaking staff. All listings are sourced from official DHA, DOH, and MOHAP registers. Last verified March 2026.`,
    },
    {
      question: `Do I need to speak English at ${category.name.toLowerCase()} in ${city.name}?`,
      answer: `No. Many ${category.name.toLowerCase()} in ${city.name} have multilingual staff. There are ${count} providers with ${language.name}-speaking professionals, so you can receive consultations, treatment, and follow-up care in ${language.name}. Other languages are also widely available across UAE healthcare facilities.`,
    },
    {
      question: `How do I book a ${language.name}-speaking ${category.name.toLowerCase().replace(/s$/, "")} in ${city.name}?`,
      answer: `Browse the ${count} ${language.name}-speaking ${category.name.toLowerCase()} listed above. Each listing includes phone numbers and websites for direct booking. When calling, you can request a ${language.name}-speaking doctor or staff member. Many facilities also offer online appointment booking.`,
    },
    {
      question: `Are ${language.name}-speaking ${category.name.toLowerCase()} in ${city.name} covered by insurance?`,
      answer: `Most ${category.name.toLowerCase()} in ${city.name} accept major UAE insurance plans including Daman, AXA, Cigna, MetLife, and others. Language preference does not affect insurance coverage. Check individual provider listings on the UAE Open Healthcare Directory for specific insurance acceptance details.`,
    },
  ];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Languages", href: `/directory/${city.slug}/language` },
        { label: language.name, href: `/directory/${city.slug}/language/${language.slug}` },
        { label: category.name },
      ]}
      eyebrow={`${language.name} · ${category.name}`}
      title={`${language.name}-Speaking ${category.name} in ${city.name}.`}
      subtitle={
        <>
          {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
        </>
      }
      aeoAnswer={
        <>
          {count} {category.name.toLowerCase()} in {city.name} have staff who speak {language.name}, according to the UAE Open Healthcare Directory. The UAE&apos;s diverse healthcare workforce ensures patients can access specialist care in their preferred language. Providers are sorted by Google rating below. Data sourced from official government registers (DHA, DOH, MOHAP), last verified March 2026.
        </>
      }
      total={count}
      providers={capped.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        citySlug: p.citySlug,
        categorySlug: p.categorySlug,
        categoryName: category.name,
        address: p.address,
        googleRating: p.googleRating,
        googleReviewCount: p.googleReviewCount,
        isClaimed: p.isClaimed,
        isVerified: p.isVerified,
        photos: p.photos ?? null,
        coverImageUrl: p.coverImageUrl ?? null,
      }))}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Languages", url: `${base}/directory/${city.slug}/language` },
            { name: language.name, url: `${base}/directory/${city.slug}/language/${language.slug}` },
            { name: category.name },
          ])} />
          {cappedForSchema.length > 0 && (
            <JsonLd data={itemListSchema(
              `${language.name}-Speaking ${category.name} in ${city.name}`,
              cappedForSchema,
              city.name,
              base,
            )} />
          )}
          <JsonLd data={faqPageSchema(faqs)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      belowGrid={
        <>
          {providers.length > LISTING_CAP && (
            <div className="text-center">
              <Link
                href={`/search?city=${city.slug}&q=${language.name}+${category.name}`}
                className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-4 py-2 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
              >
                View all {count} providers
              </Link>
            </div>
          )}

          {/* Cross-link: all language providers in city */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              More {language.name}-speaking providers in {city.name}
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mb-3">
              {totalLangProviders} total {language.name}-speaking healthcare providers in {city.name}.
            </p>
            <Link
              href={`/directory/${city.slug}/language/${language.slug}`}
              className="inline-flex items-center font-sans text-z-body-sm font-medium text-accent-dark hover:underline"
            >
              All {language.name}-speaking providers in {city.name} &rarr;
            </Link>
          </div>

          {/* Cross-link: all category providers in city */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              All {category.name} in {city.name}
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mb-3">
              {totalCatProviders} total {category.name.toLowerCase()} across all languages in {city.name}.
            </p>
            <Link
              href={`/directory/${city.slug}/${category.slug}`}
              className="inline-flex items-center font-sans text-z-body-sm font-medium text-accent-dark hover:underline"
            >
              All {category.name.toLowerCase()} in {city.name} &rarr;
            </Link>
          </div>

          {/* Other languages */}
          {otherLanguages.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Other languages for {category.name} in {city.name}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {otherLanguages.slice(0, 12).map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/directory/${city.slug}/language/${l.slug}/${category.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other categories */}
          {otherCategories.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
                Other {language.name}-speaking specialties in {city.name}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {otherCategories.slice(0, 12).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/directory/${city.slug}/language/${language.slug}/${c.slug}`}
                      className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
              Good to know
            </h2>
            <div className="max-w-3xl">
              <FaqSection
                faqs={faqs}
                title={`${language.name}-Speaking ${category.name} in ${city.name} — FAQ`}
              />
            </div>
          </div>
        </>
      }
    />
  );
}
