import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getMedicationWithBrands,
  getMedicationsByClass,
  getAllMedicationSlugs,
} from "@/lib/medications";
import { gateMedicationPage } from "@/lib/medication-gating";
import { safe } from "@/lib/safeData";
import {
  AlertTriangle, FlaskConical, ShieldCheck,
  Stethoscope, ArrowRight, Building2, ChevronRight, Sparkles,
} from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const slugs = await getAllMedicationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getMedicationWithBrands(params.slug);
  if (!data) return {};

  const { medication: med } = data;
  const base = getBaseUrl();
  const gate = gateMedicationPage(med);

  const brandNames = data.brands.map((b) => b.brandName).slice(0, 3).join(", ");
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
  const data = await safe(getMedicationWithBrands(params.slug), null, "medWithBrands");
  if (!data) notFound();

  const { medication: med, brands, medicationClass } = data;
  const base = getBaseUrl();

  // Related medications in same class
  const classMeds = med.classSlug
    ? (await safe(getMedicationsByClass(med.classSlug), [] as Awaited<ReturnType<typeof getMedicationsByClass>>, "classMeds"))
        .filter((m) => m.slug !== med.slug)
        .slice(0, 6)
    : [];

  const rxLabel = med.rxStatus === "otc"
    ? "Over-the-Counter (OTC)"
    : med.rxStatus === "controlled"
    ? "Controlled Substance"
    : "Prescription Required";

  const rxBadgeTone = med.rxStatus === "otc"
    ? "bg-accent-muted text-accent-deep"
    : med.rxStatus === "controlled"
    ? "bg-red-500/[0.08] text-red-700"
    : "bg-amber-500/[0.08] text-amber-700";

  return (
    <>
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink transition-colors">UAE</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/medications" className="hover:text-ink transition-colors">Medications</Link>
            {medicationClass && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link
                  href={`/medication-classes/${medicationClass.slug}`}
                  className="hover:text-ink transition-colors"
                >
                  {medicationClass.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">{med.genericName}</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Medication
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
            {med.genericName}
          </h1>
          {medicationClass && (
            <p className="font-sans text-z-body text-ink-soft mt-2">
              <Link
                href={`/medication-classes/${medicationClass.slug}`}
                className="text-accent-dark hover:underline font-medium"
              >
                {medicationClass.name}
              </Link>
            </p>
          )}

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap mt-5">
            <span className={`inline-flex items-center gap-1 text-z-caption font-sans font-medium px-3 py-1 rounded-z-pill ${rxBadgeTone}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {rxLabel}
            </span>
            {med.requiresMonitoringLabs && (
              <span className="inline-flex items-center gap-1 bg-blue-500/[0.08] text-blue-700 text-z-caption font-sans font-medium px-3 py-1 rounded-z-pill">
                <FlaskConical className="h-3.5 w-3.5" />
                Lab monitoring required
              </span>
            )}
            {med.isHighIntent && (
              <span className="inline-flex items-center gap-1 bg-purple-500/[0.08] text-purple-700 text-z-caption font-sans font-medium px-3 py-1 rounded-z-pill">
                High search demand
              </span>
            )}
          </div>

          {/* AEO answer block */}
          <div className="mt-6 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {med.shortDescription || `${med.genericName} is a medication available in UAE pharmacies.`}
              {med.isPrescriptionRequired
                ? " A prescription from a licensed UAE physician is required to obtain this medication."
                : " This medication is available over the counter at UAE pharmacies without a prescription."}
              {brands.length > 0 && ` Available under brand names: ${brands.map((b) => b.brandName).join(", ")}.`}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Brand Names */}
            {brands.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
                  Brand names
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {brands.map((brand) => (
                    <Link
                      key={brand.slug}
                      href={`/brands/${brand.slug}`}
                      className="group flex items-center justify-between rounded-z-md bg-white border border-ink-line p-4 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                    >
                      <div className="min-w-0">
                        <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                          {brand.brandName}
                        </p>
                        {brand.manufacturer && (
                          <p className="font-sans text-z-caption text-ink-muted mt-1 inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {brand.manufacturer}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Common Conditions */}
            {med.commonConditions.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
                  Common uses
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {med.commonConditions.map((condition) => (
                    <li key={condition}>
                      <span className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink">
                        {condition.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Lab Monitoring */}
            {med.labMonitoringNotes.length > 0 && (
              <section>
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-accent-dark" />
                  Lab monitoring
                </h2>
                <ul className="space-y-3">
                  {med.labMonitoringNotes.map((note, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-z-md bg-white border border-ink-line p-4 font-sans text-z-body-sm text-ink-soft leading-relaxed"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Related Medications in Same Class */}
            {classMeds.length > 0 && medicationClass && (
              <section>
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mb-4">
                  Other {medicationClass.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classMeds.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/medications/${m.slug}`}
                      className="group flex items-center justify-between rounded-z-md bg-white border border-ink-line p-4 hover:border-ink hover:shadow-z-card transition-all duration-z-base font-sans text-z-body-sm text-ink"
                    >
                      <span className="group-hover:underline decoration-1 underline-offset-2">{m.genericName}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/medications/${med.slug}/alternatives`}
                    className="inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-ink hover:text-ink-soft group"
                  >
                    See all alternatives
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Facts */}
            <section className="rounded-z-md bg-white border border-ink-line p-6">
              <h3 className="font-display font-semibold text-ink text-z-h3 tracking-[-0.018em] mb-4">
                Quick facts
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-[0.04em] text-ink-muted">Generic name</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-1">{med.genericName}</dd>
                </div>
                {medicationClass && (
                  <div>
                    <dt className="font-sans text-z-micro uppercase tracking-[0.04em] text-ink-muted">Drug class</dt>
                    <dd className="font-sans text-z-body-sm text-ink mt-1">{medicationClass.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-[0.04em] text-ink-muted">Prescription status</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-1">{rxLabel}</dd>
                </div>
                {brands.length > 0 && (
                  <div>
                    <dt className="font-sans text-z-micro uppercase tracking-[0.04em] text-ink-muted">Brand names</dt>
                    <dd className="font-sans text-z-body-sm text-ink mt-1">{brands.map((b) => b.brandName).join(", ")}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Prescribing Specialties */}
            {med.commonSpecialties.length > 0 && (
              <section className="rounded-z-md bg-white border border-ink-line p-6">
                <h3 className="font-display font-semibold text-ink text-z-h3 tracking-[-0.018em] mb-3 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-accent-dark" />
                  Prescribing specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {med.commonSpecialties.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center rounded-z-pill bg-accent-muted text-accent-deep px-3 py-1 font-sans text-z-caption font-medium"
                    >
                      {spec.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Find Pharmacies CTA */}
            <section className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-6">
              <div className="absolute -top-20 -right-16 h-[220px] w-[220px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
              <div className="relative">
                <h3 className="font-display font-semibold text-white text-z-h3 tracking-[-0.018em]">
                  Find a pharmacy
                </h3>
                <p className="font-sans text-white/70 text-z-body-sm mt-2 leading-relaxed">
                  Browse pharmacies near you that may stock {med.genericName}.
                </p>
                <Link
                  href="/pharmacy"
                  className="mt-4 inline-flex items-center gap-2 rounded-z-pill bg-accent hover:bg-accent-light text-white font-sans font-semibold text-z-body-sm px-5 py-2.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,200,83,0.5)]"
                >
                  <Building2 className="h-4 w-4" />
                  Browse UAE pharmacies
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This page is for informational purposes only. It does not
            constitute medical advice. Always consult your doctor or pharmacist before taking {med.genericName}.
            Drug availability may vary across UAE pharmacies. Do not start, stop, or change any medication
            without professional guidance. Data sourced from publicly available pharmaceutical references.
          </p>
        </div>
      </div>
    </>
  );
}
