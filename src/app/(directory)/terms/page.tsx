import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Terms of Service | UAE Open Healthcare Directory",
  description:
    "Terms of Service for the UAE Open Healthcare Directory. Understand how directory data is provided, user conduct expectations, and governing law.",
  alternates: {
    canonical: `${getBaseUrl()}/terms`,
  },
};

const SECTIONS = [
  { id: "acceptance", label: "Acceptance" },
  { id: "directory-data", label: "Directory Data" },
  { id: "no-medical-advice", label: "No Medical Advice" },
  { id: "listing-claims", label: "Listing Claims" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "user-conduct", label: "User Conduct" },
  { id: "limitation-of-liability", label: "Limitation of Liability" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
  { id: "changes", label: "Changes to These Terms" },
];

export default function TermsOfServicePage() {
  const base = getBaseUrl();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Terms of Service", url: `${base}/terms` },
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
            <span className="text-ink font-medium">Terms of Service</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Legal
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Terms of Service
          </h1>
          <p className="font-sans text-ink-muted text-z-caption mt-4">
            Effective March 2026
          </p>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              By accessing the UAE Open Healthcare Directory, you agree to
              these terms. Directory data is sourced from DHA, DOH and MOHAP
              public registers and is provided &quot;as is.&quot; The
              directory is an information resource, not a medical service.
              Commercial scraping or redistribution is prohibited; personal
              non-commercial use is free. These terms are governed by the
              laws of the United Arab Emirates.
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
            <section id="acceptance" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-4 mb-4">
                Acceptance
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  By accessing or using the UAE Open Healthcare Directory,
                  you agree to be bound by these Terms of Service. If you do
                  not agree to these terms, please do not use the directory.
                </p>
              </div>
            </section>

            <section id="directory-data" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Directory Data
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Provider listings in the UAE Open Healthcare Directory are
                  sourced from official government registers maintained by
                  the Dubai Health Authority (DHA), the Department of
                  Health Abu Dhabi (DOH), and the Ministry of Health and
                  Prevention (MOHAP). All data is provided &ldquo;as
                  is.&rdquo; We verify data regularly but cannot guarantee
                  real-time accuracy. Always confirm details directly with
                  healthcare providers before making decisions.
                </p>
              </div>
            </section>

            <section id="no-medical-advice" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                No Medical Advice
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  This directory is an information resource, not a medical
                  service. It does not provide medical advice, diagnosis, or
                  treatment recommendations. The inclusion of a healthcare
                  provider in the directory does not constitute an
                  endorsement. Always consult a qualified healthcare
                  professional for medical decisions.
                </p>
              </div>
            </section>

            <section id="listing-claims" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Listing Claims
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Healthcare providers may claim their listings through the
                  directory. Zavis reserves the right to verify all claims
                  against official government registers and to reject
                  fraudulent or unsubstantiated submissions. Claimed
                  listings may be updated with additional provider-supplied
                  information, subject to verification.
                </p>
              </div>
            </section>

            <section id="intellectual-property" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Intellectual Property
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  The directory data structure, design, editorial content,
                  and all associated branding are owned by Zavis. Provider
                  information sourced from official government public
                  registers remains in the public domain. Our original
                  editorial content, including healthcare industry insights
                  and analysis, is protected by copyright.
                </p>
              </div>
            </section>

            <section id="user-conduct" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                User Conduct
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  You may not scrape, republish, or commercially redistribute
                  directory data without prior written permission from
                  Zavis. Automated access to the directory for commercial
                  purposes is prohibited. Personal, non-commercial use of
                  the directory for finding healthcare providers is
                  encouraged and free of charge.
                </p>
              </div>
            </section>

            <section id="limitation-of-liability" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Limitation of Liability
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  Zavis is not liable for any decisions made based on
                  directory information. Always verify provider credentials,
                  insurance acceptance, and availability directly with
                  healthcare providers. To the maximum extent permitted by
                  law, Zavis disclaims all warranties, express or implied,
                  regarding the accuracy, completeness, or reliability of
                  directory data.
                </p>
              </div>
            </section>

            <section id="governing-law" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Governing Law
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  These Terms of Service are governed by and construed in
                  accordance with the laws of the United Arab Emirates. Any
                  disputes arising from or related to the use of this
                  directory shall be subject to the exclusive jurisdiction
                  of the courts of the United Arab Emirates.
                </p>
              </div>
            </section>

            <section id="contact" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Contact
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  For questions about these Terms of Service, please contact
                  us at{" "}
                  <a
                    href="mailto:legal@zavis.ai"
                    className="text-accent-dark hover:underline font-medium"
                  >
                    legal@zavis.ai
                  </a>
                  .
                </p>
              </div>
            </section>

            <section id="changes" className="mb-10 scroll-mt-24">
              <h2 className="font-display font-semibold text-ink text-z-h1 mt-12 mb-4">
                Changes to These Terms
              </h2>
              <div className="font-sans text-z-body text-ink-soft leading-relaxed space-y-4">
                <p>
                  We may update these Terms of Service from time to time.
                  Any changes will be posted on this page with a revised
                  effective date. Continued use of the directory after
                  changes are posted constitutes acceptance of the updated
                  terms. Last updated March 2026.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </>
  );
}
