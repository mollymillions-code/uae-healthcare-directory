import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Lora, Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
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
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-T9N3FDMQ');` }} />
        {/* Google Ads / gtag.js */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17389420890" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'AW-17389420890');` }} />
        {/* Twitter / X Pixel */}
        <script dangerouslySetInnerHTML={{ __html: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','pb3r6');` }} />
        {/* Microsoft Clarity */}
        <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","swpafowqk4");` }} />
        {/* LinkedIn Insight Tag */}
        <script dangerouslySetInnerHTML={{ __html: `_linkedin_partner_id = "8657833";window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);` }} />
        {/* Meta Pixel */}
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1045406841134462');fbq('track','PageView');` }} />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        {/* GTM noscript */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9N3FDMQ" height="0" width="0" style={{display:'none',visibility:'hidden'}} title="google-tag-manager"></iframe></noscript>
        {/* LinkedIn noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} alt="" src="https://px.ads.linkedin.com/collect/?pid=8657833&fmt=gif" /></noscript>
        {/* Meta Pixel noscript */}
        <noscript><img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=1045406841134462&ev=PageView&noscript=1" alt="facebook-pixel" /></noscript>
        {children}
      </body>
    </html>
  );
}
