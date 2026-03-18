import Link from "next/link";
import { JOURNAL_CATEGORIES } from "@/lib/journal/categories";

interface CategoryNavProps {
  activeCategory?: string;
}

export function CategoryNav({ activeCategory }: CategoryNavProps) {
  return (
    <nav className="rule-thick">
      <div className="flex items-center gap-0 -mb-px overflow-x-auto">
        <Link
          href="/journal"
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            !activeCategory
              ? "text-ink border-gold"
              : "text-ink-muted border-transparent hover:text-ink hover:border-gold"
          }`}
        >
          All
        </Link>
        {JOURNAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/journal/category/${cat.slug}`}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeCategory === cat.slug
                ? "text-ink border-gold"
                : "text-ink-muted border-transparent hover:text-ink hover:border-gold"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
