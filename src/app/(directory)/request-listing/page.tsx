import { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  FileCheck,
  ShieldCheck,
  MessageCircle,
  Building2,
  Stethoscope,
  Pill,
  ScanLine,
  HeartPulse,
} from "lucide-react";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const PAGE_TITLE = "List Your Clinic on Zavis — UAE Open Healthcare Directory";
const PAGE_DESCRIPTION =
  "List your UAE or GCC clinic, hospital, pharmacy, lab, or dental practice on the Zavis Directory via WhatsApp. Free forever, regulator-verified, live in 2–3 days.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/request-listing`,
  },
  openGraph: {
    title: "List Your Clinic on Zavis",
    description: PAGE_DESCRIPTION,
    url: `${getBaseUrl()}/request-listing`,
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
  },
  twitter: {
    card: "summary_large_image",
    title: "List Your Clinic on Zavis",
    description:
      "List your UAE clinic on the Zavis Directory via WhatsApp. Free forever, regulator-verified.",
  },
  robots: { index: true, follow: true },
};

export default function RequestListingPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Claim", url: `${base}/claim` },
          { name: "List your clinic" },
        ])}
      />
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/claim" className="hover:text-ink transition-colors">
              Claim
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">List your clinic</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                Add a new listing
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                List your clinic on Zavis.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Tap WhatsApp to add your clinic, hospital, pharmacy, lab, or dental
                practice to the Zavis Directory. We collect your role and licence
                details inside the chat — no forms, no email back-and-forth.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="request_listing_hero"
                  label="List your clinic via WhatsApp"
                />
              </div>
              <p className="mt-3 font-sans text-z-caption text-ink-muted leading-relaxed">
                You will be asked to confirm you are authorised before WhatsApp opens.
              </p>
            </div>
            <div className="lg:col-span-4 rounded-z-md bg-white border border-ink-line p-5">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-accent-deep mt-0.5 flex-shrink-0" />
                <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
                  Listings are cross-referenced against public DHA, DOH, and MOHAP
                  registers before going live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            What we add
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Every kind of healthcare practice.
          </h2>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { Icon: Building2, label: "Hospitals" },
            { Icon: Stethoscope, label: "Clinics" },
            { Icon: Pill, label: "Pharmacies" },
            { Icon: ScanLine, label: "Labs" },
            { Icon: HeartPulse, label: "Dental" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-z-md bg-white border border-ink-line p-5 flex flex-col items-start gap-3"
            >
              <div className="h-10 w-10 rounded-z-sm bg-accent-muted flex items-center justify-center">
                <c.Icon className="h-5 w-5 text-accent-dark" strokeWidth={1.75} />
              </div>
              <p className="font-display font-semibold text-ink text-z-body-sm">
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            What to have ready
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Bring these into the chat.
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Trade licence",
              desc: "Your country and emirate trade licence number for the practice.",
            },
            {
              title: "Regulator licence",
              desc: "DHA, DOH, MOHAP, or equivalent GCC regulator licence number.",
            },
            {
              title: "Google Business link",
              desc: "If your practice has a Google Business Profile, paste the link.",
            },
            {
              title: "Proof of authority",
              desc: "Owner confirmation, business card, or official letterhead.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="flex items-start gap-3 rounded-z-md bg-white border border-ink-line p-5"
            >
              <FileCheck className="h-5 w-5 text-accent-dark mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-display font-semibold text-ink text-z-body-sm">
                  {c.title}
                </p>
                <p className="font-sans text-z-caption text-ink-muted mt-1 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-12">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-3">
                One conversation
              </p>
              <h2 className="font-display font-semibold text-white text-display-lg tracking-[-0.02em] leading-[1.05]">
                List on Zavis. <br />Free forever.
              </h2>
              <p className="font-sans text-white/70 text-z-body mt-4 max-w-lg leading-relaxed">
                No card, no trial, no sales call. Tap WhatsApp, share your licence, and
                your verified listing goes live within 2–3 business days.
              </p>
              <div className="mt-7">
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="request_listing_final_cta"
                  label="List your clinic via WhatsApp"
                />
              </div>
            </div>
            <div className="rounded-z-md bg-white/[0.04] border border-white/10 p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-deep flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-display font-semibold text-white text-z-body-sm">
                    +971 55 531 2595
                  </p>
                  <p className="font-sans text-white/60 text-z-caption mt-1 leading-relaxed">
                    The Zavis claims team replies on this number weekdays. Tap the
                    WhatsApp button to start with your role and clinic prefilled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
