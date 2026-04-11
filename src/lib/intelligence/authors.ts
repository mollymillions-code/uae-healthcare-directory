/**
 * src/lib/intelligence/authors.ts
 *
 * Data helpers for the Zavis E-E-A-T layer (Zocdoc roadmap Item 5).
 *
 * Wraps the `authors` and `reviewers` tables plus the `journal_articles`
 * byline columns added in `scripts/db/migrations/2026-04-11-authors-reviewers.sql`.
 *
 * Every function is async (per CLAUDE.md § Data Layer) and returns empty
 * arrays / `null` when the tables are empty so the build stays green even
 * before the seed script has been run. Uses Drizzle over the shared `pg`
 * pool — no `@neondatabase/serverless`.
 */

import type { JournalArticle, JournalCategory } from "./types";

// ─── Profile types ──────────────────────────────────────────────────────────

export interface AuthorCredential {
  label: string;
  issuer?: string;
  year?: number;
}

export interface AuthorProfile {
  id: number;
  slug: string;
  name: string;
  nameAr?: string;
  role: string;
  roleAr?: string;
  bio: string;
  bioAr?: string;
  photoUrl?: string;
  photoConsent: boolean;
  email?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  orcidId?: string;
  credentials: AuthorCredential[];
  expertise: string[];
  articlesCount: number;
  isActive: boolean;
  joinedAt?: string;
}

export type ReviewerType =
  | "medical"
  | "industry"
  | "policy"
  | "economic"
  | "actuarial";

export interface ReviewerProfile {
  id: number;
  slug: string;
  name: string;
  nameAr?: string;
  title: string;
  titleAr?: string;
  institution?: string;
  bio: string;
  bioAr?: string;
  photoUrl?: string;
  photoConsent: boolean;
  linkedinUrl?: string;
  orcidId?: string;
  dhaLicenseNumber?: string;
  dohLicenseNumber?: string;
  mohapLicenseNumber?: string;
  specialty?: string;
  specialtyAr?: string;
  reviewerType: ReviewerType;
  expertise: string[];
  reviewsCount: number;
  isActive: boolean;
  joinedAt?: string;
}

// ─── Row → Profile mapping ──────────────────────────────────────────────────

type AuthorRow = {
  id: number;
  slug: string;
  name: string;
  nameAr: string | null;
  role: string;
  roleAr: string | null;
  bio: string;
  bioAr: string | null;
  photoUrl: string | null;
  photoConsent: boolean;
  email: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  orcidId: string | null;
  credentials: AuthorCredential[] | null;
  expertise: string[] | null;
  articlesCount: number;
  isActive: boolean;
  joinedAt: string | null;
};

function rowToAuthor(row: AuthorRow): AuthorProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr ?? undefined,
    role: row.role,
    roleAr: row.roleAr ?? undefined,
    bio: row.bio,
    bioAr: row.bioAr ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    photoConsent: row.photoConsent,
    email: row.email ?? undefined,
    linkedinUrl: row.linkedinUrl ?? undefined,
    twitterUrl: row.twitterUrl ?? undefined,
    websiteUrl: row.websiteUrl ?? undefined,
    orcidId: row.orcidId ?? undefined,
    credentials: Array.isArray(row.credentials) ? row.credentials : [],
    expertise: Array.isArray(row.expertise) ? row.expertise : [],
    articlesCount: row.articlesCount,
    isActive: row.isActive,
    joinedAt: row.joinedAt ?? undefined,
  };
}

type ReviewerRow = {
  id: number;
  slug: string;
  name: string;
  nameAr: string | null;
  title: string;
  titleAr: string | null;
  institution: string | null;
  bio: string;
  bioAr: string | null;
  photoUrl: string | null;
  photoConsent: boolean;
  linkedinUrl: string | null;
  orcidId: string | null;
  dhaLicenseNumber: string | null;
  dohLicenseNumber: string | null;
  mohapLicenseNumber: string | null;
  specialty: string | null;
  specialtyAr: string | null;
  reviewerType: string;
  expertise: string[] | null;
  reviewsCount: number;
  isActive: boolean;
  joinedAt: string | null;
};

