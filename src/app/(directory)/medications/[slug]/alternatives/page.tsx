import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getAlternativeMedications, getAllMedicationSlugs, getBrandsByGeneric } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import { Pill } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const slugs = await getAllMedicationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getAlternativeMedications(params.slug);
  if (!data || data.alternatives.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: `${data.alternatives.length} Alternatives to ${data.medication.genericName} — UAE Guide`,
    description: `Compare ${data.alternatives.length} alternatives to ${data.medication.genericName} in the same drug class${data.medicationClass ? ` (${data.medicationClass.name})` : ""}. Generic names, brand equivalents, and prescribing differences.`,
    alternates: { canonical: `${base}/medications/${params.slug}/alternatives` },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const data = await safe(getAlternativeMedications(params.slug), null, "alternatives");
  if (!data || data.alternatives.length === 0) notFound();

  const { medication: med, alternatives, medicationClass } = data;
  const base = getBaseUrl();
  const medBrands = await safe(getBrandsByGeneric(med.slug), [] as Awaited<ReturnType<typeof getBrandsByGeneric>>, "medBrands");

  const alternativeItems: HubItem[] = alternatives.map((alt) => ({
    href: `/medications/${alt.slug}`,
    label: alt.genericName,
    subLabel: alt.shortDescription ?? undefined,
    icon: <Pill className="h-4 w-4" />,
  }));

  const sections = [
    ...(medicationClass
      ? [{
          title: "Current medication",
          eyebrow: "You searched for",
          items: [{
            href: `/medications/${med.slug}`,
            label: med.genericName,
            subLabel: med.shortDescription ?? undefined,
            icon: <Pill className="h-4 w-4" />,
          }],
          layout: "grid" as const,
          gridCols: "3" as const,
        }]
      : []),
    {
      title: `${alternatives.length} ${alternatives.length === 1 ? "alternative" : "alternatives"}`,
      eyebrow: medicationClass ? `Same class · ${medicationClass.name}` : "Same therapeutic class",
      items: alternativeItems,
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
          { label: med.genericName, href: `/medications/${med.slug}` },
          { label: "Alternatives" },
        ]}
        eyebrow="Alternatives"
        title={`Alternatives to ${med.genericName}`}
        subtitle={
          medicationClass
            ? <>These medications belong to the same drug class: <Link href={`/medication-classes/${medicationClass.slug}`} className="text-accent-dark hover:underline font-medium">{medicationClass.name}</Link></>
            : "Medications in the same therapeutic class."
        }
        stats={[
          { n: String(alternatives.length), l: alternatives.length === 1 ? "Alternative" : "Alternatives" },
          ...(medBrands.length > 0 ? [{ n: String(medBrands.length), l: medBrands.length === 1 ? "Brand" : "Brands" }] : []),
        ]}
        aeoAnswer={
          <>
            There are {alternatives.length} alternative medications to {med.genericName}
            {medicationClass ? ` in the ${medicationClass.name.toLowerCase()} class` : ""}.
            {medBrands.length > 0 && ` ${med.genericName} is sold under brand names: ${medBrands.map((b) => b.brandName).join(", ")}.`}
            {" "}Never switch medications without consulting your doctor &mdash; alternatives may have different dosing, side effects, or contraindications.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Medications", url: `${base}/medications` },
              { name: med.genericName, url: `${base}/medications/${med.slug}` },
              { name: "Alternatives" },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        sections={sections}
      />

      {/* Warning / disclaimer */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <div className="rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Important.</strong> Do not switch between {med.genericName} and its alternatives without
            consulting your prescribing physician. Different medications in the same class may have
            different dosing, drug interactions, and side effect profiles.
          </p>
        </div>
      </section>
    </>
  );
}
