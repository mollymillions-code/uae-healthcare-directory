import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { speakableSchema, breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getAllMedicationClasses,
  getHighIntentMedications,
  getMedicationCount,
  getBrandCount,
  getClassCount,
} from "@/lib/medications";
import { Pill, Search, ShieldCheck, ArrowRight } from "lucide-react";

export const revalidate = 43200; // 12 hours

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  const medCount = await getMedicationCount();
  return {
    title: `${medCount}+ Medications in the UAE — Generic & Brand Guide`,
    description: `Browse ${medCount}+ medications available in the UAE. Find generic names, brand equivalents, prescribing info, and pharmacy access. Free, verified medication directory by Zavis.`,
    alternates: {
      canonical: `${base}/medications`,
    },
    openGraph: {
      title: "UAE Medication Directory — Generics, Brands & Pharmacy Access",
      description: `${medCount}+ medications with prescribing details, brand equivalents, and pharmacy access information.`,
      type: "website",
      url: `${base}/medications`,
    },
  };
}

export default async function MedicationsHubPage() {
  const base = getBaseUrl();
  const [classes, highIntent, medCount, brandCount, classCount] = await Promise.all([
    getAllMedicationClasses(),
    getHighIntentMedications(12),
    getMedicationCount(),
    getBrandCount(),
    getClassCount(),
  ]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: "Medications" }]} />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          UAE Medication Directory
        </h1>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            The UAE Medication Directory covers {medCount}+ generic medications across {classCount} therapeutic classes,
            with {brandCount}+ brand names. Find prescribing information, generic-vs-brand guidance, lab monitoring
            requirements, and pharmacy access for medications available in the UAE and GCC.
            This directory is for informational purposes only — always consult a licensed healthcare provider
            before starting or changing medication.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Medications", value: medCount, icon: Pill },
          { label: "Brand Names", value: brandCount, icon: Search },
          { label: "Drug Classes", value: classCount, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4 text-center">
            <stat.icon className="h-5 w-5 text-[#006828] mx-auto mb-2" />
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-[#1c1c1c]">{stat.value}</p>
            <p className="font-['Geist',sans-serif] text-xs text-black/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* High-Intent Medications */}
      {highIntent.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Most Searched Medications
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highIntent.map((med) => (
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
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">
                      {med.rxStatus === "otc" ? "OTC" : med.rxStatus === "controlled" ? "Controlled" : "Rx"}
                    </span>
                    {med.requiresMonitoringLabs && (
                      <span className="inline-block bg-amber-500/[0.08] text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full font-['Geist',sans-serif]">
                        Lab monitoring
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors mt-1 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse by Class */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Browse by Drug Class
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((cls) => (
            <Link
              key={cls.slug}
              href={`/medication-classes/${cls.slug}`}
              className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:shadow-card transition-all"
            >
              <div className="min-w-0">
                <span className="font-['Geist',sans-serif] font-medium block">{cls.name}</span>
                {cls.shortDescription && (
                  <span className="font-['Geist',sans-serif] text-xs text-black/40 block mt-0.5 line-clamp-1">
                    {cls.shortDescription}
                  </span>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-black/20 flex-shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Medical Disclaimer.</strong> This medication directory is for informational purposes only
          and does not constitute medical advice. Always consult a licensed healthcare provider before
          starting, stopping, or changing any medication. Drug availability, pricing, and regulations
          may vary across UAE emirates and GCC countries. Data compiled from publicly available
          pharmaceutical references and verified against UAE MOH guidelines. Last updated April 2026.
        </p>
      </div>
    </div>
  );
}
