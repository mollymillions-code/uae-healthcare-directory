import { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  Search,
  ShieldCheck,
  FileCheck,
  Rocket,
  BadgeCheck,
  ArrowRight,
  Clock,
  Stethoscope,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { ClaimProviderSearch } from "@/components/claim/ClaimProviderSearch";
import { faqPageSchema, speakableSchema, breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Claim Your Clinic's Listing — UAE Open Healthcare Directory",
  description:
    "Verify your DHA/DOH/MOHAP-licensed clinic, hospital or dental practice in under 2 minutes. Free forever. Update hours, insurance, services, and photos.",
  alternates: {
    canonical: `${getBaseUrl()}/claim`,
  },
  openGraph: {
    title: "Claim Your Healthcare Listing",
    description:
      "Healthcare providers can verify and manage their listing in the UAE Open Healthcare Directory. DHA, DOH, MOHAP supported. Free.",
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
  },
  robots: { index: true, follow: true },
};

const FAQS = [
  {
    question: "Who can claim a listing?",
    answer:
      "Any licensed healthcare facility or practitioner operating in the UAE can claim their listing — hospitals, clinics, pharmacies, labs, and individual doctors. You'll need a valid DHA, DOH, or MOHAP licence number, and proof of affiliation (business card, letterhead, or official email domain).",
  },
  {
    question: "How long does verification take?",
    answer:
      "Most claims are reviewed within 2–3 business days. If your DHA/DOH/MOHAP licence cross-references cleanly with the UAE health authority register, verification can be near-instant. Urgent cases can email claims@zavis.ai for priority review.",
  },
  {
    question: "Is claiming free?",
    answer:
      "Yes. Claiming and maintaining your listing is free forever. No card, no trial, no hidden tier. We built this directory as a public utility — the business model lives elsewhere in Zavis (patient-success software), not in the directory.",
  },
  {
    question: "What can I edit once verified?",
    answer:
      "Contact details, operating hours, phone, website, accepted insurance plans, services offered, and facility photos. All edits go through a lightweight review queue to prevent spam, but claimed listings get fast-tracked.",
  },
  {
    question: "What if I can't find my clinic?",
    answer:
      "Use the request listing form if your clinic is missing. Include your country, city, category, Google Business Profile link, trade licence, regulator licence, and proof that you are authorised to request the listing.",
  },
  {
    question: "Can I remove my listing?",
    answer:
      "Directory listings mirror the public government register, so we can't fully remove a licensed facility. But we can mark it as closed, correct inaccuracies, and suppress contact details on request. Email claims@zavis.ai.",
  },
];

export default function ClaimPage() {
  const base = getBaseUrl();

  const steps = [
    {
      n: "01",
      Icon: Search,
      title: "Find your listing",
      desc: "Search for your clinic, hospital, or pharmacy below. We cover every DHA, DOH, and MOHAP-licensed facility in the UAE.",
    },
    {
      n: "02",
      Icon: ShieldCheck,
      title: "Verify your licence",
      desc: "Upload your DHA/DOH/MOHAP licence, business card, or official letterhead. Most claims are verified within 2–3 business days.",
    },
    {
      n: "03",
      Icon: Rocket,
      title: "Go live",
      desc: "Edit hours, insurance, services, and photos. Changes appear with a verified badge patients trust.",
    },
  ];

  return (
    <>
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Directory", url: `${base}/directory` },
          { name: "Claim your listing" },
        ])}
      />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          {/* Breadcrumb */}
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/directory" className="hover:text-ink transition-colors">
              Directory
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Claim your listing</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                For healthcare providers
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                Claim your clinic&apos;s listing.
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Verify your clinic, hospital, pharmacy, or dental practice in under two
                minutes. Update hours, insurance, services, and photos — free, forever.
                Reach thousands of UAE patients actively searching for the care you provide.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#find-listing"
                  className="inline-flex items-center gap-2 bg-accent-deep hover:bg-ink text-white rounded-z-pill px-5 py-3 font-sans font-semibold text-z-body-sm transition-colors"
                >
                  Start claiming
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 bg-white border border-ink text-ink hover:bg-surface-cream rounded-z-pill px-5 py-3 font-sans font-medium text-z-body-sm transition-colors"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {[
                { n: "2 min", l: "Verify your clinic" },
                { n: "Free", l: "Forever, no card" },
                { n: "12,500+", l: "Patients searching" },
                { n: "24/7", l: "Edit anytime" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white border border-ink-line px-4 py-3"
                >
                  <p className="font-display font-semibold text-ink text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip (DHA / DOH / MOHAP) ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="rounded-z-md bg-white border border-ink-line p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <p className="font-sans text-z-caption font-semibold text-ink-soft uppercase tracking-[0.06em]">
              Verified via
            </p>
            {[
              { label: "DHA", sub: "Dubai Health Authority" },
              { label: "DOH", sub: "Department of Health — Abu Dhabi" },
              { label: "MOHAP", sub: "Ministry of Health & Prevention" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5">
                <BadgeCheck className="h-4 w-4 text-accent-dark flex-shrink-0" />
                <div className="leading-tight">
                  <p className="font-display font-semibold text-ink text-z-body-sm">
                    {r.label}
                  </p>
                  <p className="font-sans text-z-micro text-ink-muted">{r.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section
        id="how-it-works"
        className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20"
      >
        <header className="mb-8">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            How it works
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Three steps. No sales call.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-z-lg bg-white border border-ink-line p-7 hover:shadow-z-card transition-shadow duration-z-base"
            >
              <p className="font-display font-semibold text-accent-dark text-z-h1 leading-none">
                {s.n}
              </p>
              <div className="mt-5 h-11 w-11 rounded-z-md bg-accent-muted flex items-center justify-center">
                <s.Icon className="h-5 w-5 text-accent-dark" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-semibold text-ink text-z-h2 mt-5">
                {s.title}
              </h3>
              <p className="font-sans text-ink-soft text-z-body leading-relaxed mt-2">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Provider lookup form ─── */}
      <section
        id="find-listing"
        className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20"
      >
        <div className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-8 lg:p-10">
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2 inline-flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Step one
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Find your clinic.
            </h2>
            <p className="font-sans text-z-body text-ink-soft mt-2 max-w-2xl leading-relaxed">
              Search by clinic name, address, or licence number. Choose the matching
              provider below to open the claim form for that listing.
            </p>
          </header>

          <ClaimProviderSearch />

          <div className="mt-5 flex items-start gap-2 font-sans text-z-caption text-ink-muted">
            <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <p>
              Can&apos;t find your clinic? Use the request listing form and include your
              licence number, regulator, and proof of authority.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            What you get
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Why clinics claim.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              Icon: BadgeCheck,
              title: "Verified badge",
              desc: "A blue verified mark next to your name — patients filter by it.",
            },
            {
              Icon: FileCheck,
              title: "Edit contact details",
              desc: "Update phone, email, website, and WhatsApp. Changes reflect within the hour.",
            },
            {
              Icon: Clock,
              title: "Operating hours control",
              desc: "Manage weekly hours, holidays, and Ramadan schedule. Shown to patients live.",
            },
            {
              Icon: ShieldCheck,
              title: "Insurance + services editor",
              desc: "Curate the insurance plans you accept and the specialities you practise.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-4 rounded-z-md bg-white border border-ink-line p-6"
            >
              <div className="h-10 w-10 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                <b.Icon className="h-5 w-5 text-accent-dark" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink text-z-h3">
                  {b.title}
                </h3>
                <p className="font-sans text-ink-soft text-z-body-sm mt-1 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AEO answer block ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div
          className="answer-block rounded-z-md bg-white border border-ink-line p-6 sm:p-8 max-w-4xl"
          data-answer-block="true"
        >
          <p className="font-sans text-z-body text-ink-soft leading-[1.75]">
            <span className="font-semibold text-ink">
              To claim a clinic listing in the UAE Open Healthcare Directory,
            </span>{" "}
            a licensed healthcare provider searches for their facility, submits
            verification documents — typically a DHA, DOH, or MOHAP licence plus proof of
            affiliation such as a business card or official letterhead — and waits 2–3
            business days for the Zavis claims team to cross-reference the submission
            against the corresponding government register. Once approved, the listing
            receives a verified badge and the claimant gains edit rights over contact
            details, operating hours, accepted insurance plans, services offered, and
            facility photos. Claiming is free and remains free to maintain.
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            Good to know.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={FAQS} />
        </div>
      </section>

      {/* ─── Final dark CTA banner ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-z-lg bg-gradient-to-br from-[#0a1f13] via-[#102b1b] to-[#0a1f13] p-8 sm:p-12 lg:p-16">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.22),transparent_70%)] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-sans text-z-micro text-accent-light uppercase tracking-[0.04em] mb-3">
                Ready when you are
              </p>
              <h2 className="font-display font-semibold text-white text-display-lg tracking-[-0.02em] leading-[1.05]">
                Two minutes to verify. <br />Free forever.
              </h2>
              <p className="font-sans text-white/70 text-z-body mt-4 max-w-lg leading-relaxed">
                No card, no trial, no sales call. Search for your clinic above, submit
                your licence, and your verified listing goes live.
              </p>
              <a
                href="#find-listing"
                className="mt-7 inline-flex items-center gap-2 rounded-z-pill bg-accent-deep hover:bg-accent-dark text-white font-sans font-semibold text-z-body-sm px-6 py-3.5 transition-colors shadow-[0_8px_24px_-8px_rgba(0,104,40,0.35)]"
              >
                Start claiming
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { n: "2 min", l: "Verify" },
                { n: "Free", l: "Forever" },
                { n: "DHA/DOH", l: "+ MOHAP" },
                { n: "24/7", l: "Self-serve" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white/[0.04] border border-white/10 p-5"
                >
                  <p className="font-display font-semibold text-white text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-white/60 text-z-caption mt-2">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
