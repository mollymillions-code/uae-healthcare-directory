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
import { breadcrumbSchema } from "@/lib/seo";
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

  const consultantsList = getConsultants(params.specialty);
  const count = consultantsList.length;
  const base = getBaseUrl();

  return {
    title: `Consultant ${spec.name} in Dubai \u2014 ${count.toLocaleString()} DHA-Licensed`,
    description: `${count.toLocaleString()} consultant-grade ${spec.name.toLowerCase()} professionals licensed by DHA in Dubai. Consultants are the senior clinical grade, requiring 8+ years of post-specialty experience. Browse the full list with facility details.`,
    alternates: {
      canonical: `${base}/professionals/${params.category}/${spec.slug}/consultants`,
    },
    openGraph: {
      title: `Consultant ${spec.name} in Dubai \u2014 ${count.toLocaleString()} DHA-Licensed`,
      description: `${count.toLocaleString()} consultant-grade ${spec.name.toLowerCase()} professionals in Dubai. Full directory sourced from DHA Sheryan.`,
      url: `${base}/professionals/${params.category}/${spec.slug}/consultants`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function ConsultantsPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) notFound();

  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const specialists = getSpecialists(params.specialty);
  const consultantsList = getConsultants(params.specialty);

  // Must have consultants to render this page
  if (consultantsList.length === 0) notFound();

  const stats = getSpecialtyStats(params.specialty);
  const topFacilities = getTopFacilitiesForSpecialty(params.specialty, 5);
  const base = getBaseUrl();

  const displayed = consultantsList
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 100);

  const ftlCount = consultantsList.filter((p) => p.licenseType === "FTL").length;
  const regCount = consultantsList.filter((p) => p.licenseType === "REG").length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `Consultant ${spec.name} in Dubai`,
          description: `${consultantsList.length.toLocaleString()} consultant-grade ${spec.name.toLowerCase()} professionals licensed by DHA in Dubai.`,
          url: `${base}/professionals/${params.category}/${spec.slug}/consultants`,
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

      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: cat.name, url: `${base}/professionals/${cat.slug}` },
          { name: spec.name, url: `${base}/professionals/${cat.slug}/${spec.slug}` },
          { name: "Consultants" },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: cat.name, href: `/professionals/${cat.slug}` },
          { label: spec.name, href: `/professionals/${cat.slug}/${spec.slug}` },
          { label: "Consultants" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Consultant Grade
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Consultant {spec.name} in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {consultantsList.length.toLocaleString()} DHA-Licensed Consultants
        </p>

        {/* Consultant grade explanation */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <strong className="text-[#1c1c1c]">What is a Consultant?</strong> In Dubai&apos;s
            DHA licensing system, &ldquo;Consultant&rdquo; is the most senior clinical grade a
            physician or dentist can hold. It requires a minimum of 8 years of post-specialty
            clinical experience, demonstrated expertise in the field, and the ability to
            supervise specialists and lead clinical departments. Consultants serve as the highest
            authority in patient care decisions within their specialty. There are currently{" "}
            {consultantsList.length.toLocaleString()} consultant-grade {spec.name.toLowerCase()}{" "}
            professionals practicing in Dubai.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { value: consultantsList.length.toLocaleString(), label: "Consultants" },
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

      {/* Consultant vs Specialist comparison callout */}
      <div className="mb-10 border border-black/[0.06] p-5">
        <div className="flex items-center gap-3 mb-3 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] sm:text-[20px] text-[#1c1c1c] tracking-tight">
            Consultants vs Specialists in {spec.name}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#006828]">
              {consultantsList.length.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Consultants
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1c1c1c]">
              {specialists.length.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Specialists
            </p>
          </div>
        </div>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Dubai has {consultantsList.length.toLocaleString()} consultants and{" "}
          {specialists.length.toLocaleString()} specialists in {spec.name.toLowerCase()}.
          The consultant-to-specialist ratio of{" "}
          {specialists.length > 0
            ? `1:${(specialists.length / consultantsList.length).toFixed(1)}`
            : "N/A"}{" "}
          reflects the seniority pyramid typical of regulated healthcare systems, where fewer
          consultants oversee a larger base of specialists.
        </p>
        {specialists.length > 0 && (
          <Link
            href={`/professionals/${cat.slug}/${spec.slug}/specialists`}
            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
          >
            View all {specialists.length.toLocaleString()} specialist{" "}
            {spec.name.toLowerCase()} professionals &rarr;
          </Link>
        )}
      </div>

      {/* Top Facilities */}
      {topFacilities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Facilities for {spec.name} Consultants
            </h2>
          </div>
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
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
                  <tr key={fac.slug} className="border-b border-black/[0.06]">
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

      {/* Full Consultant Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All Consultant {spec.name} Professionals
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing {displayed.length.toLocaleString()} of{" "}
        {consultantsList.length.toLocaleString()} consultant-grade {spec.name.toLowerCase()}{" "}
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
              <tr key={pro.id} className="border-b border-black/[0.06]">
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
          {specialists.length > 0 && (
            <Link
              href={`/professionals/${cat.slug}/${spec.slug}/specialists`}
              className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
            >
              Specialist {spec.name} ({specialists.length.toLocaleString()}) &rarr;
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
