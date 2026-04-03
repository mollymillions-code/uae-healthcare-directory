import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByAreaAndSpecialty,
  getAreaSpecialtyCombos,
  DUBAI_AREAS,
} from "@/lib/professionals";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { area: string; specialty: string };
}

export function generateStaticParams() {
  return getAreaSpecialtyCombos(3).map((combo) => ({
    area: combo.areaSlug,
    specialty: combo.specialtySlug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!areaInfo || !spec) {
    return {
      title: "Healthcare Professionals by Area & Specialty | Zavis",
      description:
        "Browse DHA-licensed healthcare professionals by area and specialty in Dubai.",
    };
  }
  const professionals = getProfessionalsByAreaAndSpecialty(
    params.area,
    params.specialty
  );
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: `Best ${spec.name} in ${areaInfo.name}, Dubai — ${count.toLocaleString()} Licensed Professionals | Zavis`,
    description: `Find ${count.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals in ${areaInfo.name}, Dubai. Full staff list with license types and facility details, sourced from the official Sheryan Medical Registry.`,
    alternates: {
      canonical: `${base}/professionals/area/${areaInfo.slug}/${spec.slug}`,
    },
    openGraph: {
      title: `Best ${spec.name} in ${areaInfo.name}, Dubai`,
      description: `${count.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals in ${areaInfo.name}.`,
      url: `${base}/professionals/area/${areaInfo.slug}/${spec.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function AreaSpecialtyPage({ params }: Props) {
  const areaInfo = DUBAI_AREAS.find((a) => a.slug === params.area);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!areaInfo || !spec) notFound();

  const professionals = getProfessionalsByAreaAndSpecialty(
    params.area,
    params.specialty
  );
  if (professionals.length === 0) notFound();

  const base = getBaseUrl();

  // License type breakdown
  let ftlCount = 0;
  let regCount = 0;
  for (const p of professionals) {
    if (p.licenseType === "FTL") ftlCount++;
    if (p.licenseType === "REG") regCount++;
  }

  // Top facilities for this specialty in this area
  const facilityCounts: Record<
    string,
    { name: string; slug: string; count: number }
  > = {};
  for (const p of professionals) {
    if (p.facilityName) {
      if (!facilityCounts[p.facilitySlug]) {
        facilityCounts[p.facilitySlug] = {
          name: p.facilityName,
          slug: p.facilitySlug,
          count: 0,
        };
      }
      facilityCounts[p.facilitySlug].count++;
    }
  }
  const topFacilities = Object.values(facilityCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Full listing sorted alphabetically
  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Professionals", url: `${base}/professionals` },
          {
            name: areaInfo.name,
            url: `${base}/professionals/area/${areaInfo.slug}`,
          },
          { name: spec.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.name} in ${areaInfo.name}, Dubai`,
          description: `${professionals.length.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals in ${areaInfo.name}, Dubai.`,
          url: `${base}/professionals/area/${areaInfo.slug}/${spec.slug}`,
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          mainEntity: {
            "@type": "Place",
            name: areaInfo.name,
            containedInPlace: {
              "@type": "City",
              name: "Dubai",
              addressCountry: "AE",
            },
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          {
            label: areaInfo.name,
            href: `/professionals/area/${areaInfo.slug}`,
          },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.name} in {areaInfo.name}, Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString()} Licensed{" "}
          {professionals.length === 1 ? "Professional" : "Professionals"}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            There are {professionals.length.toLocaleString()} DHA-licensed{" "}
            {spec.name.toLowerCase()} professionals practicing in{" "}
            {areaInfo.name}, Dubai
            {ftlCount > 0 && regCount > 0
              ? `, including ${ftlCount.toLocaleString()} with full trade licenses (FTL) and ${regCount.toLocaleString()} with regular licenses (REG)`
              : ""}
            . They work across {topFacilities.length}{" "}
            {topFacilities.length === 1 ? "facility" : "facilities"}
            {topFacilities.length > 0
              ? `, with the largest concentration at ${topFacilities[0].name} (${topFacilities[0].count} staff)`
              : ""}
            . All data sourced from the official DHA Sheryan Medical Registry.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {professionals.length.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              {spec.name}
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-4 text-center">
            <p className="text-2xl font-bold text-[#006828]">
              {topFacilities.length}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Facilities
            </p>
          </div>
          {ftlCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {ftlCount.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                FTL licenses
              </p>
            </div>
          )}
          {regCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {regCount.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                REG licenses
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Facilities */}
      {topFacilities.length > 1 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top Facilities for {spec.name} in {areaInfo.name}
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Facility
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    {spec.name} Staff
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

      {/* Full Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          All {spec.name} Professionals — A-Z
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        {professionals.length.toLocaleString()} licensed {spec.name.toLowerCase()}{" "}
        professionals in {areaInfo.name}, sorted alphabetically.
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                License
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Facility
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProfessionals.map((pro) => (
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
                      {pro.facilityName}
                    </Link>
                  ) : (
                    <span className="text-xs text-black/40">
                      {pro.facilityName || "--"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/professionals/area/${areaInfo.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View all professionals in {areaInfo.name} &rarr;
        </Link>
        <Link
          href={`/professionals/${spec.category}/${spec.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View all {spec.name} in Dubai &rarr;
        </Link>
        <Link
          href="/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          Back to Professional Directory &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. This directory is for informational purposes
          only. Verify professional credentials directly with DHA before making
          healthcare decisions.
        </p>
      </div>
    </div>
  );
}
