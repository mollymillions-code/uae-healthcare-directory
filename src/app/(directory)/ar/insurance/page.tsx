import { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanBrowser } from "@/components/insurance/PlanBrowser";
import { InsuranceQuiz } from "@/components/insurance/InsuranceQuiz";
import {
  INSURER_PROFILES,
  getAllInsurerNetworkStats,
} from "@/lib/insurance";
import { getCities, getProviderCountByCity } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, medicalWebPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "دليل التأمين الصحي في الإمارات — قارن الخطط والتغطية وشبكات مقدمي الخدمة | الدليل الصحي المفتوح",
    description:
      "قارن خطط التأمين الصحي في الإمارات جنباً إلى جنب. تفاصيل التغطية والأقساط والاشتراك والأسنان والأمومة وأحجام شبكات مقدمي الخدمة لدى Daman وThiqa وAXA وCigna وBupa وغيرها. اعثر على الخطة المناسبة لميزانيتك واحتياجاتك.",
    alternates: {
      canonical: `${base}/ar/insurance`,
      languages: {
        "en-AE": `${base}/insurance`,
        "ar-AE": `${base}/ar/insurance`,
      },
    },
    openGraph: {
      title: "دليل التأمين الصحي في الإمارات — قارن الخطط والشبكات",
      description: "قارن أكثر من 80 خطة تأمين صحي عبر 38 شركة تأمين إماراتية. التغطية والأقساط وأحجام الشبكات ومحدد الخطة الشخصي.",
      url: `${base}/ar/insurance`,
      type: "website",
    },
  };
}

