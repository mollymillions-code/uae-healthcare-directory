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
      .orderBy(desc(journalArticles.publishedAt))
      .limit(30);

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
    }));

    return _dbArticles;
  } catch {
    console.log("[Journal] DB unavailable, no articles loaded");
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
