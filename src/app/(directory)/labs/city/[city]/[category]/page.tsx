import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, Clock, Droplets, Home, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  TEST_CATEGORIES,
  LAB_TEST_PRICES,
  getTestsByCategory,
  getLabsByCity,
  getLabProfile,
  formatPrice,
  type TestCategory,
} from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Regulator helper ────────────────────────────────────────────────────────

function getCityRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}

// ─── Category medical content ─────────────────────────────────────────────────

interface CategoryContent {
  shortDescription: string;
  longDescription: string;
  whoShouldTest: string;
  whenToTest: string;
  uaeContext: string;
}

const CATEGORY_MEDICAL_CONTENT: Record<TestCategory, CategoryContent> = {
  "blood-routine": {
    shortDescription:
      "Routine blood tests measure the fundamental components of your blood — red cells, white cells, platelets, haemoglobin, and key metabolic markers. The Complete Blood Count (CBC), Erythrocyte Sedimentation Rate (ESR), and basic metabolic panels form the backbone of nearly every annual health screen and disease workup.",
    longDescription:
      "Routine blood work is the most frequently ordered category of clinical tests in the UAE, covering CBC, differential counts, ESR, blood grouping, and basic metabolic panels. These tests provide a snapshot of overall health, immune function, oxygen-carrying capacity, and early warning signs for anaemia, infection, inflammation, and blood disorders. In the UAE, where a significant portion of the population experiences iron-deficiency anaemia (particularly women and children) and blood-borne infections are screened as part of residency visas, routine blood panels are ordered extremely frequently. Most UAE labs can turn around a CBC and basic metabolic panel within 4–6 hours, making them ideal for same-day walk-in appointments.",
    whoShouldTest:
      "Annual routine blood work is recommended for all UAE residents over 18. It is particularly important for women of reproductive age (anaemia risk), expatriates arriving for visa medicals, anyone with persistent fatigue or unexplained weight changes, and patients managing chronic conditions such as hypertension or diabetes.",
    whenToTest:
      "Get a routine blood panel once a year as part of an annual health screen. More frequent testing is appropriate if you have chronic illness, are on regular medication, or experience symptoms such as fatigue, frequent infections, unusual bruising, or unexplained weight changes.",
    uaeContext:
      "The UAE's ethnically diverse population carries distinct haematological profiles: sickle cell trait is present in approximately 6% of Emiratis; thalassaemia trait is common among South Asian expatriates; iron-deficiency anaemia affects an estimated 30–40% of women of childbearing age in the UAE. Mandatory pre-marital and antenatal blood screens are also required by UAE law, making this the highest-volume test category in the country.",
  },
  "vitamins-minerals": {
    shortDescription:
      "Vitamin and mineral tests measure micronutrient levels in the blood — including Vitamin D, B12, iron stores, folate, zinc, magnesium, and calcium. These are among the most commonly deficient nutrients in UAE residents, driven by indoor lifestyles, UV-blocking clothing, dietary patterns, and high-protein diets common in the region.",
    longDescription:
      "Despite the UAE's year-round sunshine, Vitamin D deficiency is genuinely endemic: studies estimate that 80–90% of UAE residents — both nationals and expatriates — have insufficient Vitamin D levels. The reasons are paradoxical: outdoor activity is limited by extreme heat, women's traditional dress blocks UV exposure, indoor air-conditioned lifestyles predominate, and high-SPF sunscreen is widely used. Vitamin D deficiency is linked to bone loss, immune dysfunction, fatigue, depression, and increased risk of several cancers. Vitamin B12 deficiency is similarly prevalent, particularly among the large South Asian vegetarian and vegan population in Dubai and Abu Dhabi. Iron-deficiency anaemia affects a significant proportion of UAE women. These micronutrient deficiencies are highly treatable once identified — making testing essential before supplementation.",
    whoShouldTest:
      "All UAE residents should check Vitamin D and B12 annually. Vegans and vegetarians should add iron studies and folate. Women planning pregnancy need folate and iron assessed. Anyone with fatigue, bone pain, muscle weakness, hair loss, or depression should test comprehensively. South Asian expatriates are at elevated risk of B12 and iron deficiency.",
    whenToTest:
      "Test vitamins and minerals at least once a year. If supplementing, retest every 3–6 months to confirm adequacy of dosing. Test Vitamin D in late summer (after peak sun exposure) and late winter (after the low-sun period) to understand your seasonal variation.",
    uaeContext:
      "UAE physicians report Vitamin D deficiency as the single most common correctable finding in routine bloodwork. The UAE Ministry of Health has acknowledged widespread deficiency as a national health priority. Supplementation protocols typically require loading doses of 50,000 IU per week for 8–12 weeks in cases of frank deficiency — but correct dosing requires knowing your baseline level, making testing essential rather than supplementing blindly.",
  },
  hormones: {
    shortDescription:
      "Hormone tests measure chemical messengers produced by glands throughout the body — including cortisol, testosterone, oestrogen, progesterone, DHEA, prolactin, and insulin. Hormonal imbalances underlie a wide range of conditions from fatigue and weight gain to infertility, anxiety, and metabolic disease.",
    longDescription:
      "The endocrine system orchestrates nearly every physiological process in the body, and disruptions manifest as a diverse array of symptoms that are often misattributed to stress or lifestyle. In the UAE, the combination of heat stress, demanding work cultures, high prevalence of metabolic syndrome, and dietary patterns creates a population where hormonal imbalances are particularly common. Cortisol dysregulation from chronic occupational stress is increasingly recognised as a health burden among UAE's working population. Polycystic Ovary Syndrome (PCOS), driven partly by insulin resistance and elevated androgens, affects an estimated 8–13% of women of reproductive age globally and is one of the most common reasons women in the UAE present for hormone testing. Testosterone deficiency in men is also underdiagnosed, particularly among men over 40, those with metabolic syndrome, or those on chronic medication.",
    whoShouldTest:
      "Women with irregular periods, difficulty conceiving, unexplained weight gain, acne, or hair loss should test sex hormones and androgens. Men experiencing fatigue, reduced libido, muscle loss, or mood changes should test testosterone, LH, and FSH. Anyone with suspected adrenal issues, Cushing's syndrome, or chronic stress should test cortisol. Both sexes benefit from DHEA assessment in their 40s and beyond.",
    whenToTest:
      "Hormone testing should be done at specific times to be meaningful: cortisol must be drawn in the morning (7–9 AM) when levels peak; sex hormones in women should ideally be timed to day 2–5 of the menstrual cycle for baseline follicular assessment. Testosterone is best drawn fasting in the morning. Discuss timing with your physician before booking.",
    uaeContext:
      "The UAE has a very high prevalence of metabolic syndrome — affecting an estimated 35% of adults — which directly impacts hormonal balance through insulin resistance, elevated androgens, and cortisol dysregulation. PCOS diagnosis rates are rising year-on-year in Dubai and Abu Dhabi fertility clinics. The culturally sedentary lifestyle combined with calorie-dense diets creates a perfect environment for hormonal disruption, making this one of the most clinically relevant test categories in the UAE.",
  },
  diabetes: {
    shortDescription:
      "Diabetes tests measure blood glucose regulation and long-term sugar control — including fasting glucose, HbA1c (3-month average), insulin levels, and the oral glucose tolerance test (OGTT). The UAE has one of the highest diabetes prevalence rates in the world, making these tests critically important.",
    longDescription:
      "The UAE faces a diabetes crisis. With a prevalence rate exceeding 16% among adults — one of the highest in the world — and a further 20–30% of the population in the pre-diabetic range, diabetes testing is among the most clinically urgent testing categories in the country. Type 2 diabetes in the UAE is driven by high-calorie diets rich in refined carbohydrates and saturated fats, sedentary air-conditioned lifestyles, genetic predisposition among Gulf national populations, and widespread Vitamin D deficiency which independently increases diabetes risk. HbA1c is the gold standard for diabetes diagnosis and monitoring because it reflects average blood glucose over the previous 3 months, unlike a single fasting glucose reading which can vary from day to day. Fasting glucose is essential as a screening test; OGTT confirms diagnosis in borderline cases. Regular testing is not just for those with diagnosed diabetes — pre-diabetes screening for all adults over 35 is strongly recommended in UAE clinical guidelines.",
    whoShouldTest:
      "Every UAE resident over 35 should have an annual fasting glucose and HbA1c. Those with a family history of diabetes, who are overweight, have high blood pressure, or have previously shown elevated fasting glucose should test from age 25 onwards. Pregnant women require an OGTT (gestational diabetes screening) at 24–28 weeks. Anyone with symptoms of excessive thirst, frequent urination, unexplained fatigue, blurred vision, or slow-healing wounds should test immediately.",
    whenToTest:
      "Annual diabetes screening for all adults over 35 in the UAE; every 6 months for those in the pre-diabetic range or with risk factors. Fasting glucose requires an 8–12 hour overnight fast. HbA1c does not require fasting and can be drawn at any time.",
    uaeContext:
      "The International Diabetes Federation ranks the UAE among the top 10 countries globally for diabetes prevalence. The UAE Ministry of Health has launched national diabetes awareness campaigns, and DHA has mandated diabetes screening as part of periodic health assessments in workplaces. Approximately 1 in 6 UAE adults has diagnosed diabetes; the true figure including undiagnosed cases is estimated higher. Early detection through HbA1c screening can defer or prevent progression from pre-diabetes to full Type 2 diabetes.",
  },
  liver: {
    shortDescription:
      "Liver function tests (LFTs) measure liver enzyme levels, protein synthesis capacity, and bilirubin to assess liver health and detect disease at early stages. The liver is the body's primary metabolic and detoxification organ — fatty liver disease, hepatitis, and medication-induced liver injury are among the most common findings in UAE patients.",
    longDescription:
      "Non-Alcoholic Fatty Liver Disease (NAFLD) is reaching epidemic proportions in the UAE, mirroring the global obesity crisis but with disproportionate severity due to the UAE's metabolic risk profile. Studies suggest NAFLD affects an estimated 25–35% of UAE adults, making it one of the most under-diagnosed chronic conditions in the country. Liver function tests — specifically ALT, AST, GGT, ALP, total and direct bilirubin, albumin, and total protein — can detect fatty infiltration, inflammation, and fibrosis before symptoms develop. Viral hepatitis remains relevant in the UAE due to the large expatriate workforce from regions where Hepatitis B and C are endemic. Medication-induced liver injury from NSAIDs, statins, herbal supplements, and traditional medicines is also frequently identified through LFT monitoring. Importantly, the liver has substantial regenerative capacity — early detection through LFTs when disease is still in the fatty or inflammatory stage allows dietary and lifestyle intervention before permanent scarring (cirrhosis) develops.",
    whoShouldTest:
      "Annual LFTs are recommended for anyone with diabetes, metabolic syndrome, obesity, or high cholesterol — all conditions strongly linked to NAFLD. Those taking statins, regular NSAIDs (painkillers), anti-tuberculosis drugs, or herbal supplements should test every 6 months. Expatriates from regions with high hepatitis B/C prevalence should include hepatitis serology. Symptoms of fatigue, jaundice, abdominal discomfort, or dark urine warrant immediate LFT testing.",
    whenToTest:
      "Include liver function in your annual health panel. LFTs do not require fasting for most parameters, though some labs request a 4–8 hour fast for a cleaner sample. If you take regular medication, test at least twice a year.",
    uaeContext:
      "A 2023 study from Dubai Hospital found NAFLD prevalence of 32% in a UAE cross-sectional study — driven overwhelmingly by obesity and metabolic syndrome. The UAE's cuisine culture — heavy in refined grains, fried foods, and sugary beverages — combined with sedentary lifestyles creates significant hepatic stress. Awareness among UAE residents of their liver health status is markedly low, making proactive LFT testing particularly valuable.",
  },
  kidney: {
    shortDescription:
      "Kidney function tests assess how well your kidneys are filtering blood and maintaining fluid and electrolyte balance — measuring creatinine, BUN, eGFR, uric acid, and electrolytes. Chronic kidney disease (CKD) is highly prevalent in the UAE due to the high rates of diabetes and hypertension, and is often asymptomatic until advanced stages.",
    longDescription:
      "The kidneys are the body's silent workhorses — filtering approximately 200 litres of blood daily, maintaining electrolyte balance, and regulating blood pressure through hormone production. Chronic kidney disease progresses silently: most people lose over 50% of kidney function before experiencing symptoms. In the UAE, CKD is primarily driven by diabetic nephropathy (kidney damage from diabetes) and hypertensive nephropathy (damage from high blood pressure) — the two most common comorbidities in the UAE adult population. An estimated 10–15% of UAE adults have some degree of CKD. The key marker is eGFR (estimated Glomerular Filtration Rate), calculated from creatinine — values below 60 mL/min/1.73m² indicate compromised filtration. Uric acid is also important: elevated levels cause both gout (a disproportionately prevalent condition in Gulf populations due to purine-rich diets) and are an independent risk factor for CKD progression. Early-stage CKD is manageable with medication, blood pressure control, and dietary changes — making regular testing the cornerstone of prevention.",
    whoShouldTest:
      "Annual kidney function testing is strongly recommended for all diabetics, all hypertensive patients, those with obesity, anyone with a family history of kidney disease, and all individuals over 45. People taking chronic NSAIDs, ACE inhibitors, or aminoglycoside antibiotics should test every 6 months. Symptoms warranting immediate KFT testing include swelling in the legs or face, reduced urine output, foamy urine, blood in urine, or persistent back pain.",
    whenToTest:
      "Include kidney function in your annual metabolic panel. Most KFT panels require fasting for accurate creatinine and BUN measurement. For diabetics, testing every 6 months alongside HbA1c is the UAE Diabetes Society's recommended protocol.",
    uaeContext:
      "The UAE has among the highest rates of end-stage renal disease (ESRD) requiring dialysis in the MENA region, driven primarily by the diabetes epidemic. Dubai Health Authority has established dedicated chronic kidney disease clinics at several public hospitals. The high-protein, red-meat-heavy dietary patterns common in Gulf cuisine also place additional strain on renal filtration and contribute to elevated uric acid levels — a major driver of gout prevalence in Emirati and Saudi males.",
  },
  cardiac: {
    shortDescription:
      "Cardiac blood tests assess heart health risk factors and detect myocardial injury — including troponin, BNP, lipid profile, homocysteine, Lp(a), and high-sensitivity CRP. Cardiovascular disease is the leading cause of death in the UAE, making early cardiac risk assessment a genuine clinical priority.",
    longDescription:
      "Cardiovascular disease (CVD) accounts for approximately 30% of all deaths in the UAE — the leading single cause of mortality. The UAE population carries a particularly heavy cardiac risk burden: hypertension affects an estimated 30% of adults, diabetes (an independent cardiac risk factor) affects 16%+, and dyslipidaemia (abnormal cholesterol and triglycerides) is widespread due to dietary patterns. Cardiac biomarkers serve two distinct purposes: troponin is an emergency marker for acute myocardial infarction (heart attack), while BNP/NT-proBNP assesses chronic heart failure burden. Risk-stratification tests — lipid profile, Lp(a), homocysteine, hs-CRP — identify individuals at elevated future cardiac risk years before events occur. High-sensitivity CRP is particularly valuable because it measures vascular inflammation independent of cholesterol, identifying a subset of patients with normal LDL but elevated cardiac risk. Lp(a), a genetically determined lipoprotein variant, is elevated in approximately 20% of the population and confers significant additional atherosclerotic risk.",
    whoShouldTest:
      "All adults over 35 in the UAE should have a basic cardiac risk panel annually: lipid profile, fasting glucose, and blood pressure assessment. Those with diabetes, hypertension, family history of early heart disease (first-degree relative under 55), smokers, or those with obesity should add hs-CRP and be assessed for Lp(a). Troponin is primarily an emergency hospital test, but BNP is clinically relevant for anyone with exertional shortness of breath or lower limb oedema.",
    whenToTest:
      "Annual cardiac risk screening from age 35 (or age 25 if family history of early CVD). Lipid profiles require 9–12 hours of fasting for accurate results. hs-CRP does not require fasting. If you are on statins or cardiac medication, retest every 3–6 months to assess treatment response.",
    uaeContext:
      "The UAE has among the youngest-onset cardiovascular disease profiles in the world, with heart attacks occurring in men as young as their 30s and 40s — driven by the combination of uncontrolled diabetes, hypertension, heavy smoking, stress, poor diet, and sedentary lifestyles. Dubai Health Authority has prioritised cardiac screening in their National Agenda Health Indicators. Studies from Rashid Hospital and Cleveland Clinic Abu Dhabi show UAE patients presenting with ACS (acute coronary syndrome) have more severe multi-vessel disease at younger ages than equivalent European cohorts.",
  },
  thyroid: {
    shortDescription:
      "Thyroid tests measure the function of the thyroid gland — the butterfly-shaped gland in the neck that controls metabolism, energy, body temperature, and growth. TSH (Thyroid Stimulating Hormone) is the primary screening test; FT3 and FT4 measure active thyroid hormones; antibody tests identify autoimmune thyroid disease.",
    longDescription:
      "Thyroid disorders are among the most prevalent endocrine conditions globally, and the UAE is no exception. Hypothyroidism (underactive thyroid) affects an estimated 2–5% of the adult population, with subclinical hypothyroidism — a milder form — affecting a further 5–10%. Hyperthyroidism (overactive thyroid) affects about 1% of adults. Women are 5–10 times more likely than men to develop thyroid disease. Hashimoto's thyroiditis, an autoimmune condition where the immune system attacks thyroid tissue, is the most common cause of hypothyroidism worldwide and can be detected through anti-TPO (anti-thyroid peroxidase) and anti-Tg (anti-thyroglobulin) antibody testing. The symptoms of thyroid disease are highly non-specific — fatigue, weight changes, hair loss, mood changes, cold or heat intolerance, palpitations, constipation — and are often attributed to stress or lifestyle, leading to substantial under-diagnosis. TSH is the single most informative test: a mildly elevated TSH even with normal FT4 indicates the pituitary is working harder than normal to maintain thyroid output, signalling early thyroid insufficiency before it becomes symptomatic.",
    whoShouldTest:
      "Women over 35 and all adults over 50 should test TSH annually. Women planning pregnancy should test pre-conception, as thyroid disease affects fertility and fetal neurodevelopment. Those with fatigue, unexplained weight gain or loss, hair thinning, mood changes, or palpitations of unclear cause should test a full thyroid panel. Anyone with a personal or family history of autoimmune disease (Type 1 diabetes, vitiligo, rheumatoid arthritis, lupus) should include thyroid antibodies.",
    whenToTest:
      "Thyroid testing does not require fasting and can be done at any time of day. However, some labs recommend testing TSH in the morning, as levels have a slight circadian variation. If you are on thyroxine replacement therapy, test 4–6 weeks after any dose change to allow levels to stabilise.",
    uaeContext:
      "Thyroid disorder rates in the UAE are consistent with global prevalence but may be amplified by iodine intake patterns — the heavy reliance on desalinated water (naturally iodine-poor) and the traditional Gulf diet's variable iodine content. Several studies from UAE institutions have highlighted sub-optimal iodine status as a background risk factor for thyroid dysfunction in the region. The UAE's female expatriate population — predominantly South Asian — carries a genetic predisposition to autoimmune thyroid disease, making antibody testing particularly relevant in this demographic.",
  },
  allergy: {
    shortDescription:
      "Allergy and intolerance testing identifies immune hypersensitivity reactions to foods, environmental allergens, medications, or other substances. Tests include specific IgE panels (blood tests detecting allergic sensitisation), total IgE, and comprehensive food intolerance panels measuring IgG antibodies.",
    longDescription:
      "Allergy and atopic disease rates in the UAE are rising significantly, driven by urbanisation, changes in microbiome diversity, air pollution, and increased exposure to non-native allergens. Allergic rhinitis (hay fever equivalent driven by desert dust, date pollen, and grass) affects an estimated 20–30% of UAE residents. Asthma is present in 8–10% of UAE children and adults. Food allergies — particularly to shellfish, sesame (a common ingredient in Gulf cuisine), tree nuts, and dairy — are increasingly prevalent. The IgE-mediated allergy test panel identifies which specific allergens trigger an immune response, guiding avoidance strategies and informing decisions about allergen immunotherapy (desensitisation treatment). Total IgE gives a general indication of atopic tendency. Food intolerance panels (IgG-based) measure delayed reactions that are more difficult to attribute clinically and are subject to ongoing scientific debate, but are offered by many UAE labs as a screening tool.",
    whoShouldTest:
      "Children and adults with unexplained recurrent sneezing, runny nose, skin rashes, hives, unexplained GI symptoms, or breathing difficulties triggered by specific environments or foods. Anyone with asthma who has not had allergy testing to identify triggers. Parents of children with eczema should test for food and environmental allergy triggers. Those who have had anaphylactic reactions should have a comprehensive IgE panel to identify the causative allergen.",
    whenToTest:
      "Allergy testing is most informative during a symptomatic period or shortly after exposure to a suspected trigger. It is not ideal during heavy antihistamine use, as anti-IgE medications can suppress results. Year-round testing is possible for food allergens; for seasonal aeroallergens, testing in autumn (pre-season) or when symptoms first appear is most useful.",
    uaeContext:
      "Dubai and Abu Dhabi face unique allergen burdens not seen in temperate climates: desert dust storms (Shamal winds) carry complex particulate matter with strong allergenic properties; date palm pollen is highly allergenic and is seasonally intense in spring (March–April); cockroach allergen is a major indoor trigger in older residential areas. The UAE's rapid construction and landscaping (grass and ornamental plants in an otherwise arid environment) creates an artificial pollen load. Studies from UAE allergists suggest 35–45% of patients presenting to ENT clinics have undiagnosed allergic rhinitis.",
  },
  fertility: {
    shortDescription:
      "Fertility tests assess reproductive hormone levels, egg reserve, sperm quality markers, and gynaecological health. These tests are essential for couples trying to conceive, women planning future pregnancies, and individuals investigating unexplained menstrual irregularity or recurrent pregnancy loss.",
    longDescription:
      "Fertility testing in the UAE has expanded dramatically with the growth of IVF clinics and increasing awareness that conception difficulty should prompt early investigation rather than years of waiting. For women, the core fertility panel includes FSH, LH, oestradiol (day 2–3), AMH (Anti-Mullerian Hormone — the best single marker of ovarian reserve), prolactin, and thyroid function. AMH is particularly valuable because it can be tested at any time in the cycle and reflects the remaining egg pool with high accuracy. An AMH below 1.0 ng/mL indicates diminished ovarian reserve and may prompt earlier treatment. For men, semen analysis remains the definitive fertility test, but blood tests including testosterone, FSH, LH, and prolactin provide hormonal context for sperm production abnormalities. Female-factor infertility and male-factor infertility each account for approximately 30–35% of infertility cases — meaning both partners should be investigated simultaneously rather than sequentially.",
    whoShouldTest:
      "Couples who have been trying to conceive for 12 months without success (6 months if the woman is over 35). Women with irregular or absent periods, known PCOS, endometriosis, or previous pelvic infections. Women planning future pregnancy who want to assess their egg reserve (particularly relevant for women over 32). Men with a history of undescended testes, varicocoele, previous groin surgery, or hormonal symptoms. Both partners should be tested early — male factor is found in half of all infertility cases.",
    whenToTest:
      "Female hormone panels (FSH, LH, oestradiol) must be timed to day 2, 3, or 5 of the menstrual cycle for baseline assessment. AMH and prolactin can be tested at any time. Pre-conception panels are ideally completed 3–6 months before planned conception to allow time for intervention if abnormalities are found.",
    uaeContext:
      "The UAE is a regional hub for fertility treatment, with world-class IVF centres in Dubai and Abu Dhabi operating at high capacity. The average age at first birth among UAE national women is rising, increasing the relevance of ovarian reserve testing. The UAE's high obesity prevalence directly impacts fertility through PCOS and anovulation in women, and reduced testosterone and sperm quality in men. Additionally, the culturally sensitive nature of infertility in Gulf societies has historically led to under-investigation of male-factor infertility — a pattern that is now changing with increased awareness.",
  },
  "cancer-screening": {
    shortDescription:
      "Cancer screening blood tests detect tumour markers — proteins, enzymes, and antigens shed by cancer cells — as well as genetic variants associated with cancer risk. These include PSA (prostate), CA-125 (ovarian), CA 19-9 (pancreatic/GI), CEA (colorectal), AFP (liver/testicular), and BRCA gene testing.",
    longDescription:
      "Cancer tumour markers must be interpreted carefully: they are not definitive diagnostic tests but rather risk indicators and monitoring tools. PSA (Prostate-Specific Antigen) is the most evidence-supported standalone cancer screening blood test, widely used in men over 50 to detect early prostate cancer before symptoms develop. A PSA above 4 ng/mL warrants urological referral. CA-125 is used for ovarian cancer monitoring and, with important caveats, for screening in women with BRCA1/2 mutations. CEA monitors colorectal cancer treatment response. AFP screens for hepatocellular carcinoma (liver cancer) — highly relevant in the UAE given the hepatitis B carrier rates and NAFLD burden. BRCA1/2 genetic testing identifies hereditary breast and ovarian cancer risk with major implications for preventive treatment decisions. It is important to understand that elevated tumour markers can occur in benign conditions and must be interpreted alongside clinical examination and imaging.",
    whoShouldTest:
      "Men over 50 should discuss annual PSA testing with their physician; men over 45 with a family history of prostate cancer should start earlier. Women with a first-degree relative with ovarian cancer or known BRCA mutations should have CA-125 and gynaecological review. Anyone with a strong family history of breast, ovarian, or colorectal cancer should consider BRCA and Lynch syndrome genetic testing. AFP monitoring is indicated for patients with cirrhosis or chronic hepatitis B, which increases hepatocellular carcinoma risk.",
    whenToTest:
      "Cancer marker testing is most useful as part of a targeted clinical discussion rather than as a blanket screening panel. PSA testing is ideally done 2–3 weeks after any prostate manipulation (sexual activity, cycling, DRE). Most tumour markers do not require fasting. BRCA genetic testing requires genetic counselling before and after.",
    uaeContext:
      "Cancer rates in the UAE are rising as the population ages and lifestyle factors converge. Colorectal cancer is increasing in incidence, with the UAE Ministry of Health running national colorectal cancer screening campaigns. Breast cancer is the most common cancer among UAE women, with approximately 15% of cases occurring in women under 40 — younger than in Western populations. Hepatocellular carcinoma risk is relevant due to hepatitis B carrier rates in the large South and Southeast Asian expatriate population. Dubai Cancer Registry data shows a rising trend in metabolic-related cancers (colorectal, liver, endometrial) directly linked to obesity and sedentary lifestyle.",
  },
  "std-screening": {
    shortDescription:
      "STD (sexually transmitted disease) screening tests detect viral, bacterial, and parasitic infections transmitted through sexual contact — including HIV, Syphilis, Gonorrhoea, Chlamydia, Hepatitis B and C, HPV, and Herpes. Regular screening is essential as most STDs are asymptomatic and untreated infections can cause serious long-term health consequences.",
    longDescription:
      "Sexually transmitted infections (STIs) are significantly under-detected in the UAE due to social stigma, low health-seeking behaviour for sexual health concerns, and the absence of national-scale anonymous STI surveillance data. HIV testing is mandatory for UAE residency visas and is among the most commonly performed STD tests in the country. Hepatitis B screening is also part of visa medicals. However, voluntary STI screening for conditions like chlamydia, syphilis, gonorrhoea, and hepatitis C is far less common than clinical disease burden would suggest. Chlamydia — the most common bacterial STI globally — is largely asymptomatic in both sexes but causes pelvic inflammatory disease and infertility in women and epididymitis in men if untreated. Syphilis is resurging globally and in the region. All STDs are highly treatable at early stages; late-stage disease (pelvic inflammatory disease, neurosyphilis, AIDS, cirrhosis from HCV) is vastly more difficult and expensive to manage. Private diagnostic labs in the UAE offer confidential STI testing without requiring a doctor's referral, making self-referral testing accessible.",
    whoShouldTest:
      "Anyone who is sexually active should consider annual comprehensive STI screening. Higher-risk groups — including those with new or multiple partners, men who have sex with men, sex workers, and those with a history of IV drug use — should screen every 3–6 months. All pregnant women should be screened for HIV, syphilis, hepatitis B, and chlamydia as part of antenatal care. Partners of diagnosed STI patients should test immediately.",
    whenToTest:
      "STI testing is most accurate after the appropriate window period following potential exposure: HIV window is 4 weeks post-exposure for 4th-generation tests; syphilis window is 3–6 weeks; chlamydia/gonorrhoea can be detected within days of infection. Most STI tests do not require fasting.",
    uaeContext:
      "UAE expatriate visa medicals screen for HIV and hepatitis B. Individuals testing positive for certain STIs under UAE regulations may face residency implications, which creates a disincentive for voluntary testing — a significant public health challenge. The majority of HIV diagnoses in the UAE are made during visa medical screening rather than through symptomatic presentation. Private labs offer confidential testing with digital results, removing the need for interaction with public health systems and making testing more accessible for those concerned about confidentiality.",
  },
  imaging: {
    shortDescription:
      "Imaging and radiology tests include X-rays, ultrasound, CT scans, MRI scans, and DEXA bone density scans. While most imaging is done in hospitals and radiology centres, some diagnostic labs offer integrated X-ray and ultrasound services. Chest X-rays are a standard component of UAE visa medicals.",
    longDescription:
      "Diagnostic imaging plays a crucial role in the UAE healthcare system. Chest X-rays are among the most frequently performed investigations in the UAE because they are mandatory for residency and employment visa medicals — essentially every new expatriate must have a chest X-ray to screen for active pulmonary tuberculosis. Abdominal ultrasound is invaluable for assessing fatty liver disease, gallstones, kidney cysts, ovarian cysts, and prostate volume — all highly prevalent conditions in the UAE population. DEXA bone density scanning is particularly important for post-menopausal women and for men over 65, given the high prevalence of Vitamin D deficiency which contributes to osteoporosis. Some UAE diagnostic labs offer walk-in X-ray and basic ultrasound services, integrating these with blood test results for a more comprehensive assessment. High-resolution CT and MRI are hospital-based procedures requiring physician referral.",
    whoShouldTest:
      "Chest X-ray is required for all new UAE residents as part of the visa medical process. Abdominal ultrasound is recommended annually for those with elevated liver enzymes, fatty liver diagnosis, or abdominal symptoms. DEXA scan is recommended for all post-menopausal women and men over 65. Pelvic ultrasound is indicated for women with menstrual irregularity, pelvic pain, or suspected PCOS.",
    whenToTest:
      "Visa medical imaging is done at any MOHAP/DHA/DOH-approved centre upon entry to the UAE. Elective ultrasound studies generally do not require fasting (except gallbladder/upper abdominal ultrasound, which requires 4–6 hours fasting). DEXA scans require no special preparation.",
    uaeContext:
      "The UAE operates a mandatory chest X-ray screening programme for all residents and long-term visa applicants — one of the largest tuberculosis surveillance programmes in the world. Given the large South Asian and Sub-Saharan African expatriate populations (regions with high TB prevalence), this programme has significant public health value. UAE radiology centres in Dubai Healthcare City and Abu Dhabi's Healthpoint Hospital offer some of the most advanced diagnostic imaging capabilities in the MENA region.",
  },
  "urine-stool": {
    shortDescription:
      "Urine and stool tests analyse physical, chemical, and microscopic properties of urine and faecal samples to detect infections, kidney disease, gastrointestinal conditions, metabolic disorders, and parasites. These non-invasive tests are often the first-line investigation for common complaints.",
    longDescription:
      "Urine and stool analysis are foundational diagnostic tests that provide significant clinical information through non-invasive sample collection. Urinalysis detects urinary tract infections (UTIs) — the most common bacterial infection in the UAE, particularly prevalent among women — through dipstick testing and microscopy. Urine microalbumin is a critical early marker of diabetic kidney damage that appears years before creatinine rises and is actionable: ACE inhibitors can halt progression if started when microalbuminuria is first detected. 24-hour urine collection provides accurate quantification of protein, creatinine clearance, and hormonal metabolites. Stool analysis is essential for the diagnosis of gastrointestinal infections, parasitic infestations (more prevalent in UAE's large South Asian and African expatriate communities), and colorectal cancer screening through faecal occult blood testing (FOBT). H. pylori stool antigen testing is the most accurate non-invasive method for detecting Helicobacter pylori — the bacterium responsible for most peptic ulcers and a major risk factor for gastric cancer.",
    whoShouldTest:
      "Annual urine analysis is recommended for all diabetics (to detect microalbuminuria early) and all patients with hypertension or kidney disease. Anyone with urinary symptoms (burning, frequency, urgency, blood in urine) needs immediate urinalysis and culture. Stool cultures are indicated for persistent diarrhoea, bloody stools, or suspected food poisoning. FOBT is recommended annually for adults over 50 as part of colorectal cancer screening.",
    whenToTest:
      "Urinalysis uses a midstream urine sample — first morning urine is most concentrated and most informative. Stool samples should be fresh (within 2 hours for most tests; some parasitology tests require special preservative tubes). 24-hour urine collection requires careful instructions to collect all urine over exactly 24 hours starting and ending with an empty bladder.",
    uaeContext:
      "UTIs are highly prevalent in the UAE's hot climate, where dehydration is common due to both the heat and the cultural practice of significant tea and coffee consumption (which have mild diuretic effects) — creating an environment favourable for bacterial colonisation of the urinary tract. Parasitic infestations — including Giardia, Entamoeba, and helminth infections — are periodically diagnosed in the UAE's large South Asian and African expatriate communities. H. pylori prevalence in the UAE is approximately 50–60% based on endoscopy studies, significantly higher than in Western populations, reflecting transmission through shared food preparation and water sources.",
  },
};

