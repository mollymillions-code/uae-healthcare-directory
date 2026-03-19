import type { Metadata } from "next";
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zavis.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "UAE Open Healthcare Directory | Find Doctors, Clinics & Hospitals",
    template: "%s | UAE Open Healthcare Directory",
  },
  description:
    "Free directory of 12,500+ licensed healthcare providers across the UAE. Find hospitals, clinics, dentists in Dubai, Abu Dhabi, Sharjah with ratings and contact details.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/images/og-default.png`,
        width: 1200,
        height: 630,
        alt: "UAE Open Healthcare Directory — 12,500+ Licensed Providers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zaaborz",
    images: [`${baseUrl}/images/og-default.png`],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`${dmSans.variable} ${spaceMono.variable} ${lora.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        <JsonLd data={organizationSchema()} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
