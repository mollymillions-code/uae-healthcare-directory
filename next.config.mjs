/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,
  // Disable in-memory ISR/fetch cache. Workers were bloating from 150MB
  // to 3GB over 24h as cached pages accumulated in the Node.js heap.
  // With this set to 0, Next.js uses the file-system cache (.next/cache/)
  // instead. PM2 max_memory_restart at 6G acts as the crawl-spike safety net
  // on the 30GB Lightsail host.
  cacheMaxMemorySize: 0,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Provider photos are often large source JPEGs from R2. Keep the Next image
    // optimizer on so mobile directory pages receive right-sized AVIF/WebP
    // variants instead of full source files. Cloudflare should cache /_next/image
    // responses at the edge, while Next keeps generated variants on disk.
    minimumCacheTTL: 604800,
    deviceSizes: [390, 640, 828, 1080],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.who.int" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.gstatic.com" },
      { protocol: "https", hostname: "**.reuters.com" },
      { protocol: "https", hostname: "**.arabnews.com" },
      { protocol: "https", hostname: "**.gulfnews.com" },
      { protocol: "https", hostname: "**.khaleejtimes.com" },
      { protocol: "https", hostname: "**.thenationalnews.com" },
      { protocol: "https", hostname: "**.zawya.com" },
      { protocol: "https", hostname: "**.arabianbusiness.com" },
      { protocol: "https", hostname: "**.wam.ae" },
      { protocol: "https", hostname: "**.wamda.com" },
      { protocol: "https", hostname: "**.mobihealthnews.com" },
      { protocol: "https", hostname: "**.fiercehealthcare.com" },
      { protocol: "https", hostname: "pub-12b97f7acbe84e70aacc715287b58c72.r2.dev" },
      // Verified provider-owned assets that have not been copied to R2 yet.
      { protocol: "https", hostname: "physiocuredubai.com" },
      { protocol: "https", hostname: "silkclinicsdubai.com" },
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
  async redirects() {
    // City slug aliases — common UAE abbreviations users type or paste in URLs.
    // 301 to the canonical slug so search engines collapse the duplicates and
    // ISR/CDN caches don't fragment across variants.
    const cityAliases = [
      { from: "uaq", to: "umm-al-quwain" },
      { from: "rak", to: "ras-al-khaimah" },
    ];
    const redirects = [
      {
        source: "/contact",
        destination: "/book-a-demo",
        permanent: true,
      },
      // Arabic intelligence mirrors are incomplete; keep these as real HTTP
      // redirects instead of App Router meta-refresh redirects.
      {
        source: "/ar/intelligence",
        destination: "/intelligence",
        permanent: false,
      },
      {
        source: "/ar/intelligence/author",
        destination: "/intelligence/author",
        permanent: false,
      },
      {
        source: "/ar/intelligence/author/:slug",
        destination: "/intelligence/author/:slug",
        permanent: false,
      },
      {
        source: "/ar/intelligence/reviewer/:slug",
        destination: "/intelligence/reviewer/:slug",
        permanent: false,
      },
    ];
    for (const { from, to } of cityAliases) {
      redirects.push({
        source: `/directory/${from}/:path*`,
        destination: `/directory/${to}/:path*`,
        permanent: true,
      });
      redirects.push({
        source: `/ar/directory/${from}/:path*`,
        destination: `/ar/directory/${to}/:path*`,
        permanent: true,
      });
    }
    return redirects;
  },
  async headers() {
    const publicSeoPageHeaders = [
      { key: "Cache-Control", value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
      { key: "CDN-Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
      { key: "X-Zavis-SEO-Cache", value: "public-html" },
    ];

    const publicSeoRoutes = [
      "/directory/:path*",
      "/ar/directory/:path*",
      "/tr/directory/:path*",
      "/find-a-doctor/:path*",
      "/ar/find-a-doctor/:path*",
      "/professionals/:path*",
      "/ar/professionals/:path*",
      "/insurance/:path*",
      "/ar/insurance/:path*",
      "/pricing/:path*",
      "/ar/pricing/:path*",
      "/labs/:path*",
      "/ar/labs/:path*",
      "/specialties/:path*",
      "/ar/specialties/:path*",
      "/medications/:path*",
      "/ar/medications/:path*",
      "/best/:path*",
      "/ar/best/:path*",
    ];

    return [
      ...publicSeoRoutes.map((source) => ({
        source,
        headers: publicSeoPageHeaders,
      })),
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://snap.licdn.com https://static.cloudflareinsights.com https://www.clarity.ms https://googleads.g.doubleclick.net https://ddwl4m2hdecbv.cloudfront.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com https://*.facebook.com https://snap.licdn.com https://static.cloudflareinsights.com https://www.google.com https://www.google.co.in https://googleads.g.doubleclick.net https://stats.g.doubleclick.net https://px.ads.linkedin.com https://www.clarity.ms https://app.zavis.ai https://crm.zavis.ai https://clientops.zavisinternaltools.in",
              "frame-src 'self' https://www.googletagmanager.com https://www.youtube.com https://www.youtube-nocookie.com https://app.zavis.ai https://crm.zavis.ai https://www.google.com https://maps.google.com https://*.google.com",
              "media-src 'self' https://pub-12b97f7acbe84e70aacc715287b58c72.r2.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self' https://app.zavis.ai https://crm.zavis.ai",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
