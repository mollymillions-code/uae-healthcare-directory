import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { Truck, ArrowRight } from "lucide-react";

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
  const { total } = await getProviders({ citySlug: city.slug, categorySlug: "pharmacy", limit: 1 });
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
  const { providers, total } = await getProviders({ citySlug: city.slug, categorySlug: "pharmacy", sort: "rating", limit: 20 });

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Pharmacy", url: `${base}/directory/${city.slug}/pharmacy` },
        { name: "Delivery" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Pharmacy", href: `/directory/${city.slug}/pharmacy` },
        { label: "Delivery" },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="h-8 w-8 text-[#006828]" />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
            Pharmacy Delivery in {city.name}
          </h1>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {city.name} has {total} registered pharmacies. Many UAE pharmacies offer home delivery — however,
            we do not currently have structured delivery capability data per pharmacy. Contact individual pharmacies
            below to ask about their delivery options, coverage area, and hours.
            Prescription medications require a valid UAE prescription for delivery.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/directory/${city.slug}/pharmacy`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">All Pharmacies</Link>
        <Link href={`/directory/${city.slug}/24-hour/pharmacy`} className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">24-Hour</Link>
        <Link href="/pharmacy/how-delivery-works" className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">How Delivery Works</Link>
        <Link href="/medications" className="inline-flex items-center gap-1 bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 font-['Geist',sans-serif]">Medication Directory</Link>
      </div>

      {/* Pharmacy grid */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Pharmacies in {city.name} — Ask About Delivery
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
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
              coverImageUrl={p.coverImageUrl}
              operatingHours={p.operatingHours}
            />
          ))}
        </div>
      </section>

      {/* Cross-links */}
      <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6 mb-8">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-2">
          Need a Specific Medication?
        </h2>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-3">
          Search our medication directory to find which drugs are available in {city.name} pharmacies.
        </p>
        <Link href="/medications"
          className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]">
          Browse Medications <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> Delivery availability is not guaranteed for all pharmacies listed.
          Contact the pharmacy directly to confirm delivery coverage in your area. Prescription medications
          require a valid UAE prescription. Data from official UAE health authority registers.
        </p>
      </div>
    </div>
  );
}
