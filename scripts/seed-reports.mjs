#!/usr/bin/env node
/**
 * seed-reports.mjs
 *
 * Seed the `reports` table with the 10 UAE-specific report concept briefs
 * from the Zocdoc research (Item 6 — "What UAE Patients Want" annual
 * report scaffold). Every row is inserted as `status='draft'` — the
 * editorial team will fill in the real body, charts and release dates
 * later. These briefs exist so the page-class code has data to render
 * against in development + CI.
 *
 * Run AFTER applying `scripts/db/migrations/2026-04-11-reports.sql`:
 *   DATABASE_URL=postgres://... node scripts/seed-reports.mjs
 *
 * Safe to re-run — every upsert is idempotent via ON CONFLICT (slug).
 *
 * IMPORTANT: Uses `pg` (node-postgres) directly. Do NOT switch to
 * @neondatabase/serverless — see CLAUDE.md § Database Driver.
 */

import { Pool } from "pg";

// ─── Realistic per-report methodology (Zavis baseline) ──────────────────────
const ZAVIS_DATA_SOURCE =
  "DHA + DOH + MOHAP public registers; Zavis proprietary provider analysis of 12,519 facilities";
const ZAVIS_SAMPLE_SIZE =
  "12,519 DHA/DOH/MOHAP-licensed providers across the seven emirates";

// ─── Placeholder body template ──────────────────────────────────────────────
// The editorial team replaces this with the real report body. We keep it as
// a structured outline (intro, methodology, key finding, sub-sections,
// conclusions) so the page class can validate that every report has a
// minimum structure before it goes live.
function placeholderBody({
  title,
  headlineStat,
  sampleSize,
  methodology,
  subsections,
}) {
  const sections = subsections
    .map(
      (s, i) =>
        `## ${i + 2}. ${s.title}\n\n${s.summary}\n\n_Detailed findings, charts and provider-level breakdowns are drafted here by the Zavis Intelligence team._\n`
    )
    .join("\n");
  return `# ${title}

> **Headline finding:** ${headlineStat}

## Executive summary

This report is part of Zavis Intelligence's "What UAE Patients Want" research programme — a tentpole annual + quarterly data series tracking UAE healthcare access, affordability, patient experience and provider supply. The full analysis below is a placeholder draft; the final copy, charts and commentary are written by the Zavis editorial team before release.

## 1. Methodology & sample

${methodology}

- **Sample size:** ${sampleSize}
- **Data sources:** ${ZAVIS_DATA_SOURCE}
- **Analysis window:** Rolling 12 months ending the quarter before release
- **Geographic scope:** All seven UAE emirates, with breakouts by Dubai, Abu Dhabi (Abu Dhabi, Al Ain, Al Dhafra) and the Northern Emirates

${sections}
## ${subsections.length + 2}. What patients can do today

Actionable guidance for UAE residents: search, filter and book through the Zavis directory, compare networks by emirate, and download the full PDF + chart pack for citation.

## ${subsections.length + 3}. Methodology disclosure

Every Zavis Intelligence Report publishes its full sample, data source, analyst list and revision history. Press and researchers can request the raw dataset via press@zavis.ai under the Zavis Data Use Agreement.

---
_This report is a staged draft. Final copy, charts and an embargoed press kit will be released on the published release date._`;
}

// ─── 10 report concepts (from specialist research) ──────────────────────────
// Order matches the editorial calendar in docs/reports/2026-editorial-calendar.md.
// Each entry contains the outline the editorial team will flesh out.

