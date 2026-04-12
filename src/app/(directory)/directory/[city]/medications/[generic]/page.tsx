import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCityBySlug, getCities, getProviders } from "@/lib/data";
import { getMedicationWithBrands, getHighIntentMedications } from "@/lib/medications";
import { gateMedicationPage } from "@/lib/medication-gating";
import { Pill, Building2, ArrowRight, MapPin } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props { params: { city: string; generic: string } }

// Only pre-generate for high-intent medications × UAE cities
export async function generateStaticParams() {
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
  const data = await getMedicationWithBrands(params.generic);
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
  const data = await getMedicationWithBrands(params.generic);
  if (!city || !data) notFound();

  const { medication: med, brands } = data;
  const base = getBaseUrl();

  // Get pharmacy count for this city
  const { total: pharmacyCount } = await getProviders({ citySlug: city.slug, categorySlug: "pharmacy", limit: 1 });

  const brandNames = brands.map(b => b.brandName).join(", ");

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: city.name, url: `${base}/directory/${city.slug}` },
        { name: "Medications", url: `${base}/medications` },
        { name: med.genericName },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Medications", href: "/medications" },
        { label: med.genericName },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="h-8 w-8 text-[#006828]" />
          <div>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
              {med.genericName} in {city.name}
            </h1>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {city.name}, UAE · {pharmacyCount} pharmacies
            </p>
          </div>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {med.genericName}{brandNames ? ` (sold as ${brandNames})` : ""} is a medication that may be stocked at pharmacies in {city.name}.
            {" "}{city.name} has {pharmacyCount} registered pharmacies — contact them to confirm availability.
            {med.isPrescriptionRequired
              ? " This medication requires a prescription from a licensed UAE physician."
              : " This medication is available over the counter without a prescription."}
            {med.shortDescription ? ` ${med.shortDescription}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Brand availability */}
          {brands.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-3">
                Brand Names (UAE-wide)
              </h2>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <Link key={brand.slug} href={`/brands/${brand.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/15 hover:bg-[#f8f8f6] transition-all">
                    <div>
                      <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c]">{brand.brandName}</span>
                      {brand.manufacturer && <span className="font-['Geist',sans-serif] text-xs text-black/40 ml-2">by {brand.manufacturer}</span>}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-black/20 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Common uses */}
          {med.commonConditions.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight mb-4 border-b-2 border-[#1c1c1c] pb-3">
                Common Uses
              </h2>
              <div className="flex flex-wrap gap-2">
                {med.commonConditions.map((c) => (
                  <Link key={c} href={`/conditions/${c}/medications`}
                    className="inline-block bg-[#f8f8f6] border border-black/[0.06] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 hover:text-[#006828] transition-all font-['Geist',sans-serif]">
                    {c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Full medication info link */}
          <Link href={`/medications/${med.slug}`}
            className="group flex items-center justify-between p-4 rounded-xl border-2 border-[#006828]/20 bg-[#006828]/[0.02] hover:bg-[#006828]/[0.06] transition-all">
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                Full {med.genericName} Medication Guide
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/50 mt-0.5">Lab monitoring, alternatives, prescribing specialties</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#006828]" />
          </Link>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-2">
              Find a Pharmacy in {city.name}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 mb-3">
              Browse {pharmacyCount} pharmacies in {city.name} that may stock {med.genericName}.
            </p>
            <Link href={`/directory/${city.slug}/pharmacy`}
              className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]">
              <Building2 className="h-4 w-4" /> Browse {city.name} Pharmacies
            </Link>
          </section>

          <section className="rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-3">Quick Facts</h3>
            <dl className="space-y-3">
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Medication</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{med.genericName}</dd>
              </div>
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">City</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{city.name}</dd>
              </div>
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Status</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">
                  {med.rxStatus === "otc" ? "Over-the-Counter" : med.rxStatus === "controlled" ? "Controlled" : "Prescription Required"}
                </dd>
              </div>
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Pharmacies in {city.name}</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{pharmacyCount}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="mt-8 bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> Drug availability at specific pharmacies in {city.name} is not guaranteed.
          Always call ahead to confirm stock. This page is for informational purposes only — consult a licensed physician before taking any medication.
        </p>
      </div>
    </div>
  );
}
