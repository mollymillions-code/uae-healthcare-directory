import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCategories,
  getTopRatedProviders,
  getProviderCountByCity,
  getProviderCountByCategory,
} from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowUpRight } from "lucide-react";

export const revalidate = 86400;

export default function HomePage() {
  const cities = getCities();
  const categories = getCategories();
  const topProviders = getTopRatedProviders(undefined, 8);
  const base = getBaseUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UAE Healthcare Directory",
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const homeFaqs = [
    { question: "What is the UAE Healthcare Directory?", answer: "A free, comprehensive directory of licensed healthcare providers across all seven Emirates. Data sourced from official DHA, DOH, and MOHAP registers. Ratings from Google Maps." },
    { question: "How do I find a doctor near me?", answer: "Use the search bar to filter by city, specialty, and area. Or browse the city and category listings below." },
    { question: "Where does the data come from?", answer: "All listings are sourced from official UAE health authority registers: DHA (Dubai), DOH (Abu Dhabi/Al Ain), and MOHAP (Sharjah, Ajman, RAK, Fujairah, UAQ). Verified March 2026." },
    { question: "Can clinics update their listing?", answer: "Yes. Healthcare providers can claim their listing for free with a DHA/DOH/MOHAP license. Once verified, update contact details, hours, and services." },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd} />

      {/* ─── Headline ─── */}
      <section className="container-wide pt-16 pb-10">
        <div className="max-w-4xl">
          <h1 className="font-serif text-display-xl font-bold text-ink leading-[1.05] tracking-tight">
            Find healthcare
            <br />
            <span className="text-warm italic font-light">across the UAE</span>
          </h1>
          <p className="font-serif text-xl text-ink-300 mt-6 max-w-lg leading-relaxed">
            4,000+ licensed providers. 8 cities. 26 specialties.
            <br />
            Sourced from official government registers.
          </p>
        </div>
      </section>

      {/* ─── Search ─── */}
      <section className="container-wide pb-12">
        <SearchBar />
      </section>

      {/* ─── Cities — data table, not cards ─── */}
      <section className="container-wide py-12">
        <div className="rule-thick" />
        <div className="flex items-baseline justify-between pt-4 pb-6">
          <h2 className="font-serif text-2xl font-bold text-ink">By city</h2>
          <span className="label">{cities.length} Emirates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-0">
          {cities.map((city) => {
            const count = getProviderCountByCity(city.slug);
            return (
              <Link
                key={city.slug}
                href={`/uae/${city.slug}`}
                className="group flex items-baseline justify-between py-3.5 rule"
              >
                <div>
                  <span className="text-base font-medium text-ink group-hover:text-warm transition-colors">
                    {city.name}
                  </span>
                  {city.emirate !== city.name && (
                    <span className="text-xs text-ink-200 ml-2">
                      {city.emirate}
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm text-ink-200 group-hover:text-warm transition-colors tabular-nums">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Categories — dense, scannable ─── */}
      <section className="container-wide py-12">
        <div className="rule-thick" />
        <div className="flex items-baseline justify-between pt-4 pb-6">
          <h2 className="font-serif text-2xl font-bold text-ink">
            By specialty
          </h2>
          <span className="label">26 categories</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-0">
          {categories.map((cat) => {
            const count = getProviderCountByCategory(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/uae/dubai/${cat.slug}`}
                className="group flex items-baseline justify-between py-2.5 rule"
              >
                <span className="text-sm text-ink-500 group-hover:text-warm transition-colors truncate pr-2">
                  {cat.name}
                </span>
                {count > 0 && (
                  <span className="font-mono text-xs text-ink-200 tabular-nums flex-shrink-0">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Top Rated — editorial list, not card grid ─── */}
      <section className="container-wide py-12">
        <div className="rule-warm" />
        <div className="flex items-baseline justify-between pt-4 pb-2">
          <h2 className="font-serif text-2xl font-bold text-ink">
            Highest rated
          </h2>
          <Link
            href="/search?sort=rating"
            className="label hover:text-warm transition-colors"
          >
            View all →
          </Link>
        </div>

        <div>
          {topProviders.map((p, i) => (
            <Link
              key={p.id}
              href={`/uae/${p.citySlug}/${p.categorySlug}/${p.slug}`}
              className="group grid grid-cols-12 gap-4 py-4 rule items-baseline"
            >
              <span className="col-span-1 font-mono text-xs text-ink-200">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-5 sm:col-span-4">
                <span className="text-sm font-medium text-ink group-hover:text-warm transition-colors">
                  {p.name}
                </span>
              </div>
              <span className="col-span-3 sm:col-span-3 text-xs text-ink-300 truncate">
                {p.address}
              </span>
              <span className="col-span-1 sm:col-span-2 font-mono text-xs text-ink-300">
                {Number(p.googleRating) > 0 ? `${p.googleRating}★` : "—"}
              </span>
              <span className="col-span-2 text-right">
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-200 group-hover:text-warm transition-colors inline" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── AEO answer block ─── */}
      <section className="container-wide py-12">
        <div className="answer-block" data-answer-block="true">
          <p className="font-serif text-ink-500 leading-relaxed">
            The United Arab Emirates has 4,000+ licensed healthcare providers across 7 Emirates.
            Dubai (regulated by DHA), Abu Dhabi and Al Ain (DOH), and the Northern Emirates of
            Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain (MOHAP).
            This directory covers 26 medical specialties including hospitals, dental,
            dermatology, cardiology, ophthalmology, mental health, and pharmacy.
            All data verified against official government licensed facility registers.
            Last updated March 2026.
          </p>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section className="container-wide pb-16">
        <FaqSection faqs={homeFaqs} />
      </section>
    </>
  );
}
