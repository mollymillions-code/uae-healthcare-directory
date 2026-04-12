import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Globe } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
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
import { breadcrumbSchema, faqPageSchema, speakableSchema, insuranceAgencySchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { insurer: string };
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = getInsurerProfile(params.insurer);
  if (!profile) return {};
  const base = getBaseUrl();
  let stats: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  try {
    stats = await getInsurerNetworkStats(params.insurer);
  } catch {
    // Graceful degradation — metadata still works without network stats
  }

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

  let stats: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  try {
    stats = await getInsurerNetworkStats(params.insurer);
  } catch (e) {
    console.error(`[insurance/${params.insurer}] Failed to load network stats:`, e instanceof Error ? e.message : e);
  }
  const base = getBaseUrl();

  const cheapestPlan = [...profile.plans].sort(
    (a, b) => a.premiumRange.min - b.premiumRange.min
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

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Insurance Navigator", href: "/insurance" },
          { label: profile.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">{profile.name}</h1>
            <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-1">
              Est. {profile.foundedYear} · {profile.headquarters} ·{" "}
              {profile.regulators.map((r) => r.toUpperCase()).join(", ")} regulated
            </p>
          </div>
          <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{profile.type}</span>
        </div>

        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            {profile.keyFacts[0]}.{" "}
            {profile.name} offers {profile.plans.length} health insurance plan
            {profile.plans.length !== 1 ? "s" : ""} in the UAE
            {stats ? `, accepted by ${stats.totalProviders.toLocaleString()} healthcare providers across ${stats.byCity.length} cities` : ""}.
            Data cross-referenced with the UAE Open Healthcare Directory.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-black/40">
            <Phone className="w-3.5 h-3.5" /> {profile.claimsPhone}
          </span>
          <span className="flex items-center gap-1.5 text-black/40">
            <Globe className="w-3.5 h-3.5" /> {profile.website}
          </span>
        </div>
      </div>

      {/* Key Facts */}
      <div className="bg-[#f8f8f6] p-4 mb-8 border border-black/[0.06]">
        <h2 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-3">Key Facts</h2>
        <ul className="space-y-1.5">
          {profile.keyFacts.map((fact) => (
            <li key={fact} className="text-xs text-[#1c1c1c] flex items-start gap-2">
              <span className="text-[#006828] mt-0.5 flex-shrink-0">▸</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>

      {/* Coverage at a Glance */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Coverage at a Glance</h2>
      </div>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#1c1c1c] text-white">
              <th className="px-3 py-2 text-left font-semibold">Plan</th>
              <th className="px-3 py-2 text-left font-semibold">Tier</th>
              <th className="px-3 py-2 text-left font-semibold">Premium / yr</th>
              <th className="px-3 py-2 text-left font-semibold">Annual Limit</th>
              <th className="px-3 py-2 text-left font-semibold">Co-pay</th>
              <th className="px-3 py-2 text-center font-semibold">Dental</th>
              <th className="px-3 py-2 text-center font-semibold">Optical</th>
            </tr>
          </thead>
          <tbody>
            {profile.plans.map((plan, i) => (
              <tr
                key={plan.id}
                className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}
              >
                <td className="px-3 py-2 font-medium text-[#1c1c1c] border-b border-black/[0.06]">
                  {plan.name}
                </td>
                <td className="px-3 py-2 border-b border-black/[0.06]">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      plan.tier === "vip"
                        ? "bg-yellow-100 text-yellow-800"
                        : plan.tier === "premium"
                        ? "bg-purple-100 text-purple-800"
                        : plan.tier === "enhanced"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {getTierLabel(plan.tier)}
                  </span>
                </td>
                <td className="px-3 py-2 text-black/40 border-b border-black/[0.06]">
                  {formatPremium(plan.premiumRange)}
                </td>
                <td className="px-3 py-2 text-black/40 border-b border-black/[0.06]">
                  {formatLimit(plan.annualLimit)}
                </td>
                <td className="px-3 py-2 text-black/40 border-b border-black/[0.06]">
                  {plan.copayOutpatient === 0 ? "0%" : `${plan.copayOutpatient}%`}
                </td>
                <td className="px-3 py-2 text-center border-b border-black/[0.06]">
                  {plan.coverage.dental ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-black/40">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center border-b border-black/[0.06]">
                  {plan.coverage.optical ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-black/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-black/40 mt-1.5">
          Co-pay shown is for outpatient visits. Premiums are indicative annual ranges.
        </p>
      </div>

      {/* Plans */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurance Plans</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
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

      {/* Network Stats */}
      {stats && stats.totalProviders > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Provider Network</h2>
          </div>
          <div className="mb-12">
            <NetworkStats stats={stats} />
          </div>
        </>
      )}

      {/* Claims Process Answer Block */}
      <div className="mb-10 bg-[#f8f8f6] border border-black/[0.06] p-5">
        <h2 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
          How claims work with {profile.name}
        </h2>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
            <strong>Direct billing:</strong> Present your {profile.name} insurance card at any in-network
            provider. The clinic or hospital bills {profile.name} directly — you pay only
            your applicable co-pay ({profile.plans[0]?.copayOutpatient ?? 0}%–
            {profile.plans[profile.plans.length - 1]?.copayOutpatient ?? 0}% outpatient) at the
            point of care. No paperwork required.{" "}
            <strong>Reimbursement claims:</strong> For out-of-network or emergency treatment, collect
            itemised invoices and medical reports, then submit via {profile.website} or call{" "}
            {profile.claimsPhone}. Standard reimbursement decisions are issued within 15–30 working
            days. Pre-authorisation is required for planned inpatient admissions, surgeries, and
            high-cost diagnostics — contact {profile.name} at least 48 hours in advance.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${profile.name} Insurance — FAQ`} />

      {/* Other Insurers to Consider */}
      {await (async () => {
        let allStats: Awaited<ReturnType<typeof getAllInsurerNetworkStats>>;
        try {
          allStats = await getAllInsurerNetworkStats();
        } catch (e) {
          console.error(`[insurance/${params.insurer}] Failed to load all insurer stats:`, e instanceof Error ? e.message : e);
          return null;
        }
        const others = allStats
          .filter((s) => s.slug !== profile.slug && s.totalProviders > 0)
          .sort((a, b) => {
            const diff = Math.abs(a.totalProviders - (stats?.totalProviders ?? 0)) -
                         Math.abs(b.totalProviders - (stats?.totalProviders ?? 0));
            return diff;
          })
          .slice(0, 5);
        if (others.length === 0) return null;
        return (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Insurers to Consider</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {others.map((s) => {
                const p = getInsurerProfile(s.slug)!;
                return (
                  <Link
                    key={s.slug}
                    href={`/insurance/${s.slug}`}
                    className="block border border-black/[0.06] bg-white p-4 hover:border-[#006828]/15 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                        {s.name}
                      </span>
                      <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{p.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-black/40">
                      <span>{p.plans.length} plan{p.plans.length !== 1 ? "s" : ""}</span>
                      <span>{s.totalProviders.toLocaleString()} providers</span>
                      <span>{s.byCity.length} cities</span>
                    </div>
                    <p className="text-[11px] text-[#006828] font-semibold mt-2">
                      View plans &rarr;
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Compare CTA */}
      <div className="mt-8 bg-[#1c1c1c] text-white p-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">Compare {profile.name} with other insurers</p>
          <p className="text-xs text-white/70 mt-1">
            Side-by-side plan comparison across all {INSURER_PROFILES.length} UAE insurers
          </p>
        </div>
        <Link
          href="/insurance/compare"
          className="bg-[#006828] text-white px-4 py-2 text-xs font-bold hover:bg-[#004d1c] transition-colors flex-shrink-0"
        >
          Compare plans
        </Link>
      </div>

      {/* Back */}
      <div className="mt-6">
        <Link
          href="/insurance"
          className="flex items-center gap-1.5 text-sm text-[#006828] font-bold hover:text-[#006828]-dark"
        >
          <ArrowLeft className="w-4 h-4" /> All insurers
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Plan details and premiums are indicative. Obtain a
          personalised quote from {profile.name} or an authorised broker. Provider network
          data sourced from the UAE Open Healthcare Directory, last verified March 2026.
        </p>
      </div>
    </div>
  );
}
