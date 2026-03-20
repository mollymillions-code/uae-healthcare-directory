import { Metadata } from "next";
import Link from "next/link";
import { ar } from "@/lib/i18n";

export const metadata: Metadata = {
  title: ar.search,
  robots: { index: false, follow: true },
};

export default function ArabicSearchPage() {
  return (
    <div className="container-tc py-12 text-center">
      <h1 className="text-2xl font-bold text-dark mb-4">{ar.search}</h1>
      <p className="text-muted mb-6">
        استخدم البحث للعثور على مقدمي الرعاية الصحية في الإمارات
      </p>
      <Link href="/search" className="btn-accent">
        {ar.search} / Search
      </Link>
    </div>
  );
}
