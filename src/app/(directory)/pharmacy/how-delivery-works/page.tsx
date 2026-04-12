import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { Truck, ArrowRight } from "lucide-react";

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

export default function PharmacyDeliveryPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Pharmacy Delivery in the UAE" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Pharmacy Guide", href: "/pharmacy" },
          { label: "Pharmacy Delivery in the UAE" },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-5 w-5 text-[#006828]" />
          <span className="font-['Geist',sans-serif] text-xs text-black/40 uppercase tracking-wider">
            Pharmacy Guide
          </span>
        </div>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          Pharmacy Delivery in the UAE
        </h1>

        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 answer-block"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            Pharmacy delivery is widely available across the UAE. Most major pharmacy chains — Aster,
            Life Pharmacy, Boots UAE, and United Pharmacy — offer same-day or next-day home delivery
            through their own apps and websites, as well as through third-party platforms like Talabat
            and Noon. OTC (over-the-counter) medications can be ordered with no prescription. Prescription
            medications require you to upload or present a valid prescription before dispensing. Controlled
            substances cannot be delivered and must be collected in person. Insurance coverage for delivery
            varies by plan.
          </p>
        </div>
      </div>

      {/* Section 1 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Overview of Pharmacy Delivery Services in the UAE
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Pharmacy delivery in the UAE has expanded significantly since 2020. Regulatory frameworks
            set by DHA (Dubai), DOH (Abu Dhabi), and MOHAP allow licensed pharmacies to fulfill home
            delivery orders, subject to specific rules around prescription verification and drug types.
          </p>
          <p>
            Most major chains operate their own delivery infrastructure, with dedicated riders delivering
            within 2–4 hours in urban areas. In addition, aggregator platforms like Talabat, Noon,
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

      {/* Section 2 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How to Place a Pharmacy Delivery Order
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            The ordering process is broadly similar across platforms:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
            <li>
              <strong>Choose a platform or pharmacy app.</strong> You can order directly through the
              pharmacy&apos;s website or app (Aster, Life Pharmacy, Boots UAE), or through a third-party
              aggregator (Talabat Pharmacy, Noon Pharmacy). Direct pharmacy apps give you more visibility
              into stock and pricing.
            </li>
            <li>
              <strong>Search or browse for your medication.</strong> Use the generic name or brand name.
              The app will show available options, strengths, and pack sizes. OTC items can be added to
              cart immediately.
            </li>
            <li>
              <strong>Upload your prescription (if required).</strong> For prescription-only medications,
              you will be prompted to upload a photo of your valid prescription. The pharmacy reviews it
              before processing the order. Some platforms integrate with UAE e-prescription systems to
              allow digital verification.
            </li>
            <li>
              <strong>Confirm your address and payment.</strong> Delivery fees typically range from AED 0
              (on orders above a threshold, often AED 100–150) to AED 15–25. Same-day or priority delivery
              may carry a higher fee.
            </li>
            <li>
              <strong>Receive your order.</strong> A pharmacy rider delivers to your door. For prescription
              items, the rider may ask to verify your Emirates ID at the point of delivery, especially
              for higher-risk medications.
            </li>
          </ol>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              <strong>Tip:</strong> If you are a first-time user on a pharmacy app, you can often get a
              promotional discount or free delivery on your first order. Worth checking before paying
              a delivery fee.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Prescription Medications by Delivery
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Licensed UAE pharmacies can deliver prescription medications, subject to the following rules:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
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
            scheduled refill delivery — the pharmacy contacts you when your next refill is due and
            dispatches automatically.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            OTC Delivery — No Prescription Needed
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
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
                className="bg-[#f8f8f6] border border-black/[0.06] rounded-lg px-3 py-2"
              >
                <p className="font-['Geist',sans-serif] text-xs text-[#1c1c1c]">{item}</p>
              </div>
            ))}
          </div>
          <p>
            If you are unsure whether a medication requires a prescription in the UAE, search for it in our{" "}
            <Link href="/medications" className="text-[#006828] hover:underline font-medium">
              UAE Medication Directory
            </Link>{" "}
            — each entry notes the Rx status (OTC, Prescription-only, or Controlled).
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Does Insurance Cover Pharmacy Delivery?
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Insurance coverage for pharmacy delivery in the UAE depends on your plan and insurer. Here is
            what is generally true across the major networks:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
            <li>
              <strong>Drug cost coverage</strong> — if your insurance covers the medication at a physical
              pharmacy, it typically also covers it when ordered for delivery, as long as the dispensing
              pharmacy is in your insurer&apos;s network. Always check that the delivery pharmacy is
              network-approved before ordering.
            </li>
            <li>
              <strong>Delivery fee</strong> — most insurance plans do not cover the delivery fee itself.
              You will pay the delivery charge out-of-pocket regardless of coverage.
            </li>
            <li>
              <strong>Copay</strong> — your standard pharmacy copay (typically 10–20% under Dubai and
              Abu Dhabi mandatory health insurance) applies to delivered prescriptions the same as in-store.
            </li>
            <li>
              <strong>Direct billing</strong> — some pharmacy apps support direct insurer billing (Daman,
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
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              <strong>Note:</strong> Basic health insurance plans (the minimum mandatory cover in Dubai)
              typically cover generic medications only. If you need a brand-name drug delivered, you may
              need to pay the cost difference between the brand and the generic yourself.
            </p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Related Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: "/pharmacy",
              title: "UAE Pharmacy Guide",
              desc: "Find pharmacies, understand your options, and get prescription help",
            },
            {
              href: "/medications",
              title: "UAE Medication Directory",
              desc: "Look up Rx status, generic names, and brand equivalents",
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
          <strong>Medical Disclaimer.</strong> This guide is for informational purposes only and does not
          constitute medical or pharmaceutical advice. Pharmacy delivery availability, fees, and regulatory
          requirements vary by emirate and are subject to change. Always verify that the pharmacy you order
          from is licensed by the relevant UAE health authority. Consult a licensed pharmacist or physician
          before ordering prescription medications. Last updated April 2026.
        </p>
      </div>
    </div>
  );
}
