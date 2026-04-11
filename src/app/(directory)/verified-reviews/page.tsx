import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  truncateDescription,
  truncateTitle,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { VerifiedBadge, VERIFIED_TIERS } from "@/components/trust/VerifiedBadge";

const baseUrl = getBaseUrl();

/* ─── FAQs (8) ──────────────────────────────────────────────────────────── */
const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "Why doesn't Zavis have patient reviews yet?",
    answer:
      "Zavis intentionally does not display patient reviews at launch because we have not yet built an appointment loop that can prove a reviewer actually visited the provider. Unverified reviews have well-documented problems — fake ratings, competitor attacks, review farming — and the UAE has strict defamation and data-protection rules that make publishing unverified patient complaints risky. We would rather show zero reviews than show untrustworthy ones.",
  },
  {
    question: "Why not just display Google Reviews next to each provider?",
    answer:
      "We show the Google rating count as a reference signal, but we do not re-publish the full Google review text. Google's Terms of Service restrict large-scale republication, the reviews are not PDPL-compliant on our surface, and re-publishing them would create a second defamation exposure layer for Zavis. The Google rating number stays; the raw text stays on Google.",
  },
  {
    question: "What is SMS-OTP verification and why use it?",
    answer:
      "SMS-OTP (One-Time Password) verification is how we will prove that a reviewer actually visited the provider. The provider captures the patient's mobile number at check-in, Zavis sends a one-time code to that number, and the patient uses the code to unlock the review form — but only within a 30-day window after the visit. It is the same pattern used by banks, and it meets UAE PDPL Federal Decree Law No. 45 of 2021 consent requirements.",
  },
  {
    question: "How will I appeal a negative review once the system launches?",
    answer:
      "Providers will get a 7-day private response window before any review goes live, plus a 12-month dispute window after publication. Disputes go to trust@zavis.ai and are reviewed by a human moderator, not an automated system. Reviews that violate our published content policy — defamation, PII, medical outcomes we cannot verify, hate speech — are removed. Reviews that the provider simply disagrees with are not.",
  },
  {
    question: "Will Zavis display Google Reviews?",
    answer:
      "Zavis displays the Google aggregate rating count as a reference number on provider pages, because it is one of the only independently sourced signals available in the UAE right now. We do not republish the full review body. Once the Zavis verified review system is live, the Zavis-verified rating will appear alongside the Google rating so patients can see both.",
  },
  {
    question: "How will Zavis handle PDPL compliance?",
    answer:
      "Every review flow will follow UAE PDPL Federal Decree Law No. 45 of 2021: explicit opt-in consent before we send any SMS, clear privacy notice on the review form, data minimization (we never store the full mobile number in plaintext — only a hash), a documented 12-month retention window, and a right to erasure on request. A Data Protection Officer contact will be published on this page before any intake goes live.",
  },
  {
    question: "Will providers be able to respond to reviews?",
    answer:
      "Yes. Every published review will have a single, clearly labeled provider response field. Responses are limited to one per review, cannot contain patient PII, and are moderated against the same content policy as reviews themselves. Providers who respond inside the 7-day private window will have their response go live the same moment the review does.",
  },
  {
    question: "When does the verified review system launch?",
    answer:
      "Target launch is Q3 2026. That schedule depends on (1) operational moderation capacity being staffed, (2) the SMS-OTP provider integration being PDPL-audited, (3) the 5 verification tiers described on this page being legally reviewed, and (4) a pilot cohort of 20–40 providers agreeing to participate in the first 90 days. We will update this page as those milestones land.",
  },
];

