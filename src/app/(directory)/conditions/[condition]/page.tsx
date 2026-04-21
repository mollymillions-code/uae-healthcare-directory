import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllConditionsWithMedications,
  getMedicationsByCondition,
} from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill, Stethoscope } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { condition: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateStaticParams() {
  const all = await getAllConditionsWithMedications();
  return all.filter((c) => c.medications.length >= 2).map((c) => ({ condition: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const conditionName = toTitle(params.condition);
  const meds = await getMedicationsByCondition(params.condition);
  if (meds.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: truncateTitle(`${conditionName} — UAE Treatment Guide, Medications & Specialists`),
    description: truncateDescription(
      `How ${conditionName.toLowerCase()} is treated in the UAE. ${meds.length} commonly prescribed medications, specialist pathways, and licensed clinics across Dubai, Abu Dhabi, Sharjah, and the Northern Emirates.`,
    ),
    ...(meds.length < 2 ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: `${base}/conditions/${params.condition}`,
    },
    openGraph: {
      title: `${conditionName} — UAE Treatment Guide`,
      description: `How ${conditionName.toLowerCase()} is treated in the UAE. Medications, specialists, and licensed clinics.`,
      type: "website",
      url: `${base}/conditions/${params.condition}`,
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default async function ConditionDetailPage({ params }: Props) {
  const meds = await safe(
    getMedicationsByCondition(params.condition),
    [] as Awaited<ReturnType<typeof getMedicationsByCondition>>,
    "condDetailMeds",
  );
  if (meds.length === 0) notFound();

  const base = getBaseUrl();
  const conditionName = toTitle(params.condition);

  // Derive specialty suggestions from the prescribing specialties of related medications
  const specialtyCounts = new Map<string, number>();
  for (const med of meds) {
    for (const spec of med.commonSpecialties) {
      specialtyCounts.set(spec, (specialtyCounts.get(spec) ?? 0) + 1);
    }
  }
  const topSpecialties = Array.from(specialtyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => slug);

  const rxCount = meds.filter((m) => m.rxStatus === "prescription" || m.rxStatus === "controlled").length;
  const otcCount = meds.filter((m) => m.rxStatus === "otc").length;
  const labMonitored = meds.filter((m) => m.requiresMonitoringLabs).length;

  const conditionFaqs = [
    {
      question: `Which specialist treats ${conditionName.toLowerCase()} in the UAE?`,
      answer:
        topSpecialties.length > 0
          ? `${conditionName} is typically treated by ${topSpecialties.map(toTitle).slice(0, 3).join(", ")} specialists in the UAE. Start with a GP if you are unsure — they can refer you to the right specialty.`
          : `${conditionName} is usually managed by a general practitioner first, who will refer you to a specialist if needed. Specialties vary by sub-condition.`,
    },
    {
      question: `What medications are used to treat ${conditionName.toLowerCase()} in the UAE?`,
      answer: `${meds.length} medications are commonly prescribed for ${conditionName.toLowerCase()} in UAE pharmacies. ${rxCount > 0 ? `${rxCount} require a prescription; ` : ""}${otcCount > 0 ? `${otcCount} are available over the counter. ` : ""}Always consult a licensed physician before starting treatment.`,
    },
    {
      question: `Do UAE insurance plans cover ${conditionName.toLowerCase()} treatment?`,
      answer: `Most UAE insurance plans cover consultations and common medications for ${conditionName.toLowerCase()} within the insurer's network. Coverage for newer or brand-name drugs varies by plan. Direct billing is supported by major insurers at most licensed clinics and pharmacies.`,
    },
    {
      question: `Can I manage ${conditionName.toLowerCase()} with over-the-counter medications alone?`,
      answer:
        otcCount > 0
          ? `Some mild cases of ${conditionName.toLowerCase()} can be managed with OTC medications available in UAE pharmacies. If symptoms persist, worsen, or recur, see a licensed physician for diagnosis and a tailored treatment plan.`
          : `${conditionName} typically requires a licensed physician's diagnosis and a prescription in the UAE. Over-the-counter options are limited. Book a GP or specialist consultation before self-treating.`,
    },
  ];

  const medicationItems: HubItem[] = meds.slice(0, 12).map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const specialtyItems: HubItem[] = topSpecialties.map((slug) => ({
    href: `/specialties/${slug}`,
    label: toTitle(slug),
  }));

  const sections = [
    ...(specialtyItems.length > 0
      ? [{
          title: `Specialists who treat ${conditionName.toLowerCase()}`,
          eyebrow: "Find the right clinician",
          items: specialtyItems,
          layout: "grid" as const,
          gridCols: "3" as const,
        }]
      : []),
    {
      title: `Medications for ${conditionName.toLowerCase()}`,
      eyebrow: `${meds.length} ${meds.length === 1 ? "medication" : "medications"}`,
      items: medicationItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Conditions", href: "/conditions" },
          { label: conditionName },
        ]}
        eyebrow="Condition guide"
        title={`${conditionName} in the UAE`}
        subtitle={`How ${conditionName.toLowerCase()} is diagnosed, treated, and managed across UAE healthcare — with typical medications, specialist pathways, and licensed clinics.`}
        stats={[
          { n: String(meds.length), l: meds.length === 1 ? "Medication" : "Medications" },
          ...(rxCount > 0 ? [{ n: String(rxCount), l: "Prescription" }] : []),
          ...(otcCount > 0 ? [{ n: String(otcCount), l: "Over-the-counter" }] : []),
          ...(labMonitored > 0 ? [{ n: String(labMonitored), l: "Lab-monitored" }] : []),
        ].slice(0, 4)}
        aeoAnswer={
          <>
            {conditionName} is managed in the UAE by licensed physicians and specialists, with prescribing
            overseen by DHA, DOH, and MOHAP. {meds.length} medications are commonly prescribed for
            {" "}{conditionName.toLowerCase()} in UAE pharmacies
            {rxCount > 0 && otcCount > 0 ? ` — ${rxCount} require a prescription and ${otcCount} are available over the counter` : ""}.
            {topSpecialties.length > 0 && ` Patients are typically seen by ${topSpecialties.map(toTitle).slice(0, 3).join(", ")} specialists.`}
            {" "}Always consult a healthcare provider before starting treatment.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Conditions", url: `${base}/conditions` },
              { name: conditionName },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(conditionFaqs)} />
          </>
        }
        sections={sections}
        faqs={conditionFaqs}
      />

      {/* Link to full medication list */}
      {meds.length >= 2 && (
        <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-z-md bg-white border border-ink-line p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-1 inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" />
                Prescribing reference
              </p>
              <p className="font-display font-semibold text-ink text-z-h3">
                All {meds.length} medications used for {conditionName.toLowerCase()}
              </p>
            </div>
            <Link
              href={`/conditions/${params.condition}/medications`}
              className="inline-flex items-center gap-2 rounded-z-pill bg-ink text-white font-sans font-semibold text-z-body-sm px-5 py-2.5 hover:bg-ink-soft transition-colors self-start sm:self-auto"
            >
              View all medications
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {conditionName.toLowerCase()}.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={conditionFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This page is for informational
            purposes only. It does not constitute medical advice. Always consult a licensed healthcare
            provider for diagnosis and treatment of {conditionName.toLowerCase()}.
          </p>
        </div>
      </section>
    </>
  );
}
