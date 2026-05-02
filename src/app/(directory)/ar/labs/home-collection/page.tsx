import { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  MapPin,
  Award,
  CheckCircle,
  ArrowRight,
  Smartphone,
  UserCheck,
  TestTube,
  FileText,
  Shield,
  Wallet,
  XCircle,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_PROFILES,
  HEALTH_PACKAGES,
  getLabStats,
  getPricesForLab,
  getPackagesForLab,
  getPopularTests,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  const freeCount = LAB_PROFILES.filter(
    (l) => l.homeCollection && l.homeCollectionFee === 0
  ).length;
  return {
    title: `خدمة السحب المنزلي للفحوصات المخبرية في الإمارات — قارن ${stats.labsWithHomeCollection} خدمة`,
    description: `قارن خدمات سحب عينات الدم المنزلية في الإمارات. ${freeCount} مختبر يوفر السحب المنزلي مجاناً. ممرضون مرخصون من DHA يزورونك في دبي وأبوظبي والشارقة. نتائج خلال 24 ساعة. تبدأ من AED 99.`,
    alternates: {
      canonical: `${base}/ar/labs/home-collection`,
      languages: {
        "en-AE": `${base}/labs/home-collection`,
        "ar-AE": `${base}/ar/labs/home-collection`,
      },
    },
    openGraph: {
      title: "خدمة السحب المنزلي للفحوصات المخبرية في الإمارات — قارن الخدمات والأسعار",
      description: `${stats.labsWithHomeCollection} مختبر يوفر سحب عينات الدم في المنزل عبر الإمارات. ${freeCount} خدمة مجانية. احجز عبر الإنترنت، والممرض يزورك، ونتائج رقمية خلال 24 ساعة.`,
      url: `${base}/ar/labs/home-collection`,
      type: "website",
    },
  };
}

