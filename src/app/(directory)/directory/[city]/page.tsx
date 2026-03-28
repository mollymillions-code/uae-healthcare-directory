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
      images: [{ url: `${getBaseUrl()}/images/cities/${city.slug}.webp`, width: 1200, height: 630, alt: `Healthcare in ${city.name}, UAE` }],
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

  const catCounts = await Promise.all(
    categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))
  );
  const catsWithCounts = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .filter((cat) => cat.count > 0);

  const areaCounts = await Promise.all(
    areas.map((area) => getProviderCountByAreaAndCity(area.slug, city.slug))
  );
  const areasWithCounts = areas.map((area, i) => ({ ...area, count: areaCounts[i] }));

  const ratedProviders = topProviders.filter((p) => Number(p.googleRating) > 0);
  const hasRatings = ratedProviders.length > 0;
  const featuredProviders = hasRatings
    ? ratedProviders.slice(0, 6)
    : topProviders.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);

  return (
    <>
      {/* Header + Search + Categories */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            Healthcare Providers in {city.name}, UAE
          </h1>

          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed mb-4">
            {getEditorialBlurb(city.name, total, regulator)}
          </p>

          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
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

        {/* Categories */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Medical Specialties in {city.name}</h2>
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

      {/* Neighborhoods */}
      {areas.length > 0 && (
        <section className="bg-[#f8f8f6] py-10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Neighborhoods in {city.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasWithCounts.map((area) => (
                <Link
                  key={area.slug}
                  href={`/directory/${city.slug}/${area.slug}`}
                  className="flex items-center justify-between bg-white border border-black/[0.06] rounded-xl px-4 py-3 font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:shadow-card transition-all duration-300"
                >
                  <span className="font-['Geist',sans-serif] font-medium">{area.name}</span>
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

      {/* Filter shortcuts */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Filter Providers in {city.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: `/directory/${city.slug}/insurance`, label: "By Insurance", sub: "Daman, Thiqa, AXA..." },
              { href: `/directory/${city.slug}/language`, label: "By Language", sub: "Arabic, English, Hindi..." },
              { href: `/directory/${city.slug}/condition`, label: "By Condition", sub: "Dental, LASIK, IVF..." },
              { href: `/directory/${city.slug}/procedures`, label: "Procedure Costs", sub: "Dental, LASIK, MRI..." },
            ].map((filter) => (
              <Link key={filter.href} href={filter.href} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:shadow-card transition-all duration-300">
                <span className="font-['Bricolage_Grotesque',sans-serif] font-medium tracking-tight">{filter.label}</span>
                <span className="font-['Geist',sans-serif] text-xs text-black/30">{filter.sub}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Featured Providers */}
      {featuredProviders.length > 0 && (
        <section className="bg-[#f8f8f6] py-10">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Featured Providers in {city.name}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {featuredProviders.map((p, i) => (
                <div key={p.id} className="flex items-start gap-4 py-4 px-2 border-b border-black/[0.06] hover:bg-white transition-colors group">
                  <span className="font-['Geist',sans-serif] text-2xl font-medium text-[#006828]/25 leading-none mt-0.5 w-8 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] hover:text-[#006828] transition-colors tracking-tight"
                    >
                      {p.name}
                    </Link>
                    {hasRatings && Number(p.googleRating) > 0 && (
                      <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">
                        {p.googleRating}/5 stars · {p.googleReviewCount?.toLocaleString()} reviews
                      </p>
                    )}
                    {p.shortDescription && (
                      <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-1 line-clamp-1">{p.shortDescription}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest news + FAQ */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {(() => {
          const latestArticles = getLatestArticles(3);
          return latestArticles.length > 0 ? (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Latest Healthcare News</h2>
              </div>
              <div className="space-y-3">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/intelligence/${article.slug}`}
                    className="block border-b border-black/[0.06] pb-3 group"
                  >
                    <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">{article.title}</p>
                    <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{article.excerpt.slice(0, 120)}...</p>
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
