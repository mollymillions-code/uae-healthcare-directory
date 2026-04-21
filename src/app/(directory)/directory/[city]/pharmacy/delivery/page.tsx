import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { city: string } }

export function generateStaticParams() {
  return getCities().filter(c => c.country === "ae").map(c => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();
  const { total } = await safe(
    getProviders({ citySlug: city.slug, categorySlug: "pharmacy", limit: 1 }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "pharmacy-delivery-meta",
  );
  return {
    title: `Pharmacy Delivery Guide for ${city.name} — How to Get Medications Delivered`,
    description: `Guide to pharmacy delivery services in ${city.name}, UAE. ${total} pharmacies in the area — contact them to ask about home delivery options.`,
    alternates: { canonical: `${base}/directory/${city.slug}/pharmacy/delivery` },
  };
}

export default async function CityPharmacyDeliveryPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();
  const base = getBaseUrl();
  const { providers, total } = await safe(
    getProviders({ citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 20 }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "pharmacy-delivery",
  );

  const pharmacyItems: HubItem[] = providers.map((p) => ({
    href: `/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`,
    label: p.name,
    subLabel: p.address ?? undefined,
    count: p.googleReviewCount > 0 ? p.googleReviewCount : null,
  }));

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Pharmacy", href: `/directory/${city.slug}/pharmacy` },
        { label: "Delivery" },
      ]}
      eyebrow={`${city.name} · Pharmacy delivery`}
      title={`Pharmacy Delivery in ${city.name}.`}
      subtitle={
        <>
          {total} registered pharmacies in {city.name}. Many UAE pharmacies offer home delivery —
          contact individual pharmacies to ask about their delivery options, coverage area, and hours.
          Prescription medications require a valid UAE prescription.
        </>
      }
      stats={[
        { n: String(total), l: "Pharmacies" },
        { n: city.name, l: "Emirate" },
      ]}
      aeoAnswer={
        <>
          {city.name} has {total} registered pharmacies. Many UAE pharmacies offer home delivery — however,
          we do not currently have structured delivery capability data per pharmacy. Contact individual
          pharmacies below to ask about their delivery options, coverage area, and hours. Prescription
          medications require a valid UAE prescription for delivery.
        </>
      }
      schemas={
        <>
          <JsonLd data={breadcrumbSchema([
            { name: "UAE", url: base },
            { name: city.name, url: `${base}/directory/${city.slug}` },
            { name: "Pharmacy", url: `${base}/directory/${city.slug}/pharmacy` },
            { name: "Delivery" },
          ])} />
          <JsonLd data={speakableSchema([".answer-block"])} />
        </>
      }
      sections={[
        {
          title: `Pharmacies in ${city.name} — ask about delivery`,
          eyebrow: "Top-rated pharmacies",
          items: pharmacyItems,
          layout: "grid",
          gridCols: "3",
        },
      ]}
      ctaBanner={
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href={`/directory/${city.slug}/pharmacy`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">All pharmacies</Link>
            <Link href={`/directory/${city.slug}/24-hour/pharmacy`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">24-hour</Link>
            <Link href="/pharmacy/how-delivery-works" className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">How delivery works</Link>
            <Link href="/medications" className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">Medication directory</Link>
          </div>

          <div className="rounded-z-md border border-ink-line bg-surface-cream p-6">
            <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">
              Need a specific medication?
            </h3>
            <p className="font-sans text-z-body-sm text-ink-muted mb-3">
              Search our medication directory to find which drugs are available in {city.name} pharmacies.
            </p>
            <Link
              href="/medications"
              className="inline-flex items-center font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
            >
              Browse medications &rarr;
            </Link>
          </div>

          <div className="mt-4 border-t border-ink-line pt-4">
            <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
              <strong>Disclaimer.</strong> Delivery availability is not guaranteed for all pharmacies
              listed. Contact the pharmacy directly to confirm delivery coverage in your area. Prescription
              medications require a valid UAE prescription. Data from official UAE health authority registers.
            </p>
          </div>
        </>
      }
    />
  );
}
