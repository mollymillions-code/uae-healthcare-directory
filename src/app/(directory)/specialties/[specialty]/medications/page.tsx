import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getMedicationsBySpecialty, getAllSpecialtiesWithMedications } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill, Stethoscope, ArrowRight } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { specialty: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const all = await getAllSpecialtiesWithMedications();
  return all.filter((s) => s.medications.length >= 2).map((s) => ({ specialty: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const specName = toTitle(params.specialty);
  const meds = await getMedicationsBySpecialty(params.specialty);
  if (meds.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: `${meds.length} Medications Prescribed by ${specName} Specialists — UAE Guide`,
    description: `Browse ${meds.length} medications commonly prescribed by ${specName.toLowerCase()} specialists in the UAE. Generic names, uses, and pharmacy access.`,
    ...(meds.length < 2 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `${base}/specialties/${params.specialty}/medications` },
  };
}

export default async function SpecialtyMedicationsPage({ params }: Props) {
  const meds = await safe(getMedicationsBySpecialty(params.specialty), [] as Awaited<ReturnType<typeof getMedicationsBySpecialty>>, "specMeds");
  if (meds.length === 0) notFound();
  const base = getBaseUrl();
  const specName = toTitle(params.specialty);

  // Group by drug class
  const byClass = new Map<string, typeof meds>();
  for (const med of meds) {
    const cls = med.classSlug || "other";
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls)!.push(med);
  }

  const rxCount = meds.filter((m) => m.rxStatus === "prescription" || m.rxStatus === "controlled").length;
  const otcCount = meds.filter((m) => m.rxStatus === "otc").length;

  const medItems: HubItem[] = meds.map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const sections = [
    {
      title: `Medications prescribed in ${specName}`,
      eyebrow: `${meds.length} ${meds.length === 1 ? "medication" : "medications"} · ${byClass.size} classes`,
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
          { label: `${specName} Medications` },
        ]}
        eyebrow="Specialty prescribing"
        title={`Medications Prescribed by ${specName} Specialists`}
        subtitle={`A reference of medications commonly prescribed in ${specName.toLowerCase()} practice across UAE licensed pharmacies.`}
        stats={[
          { n: String(meds.length), l: meds.length === 1 ? "Medication" : "Medications" },
          { n: String(byClass.size), l: byClass.size === 1 ? "Drug class" : "Drug classes" },
          ...(rxCount > 0 ? [{ n: String(rxCount), l: "Prescription" }] : []),
          ...(otcCount > 0 ? [{ n: String(otcCount), l: "Over-the-counter" }] : []),
        ].slice(0, 4)}
        aeoAnswer={
          <>
            {specName} specialists in the UAE commonly prescribe {meds.length} medications across {byClass.size} drug classes.
            This page covers the most frequently prescribed medications in {specName.toLowerCase()} practice.
            Always consult a licensed {specName.toLowerCase()} specialist for prescribing guidance.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Medications", url: `${base}/medications` },
              { name: `${specName} Medications` },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        sections={sections}
      />

      {/* Specialist CTA + Disclaimer */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24 space-y-8">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-10">
          <div className="absolute -top-20 -right-16 h-[260px] w-[260px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative max-w-2xl">
            <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-2 inline-flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Find a clinician
            </p>
            <h2 className="font-display font-semibold text-white text-display-md tracking-[-0.018em] leading-[1.1]">
              Find a {specName} specialist.
            </h2>
            <p className="font-sans text-white/70 text-z-body mt-3 leading-relaxed">
              Browse {specName.toLowerCase()} specialists and clinics in the UAE.
            </p>
            <Link
              href="/directory/dubai"
              className="mt-5 inline-flex items-center gap-2 rounded-z-pill bg-accent hover:bg-accent-light text-white font-sans font-semibold text-z-body-sm px-5 py-2.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,200,83,0.5)]"
            >
              Browse directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> This page is for informational purposes only. It does not
            constitute medical advice. Consult a licensed {specName.toLowerCase()} specialist for prescribing guidance.
          </p>
        </div>
      </section>
    </>
  );
}
