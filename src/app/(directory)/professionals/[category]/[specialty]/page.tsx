import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProfessionalsBySpecialty, getSpecialtyStats } from "@/lib/professionals";
import {
  ALL_SPECIALTIES,
  getCategoryBySlug,
  getSpecialtyBySlug,
} from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string; specialty: string };
}

export function generateStaticParams() {
  return ALL_SPECIALTIES.map((s) => ({
    category: s.category,
    specialty: s.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) return {};
  const base = getBaseUrl();
  return {
    title: `Find a ${spec.name} in Dubai — ${spec.count.toLocaleString()} Licensed Professionals | Zavis`,
    description: `There are ${spec.count.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals practicing in Dubai. Browse the full list with license type and facility details, sourced from the DHA Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/professionals/${params.category}/${spec.slug}` },
    openGraph: {
      title: `Find a ${spec.name} in Dubai — ${spec.count.toLocaleString()} Licensed Professionals`,
      description: `${spec.count.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals in Dubai. Full directory sourced from DHA.`,
      url: `${base}/professionals/${params.category}/${spec.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function SpecialtyPage({ params }: Props) {
  const spec = getSpecialtyBySlug(params.specialty);
  if (!spec || spec.category !== params.category) notFound();

  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const professionals = getProfessionalsBySpecialty(spec.slug);
  const stats = getSpecialtyStats(spec.slug);

  const displayLimit = 200;
  const displayProfessionals = [...professionals]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, displayLimit);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.name} in Dubai`,
          description: `${stats.totalProfessionals.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals in Dubai.`,
          url: `${base}/professionals/${params.category}/${spec.slug}`,
          mainContentOfPage: {
            "@type": "WebPageElement",
            cssSelector: ".professional-listing",
          },
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
        }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          { name: cat.name, url: `${base}/professionals/${cat.slug}` },
          { name: spec.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: cat.name, href: `/professionals/${cat.slug}` },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.name} in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {stats.totalProfessionals.toLocaleString()} Licensed Professionals
        </p>

        {/* Editorial intro */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            There are {stats.totalProfessionals.toLocaleString()} licensed {spec.name.toLowerCase()}{" "}
            professionals practicing in Dubai, working across {stats.totalFacilities.toLocaleString()}{" "}
            healthcare facilities. Of these, {stats.ftlCount.toLocaleString()} hold a full-time license
            (FTL) and {stats.regCount.toLocaleString()} are registered (REG). The largest employer is{" "}
            {stats.topFacilities[0]?.name || "—"} with {stats.topFacilities[0]?.count.toLocaleString() || "0"}{" "}
            {spec.name.toLowerCase()} professionals on staff. All data is sourced from the DHA Sheryan
            Medical Registry.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { value: stats.totalProfessionals.toLocaleString(), label: "Total professionals" },
            { value: stats.totalFacilities.toLocaleString(), label: "Facilities" },
            { value: stats.ftlCount.toLocaleString(), label: "Full-time licensed" },
            { value: stats.regCount.toLocaleString(), label: "Registered" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related directory category */}
      {spec.relatedDirectoryCategory && (
        <div className="mb-10 border border-black/[0.06] p-4">
          <Link
            href={`/directory/dubai/${spec.relatedDirectoryCategory}`}
            className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
          >
            Find {spec.name.toLowerCase()} clinics and hospitals in Dubai &rarr;
          </Link>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Browse {spec.relatedDirectoryCategory.replace(/-/g, " ")} facilities in the UAE Open Healthcare Directory.
          </p>
        </div>
      )}

      {/* Top Facilities for this Specialty */}
      {stats.topFacilities.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Facilities for {spec.name}
            </h2>
          </div>
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Facility</th>
                  <th scope="col" className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">{spec.name}</th>
                </tr>
              </thead>
              <tbody>
                {stats.topFacilities.map((fac, i) => (
                  <tr key={fac.slug} className="border-b border-black/[0.06]">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/professionals/facility/${fac.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {i + 1}. {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Full Professional Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All {spec.name} Professionals
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing {displayProfessionals.length < professionals.length ? `${displayProfessionals.length.toLocaleString()} of ` : ""}{stats.totalProfessionals.toLocaleString()} licensed {spec.name.toLowerCase()}{" "}
        professionals in Dubai, sorted alphabetically.
      </p>
      <div className="mb-8 professional-listing">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">Name</th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">License Type</th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">Facility</th>
            </tr>
          </thead>
          <tbody>
            {displayProfessionals.map((pro) => (
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
                    <span className="text-xs text-black/40">{pro.facilityName || "—"}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          Showing {displayLimit} of {professionals.length.toLocaleString()} professionals.
          View all {spec.name.toLowerCase()} professionals by facility using the top facilities table above.
        </p>
      )}

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
