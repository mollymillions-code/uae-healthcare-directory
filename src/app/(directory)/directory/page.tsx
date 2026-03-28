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

      {/* ─── Hero Grid ─── */}
      <section className="bg-[#1c1c1c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#2a2a2a]">
            {/* Main hero card — left half */}
            <Link href="/directory/dubai" className="lg:col-span-6 relative overflow-hidden rounded-none bg-[#1c1c1c] min-h-[420px] lg:min-h-[500px] group">
              <Image src="/images/cities/dubai.webp" alt="Dubai Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-1 rounded-full mb-3 w-fit font-['Geist',sans-serif]">Dubai</span>
                <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.08] text-white tracking-[-0.02em] mb-2">
                  Find Healthcare<br />Across the UAE
                </h1>
                <p className="font-['Geist',sans-serif] text-white/60 text-sm sm:text-base max-w-md">
                  {totalProviders.toLocaleString()}+ licensed providers. 8 cities. 26 specialties. Sourced from official government registers.
                </p>
              </div>
            </Link>

            {/* Right column — 2 stacked cards */}
            <div className="lg:col-span-3 flex flex-col gap-px">
              <Link href="/directory/abu-dhabi" className="relative overflow-hidden bg-[#1c1c1c] flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/abu-dhabi.webp" alt="Abu Dhabi Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                  <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-1 rounded-full mb-2 w-fit font-['Geist',sans-serif]">Abu Dhabi</span>
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl text-white leading-tight tracking-tight">
                    {cityCountMap["abu-dhabi"] ?? 0} providers in Abu Dhabi
                  </h2>
                  <p className="font-['Geist',sans-serif] text-white/50 text-sm mt-1">DOH regulated</p>
                </div>
              </Link>
              <Link href="/directory/sharjah" className="relative overflow-hidden bg-[#1c1c1c] flex-1 min-h-[200px] lg:min-h-0 group">
                <Image src="/images/cities/sharjah.webp" alt="Sharjah Healthcare" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                  <span className="inline-block bg-[#006828] text-white text-[11px] font-medium uppercase tracking-wide px-3 py-1 rounded-full mb-2 w-fit font-['Geist',sans-serif]">Sharjah</span>
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl text-white leading-tight tracking-tight">
                    {(cityCountMap["sharjah"] ?? 0).toLocaleString()} providers in Sharjah
                  </h2>
                  <p className="font-['Geist',sans-serif] text-white/50 text-sm mt-1">MOHAP regulated</p>
                </div>
              </Link>
            </div>

            {/* Far right — headline list */}
            <div className="lg:col-span-3 bg-[#111] p-5 flex flex-col">
              <h3 className="font-['Geist',sans-serif] text-xs font-medium text-[#006828] uppercase tracking-widest mb-4">All Emirates</h3>
              {cities.map((city) => {
                const count = cityCountMap[city.slug] ?? 0;
                return (
                  <Link
                    key={city.slug}
                    href={`/directory/${city.slug}`}
                    className="flex items-start gap-3 py-3 border-b border-white/10 text-white/70 hover:text-[#006828] transition-colors text-sm group"
                  >
                    <span className="block w-2 h-2 bg-[#006828] flex-shrink-0 mt-2 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="flex-1 font-['Bricolage_Grotesque',sans-serif] font-medium">{city.name}</span>
                    <span className="text-white/30 text-xs font-['Geist',sans-serif]">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Search bar ─── */}
      <section className="bg-[#f8f8f6] border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar />
        </div>
      </section>

      {/* ─── AEO answer block ─── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            According to the UAE Open Healthcare Directory, as of March 2026, there are {totalProviders.toLocaleString()}+ licensed healthcare providers listed across all seven emirates of the United Arab Emirates — Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, Ras Al Khaimah, Fujairah, and Umm Al Quwain. These facilities are regulated by three government health authorities: the Dubai Health Authority (DHA) oversees Dubai, the Department of Health (DOH) regulates Abu Dhabi and Al Ain, and the Ministry of Health and Prevention (MOHAP) governs Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. The directory covers 26 medical specialties including hospitals, dental clinics, dermatology, cardiology, ophthalmology, mental health, pharmacy, and pediatrics, with each listing providing verified contact details, Google ratings from patient reviews, accepted insurance plans, operating hours, and directions. Data sourced from official government licensed facility registers.
          </p>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-[#f8f8f6] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "1. Search by city or specialty", desc: "Browse 8 cities and 26 medical specialties to find the right provider." },
              { icon: BarChart3, title: "2. Compare providers", desc: "Check Google ratings, patient reviews, accepted insurance, and services." },
              { icon: Phone, title: "3. Call, get directions, or visit", desc: "Contact the provider directly with phone, map directions, or website links." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 mb-3">
                  <step.icon className="h-5 w-5 text-[#006828]" />
                </div>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] mb-1">{step.title}</h3>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Browse by Specialty — Top 8 only ─── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">Specialties</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {top8Categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/directory/dubai/${cat.slug}`}
              className="flex items-center justify-between py-3 px-2 border-b border-black/[0.06] hover:bg-[#f8f8f6] transition-colors group"
            >
              <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                {cat.name}
              </span>
              <div className="flex items-center gap-2">
                {cat.count > 0 && (
                  <span className="font-['Geist',sans-serif] text-xs text-black/30">{cat.count}</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-black/20 group-hover:text-[#006828] transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4">
          <Link href="/search" className="font-['Geist',sans-serif] text-sm font-medium text-[#006828] hover:underline">
            View all 26 specialties &rarr;
          </Link>
        </div>
      </section>

      {/* ─── Source of Truth ─── */}
      <section className="bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-white mb-2 tracking-tight">
            The Source of Truth for UAE Healthcare
          </h2>
          <p className="font-['Geist',sans-serif] font-medium text-white/50 text-sm sm:text-base max-w-2xl mx-auto">
            {totalProviders.toLocaleString()}+ licensed providers from official DHA, DOH, and MOHAP government registers. Free. Open. No paywall.
          </p>
        </div>
      </section>

      {/* ─── Featured Providers ─── */}
      <section className="bg-[#f8f8f6] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">Featured Providers</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {featuredProviders.map((p, idx) => (
              <Link
                key={p.id}
                href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                className="flex items-start gap-4 py-4 px-2 border-b border-black/[0.06] hover:bg-white transition-colors group"
              >
                <span className="font-['Geist',sans-serif] text-2xl font-medium text-[#006828]/25 w-8 flex-shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] group-hover:text-[#006828] transition-colors truncate tracking-tight">
                    {p.name}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5 truncate">{p.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {hasRatings && Number(p.googleRating) > 0 && (
                      <span className="font-['Geist',sans-serif] text-xs font-medium text-[#006828]">{p.googleRating} ★</span>
                    )}
                    {p.phone && (
                      <span className="font-['Geist',sans-serif] text-xs text-black/30">{p.phone}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <FaqSection faqs={homeFaqs} />
      </section>
    </>
  );
}
