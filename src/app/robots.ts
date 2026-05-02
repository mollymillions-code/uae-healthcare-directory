import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/helpers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/account/', '/claim/', '/provider-portal', '/provider-portal/', '/search', '/ar/search', '/dashboard/', '/dashboard-auth/', '/admin/', '/login/', '/signup/', '/forgot-password/', '/reset-password/'] },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
    ],
    sitemap: [
      `${getBaseUrl()}/sitemap.xml`,
      `${getBaseUrl()}/sitemap-providers.xml`,
      `${getBaseUrl()}/sitemap-providers-ar.xml`,
      // Item 0.75 — Doctor profile sitemaps use a HIERARCHICAL structure:
      //   /sitemap-doctors.xml   = sitemap-index listing per-physician-
      //                            specialty children at /sitemap-doctors/[specialty]
      //   /sitemap-dentists.xml  = sitemap-index listing per-dentist-
      //                            specialty children at /sitemap-dentists/[specialty]
      // GSC auto-discovers the per-specialty children via the indices,
      // so we only register the two top-level indices here.
      `${getBaseUrl()}/sitemap-doctors.xml`,
      `${getBaseUrl()}/sitemap-dentists.xml`,
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
