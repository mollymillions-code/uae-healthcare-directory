import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { getMedicationWithBrands, getHighIntentMedications } from "@/lib/medications";
import { gateMedicationPage } from "@/lib/medication-gating";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { city: string; generic: string } }

// Only pre-generate for high-intent medications × UAE cities
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities().filter(c => c.country === "ae");
  const highIntent = await getHighIntentMedications(50);
  return cities.flatMap(city =>
    highIntent.filter(m => m.isCitySensitive || m.isHighIntent).map(med => ({
      city: city.slug,
      generic: med.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  const data = await safe(
    getMedicationWithBrands(params.generic),
    null as Awaited<ReturnType<typeof getMedicationWithBrands>>,
    "medWithBrands-meta",
  );
  if (!city || !data) return {};
  const { medication: med } = data;
  const base = getBaseUrl();
  const gate = gateMedicationPage(med);

  // Only city-sensitive or high-intent meds get indexed at city level
  const shouldIndex = gate.index && (med.isCitySensitive || med.isHighIntent);

  return {
    title: `${med.genericName} in ${city.name} — Pharmacy Access & Availability`,
    description: `Find ${med.genericName}${data.brands.length > 0 ? ` (${data.brands.map(b => b.brandName).slice(0, 2).join(", ")})` : ""} at pharmacies in ${city.name}, UAE. ${med.isPrescriptionRequired ? "Prescription required." : "Available OTC."}`,
    ...(!shouldIndex ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: shouldIndex
        ? `${base}/directory/${city.slug}/medications/${med.slug}`
        : `${base}/medications/${med.slug}`, // non-local meds canonicalize to the generic page
    },
  };
}

export default async function CityMedicationPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const data = await safe(
    getMedicationWithBrands(params.generic),
    null as Awaited<ReturnType<typeof getMedicationWithBrands>>,
    "medWithBrands",
  );
  if (!city || !data) notFound();

  const { medication: med, brands } = data;
  const base = getBaseUrl();

  // Get pharmacy count for this city
  const { total: pharmacyCount } = await safe(
    getProviders({ citySlug: city.slug, categorySlug: "pharmacy", limit: 1 }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "med-city-pharmCount",
  );

  const brandNames = brands.map(b => b.brandName).join(", ");

  const brandItems: HubItem[] = brands.map((brand) => ({
    href: `/brands/${brand.slug}`,
    label: brand.brandName,
    subLabel: brand.manufacturer ? `by ${brand.manufacturer}` : undefined,
  }));

  const conditionItems: HubItem[] = med.commonConditions.map((c) => ({
    href: `/conditions/${c}/medications`,
    label: c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const sections: Parameters<typeof HubPageTemplate>[0]["sections"] = [];
  if (brandItems.length > 0) {
    sections.push({
      title: "Brand names (UAE-wide)",
      eyebrow: "Available brands",
      items: brandItems,
      layout: "grid",
      gridCols: "2",
    });
  }
  if (conditionItems.length > 0) {
    sections.push({
      title: "Common uses",
      items: conditionItems,
      layout: "chips",
    });
  }

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Medications", href: "/medications" },
        { label: med.genericName },
      ]}
      eyebrow={`${med.genericName} · ${city.name}`}
      title={`${med.genericName} in ${city.name}.`}
      subtitle={
        <>
          {city.name}, UAE · {pharmacyCount} pharmacies · {med.isPrescriptionRequired ? "Prescription required" : "Available OTC"}
        </>
      }
      stats={[
        { n: String(pharmacyCount), l: "Pharmacies in city" },
        {
          n: med.rxStatus === "otc" ? "OTC" : med.rxStatus === "controlled" ? "Ctrl" : "Rx",
          l: "Status",
        },
      ]}
      aeoAnswer={
        <>
          {med.genericName}{brandNames ? ` (sold as ${brandNames})` : ""} is a medication that may be stocked at pharmacies in {city.name}. {city.name} has {pharmacyCount} registered pharmacies — contact them to confirm availability.
          {med.isPrescriptionRequired
            ? " This medication requires a prescription from a licensed UAE physician."
            : " This medication is available over the counter without a prescription."}
          {med.shortDescription ? ` ${med.shortDescription}` : ""}
        </>
      }
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Medications", url: `${base}/medications` },
            { name: med.genericName },
          ])} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      sections={sections}
      ctaBanner={
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-z-md border border-ink-line bg-surface-cream p-6">
              <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">
                Find a pharmacy in {city.name}
              </h3>
              <p className="font-sans text-z-body-sm text-ink-muted mb-3">
                Browse {pharmacyCount} pharmacies in {city.name} that may stock {med.genericName}.
              </p>
              <Link
                href={`/directory/${city.slug}/pharmacy`}
                className="inline-flex items-center font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
              >
                Browse {city.name} pharmacies &rarr;
              </Link>
            </div>

            <div className="rounded-z-md border border-ink-line bg-white p-6">
              <h3 className="font-display font-semibold text-ink text-z-h3 mb-3">Quick facts</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-wider text-ink-muted">Medication</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-0.5">{med.genericName}</dd>
                </div>
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-wider text-ink-muted">City</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-0.5">{city.name}</dd>
                </div>
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-wider text-ink-muted">Status</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-0.5">
                    {med.rxStatus === "otc" ? "Over-the-Counter" : med.rxStatus === "controlled" ? "Controlled" : "Prescription Required"}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-z-micro uppercase tracking-wider text-ink-muted">Pharmacies in {city.name}</dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-0.5">{pharmacyCount}</dd>
                </div>
              </dl>
            </div>
          </div>

          <Link
            href={`/medications/${med.slug}`}
            className="group flex items-center justify-between p-4 rounded-z-md border-2 border-accent-dark/20 bg-accent-muted hover:bg-accent-muted/80 transition-all"
          >
            <div>
              <p className="font-display font-semibold text-ink group-hover:text-accent-dark transition-colors">
                Full {med.genericName} medication guide
              </p>
              <p className="font-sans text-z-caption text-ink-muted mt-0.5">
                Lab monitoring, alternatives, prescribing specialties
              </p>
            </div>
          </Link>

          <div className="mt-6 border-t border-ink-line pt-4">
            <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
              <strong>Disclaimer.</strong> Drug availability at specific pharmacies in {city.name} is not
              guaranteed. Always call ahead to confirm stock. This page is for informational purposes only —
              consult a licensed physician before taking any medication.
            </p>
          </div>
        </>
      }
    />
  );
}
