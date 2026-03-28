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
            <div className="relative w-full aspect-[16/9] mb-5 overflow-hidden rounded-2xl bg-[#f8f8f6]">
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
          <div className="flex items-center gap-3 mb-3">
            <span className="font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-wider text-[#006828]">{category?.name}</span>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 font-['Geist',sans-serif] text-[11px] font-medium uppercase text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Breaking
              </span>
            )}
          </div>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[24px] sm:text-[28px] lg:text-[34px] leading-[1.1] text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-3">
            {article.title}
          </h2>
          <p className="font-['Geist',sans-serif] font-medium text-[15px] text-black/50 leading-relaxed mb-4 max-w-2xl">
            {article.excerpt}
          </p>
          <div className="font-['Geist',sans-serif] text-xs text-black/30">
            <span className="font-medium text-[#006828]">{article.author.name}</span>
            {" · "}
            <span>{formatDate(article.publishedAt)}</span>
            {" · "}
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
          <div className="relative w-full aspect-[16/9] mb-3 overflow-hidden rounded-xl bg-[#f8f8f6]">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        )}
        <span className="font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-wider text-[#006828] mb-2 block">{category?.name}</span>
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
          {article.title}
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed line-clamp-2 mb-2">
          {article.excerpt}
        </p>
        <div className="font-['Geist',sans-serif] text-xs text-black/30">
          <span>{formatDate(article.publishedAt)}</span>
          {" · "}
          <span>{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
