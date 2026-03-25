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
import { speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ChevronRight, Search, BarChart3, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "UAE Open Healthcare Directory | Find Doctors, Clinics & Hospitals",
  description:
    "Free directory of 12,500+ licensed healthcare providers across the UAE. Find hospitals, clinics, dentists in Dubai, Abu Dhabi, Sharjah with ratings and contact details.",
  openGraph: {
    type: "website",
    title: "UAE Open Healthcare Directory | Find Doctors, Clinics & Hospitals",
    description: "Free directory of 12,500+ licensed healthcare providers across the UAE. Find hospitals, clinics, dentists in Dubai, Abu Dhabi, Sharjah with ratings and contact details.",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory by Zavis",
    url: `${getBaseUrl()}/directory`,
    images: [{ url: `${getBaseUrl()}/images/og-default.png`, width: 1200, height: 630, alt: "UAE Open Healthcare Directory" }],
  },
  alternates: {
    canonical: `${getBaseUrl()}/directory`,
    languages: {
      'en-AE': `${getBaseUrl()}/directory`,
      'ar-AE': `${getBaseUrl()}/ar`,
    },
  },
};

export const revalidate = 21600;

export default async function DirectoryHomePage() {
  const cities = getCities();
  const categories = getCategories();
  const base = getBaseUrl();

  // Fetch all async data in parallel
  const [cityCounts, catCounts, topProviders] = await Promise.all([
    Promise.all(cities.map((c) => getProviderCountByCity(c.slug))),
    Promise.all(categories.map((cat) => getProviderCountByCategory(cat.slug))),
    getTopRatedProviders(undefined, 20),
  ]);

  const cityCountMap = Object.fromEntries(cities.map((c, i) => [c.slug, cityCounts[i]]));
  const totalProviders = cityCounts.reduce((sum, count) => sum + count, 0);

  // Top 8 categories sorted by provider count
  const categoriesWithCount = categories
    .map((cat, i) => ({ ...cat, count: catCounts[i] }))
    .sort((a, b) => b.count - a.count);
  const top8Categories = categoriesWithCount.slice(0, 8);

  // Featured providers: only those with ratings > 0, otherwise first 8 alphabetically
  const ratedProviders = topProviders.filter((p) => Number(p.googleRating) > 0);
  const hasRatings = ratedProviders.length > 0;
  const featuredProviders = hasRatings
    ? ratedProviders.slice(0, 8)
    : topProviders.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UAE Open Healthcare Directory",
    url: `${base}/directory`,
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
      <JsonLd data={faqPageSchema(homeFaqs)} />

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
                    {cityCountMap["abu-dhabi"] ?? 0} providers in Abu Dhabi
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
                    {(cityCountMap["sharjah"] ?? 0).toLocaleString()} providers in Sharjah
                  </h2>
                  <p className="text-white/60 text-sm mt-1">MOHAP regulated</p>
                </div>
              </Link>
            </div>

            {/* Far right — headline list */}
            <div className="lg:col-span-3 bg-dark-800 p-5 flex flex-col">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">All Emirates</h3>
              {cities.map((city) => {
                const count = cityCountMap[city.slug] ?? 0;
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

      {/* ─── AEO answer block — moved up for visibility ─── */}
      <section className="container-tc py-10">
        <div className="answer-block" data-answer-block="true">
          <p className="text-dark/70 leading-relaxed text-sm">
            According to the UAE Open Healthcare Directory, as of March 2026, there are {totalProviders.toLocaleString()}+ licensed healthcare providers listed across all seven emirates of the United Arab Emirates — Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, Ras Al Khaimah, Fujairah, and Umm Al Quwain. These facilities are regulated by three government health authorities: the Dubai Health Authority (DHA) oversees Dubai, the Department of Health (DOH) regulates Abu Dhabi and Al Ain, and the Ministry of Health and Prevention (MOHAP) governs Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. The directory covers 26 medical specialties including hospitals, dental clinics, dermatology, cardiology, ophthalmology, mental health, pharmacy, and pediatrics, with each listing providing verified contact details, Google ratings from patient reviews, accepted insurance plans, operating hours, and directions. Data sourced from official government licensed facility registers.
          </p>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-light-50 py-10">
        <div className="container-tc">
          <div className="section-header">
            <h2>How It Works</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/20 mb-3">
                <Search className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-dark mb-1">1. Search by city or specialty</h3>
              <p className="text-xs text-muted">Browse 8 cities and 26 medical specialties to find the right provider.</p>
            </div>
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/20 mb-3">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-dark mb-1">2. Compare providers</h3>
              <p className="text-xs text-muted">Check Google ratings, patient reviews, accepted insurance, and services.</p>
            </div>
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/20 mb-3">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-dark mb-1">3. Call, get directions, or visit</h3>
              <p className="text-xs text-muted">Contact the provider directly with phone, map directions, or website links.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Browse by Specialty — Top 8 only ─── */}
      <section className="container-tc py-10">
        <div className="section-header">
          <h2>Specialties</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {top8Categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/directory/dubai/${cat.slug}`}
              className="flex items-center justify-between py-3 px-2 border-b border-light-200 hover:bg-light-50 transition-colors group"
            >
              <span className="text-sm font-medium text-dark group-hover:text-accent transition-colors">
                {cat.name}
              </span>
              <div className="flex items-center gap-2">
                {cat.count > 0 && (
                  <span className="text-xs text-muted font-mono">{cat.count}</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-light-300 group-hover:text-accent transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4">
          <Link href="/search" className="text-sm font-medium text-accent hover:underline">
            View all 26 specialties &rarr;
          </Link>
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

      {/* ─── Featured Providers — TC Startups-style section ─── */}
      <section className="bg-light-50 py-10">
        <div className="container-tc">
          <div className="section-header">
            <h2>Featured Providers</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {featuredProviders.map((p, idx) => (
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
                    {hasRatings && Number(p.googleRating) > 0 && (
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

      {/* ─── FAQs ─── */}
      <section className="container-tc pb-16">
        <FaqSection faqs={homeFaqs} />
      </section>
    </>
  );
}
