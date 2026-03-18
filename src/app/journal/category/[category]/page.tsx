import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { CategoryNav } from "@/components/journal/CategoryNav";
import { NewsletterSignup } from "@/components/journal/NewsletterSignup";
import { TagCloud } from "@/components/journal/TagCloud";
import { EventsSidebar } from "@/components/journal/EventsSidebar";
import { getArticles, getUpcomingEvents, getAllTags } from "@/lib/journal/data";
import { getJournalCategory, JOURNAL_CATEGORIES } from "@/lib/journal/categories";
import type { JournalCategory } from "@/lib/journal/types";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  return JOURNAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = getJournalCategory(params.category);
  if (!cat) return {};

  const base = getBaseUrl();

  return {
    title: `${cat.name} | UAE Healthcare Journal`,
    description: cat.description,
    alternates: {
      canonical: `${base}/journal/category/${cat.slug}`,
    },
  };
}

export default function CategoryPage({ params }: PageProps) {
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
      <div className="container-wide pt-6">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 label hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Journal
        </Link>
      </div>

      {/* Category header */}
      <div className="container-wide pt-8 pb-4">
        <h1 className="font-display text-display font-bold text-ink">{cat.name}</h1>
        <p className="font-display text-ink-muted mt-2 max-w-2xl">{cat.description}</p>
        <span className="label mt-3 block">{total} articles</span>
      </div>

      {/* Category navigation */}
      <div className="container-wide pb-8">
        <CategoryNav activeCategory={params.category} />
      </div>

      {/* Articles + sidebar */}
      <section className="container-wide pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article feed */}
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-display text-ink-muted py-12">
                No articles in this category yet. Check back soon.
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
            <NewsletterSignup />

            <div>
              <div className="rule-thick mb-4" />
              <EventsSidebar events={events} />
            </div>

            <div>
              <div className="rule-thick mb-4" />
              <h3 className="label text-gold mb-4">Topics</h3>
              <TagCloud tags={tags} limit={20} />
            </div>
          </aside>
        </div>
      </section>

      {/* AEO block */}
      <section className="container-wide pb-16">
        <div className="answer-block" data-answer-block="true">
          <p className="font-display text-ink-muted leading-relaxed">
            The UAE Healthcare Journal covers {cat.name.toLowerCase()} for the
            healthcare industry in the United Arab Emirates. {cat.description}{" "}
            Updated daily for healthcare professionals. Last updated March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
