import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ArrowRight,
  Award,
  Shield,
  Microscope,
  TestTube,
  UserCheck,
  Smartphone,
  FileText,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_TESTS,
  LAB_TEST_PRICES,
  TEST_CATEGORIES,
  getLabsByCity,
  getPricesForLab,
  getPackagesForLab,
  formatPrice,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getArabicCityName } from "@/lib/i18n";

// ─── Static Params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return CITIES.filter((city) =>
    getLabsByCity(city.slug).some((l) => l.homeCollection)
  ).map((city) => ({ city: city.slug }));
}

export const revalidate = 43200;

// ─── City-Specific Arabic Content ─────────────────────────────────────────────

interface CityHomeContentAr {
  regulator: string;
  regulatorAbbrev: "DHA" | "DOH" | "MOHAP";
  regulatorFullNote: string;
  turnaround: string;
  intro: string;
  howItWorks: string;
  coverageNote: string;
  areas: string[];
  insuranceNote: string;
  fastingTip: string;
}

const CITY_HOME_CONTENT_AR: Record<string, CityHomeContentAr> = {
  dubai: {
    regulator: "هيئة الصحة بدبي (DHA)",
    regulatorAbbrev: "DHA",
    regulatorFullNote:
      "يجب على جميع ممرضي السحب المنزلي العاملين في دبي أن يحملوا ترخيص تمريض أو سحب دم سارياً من DHA. تُجري DHA عمليات تفتيش سنوية على مزودي الرعاية الصحية المنزلية وتضع معايير نقل السلسلة الباردة الإلزامية للعينات البيولوجية.",
    turnaround: "6–24 ساعة",
    intro:
      "تمتلك دبي أكثر أسواق السحب المنزلي تطوراً في الإمارات. بُنيت منصات الخدمة المنزلية كـDarDoc وHealthchecks360 خصيصاً للسوق السكني في دبي، إذ تُوفّر فاصدين دم مرخصين من DHA في مناطق الجميرا وJLT ودبي مارينا وبزنس باي ومردف والأحياء الداخلية سبعة أيام في الأسبوع. أضافت سلاسل المختبرات التقليدية — Al Borg وMedsol وAlpha Medical وSTAR Metropolis وUnilabs وMenaLabs — خدمة السحب المنزلي كقناة خدمة موازية لشبكة فروعها. والنتيجة هي واحدة من أكثر بيئات الفحص المنزلي تنافسية في المنطقة من حيث السعر.",
    howItWorks:
      "احجز عبر تطبيق المختبر أو موقعه الإلكتروني، أو اتصل مباشرة. اختر نافذة زمنية — تعمل معظم خدمات دبي من الساعة 7 صباحاً حتى 10 أو 11 مساءً يومياً، مع امتداد خدمة DarDoc حتى 11 مساءً. يصل ممرض مرخص من DHA إلى منزلك أو فندقك أو مكتبك مزوداً بجميع المعدات المعقمة. تستغرق عملية السحب 10–15 دقيقة. تُغلق العينات وتُنقل في حاويات مضبوطة الحرارة إلى المختبر الشريك للمعالجة. تصلك النتائج عبر إشعار التطبيق أو البريد الإلكتروني أو ملف PDF على واتساب خلال 6–24 ساعة للفحوصات الروتينية.",
    coverageNote:
      "تمتد التغطية عبر جميع أحياء دبي الرئيسية، بما فيها دبي القديمة (ديرة وبر دبي والكرامة) والمناطق المتوسطة (القصيص والنهدة ومردف) والتطويرات الحديثة (دبي مارينا وJLT وJBR ونخلة الجميرا ودبي هيلز) والمناطق التجارية (DIFC وبزنس باي وDHCC وداون تاون). العملاء في منطقة القوز الصناعية وجبل علي تخدمهم مزودون محددون — تأكد من التغطية عند الحجز.",
    areas: [
      "الجميرا", "دبي مارينا", "JLT", "بزنس باي", "داون تاون دبي",
      "ديرة", "بر دبي", "الكرامة", "مردف", "دبي هيلز", "نخلة الجميرا",
    ],
    insuranceNote:
      "معظم المختبرات المرخصة من DHA في دبي متعاقدة مع Daman وAXA Gulf وCigna وBupa Arabia وشركة دبي للتأمين. تُعامل شركات التأمين عادةً رسوم زيارة السحب المنزلي باعتبارها تكلفة راحة خاصة، غير أن الفحوصات نفسها كثيراً ما تكون قابلة للاسترداد. تتعاون DarDoc وServiceMarket مع شركاء تأمينيين محددين — اتصل للتحقق من خطتك.",
    fastingTip:
      "بالنسبة لفحوصات الصيام (لوحة الدهون وسكر الصيام وHbA1c والأنسولين ودراسات الحديد)، احجز أبكر موعد صباحي متاح. أوقف تناول الطعام 8–12 ساعة قبل الموعد. يُسمح عموماً بشرب الماء والقهوة السوداء (بدون حليب أو سكر) وتناول الأدوية المعتادة ما لم يوصِ طبيبك بغير ذلك. شرب ما لا يقل عن 500 مل من الماء قبل 30 دقيقة من السحب يُسهّل الوصول إلى الأوردة ويقلل احتمال فشل السحب.",
  },
  "abu-dhabi": {
    regulator: "دائرة الصحة - أبوظبي (DOH)",
    regulatorAbbrev: "DOH",
    regulatorFullNote:
      "يجب أن تحصل جميع خدمات السحب المنزلي في أبوظبي على ترخيص من دائرة الصحة (DOH). تشترط DOH أن يحمل الفاصدون ترخيص ممارسة صحية سارياً، وأن يمتثل نقل العينات لمعايير السلامة الأحيائية للمواد البيولوجية من الفئة ب.",
    turnaround: "12–24 ساعة",
    intro:
      "يرتكز سوق السحب المنزلي في أبوظبي على مزودَين من المستوى المؤسسي: PureLab، أكبر مختبر تشخيصي مستقل يعمل بالذكاء الاصطناعي في الإمارات (ضمن مجموعة PureHealth)، وNational Reference Laboratory (NRL) المختبر المرجعي السريري الرئيسي للعاصمة ضمن منظومة M42 / Mubadala Health. كلا المختبرين يقدمان سحباً منزلياً تحت إشراف DOH. تمتد DarDoc (مرخصة من DOH) وServiceMarket نموذج الخدمة المنزلية ليشمل مجموعة أوسع من الأسعار. يُعدّ السحب المنزلي المجاني من PureLab وتسليم النتائج خلال 12 ساعة الميزة الأبرز لسكان أبوظبي.",
    howItWorks:
      "احجز عبر الإنترنت أو التطبيق أو الهاتف مع المزود المفضل لديك. تعمل PureLab وNRL بساعات ممتدة عبر جزيرة أبوظبي والضواحي الغربية والشرقية. تتميز DarDoc وServiceMarket بمرونة في نوافذ الحجز. يصل الفاصد المرخص من DOH إلى منزلك أو مكتبك لسحب الدم (والبول إن طُلب) ونقل العينات إلى المختبر. تكون نتائج الفحوصات الروتينية (CBC والكيمياء ولوحة الغدة الدرقية) جاهزة خلال 12–24 ساعة — وتكون PureLab أسرع عادةً بفضل خط المعالجة المدعوم بالذكاء الاصطناعي.",
    coverageNote:
      "يشمل السحب المنزلي جزيرة أبوظبي (الكورنيش وجزيرة الريم والخالدية وجزيرة المارية) والضواحي الرئيسية (مدينة خليفة ومدينة محمد بن زايد والشامخة ومدينة مصدر) والمقطع. المناطق النائية كالرحبة وجزيرة ياس وجزيرة السعديات تغطيها مزودون محددون — تأكد عند الحجز.",
    areas: [
      "جزيرة الريم", "الكورنيش", "مدينة خليفة", "مدينة محمد بن زايد",
      "جزيرة المارية", "مدينة مصدر", "جزيرة السعديات", "جزيرة ياس",
    ],
    insuranceNote:
      "تغطي برامج Daman الإلزامية للتأمين الصحي وThiqa (موظفو الحكومة) في أبوظبي الفحوصات المخبرية في المنشآت المرخصة من DOH. كلٌّ من PureLab وNRL متعاقدتان مع Daman. قد تشمل مزايا Thiqa المعززة رسوم السحب المنزلي — راجع قسم الموارد البشرية في جهة عملك. تقبل MenaLabs وMedsol Diagnostics أيضاً Daman للفحوصات الحضورية، وإن كانت تغطيتهما لسحب المنزلي في أبوظبي أكثر محدودية.",
    fastingTip:
      "كثير من الفحوصات الأكثر شيوعاً في أبوظبي — لوحة الدهون وسكر الصيام والأنسولين وتحاليل وظائف الكبد — تستلزم صياماً لمدة 8 ساعات على الأقل. جدول سحب المنزلي في الفترة من 7 إلى 9 صباحاً للحد من الإزعاج خلال يومك. احتفظ بهويتك الإماراتية لخطوة التحقق من الهوية مع الممرض. إذا كنت تُجري فحوصات لأغراض الصحة المهنية الحكومية أو تأشيرة الإقامة، تحقق من أن المزود الذي اخترته يصدر تقارير مختومة رسمياً من DOH.",
  },
  sharjah: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "تُرخّص وزارة الصحة ووقاية المجتمع (MOHAP) المختبرات التشخيصية وخدمات الرعاية الصحية المنزلية في الشارقة. تُطبّق MOHAP معايير المختبرات السريرية الوطنية وتشترط أن يحمل ممرضو السحب المنزلي ترخيص MOHAP سارياً أو ما يعادله من جهة صحية معتمدة.",
    turnaround: "18–24 ساعة",
    intro:
      "تخدم الشارقة ثلاثة مزودين للسحب المنزلي يتمتعون بتغطية واسعة في الإمارة: Thumbay Labs (معتمد من CAP وتابع لمجموعة Thumbay في جامعة الخليج الطبية، بحضور قوي في النهدة والتعاون)، وMedsol Diagnostics (سحب مجاني وأسعار اقتصادية)، وHealthchecks360 (منصة خدمة منزلية بنطاق تغطية واسع في الإمارات الشمالية). تغطي ServiceMarket أيضاً أجزاء من الشارقة. بالنسبة لسكان الشارقة المتنقلين إلى دبي، قد يصل بعض مزودي دبي إلى النهدة والقاسمية — تأكد مع المزود عند الحجز.",
    howItWorks:
      "اتصل أو احجز عبر الإنترنت مع Thumbay Labs أو Medsol أو Healthchecks360. ساعات العمل في الشارقة عادةً من 7:30 صباحاً إلى 9 مساءً (Thumbay) ومن 7 صباحاً إلى 10 مساءً (Healthchecks360). يزور فاصد مرخص من MOHAP موقعك بمعدات معقمة. تُنقل العينات إلى مختبر المعالجة في الشارقة (مختبر Thumbay في عجمان أو مركز Medsol في دبي أو المختبر الشريك لـHealthchecks360). النتائج الروتينية جاهزة في 18–24 ساعة. يعكس وقت الاستجابة الأطول قليلاً مقارنةً بدبي لوجستيات النقل من الإمارات الشمالية.",
    coverageNote:
      "تشمل التغطية الأساسية النهدة والمجاز والتعاون والقاسمية ومويلح ومدينة الجامعة. المناطق القريبة من الحدود بين الشارقة وعجمان (الجرف والراشدية) يمكن الوصول إليها من مزودي الشارقة وعجمان معاً. قد يكون التوافر محدوداً في المناطق النائية والمناطق الصناعية (الحمرية وممر طريق خورفكان) — تأكد قبل الحجز.",
    areas: [
      "النهدة", "المجاز", "التعاون", "القاسمية", "مويلح",
      "مدينة الجامعة", "الراشدية", "الخان", "القليعة",
    ],
    insuranceNote:
      "تنظم MOHAP تغطية التأمين للفحوصات المخبرية في الشارقة. تغطي معظم شركات التأمين الإماراتية الكبرى (Daman وAXA وCigna وOman Insurance) الفحوصات المخبرية في المنشآت المرخصة من MOHAP. رسوم السحب المنزلي عادةً على حساب المريض. Thumbay Labs متعاقد على نطاق واسع مع خطط الرعاية الصحية المؤسسية الإماراتية — راجع كتيب مزاياك الوظيفية أو بوابة شركة التأمين.",
    fastingTip:
      "بالنسبة لسكان الشارقة الذين يطلبون فحوصات الدم الصيامية، تكتسب الحصة الصباحية أهمية بالغة نظراً لأوقات الاستجابة الأطول قليلاً. احجز ليلة الأمس لسحب الساعة 7 صباحاً. أبلغ الفاصد بأي أدوية تتناولها — تطلب بعض المختبرات قوائم الأدوية لدقة تفسير النتائج. تستطيع Thumbay Labs إصدار تقارير متوافقة مع MOHAP للأغراض الصحية المهنية وطلبات التأشيرة.",
  },
  ajman: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "تنظم MOHAP مختبرات التشخيص وخدمات الرعاية الصحية المنزلية في عجمان. يجب أن يحمل جميع ممرضي السحب المنزلي تراخيص مهنية صحية اتحادية سارية، وتُنقل العينات إلى مختبرات معالجة مرخصة من MOHAP.",
    turnaround: "18–24 ساعة",
    intro:
      "Thumbay Labs — المقرّ في عجمان في جامعة الخليج الطبية — هو المزود الرئيسي للسحب المنزلي لسكان عجمان. بفضل السحب المنزلي المجاني والاعتماد من CAP، تقدم Thumbay أقوى مزيج من الجودة والقيمة في الإمارة. تغطي Healthchecks360 أيضاً عجمان ضمن نطاق خدمتها في الإمارات الشمالية. وبالنسبة لسكان عجمان القريبين من الحدود مع الشارقة، قد يكون مزودو الشارقة (Medsol وServiceMarket) متاحين أيضاً.",
    howItWorks:
      "احجز عبر Thumbay Labs أو Healthchecks360 بالهاتف أو منصاتهم الإلكترونية. يزور فاصد مرخص من MOHAP منزلك أو مكتبك. نظراً لصغر مساحة عجمان وقرب منشأة معالجة Thumbay Labs منها، تُعدّ أوقات الاستجابة في الإمارات الشمالية من الأفضل — فحوصات الدم الروتينية جاهزة عادةً في 18–24 ساعة.",
    coverageNote:
      "تشمل التغطية منطقة مدينة عجمان الرئيسية والجرف والنعيمية والراشدية والرميلة. المناطق الصناعية والمنطقة الحرة بعجمان تخدمها مزودون محددون. تأكد من التغطية للمناطق السكنية النائية (الحميدية والطلة) عند الحجز.",
    areas: ["النعيمية", "الجرف", "الراشدية", "الرميلة", "الحميدية"],
    insuranceNote:
      "تقبل Thumbay Labs معظم خطط التأمين الإماراتية الكبرى كـDaman وAXA وNAS وOman Insurance. رسوم السحب المنزلي عادةً على حساب المريض. بالنسبة للحسابات المؤسسية مع Thumbay Group (التي تشغّل أيضاً مستشفى الخليج الطبية)، قد تنطبق ترتيبات الفوترة الجماعية.",
    fastingTip:
      "احجز حصصاً صباحية لفحوصات الصيام — تبدأ Thumbay Labs السحب المنزلي في الساعة 7:30 صباحاً. نظراً لقرب مقر Thumbay في عجمان من مختبر المعالجة، تكون نافذة نقل العينات أقصر مما في المختبرات التي تشحن إلى دبي. قد يعني ذلك نتائج أسرع للأطباق العاجلة.",
  },
  "ras-al-khaimah": {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "تنظم MOHAP خدمات الرعاية الصحية في رأس الخيمة. يجب أن تحصل جميع المختبرات التشخيصية وخدمات السحب المنزلي على ترخيص ضمن الإطار الاتحادي، ويجب أن يحمل الممرضون والفاصدون تراخيص وطنية سارية من الجهة الصحية المختصة.",
    turnaround: "24 ساعة",
    intro:
      "Al Borg Diagnostics، بشبكة فروعها على مستوى الدولة، هو المزود الرئيسي للسحب المنزلي في رأس الخيمة. بوصفها أكبر سلسلة مختبرات خاصة في منطقة الخليج، تحمل Al Borg اعتمادات CAP وJCI وISO 15189 وتفرض رسم زيارة منزلية بقيمة AED 50. تمتد التغطية عبر مدينة رأس الخيمة والمناطق السكنية المحيطة. لسكان الضاية وشعم ودفان النخيل، يُنصح بالتأكيد مع Al Borg عند الحجز لأن هذه المناطق تقع بعيداً عن شبكة الفروع الرئيسية.",
    howItWorks:
      "احجز عبر موقع Al Borg أو تطبيقها، أو اتصل مباشرة بفرع رأس الخيمة. يصل فاصد معتمد إلى موقعك في النافذة الزمنية المتفق عليها. تُعالج العينات في المنشأة المحلية لـAl Borg أو تُنقل إلى أقرب مركز معتمد. النتائج الروتينية جاهزة في غضون 24 ساعة. بالنسبة للفحوصات المتخصصة أو المرجعية، قد تُحوّل Al Borg العينات إلى مختبرها المرجعي في الرياض، مما قد يمدد وقت الاستجابة إلى 48–72 ساعة.",
    coverageNote:
      "تشمل التغطية الأساسية مدينة رأس الخيمة (النخيل وكورنيش القواسم والعريبي) وخزام والحمراء ومينا العرب والجزيرة الحمراء. المناطق النائية (شعم وغليلة وخط) قد تكون متاحة بشكل محدود — اتصل للتأكيد قبل الحجز.",
    areas: [
      "النخيل", "كورنيش القواسم", "خزام", "الحمراء",
      "مينا العرب", "العريبي",
    ],
    insuranceNote:
      "Al Borg Diagnostics متعاقدة مع معظم شبكات التأمين في الإمارات ودول الخليج. رسوم السحب المنزلي البالغة AED 50 عادةً غير مشمولة بالتأمين لأنها رسم راحة إضافية. للفحوصات المشمولة بـThiqa أو Daman أو الخطط المؤسسية، تكون تكاليف الفحوصات الفردية قابلة للاسترداد في الغالب. تحقق مع شركة التأمين ما إذا كانت Al Borg رأس الخيمة مدرجة ضمن شبكتك.",
    fastingTip:
      "جدول سحب الصيام الصباحي في الفترة من 7 إلى 9 صباحاً لضمان وصول الممرض وأنت لا تزال صائماً. يحمل فاصدو رأس الخيمة عادةً جميع المعدات اللازمة دون الحاجة لأي تحضير في المنزل. لفحوصات سكر الصيام ولوحة الدهون والأنسولين، اشرب ما لا يقل عن 300–500 مل من الماء قبلها لتسهيل الوصول الوريدي.",
  },
  fujairah: {
    regulator: "وزارة الصحة ووقاية المجتمع (MOHAP)",
    regulatorAbbrev: "MOHAP",
    regulatorFullNote:
      "تقع خدمات التشخيص والرعاية الصحية المنزلية في الفجيرة تحت ترخيص MOHAP الاتحادي. يجب أن يحمل جميع المختصين الصحيين الذين يزورون المنازل تراخيص وطنية سارية، ويجب أن تستوفي مختبرات المعالجة معايير الجودة التي تضعها MOHAP للكيمياء السريرية.",
    turnaround: "24 ساعة",
    intro:
      "تمتد شبكة Thumbay Labs في الإمارات الشمالية إلى الفجيرة، مما يجعلها الخيار الرئيسي للسحب المنزلي لسكان الساحل الشرقي. نظراً لتضاريس الفجيرة الأكثر تشتتاً مقارنةً بدبي أو أبوظبي، يناسب السحب المنزلي هنا بشكل أفضل سكانَ المنطقة الحضرية الرئيسية. ينبغي على ساكني دبا وخورفكان وكلباء التأكد مباشرة مع Thumbay لأن نطاق الخدمة يتفاوت.",
    howItWorks:
      "احجز مع Thumbay Labs بالاتصال بأقرب فرع أو باستخدام نموذج الحجز الإلكتروني. يصل فاصد مرخص من MOHAP إلى منزلك. نظراً للوجستيات نقل العينات من الفجيرة إلى منشأة المعالجة (عادةً مركز عجمان أو الشارقة)، يبلغ وقت الاستجابة نحو 24 ساعة للفحوصات الروتينية — أطول قليلاً من دبي أو أبوظبي.",
    coverageNote:
      "التغطية الأساسية هي منطقة مدينة الفجيرة (الفاصيل ومرشد والروقيلات وكورنيش الفجيرة). البلدات الساحلية النائية (دبا وخورفكان وكلباء) قد تكون متاحة عند الطلب مع ضرورة التخطيط المسبق.",
    areas: ["مدينة الفجيرة", "الفاصيل", "مرشد", "الروقيلات"],
    insuranceNote:
      "تقبل Thumbay Labs خطط التأمين الإماراتية الكبرى. بالنظر إلى كون الفجيرة جزءاً من نطاق MOHAP الاتحادي، تسري معظم الخطط الوطنية التي تغطي المختبرات المرخصة من MOHAP. رسوم السحب المنزلي على حساب المريض. اتصل بـThumbay للتأكيد من قبول التأمين وما إذا كانت فحوصاتك المحددة تستلزم موافقة مسبقة.",
    fastingTip:
      "نظراً لأن نقل العينات من الفجيرة إلى مختبر المعالجة يأخذ وقتاً إضافياً، احجز فحوصات الصيام في الصباح الباكر لتوسيع النافذة الزمنية قبل الحاجة إلى النتائج. تستهدف Thumbay استجابة 24 ساعة؛ يمكن إعطاء الأولوية للأطباق العاجلة إذا أُبلغ عنها عند الحجز.",
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { city: string };
}): Metadata {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) return { title: "المدينة غير موجودة" };

  const base = getBaseUrl();
  const arabicCityName = getArabicCityName(city.slug);
  const homeCollectionLabs = getLabsByCity(city.slug).filter((l) => l.homeCollection);
  const freeCount = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0).length;
  const n = homeCollectionLabs.length;
  const content = CITY_HOME_CONTENT_AR[city.slug];
  const regulatorAbbrev = content?.regulatorAbbrev ?? "الجهة الصحية المختصة";

  return {
    title: `خدمة السحب المنزلي للفحوصات المخبرية في ${arabicCityName} — ${n} مختبر مع السحب المنزلي | فحوصات المختبر في الإمارات`,
    description:
      `قارن ${n} مختبراً يقدم خدمة السحب المنزلي في ${arabicCityName}. ` +
      `${freeCount} مختبرات تقدم السحب المجاني. ` +
      `ممرضون مرخصون من ${regulatorAbbrev} يزورونك في منزلك. النتائج خلال 24 ساعة. احجز عبر الإنترنت.`,
    alternates: {
      canonical: `${base}/ar/labs/home-collection/${city.slug}`,
      languages: {
        "en-AE": `${base}/labs/home-collection/${city.slug}`,
        "ar-AE": `${base}/ar/labs/home-collection/${city.slug}`,
      },
    },
    openGraph: {
      title: `السحب المنزلي للفحوصات في ${arabicCityName} — ${n} مختبر | فحوصات المختبر في الإمارات`,
      description: `${n} مختبراً يقدم سحب الدم المنزلي في ${arabicCityName}. ${freeCount} مجاناً. ممرضون مرخصون من ${regulatorAbbrev}، نتائج رقمية خلال 24 ساعة.`,
      url: `${base}/ar/labs/home-collection/${city.slug}`,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArabicHomeCollectionCityPage({
  params,
}: {
  params: { city: string };
}) {
  const city = CITIES.find((c) => c.slug === params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const arabicCityName = getArabicCityName(city.slug);
  const allCityLabs = getLabsByCity(city.slug);
  const homeCollectionLabs = allCityLabs
    .filter((l) => l.homeCollection)
    .sort((a, b) => {
      if (a.homeCollectionFee !== b.homeCollectionFee) return a.homeCollectionFee - b.homeCollectionFee;
      const aMin = getPricesForLab(a.slug).reduce((m, p) => Math.min(m, p.price), Infinity);
      const bMin = getPricesForLab(b.slug).reduce((m, p) => Math.min(m, p.price), Infinity);
      return aMin - bMin;
    });

  if (homeCollectionLabs.length === 0) notFound();

  const freeCollectionLabs = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0);
  const fastestTurnaround = Math.min(...homeCollectionLabs.map((l) => l.turnaroundHours));

  const homeLabSlugs = new Set(homeCollectionLabs.map((l) => l.slug));

  const homeCollectionTestSlugs = new Set(
    LAB_TEST_PRICES.filter((p) => homeLabSlugs.has(p.labSlug)).map((p) => p.testSlug)
  );

  const homeCollectionCategories = TEST_CATEGORIES.filter(
    (cat) =>
      cat.slug !== "imaging" &&
      LAB_TESTS.some((t) => t.category === cat.slug && homeCollectionTestSlugs.has(t.slug))
  );

  const POPULAR_SLUGS = [
    "cbc", "vitamin-d", "thyroid-panel", "hba1c", "lipid-profile",
    "vitamin-b12", "lft", "kft",
  ];
  const popularHomeTests = POPULAR_SLUGS
    .filter((slug) => homeCollectionTestSlugs.has(slug))
    .map((slug) => {
      const test = LAB_TESTS.find((t) => t.slug === slug)!;
      const prices = LAB_TEST_PRICES.filter(
        (p) => p.testSlug === slug && homeLabSlugs.has(p.labSlug)
      );
      const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : null;
      return { test, minPrice, maxPrice, labCount: prices.length };
    })
    .filter((t) => t.minPrice !== null);

  const otherCitiesWithHome = CITIES.filter(
    (c) =>
      c.slug !== city.slug &&
      getLabsByCity(c.slug).some((l) => l.homeCollection)
  );

  const content = CITY_HOME_CONTENT_AR[city.slug] ?? {
    regulator: "الجهة الصحية المختصة في الإمارات",
    regulatorAbbrev: "MOHAP" as const,
    regulatorFullNote:
      "تعمل جميع خدمات السحب المنزلي في هذه الإمارة ضمن الإطار التراخيصي للجهة الصحية الإماراتية المختصة.",
    turnaround: "24 ساعة",
    intro: `خدمة سحب الدم المنزلي متاحة في ${arabicCityName} عبر مختبرات تشخيصية مرخصة ومنصات خدمة منزلية.`,
    howItWorks:
      "احجز عبر الإنترنت أو الهاتف، واختر نافذة زمنية، وسيزور ممرض معتمد منزلك أو مكتبك لسحب عينات الدم. تُسلَّم النتائج رقمياً خلال 24 ساعة.",
    coverageNote: `تشمل التغطية منطقة ${arabicCityName} الحضرية الرئيسية. أكّد التوافر لحيّك المحدد عند الحجز.`,
    areas: [],
    insuranceNote:
      "تغطي معظم خطط التأمين الصحي الإماراتية الكبرى تكاليف الفحوصات المخبرية الفردية في المنشآت المرخصة. رسوم السحب المنزلي عادةً على حساب المريض.",
    fastingTip:
      "لفحوصات الصيام، توقف عن تناول الطعام 8–12 ساعة قبل السحب. اشرب الماء وتناول الأدوية المعتادة كالمعتاد ما لم يوصِ طبيبك بخلاف ذلك.",
  };

  const breadcrumbs = [
    { name: "الإمارات", url: base },
    { name: "الفحوصات المخبرية", url: `${base}/ar/labs` },
    { name: "السحب المنزلي", url: `${base}/ar/labs/home-collection` },
    { name: arabicCityName },
  ];

  const faqs = [
    {
      question: `كم تكلف خدمة سحب الدم المنزلي في ${arabicCityName}؟`,
      answer:
        `تتراوح رسوم السحب المنزلي في ${arabicCityName} بين المجاني وAED ${Math.max(...homeCollectionLabs.map((l) => l.homeCollectionFee))}. ` +
        `${freeCollectionLabs.length > 0 ? `${freeCollectionLabs.map((l) => l.name).join(" و")} تقدم سحباً منزلياً مجانياً تماماً — تدفع فقط مقابل الفحوصات. ` : ""}` +
        `أسعار الفحوصات الفردية من مختبرات السحب المنزلي مشابهة للأسعار الحضورية. يبدأ تحليل CBC الأساسي من AED ${popularHomeTests.find((t) => t.test.slug === "cbc")?.minPrice ?? 69}.`,
    },
    {
      question: `كم يستغرق وصول ممرض السحب المنزلي في ${arabicCityName}؟`,
      answer:
        `تسعى معظم خدمات السحب المنزلي في ${arabicCityName} إلى إرسال ممرض مرخص من ${content.regulatorAbbrev} في غضون 30–90 دقيقة من الحجز، أو في الموعد المحدد مسبقاً. ` +
        `ساعات العمل عادةً من 7 صباحاً إلى 9 أو 11 مساءً يومياً. لسحب الصيام، احجز ليلة السابقة وجدول موعداً في 7–8 صباحاً لتقليل وقت الانتظار.`,
    },
    {
      question: `هل سحب الدم المنزلي آمن في ${arabicCityName}؟`,
      answer:
        `نعم. يجب أن تعمل جميع خدمات السحب المنزلي في ${arabicCityName} تحت ترخيص ${content.regulator}. ` +
        `يستخدم الفاصدون إبراً معقمة للاستخدام مرة واحدة وأنظمة فاكيوتينر، ويتبعون بروتوكولات مكافحة العدوى، وينقلون العينات في حاويات سلسلة باردة مُعتمدة إلى مختبرات معالجة معتمدة من ${content.regulatorAbbrev}. ` +
        `الجودة السريرية للنتائج معادلة لزيارة المختبر الحضورية.`,
    },
    {
      question: `ما المناطق في ${arabicCityName} التي تشملها خدمة سحب الدم المنزلي؟`,
      answer:
        content.coverageNote +
        (content.areas.length > 0
          ? ` تشمل مناطق التغطية الرئيسية ${content.areas.slice(0, 6).join(" و")}.`
          : ""),
    },
    {
      question: `هل يغطي التأمين خدمة سحب الدم المنزلي في ${arabicCityName}؟`,
      answer: content.insuranceNote,
    },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `خدمة السحب المنزلي للفحوصات المخبرية في ${arabicCityName}`,
    description: `قارن ${homeCollectionLabs.length} مختبراً يقدم سحب الدم المنزلي في ${arabicCityName}. ${freeCollectionLabs.length} مجاناً. ممرضون مرخصون من ${content.regulatorAbbrev}، نتائج في ${content.turnaround}.`,
    url: `${base}/ar/labs/home-collection/${city.slug}`,
    numberOfItems: homeCollectionLabs.length,
    itemListElement: homeCollectionLabs.map((lab, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalClinic",
        name: lab.name,
        url: `${base}/labs/${lab.slug}`,
        description: lab.description,
      },
    })),
  };

  return (
    <div className="font-arabic container-tc py-8" dir="rtl">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={collectionPageSchema} />

      <Breadcrumb
        items={[
          { label: "الإمارات", href: "/ar" },
          { label: "الفحوصات المخبرية", href: "/ar/labs" },
          { label: "السحب المنزلي", href: "/ar/labs/home-collection" },
          { label: arabicCityName },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            خدمة السحب المنزلي للفحوصات المخبرية في {arabicCityName} —{" "}
            {homeCollectionLabs.length} مختبر مع السحب المنزلي
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {content.intro}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: homeCollectionLabs.length.toString(),
              label: `مختبرات مع خدمة السحب المنزلي في ${arabicCityName}`,
            },
            {
              value: freeCollectionLabs.length.toString(),
              label: "تقدم السحب المنزلي المجاني",
            },
            {
              value: `${fastestTurnaround}س`,
              label: "أسرع وقت استجابة متاح",
            },
            {
              value: homeCollectionTestSlugs.size.toString(),
              label: "فحصاً متاحاً في المنزل",
            },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-light-50 p-4 text-center border border-black/[0.06]"
            >
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Labs offering home collection */}
      <div className="section-header">
        <h2>المختبرات التي تقدم السحب المنزلي في {arabicCityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          المختبرات الـ{homeCollectionLabs.length} أدناه تقدم جميعها خدمة سحب الدم المنزلي
          في {arabicCityName}. مرتبة حسب رسوم السحب (المجاني أولاً)، ثم حسب أدنى سعر للفحص.
          جميعها تعمل تحت ترخيص {content.regulator}.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {homeCollectionLabs.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest =
            prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
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

      {/* Free vs Paid Comparison Table */}
      <div className="section-header">
        <h2>مقارنة السحب المجاني مقابل المدفوع في {arabicCityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          من بين {homeCollectionLabs.length} مختبراً يقدم السحب المنزلي في {arabicCityName}،{" "}
          {freeCollectionLabs.length} لا تفرض أي رسوم على الزيارة. أما
          المختبرات الـ{homeCollectionLabs.length - freeCollectionLabs.length} المتبقية
          فتفرض رسوم زيارة منزلية إضافية على أسعار الفحوصات.
        </p>
      </div>
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-xs border border-black/[0.06]">
          <thead>
            <tr className="bg-light-50">
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">المختبر</th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">
                رسوم السحب
              </th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">
                وقت الاستجابة
              </th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">
                الاعتمادات
              </th>
              <th className="text-right p-3 font-bold text-dark border-b border-black/[0.06]">
                الفحوصات المتاحة
              </th>
            </tr>
          </thead>
          <tbody>
            {homeCollectionLabs.map((lab, i) => {
              const labTestCount = LAB_TEST_PRICES.filter(
                (p) => p.labSlug === lab.slug
              ).length;
              return (
                <tr
                  key={lab.slug}
                  className={i % 2 === 0 ? "bg-white" : "bg-light-50"}
                >
                  <td className="p-3 border-b border-black/[0.06]">
                    <Link
                      href={`/labs/${lab.slug}`}
                      className="font-bold text-dark hover:text-accent transition-colors"
                    >
                      {lab.name}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">
                      {lab.type === "home-service"
                        ? "منصة خدمة منزلية"
                        : "سلسلة مختبرات"}
                    </div>
                  </td>
                  <td className="p-3 border-b border-black/[0.06]">
                    {lab.homeCollectionFee === 0 ? (
                      <span className="font-bold text-accent">مجاني</span>
                    ) : (
                      <span className="font-medium text-dark">
                        AED {lab.homeCollectionFee}
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-b border-black/[0.06] text-muted">
                    {lab.turnaroundHours}س
                  </td>
                  <td className="p-3 border-b border-black/[0.06] text-muted">
                    {lab.accreditations.slice(0, 3).join("، ")}
                  </td>
                  <td className="p-3 border-b border-black/[0.06] text-muted">
                    {labTestCount > 0 ? `${labTestCount} فحصاً` : "تواصل مع المختبر"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Test Categories Available */}
      <div className="section-header">
        <h2>فئات الفحوصات المتاحة في المنزل في {arabicCityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          الفئات الـ{homeCollectionCategories.length} أدناه تضم جميعها فحصاً واحداً على الأقل
          متاحاً من مختبر يقدم السحب المنزلي في {arabicCityName}. انقر على أي فئة لعرض
          جميع الفحوصات المتاحة مع الأسعار.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {homeCollectionCategories.map((cat) => {
          const catTests = LAB_TESTS.filter(
            (t) => t.category === cat.slug && homeCollectionTestSlugs.has(t.slug)
          );
          return (
            <Link
              key={cat.slug}
              href={`/ar/labs/home-collection/${city.slug}/${cat.slug}`}
              className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-muted mt-1">
                {catTests.length} فحص متاح في المنزل
              </p>
              <div className="flex items-center gap-1 mt-2 text-accent text-xs font-medium">
                <span>قارن</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Popular Tests for Home Collection */}
      <div className="section-header">
        <h2>الفحوصات الشائعة للسحب المنزلي في {arabicCityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          نطاقات الأسعار أدناه من مختبرات السحب المنزلي في {arabicCityName} فحسب.
          الأسعار مشابهة للأسعار الحضورية — تكلفتك الإضافية الوحيدة قد تكون رسوم
          السحب المنزلي (مجانية في {freeCollectionLabs.length} مختبرات).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {popularHomeTests.map(({ test, minPrice, maxPrice, labCount: lCount }) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-black/[0.06] hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {test.fastingRequired ? "يستلزم الصيام · " : "لا يستلزم صياماً · "}
                وقت استجابة {test.turnaroundHours} ساعة
              </p>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="text-sm font-bold text-accent">
                {formatPrice(minPrice!)}
              </p>
              {minPrice !== maxPrice && (
                <p className="text-[10px] text-muted">
                  – {formatPrice(maxPrice!)}
                </p>
              )}
              <p className="text-[10px] text-muted">{lCount} مختبرات</p>
            </div>
          </Link>
        ))}
      </div>

      {/* How home collection works in this city */}
      <div className="section-header">
        <h2>كيف تعمل الخدمة في {arabicCityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed">{content.howItWorks}</p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            icon: Smartphone,
            step: "١",
            title: "احجز عبر الإنترنت أو الهاتف",
            body: `اختر فحوصاتك ونافذة زمنية على موقع المختبر أو تطبيقه أو بالاتصال المباشر. تعمل معظم خدمات ${arabicCityName} من 7 صباحاً إلى 9–11 مساءً يومياً. لفحوصات الصيام، احجز ليلة السابقة واختر موعداً في 7–8 صباحاً.`,
          },
          {
            icon: UserCheck,
            step: "٢",
            title: `وصول ممرض مرخص من ${content.regulatorAbbrev}`,
            body: `يصل فاصد مرخص من ${content.regulatorAbbrev} إلى منزلك أو مكتبك أو فندقك في الوقت المحدد، ومعه إبر معقمة وأنابيب فاكيوتينر ومناديل معقمة وملصقات العينات وحقيبة نقل سلسلة باردة.`,
          },
          {
            icon: TestTube,
            step: "٣",
            title: "سحب العينة",
            body: "يسحب الممرض الدم (والبول إن طُلب) بالأسلوب المعياري. تستغرق الزيارة 10–15 دقيقة. تُغلق العينات وتُصنَّف وتوضع فوراً في حاويات مضبوطة الحرارة.",
          },
          {
            icon: FileText,
            step: "٤",
            title: `النتائج الرقمية في ${content.turnaround}`,
            body: "تصل العينات إلى مختبر المعالجة في غضون ساعات. تُسلَّم النتائج عبر تطبيق آمن أو بريد إلكتروني أو ملف PDF على واتساب. تتيح معظم الجهات مشاركة النتائج مباشرة مع طبيبك.",
          },
        ].map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="border border-black/[0.06] p-4 bg-light-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step}
              </div>
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold text-dark text-sm mb-2">{title}</h3>
            <p className="text-xs text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Regulatory note */}
      <div className="bg-light-50 border border-black/[0.06] p-5 mb-10">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              ترخيص {content.regulator}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {content.regulatorFullNote}
            </p>
          </div>
        </div>
      </div>

      {/* Fasting prep */}
      <div className="bg-light-50 border border-black/[0.06] p-5 mb-10">
        <div className="flex items-start gap-3">
          <Microscope className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              نصيحة الصيام وتحضيرات السحب المنزلي في {arabicCityName}
            </p>
            <p className="text-xs text-muted leading-relaxed">{content.fastingTip}</p>
          </div>
        </div>
      </div>

      {/* Insurance note */}
      <div className="bg-light-50 border border-black/[0.06] p-5 mb-10">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              تغطية التأمين في {arabicCityName}
            </p>
            <p className="text-xs text-muted leading-relaxed">{content.insuranceNote}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title={`السحب المنزلي للفحوصات في ${arabicCityName} — الأسئلة الشائعة`}
      />

      {/* Other cities */}
      {otherCitiesWithHome.length > 0 && (
        <>
          <div className="section-header mt-8">
            <h2>السحب المنزلي في مدن إماراتية أخرى</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {otherCitiesWithHome.map((otherCity) => {
              const otherHomeLabs = getLabsByCity(otherCity.slug).filter(
                (l) => l.homeCollection
              );
              const otherArabicName = getArabicCityName(otherCity.slug);
              return (
                <Link
                  key={otherCity.slug}
                  href={`/ar/labs/home-collection/${otherCity.slug}`}
                  className="border border-black/[0.06] p-3 hover:border-accent transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                      {otherArabicName}
                    </h3>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
                    <Home className="w-3 h-3 text-accent" />
                    {otherHomeLabs.length} مختبرات
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Browse all */}
      <div className="border border-black/[0.06] p-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold text-dark">
            قارن جميع خدمات السحب المنزلي في الإمارات
          </p>
          <p className="text-xs text-muted mt-0.5">
            {homeCollectionLabs.length} مختبرات في {arabicCityName} · عرض جميع المدن الإماراتية
          </p>
        </div>
        <Link
          href="/ar/labs/home-collection"
          className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors flex-shrink-0"
        >
          جميع المدن <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>إخلاء المسؤولية:</strong> تستند معلومات رسوم السحب المنزلي والتسعير إلى
          بيانات متاحة للعموم من مواقع المختبرات ومنصات التجميع (2024–2025). قد تتفاوت
          الرسوم الفعلية بحسب الموقع ووقت اليوم وتغطية التأمين والعروض الترويجية. تأكد
          دائماً من الأسعار والتوافر مباشرة مع الجهة المزودة قبل الحجز. هذا الدليل للأغراض
          الإعلامية فحسب ولا يُعدّ نصيحة طبية. استشر طبيبك قبل طلب أي فحوصات تشخيصية.
          جميع الجهات المدرجة تعمل تحت ترخيص {content.regulator}. آخر تحديث للبيانات مارس 2026.
        </p>
      </div>
    </div>
  );
}