function rowToReviewer(row: ReviewerRow): ReviewerProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr ?? undefined,
    title: row.title,
    titleAr: row.titleAr ?? undefined,
    institution: row.institution ?? undefined,
    bio: row.bio,
    bioAr: row.bioAr ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    photoConsent: row.photoConsent,
    linkedinUrl: row.linkedinUrl ?? undefined,
    orcidId: row.orcidId ?? undefined,
    dhaLicenseNumber: row.dhaLicenseNumber ?? undefined,
    dohLicenseNumber: row.dohLicenseNumber ?? undefined,
    mohapLicenseNumber: row.mohapLicenseNumber ?? undefined,
    specialty: row.specialty ?? undefined,
    specialtyAr: row.specialtyAr ?? undefined,
    reviewerType: (row.reviewerType as ReviewerType) || "industry",
    expertise: Array.isArray(row.expertise) ? row.expertise : [],
    reviewsCount: row.reviewsCount,
    isActive: row.isActive,
    joinedAt: row.joinedAt ?? undefined,
  };
}

// ─── Error-safe table-exists guard ──────────────────────────────────────────
// The authors/reviewers tables only exist once the migration is applied; on a
// fresh clone we still want queries to resolve to empty arrays so the page
// tree can SSG without crashing. Drizzle throws a PG error `42P01` when a
// relation doesn't exist — we catch that and return the empty shape.

async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // 42P01 = undefined_table; treat as "tables not yet seeded"
    if (msg.includes("42P01") || msg.includes("does not exist")) {
      return fallback;
    }
    console.error(`[intelligence/authors] ${label} failed:`, msg);
    return fallback;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getAuthorBySlug(
  slug: string
): Promise<AuthorProfile | null> {
  return safeQuery<AuthorProfile | null>(
    "getAuthorBySlug",
    async () => {
      const { db } = await import("@/lib/db");
      const { authors } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const rows = await db
        .select()
        .from(authors)
        .where(and(eq(authors.slug, slug), eq(authors.isActive, true)))
        .limit(1);

      if (rows.length === 0) return null;
      const row = rows[0] as AuthorRow;
      return rowToAuthor(row);
    },
    null
  );
}

export async function getReviewerBySlug(
  slug: string
): Promise<ReviewerProfile | null> {
  return safeQuery<ReviewerProfile | null>(
    "getReviewerBySlug",
    async () => {
      const { db } = await import("@/lib/db");
      const { reviewers } = await import("@/lib/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const rows = await db
        .select()
        .from(reviewers)
        .where(and(eq(reviewers.slug, slug), eq(reviewers.isActive, true)))
        .limit(1);

      if (rows.length === 0) return null;
      const row = rows[0] as ReviewerRow;
      return rowToReviewer(row);
    },
    null
  );
}

export async function getAllActiveAuthors(): Promise<AuthorProfile[]> {
  return safeQuery<AuthorProfile[]>(
    "getAllActiveAuthors",
    async () => {
      const { db } = await import("@/lib/db");
      const { authors } = await import("@/lib/db/schema");
      const { eq, asc } = await import("drizzle-orm");

      const rows = await db
        .select()
        .from(authors)
        .where(eq(authors.isActive, true))
        .orderBy(asc(authors.name));

      return (rows as AuthorRow[]).map(rowToAuthor);
    },
    []
  );
}

export async function getAllActiveReviewers(): Promise<ReviewerProfile[]> {
  return safeQuery<ReviewerProfile[]>(
    "getAllActiveReviewers",
    async () => {
      const { db } = await import("@/lib/db");
      const { reviewers } = await import("@/lib/db/schema");
      const { eq, asc } = await import("drizzle-orm");

      const rows = await db
        .select()
        .from(reviewers)
        .where(eq(reviewers.isActive, true))
        .orderBy(asc(reviewers.name));

      return (rows as ReviewerRow[]).map(rowToReviewer);
    },
    []
  );
}

// ─── Article lookups (author/reviewer-scoped) ──────────────────────────────

interface ArticleLookupOpts {
  limit?: number;
}

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[] | null;
  source: string;
  sourceUrl: string | null;
  sourceName: string | null;
  authorName: string;
  authorRole: string | null;
  authorSlug: string | null;
  reviewerSlug: string | null;
  reviewerType: string | null;
  lastReviewedAt: Date | null;
  isClinical: boolean;
  imageUrl: string | null;
  imageCaption: string | null;
  isFeatured: boolean | null;
  isBreaking: boolean | null;
  readTimeMinutes: number;
  publishedAt: Date;
  updatedAt: Date | null;
};

