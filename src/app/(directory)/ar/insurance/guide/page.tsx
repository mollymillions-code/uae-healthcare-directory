import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const GUIDES = [
  {
    slug: "freelancer-health-insurance",
    title: "التأمين الصحي للمستقلين والمقيمين الكفلاء لأنفسهم في الإمارات",
    description:
      "من يحتاج إلى تأمين ذاتي الكفالة، وكيفية الحصول عليه، وأرخص الخيارات المتوافقة مع DHA وDOH، وما يجب على حاملي تصاريح العمل الحر معرفته بشأن التغطية الإلزامية.",
  },
  {
    slug: "maternity-insurance-uae",
    title: "التأمين الصحي للأمومة في الإمارات — التغطية وفترات الانتظار وأفضل الخطط",
    description:
      "فترات الانتظار لدى كل شركة تأمين، وما هو مشمول بالتغطية وما هو مستثنى، وتغطية الولادة القيصرية ورعاية المولود الجديد، وكيفية اختيار أفضل خطة أمومة لاحتياجاتك.",
  },
  {
    slug: "how-to-claim-health-insurance",
    title: "كيفية تقديم مطالبة تأمين صحي في الإمارات — خطوة بخطوة",
    description:
      "الفوترة المباشرة مقابل السداد المسترد، والمستندات المطلوبة، والجداول الزمنية للمعالجة، وكيفية الاعتراض على مطالبة مرفوضة لدى شركة التأمين.",
  },
  {
    slug: "domestic-worker-insurance",
    title: "التأمين الصحي للعمالة المنزلية في الإمارات — متطلبات صاحب العمل",
    description:
      "المتطلبات القانونية لتغطية العمالة المنزلية، والحد الأدنى من المزايا، وأرخص الخطط المتوافقة مع اللوائح، والعقوبات المترتبة على عدم الامتثال.",
  },
  {
    slug: "switching-health-insurance",
    title: "كيفية تغيير شركة التأمين الصحي في الإمارات",
    description:
      "متى يحق لك التحويل، وكيف تنتقل الحالات الصحية السابقة إلى الخطة الجديدة، وقواعد استمرارية التغطية، والفرق بين الخطط المدعومة من صاحب العمل والخطط التي يشتريها الفرد بنفسه.",
  },
];

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "أدلة التأمين الصحي — الإمارات | Zavis",
    description:
      "أدلة معمّقة حول التأمين الصحي في الإمارات العربية المتحدة. تعرّف على تأمين المستقلين وتغطية الأمومة وتقديم المطالبات ومتطلبات العمالة المنزلية وتغيير شركات التأمين.",
    alternates: {
      canonical: `${base}/ar/insurance/guide`,
      languages: {
        "en-AE": `${base}/insurance/guide`,
        "ar-AE": `${base}/ar/insurance/guide`,
      },
    },
    openGraph: {
      title: "أدلة التأمين الصحي — الإمارات",
      description:
        "أدلة عملية ومعمّقة تغطي جميع جوانب التأمين الصحي في الإمارات العربية المتحدة.",
      url: `${base}/ar/insurance/guide`,
      type: "website",
    },
  };
}

export default function ArabicInsuranceGuideIndexPage() {
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema([
        { name: "الإمارات", url: `${base}/ar` },
        { name: "دليل التأمين الصحي", url: `${base}/ar/insurance` },
        { name: "الأدلة الإرشادية" },
      ])} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb items={[
        { label: "الإمارات", href: "/ar" },
        { label: "دليل التأمين الصحي", href: "/ar/insurance" },
        { label: "الأدلة الإرشادية" },
      ]} />

      <h1 className="text-3xl font-bold text-dark mb-2">
        أدلة التأمين الصحي — الإمارات
      </h1>
      <p className="text-sm text-muted mb-4">
        {GUIDES.length} أدلة معمّقة · آخر تحديث مارس ٢٠٢٦
      </p>

      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          تتناول هذه الأدلة أكثر الأسئلة شيوعاً حول التأمين الصحي في الإمارات العربية المتحدة — من اختيار الخطة المناسبة للمستقلين والمقيمين الكفلاء لأنفسهم، إلى فهم فترات انتظار تغطية الأمومة، وتقديم المطالبات، وتأمين العمالة المنزلية، وتغيير شركات التأمين خلال العام. كل دليل مكتوب للمقيمين في الإمارات ويستند إلى لوائح DHA وDOH وMOHAP.
        </p>
      </div>

      <div className="section-header">
        <h2>جميع الأدلة</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/ar/insurance/guide/${guide.slug}`}
            className="block border border-light-200 p-5 hover:border-accent transition-colors group"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-dark text-sm mb-1 group-hover:text-accent transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {guide.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-2">
                  اقرأ الدليل <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* رابط العودة إلى دليل التأمين */}
      <div className="mt-8 pt-6 border-t border-light-200">
        <Link
          href="/ar/insurance"
          className="text-sm font-medium text-accent hover:underline"
        >
          &larr; العودة إلى دليل التأمين الصحي
        </Link>
      </div>
    </div>
  );
}
