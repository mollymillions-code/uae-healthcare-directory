import { SearchBar } from "@/components/search/SearchBar";
import { CityCard } from "@/components/directory/CityCard";
import { CategoryCard } from "@/components/directory/CategoryCard";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCities, getCategories, getTopRatedProviders, getProviderCountByCity } from "@/lib/data";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 86400;

export default function HomePage() {
  const cities = getCities();
  const categories = getCategories();
  const topProviders = getTopRatedProviders(undefined, 6);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UAE Healthcare Directory",
    url: getBaseUrl(),
    description: "The most comprehensive free healthcare directory for the UAE.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getBaseUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UAE Healthcare Directory",
    url: getBaseUrl(),
    description: "Free, comprehensive directory of healthcare providers across all UAE cities.",
  };

  const homeFaqs = [
    { question: "What is the UAE Healthcare Directory?", answer: "The UAE Healthcare Directory is a free, comprehensive online directory of healthcare providers across all seven Emirates. Find hospitals, clinics, dentists, specialists, pharmacies, and more with ratings, reviews, contact details, and maps." },
    { question: "How do I find a doctor near me in the UAE?", answer: "Use our search feature at the top of the page. Select your city, choose a specialty category, and optionally enter a search term. You can also browse by city to see all healthcare providers in your area." },
    { question: "Is the UAE Healthcare Directory free to use?", answer: "Yes, the UAE Healthcare Directory is completely free for all UAE residents. You can search for and view information about healthcare providers at no cost." },
    { question: "How can I update my clinic's information?", answer: "Healthcare providers can claim their listing by visiting the Claim Listing page. Once verified, you can request updates to your contact details, hours, services, and more." },
    { question: "Which cities are covered?", answer: "We cover all major UAE cities including Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain, and Al Ain." },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={orgJsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 text-white py-16 sm:py-24">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Find Healthcare Providers<br />Across the UAE
            </h1>
            <p className="text-lg text-white/80">
              The most comprehensive free directory of hospitals, clinics, dentists, and specialists
              in Dubai, Abu Dhabi, Sharjah, and all Emirates.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="container-wide py-12">
        <h2 className="section-title mb-6">Browse by City</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cities.map((city) => (
            <CityCard
              key={city.slug}
              name={city.name}
              slug={city.slug}
              emirate={city.emirate}
              providerCount={getProviderCountByCity(city.slug)}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-wide py-12">
        <h2 className="section-title mb-6">Browse by Specialty</h2>
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

      {/* Top Rated */}
      <section className="container-wide py-12">
        <h2 className="section-title mb-6">Top Rated Providers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </section>

      {/* AEO Answer Block */}
      <section className="container-wide py-8">
        <div className="answer-block" data-answer-block="true">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Healthcare in the UAE</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The United Arab Emirates has a world-class healthcare system spanning 7 Emirates and major cities
            including Dubai, Abu Dhabi, Sharjah, Al Ain, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
            Healthcare is regulated by the Dubai Health Authority (DHA), Department of Health Abu Dhabi (DOH),
            and the Ministry of Health and Prevention (MOHAP). This directory covers 26 healthcare categories
            including hospitals, dental clinics, dermatology, ophthalmology, cardiology, mental health,
            pediatrics, pharmacy, labs, and more.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="container-wide pb-12">
        <FaqSection faqs={homeFaqs} />
      </section>
    </>
  );
}
