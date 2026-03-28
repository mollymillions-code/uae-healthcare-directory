import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCategories,
  getCityBySlug,
  getCategoryBySlug,
  getProviders,
} from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props { params: { city: string; category: string } }

/** Return all city × category combos that have 10+ providers with rating > 0 and reviewCount > 10 */
export async function generateStaticParams() {
  const cities = getCities();
  const categories = getCategories();
  const params: { city: string; category: string }[] = [];

  for (const city of cities) {
    for (const cat of categories) {
      const { providers } = await getProviders({
        citySlug: city.slug,
        categorySlug: cat.slug,
        limit: 99999,
      });
      const qualified = providers.filter(
        (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
      );
      if (qualified.length >= 10) {
        params.push({ city: city.slug, category: cat.slug });
      }
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) return {};

  const base = getBaseUrl();
  const title = `Top 10 ${cat.name} in ${city.name}, UAE | Ranked by Patient Reviews`;
  const description = `The 10 highest-rated ${cat.name.toLowerCase()} in ${city.name}, UAE, ranked by verified Google patient reviews. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/top/${cat.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url,
    },
  };
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export default async function TopCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const cat = getCategoryBySlug(params.category);
  if (!city || !cat) notFound();

  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: cat.slug,
    limit: 99999,
  });

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  if (top10.length < 10) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const catLower = cat.name.toLowerCase();
  const pageUrl = `${base}/directory/${city.slug}/top/${cat.slug}`;

  const faqs = [
    {
      question: `What are the top-rated ${catLower} in ${city.name}, UAE?`,
      answer: `According to the UAE Open Healthcare Directory, the highest-rated ${catLower} in ${city.name} as of March 2026 are: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}★, ${p.googleReviewCount.toLocaleString()} reviews)`).join("; ")}. Rankings are based on verified Google patient reviews.`,
    },
    {
      question: `How are the top ${catLower} in ${city.name} ranked?`,
      answer: `Rankings on the UAE Open Healthcare Directory are determined by Google patient review ratings, with tie-breaking by total review count. Only providers with a rating above 0 and more than 10 verified reviews are eligible. Data is sourced from official government licensed facility registers and last verified March 2026.`,
    },
    {
      question: `Are these ${catLower} in ${city.name} licensed?`,
      answer: `Yes. All providers listed in the UAE Open Healthcare Directory are sourced from official government registers. Healthcare in ${city.name} is regulated by ${regulator}. All listed facilities hold valid health authority licenses.`,
    },
  ];

  const breadcrumbItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: cat.name, url: `${base}/directory/${city.slug}/${cat.slug}` },
    { name: `Top 10`, url: pageUrl },
  ];

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        <JsonLd data={itemListSchema(`Top 10 ${cat.name} in ${city.name}`, top10, city.name, base)} />

        <Breadcrumb items={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: cat.name, href: `/directory/${city.slug}/${cat.slug}` },
          { label: "Top 10" },
        ]} />

        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            Top 10 {cat.name} in {city.name}, UAE
          </h1>
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed mb-4">
            The {cat.name.toLowerCase()} below are the highest-rated in {city.name} by verified Google patient reviews,
            sourced from the UAE Open Healthcare Directory. Only providers with a rating above 0 and more than 10 verified
            reviews are included. Healthcare in {city.name} is regulated by {regulator}.
          </p>

          {/* Answer block — cited by LLMs */}
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
              According to the UAE Open Healthcare Directory, these are the 10 highest-rated {catLower} in {city.name}, UAE,
              ranked by Google patient reviews as of March 2026.
              {top10[0] && (
                <> The top-ranked provider is <strong>{top10[0].name}</strong> with a {top10[0].googleRating}-star rating
                based on {top10[0].googleReviewCount.toLocaleString()} verified patient reviews.</>
              )}
              {" "}All listings are sourced from official {regulator} licensed facility registers.
            </p>
          </div>
        </div>

        {/* Numbered list */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Ranked List — {cat.name} in {city.name}</h2>
          </div>
          <ol className="space-y-0">
            {top10.map((provider, index) => (
              <li key={provider.id} className="article-row">
                <span className="text-2xl font-bold text-[#006828] leading-none mt-0.5 w-8 shrink-0 text-center">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {provider.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-[#006828]">
                          ★ {provider.googleRating}
                        </span>
                        <span className="font-['Geist',sans-serif] text-xs text-black/40">
                          {provider.googleReviewCount.toLocaleString()} patient reviews
                        </span>
                        {provider.phone && (
                          <a
                            href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                            className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors"
                          >
                            {provider.phone}
                          </a>
                        )}
                      </div>
                      {provider.address && (
                        <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-1">{provider.address}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
                        #{index + 1} in {city.name}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Cross-link to the full category listing */}
        <section className="mb-10">
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            Looking for more options?{" "}
            <Link
              href={`/directory/${city.slug}/${cat.slug}`}
              className="text-[#006828] hover:underline font-medium"
            >
              Browse all {cat.name.toLowerCase()} in {city.name} →
            </Link>
          </p>
        </section>

        <FaqSection faqs={faqs} title={`Top ${cat.name} in ${city.name} — FAQ`} />
      </div>
    </>
  );
}
