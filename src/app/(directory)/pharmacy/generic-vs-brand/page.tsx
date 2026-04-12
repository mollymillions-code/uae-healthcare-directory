import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { Pill, ArrowRight } from "lucide-react";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: "Generic vs Brand Medications in the UAE — What You Need to Know",
    description:
      "Understand the difference between generic and brand-name medications in the UAE. Learn how MOH regulates generics, when brand matters, and how to talk to your pharmacist.",
    alternates: { canonical: `${base}/pharmacy/generic-vs-brand` },
    openGraph: {
      title: "Generic vs Brand Medications in the UAE — What You Need to Know",
      description:
        "How UAE generics work, why they cost less, and when your pharmacist may recommend staying on a brand-name drug.",
      url: `${base}/pharmacy/generic-vs-brand`,
      type: "article",
      locale: "en_AE",
      siteName: "Zavis",
    },
  };
}

export default function GenericVsBrandPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Generic vs Brand Medications" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Pharmacy Guide", href: "/pharmacy" },
          { label: "Generic vs Brand Medications" },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="h-5 w-5 text-[#006828]" />
          <span className="font-['Geist',sans-serif] text-xs text-black/40 uppercase tracking-wider">
            Pharmacy Guide
          </span>
        </div>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          Generic vs Brand Medications in the UAE
        </h1>

        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 answer-block"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            Generic medications contain the same active ingredient, in the same dose and form,
            as their brand-name counterparts. In the UAE, the Ministry of Health and Prevention (MOHAP)
            requires generics to meet bioequivalence standards before they can be sold. Generics typically
            cost 30–70% less than brand-name drugs. Pharmacists in the UAE are permitted — and often
            encouraged — to substitute generics unless a prescribing physician has marked a prescription
            &quot;brand necessary.&quot;
          </p>
        </div>
      </div>

      {/* Section 1 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            What Is a Generic Medication?
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            A generic drug is a copy of a brand-name medicine that has the same active ingredient,
            strength, dosage form (tablet, capsule, liquid, etc.), and route of administration. The
            key difference is cost — generics are manufactured after the original drug&apos;s patent
            expires, which removes the research and marketing costs that inflate brand prices.
          </p>
          <p>
            In the UAE, generics must be registered with MOHAP or the Dubai Health Authority (DHA)
            before they can be sold. Registration requires proof of bioequivalence, meaning the generic
            reaches the bloodstream at essentially the same rate and to the same extent as the original
            brand. The two are considered therapeutically interchangeable for most patients.
          </p>
          <p>
            Inactive ingredients (fillers, coatings, dyes) can differ between a generic and the brand.
            This rarely causes problems, but patients with specific allergies to excipients should check
            the full ingredient list with their pharmacist.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Why Generics Cost Less in the UAE
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Brand-name drugs are priced to recover the manufacturer&apos;s investment in clinical trials,
            regulatory filings, and global marketing — often a decade-long process costing hundreds of
            millions of dollars. Once the patent expires (typically 20 years from filing), other
            manufacturers can produce the same molecule without repeating those costs.
          </p>
          <p>
            MOHAP maintains a price control framework for registered medicines. Generics are generally
            priced below their reference brand, and pharmacies are not permitted to sell medicines
            above the registered ceiling price. This means a patient in Dubai or Abu Dhabi can
            typically save 30–70% by choosing the generic version of a common medication such as
            atorvastatin (vs. Lipitor), metformin (vs. Glucophage), or omeprazole (vs. Losec).
          </p>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              <strong>Tip:</strong> If your insurance copay is calculated as a percentage of drug cost,
              using generics reduces both the insurer&apos;s share and your out-of-pocket amount.
              Always ask your pharmacist if a generic is available before filling a brand prescription.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            UAE MOH Regulations on Generic Substitution
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Under MOHAP rules, pharmacists across the UAE may substitute a prescribed brand-name
            medication with an approved generic equivalent — provided the prescribing doctor has not
            written &quot;brand necessary&quot; (sometimes abbreviated as &quot;BN&quot; or marked on
            the electronic prescription) on the prescription. DHA and DOH (Abu Dhabi) follow similar
            generic substitution policies within their respective emirates.
          </p>
          <p>
            For medications on the UAE Essential Medicines List, generic availability is generally
            mandated. Government health facilities — including DHA hospitals and SEHA facilities in
            Abu Dhabi — primarily dispense generics from their formularies, reserving brands for cases
            where clinical need is documented.
          </p>
          <p>
            Private pharmacies operate under the same registration rules but have more discretion in
            stocking. Major chains (Aster, Life Pharmacy, Boots UAE, United Pharmacy) typically carry
            both generic and brand options for common therapeutic categories.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            When Brand-Name Medications May Matter
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            For the vast majority of common medications — antibiotics, statins, antihypertensives,
            antidiabetics, and analgesics — the generic performs identically to the brand. However,
            there are situations where your doctor or pharmacist may recommend staying on the brand:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
            <li>
              <strong>Narrow therapeutic index (NTI) drugs</strong> — medicines like warfarin,
              levothyroxine, cyclosporine, or lithium where small differences in blood levels can
              matter clinically. Many physicians prefer brand consistency for these.
            </li>
            <li>
              <strong>Extended-release formulations</strong> — the drug release mechanism can differ
              between a brand and its generic. If you switch, your doctor may want to recheck levels.
            </li>
            <li>
              <strong>Excipient allergies</strong> — if you react to a dye, lactose, or another filler
              in one formulation, your pharmacist can help identify a version without that ingredient.
            </li>
            <li>
              <strong>Psychiatric and neurological medications</strong> — some patients and clinicians
              prefer brand consistency, even though bioequivalence standards apply. Discuss this with
              your treating specialist.
            </li>
          </ul>
          <p>
            If you have been stable on a brand-name drug for years, there is no automatic need to
            switch. But if cost is a concern, ask your doctor or pharmacist whether the generic is
            appropriate for your situation.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How to Ask Your Pharmacist About Generics
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            UAE pharmacists are trained healthcare professionals who can advise on generic substitution.
            When picking up a prescription, simply ask: &quot;Is there a generic available for this?
            Is it appropriate for me?&quot; They can check availability, explain the cost difference,
            and flag any known differences in formulation.
          </p>
          <p>
            If you are on a chronic medication and want to switch to a generic to reduce monthly costs,
            ask your pharmacist to note it in your medication record. For NTI drugs, they may advise
            you to inform your doctor so any follow-up monitoring can be arranged.
          </p>
          <p>
            You can also look up medications in our{" "}
            <Link
              href="/medications"
              className="text-[#006828] hover:underline font-medium"
            >
              UAE Medication Directory
            </Link>{" "}
            to find generic names, brand equivalents, and prescribing information before you visit
            the pharmacy.
          </p>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Related Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/medications",
              title: "UAE Medication Directory",
              desc: "Search generic names, brand equivalents, and prescribing information",
            },
            {
              href: "/pharmacy/prescription-refill",
              title: "Prescription Refill Guide",
              desc: "How to refill prescriptions at UAE pharmacies",
            },
            {
              href: "/pharmacy/how-delivery-works",
              title: "Pharmacy Delivery in the UAE",
              desc: "Order medications online with home delivery",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white border border-black/[0.06] rounded-xl p-5 hover:border-[#006828]/15 hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] group-hover:text-[#006828] transition-colors tracking-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-black/20 group-hover:text-[#006828] transition-colors flex-shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-6">
        <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
          <strong>Medical Disclaimer.</strong> This guide is for informational purposes only and does
          not constitute medical or pharmaceutical advice. Generic substitution decisions should be made
          in consultation with your prescribing physician and pharmacist. Drug availability, pricing,
          and regulatory requirements may vary across UAE emirates. Always verify medication information
          with a licensed healthcare professional. Last updated April 2026.
        </p>
      </div>
    </div>
  );
}
