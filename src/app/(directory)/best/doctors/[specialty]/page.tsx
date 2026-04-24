import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getTopProfessionalsBySpecialty,
  getTopFacilitiesForSpecialty,
  getSpecialtyStats,
} from "@/lib/professionals";
import {
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";
import { breadcrumbSchema, faqPageSchema, medicalWebPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];

function getDoctorSpecialtyBySlug(slug: string) {
  return DOCTOR_SPECIALTIES.find((s) => s.slug === slug);
}

interface Props {
  params: { specialty: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return DOCTOR_SPECIALTIES.map((s) => ({ specialty: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const spec = getDoctorSpecialtyBySlug(params.specialty);
  if (!spec) return {};

  const base = getBaseUrl();
  const url = `${base}/best/doctors/${spec.slug}`;
  const isDentist = spec.category === "dentists";
  const doctorLabel = isDentist ? "Dentists" : "Doctors";
  const title = `Best ${spec.name} in Dubai 2026 \u2014 Top 10 ${spec.name} ${doctorLabel}`;
  const description = `Find the best ${spec.name.toLowerCase()} in Dubai. Top 10 ${spec.name.toLowerCase()} ${doctorLabel.toLowerCase()} ranked by institutional capacity, plus the leading hospitals and clinics for ${spec.name.toLowerCase()} in Dubai. ${spec.count.toLocaleString()} DHA-licensed professionals. Data from the official Sheryan Medical Registry.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function BestDoctorsBySpecialtyPage({ params }: Props) {
  const spec = getDoctorSpecialtyBySlug(params.specialty);
  if (!spec) notFound();

  const base = getBaseUrl();
  const isDentist = spec.category === "dentists";
  const doctorLabel = isDentist ? "dentists" : "doctors";
  const doctorLabelCap = isDentist ? "Dentists" : "Doctors";

  const topProfessionals = getTopProfessionalsBySpecialty(spec.slug, 10);
  const topFacilities = getTopFacilitiesForSpecialty(spec.slug, 10);
  const stats = getSpecialtyStats(spec.slug);

  // Related specialties (same category, excluding current)
  const relatedSpecialties = getSpecialtiesByCategory(spec.category)
    .filter((s) => s.slug !== spec.slug && DOCTOR_SPECIALTIES.some((d) => d.slug === s.slug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Build FAQs from data
  const faqs = [
    {
      question: `How many ${spec.name.toLowerCase()} ${doctorLabel} are there in Dubai?`,
      answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${stats.totalProfessionals.toLocaleString()} licensed ${spec.name.toLowerCase()} professionals practicing in Dubai across ${stats.totalFacilities.toLocaleString()} healthcare facilities. Of these, ${stats.ftlCount.toLocaleString()} hold a full-time license (FTL) and ${stats.regCount.toLocaleString()} are registered (REG). Data sourced from the DHA Sheryan Medical Registry.`,
    },
    {
      question: `What is the best hospital for ${spec.name.toLowerCase()} in Dubai?`,
      answer: stats.topFacilities[0]
        ? `Based on staff count, ${stats.topFacilities[0].name} has the largest ${spec.name.toLowerCase()} department in Dubai with ${stats.topFacilities[0].count} licensed ${spec.name.toLowerCase()} professionals on staff${stats.topFacilities[1] ? `, followed by ${stats.topFacilities[1].name} (${stats.topFacilities[1].count} staff)` : ""}. Larger departments typically offer more sub-specialty coverage, peer review, and 24/7 availability.`
        : `Browse the facility rankings above to find the leading hospitals for ${spec.name.toLowerCase()} in Dubai.`,
    },
    {
      question: `How are the best ${spec.name.toLowerCase()} ${doctorLabel} in Dubai ranked?`,
      answer: `${spec.name} ${doctorLabel} are ranked by institutional capacity \u2014 professionals at larger DHA-registered healthcare facilities appear higher. Only doctors with a full-time license (FTL) are included. This methodology uses verifiable data from the DHA Sheryan Medical Registry rather than subjective patient reviews or paid placements.`,
    },
    {
      question: `What is the difference between a ${spec.name.toLowerCase()} specialist and consultant?`,
      answer: `A ${spec.name} Specialist has completed specialty training and holds a DHA specialty license. A ${spec.name} Consultant is a more senior title requiring 10+ years of post-specialty clinical experience. Both are fully licensed to practice in Dubai, but Consultant status indicates greater seniority and expertise. In the DHA Sheryan Registry, both levels are tracked separately.`,
    },
    {
      question: `How do I verify a ${spec.name.toLowerCase()} doctor's license in Dubai?`,
      answer: `You can verify any ${spec.name.toLowerCase()} doctor's license through the Dubai Health Authority website (dha.gov.ae) or the Sheryan portal. Search by doctor name or license number to confirm their license status, specialty, and current facility affiliation. All ${stats.totalProfessionals.toLocaleString()} ${spec.name.toLowerCase()} professionals listed here are verified against the Sheryan Medical Registry.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD: MedicalWebPage */}
      <JsonLd
        data={medicalWebPageSchema(
          `Best ${spec.name} in Dubai 2026`,
          `Top 10 ${spec.name.toLowerCase()} ${doctorLabel} in Dubai ranked by institutional capacity. ${stats.totalProfessionals.toLocaleString()} DHA-licensed professionals.`,
          PROFESSIONAL_STATS.scraped
        )}
      />
      {/* JSON-LD: ItemList for ranking */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Best ${spec.name} ${doctorLabelCap} in Dubai 2026`,
          numberOfItems: topProfessionals.length,
          itemListElement: topProfessionals.map((pro, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Physician",
              name: pro.name,
              medicalSpecialty: spec.name,
              worksFor: {
                "@type": "MedicalOrganization",
                name: pro.facilityName,
              },
              hasCredential: {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: pro.licenseType === "FTL" ? "Full-Time License" : "Registration",
                recognizedBy: {
                  "@type": "Organization",
                  name: "Dubai Health Authority (DHA)",
                },
              },
            },
          })),
        }}
      />
      {/* JSON-LD: Breadcrumb */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Best Doctors", url: `${base}/best/doctors` },
          { name: spec.name },
        ])}
      />
      {/* JSON-LD: FAQPage */}
      <JsonLd data={faqPageSchema(faqs)} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Best Doctors", href: "/best/doctors" },
          { label: spec.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best {spec.name} in Dubai 2026
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Top 10 {spec.name} {doctorLabelCap} &middot;{" "}
          {stats.totalProfessionals.toLocaleString()} Licensed Professionals
        </p>

        {/* Editorial intro */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Dubai has {stats.totalProfessionals.toLocaleString()} DHA-licensed{" "}
            {spec.name.toLowerCase()} {doctorLabel} practicing across{" "}
            {stats.totalFacilities.toLocaleString()} healthcare facilities. The
            ranking below identifies the top 10 based on institutional
            capacity &mdash; {doctorLabel} at{" "}
            {stats.topFacilities[0]?.name || "major hospitals"},{" "}
            {stats.topFacilities[1]?.name || "leading clinics"}, and other large
            DHA-registered facilities rank highest. Of all{" "}
            {spec.name.toLowerCase()} professionals in Dubai,{" "}
            {stats.ftlCount.toLocaleString()} hold a full-time license (FTL) and{" "}
            {stats.regCount.toLocaleString()} are registered (REG). All data is
            sourced from the official Sheryan Medical Registry maintained by the
            Dubai Health Authority.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              value: stats.totalProfessionals.toLocaleString(),
              label: `Total ${spec.name.toLowerCase()}`,
            },
            {
              value: stats.totalFacilities.toLocaleString(),
              label: "Facilities",
            },
            {
              value: stats.ftlCount.toLocaleString(),
              label: "Full-time licensed",
            },
            {
              value: stats.regCount.toLocaleString(),
              label: "Registered",
            },
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

      {/* Top 10 Professionals Table */}
      {topProfessionals.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top 10 {spec.name} {doctorLabelCap} in Dubai
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-3 w-12">
                    #
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Name
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Facility
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                    License
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProfessionals.map((pro, i) => (
                  <tr key={pro.id} className="border-b border-black/[0.06]">
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[#006828] text-white font-['Geist_Mono',monospace] text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">
                        {pro.name}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/professionals/facility/${pro.facilitySlug}`}
                        className="font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors"
                      >
                        {pro.facilityName || "\u2014"}
                      </Link>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                        {pro.licenseType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top 10 Hospitals/Clinics for this Specialty */}
      {topFacilities.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Top 10 Hospitals & Clinics for {spec.name}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1c1c1c]">
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-3 w-12">
                    #
                  </th>
                  <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    Facility
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                    {spec.name} Staff
                  </th>
                  <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden sm:table-cell">
                    Total Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {topFacilities.map((fac, i) => (
                  <tr
                    key={fac.slug}
                    className="border-b border-black/[0.06]"
                  >
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[#f8f8f6] text-[#1c1c1c] font-['Geist_Mono',monospace] text-xs font-bold border border-black/[0.06]">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/professionals/facility/${fac.slug}/${spec.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {fac.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-sm font-bold text-[#006828]">
                        {fac.count.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell">
                      <span className="font-['Geist',sans-serif] text-sm text-black/40">
                        {fac.totalStaff.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How We Rank */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How We Rank {spec.name} {doctorLabelCap}
          </h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            The {spec.name.toLowerCase()} ranking is based on{" "}
            <strong>facility size</strong> as reported in the DHA Sheryan
            Medical Registry. Doctors at larger DHA-registered facilities are
            ranked higher because larger institutions typically maintain stricter
            credentialing, multi-disciplinary peer review committees, and
            JCI/CBAHI accreditation standards.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            Only <strong>FTL (Full-Time License)</strong> holders are included.
            This ensures the ranking reflects dedicated, full-time{" "}
            {spec.name.toLowerCase()} practitioners rather than part-time
            registrations or visiting privileges.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            This methodology avoids the unreliability of subjective patient
            reviews and the bias of paid placements. It instead relies on
            verifiable institutional data from the Dubai Health Authority.
          </p>
        </div>
      </section>

      {/* Related Directory Category */}
      {spec.relatedDirectoryCategory && (
        <section className="mb-10">
          <div className="border border-black/[0.06] p-4">
            <Link
              href={`/directory/dubai/${spec.relatedDirectoryCategory}`}
              className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#006828] hover:underline"
            >
              Browse {spec.name.toLowerCase()} clinics and hospitals in Dubai
              &rarr;
            </Link>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Find{" "}
              {spec.relatedDirectoryCategory.replace(/-/g, " ")} facilities with
              ratings, insurance plans, and contact details.
            </p>
          </div>
        </section>
      )}

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`Best ${spec.name} in Dubai \u2014 FAQ`}
      />

      {/* Related Specialties */}
      {relatedSpecialties.length > 0 && (
        <section className="mb-10 mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Related {isDentist ? "Dental" : "Medical"} Specialties
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedSpecialties.map((rel) => (
              <Link
                key={rel.slug}
                href={`/best/doctors/${rel.slug}`}
                className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  Best {rel.name}
                </p>
                <p className="text-[11px] text-black/40 mt-1">
                  {rel.count.toLocaleString()} {doctorLabel}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cross-links */}
      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/best/doctors"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              &larr; All Doctor Specialties
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Browse all {DOCTOR_SPECIALTIES.length} physician and dental
              specialties
            </p>
          </Link>
          <Link
            href={`/professionals/${spec.category}/${spec.slug}`}
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              Full {spec.name} Directory &rarr;
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              All {stats.totalProfessionals.toLocaleString()}{" "}
              {spec.name.toLowerCase()} professionals listed
            </p>
          </Link>
        </div>
      </section>

      {/* DHA Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data sourced {PROFESSIONAL_STATS.scraped}.
          Rankings are based on institutional capacity and do not constitute
          medical advice or endorsement. Verify professional credentials
          directly with DHA (dha.gov.ae) before making healthcare decisions.
          There are no paid placements or sponsored rankings on this page.
        </p>
      </div>
    </div>
  );
}
