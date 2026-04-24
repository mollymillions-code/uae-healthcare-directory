/**
 * Author profile page — /intelligence/author/[slug]
 *
 * Backed by the `authors` table (Item 5 — see
 * `scripts/db/migrations/2026-04-11-authors-reviewers.sql`). Graceful fallback:
 * when the table is empty (freshly applied migration), every helper returns
 * null/[] and the page emits a 404 via `notFound()`.
 *
 * E-E-A-T leapfrog versus Zocdoc's Paper Gown: their /blog/author/[slug]
 * pages are empty WordPress taxonomy archives — no bio, no credentials, no
 * sameAs, no `Person` JSON-LD. This page emits a real Person stack with
 * jobTitle, knowsAbout, sameAs, worksFor and publishingPrinciples.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import {
  getAuthorBySlug,
  getArticlesByAuthor,
  getAllActiveAuthors,
} from "@/lib/intelligence/authors";
import { authorSchema } from "@/lib/intelligence/seo";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft, Linkedin, Twitter, Globe, Mail } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  // Pre-generate every active author. The masthead is small enough that we
  // never need to fall back to on-demand ISR for this route. On a fresh
  // clone with empty tables, this returns [] and the route stays on-demand.
  const authors = await getAllActiveAuthors();
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const author = await getAuthorBySlug(params.slug);
  if (!author) return { title: "Author not found | Zavis" };

  const base = getBaseUrl();
  const url = `${base}/intelligence/author/${author.slug}`;
  const rawTitle = `${author.name} — ${author.role} | Zavis`;
  const rawDescription = `${author.name}: ${author.bio.slice(0, 200)}`;

  return {
    title: truncateTitle(rawTitle),
    description: truncateDescription(rawDescription),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `${base}/ar/intelligence/author/${author.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "profile",
      title: `${author.name} — ${author.role}`,
      description: author.bio.slice(0, 200),
      url,
      images:
        author.photoConsent && author.photoUrl
          ? [{ url: author.photoUrl, width: 600, height: 600, alt: author.name }]
          : [{ url: `${base}/images/og-default.png`, width: 1200, height: 630, alt: author.name }],
    },
  };
}

function AuthorInitialsAvatar({ name, sizePx = 128 }: { name: string; sizePx?: number }) {
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
      className="flex items-center justify-center rounded-full bg-[#006828] text-white font-['Bricolage_Grotesque',sans-serif] font-medium tracking-tight select-none"
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

export default async function AuthorProfilePage({ params }: PageProps) {
  const author = await getAuthorBySlug(params.slug);
  if (!author) notFound();

  const base = getBaseUrl();
  const articles = await getArticlesByAuthor(author.slug, { limit: 12 });

  return (
    <>
      <JsonLd data={authorSchema(author, base)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Zavis", url: base },
          { name: "Intelligence", url: `${base}/intelligence` },
          { name: "Authors", url: `${base}/intelligence/author` },
          { name: author.name },
        ])}
      />

      {/* Back link */}
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
        {/* Hero — author header */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 mb-10">
          <div>
            {author.photoConsent && author.photoUrl ? (
              <Image
                src={author.photoUrl}
                alt={author.name}
                width={160}
                height={160}
                className="rounded-full object-cover"
              />
            ) : (
              <AuthorInitialsAvatar name={author.name} sizePx={160} />
            )}
          </div>
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-1">
              Zavis Editorial
            </p>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-1">
              {author.name}
            </h1>
            <p className="font-['Geist',sans-serif] text-sm font-medium text-black/50 mb-4">
              {author.role}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mb-2">
              {author.linkedinUrl && (
                <a
                  href={author.linkedinUrl}
                  rel="noopener noreferrer me"
                  target="_blank"
                  aria-label={`${author.name} on LinkedIn`}
                  className="text-black/40 hover:text-[#006828] transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {author.twitterUrl && (
                <a
                  href={author.twitterUrl}
                  rel="noopener noreferrer me"
                  target="_blank"
                  aria-label={`${author.name} on X / Twitter`}
                  className="text-black/40 hover:text-[#006828] transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {author.websiteUrl && (
                <a
                  href={author.websiteUrl}
                  rel="noopener noreferrer me"
                  target="_blank"
                  aria-label={`${author.name} personal website`}
                  className="text-black/40 hover:text-[#006828] transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {author.email && (
                <a
                  href={`mailto:${author.email}`}
                  aria-label={`Email ${author.name}`}
                  className="text-black/40 hover:text-[#006828] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
              {author.orcidId && (
                <a
                  href={`https://orcid.org/${author.orcidId.replace(/^https?:\/\/orcid\.org\//, "")}`}
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
            {/* Bio */}
            <section className="mb-10">
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
                Biography
              </h2>
              <div className="font-['Geist',sans-serif] text-[15px] text-black/60 leading-relaxed whitespace-pre-line">
                {author.bio}
              </div>
            </section>

            {/* Credentials */}
            {author.credentials.length > 0 && (
              <section className="mb-10">
                <div className="border-b-2 border-[#1c1c1c] mb-4" />
                <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
                  Credentials
                </h2>
                <ul className="space-y-1.5">
                  {author.credentials.map((c, i) => (
                    <li key={i} className="font-['Geist',sans-serif] text-sm text-black/60">
                      <span className="font-semibold text-[#1c1c1c]">{c.label}</span>
                      {c.issuer ? ` — ${c.issuer}` : ""}
                      {c.year ? ` (${c.year})` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Published articles */}
            <section className="mb-10">
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight mb-4">
                Published coverage
              </h2>
              {articles.length === 0 ? (
                <p className="font-['Geist',sans-serif] text-sm text-black/40">
                  No published articles attributed to this byline yet.
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

          {/* Sidebar — expertise + trust */}
          <aside className="space-y-8">
            {author.expertise.length > 0 && (
              <div>
                <div className="border-b-2 border-[#1c1c1c] mb-4" />
                <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                  Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {author.expertise.map((tag) => (
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
