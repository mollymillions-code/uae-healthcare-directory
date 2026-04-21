import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "بيان إمكانية الوصول",
  description:
    "بيان إمكانية الوصول في زافيس — التزامنا بمعايير WCAG 2.1 AA، القيود المعروفة، وكيفية الإبلاغ عن مشكلة في الوصول.",
  alternates: {
    canonical: `${baseUrl}/ar/accessibility`,
    languages: {
      en: `${baseUrl}/accessibility`,
      "ar-AE": `${baseUrl}/ar/accessibility`,
      "x-default": `${baseUrl}/accessibility`,
    },
  },
  openGraph: {
    title: "بيان إمكانية الوصول — زافيس",
    description:
      "كيف يلتزم دليل زافيس للرعاية الصحية بمعايير WCAG 2.1 AA، ما هو داخل النطاق، القيود المعروفة، وكيفية الإبلاغ عن عوائق الوصول.",
    type: "website",
    locale: "ar_AE",
    siteName: "دليل الإمارات للرعاية الصحية",
    url: `${baseUrl}/ar/accessibility`,
  },
};

export default function ArabicAccessibilityPage() {
  const canonical = `${baseUrl}/ar/accessibility`;
  const lastUpdated = "2026-04-11";

  const webPageNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: "بيان إمكانية الوصول",
    description:
      "بيان زافيس العلني بشأن إمكانية الوصول المتوافق مع WCAG 2.1 AA والقانون الاتحادي لدولة الإمارات العربية المتحدة رقم (29) لسنة 2006 بشأن حقوق أصحاب الهمم.",
    inLanguage: "ar-AE",
    isPartOf: {
      "@type": "WebSite",
      name: "دليل الإمارات للرعاية الصحية",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: "زافيس",
      url: baseUrl,
    },
    datePublished: "2026-04-11",
    dateModified: lastUpdated,
  };

  const breadcrumbNode = breadcrumbSchema([
    { name: "الرئيسية", url: `${baseUrl}/ar` },
    { name: "إمكانية الوصول", url: canonical },
  ]);

  return (
    <div dir="rtl" className="font-arabic">
      <JsonLd data={webPageNode} />
      <JsonLd data={breadcrumbNode} />

      <div dir="rtl" lang="ar" className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
        <Breadcrumb
          items={[
            { label: "الرئيسية", href: "/ar" },
            { label: "إمكانية الوصول", href: "/ar/accessibility" },
          ]}
        />

        <header className="mb-10 border-b border-black/[0.08] pb-6">
          <p className="font-['Geist',sans-serif] text-xs uppercase tracking-wider text-accent mb-3">
            معايير الثقة والجودة في زافيس
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[34px] sm:text-[42px] leading-[1.1] tracking-[-0.02em] text-dark mb-4">
            بيان إمكانية الوصول
          </h1>
          <p className="font-['Geist',sans-serif] text-base text-dark/70 leading-relaxed">
            تلتزم زافيس بجعل دليل الإمارات المفتوح للرعاية الصحية وأرشيف
            زافيس للمعلومات الصحية قابلاً للاستخدام من قِبل الجميع، بمن فيهم
            الأشخاص الذين يستخدمون قارئات الشاشة، التنقل عبر لوحة المفاتيح،
            أدوات التكبير، التحكم الصوتي، أو أي تقنية مساعدة أخرى. توضح هذه
            الصفحة ما نفعله، وما نحتاج إلى إصلاحه، وكيف يمكنك إخبارنا عندما
            يواجهك عائق.
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-dark/50 mt-4">
            آخر تحديث: {lastUpdated}
          </p>
        </header>

        <article className="prose-journal max-w-none">
          <h2>التزامنا</h2>
          <p>
            تهدف زافيس إلى الالتزام بـ
            <a
              href="https://www.w3.org/TR/WCAG21/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              {" "}إرشادات الوصول إلى محتوى الويب (WCAG) 2.1 عند المستوى AA{" "}
            </a>
            عبر كل المسارات التي نديرها. نستهدف المستوى AA وليس AAA — لأن
            المستوى AAA يفرض تكاليف (مثل توفير فيديو بلغة الإشارة لكل وسائط)
            لا تتوافق مع تشغيل دليل مجاني يشمل أكثر من 12,500 مقدم خدمة، كما
            أن اتحاد الويب العالمي (W3C) نفسه لا يوصي بالمستوى AAA كهدف عام
            للمواقع بأكملها. المستوى AA هو ما يشير إليه معظم المنظمين حول
            العالم، بما في ذلك الإرشادات الصادرة عن هيئة تنظيم الاتصالات
            والحكومة الرقمية (TDRA) في دولة الإمارات.
          </p>

          <h2>النطاق</h2>
          <p>
            يغطي هذا البيان جميع الصفحات ضمن <code>zavis.ai</code> التي
            تتحكم فيها زافيس مباشرةً، بما في ذلك دليل الرعاية الصحية
            (<code>/directory/*</code> و<code>/find-a-doctor/*</code> و
            <code>/insurance/*</code>)، وأرشيف زافيس للمعلومات الصحية
            (<code>/intelligence/*</code>)، وتجربة البحث (<code>/search</code>)،
            والنسخة العربية (<code>/ar/*</code>)، وأدلة دول مجلس التعاون
            الخليجي (<code>/sa</code>، <code>/qa</code>، <code>/bh</code>،{" "}
            <code>/kw</code>). كما يغطي الصفحات التسويقية في المجموعة الجذر
            (<code>/</code>، <code>/about</code>، <code>/pricing</code>،{" "}
            <code>/book-a-demo</code>).
          </p>
          <p>
            تقع عناصر الطرف الثالث المضمنة — خرائط جوجل، ومدير العلامات من
            جوجل، وMicrosoft Clarity، وعلامة LinkedIn Insight، وMeta Pixel،
            وأي عناصر مضمنة من وسائل التواصل الاجتماعي داخل مقالات زافيس — خارج
            النطاق. راجع قسم &laquo;محتوى الطرف الثالث&raquo; أدناه.
          </p>

          <h2>القيود المعروفة</h2>
          <p>
            ننشر هنا الثغرات المعروفة لدينا بدلاً من أن نأمل بصمت ألا تلاحظها،
            لأن الصراحة بشأن الوضع الحالي أكثر فائدة من ادعاء غامض بالامتثال
            الكامل. المشكلات المعروفة حالياً:
          </p>
          <ul>
            <li>
              <strong>
                عناصر <code>&lt;img&gt;</code> قديمة على الصفحات التسويقية.
              </strong>{" "}
              لا تزال قلة من الصور الزخرفية على الصفحات التسويقية تستخدم
              <code> &lt;img&gt; </code>
              بدلاً من <code>next/image</code>. النصوص البديلة موجودة، والهجرة
              إلى <code>next/image</code> قيد التنفيذ.
            </li>
            <li>
              <strong>إطار خرائط جوجل</strong> على صفحات مقدمي الخدمة يأتي من
              طرف ثالث. يأتي الإطار بمعالجات لوحة المفاتيح ودلالات قارئ الشاشة
              الخاصة به، والتي لا تتحكم بها زافيس. عنوان نصي وهاتف ورابط اتجاهات
              يوجد دائماً بجوار الخريطة كبديل مكافئ.
            </li>
            <li>
              <strong>الأقسام المتحركة على الصفحات التسويقية</strong> تستخدم
              مكتبة GSAP. تحترم هذه الحركات إعداد{" "}
              <code>prefers-reduced-motion</code> ولا ينقل أي منها معلومات
              ذات قيمة.
            </li>
            <li>
              <strong>بعض المسارات القديمة للدليل ذات الترقيم من جانب العميل.</strong>{" "}
              تمت ترقية المسارات الرئيسية إلى الترقيم من جانب الخادم في أبريل
              2026، لكن عدداً قليلاً من مسارات &laquo;الأعلى تقييماً&raquo;
              القديمة لا يزال يحمّل قائمته من جانب العميل.
            </li>
            <li>
              <strong>تقارير PDF البحثية</strong> المنشورة ضمن{" "}
              <code>/intelligence/reports</code> ليست دائماً وسومة. يصاحب كل
              تقرير ملخص HTML كبديل متاح.
            </li>
          </ul>

          <h2>كيفية الإبلاغ عن مشكلة</h2>
          <p>
            إذا واجهت عائقاً — أي شيء من نص بديل مفقود، إلى مشكلة في تباين
            الألوان، إلى قارئ شاشة يقرأ شيئاً غير مفهوم — يُرجى مراسلتنا على{" "}
            <a
              href="mailto:accessibility@zavis.ai"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              accessibility@zavis.ai
            </a>
            . يُرجى تضمين الرابط، والمتصفح والتقنية المساعدة التي كنت تستخدمها،
            ووصف قصير لما حدث. نهدف إلى الرد على كل بلاغ خلال 3 أيام عمل
            واقتراح خطة إصلاح خلال 10 أيام عمل. تُصنَّف الأعطال الحرجة خلال يوم
            عمل واحد.
          </p>

          <h2>حالة الامتثال</h2>
          <p>
            تلتزم زافيس <em>جزئياً</em> بمعيار WCAG 2.1 المستوى AA. يعني
            &laquo;الامتثال الجزئي&raquo; أن غالبية الموقع يتوافق مع AA، لكن
            بعض أجزاء المحتوى — خصوصاً عناصر الطرف الثالث والعناصر القديمة
            المذكورة أعلاه — لا تلتزم بالكامل بعد. لا ندّعي الامتثال الكامل
            للمستوى AAA.
          </p>

          <h2>المرجع في القانون الاتحادي لدولة الإمارات</h2>
          <p>
            تعترف دولة الإمارات العربية المتحدة بإمكانية الوصول الرقمي كحق
            مدني. تلتزم زافيس بـ
            <strong>
              {" "}القانون الاتحادي رقم (29) لسنة 2006 بشأن حقوق ذوي الاحتياجات الخاصة{" "}
            </strong>
            (بصيغته المعدلة بموجب القانون الاتحادي رقم (14) لسنة 2009 ومرسوم
            2020 الاتحادي الذي أعاد تسمية الفئة المحمية &laquo;أصحاب
            الهمم&raquo;)، والذي يكفل الوصول العادل إلى المعلومات والخدمات
            العامة. كما نشير إلى إرشادات إمكانية الوصول الرقمي الصادرة عن
            هيئة تنظيم الاتصالات والحكومة الرقمية (TDRA) التي تطالب فعلياً
            بالامتثال لـ WCAG 2.1 AA ونشر بيان إمكانية وصول. هذه الصفحة هي ذلك
            البيان.
          </p>

          <h2>إخلاء المسؤولية بشأن محتوى الطرف الثالث</h2>
          <p>
            تضمّن زافيس محتوى طرف ثالث في موضعين: خرائط جوجل على صفحات مقدمي
            الخدمة وأحياناً عناصر مضمنة من وسائل التواصل الاجتماعي داخل
            المقالات. لا تتحكم زافيس في إمكانية الوصول إلى تلك الأطراف. نوفر
            دائماً بديلاً نصياً — العنوان الكامل ورقم الهاتف بجوار الخريطة،
            وملخصاً بجوار العنصر المضمن — حتى يمكن الوصول إلى كل معلومة أساسية
            على صفحة زافيس دون الحاجة إلى التفاعل مع أداة الطرف الثالث.
          </p>

          <h2>منهجية الاختبار</h2>
          <p>
            تُدقَّق صفحات زافيس مقابل WCAG 2.1 AA باستخدام مزيج من الأدوات
            التلقائية (
            <a
              href="https://github.com/dequelabs/axe-core"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              axe-core
            </a>{" "}
            وفحوصات Lighthouse) والفحوصات اليدوية: التنقل عبر لوحة المفاتيح
            فقط، واختبارات قارئ الشاشة باستخدام VoiceOver على macOS و NVDA
            على Windows، والتحقق من تباين الألوان مقابل رموز علامتنا
            التجارية.
          </p>

          <h2>التقنيات المطلوب تفعيلها</h2>
          <p>
            بُنيت زافيس كتطبيق ويب حديث وتعتمد على: HTML5، CSS3، WAI-ARIA،
            SVG، وJavaScript. يجب تفعيل JavaScript من أجل البحث والترقيم
            والمرشحات التفاعلية على صفحات الدليل. تُستخدم ملفات تعريف الارتباط
            للموافقة والتحليلات.
          </p>

          <h2>ملاحظات أخرى</h2>
          <p>
            إذا لم تكن مشكلتك خاصة بالوصول بل بطريقة عرض زافيس لمعلومات مقدم
            الخدمة — مثل خطأ في معلومات عيادة أو ترجمة ناقصة — يمكنك أيضاً
            التواصل معنا على{" "}
            <a
              href="mailto:hello@zavis.ai"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              hello@zavis.ai
            </a>
            . لأسئلة الثقة والتحرير العامة، راجع{" "}
            <Link
              href="/editorial-policy"
              className="text-accent underline underline-offset-2 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              سياسة التحرير
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
