import type { Metadata } from "next";
import { Source_Serif_4, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["300", "400", "600", "700", "900"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400"],
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
    <html
      lang="en"
      className={`${sourceSerif.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased min-h-screen flex flex-col bg-stone text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