export default function ArabicHomeCollectionPage() {
  const base = getBaseUrl();
  const stats = getLabStats();
  const homeCollectionLabs = LAB_PROFILES.filter((l) => l.homeCollection);
  const freeHomeLabs = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0);
  const allCitiesWithHome = Array.from(
    new Set(homeCollectionLabs.flatMap((l) => l.cities))
  ).sort();
  const popularTests = getPopularTests();

  // Build per-city lab lists
  const labsByCity: Record<string, typeof homeCollectionLabs> = {};
  for (const city of allCitiesWithHome) {
    labsByCity[city] = homeCollectionLabs.filter((l) => l.cities.includes(city));
  }

  const faqs = [
    {
      question: "كم تبلغ تكلفة سحب عينة الدم في المنزل داخل الإمارات؟",
      answer:
        "تتفاوت رسوم السحب المنزلي بحسب مزود الخدمة. تقدم مختبرات Thumbay وMedsol Diagnostics وAlpha Medical وPureLab وDarDoc وHealthchecks360 وServiceMarket السحب المنزلي مجاناً تماماً — إذ تدفع فقط مقابل الفحوصات. أما Al Borg Diagnostics فتتقاضى AED 50 للزيارة، وتتقاضى STAR Metropolis AED 50، وMenaLabs AED 50، وNRL AED 75، وUnilabs AED 100. تتشابه أسعار الفحوصات الفردية مع أسعار الحضور المباشر إلى المختبر. تبدأ باقة الفحوصات الأساسية (CBC وجلوكوز ولوحة الدهون) التي تُجمع في المنزل من AED 99 عند DarDoc.",
    },
    {
      question: "كم يستغرق وصول ممرض السحب المنزلي في دبي؟",
      answer:
        "تهدف معظم خدمات السحب المنزلي في دبي إلى إرسال ممرض مرخص من DHA في غضون 30 إلى 90 دقيقة من الحجز، وإن كانت مواعيد اليوم التالي متاحة أيضاً. تُعدّ DarDoc وServiceMarket الأسرع عموماً، إذ توفران مواعيد في اليوم ذاته وحجوزات عاجلة. لضمان موعد صباحي مبكر للسحب على الريق — وهو ما تستلزمه فحوصات عديدة — يُنصح بالحجز مساء اليوم السابق وتحديد خانة الساعة 7-8 صباحاً. تعمل الخدمات عادةً من الساعة 7 صباحاً حتى 10 أو 11 مساءً يومياً في دبي وأبوظبي.",
    },
    {
      question: "هل سحب عينات الدم في المنزل آمن في الإمارات؟",
      answer:
        "نعم. يجب أن يحمل جميع أخصائيي سحب الدم العاملون في منازل المرضى ترخيصاً من DHA (دبي) أو DOH (أبوظبي). يستخدمون إبراً معقمة للاستعمال مرة واحدة وأنظمة أنابيب فراغية، ويتبعون بروتوكولات مكافحة العدوى المعيارية، وينقلون العينات في حاويات مبردة محكومة الحرارة إلى المختبرات الشريكة. المختبرات التي تعالج العينات هي ذاتها المنشآت المعتمدة المستخدمة للمرضى الحاضرين مباشرةً. تُسلَّم النتائج عبر تطبيق آمن أو بريد إلكتروني، وليس ورقياً.",
    },
    {
      question: "هل تغطي التأمينات الصحية خدمة السحب المنزلي في الإمارات؟",
      answer:
        "تتفاوت تغطية التأمين لخدمة السحب المنزلي. تغطي كثير من خطط التأمين الصحي في الإمارات (Daman وThiqa وAXA وCigna وMSH) الفحوصات المخبرية ذاتها، لكنها تتعامل مع رسوم السحب المنزلي باعتبارها تكلفة راحة تُدفع من الجيب. تغطي بعض خطط التأمين الجماعي ذات المزايا المعززة رسوم السحب المنزلي. راجع بند المزايا المنزلية أو المخبرية في وثيقتك التأمينية. تعمل DarDoc وHealthchecks360 وServiceMarket مع شركات تأمين منتقاة — تواصل معها للتحقق من خطتك قبل الحجز.",
    },
    {
      question: "ما الفحوصات التي يمكن إجراؤها بالسحب المنزلي في الإمارات؟",
      answer:
        "الغالبية العظمى من فحوصات الدم الاعتيادية قابلة للسحب في المنزل: CBC ولوحة الدهون وجلوكوز الصيام وHbA1c ووظائف الكبد ووظائف الكلى ولوحة الغدة الدرقية (TSH وT3 وT4) وفيتامين D وفيتامين B12 ودراسات الحديد والهرمونات (التستوستيرون والإستراديول وFSH وAMH) وعلامات الأورام (PSA وCA-125 وCEA) وفحوصات البول والفيروسات (HIV والتهاب الكبد B والزهري). الفحوصات التي لا يمكن إجراؤها في المنزل تشمل: التصوير (الموجات فوق الصوتية والأشعة السينية والرنين المغناطيسي) والخزعات وبعض الفحوصات الجزيئية التي تستلزم معالجة فورية في الموقع.",
    },
    {
      question: "كيف أستعد لزيارة سحب الدم المنزلية؟",
      answer:
        "يعتمد التحضير على الفحوصات المطلوبة. إذا كانت فحوصاتك تستلزم الصيام (لوحة الدهون وجلوكوز الصيام وHbA1c والأنسولين)، صُم لمدة 8-12 ساعة مسبقاً — الماء والأدوية مسموح بها ما لم ينصح طبيبك بخلاف ذلك. اشرب كميات وفيرة من الماء قبل الزيارة لأن الترطيب يُيسّر الوصول إلى الوريد. ارتدِ ملابس يسهل رفع أكمامها. احتفظ بهويتك الإماراتية أو جواز سفرك بالقرب منك. تأكد من وجود شخص ما في المنزل خلال فترة الموعد. سيحضر الممرض جميع المعدات — لا شيء عليك إعداده.",
    },
  ];

  const breadcrumbs = [
    { name: ar.home, url: `${base}/ar` },
    { name: "مقارنة أسعار الفحوصات المخبرية", url: `${base}/ar/labs` },
    { name: "خدمة السحب المنزلي" },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "خدمة السحب المنزلي للفحوصات المخبرية في الإمارات",
    description: `قارن ${homeCollectionLabs.length} خدمة لسحب عينات الدم في المنزل عبر الإمارات. ممرضون مرخصون من DHA، سحب مجاني في ${freeHomeLabs.length} مختبر، نتائج خلال 24 ساعة.`,
    url: `${base}/ar/labs/home-collection`,
    numberOfItems: homeCollectionLabs.length,
    itemListElement: homeCollectionLabs.map((lab, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalClinic",
        name: lab.name,
        url: `${base}/labs/${lab.slug}`,
        description: lab.description,
      },
    })),
  };

  return (
    <div className="font-arabic container-tc py-8" dir="rtl" lang="ar">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={collectionPageSchema} />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "مقارنة أسعار الفحوصات المخبرية", href: "/ar/labs" },
          { label: "خدمة السحب المنزلي" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            خدمة السحب المنزلي للفحوصات المخبرية في الإمارات — قارن الخدمات والأسعار
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            خدمة سحب عينات الدم في المنزل متاحة على نطاق واسع عبر الإمارات العربية المتحدة.
            يزور أخصائي مرخص من DHA أو DOH منزلك أو مكتبك أو فندقك، ويسحب العينة
            باستخدام معدات معقمة، ويسلّمك النتائج رقمياً خلال 24 ساعة. من أصل{" "}
            {stats.totalLabs} مختبراً تشخيصياً يرصدها هذا الدليل،{" "}
            {homeCollectionLabs.length} منها يوفر خدمة السحب المنزلي
            — {freeHomeLabs.length} منها لا تتقاضى شيئاً مقابل الزيارة. تمتد
            التغطية إلى {allCitiesWithHome.length} مدن تشمل دبي وأبوظبي والشارقة
            وعجمان وإمارات الشمال.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: homeCollectionLabs.length.toString(), label: "مختبر يوفر السحب المنزلي" },
            { value: freeHomeLabs.length.toString(), label: "سحب منزلي مجاني" },
            { value: allCitiesWithHome.length.toString(), label: "مدن مشمولة" },
            { value: "24h", label: "وقت تسليم النتائج المعتاد" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center border border-black/[0.06]">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Labs with home collection */}
      <div className="section-header">
        <h2>المختبرات التي توفر السحب المنزلي</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          يقارن الجدول أدناه جميع المختبرات التشخيصية ومنصات الخدمة المنزلية
          البالغ عددها {homeCollectionLabs.length} والتي توفر سحب العينات في المنزل
          عبر الإمارات. مزودو الخدمة المنزلية مثل DarDoc وHealthchecks360 يعملون
          بالكامل في المنازل دون فروع للحضور المباشر. أما السلاسل التقليدية كـ Al Borg
          وThumboy وMedsol فتقدم السحب المنزلي إضافةً إلى شبكة فروعها.
        </p>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-xs border border-black/[0.06]">
          <thead>
            <tr className="bg-light-50">
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">المختبر</th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">رسوم السحب المنزلي</th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">وقت التسليم</th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">الاعتمادات</th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">المدن</th>
            </tr>
          </thead>
          <tbody>
            {homeCollectionLabs
              .sort((a, b) => a.homeCollectionFee - b.homeCollectionFee)
              .map((lab, i) => (
                <tr key={lab.slug} className={i % 2 === 0 ? "bg-white" : "bg-light-50"}>
                  <td className="p-3 border-b border-black/[0.06]">
                    <Link
                      href={`/labs/${lab.slug}`}
                      className="font-bold text-dark hover:text-accent transition-colors"
                    >
                      {lab.name}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">
                      {lab.type === "home-service" ? "منصة خدمة منزلية" : "سلسلة مختبرات"}
                    </div>
                  </td>
                  <td className="p-3 border-b border-black/[0.06]">
                    {lab.homeCollectionFee === 0 ? (
                      <span className="font-bold text-accent">مجاني</span>
                    ) : (
                      <span className="font-medium text-dark">AED {lab.homeCollectionFee}</span>
                    )}
                  </td>
                  <td className="p-3 border-b border-black/[0.06] text-muted">{lab.turnaroundHours} ساعة</td>
                  <td className="p-3 border-b border-black/[0.06] text-muted">
                    {lab.accreditations.slice(0, 3).join(", ")}
                  </td>
                  <td className="p-3 border-b border-black/[0.06]">
                    <div className="flex flex-wrap gap-1">
                      {lab.cities.slice(0, 3).map((c) => (
                        <span key={c} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5">
                          {getArabicCityName(c)}
                        </span>
                      ))}
                      {lab.cities.length > 3 && (
                        <span className="text-[10px] text-muted">+{lab.cities.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Lab Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {homeCollectionLabs.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
          return (
            <LabCard
              key={lab.slug}
              lab={lab}
              testCount={prices.length}
              packageCount={packages.length}
              cheapestFrom={cheapest}
            />
          );
        })}
      </div>

      {/* How home lab testing works */}
      <div className="section-header">
        <h2>كيف تعمل الخدمة — السحب المنزلي خطوة بخطوة</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-4">
          يسير السحب المنزلي للفحوصات المخبرية في الإمارات وفق إجراءات منضبطة ومرخصة.
          بموجب أنظمة DHA وDOH، يجب أن يحمل جميع أخصائيي سحب الدم العاملين في منازل
          المرضى ترخيصاً سارياً من هيئة صحية إماراتية. تُجمع العينات باستخدام أنظمة
          الأنابيب الفراغية المعقمة ذاتها المستخدمة في المختبرات السريرية، وتُنقل في
          حاويات سلسلة تبريد معتمدة، وتُعالج في المختبرات المعتمدة من DHA أو DOH
          ذاتها المستخدمة للمرضى الحاضرين مباشرةً. النتيجة مكافئة سريرياً لزيارة
          المختبر — الفرق الوحيد هو مكان سحب العينة.
        </p>
      </div>

      {/* Step-by-step */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          {
            icon: Smartphone,
            step: "١",
            title: "احجز عبر الإنترنت أو التطبيق",
            body: "اختر فحوصاتك على موقع المختبر أو تطبيقه (DarDoc أو ServiceMarket أو Healthchecks360) أو اتصل بالمختبر مباشرةً. حدد خانة زمنية — تعمل معظم الخدمات من الساعة 7 صباحاً حتى 10 مساءً يومياً. لفحوصات الصيام، احجز خانة صباحية وأوقف الطعام 8-12 ساعة قبل الموعد.",
          },
          {
            icon: UserCheck,
            step: "٢",
            title: "الممرض يزورك",
            body: "يصل أخصائي سحب دم مرخص من DHA أو DOH إلى منزلك أو مكتبك أو فندقك في الوقت المحدد. يحمل جميع المعدات: إبراً معقمة وأنابيب فراغية وقفازات ومناديل مطهرة وملصقات عينات وحقيبة نقل مبردة. قد يُطلب التحقق من الهوية.",
          },
          {
            icon: TestTube,
            step: "٣",
            title: "استلام العينة",
            body: "يسحب الممرض الدم (والبول إن لزم) باستخدام تقنية ثقب الوريد المعيارية. تستغرق الزيارة عادةً 10-15 دقيقة. تُغلق العينات وتُلصق عليها الملصقات وتوضع فوراً في حاويات نقل محكومة الحرارة للحفاظ على سلامتها.",
          },
          {
            icon: FileText,
            step: "٤",
            title: "استلم نتائجك خلال 24 ساعة",
            body: "تصل العينات إلى مختبر المعالجة في غضون ساعات. الفحوصات الاعتيادية (CBC والجلوكوز ووظائف الكبد والكلى) تكون جاهزة عادةً خلال 6-24 ساعة. تُسلَّم النتائج عبر إشعار تطبيق آمن أو بريد إلكتروني أو ملف PDF عبر واتساب. يتيح معظم المزودين مشاركة النتائج مباشرةً مع طبيبك.",
          },
        ].map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="border border-black/[0.06] p-4 bg-light-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step}
              </div>
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold text-dark text-sm mb-2">{title}</h3>
            <p className="text-xs text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Tests available for home collection */}
      <div className="section-header">
        <h2>الفحوصات المتاحة للسحب المنزلي</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          يشمل السحب المنزلي الطيف الكامل من فحوصات الدم. تعكس الأسعار أدناه ما تدفعه
          في المختبرات القادرة على الخدمة المنزلية — تتشابه أسعار الفحوصات الفردية مع
          أسعار الحضور المباشر، مع إضافة رسوم الزيارة المنزلية فحسب (مجانية في{" "}
          {freeHomeLabs.length} مختبر). انقر على أي فحص لمقارنة أسعاره عبر جميع المختبرات.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {popularTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {test.fastingRequired ? "يستلزم الصيام · " : "لا يستلزم الصيام · "}
                {test.turnaroundHours} ساعة
              </p>
            </div>
            <div className="text-left flex-shrink-0">
              {test.priceRange && (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">{test.priceRange.labCount} مختبرات</p>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Home collection packages */}
      <div className="section-header">
        <h2>باقات السحب المنزلي</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          تقدم مختبرات عديدة باقات مجمّعة مصممة خصيصاً للسحب المنزلي، تجمع فحوصات
          متعددة بسعر واحد شامل رسوم الزيارة. باقات DarDoc المنزلية هي الأكثر طلباً —
          تشمل الباقة الأساسية 5 فحوصات محورية بدءاً من AED 199 مع تضمين السحب المنزلي
          في السعر.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {HEALTH_PACKAGES.filter((pkg) => {
          const lab = homeCollectionLabs.find((l) => l.slug === pkg.labSlug);
          return !!lab;
        })
          .slice(0, 6)
          .map((pkg) => {
            const lab = LAB_PROFILES.find((l) => l.slug === pkg.labSlug)!;
            return (
              <div key={pkg.id} className="border border-black/[0.06] p-4 hover:border-accent transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-muted uppercase tracking-wide font-bold">
                    {lab.name}
                  </span>
                  {lab.homeCollectionFee === 0 && (
                    <span className="text-[9px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-bold">
                      سحب مجاني
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-dark text-sm mb-1">{pkg.name}</h3>
                <p className="text-[11px] text-muted mb-3">{pkg.targetAudience}</p>
                <p className="text-xl font-bold text-dark mb-1">{formatPrice(pkg.price)}</p>
                <p className="text-[11px] text-muted mb-3">{pkg.biomarkerCount} مؤشر حيوي</p>
                <div className="space-y-1">
                  {pkg.includes.slice(0, 4).map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-dark">
                      <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-black/[0.06]">
                  <Link
                    href={`/labs/${lab.slug}`}
                    className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
                  >
                    احجز عبر {lab.name} →
                  </Link>
                </div>
              </div>
            );
          })}
      </div>

      {/* Home vs walk-in comparison */}
      <div className="section-header">
        <h2>السحب المنزلي مقابل الحضور المباشر — أيهما أفضل؟</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-4">
          يستخدم كلا الخيارين منشآت معالجة مرخصة من DHA ذاتها ويُنتجان نتائج مكافئة
          سريرياً. يعتمد الاختيار على الراحة والتوقيت والتكلفة. إليك مقارنة مباشرة:
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {/* Home collection pros/cons */}
        <div className="border border-black/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-dark">السحب المنزلي</h3>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">المزايا</p>
            {[
              "لا تنقل ولا توقف سيارة ولا غرف انتظار",
              "مثالي لكبار السن والمتعافين من الجراحات ومحدودي الحركة",
              "مناسب للأطفال الصغار الذين يجدون صعوبة في زيارة العيادات",
              "سحب الصيام في وقت مريح دون استعجال للوصول إلى المختبر",
              "حل عملي للمشغولين — من المنزل أو المكتب أو الفندق",
              "مجاني في 7 مختبرات إماراتية تشمل Thumbay وMedsol وDarDoc",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-dark">
                <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">القيود</p>
            {[
              "بعض المختبرات تتقاضى AED 50-100 رسوم زيارة منزلية",
              "أسعار الفحوصات الفردية أعلى قليلاً في منصات الخدمة المنزلية",
              "لا يمكن إجراء التصوير (الأشعة السينية والموجات فوق الصوتية) في المنزل",
              "انتظار خانة الموعد (30-90 دقيقة)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-muted">
                <XCircle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Walk-in pros/cons */}
        <div className="border border-black/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-dark">الحضور المباشر للمختبر</h3>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">المزايا</p>
            {[
              "عادةً أدنى أسعار للفحوصات الفردية",
              "خدمة فورية — لا حاجة للحجز المسبق",
              "قد تكون بعض النتائج جاهزة في اليوم ذاته",
              "إمكانية إضافة فحوصات في الموقع بعد الاستشارة",
              "التصوير والفحوصات المتخصصة متاحة في الموقع",
              "لا تستلزم وصفة طبية في معظم المختبرات المستقلة",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-dark">
                <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">القيود</p>
            {[
              "تنقل ومرور وصعوبة إيجاد مواقف في دبي وأبوظبي",
              "وقت الانتظار في غرفة الانتظار لا سيما في أوقات الذروة",
              "الوصول إلى المختبر أثناء الصيام للسحب الصباحي",
              "أقل ملاءمة للمرضى محدودي الحركة",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-muted">
                <XCircle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation box */}
      <div className="bg-light-50 border border-black/[0.06] p-5 mb-12">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              متى يكون السحب المنزلي هو الخيار الأمثل؟
            </p>
            <p className="text-xs text-muted leading-relaxed">
              اختر السحب المنزلي إذا كنت تحتاج فحوصات صيام وتجد صعوبة في الوصول إلى
              مختبر قبل الساعة التاسعة صباحاً دون تناول طعام، أو إذا كنت تُدير حالة
              مزمنة تستلزم مراقبة دورية، أو إذا كان أطفالك بحاجة إلى فحوصات دم
              اعتيادية، أو إذا كانت إعاقة حركية أو سن متقدمة أو تعافٍ من جراحة يجعل
              زيارة المختبر أمراً عسيراً. مع توافر {freeHomeLabs.length} مختبر يقدم
              السحب المنزلي مجاناً في الإمارات، لا مبرر مالياً للتفضيل على الحضور
              المباشر لفحوصات الدم الاعتيادية.
            </p>
          </div>
        </div>
      </div>

      {/* Home collection by city */}
      <div className="section-header">
        <h2>خدمة السحب المنزلي حسب المدينة</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          تتفاوت تغطية الخدمة المنزلية بحسب الإمارة. تضم دبي أكبر عدد من مزودي الخدمة
          نظراً لكثافتها السكانية ونضج منظومتها التنظيمية في ظل DHA. تحظى أبوظبي بخدمة
          جيدة من PureLab وNRL وMenaLabs وDarDoc وServiceMarket. تغطي إمارات الشمال
          (الشارقة وعجمان والفجيرة) بصورة رئيسية Thumbay وMedsol وHealthchecks360.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {allCitiesWithHome.map((city) => {
          const cityLabs = labsByCity[city];
          const freeLabs = cityLabs.filter((l) => l.homeCollectionFee === 0);
          return (
            <Link
              key={city}
              href={`/labs/city/${city}`}
              className="border border-black/[0.06] p-4 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-dark group-hover:text-accent transition-colors text-sm">
                  {getArabicCityName(city)}
                </h3>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors rotate-180" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-dark">
                  <Home className="w-3 h-3 text-accent" />
                  {cityLabs.length} مختبر يوفر السحب المنزلي
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark">
                  <Wallet className="w-3 h-3 text-accent" />
                  {freeLabs.length} يوفر السحب المجاني
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {cityLabs.slice(0, 3).map((l) => (
                  <span key={l.slug} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5">
                    {l.name.split(" ")[0]}
                  </span>
                ))}
                {cityLabs.length > 3 && (
                  <span className="text-[10px] text-muted">+{cityLabs.length - 3} أخرى</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quality assurance note */}
      <div className="bg-light-50 border border-black/[0.06] p-5 mb-12">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              الإطار التنظيمي للسحب المنزلي في الإمارات
            </p>
            <p className="text-xs text-muted leading-relaxed">
              تُرخّص هيئة الصحة بدبي (DHA) ودائرة الصحة بأبوظبي (DOH) للمهنيين الصحيين
              الذين يجمعون العينات في المنازل والمختبرات التي تعالجها على حدٍّ سواء.
              يجب أن يحمل ممرضو السحب المنزلي ترخيص تمريض أو سحب دم صادراً عن DHA أو
              DOH. يجب أن يستوفي نقل العينات معايير IATA P650 للمواد البيولوجية. تخضع
              النتائج لمتطلبات ضبط الجودة واختبارات الكفاءة ذاتها المطبقة على نتائج
              المختبرات التقليدية. تُنظّم وزارة الصحة ووقاية المجتمع (MOHAP) الخدمات في
              إمارات الشمال. جميع المختبرات المدرجة هنا تعمل بموجب واحدة أو أكثر من هذه
              الأطر التنظيمية.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="الأسئلة الشائعة عن خدمة السحب المنزلي للفحوصات المخبرية في الإمارات"
      />

      {/* Browse more */}
      <div className="mt-8 border border-black/[0.06] p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-dark">قارن أسعار جميع الفحوصات المخبرية في الإمارات</p>
          <p className="text-xs text-muted mt-0.5">
            {stats.totalTests} فحص · {stats.totalLabs} مختبر · حضور مباشر وسحب منزلي
          </p>
        </div>
        <Link
          href="/ar/labs"
          className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> عرض جميع المختبرات
        </Link>
      </div>

      {/* Language switch */}
      <div className="text-center pt-4 pb-2">
        <Link href="/labs/home-collection" className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> معلومات رسوم السحب المنزلي مستندة إلى
          التسعير المتاح للعموم من مواقع المختبرات ومنصات التجميع (2024–2025). قد تتفاوت
          الرسوم الفعلية بحسب الموقع والوقت والتغطية التأمينية والعروض الترويجية. يُرجى
          دائماً التأكد من الأسعار والتوافر مباشرةً مع المزود قبل الحجز. هذا الدليل
          للأغراض المعلوماتية فحسب ولا يُشكّل نصيحةً طبية. استشر طبيبك قبل طلب أي
          فحوصات تشخيصية. جميع المزودين المدرجين مرخصون من DHA أو DOH أو MOHAP.
          آخر تحقق مارس 2026.
        </p>
      </div>
    </div>
  );
}
