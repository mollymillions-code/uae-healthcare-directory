import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  AlertCircle,
  MessageSquare,
  Calendar,
  ClipboardList,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const revalidate = 86400;

const TITLE = "Free UAE-Specific AI Tools for Clinics — Powered by Zavis AI";
const DESCRIPTION =
  "The first UAE-specific AI tools for clinic operators. Free, no signup. AI-powered claim rejection analyzer, bilingual WhatsApp generator, personalized compliance plan, intake form builder, Google review reply — built for UAE healthcare and PDPL-safe by design.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

interface Tool {
  slug: string;
  title: string;
  blurb: string;
  audience: string;
  icon: React.ElementType;
  ai: boolean;
}

const TOOLS: Tool[] = [
  {
    slug: "claim-decoder",
    title: "UAE Claim Rejection Analyzer",
    blurb: "Paste the full insurer rejection text (DHPO / Daman / Shafafiya / NEXtCARE). AI returns UAE-specific root cause, resubmission steps, and a draft email to the insurer in English + Arabic.",
    audience: "Insurance coordinators · Billing managers",
    icon: AlertCircle,
    ai: true,
  },
  {
    slug: "whatsapp-templates",
    title: "Bilingual WhatsApp Generator",
    blurb: "Describe your scenario in plain English — AI generates a bilingual UAE-tone WhatsApp message with PDPL-safe placeholders. Plus 64 ready-to-use templates as fallback.",
    audience: "Practice managers · Front-desk leads",
    icon: MessageSquare,
    ai: true,
  },
  {
    slug: "compliance-calendar",
    title: "Personalized UAE Compliance Plan",
    blurb: "Describe your clinic — AI returns a personalized 30/60/90-day compliance + ops priority list with UAE-specific gotchas. Plus a static deadline computer for the basics.",
    audience: "Clinic owners · Compliance officers",
    icon: Calendar,
    ai: true,
  },
  {
    slug: "intake-form",
    title: "AI Patient Intake Form Builder",
    blurb: "Describe your clinic — AI generates a complete bilingual PDPL-compliant intake form with specialty-specific sections + UAE consent blocks. Plus a manual section picker.",
    audience: "Clinic owners · Front-desk leads",
    icon: ClipboardList,
    ai: true,
  },
  {
    slug: "review-reply",
    title: "AI Google Review Reply Generator",
    blurb: "Paste a Google review (Arabic or English), get 3 PDPL-safe reply variants in both languages — empathetic, grateful, concise.",
    audience: "Practice managers · Marketing leads",
    icon: Sparkles,
    ai: true,
  },
];

export default function ToolsIndexPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools" },
        ])}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            ✦ Powered by Zavis AI · Free · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[44px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            The first UAE-specific AI tools for clinic operators.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            5 free AI tools built for the UAE — claim rejection analyzer, bilingual WhatsApp generator, personalized compliance plan, intake form builder, Google review reply. Bilingual EN + AR, PDPL-safe by design, no login, no paywall. Plus the static fallback every tool has, so they still work even if the AI is rate-limited.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-2 gap-5 max-w-5xl">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="group rounded-2xl border border-black/[0.06] bg-white p-6 hover:border-[#006828]/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#006828]/[0.08] text-[#006828] flex-shrink-0">
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                        {t.title}
                      </h2>
                      {t.ai && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#006828]/20 bg-[#006828]/[0.04] px-2 py-0.5 font-['Geist_Mono',monospace] text-[9px] font-semibold uppercase tracking-[0.12em] text-[#006828]">
                          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                          AI
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
                      {t.blurb}
                    </p>
                    <p className="mt-3 font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-[0.06em] text-black/40">
                      {t.audience}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-sm font-semibold text-[#006828]">
                      Open tool <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
            Why we built these
          </h2>
          <div className="prose-journal space-y-4 font-['Geist',sans-serif] text-black/65 leading-relaxed">
            <p>
              UAE clinic operators have specific problems that global SaaS doesn&apos;t solve well: PDPL-stricter-than-HIPAA constraints on patient communication, NABIDH/Malaffi/Riayati consent capture in Arabic and English, license-renewal cycles that vary by emirate, claim rejection codes from four different platforms with different vocabularies. Every one of these problems is solved badly today, mostly by spreadsheet or institutional knowledge that walks out when staff turn over.
            </p>
            <p>
              Each tool here is the answer to one of those problems. Free, no-signup, bilingual where it matters. Use them as much as you want. If you want them automated end-to-end across your whole clinic operation, that&apos;s the <Link href="/" className="text-[#006828] hover:underline">Zavis platform</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
