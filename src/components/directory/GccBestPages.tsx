import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategories,
  getCategoryBySlug,
  getCityBySlug,
  getProviders,
  getProviderCountByCategoryAndCity,
  getProviderCountByCity,
} from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  isValidGccCountry,
  getGccCountry,
  getCitiesByCountry,
  cityBelongsToCountry,
  countryDirectoryUrl,
  countryBestUrl,
  COUNTRY_LOCALES,
} from "@/lib/country-directory-utils";

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

function avgRating(providers: LocalProvider[]): string {
  const rated = providers.filter((p) => Number(p.googleRating) > 0);
  if (rated.length === 0) return "N/A";
  const sum = rated.reduce((acc, p) => acc + Number(p.googleRating), 0);
  return (sum / rated.length).toFixed(1);
}

function topInsurers(providers: LocalProvider[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    for (const ins of p.insurance) {
      counts.set(ins, (counts.get(ins) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name);
}

function topAreas(
  providers: LocalProvider[],
  n: number
): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    if (p.areaSlug) {
      counts.set(p.areaSlug, (counts.get(p.areaSlug) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([slug, count]) => ({ slug, count }));
}

async function getTopRatedForCategory(
  citySlug: string,
  categorySlug: string
): Promise<LocalProvider | undefined> {
  const { providers } = await getProviders({
    citySlug,
    categorySlug,
    sort: "rating",
    limit: 10,
  });
  return providers
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const rd = Number(b.googleRating) - Number(a.googleRating);
      if (rd !== 0) return rd;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })[0];
}

/** Category-specific editorial intro — adapted for GCC countries */
function getCategoryIntro(
  categorySlug: string,
  categoryName: string,
  cityName: string,
  countryName: string,
  totalCount: number,
  ratedCount: number,
  avgRatingStr: string,
  regulatorStr: string
): { headline: string; body: string } {
  const catLower = categoryName.toLowerCase();
  const defaultIntro = {
    headline: `Finding the best ${catLower} in ${cityName} — backed by real patient data, not advertising`,
    body: `${cityName} has ${totalCount} ${catLower} providers, but quality and patient satisfaction vary significantly. We analyzed ${ratedCount} practices with verified Google reviews to create this evidence-based ranking. Rather than relying on self-reported claims, our selection criteria use real patient satisfaction scores, review volume (which reflects consistency of care over time), breadth of insurance acceptance, and operational track record. All providers are licensed by ${regulatorStr} and verified against official registers.`,
  };
  const intros: Record<string, { headline: string; body: string }> = {
    hospitals: {
      headline: `Choosing the right hospital in ${cityName}, ${countryName} is one of the most important healthcare decisions you can make`,
      body: `${cityName} is home to ${totalCount} hospitals and medical centers, ranging from large multi-specialty institutions to focused day-surgery centers. We evaluated ${ratedCount} facilities with verified patient reviews to identify those that consistently deliver the highest standard of care. Our rankings factor in patient satisfaction scores, clinical reputation, breadth of insurance acceptance, and years of established practice. All facilities listed are licensed by ${regulatorStr}.`,
    },
    clinics: {
      headline: `Finding a reliable clinic in ${cityName} shouldn't require hours of research`,
      body: `With ${totalCount} clinics and polyclinics across ${cityName}, choosing the right one comes down to trust, accessibility, and consistent patient outcomes. We analyzed ${ratedCount} rated clinics to surface the ones that patients return to and recommend to others. Rankings are based on patient satisfaction ratings, volume of reviews, insurance network breadth, and operational track record. Every clinic listed is licensed by ${regulatorStr}.`,
    },
    dental: {
      headline: `Dental care in ${cityName} ranges from routine check-ups to advanced cosmetic and surgical procedures`,
      body: `Across ${totalCount} dental clinics in ${cityName}, quality varies significantly. We ranked ${ratedCount} patient-rated clinics to help you find practitioners who combine clinical excellence with a comfortable patient experience. Our selection criteria weigh patient ratings, review volume, range of insurance plans accepted, and years of operation.`,
    },
    pharmacy: {
      headline: `Finding a well-stocked, well-reviewed pharmacy in ${cityName} matters more than most people think`,
      body: `${cityName} has ${totalCount} pharmacies, but patient experience varies. We evaluated ${ratedCount} pharmacies with verified patient reviews to help you find reliable, accessible options. Our rankings factor in patient satisfaction scores, review volume, insurance acceptance, and operational consistency. All listed pharmacies are licensed by ${regulatorStr}.`,
    },
  };
  return intros[categorySlug] || defaultIntro;
}

/* ==========================================================================
   1. Country Best Index — e.g. /qa/best
   ========================================================================== */

export async function generateGccBestIndexMetadata(
  countryCode: string
): Promise<Metadata> {
  const country = getGccCountry(countryCode);
  if (!country) return {};

  const cities = getCitiesByCountry(country.code);
  const cityCounts = await Promise.all(
    cities.map((c) => getProviderCountByCity(c.slug))
  );
  const totalProviders = cityCounts.reduce((sum, n) => sum + n, 0);
  const base = getBaseUrl();
  const url = `${base}${countryBestUrl(country.code)}`;
  const year = new Date().getFullYear();

  return {
    title: truncateTitle(
      `Best Healthcare in ${country.name} — Top-Rated Providers [${year}]`
    ),
    description: truncateDescription(
      `Find the best-rated hospitals, clinics, dental practices, and specialists across ${cities.length} cities in ${country.name}. Ranked by Google rating. Regulated by ${country.regulators.join(", ")}.`
    ),
    alternates: { canonical: url },
    ...(totalProviders === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `Best Healthcare in ${country.name} | Zavis`,
      description: `Top-rated healthcare providers across ${cities.length} cities in ${country.name}. Compare ratings and reviews.`,
      url,
      type: "website",
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Best Healthcare in ${country.name}`,
        },
      ],
    },
  };
}

export async function GccBestIndexPage({
  countryCode,
}: {
  countryCode: string;
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const cities = getCitiesByCountry(country.code);
  const base = getBaseUrl();
  const categories = getCategories();

  const cityDataRaw = await Promise.all(
    cities.map(async (city) => {
      const [count, catCounts] = await Promise.all([
        getProviderCountByCity(city.slug),
        Promise.all(
          categories.map((cat) =>
            getProviderCountByCategoryAndCity(cat.slug, city.slug)
          )
        ),
      ]);
      const catCount = catCounts.filter((c) => c > 0).length;
      return { ...city, count, catCount, catCounts };
    })
  );
  const cityData = cityDataRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const popularCombos: {
    citySlug: string;
    cityName: string;
    catSlug: string;
    catName: string;
    count: number;
  }[] = [];
  for (const row of cityDataRaw) {
    for (let i = 0; i < categories.length; i++) {
      const count = row.catCounts[i];
      if (count >= 3) {
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
  const regulatorStr = country.regulators.join(", ");

  const faqs = [
    {
      question: `How does the ${country.name} Healthcare Directory rank providers?`,
      answer: `Providers are ranked by Google rating (highest first), with review count used as a tiebreaker. Only providers with a rating above 0 are included. All data is sourced from official ${regulatorStr} government registers.`,
    },
    {
      question: `Which city in ${country.name} has the most healthcare providers?`,
      answer:
        cityData.length > 0
          ? `${cityData.sort((a, b) => b.count - a.count)[0].name} has the most healthcare providers with ${cityData[0].count.toLocaleString()} listed in the ${country.name} Healthcare Directory.`
          : `Browse the city listings below to compare provider counts across ${country.name}.`,
    },
    {
      question: `Are these rankings based on paid placements?`,
      answer: `No. Rankings are based solely on publicly available Google ratings and review counts. There are no paid placements or sponsored rankings. The ${country.name} Healthcare Directory is a free, open resource.`,
    },
    {
      question: `How often are the ${country.name} provider rankings updated?`,
      answer: `Provider data is regularly updated and cross-referenced with official ${regulatorStr} registers. Google ratings and review counts are refreshed periodically.`,
    },
  ];

  const sortedCities = [...cityData].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          {
            name: country.name,
            url: `${base}${countryDirectoryUrl(country.code)}`,
          },
          { name: "Best Healthcare" },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          {
            label: country.name,
            href: countryDirectoryUrl(country.code),
          },
          { label: "Best Healthcare" },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best Healthcare Providers in {country.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalProviders > 0
            ? `${totalProviders.toLocaleString()} providers across ${cityData.length} cities`
            : `${cities.length} cities`}
          {" "}&middot; Ranked by Google rating &middot; {regulatorStr}
        </p>
      </div>

      <div
        className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
        data-answer-block="true"
      >
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          {totalProviders > 0
            ? `The ${country.name} Healthcare Directory lists ${totalProviders.toLocaleString()} healthcare providers across ${cityData.length} cities. Select a city below to find the best-rated hospitals, clinics, dental practices, and specialists — all ranked by Google rating and verified against official ${regulatorStr} government registers.`
            : `The ${country.name} Healthcare Directory covers ${cities.length} cities. Select a city below to browse healthcare providers regulated by ${regulatorStr}.`}
        </p>
      </div>

      {/* City Grid */}
      {sortedCities.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Select a City
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedCities.map((city) => (
              <Link
                key={city.slug}
                href={countryBestUrl(country.code, city.slug)}
                className="block border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                    {city.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/40">
                    {city.count.toLocaleString()} providers
                  </span>
                  <span className="text-black/40">
                    {city.catCount} categories
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Combos */}
      {topCombos.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Popular Searches
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topCombos.map((combo) => (
              <Link
                key={`${combo.citySlug}-${combo.catSlug}`}
                href={countryBestUrl(
                  country.code,
                  combo.citySlug,
                  combo.catSlug
                )}
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

      <FaqSection
        faqs={faqs}
        title={`Best Healthcare in ${country.name} — FAQ`}
      />

      {/* Methodology */}
      <section className="mb-10 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Ranking Methodology
          </h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            The {country.name} Healthcare Directory ranks providers by{" "}
            <strong>Google rating</strong> (highest first), using{" "}
            <strong>review count</strong> as a tiebreaker. Only providers with a
            rating above 0 are included in rankings.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            All provider data is sourced from official{" "}
            <strong>{regulatorStr}</strong> government registers in{" "}
            {country.name}.
          </p>
          <p className="text-[11px] text-black/40">
            These rankings do not constitute medical advice. Always verify
            credentials and consult with your healthcare provider before making
            decisions.
          </p>
        </div>
      </section>

      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available
          Google ratings and review counts and do not constitute a medical
          recommendation. Provider data is sourced from official {regulatorStr}{" "}
          registers.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. City Best Index — e.g. /qa/best/doha
   ========================================================================== */

export async function generateGccBestCityMetadata(
  countryCode: string,
  params: { city: string }
): Promise<Metadata> {
  const country = getGccCountry(countryCode);
  if (!country) return {};
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) return {};

  const totalCount = await getProviderCountByCity(city.slug);
  const base = getBaseUrl();
  const url = `${base}${countryBestUrl(country.code, city.slug)}`;
  const year = new Date().getFullYear();

  return {
    title: truncateTitle(
      `Best Healthcare in ${city.name}, ${country.name} — Top-Rated [${year}]`
    ),
    description: truncateDescription(
      `Find the best-rated healthcare providers in ${city.name}, ${country.name}. ${totalCount} providers ranked by Google rating across ${getCategories().length} categories. Regulated by ${country.regulators.join(", ")}.`
    ),
    alternates: { canonical: url },
    ...(totalCount === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `Best Healthcare in ${city.name}, ${country.name}`,
      description: `Top-rated providers in ${city.name}. Compare ratings and reviews.`,
      url,
      type: "website",
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Best Healthcare in ${city.name}, ${country.name}`,
        },
      ],
    },
  };
}

