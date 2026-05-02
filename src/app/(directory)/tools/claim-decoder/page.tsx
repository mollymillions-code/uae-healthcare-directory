import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ClaimDecoderClient } from "./ClaimDecoderClient";
import { CLAIM_CODES, TOP_RECENT_CODES } from "@/lib/tools/claim-codes";

export const revalidate = 86400;

const TITLE = "UAE Claim Rejection Decoder — DHPO, eClaimLink, Shafafiya, NEXtCARE";
const DESCRIPTION =
  "Paste a UAE health-insurance rejection code and get the plain-English explanation, the most common cause, and the recommended fix. Free tool by Zavis. No login.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools/claim-decoder` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FAQS = [
  {
    question: "Which UAE claim platforms does this decoder support?",
    answer:
      "Four platforms: DHPO (Dubai Health Post Office), eClaimLink (Abu Dhabi DOH), Shafafiya (DHA TPA platform), and NEXtCARE (private TPA used by MetLife and others). Codes from each platform have different prefixes and structures — paste any of them and the tool auto-detects.",
  },
  {
    question: "Is this tool a substitute for the official platform documentation?",
    answer:
      "No. It's a billing-coordinator quick-reference distilled from publicly available sources. Always verify against the platform's own current documentation before using in formal billing decisions. Zavis takes no responsibility for billing outcomes — this is informational.",
  },
  {
    question: "Why does my code return no result?",
    answer:
      "The reference covers the ~80 most common codes across the 4 major platforms. Less common codes, custom carrier-specific rejection messages, or codes from regional TPAs may not be in the database. Email zavis support with the code and we'll add it.",
  },
  {
    question: "Can I get the full code reference as a PDF?",
    answer:
      "Yes. Drop your email at the bottom of the tool — we'll send the complete reference (80+ codes) plus monthly UAE healthcare-ops updates. No spam.",
  },
];

export default function ClaimDecoderPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools", url: `${base}/tools` },
          { name: "Claim Rejection Decoder" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "Claim Rejection Decoder" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            Free tool · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            UAE Claim Rejection Decoder.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            Paste any rejection code from DHPO, eClaimLink, Shafafiya or NEXtCARE — get the plain-English explanation, common cause, and the fix that resolves 80% of cases.
          </p>

          <div className="mt-6 border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/55 leading-relaxed">
              UAE clinics lose roughly 10–20% of revenue to claim errors. Decoding rejections faster recovers that revenue. This tool is the editorial team&apos;s distillation of the canonical platform documentation. Not a substitute for the official source — always verify before formal billing decisions.
            </p>
          </div>
        </div>

        {/* Interactive widget */}
        <ClaimDecoderClient codes={CLAIM_CODES} topCodes={TOP_RECENT_CODES} />

        {/* Supporting editorial */}
        <div className="max-w-3xl mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
            How to use this tool effectively
          </h2>
          <div className="prose-journal space-y-4 font-['Geist',sans-serif] text-black/65 leading-relaxed">
            <p>
              When a claim is rejected, the platform returns a code (or a free-text reason that contains a code). Coordinators usually have to look up the code in a 200-page PDF or ask a senior — this tool replaces that step with a 2-second paste.
            </p>
            <p>
              The output gives you four things: the plain-English explanation, the cause that resolves most cases, the concrete fix, and any related codes worth checking in case the platform misclassified the rejection. Use the &ldquo;Copy as note&rdquo; button to paste the explanation directly into your clinic ticket system or send back to the prescribing doctor.
            </p>
            <p>
              For high-volume rejection patterns (the same code recurring across many claims), the fix usually points to a billing-system or workflow issue: stale ICD-10 code library, billing software using the wrong XSD schema, or pre-auth workflow gaps. Solve the upstream cause once, not the downstream rejections one-by-one.
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
