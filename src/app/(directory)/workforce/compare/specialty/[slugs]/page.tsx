import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PHYSICIAN_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getSpecialtyWorkforceMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  const top15 = [...PHYSICIAN_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const params: { slugs: string }[] = [];
  for (let i = 0; i < top15.length; i++) {
    for (let j = i + 1; j < top15.length; j++) {
      params.push({ slugs: `${top15[i].slug}-vs-${top15[j].slug}` });
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

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) return {};

  const base = getBaseUrl();
  return {
    title: `${specA.name} vs ${specB.name} — Workforce Comparison`,
    description: `Compare ${specA.name} (${specA.count.toLocaleString()}) and ${specB.name} (${specB.count.toLocaleString()}) workforce metrics in Dubai. Per-capita rates, FTL rates, consultant ratios, employer concentration, and geographic distribution.`,
    alternates: { canonical: `${base}/workforce/compare/specialty/${params.slugs}` },
    openGraph: {
      title: `${specA.name} vs ${specB.name} — Workforce Comparison`,
      description: `Side-by-side workforce analysis: ${specA.count.toLocaleString()} ${specA.name.toLowerCase()} vs ${specB.count.toLocaleString()} ${specB.name.toLowerCase()} in Dubai.`,
      url: `${base}/workforce/compare/specialty/${params.slugs}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CompareSpecialtyPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const specA = getSpecialtyBySlug(parsed.slugA);
  const specB = getSpecialtyBySlug(parsed.slugB);
  if (!specA || !specB) notFound();

  const metricsA = getSpecialtyWorkforceMetrics(parsed.slugA);
  const metricsB = getSpecialtyWorkforceMetrics(parsed.slugB);
  if (!metricsA || !metricsB) notFound();

  const base = getBaseUrl();

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total Professionals", a: metricsA.totalCount.toLocaleString(), b: metricsB.totalCount.toLocaleString() },
    { label: "Per 100K Population", a: metricsA.per100K.toLocaleString(), b: metricsB.per100K.toLocaleString() },
    { label: "FTL Rate", a: `${metricsA.license.ftlPercent}%`, b: `${metricsB.license.ftlPercent}%` },
    { label: "Consultant Ratio", a: `${metricsA.consultantRatio}%`, b: `${metricsB.consultantRatio}%` },
    { label: "Specialists", a: metricsA.specialists.toLocaleString(), b: metricsB.specialists.toLocaleString() },
    { label: "Consultants", a: metricsA.consultants.toLocaleString(), b: metricsB.consultants.toLocaleString() },
    { label: "Top 3 Area Concentration", a: `${metricsA.concentrationIndex}%`, b: `${metricsB.concentrationIndex}%` },
    { label: "Areas Covered", a: metricsA.areaDistribution.length.toString(), b: metricsB.areaDistribution.length.toString() },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Compare", url: `${base}/workforce/compare` },
          { name: `${specA.name} vs ${specB.name}` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Compare", href: "/workforce/compare" },
          { label: `${specA.name} vs ${specB.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {specA.name} vs. {specB.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Specialty Workforce Comparison &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            A data-driven comparison of <strong>{specA.name}</strong> ({metricsA.totalCount.toLocaleString()} professionals)
            and <strong>{specB.name}</strong> ({metricsB.totalCount.toLocaleString()} professionals)
            in Dubai&apos;s healthcare workforce. All data sourced from the DHA Sheryan Medical Professional Registry.
          </p>
        </div>
      </div>

      {/* Side-by-Side Metrics */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          At a Glance
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Metric
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                {specA.name}
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                {specB.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Geist',sans-serif] text-sm text-black/60">
                    {row.label}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {row.a}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {row.b}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Employers
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {specA.name}
          </h3>
          {metricsA.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
                {fac.count}
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {specB.name}
          </h3>
          {metricsB.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
                {fac.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Distribution
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {specA.name} — Top Areas
          </h3>
          {metricsA.areaDistribution.slice(0, 5).map((area) => (
            <div key={area.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/workforce/area/${area.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {area.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40 ml-2 shrink-0">
                {area.count}
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {specB.name} — Top Areas
          </h3>
          {metricsB.areaDistribution.slice(0, 5).map((area) => (
            <div key={area.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/workforce/area/${area.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {area.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40 ml-2 shrink-0">
                {area.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Explore Further
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specA.name}
          </h3>
          <div className="space-y-2">
            <Link href={`/professionals/${specA.category}/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Full directory ({metricsA.totalCount.toLocaleString()} professionals) &rarr;
            </Link>
            <Link href={`/workforce/career/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Career profile &rarr;
            </Link>
            <Link href={`/workforce/supply/${specA.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Supply analysis &rarr;
            </Link>
          </div>
        </div>
        <div className="border border-black/[0.06] p-5">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
            {specB.name}
          </h3>
          <div className="space-y-2">
            <Link href={`/professionals/${specB.category}/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Full directory ({metricsB.totalCount.toLocaleString()} professionals) &rarr;
            </Link>
            <Link href={`/workforce/career/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Career profile &rarr;
            </Link>
            <Link href={`/workforce/supply/${specB.slug}`} className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
              Supply analysis &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This comparison is for informational purposes only and does not constitute
          medical or employment advice.
        </p>
      </div>
    </div>
  );
}
