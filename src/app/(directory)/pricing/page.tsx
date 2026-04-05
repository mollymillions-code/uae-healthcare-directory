import { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ArrowRight, Search, TrendingDown, Shield } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { ProcedureSearch } from "@/components/pricing/ProcedureSearch";
import {
  PROCEDURES,
  PROCEDURE_CATEGORIES,
  formatAed,
} from "@/lib/pricing";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { PageEvent } from "@/components/analytics/PageEvent";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "UAE Medical Procedure Costs — Compare Prices Across Dubai, Abu Dhabi & All Emirates | UAE Open Healthcare Directory",
    description:
      "How much does an MRI, dental implant, or knee replacement cost in the UAE? Compare medical procedure prices across Dubai, Abu Dhabi, Sharjah, and all emirates. Estimate your out-of-pocket cost with our insurance calculator. Pricing based on DOH Mandatory Tariff data.",
    alternates: { canonical: `${base}/pricing` },
    openGraph: {
      title: "UAE Medical Procedure Costs — Compare Prices Across All Emirates",
      description:
        "Compare 40+ medical procedure prices across 8 UAE cities. Based on official DOH tariff data. Includes insurance cost estimator.",
      url: `${base}/pricing`,
      type: "website",
    },
  };
}

export default function PricingPage() {
  const base = getBaseUrl();

  // Stats
  const procedureCount = PROCEDURES.length;
  const categoryCount = PROCEDURE_CATEGORIES.length;

  // For search component — pass only what the client needs
  const searchData = PROCEDURES.map((p) => ({
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    categorySlug: p.categorySlug,
    priceRange: p.priceRange,
    insuranceCoverage: p.insuranceCoverage,
  }));

  // Popular procedures (top 12 by sort order)
  const popular = PROCEDURES.slice(0, 12);

  const faqs = [
    {
      question: "How much do medical procedures cost in the UAE?",
      answer:
        "Medical procedure costs in the UAE vary significantly by city, facility type, and complexity. Dubai is generally the most expensive, followed by Abu Dhabi, while Sharjah and the northern emirates offer lower rates. Prices in Abu Dhabi are governed by the DOH Mandatory Tariff (Shafafiya), which sets base rates that facilities can multiply by 1x to 3x. A GP consultation ranges from AED 100–500, an MRI from AED 800–5,000, and a knee replacement from AED 30,000–100,000.",
    },
    {
      question: "Are medical procedures covered by insurance in the UAE?",
      answer:
        "Health insurance is mandatory across all seven UAE emirates as of January 2025. Most medically necessary procedures (diagnostics, surgeries, emergency care) are covered, with co-pays of 0–20% depending on the plan tier. Cosmetic procedures (rhinoplasty, Botox, hair transplant) are generally not covered. Dental coverage depends on the plan — basic plans exclude dental, while enhanced and premium plans include it with annual sub-limits.",
    },
    {
      question: "Why are medical costs different across UAE cities?",
      answer:
        "Each emirate has its own health authority and pricing framework. Abu Dhabi uses the DOH Mandatory Tariff (based on US Medicare RVU rates converted to AED), while Dubai uses DRG-based billing for inpatients and market-driven pricing for outpatients. The northern emirates (Sharjah, Ajman, RAK, Fujairah, UAQ) under MOHAP have lower operating costs and rents, which translates to lower procedure prices.",
    },
    {
      question: "How accurate are the prices shown on this page?",
      answer:
        "Prices are indicative ranges based on the DOH Mandatory Tariff methodology, DHA DRG parameters, and market-observed data as of March 2026. Actual costs depend on the specific facility, doctor, clinical complexity, and your insurance plan. Always confirm the quote directly with the provider before proceeding.",
    },
    {
      question: "What is the DOH Mandatory Tariff (Shafafiya)?",
      answer:
        "The DOH Mandatory Tariff is the official pricelist published by the Department of Health Abu Dhabi under its Shafafiya (transparency) programme. It sets base prices for every medical procedure using CPT and HCPCS codes, calculated as a percentage of US Medicare rates converted to AED at 3.672. Providers can negotiate multipliers of 1x to 3x these base rates with insurance companies.",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "UAE Medical Procedure Costs",
          description:
            "Compare medical procedure prices across all UAE emirates with insurance cost estimation.",
          url: `${base}/pricing`,
          isPartOf: { "@type": "WebSite", name: "UAE Open Healthcare Directory", url: base },
          about: {
            "@type": "MedicalCondition",
            name: "Healthcare Cost Transparency in the UAE",
          },
        }}
      />

      <PageEvent event="pricing_page_view" />
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            UAE Medical Procedure Costs
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Compare prices for {procedureCount} medical procedures across Dubai, Abu Dhabi,
            Sharjah, and all UAE emirates. Pricing based on the DOH Mandatory Tariff
            (Shafafiya) methodology and market-observed data. Use our insurance calculator
            to estimate your out-of-pocket cost.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: procedureCount.toString(), label: "Procedures priced" },
            { value: categoryCount.toString(), label: "Categories" },
            { value: "8", label: "UAE cities compared" },
            { value: "85+", label: "Insurance plans mapped" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Search Procedures</h2>
        </div>
        <ProcedureSearch procedures={searchData} />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Browse by Category</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
        {PROCEDURE_CATEGORIES.map((cat) => {
          const count = PROCEDURES.filter((p) => {
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
            return (categoryMap[cat.slug] || []).includes(p.categorySlug);
          }).length;

          return (
            <Link
              key={cat.slug}
              href={`/pricing#${cat.slug}`}
              className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-black/40">
                {count} procedure{count !== 1 ? "s" : ""}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Popular Procedures */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Most Searched Procedures</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {popular.map((proc) => {
          const coverageColor =
            proc.insuranceCoverage === "typically-covered"
              ? "text-green-700 bg-green-50"
              : proc.insuranceCoverage === "partially-covered"
              ? "text-yellow-700 bg-yellow-50"
              : proc.insuranceCoverage === "rarely-covered"
              ? "text-orange-700 bg-orange-50"
              : "text-red-700 bg-red-50";

          const coverageLabel =
            proc.insuranceCoverage === "typically-covered"
              ? "Covered"
              : proc.insuranceCoverage === "partially-covered"
              ? "Partial"
              : proc.insuranceCoverage === "rarely-covered"
              ? "Rare"
              : "Not covered";

          return (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}`}
              className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {proc.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5" />
              </div>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3 line-clamp-2">
                {proc.description.slice(0, 120)}...
              </p>
              <div className="flex items-center justify-between">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {coverageLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* All Procedures by Category */}
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
        const catProcs = PROCEDURES.filter((p) =>
          (categoryMap[cat.slug] || []).includes(p.categorySlug)
        ).sort((a, b) => a.sortOrder - b.sortOrder);

        if (catProcs.length === 0) return null;

        return (
          <div key={cat.slug} id={cat.slug} className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{cat.name}</h2>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">{cat.description}</p>
            <div className="border border-black/[0.06] divide-y divide-light-200">
              {catProcs.map((proc) => (
                <Link
                  key={proc.slug}
                  href={`/pricing/${proc.slug}`}
                  className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                        {proc.name}
                      </h3>
                      {proc.cptCode && (
                        <span className="text-[9px] text-black/40 font-['Geist',sans-serif] hidden sm:inline">
                          CPT {proc.cptCode}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/40">
                      {proc.duration} · {proc.setting} · {proc.recoveryTime} recovery
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                      {formatAed(proc.priceRange.min)} – {formatAed(proc.priceRange.max)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Key Insights (AEO content) */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-4">
          UAE Medical Pricing — Key Facts
        </h2>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 space-y-3" data-answer-block="true">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">Cheapest emirate:</strong> Northern emirates
              (Sharjah, Ajman, UAQ) consistently offer the lowest medical procedure prices,
              often 30–40% less than Dubai for the same procedure.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">Abu Dhabi pricing:</strong> Governed by the DOH
              Mandatory Tariff (Shafafiya) — base rates derived from US Medicare rates ×
              3.672 AED/USD, with facility-negotiated multipliers of 1x–3x.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">Insurance since Jan 2025:</strong> Health
              insurance is mandatory for all UAE residents across all seven emirates. Most
              medically necessary procedures are covered with 0–20% co-pay.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-[#006828] flex-shrink-0 mt-0.5" />
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              <strong className="text-[#1c1c1c]">Price variation:</strong> The same procedure can
              cost 2–3x more at a premium hospital versus a government or basic private
              facility. Always compare multiple providers.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="UAE Medical Pricing — Frequently Asked Questions"
      />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges based on the
          DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and
          market-observed data as of March 2026. Actual costs vary by facility, doctor,
          clinical complexity, and insurance plan. This tool is for informational purposes
          only and does not constitute medical or financial advice. Always obtain a
          personalised quote from the healthcare provider before proceeding with any
          procedure. Data cross-referenced with the UAE Open Healthcare Directory.
        </p>
      </div>
    </div>
  );
}
