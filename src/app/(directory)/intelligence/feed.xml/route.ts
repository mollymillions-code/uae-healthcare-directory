import { getLatestArticles } from "@/lib/intelligence/data";
import { getJournalCategory } from "@/lib/intelligence/categories";
import { getBaseUrl } from "@/lib/helpers";

export async function GET() {
  const articles = getLatestArticles(30);
  const base = getBaseUrl();

  const items = articles
    .map((article) => {
      const category = getJournalCategory(article.category);
      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${base}/intelligence/${article.slug}</link>
      <guid isPermaLink="true">${base}/intelligence/${article.slug}</guid>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <category>${category?.name || article.category}</category>
      <dc:creator>${article.author.name}</dc:creator>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zavis Healthcare Industry Insights Feed</title>
    <link>${base}/intelligence</link>
    <description>Real-time UAE healthcare intelligence: regulatory updates, new openings, financial analysis, health tech, events, and workforce trends.</description>
    <language>en-ae</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/intelligence/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
