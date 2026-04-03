import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  ALL_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const count = ALL_SPECIALTIES.filter((s) => s.count >= 10).length;
  return {
    title: `All ${count} Medical Specialties in Dubai Ranked by Size | Zavis`,
    description: `Every DHA-tracked medical specialty in Dubai ranked by licensed professional count. From General Practitioners (${ALL_SPECIALTIES[0]?.count.toLocaleString()}) to niche subspecialties. Per-capita rates and category breakdown.`,
    alternates: { canonical: `${base}/workforce/rankings/largest-specialties` },
    openGraph: {
      title: `All ${count} Medical Specialties in Dubai Ranked by Size`,
      description: `Complete specialty ranking for Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals.`,
      url: `${base}/workforce/rankings/largest-specialties`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

const DUBAI_POPULATION = 3_660_000;

export default function LargestSpecialtiesPage() {
  const base = getBaseUrl();
  const specialties = [...ALL_SPECIALTIES]
    .filter((s) => s.count >= 10)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "All Medical Specialties in Dubai Ranked by Size",
          description: `${specialties.length} medical specialties ranked by DHA-licensed professional count.`,
          url: `${base}/workforce/rankings/largest-specialties`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Rankings", url: `${base}/workforce/rankings` },
          { name: "Largest Specialties" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Rankings", href: "/workforce/rankings" },
          { label: "Largest Specialties" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Specialty Rankings
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          All Medical Specialties in Dubai — Ranked by Size
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {specialties.length} Specialties &middot;{" "}
          {PROFESSIONAL_STATS.total.toLocaleString()} Total Professionals
          &middot; Data as of {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Every medical specialty tracked by the DHA Sheryan Registry, ranked
            by the number of licensed professionals. This table covers all four
            workforce categories — physicians, dentists, nurses, and allied
            health — with per-capita rates based on Dubai&apos;s estimated
            population of {DUBAI_POPULATION.toLocaleString()}.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const catSpecs = specialties.filter((s) => s.category === cat.slug);
          return (
            <div key={cat.slug} className="bg-[#f8f8f6] p-4 text-center">
              <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
                {catSpecs.length}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
                {cat.name} Specialties
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Specialties Ranked
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
                Specialty
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Category
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Count
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden md:table-cell">
                Per 100K
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find(
                (c) => c.slug === spec.category
              );
              const pct = (
                (spec.count / PROFESSIONAL_STATS.total) *
                100
              ).toFixed(1);
              const per100K = (
                (spec.count / DUBAI_POPULATION) *
                100000
              ).toFixed(1);
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/specialty/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell">
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">
                      {cat?.name || spec.category}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right hidden md:table-cell">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {per100K}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Related Analysis
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Specialist Per Capita
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Specialists per 100,000 population with WHO comparisons
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            FTL Rate by Specialty
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Independent practice license rates across all specialties
          </p>
        </Link>
        <Link
          href="/workforce/rankings/top-employers"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Top 50 Employers
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Largest healthcare facilities ranked by staff count
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Specialties with fewer than 10 licensed professionals are excluded.
          Population estimate: {DUBAI_POPULATION.toLocaleString()} (Dubai
          Statistics Center). Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
