import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { CityCard } from "@/components/directory/CityCard";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCategories,
  getTopRatedProviders,
  getProviderCountByCity,
} from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowRight, Shield, Star, MapPin } from "lucide-react";

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
    description:
      "The most comprehensive free healthcare directory for the UAE.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const homeFaqs = [
    { question: "What is the UAE Healthcare Directory?", answer: "The UAE Healthcare Directory is a free, comprehensive online directory of healthcare providers across all seven Emirates. Find hospitals, clinics, dentists, specialists, pharmacies, and more with ratings, reviews, contact details, and maps. Data sourced from official DHA, DOH, and MOHAP registers." },
    { question: "How do I find a doctor near me in the UAE?", answer: "Use the search bar to select your city, choose a specialty, and enter a search term. You can also browse by city or neighborhood to see all providers in your area." },
    { question: "Is the directory free?", answer: "Yes. The UAE Healthcare Directory is completely free for all residents. Search and view provider information at no cost." },
    { question: "How can clinics update their information?", answer: "Healthcare providers can claim their listing for free. Once verified with a DHA/DOH/MOHAP license, you can update contact details, hours, services, and more." },
    { question: "Where does the data come from?", answer: "All listings are sourced from official UAE health authority registers: DHA (Dubai), DOH (Abu Dhabi), and MOHAP (Northern Emirates). Ratings come from Google Maps. Last verified March 2026." },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd} />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Background with generated hero image */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700">
          <Image
            src="/images/hero-bg.png"
            alt=""
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            priority
          />
          {/* Grain overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')]" />
        </div>

        <div className="container-wide relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-6 animate-fade-in">
              <Shield className="h-3.5 w-3.5 text-sand-300" />
              <span className="text-xs font-medium text-white/80 tracking-wide uppercase">
                Official DHA · DOH · MOHAP Licensed Data
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5 animate-fade-up">
              The UAE Healthcare
              <br />
              <span className="text-sand-300">Directory</span>
            </h1>

            <p className="text-lg text-white/70 max-w-xl mb-8 animate-fade-up stagger-2 opacity-0">
              Free, comprehensive directory of hospitals, clinics, dentists, and
              specialists across Dubai, Abu Dhabi, Sharjah, and all Emirates.
              Verified against official government registers.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-4xl animate-fade-up stagger-3 opacity-0">
            <SearchBar />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-10 animate-fade-up stagger-4 opacity-0">
            {[
              { label: "Licensed Providers", value: "4,000+" },
              { label: "UAE Cities", value: "8" },
              { label: "Medical Specialties", value: "26" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-xl font-display font-bold text-white">
                  {stat.value}
                </span>
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60V20C240 50 480 0 720 20C960 40 1200 10 1440 30V60H0Z"
              fill="#f5f0e8"
            />
          </svg>
        </div>
      </section>

      {/* ─── Cities Grid ─── */}
      <section className="container-wide py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-[0.2em] mb-2">
              Explore
            </p>
            <h2 className="section-title">Browse by City</h2>
          </div>
          <Link
            href="/uae/dubai"
            className="hidden sm:flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cities.map((city, i) => (
            <div key={city.slug} className={`animate-fade-up opacity-0 stagger-${Math.min(i + 1, 6)}`}>
              <CityCard
                name={city.name}
                slug={city.slug}
                emirate={city.emirate}
                providerCount={getProviderCountByCity(city.slug)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Ornamental divider ─── */}
      <div className="container-wide">
        <div className="divider-ornament">
          <span className="text-sand-400">✦</span>
        </div>
      </div>

      {/* ─── Categories Grid ─── */}
      <section className="container-wide py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold text-sand-500 uppercase tracking-[0.2em] mb-2">
              Specialties
            </p>
            <h2 className="section-title">Medical Categories</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              name={cat.name}
              slug={cat.slug}
              icon={cat.icon}
            />
          ))}
        </div>
      </section>

      {/* ─── Top Rated ─── */}
      <section className="bg-white py-16">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-[0.2em] mb-2">
                Highest Rated
              </p>
              <h2 className="section-title">Top Healthcare Providers</h2>
            </div>
            <Link
              href="/search?sort=rating"
              className="hidden sm:flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                name={provider.name}
                slug={provider.slug}
                citySlug={provider.citySlug}
                categorySlug={provider.categorySlug}
                address={provider.address}
                phone={provider.phone}
                website={provider.website}
                shortDescription={provider.shortDescription}
                googleRating={provider.googleRating}
                googleReviewCount={provider.googleReviewCount}
                isClaimed={provider.isClaimed}
                isVerified={provider.isVerified}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <section className="bg-teal-900 py-12">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Official Data",
                desc: "Sourced from DHA, DOH, and MOHAP licensed facility registers. Every listing is verified against official government records.",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Real Patient Reviews",
                desc: "Google ratings and reviews from real patients. Transparent, unbiased feedback to help you choose the right provider.",
              },
              {
                icon: <MapPin className="h-6 w-6" />,
                title: "Complete Coverage",
                desc: "All 7 Emirates covered. Dubai, Abu Dhabi, Sharjah, Al Ain, Ajman, RAK, Fujairah, and Umm Al Quwain.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-800 flex items-center justify-center text-sand-300 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-teal-200/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AEO Answer Block ─── */}
      <section className="container-wide py-16">
        <div className="answer-block" data-answer-block="true">
          <h2 className="font-display text-lg font-semibold text-dark mb-3">
            Healthcare in the United Arab Emirates
          </h2>
          <p className="text-sm text-charcoal/70 leading-relaxed">
            The United Arab Emirates has a world-class healthcare system spanning
            7 Emirates and major cities including Dubai, Abu Dhabi, Sharjah, Al
            Ain, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. Healthcare
            is regulated by the Dubai Health Authority (DHA), Department of
            Health Abu Dhabi (DOH), and the Ministry of Health and Prevention
            (MOHAP). This directory covers 26 healthcare categories including
            hospitals, dental clinics, dermatology, ophthalmology, cardiology,
            mental health, pediatrics, pharmacy, labs, and more. All listings are
            sourced from official government registers and enriched with Google
            patient reviews. Last verified March 2026.
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
