/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,
  // Disable in-memory ISR/fetch cache. Workers were bloating from 150MB
  // to 3GB over 24h as cached pages accumulated in the Node.js heap.
  // With this set to 0, Next.js uses the file-system cache (.next/cache/)
  // instead. PM2 max_memory_restart at 2G acts as a safety net.
  cacheMaxMemorySize: 0,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Disable the built-in image optimizer. All images are served as
    // direct static URLs (R2 CDN, /public/, WebP/PNG assets) with standard
    // <img>-equivalent delivery — no runtime proxy, no /_next/image
    // transformation. This removes the per-request CPU + memory cost of
    // re-encoding and lets Cloudflare cache every asset at the edge
    // directly off the origin URL. `formats` + `remotePatterns` become
    // no-ops when unoptimized=true but stay for documentation.
    unoptimized: true,
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
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
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
