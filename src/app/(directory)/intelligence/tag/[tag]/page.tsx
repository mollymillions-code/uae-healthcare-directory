import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { CategoryNav } from "@/components/intelligence/CategoryNav";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { getArticlesByTag, getAllTags, loadDbArticles } from "@/lib/intelligence/data";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { tag: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getAllTags().slice(0, 10).map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const base = getBaseUrl();

  return {
    title: `${tag} — Zavis Healthcare Industry Insights`,
    description: `All UAE healthcare news tagged "${tag}". Coverage includes regulatory updates, financial analysis, new openings, and industry intelligence.`,
    alternates: {
      canonical: `${base}/intelligence/tag/${params.tag}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  await loadDbArticles();
  const tag = decodeURIComponent(params.tag);
  const articles = getArticlesByTag(tag);
  const allTags = getAllTags();

  return (
    <>
      {/* Back link */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1.5 label hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Intelligence
        </Link>
      </div>

      {/* Tag header */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-2 block">Topic</span>
        <h1 className="font-['Geist',sans-serif] text-2xl font-bold text-[#1c1c1c]">{tag}</h1>
        <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold mt-3 block">{articles.length} articles</span>
      </div>

      {/* Category navigation */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <CategoryNav />
      </div>

      {/* Articles + sidebar */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-['Geist',sans-serif] text-black/40 py-12">
                No articles with this tag yet.
              </p>
            ) : (
              <div className="space-y-0">
                {articles.map((article, i) => (
                  <div key={article.id}>
                    {i > 0 && <div className="border-b border-black/[0.06] my-5" />}
                    <ArticleCard article={article} variant="horizontal" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">All Topics</h3>
              <TagCloud tags={allTags} limit={30} activeTag={tag} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
