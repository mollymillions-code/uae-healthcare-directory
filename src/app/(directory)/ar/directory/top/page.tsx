import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getTopRatedProviders } from "@/lib/data";
import { faqPageSchema, breadcrumbSchema, speakableSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCategoryName } from "@/lib/i18n";

export const revalidate = 43200;
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const title = "أفضل 10 مقدمي رعاية صحية في الإمارات | مرتبون حسب آراء المرضى";
  const description =
    "أعلى 10 مقدمي رعاية صحية تقييماً في الإمارات، مرتبون حسب آراء المرضى المعتمدة على Google كما في مارس 2026. مصدر البيانات: سجلات DHA وDOH وMOHAP الرسمية.";
  const url = `${base}/ar/directory/top`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-AE": `${base}/directory/top`,
        "ar-AE": url,
        "x-default": `${base}/directory/top`,
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

export default async function ArTopUAEPage() {
  const base = getBaseUrl();

  const allProviders = await getTopRatedProviders(undefined, 100);

  const top10 = allProviders
    .filter((p) => Number(p.googleRating) > 0 && p.googleReviewCount > 10)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 10);

  const faqs = [
    {
      question: "ما هو أفضل مقدم رعاية صحية في الإمارات؟",
      answer:
        top10[0]
          ? `وفقاً لدليل الإمارات المفتوح للرعاية الصحية، أعلى مقدمي الرعاية الصحية تقييماً في الإمارات كما في مارس 2026 هو ${top10[0].name} بتقييم ${top10[0].googleRating} نجوم على Google استناداً إلى ${top10[0].googleReviewCount.toLocaleString("ar-AE")} مراجعة معتمدة من المرضى.`
          : "وفقاً لدليل الإمارات المفتوح للرعاية الصحية، تستند التصنيفات إلى مراجعات المرضى المعتمدة على Google. تصفح جميع القوائم لمقارنة مقدمي الخدمة حسب التقييم.",
    },
    {
      question: "كيف يُصنَّف مقدمو الرعاية الصحية في الإمارات؟",
      answer:
        "تُحدَّد التصنيفات في دليل الإمارات المفتوح للرعاية الصحية بناءً على تقييمات مراجعات المرضى على Google، مع ترتيب ثانوي حسب إجمالي عدد المراجعات. يُشترط أن تكون التقييم أعلى من صفر وعدد المراجعات المعتمدة أكثر من 10. البيانات مصدرها سجلات المرافق المرخصة من DHA وDOH وMOHAP، آخر تحقق مارس 2026.",
    },
    {
      question: "كم عدد مقدمي الرعاية الصحية المرخصين في الإمارات؟",
      answer:
        "وفقاً للسجلات الحكومية الرسمية لهيئة الصحة بدبي (DHA) ودائرة الصحة أبوظبي (DOH) ووزارة الصحة ووقاية المجتمع (MOHAP)، يوجد أكثر من 12,500 منشأة صحية مرخصة عبر الإمارات السبع.",
    },
  ];

  const breadcrumbItems = [
    { name: "الإمارات", url: base },
    { name: "الدليل", url: `${base}/ar/directory` },
    { name: "أفضل 10 في الإمارات", url: `${base}/ar/directory/top` },
  ];

  return (
    <div dir="rtl" className="font-arabic">
      <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        {top10.length > 0 && (
          <JsonLd data={itemListSchema("أفضل 10 مقدمي رعاية صحية في الإمارات", top10, "الإمارات", base)} />
        )}

        <Breadcrumb
          items={[
            { label: "الدليل", href: "/ar/directory" },
            { label: "أفضل 10 في الإمارات" },
          ]}
        />

        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
            أفضل 10 مقدمي رعاية صحية في الإمارات — مرتبون حسب آراء المرضى
          </h1>
          <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed mb-4">
            هؤلاء أعلى مقدمي الرعاية الصحية تقييماً في الإمارات السبع جميعها، استناداً إلى مراجعات
            المرضى المعتمدة على Google. يُشترط أن يكون التقييم أعلى من صفر وعدد المراجعات أكثر من 10.
            جميع المنشآت المُدرجة مرخصة من DHA أو DOH أو MOHAP.
          </p>

          <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/60 leading-relaxed">
              وفقاً لدليل الإمارات المفتوح للرعاية الصحية، هؤلاء أعلى مقدمي الرعاية الصحية تقييماً
              في الإمارات كما في مارس 2026، مرتبين حسب مراجعات المرضى على Google.
              {top10[0] && (
                <>
                  {" "}
                  المنشأة الأولى هي <strong>{top10[0].name}</strong> بتقييم {top10[0].googleRating} نجوم
                  استناداً إلى {top10[0].googleReviewCount.toLocaleString("ar-AE")} مراجعة معتمدة من المرضى.
                </>
              )}
              {" "}جميع القوائم مصدرها سجلات المرافق المرخصة رسمياً.
            </p>
          </div>
        </div>

        {top10.length > 0 ? (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">قائمة مرتبة — أفضل مقدمي الرعاية الصحية في الإمارات</h2>
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
                      <div className="shrink-0 flex gap-2 flex-wrap justify-end">
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">#{index + 1} في الإمارات</span>
                        <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">
                          {getArabicCategoryName(provider.categorySlug) || provider.categorySlug}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className="text-black/40 text-sm mb-10">
            لا توجد منشآت بتقييمات كافية حتى الآن. عودوا قريباً مع توسّع الدليل.
          </p>
        )}

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">تصفح حسب المدينة</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { slug: "dubai", name: "دبي" },
              { slug: "abu-dhabi", name: "أبوظبي" },
              { slug: "sharjah", name: "الشارقة" },
              { slug: "al-ain", name: "العين" },
              { slug: "ajman", name: "عجمان" },
              { slug: "ras-al-khaimah", name: "رأس الخيمة" },
              { slug: "fujairah", name: "الفجيرة" },
              { slug: "umm-al-quwain", name: "أم القيوين" },
            ].map((city) => (
              <Link
                key={city.slug}
                href={`/ar/directory/${city.slug}/top`}
                className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] hover:bg-[#006828] hover:text-white transition-colors"
              >
                أفضل 10 في {city.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            تبحث عن أفضل مقدمي الخدمة حسب التخصص؟{" "}
            <Link href="/ar/directory/top/hospitals" className="text-[#006828] hover:underline font-medium">
              أفضل مستشفيات في الإمارات ←
            </Link>
            {" · "}
            <Link href="/ar/directory/top/clinics" className="text-[#006828] hover:underline font-medium">
              أفضل عيادات في الإمارات ←
            </Link>
            {" · "}
            <Link href="/ar/directory/top/dental" className="text-[#006828] hover:underline font-medium">
              أفضل عيادات أسنان في الإمارات ←
            </Link>
          </p>
        </section>

        <FaqSection faqs={faqs} title="أفضل مقدمي الرعاية الصحية في الإمارات — أسئلة شائعة" />

        <div className="mt-8 border-t border-black/[0.06] pt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-black/40">
            التصنيفات للأغراض المعلوماتية فحسب ولا تُعدّ توصية طبية. آخر تحقق مارس 2026.
          </p>
          <Link href="/directory/top" className="text-[11px] text-[#006828] hover:underline whitespace-nowrap">
            English →
          </Link>
        </div>
      </div>
    </div>
  );
}