function articleRowToDomain(row: ArticleRow): JournalArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: "",
    category: row.category as JournalCategory,
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: row.source as JournalArticle["source"],
    sourceUrl: row.sourceUrl ?? undefined,
    sourceName: row.sourceName ?? undefined,
    author: {
      name: row.authorName,
      role: row.authorRole ?? undefined,
    },
    imageUrl: row.imageUrl ?? undefined,
    imageCaption: row.imageCaption ?? undefined,
    isFeatured: row.isFeatured ?? false,
    isBreaking: row.isBreaking ?? false,
    readTimeMinutes: row.readTimeMinutes,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export async function getArticlesByAuthor(
  slug: string,
  opts: ArticleLookupOpts = {}
): Promise<JournalArticle[]> {
  const limit = opts.limit ?? 24;
  return safeQuery<JournalArticle[]>(
    "getArticlesByAuthor",
    async () => {
      const { db } = await import("@/lib/db");
      const { journalArticles } = await import("@/lib/db/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const rows = await db
        .select({
          id: journalArticles.id,
          slug: journalArticles.slug,
          title: journalArticles.title,
          excerpt: journalArticles.excerpt,
          category: journalArticles.category,
          tags: journalArticles.tags,
          source: journalArticles.source,
          sourceUrl: journalArticles.sourceUrl,
          sourceName: journalArticles.sourceName,
          authorName: journalArticles.authorName,
          authorRole: journalArticles.authorRole,
          authorSlug: journalArticles.authorSlug,
          reviewerSlug: journalArticles.reviewerSlug,
          reviewerType: journalArticles.reviewerType,
          lastReviewedAt: journalArticles.lastReviewedAt,
          isClinical: journalArticles.isClinical,
          imageUrl: journalArticles.imageUrl,
          imageCaption: journalArticles.imageCaption,
          isFeatured: journalArticles.isFeatured,
          isBreaking: journalArticles.isBreaking,
          readTimeMinutes: journalArticles.readTimeMinutes,
          publishedAt: journalArticles.publishedAt,
          updatedAt: journalArticles.updatedAt,
        })
        .from(journalArticles)
        .where(
          and(
            eq(journalArticles.authorSlug, slug),
            eq(journalArticles.status, "published")
          )
        )
        .orderBy(desc(journalArticles.publishedAt))
        .limit(limit);

      return (rows as unknown as ArticleRow[]).map(articleRowToDomain);
    },
    []
  );
}

export async function getArticlesByReviewer(
  slug: string,
  opts: ArticleLookupOpts = {}
): Promise<JournalArticle[]> {
  const limit = opts.limit ?? 24;
  return safeQuery<JournalArticle[]>(
    "getArticlesByReviewer",
    async () => {
      const { db } = await import("@/lib/db");
      const { journalArticles } = await import("@/lib/db/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const rows = await db
        .select({
          id: journalArticles.id,
          slug: journalArticles.slug,
          title: journalArticles.title,
          excerpt: journalArticles.excerpt,
          category: journalArticles.category,
          tags: journalArticles.tags,
          source: journalArticles.source,
          sourceUrl: journalArticles.sourceUrl,
          sourceName: journalArticles.sourceName,
          authorName: journalArticles.authorName,
          authorRole: journalArticles.authorRole,
          authorSlug: journalArticles.authorSlug,
          reviewerSlug: journalArticles.reviewerSlug,
          reviewerType: journalArticles.reviewerType,
          lastReviewedAt: journalArticles.lastReviewedAt,
          isClinical: journalArticles.isClinical,
          imageUrl: journalArticles.imageUrl,
          imageCaption: journalArticles.imageCaption,
          isFeatured: journalArticles.isFeatured,
          isBreaking: journalArticles.isBreaking,
          readTimeMinutes: journalArticles.readTimeMinutes,
          publishedAt: journalArticles.publishedAt,
          updatedAt: journalArticles.updatedAt,
        })
        .from(journalArticles)
        .where(
          and(
            eq(journalArticles.reviewerSlug, slug),
            eq(journalArticles.status, "published")
          )
        )
        .orderBy(desc(journalArticles.publishedAt))
        .limit(limit);

      return (rows as unknown as ArticleRow[]).map(articleRowToDomain);
    },
    []
  );
}

// ─── Enriched article lookup (byline + reviewer profile attached) ──────────
// Used by the article renderer to populate a rich byline without re-querying
// the DB three times. Returns `null` for missing bylines so the renderer
// can fall back to the legacy authorName / authorRole rendering path.

export interface ArticleByline {
  author: AuthorProfile | null;
  reviewer: ReviewerProfile | null;
}

export async function getBylineForArticle(
  authorSlug?: string | null,
  reviewerSlug?: string | null
): Promise<ArticleByline> {
  const [author, reviewer] = await Promise.all([
    authorSlug ? getAuthorBySlug(authorSlug) : Promise.resolve(null),
    reviewerSlug ? getReviewerBySlug(reviewerSlug) : Promise.resolve(null),
  ]);
  return { author, reviewer };
}
