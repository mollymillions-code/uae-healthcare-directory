import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getCities, getCategories, getProviderCountByCity,
  getProviderCountByCategoryAndCity, getTopRatedProviders,
} from "@/lib/data";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── generateMetadata ───────────────────────────────────────────────────────────

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const url = `${base}/best`;

  const title = "Best Healthcare Providers in the UAE — Top-Rated Clinics & Hospitals [2026]";
  const description =
    "Find the best-rated hospitals, clinics, dental practices, and specialists across all UAE cities. Ranked by Google rating. 12,000+ providers from DHA, DOH, and MOHAP registers.";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function BestIndexPage() {
  const base = getBaseUrl();
  const cities = getCities();
  const categories = getCategories();

  // Build city cards with counts, top provider, and per-category counts in parallel
  const cityDataRaw = await Promise.all(cities
    .map(async (city) => {
      const [count, topProviders, catCounts] = await Promise.all([
        getProviderCountByCity(city.slug),
        getTopRatedProviders(city.slug, 1),
        Promise.all(categories.map((cat) => getProviderCountByCategoryAndCity(cat.slug, city.slug))),
      ]);
      const topProvider = topProviders[0];
      const catCount = catCounts.filter((c) => c > 0).length;
      return { ...city, count, topProvider, catCount, catCounts };
    }));
  const cityData = cityDataRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Build popular category combos from already-fetched catCounts (no extra queries)
  const popularCombos: { citySlug: string; cityName: string; catSlug: string; catName: string; count: number }[] = [];
  for (const row of cityDataRaw) {
    for (let i = 0; i < categories.length; i++) {
      const count = row.catCounts[i];
      if (count >= 5) {
        popularCombos.push({
          citySlug: row.slug,
          cityName: row.name,
          catSlug: categories[i].slug,
          catName: categories[i].name,
          count,
        });
      }
    }
  }
  popularCombos.sort((a, b) => b.count - a.count);
  const topCombos = popularCombos.slice(0, 16);

  const totalProviders = cityData.reduce((sum, c) => sum + c.count, 0);

  const faqs = [
    {
      question: "How does the UAE Open Healthcare Directory rank providers?",
      answer:
        "Providers are ranked by Google rating (highest first), with review count used as a tiebreaker. Only providers with a rating above 0 are included. All data is sourced from official DHA, DOH, and MOHAP government registers.",
    },
    {
      question: "Which UAE city has the most healthcare providers?",
      answer: cityData.length > 0
        ? `${cityData.sort((a, b) => b.count - a.count)[0].name} has the most healthcare providers with ${cityData[0].count.toLocaleString()} listed in the UAE Open Healthcare Directory, followed by ${cityData[1]?.name || "other cities"}.`
        : "Browse the city listings below to compare provider counts.",
    },
    {
      question: "Are these rankings based on paid placements?",
      answer:
        "No. Rankings are based solely on publicly available Google ratings and review counts. There are no paid placements or sponsored rankings. The UAE Open Healthcare Directory is a free, open resource.",
    },
    {
      question: "How often are rankings updated?",
      answer:
        "Provider data is regularly updated and cross-referenced with official DHA, DOH, and MOHAP registers. Google ratings and review counts are refreshed periodically. Last verified March 2026.",
    },
    {
      question: "Can I find the best specialists in my area?",
      answer:
        "Yes. Select your city below, then choose a specialty category to see the top-rated providers in your area. You can compare ratings, review counts, insurance acceptance, and more.",
    },
  ];

  // Sort back by sortOrder for display
  const sortedCities = [...cityData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Best Healthcare" },
      ])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Best Healthcare" },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best Healthcare Providers in the UAE
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalProviders.toLocaleString()} providers across {cityData.length} cities
          {" "}&middot; Ranked by Google rating &middot; DHA / DOH / MOHAP
          {" "}&middot; Updated March 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          The UAE Open Healthcare Directory lists {totalProviders.toLocaleString()} healthcare
          providers across {cityData.length} cities in the United Arab Emirates. Select a city
          below to find the best-rated hospitals, clinics, dental practices, and specialists —
          all ranked by Google rating and verified against official DHA, DOH, and MOHAP
          government registers. Data last verified March 2026.
        </p>
      </div>

      {/* City Grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Select a City</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedCities.map((city) => (
            <Link
              key={city.slug}
              href={`/best/${city.slug}`}
              className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  {city.name}
                </h3>
                <span className="font-['Geist',sans-serif] text-xs text-black/40">{city.emirate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/40">
                  {city.count.toLocaleString()} providers
                </span>
                <span className="text-black/40">
                  {city.catCount} categories
                </span>
              </div>
              {city.topProvider && Number(city.topProvider.googleRating) > 0 && (
                <div className="border-t border-black/[0.06] mt-3 pt-3">
                  <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">
                    Top-Rated
                  </p>
                  <p className="text-xs font-bold text-[#1c1c1c] truncate">
                    {city.topProvider.name}
                  </p>
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 mt-1 inline-block">
                    {city.topProvider.googleRating} ★
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Category x City Combos */}
      {topCombos.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Popular Searches</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topCombos.map((combo) => (
              <Link
                key={`${combo.citySlug}-${combo.catSlug}`}
                href={`/best/${combo.citySlug}/${combo.catSlug}`}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="text-xs font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                  Best {combo.catName} in {combo.cityName}
                </p>
                <p className="text-[11px] text-[#006828] font-bold mt-1">
                  {combo.count} providers
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title="Best Healthcare in the UAE — FAQ"
      />

      {/* Methodology */}
      <section className="mb-10 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Ranking Methodology</h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            The UAE Open Healthcare Directory ranks providers by <strong>Google rating</strong>{" "}
            (highest first), using <strong>review count</strong> as a tiebreaker. Only
            providers with a rating above 0 are included in rankings.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            All provider data is sourced from three official UAE health authority registers:
            the <strong>Dubai Health Authority (DHA)</strong>, the{" "}
            <strong>Department of Health Abu Dhabi (DOH)</strong>, and the{" "}
            <strong>Ministry of Health and Prevention (MOHAP)</strong>.
          </p>
          <p className="text-[11px] text-black/40">
            These rankings do not constitute medical advice. Always verify credentials and
            consult with your healthcare provider before making decisions.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available Google ratings
          and review counts and do not constitute a medical recommendation. Provider data is
          sourced from official DHA, DOH, and MOHAP registers, last verified March 2026.
        </p>
      </div>
    </div>
  );
}
