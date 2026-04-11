import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
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

      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Accessibility", href: "/accessibility" },
          ]}
        />

        <header className="mb-10 border-b border-black/[0.08] pb-6">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-wider text-accent mb-3">
            Zavis Trust &amp; Standards
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[34px] sm:text-[42px] leading-[1.1] tracking-[-0.02em] text-dark mb-4">
            Accessibility Statement
          </h1>
          <p className="font-['Geist',sans-serif] text-base text-dark/60 leading-relaxed">
            Zavis is committed to making the UAE&apos;s open healthcare directory
            and the Zavis intelligence archive usable by everyone &mdash; including
            people who use screen readers, keyboard navigation, magnification,
            voice control, or any other assistive technology. This page explains
            what we do, what we still need to fix, and how to tell us when
            something isn&apos;t working for you.
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-dark/40 mt-4">
            Last updated: {lastUpdated}
          </p>
        </header>

        <article className="prose-journal max-w-none">
          <h2>Our commitment</h2>
          <p>
            Zavis aims to meet the{" "}
            <a
              href="https://www.w3.org/TR/WCAG21/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA
            </a>{" "}
            across every route we own. We target AA, not AAA &mdash; AAA imposes
            costs (such as mandatory sign-language video for every media asset)
            that are incompatible with a free public directory of 12,500+
            providers, and the W3C itself does not recommend AAA as a general
            target for entire websites. AA is the level referenced by most
            global regulators, including the guidance issued by the UAE&apos;s
            Telecommunications and Digital Government Regulatory Authority
            (TDRA).
          </p>

          <h2>Scope</h2>
          <p>
            This statement covers all pages under <code>zavis.ai</code> that
            Zavis directly controls, including the healthcare directory
            (<code>/directory/*</code>, <code>/find-a-doctor/*</code>,{" "}
            <code>/insurance/*</code>), the Zavis Intelligence archive (
            <code>/intelligence/*</code>), the search experience (
            <code>/search</code>), the bilingual Arabic mirror (<code>/ar/*</code>
            ), and the GCC country directories (<code>/sa</code>,{" "}
            <code>/qa</code>, <code>/bh</code>, <code>/kw</code>). It also
            covers the marketing pages under the root route group (
            <code>/</code>, <code>/about</code>, <code>/pricing</code>,{" "}
            <code>/book-a-demo</code>).
          </p>
          <p>
            Third-party embeds &mdash; Google Maps, Google Tag Manager,
            Microsoft Clarity, LinkedIn Insight, Meta Pixel, and any social
            media embeds inside intelligence articles &mdash; are out of scope.
            See &ldquo;Third-party content&rdquo; below.
          </p>

          <h2>Known limitations</h2>
          <p>
            We publish our known gaps here, rather than quietly hoping you
            don&apos;t notice them, because honesty about the current state is
            more useful than a vague claim of full compliance. Current known
            issues:
          </p>
          <ul>
            <li>
              <strong>Legacy <code>&lt;img&gt;</code> tags on marketing pages.</strong>{" "}
              A handful of decorative images on the landing pages still use
              native <code>&lt;img&gt;</code> instead of Next.js{" "}
              <code>next/image</code>. Alt text is in place, but the migration
              to <code>next/image</code> is in progress.
            </li>
            <li>
              <strong>Google Maps iframe</strong> on provider profiles is
              supplied by a third party. It ships with its own keyboard
              handlers and screen reader semantics which Zavis does not
              control. A text-based address, phone, and directions link always
              sits next to the map as an equivalent alternative.
            </li>
            <li>
              <strong>Animated sections on the marketing pages</strong> use
              GSAP for entrance animations. These animations respect the{" "}
              <code>prefers-reduced-motion</code> media query and are purely
              decorative; no information is conveyed by animation alone.
            </li>
            <li>
              <strong>Some legacy directory routes with client-side pagination.</strong>{" "}
              The main directory routes were migrated to server-side
              pagination in April 2026 (Zocdoc roadmap Item 0.5), but a small
              number of legacy &ldquo;top rated&rdquo; routes still hydrate
              their list client-side. Keyboard users can still page through
              them, and the migration is tracked as a known item.
            </li>
            <li>
              <strong>PDF research reports</strong> published under{" "}
              <code>/intelligence/reports</code> are not always tagged PDFs.
              An HTML summary accompanies every report as an accessible
              equivalent.
            </li>
          </ul>

          <h2>How to report an issue</h2>
          <p>
            If you hit an accessibility barrier &mdash; anything from a missing
            label on a form field, to a color contrast problem, to a screen
            reader reading something nonsensical &mdash; please email{" "}
            <a
              href="mailto:accessibility@zavis.ai"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              accessibility@zavis.ai
            </a>
            . Please include the URL, the browser and assistive technology you
            were using (for example &ldquo;Safari 17 with VoiceOver on
            macOS&rdquo;), and a short description of what went wrong. We aim
            to acknowledge every report within 3 business days and to
            propose a remediation plan within 10 business days. Critical
            blockers &mdash; pages that cannot be used at all by a given
            assistive technology &mdash; are triaged within one business day.
          </p>

          <h2>Compliance status</h2>
          <p>
            Zavis is <em>partially conformant</em> with WCAG 2.1 Level AA.
            &ldquo;Partially conformant&rdquo; means the majority of the site
            conforms to AA, but some parts of the content &mdash; principally
            the third-party embeds and the legacy items listed above &mdash;
            do not yet fully conform. We do not claim Level AAA conformance,
            and we do not claim Level A because A is a strict subset of AA.
          </p>

          <h2>UAE Federal Law reference</h2>
          <p>
            The United Arab Emirates recognises digital accessibility as a
            civil right. Zavis aligns with{" "}
            <strong>
              UAE Federal Law No. (29) of 2006 concerning the Rights of People
              with Special Needs
            </strong>{" "}
            (as amended by Federal Law No. (14) of 2009 and Federal Decree Law
            of 2020 renaming the protected class &ldquo;People of
            Determination&rdquo;), which guarantees access to public
            information and services on an equal basis. We also reference the
            digital accessibility guidance issued by the UAE Telecommunications
            and Digital Government Regulatory Authority (TDRA), which in
            practice asks public-facing digital services to conform to WCAG
            2.1 AA and to publish an accessibility statement. This page is
            that statement.
          </p>

          <h2>Third-party content disclaimer</h2>
          <p>
            Zavis embeds third-party content in two places: Google Maps on
            provider profiles and the occasional social media embed (X/Twitter,
            Instagram, YouTube) inside intelligence articles. Zavis does not
            control the accessibility of those third parties. We always provide
            a text alternative &mdash; the full address and phone number next
            to the map, and a transcript or summary next to the social embed
            &mdash; so that every primary piece of information on a Zavis page
            can be reached without ever interacting with the third-party
            widget.
          </p>

          <h2>Testing methodology</h2>
          <p>
            Zavis pages are audited against WCAG 2.1 AA using a combination of
            automated tooling (
            <a
              href="https://github.com/dequelabs/axe-core"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              axe-core
            </a>{" "}
            and Lighthouse accessibility audits) and manual checks: keyboard-only
            navigation through every interactive component, screen reader
            smoke tests with VoiceOver on macOS and NVDA on Windows, and
            contrast verification against our brand tokens. We do not rely on
            automated tools alone &mdash; automation catches roughly 30&ndash;40%
            of real accessibility defects, and the remaining issues require
            a human in the loop.
          </p>

          <h2>Technologies that must be enabled</h2>
          <p>
            Zavis is built as a modern web application and relies on the
            following to be fully functional: HTML5, CSS3, WAI-ARIA, SVG, and
            JavaScript. JavaScript must be enabled for search, pagination, and
            the interactive filters on directory pages. Cookies are used for
            consent, analytics, and &mdash; once the Zavis member account
            system launches &mdash; session management.
          </p>

          <h2>Feedback beyond accessibility</h2>
          <p>
            If your issue is not strictly about accessibility but still about
            how Zavis presents provider information &mdash; for example a
            factual error on a clinic&apos;s listing, a missing translation, or
            a data source question &mdash; you can also reach us at{" "}
            <a
              href="mailto:hello@zavis.ai"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              hello@zavis.ai
            </a>
            . For general trust and editorial questions, see our{" "}
            <Link
              href="/editorial-policy"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              editorial policy
            </Link>
            .
          </p>
        </article>
      </div>
    </>
  );
}
