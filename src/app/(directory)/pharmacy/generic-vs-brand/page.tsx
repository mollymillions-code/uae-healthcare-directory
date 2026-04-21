import { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ChevronRight, Pill, ArrowRight, Sparkles } from "lucide-react";

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

const genericFaqs = [
  {
    question: "Are generic medications as effective as brand-name drugs in the UAE?",
    answer:
      "Yes. MOHAP and DHA require every registered generic to demonstrate bioequivalence — meaning it delivers the same active ingredient, at the same strength, at essentially the same rate as the brand. The two are therapeutically interchangeable for the vast majority of patients.",
  },
  {
    question: "Can UAE pharmacists substitute a generic for my brand-name prescription?",
    answer:
      "In most cases, yes. Under MOHAP and DHA rules, a pharmacist can dispense an approved generic equivalent unless your doctor has written \"brand necessary\" on the prescription. Ask the pharmacist directly — they will confirm availability and explain the cost difference.",
  },
  {
    question: "When would a doctor insist on a brand-name medication?",
    answer:
      "For narrow therapeutic index drugs like warfarin, levothyroxine, or lithium, small blood-level differences can matter clinically. Some extended-release formulations, psychiatric medications, and patients with excipient allergies also warrant brand consistency. Your doctor will note this if it applies.",
  },
  {
    question: "How much can I save by choosing the generic?",
    answer:
      "Generics are typically priced 30–70% below the reference brand. MOHAP enforces a ceiling price on every registered medicine, and if your insurance calculates copay as a percentage of drug cost, switching to generics lowers both the insurer's share and your out-of-pocket amount.",
  },
];

