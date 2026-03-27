import { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  ArrowRight,
  CheckCircle,
  TrendingDown,
  Star,
  Users,
  FlaskConical,
  Wallet,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PackageCard } from "@/components/labs/PackageCard";
import {
  LAB_PROFILES,
  HEALTH_PACKAGES,
  getLabStats,
  getLabProfile,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar } from "@/lib/i18n";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  const cheapest = Math.min(...HEALTH_PACKAGES.map((p) => p.price));
  return {
    title: `باقات الفحص الصحي في الإمارات — قارن ${stats.totalPackages} باقة تبدأ من AED ${cheapest} | دليل المختبرات`,
    description: `قارن ${stats.totalPackages} باقة فحص صحي عبر مختبرات الإمارات. باقات اقتصادية تبدأ من AED ${cheapest}، وباقات عافية شاملة من AED 230، وباقات تنفيذية متميزة من AED 899. اعثر على أفضل قيمة للفحص الصحي في دبي وأبوظبي.`,
    alternates: {
      canonical: `${base}/ar/labs/packages`,
      languages: {
        "en-AE": `${base}/labs/packages`,
        "ar-AE": `${base}/ar/labs/packages`,
      },
    },
    openGraph: {
      title: `باقات الفحص الصحي في الإمارات — قارن ${stats.totalPackages} باقة تبدأ من AED ${cheapest}`,
      description: `وفّر 30-50% مقارنةً بطلب الفحوصات فردياً. قارن ${stats.totalPackages} باقة فحص صحي من ${stats.totalLabs} مختبر في الإمارات. من الباقات الاقتصادية إلى التنفيذية.`,
      url: `${base}/ar/labs/packages`,
      type: "website",
    },
  };
}

// Tier classification
const BUDGET_MAX = 200;
const STANDARD_MIN = 200;
const STANDARD_MAX = 500;
const PREMIUM_MIN = 500;

