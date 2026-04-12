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
  const insurers = INSURANCE_PROVIDERS.slice(0, 15); // top 15 insurers
  return cities.flatMap(city =>
    insurers.map(ins => ({ city: city.slug, insurer: ins.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  const insurer = INSURANCE_PROVIDERS.find(i => i.slug === params.insurer);
  if (!city || !insurer) return {};
  const base = getBaseUrl();
  return {
    title: `Pharmacies Accepting ${insurer.name} in ${city.name} — UAE Directory`,
    description: `Find pharmacies in ${city.name} that accept ${insurer.name} insurance. Browse verified pharmacy listings with ratings, hours, and contact details.`,
    alternates: { canonical: `${base}/directory/${city.slug}/pharmacy/insurance/${insurer.slug}` },
  };
}

export default async function CityPharmacyInsurerPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  const insurer = INSURANCE_PROVIDERS.find(i => i.slug === params.insurer);
  if (!city || !insurer) notFound();
  const base = getBaseUrl();
  const { providers, total } = await getProviders({
    citySlug: city.slug,
    categorySlug: "pharmacy",
    sort: "rating",
    limit: 20,
  });

  // Filter to pharmacies that list this insurer — use word-boundary
  // matching to avoid substring false positives (e.g. "AXA" matching
  // "TAX ADVISOR"). Security audit 2026-04-12.
  const insurerLower = insurer.name.toLowerCase();
  const filtered = providers.filter(p =>
    p.insurance && p.insurance.some((ins: string) => {
      const insLower = ins.toLowerCase();
      return insLower === insurerLower || insLower.startsWith(insurerLower + " ") || insLower.endsWith(" " + insurerLower);
    })
  );

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
            {filtered.length > 0
              ? `We found ${filtered.length} pharmacies in ${city.name} that accept ${insurer.name} insurance. ${city.name} has ${total} total registered pharmacies.`
              : `${city.name} has ${total} registered pharmacies. Contact pharmacies directly to confirm ${insurer.name} insurance acceptance — our insurance data may not cover all providers.`}
            {" "}Always bring your insurance card and verify coverage before purchasing medications.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/directory/${city.slug}/pharmacy`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">All Pharmacies</Link>
        <Link href={`/directory/${city.slug}/pharmacy/delivery`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">Delivery</Link>
        <Link href={`/directory/${city.slug}/insurance`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">All {insurer.name} Providers</Link>
      </div>

      {/* Pharmacy grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            {filtered.length > 0 ? `${filtered.length} Pharmacies with ${insurer.name}` : `Top Pharmacies in ${city.name}`}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(filtered.length > 0 ? filtered : providers).map((p) => (
            <ProviderCard
              key={p.id}
              name={p.name}
              slug={p.slug}
              citySlug={p.citySlug}
              categorySlug={p.categorySlug}
              address={p.address}
              phone={p.phone}
              website={p.website}
              shortDescription={p.shortDescription}
              googleRating={p.googleRating}
              googleReviewCount={p.googleReviewCount}
              isClaimed={p.isClaimed}
              isVerified={p.isVerified}
              insurance={p.insurance}
              operatingHours={p.operatingHours}
            />
          ))}
        </div>
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
