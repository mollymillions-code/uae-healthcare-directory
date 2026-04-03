import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getSpecialistPerCapita,
  getFTLRateBySpecialty,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  getSpecialtiesByCategory,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Healthcare Specialties in Dubai — Workforce Size Rankings | Zavis",
    description: `All ${ALL_SPECIALTIES.length} tracked healthcare specialties in Dubai ranked by workforce size. Per-capita rates, FTL license penetration, and category breakdowns from the DHA Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/workforce/specialties` },
    openGraph: {
      title: "Healthcare Specialties in Dubai — Workforce Size Rankings",
      description: `${ALL_SPECIALTIES.length} medical specialties ranked by number of licensed professionals. Per-capita analysis and license type distribution.`,
      url: `${base}/workforce/specialties`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SpecialtiesPage() {
  const base = getBaseUrl();
  const perCapita = getSpecialistPerCapita();
  const ftlRates = getFTLRateBySpecialty();

  // Build lookup maps for per-capita and FTL
  const perCapitaMap = new Map(perCapita.map((s) => [s.slug, s.per100K]));
  const ftlMap = new Map(ftlRates.map((s) => [s.slug, s.ftlRate]));

  // Sort all specialties by count descending
  const ranked = [...ALL_SPECIALTIES].sort((a, b) => b.count - a.count);

  // Category groups
  const categories = [
    {
      slug: "physicians",
      name: "Physicians & Doctors",
      count: PHYSICIAN_SPECIALTIES.length,
      total: PROFESSIONAL_STATS.physicians,
    },
    {
      slug: "dentists",
      name: "Dentists",
      count: DENTIST_SPECIALTIES.length,
      total: PROFESSIONAL_STATS.dentists,
    },
    {
      slug: "nurses",
      name: "Nurses & Midwives",
      count: getSpecialtiesByCategory("nurses").length,
      total: PROFESSIONAL_STATS.nurses,
    },
    {
      slug: "allied-health",
      name: "Allied Health",
      count: getSpecialtiesByCategory("allied-health").length,
      total: PROFESSIONAL_STATS.alliedHealth,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Healthcare Specialties in Dubai — Workforce Rankings",
          description: `${ALL_SPECIALTIES.length} healthcare specialties ranked by workforce size in Dubai.`,
          url: `${base}/workforce/specialties`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Specialties" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Specialties" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Specialty Analysis
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Healthcare Specialties in Dubai
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6">
          {ALL_SPECIALTIES.length} specialties across 4 professional categories,
          ranked by number of DHA-licensed practitioners.
        </p>

        {/* Category Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {categories.map((cat) => (
            <div key={cat.slug} className="bg-[#f8f8f6] p-4">
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-1">
                {cat.name}
              </p>
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828]">
                {cat.count} specialties
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {cat.total.toLocaleString()} professionals
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Ranked Table — by Category */}
      {PROFESSIONAL_CATEGORIES.map((cat) => {
        const catSpecs = ranked.filter((s) => s.category === cat.slug);
        if (catSpecs.length === 0) return null;

        // Calculate rank offset (global rank)
        let globalRank = 0;
        return (
          <div key={cat.slug} className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
                {cat.name}
              </h2>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium">
                {catSpecs.length} specialties
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-3 w-8">
                      #
                    </th>
                    <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                      Specialty
                    </th>
                    <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                      Count
                    </th>
                    <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                      Per 100K
                    </th>
                    <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                      FTL Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catSpecs.map((spec) => {
                    globalRank++;
                    return (
                      <tr
                        key={spec.slug}
                        className="border-b border-black/[0.06]"
                      >
                        <td className="py-2.5 pr-3 font-['Geist_Mono',monospace] text-xs text-black/30">
                          {globalRank}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/workforce/specialty/${spec.slug}`}
                            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                          >
                            {spec.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm text-black/40 hidden sm:table-cell">
                          {perCapitaMap.get(spec.slug) ?? "—"}
                        </td>
                        <td className="py-2.5 text-right font-['Geist_Mono',monospace] text-sm text-black/40 hidden md:table-cell">
                          {ftlMap.has(spec.slug)
                            ? `${ftlMap.get(spec.slug)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* AEO Block */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
          What are the most common medical specialties in Dubai?
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          The largest healthcare specialties in Dubai by licensed workforce are{" "}
          <strong>{ranked[0]?.name}</strong> (
          {ranked[0]?.count.toLocaleString()}),{" "}
          <strong>{ranked[1]?.name}</strong> (
          {ranked[1]?.count.toLocaleString()}), and{" "}
          <strong>{ranked[2]?.name}</strong> (
          {ranked[2]?.count.toLocaleString()}). Across{" "}
          {ALL_SPECIALTIES.length} tracked specialties, the physician category
          alone has {PHYSICIAN_SPECIALTIES.length} sub-specialties while
          dentistry has {DENTIST_SPECIALTIES.length}.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Specialty counts reflect licensed professionals only. Per 100K rates
          use estimated Dubai population of 3,660,000. Verify credentials
          directly with DHA.
        </p>
      </div>
    </div>
  );
}
