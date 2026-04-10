import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo";
import {
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
} from "@/lib/constants/professionals";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

interface GuideDefinition {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  publishedDate: string;
  faqs: { question: string; answer: string }[];
}

const GUIDES: GuideDefinition[] = [
  {
    slug: "specialist-vs-consultant",
    title: "أخصائي مقابل استشاري في دبي: ما الفرق؟",
    subtitle: "فهم الدرجتين الإكلينيكيتين العليا في نظام هيئة الصحة بدبي وما تعنيانه لرعايتك",
    description: "تعرّف على الفرق بين الأخصائي والاستشاري في منظومة الرعاية الصحية بدبي. افهم درجات الترخيص الصادرة عن DHA ومتطلبات الخبرة وكيف تختار الطبيب المناسب لاحتياجاتك.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "ما الفرق بين الأخصائي والاستشاري في دبي؟",
        answer: `في نظام هيئة الصحة بدبي (DHA)، الأخصائي هو طبيب أكمل تدريبه التخصصي ويحمل مؤهلاً معترفاً به. أما الاستشاري فهو الدرجة العليا، وتستلزم 8+ سنوات من الخبرة بعد التخصص والقدرة على الإشراف على الأخصائيين وقيادة الأقسام. من إجمالي ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً مرخصاً في دبي، يُشكِّل الأخصائيون الغالبية، فيما يمثل الاستشاريون شريحة أصغر لكنها الأكثر خبرة.`,
      },
      {
        question: "هل الاستشاري أغلى من الأخصائي في دبي؟",
        answer: "في الغالب نعم. مواعيد الاستشاريين أعلى تكلفةً عادةً بنسبة 20-50% مقارنةً بالأخصائيين في المنشأة ذاتها. لكن الأسعار تتفاوت حسب المنشأة ونوع التأمين وتعقيد الحالة. كثير من خطط التأمين تغطي الدرجتين دون تكاليف إضافية من الجيب.",
      },
      {
        question: "هل يمكن للأخصائي إجراء جراحة في دبي؟",
        answer: "نعم، الأخصائيون في التخصصات الجراحية (كجراحة العظام والجراحة العامة والجراحة التجميلية) مؤهلون تأهيلاً كاملاً لإجراء العمليات بصورة مستقلة. درجة الأخصائي تؤكد إتمامهم التدريب الجراحي المطلوب. قد يتولى الاستشاريون الإجراءات الأكثر تعقيداً أو ذات الخطورة العالية.",
      },
      {
        question: "كيف أتحقق من درجة طبيب (أخصائي أم استشاري)؟",
        answer: "يمكنك التحقق من بيانات أي متخصص صحي عبر بوابة شريان الخاصة بهيئة الصحة بدبي (sheryan.dha.gov.ae). ابحث بالاسم أو رقم الترخيص لرؤية درجة تسجيله والتخصص وانتمائه للمنشأة. يعرض دليل Zavis للمهنيين هذه المعلومات لجميع الكوادر الصحية المرخصة من DHA.",
      },
      {
        question: "هل يجب دائماً اختيار الاستشاري على الأخصائي؟",
        answer: "ليس بالضرورة. للرعاية التخصصية الروتينية، الأخصائي مؤهل تأهيلاً كاملاً وغالباً ما يكون أكثر إتاحةً. يُنصح بالاستشاري في الحالات المعقدة وطلبات الرأي الثاني والحالات التي تستلزم تنسيقاً متعدد التخصصات أو عند الرغبة في أعلى مستوى من الخبرة. كلتا الدرجتين مرخصتان للممارسة المستقلة.",
      },
    ],
  },
  {
    slug: "dha-licensing",
    title: "كيف يعمل الترخيص الطبي لهيئة الصحة بدبي",
    subtitle: "دليل شامل حول إطار الترخيص المهني لهيئة الصحة بدبي",
    description: "افهم كيف يعمل الترخيص الطبي في دبي بموجب نظام هيئة الصحة بدبي. تعرّف على أنواع التراخيص ومتطلبات الأهلية وعملية التقديم وآلية تنظيم DHA للكوادر الصحية.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "ما هو ترخيص DHA؟",
        answer: `ترخيص DHA (هيئة الصحة بدبي) هو الإجراء الإلزامي للاعتماد المهني لجميع الكوادر الصحية الممارسة في دبي. يجب على كل طبيب وطبيب أسنان وممرض وصيدلاني وعامل صحة مساند الحصول على ترخيص DHA ساريٍّ. حالياً، يوجد ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} متخصص مرخص في ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة.`,
      },
      {
        question: "كم تستغرق مدة الحصول على ترخيص DHA؟",
        answer: "تستغرق عملية الترخيص عادةً من 4 إلى 8 أسابيع للطلبات المباشرة. تشمل: التحقق من الوثائق، والتحقق من المصدر الأول (PSV) عبر DataFlow، والاختبار المهني للـ DHA إذا كان مطلوباً. الحالات المعقدة قد تستغرق وقتاً أطول.",
      },
      {
        question: "ما الفرق بين ترخيص DHA وDOH وMOHAP؟",
        answer: "ترخيص DHA للعمل في دبي، وترخيص DOH (دائرة الصحة) لأبوظبي، وترخيص MOHAP لباقي الإمارات الخمس. لكل جهة عملية ترخيص مستقلة، وإن كانت هناك اتفاقيات اعتراف متبادل لبعض المؤهلات.",
      },
      {
        question: "هل يمكن لطبيب حامل ترخيص DHA العمل في أبوظبي؟",
        answer: "ليس مباشرةً. ترخيص DHA صالح داخل نطاق دبي فحسب. للعمل في أبوظبي، يلزم الحصول على ترخيص DOH منفصل. لكن الإمارات تسعى إلى تسهيل قابلية نقل الترخيص، وتوجد بعض الترتيبات التبادلية للاستشاريين الزائرين.",
      },
      {
        question: "كيف أتحقق من أن طبيباً حاصلاً على ترخيص DHA؟",
        answer: "زُر بوابة شريان على (sheryan.dha.gov.ae) وابحث بالاسم أو رقم الترخيص. يتيح دليل Zavis للمهنيين أيضاً واجهة بحث لجميع الكوادر المرخصة من DHA مع التخصص والدرجة وتفاصيل المنشأة.",
      },
    ],
  },
  {
    slug: "ftl-vs-reg",
    title: "ترخيص FTL مقابل REG: ما الفرق؟",
    subtitle: "فهم نوعَي ترخيص الدوام الكامل والمسجل في منظومة دبي الصحية",
    description: "تعرّف على الفرق بين نوعَي الترخيص FTL (ترخيص الدوام الكامل) وREG (مسجّل) في نظام DHA بدبي. افهم ما يعنيه كل منهما للكوادر الصحية وللمرضى.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "ماذا يعني FTL في ترخيص DHA؟",
        answer: "FTL اختصار لـ Full-Time License أي ترخيص الدوام الكامل. يُمنح للكوادر الصحية العاملين بدوام كامل في منشأة محددة في دبي. يعمل حاملو FTL حصرياً في المنشأة المخصصة لهم وهم الركيزة الأساسية للقوى العاملة الصحية في دبي.",
      },
      {
        question: "ماذا يعني REG في ترخيص DHA؟",
        answer: "REG اختصار لـ Registered أي مسجّل. يشمل المتخصصين العاملين بدوام جزئي أو بصفة زائر أو في أكثر من منشأة. كثيراً ما يكون حاملو رخصة REG استشاريين كباراً يوزعون وقتهم بين منشآت متعددة أو ممارسين دوليين يزورون دبي بصفة دورية.",
      },
      {
        question: "هل طبيب FTL أفضل من طبيب REG؟",
        answer: "لا. نوع الترخيص (FTL مقابل REG) يشير إلى ترتيب التوظيف لا إلى الكفاءة الإكلينيكية. قد يكون الاستشاري الحامل لرخصة REG متخصصاً بارزاً يعمل في عدة مستشفيات. كلا الحاملين يجب أن يستوفيا معايير اعتماد DHA ذاتها.",
      },
      {
        question: "هل يمكن لطبيب REG إجراء جراحة؟",
        answer: "نعم، إذا كان يحمل المؤهل التخصصي المناسب وتشمل صلاحياته في المنشأة الإجراءات الجراحية. التمييز بين FTL وREG يتعلق بشروط التوظيف لا بنطاق الممارسة. الجراح الحامل لرخصة REG له الصلاحية الإكلينيكية ذاتها لمن يحمل رخصة FTL.",
      },
      {
        question: "كم عدد المهنيين الحاملين لرخصة FTL مقابل REG في دبي؟",
        answer: `يتتبع دليل Zavis للمهنيين ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخصاً من DHA في ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. يتفاوت التوزيع بين FTL وREG حسب التخصص، لكن تراخيص الدوام الكامل أكثر شيوعاً بشكل عام مما يعكس حجم القوى العاملة الصحية المقيمة في دبي.`,
      },
    ],
  },
  {
    slug: "how-to-verify-doctor",
    title: "كيف تتحقق من ترخيص طبيب في دبي",
    subtitle: "دليل خطوة بخطوة للتحقق من اعتمادات DHA قبل موعدك",
    description: "تعرّف على كيفية التحقق من ترخيص طبيب في دبي عبر بوابة شريان الخاصة بهيئة الصحة بدبي. دليل خطوة بخطوة للتحقق من الاعتمادات والتخصص والانتماء المؤسسي لأي متخصص صحي.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "كيف أتحقق من ترخيص طبيب في دبي؟",
        answer: "زُر بوابة شريان التابعة لهيئة الصحة بدبي على (sheryan.dha.gov.ae)، وانقر على 'البحث عن متخصص صحي'، وأدخل اسم الطبيب أو رقم الترخيص. سيُظهر النظام حالة الترخيص والتخصص والدرجة (أخصائي/استشاري) ونوع الترخيص (FTL/REG) والمنشأة. يمكنك أيضاً استخدام دليل Zavis للمهنيين للحصول على واجهة بحث سهلة الاستخدام.",
      },
      {
        question: "هل بوابة شريان الخاصة بـ DHA مجانية؟",
        answer: "نعم، البوابة مجانية تماماً ومتاحة للعموم. يمكن لأي شخص البحث والتحقق من الكوادر الصحية دون إنشاء حساب. تغطي البوابة جميع المهنيين المرخصين في دبي.",
      },
      {
        question: "ما الذي يجب التحقق منه عند مراجعة بيانات طبيب؟",
        answer: "تحقق من: (1) أن حالة الترخيص نشطة، (2) أن التخصص يتطابق مع ما يُدّعى، (3) أن الدرجة صحيحة (أخصائي مقابل استشاري)، (4) أنه منتسب للمنشأة التي تنوي زيارتها، (5) أن الترخيص لم ينتهِ. إذا كان هناك تعارض في أي من هذه النقاط، تواصل مع المنشأة أو DHA مباشرةً.",
      },
      {
        question: "هل يمكن التحقق من أطباء أبوظبي أو الإمارات الأخرى؟",
        answer: "شريان يغطي دبي فحسب. لأبوظبي، استخدم بوابة DOH على (doh.gov.ae). لباقي الإمارات، راجع بوابة MOHAP على (mohap.gov.ae). كل جهة تحتفظ بسجلها الخاص للمهنيين المرخصين.",
      },
      {
        question: "كم مرة يُحدَّث سجل DHA؟",
        answer: `يُحدَّث سجل شريان الخاص بـ DHA في الوقت الفعلي مع إصدار التراخيص وتجديدها أو إلغائها. دليل Zavis للمهنيين، الذي يعكس ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} سجلاً من سجل DHA، يُحدَّث بصفة دورية ليعكس أحدث البيانات.`,
      },
    ],
  },
  {
    slug: "choosing-right-specialist",
    title: "كيف تختار المتخصص الطبي المناسب في دبي",
    subtitle: "نصائح عملية للتنقل في عالم المتخصصين الطبيين في دبي",
    description: "دليل عملي لاختيار المتخصص الطبي المناسب في دبي. تعرّف على كيفية تقييم الاعتمادات ومقارنة الأخصائيين والاستشاريين والعثور على الطبيب الأنسب لحالتك.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "كيف أختار متخصصاً في دبي؟",
        answer: `ابدأ بالحصول على إحالة من طبيبك العام أو مراجعة شبكة التأمين الخاصة بك. ثم تحقق من اعتمادات المتخصص عبر شريان. خذ بعين الاعتبار درجته (أخصائي مقابل استشاري) وسمعة المنشأة وما إذا كان يتحدث لغتك. تضم دبي ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً مرخصاً عبر ${PHYSICIAN_SPECIALTIES.length} تخصصاً، لذا الخيارات وفيرة.`,
      },
      {
        question: "هل يجب زيارة طبيب عام أولاً أم مباشرةً إلى متخصص؟",
        answer: "لمعظم الحالات، يُنصح بزيارة طبيب عام أولاً. يمكنه تقييم ما إذا كنت تحتاج إلى رعاية متخصصة ويُحيلك إلى التخصص الصحيح. تشترط كثير من خطط التأمين أيضاً إحالة من الطبيب العام لتغطية المتخصص. لكن للاحتياجات التخصصية الواضحة (كالحمل وأمراض الجلد)، زيارة المتخصص مباشرةً شائعة في دبي.",
      },
      {
        question: "هل يهم المستشفى الذي يعمل فيه المتخصص؟",
        answer: "نعم، المنشأة مهمة. المستشفيات الكبيرة عادةً لديها أجهزة أفضل وطواقم دعم وفرق متعددة التخصصات. لكن المتخصص في عيادة أصغر قد يقدم رعاية أكثر تخصيصاً ومواعيد انتظار أقصر. ضع في اعتبارك سمعة المنشأة في التخصص المحدد الذي تحتاجه.",
      },
      {
        question: "كيف أعرف إذا كان المتخصص مُغطى بتأميني؟",
        answer: "تواصل مع شركة التأمين أو تحقق من بوابتها الإلكترونية للاطلاع على قائمة مقدمي الخدمة في الشبكة. معظم شركات التأمين الكبرى في دبي تحتفظ بأدلة محدّثة. يمكنك أيضاً الاتصال بمنشأة المتخصص للتأكد من قبولها خطتك التأمينية قبل الحجز.",
      },
      {
        question: "ما الأسئلة التي يجب طرحها على المتخصص في الزيارة الأولى؟",
        answer: "اسأل عن: (1) خبرته مع حالتك بالتحديد، (2) خيارات العلاج ونسب النجاح، (3) الجدول الزمني المتوقع والتكاليف، (4) ما إذا كان يُنسّق مع متخصصين آخرين عند الحاجة، (5) شكل الرعاية التتبعية. المتخصص الجيد سيرحب بهذه الأسئلة.",
      },
    ],
  },
  {
    slug: "healthcare-workforce",
    title: "القوى العاملة الصحية في دبي: أبرز إحصائيات 2026",
    subtitle: "تحليل مبني على البيانات حول من يقدم الرعاية الصحية في دبي",
    description: `تضم دبي ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخصاً في ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة. استعرض الإحصائيات الرئيسية وتوزيع التخصصات والاتجاهات التي تشكّل تقديم الرعاية الصحية في دبي.`,
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "كم عدد المتخصصين الصحيين في دبي؟",
        answer: `حتى ${PROFESSIONAL_STATS.scraped}، يوجد ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً صحياً مرخصاً في دبي، مسجلين عبر نظام شريان الخاص بـ DHA. يشمل ذلك ${PROFESSIONAL_STATS.physicians.toLocaleString("ar-AE")} طبيباً و${PROFESSIONAL_STATS.dentists.toLocaleString("ar-AE")} طبيب أسنان و${PROFESSIONAL_STATS.nurses.toLocaleString("ar-AE")} ممرضاً وقابلةً و${PROFESSIONAL_STATS.alliedHealth.toLocaleString("ar-AE")} متخصص صحة مساندة.`,
      },
      {
        question: "ما أكبر منشأة صحية في دبي؟",
        answer: `من حيث عدد الموظفين، أكبر المنشآت الصحية في دبي هي ${PROFESSIONAL_STATS.topFacilities.slice(0, 3).map((f) => `${f.name} (${f.staff.toLocaleString("ar-AE")} موظف)`).join(", ")}. تضم هذه المستشفيات الحكومية والخاصة آلاف المتخصصين عبر جميع التخصصات.`,
      },
      {
        question: "ما أكثر التخصصات الطبية شيوعاً في دبي؟",
        answer: `أكثر التخصصات الطبية شيوعاً في دبي هو طب الأسرة / الطب العام بـ ${PHYSICIAN_SPECIALTIES[0].count.toLocaleString("ar-AE")} متخصصاً، يليه أمراض النساء والتوليد (${PHYSICIAN_SPECIALTIES[1].count.toLocaleString("ar-AE")})، وطب الأطفال (${PHYSICIAN_SPECIALTIES[2].count.toLocaleString("ar-AE")}). ومن بين أطباء الأسنان، تتصدر طب الأسنان العام بـ ${DENTIST_SPECIALTIES[0].count.toLocaleString("ar-AE")} طبيباً.`,
      },
      {
        question: "كم عدد المستشفيات في دبي؟",
        answer: `تضم دبي ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString("ar-AE")} منشأة صحية مرخصة من جميع الأنواع، تشمل المستشفيات والعيادات والمراكز الطبية وعيادات الأسنان والصيدليات والمختبرات التشخيصية. أكبر المستشفيات تضم أكثر من 1,000 موظف.`,
      },
      {
        question: "هل تنمو القوى العاملة الصحية في دبي؟",
        answer: "نعم. نمت القوى العاملة الصحية في دبي نمواً ملحوظاً على مدى العقد الماضي مدفوعاً بنمو السكان والسياحة الطبية والاستثمار الحكومي في البنية التحتية للرعاية الصحية. تواصل هيئة الصحة بدبي ترخيص منشآت ومتخصصين جدد كل عام.",
      },
    ],
  },
  {
    slug: "medical-specialties-explained",
    title: "التخصصات الطبية في دبي: الدليل الشامل",
    subtitle: "نظرة عامة على كل تخصص طبي وسني متوفر في دبي",
    description: `تتوفر في دبي ${PHYSICIAN_SPECIALTIES.length} تخصصاً طبياً و${DENTIST_SPECIALTIES.length} تخصصاً في طب الأسنان. استكشف كل تخصص والحالات التي يعالجها وعدد المتخصصين المرخصين في دبي.`,
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "كم عدد التخصصات الطبية المتوفرة في دبي؟",
        answer: `تضم دبي ${PHYSICIAN_SPECIALTIES.length} تخصصاً طبياً معترفاً به و${DENTIST_SPECIALTIES.length} تخصصاً في طب الأسنان مرخصاً من DHA. يشمل ذلك كل شيء من طب الأسرة إلى الحقول شديدة التخصص كأمراض القلب التدخلية وجراحة الأعصاب وطب الإنجاب.`,
      },
      {
        question: "ما الفرق بين الطبيب العام والمتخصص؟",
        answer: `الطبيب العام يقدم الرعاية الأولية ويعالج طيفاً واسعاً من الحالات. المتخصص أتمّ سنوات إضافية من التدريب في مجال طبي محدد. يوجد في دبي ${PHYSICIAN_SPECIALTIES[0].count.toLocaleString("ar-AE")} طبيباً عاماً وآلاف المتخصصين عبر ${PHYSICIAN_SPECIALTIES.length - 1} تخصصاً آخر.`,
      },
      {
        question: "أي تخصص يجب زيارته لآلام الظهر؟",
        answer: "لآلام الظهر، ابدأ بطبيبك العام أو جراح العظام. بحسب السبب، قد تُحال إلى جراح أعصاب (لمشاكل الأقراص أو الأعصاب)، أو متخصص طب العلاج الطبيعي وإعادة التأهيل (للعلاج المحافظ)، أو اختصاصي الروماتيزم (للحالات الالتهابية). عيادات إدارة الألم تعالج أيضاً آلام الظهر المزمنة.",
      },
      {
        question: "ما التخصص الأندر في دبي؟",
        answer: `من بين التخصصات الطبية، التخصصات الأقل شيوعاً تشمل طب الإنجاب وأطفال الأنابيب (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "reproductive-medicine")?.count?.toLocaleString("ar-AE") || "53"} متخصصاً)، وطب إعادة التأهيل الجسدي (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "physical-rehabilitation")?.count?.toLocaleString("ar-AE") || "53"})، وجراحة الأطفال (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "pediatric-surgery")?.count?.toLocaleString("ar-AE") || "61"}). هذه التخصصات النادرة لديها عدد أقل من الممارسين لكنها تؤدي دوراً محورياً.`,
      },
      {
        question: "هل يمكن زيارة متخصص دون إحالة في دبي؟",
        answer: "في معظم الحالات نعم. تسمح دبي بالوصول المباشر إلى المتخصصين دون إحالة من طبيب عام. لكن بعض خطط التأمين تشترط إحالة للتغطية، ورؤية طبيب عام أولاً تساعد على التأكد من توجيهك للتخصص الصحيح. لاحتياجات واضحة (كالحمل وأمراض العيون وطب الأسنان)، زيارة المتخصص مباشرةً شائعة.",
      },
    ],
  },
  {
    slug: "international-doctors-dubai",
    title: "الأطباء الدوليون في دبي: ما تحتاج معرفته",
    subtitle: "كيف تخدم القوى العاملة الطبية الدولية في دبي مجتمعاً متنوعاً",
    description: "تُعدّ القوى العاملة الصحية في دبي من أكثر المجموعات الطبية تنوعاً على مستوى العالم. تعرّف على مصادر قدوم الأطباء وكيفية الاعتراف بمؤهلاتهم الدولية وما يعنيه ذلك للمرضى.",
    publishedDate: "2026-04-03",
    faqs: [
      {
        question: "هل الأطباء الدوليون مؤهلون للممارسة في دبي؟",
        answer: "نعم. يجب على جميع الأطباء الدوليين الممارسين في دبي اجتياز عملية الترخيص الخاصة بـ DHA، التي تشمل التحقق من المصدر الأول لمؤهلاتهم، والاختبارات المهنية (في بعض الحالات)، والتقييم الإكلينيكي. يحصل على الترخيص فقط من يستوفي معايير DHA بصرف النظر عن بلد تدريبه.",
      },
      {
        question: "ما الدول التي يأتي منها معظم الأطباء في دبي؟",
        answer: "القوى العاملة الطبية في دبي مستقطبة من أكثر من 100 دولة. أكبر المجموعات تشمل أطباء تدربوا في الهند وباكستان والفلبين ومصر والمملكة المتحدة وأيرلندا وسوريا والأردن والدول العربية الأخرى. أكمل كثيرون منهم تدريباً إضافياً في الولايات المتحدة أو المملكة المتحدة أو كندا أو أستراليا.",
      },
      {
        question: "هل يتحدث الأطباء الدوليون في دبي اللغة العربية؟",
        answer: "الإنجليزية هي اللغة الأساسية للممارسة الطبية في دبي، ويجب على جميع المرخصين من DHA إثبات كفاءتهم فيها. يتحدث كثيرون منهم أيضاً العربية والهندية والأردية والتاغالوغية أو لغات أخرى تعكس تنوع المرضى.",
      },
      {
        question: "كيف تتحقق DHA من المؤهلات الطبية الدولية؟",
        answer: "تستخدم DHA مجموعة DataFlow للتحقق من المصدر الأول (PSV)، وهي تتحقق بصورة مستقلة من كل مؤهل وشهادة تدريب ومرجع مهني مباشرةً من الجهة المصدرة. تستغرق هذه العملية عادةً من أسبوعين إلى أربعة أسابيع وتُعدّ من أكثر أنظمة التحقق صرامةً في العالم.",
      },
      {
        question: "هل يمكنني العثور على طبيب تدرب في بلدي الأصلي؟",
        answer: `يُدرج دليل Zavis للمهنيين جميع ${PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} كادراً مرخصاً من DHA مع منشآتهم وتخصصاتهم، بينما تُدرج بوابة شريان الخلفيات التدريبية بالتفصيل. كثير من مجتمعات المغتربين تحتفظ أيضاً بأدلة غير رسمية وتوصيات للأطباء من دول بعينها.`,
      },
    ],
  },
];

