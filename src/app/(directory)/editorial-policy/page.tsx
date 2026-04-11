import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Editorial Policy", url: `${base}/editorial-policy` },
        ])}
      />

      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Editorial Policy" }]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        Editorial Policy
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/45 mb-10 max-w-3xl">
        How Zavis decides what to publish, who reviews it, how we handle
        commercial relationships, and how we correct errors. This policy
        applies to every page on the site — directory listings, doctor
        profiles, the Intelligence editorial layer, reports and the
        machine-readable data we expose.
      </p>

      <div className="max-w-3xl space-y-10">
        {/* Editorial independence */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Editorial independence
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Zavis editorial content is produced independently from any
            commercial operation that Zavis runs. Directory listings are
            never influenced by advertising, sponsorship or business
            development relationships. Provider rankings on hub pages are
            determined by publicly available signals — Google rating
            average and review volume — applied uniformly to every
            facility on the page. The Intelligence editorial team has its
            own editor, its own review process and the standing authority
            to decline coverage that compromises independence. No member
            of the commercial team has approval rights over story
            selection, headline framing, sourcing or timing.
          </p>
        </section>

        {/* Conflict of interest */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Conflicts of interest
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Where Zavis has a commercial relationship with a healthcare
            provider, payer, government entity or vendor that is the
            subject of a Zavis Intelligence article, that relationship is
            disclosed in a clearly labelled note at the top of the
            article. The same disclosure rule applies to investments held
            by Zavis or by Zavis principals. External medical reviewers
            (see <Link href="/intelligence/author" className="text-[#006828] hover:underline">our masthead</Link>)
            are required to disclose any consulting, board or advisory
            relationships with the entities they review. Authors must
            disclose any financial relationship that a reasonable reader
            would consider relevant to the article they are writing — and
            in cases where disclosure is not sufficient to remove the
            conflict, the article is reassigned.
          </p>
        </section>

        {/* Sources and verification */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Sources and verification
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Provider listings are anchored to official emirate-issued
            registers — DHA Sheryan for Dubai, DOH for Abu Dhabi, MOHAP for
            the Northern Emirates. Doctor profiles are anchored to the DHA
            Sheryan professional register. Editorial articles prioritise
            primary sources — DHA circulars, DOH dashboards, federal
            cabinet decisions, regulator press releases, exchange filings,
            peer-reviewed publications, and named on-record interviews —
            over secondary press summaries. Where primary sources are not
            available, we say so. Clinical articles cite their sources in
            a numbered Sources section at the foot of the page (DOIs and
            PubMed IDs where applicable). The full list of every primary
            data source feeding the site is published at{" "}
            <Link href="/data-sources" className="text-[#006828] hover:underline">
              /data-sources
            </Link>
            .
          </p>
        </section>

        {/* Review process */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Review process
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Every Intelligence article passes through a two-editor review
            before publication. Articles classified as clinical or YMYL
            (your money or your life) — anything covering disease, drugs,
            diagnostics, mental health, chronic conditions or
            patient-facing medical decisions — are additionally reviewed
            by a named external clinical or policy reviewer drawn from
            our published reviewer roster. The reviewer&apos;s name,
            credentials and specialty appear on the byline as
            &quot;Medically reviewed by&quot; with a link back to the
            reviewer&apos;s full Zavis profile. Reviewer placeholders
            seeded with no real expert assignment are kept offline until
            a real reviewer has been confirmed; we never publish a
            &quot;Dr. TBD&quot; or anonymous reviewer line.
          </p>
        </section>

        {/* Honest dateModified */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Honest dates and updates
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            An article&apos;s <code>dateModified</code> only moves forward
            when a human re-reads the piece and either confirms it is
            still current or makes substantive edits. We do not bulk
            re-stamp old articles to game search freshness signals — a
            practice common in healthcare content marketing that
            misleads readers about what is current and what is not. The
            <code> lastReviewed</code> date on a clinical article tracks
            the date the named medical reviewer last signed off, and the
            structured-data layer carries it as a separate field from
            <code> dateModified</code> so search engines can reason
            about both honestly.
          </p>
        </section>

        {/* AI-assisted content disclosure */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            AI-assisted content disclosure
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Some Intelligence summaries use AI-assisted summarisation of
            content sourced from official RSS feeds, government press
            releases and verified industry publications. Every
            AI-assisted summary is reviewed for accuracy by a Zavis
            editor before publication and is clearly attributed to its
            original source. The directory listing data itself — facility
            names, addresses, licence numbers, categories — is never
            AI-generated. It comes from the official register only.
          </p>
        </section>

        {/* Use of patient data */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Use of patient data and PDPL compliance
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Zavis operates under the UAE Federal Decree-Law No. 45 of
            2021 on the Protection of Personal Data (PDPL). We do not
            collect, store or publish identifiable patient information.
            Future verified-review intake (described at{" "}
            <Link href="/verified-reviews" className="text-[#006828] hover:underline">
              /verified-reviews
            </Link>
            ) will follow PDPL with explicit, granular consent before any
            messaging is sent, a documented retention window, and a right
            to erasure on request.
          </p>
        </section>

        {/* Corrections */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Corrections
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Email corrections to{" "}
            <a
              href="mailto:corrections@zavis.ai"
              className="text-[#006828] hover:underline"
            >
              corrections@zavis.ai
            </a>
            . We acknowledge every request within two business days,
            verify against primary sources and publish corrections within
            five to seven business days where the change is supported.
            Significant corrections are recorded in the published
            corrections log at{" "}
            <Link href="/about/corrections" className="text-[#006828] hover:underline">
              /about/corrections
            </Link>
            . Inline correction notes are added to affected articles and
            the article&apos;s <code>dateModified</code> moves forward to
            reflect the correction. The full corrections SLA, dispute
            process and escalation path live on the corrections page.
          </p>
        </section>
      </div>
    </div>
  );
}
