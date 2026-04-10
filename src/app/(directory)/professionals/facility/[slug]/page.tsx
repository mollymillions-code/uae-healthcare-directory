import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacility,
  getFacilityProfile,
  getAllFacilitySlugs,
} from "@/lib/professionals";
import { PROFESSIONAL_CATEGORIES } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllFacilitySlugs(20).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  if (!profile) {
    return {
      title: "Healthcare Facility — Staff Directory",
      description: "View the full licensed staff directory for this healthcare facility in Dubai.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `${profile.name} — Healthcare Team Directory | ${profile.totalStaff.toLocaleString()} Licensed Staff`,
    description: `View the full staff directory for ${profile.name} in Dubai. ${profile.totalStaff.toLocaleString()} DHA-licensed professionals including ${Object.entries(profile.categories).map(([slug, count]) => { const cat = PROFESSIONAL_CATEGORIES.find((c) => c.slug === slug); return `${count.toLocaleString()} ${cat?.name.toLowerCase() || slug}`; }).join(", ")}. Sourced from the official Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/professionals/facility/${profile.slug}` },
    openGraph: {
      title: `${profile.name} — Healthcare Team Directory`,
      description: `${profile.totalStaff.toLocaleString()} DHA-licensed professionals at ${profile.name}.`,
      url: `${base}/professionals/facility/${profile.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function FacilityStaffPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  const professionals = getProfessionalsByFacility(params.slug);
  const base = getBaseUrl();

  if (!profile || professionals.length === 0) {
    notFound();
  }

  // Category breakdown
  const categoryBreakdown = PROFESSIONAL_CATEGORIES.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    count: profile.categories[cat.slug] || 0,
  })).filter((c) => c.count > 0);

  // Specialties with 3+ professionals
  const qualifyingSpecialties = profile.topSpecialties.filter((s) => s.count >= 3);

  // Staff table — show first 200
  const displayLimit = 200;
  const sortedProfessionals = [...professionals].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const displayProfessionals = sortedProfessionals.slice(0, displayLimit);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Professionals", url: `${base}/professionals` },
          { name: profile.name },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: profile.name,
          url: `${base}/professionals/facility/${profile.slug}`,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: profile.totalStaff,
          },
          description: `${profile.name} employs ${profile.totalStaff.toLocaleString()} DHA-licensed healthcare professionals in Dubai.`,
          areaServed: {
            "@type": "City",
            name: "Dubai",
            addressCountry: "AE",
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: profile.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {profile.totalStaff.toLocaleString()} DHA-Licensed Staff
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {profile.name} has {profile.totalStaff.toLocaleString()} healthcare professionals
            licensed by the Dubai Health Authority. The team includes{" "}
            {categoryBreakdown
              .map((c) => `${c.count.toLocaleString()} ${c.name.toLowerCase()}`)
              .join(", ")}
            {qualifyingSpecialties.length > 0
              ? ` across ${qualifyingSpecialties.length} specialties`
              : ""}
            . All data sourced from the official DHA Sheryan Medical Registry.
          </p>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {categoryBreakdown.map(({ name, count }) => (
            <div key={name} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {count.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Specialties */}
      {qualifyingSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Specialties at {profile.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {qualifyingSpecialties.map((spec) => (
              <Link
                key={spec.slug}
                href={`/professionals/facility/${profile.slug}/${spec.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                  {spec.name}
                </h3>
                <p className="text-[11px] text-black/40">
                  {spec.count.toLocaleString()} professionals
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Full Staff Listing */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Staff Directory — A-Z
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing {displayLimit < professionals.length ? `first ${displayLimit} of ` : ""}
        {professionals.length.toLocaleString()} licensed professionals at {profile.name},
        sorted alphabetically.
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Category
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden md:table-cell">
                Specialty
              </th>
              <th scope="col" className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                License
              </th>
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
                  <span className="text-xs text-black/40">{pro.category}</span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-xs text-black/40">
                    {pro.specialty || "--"}
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
      {professionals.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          Showing {displayLimit} of {professionals.length.toLocaleString()} professionals.
          Browse by specialty above to see the full list.
        </p>
      )}

      {/* Cross-link to facility directory */}
      <div className="border-t border-black/[0.06] pt-6 mb-8">
        <Link
          href={`/directory/dubai?q=${encodeURIComponent(profile.name)}`}
          className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View {profile.name} on our facility directory &rarr;
        </Link>
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
