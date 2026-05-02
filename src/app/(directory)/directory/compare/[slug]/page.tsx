import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Building2, Stethoscope, MapPin, ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  parseComparisonSlug,
  getCityComparison,
  getCategoryComparison,
  CityComparisonData,
  CategoryComparisonData,
} from "@/lib/compare";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
// ISR only — no generateStaticParams. Comparison pages call getCityComparison
// and getCategoryComparison which each fire multiple DB queries per slug.
// Prerendering all combinations in parallel exhausted the pg pool
// (Deploy 6 failure, 2026-04-11). Pages render on first visit and cache 12h.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getBaseUrl();
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return { title: "Comparison Not Found" };

  if (parsed.type === "city") {
    const data = await safe(
      getCityComparison(parsed.cityASlug!, parsed.cityBSlug!),
      null as CityComparisonData | null,
      "cityCompare-meta",
    );
    if (!data) return { title: "Comparison Not Found" };
    const title = `Healthcare in ${data.cityA.name} vs ${data.cityB.name}: Provider Comparison | UAE Open Healthcare Directory`;
    const description =
      `Side-by-side comparison of healthcare in ${data.cityA.name} (${data.statsA.totalProviders} providers) vs ${data.cityB.name} (${data.statsB.totalProviders} providers). ` +
      `Compare GP costs, hospital counts, average ratings, regulators, and top providers. Data from DHA, DOH, MOHAP registers.`;
    return {
      title,
      description,
      alternates: { canonical: `${base}/directory/compare/${slug}` },
      openGraph: { title, description, url: `${base}/directory/compare/${slug}`, type: "website" },
    };
  }

  const data = await safe(
    getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!),
    null as CategoryComparisonData | null,
    "catCompare-meta",
  );
  if (!data) return { title: "Comparison Not Found" };
  const title = `${data.categoryA.name} vs ${data.categoryB.name} in ${data.cityName}: Comparison | UAE Open Healthcare Directory`;
  const description =
    `Compare ${data.categoryA.name.toLowerCase()} (${data.statsA.totalProviders} providers) vs ${data.categoryB.name.toLowerCase()} (${data.statsB.totalProviders} providers) in ${data.cityName}. ` +
    `See cost differences, ratings, and top providers side-by-side.`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/directory/compare/${slug}` },
    openGraph: { title, description, url: `${base}/directory/compare/${slug}`, type: "website" },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug);
  if (!parsed) notFound();

  if (parsed.type === "city") {
    const data = await safe(
      getCityComparison(parsed.cityASlug!, parsed.cityBSlug!),
      null as CityComparisonData | null,
      "cityCompare",
    );
    if (!data) notFound();
    return <CityComparisonView data={data} />;
  }

  const data = await safe(
    getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!),
    null as CategoryComparisonData | null,
    "catCompare",
  );
  if (!data) notFound();
  return <CategoryComparisonView data={data} />;
}

// ─── Shared breadcrumb renderer ─────────────────────────────────────────────

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
      {items.map((b, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {b.href && !isLast ? (
              <Link href={b.href} className="hover:text-ink transition-colors">{b.label}</Link>
            ) : (
              <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        );
      })}
    </nav>
  );
}

// ─── City vs City View ─────────────────────────────────────────────────────

function CityComparisonView({ data }: { data: CityComparisonData }) {
  const base = getBaseUrl();
  const { cityA, cityB, statsA, statsB } = data;

  const faqs = [
    {
      question: `How does the cost of healthcare in ${cityA.name} compare to ${cityB.name}?`,
      answer:
        `GP consultations in ${cityA.name} typically cost ${statsA.gpFeeRange}, while in ${cityB.name} they cost ${statsB.gpFeeRange}. ` +
        `Specialist consultations in ${cityA.name} range from ${statsA.specialistFeeRange} vs ${statsB.specialistFeeRange} in ${cityB.name}. ` +
        `Emergency visits are ${statsA.emergencyFeeRange} in ${cityA.name} and ${statsB.emergencyFeeRange} in ${cityB.name}. ` +
        `Government facilities in both cities tend to be more affordable. Always confirm fees directly with the provider.`,
    },
    {
      question: `Which city has better quality healthcare, ${cityA.name} or ${cityB.name}?`,
      answer:
        `Based on Google ratings from verified patient reviews, ${cityA.name} providers have an average rating of ${statsA.avgRating > 0 ? statsA.avgRating.toFixed(1) : "N/A"} ` +
        `(across ${statsA.ratedProviderCount} rated providers) while ${cityB.name} averages ${statsB.avgRating > 0 ? statsB.avgRating.toFixed(1) : "N/A"} ` +
        `(across ${statsB.ratedProviderCount} rated providers). ` +
        `Both cities have internationally accredited hospitals. Quality depends on the specific provider, specialty, and your needs rather than the city alone.`,
    },
    {
      question: `Is it easier to access healthcare in ${cityA.name} or ${cityB.name}?`,
      answer:
        `${cityA.name} has ${statsA.totalProviders} listed healthcare providers compared to ${statsB.totalProviders} in ${cityB.name}. ` +
        `${cityA.name} has ${statsA.hospitalCount} hospitals and ${statsA.clinicCount} clinics, while ${cityB.name} has ${statsB.hospitalCount} hospitals and ${statsB.clinicCount} clinics. ` +
        `${cityA.name} healthcare is regulated by the ${statsA.regulator}, while ${cityB.name} is regulated by the ${statsB.regulator}. ` +
        `In both cities, GP walk-in times are typically 15-45 minutes and specialist appointments can be booked within 1-7 days.`,
    },
    {
      question: `How does insurance coverage differ between ${cityA.name} and ${cityB.name}?`,
      answer:
        `${statsA.insuranceNote} In ${cityB.name}: ${statsB.insuranceNote} ` +
        `Check the individual provider listings on the UAE Open Healthcare Directory to confirm which insurance plans are accepted at specific facilities.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Compare", url: `${base}/directory/compare` },
          { name: `${cityA.name} vs ${cityB.name}`, url: `${base}/directory/compare/${data.slug}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <Breadcrumbs
            items={[
              { label: "UAE", href: "/" },
              { label: "Directory", href: "/directory" },
              { label: "Compare", href: "/directory/compare" },
              { label: `${cityA.name} vs ${cityB.name}` },
            ]}
          />
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            UAE healthcare comparison
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
            Healthcare in {cityA.name} vs {cityB.name}.
          </h1>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              According to the UAE Open Healthcare Directory, {cityA.name} has{" "}
              {statsA.totalProviders.toLocaleString()} licensed healthcare providers while {cityB.name} has{" "}
              {statsB.totalProviders.toLocaleString()}. Healthcare in {cityA.name} is regulated by the {statsA.regulator}, while {cityB.name} is regulated by the {statsB.regulator}. GP consultations cost {statsA.gpFeeRange} in {cityA.name} compared to {statsB.gpFeeRange} in {cityB.name}. Both cities require employer-provided health insurance for residents. Below is a detailed side-by-side comparison of provider counts, average ratings, costs, and top-rated facilities. Data sourced from official government registers and Google Maps, verified March 2026.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em] mb-6">
          Side-by-side comparison
        </h2>
        <div className="overflow-x-auto bg-white rounded-z-md border border-ink-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-ink text-white">
                <th className="text-left py-3 px-4 font-sans font-semibold">Metric</th>
                <th className="text-left py-3 px-4 font-sans font-semibold">{cityA.name}</th>
                <th className="text-left py-3 px-4 font-sans font-semibold">{cityB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Total Providers</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.totalProviders.toLocaleString()}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.totalProviders.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Average Rating</td>
                <td className="py-3 px-4">
                  {statsA.avgRating > 0 ? (
                    <span className="flex items-center gap-1 text-ink-soft">
                      <Star className="w-4 h-4 text-accent-dark fill-accent" />
                      {statsA.avgRating.toFixed(1)}
                      <span className="text-ink-muted text-xs">({statsA.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {statsB.avgRating > 0 ? (
                    <span className="flex items-center gap-1 text-ink-soft">
                      <Star className="w-4 h-4 text-accent-dark fill-accent" />
                      {statsB.avgRating.toFixed(1)}
                      <span className="text-ink-muted text-xs">({statsB.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Hospitals</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.hospitalCount}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.hospitalCount}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Clinics</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.clinicCount}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.clinicCount}</td>
              </tr>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Dental Clinics</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.dentalCount}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.dentalCount}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Pharmacies</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.pharmacyCount}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.pharmacyCount}</td>
              </tr>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">GP Consultation</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.gpFeeRange}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.gpFeeRange}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Specialist Consultation</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.specialistFeeRange}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.specialistFeeRange}</td>
              </tr>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Emergency Visit</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.emergencyFeeRange}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.emergencyFeeRange}</td>
              </tr>
              <tr className="bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Regulator</td>
                <td className="py-3 px-4 text-ink-soft text-xs">{statsA.regulator}</td>
                <td className="py-3 px-4 text-ink-soft text-xs">{statsB.regulator}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Top-rated providers */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-6">
          Top-rated providers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { city: cityA, stats: statsA },
            { city: cityB, stats: statsB },
          ].map(({ city, stats }) => (
            <div key={city.slug} className="bg-white border border-ink-line rounded-z-md p-5">
              <h3 className="font-sans font-semibold text-ink text-z-body-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-dark" />
                {city.name}
              </h3>
              {stats.topProviders.length > 0 ? (
                <div>
                  {stats.topProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-ink-line last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-z-caption font-semibold text-ink-muted w-5">{i + 1}</span>
                        <span className="font-sans text-z-body-sm font-medium text-ink">{p.name}</span>
                      </div>
                      {Number(p.rating) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent-dark fill-accent" />
                          <span className="font-sans text-z-caption font-semibold text-accent-dark">{p.rating}</span>
                          <span className="font-sans text-z-micro text-ink-muted">({p.reviewCount.toLocaleString()})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-z-body-sm text-ink-muted">No rated providers yet.</p>
              )}
              <Link href={`/directory/${city.slug}`} className="inline-flex items-center mt-3 font-sans text-z-caption font-semibold text-accent-dark hover:underline">
                Browse all {city.name} providers &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Insurance */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-6">
          Insurance coverage
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-cream border border-ink-line rounded-z-md p-5">
            <h3 className="font-sans font-semibold text-ink text-z-body-sm mb-2">{cityA.name}</h3>
            <p className="font-sans text-z-caption text-ink-soft leading-relaxed">{statsA.insuranceNote}</p>
          </div>
          <div className="bg-surface-cream border border-ink-line rounded-z-md p-5">
            <h3 className="font-sans font-semibold text-ink text-z-body-sm mb-2">{cityB.name}</h3>
            <p className="font-sans text-z-caption text-ink-soft leading-relaxed">{statsB.insuranceNote}</p>
          </div>
        </div>
      </section>

      {/* Related comparisons */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
          More city comparisons
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[cityA.slug, cityB.slug].flatMap((currentSlug) => {
            const name = currentSlug === cityA.slug ? cityA.name : cityB.name;
            return ["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "al-ain"]
              .filter((s) => s !== cityA.slug && s !== cityB.slug)
              .map((other) => {
                const pair = currentSlug < other ? `${currentSlug}-vs-${other}` : `${other}-vs-${currentSlug}`;
                const otherName = other === "abu-dhabi" ? "Abu Dhabi" : other === "ras-al-khaimah" ? "Ras Al Khaimah" : other === "al-ain" ? "Al Ain" : other.charAt(0).toUpperCase() + other.slice(1);
                return (
                  <li key={`${currentSlug}-${pair}`}>
                    <Link href={`/directory/compare/${pair}`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">
                      {name} vs {otherName}
                    </Link>
                  </li>
                );
              });
          })}
        </ul>
      </section>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${cityA.name} vs ${cityB.name} Healthcare FAQ`} />
        </div>
        <div className="mt-8 border-t border-ink-line pt-4">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong>Disclaimer:</strong> Provider counts and ratings are based on data from official UAE health authority registers (DHA, DOH, MOHAP) and Google Maps, last verified March 2026. Consultation fees are indicative ranges and may vary by provider, insurance status, and visit complexity. This comparison is for informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </section>
    </>
  );
}

