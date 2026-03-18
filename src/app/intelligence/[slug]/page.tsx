import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { NewsletterSignup } from "@/components/intelligence/NewsletterSignup";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { ArticleBody } from "@/components/intelligence/SocialEmbed";
import Image from "next/image";
import { getArticleBySlug, getRelatedArticles, getAllTags, getArticles } from "@/lib/intelligence/data";
import { articleSchema } from "@/lib/intelligence/seo";
import { getJournalCategory } from "@/lib/intelligence/categories";
import { formatDate } from "@/components/intelligence/utils";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";
import { SEED_ARTICLES } from "@/lib/intelligence/seed-articles";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return SEED_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const category = getJournalCategory(article.category);
  const base = getBaseUrl();

  return {
    title: `${article.title} | Zavis Healthcare Industry Insights`,
    description: article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      section: category?.name,
      tags: article.tags,
      url: `${base}/intelligence/${article.slug}`,
    },
    alternates: {
      canonical: `${base}/intelligence/${article.slug}`,
    },
  };
}

export default function ArticlePage({ params }: PageProps) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const category = getJournalCategory(article.category);
  const related = getRelatedArticles(article, 4);
  const tags = getAllTags();

  return (
    <>
      <JsonLd data={articleSchema(article)} />

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

      <article className="container-tc pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article body */}
          <div className="lg:col-span-2">
            {/* Category + meta */}
            <div className="flex items-center gap-2 mb-4">
              <Link
                href={`/intelligence/category/${article.category}`}
                className="label text-accent hover:text-accent-dark transition-colors"
              >
                {category?.name}
              </Link>
              {article.isBreaking && (
                <span className="inline-flex items-center gap-1 label text-red-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  Breaking
                </span>
              )}
            </div>

            {/* Hero image */}
            {article.imageUrl && (
              <div className="relative w-full aspect-[16/9] mb-6 overflow-hidden bg-light-200">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                />
              </div>
            )}

            {/* Headline */}
            <h1 className="headline-serif-xl mb-5">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="font-serif text-lg text-muted leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Byline */}
            <div className="border-b-2 border-dark" />
            <div className="flex items-center justify-between py-3 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-dark">
                  {article.author.name}
                </span>
                {article.author.role && (
                  <>
                    <span className="text-muted">·</span>
                    <span className="label">{article.author.role}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="label">{formatDate(article.publishedAt)}</span>
                <span className="text-muted">·</span>
                <span className="label">{article.readTimeMinutes} min read</span>
              </div>
            </div>

            {/* Article body */}
            <ArticleBody html={article.body} />

            {/* Author bio */}
            <div className="border border-light-200 p-4 mt-10 flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                {article.author.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-dark">{article.author.name}</p>
                {article.author.role && (
                  <p className="text-xs text-muted">{article.author.role}</p>
                )}
                <p className="text-xs text-muted mt-0.5">Contributing to UAE healthcare industry coverage</p>
              </div>
            </div>

            {/* Tags */}
            <div className="border-b border-light-200 mt-10 pt-6">
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/intelligence/tag/${tag}`}
                    className="inline-block px-2.5 py-1 text-xs font-mono bg-canvas-200 text-muted hover:bg-dark hover:text-white transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Source attribution */}
            {article.sourceName && (
              <div className="border-b border-light-200 mt-6 pt-4">
                <span className="label">
                  Source: {article.sourceName}
                  {article.source === "government" && " (Official)"}
                </span>
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-12">
                <div className="rule-warm" />
                <h2 className="font-sans text-xl font-bold text-dark pt-4 mb-6">
                  Related coverage
                </h2>
                <div className="space-y-0">
                  {related.map((rel, i) => (
                    <div key={rel.id}>
                      {i > 0 && <div className="border-b border-light-200 my-4" />}
                      <ArticleCard article={rel} variant="horizontal" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <NewsletterSignup />

            <div>
              <div className="border-b-2 border-dark mb-4" />
              <h3 className="label text-accent mb-4">Topics</h3>
              <TagCloud tags={tags} limit={20} />
            </div>

            {/* More in this category */}
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <h3 className="label text-accent mb-4">
                More in {category?.name}
              </h3>
              <div className="space-y-3">
                {getArticles({ category: article.category, limit: 5, excludeSlug: article.slug }).articles.map(
                  (a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  )
                )}
              </div>
            </div>

            {/* Cross-link to directory */}
            <div className="border border-light-200 p-4">
              <h3 className="text-sm font-bold text-dark mb-3">Browse the Directory</h3>
              <div className="space-y-2">
                <Link href="/directory/dubai" className="block text-sm text-muted hover:text-accent">Dubai Healthcare Providers</Link>
                <Link href="/directory/abu-dhabi" className="block text-sm text-muted hover:text-accent">Abu Dhabi Healthcare Providers</Link>
                <Link href="/directory/sharjah" className="block text-sm text-muted hover:text-accent">Sharjah Healthcare Providers</Link>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