export default function GenericVsBrandPage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Generic vs Brand Medications" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(genericFaqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink transition-colors">UAE</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/pharmacy" className="hover:text-ink transition-colors">Pharmacy Guide</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Generic vs Brand Medications</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Pharmacy guide
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Generic vs Brand Medications in the UAE
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
            How UAE generics work, why they cost less, and when your pharmacist may recommend
            staying on a brand-name drug.
          </p>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Generic medications contain the same active ingredient, in the same dose and form,
              as their brand-name counterparts. In the UAE, the Ministry of Health and Prevention (MOHAP)
              requires generics to meet bioequivalence standards before they can be sold. Generics typically
              cost 30&ndash;70% less than brand-name drugs. Pharmacists in the UAE are permitted &mdash; and often
              encouraged &mdash; to substitute generics unless a prescribing physician has marked a prescription
              &ldquo;brand necessary.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Body — prose */}
      <article className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-[720px] font-sans text-z-body text-ink leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-4 mb-4">
              What is a generic medication?
            </h2>
            <div className="space-y-5">
              <p>
                A generic drug is a copy of a brand-name medicine that has the same active ingredient,
                strength, dosage form (tablet, capsule, liquid, etc.), and route of administration. The
                key difference is cost &mdash; generics are manufactured after the original drug&apos;s patent
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

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              Why generics cost less in the UAE
            </h2>
            <div className="space-y-5">
              <p>
                Brand-name drugs are priced to recover the manufacturer&apos;s investment in clinical trials,
                regulatory filings, and global marketing &mdash; often a decade-long process costing hundreds of
                millions of dollars. Once the patent expires (typically 20 years from filing), other
                manufacturers can produce the same molecule without repeating those costs.
              </p>
              <p>
                MOHAP maintains a price control framework for registered medicines. Generics are generally
                priced below their reference brand, and pharmacies are not permitted to sell medicines
                above the registered ceiling price. This means a patient in Dubai or Abu Dhabi can
                typically save 30&ndash;70% by choosing the generic version of a common medication such as
                atorvastatin (vs. Lipitor), metformin (vs. Glucophage), or omeprazole (vs. Losec).
              </p>
              <div className="rounded-z-md bg-surface-cream border border-ink-hairline p-4">
                <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
                  <strong className="text-ink-soft">Tip.</strong> If your insurance copay is calculated as a
                  percentage of drug cost, using generics reduces both the insurer&apos;s share and your
                  out-of-pocket amount. Always ask your pharmacist if a generic is available before
                  filling a brand prescription.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              UAE MOH regulations on generic substitution
            </h2>
            <div className="space-y-5">
              <p>
                Under MOHAP rules, pharmacists across the UAE may substitute a prescribed brand-name
                medication with an approved generic equivalent &mdash; provided the prescribing doctor has not
                written &ldquo;brand necessary&rdquo; (sometimes abbreviated as &ldquo;BN&rdquo; or marked on
                the electronic prescription) on the prescription. DHA and DOH (Abu Dhabi) follow similar
                generic substitution policies within their respective emirates.
              </p>
              <p>
                For medications on the UAE Essential Medicines List, generic availability is generally
                mandated. Government health facilities &mdash; including DHA hospitals and SEHA facilities in
                Abu Dhabi &mdash; primarily dispense generics from their formularies, reserving brands for cases
                where clinical need is documented.
              </p>
              <p>
                Private pharmacies operate under the same registration rules but have more discretion in
                stocking. Major chains (Aster, Life Pharmacy, Boots UAE, United Pharmacy) typically carry
                both generic and brand options for common therapeutic categories.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              When brand-name medications may matter
            </h2>
            <div className="space-y-5">
              <p>
                For the vast majority of common medications &mdash; antibiotics, statins, antihypertensives,
                antidiabetics, and analgesics &mdash; the generic performs identically to the brand. However,
                there are situations where your doctor or pharmacist may recommend staying on the brand:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="font-semibold">Narrow therapeutic index (NTI) drugs</strong> &mdash; medicines like warfarin,
                  levothyroxine, cyclosporine, or lithium where small differences in blood levels can
                  matter clinically. Many physicians prefer brand consistency for these.
                </li>
                <li>
                  <strong className="font-semibold">Extended-release formulations</strong> &mdash; the drug release mechanism can differ
                  between a brand and its generic. If you switch, your doctor may want to recheck levels.
                </li>
                <li>
                  <strong className="font-semibold">Excipient allergies</strong> &mdash; if you react to a dye, lactose, or another filler
                  in one formulation, your pharmacist can help identify a version without that ingredient.
                </li>
                <li>
                  <strong className="font-semibold">Psychiatric and neurological medications</strong> &mdash; some patients and clinicians
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

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              How to ask your pharmacist about generics
            </h2>
            <div className="space-y-5">
              <p>
                UAE pharmacists are trained healthcare professionals who can advise on generic substitution.
                When picking up a prescription, simply ask: &ldquo;Is there a generic available for this?
                Is it appropriate for me?&rdquo; They can check availability, explain the cost difference,
                and flag any known differences in formulation.
              </p>
              <p>
                If you are on a chronic medication and want to switch to a generic to reduce monthly costs,
                ask your pharmacist to note it in your medication record. For NTI drugs, they may advise
                you to inform your doctor so any follow-up monitoring can be arranged.
              </p>
              <p>
                You can also look up medications in our{" "}
                <Link href="/medications" className="text-accent-dark hover:underline font-medium">
                  UAE Medication Directory
                </Link>{" "}
                to find generic names, brand equivalents, and prescribing information before you visit
                the pharmacy.
              </p>
            </div>
          </section>
        </div>
      </article>

      {/* Related links */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Related resources
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Keep reading.
          </h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="group flex items-start gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
            >
              <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                <Pill className="h-5 w-5 text-accent-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                  {item.title}
                </p>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  {item.desc}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Generic vs brand, common asks.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={genericFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This guide is for informational
            purposes only and does not constitute medical or pharmaceutical advice. Generic substitution
            decisions should be made in consultation with your prescribing physician and pharmacist. Drug
            availability, pricing, and regulatory requirements may vary across UAE emirates. Always verify
            medication information with a licensed healthcare professional. Last updated April 2026.
          </p>
        </div>
      </section>
    </>
  );
}
