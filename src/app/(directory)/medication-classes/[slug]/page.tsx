import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getMedicationClassBySlug,
  getMedicationsByClass,
  getAllClassSlugs,
} from "@/lib/medications";
import { gateMedicationClassPage } from "@/lib/medication-gating";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill, ArrowRight } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllClassSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cls = await getMedicationClassBySlug(params.slug);
  if (!cls) return {};

  const base = getBaseUrl();
  const meds = await getMedicationsByClass(cls.slug);
  const gate = gateMedicationClassPage(cls);

  return {
    title: `${cls.name} — ${meds.length} Medications | UAE Drug Class Guide`,
    description: cls.shortDescription
      ? `${cls.shortDescription} ${meds.length} medications in this class available in UAE pharmacies.`
      : `Browse ${meds.length} ${cls.name.toLowerCase()} medications available in the UAE.`,
    ...(!gate.index ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: `${base}/medication-classes/${cls.slug}`,
    },
    openGraph: {
      title: `${cls.name} — UAE Medication Class`,
      description: `${meds.length} medications in the ${cls.name.toLowerCase()} class.`,
      type: "website",
      url: `${base}/medication-classes/${cls.slug}`,
    },
  };
}

export default async function MedicationClassPage({ params }: Props) {
  const cls = await safe(getMedicationClassBySlug(params.slug), null, "medClass");
  if (!cls) notFound();

  const base = getBaseUrl();
  const meds = await safe(getMedicationsByClass(cls.slug), [] as Awaited<ReturnType<typeof getMedicationsByClass>>, "classMeds");

  const rxCount = meds.filter((m) => m.rxStatus === "prescription").length;
  const otcCount = meds.filter((m) => m.rxStatus === "otc").length;
  const highIntentCount = meds.filter((m) => m.isHighIntent).length;

  const medItems: HubItem[] = meds.map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const sections = [
    {
      title: "Medications in this class",
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
          { label: cls.name },
        ]}
        eyebrow="Drug class"
        title={cls.name}
        subtitle={cls.shortDescription ?? undefined}
        stats={[
          { n: String(meds.length), l: meds.length === 1 ? "Medication" : "Medications" },
          ...(rxCount > 0 ? [{ n: String(rxCount), l: "Prescription" }] : []),
          ...(otcCount > 0 ? [{ n: String(otcCount), l: "Over-the-counter" }] : []),
        ].slice(0, 4)}
        aeoAnswer={
          <>
            {cls.shortDescription || `${cls.name} is a class of medications.`}
            {" "}This class includes {meds.length} medications available in UAE pharmacies
            {rxCount > 0 && otcCount > 0 ? ` — ${rxCount} require a prescription and ${otcCount} are available over the counter` : ""}.
            {highIntentCount > 0 && ` ${highIntentCount} are among the most searched medications in the UAE.`}
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Medications", url: `${base}/medications` },
              { name: cls.name },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        sections={sections}
      />

      {/* Pharmacy CTA + Disclaimer */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24 space-y-8">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-10">
          <div className="absolute -top-20 -right-16 h-[260px] w-[260px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative max-w-2xl">
            <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-2">
              Find availability
            </p>
            <h2 className="font-display font-semibold text-white text-display-md tracking-[-0.018em] leading-[1.1]">
              Find {cls.name} at a pharmacy.
            </h2>
            <p className="font-sans text-white/70 text-z-body mt-3 leading-relaxed">
              Browse UAE pharmacies to check availability of {cls.name.toLowerCase()}.
            </p>
            <Link
              href="/pharmacy"
              className="mt-5 inline-flex items-center gap-2 rounded-z-pill bg-accent hover:bg-accent-light text-white font-sans font-semibold text-z-body-sm px-5 py-2.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,200,83,0.5)]"
            >
              Browse pharmacies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> This page lists medications in the {cls.name.toLowerCase()} class
            for informational purposes. It is not medical advice. Consult a licensed healthcare provider
            for prescribing guidance. Data from publicly available pharmaceutical references.
          </p>
        </div>
      </section>
    </>
  );
}
