import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/helpers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/claim/"],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
