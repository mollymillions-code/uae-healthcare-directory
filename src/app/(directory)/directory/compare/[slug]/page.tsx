import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompareArrows, Star, Building2, Stethoscope, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllComparisonSlugs,
  parseComparisonSlug,
  getCityComparison,
  getCategoryComparison,
  CityComparisonData,
  CategoryComparisonData,
} from "@/lib/compare";

export const revalidate = 43200;

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

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
    const data = await getCityComparison(parsed.cityASlug!, parsed.cityBSlug!);
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

  const data = await getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!);
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
    const data = await getCityComparison(parsed.cityASlug!, parsed.cityBSlug!);
    if (!data) notFound();
    return <CityComparisonView data={data} />;
  }

  const data = await getCategoryComparison(parsed.catASlug!, parsed.catBSlug!, parsed.citySlug!);
  if (!data) notFound();
  return <CategoryComparisonView data={data} />;
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Compare", href: "/directory/compare" },
          { label: `${cityA.name} vs ${cityB.name}` },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GitCompareArrows className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Healthcare in {cityA.name} vs {cityB.name}: Provider Comparison
          </h1>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            According to the UAE Open Healthcare Directory, {cityA.name} has{" "}
            {statsA.totalProviders.toLocaleString()} licensed healthcare
            providers while {cityB.name} has{" "}
            {statsB.totalProviders.toLocaleString()}. Healthcare in {cityA.name}{" "}
            is regulated by the {statsA.regulator}, while {cityB.name} is
            regulated by the {statsB.regulator}. GP consultations cost{" "}
            {statsA.gpFeeRange} in {cityA.name} compared to {statsB.gpFeeRange}{" "}
            in {cityB.name}. Both cities require employer-provided health
            insurance for residents. Below is a detailed side-by-side comparison
            of provider counts, average ratings, costs, and top-rated facilities.
            Data sourced from official government registers and Google Maps,
            verified March 2026.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Side-by-Side Comparison</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-black/[0.06] text-sm">
            <thead>
              <tr className="bg-[#1c1c1c] text-white">
                <th className="text-left py-3 px-4 font-bold">Metric</th>
                <th className="text-left py-3 px-4 font-bold">{cityA.name}</th>
                <th className="text-left py-3 px-4 font-bold">{cityB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Total Providers</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.totalProviders.toLocaleString()}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.totalProviders.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Average Rating</td>
                <td className="py-3 px-4">
                  {statsA.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828] fill-accent" />
                      {statsA.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsA.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {statsB.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828] fill-accent" />
                      {statsB.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsB.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Hospitals</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.hospitalCount}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.hospitalCount}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Clinics</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.clinicCount}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.clinicCount}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Dental Clinics</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.dentalCount}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.dentalCount}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Pharmacies</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.pharmacyCount}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.pharmacyCount}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">GP Consultation</td>
                <td className="py-3 px-4">{statsA.gpFeeRange}</td>
                <td className="py-3 px-4">{statsB.gpFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Specialist Consultation</td>
                <td className="py-3 px-4">{statsA.specialistFeeRange}</td>
                <td className="py-3 px-4">{statsB.specialistFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Emergency Visit</td>
                <td className="py-3 px-4">{statsA.emergencyFeeRange}</td>
                <td className="py-3 px-4">{statsB.emergencyFeeRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Regulator</td>
                <td className="py-3 px-4 text-xs">{statsA.regulator}</td>
                <td className="py-3 px-4 text-xs">{statsB.regulator}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Providers */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top-Rated Providers</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { city: cityA, stats: statsA },
            { city: cityB, stats: statsB },
          ].map(({ city, stats }) => (
            <div key={city.slug}>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#006828]" />
                {city.name}
              </h3>
              {stats.topProviders.length > 0 ? (
                <div className="space-y-0">
                  {stats.topProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-2 border-b border-black/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#006828]/40 font-['Geist',sans-serif] w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-[#1c1c1c]">{p.name}</span>
                      </div>
                      {Number(p.rating) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#006828] fill-accent" />
                          <span className="text-xs font-bold text-[#006828]">{p.rating}</span>
                          <span className="text-[10px] text-black/40">({p.reviewCount.toLocaleString()})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/40">No rated providers yet.</p>
              )}
              <Link href={`/directory/${city.slug}`} className="text-xs font-medium text-[#006828] hover:underline mt-2 inline-block">
                Browse all {city.name} providers &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Insurance */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance Coverage</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">{cityA.name}</h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">{statsA.insuranceNote}</p>
          </div>
          <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">{cityB.name}</h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">{statsB.insuranceNote}</p>
          </div>
        </div>
      </div>

      {/* Related comparisons */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">More City Comparisons</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[cityA.slug, cityB.slug].flatMap((currentSlug) => {
            const name = currentSlug === cityA.slug ? cityA.name : cityB.name;
            return ["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "al-ain"]
              .filter((s) => s !== cityA.slug && s !== cityB.slug)
              .map((other) => {
                const pair = currentSlug < other ? `${currentSlug}-vs-${other}` : `${other}-vs-${currentSlug}`;
                const otherName = other === "abu-dhabi" ? "Abu Dhabi" : other === "ras-al-khaimah" ? "Ras Al Khaimah" : other === "al-ain" ? "Al Ain" : other.charAt(0).toUpperCase() + other.slice(1);
                return (
                  <Link key={`${currentSlug}-${pair}`} href={`/directory/compare/${pair}`} className="text-xs border border-black/[0.06] px-3 py-1.5 hover:border-[#006828]/15 hover:text-[#006828] transition-colors">
                    {name} vs {otherName}
                  </Link>
                );
              });
          })}
        </div>
      </div>

      <div className="mt-12">
        <FaqSection faqs={faqs} title={`${cityA.name} vs ${cityB.name} Healthcare FAQ`} />
      </div>

      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Provider counts and ratings are based on data from official UAE health authority registers (DHA, DOH, MOHAP) and Google Maps, last verified March 2026. Consultation fees are indicative ranges and may vary by provider, insurance status, and visit complexity. This comparison is for informational purposes only and does not constitute medical advice.
        </p>
      </div>
    </div>
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Compare", href: "/directory/compare" },
          { label: `${categoryA.name} vs ${categoryB.name} in ${cityName}` },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GitCompareArrows className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {categoryA.name} vs {categoryB.name} in {cityName}: Comparison
          </h1>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
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

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Side-by-Side Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border border-black/[0.06] text-sm">
            <thead>
              <tr className="bg-[#1c1c1c] text-white">
                <th className="text-left py-3 px-4 font-bold">Metric</th>
                <th className="text-left py-3 px-4 font-bold"><Building2 className="inline w-4 h-4 mr-1" />{categoryA.name}</th>
                <th className="text-left py-3 px-4 font-bold"><Stethoscope className="inline w-4 h-4 mr-1" />{categoryB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Total Providers in {cityName}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsA.totalProviders.toLocaleString()}</td>
                <td className="py-3 px-4 font-['Geist',sans-serif]">{statsB.totalProviders.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Average Rating</td>
                <td className="py-3 px-4">
                  {statsA.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828] fill-accent" />{statsA.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsA.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {statsB.avgRating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#006828] fill-accent" />{statsB.avgRating.toFixed(1)}
                      <span className="text-black/40 text-xs">({statsB.ratedProviderCount} rated)</span>
                    </span>
                  ) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Consultation Cost</td>
                <td className="py-3 px-4">{statsA.priceRange}</td>
                <td className="py-3 px-4">{statsB.priceRange}</td>
              </tr>
              <tr className="border-b border-black/[0.06] bg-[#f8f8f6]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Best For</td>
                <td className="py-3 px-4 text-xs">Emergencies, inpatient surgery, complex diagnostics, multi-specialty care</td>
                <td className="py-3 px-4 text-xs">Routine GP visits, specialist outpatient consultations, minor procedures, vaccinations</td>
              </tr>
              <tr className="border-b border-black/[0.06]">
                <td className="py-3 px-4 font-medium text-[#1c1c1c]">Typical Wait Time</td>
                <td className="py-3 px-4 text-xs">ER: immediate triage; outpatient: 1-7 days</td>
                <td className="py-3 px-4 text-xs">Walk-in: 15-45 min; specialist: 1-3 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Providers per Category */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Top-Rated Providers</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { cat: categoryA, stats: statsA, Icon: Building2 },
            { cat: categoryB, stats: statsB, Icon: Stethoscope },
          ].map(({ cat, stats, Icon }) => (
            <div key={cat.slug}>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#006828]" />
                {cat.name} in {cityName}
              </h3>
              {stats.topProviders.length > 0 ? (
                <div className="space-y-0">
                  {stats.topProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-2 border-b border-black/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#006828]/40 font-['Geist',sans-serif] w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-[#1c1c1c]">{p.name}</span>
                      </div>
                      {Number(p.rating) > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#006828] fill-accent" />
                          <span className="text-xs font-bold text-[#006828]">{p.rating}</span>
                          <span className="text-[10px] text-black/40">({p.reviewCount.toLocaleString()})</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Geist',sans-serif] text-sm text-black/40">No rated providers yet.</p>
              )}
              <Link href={`/directory/${citySlug}/${cat.slug}`} className="text-xs font-medium text-[#006828] hover:underline mt-2 inline-block">
                Browse all {cat.name.toLowerCase()} in {cityName} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* More comparisons */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">More Comparisons</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {["dubai", "abu-dhabi", "sharjah", "ajman", "ras-al-khaimah", "al-ain"]
            .filter((s) => s !== citySlug)
            .map((s) => {
              const name = s === "abu-dhabi" ? "Abu Dhabi" : s === "ras-al-khaimah" ? "Ras Al Khaimah" : s === "al-ain" ? "Al Ain" : s.charAt(0).toUpperCase() + s.slice(1);
              return (
                <Link key={s} href={`/directory/compare/hospitals-vs-clinics-${s}`} className="text-xs border border-black/[0.06] px-3 py-1.5 hover:border-[#006828]/15 hover:text-[#006828] transition-colors">
                  Hospitals vs Clinics in {name}
                </Link>
              );
            })}
        </div>
      </div>

      <div className="mt-12">
        <FaqSection faqs={faqs} title={`${categoryA.name} vs ${categoryB.name} in ${cityName} FAQ`} />
      </div>

      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Provider counts, ratings, and cost estimates are based on data from official UAE health authority registers (DHA, DOH, MOHAP) and Google Maps, last verified March 2026. Consultation fees are indicative ranges. This comparison is for informational purposes only and does not constitute medical advice.
        </p>
      </div>
    </div>
  );
}
