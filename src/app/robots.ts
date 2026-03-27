import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/helpers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/claim/', '/search'] },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
    ],
    sitemap: [
      `${getBaseUrl()}/sitemap.xml`,
      `${getBaseUrl()}/sitemap-providers.xml`,
    ],
  };
}
