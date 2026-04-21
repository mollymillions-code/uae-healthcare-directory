import { Metadata } from "next";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { speakableSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllMedicationClasses,
  getHighIntentMedications,
  getMedicationCount,
  getBrandCount,
  getClassCount,
} from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill } from "lucide-react";

export const revalidate = 43200; // 12 hours

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  const medCount = await safe(getMedicationCount(), 117, "medCount");
  return {
    title: `${medCount}+ Medications in the UAE — Generic & Brand Guide`,
    description: `Browse ${medCount}+ medications available in the UAE. Find generic names, brand equivalents, prescribing info, and pharmacy access. Free, verified medication directory by Zavis.`,
    alternates: {
      canonical: `${base}/medications`,
    },
    openGraph: {
      title: "UAE Medication Directory — Generics, Brands & Pharmacy Access",
      description: `${medCount}+ medications with prescribing details, brand equivalents, and pharmacy access information.`,
      type: "website",
      url: `${base}/medications`,
    },
  };
}

const medicationsHubFaqs = [
  {
    question: "What is the UAE Medication Directory?",
    answer:
      "A free, comprehensive reference of medications available in UAE pharmacies — with generic names, brand equivalents, prescribing status (OTC, Rx, controlled), drug classes, and typical uses. Compiled from publicly available pharmaceutical references and verified against UAE MOH guidelines.",
  },
  {
    question: "Are the medications listed available across all emirates?",
    answer:
      "Most listed medications are registered with MOHAP or DHA and available nationwide through licensed pharmacies. However, specific brand availability can vary between pharmacy chains and between emirates. Always confirm with your pharmacist before relying on a specific product.",
  },
  {
    question: "Can I order these medications online?",
    answer:
      "Yes — OTC medications can be ordered directly through Aster, Life Pharmacy, Boots UAE, Talabat Pharmacy, and Noon Pharmacy. Prescription medications require you to upload a valid UAE prescription. Controlled substances must be collected in person. See our delivery guide for details.",
  },
  {
    question: "How do I find the generic equivalent of my brand-name medication?",
    answer:
      "Search by brand name in the directory, or look at the brand names listed on each generic medication page. In the UAE, pharmacists are permitted to substitute a registered generic unless your doctor has marked the prescription \"brand necessary.\" Generics typically cost 30–70% less.",
  },
];

export default async function MedicationsHubPage() {
  const base = getBaseUrl();

  const [classes, highIntent, medCount, brandCount, classCount] = await Promise.all([
    safe(getAllMedicationClasses(), [] as Awaited<ReturnType<typeof getAllMedicationClasses>>, "classes"),
    safe(getHighIntentMedications(12), [] as Awaited<ReturnType<typeof getHighIntentMedications>>, "highIntent"),
    safe(getMedicationCount(), 117, "medCount"),
    safe(getBrandCount(), 0, "brandCount"),
    safe(getClassCount(), 0, "classCount"),
  ]);

  const highIntentItems: HubItem[] = highIntent.map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const classItems: HubItem[] = classes.map((cls) => ({
    href: `/medication-classes/${cls.slug}`,
    label: cls.name,
    subLabel: cls.shortDescription ?? undefined,
  }));

  const sections = [
    ...(highIntentItems.length > 0
      ? [{
          title: "Most searched medications",
          eyebrow: "Popular lookups",
          items: highIntentItems,
          layout: "grid" as const,
          gridCols: "3" as const,
        }]
      : []),
    {
      title: "Browse by drug class",
      eyebrow: "Therapeutic categories",
      items: classItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Medications" },
        ]}
        eyebrow="Medication directory"
        title="UAE Medication Directory"
        subtitle={`${medCount}+ generic medications across ${classCount} therapeutic classes, with ${brandCount}+ brand names. Prescribing information, generic-vs-brand guidance, lab monitoring requirements, and pharmacy access.`}
        stats={[
          { n: String(medCount), l: "Medications" },
          { n: String(brandCount), l: "Brand names" },
          { n: String(classCount), l: "Drug classes" },
        ]}
        aeoAnswer={
          <>
            The UAE Medication Directory covers {medCount}+ generic medications across {classCount} therapeutic classes,
            with {brandCount}+ brand names. Find prescribing information, generic-vs-brand guidance, lab monitoring
            requirements, and pharmacy access for medications available in the UAE and GCC.
            This directory is for informational purposes only &mdash; always consult a licensed healthcare provider
            before starting or changing medication.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Medications" },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(medicationsHubFaqs)} />
          </>
        }
        sections={sections}
        faqs={medicationsHubFaqs}
      />

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About the directory.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={medicationsHubFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This medication directory is for
            informational purposes only and does not constitute medical advice. Always consult a licensed
            healthcare provider before starting, stopping, or changing any medication. Drug availability,
            pricing, and regulations may vary across UAE emirates and GCC countries. Data compiled from
            publicly available pharmaceutical references and verified against UAE MOH guidelines. Last
            updated April 2026.
          </p>
        </div>

      </section>
    </>
  );
}
