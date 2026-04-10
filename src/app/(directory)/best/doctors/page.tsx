import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  PROFESSIONAL_STATS,
} from "@/lib/constants/professionals";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const DOCTOR_SPECIALTIES = [...PHYSICIAN_SPECIALTIES, ...DENTIST_SPECIALTIES];
const TOTAL_DOCTORS = PROFESSIONAL_STATS.physicians + PROFESSIONAL_STATS.dentists;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const url = `${base}/best/doctors`;
  const title =
    "Best Doctors in Dubai 2026 \u2014 Top DHA-Licensed Physicians by Specialty";
  const description = `Find the best doctors in Dubai across ${DOCTOR_SPECIALTIES.length} medical specialties. ${TOTAL_DOCTORS.toLocaleString()} DHA-licensed physicians and dentists ranked by institutional capacity, sourced from the official Sheryan Medical Registry.`;

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

export default function BestDoctorsHubPage() {
  const base = getBaseUrl();

  const faqs = [
    {
      question: "How are the best doctors in Dubai ranked?",
      answer: `Doctors are ranked by institutional capacity \u2014 professionals practicing at larger DHA-registered facilities are ranked higher. Larger facilities undergo more rigorous peer review, quality assurance, and credentialing processes. Only doctors holding a full-time license (FTL) from the Dubai Health Authority are included in the rankings. This methodology avoids subjective reviews and instead relies on verifiable institutional data from the DHA Sheryan Medical Registry.`,
    },
    {
      question: "What does DHA licensing mean?",
      answer:
        "The Dubai Health Authority (DHA) is the regulatory body overseeing all healthcare activities in Dubai. Every doctor practicing in Dubai must hold a valid DHA license, issued through the Sheryan system after verifying medical qualifications, experience, and professional standing. A DHA license confirms that a doctor has met the minimum standards required to practice medicine in Dubai. There are two main license types: FTL (Full-Time License) for doctors practicing full-time at a single facility, and REG (Registration) for doctors with part-time or visiting privileges.",
    },
    {
      question: "How do I verify a doctor's credentials?",
      answer:
        "You can verify any doctor's DHA license status through the official Dubai Health Authority website (dha.gov.ae) or the Sheryan portal. Search by doctor name or license number to confirm their license type, specialty, and facility affiliation. The UAE Open Healthcare Directory sources its data directly from the Sheryan Medical Registry and displays license type (FTL or REG) for every listed professional.",
    },
    {
      question: "What is the difference between specialist and consultant?",
      answer:
        "In the UAE healthcare system, a Specialist is a doctor who has completed specialty training (typically a residency) and holds a specialty license from DHA. A Consultant is a more senior title requiring additional years of experience beyond the specialist level \u2014 usually 10+ years of post-specialty practice. Consultants are often department heads or senior clinicians. Both Specialists and Consultants hold DHA licenses, but Consultant status reflects greater clinical experience and seniority.",
    },
    {
      question: "How many doctors practice in Dubai?",
      answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${PROFESSIONAL_STATS.physicians.toLocaleString()} licensed physicians and ${PROFESSIONAL_STATS.dentists.toLocaleString()} licensed dentists practicing in Dubai, according to the DHA Sheryan Medical Registry. This totals ${TOTAL_DOCTORS.toLocaleString()} doctors across ${DOCTOR_SPECIALTIES.length} specialties at ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} healthcare facilities. Dubai has one of the highest doctor-to-population ratios in the Middle East.`,
    },
    {
      question: "What are the most common medical specialties in Dubai?",
      answer: `The most common medical specialties in Dubai by licensed doctor count are: General Practitioner (${PHYSICIAN_SPECIALTIES[0].count.toLocaleString()}), General Dentist (${DENTIST_SPECIALTIES[0].count.toLocaleString()}), Obstetrics & Gynecology (${PHYSICIAN_SPECIALTIES[1].count.toLocaleString()}), Pediatrics (${PHYSICIAN_SPECIALTIES[2].count.toLocaleString()}), Family Medicine (${PHYSICIAN_SPECIALTIES[3].count.toLocaleString()}), and Dermatology (${PHYSICIAN_SPECIALTIES[4].count.toLocaleString()}). Surgical specialties like Orthopedic Surgery (${PHYSICIAN_SPECIALTIES[7].count.toLocaleString()}) and General Surgery (${PHYSICIAN_SPECIALTIES[8].count.toLocaleString()}) are also well represented.`,
    },
  ];

  const physiciansSorted = [...PHYSICIAN_SPECIALTIES].sort(
    (a, b) => b.count - a.count
  );
  const dentistsSorted = [...DENTIST_SPECIALTIES].sort(
    (a, b) => b.count - a.count
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Best Doctors in Dubai 2026",
          description: `Find the best doctors in Dubai across ${DOCTOR_SPECIALTIES.length} specialties. ${TOTAL_DOCTORS.toLocaleString()} DHA-licensed physicians and dentists.`,
          url: `${base}/best/doctors`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: DOCTOR_SPECIALTIES.length,
            itemListElement: DOCTOR_SPECIALTIES.map((spec, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: `Best ${spec.name} in Dubai`,
                url: `${base}/best/doctors/${spec.slug}`,
              },
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Best Doctors" },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Best Doctors" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Best Doctors in Dubai 2026
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {TOTAL_DOCTORS.toLocaleString()} DHA-Licensed Physicians & Dentists
          &middot; {DOCTOR_SPECIALTIES.length} Specialties
        </p>

        {/* Editorial intro */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Finding the best doctor in Dubai starts with verified data, not
            marketing claims. This directory ranks{" "}
            {TOTAL_DOCTORS.toLocaleString()} DHA-licensed physicians and dentists
            across {DOCTOR_SPECIALTIES.length} medical specialties using
            institutional capacity data from the official Sheryan Medical
            Registry. Doctors at larger, established healthcare facilities are
            ranked higher{" "}
            <span className="text-black/40">
              &mdash; because facility size correlates with peer review
              standards, multi-disciplinary oversight, and accreditation rigor.
            </span>{" "}
            Select a specialty below to see the top 10 doctors and the leading
            hospitals for that field.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.physicians.toLocaleString(),
              label: "Licensed physicians",
            },
            {
              value: PROFESSIONAL_STATS.dentists.toLocaleString(),
              label: "Licensed dentists",
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(),
              label: "Healthcare facilities",
            },
            {
              value: PROFESSIONAL_STATS.scraped,
              label: "Data source date",
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

      {/* Physician Specialties Grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Physician Specialties
          </h2>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {PHYSICIAN_SPECIALTIES.length} specialties
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {physiciansSorted.map((spec) => (
            <Link
              key={spec.slug}
              href={`/best/doctors/${spec.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.name}
              </h3>
              <p className="text-sm font-bold text-[#006828] mb-2">
                {spec.count.toLocaleString()} doctors
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                View Top 10 &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Dentist Specialties Grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Dental Specialties
          </h2>
          <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
            {DENTIST_SPECIALTIES.length} specialties
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dentistsSorted.map((spec) => (
            <Link
              key={spec.slug}
              href={`/best/doctors/${spec.slug}`}
              className="border border-black/[0.06] p-5 hover:border-[#006828]/15 transition-colors group"
            >
              <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                {spec.name}
              </h3>
              <p className="text-sm font-bold text-[#006828] mb-2">
                {spec.count.toLocaleString()} dentists
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">
                View Top 10 &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} title="Best Doctors in Dubai \u2014 FAQ" />

      {/* Methodology */}
      <section className="mb-10 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Ranking Methodology
          </h2>
        </div>
        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            Doctors are ranked by{" "}
            <strong>institutional capacity</strong> &mdash; professionals at
            larger DHA-registered healthcare facilities appear higher in the
            rankings. This approach is based on a simple principle: larger
            facilities undergo more rigorous accreditation, maintain
            multi-disciplinary teams for peer review, and have stricter quality
            assurance processes.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            Only doctors holding a <strong>Full-Time License (FTL)</strong> from
            the Dubai Health Authority are included. Part-time registrations and
            visiting privileges are excluded to ensure the ranking reflects
            dedicated, full-time practitioners.
          </p>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
            All data is sourced directly from the{" "}
            <strong>DHA Sheryan Medical Registry</strong> &mdash; the official
            database maintained by the Dubai Health Authority. There are no paid
            placements, sponsored rankings, or subjective review scores.
          </p>
          <p className="text-[11px] text-black/40">
            These rankings do not constitute medical advice. Always verify
            credentials and consult directly with healthcare providers before
            making decisions.
          </p>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Related Pages
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/professionals"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              Full Professional Directory
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Search all {PROFESSIONAL_STATS.total.toLocaleString()} healthcare
              professionals
            </p>
          </Link>
          <Link
            href="/best"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              Best Healthcare Providers
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Top-rated clinics, hospitals, and facilities by Google rating
            </p>
          </Link>
          <Link
            href="/directory"
            className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
              UAE Healthcare Directory
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
              Browse 12,000+ facilities across all UAE cities
            </p>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data sourced {PROFESSIONAL_STATS.scraped}. This
          directory is for informational purposes only and does not constitute
          medical advice. Verify professional credentials directly with DHA
          before making healthcare decisions.
        </p>
      </div>
    </div>
  );
}
