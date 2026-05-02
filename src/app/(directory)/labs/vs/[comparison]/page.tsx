/**
 * Head-to-head lab comparison pages.
 * Route: /labs/vs/[lab-a-slug]-vs-[lab-b-slug]
 *
 * Captures searches like "Al Borg vs Thumbay", "Medsol vs DarDoc prices",
 * "which lab is cheaper UAE".
 *
 * Pairs are generated for every viable combination of labs that share
 * at least 5 common tests. Canonical slug is alphabetically sorted
 * (a-slug < b-slug) and the reverse redirect is handled via
 * generateStaticParams returning both orderings.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  MapPin,
  Clock,
  Home,
  Star,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  LAB_PROFILES,
  LAB_TEST_PRICES,
  getLabProfile,
  getPricesForLab,
  getPackagesForLab,
  formatPrice,
  compareLabs,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

// ─── Revalidation ────────────────────────────────────────────────────────────

export const revalidate = 43200;

// ─── Pair Generation ─────────────────────────────────────────────────────────

/** Minimum number of shared tests for a comparison pair to be valid */
const MIN_COMMON_TESTS = 5;

/** High-priority pairs shown first in "Other Comparisons" and pre-rendered first */
const PRIORITY_PAIRS: [string, string][] = [
  ["al-borg-diagnostics", "thumbay-labs"],
  ["al-borg-diagnostics", "medsol-diagnostics"],
  ["medsol-diagnostics", "alpha-medical-lab"],
  ["al-borg-diagnostics", "metropolis-star"],
  ["thumbay-labs", "medsol-diagnostics"],
  ["dardoc", "healthchecks360"],
  ["al-borg-diagnostics", "unilabs"],
  ["thumbay-labs", "alpha-medical-lab"],
];

/** Returns the canonical slug for a pair: alphabetically sorted */
function canonicalSlug(slugA: string, slugB: string): string {
  const [a, b] = [slugA, slugB].sort();
  return `${a}-vs-${b}`;
}

/** Build all valid pairs (labs with >= MIN_COMMON_TESTS shared tests) */
function buildAllPairs(): [string, string][] {
  // Pre-compute test sets per lab
  const testSetByLab = new Map<string, Set<string>>();
  for (const lab of LAB_PROFILES) {
    const tests = new Set(LAB_TEST_PRICES.filter((p) => p.labSlug === lab.slug).map((p) => p.testSlug));
    testSetByLab.set(lab.slug, tests);
  }

  const seen = new Set<string>();
  const pairs: [string, string][] = [];

  // Priority pairs first
  for (const [a, b] of PRIORITY_PAIRS) {
    const key = canonicalSlug(a, b);
    if (seen.has(key)) continue;
    const setA = testSetByLab.get(a) ?? new Set();
    const setB = testSetByLab.get(b) ?? new Set();
    const common = Array.from(setA).filter((t) => setB.has(t)).length;
    if (common >= MIN_COMMON_TESTS) {
      pairs.push([a, b]);
      seen.add(key);
    }
  }

  // All remaining valid C(N,2) pairs
  for (let i = 0; i < LAB_PROFILES.length; i++) {
    for (let j = i + 1; j < LAB_PROFILES.length; j++) {
      const a = LAB_PROFILES[i].slug;
      const b = LAB_PROFILES[j].slug;
      const key = canonicalSlug(a, b);
      if (seen.has(key)) continue;
      const setA = testSetByLab.get(a) ?? new Set();
      const setB = testSetByLab.get(b) ?? new Set();
      const common = Array.from(setA).filter((t) => setB.has(t)).length;
      if (common >= MIN_COMMON_TESTS) {
        const [sortedA, sortedB] = [a, b].sort();
        pairs.push([sortedA, sortedB]);
        seen.add(key);
      }
    }
  }

  return pairs;
}

/** Parse "lab-a-slug-vs-lab-b-slug" into [slugA, slugB] */
function parseComparison(param: string): [string, string] | null {
  // Find "-vs-" separator; both slugs contain hyphens so we try all positions
  const idx = param.indexOf("-vs-");
  if (idx === -1) return null;
  const a = param.slice(0, idx);
  const b = param.slice(idx + 4);
  if (!a || !b) return null;
  return [a, b];
}

