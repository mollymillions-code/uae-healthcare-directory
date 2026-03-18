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
          href={`/journal/tag/${tag}`}
          className={`inline-block px-2.5 py-1 text-xs font-mono transition-colors ${
            activeTag === tag
              ? "bg-dark text-white"
              : "bg-canvas-200 text-muted hover:bg-dark hover:text-white"
          }`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
