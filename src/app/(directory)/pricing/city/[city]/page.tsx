import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { ProcedureSearch } from "@/components/pricing/ProcedureSearch";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return CITIES.map((c) => ({ city: c.slug }));
}

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return {};

  const base = getBaseUrl();
  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[citySlug]);
  const cheapest = procsInCity.reduce(
    (min, p) => Math.min(min, p.cityPricing[citySlug]?.min ?? Infinity),
    Infinity
  );
  const mostExpensive = procsInCity.reduce(
    (max, p) => Math.max(max, p.cityPricing[citySlug]?.max ?? 0),
    0
  );

  return {
    title: `Medical Procedure Costs in ${city.name} — ${formatAed(cheapest)} to ${formatAed(mostExpensive)} | UAE Medical Pricing`,
    description: `Compare ${procsInCity.length} medical procedure prices in ${city.name}, UAE. From GP consultations (${formatAed(cheapest)}) to joint replacements (${formatAed(mostExpensive)}). Insurance coverage, out-of-pocket estimates, and provider directories. Based on DOH/DHA tariff data.`,
    alternates: { canonical: `${base}/pricing/city/${citySlug}` },
    openGraph: {
      title: `Medical Procedure Costs in ${city.name} — Compare All Prices`,
      description: `${procsInCity.length} medical procedures priced in ${city.name}. Compare costs, check insurance coverage, find providers.`,
      url: `${base}/pricing/city/${citySlug}`,
      type: "website",
    },
  };
}