const REPORTS = [
  {
    slug: "uae-healthcare-access-gap-2026",
    title: "The UAE Healthcare Access Gap, 2026 Edition",
    titleAr: "فجوة الوصول إلى الرعاية الصحية في الإمارات — إصدار 2026",
    subtitle:
      "How concentrated supply of UAE specialists creates structural access gaps across Dubai, Abu Dhabi and the Northern Emirates",
    subtitleAr: "كيف يخلق التركز الجغرافي لأطباء الاختصاص في الإمارات فجوات هيكلية في الوصول إلى الرعاية",
    headlineStat:
      "87% of Dubai dermatologists concentrated in 3 neighborhoods; Deira, Al Quoz, Muhaisnah have zero",
    headlineStatAr:
      "87٪ من أطباء الأمراض الجلدية في دبي يعملون في 3 أحياء فقط — ديرة والقوز ومحيصنة لا تضم أي طبيب",
    methodology:
      "Provider-level analysis of 12,519 DHA/DOH/MOHAP-licensed facilities, mapped to 226 Dubai communities (Dubai Pulse `dm_community-open`) and Abu Dhabi Open Data neighborhood polygons. Specialist counts use primary specialty from the regulator license, not self-declared services.",
    methodologyAr:
      "تحليل على مستوى مزودي الرعاية لـ 12,519 منشأة مرخصة من DHA وDOH وMOHAP، مع ربطها بـ 226 مجتمعاً في دبي (مجموعة بيانات `dm_community-open`) ومضلعات أحياء بيانات أبوظبي المفتوحة.",
    sampleSize: ZAVIS_SAMPLE_SIZE,
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-05-15",
    embargoDate: "2026-05-12",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "dubai-hotspots", title: "Dubai specialist concentration", anchor: "dubai" },
      { id: "abu-dhabi", title: "Abu Dhabi supply map", anchor: "abu-dhabi" },
      { id: "northern-emirates", title: "The Northern Emirates gap", anchor: "northern" },
      { id: "travel-times", title: "Travel-time access analysis", anchor: "travel" },
      { id: "what-next", title: "What patients can do today", anchor: "actions" },
    ],
    subsections: [
      { title: "Dubai specialist concentration", summary: "Dubai's 2,300+ dermatologists, cardiologists, endocrinologists and ophthalmologists mapped against the 226 Dubai communities." },
      { title: "Abu Dhabi supply map", summary: "Abu Dhabi's three regions (Abu Dhabi city, Al Ain, Al Dhafra) compared on per-capita specialist supply." },
      { title: "The Northern Emirates gap", summary: "Sharjah, Ajman, RAK, UAQ, Fujairah measured against Dubai and Abu Dhabi benchmarks." },
      { title: "Travel-time access analysis", summary: "Isochrone analysis showing how many UAE residents are within a 30-minute drive of a licensed specialist by specialty." },
    ],
  },
  {
    slug: "arabic-language-doctor-shortage",
    title: "The Arabic-Language Doctor Shortage in the UAE",
    titleAr: "نقص الأطباء الناطقين بالعربية في الإمارات",
    subtitle: "A language-access audit of DHA, DOH and MOHAP-licensed general practitioners",
    subtitleAr: "تدقيق في الوصول اللغوي لأطباء الرعاية الأولية المرخصين في الإمارات",
    headlineStat:
      "Only 18% of DHA-licensed GPs list Arabic as a spoken language despite 40% of UAE residents being Arabic-first speakers",
    headlineStatAr:
      "18٪ فقط من أطباء الرعاية الأولية المرخصين في دبي يدرجون العربية كلغة يتحدثونها، رغم أن 40٪ من سكان الإمارات يتحدثون العربية كلغة أولى",
    methodology:
      "Language parsing of the Zavis provider corpus (self-declared languages field) cross-referenced against DHA Sheryan name-based linguistic inference and provider website audits. Arabic-speaking professionals confirmed via at least two of three signals.",
    methodologyAr:
      "تحليل لغوي لقاعدة مزودي زافيس (حقل اللغات المُعلن) مع المراجعة المتبادلة مع تسجيل شريان الصحة DHA وتدقيق مواقع المزودين.",
    sampleSize: "8,414 licensed general practitioners across the UAE",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-06-10",
    embargoDate: "2026-06-07",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "emirate-breakdown", title: "Arabic-speaking GPs by emirate", anchor: "emirate" },
      { id: "specialty-breakdown", title: "Arabic-speaking specialists by discipline", anchor: "specialty" },
      { id: "demand-supply", title: "Demand vs supply mismatch", anchor: "demand" },
      { id: "what-next", title: "What Arabic-speaking patients can do today", anchor: "actions" },
    ],
    subsections: [
      { title: "Arabic-speaking GPs by emirate", summary: "Per-emirate counts and percentages of GPs who list Arabic as a working language." },
      { title: "Arabic-speaking specialists by discipline", summary: "Which specialties have the worst Arabic-language coverage, normalized by population." },
      { title: "Demand vs supply mismatch", summary: "Mapping Arabic-first resident population against Arabic-speaking provider supply at the community level." },
    ],
  },
  {
    slug: "thiqa-vs-daman-vs-axa-network-reality",
    title: "Thiqa vs Daman vs AXA Green Crescent: The Real Network Depth",
    titleAr: "ثقة مقابل ضمان مقابل أكسا الهلال الأخضر: حقيقة عمق الشبكة",
    subtitle: "A network audit of UAE's three largest insurance networks, measured in specialist depth and geographic reach",
    subtitleAr: "تدقيق لشبكات التأمين الثلاث الأكبر في الإمارات من حيث عمق الاختصاصات والانتشار الجغرافي",
    headlineStat:
      "Thiqa holders have access to 3.2x more specialists than basic Daman holders in Abu Dhabi",
    headlineStatAr: "يحصل حاملو ثقة على وصول لعدد أطباء الاختصاص يفوق بـ 3.2 أضعاف ما يحصل عليه حاملو ضمان الأساسي في أبوظبي",
    methodology:
      "Network audit of Zavis insurance acceptance data for Thiqa, Daman Enhanced, Daman Basic, ADNIC, Hayah and Sukoon, cross-referenced with each payer's public provider directory where available. Depth measured by unique licensed specialists per 10,000 policyholders at the neighborhood level.",
    methodologyAr:
      "تدقيق شبكات بيانات قبول التأمين في زافيس لشركات ثقة وضمان المعزز والأساسي وأدنيك وحياة وسكون.",
    sampleSize: "6 major payer networks across 12,519 UAE providers",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-07-05",
    embargoDate: "2026-07-02",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "network-depth", title: "Network depth by payer", anchor: "depth" },
      { id: "specialty-gaps", title: "Specialty coverage gaps", anchor: "gaps" },
      { id: "neighborhood", title: "Neighborhood-level access", anchor: "neighborhood" },
      { id: "what-next", title: "How to read your network card", anchor: "actions" },
    ],
    subsections: [
      { title: "Network depth by payer", summary: "Raw counts of contracted providers, broken down by regulator and emirate for the six largest payer networks." },
      { title: "Specialty coverage gaps", summary: "The specialty combinations where each network materially under-covers patients." },
      { title: "Neighborhood-level access", summary: "Which Dubai and Abu Dhabi neighborhoods have thin network coverage regardless of payer." },
    ],
  },
  {
    slug: "uae-dental-cash-price-transparency-index",
    title: "UAE Dental Cash Price Transparency Index",
    titleAr: "مؤشر شفافية الأسعار النقدية لعيادات الأسنان في الإمارات",
    subtitle: "A cash-price audit of the most common dental procedures across 240 UAE dental clinics",
    subtitleAr: "تدقيق أسعار الكاش لإجراءات الأسنان الأكثر شيوعاً في 240 عيادة أسنان في الإمارات",
    headlineStat:
      "Dubai root canal prices range from AED 450 to AED 4,800 — a 10x spread in the same 30km radius",
    headlineStatAr: "تتراوح أسعار علاج العصب في دبي بين 450 و 4,800 درهم — فارق عشرة أضعاف ضمن محيط 30 كم",
    methodology:
      "Cash-price audit of 240 dental clinics across Dubai, Sharjah and Abu Dhabi. Prices collected from clinic call scripts, official price sheets and public WhatsApp menus for five benchmark procedures: cleaning, root canal, crown, implant and Invisalign. Prices normalized to AED-exclusive VAT.",
    methodologyAr:
      "تدقيق أسعار نقدية لـ 240 عيادة أسنان في دبي والشارقة وأبوظبي. تم جمع الأسعار من سكربتات المكالمات وقوائم الأسعار الرسمية.",
    sampleSize: "240 dental clinics, 5 benchmark procedures, 1,200 price points",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-07-25",
    embargoDate: "2026-07-22",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "root-canal", title: "Root canal price spread", anchor: "root-canal" },
      { id: "crown-implant", title: "Crown and implant pricing", anchor: "crown" },
      { id: "aligners", title: "Clear aligners + orthodontics", anchor: "aligners" },
      { id: "what-next", title: "How to negotiate your dental bill", anchor: "actions" },
    ],
    subsections: [
      { title: "Root canal price spread", summary: "Distribution of root canal cash prices across Dubai, Sharjah and Abu Dhabi, with best and worst value clinics." },
      { title: "Crown and implant pricing", summary: "Price transparency scores for crown and implant packages." },
      { title: "Clear aligners + orthodontics", summary: "Invisalign and equivalent clear-aligner cash prices, broken down by clinic chain." },
    ],
  },
  {
    slug: "uae-expat-fertility-map",
    title: "The UAE Expat Fertility Map",
    titleAr: "خريطة خصوبة المقيمين في الإمارات",
    subtitle: "Per-capita IVF capacity, ART success rates and average cycle cost across all seven emirates",
    subtitleAr: "سعة أطفال الأنابيب لكل فرد ومعدلات نجاح تقنيات الإنجاب المساعد وتكلفة الدورة في الإمارات السبع",
    headlineStat:
      "Abu Dhabi has 14x more IVF capacity per capita than Sharjah; Ras Al Khaimah has none",
    headlineStatAr: "تمتلك أبوظبي سعة أطفال أنابيب تفوق الشارقة بـ 14 ضعفاً للفرد الواحد — ورأس الخيمة بلا أي وحدة",
    methodology:
      "ART capacity analysis of DHA, DOH and MOHAP-licensed fertility centres. Capacity measured by licensed embryologists per 100,000 women of reproductive age. Cycle cost derived from clinic price sheets and patient receipts.",
    methodologyAr:
      "تحليل سعة تقنيات الإنجاب المساعد لمراكز الخصوبة المرخصة. قياس السعة بأخصائيي الأجنة المرخصين لكل 100,000 امرأة في سن الإنجاب.",
    sampleSize: "41 licensed fertility centres across all seven emirates",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-08-15",
    embargoDate: "2026-08-12",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "capacity", title: "Capacity per emirate", anchor: "capacity" },
      { id: "cost", title: "Average cycle cost", anchor: "cost" },
      { id: "insurance", title: "Insurance coverage reality", anchor: "insurance" },
      { id: "what-next", title: "What patients should ask before booking", anchor: "actions" },
    ],
    subsections: [
      { title: "Capacity per emirate", summary: "Per-100,000 women of reproductive age, IVF capacity scored per emirate." },
      { title: "Average cycle cost", summary: "Distribution of single-cycle IVF prices from AED 18,000 to AED 45,000." },
      { title: "Insurance coverage reality", summary: "Which payers actually cover IVF in the UAE and at what lifetime cap." },
    ],
  },
  {
    slug: "uae-mental-health-wait-time-crisis",
    title: "The UAE Mental Health Wait Time Crisis",
    titleAr: "أزمة أوقات الانتظار في خدمات الصحة النفسية في الإمارات",
    subtitle: "The first rigorous measure of UAE wait times to see a licensed psychiatrist, by city and language",
    subtitleAr: "أول قياس دقيق لأوقات الانتظار لزيارة طبيب نفسي مرخص في الإمارات، مفصّلاً حسب المدينة واللغة",
    headlineStat:
      "Average wait for a licensed psychiatrist in Dubai: 23 days. For Arabic-speaking psychiatrists: 61 days",
    headlineStatAr: "متوسط الانتظار لزيارة طبيب نفسي مرخص في دبي هو 23 يوماً — ويقفز إلى 61 يوماً لطبيب نفسي ناطق بالعربية",
    methodology:
      "Wait-time audit via mystery-caller protocol on 147 DHA, DOH and MOHAP-licensed psychiatry clinics. Three independent callers per clinic, in English and Arabic, requesting the next available new-patient appointment.",
    methodologyAr:
      "تدقيق أوقات الانتظار عبر بروتوكول اتصال سري لـ 147 عيادة طب نفسي مرخصة. ثلاثة متصلين لكل عيادة باللغتين الإنجليزية والعربية.",
    sampleSize: "147 licensed psychiatry clinics, 441 call scripts, 94 successful bookings",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-09-10",
    embargoDate: "2026-09-07",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "wait-times", title: "Wait times by emirate", anchor: "wait" },
      { id: "language", title: "Arabic vs English language penalty", anchor: "language" },
      { id: "insurance", title: "Insurance vs cash wait-time gap", anchor: "insurance" },
      { id: "what-next", title: "What to do if you need help this week", anchor: "actions" },
    ],
    subsections: [
      { title: "Wait times by emirate", summary: "Median, p25 and p90 wait times by emirate and facility type." },
      { title: "Arabic vs English language penalty", summary: "How much longer Arabic-speaking patients wait for a language-concordant psychiatrist." },
      { title: "Insurance vs cash wait-time gap", summary: "The difference between wait times on insurance networks vs direct cash bookings." },
    ],
  },
  {
    slug: "uae-ob-gyn-gender-gap",
    title: "The UAE OB-GYN Gender Gap",
    titleAr: "الفجوة بين الجنسين في أطباء النساء والتوليد في الإمارات",
    subtitle: "The first comprehensive measure of female vs male OB-GYN supply across all seven emirates, matched to stated patient preference",
    subtitleAr: "أول قياس شامل للعرض من طبيبات وأطباء النساء والتوليد في الإمارات، مقارنة بتفضيلات المرضى",
    headlineStat: "Only 34% of UAE OB-GYNs are female despite 71% of patients preferring one",
    headlineStatAr: "34٪ فقط من أطباء النساء والتوليد في الإمارات نساء، رغم أن 71٪ من المريضات يفضلن طبيبة",
    methodology:
      "Gender analysis of 1,856 DHA/DOH/MOHAP-licensed OB-GYNs using regulator name fields and Zavis provider verification. Patient preference sourced from a Zavis-commissioned 1,200-respondent survey across the seven emirates.",
    methodologyAr:
      "تحليل جنس 1,856 طبيباً في اختصاص النساء والتوليد مرخصاً، بناءً على سجلات الجهات التنظيمية. تفضيلات المريضات من استطلاع زافيس لـ 1,200 مشاركة.",
    sampleSize: "1,856 licensed OB-GYNs + 1,200 survey respondents",
    dataSource: `${ZAVIS_DATA_SOURCE}; Zavis patient preference survey (n=1,200)`,
    releaseDate: "2026-10-01",
    embargoDate: "2026-09-28",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "gender-supply", title: "Female OB-GYN supply by emirate", anchor: "supply" },
      { id: "patient-preference", title: "Patient preference data", anchor: "preference" },
      { id: "hospitals", title: "Which hospitals have the best gender parity", anchor: "hospitals" },
      { id: "what-next", title: "How to find a female OB-GYN near you", anchor: "actions" },
    ],
    subsections: [
      { title: "Female OB-GYN supply by emirate", summary: "Per-emirate percentage of female OB-GYNs and the absolute count of female specialists." },
      { title: "Patient preference data", summary: "Breakdown of patient preference by age cohort, nationality and parity." },
      { title: "Which hospitals have the best gender parity", summary: "Facility-level analysis of the largest maternity hospitals." },
    ],
  },
  {
    slug: "uae-vs-turkey-vs-thailand-medical-tourism",
    title: "UAE vs Turkey vs Thailand: The 2026 Medical Tourism Value Matrix",
    titleAr: "الإمارات مقابل تركيا وتايلاند: مصفوفة القيمة للسياحة العلاجية 2026",
    subtitle:
      "Comparing hair transplant, dental implant, and plastic surgery prices, quality, and wait times across the UAE, Istanbul, and Bangkok",
    subtitleAr: "مقارنة أسعار وجودة ومدد الانتظار لزراعة الشعر وزراعة الأسنان وجراحة التجميل في الإمارات واسطنبول وبانكوك",
    headlineStat:
      "Dubai's average hair transplant is AED 12,400 vs Istanbul's AED 8,200 — but UAE wait times are 6x shorter",
    headlineStatAr: "متوسط زراعة الشعر في دبي 12,400 درهم مقابل 8,200 درهم في اسطنبول — لكن أوقات الانتظار في الإمارات أقل بست مرات",
    methodology:
      "Cross-country price audit of 12 benchmark procedures (hair transplant, dental implant, rhinoplasty, veneers, etc.) across 30 UAE clinics, 45 Istanbul clinics and 40 Bangkok clinics. Prices normalized to AED including tax and accommodation where bundled.",
    methodologyAr:
      "تدقيق أسعار عبر الدول لـ 12 إجراءً معيارياً، تشمل 30 عيادة في الإمارات و45 في اسطنبول و40 في بانكوك.",
    sampleSize: "115 clinics across 3 countries, 12 benchmark procedures",
    dataSource: `${ZAVIS_DATA_SOURCE}; clinic price sheets and patient receipts collected via on-the-ground research partners`,
    releaseDate: "2026-10-30",
    embargoDate: "2026-10-27",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "price-matrix", title: "Price matrix by procedure", anchor: "price" },
      { id: "quality", title: "Quality, accreditation and revision rates", anchor: "quality" },
      { id: "logistics", title: "Logistics, visa and recovery", anchor: "logistics" },
      { id: "what-next", title: "Should you travel for this procedure?", anchor: "actions" },
    ],
    subsections: [
      { title: "Price matrix by procedure", summary: "Cash prices for the 12 benchmark procedures with country-level quartiles." },
      { title: "Quality, accreditation and revision rates", summary: "JCI accreditation, revision surgery rates and complication reporting." },
      { title: "Logistics, visa and recovery", summary: "All-in costs including flights, recovery accommodation and follow-up care." },
    ],
  },
  {
    slug: "uae-pediatric-specialty-desert",
    title: "The UAE Pediatric Specialty Desert",
    titleAr: "صحراء اختصاصات طب الأطفال في الإمارات",
    subtitle: "Where in the UAE a child cannot see a pediatric subspecialist without a long drive or a wait list",
    subtitleAr: "أين في الإمارات لا يستطيع الطفل رؤية اختصاصي أطفال دون قيادة طويلة أو قائمة انتظار",
    headlineStat:
      "7 Northern Emirates municipalities have zero pediatric cardiologists; nearest is 180km away",
    headlineStatAr: "7 بلديات في الإمارات الشمالية لا تضم أي طبيب أطفال قلب — وأقرب اختصاصي يبعد 180 كم",
    methodology:
      "Pediatric subspecialty mapping of 12 subspecialties (cardiology, pulmonology, neurology, endocrinology, GI, nephrology, hematology-oncology, rheumatology, genetics, dermatology, orthopedics, surgery) against 41 UAE municipalities. Nearest-facility distance computed via Dubai Pulse + OSM road graph.",
    methodologyAr:
      "رسم خرائط 12 اختصاصاً فرعياً في طب الأطفال مقابل 41 بلدية في الإمارات، مع حساب أقرب منشأة عبر الرسم البياني للطرق.",
    sampleSize: "12 pediatric subspecialties × 41 municipalities = 492 coverage cells",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2026-11-20",
    embargoDate: "2026-11-17",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "desert-map", title: "The pediatric desert map", anchor: "desert" },
      { id: "distance", title: "Average distance to nearest subspecialist", anchor: "distance" },
      { id: "telehealth", title: "Where telehealth is filling the gap", anchor: "telehealth" },
      { id: "what-next", title: "What parents can do today", anchor: "actions" },
    ],
    subsections: [
      { title: "The pediatric desert map", summary: "Which of the UAE's 41 municipalities have zero pediatric subspecialists by type." },
      { title: "Average distance to nearest subspecialist", summary: "Drive-time isochrones for the 12 pediatric subspecialties." },
      { title: "Where telehealth is filling the gap", summary: "Which subspecialties are seeing telehealth uptake by Northern Emirates families." },
    ],
  },
  {
    slug: "ramadan-healthcare-booking-report",
    title: "The Ramadan Healthcare Booking Report",
    titleAr: "تقرير الحجوزات الصحية في رمضان",
    subtitle: "How UAE patients reshape their healthcare calendar around Ramadan — and what clinics can learn from it",
    subtitleAr: "كيف يعيد المرضى في الإمارات تشكيل جدولهم الصحي حول رمضان، وما الذي يمكن أن تتعلمه العيادات",
    headlineStat:
      "Endocrinology bookings spike 340% in the two weeks before Ramadan; after-iftar slots book 4x faster than morning slots",
    headlineStatAr: "ترتفع حجوزات الغدد الصماء 340٪ في الأسبوعين السابقين لرمضان، وتُحجز مواعيد ما بعد الإفطار أسرع بأربع مرات من المواعيد الصباحية",
    methodology:
      "Year-on-year booking pattern analysis for 12,519 UAE providers across Ramadan 1446/1447/1448 windows. Seasonality indexed against January baseline, controlled for school holidays and national holidays.",
    methodologyAr:
      "تحليل أنماط الحجوزات على أساس سنوي لـ 12,519 مزود رعاية في الإمارات خلال رمضان 1446 و 1447 و 1448.",
    sampleSize: "12,519 providers, 3 Ramadan windows, 1.8m booking events",
    dataSource: ZAVIS_DATA_SOURCE,
    releaseDate: "2027-01-15",
    embargoDate: "2027-01-12",
    sections: [
      { id: "methodology", title: "Methodology & sample", anchor: "methodology" },
      { id: "spikes", title: "Pre-Ramadan specialty spikes", anchor: "spikes" },
      { id: "time-of-day", title: "Time-of-day booking shift", anchor: "time" },
      { id: "noshow", title: "Ramadan no-show rates", anchor: "noshow" },
      { id: "what-next", title: "What clinics should do differently", anchor: "actions" },
    ],
    subsections: [
      { title: "Pre-Ramadan specialty spikes", summary: "Which specialties see the biggest booking surges in the two weeks before Ramadan." },
      { title: "Time-of-day booking shift", summary: "Hour-by-hour booking analysis showing the shift to after-iftar slots." },
      { title: "Ramadan no-show rates", summary: "How no-show rates change during Ramadan and which clinic types are most affected." },
    ],
  },
];