export async function GccBestCityPage({
  countryCode,
  params,
}: {
  countryCode: string;
  params: { city: string };
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) notFound();

  const base = getBaseUrl();
  const regulatorStr = country.regulators.join(", ");
  const totalCount = await getProviderCountByCity(city.slug);
  const categories = getCategories();

  const categoryDataRaw = await Promise.all(
    categories.map(async (cat) => {
      const count = await getProviderCountByCategoryAndCity(
        cat.slug,
        city.slug
      );
      if (count === 0) return null;
      const topProvider = await getTopRatedForCategory(city.slug, cat.slug);
      return { ...cat, count, topProvider };
    })
  );
  const categoryData = categoryDataRaw.filter(Boolean) as {
    slug: string;
    name: string;
    icon: string;
    sortOrder: number;
    count: number;
    topProvider: LocalProvider | undefined;
  }[];

  // Other cities in same country for cross-links
  const otherCitiesRaw = await Promise.all(
    getCitiesByCountry(country.code)
      .filter((c) => c.slug !== city.slug)
      .map(async (c) => ({
        ...c,
        totalProviders: await getProviderCountByCity(c.slug),
      }))
  );
  const otherCities = otherCitiesRaw
    .filter((c) => c.totalProviders > 0)
    .sort((a, b) => b.totalProviders - a.totalProviders);

  const faqs = [
    {
      question: `What are the best hospitals in ${city.name}, ${country.name}?`,
      answer: `The ${country.name} Healthcare Directory ranks hospitals in ${city.name} by Google rating and patient reviews. Visit the "Best Hospitals in ${city.name}" page for the full ranked list. Healthcare in ${city.name} is regulated by ${regulatorStr}.`,
    },
    {
      question: `How many healthcare providers are in ${city.name}, ${country.name}?`,
      answer: `There are ${totalCount.toLocaleString()} healthcare providers listed in ${city.name} across ${categoryData.length} categories, including hospitals, clinics, dental practices, and specialist centers. All data is sourced from official ${regulatorStr} registers.`,
    },
    {
      question: `How are the "best" healthcare providers in ${city.name} determined?`,
      answer: `Providers are ranked by Google rating (highest first), with review count as a tiebreaker. Only providers with a rating above 0 are included. Data is sourced from official ${regulatorStr} registers and the ${country.name} Healthcare Directory.`,
    },
    {
      question: `Which healthcare category has the most providers in ${city.name}?`,
      answer:
        categoryData.length > 0
          ? `The largest category in ${city.name} is ${categoryData.sort((a, b) => b.count - a.count)[0].name} with ${categoryData[0].count} providers, followed by ${categoryData[1]?.name || "others"}.`
          : `Browse the categories below to see provider counts for each specialty in ${city.name}.`,
    },
    {
      question: `Is healthcare in ${city.name} regulated?`,
      answer: `Yes. All healthcare providers in ${city.name} are licensed and regulated by ${regulatorStr}. The ${country.name} Healthcare Directory sources its data from official government registers to ensure accuracy.`,
    },
  ];

  const sortedCategories = [...categoryData].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          {
            name: country.name,
            url: `${base}${countryDirectoryUrl(country.code)}`,
          },
          {
            name: "Best",
            url: `${base}${countryBestUrl(country.code)}`,
          },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          {
            label: country.name,
            href: countryDirectoryUrl(country.code),
          },
          { label: "Best", href: countryBestUrl(country.code) },
          { label: city.name },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best Healthcare in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          {totalCount.toLocaleString()} providers across {categoryData.length}{" "}
          categories &middot; {regulatorStr}
        </p>
      </div>

      <div
        className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
        data-answer-block="true"
      >
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          The {country.name} Healthcare Directory lists{" "}
          {totalCount.toLocaleString()} healthcare providers in {city.name}{" "}
          across {categoryData.length} specialties. Below you will find the
          top-rated provider in each category, ranked by Google rating and review
          count. All providers are licensed by {regulatorStr}. Data is sourced
          from official government registers.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={countryDirectoryUrl(country.code, city.slug)}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          Full {city.name} directory
        </Link>
        <Link
          href={countryBestUrl(country.code)}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All cities
        </Link>
      </div>

      {/* Category Grid */}
      {sortedCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top-Rated by Category
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={countryBestUrl(country.code, city.slug, cat.slug)}
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
                          {cat.topProvider.googleReviewCount.toLocaleString()}{" "}
                          reviews
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-black/[0.06] pt-3">
                    <p className="font-['Geist',sans-serif] text-xs text-black/40">
                      {cat.count} providers listed
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <FaqSection
        faqs={faqs}
        title={`Best Healthcare in ${city.name} — FAQ`}
      />

      {/* Cross-links: other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Best Healthcare in Other Cities
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={countryBestUrl(country.code, c.slug)}
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

      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available
          Google ratings and review counts. They do not constitute a medical
          recommendation. Provider data is sourced from official {regulatorStr}{" "}
          registers. Always confirm details directly with the provider.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. Category Best — e.g. /qa/best/doha/hospitals
   ========================================================================== */

export async function generateGccBestCategoryMetadata(
  countryCode: string,
  params: { city: string; category: string }
): Promise<Metadata> {
  const country = getGccCountry(countryCode);
  if (!country) return {};
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) return {};
  const category = getCategoryBySlug(params.category);
  if (!category) return {};

  const count = await getProviderCountByCategoryAndCity(
    category.slug,
    city.slug
  );
  const base = getBaseUrl();
  const url = `${base}${countryBestUrl(country.code, city.slug, category.slug)}`;

  const { providers } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    sort: "rating",
    limit: 1,
  });
  const topProvider = providers.find((p) => Number(p.googleRating) > 0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
  const title = `Best ${category.name} in ${city.name}, ${country.name} — Top Rated [${currentYear}]`;
  const description = topProvider
    ? `Compare ${count} ${category.name.toLowerCase()} in ${city.name}, ${country.name}. The highest-rated is ${topProvider.name} (${topProvider.googleRating} stars, ${topProvider.googleReviewCount?.toLocaleString()} reviews). Updated ${currentMonth} ${currentYear}.`
    : `Compare ${count} ${category.name.toLowerCase()} in ${city.name}, ${country.name}. Ranked by Google rating. Updated ${currentMonth} ${currentYear}.`;

  // noindex if fewer than 3 rated providers
  const { providers: allForCount } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ratedCount = allForCount.filter(
    (p) => Number(p.googleRating) > 0
  ).length;

  return {
    title: truncateTitle(title),
    description: truncateDescription(description),
    alternates: { canonical: url },
    ...(ratedCount < 3 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `Best ${category.name} in ${city.name}, ${country.name}`,
      description,
      url,
      type: "website",
      locale: COUNTRY_LOCALES[country.code] ?? "en",
      siteName: `${country.name} Healthcare Directory by Zavis`,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `Best ${category.name} in ${city.name}, ${country.name}`,
        },
      ],
    },
  };
}

