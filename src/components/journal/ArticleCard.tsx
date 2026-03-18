import Link from "next/link";
import type { JournalArticle } from "@/lib/journal/types";
import { getJournalCategory } from "@/lib/journal/categories";
import { formatDate } from "./utils";

interface ArticleCardProps {
  article: JournalArticle;
  variant?: "default" | "compact" | "horizontal";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const category = getJournalCategory(article.category);

  if (variant === "compact") {
    return (
      <article className="group">
        <Link href={`/journal/${article.slug}`} className="block">
          <div className="flex items-start gap-3">
            <span className="label text-accent shrink-0 pt-0.5">
              {category?.icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-sans text-sm font-semibold text-dark leading-snug group-hover:text-accent transition-colors line-clamp-2">
                {article.title}
              </h3>
              <span className="label mt-1 block">{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group">
        <Link href={`/journal/${article.slug}`} className="block">
          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="label text-accent">{category?.name}</span>
                {article.isBreaking && (
                  <span className="label text-red-600">Breaking</span>
                )}
              </div>
              <h3 className="font-sans text-lg font-semibold text-dark leading-snug group-hover:text-accent transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="label">{formatDate(article.publishedAt)}</span>
                <span className="label">{article.readTimeMinutes} min read</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group">
      <Link href={`/journal/${article.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          <span className="label text-accent">{category?.name}</span>
          {article.isBreaking && (
            <span className="label text-red-600">Breaking</span>
          )}
        </div>
        <h3 className="font-sans text-xl font-semibold text-dark leading-snug group-hover:text-accent transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-3">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3">
          <span className="label">{article.author.name}</span>
          <span className="text-muted">·</span>
          <span className="label">{formatDate(article.publishedAt)}</span>
          <span className="text-muted">·</span>
          <span className="label">{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
