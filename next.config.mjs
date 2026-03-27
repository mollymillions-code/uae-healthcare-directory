/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,
  images: {
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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
