import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getSpecialists,
  getConsultants,
  getSpecialtiesWithBothLevels,
  getSpecialtyStats,
  getTopFacilitiesForSpecialty,
} from "@/lib/professionals";
import {
  getCategoryBySlug,
  getSpecialtyBySlug,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string; specialty: string };
}

export function generateStaticParams() {
  const specialties = getSpecialtiesWithBothLevels();
  return specialties
    .map((s) => {
      const spec = getSpecialtyBySlug(s.slug);
      if (!spec) return null;
      return { category: spec.category, specialty: s.slug };
    })
    .filter((p): p is { category: string; specialty: string } => p !== null);
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) return {};

  const specialists = getSpecialists(params.specialty);
  const count = specialists.length;
  const base = getBaseUrl();

  return {
    title: `Specialist ${spec.name} in Dubai \u2014 ${count.toLocaleString()} DHA-Licensed | Zavis`,
    description: `${count.toLocaleString()} specialist-grade ${spec.name.toLowerCase()} professionals licensed by DHA in Dubai. Specialists have completed advanced specialty training and hold recognized qualifications. Browse the full list with facility details.`,
    alternates: {
      canonical: `${base}/professionals/${params.category}/${spec.slug}/specialists`,
    },
    openGraph: {
      title: `Specialist ${spec.name} in Dubai \u2014 ${count.toLocaleString()} DHA-Licensed`,
      description: `${count.toLocaleString()} specialist-grade ${spec.name.toLowerCase()} professionals in Dubai. Full directory sourced from DHA Sheryan.`,
      url: `${base}/professionals/${params.category}/${spec.slug}/specialists`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SpecialistsPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) notFound();

  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const specialists = getSpecialists(params.specialty);
  const consultants = getConsultants(params.specialty);

  // Must have both levels to warrant a split page
  if (specialists.length === 0) notFound();

  const stats = getSpecialtyStats(params.specialty);
  const topFacilities = getTopFacilitiesForSpecialty(params.specialty, 5);
  const base = getBaseUrl();

  const displayed = specialists
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 100);

  const ftlCount = specialists.filter((p) => p.licenseType === "FTL").length;
  const regCount = specialists.filter((p) => p.licenseType === "REG").length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `Specialist ${spec.name} in Dubai`,
          description: `${specialists.length.toLocaleString()} specialist-grade ${spec.name.toLowerCase()} professionals licensed by DHA in Dubai.`,
          url: `${base}/professionals/${params.category}/${spec.slug}/specialists`,
          mainContentOfPage: {
            "@type": "WebPageElement",
            cssSelector: ".professional-listing",
          },
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          isPartOf: {
            "@type": "WebSite",
            name: "UAE Open Healthcare Directory",
            url: base,
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: cat.name, href: `/professionals/${cat.slug}` },
          { label: spec.name, href: `/professionals/${cat.slug}/${spec.slug}` },
          { label: "Specialists" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Specialist Grade
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Specialist {spec.name} in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {specialists.length.toLocaleString()} DHA-Licensed Specialists
        </p>

        {/* Specialist grade explanation */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <strong className="text-[#1c1c1c]">What is a Specialist?</strong> In Dubai&apos;s
            DHA licensing system, a &ldquo;Specialist&rdquo; is a physician or dentist who has
            completed advanced specialty training beyond their primary medical degree and holds a
            recognized postgraduate qualification (e.g., board certification, fellowship, or
            equivalent). Specialists are qualified to independently diagnose and treat conditions
            within their field. There are currently{" "}
            {specialists.length.toLocaleString()} specialist-grade {spec.name.toLowerCase()}{" "}
            professionals practicing across {stats.totalFacilities.toLocaleString()} facilities
            in Dubai.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { value: specialists.length.toLocaleString(), label: "Specialists" },
            { value: ftlCount.toLocaleString(), label: "Full-time licensed" },
            { value: regCount.toLocaleString(), label: "Registered" },
            { value: stats.totalFacilities.toLocaleString(), label: "Facilities" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist vs Consultant comparison callout */}
      <div className="mb-10 border border-black/[0.06] p-5">
        <div className="flex items-center gap-3 mb-3 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] sm:text-[20px] text-[#1c1c1c] tracking-tight">
            Specialists vs Consultants in {spec.name}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#006828]">
              {specialists.length.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Specialists
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1c1c1c]">
              {consultants.length.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Consultants
            </p>
          </div>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Dubai has {specialists.length.toLocaleString()} specialists and{" "}
          {consultants.length.toLocaleString()} consultants in {spec.name.toLowerCase()}.
          Consultants hold the senior grade, typically requiring 8+ years of post-specialty
          experience and the ability to supervise specialists and lead departments.
        </p>
        {consultants.length > 0 && (
          <Link
            href={`/professionals/${cat.slug}/${spec.slug}/consultants`}
            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
          >
            View all {consultants.length.toLocaleString()} consultant{" "}
            {spec.name.toLowerCase()} professionals &rarr;
          </Link>
        )}
      </div>

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Facilities for {spec.name} Specialists
            </h2>
          </div>
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-200">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Facility
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    {spec.name} Staff
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    Total Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {topFacilities.map((fac, i) => (
                  <tr key={fac.slug} className="border-b border-light-200">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/professionals/facility/${fac.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {i + 1}. {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right pr-4">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {fac.totalStaff.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Full Specialist Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Specialist {spec.name} Professionals
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing {displayed.length.toLocaleString()} of{" "}
        {specialists.length.toLocaleString()} specialist-grade {spec.name.toLowerCase()}{" "}
        professionals, sorted alphabetically.
      </p>
      <div className="mb-8 professional-listing">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                License Type
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Facility
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((pro) => (
              <tr key={pro.id} className="border-b border-light-200">
                <td className="py-2.5 pr-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {pro.name}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden sm:table-cell">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
                <td className="py-2.5">
                  {pro.facilitySlug ? (
                    <Link
                      href={`/professionals/facility/${pro.facilitySlug}`}
                      className="text-xs text-black/40 hover:text-[#006828] transition-colors"
                    >
                      {pro.facilityName || "\u2014"}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">{pro.facilityName || "\u2014"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-links */}
      <div className="mb-8 border border-black/[0.06] p-5">
        <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight">
            Related Pages
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`/professionals/${cat.slug}/${spec.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            All {spec.name} professionals ({stats.totalProfessionals.toLocaleString()}) &rarr;
          </Link>
          {consultants.length > 0 && (
            <Link
              href={`/professionals/${cat.slug}/${spec.slug}/consultants`}
              className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Consultant {spec.name} ({consultants.length.toLocaleString()}) &rarr;
            </Link>
          )}
          <Link
            href={`/professionals/${cat.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            All {cat.name} &rarr;
          </Link>
          <Link
            href="/professionals"
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            Professional Directory Home &rarr;
          </Link>
        </div>
      </div>

      {/* Data source info */}
      <div className="mb-6 bg-[#f8f8f6] p-4">
        <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-1">
          Data Source
        </p>
        <p className="font-['Geist',sans-serif] text-xs text-black/50">
          {PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals across{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. Last updated{" "}
          {PROFESSIONAL_STATS.scraped}. Source: {PROFESSIONAL_STATS.source}.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical Professional
          Registry. This directory is for informational purposes only. Verify professional
          credentials directly with DHA before making healthcare decisions.
        </p>
      </div>
    </div>
  );
}
