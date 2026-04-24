import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getProfessionalsByAreaAndCategory,
  getAreaStats,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string; category: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const areas = getAreaStats().filter((a) => a.count >= 10);
  const params: { area: string; category: string }[] = [];
  for (const area of areas) {
    for (const cat of PROFESSIONAL_CATEGORIES) {
      const pros = getProfessionalsByAreaAndCategory(area.slug, cat.slug);
      if (pros.length >= 10) {
        params.push({ area: area.slug, category: cat.slug });
      }
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!areaInfo || !catInfo) return {};

  const pros = getProfessionalsByAreaAndCategory(params.area, params.category);
  const base = getBaseUrl();

  return {
    title: `${catInfo.name} in ${areaInfo.name}, Dubai — ${pros.length.toLocaleString()} Professionals`,
    description: `${pros.length.toLocaleString()} DHA-licensed ${catInfo.name.toLowerCase()} in ${areaInfo.name}, Dubai. Workforce analysis including specialty breakdown, top facilities, and license distribution.`,
    alternates: { canonical: `${base}/workforce/area/${areaInfo.slug}/${catInfo.slug}` },
    openGraph: {
      title: `${catInfo.name} in ${areaInfo.name}, Dubai`,
      description: `${pros.length.toLocaleString()} ${catInfo.name.toLowerCase()} practicing in ${areaInfo.name}.`,
      url: `${base}/workforce/area/${areaInfo.slug}/${catInfo.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function AreaCategoryPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const catInfo = PROFESSIONAL_CATEGORIES.find((c) => c.slug === params.category);
  if (!areaInfo || !catInfo) notFound();

  const pros = getProfessionalsByAreaAndCategory(params.area, params.category);
  if (pros.length === 0) notFound();

  const base = getBaseUrl();

  // Specialty breakdown
  const specCounts: Record<string, number> = {};
  for (const p of pros) {
    if (p.specialtySlug) specCounts[p.specialtySlug] = (specCounts[p.specialtySlug] || 0) + 1;
  }
  const topSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([slug, count]) => {
      const spec = getSpecialtyBySlug(slug);
      return { slug, name: spec?.name || slug, count };
    });

  // Facility breakdown
  const facCounts: Record<string, { name: string; count: number }> = {};
  for (const p of pros) {
    if (!p.facilitySlug) continue;
    if (!facCounts[p.facilitySlug]) facCounts[p.facilitySlug] = { name: p.facilityName, count: 0 };
    facCounts[p.facilitySlug].count++;
  }
  const topFacilities = Object.entries(facCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, { name, count }]) => ({ slug, name, count }));

  // License
  const ftl = pros.filter((p) => p.licenseType === "FTL").length;
  const ftlPct = pros.length > 0 ? Math.round((ftl / pros.length) * 100) : 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: areaInfo.name, url: `${base}/workforce/area/${areaInfo.slug}` },
          { name: catInfo.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: areaInfo.name, href: `/workforce/area/${areaInfo.slug}` },
          { label: catInfo.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {catInfo.name} in {areaInfo.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {pros.length.toLocaleString()} DHA-Licensed Professionals &middot; {areaInfo.name}, Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            There are {pros.length.toLocaleString()} DHA-licensed{" "}
            {catInfo.name.toLowerCase()} practicing in {areaInfo.name}, Dubai.
            {topSpecialties.length > 0 && (
              <> The most common specialties are {topSpecialties.slice(0, 3).map((s) => s.name.toLowerCase()).join(", ")}.</>
            )}
            {" "}The FTL rate is {ftlPct}%.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{pros.length.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Total {catInfo.name.toLowerCase()}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{topSpecialties.length}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Specialties</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{ftlPct}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">FTL rate</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{topFacilities.length}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Facilities</p>
        </div>
      </div>

      {/* Specialties */}
      {topSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Specialties
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Specialty</th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Count</th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {topSpecialties.map((spec) => (
                  <tr key={spec.slug} className="border-b border-black/[0.06]">
                    <td className="py-2.5 pr-4">
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {spec.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{spec.count.toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {((spec.count / pros.length) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities
        </h2>
      </div>
      <div className="mb-12">
        {topFacilities.map((fac, i) => (
          <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
            <Link
              href={`/professionals/facility/${fac.slug}`}
              className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
            >
              {i + 1}. {fac.name}
            </Link>
            <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
              {fac.count} {catInfo.name.toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/workforce/area/${areaInfo.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Full {areaInfo.name} workforce profile &rarr;
        </Link>
        <Link href={`/professionals/${catInfo.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          All {catInfo.name.toLowerCase()} in Dubai &rarr;
        </Link>
        <Link href={`/workforce/career/category/${catInfo.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          {catInfo.name} career overview &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This page is for informational purposes only.
        </p>
      </div>
    </div>
  );
}
