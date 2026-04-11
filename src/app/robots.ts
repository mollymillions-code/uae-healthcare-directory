import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/helpers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/claim/', '/search', '/ar/search', '/dashboard/', '/admin/', '/login/'] },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
    ],
    sitemap: [
      `${getBaseUrl()}/sitemap.xml`,
      `${getBaseUrl()}/sitemap-providers.xml`,
      `${getBaseUrl()}/sitemap-providers-ar.xml`,
      `${getBaseUrl()}/sitemap-doctors.xml`,
      `${getBaseUrl()}/sitemap-intelligence.xml`,
      // Item 6 — Zavis Intelligence Reports ("What UAE Patients Want")
      `${getBaseUrl()}/sitemap-reports.xml`,
      `${getBaseUrl()}/sitemap-qa.xml`,
      `${getBaseUrl()}/sitemap-sa.xml`,
      `${getBaseUrl()}/sitemap-bh.xml`,
      `${getBaseUrl()}/sitemap-kw.xml`,
    ],
  };
}