// ─── Category vs Category View ──────────────────────────────────────────────

function CategoryComparisonView({ data }: { data: CategoryComparisonData }) {
  const base = getBaseUrl();
  const { cityName, citySlug, categoryA, categoryB, statsA, statsB } = data;

  const faqs = [
    {
      question: `How much do ${categoryA.name.toLowerCase()} cost compared to ${categoryB.name.toLowerCase()} in ${cityName}?`,
      answer:
        `In ${cityName}, ${categoryA.name.toLowerCase()} consultations typically cost ${statsA.priceRange}, while ${categoryB.name.toLowerCase()} consultations cost ${statsB.priceRange}. ` +
        `Prices vary by provider tier, insurance status, and visit complexity. Government and semi-government facilities are generally more affordable. Always confirm fees directly with the provider.`,
    },
    {
      question: `Which has better ratings in ${cityName}, ${categoryA.name.toLowerCase()} or ${categoryB.name.toLowerCase()}?`,
      answer:
        `${categoryA.name} in ${cityName} have an average Google rating of ${statsA.avgRating > 0 ? statsA.avgRating.toFixed(1) : "N/A"} ` +
        `(${statsA.ratedProviderCount} rated), while ${categoryB.name.toLowerCase()} average ${statsB.avgRating > 0 ? statsB.avgRating.toFixed(1) : "N/A"} ` +
        `(${statsB.ratedProviderCount} rated). Ratings reflect patient experience including wait times, staff friendliness, and facility quality.`,
    },
    {
      question: `When should I go to a hospital vs a clinic in ${cityName}?`,
      answer:
        `Choose a hospital in ${cityName} for emergencies, inpatient care (surgery, overnight stays), complex diagnostics (MRI, CT scans), and multi-specialty consultations under one roof. ` +
        `Choose a clinic for routine GP check-ups, specialist outpatient consultations, minor procedures, vaccinations, and follow-up visits. ` +
        `Clinics generally have shorter wait times and lower consultation fees than hospitals.`,
    },
    {
      question: `Do ${categoryA.name.toLowerCase()} and ${categoryB.name.toLowerCase()} in ${cityName} accept the same insurance?`,
      answer:
        `Most major UAE insurance plans are accepted at both ${categoryA.name.toLowerCase()} and ${categoryB.name.toLowerCase()} in ${cityName}. ` +
        `${statsA.insuranceNote} ` +
        `However, specific plan networks vary. Hospital-affiliated clinics tend to have broader insurance acceptance. Always verify with both your insurer and the provider.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Compare", url: `${base}/directory/compare` },
          { name: `${categoryA.name} vs ${categoryB.name} in ${cityName}`, url: `${base}/directory/compare/${data.slug}` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <Breadcrumbs
            items={[
              { label: "UAE", href: "/" },
              { label: "Directory", href: "/directory" },
              { label: "Compare", href: "/directory/compare" },
              { label: `${categoryA.name} vs ${categoryB.name} in ${cityName}` },
            ]}
          />
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Compare in {cityName}
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
            {categoryA.name} vs {categoryB.name} in {cityName}.
          </h1>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              According to the UAE Open Healthcare Directory, {cityName} has{" "}
              {statsA.totalProviders.toLocaleString()} {categoryA.name.toLowerCase()} and{" "}
              {statsB.totalProviders.toLocaleString()} {categoryB.name.toLowerCase()}.{" "}
              {categoryA.name} consultations typically cost {statsA.priceRange}, while{" "}
              {categoryB.name.toLowerCase()} cost {statsB.priceRange}. Hospitals offer inpatient care,
              emergency departments, and multi-specialty services under one roof. Clinics focus on
              outpatient consultations, routine check-ups, and minor procedures with shorter wait times
              and lower fees. Below is a data-driven side-by-side comparison. Data sourced from official
              government registers and Google Maps, verified March 2026.
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-side */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em] mb-6">
          Side-by-side comparison
        </h2>
        <div className="overflow-x-auto bg-white rounded-z-md border border-ink-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-ink text-white">
                <th className="text-left py-3 px-4 font-sans font-semibold">Metric</th>
                <th className="text-left py-3 px-4 font-sans font-semibold"><Building2 className="inline w-4 h-4 mr-1" />{categoryA.name}</th>
                <th className="text-left py-3 px-4 font-sans font-semibold"><Stethoscope className="inline w-4 h-4 mr-1" />{categoryB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Total Providers in {cityName}</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.totalProviders.toLocaleString()}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.totalProviders.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Average Rating</td>
                <td className="py-3 px-4">
                  {statsA.avgRating > 0 ? (
                    <span className="flex items-center gap-1 text-ink-soft">
                      <Star className="w-4 h-4 text-accent-dark fill-accent" />{statsA.avgRating.toFixed(1)}
                      <span className="text-ink-muted text-xs">({statsA.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {statsB.avgRating > 0 ? (
                    <span className="flex items-center gap-1 text-ink-soft">
                      <Star className="w-4 h-4 text-accent-dark fill-accent" />{statsB.avgRating.toFixed(1)}
                      <span className="text-ink-muted text-xs">({statsB.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-ink-line">
                <td className="py-3 px-4 font-semibold text-ink">Consultation Cost</td>
                <td className="py-3 px-4 text-ink-soft">{statsA.priceRange}</td>
                <td className="py-3 px-4 text-ink-soft">{statsB.priceRange}</td>
              </tr>
              <tr className="border-b border-ink-line bg-surface-cream">
                <td className="py-3 px-4 font-semibold text-ink">Best For</td>
                <td className="py-3 px-4 text-ink-soft text-xs">Emergencies, inpatient surgery, complex diagnostics, multi-specialty care</td>
                <td className="py-3 px-4 text-ink-soft text-xs">Routine GP visits, specialist outpatient consultations, minor procedures, vaccinations</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-ink">Typical Wait Time</td>
                <td className="py-3 px-4 text-ink-soft text-xs">ER: immediate triage; outpatient: 1-7 days</td>
                <td className="py-3 px-4 text-ink-soft text-xs">Walk-in: 15-45 min; specialist: 1-3 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Top providers per category */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-6">Top-rated providers</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { cat: categoryA, stats: statsA, Icon: Building2 },
            { cat: categoryB, stats: statsB, Icon: Stethoscope },
          ].map(({ cat, stats, Icon }) => (
            <div key={cat.slug} className="bg-white border border-ink-line rounded-z-md p-5">
              <h3 className="font-sans font-semibold text-ink text-z-body-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-accent-dark" />
                {cat.name} in {cityName}
              </h3>
              {stats.topProviders.length > 0 ? (
                <div>
                  {stats.topProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-ink-line last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-z-caption font-semibold text-ink-muted w-5">{i + 1}</span>
                        <span className="font-sans text-z-body-sm font-medium text-ink">{p.name}</span>
                      </div>
                      {Number(p.rating) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent-dark fill-accent" />
                          <span className="font-sans text-z-caption font-semibold text-accent-dark">{p.rating}</span>
                          <span className="font-sans text-z-micro text-ink-muted">({p.reviewCount.toLocaleString()})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-z-body-sm text-ink-muted">No rated providers yet.</p>
              )}
              <Link href={`/directory/${citySlug}/${cat.slug}`} className="inline-flex items-center mt-3 font-sans text-z-caption font-semibold text-accent-dark hover:underline">
                Browse all {cat.name.toLowerCase()} in {cityName} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* More comparisons */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">More comparisons</h2>
        <ul className="flex flex-wrap gap-2">
          {["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "al-ain"]
            .filter((s) => s !== citySlug)
            .map((s) => {
              const name = s === "abu-dhabi" ? "Abu Dhabi" : s === "ras-al-khaimah" ? "Ras Al Khaimah" : s === "al-ain" ? "Al Ain" : s.charAt(0).toUpperCase() + s.slice(1);
              return (
                <li key={s}>
                  <Link href={`/directory/compare/hospitals-vs-clinics-${s}`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">
                    Hospitals vs Clinics in {name}
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${categoryA.name} vs ${categoryB.name} in ${cityName} FAQ`} />
        </div>
        <div className="mt-8 border-t border-ink-line pt-4">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong>Disclaimer:</strong> Provider counts, ratings, and cost estimates are based on data from official UAE health authority registers (DHA, DOH, MOHAP) and Google Maps, last verified March 2026. Consultation fees are indicative ranges. This comparison is for informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </section>
    </>
  );
}
