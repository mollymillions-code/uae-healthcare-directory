import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanCard } from "@/components/insurance/PlanCard";
import {
  INSURER_PROFILES,
  getInsurerProfile,
  getInsurerNetworkStats,
  formatPremium,
  type InsurerProfile,
  type InsurerNetworkStats,
} from "@/lib/insurance";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCities } from "@/lib/data";

export const revalidate = 43200;

// ─── Top 10 insurers by network size (for generating matchups) ──────────────

async function getTop10Insurers(): Promise<{ slug: string; name: string; networkSize: number }[]> {
  try {
    const { getAllInsurerNetworkStats } = await import("@/lib/insurance");
    const allStats = await getAllInsurerNetworkStats();
    return allStats
      .map((s) => ({ slug: s.slug, name: s.name, networkSize: s.totalProviders }))
      .sort((a, b) => b.networkSize - a.networkSize)
      .slice(0, 10);
  } catch (e) {
    console.error("[insurance/compare] Failed to load insurer stats:", e instanceof Error ? e.message : e);
    return INSURER_PROFILES.slice(0, 10).map((p) => ({ slug: p.slug, name: p.name, networkSize: 0 }));
  }
}

async function getAllMatchups(): Promise<{ slug: string; slugA: string; slugB: string }[]> {
  const top10 = await getTop10Insurers();
  const matchups: { slug: string; slugA: string; slugB: string }[] = [];

  for (let i = 0; i < top10.length; i++) {
    for (let j = i + 1; j < top10.length; j++) {
      // Sort alphabetically to avoid duplicates
      const [a, b] = [top10[i].slug, top10[j].slug].sort();
      matchups.push({ slug: `${a}-vs-${b}`, slugA: a, slugB: b });
    }
  }

  return matchups;
}

function parseMatchupSlug(slug: string): { slugA: string; slugB: string } | null {
  const vsIndex = slug.indexOf("-vs-");
  if (vsIndex === -1) return null;

  const slugA = slug.slice(0, vsIndex);
  const slugB = slug.slice(vsIndex + 4);

  if (!slugA || !slugB) return null;

  const profileA = getInsurerProfile(slugA);
  const profileB = getInsurerProfile(slugB);

  if (!profileA || !profileB) return null;

  // Ensure alphabetical ordering
  const [sortedA, sortedB] = [slugA, slugB].sort();
  if (sortedA !== slugA || sortedB !== slugB) return null;

  return { slugA, slugB };
}

// ─── Params ─────────────────────────────────────────────────────────────────

export const dynamicParams = true;

interface Props {
  params: { matchup: string };
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseMatchupSlug(params.matchup);
  if (!parsed) return {};

  const profileA = getInsurerProfile(parsed.slugA)!;
  const profileB = getInsurerProfile(parsed.slugB)!;
  let statsA: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  let statsB: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  try {
    [statsA, statsB] = await Promise.all([
      getInsurerNetworkStats(parsed.slugA),
      getInsurerNetworkStats(parsed.slugB),
    ]);
  } catch {
    // Graceful degradation
  }
  const base = getBaseUrl();

