import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PROCEDURE_CATEGORIES,
  getProceduresByCategory,
  getProcedureCategoryBySlug,
  formatAed,
} from "@/lib/pricing";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return PROCEDURE_CATEGORIES.map((c) => ({ category: c.slug }));
}

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  if (!cat) return {};

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug);
  const minPrice = procs.reduce((m, p) => Math.min(m, p.priceRange.min), Infinity);
  const maxPrice = procs.reduce((m, p) => Math.max(m, p.priceRange.max), 0);

  return {
    title: `${cat.name} Costs in the UAE — ${formatAed(minPrice)} to ${formatAed(maxPrice)} | Compare ${procs.length} Procedures`,
    description: `How much do ${cat.name.toLowerCase()} cost in the UAE? Compare ${procs.length} procedures from ${formatAed(minPrice)} to ${formatAed(maxPrice)} across Dubai, Abu Dhabi, Sharjah, and all emirates. Insurance coverage details and out-of-pocket estimates.`,
    alternates: { canonical: `${base}/pricing/category/${catSlug}` },
    openGraph: {
      title: `${cat.name} Costs in the UAE — Compare ${procs.length} Procedures`,
      description: `Compare ${procs.length} ${cat.name.toLowerCase()} prices across 8 UAE cities.`,
      url: `${base}/pricing/category/${catSlug}`,
      type: "website",
    },
  };
}

export default async function CategoryPricingPage({ params }: Props) {
  const { category: catSlug } = await params;
  const cat = getProcedureCategoryBySlug(catSlug);
  if (!cat) notFound();

  const base = getBaseUrl();
  const procs = getProceduresByCategory(catSlug);
  if (procs.length === 0) notFound();

  // City averages for this category
  const cityStats = CITIES.map((city) => {
    const cityProcs = procs.filter((p) => p.cityPricing[city.slug]);
    const typicals = cityProcs.map((p) => p.cityPricing[city.slug].typical);
    return {
      slug: city.slug,
      name: city.name,
      avg: typicals.length > 0 ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length) : 0,
      count: cityProcs.length,
    };
  }).sort((a, b) => a.avg - b.avg);

  const faqs = [
    {
      question: `How much do ${cat.name.toLowerCase()} cost in the UAE?`,
      answer: `${cat.name} in the UAE range from ${formatAed(procs.reduce((m, p) => Math.min(m, p.priceRange.min), Infinity))} to ${formatAed(procs.reduce((m, p) => Math.max(m, p.priceRange.max), 0))}. We compare ${procs.length} procedures across 8 UAE cities. ${cityStats[0]?.name || "Northern emirates"} offers the lowest average prices, while ${cityStats[cityStats.length - 1]?.name || "Dubai"} is the most expensive.`,
    },
    {
      question: `Which UAE city is cheapest for ${cat.name.toLowerCase()}?`,
      answer: `${cityStats[0]?.name || "Northern emirates"} has the lowest average ${cat.name.toLowerCase()} costs at ${formatAed(cityStats[0]?.avg || 0)}, followed by ${cityStats[1]?.name || ""} at ${formatAed(cityStats[1]?.avg || 0)}. The most expensive city is ${cityStats[cityStats.length - 1]?.name || "Dubai"} at ${formatAed(cityStats[cityStats.length - 1]?.avg || 0)}.`,
    },
    {
      question: `Does insurance cover ${cat.name.toLowerCase()} in the UAE?`,
      answer: `Coverage varies by procedure. ${procs.filter((p) => p.insuranceCoverage === "typically-covered").length} of ${procs.length} ${cat.name.toLowerCase()} are typically covered by insurance. ${procs.filter((p) => p.insuranceCoverage === "not-covered").length} are classified as cosmetic and not covered. Check individual procedure pages for specific coverage details.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: cat.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: cat.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl sm:font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          {cat.name} Costs in the UAE
        </h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Compare prices for {procs.length} {cat.name.toLowerCase()} across Dubai,
            Abu Dhabi, Sharjah, and all UAE emirates. {cat.description}. Pricing based on
            DOH Mandatory Tariff methodology and market-observed data.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">{procs.length}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Procedures</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">8</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Cities compared</p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {procs.filter((p) => p.insuranceCoverage === "typically-covered").length}/{procs.length}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Insured</p>
          </div>
        </div>
      </div>

      {/* All procedures in this category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{cat.name} — All Procedures</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {procs.map((proc) => {
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
              href={`/pricing/${proc.slug}`}
              className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                  {proc.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5" />
              </div>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
                {proc.description.slice(0, 100)}...
              </p>
              <div className="flex items-center justify-between">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {coverageLabel}
                </span>
              </div>
              <div className="mt-2 flex gap-1 text-[10px] text-black/40">
                <span>{proc.duration}</span>
                <span>·</span>
                <span className="capitalize">{proc.setting}</span>
                <span>·</span>
                <span>{proc.recoveryTime} recovery</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* City comparison for this category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{cat.name} Prices by City</h2>
      </div>
      <div className="border border-black/[0.06] divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-3 gap-4 p-3 bg-[#f8f8f6] text-[11px] font-bold text-black/40 uppercase tracking-wider">
          <div>City</div>
          <div className="text-right">Avg. Typical Cost</div>
          <div className="text-right">Procedures</div>
        </div>
        {cityStats.map((c) => (
          <Link
            key={c.slug}
            href={`/pricing/category/${catSlug}/${c.slug}`}
            className="grid grid-cols-3 gap-4 p-3 hover:bg-[#f8f8f6] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-black/40" />
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828]">
                {c.name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{formatAed(c.avg)}</span>
            </div>
            <div className="text-right flex items-center justify-end gap-1">
              <span className="font-['Geist',sans-serif] text-xs text-black/40">{c.count} priced</span>
              <ArrowRight className="w-3 h-3 text-black/40 group-hover:text-[#006828]" />
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${cat.name} in the UAE — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative ranges based on the DOH
          Mandatory Tariff (Shafafiya), DHA DRG parameters, and market-observed data as of
          March 2026. Actual costs vary by facility, doctor, and insurance plan.
        </p>
      </div>
    </div>
  );
}
