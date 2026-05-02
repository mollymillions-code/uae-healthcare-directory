import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  faqPageSchema,
  truncateDescription,
  truncateTitle,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { VerifiedBadge, VERIFIED_TIERS } from "@/components/trust/VerifiedBadge";

const baseUrl = getBaseUrl();

/* ─── FAQs (8 Arabic) ──────────────────────────────────────────────── */
const FAQS_AR: Array<{ question: string; answer: string }> = [
  {
    question: "لماذا لا يعرض زافيس تقييمات المرضى حتى الآن؟",
    answer:
      "لا يعرض زافيس تقييمات المرضى في هذه المرحلة لأننا لم ننشئ بعد حلقة حجز موعد قادرة على إثبات أن كاتب التقييم زار المنشأة فعلاً. التقييمات غير الموثقة تعاني من مشاكل معروفة — تقييمات وهمية، هجمات من المنافسين، مزارع تقييمات — والإمارات لديها قوانين صارمة للتشهير وحماية البيانات تجعل نشر شكاوى غير موثقة أمراً محفوفاً بالمخاطر. نفضّل ألا نعرض أي تقييمات على أن نعرض تقييمات غير جديرة بالثقة.",
  },
  {
    question: "لماذا لا يكتفي زافيس بعرض تقييمات جوجل بجانب كل منشأة؟",
    answer:
      "نعرض عدد تقييمات جوجل كإشارة مرجعية، لكننا لا نعيد نشر نص التقييمات الكامل. تُقيّد شروط خدمة جوجل إعادة النشر على نطاق واسع، كما أن هذه التقييمات ليست متوافقة مع قانون حماية البيانات الشخصية (PDPL) على منصتنا، وإعادة نشرها ستخلق طبقة تعرّض ثانية لزافيس من ناحية التشهير. يبقى رقم التقييم، ويبقى النص على جوجل.",
  },
  {
    question: "ما هو التحقق عبر رمز SMS-OTP ولماذا نستخدمه؟",
    answer:
      "التحقق عبر SMS-OTP (رمز لمرة واحدة) هو الوسيلة التي سنثبت بها أن كاتب التقييم زار المنشأة فعلاً. تسجّل المنشأة رقم هاتف المريض عند تسجيل الدخول، ويرسل زافيس رمزاً إلى ذلك الرقم، ويستخدم المريض الرمز لفتح نموذج التقييم — ولكن فقط ضمن نافذة زمنية مدتها 30 يوماً بعد الزيارة. هو النمط نفسه المستخدم في البنوك، ويستوفي متطلبات الموافقة بموجب المرسوم الاتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية.",
  },
  {
    question: "كيف يمكنني الاعتراض على تقييم سلبي بعد إطلاق النظام؟",
    answer:
      "ستحصل المنشآت على نافذة استجابة خاصة مدتها 7 أيام قبل نشر أي تقييم، بالإضافة إلى نافذة اعتراض مدتها 12 شهراً بعد النشر. تُرسَل الاعتراضات إلى trust@zavis.ai ويراجعها مشرف بشري وليس نظاماً آلياً. تُحذف التقييمات التي تخالف سياسة المحتوى المنشورة — التشهير، البيانات الشخصية، النتائج الطبية التي لا يمكننا التحقق منها، خطاب الكراهية. أما التقييمات التي لا توافق عليها المنشأة فقط فلا تُحذف.",
  },
  {
    question: "هل سيعرض زافيس تقييمات جوجل؟",
    answer:
      "يعرض زافيس إجمالي عدد تقييمات جوجل كرقم مرجعي على صفحات المنشآت، لأنها إحدى الإشارات المستقلة المتوفرة في الإمارات حالياً. لا نعيد نشر نص التقييمات. وبمجرد إطلاق نظام تقييمات زافيس الموثقة، ستظهر تقييمات زافيس إلى جانب تقييمات جوجل ليتمكن المرضى من رؤية كليهما.",
  },
  {
    question: "كيف سيلتزم زافيس بقانون حماية البيانات الشخصية (PDPL)؟",
    answer:
      "ستتبع كل تدفقات التقييم المرسوم الاتحادي رقم 45 لسنة 2021: موافقة صريحة ومُفصّلة قبل إرسال أي رسالة نصية، وإشعار خصوصية واضح على نموذج التقييم، وتقليل البيانات (لن نخزّن رقم الهاتف كاملاً كنص صريح، بل كتجزئة مشفّرة)، ونافذة احتفاظ موثّقة مدتها 12 شهراً، وحق في المسح عند الطلب. سيُنشر جهة اتصال مسؤول حماية البيانات على هذه الصفحة قبل تشغيل أي نموذج استقبال.",
  },
  {
    question: "هل ستتمكن المنشآت من الرد على التقييمات؟",
    answer:
      "نعم. سيحتوي كل تقييم منشور على حقل رد واحد واضح للمنشأة. يُسمح بردّ واحد فقط لكل تقييم، ولا يمكن أن يتضمن بيانات شخصية للمريض، ويخضع للتعديل حسب نفس سياسة المحتوى المطبّقة على التقييمات. المنشآت التي ترد خلال نافذة السبعة أيام الخاصة سيظهر ردّها في نفس لحظة نشر التقييم.",
  },
  {
    question: "متى سيتم إطلاق نظام التقييمات الموثقة؟",
    answer:
      "الإطلاق المستهدف هو الربع الثالث من 2026. يعتمد هذا الجدول على (1) اكتمال تعيين فريق الإشراف، (2) اجتياز تكامل مزود SMS-OTP تدقيق PDPL، (3) المراجعة القانونية لفئات التحقق الخمس الموصوفة في هذه الصفحة، (4) موافقة مجموعة تجريبية من 20 إلى 40 منشأة على المشاركة خلال الأيام التسعين الأولى. سنحدّث هذه الصفحة كلما تحققت إحدى هذه المراحل.",
  },
];

