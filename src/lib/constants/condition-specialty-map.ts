/**
 * Condition → specialties mapping used by condition matching pages.
 *
 * Part of Item 4 (Part C — condition matching pages) of the
 * Zocdoc→Zavis roadmap. A richer alternative to the
 * `relatedCategories` list on `HealthCondition`, adding:
 *
 *   - Ordered specialty priority (e.g. "back pain" routes first to
 *     physio + orthopedics, not to hospitals)
 *   - Clinical detail: symptoms, red-flags, urgency criteria, insurance
 *     coverage notes
 *   - Bilingual EN/AR intro copy for the hero block
 *   - Associated tests the patient may need (labs cross-link)
 *
 * Every field is optional on a per-condition basis — the condition
 * page only renders a section when the data is present. Missing data
 * means the section is omitted, not faked.
 *
 * This file is hand-curated. It is the authoritative source — the
 * `relatedCategories` list in `src/lib/constants/conditions.ts` is a
 * legacy sidecar retained for backward compatibility.
 */

export interface ConditionSpecialtyDetail {
  slug: string;
  name: string;
  nameAr?: string;
  /** Ordered list of category slugs that treat this condition (most relevant first). */
  specialties: string[];
  /** ~300-word EN intro that goes under the hero. */
  introEn: string;
  /**
   * Matching AR intro. Optional because the synthetic fallback (for
   * conditions without a hand-authored entry) does NOT produce an Arabic
   * translation — downstream render paths must skip the AR block when
   * this is undefined. Never populate with English text — that serves
   * English inside `<div dir="rtl" lang="ar">` which is an E-E-A-T fail.
   */
  introAr?: string;
  /** Common symptoms — rendered as a bullet list. */
  symptomsEn?: string[];
  symptomsAr?: string[];
  /** Red-flag urgent-care criteria — rendered in an amber warning banner. */
  urgentSignsEn?: string[];
  urgentSignsAr?: string[];
  /** Associated diagnostic tests (slug references into the labs module). */
  relatedTests?: string[];
  /** Typical co-pay / coverage notes per UAE payer. */
  insuranceNotesEn?: string;
  insuranceNotesAr?: string;
  /**
   * Anatomy hint for JSON-LD `associatedAnatomy`. Plain schema.org body
   * part names — "knee", "stomach", "brain", etc. Optional.
   */
  anatomy?: string;
  /** Modifiable risk factors for JSON-LD `riskFactor`. Optional. */
  riskFactors?: string[];
  /** Possible treatments for JSON-LD `possibleTreatment`. Optional. */
  possibleTreatments?: string[];
}

