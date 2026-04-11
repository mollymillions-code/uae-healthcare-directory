/**
 * Masthead — /intelligence/author
 *
 * Lists every active Zavis editorial author and every active external
 * reviewer. Both groups are gated by `is_active = true` at the data
 * helper layer, so placeholder reviewer slots stay hidden.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAllActiveAuthors,
  getAllActiveReviewers,
  type ReviewerProfile,
} from "@/lib/intelligence/authors";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ShieldCheck, Users } from "lucide-react";

export const revalidate = 3600;

const TITLE = "Masthead — Zavis Healthcare Industry Insights";
const DESCRIPTION =
  "The Zavis editorial masthead — every author and external reviewer who contributes to or signs off on our UAE healthcare coverage. Bylined for accountability, with credentials, expertise areas and conflict-of-interest disclosure.";

export async function generateMetadata(): Promise<Metadata> {
  const base = getBaseUrl();
  const url = `${base}/intelligence/author`;
  return {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `${base}/ar/intelligence/author`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url,
      images: [
        {
          url: `${base}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: "Zavis Masthead",
        },
      ],
    },
  };
}

const REVIEWER_TYPE_LABEL: Record<string, string> = {
  medical: "Medical Reviewers",
  industry: "Industry Reviewers",
  policy: "Policy Reviewers",
  economic: "Health Economics Reviewers",
  actuarial: "Actuarial Reviewers",
};
const REVIEWER_TYPE_ORDER = [
  "medical",
  "policy",
  "economic",
  "actuarial",
  "industry",
] as const;

function groupReviewersByType(
  reviewers: ReviewerProfile[]
): { type: string; label: string; reviewers: ReviewerProfile[] }[] {
  const byType = new Map<string, ReviewerProfile[]>();
  for (const r of reviewers) {
    const list = byType.get(r.reviewerType) ?? [];
    list.push(r);
    byType.set(r.reviewerType, list);
  }
  return REVIEWER_TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
    type: t,
    label: REVIEWER_TYPE_LABEL[t] ?? t,
    reviewers: byType.get(t) ?? [],
  }));
}

export default async function MastheadPage() {
  const base = getBaseUrl();
  const [authors, reviewers] = await Promise.all([
    getAllActiveAuthors(),
    getAllActiveReviewers(),
  ]);
  const groupedReviewers = groupReviewersByType(reviewers);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Zavis", url: base },
          { name: "Intelligence", url: `${base}/intelligence` },
          { name: "Masthead", url: `${base}/intelligence/author` },
        ])}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-2">
          Zavis Healthcare Industry Insights
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[28px] sm:text-[36px] text-[#1c1c1c] tracking-tight mb-4">
          Editorial Masthead
        </h1>
        <p className="max-w-3xl font-['Geist',sans-serif] text-[15px] text-black/55 leading-relaxed mb-10">
          Every author who writes Zavis Intelligence coverage and every external
          reviewer who signs off on our clinical and policy work is listed here
          with full credentials and expertise areas. We name the people behind
          the work because trust in healthcare reporting depends on it.
        </p>

        {/* Authors */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-[#006828]" />
              Editorial Authors
            </h2>
            <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">
              {authors.length} active
            </span>
          </div>
          <div className="border-b-2 border-[#1c1c1c] mb-6" />
          {authors.length === 0 ? (
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              The masthead has not been seeded yet. Run{" "}
              <code className="font-mono text-[12px]">
                node scripts/seed-authors-reviewers.mjs
              </code>{" "}
              to populate the editorial team list.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {authors.map((a) => (
                <li
                  key={a.slug}
                  className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/40 transition-colors"
                >
                  <Link
                    href={`/intelligence/author/${a.slug}`}
                    className="block group"
                  >
                    <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-base text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                      {a.name}
                    </p>
                    <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">
                      {a.role}
                    </p>
                    <p className="font-['Geist',sans-serif] text-[13px] text-black/55 mt-2 leading-relaxed">
                      {a.bio.length > 160 ? `${a.bio.slice(0, 157)}...` : a.bio}
                    </p>
                    {a.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {a.expertise.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block font-['Geist',sans-serif] px-2 py-0.5 text-[10px] font-medium bg-[#f8f8f6] text-black/50 rounded-full border border-black/[0.06]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Reviewers */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#006828]" />
              Independent Reviewers
            </h2>
            <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">
              {reviewers.length} active
            </span>
          </div>
          <div className="border-b-2 border-[#1c1c1c] mb-6" />
          {groupedReviewers.length === 0 ? (
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              The reviewer roster is currently empty. Reviewer slots are seeded
              as inactive placeholders and only published once a named expert
              has been assigned and credentials verified.
            </p>
          ) : (
            <div className="space-y-8">
              {groupedReviewers.map((group) => (
                <div key={group.type}>
                  <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
                    {group.label}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.reviewers.map((r) => (
                      <li
                        key={r.slug}
                        className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/40 transition-colors"
                      >
                        <Link
                          href={`/intelligence/reviewer/${r.slug}`}
                          className="block group"
                        >
                          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-base text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                            {r.name}
                          </p>
                          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">
                            {r.title}
                          </p>
                          {r.institution && (
                            <p className="font-['Geist',sans-serif] text-[11px] text-black/30 mt-0.5">
                              {r.institution}
                            </p>
                          )}
                          <p className="font-['Geist',sans-serif] text-[13px] text-black/55 mt-2 leading-relaxed">
                            {r.bio.length > 140 ? `${r.bio.slice(0, 137)}...` : r.bio}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trust footer */}
        <div className="border-t border-black/[0.06] pt-6">
          <p className="font-['Geist',sans-serif] text-xs text-black/40">
            Read our{" "}
            <Link href="/editorial-policy" className="text-[#006828] hover:underline">
              editorial policy
            </Link>
            ,{" "}
            <Link href="/methodology" className="text-[#006828] hover:underline">
              methodology
            </Link>
            ,{" "}
            <Link href="/data-sources" className="text-[#006828] hover:underline">
              data sources
            </Link>{" "}
            and{" "}
            <Link href="/about/corrections" className="text-[#006828] hover:underline">
              corrections policy
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
