import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { IntakeFormClient } from "./IntakeFormClient";

export const revalidate = 86400;

const TITLE = "Bilingual Patient Intake Form Generator (UAE) — NABIDH-aware, EN+AR";
const DESCRIPTION =
  "Free intake-form generator for UAE clinics. Bilingual (English + Arabic), NABIDH consent-aware, PDPL-compliant marketing consent. Customize sections, preview live, export as printable HTML. No login.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools/intake-form` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FAQS = [
  {
    question: "Is this form NABIDH / Malaffi / Riayati compliant?",
    answer:
      "The NABIDH consent boilerplate is included verbatim from the UAE Federal Law No. 2 of 2019 reference language. Specific operational compliance (where the consent record is stored, who can access it, retention periods) is the clinic's responsibility — this tool generates the consent capture; the clinic implements the back-end record-keeping.",
  },
  {
    question: "Is this PDPL-compliant for marketing consent?",
    answer:
      "Yes — the marketing-consent question is opt-in, separate from medical consent, and explicitly references PDPL Article 13 right-to-withdraw. This is the structure UAE PDPL requires.",
  },
  {
    question: "What's the output format?",
    answer:
      "Two outputs: (1) printable HTML (single file) — clinics print to A4 from the browser or host on their own site; (2) JSON config — clinics can import into form builders or feed into a digital intake system. PDF generation is on the roadmap.",
  },
  {
    question: "Can I add custom questions?",
    answer:
      "Up to 5 free-text custom questions per generated form. For more flexibility, the JSON config can be edited manually before generating the printable HTML.",
  },
];

export default function IntakeFormPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools", url: `${base}/tools` },
          { name: "Intake Form Generator" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={softwareApplicationSchema({
          name: "Bilingual Patient Intake Form Generator (UAE)",
          description: DESCRIPTION,
          url: `${base}/tools/intake-form`,
          applicationCategory: "HealthApplication",
        })}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "Intake Form Generator" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            Free tool · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            Bilingual patient intake form generator.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            English + Arabic side-by-side, NABIDH-aware consent, PDPL-compliant marketing opt-in. Pick your sections, preview the form, and export as printable HTML.
          </p>

          <div className="mt-6 border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/55 leading-relaxed">
              Most form builders (JotForm, Typeform, Google Forms) are English-centric and don&apos;t handle Arabic RTL well. UAE clinics need bilingual forms with NABIDH consent and PDPL-compliant marketing opt-in. This tool generates that, ready to print or host.
            </p>
          </div>
        </div>

        <IntakeFormClient />

        <div className="max-w-3xl mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
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