function getGuideBySlug(slug: string): GuideDefinition | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return {};

  const base = getBaseUrl();
  return {
    title: `${guide.title}`,
    description: guide.description,
    alternates: {
      canonical: `${base}/ar/professionals/guide/${guide.slug}`,
      languages: {
        "en-AE": `${base}/professionals/guide/${guide.slug}`,
        "ar-AE": `${base}/ar/professionals/guide/${guide.slug}`,
        "x-default": `${base}/professionals/guide/${guide.slug}`,
      },
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${base}/ar/professionals/guide/${guide.slug}`,
      type: "article",
      locale: "ar_AE",
      siteName: "دليل الإمارات المفتوح للرعاية الصحية",
      publishedTime: guide.publishedDate,
    },
  };
}

export default function ArProfessionalsGuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const base = getBaseUrl();
  const otherGuides = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);

  return (
    <div dir="rtl" lang="ar" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "الرئيسية", url: base },
          { name: "دليل الكوادر الصحية", url: `${base}/ar/professionals` },
          { name: "الأدلة الإرشادية", url: `${base}/ar/professionals/guide/specialist-vs-consultant` },
          { name: guide.title },
        ])}
      />
      <JsonLd data={faqPageSchema(guide.faqs)} />

      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/ar" },
          { label: "الكوادر الصحية", href: "/ar/professionals" },
          { label: guide.title },
        ]}
      />

      <article className="max-w-3xl">
        <div className="mb-8">
          <span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif] mb-3">
            دليل إرشادي
          </span>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
            {guide.title}
          </h1>
          <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
            {guide.subtitle}
          </p>
          <div className="border-r-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-4 px-5">
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              {guide.description}
            </p>
          </div>
        </div>

        <FaqSection faqs={guide.faqs} title="المحتوى الرئيسي والأسئلة الشائعة" />

        <div className="mt-8 bg-[#f8f8f6] border border-black/[0.06] p-5">
          <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-2">
            المصدر
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/60">
            هيئة الصحة بدبي (DHA) — السجل الطبي المهني شريان.
            نُشر هذا الدليل بتاريخ {guide.publishedDate}. البيانات من{" "}
            {PROFESSIONAL_STATS.total.toLocaleString("ar-AE")} سجل DHA.
          </p>
        </div>
      </article>

      {otherGuides.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">أدلة ذات صلة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/ar/professionals/guide/${g.slug}`}
                className="border border-black/[0.06] p-4 hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="text-sm font-bold text-[#1c1c1c] group-hover:text-[#006828] transition-colors mb-1">
                  {g.title}
                </h3>
                <p className="text-xs text-black/40">{g.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3 text-xs">
        <Link href="/ar/professionals" className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors">
          الكوادر الصحية في دبي
        </Link>
        <Link href="/ar/directory" className="border border-black/[0.06] px-3 py-1.5 text-black/40 hover:border-[#006828]/15 hover:text-[#006828] transition-colors">
          دليل الرعاية الصحية
        </Link>
        <Link href={`/professionals/guide/${guide.slug}`} className="border border-black/[0.06] px-3 py-1.5 text-[#006828] hover:underline transition-colors">
          English version →
        </Link>
      </div>

      <div className="mt-6 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40">
          هذا الدليل لأغراض معلوماتية فحسب ولا يُعدّ نصيحة طبية أو قانونية. تحقق دائماً من المعلومات مباشرةً مع هيئة الصحة بدبي أو مقدم الرعاية الصحية.
        </p>
      </div>
    </div>
  );
}
