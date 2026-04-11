import type { JournalArticle, JournalCategory, JournalEvent, SocialPost } from "./types";

// ─── DB Integration ─────────────────────────────────────────────────────────────
// Reads from Neon Postgres. Returns empty data if DB unavailable.

let _dbArticles: JournalArticle[] | null = null;

async function getDbArticles(): Promise<JournalArticle[]> {
  if (_dbArticles !== null) return _dbArticles;

  if (!process.env.DATABASE_URL) {
    _dbArticles = [];
    return _dbArticles;
  }

  try {
    const { db } = await import("@/lib/db");
    const { journalArticles } = await import("@/lib/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    // Two-pass fetch: try the full SELECT with the Item 5 byline columns
    // first; if those columns don't yet exist on the target DB (i.e. the
    // 2026-04-11-authors-reviewers migration hasn't been applied) fall
    // back to the legacy SELECT so the intelligence section stays live.
    type FullRow = {
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
      imageUrl: string | null;
      imageCaption: string | null;
      isFeatured: boolean | null;
      isBreaking: boolean | null;
      readTimeMinutes: number;
      publishedAt: Date;
      updatedAt: Date | null;
      status: string;
      authorSlug?: string | null;
      reviewerSlug?: string | null;
      reviewerType?: string | null;
      lastReviewedAt?: Date | null;
      isClinical?: boolean | null;
      citations?: unknown;
    };

    let rows: FullRow[] = [];
    try {
      rows = (await db
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
          imageUrl: journalArticles.imageUrl,
          imageCaption: journalArticles.imageCaption,
          isFeatured: journalArticles.isFeatured,
          isBreaking: journalArticles.isBreaking,
          readTimeMinutes: journalArticles.readTimeMinutes,
          publishedAt: journalArticles.publishedAt,
          updatedAt: journalArticles.updatedAt,
          status: journalArticles.status,
          authorSlug: journalArticles.authorSlug,
          reviewerSlug: journalArticles.reviewerSlug,
          reviewerType: journalArticles.reviewerType,
          lastReviewedAt: journalArticles.lastReviewedAt,
          isClinical: journalArticles.isClinical,
          citations: journalArticles.citations,
        })
        .from(journalArticles)
        .where(eq(journalArticles.status, "published"))
        .orderBy(desc(journalArticles.publishedAt))) as unknown as FullRow[];
    } catch (innerErr: unknown) {
      const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
      // 42703 = undefined_column. Means migration not yet applied on this DB.
      if (msg.includes("42703") || msg.includes("does not exist")) {
        console.warn(
          "[Journal] Item 5 byline columns missing, falling back to legacy SELECT"
        );
        rows = (await db
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
            imageUrl: journalArticles.imageUrl,
            imageCaption: journalArticles.imageCaption,
            isFeatured: journalArticles.isFeatured,
            isBreaking: journalArticles.isBreaking,
            readTimeMinutes: journalArticles.readTimeMinutes,
            publishedAt: journalArticles.publishedAt,
            updatedAt: journalArticles.updatedAt,
            status: journalArticles.status,
          })
          .from(journalArticles)
          .where(eq(journalArticles.status, "published"))
          .orderBy(desc(journalArticles.publishedAt))) as unknown as FullRow[];
      } else {
        throw innerErr;
      }
    }

    _dbArticles = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: "", // Body loaded separately on article detail pages
      category: row.category as JournalCategory,
      tags: (row.tags || []) as string[],
      source: row.source as JournalArticle["source"],
      sourceUrl: row.sourceUrl || undefined,
      sourceName: row.sourceName || undefined,
      author: {
        name: row.authorName,
        role: row.authorRole || undefined,
      },
      imageUrl: row.imageUrl || undefined,
      imageCaption: row.imageCaption || undefined,
      isFeatured: row.isFeatured || false,
      isBreaking: row.isBreaking || false,
      readTimeMinutes: row.readTimeMinutes,
      publishedAt: row.publishedAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      authorSlug: row.authorSlug || undefined,
      reviewerSlug: row.reviewerSlug || undefined,
      reviewerType: row.reviewerType || undefined,
      lastReviewedAt: row.lastReviewedAt?.toISOString(),
      isClinical: row.isClinical || false,
      citations: Array.isArray(row.citations)
        ? (row.citations as JournalArticle["citations"])
        : [],
    }));

    console.log(`[Journal] Loaded ${_dbArticles.length} articles from DB`);
    return _dbArticles;
  } catch (e: unknown) {
    console.error("[Journal] DB error:", e instanceof Error ? e.message : e);
    _dbArticles = [];
    return _dbArticles;
  }
}

// ─── Sync wrapper for SSG compatibility ─────────────────────────────────────────
// Next.js SSG pages call these synchronously. Returns only DB articles.

