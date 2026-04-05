export const ar = {
  // Site
  siteName: "دليل الرعاية الصحية المفتوح في الإمارات",
  siteTagline: "بواسطة Zavis",
  siteDescription: "الدليل الأشمل والمجاني لمقدمي الرعاية الصحية المرخصين في الإمارات العربية المتحدة",

  // Nav
  search: "بحث",
  about: "عن الدليل",
  claimListing: "المطالبة بالقائمة",
  allEmirates: "جميع الإمارات",
  home: "الرئيسية",
  insights: "رؤى وتحليلات",
  research: "أبحاث",

  // Directory
  healthcareProviders: "مقدمو الرعاية الصحية",
  providers: "مقدم خدمة",
  specialties: "التخصصات الطبية",
  neighborhoods: "الأحياء",
  topRated: "الأعلى تقييماً",
  browseByCity: "تصفح حسب المدينة",
  verifiedProviders: "مقدمو خدمات معتمدون",
  lastUpdated: "آخر تحديث مارس ٢٠٢٦",
  dataSource: "البيانات مصدرها السجلات الحكومية الرسمية",
  findHealthcare: "ابحث عن مقدمي الرعاية الصحية في الإمارات",
  sourceOfTruth: "المصدر الموثوق للرعاية الصحية في الإمارات",
  freeOpenNoPaywall: "مجاني · مفتوح · بدون اشتراك",
  faq: "الأسئلة الشائعة",
  filterProviders: "تصفية مقدمي الخدمات",
  byCondition: "حسب الحالة الطبية",
  procedureCosts: "تكاليف الإجراءات",

  // Best pages
  best: "الأفضل",
  bestProviders: "أفضل مقدمي الرعاية الصحية",
  bestInCity: "الأفضل في",
  basedOnRatings: "بناءً على تقييمات Google من مراجعات المرضى الفعلية",
  topPicksIn: "أفضل الخيارات في",
  viewAllIn: "عرض الكل في",
  ratingStars: "نجوم من أصل ٥",
  selectCity: "اختر المدينة",
  selectCategory: "اختر التخصص",

  // Insurance filter pages
  insurance: "التأمين الصحي",
  byInsurance: "حسب التأمين",
  insuranceCoverage: "تغطية التأمين",
  findByInsurance: "ابحث حسب التأمين",
  providersAccepting: "مقدمو خدمات يقبلون",
  browseByInsurance: "تصفح حسب شركة التأمين",
  insurancePlans: "خطط التأمين",
  acceptedInsurancePlans: "خطط التأمين المقبولة",

  // Language filter pages
  byLanguage: "حسب اللغة",
  findByLanguage: "ابحث حسب اللغة",
  browseByLanguage: "تصفح حسب اللغة",
  languageFilter: "تصفية حسب اللغة",
  providersSpeak: "مقدمو خدمات يتحدثون",

  // Listing
  services: "الخدمات",
  operatingHours: "ساعات العمل",
  acceptedInsurance: "التأمين المقبول",
  languagesSpoken: "اللغات",
  location: "الموقع",
  contact: "التواصل",
  callNow: "اتصل الآن",
  directions: "الاتجاهات",
  website: "الموقع الإلكتروني",
  nearby: "بالقرب",
  stars: "نجوم",
  reviews: "تقييمات",
  hours24: "٢٤ ساعة",

  // Days
  days: {
    mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس",
    fri: "الجمعة", sat: "السبت", sun: "الأحد",
  } as Record<string, string>,

  // Regulators
  regulators: {
    dubai: "هيئة الصحة بدبي (DHA)",
    "abu-dhabi": "دائرة الصحة - أبوظبي (DOH)",
    "al-ain": "دائرة الصحة - أبوظبي (DOH)",
    default: "وزارة الصحة ووقاية المجتمع (MOHAP)",
  } as Record<string, string>,

  // Cities
  cities: {
    dubai: "دبي", "abu-dhabi": "أبوظبي", sharjah: "الشارقة",
    ajman: "عجمان", "ras-al-khaimah": "رأس الخيمة", fujairah: "الفجيرة",
    "umm-al-quwain": "أم القيوين", "al-ain": "العين",
  } as Record<string, string>,

  // Categories
  categories: {
    hospitals: "المستشفيات", clinics: "العيادات", dental: "طب الأسنان",
    dermatology: "الأمراض الجلدية", ophthalmology: "طب العيون",
    cardiology: "أمراض القلب", orthopedics: "جراحة العظام",
    pediatrics: "طب الأطفال", "mental-health": "الصحة النفسية",
    pharmacy: "الصيدليات", physiotherapy: "العلاج الطبيعي",
    "fertility-ivf": "الخصوبة وأطفال الأنابيب",
    "alternative-medicine": "الطب البديل", "general-practice": "الطب العام",
    "internal-medicine": "الطب الباطني", neurology: "طب الأعصاب",
    urology: "المسالك البولية", "obstetrics-gynecology": "النساء والتوليد",
    ent: "الأنف والأذن والحنجرة", gastroenterology: "الجهاز الهضمي",
    pulmonology: "أمراض الرئة", oncology: "الأورام",
    endocrinology: "الغدد الصماء", rheumatology: "الروماتيزم",
    "plastic-surgery": "الجراحة التجميلية", radiology: "الأشعة",
    "ob-gyn": "النساء والتوليد",
    "nutrition-dietetics": "التغذية والحمية",
    "labs-diagnostics": "المختبرات والتشخيص",
    "radiology-imaging": "الأشعة والتصوير",
    "home-healthcare": "الرعاية الصحية المنزلية",
    "cosmetic-plastic": "الجراحة التجميلية والترميمية",
    "emergency-care": "الطوارئ والرعاية العاجلة",
    "wellness-spas": "مراكز العافية والسبا الطبي",
    "nephrology": "أمراض الكلى",
    "medical-equipment": "المعدات والمستلزمات الطبية",
  } as Record<string, string>,

  // Extra labels used in existing pages
  browseBySpecialty: "تصفح حسب التخصص",
  medicalSpecialties: "التخصصات الطبية",
  browseByArea: "تصفح حسب المنطقة",
  freeAndOpen: "مجاني ومفتوح بدون اشتراك",
  isThisYourBusiness: "هل هذا عملك؟",
  claimYourListing: "طالب بقائمتك لتحديث المعلومات",
  aboutProvider: "نبذة عن",
  viewAll: "عرض الكل",
  noProvidersFound: "لم يتم العثور على مقدمي خدمات",
  verified: "معتمد",
  provider: "مقدم خدمة",
  providerPlural: "مقدمي خدمات",
  patientReviews: "آراء المرضى",

  // Professionals Directory
  professionals: {
    title: "دليل الكوادر الصحية في دبي",
    subtitle: "كوادر صحية مرخّصة من هيئة صحة دبي",
    description: "أكبر دليل بحث عام للكوادر الصحية المرخّصة من هيئة صحة دبي، مصدره السجل الطبي الرسمي شريان.",
    browseByCategory: "تصفح حسب الفئة",
    topSpecialties: "أبرز التخصصات",
    topFacilities: "أكبر المنشآت الصحية",
    licensedProfessionals: "كوادر صحية مرخّصة",
    healthcareFacilities: "منشآت صحية",
    specialtiesTracked: "تخصصات متابَعة",
    professionalCategories: "فئات مهنية",
    howManyProfessionals: "كم عدد الكوادر الصحية في دبي؟",
    source: "المصدر",
    disclaimer: "هيئة الصحة بدبي (DHA) — السجل الطبي المهني شريان. هذا الدليل لأغراض معلوماتية فقط. تحقق من أوراق الاعتماد المهنية مباشرة من هيئة الصحة بدبي قبل اتخاذ قرارات صحية.",
    allProfessionals: "جميع الكوادر المهنية",
    name: "الاسم",
    licenseType: "نوع الترخيص",
    facility: "المنشأة",
    specialty: "التخصص",
    showing: "عرض",
    of: "من",
    sortedAlphabetically: "مرتبة أبجدياً",
    fullTimeLicense: "ترخيص دائم (FTL)",
    registered: "مسجّل (REG)",
    specialists: "أخصائيون",
    consultants: "استشاريون",
    staff: "الموظفون",
    findClinics: "ابحث عن عيادات ومستشفيات",
    inDubai: "في دبي",
    exploreMore: "استكشف المزيد",
    workforceStats: "إحصائيات القوى العاملة",
    editorialGuides: "أدلة إرشادية",
    findDoctor: "ابحث عن طبيب",
    bestDoctors: "أفضل الأطباء في دبي",
    aToZDirectory: "الدليل الأبجدي",
  } as Record<string, string>,

  // Workforce Intelligence
  workforce: {
    title: "معلومات القوى العاملة الصحية في دبي",
    subtitle: "تحليلات سوق العمل الصحي في دبي",
    description: "بيانات وتحليلات شاملة عن القوى العاملة الصحية في دبي — النسب، المعايير، التوزيع الجغرافي، ومقارنات التخصصات.",
    overview: "نظرة عامة",
    employers: "أصحاب العمل",
    specialtiesHub: "التخصصات",
    areas: "المناطق الجغرافية",
    benchmarks: "المعايير المرجعية",
    careers: "المسارات المهنية",
    rankings: "التصنيفات",
    compare: "المقارنات",
    supplyAnalysis: "تحليل العرض",
    topEmployers: "أكبر أصحاب العمل",
    largestSpecialties: "أكبر التخصصات",
    nurseToDoctorRatio: "نسبة الممرضين إلى الأطباء",
    staffPerFacility: "الموظفون لكل منشأة",
    specialistPerCapita: "الأخصائيون لكل فرد",
    ftlRate: "معدل الترخيص الدائم",
    concentrationIndex: "مؤشر التركز",
    perCapita: "لكل 100,000 نسمة",
    totalProfessionals: "إجمالي الكوادر المهنية",
    facilities: "المنشآت",
    category: "الفئة",
  } as Record<string, string>,

  // Best Doctors
  bestDoctors: {
    title: "أفضل الأطباء في دبي",
    subtitle: "مصنّفون حسب الخبرة والتخصص ونوع الترخيص",
    description: "أفضل الأطباء والمتخصصين المرخّصين من هيئة صحة دبي — مصنّفون حسب نسبة الاستشاريين ومعدل الترخيص الدائم.",
    topSpecialists: "أبرز الأخصائيين",
    findBestDoctor: "ابحث عن أفضل طبيب",
    relatedSpecialties: "تخصصات ذات صلة",
    topFacilitiesFor: "أبرز المنشآت لتخصص",
    rankingMethodology: "منهجية التصنيف",
  } as Record<string, string>,

  // Find a Doctor
  findDoctor: {
    title: "ابحث عن طبيب في دبي",
    subtitle: "ابحث بين أكثر من 99,000 كادر صحي مرخّص",
    description: "ابحث في أكبر دليل للكوادر الصحية المرخّصة من هيئة صحة دبي. الأطباء وأطباء الأسنان والممرضون والمهنيون الصحيون المساندون.",
    browseByCategory: "تصفح حسب الفئة",
    browseBySpecialty: "تصفح حسب التخصص",
    browseByFacility: "تصفح حسب المنشأة",
  } as Record<string, string>,

  // Dubai Areas
  dubaiAreas: {
    "deira": "ديرة",
    "bur-dubai": "بر دبي",
    "jumeirah": "جميرا",
    "al-barsha": "البرشاء",
    "dubai-marina": "دبي مارينا",
    "business-bay": "الخليج التجاري",
    "downtown-dubai": "وسط مدينة دبي",
    "al-quoz": "القوز",
    "jebel-ali": "جبل علي",
    "al-nahda": "النهدة",
    "karama": "الكرامة",
    "al-garhoud": "القرهود",
    "oud-metha": "عود ميثاء",
    "al-mamzar": "الممزر",
    "international-city": "المدينة العالمية",
    "dubai-healthcare-city": "مدينة دبي الطبية",
    "silicon-oasis": "واحة دبي للسيليكون",
    "al-rashidiya": "الراشدية",
    "motor-city": "موتور سيتي",
    "al-mizhar": "المزهر",
    "muhaisnah": "محيصنة",
    "al-warqa": "الورقاء",
    "al-satwa": "السطوة",
    "al-safa": "الصفا",
    "umm-suqeim": "أم سقيم",
    "al-wasl": "الوصل",
    "trade-centre": "المركز التجاري",
    "al-khawaneej": "الخوانيج",
    "nad-al-sheba": "ند الشبا",
    "mirdif": "مردف",
    "dubai-investment-park": "مجمع دبي للاستثمار",
    "al-qusais": "القصيص",
    "hor-al-anz": "هور العنز",
    "port-saeed": "بور سعيد",
    "discovery-gardens": "ديسكفري غاردنز",
    "palm-jumeirah": "نخلة جميرا",
  } as Record<string, string>,
};

