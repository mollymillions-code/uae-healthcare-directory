import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Lora, Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { RouteChangeTracker } from "@/components/analytics/RouteChangeTracker";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geist = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
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
  return (
    <html lang="en" dir="ltr" className={`${dmSans.variable} ${spaceMono.variable} ${lora.variable} ${bricolage.variable} ${geist.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      {/* Google Tag Manager — loads GA4 + Google Ads + all event tags */}
      <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-T9N3FDMQ');`}</Script>
      {/* Minimal gtag shim — lets gtag_report_conversion() push to dataLayer for GTM */}
      <Script id="gtag-shim" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;`}</Script>
      {/* Microsoft Clarity */}
      <Script id="clarity" strategy="lazyOnload">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","swpafowqk4");`}</Script>
      {/* LinkedIn Insight Tag — afterInteractive so conversions aren't missed */}
      <Script id="linkedin-insight" strategy="afterInteractive">{`_linkedin_partner_id = "8657833";window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`}</Script>
      {/* Meta Pixel — afterInteractive so PageView fires promptly and Lead event is never missed */}
      <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1045406841134462');fbq('track','PageView');`}</Script>
      {/* Reb2b Visitor Identification */}
      <Script id="reb2b" strategy="lazyOnload">{`!function(key){if(window.reb2b)return;window.reb2b={loaded:true};var s=document.createElement("script");s.async=true;s.src="https://ddwl4m2hdecbv.cloudfront.net/b/"+key+"/"+key+".js.gz";document.getElementsByTagName("script")[0].parentNode.insertBefore(s,document.getElementsByTagName("script")[0]);}("GOYPYHQZ9POX");`}</Script>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        {/* GTM noscript */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9N3FDMQ" height="0" width="0" style={{display:'none',visibility:'hidden'}} title="google-tag-manager"></iframe></noscript>
        {/* LinkedIn noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} alt="" src="https://px.ads.linkedin.com/collect/?pid=8657833&fmt=gif" /></noscript>
        {/* Meta Pixel noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=1045406841134462&ev=PageView&noscript=1" alt="facebook-pixel" /></noscript>
        <RouteChangeTracker />
        {children}
      </body>
    </html>
  );
}
