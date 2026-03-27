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
