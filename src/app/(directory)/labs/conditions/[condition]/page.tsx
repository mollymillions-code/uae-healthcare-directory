import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  AlertTriangle,
  Activity,
  ArrowRight,
  Calculator,
} from "lucide-react";
import {
  LAB_PROFILES,
  LAB_TESTS,
  LAB_TEST_PRICES,
  getLabTest,
  getPriceRange,
  formatPrice,
  getPricesForLab,
} from "@/lib/labs";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Condition Data ──────────────────────────────────────────────────────────

interface LabCondition {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  overview: string;
  testSlugs: string[];
  riskFactors: string[];
  symptoms: string[];
  uaeContext: string;
  faqs: { question: string; answer: string }[];
}

const LAB_CONDITIONS: Record<string, LabCondition> = {
  pcos: {
    slug: "pcos",
    title: "PCOS Blood Tests in the UAE — Which Tests You Need & Cost",
    h1: "PCOS Blood Tests in the UAE: Which Tests to Order, Where, and How Much",
    metaDescription:
      "Complete guide to PCOS blood tests in the UAE. Testosterone, insulin, AMH, FSH, thyroid panel, and more. Compare prices across 11 labs. PCOS affects 10-15% of UAE women. Updated March 2026.",
    overview:
      "Polycystic Ovary Syndrome (PCOS) is one of the most common hormonal disorders in women of reproductive age, affecting an estimated 10-15% of women in the UAE. Diagnosis requires blood tests to check androgen levels, insulin resistance, ovarian reserve, and thyroid function — since many PCOS symptoms overlap with thyroid disorders. A thorough PCOS workup typically involves 5-9 blood tests that together paint a clear picture of your hormonal and metabolic health.",
    testSlugs: [
      "testosterone",
      "insulin-fasting",
      "fasting-glucose",
      "hba1c",
      "amh",
      "fsh",
      "estradiol",
      "thyroid-panel",
      "lipid-profile",
    ],
    riskFactors: [
      "Family history of PCOS",
      "Insulin resistance or type 2 diabetes",
      "Obesity or weight gain around the midsection",
      "Sedentary lifestyle",
      "South Asian or Middle Eastern ethnicity",
      "Early onset of puberty",
    ],
    symptoms: [
      "Irregular or absent periods",
      "Excess facial or body hair (hirsutism)",
      "Acne that persists beyond teenage years",
      "Thinning hair on the scalp",
      "Weight gain difficult to reverse",
      "Difficulty getting pregnant",
      "Darkened skin patches (acanthosis nigricans)",
      "Mood changes and fatigue",
    ],
    uaeContext:
      "The UAE has one of the highest PCOS prevalence rates in the world, estimated at 10-15% of reproductive-age women. This is closely linked to the high rates of insulin resistance and metabolic syndrome in the region — the same factors driving the UAE's 17% diabetes prevalence. South Asian women, who make up a significant portion of the UAE's female population, have a particularly elevated risk. Cultural factors including high-carbohydrate diets and limited physical activity during the extreme summer months contribute to the metabolic component of PCOS. All major UAE labs offer the individual tests needed for a PCOS workup without a doctor's referral, and several (including Medsol and Al Borg) bundle them into women's health panels that cover most of the required markers. IVF clinics in Dubai and Abu Dhabi routinely test AMH and hormonal panels as part of fertility evaluations for women with PCOS.",
    faqs: [
      {
        question: "How much does a full PCOS blood test panel cost in the UAE?",
        answer:
          "A comprehensive PCOS panel (testosterone, insulin, glucose, HbA1c, AMH, FSH, estradiol, thyroid panel, lipid profile) costs approximately AED 800-1,500 if ordered as individual tests, depending on the lab. Medsol's Women's Health Panel at AED 399 covers many of these markers. Adding AMH and insulin separately costs AED 150-400 more.",
      },
      {
        question: "Do I need a doctor's referral for PCOS blood tests in the UAE?",
        answer:
          "No. All standard PCOS blood tests — testosterone, insulin, AMH, FSH, thyroid panel, and metabolic markers — can be self-requested at standalone labs like Al Borg, Medsol, Thumbay, and Alpha Medical without a doctor's referral. However, interpreting results and making a formal PCOS diagnosis requires a doctor who will combine blood work with a pelvic ultrasound.",
      },
      {
        question: "When should PCOS blood tests be taken during the menstrual cycle?",
        answer:
          "FSH and estradiol should ideally be measured on Day 2-4 of your menstrual cycle for the most accurate assessment of ovarian function. Testosterone, insulin, and glucose can be measured on any day but require fasting (8-12 hours). AMH and thyroid tests can be taken at any time without cycle-day timing.",
      },
      {
        question: "Which is the best lab for PCOS testing in the UAE?",
        answer:
          "Medsol Diagnostics offers the most affordable individual test pricing and a women's health panel (AED 399) covering most PCOS markers. Al Borg Diagnostics has the widest branch network (17 locations) for convenience. For home collection, DarDoc and Healthchecks360 can draw all PCOS panel tests at your home in Dubai, Abu Dhabi, and Sharjah.",
      },
    ],
  },

  diabetes: {
    slug: "diabetes",
    title: "Diabetes Blood Tests in the UAE — Screening, Monitoring & Cost",
    h1: "Diabetes Blood Tests in the UAE: Screening, Monitoring, and Price Comparison",
    metaDescription:
      "Compare diabetes blood test prices across UAE labs. HbA1c, fasting glucose, insulin, kidney function, lipid profile. UAE has 17.3% diabetes prevalence with 1M+ undiagnosed. Updated March 2026.",
    overview:
      "Diabetes is the most significant public health challenge in the UAE, affecting approximately 17.3% of the adult population — nearly 1 in 5 adults. An estimated 1 million additional residents have diabetes but remain undiagnosed. Blood tests are the only reliable way to screen for diabetes, confirm a diagnosis, and monitor long-term blood sugar control. Whether you are screening for the first time or managing an existing diagnosis, knowing which tests to get and how often is essential.",
    testSlugs: [
      "fasting-glucose",
      "hba1c",
      "insulin-fasting",
      "kft",
      "lipid-profile",
      "urinalysis",
    ],
    riskFactors: [
      "Overweight or obese (BMI above 25)",
      "Family history of type 2 diabetes",
      "Age over 35",
      "South Asian, Middle Eastern, or African ethnicity",
      "Sedentary lifestyle",
      "History of gestational diabetes",
      "PCOS in women",
      "High blood pressure",
    ],
    symptoms: [
      "Excessive thirst (polydipsia)",
      "Frequent urination, especially at night",
      "Unexplained fatigue",
      "Blurred vision",
      "Slow-healing cuts and wounds",
      "Tingling or numbness in hands and feet",
      "Unexplained weight loss",
      "Recurring infections",
    ],
    uaeContext:
      "The UAE has one of the highest diabetes prevalence rates in the world at 17.3%, according to the International Diabetes Federation. Up to 25% of adults have pre-diabetes, meaning nearly half of UAE residents have some degree of glucose dysregulation. The high rates are driven by rapid urbanisation, sedentary office-based lifestyles, high-calorie diets, and genetic predisposition in South Asian and Arab populations. The DHA's Dubai Diabetes Programme and Abu Dhabi's Weqaya screening programme both include fasting glucose and HbA1c in their population-level screening efforts. Diabetes testing is covered under the UAE mandatory health insurance framework, and most corporate wellness programmes include HbA1c in their annual check-ups. Kidney function testing (KFT) is critical for UAE diabetics because diabetic nephropathy is the leading cause of kidney failure in the UAE, with over 1,200 new dialysis patients annually.",
    faqs: [
      {
        question: "How much does a diabetes blood test cost in the UAE?",
        answer:
          "A basic diabetes screening (fasting glucose + HbA1c) costs AED 80-200. A comprehensive diabetes panel including insulin, kidney function, lipid profile, and urinalysis costs AED 350-700. Corporate health plans and the UAE Essential Benefits Plan typically cover diabetes screening at no out-of-pocket cost.",
      },
      {
        question: "How often should I get tested for diabetes in the UAE?",
        answer:
          "Adults over 35 with no risk factors should screen every 3 years. Those with risk factors (family history, overweight, PCOS, South Asian ethnicity) should test annually from age 25. Diagnosed diabetics should check HbA1c every 3-6 months and kidney function annually.",
      },
      {
        question: "Do I need to fast before a diabetes blood test?",
        answer:
          "Fasting glucose requires 8-12 hours of fasting. HbA1c does not require fasting and can be taken at any time. Fasting insulin and lipid profile both require fasting. If you are getting a full diabetes panel, schedule a morning appointment and fast overnight.",
      },
      {
        question: "What HbA1c level indicates diabetes?",
        answer:
          "An HbA1c below 5.7% is normal. Between 5.7% and 6.4% indicates pre-diabetes. At 6.5% or above, diabetes is diagnosed. For people already managing diabetes, UAE endocrinologists generally target HbA1c below 7.0%, though targets may be less strict (7.5-8.0%) for elderly patients to avoid hypoglycaemia risk.",
      },
    ],
  },

  anemia: {
    slug: "anemia",
    title: "Anemia Blood Tests in the UAE — CBC, Iron Studies & Cost",
    h1: "Anemia Blood Tests in the UAE: Which Tests You Need and What They Cost",
    metaDescription:
      "Compare anemia blood test prices in the UAE. CBC, iron studies, Vitamin B12, folate testing across 11 labs. Thalassemia carrier rates 5-8% in UAE. Iron deficiency common in women. Updated March 2026.",
    overview:
      "Anemia — a condition where your blood does not carry enough oxygen due to low red blood cells or hemoglobin — is one of the most common nutritional deficiencies in the UAE. A simple Complete Blood Count (CBC) can detect anemia, but understanding the cause requires additional tests like iron studies, Vitamin B12, and folate. This is especially important in the UAE where both iron deficiency and thalassemia trait are widespread, and they require very different treatments.",
    testSlugs: ["cbc", "iron-studies", "vitamin-b12", "folate"],
    riskFactors: [
      "Heavy menstrual periods",
      "Vegetarian or vegan diet",
      "Pregnancy",
      "Thalassemia carrier status (5-8% of UAE population)",
      "South Asian, Middle Eastern, or Mediterranean ancestry",
      "Chronic disease (kidney disease, inflammatory conditions)",
      "Recent surgery or blood loss",
      "Frequent blood donation",
    ],
    symptoms: [
      "Persistent fatigue and weakness",
      "Pale skin, lips, or nail beds",
      "Shortness of breath during normal activities",
      "Dizziness or lightheadedness",
      "Cold hands and feet",
      "Headaches",
      "Brittle nails",
      "Unusual cravings for ice or non-food items (pica)",
    ],
    uaeContext:
      "Iron deficiency anemia is the most common nutritional deficiency in the UAE, particularly among South Asian and Filipino women of reproductive age, with studies from DHA-affiliated hospitals reporting iron deficiency in 15-30% of pregnant women in Dubai. Thalassemia is an additional significant concern — the UAE has thalassemia carrier rates of 5-8% in the general population, and higher in Emirati nationals and South Asian communities. A CBC alone cannot distinguish between iron deficiency anemia and thalassemia trait; iron studies are essential for the correct diagnosis. This distinction matters because giving iron supplements to a person with thalassemia trait but normal iron stores is unnecessary and potentially harmful. The UAE's mandatory pre-marital screening programme includes hemoglobin electrophoresis specifically to identify thalassemia carriers before marriage. Vitamin B12 deficiency is also common among the UAE's large vegetarian South Asian population.",
    faqs: [
      {
        question: "How much does an anemia blood test cost in the UAE?",
        answer:
          "A CBC costs AED 69-120. Adding iron studies (ferritin, serum iron, TIBC) costs AED 140-220. Vitamin B12 costs AED 80-130 and folate AED 75-120. A complete anemia workup (all four tests) typically costs AED 350-550 across UAE labs.",
      },
      {
        question: "Can a CBC alone diagnose the cause of anemia?",
        answer:
          "No. A CBC detects anemia and classifies it by cell size (microcytic, normocytic, macrocytic), but cannot determine the cause. Iron studies are needed to confirm iron deficiency, Vitamin B12 and folate for megaloblastic anemia, and hemoglobin electrophoresis for thalassemia. Always request at least CBC plus iron studies for a meaningful anemia workup.",
      },
      {
        question: "Is thalassemia screening available at UAE labs?",
        answer:
          "Yes. Hemoglobin electrophoresis — the test that identifies thalassemia carriers — is available at Al Borg, Thumbay, Medsol, and most UAE labs for AED 100-180. It is included in the mandatory pre-marital screening panel and is also available as a standalone test without a referral.",
      },
      {
        question: "Who should get tested for anemia in the UAE?",
        answer:
          "Women with heavy periods, pregnant women, vegetarians and vegans, people of South Asian or Middle Eastern descent (due to thalassemia risk), anyone with persistent fatigue, and children with poor growth should be tested. The UAE's high Vitamin D deficiency rates can also mask or compound anemia symptoms.",
      },
    ],
  },

  "thyroid-disorders": {
    slug: "thyroid-disorders",
    title: "Thyroid Blood Tests in the UAE — TSH, T3, T4 & Cost",
    h1: "Thyroid Blood Tests in the UAE: TSH, Thyroid Panel, Where to Test & Cost",
    metaDescription:
      "Compare thyroid blood test prices in UAE labs. TSH from AED 30-70, full thyroid panel AED 130-220. Subclinical hypothyroidism common in women over 30 in the UAE. Updated March 2026.",
    overview:
      "Thyroid disorders are among the most common endocrine conditions in the UAE, yet frequently go undiagnosed because symptoms like fatigue, weight gain, and hair loss overlap with many other conditions. A simple TSH blood test is the most sensitive first-line screen, catching thyroid problems before they become severe. Women over 30 are at significantly higher risk — thyroid disease is 5-8 times more common in women than in men.",
    testSlugs: ["tsh", "thyroid-panel"],
    riskFactors: [
      "Female sex (5-8x higher risk than males)",
      "Age over 30",
      "Family history of thyroid disease",
      "South Asian ancestry (higher autoimmune thyroid risk)",
      "Previous thyroid surgery or radiation",
      "Type 1 diabetes or other autoimmune conditions",
      "Pregnancy or postpartum period",
      "Iodine deficiency or excess",
    ],
    symptoms: [
      "Unexplained weight gain or difficulty losing weight",
      "Persistent fatigue despite adequate sleep",
      "Hair loss or thinning",
      "Feeling cold when others are comfortable",
      "Constipation",
      "Irregular or heavy menstrual periods",
      "Depression or brain fog",
      "Dry skin and brittle nails",
    ],
    uaeContext:
      "Subclinical hypothyroidism — a mild form where TSH is elevated but thyroid hormone levels are still normal — is particularly common in UAE women over 30, mirroring global trends but amplified by the large South Asian population which has higher genetic predisposition to autoimmune thyroid disease (Hashimoto's thyroiditis). Many women in the UAE attribute thyroid symptoms (fatigue, weight gain, hair loss) to the demanding lifestyle or hot climate, leading to delayed diagnosis. UAE endocrinologists follow American Thyroid Association guidelines for treatment decisions. TSH testing is one of the most affordable screening tests available in the UAE at AED 30-70, making it a high-value test to add to any annual check-up. Several UAE labs offer thyroid antibody testing (anti-TPO, anti-thyroglobulin) as an add-on to the standard panel, which helps distinguish autoimmune from non-autoimmune thyroid dysfunction.",
    faqs: [
      {
        question: "How much does a thyroid test cost in the UAE?",
        answer:
          "A standalone TSH test costs AED 30-70 across UAE labs, making it one of the cheapest and most high-value screening tests available. A full thyroid panel (TSH, Free T3, Free T4) costs AED 130-220. Adding thyroid antibodies (anti-TPO, anti-TG) for autoimmune testing adds AED 100-180.",
      },
      {
        question: "Should I get TSH alone or the full thyroid panel?",
        answer:
          "TSH alone is sufficient as a first-line screening test for most people. If TSH is abnormal (high or low), your doctor will order Free T4 and Free T3 to determine the severity and type of thyroid dysfunction. If you prefer to get the full picture in one visit, request the full thyroid panel upfront.",
      },
      {
        question: "Do thyroid tests require fasting?",
        answer:
          "No, thyroid tests (TSH, Free T3, Free T4) do not require fasting and can be drawn at any time of day. However, TSH levels follow a circadian rhythm and are highest in early morning, so morning testing may detect mild elevations that would be missed later in the day.",
      },
      {
        question: "How often should women get thyroid tests in the UAE?",
        answer:
          "Women over 30 should consider annual TSH screening, especially if they have risk factors (family history, autoimmune conditions, South Asian ancestry). Pregnant women should have TSH checked in the first trimester. Women on thyroid medication (levothyroxine) should check TSH every 6-12 months once stable.",
      },
    ],
  },

  "heart-disease": {
    slug: "heart-disease",
    title: "Heart Disease Blood Tests in the UAE — Cardiac Markers & Cost",
    h1: "Heart Disease Blood Tests in the UAE: Cardiac Screening, Risk Markers & Cost",
    metaDescription:
      "Compare heart disease blood test prices in UAE labs. Lipid profile, CRP, troponin, BNP, HbA1c screening. Cardiovascular disease is the leading cause of death in the UAE. Updated March 2026.",
    overview:
      "Cardiovascular disease is the number one killer in the UAE, responsible for more deaths than any other cause. The good news is that most heart disease risk factors — high cholesterol, diabetes, and inflammation — can be detected through blood tests years before a heart attack or stroke occurs. A combination of lipid profile, inflammatory markers, and metabolic screening provides a comprehensive picture of your heart health.",
    testSlugs: [
      "lipid-profile",
      "crp",
      "troponin",
      "bnp",
      "hba1c",
      "fasting-glucose",
    ],
    riskFactors: [
      "High cholesterol or triglycerides",
      "High blood pressure",
      "Diabetes or pre-diabetes",
      "Smoking or former smoking",
      "Obesity (BMI above 30)",
      "Family history of early heart disease",
      "Sedentary lifestyle",
      "Stress and poor sleep",
      "Male sex over 45 or female sex over 55",
    ],
    symptoms: [
      "Chest pain or discomfort during exertion",
      "Shortness of breath",
      "Fatigue with mild physical activity",
      "Swelling in legs or ankles",
      "Irregular heartbeat or palpitations",
      "Dizziness or lightheadedness",
      "Pain in jaw, neck, or upper back",
      "Excessive sweating without exertion",
    ],
    uaeContext:
      "Cardiovascular disease is the leading cause of death in the UAE, accounting for approximately 30% of all deaths. Dyslipidemia (abnormal cholesterol) affects 35-40% of UAE adults, driven by high-fat diets, rapid urbanisation, physical inactivity, and extreme summer heat that discourages outdoor exercise. The UAE's mandatory health insurance framework covers lipid testing for insured employees, and statins are among the most dispensed medications in UAE pharmacies. Abu Dhabi's Weqaya cardiovascular screening programme includes lipid profile and fasting glucose for all UAE nationals and long-term residents over 30. High-sensitivity CRP (hs-CRP) is increasingly used by UAE cardiologists for risk stratification beyond standard lipid measurements. Troponin and BNP are hospital-grade cardiac markers primarily used in emergency settings, but are also available at standalone labs for proactive screening in high-risk individuals.",
    faqs: [
      {
        question: "Which blood tests check for heart disease risk?",
        answer:
          "The core cardiac screening panel includes a lipid profile (total cholesterol, LDL, HDL, triglycerides), HbA1c (diabetes check), fasting glucose, and hs-CRP (inflammation marker). For people with symptoms or high risk, BNP (heart strain marker) and troponin (heart muscle damage) provide additional information. This panel costs AED 400-900 across UAE labs.",
      },
      {
        question: "How often should I get a cardiac blood test in the UAE?",
        answer:
          "Adults over 35 with no risk factors should get a lipid profile every 5 years. With risk factors (family history, smoking, diabetes, high blood pressure), annual screening is recommended. People already on statins or cardiac medication should check lipid profile and LFT every 6-12 months.",
      },
      {
        question: "Does a lipid profile require fasting?",
        answer:
          "Yes. A lipid profile requires 9-12 hours of fasting because recent food intake significantly elevates triglyceride levels and can affect calculated LDL values. Schedule your test for early morning (7-9 AM) so you can fast overnight. You may drink water during the fasting period.",
      },
      {
        question: "What is hs-CRP and why is it important for heart health?",
        answer:
          "High-sensitivity CRP measures low-level inflammation in the body. CRP above 3 mg/L significantly increases cardiovascular risk prediction beyond what a lipid profile alone can provide. It is especially valuable for people whose cholesterol is borderline, helping doctors decide whether statin therapy is warranted. Available at most UAE labs for AED 50-90.",
      },
    ],
  },

  "liver-disease": {
    slug: "liver-disease",
    title: "Liver Function Blood Tests in the UAE — LFT & Hepatitis Screening",
    h1: "Liver Blood Tests in the UAE: LFT, Hepatitis Screening & Price Comparison",
    metaDescription:
      "Compare liver function test (LFT) and hepatitis B prices in UAE labs. NAFLD affects 30-40% of UAE adults. LFT from AED 80-160. Hepatitis B screening for expats. Updated March 2026.",
    overview:
      "Your liver works silently — most people with liver damage feel no symptoms until the disease is advanced. Liver Function Tests (LFTs) measure enzymes and proteins that reveal damage, inflammation, or reduced liver function. In the UAE, non-alcoholic fatty liver disease (NAFLD) is alarmingly common, affecting 30-40% of adults, largely driven by obesity and diabetes. Hepatitis B screening is also important for adult expats who may not have been vaccinated as children.",
    testSlugs: ["lft", "hepatitis-b"],
    riskFactors: [
      "Obesity or overweight",
      "Type 2 diabetes or insulin resistance",
      "High alcohol consumption",
      "Hepatitis B or C carrier status",
      "Long-term use of hepatotoxic medications (statins, paracetamol, antifungals)",
      "Family history of liver disease",
      "Metabolic syndrome",
      "Recent travel to hepatitis-endemic regions",
    ],
    symptoms: [
      "Fatigue and general weakness",
      "Yellowing of skin or eyes (jaundice)",
      "Dark-colored urine",
      "Abdominal pain in the upper right area",
      "Nausea or loss of appetite",
      "Swelling in the legs or abdomen",
      "Easy bruising or bleeding",
      "Itchy skin",
    ],
    uaeContext:
      "Non-alcoholic fatty liver disease (NAFLD) is one of the most prevalent liver conditions in the UAE, with studies estimating it affects 25-40% of the adult population. This is directly linked to the UAE's high rates of obesity and type 2 diabetes. NAFLD is frequently discovered incidentally when a routine LFT panel shows mildly elevated ALT and AST levels. Hepatitis B is another concern — while vaccination is now mandatory in the UAE childhood immunisation schedule, many adult expats who grew up in countries without universal vaccination may be undiagnosed carriers. LFTs plus a Hepatitis B surface antigen test are recommended for this group. The UAE's large population of South Asian and Southeast Asian workers comes from regions where hepatitis B carrier rates range from 2-8%, making screening particularly relevant. All standard UAE labs offer both LFT panels and Hepatitis B screening without a referral.",
    faqs: [
      {
        question: "How much does a liver function test cost in the UAE?",
        answer:
          "An LFT panel (ALT, AST, ALP, GGT, bilirubin, albumin) costs AED 80-160 across UAE labs. Hepatitis B surface antigen testing costs AED 60-100. Together, a liver screening (LFT + Hepatitis B) costs approximately AED 140-260.",
      },
      {
        question: "Do liver function tests require fasting?",
        answer:
          "LFT does not strictly require fasting, though some labs recommend a light fast for the most accurate albumin and bilirubin readings. Hepatitis B testing does not require fasting. If you are combining LFT with other fasting tests (lipid profile, glucose), fast for the other tests and the LFT will still be valid.",
      },
      {
        question: "What does it mean if my ALT is elevated?",
        answer:
          "A mildly elevated ALT (1-3x upper limit of normal) is very common in the UAE and most often indicates fatty liver (NAFLD). It can also be caused by medications (statins, paracetamol), alcohol, or viral hepatitis. A doctor will typically request an ultrasound and repeat LFT in 3-6 months. Significantly elevated ALT (more than 5x normal) warrants urgent investigation.",
      },
      {
        question: "Should expats get hepatitis B screening in the UAE?",
        answer:
          "Yes, particularly if you were not vaccinated as a child or are unsure of your vaccination history. Hepatitis B surface antigen (HBsAg) is a simple, inexpensive test (AED 60-100) that tells you if you are a carrier. If negative and unvaccinated, you can get the Hepatitis B vaccine series at any UAE clinic.",
      },
    ],
  },

  "kidney-disease": {
    slug: "kidney-disease",
    title: "Kidney Function Blood Tests in the UAE — KFT, Uric Acid & Cost",
    h1: "Kidney Function Blood Tests in the UAE: KFT, Screening & Price Comparison",
    metaDescription:
      "Compare kidney function test (KFT) prices across UAE labs. KFT from AED 80-180. CKD rising with diabetes — 1,200+ new dialysis patients annually. Uric acid, calcium, urinalysis. Updated March 2026.",
    overview:
      "Your kidneys filter your blood, regulate blood pressure, and maintain electrolyte balance — but kidney disease develops silently, with most people experiencing no symptoms until they have lost more than 50% of kidney function. Kidney Function Tests (KFTs) measure creatinine, urea, and electrolytes to calculate your estimated Glomerular Filtration Rate (eGFR) — the single most important number for kidney health. In the UAE, rising rates of diabetes and hypertension make kidney screening particularly critical.",
    testSlugs: ["kft", "uric-acid", "urinalysis", "calcium"],
    riskFactors: [
      "Diabetes (type 1 or type 2)",
      "High blood pressure",
      "Family history of kidney disease",
      "Age over 50",
      "Regular NSAID use (ibuprofen, diclofenac)",
      "Recurrent kidney stones",
      "Gout",
      "Obesity",
      "Smoking",
    ],
    symptoms: [
      "Swelling in ankles, feet, or around the eyes",
      "Fatigue and difficulty concentrating",
      "Reduced urine output",
      "Foamy or bubbly urine",
      "Blood in urine (pink or dark)",
      "Persistent itching",
      "Nausea and loss of appetite",
      "Muscle cramps, especially at night",
    ],
    uaeContext:
      "Chronic kidney disease (CKD) is a growing health concern in the UAE, directly linked to the country's high prevalence of diabetes (17.3%) and hypertension. The UAE Renal Registry reports approximately 1,200 new patients commencing dialysis annually, with diabetic nephropathy accounting for the largest share. An estimated 13% of UAE adults over 60 have some degree of CKD. The South Asian male expat population has particularly high rates of gout and elevated uric acid, making uric acid testing a relevant add-on to the standard KFT panel. Regular NSAID use — common among labourers and those with chronic pain — can accelerate kidney decline. The UAE national insurance mandate covers KFT testing under corporate health plans, and early CKD detection is a priority in both DHA and DOH primary care guidelines. National Reference Laboratory (NRL) in Abu Dhabi specialises in detailed renal panels including urine albumin-to-creatinine ratio (uACR) for early CKD detection.",
    faqs: [
      {
        question: "How much does a kidney function test cost in the UAE?",
        answer:
          "A standard KFT panel (creatinine, BUN, eGFR, electrolytes) costs AED 80-180 across UAE labs. Adding uric acid (AED 30-60), urinalysis (AED 30-50), and calcium (AED 30-50) brings the total kidney screening cost to approximately AED 170-340.",
      },
      {
        question: "What is eGFR and what should my level be?",
        answer:
          "eGFR (estimated Glomerular Filtration Rate) measures how well your kidneys filter waste, expressed in mL/min/1.73m2. Normal is above 90. Between 60-89 is mildly decreased but often normal for older adults. Below 60 for more than 3 months indicates chronic kidney disease (Stage 3). Below 30 is advanced CKD requiring nephrology referral.",
      },
      {
        question: "Do kidney function tests require fasting?",
        answer:
          "Standard KFT does not require fasting. However, if your doctor has requested a uric acid test alongside the KFT, fasting for 8-12 hours may improve accuracy. Urinalysis does not require fasting — a mid-stream morning sample is preferred. Always confirm with your specific lab.",
      },
      {
        question: "Who should get kidney function tests in the UAE?",
        answer:
          "All adults with diabetes or high blood pressure should have annual KFT testing. People over 50, those taking regular NSAIDs (ibuprofen, diclofenac), anyone with a family history of kidney disease, and people with recurrent kidney stones or gout should also test regularly. In the UAE, the combination of diabetes and heat-related dehydration makes kidney screening particularly important.",
      },
    ],
  },

  fertility: {
    slug: "fertility",
    title: "Fertility Blood Tests in the UAE — AMH, FSH, Hormones & Cost",
    h1: "Fertility Blood Tests in the UAE: Ovarian Reserve, Hormones & Price Comparison",
    metaDescription:
      "Compare fertility blood test prices in UAE labs. AMH from AED 280, FSH, estradiol, prolactin, thyroid, testosterone. IVF widely available in Dubai and Abu Dhabi. Updated March 2026.",
    overview:
      "Fertility blood tests measure hormone levels that indicate ovarian reserve (how many eggs remain), ovulation function, and conditions that could affect conception. Whether you are actively trying to conceive, planning for the future, or beginning an IVF journey, blood tests provide essential baseline data. The UAE has a thriving fertility medicine sector with internationally accredited IVF clinics, and all the key fertility markers are readily available at standalone labs.",
    testSlugs: [
      "amh",
      "fsh",
      "estradiol",
      "prolactin",
      "thyroid-panel",
      "testosterone",
    ],
    riskFactors: [
      "Age over 35 for women",
      "Irregular or absent menstrual cycles",
      "PCOS or endometriosis",
      "Previous ovarian surgery",
      "Family history of early menopause",
      "Chemotherapy or radiation therapy history",
      "Unexplained infertility after 12 months of trying",
      "Low sperm count or motility in male partner",
    ],
    symptoms: [
      "Irregular, heavy, or absent periods",
      "Pain during intercourse",
      "Inability to conceive after 12 months of unprotected sex",
      "History of multiple miscarriages",
      "Milky nipple discharge (sign of elevated prolactin)",
      "Symptoms of low testosterone in men (fatigue, low libido)",
      "Hot flashes or night sweats in women under 40",
      "Excessive hair growth or acne in women",
    ],
    uaeContext:
      "The UAE has one of the most advanced fertility medicine sectors in the region, with Dubai and Abu Dhabi home to internationally accredited clinics including Fakih IVF, Bourn Hall, Healthpoint Fertility, and the American Hospital IVF centre. UAE law permits IVF only within marriage, and there is a large community of married expat couples seeking fertility evaluation. AMH testing — the most important single marker of ovarian reserve — is widely available at UAE diagnostic labs without a referral, and its affordability (AED 280-400) has made self-initiated ovarian reserve testing increasingly common among women in their late 20s and 30s. Prolactin testing is relevant because certain medications and pituitary conditions can cause elevated prolactin (hyperprolactinaemia), which suppresses ovulation. Thyroid testing is included in the fertility panel because even mild thyroid dysfunction can impair conception and increase miscarriage risk.",
    faqs: [
      {
        question: "How much does a fertility blood test panel cost in the UAE?",
        answer:
          "A complete fertility panel (AMH, FSH, estradiol, prolactin, thyroid panel, testosterone) costs approximately AED 700-1,200 if ordered as individual tests. Some labs offer bundled women's health panels covering several of these markers. AMH alone costs AED 280-400 and can be tested independently as a quick ovarian reserve check.",
      },
      {
        question: "When should fertility blood tests be taken?",
        answer:
          "FSH and estradiol should be drawn on Day 2-4 of the menstrual cycle for the most accurate ovarian function assessment. AMH can be taken on any day of the cycle — it is relatively stable. Prolactin and thyroid tests can be drawn at any time. Testosterone in men should be drawn in the morning (7-10 AM) when levels peak.",
      },
      {
        question: "Do I need a doctor's referral for fertility tests in the UAE?",
        answer:
          "No. All standard fertility markers (AMH, FSH, estradiol, prolactin, thyroid, testosterone) can be self-requested at standalone labs in the UAE. However, interpreting results and creating a treatment plan requires a fertility specialist. Most IVF clinics in Dubai and Abu Dhabi will accept results from external labs.",
      },
      {
        question: "What AMH level is considered low?",
        answer:
          "AMH below 1.0 ng/mL indicates diminished ovarian reserve. Between 1.0-3.5 ng/mL is considered normal. Above 3.5 ng/mL may suggest PCOS (high number of small follicles). AMH declines naturally with age — a level that is normal at 25 may be concerning at 38. Discuss your result with a fertility specialist in the context of your age and goals.",
      },
    ],
  },

  "std-screening": {
    slug: "std-screening",
    title: "STD Screening Blood Tests in the UAE — HIV, Hepatitis, VDRL & Cost",
    h1: "STD Screening Blood Tests in the UAE: What's Required, Where to Test & Cost",
    metaDescription:
      "Compare STD screening blood test prices in UAE labs. HIV test, VDRL/syphilis, hepatitis B. Mandatory for UAE visa and pre-marital screening. Confidential testing available. Updated March 2026.",
    overview:
      "STD screening blood tests in the UAE serve two purposes: mandatory regulatory screening (visa medicals, pre-marital testing) and voluntary confidential screening for personal health. The standard panel covers HIV, Hepatitis B, and syphilis (VDRL). All major UAE labs offer these tests individually, and results are treated with strict confidentiality at licensed diagnostic laboratories.",
    testSlugs: ["hiv-test", "vdrl", "hepatitis-b"],
    riskFactors: [
      "Multiple sexual partners",
      "Unprotected sexual contact",
      "New sexual partner",
      "History of sexually transmitted infections",
      "Needle-sharing or occupational exposure",
      "Healthcare workers with exposure risk",
      "Travel to high-prevalence regions",
      "Pregnancy (to prevent mother-to-child transmission)",
    ],
    symptoms: [
      "Often no symptoms (many STDs are asymptomatic)",
      "Unusual discharge",
      "Pain during urination",
      "Sores, bumps, or rashes in the genital area",
      "Unexplained fatigue or fever",
      "Swollen lymph nodes",
      "Jaundice (yellowing of skin — hepatitis B)",
      "Unexplained weight loss",
    ],
    uaeContext:
      "STD testing is deeply integrated into the UAE regulatory framework. HIV, Hepatitis B, and syphilis (VDRL) testing is mandatory for all UAE residence visa applications and renewals. Pre-marital screening (Federal Law No. 22 of 2006) requires HIV, Hepatitis B, Hepatitis C, and syphilis testing for all couples planning to marry in the UAE. These regulatory requirements mean that most UAE residents have been tested at least once. However, voluntary confidential testing for ongoing sexual health is less common due to cultural sensitivities and the legal implications of certain positive results. At licensed standalone diagnostic labs, STD test results are treated as confidential medical records and are not reported to immigration authorities (unlike visa medical results, which are processed through the MOHAP system). This distinction is important for anyone seeking voluntary screening outside the visa/marriage context.",
    faqs: [
      {
        question: "How much does STD screening cost in the UAE?",
        answer:
          "Individual test prices: HIV test AED 80-120, Hepatitis B (HBsAg) AED 60-100, VDRL/syphilis AED 45-70. A combined STD panel (all three) costs approximately AED 185-290 at standalone labs. Visa medical screening (which includes these tests plus chest X-ray) costs AED 250-350 at approved centres.",
      },
      {
        question: "Is STD testing confidential at UAE labs?",
        answer:
          "Yes. At licensed standalone diagnostic labs (Al Borg, Medsol, Thumbay, Alpha Medical), STD test results are confidential medical records protected by UAE health data law. They are not reported to immigration authorities. This is distinct from visa medical screening, where results are uploaded to the MOHAP system.",
      },
      {
        question: "Is HIV testing mandatory in the UAE?",
        answer:
          "HIV testing is mandatory for residence visa applications and renewals, and for pre-marital screening. It is also recommended by MOHAP for all pregnant women in their first trimester. Voluntary confidential testing is available at all major labs. The UAE has shifted toward promoting treatment as prevention in its public health messaging.",
      },
      {
        question: "How long does it take to get STD test results in the UAE?",
        answer:
          "HIV (4th generation antigen/antibody combo), Hepatitis B, and VDRL results are typically available within 18-24 hours at most UAE labs. Urgent HIV results can be expedited to 2-4 hours at some labs for an additional fee. Visa medical results take 3-5 business days as they go through the MOHAP system.",
      },
    ],
  },

  "vitamin-deficiency": {
    slug: "vitamin-deficiency",
    title: "Vitamin Deficiency Blood Tests in the UAE — D, B12, Iron & Cost",
    h1: "Vitamin Deficiency Blood Tests in the UAE: What to Check and Where",
    metaDescription:
      "Compare vitamin and mineral blood test prices in UAE labs. Vitamin D, B12, folate, calcium, magnesium, iron studies. 80-90% of UAE residents are Vitamin D deficient. Updated March 2026.",
    overview:
      "Vitamin and mineral deficiencies are extremely common in the UAE, with Vitamin D deficiency alone affecting an estimated 80-90% of residents. Despite abundant sunshine, lifestyle factors unique to the UAE — prolonged time in air-conditioned buildings, protective clothing, and extreme summer heat that limits outdoor activity — create what researchers call the \"sunshine paradox.\" A simple blood panel covering six key markers can reveal deficiencies that cause fatigue, brain fog, muscle pain, hair loss, and weakened immunity.",
    testSlugs: [
      "vitamin-d",
      "vitamin-b12",
      "folate",
      "calcium",
      "magnesium",
      "iron-studies",
    ],
    riskFactors: [
      "Limited sun exposure or full-body clothing coverage",
      "Vegetarian or vegan diet (B12 risk)",
      "Dark skin tone (reduced UV-driven Vitamin D synthesis)",
      "Spending most time indoors in air-conditioned environments",
      "Heavy menstrual periods (iron risk)",
      "Pregnancy or breastfeeding",
      "Metformin use (depletes B12)",
      "Gastric bypass or malabsorption conditions",
    ],
    symptoms: [
      "Persistent fatigue despite adequate sleep",
      "Muscle weakness or bone pain",
      "Brain fog and poor concentration",
      "Hair loss or brittle nails",
      "Frequent infections or slow healing",
      "Tingling or numbness in hands and feet (B12)",
      "Mood changes or depression",
      "Leg cramps, especially at night (magnesium)",
    ],
    uaeContext:
      "The UAE has one of the highest documented rates of vitamin D deficiency in the world, with studies finding deficiency (below 50 nmol/L) in 60-90% of residents. This is paradoxical given the year-round sunshine, but is explained by extensive indoor lifestyles in air-conditioned environments, cultural dress practices that cover most skin, and the extreme UV index that discourages outdoor activity during summer months. The UAE Ministry of Health mandates vitamin D fortification of certain dairy products, but supplementation remains widely recommended. Vitamin B12 deficiency is particularly relevant for the UAE's large South Asian population — estimated at over 3 million individuals — which includes many vegetarians and vegans. Metformin, one of the most commonly prescribed drugs in the UAE given the 17% diabetes prevalence, also depletes B12. Iron deficiency is the most common nutritional deficiency in UAE women of reproductive age. Most UAE labs offer vitamin panels that bundle these tests at a discount compared to ordering individually.",
    faqs: [
      {
        question: "How much does a vitamin deficiency panel cost in the UAE?",
        answer:
          "Individual test prices: Vitamin D AED 85-150, B12 AED 80-130, folate AED 75-120, calcium AED 30-50, magnesium AED 40-70, iron studies AED 140-220. A complete panel (all six) costs AED 450-740 individually, but bundled vitamin panels at labs like Medsol start from AED 150-250 for common combinations.",
      },
      {
        question: "Why is Vitamin D deficiency so common in the UAE?",
        answer:
          "Despite abundant sunshine, 60-90% of UAE residents are Vitamin D deficient. This paradox is caused by spending most time indoors in air-conditioned environments, clothing that covers most skin from UV exposure, dark skin tones that reduce UV-driven synthesis, and summer heat exceeding 45C that keeps people indoors during peak UV hours.",
      },
      {
        question: "Do vitamin tests require fasting?",
        answer:
          "Iron studies require 8-12 hours of fasting for accurate results. Vitamin D, B12, folate, calcium, and magnesium do not require fasting. If you are combining iron studies with vitamin tests, schedule a morning appointment and fast overnight — the other tests will still be valid.",
      },
      {
        question: "Which vitamins should I test annually in the UAE?",
        answer:
          "Given the UAE's documented deficiency patterns, annual testing of Vitamin D, Vitamin B12, and iron studies (for women) is recommended for all residents. Add folate if you are planning pregnancy, calcium and magnesium if you have muscle cramps or are on certain medications. Many corporate wellness programmes now include Vitamin D and B12 in their standard panel.",
      },
    ],
  },

  "allergy-testing": {
    slug: "allergy-testing",
    title: "Allergy Blood Tests in the UAE — IgE, Food Intolerance & Cost",
    h1: "Allergy Blood Tests in the UAE: IgE Testing, Food Intolerance & Price Comparison",
    metaDescription:
      "Compare allergy blood test prices in UAE labs. Total IgE from AED 70-130. Food intolerance panels AED 800-2,000. Dust mites prevalent in UAE homes. Updated March 2026.",
    overview:
      "Allergy blood tests measure the immune system's response to specific triggers (allergens) by detecting Immunoglobulin E (IgE) antibodies in the blood. In the UAE, environmental allergies are extremely common due to high dust mite concentrations in air-conditioned homes, construction dust, and seasonal sandstorms. Food intolerance testing has also become popular, though it is important to understand the difference between true IgE-mediated food allergies (potentially dangerous) and IgG-based food intolerances (uncomfortable but not life-threatening).",
    testSlugs: ["ige-total", "food-intolerance-panel"],
    riskFactors: [
      "Family history of allergies or asthma",
      "Living in air-conditioned environments (dust mites)",
      "Exposure to construction dust",
      "Pet ownership in the UAE",
      "Eczema or atopic dermatitis",
      "Frequent sinus infections or nasal congestion",
      "Digestive issues after eating certain foods",
      "History of anaphylaxis",
    ],
    symptoms: [
      "Chronic sneezing, runny nose, or nasal congestion",
      "Itchy, watery, or red eyes",
      "Skin rashes, hives, or eczema flare-ups",
      "Wheezing or shortness of breath",
      "Abdominal pain, bloating, or diarrhea after eating",
      "Swelling of lips, tongue, or throat",
      "Chronic cough, especially at night",
      "Headaches or migraines linked to food",
    ],
    uaeContext:
      "The UAE's environment creates a perfect storm for allergies. Dust mites thrive in air-conditioned homes where humidity is maintained artificially — studies show dust mite concentrations in UAE bedrooms are among the highest in the world. Construction activity across rapidly developing cities adds fine particulate dust to the air year-round. Seasonal sandstorms (especially March-May) trigger respiratory symptoms in both allergic and non-allergic individuals. Food intolerance testing has become a wellness trend in the UAE, with many Dubai clinics offering comprehensive IgG food panels. However, medical consensus (endorsed by the UAE Allergy and Clinical Immunology Society) is that IgG-based food intolerance tests have limited evidence and should be interpreted cautiously — true IgE-mediated food allergy testing is the gold standard for potentially dangerous food allergies. Total IgE testing is a useful first step to determine if someone has an allergic disposition.",
    faqs: [
      {
        question: "How much does allergy testing cost in the UAE?",
        answer:
          "Total IgE (screening for allergic disposition) costs AED 70-130. Specific IgE panels for common allergens (dust mites, pollen, pet dander) cost AED 200-500. Comprehensive food intolerance panels (IgG-based, 100-200 foods) cost AED 800-2,000. True IgE-mediated food allergy testing costs AED 300-800 depending on the number of allergens tested.",
      },
      {
        question: "What is the difference between IgE and IgG allergy testing?",
        answer:
          "IgE testing detects true allergies — immune responses that can be immediate and potentially dangerous (anaphylaxis, hives, breathing difficulties). IgG testing detects food intolerances — delayed reactions that cause discomfort (bloating, headaches, fatigue) but are not life-threatening. IgE testing is the medical gold standard; IgG food intolerance testing is considered less evidence-based by most allergy specialists.",
      },
      {
        question: "Why are allergies so common in the UAE?",
        answer:
          "The UAE's combination of air-conditioned homes (where dust mites thrive), constant construction dust, seasonal sandstorms, and a rapidly changing environment creates high allergen exposure year-round. Dust mite concentrations in UAE bedrooms are among the highest globally. The shift from outdoor to indoor lifestyles also reduces exposure to natural immunological challenges in childhood.",
      },
      {
        question: "Do allergy blood tests require fasting?",
        answer:
          "No. Neither IgE nor IgG allergy tests require fasting. The blood draw can be done at any time of day. However, some medications (antihistamines, corticosteroids) may affect test accuracy — discuss with your doctor or lab before testing if you are on these medications.",
      },
    ],
  },

  "prostate-health": {
    slug: "prostate-health",
    title: "Prostate Blood Tests in the UAE — PSA Screening & Cost",
    h1: "Prostate Blood Tests in the UAE: PSA Screening, When to Test & Cost",
    metaDescription:
      "Compare PSA (prostate-specific antigen) blood test prices in UAE labs. PSA from AED 75-120. Prostate cancer screening recommended for men 50+. Testosterone testing included. Updated March 2026.",
    overview:
      "Prostate cancer is among the top five cancers diagnosed in men in the UAE, and early detection through PSA (prostate-specific antigen) blood testing dramatically improves outcomes. PSA testing is a simple blood draw that measures a protein produced by the prostate gland — elevated levels can indicate cancer, but also benign enlargement or infection. Combined with testosterone testing, a prostate health panel provides a comprehensive picture of men's hormonal and prostate health.",
    testSlugs: ["psa", "testosterone"],
    riskFactors: [
      "Age over 50 (primary risk factor)",
      "Family history of prostate cancer",
      "African ancestry (significantly higher risk)",
      "Obesity",
      "High-fat diet",
      "BRCA2 gene mutation carrier",
      "Previous prostate biopsy showing atypia",
      "Agent Orange exposure (military)",
    ],
    symptoms: [
      "Difficulty starting or stopping urination",
      "Weak or interrupted urine stream",
      "Frequent urination, especially at night",
      "Pain or burning during urination",
      "Blood in urine or semen",
      "Pain in the lower back, hips, or pelvis",
      "Erectile dysfunction",
      "Reduced sex drive or fatigue (low testosterone)",
    ],
    uaeContext:
      "Prostate cancer is among the top five cancers in UAE men according to the UAE National Cancer Registry. Awareness has grown substantially through Movember initiatives and government cancer awareness campaigns. The UAE's diverse population means risk varies significantly by ethnicity — men of African origin carry the highest risk, while the large South Asian male expat population has a relatively lower baseline risk compared to Western populations. Many UAE corporate health plans now include PSA in annual check-up panels for men over 45. Both total PSA and free PSA are available at all major UAE diagnostic labs as standalone tests or bundled in men's health packages. Testosterone testing, while not directly related to prostate cancer risk, is increasingly requested by men in the UAE as awareness of androgen deficiency (low testosterone) grows — driven partly by the wellness culture in Dubai and Abu Dhabi. UAE pharmacies require a prescription for testosterone replacement therapy, which must be prescribed by an endocrinologist or urologist.",
    faqs: [
      {
        question: "How much does a PSA test cost in the UAE?",
        answer:
          "Total PSA costs AED 75-120 at most UAE labs. Free PSA (which helps distinguish cancer from benign causes) costs AED 80-130. A prostate health panel (total PSA + free PSA + testosterone) costs approximately AED 250-400. Many men's health packages at Al Borg, Medsol, and Unilabs include PSA in their standard panel.",
      },
      {
        question: "At what age should men start PSA screening in the UAE?",
        answer:
          "Most guidelines recommend discussing PSA screening with your doctor starting at age 50 for men at average risk. Men with a first-degree relative who had prostate cancer, or men of African ancestry, should discuss screening from age 40-45. PSA screening is a shared decision — discuss benefits and risks with your doctor.",
      },
      {
        question: "Does an elevated PSA always mean prostate cancer?",
        answer:
          "No. PSA can be elevated due to benign prostatic hyperplasia (BPH, common in men over 50), prostatitis (infection/inflammation), recent ejaculation, vigorous exercise, or a urinary tract infection. Only about 25% of men with elevated PSA (above 4.0 ng/mL) are found to have prostate cancer on biopsy. The free-to-total PSA ratio helps distinguish benign from malignant causes.",
      },
      {
        question: "Does a PSA test require fasting or preparation?",
        answer:
          "No fasting is required. However, you should avoid ejaculation for 48 hours before the test, vigorous cycling for 48 hours, and any prostate examination (DRE) for one week before testing — all of these can temporarily elevate PSA and produce a false-high result. Testosterone testing is best done in the morning (7-10 AM) when levels peak.",
      },
    ],
  },
};

