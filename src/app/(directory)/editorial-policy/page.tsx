import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Editorial Policy | UAE Open Healthcare Directory",
  description:
    "Learn about the data sources, verification process, editorial independence, and update schedule behind the UAE Open Healthcare Directory.",
  alternates: {
    canonical: `${getBaseUrl()}/editorial-policy`,
  },
  openGraph: {
    title: 'Editorial Policy | UAE Open Healthcare Directory',
    description: 'Learn about the data sources, verification process, editorial independence, and update schedule behind the UAE Open Healthcare Directory.',
    type: 'website',
    locale: 'en_AE',
    siteName: 'UAE Open Healthcare Directory',
  },
};

export default function EditorialPolicyPage() {
  const base = getBaseUrl();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Editorial Policy", url: `${base}/editorial-policy` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Editorial Policy" },
        ]}
      />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-8">Editorial Policy</h1>

      <div className="max-w-3xl space-y-10">
        {/* Data Sources */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Data Sources</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            All healthcare provider listings in the UAE Open Healthcare Directory are sourced from
            official government licensed facility registers maintained by the Dubai Health
            Authority (DHA), the Department of Health Abu Dhabi (DOH), and the Ministry of
            Health and Prevention (MOHAP). Provider ratings and review counts are obtained
            from Google Places to reflect real patient feedback. We do not fabricate or
            estimate any data points.
          </p>
        </section>

        {/* Editorial Independence */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Editorial Independence</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            The UAE Open Healthcare Directory editorial content is produced independently from
            any commercial operations. Listings are not influenced by advertising
            relationships or sponsorship arrangements. Provider rankings are determined
            solely by publicly available Google ratings and review volume. Our intelligence
            coverage follows the same principle — editorial decisions are made independently
            of business considerations.
          </p>
        </section>

        {/* Verification */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Verification</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            Every listing in the directory is verified against official government health
            authority registers. Each provider page displays the date the listing was last
            verified. Facilities that can no longer be confirmed in government registers are
            flagged or removed. Healthcare providers can claim their listing and submit
            updates, which are reviewed against official records before publication.
          </p>
        </section>

        {/* AI-Assisted Content */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">AI-Assisted Content</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            Some news summaries published in the Zavis Healthcare Industry Insights section use
            AI-assisted summarization of content sourced from official RSS feeds,
            government press releases, and verified industry publications. All AI-generated
            summaries are reviewed for accuracy and clearly attributed to their original
            sources. The directory listing data itself is never AI-generated — it comes
            directly from government registers.
          </p>
        </section>

        {/* Corrections */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Corrections</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            We are committed to accuracy. If you find inaccurate information in any listing
            or article, please contact us at{" "}
            <a
              href="mailto:corrections@zavis.ai"
              className="text-[#006828] hover:underline"
            >
              corrections@zavis.ai
            </a>
            . We investigate all reports and issue corrections promptly. Corrected listings
            are updated with a new verification date.
          </p>
        </section>

        {/* Update Schedule */}
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">Update Schedule</h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
            The directory is refreshed periodically from official government health
            authority sources. Google ratings and review counts are updated on a rolling
            basis. The most recent full data refresh was completed in March 2026. Intelligence
            articles are published on an ongoing basis as new developments emerge in the UAE
            healthcare sector.
          </p>
        </section>
      </div>
    </div>
  );
}
