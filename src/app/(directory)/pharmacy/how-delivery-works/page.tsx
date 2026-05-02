import { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ChevronRight, Truck, ArrowRight, Sparkles, Pill } from "lucide-react";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: "Pharmacy Delivery in the UAE — How to Order Medications Online",
    description:
      "How to order medications online and get pharmacy delivery in the UAE. Covers prescription delivery, OTC ordering, insurance coverage, and the main pharmacy delivery platforms.",
    alternates: { canonical: `${base}/pharmacy/how-delivery-works` },
    openGraph: {
      title: "Pharmacy Delivery in the UAE — How to Order Medications Online",
      description:
        "Order prescription and OTC medications online in the UAE — how delivery works, what requires a prescription, and whether your insurance covers delivery.",
      url: `${base}/pharmacy/how-delivery-works`,
      type: "article",
      locale: "en_AE",
      siteName: "Zavis",
    },
  };
}

const deliveryFaqs = [
  {
    question: "Which UAE pharmacies offer home delivery?",
    answer:
      "All major chains — Aster, Life Pharmacy, Boots UAE, United Pharmacy, and BinSina — offer home delivery via their own apps or websites, plus aggregator platforms like Talabat Pharmacy and Noon Pharmacy. Dubai and Abu Dhabi city get the best coverage; Northern Emirates usually offer next-day rather than same-day delivery.",
  },
  {
    question: "Can prescription medications be delivered in the UAE?",
    answer:
      "Yes, with rules. Upload a valid UAE prescription before the pharmacy will dispense a prescription-only drug. International prescriptions are generally not accepted. Controlled substances (opioids, benzodiazepines, ADHD medications) cannot be delivered and must be collected in person.",
  },
  {
    question: "Does UAE health insurance cover pharmacy delivery?",
    answer:
      "Drug cost coverage carries over if the delivering pharmacy is in your insurer's network. The delivery fee itself is almost never covered and typically runs AED 0–25 depending on order size. Direct billing with Daman, AXA, Bupa, and Cigna is supported by most major pharmacy apps.",
  },
  {
    question: "How fast is pharmacy delivery in Dubai?",
    answer:
      "Same-day delivery within 2–4 hours is standard across Dubai urban areas — Downtown, Business Bay, JLT, Al Barsha, Deira, Bur Dubai. Priority or rush delivery options drop that to 30–90 minutes for a higher fee. Orders placed late at night are queued for next morning.",
  },
];

