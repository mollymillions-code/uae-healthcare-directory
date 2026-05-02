import { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ChevronRight, FileText, ArrowRight, Sparkles, Building2 } from "lucide-react";

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

const refillFaqs = [
  {
    question: "How long is a UAE prescription valid for?",
    answer:
      "Standard prescriptions are usually valid for 3 months from the date of issue, though this varies by medication and emirate. Chronic disease prescriptions in DHA and DOH programs often remain valid for up to 90 days per refill cycle. Controlled substances cannot be refilled — a new prescription is required each time.",
  },
  {
    question: "Can I refill a prescription at a different pharmacy?",
    answer:
      "Within the same emirate, usually yes. E-prescriptions tied to your Emirates ID are visible to any licensed pharmacy on the same network (DHA in Dubai, Malaffi in Abu Dhabi). For paper prescriptions, you can take the original document to any pharmacy — they will mark it as dispensed to prevent duplicates.",
  },
  {
    question: "What happens if my prescription expires before I finish refilling it?",
    answer:
      "You will need a new prescription from your doctor. Many UAE pharmacies can dispense a small emergency supply (typically 7 days) for chronic medications while you arrange a renewal. Most insurers also support teleconsultations for quick prescription renewals.",
  },
  {
    question: "Can I bring my controlled medication into the UAE from abroad?",
    answer:
      "Yes, with documentation. Carry a valid prescription from your home country and, for quantities above the standard limit, a permit from MOHAP. Check MOHAP's current list of restricted substances and travel with the medication in its original labeled packaging to avoid customs issues.",
  },
];

