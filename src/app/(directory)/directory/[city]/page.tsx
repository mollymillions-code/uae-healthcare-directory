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
import { getLatestArticles } from "@/lib/intelligence/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props { params: { city: string } }

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = await getProviderCountByCity(city.slug);
  return {
    title: `Healthcare Providers in ${city.name}, UAE | ${count}+ Listings`,
    description: `Find ${count}+ healthcare providers in ${city.name}, UAE. Browse hospitals, clinics, dentists, and specialists with ratings, reviews, and contact details. Last verified March 2026.`,
    alternates: {
      canonical: `${getBaseUrl()}/directory/${city.slug}`,
      languages: {
        'en-AE': `${getBaseUrl()}/directory/${city.slug}`,
        'ar-AE': `${getBaseUrl()}/ar/directory/${city.slug}`,
      },
    },
    openGraph: {
      title: `Healthcare Providers in ${city.name}, UAE`,
      description: `Find ${count}+ healthcare providers in ${city.name}. Browse hospitals, clinics, dentists, and specialists with ratings and reviews.`,
      type: 'website',
      locale: 'en_AE',
      siteName: 'UAE Open Healthcare Directory',
      url: `${getBaseUrl()}/directory/${city.slug}`,
      images: [{ url: `${getBaseUrl()}/images/cities/${city.slug}.png`, width: 1200, height: 630, alt: `Healthcare in ${city.name}, UAE` }],
    },
  };
}

