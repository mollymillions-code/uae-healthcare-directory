import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Terms of Service | UAE Open Healthcare Directory",
  description:
    "Terms of Service for the UAE Open Healthcare Directory. Understand how directory data is provided, user conduct expectations, and governing law.",
  alternates: {
    canonical: `${getBaseUrl()}/terms`,
  },
};

export default function TermsOfServicePage() {
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8 pb-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Terms of Service", url: `${base}/terms` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Terms of Service" },
        ]}
      />

      <h1 className="text-3xl font-bold text-dark mb-2">Terms of Service</h1>
      <p className="text-sm text-muted mb-8">Effective March 2026</p>

      <div className="max-w-3xl space-y-10">
        {/* Acceptance */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Acceptance</h2>
          <p className="text-sm text-muted leading-relaxed">
            By accessing or using the UAE Open Healthcare Directory, you agree to be bound
            by these Terms of Service. If you do not agree to these terms, please do not
            use the directory.
          </p>
        </section>

        {/* Directory Data */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Directory Data</h2>
          <p className="text-sm text-muted leading-relaxed">
            Provider listings in the UAE Open Healthcare Directory are sourced from
            official government registers maintained by the Dubai Health Authority (DHA),
            the Department of Health Abu Dhabi (DOH), and the Ministry of Health and
            Prevention (MOHAP). All data is provided &ldquo;as is.&rdquo; We verify data
            regularly but cannot guarantee real-time accuracy. Always confirm details
            directly with healthcare providers before making decisions.
          </p>
        </section>

        {/* No Medical Advice */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">No Medical Advice</h2>
          <p className="text-sm text-muted leading-relaxed">
            This directory is an information resource, not a medical service. It does not
            provide medical advice, diagnosis, or treatment recommendations. The inclusion
            of a healthcare provider in the directory does not constitute an endorsement.
            Always consult a qualified healthcare professional for medical decisions.
          </p>
        </section>

        {/* Listing Claims */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Listing Claims</h2>
          <p className="text-sm text-muted leading-relaxed">
            Healthcare providers may claim their listings through the directory. Zavis
            reserves the right to verify all claims against official government registers
            and to reject fraudulent or unsubstantiated submissions. Claimed listings may
            be updated with additional provider-supplied information, subject to
            verification.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Intellectual Property</h2>
          <p className="text-sm text-muted leading-relaxed">
            The directory data structure, design, editorial content, and all associated
            branding are owned by Zavis. Provider information sourced from official
            government public registers remains in the public domain. Our original
            editorial content, including healthcare industry insights and analysis, is
            protected by copyright.
          </p>
        </section>

        {/* User Conduct */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">User Conduct</h2>
          <p className="text-sm text-muted leading-relaxed">
            You may not scrape, republish, or commercially redistribute directory data
            without prior written permission from Zavis. Automated access to the directory
            for commercial purposes is prohibited. Personal, non-commercial use of the
            directory for finding healthcare providers is encouraged and free of charge.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Limitation of Liability</h2>
          <p className="text-sm text-muted leading-relaxed">
            Zavis is not liable for any decisions made based on directory information.
            Always verify provider credentials, insurance acceptance, and availability
            directly with healthcare providers. To the maximum extent permitted by law,
            Zavis disclaims all warranties, express or implied, regarding the accuracy,
            completeness, or reliability of directory data.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Governing Law</h2>
          <p className="text-sm text-muted leading-relaxed">
            These Terms of Service are governed by and construed in accordance with the
            laws of the United Arab Emirates. Any disputes arising from or related to the
            use of this directory shall be subject to the exclusive jurisdiction of the
            courts of the United Arab Emirates.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Contact</h2>
          <p className="text-sm text-muted leading-relaxed">
            For questions about these Terms of Service, please contact us at{" "}
            <a
              href="mailto:legal@zavis.ae"
              className="text-accent hover:underline"
            >
              legal@zavis.ae
            </a>
            .
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Changes to These Terms</h2>
          <p className="text-sm text-muted leading-relaxed">
            We may update these Terms of Service from time to time. Any changes will be
            posted on this page with a revised effective date. Continued use of the
            directory after changes are posted constitutes acceptance of the updated terms.
            Last updated March 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
