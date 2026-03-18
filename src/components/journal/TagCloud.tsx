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
          className={`inline-block px-2.5 py-1 text-xs font-kicker transition-colors ${
            activeTag === tag
              ? "bg-ink text-canvas"
              : "bg-canvas-200 text-ink-muted hover:bg-ink hover:text-canvas"
          }`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
