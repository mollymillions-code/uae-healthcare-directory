/**
 * Reviewer profile page — /intelligence/reviewer/[slug]
 *
 * Backed by the `reviewers` table (Item 5). External medical / policy /
 * economic / industry experts who validate clinical or regulatory claims
 * on Zavis Intelligence articles.
 *
 * Hard rule: every reviewer is gated by `is_active = true` at the data
 * helper layer. Placeholder slots seeded with `is_active = false` will
 * `notFound()` here — no "Dr. TBD" byline can leak to a public page.
 *
 * E-E-A-T leapfrog: when a medical reviewer has consented to publishing
 * their DHA / DOH / MOHAP licence, this page emits the licence as a
 * `schema.org/identifier` PropertyValue inside a `Physician` JSON-LD
 * node — the strongest YMYL expertise signal an emirate-issued ID can
 * carry. No US healthcare-content competitor matches this.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import {
  getReviewerBySlug,
  getArticlesByReviewer,
  getAllActiveReviewers,
} from "@/lib/intelligence/authors";
import { reviewerSchema } from "@/lib/intelligence/seo";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft, Linkedin, ShieldCheck } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const reviewers = await getAllActiveReviewers();
  return reviewers.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const reviewer = await getReviewerBySlug(params.slug);
  if (!reviewer) return { title: "Reviewer not found | Zavis" };

  const base = getBaseUrl();
  const url = `${base}/intelligence/reviewer/${reviewer.slug}`;
  const rawTitle = `${reviewer.name} — ${reviewer.title} | Zavis Medical Reviewer`;
  const rawDescription = `Medical reviewer profile for ${reviewer.name}. ${reviewer.bio.slice(0, 180)}`;

  return {
    title: truncateTitle(rawTitle),
    description: truncateDescription(rawDescription),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `${base}/ar/intelligence/reviewer/${reviewer.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "profile",
      title: `${reviewer.name} — ${reviewer.title}`,
      description: reviewer.bio.slice(0, 200),
      url,
      images:
        reviewer.photoConsent && reviewer.photoUrl
          ? [{ url: reviewer.photoUrl, width: 600, height: 600, alt: reviewer.name }]
          : [
              {
                url: `${base}/images/og-default.png`,
                width: 1200,
                height: 630,
                alt: reviewer.name,
              },
            ],
    },
  };
}

const REVIEWER_TYPE_LABEL: Record<string, string> = {
  medical: "Medical Reviewer",
  industry: "Industry Reviewer",
  policy: "Policy Reviewer",
  economic: "Health Economics Reviewer",
  actuarial: "Actuarial Reviewer",
};

function ReviewerInitialsAvatar({
  name,
  sizePx = 160,
}: {
  name: string;
  sizePx?: number;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div
      role="img"
      aria-label={`${name} profile illustration`}
      className="flex items-center justify-center rounded-full bg-[#1c1c1c] text-white font-['Bricolage_Grotesque',sans-serif] font-medium tracking-tight select-none"
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        fontSize: `${Math.max(16, Math.round(sizePx * 0.38))}px`,
      }}
    >
      {initials}
    </div>
  );
}

export default async function ReviewerProfilePage({ params }: PageProps) {
  const reviewer = await getReviewerBySlug(params.slug);
  if (!reviewer) notFound();

  const base = getBaseUrl();
  const articles = await getArticlesByReviewer(reviewer.slug, { limit: 12 });
  const typeLabel =
    REVIEWER_TYPE_LABEL[reviewer.reviewerType] ?? "Reviewer";

  const licenses = [
    reviewer.dhaLicenseNumber
      ? { label: "DHA License", value: reviewer.dhaLicenseNumber }
      : null,
    reviewer.dohLicenseNumber
      ? { label: "DOH License", value: reviewer.dohLicenseNumber }
      : null,
    reviewer.mohapLicenseNumber
      ? { label: "MOHAP License", value: reviewer.mohapLicenseNumber }
      : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <>
      <JsonLd data={reviewerSchema(reviewer, base)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Zavis", url: base },
          { name: "Intelligence", url: `${base}/intelligence` },
          { name: "Reviewers", url: `${base}/intelligence/author` },
          { name: reviewer.name },
        ])}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/intelligence/author"
          className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-black/40 hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Masthead
        </Link>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 mb-10">
          <div>
            {reviewer.photoConsent && reviewer.photoUrl ? (
              <Image
                src={reviewer.photoUrl}
                alt={reviewer.name}
                width={160}
                height={160}
                className="rounded-full object-cover"
              />
            ) : (
              <ReviewerInitialsAvatar name={reviewer.name} sizePx={160} />
            )}
          </div>
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-1 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Zavis {typeLabel}
            </p>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-1">
              {reviewer.name}
            </h1>
            <p className="font-['Geist',sans-serif] text-sm font-medium text-black/50 mb-1">
              {reviewer.title}
            </p>
            {reviewer.institution && (
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-3">
                {reviewer.institution}
              </p>
            )}
            {reviewer.specialty && (
              <span className="inline-block font-['Geist',sans-serif] px-3 py-1 text-xs font-medium bg-[#f8f8f6] text-black/60 rounded-full border border-black/[0.06]">
                {reviewer.specialty}
              </span>
            )}
            <div className="flex items-center gap-3 mt-3">
              {reviewer.linkedinUrl && (
                <a
                  href={reviewer.linkedinUrl}
                  rel="noopener noreferrer me"
                  target="_blank"
                  aria-label={`${reviewer.name} on LinkedIn`}
                  className="text-black/40 hover:text-[#006828] transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {reviewer.orcidId && (
                <a
                  href={`https://orcid.org/${reviewer.orcidId.replace(/^https?:\/\/orcid\.org\//, "")}`}
                  rel="noopener noreferrer me"
                  target="_blank"
                  className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors"
                >
                  ORCID
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <section className="mb-10">
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
                About this reviewer
              </h2>
              <div className="font-['Geist',sans-serif] text-[15px] text-black/60 leading-relaxed whitespace-pre-line">
                {reviewer.bio}
              </div>
            </section>

            {/* Licences — only displayed when explicitly consented */}
            {licenses.length > 0 && (
              <section className="mb-10">
                <div className="border-b-2 border-[#1c1c1c] mb-4" />
                <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
                  Verified licences
                </h2>
                <ul className="space-y-2">
                  {licenses.map((l) => (
                    <li
                      key={l.label}
                      className="font-['Geist',sans-serif] text-sm text-black/60 inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#006828]" />
                      <span className="font-semibold text-[#1c1c1c]">{l.label}:</span>
                      <span className="font-mono">{l.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-['Geist',sans-serif] text-xs text-black/40">
                  Licence numbers are published only with the reviewer&apos;s explicit
                  consent and verified against the issuing health authority register.
                </p>
              </section>
            )}

            <section className="mb-10">
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight mb-4">
                Articles reviewed
              </h2>
              {articles.length === 0 ? (
                <p className="font-['Geist',sans-serif] text-sm text-black/40">
                  No published articles have been reviewed by this expert yet.
                </p>
              ) : (
                <div className="space-y-0">
                  {articles.map((a, i) => (
                    <div key={a.id}>
                      {i > 0 && <div className="border-b border-black/[0.06] my-4" />}
                      <ArticleCard article={a} variant="horizontal" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            {reviewer.expertise.length > 0 && (
              <div>
                <div className="border-b-2 border-[#1c1c1c] mb-4" />
                <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                  Areas of expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {reviewer.expertise.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block font-['Geist',sans-serif] px-3 py-1 text-xs font-medium bg-[#f8f8f6] text-black/50 rounded-full border border-black/[0.06]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                Editorial Trust
              </h3>
              <ul className="space-y-2 font-['Geist',sans-serif] text-sm">
                <li>
                  <Link
                    href="/editorial-policy"
                    className="text-black/50 hover:text-[#006828] transition-colors"
                  >
                    Editorial Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/methodology"
                    className="text-black/50 hover:text-[#006828] transition-colors"
                  >
                    Methodology
                  </Link>
                </li>
                <li>
                  <Link
                    href="/data-sources"
                    className="text-black/50 hover:text-[#006828] transition-colors"
                  >
                    Data Sources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/corrections"
                    className="text-black/50 hover:text-[#006828] transition-colors"
                  >
                    Corrections Policy
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
