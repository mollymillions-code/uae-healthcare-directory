import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { ArticleBody } from "@/components/intelligence/SocialEmbed";
import Image from "next/image";
import { getArticleBySlug, getArticleBodyBySlug, getRelatedArticles, getAllTags, getArticles, loadDbArticles } from "@/lib/intelligence/data";
import { articleSchema, clinicalArticleSchema, generateArticleFaqs } from "@/lib/intelligence/seo";
import { getBylineForArticle } from "@/lib/intelligence/authors";
import { getJournalCategory } from "@/lib/intelligence/categories";
import { formatDate } from "@/components/intelligence/utils";
import { getBaseUrl } from "@/lib/helpers";
import { faqPageSchema, breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { FaqSection } from "@/components/seo/FaqSection";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PageEvent } from "@/components/analytics/PageEvent";
import { getProviders } from "@/lib/data";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await loadDbArticles();
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const category = getJournalCategory(article.category);
  const base = getBaseUrl();

  // Title is passed through root layout template which appends " | Zavis"
  const metaTitle = article.title;
  return {
    title: metaTitle,
    description: article.excerpt.length > 160 ? article.excerpt.slice(0, 157).replace(/\s+\S*$/, "") + "..." : article.excerpt,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      section: category?.name,
      tags: article.tags,
      url: `${base}/intelligence/${article.slug}`,
      images: article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630, alt: article.title }] : [{ url: `${getBaseUrl()}/images/og-default.png`, width: 1200, height: 630, alt: article.title }],
    },
    alternates: {
      canonical: `${base}/intelligence/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  await loadDbArticles();
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const body = await getArticleBodyBySlug(params.slug);
  const fullArticle = { ...article, body: body || article.body };

  const category = getJournalCategory(fullArticle.category);
  const related = getRelatedArticles(article, 4);
  const tags = getAllTags();
  const articleFaqs = generateArticleFaqs(article);

  // Item 5 — load rich byline (author + reviewer profiles) when the article
  // has been bylined via author_slug / reviewer_slug. Falls back to null on
  // legacy rows; the renderer downgrades to the legacy plain byline path.
  const byline = await getBylineForArticle(
    article.authorSlug,
    article.reviewerSlug
  );
  const isClinical = article.isClinical === true;
  const lastReviewedDate = article.lastReviewedAt
    ? new Date(article.lastReviewedAt)
    : null;
  const citations = Array.isArray(article.citations) ? article.citations : [];

  return (
    <>
      {isClinical ? (
        <JsonLd
          data={clinicalArticleSchema(article, byline.author, byline.reviewer)}
        />
      ) : (
        <JsonLd data={articleSchema(article)} />
      )}
      <JsonLd data={breadcrumbSchema([
        { name: "Zavis", url: getBaseUrl() },
        { name: "Intelligence", url: `${getBaseUrl()}/intelligence` },
        { name: category?.name || article.category, url: `${getBaseUrl()}/intelligence/category/${article.category}` },
        { name: article.title },
      ])} />
      <JsonLd data={faqPageSchema(articleFaqs)} />
      <JsonLd data={speakableSchema(["h1", "article"])} />

      <PageEvent event="article_view" params={{ slug: params.slug, category: fullArticle.category }} />

      {/* Back link */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-black/40 hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Intelligence
        </Link>
      </div>

      <article className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article body */}
          <div className="lg:col-span-2">
            {/* Category + meta */}
            <div className="flex items-center gap-2 mb-4">
              <Link
                href={`/intelligence/category/${article.category}`}
                className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] hover:text-[#004d1c] transition-colors"
              >
                {category?.name}
              </Link>
              {article.isBreaking && (
                <span className="inline-flex items-center gap-1 font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-red-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  Breaking
                </span>
              )}
            </div>

            {/* Hero image */}
            {article.imageUrl && (
              <div className="relative w-full aspect-[16/9] mb-6 overflow-hidden rounded-2xl bg-[#f8f8f6]">
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
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-5">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="font-['Geist',sans-serif] font-medium text-[16px] text-black/50 leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Byline */}
            <div className="border-b-2 border-[#1c1c1c]" />
            <div className="flex flex-col gap-2 py-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {byline.author ? (
                    <Link
                      href={`/intelligence/author/${byline.author.slug}`}
                      className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:text-[#006828] transition-colors"
                    >
                      {byline.author.name}
                    </Link>
                  ) : (
                    <span className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                      {article.author.name}
                    </span>
                  )}
                  {(byline.author?.role || article.author.role) && (
                    <>
                      <span className="text-black/30">·</span>
                      <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">
                        {byline.author?.role || article.author.role}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">{formatDate(article.publishedAt)}</span>
                  <span className="text-black/30">·</span>
                  <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">{article.readTimeMinutes} min read</span>
                </div>
              </div>
              {byline.reviewer && (
                <div className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-xs text-black/55">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#006828]" />
                  <span>
                    {isClinical ? "Medically reviewed by" : "Reviewed by"}{" "}
                    <Link
                      href={`/intelligence/reviewer/${byline.reviewer.slug}`}
                      className="font-semibold text-[#1c1c1c] hover:text-[#006828] transition-colors"
                    >
                      {byline.reviewer.name}
                    </Link>
                    {byline.reviewer.title ? `, ${byline.reviewer.title}` : ""}
                    {lastReviewedDate
                      ? ` · last reviewed ${formatDate(lastReviewedDate.toISOString())}`
                      : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="mb-8" />

            {/* Article body */}
            <ArticleBody html={fullArticle.body} />

            {/* Sources / Citations — only when populated. Numbered footnotes
                so the renderer can reference them inline in the body text. */}
            {citations.length > 0 && (
              <section className="mt-10 border-t border-black/[0.06] pt-6" id="sources">
                <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                  Sources
                </h2>
                <ol className="space-y-3 list-decimal list-outside pl-5">
                  {citations.map((c, i) => (
                    <li
                      key={c.id || `${c.url}-${i}`}
                      className="font-['Geist',sans-serif] text-[13px] text-black/60 leading-relaxed"
                    >
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1c1c1c] font-medium hover:text-[#006828] hover:underline"
                      >
                        {c.label}
                      </a>
                      {c.publisher ? <span className="text-black/40"> — {c.publisher}</span> : null}
                      {c.doi ? (
                        <span className="text-black/40">
                          {" "}
                          ·{" "}
                          <a
                            href={`https://doi.org/${c.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#006828]"
                          >
                            doi:{c.doi}
                          </a>
                        </span>
                      ) : null}
                      {c.pubmedId ? (
                        <span className="text-black/40">
                          {" "}
                          ·{" "}
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${c.pubmedId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#006828]"
                          >
                            PMID:{c.pubmedId}
                          </a>
                        </span>
                      ) : null}
                      {c.accessedAt ? (
                        <span className="text-black/30"> · accessed {c.accessedAt}</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Author bio — links to rich author profile when present */}
            {byline.author ? (
              <Link
                href={`/intelligence/author/${byline.author.slug}`}
                className="border border-black/[0.06] rounded-2xl p-5 mt-10 flex items-center gap-4 hover:border-[#006828]/40 transition-colors"
              >
                <div className="flex-shrink-0 h-11 w-11 rounded-full bg-[#006828] flex items-center justify-center text-white font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm">
                  {byline.author.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight">{byline.author.name}</p>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">{byline.author.role}</p>
                  <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">
                    {byline.author.bio.length > 110
                      ? `${byline.author.bio.slice(0, 107)}...`
                      : byline.author.bio}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="border border-black/[0.06] rounded-2xl p-5 mt-10 flex items-center gap-4">
                <div className="flex-shrink-0 h-11 w-11 rounded-full bg-[#006828] flex items-center justify-center text-white font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm">
                  {article.author.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight">{article.author.name}</p>
                  {article.author.role && (
                    <p className="font-['Geist',sans-serif] text-xs text-black/40">{article.author.role}</p>
                  )}
                  <p className="font-['Geist',sans-serif] text-xs text-black/30 mt-0.5">Contributing to UAE healthcare industry coverage</p>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="border-b border-black/[0.06] mt-10 pt-6">
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/intelligence/tag/${tag}`}
                    className="inline-block font-['Geist',sans-serif] px-3 py-1 text-xs font-medium bg-[#f8f8f6] text-black/50 rounded-full border border-black/[0.06] hover:bg-[#1c1c1c] hover:text-white hover:border-[#1c1c1c] transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Source attribution */}
            {article.sourceName && (
              <div className="border-b border-black/[0.06] mt-6 pt-4">
                <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-medium text-black/40">
                  Source: {article.sourceName}
                  {article.source === "government" && " (Official)"}
                </span>
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-12">
                <div className="border-b-2 border-[#1c1c1c]" />
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight pt-4 mb-6">
                  Related coverage
                </h2>
                <div className="space-y-0">
                  {related.map((rel, i) => (
                    <div key={rel.id}>
                      {i > 0 && <div className="border-b border-black/[0.06] my-4" />}
                      <ArticleCard article={rel} variant="horizontal" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FaqSection faqs={articleFaqs} title="FAQ" />
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">Topics</h3>
              <TagCloud tags={tags} limit={20} />
            </div>

            {/* More in this category */}
            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
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

            {/* Related Providers — hub-and-spoke cross-link */}
            {await (async () => {
              // Match article tags against known cities and categories
              const tagsLower = article.tags.map((t) => t.toLowerCase());
              const matchedCity = CITIES.find((c) =>
                tagsLower.some((t) => t.includes(c.slug.replace(/-/g, " ")) || t.includes(c.name.toLowerCase()))
              );
              const matchedCategory = CATEGORIES.find((c) =>
                tagsLower.some((t) => {
                  const catWords = c.name.toLowerCase().split(/[\s&/]+/).filter((w) => w.length > 3);
                  return t.includes(c.slug) || catWords.some((w) => t.includes(w.replace(/s$/, "")));
                })
              );

              if (!matchedCity && !matchedCategory) {
                // Fallback: static directory links
                return (
                  <div className="border border-black/[0.06] rounded-2xl p-5">
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight mb-3">Browse the Directory</h3>
                    <div className="space-y-2">
                      <Link href="/directory/dubai" className="block font-['Geist',sans-serif] text-sm font-medium text-black/50 hover:text-[#006828] transition-colors">Dubai Healthcare Providers</Link>
                      <Link href="/directory/abu-dhabi" className="block font-['Geist',sans-serif] text-sm font-medium text-black/50 hover:text-[#006828] transition-colors">Abu Dhabi Healthcare Providers</Link>
                      <Link href="/directory/sharjah" className="block font-['Geist',sans-serif] text-sm font-medium text-black/50 hover:text-[#006828] transition-colors">Sharjah Healthcare Providers</Link>
                    </div>
                  </div>
                );
              }

              const { providers } = await getProviders({
                citySlug: matchedCity?.slug,
                categorySlug: matchedCategory?.slug,
                sort: "rating",
                limit: 5,
              });

              const topProviders = providers.filter((p) => Number(p.googleRating) > 0).slice(0, 4);
              const contextLabel = matchedCity && matchedCategory
                ? `${matchedCategory.name} in ${matchedCity.name}`
                : matchedCategory
                  ? matchedCategory.name
                  : `Providers in ${matchedCity!.name}`;
              const browseHref = matchedCity && matchedCategory
                ? `/directory/${matchedCity.slug}/${matchedCategory.slug}`
                : matchedCategory
                  ? `/best/${matchedCategory.slug}`
                  : `/directory/${matchedCity!.slug}`;

              return (
                <div className="border border-black/[0.06] rounded-2xl p-5">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight mb-1">Related Providers</h3>
                  <p className="font-['Geist',sans-serif] text-[11px] text-black/30 mb-3">{contextLabel}</p>
                  {topProviders.length > 0 ? (
                    <div className="space-y-3">
                      {topProviders.map((p) => (
                        <Link
                          key={p.id}
                          href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                          className="block group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-medium text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">{p.name}</p>
                              <p className="font-['Geist',sans-serif] text-[11px] text-black/40 truncate">{p.address}</p>
                            </div>
                            {Number(p.googleRating) > 0 && (
                              <span className="flex-shrink-0 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{p.googleRating} ★</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    href={browseHref}
                    className="block mt-3 pt-3 border-t border-black/[0.06] font-['Geist',sans-serif] text-xs font-semibold text-[#006828] hover:underline"
                  >
                    Browse all {contextLabel.toLowerCase()} &rarr;
                  </Link>
                </div>
              );
            })()}
          </aside>
        </div>
      </article>
    </>
  );
}