export default async function CityPricingHubPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const base = getBaseUrl();
  const procsInCity = PROCEDURES.filter((p) => p.cityPricing[citySlug])
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const regulator =
    citySlug === "dubai"
      ? "Dubai Health Authority (DHA)"
      : citySlug === "abu-dhabi" || citySlug === "al-ain"
      ? "Department of Health Abu Dhabi (DOH)"
      : "Ministry of Health and Prevention (MOHAP)";

  // Price stats for this city
  const typicals = procsInCity.map((p) => p.cityPricing[citySlug].typical);
  const avgTypical = Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length);

  // Compare with other cities
  const cityAvgs = CITIES.map((c) => {
    const procs = PROCEDURES.filter((p) => p.cityPricing[c.slug]);
    const typs = procs.map((p) => p.cityPricing[c.slug].typical);
    return {
      slug: c.slug,
      name: c.name,
      avg: typs.length > 0 ? Math.round(typs.reduce((a, b) => a + b, 0) / typs.length) : 0,
      count: procs.length,
    };
  }).sort((a, b) => a.avg - b.avg);

  const searchData = procsInCity.map((p) => ({
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    categorySlug: p.categorySlug,
    priceRange: { min: p.cityPricing[citySlug].min, max: p.cityPricing[citySlug].max },
    insuranceCoverage: p.insuranceCoverage,
  }));

  const faqs = [
    {
      question: `How much do medical procedures cost in ${city.name}?`,
      answer: `Medical procedure costs in ${city.name} range from ${formatAed(procsInCity.reduce((m, p) => Math.min(m, p.cityPricing[citySlug].min), Infinity))} for basic tests to ${formatAed(procsInCity.reduce((m, p) => Math.max(m, p.cityPricing[citySlug].max), 0))} for major surgery. The average typical cost across ${procsInCity.length} procedures is ${formatAed(avgTypical)}. Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
    {
      question: `Is ${city.name} more expensive than other UAE cities for medical care?`,
      answer: `${city.name} ranks #${cityAvgs.findIndex((c) => c.slug === citySlug) + 1} out of ${cityAvgs.length} UAE cities by average procedure cost (${ cityAvgs[0].name} is cheapest, ${cityAvgs[cityAvgs.length - 1].name} is most expensive). The average typical procedure cost in ${city.name} is ${formatAed(avgTypical)}.`,
    },
    {
      question: `Does insurance cover medical procedures in ${city.name}?`,
      answer: `Health insurance is mandatory for all UAE residents since January 2025. Most medically necessary procedures are covered with co-pays of 0–20%. Cosmetic procedures are generally not covered. Coverage and co-pay rates depend on your specific plan tier (basic, enhanced, or premium).`,
    },
    {
      question: `Where can I find cheap medical care in ${city.name}?`,
      answer: `Government hospitals and basic private clinics in ${city.name} typically offer the lowest prices. Compare providers in the UAE Open Healthcare Directory to find competitive rates. Always confirm the price directly with the facility before booking.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: city.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: city.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-8 h-8 text-[#006828]" />
          <h1 className="text-2xl sm:font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Medical Procedure Costs in {city.name}
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Compare prices for {procsInCity.length} medical procedures in {city.name}, UAE.
            Average typical cost: {formatAed(avgTypical)}. Healthcare in {city.name} is
            regulated by the {regulator}. Pricing based on {citySlug === "abu-dhabi" || citySlug === "al-ain" ? "DOH Mandatory Tariff (Shafafiya)" : citySlug === "dubai" ? "DHA DRG parameters" : "MOHAP guidelines"} and
            market-observed data.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: procsInCity.length.toString(), label: "Procedures priced" },
            { value: formatAed(avgTypical), label: "Avg. typical cost" },
            { value: `#${cityAvgs.findIndex((c) => c.slug === citySlug) + 1} of ${cityAvgs.length}`, label: "Cost ranking" },
            { value: regulator.split("(")[1]?.replace(")", "") || regulator, label: "Regulator" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-lg font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Search Procedures in {city.name}</h2>
        </div>
        <ProcedureSearch procedures={searchData} />
      </div>

      {/* City comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{city.name} vs Other Emirates</h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        {cityAvgs.map((c) => {
          const isCurrent = c.slug === citySlug;
          const diff = c.avg - avgTypical;
          const pctDiff = avgTypical > 0 ? Math.round((diff / avgTypical) * 100) : 0;
          return (
            <div
              key={c.slug}
              className={`grid grid-cols-3 gap-4 p-3 ${isCurrent ? "bg-[#006828]/5 border-l-2 border-[#006828]" : "hover:bg-[#f8f8f6]"}`}
            >
              {isCurrent ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#006828]" />
                  <span className="text-sm font-bold text-[#006828]">{c.name}</span>
                </div>
              ) : (
                <Link
                  href={`/pricing/city/${c.slug}`}
                  className="flex items-center gap-2 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-black/40" />
                  <span className="text-sm text-[#1c1c1c] group-hover:text-[#006828]">{c.name}</span>
                </Link>
              )}
              <div className="text-right">
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(c.avg)}
                </span>
                <span className="text-[10px] text-black/40 ml-1">avg</span>
              </div>
              <div className="text-right">
                {isCurrent ? (
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">Current</span>
                ) : (
                  <span className={`text-xs font-medium ${diff < 0 ? "text-green-700" : diff > 0 ? "text-red-700" : "text-black/40"}`}>
                    {diff < 0 ? `${pctDiff}%` : diff > 0 ? `+${pctDiff}%` : "Same"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Procedures by category */}
      {PROCEDURE_CATEGORIES.map((cat) => {
        const categoryMap: Record<string, string[]> = {
          diagnostics: ["radiology-imaging", "labs-diagnostics"],
          dental: ["dental"],
          "eye-care": ["ophthalmology"],
          surgical: ["hospitals", "gastroenterology"],
          orthopedic: ["orthopedics"],
          maternity: ["ob-gyn", "fertility-ivf"],
          cosmetic: ["cosmetic-plastic", "dermatology"],
          cardiac: ["cardiology"],
          wellness: ["clinics"],
          therapy: ["physiotherapy", "mental-health"],
        };
        const catProcs = procsInCity
          .filter((p) => (categoryMap[cat.slug] || []).includes(p.categorySlug))
          .sort((a, b) => (a.cityPricing[citySlug]?.typical ?? 0) - (b.cityPricing[citySlug]?.typical ?? 0));

        if (catProcs.length === 0) return null;

        return (
          <div key={cat.slug} className="mb-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                <Link href={`/pricing/category/${cat.slug}/${citySlug}`} className="hover:text-[#006828]">
                  {cat.name} in {city.name}
                </Link>
              </h2>
            </div>
            <div className="border border-black/[0.06] divide-y divide-light-200">
              {catProcs.map((proc) => {
                const pricing = proc.cityPricing[citySlug];
                const coverageColor =
                  proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
                  : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
                  : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
                  : "text-red-700 bg-red-50";
                const coverageLabel =
                  proc.insuranceCoverage === "typically-covered" ? "Covered"
                  : proc.insuranceCoverage === "partially-covered" ? "Partial"
                  : proc.insuranceCoverage === "rarely-covered" ? "Rare"
                  : "Not covered";

                return (
                  <Link
                    key={proc.slug}
                    href={`/pricing/${proc.slug}/${citySlug}`}
                    className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] truncate">
                        {proc.name}
                      </h3>
                      <p className="text-[11px] text-black/40">{proc.duration}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-[10px] font-medium px-2 py-0.5 hidden sm:inline ${coverageColor}`}>
                        {coverageLabel}
                      </span>
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {formatAed(pricing.typical)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`Medical Costs in ${city.name} — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {city.name} are indicative ranges based on
          {citySlug === "abu-dhabi" || citySlug === "al-ain" ? " DOH Mandatory Tariff (Shafafiya) methodology" : citySlug === "dubai" ? " DHA DRG parameters" : " MOHAP guidelines"} and
          market-observed data as of March 2026. Actual costs vary by facility, doctor,
          and insurance plan. Healthcare in {city.name} is regulated by the {regulator}.
        </p>
      </div>
    </div>
  );
}