function getRegulatorName(cityName: string): string {
  if (cityName === "Dubai") return "the Dubai Health Authority (DHA)";
  if (cityName === "Abu Dhabi" || cityName === "Al Ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getEditorialBlurb(cityName: string, total: number, regulator: string): string {
  if (cityName === "Dubai") {
    return `Dubai is home to ${total} licensed healthcare facilities regulated by ${regulator}. From world-class hospitals in Healthcare City to neighborhood clinics in Al Barsha, find the right provider for your needs.`;
  }
  if (cityName === "Abu Dhabi") {
    return `Abu Dhabi is home to ${total} licensed healthcare facilities regulated by ${regulator}. From flagship hospitals on Al Maryah Island to specialist clinics in Khalifa City, explore the capital's healthcare network.`;
  }
  if (cityName === "Al Ain") {
    return `Al Ain is home to ${total} licensed healthcare facilities regulated by ${regulator}. Known as the Garden City, Al Ain offers a growing network of hospitals and clinics serving the eastern region.`;
  }
  if (cityName === "Sharjah") {
    return `Sharjah is home to ${total} licensed healthcare facilities regulated by ${regulator}. From medical centers in Al Nahda to clinics in Al Majaz, discover quality healthcare across the emirate.`;
  }
  return `${cityName} is home to ${total} licensed healthcare facilities regulated by ${regulator}. Browse hospitals, clinics, and specialist providers serving the community.`;
}

export default async function CityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const categories = getCategories();
  const areas = getAreasByCity(city.slug);
  const topProviders = await getTopRatedProviders(city.slug, 12);
  const faqs = getFaqs("city", city.slug);
  const total = await getProviderCountByCity(city.slug);
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.name);

  // Pre-fetch category counts (async) before render
  const catCounts = await Promise.all(
    categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))
  );
  const catsWithCounts = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .filter((cat) => cat.count > 0);

  // Pre-fetch area counts (async) before render
  const areaCounts = await Promise.all(
    areas.map((area) => getProviderCountByAreaAndCity(area.slug, city.slug))
  );
  const areasWithCounts = areas.map((area, i) => ({ ...area, count: areaCounts[i] }));

  // Featured providers: only rated > 0; fallback to first 6 alphabetically
  const ratedProviders = topProviders.filter((p) => Number(p.googleRating) > 0);
  const hasRatings = ratedProviders.length > 0;
  const featuredProviders = hasRatings
    ? ratedProviders.slice(0, 6)
    : topProviders.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);

  return (
    <>
      {/* White section: Header + Search + Categories */}
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: city.name, url: `${base}/directory/${city.slug}` },
        ])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />

        <Breadcrumb items={[
          { label: "UAE", href: "/" },
          { label: city.name },
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-3">
            Healthcare Providers in {city.name}, UAE
          </h1>

          {/* Editorial blurb */}
          <p className="text-muted leading-relaxed mb-4">
            {getEditorialBlurb(city.name, total, regulator)}
          </p>

          {/* Natural language paragraph for LLM citation */}
          <div className="answer-block mb-6" data-answer-block="true">
            <p className="text-muted leading-relaxed">
              According to the UAE Open Healthcare Directory, as of March 2026, {city.name} has {total}+ registered healthcare providers listed across {categories.length} medical specialties and {areas.length} neighborhoods.
              {city.name === "Dubai" && " Healthcare in Dubai is regulated by the Dubai Health Authority (DHA)."}
              {city.name === "Abu Dhabi" && " Healthcare in Abu Dhabi is regulated by the Department of Health (DOH)."}
              {city.name === "Al Ain" && " Healthcare in Al Ain falls under the Department of Health Abu Dhabi (DOH)."}
              {!["Dubai", "Abu Dhabi", "Al Ain"].includes(city.name) && ` Healthcare in ${city.name} is regulated by the Ministry of Health and Prevention (MOHAP).`}
              {" "}All listings include verified contact details, Google ratings from real patient reviews,
              accepted insurance plans, operating hours, and directions.
              Data sourced from official government licensed facility registers. Last verified March 2026.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <SearchBar compact defaultCity={city.slug} />
        </div>

        {/* Categories — white background */}
        <section className="mb-10">
          <div className="section-header">
            <h2>Medical Specialties in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
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
              />
            ))}
          </div>
        </section>
      </div>

      {/* bg-light-50 section: Neighborhoods */}
      {areas.length > 0 && (
        <section className="bg-light-50 py-10">
          <div className="container-tc">
            <div className="section-header">
              <h2>Neighborhoods in {city.name}</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasWithCounts.map((area) => (
                <Link
                  key={area.slug}
                  href={`/directory/${city.slug}/${area.slug}`}
                  className="flex items-center justify-between bg-white border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"
                >
                  <span className="font-medium">{area.name}</span>
                  {area.count > 0 && (
                    <span className="text-muted text-xs">
                      {area.count} {area.count === 1 ? "provider" : "providers"}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* White section: Filter shortcuts */}
      <div className="container-tc py-10">
        <section className="mb-10">
          <div className="section-header">
            <h2>Filter Providers in {city.name}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href={`/directory/${city.slug}/insurance`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors">
              <span className="font-medium">By Insurance</span>
              <span className="text-xs text-muted">Daman, Thiqa, AXA...</span>
            </Link>
            <Link href={`/directory/${city.slug}/language`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors">
              <span className="font-medium">By Language</span>
              <span className="text-xs text-muted">Arabic, English, Hindi...</span>
            </Link>
            <Link href={`/directory/${city.slug}/condition`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors">
              <span className="font-medium">By Condition</span>
              <span className="text-xs text-muted">Dental, LASIK, IVF...</span>
            </Link>
            <Link href={`/directory/${city.slug}/procedures`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors">
              <span className="font-medium">Procedure Costs</span>
              <span className="text-xs text-muted">Dental, LASIK, MRI...</span>
            </Link>
          </div>
        </section>
      </div>

      {/* bg-light-50 section: Featured Providers */}
      {featuredProviders.length > 0 && (
        <section className="bg-light-50 py-10">
          <div className="container-tc">
            <div className="section-header">
              <h2>Featured Providers in {city.name}</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {featuredProviders.map((p, i) => (
                <div key={p.id} className="article-row">
                  <span className="text-2xl font-bold text-accent leading-none mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                      className="font-bold text-dark hover:text-accent transition-colors"
                    >
                      {p.name}
                    </Link>
                    {hasRatings && Number(p.googleRating) > 0 && (
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
          </div>
        </section>
      )}

      {/* White section: Latest news + FAQ */}
      <div className="container-tc py-10">
        {/* Cross-link to intelligence */}
        {(() => {
          const latestArticles = getLatestArticles(3);
          return latestArticles.length > 0 ? (
            <section className="mb-10">
              <div className="section-header">
                <h2>Latest Healthcare News</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="space-y-3">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/intelligence/${article.slug}`}
                    className="block border-b border-light-200 pb-3 hover:text-accent transition-colors"
                  >
                    <p className="text-sm font-medium text-dark">{article.title}</p>
                    <p className="text-xs text-muted mt-1">{article.excerpt.slice(0, 120)}...</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })()}

        <FaqSection faqs={faqs} title={`Healthcare in ${city.name} — FAQ`} />
      </div>
    </>
  );
}

