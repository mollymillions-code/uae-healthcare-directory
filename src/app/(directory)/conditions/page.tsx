import { Metadata } from "next";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getAllConditionsWithMedications } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: truncateTitle("UAE Conditions & Treatments — Health Conditions Guide"),
    description: truncateDescription(
      "Browse common health conditions treated in the UAE. Typical medications prescribed, specialist pathways, and licensed clinics across all seven emirates."
    ),
    alternates: {
      canonical: `${base}/conditions`,
    },
    openGraph: {
      title: "UAE Conditions & Treatments — Health Conditions Guide",
      description:
        "Common health conditions treated in the UAE. Medications, specialists, and licensed clinics.",
      type: "website",
      url: `${base}/conditions`,
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

const conditionsHubFaqs = [
  {
    question: "How do I know which specialist to see for my condition?",
    answer:
      "Each condition page lists the specialties that most commonly treat it, derived from prescribing patterns. If you are unsure, start with a GP — they will assess and refer you to the right specialist within your insurer's network.",
  },
  {
    question: "Can I look up any health condition in this directory?",
    answer:
      "We cover the conditions for which structured prescribing data is available from public pharmaceutical references — typically the most common chronic and acute conditions seen in UAE primary and specialist care. For less common conditions, consult a licensed physician directly.",
  },
  {
    question: "Does this directory give medical advice?",
    answer:
      "No. The condition pages are reference material compiled from public pharmaceutical references and verified against UAE MOH guidelines. They are not a substitute for a licensed healthcare provider's diagnosis and treatment plan.",
  },
  {
    question: "How often is the condition and medication information updated?",
    answer:
      "The directory is revalidated every 12 hours against the underlying data sources. Medications, brand availability, and regulatory notes are refreshed when the underlying references update. Last review: April 2026.",
  },
];

export default async function ConditionsHubPage() {
  const base = getBaseUrl();
  const conditions = await safe(
    getAllConditionsWithMedications(),
    [] as Awaited<ReturnType<typeof getAllConditionsWithMedications>>,
    "conditionsHub",
  );

  // Only include conditions with at least 2 medications (matches per-page gating)
  const indexable = conditions.filter((c) => c.medications.length >= 2);

  const conditionItems: HubItem[] = indexable.map((c) => ({
    href: `/conditions/${c.slug}`,
    label: c.condition,
    count: c.medications.length,
  }));

  const sections = [
    {
      title: "All conditions",
      eyebrow: "Browse A–Z",
      items: conditionItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Conditions" },
        ]}
        eyebrow="Condition guide"
        title="UAE Conditions & Treatments"
        subtitle={`${indexable.length} common health conditions — with typical medications, specialist pathways, and licensed UAE clinics.`}
        stats={[
          { n: String(indexable.length), l: "Conditions" },
          { n: String(conditions.reduce((s, c) => s + c.medications.length, 0)), l: "Linked medications" },
        ]}
        aeoAnswer={
          <>
            The UAE Conditions guide covers {indexable.length} common health conditions with structured
            prescribing data &mdash; including typical medications, specialist pathways, and licensed clinics
            across Dubai, Abu Dhabi, Sharjah, and the Northern Emirates. Each condition page references
            public pharmaceutical data and is verified against UAE MOH guidelines. Always consult a
            licensed healthcare provider for diagnosis and treatment.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Conditions" },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(conditionsHubFaqs)} />
          </>
        }
        sections={sections}
        faqs={conditionsHubFaqs}
      />

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About the conditions guide.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={conditionsHubFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This guide is for informational
            purposes only. It does not constitute medical advice. Always consult a licensed healthcare
            provider for diagnosis and treatment.
          </p>
        </div>
      </section>
    </>
  );
}
