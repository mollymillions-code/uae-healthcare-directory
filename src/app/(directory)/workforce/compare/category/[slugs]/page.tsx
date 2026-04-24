import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PROFESSIONAL_CATEGORIES, PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import { getCategoryWorkforceProfile } from "@/lib/workforce";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slugs: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cats = PROFESSIONAL_CATEGORIES;
  const params: { slugs: string }[] = [];
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      params.push({ slugs: `${cats[i].slug}-vs-${cats[j].slug}` });
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

  const catA = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugA);
  const catB = PROFESSIONAL_CATEGORIES.find((c) => c.slug === parsed.slugB);
  if (!catA || !catB) return {};

  const base = getBaseUrl();
  return {
    title: `${catA.name} vs ${catB.name} — Category Workforce Comparison`,
    description: `Compare ${catA.name} (${catA.count.toLocaleString()}) and ${catB.name} (${catB.count.toLocaleString()}) in Dubai. Per-capita rates, licensing, top employers, specialties, and geographic distribution.`,
    alternates: { canonical: `${base}/workforce/compare/category/${params.slugs}` },
    openGraph: {
      title: `${catA.name} vs ${catB.name} — Category Workforce Comparison`,
      description: `Side-by-side analysis of ${catA.name.toLowerCase()} and ${catB.name.toLowerCase()} in Dubai.`,
      url: `${base}/workforce/compare/category/${params.slugs}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CompareCategoryPage({ params }: Props) {
  const parsed = parseSlugs(params.slugs);
  if (!parsed) notFound();

  const profileA = getCategoryWorkforceProfile(parsed.slugA);
  const profileB = getCategoryWorkforceProfile(parsed.slugB);
  if (!profileA || !profileB) notFound();

  const base = getBaseUrl();

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total Professionals", a: profileA.totalCount.toLocaleString(), b: profileB.totalCount.toLocaleString() },
    { label: "% of Total Workforce", a: `${profileA.percentOfWorkforce}%`, b: `${profileB.percentOfWorkforce}%` },
    { label: "Per 100K Population", a: profileA.per100K.toLocaleString(), b: profileB.per100K.toLocaleString() },
    { label: "FTL Rate", a: `${profileA.license.ftlPercent}%`, b: `${profileB.license.ftlPercent}%` },
    { label: "REG Rate", a: `${profileA.license.regPercent}%`, b: `${profileB.license.regPercent}%` },
    { label: "Active Specialties", a: profileA.specialties.length.toString(), b: profileB.specialties.length.toString() },
    { label: "Areas with Coverage", a: profileA.areaDistribution.length.toString(), b: profileB.areaDistribution.length.toString() },
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
          Category Workforce Comparison &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Comparing <strong>{profileA.name}</strong> ({profileA.totalCount.toLocaleString()} professionals, {profileA.percentOfWorkforce}% of workforce)
            with <strong>{profileB.name}</strong> ({profileB.totalCount.toLocaleString()} professionals, {profileB.percentOfWorkforce}% of workforce)
            in Dubai&apos;s healthcare system.
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

      {/* Metrics Table */}
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

      {/* Top Employers */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Employers
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileA.name}
          </h3>
          {profileA.topEmployers.slice(0, 8).map((emp, i) => (
            <div key={emp.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${emp.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {emp.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">{emp.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileB.name}
          </h3>
          {profileB.topEmployers.slice(0, 8).map((emp, i) => (
            <div key={emp.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${emp.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {emp.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">{emp.count}</span>
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
          {profileA.specialties.slice(0, 10).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-4">
            {profileB.name}
          </h3>
          {profileB.specialties.slice(0, 10).map((spec) => (
            <div key={spec.slug} className="flex items-center justify-between py-2 border-b border-black/[0.06]">
              <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{spec.name}</span>
              <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{spec.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link href={`/professionals/${profileA.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Browse all {profileA.name.toLowerCase()} &rarr;
        </Link>
        <Link href={`/professionals/${profileB.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
          Browse all {profileB.name.toLowerCase()} &rarr;
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
