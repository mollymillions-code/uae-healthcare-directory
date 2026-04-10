import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAreaStats,
  getAreaWorkforceProfile,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Workforce by Area in Dubai — Geographic Distribution",
    description:
      "Geographic distribution of healthcare professionals across Dubai's neighborhoods and medical districts. Area-level workforce counts, specialty concentrations, and staffing density from the DHA Sheryan Registry.",
    alternates: { canonical: `${base}/workforce/areas` },
    openGraph: {
      title:
        "Healthcare Workforce by Area in Dubai — Geographic Distribution",
      description:
        "Where Dubai's healthcare professionals are concentrated. Area-by-area workforce analysis from the DHA Sheryan Registry.",
      url: `${base}/workforce/areas`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function AreasPage() {
  const base = getBaseUrl();
  const areas = getAreaStats();

  // Build category breakdowns for each area
  const areaProfiles = areas.map((area) => {
    const profile = getAreaWorkforceProfile(area.slug);
    const physicians =
      profile?.categories.find((c) => c.slug === "physicians")?.count || 0;
    const nurses =
      profile?.categories.find((c) => c.slug === "nurses")?.count || 0;
    return {
      ...area,
      physicians,
      nurses,
    };
  });

  const totalMapped = areas.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Workforce by Area in Dubai",
          description: `Geographic distribution of healthcare professionals across ${areas.length} mapped areas in Dubai.`,
          url: `${base}/workforce/areas`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Areas" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Areas" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Geographic Distribution
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Healthcare Workforce by Area
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {areas.length} areas with 10+ healthcare professionals mapped from
          facility addresses. Covers{" "}
          {totalMapped.toLocaleString()} professionals ({Math.round((totalMapped / PROFESSIONAL_STATS.total) * 100)}% of
          the total workforce).
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {areas.length}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Mapped Areas
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {areas[0]?.name || "—"}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Largest Cluster ({areas[0]?.count.toLocaleString()})
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {totalMapped.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Professionals Mapped
            </p>
          </div>
        </div>
      </div>

      {/* Areas Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Areas Ranked by Workforce Size
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Area
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Total
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Physicians
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Nurses
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                Top Specialty
              </th>
            </tr>
          </thead>
          <tbody>
            {areaProfiles.map((area) => {
              const barWidth = areas[0]
                ? Math.round((area.count / areas[0].count) * 100)
                : 0;
              return (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {area.name}
                    </Link>
                    <div className="h-1 bg-[#f8f8f6] mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#006828]/30"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.count.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                    {area.physicians.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                    {area.nurses.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-xs text-black/40 hidden md:table-cell">
                    {area.topSpecialties[0]?.name || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AEO Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          Where are healthcare professionals concentrated in Dubai?
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          Healthcare professionals in Dubai are most concentrated in{" "}
          <strong>{areas[0]?.name}</strong> ({areas[0]?.count.toLocaleString()}{" "}
          professionals), followed by{" "}
          <strong>{areas[1]?.name}</strong> ({areas[1]?.count.toLocaleString()})
          and <strong>{areas[2]?.name}</strong> (
          {areas[2]?.count.toLocaleString()}). The top 3 areas account for{" "}
          {Math.round(
            ((areas[0]?.count + areas[1]?.count + areas[2]?.count) /
              totalMapped) *
              100
          )}
          % of all geo-mapped healthcare professionals, reflecting the
          dominance of Dubai Healthcare City and major hospital clusters.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Area
          assignment is based on facility name matching and may not capture all
          professionals. Not all facilities can be geo-mapped to a specific area.
          Verify with DHA.
        </p>
      </div>
    </div>
  );
}