  const title = `${profileA.name} vs ${profileB.name} — UAE Health Insurance Comparison 2026`;
  const description = `Compare ${profileA.name} (${profileA.plans.length} plans, ${statsA?.totalProviders.toLocaleString() ?? "0"} providers) with ${profileB.name} (${profileB.plans.length} plans, ${statsB?.totalProviders.toLocaleString() ?? "0"} providers). Side-by-side coverage, premiums from ${formatPremium(profileA.plans[0]?.premiumRange ?? { min: 0, max: 0 })}, network sizes, dental, maternity, and more.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/insurance/compare/${params.matchup}` },
    openGraph: {
      title: `${profileA.name} vs ${profileB.name} — Plans, Coverage & Network Compared`,
      description,
      url: `${base}/insurance/compare/${params.matchup}`,
      type: "website",
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCheapestPremiumMin(profile: InsurerProfile): number {
  if (profile.plans.length === 0) return 0;
  return Math.min(...profile.plans.map((p) => p.premiumRange.min));
}

function getMostExpensivePremiumMax(profile: InsurerProfile): number {
  if (profile.plans.length === 0) return 0;
  return Math.max(...profile.plans.map((p) => p.premiumRange.max));
}

function getCopayRange(profile: InsurerProfile): string {
  const copays = profile.plans.map((p) => p.copayOutpatient);
  const min = Math.min(...copays);
  const max = Math.max(...copays);
  if (min === max) return `${min}%`;
  return `${min}% – ${max}%`;
}

function hasCoverageAcrossPlans(profile: InsurerProfile, key: keyof InsurerProfile["plans"][0]["coverage"]): boolean {
  return profile.plans.some((p) => p.coverage[key]);
}

function getStrongestCity(stats: InsurerNetworkStats | undefined): string {
  if (!stats || stats.byCity.length === 0) return "N/A";
  return stats.byCity[0].cityName;
}

function getCityProviderCount(stats: InsurerNetworkStats | undefined, citySlug: string): number {
  if (!stats) return 0;
  const entry = stats.byCity.find((c) => c.citySlug === citySlug);
  return entry?.providerCount ?? 0;
}

function generateVerdict(
  profileA: InsurerProfile,
  profileB: InsurerProfile,
  statsA: InsurerNetworkStats | undefined,
  statsB: InsurerNetworkStats | undefined
): { chooseA: string; chooseB: string } {
  const reasonsA: string[] = [];
  const reasonsB: string[] = [];

  // Network size
  const netA = statsA?.totalProviders ?? 0;
  const netB = statsB?.totalProviders ?? 0;
  if (netA > netB) {
    reasonsA.push("a larger provider network");
  } else if (netB > netA) {
    reasonsB.push("a larger provider network");
  }

  // Premium (cheaper)
  const cheapA = getCheapestPremiumMin(profileA);
  const cheapB = getCheapestPremiumMin(profileB);
  if (cheapA > 0 && cheapB > 0) {
    if (cheapA < cheapB) {
      reasonsA.push("lower entry-level premiums");
    } else if (cheapB < cheapA) {
      reasonsB.push("lower entry-level premiums");
    }
  }

  // More plans
  if (profileA.plans.length > profileB.plans.length) {
    reasonsA.push("more plan tiers to choose from");
  } else if (profileB.plans.length > profileA.plans.length) {
    reasonsB.push("more plan tiers to choose from");
  }

  // Coverage breadth
  const coverageKeysA = profileA.plans.reduce((sum, p) => {
    return sum + Object.values(p.coverage).filter(Boolean).length;
  }, 0);
  const coverageKeysB = profileB.plans.reduce((sum, p) => {
    return sum + Object.values(p.coverage).filter(Boolean).length;
  }, 0);
  if (coverageKeysA > coverageKeysB) {
    reasonsA.push("more comprehensive coverage options");
  } else if (coverageKeysB > coverageKeysA) {
    reasonsB.push("more comprehensive coverage options");
  }

  // City coverage spread
  const citiesA = statsA?.byCity.length ?? 0;
  const citiesB = statsB?.byCity.length ?? 0;
  if (citiesA > citiesB) {
    reasonsA.push(`presence in ${citiesA} cities`);
  } else if (citiesB > citiesA) {
    reasonsB.push(`presence in ${citiesB} cities`);
  }

  const chooseA = reasonsA.length > 0
    ? reasonsA.join(", ")
    : "strong coverage and established reputation";
  const chooseB = reasonsB.length > 0
    ? reasonsB.join(", ")
    : "strong coverage and established reputation";

  return { chooseA, chooseB };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function MatchupPage({ params }: Props) {
  const parsed = parseMatchupSlug(params.matchup);
  if (!parsed) notFound();

  const profileA = getInsurerProfile(parsed.slugA);
  const profileB = getInsurerProfile(parsed.slugB);
  if (!profileA || !profileB) notFound();

  let statsA: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  let statsB: Awaited<ReturnType<typeof getInsurerNetworkStats>> | undefined;
  try {
    [statsA, statsB] = await Promise.all([
      getInsurerNetworkStats(parsed.slugA),
      getInsurerNetworkStats(parsed.slugB),
    ]);
  } catch (e) {
    console.error(`[insurance/compare/${params.matchup}] Failed to load stats:`, e instanceof Error ? e.message : e);
  }
  const base = getBaseUrl();
  const cities = getCities();

  const cheapestA = getCheapestPremiumMin(profileA);
  const cheapestB = getCheapestPremiumMin(profileB);
  const verdict = generateVerdict(profileA, profileB, statsA, statsB);

  // All cities that either insurer covers
  const allCitySlugs = new Set<string>();
  statsA?.byCity.forEach((c) => allCitySlugs.add(c.citySlug));
  statsB?.byCity.forEach((c) => allCitySlugs.add(c.citySlug));
  const citiesInNetwork = cities
    .filter((c) => allCitySlugs.has(c.slug))
    .sort((a, b) => {
      const totalA = getCityProviderCount(statsA, a.slug) + getCityProviderCount(statsB, a.slug);
      const totalB = getCityProviderCount(statsA, b.slug) + getCityProviderCount(statsB, b.slug);
      return totalB - totalA;
    });

  // Determine strongest city for each insurer (by count where the other is weaker)
  const strongCityA = getStrongestCity(statsA);
  const strongCityB = getStrongestCity(statsB);

  // Get other popular matchups for cross-links
  const allMatchups = await getAllMatchups();
  const otherMatchups = allMatchups
    .filter((m) => m.slug !== params.matchup)
    .filter((m) =>
      m.slugA === parsed.slugA || m.slugA === parsed.slugB ||
      m.slugB === parsed.slugA || m.slugB === parsed.slugB
    )
    .slice(0, 6);

  // Fill remaining cross-link slots with top matchups
  if (otherMatchups.length < 6) {
    const remaining = allMatchups
      .filter((m) => m.slug !== params.matchup && !otherMatchups.find((o) => o.slug === m.slug))
      .slice(0, 6 - otherMatchups.length);
    otherMatchups.push(...remaining);
  }

  // FAQs
  const faqs = [
    {
      question: `Which is better, ${profileA.name} or ${profileB.name}?`,
      answer: `It depends on your needs. ${profileA.name} has ${statsA?.totalProviders.toLocaleString() ?? "0"} providers across ${statsA?.byCity.length ?? 0} cities and offers ${profileA.plans.length} plans starting from AED ${cheapestA.toLocaleString()}/yr. ${profileB.name} has ${statsB?.totalProviders.toLocaleString() ?? "0"} providers across ${statsB?.byCity.length ?? 0} cities with ${profileB.plans.length} plans from AED ${cheapestB.toLocaleString()}/yr. Choose ${profileA.name} if you need ${verdict.chooseA}. Choose ${profileB.name} if you prioritise ${verdict.chooseB}.`,
    },
    {
      question: `Is ${profileA.name} cheaper than ${profileB.name}?`,
      answer: cheapestA < cheapestB
        ? `Yes, ${profileA.name}'s entry-level plan starts from AED ${cheapestA.toLocaleString()}/yr, compared to ${profileB.name}'s cheapest plan at AED ${cheapestB.toLocaleString()}/yr. However, plan pricing varies by age, nationality, visa type, and employer. Enhanced and premium tiers may differ. Always obtain a personalised quote from each insurer.`
        : cheapestA > cheapestB
          ? `No, ${profileB.name}'s entry-level plan starts from AED ${cheapestB.toLocaleString()}/yr, while ${profileA.name}'s cheapest plan begins at AED ${cheapestA.toLocaleString()}/yr. Pricing varies significantly by age, nationality, and plan tier, so obtain personalised quotes from both insurers.`
          : `Both ${profileA.name} and ${profileB.name} have entry-level plans starting from AED ${cheapestA.toLocaleString()}/yr. However, pricing varies by age, nationality, visa type, and employer. Compare enhanced and premium tiers for a full picture, and always obtain personalised quotes.`,
    },
    {
      question: `Which has a bigger network in Dubai, ${profileA.name} or ${profileB.name}?`,
      answer: (() => {
        const dubaiA = getCityProviderCount(statsA, "dubai");
        const dubaiB = getCityProviderCount(statsB, "dubai");
        if (dubaiA > dubaiB) {
          return `${profileA.name} has a larger Dubai network with ${dubaiA.toLocaleString()} providers, compared to ${profileB.name}'s ${dubaiB.toLocaleString()} providers. This includes hospitals, clinics, dental practices, and specialist centres listed in the UAE Open Healthcare Directory.`;
        } else if (dubaiB > dubaiA) {
          return `${profileB.name} has a larger Dubai network with ${dubaiB.toLocaleString()} providers, compared to ${profileA.name}'s ${dubaiA.toLocaleString()} providers. Network sizes are based on the UAE Open Healthcare Directory data.`;
        }
        return `Both insurers have similar Dubai networks: ${profileA.name} with ${dubaiA.toLocaleString()} providers and ${profileB.name} with ${dubaiB.toLocaleString()} providers.`;
      })(),
    },
    {
      question: `Does ${profileA.name} or ${profileB.name} cover dental?`,
      answer: (() => {
        const dentalA = hasCoverageAcrossPlans(profileA, "dental");
        const dentalB = hasCoverageAcrossPlans(profileB, "dental");
        if (dentalA && dentalB) {
          const limitsA = profileA.plans.filter((p) => p.dentalLimit > 0).map((p) => p.dentalLimit);
          const limitsB = profileB.plans.filter((p) => p.dentalLimit > 0).map((p) => p.dentalLimit);
          const maxLimitA = limitsA.length > 0 ? Math.max(...limitsA) : 0;
          const maxLimitB = limitsB.length > 0 ? Math.max(...limitsB) : 0;
          return `Both insurers offer dental coverage on their enhanced and premium plans. ${profileA.name}'s dental sub-limit goes up to AED ${maxLimitA.toLocaleString()}/yr, while ${profileB.name} offers up to AED ${maxLimitB.toLocaleString()}/yr. Basic plans from both insurers typically exclude dental.`;
        }
        if (dentalA) return `${profileA.name} offers dental coverage on enhanced and premium tiers. ${profileB.name}'s plans do not include dental coverage.`;
        if (dentalB) return `${profileB.name} offers dental coverage on enhanced and premium tiers. ${profileA.name}'s plans do not include dental coverage.`;
        return `Neither ${profileA.name} nor ${profileB.name} currently includes dental coverage in their published plans. Contact both insurers directly for the latest plan options.`;
      })(),
    },
    {
      question: `Can I switch from ${profileA.name} to ${profileB.name}?`,
      answer: `Yes, you can switch insurers during your policy renewal period. In the UAE, health insurance is typically renewed annually. When switching from ${profileA.name} to ${profileB.name} (or vice versa), be aware of: (1) Pre-existing condition waiting periods may restart — check the new insurer's policy, (2) Maternity waiting periods usually reset, (3) Any ongoing treatment authorisations need to be re-submitted. Coordinate with your employer's HR department if on a group plan. Both ${profileA.name} and ${profileB.name} have dedicated claims and onboarding teams to facilitate the transition.`,
    },
    {
      question: `How do I compare ${profileA.name} and ${profileB.name} plans?`,
      answer: `Use the UAE Health Insurance Navigator on this page to compare ${profileA.name} and ${profileB.name} side-by-side. Key factors to compare: (1) Annual premium — ${profileA.name} starts from AED ${cheapestA.toLocaleString()}/yr, ${profileB.name} from AED ${cheapestB.toLocaleString()}/yr, (2) Network size — ${statsA?.totalProviders.toLocaleString() ?? "0"} vs ${statsB?.totalProviders.toLocaleString() ?? "0"} providers, (3) Coverage — dental, optical, maternity, and mental health inclusion, (4) Co-pay percentages, and (5) Provider availability in your city. Scroll down for the full comparison table.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD Structured Data */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Insurance Navigator", url: `${base}/insurance` },
          { name: "Compare Plans", url: `${base}/insurance/compare` },
          { name: `${profileA.name} vs ${profileB.name}` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Insurance Navigator", href: "/insurance" },
          { label: "Compare Plans", href: "/insurance/compare" },
          { label: `${profileA.name} vs ${profileB.name}` },
        ]}
      />

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {profileA.name} vs {profileB.name}
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          UAE Health Insurance Comparison 2026
        </p>

        {/* Side-by-side hero stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Insurer A */}
          <div className="border border-black/[0.06] rounded-2xl p-5 bg-white">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2 className="text-lg font-bold text-[#1c1c1c]">{profileA.name}</h2>
              <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{profileA.type}</span>
            </div>
            <div className="space-y-1.5 text-xs text-black/40">
              <p><span className="font-bold text-[#1c1c1c]">{statsA?.totalProviders.toLocaleString() ?? "0"}</span> providers</p>
              <p><span className="font-bold text-[#1c1c1c]">{profileA.plans.length}</span> plan{profileA.plans.length !== 1 ? "s" : ""}</p>
              <p>Est. <span className="font-bold text-[#1c1c1c]">{profileA.foundedYear}</span></p>
              <p>{profileA.regulators.map((r) => r.toUpperCase()).join(", ")} regulated</p>
            </div>
          </div>

          {/* Insurer B */}
          <div className="border border-black/[0.06] rounded-2xl p-5 bg-white">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2 className="text-lg font-bold text-[#1c1c1c]">{profileB.name}</h2>
              <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] text-[9px] flex-shrink-0">{profileB.type}</span>
            </div>
            <div className="space-y-1.5 text-xs text-black/40">
              <p><span className="font-bold text-[#1c1c1c]">{statsB?.totalProviders.toLocaleString() ?? "0"}</span> providers</p>
              <p><span className="font-bold text-[#1c1c1c]">{profileB.plans.length}</span> plan{profileB.plans.length !== 1 ? "s" : ""}</p>
              <p>Est. <span className="font-bold text-[#1c1c1c]">{profileB.foundedYear}</span></p>
              <p>{profileB.regulators.map((r) => r.toUpperCase()).join(", ")} regulated</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Answer Block ─────────────────────────────────────────────────────── */}
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
          {profileA.name} has {profileA.plans.length} plan{profileA.plans.length !== 1 ? "s" : ""} starting
          from AED {cheapestA.toLocaleString()}/yr with {statsA?.totalProviders.toLocaleString() ?? "0"} providers
          across {statsA?.byCity.length ?? 0} cities.{" "}
          {profileB.name} has {profileB.plans.length} plan{profileB.plans.length !== 1 ? "s" : ""} starting
          from AED {cheapestB.toLocaleString()}/yr with {statsB?.totalProviders.toLocaleString() ?? "0"} providers
          across {statsB?.byCity.length ?? 0} cities.{" "}
          {strongCityA !== strongCityB
            ? `${profileA.name} is strongest in ${strongCityA} while ${profileB.name} has the most providers in ${strongCityB}.`
            : `Both insurers have their strongest presence in ${strongCityA}.`}
        </p>
      </div>

      {/* ── Side-by-Side Comparison Table ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{profileA.name} vs {profileB.name} — At a Glance</h2>
      </div>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#1c1c1c] text-white">
              <th className="px-3 py-2 text-left font-semibold w-1/3">Attribute</th>
              <th className="px-3 py-2 text-left font-semibold w-1/3">{profileA.name}</th>
              <th className="px-3 py-2 text-left font-semibold w-1/3">{profileB.name}</th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Type"
              valueA={profileA.type}
              valueB={profileB.type}
              idx={0}
            />
            <ComparisonRow
              label="Founded"
              valueA={String(profileA.foundedYear)}
              valueB={String(profileB.foundedYear)}
              idx={1}
            />
            <ComparisonRow
              label="Headquarters"
              valueA={profileA.headquarters}
              valueB={profileB.headquarters}
              idx={2}
            />
            <ComparisonRow
              label="Regulators"
              valueA={profileA.regulators.map((r) => r.toUpperCase()).join(", ")}
              valueB={profileB.regulators.map((r) => r.toUpperCase()).join(", ")}
              idx={3}
            />
            <ComparisonRow
              label="Number of Plans"
              valueA={String(profileA.plans.length)}
              valueB={String(profileB.plans.length)}
              idx={4}
              highlightHigher
            />
            <ComparisonRow
              label="Premium Range"
              valueA={`AED ${cheapestA.toLocaleString()} – ${getMostExpensivePremiumMax(profileA).toLocaleString()}`}
              valueB={`AED ${cheapestB.toLocaleString()} – ${getMostExpensivePremiumMax(profileB).toLocaleString()}`}
              idx={5}
            />
            <ComparisonRow
              label="Total Network Size"
              valueA={(statsA?.totalProviders ?? 0).toLocaleString()}
              valueB={(statsB?.totalProviders ?? 0).toLocaleString()}
              idx={6}
              highlightHigher
            />
            <ComparisonRow
              label="Cities Covered"
              valueA={String(statsA?.byCity.length ?? 0)}
              valueB={String(statsB?.byCity.length ?? 0)}
              idx={7}
              highlightHigher
            />
            <CoverageRow
              label="Dental"
              hasA={hasCoverageAcrossPlans(profileA, "dental")}
              hasB={hasCoverageAcrossPlans(profileB, "dental")}
              idx={8}
            />
            <CoverageRow
              label="Optical"
              hasA={hasCoverageAcrossPlans(profileA, "optical")}
              hasB={hasCoverageAcrossPlans(profileB, "optical")}
              idx={9}
            />
            <CoverageRow
              label="Maternity"
              hasA={hasCoverageAcrossPlans(profileA, "maternity")}
              hasB={hasCoverageAcrossPlans(profileB, "maternity")}
              idx={10}
            />
            <CoverageRow
              label="Mental Health"
              hasA={hasCoverageAcrossPlans(profileA, "mentalHealth")}
              hasB={hasCoverageAcrossPlans(profileB, "mentalHealth")}
              idx={11}
            />
            <CoverageRow
              label="International"
              hasA={hasCoverageAcrossPlans(profileA, "internationalCoverage")}
              hasB={hasCoverageAcrossPlans(profileB, "internationalCoverage")}
              idx={12}
            />
            <ComparisonRow
              label="Co-pay Range"
              valueA={getCopayRange(profileA)}
              valueB={getCopayRange(profileB)}
              idx={13}
            />
            <ComparisonRow
              label="Claims Phone"
              valueA={profileA.claimsPhone}
              valueB={profileB.claimsPhone}
              idx={14}
            />
          </tbody>
        </table>
        <p className="text-[10px] text-black/40 mt-1.5">
          Coverage columns reflect whether at least one plan from the insurer includes that benefit. Premiums are indicative annual ranges.
        </p>
      </div>

      {/* ── Network Comparison by City ───────────────────────────────────────── */}
      {citiesInNetwork.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Network Comparison by City</h2>
          </div>
          <div className="mb-10 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#1c1c1c] text-white">
                  <th className="px-3 py-2 text-left font-semibold">City</th>
                  <th className="px-3 py-2 text-right font-semibold">{profileA.name}</th>
                  <th className="px-3 py-2 text-center font-semibold w-24">vs</th>
                  <th className="px-3 py-2 text-left font-semibold">{profileB.name}</th>
                </tr>
              </thead>
              <tbody>
                {citiesInNetwork.map((city, i) => {
                  const countA = getCityProviderCount(statsA, city.slug);
                  const countB = getCityProviderCount(statsB, city.slug);
                  const maxCount = Math.max(countA, countB, 1);
                  const barWidthA = (countA / maxCount) * 100;
                  const barWidthB = (countB / maxCount) * 100;

                  return (
                    <tr key={city.slug} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}>
                      <td className="px-3 py-2.5 font-medium text-[#1c1c1c] border-b border-black/[0.06]">
                        {city.name}
                      </td>
                      <td className="px-3 py-2.5 border-b border-black/[0.06]">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-bold ${countA >= countB && countA > 0 ? "text-[#00c853]" : "text-black/40"}`}>
                            {countA.toLocaleString()}
                          </span>
                          <div className="w-20 h-3 bg-[#f8f8f6] overflow-hidden" style={{ direction: "rtl" }}>
                            <div
                              className={`h-full ${countA >= countB ? "bg-[#00c853]" : "bg-light-300"}`}
                              style={{ width: `${barWidthA}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-black/[0.06] text-center text-black/40">
                        vs
                      </td>
                      <td className="px-3 py-2.5 border-b border-black/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-3 bg-[#f8f8f6] overflow-hidden">
                            <div
                              className={`h-full ${countB >= countA ? "bg-[#00c853]" : "bg-light-300"}`}
                              style={{ width: `${barWidthB}%` }}
                            />
                          </div>
                          <span className={`font-bold ${countB >= countA && countB > 0 ? "text-[#00c853]" : "text-black/40"}`}>
                            {countB.toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-black/40 mt-1.5">
              Provider counts from the UAE Open Healthcare Directory. Green highlights the city leader.
            </p>
          </div>
        </>
      )}

      {/* ── Plan-Level Comparison ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{profileA.name} Plans</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {profileA.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            insurerName={profileA.name}
            insurerSlug={profileA.slug}
            networkSize={statsA?.totalProviders}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{profileB.name} Plans</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {profileB.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            insurerName={profileB.name}
            insurerSlug={profileB.slug}
            networkSize={statsB?.totalProviders}
          />
        ))}
      </div>

      {/* ── Verdict ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#f8f8f6] border border-black/[0.06] p-5 mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Verdict</h2>
        </div>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            <strong>Choose {profileA.name}</strong> if you need {verdict.chooseA}.{" "}
            <strong>Choose {profileB.name}</strong> if you prioritise {verdict.chooseB}.{" "}
            Both are established insurers in the UAE market. The best choice depends on your
            employer&apos;s plan options, budget, required coverage, and preferred hospital network
            in your city.
          </p>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <FaqSection
        faqs={faqs}
        title={`${profileA.name} vs ${profileB.name} — FAQ`}
      />

      {/* ── Cross-Links ──────────────────────────────────────────────────────── */}
      <div className="mt-10 mb-8">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related Comparisons</h2>
        </div>

        {/* Links to each insurer's detail page + compare tool */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href={`/insurance/${profileA.slug}`}
            className="text-xs font-bold text-[#006828] hover:text-[#006828]-dark transition-colors border border-black/[0.06] px-3 py-2 bg-white hover:border-[#006828]/15"
          >
            {profileA.name} Plans &rarr;
          </Link>
          <Link
            href={`/insurance/${profileB.slug}`}
            className="text-xs font-bold text-[#006828] hover:text-[#006828]-dark transition-colors border border-black/[0.06] px-3 py-2 bg-white hover:border-[#006828]/15"
          >
            {profileB.name} Plans &rarr;
          </Link>
          <Link
            href="/insurance/compare"
            className="text-xs font-bold text-[#006828] hover:text-[#006828]-dark transition-colors border border-black/[0.06] px-3 py-2 bg-white hover:border-[#006828]/15"
          >
            Compare All Plans &rarr;
          </Link>
        </div>

        {/* Other popular matchups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherMatchups.map((m) => {
            const pA = getInsurerProfile(m.slugA)!;
            const pB = getInsurerProfile(m.slugB)!;
            return (
              <Link
                key={m.slug}
                href={`/insurance/compare/${m.slug}`}
                className="block border border-black/[0.06] bg-white p-3 hover:border-[#006828]/15 hover:shadow-sm transition-all group"
              >
                <span className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {pA.name} vs {pB.name}
                </span>
                <p className="text-[11px] text-[#006828] font-semibold mt-1">
                  Compare &rarr;
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Back ─────────────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <Link
          href="/insurance"
          className="flex items-center gap-1.5 text-sm text-[#006828] font-bold hover:text-[#006828]-dark"
        >
          <ArrowLeft className="w-4 h-4" /> All insurers
        </Link>
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Plan details, premiums, and network sizes are indicative,
          based on publicly available UAE insurance market data. Obtain personalised quotes from{" "}
          {profileA.name} and {profileB.name} or an authorised broker. Provider network data
          sourced from the UAE Open Healthcare Directory, last verified March 2026.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ComparisonRow({
  label,
  valueA,
  valueB,
  idx,
  highlightHigher,
}: {
  label: string;
  valueA: string;
  valueB: string;
  idx: number;
  highlightHigher?: boolean;
}) {
  let classA = "text-black/40";
  let classB = "text-black/40";

  if (highlightHigher) {
    const numA = parseFloat(valueA.replace(/,/g, ""));
    const numB = parseFloat(valueB.replace(/,/g, ""));
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA > numB) classA = "text-[#00c853] font-bold";
      else if (numB > numA) classB = "text-[#00c853] font-bold";
    }
  }

  return (
    <tr className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}>
      <td className="px-3 py-2 font-medium text-[#1c1c1c] border-b border-black/[0.06]">{label}</td>
      <td className={`px-3 py-2 border-b border-black/[0.06] ${classA}`}>{valueA}</td>
      <td className={`px-3 py-2 border-b border-black/[0.06] ${classB}`}>{valueB}</td>
    </tr>
  );
}

function CoverageRow({
  label,
  hasA,
  hasB,
  idx,
}: {
  label: string;
  hasA: boolean;
  hasB: boolean;
  idx: number;
}) {
  return (
    <tr className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}>
      <td className="px-3 py-2 font-medium text-[#1c1c1c] border-b border-black/[0.06]">{label}</td>
      <td className="px-3 py-2 border-b border-black/[0.06]">
        {hasA ? (
          <span className="text-[#00c853] font-bold">Yes</span>
        ) : (
          <span className="text-black/40">No</span>
        )}
      </td>
      <td className="px-3 py-2 border-b border-black/[0.06]">
        {hasB ? (
          <span className="text-[#00c853] font-bold">Yes</span>
        ) : (
          <span className="text-black/40">No</span>
        )}
      </td>
    </tr>
  );
}
