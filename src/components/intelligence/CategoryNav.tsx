import Link from "next/link";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";

interface CategoryNavProps {
  activeCategory?: string;
}

export function CategoryNav({ activeCategory }: CategoryNavProps) {
  return (
    <nav className="border-b-2 border-dark">
      <div className="flex items-center gap-0 -mb-px overflow-x-auto">
        <Link
          href="/intelligence"
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            !activeCategory
              ? "text-dark border-accent"
              : "text-muted border-transparent hover:text-dark hover:border-accent"
          }`}
        >
          All
        </Link>
        {JOURNAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/intelligence/category/${cat.slug}`}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeCategory === cat.slug
                ? "text-dark border-accent"
                : "text-muted border-transparent hover:text-dark hover:border-accent"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
