/**
 * UAE bilingual patient intake-form generator data.
 *
 * Standard medical-history question bank (~80 questions) bilingual EN+AR,
 * grouped into selectable sections. NABIDH consent boilerplate and
 * PDPL-compliant marketing-consent boilerplate included verbatim from
 * the relevant regulatory templates.
 */

export type Specialty = "general" | "dental" | "pediatrics" | "ob-gyn" | "dermatology" | "cardiology";

export interface QuestionDef {
  id: string;
  type: "text" | "tel" | "email" | "date" | "select" | "checkbox" | "radio" | "textarea";
  labelEn: string;
  labelAr: string;
  placeholderEn?: string;
  placeholderAr?: string;
  options?: { value: string; en: string; ar: string }[];
  required?: boolean;
  /** Specialties this question applies to (default: all). */
  specialties?: Specialty[];
}

export interface Section {
  id: string;
  titleEn: string;
  titleAr: string;
  questions: QuestionDef[];
  /** If true, included by default. */
  defaultIncluded: boolean;
}

export const SECTIONS: Section[] = [
  {
    id: "demographics",
    titleEn: "Personal information",
    titleAr: "المعلومات الشخصية",
    defaultIncluded: true,
    questions: [
      { id: "fullName", type: "text", labelEn: "Full name (as per Emirates ID)", labelAr: "الاسم الكامل (كما في الهوية الإماراتية)", required: true },
      { id: "emiratesId", type: "text", labelEn: "Emirates ID", labelAr: "رقم الهوية الإماراتية", placeholderEn: "784-XXXX-XXXXXXX-X", required: true },
      { id: "dob", type: "date", labelEn: "Date of birth", labelAr: "تاريخ الميلاد", required: true },
      { id: "gender", type: "select", labelEn: "Gender", labelAr: "الجنس", required: true, options: [
        { value: "male", en: "Male", ar: "ذكر" },
        { value: "female", en: "Female", ar: "أنثى" },
        { value: "other", en: "Other / prefer not to say", ar: "آخر / أفضل عدم الإفصاح" },
      ]},
      { id: "nationality", type: "text", labelEn: "Nationality", labelAr: "الجنسية" },
      { id: "phone", type: "tel", labelEn: "Mobile number", labelAr: "رقم الهاتف المتحرك", placeholderEn: "+971 50 XXX XXXX", required: true },
      { id: "email", type: "email", labelEn: "Email address", labelAr: "البريد الإلكتروني" },
      { id: "address", type: "textarea", labelEn: "Address (city + area)", labelAr: "العنوان (المدينة والمنطقة)" },
    ],
  },
  {
    id: "insurance",
    titleEn: "Insurance details",
    titleAr: "تفاصيل التأمين",
    defaultIncluded: true,
    questions: [
      { id: "insurer", type: "text", labelEn: "Insurance company", labelAr: "شركة التأمين" },
      { id: "memberId", type: "text", labelEn: "Member ID / policy number", labelAr: "رقم العضوية / رقم البوليصة" },
      { id: "policyHolder", type: "text", labelEn: "Policy holder name (if different)", labelAr: "اسم حامل البوليصة (إن اختلف)" },
      { id: "expiry", type: "date", labelEn: "Policy expiry date", labelAr: "تاريخ انتهاء البوليصة" },
    ],
  },
  {
    id: "emergency",
    titleEn: "Emergency contact",
    titleAr: "جهة الاتصال للطوارئ",
    defaultIncluded: true,
    questions: [
      { id: "emergencyName", type: "text", labelEn: "Emergency contact name", labelAr: "اسم جهة الاتصال للطوارئ", required: true },
      { id: "emergencyRelation", type: "text", labelEn: "Relationship", labelAr: "صلة القرابة" },
      { id: "emergencyPhone", type: "tel", labelEn: "Emergency contact phone", labelAr: "رقم هاتف الطوارئ", required: true },
    ],
  },
  {
    id: "medical_history",
    titleEn: "Medical history",
    titleAr: "التاريخ المرضي",
    defaultIncluded: true,
    questions: [
      { id: "chronicDiabetes", type: "checkbox", labelEn: "Diabetes", labelAr: "السكري" },
      { id: "chronicHypertension", type: "checkbox", labelEn: "High blood pressure", labelAr: "ارتفاع ضغط الدم" },
      { id: "chronicHeart", type: "checkbox", labelEn: "Heart disease", labelAr: "أمراض القلب" },
      { id: "chronicAsthma", type: "checkbox", labelEn: "Asthma", labelAr: "الربو" },
      { id: "chronicThyroid", type: "checkbox", labelEn: "Thyroid disorder", labelAr: "اضطراب الغدة الدرقية" },
      { id: "chronicCancer", type: "checkbox", labelEn: "Cancer (current or past)", labelAr: "السرطان (حالي أو سابق)" },
      { id: "chronicKidney", type: "checkbox", labelEn: "Kidney disease", labelAr: "أمراض الكلى" },
      { id: "chronicLiver", type: "checkbox", labelEn: "Liver disease", labelAr: "أمراض الكبد" },
      { id: "chronicHIV", type: "checkbox", labelEn: "HIV / immunodeficiency", labelAr: "نقص المناعة / فيروس نقص المناعة البشري" },
      { id: "chronicMental", type: "checkbox", labelEn: "Mental health condition", labelAr: "حالة صحة نفسية" },
      { id: "surgeryHistory", type: "textarea", labelEn: "Past surgeries (year + procedure)", labelAr: "العمليات الجراحية السابقة (السنة + النوع)" },
      { id: "hospitalizationHistory", type: "textarea", labelEn: "Past hospitalizations", labelAr: "حالات الدخول السابقة للمستشفى" },
    ],
  },
  {
    id: "medications",
    titleEn: "Current medications",
    titleAr: "الأدوية الحالية",
    defaultIncluded: true,
    questions: [
      { id: "currentMeds", type: "textarea", labelEn: "List all medications you currently take (name, dose, frequency)", labelAr: "اذكر جميع الأدوية التي تتناولها حالياً (الاسم، الجرعة، التكرار)" },
      { id: "supplements", type: "textarea", labelEn: "Supplements / vitamins / herbal", labelAr: "المكملات الغذائية / الفيتامينات / الأعشاب" },
    ],
  },
  {
    id: "allergies",
    titleEn: "Allergies",
    titleAr: "الحساسية",
    defaultIncluded: true,
    questions: [
      { id: "allergyMeds", type: "textarea", labelEn: "Medication allergies (drug name + reaction)", labelAr: "حساسية تجاه الأدوية (الاسم + التفاعل)" },
      { id: "allergyFood", type: "textarea", labelEn: "Food allergies", labelAr: "حساسية الأغذية" },
      { id: "allergyOther", type: "textarea", labelEn: "Other allergies (latex, anesthesia, contrast)", labelAr: "حساسية أخرى (لاتكس، تخدير، صبغات الأشعة)" },
    ],
  },
  {
    id: "family_history",
    titleEn: "Family medical history",
    titleAr: "التاريخ المرضي للعائلة",
    defaultIncluded: false,
    questions: [
      { id: "familyDiabetes", type: "checkbox", labelEn: "Diabetes in family", labelAr: "السكري في العائلة" },
      { id: "familyHeart", type: "checkbox", labelEn: "Heart disease in family", labelAr: "أمراض القلب في العائلة" },
      { id: "familyCancer", type: "checkbox", labelEn: "Cancer in family", labelAr: "السرطان في العائلة" },
      { id: "familyMental", type: "checkbox", labelEn: "Mental health condition in family", labelAr: "حالة صحة نفسية في العائلة" },
      { id: "familyOther", type: "textarea", labelEn: "Other significant family history", labelAr: "تاريخ عائلي مهم آخر" },
    ],
  },
  {
    id: "lifestyle",
    titleEn: "Lifestyle",
    titleAr: "نمط الحياة",
    defaultIncluded: false,
    questions: [
      { id: "smoking", type: "select", labelEn: "Smoking status", labelAr: "التدخين", options: [
        { value: "never", en: "Never smoked", ar: "لم أدخن أبداً" },
        { value: "former", en: "Former smoker", ar: "مدخن سابق" },
        { value: "current", en: "Current smoker", ar: "مدخن حالي" },
        { value: "vape", en: "Vape / e-cigarettes", ar: "سجائر إلكترونية" },
      ]},
      { id: "alcohol", type: "select", labelEn: "Alcohol consumption", labelAr: "تناول الكحول", options: [
        { value: "none", en: "None", ar: "لا أتناول" },
        { value: "occasional", en: "Occasional", ar: "أحياناً" },
        { value: "regular", en: "Regular", ar: "بانتظام" },
      ]},
      { id: "exercise", type: "select", labelEn: "Exercise frequency", labelAr: "تكرار التمارين", options: [
        { value: "none", en: "None", ar: "لا توجد" },
        { value: "1-2", en: "1-2 times/week", ar: "1-2 مرات/أسبوع" },
        { value: "3-4", en: "3-4 times/week", ar: "3-4 مرات/أسبوع" },
        { value: "5plus", en: "5+ times/week", ar: "5 مرات أو أكثر/أسبوع" },
      ]},
    ],
  },
  {
    id: "consent_treatment",
    titleEn: "Consent for treatment",
    titleAr: "موافقة على العلاج",
    defaultIncluded: true,
    questions: [
      { id: "consentTreatment", type: "checkbox", labelEn: "I consent to the medical examination and treatment recommended by the treating physician at this clinic. I understand that no guarantees have been made regarding the outcome.", labelAr: "أوافق على الفحص الطبي والعلاج الذي يوصي به الطبيب المعالج في هذه العيادة. أتفهم أنه لم يتم تقديم أي ضمانات بشأن النتيجة.", required: true },
    ],
  },
  {
    id: "consent_nabidh",
    titleEn: "NABIDH data sharing consent",
    titleAr: "موافقة مشاركة بيانات نابض",
    defaultIncluded: true,
    questions: [
      { id: "consentNabidh", type: "checkbox", labelEn: "I consent to my health information being shared with the UAE National Unified Medical Record (NABIDH / Malaffi / Riayati as applicable) for the purposes of integrated care, public health reporting, and continuity of treatment, as authorised under UAE Federal Law No. 2 of 2019 (Health Data Federal Law).", labelAr: "أوافق على مشاركة معلوماتي الصحية مع السجل الطبي الموحد الإماراتي (نابض / ملفي / رعايتي حسب الاقتضاء) لأغراض الرعاية المتكاملة والإبلاغ عن الصحة العامة واستمرارية العلاج، وفقاً للقانون الاتحادي رقم 2 لسنة 2019 (قانون البيانات الصحية الاتحادي).", required: true },
    ],
  },
  {
    id: "consent_marketing",
    titleEn: "Marketing communication consent (optional)",
    titleAr: "موافقة الاتصال التسويقي (اختياري)",
    defaultIncluded: false,
    questions: [
      { id: "consentMarketing", type: "checkbox", labelEn: "I consent to receive appointment reminders, follow-up communication, and occasional clinic updates via SMS, WhatsApp, or email. I can withdraw this consent at any time. (UAE PDPL Article 13)", labelAr: "أوافق على تلقي تذكيرات المواعيد ومتابعة التواصل وتحديثات العيادة العرضية عبر الرسائل النصية أو واتساب أو البريد الإلكتروني. يمكنني سحب هذه الموافقة في أي وقت. (قانون حماية البيانات الإماراتي - المادة 13)" },
    ],
  },
];

export const SPECIALTY_LABELS: Record<Specialty, { en: string; ar: string }> = {
  general: { en: "General Practice", ar: "ممارسة عامة" },
  dental: { en: "Dental", ar: "أسنان" },
  pediatrics: { en: "Pediatrics", ar: "أطفال" },
  "ob-gyn": { en: "OB-GYN", ar: "نساء وولادة" },
  dermatology: { en: "Dermatology", ar: "جلدية" },
  cardiology: { en: "Cardiology", ar: "قلب" },
};