function getAllArticlesSync(): JournalArticle[] {
  const db = _dbArticles || [];
  return db.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// ─── Articles ───────────────────────────────────────────────────────────────────

export function getArticles(opts?: {
  category?: JournalCategory;
  tag?: string;
  limit?: number;
  offset?: number;
  excludeSlug?: string;
}): { articles: JournalArticle[]; total: number } {
  let list = getAllArticlesSync();

  if (opts?.category) {
    list = list.filter((a) => a.category === opts.category);
  }
  if (opts?.tag) {
    list = list.filter((a) => a.tags.includes(opts.tag!));
  }
  if (opts?.excludeSlug) {
    list = list.filter((a) => a.slug !== opts.excludeSlug);
  }

  const total = list.length;
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 50;

  return {
    articles: list.slice(offset, offset + limit),
    total,
  };
}

export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return getAllArticlesSync().find((a) => a.slug === slug);
}

/** Fetch the full article body from DB for a single article (detail page only) */
export async function getArticleBodyBySlug(slug: string): Promise<string> {
  if (!process.env.DATABASE_URL) return "";
  try {
    const { db } = await import("@/lib/db");
    const { journalArticles } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select({ body: journalArticles.body })
      .from(journalArticles)
      .where(eq(journalArticles.slug, slug))
      .limit(1);
    return rows[0]?.body || "";
  } catch {
    return "";
  }
}

export function getFeaturedArticles(limit = 3): JournalArticle[] {
  return getAllArticlesSync()
    .filter((a) => a.isFeatured)
    .slice(0, limit);
}

export function getBreakingArticles(): JournalArticle[] {
  return getAllArticlesSync().filter((a) => a.isBreaking);
}

export function getLatestArticles(limit = 10): JournalArticle[] {
  return getAllArticlesSync().slice(0, limit);
}

export function getRelatedArticles(article: JournalArticle, limit = 4): JournalArticle[] {
  const all = getAllArticlesSync().filter((a) => a.id !== article.id);
  const scored = all.map((a) => {
    let score = 0;
    if (a.category === article.category) score += 3;
    for (const tag of a.tags) {
      if (article.tags.includes(tag)) score += 2;
    }
    const daysDiff =
      (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 14) score += 1;
    return { article: a, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

export function getArticlesByTag(tag: string, limit = 20): JournalArticle[] {
  return getAllArticlesSync()
    .filter((a) => a.tags.includes(tag))
    .slice(0, limit);
}

/**
 * Find articles relevant to a directory page context (city + category).
 * Scores articles by tag overlap with city name, category name/slug, and recency.
 * Used for hub-and-spoke cross-linking between directory and intelligence.
 */
export function getArticlesByDirectoryContext(
  cityName: string,
  categorySlug: string,
  categoryName: string,
  limit = 4,
): JournalArticle[] {
  const all = getAllArticlesSync();
  if (all.length === 0) return [];

  const cityLower = cityName.toLowerCase();
  const catSlugLower = categorySlug.toLowerCase();
  const catNameLower = categoryName.toLowerCase();
  // Extract meaningful words from category name (skip "and", "&", short words)
  const catKeywords = catNameLower
    .split(/[\s&/]+/)
    .filter((w) => w.length > 3)
    .map((w) => w.replace(/(?<![s])s$/, "")); // singularize (skip words ending in "ss" like wellness)

  const scored = all.map((a) => {
    let score = 0;
    const tagsLower = a.tags.map((t) => t.toLowerCase());
    const titleLower = a.title.toLowerCase();
    const excerptLower = a.excerpt.toLowerCase();

    // City match in tags (+3) or title/excerpt (+2)
    if (tagsLower.some((t) => t.includes(cityLower))) score += 3;
    else if (titleLower.includes(cityLower) || excerptLower.includes(cityLower)) score += 2;

    // Category slug match in tags (+3)
    if (tagsLower.includes(catSlugLower)) score += 3;

    // Category keyword matches in tags or title (+2 each)
    for (const kw of catKeywords) {
      if (tagsLower.some((t) => t.includes(kw))) score += 2;
      else if (titleLower.includes(kw) || excerptLower.includes(kw)) score += 1;
    }

    // Recency bonus
    const daysDiff = (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 7) score += 2;
    else if (daysDiff < 30) score += 1;

    return { article: a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const article of getAllArticlesSync()) {
    for (const tag of article.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Async data loader (call from API routes / server actions) ──────────────────

export async function loadDbArticles(): Promise<void> {
  await getDbArticles();
}

// ─── Events ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getUpcomingEvents(limit = 6): JournalEvent[] {
  return []; // TODO: source from real event feed
}

// ─── Social Posts ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getLatestSocialPosts(limit = 5): SocialPost[] {
  return []; // TODO: source from real social API
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export function getJournalStats() {
  const all = getAllArticlesSync();
  const now = new Date();
  const thisMonth = all.filter((a) => {
    const d = new Date(a.publishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    totalArticles: all.length,
    thisMonthCount: thisMonth.length,
    categoryCounts: all.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
