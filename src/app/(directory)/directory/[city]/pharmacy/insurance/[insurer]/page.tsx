import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { INSURANCE_PROVIDERS } from "@/lib/constants/insurance";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { ShieldCheck } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { city: string; insurer: string } }

export function generateStaticParams() {
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
  const { providers } = await getProviders({
    citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 50,
  });
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
  const { providers, total } = await getProviders({
    citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 50,
  });

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

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Pharmacy", url: `${base}/directory/${city.slug}/pharmacy` },
        { name: `${insurer.name} Insurance` },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Pharmacy", href: `/directory/${city.slug}/pharmacy` },
        { label: `${insurer.name} Insurance` },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="h-8 w-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Pharmacies Accepting {insurer.name} in {city.name}
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {hasMatches
              ? `We found ${filtered.length} pharmacies in ${city.name} that list ${insurer.name} as an accepted insurance provider. ${city.name} has ${total} total registered pharmacies. Always bring your insurance card and verify coverage before purchasing medications.`
              : `Our records do not currently show specific pharmacies in ${city.name} with confirmed ${insurer.name} acceptance. ${city.name} has ${total} registered pharmacies — contact them directly to verify ${insurer.name} coverage. Insurance acceptance data is updated periodically from provider submissions.`}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/directory/${city.slug}/pharmacy`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">All Pharmacies in {city.name}</Link>
        <Link href={`/directory/${city.slug}/pharmacy/delivery`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">Delivery</Link>
        <Link href={`/directory/${city.slug}/insurance`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">All {insurer.name} Providers</Link>
      </div>

      {/* Only show matched pharmacies — NEVER fall back to generic top
          pharmacies, which would mislead users into thinking those
          pharmacies accept the insurer. */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            {hasMatches ? `${filtered.length} Pharmacies with ${insurer.name}` : `No Confirmed ${insurer.name} Pharmacies`}
          </h2>
        </div>
        {hasMatches ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProviderCard
                key={p.id} name={p.name} slug={p.slug} citySlug={p.citySlug}
                categorySlug={p.categorySlug} address={p.address} phone={p.phone}
                website={p.website} shortDescription={p.shortDescription}
                googleRating={p.googleRating} googleReviewCount={p.googleReviewCount}
                isClaimed={p.isClaimed} isVerified={p.isVerified}
                coverImageUrl={p.coverImageUrl}
                insurance={p.insurance} operatingHours={p.operatingHours}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#f8f8f6] rounded-2xl border border-black/[0.06]">
            <p className="font-['Geist',sans-serif] text-black/40 mb-3">
              We don&apos;t have confirmed {insurer.name} acceptance data for pharmacies in {city.name} yet.
            </p>
            <Link href={`/directory/${city.slug}/pharmacy`}
              className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]">
              Browse All {city.name} Pharmacies
            </Link>
          </div>
        )}
      </section>

      {/* Other insurers */}
      {otherInsurers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
              Other Insurance Plans
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherInsurers.map((ins) => (
              <Link key={ins.slug} href={`/directory/${city.slug}/pharmacy/insurance/${ins.slug}`}
                className="inline-block bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 hover:text-[#006828] transition-all font-['Geist',sans-serif]">
                {ins.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> Insurance acceptance data is based on provider-submitted information and may not be current.
          Always verify {insurer.name} coverage directly with the pharmacy before purchasing medications.
        </p>
      </div>
    </div>
  );
}
