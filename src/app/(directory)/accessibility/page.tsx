import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  speakableSchema,
  truncateDescription,
  truncateTitle,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const baseUrl = getBaseUrl();

/* ─── Metadata ─────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: truncateTitle("Accessibility Statement", 58),
  description: truncateDescription(
    "Zavis's accessibility statement — WCAG 2.1 AA commitment, known limitations, how to report a barrier, UAE Federal Law compliance.",
    155,
  ),
  alternates: {
    canonical: `${baseUrl}/accessibility`,
    languages: {
      en: `${baseUrl}/accessibility`,
      "ar-AE": `${baseUrl}/ar/accessibility`,
      "x-default": `${baseUrl}/accessibility`,
    },
  },
  openGraph: {
    title: "Accessibility Statement — Zavis",
    description:
      "How Zavis meets WCAG 2.1 AA, what's in scope, known limitations, and how to report accessibility barriers.",
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${baseUrl}/accessibility`,
  },
  twitter: {
    card: "summary",
    title: "Zavis Accessibility Statement",
    description:
      "WCAG 2.1 AA commitment, known limitations, and how to report barriers.",
  },
};

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function AccessibilityPage() {
  const canonical = `${baseUrl}/accessibility`;
  const lastUpdated = "2026-04-11";

  const webPageNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: "Accessibility Statement",
    description:
      "Zavis's public accessibility statement aligned with WCAG 2.1 AA and UAE Federal Law No. (29) of 2006 (as amended in 2020) on the Rights of Persons of Determination.",
    inLanguage: "en-AE",
    isPartOf: {
      "@type": "WebSite",
      name: "UAE Open Healthcare Directory",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: "Zavis",
      url: baseUrl,
    },
    datePublished: "2026-04-11",
    dateModified: lastUpdated,
  };

  const breadcrumbNode = breadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "About", url: `${baseUrl}/about` },
    { name: "Accessibility", url: canonical },
  ]);

  const organizationNode = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Zavis",
    url: baseUrl,
    email: "accessibility@zavis.ai",
    sameAs: [canonical],
  };

  return (
    <>
      <JsonLd data={webPageNode} />
      <JsonLd data={breadcrumbNode} />
      <JsonLd data={organizationNode} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              UAE
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/about" className="hover:text-ink transition-colors">
              About
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Accessibility</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Zavis trust &amp; standards
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Accessibility Statement
          </h1>
          <p className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-4 max-w-2xl leading-relaxed">
            Zavis is committed to making the UAE&apos;s open healthcare
            directory and the Zavis intelligence archive usable by everyone —
            including people who use screen readers, keyboard navigation,
            magnification, voice control, or any other assistive technology.
            This page explains what we do, what we still need to fix, and how
            to tell us when something isn&apos;t working for you.
          </p>
          <p className="font-sans text-z-caption text-ink-muted mt-4">
            Last updated: {lastUpdated}
          </p>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Zavis targets WCAG 2.1 Level AA across every route we own and
              is partially conformant today. We publish our known gaps,
              provide text alternatives for third-party embeds, and triage
              critical accessibility blockers within one business day. Report
              barriers to{" "}
              <a
                href="mailto:accessibility@zavis.ai"
                className="text-accent-dark hover:underline font-medium"
              >
                accessibility@zavis.ai
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Prose body */}
      <article className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-4 mb-4">
            Our commitment
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis aims to meet the{" "}
              <a
                href="https://www.w3.org/TR/WCAG21/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-dark hover:underline font-medium"
              >
                Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA
              </a>{" "}
              across every route we own. We target AA, not AAA — AAA imposes
              costs (such as mandatory sign-language video for every media
              asset) that are incompatible with a free public directory of
              12,500+ providers, and the W3C itself does not recommend AAA as
              a general target for entire websites. AA is the level referenced
              by most global regulators, including the guidance issued by the
              UAE&apos;s Telecommunications and Digital Government Regulatory
              Authority (TDRA).
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Scope
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              This statement covers all pages under <code>zavis.ai</code> that
              Zavis directly controls, including the healthcare directory
              (<code>/directory/*</code>, <code>/find-a-doctor/*</code>,{" "}
              <code>/insurance/*</code>), the Zavis Intelligence archive (
              <code>/intelligence/*</code>), the search experience (
              <code>/search</code>), the bilingual Arabic mirror (
              <code>/ar/*</code>), and the GCC country directories (
              <code>/sa</code>, <code>/qa</code>, <code>/bh</code>,{" "}
              <code>/kw</code>). It also covers the marketing pages under the
              root route group (<code>/</code>, <code>/about</code>,{" "}
              <code>/pricing</code>, <code>/book-a-demo</code>).
            </p>
            <p>
              Third-party embeds — Google Maps, Google Tag Manager, Microsoft
              Clarity, LinkedIn Insight, Meta Pixel, and any social media
              embeds inside intelligence articles — are out of scope. See
              &ldquo;Third-party content&rdquo; below.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Known limitations
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              We publish our known gaps here, rather than quietly hoping you
              don&apos;t notice them, because honesty about the current state
              is more useful than a vague claim of full compliance. Current
              known issues:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="font-semibold text-ink">
                  Legacy <code>&lt;img&gt;</code> tags on marketing pages.
                </strong>{" "}
                A handful of decorative images on the landing pages still use
                native <code>&lt;img&gt;</code> instead of Next.js{" "}
                <code>next/image</code>. Alt text is in place, but the
                migration to <code>next/image</code> is in progress.
              </li>
              <li>
                <strong className="font-semibold text-ink">
                  Google Maps iframe
                </strong>{" "}
                on provider profiles is supplied by a third party. It ships
                with its own keyboard handlers and screen reader semantics
                which Zavis does not control. A text-based address, phone,
                and directions link always sits next to the map as an
                equivalent alternative.
              </li>
              <li>
                <strong className="font-semibold text-ink">
                  Animated sections on the marketing pages
                </strong>{" "}
                use GSAP for entrance animations. These animations respect
                the <code>prefers-reduced-motion</code> media query and are
                purely decorative; no information is conveyed by animation
                alone.
              </li>
              <li>
                <strong className="font-semibold text-ink">
                  Some legacy directory routes with client-side pagination.
                </strong>{" "}
                The main directory routes were migrated to server-side
                pagination in April 2026 (Zocdoc roadmap Item 0.5), but a
                small number of legacy &ldquo;top rated&rdquo; routes still
                hydrate their list client-side. Keyboard users can still
                page through them, and the migration is tracked as a known
                item.
              </li>
              <li>
                <strong className="font-semibold text-ink">
                  PDF research reports
                </strong>{" "}
                published under <code>/intelligence/reports</code> are not
                always tagged PDFs. An HTML summary accompanies every report
                as an accessible equivalent.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            How to report an issue
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              If you hit an accessibility barrier — anything from a missing
              label on a form field, to a color contrast problem, to a screen
              reader reading something nonsensical — please email{" "}
              <a
                href="mailto:accessibility@zavis.ai"
                className="text-accent-dark hover:underline font-medium"
              >
                accessibility@zavis.ai
              </a>
              . Please include the URL, the browser and assistive technology
              you were using (for example &ldquo;Safari 17 with VoiceOver on
              macOS&rdquo;), and a short description of what went wrong. We
              aim to acknowledge every report within 3 business days and to
              propose a remediation plan within 10 business days. Critical
              blockers — pages that cannot be used at all by a given
              assistive technology — are triaged within one business day.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Compliance status
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis is <em>partially conformant</em> with WCAG 2.1 Level AA.
              &ldquo;Partially conformant&rdquo; means the majority of the
              site conforms to AA, but some parts of the content — principally
              the third-party embeds and the legacy items listed above — do
              not yet fully conform. We do not claim Level AAA conformance,
              and we do not claim Level A because A is a strict subset of AA.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            UAE Federal Law reference
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              The United Arab Emirates recognises digital accessibility as a
              civil right. Zavis aligns with{" "}
              <strong className="font-semibold text-ink">
                UAE Federal Law No. (29) of 2006 concerning the Rights of
                People with Special Needs
              </strong>{" "}
              (as amended by Federal Law No. (14) of 2009 and Federal Decree
              Law of 2020 renaming the protected class &ldquo;People of
              Determination&rdquo;), which guarantees access to public
              information and services on an equal basis. We also reference
              the digital accessibility guidance issued by the UAE
              Telecommunications and Digital Government Regulatory Authority
              (TDRA), which in practice asks public-facing digital services
              to conform to WCAG 2.1 AA and to publish an accessibility
              statement. This page is that statement.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Third-party content disclaimer
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis embeds third-party content in two places: Google Maps on
              provider profiles and the occasional social media embed
              (X/Twitter, Instagram, YouTube) inside intelligence articles.
              Zavis does not control the accessibility of those third
              parties. We always provide a text alternative — the full
              address and phone number next to the map, and a transcript or
              summary next to the social embed — so that every primary piece
              of information on a Zavis page can be reached without ever
              interacting with the third-party widget.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Testing methodology
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis pages are audited against WCAG 2.1 AA using a combination
              of automated tooling (
              <a
                href="https://github.com/dequelabs/axe-core"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-dark hover:underline font-medium"
              >
                axe-core
              </a>{" "}
              and Lighthouse accessibility audits) and manual checks:
              keyboard-only navigation through every interactive component,
              screen reader smoke tests with VoiceOver on macOS and NVDA on
              Windows, and contrast verification against our brand tokens. We
              do not rely on automated tools alone — automation catches
              roughly 30–40% of real accessibility defects, and the remaining
              issues require a human in the loop.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Technologies that must be enabled
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              Zavis is built as a modern web application and relies on the
              following to be fully functional: HTML5, CSS3, WAI-ARIA, SVG,
              and JavaScript. JavaScript must be enabled for search,
              pagination, and the interactive filters on directory pages.
              Cookies are used for consent, analytics, and — once the Zavis
              member account system launches — session management.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
            Feedback beyond accessibility
          </h2>
          <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
            <p>
              If your issue is not strictly about accessibility but still
              about how Zavis presents provider information — for example a
              factual error on a clinic&apos;s listing, a missing
              translation, or a data source question — you can also reach us
              at{" "}
              <a
                href="mailto:hello@zavis.ai"
                className="text-accent-dark hover:underline font-medium"
              >
                hello@zavis.ai
              </a>
              . For general trust and editorial questions, see our{" "}
              <Link
                href="/editorial-policy"
                className="text-accent-dark hover:underline font-medium"
              >
                editorial policy
              </Link>
              .
            </p>
          </div>
        </section>
      </article>
    </>
  );
}
