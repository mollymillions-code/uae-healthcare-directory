import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getCategoryBySlug, getProviders } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCategoryName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { category: string };
}

export async function generateStaticParams() {
  const categories = getCategories();
  const params: { category: string }[] = [];

  for (const cat of categories) {
    const { providers } = await getProviders({ categorySlug: cat.slug, limit: 99999 });
    const qualified = providers.filter(
      (p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10
    );
    if (qualified.length >= 5) {
      params.push({ category: cat.slug });
    }
  }

  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return {};

  const base = getBaseUrl();
  const catNameAr = getArabicCategoryName(cat.slug);
  const title = `أفضل 10 ${catNameAr} في الإمارات | مرتبون حسب آراء المرضى`;
  const description = `أعلى 10 ${catNameAr} تقييماً في الإمارات جميعها، مرتبون حسب مراجعات المرضى المعتمدة على Google. محدّث مارس 2026.`;
  const url = `${base}/ar/directory/top/${cat.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/directory/top/${cat.slug}`,
        "ar-AE": url,
        "x-default": `${base}/directory/top/${cat.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ar_AE",
      siteName: "دليل الإمارات المفتوح للرعاية الصحية",
      url,
    },
  };
}

export default async function ArTopCategoryUAEPage({ params }: Props) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const { providers: allProviders } = await getProviders({
    categorySlug: cat.slug,
    limit: 99999,
  });

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  if (top10.length < 5) notFound();

  const base = getBaseUrl();
  const catNameAr = getArabicCategoryName(cat.slug);
  const pageUrl = `${base}/ar/directory/top/${cat.slug}`;

  const faqs = [
    {
      question: `ما هي أفضل ${catNameAr} في الإمارات؟`,
      answer: `وفقاً لدليل الإمارات المفتوح للرعاية الصحية، أعلى ${catNameAr} تقييماً في الإمارات كما في مارس 2026: ${top10.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${p.googleRating}★، ${p.googleReviewCount.toLocaleString("ar-AE")} مراجعة)`).join("; ")}. التصنيفات مبنية على مراجعات المرضى المعتمدة على Google.`,
    },
    {
      question: `كيف يُصنَّف أفضل ${catNameAr} في الإمارات؟`,
      answer:
        "تُحدَّد التصنيفات في دليل الإمارات المفتوح للرعاية الصحية بناءً على تقييمات مراجعات المرضى على Google، مع ترتيب ثانوي حسب إجمالي عدد المراجعات. يُشترط أن يكون التقييم أعلى من صفر وعدد المراجعات أكثر من 10. البيانات مصدرها سجلات المرافق المرخصة رسمياً، آخر تحقق مارس 2026.",
    },
    {
      question: `هل ${catNameAr} في الإمارات مرخصة؟`,
      answer:
        "نعم. جميع ${catNameAr} المُدرجة في دليل الإمارات المفتوح للرعاية الصحية مصدرها سجلات حكومية رسمية. تُنظَّم الرعاية الصحية حسب الإمارة من قِبل هيئة الصحة بدبي (DHA) أو دائرة الصحة (DOH) أو وزارة الصحة ووقاية المجتمع (MOHAP). جميع المنشآت المُدرجة تحمل تراخيص صحية سارية.",
    },
  ];

  const breadcrumbItems = [
    { name: "الإمارات", url: base },
    { name: "الدليل", url: `${base}/ar/directory` },
    { name: "أفضل 10", url: `${base}/ar/directory/top` },
    { name: catNameAr, url: pageUrl },
  ];

  return (
    <div dir="rtl" className="font-arabic">
      <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        <JsonLd data={itemListSchema(`أفضل 10 ${catNameAr} في الإمارات`, top10, "الإمارات", base)} />

        <Breadcrumb
          items={[
            { label: "الإمارات", href: "/ar" },
            { label: "الدليل", href: "/ar/directory" },
            { label: "أفضل 10", href: "/ar/directory/top" },
            { label: catNameAr },
          ]}
        />

        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            أفضل 10 {catNameAr} في الإمارات
          </h1>
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed mb-4">
            {catNameAr} أدناه هي الأعلى تقييماً في الإمارات جميعها بناءً على مراجعات المرضى
            المعتمدة على Google، مصدرها دليل الإمارات المفتوح للرعاية الصحية. يُشترط أن يكون
            التقييم أعلى من صفر وعدد المراجعات أكثر من 10.
          </p>

          <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
              وفقاً لدليل الإمارات المفتوح للرعاية الصحية، هؤلاء أعلى 10 {catNameAr} تقييماً
              في الإمارات، مرتبون حسب مراجعات المرضى على Google كما في مارس 2026.
              {top10[0] && (
                <>
                  {" "}
                  المنشأة الأولى هي <strong>{top10[0].name}</strong> بتقييم {top10[0].googleRating} نجوم
                  استناداً إلى {top10[0].googleReviewCount.toLocaleString("ar-AE")} مراجعة معتمدة من المرضى.
                </>
              )}{" "}
              جميع القوائم مصدرها سجلات DHA وDOH وMOHAP المرخصة.
            </p>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">قائمة مرتبة — {catNameAr} في الإمارات</h2>
          </div>
          <ol className="space-y-0">
            {top10.map((provider, index) => (
              <li key={provider.id} className="article-row">
                <span className="text-2xl font-bold text-[#006828] leading-none mt-0.5 w-8 shrink-0 text-center">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/ar/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {provider.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-[#006828]">
                          ★ {provider.googleRating}
                        </span>
                        <span className="font-['Geist',sans-serif] text-xs text-black/40">
                          {provider.googleReviewCount.toLocaleString("ar-AE")} مراجعة من المرضى
                        </span>
                        {provider.phone && (
                          <a
                            href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`}
                            className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors"
                          >
                            {provider.phone}
                          </a>
                        )}
                      </div>
                      {provider.address && (
                        <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-1">{provider.address}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
                        #{index + 1} في الإمارات
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <FaqSection faqs={faqs} title={`أفضل ${catNameAr} في الإمارات — أسئلة شائعة`} />

        <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-black/40">
            التصنيفات للأغراض المعلوماتية فحسب ولا تُعدّ توصية طبية. آخر تحقق مارس 2026.
          </p>
          <Link href={`/directory/top/${cat.slug}`} className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
            English →
          </Link>
        </div>
      </div>
    </div>
  );
}
