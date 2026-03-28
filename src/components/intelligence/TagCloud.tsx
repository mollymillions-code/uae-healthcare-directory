import Link from "next/link";

interface TagCloudProps {
  tags: { tag: string; count: number }[];
  limit?: number;
  activeTag?: string;
}

export function TagCloud({ tags, limit = 20, activeTag }: TagCloudProps) {
  const displayed = tags.slice(0, limit);

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayed.map(({ tag }) => (
        <Link
          key={tag}
          href={`/intelligence/tag/${encodeURIComponent(tag)}`}
          className={`inline-block px-2.5 py-1 text-xs font-['Geist',sans-serif] transition-colors ${
            activeTag === tag
              ? "bg-dark text-white"
              : "bg-canvas-200 text-black/40 hover:bg-dark hover:text-white"
          }`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
