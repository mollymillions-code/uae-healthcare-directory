import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { TEMPLATES, SPECIALTIES, MESSAGE_TYPES } from "@/lib/tools/whatsapp-templates";
import { WhatsAppTemplatesClient } from "./WhatsAppTemplatesClient";

export const revalidate = 86400;

const TITLE = "Free WhatsApp Templates for UAE Clinics — Bilingual (EN+AR), 8 Specialties, 8 Use-cases";
const DESCRIPTION =
  "60+ ready-to-use WhatsApp reminder templates for UAE clinics — appointment confirmations, reminders, follow-ups, payment reminders. Bilingual English + Arabic. UAE-appropriate formality. No login.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools/whatsapp-templates` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FAQS = [
  {
    question: "Are these templates compliant with UAE WhatsApp Business policies?",
    answer:
      "These are template starters. WhatsApp Business policy requires that promotional or transactional templates are pre-approved by Meta before sending in bulk. Use these as the basis for your Meta-approved template submission — Meta typically approves transactional reminders within 24–48 hours.",
  },
  {
    question: "Why are the Arabic templates structured differently from a literal translation?",
    answer:
      "UAE Arabic uses different formality registers depending on the patient's age, gender, and relationship. The templates use neutral-polite forms suitable for adult patients. For elderly Emirati patients, you may want to add `حضرتك` (your honor) where appropriate. For pediatric communications addressed to parents, the templates use parental address.",
  },
  {
    question: "Can I edit these templates for my clinic?",
    answer:
      "Yes — they're starter templates designed for editing. Replace the placeholders ({patient_name}, {clinic_name}, etc.) with your actual values. Adjust tone for your clinic's voice. The Arabic versions in particular benefit from review by a native UAE Arabic speaker familiar with your patient demographic.",
  },
  {
    question: "Does Zavis send these messages automatically?",
    answer:
      "This tool is the template library — not the sender. Zavis Platform (the paid product) automates the actual sending: reads from your appointment system, picks the right template, fills placeholders, and sends via WhatsApp Business API. This free tool gives you the templates; the platform sends them.",
  },
];

export default function WhatsAppTemplatesPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools", url: `${base}/tools` },
          { name: "WhatsApp Templates" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={softwareApplicationSchema({
          name: "Bilingual WhatsApp Reminder Templates for UAE Clinics",
          description: DESCRIPTION,
          url: `${base}/tools/whatsapp-templates`,
          applicationCategory: "BusinessApplication",
        })}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "WhatsApp Templates" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            Free tool · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            Bilingual WhatsApp templates for UAE clinics.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            64 ready-to-use messages — appointment confirmations, reminders, follow-ups, payment requests, no-show recovery — across 8 specialties. UAE-appropriate Arabic formality, with English alongside. Copy and paste.
          </p>

          <div className="mt-6 border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/55 leading-relaxed">
              Most patient-communication tools assume English-only US clinics. UAE clinics need Arabic that respects formality registers, English alongside for younger patients, and templates that feel like they came from a clinic — not a software platform. These do.
            </p>
          </div>
        </div>

        <WhatsAppTemplatesClient
          templates={TEMPLATES}
          specialties={SPECIALTIES}
          messageTypes={MESSAGE_TYPES}
        />

        <div className="max-w-3xl mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
            How to use these templates
          </h2>
          <div className="prose-journal space-y-4 font-['Geist',sans-serif] text-black/65 leading-relaxed">
            <p>
              Each template uses placeholder tokens like <code className="font-['Geist_Mono',monospace] bg-black/[0.05] px-1.5 py-0.5 rounded text-[13px]">{`{patient_name}`}</code> and <code className="font-['Geist_Mono',monospace] bg-black/[0.05] px-1.5 py-0.5 rounded text-[13px]">{`{appointment_time}`}</code>. Copy the template, replace the placeholders with the patient&apos;s actual data, and send via WhatsApp Business.
            </p>
            <p>
              For volume use, register the template with WhatsApp Business API (via Meta Business Manager). Meta requires pre-approval for transactional templates — typically 24–48 hours for routine reminders. Once approved, you can send bulk messages compliantly.
            </p>
            <p>
              The Arabic versions assume neutral-polite formality suitable for most adult patients. Adjust for your specific patient demographic — elderly Emirati patients often appreciate the more formal <code className="font-['Geist_Mono',monospace] bg-black/[0.05] px-1.5 py-0.5 rounded text-[13px]">حضرتك</code> address; younger expat patients may prefer the standard form already used.
            </p>
          </div>

          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mt-12 mb-4">
            Frequently asked
          </h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details key={f.question} className="border border-black/[0.06] rounded-xl px-5 py-4 bg-white open:bg-[#006828]/[0.02] transition-colors">
                <summary className="cursor-pointer font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight">
                  {f.question}
                </summary>
                <p className="mt-3 font-['Geist',sans-serif] text-sm text-black/65 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
