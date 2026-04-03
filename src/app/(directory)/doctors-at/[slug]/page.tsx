import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getProfessionalsByFacility,
  getFacilityProfile,
  getAllFacilities,
} from "@/lib/professionals";
import { ALL_SPECIALTIES, PROFESSIONAL_STATS } from "@/lib/constants/professionals";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

const DOCTOR_CATEGORIES = new Set(["physicians", "dentists"]);

export function generateStaticParams() {
  return getAllFacilities(5)
    .slice(0, 50)
    .map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const profile = getFacilityProfile(params.slug);
  if (!profile) {
    return {
      title: "Doctors at Healthcare Facility, Dubai | Zavis",
      description:
        "Find doctors at this healthcare facility in Dubai. Licensed physicians and dentists sourced from the DHA Sheryan Medical Registry.",
    };
  }

  const allProfessionals = getProfessionalsByFacility(params.slug);
  const doctorCount = allProfessionals.filter(
    (p) => DOCTOR_CATEGORIES.has(p.categorySlug)
  ).length;
  const base = getBaseUrl();

  return {
    title: `Doctors at ${profile.name}, Dubai — ${doctorCount.toLocaleString()} Licensed Professionals | Zavis`,
    description: `Find ${doctorCount.toLocaleString()} licensed doctors at ${profile.name} in Dubai. Browse physicians and dentists by specialty and license type. All data sourced from the DHA Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/doctors-at/${profile.slug}` },
    keywords: [
      `doctors at ${profile.name}`,
      `${profile.name} doctors list`,
      `${profile.name} staff`,
      `${profile.name} physicians`,
      `${profile.name} specialists`,
    ],
    openGraph: {
      title: `Doctors at ${profile.name}, Dubai — ${doctorCount.toLocaleString()} Licensed Professionals`,
      description: `${doctorCount.toLocaleString()} licensed doctors practicing at ${profile.name}. Browse by specialty, license type, and seniority level.`,
      url: `${base}/doctors-at/${profile.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function DoctorsAtPage({ params }: Props) {
  const profile = getFacilityProfile(params.slug);
  if (!profile) notFound();

  const allProfessionals = getProfessionalsByFacility(params.slug);
  if (allProfessionals.length === 0) notFound();

  const base = getBaseUrl();

  // Filter to only physicians and dentists
  const doctors = allProfessionals.filter((p) =>
    DOCTOR_CATEGORIES.has(p.categorySlug)
  );
  const physicianCount = allProfessionals.filter(
    (p) => p.categorySlug === "physicians"
  ).length;
  const dentistCount = allProfessionals.filter(
    (p) => p.categorySlug === "dentists"
  ).length;

  // Doctor specialties — only physician/dentist categories
  const specCounts: Record<string, number> = {};
  for (const d of doctors) {
    if (d.specialtySlug) {
      specCounts[d.specialtySlug] = (specCounts[d.specialtySlug] || 0) + 1;
    }
  }
  const doctorSpecialties = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => {
      const spec = ALL_SPECIALTIES.find((s) => s.slug === slug);
      return { slug, name: spec?.name || slug, count };
    });

  // Sort doctors alphabetically for listing
  const sortedDoctors = [...doctors].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const displayLimit = 100;
  const displayDoctors = sortedDoctors.slice(0, displayLimit);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: `Doctors at ${profile.name}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: profile.name,
          url: `${base}/doctors-at/${profile.slug}`,
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: doctors.length,
            unitText: "doctors",
          },
          description: `${profile.name} has ${doctors.length.toLocaleString()} licensed doctors (physicians and dentists) practicing in Dubai.`,
          employee: displayDoctors.slice(0, 20).map((d) => ({
            "@type": "Physician",
            name: d.name,
            medicalSpecialty: d.specialty || undefined,
            hasCredential: {
              "@type": "EducationalOccupationalCredential",
              credentialCategory: `DHA ${d.licenseType}`,
            },
          })),
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
          { label: `Doctors at ${profile.name}` },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Doctors at {profile.name}
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {doctors.length.toLocaleString()} Licensed Doctors &middot; Dubai
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            {profile.name} has{" "}
            <strong>{doctors.length.toLocaleString()}</strong> licensed doctors
            (physicians and dentists) on record with the Dubai Health Authority.
            {physicianCount > 0 && (
              <> This includes {physicianCount.toLocaleString()} physicians</>
            )}
            {dentistCount > 0 && (
              <> and {dentistCount.toLocaleString()} dentists</>
            )}
            {doctorSpecialties.length > 0 && (
              <> across {doctorSpecialties.length} specialties</>
            )}
            . The facility has {profile.totalStaff.toLocaleString()} total licensed staff
            including nurses and allied health professionals. Data sourced from the
            official DHA Sheryan Medical Professional Registry (
            {PROFESSIONAL_STATS.scraped}).
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: doctors.length.toLocaleString(), label: "Licensed doctors" },
            { value: physicianCount.toLocaleString(), label: "Physicians" },
            { value: dentistCount.toLocaleString(), label: "Dentists" },
            { value: doctorSpecialties.length.toString(), label: "Specialties" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">{value}</p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctors by Specialty */}
      {doctorSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Doctors by Specialty
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {doctorSpecialties.map((spec) => {
              const fullSpec = ALL_SPECIALTIES.find((s) => s.slug === spec.slug);
              const catSlug = fullSpec?.category || "physicians";
              return (
                <Link
                  key={spec.slug}
                  href={`/professionals/facility/${profile.slug}/${spec.slug}`}
                  className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
                >
                  <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-[11px] text-black/40">
                    {spec.count} doctor{spec.count !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[10px] text-black/25 mt-0.5">
                    {catSlug === "dentists" ? "Dental" : "Medical"}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Doctor Listing Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Doctor Directory — A-Z
        </h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
        Showing{" "}
        {displayLimit < doctors.length
          ? `first ${displayLimit} of `
          : ""}
        {doctors.length.toLocaleString()} licensed doctors at {profile.name},
        sorted alphabetically.
      </p>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Name
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Specialty
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                License
              </th>
            </tr>
          </thead>
          <tbody>
            {displayDoctors.map((doc) => (
              <tr key={doc.id} className="border-b border-black/[0.06]">
                <td className="py-2.5 pr-4">
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] tracking-tight">
                    {doc.name}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden sm:table-cell">
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    {doc.specialty || "--"}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                    {doc.licenseType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {doctors.length > displayLimit && (
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-8">
          Showing {displayLimit} of {doctors.length.toLocaleString()} doctors.
          View the full staff directory for all professionals including nurses
          and allied health.
        </p>
      )}

      {/* Top Specialties */}
      {doctorSpecialties.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Most Common Doctor Specialties
            </h2>
          </div>
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                    #
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Specialty
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Doctors
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                    % of Doctors
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctorSpecialties.slice(0, 15).map((spec, i) => {
                  const pct =
                    doctors.length > 0
                      ? ((spec.count / doctors.length) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr
                      key={spec.slug}
                      className="border-b border-black/[0.06]"
                    >
                      <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                          {spec.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                          {spec.count}
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
        </>
      )}

      {/* Cross-links */}
      <div className="border-t border-black/[0.06] pt-6 mb-4 space-y-2">
        <Link
          href={`/professionals/facility/${profile.slug}`}
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          View full staff directory at {profile.name} ({profile.totalStaff.toLocaleString()} total staff including nurses and allied health) &rarr;
        </Link>
        <Link
          href={`/directory/dubai?q=${encodeURIComponent(profile.name)}`}
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          Search {profile.name} in the facility directory &rarr;
        </Link>
        <Link
          href="/professionals"
          className="block font-['Geist',sans-serif] text-sm text-[#006828] hover:underline"
        >
          Browse all {PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals in Dubai &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4 mt-8">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. This
          directory is for informational purposes only and does not constitute
          medical advice. Verify professional credentials directly with DHA
          before making healthcare decisions.
        </p>
      </div>
    </div>
  );
}
