import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getSpecialistPerCapita,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  DUBAI_POPULATION,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Specialists per 100K Population Dubai — Per-Capita Healthcare Rates",
    description: `Per-capita specialist rates for Dubai: every medical specialty ranked by professionals per 100,000 population. WHO comparison benchmarks and category breakdowns across ${PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals.`,
    alternates: {
      canonical: `${base}/workforce/benchmarks/specialist-per-capita`,
    },
    openGraph: {
      title:
        "Specialists per 100K Population Dubai — Per-Capita Healthcare Rates",
      description: `How well-supplied is Dubai for each medical specialty? Per-capita rates for ${PROFESSIONAL_STATS.total.toLocaleString()} professionals.`,
      url: `${base}/workforce/benchmarks/specialist-per-capita`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SpecialistPerCapitaPage() {
  const base = getBaseUrl();
  const specialties = getSpecialistPerCapita();

  const totalPer100K = Math.round(
    (PROFESSIONAL_STATS.total / DUBAI_POPULATION) * 100000
  );
  const physiciansPer100K = Math.round(
    (PROFESSIONAL_STATS.physicians / DUBAI_POPULATION) * 100000
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Specialists per 100K Population — Dubai Healthcare",
          description: `Per-capita specialist rates for Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals.`,
          url: `${base}/workforce/benchmarks/specialist-per-capita`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Benchmarks", url: `${base}/workforce/benchmarks` },
          { name: "Specialist per Capita" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Benchmarks", href: "/workforce/benchmarks" },
          { label: "Specialist per Capita" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Supply Benchmark
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Specialists per 100,000 Population — Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {specialties.length} Specialties Ranked &middot; Population{" "}
          {DUBAI_POPULATION.toLocaleString()} &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Per-capita specialist rates measure how well-supplied a population is
            for each medical specialty. This analysis divides the number of
            DHA-licensed professionals in each specialty by Dubai&apos;s
            estimated population of {DUBAI_POPULATION.toLocaleString()} to
            produce a per-100K rate. Higher rates indicate better access; lower
            rates may signal workforce gaps or specialties concentrated in
            private-pay settings.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: totalPer100K.toLocaleString(),
            label: "Total Professionals per 100K",
          },
          {
            value: physiciansPer100K.toLocaleString(),
            label: "Physicians per 100K",
          },
          { value: "WHO: 230", label: "WHO Physician Threshold" },
          {
            value: specialties.length.toString(),
            label: "Specialties Tracked",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-4 text-center">
            <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* WHO Context */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Global Context
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          The WHO Health Workforce Support and Safeguards List uses a threshold
          of 44.5 health workers (physicians, nurses, midwives) per 10,000
          population, which translates to roughly 445 per 100K. Dubai&apos;s
          combined rate of {totalPer100K} per 100K places it well above this
          threshold, reflecting the emirate&apos;s investment in healthcare
          infrastructure.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "WHO Threshold", value: "445" },
            { label: "OECD Average", value: "~380" },
            { label: "UAE (Dubai)", value: totalPer100K.toString() },
            { label: "Singapore", value: "~350" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
                {value}
              </p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
                {label} per 100K
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Specialties — Per 100K Rate
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
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Per 100K
              </th>
            </tr>
          </thead>
          <tbody>
            {specialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find(
                (c) => c.slug === spec.category
              );
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
                  <td className="py-2.5 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.per100K}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Related Benchmarks */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Other Benchmarks
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/workforce/benchmarks/nurse-to-doctor"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Nurse-to-Doctor Ratio
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Facility-level staffing ratios with WHO benchmark comparison
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/staff-per-facility"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Staff per Facility
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Facility size distribution and staffing tier analysis
          </p>
        </Link>
        <Link
          href="/workforce/benchmarks/ftl-rate"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            FTL Rate Analysis
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Independent practice license prevalence by specialty and area
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Population estimate: {DUBAI_POPULATION.toLocaleString()} (Dubai
          Statistics Center). Specialties with fewer than 10 professionals are
          excluded. WHO and OECD benchmarks are approximate global averages.
          Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
