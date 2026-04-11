import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "السياسة التحريرية | الدليل المفتوح للرعاية الصحية في الإمارات";
const DESCRIPTION =
  "الاستقلالية التحريرية، الإفصاح عن تضارب المصالح، عملية المراجعة، معايير الدقة، الإفصاح عن استخدام الذكاء الاصطناعي، وسياسة التصحيحات للدليل المفتوح للرعاية الصحية في الإمارات وذكاء الصناعة الصحية في زافيس.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/ar/editorial-policy`,
    languages: {
      en: `${getBaseUrl()}/editorial-policy`,
      ar: `${getBaseUrl()}/ar/editorial-policy`,
      "x-default": `${getBaseUrl()}/editorial-policy`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "ar_AE",
    siteName: "الدليل المفتوح للرعاية الصحية في الإمارات",
    url: `${getBaseUrl()}/ar/editorial-policy`,
  },
};

export default function ArabicEditorialPolicyPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/ar/editorial-policy#webpage`,
    url: `${base}/ar/editorial-policy`,
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16" dir="rtl">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: `${base}/ar` },
          { name: "السياسة التحريرية", url: `${base}/ar/editorial-policy` },
        ])}
      />

      <h1 className="font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        السياسة التحريرية
      </h1>
      <p className="text-sm text-black/45 mb-10 max-w-3xl">
        كيف يقرر زافيس ما يُنشر، ومن يراجعه، وكيف نتعامل مع العلاقات
        التجارية، وكيف نصحح الأخطاء. تنطبق هذه السياسة على كل صفحة على
        الموقع — قوائم الدليل، وملفات الأطباء، وطبقة ذكاء التحرير،
        والتقارير، والبيانات القابلة للقراءة آلياً التي نكشفها.
      </p>

      <div className="max-w-3xl space-y-10">
        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">الاستقلالية التحريرية</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            يُنتج محتوى زافيس التحريري بشكل مستقل عن أي عملية تجارية
            يديرها زافيس. لا تتأثر إدراجات الدليل أبداً بعلاقات الإعلان
            أو الرعاية أو تطوير الأعمال. تُحدَّد ترتيبات مزودي الخدمة
            على صفحات المراكز عبر إشارات متاحة للعموم — متوسط تقييم
            جوجل وحجم المراجعات — تُطبَّق بشكل موحد على كل منشأة.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">تضارب المصالح</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            عندما يكون لزافيس علاقة تجارية مع مزود رعاية صحية أو شركة
            تأمين أو جهة حكومية أو بائع يكون موضوع مقالة ذكاء زافيس،
            تُكشف هذه العلاقة في ملاحظة موسومة بوضوح في أعلى المقالة.
            تنطبق نفس قاعدة الإفصاح على الاستثمارات التي يحتفظ بها
            زافيس أو رؤساؤه. يُلزَم المراجعون الطبيون الخارجيون (انظر{" "}
            <Link href="/intelligence/author" className="text-[#006828] hover:underline">
              قائمة المراجعين
            </Link>
            ) بالإفصاح عن أي علاقات استشارية أو في مجلس الإدارة.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">المصادر والتحقق</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            ترتبط قوائم المنشآت بسجلات إماراتية رسمية — هيئة الصحة بدبي
            (شريان) لدبي، ودائرة الصحة لأبوظبي، ووزارة الصحة ووقاية
            المجتمع للإمارات الشمالية. تستند ملفات الأطباء إلى سجل شريان
            للممارسين الصحيين. تعطي المقالات التحريرية الأولوية للمصادر
            الأساسية — تعاميم هيئة الصحة بدبي، ولوحات معلومات دائرة
            الصحة، وقرارات مجلس الوزراء الاتحادي، والإفصاحات المالية،
            والمنشورات المُحكَّمة، والمقابلات المسجلة بالاسم. تستشهد
            المقالات السريرية بمصادرها في قسم مصادر مرقم في أسفل
            الصفحة. تُنشر القائمة الكاملة لكل مصدر بيانات أساسي يغذي
            الموقع على{" "}
            <Link href="/ar/data-sources" className="text-[#006828] hover:underline">
              /ar/data-sources
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">عملية المراجعة</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            تمر كل مقالة ذكاء بمراجعة من قِبل محررَين قبل النشر.
            تُراجَع المقالات المصنفة على أنها سريرية أو ذات صلة بالحياة
            (YMYL) بشكل إضافي من قِبل مراجِع سريري أو سياسات خارجي
            مذكور بالاسم من قائمة المراجعين المنشورة لدينا. يظهر اسم
            المراجِع ومؤهلاته وتخصصه على التوقيع باسم &quot;روجعت
            طبياً من قِبل&quot; مع رابط إلى ملف المراجِع الكامل على
            زافيس. تبقى مواقع المراجعين البديلة المؤقتة دون تعيين خبير
            حقيقي مخفية — لا ننشر أبداً سطر مراجِع &quot;د. (يُحدد
            لاحقاً)&quot; أو مجهول.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            تواريخ صادقة وتحديثات
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            لا يتقدم تاريخ <code>dateModified</code> للمقالة إلا عندما
            يعيد إنسان قراءتها ويؤكد أنها لا تزال حالية أو يجري تعديلات
            جوهرية. لا نعيد ختم المقالات القديمة بكميات كبيرة للتلاعب
            بإشارات الحداثة في محركات البحث. يتتبع تاريخ
            <code> lastReviewed</code> على المقالة السريرية تاريخ توقيع
            المراجِع الطبي المسمى آخر مرة، وتحمله طبقة البيانات المهيكلة
            كحقل منفصل عن <code>dateModified</code>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            الإفصاح عن المحتوى المعتمد على الذكاء الاصطناعي
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            تستخدم بعض ملخصات الذكاء التلخيص بمساعدة الذكاء الاصطناعي
            للمحتوى الذي مصدره خلاصات RSS الرسمية والبيانات الصحفية
            الحكومية والمنشورات الصناعية الموثقة. تُراجَع كل خلاصة
            مساعَدة بالذكاء الاصطناعي من حيث الدقة من قِبل محرر زافيس
            قبل النشر وتُنسب بوضوح إلى مصدرها الأصلي. لا يتم توليد
            بيانات إدراج الدليل نفسها — أسماء المنشآت، العناوين، أرقام
            التراخيص، الفئات — بالذكاء الاصطناعي أبداً.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">
            استخدام بيانات المرضى والامتثال لقانون حماية البيانات الشخصية
          </h2>
          <p className="text-sm text-black/55 leading-relaxed">
            يعمل زافيس بموجب المرسوم الاتحادي الإماراتي رقم 45 لسنة
            2021 بشأن حماية البيانات الشخصية. لا نجمع أو نخزّن أو ننشر
            معلومات مرضى يمكن التعرف عليها. سيتبع نظام استقبال التقييمات
            الموثقة المستقبلي (الموصوف على{" "}
            <Link href="/ar/verified-reviews" className="text-[#006828] hover:underline">
              /ar/verified-reviews
            </Link>
            ) القانون مع موافقة صريحة ومُفصّلة قبل إرسال أي رسالة، ونافذة
            احتفاظ موثقة، وحق في المسح عند الطلب.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#1c1c1c] mb-3">التصحيحات</h2>
          <p className="text-sm text-black/55 leading-relaxed">
            راسلنا للتصحيحات على{" "}
            <a href="mailto:corrections@zavis.ai" className="text-[#006828] hover:underline">
              corrections@zavis.ai
            </a>
            . نؤكد كل طلب خلال يومي عمل، ونتحقق مقابل المصادر الأساسية،
            وننشر التصحيحات خلال خمسة إلى سبعة أيام عمل عندما يكون
            التغيير مدعوماً. تُسجَّل التصحيحات المهمة في سجل التصحيحات
            المنشور على{" "}
            <Link href="/ar/about/corrections" className="text-[#006828] hover:underline">
              /ar/about/corrections
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
