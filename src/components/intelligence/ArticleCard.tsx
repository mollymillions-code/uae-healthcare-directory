import Link from "next/link";
import Image from "next/image";
import type { JournalArticle } from "@/lib/intelligence/types";
import { getJournalCategory } from "@/lib/intelligence/categories";
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
        <Link href={`/intelligence/${article.slug}`} className="block">
          <div className="flex items-start gap-3">
            <span className="category-ribbon shrink-0 pt-0.5">
              {category?.icon}
            </span>
            <div className="min-w-0">
              <h3 className="headline-serif-md group-hover:text-accent transition-colors line-clamp-2">
                {article.title}
              </h3>
              <span className="byline mt-1 block">{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group">
        <Link href={`/intelligence/${article.slug}`} className="block">
          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="category-ribbon">{category?.name}</span>
                {article.isBreaking && (
                  <span className="text-[11px] font-bold uppercase text-red-600">Breaking</span>
                )}
              </div>
              <h3 className="headline-serif-lg group-hover:text-accent transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <div className="byline mt-3">
                <span>{formatDate(article.publishedAt)}</span>
                {" · "}
                <span>{article.readTimeMinutes} min read</span>
              </div>
            </div>
            {article.imageUrl && (
              <div className="relative w-[160px] h-[100px] shrink-0 overflow-hidden bg-light-100">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="160px"
                />
              </div>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group">
      <Link href={`/intelligence/${article.slug}`} className="block">
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden bg-light-100">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <span className="category-ribbon mb-2 block">{category?.name}</span>
        <h3 className="headline-serif-lg group-hover:text-accent transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-3">
          {article.excerpt}
        </p>
        <div className="byline">
          <span className="author">{article.author.name}</span>
          {" · "}
          <span>{formatDate(article.publishedAt)}</span>
          {" · "}
          <span>{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
