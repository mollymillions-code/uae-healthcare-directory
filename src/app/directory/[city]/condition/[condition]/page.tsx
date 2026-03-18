import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategoryBySlug,
  getConditions, getProviders,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 21600;

interface Props {
  params: { city: string; condition: string };
}

export function generateStaticParams() {
  const cities = getCities();
  const conditions = getConditions();
  const params: { city: string; condition: string }[] = [];

  for (const city of cities) {
    for (const cond of conditions) {
      params.push({ city: city.slug, condition: cond.slug });
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const condition = getConditions().find((c) => c.slug === params.condition);
  if (!condition) return {};
  const base = getBaseUrl();

  return {
    title: `${condition.name} Treatment in ${city.name} | Find Specialists`,
    description: `Find specialists and clinics for ${condition.name.toLowerCase()} treatment in ${city.name}, UAE. ${condition.description} Browse verified providers with ratings and reviews. Last verified March 2026.`,
    alternates: { canonical: `${base}/directory/${city.slug}/condition/${condition.slug}` },
  };
}

/** Gather providers from all relatedCategories for this condition, deduplicated by ID. */
function getProvidersForCondition(citySlug: string, relatedCategories: string[]): LocalProvider[] {
  const seen = new Set<string>();
  const result: LocalProvider[] = [];

  for (const catSlug of relatedCategories) {
    const { providers } = getProviders({ citySlug, categorySlug: catSlug, limit: 50, sort: "rating" });
    for (const p of providers) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    }
  }

  // Sort combined results by rating
  result.sort((a, b) => Number(b.googleRating) - Number(a.googleRating));

  return result;
}

export default function ConditionPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const condition = getConditions().find((c) => c.slug === params.condition);
  if (!condition) notFound();

  const providers = getProvidersForCondition(city.slug, condition.relatedCategories);
  const count = providers.length;
  const base = getBaseUrl();

  // Resolve related category names for display
  const relatedCats = condition.relatedCategories
    .map((slug) => getCategoryBySlug(slug))
    .filter(Boolean) as { slug: string; name: string }[];

  const faqs = [
    {
      question: `Where can I get ${condition.name.toLowerCase()} treatment in ${city.name}?`,
      answer: `The UAE Healthcare Directory lists ${count} healthcare ${count === 1 ? "provider" : "providers"} in ${city.name} offering ${condition.name.toLowerCase()} treatment. These include ${relatedCats.map((c) => c.name.toLowerCase()).join(", ")} specialists. Browse the listings above to compare providers by rating and services offered.`,
    },
    {
      question: `How much does ${condition.name.toLowerCase()} treatment cost in ${city.name}?`,
      answer: `Treatment costs for ${condition.name.toLowerCase()} in ${city.name} vary by provider, procedure type, and insurance coverage. Most providers listed accept major UAE insurance plans. Contact individual providers for specific pricing and insurance verification.`,
    },
    {
      question: `What specialists treat ${condition.name.toLowerCase()} in ${city.name}?`,
      answer: `${condition.name} in ${city.name} is typically treated by ${relatedCats.map((c) => c.name.toLowerCase()).join(", ")} specialists. Our directory lists ${count} verified ${count === 1 ? "provider" : "providers"} across these specialties. Data from official UAE health authority registers, last verified March 2026.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Conditions", url: `${base}/directory/${city.slug}/condition` },
        { name: condition.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(`${condition.name} Treatment Providers in ${city.name}`, providers, city.name)} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Conditions", href: `/directory/${city.slug}/condition` },
        { label: condition.name },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        {condition.name} in {city.name} — Find Treatment
      </h1>
      <p className="text-sm text-muted mb-4">
        {count} verified {count === 1 ? "provider" : "providers"} · Last updated March 2026
      </p>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Healthcare Directory, there are {count} healthcare {count === 1 ? "provider" : "providers"} in {city.name} offering treatment for {condition.name.toLowerCase()}. {condition.description} Related specialties include {relatedCats.map((c) => c.name.toLowerCase()).join(", ")}. Data from official government registers, last verified March 2026.
        </p>
      </div>

      {/* Related specialty links */}
      {relatedCats.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-dark mb-2">Related specialties:</p>
          <div className="flex flex-wrap gap-2">
            {relatedCats.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/${cat.slug}`}
                className="badge-outline px-3 py-1.5 text-sm hover:bg-accent-muted"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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
          <p className="text-muted mb-2">No providers for {condition.name.toLowerCase()} found in {city.name} yet.</p>
          <Link href={`/directory/${city.slug}`} className="text-accent text-sm">
            View all healthcare providers in {city.name} &rarr;
          </Link>
        </div>
      )}

      <FaqSection faqs={faqs} title={`${condition.name} Treatment in ${city.name} — FAQ`} />
    </div>
  );
}
