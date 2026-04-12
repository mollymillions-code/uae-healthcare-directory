import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getMedicationClassBySlug,
  getMedicationsByClass,
  getAllClassSlugs,
} from "@/lib/medications";
import { gateMedicationClassPage } from "@/lib/medication-gating";
import { Pill, ArrowRight, FileText } from "lucide-react";

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
  const cls = await getMedicationClassBySlug(params.slug);
  if (!cls) notFound();

  const base = getBaseUrl();
  const meds = await getMedicationsByClass(cls.slug);

  const rxCount = meds.filter(m => m.rxStatus === "prescription").length;
  const otcCount = meds.filter(m => m.rxStatus === "otc").length;
  const highIntentCount = meds.filter(m => m.isHighIntent).length;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        { name: cls.name },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        { label: cls.name },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Pill className="h-8 w-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            {cls.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 bg-[#006828]/[0.08] text-[#006828] text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
            {meds.length} Medications
          </span>
          {rxCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-500/[0.08] text-amber-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
              {rxCount} Prescription
            </span>
          )}
          {otcCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-blue-500/[0.08] text-blue-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
              {otcCount} OTC
            </span>
          )}
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {cls.shortDescription || `${cls.name} is a class of medications.`}
            {" "}This class includes {meds.length} medications available in UAE pharmacies
            {rxCount > 0 && otcCount > 0 ? ` — ${rxCount} require a prescription and ${otcCount} are available over the counter` : ""}.
            {highIntentCount > 0 && ` ${highIntentCount} are among the most searched medications in the UAE.`}
          </p>
        </div>
      </div>

      {/* Medication grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Medications in This Class
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {meds.map((med) => (
            <Link
              key={med.slug}
              href={`/medications/${med.slug}`}
              className="group flex items-start gap-3 bg-white border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:shadow-card transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight">
                  {med.genericName}
                </p>
                {med.shortDescription && (
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-2">
                    {med.shortDescription}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif] ${
                    med.rxStatus === "otc" ? "bg-[#006828]/[0.08] text-[#006828]" :
                    med.rxStatus === "controlled" ? "bg-red-500/[0.08] text-red-700" :
                    "bg-amber-500/[0.08] text-amber-700"
                  }`}>
                    {med.rxStatus === "otc" ? "OTC" : med.rxStatus === "controlled" ? "Controlled" : "Rx"}
                  </span>
                  {med.isHighIntent && (
                    <span className="inline-block bg-purple-500/[0.08] text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">
                      Popular
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Find Pharmacies */}
      <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6 mb-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-2">
          Find {cls.name} at a Pharmacy
        </h2>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-3">
          Browse UAE pharmacies to check availability of {cls.name.toLowerCase()}.
        </p>
        <Link
          href="/directory/dubai/pharmacy"
          className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]"
        >
          Browse Pharmacies <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> This page lists medications in the {cls.name.toLowerCase()} class for informational purposes.
          It is not medical advice. Consult a licensed healthcare provider for prescribing guidance.{" "}
          <FileText className="inline h-3 w-3" /> Data from publicly available pharmaceutical references.
        </p>
      </div>
    </div>
  );
}