export default function PharmacyDeliveryPage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Pharmacy Delivery in the UAE" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(deliveryFaqs)} />

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
            <span className="text-ink font-medium">Pharmacy Delivery in the UAE</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Pharmacy guide
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Pharmacy Delivery in the UAE
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
            Order prescription and OTC medications online in the UAE &mdash; how delivery works,
            what requires a prescription, and whether your insurance covers delivery.
          </p>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Pharmacy delivery is widely available across the UAE. Most major pharmacy chains &mdash; Aster,
              Life Pharmacy, Boots UAE, and United Pharmacy &mdash; offer same-day or next-day home delivery
              through their own apps and websites, as well as through third-party platforms like Talabat
              and Noon. OTC (over-the-counter) medications can be ordered with no prescription. Prescription
              medications require you to upload or present a valid prescription before dispensing. Controlled
              substances cannot be delivered and must be collected in person. Insurance coverage for delivery
              varies by plan.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-[720px] font-sans text-z-body text-ink leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-4 mb-4">
              Overview of pharmacy delivery services in the UAE
            </h2>
            <div className="space-y-5">
              <p>
                Pharmacy delivery in the UAE has expanded significantly since 2020. Regulatory frameworks
                set by DHA (Dubai), DOH (Abu Dhabi), and MOHAP allow licensed pharmacies to fulfill home
                delivery orders, subject to specific rules around prescription verification and drug types.
              </p>
              <p>
                Most major chains operate their own delivery infrastructure, with dedicated riders delivering
                within 2&ndash;4 hours in urban areas. In addition, aggregator platforms like Talabat, Noon,
                and Careem have integrated pharmacy partners, making it possible to order medications
                through the same apps used for food and grocery delivery.
              </p>
              <p>
                Delivery coverage is strongest in Dubai (especially Downtown, Business Bay, JLT, Al Barsha,
                Deira, Bur Dubai) and Abu Dhabi city. Suburbs and the Northern Emirates have more variable
                coverage, and same-day delivery may not always be available. Most services offer next-day
                delivery across all seven emirates.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              How to place a pharmacy delivery order
            </h2>
            <div className="space-y-5">
              <p>The ordering process is broadly similar across platforms:</p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong className="font-semibold">Choose a platform or pharmacy app.</strong> You can order directly through the
                  pharmacy&apos;s website or app (Aster, Life Pharmacy, Boots UAE), or through a third-party
                  aggregator (Talabat Pharmacy, Noon Pharmacy). Direct pharmacy apps give you more visibility
                  into stock and pricing.
                </li>
                <li>
                  <strong className="font-semibold">Search or browse for your medication.</strong> Use the generic name or brand name.
                  The app will show available options, strengths, and pack sizes. OTC items can be added to
                  cart immediately.
                </li>
                <li>
                  <strong className="font-semibold">Upload your prescription (if required).</strong> For prescription-only medications,
                  you will be prompted to upload a photo of your valid prescription. The pharmacy reviews it
                  before processing the order. Some platforms integrate with UAE e-prescription systems to
                  allow digital verification.
                </li>
                <li>
                  <strong className="font-semibold">Confirm your address and payment.</strong> Delivery fees typically range from AED 0
                  (on orders above a threshold, often AED 100&ndash;150) to AED 15&ndash;25. Same-day or priority delivery
                  may carry a higher fee.
                </li>
                <li>
                  <strong className="font-semibold">Receive your order.</strong> A pharmacy rider delivers to your door. For prescription
                  items, the rider may ask to verify your Emirates ID at the point of delivery, especially
                  for higher-risk medications.
                </li>
              </ol>
              <div className="rounded-z-md bg-surface-cream border border-ink-hairline p-4">
                <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
                  <strong className="text-ink-soft">Tip.</strong> If you are a first-time user on a pharmacy app, you can often get a
                  promotional discount or free delivery on your first order. Worth checking before paying
                  a delivery fee.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              Prescription medications by delivery
            </h2>
            <div className="space-y-5">
              <p>Licensed UAE pharmacies can deliver prescription medications, subject to the following rules:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  A valid, unexpired prescription from a licensed UAE physician is required. International
                  prescriptions are generally not accepted for delivery orders.
                </li>
                <li>
                  The prescription must not have already been fully dispensed. Pharmacies track dispensing
                  records and will not re-dispense a completed prescription.
                </li>
                <li>
                  Cold-chain medications (insulin, biologics, certain eye drops) can be delivered, but the
                  pharmacy must use appropriate temperature-controlled packaging. Confirm this with the
                  pharmacy before ordering.
                </li>
                <li>
                  Controlled substances (opioids, benzodiazepines, ADHD medications) cannot be delivered.
                  These must be collected in person at the dispensing pharmacy.
                </li>
              </ul>
              <p>
                For chronic medications on a repeating prescription, some pharmacy apps allow you to set up
                scheduled refill delivery &mdash; the pharmacy contacts you when your next refill is due and
                dispatches automatically.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              OTC delivery &mdash; no prescription needed
            </h2>
            <div className="space-y-5">
              <p>
                A large range of medications and health products can be ordered online without a prescription.
                Common OTC categories available for delivery in the UAE include:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "Pain relievers (paracetamol, ibuprofen)",
                  "Antihistamines",
                  "Antacids and digestive aids",
                  "Cold and flu remedies",
                  "Vitamins and supplements",
                  "Topical antiseptics and wound care",
                  "Hydration sachets (ORS)",
                  "Pregnancy tests",
                  "Blood pressure monitors",
                  "Blood glucose test strips",
                  "Sunscreen and skincare",
                  "Baby and infant care",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-z-sm bg-surface-cream border border-ink-hairline px-3 py-2"
                  >
                    <p className="font-sans text-z-caption text-ink-soft">{item}</p>
                  </div>
                ))}
              </div>
              <p>
                If you are unsure whether a medication requires a prescription in the UAE, search for it in our{" "}
                <Link href="/medications" className="text-accent-dark hover:underline font-medium">
                  UAE Medication Directory
                </Link>{" "}
                &mdash; each entry notes the Rx status (OTC, Prescription-only, or Controlled).
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              Does insurance cover pharmacy delivery?
            </h2>
            <div className="space-y-5">
              <p>
                Insurance coverage for pharmacy delivery in the UAE depends on your plan and insurer. Here is
                what is generally true across the major networks:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="font-semibold">Drug cost coverage</strong> &mdash; if your insurance covers the medication at a physical
                  pharmacy, it typically also covers it when ordered for delivery, as long as the dispensing
                  pharmacy is in your insurer&apos;s network. Always check that the delivery pharmacy is
                  network-approved before ordering.
                </li>
                <li>
                  <strong className="font-semibold">Delivery fee</strong> &mdash; most insurance plans do not cover the delivery fee itself.
                  You will pay the delivery charge out-of-pocket regardless of coverage.
                </li>
                <li>
                  <strong className="font-semibold">Copay</strong> &mdash; your standard pharmacy copay (typically 10&ndash;20% under Dubai and
                  Abu Dhabi mandatory health insurance) applies to delivered prescriptions the same as in-store.
                </li>
                <li>
                  <strong className="font-semibold">Direct billing</strong> &mdash; some pharmacy apps support direct insurer billing (Daman,
                  AXA, Bupa, Cigna). You enter your insurance card number, and the system bills the insurer
                  directly. Others require you to pay upfront and submit a reimbursement claim.
                </li>
              </ul>
              <p>
                If your insurer offers a dedicated pharmacy benefit (a specific pharmacy network or mail-order
                program for chronic medications), using that channel may give you lower copays than a standard
                delivery order. Check your insurance card or call the insurer&apos;s member services line to
                confirm your pharmacy benefits.
              </p>
              <div className="rounded-z-md bg-surface-cream border border-ink-hairline p-4">
                <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
                  <strong className="text-ink-soft">Note.</strong> Basic health insurance plans (the minimum mandatory cover in Dubai)
                  typically cover generic medications only. If you need a brand-name drug delivered, you may
                  need to pay the cost difference between the brand and the generic yourself.
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>

      {/* Related */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Related resources
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Keep reading.
          </h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              href: "/pharmacy",
              title: "UAE Pharmacy Guide",
              desc: "Find pharmacies, understand your options, and get prescription help",
              Icon: Truck,
            },
            {
              href: "/medications",
              title: "UAE Medication Directory",
              desc: "Look up Rx status, generic names, and brand equivalents",
              Icon: Pill,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
            >
              <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                <item.Icon className="h-5 w-5 text-accent-deep" />
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
            Delivery, answered.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={deliveryFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This guide is for informational purposes only and does not
            constitute medical or pharmaceutical advice. Pharmacy delivery availability, fees, and regulatory
            requirements vary by emirate and are subject to change. Always verify that the pharmacy you order
            from is licensed by the relevant UAE health authority. Consult a licensed pharmacist or physician
            before ordering prescription medications. Last updated April 2026.
          </p>
        </div>
      </section>
    </>
  );
}
