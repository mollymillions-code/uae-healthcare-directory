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
            <span className="inline-block font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-wider text-[#006828] shrink-0 pt-0.5">
              {category?.icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[15px] text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors line-clamp-2">
                {article.title}
              </h3>
              <span className="font-['Geist',sans-serif] text-xs text-black/30 mt-1 block">{formatDate(article.publishedAt)}</span>
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
                <span className="font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-wider text-[#006828]">{category?.name}</span>
                {article.isBreaking && (
                  <span className="font-['Geist',sans-serif] text-[11px] font-medium uppercase text-red-600">Breaking</span>
                )}
              </div>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
                {article.title}
              </h3>
              <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <div className="font-['Geist',sans-serif] text-xs text-black/30 mt-3">
                <span>{formatDate(article.publishedAt)}</span>
                {" · "}
                <span>{article.readTimeMinutes} min read</span>
              </div>
            </div>
            {article.imageUrl && (
              <div className="relative w-[160px] h-[100px] shrink-0 overflow-hidden rounded-xl bg-[#f8f8f6]">
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
          <div className="relative w-full aspect-[16/9] mb-4 overflow-hidden rounded-2xl bg-[#f8f8f6]">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <span className="font-['Geist',sans-serif] text-[11px] font-medium uppercase tracking-wider text-[#006828] mb-2 block">{category?.name}</span>
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
          {article.title}
        </h3>
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed line-clamp-3 mb-3">
          {article.excerpt}
        </p>
        <div className="font-['Geist',sans-serif] text-xs text-black/30">
          <span className="font-medium text-[#006828]">{article.author.name}</span>
          {" · "}
          <span>{formatDate(article.publishedAt)}</span>
          {" · "}
          <span>{article.readTimeMinutes} min</span>
        </div>
      </Link>
    </article>
  );
}
