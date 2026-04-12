import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCities } from "@/lib/data";
import { getHighIntentMedications, getAllMedicationClasses } from "@/lib/medications";
import { Building2, Clock, Truck, FileText, ArrowRight, Pill, ShieldCheck } from "lucide-react";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: "UAE Pharmacy Guide — Find Pharmacies, Medications & Prescription Help",
    description: "Complete UAE pharmacy guide. Find 24-hour pharmacies, delivery options, prescription refill help, generic-vs-brand guidance, and medication availability across all 8 emirates.",
    alternates: { canonical: `${base}/pharmacy` },
  };
}

export default async function PharmacyHubPage() {
  const base = getBaseUrl();
  const cities = getCities().filter(c => c.country === "ae");
  const [highIntent, classes] = await Promise.all([
    getHighIntentMedications(8),
    getAllMedicationClasses(),
  ]);

  const guides = [
    { href: "/pharmacy/generic-vs-brand", title: "Generic vs Brand Medications", desc: "Understanding the difference and when generics are safe", icon: ArrowRight },
    { href: "/pharmacy/prescription-refill", title: "Prescription Refill Guide", desc: "How to refill prescriptions at UAE pharmacies", icon: FileText },
    { href: "/pharmacy/how-delivery-works", title: "Pharmacy Delivery in the UAE", desc: "Home delivery options and how to order medications", icon: Truck },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Pharmacy Guide" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: "Pharmacy Guide" }]} />

      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          UAE Pharmacy Guide
        </h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            Find pharmacies across all 8 UAE emirates with 24-hour access, home delivery, prescription upload, and chronic refill support.
            Browse our medication directory for generic-vs-brand guidance, prescribing information, and insurance coverage.
            All pharmacy listings are sourced from official UAE health authority registers.
          </p>
        </div>
      </div>

      {/* City Pharmacy Links */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Pharmacies by City
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cities.map((city) => (
            <Link key={city.slug} href={`/directory/${city.slug}/pharmacy`}
              className="group flex flex-col items-center bg-white border border-black/[0.06] rounded-xl p-4 hover:border-[#006828]/15 hover:shadow-card transition-all text-center">
              <Building2 className="h-6 w-6 text-[#006828] mb-2" />
              <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors">{city.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Access */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/directory/dubai/pharmacy", label: "All Dubai Pharmacies", icon: Building2, sub: "1,600+ pharmacies" },
            { href: "/directory/dubai/24-hour/pharmacy", label: "24-Hour Pharmacies", icon: Clock, sub: "Open around the clock" },
            { href: "/medications", label: "Medication Directory", icon: Pill, sub: "117+ medications" },
            { href: "/directory/dubai/pharmacy", label: "Pharmacy Insurance", icon: ShieldCheck, sub: "Filter by insurer" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 hover:border-[#006828]/15 hover:shadow-card transition-all">
              <item.icon className="h-5 w-5 text-[#006828] flex-shrink-0" />
              <div>
                <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] block tracking-tight">{item.label}</span>
                <span className="font-['Geist',sans-serif] text-xs text-black/40">{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Guides */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Pharmacy Guides
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {guides.map((guide) => (
            <Link key={guide.href} href={guide.href}
              className="group bg-white border border-black/[0.06] rounded-xl p-5 hover:border-[#006828]/15 hover:shadow-card transition-all">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight mb-1">{guide.title}</h3>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{guide.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Most Searched Medications */}
      {highIntent.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
              Most Searched Medications
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {highIntent.map((med) => (
              <Link key={med.slug} href={`/medications/${med.slug}`}
                className="inline-block bg-[#f8f8f6] border border-black/[0.06] text-[#1c1c1c] text-sm px-3 py-1.5 rounded-lg hover:border-[#006828]/15 hover:text-[#006828] transition-all font-['Geist',sans-serif]">
                {med.genericName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse Drug Classes */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Browse by Drug Class
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.slice(0, 20).map((cls) => (
            <Link key={cls.slug} href={`/medication-classes/${cls.slug}`}
              className="inline-block bg-white border border-black/[0.06] text-[#1c1c1c] text-xs px-3 py-1.5 rounded-lg hover:border-[#006828]/15 hover:text-[#006828] transition-all font-['Geist',sans-serif]">
              {cls.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Disclaimer.</strong> This pharmacy guide is for informational purposes only. It does not constitute medical or pharmaceutical advice.
          Drug availability and pricing vary across pharmacies. Always verify medication availability directly with your pharmacy.
        </p>
      </div>
    </div>
  );
}
