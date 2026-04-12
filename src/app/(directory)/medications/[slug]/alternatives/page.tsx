import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getAlternativeMedications, getAllMedicationSlugs, getBrandsByGeneric } from "@/lib/medications";
import { Pill, ArrowRight, ArrowLeftRight } from "lucide-react";

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
  const data = await getAlternativeMedications(params.slug);
  if (!data || data.alternatives.length === 0) notFound();

  const { medication: med, alternatives, medicationClass } = data;
  const base = getBaseUrl();
  const medBrands = await getBrandsByGeneric(med.slug);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        { name: med.genericName, url: `${base}/medications/${med.slug}` },
        { name: "Alternatives" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        { label: med.genericName, href: `/medications/${med.slug}` },
        { label: "Alternatives" },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="h-8 w-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Alternatives to {med.genericName}
          </h1>
        </div>
        {medicationClass && (
          <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-4">
            These medications belong to the same drug class:{" "}
            <Link href={`/medication-classes/${medicationClass.slug}`} className="text-[#006828] hover:underline">{medicationClass.name}</Link>
          </p>
        )}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            There are {alternatives.length} alternative medications to {med.genericName}
            {medicationClass ? ` in the ${medicationClass.name.toLowerCase()} class` : ""}.
            {medBrands.length > 0 && ` ${med.genericName} is sold under brand names: ${medBrands.map(b => b.brandName).join(", ")}.`}
            {" "}Never switch medications without consulting your doctor — alternatives may have different dosing, side effects, or contraindications.
          </p>
        </div>
      </div>

      {/* Current medication card */}
      <section className="mb-6">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-black/40 tracking-tight mb-3 uppercase">Current Medication</h2>
        <Link href={`/medications/${med.slug}`}
          className="group flex items-center gap-4 p-4 rounded-xl border-2 border-[#006828]/20 bg-[#006828]/[0.02]">
          <Pill className="h-6 w-6 text-[#006828]" />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c]">{med.genericName}</p>
            {med.shortDescription && <p className="font-['Geist',sans-serif] text-xs text-black/50 mt-0.5">{med.shortDescription}</p>}
          </div>
        </Link>
      </section>

      {/* Alternatives */}
      <section className="mb-10">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-3">
          {alternatives.length} Alternatives
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alternatives.map((alt) => (
            <Link key={alt.slug} href={`/medications/${alt.slug}`}
              className="group flex items-start gap-3 bg-white border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:shadow-card transition-all">
              <div className="flex-1 min-w-0">
                <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">{alt.genericName}</p>
                {alt.shortDescription && <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-2">{alt.shortDescription}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif] ${alt.rxStatus === "otc" ? "bg-[#006828]/[0.08] text-[#006828]" : "bg-amber-500/[0.08] text-amber-700"}`}>
                    {alt.rxStatus === "otc" ? "OTC" : "Rx"}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Important.</strong> Do not switch between {med.genericName} and its alternatives without consulting your prescribing physician.
          Different medications in the same class may have different dosing, drug interactions, and side effect profiles.
        </p>
      </div>
    </div>
  );
}
