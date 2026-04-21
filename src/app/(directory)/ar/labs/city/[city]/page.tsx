import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  MapPin,
  Home,
  ChevronLeft,
  TrendingDown,
  Activity,
  Microscope,
  BarChart3,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_TESTS,
  TEST_CATEGORIES,
  getLabsByCity,
  getPricesForLab,
  getPackagesForLab,
  getPriceRange,
  getTestsByCategory,
  formatPrice,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ar, getArabicCityName } from "@/lib/i18n";

// ─── Static Params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export const revalidate = 43200;

// ─── City-Specific Editorial Content (Arabic) ────────────────────────────────

interface CityLabContentAr {
  regulator: string;
  regulatorAbbrev: string;
  intro: string;
  deepDive: string;
  popularAreas: string[];
  visaMedical: string;
  insuranceTip: string;
  cbcFrom: number;
  vitaminDFrom: number;
  homeCollectionNote: string;
}

const CITY_LAB_CONTENT_AR: Record<string, CityLabContentAr> = {
  dubai: {
    regulator: "هيئة الصحة بدبي (DHA)",
    regulatorAbbrev: "DHA",
    intro:
      "تمتلك دبي أكثر الأسواق المخبرية تنافسية في الإمارات، إذ تضم أكثر من اثني عشر مختبرًا تشخيصيًا مرخصًا من DHA تغطي جميع الفئات السعرية. تبقى الديرة وبر دبي الوجهة المفضلة للمرضى الباحثين عن أسعار معقولة — إذ كثيرًا ما تتجاوز المختبرات المستقلة هنا مختبرات المستشفيات بخصم يتراوح بين 30% و50%. وفي القطاع المتميز، تستضيف مدينة دبي للرعاية الصحية (DHCC) سلاسل دولية كـ Unilabs وMenaLabs تستقطب محترفي DIFC ومرضى السياحة العلاجية. كما تخدم منصات السحب المنزلي كـ DarDoc المقيمين في JLT ومارينا دبي وبيزنس باي، حيث تنتشر ممرضات معتمدات من DHA يوميًا من الساعة 7 صباحًا حتى 11 مساءً.",
    deepDive:
      "تخضع الفحوصات المخبرية في دبي لإشراف هيئة الصحة بدبي (DHA)، التي تُلزم جميع المرافق التشخيصية العاملة في الإمارة باستيفاء معايير الجودة والحصول على الترخيص اللازم. ويتعين على جميع المختبرات المرخصة الامتثال لمعايير المختبرات السريرية الصادرة عن DHA، وكثير من السلاسل الكبرى تحمل اعتمادات دولية إضافية كـ CAP (الكلية الأمريكية لعلماء الأمراض) وISO 15189 وJCI، مما يضمن دقة الفحوصات على مستوى المختبرات الأوروبية والأمريكية. وبالنسبة لفحوصات الدم الاعتيادية (CBC، ولوحة الدهون، ووظائف الكبد والكلى)، تتراوح أسعار الزيارات المباشرة في المختبرات المستقلة في الديرة والكرامة والقوز بين AED 69 وAED 99 لفحص CBC، وبين AED 85 وAED 120 لفحص فيتامين D. في المقابل، قد تتقاضى مختبرات المستشفيات في جميرا ووسط المدينة ضعف هذه الأسعار أو ثلاثة أضعافها مقابل فحوصات متطابقة. تُعدّ فحوصات التأشيرة الطبية — شرط إلزامي للمقيمين الجدد في الإمارات — ومعالجتها في مراكز معتمدة من DHA كمستوصفي الراشدية وبر دبي، وتتراوح تكلفتها عادةً بين AED 320 وAED 380 شاملةً كل شيء. وتتوفر خدمة السحب المنزلي على نطاق واسع في جميع أحياء دبي، إذ يضمن معظم مزوديها وصول فني سحب الدم خلال 60 دقيقة. وتُسلَّم نتائج الفحوصات الاعتيادية رقميًا في غضون 4 إلى 24 ساعة.",
    popularAreas: ["الديرة", "بر دبي", "الكرامة", "مدينة دبي للرعاية الصحية", "JLT", "بيزنس باي"],
    visaMedical:
      "تُجرى فحوصات التأشيرة الطبية في دبي في مراكز الطب الوقائي المعتمدة من DHA في الراشدية وبر دبي والقوز. تشمل باقة الفحص القياسية (فصيلة الدم، والأشعة السينية للصدر، وفيروس نقص المناعة البشري، والتهاب الكبد B، والسل) وتكلف بين AED 320 وAED 380. يمكن حجز المواعيد عبر تطبيق DHA (سلامة) أو مراكز خدمة عامر.",
    insuranceTip:
      "تقبل معظم المختبرات المرخصة من DHA في دبي تأمينات Daman وAXA وCigna وBupa وشركة دبي للتأمين. بالنسبة لحاملي بطاقة ثقة (خطة الحكومة في أبوظبي)، تقتصر التغطية عادةً على المرافق المرخصة من DOH ما لم تتضمن الخطة مزايا خارج الإمارة. احرص دائمًا على التأكد من قبول التأمين عند الحجز.",
    cbcFrom: 69,
    vitaminDFrom: 85,
    homeCollectionNote:
      "تعمل خدمات DarDoc وServiceMarket وHealthchecks360 في مجال السحب المنزلي بدبي يوميًا من الساعة 7 صباحًا. كثير منها يوفر خدمة سحب العينات مجانًا مع إرسال النتائج مباشرةً إلى هاتفك.",
  },
  "abu-dhabi": {
    regulator: "دائرة الصحة - أبوظبي (DOH)",
    regulatorAbbrev: "DOH",
    intro:
      "يرتكز النظام المخبري في أبوظبي على مؤسستين رائدتين: المختبر الوطني المرجعي (NRL)، التابع لشبكة M42/مبادلة الصحية والمختبر المرجعي الرئيسي في العاصمة للتشخيصات المعقدة، وPureLab — أكبر مختبر مستقل مدعوم بالذكاء الاصطناعي في الإمارات بمساحة 70,000 قدم مربع في مدينة أبوظبي الصناعية، وقادر على معالجة 30 مليون عينة سنويًا. ولسكان جزيرة الريم وجزيرة المارية ومدينة خليفة، يوفر كلا المختبرين خدمة السحب المنزلي. وتُكمل MenaLabs (Cerba HealthCare) وMedsol Diagnostics المنظومة بأسعار زيارات مباشرة أكثر سهولة في الوصول.",
    deepDive:
      "تعمل جميع المختبرات التشخيصية في أبوظبي وفق إطار الترخيص الصادر عن دائرة الصحة (DOH)، التي تضع معايير صارمة للأجهزة ومؤهلات الكوادر البشرية ومدد الإبلاغ عن النتائج. تتمتع الإمارة بأعلى معدلات تغطية تأمين ثقة (الموظفين الحكوميين) في الإمارات، وكثير من المختبرات مدرجة في شبكة Daman — نظام التأمين الصحي الإلزامي المنظَّم من DOH. يُعدّ NRL المختبر المرجعي الافتراضي للأعمال التشخيصية المعقدة والمتخصصة والجزيئية، ويستقبل الطلبات الفائضة من العيادات والمستشفيات في أبوظبي والعين. أما PureLab، الذي أُسس عام 2023 تحت مظلة PureHealth (أكبر مجموعة رعاية صحية في الشرق الأوسط)، فقد أدخل تدقيق الجودة بالذكاء الاصطناعي لتقليل معدلات الخطأ وأوقات المعالجة — وكثيرًا ما تكون الفحوصات الاعتيادية جاهزة في 12 ساعة، وهو أسرع من متوسط الإمارات. للمقيمين في مدينة محمد بن زايد ومدينة خليفة والشامخة، يُعدّ السحب المنزلي عبر NRL أو DarDoc (المرخص من DOH) الخيار الأكثر عملية. تُعالَج الفحوصات الطبية للتأشيرة في أبوظبي في مراكز معتمدة من ADPH، مستقلة عن المختبرات السريرية الاعتيادية.",
    popularAreas: ["الكورنيش", "جزيرة الريم", "مدينة خليفة", "المشرف", "مدينة محمد بن زايد"],
    visaMedical:
      "تُجرى الفحوصات الطبية لتأشيرة الإقامة في أبوظبي في مراكز الفحص المعتمدة من مركز أبوظبي للصحة العامة (ADPHC). تشمل الباقة القياسية — فحوصات الدم، والأشعة السينية للصدر، وفحص الأمراض المعدية — وتكلف بين AED 330 وAED 400. يمكن الحجز عبر تطبيق ADPHC أو منصة خدمات تمّ.",
    insuranceTip:
      "في أبوظبي، يحظى حاملو بطاقة ثقة (الموظفون الحكوميون) والمؤمَّن عليهم بضمان أساسي بتغطية لفحوصات الدم في المرافق المرخصة من DOH. معظم المختبرات الكبرى — NRL وPureLab وMenaLabs — مدرجة في شبكة Daman. وتقبل Al Borg Diagnostics أيضًا بطاقة ثقة للفحوصات المؤهلة. تأكد من مزودك التأميني ما إذا كان الفحص المحدد يستلزم الحصول على تفويض مسبق.",
    cbcFrom: 75,
    vitaminDFrom: 90,
    homeCollectionNote:
      "يوفر كل من NRL وDarDoc خدمة السحب المنزلي في جزيرة أبوظبي والضواحي. كما يتيح PureLab خدمة سحب العينات المتنقلة. تتقاضى NRL رسوم سحب منزلي AED 75، فيما تقدم DarDoc الخدمة مجانًا لمعظم الباقات.",
  },
  sharjah: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "تقدم الشارقة بعض أوفر خيارات الفحوصات المخبرية في الإمارات، مع تركّز المختبرات المستقلة المرخصة من MOHAP في النهدة والماجد والتعاون — وهي مناطق في متناول سكان دبي الذين يتنقلون عبر طريق E311 أو طريق الاتحاد. تُهيمن Thumbay Labs، ومقرها عجمان مع حضور قوي في الشارقة، على هذا السوق؛ فيما تتيح Medsol Diagnostics وHealthchecks360 خيارات اقتصادية للزيارة المباشرة والسحب المنزلي. شهدت مناطق المويلح ومدينة الجامعة بالقرب من جامعة الشارقة الأمريكية طلبًا متناميًا على الخدمات المخبرية المناسبة للوافدين.",
    deepDive:
      "ترخّص MOHAP وتُفتش جميع المختبرات التشخيصية العاملة في الشارقة والإمارات الشمالية، وتُطبّق معايير الجودة الوطنية للمختبرات السريرية. تنعكس تكاليف الإيجار المنخفضة في الشارقة مقارنةً بدبي مباشرةً على أسعار مخبرية أكثر تنافسية — إذ يتراوح سعر CBC بين AED 60 وAED 85 في المختبرات المستقلة هنا، مقابل AED 69 إلى AED 120 في دبي. وبالنسبة للمقيمين المتنقلين بين دبي والشارقة، تقبل بعض مختبرات النهدة مرضى موجَّهين من DHA والزيارات المباشرة على حد سواء. وتوفر Thumbay Labs (المعتمدة من CAP، التابعة لمجموعة Thumbay التعليمية الطبية) أفضل مزيج من جودة الاعتماد والأسعار المناسبة في الإمارة. وتعمل Healthchecks360 في الشارقة لتقديم خدمة السحب المنزلي، مما يجعلها خيارًا عمليًا لسكان التعاون والخان ممن يفضلون عدم التنقل. تُعالج مراكز الفحص الطبي المعتمدة من MOHAP في الشارقة فحوصات تأشيرة الإقامة بحوالي AED 300 إلى AED 350، بأسعار أقل من دبي.",
    popularAreas: ["النهدة", "الماجد", "التعاون", "المويلح", "القاسمية"],
    visaMedical:
      "تُعالج فحوصات تأشيرة الإقامة في الشارقة في مراكز صحية معتمدة من MOHAP. تشمل الباقة القياسية (فصيلة الدم، وفيروس نقص المناعة البشري، والتهاب الكبد B، والأشعة السينية للصدر، والسل) وتكلف بين AED 300 وAED 350. تكون المعالجة في يوم المراجعة في معظم المراكز.",
    insuranceTip:
      "في الشارقة، تغطي معظم خطط التأمين الخاصة (AXA وCigna وتأمين عُمان) فحوصات الدم في المرافق المرخصة من MOHAP. غير أن بطاقات ثقة للموظفين الحكوميين الصادرة في أبوظبي قد تكون ذات تغطية محدودة خارج المرافق المرخصة من DOH. راجع مدى تغطية وثيقتك بين الإمارات قبل الحجز.",
    cbcFrom: 60,
    vitaminDFrom: 80,
    homeCollectionNote:
      "تقدم Healthchecks360 وMedsol Diagnostics خدمة السحب المنزلي مجانًا في الشارقة. كما تغطي ServiceMarket أجزاءً من الشارقة لفحوصات الدم المنزلية.",
  },
  ajman: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "تحتضن عجمان المقر الرئيسي لـ Thumbay Labs — السلسلة المعتمدة من CAP والتابعة لجامعة الخليج الطبية، التي تستقطب المرضى من جميع أرجاء الإمارات الشمالية لما تجمعه من جودة الاعتماد وأسعار في متناول الجميع. تتوفر في الإمارة الصغيرة مختبرات مرخصة من MOHAP في النعيمية ووسط عجمان، وتستفيد من قربها من شبكة مختبرات الشارقة. كما تقدم Healthchecks360 خدمة السحب المنزلي في المناطق السكنية بعجمان.",
    deepDive:
      "تنظّم MOHAP جميع المختبرات السريرية في عجمان، وصغر مساحة الإمارة يعني أن معظم سكانها على بُعد 10 دقائق من مرفق تشخيصي مرخص. تقدم فرع Thumbay Labs الرئيسي في عجمان، الواقع بالقرب من مجمع مستشفى ثمبي في الجرف، أشمل قائمة فحوصات في الإمارة — تزيد على 1,000 فحص بمنهجية معتمدة من CAP. وللفحوصات الاعتيادية البسيطة والباقات الروتينية، تقدم المختبرات المستقلة للزيارات المباشرة في النعيمية والراشدية أسعارًا تنافسية أقل بنسبة 10-20% من نظيراتها في دبي للفحوصات ذاتها. وتُعدّ خدمة السحب المنزلي عبر Healthchecks360 عملية نظرًا لكثافة عجمان السكانية، إذ يصل فني السحب عادةً خلال 45 دقيقة. وتُعالج فحوصات تأشيرة الإقامة للعاملين في عجمان في مراكز معتمدة من MOHAP في المدينة، وكثيرًا ما تكون النتائج في اليوم ذاته.",
    popularAreas: ["النعيمية", "الجرف", "وسط عجمان", "الراشدية"],
    visaMedical:
      "تُجرى فحوصات تأشيرة الإقامة في عجمان في مراكز صحية معتمدة من MOHAP في النعيمية والجرف. تكلف الباقة القياسية بين AED 290 وAED 340، وهي في الغالب الأوفر في الإمارات.",
    insuranceTip:
      "تغطي معظم شركات التأمين ذات الشبكات الإماراتية الواسعة — AXA وCigna وBupa وتأمين عُمان — الفحوصات في مختبرات عجمان المرخصة من MOHAP. وتحظى Thumbay Labs بتغطية واسعة عبر شبكات التأمين المختلفة نظرًا لاعتمادها من CAP.",
    cbcFrom: 60,
    vitaminDFrom: 79,
    homeCollectionNote:
      "تغطي Healthchecks360 عجمان بخدمة سحب العينات المنزلية مجانًا. كما تقدم Thumbay Labs خدمة السحب المنزلي لباقات مختارة.",
  },
  "ras-al-khaimah": {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "يشهد قطاع الرعاية الصحية في رأس الخيمة نموًا متسارعًا، مع تشغيل Al Borg Diagnostics — أكبر سلسلة مختبرات في دول مجلس التعاون وشريك Quest Diagnostics الحصري — لفروع هنا إلى جانب مختبرات مستقلة مرخصة من MOHAP في النخيل ووسط المدينة. وموقع رأس الخيمة القريب من الفجيرة وأم القيوين يجعلها مركزًا تشخيصيًا إقليميًا للساحل الشرقي. تتوفر خدمة السحب المنزلي لكن بنطاق أضيق مما في دبي أو أبوظبي؛ يُنصح بالحجز المسبق.",
    deepDive:
      "تُشرف MOHAP على جميع تراخيص المختبرات السريرية في رأس الخيمة. عانت الإمارة تاريخيًا من ضعف البنية التحتية التشخيصية قياسًا بحجم سكانها، غير أن دخول Al Borg Diagnostics بمرافق معتمدة من ISO 15189 وCAP رفع سقف الجودة بشكل ملحوظ. تُسعَّر فحوصات الدم الاعتيادية في فروع Al Borg في رأس الخيمة بأسعار تنافسية — مماثلة عمومًا لأسعار المختبرات المستقلة في دبي. وللمقيمين في الحمرا والمناطق السياحية والصناعية المحيطة بها، يُعدّ السحب المنزلي عبر Al Borg الخيار الأكثر عملية (برسوم AED 50). وتتولى مختبرات مستشفى رأس الخيمة الحكومي التشخيصات الأكثر تعقيدًا، في حين تتيح المختبرات الخاصة معالجةً أسرع للفحوصات الاعتيادية. تُعالج مراكز الفحص الطبي المعتمدة من MOHAP في رأس الخيمة فحوصات تأشيرة الإقامة عادةً بتكلفة AED 300 إلى AED 360 مع نتائج في اليوم ذاته.",
    popularAreas: ["النخيل", "وسط مدينة رأس الخيمة", "الحمرا", "خزام"],
    visaMedical:
      "تُعالج فحوصات تأشيرة الإقامة في رأس الخيمة في مراكز صحية معتمدة من MOHAP في وسط المدينة. تكلف الفحوصات القياسية بين AED 300 وAED 360 مع معالجة في يوم التقديم لمعظم المتقدمين.",
    insuranceTip:
      "تعقد Al Borg Diagnostics عقودًا مع معظم شركات التأمين الكبرى في الإمارات، مما يجعلها الخيار الأأمن للمرضى المؤمَّن عليهم في رأس الخيمة. المختبرات المستقلة قد لا تكون مدرجة في جميع شبكات التأمين — تحقق قبل الحجز.",
    cbcFrom: 70,
    vitaminDFrom: 90,
    homeCollectionNote:
      "تقدم Al Borg Diagnostics خدمة السحب المنزلي في رأس الخيمة برسوم AED 50. وتغطي Healthchecks360 أجزاءً من رأس الخيمة ضمن عروضها المنزلية.",
  },
  fujairah: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "تُخدم الفجيرة، على الساحل الشرقي للإمارات، في المقام الأول من قِبَل مختبرات مرخصة من MOHAP ملحقة بمستشفى الفجيرة ومجموعة من العيادات الخاصة قرب وسط المدينة. لا تعمل Al Borg Diagnostics مباشرةً في الفجيرة بعد، إلا أن فروعها في رأس الخيمة متاحة للفحوصات غير العاجلة. وتغطي Thumbay Labs الفجيرة من خلال شبكتها في الإمارات الشمالية، مقدمةً أبرز خيار مختبري خاص معتمد في الإمارة.",
    deepDive:
      "ترخّص MOHAP جميع المختبرات التشخيصية في الفجيرة. يمتلك القطاع التجاري المخبري في الإمارة قطاعًا أصغر مما في دبي أو أبوظبي، إذ يتركز معظم حجم التشخيص في مختبر مستشفى الفجيرة وعدد من المختبرات الملحقة بعيادات خاصة. للمقيمين الذين يحتاجون إلى باقات شاملة — الغدة الدرقية الموسعة والهرمونات وعلامات الأورام — غالبًا ما يكون السفر إلى رأس الخيمة أو استخدام خدمات السحب المنزلي المجمّعة كـ Healthchecks360 (التي ترسل العينات إلى مختبرات شريكة في دبي أو الشارقة) الخيارَ الأكثر عملية. وتُعدّ Thumbay Labs، بحضورها في الإمارات الشمالية، السلسلة الخاصة المعتمدة الرئيسية للفحوصات التشخيصية الخاصة في المنطقة. تتوفر فحوصات الدم الاعتيادية — CBC ولوحة الدهون وفحص السكري — بأسعار MOHAP المرخصة التنافسية، وهي عمومًا أقل من أسعار دبي. تُعالج فحوصات التأشيرة الطبية للعاملين في الفجيرة في مراكز معتمدة من MOHAP في مدينة الفجيرة.",
    popularAreas: ["وسط مدينة الفجيرة", "دبا الفجيرة"],
    visaMedical:
      "تُعالج فحوصات تأشيرة الإقامة في الفجيرة في مراكز صحية معتمدة من MOHAP في المدينة. تستغرق المعالجة من يوم واحد إلى 24 ساعة للفحوصات القياسية عادةً.",
    insuranceTip:
      "في الفجيرة، تُعدّ Thumbay Labs الخيار الأأمن للمرضى المؤمَّن عليهم نظرًا لتغطيتها الواسعة عبر شبكات التأمين. بالنسبة للمختبرات المستقلة الأصغر، تحقق دائمًا من شبكة خطتك التأمينية قبل الحجز.",
    cbcFrom: 65,
    vitaminDFrom: 85,
    homeCollectionNote:
      "تغطي Healthchecks360 الفجيرة عبر شبكتها من الشركاء. يزور عملاء سحب العينات موقعك وتُعالَج العينات في مختبرات شريكة معتمدة في دبي أو الشارقة.",
  },
  "umm-al-quwain": {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    intro:
      "أم القيوين هي أقل إمارات الإمارات من حيث الكثافة السكانية، وتتمركز خدماتها التشخيصية في منطقة المدينة الرئيسية من خلال العيادات المرخصة من MOHAP والمنطقة الطبية في أم القيوين. للمقيمين الذين يحتاجون إلى باقات شاملة أو أعمال مخبرية معتمدة، تقع عجمان (Thumbay Labs) والشارقة على بُعد 20-30 دقيقة. وتخدم منصات السحب المنزلي كـ Healthchecks360 سكان أم القيوين من خلال شبكتها في الإمارات الشمالية.",
    deepDive:
      "تنظّم MOHAP الخدمات المخبرية في أم القيوين. يعني صغر مساحة الإمارة أن معظم الاحتياجات التشخيصية التي تتجاوز فحوصات الدم الأساسية تُلبَّى إما بالسفر إلى عجمان أو الشارقة، أو باستخدام خدمات السحب المنزلي المجمّعة الشريكة مع مختبرات مرخصة من DHA/MOHAP. أما للفحوصات الاعتيادية، فتتيح عيادات وسط مدينة أم القيوين أسعارًا مناسبة للزيارة المباشرة دون الحاجة للتنقل. تُعالج مراكز MOHAP للفحص الطبي في أم القيوين فحوصات تأشيرة الإقامة عادةً في غضون يوم واحد. تتوسع البنية التحتية الصحية في الإمارة ببطء مع تركيز الحكومة على توفير الرعاية الصحية الأولية؛ إذ تبقى التشخيصات المعقدة أكثر موثوقيةً عند الاستعانة بالإمارات الشمالية المجاورة.",
    popularAreas: ["وسط مدينة أم القيوين", "السلامة"],
    visaMedical:
      "تُعالج فحوصات تأشيرة الإقامة في أم القيوين في مراكز MOHAP الصحية في منطقة المدينة الرئيسية. تكلف الفحوصات القياسية حوالي AED 290 إلى AED 320.",
    insuranceTip:
      "للمرضى المؤمَّن عليهم في أم القيوين، يضمن استخدام خدمة السحب المنزلي الشريكة مع مختبرات مرخصة من DHA/MOHAP معالجة فحوصاتك في مرفق يعترف به مزودك التأميني. تأكد دائمًا من مزود التأمين الخاص بك.",
    cbcFrom: 65,
    vitaminDFrom: 82,
    homeCollectionNote:
      "تغطي Healthchecks360 أم القيوين من خلال شبكتها للسحب المنزلي في الإمارات الشمالية. تُعالَج النتائج في المختبرات الشريكة في دبي أو الشارقة وتُسلَّم رقميًا.",
  },
  "al-ain": {
    regulator: "دائرة الصحة - أبوظبي (DOH)",
    regulatorAbbrev: "DOH",
    intro:
      "تُخدم العين، مدينة الحدائق في الإمارات، من قِبَل المختبر الوطني المرجعي (NRL) — التابع لشبكة مبادلة الصحية / M42 — بفروع تغطي الأحياء الرئيسية في المدينة. أما مستشفى توام، المركز المرجعي الثالثي في المنطقة والمنتسب لـ Johns Hopkins Medicine، فيمتلك مختبرًا داخليًا للتشخيصات المعقدة. وتُشغّل Al Borg Diagnostics فروعًا في العين لفحوصات الدم الاعتيادية، مقدمةً فحوصات معتمدة من CAP بأسعار مقاربة لأسعار أبوظبي.",
    deepDive:
      "تعمل جميع المختبرات السريرية في العين وفق إطار الترخيص الصادر عن دائرة الصحة أبوظبي (DOH) — الجهة التنظيمية ذاتها في العاصمة، مما يعكس مكانة العين بوصفها المدينة الثانية في إمارة أبوظبي. تعمل فروع NRL في العين كمختبر مرجعي رئيسي للمنطقة، وتستقبل الطلبات الفائضة من مستشفى توام وشبكة العيادات الخاصة في الجيمي والمويجعي ومركز العين. بالنسبة لحاملي ثقة المؤمَّن عليهم من DOH، يُعدّ كل من NRL وAl Borg مرافق متعاقدة. يتيح Al Borg أسهل أسعار للزيارات المباشرة للفحوصات الاعتيادية في العين، بينما يتولى NRL الأعمال التشخيصية الجزيئية والجينية والمتخصصة الأكثر تعقيدًا. يتوفر السحب المنزلي عبر NRL (برسوم AED 75) وDarDoc (المرخص من DOH في إمارة أبوظبي بما تشمل العين). وتُسعَّر الفحوصات الاعتيادية كـ CBC ولوحة الدهون وفيتامين D بمستوى مماثل لمختبرات جزيرة أبوظبي، إذ يتراوح CBC بين AED 75 وAED 90، وفيتامين D بين AED 90 وAED 120.",
    popularAreas: ["مركز العين", "الجيمي", "المويجعي", "توام", "الهيلي"],
    visaMedical:
      "تُجرى فحوصات تأشيرة الإقامة في العين في مراكز الفحص المعتمدة من ADPHC في المدينة. تكلف الباقة القياسية بين AED 330 وAED 400، وهي متسقة مع أسعار إمارة أبوظبي.",
    insuranceTip:
      "تغطي بطاقة ثقة (تأمين موظفي حكومة أبوظبي) فحوصات الدم في فروع NRL وAl Borg المرخصة من DOH في العين. ينبغي لحاملي Daman Basic التأكد من التغطية في الفرع المحدد قبل الحجز. تقبل معظم شركات التأمين الخاصة الكبرى Al Borg وNRL.",
    cbcFrom: 75,
    vitaminDFrom: 90,
    homeCollectionNote:
      "تقدم NRL خدمة السحب المنزلي في العين برسوم AED 75. وتعمل DarDoc في إمارة أبوظبي (بما تشمل العين) بخدمة سحب منزلي مجانية لمعظم الباقات.",
  },
};