export default function ArabicPackagesPage() {
  const base = getBaseUrl();
  const stats = getLabStats();

  const allPackages = HEALTH_PACKAGES;
  const cheapestPrice = Math.min(...allPackages.map((p) => p.price));
  const mostBiomarkers = Math.max(...allPackages.map((p) => p.biomarkerCount));
  const labsWithPackages = new Set(allPackages.map((p) => p.labSlug)).size;

  const budgetPackages = allPackages.filter((p) => p.price < BUDGET_MAX);
  const standardPackages = allPackages.filter(
    (p) => p.price >= STANDARD_MIN && p.price < STANDARD_MAX
  );
  const premiumPackages = allPackages.filter((p) => p.price >= PREMIUM_MIN);
  const womensPackages = allPackages.filter(
    (p) => p.suitableFor.includes("female") && !p.suitableFor.includes("male")
  );

  // Group packages by lab for the "Compare by Lab" section
  const packagesByLab = LAB_PROFILES.filter(
    (lab) => allPackages.some((p) => p.labSlug === lab.slug)
  ).map((lab) => ({
    lab,
    packages: allPackages
      .filter((p) => p.labSlug === lab.slug)
      .sort((a, b) => a.price - b.price),
  }));

  const comprehensiveExample = allPackages.find((p) => p.id === "alborg-comprehensive");

  const faqs = [
    {
      question: "ما الذي تشمله باقة الفحص الصحي في الإمارات؟",
      answer:
        "تضم باقات الفحص الصحي في الإمارات عادةً مجموعة من فحوصات الدم التي تغطي عدة محاور صحية. تشمل الباقة الأساسية (99-199 درهم) تحليل CBC (تعداد الدم الكامل) ولوحة الدهون وجلوكوز الصيام ووظائف الكبد والكلى — نحو 35-45 مؤشراً حيوياً. تضيف باقة العافية القياسية (200-499 درهم) فحص TSH وفيتامين D وفيتامين B12 ودراسات الحديد وHbA1c وتحليل البول — 60-85 مؤشراً. أما الباقات التنفيذية المتميزة (500 درهم فما فوق) فتتضمن أيضاً مؤشرات القلب (CRP وتروبونين وBNP) وعلامات السرطان (PSA وCEA وCA-125) وأحياناً لوحة الغدة الدرقية الكاملة والهرمونات — أكثر من 120 إلى 150 مؤشراً.",
    },
    {
      question: "كم مرة ينبغي إجراء باقة الفحص الصحي في الإمارات؟",
      answer:
        "للبالغين الأصحاء في الفئة العمرية 18-40 دون عوامل خطر، يكفي إجراء فحص صحي شامل مرة سنوياً. أما من تجاوزوا الأربعين، أو يعانون من السكري أو ارتفاع ضغط الدم أو وجود تاريخ عائلي بأمراض القلب أو السمنة، فيُنصح بإجراء فحص شامل كل 6 أشهر. المصابون بأمراض مزمنة كالسكري واضطرابات الغدة الدرقية يحتاجون عادةً إلى فحوصات محددة كل 3 أشهر. يجعل الانتشار الواسع لنقص فيتامين D بين سكان الإمارات — نتيجة نمط الحياة الداخلية رغم وفرة الشمس — فحص فيتامين D السنوي ضرورياً لجميع الفئات العمرية.",
    },
    {
      question: "أي باقة فحص صحي تقدم أفضل قيمة في الإمارات؟",
      answer:
        "من حيث القيمة الاقتصادية البحتة، تُعدّ باقة فحص الصحة الأساسية من Medsol Diagnostics بـ 99 درهم الأوفر في الإمارات إذ تشمل 5 فحوصات أساسية (CBC ولوحة الدهون والجلوكوز ووظائف الكبد والكلى). أما من حيث الشمولية والقيمة معاً، فتبرز باقة Wellness Plus من Thumbay Labs بـ 349 درهم والتي تغطي 72 مؤشراً شاملاً الفيتامينات والغدة الدرقية — توفر ما يقرب من 36% مقارنةً بطلب الفحوصات منفردةً عند نفس المختبر. أما للفحص المتميز الكامل، فتقدم Al Borg باقة العافية الشاملة بـ 499 درهم (85 مؤشراً) مقابل ما يزيد على 820 درهم لو طُلبت الفحوصات فردياً.",
    },
    {
      question: "هل تغطي التأمينات الصحية في الإمارات باقات الفحص الصحي؟",
      answer:
        "كثير من بوالص التأمين الصحي المقدمة من أصحاب العمل في الإمارات تتضمن مزية الفحص الصحي الوقائي السنوي — راجع بوليصتك تحت بند الرعاية الوقائية أو وثيقة الصحة والعافية. تغطي خطط Daman المحسّنة وبعض بوالص AXA وCigna وMSH المؤسسية باقات الفحص السنوي. غير أن كثيراً من البوالص التي تغطي الفحوصات الفردية تشترط تحويلاً من طبيب وقد لا تغطي الحجز المباشر في المختبر. تغطي ثيقة (خطة Daman لموظفي حكومة أبوظبي) عادةً الفحوصات السنوية في المنشآت المرخصة من DOH. تأكد دائماً من شروط التأمين مع المختبر قبل الحجز.",
    },
    {
      question: "هل أحتاج إلى الصيام قبل إجراء باقة الفحص الصحي؟",
      answer:
        "تستلزم معظم باقات الفحص الصحي الشامل صياماً لمدة 8-12 ساعة لأنها تشمل فحوصات تتطلب عينات الصيام: جلوكوز الصيام (كشف السكري) وHbA1c في بعض المنهجيات ولوحة الدهون (لدقة قراءة الدهون الثلاثية وLDL) والأنسولين الصيامي. يمكنك شرب الماء خلال فترة الصيام — بل إن البقاء رطباً يسهّل سحب الدم. إن كانت باقتك تشمل CBC ووظائف الكلى والكبد والغدة الدرقية فقط دون جلوكوز أو دهون، فقد لا يكون الصيام مطلوباً، لكن الأسلم التأكد من المختبر عند الحجز.",
    },
    {
      question: "كيف أحجز باقة فحص صحي في الإمارات؟",
      answer:
        "تتيح معظم المختبرات الحجز عبر الإنترنت من خلال مواقعها الإلكترونية أو تطبيقاتها. بالنسبة لمختبرات الزيارات المباشرة (Al Borg وThumboy وMedsol وSTAR Metropolis) يمكنك الحضور دون موعد إلى أي فرع، وإن كانت مواعيد الصباح الباكر تمتلئ بسرعة. لخدمات الجمع المنزلي (DarDoc وServiceMarket وHealthchecks360)، احجز عبر التطبيق أو الموقع واختر وقت الزيارة المنزلية المناسب. أحضر هويتك الإماراتية أو جواز سفرك. لباقات الصيام، خطط لزيارة صباحية وتوقف عن الأكل ليلةً سابقة. تقبل معظم المختبرات البطاقات الائتمانية والمدينة وApple Pay، وبعضها يقبل قسائم التأمين.",
    },
  ];

  const breadcrumbs = [
    { name: ar.home, url: `${base}/ar` },
    { name: "الفحوصات المخبرية", url: `${base}/ar/labs` },
    { name: "باقات الفحص الصحي" },
  ];

  // JSON-LD ItemList of packages with Offer pricing
  const packageItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "باقات الفحص الصحي في الإمارات",
    description: `${allPackages.length} باقة فحص صحي من ${labsWithPackages} مختبر في الإمارات، تبدأ من AED ${cheapestPrice}`,
    url: `${base}/ar/labs/packages`,
    numberOfItems: allPackages.length,
    itemListElement: allPackages.map((pkg, i) => {
      const lab = getLabProfile(pkg.labSlug);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: pkg.name,
          description: pkg.targetAudience,
          offers: {
            "@type": "Offer",
            price: pkg.discountedPrice || pkg.price,
            priceCurrency: "AED",
            availability: "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: lab?.name || pkg.labSlug,
            },
          },
        },
      };
    }),
  };

  return (
    <div className="container-tc py-8" dir="rtl" lang="ar">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={packageItemListSchema} />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "الفحوصات المخبرية", href: "/ar/labs" },
          { label: "باقات الفحص الصحي" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            باقات الفحص الصحي في الإمارات — قارن {allPackages.length} باقة تبدأ من{" "}
            {formatPrice(cheapestPrice)}
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            تجمع باقات الفحص الصحي عدة فحوصات مخبرية بسعر مخفّض مقارنةً بطلب كل فحص
            على حدة. في الإمارات، تتراوح الباقات بين{" "}
            <strong className="text-dark">
              لوحة اقتصادية بـ {formatPrice(cheapestPrice)}
            </strong>{" "}
            تغطي 5 فحوصات أساسية، وفحص{" "}
            <strong className="text-dark">
              تنفيذي متميز بـ {formatPrice(Math.max(...allPackages.map((p) => p.price)))}
            </strong>{" "}
            يشمل {mostBiomarkers} مؤشراً حيوياً بما فيها مؤشرات القلب والأورام.
            توفر الباقات عادةً 30-50% مقارنةً بمجموع أسعار الفحوصات الفردية.
            يغطي هذا الدليل {allPackages.length} باقة عبر {labsWithPackages} مختبر
            في دبي وأبوظبي والشارقة والإمارات الشمالية — بما فيها خيارات الجمع المنزلي.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: allPackages.length.toString(), label: "باقة مقارنة" },
            { value: formatPrice(cheapestPrice), label: "أرخص باقة" },
            { value: mostBiomarkers.toString(), label: "أعلى عدد مؤشرات" },
            { value: labsWithPackages.toString(), label: "مختبر يوفر الباقات" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center border border-light-200">
              <p className="text-xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Packages */}
      <div className="section-header">
        <h2>الباقات الاقتصادية — أقل من {formatPrice(BUDGET_MAX)}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          تغطي الباقات الاقتصادية الفحوصات الخمسة الأساسية التي ينبغي لكل بالغ
          إجراؤها سنوياً: CBC (تعداد الدم الكامل) ولوحة الدهون (الكوليسترول)
          وجلوكوز الصيام (كشف السكري) ووظائف الكبد ووظائف الكلى. بسعر يتراوح بين
          99 و199 درهم، تكلّف هذه الباقات أقل من طلب فحصين منفردين في مختبر مستشفى.
          مناسبة للبالغين الأصحاء بدون أمراض مزمنة الراغبين في فحص سنوي روتيني أو
          كشف قبل التوظيف.
        </p>
      </div>
      {budgetPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {budgetPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted mb-12">لا توجد باقات في هذه الفئة حالياً.</p>
      )}

      {/* Standard Packages */}
      <div className="section-header">
        <h2>الباقات القياسية — {formatPrice(STANDARD_MIN)} إلى {formatPrice(STANDARD_MAX)}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          تضيف باقات العافية القياسية فيتامين D وB12 والغدة الدرقية (TSH أو اللوحة
          الكاملة) ودراسات الحديد وHbA1c (متوسط السكري على 3 أشهر) وتحليل البول إلى
          الفحوصات الأساسية. هذه هي الفئة الموصى بها لمعظم المقيمين في الإمارات
          نظراً للانتشار الواسع لنقص فيتامين D (يطال أكثر من 80% من السكان)
          واضطرابات الغدة الدرقية ومقدمات السكري. تغطي هذه الباقات 60-85 مؤشراً
          حيوياً وتمثل أفضل توازن بين القيمة والشمولية.
        </p>
      </div>
      {standardPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {standardPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted mb-12">لا توجد باقات في هذه الفئة حالياً.</p>
      )}

      {/* Premium Packages */}
      <div className="section-header">
        <h2>الباقات المتميزة والتنفيذية — {formatPrice(PREMIUM_MIN)} فأكثر</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          تمتد الباقات المتميزة والتنفيذية لتشمل — إضافةً إلى فحص العافية القياسي —
          مؤشرات خطر القلب المتقدمة (CRP عالي الحساسية وتروبونين وBNP) وعلامات
          السرطان (PSA للرجال وCA-125 للنساء وCEA) ولوحات الهرمونات وفحص الحساسية
          وتحليل البراز. هذه الباقات التي تغطي 120 إلى أكثر من 150 مؤشراً مناسبة
          لمن تجاوزوا الأربعين وأصحاب التاريخ العائلي بالأورام أو أمراض القلب
          والمديرين التنفيذيين الذين يتضمن عقدهم فحصاً صحياً شاملاً.
          تضيف معايير التشخيص الأوروبية لـ Unilabs وشراكة Al Borg مع Quest Diagnostics
          اعتماداً دولياً لهذه الفئة.
        </p>
      </div>
      {premiumPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {premiumPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted mb-12">لا توجد باقات في هذه الفئة حالياً.</p>
      )}

      {/* Women's Health Packages */}
      <div className="section-header">
        <h2>باقات صحة المرأة</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          تشمل باقات صحة المرأة إضافات خاصة بالجنس تتخطى فحص العافية القياسي:
          الهرمونات التناسلية (FSH وLH والإستراديول والبرولاكتين) واحتياطي
          المبيض (AMH) والفولات (ضروري لتخطيط الحمل) ووظائف الغدة الدرقية
          (أمراض الغدة الدرقية أكثر شيوعاً في النساء بـ 5-8 أضعاف). يُنصح
          بهذه اللوحات سنوياً للنساء من سن الخامسة والعشرين، وهي قيّمة بشكل
          خاص لمن يخططن للحمل أو يعانين من اضطرابات الدورة الشهرية أو
          يقتربن من مرحلة ما قبل انقطاع الطمث.
        </p>
      </div>
      {womensPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {womensPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div className="bg-light-50 border border-light-200 p-5 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <p className="text-sm font-bold text-dark">فحص صحة المرأة</p>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            تقدم عدة مختبرات باقات صحة المرأة التي تشمل هرمونات الخصوبة والمؤشرات
            التناسلية إلى جانب لوحة العافية القياسية. تغطي باقة Medsol لصحة المرأة
            (399 درهم، 82 مؤشراً) فحوصات FSH والإستراديول والبرولاكتين وAMH
            والفولات ولوحة الغدة الدرقية الكاملة. تصفح ملفات المختبرات الفردية
            للاطلاع على عروضهم الحالية لصحة المرأة.
          </p>
          <Link href="/ar/labs" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark transition-colors">
            تصفح جميع المختبرات <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Package vs Individual — savings analysis */}
      <div className="section-header">
        <h2>الباقة مقابل الفحوصات الفردية — أيهما يوفر أكثر؟</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed">
          توفر الباقات باستمرار 30-50% مقارنةً بطلب الفحوصات ذاتها فردياً في
          نفس المختبر. يتضاعف التوفير كلما ارتفعت درجة تعقيد الباقة. إليك مثالاً
          ملموساً باستخدام باقة العافية الشاملة من Al Borg Diagnostics:
        </p>
      </div>

      {comprehensiveExample && (
        <div className="border border-light-200 mb-6 overflow-x-auto">
          <div className="p-4 bg-light-50 border-b border-light-200">
            <p className="text-sm font-bold text-dark">
              Al Borg Diagnostics — العافية الشاملة (باقة 499 درهم مقابل الفحوصات الفردية)
            </p>
            <p className="text-xs text-muted mt-1">
              {comprehensiveExample.biomarkerCount} مؤشراً عبر{" "}
              {comprehensiveExample.testSlugs.length} لوحات فحص
            </p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-light-50">
                <th className="text-right p-3 font-bold text-dark border-b border-light-200">الفحص</th>
                <th className="text-left p-3 font-bold text-dark border-b border-light-200">السعر الفردي (درهم)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "CBC (تعداد الدم الكامل)", price: 85 },
                { name: "لوحة الدهون", price: 110 },
                { name: "جلوكوز الصيام", price: 40 },
                { name: "HbA1c", price: 80 },
                { name: "وظائف الكبد", price: 90 },
                { name: "وظائف الكلى", price: 90 },
                { name: "لوحة الغدة الدرقية (T3 وT4 وTSH)", price: 180 },
                { name: "فيتامين D", price: 120 },
                { name: "فيتامين B12", price: 110 },
                { name: "دراسات الحديد", price: 180 },
                { name: "تحليل البول", price: 40 },
              ].map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-light-50"}>
                  <td className="p-3 border-b border-light-200 text-dark">{row.name}</td>
                  <td className="p-3 border-b border-light-200 text-left text-dark font-medium">
                    {row.price}
                  </td>
                </tr>
              ))}
              <tr className="bg-light-50 font-bold">
                <td className="p-3 border-b border-light-200 text-dark">
                  الإجمالي عند طلب الفحوصات فردياً
                </td>
                <td className="p-3 border-b border-light-200 text-left text-dark">825</td>
              </tr>
              <tr className="bg-accent-muted">
                <td className="p-3 text-dark font-bold">
                  سعر باقة العافية الشاملة
                </td>
                <td className="p-3 text-left font-bold text-accent text-base">499</td>
              </tr>
            </tbody>
          </table>
          <div className="p-4 bg-light-50 border-t border-light-200 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-accent flex-shrink-0" />
            <p className="text-sm font-bold text-dark">
              توفر الباقة 326 درهماً —{" "}
              <span className="text-accent">خصم 39%</span> مقارنةً بالطلب
              الفردي في نفس المختبر.
            </p>
          </div>
        </div>
      )}

      <div className="bg-light-50 border border-light-200 p-5 mb-12">
        <div className="flex items-start gap-3">
          <Wallet className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              متى تكون الفحوصات الفردية أوفر من الباقات؟
            </p>
            <p className="text-xs text-muted leading-relaxed">
              تكون الباقات الأفضل قيمةً حين تحتاج إلى معظم الفحوصات المدرجة فيها.
              إن كنت بحاجة إلى فحص أو فحصين فقط — كمتابعة مستوى فيتامين D بعد
              ثلاثة أشهر من بدء المكملات، أو قياس HbA1c لمراقبة السكري —
              فطلب الفحص الفردي أوفر من شراء الباقة الكاملة. تقدم مختبرات
              كـ Medsol CBC منفرداً من AED 69 وفيتامين D من AED 85 —
              مما يجعل المتابعة الدورية بفحص واحد ميسورة التكلفة دون الحاجة
              لشراء باقة.
            </p>
          </div>
        </div>
      </div>

      {/* Compare by Lab */}
      <div className="section-header">
        <h2>مقارنة الباقات حسب المختبر</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          يُموضع كل مختبر باقاته بأسلوب مختلف. تستهدف Medsol المرضى المهتمين
          بالتكلفة. تقدم Thumbay قيمةً متوسطة ممتازة. توفر Al Borg أوسع نطاق
          من الباقات من الأساسية إلى التنفيذية. تتخصص Unilabs في التشخيص
          المتميز وفق المعايير الأوروبية. تضيف DarDoc ميزة الجمع المنزلي ضمن
          سعر الباقة.
        </p>
      </div>
      <div className="space-y-6 mb-12">
        {packagesByLab.map(({ lab, packages }) => (
          <div key={lab.slug} className="border border-light-200">
            {/* Lab header */}
            <div className="p-4 bg-light-50 border-b border-light-200 flex items-center justify-between">
              <div>
                <Link
                  href={`/labs/${lab.slug}`}
                  className="font-bold text-dark hover:text-accent transition-colors text-sm"
                >
                  {lab.name}
                </Link>
                <p className="text-[11px] text-muted mt-0.5">{lab.description.slice(0, 100)}…</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {lab.homeCollection && (
                  <span className="text-[10px] bg-accent-muted text-accent-dark px-2 py-0.5 font-bold">
                    {lab.homeCollectionFee === 0 ? "جمع منزلي (مجاني)" : `جمع منزلي (AED ${lab.homeCollectionFee})`}
                  </span>
                )}
                <Link
                  href={`/labs/${lab.slug}`}
                  className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark transition-colors"
                >
                  عرض المختبر <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Package tiers for this lab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg, i) => (
                <div
                  key={pkg.id}
                  className={`p-4 ${i < packages.length - 1 ? "border-b sm:border-b-0 sm:border-r border-light-200" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-dark">{pkg.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{pkg.targetAudience}</p>
                    </div>
                    {pkg.price < BUDGET_MAX && (
                      <span className="text-[9px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-bold flex-shrink-0">
                        اقتصادية
                      </span>
                    )}
                    {pkg.price >= PREMIUM_MIN && (
                      <span className="text-[9px] bg-light-100 text-dark px-1.5 py-0.5 font-bold border border-light-200 flex-shrink-0">
                        متميزة
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-dark">{formatPrice(pkg.price)}</p>
                  <p className="text-[11px] text-muted mb-2">{pkg.biomarkerCount} مؤشراً حيوياً</p>
                  <div className="space-y-1">
                    {pkg.includes.slice(0, 3).map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-[11px] text-dark">
                        <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                    {pkg.includes.length > 3 && (
                      <p className="text-[10px] text-muted">
                        +{pkg.includes.length - 3} فحوصات إضافية مشمولة
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pkg.suitableFor.map((s) => (
                      <span key={s} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5">
                        {s === "all" ? "رجال ونساء" : s === "male" ? "رجال" : "نساء"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Choosing guide */}
      <div className="section-header">
        <h2>أي باقة تناسبك؟</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-2">
          تعتمد الباقة المناسبة على عمرك وتاريخك الصحي وميزانيتك. يطابق هذا
          الدليل السريع الملفات الشائعة مع الفئات المناسبة:
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {[
          {
            icon: Wallet,
            profile: "مهتم بالتكلفة، دون الـ 35، بدون أعراض",
            recommendation: "Medsol Budget Health Check — AED 99",
            details:
              "تغطي الفحوصات الخمسة الأساسية. كافية للبالغ الشاب الصحيح الراغب في كشف ما قبل التوظيف أو الفحص السنوي الروتيني. أضف فيتامين D منفرداً (AED 85) نظراً لانتشار نقصه في الإمارات.",
          },
          {
            icon: FlaskConical,
            profile: "مقيم في الإمارات عمره 30-50، يريد فحصاً سنوياً شاملاً",
            recommendation: "Thumbay Wellness Plus — AED 349 (72 مؤشراً)",
            details:
              "أفضل باقة شاملة من حيث القيمة في هذا الدليل. تغطي الفيتامينات والغدة الدرقية ومؤشرات السكري ووظائف الأعضاء الكاملة. خدمة الجمع المنزلي مجانية.",
          },
          {
            icon: Users,
            profile: "امرأة تخطط للحمل أو لديها اضطرابات في الدورة الشهرية",
            recommendation: "Medsol Women's Health Panel — AED 399 (82 مؤشراً)",
            details:
              "تشمل FSH والإستراديول والبرولاكتين وAMH (احتياطي المبيض) والفولات ولوحة الغدة الدرقية والحديد وجميع مؤشرات العافية الأساسية. خط أساسي مناسب سريرياً قبل الحمل.",
          },
          {
            icon: Star,
            profile: "فوق الـ 50، تاريخ عائلي بأمراض القلب أو السرطان",
            recommendation: "Al Borg Executive Health Screen — AED 899 (120 مؤشراً)",
            details:
              "يضيف CRP للقلب وPSA (رجال) أو CA-125 (نساء) وCEA (مؤشر سرطان القولون) وتحليل البراز فوق اللوحة الشاملة الكاملة. معتمد من CAP وJCI.",
          },
          {
            icon: Shield,
            profile: "تنفيذي يريد تشخيصاً متميزاً وفق المعايير الأوروبية",
            recommendation: "Unilabs Executive Diagnostics — AED 999 (150 مؤشراً)",
            details:
              "الباقة الأكثر شمولاً في الإمارات. معتمدة من UKAS وCAP وISO 15189. تشمل تروبونين القلب وBNP ولوحة علامات السرطان الكاملة ومراجعة علم الأمراض المتقدمة.",
          },
          {
            icon: Clock,
            profile: "محترف مشغول لا يريد مغادرة المنزل أو المكتب",
            recommendation: "DarDoc At-Home Comprehensive — AED 449 (78 مؤشراً)",
            details:
              "لوحة عافية كاملة مع ممرضة مرخصة من DHA تزور موقعك. الجمع المنزلي مشمول في السعر. النتائج رقمياً خلال 24 ساعة. احجز عبر التطبيق.",
          },
        ].map(({ icon: Icon, profile, recommendation, details }) => (
          <div key={profile} className="border border-light-200 p-4 hover:border-accent transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <Icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-muted uppercase tracking-wide">{profile}</p>
            </div>
            <p className="text-sm font-bold text-dark mb-2">{recommendation}</p>
            <p className="text-xs text-muted leading-relaxed">{details}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="باقات الفحص الصحي في الإمارات — الأسئلة الشائعة"
      />

      {/* Browse more links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/ar/labs",
            label: "جميع مختبرات الإمارات",
            sublabel: `قارن الأسعار عبر ${stats.totalLabs} مختبر`,
          },
          {
            href: "/labs/home-collection",
            label: "خدمة الجمع المنزلي",
            sublabel: `${stats.labsWithHomeCollection} مختبر يصل إلى باب منزلك`,
          },
          {
            href: "/labs/category/blood-routine",
            label: "فحوصات الدم الفردية",
            sublabel: "قارن CBC ولوحة الدهون والجلوكوز وغيرها",
          },
        ].map(({ href, label, sublabel }) => (
          <Link
            key={href}
            href={href}
            className="border border-light-200 p-4 hover:border-accent transition-colors group flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {label}
              </p>
              <p className="text-xs text-muted mt-0.5">{sublabel}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> أسعار الباقات مستندة إلى التسعير المتاح
          للعموم من مواقع المختبرات ومنصات التجميع (2024-2025). قد تتباين الأسعار
          الفعلية بحسب موقع الفرع والتغطية التأمينية والعروض الترويجية والعروض
          الموسمية. تقارن حسابات التوفير أسعار الباقات بأسعار الفحوصات الفردية
          المدرجة في نفس المختبر وهي استرشادية فقط. لا يُقدّم هذا الدليل نصائح
          طبية. استشر طبيبك لتحديد الفحص الصحي الملائم لظروفك الفردية.
          جميع المختبرات المدرجة مرخصة من DHA أو DOH أو MOHAP.
          آخر تحقق مارس 2026.
        </p>
      </div>

      {/* Language Switch */}
      <div className="text-center pt-4 pb-8">
        <Link href="/labs/packages" className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
