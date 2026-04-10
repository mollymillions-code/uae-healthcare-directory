import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  ALL_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import {
  getSpecialtyWorkforceMetrics,
  getSpecialtySupplyMetrics,
} from "@/lib/workforce";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { specialty: string };
}

export function generateStaticParams() {
  return ALL_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  const base = getBaseUrl();

  return {
    title: `${spec.name} Career in Dubai — Workforce Size, Employers, Licensing`,
    description: `Career intelligence for ${spec.name} in Dubai. ${metrics?.totalCount.toLocaleString() || spec.count.toLocaleString()} licensed professionals, top employers, geographic hotspots, FTL vs REG licensing, and consultant pathway. DHA Sheryan data.`,
    alternates: { canonical: `${base}/workforce/career/${spec.slug}` },
    openGraph: {
      title: `${spec.name} Career in Dubai`,
      description: `Career profile for ${spec.name}: workforce size, top employers, geographic hotspots, and licensing in Dubai.`,
      url: `${base}/workforce/career/${spec.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function CareerSpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const metrics = getSpecialtyWorkforceMetrics(params.specialty);
  if (!metrics) notFound();

  const supply = getSpecialtySupplyMetrics(params.specialty);
  const base = getBaseUrl();

  const faqs = [
    {
      question: `How many ${spec.name.toLowerCase()} professionals work in Dubai?`,
      answer: `There are ${metrics.totalCount.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals in Dubai as of ${PROFESSIONAL_STATS.scraped}. This translates to ${metrics.per100K} per 100,000 population.`,
    },
    {
      question: `What are the top employers for ${spec.name.toLowerCase()} in Dubai?`,
      answer: metrics.topFacilities.length > 0
        ? `The largest employers are ${metrics.topFacilities.slice(0, 3).map((f) => f.name).join(", ")}. The top facility employs ${metrics.topFacilities[0].count} ${spec.name.toLowerCase()} professionals.`
        : `Employer data is available in the DHA Sheryan registry for ${spec.name.toLowerCase()} professionals.`,
    },
    {
      question: `What is the FTL rate for ${spec.name.toLowerCase()} in Dubai?`,
      answer: `${metrics.license.ftlPercent}% of ${spec.name.toLowerCase()} professionals hold a Full Trade License (FTL), meaning they operate under their own license. The remaining ${metrics.license.regPercent}% are registered under a facility's license.`,
    },
    {
      question: `Where are ${spec.name.toLowerCase()} professionals concentrated in Dubai?`,
      answer: metrics.areaDistribution.length > 0
        ? `The top areas are ${metrics.areaDistribution.slice(0, 3).map((a) => `${a.name} (${a.count})`).join(", ")}. The top 3 areas account for ${metrics.concentrationIndex}% of all ${spec.name.toLowerCase()} professionals.`
        : `Geographic distribution data is available in the DHA Sheryan registry.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Careers", url: `${base}/workforce/careers` },
          { name: spec.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Careers", href: "/workforce/careers" },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.name} Career in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {metrics.totalCount.toLocaleString()} Licensed Professionals &middot; {metrics.per100K} per 100K
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Dubai employs {metrics.totalCount.toLocaleString()} DHA-licensed{" "}
            {spec.name.toLowerCase()} professionals across{" "}
            {metrics.areaDistribution.length} areas, working at{" "}
            {supply?.facilityCount || "multiple"} facilities.
            {metrics.consultants > 0 && (
              <> The consultant ratio is {metrics.consultantRatio}% — meaning {metrics.consultants.toLocaleString()} hold consultant-level appointments.</>
            )}
            {" "}The FTL rate is {metrics.license.ftlPercent}%, indicating the share
            operating under their own trade license.
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.totalCount.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Total workforce</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.per100K}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Per 100K population</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.ftlPercent}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">FTL rate</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">{metrics.consultantRatio}%</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Consultant ratio</p>
        </div>
      </div>

      {/* Top Employers (Who's Hiring) */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Employers
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        The largest employers of {spec.name.toLowerCase()} professionals in Dubai, ranked by headcount.
      </p>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">#</th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">{spec.name} Staff</th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">Total Staff</th>
            </tr>
          </thead>
          <tbody>
            {metrics.topFacilities.map((fac, i) => (
              <tr key={fac.slug} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/professionals/facility/${fac.slug}`}
                    className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                  >
                    {fac.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">{fac.count}</span>
                </td>
                <td className="py-2.5 text-right hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">{fac.totalStaff.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Geographic Hotspots */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Geographic Hotspots
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-sm text-black/60 mb-4">
        The top 3 areas account for {metrics.concentrationIndex}% of all {spec.name.toLowerCase()} professionals in Dubai.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {metrics.areaDistribution.slice(0, 8).map((area) => (
          <Link
            key={area.slug}
            href={`/workforce/area/${area.slug}`}
            className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {area.name}
            </h3>
            <p className="font-['Geist_Mono',monospace] text-[11px] text-black/40">
              {area.count.toLocaleString()} professionals
            </p>
          </Link>
        ))}
      </div>

      {/* Employment Model */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Employment Model
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">FTL (Own License)</p>
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.ftl.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{metrics.license.ftlPercent}%</p>
        </div>
        <div className="bg-[#f8f8f6] p-5">
          <p className="font-['Geist_Mono',monospace] text-xs text-black/40 uppercase tracking-wider mb-2">REG (Facility License)</p>
          <p className="text-2xl font-bold text-[#006828]">{metrics.license.reg.toLocaleString()}</p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">{metrics.license.regPercent}%</p>
        </div>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-12">
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
          A higher FTL rate suggests more independent practitioners and private practice opportunities.
          {metrics.license.ftlPercent > 50
            ? ` With ${metrics.license.ftlPercent}% FTL, ${spec.name.toLowerCase()} professionals in Dubai lean toward independent practice.`
            : ` With ${metrics.license.ftlPercent}% FTL, most ${spec.name.toLowerCase()} professionals in Dubai work under facility licenses.`}
        </p>
      </div>

      {/* Consultant Pathway */}
      {(metrics.specialists > 0 || metrics.consultants > 0) && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Specialist to Consultant Pathway
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.specialists.toLocaleString()}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">Specialists</p>
            </div>
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.consultants.toLocaleString()}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">Consultants</p>
            </div>
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{metrics.consultantRatio}%</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">Consultant ratio</p>
            </div>
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
          <p className="text-[11px] text-black/40">Browse all {metrics.totalCount.toLocaleString()} professionals</p>
        </Link>
        {spec.relatedDirectoryCategory && (
          <Link
            href={`/best/doctors/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              Best {spec.name} Doctors
            </h3>
            <p className="text-[11px] text-black/40">Top-rated in Dubai</p>
          </Link>
        )}
        {spec.category === "physicians" && (
          <Link
            href={`/workforce/supply/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
              Supply Analysis
            </h3>
            <p className="text-[11px] text-black/40">Supply adequacy and geographic gaps</p>
          </Link>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}.
          This career profile is for informational purposes only and does not
          constitute career or employment advice.
        </p>
      </div>
    </div>
  );
}
