import { Metadata } from "next";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCategories } from "@/lib/data";
import { getAllSpecialtiesWithMedications } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: truncateTitle("UAE Medical Specialties — Directory of Care"),
    description: truncateDescription(
      "Browse every medical specialty across UAE healthcare — from cardiology and dermatology to mental health and dentistry. Licensed specialists, typical medications, and care pathways."
    ),
    alternates: {
      canonical: `${base}/specialties`,
      languages: { "en-AE": `${base}/specialties` },
    },
    openGraph: {
      title: "UAE Medical Specialties — Directory of Care",
      description:
        "Browse every medical specialty across UAE healthcare. Licensed specialists, typical medications, and care pathways.",
      type: "website",
      url: `${base}/specialties`,
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

const specialtiesHubFaqs = [
  {
    question: "What medical specialties are covered in the UAE Open Healthcare Directory?",
    answer:
      "The directory covers 26 specialties including general medicine, cardiology, dermatology, dentistry, ophthalmology, pediatrics, mental health, gynecology, fertility, ENT, orthopedics, pharmacy, and more. Each specialty page links to licensed providers and typical prescribed medications.",
  },
  {
    question: "How do I find the right specialist for my condition?",
    answer:
      "Start with the specialty that treats your condition — for example, dermatology for skin issues or cardiology for heart symptoms. Each specialty page lists typical medications prescribed and links to licensed providers across Dubai, Abu Dhabi, Sharjah, and the Northern Emirates.",
  },
  {
    question: "Are all the specialists listed government-licensed?",
    answer:
      "Yes. Every provider listed is cross-referenced against DHA (Dubai), DOH (Abu Dhabi), or MOHAP (other emirates) licensed practitioner registers. We do not list unverified clinics or unlicensed practitioners.",
  },
  {
    question: "Do specialists in the UAE accept health insurance?",
    answer:
      "Most licensed specialists accept at least one of the major UAE insurers — Daman, AXA, Cigna, Bupa, MetLife, Allianz, Oman Insurance, or Orient Insurance. Each provider listing shows which insurers are accepted so you can filter before booking.",
  },
];

export default async function SpecialtiesHubPage() {
  const base = getBaseUrl();
  const categories = getCategories();
  const specialtiesWithMeds = await safe(
    getAllSpecialtiesWithMedications(),
    [] as Awaited<ReturnType<typeof getAllSpecialtiesWithMedications>>,
    "specialtiesWithMeds",
  );

  // Build a map from specialty slug to medication count for enrichment
  const medCountBySpecialty = new Map<string, number>();
  for (const entry of specialtiesWithMeds) {
    medCountBySpecialty.set(entry.slug, entry.medications.length);
  }

  const categoryItems: HubItem[] = categories.map((cat) => ({
    href: `/specialties/${cat.slug}`,
    label: cat.name,
    count: medCountBySpecialty.get(cat.slug) ?? null,
  }));

  const uaeExploreItems: HubItem[] = [
    { href: "/directory/dubai", label: "All specialists in Dubai" },
    { href: "/directory/abu-dhabi", label: "All specialists in Abu Dhabi" },
    { href: "/directory/sharjah", label: "All specialists in Sharjah" },
    { href: "/directory/al-ain", label: "All specialists in Al Ain" },
    { href: "/directory/ajman", label: "All specialists in Ajman" },
    { href: "/directory/ras-al-khaimah", label: "All specialists in Ras Al Khaimah" },
  ];

  const sections = [
    {
      title: "All medical specialties",
      eyebrow: "Browse by care area",
      items: categoryItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
    {
      title: "Specialists by city",
      eyebrow: "Where to find care",
      items: uaeExploreItems,
      layout: "list" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Specialties" },
        ]}
        eyebrow="Specialty guide"
        title="UAE Medical Specialties"
        subtitle={`Browse every medical specialty across UAE healthcare — from cardiology to dentistry. ${categories.length} specialties, licensed providers, and typical medications.`}
        stats={[
          { n: String(categories.length), l: "Specialties" },
          { n: String(specialtiesWithMeds.length), l: "With prescribing data" },
        ]}
        aeoAnswer={
          <>
            The UAE Open Healthcare Directory covers {categories.length} medical specialties &mdash; from general
            medicine and cardiology to dentistry, dermatology, and mental health. Each specialty page links
            to licensed DHA, DOH, or MOHAP-registered providers and the medications commonly prescribed in
            that field. Use this hub to navigate care by what you need, not by location.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Specialties" },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(specialtiesHubFaqs)} />
          </>
        }
        sections={sections}
        faqs={specialtiesHubFaqs}
      />

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About UAE specialties.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={specialtiesHubFaqs} />
        </div>
      </section>
    </>
  );
}
