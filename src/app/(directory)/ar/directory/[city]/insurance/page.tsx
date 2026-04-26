import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug,
  getInsuranceProviders, getProviderCountByInsurance,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicRegulator } from "@/lib/i18n";
import { safe } from "@/lib/safeData";

export const dynamic = "force-dynamic";
export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);

  return {
    title: `${ar.insurance} في ${cityNameAr} | دليل الرعاية الصحية المفتوح في الإمارات`,
    description: `تصفح شركات التأمين الصحي المقبولة في مرافق الرعاية الصحية في ${cityNameAr}، الإمارات. ابحث عن العيادات والمستشفيات حسب خطة التأمين — ضمان، ثقة، أكسا، سيغنا، والمزيد. آخر تحقق مارس 2026.`,
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
  const regulator = getArabicRegulator(city.slug);

  const insurerCounts = await Promise.all(
    insurers.map((ins) =>
      safe(getProviderCountByInsurance(ins.slug, city.slug), 0, `ar-ins-count:${ins.slug}`)
    )
  );
  const insurersWithCounts = insurers.map((ins, i) => ({ ...ins, count: insurerCounts[i] }));

  return (
    <div dir="rtl" className="font-arabic container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
        { name: ar.insurance },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{ar.insurance}</span>
      </nav>

      <h1 className="text-3xl font-bold text-dark mb-2">
        {ar.insurance} في {cityNameAr}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، يقبل مقدمو الرعاية الصحية في {cityNameAr} مجموعة واسعة من خطط التأمين.
          {city.slug === "dubai" && " تلزم دبي بالتأمين الصحي لجميع المقيمين بموجب لوائح هيئة الصحة بدبي."}
          {city.slug === "abu-dhabi" && " تشترط أبوظبي التأمين الصحي الإلزامي (ضمان/ثقة) لجميع المقيمين والمواطنين بموجب لوائح دائرة الصحة."}
          {!["dubai", "abu-dhabi"].includes(city.slug) && ` تخضع تغطية التأمين الصحي في ${cityNameAr} للوائح الاتحادية الإماراتية تحت إشراف ${regulator}.`}
          {" "}تصفح حسب شركة التأمين أدناه للعثور على العيادات والمستشفيات التي تقبل خطتك. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>{ar.browseByInsurance}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insurersWithCounts.map((ins) => (
          <Link
            key={ins.slug}
            href={`/ar/directory/${city.slug}/insurance/${ins.slug}`}
            className="block border border-light-200 p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-dark text-sm">{ins.name}</h3>
              <span className="badge text-[9px]">{ins.type}</span>
            </div>
            <p className="text-xs text-muted line-clamp-2 mb-2">{ins.description}</p>
            <p className="text-xs font-bold text-accent">
              {ins.count} {ins.count === 1 ? ar.provider : ar.providerPlural}
            </p>
          </Link>
        ))}
      </div>

      {/* Language Switch */}
      <div className="text-center pt-6 pb-8">
        <Link href={`/directory/${city.slug}/insurance`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
