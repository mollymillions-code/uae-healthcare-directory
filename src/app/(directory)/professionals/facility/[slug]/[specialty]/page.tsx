import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacilityAndSpecialty,
  getFacilityProfile,
  getFacilitySpecialtyCombos,
} from "@/lib/professionals";
import { getSpecialtyBySlug } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string; specialty: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getFacilitySpecialtyCombos(5).map((combo) => ({
    slug: combo.facilitySlug,
    specialty: combo.specialtySlug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  const spec = getSpecialtyBySlug(params.specialty);
  if (!profile || !spec) {
    return {
      title: "Facility Specialty — Staff Directory",
      description: "View licensed professionals by specialty at this healthcare facility in Dubai.",
    };
  }
  const professionals = getProfessionalsByFacilityAndSpecialty(params.slug, params.specialty);
  const count = professionals.length;
  const base = getBaseUrl();
  return {
    title: count > 0
      ? `${spec.name} at ${profile.name} — ${count.toLocaleString()} Licensed ${count === 1 ? "Professional" : "Professionals"}`
      : `${spec.name} at ${profile.name}`,
    description: count > 0
      ? `${count.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals at ${profile.name} in Dubai. Browse the full staff list with license types, sourced from the official Sheryan Medical Registry.`
      : `Looking for ${spec.name.toLowerCase()} professionals at ${profile.name}? No staff currently listed for this specialty.`,
    // noindex when zero professionals — empty page has no unique value
    ...(count === 0 ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: `${base}/professionals/facility/${profile.slug}/${spec.slug}`,
    },
    openGraph: {
      title: `${spec.name} at ${profile.name}`,
      description: `${count.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals at ${profile.name}.`,
      url: `${base}/professionals/facility/${profile.slug}/${spec.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function FacilitySpecialtyPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  const spec = getSpecialtyBySlug(params.specialty);
  const professionals = getProfessionalsByFacilityAndSpecialty(
    params.slug,
    params.specialty
  );
  const base = getBaseUrl();

  if (!profile || !spec || professionals.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Directory", href: "/directory" },
            { label: "Professionals", href: "/professionals" },
            { label: "Facility" },
          ]}
        />
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          No Results Found
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-8">
          No professionals were found for this facility and specialty combination.
          The facility may not employ this specialty, or the data may use a different classification.
        </p>
        <Link
          href="/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          Back to Professional Directory
        </Link>
      </div>
    );
  }

  // License type breakdown
  let ftlCount = 0;
  let regCount = 0;
  for (const p of professionals) {
    if (p.licenseType === "FTL") ftlCount++;
    if (p.licenseType === "REG") regCount++;
  }

  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Professionals", url: `${base}/professionals` },
          { name: profile.name, url: `${base}/professionals/facility/${profile.slug}` },
          { name: spec.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${spec.name} at ${profile.name}`,
          description: `${professionals.length.toLocaleString()} DHA-licensed ${spec.name.toLowerCase()} professionals at ${profile.name} in Dubai.`,
          url: `${base}/professionals/facility/${profile.slug}/${spec.slug}`,
          about: {
            "@type": "MedicalSpecialty",
            name: spec.name,
          },
          mainEntity: {
            "@type": "MedicalBusiness",
            name: profile.name,
            numberOfEmployees: {
              "@type": "QuantitativeValue",
              value: profile.totalStaff,
            },
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Professionals", href: "/professionals" },
          { label: profile.name, href: `/professionals/facility/${profile.slug}` },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {spec.name} at {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {professionals.length.toLocaleString()} Licensed{" "}
          {professionals.length === 1 ? "Professional" : "Professionals"}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {profile.name} has {professionals.length.toLocaleString()} DHA-licensed{" "}
            {spec.name.toLowerCase()} professionals on its team
            {ftlCount > 0 && regCount > 0
              ? `, including ${ftlCount.toLocaleString()} with full trade licenses (FTL) and ${regCount.toLocaleString()} with regular licenses (REG)`
              : ""}
            . This facility has {profile.totalStaff.toLocaleString()} total licensed staff
            across all specialties.
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
              {profile.totalStaff.toLocaleString()}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">Total facility staff</p>
          </div>
          {ftlCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {ftlCount.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">FTL licenses</p>
            </div>
          )}
          {regCount > 0 && (
            <div className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {regCount.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">REG licenses</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {spec.name} Professionals — A-Z
        </h2>
      </div>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Specialty Detail
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                License
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProfessionals.map((pro) => (
              <tr key={pro.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {pro.name}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden sm:table-cell">
                  <span className="text-xs text-black/40">
                    {pro.specialty || spec.name}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {pro.licenseType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href={`/professionals/facility/${profile.slug}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View all {profile.totalStaff.toLocaleString()} staff at {profile.name} &rarr;
        </Link>
        {spec.category && (
          <Link
            href={`/professionals/${spec.category}/${spec.slug}`}
            className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
          >
            View all {spec.name} professionals in Dubai &rarr;
          </Link>
        )}
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
