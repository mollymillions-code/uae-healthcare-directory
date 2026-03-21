/* eslint-disable react/no-unescaped-entities */
"use client";

export function PrivacyPolicyPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#1c1c1c] mb-4"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Privacy Policy
          </h1>
          <p
            className="text-[#1c1c1c]/60 text-sm"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Effective Date: May 1, 2025 &nbsp;|&nbsp; Last Updated: July 26, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-[800px] mx-auto text-[#1c1c1c]/80 text-base leading-relaxed space-y-8"
          style={{ fontFamily: "'Geist', sans-serif" }}
        >
          {/* 1. Introduction */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              1. Introduction
            </h2>
            <p className="mb-3">
              Welcome to ZAVIS, a product of HASH INFORMATION TECHNOLOGY CO. L.L.C., Dubai, UAE
              ("ZAVIS", "we", "us", or "our"). We provide two primary services:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI Voice Agent platform</li>
              <li>WhatsApp Business Automation platform for customer messaging</li>
            </ul>
            <p className="mt-3">
              This Privacy Policy outlines how we collect, use, disclose, and secure your
              information when you use our services via ZAVIS.ai, our APIs, integrations, mobile
              or web apps, and support channels (together, "Services"). By using our Services, you
              accept the terms described in this policy.
            </p>
          </div>

          {/* 2. Information We Collect */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              2. Information We Collect
            </h2>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              2.1 What You Provide
            </h3>
            <p className="mb-3">Information you voluntarily supply when:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Requesting demos, support, or sales outreach (name, email, phone, company)</li>
              <li>Sharing customer or end-user contact data for onboarding</li>
              <li>Using WhatsApp or Voice Agents to interact with your own contacts</li>
              <li>Submitting feedback, surveys, or forms</li>
            </ul>
            <p className="mb-4">
              This may include: full name, email address, company, job role, phone number, contacts
              data you upload (consented recipients), conversational transcripts, voice recordings,
              and feedback messages.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              2.2 Automatically Collected Data
            </h3>
            <p className="mb-3">
              When you or your end-users use our Services, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Usage logs: timestamps, pages/screens visited, clicks, feature interactions</li>
              <li>Device & connection data: IP address, browser type, OS, device IDs</li>
              <li>Platform activity: chat or call metadata (not message content when encrypted)</li>
            </ul>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              2.3 Cookies & Similar Technologies
            </h3>
            <p className="mb-3">We use cookies, pixels, and similar tracking tools to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Enable essential platform functionality</li>
              <li>Track usage and performance</li>
              <li>Personalize your experience</li>
            </ul>
            <p className="mt-3">
              You can manage or disable cookies through your browser settings.
            </p>
          </div>

          {/* 3. How We Use Your Information */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, secure, and improve Service functionality</li>
              <li>Authenticate and manage your account access</li>
              <li>Enable integrations with payment, analytics, or messaging systems</li>
              <li>Respond to support inquiries and schedule demos</li>
              <li>Personalize notifications or marketing messages (with opt-out options)</li>
              <li>Detect and prevent misuse and unauthorized access</li>
              <li>Fulfill legal and compliance obligations</li>
            </ul>
          </div>

          {/* 4. Sharing of Your Information */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4. Sharing of Your Information
            </h2>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4.1 Service Providers
            </h3>
            <p className="mb-4">
              Third-party vendors (e.g., Stripe, cloud hosting, analytics) enabling platform
              functionality. All partners are bound to confidentiality and GDPR-equivalent
              safeguards.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4.2 Platform Integrations
            </h3>
            <p className="mb-4">
              With your consent, we may transfer data to integrated systems (CRM, GitHub, chat
              platforms, etc.).
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4.3 Legal & Compliance
            </h3>
            <p className="mb-4">
              When required by law or policy, or to enforce terms and protect our rights.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4.4 Business Transfers
            </h3>
            <p className="mb-4">
              If ZAVIS undergoes a sale, merger, or restructuring, relevant data may be transferred
              to the successor entity.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              4.5 Your Consent
            </h3>
            <p>Other uses will only occur with explicit permission.</p>
          </div>

          {/* 5. Data Storage, Retention & Security */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              5. Data Storage, Retention & Security
            </h2>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              5.1 Retention
            </h3>
            <p className="mb-4">
              We retain your data only as long as needed to support your use of the Services or to
              comply with legal obligations. Usage logs and customer interactions may be retained for
              up to 12 months after account inactivity.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              5.2 Security Measures
            </h3>
            <p className="mb-3">
              We implement industry-standard technical and organizational safeguards:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Secure storage with encryption in transit and at rest</li>
              <li>Access restricted to authorized personnel</li>
              <li>Monitored environments and regular audits to prevent breaches</li>
            </ul>
          </div>

          {/* 6. Your Rights & Choices */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              6. Your Rights & Choices
            </h2>
            <p className="mb-3">Depending on applicable laws, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Access or review your stored personal information</li>
              <li>Rectify inaccuracies in the data held</li>
              <li>Request deletion ("right to be forgotten")</li>
              <li>Restrict or object to certain processing</li>
              <li>Port your data in structured formats</li>
              <li>Withdraw consent to non-essential processing</li>
              <li>Opt out of marketing messages</li>
            </ul>
            <p>
              Submit requests via{" "}
              <a href="mailto:syed@zavis.ai" className="text-[#006828] underline">
                syed@zavis.ai
              </a>
              ; we'll respond within applicable legal timeframes.
            </p>
          </div>

          {/* 7. Use of AI & Bot Platforms */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              7. Use of AI & Bot Platforms
            </h2>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              7.1 AI Voice Agents
            </h3>
            <p className="mb-4">
              Voice interactions and transcripts may be processed to improve agent performance,
              subject to user consent. Audio is encrypted and stored securely.
            </p>

            <h3
              className="text-lg font-semibold text-[#1c1c1c] mb-2"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              7.2 WhatsApp Business Automation
            </h3>
            <p>
              Customer messages and responses are processed in adherence with WhatsApp Business
              policies. Content is not accessed by humans unless required for support.
            </p>
          </div>

          {/* 8. International Transfers */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              8. International Transfers
            </h2>
            <p>
              Your data may be stored or processed in the UAE or other jurisdictions. When
              transferred outside the UAE or treated as international data, we adopt standard
              contractual clauses and equivalent safeguards for regulatory compliance.
            </p>
          </div>

          {/* 9. Children & Special Categories */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              9. Children & Special Categories
            </h2>
            <p>
              Our Services are intended for professional use by adults. We do not knowingly collect
              personal data from minors or sensitive data such as race, religion, health, or
              biometric identifiers.
            </p>
          </div>

          {/* 10. Changes to This Policy */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. We notify users via email or notice on
              our website and update the "Last Updated" date accordingly. Continued use after changes
              implies acceptance.
            </p>
          </div>

          {/* 11. Contact */}
          <div>
            <h2
              className="text-2xl font-semibold text-[#1c1c1c] mb-4"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              11. Contact & Data Protection Officer
            </h2>
            <p className="mb-3">
              If you have questions or concerns, email{" "}
              <a href="mailto:syed@zavis.ai" className="text-[#006828] underline">
                syed@zavis.ai
              </a>{" "}
              or write to HASH INFORMATION TECHNOLOGY CO. L.L.C., Dubai, UAE.
            </p>
            <p>Thank you for trusting ZAVIS with your data. We take your privacy seriously.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
