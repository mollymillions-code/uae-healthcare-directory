import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "المنهجية — الدليل المفتوح للرعاية الصحية في الإمارات";
const DESCRIPTION =
  "كيف نبني ونحافظ على دليل الرعاية الصحية المفتوح في الإمارات: مصادر البيانات، جدول التحديث، مطابقة سجل المهنيين، ومحرك سياسة الفلاتر الذي يقرر أي صفحات تُفهرس.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/ar/methodology`,
    languages: {
      en: `${getBaseUrl()}/methodology`,
      ar: `${getBaseUrl()}/ar/methodology`,
      "x-default": `${getBaseUrl()}/methodology`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "ar_AE",
    siteName: "الدليل المفتوح للرعاية الصحية في الإمارات",
    url: `${getBaseUrl()}/ar/methodology`,
  },
};

export default function ArabicMethodologyPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/ar/methodology#webpage`,
    url: `${base}/ar/methodology`,
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
          { name: "المنهجية", url: `${base}/ar/methodology` },
        ])}
      />

      <h1 className="font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        المنهجية
      </h1>
      <p className="text-sm text-black/45 mb-10 max-w-3xl">
        كيف نبني ونحافظ على الدليل المفتوح للرعاية الصحية في الإمارات،
        وفهرس المهنيين، وصفحات الهبوط المنسقة للتأمين / التخصصات / المناطق.
      </p>

      <div className="max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            1. سجلات المنشآت ومصدر الحقيقة
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            كل منشأة صحية مدرجة في زافيس مرتبطة بسجل رسمي صادر عن إمارة. في
            دبي نستخدم سجل المنشآت المرخصة لدى هيئة الصحة بدبي (شريان)، وفي
            أبوظبي نستخدم دائرة الصحة (تم وقاعدة بيانات المرخصين)، وفي
            الإمارات الشمالية نستخدم سجل المرخصين لدى وزارة الصحة ووقاية
            المجتمع. لا تدخل المنشأة الدليل إلا إذا ظهرت في أحد هذه المصادر.
            ننشر رقم الترخيص على صفحة المنشأة حيثما تسمح الجهة المُصدِرة بذلك.
            لا نشتري قوائم منشآت من جهات خارجية، ولا نولّد المنشآت من خرائط
            جوجل — تُستخدم خرائط جوجل فقط للإثراء الاختياري (عدد التقييمات،
            صور المعرض، ساعات العمل، رابط الخرائط).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            2. فهرس المهنيين (شريان هيئة الصحة بدبي)
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            تستند صفحات ملفات الأطباء على المسار <code>/find-a-doctor/</code>{" "}
            إلى السجل العام لشريان لهيئة الصحة بدبي للممارسين الصحيين
            المرخصين — الأطباء وأطباء الأسنان والطواقم الصحية المساندة
            والممرضين. نُدخل السجلات العامة، ونطابق كل ممارس مع منشأة أساسية
            عبر مطابقة لينة (لا ندّعي أبداً ارتباطاً لا يمكننا التحقق منه)،
            ونعرض الملف الناتج. يحمل كل ملف رقم المعرّف الفريد للهيئة ونوع
            الترخيص (REG / FTL) ليتمكن الزوار من التحقق من السجل الأصلي. لا
            ننشر صورة طبيب إلا إذا وافق صراحةً على ذلك؛ وإلا نستخدم صورة رمزية
            بأحرف أولى تُولَّد على الخادم. لا نختلق قبول التأمينات أو اللغات
            المُتحدَّث بها أو حالة &quot;قبول مرضى جدد&quot; — تظهر هذه الحقول على
            الملف فقط عندما تكون موجودة في مجموعة البيانات المصدرية.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            3. جدول التحديث وسلسلة الإسناد
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            يتم تحديث جدول المنشآت الكامل مقابل السجلات المصدرية وفق جدول
            دوري. يحمل كل سجل منشأة طابعاً زمنياً لـ{" "}
            <code>google_fetched_at</code> (آخر إثراء من خرائط جوجل) وتاريخ
            تحقق يظهر على الملف العام. يتم وضع علامة على المنشآت التي تختفي
            من السجل المصدري لمراجعتها وإزالتها من خريطة الموقع القابلة
            للفهرسة في البناء التالي. نتتبع كل تحديث في سجل التغييرات
            الداخلي.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            4. محرك سياسة الفلاتر
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            دلائل الرعاية الصحية التي تسمح لكل تركيبة فلاتر بأن تصبح عنوان
            URL قابل للفهرسة تنهار تحت ميزانية الزحف الخاصة بها. يعرّف محرك
            سياسة الفلاتر في زافيس
            (<code>src/lib/seo/facet-rules.ts</code>) بدقة أي تركيبات من
            المدينة والتخصص وشركة التأمين والمنطقة واللغة يمكن زحفها
            وفهرستها. القائمة المسموح بها حالياً: مدينة + تخصص، مدينة +
            تأمين، مدينة + تأمين + تخصص (مع حد أدنى من المخزون)، مدينة +
            منطقة، مدينة + منطقة + تخصص، مدينة + لغة. أي شيء خارج القائمة
            إما لا يُولَّد أبداً، أو يُولَّد كصفحة تجربة مستخدم فقط مع{" "}
            <code>noindex,follow</code>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            5. قبول خطط التأمين
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            لا نحتفظ حالياً برسم بياني لقبول التأمين في الوقت الحقيقي بين
            المنشآت وشركات التأمين — ذلك يتطلب إما اتفاقية مع كل شركة تأمين
            أو حلقة تحديث قابلة للتحقق من جانب المنشأة، ولا يوجد أي منهما
            اليوم. حتى تصل تلك البنية التحتية، تستند صفحات التأمين على زافيس
            إلى (أ) عمود <code>insurance</code> JSONB القديم على جدول
            المنشآت و (ب) قواعد التحديد الجغرافي في محرك سياسة الفلاتر.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            6. التقييمات والمراجعات
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            يعرض زافيس عدد تقييمات خرائط جوجل ومتوسط التقييم كإشارة مرجعية
            على صفحات المنشآت، لأنها إحدى الإشارات المستقلة القليلة المتاحة
            اليوم لجودة المنشآت. لا نعيد نشر نص تقييمات جوجل الكامل. تُنبَعث
            التقييمات الإجمالية في JSON-LD فقط عندما يكون لدى المنشأة ثلاث
            مراجعات على الأقل. نظام التقييمات الموثقة الخاص بنا (الاستقبال
            عبر QR / SMS-OTP) ليس مفعّلاً بعد؛ تصف صفحة السياسة على{" "}
            <Link href="/ar/verified-reviews" className="text-[#006828] hover:underline">
              /ar/verified-reviews
            </Link>{" "}
            التصميم ومعايير الإطلاق.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">7. التغطية ثنائية اللغة</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            كل صفحة دليل وملف منشأة وصفحة منطقة وصفحة تأمين ومقالة ذكاء
            لها مرآة عربية موازية على <code>/ar/...</code>. تربط بدائل
            hreflang اللغتين معاً حتى يمكن لمحركات البحث تقديم اللغة
            الصحيحة للمستخدم الصحيح.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            8. المراجعة التحريرية والتصحيحات
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            تُراجَع مقالات الذكاء المصنفة على أنها سريرية أو ذات صلة
            بالحياة قبل النشر من قِبل خبير خارجي مذكور بالاسم، ويظهر اسمه
            ومؤهلاته على التوقيع مع رابط إلى ملفه على{" "}
            <Link href="/ar/intelligence/author" className="text-[#006828] hover:underline">
              زافيس
            </Link>
            . لا يتقدم تاريخ <code>dateModified</code> للمقالة إلا عندما
            يعيد إنسان قراءتها — لا نعيد كتابة الطوابع الزمنية لأغراض
            تحسين محركات البحث. لطلب تصحيح، انظر سياسة التصحيحات لدينا على{" "}
            <Link href="/ar/about/corrections" className="text-[#006828] hover:underline">
              /ar/about/corrections
            </Link>
            . اقرأ المعايير التحريرية الكاملة على{" "}
            <Link href="/ar/editorial-policy" className="text-[#006828] hover:underline">
              /ar/editorial-policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
