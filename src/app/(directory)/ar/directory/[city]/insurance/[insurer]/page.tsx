import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategories,
  getInsuranceProviders, getProvidersByInsurance, getProviderCountByInsurance,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicCategoryName, getArabicRegulator } from "@/lib/i18n";

export const revalidate = 21600;

interface Props {
  params: { city: string; insurer: string };
}

// ─── Insurer type label (Arabic) ──────────────────────────────────────────────

function getArabicInsurerTypeLabel(type: string): string {
  switch (type) {
    case "mandatory": return "إلزامي / حكومي";
    case "premium": return "حكومي مميز";
    case "tpa": return "جهة إدارة مطالبات";
    default: return "خاص";
  }
}

// ─── Mandatory note (Arabic) ─────────────────────────────────────────────────

function getArabicMandatoryNote(citySlug: string, cityNameAr: string): string {
  if (citySlug === "dubai")
    return "تُلزم دبي جميع المقيمين وأصحاب العمل بالتأمين الصحي بموجب قانون التأمين الصحي لإمارة دبي.";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "تشترط أبوظبي التأمين الصحي الإلزامي لجميع المقيمين والمواطنين الإماراتيين وفق لوائح دائرة الصحة DOH.";
  return `يخضع التأمين الصحي في ${cityNameAr} للإرشادات الفيدرالية الصادرة عن وزارة الصحة ووقاية المجتمع MOHAP؛ وعلى الرغم من عدم إلزاميته محلياً، يوفر معظم أصحاب العمل تغطية جماعية لموظفيهم.`;
}

