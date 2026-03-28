import Link from "next/link";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";

interface CategoryNavProps {
  activeCategory?: string;
}

export function CategoryNav({ activeCategory }: CategoryNavProps) {
  return (
    <nav className="border-b-2 border-[#1c1c1c]">
      <div className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-none">
        <Link
          href="/intelligence"
          className={`px-4 py-2.5 font-['Geist',sans-serif] text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            !activeCategory
              ? "text-[#1c1c1c] border-[#006828]"
              : "text-black/40 border-transparent hover:text-[#1c1c1c] hover:border-black/20"
          }`}
        >
          All
        </Link>
        {JOURNAL_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/intelligence/category/${cat.slug}`}
            className={`px-4 py-2.5 font-['Geist',sans-serif] text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeCategory === cat.slug
                ? "text-[#1c1c1c] border-[#006828]"
                : "text-black/40 border-transparent hover:text-[#1c1c1c] hover:border-black/20"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
