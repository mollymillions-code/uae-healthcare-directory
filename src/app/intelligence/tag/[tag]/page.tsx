import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { CategoryNav } from "@/components/intelligence/CategoryNav";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { getArticlesByTag, getAllTags } from "@/lib/intelligence/data";
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
    title: `${tag} — UAE Healthcare Intelligence`,
    description: `All UAE healthcare news tagged "${tag}". Coverage includes regulatory updates, financial analysis, new openings, and industry intelligence.`,
    alternates: {
      canonical: `${base}/intelligence/tag/${params.tag}`,
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
      <div className="container-tc pt-6">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1.5 label hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Intelligence
        </Link>
      </div>

      {/* Tag header */}
      <div className="container-tc pt-8 pb-4">
        <span className="label text-accent mb-2 block">Topic</span>
        <h1 className="font-sans text-2xl font-bold text-dark">{tag}</h1>
        <span className="label mt-3 block">{articles.length} articles</span>
      </div>

      {/* Category navigation */}
      <div className="container-tc pb-8">
        <CategoryNav />
      </div>

      {/* Articles + sidebar */}
      <section className="container-tc pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-sans text-muted py-12">
                No articles with this tag yet.
              </p>
            ) : (
              <div className="space-y-0">
                {articles.map((article, i) => (
                  <div key={article.id}>
                    {i > 0 && <div className="border-b border-light-200 my-5" />}
                    <ArticleCard article={article} variant="horizontal" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <h3 className="label text-accent mb-4">All Topics</h3>
              <TagCloud tags={allTags} limit={30} activeTag={tag} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
