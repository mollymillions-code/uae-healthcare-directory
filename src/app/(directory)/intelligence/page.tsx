import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FeaturedArticle } from "@/components/intelligence/FeaturedArticle";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { CategoryNav } from "@/components/intelligence/CategoryNav";
import { BreakingTicker } from "@/components/intelligence/BreakingTicker";
import { EventsSidebar } from "@/components/intelligence/EventsSidebar";
import { SocialFeed } from "@/components/intelligence/SocialFeed";
import { TagCloud } from "@/components/intelligence/TagCloud";
import {
  getFeaturedArticles,
  getBreakingArticles,
  getLatestArticles,
  getUpcomingEvents,
  getLatestSocialPosts,
  getAllTags,
  getArticles,
  loadDbArticles,
} from "@/lib/intelligence/data";
import { journalListingSchema } from "@/lib/intelligence/seo";
import { speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";

export const dynamic = "force-dynamic"; // Avoid ISR oversized page error — always fresh

export const metadata: Metadata = {
  title: "Zavis Healthcare Industry Insights | UAE Healthcare News, Regulation & Market Data",
  description:
    "Real-time coverage of UAE healthcare: regulatory updates from DHA, DOH, MOHAP, new clinic openings, financial analysis, health tech, events, and workforce trends. The definitive source for healthcare professionals in the UAE and Middle East.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Zavis Healthcare Industry Insights",
    url: `${getBaseUrl()}/intelligence`,
    images: [{ url: `${getBaseUrl()}/images/og-default.png`, width: 1200, height: 630, alt: "Zavis Healthcare Industry Insights" }],
  },
  alternates: {
    canonical: `${getBaseUrl()}/intelligence`,
    types: {
      "application/rss+xml": `${getBaseUrl()}/intelligence/feed.xml`,
    },
  },
};

export default async function JournalPage() {
  // Load articles from DB before rendering
  await loadDbArticles();

  const featured = getFeaturedArticles(2);
  const breaking = getBreakingArticles();
  const latest = getLatestArticles(50);
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
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breaking ticker */}
      <BreakingTicker articles={breaking} />

      {/* Journal masthead — STAT News style */}
      <div className="container-tc pt-10 pb-4">
        <div className="text-center">
          <Link href="/intelligence">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-dark tracking-tight">
              Zavis Healthcare Industry Insights
            </h1>
          </Link>
          <p className="text-sm text-muted mt-2 tracking-wide uppercase font-sans">
            Industry news, analysis &amp; market data
          </p>
        </div>
      </div>

      {/* Category navigation */}
      <div className="container-tc pb-8">
        <CategoryNav />
      </div>

      {/* --- Empty state --- */}
      {feedArticles.length === 0 && !hero && (
        <div className="container-tc py-16 text-center">
          <p className="text-muted text-lg">No articles published yet. Check back soon.</p>
        </div>
      )}

      {/* --- Hero + Secondary --- */}
      {hero && (
        <section className="container-tc pb-12">
          <div className="border-b-2 border-dark" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-6">
            {/* Hero article -- large */}
            <div className="lg:col-span-3">
              <FeaturedArticle article={hero} variant="hero" />
            </div>

            {/* Secondary featured + mini feed */}
            <div className="lg:col-span-2 lg:border-l lg:border-light-200 lg:pl-8">
              {secondary && (
                <>
                  <FeaturedArticle article={secondary} variant="secondary" />
                  <div className="border-b border-light-200 my-5" />
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

      {/* --- Main feed + Sidebar --- */}
      {(feedArticles.length > 0 || tags.length > 0) && (
      <section className="container-tc pb-16">
        <div className="border-b-2 border-dark" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-6">
          {/* Main article feed */}
          <div className="lg:col-span-2">
            <h2 className="label text-accent mb-6">Latest</h2>
            {feedArticles.length === 0 ? (
              <p className="text-muted py-8">No articles yet.</p>
            ) : (
            <div className="space-y-0">
              {feedArticles.slice(0, 12).map((article, i) => (
                <div key={article.id}>
                  {i > 0 && <div className="border-b border-light-200 my-5" />}
                  <ArticleCard article={article} variant="horizontal" />
                </div>
              ))}
            </div>
            )}

            {feedArticles.length > 12 && (
              <div className="border-b border-light-200 mt-6 pt-6 text-center">
                <Link
                  href="/intelligence/category/regulatory"
                  className="label hover:text-accent transition-colors"
                >
                  View all articles →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Section index */}
            <div>
              <h3 className="label text-accent mb-4">Sections</h3>
              <div className="space-y-0">
                {categoryCounts.map((cat, i) => (
                  <div key={cat.slug}>
                    {i > 0 && <div className="border-b border-light-200" />}
                    <Link
                      href={`/intelligence/category/${cat.slug}`}
                      className="group flex items-baseline justify-between py-2.5"
                    >
                      <span className="text-sm text-muted group-hover:text-accent transition-colors">
                        {cat.name}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {cat.count}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <EventsSidebar events={events} />
            </div>

            {/* Social pulse */}
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <SocialFeed posts={socialPosts} />
            </div>

            {/* Tags */}
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <h3 className="label text-accent mb-4">Topics</h3>
              <TagCloud tags={tags} limit={24} />
            </div>
          </aside>
        </div>
      </section>
      )}

      {/* --- AEO Answer Block --- */}
      <section className="container-tc pb-16">
        <div className="answer-block" data-answer-block="true">
          <p className="font-sans text-muted leading-relaxed">
            Zavis Healthcare Industry Insights is the definitive source for healthcare industry news in the United Arab Emirates, covering nine content categories: Regulatory &amp; Policy, New Openings, Finance &amp; Investment, Events &amp; Conferences, Social Pulse, Thought Leadership, Market Intelligence, Health Tech &amp; Innovation, and Workforce &amp; Talent. Published daily, it tracks regulatory updates from DHA (Dubai), DOH (Abu Dhabi), and MOHAP (Northern Emirates), along with facility openings, M&amp;A activity, funding rounds, and workforce trends. The publication serves healthcare professionals, hospital administrators, investors, and health tech founders operating in the UAE and broader GCC market. Data sourced from official government registers and verified industry sources. Last updated March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