// ─── Static Params ──────────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(LAB_CONDITIONS).map((condition) => ({ condition }));
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ condition: string }>;
}): Promise<Metadata> {
  const { condition: slug } = await params;
  const condition = LAB_CONDITIONS[slug];
  if (!condition) return { title: "Condition Not Found" };

  const base = getBaseUrl();

  return {
    title: condition.title,
    description: condition.metaDescription,
    alternates: { canonical: `${base}/labs/conditions/${condition.slug}` },
    openGraph: {
      title: condition.h1,
      description: condition.metaDescription,
      url: `${base}/labs/conditions/${condition.slug}`,
      type: "website",
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEstimatedCost(testSlugs: string[]): number {
  let total = 0;
  for (const slug of testSlugs) {
    const range = getPriceRange(slug);
    if (range) {
      total += range.min;
    }
  }
  return total;
}

function getLabsOfferingMostTests(
  testSlugs: string[]
): { labSlug: string; labName: string; testCount: number; totalTests: number }[] {
  const testSet = new Set(testSlugs);
  const labScores: {
    labSlug: string;
    labName: string;
    testCount: number;
    totalTests: number;
  }[] = [];

  for (const lab of LAB_PROFILES) {
    const labPrices = getPricesForLab(lab.slug);
    const labTestSlugs = new Set(labPrices.map((p) => p.testSlug));
    const matchCount = testSlugs.filter((t) => labTestSlugs.has(t)).length;
    if (matchCount > 0) {
      labScores.push({
        labSlug: lab.slug,
        labName: lab.name,
        testCount: matchCount,
        totalTests: testSlugs.length,
      });
    }
  }

  return labScores
    .sort((a, b) => b.testCount - a.testCount)
    .slice(0, 6);
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ConditionPage({
  params,
}: {
  params: Promise<{ condition: string }>;
}) {
  const { condition: slug } = await params;
  const condition = LAB_CONDITIONS[slug];
  if (!condition) notFound();

  const base = getBaseUrl();

  // Resolve tests with price ranges
  const resolvedTests = condition.testSlugs
    .map((testSlug) => {
      const test = getLabTest(testSlug);
      if (!test) return null;
      const range = getPriceRange(testSlug);
      return { test, range };
    })
    .filter(Boolean) as {
    test: NonNullable<ReturnType<typeof getLabTest>>;
    range: ReturnType<typeof getPriceRange>;
  }[];

  const estimatedCost = getEstimatedCost(condition.testSlugs);
  const labsOffering = getLabsOfferingMostTests(condition.testSlugs);
  const otherConditions = Object.values(LAB_CONDITIONS).filter(
    (c) => c.slug !== slug
  );

  // JSON-LD schemas
  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Conditions", url: `${base}/labs/conditions` },
    { name: condition.h1.split(":")[0] },
  ]);
  const faqSchema = faqPageSchema(condition.faqs);
  const speakable = speakableSchema([
    ".answer-block",
    "h1",
    ".estimated-cost-box",
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: condition.title,
          description: condition.metaDescription,
          lastReviewed: "2026-03-25",
          reviewedBy: {
            "@type": "Organization",
            name: "Zavis",
            url: base,
          },
          url: `${base}/labs/conditions/${condition.slug}`,
          breadcrumb: breadcrumbs,
          about: {
            "@type": "MedicalCondition",
            name: condition.h1.split(":")[0].replace(" Blood Tests in the UAE", "").replace(" in the UAE", ""),
          },
        }}
      />

      <div className="container-tc py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Lab Tests", href: "/labs" },
            { label: "Conditions", href: "/labs/conditions" },
            { label: condition.h1.split(":")[0] },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Condition-Based Lab Guide
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark leading-tight mb-4">
            {condition.h1}
          </h1>

          {/* Answer Block / Overview */}
          <div
            className="answer-block bg-light-50 border-l-4 border-accent p-4 md:p-5"
            data-answer-block="true"
          >
            <p className="text-sm md:text-base text-dark leading-relaxed">
              {condition.overview}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Tests You Need */}
            <section>
              <div className="section-header mb-4">
                <h2>Tests You Need</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resolvedTests.map(({ test, range }) => (
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
                      {range && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-accent">
                            {formatPrice(range.min)}
                          </p>
                          {range.max > range.min && (
                            <p className="text-[10px] text-muted">
                              &ndash; {formatPrice(range.max)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted">
                      {test.fastingRequired && (
                        <>
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold rounded-sm">
                            Fasting
                          </span>
                          <span>&middot;</span>
                        </>
                      )}
                      <span className="capitalize">{test.sampleType}</span>
                      <span>&middot;</span>
                      <span>~{test.turnaroundHours}h results</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Estimated Cost */}
            {estimatedCost > 0 && (
              <section className="estimated-cost-box bg-light-50 border border-light-200 p-5">
                <div className="section-header mb-4">
                  <h2>Estimated Cost</h2>
                  <span className="arrows">&gt;&gt;&gt;</span>
                </div>
                <div className="flex items-start gap-3">
                  <Calculator className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {formatPrice(estimatedCost)}
                      <span className="text-sm font-normal text-muted ml-1">
                        estimated minimum
                      </span>
                    </p>
                    <p className="text-sm text-muted mt-1 leading-relaxed">
                      This is the sum of the cheapest available price for each
                      test in the panel across all UAE labs. Your actual cost
                      depends on which lab you choose — ordering all tests at the
                      same lab may qualify for a package discount. Some tests may
                      be covered by your insurance. Always confirm pricing
                      directly with the lab before booking.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Risk Factors */}
            <section>
              <div className="section-header mb-4">
                <h2>Risk Factors</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {condition.riskFactors.map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center gap-1.5 bg-light-50 border border-light-200 px-3 py-1.5 text-xs text-dark"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    {factor}
                  </span>
                ))}
              </div>
            </section>

            {/* Symptoms */}
            <section>
              <div className="section-header mb-4">
                <h2>Common Symptoms</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {condition.symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1.5 bg-light-50 border border-light-200 px-3 py-1.5 text-xs text-dark"
                  >
                    <Activity className="w-3 h-3 text-accent flex-shrink-0" />
                    {symptom}
                  </span>
                ))}
              </div>
            </section>

            {/* UAE Health Context */}
            <section>
              <div className="section-header mb-4">
                <h2>UAE Health Context</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div
                className="answer-block bg-light-50 border-l-4 border-accent p-4 md:p-5"
                data-answer-block="true"
              >
                <p className="text-sm text-dark leading-relaxed">
                  {condition.uaeContext}
                </p>
              </div>
            </section>

            {/* Where to Get Tested */}
            {labsOffering.length > 0 && (
              <section>
                <div className="section-header mb-4">
                  <h2>Where to Get Tested</h2>
                  <span className="arrows">&gt;&gt;&gt;</span>
                </div>
                <p className="text-sm text-muted mb-4">
                  Labs ranked by how many of the {condition.testSlugs.length}{" "}
                  recommended tests they offer in their price list.
                </p>
                <div className="space-y-2">
                  {labsOffering.map((lab) => (
                    <Link
                      key={lab.labSlug}
                      href={`/labs/${lab.labSlug}`}
                      className="flex items-center justify-between border border-light-200 hover:border-accent p-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-light-50 border border-light-200 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                            {lab.labName}
                          </p>
                          <p className="text-[11px] text-muted">
                            {lab.testCount} of {lab.totalTests} tests available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-light-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-accent h-full rounded-full"
                            style={{
                              width: `${Math.round(
                                (lab.testCount / lab.totalTests) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-accent">
                          {Math.round(
                            (lab.testCount / lab.totalTests) * 100
                          )}
                          %
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            <FaqSection
              title="Frequently Asked Questions"
              faqs={condition.faqs}
            />

            {/* Cross-links to other conditions */}
            <section>
              <div className="section-header mb-4">
                <h2>Other Condition-Based Test Guides</h2>
                <span className="arrows">&gt;&gt;&gt;</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {otherConditions.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/labs/conditions/${c.slug}`}
                    className="flex items-center gap-2 border border-light-200 hover:border-accent p-3 transition-colors group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="text-xs text-dark group-hover:text-accent transition-colors leading-tight">
                      {c.h1.split(":")[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Medical Disclaimer */}
            <div className="border border-light-200 bg-light-50 p-4 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-dark">Medical Disclaimer:</strong>{" "}
                  This page is for informational purposes only and does not
                  constitute medical advice. The tests listed are commonly
                  associated with this condition but may not be appropriate for
                  every individual. Always consult a licensed physician before
                  ordering medical tests or making health decisions. Prices are
                  based on publicly available UAE lab pricing as of March 2026
                  and may vary. Regulated by the Dubai Health Authority (DHA),
                  Department of Health Abu Dhabi (DOH), and Ministry of Health
                  and Prevention (MOHAP).
                </p>
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Quick Summary */}
            <div className="border border-light-200 bg-light-50 p-4">
              <p className="text-xs font-bold text-dark mb-3 uppercase tracking-wider">
                Quick Summary
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                    Tests Needed
                  </p>
                  <p className="text-sm font-semibold text-dark mt-0.5">
                    {resolvedTests.length} blood tests
                  </p>
                </div>
                {estimatedCost > 0 && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                      Est. Minimum Cost
                    </p>
                    <p className="text-sm font-semibold text-accent mt-0.5">
                      {formatPrice(estimatedCost)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                    Fasting Required
                  </p>
                  <p className="text-sm font-semibold text-dark mt-0.5">
                    {resolvedTests.some(({ test }) => test.fastingRequired)
                      ? "Yes (for some tests)"
                      : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide font-bold">
                    Labs Available
                  </p>
                  <p className="text-sm font-semibold text-dark mt-0.5">
                    {labsOffering.length} labs
                  </p>
                </div>
              </div>
            </div>

            {/* Other Conditions */}
            <div className="border border-light-200 p-4">
              <div className="section-header mb-3">
                <h3 className="text-sm">Browse by Condition</h3>
                <span className="arrows text-xs">&gt;&gt;&gt;</span>
              </div>
              <div className="space-y-2">
                {otherConditions.slice(0, 8).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/labs/conditions/${c.slug}`}
                    className="flex items-start gap-2 group py-1.5 border-b border-light-100 last:border-b-0"
                  >
                    <ArrowRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-dark group-hover:text-accent transition-colors leading-tight">
                      {c.h1.split(":")[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Compare Prices CTA */}
            <div className="border border-light-200 bg-light-50 p-4">
              <p className="text-xs font-bold text-dark mb-2">
                Compare Blood Test Prices
              </p>
              <p className="text-[11px] text-muted mb-3 leading-relaxed">
                Browse and compare prices for 30+ tests across 11 UAE labs.
              </p>
              <Link
                href="/labs"
                className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
              >
                Browse all tests &rarr;
              </Link>
            </div>

            {/* Quick Links */}
            <div className="border border-light-200 p-4">
              <p className="text-xs font-bold text-dark mb-3">Quick Links</p>
              <div className="space-y-1.5">
                {[
                  {
                    href: "/labs/category/blood-routine",
                    label: "Routine Blood Tests",
                  },
                  {
                    href: "/labs/category/vitamins-minerals",
                    label: "Vitamins & Minerals",
                  },
                  {
                    href: "/labs/category/hormones",
                    label: "Hormone Tests",
                  },
                  {
                    href: "/labs/category/std-screening",
                    label: "STD Screening",
                  },
                  {
                    href: "/labs/category/fertility",
                    label: "Fertility Tests",
                  },
                  { href: "/labs/packages", label: "Health Packages" },
                  {
                    href: "/labs/home-collection",
                    label: "Home Collection",
                  },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors py-1"
                  >
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
