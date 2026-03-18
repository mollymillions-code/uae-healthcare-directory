export const ar = {
  // General
  siteName: "دليل الرعاية الصحية في الإمارات",
  siteDescription: "الدليل الأشمل والمجاني لمقدمي الرعاية الصحية المرخصين في جميع أنحاء الإمارات العربية المتحدة",

  // Navigation
  search: "بحث",
  about: "عن الدليل",
  claimListing: "المطالبة بالقائمة",
  allEmirates: "جميع الإمارات",

  // Directory
  healthcareProviders: "مقدمو الرعاية الصحية",
  providers: "مقدم خدمة",
  specialties: "التخصصات",
  neighborhoods: "الأحياء",
  topRated: "الأعلى تقييماً",
  browseByCity: "تصفح حسب المدينة",
  browseBySpecialty: "تصفح حسب التخصص",
  verifiedProviders: "مقدمو خدمات معتمدون",
  lastUpdated: "آخر تحديث مارس 2026",
  dataSource: "البيانات مصدرها السجلات الحكومية الرسمية",
  findHealthcare: "ابحث عن الرعاية الصحية في جميع أنحاء الإمارات",
  sourceOfTruth: "المصدر الموثوق للرعاية الصحية في الإمارات",
  freeAndOpen: "مجاني ومفتوح بدون اشتراك",
  medicalSpecialties: "التخصصات الطبية",
  browseByArea: "تصفح حسب المنطقة",

  // Listing details
  services: "الخدمات",
  operatingHours: "ساعات العمل",
  acceptedInsurance: "التأمين المقبول",
  languagesSpoken: "اللغات",
  location: "الموقع",
  contact: "اتصل بنا",
  callNow: "اتصل الآن",
  directions: "الاتجاهات",
  isThisYourBusiness: "هل هذا عملك؟",
  claimYourListing: "طالب بقائمتك لتحديث المعلومات",
  nearby: "بالقرب",
  aboutProvider: "نبذة عن",
  viewAll: "عرض الكل",
  noProvidersFound: "لم يتم العثور على مقدمي خدمات",
  verified: "معتمد",

  // Ratings
  stars: "نجوم",
  reviews: "تقييمات",

  // Counts
  provider: "مقدم خدمة",
  providerPlural: "مقدمي خدمات",

  // Regulators
  regulators: {
    dubai: "هيئة الصحة بدبي",
    "abu-dhabi": "دائرة الصحة - أبوظبي",
    "al-ain": "دائرة الصحة - أبوظبي",
    default: "وزارة الصحة ووقاية المجتمع",
  } as Record<string, string>,

  // Days
  days: {
    mon: "الإثنين",
    tue: "الثلاثاء",
    wed: "الأربعاء",
    thu: "الخميس",
    fri: "الجمعة",
    sat: "السبت",
    sun: "الأحد",
  } as Record<string, string>,

  // Categories (map slug -> Arabic name)
  categories: {
    hospitals: "المستشفيات",
    clinics: "العيادات",
    dental: "طب الأسنان",
    dermatology: "الأمراض الجلدية",
    ophthalmology: "طب العيون",
    cardiology: "أمراض القلب",
    orthopedics: "جراحة العظام",
    pediatrics: "طب الأطفال",
    "mental-health": "الصحة النفسية",
    pharmacy: "الصيدليات",
    physiotherapy: "العلاج الطبيعي",
    "fertility-ivf": "الخصوبة وأطفال الأنابيب",
    "alternative-medicine": "الطب البديل",
    "general-practice": "الطب العام",
    "internal-medicine": "الطب الباطني",
    neurology: "طب الأعصاب",
    urology: "المسالك البولية",
    "obstetrics-gynecology": "النساء والتوليد",
    ent: "الأنف والأذن والحنجرة",
    gastroenterology: "الجهاز الهضمي",
    pulmonology: "أمراض الرئة",
    oncology: "الأورام",
    endocrinology: "الغدد الصماء",
    rheumatology: "الروماتيزم",
    "plastic-surgery": "الجراحة التجميلية",
    radiology: "الأشعة",
  } as Record<string, string>,

  // FAQ
  faq: "الأسئلة الشائعة",
};

export function getArabicCategoryName(slug: string): string {
  return ar.categories[slug] || slug;
}

export function getArabicRegulator(citySlug: string): string {
  return ar.regulators[citySlug] || ar.regulators.default;
}
