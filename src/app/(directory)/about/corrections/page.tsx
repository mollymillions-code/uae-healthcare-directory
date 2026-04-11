import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "Corrections Policy — Zavis Healthcare Industry Insights";
const DESCRIPTION =
  "How to report an error in a Zavis Intelligence article or directory listing, our typical correction SLA, the dispute process, and the public log of recent published corrections.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/about/corrections`,
    languages: {
      en: `${getBaseUrl()}/about/corrections`,
      ar: `${getBaseUrl()}/ar/about/corrections`,
      "x-default": `${getBaseUrl()}/about/corrections`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${getBaseUrl()}/about/corrections`,
  },
};

export default function CorrectionsPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/about/corrections#webpage`,
    url: `${base}/about/corrections`,
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "About", url: `${base}/about` },
          { name: "Corrections Policy", url: `${base}/about/corrections` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Corrections Policy" },
        ]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        Corrections Policy
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/45 mb-10 max-w-3xl">
        We take accuracy seriously. If you find an error in a Zavis
        Intelligence article, a provider listing, a doctor profile or any
        editorial page, we want to know — and we will fix it.
      </p>

      <div className="max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">How to report an error</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            Email{" "}
            <a
              href="mailto:corrections@zavis.ai"
              className="text-[#006828] hover:underline"
            >
              corrections@zavis.ai
            </a>{" "}
            with the URL of the page in question, the specific claim or
            data point you believe is incorrect, and any supporting
            evidence (a primary source, a regulator filing, a screenshot
            of an official register). We acknowledge every correction
            request within two business days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Our service-level commitment</h2>
          <ul className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed space-y-2 list-disc list-outside pl-5">
            <li>
              <strong className="text-[#1c1c1c]">Acknowledgement:</strong>{" "}
              within two business days of receipt.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">Factual error in a directory listing</strong>{" "}
              (wrong address, wrong phone, wrong category, lapsed licence):
              corrected within five business days of verification.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">Factual error in an Intelligence article:</strong>{" "}
              corrected within seven business days. The original article
              receives an inline correction note explaining what changed
              and when. The article&apos;s
              <code> dateModified</code> moves forward to reflect the
              correction.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">Significant factual error</strong>{" "}
              that materially changes a story&apos;s thesis: a separate
              published correction is added to the log below and the
              article is re-reviewed by a second editor.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">Disputed correction</strong>:
              if we cannot confirm the change against a primary source we
              respond with what evidence we would need to act, and we keep
              the request open until it is resolved.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Dispute process</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            If a healthcare provider or individual disagrees with our
            response to a correction request, the request can be escalated
            to the senior editor at{" "}
            <a
              href="mailto:editor@zavis.ai"
              className="text-[#006828] hover:underline"
            >
              editor@zavis.ai
            </a>
            . Escalations are reviewed by a second editor not involved in
            the original decision and we publish a written response within
            ten business days. We do not delete coverage simply because a
            subject objects; we will, however, correct any factual error
            we can verify against a primary source.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Defamation, harassment and personal data
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed">
            All Zavis content is published under UAE law, including the
            Federal Decree-Law No. 45 of 2021 on the Protection of Personal
            Data (PDPL). Requests to remove personal data, requests under
            the right to erasure, or claims that a piece of coverage is
            defamatory should be sent to{" "}
            <a
              href="mailto:legal@zavis.ai"
              className="text-[#006828] hover:underline"
            >
              legal@zavis.ai
            </a>
            . These requests are reviewed by both our editorial and legal
            teams and acknowledged within two business days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            Published corrections log
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/55 leading-relaxed mb-4">
            Significant published corrections are listed below in reverse
            chronological order. Inline corrections on individual articles
            are also visible at the foot of each affected piece.
          </p>
          <div className="border border-black/[0.06] rounded-2xl p-5">
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              The published corrections log is empty as of this page&apos;s
              first publication. Future corrections will be appended here
              with the article URL, a description of what changed and the
              correction date.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