// ─── generateStaticParams ─────────────────────────────────────────────────────

export function generateStaticParams(): { comparison: string }[] {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const pairs = buildAllPairs();
  const params: { comparison: string }[] = [];

  for (const [a, b] of pairs) {
    // Both orderings so users can type either URL and land on real content
    params.push({ comparison: `${a}-vs-${b}` });
    if (a !== b) {
      params.push({ comparison: `${b}-vs-${a}` });
    }
  }

  return params;
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparison: string }>;
}): Promise<Metadata> {
  const { comparison } = await params;
  const base = getBaseUrl();
  const parsed = parseComparison(comparison);
  if (!parsed) return { title: "Lab Comparison | UAE Lab Tests" };

  const [slugA, slugB] = parsed;
  const labA = getLabProfile(slugA);
  const labB = getLabProfile(slugB);
  if (!labA || !labB) return { title: "Lab Comparison | UAE Lab Tests" };

  const comparisonData = compareLabs([slugA, slugB]);
  const testCount = comparisonData?.commonTests.length ?? 0;

  const title = `${labA.name} vs ${labB.name} — Price Comparison for ${testCount}+ Tests | UAE`;
  const description =
    `Compare ${labA.name} and ${labB.name} side-by-side: test prices, accreditations, ` +
    `home collection, turnaround times, and branch coverage across the UAE. ` +
    `Find out which lab is cheaper for CBC, Vitamin D, HbA1c, and more.`;

  // Canonical uses alphabetically sorted slug
  const [ca, cb] = [slugA, slugB].sort();
  const canonical = `${base}/labs/vs/${ca}-vs-${cb}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function regulatorLabel(code: string): string {
  if (code === "dha") return "DHA";
  if (code === "doh") return "DOH";
  if (code === "mohap") return "MOHAP";
  return code.toUpperCase();
}

function regulatorDesc(codes: string[]): string {
  return codes.map(regulatorLabel).join(", ");
}

function pctDiff(a: number, b: number): number {
  if (a === 0) return 0;
  return Math.round(Math.abs(a - b) / Math.max(a, b) * 100);
}

function avgPrice(labSlug: string): number {
  const prices = LAB_TEST_PRICES.filter((p) => p.labSlug === labSlug);
  if (prices.length === 0) return 0;
  return Math.round(prices.reduce((s, p) => s + p.price, 0) / prices.length);
}

function cheapestPrice(labSlug: string): number {
  const prices = LAB_TEST_PRICES.filter((p) => p.labSlug === labSlug);
  if (prices.length === 0) return 0;
  return Math.min(...prices.map((p) => p.price));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LabComparisonPage({
  params,
}: {
  params: Promise<{ comparison: string }>;
}) {
  const { comparison } = await params;
  const base = getBaseUrl();

  const parsed = parseComparison(comparison);
  if (!parsed) notFound();

  const [slugA, slugB] = parsed;
  const labA = getLabProfile(slugA);
  const labB = getLabProfile(slugB);
  if (!labA || !labB) notFound();

  const compData = compareLabs([slugA, slugB]);
  if (!compData || compData.commonTests.length < MIN_COMMON_TESTS) notFound();

  const { priceMatrix } = compData;

  // Compute win counts
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  for (const row of priceMatrix) {
    const pa = row.prices.find((p) => p.labSlug === slugA)?.price ?? null;
    const pb = row.prices.find((p) => p.labSlug === slugB)?.price ?? null;
    if (pa !== null && pb !== null) {
      if (pa < pb) aWins++;
      else if (pb < pa) bWins++;
      else ties++;
    }
  }

  const avgA = avgPrice(slugA);
  const avgB = avgPrice(slugB);
  const cheapA = cheapestPrice(slugA);
  const cheapB = cheapestPrice(slugB);
  const overallDiff = pctDiff(avgA, avgB);
  const overallCheaper = avgA < avgB ? labA.name : avgB < avgA ? labB.name : null;

  const packagesA = getPackagesForLab(slugA);
  const packagesB = getPackagesForLab(slugB);

  // Canonical URL
  const [ca, cb] = [slugA, slugB].sort();
  const canonicalUrl = `${base}/labs/vs/${ca}-vs-${cb}`;

  // ─── Other comparison links ──────────────────────────────────────────────
  const allPairs = buildAllPairs();
  const otherComparisons: { slug: string; labA: string; labB: string }[] = [];
  for (const [pa, pb] of allPairs) {
    if ((pa === slugA && pb === slugB) || (pa === slugB && pb === slugA)) continue;
    if (pa !== slugA && pa !== slugB && pb !== slugA && pb !== slugB) continue;
    const la = getLabProfile(pa);
    const lb = getLabProfile(pb);
    if (la && lb) {
      otherComparisons.push({ slug: `${pa}-vs-${pb}`, labA: la.name, labB: lb.name });
    }
    if (otherComparisons.length >= 8) break;
  }

  // ─── FAQs ────────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: `Which is cheaper, ${labA.name} or ${labB.name}?`,
      answer:
        overallCheaper
          ? `${overallCheaper} is cheaper on average across all common tests, with an average test price of ${formatPrice(avgA < avgB ? avgA : avgB)} compared to ${formatPrice(avgA < avgB ? avgB : avgA)} — a ${overallDiff}% difference. However, the winner varies by test: ${labA.name} is cheaper on ${aWins} test${aWins !== 1 ? "s" : ""} while ${labB.name} is cheaper on ${bWins}. Check the "Who Wins by Test" table above for individual test prices.`
          : `${labA.name} and ${labB.name} have very similar average prices. Check the "Who Wins by Test" table above to see which lab offers a better price for the specific test you need.`,
    },
    {
      question: `Does ${labA.name} or ${labB.name} have better accreditation?`,
      answer:
        `${labA.name} holds ${labA.accreditations.join(", ")} accreditations. ` +
        `${labB.name} holds ${labB.accreditations.join(", ")} accreditations. ` +
        `CAP (College of American Pathologists) and JCI are the most recognised international standards for UAE diagnostic labs. ` +
        `ISO 15189 is the international standard specifically for medical laboratories. ` +
        `Both labs are licensed by the relevant UAE health authority (${regulatorDesc(labA.regulators)} and ${regulatorDesc(labB.regulators)} respectively).`,
    },
    {
      question: `Which lab offers home collection — ${labA.name} or ${labB.name}?`,
      answer:
        labA.homeCollection && labB.homeCollection
          ? `Both ${labA.name} and ${labB.name} offer home sample collection. ${labA.name} charges ${labA.homeCollectionFee === 0 ? "free" : `AED ${labA.homeCollectionFee}`} for home collection${labA.homeCollectionFee === 0 ? " (free)" : ""}. ${labB.name} charges ${labB.homeCollectionFee === 0 ? "free" : `AED ${labB.homeCollectionFee}`}${labB.homeCollectionFee === 0 ? " (free)" : ""}. Home collection avoids travel and is especially convenient for fasting tests.`
          : labA.homeCollection
          ? `${labA.name} offers home collection${labA.homeCollectionFee === 0 ? " free of charge" : ` for AED ${labA.homeCollectionFee}`}. ${labB.name} does not currently offer home collection for this comparison — visit a branch directly.`
          : labB.homeCollection
          ? `${labB.name} offers home collection${labB.homeCollectionFee === 0 ? " free of charge" : ` for AED ${labB.homeCollectionFee}`}. ${labA.name} does not currently offer home collection — visit a branch directly.`
          : `Neither ${labA.name} nor ${labB.name} currently offers home collection. Both require an in-branch visit.`,
    },
    {
      question: `Which lab has more branches in Dubai?`,
      answer:
        `${labA.name} has ${labA.branchCount} branch${labA.branchCount !== 1 ? "es" : ""} across ${labA.cities.join(", ")}. ` +
        `${labB.name} has ${labB.branchCount > 0 ? labB.branchCount : "no walk-in"} branch${labB.branchCount !== 1 ? "es" : ""}${labB.branchCount > 0 ? ` across ${labB.cities.join(", ")}` : " — it operates as a home-service platform"}. ` +
        `More branches generally means shorter travel time and faster walk-in service.`,
    },
    {
      question: `How fast do ${labA.name} and ${labB.name} return results?`,
      answer:
        `${labA.name} typically returns routine test results in ${labA.turnaroundHours} hours. ` +
        `${labB.name} typically returns results in ${labB.turnaroundHours} hours. ` +
        `Turnaround may vary by specific test — complex panels (AMH, food intolerance, genetic tests) take longer regardless of which lab you use. ` +
        `Both labs provide digital results via their patient portals.`,
    },
  ];

  // ─── JSON-LD ─────────────────────────────────────────────────────────────
  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Lab Test Comparison", url: `${base}/labs` },
    { name: "Compare Labs", url: `${base}/labs/compare` },
    { name: `${labA.name} vs ${labB.name}`, url: canonicalUrl },
  ]);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    name: `${labA.name} vs ${labB.name} — Price Comparison`,
    url: canonicalUrl,
    description: `Head-to-head price comparison of ${labA.name} and ${labB.name} for ${priceMatrix.length} UAE lab tests.`,
    mainEntity: {
      "@type": "ItemList",
      name: `${labA.name} vs ${labB.name} Test Price Comparison`,
      numberOfItems: priceMatrix.length,
      itemListElement: priceMatrix.slice(0, 10).map((row, i) => {
        const pa = row.prices.find((p) => p.labSlug === slugA)?.price;
        const pb = row.prices.find((p) => p.labSlug === slugB)?.price;
        return {
          "@type": "ListItem",
          position: i + 1,
          name: row.testName,
          description: `${labA.name}: ${pa != null ? formatPrice(pa) : "N/A"} | ${labB.name}: ${pb != null ? formatPrice(pb) : "N/A"}`,
        };
      }),
    },
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbs} />
      <JsonLd data={speakableSchema([".answer-block", ".comparison-summary"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={webPageSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Comparison", href: "/labs" },
          { label: "Compare Labs", href: "/labs/compare" },
          { label: `${labA.name} vs ${labB.name}` },
        ]}
      />

      {/* ── H1 ──────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <ArrowLeftRight className="w-7 h-7 text-[#006828] flex-shrink-0" />
          <h1 className="text-2xl sm:font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight leading-tight">
            {labA.name} vs {labB.name}
            <span className="block sm:inline text-black/40 font-normal text-lg ml-0 sm:ml-2">
              — Complete Price Comparison
            </span>
          </h1>
        </div>

        {/* Answer block — speakable, LLM-citable */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5 sm:p-5 mb-6">
          <p className="text-sm sm:text-base text-[#1c1c1c] leading-relaxed">
            According to the UAE Open Healthcare Directory,{" "}
            <strong>{labA.name}</strong> averages{" "}
            <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{formatPrice(avgA)}</span> per test
            while <strong>{labB.name}</strong> averages{" "}
            <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{formatPrice(avgB)}</span> —{" "}
            {overallDiff > 0 ? (
              <>
                a <strong>{overallDiff}% difference</strong>.{" "}
                <strong>{overallCheaper}</strong> is cheaper overall across common tests,
                but the advantage reverses on specific panels.{" "}
              </>
            ) : (
              <>pricing is nearly identical on average. </>
            )}
            {labA.name} wins on{" "}
            <strong>
              {aWins} out of {priceMatrix.length}
            </strong>{" "}
            shared tests; {labB.name} wins on <strong>{bWins}</strong>
            {ties > 0 ? `, with ${ties} tie${ties !== 1 ? "s" : ""}` : ""}.
            Both labs are licensed by{" "}
            {Array.from(new Set([...labA.regulators, ...labB.regulators]))
              .map(regulatorLabel)
              .join(", ")}
            .
          </p>
        </div>
      </div>

      {/* ── Head-to-Head Stats ───────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Head-to-Head Overview</h2>
        </div>

        <div className="comparison-summary overflow-x-auto">
          <table className="w-full text-sm border border-black/[0.06]">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left p-3 text-black/40 font-medium w-36 sm:w-48"></th>
                <th className="p-3 text-center font-bold text-[#1c1c1c] border-l border-black/[0.06]">
                  {labA.name}
                </th>
                <th className="p-3 text-center font-bold text-[#1c1c1c] border-l border-black/[0.06]">
                  {labB.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: "Tests listed",
                  a: getPricesForLab(slugA).length.toString(),
                  b: getPricesForLab(slugB).length.toString(),
                  highlight: (av: string, bv: string) => parseInt(av) > parseInt(bv) ? "a" : parseInt(bv) > parseInt(av) ? "b" : null,
                },
                {
                  label: "Avg price / test",
                  a: formatPrice(avgA),
                  b: formatPrice(avgB),
                  highlight: () => avgA < avgB ? "a" : avgB < avgA ? "b" : null,
                },
                {
                  label: "Cheapest test",
                  a: formatPrice(cheapA),
                  b: formatPrice(cheapB),
                  highlight: () => cheapA < cheapB ? "a" : cheapB < cheapA ? "b" : null,
                },
                {
                  label: "Accreditations",
                  a: labA.accreditations.join(", "),
                  b: labB.accreditations.join(", "),
                  highlight: () => null,
                },
                {
                  label: "Home collection",
                  a: labA.homeCollection
                    ? labA.homeCollectionFee === 0
                      ? "Free"
                      : `AED ${labA.homeCollectionFee}`
                    : "No",
                  b: labB.homeCollection
                    ? labB.homeCollectionFee === 0
                      ? "Free"
                      : `AED ${labB.homeCollectionFee}`
                    : "No",
                  highlight: () => {
                    if (!labA.homeCollection && !labB.homeCollection) return null;
                    if (!labA.homeCollection) return "b";
                    if (!labB.homeCollection) return "a";
                    return labA.homeCollectionFee <= labB.homeCollectionFee ? "a" : "b";
                  },
                },
                {
                  label: "Turnaround",
                  a: `${labA.turnaroundHours}h`,
                  b: `${labB.turnaroundHours}h`,
                  highlight: () =>
                    labA.turnaroundHours < labB.turnaroundHours
                      ? "a"
                      : labB.turnaroundHours < labA.turnaroundHours
                      ? "b"
                      : null,
                },
                {
                  label: "Branches",
                  a: labA.branchCount > 0 ? labA.branchCount.toString() : "Home-only",
                  b: labB.branchCount > 0 ? labB.branchCount.toString() : "Home-only",
                  highlight: () => null,
                },
                {
                  label: "Cities",
                  a: labA.cities.map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())).join(", "),
                  b: labB.cities.map((c) => c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())).join(", "),
                  highlight: () => null,
                },
                {
                  label: "Regulator",
                  a: regulatorDesc(labA.regulators),
                  b: regulatorDesc(labB.regulators),
                  highlight: () => null,
                },
                {
                  label: "Founded",
                  a: labA.foundedYear.toString(),
                  b: labB.foundedYear.toString(),
                  highlight: () => null,
                },
                {
                  label: "Headquarters",
                  a: labA.headquarters,
                  b: labB.headquarters,
                  highlight: () => null,
                },
              ].map((row, i) => {
                const winner = row.highlight(row.a, row.b);
                return (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}>
                    <td className="p-3 text-black/40 font-medium text-xs">{row.label}</td>
                    <td
                      className={`p-3 text-center text-xs border-l border-black/[0.06] ${
                        winner === "a" ? "text-[#006828] font-bold" : "text-[#1c1c1c]"
                      }`}
                    >
                      {winner === "a" && (
                        <Trophy className="w-3 h-3 inline mr-1 text-[#006828]" />
                      )}
                      {row.a}
                    </td>
                    <td
                      className={`p-3 text-center text-xs border-l border-black/[0.06] ${
                        winner === "b" ? "text-[#006828] font-bold" : "text-[#1c1c1c]"
                      }`}
                    >
                      {winner === "b" && (
                        <Trophy className="w-3 h-3 inline mr-1 text-[#006828]" />
                      )}
                      {row.b}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Who Wins by Test ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-2">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Who Wins by Test?</h2>
        </div>
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
          Cheaper price highlighted in green. Tests sorted by most popular first.
          Both labs must offer the test for it to appear here.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-black/[0.06]">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left p-3 text-black/40 font-medium">Test</th>
                <th className="p-3 text-center font-bold text-[#1c1c1c] border-l border-black/[0.06]">
                  {labA.name}
                </th>
                <th className="p-3 text-center font-bold text-[#1c1c1c] border-l border-black/[0.06]">
                  {labB.name}
                </th>
                <th className="p-3 text-center text-black/40 font-medium text-xs border-l border-black/[0.06]">
                  Winner
                </th>
              </tr>
            </thead>
            <tbody>
              {priceMatrix.map((row, i) => {
                const pa = row.prices.find((p) => p.labSlug === slugA)?.price ?? null;
                const pb = row.prices.find((p) => p.labSlug === slugB)?.price ?? null;
                const winnerSlug = row.cheapestLabSlug;
                const isTie = pa !== null && pb !== null && pa === pb;
                return (
                  <tr
                    key={row.testSlug}
                    className={i % 2 === 0 ? "bg-white" : "bg-[#f8f8f6]"}
                  >
                    <td className="p-3 text-[#1c1c1c] text-xs font-medium">
                      {row.testName}
                    </td>
                    <td
                      className={`p-3 text-center text-xs border-l border-black/[0.06] ${
                        winnerSlug === slugA && !isTie
                          ? "text-[#006828] font-bold"
                          : "text-[#1c1c1c]"
                      }`}
                    >
                      {pa != null ? formatPrice(pa) : <span className="text-black/40">—</span>}
                    </td>
                    <td
                      className={`p-3 text-center text-xs border-l border-black/[0.06] ${
                        winnerSlug === slugB && !isTie
                          ? "text-[#006828] font-bold"
                          : "text-[#1c1c1c]"
                      }`}
                    >
                      {pb != null ? formatPrice(pb) : <span className="text-black/40">—</span>}
                    </td>
                    <td className="p-3 text-center border-l border-black/[0.06]">
                      {isTie ? (
                        <span className="font-['Geist',sans-serif] text-xs text-black/40">Tie</span>
                      ) : winnerSlug === slugA ? (
                        <span className="text-xs font-semibold text-[#006828]">
                          {labA.name.split(" ")[0]}
                        </span>
                      ) : winnerSlug === slugB ? (
                        <span className="text-xs font-semibold text-[#006828]">
                          {labB.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="font-['Geist',sans-serif] text-xs text-black/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f8f8f6] border-t border-black/[0.06]">
                <td className="p-3 text-xs font-bold text-[#1c1c1c]">
                  Score ({priceMatrix.length} tests)
                </td>
                <td className="p-3 text-center border-l border-black/[0.06]">
                  <span
                    className={`text-xs font-bold ${
                      aWins > bWins ? "text-[#006828]" : "text-black/40"
                    }`}
                  >
                    {aWins} wins
                  </span>
                </td>
                <td className="p-3 text-center border-l border-black/[0.06]">
                  <span
                    className={`text-xs font-bold ${
                      bWins > aWins ? "text-[#006828]" : "text-black/40"
                    }`}
                  >
                    {bWins} wins
                  </span>
                </td>
                <td className="p-3 text-center border-l border-black/[0.06]">
                  {ties > 0 && (
                    <span className="font-['Geist',sans-serif] text-xs text-black/40">{ties} tie{ties !== 1 ? "s" : ""}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-2">
          <strong>{aWins > bWins ? labA.name : bWins > aWins ? labB.name : "Neither lab"}</strong>{" "}
          {aWins !== bWins
            ? `wins on ${Math.max(aWins, bWins)} out of ${priceMatrix.length} tests compared`
            : `— both labs are equally matched across ${priceMatrix.length} tests`}.
        </p>
      </section>

      {/* ── When to choose Lab A ─────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">When to Choose {labA.name}</h2>
        </div>

        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="text-sm text-[#1c1c1c] leading-relaxed mb-4">
            {labA.description}
          </p>
          <ul className="space-y-2">
            {labA.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <CheckCircle2 className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                {h}
              </li>
            ))}
            {aWins > bWins && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <CheckCircle2 className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                Cheaper on {aWins} of {priceMatrix.length} shared tests compared to {labB.name}
              </li>
            )}
            {labA.homeCollection && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <Home className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                Home collection{" "}
                {labA.homeCollectionFee === 0
                  ? "(free)"
                  : `for AED ${labA.homeCollectionFee}`}
              </li>
            )}
            {labA.branchCount > 0 && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <MapPin className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                {labA.branchCount} branch{labA.branchCount !== 1 ? "es" : ""} across{" "}
                {labA.cities.join(", ")}
              </li>
            )}
            <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
              <Clock className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
              Results typically in {labA.turnaroundHours} hours
            </li>
          </ul>
        </div>
      </section>

      {/* ── When to choose Lab B ─────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">When to Choose {labB.name}</h2>
        </div>

        <div className="bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="text-sm text-[#1c1c1c] leading-relaxed mb-4">
            {labB.description}
          </p>
          <ul className="space-y-2">
            {labB.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <CheckCircle2 className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                {h}
              </li>
            ))}
            {bWins > aWins && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <CheckCircle2 className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                Cheaper on {bWins} of {priceMatrix.length} shared tests compared to {labA.name}
              </li>
            )}
            {labB.homeCollection && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <Home className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                Home collection{" "}
                {labB.homeCollectionFee === 0
                  ? "(free)"
                  : `for AED ${labB.homeCollectionFee}`}
              </li>
            )}
            {labB.branchCount > 0 && (
              <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
                <MapPin className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
                {labB.branchCount} branch{labB.branchCount !== 1 ? "es" : ""} across{" "}
                {labB.cities.join(", ")}
              </li>
            )}
            <li className="flex items-start gap-2 text-sm text-[#1c1c1c]">
              <Clock className="w-4 h-4 text-[#006828] flex-shrink-0 mt-0.5" />
              Results typically in {labB.turnaroundHours} hours
            </li>
          </ul>
        </div>
      </section>

      {/* ── Health Packages Comparison ───────────────────────────────────── */}
      {(packagesA.length > 0 || packagesB.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Health Packages Comparison</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lab A packages */}
            <div>
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-3">{labA.name} Packages</h3>
              {packagesA.length > 0 ? (
                <div className="space-y-3">
                  {packagesA.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border border-black/[0.06] rounded-2xl p-5 bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{pkg.name}</p>
                        <div className="text-right flex-shrink-0">
                          {pkg.discountedPrice ? (
                            <>
                              <span className="text-xs line-through text-black/40">
                                {formatPrice(pkg.price)}
                              </span>
                              <span className="text-sm font-bold text-[#006828] ml-1">
                                {formatPrice(pkg.discountedPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-[#006828]">
                              {formatPrice(pkg.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-2">{pkg.targetAudience}</p>
                      <p className="text-xs text-[#1c1c1c]">
                        {pkg.biomarkerCount} biomarkers — {pkg.includes.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Geist',sans-serif] text-xs text-black/40 italic">No packages listed for {labA.name}.</p>
              )}
            </div>

            {/* Lab B packages */}
            <div>
              <h3 className="text-sm font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-3">{labB.name} Packages</h3>
              {packagesB.length > 0 ? (
                <div className="space-y-3">
                  {packagesB.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border border-black/[0.06] rounded-2xl p-5 bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight">{pkg.name}</p>
                        <div className="text-right flex-shrink-0">
                          {pkg.discountedPrice ? (
                            <>
                              <span className="text-xs line-through text-black/40">
                                {formatPrice(pkg.price)}
                              </span>
                              <span className="text-sm font-bold text-[#006828] ml-1">
                                {formatPrice(pkg.discountedPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-[#006828]">
                              {formatPrice(pkg.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-2">{pkg.targetAudience}</p>
                      <p className="text-xs text-[#1c1c1c]">
                        {pkg.biomarkerCount} biomarkers — {pkg.includes.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Geist',sans-serif] text-xs text-black/40 italic">No packages listed for {labB.name}.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Home Collection Comparison ───────────────────────────────────── */}
      {(labA.homeCollection || labB.homeCollection) && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Home Collection Comparison</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-black/[0.06] rounded-2xl p-5 bg-[#f8f8f6]">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-[#006828]" />
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{labA.name}</h3>
              </div>
              {labA.homeCollection ? (
                <>
                  <p className="text-xs text-[#1c1c1c] mb-1">
                    <strong>Fee:</strong>{" "}
                    {labA.homeCollectionFee === 0
                      ? "Free"
                      : `AED ${labA.homeCollectionFee}`}
                  </p>
                  <p className="text-xs text-[#1c1c1c] mb-1">
                    <strong>Coverage:</strong>{" "}
                    {labA.cities.join(", ")}
                  </p>
                  <p className="text-xs text-[#1c1c1c]">
                    <strong>Results:</strong> Within {labA.turnaroundHours} hours of sample
                    collection
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006828]" />
                    <span className="text-xs text-[#006828] font-medium">
                      Home collection available
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 mt-2">
                  <XCircle className="w-3.5 h-3.5 text-black/40" />
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    Walk-in branches only — no home collection
                  </span>
                </div>
              )}
            </div>

            <div className="border border-black/[0.06] rounded-2xl p-5 bg-[#f8f8f6]">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-[#006828]" />
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight">{labB.name}</h3>
              </div>
              {labB.homeCollection ? (
                <>
                  <p className="text-xs text-[#1c1c1c] mb-1">
                    <strong>Fee:</strong>{" "}
                    {labB.homeCollectionFee === 0
                      ? "Free"
                      : `AED ${labB.homeCollectionFee}`}
                  </p>
                  <p className="text-xs text-[#1c1c1c] mb-1">
                    <strong>Coverage:</strong>{" "}
                    {labB.cities.join(", ")}
                  </p>
                  <p className="text-xs text-[#1c1c1c]">
                    <strong>Results:</strong> Within {labB.turnaroundHours} hours of sample
                    collection
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006828]" />
                    <span className="text-xs text-[#006828] font-medium">
                      Home collection available
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 mt-2">
                  <XCircle className="w-3.5 h-3.5 text-black/40" />
                  <span className="font-['Geist',sans-serif] text-xs text-black/40">
                    Walk-in branches only — no home collection
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Other Comparisons ────────────────────────────────────────────── */}
      {otherComparisons.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Other Comparisons</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherComparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/labs/vs/${c.slug}`}
                className="flex items-center justify-between gap-2 border border-black/[0.06] bg-[#f8f8f6] hover:border-[#006828]/15 hover:bg-white transition-colors p-3"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-[#006828] flex-shrink-0" />
                  <span className="text-sm text-[#1c1c1c]">
                    {c.labA} vs {c.labB}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-black/40 flex-shrink-0" />
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link
              href="/labs/compare"
              className="text-sm text-[#006828] hover:underline"
            >
              Open the interactive comparison tool to compare any combination of labs →
            </Link>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <FaqSection
          faqs={faqs}
          title={`${labA.name} vs ${labB.name} — Frequently Asked Questions`}
        />
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative and sourced from publicly
          available lab price lists, aggregator platforms, and direct lab communications as of
          March 2026. Prices may vary by branch, insurance status, and current promotions.
          This comparison is for informational purposes only and does not constitute medical
          advice. Always confirm current pricing and insurance coverage directly with{" "}
          {labA.name} and {labB.name} before booking. All labs listed are licensed by the
          relevant UAE health authority ({regulatorDesc(Array.from(new Set([...labA.regulators, ...labB.regulators])))}).
        </p>
      </div>
    </div>
  );
}
