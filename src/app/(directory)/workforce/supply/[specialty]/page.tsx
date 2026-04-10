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
  getSpecialtySupplyMetrics,
  getSpecialtyWorkforceMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { specialty: string };
}

export function generateStaticParams() {
  return PHYSICIAN_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

function getSupplyAssessment(per100K: number): { label: string; description: string } {
  if (per100K >= 15) return { label: "Abundant", description: "Strong supply with multiple provider options across most areas." };
  if (per100K >= 5) return { label: "Adequate", description: "Sufficient coverage for most patient needs." };
  if (per100K >= 2) return { label: "Moderate", description: "Potential access challenges in some geographic areas." };
  return { label: "Limited", description: "Specialized care may require referral, longer wait times, or travel." };
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const base = getBaseUrl();

  return {
    title: `${spec.name} Supply Analysis — Dubai Healthcare`,
    description: `${spec.name} supply analysis for Dubai: ${supply?.totalCount.toLocaleString() || spec.count.toLocaleString()} licensed professionals, ${supply?.per100K || 0} per 100K population, ${supply?.facilityCount || 0} facilities, geographic coverage and gaps.`,
    alternates: { canonical: `${base}/workforce/supply/${spec.slug}` },
    openGraph: {
      title: `${spec.name} Supply Analysis — Dubai`,
      description: `Supply adequacy analysis for ${spec.name} in Dubai.`,
      url: `${base}/workforce/supply/${spec.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SupplySpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  if (!supply) notFound();

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  const base = getBaseUrl();
  const assessment = getSupplyAssessment(supply.per100K);

  const faqs = [
    {
      question: `How many ${spec.name.toLowerCase()} professionals are in Dubai?`,
      answer: `There are ${supply.totalCount.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals in Dubai, working across ${supply.facilityCount} facilities in ${supply.areasCovered} areas.`,
    },
    {
      question: `Is the ${spec.name.toLowerCase()} supply adequate in Dubai?`,
      answer: `With ${supply.per100K} professionals per 100,000 population, the ${spec.name.toLowerCase()} supply in Dubai is classified as "${assessment.label}". ${assessment.description}`,
    },
    {
      question: `Where are the geographic gaps for ${spec.name.toLowerCase()} in Dubai?`,
      answer: supply.geographicGaps.length > 0
        ? `Areas without ${spec.name.toLowerCase()} coverage include ${supply.geographicGaps.slice(0, 5).join(", ")}. These areas may require patients to travel to adjacent neighborhoods.`
        : `${spec.name} professionals are distributed across all major Dubai areas with no significant geographic gaps.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Supply Analysis", url: `${base}/workforce/supply` },
          { name: spec.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Supply Analysis", href: "/workforce/supply" },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.name} — Supply Analysis
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {supply.totalCount.toLocaleString()} Professionals &middot; {supply.per100K} per 100K &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Dubai has {supply.totalCount.toLocaleString()} DHA-licensed{" "}
            {spec.name.toLowerCase()} professionals, translating to{" "}
            {supply.per100K} per 100,000 population. They practice across{" "}
            {supply.facilityCount} facilities in {supply.areasCovered} areas.
            Supply assessment: <strong>{assessment.label}</strong>.
          </p>
        </div>
      </div>

      {/* Key Supply Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.totalCount.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Total professionals</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Per 100K population</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.facilityCount}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Facilities</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{supply.areasCovered}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Areas covered</p>
        </div>
      </div>

      {/* Supply Assessment */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Supply Assessment
        </h2>
      </div>
      <div className="border border-black/[0.06] p-6 mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828] uppercase tracking-wider">
            {assessment.label}
          </span>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {supply.per100K} per 100K
          </span>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-4">
          {assessment.description}
        </p>
        <div className="w-full bg-black/[0.04] h-2">
          <div
            className="bg-[#006828] h-2"
            style={{ width: `${Math.min(supply.per100K * 3, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">0</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">Limited</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">Moderate</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">Adequate</span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30">Abundant</span>
        </div>
      </div>

      {/* Employer Concentration */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Employer Concentration
        </h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          The single largest employer accounts for <strong>{supply.topFacilityShare}%</strong> of
          all {spec.name.toLowerCase()} professionals in Dubai.
          {supply.topFacilityShare > 30
            ? " This indicates high employer concentration, which could affect competition and career mobility."
            : " This indicates a relatively distributed employer landscape with good career mobility."}
        </p>
      </div>
      {metrics && metrics.topFacilities.length > 0 && (
        <div className="mb-12">
          {metrics.topFacilities.slice(0, 5).map((fac, i) => (
            <div key={fac.slug} className="flex items-center justify-between py-2.5 border-b border-black/[0.06]">
              <Link
                href={`/professionals/facility/${fac.slug}`}
                className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828] transition-colors"
              >
                {i + 1}. {fac.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-bold ml-2 shrink-0">
                {fac.count} ({supply.totalCount > 0 ? ((fac.count / supply.totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Geographic Coverage */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Coverage
        </h2>
      </div>
      {metrics && metrics.areaDistribution.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1c1c1c]">
                <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Area</th>
                <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Count</th>
                <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {metrics.areaDistribution.slice(0, 10).map((area) => (
                <tr key={area.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/area/${area.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {area.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{area.count.toLocaleString()}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {supply.totalCount > 0 ? ((area.count / supply.totalCount) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Geographic Gaps */}
      {supply.geographicGaps.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Geographic Gaps
            </h2>
          </div>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
            The following areas have zero DHA-licensed {spec.name.toLowerCase()} professionals.
            Residents in these areas may need to travel to adjacent neighborhoods for {spec.name.toLowerCase()} care.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {supply.geographicGaps.map((gap) => (
              <div key={gap} className="bg-[#f8f8f6] p-3">
                <p className="font-['Geist',sans-serif] text-sm text-black/60">{gap}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAQs */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-6 mb-12">
        {faqs.map((faq, i) => (
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
          Related Pages
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <Link
          href={`/professionals/${spec.category}/${spec.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            {spec.name} Directory
          </h3>
          <p className="text-[11px] text-black/40">Browse all professionals</p>
        </Link>
        <Link
          href={`/workforce/career/${spec.slug}`}
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            Career Profile
          </h3>
          <p className="text-[11px] text-black/40">Employers, hotspots, licensing</p>
        </Link>
        <Link
          href="/workforce/supply"
          className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
        >
          <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
            All Specialties
          </h3>
          <p className="text-[11px] text-black/40">Supply analysis hub</p>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          Supply assessments are estimates based on per-capita rates and are for
          informational purposes only. Actual access depends on many factors beyond headcount.
        </p>
      </div>
    </div>
  );
}
