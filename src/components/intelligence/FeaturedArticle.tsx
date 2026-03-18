import Link from "next/link";
import Image from "next/image";
import type { JournalArticle } from "@/lib/intelligence/types";
import { getJournalCategory } from "@/lib/intelligence/categories";
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
        <Link href={`/intelligence/${article.slug}`} className="block">
          {article.imageUrl && (
            <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden bg-light-200">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <span className="badge">{category?.name}</span>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Breaking
              </span>
            )}
          </div>
          <h2 className="font-sans text-2xl font-bold text-dark leading-tight group-hover:text-accent transition-colors mb-3">
            {article.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-4 max-w-2xl">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="font-semibold text-dark">{article.author.name}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>{article.readTimeMinutes} min read</span>
          </div>
        </Link>
      </article>
    );
  }

  // Secondary featured
  return (
    <article className="group">
      <Link href={`/intelligence/${article.slug}`} className="block">
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] mb-3 overflow-hidden bg-light-200">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="badge">{category?.name}</span>
        </div>
        <h3 className="font-sans text-lg font-bold text-dark leading-snug group-hover:text-accent transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{formatDate(article.publishedAt)}</span>
          <span>·</span>
          <span>{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
