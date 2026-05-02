import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getMedicationsByCondition, getAllConditionsWithMedications } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { condition: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const all = await getAllConditionsWithMedications();
  return all.filter((c) => c.medications.length >= 2).map((c) => ({ condition: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const conditionName = toTitle(params.condition);
  const meds = await getMedicationsByCondition(params.condition);
  if (meds.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: `${meds.length} Medications for ${conditionName} — UAE Prescribing Guide`,
    description: `Browse ${meds.length} medications commonly prescribed for ${conditionName.toLowerCase()} in the UAE. Generic names, brand equivalents, and pharmacy access.`,
    // noindex 1-item pages — not enough unique value vs the medication's own page
    ...(meds.length < 2 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `${base}/conditions/${params.condition}/medications` },
  };
}

export default async function ConditionMedicationsPage({ params }: Props) {
  const meds = await safe(getMedicationsByCondition(params.condition), [] as Awaited<ReturnType<typeof getMedicationsByCondition>>, "condMeds");
  if (meds.length === 0) notFound();
  const base = getBaseUrl();
  const conditionName = toTitle(params.condition);
  const rxCount = meds.filter((m) => m.rxStatus === "prescription" || m.rxStatus === "controlled").length;
  const otcCount = meds.filter((m) => m.rxStatus === "otc").length;
  const labMonitored = meds.filter((m) => m.requiresMonitoringLabs).length;

  const medItems: HubItem[] = meds.map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const sections = [
    {
      title: `Medications for ${conditionName}`,
      eyebrow: `${meds.length} ${meds.length === 1 ? "medication" : "medications"}`,
      items: medItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Medications", href: "/medications" },
          { label: `${conditionName} Medications` },
        ]}
        eyebrow="Condition guide"
        title={`Medications for ${conditionName}`}
        subtitle={`Medications commonly prescribed for ${conditionName.toLowerCase()} in UAE licensed pharmacies — with Rx status and lab monitoring flags.`}
        stats={[
          { n: String(meds.length), l: meds.length === 1 ? "Medication" : "Medications" },
          ...(rxCount > 0 ? [{ n: String(rxCount), l: "Prescription" }] : []),
          ...(otcCount > 0 ? [{ n: String(otcCount), l: "Over-the-counter" }] : []),
          ...(labMonitored > 0 ? [{ n: String(labMonitored), l: "Need lab monitoring" }] : []),
        ].slice(0, 4)}
        aeoAnswer={
          <>
            {meds.length} medications are commonly prescribed for {conditionName.toLowerCase()} in the UAE.
            {rxCount > 0 ? ` ${rxCount} require a prescription from a licensed physician.` : ""}
            {otcCount > 0 ? ` ${otcCount} are available over the counter.` : ""}
            {" "}Always consult a healthcare provider before starting any medication for {conditionName.toLowerCase()}.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Medications", url: `${base}/medications` },
              { name: `${conditionName} Medications` },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        sections={sections}
      />

      {/* Disclaimer */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <div className="rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> This page lists medications associated with
            {" "}{conditionName.toLowerCase()} for informational purposes only. It is not medical advice.
            Consult a licensed healthcare provider for diagnosis and treatment.
          </p>
        </div>
      </section>
    </>
  );
}
