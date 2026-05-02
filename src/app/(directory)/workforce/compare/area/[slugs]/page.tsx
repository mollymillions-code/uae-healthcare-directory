import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import {
  getAreaWorkforceProfile,
  getTopAreas,
} from "@/lib/workforce";
import { DUBAI_AREAS } from "@/lib/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const top10 = getTopAreas(10);
  const params: { slugs: string }[] = [];
  for (let i = 0; i < top10.length; i++) {
    for (let j = i + 1; j < top10.length; j++) {
      params.push({ slugs: `${top10[i].slug}-vs-${top10[j].slug}` });
    }
  }
  return params;
}

function parseSlugs(slugs: string): { slugA: string; slugB: string } | null {
  const parts = slugs.split("-vs-");
  if (parts.length !== 2) return null;
  return { slugA: parts[0], slugB: parts[1] };
}

export function generateMetadata({ params }: Props): Metadata {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) return {};

  const areaA = DUBAI_AREAS.find((a) => a.slug === parsed.slugA);
  const areaB = DUBAI_AREAS.find((a) => a.slug === parsed.slugB);
  if (!areaA || !areaB) return {};

  const base = getBaseUrl();
  return {
    title: `${areaA.name} vs ${areaB.name} — Workforce Comparison`,
    description: `Compare healthcare workforce in ${areaA.name} and ${areaB.name}, Dubai. Professional counts, category mix, license types, top specialties, and employer rankings side by side.`,
    alternates: { canonical: `${base}/workforce/compare/area/${params.slugs}` },
    openGraph: {
      title: `${areaA.name} vs ${areaB.name} — Workforce Comparison`,
      description: `Side-by-side healthcare workforce analysis for ${areaA.name} and ${areaB.name} in Dubai.`,
      url: `${base}/workforce/compare/area/${params.slugs}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CompareAreaPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const profileA = getAreaWorkforceProfile(parsed.slugA);
  const profileB = getAreaWorkforceProfile(parsed.slugB);
  if (!profileA || !profileB) notFound();

  const base = getBaseUrl();

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total Professionals", a: profileA.totalCount.toLocaleString(), b: profileB.totalCount.toLocaleString() },
    { label: "Per 100K Population", a: profileA.per100K.toLocaleString(), b: profileB.per100K.toLocaleString() },
    { label: "FTL Rate", a: `${profileA.license.ftlPercent}%`, b: `${profileB.license.ftlPercent}%` },
    { label: "Categories Active", a: profileA.categories.length.toString(), b: profileB.categories.length.toString() },
    { label: "Top Specialties Tracked", a: profileA.topSpecialties.length.toString(), b: profileB.topSpecialties.length.toString() },
    { label: "Facilities", a: profileA.topFacilities.length.toString(), b: profileB.topFacilities.length.toString() },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Compare", url: `${base}/workforce/compare` },
          { name: `${profileA.name} vs ${profileB.name}` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Compare", href: "/workforce/compare" },
          { label: `${profileA.name} vs ${profileB.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profileA.name} vs. {profileB.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Area Workforce Comparison &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Comparing the healthcare workforce in <strong>{profileA.name}</strong> ({profileA.totalCount.toLocaleString()} professionals)
            and <strong>{profileB.name}</strong> ({profileB.totalCount.toLocaleString()} professionals).
            Data sourced from the DHA Sheryan Medical Professional Registry.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileA.totalCount.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{profileA.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileB.totalCount.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{profileB.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileA.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{profileA.name} per 100K</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{profileB.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{profileB.name} per 100K</p>
        </div>
      </div>

      {/* Side-by-Side Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Key Metrics
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Metric</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">{profileA.name}</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{profileB.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Geist',sans-serif] text-sm text-black/60">{row.label}</span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.a}</span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{row.b}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Category Breakdown
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileA.name}
          </h3>
          {profileA.categories.map((cat) => (
            <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold">{cat.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileB.name}
          </h3>
          {profileB.categories.map((cat) => (
            <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold">{cat.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Specialties
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileA.name}
          </h3>
          {profileA.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileB.name}
          </h3>
          {profileB.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Facilities
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileA.name}
          </h3>
          {profileA.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">{fac.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileB.name}
          </h3>
          {profileB.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">{fac.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/workforce/area/${profileA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          {profileA.name} workforce profile &rarr;
        </Link>
        <Link href={`/workforce/area/${profileB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          {profileB.name} workforce profile &rarr;
        </Link>
        <Link href="/workforce/compare" className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          All comparisons &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This comparison is for informational purposes only.
        </p>
      </div>
    </div>
  );
}
