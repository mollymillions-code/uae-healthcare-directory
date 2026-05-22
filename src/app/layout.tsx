import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { RouteChangeTracker } from "@/components/analytics/RouteChangeTracker";
import { DeferredMarketingTags } from "@/components/analytics/DeferredMarketingTags";
import { NextAuthProvider } from "@/components/auth/NextAuthProvider";
import { RouteLoadingOverlay } from "@/components/layout/RouteLoadingOverlay";
import { PostActionAccountPrompt } from "@/components/account/PostActionAccountPrompt";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "optional",
  preload: false,
  weight: ["400", "500", "600", "700"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Zavis | AI-Powered Healthcare Intelligence for the UAE",
    template: "%s | Zavis",
  },
  description:
    "Zavis brings AI-powered healthcare intelligence to the UAE. Open healthcare directory, industry insights, and data analytics for providers, payers, and policymakers.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Zavis",
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/images/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Zavis — AI-Powered Healthcare Intelligence for the UAE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zaaborz",
    images: [`${baseUrl}/images/og-default.png`],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION
        ? { "yandex-verification": process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION }
        : {}),
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: AR routes flip <html lang/dir> client-side via the
  // SetArabicLang component mounted in `(directory)/ar/layout.tsx`.
  // Calling `headers()` here would make every ISR page dynamic
  // (DYNAMIC_SERVER_USAGE), so we accept a brief lang=en flash on
  // AR routes. Googlebot still picks up the correct attributes
  // because it executes the SetArabicLang script before indexing.
  return (
    <html lang="en" dir="ltr" className={`${dmSans.variable} ${bricolage.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://places.googleapis.com" />
      </head>
      {/* Lightweight tracking shims. Heavy marketing tags load after interaction or an 8s timeout in DeferredMarketingTags. */}
      <Script id="tracking-shims" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){var a=arguments;if(a[0]==="event"){var n=a[1];if(n==="engaged_session"||n==="scroll_milestone"||n==="outbound_click"||n==="contact_click")return;}dataLayer.push(a);}window.gtag=gtag;if(!window.fbq){window.fbq=function(){window.fbq.queue=window.fbq.queue||[];window.fbq.queue.push(arguments)};window.fbq.queue=[];}if(!window.lintrk){window.lintrk=function(){window.lintrk.q=window.lintrk.q||[];window.lintrk.q.push(arguments)};window.lintrk.q=[];}if(!window.clarity){window.clarity=function(){window.clarity.q=window.clarity.q||[];window.clarity.q.push(arguments)};window.clarity.q=[];}`}</Script>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        {/* GTM noscript */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9N3FDMQ" height="0" width="0" style={{display:'none',visibility:'hidden'}} title="google-tag-manager"></iframe></noscript>
        {/* LinkedIn noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} alt="" src="https://px.ads.linkedin.com/collect/?pid=8657833&fmt=gif" /></noscript>
        {/* Meta Pixel noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=1045406841134462&ev=PageView&noscript=1" alt="facebook-pixel" /></noscript>
        <DeferredMarketingTags />
        <RouteChangeTracker />
        <Suspense fallback={null}>
          <RouteLoadingOverlay />
        </Suspense>
        <NextAuthProvider>
          {children}
          <PostActionAccountPrompt />
        </NextAuthProvider>
      </body>
    </html>
  );
}
