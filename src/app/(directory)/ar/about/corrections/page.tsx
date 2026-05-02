import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "سياسة التصحيحات — ذكاء الصناعة الصحية في زافيس";
const DESCRIPTION =
  "كيف تبلّغ عن خطأ في مقالة ذكاء زافيس أو في إدراج بالدليل، اتفاقية مستوى الخدمة المتوقعة للتصحيح، عملية الاعتراض، والسجل العام للتصحيحات المنشورة.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/ar/about/corrections`,
    languages: {
      en: `${getBaseUrl()}/about/corrections`,
      ar: `${getBaseUrl()}/ar/about/corrections`,
      "x-default": `${getBaseUrl()}/about/corrections`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "ar_AE",
    siteName: "الدليل المفتوح للرعاية الصحية في الإمارات",
    url: `${getBaseUrl()}/ar/about/corrections`,
  },
};

export default function ArabicCorrectionsPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/ar/about/corrections#webpage`,
    url: `${base}/ar/about/corrections`,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "ar",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: "الدليل المفتوح للرعاية الصحية في الإمارات",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis",
      url: base,
    },
  };

  return (
    <div className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16" dir="rtl">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/ar` },
          { name: "حول", url: `${base}/ar/about` },
          { name: "سياسة التصحيحات", url: `${base}/ar/about/corrections` },
        ])}
      />

      <h1 className="font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        سياسة التصحيحات
      </h1>
      <p className="text-sm text-black/45 mb-10 max-w-3xl">
        نأخذ الدقة على محمل الجد. إذا وجدت خطأ في مقالة ذكاء زافيس أو في
        إدراج منشأة أو ملف طبيب أو أي صفحة تحريرية، نريد أن نعرف — وسنقوم
        بإصلاحه.
      </p>

      <div className="max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">كيفية الإبلاغ عن خطأ</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            راسلنا على{" "}
            <a href="mailto:corrections@zavis.ai" className="text-[#006828] hover:underline">
              corrections@zavis.ai
            </a>{" "}
            مع رابط الصفحة المعنية، والادعاء أو نقطة البيانات التي تعتقد
            أنها غير صحيحة، وأي دليل داعم (مصدر أساسي، إيداع تنظيمي،
            لقطة شاشة من سجل رسمي). نؤكد استلام كل طلب تصحيح خلال يومي
            عمل.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">التزامنا بمستوى الخدمة</h2>
          <ul className="text-sm text-black/55 leading-relaxed space-y-2 list-disc list-outside pr-5">
            <li>
              <strong className="text-[#1c1c1c]">الإقرار:</strong> خلال يومي
              عمل من الاستلام.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">خطأ وقائعي في إدراج بالدليل</strong>{" "}
              (عنوان خاطئ، هاتف خاطئ، فئة خاطئة، ترخيص منتهٍ): يُصحَّح
              خلال خمسة أيام عمل من التحقق.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">خطأ وقائعي في مقالة ذكاء:</strong>{" "}
              يُصحَّح خلال سبعة أيام عمل. تتلقى المقالة الأصلية ملاحظة
              تصحيح مدمجة تشرح ما تغيّر ومتى.
            </li>
            <li>
              <strong className="text-[#1c1c1c]">خطأ وقائعي مهم</strong>{" "}
              يغير جوهر القصة: يُضاف تصحيح منشور منفصل إلى السجل أدناه
              وتُراجَع المقالة من قِبل محرر ثانٍ.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">عملية الاعتراض</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            إذا اختلف مزود رعاية صحية أو فرد مع ردنا على طلب تصحيح، يمكن
            تصعيد الطلب إلى كبير المحررين على{" "}
            <a href="mailto:editor@zavis.ai" className="text-[#006828] hover:underline">
              editor@zavis.ai
            </a>
            . تُراجَع التصعيدات من قِبل محرر ثانٍ غير معني بالقرار الأصلي
            وننشر رداً مكتوباً خلال عشرة أيام عمل.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            التشهير والمضايقة والبيانات الشخصية
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            يُنشر كل محتوى زافيس بموجب القانون الإماراتي، بما في ذلك
            المرسوم الاتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية
            (PDPL). تُرسَل طلبات إزالة البيانات الشخصية أو طلبات الحق في
            المسح أو الادعاءات بأن قطعة من التغطية تشهيرية إلى{" "}
            <a href="mailto:legal@zavis.ai" className="text-[#006828] hover:underline">
              legal@zavis.ai
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">سجل التصحيحات المنشورة</h2>
          <p className="text-sm text-black/55 leading-relaxed mb-4">
            تُسرد التصحيحات المنشورة المهمة أدناه بترتيب زمني عكسي.
          </p>
          <div className="border border-black/[0.06] rounded-2xl p-5">
            <p className="text-sm text-black/40">
              سجل التصحيحات المنشورة فارغ اعتباراً من النشر الأول لهذه
              الصفحة. ستُضاف التصحيحات المستقبلية هنا مع رابط المقالة
              ووصف لما تغيّر وتاريخ التصحيح.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
