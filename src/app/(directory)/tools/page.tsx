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

const TITLE = "Free Tools for UAE Clinics";
const DESCRIPTION =
  "Free, no-signup tools for UAE clinic operators: claim rejection decoder, bilingual WhatsApp templates, regulator compliance calendar, NABIDH-aware intake forms, AI Google review reply generator. Built for the UAE healthcare market.";

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
}

const TOOLS: Tool[] = [
  {
    slug: "claim-decoder",
    title: "UAE Claim Rejection Decoder",
    blurb: "Paste a DHPO, eClaimLink, Shafafiya or NEXtCARE rejection code — get the plain-English explanation, common cause, and the fix.",
    audience: "Insurance coordinators · Billing managers",
    icon: AlertCircle,
  },
  {
    slug: "whatsapp-templates",
    title: "Bilingual WhatsApp Templates",
    blurb: "64 ready-to-use reminder templates (appointment, follow-up, payment, no-show recovery) in English + Arabic across 8 specialties.",
    audience: "Practice managers · Front-desk leads",
    icon: MessageSquare,
  },
  {
    slug: "compliance-calendar",
    title: "UAE Healthcare Compliance Calendar",
    blurb: "License renewals, CME deadlines, DataFlow verification, insurance contract renewals — all in one calendar with email reminders.",
    audience: "Clinic owners · Compliance officers",
    icon: Calendar,
  },
  {
    slug: "intake-form",
    title: "Bilingual Patient Intake Form Generator",
    blurb: "Build a NABIDH-aware, PDPL-compliant intake form in English + Arabic. Pick sections, add custom questions, export printable HTML.",
    audience: "Clinic owners · Front-desk leads",
    icon: ClipboardList,
  },
  {
    slug: "review-reply",
    title: "AI Google Review Reply Generator",
    blurb: "Paste a Google review (Arabic or English), get 3 PDPL-safe reply variants in both languages — empathetic, grateful, concise.",
    audience: "Practice managers · Marketing leads",
    icon: Sparkles,
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
            Free for UAE clinics · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            Tools that solve real UAE clinic problems.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            Built for UAE clinic operators by Zavis. Bilingual. PDPL-compliant. Sourced from official authority documentation. No login, no paywall, no marketing emails unless you opt in.
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
                    <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                      {t.title}
                    </h2>
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
