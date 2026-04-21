import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Phone, Globe, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanCard } from "@/components/insurance/PlanCard";
import { NetworkStats } from "@/components/insurance/NetworkStats";
import {
  INSURER_PROFILES,
  getInsurerProfile,
  getInsurerNetworkStats,
  getAllInsurerNetworkStats,
  formatPremium,
  formatLimit,
  getTierLabel,
} from "@/lib/insurance";
import {
  breadcrumbSchema,
  faqPageSchema,
  speakableSchema,
  insuranceAgencySchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { insurer: string };
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = getInsurerProfile(params.insurer);
  if (!profile) return {};
  const base = getBaseUrl();
  const stats = await safe(
    getInsurerNetworkStats(params.insurer),
    undefined as Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined,
    `insurer:metadataStats:${params.insurer}`,
  );

  return {
    title: `${profile.name} Health Insurance UAE — Plans, Coverage & ${stats?.totalProviders.toLocaleString() || ""} Provider Network`,
    description: `Compare ${profile.name} health insurance plans in the UAE. ${profile.plans.length} plans from ${formatPremium(profile.plans[0]?.premiumRange || { min: 0, max: 0 })}. Coverage details, co-pay, dental, maternity, network of ${stats?.totalProviders.toLocaleString() || "0"} providers across ${stats?.byCity.length || 0} cities. ${profile.keyFacts[0]}`,
    alternates: { canonical: `${base}/insurance/${profile.slug}` },
    openGraph: {
      title: `${profile.name} Health Insurance — Plans & Provider Network`,
      description: `${profile.plans.length} plans, ${stats?.totalProviders.toLocaleString()} providers. Compare coverage, premiums, and find clinics that accept ${profile.name}.`,
      url: `${base}/insurance/${profile.slug}`,
      type: "website",
    },
  };
}