export const dynamicParams = true;

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const insurer = getInsuranceProviders().find((i) => i.slug === params.insurer);
  if (!insurer) return {};
  const count = await getProviderCountByInsurance(insurer.slug, city.slug);
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const regulatorAr = getArabicRegulator(city.slug);
  const canonicalUrl = `${base}/ar/directory/${city.slug}/insurance/${insurer.slug}`;

  const title = `عيادات تقبل تأمين ${insurer.name} في ${cityNameAr} | ${count} ${ar.provider}`;
  const description = `ابحث عن ${count} مقدم رعاية صحية مرخص من ${regulatorAr} في ${cityNameAr} يقبلون تأمين ${insurer.name}. تشمل المستشفيات والعيادات وطب الأسنان والأمراض الجلدية والمزيد. قوائم موثقة مع تقييمات وتفاصيل التواصل. آخر تحقق مارس 2026.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en-AE": `${base}/directory/${city.slug}/insurance/${insurer.slug}`,
        "ar-AE": canonicalUrl,
      },
    },
    openGraph: {
      title: `تأمين ${insurer.name} — ${count} ${ar.provider} في ${cityNameAr}`,
      description: `${count} مقدم خدمة صحية منظَّم لدى ${regulatorAr} في ${cityNameAr} يقبلون ${insurer.name}. تصفح المستشفيات والعيادات والمتخصصين — جميعها موثقة مارس 2026.`,
      url: canonicalUrl,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArabicInsuranceProviderPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const allInsurers = getInsuranceProviders();
  const insurer = allInsurers.find((i) => i.slug === params.insurer);
  if (!insurer) notFound();

  const providers = await getProvidersByInsurance(insurer.slug, city.slug);
  const count = providers.length;
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);
  const regulatorAr = getArabicRegulator(city.slug);
  const mandatoryNoteAr = getArabicMandatoryNote(city.slug, cityNameAr);

  // ─── Category breakdown ─────────────────────────────────────────────────────
  const categories = getCategories();
  const catBreakdown = categories
    .map((cat) => ({
      ...cat,
      insurerCount: providers.filter((p) => p.categorySlug === cat.slug).length,
    }))
    .filter((c) => c.insurerCount > 0)
    .sort((a, b) => b.insurerCount - a.insurerCount);

  // ─── Top-rated providers ─────────────────────────────────────────────────────
  const topRated = [...providers]
    .filter((p) => Number(p.googleRating) > 0)
    .sort((a, b) => {
      const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    })
    .slice(0, 5);

  // ─── Other cities this insurer is accepted in ────────────────────────────────
  const otherCitiesRaw = getCities().filter((c) => c.slug !== city.slug);
  const otherCityCounts = await Promise.all(
    otherCitiesRaw.map((c) => getProviderCountByInsurance(insurer.slug, c.slug))
  );
  const otherCities = otherCitiesRaw
    .map((c, i) => ({ ...c, count: otherCityCounts[i] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ─── Related insurers in this city ──────────────────────────────────────────
  const popularSlugs = ["daman", "axa", "cigna", "bupa", "oman-insurance", "nas", "mednet", "orient", "dic", "takaful-emarat"];
  const relatedInsurersRaw = allInsurers
    .filter((i) => i.slug !== insurer.slug && popularSlugs.includes(i.slug))
    .slice(0, 5);
  const relatedInsurerCounts = await Promise.all(
    relatedInsurersRaw.map((i) => getProviderCountByInsurance(i.slug, city.slug))
  );
  const relatedInsurers = relatedInsurersRaw
    .map((i, idx) => ({ ...i, count: relatedInsurerCounts[idx] }))
    .filter((i) => i.count > 0);

  // ─── Rich answer paragraph (Arabic) ──────────────────────────────────────────
  const topCategory = catBreakdown[0];
  const coverageNoteAr =
    insurer.type === "mandatory"
      ? `بوصفه مؤمناً حكومياً إلزامياً، يُشكّل ${insurer.name} ركيزة التأمين الصحي لأصحاب العمل في الإمارات.`
      : insurer.type === "premium"
      ? `${insurer.name} برنامج حكومي مميز للمواطنين الإماراتيين يوفر تغطية شاملة بدون تكلفة.`
      : `${insurer.name} شركة تأمين ${getArabicInsurerTypeLabel(insurer.type)} مقبولة على نطاق واسع في أرجاء الإمارات.`;

  const answerParagraph = count > 0
    ? `وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، يوجد ${count} مقدم خدمة صحية مرخص من ${regulatorAr} في ${cityNameAr} يقبلون تأمين ${insurer.name}. ${mandatoryNoteAr} ${coverageNoteAr}${topCategory ? ` تقع غالبية مقدمي ${insurer.name} في ${cityNameAr} ضمن تخصص ${getArabicCategoryName(topCategory.slug)} (${topCategory.insurerCount} مقدم خدمة).` : ""} جميع القوائم مُراجَعة ومُطابَقة مع سجلات ${regulatorAr} الرسمية، آخر تحقق مارس 2026.`
    : `بيانات تأمين ${insurer.name} في ${cityNameAr} قيد الإعداد حالياً. ${mandatoryNoteAr} ${coverageNoteAr} تفضل بالعودة قريباً، أو تصفح دليل مقدمي الخدمة في ${cityNameAr} أدناه.`;

  // ─── FAQs (Arabic) ────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: `هل يغطي تأمين ${insurer.name} الرعاية الصحية في ${cityNameAr}؟`,
      answer: `نعم. يُقبل تأمين ${insurer.name} في ${count} مقدم رعاية صحية في ${cityNameAr} بالإمارات، جميعهم مرخصون من ${regulatorAr}. ${insurer.description} استخدم دليل الرعاية الصحية المفتوح في الإمارات للعثور على عيادات ومستشفيات ومتخصصين يقبلون ${insurer.name} في ${cityNameAr}.`,
    },
    {
      question: `كم عدد مقدمي الخدمة الذين يقبلون ${insurer.name} في ${cityNameAr}؟`,
      answer: `وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، يوجد ${count} مقدم خدمة صحية مرخص من ${regulatorAr} في ${cityNameAr} يقبلون تأمين ${insurer.name}. تشمل القائمة المستشفيات والعيادات وعيادات الأسنان والمراكز المتخصصة ومختبرات التشخيص. البيانات محدَّثة حتى مارس 2026.`,
    },
    {
      question: `ما هي نسبة المشاركة في التكلفة لتأمين ${insurer.name} في ${cityNameAr}؟`,
      answer: `تتفاوت نسبة مشاركة المريض في التكلفة (co-pay) لتأمين ${insurer.name} في ${cityNameAr} بحسب مستوى الخطة ونوع المنشأة. ${insurer.type === "mandatory" ? `بالنسبة لخطة المزايا الأساسية القياسية (EBP) من Daman في دبي، تبلغ نسبة المشاركة في التكلفة للعيادات الخارجية عادةً 20% (بحد أقصى 500 درهم سنوياً). قد تنطوي الخطط المحسَّنة على نسبة مشاركة أدنى أو معدومة.` : insurer.type === "premium" ? `يوفر برنامج ثقة نسبة مشاركة تكاد تكون صفرية للمواطنين الإماراتيين في جميع المرافق الحكومية ومعظم المرافق الخاصة في ${cityNameAr}.` : `تُطبّق معظم خطط شركات التأمين الخاصة نسبة مشاركة تتراوح بين 10% و20% للزيارات الخارجية. راجع جدول خطتك لدى ${insurer.name} للاطلاع على النسب الدقيقة.`} تواصل مع ${insurer.name} أو وسيطك لدى صاحب العمل للاستفسار عن تفاصيل خطتك.`,
    },
    {
      question: `هل يغطي تأمين ${insurer.name} حالات الطوارئ في ${cityNameAr}؟`,
      answer: `نعم، تُغطى حالات الطوارئ في إطار جميع خطط ${insurer.name} في ${cityNameAr}. في الإمارات العربية المتحدة، لا يحق لأي منشأة مرخصة من ${regulatorAr} رفض تقديم العلاج في حالات الطوارئ. ${insurer.type === "mandatory" || insurer.type === "premium" ? `يشمل ${insurer.name} خدمات الطوارئ في جميع المستشفيات الحكومية ومعظم المستشفيات الخاصة في ${cityNameAr}.` : `بالنسبة لتأمين ${insurer.name}، يُغطى العلاج الطارئ في أي مستشفى في ${cityNameAr} دون الحاجة إلى موافقة مسبقة في حالات الطوارئ الحقيقية.`}`,
    },
  ];

  return (
    <div className="font-arabic container-tc py-8" dir="rtl">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
        { name: "التأمين الصحي", url: `${base}/ar/directory/${city.slug}/insurance` },
        { name: insurer.name },
      ])} />
      {providers.length > 0 && (
        <JsonLd data={itemListSchema(`مقدمو خدمة يقبلون ${insurer.name} في ${cityNameAr}`, providers.slice(0, 20), city.name, base)} />
      )}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* hreflang alternates rendered as link tags via metadata — handled above */}

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: ar.home, href: "/ar" },
        { label: cityNameAr, href: `/ar/directory/${city.slug}` },
        { label: "التأمين الصحي", href: `/ar/directory/${city.slug}/insurance` },
        { label: insurer.name },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-dark">
            تأمين {insurer.name} — مقدمو الرعاية الصحية في {cityNameAr}
          </h1>
          <span className="badge text-[9px] flex-shrink-0 mt-1">{getArabicInsurerTypeLabel(insurer.type)}</span>
        </div>
        <p className="text-sm text-muted">
          {count} {ar.provider} موثق · مرخص من {regulatorAr} · آخر تحديث مارس 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">{answerParagraph}</p>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2 mb-8 text-xs">
        <Link
          href={`/ar/directory/${city.slug}/insurance`}
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          جميع التأمينات في {cityNameAr}
        </Link>
        <Link
          href={`/insurance/${insurer.slug}`}
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          خطط وتغطية {insurer.name}
        </Link>
        <Link
          href="/insurance/compare"
          className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          مقارنة شركات التأمين
        </Link>
      </div>

      {/* Category Breakdown */}
      {catBreakdown.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>تصفح حسب التخصص</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {catBreakdown.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ar/directory/${city.slug}/${cat.slug}`}
                className="flex items-center gap-2 border border-black/[0.06] px-3 py-2 hover:border-accent group transition-colors"
              >
                <span className="text-xs font-bold text-dark group-hover:text-accent transition-colors">
                  {getArabicCategoryName(cat.slug)}
                </span>
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.insurerCount}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            يعرض {catBreakdown.length} {catBreakdown.length === 1 ? "تخصص" : "تخصصات"} تضم مقدمي خدمة يقبلون {insurer.name} في {cityNameAr}.
            اضغط على التخصص لتصفح جميع مقدمي الخدمة في {cityNameAr} ضمن ذلك التخصص.
          </p>
        </section>
      )}

      {/* Top-rated section */}
      {topRated.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>الأعلى تقييماً من مقدمي {insurer.name} في {cityNameAr}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="space-y-0">
            {topRated.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-black/[0.06] last:border-b-0">
                <span className="text-xs font-bold text-muted w-5 flex-shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/ar/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`}
                    className="text-sm font-bold text-dark hover:text-accent transition-colors block truncate"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted truncate">{p.address}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                    {p.googleRating} ★
                  </span>
                  {p.googleReviewCount > 0 && (
                    <span className="text-xs text-muted">({p.googleReviewCount.toLocaleString()})</span>
                  )}
                </div>
                <span className="badge text-[9px] flex-shrink-0">{getArabicCategoryName(p.categorySlug)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All providers grid */}
      <section className="mb-10">
        <div className="section-header">
          <h2>جميع مقدمي {insurer.name} في {cityNameAr}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>

        {providers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.slice(0, 60).map((p) => (
                <ProviderCard
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  address={p.address}
                  phone={p.phone}
                  website={p.website}
                  shortDescription={p.shortDescription}
                  googleRating={p.googleRating}
                  googleReviewCount={p.googleReviewCount}
                  isClaimed={p.isClaimed}
                  isVerified={p.isVerified}
                  coverImageUrl={p.coverImageUrl}
                  basePath="/ar/directory"
                />
              ))}
            </div>
            {providers.length > 60 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted">
                  يعرض 60 من أصل {count.toLocaleString()} مقدم خدمة. استخدم{" "}
                  <Link href={`/search?city=${city.slug}&q=${encodeURIComponent(insurer.name)}`} className="text-accent font-bold">
                    أداة البحث
                  </Link>{" "}
                  لتصفح جميع مقدمي {insurer.name} في {cityNameAr}.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-black/[0.06]">
            <p className="text-muted mb-2">لم يتم العثور على مقدمي خدمة يقبلون {insurer.name} في {cityNameAr} حتى الآن.</p>
            <Link href={`/ar/directory/${city.slug}`} className="text-accent text-sm font-bold">
              عرض جميع مقدمي الرعاية الصحية في {cityNameAr} &larr;
            </Link>
          </div>
        )}
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} title={`تأمين ${insurer.name} في ${cityNameAr} — أسئلة شائعة`} />

      {/* Cross-link: other cities */}
      {otherCities.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>{insurer.name} في الإمارات الأخرى</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/ar/directory/${c.slug}/insurance/${insurer.slug}`}
                className="block border border-black/[0.06] p-3 hover:border-accent transition-colors group text-center"
              >
                <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">{getArabicCityName(c.slug)}</p>
                <p className="text-xs text-accent font-bold mt-1">{c.count} {ar.provider}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related insurers */}
      {relatedInsurers.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>خطط تأمين أخرى في {cityNameAr}</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedInsurers.map((ins) => (
              <Link
                key={ins.slug}
                href={`/ar/directory/${city.slug}/insurance/${ins.slug}`}
                className="block border border-black/[0.06] p-4 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-dark text-sm">{ins.name}</h3>
                  <span className="badge text-[9px]">{getArabicInsurerTypeLabel(ins.type)}</span>
                </div>
                <p className="text-xs text-muted line-clamp-2 mb-2">{ins.description}</p>
                <p className="text-xs font-bold text-accent">
                  {ins.count} {ar.provider} في {cityNameAr}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Compare CTA */}
      <div className="bg-dark text-white p-6 flex items-center justify-between mb-8">
        <div>
          <p className="font-bold text-sm">قارن {insurer.name} مع شركات التأمين الأخرى</p>
          <p className="text-xs text-white/70 mt-1">
            مقارنة جانبية للخطط — الأقساط ونسبة المشاركة وتأمين الأسنان والأمومة وحجم الشبكة
          </p>
        </div>
        <Link
          href="/insurance/compare"
          className="bg-accent text-white px-4 py-2 text-xs font-bold hover:bg-green-600 transition-colors flex-shrink-0"
        >
          مقارنة الخطط
        </Link>
      </div>

      {/* Language switch */}
      <div className="text-center mb-6">
        <Link href={`/directory/${city.slug}/insurance/${insurer.slug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> بيانات شبكة مقدمي الخدمة مصدرها السجلات الرسمية لـ {regulatorAr} ودليل الرعاية الصحية المفتوح في الإمارات، آخر تحقق مارس 2026.
          قد تتغير قبول التأمين في أي وقت — تحقق دائماً مع مكتب التأمين لدى مقدم الخدمة قبل زيارتك.
          للاستفسار عن التغطية المحددة ونسبة المشاركة والموافقة المسبقة، تواصل مع {insurer.name} مباشرةً أو مع وسيط صاحب العمل.
        </p>
      </div>

    </div>
  );
}
