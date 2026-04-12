import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { FileText, ArrowRight } from "lucide-react";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  return {
    title: "How to Refill Prescriptions in the UAE — Complete Guide",
    description:
      "Everything you need to know about refilling prescriptions in the UAE. DHA, DOH, and MOHAP rules, chronic medication refills, prescription transfers, and controlled substance regulations.",
    alternates: { canonical: `${base}/pharmacy/prescription-refill` },
    openGraph: {
      title: "How to Refill Prescriptions in the UAE — Complete Guide",
      description:
        "DHA, DOH, and MOHAP rules for prescription refills in the UAE — including chronic medication programs, transfers, and controlled substances.",
      url: `${base}/pharmacy/prescription-refill`,
      type: "article",
      locale: "en_AE",
      siteName: "Zavis",
    },
  };
}

export default function PrescriptionRefillPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Prescription Refill Guide" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Pharmacy Guide", href: "/pharmacy" },
          { label: "Prescription Refill Guide" },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-[#006828]" />
          <span className="font-['Geist',sans-serif] text-xs text-black/40 uppercase tracking-wider">
            Pharmacy Guide
          </span>
        </div>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          How to Refill Prescriptions in the UAE
        </h1>

        <div
          className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 answer-block"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            In the UAE, prescriptions are regulated at the emirate level by DHA (Dubai), DOH (Abu Dhabi),
            and MOHAP (all other emirates). Most prescriptions are valid for a limited dispensing window
            — typically 3 months from the date of issue, though this varies by medication type. Chronic
            disease patients in Dubai and Abu Dhabi can access dedicated refill programs. Controlled
            substances require the original prescription each time and cannot be refilled without a new
            doctor consultation.
          </p>
        </div>
      </div>

      {/* Section 1 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How the UAE Prescription System Works
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            The UAE uses a unified electronic health record infrastructure through platforms like
            Malaffi (Abu Dhabi) and the Dubai Health Authority&apos;s shared health record system.
            Prescriptions issued at licensed facilities are electronically recorded and can be
            verified by pharmacies in the same emirate network.
          </p>
          <p>
            A standard prescription in the UAE includes the patient&apos;s Emirates ID number,
            the prescribing doctor&apos;s license details, the medication name (generic or brand),
            dose, frequency, and quantity. Paper prescriptions are still accepted at most pharmacies
            but are being phased out in favour of e-prescriptions in Dubai and Abu Dhabi.
          </p>
          <p>
            Pharmacies are required to verify a patient&apos;s identity — typically via Emirates ID
            or residency visa — before dispensing prescription medications. For visitors, a valid
            passport may be accepted.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            DHA, DOH, and MOHAP Rules on Refills
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Each of the three main health authorities in the UAE has slightly different refill policies:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                authority: "DHA — Dubai",
                detail:
                  "Standard prescriptions are dispensed in full as written. Chronic disease prescriptions (hypertension, diabetes, thyroid) can be refilled for up to 3 months without a return visit when enrolled in the DHA chronic disease management program. Pharmacists can validate e-prescriptions directly in the DHA system.",
              },
              {
                authority: "DOH — Abu Dhabi",
                detail:
                  "Abu Dhabi follows a similar framework through SEHA and private network facilities. Chronic prescriptions are typically valid for 90 days. The Malaffi platform enables cross-facility prescription visibility. Patients enrolled in the Thiqa or Daman programs may have chronic refills managed through their insurer portal.",
              },
              {
                authority: "MOHAP — All Other Emirates",
                detail:
                  "Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah fall under MOHAP jurisdiction. Prescriptions are generally valid for one-time dispensing unless explicitly marked as repeatable. Chronic disease patients should ask their physician to write a repeatable prescription with refill intervals.",
              },
            ].map((item) => (
              <div
                key={item.authority}
                className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4"
              >
                <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] mb-2">
                  {item.authority}
                </p>
                <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <p>
            In all emirates, pharmacies are not permitted to dispense more medication than is written
            on the prescription, and cannot refill a prescription that has expired or has been fully
            dispensed without a new doctor&apos;s order.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Refilling Chronic Medications
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Patients with long-term conditions — diabetes, hypertension, hypothyroidism, asthma,
            mental health conditions — are the most frequent pharmacy users in the UAE. Several
            programs are designed to make chronic refills easier:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
            <li>
              <strong>DHA Chronic Disease Management Program</strong> — enrolled patients receive
              quarterly prescriptions and can collect refills at participating pharmacies without
              a GP visit each time.
            </li>
            <li>
              <strong>SEHA pharmacy network (Abu Dhabi)</strong> — government facilities dispense
              chronic medications for Thiqa-insured patients at reduced or zero copay.
            </li>
            <li>
              <strong>Private insurance portals</strong> — many insurers (Daman, AXA, Bupa, Cigna)
              have online portals where chronic prescriptions can be renewed with a teleconsultation,
              avoiding the need for an in-person GP visit.
            </li>
            <li>
              <strong>Pharmacy chains with in-store clinics</strong> — Aster, Boots, and Life Pharmacy
              operate GP clinics within some UAE branches where you can get a prescription renewed
              on the spot.
            </li>
          </ul>
          <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-xl p-4">
            <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed">
              <strong>Tip:</strong> If you are running low on a chronic medication and your prescription
              has expired, a pharmacist may dispense a small emergency supply (typically 7 days) while
              you arrange a renewal. This varies by pharmacy policy and medication type.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            How to Transfer a Prescription Between Pharmacies
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            Within the UAE e-prescription system, a prescription is tied to the patient&apos;s Emirates
            ID and can generally be filled at any licensed pharmacy that can access the same health record
            network — DHA pharmacies within Dubai, DOH/Malaffi pharmacies within Abu Dhabi. Cross-emirate
            transfers of e-prescriptions are not yet seamless but are improving.
          </p>
          <p>
            For paper prescriptions, you can take the original document to any pharmacy. The dispensing
            pharmacy will mark the prescription as filled to prevent duplicate dispensing. If a prescription
            has been partially filled (e.g., 30 of 90 tablets dispensed), the remainder can typically be
            collected at a different pharmacy with the original paperwork.
          </p>
          <p>
            If you are relocating between emirates and need to continue a medication, ask your doctor for
            a fresh prescription from a licensed practitioner in the new emirate. For specialist medications
            (e.g., biologics, oncology drugs), coordinate the transfer through the treating hospital to
            ensure continuity.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Controlled Substance Rules in the UAE
          </h2>
        </div>
        <div className="space-y-4 font-['Geist',sans-serif] text-sm text-[#1c1c1c] leading-relaxed">
          <p>
            The UAE has strict regulations governing controlled substances under Federal Law No. 14 of 1995
            (Narcotic Drugs and Psychotropic Substances Law) and its amendments. Controlled medications —
            including opioid analgesics, benzodiazepines, ADHD medications (e.g., methylphenidate,
            amphetamines), and certain sleep aids — require special handling at every step.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#1c1c1c] font-['Geist',sans-serif]">
            <li>
              <strong>Prescription format</strong> — controlled substances must be written on a special
              narcotic/controlled prescription form issued by the health authority. Electronic prescriptions
              for these drugs require additional security steps.
            </li>
            <li>
              <strong>No refills without a new prescription</strong> — pharmacies cannot refill a controlled
              substance prescription. A new doctor visit and a new prescription are required each time.
            </li>
            <li>
              <strong>Quantity limits</strong> — prescriptions are generally limited to a 30-day supply.
              For patients traveling, a letter from the prescribing physician and a translated copy of
              the prescription are recommended.
            </li>
            <li>
              <strong>Importing controlled substances</strong> — travelers arriving in the UAE with
              controlled substances must carry a valid prescription and, for quantities above the
              limit, a permit from MOHAP. Check the MOHAP website or your airline before traveling.
            </li>
          </ul>
          <p>
            If you are prescribed a controlled substance by a UAE physician, your pharmacy will register
            the dispensing in the health authority system. This helps prevent duplicate prescriptions.
            Do not share or transfer controlled medications — it is a criminal offence under UAE law.
          </p>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Find a Pharmacy
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: "/pharmacy",
              title: "UAE Pharmacy Guide",
              desc: "Overview of UAE pharmacy services, chains, and resources",
            },
            {
              href: "/directory/dubai/pharmacy",
              title: "Pharmacies in Dubai",
              desc: "Browse all licensed pharmacies in Dubai by area",
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
          constitute medical, legal, or pharmaceutical advice. Prescription regulations in the UAE are
          subject to change. Always consult your prescribing physician and a licensed UAE pharmacist for
          advice specific to your situation. Controlled substance rules carry legal consequences — refer to
          official MOHAP, DHA, and DOH guidance for current requirements. Last updated April 2026.
        </p>
      </div>
    </div>
  );
}