export default function PrescriptionRefillPage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Pharmacy Guide", url: `${base}/pharmacy` },
          { name: "Prescription Refill Guide" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(refillFaqs)} />

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
            <span className="text-ink font-medium">Prescription Refill Guide</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Pharmacy guide
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            How to Refill Prescriptions in the UAE
          </h1>
          <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
            DHA, DOH, and MOHAP rules for prescription refills in the UAE &mdash; including chronic
            medication programs, transfers, and controlled substances.
          </p>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              In the UAE, prescriptions are regulated at the emirate level by DHA (Dubai), DOH (Abu Dhabi),
              and MOHAP (all other emirates). Most prescriptions are valid for a limited dispensing window
              &mdash; typically 3 months from the date of issue, though this varies by medication type. Chronic
              disease patients in Dubai and Abu Dhabi can access dedicated refill programs. Controlled
              substances require the original prescription each time and cannot be refilled without a new
              doctor consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-[720px] font-sans text-z-body text-ink leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-4 mb-4">
              How the UAE prescription system works
            </h2>
            <div className="space-y-5">
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
                Pharmacies are required to verify a patient&apos;s identity &mdash; typically via Emirates ID
                or residency visa &mdash; before dispensing prescription medications. For visitors, a valid
                passport may be accepted.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              DHA, DOH, and MOHAP rules on refills
            </h2>
            <div className="space-y-5">
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
                    className="rounded-z-md bg-surface-cream border border-ink-hairline p-4"
                  >
                    <p className="font-display font-semibold text-ink text-z-body leading-tight mb-2">
                      {item.authority}
                    </p>
                    <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
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

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              Refilling chronic medications
            </h2>
            <div className="space-y-5">
              <p>
                Patients with long-term conditions &mdash; diabetes, hypertension, hypothyroidism, asthma,
                mental health conditions &mdash; are the most frequent pharmacy users in the UAE. Several
                programs are designed to make chronic refills easier:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="font-semibold">DHA Chronic Disease Management Program</strong> &mdash; enrolled patients receive
                  quarterly prescriptions and can collect refills at participating pharmacies without
                  a GP visit each time.
                </li>
                <li>
                  <strong className="font-semibold">SEHA pharmacy network (Abu Dhabi)</strong> &mdash; government facilities dispense
                  chronic medications for Thiqa-insured patients at reduced or zero copay.
                </li>
                <li>
                  <strong className="font-semibold">Private insurance portals</strong> &mdash; many insurers (Daman, AXA, Bupa, Cigna)
                  have online portals where chronic prescriptions can be renewed with a teleconsultation,
                  avoiding the need for an in-person GP visit.
                </li>
                <li>
                  <strong className="font-semibold">Pharmacy chains with in-store clinics</strong> &mdash; Aster, Boots, and Life Pharmacy
                  operate GP clinics within some UAE branches where you can get a prescription renewed
                  on the spot.
                </li>
              </ul>
              <div className="rounded-z-md bg-surface-cream border border-ink-hairline p-4">
                <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
                  <strong className="text-ink-soft">Tip.</strong> If you are running low on a chronic medication and your prescription
                  has expired, a pharmacist may dispense a small emergency supply (typically 7 days) while
                  you arrange a renewal. This varies by pharmacy policy and medication type.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              How to transfer a prescription between pharmacies
            </h2>
            <div className="space-y-5">
              <p>
                Within the UAE e-prescription system, a prescription is tied to the patient&apos;s Emirates
                ID and can generally be filled at any licensed pharmacy that can access the same health record
                network &mdash; DHA pharmacies within Dubai, DOH/Malaffi pharmacies within Abu Dhabi. Cross-emirate
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

          <section>
            <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.018em] mt-12 mb-4">
              Controlled substance rules in the UAE
            </h2>
            <div className="space-y-5">
              <p>
                The UAE has strict regulations governing controlled substances under Federal Law No. 14 of 1995
                (Narcotic Drugs and Psychotropic Substances Law) and its amendments. Controlled medications &mdash;
                including opioid analgesics, benzodiazepines, ADHD medications (e.g., methylphenidate,
                amphetamines), and certain sleep aids &mdash; require special handling at every step.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="font-semibold">Prescription format</strong> &mdash; controlled substances must be written on a special
                  narcotic/controlled prescription form issued by the health authority. Electronic prescriptions
                  for these drugs require additional security steps.
                </li>
                <li>
                  <strong className="font-semibold">No refills without a new prescription</strong> &mdash; pharmacies cannot refill a controlled
                  substance prescription. A new doctor visit and a new prescription are required each time.
                </li>
                <li>
                  <strong className="font-semibold">Quantity limits</strong> &mdash; prescriptions are generally limited to a 30-day supply.
                  For patients traveling, a letter from the prescribing physician and a translated copy of
                  the prescription are recommended.
                </li>
                <li>
                  <strong className="font-semibold">Importing controlled substances</strong> &mdash; travelers arriving in the UAE with
                  controlled substances must carry a valid prescription and, for quantities above the
                  limit, a permit from MOHAP. Check the MOHAP website or your airline before traveling.
                </li>
              </ul>
              <p>
                If you are prescribed a controlled substance by a UAE physician, your pharmacy will register
                the dispensing in the health authority system. This helps prevent duplicate prescriptions.
                Do not share or transfer controlled medications &mdash; it is a criminal offence under UAE law.
              </p>
            </div>
          </section>
        </div>
      </article>

      {/* Related */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Find a pharmacy
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Where to next.
          </h2>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              href: "/pharmacy",
              title: "UAE Pharmacy Guide",
              desc: "Overview of UAE pharmacy services, chains, and resources",
              Icon: FileText,
            },
            {
              href: "/directory/dubai/pharmacy",
              title: "Pharmacies in Dubai",
              desc: "Browse all licensed pharmacies in Dubai by area",
              Icon: Building2,
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
            Refills, answered.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={refillFaqs} />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Medical disclaimer.</strong> This guide is for informational purposes only and does not
            constitute medical, legal, or pharmaceutical advice. Prescription regulations in the UAE are
            subject to change. Always consult your prescribing physician and a licensed UAE pharmacist for
            advice specific to your situation. Controlled substance rules carry legal consequences &mdash; refer to
            official MOHAP, DHA, and DOH guidance for current requirements. Last updated April 2026.
          </p>
        </div>
      </section>
    </>
  );
}
