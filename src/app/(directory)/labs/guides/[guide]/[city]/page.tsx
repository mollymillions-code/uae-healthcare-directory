import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowRight, Home, Clock, FileText, AlertTriangle, FlaskConical, Shield, Building2 } from "lucide-react";
import {
  getLabsByCity,
  getLabTest,
  getPriceRangeInCity,
  formatPrice,
  getPricesForLab,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Guide + City Data ──────────────────────────────────────────────────────

const GUIDE_DATA: Record<
  string,
  {
    slug: string;
    name: string;
    relatedTests: string[];
    costRange: string;
    processingTime: string;
  }
> = {
  "visa-medical": {
    slug: "visa-medical",
    name: "Visa Medical Test",
    relatedTests: ["hiv-test", "hepatitis-b", "vdrl", "cbc"],
    costRange: "AED 250–350",
    processingTime: "3–5 business days",
  },
  "pre-marital-screening": {
    slug: "pre-marital-screening",
    name: "Pre-Marital Screening",
    relatedTests: ["cbc", "hiv-test", "hepatitis-b", "vdrl", "fsh", "estradiol"],
    costRange: "AED 200–500",
    processingTime: "3–5 business days",
  },
  "pregnancy-tests": {
    slug: "pregnancy-tests",
    name: "Pregnancy & Prenatal Blood Tests",
    relatedTests: ["cbc", "tsh", "vitamin-d", "folate", "amh", "fsh", "estradiol", "hiv-test", "hepatitis-b", "vdrl"],
    costRange: "AED 400–700 (first trimester panel)",
    processingTime: "Same day – 3 days",
  },
  "walk-in-labs": {
    slug: "walk-in-labs",
    name: "Walk-In Blood Test Labs",
    relatedTests: ["cbc", "vitamin-d", "lipid-profile", "thyroid-panel", "hba1c"],
    costRange: "AED 69–500 (varies by test)",
    processingTime: "Same day – 24 hours",
  },
  "weekend-labs": {
    slug: "weekend-labs",
    name: "Labs Open on Weekends",
    relatedTests: ["cbc", "vitamin-d", "lipid-profile", "thyroid-panel", "hba1c"],
    costRange: "AED 69–500 (varies by test)",
    processingTime: "Same day – 24 hours",
  },
  "same-day-results": {
    slug: "same-day-results",
    name: "Same-Day Results Labs",
    relatedTests: ["cbc", "vitamin-d", "lipid-profile", "lft", "kft", "hba1c"],
    costRange: "AED 69–500 (varies by test)",
    processingTime: "4–12 hours",
  },
  "mens-health-40-plus": {
    slug: "mens-health-40-plus",
    name: "Men's Health Screening (40+)",
    relatedTests: ["cbc", "lipid-profile", "hba1c", "lft", "kft", "tsh", "vitamin-d", "testosterone", "psa", "crp"],
    costRange: "AED 230–999 (packages)",
    processingTime: "Same day – 48 hours",
  },
  "womens-health-30-plus": {
    slug: "womens-health-30-plus",
    name: "Women's Health Screening (30+)",
    relatedTests: ["cbc", "iron-studies", "thyroid-panel", "vitamin-d", "vitamin-b12", "folate", "calcium", "amh", "fsh", "estradiol", "testosterone", "ca-125"],
    costRange: "AED 350–999 (packages)",
    processingTime: "Same day – 48 hours",
  },
  "senior-health-screening": {
    slug: "senior-health-screening",
    name: "Senior Health Screening (60+)",
    relatedTests: ["cbc", "kft", "lft", "lipid-profile", "hba1c", "tsh", "vitamin-d", "vitamin-b12", "crp", "bnp", "psa", "ca-125", "cea"],
    costRange: "AED 499–999 (executive packages)",
    processingTime: "Same day – 48 hours",
  },
  "corporate-health-check": {
    slug: "corporate-health-check",
    name: "Corporate Health Check",
    relatedTests: ["cbc", "lipid-profile", "hba1c", "lft", "kft", "tsh", "vitamin-d"],
    costRange: "AED 150–499 per employee",
    processingTime: "Same day – 72 hours",
  },
};

// ─── City-Specific Regulatory Info ──────────────────────────────────────────

function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

// ─── City-Specific Context ──────────────────────────────────────────────────

type CityContextMap = Record<string, Record<string, {
  intro: string;
  areas: string;
  tips: string;
}>>;

const CITY_CONTEXT: CityContextMap = {
  "visa-medical": {
    dubai: {
      intro: "In Dubai, visa medical tests are managed through DHA-approved medical fitness centres. Major centres include those in Al Muhaisnah, Al Twar, and Port Rashid. AMER centres and some ICA-approved typing centres with medical wings also process visa medicals. Dubai processes the highest volume of visa medicals in the UAE due to its large expat workforce.",
      areas: "Al Muhaisnah, Al Twar, Port Rashid, Deira, Bur Dubai",
      tips: "Arrive before 8 AM to avoid queues. AMER centres near Dubai Frame and Al Twar tend to be less crowded than the main Muhaisnah centre.",
    },
    "abu-dhabi": {
      intro: "In Abu Dhabi, the DOH oversees visa medical fitness through SEHA-approved health screening centres. Primary locations are in Mussafah, Tourist Club Area, and Al Ain. Abu Dhabi's system is fully digital with results uploaded to the DOH portal automatically.",
      areas: "Mussafah, Tourist Club Area, Khalifa City, Al Shamkha",
      tips: "SEHA centres accept online bookings through the SEHA app. The Mussafah branch handles the highest volume; Tourist Club Area is typically faster.",
    },
    sharjah: {
      intro: "In Sharjah, visa medical fitness testing is handled by MOHAP-accredited private polyclinics and government health centres. The main MOHAP health centre in Al Qasimia processes most visa medicals, with several private polyclinics in Al Nahda and Al Majaz also approved.",
      areas: "Al Qasimia, Al Nahda, Al Majaz, Al Taawun",
      tips: "Sharjah centres tend to be less crowded than Dubai. Many Sharjah residents get their visa medicals done in Sharjah to avoid Dubai's longer queues.",
    },
    ajman: {
      intro: "In Ajman, MOHAP-licensed health centres and approved polyclinics in Al Nuaimia and the Ajman downtown area handle visa medical fitness testing. Ajman processes visa medicals for both Ajman-based and some Sharjah-based visa applicants.",
      areas: "Al Nuaimia, Ajman Downtown, Al Rashidiya",
      tips: "Ajman centres are typically less busy and offer shorter wait times. Most centres open at 7 AM and accept walk-ins.",
    },
    "ras-al-khaimah": {
      intro: "In Ras Al Khaimah, MOHAP-approved medical fitness centres near Al Nakheel and the city centre area handle visa medicals. The Saqr Hospital medical fitness wing is the primary government facility for visa testing in the emirate.",
      areas: "Al Nakheel, RAK City Centre, Khuzam",
      tips: "RAK centres have the shortest queues in the UAE. Most applicants are processed within 30 minutes of arrival.",
    },
    fujairah: {
      intro: "In Fujairah, the MOHAP-approved fitness centre near Fujairah City Centre handles the majority of visa medicals. Being on the east coast, Fujairah processes a smaller volume, resulting in shorter wait times.",
      areas: "Fujairah City Centre",
      tips: "Fujairah has limited centres; arrive early on weekday mornings. Some applicants travel from Fujairah to Sharjah or Dubai for faster processing.",
    },
    "umm-al-quwain": {
      intro: "In Umm Al Quwain, the MOHAP-licensed health centre in the city centre is the primary facility for visa medical testing. As the smallest emirate, processing volumes are low and waits are minimal.",
      areas: "UAQ City Centre",
      tips: "UAQ has the lowest wait times in the UAE for visa medicals. The single centre typically processes applicants within 20 minutes.",
    },
    "al-ain": {
      intro: "In Al Ain, the DOH-approved SEHA health screening centre handles visa medicals for Al Ain residents. Located in the Al Jimi area, it operates under the same Abu Dhabi DOH framework. Tawam Hospital's referral wing handles complex cases.",
      areas: "Al Jimi, Tawam, Al Ain Central",
      tips: "Al Ain's centre is significantly less crowded than Abu Dhabi city. The SEHA app works for Al Ain bookings under the Abu Dhabi DOH system.",
    },
  },
  "pre-marital-screening": {
    dubai: {
      intro: "In Dubai, pre-marital screening is managed by DHA health centres including Al Manara, Al Mizhar, and Rashidiya Centre. Licensed private labs such as Al Borg Diagnostics and Thumbay Labs in Dubai can conduct the blood tests, with results uploaded to the DHA system. The genetic counselling session is typically at a DHA health centre.",
      areas: "Al Manara, Al Mizhar, Rashidiya, Healthcare City, Deira",
      tips: "Book at the DHA health centre nearest your home for the genetic counselling session. Private labs can draw the blood faster but you may still need to visit a DHA centre for the certificate.",
    },
    "abu-dhabi": {
      intro: "In Abu Dhabi, SEHA primary care centres handle pre-marital screening under the DOH framework. The SEHA centres in Tourist Club Area, Al Bateen, and Khalifa City offer the complete panel. The DOH MALAK system tracks all pre-marital results electronically.",
      areas: "Tourist Club Area, Al Bateen, Khalifa City, Al Mushrif",
      tips: "Book through the SEHA app for the shortest wait. Abu Dhabi's genetic counselling is typically same-day with results.",
    },
    sharjah: {
      intro: "In Sharjah, MOHAP-operated primary health care centres process pre-marital screening. The Al Qasimia and Al Majaz health centres are the primary locations. Licensed private labs in Sharjah can conduct the blood tests at competitive prices.",
      areas: "Al Qasimia, Al Majaz, Al Nahda, Muwaileh",
      tips: "Sharjah government centres charge AED 200-300, significantly less than private labs. Walk-in sample collection is available 7 AM-11 AM.",
    },
    "abu-dhabi|al-ain": {
      intro: "In Al Ain, the SEHA primary care centre handles pre-marital screening under the same Abu Dhabi DOH framework. The centre in Al Jimi is the main location, with Tawam Hospital available for complex genetic counselling cases.",
      areas: "Al Jimi, Tawam, Al Ain Central",
      tips: "Al Ain's SEHA centre is less crowded than Abu Dhabi city. Walk-ins are accepted but SEHA app bookings are recommended.",
    },
    ajman: {
      intro: "In Ajman, the MOHAP health centre handles pre-marital screening for Ajman residents. Private labs in Al Nuaimia also conduct the tests. Results are uploaded to the national pre-marital database.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Ajman residents can also use Sharjah MOHAP centres if closer. Government centre pricing is the most affordable option.",
    },
    "ras-al-khaimah": {
      intro: "In Ras Al Khaimah, the MOHAP primary health care centre near Al Nakheel handles pre-marital screening. RAK residents benefit from shorter wait times compared to Dubai or Abu Dhabi.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "RAK processes pre-marital screening typically within 3 business days. The MOHAP centre also provides the genetic counselling session.",
    },
    fujairah: {
      intro: "In Fujairah, the MOHAP health centre provides pre-marital screening services. As a smaller emirate, processing times are faster and the service is less crowded.",
      areas: "Fujairah City Centre",
      tips: "Fujairah's MOHAP centre handles both sample collection and genetic counselling. Walk-in service available mornings.",
    },
    "umm-al-quwain": {
      intro: "In Umm Al Quwain, the MOHAP health centre handles pre-marital screening. Being the smallest emirate, UAQ offers the fastest processing times for this service.",
      areas: "UAQ City Centre",
      tips: "UAQ residents can also access Ajman or Sharjah MOHAP centres if preferred. The local centre is rarely crowded.",
    },
    "al-ain": {
      intro: "In Al Ain, the SEHA primary care centre handles pre-marital screening under the Abu Dhabi DOH framework. The centre in Al Jimi is the main location, with Tawam Hospital available for complex genetic counselling cases.",
      areas: "Al Jimi, Tawam, Al Ain Central",
      tips: "Al Ain's SEHA centre is less crowded than Abu Dhabi city. Walk-ins are accepted but SEHA app bookings are recommended.",
    },
  },
  "pregnancy-tests": {
    dubai: {
      intro: "Dubai has the widest choice of prenatal testing facilities in the UAE. Major hospitals like Mediclinic City Hospital, American Hospital, and Latifa Hospital offer comprehensive antenatal panels. Standalone labs including Al Borg, STAR Metropolis, and Medsol offer individual prenatal blood tests and NIPT. Home collection for routine prenatal blood work is available through DarDoc (daily 7 AM-11 PM).",
      areas: "Healthcare City, Jumeirah, Downtown Dubai, Al Barsha, Deira",
      tips: "Ask your OB-GYN which tests are bundled in the hospital's antenatal package versus which you should get separately at a standalone lab to save costs.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi's prenatal care is regulated by the DOH. Major hospitals including Cleveland Clinic Abu Dhabi, Corniche Hospital, and NMC Royal Hospital offer full antenatal panels. The National Reference Laboratory (NRL) provides specialised prenatal testing including NIPT. DarDoc home collection operates in Abu Dhabi for routine prenatal blood work.",
      areas: "Al Maryah Island, Corniche, Khalifa City, Al Reem Island",
      tips: "Corniche Hospital is the government maternity reference centre and offers subsidised prenatal panels for insurance holders. NRL handles complex genetic and prenatal screenings.",
    },
    sharjah: {
      intro: "In Sharjah, prenatal testing is available at hospitals like University Hospital Sharjah and Al Zahra Hospital, as well as standalone labs. Thumbay Labs and Al Borg branches in Sharjah offer most prenatal blood tests. Healthchecks360 provides home collection in Sharjah for prenatal blood work.",
      areas: "Al Nahda, Al Majaz, University City, Al Taawun",
      tips: "Many Sharjah residents access Dubai Healthcare City labs for specialised tests like NIPT while using local labs for routine panels.",
    },
    "abu-dhabi|al-ain": {
      intro: "In Al Ain, Tawam Hospital and Al Ain Hospital provide antenatal care under the DOH framework. Private labs in Al Jimi and Al Ain Central offer routine prenatal blood tests. NRL provides reference testing for complex prenatal cases.",
      areas: "Tawam, Al Jimi, Al Ain Central",
      tips: "Tawam Hospital is the government reference hospital for Al Ain. For NIPT and advanced prenatal testing, samples may be sent to Abu Dhabi for processing.",
    },
    ajman: {
      intro: "In Ajman, prenatal blood tests are available at Thumbay University Hospital and private labs in Al Nuaimia. For specialised tests like NIPT, many Ajman residents use Dubai or Sharjah facilities.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Thumbay Labs Ajman is the most accessible option for routine prenatal panels. Healthchecks360 home collection covers parts of Ajman.",
    },
    "ras-al-khaimah": {
      intro: "In Ras Al Khaimah, RAK Hospital and private labs near Al Nakheel provide prenatal testing. For advanced screening including NIPT, many RAK residents travel to Dubai or use home collection services that forward samples to Dubai labs.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "Basic prenatal panels are available locally. For NIPT and specialised hormone tests, confirm availability with your lab before travelling.",
    },
    fujairah: {
      intro: "In Fujairah, prenatal blood tests are available at Fujairah Hospital and a small number of private labs. Specialised prenatal testing may require referral to a facility in Dubai or Abu Dhabi.",
      areas: "Fujairah City Centre",
      tips: "For routine first-trimester panels, local facilities are adequate. For NIPT or advanced genetic screening, plan to use a Dubai or Abu Dhabi lab.",
    },
    "umm-al-quwain": {
      intro: "In Umm Al Quwain, basic prenatal blood tests are available at the local hospital and clinics. For comprehensive prenatal panels and NIPT, most UAQ residents use Sharjah or Dubai facilities.",
      areas: "UAQ City Centre",
      tips: "Basic CBC and blood group tests are available locally. For the full first-trimester panel, Sharjah labs are the nearest comprehensive option.",
    },
    "al-ain": {
      intro: "In Al Ain, Tawam Hospital and Al Ain Hospital provide antenatal care under the DOH framework. Private labs in Al Jimi and Al Ain Central offer routine prenatal blood tests. NRL provides reference testing for complex prenatal cases.",
      areas: "Tawam, Al Jimi, Al Ain Central",
      tips: "Tawam Hospital is the government reference hospital for Al Ain. For NIPT and advanced prenatal testing, samples may be sent to Abu Dhabi for processing.",
    },
  },
  "walk-in-labs": {
    dubai: {
      intro: "Most standalone labs in Deira, Bur Dubai, and Al Karama accept walk-ins without appointments. Healthcare City labs may require appointments. Dubai has the highest density of walk-in labs in the UAE, with chains like Medsol, Al Borg, Alpha Medical, and STAR Metropolis operating multiple branches across the city.",
      areas: "Deira, Bur Dubai, Al Karama, Al Barsha, Healthcare City, JLT",
      tips: "Arrive between 7-9 AM for fasting tests. Al Karama and Bur Dubai branches are the busiest. JLT and Al Barsha branches tend to have shorter waits.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi has walk-in lab facilities across the city, with Al Borg, Unilabs, and NRL accepting walk-in patients. SEHA health centres also offer lab services but typically require a referral. Most standalone labs in Tourist Club Area and Khalifa City accept walk-ins.",
      areas: "Tourist Club Area, Khalifa City, Al Maryah Island, Mohammed Bin Zayed City",
      tips: "Unilabs Abu Dhabi and NRL are the major walk-in options. Morning slots (7-9 AM) are recommended for fasting blood work.",
    },
    sharjah: {
      intro: "Sharjah's standalone labs in Al Nahda, Al Majaz, and Muwaileh accept walk-in patients. Al Borg, Thumbay Labs, and several independent labs operate on a first-come-first-served basis. Sharjah labs are often less crowded than Dubai alternatives.",
      areas: "Al Nahda, Al Majaz, Muwaileh, Al Taawun, Al Qasimia",
      tips: "Al Nahda area labs are busiest due to proximity to the Dubai border. Muwaileh and University City area labs offer shorter waits.",
    },
    ajman: {
      intro: "In Ajman, Thumbay Labs and several private diagnostic centres in Al Nuaimia accept walk-in patients. Wait times are typically shorter than in Dubai or Sharjah, making Ajman a convenient option for residents of surrounding areas.",
      areas: "Al Nuaimia, Ajman Downtown, Al Rashidiya",
      tips: "Ajman labs are an affordable walk-in alternative for Sharjah residents. Most labs open by 7:30 AM.",
    },
    "ras-al-khaimah": {
      intro: "In Ras Al Khaimah, a small number of standalone labs near Al Nakheel and the city centre accept walk-in patients. Hospital-based labs at RAK Hospital may require a referral for walk-in blood work.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "Walk-in options are limited compared to Dubai. Call ahead to confirm walk-in availability, especially for specialised tests.",
    },
    fujairah: {
      intro: "Fujairah has a limited number of walk-in labs, primarily near Fujairah City Centre. Most blood tests can be done at the hospital outpatient lab or the small number of private diagnostic centres.",
      areas: "Fujairah City Centre",
      tips: "Walk-in options are limited. For a wider range of tests, residents often travel to Sharjah or Dubai.",
    },
    "umm-al-quwain": {
      intro: "In Umm Al Quwain, walk-in lab options are very limited. The local hospital lab and one or two private clinics may accept walk-ins for basic blood tests. Most UAQ residents use Ajman or Sharjah labs for walk-in blood work.",
      areas: "UAQ City Centre",
      tips: "For routine blood work, Ajman labs (15-20 minutes away) offer more walk-in options at competitive prices.",
    },
    "al-ain": {
      intro: "In Al Ain, walk-in lab services are available at private labs in Al Jimi and Al Ain Central. Hospital-based labs at Tawam and Al Ain Hospital require referrals. The DOH-approved private labs accept walk-in patients for self-requested blood tests.",
      areas: "Al Jimi, Al Ain Central, Al Muwaiji",
      tips: "Al Ain has fewer walk-in lab options than Abu Dhabi or Dubai. Morning visits (7-9 AM) are recommended for fasting tests.",
    },
  },
  "weekend-labs": {
    dubai: {
      intro: "Friday hours vary across Dubai — most labs reopen at 2 PM after Friday prayers. Saturday and Sunday are full operating days for most standalone labs. Medsol, Al Borg, and Alpha Medical maintain weekend hours across their Dubai branches. Some Healthcare City labs may operate on reduced Saturday schedules.",
      areas: "Deira, Bur Dubai, Al Karama, Al Barsha, JLT, Business Bay",
      tips: "Confirm Friday hours directly with your chosen lab. Most Dubai labs are open Saturday and Sunday with normal hours. Friday afternoon (2-6 PM) slots are popular and may have longer waits.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi labs follow a Friday/Saturday weekend schedule with most private labs open on Saturday. Friday hours are typically reduced (2 PM onwards or closed). Sunday is a full working day. Al Borg, Unilabs, and SEHA centres maintain weekend availability.",
      areas: "Tourist Club Area, Khalifa City, Mohammed Bin Zayed City",
      tips: "Saturday is the best weekend day for lab visits in Abu Dhabi. SEHA centres may have limited Saturday hours. Sunday is a full working day.",
    },
    sharjah: {
      intro: "Most Sharjah labs are open on Saturday and Sunday with normal hours. Friday hours are reduced or closed until 2 PM at most labs. Al Borg and Thumbay Labs branches in Sharjah maintain weekend hours. Al Nahda area labs are particularly popular on weekends.",
      areas: "Al Nahda, Al Majaz, Muwaileh, Al Taawun",
      tips: "Weekend hours at Sharjah labs mirror Dubai schedules for most chains. Al Nahda labs serve both Sharjah and Dubai residents on weekends.",
    },
    ajman: {
      intro: "Ajman labs generally operate on Saturdays and Sundays. Friday hours are limited. Thumbay Labs in Ajman typically opens Saturday at 8 AM. Private diagnostic centres in Al Nuaimia maintain weekend schedules.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Ajman labs offer a quieter weekend alternative to Sharjah and Dubai. Most open by 8 AM on Saturday.",
    },
    "ras-al-khaimah": {
      intro: "Weekend lab options in Ras Al Khaimah are limited compared to Dubai. Hospital outpatient labs may operate on Saturdays. Private labs near Al Nakheel may have reduced weekend hours.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "Confirm weekend hours in advance. Hospital emergency labs operate 24/7 but are for emergencies only.",
    },
    fujairah: {
      intro: "Weekend lab availability in Fujairah is limited. The hospital lab operates for emergencies. Private labs may have Saturday morning hours only.",
      areas: "Fujairah City Centre",
      tips: "Plan lab visits for weekdays if possible. For urgent weekend blood work, the hospital emergency lab is the only reliable option.",
    },
    "umm-al-quwain": {
      intro: "Umm Al Quwain has very limited weekend lab options. Hospital emergency services are available but standalone labs may be closed on Fridays and have limited Saturday hours.",
      areas: "UAQ City Centre",
      tips: "For weekend blood work, Ajman or Sharjah labs (20-30 minutes drive) are more reliable options than UAQ facilities.",
    },
    "al-ain": {
      intro: "In Al Ain, weekend lab availability follows the Abu Dhabi DOH pattern. Saturday is generally available at private labs. SEHA health centres may have limited Saturday hours. Sunday is a normal working day.",
      areas: "Al Jimi, Al Ain Central",
      tips: "Confirm Saturday hours with your chosen lab. Hospital-based labs at Tawam operate for emergencies on weekends.",
    },
  },
  "same-day-results": {
    dubai: {
      intro: "Dubai offers the widest selection of labs with same-day results. Medsol guarantees results within 6 hours for routine blood tests. Al Borg and Alpha Medical deliver most routine results within 4-8 hours. STAR Metropolis offers 4-hour urgent processing for an additional fee at their Healthcare City branch.",
      areas: "Healthcare City, Deira, Bur Dubai, Al Barsha, Business Bay",
      tips: "Submit samples before 10 AM for same-day results. Urgent processing (4-hour turnaround) is available at most Dubai labs for AED 50-100 extra.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi labs including Al Borg and Unilabs offer same-day results for routine tests when samples are submitted before noon. NRL provides 12-hour turnaround for most standard panels. SEHA health centre labs may take 24-48 hours.",
      areas: "Tourist Club Area, Khalifa City, Al Maryah Island",
      tips: "For guaranteed same-day results, use standalone private labs rather than hospital or SEHA centre labs. Submit samples before 10 AM.",
    },
    sharjah: {
      intro: "Sharjah labs including Al Borg and Thumbay Labs offer same-day results for routine blood tests. Turnaround is typically 6-12 hours when samples are submitted in the morning. Al Nahda area labs benefit from proximity to their processing centres.",
      areas: "Al Nahda, Al Majaz, Muwaileh",
      tips: "Morning sample submission (before 10 AM) is key for same-day results. Afternoon submissions may receive results the next morning.",
    },
    ajman: {
      intro: "In Ajman, Thumbay Labs offers same-day results for routine tests. Other private labs may process samples locally or send them to processing centres in Dubai or Sharjah, which can add time.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Confirm whether the lab processes samples on-site or sends them out. On-site processing means faster results.",
    },
    "ras-al-khaimah": {
      intro: "Same-day results in Ras Al Khaimah are available for basic tests at some private labs. However, samples for specialised tests are often sent to Dubai for processing, which adds 24-48 hours to turnaround.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "For guaranteed same-day results, confirm the lab processes the specific test on-site. Basic CBC and glucose are typically processed locally.",
    },
    fujairah: {
      intro: "Same-day results availability in Fujairah is limited to basic routine tests at the hospital lab and selected private clinics. Specialised tests are sent to Dubai or Abu Dhabi for processing.",
      areas: "Fujairah City Centre",
      tips: "Basic tests (CBC, glucose) may be available same-day. For comprehensive panels, expect 24-72 hour turnaround.",
    },
    "umm-al-quwain": {
      intro: "Same-day results in Umm Al Quwain are limited. Basic hospital lab tests may be available same-day for emergency cases, but routine blood work typically takes 24-48 hours as samples may be sent to Sharjah or Dubai for processing.",
      areas: "UAQ City Centre",
      tips: "For urgent same-day results, Ajman or Sharjah labs (20-30 minutes away) are the most practical option.",
    },
    "al-ain": {
      intro: "In Al Ain, private labs offer same-day results for routine tests when samples are submitted before noon. Hospital-based labs at Tawam process routine tests within 12-24 hours. NRL handles more complex panels with 24-48 hour turnaround.",
      areas: "Al Jimi, Al Ain Central, Tawam",
      tips: "Submit samples before 10 AM for same-day results at private labs. Hospital labs prioritise inpatient samples.",
    },
  },
  "mens-health-40-plus": {
    dubai: {
      intro: "Dubai has the most options for men's annual health screening. Executive health packages at labs like Al Borg (AED 499-899), Medsol (AED 230), and Unilabs (AED 999) cover the core men's panel. All major labs in Dubai offer self-requested testosterone and PSA testing without a doctor's referral.",
      areas: "Healthcare City, Deira, Bur Dubai, Al Barsha, JLT, Business Bay",
      tips: "Medsol Standard Wellness at AED 230 offers the best value for the core panel. Add testosterone and PSA separately for approximately AED 130-230 extra.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi offers executive health screening through Unilabs, Al Borg, and NRL. Cleveland Clinic Abu Dhabi and NMC Royal Hospital offer premium executive health checks including imaging. DOH insurance plans typically cover annual wellness blood work.",
      areas: "Al Maryah Island, Khalifa City, Tourist Club Area",
      tips: "NRL offers the most comprehensive panels in Abu Dhabi. Check if your DOH-mandated insurance plan covers annual wellness screening before paying out of pocket.",
    },
    sharjah: {
      intro: "In Sharjah, Al Borg and Thumbay Labs offer men's wellness packages. Standalone labs in Al Nahda and Al Majaz provide self-requested blood work including testosterone and PSA. Sharjah labs are typically 10-20% cheaper than Dubai equivalents.",
      areas: "Al Nahda, Al Majaz, Muwaileh, Al Taawun",
      tips: "Sharjah labs offer the same test quality as Dubai at lower prices. Al Nahda labs are convenient for Dubai residents who want Sharjah pricing.",
    },
    ajman: {
      intro: "In Ajman, Thumbay Labs and private diagnostic centres offer basic wellness panels. For comprehensive executive health packages including tumour markers, Ajman residents often use Dubai or Sharjah facilities.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Thumbay Labs Ajman offers competitive pricing for basic panels. For PSA and cancer markers, confirm availability before visiting.",
    },
    "ras-al-khaimah": {
      intro: "Men's health screening in Ras Al Khaimah is available at private labs and RAK Hospital's wellness centre. Basic panels are available locally; comprehensive executive packages may require travel to Dubai or Abu Dhabi.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "Basic wellness blood work is available locally. For the full executive panel with tumour markers, Dubai labs offer the widest choice.",
    },
    fujairah: {
      intro: "Fujairah has limited options for comprehensive men's health screening. Basic blood tests are available locally but executive health packages are best accessed in Dubai or Abu Dhabi.",
      areas: "Fujairah City Centre",
      tips: "For a comprehensive annual screen, plan a trip to Dubai or Abu Dhabi. Local facilities handle basic CBC, glucose, and lipid tests.",
    },
    "umm-al-quwain": {
      intro: "Men's health screening options in Umm Al Quwain are limited. Basic blood work is available locally but comprehensive panels including testosterone, PSA, and tumour markers are best obtained at labs in Sharjah or Dubai.",
      areas: "UAQ City Centre",
      tips: "Sharjah labs (25 minutes drive) offer the nearest comprehensive men's wellness packages at competitive prices.",
    },
    "al-ain": {
      intro: "In Al Ain, men's health screening is available at private labs and Tawam Hospital's wellness services. NRL handles specialised testing. DOH-insured residents may have coverage for annual wellness blood panels.",
      areas: "Al Jimi, Al Ain Central, Tawam",
      tips: "Check DOH insurance coverage for annual wellness panels. Private labs in Al Ain Central offer competitive self-pay pricing.",
    },
  },
  "womens-health-30-plus": {
    dubai: {
      intro: "Dubai offers the most comprehensive women's health screening options in the UAE. Medsol Women's Health Panel (AED 399, 82 biomarkers) is the best-value gender-specific package. Al Borg, STAR Metropolis, and Unilabs offer women's panels including reproductive hormones, thyroid, and iron studies. Home collection via DarDoc covers all of Dubai.",
      areas: "Healthcare City, Jumeirah, Al Barsha, Deira, JLT, Downtown Dubai",
      tips: "Medsol Women's Health Panel at AED 399 covers the most comprehensive gender-specific markers. DarDoc home collection is ideal for cycle-timed hormone tests.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi's women's health screening is available at NRL, Al Borg, and Unilabs. Cleveland Clinic and Corniche Hospital offer premium women's wellness programmes. The DOH insurance framework covers routine annual blood work for most residents. DarDoc home collection operates in Abu Dhabi.",
      areas: "Al Maryah Island, Corniche, Khalifa City, Al Reem Island",
      tips: "Corniche Hospital offers women's wellness packages through its obstetrics department. NRL is the reference lab for complex reproductive hormone panels.",
    },
    sharjah: {
      intro: "In Sharjah, women's health screening is available at Al Borg, Thumbay Labs, and hospital-based labs at Al Zahra Hospital. Al Nahda area labs serve both Sharjah and Dubai residents. Healthchecks360 provides home collection in Sharjah.",
      areas: "Al Nahda, Al Majaz, University City, Al Taawun",
      tips: "Sharjah labs offer women's panels at 10-15% less than Dubai equivalents. Healthchecks360 home collection is convenient for hormone tests that require morning blood draws.",
    },
    ajman: {
      intro: "In Ajman, women's health blood tests are available at Thumbay Labs and private clinics. For comprehensive women's panels including AMH and full reproductive hormones, Sharjah or Dubai labs provide the widest test menus.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Thumbay Labs Ajman handles basic women's wellness panels. For PCOS screening and AMH, confirm test availability before visiting.",
    },
    "ras-al-khaimah": {
      intro: "Women's health screening in RAK is available at private labs and RAK Hospital. Basic panels including thyroid and CBC are available locally. Comprehensive reproductive hormone testing may require Dubai or Abu Dhabi facilities.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "Basic wellness blood work is available locally. For AMH, full PCOS panels, or CA-125, confirm availability or use a Dubai lab.",
    },
    fujairah: {
      intro: "Fujairah has limited options for comprehensive women's health screening. Basic blood tests are available at the local hospital and private clinics. Specialised reproductive hormone panels are best accessed in Dubai or Sharjah.",
      areas: "Fujairah City Centre",
      tips: "Basic CBC, thyroid, and vitamin panels are available locally. Plan a trip to Dubai or Sharjah for comprehensive women's panels.",
    },
    "umm-al-quwain": {
      intro: "Women's health screening options in UAQ are limited. Basic blood work is available locally. For comprehensive panels including iron studies, thyroid, reproductive hormones, and cancer markers, Sharjah or Dubai labs are recommended.",
      areas: "UAQ City Centre",
      tips: "Sharjah labs (25 minutes drive) are the nearest option for comprehensive women's health panels.",
    },
    "al-ain": {
      intro: "In Al Ain, women's health screening is available at private labs and Tawam Hospital. NRL in Abu Dhabi handles specialised reproductive hormone testing. DOH insurance typically covers annual wellness blood panels for women.",
      areas: "Al Jimi, Al Ain Central, Tawam",
      tips: "Tawam Hospital offers women's wellness screening through its obstetrics department. Check DOH insurance coverage before paying out of pocket.",
    },
  },
  "senior-health-screening": {
    dubai: {
      intro: "Dubai offers the most comprehensive executive health screening for seniors. Al Borg Executive (AED 899, 120 biomarkers) and Unilabs Executive (AED 999, 150 biomarkers) are well-suited for the 60+ demographic. DarDoc home collection is particularly convenient for seniors who prefer not to travel to a lab.",
      areas: "Healthcare City, Jumeirah, Downtown Dubai, Al Barsha, Deira",
      tips: "Executive packages are the most cost-effective approach for seniors who need 10+ tests annually. DarDoc home collection (AED 0-50 fee) saves travel time.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi's senior health screening is available through NRL, Al Borg, Unilabs, and major hospital wellness programmes. Cleveland Clinic Abu Dhabi offers premium executive health checks including imaging. The DOH insurance framework covers annual wellness screening for insured residents.",
      areas: "Al Maryah Island, Khalifa City, Tourist Club Area, Corniche",
      tips: "NRL specialises in complex CKD monitoring panels relevant to seniors with kidney disease. Cleveland Clinic's executive health programme is the most comprehensive but premium-priced.",
    },
    sharjah: {
      intro: "In Sharjah, senior health screening is available at Al Borg, Thumbay Labs, and hospital-based labs. Al Zahra Hospital and University Hospital Sharjah offer wellness programmes suitable for seniors. Sharjah pricing is typically lower than Dubai.",
      areas: "Al Nahda, Al Majaz, University City, Al Taawun",
      tips: "Al Borg and Thumbay Labs offer executive packages at competitive rates. Hospital-based programmes may include imaging alongside blood work.",
    },
    ajman: {
      intro: "In Ajman, senior health screening is available at Thumbay University Hospital and private labs. For comprehensive executive packages including cardiac markers and tumour markers, Sharjah or Dubai facilities offer wider options.",
      areas: "Al Nuaimia, Ajman Downtown",
      tips: "Thumbay University Hospital offers basic wellness packages. For BNP and specialised cardiac markers, confirm availability before visiting.",
    },
    "ras-al-khaimah": {
      intro: "Senior health screening in RAK is available at RAK Hospital and private labs. Basic metabolic panels are available locally but comprehensive executive packages with cardiac markers and tumour panels may require travel to Dubai or Abu Dhabi.",
      areas: "Al Nakheel, RAK City Centre",
      tips: "RAK Hospital offers basic wellness screening. For comprehensive executive packages, plan to use Dubai or Abu Dhabi facilities.",
    },
    fujairah: {
      intro: "Fujairah has limited options for comprehensive senior health screening. Fujairah Hospital provides basic blood work. Seniors requiring advanced panels including BNP, tumour markers, and comprehensive metabolic profiles should access larger centres in Dubai or Abu Dhabi.",
      areas: "Fujairah City Centre",
      tips: "Basic blood work is available locally. For the full executive panel recommended for seniors, Dubai or Abu Dhabi labs are necessary.",
    },
    "umm-al-quwain": {
      intro: "Senior health screening in UAQ is limited to basic blood work at the local hospital. Comprehensive executive packages are best accessed in Sharjah, Ajman, or Dubai. Many UAQ seniors use Ajman's Thumbay Hospital for convenience.",
      areas: "UAQ City Centre",
      tips: "Ajman's Thumbay University Hospital (15 minutes) is the nearest facility offering broader wellness packages.",
    },
    "al-ain": {
      intro: "In Al Ain, Tawam Hospital and Al Ain Hospital provide senior health screening under the DOH framework. NRL handles specialised testing including CKD monitoring panels. Private labs offer basic wellness blood work.",
      areas: "Tawam, Al Jimi, Al Ain Central",
      tips: "Tawam Hospital has the most comprehensive testing capability in Al Ain. NRL's CKD monitoring panels are particularly relevant for seniors with kidney disease.",
    },
  },
  "corporate-health-check": {
    dubai: {
      intro: "Dubai has the widest selection of corporate health screening providers in the UAE. Al Borg, Medsol, Unilabs, and Thumbay Labs all offer corporate packages with volume discounts. DHA-regulated corporate health checks are required for some free zone employees. Many labs offer on-site screening for companies with 20+ employees.",
      areas: "Business Bay, DIFC, JLT, Healthcare City, Al Quoz, Deira, Bur Dubai",
      tips: "Request quotes from at least three labs. On-site screening is available for 20+ employees and eliminates the need for staff to travel. DHA approval is required for free zone companies.",
    },
    "abu-dhabi": {
      intro: "Abu Dhabi corporate health screening is regulated by the DOH. NRL, Al Borg, and Unilabs provide corporate packages. ADNOC, Mubadala, and government entities typically use NRL or SEHA-contracted labs. Many DOH-insured employers have annual wellness screening included in their insurance coverage.",
      areas: "Al Maryah Island, Khalifa City, Mussafah, Mohammed Bin Zayed City",
      tips: "Check if your DOH insurance plan includes annual corporate wellness screening before arranging a separate provider. NRL offers competitive corporate rates.",
    },
    sharjah: {
      intro: "Sharjah corporate health screening is available through Al Borg, Thumbay Labs, and several private diagnostic centres. Sharjah's lower lab pricing makes it an attractive option for companies based in both Sharjah and Dubai. On-site screening is available for larger companies.",
      areas: "Al Nahda, SAIF Zone, Al Majaz, Muwaileh",
      tips: "Sharjah-based labs offer corporate packages at 10-20% less than Dubai equivalents. SAIF Zone companies can arrange on-site screening through licensed labs.",
    },
    ajman: {
      intro: "Corporate health screening in Ajman is available through Thumbay Labs and private diagnostic centres. For companies with larger workforces, some Dubai and Sharjah labs offer on-site screening services that cover Ajman.",
      areas: "Al Nuaimia, Ajman Free Zone, Ajman Downtown",
      tips: "Thumbay University Hospital offers competitive corporate rates for Ajman Free Zone companies. On-site screening can be arranged for 20+ employees.",
    },
    "ras-al-khaimah": {
      intro: "In Ras Al Khaimah, corporate health screening is available at RAK Hospital and private labs. RAKEZ free zone companies often arrange corporate screening through licensed providers. For larger-scale screening programmes, Dubai-based labs may offer on-site services.",
      areas: "Al Nakheel, RAKEZ, RAK City Centre",
      tips: "RAKEZ can recommend approved health screening providers for free zone companies. Volume discounts are available for 50+ employees.",
    },
    fujairah: {
      intro: "Corporate health screening in Fujairah is limited to the hospital and a small number of private clinics. For companies with significant headcounts, arranging mobile screening from Dubai or Sharjah-based labs may be more practical.",
      areas: "Fujairah City Centre, FOIZ",
      tips: "For companies with 30+ employees, arranging mobile on-site screening from a Dubai-based lab can be more efficient than local options.",
    },
    "umm-al-quwain": {
      intro: "Corporate health screening options in UAQ are limited. Most UAQ-based companies use labs in Ajman or Sharjah for corporate health checks. Mobile screening services from larger lab chains can cover UAQ with advance booking.",
      areas: "UAQ City Centre, UAQ Free Zone",
      tips: "Ajman labs (15-20 minutes) are the most practical option for UAQ-based companies. Mobile screening can be arranged for larger groups.",
    },
    "al-ain": {
      intro: "In Al Ain, corporate health screening is available through private labs and Tawam Hospital's occupational health department. NRL provides corporate packages for Al Ain-based companies. DOH-insured companies may have annual wellness screening coverage.",
      areas: "Al Jimi, Al Ain Central, Al Ain Industrial Area",
      tips: "Check DOH insurance coverage for corporate wellness screening. NRL offers competitive rates for Al Ain companies with 20+ employees.",
    },
  },
};

// ─── FAQ Generator ──────────────────────────────────────────────────────────

function generateCityFaqs(
  guide: (typeof GUIDE_DATA)[string],
  cityName: string,
  citySlug: string,
  regulator: string
): { question: string; answer: string }[] {
  const guideSlug = guide.slug;

  const faqMap: Record<string, { question: string; answer: string }[]> = {
    "visa-medical": [
      {
        question: `Where can I get a visa medical test in ${cityName}?`,
        answer: `In ${cityName}, visa medical tests are conducted at ${regulator}-approved medical fitness centres. You must attend a centre specifically approved for medical fitness testing — regular clinics and hospitals are not authorised to conduct official visa medicals. Check the MOHAP Tasheel portal for the list of approved centres in ${cityName}.`,
      },
      {
        question: `How much does a visa medical test cost in ${cityName}?`,
        answer: `The visa medical test in ${cityName} typically costs AED 250-350 at government-approved centres. This includes the chest X-ray, blood draw (HIV, Hepatitis B, Hepatitis C, VDRL), physical examination, and MOHAP e-platform fee. Private approved centres may charge up to AED 450.`,
      },
      {
        question: `How long does the visa medical take in ${cityName}?`,
        answer: `Standard processing time in ${cityName} is 3-5 business days. Urgent processing (1-2 days) may be available at some centres for an additional AED 50-150. Results are uploaded electronically to the MOHAP system.`,
      },
      {
        question: `Can I walk in for a visa medical in ${cityName}?`,
        answer: `Most ${regulator}-approved medical fitness centres in ${cityName} accept walk-in patients, typically from 7 AM to 9 PM. Some centres also offer online appointment booking through the MOHAP system. Arrive early (7-8 AM) for the shortest queues.`,
      },
    ],
    "pre-marital-screening": [
      {
        question: `Where can I get pre-marital screening in ${cityName}?`,
        answer: `In ${cityName}, pre-marital screening is available at ${regulator} health centres and licensed private labs. Government health centres offer the complete panel and genetic counselling session. Private labs like Al Borg and Thumbay can conduct the blood tests but you may need to visit a government centre for the certificate.`,
      },
      {
        question: `How much does pre-marital screening cost in ${cityName}?`,
        answer: `Government centre pricing in ${cityName} is approximately AED 200-300 for the full panel (subsidised). Private lab bundles range from AED 350-500. Individual tests, if purchased separately, total approximately AED 500-700.`,
      },
      {
        question: `How long does the pre-marital certificate take in ${cityName}?`,
        answer: `Test results in ${cityName} are typically available within 3-5 business days. The genetic counselling session is often scheduled immediately after results are available. The certificate is usually issued on the same day as counselling.`,
      },
      {
        question: `Do both partners need to attend the pre-marital screening in ${cityName} together?`,
        answer: `No, both partners can attend separately at ${regulator} health centres in ${cityName}. The system links records via Emirates ID. Each partner's results are uploaded to the pre-marital screening database independently. Both must complete the genetic counselling session before the certificate is issued.`,
      },
    ],
    "pregnancy-tests": [
      {
        question: `Where can I get prenatal blood tests in ${cityName}?`,
        answer: `In ${cityName}, prenatal blood tests are available at hospitals providing antenatal care, standalone diagnostic labs, and through home collection services. Most standalone labs accept self-requested prenatal panels without a doctor's referral. Home collection is available in ${cityName} for routine prenatal blood work.`,
      },
      {
        question: `How much do pregnancy blood tests cost in ${cityName}?`,
        answer: `A first trimester prenatal panel in ${cityName} (CBC, blood group, rubella, TSH, HIV, Hepatitis B, VDRL) costs AED 400-700 if ordered individually. Bundled prenatal packages start from AED 350-500. NIPT adds AED 2,500-4,000 separately.`,
      },
      {
        question: `Is home collection available for prenatal blood tests in ${cityName}?`,
        answer: `Home collection for prenatal blood work is available in ${cityName} through services like DarDoc and Healthchecks360. This is particularly useful for cycle-timed hormone tests and for pregnant women who prefer not to travel to a lab. Note that NIPT samples may require in-lab collection at specific centres.`,
      },
      {
        question: `When should I get my first pregnancy blood tests in ${cityName}?`,
        answer: `Your first prenatal blood panel should be ordered at your booking appointment at 6-10 weeks gestation. Most OB-GYNs in ${cityName} request CBC, blood group, Rh factor, rubella IgG, TSH, HIV, hepatitis B, and VDRL at this visit. The gestational diabetes test follows at 24-28 weeks.`,
      },
    ],
    "walk-in-labs": [
      {
        question: `Which labs accept walk-ins in ${cityName}?`,
        answer: `Most standalone diagnostic labs in ${cityName} accept walk-in patients without appointments. Major chains like Al Borg, Medsol, and Thumbay Labs operate on a first-come-first-served basis. Hospital-based labs typically require a doctor's referral and do not accept external walk-ins.`,
      },
      {
        question: `What is the best time to visit a walk-in lab in ${cityName}?`,
        answer: `For fasting blood tests in ${cityName}, arrive between 7-9 AM. This gives you the shortest wait and ensures your sample is processed during the day for faster results. Avoid 10 AM-12 PM which is the busiest period at most labs.`,
      },
      {
        question: `Do I need a doctor's referral for a walk-in blood test in ${cityName}?`,
        answer: `No. Standalone diagnostic labs in ${cityName} accept self-requested blood tests without a doctor's referral. Simply walk in with your Emirates ID, select the tests you want, and pay at the counter. Hospital-based labs are the exception and typically require a doctor's referral.`,
      },
      {
        question: `How much does a walk-in blood test cost in ${cityName}?`,
        answer: `Walk-in blood test prices in ${cityName} start from AED 30 for basic tests like fasting glucose and go up to AED 300+ for comprehensive panels. A standard CBC costs AED 69-120, lipid profile AED 80-150, and Vitamin D AED 85-150. No appointment or referral fees apply at standalone labs.`,
      },
    ],
    "weekend-labs": [
      {
        question: `Which labs are open on Friday in ${cityName}?`,
        answer: `Friday lab hours in ${cityName} vary — most labs close during Friday prayers and reopen at 2 PM. Some chains maintain reduced Friday hours (typically 2 PM-8 PM). Saturday and Sunday are normal operating days for most standalone labs in ${cityName}. Always confirm Friday hours directly with your chosen lab.`,
      },
      {
        question: `Can I get a fasting blood test on a weekend in ${cityName}?`,
        answer: `Yes. Labs in ${cityName} that operate on weekends accept fasting blood tests. Arrive when the lab opens (typically 7-8 AM on Saturday) for the best results. Friday morning is usually not an option as most labs open at 2 PM on Fridays.`,
      },
      {
        question: `Which labs in ${cityName} are open on Saturday?`,
        answer: `Most standalone diagnostic labs in ${cityName} operate on Saturdays with normal or near-normal hours (typically 7 AM-9 PM). Major chains including Al Borg, Medsol, and Thumbay Labs maintain Saturday operations across their ${cityName} branches.`,
      },
      {
        question: `Are lab results delayed on weekends in ${cityName}?`,
        answer: `Routine test results from ${cityName} labs submitted on Saturday or Sunday are processed at normal speed — same-day or next-day turnaround applies. Samples submitted on Friday may experience a slight delay if the processing centre operates on reduced Friday hours.`,
      },
    ],
    "same-day-results": [
      {
        question: `Which labs in ${cityName} offer same-day results?`,
        answer: `Most standalone labs in ${cityName} offer same-day results for routine blood tests (CBC, lipid profile, glucose, LFT, KFT) when samples are submitted before 10 AM. Chains like Al Borg, Medsol, and Thumbay Labs typically deliver results within 4-12 hours.`,
      },
      {
        question: `How quickly can I get blood test results in ${cityName}?`,
        answer: `Routine blood test turnaround in ${cityName}: CBC 4-6 hours, lipid profile 4-8 hours, glucose 2-4 hours, liver and kidney function 6-12 hours. Urgent processing (1-4 hours for basic tests) is available at some labs for an additional AED 50-100.`,
      },
      {
        question: `Can I get vitamin test results same-day in ${cityName}?`,
        answer: `Vitamin D and B12 results from ${cityName} labs typically take 12-24 hours rather than same-day, as they require more complex processing. Some labs offer urgent processing for vitamin tests at an additional fee. Basic panels (CBC, glucose, lipid) are more reliably same-day.`,
      },
      {
        question: `What time should I submit my sample for same-day results in ${cityName}?`,
        answer: `For same-day results in ${cityName}, submit your blood sample before 10 AM. Most lab processing cycles run morning to evening, so morning submissions receive results by evening. Samples submitted after noon may receive results the next morning.`,
      },
    ],
    "mens-health-40-plus": [
      {
        question: `What blood tests should men over 40 get in ${cityName}?`,
        answer: `Men over 40 in ${cityName} should get: CBC, lipid profile, HbA1c, fasting glucose, LFT, KFT, TSH, Vitamin D, Vitamin B12 annually. Add testosterone if symptomatic and PSA from age 50 (or 45 with risk factors). All tests are available at standalone labs in ${cityName} without a doctor's referral.`,
      },
      {
        question: `Where is the cheapest men's health check in ${cityName}?`,
        answer: `The most cost-effective men's health screening in ${cityName} is through bundled wellness packages. Packages range from AED 230-999 depending on the number of biomarkers. Buying tests individually typically costs 30-50% more. Check which labs in ${cityName} offer the best package pricing.`,
      },
      {
        question: `Can I get a testosterone test without a doctor in ${cityName}?`,
        answer: `Yes. All standalone diagnostic labs in ${cityName} offer self-requested testosterone testing without a doctor's referral. A morning blood draw (before 10 AM) is required as testosterone levels peak in the morning. Cost: AED 100-160.`,
      },
      {
        question: `Is PSA testing available at labs in ${cityName}?`,
        answer: `Yes. PSA testing is available at all major diagnostic labs in ${cityName} without a doctor's referral. Cost: AED 75-120. PSA is recommended for men over 50 (or 45 with risk factors). It is included in most executive health packages.`,
      },
    ],
    "womens-health-30-plus": [
      {
        question: `What blood tests should women over 30 get in ${cityName}?`,
        answer: `Women over 30 in ${cityName} should get: CBC, iron studies (ferritin, TIBC), thyroid panel (TSH minimum), Vitamin D, and Vitamin B12 annually. From 35+, add lipid profile, HbA1c, and AMH. From 40+, consider CA-125 and hs-CRP. All available at ${cityName} labs without referral.`,
      },
      {
        question: `Where can I get a women's health panel in ${cityName}?`,
        answer: `Women's health panels are available at standalone diagnostic labs in ${cityName}. Gender-specific packages (AED 350-500) include reproductive hormones, thyroid, iron studies, and metabolic markers. Al Borg, Medsol, and Thumbay Labs offer women's wellness bundles.`,
      },
      {
        question: `Can I get PCOS testing at labs in ${cityName}?`,
        answer: `Yes. PCOS blood tests (testosterone, DHEAS, LH, FSH, fasting insulin, AMH, prolactin, TSH) are available at standalone labs in ${cityName} without a referral. Some tests require Day 2-4 of your cycle. Confirm availability of the full panel with your chosen lab before visiting.`,
      },
      {
        question: `Is home collection available for women's blood tests in ${cityName}?`,
        answer: `Home collection for women's health blood tests is available in ${cityName} through services like DarDoc and Healthchecks360. This is especially convenient for cycle-timed hormone tests (FSH, LH on Day 2-4) when you need blood drawn on a specific morning.`,
      },
    ],
    "senior-health-screening": [
      {
        question: `What blood tests should seniors over 60 get in ${cityName}?`,
        answer: `Seniors over 60 in ${cityName} should get: CBC, comprehensive metabolic panel (LFT + KFT), lipid profile, HbA1c, TSH, Vitamin D, B12, and hs-CRP every 6-12 months. Add BNP for cardiac monitoring, PSA (men), CA-125 (women with risk factors), and CEA annually. Executive packages are the most efficient approach.`,
      },
      {
        question: `What is the best health check package for seniors in ${cityName}?`,
        answer: `Executive health packages at AED 499-999 are the most cost-effective approach for seniors in ${cityName} who need 10+ tests annually. These cover comprehensive metabolic, thyroid, vitamins, and often include tumour markers. Confirm BNP (cardiac marker) inclusion as not all packages include it.`,
      },
      {
        question: `Is home collection available for senior blood tests in ${cityName}?`,
        answer: `Home collection is available in ${cityName} through services like DarDoc, which is particularly convenient for seniors who prefer not to travel to a lab. Home nurses can draw samples for all routine blood tests. Fee: AED 0-50 depending on the service and package.`,
      },
      {
        question: `How often should seniors in ${cityName} get blood tests?`,
        answer: `Seniors with no chronic conditions should get a comprehensive panel annually. Those with diabetes, hypertension, or CKD should repeat specific panels (KFT, glucose, HbA1c) every 3-6 months. In ${cityName}, most labs offer follow-up packages at reduced rates for repeat testing.`,
      },
    ],
    "corporate-health-check": [
      {
        question: `Which labs in ${cityName} offer corporate health screening?`,
        answer: `Major lab chains in ${cityName} including Al Borg, Medsol, Thumbay Labs, and Unilabs offer corporate health screening packages. Volume discounts are available for companies with 20+ employees. On-site screening can be arranged for larger groups.`,
      },
      {
        question: `How much does corporate health screening cost per employee in ${cityName}?`,
        answer: `Corporate health screening in ${cityName} ranges from AED 150-499 per employee depending on the package complexity and company volume. Basic packages (CBC, glucose, lipid, LFT, KFT) start from AED 150. Comprehensive packages with vitamins and thyroid: AED 250-499. Volume discounts apply for 50+ employees.`,
      },
      {
        question: `Can labs in ${cityName} do on-site corporate screening?`,
        answer: `Yes. Major lab chains in ${cityName} offer on-site corporate health screening for companies with 20+ employees. A mobile phlebotomy team visits your office, collects samples, and delivers results electronically within 24-48 hours. Book at least 2 weeks in advance.`,
      },
      {
        question: `What does a basic corporate health check include in ${cityName}?`,
        answer: `A basic corporate health check in ${cityName} typically includes: CBC, fasting glucose, lipid profile, LFT, KFT, and urinalysis. Enhanced packages add TSH, Vitamin D, HbA1c, and chest X-ray. All regulated by the ${regulator} in ${cityName}.`,
      },
    ],
  };

  return faqMap[guideSlug] || [];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCityObj(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

function getGuideObj(slug: string) {
  return GUIDE_DATA[slug];
}

// ─── Static Params ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const params: { guide: string; city: string }[] = [];
  const guideSlugs = Object.keys(GUIDE_DATA);
  const citySlugs = CITIES.map((c) => c.slug);

  for (const guideSlug of guideSlugs) {
    for (const citySlug of citySlugs) {
      // Include if at least 2 labs exist in this city
      const cityLabs = getLabsByCity(citySlug);
      if (cityLabs.length >= 2) {
        params.push({ guide: guideSlug, city: citySlug });
      }
    }
  }

  return params;
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guide: string; city: string }>;
}): Promise<Metadata> {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideObj(guideSlug);
  const city = getCityObj(citySlug);
  if (!guide || !city) return {};

  const title = `${guide.name} in ${city.name} — Where to Go & How Much It Costs`;
  const description = `${guide.name} in ${city.name}, UAE. Find ${getRegulatorShort(citySlug)}-approved labs, compare prices, and get city-specific tips. Cost range: ${guide.costRange}. Updated March 2026.`;
  const base = getBaseUrl();
  const url = `${base}/labs/guides/${guideSlug}/${citySlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Zavis",
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function LabGuideCityPage({
  params,
}: {
  params: Promise<{ guide: string; city: string }>;
}) {
  const { guide: guideSlug, city: citySlug } = await params;
  const guide = getGuideObj(guideSlug);
  const city = getCityObj(citySlug);
  if (!guide || !city) notFound();

  const base = getBaseUrl();
  const regulator = getRegulator(citySlug);
  const regulatorShort = getRegulatorShort(citySlug);
  const cityContext = CITY_CONTEXT[guideSlug]?.[citySlug];

  // Labs in this city
  const cityLabs = getLabsByCity(citySlug);

  // Filter to labs that have prices for at least one of the guide's related tests
  const relatedTestSlugs = new Set(guide.relatedTests);
  const relevantLabs = cityLabs
    .map((lab) => {
      const labPrices = getPricesForLab(lab.slug);
      const matchingTests = labPrices.filter((p) => relatedTestSlugs.has(p.testSlug));
      return { lab, matchCount: matchingTests.length, cheapest: matchingTests.length > 0 ? Math.min(...matchingTests.map((p) => p.price)) : 0 };
    })
    .filter((entry) => entry.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.cheapest - b.cheapest);

  // Labs with home collection in this city
  const homeCollectionLabs = cityLabs.filter((l) => l.homeCollection);

  // Resolve related tests with city-filtered price ranges
  const relatedTests = guide.relatedTests
    .map((slug) => {
      const test = getLabTest(slug);
      if (!test) return null;
      const range = getPriceRangeInCity(slug, citySlug);
      return { test, range };
    })
    .filter(Boolean) as { test: NonNullable<ReturnType<typeof getLabTest>>; range: ReturnType<typeof getPriceRangeInCity> | undefined }[];

  // Other guide slugs for cross-linking
  const otherGuides = Object.values(GUIDE_DATA).filter((g) => g.slug !== guideSlug);

  // Other cities for cross-linking
  const otherCities = CITIES.filter((c) => c.slug !== citySlug);

  // FAQs
  const faqs = generateCityFaqs(guide, city.name, citySlug, regulator);

  // JSON-LD
  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Guides", url: `${base}/labs/guides` },
    { name: guide.name, url: `${base}/labs/guides/${guideSlug}` },
    { name: city.name },
  ]);
  const faqSchema = faqPageSchema(faqs);
  const speakable = speakableSchema([".answer-block", "h1", ".key-facts-box"]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: `${guide.name} in ${city.name}`,
          description: `${guide.name} in ${city.name}, UAE. Labs, prices, regulatory info, and practical tips.`,
          lastReviewed: "2026-03-25",
          reviewedBy: { "@type": "Organization", name: "Zavis", url: base },
          url: `${base}/labs/guides/${guideSlug}/${citySlug}`,
          breadcrumb: breadcrumbs,
        }}
      />

      <div className="container-tc py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Lab Tests", href: "/labs" },
            { label: "Guides", href: "/labs/guides" },
            { label: guide.name, href: `/labs/guides/${guideSlug}` },
            { label: city.name },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              {city.name} Lab Guide
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark leading-tight mb-4">
            {guide.name} in {city.name}
          </h1>

          {/* Answer Block */}
          <div
            className="answer-block bg-light-50 border-l-4 border-accent p-4 md:p-5"
            data-answer-block="true"
          >
            <p className="text-sm md:text-base text-dark leading-relaxed">
              {cityContext
                ? cityContext.intro
                : `${guide.name} services in ${city.name} are regulated by the ${regulator}. Labs in ${city.name} offer the relevant blood tests and screening panels for this guide. Browse the labs below to compare prices and find the most convenient option.`}
            </p>
          </div>
        </header>

        {/* Key Facts for City */}
        <div className="key-facts-box bg-light-50 border border-light-200 p-4 mb-8">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Key Facts for {city.name}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                  Key Areas
                </p>
                <p className="text-xs font-semibold text-dark mt-0.5">
                  {cityContext ? cityContext.areas : city.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                  Cost Range
                </p>
                <p className="text-xs font-semibold text-dark mt-0.5">
                  {guide.costRange}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                  Processing Time
                </p>
                <p className="text-xs font-semibold text-dark mt-0.5">
                  {guide.processingTime}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                  Regulator
                </p>
                <p className="text-xs font-semibold text-dark mt-0.5">
                  {regulatorShort}
                </p>
              </div>
            </div>
          </div>
          {cityContext?.tips && (
            <div className="mt-3 pt-3 border-t border-light-200">
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-dark">Tip:</strong> {cityContext.tips}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Where to Get Tested */}
            {relevantLabs.length > 0 && (
              <section>
                <div className="section-header mb-4">
                  <h2>Where to Get Tested in {city.name}</h2>
                  <span className="arrows">&gt;&gt;&gt;</span>
                </div>
                <p className="text-sm text-muted mb-4">
                  {relevantLabs.length} lab{relevantLabs.length !== 1 ? "s" : ""} in {city.name}{" "}
                  offer tests relevant to this guide. Sorted by number of matching tests and price.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relevantLabs.slice(0, 8).map(({ lab, matchCount, cheapest }) => (
                    <LabCard
                      key={lab.slug}
                      lab={lab}
                      testCount={matchCount}
                      cheapestFrom={cheapest > 0 ? cheapest : undefined}
                    />
                  ))}
                </div>
                {relevantLabs.length > 8 && (
                  <div className="mt-4 text-center">
                    <Link
                      href={`/labs?city=${citySlug}`}
                      className="text-xs font-bold text-accent hover:text-accent-dark transition-colors"
                    >
                      View all {relevantLabs.length} labs in {city.name} →
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* Tests & Prices */}
            {relatedTests.length > 0 && (
              <section>
                <div className="section-header mb-4">
                  <h2>Tests &amp; Prices in {city.name}</h2>
                  <span className="arrows">&gt;&gt;&gt;</span>
                </div>
                <p className="text-sm text-muted mb-4">
                  Price ranges for tests relevant to {guide.name.toLowerCase()}, filtered to labs
                  operating in {city.name}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedTests.map(({ test, range }) => (
                    <Link
                      key={test.slug}
                      href={`/labs/test/${test.slug}`}
                      className="border border-light-200 hover:border-accent p-4 transition-colors group block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors truncate">
                            {test.shortName}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5 line-clamp-2">
                            {test.description}
                          </p>
                        </div>
                        {range ? (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-accent">
                              {formatPrice(range.min)}
                            </p>
                            {range.max > range.min && (
                              <p className="text-[10px] text-muted">
                                – {formatPrice(range.max)}
                              </p>
                            )}
                            <p className="text-[10px] text-muted mt-0.5">
                              {range.labCount} lab{range.labCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted flex-shrink-0">
                            Not priced in {city.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted">
                        <span className="capitalize">{test.sampleType}</span>
                        <span>·</span>
                        <span>{test.fastingRequired ? "Fasting required" : "No fast needed"}</span>
                        <span>·</span>
                        <span>~{test.turnaroundHours}h results</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Home Collection */}
            {homeCollectionLabs.length > 0 && (
              <section>
                <div className="section-header mb-4">
                  <h2>Home Collection Available in {city.name}</h2>
                  <span className="arrows">&gt;&gt;&gt;</span>
                </div>
                <div className="bg-light-50 border border-light-200 p-4 mb-4">
                  <p className="text-sm text-dark leading-relaxed">
                    {homeCollectionLabs.length} lab{homeCollectionLabs.length !== 1 ? "s" : ""}{" "}
                    operating in {city.name} offer home sample collection. A phlebotomist visits
                    your home, office, or hotel to draw blood samples — convenient for fasting tests,
                    seniors, or anyone who prefers not to visit a lab.
                  </p>
                </div>
                <div className="space-y-3">
                  {homeCollectionLabs.map((lab) => (
                    <Link
                      key={lab.slug}
                      href={`/labs/${lab.slug}`}
                      className="flex items-center justify-between border border-light-200 hover:border-accent p-3 transition-colors group block"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Home className="w-4 h-4 text-accent flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors truncate">
                            {lab.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            Home collection fee:{" "}
                            {lab.homeCollectionFee === 0 ? "Free" : `AED ${lab.homeCollectionFee}`}
                            {" · "}Results in {lab.turnaroundHours}h
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <FaqSection title={`FAQ — ${guide.name} in ${city.name}`} faqs={faqs} />
            )}

            {/* Cross-links: Same guide in other cities */}
            <section>
              <div className="section-header mb-4">
                <h2>{guide.name} in Other Cities</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {otherCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/labs/guides/${guideSlug}/${c.slug}`}
                    className="border border-light-200 hover:border-accent p-3 transition-colors group text-center"
                  >
                    <p className="text-xs font-bold text-dark group-hover:text-accent transition-colors">
                      {c.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Cross-links: Other guides in this city */}
            <section>
              <div className="section-header mb-4">
                <h2>More Lab Guides for {city.name}</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {otherGuides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/labs/guides/${g.slug}/${citySlug}`}
                    className="flex items-center gap-2 border border-light-200 hover:border-accent p-3 transition-colors group"
                  >
                    <ArrowRight className="w-3 h-3 text-accent flex-shrink-0" />
                    <span className="text-xs text-dark group-hover:text-accent transition-colors">
                      {g.name} in {city.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Disclaimer */}
            <div className="border border-light-200 bg-light-50 p-4 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-dark">Medical Disclaimer:</strong> This guide is for
                  informational purposes only and does not constitute medical advice. Information
                  about {guide.name.toLowerCase()} in {city.name} is based on publicly available
                  data from the {regulator} and lab pricing as of March 2026. Prices and availability
                  may vary. Always consult a licensed physician before ordering medical tests or
                  making health decisions. Healthcare in {city.name} is regulated by the {regulator}.
                </p>
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Parent Guide */}
            <div className="border border-light-200 bg-light-50 p-4">
              <p className="text-xs font-bold text-dark mb-2">
                Full Guide
              </p>
              <p className="text-[11px] text-muted mb-3 leading-relaxed">
                Read the complete UAE-wide {guide.name.toLowerCase()} guide with detailed
                information on required tests, process, and costs.
              </p>
              <Link
                href={`/labs/guides/${guideSlug}`}
                className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
              >
                {guide.name} — Full Guide →
              </Link>
            </div>

            {/* Other Guides in This City */}
            <div className="border border-light-200 p-4">
              <div className="section-header mb-3">
                <h3 className="text-sm">{city.name} Lab Guides</h3>
                <span className="arrows text-xs">&gt;&gt;&gt;</span>
              </div>
              <div className="space-y-2">
                {otherGuides.slice(0, 5).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/labs/guides/${g.slug}/${citySlug}`}
                    className="flex items-start gap-2 group py-1.5 border-b border-light-100 last:border-b-0"
                  >
                    <ArrowRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-dark group-hover:text-accent transition-colors leading-tight">
                      {g.name} in {city.name}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/labs/guides"
                className="text-[11px] font-bold text-accent hover:text-accent-dark mt-3 block transition-colors"
              >
                All lab guides →
              </Link>
            </div>

            {/* City Quick Info */}
            <div className="border border-light-200 p-4">
              <div className="section-header mb-3">
                <h3 className="text-sm">About {city.name}</h3>
                <span className="arrows text-xs">&gt;&gt;&gt;</span>
              </div>
              <div className="space-y-2 text-[11px] text-muted leading-relaxed">
                <div className="flex items-start gap-2">
                  <Building2 className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                  <span>Emirate: {city.emirate}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                  <span>Regulator: {regulatorShort}</span>
                </div>
                <div className="flex items-start gap-2">
                  <FlaskConical className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                  <span>{cityLabs.length} labs in directory</span>
                </div>
                {homeCollectionLabs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Home className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    <span>{homeCollectionLabs.length} with home collection</span>
                  </div>
                )}
              </div>
            </div>

            {/* Browse All Tests */}
            <div className="border border-light-200 bg-light-50 p-4">
              <p className="text-xs font-bold text-dark mb-2">
                Compare Blood Test Prices
              </p>
              <p className="text-[11px] text-muted mb-3 leading-relaxed">
                Browse and compare prices for 30+ tests across labs in {city.name} and the UAE.
              </p>
              <Link
                href="/labs"
                className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
              >
                Browse all tests →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
