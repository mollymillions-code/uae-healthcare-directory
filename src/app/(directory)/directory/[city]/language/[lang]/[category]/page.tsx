import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategories, getCategoryBySlug,
  getLanguagesList, getProvidersByLanguage,
  getProviderCountByCategoryAndCity,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string; lang: string; category: string };
}

/* ─── Static params: city × language × category where filtered count >= 2 ─── */

export function generateStaticParams() {
  const cities = getCities();
  const languages = getLanguagesList();
  const categories = getCategories();
  const params: { city: string; lang: string; category: string }[] = [];

  for (const city of cities) {
    for (const language of languages) {
      const langProviders = getProvidersByLanguage(language.slug, city.slug);
      for (const cat of categories) {
        const count = langProviders.filter((p) => p.categorySlug === cat.slug).length;
        if (count >= 2) {
          params.push({ city: city.slug, lang: language.slug, category: cat.slug });
        }
      }
    }
  }

  return params;
}

/* ─── Metadata ─── */

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const allLangProviders = getProvidersByLanguage(language.slug, city.slug);
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

export default function LanguageCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const language = getLanguagesList().find((l) => l.slug === params.lang);
  if (!language) notFound();

  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const allLangProviders = getProvidersByLanguage(language.slug, city.slug);
  const providers = allLangProviders
    .filter((p) => p.categorySlug === category.slug)
    .sort((a, b) => Number(b.googleRating) - Number(a.googleRating));
  const count = providers.length;

  if (count === 0) notFound();

  const base = getBaseUrl();
  const capped = providers.slice(0, 30);
  const cappedForSchema = providers.slice(0, 20);

  // Other languages that have providers for this category in this city
  const allLanguages = getLanguagesList();
  const otherLanguages = allLanguages.filter((l) => {
    if (l.slug === language.slug) return false;
    const lp = getProvidersByLanguage(l.slug, city.slug);
    return lp.filter((p) => p.categorySlug === category.slug).length >= 2;
  });

  // All categories for this language in this city (for cross-links)
  const allCategories = getCategories();
  const otherCategories = allCategories.filter((c) => {
    if (c.slug === category.slug) return false;
    return allLangProviders.filter((p) => p.categorySlug === c.slug).length >= 2;
  });

  // Total language providers in city (for cross-link)
  const totalLangProviders = allLangProviders.length;

  // Total category providers in city (for cross-link)
  const totalCatProviders = getProviderCountByCategoryAndCity(category.slug, city.slug);

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
    <div className="container-tc py-8">
      {/* JSON-LD: BreadcrumbList */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Languages", url: `${base}/directory/${city.slug}/language` },
        { name: language.name, url: `${base}/directory/${city.slug}/language/${language.slug}` },
        { name: category.name },
      ])} />

      {/* JSON-LD: ItemList (cap 20) */}
      {cappedForSchema.length > 0 && (
        <JsonLd data={itemListSchema(
          `${language.name}-Speaking ${category.name} in ${city.name}`,
          cappedForSchema,
          city.name,
          base,
        )} />
      )}

      {/* JSON-LD: FAQPage */}
      <JsonLd data={faqPageSchema(faqs)} />

      {/* JSON-LD: SpeakableSpecification */}
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Languages", href: `/directory/${city.slug}/language` },
        { label: language.name, href: `/directory/${city.slug}/language/${language.slug}` },
        { label: category.name },
      ]} />

      {/* Heading */}
      <h1 className="text-3xl font-bold text-dark mb-2">
        {language.name}-Speaking {category.name} in {city.name}
      </h1>
      <p className="text-sm text-muted mb-4">
        {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
      </p>

      {/* Answer block */}
      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          {count} {category.name.toLowerCase()} in {city.name} have staff who speak {language.name}, according to the UAE Open Healthcare Directory. The UAE&apos;s diverse healthcare workforce ensures patients can access specialist care in their preferred language. Providers are sorted by Google rating below. Data sourced from official government registers (DHA, DOH, MOHAP), last verified March 2026.
        </p>
      </div>

      {/* Provider list — sorted by rating, cap 30 */}
      <div className="mb-8">
        <div className="section-header">
          <h2>{language.name}-Speaking {category.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capped.map((p) => (
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
        {providers.length > 30 && (
          <div className="text-center mt-6 py-4 border-t border-light-200">
            <Link
              href={`/search?city=${city.slug}&q=${language.name}+${category.name}`}
              className="btn-accent"
            >
              View all {count} providers
            </Link>
          </div>
        )}
      </div>

      {/* Cross-links */}
      <div className="mb-8 space-y-6">
        {/* All language providers in city */}
        <div>
          <div className="section-header">
            <h2>More {language.name}-Speaking Providers in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-sm text-muted mb-3">
            {totalLangProviders} total {language.name}-speaking healthcare providers in {city.name}.
          </p>
          <Link
            href={`/directory/${city.slug}/language/${language.slug}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            All {language.name}-speaking providers in {city.name} &rarr;
          </Link>
        </div>

        {/* All category providers in city */}
        <div>
          <div className="section-header">
            <h2>All {category.name} in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-sm text-muted mb-3">
            {totalCatProviders} total {category.name.toLowerCase()} across all languages in {city.name}.
          </p>
          <Link
            href={`/directory/${city.slug}/${category.slug}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            All {category.name.toLowerCase()} in {city.name} &rarr;
          </Link>
        </div>

        {/* Other languages for this category */}
        {otherLanguages.length > 0 && (
          <div>
            <div className="section-header">
              <h2>Other Languages for {category.name} in {city.name}</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {otherLanguages.slice(0, 12).map((l) => (
                <Link
                  key={l.slug}
                  href={`/directory/${city.slug}/language/${l.slug}/${category.slug}`}
                  className="badge"
                >
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other categories for this language */}
        {otherCategories.length > 0 && (
          <div>
            <div className="section-header">
              <h2>Other {language.name}-Speaking Specialties in {city.name}</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {otherCategories.slice(0, 12).map((c) => (
                <Link
                  key={c.slug}
                  href={`/directory/${city.slug}/language/${language.slug}/${c.slug}`}
                  className="badge"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`${language.name}-Speaking ${category.name} in ${city.name} — FAQ`}
      />
    </div>
  );
}