export function getArabicCityName(slug: string): string {
  return ar.cities[slug] || slug;
}

export function getArabicCategoryName(slug: string): string {
  return ar.categories[slug] || slug;
}

export function getArabicRegulator(citySlug: string): string {
  return ar.regulators[citySlug] || ar.regulators.default;
}

export function getArabicAreaName(slug: string): string {
  return ar.dubaiAreas[slug] || slug;
}

const ARABIC_INSURANCE_NAMES: Record<string, string> = {
  "daman": "ضمان", "thiqa": "ثقة", "saada": "سعادة", "nas": "ناس",
  "axa": "أكسا", "cigna": "سيجنا", "bupa": "بوبا", "metlife": "ميتلايف",
  "allianz": "أليانز", "oman-insurance": "عمان للتأمين",
  "adnic": "أدنيك", "sukoon": "سكون", "almadallah": "المدلّة",
  "neuron": "نيورون", "nextcare": "نكست كير", "mednet": "ميدنت",
};

const ARABIC_LANGUAGE_NAMES: Record<string, string> = {
  "arabic": "العربية", "english": "الإنجليزية", "hindi": "الهندية",
  "urdu": "الأردية", "tagalog": "التاغالوغية", "malayalam": "المالايالامية",
  "tamil": "التاميلية", "farsi": "الفارسية", "french": "الفرنسية",
  "german": "الألمانية", "russian": "الروسية", "chinese": "الصينية",
};

export function getArabicInsuranceName(slug: string): string {
  return ARABIC_INSURANCE_NAMES[slug.toLowerCase()] || slug;
}

export function getArabicLanguageName(slug: string): string {
  return ARABIC_LANGUAGE_NAMES[slug.toLowerCase()] || slug;
}

export function getArabicEquivalentPath(enPath: string): string {
  return `/ar${enPath}`;
}

export function getEnglishEquivalentPath(arPath: string): string {
  return arPath.replace(/^\/ar/, "") || "/";
}
