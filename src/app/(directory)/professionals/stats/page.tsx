import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAllFacilities,
  getAllProfessionals,
  getAreaStats,
  getSpecialtiesWithBothLevels,
} from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
  ALL_SPECIALTIES,
} from "@/lib/constants/professionals";
import { DUBAI_POPULATION } from "@/lib/workforce";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const FAQS = [
  {
    question: "How many healthcare professionals are licensed in Dubai?",
    answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals licensed by the Dubai Health Authority (DHA). This includes ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, ${PROFESSIONAL_STATS.dentists.toLocaleString()} dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals.`,
  },
  {
    question: "What is the physician-to-population ratio in Dubai?",
    answer: `With ${PROFESSIONAL_STATS.physicians.toLocaleString()} licensed physicians serving an estimated population of ${(DUBAI_POPULATION / 1_000_000).toFixed(2)} million, Dubai has approximately 1 physician for every ${Math.round(DUBAI_POPULATION / PROFESSIONAL_STATS.physicians).toLocaleString()} residents. This is one of the highest ratios in the MENA region.`,
  },
  {
    question: "How many healthcare facilities operate in Dubai?",
    answer: `There are ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} healthcare facilities with licensed staff in Dubai, according to the DHA Sheryan Medical Registry. These range from large government hospitals like Rashid Hospital (${PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString()} staff) to specialized clinics and pharmacies.`,
  },
  {
    question: "What is the largest hospital in Dubai by staff count?",
    answer: `Rashid Hospital is the largest healthcare facility in Dubai by licensed staff, with ${PROFESSIONAL_STATS.topFacilities[0].staff.toLocaleString()} DHA-licensed professionals. It is followed by Dubai Hospital (${PROFESSIONAL_STATS.topFacilities[1].staff.toLocaleString()} staff) and American Hospital Dubai (${PROFESSIONAL_STATS.topFacilities[2].staff.toLocaleString()} staff).`,
  },
  {
    question: "What are the most common medical specialties in Dubai?",
    answer: "The most common specialties among Dubai healthcare professionals are General Practitioner, Registered Nurse, Pharmacist, General Dentist, and Physiotherapist. Among physician specialties specifically, General Practitioner, Obstetrics & Gynecology, Pediatrics, Family Medicine, and Dermatology are the most prevalent.",
  },
  {
    question: "Where does this healthcare workforce data come from?",
    answer: `All data in this report is sourced from the Dubai Health Authority (DHA) Sheryan Medical Professional Registry, the official licensing database for healthcare professionals in Dubai. Data was last scraped on ${PROFESSIONAL_STATS.scraped}.`,
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `Dubai Healthcare Workforce Statistics 2026 — ${PROFESSIONAL_STATS.total.toLocaleString()} Licensed Professionals | Zavis`,
    description: `Comprehensive Dubai healthcare workforce statistics: ${PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. Category breakdowns, top specialties, facility rankings, license distribution, and geographic analysis. Sourced from DHA Sheryan Registry.`,
    alternates: { canonical: `${base}/professionals/stats` },
    openGraph: {
      title: `Dubai Healthcare Workforce Statistics 2026 — ${PROFESSIONAL_STATS.total.toLocaleString()} Licensed Professionals`,
      description: `Data-driven analysis of Dubai's healthcare workforce. ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, ${PROFESSIONAL_STATS.dentists.toLocaleString()} dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses, ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health.`,
      url: `${base}/professionals/stats`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function StatsPage() {
  const base = getBaseUrl();
  const facilities = getAllFacilities(100).slice(0, 20);
  const areaStats = getAreaStats();
  const bothLevels = getSpecialtiesWithBothLevels();

  // Compute license type distribution
  const allProfessionals = getAllProfessionals();
  let ftlTotal = 0;
  let regTotal = 0;
  for (const p of allProfessionals) {
    if (p.licenseType === "FTL") ftlTotal++;
    else if (p.licenseType === "REG") regTotal++;
  }
  const otherLicense = allProfessionals.length - ftlTotal - regTotal;

  // Top 20 specialties sorted by count
  const topSpecialties = [...ALL_SPECIALTIES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Physician ratio
  const physicianRatio = Math.round(DUBAI_POPULATION / PROFESSIONAL_STATS.physicians);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: "Statistics" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Dubai Healthcare Workforce Statistics 2026`,
          description: `${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities in Dubai.`,
          url: `${base}/professionals/stats`,
          mainEntity: {
            "@type": "Dataset",
            name: "Dubai Healthcare Workforce Statistics",
            description: `Workforce data for ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals.`,
            creator: {
              "@type": "Organization",
              name: "Zavis",
              url: base,
            },
            distribution: {
              "@type": "DataDownload",
              contentUrl: `${base}/professionals/stats`,
              encodingFormat: "text/html",
            },
            temporalCoverage: "2026",
            spatialCoverage: {
              "@type": "Place",
              name: "Dubai, United Arab Emirates",
            },
            variableMeasured: [
              "Total licensed healthcare professionals",
              "Professionals by category",
              "Professionals by specialty",
              "Professionals by facility",
              "License type distribution",
            ],
          },
        }}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: "Statistics" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Dubai Healthcare Workforce: By the Numbers
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {PROFESSIONAL_STATS.total.toLocaleString()} DHA-Licensed Professionals
          &middot; Data as of {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            A comprehensive statistical overview of Dubai&apos;s healthcare workforce, sourced
            from the official DHA Sheryan Medical Professional Registry. This page
            covers category breakdowns, specialty rankings, facility staffing, license
            distribution, geographic analysis, and specialist vs. consultant ratios.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          {
            value: PROFESSIONAL_STATS.total.toLocaleString(),
            label: "Total licensed professionals",
          },
          {
            value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(),
            label: "Healthcare facilities",
          },
          {
            value: `1:${physicianRatio.toLocaleString()}`,
            label: "Physician-to-population ratio",
          },
          {
            value: ALL_SPECIALTIES.length.toString(),
            label: "Specialties tracked",
          },
        ].map(({ value, label }) => (
          <div key={label} className="bg-[#f8f8f6] p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#006828]">{value}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Workforce by Category
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => {
          const pct = ((cat.count / PROFESSIONAL_STATS.total) * 100).toFixed(1);
          return (
            <Link
              key={cat.slug}
              href={`/professionals/${cat.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {cat.name}
              </h3>
              <p className="text-2xl font-bold text-[#006828] mb-1">
                {cat.count.toLocaleString()}
              </p>
              <div className="w-full bg-black/[0.04] h-1.5 mb-2">
                <div
                  className="bg-[#006828] h-1.5"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
                {pct}% of total workforce
              </p>
            </Link>
          );
        })}
      </div>

      {/* Top 20 Specialties Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 20 Specialties by Professional Count
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                #
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Specialty
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Category
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Count
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody>
            {topSpecialties.map((spec, i) => {
              const cat = PROFESSIONAL_CATEGORIES.find(
                (c) => c.slug === spec.category
              );
              const pct = ((spec.count / PROFESSIONAL_STATS.total) * 100).toFixed(1);
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/professionals/${spec.category}/${spec.slug}`}
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

      {/* Top 20 Facilities Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top 20 Facilities by Staff Count
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                #
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Total Staff
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                Top Specialty
              </th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {fac.totalStaff.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {fac.topSpecialties[0]?.name || "--"}
                    {fac.topSpecialties[0] ? ` (${fac.topSpecialties[0].count})` : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* License Type Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          License Type Distribution
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          DHA issues two primary license types: <strong>FTL</strong> (Full Trade
          License) for professionals operating under their own license, and{" "}
          <strong>REG</strong> (Registered) for professionals working under a
          facility&apos;s license. License type reflects the employment arrangement,
          not the skill level of the professional.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            label: "FTL (Full Trade License)",
            value: ftlTotal,
            pct: ((ftlTotal / allProfessionals.length) * 100).toFixed(1),
          },
          {
            label: "REG (Registered)",
            value: regTotal,
            pct: ((regTotal / allProfessionals.length) * 100).toFixed(1),
          },
          ...(otherLicense > 0
            ? [
                {
                  label: "Other",
                  value: otherLicense,
                  pct: ((otherLicense / allProfessionals.length) * 100).toFixed(1),
                },
              ]
            : []),
        ].map(({ label, value, pct }) => (
          <div key={label} className="bg-[#f8f8f6] p-5">
            <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">
              {label}
            </p>
            <p className="text-2xl font-bold text-[#006828]">
              {value.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              {pct}% of total
            </p>
          </div>
        ))}
      </div>

      {/* Geographic Distribution */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Distribution by Area
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Healthcare professionals mapped to Dubai areas based on facility location.
        Areas with fewer than 10 professionals are excluded.
      </p>
      <div className="mb-12 overflow-x-auto">
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
                Top Specialties
              </th>
            </tr>
          </thead>
          <tbody>
            {areaStats.map((area) => (
              <tr key={area.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/area/${area.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {area.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                    {area.count.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {area.topSpecialties
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(", ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specialist vs Consultant Comparison */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Specialist vs. Consultant Comparison
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          In the DHA system, <strong>Specialists</strong> are physicians who have
          completed specialty training and hold board certification.{" "}
          <strong>Consultants</strong> are senior specialists with additional
          experience, typically 5+ years post-specialty certification. The table
          below shows specialties that have both levels of seniority.
        </p>
      </div>
      <div className="mb-12 overflow-x-auto">
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
                Ratio (S:C)
              </th>
            </tr>
          </thead>
          <tbody>
            {bothLevels.slice(0, 25).map((spec) => {
              const ratio =
                spec.consultants > 0
                  ? (spec.specialists / spec.consultants).toFixed(1)
                  : "--";
              return (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                      {spec.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.specialists.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {spec.consultants.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {ratio}:1
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-6 mb-12">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Cross-links */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Explore the Directory
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              {cat.name}
            </h3>
            <p className="text-[11px] text-black/40">
              {cat.count.toLocaleString()} professionals
            </p>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Population estimates based on Dubai Statistics Center data. This page is
          for informational purposes only and does not constitute medical advice.
          Verify professional credentials directly with DHA before making healthcare
          decisions.
        </p>
      </div>
    </div>
  );
}
