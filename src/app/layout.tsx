import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Space_Mono, Lora } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema } from "@/lib/seo";
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

export const metadata: Metadata = {
  title: {
    default: "UAE Open Healthcare Directory | Find Doctors, Clinics & Hospitals",
    template: "%s | UAE Open Healthcare Directory",
  },
  description:
    "The UAE Open Healthcare Directory — the most comprehensive free directory of licensed healthcare providers across the UAE. Find hospitals, clinics, dentists, and specialists in Dubai, Abu Dhabi, Sharjah, and all Emirates with ratings, reviews, and contact details. By Zavis.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://zavis.ae',
    languages: {
      'en-AE': process.env.NEXT_PUBLIC_BASE_URL || 'https://zavis.ae',
      'ar-AE': `${process.env.NEXT_PUBLIC_BASE_URL || 'https://zavis.ae'}/ar`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = headers().get("x-locale") || "en";
  const isArabic = locale === "ar";

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"} className={`${dmSans.variable} ${spaceMono.variable} ${lora.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        <JsonLd data={organizationSchema()} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