export async function GccBestCategoryPage({
  countryCode,
  params,
}: {
  countryCode: string;
  params: { city: string; category: string };
}) {
  if (!isValidGccCountry(countryCode)) notFound();

  const country = getGccCountry(countryCode)!;
  const city = getCityBySlug(params.city);
  if (!city || !cityBelongsToCountry(params.city, country.code)) notFound();
  const category = getCategoryBySlug(params.category);
  if (!category) notFound();

  const base = getBaseUrl();
  const regulatorStr = country.regulators.join(", ");
  const totalCount = await getProviderCountByCategoryAndCity(
    category.slug,
    city.slug
  );

  const { providers: allProviders } = await getProviders({
    citySlug: city.slug,
    categorySlug: category.slug,
    limit: 99999,
  });
  const ranked = rankProviders(allProviders);

  if (ranked.length === 0) notFound();

  const top15 = ranked.slice(0, 15);
  const top20ForSchema = ranked.slice(0, 20);
  const topProvider = ranked[0];
  const mostReviewed = [...ranked].sort(
    (a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0)
  )[0];

  const average = avgRating(allProviders);
  const commonInsurers = topInsurers(allProviders, 5);
  const topNeighborhoods = topAreas(allProviders, 5);

  // Cross-links: other cities for same category
  const otherCitiesRaw = await Promise.all(
    getCitiesByCountry(country.code)
      .filter((c) => c.slug !== city.slug)
      .map(async (c) => ({
        ...c,
        count: await getProviderCountByCategoryAndCity(category.slug, c.slug),
      }))
  );
  const otherCities = otherCitiesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  // Cross-links: other categories in same city
  const otherCategoriesRaw = await Promise.all(
    getCategories()
      .filter((c) => c.slug !== category.slug)
      .map(async (c) => ({
        ...c,
        count: await getProviderCountByCategoryAndCity(c.slug, city.slug),
      }))
  );
  const otherCategories = otherCategoriesRaw
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // FAQs
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/s$/, "");

  const topLanguages = (() => {
    const counts = new Map<string, number>();
    for (const p of allProviders) {
      for (const lang of p.languages) {
        counts.set(lang, (counts.get(lang) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  })();

  const topNeighborhoodNames = topNeighborhoods.map((a) =>
    titleCase(a.slug.replace(/-/g, " "))
  );

  const verifiedCount = allProviders.filter((p) => p.isVerified).length;
  const providersWithWebsite = allProviders.filter((p) => p.website).length;
  const providersWithPhone = allProviders.filter((p) => p.phone).length;

  const faqs = [
    {
      question: `What is the best ${catSingular} in ${city.name}, ${country.name}?`,
      answer: `According to the ${country.name} Healthcare Directory, the highest-rated ${catSingular} in ${city.name} is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating based on ${topProvider.googleReviewCount?.toLocaleString()} patient reviews. All rankings are based on verified Google ratings and review volume. Data sourced from official ${regulatorStr} registers.`,
    },
    {
      question: `How many ${catLower} are there in ${city.name}, ${country.name}?`,
      answer: `There are ${totalCount} ${catLower} listed in ${city.name} on the ${country.name} Healthcare Directory. Of these, ${ranked.length} have Google ratings above 0 stars. The average rating across all rated providers is ${average} stars.`,
    },
    {
      question: `Which ${catSingular} in ${city.name} has the most reviews?`,
      answer: mostReviewed
        ? `${mostReviewed.name} has the most Google reviews among ${catLower} in ${city.name}, with ${mostReviewed.googleReviewCount?.toLocaleString()} reviews and a ${mostReviewed.googleRating}-star rating. A high review count indicates consistent patient traffic and broad feedback.`
        : `Review counts vary among ${catLower} in ${city.name}. Browse the ranked list above to compare providers by review volume.`,
    },
    {
      question: `Do ${catLower} in ${city.name} accept insurance?`,
      answer:
        commonInsurers.length > 0
          ? `Yes, most ${catLower} in ${city.name} accept major insurance plans. The most commonly accepted insurers include ${commonInsurers.join(", ")}. Healthcare in ${city.name} is regulated by ${regulatorStr}. Check individual provider listings for specific insurance acceptance.`
          : `Many ${catLower} in ${city.name} accept major insurance plans. Healthcare in ${city.name} is regulated by ${regulatorStr}. Check individual listings for specific insurance acceptance.`,
    },
    {
      question: `What are the operating hours for ${catLower} in ${city.name}?`,
      answer: `Most ${catLower} in ${city.name} operate from 8:00 AM to 10:00 PM on weekdays and Saturdays. Some facilities, particularly hospitals and emergency care centers, are open 24/7. Friday hours may be reduced. Individual operating hours are listed on each provider's profile page.`,
    },
    {
      question: `How are these ${catLower} in ${city.name} ranked?`,
      answer: `Providers are ranked by Google rating (highest first), with review count used as a tiebreaker for providers with the same rating. Only providers with a Google rating above 0 are included. All provider data is sourced from official ${regulatorStr} registers.`,
    },
    {
      question: `How much does a visit to a ${catSingular} in ${city.name} cost without insurance?`,
      answer: `The cost of visiting a ${catSingular} in ${city.name} without insurance varies depending on the provider and type of service. A general consultation typically ranges from ${country.currency} 50-200 at a private practice, while specialized procedures cost more. ${commonInsurers.length > 0 ? `To reduce costs, check if the provider accepts your insurance — common plans include ${commonInsurers.slice(0, 3).join(", ")}.` : ""} Always confirm pricing directly with the facility.`,
    },
    {
      question: `Which ${city.name} ${catLower} accept ${commonInsurers.length > 0 ? commonInsurers[0] : "major"} insurance?`,
      answer:
        commonInsurers.length > 0
          ? `Multiple ${catLower} in ${city.name} accept ${commonInsurers[0]} insurance. Among the top-rated providers, many list ${commonInsurers[0]} as an accepted plan. Visit individual provider profiles to confirm current coverage. Other commonly accepted insurers include ${commonInsurers.slice(1).join(", ") || "various major plans"}.`
          : `Many ${catLower} in ${city.name} accept major insurance plans. Check individual provider profiles for current insurance acceptance details.`,
    },
    {
      question: `Where are the best ${catLower} located in ${city.name}?`,
      answer:
        topNeighborhoodNames.length > 0
          ? `The highest concentration of top-rated ${catLower} in ${city.name} is found in ${topNeighborhoodNames.slice(0, 3).join(", ")}${topNeighborhoodNames.length > 3 ? `, followed by ${topNeighborhoodNames.slice(3).join(" and ")}` : ""}. The #1 ranked provider, ${topProvider.name}, is located in ${topProvider.areaSlug ? titleCase(topProvider.areaSlug.replace(/-/g, " ")) : city.name}.`
          : `Top-rated ${catLower} are distributed across ${city.name}. The #1 ranked provider, ${topProvider.name}, has a ${topProvider.googleRating}-star rating.`,
    },
    {
      question: `Can I book an appointment online with ${catLower} in ${city.name}?`,
      answer: `Many ${catLower} in ${city.name} offer online booking through their websites or third-party platforms. ${providersWithWebsite > 0 ? `Of the ${totalCount} ${catLower} listed, ${providersWithWebsite} have websites where you can check availability and book appointments.` : ""} ${providersWithPhone > 0 ? `${providersWithPhone} providers list phone numbers for direct booking.` : ""} Walk-in visits are accepted at many clinics, though appointment booking is recommended for specialist consultations.`,
    },
    ...(topLanguages.length > 1
      ? [
          {
            question: `Do ${catLower} in ${city.name} have multilingual staff?`,
            answer: `Yes, many ${catLower} in ${city.name} have multilingual staff. The most commonly available languages include ${topLanguages.join(", ")}. Individual provider profiles list the specific languages spoken at each facility.`,
          },
        ]
      : []),
    ...(verifiedCount > 0
      ? [
          {
            question: `How do I know if a ${catSingular} in ${city.name} is licensed?`,
            answer: `All ${catLower} listed in the ${country.name} Healthcare Directory are sourced from official ${regulatorStr} registers, meaning they hold valid healthcare licenses. ${verifiedCount > 0 ? `Currently, ${verifiedCount} out of ${totalCount} ${catLower} in ${city.name} carry verified status in our directory.` : ""} You can independently verify any facility's license through official ${regulatorStr} channels.`,
          },
        ]
      : []),
  ];

  // JSON-LD
  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: base },
    {
      name: country.name,
      url: `${base}${countryDirectoryUrl(country.code)}`,
    },
    { name: "Best", url: `${base}${countryBestUrl(country.code)}` },
    {
      name: city.name,
      url: `${base}${countryBestUrl(country.code, city.slug)}`,
    },
    { name: category.name },
  ]);

  const schemaOpts = {
    countryCode: country.code,
    countryPrefix: country.code,
  };
  const itemList = itemListSchema(
    `Best ${category.name} in ${city.name}, ${country.name}`,
    top20ForSchema,
    city.name,
    base,
    schemaOpts
  );

  const faqSchema = faqPageSchema(faqs);
  const speakable = speakableSchema([".answer-block"]);

  const intro = getCategoryIntro(
    category.slug,
    category.name,
    city.name,
    country.name,
    totalCount,
    ranked.length,
    average,
    regulatorStr
  );

  const comparisonProviders = ranked.slice(0, 10);
  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemList} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          {
            label: country.name,
            href: countryDirectoryUrl(country.code),
          },
          { label: "Best", href: countryBestUrl(country.code) },
          {
            label: city.name,
            href: countryBestUrl(country.code, city.slug),
          },
          { label: category.name },
        ]}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best {category.name} in {city.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Top {Math.min(ranked.length, 10)} highest-rated out of {totalCount}{" "}
          providers &middot; Ranked by patient ratings, years of practice &amp;
          insurance coverage &middot; {regulatorStr}
        </p>
      </div>

      {/* Editorial Intro */}
      <div
        className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8"
        data-answer-block="true"
      >
        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] sm:text-[18px] text-[#1c1c1c] tracking-tight mb-3">
          {intro.headline}
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          {intro.body}
        </p>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={countryDirectoryUrl(country.code, city.slug, category.slug)}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All {catLower} in {city.name}
        </Link>
        <Link
          href={countryBestUrl(country.code, city.slug)}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All categories in {city.name}
        </Link>
        <Link
          href={countryBestUrl(country.code)}
          className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors"
        >
          All cities
        </Link>
      </div>

      {/* Selection Criteria */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How We Rank: Selection Criteria
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">
                1
              </span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">
                Patient Ratings
              </h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Google rating is the primary ranking signal. Only providers with a
              rating above 0 are included. Review count serves as a tiebreaker.
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">
                2
              </span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">
                Years of Practice
              </h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Established facilities with years of operation signal stability
              and clinical experience. We surface year of establishment where
              available.
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#006828]/10 flex items-center justify-center text-[#006828] font-bold text-sm">
                3
              </span>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight">
                Insurance Coverage
              </h3>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              Wider insurance acceptance signals accessibility and compliance
              with major payer networks. We show the number of accepted plans
              alongside each provider.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-black/40 leading-relaxed">
          All provider data is sourced from official{" "}
          <strong>{regulatorStr}</strong> licensed facilities registers. Rankings
          are updated regularly. These rankings do not constitute a medical
          recommendation.
        </p>
      </section>

      {/* Comparison Table */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Top {Math.min(comparisonProviders.length, 10)} {category.name} —
            Side-by-Side Comparison
          </h2>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#f8f8f6]">
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">
                  #
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">
                  Provider
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">
                  Rating
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">
                  Reviews
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">
                  Est.
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">
                  Insurance
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-center px-3 py-3 border-b border-black/[0.08]">
                  Verified
                </th>
                <th className="font-['Geist',sans-serif] text-[11px] font-semibold text-black/50 uppercase tracking-wider text-left px-3 py-3 border-b border-black/[0.08]">
                  Area
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonProviders.map((p, idx) => {
                const yearsOfPractice = p.yearEstablished
                  ? currentYear - p.yearEstablished
                  : null;
                return (
                  <tr
                    key={p.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-[#fafaf9]"} hover:bg-[#006828]/[0.02] transition-colors`}
                  >
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <span className="font-bold text-[#006828] text-sm">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <Link
                        href={countryDirectoryUrl(
                          country.code,
                          p.citySlug,
                          p.categorySlug,
                          p.slug
                        )}
                        className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.phone && (
                        <p className="font-['Geist',sans-serif] text-[10px] text-black/30 mt-0.5">
                          {p.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {p.googleRating} ★
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60 font-medium">
                        {p.googleReviewCount > 0
                          ? p.googleReviewCount.toLocaleString()
                          : "\u2014"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60">
                        {yearsOfPractice !== null ? (
                          <span title={`Established ${p.yearEstablished}`}>
                            {yearsOfPractice}+ yrs
                          </span>
                        ) : (
                          "\u2014"
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      <span className="font-['Geist',sans-serif] text-xs text-black/60 font-medium">
                        {p.insurance.length > 0
                          ? `${p.insurance.length} plans`
                          : "\u2014"}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04] text-center">
                      {p.isVerified ? (
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-black/30">&mdash;</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-black/[0.04]">
                      <span className="font-['Geist',sans-serif] text-xs text-black/50">
                        {p.areaSlug
                          ? titleCase(p.areaSlug.replace(/-/g, " "))
                          : "\u2014"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ranked.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              href={countryDirectoryUrl(
                country.code,
                city.slug,
                category.slug
              )}
              className="text-xs text-[#006828] font-bold hover:underline"
            >
              View all {totalCount} {catLower} in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Detailed Ranked Provider List */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Top {Math.min(ranked.length, 15)} {category.name} — Detailed
            Profiles
          </h2>
        </div>
        <div className="space-y-0">
          {top15.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-start gap-3 py-4 border-b border-black/[0.06] last:border-b-0"
            >
              <span className="text-lg font-bold text-[#006828] w-8 flex-shrink-0 text-center mt-0.5">
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={countryDirectoryUrl(
                      country.code,
                      p.citySlug,
                      p.categorySlug,
                      p.slug
                    )}
                    className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.isVerified && (
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px]">
                      Verified
                    </span>
                  )}
                </div>
                <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-1.5">
                  {p.address}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                  {p.yearEstablished && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      Est. {p.yearEstablished} (
                      {currentYear - p.yearEstablished}+ years)
                    </span>
                  )}
                  {p.insurance.length > 0 && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      {p.insurance.length} insurance plan
                      {p.insurance.length !== 1 ? "s" : ""} accepted
                    </span>
                  )}
                  {p.languages.length > 0 && (
                    <span className="font-['Geist',sans-serif] text-[11px] text-black/50">
                      {p.languages.length} language
                      {p.languages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {p.insurance.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {p.insurance.slice(0, 4).map((ins) => (
                      <span
                        key={ins}
                        className="text-[10px] border border-black/[0.06] px-1.5 py-0.5 text-black/40"
                      >
                        {ins}
                      </span>
                    ))}
                    {p.insurance.length > 4 && (
                      <span className="text-[10px] text-black/40">
                        +{p.insurance.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                <Link
                  href={countryDirectoryUrl(
                    country.code,
                    p.citySlug,
                    p.categorySlug,
                    p.slug
                  )}
                  className="text-xs text-[#006828] font-bold hover:underline"
                >
                  View full profile &rarr;
                </Link>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1">
                  {p.googleRating} ★
                </span>
                {p.googleReviewCount > 0 && (
                  <span className="text-[11px] text-black/40">
                    {p.googleReviewCount.toLocaleString()} reviews
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {ranked.length > 15 && (
          <div className="mt-4 text-center">
            <Link
              href={countryDirectoryUrl(
                country.code,
                city.slug,
                category.slug
              )}
              className="text-xs text-[#006828] font-bold hover:underline"
            >
              View all {totalCount} {catLower} in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            {category.name} in {city.name} — Quick Stats
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{totalCount}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Total Providers
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">{average}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Avg. Rating
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {ranked.length}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Rated Providers
            </p>
          </div>
          <div className="border border-black/[0.06] rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {commonInsurers.length > 0 ? commonInsurers.length + "+" : "\u2014"}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Insurers Accepted
            </p>
          </div>
        </div>

        {commonInsurers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              Most Commonly Accepted Insurance
            </p>
            <div className="flex flex-wrap gap-2">
              {commonInsurers.map((ins) => (
                <span
                  key={ins}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {ins}
                </span>
              ))}
            </div>
          </div>
        )}

        {topNeighborhoods.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
              Top Neighborhoods
            </p>
            <div className="flex flex-wrap gap-2">
              {topNeighborhoods.map((area) => (
                <span
                  key={area.slug}
                  className="text-xs border border-black/[0.06] px-2 py-1 text-black/40"
                >
                  {titleCase(area.slug.replace(/-/g, " "))} ({area.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`Best ${category.name} in ${city.name} — FAQ`}
      />

      {/* Cross-links: same category in other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Best {category.name} in Other Cities
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={countryBestUrl(country.code, c.slug, category.slug)}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group text-center"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-links: other categories in same city */}
      {otherCategories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Other Top-Rated Categories in {city.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={countryBestUrl(country.code, city.slug, c.slug)}
                className="block border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-[#006828] font-bold mt-1">
                  {c.count} {c.count === 1 ? "provider" : "providers"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Full directory CTA */}
      <div className="bg-[#1c1c1c] text-white p-6 flex items-center justify-between mb-8">
        <div>
          <p className="font-bold text-sm">
            Browse all {catLower} in {city.name}
          </p>
          <p className="text-xs text-white/70 mt-1">
            Full directory with contact details, operating hours, insurance
            acceptance, and more
          </p>
        </div>
        <Link
          href={countryDirectoryUrl(country.code, city.slug, category.slug)}
          className="bg-[#006828] text-white px-4 py-2 text-xs font-bold hover:bg-green-600 transition-colors flex-shrink-0"
        >
          View all {totalCount}
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Rankings are based on publicly available
          Google ratings and review counts. They do not constitute a medical
          recommendation. Provider data is sourced from official {regulatorStr}{" "}
          registers. Insurance acceptance, operating hours, and services may
          change — always confirm directly with the provider before your visit.
        </p>
      </div>
    </div>
  );
}
