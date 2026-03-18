import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { ar } from "@/lib/i18n";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: ar.siteName,
    template: `%s | ${ar.siteName}`,
  },
  description: ar.siteDescription,
  openGraph: { type: "website", locale: "ar_AE", siteName: ar.siteName },
};

export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${notoArabic.variable}`} style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
      {children}
    </div>
  );
}