/* ─── Metadata ────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: truncateTitle("كيف يبني زافيس نظام تقييمات رعاية صحية موثق", 58),
  description: truncateDescription(
    "إطار عمل التقييمات الموثقة من زافيس لمقدّمي الرعاية الصحية في الإمارات. إطلاق الربع الثالث 2026: خمس فئات تحقق، إشراف بشري، وامتثال لقانون حماية البيانات.",
    155,
  ),
  alternates: {
    canonical: `${baseUrl}/ar/verified-reviews`,
    languages: {
      en: `${baseUrl}/verified-reviews`,
      "ar-AE": `${baseUrl}/ar/verified-reviews`,
      "x-default": `${baseUrl}/verified-reviews`,
    },
  },
  openGraph: {
    title: "كيف يبني زافيس نظام تقييمات رعاية صحية موثق",
    description:
      "خمس فئات تحقق، إشراف بشري، وامتثال لقانون حماية البيانات. صفحة سياسة الثقة والتقييمات من زافيس — إطلاق الربع الثالث 2026.",
    type: "website",
    locale: "ar_AE",
    siteName: "دليل الرعاية الصحية المفتوح للإمارات",
    url: `${baseUrl}/ar/verified-reviews`,
  },
  twitter: {
    card: "summary_large_image",
    title: "إطار التقييمات الموثقة من زافيس",
    description:
      "صفحة السياسة العامة لنظام تقييمات الرعاية الصحية الموثقة من زافيس — المعايير، الإشراف، الامتثال لـ PDPL، إطلاق الربع الثالث 2026.",
  },
};

/* ─── Page ──────────────────────────────────────────────────────── */
export default function VerifiedReviewsPageArabic() {
  const canonical = `${baseUrl}/ar/verified-reviews`;

  const webPageNode = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: "كيف يبني زافيس نظام تقييمات رعاية صحية موثق",
    description:
      "إطار عمل التقييمات الموثقة من زافيس: خمس فئات تحقق، إشراف بشري، وامتثال لقانون حماية البيانات. إطلاق الربع الثالث 2026.",
    inLanguage: "ar-AE",
    isPartOf: {
      "@type": "WebSite",
      name: "دليل الرعاية الصحية المفتوح للإمارات",
      url: `${baseUrl}/ar`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: "زافيس",
      url: baseUrl,
    },
    datePublished: "2026-04-11",
    dateModified: "2026-04-11",
    mainEntity: faqPageSchema(FAQS_AR),
  };

  const breadcrumbNode = breadcrumbSchema([
    { name: "الرئيسية", url: `${baseUrl}/ar` },
    { name: "حول", url: `${baseUrl}/ar/about` },
    { name: "التقييمات الموثقة", url: canonical },
  ]);

  const organizationNode = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "زافيس",
    alternateName: "Zavis",
    url: baseUrl,
    email: "trust@zavis.ai",
    sameAs: [canonical, `${baseUrl}/verified-reviews`],
    areaServed: {
      "@type": "Country",
      name: "الإمارات العربية المتحدة",
    },
  };

  const faqNode = faqPageSchema(FAQS_AR);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="font-arabic max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 text-right"
    >
      <JsonLd data={webPageNode} />
      <JsonLd data={breadcrumbNode} />
      <JsonLd data={organizationNode} />
      <JsonLd data={faqNode} />

      {/* ── Breadcrumb (RTL, simple inline) ───────────────── */}
      <nav
        aria-label="مسار التنقل"
        className="mb-6 font-['Geist',sans-serif] text-xs text-black/40"
      >
        <ol className="flex items-center gap-2 flex-wrap">
          <li>
            <Link href="/ar" className="hover:text-[#006828] transition-colors">
              الرئيسية
            </Link>
          </li>
          <li className="text-black/20">·</li>
          <li>
            <Link
              href="/ar/about"
              className="hover:text-[#006828] transition-colors"
            >
              حول
            </Link>
          </li>
          <li className="text-black/20">·</li>
          <li className="text-[#1c1c1c] font-medium">التقييمات الموثقة</li>
        </ol>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <header className="max-w-3xl mb-12">
        <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#006828] border border-[#006828]/30 bg-[#006828]/5 px-2 py-1 mb-4">
          سياسة الثقة والإشراف · إطلاق الربع الثالث 2026
        </span>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] text-[#1c1c1c] tracking-tight leading-tight mb-4">
          كيف يبني زافيس نظام تقييمات موثق
        </h1>
        <p className="font-['Geist',sans-serif] text-base text-black/60 leading-relaxed">
          لا يمكن استعارة الثقة في قطاع الرعاية الصحية الإماراتي من نجمة
          تقييم مسحوبة من موقع آخر. تشرح هذه الصفحة ما الذي سيتحقق منه زافيس،
          وكيف، ومتى — والأهم من ذلك كله — ما الذي لن نفتعله أبداً. لا توجد
          أي تقييمات منشورة حالياً.
        </p>
      </header>

      <div className="max-w-3xl space-y-14">
        {/* ── 1. المشكلة ─────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            مشكلة معظم تقييمات الرعاية الصحية
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            معظم تقييمات الرعاية الصحية على الإنترنت لا يمكن الوثوق بها. يمكن
            لمستخدمين مجهولين تقييم منشآت لم يزوروها قط. يستطيع المنافسون ترك
            تقييمات خبيثة بنجمة واحدة. يمكن لوكالات العلاقات العامة زرع
            تقييمات من خمس نجوم بهدوء. وتبيع مزارع التقييمات تقييماً يشبه تقييم
            المرضى مقابل بضعة دراهم. لا تُحَلّ أي من هذه المشاكل بإضافة المزيد
            من نصوص التقييمات — بل تُحَل بإثبات أن مريضاً حقيقياً، زار منشأة
            حقيقية فعلاً، هو من ترك التقييم. من دون بوابة حجز أو حلقة موعد أو
            تسجيل دخول موثّق، فإن كل تقييم على صفحة الدليل هو ادعاء لا يمكن
            تدقيقه. تجنّب زافيس حتى الآن هذا الفشل عبر عدم نشر تقييمات المرضى
            إطلاقاً. ما تراه اليوم على صفحات المنشآت هو عدد تقييمات جوجل
            التجميعي، وليس تقييماً من زافيس. تشرح هذه الصفحة كيف نخطط لاكتساب
            الحق في نشر تقييماتنا الخاصة — والالتزامات التشغيلية التي نتبنّاها
            قبل ظهور أول تقييم على zavis.ai.
          </p>
        </section>

        {/* ── 2. Zocdoc ────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            لماذا Zocdoc هو مرجعنا
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            في الولايات المتحدة، أمضت Zocdoc أكثر من خمس عشرة سنة في بناء ما
            نعتقد أنه أقوى نظام تقييمات موثق بحلقة مغلقة في قطاع الرعاية
            الصحية. تقبل Zocdoc التقييمات فقط من المرضى الذين حجزوا موعداً
            فعلياً عبر منصتها، ويتم فحص كل تقييم يدوياً قبل نشره. ما يجعلها
            ناجحة ليس نموذج التقييم — بل حلقة الحجز التي يقوم عليها. لا يُقلّد
            زافيس منتج Zocdoc، ولا يحاكي شارة &quot;Zocdoc Verified&quot;. نحن
            نتبنى المبدأ: التقييم لا يكون مفيداً إلا إذا ثبت أن كاتبه مريض
            فعلي. كل ما يلي هو النسخة الإماراتية من هذا المبدأ.
          </p>
        </section>

        {/* ── 3. 5 tiers ───────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            إطار التحقق في زافيس
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-6">
            سينشر زافيس التقييمات ضمن خمس فئات تحقق. كل فئة مستقلة: قد تحمل
            المنشأة فئة واحدة، أو عدة فئات، أو لا شيء. ولن يظهر أي تقييم لا
            يحمل أي فئة على صفحات المنشآت في زافيس.
          </p>

          <ol className="space-y-5">
            {VERIFIED_TIERS.map((t, i) => (
              <li
                key={t.tier}
                className="border border-[#1c1c1c]/10 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[11px] text-black/40 pt-1 w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] text-base text-[#1c1c1c]">
                        {t.labelAr}
                      </h3>
                      <VerifiedBadge tier={t.tier} size="sm" locale="ar" />
                    </div>
                    <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                      {t.blurbAr}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 4. Never do ──────────────────── */}
        <section className="border-r-2 border-[#006828] pr-5">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            ما الذي لن يفعله زافيس أبداً
          </h2>
          <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-2 list-disc pr-5">
            <li>
              إنشاء تقييمات وهمية، أو شهادات عينية، أو اقتباسات نائبة من
              المرضى بأي شكل.
            </li>
            <li>
              إعادة نشر النص الكامل لتقييمات جوجل أو استخراجها لعرضها على
              صفحات المنشآت في زافيس.
            </li>
            <li>
              توليد نص تقييم عبر نموذج لغوي، حتى لو كانت الحقائق الأساسية
              دقيقة.
            </li>
            <li>
              قبول أي مقابل مادي من المنشآت مقابل تقييمات إيجابية، أو ترتيب
              التقييمات، أو إخفائها.
            </li>
            <li>
              ادعاء أن المنشأة &quot;تقبل مرضى جدد&quot; في أي بيانات مهيكلة أو
              واجهة مستخدم مرئية ما لم يكن الادعاء مدعوماً بمصدر بيانات حقيقي
              وحلقة تحديث.
            </li>
            <li>
              عرض أعداد تقييمات لا يمكننا ربطها بفئة تحقق محددة من هذه الصفحة.
            </li>
          </ul>
        </section>

        {/* ── 5. Moderation ────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            سياسة الإشراف
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-3">
            سيدخل كل تقييم يصل إلى زافيس قائمة إشراف بشرية قبل النشر. المشرفون
            هم موظفون مدربون من زافيس — وليسوا المنشآت أنفسها، ولا خط معالجة
            آلي. تفرض القائمة السياسات التالية:
          </p>
          <ul className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed space-y-2 list-disc pr-5">
            <li>
              <strong>نافذة الاعتراض:</strong> تحصل المنشآت على نافذة اعتراض
              مدتها 12 شهراً من تاريخ النشر. تُرسل الاعتراضات إلى{" "}
              <a
                href="mailto:trust@zavis.ai"
                className="text-[#006828] hover:underline"
              >
                trust@zavis.ai
              </a>
              .
            </li>
            <li>
              <strong>نافذة رد المنشأة:</strong> سبعة أيام من الرد الخاص قبل
              نشر التقييم.
            </li>
            <li>
              <strong>حدود السرعة:</strong> لا يجوز أن تتلقى منشأة واحدة أكثر
              من عدد محدد من التقييمات خلال 24 ساعة متجدّدة دون إشارة تحقق
              ثانوية — وهو حارس معياري ضد الحملات المنسّقة.
            </li>
            <li>
              <strong>قواعد المحتوى:</strong> لا بيانات شخصية، ولا تسمية أطباء
              بأعيانهم ما لم يكونوا موضوع الملف، ولا ادعاءات نتائج طبية
              محددة لا يمكننا التحقق منها، ولا تشهير، ولا خطاب كراهية.
            </li>
            <li>
              <strong>أسباب الإزالة:</strong> تُزال التقييمات إذا سحب المريض
              موافقته، أو إذا قدّمت المنشأة دليلاً رئيسياً متعارضاً، أو إذا
              خالف المحتوى القواعد المنشورة.
            </li>
          </ul>
        </section>

        {/* ── 6. PDPL ─────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            خصوصية البيانات والامتثال لقانون PDPL
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            سيعمل نظام تقييمات زافيس الموثقة تحت مظلة المرسوم الاتحادي رقم 45
            لسنة 2021 بشأن حماية البيانات الشخصية. وهذا يعني: موافقة صريحة
            مُفصّلة قبل إرسال أي رسالة نصية؛ وإشعار خصوصية واضح على نموذج
            التقييم يذكر المتحكم في البيانات، والأغراض، ومدة الاحتفاظ، وحقوق
            المريض؛ وتخزين أرقام الهواتف فقط كتجزئة مشفّرة وليس كنص صريح؛
            ونافذة احتفاظ مدتها 12 شهراً؛ وحق موثق في المسح نلتزم به خلال 30
            يوماً من أي طلب صالح. سيُنشر اسم مسؤول حماية البيانات على هذه
            الصفحة قبل تشغيل أي نموذج استقبال، كما أن التدقيق المستقل لتدفق
            SMS-OTP مدرج كمرحلة حاسمة في الجدول الزمني أدناه.
          </p>
        </section>

        {/* ── 7. Timeline ─────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            الجدول الزمني — إطلاق الربع الثالث 2026
          </h2>
          <ol className="space-y-3 font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                ر2 2026
              </span>
              <span>
                نشر صفحة السياسة. فتح باب التعليقات عبر{" "}
                <a
                  href="mailto:trust@zavis.ai"
                  className="text-[#006828] hover:underline"
                >
                  trust@zavis.ai
                </a>
                . بدء توظيف فريق الإشراف.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                ر2 2026
              </span>
              <span>
                مراجعة قانونية لتدفق SMS-OTP ولصياغة الموافقة. تعيين مسؤول
                حماية البيانات. توقيع اتفاقية معالجة البيانات مع مزود الرسائل
                النصية.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                ر3 2026
              </span>
              <span>
                تجربة مع 20 إلى 40 منشأة موافقة في دبي. فئة &quot;زيارة
                موثقة&quot; فقط. بدون ظهور علني خلال المرحلة التجريبية.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                ر3 2026
              </span>
              <span>
                إطلاق عام لفئتَي &quot;زيارة موثقة&quot; و&quot;ترخيص موثق&quot;
                في دبي وأبوظبي. نشر أول تقرير ثقة مع إحصاءات الإشراف.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                ر4 2026
              </span>
              <span>
                إضافة فئتَي &quot;وصفة موثقة&quot; و&quot;مراجعة تحريرية&quot;.
                التوسع إلى الشارقة والإمارات الشمالية.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-[11px] text-[#006828] pt-0.5 w-20 shrink-0">
                2027
              </span>
              <span>
                فئة &quot;زافيس جولد&quot; بالتعاون مع شركات تأمين موافقة.
                التوسع إلى بقية دول مجلس التعاون الخليجي.
              </span>
            </li>
          </ol>
        </section>

        {/* ── 8. FAQ ─────────────────────── */}
        <section>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-4 tracking-tight">
            الأسئلة المتكررة
          </h2>
          <div className="space-y-5">
            {FAQS_AR.map((faq) => (
              <details
                key={faq.question}
                className="border border-[#1c1c1c]/10 bg-white p-5 group"
              >
                <summary className="font-['Bricolage_Grotesque',sans-serif] text-base text-[#1c1c1c] cursor-pointer list-none flex justify-between items-start gap-4">
                  <span>{faq.question}</span>
                  <span className="font-mono text-xs text-[#006828] pt-1 shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 9. Contact ───────────────────── */}
        <section className="border-t border-[#1c1c1c]/10 pt-8">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] text-[#1c1c1c] mb-3 tracking-tight">
            جهة الاتصال وتحديثات السياسة
          </h2>
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed mb-2">
            للأسئلة والتصحيحات والاعتراضات أو ملاحظات السياسة:{" "}
            <a
              href="mailto:trust@zavis.ai"
              className="text-[#006828] hover:underline font-medium"
            >
              trust@zavis.ai
            </a>
            .
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
            تُراجَع هذه السياسة وتُحدَّث كل ربع على الأقل، وكلما تغيّرت إحدى
            مراحل الإطلاق. آخر تحديث: 11 أبريل 2026. النسخة الإنجليزية:{" "}
            <Link
              href="/verified-reviews"
              className="text-[#006828] hover:underline"
            >
              English version
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
