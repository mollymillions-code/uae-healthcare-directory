import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getWorkforceRatios,
  getLicenseTypeBreakdown,
  getAreaStats,
  getAllFacilities,
  getSpecialtiesWithBothLevels,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/workforce";

export const revalidate = 43200;

const FAQS = [
  {
    question: "How many healthcare professionals are licensed in Dubai?",
    answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals in Dubai. This includes ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, ${PROFESSIONAL_STATS.dentists.toLocaleString()} dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals.`,
  },
  {
    question: "What is the physician-to-population ratio in Dubai?",
    answer:
      "Dubai has approximately 661 physicians per 100,000 population (based on an estimated 3.66 million residents), which exceeds the WHO recommended minimum. This ratio includes general practitioners, specialists, and consultants across all medical disciplines.",
  },
  {
    question: "What is the nurse-to-physician ratio in Dubai?",
    answer:
      "The nurse-to-physician ratio in Dubai is approximately 1.44:1. While this meets basic operational requirements, it falls below the WHO benchmark of 3:1, indicating potential demand for nursing recruitment.",
  },
  {
    question: "What does FTL vs REG mean for DHA licenses?",
    answer:
      "FTL (Full Time License) means the professional works full-time at their registered facility. REG (Registration) indicates a professional who may practice part-time or across multiple facilities. FTL holders typically represent the core staffing at a facility.",
  },
  {
    question: "Where is this workforce data sourced from?",
    answer: `All data comes from the Dubai Health Authority (DHA) Sheryan Medical Professional Registry, the official licensing database for healthcare workers in Dubai. Data was collected on ${PROFESSIONAL_STATS.scraped}.`,
  },
  {
    question: "How often is the workforce data updated?",
    answer:
      "The DHA Sheryan registry is a live database updated as professionals obtain or renew licenses. Zavis re-indexes the full registry periodically to capture changes in workforce composition, new hires, and departures.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "Dubai Healthcare Workforce Report 2026 — 99,520 Licensed Professionals | Zavis",
    description:
      "The definitive Dubai healthcare workforce report: 99,520 DHA-licensed professionals, population ratios, category breakdowns, license types, top facilities, specialist pipeline, and geographic distribution. Data from the Sheryan Medical Registry.",
    alternates: { canonical: `${base}/workforce/overview` },
    openGraph: {
      title:
        "Dubai Healthcare Workforce Report 2026 — 99,520 Licensed Professionals",
      description:
        "Comprehensive analysis of Dubai's healthcare labor market. Population ratios, employer rankings, specialty distribution, and workforce benchmarks.",
      url: `${base}/workforce/overview`,
      type: "article",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function WorkforceOverviewPage() {
  const base = getBaseUrl();
  const ratios = getWorkforceRatios();
  const license = getLicenseTypeBreakdown();
  const topFacilities = getAllFacilities(100).slice(0, 20);
  const sortedSpecialties = [...ALL_SPECIALTIES].sort(
    (a, b) => b.count - a.count
  );
  const topSpecialties = sortedSpecialties.slice(0, 20);
  const pipeline = getSpecialtiesWithBothLevels().slice(0, 15);
  const areas = getAreaStats().slice(0, 15);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Dubai Healthcare Workforce Report 2026",
          description: `Comprehensive workforce report covering ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed professionals.`,
          url: `${base}/workforce/overview`,
          mainEntity: {
            "@type": "Dataset",
            name: "Dubai Healthcare Workforce Census 2026",
            description: `Complete census of ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities.`,
            creator: {
              "@type": "Organization",
              name: "Dubai Health Authority",
            },
            temporalCoverage: PROFESSIONAL_STATS.scraped,
          },
        }}
      />
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Overview" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Overview" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Flagship Workforce Report
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4 leading-tight">
          Dubai Healthcare Workforce Report 2026
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
          Published {PROFESSIONAL_STATS.scraped} | Source: DHA Sheryan Medical
          Registry
        </p>
      </div>

      {/* Executive Summary */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Executive Summary
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Dubai&apos;s healthcare sector employs{" "}
          <strong>{PROFESSIONAL_STATS.total.toLocaleString()}</strong> DHA-licensed
          professionals across{" "}
          <strong>
            {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}
          </strong>{" "}
          facilities, making it one of the largest and most diverse healthcare
          labor markets in the Middle East. Key findings:
        </p>
        <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed list-disc list-inside space-y-1">
          <li>
            Nurses and midwives form the largest category at{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString()} (
            {Math.round(
              (PROFESSIONAL_STATS.nurses / PROFESSIONAL_STATS.total) * 100
            )}
            %), followed by allied health at{" "}
            {PROFESSIONAL_STATS.alliedHealth.toLocaleString()} (
            {Math.round(
              (PROFESSIONAL_STATS.alliedHealth / PROFESSIONAL_STATS.total) * 100
            )}
            %)
          </li>
          <li>
            Physician density stands at {ratios.physiciansPer100K} per 100K
            population — above the WHO-recommended threshold
          </li>
          <li>
            The nurse-to-physician ratio of {ratios.nurseToPhysicianRatio}:1
            remains below the WHO benchmark of 3:1
          </li>
          <li>
            {license.ftlPercent}% of all licenses are FTL (Full Time), with{" "}
            {license.regPercent}% holding REG (Registration) status
          </li>
        </ul>
      </div>

      {/* Population Ratios */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Population Ratios
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
        Based on estimated Dubai population of{" "}
        {ratios.population.toLocaleString()} (2026)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[
          {
            label: "Physicians per 100K",
            value: ratios.physiciansPer100K,
            benchmark: "WHO min: 100",
          },
          {
            label: "Nurses per 100K",
            value: ratios.nursesPer100K,
            benchmark: "WHO min: 300",
          },
          {
            label: "Dentists per 100K",
            value: ratios.dentistsPer100K,
            benchmark: "Global avg: ~30",
          },
          {
            label: "Allied Health per 100K",
            value: ratios.alliedHealthPer100K,
            benchmark: "",
          },
          {
            label: "Total per 100K",
            value: ratios.totalPer100K,
            benchmark: "",
          },
        ].map(({ label, value, benchmark }) => (
          <div key={label} className="bg-[#f8f8f6] p-4">
            <p className="font-['Geist_Mono',monospace] text-xl font-bold text-[#006828]">
              {value}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/60 mt-1">
              {label}
            </p>
            {benchmark && (
              <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30 mt-1">
                {benchmark}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.physicianToPopulation}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            Physician-to-Population
          </p>
        </div>
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.nurseToPopulation}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            Nurse-to-Population
          </p>
        </div>
        <div className="border border-black/[0.06] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-lg font-bold text-[#1c1c1c]">
            {ratios.nurseToPhysicianRatio}:1
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            Nurse-to-Physician Ratio
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Workforce by Category
        </h2>
      </div>
      <div className="space-y-3 mb-8">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = Math.round(
            (cat.count / PROFESSIONAL_STATS.total) * 100
          );
          return (
            <div key={cat.slug} className="border border-black/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                  {cat.name}
                </p>
                <p className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {cat.count.toLocaleString()}
                </p>
              </div>
              <div className="h-2 bg-[#f8f8f6] overflow-hidden mb-1">
                <div
                  className="h-full bg-[#006828]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30">
                {pct}% of total workforce
              </p>
            </div>
          );
        })}
      </div>

      {/* License Type Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          License Type Distribution
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {license.ftl.toLocaleString()}
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] mt-1">
            Full Time License (FTL)
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {license.ftlPercent}% — dedicated to a single facility
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#1c1c1c]">
            {license.reg.toLocaleString()}
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] mt-1">
            Registration (REG)
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            {license.regPercent}% — may practice across multiple facilities
          </p>
        </div>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/60 leading-relaxed mb-8">
        FTL professionals are permanently assigned to one facility and form the
        core clinical workforce. REG holders may work part-time, locum, or
        across multiple locations. A high FTL rate at a facility indicates
        staffing stability.
      </p>

      {/* Top 20 Facilities */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 20 Facilities by Staff
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                #
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Staff
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                Top Specialty
              </th>
            </tr>
          </thead>
          <tbody>
            {topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/employer/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {fac.totalStaff.toLocaleString()}
                </td>
                <td className="py-2.5 text-xs text-black/40 hidden sm:table-cell">
                  {fac.topSpecialties[0]?.name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/workforce/employers"
          className="text-[#006828] hover:underline"
        >
          View all {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}{" "}
          facilities ranked by staff count →
        </Link>
      </p>

      {/* Top 20 Specialties */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 20 Specialties by Workforce Size
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                #
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Specialty
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Category
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Professionals
              </th>
            </tr>
          </thead>
          <tbody>
            {topSpecialties.map((spec, i) => (
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
                <td className="py-2.5 pr-4 text-xs text-black/40 hidden sm:table-cell capitalize">
                  {spec.category}
                </td>
                <td className="py-2.5 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {spec.count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/workforce/specialties"
          className="text-[#006828] hover:underline"
        >
          View all {ALL_SPECIALTIES.length} specialties ranked →
        </Link>
      </p>

      {/* Specialist vs Consultant Pipeline */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Specialist-to-Consultant Pipeline
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
        Specialties where both &quot;Specialist&quot; and &quot;Consultant&quot;
        designations exist, showing the seniority pipeline.
      </p>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Specialty
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Specialists
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Consultants
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Consultant %
              </th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map((spec) => {
              const total = spec.specialists + spec.consultants;
              const pct =
                total > 0
                  ? Math.round((spec.consultants / total) * 100)
                  : 0;
              return (
                <tr
                  key={spec.slug}
                  className="border-b border-black/[0.06]"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/specialty/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {spec.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm text-black/60">
                    {spec.specialists.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm text-[#006828] font-bold">
                    {spec.consultants.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-['Geist_Mono',monospace] text-sm text-black/40">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Geographic Concentration */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Concentration
        </h2>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Area
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Professionals
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                Top Specialty
              </th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/workforce/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {area.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                  {area.count.toLocaleString()}
                </td>
                <td className="py-2.5 text-xs text-black/40 hidden sm:table-cell">
                  {area.topSpecialties[0]?.name || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
        <Link
          href="/workforce/areas"
          className="text-[#006828] hover:underline"
        >
          View all areas with geographic analysis →
        </Link>
      </p>

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-6 mb-8">
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. This
          report is for informational purposes only and does not constitute
          medical or employment advice. Verify credentials directly with DHA.
        </p>
      </div>
    </div>
  );
}
