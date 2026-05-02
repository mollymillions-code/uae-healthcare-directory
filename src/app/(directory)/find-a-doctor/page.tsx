import { Metadata } from "next";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getAggregateStats, getAllFacilities } from "@/lib/professionals";
import {
  PROFESSIONAL_CATEGORIES,
  ALL_SPECIALTIES,
  PROFESSIONAL_STATS,
  getSpecialtiesByCategory,
} from "@/lib/constants/professionals";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Stethoscope, Smile, Heart, Activity } from "lucide-react";

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
    title: `Find a Doctor in Dubai — Search ${PROFESSIONAL_STATS.total.toLocaleString()}+ DHA-Licensed Professionals`,
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  physicians: <Stethoscope className="h-5 w-5" />,
  dentists: <Smile className="h-5 w-5" />,
  nurses: <Heart className="h-5 w-5" />,
  "allied-health": <Activity className="h-5 w-5" />,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  physicians:
    "General practitioners, specialists, and consultants across all medical disciplines including cardiology, orthopedics, neurology, and more.",
  dentists:
    "General dentists, orthodontists, endodontists, prosthodontists, and oral surgeons licensed to practice in Dubai.",
  nurses:
    "Registered nurses, assistant nurses, practical nurses, and midwives working across hospitals and clinics in Dubai.",
  "allied-health":
    "Pharmacists, physiotherapists, lab technologists, optometrists, psychologists, dieticians, and other allied health specialists.",
};

export default async function FindADoctorPage() {
  const base = getBaseUrl();
  const stats = await safe(
    Promise.resolve(getAggregateStats()),
    {
      totalProfessionals: PROFESSIONAL_STATS.total,
      totalSpecialties: ALL_SPECIALTIES.length,
      totalFacilities: PROFESSIONAL_STATS.uniqueFacilities,
    } as ReturnType<typeof getAggregateStats>,
    "findADoctor:aggregateStats",
  );
  const topFacilities = await safe(
    Promise.resolve(getAllFacilities(100).slice(0, 15)),
    [] as ReturnType<typeof getAllFacilities>,
    "findADoctor:topFacilities",
  );

  const categoryItems: HubItem[] = PROFESSIONAL_CATEGORIES.map((cat) => ({
    href: `/professionals/${cat.slug}`,
    label: cat.name,
    subLabel: CATEGORY_DESCRIPTIONS[cat.slug] ?? cat.description,
    count: cat.count,
    icon: CATEGORY_ICONS[cat.slug],
  }));

  const topSpecialtiesByCategory = PROFESSIONAL_CATEGORIES.map((cat) => {
    const specs = getSpecialtiesByCategory(cat.slug)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { category: cat, specialties: specs };
  });

  const specialtySections = topSpecialtiesByCategory
    .filter(({ specialties }) => specialties.length > 0)
    .map(({ category, specialties }) => ({
      title: `Popular ${category.name.toLowerCase()}`,
      eyebrow: category.name,
      items: specialties.map((s) => ({
        href: `/professionals/${s.category}/${s.slug}`,
        label: s.name,
        count: s.count,
      })) as HubItem[],
      layout: "chips" as const,
    }));

  const facilityItems: HubItem[] = topFacilities.map((fac, i) => ({
    href: `/professionals/facility/${fac.slug}`,
    label: `${i + 1}. ${fac.name}`,
    count: fac.totalStaff,
  }));

  const sections = [
    {
      title: "Browse by category",
      eyebrow: "Four core categories",
      items: categoryItems,
      layout: "grid" as const,
      gridCols: "2" as const,
    },
    ...specialtySections,
    ...(facilityItems.length > 0
      ? [
          {
            title: "Top hospitals and facilities by staff",
            eyebrow: "Where Dubai's doctors practice",
            items: facilityItems,
            layout: "list" as const,
          },
        ]
      : []),
    {
      title: "Explore the full directory",
      eyebrow: "Keep browsing",
      items: [
        {
          href: "/professionals",
          label: "All healthcare professionals",
          subLabel: `${stats.totalProfessionals.toLocaleString()} across ${stats.totalSpecialties} specialties`,
        },
        {
          href: "/directory",
          label: "Facility-first directory",
          subLabel: "Browse clinics, hospitals, and pharmacies",
        },
        {
          href: "/specialties",
          label: "All medical specialties",
          subLabel: "Pick a specialty, then a doctor",
        },
      ] satisfies HubItem[],
      layout: "grid" as const,
      gridCols: "3" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Find a Doctor" },
        ]}
        eyebrow="DHA Sheryan register"
        title="Find a Doctor in Dubai"
        subtitle={`Search ${PROFESSIONAL_STATS.total.toLocaleString()}+ DHA-licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}+ facilities in Dubai.`}
        stats={[
          { n: PROFESSIONAL_STATS.total.toLocaleString(), l: "Licensed professionals" },
          { n: PROFESSIONAL_STATS.uniqueFacilities.toLocaleString(), l: "Healthcare facilities" },
          { n: ALL_SPECIALTIES.length.toString(), l: "Specialties tracked" },
          { n: "4", l: "Professional categories" },
        ]}
        aeoAnswer={
          <>
            Browse the largest publicly searchable directory of DHA-licensed
            healthcare professionals in Dubai, sourced from the official Sheryan
            Medical Registry. This directory includes{" "}
            {PROFESSIONAL_STATS.physicians.toLocaleString()} physicians,{" "}
            {PROFESSIONAL_STATS.dentists.toLocaleString()} dentists,{" "}
            {PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives,
            and {PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health
            professionals. Search by category, specialty, or facility to find
            the right healthcare professional.
          </>
        }
        schemas={
          <>
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
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(FAQS)} />
            <JsonLd
              data={breadcrumbSchema([
                { name: "UAE", url: `${base}/` },
                { name: "Directory", url: `${base}/directory` },
                { name: "Find a Doctor" },
              ])}
            />
          </>
        }
        sections={sections}
        faqs={FAQS}
      />

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About finding a doctor in Dubai.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={FAQS} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Source.</strong> Dubai Health
            Authority (DHA) Sheryan Medical Professional Registry. Data scraped{" "}
            {PROFESSIONAL_STATS.scraped}. This directory is for informational
            purposes only and does not constitute medical advice. Verify
            professional credentials directly with DHA before making healthcare
            decisions.
          </p>
        </div>
      </section>
    </>
  );
}
