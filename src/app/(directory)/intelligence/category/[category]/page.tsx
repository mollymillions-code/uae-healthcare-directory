import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { CategoryNav } from "@/components/intelligence/CategoryNav";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { EventsSidebar } from "@/components/intelligence/EventsSidebar";
import { getArticles, getUpcomingEvents, getAllTags, loadDbArticles } from "@/lib/intelligence/data";
import { getJournalCategory, JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import type { JournalCategory } from "@/lib/intelligence/types";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return JOURNAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = getJournalCategory(params.category);
  if (!cat) return {};

  const base = getBaseUrl();

  return {
    title: `${cat.name} — Healthcare Industry Insights`,
    description: cat.description,
    alternates: {
      canonical: `${base}/intelligence/category/${cat.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  await loadDbArticles();
  const cat = getJournalCategory(params.category);
  if (!cat) notFound();

  const { articles, total } = getArticles({
    category: params.category as JournalCategory,
  });
  const events = getUpcomingEvents(4);
  const tags = getAllTags();

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

      {/* Category header */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="font-['Geist',sans-serif] text-2xl font-bold text-[#1c1c1c]">{cat.name}</h1>
        <p className="font-['Geist',sans-serif] text-black/40 mt-2 max-w-2xl">{cat.description}</p>
        <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold mt-3 block">{total} articles</span>
      </div>

      {/* Category navigation */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <CategoryNav activeCategory={params.category} />
      </div>

      {/* Articles + sidebar */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article feed */}
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-['Geist',sans-serif] text-black/40 py-12">
                No articles in this category yet. Check back soon.
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
              <EventsSidebar events={events} />
            </div>

            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">Topics</h3>
              <TagCloud tags={tags} limit={20} />
            </div>
          </aside>
        </div>
      </section>

      {/* AEO block */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            Zavis Healthcare Industry Insights covers {cat.name.toLowerCase()} for the
            healthcare industry in the United Arab Emirates. {cat.description}{" "}
            Updated daily for healthcare professionals. Last updated March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
