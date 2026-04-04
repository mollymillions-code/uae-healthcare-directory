import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getFTLRateBySpecialty,
  getFTLRateByArea,
  getLicenseTypeBreakdown,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "FTL Rate Analysis Dubai — Independent Practice License by Specialty & Area | Zavis",
    description: `FTL (Full Trade License) rate analysis for Dubai healthcare: which specialties and areas have the highest independent practice rates? Ranked tables across ${PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals.`,
    alternates: {
      canonical: `${base}/workforce/benchmarks/ftl-rate`,
    },
    openGraph: {
      title:
        "FTL Rate Analysis Dubai — Independent Practice License by Specialty & Area",
      description: `Independent practice license prevalence across Dubai's healthcare workforce.`,
      url: `${base}/workforce/benchmarks/ftl-rate`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function FTLRatePage() {
  const base = getBaseUrl();
  const bySpecialty = getFTLRateBySpecialty();
  const byArea = getFTLRateByArea();
  const license = getLicenseTypeBreakdown();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "FTL Rate Analysis — Dubai Healthcare",
          description: `Independent practice license rates across Dubai's ${PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals.`,
          url: `${base}/workforce/benchmarks/ftl-rate`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Benchmarks", url: `${base}/workforce/benchmarks` },
          { name: "FTL Rate" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Benchmarks", href: "/workforce/benchmarks" },
          { label: "FTL Rate" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          License Benchmark
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          FTL Rate Analysis — Independent Practice in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {bySpecialty.length} Specialties &middot; {byArea.length} Areas
          &middot; Data as of {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            DHA issues two primary license types: <strong>FTL</strong> (Full
            Trade License) for professionals operating under their own trade
            license, and <strong>REG</strong> (Registered) for professionals
            employed under a facility&apos;s license. A high FTL rate indicates
            a specialty or area where independent practice is prevalent — common
            in outpatient specialties like dermatology and dentistry. A low FTL
            rate suggests hospital-based employment dominates.
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: `${license.ftlPercent}%`,
            label: "Overall FTL Rate",
          },
          {
            value: license.ftl.toLocaleString(),
            label: "FTL Professionals",
          },
          {
            value: license.reg.toLocaleString(),
            label: "REG Professionals",
          },
          {
            value: bySpecialty.length > 0
              ? `${bySpecialty[0].ftlRate}%`
              : "--",
            label: "Highest Specialty FTL",
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

      {/* FTL by Specialty */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          FTL Rate by Specialty
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Specialties with 20+ licensed professionals, ranked by percentage holding
        an FTL (Full Trade License). Higher FTL rates indicate greater
        independent practice prevalence.
      </p>
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
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                FTL Rate
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                FTL
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {bySpecialty.map((spec, i) => (
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
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {spec.ftlRate}%
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {spec.ftl.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {spec.total.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FTL by Area */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          FTL Rate by Area
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Dubai areas ranked by FTL prevalence among licensed healthcare
        professionals. Areas with high FTL rates tend to have more independent
        clinics and specialist practices.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                #
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Area
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                FTL Rate
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                FTL
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {byArea.map((area, i) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {area.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.ftlRate}%
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                    {area.ftl.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {area.total.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
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
          href="/workforce/benchmarks/specialist-per-capita"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Specialist per Capita
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Per-100K population rates for every specialty
          </p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. FTL
          (Full Trade License) indicates a professional operating under their own
          trade license. REG (Registered) indicates employment under a
          facility&apos;s license. License type reflects the employment
          arrangement, not skill level. Specialties with fewer than 20
          professionals are excluded. Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