export default async function InsurerDetailPage({ params }: Props) {
  const profile = getInsurerProfile(params.insurer);
  if (!profile) notFound();

  const stats = await safe(
    getInsurerNetworkStats(params.insurer),
    undefined as Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined,
    `insurer:stats:${params.insurer}`,
  );
  const base = getBaseUrl();

  const cheapestPlan = [...profile.plans].sort(
    (a, b) => a.premiumRange.min - b.premiumRange.min,
  )[0];

  const faqs = [
    {
      question: `What health insurance plans does ${profile.name} offer in the UAE?`,
      answer: `${profile.name} offers ${profile.plans.length} health insurance plan${profile.plans.length !== 1 ? "s" : ""} in the UAE: ${profile.plans.map((p) => p.name).join(", ")}. Plans range from ${formatPremium(profile.plans[0]?.premiumRange || { min: 0, max: 0 })} to ${formatPremium(profile.plans[profile.plans.length - 1]?.premiumRange || { min: 0, max: 0 })} annually.`,
    },
    {
      question: `How many healthcare providers accept ${profile.name} insurance?`,
      answer: `According to the UAE Open Healthcare Directory, ${stats?.totalProviders.toLocaleString() || "multiple"} healthcare providers across ${stats?.byCity.length || "multiple"} UAE cities accept ${profile.name} insurance. This includes hospitals, clinics, dental practices, and specialist centers.`,
    },
    {
      question: `Does ${profile.name} cover dental and maternity?`,
      answer: `Dental and maternity coverage depends on the plan tier. ${profile.plans.some((p) => p.coverage.dental) ? `Yes, ${profile.name}'s enhanced and premium plans include dental coverage.` : `Basic plans typically exclude dental.`} ${profile.plans.some((p) => p.coverage.maternity) ? `Maternity is covered with waiting periods ranging from ${Math.min(...profile.plans.filter((p) => p.maternityWaitMonths >= 0).map((p) => p.maternityWaitMonths))} to ${Math.max(...profile.plans.filter((p) => p.maternityWaitMonths >= 0).map((p) => p.maternityWaitMonths))} months.` : ""}`,
    },
    {
      question: `Is ${profile.name} DHA or HAAD compliant?`,
      answer: `${profile.name} is regulated by ${profile.regulators.map((r) => r.toUpperCase()).join(" and ")}. ${profile.regulators.includes("dha") ? "Dubai Health Authority (DHA) compliance means all plans meet the Essential Benefits Package required for Dubai residents and workers." : ""}${profile.regulators.includes("haad") ? `${profile.regulators.includes("dha") ? " Additionally, " : ""}Health Authority Abu Dhabi (HAAD/DoH) oversight ensures plans meet Abu Dhabi's mandatory Thiqa and basic scheme requirements.` : ""}${profile.regulators.includes("mohap") ? " Ministry of Health and Prevention (MOHAP) registration applies for the Northern Emirates." : ""}`,
    },
    {
      question: `How do I file a claim with ${profile.name}?`,
      answer: `To file a claim with ${profile.name}, call their claims line at ${profile.claimsPhone}. For direct billing, simply present your ${profile.name} insurance card at any in-network provider — the clinic or hospital settles directly with the insurer. For reimbursement claims (out-of-network or emergency), submit itemised invoices, a completed claim form, and your doctor's report within 90 days of treatment via ${profile.website} or by post to their ${profile.headquarters} office.`,
    },
    {
      question: `What is the cheapest ${profile.name} plan?`,
      answer: cheapestPlan
        ? `The most affordable ${profile.name} plan is the ${cheapestPlan.name} (${getTierLabel(cheapestPlan.tier)} tier), starting from ${formatPremium(cheapestPlan.premiumRange)} annually. It covers ${cheapestPlan.coverage.inpatient ? "inpatient" : ""}${cheapestPlan.coverage.outpatient ? ", outpatient" : ""}${cheapestPlan.coverage.maternity ? ", maternity" : ""} with a ${cheapestPlan.copayOutpatient}% outpatient co-pay and an annual limit of ${formatLimit(cheapestPlan.annualLimit)}.`
        : `Contact ${profile.name} at ${profile.claimsPhone} for current pricing on entry-level plans.`,
    },
    {
      question: `Does ${profile.name} have a mobile app for claims?`,
      answer: `${profile.name} offers digital claims submission through their member portal at ${profile.website}. Most major UAE insurers, including ${profile.name}, provide a mobile app or online portal where members can submit reimbursement claims, view policy documents, check coverage limits, find in-network providers, and download tax invoices. Download the ${profile.name} app from the App Store or Google Play, or log in via their website to access self-service claim tools.`,
    },
  ];

  // "Other insurers to consider" — load stats once and derive from it
  const allStats = await safe(
    getAllInsurerNetworkStats(),
    [] as Awaited<ReturnType<typeof getAllInsurerNetworkStats>>,
    `insurer:allStats:${params.insurer}`,
  );
  const otherInsurers = allStats
    .filter((s) => s.slug !== profile.slug && s.totalProviders > 0)
    .sort((a, b) => {
      const diff =
        Math.abs(a.totalProviders - (stats?.totalProviders ?? 0)) -
        Math.abs(b.totalProviders - (stats?.totalProviders ?? 0));
      return diff;
    })
    .slice(0, 5);

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: "Insurance Navigator", href: "/insurance" },
    { label: profile.name },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Insurance Navigator", url: `${base}/insurance` },
          { name: profile.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={insuranceAgencySchema(profile, stats ?? null)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>
                      {b.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            UAE insurer profile
          </p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em]">
                {profile.name}
              </h1>
              <p className="font-sans text-z-body-sm text-ink-muted mt-2">
                Est. {profile.foundedYear} · {profile.headquarters} ·{" "}
                {profile.regulators.map((r) => r.toUpperCase()).join(", ")} regulated
              </p>
            </div>
            <span className="inline-flex items-center rounded-z-pill bg-accent-muted px-3 py-1 font-sans text-z-caption font-medium text-accent-dark shrink-0">
              {profile.type}
            </span>
          </div>

          <div
            className="mt-6 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {profile.keyFacts[0]}. {profile.name} offers {profile.plans.length}{" "}
              health insurance plan{profile.plans.length !== 1 ? "s" : ""} in the
              UAE
              {stats
                ? `, accepted by ${stats.totalProviders.toLocaleString()} healthcare providers across ${stats.byCity.length} cities`
                : ""}
              . Data cross-referenced with the UAE Open Healthcare Directory.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 font-sans text-z-body-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {profile.claimsPhone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {profile.website}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* Key Facts */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              At a glance
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Key facts.
            </h2>
          </header>
          <ul className="rounded-z-md bg-white border border-ink-line p-6 space-y-3 max-w-3xl">
            {profile.keyFacts.map((fact) => (
              <li
                key={fact}
                className="flex items-start gap-2.5 font-sans text-z-body-sm text-ink leading-relaxed"
              >
                <ArrowRight className="h-4 w-4 text-accent-dark mt-0.5 shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Coverage at a Glance */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Coverage matrix
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Coverage at a glance.
            </h2>
          </header>
          <div className="rounded-z-md bg-white border border-ink-line overflow-x-auto">
            <table className="w-full font-sans text-z-body-sm">
              <thead>
                <tr className="border-b border-ink-line text-ink-soft text-z-caption uppercase tracking-[0.04em]">
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-left font-medium">Premium / yr</th>
                  <th className="px-4 py-3 text-left font-medium">Annual Limit</th>
                  <th className="px-4 py-3 text-left font-medium">Co-pay</th>
                  <th className="px-4 py-3 text-center font-medium">Dental</th>
                  <th className="px-4 py-3 text-center font-medium">Optical</th>
                </tr>
              </thead>
              <tbody>
                {profile.plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-ink-hairline last:border-b-0">
                    <td className="px-4 py-3 font-medium text-ink">{plan.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark">
                        {getTierLabel(plan.tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatPremium(plan.premiumRange)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatLimit(plan.annualLimit)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {plan.copayOutpatient === 0 ? "0%" : `${plan.copayOutpatient}%`}
                    </td>
                    <td className="px-4 py-3 text-center text-ink">
                      {plan.coverage.dental ? "✓" : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-ink">
                      {plan.coverage.optical ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-sans text-z-caption text-ink-muted mt-2">
            Co-pay shown is for outpatient visits. Premiums are indicative annual ranges.
          </p>
        </section>

        {/* Plans */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Plan catalogue
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Insurance plans.
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                insurerName={profile.name}
                insurerSlug={profile.slug}
                networkSize={stats?.totalProviders}
              />
            ))}
          </div>
        </section>

        {/* Network Stats */}
        {stats && stats.totalProviders > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Who accepts this
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Provider network.
              </h2>
            </header>
            <NetworkStats stats={stats} />
          </section>
        )}

        {/* Claims Process Answer Block */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              The claims flow
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              How claims work with {profile.name}.
            </h2>
          </header>
          <div
            className="rounded-z-md bg-white border border-ink-line p-6 max-w-4xl answer-block"
            data-answer-block="true"
          >
            <div className="font-sans text-z-body-sm text-ink-soft leading-[1.75] space-y-3">
              <p>
                <strong className="text-ink">Direct billing.</strong> Present
                your {profile.name} insurance card at any in-network provider.
                The clinic or hospital bills {profile.name} directly — you pay
                only your applicable co-pay ({profile.plans[0]?.copayOutpatient ?? 0}%–
                {profile.plans[profile.plans.length - 1]?.copayOutpatient ?? 0}%
                outpatient) at the point of care. No paperwork required.
              </p>
              <p>
                <strong className="text-ink">Reimbursement claims.</strong> For
                out-of-network or emergency treatment, collect itemised invoices
                and medical reports, then submit via {profile.website} or call{" "}
                {profile.claimsPhone}. Standard reimbursement decisions are
                issued within 15–30 working days. Pre-authorisation is required
                for planned inpatient admissions, surgeries, and high-cost
                diagnostics — contact {profile.name} at least 48 hours in
                advance.
              </p>
            </div>
          </div>
        </section>

        {/* Other Insurers to Consider */}
        {otherInsurers.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                Keep comparing
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Other insurers to consider.
              </h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherInsurers.map((s) => {
                const p = getInsurerProfile(s.slug);
                if (!p) return null;
                return (
                  <Link
                    key={s.slug}
                    href={`/insurance/${s.slug}`}
                    className="group flex flex-col rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                        {s.name}
                      </p>
                      <span className="inline-flex items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark shrink-0">
                        {p.type}
                      </span>
                    </div>
                    <p className="font-sans text-z-caption text-ink-muted">
                      {p.plans.length} plan{p.plans.length !== 1 ? "s" : ""} ·{" "}
                      {s.totalProviders.toLocaleString()} providers · {s.byCity.length} cities
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 font-sans text-z-caption font-medium text-accent-dark">
                      View plans <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Compare CTA */}
        <section>
          <div className="rounded-z-lg bg-ink text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-display font-semibold text-z-h3">
                Compare {profile.name} with other insurers
              </p>
              <p className="font-sans text-z-body-sm text-white/70 mt-1">
                Side-by-side plan comparison across all {INSURER_PROFILES.length} UAE insurers
              </p>
            </div>
            <Link
              href="/insurance/compare"
              className="inline-flex items-center gap-1.5 rounded-z-pill bg-accent-dark px-5 py-2.5 font-sans text-z-body-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Compare plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About {profile.name}.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title={`${profile.name} Insurance — FAQ`} />
        </div>

        <div className="mt-8">
          <Link
            href="/insurance"
            className="inline-flex items-center gap-1.5 font-sans text-z-body-sm font-medium text-accent-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> All insurers
          </Link>
        </div>

        <div className="mt-8 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> Plan details
            and premiums are indicative. Obtain a personalised quote from{" "}
            {profile.name} or an authorised broker. Provider network data
            sourced from the UAE Open Healthcare Directory, last verified March
            2026.
          </p>
        </div>
      </section>
    </>
  );
}
