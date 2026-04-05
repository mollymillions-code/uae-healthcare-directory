import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities,
  getLanguagesList, getProviderCountByLanguage,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName, getArabicLanguageName } from "@/lib/i18n";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);

  return {
    title: `اللغات المتوفرة لدى مقدمي الرعاية الصحية في ${cityNameAr} | دليل الرعاية الصحية المفتوح`,
    description: `ابحث عن مقدمي الرعاية الصحية في ${cityNameAr} حسب اللغة. تصفح الأطباء والعيادات بطاقم يتحدث العربية والإنجليزية والهندية والأردية و١٥+ لغة أخرى. آخر تحقق مارس 2026.`,
    alternates: {
      canonical: `${base}/ar/directory/${city.slug}/language`,
      languages: {
        "en-AE": `${base}/directory/${city.slug}/language`,
        "ar-AE": `${base}/ar/directory/${city.slug}/language`,
      },
    },
  };
}

export default async function ArabicLanguageIndexPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const languages = getLanguagesList();
  const base = getBaseUrl();
  const cityNameAr = getArabicCityName(city.slug);

  const langCounts = await Promise.all(
    languages.map((lang) => getProviderCountByLanguage(lang.slug, city.slug))
  );
  const langCountMap = Object.fromEntries(languages.map((l, i) => [l.slug, langCounts[i]]));

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: ar.home, url: `${base}/ar` },
        { name: cityNameAr, url: `${base}/ar/directory/${city.slug}` },
        { name: ar.languageFilter },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/ar" className="hover:text-accent transition-colors">{ar.home}</Link>
        <span>/</span>
        <Link href={`/ar/directory/${city.slug}`} className="hover:text-accent transition-colors">{cityNameAr}</Link>
        <span>/</span>
        <span className="text-dark font-medium">{ar.languageFilter}</span>
      </nav>

      <h1 className="text-3xl font-bold text-dark mb-2">
        اللغات المتوفرة لدى مقدمي الرعاية الصحية في {cityNameAr}
      </h1>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          وفقاً لدليل الرعاية الصحية المفتوح في الإمارات، يقدم مقدمو الرعاية الصحية في {cityNameAr} خدماتهم بأكثر من {languages.length} لغة، مما يعكس التنوع الثقافي في الإمارات. سواء كنت بحاجة إلى طبيب يتحدث العربية أو الإنجليزية أو الهندية أو الأردية أو أي لغة أخرى، يساعدك دليلنا في العثور على المقدم المناسب. البيانات مصدرها السجلات الحكومية الرسمية، آخر تحقق مارس 2026.
        </p>
      </div>

      <div className="section-header">
        <h2>{ar.browseByLanguage}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang) => {
          const count = langCountMap[lang.slug] ?? 0;
          const langNameAr = getArabicLanguageName(lang.slug);
          return (
            <Link
              key={lang.slug}
              href={`/ar/directory/${city.slug}/language/${lang.slug}`}
              className="block border border-light-200 p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-dark text-sm">{langNameAr}</h3>
                <span className="text-muted text-xs">{lang.nativeName}</span>
              </div>
              <p className="text-xs font-bold text-accent">
                {count} {count === 1 ? ar.provider : ar.providerPlural}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Language Switch */}
      <div className="text-center pt-6 pb-8">
        <Link href={`/directory/${city.slug}/language`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
