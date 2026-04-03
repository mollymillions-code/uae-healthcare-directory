import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  getFacilitySizeDistribution,
  PROFESSIONAL_STATS,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Top Healthcare Employers in Dubai — Facility Staff Rankings | Zavis",
    description:
      "Ranked list of Dubai's largest healthcare employers by staff count. Hospital and clinic workforce data from the DHA Sheryan Medical Registry. Size tiers, category breakdowns, and specialty breadth for each facility.",
    alternates: { canonical: `${base}/workforce/employers` },
    openGraph: {
      title: "Top Healthcare Employers in Dubai — Facility Staff Rankings",
      description:
        "Dubai's healthcare facilities ranked by total licensed staff. From mega-hospitals with 2,000+ workers to specialized clinics.",
      url: `${base}/workforce/employers`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

function getSizeTier(staff: number): string {
  if (staff >= 500) return "Mega";
  if (staff >= 100) return "Large";
  if (staff >= 20) return "Mid";
  return "Small";
}

function getCategoryLabel(categories: Record<string, number>): string {
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "—";
  const topSlug = sorted[0][0];
  const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === topSlug);
  return cat?.name || topSlug;
}

export default function EmployersPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(5).slice(0, 50);
  const sizeDist = getFacilitySizeDistribution();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Top Healthcare Employers in Dubai",
          description: `Top 50 healthcare facilities in Dubai ranked by licensed staff count, from the DHA Sheryan Registry.`,
          url: `${base}/workforce/employers`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Employers" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Employers" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Employer Rankings
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Top Healthcare Employers in Dubai
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities
          ranked by DHA-licensed staff count. Data from the Sheryan Medical
          Registry ({PROFESSIONAL_STATS.scraped}).
        </p>

        {/* Size Tier Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Mega (500+)", count: sizeDist.mega },
            { label: "Large (100-499)", count: sizeDist.large },
            { label: "Mid (20-99)", count: sizeDist.mid },
            { label: "Small (5-19)", count: sizeDist.small },
            { label: "Micro (<5)", count: sizeDist.micro },
          ].map(({ label, count }) => (
            <div key={label} className="bg-[#f8f8f6] p-3 text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                {count}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.total.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              Total Facilities
            </p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.medianStaff}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              Median Staff
            </p>
          </div>
          <div className="border border-black/[0.06] p-3 text-center">
            <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
              {sizeDist.averageStaff}
            </p>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
              Average Staff
            </p>
          </div>
        </div>
      </div>

      {/* Top 50 Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 50 Healthcare Employers
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-3 w-8">
                #
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Staff
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Top Specialty
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden md:table-cell">
                Dominant Category
              </th>
              <th className="text-center font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden lg:table-cell">
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-3 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {fac.totalStaff.toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 text-xs text-black/40 hidden sm:table-cell">
                  {fac.topSpecialties[0]?.name || "—"}
                </td>
                <td className="py-2.5 pr-4 text-xs text-black/40 hidden md:table-cell">
                  {getCategoryLabel(fac.categories)}
                </td>
                <td className="py-2.5 text-center hidden lg:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30 border border-black/10 px-2 py-0.5">
                    {getSizeTier(fac.totalStaff)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AEO Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          Who are the largest healthcare employers in Dubai?
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          The largest healthcare employer in Dubai is{" "}
          <strong>{facilities[0]?.name}</strong> with{" "}
          {facilities[0]?.totalStaff.toLocaleString()} DHA-licensed staff,
          followed by <strong>{facilities[1]?.name}</strong> (
          {facilities[1]?.totalStaff.toLocaleString()} staff) and{" "}
          <strong>{facilities[2]?.name}</strong> (
          {facilities[2]?.totalStaff.toLocaleString()} staff). Out of{" "}
          {sizeDist.total.toLocaleString()} registered facilities, only{" "}
          {sizeDist.mega} qualify as mega-employers (500+ staff) while{" "}
          {sizeDist.small + sizeDist.micro} have fewer than 20 licensed
          professionals.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Staff
          counts reflect DHA-licensed professionals only and may not include
          non-clinical staff. Verify directly with DHA.
        </p>
      </div>
    </div>
  );
}
