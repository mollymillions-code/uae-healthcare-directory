import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getInsuranceProviders, getProviderCountByInsurance,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export const dynamicParams = true;

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);

  return {
    title: `مزودو التأمين الصحي في ${cityNameAr} | دليل الرعاية الصحية المفتوح في الإمارات`,
    description: `تصفح مزودي التأمين الصحي المقبولين في المنشآت الصحية بـ${cityNameAr}، الإمارات. ابحث عن العيادات والمستشفيات حسب خطة تأمينك — Daman وThiqa وAXA وCigna والمزيد. آخر تحقق مارس 2026.`,
    alternates: {
      canonical: `${base}/ar/directory/${city.slug}/insurance`,
      languages: {
        "en-AE": `${base}/directory/${city.slug}/insurance`,
        "ar-AE": `${base}/ar/directory/${city.slug}/insurance`,
      },
    },
  };
}

export default async function ArabicInsuranceIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const insurers = getInsuranceProviders();
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);

  // Pre-fetch insurance counts in parallel
  const insurerCounts = await Promise.all(
    insurers.map((ins) => getProviderCountByInsurance(ins.slug, city.slug))
  );
  const insurersWithCounts = insurers
    .map((ins, i) => ({ ...ins, count: insurerCounts[i] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="container-tc py-8" dir="rtl">
      <JsonLd data={breadcrumbSchema([
        { name: "الرئيسية", url: `${base}/ar` },
        { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
        { name: "التأمين الصحي" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">
          {cityNameAr}
        </Link>
        <span>/</span>
        <span className="text-dark font-medium">التأمين الصحي</span>
      </nav>

      <h1 className="text-3xl font-bold text-dark mb-2">
        التأمين الصحي في {cityNameAr}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، تقبل المنشآت الصحية في {cityNameAr} مجموعة واسعة من خطط التأمين الصحي.
          {city.slug === "dubai" && " تُلزم دبي بالتأمين الصحي لجميع المقيمين وفق أنظمة هيئة الصحة بدبي (DHA)."}
          {city.slug === "abu-dhabi" && " تُوجب أبوظبي التأمين الصحي الإلزامي (Daman/Thiqa) لجميع المقيمين والمواطنين وفق أنظمة دائرة الصحة - أبوظبي (DOH)."}
          {!["dubai", "abu-dhabi"].includes(city.slug) && ` تخضع تغطية التأمين الصحي في ${cityNameAr} للأنظمة الاتحادية الإماراتية الصادرة عن وزارة الصحة ووقاية المجتمع (MOHAP).`}
          {" "}تصفح قائمة شركات التأمين أدناه للعثور على العيادات والمستشفيات التي تقبل خطتك التأمينية. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>مزودو التأمين الصحي</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insurersWithCounts.map((ins) => (
          <Link
            key={ins.slug}
            href={`/ar/directory/${city.slug}/insurance/${ins.slug}`}
            className="block border border-light-200 p-4 hover:border-accent transition-colors"
            title={`تصفح مقدمي خدمة ${ins.name} في ${cityNameAr}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-dark text-sm">{ins.name}</h3>
              <span className="badge text-[9px]">{ins.type}</span>
            </div>
            <p className="text-xs text-muted line-clamp-2 mb-2">{ins.description}</p>
            <p className="text-xs font-bold text-accent">
              {ins.count} {ins.count === 1 ? "مقدم خدمة يقبل" : "مقدم خدمة يقبل"} {ins.name}
            </p>
          </Link>
        ))}
      </div>

      {/* Language Switch */}
      <div className="text-center pt-8 pb-4">
        <Link href={`/directory/${city.slug}/insurance`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
