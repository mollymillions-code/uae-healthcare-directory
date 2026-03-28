import Link from "next/link";
import type { JournalArticle } from "@/lib/intelligence/types";

interface BreakingTickerProps {
  articles: JournalArticle[];
}

export function BreakingTicker({ articles }: BreakingTickerProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-dark text-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 py-2">
        <span className="shrink-0 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-['Geist',sans-serif] text-[10px] uppercase tracking-[0.15em] text-red-400 font-medium">
            Breaking
          </span>
        </span>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-flex gap-12 animate-ticker">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/intelligence/${article.slug}`}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                {article.title}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {articles.map((article) => (
              <Link
                key={`dup-${article.id}`}
                href={`/intelligence/${article.slug}`}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
