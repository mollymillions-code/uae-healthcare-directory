import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getMedicationWithBrands,
  getMedicationsByClass,
  getAllMedicationSlugs,
} from "@/lib/medications";
import { gateMedicationPage } from "@/lib/medication-gating";
import {
  Pill, AlertTriangle, FlaskConical, ShieldCheck,
  Stethoscope, ArrowRight, Building2, FileText,
} from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllMedicationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getMedicationWithBrands(params.slug);
  if (!data) return {};

  const { medication: med } = data;
  const base = getBaseUrl();
  const gate = gateMedicationPage(med);

  const brandNames = data.brands.map(b => b.brandName).slice(0, 3).join(", ");
  const brandBit = brandNames ? ` (${brandNames})` : "";

  return {
    title: `${med.genericName}${brandBit} — Uses, Side Effects & UAE Pharmacy Guide`,
    description: med.shortDescription
      ? `${med.shortDescription} Available in UAE pharmacies. ${med.isPrescriptionRequired ? "Prescription required." : "Available over the counter."}`
      : `${med.genericName} medication guide for UAE patients. Prescribing information, brand names, and pharmacy access.`,
    ...(!gate.index ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: gate.canonicalOverride || `${base}/medications/${med.slug}`,
    },
    openGraph: {
      title: `${med.genericName} — UAE Medication Guide`,
      description: med.shortDescription || `${med.genericName} prescribing information and pharmacy access in the UAE.`,
      type: "website",
      url: `${base}/medications/${med.slug}`,
    },
  };
}

export default async function MedicationPage({ params }: Props) {
  const data = await getMedicationWithBrands(params.slug);
  if (!data) notFound();

  const { medication: med, brands, medicationClass } = data;
  const base = getBaseUrl();

  // Related medications in same class
  const classMeds = med.classSlug
    ? (await getMedicationsByClass(med.classSlug)).filter(m => m.slug !== med.slug).slice(0, 6)
    : [];

  const rxLabel = med.rxStatus === "otc" ? "Over-the-Counter (OTC)" : med.rxStatus === "controlled" ? "Controlled Substance" : "Prescription Required";

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        ...(medicationClass ? [{ name: medicationClass.name, url: `${base}/medication-classes/${medicationClass.slug}` }] : []),
        { name: med.genericName },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Drug",
        name: med.genericName,
        description: med.shortDescription || undefined,
        drugClass: medicationClass?.name || undefined,
        isProprietary: false,
        nonProprietaryName: med.genericName,
        prescriptionStatus: med.isPrescriptionRequired ? "PrescriptionOnly" : "OTC",
      }} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        ...(medicationClass ? [{ label: medicationClass.name, href: `/medication-classes/${medicationClass.slug}` }] : []),
        { label: med.genericName },
      ]} />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Pill className="h-8 w-8 text-[#006828]" />
          <div>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
              {med.genericName}
            </h1>
            {medicationClass && (
              <Link href={`/medication-classes/${medicationClass.slug}`} className="font-['Geist',sans-serif] text-sm text-[#006828] hover:underline">
                {medicationClass.name}
              </Link>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif] ${
            med.rxStatus === "otc" ? "bg-[#006828]/[0.08] text-[#006828]" :
            med.rxStatus === "controlled" ? "bg-red-500/[0.08] text-red-700" :
            "bg-amber-500/[0.08] text-amber-700"
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {rxLabel}
          </span>
          {med.requiresMonitoringLabs && (
            <span className="inline-flex items-center gap-1 bg-blue-500/[0.08] text-blue-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
              <FlaskConical className="h-3.5 w-3.5" />
              Lab Monitoring Required
            </span>
          )}
          {med.isHighIntent && (
            <span className="inline-flex items-center gap-1 bg-purple-500/[0.08] text-purple-700 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
              High Search Demand
            </span>
          )}
        </div>

        {/* Answer block */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {med.shortDescription || `${med.genericName} is a medication available in UAE pharmacies.`}
            {med.isPrescriptionRequired
              ? " A prescription from a licensed UAE physician is required to obtain this medication."
              : " This medication is available over the counter at UAE pharmacies without a prescription."}
            {brands.length > 0 && ` Available under brand names: ${brands.map(b => b.brandName).join(", ")}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Brand Names */}
          {brands.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Brand Names
                </h2>
              </div>
              <div className="space-y-3">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/brands/${brand.slug}`}
                    className="group flex items-center justify-between p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/15 hover:bg-[#f8f8f6] transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                        {brand.brandName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {brand.manufacturer && (
                          <span className="font-['Geist',sans-serif] text-xs text-black/40 flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {brand.manufacturer}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Common Conditions */}
          {med.commonConditions.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Common Uses
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {med.commonConditions.map((condition) => (
                  <span key={condition} className="inline-block bg-[#f8f8f6] border border-black/[0.06] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg font-['Geist',sans-serif]">
                    {condition.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Lab Monitoring */}
          {med.labMonitoringNotes.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-[#006828]" /> Lab Monitoring
                </h2>
              </div>
              <ul className="space-y-2">
                {med.labMonitoringNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 font-['Geist',sans-serif] text-sm text-black/70">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related Medications in Same Class */}
          {classMeds.length > 0 && medicationClass && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Other {medicationClass.name}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classMeds.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/medications/${m.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/15 hover:bg-[#f8f8f6] transition-all font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828]"
                  >
                    {m.genericName}
                    <ArrowRight className="h-3.5 w-3.5 text-black/20 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Facts */}
          <section className="rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-4">
              Quick Facts
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Generic Name</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{med.genericName}</dd>
              </div>
              {medicationClass && (
                <div>
                  <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Drug Class</dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{medicationClass.name}</dd>
                </div>
              )}
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Prescription Status</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{rxLabel}</dd>
              </div>
              {brands.length > 0 && (
                <div>
                  <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Brand Names</dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{brands.map(b => b.brandName).join(", ")}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Prescribing Specialties */}
          {med.commonSpecialties.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-[#006828]" /> Prescribing Specialties
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {med.commonSpecialties.map((spec) => (
                  <span key={spec} className="inline-block bg-[#006828]/[0.06] text-[#006828] text-[11px] font-medium px-2.5 py-1 rounded-full font-['Geist',sans-serif]">
                    {spec.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Find Pharmacies CTA */}
          <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-2">
              Find a Pharmacy
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 mb-3">
              Browse pharmacies near you that may stock {med.genericName}.
            </p>
            <Link
              href="/directory/dubai/pharmacy"
              className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]"
            >
              <Building2 className="h-4 w-4" /> Browse UAE Pharmacies
            </Link>
          </section>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Medical Disclaimer.</strong> This page is for informational purposes only. It does not
          constitute medical advice. Always consult your doctor or pharmacist before taking {med.genericName}.
          Drug availability may vary across UAE pharmacies. Do not start, stop, or change any medication
          without professional guidance.{" "}
          <FileText className="inline h-3 w-3" /> Data sourced from publicly available pharmaceutical references.
        </p>
      </div>
    </div>
  );
}
