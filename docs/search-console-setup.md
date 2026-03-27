# Google Search Console Setup Guide

## 1. Verify Site Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property** → choose **URL prefix** → enter `https://www.zavis.ai`
3. Select **HTML tag** verification method
4. Copy the `content` value from the meta tag they provide
5. Add it to `.env.local` (and EC2 production env vars):
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_code_here
   ```
   The root layout already reads this env var and renders the meta tag automatically.
6. Deploy the site, then click **Verify** in GSC

> The canonical domain is `https://www.zavis.ai` (with www). Add `https://www.zavis.ai` as the URL prefix property. If non-www redirects are in place, you can optionally add `https://zavis.ai` as a second property and link them via domain redirect settings.

## 2. Submit Sitemaps

Submit **both** sitemaps in GSC → **Sitemaps** (left sidebar):

1. `https://www.zavis.ai/sitemap.xml` — structural pages (city/category/area/labs/insurance/intelligence), ~5,000+ URLs with hreflang alternates
2. `https://www.zavis.ai/sitemap-providers.xml` — all 12,500+ individual provider profile pages (English + Arabic mirrors), regenerated every hour via ISR

Both are also declared in `robots.txt` so crawlers discover them automatically.

## 3. Request Indexing for Key Pages

Use the **URL Inspection** tool in GSC to manually request indexing for high-priority pages:

- `/` — Homepage
- `/directory` — Directory landing
- `/directory/dubai` — Dubai listings
- `/directory/abu-dhabi` — Abu Dhabi listings
- `/directory/sharjah` — Sharjah listings
- `/intelligence` — Journal/Intelligence hub
- Top 5–10 journal articles by traffic potential
- A sample of high-priority provider pages from `sitemap-providers.xml`

## 4. Submit to Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Import directly from GSC (easiest) or add manually
3. Submit both sitemaps:
   - `https://www.zavis.ai/sitemap.xml`
   - `https://www.zavis.ai/sitemap-providers.xml`

## 5. Post-Setup Monitoring Checklist

Check these weekly for the first month, then monthly:

| GSC Section | What to Check |
|---|---|
| **Performance** | Impressions, clicks, CTR, top queries |
| **Indexing → Pages** | All provider pages getting indexed, no errors |
| **Core Web Vitals** | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| **Mobile Usability** | No mobile rendering issues |
| **Enhancements → Rich Results** | FAQ, MedicalBusiness, Article schema being detected |
| **Sitemaps** | All submitted URLs discovered and indexed |
| **Links** | External links growing, internal links healthy |

## 6. Enable Email Alerts

In GSC → Settings → **Email preferences** → turn on notifications for:

- Indexing issues
- Manual actions
- Security issues
- Core Web Vitals regressions

## Already Done (No Action Needed)

These are already implemented in the codebase:

- Sitemap generation with hreflang (`src/app/sitemap.ts`)
- robots.txt (`src/app/robots.ts`)
- RSS feed (`src/app/(directory)/intelligence/feed.xml/route.ts`)
- JSON-LD structured data: Organization, MedicalBusiness, FAQPage, BreadcrumbList, Article, SearchAction (`src/lib/seo.ts`, `src/lib/intelligence/seo.ts`)
- OpenGraph and Twitter Card meta tags
- Canonical URLs and language alternates
- Speakable schema for voice search