// ─── DB plumbing ────────────────────────────────────────────────────────────
async function upsertReport(client, report) {
  const body = placeholderBody({
    title: report.title,
    headlineStat: report.headlineStat,
    sampleSize: report.sampleSize,
    methodology: report.methodology,
    subsections: report.subsections,
  });
  const sections = report.sections.map((s, i) => ({
    id: s.id,
    title: s.title,
    anchor: s.anchor,
    summary: report.subsections[i]?.summary || "",
  }));

  const res = await client.query(
    `INSERT INTO reports (
       slug, title, title_ar, subtitle, subtitle_ar,
       headline_stat, headline_stat_ar, release_date, embargo_date,
       methodology, methodology_ar, data_source, sample_size,
       body_md, sections, status, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,
       $6,$7,$8,$9,
       $10,$11,$12,$13,
       $14,$15,$16,NOW()
     )
     ON CONFLICT (slug) DO UPDATE SET
       title            = EXCLUDED.title,
       title_ar         = EXCLUDED.title_ar,
       subtitle         = EXCLUDED.subtitle,
       subtitle_ar      = EXCLUDED.subtitle_ar,
       headline_stat    = EXCLUDED.headline_stat,
       headline_stat_ar = EXCLUDED.headline_stat_ar,
       release_date     = EXCLUDED.release_date,
       embargo_date     = EXCLUDED.embargo_date,
       methodology      = EXCLUDED.methodology,
       methodology_ar   = EXCLUDED.methodology_ar,
       data_source      = EXCLUDED.data_source,
       sample_size      = EXCLUDED.sample_size,
       body_md          = EXCLUDED.body_md,
       sections         = EXCLUDED.sections,
       -- Keep status sticky — don't regress a published row back to draft
       status           = COALESCE(reports.status, EXCLUDED.status),
       updated_at       = NOW()
     RETURNING id`,
    [
      report.slug,
      report.title,
      report.titleAr,
      report.subtitle,
      report.subtitleAr,
      report.headlineStat,
      report.headlineStatAr,
      report.releaseDate,
      report.embargoDate,
      report.methodology,
      report.methodologyAr,
      report.dataSource,
      report.sampleSize,
      body,
      JSON.stringify(sections),
      "draft",
    ],
  );
  return res.rows[0].id;
}

async function upsertAuthor(client, reportId, slug, role, order) {
  await client.query(
    `INSERT INTO report_authors (report_id, author_slug, role, sort_order)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (report_id, author_slug) DO UPDATE SET
       role       = EXCLUDED.role,
       sort_order = EXCLUDED.sort_order`,
    [reportId, slug, role, order],
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set. Aborting.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const report of REPORTS) {
      const id = await upsertReport(client, report);
      // Zavis intelligence team as default author stub — Item 5 replaces
      // these with real author slugs once the `authors` table ships.
      await upsertAuthor(client, id, "zavis-intelligence-team", "author", 0);
      await upsertAuthor(client, id, "zavis-data-science", "data", 1);
      console.log(`  upsert ${report.slug}`);
    }
    await client.query("COMMIT");
    console.log(`\nSeeded ${REPORTS.length} reports (all status=draft).`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
