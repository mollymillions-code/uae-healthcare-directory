import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllFacilities,
  PROFESSIONAL_STATS,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Top 50 Healthcare Employers in Dubai by Staff Count",
    description: `The 50 largest healthcare employers in Dubai ranked by DHA-licensed staff count. From Rashid Hospital to private clinics — total staff, top specialty, and workforce profiles for each facility.`,
    alternates: { canonical: `${base}/workforce/rankings/top-employers` },
    openGraph: {
      title: "Top 50 Healthcare Employers in Dubai by Staff Count",
      description: `Dubai's largest healthcare employers ranked. ${PROFESSIONAL_STATS.total.toLocaleString()} professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities.`,
      url: `${base}/workforce/rankings/top-employers`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function TopEmployersPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(1).slice(0, 50);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Top 50 Healthcare Employers in Dubai",
          description: `The 50 largest healthcare employers in Dubai by DHA-licensed staff count.`,
          url: `${base}/workforce/rankings/top-employers`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Rankings", url: `${base}/workforce/rankings` },
          { name: "Top 50 Employers" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Rankings", href: "/workforce/rankings" },
          { label: "Top 50 Employers" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Employer Rankings
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Top 50 Healthcare Employers in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Ranked by Total Licensed Staff &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            The 50 largest healthcare employers in Dubai, ranked by the number of
            DHA-licensed professionals on staff. Click any facility to view its
            full workforce profile including category breakdown, top specialties,
            and staffing benchmarks.
          </p>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="flex flex-wrap gap-3 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/workforce/rankings/top-employers/${cat.slug}`}
            className="border border-black/[0.06] px-4 py-2 hover:border-[#006828]/15 transition-colors group"
          >
            <span className="font-['Geist',sans-serif] text-xs text-black/60 group-hover:text-[#006828] transition-colors">
              Top {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Ranked by Total Staff
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                #
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Total Staff
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Top Specialty
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                Specialties
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
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
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.totalStaff.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden sm:table-cell">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {fac.topSpecialties[0]?.name || "--"}
                    {fac.topSpecialties[0]
                      ? ` (${fac.topSpecialties[0].count})`
                      : ""}
                  </span>
                </td>
                <td className="py-2.5 text-right hidden md:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {Object.keys(fac.specialties).length}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Staff
          counts reflect DHA-licensed professionals only and may not include
          administrative or support staff. Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
