import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { city: string; insurer: string } }

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities().filter(c => c.country === "ae");
  const insurers = INSURANCE_PROVIDERS.slice(0, 15);
  return cities.flatMap(city =>
    insurers.map(ins => ({ city: city.slug, insurer: ins.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  const insurer = INSURANCE_PROVIDERS.find(i => i.slug === params.insurer);
  if (!city || !insurer) return {};
  const base = getBaseUrl();

  // Query and filter to check if we have real matched data for this
  // city+insurer combo. noindex when the matched set is empty —
  // prevents indexing a misleading page that shows unrelated pharmacies.
  const { providers } = await safe(
    getProviders({
      citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 50,
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "pharmacy-ins-meta",
  );
  const insurerLower = insurer.name.toLowerCase();
  const matchCount = providers.filter(p =>
    p.insurance && p.insurance.some((ins: string) => {
      const insLower = ins.toLowerCase();
      return insLower === insurerLower || insLower.startsWith(insurerLower + " ") || insLower.endsWith(" " + insurerLower);
    })
  ).length;

  return {
    title: `Pharmacies Accepting ${insurer.name} in ${city.name} — UAE Directory`,
    description: matchCount > 0
      ? `${matchCount} pharmacies in ${city.name} accept ${insurer.name} insurance. Browse verified listings with ratings and hours.`
      : `Looking for pharmacies accepting ${insurer.name} in ${city.name}? Contact pharmacies directly to confirm insurance acceptance.`,
    // noindex when we have no real insurer-matched pharmacies — the page
    // would just show generic top pharmacies which is misleading.
    ...(matchCount === 0 ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `${base}/directory/${city.slug}/pharmacy/insurance/${insurer.slug}` },
  };
}

export default async function CityPharmacyInsurerPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const insurer = INSURANCE_PROVIDERS.find(i => i.slug === params.insurer);
  if (!city || !insurer) notFound();
  const base = getBaseUrl();

  // Fetch a larger set to improve match chances, then filter.
  const { providers, total } = await safe(
    getProviders({
      citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 50,
    }),
    { providers: [], total: 0, page: 1, totalPages: 1 } as Awaited<ReturnType<typeof getProviders>>,
    "pharmacy-ins",
  );

  const insurerLower = insurer.name.toLowerCase();
  const filtered = providers.filter(p =>
    p.insurance && p.insurance.some((ins: string) => {
      const insLower = ins.toLowerCase();
      return insLower === insurerLower || insLower.startsWith(insurerLower + " ") || insLower.endsWith(" " + insurerLower);
    })
  );

  const hasMatches = filtered.length > 0;

  const otherInsurers = INSURANCE_PROVIDERS
    .filter(i => i.slug !== insurer.slug)
    .slice(0, 8);

  const filteredItems: HubItem[] = filtered.map((p) => ({
    href: `/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`,
    label: p.name,
    subLabel: p.address ?? undefined,
  }));

  const otherInsurerItems: HubItem[] = otherInsurers.map((ins) => ({
    href: `/directory/${city.slug}/pharmacy/insurance/${ins.slug}`,
    label: ins.name,
  }));

  const sections = [] as Parameters<typeof HubPageTemplate>[0]["sections"];
  if (hasMatches) {
    sections.push({
      title: `${filtered.length} pharmacies with ${insurer.name}`,
      eyebrow: "Matched pharmacies",
      items: filteredItems,
      layout: "grid",
      gridCols: "3",
    });
  }
  sections.push({
    title: "Other insurance plans",
    items: otherInsurerItems,
    layout: "chips",
  });

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: city.name, href: `/directory/${city.slug}` },
          { label: "Pharmacy", href: `/directory/${city.slug}/pharmacy` },
          { label: `${insurer.name} Insurance` },
        ]}
        eyebrow={`${insurer.name} · ${city.name}`}
        title={`Pharmacies Accepting ${insurer.name} in ${city.name}.`}
        subtitle={
          hasMatches
            ? <>We found {filtered.length} pharmacies in {city.name} that list {insurer.name} as an accepted insurance provider. {city.name} has {total} total registered pharmacies.</>
            : <>Our records do not currently show specific pharmacies in {city.name} with confirmed {insurer.name} acceptance. {city.name} has {total} registered pharmacies — contact them directly to verify {insurer.name} coverage.</>
        }
        stats={[
          { n: String(filtered.length), l: "Matched" },
          { n: String(total), l: "Total pharmacies" },
        ]}
        aeoAnswer={
          hasMatches
            ? <>We found {filtered.length} pharmacies in {city.name} that list {insurer.name} as an accepted insurance provider. {city.name} has {total} total registered pharmacies. Always bring your insurance card and verify coverage before purchasing medications.</>
            : <>Our records do not currently show specific pharmacies in {city.name} with confirmed {insurer.name} acceptance. {city.name} has {total} registered pharmacies — contact them directly to verify {insurer.name} coverage. Insurance acceptance data is updated periodically from provider submissions.</>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: city.name, url: `${base}/directory/${city.slug}` },
              { name: "Pharmacy", url: `${base}/directory/${city.slug}/pharmacy` },
              { name: `${insurer.name} Insurance` },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
          </>
        }
        sections={sections}
        ctaBanner={
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <Link href={`/directory/${city.slug}/pharmacy`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">All pharmacies in {city.name}</Link>
              <Link href={`/directory/${city.slug}/pharmacy/delivery`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">Delivery</Link>
              <Link href={`/directory/${city.slug}/insurance`} className="inline-flex items-center rounded-z-pill bg-white border border-ink-line px-3.5 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors">All {insurer.name} providers</Link>
            </div>

            {!hasMatches && (
              <div className="text-center py-12 bg-surface-cream rounded-z-md border border-ink-line mb-4">
                <p className="font-sans text-z-body text-ink-muted mb-3">
                  We don&apos;t have confirmed {insurer.name} acceptance data for pharmacies in {city.name} yet.
                </p>
                <Link
                  href={`/directory/${city.slug}/pharmacy`}
                  className="inline-flex items-center font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
                >
                  Browse all {city.name} pharmacies &rarr;
                </Link>
              </div>
            )}

            <div className="border-t border-ink-line pt-4">
              <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
                <strong>Disclaimer.</strong> Insurance acceptance data is based on provider-submitted
                information and may not be current. Always verify {insurer.name} coverage directly with
                the pharmacy before purchasing medications.
              </p>
            </div>
          </>
        }
      />
    </>
  );
}
