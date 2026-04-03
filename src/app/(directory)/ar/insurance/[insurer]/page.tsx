import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Globe } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanCard } from "@/components/insurance/PlanCard";
import { NetworkStats } from "@/components/insurance/NetworkStats";
import {
  INSURER_PROFILES,
  getInsurerProfile,
  getInsurerNetworkStats,
  getAllInsurerNetworkStats,
  formatPremium,
  formatLimit,
  getTierLabel,
} from "@/lib/insurance";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { insurer: string };
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = getInsurerProfile(params.insurer);
  if (!profile) return {};
  const base = getBaseUrl();
  const stats = await getInsurerNetworkStats(params.insurer);

  return {
    title: `${profile.name} للتأمين الصحي في الإمارات — الخطط والتغطية وشبكة ${stats?.totalProviders.toLocaleString() || ""} مقدم خدمة`,
    description: `قارن خطط التأمين الصحي من ${profile.name} في الإمارات. ${profile.plans.length} خطة تبدأ من ${formatPremium(profile.plans[0]?.premiumRange || { min: 0, max: 0 })}. تفاصيل التغطية والاشتراك وطب الأسنان والأمومة وشبكة تضم ${stats?.totalProviders.toLocaleString() || "0"} مقدم خدمة في ${stats?.byCity.length || 0} مدينة. ${profile.keyFacts[0]}`,
    alternates: {
      canonical: `${base}/ar/insurance/${profile.slug}`,
      languages: {
        "en-AE": `${base}/insurance/${profile.slug}`,
        "ar-AE": `${base}/ar/insurance/${profile.slug}`,
      },
    },
    openGraph: {
      title: `${profile.name} للتأمين الصحي — الخطط وشبكة مقدمي الخدمة`,
      description: `${profile.plans.length} خطة، ${stats?.totalProviders.toLocaleString()} مقدم خدمة. قارن التغطية والأقساط واعثر على العيادات التي تقبل ${profile.name}.`,
      url: `${base}/ar/insurance/${profile.slug}`,
      type: "website",
    },
  };
}

