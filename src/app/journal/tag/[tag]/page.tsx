import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { CategoryNav } from "@/components/journal/CategoryNav";
import { TagCloud } from "@/components/journal/TagCloud";
import { getArticlesByTag, getAllTags } from "@/lib/journal/data";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { tag: string };
}

export async function generateStaticParams() {
  return getAllTags().slice(0, 50).map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const base = getBaseUrl();

  return {
    title: `${tag} — UAE Healthcare Journal`,
    description: `All UAE healthcare news tagged "${tag}". Coverage includes regulatory updates, financial analysis, new openings, and industry intelligence.`,
    alternates: {
      canonical: `${base}/journal/tag/${params.tag}`,
    },
  };
}

export default function TagPage({ params }: PageProps) {
  const tag = decodeURIComponent(params.tag);
  const articles = getArticlesByTag(tag);
  const allTags = getAllTags();

  return (
    <>
      {/* Back link */}
      <div className="container-wide pt-6">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 label hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Journal
        </Link>
      </div>

      {/* Tag header */}
      <div className="container-wide pt-8 pb-4">
        <span className="label text-gold mb-2 block">Topic</span>
        <h1 className="font-display text-display font-bold text-ink">{tag}</h1>
        <span className="label mt-3 block">{articles.length} articles</span>
      </div>

      {/* Category navigation */}
      <div className="container-wide pb-8">
        <CategoryNav />
      </div>

      {/* Articles + sidebar */}
      <section className="container-wide pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-display text-ink-muted py-12">
                No articles with this tag yet.
              </p>
            ) : (
              <div className="space-y-0">
                {articles.map((article, i) => (
                  <div key={article.id}>
                    {i > 0 && <div className="rule my-5" />}
                    <ArticleCard article={article} variant="horizontal" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="rule-thick mb-4" />
              <h3 className="label text-gold mb-4">All Topics</h3>
              <TagCloud tags={allTags} limit={30} activeTag={tag} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
