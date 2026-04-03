import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_STATS, PROFESSIONAL_CATEGORIES } from "@/lib/constants/professionals";
import {
  getFacilityBenchmarks,
  getTopFacilities,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top20 = getTopFacilities(20);
  const params: { slugs: string }[] = [];
  for (let i = 0; i < top20.length; i++) {
    for (let j = i + 1; j < top20.length; j++) {
      params.push({ slugs: `${top20[i].slug}-vs-${top20[j].slug}` });
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

  const benchA = getFacilityBenchmarks(parsed.slugA);
  const benchB = getFacilityBenchmarks(parsed.slugB);
  if (!benchA || !benchB) return {};

  const base = getBaseUrl();
  return {
    title: `${benchA.name} vs ${benchB.name} — Employer Workforce Comparison | Zavis`,
    description: `Compare ${benchA.name} (${benchA.totalStaff.toLocaleString()} staff) and ${benchB.name} (${benchB.totalStaff.toLocaleString()} staff) in Dubai. Staff size, nurse-to-doctor ratio, FTL rate, specialty breadth, and category mix.`,
    alternates: { canonical: `${base}/workforce/compare/employer/${params.slugs}` },
    openGraph: {
      title: `${benchA.name} vs ${benchB.name} — Employer Comparison`,
      description: `Side-by-side employer workforce analysis in Dubai.`,
      url: `${base}/workforce/compare/employer/${params.slugs}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

function sizeTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    mega: "Mega (500+ staff)",
    large: "Large (100-499)",
    mid: "Mid-size (20-99)",
    small: "Small (5-19)",
    micro: "Micro (<5)",
  };
  return labels[tier] || tier;
}

export default function CompareEmployerPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const benchA = getFacilityBenchmarks(parsed.slugA);
  const benchB = getFacilityBenchmarks(parsed.slugB);
  if (!benchA || !benchB) notFound();

  const base = getBaseUrl();

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total Staff", a: benchA.totalStaff.toLocaleString(), b: benchB.totalStaff.toLocaleString() },
    { label: "Size Tier", a: sizeTierLabel(benchA.sizeTier), b: sizeTierLabel(benchB.sizeTier) },
    { label: "Physicians", a: benchA.physicians.toLocaleString(), b: benchB.physicians.toLocaleString() },
    { label: "Dentists", a: benchA.dentists.toLocaleString(), b: benchB.dentists.toLocaleString() },
    { label: "Nurses", a: benchA.nurses.toLocaleString(), b: benchB.nurses.toLocaleString() },
    { label: "Allied Health", a: benchA.alliedHealth.toLocaleString(), b: benchB.alliedHealth.toLocaleString() },
    { label: "Nurse-to-Doctor Ratio", a: benchA.nurseToDoctorRatio.toFixed(2), b: benchB.nurseToDoctorRatio.toFixed(2) },
    { label: "FTL Rate", a: `${benchA.ftlRate}%`, b: `${benchB.ftlRate}%` },
    { label: "Specialty Breadth", a: `${benchA.specialtyBreadth} specialties`, b: `${benchB.specialtyBreadth} specialties` },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Compare", url: `${base}/workforce/compare` },
          { name: `${benchA.name} vs ${benchB.name}` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Compare", href: "/workforce/compare" },
          { label: `${benchA.name} vs ${benchB.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {benchA.name} vs. {benchB.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Employer Workforce Comparison &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Comparing <strong>{benchA.name}</strong> ({benchA.totalStaff.toLocaleString()} licensed staff)
            and <strong>{benchB.name}</strong> ({benchB.totalStaff.toLocaleString()} licensed staff).
            Metrics include staffing levels, nurse-to-doctor ratios, licensing patterns, and specialty coverage.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchA.totalStaff.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchA.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchB.totalStaff.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchB.name}</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchA.nurseToDoctorRatio.toFixed(2)}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchA.name} N:D ratio</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{benchB.nurseToDoctorRatio.toFixed(2)}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">{benchB.name} N:D ratio</p>
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
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">{benchA.name}</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{benchB.name}</th>
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

      {/* Category Composition */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Category Composition
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchA.name}
          </h3>
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const count = benchA.categories[cat.slug] || 0;
            if (count === 0) return null;
            const pct = benchA.totalStaff > 0 ? ((count / benchA.totalStaff) * 100).toFixed(1) : "0";
            return (
              <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
                <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{count.toLocaleString()} ({pct}%)</span>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchB.name}
          </h3>
          {PROFESSIONAL_CATEGORIES.map((cat) => {
            const count = benchB.categories[cat.slug] || 0;
            if (count === 0) return null;
            const pct = benchB.totalStaff > 0 ? ((count / benchB.totalStaff) * 100).toFixed(1) : "0";
            return (
              <div key={cat.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
                <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{cat.name}</span>
                <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{count.toLocaleString()} ({pct}%)</span>
              </div>
            );
          })}
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
            {benchA.name}
          </h3>
          {benchA.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {benchB.name}
          </h3>
          {benchB.topSpecialties.slice(0, 8).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/professionals/facility/${benchA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          {benchA.name} facility profile &rarr;
        </Link>
        <Link href={`/professionals/facility/${benchB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          {benchB.name} facility profile &rarr;
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
          This comparison is for informational purposes only and does not constitute
          employment advice.
        </p>
      </div>
    </div>
  );
}
