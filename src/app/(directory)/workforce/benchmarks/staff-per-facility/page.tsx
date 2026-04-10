import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getFacilitySizeDistribution,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Facility Size Distribution Dubai — Staff per Facility Analysis",
    description: `How large are Dubai's healthcare facilities? Size distribution analysis of ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities — from mega-hospitals (500+ staff) to micro-clinics (<5 staff). Median, average, and tier breakdown.`,
    alternates: {
      canonical: `${base}/workforce/benchmarks/staff-per-facility`,
    },
    openGraph: {
      title:
        "Healthcare Facility Size Distribution Dubai — Staff per Facility Analysis",
      description: `Size tier analysis of ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} Dubai healthcare facilities.`,
      url: `${base}/workforce/benchmarks/staff-per-facility`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function StaffPerFacilityPage() {
  const base = getBaseUrl();
  const dist = getFacilitySizeDistribution();

  const tiers = [
    {
      label: "Mega",
      description: "500+ licensed staff",
      count: dist.mega,
      pct: ((dist.mega / dist.total) * 100).toFixed(1),
      examples: "Major government and private hospitals",
    },
    {
      label: "Large",
      description: "100-499 licensed staff",
      count: dist.large,
      pct: ((dist.large / dist.total) * 100).toFixed(1),
      examples: "Multi-specialty hospitals and large clinics",
    },
    {
      label: "Mid-Size",
      description: "20-99 licensed staff",
      count: dist.mid,
      pct: ((dist.mid / dist.total) * 100).toFixed(1),
      examples: "Specialty centers and polyclinics",
    },
    {
      label: "Small",
      description: "5-19 licensed staff",
      count: dist.small,
      pct: ((dist.small / dist.total) * 100).toFixed(1),
      examples: "Neighborhood clinics and dental practices",
    },
    {
      label: "Micro",
      description: "Fewer than 5 licensed staff",
      count: dist.micro,
      pct: ((dist.micro / dist.total) * 100).toFixed(1),
      examples: "Solo practices and specialized outlets",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Facility Size Distribution — Dubai",
          description: `Size tier analysis of ${dist.total.toLocaleString()} Dubai healthcare facilities.`,
          url: `${base}/workforce/benchmarks/staff-per-facility`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Benchmarks", url: `${base}/workforce/benchmarks` },
          { name: "Staff per Facility" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Benchmarks", href: "/workforce/benchmarks" },
          { label: "Staff per Facility" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Staffing Benchmark
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Facility Size Distribution — Dubai Healthcare
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {dist.total.toLocaleString()} Facilities &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            How large are Dubai&apos;s healthcare facilities? This analysis
            breaks down {dist.total.toLocaleString()} facilities into five size
            tiers based on their DHA-licensed staff count. The median facility
            has {dist.medianStaff} licensed staff, while the average is{" "}
            {dist.averageStaff} — a gap that reflects the long tail of small
            clinics alongside a handful of mega-hospitals.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: dist.total.toLocaleString(),
            label: "Total Facilities",
          },
          {
            value: dist.medianStaff.toString(),
            label: "Median Staff per Facility",
          },
          {
            value: dist.averageStaff.toString(),
            label: "Average Staff per Facility",
          },
          {
            value: dist.mega.toString(),
            label: "Mega-Hospitals (500+)",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Size Tier Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Size Tier Breakdown
        </h2>
      </div>

      {/* Visual Bar Chart */}
      <div className="mb-8">
        {tiers.map((tier) => (
          <div key={tier.label} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {tier.label}
                </span>
                <span className="font-['Geist',sans-serif] text-xs text-black/40 ml-2">
                  {tier.description}
                </span>
              </div>
              <div className="text-right">
                <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {tier.count.toLocaleString()}
                </span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40 ml-2">
                  ({tier.pct}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-black/[0.04] h-3">
              <div
                className="bg-[#006828] h-3"
                style={{
                  width: `${Math.max(parseFloat(tier.pct), 1)}%`,
                }}
              />
            </div>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/30 mt-1">
              {tier.examples}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Summary Table
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Tier
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Staff Range
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facilities
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                    {tier.label}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {tier.description}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {tier.count.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {tier.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Distribution Analysis
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Dubai&apos;s healthcare market is heavily skewed toward small and micro
          facilities. While {dist.mega} mega-hospitals and {dist.large} large
          facilities account for the majority of licensed staff, the vast
          majority of facilities ({dist.small + dist.micro} of {dist.total},
          or{" "}
          {(((dist.small + dist.micro) / dist.total) * 100).toFixed(0)}%)
          are small or micro operations with fewer than 20 licensed staff.
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          The median of {dist.medianStaff} staff versus the average of{" "}
          {dist.averageStaff} staff demonstrates this skew — a few large
          employers pull the average significantly above the median. This
          pattern is typical of healthcare markets where a handful of
          tertiary hospitals serve as major employers while thousands of
          outpatient clinics operate with lean teams.
        </p>
      </div>

      {/* Related Benchmarks */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Other Benchmarks
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/workforce/benchmarks/nurse-to-doctor"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Nurse-to-Doctor Ratio
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Facility-level staffing ratios with WHO benchmark comparison
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Specialist per Capita
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Per-100K population rates for every specialty
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            FTL Rate Analysis
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Independent practice license prevalence by specialty and area
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Facility counts include all facilities with at least 1 DHA-licensed
          professional. Staff counts reflect licensed professionals only and do
          not include administrative or support staff. Verify credentials
          directly with DHA.
        </p>
      </div>
    </div>
  );
}
