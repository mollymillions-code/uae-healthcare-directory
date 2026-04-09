import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getBaseUrl } from "@/lib/helpers";
import { getCategories, getProviderCountByCity } from "@/lib/data";
import {
  GCC_COUNTRY_CODES,
  isValidGccCountry,
  getGccCountry,
  getCitiesByCountry,
  countryDirectoryUrl,
  COUNTRY_LOCALES,
} from "@/lib/country-directory-utils";
import { ChevronRight } from "lucide-react";

export const revalidate = 21600;

interface Props {
  params: { country: string };
}

export function generateStaticParams() {
  return GCC_COUNTRY_CODES.map((code) => ({ country: code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getGccCountry(params.country);
  if (!country) return {};

  const cities = getCitiesByCountry(country.code);
  const cityCounts = await Promise.all(cities.map((c) => getProviderCountByCity(c.slug)));
  const totalProviders = cityCounts.reduce((sum, n) => sum + n, 0);
  const base = getBaseUrl();
  const url = `${base}${countryDirectoryUrl(country.code)}`;
  const year = new Date().getFullYear();
  const countPrefix = totalProviders > 0 ? `${totalProviders}+ Providers in ` : "";

  return {
    title: truncateTitle(`${countPrefix}${country.name} Healthcare Directory [${year}]`),
    description: truncateDescription(
      `Find & compare healthcare providers across ${cities.length} cities in ${country.name}. Hospitals, clinics & specialists regulated by ${country.regulators.join(", ")}. Ratings, reviews & insurance. Free directory.`
    ),
    openGraph: {
      type: "website",
      title: `${country.name} Healthcare Directory | Zavis`,
      description: `Free directory of healthcare providers in ${country.name}. Browse ${cities.length} cities, compare ratings, insurance & specialties.`,
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      url,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${country.name} Healthcare Directory`,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
  };
}

function getCountryOverview(
  countryName: string,
  totalProviders: number,
  cityCount: number,
  regulators: string[],
  currency: string,
  topCities: string[]
): string {
  const regStr = regulators.join(" and ");
  const cityList = topCities.slice(0, 4).join(", ");
  if (totalProviders > 0) {
    return `The ${countryName} Healthcare Directory by Zavis lists ${totalProviders.toLocaleString()}+ licensed healthcare providers across ${cityCount} cities including ${cityList}. Healthcare in ${countryName} is regulated by ${regStr}, which oversees licensing, quality standards, and patient safety for all public and private facilities. The directory covers hospitals, clinics, dental practices, pharmacies, specialist centers, and more — each listing includes verified contact details, Google patient ratings, accepted insurance plans, operating hours, and directions. All data is sourced from official government health authority registers.`;
  }
  return `The ${countryName} Healthcare Directory by Zavis covers ${cityCount} cities including ${cityList}. Healthcare in ${countryName} is regulated by ${regStr}. Provider data is being compiled from official government registers and will include hospitals, clinics, dental practices, pharmacies, and specialist centers with verified contact details, ratings, and insurance information.`;
}

export default async function CountryDirectoryHomePage({ params }: Props) {
  if (!isValidGccCountry(params.country)) notFound();

  const country = getGccCountry(params.country)!;
  const cities = getCitiesByCountry(country.code);
  const base = getBaseUrl();
  const categories = getCategories();

  // Fetch provider counts per city
  const cityCounts = await Promise.all(
    cities.map((c) => getProviderCountByCity(c.slug))
  );
  const cityCountMap = Object.fromEntries(
    cities.map((c, i) => [c.slug, cityCounts[i]])
  );
  const totalProviders = cityCounts.reduce((sum, n) => sum + n, 0);

  const sortedCities = [...cities].sort((a, b) => a.sortOrder - b.sortOrder);
  const topCityNames = sortedCities.slice(0, 4).map((c) => c.name);

  const countryFaqs = [
    {
      question: `How is healthcare regulated in ${country.name}?`,
      answer: `Healthcare in ${country.name} is regulated by ${country.regulators.join(" and ")}. These authorities are responsible for licensing healthcare facilities and professionals, setting quality standards, enforcing patient safety protocols, and overseeing both public and private healthcare sectors across the country.`,
    },
    {
      question: `How many healthcare providers are listed in the ${country.name} directory?`,
      answer: totalProviders > 0
        ? `The Zavis ${country.name} Healthcare Directory currently lists ${totalProviders.toLocaleString()}+ healthcare providers across ${cities.length} cities. This includes hospitals, clinics, dental practices, pharmacies, labs, and specialist centers. The directory is updated regularly with data from official ${country.regulators.join(" and ")} registers.`
        : `The ${country.name} Healthcare Directory is actively being populated with data from official ${country.regulators.join(" and ")} registers. It will cover hospitals, clinics, dental practices, pharmacies, and specialist centers across ${cities.length} cities.`,
    },
    {
      question: `What cities are covered in the ${country.name} healthcare directory?`,
      answer: `The directory covers ${cities.length} cities in ${country.name}: ${sortedCities.map((c) => c.name).join(", ")}. Each city page provides a breakdown of healthcare providers by medical specialty and neighborhood.`,
    },
    {
      question: `Is the ${country.name} healthcare directory free to use?`,
      answer: `Yes, the ${country.name} Healthcare Directory by Zavis is completely free for patients and visitors. You can browse providers, compare ratings, check insurance acceptance, and find contact details without any account or payment. Healthcare providers can also claim their listing for free.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: country.name, url: `${base}${countryDirectoryUrl(country.code)}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(countryFaqs)} />

      {/* Hero */}
      <section className="bg-[#1c1c1c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: country.name },
            ]}
          />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.08] text-white tracking-[-0.02em] mb-3">
            Healthcare Directory{" "}
            <span className="text-white/60">in {country.name}</span>
          </h1>
          <p className="font-['Geist',sans-serif] text-white/50 text-sm sm:text-base max-w-xl">
            {totalProviders > 0
              ? `${totalProviders.toLocaleString()} licensed providers across ${cities.length} cities. Regulated by ${country.regulators.join(", ")}.`
              : `${cities.length} cities. Regulated by ${country.regulators.join(", ")}. Provider data coming soon.`}
          </p>
        </div>
      </section>

      {/* AEO Answer Block */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {getCountryOverview(country.name, totalProviders, cities.length, country.regulators, country.currency, topCityNames)}
          </p>
        </div>
      </section>

      {/* Cities */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">
            Cities in {country.name}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedCities.map((city) => {
              const count = cityCountMap[city.slug] ?? 0;
              return (
                <Link
                  key={city.slug}
                  href={countryDirectoryUrl(country.code, city.slug)}
                  className="flex items-center justify-between bg-white border border-black/[0.06] rounded-xl px-5 py-4 hover:border-[#006828]/15 hover:shadow-card transition-all duration-300 group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight block">
                      {city.name}
                    </span>
                    {city.description && (
                      <span className="font-['Geist',sans-serif] text-xs text-black/40 line-clamp-1 mt-0.5 block">
                        {city.description.slice(0, 80)}...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {count > 0 ? (
                      <span className="font-['Geist',sans-serif] text-xs text-black/30">
                        {count} {count === 1 ? "provider" : "providers"}
                      </span>
                    ) : (
                      <span className="font-['Geist',sans-serif] text-xs text-black/20">
                        Coming soon
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors" />
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      {/* Browse by Specialty */}
      <section className="bg-[#f8f8f6] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[28px] text-[#1c1c1c] tracking-tight">
              Medical Specialties
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {categories.slice(0, 12).map((cat) => {
              const firstCity = cities[0];
              return (
                <Link
                  key={cat.slug}
                  href={
                    firstCity
                      ? countryDirectoryUrl(
                          country.code,
                          firstCity.slug,
                          cat.slug
                        )
                      : countryDirectoryUrl(country.code)
                  }
                  className="flex items-center justify-between py-3 px-2 border-b border-black/[0.06] hover:bg-white transition-colors group"
                >
                  <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                    {cat.name}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-black/20 group-hover:text-[#006828] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-white mb-2 tracking-tight">
            {country.name} Healthcare Directory
          </h2>
          <p className="font-['Geist',sans-serif] font-medium text-white/50 text-sm sm:text-base max-w-2xl mx-auto">
            {totalProviders > 0
              ? `${totalProviders.toLocaleString()} licensed providers from official ${country.regulators.join(" & ")} registers. Free. Open. No paywall.`
              : `Directory launching soon for ${country.name}. Powered by official ${country.regulators.join(" & ")} data.`}
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <FaqSection
          faqs={countryFaqs}
          title={`${country.name} Healthcare Directory — FAQ`}
        />
      </section>
    </>
  );
}