export default async function ArabicInsurerDetailPage({ params }: Props) {
  const profile = getInsurerProfile(params.insurer);
  if (!profile) notFound();

  const stats = await getInsurerNetworkStats(params.insurer);
  const base = getBaseUrl();

  const cheapestPlan = [...profile.plans].sort(
    (a, b) => a.premiumRange.min - b.premiumRange.min
  )[0];

  const faqs = [
    {
      question: `ما خطط التأمين الصحي التي تقدمها ${profile.name} في الإمارات؟`,
      answer: `تقدم ${profile.name} ${profile.plans.length} خطة تأمين صحي${profile.plans.length !== 1 ? "" : ""} في الإمارات: ${profile.plans.map((p) => p.name).join("، ")}. تتراوح الأقساط بين ${formatPremium(profile.plans[0]?.premiumRange || { min: 0, max: 0 })} و${formatPremium(profile.plans[profile.plans.length - 1]?.premiumRange || { min: 0, max: 0 })} سنوياً.`,
    },
    {
      question: `كم عدد مقدمي الرعاية الصحية الذين يقبلون تأمين ${profile.name}؟`,
      answer: `وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، يقبل ${stats?.totalProviders.toLocaleString() || "عدد من"} مقدمي الرعاية الصحية عبر ${stats?.byCity.length || "عدة"} مدن إماراتية تأمين ${profile.name}. ويشمل ذلك المستشفيات والعيادات وعيادات طب الأسنان والمراكز المتخصصة.`,
    },
    {
      question: `هل تغطي ${profile.name} طب الأسنان والأمومة؟`,
      answer: `تعتمد تغطية الأسنان والأمومة على مستوى الخطة. ${profile.plans.some((p) => p.coverage.dental) ? `نعم، تشمل خطط ${profile.name} المحسّنة والمميزة تغطية طب الأسنان.` : `لا تشمل الخطط الأساسية عادةً تغطية الأسنان.`} ${profile.plans.some((p) => p.coverage.maternity) ? `تُغطى الأمومة مع فترات انتظار تتراوح بين ${Math.min(...profile.plans.filter((p) => p.maternityWaitMonths >= 0).map((p) => p.maternityWaitMonths))} و${Math.max(...profile.plans.filter((p) => p.maternityWaitMonths >= 0).map((p) => p.maternityWaitMonths))} شهراً.` : ""}`,
    },
    {
      question: `هل ${profile.name} متوافقة مع DHA أو HAAD؟`,
      answer: `تخضع ${profile.name} لتنظيم ${profile.regulators.map((r) => r.toUpperCase()).join(" و")}. ${profile.regulators.includes("dha") ? "يعني الامتثال لهيئة الصحة بدبي (DHA) أن جميع الخطط تستوفي حزمة المنافع الأساسية المطلوبة للمقيمين والعمال في دبي." : ""}${profile.regulators.includes("haad") ? `${profile.regulators.includes("dha") ? " علاوةً على ذلك، " : ""}تضمن الرقابة من هيئة الصحة بأبوظبي (HAAD/DOH) أن الخطط تلبي متطلبات Thiqa والمخطط الأساسي الإلزامي في أبوظبي.` : ""}${profile.regulators.includes("mohap") ? " ينطبق تسجيل وزارة الصحة ووقاية المجتمع (MOHAP) على الإمارات الشمالية." : ""}`,
    },
    {
      question: `كيف أتقدم بمطالبة لدى ${profile.name}؟`,
      answer: `لتقديم مطالبة لدى ${profile.name}، اتصل بخط المطالبات على ${profile.claimsPhone}. للفوترة المباشرة، قدّم بطاقة تأمينك من ${profile.name} لدى أي مقدم خدمة ضمن الشبكة — تتولى العيادة أو المستشفى الفوترة مباشرةً مع شركة التأمين وتدفع فقط نسبة اشتراكك عند الخدمة دون أوراق. لمطالبات السداد المسترد (خارج الشبكة أو حالات الطوارئ)، اجمع الفواتير المفصّلة والتقارير الطبية وقدّمها عبر ${profile.website} أو بريدياً إلى مكتب ${profile.name} في ${profile.headquarters} خلال 90 يوماً من تلقي العلاج.`,
    },
    {
      question: `ما أرخص خطط ${profile.name}؟`,
      answer: cheapestPlan
        ? `أكثر خطط ${profile.name} اقتصاداً هي ${cheapestPlan.name} (المستوى: ${getTierLabel(cheapestPlan.tier)})، تبدأ من ${formatPremium(cheapestPlan.premiumRange)} سنوياً. تشمل التغطية: ${cheapestPlan.coverage.inpatient ? "العلاج الداخلي" : ""}${cheapestPlan.coverage.outpatient ? " والعلاج الخارجي" : ""}${cheapestPlan.coverage.maternity ? " والأمومة" : ""} بنسبة اشتراك ${cheapestPlan.copayOutpatient}% للزيارات الخارجية وحد سنوي يبلغ ${formatLimit(cheapestPlan.annualLimit)}.`
        : `تواصل مع ${profile.name} على ${profile.claimsPhone} للاستفسار عن أسعار الخطط التمهيدية الحالية.`,
    },
  ];

  return (
    <div className="container-tc py-8" dir="rtl">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الإمارات", url: `${base}/ar` },
          { name: "دليل التأمين الصحي", url: `${base}/ar/insurance` },
          { name: profile.name },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "دليل التأمين الصحي", href: "/ar/insurance" },
          { label: profile.name },
        ]}
      />

      {/* الترويسة */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-bold text-dark">{profile.name}</h1>
            <p className="text-sm text-muted mt-1">
              تأسست {profile.foundedYear} · {profile.headquarters} ·{" "}
              {profile.regulators.map((r) => r.toUpperCase()).join("، ")} معتمد
            </p>
          </div>
          <span className="badge text-[9px] flex-shrink-0">{profile.type}</span>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {profile.keyFacts[0]}.{" "}
            تقدم {profile.name}{" "}
            {profile.plans.length === 1
              ? "خطة تأمين صحي واحدة"
              : `${profile.plans.length} خطط تأمين صحي`}{" "}
            في الإمارات
            {stats
              ? `، مقبولة لدى ${stats.totalProviders.toLocaleString()} مقدم رعاية صحية في ${stats.byCity.length} مدن`
              : ""}.
            {" "}البيانات مُوثَّقة بمرجعية الدليل الصحي المفتوح في الإمارات.
          </p>
        </div>

        {/* بيانات التواصل */}
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <Phone className="w-3.5 h-3.5" /> {profile.claimsPhone}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Globe className="w-3.5 h-3.5" /> {profile.website}
          </span>
        </div>
      </div>

      {/* حقائق رئيسية */}
      <div className="bg-light-50 p-4 mb-8 border border-black/[0.06]">
        <h2 className="text-sm font-bold text-dark mb-3">حقائق رئيسية</h2>
        <ul className="space-y-1.5">
          {profile.keyFacts.map((fact) => (
            <li key={fact} className="text-xs text-dark flex items-start gap-2">
              <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>

      {/* نظرة عامة على التغطية */}
      <div className="section-header">
        <h2>نظرة عامة على التغطية</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-dark text-white">
              <th className="px-3 py-2 text-right font-semibold">الخطة</th>
              <th className="px-3 py-2 text-right font-semibold">المستوى</th>
              <th className="px-3 py-2 text-right font-semibold">قسط التأمين / سنة</th>
              <th className="px-3 py-2 text-right font-semibold">الحد السنوي</th>
              <th className="px-3 py-2 text-right font-semibold">المشاركة في الدفع</th>
              <th className="px-3 py-2 text-center font-semibold">طب الأسنان</th>
              <th className="px-3 py-2 text-center font-semibold">البصريات</th>
            </tr>
          </thead>
          <tbody>
            {profile.plans.map((plan, i) => (
              <tr
                key={plan.id}
                className={i % 2 === 0 ? "bg-white" : "bg-light-50"}
              >
                <td className="px-3 py-2 font-medium text-dark border-b border-black/[0.06]">
                  {plan.name}
                </td>
                <td className="px-3 py-2 border-b border-black/[0.06]">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      plan.tier === "vip"
                        ? "bg-yellow-100 text-yellow-800"
                        : plan.tier === "premium"
                        ? "bg-purple-100 text-purple-800"
                        : plan.tier === "enhanced"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {getTierLabel(plan.tier)}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted border-b border-black/[0.06]">
                  {formatPremium(plan.premiumRange)}
                </td>
                <td className="px-3 py-2 text-muted border-b border-black/[0.06]">
                  {formatLimit(plan.annualLimit)}
                </td>
                <td className="px-3 py-2 text-muted border-b border-black/[0.06]">
                  {plan.copayOutpatient === 0 ? "0%" : `${plan.copayOutpatient}%`}
                </td>
                <td className="px-3 py-2 text-center border-b border-black/[0.06]">
                  {plan.coverage.dental ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center border-b border-black/[0.06]">
                  {plan.coverage.optical ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-muted mt-1.5">
          نسبة المشاركة في الدفع المعروضة تخص زيارات العلاج الخارجي. الأقساط أرقام استرشادية سنوية.
        </p>
      </div>

      {/* خطط التأمين الصحي */}
      <div className="section-header">
        <h2>خطط التأمين الصحي</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {profile.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            insurerName={profile.name}
            insurerSlug={profile.slug}
            networkSize={stats?.totalProviders}
          />
        ))}
      </div>

      {/* شبكة مقدمي الخدمة */}
      {stats && stats.totalProviders > 0 && (
        <>
          <div className="section-header">
            <h2>شبكة مقدمي الخدمة</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="mb-12">
            <NetworkStats stats={stats} />
          </div>
        </>
      )}

      {/* آلية المطالبات */}
      <div className="mb-10 bg-light-50 border border-black/[0.06] p-5">
        <h2 className="text-sm font-bold text-dark mb-2">
          كيف تعمل المطالبات مع {profile.name}
        </h2>
        <div className="answer-block" data-answer-block="true">
          <p className="text-xs text-muted leading-relaxed">
            <strong>الفوترة المباشرة:</strong> قدّم بطاقة تأمينك من {profile.name} لدى أي مقدم خدمة ضمن الشبكة. تتولى العيادة أو المستشفى الفوترة مباشرةً مع {profile.name} — تدفع فقط نسبة اشتراكك ({profile.plans[0]?.copayOutpatient ?? 0}%–
            {profile.plans[profile.plans.length - 1]?.copayOutpatient ?? 0}% للعلاج الخارجي) عند الخدمة دون أي أوراق.{" "}
            <strong>مطالبات السداد المسترد:</strong> للعلاج خارج الشبكة أو في حالات الطوارئ، اجمع الفواتير المفصّلة والتقارير الطبية، ثم قدّمها عبر {profile.website} أو اتصل بـ{" "}
            {profile.claimsPhone}. تُصدر قرارات السداد المسترد القياسية خلال 15–30 يوم عمل. يُشترط الحصول على موافقة مسبقة للإقامة في المستشفى المخطط لها والجراحات والفحوصات التشخيصية المرتفعة التكلفة — تواصل مع {profile.name} قبل 48 ساعة على الأقل.
          </p>
        </div>
      </div>

      {/* الأسئلة الشائعة */}
      <FaqSection faqs={faqs} title={`${profile.name} — الأسئلة الشائعة`} />

      {/* شركات تأمين أخرى للنظر فيها */}
      {await (async () => {
        const allStats = await getAllInsurerNetworkStats();
        const others = allStats
          .filter((s) => s.slug !== profile.slug && s.totalProviders > 0)
          .sort((a, b) => {
            const diff =
              Math.abs(a.totalProviders - (stats?.totalProviders ?? 0)) -
              Math.abs(b.totalProviders - (stats?.totalProviders ?? 0));
            return diff;
          })
          .slice(0, 5);
        if (others.length === 0) return null;
        return (
          <div className="mb-10">
            <div className="section-header">
              <h2>شركات تأمين أخرى للنظر فيها</h2>
              <span className="arrows">&gt;&gt;&gt;</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {others.map((s) => {
                const p = getInsurerProfile(s.slug)!;
                return (
                  <Link
                    key={s.slug}
                    href={`/ar/insurance/${s.slug}`}
                    className="block border border-black/[0.06] bg-white p-4 hover:border-accent hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                        {s.name}
                      </span>
                      <span className="badge text-[9px] flex-shrink-0">{p.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
                      <span>
                        {p.plans.length}{" "}
                        {p.plans.length === 1 ? "خطة" : "خطط"}
                      </span>
                      <span>{s.totalProviders.toLocaleString()} مقدم خدمة</span>
                      <span>{s.byCity.length} مدن</span>
                    </div>
                    <p className="text-[11px] text-accent font-semibold mt-2">
                      عرض الخطط &larr;
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* مقارنة */}
      <div className="mt-8 bg-dark text-white p-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">قارن {profile.name} مع شركات التأمين الأخرى</p>
          <p className="text-xs text-white/70 mt-1">
            مقارنة جنباً إلى جنب عبر جميع {INSURER_PROFILES.length} شركة تأمين إماراتية
          </p>
        </div>
        <Link
          href="/insurance/compare"
          className="bg-accent text-white px-4 py-2 text-xs font-bold hover:bg-accent-dark transition-colors flex-shrink-0"
        >
          قارن الخطط
        </Link>
      </div>

      {/* عودة */}
      <div className="mt-6">
        <Link
          href="/ar/insurance"
          className="flex items-center gap-1.5 text-sm text-accent font-bold hover:text-accent-dark"
        >
          <ArrowLeft className="w-4 h-4" /> جميع شركات التأمين
        </Link>
      </div>

      {/* تبديل اللغة */}
      <div className="mt-4">
        <Link
          href={`/insurance/${profile.slug}`}
          className="text-accent text-sm hover:underline"
        >
          View in English / عرض بالإنجليزية
        </Link>
      </div>

      {/* إخلاء المسؤولية */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> تفاصيل الخطط والأقساط المعروضة أرقام استرشادية. احصل على عرض سعر شخصي من {profile.name} أو وسيط معتمد. بيانات شبكة مقدمي الخدمة مصدرها الدليل الصحي المفتوح في الإمارات، آخر تحقق مارس 2026.
        </p>
      </div>
    </div>
  );
}