export default async function ArabicInsuranceNavigatorPage() {
  const base = getBaseUrl();
  const allStats = await getAllInsurerNetworkStats();
  const totalPlans = INSURER_PROFILES.reduce((sum, p) => sum + p.plans.length, 0);
  const totalProviders = allStats.reduce((sum, s) => sum + s.totalProviders, 0);

  // بيانات التأمين حسب المدينة — أفضل 3 شركات تأمين حسب حجم الشبكة لكل مدينة
  const cities = getCities();
  const cityInsuranceData = await Promise.all(cities
    .map(async (city) => {
      const providerCount = await getProviderCountByCity(city.slug);
      const topInsurers = allStats
        .map((s) => {
          const cityBreakdown = s.byCity.find((b) => b.citySlug === city.slug);
          return { name: s.name, slug: s.slug, count: cityBreakdown?.providerCount ?? 0 };
        })
        .filter((i) => i.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      return { city, providerCount, topInsurers };
    }));
  const filteredCityInsuranceData = cityInsuranceData.filter((d) => d.providerCount > 0 && d.topInsurers.length > 0);

  const arabicCityNames: Record<string, string> = {
    dubai: "دبي",
    "abu-dhabi": "أبوظبي",
    sharjah: "الشارقة",
    ajman: "عجمان",
    "ras-al-khaimah": "رأس الخيمة",
    fujairah: "الفجيرة",
    "umm-al-quwain": "أم القيوين",
    "al-ain": "العين",
  };

  const faqs = [
    {
      question: "هل التأمين الصحي إلزامي في الإمارات؟",
      answer:
        "نعم. التأمين الصحي إلزامي لجميع المقيمين في أبوظبي (منذ عام 2006) ودبي (منذ عام 2014). وتسير الإمارات الأخرى في مسار التطبيق التدريجي لأنظمة التأمين الإلزامي تحت إشراف وزارة الصحة ووقاية المجتمع (MOHAP). يُلزَم أصحاب العمل بتوفير التأمين الصحي لموظفيهم، وفي كثير من الحالات للمُعالين أيضاً.",
    },
    {
      question: "ما أرخص خطط التأمين الصحي في الإمارات؟",
      answer:
        "تبدأ أقل الخطط تكلفةً من نحو 600–750 درهماً سنوياً لخطة Daman Basic (المخصصة للإقامة الإلزامية في أبوظبي)، ومن 2,200–2,800 درهم سنوياً للخطط الأساسية المتوافقة مع DHA في دبي. تشمل هذه الخطط الرعاية التنويمية والعلاج الخارجي والطوارئ، غير أنها تستثني عادةً الأسنان والبصريات والأمومة.",
    },
    {
      question: "ما الذي يشمله التأمين الصحي عادةً في الإمارات؟",
      answer:
        "تُلزَم جميع الخطط المتوافقة مع DHA/HAAD بتغطية التنويم في المستشفيات، والزيارات الخارجية، والعلاج الطارئ، والأدوية الموصوفة، والأمومة (مع فترات انتظار)، والرعاية الوقائية. أما الخطط المحسّنة والمميزة فتُضيف تغطية الأسنان والبصريات والصحة النفسية والطب البديل والتغطية الدولية.",
    },
    {
      question: "كيف أختار بين شركات التأمين في الإمارات؟",
      answer:
        "عليك مراعاة: (1) حجم الشبكة — كم عدد المستشفيات والعيادات التي تقبل الخطة في مدينتك، (2) التغطية — الأسنان والأمومة والبصريات والصحة النفسية، (3) نسبة الاشتراك — ما تدفعه من كل زيارة، (4) الحد السنوي — الحد الأقصى الذي تدفعه شركة التأمين سنوياً، (5) القسط — التكلفة السنوية. استخدم أداة مقارنة الخطط أعلاه للمقارنة جنباً إلى جنب.",
    },
    {
      question: "هل يمكنني استخدام تأميني الصحي في إمارات مختلفة؟",
      answer:
        "يعتمد ذلك على الخطة. قد تقتصر الخطط الأساسية الصادرة عن DHA أو HAAD على مقدمي الخدمة في الإمارة المعنية. في المقابل، تُوفر الخطط المحسّنة والمميزة من شركات التأمين الوطنية كـ AXA وCigna وBupa وOman Insurance تغطيةً شاملة لجميع مدن الإمارات.",
    },
    {
      question: "ماذا يحدث إذا لم يُغطِّ تأميني علاجاً معيناً؟",
      answer:
        "إذا استُثني علاج ما من خطتك، تتوفر لديك عدة خيارات: (1) الدفع من جيبك الخاص مباشرةً لمقدم الخدمة، (2) طلب استثناء من خلال التفويض المسبق مع خطاب داعم من طبيبك، (3) الاعتراض خطياً خلال 30 يوماً — إذ تُلزم كل من DHA وDOH شركات التأمين بوجود إجراءات رسمية للتظلم، (4) التصعيد إلى مركز شكاوى DHA (دبي) أو DOH (أبوظبي) إذا جاء رد الشركة غير مُرضٍ. كما تُتيح بعض الخطط ملاحق إضافية (مضافات) قابلة للشراء لتغطية العلاجات المستثناة كالأورام أو العلاج الطبيعي أو جراحة السمنة.",
    },
    {
      question: "هل يمكنني تغيير شركة التأمين الصحي في الإمارات؟",
      answer:
        "نعم، غير أن التوقيت والإجراء يختلفان بحسب وضعك. يحق للموظفين طلب تغيير الخطة عند التجديد بموافقة صاحب العمل. أما المقيمون الكفلاء لأنفسهم فيمكنهم التحويل في أي وقت بشراء وثيقة جديدة وإلغاء القديمة، وإن كانت الحالات الصحية السابقة قد تخضع لفترات انتظار في الخطة الجديدة. وفي دبي، تشترط DHA استمرارية التغطية دون أي فجوة زمنية بين إلغاء الوثيقة القديمة وتفعيل الجديدة. عند التحويل، تحقق من أن شبكة الخطة الجديدة تشمل مستشفياتك المفضلة، وتأكد من أن أي علاجات جارية لها استمرارية تغطية.",
    },
    {
      question: "ما الفرق بين شركة التأمين ومدير المطالبات (TPA)؟",
      answer:
        "شركة التأمين الصحي هي من تتحمل المخاطرة وتكون مسؤولة مالياً عن سداد المطالبات. أما مدير المطالبات من طرف ثالث (TPA) فهو شركة متخصصة تتولى الجانب التشغيلي — معالجة المطالبات وإدارة التفويضات المسبقة والحفاظ على شبكات مقدمي الخدمة وخدمة الأعضاء — نيابةً عن شركة التأمين. وتشمل كبرى شركات TPA في الإمارات: NAS وNextcare وMednet. حين تزور عيادةً، قد تتعامل مع بطاقة وشبكة TPA حتى لو كانت شركة التأمين الفعلية هي Oman Insurance أو Al Sagr مثلاً. معرفة جهة TPA الخاصة بك أمر مفيد لأنها تُمثل نقطة الاتصال الأولى في نزاعات المطالبات والموافقات المسبقة.",
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: "دليل التأمين الصحي" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={medicalWebPageSchema(
        "دليل التأمين الصحي في الإمارات",
        `قارن ${totalPlans} خطة تأمين صحي عبر ${INSURER_PROFILES.length} شركة تأمين إماراتية، مرتبطة بـ ${totalProviders.toLocaleString()} مقدم رعاية صحية.`,
        "2026-03-25"
      )} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "دليل التأمين الصحي" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            دليل التأمين الصحي في الإمارات
          </h1>
        </div>
        <p className="text-sm text-muted mb-2">قارن الخطط والتغطية وشبكات مقدمي الخدمة</p>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            قارن {totalPlans} خطة تأمين صحي عبر {INSURER_PROFILES.length} شركة تأمين إماراتية — مرتبطة بـ{" "}
            {totalProviders.toLocaleString()} مقدم رعاية صحية في دليلنا. صفّح حسب التغطية والقسط ونسبة الاشتراك وحجم الشبكة. اكتشف شركات التأمين التي تغطي مستشفياتك وعياداتك المفضلة، وقارن الخطط جنباً إلى جنب.
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: INSURER_PROFILES.length.toString(), label: "شركات التأمين" },
            { value: totalPlans.toString(), label: "خطط مقارنة" },
            { value: totalProviders.toLocaleString(), label: "مقدم خدمة مرتبط" },
            { value: "8", label: "مدن إماراتية" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* كيف يعمل التأمين الصحي في الإمارات */}
      <div className="section-header">
        <h2>كيف يعمل التأمين الصحي في الإمارات</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-12" data-answer-block="true">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* بطاقة 1 — التغطية الإلزامية */}
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">التغطية الإلزامية</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              التأمين الصحي إلزامي لجميع المقيمين في الإمارات. كانت أبوظبي أولى الإمارات التي أوجبت التأمين المدعوم من صاحب العمل عام{" "}
              <strong>2006</strong> تحت مظلة نظام HAAD (الذي أصبح DOH حالياً)، تبعتها دبي عام{" "}
              <strong>2014</strong> بموجب قانون التأمين الصحي الإلزامي الصادر عن DHA.
              وتسير الإمارات الشمالية — الشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين — في مسار التطبيق التدريجي تحت الإشراف الاتحادي لـ{" "}
              <strong>MOHAP</strong>.
              يتعرض أصحاب العمل الذين لا يوفرون التغطية لغرامات وقيود على تجديد التأشيرات.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">أبوظبي: منذ 2006</span>
              <span className="badge">دبي: منذ 2014</span>
              <span className="badge">الإمارات الأخرى: مراحل تدريجية</span>
            </div>
          </div>

          {/* بطاقة 2 — آلية عمل الخطط */}
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">آلية عمل الخطط</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              يحصل معظم المقيمين على تأمين مدعوم من صاحب العمل، حيث يدفع صاحب العمل القسط السنوي مباشرةً لشركة التأمين. عند زيارة مقدم خدمة، تُقدّم بطاقتك التأمينية وتدفع{" "}
              <strong>نسبة الاشتراك</strong> (عادةً 10–20% من تكلفة الاستشارة أو العلاج) حتى حد معين لكل زيارة. تتحمل شركة التأمين الباقي حتى{" "}
              <strong>الحد السنوي</strong> للخطة — الذي يتراوح بين 150,000 درهم للخطط الأساسية ومليون درهم فأكثر للخطط المميزة. غالباً ما تستلزم الإقامة في المستشفى{" "}
              <strong>موافقةً مسبقة</strong> من شركة التأمين قبل العلاج. تُعالَج المطالبات إما عبر الفوترة المباشرة بين مقدم الخدمة والشركة، أو بالسداد المسترد لك بعد دفعك.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">صاحب العمل يدفع القسط</span>
              <span className="badge">اشتراك 10–20%</span>
              <span className="badge">حدود سنوية سارية</span>
            </div>
          </div>

          {/* بطاقة 3 — اختيار الخطة */}
          <div className="border border-black/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">اختيار الخطة المناسبة</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              أهم عامل على الإطلاق هو <strong>حجم الشبكة</strong> — عدد المستشفيات والعيادات في مدينتك التي تقبل الخطة مباشرةً. الشبكة الواسعة تعني مفاجآت أقل في الدفع من جيبك. ثانياً، تحقق من{" "}
              <strong>نسبة الاشتراك</strong>: الفرق بين 10% و20% يتراكم بسرعة عند الزيارات الخارجية المتكررة. ثالثاً، انظر في الميزات الاختيارية:{" "}
              <strong>الأسنان والبصريات</strong> مستثناة من معظم الخطط الأساسية لكنها متاحة كمضافات أو في المستويات المحسّنة. للعائلات أو المرأة المخططة للإنجاب، تأكد من{" "}
              <strong>تغطية الأمومة</strong> وفترة الانتظار (عادةً 6–12 شهراً). وأخيراً، إن كنت كثير السفر، فتحقق مما إذا كانت الخطة تشمل{" "}
              <strong>التغطية الدولية</strong> الطارئة أو الاختيارية.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">1. حجم الشبكة</span>
              <span className="badge">2. نسبة الاشتراك</span>
              <span className="badge">3. الأسنان والبصريات</span>
            </div>
          </div>
        </div>
      </div>

      {/* شركات التأمين */}
      <div className="section-header">
        <h2>شركات التأمين الرئيسية</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {INSURER_PROFILES.map((insurer) => {
          const stats = allStats.find((s) => s.slug === insurer.slug);
          return (
            <Link
              key={insurer.slug}
              href={`/insurance/${insurer.slug}`}
              className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {insurer.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
              </div>
              <p className="text-[11px] text-muted">
                {insurer.plans.length} {insurer.plans.length === 1 ? "خطة" : "خطط"} ·{" "}
                {stats ? `${stats.totalProviders.toLocaleString()} مقدم خدمة` : "بيانات الشبكة"}
              </p>
              <span className="badge text-[9px] mt-2">{insurer.type}</span>
            </Link>
          );
        })}
      </div>

      {/* التأمين حسب المدينة */}
      <div className="section-header">
        <h2>التأمين حسب المدينة</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        تتفاوت تغطية شبكات التأمين تفاوتاً ملحوظاً بين الإمارات. تصفح مقدمي الخدمة وأبرز شركات التأمين أداءً في كل مدينة إماراتية.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {filteredCityInsuranceData.map(({ city, providerCount, topInsurers }) => (
          <Link
            key={city.slug}
            href={`/directory/${city.slug}/insurance`}
            className="border border-black/[0.06] p-4 hover:border-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {arabicCityNames[city.slug] || city.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
            </div>
            <p className="text-xs text-muted mb-3">
              {providerCount.toLocaleString()} مقدم خدمة
            </p>
            <div className="space-y-1">
              {topInsurers.map((ins, idx) => (
                <div key={ins.slug} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-muted w-3 flex-shrink-0">#{idx + 1}</span>
                  <span className="text-[11px] text-dark truncate">{ins.name}</span>
                  <span className="text-[9px] text-muted ml-auto flex-shrink-0">{ins.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* محدد الخطة */}
      <div className="section-header">
        <h2>اعثر على خطتك المناسبة</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-12 bg-light-50 p-6 border border-black/[0.06]">
        <p className="text-xs text-muted mb-4">
          أجب على بضعة أسئلة وسنوصي بخطط تتناسب مع ميزانيتك واحتياجات تغطيتك ومدينتك المفضلة.
        </p>
        <InsuranceQuiz />
      </div>

      {/* متصفح جميع الخطط */}
      <div className="section-header">
        <h2>قارن جميع الخطط</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        تصفح جميع الـ {totalPlans} خطة. استخدم مربعات الاختيار لتحديد ما يصل إلى 4 خطط للمقارنة جنباً إلى جنب.
      </p>
      <PlanBrowser />

      {/* الأسئلة الشائعة */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="التأمين الصحي في الإمارات — الأسئلة الشائعة" />
      </div>

      {/* الجهات التنظيمية */}
      <div className="mt-12">
        <div className="section-header">
          <h2>جهات تنظيم التأمين الصحي في الإمارات</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="answer-block" data-answer-block="true">
          <p className="text-xs text-muted mb-4">
            يخضع التأمين الصحي في الإمارات للتنظيم على مستوى الإمارة والمستوى الاتحادي. وتُشرف ثلاث جهات على غالبية المؤمَّن عليهم:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* DHA */}
            <div className="bg-light-50 border border-black/[0.06] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">دبي</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">هيئة الصحة بدبي (DHA)</h3>
              <p className="text-xs text-muted leading-relaxed">
                تنظّم DHA جميع أنشطة التأمين الصحي في إمارة دبي، بما يشمل ترخيص شركات التأمين ومديري المطالبات (TPA)، وتحديد الهياكل التعاقدية الإلزامية، وإدارة خطة <strong>سعادة</strong> للمنافع الأساسية لذوي الدخل المحدود. يجب أن تلتزم جميع منتجات التأمين الصحي المباعة في دبي بخطة المنافع الأساسية (EBP) الصادرة عن DHA كحد أدنى. كما تُشغّل DHA منصة دبي الإلكترونية الموحدة لتجارة التأمين (DEUPT) للإفصاح عن بيانات التأمين.
              </p>
            </div>
            {/* DOH */}
            <div className="bg-light-50 border border-black/[0.06] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">أبوظبي</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">دائرة الصحة - أبوظبي (DOH)</h3>
              <p className="text-xs text-muted leading-relaxed">
                خلفاً لهيئة الصحة بأبوظبي (HAAD)، تُشرف DOH على تنظيم الرعاية الصحية والتأمين الإلزامي في أبوظبي والعين. وتُدير <strong>Daman</strong> (الشركة الوطنية للتأمين الصحي) التابعة لـ DOH نظام <strong>Thiqa</strong> للمواطنين الإماراتيين وخطة <strong>Basic</strong> للمقيمين الأجانب. تضع DOH معايير المنافع الدنيا وتُجري عمليات تدقيق سنوية على جميع منتجات التأمين العاملة في الإمارة.
              </p>
            </div>
            {/* MOHAP */}
            <div className="bg-light-50 border border-black/[0.06] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">اتحادي</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">وزارة الصحة ووقاية المجتمع (MOHAP)</h3>
              <p className="text-xs text-muted leading-relaxed">
                تعمل MOHAP بوصفها الجهة الصحية الاتحادية المشرفة على الإمارات الشمالية — الشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين — فضلاً عن رسم السياسة الصحية الوطنية. وبينما تمتلك دبي وأبوظبي جهازيهما التنظيميين الخاصين، تُنسّق MOHAP المعايير عبر الإمارات، وتُشرف على تطوير التأمين الصحي في إمارات خارج نطاق DHA/DOH، وتُدير نظام التبادل الصحي الاتحادي <strong>ملفّي</strong>. يتعين على شركات التأمين العاملة في أكثر من إمارة استيفاء متطلبات إعداد التقارير لكل من الجهة التنظيمية في الإمارة المعنية ومتطلبات MOHAP.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            المصدر: تعميم DHA رقم 16/2013 (التأمين الإلزامي في دبي)، قرار DOH رقم 1/2014 (تحديثات أبوظبي)، التفويض الاتحادي لـ MOHAP 2023.
          </p>
        </div>
      </div>

      {/* إخلاء المسؤولية */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> نطاقات الأقساط وتفاصيل التغطية المعروضة هي أرقام استرشادية مستندة إلى بيانات متاحة للعموم من سوق التأمين الإماراتي. تتباين الأقساط الفعلية بحسب العمر والجنسية ونوع الإقامة وحجم مجموعة صاحب العمل والتاريخ الطبي. احرص دائماً على الحصول على عرض سعر شخصي من شركة التأمين أو وسيط معتمد قبل الشراء. هذه الأداة لأغراض معلوماتية فحسب ولا تُشكّل نصيحة تأمينية. البيانات مُصادَرة من الدليل الصحي المفتوح في الإمارات، آخر تحقق مارس 2026.
        </p>
      </div>

      {/* رابط التبديل إلى الإنجليزية */}
      <div className="text-center pt-6 pb-4">
        <Link href="/insurance" className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
