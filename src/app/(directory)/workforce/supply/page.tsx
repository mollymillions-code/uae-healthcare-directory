import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import {
  getSpecialtySupplyMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

function getSupplyAssessment(per100K: number): { label: string; color: string } {
  if (per100K >= 15) return { label: "Abundant", color: "text-[#006828]" };
  if (per100K >= 5) return { label: "Adequate", color: "text-[#006828]/70" };
  if (per100K >= 2) return { label: "Moderate", color: "text-amber-600" };
  return { label: "Limited", color: "text-red-600" };
}

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "Dubai Healthcare Supply Analysis — Specialty Adequacy Report",
    description: `Specialty supply analysis for Dubai's healthcare workforce. Per-capita rates, geographic coverage, employer concentration, and supply gaps across ${PHYSICIAN_SPECIALTIES.length} physician specialties. Sourced from DHA Sheryan Registry.`,
    alternates: { canonical: `${base}/workforce/supply` },
    openGraph: {
      title: "Dubai Healthcare Supply Analysis",
      description: `Specialty supply adequacy across ${PHYSICIAN_SPECIALTIES.length} physician specialties in Dubai.`,
      url: `${base}/workforce/supply`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SupplyHubPage() {
  const base = getBaseUrl();

  // Build supply table for all physician specialties
  const supplyData = PHYSICIAN_SPECIALTIES
    .map((spec) => {
      const metrics = getSpecialtySupplyMetrics(spec.slug);
      if (!metrics) return null;
      const assessment = getSupplyAssessment(metrics.per100K);
      return {
        slug: spec.slug,
        name: spec.name,
        count: metrics.totalCount,
        per100K: metrics.per100K,
        facilityCount: metrics.facilityCount,
        areasCovered: metrics.areasCovered,
        topFacilityShare: metrics.topFacilityShare,
        assessment,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => b.per100K - a.per100K);

  const abundant = supplyData.filter((d) => d.assessment.label === "Abundant").length;
  const adequate = supplyData.filter((d) => d.assessment.label === "Adequate").length;
  const moderate = supplyData.filter((d) => d.assessment.label === "Moderate").length;
  const limited = supplyData.filter((d) => d.assessment.label === "Limited").length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Supply Analysis" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Supply Analysis" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Healthcare Supply Analysis
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Specialty Adequacy Report &middot; {PHYSICIAN_SPECIALTIES.length} Physician Specialties &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            An analysis of physician specialty supply adequacy in Dubai, measuring
            per-capita rates, geographic coverage, facility availability, and employer
            concentration. Supply assessment categories are based on professionals per
            100,000 population: Abundant (15+), Adequate (5-14), Moderate (2-4), Limited (under 2).
          </p>
        </div>
      </div>

      {/* Supply Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{abundant}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Abundant supply</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]/70">{adequate}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Adequate supply</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{moderate}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Moderate supply</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{limited}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Limited supply</p>
        </div>
      </div>

      {/* Supply Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Physician Specialty Supply Overview
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Specialty
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Count
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Per 100K
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Facilities
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden md:table-cell">
                Areas
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden lg:table-cell">
                Top Facility %
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Assessment
              </th>
            </tr>
          </thead>
          <tbody>
            {supplyData.map((row) => (
              <tr key={row.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/supply/${row.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">{row.count.toLocaleString()}</span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.per100K}</span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.facilityCount}</span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.areasCovered}</span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{row.topFacilityShare}%</span>
                </td>
                <td className="py-2.5">
                  <span className={`font-['Geist_Mono',monospace] text-xs font-medium ${row.assessment.color}`}>
                    {row.assessment.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Methodology */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Methodology
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Supply assessments are based on the number of DHA-licensed professionals per 100,000
          population (estimated Dubai population: 3.66 million). Thresholds are:
        </p>
        <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-1 list-disc pl-5">
          <li><strong>Abundant</strong> (15+ per 100K) — strong supply, multiple provider options</li>
          <li><strong>Adequate</strong> (5-14 per 100K) — sufficient coverage for most needs</li>
          <li><strong>Moderate</strong> (2-4 per 100K) — potential access challenges in some areas</li>
          <li><strong>Limited</strong> (under 2 per 100K) — specialized care may require referral or travel</li>
        </ul>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href="/professionals/stats" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Full workforce statistics &rarr;
        </Link>
        <Link href="/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Compare specialties &rarr;
        </Link>
        <Link href="/professionals" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Professional directory &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Supply assessments are estimates based on per-capita rates and are for
          informational purposes only. Actual healthcare access depends on many factors
          beyond headcount.
        </p>
      </div>
    </div>
  );
}
