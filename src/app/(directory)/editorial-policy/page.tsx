import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Editorial Policy | UAE Open Healthcare Directory",
  description:
    "Editorial independence, conflict-of-interest disclosure, review process, accuracy standards, AI disclosure, and corrections policy for the UAE Open Healthcare Directory and Zavis Healthcare Industry Insights.",
  alternates: {
    canonical: `${getBaseUrl()}/editorial-policy`,
    languages: {
      en: `${getBaseUrl()}/editorial-policy`,
      ar: `${getBaseUrl()}/ar/editorial-policy`,
      "x-default": `${getBaseUrl()}/editorial-policy`,
    },
  },
  openGraph: {
    title: "Editorial Policy | UAE Open Healthcare Directory",
    description:
      "Editorial independence, conflict-of-interest disclosure, review process, accuracy standards, AI disclosure, and corrections policy.",
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${getBaseUrl()}/editorial-policy`,
  },
};

const SECTIONS = [
  { id: "editorial-independence", label: "Editorial independence" },
  { id: "conflicts-of-interest", label: "Conflicts of interest" },
  { id: "sources-and-verification", label: "Sources and verification" },
  { id: "review-process", label: "Review process" },
  { id: "honest-dates", label: "Honest dates and updates" },
  { id: "ai-disclosure", label: "AI-assisted content disclosure" },
  { id: "patient-data", label: "Patient data and PDPL" },
  { id: "corrections", label: "Corrections" },
];

export default function EditorialPolicyPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/editorial-policy#webpage`,
    url: `${base}/editorial-policy`,
    name: "Editorial Policy",
    description:
      "Editorial independence, conflict-of-interest disclosure, review process and corrections policy for Zavis.",
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: "UAE Open Healthcare Directory",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis",
      url: base,
    },
  };

  return (
    <>
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Editorial Policy", url: `${base}/editorial-policy` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              UAE
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Editorial Policy</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Trust &amp; standards
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Editorial Policy
          </h1>
          <p className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-4 max-w-2xl leading-relaxed">
            How Zavis decides what to publish, who reviews it, how we handle
            commercial relationships, and how we correct errors. This policy
            applies to every page on the site — directory listings, doctor
            profiles, the Intelligence editorial layer, reports and the
            machine-readable data we expose.
          </p>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Zavis editorial content is produced independently from any
              commercial operation. Directory listings are never influenced
              by advertising or sponsorship. Clinical and YMYL articles are
              reviewed by a named external expert. An article&apos;s{" "}
              <code>dateModified</code> only moves forward when a human
              re-reads the piece. Corrections are acknowledged within two
              business days and published within five to seven.
            </p>
          </div>
        </div>
      </section>

      {/* Body with sticky TOC */}
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,720px)] gap-10 lg:gap-16">
          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.08em] mb-3">
                On this page
              </p>
              <nav className="flex flex-col gap-2">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="font-sans text-z-body-sm text-ink-soft hover:text-accent-dark transition-colors"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="max-w-[720px]">
            <section id="editorial-independence" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-4 mb-4">
                Editorial independence
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Zavis editorial content is produced independently from any
                  commercial operation that Zavis runs. Directory listings
                  are never influenced by advertising, sponsorship or
                  business development relationships. Provider rankings on
                  hub pages are determined by publicly available signals —
                  Google rating average and review volume — applied
                  uniformly to every facility on the page. The Intelligence
                  editorial team has its own editor, its own review process
                  and the standing authority to decline coverage that
                  compromises independence. No member of the commercial
                  team has approval rights over story selection, headline
                  framing, sourcing or timing.
                </p>
              </div>
            </section>

            <section id="conflicts-of-interest" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Conflicts of interest
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Where Zavis has a commercial relationship with a
                  healthcare provider, payer, government entity or vendor
                  that is the subject of a Zavis Intelligence article, that
                  relationship is disclosed in a clearly labelled note at
                  the top of the article. The same disclosure rule applies
                  to investments held by Zavis or by Zavis principals.
                  External medical reviewers (see{" "}
                  <Link
                    href="/intelligence/author"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    our masthead
                  </Link>
                  ) are required to disclose any consulting, board or
                  advisory relationships with the entities they review.
                  Authors must disclose any financial relationship that a
                  reasonable reader would consider relevant to the article
                  they are writing — and in cases where disclosure is not
                  sufficient to remove the conflict, the article is
                  reassigned.
                </p>
              </div>
            </section>

            <section id="sources-and-verification" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Sources and verification
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Provider listings are anchored to official emirate-issued
                  registers — DHA Sheryan for Dubai, DOH for Abu Dhabi,
                  MOHAP for the Northern Emirates. Doctor profiles are
                  anchored to the DHA Sheryan professional register.
                  Editorial articles prioritise primary sources — DHA
                  circulars, DOH dashboards, federal cabinet decisions,
                  regulator press releases, exchange filings, peer-reviewed
                  publications, and named on-record interviews — over
                  secondary press summaries. Where primary sources are not
                  available, we say so. Clinical articles cite their
                  sources in a numbered Sources section at the foot of the
                  page (DOIs and PubMed IDs where applicable). The full
                  list of every primary data source feeding the site is
                  published at{" "}
                  <Link
                    href="/data-sources"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    /data-sources
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section id="review-process" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Review process
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Every Intelligence article passes through a two-editor
                  review before publication. Articles classified as clinical
                  or YMYL (your money or your life) — anything covering
                  disease, drugs, diagnostics, mental health, chronic
                  conditions or patient-facing medical decisions — are
                  additionally reviewed by a named external clinical or
                  policy reviewer drawn from our published reviewer roster.
                  The reviewer&apos;s name, credentials and specialty
                  appear on the byline as &quot;Medically reviewed by&quot;
                  with a link back to the reviewer&apos;s full Zavis
                  profile. Reviewer placeholders seeded with no real expert
                  assignment are kept offline until a real reviewer has
                  been confirmed; we never publish a &quot;Dr. TBD&quot;
                  or anonymous reviewer line.
                </p>
              </div>
            </section>

            <section id="honest-dates" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Honest dates and updates
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  An article&apos;s <code>dateModified</code> only moves
                  forward when a human re-reads the piece and either
                  confirms it is still current or makes substantive edits.
                  We do not bulk re-stamp old articles to game search
                  freshness signals — a practice common in healthcare
                  content marketing that misleads readers about what is
                  current and what is not. The <code>lastReviewed</code>{" "}
                  date on a clinical article tracks the date the named
                  medical reviewer last signed off, and the structured-data
                  layer carries it as a separate field from{" "}
                  <code>dateModified</code> so search engines can reason
                  about both honestly.
                </p>
              </div>
            </section>

            <section id="ai-disclosure" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                AI-assisted content disclosure
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Some Intelligence summaries use AI-assisted summarisation
                  of content sourced from official RSS feeds, government
                  press releases and verified industry publications. Every
                  AI-assisted summary is reviewed for accuracy by a Zavis
                  editor before publication and is clearly attributed to
                  its original source. The directory listing data itself —
                  facility names, addresses, licence numbers, categories —
                  is never AI-generated. It comes from the official
                  register only.
                </p>
              </div>
            </section>

            <section id="patient-data" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Use of patient data and PDPL compliance
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Zavis operates under the UAE Federal Decree-Law No. 45 of
                  2021 on the Protection of Personal Data (PDPL). We do
                  not collect, store or publish identifiable patient
                  information. Future verified-review intake (described at{" "}
                  <Link
                    href="/verified-reviews"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    /verified-reviews
                  </Link>
                  ) will follow PDPL with explicit, granular consent before
                  any messaging is sent, a documented retention window, and
                  a right to erasure on request.
                </p>
              </div>
            </section>

            <section id="corrections" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Corrections
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Email corrections to{" "}
                  <a
                    href="mailto:corrections@zavis.ai"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    corrections@zavis.ai
                  </a>
                  . We acknowledge every request within two business days,
                  verify against primary sources and publish corrections
                  within five to seven business days where the change is
                  supported. Significant corrections are recorded in the
                  published corrections log at{" "}
                  <Link
                    href="/about/corrections"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    /about/corrections
                  </Link>
                  . Inline correction notes are added to affected articles
                  and the article&apos;s <code>dateModified</code> moves
                  forward to reflect the correction. The full corrections
                  SLA, dispute process and escalation path live on the
                  corrections page.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </>
  );
}