/* ─── Metadata ─────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: truncateTitle(
    "How Zavis Is Building Verified Healthcare Reviews",
    58,
  ),
  description: truncateDescription(
    "Zavis's verified review framework for UAE healthcare providers. Launching Q3 2026 with 5 verification tiers, human moderation, and PDPL-compliant data handling.",
    155,
  ),
  alternates: {
    canonical: `${baseUrl}/verified-reviews`,
    languages: {
      en: `${baseUrl}/verified-reviews`,
      "ar-AE": `${baseUrl}/ar/verified-reviews`,
      "x-default": `${baseUrl}/verified-reviews`,
    },
  },
  openGraph: {
    title: "How Zavis Is Building Verified Healthcare Reviews",
    description:
      "Five verification tiers, human moderation, PDPL-compliant data handling. The Zavis trust-and-reviews policy, launching Q3 2026.",
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${baseUrl}/verified-reviews`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Zavis Verified Review Framework",
    description:
      "The public policy page for the Zavis verified healthcare review system — criteria, moderation, PDPL compliance, Q3 2026 rollout.",
  },
};

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function VerifiedReviewsPage() {
  const canonical = `${baseUrl}/verified-reviews`;

  // JSON-LD nodes: WebPage(mainEntity=FAQPage) + BreadcrumbList + Organization + FAQPage
  const webPageNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: "How Zavis Is Building Verified Healthcare Reviews",
    description:
      "The Zavis verified review framework: five verification tiers, human moderation, PDPL-compliant data handling. Launching Q3 2026.",
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
    dateModified: "2026-04-11",
    mainEntity: faqPageSchema(FAQS),
  };

  const breadcrumbNode = breadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "About", url: `${baseUrl}/about` },
    { name: "Verified Reviews", url: canonical },
  ]);

  const organizationNode = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Zavis",
    url: baseUrl,
    email: "trust@zavis.ai",
    sameAs: [canonical],
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
  };

  const faqNode = faqPageSchema(FAQS);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <JsonLd data={webPageNode} />
      <JsonLd data={breadcrumbNode} />
      <JsonLd data={organizationNode} />
      <JsonLd data={faqNode} />

      <Breadcrumb
        items={[
          { label: "About", href: "/about" },
          { label: "Verified Reviews" },
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="max-w-3xl mb-12">
        <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#006828] border border-[#006828]/30 bg-[#006828]/5 px-2 py-1 mb-4">
          Trust &amp; moderation policy · Launching Q3 2026
        </span>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] text-[#1c1c1c] tracking-tight leading-tight mb-4">
          How Zavis is building a verified review system
        </h1>
        <p className="font-['Geist',sans-serif] text-base text-black/60 leading-relaxed">
          Trust in UAE healthcare cannot be borrowed from a scraped star rating.
          This page explains what Zavis will verify, how, when, and — just as
          importantly — what we will never fake. No reviews are live yet.
        </p>
      </header>

      <div className="max-w-3xl space-y-14">
        {/* ── 1. The problem ───────────────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            The problem with most healthcare reviews
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Most healthcare reviews on the internet are impossible to trust.
            Anonymous users can rate providers they have never visited.
            Competitors can leave malicious one-star reviews. Public-relations
            vendors can quietly seed five-star listings. Review farms will sell
            a patient-shaped review for a few dirhams. None of these problems
            are solved by adding more review text — they are solved by proving
            that a real patient, who actually visited a real provider, is the
            one leaving the review. Without a booking gate, an appointment
            loop, or a verified check-in, every review on a directory page is a
            claim that cannot be audited. Zavis has, until now, avoided this
            failure mode by not publishing patient reviews at all. What you see
            on provider pages today is the Google aggregate rating number, not
            a Zavis review. This page explains how we plan to earn the right
            to publish reviews of our own — and the operational commitments we
            are taking before a single review goes live on zavis.ai.
          </p>
        </section>

        {/* ── 2. Zocdoc benchmark ──────────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            Why Zocdoc is our benchmark
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            In the United States, Zocdoc has spent more than fifteen years
            building what is, to our knowledge, the strongest closed-loop
            verified review system in healthcare. Zocdoc only accepts reviews
            from patients who actually booked an appointment through their
            platform, and every review is checked against a human moderation
            queue before it goes live. The reason it works is not the review
            form — it is the booking loop underneath the review form. Zavis is
            not copying Zocdoc&apos;s exact product, and we are not imitating
            the &quot;Zocdoc Verified&quot; badge. We are adopting the
            principle: a review is only useful if the reviewer was provably a
            patient. Everything below is the UAE-specific version of that
            principle.
          </p>
        </section>

        {/* ── 3. Verification framework — 5 tiers ─────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            The Zavis verification framework
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-6">
            Zavis will publish reviews under five verification tiers. Each tier
            is independent: a provider can carry one, several, or none of them.
            A review without any tier will never appear on a Zavis provider
            page.
          </p>

          <ol className="space-y-5">
            {VERIFIED_TIERS.map((t, i) => (
              <li
                key={t.tier}
                className="border border-[#1c1c1c]/10 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[11px] text-black/40 pt-1 w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base text-[#1c1c1c]">
                        {t.labelEn}
                      </h3>
                      <VerifiedBadge tier={t.tier} size="sm" />
                    </div>
                    <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                      {t.blurbEn}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 4. What Zavis will NOT do ─────────────────── */}
        <section className="border-l-2 border-[#006828] pl-5">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            What Zavis will never do
          </h2>
          <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-2 list-disc pl-5">
            <li>
              Generate fake reviews, sample testimonials, or
              &quot;placeholder&quot; patient quotes of any kind.
            </li>
            <li>
              Republish the full text of Google Reviews or scrape them for
              display on Zavis provider pages.
            </li>
            <li>
              Auto-generate review text using a language model, even if the
              underlying facts would be accurate.
            </li>
            <li>
              Accept payment from providers in exchange for positive reviews,
              review placement, or review suppression.
            </li>
            <li>
              Claim a provider is &quot;accepting new patients&quot; in any
              structured data or visible UI surface unless the claim is backed
              by a real data source and an update loop.
            </li>
            <li>
              Display review counts we cannot trace back to a specific
              verification tier on this page.
            </li>
          </ul>
        </section>

        {/* ── 5. Moderation policy ─────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            Moderation policy
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            Every review that reaches Zavis will enter a human moderation queue
            before publication. Moderators are trained Zavis staff — not the
            providers themselves, and not an automated pipeline. The queue
            enforces the following policies:
          </p>
          <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-2 list-disc pl-5">
            <li>
              <strong>Appeals window:</strong> providers have a 12-month dispute
              window from the date of publication. Appeals go to{" "}
              <a
                href="mailto:trust@zavis.ai"
                className="text-[#006828] hover:underline"
              >
                trust@zavis.ai
              </a>
              .
            </li>
            <li>
              <strong>Provider response window:</strong> 7 days of private
              response before a review goes live.
            </li>
            <li>
              <strong>Velocity caps:</strong> no single provider may receive
              more than a set number of reviews per rolling 24-hour period
              without a secondary verification flag — a standard anti-gaming
              guard against coordinated campaigns.
            </li>
            <li>
              <strong>Content rules:</strong> no PII, no named clinicians
              unless they are the profile subject, no specific medical outcome
              claims we cannot verify, no defamation, no hate speech.
            </li>
            <li>
              <strong>Removal triggers:</strong> reviews are removed if the
              patient withdraws consent, if the provider produces contradicting
              primary evidence, or if the content violates published rules.
            </li>
          </ul>
        </section>

        {/* ── 6. Data privacy (PDPL) ───────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            Data privacy &amp; PDPL compliance
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            The Zavis verified review system will operate under UAE PDPL
            Federal Decree Law No. 45 of 2021. That means: explicit, granular
            opt-in consent before any SMS is sent; a clear privacy notice on
            the review form that names the data controller, the purposes, the
            retention period, and the patient&apos;s rights; mobile numbers
            stored only as a salted hash, never as plaintext; a 12-month
            retention window; and a documented right to erasure that we
            honor within 30 days of a valid request. A Data Protection
            Officer contact will be published on this page before any intake
            form goes live, and an independent PDPL audit of the SMS-OTP flow
            is listed as a hard gating milestone below.
          </p>
        </section>

        {/* ── 7. Rollout timeline ─────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            Rollout timeline — launching Q3 2026
          </h2>
          <ol className="space-y-3 font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                Q2 2026
              </span>
              <span>
                Publish this policy page. Open public comment to{" "}
                <a
                  href="mailto:trust@zavis.ai"
                  className="text-[#006828] hover:underline"
                >
                  trust@zavis.ai
                </a>
                . Begin moderation-team hiring.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                Q2 2026
              </span>
              <span>
                PDPL legal review of SMS-OTP flow and consent language. Appoint
                Data Protection Officer. Sign SMS provider with DPA.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                Q3 2026
              </span>
              <span>
                Pilot with 20–40 consenting providers in Dubai. Verified Visit
                tier only. No public visibility during the pilot.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                Q3 2026
              </span>
              <span>
                Public launch of Verified Visit + License Verified tiers across
                Dubai and Abu Dhabi. Publish first Trust Report with moderation
                statistics.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                Q4 2026
              </span>
              <span>
                Add Verified Prescription and Editorial Review tiers. Expand to
                Sharjah and the Northern Emirates.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-16 shrink-0">
                2027
              </span>
              <span>
                Zavis Gold tier, launched in partnership with consenting
                insurers. Expand to the rest of the GCC.
              </span>
            </li>
          </ol>
        </section>

        {/* ── 8. FAQ ──────────────────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-5">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="border border-[#1c1c1c]/10 bg-white p-5 group"
              >
                <summary className="font-['Bricolage_Grotesque',sans-serif] text-base text-[#1c1c1c] cursor-pointer list-none flex justify-between items-start gap-4">
                  <span>{faq.question}</span>
                  <span className="font-mono text-xs text-[#006828] pt-1 shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 9. Contact ─────────────────────────────── */}
        <section className="border-t border-[#1c1c1c]/10 pt-8">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            Contact &amp; policy updates
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-2">
            Questions, corrections, appeals, or policy feedback:{" "}
            <a
              href="mailto:trust@zavis.ai"
              className="text-[#006828] hover:underline font-medium"
            >
              trust@zavis.ai
            </a>
            .
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
            This policy is reviewed and updated at least quarterly, and
            whenever a rollout milestone changes. Last updated: 11 April 2026.
            Arabic version:{" "}
            <a
              href="/ar/verified-reviews"
              className="text-[#006828] hover:underline"
            >
              النسخة العربية
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
