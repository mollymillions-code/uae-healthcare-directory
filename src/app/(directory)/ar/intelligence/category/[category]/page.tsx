import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/intelligence/ArticleCard";
import { CategoryNav } from "@/components/intelligence/CategoryNav";
import { TagCloud } from "@/components/intelligence/TagCloud";
import { EventsSidebar } from "@/components/intelligence/EventsSidebar";
import { getArticles, getUpcomingEvents, getAllTags, loadDbArticles } from "@/lib/intelligence/data";
import { getJournalCategory, JOURNAL_CATEGORIES } from "@/lib/intelligence/categories";
import type { JournalCategory } from "@/lib/intelligence/types";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

// ─── Arabic category names ───────────────────────────────────────────────────

const ARABIC_CATEGORY_NAMES: Record<string, string> = {
  regulatory: "التنظيم والسياسات",
  "new-openings": "منشآت جديدة",
  financial: "المالية والاستثمار",
  events: "الفعاليات والمؤتمرات",
  "social-pulse": "نبض التواصل الاجتماعي",
  "thought-leadership": "قيادة الفكر",
  "market-intelligence": "الذكاء السوقي",
  technology: "التكنولوجيا الصحية والابتكار",
  workforce: "القوى العاملة والمواهب",
};

const ARABIC_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  regulatory: "تحديثات من هيئة الصحة بدبي (DHA) ودائرة الصحة أبوظبي (DOH) ووزارة الصحة ووقاية المجتمع (MOHAP) وسائر الجهات الصحية الإماراتية بشأن الترخيص والامتثال والتغييرات التنظيمية.",
  "new-openings": "عيادات ومستشفيات ومنشآت رعاية صحية تفتح أبوابها في جميع أنحاء الإمارات والشرق الأوسط.",
  financial: "المؤشرات المالية لقطاع الرعاية الصحية وصفقات الاندماج والاستحواذ وجولات التمويل وتوقعات السوق في الإمارات ومنطقة الخليج.",
  events: "المؤتمرات والمعارض والقمم وفعاليات التواصل في قطاع الرعاية الصحية بالمنطقة.",
  "social-pulse": "أبرز ما يتداوله قادة الرعاية الصحية الإماراتيون على LinkedIn وX وInstagram.",
  "thought-leadership": "آراء الخبراء وتحليلاتهم ومقالات الرأي من المسؤولين التنفيذيين والأطباء والمبتكرين في القطاع الصحي.",
  "market-intelligence": "رؤى مبنية على البيانات حول أعداد المرضى واتجاهات التأمين واستخدام المنشآت والطلب على الرعاية الصحية.",
  technology: "الصحة الرقمية والتشخيص بالذكاء الاصطناعي ومنصات الطب عن بُعد وشركات التقنية الصحية الناشئة التي تُحوّل قطاع الرعاية الصحية في الإمارات.",
  workforce: "اتجاهات التوظيف وتحديثات الترخيص ومعايير الرواتب وحركة المواهب في قطاع الرعاية الصحية بالإمارات.",
};

interface PageProps {
  params: { category: string };
}

export async function generateStaticParams() {
  return JOURNAL_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cat = getJournalCategory(params.category);
  if (!cat) return {};

  const base = getBaseUrl();
  const arabicName = ARABIC_CATEGORY_NAMES[cat.slug] || cat.name;
  const arabicDesc = ARABIC_CATEGORY_DESCRIPTIONS[cat.slug] || cat.description;

  return {
    title: `${arabicName} | رؤى Zavis للقطاع الصحي`,
    description: arabicDesc,
    alternates: {
      canonical: `${base}/ar/intelligence/category/${cat.slug}`,
      languages: {
        "en-AE": `${base}/intelligence/category/${cat.slug}`,
        "ar-AE": `${base}/ar/intelligence/category/${cat.slug}`,
        "x-default": `${base}/intelligence/category/${cat.slug}`,
      },
    },
  };
}

export default async function ArabicCategoryPage({ params }: PageProps) {
  await loadDbArticles();
  const cat = getJournalCategory(params.category);
  if (!cat) notFound();

  const { articles, total } = getArticles({
    category: params.category as JournalCategory,
  });
  const events = getUpcomingEvents(4);
  const tags = getAllTags();

  const arabicName = ARABIC_CATEGORY_NAMES[cat.slug] || cat.name;
  const arabicDesc = ARABIC_CATEGORY_DESCRIPTIONS[cat.slug] || cat.description;

  return (
    <div dir="rtl" lang="ar">
      {/* Back link */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/ar/intelligence"
          className="inline-flex items-center gap-1.5 label hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3 rotate-180" />
          العودة إلى الرؤى والتحليلات
        </Link>
      </div>

      {/* Category header */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="font-['Geist',sans-serif] text-2xl font-bold text-[#1c1c1c]">
          {arabicName}
        </h1>
        <p className="font-['Geist',sans-serif] text-black/40 mt-2 max-w-2xl">
          {arabicDesc}
        </p>
        <span className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold mt-3 block">
          {total.toLocaleString("ar-AE")} مقالة
        </span>
      </div>

      {/* Category navigation */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <CategoryNav activeCategory={params.category} />
      </div>

      {/* Articles + sidebar */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article feed */}
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="font-['Geist',sans-serif] text-black/40 py-12">
                لا توجد مقالات في هذه الفئة حتى الآن. تفضل بالعودة قريباً.
              </p>
            ) : (
              <div className="space-y-0">
                {articles.map((article, i) => (
                  <div key={article.id}>
                    {i > 0 && <div className="border-b border-black/[0.06] my-5" />}
                    <ArticleCard article={article} variant="horizontal" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <EventsSidebar events={events} />
            </div>

            <div>
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <h3 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                المواضيع
              </h3>
              <TagCloud tags={tags} limit={20} />
            </div>
          </aside>
        </div>
      </section>

      {/* AEO block */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div
          className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6"
          data-answer-block="true"
        >
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
            تُغطي رؤى Zavis للقطاع الصحي موضوع {arabicName} لقطاع الرعاية الصحية في الإمارات العربية المتحدة.{" "}
            {arabicDesc}{" "}
            يُحدَّث يومياً لمتخصصي الرعاية الصحية. آخر تحديث مارس ٢٠٢٦.
          </p>
        </div>
      </section>
    </div>
  );
}
