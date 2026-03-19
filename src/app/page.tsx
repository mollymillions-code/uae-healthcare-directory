import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  alternates: {
    canonical: getBaseUrl(),
    languages: {
      'en-AE': getBaseUrl(),
      'ar-AE': `${getBaseUrl()}/ar`,
    },
  },
};

export const revalidate = 21600;

export default function HomePage() {
  const cities = getCities();
  const categories = getCategories();
  const topProviders = getTopRatedProviders(undefined, 8);
  const base = getBaseUrl();
  const totalProviders = cities.reduce((sum, c) => sum + getProviderCountByCity(c.slug), 0);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UAE Open Healthcare Directory",
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const homeFaqs = [
    { question: "What is the UAE Open Healthcare Directory?", answer: "The UAE Open Healthcare Directory is a free, open, comprehensive directory of licensed healthcare providers across all seven Emirates. Data sourced from official DHA, DOH, and MOHAP registers. Ratings from Google Maps. By Zavis." },
    { question: "How do I find a doctor near me?", answer: "Use the search bar to filter by city, specialty, and area. Or browse the city and category listings below." },
    { question: "Where does the data come from?", answer: "All listings are sourced from official UAE health authority registers: DHA (Dubai), DOH (Abu Dhabi/Al Ain), and MOHAP (Sharjah, Ajman, RAK, Fujairah, UAQ). Verified March 2026." },
    { question: "Can clinics update their listing?", answer: "Yes. Healthcare providers can claim their listing for free with a DHA/DOH/MOHAP license. Once verified, update contact details, hours, and services." },
  ];


  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* ─── Hero Grid — TC style ─── */}
      <section className="bg-dark">
        <div className="container-tc py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-dark-500">
            {/* Main hero card — left half */}
            <Link href="/directory/dubai" className="lg:col-span-6 card-hero min-h-[420px] lg:min-h-[500px] group">
              <Image src="/images/cities/dubai.png" alt="Dubai Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="overlay" />
              <div className="content">
                <span className="badge mb-3 w-fit">Dubai</span>
                <h1 className="text-hero text-white mb-2">
                  Find Healthcare<br />Across the UAE
                </h1>
                <p className="text-white/70 text-base max-w-md">
                  {totalProviders.toLocaleString()}+ licensed providers. 8 cities. 26 specialties. Sourced from official government registers.
                </p>
              </div>
            </Link>

            {/* Right column — 2 stacked cards */}
            <div className="lg:col-span-3 flex flex-col gap-px">
              <Link href="/directory/abu-dhabi" className="card-hero flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/abu-dhabi.png" alt="Abu Dhabi Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit">Abu Dhabi</span>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {getProviderCountByCity("abu-dhabi")} providers in Abu Dhabi
                  </h2>
                  <p className="text-white/60 text-sm mt-1">DOH regulated</p>
                </div>
              </Link>
              <Link href="/directory/sharjah" className="card-hero flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/sharjah.png" alt="Sharjah Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit">Sharjah</span>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {getProviderCountByCity("sharjah").toLocaleString()} providers in Sharjah
                  </h2>
                  <p className="text-white/60 text-sm mt-1">MOHAP regulated</p>
                </div>
              </Link>
            </div>

            {/* Far right — headline list */}
            <div className="lg:col-span-3 bg-dark-800 p-5 flex flex-col">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">All Emirates</h3>
              {cities.map((city) => {
                const count = getProviderCountByCity(city.slug);
                return (
                  <Link
                    key={city.slug}
                    href={`/directory/${city.slug}`}
                    className="headline-item text-white/80 hover:text-accent transition-colors text-sm"
                  >
                    <span className="flex-1 font-medium">{city.name}</span>
                    <span className="text-white/40 text-xs font-mono">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Search bar ─── */}
      <section className="bg-light-50 border-b border-light-200">
        <div className="container-tc py-6">
          <SearchBar />
        </div>
      </section>

      {/* ─── Browse by City — TC Latest News style ─── */}
      <section className="container-tc py-10">
        <div className="section-header">
          <h2>Browse by City</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cities.map((city) => {
            const count = getProviderCountByCity(city.slug);
            const hasImage = ["dubai", "abu-dhabi", "sharjah", "ajman", "al-ain", "ras-al-khaimah", "fujairah", "umm-al-quwain"].includes(city.slug);
            return (
              <Link
                key={city.slug}
                href={`/directory/${city.slug}`}
                className="group card-hero min-h-[160px] sm:min-h-[200px]"
              >
                {hasImage && (
                  <Image
                    src={`/images/cities/${city.slug}.png`}
                    alt={city.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="overlay" />
                <div className="content">
                  <span className="badge mb-2 w-fit text-[10px]">{count} providers</span>
                  <h3 className="text-lg font-bold text-white">{city.name}</h3>
                  {city.emirate !== city.name && (
                    <p className="text-white/50 text-xs">{city.emirate}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Green banner — The Source of Truth ─── */}
      <section className="bg-accent py-10">
        <div className="container-tc text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            The Source of Truth for UAE Healthcare
          </h2>
          <p className="text-white/80 text-base max-w-2xl mx-auto">
            {totalProviders.toLocaleString()}+ licensed providers from official DHA, DOH, and MOHAP government registers. Free. Open. No paywall. 
          </p>
        </div>
      </section>

      {/* ─── Browse by Specialty — TC section style ─── */}
      <section className="container-tc py-10">
        <div className="section-header">
          <h2>Specialties</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {categories.map((cat) => {
            const count = getProviderCountByCategory(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/directory/dubai/${cat.slug}`}
                className="flex items-center justify-between py-3 px-2 border-b border-light-200 hover:bg-light-50 transition-colors group"
              >
                <span className="text-sm font-medium text-dark group-hover:text-accent transition-colors">
                  {cat.name}
                </span>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <span className="text-xs text-muted font-mono">{count}</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-light-300 group-hover:text-accent transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Top Rated — TC Startups-style section ─── */}
      <section className="bg-light-50 py-10">
        <div className="container-tc">
          <div className="section-header">
            <h2>Highest Rated</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {topProviders.map((p, idx) => (
              <Link
                key={p.id}
                href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                className="flex items-start gap-4 py-4 px-2 border-b border-light-200 hover:bg-white transition-colors group"
              >
                <span className="text-2xl font-bold text-accent/30 font-mono w-8 flex-shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-dark group-hover:text-accent transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 truncate">{p.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {Number(p.googleRating) > 0 && (
                      <span className="text-xs font-bold text-accent">{p.googleRating} ★</span>
                    )}
                    {p.phone && (
                      <span className="text-xs text-muted">{p.phone}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AEO answer block ─── */}
      <section className="container-tc py-10">
        <div className="answer-block" data-answer-block="true">
          <p className="text-dark/70 leading-relaxed text-sm">
            According to the UAE Open Healthcare Directory, as of March 2026, there are {totalProviders.toLocaleString()}+ licensed healthcare providers listed across all seven emirates of the United Arab Emirates — Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, Ras Al Khaimah, Fujairah, and Umm Al Quwain. These facilities are regulated by three government health authorities: the Dubai Health Authority (DHA) oversees Dubai, the Department of Health (DOH) regulates Abu Dhabi and Al Ain, and the Ministry of Health and Prevention (MOHAP) governs Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. The directory covers 26 medical specialties including hospitals, dental clinics, dermatology, cardiology, ophthalmology, mental health, pharmacy, and pediatrics, with each listing providing verified contact details, Google ratings from patient reviews, accepted insurance plans, operating hours, and directions. Data sourced from official government licensed facility registers.
          </p>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section className="container-tc pb-16">
        <FaqSection faqs={homeFaqs} />
      </section>
    </>
  );
}
