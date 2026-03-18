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

export const revalidate = 86400;

export default function HomePage() {
  const cities = getCities();
  const categories = getCategories();
  const topProviders = getTopRatedProviders(undefined, 6);
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

  const totalProviders = cities.reduce((sum, c) => sum + getProviderCountByCity(c.slug), 0);

  return (
    <>
      <JsonLd data={websiteJsonLd} />

      {/* ─── Data ticker bar ─── */}
      <div className="data-bar">
        <div className="animate-ticker inline-flex gap-12">
          <div><span className="text-gold mr-2">DIR.01</span> {totalProviders.toLocaleString()}+ licensed healthcare providers across the UAE</div>
          <div><span className="text-gold mr-2">DIR.02</span> Official data from DHA, DOH, and MOHAP government registers</div>
          <div><span className="text-gold mr-2">DIR.03</span> Free and open — no login, no paywall, no booking fees</div>
          <div><span className="text-gold mr-2">DIR.04</span> Covering all 7 Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ</div>
          {/* duplicate for seamless loop */}
          <div><span className="text-gold mr-2">DIR.01</span> {totalProviders.toLocaleString()}+ licensed healthcare providers across the UAE</div>
          <div><span className="text-gold mr-2">DIR.02</span> Official data from DHA, DOH, and MOHAP government registers</div>
          <div><span className="text-gold mr-2">DIR.03</span> Free and open — no login, no paywall, no booking fees</div>
          <div><span className="text-gold mr-2">DIR.04</span> Covering all 7 Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ</div>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="container-wide py-16 sm:py-24 relative overflow-hidden">
        {/* Giant background letters */}
        <div className="absolute -top-[10%] -left-[5%] w-[110%] h-[120%] pointer-events-none z-0 overflow-hidden opacity-[0.04] text-green">
          <span className="font-display text-[40vw] leading-[0.7] font-bold absolute top-[-10%] left-[10%] -rotate-[5deg]">U</span>
          <span className="font-display text-[40vw] leading-[0.7] font-bold absolute top-[30%] left-[40%] rotate-[15deg] italic">A</span>
          <span className="font-display text-[40vw] leading-[0.7] font-bold absolute top-[10%] right-[-5%] -rotate-[10deg]">E</span>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <span className="kicker mb-4 block">Healthcare Directory / All Emirates</span>
            <h1 className="font-display text-hero font-bold text-ink mb-6">
              Every Licensed<br />Provider
            </h1>
            <p className="text-lg text-ink-muted max-w-md mb-8 leading-relaxed">
              The definitive directory of hospitals, clinics, pharmacies, and specialists across the
              United Arab Emirates. Sourced from official government registers. Free and open.
            </p>
            <div className="meta">
              <span><span className="highlight">{totalProviders.toLocaleString()}+</span> Providers</span>
              <span><span className="highlight">8</span> Cities</span>
              <span><span className="highlight">26</span> Specialties</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ─── Cities — editorial grid ─── */}
      <section className="container-wide py-12">
        <div className="rule-heavy" />
        <div className="flex items-baseline justify-between pt-4 pb-6">
          <h2 className="font-display text-display uppercase tracking-[0.05em]">Browse by City</h2>
          <span className="kicker">{cities.length} Emirates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-0">
          {cities.map((city) => {
            const count = getProviderCountByCity(city.slug);
            return (
              <Link
                key={city.slug}
                href={`/uae/${city.slug}`}
                className="group flex items-baseline justify-between py-3.5 border-b border-ink-light"
              >
                <div>
                  <span className="font-display text-xl font-semibold text-ink group-hover:text-gold transition-colors">
                    {city.name}
                  </span>
                  {city.emirate !== city.name && (
                    <span className="text-xs text-ink-muted ml-2">{city.emirate}</span>
                  )}
                </div>
                <span className="font-display text-lg italic text-gold tabular-nums">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Editorial break ─── */}
      <section className="bg-ink text-canvas py-20 sm:py-28 text-center relative overflow-hidden editorial-glow border-t border-b border-gold">
        <div className="relative z-10">
          <div className="font-display text-[7vw] sm:text-[5vw] leading-[0.85] uppercase tracking-[0.02em]">
            <span className="block">The Source</span>
            <span className="block text-gold italic">of Truth</span>
            <span className="block">for Healthcare</span>
          </div>
          <div className="mt-8 font-kicker text-[0.85rem] tracking-[0.15em] text-canvas/60 uppercase">
            All Emirates // Official Government Data // Free Access
          </div>
        </div>
      </section>

      {/* ─── Categories — dense editorial list ─── */}
      <section className="container-wide py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <div className="rule-heavy" />
            <h2 className="font-display text-display-lg mt-4 mb-2">Browse by<br />Specialty</h2>
            <p className="font-kicker text-ink-muted tracking-[0.05em] text-sm max-w-xs">
              26 medical categories covering every licensed healthcare discipline in the UAE.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="rule-heavy" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 pt-4">
              {categories.map((cat, i) => {
                const count = getProviderCountByCategory(cat.slug);
                return (
                  <Link
                    key={cat.slug}
                    href={`/uae/dubai/${cat.slug}`}
                    className="group flex items-baseline justify-between py-2.5 border-b border-ink-light"
                  >
                    <span className="text-sm text-ink group-hover:text-gold transition-colors truncate pr-2">
                      {cat.name}
                    </span>
                    {count > 0 && (
                      <span className="font-display text-sm italic text-gold/60 tabular-nums flex-shrink-0">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Top Rated — index materia style ─── */}
      <section className="container-wide py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <div className="rule-heavy" />
            <h2 className="font-display text-display-lg mt-4 mb-2">Index<br />Materia</h2>
            <p className="font-kicker text-ink-muted tracking-[0.05em] text-sm max-w-xs">
              The highest-rated healthcare facilities across the UAE, verified against official registers.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="rule-heavy" />
            <div className="pt-4">
              {topProviders.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/uae/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                  className="list-item group"
                >
                  <div className="number">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="content">
                    <h4 className="group-hover:text-gold transition-colors">{p.name}</h4>
                    <div className="meta">
                      <span>{p.address}</span>
                      {Number(p.googleRating) > 0 && <span>{p.googleRating}★</span>}
                    </div>
                  </div>
                  <span className="btn-outline text-xs">View</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── AEO answer block ─── */}
      <section className="container-wide py-12">
        <div className="answer-block" data-answer-block="true">
          <p className="text-ink-muted leading-relaxed">
            The United Arab Emirates has {totalProviders.toLocaleString()}+ licensed healthcare providers across 7 Emirates.
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
