import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ReviewReplyClient } from "./ReviewReplyClient";

export const revalidate = 86400;

const TITLE = "Free AI Google Review Reply Generator for UAE Clinics — PDPL-safe, EN+AR";
const DESCRIPTION =
  "Paste a Google review (Arabic or English), get 3 PDPL-compliant reply variants in both languages — empathetic, grateful, concise. Built for UAE clinics. No login.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools/review-reply` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FAQS = [
  {
    question: "Is this tool PDPL-compliant?",
    answer:
      "Yes — by design. The AI is instructed to never disclose patient diagnoses, treatments, dates, or any personally-identifiable information in reply text. Replies stay at a general, abstract level (\"we take feedback seriously\", \"your experience matters\") and offer to take the conversation private. UAE Federal Decree-Law No. 45 of 2021 (PDPL) Article 5 governs this — health data must not be processed beyond the original consented purpose, which excludes public marketing replies that disclose clinical information.",
  },
  {
    question: "How is this different from US tools like Doctible's review-reply?",
    answer:
      "Doctible and similar US tools generate English-only replies optimised for HIPAA. UAE clinics need bilingual EN+AR replies optimised for PDPL (which is stricter than HIPAA on health data). Plus a UAE-specific tone register — \"شكراً لتقييمك\" not a literal translation from English.",
  },
  {
    question: "Why 3 variants?",
    answer:
      "Different reviews need different tones. A 1-star angry review needs an empathetic apology + private-channel offer. A 5-star happy review needs warmth and gratitude. An ambiguous 3-star needs concise neutral acknowledgement. We give you all three so you pick the best fit.",
  },
  {
    question: "What's the rate limit?",
    answer:
      "5 generations per hour per IP. Plenty for managing reviews on a typical clinic schedule. If you need higher volume, the Zavis platform automates review monitoring and reply across all your locations.",
  },
];

export default function ReviewReplyPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools", url: `${base}/tools` },
          { name: "Review Reply Generator" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "Review Reply Generator" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            Free AI tool · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            AI Google review reply generator.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            Paste a Google review (Arabic or English), get 3 reply variants — empathetic, grateful, concise — in both languages. PDPL-compliant by design: no clinical details, no patient confirmation, no dates.
          </p>

          <div className="mt-6 border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/55 leading-relaxed">
              UAE&apos;s PDPL is stricter than HIPAA on what you can say in a public review reply. This tool is built for that constraint — replies acknowledge feedback at a general level and offer private follow-up, never confirming the reviewer is a patient or referencing clinical specifics.
            </p>
          </div>
        </div>

        <ReviewReplyClient />

        <div className="max-w-3xl mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
            Why this matters
          </h2>
          <div className="prose-journal space-y-4 font-['Geist',sans-serif] text-black/65 leading-relaxed">
            <p>
              Google Maps review replies are public and indexed. UAE clinics that reply with too much detail (&ldquo;Sorry your dental cleaning experience wasn&apos;t great&rdquo;) accidentally confirm a patient relationship and disclose clinical context. Under UAE PDPL Article 5, that&apos;s a regulatory issue.
            </p>
            <p>
              The professional response: acknowledge the feedback at a general level (&ldquo;Thanks for taking the time to share your experience&rdquo;), express care for the concern (&ldquo;your experience matters to us&rdquo;), and offer to take it private (&ldquo;please contact us at [phone/email] so we can discuss&rdquo;). Never confirm the reviewer is a patient. Never reference clinical specifics.
            </p>
            <p>
              That&apos;s the structural pattern this tool generates. Across three tone variants so you pick the right one for the rating.
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
