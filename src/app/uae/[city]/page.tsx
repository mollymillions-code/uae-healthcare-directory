import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { SearchBar } from "@/components/search/SearchBar";
import {
  getCityBySlug, getCities, getCategories, getAreasByCity,
  getTopRatedProviders, getProviderCountByCategoryAndCity,
  getProviderCountByCity, getProviderCountByAreaAndCity, getFaqs,
} from "@/lib/data";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props { params: { city: string } }

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = getProviderCountByCity(city.slug);
  return {
    title: `Healthcare Providers in ${city.name}, UAE | ${count}+ Listings`,
    description: `Find ${count}+ healthcare providers in ${city.name}, UAE. Browse hospitals, clinics, dentists, and specialists with ratings, reviews, and contact details. Last verified March 2026.`,
    alternates: { canonical: `${getBaseUrl()}/uae/${city.slug}` },
  };
}

export default function CityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const categories = getCategories();
  const areas = getAreasByCity(city.slug);
  const topProviders = getTopRatedProviders(city.slug, 6);
  const faqs = getFaqs("city", city.slug);
  const total = getProviderCountByCity(city.slug);
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/uae/${city.slug}` },
      ])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">
          Healthcare Providers in {city.name}, UAE
        </h1>
        {/* Natural language paragraph for LLM citation */}
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {city.name} has {total}+ registered healthcare providers listed in our directory,
            spanning {categories.length} medical specialties across {areas.length} neighborhoods.
            {city.name === "Dubai" && " Healthcare in Dubai is regulated by the Dubai Health Authority (DHA)."}
            {city.name === "Abu Dhabi" && " Healthcare in Abu Dhabi is regulated by the Department of Health (DOH)."}
            {city.name === "Al Ain" && " Healthcare in Al Ain falls under the Department of Health Abu Dhabi (DOH)."}
            {!["Dubai", "Abu Dhabi", "Al Ain"].includes(city.name) && ` Healthcare in ${city.name} is regulated by the Ministry of Health and Prevention (MOHAP).`}
            {" "}All listings include verified contact details, Google ratings from real patient reviews,
            accepted insurance plans, operating hours, and directions.
            Data sourced from official UAE health authority registers. Last verified March 2026.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <SearchBar compact defaultCity={city.slug} />
      </div>

      {/* Categories */}
      <section className="mb-10">
        <div className="section-header">
          <h2>Medical Specialties in {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              name={cat.name}
              slug={cat.slug}
              icon={cat.icon}
              citySlug={city.slug}
              providerCount={getProviderCountByCategoryAndCity(cat.slug, city.slug)}
            />
          ))}
        </div>
      </section>

      {/* Areas — 3-column grid with counts */}
      {areas.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>Neighborhoods in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areas.map((area) => {
              const count = getProviderCountByAreaAndCity(area.slug, city.slug);
              return (
                <Link
                  key={area.slug}
                  href={`/uae/${city.slug}/${area.slug}`}
                  className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"
                >
                  <span className="font-medium">{area.name}</span>
                  {count > 0 && (
                    <span className="text-muted text-xs">
                      {count} {count === 1 ? "provider" : "providers"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Rated — 2-column numbered layout */}
      {topProviders.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>Top Rated in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {topProviders.map((p, i) => (
              <div key={p.id} className="article-row">
                <span className="text-2xl font-bold text-accent leading-none mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/uae/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="font-bold text-dark hover:text-accent transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.googleRating && (
                    <p className="text-xs text-muted mt-0.5">
                      {p.googleRating}/5 stars · {p.googleReviewCount?.toLocaleString()} reviews
                    </p>
                  )}
                  {p.shortDescription && (
                    <p className="text-sm text-muted mt-1 line-clamp-1">{p.shortDescription}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <FaqSection faqs={faqs} title={`Healthcare in ${city.name} — FAQ`} />
    </div>
  );
}