// Top 6 featured tests per city page
const FEATURED_TEST_SLUGS = [
  "cbc",
  "vitamin-d",
  "lipid-profile",
  "thyroid-panel",
  "hba1c",
  "lft",
];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const base = getBaseUrl();
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return {};

  const labs = getLabsByCity(citySlug);
  const content = CITY_LAB_CONTENT_AR[citySlug];
  const testCount = LAB_TESTS.length;
  const homeCollectionCount = labs.filter((l) => l.homeCollection).length;
  const cbcFrom = content?.cbcFrom ?? 69;
  const regulator = content?.regulatorAbbrev ?? "MOHAP";
  const cityNameAr = getArabicCityName(citySlug);

  return {
    title: `الفحوصات المخبرية في ${cityNameAr} — مقارنة الأسعار عبر ${labs.length} مختبر | مقارنة أسعار الفحوصات المخبرية في الإمارات`,
    description: `قارن أسعار ${testCount} فحصاً مخبرياً عبر ${labs.length} مختبرًا تشخيصيًا في ${cityNameAr}، الإمارات. CBC من AED ${cbcFrom}. يوفر ${homeCollectionCount} مختبر خدمة السحب المنزلي. مرخص من ${regulator}. اعثر على أرخص فحص دم في ${cityNameAr}.`,
    alternates: {
      canonical: `${base}/ar/labs/city/${citySlug}`,
      languages: {
        "en-AE": `${base}/labs/city/${citySlug}`,
        "ar-AE": `${base}/ar/labs/city/${citySlug}`,
      },
    },
    openGraph: {
      title: `الفحوصات المخبرية في ${cityNameAr} — مقارنة الأسعار عبر ${labs.length} مختبر`,
      description: `قارن أسعار ${testCount} فحصاً مخبرياً عبر ${labs.length} مختبرًا تشخيصيًا مرخصًا من ${regulator} في ${cityNameAr}، الإمارات. خدمة السحب المنزلي متاحة.`,
      url: `${base}/ar/labs/city/${citySlug}`,
      type: "website",
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ArabicLabCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const base = getBaseUrl();

  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) notFound();

  const labs = getLabsByCity(citySlug);
  if (labs.length === 0) notFound();

  const content = CITY_LAB_CONTENT_AR[citySlug];
  const cityNameAr = getArabicCityName(citySlug);
  const homeCollectionLabs = labs.filter((l) => l.homeCollection);

  // Cheapest price across all labs in this city
  const allCityPrices = labs.flatMap((lab) => getPricesForLab(lab.slug));
  const cheapestCityPrice =
    allCityPrices.length > 0
      ? Math.min(...allCityPrices.map((p) => p.price))
      : null;

  // Featured tests with price ranges
  const featuredTests = FEATURED_TEST_SLUGS.map((slug) => {
    const test = LAB_TESTS.find((t) => t.slug === slug);
    if (!test) return null;
    const range = getPriceRange(slug);
    return { ...test, priceRange: range };
  }).filter(Boolean) as (typeof LAB_TESTS[number] & {
    priceRange: ReturnType<typeof getPriceRange>;
  })[];

  // Category test counts
  const categoryTestCounts = TEST_CATEGORIES.map((cat) => ({
    ...cat,
    testCount: getTestsByCategory(cat.slug).length,
  }));

  // FAQ — city-specific, fully in Arabic
  const faqs = [
    {
      question: `كم تبلغ تكلفة فحص الدم في ${cityNameAr}؟`,
      answer: `تبدأ أسعار فحوصات الدم في ${cityNameAr} من AED ${content?.cbcFrom ?? 69} لفحص CBC الأساسي (تعداد الدم الكامل) في المختبرات التشخيصية المستقلة. ويبدأ فحص فيتامين D من AED ${content?.vitaminDFrom ?? 85}. تتوفر باقات الفحص الصحي الشامل التي تغطي CBC ولوحة الدهون والجلوكوز ووظائف الكبد والكلى من AED 99 إلى AED 150 في المختبرات الاقتصادية، ومن AED 299 إلى AED 499 لباقات العافية المتميزة. وعادةً ما تتقاضى مختبرات المستشفيات ما بين 30% و50% أكثر من السلاسل المستقلة مقابل الفحوصات ذاتها. جميع المختبرات في ${cityNameAr} مرخصة من ${content?.regulator ?? "الجهة الصحية المختصة في الإمارات"}.`,
    },
    {
      question: `هل يمكنني إجراء فحص دم في المنزل في ${cityNameAr}؟`,
      answer: `نعم. ${content?.homeCollectionNote ?? `خدمة سحب عينات الدم المنزلية متاحة في ${cityNameAr} عبر مزودين متعددين مرخصين من DHA/MOHAP. يزور فني مختبر معتمد موقعك لسحب العينات وتُسلَّم النتائج رقميًا خلال 24 ساعة.`} تعمل معظم خدمات السحب المنزلي يوميًا من الساعة 7 صباحًا حتى 10 أو 11 مساءً. السحب المنزلي مجاني في عدد من المختبرات بينها Medsol Diagnostics وThumboy Labs. يتقاضى بعض المزودين رسوم زيارة تتراوح بين AED 50 وAED 100.`,
    },
    {
      question: `هل أحتاج إلى وصفة طبية لإجراء فحوصات المختبر في ${cityNameAr}؟`,
      answer: `لا، تقبل معظم المختبرات التشخيصية المستقلة في ${cityNameAr} مرضى الزيارة المباشرة دون وصفة طبية للفحوصات الاعتيادية. فحوصات CBC وفيتامين D وHbA1c ولوحة الغدة الدرقية ولوحة الدهون ووظائف الكبد متاحة جميعها مباشرةً. وتعمل خدمات السحب المنزلي كـ DarDoc وHealthchecks360 أيضًا دون الحاجة لوصفة طبية. بعض الفحوصات المتخصصة — كالفحص الجيني وتشخيص الجزيئيات وبعض باقات الهرمونات ومعالجة الخزعات — قد تستلزم إحالة من طبيب. أما مختبرات المستشفيات في ${cityNameAr} فتشترط عادةً إحالة داخلية من استشاري المستشفى.`,
    },
    {
      question: `كيف تُنظَّم المختبرات في ${cityNameAr}؟`,
      answer: `تخضع جميع المختبرات التشخيصية في ${cityNameAr} لترخيص وتفتيش من قِبَل ${content?.regulator ?? "الجهة الصحية المختصة في الإمارات"}. تضع الجهة التنظيمية معايير لمعايرة الأجهزة ومؤهلات الكوادر وإجراءات تداول العينات ومدد الإبلاغ عن النتائج وإجراءات مراقبة الجودة. كثير من المختبرات تحمل اعتمادات دولية إضافية فوق الترخيص الإلزامي من ${content?.regulatorAbbrev ?? "الإمارات"} — منها اعتماد CAP (الكلية الأمريكية لعلماء الأمراض) وISO 15189 (معيار الجودة للمختبرات الطبية) وفي بعض الحالات شهادة JCI (اللجنة الدولية المشتركة). هذه الاعتمادات الدولية طوعية لكنها تُعدّ مؤشرًا على الجودة المتميزة.`,
    },
    {
      question: `أين أجري الفحص الطبي للتأشيرة في ${cityNameAr}؟`,
      answer: `${content?.visaMedical ?? `تُجرى الفحوصات الطبية للتأشيرة في ${cityNameAr} في مراكز الفحص الصحي المعتمدة حكوميًا. تشمل الباقة القياسية فصيلة الدم وفحص فيروس نقص المناعة البشري وفحص التهاب الكبد B والأشعة السينية للصدر وفحص السل. تتراوح الأسعار عادةً بين AED 300 وAED 400 بحسب الإمارة. المعالجة في يوم التقديم عادةً لطلبات تأشيرة الإقامة القياسية.`}`,
    },
    {
      question: `أي المختبرات في ${cityNameAr} تقبل التأمين الصحي؟`,
      answer: `${content?.insuranceTip ?? `تقبل معظم المختبرات التشخيصية الكبرى في ${cityNameAr} خطط التأمين الإماراتية الشائعة كـ Daman وAXA وCigna وBupa وتأمين عُمان. تأكد دائمًا أن فحصك المحدد مشمول بخطتك وأن المختبر مدرج في شبكة مزودك التأميني قبل الحجز. بعض الفحوصات قد تستلزم تفويضًا مسبقًا من شركة التأمين.`} أما للمرضى الذين يدفعون نقدًا، فتتيح المختبرات المستقلة بوجه عام أسعارًا أكثر تنافسيةً من مختبرات المستشفيات للفحوصات الدموية الاعتيادية.`,
    },
  ];

  // Schema data
  const breadcrumbItems = [
    { name: ar.home, url: `${base}/ar` },
    { name: "مقارنة أسعار الفحوصات المخبرية", url: `${base}/ar/labs` },
    { name: `المختبرات في ${cityNameAr}` },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `المختبرات التشخيصية في ${cityNameAr}، الإمارات العربية المتحدة`,
    description: `قارن أسعار ${LAB_TESTS.length} فحصاً مخبرياً عبر ${labs.length} مختبرًا تشخيصيًا مرخصًا من ${content?.regulatorAbbrev ?? "MOHAP"} في ${cityNameAr}، الإمارات.`,
    url: `${base}/ar/labs/city/${citySlug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: labs.length,
      itemListElement: labs.map((lab, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "MedicalOrganization",
          name: lab.name,
          url: `${base}/labs/${lab.slug}`,
          description: lab.description,
          address: {
            "@type": "PostalAddress",
            addressLocality: city.name,
            addressRegion: city.emirate,
            addressCountry: "AE",
          },
        },
      })),
    },
  };

  return (
    <div className="font-arabic container-tc py-8" dir="rtl" lang="ar">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={collectionPageSchema} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: ar.home, href: "/ar" },
          { label: "مقارنة أسعار الفحوصات المخبرية", href: "/ar/labs" },
          { label: cityNameAr },
        ]}
      />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <FlaskConical className="w-8 h-8 text-accent flex-shrink-0" />
          <h1 className="text-3xl font-bold text-dark">
            الفحوصات المخبرية في {cityNameAr} — مقارنة الأسعار عبر {labs.length} مختبر
          </h1>
        </div>

        {/* Answer block 1 — short editorial intro */}
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {content?.intro ??
              `قارن أسعار الفحوصات المخبرية عبر ${labs.length} مختبرًا تشخيصيًا مرخصًا من ${content?.regulatorAbbrev ?? "MOHAP"} في ${cityNameAr}، الإمارات. CBC من AED ${content?.cbcFrom ?? 69}. فيتامين D من AED ${content?.vitaminDFrom ?? 85}. يوفر ${homeCollectionLabs.length} مختبر خدمة السحب المنزلي — مجانًا في كثير من الأحيان.`}
          </p>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Microscope className="w-4 h-4" />,
              value: labs.length.toString(),
              label: `مختبر في ${cityNameAr}`,
            },
            {
              icon: <Activity className="w-4 h-4" />,
              value: LAB_TESTS.length.toString(),
              label: "فحص متاح",
            },
            {
              icon: <TrendingDown className="w-4 h-4" />,
              value: cheapestCityPrice
                ? formatPrice(cheapestCityPrice)
                : `AED ${content?.cbcFrom ?? 69}`,
              label: "أرخص فحص من",
            },
            {
              icon: <Home className="w-4 h-4" />,
              value: homeCollectionLabs.length.toString(),
              label: "مع خدمة السحب المنزلي",
            },
          ].map(({ icon, value, label }) => (
            <div
              key={label}
              className="bg-light-50 border border-black/[0.06] p-4 text-center"
            >
              <div className="flex justify-center mb-1 text-accent">{icon}</div>
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Labs in City ──────────────────────────────────── */}
      <div className="section-header">
        <h2>المختبرات في {cityNameAr}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        جميع المختبرات التشخيصية الـ {labs.length} أدناه مرخصة من{" "}
        {content?.regulator ?? "الجهة الصحية المختصة في الإمارات"} وتعمل في{" "}
        {cityNameAr}. انقر على أي مختبر لمقارنة قائمة فحوصاته الكاملة وأسعاره.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {labs.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest =
            prices.length > 0
              ? Math.min(...prices.map((p) => p.price))
              : undefined;
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

      {/* ── Section: Test Categories ───────────────────────────────── */}
      <div className="section-header">
        <h2>تصفح حسب فئة الفحص</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        تصفح الفحوصات حسب الفئة. تعرض كل صفحة فئة أسعار ذلك النوع من الفحوصات عبر جميع المختبرات الـ {labs.length} في {cityNameAr}.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {categoryTestCounts.map((cat) => (
          <Link
            key={cat.slug}
            href={`/labs/city/${citySlug}/${cat.slug}`}
            className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {cat.name}
              </h3>
              <ChevronLeft className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <p className="text-[11px] text-muted">{cat.testCount} فحص</p>
          </Link>
        ))}
      </div>

      {/* ── Section: Popular Tests in City ────────────────────────── */}
      <div className="section-header">
        <h2>الفحوصات الأكثر طلباً وأسعارها في {cityNameAr}</h2>
        <span className="arrows">&lt;&lt;&lt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        الفحوصات المخبرية الأكثر طلبًا في {cityNameAr}. انقر على أي فحص لمقارنة أسعاره عبر جميع المختبرات المرخصة من {content?.regulatorAbbrev ?? "MOHAP"}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {featuredTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted line-clamp-1">{test.name}</p>
              <span className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-medium capitalize inline-block mt-1">
                {test.category.replace(/-/g, " ")}
              </span>
            </div>
            <div className="text-left flex-shrink-0">
              {test.priceRange ? (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">
                    {test.priceRange.labCount} مختبر
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted">تتفاوت الأسعار</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Answer block 2 — deep editorial ───────────────────────── */}
      <div className="answer-block mb-10 bg-light-50 border border-black/[0.06] p-5" data-answer-block="true">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-accent flex-shrink-0" />
          <h2 className="text-sm font-bold text-dark">
            الفحوصات المخبرية في {cityNameAr} — ما تحتاج معرفته
          </h2>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          {content?.deepDive ??
            `تخضع الفحوصات المخبرية في ${cityNameAr} لإشراف ${content?.regulator ?? "وزارة الصحة ووقاية المجتمع (MOHAP)"}. يتعين على جميع المختبرات التشخيصية المرخصة استيفاء معايير الجودة الوطنية وهي خاضعة للتفتيش الدوري. معظم فحوصات الدم الاعتيادية — بما فيها CBC ولوحة الدهون ووظائف الكبد والكلى والجلوكوز — لا تستلزم وصفة طبية في المختبرات المستقلة. نقص فيتامين D منتشر بشكل خاص بين المقيمين في الإمارات رغم وفرة أشعة الشمس، بسبب نمط الحياة الداخلية وارتداء الملابس الواقية؛ يُوصى بإجراء الفحص الدوري سنويًا. خدمة السحب المنزلي متاحة في ${cityNameAr} عبر مزودين مرخصين متعددين. تأكد دائمًا أن المختبر الذي اخترته مدرج في شبكة خطتك التأمينية قبل الحجز.`}
        </p>

        {/* Popular areas */}
        {content?.popularAreas && content.popularAreas.length > 0 && (
          <div className="mt-4 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted">
              <span className="font-semibold text-dark">مراكز المختبرات في {cityNameAr}:</span>{" "}
              {content.popularAreas.join("، ")}
            </p>
          </div>
        )}

        {/* Visa medical box */}
        {content?.visaMedical && (
          <div className="mt-4 border-t border-black/[0.06] pt-4">
            <p className="text-xs font-semibold text-dark mb-1">الفحص الطبي للإقامة</p>
            <p className="text-xs text-muted">{content.visaMedical}</p>
          </div>
        )}

        {/* Insurance tip box */}
        {content?.insuranceTip && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-dark mb-1">نصائح التأمين</p>
            <p className="text-xs text-muted">{content.insuranceTip}</p>
          </div>
        )}
      </div>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <FaqSection
        faqs={faqs}
        title={`الأسئلة الشائعة عن الفحوصات المخبرية في ${cityNameAr}`}
      />

      {/* ── Cross-links: other cities ──────────────────────────────── */}
      <div className="mt-12">
        <div className="section-header">
          <h2>قارن أسعار الفحوصات المخبرية في مدن أخرى</h2>
          <span className="arrows">&lt;&lt;&lt;</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CITIES.filter((c) => c.slug !== citySlug).map((otherCity) => {
            const otherLabs = getLabsByCity(otherCity.slug);
            const otherCityNameAr = getArabicCityName(otherCity.slug);
            return (
              <Link
                key={otherCity.slug}
                href={`/ar/labs/city/${otherCity.slug}`}
                className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                    {otherCityNameAr}
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5 text-muted group-hover:text-accent" />
                </div>
                <p className="text-[11px] text-muted">
                  {otherLabs.length} مختبر
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء مسؤولية:</strong> الأسعار المعروضة استرشادية وتستند إلى التسعير المتاح للعموم من مواقع المختبرات ومنصات التجميع (ServiceMarket وHealthchecks360 وDarDoc) وقوائم أسعار الزيارات المباشرة المنشورة (2024–2025). قد تتباين الأسعار الفعلية بحسب موقع الفرع والتغطية التأمينية والعروض الترويجية الجارية ومنهجية الفحص المحددة. يُرجى دائمًا التأكد من الأسعار مباشرةً مع المختبر قبل الحجز. هذه الصفحة للأغراض المعلوماتية فحسب ولا تُشكّل نصيحةً طبية. استشر طبيبًا مؤهلًا قبل طلب أي فحوصات مخبرية. بيانات المختبرات مصدرها سجلات المرافق المرخصة لدى{" "}
          {content?.regulator ?? "الجهة الصحية المختصة في الإمارات"}. آخر تحقق مارس 2026.
        </p>
      </div>

      {/* ── Language switch ─────────────────────────────────────────── */}
      <div className="text-center pt-4 pb-8">
        <Link href={`/labs/city/${citySlug}`} className="text-accent text-sm hover:underline">
          View in English / عرض بالإنجليزية
        </Link>
      </div>
    </div>
  );
}
