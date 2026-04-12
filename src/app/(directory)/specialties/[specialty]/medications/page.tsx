import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getMedicationsBySpecialty, getAllSpecialtiesWithMedications } from "@/lib/medications";
import { ArrowRight, Stethoscope } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { specialty: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export async function generateStaticParams() {
  const all = await getAllSpecialtiesWithMedications();
  return all.filter(s => s.medications.length >= 2).map(s => ({ specialty: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const specName = toTitle(params.specialty);
  const meds = await getMedicationsBySpecialty(params.specialty);
  if (meds.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: `${meds.length} Medications Prescribed by ${specName} Specialists — UAE Guide`,
    description: `Browse ${meds.length} medications commonly prescribed by ${specName.toLowerCase()} specialists in the UAE. Generic names, uses, and pharmacy access.`,
    alternates: { canonical: `${base}/specialties/${params.specialty}/medications` },
  };
}

export default async function SpecialtyMedicationsPage({ params }: Props) {
  const meds = await getMedicationsBySpecialty(params.specialty);
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

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        { name: `${specName} Medications` },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        { label: `${specName} Medications` },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Stethoscope className="h-8 w-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Medications Prescribed by {specName} Specialists
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {specName} specialists in the UAE commonly prescribe {meds.length} medications across {byClass.size} drug classes.
            This page covers the most frequently prescribed medications in {specName.toLowerCase()} practice.
            Always consult a licensed {specName.toLowerCase()} specialist for prescribing guidance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {meds.map((med) => (
          <Link key={med.slug} href={`/medications/${med.slug}`}
            className="group flex items-start gap-3 bg-white border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:shadow-card transition-all">
            <div className="flex-1 min-w-0">
              <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">{med.genericName}</p>
              {med.shortDescription && <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-2">{med.shortDescription}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif] ${med.rxStatus === "otc" ? "bg-[#006828]/[0.08] text-[#006828]" : "bg-amber-500/[0.08] text-amber-700"}`}>
                  {med.rxStatus === "otc" ? "OTC" : "Rx"}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Cross-links to find specialists */}
      <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6 mb-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-2">
          Find a {specName} Specialist
        </h2>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-3">
          Browse {specName.toLowerCase()} specialists and clinics in the UAE.
        </p>
        <Link href="/directory/dubai" className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]">
          Browse Directory <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> This page is for informational purposes only. It does not constitute medical advice.
          Consult a licensed {specName.toLowerCase()} specialist for prescribing guidance.
        </p>
      </div>
    </div>
  );
}
