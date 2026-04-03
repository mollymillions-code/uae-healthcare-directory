import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAggregateStats, getAllFacilities } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  ALL_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";
import { faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const FAQS = [
  {
    question: "How do I verify a doctor's DHA license?",
    answer:
      "You can verify any healthcare professional's DHA license through the official Sheryan portal (sheryan.dha.gov.ae). Search by the professional's name or license number to confirm their credentials, specialty, and current status. The Zavis Professional Directory also lists license type (FTL or REG) for every professional sourced directly from the Sheryan registry.",
  },
  {
    question:
      "What is the difference between a Specialist and Consultant in Dubai?",
    answer:
      "In the DHA classification system, a Specialist is a physician who has completed specialty training and holds a recognized specialist qualification. A Consultant is a more senior grade, requiring additional years of post-specialty experience (typically 8+ years in the specialty). Consultants are permitted to supervise Specialists and often lead departments. Both grades require separate DHA licensing.",
  },
  {
    question: "How many doctors are in Dubai?",
    answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${PROFESSIONAL_STATS.physicians.toLocaleString()} DHA-licensed physicians and doctors practicing in Dubai, according to the official Sheryan Medical Registry. This includes general practitioners, specialists, and consultants across all medical disciplines. In addition, there are ${PROFESSIONAL_STATS.dentists.toLocaleString()} licensed dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals, for a total of ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals.`,
  },
  {
    question:
      "What types of healthcare professionals are licensed by DHA?",
    answer:
      "The Dubai Health Authority licenses four main categories of healthcare professionals: Physicians and Doctors (including GPs, specialists, and consultants), Dentists (general dentists and dental specialists), Nurses and Midwives (registered nurses, assistant nurses, practical nurses, and midwives), and Allied Health Professionals (pharmacists, physiotherapists, lab technologists, optometrists, psychologists, radiographers, and many others). Each professional must pass DHA examinations and meet specific qualification requirements.",
  },
  {
    question: "How do I find a female doctor in Dubai?",
    answer:
      "The DHA Sheryan registry does not publicly list the gender of healthcare professionals. To find a female doctor, you can call the facility directly and request a female physician. Many clinics and hospitals in Dubai offer the option to see a female doctor, particularly in specialties like obstetrics and gynecology, pediatrics, and family medicine. Some facilities specifically advertise female-only clinics.",
  },
  {
    question: "What is the difference between FTL and REG license types?",
    answer:
      "FTL (Full Trade License) indicates a healthcare professional licensed to practice at a privately owned facility. REG (Registered) indicates a professional registered to practice at a government or semi-government healthcare facility such as DHA hospitals. Both license types confirm that the professional has met DHA qualification and examination requirements.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: `Find a Doctor in Dubai — Search ${PROFESSIONAL_STATS.total.toLocaleString()}+ DHA-Licensed Professionals | Zavis`,
    description: `Search ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities in Dubai. Find physicians, dentists, nurses, and allied health professionals by specialty or facility. Sourced from the official Sheryan Medical Registry.`,
    alternates: { canonical: `${base}/find-a-doctor` },
    openGraph: {
      title: `Find a Doctor in Dubai — ${PROFESSIONAL_STATS.total.toLocaleString()}+ DHA-Licensed Professionals`,
      description: `Search the largest directory of DHA-licensed healthcare professionals in Dubai. ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, ${PROFESSIONAL_STATS.dentists.toLocaleString()} dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses, and ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals.`,
      url: `${base}/find-a-doctor`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function FindADoctorPage() {
  const base = getBaseUrl();
  const stats = getAggregateStats();
  const topFacilities = getAllFacilities(100).slice(0, 15);

  // Top specialties grouped by category
  const topSpecialtiesByCategory = PROFESSIONAL_CATEGORIES.map((cat) => {
    const specs = getSpecialtiesByCategory(cat.slug)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { category: cat, specialties: specs };
  });

  const categoryDescriptions: Record<string, string> = {
    physicians:
      "General practitioners, specialists, and consultants across all medical disciplines including cardiology, orthopedics, neurology, and more.",
    dentists:
      "General dentists, orthodontists, endodontists, prosthodontists, and oral surgeons licensed to practice in Dubai.",
    nurses:
      "Registered nurses, assistant nurses, practical nurses, and midwives working across hospitals and clinics in Dubai.",
    "allied-health":
      "Pharmacists, physiotherapists, lab technologists, optometrists, psychologists, dieticians, and other allied health specialists.",
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Find a Doctor in Dubai",
          description: `Search ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed healthcare professionals in Dubai.`,
          url: `${base}/find-a-doctor`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PROFESSIONAL_STATS.total,
            itemListElement: PROFESSIONAL_CATEGORIES.map((cat, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "MedicalWebPage",
                name: cat.name,
                url: `${base}/professionals/${cat.slug}`,
              },
            })),
          },
        }}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Find a Doctor" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Find a Doctor in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          Search {PROFESSIONAL_STATS.total.toLocaleString()}+ DHA-Licensed
          Healthcare Professionals across{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}+ Facilities
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Browse the largest publicly searchable directory of DHA-licensed
            healthcare professionals in Dubai, sourced from the official Sheryan
            Medical Registry. This directory includes{" "}
            {PROFESSIONAL_STATS.physicians.toLocaleString()} physicians,{" "}
            {PROFESSIONAL_STATS.dentists.toLocaleString()} dentists,{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives,
            and {PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health
            professionals. Search by category, specialty, or facility to find the
            right healthcare professional.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: PROFESSIONAL_STATS.total.toLocaleString(),
              label: "Licensed professionals",
            },
            {
              value: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(),
              label: "Healthcare facilities",
            },
            {
              value: ALL_SPECIALTIES.length.toString(),
              label: "Specialties tracked",
            },
            { value: "4", label: "Professional categories" },
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

      {/* Category Cards */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Browse by Category
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PROFESSIONAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/professionals/${cat.slug}`}
            className="border border-black/[0.06] p-6 hover:border-[#006828]/15 transition-colors group"
          >
            <p className="font-['Geist_Mono',monospace] text-[10px] text-black/30 tracking-wider uppercase mb-2">
              {cat.icon}
            </p>
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
              {cat.name}
            </h3>
            <p className="text-sm font-bold text-[#006828] mb-3">
              {cat.count.toLocaleString()} professionals
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
              {categoryDescriptions[cat.slug] || cat.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Popular Specialties by Category */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Popular Specialties
        </h2>
      </div>
      <div className="mb-12">
        {topSpecialtiesByCategory.map(({ category, specialties }) => (
          <div key={category.slug} className="mb-8">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {specialties.map((spec) => (
                <Link
                  key={spec.slug}
                  href={`/professionals/${spec.category}/${spec.slug}`}
                  className="border border-black/[0.06] p-3 hover:border-[#006828]/15 transition-colors group"
                >
                  <h4 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1 group-hover:text-[#006828] transition-colors">
                    {spec.name}
                  </h4>
                  <p className="text-[11px] text-black/40">
                    {spec.count.toLocaleString()} professionals
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top Hospitals */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Top Hospitals and Facilities by Staff
        </h2>
      </div>
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b border-light-200">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                Staff
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
                    {fac.totalStaff.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ Section */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mb-12">
        {FAQS.map((faq) => (
          <div
            key={faq.question}
            className="border-b border-light-200 py-6"
          >
            <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-3">
              {faq.question}
            </h3>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* CTA to full directory */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-8">
        <p className="font-['Bricolage_Grotesque',sans-serif] text-base font-semibold text-[#1c1c1c] tracking-tight mb-2">
          Explore the Full Professional Directory
        </p>
        <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
          Browse {stats.totalProfessionals.toLocaleString()} healthcare
          professionals across {stats.totalSpecialties} specialties and{" "}
          {stats.totalFacilities.toLocaleString()} facilities.
        </p>
        <Link
          href="/professionals"
          className="font-['Geist',sans-serif] text-sm text-[#006828] font-medium hover:underline"
        >
          Go to Professional Directory &rarr;
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
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
