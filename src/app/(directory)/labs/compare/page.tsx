import { Metadata } from "next";
import { Scale, CheckCircle, AlertCircle, TrendingDown, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCompareInteractive } from "@/components/labs/LabCompareInteractive";
import { LAB_PROFILES } from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const labCount = LAB_PROFILES.length;

  return {
    title: `Compare UAE Labs Side-by-Side — Test Prices Across ${labCount} Laboratories | UAE Lab Tests`,
    description:
      `Compare diagnostic lab prices across ${labCount} UAE laboratories side-by-side. ` +
      `Find the cheapest lab for CBC, Vitamin D, HbA1c, Lipid Profile, Thyroid Panel, and 30+ more tests. ` +
      `Filter by accreditation (CAP, JCI), home collection availability, and city.`,
    alternates: { canonical: `${base}/labs/compare` },
    openGraph: {
      title: `Compare ${labCount} UAE Labs Side-by-Side — Find the Cheapest Lab`,
      description:
        `Side-by-side price comparison of ${labCount} UAE diagnostic laboratories. ` +
        `See which lab offers the best price for each test and save up to 60%.`,
      url: `${base}/labs/compare`,
      type: "website",
    },
  };
}

const faqs = [
  {
    question: "How do I compare lab prices in the UAE?",
    answer:
      "Select 2 to 4 laboratories using the checkboxes in the comparison tool above. The table will automatically show prices for every test that all selected labs offer, with the cheapest price highlighted in green. You can compare up to 4 labs simultaneously across 30+ routine tests.",
  },
  {
    question: "What should I look for when choosing a lab in the UAE?",
    answer:
      "Beyond price, consider four factors: (1) Accreditation — CAP (College of American Pathologists) and JCI-accredited labs follow internationally standardised protocols, reducing error rates. (2) Turnaround time — urgent results may be needed same-day. (3) Home collection — several UAE labs including Thumbay Labs, PureLab, and DarDoc offer free or low-cost home phlebotomy, saving time. (4) Regulator — labs in Dubai are licensed by the DHA, Abu Dhabi labs by the DOH, and other emirates by MOHAP.",
  },
  {
    question: "Is the cheapest lab always the best choice?",
    answer:
      "Not necessarily. Price differences in the UAE often reflect accreditation overhead, equipment quality, and reporting standards rather than test accuracy alone. For routine monitoring (e.g., HbA1c, cholesterol), an ISO 15189-accredited budget lab is generally sufficient. For complex panels, cancer markers, or reference testing, a CAP/JCI-accredited lab such as Al Borg Diagnostics or NRL is worth the premium. Always ensure any lab you use is licensed by the relevant UAE health authority (DHA, DOH, or MOHAP).",
  },
  {
    question: "Do lab prices vary by branch location in the UAE?",
    answer:
      "Yes. UAE diagnostic labs commonly charge different rates across branches, particularly between Dubai and Abu Dhabi locations, or between mall-based versus hospital-affiliated branches. The prices shown in this comparison tool are typical indicative rates — always call the specific branch you plan to visit to confirm current pricing before your appointment.",
  },
  {
    question: "Does UAE health insurance cover lab tests at all labs?",
    answer:
      "Insurance coverage depends on your plan and the lab's network status. Dubai's mandatory basic health insurance (DHA Essential Benefits Plan) covers a defined list of diagnostic tests at in-network labs. Thiqa (Abu Dhabi nationals) and Daman (expats) maintain their own network lists. Hospital-affiliated labs — such as those within Aster, Mediclinic, or Cleveland Clinic Abu Dhabi — are more commonly in-network. Home-service labs like DarDoc may or may not be covered; check directly with your insurer before booking.",
  },
];

export default function LabComparePage() {
  const base = getBaseUrl();
  const labCount = LAB_PROFILES.length;

  return (
    <div className="container-tc py-8">
      {/* Schema.org */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Test Comparison", url: `${base}/labs` },
          { name: "Compare Labs", url: `${base}/labs/compare` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "UAE Lab Price Comparison Tool",
          url: `${base}/labs/compare`,
          description: `Interactive tool to compare diagnostic lab test prices across ${labCount} UAE laboratories side-by-side.`,
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AED",
          },
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Comparison", href: "/labs" },
          { label: "Compare Labs" },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Scale className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            Compare UAE Labs Side-by-Side
          </h1>
        </div>

        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-4">
            The UAE has {labCount} major diagnostic laboratory networks with hundreds of branches
            across Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, and Ras Al Khaimah. For the same
            blood test, prices can vary by <strong>40–60%</strong> between labs — making comparison
            essential before you book. Use the tool below to select 2–4 labs and see a complete
            side-by-side price breakdown for every test they have in common.
          </p>
        </div>
      </div>

      {/* Why Compare Section */}
      <div className="mb-8">
        <div className="section-header">
          <h2>Why Lab Price Comparison Matters in the UAE</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-light-50 border border-light-200 p-4">
            <TrendingDown className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">Up to 60% Price Variance</p>
            <p className="text-[11px] text-muted leading-relaxed">
              The same CBC test can cost AED 30 at one lab and AED 85 at another. Comparing
              saves real money, especially for routine annual screens.
            </p>
          </div>
          <div className="bg-light-50 border border-light-200 p-4">
            <CheckCircle className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">Accreditation Differences</p>
            <p className="text-[11px] text-muted leading-relaxed">
              CAP-accredited labs follow international quality standards with mandated proficiency
              testing. Useful to know for complex panels or specialist referrals.
            </p>
          </div>
          <div className="bg-light-50 border border-light-200 p-4">
            <MapPin className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">Home Collection</p>
            <p className="text-[11px] text-muted leading-relaxed">
              Multiple UAE labs offer home phlebotomy — some free of charge. Ideal for fasting
              tests where early-morning sample collection avoids the commute.
            </p>
          </div>
          <div className="bg-light-50 border border-light-200 p-4">
            <AlertCircle className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs font-bold text-dark mb-1">Insurance Network Status</p>
            <p className="text-[11px] text-muted leading-relaxed">
              Not every lab is in-network for every UAE health plan. Hospital-affiliated labs
              tend to have broader insurance coverage than standalone chains.
            </p>
          </div>
        </div>

        <div className="answer-block" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">
            <strong>How this tool works:</strong> Select any 2–4 of the {labCount} labs listed
            below. The comparison table automatically shows side-by-side prices for tests
            available at all selected labs, with the cheapest option highlighted in green.
            Prices are indicative public rates as of March 2026 — confirm with the lab before
            booking.
          </p>
        </div>
      </div>

      {/* Interactive comparison tool — client component */}
      <LabCompareInteractive />

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection
          faqs={faqs}
          title="UAE Lab Comparison — Frequently Asked Questions"
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative and sourced from publicly
          available lab price lists, aggregator platforms, and direct lab communications as of
          March 2026. Prices may vary by branch, insurance status, and current promotions.
          This tool is for informational and price comparison purposes only and does not
          constitute medical advice. Always confirm current pricing and insurance coverage
          directly with the laboratory before booking.
        </p>
      </div>
    </div>
  );
}
