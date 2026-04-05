import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getCities, getCityBySlug, getCategories,
  getProviders, getProviderCountByCategoryAndCity, getProviderCountByCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

async function getTopRatedForCategory(
  citySlug: string,
  categorySlug: string,
): Promise<LocalProvider | undefined> {
  const { providers } = await getProviders({
    citySlug,
    categorySlug,
    sort: "rating",
    limit: 10,
  });
  // Find the highest rated with reviews
  return providers
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const rd = Number(b.googleRating) - Number(a.googleRating);
      if (rd !== 0) return rd;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })[0];
}

// ─── Interfaces ─────────────────────────────────────────────────────────────────

interface Props {
  params: { city: string };
}

// ─── generateStaticParams ───────────────────────────────────────────────────────

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

// ─── generateMetadata ───────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const totalCount = await getProviderCountByCity(city.slug);
  const base = getBaseUrl();
  const url = `${base}/best/${city.slug}`;

  const title = `Best Healthcare in ${city.name} — Top-Rated Clinics, Hospitals & Specialists [2026]`;
  const description = `Find the best-rated healthcare providers in ${city.name}, UAE. ${totalCount} providers ranked by Google rating across ${getCategories().length} categories. Updated March 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'en-AE': url,
        'ar-AE': `${base}/ar/best/${city.slug}`,
      },
    },
    openGraph: { title, description, url, type: "website" },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function BestInCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const totalCount = await getProviderCountByCity(city.slug);
  const categories = getCategories();

  // Build category list with counts and top provider
  const categoryDataRaw = await Promise.all(categories
    .map(async (cat) => {
      const count = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
      if (count === 0) return null;
      const topProvider = await getTopRatedForCategory(city.slug, cat.slug);
      return { ...cat, count, topProvider };
    }));
  const categoryData = categoryDataRaw.filter(Boolean) as {
      slug: string;
      name: string;
      icon: string;
      sortOrder: number;
      count: number;
      topProvider: LocalProvider | undefined;
    }[];

  // Other cities for cross-links
  const otherCitiesRaw = await Promise.all(getCities()
    .filter((c) => c.slug !== city.slug)
    .map(async (c) => ({
      ...c,
      totalProviders: await getProviderCountByCity(c.slug),
    })));
  const otherCities = otherCitiesRaw
    .filter((c) => c.totalProviders > 0)
    .sort((a, b) => b.totalProviders - a.totalProviders);

  // FAQs
  const faqs = [
    {
      question: `What are the best hospitals in ${city.name}?`,
      answer: `The UAE Open Healthcare Directory ranks hospitals in ${city.name} by Google rating and patient reviews. Visit the "Best Hospitals in ${city.name}" page for the full ranked list. Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `How many healthcare providers are in ${city.name}?`,
      answer: `There are ${totalCount.toLocaleString()} healthcare providers listed in ${city.name} across ${categoryData.length} categories, including hospitals, clinics, dental practices, and specialist centers. All data is sourced from official government registers.`,
    },
    {
      question: `How are the "best" healthcare providers in ${city.name} determined?`,
      answer: `Providers are ranked by Google rating (highest first), with review count as a tiebreaker. Only providers with a rating above 0 are included. Data is sourced from official ${regulator.split("(")[0].trim()} registers and the UAE Open Healthcare Directory.`,
    },
    {
      question: `Which healthcare category has the most providers in ${city.name}?`,
      answer: categoryData.length > 0
        ? `The largest category in ${city.name} is ${categoryData.sort((a, b) => b.count - a.count)[0].name} with ${categoryData[0].count} providers, followed by ${categoryData[1]?.name || "others"}.`
        : `Browse the categories below to see provider counts for each specialty in ${city.name}.`,
    },
    {
      question: `Is healthcare in ${city.name} regulated?`,
      answer: `Yes. All healthcare providers in ${city.name} are licensed and regulated by the ${regulator}. The UAE Open Healthcare Directory sources its data from official government registers to ensure accuracy.`,
    },
  ];

  // Sort back to sortOrder for display
  const sortedCategories = [...categoryData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Best", url: `${base}/best` },
        { name: city.name },
      ])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Best", href: "/best" },
        { label: city.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best Healthcare in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalCount.toLocaleString()} providers across {categoryData.length} categories
          {" "}&middot; {regulator} &middot; Updated March 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          The UAE Open Healthcare Directory lists {totalCount.toLocaleString()} healthcare
          providers in {city.name} across {categoryData.length} specialties. Below you will
          find the top-rated provider in each category, ranked by Google rating and review
          count. All providers are licensed by the {regulator}. Data is sourced from official
          government registers, last verified March 2026.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/directory/${city.slug}`}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          Full {city.name} directory
        </Link>
        <Link
          href="/best"
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All cities
        </Link>
      </div>

      {/* Category Grid — each card shows top provider */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top-Rated by Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/best/${city.slug}/${cat.slug}`}
              className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {cat.name}
                </h3>
                <span className="bg-[#006828] text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.count}
                </span>
              </div>

              {cat.topProvider ? (
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">
                    #1 Highest Rated
                  </p>
                  <p className="text-xs font-bold text-[#1c1c1c] truncate">
                    {cat.topProvider.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {Number(cat.topProvider.googleRating) > 0 && (
                      <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {cat.topProvider.googleRating} ★
                      </span>
                    )}
                    {cat.topProvider.googleReviewCount > 0 && (
                      <span className="text-[11px] text-black/40">
                        {cat.topProvider.googleReviewCount.toLocaleString()} reviews
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">{cat.count} providers listed</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`Best Healthcare in ${city.name} — FAQ`}
      />

      {/* Cross-links: other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Best Healthcare in Other Cities</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/best/${c.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.totalProviders.toLocaleString()} providers
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available Google ratings
          and review counts. They do not constitute a medical recommendation. Provider data is
          sourced from official {regulator} registers and the UAE Open Healthcare Directory,
          last verified March 2026. Always confirm details directly with the provider.
        </p>
      </div>
    </div>
  );
}
