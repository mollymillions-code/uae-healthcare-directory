import Link from "next/link";
import type { JournalArticle } from "@/lib/journal/types";
import { getJournalCategory } from "@/lib/journal/categories";
import { formatDate } from "./utils";

interface FeaturedArticleProps {
  article: JournalArticle;
  variant?: "hero" | "secondary";
}

export function FeaturedArticle({ article, variant = "hero" }: FeaturedArticleProps) {
  const category = getJournalCategory(article.category);

  if (variant === "hero") {
    return (
      <article className="group">
        <Link href={`/journal/${article.slug}`} className="block">
          <div className="flex items-center gap-2 mb-3">
            <span className="label text-accent">{category?.name}</span>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 label text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Breaking
              </span>
            )}
          </div>
          <h2 className="font-sans text-2xl font-bold text-dark leading-tight group-hover:text-accent transition-colors mb-4">
            {article.title}
          </h2>
          <p className="font-sans text-lg text-muted leading-relaxed mb-5 max-w-2xl">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3">
            <span className="label">{article.author.name}</span>
            <span className="text-muted">·</span>
            <span className="label">{formatDate(article.publishedAt)}</span>
            <span className="text-muted">·</span>
            <span className="label">{article.readTimeMinutes} min read</span>
          </div>
        </Link>
      </article>
    );
  }

  // Secondary featured
  return (
    <article className="group">
      <Link href={`/journal/${article.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          <span className="label text-accent">{category?.name}</span>
        </div>
        <h3 className="font-sans text-xl font-semibold text-dark leading-snug group-hover:text-accent transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-3">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3">
          <span className="label">{formatDate(article.publishedAt)}</span>
          <span className="text-muted">·</span>
          <span className="label">{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
