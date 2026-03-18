import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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

export const metadata: Metadata = {
  title: {
    default: "UAE Healthcare Directory | Find Doctors, Clinics & Hospitals",
    template: "%s | UAE Healthcare Directory",
  },
  description:
    "The most comprehensive free healthcare directory for the UAE. Find hospitals, clinics, dentists, and specialists in Dubai, Abu Dhabi, Sharjah, and all Emirates with ratings, reviews, and contact details.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "UAE Healthcare Directory",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-white text-dark">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
