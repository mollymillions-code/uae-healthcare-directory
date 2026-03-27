import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, Clock, MapPin, Award } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PackageCard } from "@/components/labs/PackageCard";
import {
  LAB_PROFILES,
  getLabProfile,
  getPricesForLab,
  getPackagesForLab,
  getLabTest,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

export function generateStaticParams() {
  return LAB_PROFILES.map((lab) => ({ lab: lab.slug }));
}

export function generateMetadata({ params }: { params: { lab: string } }): Metadata {
  const lab = getLabProfile(params.lab);
  if (!lab) return { title: "المختبر غير موجود" };

  const base = getBaseUrl();
  const prices = getPricesForLab(lab.slug);
  const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

  return {
    title: `${lab.name} — أسعار الفحوصات المخبرية والسحب المنزلي | مقارنة المختبرات في الإمارات`,
    description:
      `${lab.name}: ${prices.length} فحصاً مخبرياً تبدأ أسعاره من ` +
      `${cheapest ? `AED ${cheapest}` : "أسعار تنافسية"}. ` +
      `${lab.homeCollection ? `خدمة السحب المنزلي ${lab.homeCollectionFee === 0 ? "مجانية" : `بـ AED ${lab.homeCollectionFee}`}. ` : ""}` +
      `معتمد من ${lab.accreditations.join("، ")}. فروع في ${lab.cities.map((c) => getArabicCityName(c)).join("، ")}. ` +
      `قارن الأسعار واحجز الآن.`,
    alternates: {
      canonical: `${base}/ar/labs/${lab.slug}`,
      languages: {
        "en-AE": `${base}/labs/${lab.slug}`,
        "ar-AE": `${base}/ar/labs/${lab.slug}`,
      },
    },
    openGraph: {
      title: `${lab.name} — أسعار الفحوصات المخبرية والسحب المنزلي`,
      description: `قارن ${prices.length} فحصاً مخبرياً في ${lab.name}. معتمد من ${lab.accreditations.join("، ")}.`,
      url: `${base}/ar/labs/${lab.slug}`,
      type: "website",
    },
  };
}

export default function ArabicLabDetailPage({ params }: { params: { lab: string } }) {
  const lab = getLabProfile(params.lab);
  if (!lab) notFound();

  const base = getBaseUrl();
  const prices = getPricesForLab(lab.slug);
  const packages = getPackagesForLab(lab.slug);
  const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;

  // تجميع الأسعار حسب فئة الفحص
  const pricesByCategory = new Map<string, typeof prices>();
  for (const p of prices) {
    const test = getLabTest(p.testSlug);
    if (!test) continue;
    const cat = test.category;
    if (!pricesByCategory.has(cat)) pricesByCategory.set(cat, []);
    pricesByCategory.get(cat)!.push(p);
  }

  const faqs = [
    {
      question: `كم تبلغ تكلفة فحوصات الدم في ${lab.name}؟`,
      answer:
        `يقدم ${lab.name} ${prices.length} فحصاً مخبرياً تبدأ أسعاره من ` +
        `${cheapest ? `AED ${cheapest}` : "أسعار تنافسية"}. ` +
        `من أبرز الفحوصات: CBC ${prices.find((p) => p.testSlug === "cbc") ? `بـ AED ${prices.find((p) => p.testSlug === "cbc")!.price}` : "متاح"}، ` +
        `فيتامين D ${prices.find((p) => p.testSlug === "vitamin-d") ? `بـ AED ${prices.find((p) => p.testSlug === "vitamin-d")!.price}` : "متاح"}، ` +
        `لوحة الغدة الدرقية ${prices.find((p) => p.testSlug === "thyroid-panel") ? `بـ AED ${prices.find((p) => p.testSlug === "thyroid-panel")!.price}` : "متاح"}. ` +
        `تبدأ باقات الفحص الصحي من AED ${packages.length > 0 ? packages.reduce((min, p) => Math.min(min, p.price), Infinity) : "99"}.`,
    },
    {
      question: `هل يوفر ${lab.name} خدمة السحب المنزلي؟`,
      answer: lab.homeCollection
        ? `نعم، يوفر ${lab.name} خدمة سحب العينات في المنزل ${lab.homeCollectionFee === 0 ? "مجاناً" : `بـ AED ${lab.homeCollectionFee}`}. ` +
          `تزور ممرضة مرخصة من DHA موقعك وتُسلَّم النتائج رقمياً في غضون ${lab.turnaroundHours} ساعة.`
        : `يعمل ${lab.name} حالياً كمختبر بدون موعد مسبق. يمكنك زيارة أي من فروعه البالغة ${lab.branchCount} فرعاً${lab.branchCount !== 1 ? "" : ""} خلال ساعات العمل.`,
    },
    {
      question: `أين تقع فروع ${lab.name}؟`,
      answer:
        `يضم ${lab.name} ${lab.branchCount > 0 ? `${lab.branchCount} فرعاً` : "عمليات"} عبر ` +
        `${lab.cities.map((c) => getArabicCityName(c)).join("، ")}. ` +
        `ساعات العمل: ${lab.operatingHours}.`,
    },
    {
      question: `هل حصل ${lab.name} على اعتمادات دولية؟`,
      answer:
        lab.accreditations.length > 0
          ? `يحمل ${lab.name} اعتماد${lab.accreditations.length > 1 ? "ات" : ""} ${lab.accreditations.join("، ")}، ` +
            `ومرخص من ${lab.regulators.map((r) => r.toUpperCase()).join("، ")}. ` +
            `${lab.accreditations.includes("CAP") ? "يُعدّ اعتماد CAP (كلية علماء الأمراض الأمريكيين) المعيار الذهبي للمختبرات السريرية على المستوى الدولي." : ""}`
          : `يحمل ${lab.name} ترخيصاً من ${lab.regulators.map((r) => r.toUpperCase()).join("، ")} لتشغيل خدمات المختبرات التشخيصية في الإمارات.`,
    },
    {
      question: `كم يستغرق الحصول على نتائج الفحوصات في ${lab.name}؟`,
      answer:
        `يُسلِّم ${lab.name} نتائج الفحوصات في غضون ${lab.turnaroundHours} ساعة. ` +
        `تُسلَّم فحوصات الدم الاعتيادية كـ CBC والجلوكوز ووظائف الكبد عادةً في 4 إلى 6 ساعات للمرضى الحاضرين مباشرةً، ` +
        `بينما تستغرق فحوصات الفيتامينات والغدة الدرقية من 12 إلى 24 ساعة. ` +
        `${lab.homeCollection ? `تُسلَّم نتائج خدمة السحب المنزلي رقمياً خلال ${lab.turnaroundHours} ساعة.` : ""}`,
    },
  ];

  return (
    <div className="container-tc py-8" dir="rtl" lang="ar">
      <JsonLd
        data={breadcrumbSchema([
          { name: ar.home, url: `${base}/ar` },
          { name: "مقارنة الفحوصات المخبرية", url: `${base}/ar/labs` },
          { name: lab.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: lab.name,
          description: lab.description,
          url: `${base}/ar/labs/${lab.slug}`,
          telephone: lab.phone,
          foundingDate: lab.foundedYear.toString(),
          areaServed: lab.cities.map((c) => ({
            "@type": "City",
            name: getArabicCityName(c),
          })),
          hasCredential: lab.accreditations.map((a) => ({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: a,
          })),
          openingHours: lab.operatingHours,
          makesOffer: prices.slice(0, 20).map((p) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "MedicalTest",
              name: p.testName,
            },
            price: p.price,
            priceCurrency: "AED",
          })),
        }}
      />

      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "مقارنة الفحوصات المخبرية", href: "/ar/labs" },
          { label: lab.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-3">{lab.name}</h1>
        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed mb-4">{lab.description}</p>
        </div>

        {/* شبكة المعلومات الرئيسية */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {cheapest && (
            <div className="bg-light-50 p-3">
              <p className="text-lg font-bold text-accent">من AED {cheapest}</p>
              <p className="text-[11px] text-muted">{prices.length} فحص متاح</p>
            </div>
          )}
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Home className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">خدمة السحب المنزلي</p>
            </div>
            <p className="text-[11px] text-muted">
              {lab.homeCollection
                ? lab.homeCollectionFee === 0
                  ? "سحب منزلي مجاني"
                  : `سحب منزلي: ${lab.homeCollectionFee} درهم`
                : "غير متاحة"}
            </p>
          </div>
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">النتائج</p>
            </div>
            <p className="text-[11px] text-muted">خلال {lab.turnaroundHours} ساعة</p>
          </div>
          <div className="bg-light-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-4 h-4 text-accent" />
              <p className="text-xs font-bold text-dark">الاعتمادات والشهادات</p>
            </div>
            <p className="text-[11px] text-muted">{lab.accreditations.join("، ") || "مرخص من DHA"}</p>
          </div>
        </div>

        {/* صف التفاصيل */}
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {lab.branchCount > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {lab.branchCount} فروع في {lab.cities.map((c) => getArabicCityName(c)).join("، ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lab.operatingHours}
          </span>
          <span>تأسس عام {lab.foundedYear}</span>
          <span>مرخص من {lab.regulators.map((r) => r.toUpperCase()).join("، ")}</span>
        </div>
      </div>

      {/* أبرز المزايا */}
      {lab.highlights.length > 0 && (
        <div className="mb-8">
          <div className="section-header">
            <h2>أبرز المزايا</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lab.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2 text-sm text-dark p-2 bg-light-50">
                <ArrowLeft className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                {h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* باقات الفحص الصحي */}
      {packages.length > 0 && (
        <div className="mb-8">
          <div className="section-header">
            <h2>باقات الفحص الصحي</h2>
            <span className="arrows">&lt;&lt;&lt;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}

      {/* أسعار الفحوصات حسب الفئة */}
      <div className="section-header">
        <h2>أسعار الفحوصات في {lab.name}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          يقدم {lab.name} {prices.length} فحصاً مخبرياً موزعةً على {pricesByCategory.size} فئة.
          الأسعار للمرضى الحاضرين دون تأمين. انقر على أي فحص للمقارنة
          مع جميع المختبرات في الإمارات.
        </p>
      </div>

      {Array.from(pricesByCategory.entries()).map(([category, catPrices]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-bold text-dark mb-2 capitalize">
            {category.replace(/-/g, " ")}
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-200">
                  <th className="text-right py-2 px-3 text-xs font-bold text-dark">الفحص</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-dark">السعر</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-dark" />
                </tr>
              </thead>
              <tbody>
                {catPrices.map((p, i) => (
                  <tr key={p.testSlug} className={i % 2 === 0 ? "bg-light-50" : ""}>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/labs/test/${p.testSlug}`}
                        className="text-xs font-medium text-dark hover:text-accent transition-colors"
                      >
                        {p.testName}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-left text-xs font-bold text-dark">
                      {formatPrice(p.price)}
                    </td>
                    <td className="py-2 px-3 text-left">
                      <Link
                        href={`/labs/test/${p.testSlug}`}
                        className="text-[11px] text-accent hover:text-accent-dark font-bold"
                      >
                        قارن ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* نبذة عن المختبر */}
      <div className="mt-10 mb-8 p-5 bg-light-50">
        <h2 className="text-lg font-bold text-dark mb-3">نبذة عن {lab.name}</h2>
        <div className="answer-block" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed mb-3">{lab.description}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted mt-4">
          <div>
            <span className="font-bold text-dark">المدن المتاحة: </span>
            {lab.cities.map((c) => getArabicCityName(c)).join("، ")}
          </div>
          <div>
            <span className="font-bold text-dark">الاعتمادات والشهادات: </span>
            {lab.accreditations.length > 0 ? lab.accreditations.join("، ") : "مرخص من DHA"}
          </div>
          {lab.homeCollection && (
            <div>
              <span className="font-bold text-dark">خدمة السحب المنزلي: </span>
              {lab.homeCollectionFee === 0 ? "سحب منزلي مجاني" : `سحب منزلي: ${lab.homeCollectionFee} درهم`}
            </div>
          )}
        </div>
      </div>

      {/* الأسئلة الشائعة */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title={`${lab.name} — الأسئلة الشائعة`} />
      </div>

      {/* إخلاء المسؤولية */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة لـ {lab.name} استرشادية وتستند إلى
          البيانات المتاحة للعموم. قد تتباين الأسعار الفعلية بحسب موقع الفرع والتغطية التأمينية
          والعروض الترويجية الجارية. يُرجى التواصل مع {lab.name} مباشرةً للتأكد من الأسعار
          قبل زيارتك. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* تبديل اللغة */}
      <div className="text-center pt-4 pb-8">
        <Link href={`/labs/${lab.slug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
