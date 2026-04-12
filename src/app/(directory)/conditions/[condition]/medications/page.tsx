import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getMedicationsByCondition, getAllConditionsWithMedications } from "@/lib/medications";
import { Pill, ArrowRight } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { condition: string } }

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export async function generateStaticParams() {
  const all = await getAllConditionsWithMedications();
  return all.filter(c => c.medications.length >= 2).map(c => ({ condition: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const conditionName = toTitle(params.condition);
  const meds = await getMedicationsByCondition(params.condition);
  if (meds.length === 0) return {};
  const base = getBaseUrl();
  return {
    title: `${meds.length} Medications for ${conditionName} — UAE Prescribing Guide`,
    description: `Browse ${meds.length} medications commonly prescribed for ${conditionName.toLowerCase()} in the UAE. Generic names, brand equivalents, and pharmacy access.`,
    alternates: { canonical: `${base}/conditions/${params.condition}/medications` },
  };
}

export default async function ConditionMedicationsPage({ params }: Props) {
  const meds = await getMedicationsByCondition(params.condition);
  if (meds.length === 0) notFound();
  const base = getBaseUrl();
  const conditionName = toTitle(params.condition);
  const rxCount = meds.filter(m => m.rxStatus === "prescription" || m.rxStatus === "controlled").length;
  const otcCount = meds.filter(m => m.rxStatus === "otc").length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        { name: `${conditionName} Medications` },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        { label: `${conditionName} Medications` },
      ]} />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          Medications for {conditionName}
        </h1>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 bg-[#006828]/[0.08] text-[#006828] text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
            <Pill className="h-3.5 w-3.5" /> {meds.length} Medications
          </span>
          {rxCount > 0 && <span className="bg-amber-500/[0.08] text-amber-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">{rxCount} Prescription</span>}
          {otcCount > 0 && <span className="bg-blue-500/[0.08] text-blue-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">{otcCount} OTC</span>}
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {meds.length} medications are commonly prescribed for {conditionName.toLowerCase()} in the UAE.
            {rxCount > 0 ? ` ${rxCount} require a prescription from a licensed physician.` : ""}
            {otcCount > 0 ? ` ${otcCount} are available over the counter.` : ""}
            {" "}Always consult a healthcare provider before starting any medication for {conditionName.toLowerCase()}.
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
                {med.requiresMonitoringLabs && <span className="bg-blue-500/[0.08] text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">Lab monitoring</span>}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> This page lists medications associated with {conditionName.toLowerCase()} for informational purposes only. It is not medical advice. Consult a licensed healthcare provider for diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}
