import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  speakableSchema,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "Methodology — How We Build the UAE Open Healthcare Directory";
const DESCRIPTION =
  "How Zavis builds and maintains the UAE Open Healthcare Directory. Where the data comes from, how the index is refreshed, how the professionals registry is matched, and how the facet policy engine decides which pages get indexed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/methodology`,
    languages: {
      en: `${getBaseUrl()}/methodology`,
      ar: `${getBaseUrl()}/ar/methodology`,
      "x-default": `${getBaseUrl()}/methodology`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${getBaseUrl()}/methodology`,
  },
};

export default function MethodologyPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/methodology#webpage`,
    url: `${base}/methodology`,
    name: TITLE,
    description: DESCRIPTION,
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
          { name: "Methodology", url: `${base}/methodology` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.18),transparent_70%)]" />
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
            <span className="text-ink font-medium">Methodology</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Trust &amp; standards
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Methodology
          </h1>
          <p className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-4 max-w-2xl leading-relaxed">
            How we build and maintain the UAE Open Healthcare Directory, the
            professionals index, and the curated insurance / specialty / area
            landing pages.
          </p>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Every healthcare facility listed on Zavis is anchored to an
              official emirate-issued register — DHA Sheryan for Dubai, DOH for
              Abu Dhabi, MOHAP for the Northern Emirates. A facility only
              enters the directory if it appears in one of these sources. We do
              not buy facility lists from third parties and we do not generate
              facilities from unverified web scraping. Google Places is used
              only for optional enrichment (rating count, gallery photos,
              opening hours, Maps URI).
            </p>
          </div>
        </div>
      </section>

      {/* Prose body */}
      <article className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-4 mb-4">
            1. Provider records and the source of truth
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Every healthcare facility listed on Zavis is anchored to an
              official emirate-issued register. For Dubai we use the Dubai
              Health Authority licensed-facility list (Sheryan), for Abu Dhabi
              we use the Department of Health (Tamm and the DOH licensee
              dataset), and for the Northern Emirates we use the Ministry of
              Health and Prevention (MOHAP) licensee register. A facility only
              enters the directory if it appears in one of these sources. We
              publish the licence number on the provider page wherever the
              issuing authority allows it. We do not buy facility lists from
              third parties, and we do not generate facilities from Google
              Places — Google Places is used only for optional enrichment
              (rating count, gallery photos, opening hours, the Maps URI).
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            2. Professionals index (DHA Sheryan)
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              The doctor profile pages at <code>/find-a-doctor/</code> are
              backed by the public DHA Sheryan register of licensed medical
              professionals — physicians, dentists, allied-health staff and
              nurses. We ingest the public records, match each professional to
              a primary facility on a soft slug match (we never claim a link
              we can&apos;t verify), and surface the resulting profile. Each
              profile carries the DHA unique ID and licence type (REG / FTL)
              so visitors can cross-check the original register entry. We do
              not publish a doctor photo unless the professional has
              explicitly consented to it; otherwise we use a neutral initials
              avatar generated server-side. We do not invent insurance
              acceptance, languages spoken, or &quot;accepting new
              patients&quot; status — those fields appear on a profile only
              when present in the source dataset.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            3. Refresh schedule and provenance
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              The full provider table is refreshed against the source registers
              on a periodic schedule. Each provider row carries a{" "}
              <code>google_fetched_at</code> timestamp (last enrichment from
              Google Places) and a verification date that surfaces on the
              public profile. Facilities that disappear from the source
              register are flagged for review and removed from the indexable
              sitemap on the next build. We track every refresh in our
              internal change log; when a refresh introduces a structural
              change to provider data, we publish a note in our editorial
              update history.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            4. The facet policy engine
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Healthcare directories that allow every filter combination to
              become an indexable URL collapse under their own crawl budget.
              The Zavis facet policy engine
              (<code>src/lib/seo/facet-rules.ts</code>) defines exactly which
              combinations of city, specialty, insurer, area and language can
              be crawled and indexed. The current allowlist: city + specialty,
              city + insurer, city + insurer + specialty (gated on minimum
              inventory), city + area, city + area + specialty, and city +
              language. Anything outside the allowlist is either not generated
              at all, or generated as a UX-only page with{" "}
              <code>noindex,follow</code>. We treat disciplined crawl budget
              as a load-bearing trust signal, not an optimisation afterthought.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            5. Insurance plan acceptance
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              We do not currently maintain a real-time insurance acceptance
              graph between providers and payers — that requires either an
              agreement with each payer or a verifiable provider-side update
              loop, neither of which exists today. Until that infrastructure
              ships, the insurance pages on Zavis are based on (a) the legacy{" "}
              <code>insurance</code> jsonb column on the providers table (last
              seeded from public network lists) and (b) the geographic gating
              rules in the facet policy engine (Thiqa is never indexed outside
              Abu Dhabi, Daman Enhanced is indexed only when there are at
              least five providers in the city × specialty cell, etc). We do
              not claim a facility accepts a plan we cannot verify.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            6. Ratings and reviews
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis displays the Google Places review count and rating average
              as a reference signal on provider pages, because it is one of
              the few independent quality signals available today. We do not
              currently re-publish full Google review text. Aggregate ratings
              are emitted in JSON-LD only when a provider has at least three
              reviews — below that threshold the structured data is suppressed
              to avoid overstated <code>aggregateRating</code> claims. Our own
              verified review system (QR / SMS-OTP intake) is not yet live;
              the policy page at{" "}
              <Link
                href="/verified-reviews"
                className="text-accent-dark hover:underline font-medium"
              >
                /verified-reviews
              </Link>{" "}
              describes the design and the launch criteria.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            7. Bilingual coverage
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Every directory hub page, provider profile, area page, insurance
              page and Intelligence article has a parallel Arabic mirror at{" "}
              <code>/ar/...</code>. Hreflang alternates link the two locales
              together so search engines can serve the right language to the
              right user. Provider names, address strings and editorial copy
              are translated where the source data allows; machine translation
              is never used as a substitute for human-reviewed Arabic on
              landing pages.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            8. Editorial review and corrections
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Intelligence articles classified as clinical or YMYL are
              reviewed by a named external expert before publication, and the
              reviewer&apos;s name + credentials appear on the byline with a
              link to the reviewer&apos;s{" "}
              <Link
                href="/intelligence/author"
                className="text-accent-dark hover:underline font-medium"
              >
                Zavis profile
              </Link>
              . The article&apos;s <code>dateModified</code> only moves
              forward when a human re-reads the piece — we never rewrite
              timestamps for SEO purposes. To request a correction, see our{" "}
              <Link
                href="/about/corrections"
                className="text-accent-dark hover:underline font-medium"
              >
                corrections policy
              </Link>
              . Read the full editorial standards at{" "}
              <Link
                href="/editorial-policy"
                className="text-accent-dark hover:underline font-medium"
              >
                /editorial-policy
              </Link>
              .
            </p>
          </div>
        </section>
      </article>
    </>
  );
}
