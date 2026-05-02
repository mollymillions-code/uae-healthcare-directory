import { Metadata } from "next";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCities } from "@/lib/data";
import { getHighIntentMedications, getAllMedicationClasses } from "@/lib/medications";
import { safe } from "@/lib/safeData";
import { HubPageTemplate } from "@/components/directory-v2/templates/HubPageTemplate";
import type { HubItem } from "@/components/directory-v2/templates/HubPageTemplate";
import {
  Building2, Clock, Truck, FileText, Pill, ShieldCheck,
  ArrowLeftRight,
} from "lucide-react";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: "UAE Pharmacy Guide — Find Pharmacies, Medications & Prescription Help",
    description: "Complete UAE pharmacy guide. Find 24-hour pharmacies, delivery options, prescription refill help, generic-vs-brand guidance, and medication availability across all 8 emirates.",
    alternates: { canonical: `${base}/pharmacy` },
  };
}

const pharmacyFaqs = [
  {
    question: "Do UAE pharmacies deliver medications to my home?",
    answer:
      "Yes. Most major UAE pharmacy chains — Aster, Life Pharmacy, Boots UAE, and United Pharmacy — offer same-day or next-day home delivery via their own apps or third-party platforms like Talabat and Noon. Over-the-counter items ship immediately; prescription medications require you to upload a valid prescription first. Controlled substances cannot be delivered.",
  },
  {
    question: "Can I refill a prescription without seeing my doctor again?",
    answer:
      "For chronic medications you often can. Dubai and Abu Dhabi run chronic disease management programs that allow 90-day refills at participating pharmacies. Most major insurers also support teleconsultations for prescription renewals. Controlled substances, however, require a new in-person prescription every time.",
  },
  {
    question: "Are generic medications safe to substitute for brand names in the UAE?",
    answer:
      "Generally yes. MOHAP and DHA require every registered generic to prove bioequivalence to the brand — same active ingredient, same strength, same route. Pharmacists are allowed to substitute unless the doctor writes \"brand necessary\" on the prescription. Generics typically cost 30–70% less than the brand.",
  },
  {
    question: "Where can I find a 24-hour pharmacy in the UAE?",
    answer:
      "Most major cities have 24-hour pharmacies in central neighborhoods and near hospitals. Dubai alone has dozens of 24/7 branches from chains like Life Pharmacy and BinSina. Use our directory to filter pharmacies by operating hours, or check a chain's app for its nearest always-open branch.",
  },
];

export default async function PharmacyHubPage() {
  const base = getBaseUrl();
  const cities = getCities().filter((c) => c.country === "ae");

  const [highIntent, classes] = await Promise.all([
    safe(getHighIntentMedications(8), [] as Awaited<ReturnType<typeof getHighIntentMedications>>, "highIntent"),
    safe(getAllMedicationClasses(), [] as Awaited<ReturnType<typeof getAllMedicationClasses>>, "classes"),
  ]);

  const cityItems: HubItem[] = cities.map((city) => ({
    href: `/directory/${city.slug}/pharmacy`,
    label: city.name,
    icon: <Building2 className="h-5 w-5" />,
  }));

  const quickAccessItems: HubItem[] = [
    {
      href: "/directory/dubai/pharmacy",
      label: "All Dubai Pharmacies",
      subLabel: "1,600+ pharmacies across the emirate",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      href: "/directory/dubai/24-hour/pharmacy",
      label: "24-Hour Pharmacies",
      subLabel: "Open around the clock",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      href: "/medications",
      label: "Medication Directory",
      subLabel: "117+ medications with prescribing info",
      icon: <Pill className="h-5 w-5" />,
    },
    {
      href: "/directory/dubai/pharmacy",
      label: "Pharmacy Insurance",
      subLabel: "Filter by accepted insurer",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
  ];

  const guideItems: HubItem[] = [
    {
      href: "/pharmacy/generic-vs-brand",
      label: "Generic vs Brand Medications",
      subLabel: "Understanding the difference and when generics are safe",
      icon: <ArrowLeftRight className="h-5 w-5" />,
    },
    {
      href: "/pharmacy/prescription-refill",
      label: "Prescription Refill Guide",
      subLabel: "How to refill prescriptions at UAE pharmacies",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/pharmacy/how-delivery-works",
      label: "Pharmacy Delivery in the UAE",
      subLabel: "Home delivery options and how to order medications",
      icon: <Truck className="h-5 w-5" />,
    },
  ];

  const highIntentItems: HubItem[] = highIntent.map((med) => ({
    href: `/medications/${med.slug}`,
    label: med.genericName,
    subLabel: med.shortDescription ?? undefined,
  }));

  const classItems: HubItem[] = classes.slice(0, 20).map((cls) => ({
    href: `/medication-classes/${cls.slug}`,
    label: cls.name,
  }));

  const sections = [
    {
      title: "Pharmacies by city",
      eyebrow: "Browse by emirate",
      items: cityItems,
      layout: "grid" as const,
      gridCols: "4" as const,
    },
    {
      title: "Quick access",
      eyebrow: "Jump right in",
      items: quickAccessItems,
      layout: "grid" as const,
      gridCols: "4" as const,
    },
    {
      title: "Pharmacy guides",
      eyebrow: "Learn the system",
      items: guideItems,
      layout: "grid" as const,
      gridCols: "3" as const,
    },
    ...(highIntentItems.length > 0
      ? [{
          title: "Most searched medications",
          eyebrow: "Popular lookups",
          items: highIntentItems,
          layout: "chips" as const,
        }]
      : []),
    ...(classItems.length > 0
      ? [{
          title: "Browse by drug class",
          eyebrow: "Therapeutic categories",
          items: classItems,
          layout: "chips" as const,
        }]
      : []),
  ];

  return (
    <>
      <HubPageTemplate
        breadcrumbs={[
          { label: "UAE", href: "/" },
          { label: "Pharmacy Guide" },
        ]}
        eyebrow="Pharmacy guide"
        title="UAE Pharmacy Guide"
        subtitle="Find pharmacies across all 8 UAE emirates with 24-hour access, home delivery, prescription upload, and chronic refill support."
        aeoAnswer={
          <>
            Find pharmacies across all 8 UAE emirates with 24-hour access, home delivery,
            prescription upload, and chronic refill support. Browse our medication directory
            for generic-vs-brand guidance, prescribing information, and insurance coverage.
            All pharmacy listings are sourced from official UAE health authority registers.
          </>
        }
        schemas={
          <>
            <JsonLd data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Pharmacy Guide" },
            ])} />
            <JsonLd data={speakableSchema([".answer-block"])} />
            <JsonLd data={faqPageSchema(pharmacyFaqs)} />
          </>
        }
        sections={sections}
        faqs={pharmacyFaqs}
      />

      {/* FAQ — consumer renders via FaqSection */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About UAE pharmacies.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={pharmacyFaqs} />
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> This pharmacy guide is for
            informational purposes only. It does not constitute medical or pharmaceutical advice.
            Drug availability and pricing vary across pharmacies. Always verify medication
            availability directly with your pharmacy.
          </p>
        </div>
      </section>

    </>
  );
}