// ─── Static params generation ────────────────────────────────────────────────

export function generateStaticParams() {
  const params: { city: string; category: string }[] = [];
  for (const city of CITIES) {
    const citySlug = city.slug;
    const labsInCity = getLabsByCity(citySlug);
    if (labsInCity.length === 0) continue;
    const labSlugsInCity = new Set(labsInCity.map((l) => l.slug));

    for (const cat of TEST_CATEGORIES) {
      // Only emit the page if at least one price record exists for a lab in this city
      const hasPrices = LAB_TEST_PRICES.some(
        (p) => labSlugsInCity.has(p.labSlug) && cat.slug !== undefined
      );
      // We also check that we have at least one test in the category
      // (categories are always defined, so just check for price coverage)
      if (hasPrices) {
        params.push({ city: citySlug, category: cat.slug });
      }
    }
  }
  return params;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { city: string; category: string };
}): Metadata {
  const cityData = CITIES.find((c) => c.slug === params.city);
  const catData = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cityData || !catData) return { title: "Not Found" };

  const base = getBaseUrl();
  const labsInCity = getLabsByCity(params.city);
  const labSlugsInCity = new Set(labsInCity.map((l) => l.slug));
  const testsInCat = getTestsByCategory(catData.slug as TestCategory);

  // Compute city-filtered price data
  let cheapestPrice: number | null = null;
  let labsWithPricesCount = 0;
  const labsWithPrices = new Set<string>();

  for (const test of testsInCat) {
    const cityPrices = LAB_TEST_PRICES.filter(
      (p) => p.testSlug === test.slug && labSlugsInCity.has(p.labSlug)
    );
    for (const cp of cityPrices) {
      labsWithPrices.add(cp.labSlug);
      if (cheapestPrice === null || cp.price < cheapestPrice) {
        cheapestPrice = cp.price;
      }
    }
  }
  labsWithPricesCount = labsWithPrices.size;

  const homeCollectionAvailable = labsInCity.some((l) => l.homeCollection);
  const homeCollectionText = homeCollectionAvailable
    ? "Home collection available."
    : "";
  const regulator = getCityRegulator(params.city);

  return {
    title: `${catData.name} in ${cityData.name} — Compare Prices Across ${labsWithPricesCount || labsInCity.length} Labs${cheapestPrice ? ` from AED ${cheapestPrice}` : ""} | UAE Lab Tests`,
    description:
      `Compare ${testsInCat.length} ${catData.name.toLowerCase()} test prices across ${labsWithPricesCount || labsInCity.length} labs in ${cityData.name}. ` +
      (cheapestPrice ? `Prices from AED ${cheapestPrice}. ` : "") +
      `${homeCollectionText} ${regulator}-licensed laboratories.`,
    alternates: {
      canonical: `${base}/labs/city/${params.city}/${params.category}`,
    },
    openGraph: {
      title: `${catData.name} in ${cityData.name} — Lab Price Comparison`,
      description: `Compare ${testsInCat.length} ${catData.name.toLowerCase()} tests across labs in ${cityData.name}${cheapestPrice ? ` from AED ${cheapestPrice}` : ""}.`,
      url: `${base}/labs/city/${params.city}/${params.category}`,
      type: "website",
    },
  };
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function CityLabCategoryPage({
  params,
}: {
  params: { city: string; category: string };
}) {
  const cityData = CITIES.find((c) => c.slug === params.city);
  const catData = TEST_CATEGORIES.find((c) => c.slug === params.category);
  if (!cityData || !catData) notFound();

  const base = getBaseUrl();
  const citySlug = params.city;
  const catSlug = catData.slug as TestCategory;
  const cityName = cityData.name;
  const catName = catData.name;
  const regulator = getCityRegulator(citySlug);
  const medContent = CATEGORY_MEDICAL_CONTENT[catSlug];

  // ── Data assembly ──────────────────────────────────────────────────────────
  const labsInCity = getLabsByCity(citySlug);
  const labSlugsInCity = new Set(labsInCity.map((l) => l.slug));
  const testsInCat = getTestsByCategory(catSlug);

  // For each test, compute city-specific price data
  const testsWithCityPrices = testsInCat.map((test) => {
    const cityPrices = LAB_TEST_PRICES.filter(
      (p) => p.testSlug === test.slug && labSlugsInCity.has(p.labSlug)
    ).sort((a, b) => a.price - b.price);

    const priceMin = cityPrices.length > 0 ? cityPrices[0].price : null;
    const priceMax =
      cityPrices.length > 0 ? cityPrices[cityPrices.length - 1].price : null;
    const labCount = new Set(cityPrices.map((p) => p.labSlug)).size;
    const cheapestLab =
      cityPrices.length > 0
        ? getLabProfile(cityPrices[0].labSlug)?.name || cityPrices[0].labSlug
        : null;

    return {
      ...test,
      cityPrices,
      priceMin,
      priceMax,
      labCount,
      cheapestLab,
    };
  });

  const testsWithAnyPrice = testsWithCityPrices.filter((t) => t.priceMin !== null);

  // Labs in city that have at least one price in this category
  const labsOfferingCategory = labsInCity.filter((lab) => {
    return testsInCat.some((test) =>
      LAB_TEST_PRICES.some(
        (p) => p.testSlug === test.slug && p.labSlug === lab.slug
      )
    );
  });

  // For each such lab, compute its cheapest price in this category and test count
  const labsWithCategoryStats = labsOfferingCategory.map((lab) => {
    const relevantPrices = LAB_TEST_PRICES.filter(
      (p) =>
        p.labSlug === lab.slug &&
        testsInCat.some((t) => t.slug === p.testSlug)
    );
    const cheapest =
      relevantPrices.length > 0
        ? Math.min(...relevantPrices.map((p) => p.price))
        : null;
    return {
      ...lab,
      categoryTestCount: relevantPrices.length,
      cheapestCategoryPrice: cheapest,
    };
  }).sort((a, b) => (a.cheapestCategoryPrice ?? Infinity) - (b.cheapestCategoryPrice ?? Infinity));

  // Overall stats
  const overallCheapest = testsWithAnyPrice.length > 0
    ? Math.min(...testsWithAnyPrice.map((t) => t.priceMin!))
    : null;
  const homeCollectionLabs = labsInCity.filter((l) => l.homeCollection);
  const homeCollectionAvailable = homeCollectionLabs.length > 0;

  // Other categories in this city (for cross-link section)
  const otherCategories = TEST_CATEGORIES.filter((c) => c.slug !== catSlug);

  // ── FAQ ───────────────────────────────────────────────────────────────────
  const exampleTest = testsWithAnyPrice[0] ?? testsInCat[0];
  const cheapestLab = labsWithCategoryStats[0];

  const faqs = [
    {
      question: `How much does a ${exampleTest?.shortName ?? catName} cost in ${cityName}?`,
      answer:
        exampleTest && exampleTest.priceMin !== null
          ? `A ${exampleTest.name} in ${cityName} costs between ${formatPrice(exampleTest.priceMin)}${exampleTest.priceMax !== exampleTest.priceMin ? ` and ${formatPrice(exampleTest.priceMax!)}` : ""} depending on the laboratory. ${exampleTest.cheapestLab ? `The cheapest option in ${cityName} is ${exampleTest.cheapestLab}.` : ""} Compare all ${catName.toLowerCase()} prices across ${labsOfferingCategory.length} labs in ${cityName} above.`
          : `${catName} test prices in ${cityName} vary by laboratory. Browse the price comparison above or contact labs directly for current pricing.`,
    },
    {
      question: `Which lab in ${cityName} is cheapest for ${catName.toLowerCase()} tests?`,
      answer:
        cheapestLab
          ? `Based on current pricing, ${cheapestLab.name} in ${cityName} offers ${catName.toLowerCase()} tests from ${cheapestLab.cheapestCategoryPrice ? formatPrice(cheapestLab.cheapestCategoryPrice) : "competitive prices"}, covering ${cheapestLab.categoryTestCount} test${cheapestLab.categoryTestCount !== 1 ? "s" : ""} in this category. ${cheapestLab.homeCollection ? `${cheapestLab.name} also offers home sample collection${cheapestLab.homeCollectionFee === 0 ? " for free" : ` for AED ${cheapestLab.homeCollectionFee}`}.` : ""} Prices vary by specific test — compare individual tests above for the most accurate comparison.`
          : `Compare ${catName.toLowerCase()} prices across ${labsInCity.length} labs in ${cityName} using the price table above.`,
    },
    {
      question: `Do I need a prescription for ${catName.toLowerCase()} tests in ${cityName}?`,
      answer:
        `Most standalone diagnostic labs in ${cityName} accept walk-in patients without a prescription for ${catName.toLowerCase()} tests. Labs including ${labsInCity.slice(0, 3).map((l) => l.name).join(", ")} offer self-referral testing. ${homeCollectionAvailable ? `Home collection services in ${cityName} also don't require prescriptions for most routine tests.` : ""} Some specialised tests — particularly in the cancer screening, genetic, or fertility categories — may require a physician referral. Hospital-based labs typically require an internal referral.`,
    },
    {
      question: `Can I get ${catName.toLowerCase()} tests at home in ${cityName}?`,
      answer:
        homeCollectionAvailable
          ? `Yes, home sample collection for ${catName.toLowerCase()} tests is available in ${cityName}. ${homeCollectionLabs.slice(0, 2).map((l) => `${l.name}${l.homeCollectionFee === 0 ? " (free collection)" : ` (AED ${l.homeCollectionFee} collection fee)`}`).join(" and ")}${homeCollectionLabs.length > 2 ? ` and ${homeCollectionLabs.length - 2} other labs` : ""} offer home phlebotomy. A ${regulator}-licensed nurse visits your location and results are delivered digitally within 24–48 hours.`
          : `Home collection availability in ${cityName} for ${catName.toLowerCase()} tests is limited. Most labs require walk-in visits. Check individual lab listings above for current home collection options.`,
    },
    {
      question: `How long do ${catName.toLowerCase()} test results take in ${cityName}?`,
      answer:
        `Turnaround times for ${catName.toLowerCase()} tests in ${cityName} typically range from 4 to 48 hours depending on the specific test and laboratory. Routine tests such as ${testsInCat.slice(0, 2).map((t) => t.shortName).join(" and ")} are usually ready within ${Math.min(...testsInCat.map((t) => t.turnaroundHours))}–${Math.max(...testsInCat.map((t) => t.turnaroundHours))} hours. Walk-in results may be faster than home collection services. Most labs in ${cityName} deliver results digitally by email or app, with physical reports available on request. All ${catName.toLowerCase()} labs listed here are licensed by the ${regulator}.`,
    },
  ];

  // ── JSON-LD: CollectionPage + ItemList of MedicalTest ─────────────────────
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${catName} in ${cityName} — Lab Price Comparison`,
    description: `Compare ${testsInCat.length} ${catName.toLowerCase()} test prices across labs in ${cityName}, UAE.`,
    url: `${base}/labs/city/${citySlug}/${catSlug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: testsWithAnyPrice.length,
      itemListElement: testsWithCityPrices.slice(0, 25).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "MedicalTest",
          name: t.name,
          description: t.description,
          url: `${base}/labs/test/${t.slug}`,
          ...(t.priceMin !== null
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  lowPrice: t.priceMin,
                  highPrice: t.priceMax ?? t.priceMin,
                  priceCurrency: "AED",
                  offerCount: t.labCount,
                  availableAtOrFrom: {
                    "@type": "MedicalBusiness",
                    addressLocality: cityName,
                    addressCountry: "AE",
                  },
                },
              }
            : {}),
        },
      })),
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container-tc py-8">
      {/* JSON-LD */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Tests", url: `${base}/labs` },
          { name: cityName, url: `${base}/labs/city/${citySlug}` },
          { name: catName },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={collectionPageSchema} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: cityName, href: `/labs/city/${citySlug}` },
          { label: catName },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="text-xs font-bold text-accent uppercase tracking-wide">
            {cityName} · {regulator}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3">
          {catName} in {cityName} — Compare Prices Across{" "}
          {labsOfferingCategory.length || labsInCity.length} Labs
        </h1>

        {/* Primary answer block */}
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            {medContent.shortDescription}{" "}
            {testsWithAnyPrice.length > 0 && (
              <>
                In {cityName},{" "}
                <strong>{testsWithAnyPrice.length} {catName.toLowerCase()} tests</strong>{" "}
                are available across{" "}
                <strong>{labsOfferingCategory.length} licensed laboratories</strong>.
                {overallCheapest !== null && (
                  <>
                    {" "}Prices start from{" "}
                    <strong>{formatPrice(overallCheapest)}</strong>.
                  </>
                )}{" "}
                {homeCollectionAvailable && (
                  <>
                    {homeCollectionLabs.length} lab
                    {homeCollectionLabs.length !== 1 ? "s" : ""} offer home sample
                    collection, including{" "}
                    {homeCollectionLabs
                      .slice(0, 2)
                      .map((l) => l.name)
                      .join(" and ")}
                    . All laboratories are licensed by the {regulator}.
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">{testsInCat.length}</p>
            <p className="text-xs text-muted">Tests in category</p>
          </div>
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {labsOfferingCategory.length || labsInCity.length}
            </p>
            <p className="text-xs text-muted">Labs in {cityName}</p>
          </div>
          {overallCheapest !== null ? (
            <div className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                {formatPrice(overallCheapest)}
              </p>
              <p className="text-xs text-muted">Cheapest price</p>
            </div>
          ) : (
            <div className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">—</p>
              <p className="text-xs text-muted">Price data</p>
            </div>
          )}
          <div className="bg-light-50 p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {homeCollectionLabs.length > 0 ? homeCollectionLabs.length : "—"}
            </p>
            <p className="text-xs text-muted">Home collection</p>
          </div>
        </div>
      </div>

      {/* ── Tests section ─────────────────────────────────────────────────── */}
      <div className="section-header">
        <h2>
          All {catName} Tests Available in {cityName}
        </h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          {medContent.whoShouldTest} Prices shown are filtered to{" "}
          {labsOfferingCategory.length} labs operating in {cityName}. Click any
          test for a full price breakdown, preparation instructions, and lab
          reviews.
        </p>
      </div>

      <div className="space-y-2 mb-12">
        {testsWithCityPrices.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-start justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">{test.name}</p>
              <p className="text-[11px] text-muted mt-1 line-clamp-2">
                {test.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {test.fastingRequired && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-medium">
                    Fasting required
                  </span>
                )}
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium capitalize">
                  {test.sampleType}
                </span>
                <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {test.turnaroundHours}h
                </span>
                {test.labCount > 0 && (
                  <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium">
                    {test.labCount} lab{test.labCount !== 1 ? "s" : ""} in {cityName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {test.priceMin !== null ? (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceMin)}
                  </p>
                  {test.priceMax !== null && test.priceMax !== test.priceMin && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceMax)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">
                    {test.labCount} lab{test.labCount !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-muted">Contact labs</p>
              )}
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors ml-auto mt-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Labs in city section ───────────────────────────────────────────── */}
      {labsWithCategoryStats.length > 0 && (
        <>
          <div className="section-header">
            <h2>
              Labs in {cityName} Offering {catName} Tests
            </h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="answer-block mb-4" data-answer-block="true">
            <p className="text-xs text-muted">
              {labsWithCategoryStats.length} laboratory provider
              {labsWithCategoryStats.length !== 1 ? "s" : ""} in {cityName}{" "}
              offer {catName.toLowerCase()} tests. All are licensed by the{" "}
              {regulator}
              {labsWithCategoryStats.some((l) => l.accreditations.includes("CAP"))
                ? " and several hold CAP (College of American Pathologists) international accreditation"
                : ""}
              .
            </p>
          </div>
          <div className="space-y-2 mb-12">
            {labsWithCategoryStats.map((lab) => (
              <Link
                key={lab.slug}
                href={`/labs/lab/${lab.slug}`}
                className="flex items-start justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                      {lab.name}
                    </h3>
                    {lab.accreditations.slice(0, 2).map((acc) => (
                      <span
                        key={acc}
                        className="text-[10px] bg-light-50 border border-light-200 px-1.5 py-0.5 font-medium text-dark"
                      >
                        {acc}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted mt-1 line-clamp-1">
                    {lab.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lab.homeCollection && (
                      <span className="text-[10px] bg-green-50 text-green-800 border border-green-200 px-1.5 py-0.5 font-medium flex items-center gap-1">
                        <Home className="w-2.5 h-2.5" />
                        Home collection
                        {lab.homeCollectionFee === 0 ? " (free)" : ` (AED ${lab.homeCollectionFee})`}
                      </span>
                    )}
                    <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium">
                      {lab.categoryTestCount} {catName.toLowerCase()} test
                      {lab.categoryTestCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] bg-light-100 text-dark px-1.5 py-0.5 font-medium">
                      Results in {lab.turnaroundHours}h
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {lab.cheapestCategoryPrice !== null && (
                    <>
                      <p className="text-xs text-muted">from</p>
                      <p className="text-sm font-bold text-accent">
                        {formatPrice(lab.cheapestCategoryPrice)}
                      </p>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors ml-auto mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── Deep medical education block ──────────────────────────────────── */}
      <div className="section-header">
        <h2>
          About {catName} Testing in {cityName}
        </h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-12" data-answer-block="true">
        <div className="space-y-4">
          <p className="text-muted leading-relaxed text-sm">
            {medContent.longDescription}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-light-50 border border-light-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-accent flex-shrink-0" />
                <h3 className="text-xs font-bold text-dark uppercase tracking-wide">
                  Who Should Test
                </h3>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                {medContent.whoShouldTest}
              </p>
            </div>
            <div className="bg-light-50 border border-light-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                <h3 className="text-xs font-bold text-dark uppercase tracking-wide">
                  When to Test
                </h3>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">
                {medContent.whenToTest}
              </p>
            </div>
          </div>
          <div className="bg-light-50 border border-light-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
              <h3 className="text-xs font-bold text-dark uppercase tracking-wide">
                UAE Health Context
              </h3>
            </div>
            <p className="text-[12px] text-muted leading-relaxed">
              {medContent.uaeContext}
            </p>
          </div>
        </div>
      </div>

      {/* ── Other categories in city ───────────────────────────────────────── */}
      <div className="section-header">
        <h2>Other Test Categories in {cityName}</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {otherCategories.map((c) => {
          const count = getTestsByCategory(c.slug as TestCategory).length;
          return (
            <Link
              key={c.slug}
              href={`/labs/city/${citySlug}/${c.slug}`}
              className="border border-light-200 p-3 hover:border-accent transition-colors group"
            >
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {c.name}
              </h3>
              <p className="text-[11px] text-muted">
                {count} tests · {cityName}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <FaqSection
          faqs={faqs}
          title={`${catName} in ${cityName} — Frequently Asked Questions`}
        />
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {catName.toLowerCase()} tests
          in {cityName} are indicative and based on publicly available data from
          UAE diagnostic laboratory websites, aggregator platforms, and
          walk-in price lists (2024–2025). Actual prices may vary by branch
          location, insurance coverage, and current promotions. Always confirm
          pricing directly with the laboratory before booking. This comparison
          tool is for informational purposes only and does not constitute
          medical advice. Consult a qualified physician before ordering lab
          tests. All laboratories listed are licensed by the {regulator}. Data
          last verified March 2026.
        </p>
      </div>
    </div>
  );
}
