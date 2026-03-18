import type { JournalCategoryMeta } from "./types";

export const JOURNAL_CATEGORIES: JournalCategoryMeta[] = [
  {
    slug: "regulatory",
    name: "Regulatory & Policy",
    description:
      "Updates from DHA, DOH, MOHAP, and other UAE health authorities on licensing, compliance, and policy changes.",
    icon: "§",
  },
  {
    slug: "new-openings",
    name: "New Openings",
    description:
      "Clinics, hospitals, and healthcare facilities opening across the UAE and Middle East.",
    icon: "+",
  },
  {
    slug: "financial",
    name: "Finance & Investment",
    description:
      "Healthcare industry financials, M&A activity, funding rounds, and market projections for the UAE and GCC.",
    icon: "£",
  },
  {
    slug: "events",
    name: "Events & Conferences",
    description:
      "Healthcare conferences, exhibitions, summits, and networking events across the region.",
    icon: "◆",
  },
  {
    slug: "social-pulse",
    name: "Social Pulse",
    description:
      "Curated highlights from LinkedIn, X, and Instagram — what UAE healthcare leaders are talking about.",
    icon: "◎",
  },
  {
    slug: "thought-leadership",
    name: "Thought Leadership",
    description:
      "Expert perspectives, analysis, and op-eds from healthcare executives, physicians, and innovators.",
    icon: "¶",
  },
  {
    slug: "market-intelligence",
    name: "Market Intelligence",
    description:
      "Data-driven insights on patient volumes, insurance trends, facility utilization, and healthcare demand.",
    icon: "▲",
  },
  {
    slug: "technology",
    name: "Health Tech & Innovation",
    description:
      "Digital health, AI diagnostics, telemedicine platforms, and health tech startups transforming UAE healthcare.",
    icon: "⚡",
  },
  {
    slug: "workforce",
    name: "Workforce & Talent",
    description:
      "Hiring trends, licensing updates, salary benchmarks, and talent movement across UAE healthcare.",
    icon: "●",
  },
];

export function getJournalCategory(slug: string): JournalCategoryMeta | undefined {
  return JOURNAL_CATEGORIES.find((c) => c.slug === slug);
}
