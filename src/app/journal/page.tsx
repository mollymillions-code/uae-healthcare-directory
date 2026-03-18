import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FeaturedArticle } from "@/components/journal/FeaturedArticle";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { CategoryNav } from "@/components/journal/CategoryNav";
import { BreakingTicker } from "@/components/journal/BreakingTicker";
import { EventsSidebar } from "@/components/journal/EventsSidebar";
import { SocialFeed } from "@/components/journal/SocialFeed";
import { TagCloud } from "@/components/journal/TagCloud";
import { NewsletterSignup } from "@/components/journal/NewsletterSignup";
import {
  getFeaturedArticles,
  getBreakingArticles,
  getLatestArticles,
  getUpcomingEvents,
  getLatestSocialPosts,
  getAllTags,
  getArticles,
} from "@/lib/journal/data";
import { journalListingSchema } from "@/lib/journal/seo";
import { getBaseUrl } from "@/lib/helpers";
import { JOURNAL_CATEGORIES } from "@/lib/journal/categories";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "UAE Healthcare Journal | Industry News, Regulation & Market Intelligence",
  description:
    "Real-time coverage of UAE healthcare: regulatory updates from DHA, DOH, MOHAP, new clinic openings, financial analysis, health tech, events, and workforce trends. The definitive journal for healthcare professionals in the UAE and Middle East.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "UAE Healthcare Journal",
  },
  alternates: {
    types: {
      "application/rss+xml": `${getBaseUrl()}/journal/feed.xml`,
    },
  },
};

export default function JournalPage() {
  const featured = getFeaturedArticles(2);
  const breaking = getBreakingArticles();
  const latest = getLatestArticles(20);
  const events = getUpcomingEvents(5);
  const socialPosts = getLatestSocialPosts(4);
  const tags = getAllTags();

  // Articles not in featured, for the main feed
  const featuredSlugs = new Set(featured.map((a) => a.slug));
  const feedArticles = latest.filter((a) => !featuredSlugs.has(a.slug));

  const hero = featured[0];
  const secondary = featured[1];

  // Category counts for the index
  const categoryCounts = JOURNAL_CATEGORIES.map((cat) => ({
    ...cat,
    count: getArticles({ category: cat.slug }).total,
  }));

  return (
    <>
      <JsonLd data={journalListingSchema(latest.slice(0, 10))} />

      {/* Breaking ticker */}
      <BreakingTicker articles={breaking} />

      {/* Journal masthead */}
      <div className="container-wide pt-10 pb-4">
        <div className="text-center">
          <Link href="/journal">
            <h1 className="font-display text-display-lg font-bold text-ink tracking-tight">
              The Journal
            </h1>
          </Link>
          <p className="font-display text-ink-muted mt-1">
            UAE Healthcare Industry Intelligence
          </p>
        </div>
      </div>

      {/* Category navigation */}
      <div className="container-wide pb-8">
        <CategoryNav />
      </div>

      {/* ─── Hero + Secondary ─── */}
      {hero && (
        <section className="container-wide pb-12">
          <div className="rule-thick" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-6">
            {/* Hero article — large */}
            <div className="lg:col-span-3">
              <FeaturedArticle article={hero} variant="hero" />
            </div>

            {/* Secondary featured + mini feed */}
            <div className="lg:col-span-2 lg:border-l lg:border-ink-light lg:pl-8">
              {secondary && (
                <>
                  <FeaturedArticle article={secondary} variant="secondary" />
                  <div className="rule my-5" />
                </>
              )}

              {/* Quick headlines */}
              <div className="space-y-4">
                {feedArticles.slice(0, 4).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Main feed + Sidebar ─── */}
      <section className="container-wide pb-16">
        <div className="rule-thick" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-6">
          {/* Main article feed */}
          <div className="lg:col-span-2">
            <h2 className="label text-gold mb-6">Latest</h2>
            <div className="space-y-0">
              {feedArticles.slice(0, 12).map((article, i) => (
                <div key={article.id}>
                  {i > 0 && <div className="rule my-5" />}
                  <ArticleCard article={article} variant="horizontal" />
                </div>
              ))}
            </div>

            {feedArticles.length > 12 && (
              <div className="rule mt-6 pt-6 text-center">
                <Link
                  href="/journal/category/regulatory"
                  className="label hover:text-gold transition-colors"
                >
                  View all articles →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <NewsletterSignup />

            {/* Section index */}
            <div>
              <h3 className="label text-gold mb-4">Sections</h3>
              <div className="space-y-0">
                {categoryCounts.map((cat, i) => (
                  <div key={cat.slug}>
                    {i > 0 && <div className="rule" />}
                    <Link
                      href={`/journal/category/${cat.slug}`}
                      className="group flex items-baseline justify-between py-2.5"
                    >
                      <span className="text-sm text-ink-muted group-hover:text-gold transition-colors">
                        {cat.name}
                      </span>
                      <span className="font-kicker text-xs text-ink-muted">
                        {cat.count}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="rule-thick mb-4" />
              <EventsSidebar events={events} />
            </div>

            {/* Social pulse */}
            <div>
              <div className="rule-thick mb-4" />
              <SocialFeed posts={socialPosts} />
            </div>

            {/* Tags */}
            <div>
              <div className="rule-thick mb-4" />
              <h3 className="label text-gold mb-4">Topics</h3>
              <TagCloud tags={tags} limit={24} />
            </div>
          </aside>
        </div>
      </section>

      {/* ─── AEO Answer Block ─── */}
      <section className="container-wide pb-16">
        <div className="answer-block" data-answer-block="true">
          <p className="font-display text-ink-muted leading-relaxed">
            The UAE Healthcare Journal is the definitive source for healthcare
            industry news in the United Arab Emirates. Covering regulatory updates
            from DHA (Dubai), DOH (Abu Dhabi), and MOHAP (Northern Emirates), new
            facility openings, financial analysis, health tech innovation, workforce
            trends, and market intelligence. Published daily for healthcare
            professionals including physicians, hospital administrators, marketing
            executives, investors, and health tech founders. Last updated March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
