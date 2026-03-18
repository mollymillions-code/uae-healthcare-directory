import type { JournalArticle, JournalCategory, JournalEvent, SocialPost } from "./types";
import { SEED_ARTICLES, SEED_EVENTS, SEED_SOCIAL_POSTS } from "./seed-articles";

// ─── Articles ───────────────────────────────────────────────────────────────────

export function getArticles(opts?: {
  category?: JournalCategory;
  tag?: string;
  limit?: number;
  offset?: number;
  excludeSlug?: string;
}): { articles: JournalArticle[]; total: number } {
  let list = [...SEED_ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

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
  return SEED_ARTICLES.find((a) => a.slug === slug);
}

export function getFeaturedArticles(limit = 3): JournalArticle[] {
  return [...SEED_ARTICLES]
    .filter((a) => a.isFeatured)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getBreakingArticles(): JournalArticle[] {
  return [...SEED_ARTICLES]
    .filter((a) => a.isBreaking)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getLatestArticles(limit = 10): JournalArticle[] {
  return [...SEED_ARTICLES]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getRelatedArticles(article: JournalArticle, limit = 4): JournalArticle[] {
  // Score by tag overlap, same category, recency
  const scored = SEED_ARTICLES.filter((a) => a.id !== article.id).map((a) => {
    let score = 0;
    if (a.category === article.category) score += 3;
    for (const tag of a.tags) {
      if (article.tags.includes(tag)) score += 2;
    }
    // Recency bonus (within last 14 days)
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
  return [...SEED_ARTICLES]
    .filter((a) => a.tags.includes(tag))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const article of SEED_ARTICLES) {
    for (const tag of article.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Events ─────────────────────────────────────────────────────────────────────

export function getUpcomingEvents(limit = 6): JournalEvent[] {
  const now = new Date().toISOString().split("T")[0];
  return [...SEED_EVENTS]
    .filter((e) => e.date >= now || (e.endDate && e.endDate >= now))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

// ─── Social Posts ───────────────────────────────────────────────────────────────

export function getLatestSocialPosts(limit = 5): SocialPost[] {
  return [...SEED_SOCIAL_POSTS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export function getJournalStats() {
  const now = new Date();
  const thisMonth = SEED_ARTICLES.filter((a) => {
    const d = new Date(a.publishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    totalArticles: SEED_ARTICLES.length,
    thisMonthCount: thisMonth.length,
    categoryCounts: SEED_ARTICLES.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
