import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROCEDURE_COMPARISONS,
  COMPARISON_GROUPS,
  getComparisonsByGroup,
} from "@/lib/constants/procedure-comparisons";
import { getProcedureBySlug, formatAed } from "@/lib/constants/procedures";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Compare Medical Procedure Costs in the UAE — Side-by-Side Price Comparisons | UAE Open Healthcare Directory",
    description:
      "Should you get an MRI or CT scan? Dental implant or crown? Compare 15 common medical procedure pairs side-by-side with UAE pricing, insurance coverage, and expert guidance on when to choose each.",
    alternates: { canonical: `${base}/pricing/vs` },
    openGraph: {
      title: "Compare Medical Procedure Costs — UAE Side-by-Side Comparisons",
      description:
        "15 medical procedure comparisons with UAE pricing across 8 cities. MRI vs CT, implant vs crown, normal delivery vs C-section, and more.",
      url: `${base}/pricing/vs`,
      type: "website",
    },
  };
}

export default function ComparisonHubPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Compare Procedures" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Compare Procedures" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="w-8 h-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Compare Medical Procedure Costs in the UAE
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Should you get an MRI or CT scan? Dental implant or crown? Compare{" "}
            {PROCEDURE_COMPARISONS.length} common procedure pairs side-by-side
            with UAE pricing across 8 cities, insurance coverage details, and
            guidance on when to choose each option. All prices based on DOH
            Mandatory Tariff methodology and market data as of March 2026.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: PROCEDURE_COMPARISONS.length.toString(), label: "Procedure comparisons" },
            { value: COMPARISON_GROUPS.length.toString(), label: "Categories" },
            { value: "8", label: "UAE cities compared" },
            { value: (PROCEDURE_COMPARISONS.length * 8 + PROCEDURE_COMPARISONS.length).toString(), label: "Comparison pages" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparisons by Group */}
      {COMPARISON_GROUPS.map((group) => {
        const comparisons = getComparisonsByGroup(group.slug);
        if (comparisons.length === 0) return null;

        return (
          <div key={group.slug} className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{group.name}</h2>
            </div>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">{group.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisons.map((comp) => {
                const procA = getProcedureBySlug(comp.procedureASlug);
                const procB = getProcedureBySlug(comp.procedureBSlug);
                if (!procA || !procB) return null;

                const priceDiff = Math.abs(
                  procA.priceRange.min + procA.priceRange.max -
                  (procB.priceRange.min + procB.priceRange.max)
                ) / 2;

                const cheaperProc =
                  (procA.priceRange.min + procA.priceRange.max) / 2 <
                  (procB.priceRange.min + procB.priceRange.max) / 2
                    ? procA
                    : procB;

                return (
                  <Link
                    key={comp.slug}
                    href={`/pricing/vs/${comp.slug}`}
                    className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                        {comp.title}
                      </h3>
                      <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Price comparison badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] bg-[#f8f8f6] px-2 py-1 text-black/40">
                        {formatAed(procA.priceRange.min)}–{formatAed(procA.priceRange.max)}
                      </span>
                      <span className="text-[10px] text-black/40 font-medium">vs</span>
                      <span className="text-[11px] bg-[#f8f8f6] px-2 py-1 text-black/40">
                        {formatAed(procB.priceRange.min)}–{formatAed(procB.priceRange.max)}
                      </span>
                    </div>

                    <p className="text-[11px] text-black/40 mb-2 line-clamp-2">
                      {comp.description.slice(0, 120)}...
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#006828] font-medium">
                        {cheaperProc.name} is ~{formatAed(Math.round(priceDiff))} cheaper
                      </span>
                      <span className="text-[10px] text-black/40">
                        {comp.keyDifferences.length} differences
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* All Comparisons List */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">All Comparisons</h2>
        </div>
        <div className="border border-black/[0.06] divide-y divide-light-200">
          {PROCEDURE_COMPARISONS.sort((a, b) => a.sortOrder - b.sortOrder).map((comp) => {
            const procA = getProcedureBySlug(comp.procedureASlug);
            const procB = getProcedureBySlug(comp.procedureBSlug);
            if (!procA || !procB) return null;

            return (
              <Link
                key={comp.slug}
                href={`/pricing/vs/${comp.slug}`}
                className="flex items-center justify-between p-3 hover:bg-[#f8f8f6] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                    {comp.title}
                  </h3>
                  <p className="text-[11px] text-black/40">
                    {formatAed(procA.priceRange.min)}–{formatAed(procA.priceRange.max)} vs{" "}
                    {formatAed(procB.priceRange.min)}–{formatAed(procB.priceRange.max)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/40 group-hover:text-[#006828] flex-shrink-0 ml-4" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges based on the
          DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG parameters, and
          market-observed data as of March 2026. Actual costs vary by facility, doctor,
          clinical complexity, and insurance plan. This tool is for informational purposes
          only and does not constitute medical or financial advice. Always obtain a
          personalised quote from the healthcare provider before proceeding with any
          procedure.
        </p>
      </div>
    </div>
  );
}
