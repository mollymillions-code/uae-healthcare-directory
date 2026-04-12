import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getBrandBySlug,
  getMedicationBySlug,
  getBrandsByGeneric,
  getAllBrandSlugs,
} from "@/lib/medications";
import { gateBrandPage } from "@/lib/medication-gating";
import { Pill, Building2, ArrowRight, ShieldCheck, FileText } from "lucide-react";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllBrandSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) return {};

  const base = getBaseUrl();
  const gate = gateBrandPage(brand, base);

  return {
    title: `${brand.brandName} — ${brand.manufacturer || "Brand"} | UAE Medication Guide`,
    description: brand.shortDescription || `${brand.brandName} brand information, generic equivalent, and UAE pharmacy availability.`,
    ...(!gate.index ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: gate.canonicalOverride || `${base}/brands/${brand.slug}`,
    },
    openGraph: {
      title: `${brand.brandName} — UAE Medication Guide`,
      description: brand.shortDescription || `${brand.brandName} medication brand information.`,
      type: "website",
      url: `${base}/brands/${brand.slug}`,
    },
  };
}

export default async function BrandPage({ params }: Props) {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const base = getBaseUrl();
  const [generic, siblingBrands] = await Promise.all([
    getMedicationBySlug(brand.genericSlug),
    getBrandsByGeneric(brand.genericSlug),
  ]);

  const siblings = siblingBrands.filter(b => b.slug !== brand.slug);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Medications", url: `${base}/medications` },
        ...(generic ? [{ name: generic.genericName, url: `${base}/medications/${generic.slug}` }] : []),
        { name: brand.brandName },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Drug",
        name: brand.brandName,
        description: brand.shortDescription || undefined,
        isProprietary: true,
        nonProprietaryName: generic?.genericName || brand.genericSlug,
        manufacturer: brand.manufacturer ? { "@type": "Organization", name: brand.manufacturer } : undefined,
      }} />

      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: "Medications", href: "/medications" },
        ...(generic ? [{ label: generic.genericName, href: `/medications/${generic.slug}` }] : []),
        { label: brand.brandName },
      ]} />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Pill className="h-8 w-8 text-[#006828]" />
          <div>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">
              {brand.brandName}
            </h1>
            {brand.manufacturer && (
              <p className="font-['Geist',sans-serif] text-sm text-black/50 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {brand.manufacturer}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 bg-[#006828]/[0.08] text-[#006828] text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif]">
            <ShieldCheck className="h-3.5 w-3.5" /> Brand Name
          </span>
          {generic && (
            <Link href={`/medications/${generic.slug}`} className="inline-flex items-center gap-1 bg-black/[0.04] text-black/60 text-[11px] font-medium px-3 py-1 rounded-full font-['Geist',sans-serif] hover:text-[#006828] transition-colors">
              Generic: {generic.genericName}
            </Link>
          )}
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {brand.shortDescription || `${brand.brandName} is a brand-name medication available in UAE pharmacies.`}
            {generic && ` The generic equivalent is ${generic.genericName}.`}
            {brand.manufacturer && ` Manufactured by ${brand.manufacturer}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Generic Equivalent */}
          {generic && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Generic Equivalent
                </h2>
              </div>
              <Link
                href={`/medications/${generic.slug}`}
                className="group flex items-center justify-between p-4 rounded-xl border border-[#006828]/10 bg-[#006828]/[0.02] hover:bg-[#006828]/[0.06] transition-all"
              >
                <div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] group-hover:text-[#006828] transition-colors">
                    {generic.genericName}
                  </p>
                  {generic.shortDescription && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/50 mt-1 line-clamp-2">{generic.shortDescription}</p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-[#006828] flex-shrink-0" />
              </Link>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-3">
                Ask your pharmacist about generic alternatives — they contain the same active ingredient at a lower cost.
              </p>
            </section>
          )}

          {/* Common Uses from Generic */}
          {generic && generic.commonConditions.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Common Uses
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {generic.commonConditions.map((condition) => (
                  <span key={condition} className="inline-block bg-[#f8f8f6] border border-black/[0.06] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg font-['Geist',sans-serif]">
                    {condition.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Other Brands of Same Generic */}
          {siblings.length > 0 && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="mb-4 border-b-2 border-[#1c1c1c] pb-3">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c] tracking-tight">
                  Other Brands of {generic?.genericName || "This Medication"}
                </h2>
              </div>
              <div className="space-y-2">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/brands/${s.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-black/[0.04] hover:border-[#006828]/15 hover:bg-[#f8f8f6] transition-all font-['Geist',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828]"
                  >
                    <span>{s.brandName} {s.manufacturer ? `(${s.manufacturer})` : ""}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-black/20 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-4">
              Quick Facts
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Brand Name</dt>
                <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{brand.brandName}</dd>
              </div>
              {generic && (
                <div>
                  <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Generic Name</dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{generic.genericName}</dd>
                </div>
              )}
              {brand.manufacturer && (
                <div>
                  <dt className="font-['Geist',sans-serif] text-[11px] uppercase tracking-wider text-black/40">Manufacturer</dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-[#1c1c1c] mt-0.5">{brand.manufacturer}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-[#006828]/20 bg-[#006828]/[0.04] p-6">
            <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-2">
              Find {brand.brandName}
            </h3>
            <p className="font-['Geist',sans-serif] text-xs text-black/50 mb-3">
              Ask your local pharmacy about {brand.brandName} availability.
            </p>
            <Link
              href="/directory/dubai/pharmacy"
              className="inline-flex items-center gap-2 bg-[#006828] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#005520] transition-colors font-['Geist',sans-serif]"
            >
              <Building2 className="h-4 w-4" /> Browse Pharmacies
            </Link>
          </section>
        </div>
      </div>

      <div className="mt-8 bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> This page provides general information about {brand.brandName}. It is not medical advice.
          Consult a licensed healthcare provider for prescribing guidance.{" "}
          <FileText className="inline h-3 w-3" /> Data from publicly available pharmaceutical references.
        </p>
      </div>
    </div>
  );
}
