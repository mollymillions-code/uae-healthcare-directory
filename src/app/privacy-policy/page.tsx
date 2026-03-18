import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Privacy Policy | UAE Open Healthcare Directory",
  description:
    "Learn how the UAE Open Healthcare Directory collects, uses, and protects your information. No personal health data is collected.",
  alternates: {
    canonical: `${getBaseUrl()}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8 pb-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Privacy Policy", url: `${base}/privacy-policy` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <h1 className="text-3xl font-bold text-dark mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted mb-8">Effective March 2026</p>

      <div className="max-w-3xl space-y-10">
        {/* Information We Collect */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Information We Collect</h2>
          <p className="text-sm text-muted leading-relaxed">
            We collect directory browsing data, search queries, newsletter email addresses
            (via Resend), and claim request submissions. We do not collect any personal
            health data. Browsing information is collected automatically through standard
            web server logs and analytics tools.
          </p>
        </section>

        {/* How We Use Information */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">How We Use Information</h2>
          <p className="text-sm text-muted leading-relaxed">
            We use the information we collect to improve directory accuracy, send our
            newsletter to subscribers, process listing claims from healthcare providers,
            and analyze usage patterns to enhance the user experience. We do not sell or
            share personal information with third parties for marketing purposes.
          </p>
        </section>

        {/* Data Sources */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Data Sources</h2>
          <p className="text-sm text-muted leading-relaxed">
            Healthcare provider data displayed in the directory is sourced from official
            public registers maintained by the Dubai Health Authority (DHA), the Department
            of Health Abu Dhabi (DOH), and the Ministry of Health and Prevention (MOHAP).
            Provider ratings and review counts are obtained from the Google Places API to
            reflect real patient feedback. We do not collect, store, or display any patient
            data.
          </p>
        </section>

        {/* Cookies & Analytics */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Cookies &amp; Analytics</h2>
          <p className="text-sm text-muted leading-relaxed">
            We use standard web analytics to understand how visitors use the directory and
            to improve our services. We do not use third-party advertising trackers or
            serve targeted ads. Cookies may be used for essential site functionality and
            analytics purposes only.
          </p>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Third-Party Services</h2>
          <p className="text-sm text-muted leading-relaxed">
            The UAE Open Healthcare Directory integrates with the following third-party
            services: Google Maps (embedded maps on provider pages), Google Places API
            (ratings and reviews), and Resend (newsletter email delivery). Each of these
            services operates under their own privacy policies. We encourage you to review
            their respective privacy policies for information on how they handle your data.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Data Retention</h2>
          <p className="text-sm text-muted leading-relaxed">
            Newsletter subscriptions are retained until the subscriber chooses to
            unsubscribe. Claim requests are retained for the duration of the processing
            and verification period. Analytics data is retained in aggregate form and is
            not linked to individual users.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Your Rights</h2>
          <p className="text-sm text-muted leading-relaxed">
            You may unsubscribe from our newsletter at any time using the unsubscribe link
            included in every email. You may also request deletion of your personal data
            by contacting us at{" "}
            <a
              href="mailto:privacy@zavis.ae"
              className="text-accent hover:underline"
            >
              privacy@zavis.ae
            </a>
            . We will respond to all data deletion requests within 30 days.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Contact</h2>
          <p className="text-sm text-muted leading-relaxed">
            For questions or concerns about this privacy policy, please contact us at{" "}
            <a
              href="mailto:privacy@zavis.ae"
              className="text-accent hover:underline"
            >
              privacy@zavis.ae
            </a>
            .
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className="text-lg font-semibold text-dark mb-3">Changes to This Policy</h2>
          <p className="text-sm text-muted leading-relaxed">
            We may update this privacy policy from time to time to reflect changes in our
            practices or for operational, legal, or regulatory reasons. Any updates will be
            posted on this page with a revised effective date. Last updated March 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