export const CONDITION_SPECIALTY_MAP: ConditionSpecialtyDetail[] = [
  {
    slug: "back-pain",
    name: "Back Pain",
    nameAr: "آلام الظهر",
    specialties: [
      "physiotherapy",
      "orthopedics",
      "neurology",
      "alternative-medicine",
      "radiology-imaging",
      "hospitals",
    ],
    introEn: `Back pain is one of the most common reasons UAE adults visit a clinic — often driven by desk-bound work, poor ergonomics, long commutes and insufficient daily movement. Most episodes are musculoskeletal (muscle strain, disc irritation, facet joint pain) and resolve with conservative care: physiotherapy, targeted exercise, short courses of anti-inflammatories and postural correction. A minority of cases — those with radicular leg pain, progressive weakness, saddle anaesthesia, or red-flag features like unexplained weight loss, fever, history of cancer, or night pain — require urgent specialist evaluation. In the UAE, the typical care path starts with a GP or family physician, escalating to physiotherapy and orthopedic or spine consultants, with neurology or neurosurgery brought in for suspected nerve-root or spinal cord involvement. MRI imaging is widely available but should only be ordered when it will change management. Acupuncture, chiropractic and osteopathy are offered by some licensed alternative-medicine providers in Dubai and Abu Dhabi — check licensing with DHA/DOH. Most UAE insurance plans cover GP assessment, imaging on referral, and a limited number of physiotherapy sessions per year; check your policy for session caps and co-pays.`,
    introAr: `تُعدّ آلام الظهر من أكثر الأسباب شيوعاً لزيارة العيادات في الإمارات، وغالباً ما تكون مرتبطة بالعمل المكتبي والجلوس الطويل وضعف النشاط البدني اليومي. معظم الحالات عضلية-هيكلية وتتحسّن بالعلاج التحفظي: العلاج الطبيعي، التمارين الموجّهة، مسكّنات قصيرة الأمد، وتصحيح الوضعية. أما الحالات التي تظهر فيها آلام منتشرة إلى الساق أو ضعف متزايد أو فقدان وزن غير مبرّر أو حمى أو تاريخ مرضي للسرطان، فتستوجب تقييماً متخصّصاً عاجلاً. في الإمارات يبدأ مسار الرعاية عادة بطبيب عام ثم يُحال إلى العلاج الطبيعي وأطباء العظام أو العمود الفقري، ويتم إشراك طبيب الأعصاب عند الاشتباه بمشاكل في جذور الأعصاب. التصوير بالرنين المغناطيسي متاح على نطاق واسع. تغطي أغلب خطط التأمين الاستشارة والتصوير بالإحالة وعدداً محدداً من جلسات العلاج الطبيعي سنوياً.`,
    symptomsEn: [
      "Dull or sharp pain in the lower, middle or upper back",
      "Pain that worsens with prolonged sitting, bending or lifting",
      "Muscle stiffness in the morning or after inactivity",
      "Pain that radiates into the buttock, thigh or leg",
      "Tingling or numbness in one leg",
    ],
    symptomsAr: [
      "ألم حاد أو خفيف في أسفل أو وسط أو أعلى الظهر",
      "ألم يزداد مع الجلوس الطويل أو الانحناء أو الرفع",
      "تيبّس عضلي في الصباح أو بعد فترات الراحة",
      "ألم ينتشر إلى الأرداف أو الفخذ أو الساق",
      "خدر أو وخز في إحدى الساقين",
    ],
    urgentSignsEn: [
      "Progressive leg weakness or foot drop",
      "Loss of bladder or bowel control (cauda equina syndrome)",
      "Saddle-area numbness",
      "Fever with back pain",
      "Unexplained weight loss or night pain",
    ],
    urgentSignsAr: [
      "ضعف متزايد في الساق أو سقوط القدم",
      "فقدان السيطرة على المثانة أو الأمعاء",
      "خدر في منطقة السرج",
      "حمى مصاحبة لألم الظهر",
      "فقدان وزن غير مبرّر أو ألم ليلي",
    ],
    relatedTests: [],
    insuranceNotesEn: `Daman, Thiqa, AXA, Cigna and Bupa all typically cover GP assessment and physiotherapy sessions with a referral, subject to annual caps. MRI is usually covered when ordered by an orthopedic or neurology consultant. Co-pays vary from 0% (Thiqa primary-care) to 20% on many private plans.`,
    insuranceNotesAr: `تغطي خطط ضمان وثقة وإيه إكس إيه وسيجنا وبوبا عادةً فحوصات الطبيب العام وجلسات العلاج الطبيعي بإحالة، ضمن حدود سنوية. يُغطّى التصوير بالرنين المغناطيسي عند طلبه من أخصائي عظام أو أعصاب. تتراوح المساهمات بين 0% لخطة ثقة في الرعاية الأولية و20% في كثير من الخطط الخاصة.`,
    anatomy: "spine",
    riskFactors: [
      "Sedentary lifestyle",
      "Obesity",
      "Poor ergonomics",
      "Smoking",
      "Heavy lifting",
    ],
    possibleTreatments: [
      "Physiotherapy",
      "NSAIDs",
      "Epidural steroid injection",
      "Spinal surgery",
    ],
  },
  {
    slug: "diabetes-management",
    name: "Diabetes Management",
    nameAr: "إدارة مرض السكري",
    specialties: [
      "clinics",
      "hospitals",
      "nutrition-dietetics",
      "ophthalmology",
      "cardiology",
      "nephrology",
    ],
    introEn: `Type-2 diabetes prevalence in the UAE is among the highest in the world — around one in five adults — driven by genetics, sedentary lifestyles, calorie-dense diets and high rates of obesity. Diabetes is rarely managed by a single clinic: effective care integrates primary-care follow-up, dietitian-led nutrition counseling, medication management (metformin, GLP-1 agonists, SGLT-2 inhibitors, insulin), annual retinal screening, foot checks, renal function monitoring and cardiovascular risk assessment. In the UAE, most DHA-compliant insurance plans cover diabetes consultations, HbA1c and lipid testing, standard oral medications and, increasingly, GLP-1 and SGLT-2 agents with pre-authorisation. Diabetic retinopathy screening is covered annually under most plans. Patients newly diagnosed with Type-1 diabetes or with poorly controlled Type-2 are typically referred to an endocrinologist for intensification of therapy and CGM (continuous glucose monitoring) guidance. Every major hospital in Dubai, Abu Dhabi and Sharjah runs a diabetes center — Imperial College London Diabetes Centre (Abu Dhabi + Al Ain) is a regional reference.`,
    introAr: `يُعدّ انتشار داء السكري من النوع الثاني في الإمارات من الأعلى عالمياً — نحو واحد من كل خمسة بالغين — مدفوعاً بعوامل وراثية ونمط حياة خامل ونظام غذائي عالي السعرات وارتفاع معدلات السمنة. نادراً ما تُدار حالة السكري في عيادة واحدة: يتطلب العلاج الفعّال متابعة في الرعاية الأولية، إرشاداً غذائياً من اختصاصي تغذية، إدارة الأدوية (ميتفورمين، حاصرات GLP-1، حاصرات SGLT-2، إنسولين)، فحصاً سنوياً للشبكية، فحص القدم، ومتابعة وظائف الكلى والمخاطر القلبية. تغطي معظم خطط التأمين المعتمدة في الإمارات الاستشارات واختبارات HbA1c والدهون والأدوية الأساسية. يُحال مرضى النوع الأول أو الحالات غير المنضبطة إلى طبيب غدد صم لتكثيف العلاج.`,
    symptomsEn: [
      "Excessive thirst and frequent urination",
      "Unexplained weight loss",
      "Fatigue and weakness",
      "Blurred vision",
      "Slow-healing wounds or frequent infections",
    ],
    symptomsAr: [
      "عطش شديد وكثرة التبول",
      "فقدان وزن غير مبرّر",
      "تعب وضعف",
      "رؤية مشوّشة",
      "التئام جروح بطيء أو التهابات متكررة",
    ],
    urgentSignsEn: [
      "Nausea, vomiting, abdominal pain with high blood sugar (possible DKA)",
      "Fruity breath odour",
      "Rapid breathing and confusion",
      "Blood sugar above 300 mg/dL with symptoms",
    ],
    urgentSignsAr: [
      "غثيان وقيء وألم بطن مع ارتفاع السكر (احتمال الحماض الكيتوني)",
      "رائحة نفس كرائحة الفاكهة",
      "تنفس سريع وارتباك",
      "سكر الدم فوق 300 ملغم/ديسيلتر مع أعراض",
    ],
    relatedTests: ["hba1c", "fasting-glucose", "lipid-profile"],
    insuranceNotesEn: `Diabetes consultations, HbA1c, lipid panel, eGFR and most oral anti-diabetics are covered under DHA Essential Benefits Plan, Daman Enhanced and Thiqa. GLP-1 agonists (semaglutide, dulaglutide) and SGLT-2 inhibitors typically require pre-authorisation. Annual retinopathy screening is covered under most plans.`,
    insuranceNotesAr: `استشارات السكري وتحاليل HbA1c والدهون ووظائف الكلى وأغلب الأدوية الفموية مغطاة ضمن خطة دبي للمنافع الأساسية وضمان المحسّنة وثقة. تحتاج حاصرات GLP-1 وSGLT-2 عادة إلى موافقة مسبقة. ويُغطّى الفحص السنوي للشبكية في معظم الخطط.`,
    anatomy: "pancreas",
    riskFactors: ["Obesity", "Sedentary lifestyle", "Family history", "Age over 40", "High-calorie diet"],
    possibleTreatments: ["Metformin", "GLP-1 agonists", "SGLT-2 inhibitors", "Insulin therapy", "Lifestyle modification"],
  },
  {
    slug: "dental-implants",
    name: "Dental Implants",
    nameAr: "زرع الأسنان",
    specialties: ["dental"],
    introEn: `Dental implants are the UAE's standard-of-care for replacing missing teeth — more predictable than bridges or partial dentures and preserving the underlying bone. An implant case typically involves a consultation and CT/CBCT scan, surgical placement of a titanium fixture into the jawbone, a healing period of 2–6 months, and restoration with a custom crown. The UAE has a mature implant market with practitioners trained in Germany, Switzerland, the UK, the US and the Arab region; popular fixture systems include Straumann, Nobel Biocare, MIS, Dentium and Osstem. Full-mouth immediate-load cases ("All-on-4 / All-on-6") are widely offered at higher price points. Implant dentistry is rarely covered by insurance in the UAE — most plans either exclude implants entirely or cover only the extraction and temporary denture. Expect total case costs to range from AED 3,500 for a single standard implant to AED 70,000+ for full-arch rehabilitation. Choose a dentist with specific implant training, published cases and transparent pricing.`,
    introAr: `تُعدّ زرعات الأسنان معيار الرعاية في الإمارات لاستبدال الأسنان المفقودة — أكثر ثباتاً من الجسور والأطقم الجزئية وتحافظ على العظم الداعم. تشمل عملية الزرع عادة استشارة وتصويراً مقطعياً، وزرعاً جراحياً لغرسة من التيتانيوم في عظم الفك، وفترة التئام من 2 إلى 6 أشهر، ثم تركيب تاج مخصص. يتمتع سوق الزرعات في الإمارات بنضج واضح، ومن أشهر الأنظمة المستخدمة: ستراومان، نوبل بيوكير، MIS، دينتيوم، أوسْتم. تُقدَّم حالات التحميل الفوري الكاملة (All-on-4 / All-on-6) على نطاق واسع. نادراً ما تغطي شركات التأمين زرعات الأسنان — تتراوح التكلفة من 3,500 درهم للغرسة الواحدة إلى أكثر من 70,000 درهم للحالات الكاملة. اختر طبيباً بخبرة موثّقة وأسعار شفافة.`,
    symptomsEn: [
      "Missing one or more teeth",
      "Difficulty chewing on one side",
      "Loose or failing existing bridge or denture",
      "Bone loss visible on a dental X-ray",
    ],
    symptomsAr: [
      "فقدان سن واحد أو أكثر",
      "صعوبة في المضغ على جانب واحد",
      "جسر أو طقم متحرك غير مستقر",
      "فقدان عظم واضح على أشعة الأسنان",
    ],
    insuranceNotesEn: `Most UAE insurance plans do not cover dental implants. A minority of high-tier plans (typically international Bupa Gold or executive-level Cigna) include partial reimbursement. Always request a pre-authorisation from your insurer before committing to an implant case.`,
    insuranceNotesAr: `لا تغطي معظم خطط التأمين في الإمارات زرعات الأسنان. تتيح بعض الخطط العليا (مثل بوبا الدولية الذهبية أو سيجنا التنفيذية) تعويضاً جزئياً. اطلب موافقة مسبقة من شركة تأمينك قبل البدء.`,
    anatomy: "jaw",
    riskFactors: ["Smoking", "Uncontrolled diabetes", "Periodontal disease", "Osteoporosis"],
    possibleTreatments: ["Single-implant crown", "Implant-supported bridge", "All-on-4 full arch", "Bone grafting"],
  },
  {
    slug: "mental-health-anxiety",
    name: "Mental Health / Anxiety",
    nameAr: "الصحة النفسية / القلق",
    specialties: ["mental-health", "clinics", "hospitals", "nutrition-dietetics"],
    introEn: `Mental health services in the UAE have expanded significantly in the past decade, driven by growing public awareness and dedicated federal initiatives. Anxiety and depression are the most commonly treated conditions, followed by work-related stress, burnout, adjustment disorders, and post-traumatic stress. Care is available through psychiatrists (who can prescribe medication), clinical psychologists (who provide assessment and therapy), counselors and mental health social workers. Most major private hospitals in Dubai and Abu Dhabi run dedicated behavioural-health departments, and Emirates Health Services operates the American Center for Psychiatry & Neurology and several public mental-health clinics. Sessions are typically 45–60 minutes, and cognitive-behavioural therapy (CBT) is the most common evidence-based modality offered. Insurance coverage for mental health varies widely: some DHA-compliant plans cap outpatient therapy at 8–12 sessions per year, while Daman Thiqa has broader coverage. Patients may self-refer to most private psychologists; a referral from a GP is usually required for in-network psychiatrists. Telehealth consultations are now widely available and covered by many plans.`,
    introAr: `توسّعت خدمات الصحة النفسية في الإمارات بشكل ملحوظ خلال العقد الأخير، مدفوعة بزيادة الوعي العام ومبادرات اتحادية مخصّصة. القلق والاكتئاب هما أكثر الحالات شيوعاً، تليهما الضغط المهني والاحتراق الوظيفي واضطرابات التكيّف واضطراب ما بعد الصدمة. تتوفر الرعاية عبر الأطباء النفسيين (يصفون الأدوية) وعلماء النفس السريريين (يقدمون التقييم والعلاج) والمستشارين. تدير معظم المستشفيات الخاصة الكبرى في دبي وأبوظبي أقساماً مخصّصة للصحة السلوكية. جلسات العلاج تستمر 45–60 دقيقة، والعلاج المعرفي السلوكي هو الأكثر تطبيقاً. تتفاوت تغطية التأمين: تتيح بعض الخطط 8–12 جلسة سنوياً فقط، بينما تمنح ثقة تغطية أوسع. خدمات الصحة النفسية عن بعد متاحة الآن ومغطاة في كثير من الخطط.`,
    symptomsEn: [
      "Persistent worry or racing thoughts",
      "Sleep disruption (trouble falling or staying asleep)",
      "Panic attacks",
      "Low mood or loss of interest",
      "Difficulty concentrating at work",
      "Physical symptoms: chest tightness, headaches, nausea",
    ],
    symptomsAr: [
      "قلق مستمر أو أفكار متسارعة",
      "اضطراب النوم",
      "نوبات هلع",
      "مزاج منخفض أو فقدان الاهتمام",
      "صعوبة التركيز في العمل",
      "أعراض جسدية: ضيق صدر، صداع، غثيان",
    ],
    urgentSignsEn: [
      "Thoughts of self-harm or suicide",
      "Inability to function at work or home",
      "Severe panic that mimics a heart attack",
      "Drug or alcohol misuse",
    ],
    urgentSignsAr: [
      "أفكار إيذاء النفس أو الانتحار",
      "عدم القدرة على أداء العمل أو الحياة اليومية",
      "نوبة هلع شديدة تشبه النوبة القلبية",
      "إساءة استخدام المخدرات أو الكحول",
    ],
    insuranceNotesEn: `Most DHA Essential Benefits plans cap outpatient mental-health sessions at 8–12 per year. Daman Enhanced and Thiqa cover more. Check whether your plan requires a GP referral before seeing a psychiatrist. Cash-rate sessions typically cost AED 400–900.`,
    insuranceNotesAr: `تحدّد معظم خطط دبي الأساسية 8–12 جلسة سنوياً للصحة النفسية الخارجية. تغطي ضمان المحسّنة وثقة عدداً أكبر. تحقّق مما إذا كانت خطتك تتطلب إحالة من طبيب عام قبل زيارة الطبيب النفسي. تتراوح الجلسة النقدية بين 400 و900 درهم.`,
  },
  {
    slug: "ivf-fertility",
    name: "IVF / Fertility",
    nameAr: "أطفال الأنابيب / الخصوبة",
    specialties: ["fertility-ivf", "ob-gyn", "urology", "nutrition-dietetics", "mental-health"],
    introEn: `The UAE is one of the GCC's leading IVF destinations, with high success rates, advanced embryology labs and strict regulatory oversight from DHA, DOH and MOHAP. Fertility evaluation typically begins with a GP or gynaecologist referral for basic workup — hormonal panel, ovarian reserve (AMH, antral follicle count), semen analysis for the male partner, and a tubal patency study for the female partner. When assisted reproductive technology is indicated, treatment options include ovulation induction, intrauterine insemination (IUI), and in-vitro fertilisation (IVF) with or without ICSI. Pre-implantation genetic testing (PGT-A, PGT-M) is offered at several UAE clinics and is permitted within the federal framework for medical indications. Insurance coverage for IVF has expanded significantly: Thiqa and several Daman Enhanced plans now cover multiple cycles for eligible UAE nationals, while private plans range from zero coverage to capped cycle reimbursement — check your policy carefully. Expect a single IVF cycle to cost AED 15,000–35,000 at private clinics, with medication typically AED 5,000–12,000 on top.`,
    introAr: `تُعدّ الإمارات من أبرز وجهات أطفال الأنابيب في الخليج، بنسب نجاح عالية ومختبرات أجنّة متقدّمة وإشراف تنظيمي صارم من هيئات دبي وأبوظبي والوزارة الاتحادية. يبدأ تقييم الخصوبة عادة بإحالة من طبيب عام أو نسائية لإجراء فحوصات أساسية: تحاليل هرمونية، مخزون المبيض (AMH)، تحليل السائل المنوي للزوج، وفحص سلامة الأنابيب للزوجة. عند الإشارة إلى التكنولوجيا المساعدة، تشمل الخيارات تحفيز الإباضة والتلقيح داخل الرحم وأطفال الأنابيب مع أو بدون ICSI. التحاليل الوراثية قبل الزرع (PGT-A, PGT-M) متاحة وضمن الإطار القانوني للدواعي الطبية. توسّعت تغطية التأمين بشكل ملحوظ: تغطي ثقة وبعض خطط ضمان المحسّنة دورات متعدّدة للمواطنين المؤهّلين. تتراوح تكلفة الدورة الواحدة في العيادات الخاصة بين 15,000 و35,000 درهم، مع أدوية بين 5,000 و12,000 درهم.`,
    insuranceNotesEn: `Thiqa covers eligible UAE nationals for multiple IVF cycles. Many Daman Enhanced and international Cigna/Bupa plans now include partial IVF coverage — always request pre-authorisation. Medication costs are typically billed separately from the clinical cycle.`,
    insuranceNotesAr: `تغطي خطة ثقة المواطنين المؤهّلين لعدة دورات أطفال أنابيب. تشمل كثير من خطط ضمان المحسّنة وسيجنا وبوبا الدولية تغطية جزئية الآن — اطلب الموافقة المسبقة دائماً. تُحتسب تكلفة الأدوية عادة بشكل منفصل.`,
    anatomy: "reproductive system",
  },
  {
    slug: "heart-disease-cardiology",
    name: "Heart Disease / Cardiology",
    nameAr: "أمراض القلب",
    specialties: ["cardiology", "hospitals", "emergency-care", "radiology-imaging", "nutrition-dietetics"],
    introEn: `Cardiovascular disease is the leading cause of death in the UAE, reflecting high background rates of obesity, diabetes, hypertension and smoking. The UAE cardiology ecosystem is well-developed: public tertiary centres (Sheikh Khalifa Medical City, Rashid Hospital, Tawam) and leading private operators (Cleveland Clinic Abu Dhabi, Mediclinic Parkview, King's College Hospital Dubai, NMC Royal) offer the full continuum from risk-factor screening to interventional cardiology (angioplasty, stenting) and cardiac surgery (CABG, valve repair/replacement, structural heart intervention). Preventive cardiology — managing blood pressure, cholesterol, diabetes, weight and smoking — is increasingly emphasised, and annual cardiac check-ups are covered by most employer plans for adults over 40. For chest pain or suspected acute coronary syndrome, emergency departments across the UAE follow standard STEMI protocols with door-to-balloon targets under 90 minutes at cath-lab-capable hospitals. Call 999 for suspected cardiac emergencies — ambulance services integrate directly with trauma centres.`,
    introAr: `أمراض القلب والأوعية الدموية هي السبب الرئيسي للوفاة في الإمارات، بسبب ارتفاع معدلات السمنة والسكري وارتفاع الضغط والتدخين. منظومة طب القلب في الإمارات متطوّرة: مراكز حكومية متقدمة (مدينة الشيخ خليفة الطبية، مستشفى راشد، توام) ومرافق خاصة رائدة (كليفلاند كلينك أبوظبي، ميديكلينيك باركفيو، كينغز كوليدج دبي، NMC رويال) تقدم الطيف الكامل من الفحص الوقائي إلى القسطرة والدعامات وجراحة القلب المفتوح. في حالات ألم الصدر، تتبع أقسام الطوارئ بروتوكولات STEMI القياسية بوقت "الباب-إلى-البالون" تحت 90 دقيقة. اتصل بـ 999 للحالات الطارئة.`,
    urgentSignsEn: [
      "Crushing chest pain, especially radiating to the left arm or jaw",
      "Shortness of breath with exertion or at rest",
      "Sudden sweating, nausea and lightheadedness",
      "Palpitations with loss of consciousness",
    ],
    urgentSignsAr: [
      "ألم صدر ضاغط، خصوصاً يمتد إلى الذراع الأيسر أو الفك",
      "ضيق تنفس مع الجهد أو في الراحة",
      "تعرق مفاجئ وغثيان ودوخة",
      "خفقان مع فقدان الوعي",
    ],
    insuranceNotesEn: `Cardiac consultations, ECG, echocardiography and stress testing are covered by most DHA/DOH-compliant plans. Coronary angiography and interventional procedures require pre-authorisation. Thiqa offers the broadest coverage for UAE nationals; Daman Enhanced is the most common high-tier private plan.`,
    insuranceNotesAr: `تُغطّى الاستشارات وتخطيط القلب والإيكو واختبارات الجهد في معظم الخطط المعتمدة. تتطلب القسطرة والإجراءات التداخلية موافقة مسبقة. توفر خطة ثقة أوسع تغطية للمواطنين، وخطة ضمان المحسّنة هي الأكثر شيوعاً بين خطط القطاع الخاص المتقدّمة.`,
    anatomy: "heart",
    riskFactors: ["Smoking", "Diabetes", "Hypertension", "High cholesterol", "Obesity", "Sedentary lifestyle"],
    possibleTreatments: ["Lifestyle modification", "Antihypertensives", "Statins", "Angioplasty with stenting", "CABG"],
  },
  {
    slug: "pregnancy-maternity",
    name: "Pregnancy / Maternity",
    nameAr: "الحمل والولادة",
    specialties: ["ob-gyn", "hospitals", "nutrition-dietetics", "pediatrics", "radiology-imaging"],
    introEn: `Maternity care in the UAE is organised around a combination of public hospitals (Latifa in Dubai, Corniche in Abu Dhabi, and SEHA maternity units) and private providers (NMC, Mediclinic, Al Zahra, Burjeel, Zulekha, HealthPlus). Antenatal care typically begins at 8–12 weeks with booking bloods, first-trimester ultrasound, nuchal translucency or NIPT screening, and regular visits every 4 weeks until 28 weeks, then every 2 weeks until 36, then weekly. Dubai and Abu Dhabi mandate health insurance for mothers, and most DHA Essential Benefits plans cover antenatal care, standard vaginal and C-section delivery, and newborn cover for up to 30 days before a dependent add-on is required. Private maternity packages at major Dubai hospitals typically range from AED 12,000 to AED 30,000 for vaginal delivery and AED 18,000 to AED 45,000 for elective C-section. Many hospitals offer parent education classes, lactation consultants and postnatal recovery programmes.`,
    introAr: `تنتظم رعاية الأمومة في الإمارات بين المستشفيات الحكومية (اللطيفة في دبي، الكورنيش في أبوظبي، ووحدات صحة) والقطاع الخاص (NMC، ميديكلينيك، الزهراء، برجيل، زليخة، هيلث بلس). تبدأ الرعاية قبل الولادة عادة بين الأسبوع 8–12 مع تحاليل الحجز وسونار الثلث الأول وفحص NT أو NIPT، وزيارات كل 4 أسابيع حتى الأسبوع 28 ثم كل أسبوعين حتى 36 ثم أسبوعياً. تُلزم دبي وأبوظبي الأمهات بالتأمين الصحي، وتغطي معظم الخطط الأساسية الرعاية قبل الولادة والولادة الطبيعية والقيصرية وتغطية المولود حتى 30 يوماً. تتراوح الحزم الخاصة في دبي بين 12,000 و30,000 درهم للولادة الطبيعية و18,000 إلى 45,000 درهم للقيصرية الاختيارية.`,
    urgentSignsEn: [
      "Vaginal bleeding during pregnancy",
      "Severe headache with visual changes",
      "Reduced fetal movement after 28 weeks",
      "Abdominal pain with contractions before 37 weeks",
      "Leakage of amniotic fluid before term",
    ],
    urgentSignsAr: [
      "نزيف مهبلي أثناء الحمل",
      "صداع شديد مع تغير الرؤية",
      "انخفاض حركة الجنين بعد الأسبوع 28",
      "ألم بطني مع تقلصات قبل الأسبوع 37",
      "تسرب السائل الأمنيوسي قبل الموعد",
    ],
    insuranceNotesEn: `DHA Essential Benefits plans cover antenatal care, delivery and 30 days of newborn cover. Daman Enhanced and Thiqa offer wider cover. Elective procedures (gender selection, VIP delivery packages) are generally not covered.`,
    insuranceNotesAr: `تغطي خطة دبي للمنافع الأساسية الرعاية قبل الولادة والولادة وتغطية المولود 30 يوماً. توفر ضمان المحسّنة وثقة تغطية أوسع. لا تُغطى الإجراءات الاختيارية عادةً.`,
    anatomy: "uterus",
  },
  {
    slug: "lasik-eye-surgery",
    name: "LASIK / Eye Surgery",
    nameAr: "ليزك وجراحة العيون",
    specialties: ["ophthalmology"],
    introEn: `LASIK and other laser vision-correction procedures are widely offered across UAE specialty eye hospitals and ophthalmology clinics. Standard procedures include LASIK, Contoura topography-guided LASIK, SMILE (small incision lenticule extraction) and PRK (photorefractive keratectomy). Ideal candidates are adults over 18 with stable prescriptions for 12+ months and healthy corneas of adequate thickness; a full preoperative workup — including topography, pachymetry, dry-eye assessment and sometimes wavefront analysis — is required before surgery. Leading UAE eye centres include Moorfields Dubai (affiliated with Moorfields London), Gulf Eye Center, Magrabi, Al Razi Ophthalmology, and Barraquer Dubai. Expect per-eye pricing for LASIK in the range of AED 2,500–5,500 at reputable centres, with SMILE typically AED 4,500–7,500 per eye. LASIK is almost always considered elective and is not covered by insurance.`,
    introAr: `تُقدَّم عمليات الليزك وتصحيح النظر بالليزر على نطاق واسع في المستشفيات التخصصية وعيادات العيون بالإمارات. الإجراءات المتاحة تشمل الليزك، Contoura الموجّه بالطبوغرافيا، SMILE، وPRK. المرشحون المثاليون بالغون فوق 18 عاماً بقياسات مستقرة لـ 12 شهراً على الأقل وقرنيات سليمة ذات سماكة كافية. تشمل المراكز الرائدة مورفيلدز دبي، جلف آي سنتر، مغربي، الرازي للعيون، وباراكير دبي. تتراوح أسعار الليزك بين 2,500 و5,500 درهم للعين، وSMILE بين 4,500 و7,500 درهم للعين. تُعدّ عمليات تصحيح النظر اختيارية ولا تغطيها التأمينات عادة.`,
    insuranceNotesEn: `LASIK is considered elective cosmetic surgery and is not covered by most UAE insurance plans. A minority of executive-tier international plans (Bupa Gold, certain Cigna Platinum) include partial reimbursement up to a fixed cap. Always request pre-authorisation.`,
    insuranceNotesAr: `تُعدّ عملية الليزك جراحة تجميلية اختيارية ولا تغطيها معظم خطط التأمين في الإمارات. تتضمن بعض الخطط التنفيذية الدولية (بوبا الذهبية، سيجنا البلاتينية) تعويضاً جزئياً ضمن حد معين. اطلب الموافقة المسبقة دائماً.`,
    anatomy: "eye",
    possibleTreatments: ["LASIK", "SMILE", "PRK", "ICL implant"],
  },
];

const CONDITION_MAP_BY_SLUG: Record<string, ConditionSpecialtyDetail> = (() => {
  const m: Record<string, ConditionSpecialtyDetail> = {};
  for (const c of CONDITION_SPECIALTY_MAP) m[c.slug] = c;
  return m;
})();

export function getConditionDetail(
  slug: string
): ConditionSpecialtyDetail | undefined {
  return CONDITION_MAP_BY_SLUG[slug];
}

export function hasConditionDetail(slug: string): boolean {
  return Boolean(CONDITION_MAP_BY_SLUG[slug]);
}
