import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, FlaskConical, Info } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { getLabTest, getPriceRange, formatPrice } from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalRange {
  parameter: string;
  range: string;
  unit: string;
  note?: string;
}

interface TestInterpretation {
  testSlug: string;
  title: string;
  metaDescription: string;
  overview: string;
  normalRanges: NormalRange[];
  highMeaning: string;
  lowMeaning: string;
  whenToWorry: string;
  uaeContext: string;
  nextSteps: string;
  relatedTests: string[];
  fastingRequired: boolean;
  howOften: string;
}

// ─── Test Interpretation Data ────────────────────────────────────────────────

const TEST_INTERPRETATIONS: Record<string, TestInterpretation> = {
  cbc: {
    testSlug: "cbc",
    title: "Complete Blood Count (CBC)",
    metaDescription:
      "Understand your CBC results: normal ranges for WBC, RBC, haemoglobin, haematocrit, MCV, and platelets. Learn what high WBC, low haemoglobin, and abnormal platelet counts mean in the UAE context.",
    overview:
      "A Complete Blood Count measures three cell lines your bone marrow produces: red blood cells (which carry oxygen via haemoglobin), white blood cells (your immune system's frontline), and platelets (tiny fragments critical for clotting). The CBC also reports haematocrit — the percentage of blood volume made up of red cells — and MCV (mean corpuscular volume), which classifies the type of anaemia when present. It is one of the most ordered tests globally and the starting point for investigating fatigue, infection, bleeding, and many chronic diseases.",
    normalRanges: [
      { parameter: "White Blood Cells (WBC)", range: "4,000–11,000", unit: "cells/µL", note: "Total immune cells" },
      { parameter: "Red Blood Cells (RBC) — Men", range: "4.5–5.5", unit: "million/µL" },
      { parameter: "Red Blood Cells (RBC) — Women", range: "4.0–5.0", unit: "million/µL" },
      { parameter: "Haemoglobin — Men", range: "13.5–17.5", unit: "g/dL" },
      { parameter: "Haemoglobin — Women", range: "12.0–16.0", unit: "g/dL" },
      { parameter: "Haematocrit — Men", range: "41–53", unit: "%" },
      { parameter: "Haematocrit — Women", range: "36–46", unit: "%" },
      { parameter: "MCV (Mean Corpuscular Volume)", range: "80–100", unit: "fL", note: "Size of red cells" },
      { parameter: "Platelets", range: "150,000–400,000", unit: "cells/µL" },
    ],
    highMeaning:
      "High WBC (leukocytosis, above 11,000/µL) most commonly signals active infection — bacterial infections typically cause elevated neutrophils, while viral infections raise lymphocytes. Persistent or markedly elevated WBC (above 30,000) with abnormal cell morphology raises concern for leukaemia and requires urgent haematology review. High platelets (thrombocytosis, above 400,000) can follow infection, surgery, or iron deficiency, and is usually reactive and benign; values above 1,000,000 require investigation. Elevated haemoglobin (polycythaemia) may be due to dehydration, chronic lung disease, or, rarely, a bone marrow condition.",
    lowMeaning:
      "Low haemoglobin (anaemia) is the most clinically significant CBC finding. In the UAE, iron deficiency is the most common cause — particularly in South Asian and Filipino women of reproductive age, with studies reporting rates above 30% in certain demographics. Low MCV (below 80 fL, microcytic anaemia) points to iron deficiency or thalassaemia trait, both common in UAE populations. High MCV (above 100 fL, macrocytic anaemia) suggests B12 or folate deficiency. Low WBC (below 4,000) may indicate viral infection, certain medications, or bone marrow suppression. Low platelets (below 150,000, thrombocytopenia) are seen with dengue fever — highly relevant in Dubai and Abu Dhabi given the endemic risk — viral infections, or immune thrombocytopenia.",
    whenToWorry:
      "See a doctor promptly if: haemoglobin drops below 8 g/dL (severe anaemia causing breathlessness or chest pain); WBC exceeds 30,000/µL or falls below 2,000/µL; platelets fall below 50,000/µL (bleeding risk) or rise above 1,000,000/µL; or if the lab report flags abnormal cell morphology (blasts, hypersegmented neutrophils, or schistocytes). Dengue-related thrombocytopenia below 20,000/µL is a medical emergency. Any combination of low WBC, low haemoglobin, and low platelets (pancytopenia) requires urgent evaluation.",
    uaeContext:
      "Thalassaemia trait — a genetic condition reducing haemoglobin production — is common in UAE nationals and populations from the Indian subcontinent, Southeast Asia, and the Mediterranean. It produces a picture similar to iron deficiency on a CBC (low MCV, low haemoglobin) but iron stores are normal or elevated. The UAE mandates pre-marital thalassaemia screening precisely because of this prevalence. CBC is included in UAE visa medicals for domestic workers and certain job categories. Dengue fever, which causes rapid platelet drops, has seasonal outbreaks in the UAE — a falling platelet count in a febrile patient warrants dengue serology.",
    nextSteps:
      "If your CBC is abnormal, your doctor will typically order follow-up tests based on the specific finding: iron studies and ferritin for suspected iron deficiency; a peripheral blood smear to examine cell morphology; vitamin B12 and folate for macrocytic anaemia; haemoglobin electrophoresis if thalassaemia is suspected; or dengue NS1 antigen / antibody if platelets are low with fever. Do not start iron supplementation without confirmation of iron deficiency — in thalassaemia trait, iron supplements are unnecessary and can cause harm.",
    relatedTests: ["iron-studies", "vitamin-b12", "lft", "crp", "fasting-glucose"],
    fastingRequired: false,
    howOften: "Annually as part of routine health screening; every 3–6 months if managing a blood disorder or chronic disease.",
  },

  "vitamin-d": {
    testSlug: "vitamin-d",
    title: "Vitamin D (25-Hydroxy Vitamin D)",
    metaDescription:
      "Understand your Vitamin D results: normal range is 30–100 ng/mL. Learn what deficiency (below 20), insufficiency (20–30), and toxicity (above 100) mean — and why 80–90% of UAE residents are deficient despite year-round sun.",
    overview:
      "The 25-hydroxyvitamin D test (25-OH-D) measures your body's main circulating form of vitamin D — the storage form produced when the liver processes vitamin D3 from sun exposure and diet. It is the gold-standard test for overall vitamin D status. Results are reported in ng/mL (nanograms per millilitre) or nmol/L (multiply ng/mL by 2.5 to convert). Vitamin D is essential for calcium absorption and bone mineralisation, immune function, muscle strength, and mood regulation. Deficiency has been linked to increased risk of osteoporosis, infections, depression, and some chronic diseases.",
    normalRanges: [
      { parameter: "Deficient", range: "< 20", unit: "ng/mL", note: "Supplementation needed" },
      { parameter: "Insufficient", range: "20–30", unit: "ng/mL", note: "Supplementation recommended" },
      { parameter: "Sufficient (optimal)", range: "30–100", unit: "ng/mL", note: "Target range" },
      { parameter: "Potentially toxic", range: "> 100", unit: "ng/mL", note: "Seek medical review" },
    ],
    highMeaning:
      "Vitamin D above 100 ng/mL (250 nmol/L) is considered potentially toxic (hypervitaminosis D). True toxicity — causing hypercalcaemia (elevated blood calcium) with symptoms of nausea, vomiting, weakness, and kidney stones — is rare and almost always caused by excessive supplementation rather than sun exposure. Values of 60–100 ng/mL are considered by most guidelines as safe and within the optimal range. If your level exceeds 100 ng/mL and you are on high-dose supplements, reduce or stop supplementation and recheck in 4–6 weeks. Severe toxicity (above 150 ng/mL) requires medical management to address hypercalcaemia.",
    lowMeaning:
      "Values below 20 ng/mL are classified as deficient. Symptoms of deficiency include persistent fatigue and low energy, diffuse bone pain and muscle aches, muscle weakness (particularly in the legs and hips), frequent infections, low mood or depression, hair thinning, and impaired wound healing. Severe deficiency (below 10 ng/mL) in children causes rickets (bone deformities). In adults, prolonged deficiency accelerates bone loss and increases fracture risk. Many people with deficiency have no obvious symptoms at all — making testing essential.",
    whenToWorry:
      "See a doctor if your level is below 10 ng/mL (severe deficiency), or if you have symptoms of deficiency — particularly bone pain, muscle weakness, or frequent fractures — at any level below 30 ng/mL. Also seek review if you are on high-dose supplements (above 4,000 IU daily) and your level approaches or exceeds 100 ng/mL. Children with vitamin D deficiency, pregnant or breastfeeding women with low levels, and patients with malabsorption disorders (Crohn's, coeliac) should be seen by a doctor rather than self-supplementing.",
    uaeContext:
      "The UAE has one of the highest rates of vitamin D deficiency in the world — studies consistently find deficiency (below 20 ng/mL) in 60–90% of UAE residents, and insufficiency in an additional 10–15%. This paradox — severe deficiency in one of the sunniest places on earth — is explained by several factors: prolonged time in air-conditioned indoor environments; cultural dress practices that limit skin exposure to sunlight; the extreme UV index during summer (April–October) that effectively forces people indoors during peak sun hours; and darker skin tones (higher melanin requires longer UV exposure to produce equivalent vitamin D). The UAE Ministry of Health mandates vitamin D fortification of certain dairy products, but deficiency remains near-universal without supplementation. Testing costs AED 50–120 across UAE labs — affordable relative to its health impact.",
    nextSteps:
      "For deficiency below 20 ng/mL: most UAE doctors prescribe loading doses of 50,000 IU vitamin D3 weekly for 8–12 weeks, followed by a maintenance dose of 1,000–2,000 IU daily. For insufficiency (20–30 ng/mL): a maintenance supplement of 1,000–4,000 IU daily is typically recommended. Retest after 3 months of supplementation to confirm response. Co-supplementation with vitamin K2 (MK-7) supports calcium utilisation and is increasingly recommended alongside vitamin D. Brief daily sun exposure (10–20 minutes of direct skin exposure outside peak UV hours) can help maintain levels.",
    relatedTests: ["cbc", "kft", "iron-studies", "thyroid-panel"],
    fastingRequired: false,
    howOften: "Annually, or every 6 months if correcting a deficiency. Once optimal, test yearly.",
  },

  "vitamin-b12": {
    testSlug: "vitamin-b12",
    title: "Vitamin B12 (Cobalamin)",
    metaDescription:
      "Understand your Vitamin B12 results: normal range 300–900 pg/mL. Learn what B12 deficiency means, who is at risk (vegetarians, metformin users), and the neurological symptoms to watch for.",
    overview:
      "Vitamin B12 (cobalamin) is a water-soluble vitamin essential for three critical processes: DNA synthesis in all dividing cells, maturation of red blood cells, and maintenance of the myelin sheath that insulates nerve fibres. The serum B12 test measures circulating cobalamin in picograms per millilitre (pg/mL) or picomoles per litre (pmol/L). Because the body stores several years' worth of B12 in the liver, deficiency develops slowly — but once neurological damage occurs, it can be irreversible if untreated. This makes early detection and correction essential.",
    normalRanges: [
      { parameter: "Deficient", range: "< 200", unit: "pg/mL", note: "Treatment required" },
      { parameter: "Borderline low", range: "200–300", unit: "pg/mL", note: "Monitor and supplement" },
      { parameter: "Normal", range: "300–900", unit: "pg/mL", note: "Adequate B12 status" },
      { parameter: "High (usually benign)", range: "> 900", unit: "pg/mL", note: "Rarely a concern" },
    ],
    highMeaning:
      "Elevated B12 above 900 pg/mL is common and usually benign — often reflecting recent supplementation, dietary intake (especially from meat, fish, or dairy), or liver release of stored B12. However, very high B12 (above 1,500–2,000 pg/mL) without supplementation can occasionally signal liver disease, certain blood cancers (myeloproliferative disorders), or solid tumours — conditions in which B12-binding proteins are released into circulation. If you have very high B12 without taking supplements, your doctor may order liver function tests and a full blood count.",
    lowMeaning:
      "B12 below 200 pg/mL causes two main problems. First, megaloblastic anaemia: B12 is required for DNA synthesis in red cell precursors; deficiency causes large, immature red cells (macrocytes) that carry oxygen inefficiently, producing fatigue, pallor, and breathlessness. Second, neurological damage: B12 is essential for myelin production; deficiency causes subacute combined degeneration of the spinal cord — beginning as numbness and tingling in the hands and feet (peripheral neuropathy), and potentially progressing to balance problems, weakness, memory impairment, and psychiatric symptoms. Neurological damage can precede anaemia. Symptoms at the borderline level (200–300 pg/mL) include subtle fatigue, memory fog, and mood changes.",
    whenToWorry:
      "Seek prompt medical attention if you have numbness, tingling, or burning in the hands or feet combined with low B12 — neurological B12 damage can be irreversible and requires high-dose injections, not just oral supplements. Also see a doctor if your haemoglobin is low alongside low B12, or if you have a smooth, red, painful tongue (glossitis), which is a classic sign of B12 deficiency. Vegetarians and vegans who have never supplemented B12 should test urgently if experiencing fatigue and neurological symptoms.",
    uaeContext:
      "The UAE's large South Asian expat community — estimated above 3 million — includes a high proportion of lacto-vegetarians and vegans, making B12 deficiency clinically significant in this population. B12 is found exclusively in animal products; plant foods contain negligible B12 unless fortified. Metformin, one of the most prescribed drugs in the UAE given a diabetes prevalence of approximately 17%, reduces intestinal B12 absorption via inhibition of the calcium-dependent ileal receptor — all long-term metformin users should have B12 checked annually. B12 injections (hydroxocobalamin or cyanocobalamin) are widely available at UAE pharmacies and clinics without referral.",
    nextSteps:
      "For confirmed deficiency (below 200 pg/mL) with neurological symptoms: intramuscular B12 injections (1,000 mcg hydroxocobalamin) every other day for 2 weeks, then every 3 months — this bypasses any absorption problem. For dietary deficiency without neurological symptoms: high-dose oral B12 (1,000–2,000 mcg daily) is effective even without intrinsic factor due to passive absorption. Retest after 3 months to confirm response. For vegetarians and vegans: consistent daily supplementation is essential for life — dietary restriction cannot be corrected by diet alone without meat/fish consumption.",
    relatedTests: ["cbc", "iron-studies", "lft", "thyroid-panel"],
    fastingRequired: false,
    howOften: "Annually for vegetarians, vegans, elderly, and metformin users. Every 6 months when correcting deficiency.",
  },

  "lipid-profile": {
    testSlug: "lipid-profile",
    title: "Lipid Profile (Cholesterol Panel)",
    metaDescription:
      "Understand your cholesterol results: LDL, HDL, total cholesterol, and triglycerides. Learn what normal ranges mean, what high LDL and low HDL indicate, and UAE-specific cardiovascular risk context.",
    overview:
      "A lipid profile measures four key fats (lipids) circulating in your blood: total cholesterol (the sum of all cholesterol carried in lipoproteins), LDL-cholesterol ('bad cholesterol' — the primary driver of arterial plaque), HDL-cholesterol ('good cholesterol' — removes cholesterol from arteries back to the liver), and triglycerides (fats derived from dietary carbohydrates and stored energy). Cardiovascular disease is the leading cause of death in the UAE, and the lipid profile is the primary screening tool for assessing your long-term heart attack and stroke risk. Fasting 9–12 hours before the test is required for accurate triglyceride measurement.",
    normalRanges: [
      { parameter: "Total Cholesterol", range: "< 200", unit: "mg/dL", note: "Desirable; 200–239 = borderline; ≥240 = high" },
      { parameter: "LDL Cholesterol", range: "< 100", unit: "mg/dL", note: "Optimal; <70 for high-risk patients" },
      { parameter: "HDL — Men", range: "> 40", unit: "mg/dL", note: ">60 is protective; <40 = risk factor" },
      { parameter: "HDL — Women", range: "> 50", unit: "mg/dL", note: ">60 is protective; <50 = risk factor" },
      { parameter: "Triglycerides", range: "< 150", unit: "mg/dL", note: "150–199 = borderline; ≥200 = high" },
      { parameter: "Non-HDL Cholesterol", range: "< 130", unit: "mg/dL", note: "Total cholesterol minus HDL" },
    ],
    highMeaning:
      "High LDL (above 130 mg/dL) is the primary cardiovascular risk marker. LDL particles deposit in arterial walls, initiating atherosclerotic plaques that narrow arteries and can rupture to cause heart attacks and strokes. For patients with existing heart disease, diabetes, or multiple risk factors, the LDL target is below 70 mg/dL — considerably lower than the population normal. High triglycerides (above 200 mg/dL) are associated with pancreatic risk and often accompany metabolic syndrome (diabetes, obesity, hypertension). Very high triglycerides above 500 mg/dL carry a risk of acute pancreatitis. High total cholesterol is meaningful primarily as a composite — what matters most is the LDL:HDL ratio and absolute LDL level.",
    lowMeaning:
      "Low HDL (below 40 mg/dL in men, below 50 mg/dL in women) is an independent cardiovascular risk factor. HDL removes cholesterol from arterial walls and transports it back to the liver — low HDL means less of this protective reverse transport. Low HDL is commonly associated with physical inactivity, smoking, obesity, and type 2 diabetes — all prevalent in the UAE. Very low total cholesterol (below 150 mg/dL) is uncommon and can occasionally indicate malnutrition, hyperthyroidism, or liver disease. Low triglycerides (below 50 mg/dL) are typically normal and not a clinical concern.",
    whenToWorry:
      "See a doctor if LDL exceeds 190 mg/dL — this level often indicates familial hypercholesterolaemia, a genetic condition requiring statin therapy regardless of other risk factors. Also seek review if triglycerides exceed 500 mg/dL (pancreatitis risk), if HDL is persistently below 30 mg/dL, or if your 10-year cardiovascular risk score (calculated by your doctor using age, blood pressure, smoking status, and lipids) exceeds 10%. Young adults (under 40) with high LDL and a family history of early heart disease require early cardiologist evaluation.",
    uaeContext:
      "Cardiovascular disease is the leading cause of death in the UAE. National health surveys report elevated LDL or total cholesterol in approximately 35–40% of UAE adults. The combination of traditional Emirati cuisine (rich in ghee, red meat, and refined carbohydrates), rapid urbanisation, near-universal car use, and extreme summer heat that discourages outdoor exercise creates a high-risk environment. Statins (rosuvastatin, atorvastatin) are among the most dispensed medications in UAE pharmacies. The UAE's mandatory health insurance framework covers lipid testing for insured employees, and most corporate health plans include annual lipid panels.",
    nextSteps:
      "For borderline or high LDL: lifestyle modification is first-line — adopt a Mediterranean-style diet, reduce saturated and trans fats, increase soluble fibre (oats, legumes), exercise 150 minutes weekly, and lose weight if BMI is elevated. Retest after 3 months of lifestyle changes. If LDL remains above target despite lifestyle modification, or if cardiovascular risk is high, statin therapy is typically initiated. For high triglycerides: reduce refined carbohydrates, sugar, and alcohol; omega-3 fatty acid supplements (2–4 g EPA/DHA daily) are effective at triglyceride levels above 500 mg/dL.",
    relatedTests: ["hba1c", "fasting-glucose", "crp", "lft", "kft"],
    fastingRequired: true,
    howOften: "Every 5 years if normal; annually if on statin therapy or managing cardiovascular risk factors.",
  },

  hba1c: {
    testSlug: "hba1c",
    title: "HbA1c (Glycated Haemoglobin)",
    metaDescription:
      "Understand your HbA1c results: below 5.7% is normal, 5.7–6.4% is pre-diabetes, 6.5%+ is diabetes. Learn what your HbA1c number means and why the UAE has one of the world's highest diabetes rates.",
    overview:
      "HbA1c measures the percentage of haemoglobin molecules in your red blood cells that have been permanently bound to glucose (glycated). Because red blood cells survive 90–120 days before being recycled, HbA1c reflects your average blood glucose over the past 2–3 months — it cannot be manipulated by fasting for a single day, unlike a fasting glucose test. It is expressed as a percentage (NGSP/DCCT standard used in the USA and UAE) or in mmol/mol (IFCC standard used in Europe). HbA1c is both a diagnostic test for diabetes and the primary monitoring tool for diabetes management — used to assess how well blood sugar has been controlled over time.",
    normalRanges: [
      { parameter: "Normal", range: "< 5.7", unit: "%", note: "No diabetes risk indicated" },
      { parameter: "Pre-diabetes", range: "5.7–6.4", unit: "%", note: "Lifestyle intervention recommended" },
      { parameter: "Diabetes", range: "≥ 6.5", unit: "%", note: "Diagnostic if confirmed on repeat" },
      { parameter: "Target (managed diabetes)", range: "< 7.0", unit: "%", note: "ADA guideline for most adults" },
      { parameter: "Tight control target", range: "< 6.5", unit: "%", note: "For younger, lower-risk patients" },
    ],
    highMeaning:
      "HbA1c of 6.5% or above on two separate occasions confirms diabetes mellitus. Each 1% increase in HbA1c above 7% is associated with a significant increase in risk of microvascular complications: diabetic retinopathy (eye damage), nephropathy (kidney damage), and neuropathy (nerve damage). HbA1c above 10% indicates poorly controlled diabetes with high average blood glucose, typically above 240 mg/dL — this level is associated with acute symptoms including excessive thirst, frequent urination, blurred vision, and fatigue. Values above 12% are a medical emergency risk.",
    lowMeaning:
      "HbA1c can be falsely low in conditions that shorten red cell lifespan: haemolytic anaemia, sickle cell disease, iron deficiency anaemia, or recent blood transfusion. In these cases, HbA1c underestimates actual glucose control, and fructosamine or continuous glucose monitoring should be used instead. Genuinely low HbA1c below 4.0% can indicate hypoglycaemia-prone states or insulin-secreting tumours (insulinoma), which are rare.",
    whenToWorry:
      "See a doctor promptly if HbA1c reaches 6.5% or above — diabetes requires formal diagnosis, education, and a management plan including dietary change, exercise, and often medication. If HbA1c is in the pre-diabetes range (5.7–6.4%), intensive lifestyle intervention can prevent or delay progression to diabetes: losing 5–7% of body weight and walking 150 minutes weekly reduces progression risk by 58% (Diabetes Prevention Programme data). Existing diabetics with HbA1c above 8% despite treatment need medication review.",
    uaeContext:
      "The UAE has one of the highest diabetes prevalence rates globally — approximately 17.3% of adults have diagnosed diabetes, and an estimated 25% have pre-diabetes, according to International Diabetes Federation data. A further 10–15% are believed to have undiagnosed diabetes. Contributing factors include a diet historically high in refined carbohydrates (white rice, bread, dates in excess), physical inactivity, obesity, and a strong genetic predisposition in South Asian and Arab populations. HbA1c is included in most UAE corporate health check packages and covered under the DHA Essential Benefits Plan. The DHA's Dubai Diabetes Programme offers subsidised testing at primary health care centres.",
    nextSteps:
      "For pre-diabetes (5.7–6.4%): structured lifestyle programme, dietary counselling, and retest in 6 months. For newly diagnosed diabetes (≥6.5%): see a general practitioner or endocrinologist for formal management — this typically includes dietary education, 150 minutes weekly of moderate-intensity exercise, and initiation of metformin (unless contraindicated). Target HbA1c for most adults is below 7%. Retest every 3 months until controlled, then every 6 months when stable.",
    relatedTests: ["fasting-glucose", "lipid-profile", "kft", "lft", "vitamin-b12"],
    fastingRequired: false,
    howOften: "Every 3 months if managing diabetes. Annually for adults over 35 or with risk factors.",
  },

  tsh: {
    testSlug: "tsh",
    title: "TSH (Thyroid-Stimulating Hormone)",
    metaDescription:
      "Understand your TSH result: normal range is 0.4–4.0 mIU/L. High TSH indicates hypothyroidism; low TSH indicates hyperthyroidism. Learn what subclinical thyroid dysfunction means and when to see a doctor.",
    overview:
      "TSH (thyroid-stimulating hormone) is produced by the pituitary gland and acts as the master regulator of thyroid function. When thyroid hormone levels fall, the pituitary releases more TSH to stimulate the thyroid to produce more T4 and T3. When thyroid hormones are high, TSH is suppressed by negative feedback. This inverse relationship makes TSH an exquisitely sensitive first-line test: even subtle thyroid dysfunction shifts TSH outside the normal range before T4 or T3 levels become abnormal. A TSH alone detects approximately 95% of thyroid disorders.",
    normalRanges: [
      { parameter: "TSH (adult)", range: "0.4–4.0", unit: "mIU/L", note: "Normal pituitary-thyroid axis" },
      { parameter: "TSH (pregnancy — 1st trimester)", range: "0.1–2.5", unit: "mIU/L", note: "Stricter range in pregnancy" },
      { parameter: "TSH (pregnancy — 2nd trimester)", range: "0.2–3.0", unit: "mIU/L" },
      { parameter: "TSH (elderly, >70)", range: "0.4–6.0", unit: "mIU/L", note: "Range widens with age" },
    ],
    highMeaning:
      "TSH above 4.0 mIU/L indicates hypothyroidism — the thyroid is underactive and the pituitary is compensating by releasing more TSH. Primary hypothyroidism (the thyroid itself is failing) is most common; causes include Hashimoto's thyroiditis (autoimmune destruction, the leading cause worldwide), iodine deficiency, post-radioiodine therapy, or surgical removal. Subclinical hypothyroidism — TSH elevated (4–10 mIU/L) with normal Free T4 — is extremely common in women over 40 and often causes subtle symptoms: fatigue, weight gain, cold intolerance, constipation, dry skin, hair loss, and brain fog. TSH above 10 mIU/L almost always warrants levothyroxine therapy. Between 4–10 mIU/L, treatment is individualised.",
    lowMeaning:
      "TSH below 0.4 mIU/L indicates hyperthyroidism — the thyroid is overactive and suppressing pituitary TSH output. Causes include Graves' disease (autoimmune stimulation of TSH receptors, the leading cause), toxic multinodular goitre, and thyroiditis. Symptoms include weight loss despite good appetite, heart palpitations, tremor, heat intolerance, sweating, anxiety, diarrhoea, and insomnia. Suppressed TSH (below 0.1 mIU/L) with elevated Free T4 or T3 is overt hyperthyroidism requiring treatment. In people on levothyroxine, a low TSH may indicate over-replacement and requires dose adjustment.",
    whenToWorry:
      "See a doctor if TSH is below 0.1 mIU/L (overt hyperthyroidism — cardiac risk, including atrial fibrillation), above 10 mIU/L (overt hypothyroidism), or if TSH is in the 4–10 range with symptoms suggesting hypothyroidism. In pregnancy, any TSH above 2.5 mIU/L in the first trimester warrants immediate review — untreated hypothyroidism in pregnancy impairs foetal neurological development. Cardiac patients, the elderly, and those with osteoporosis require careful management of both over- and under-replacement.",
    uaeContext:
      "Thyroid disorders are among the most common endocrine conditions in the UAE. Hashimoto's thyroiditis — the autoimmune cause of hypothyroidism — is more prevalent in South Asian populations, who make up a large share of UAE residents. Iodine intake variability in the region has historically contributed to goitre in certain communities. Subclinical hypothyroidism is particularly common in UAE women aged 30–50. A standalone TSH costs AED 30–70 at UAE labs, making it one of the most affordable high-yield screening tests. Levothyroxine (Euthyrox, Eltroxin) is widely available by prescription at UAE pharmacies.",
    nextSteps:
      "For elevated TSH: confirm with Free T4 and, if suspected autoimmune, anti-TPO antibodies (Hashimoto's marker). For low TSH: confirm with Free T3 and Free T4; TSH receptor antibodies (TRAb) help diagnose Graves' disease. For patients on levothyroxine: TSH is the primary monitoring tool — retest 6–8 weeks after any dose change, then every 6–12 months once stable. Take levothyroxine on an empty stomach 30–60 minutes before breakfast for optimal absorption — do not take with calcium, iron supplements, or coffee.",
    relatedTests: ["thyroid-panel", "cbc", "lipid-profile", "vitamin-d", "vitamin-b12"],
    fastingRequired: false,
    howOften: "Annually for women over 35 or those with risk factors. Every 6–12 months if on thyroid treatment.",
  },

  "thyroid-panel": {
    testSlug: "thyroid-panel",
    title: "Thyroid Function Panel (TSH + Free T4 + Free T3)",
    metaDescription:
      "Understand your thyroid panel results: TSH 0.4–4.0 mIU/L, Free T4 0.8–1.8 ng/dL, Free T3 2.3–4.2 pg/mL. Learn what hypothyroid and hyperthyroid results mean, including Hashimoto's and Graves' disease.",
    overview:
      "A full thyroid panel includes three hormones that work together in the hypothalamic-pituitary-thyroid axis. TSH (from the pituitary) is the most sensitive indicator of overall thyroid function. Free T4 (thyroxine) is the main hormone the thyroid secretes — 'free' means unbound to carrier proteins and biologically available. Free T3 (triiodothyronine) is the most potent active form, largely produced by peripheral conversion of T4 in tissues. Together, these three values allow distinction of primary thyroid disorders (the thyroid itself is failing) from secondary/central disorders (the pituitary or hypothalamus is not stimulating correctly), and help characterise the severity and type of dysfunction.",
    normalRanges: [
      { parameter: "TSH", range: "0.4–4.0", unit: "mIU/L", note: "Key regulatory hormone" },
      { parameter: "Free T4 (thyroxine)", range: "0.8–1.8", unit: "ng/dL", note: "Main thyroid output" },
      { parameter: "Free T3 (triiodothyronine)", range: "2.3–4.2", unit: "pg/mL", note: "Active form" },
      { parameter: "Anti-TPO antibody (if ordered)", range: "< 35", unit: "IU/mL", note: "Hashimoto's marker" },
    ],
    highMeaning:
      "High TSH with low Free T4 = overt primary hypothyroidism — the thyroid is failing, the pituitary is working hard to compensate. High TSH with normal Free T4 = subclinical hypothyroidism — early or mild thyroid failure. High Free T4 and T3 with low TSH = overt hyperthyroidism (Graves' disease or toxic nodule). Isolated high Free T3 with normal or mildly low TSH = T3 toxicosis (rarer form of hyperthyroidism). Elevated anti-TPO antibodies confirm autoimmune thyroiditis (Hashimoto's) — even with a currently normal TSH, this predicts higher risk of developing hypothyroidism over time.",
    lowMeaning:
      "Low TSH with high Free T4 and/or Free T3 = overt hyperthyroidism. Low TSH with normal Free T4 and T3 = subclinical hyperthyroidism — associated with cardiac risk (atrial fibrillation) and bone loss (osteoporosis) in the elderly even without symptoms. Low Free T4 with low or normal TSH = central (secondary) hypothyroidism — the pituitary is not stimulating the thyroid adequately, which requires investigation for a pituitary tumour or dysfunction. Low Free T3 with normal TSH and T4 = 'low T3 syndrome', seen in severe illness, malnutrition, or after major surgery — not a primary thyroid disorder.",
    whenToWorry:
      "Seek urgent review if Free T4 is very high (above 3.0 ng/dL) with very low TSH — this level of hyperthyroidism carries significant cardiac risk. Also urgent: newly detected hypothyroidism in pregnancy (any trimester), myxoedema coma symptoms in severe hypothyroidism (altered consciousness, hypothermia), and thyroid storm symptoms in severe hyperthyroidism (fever, extreme tachycardia, confusion). Anti-TPO antibodies above 600 IU/mL with any degree of elevated TSH usually warrants treatment initiation.",
    uaeContext:
      "The full thyroid panel is widely available across UAE labs. Anti-TPO antibody testing is offered as an add-on and is particularly relevant in the UAE given the higher prevalence of autoimmune thyroid disease in South Asian and Arab populations. Several UAE hospitals (Mediclinic, Cleveland Clinic Abu Dhabi, American Hospital Dubai) run dedicated thyroid clinics. Thyroid ultrasound is frequently ordered alongside a panel if a goitre or nodule is detected on clinical examination.",
    nextSteps:
      "Results should be interpreted by a doctor in the context of your symptoms and history. Do not self-treat thyroid conditions. If Hashimoto's is confirmed with elevated TSH, levothyroxine is prescribed and titrated to maintain TSH in the low-normal range (0.5–2.5 mIU/L). For Graves' hyperthyroidism, options include antithyroid drugs (carbimazole, propylthiouracil), radioactive iodine therapy, or thyroid surgery — UAE endocrinologists follow international guidelines for this choice.",
    relatedTests: ["tsh", "cbc", "lipid-profile", "amh", "vitamin-d"],
    fastingRequired: false,
    howOften: "Annually for women over 35. Every 6–12 months on thyroid treatment.",
  },

  lft: {
    testSlug: "lft",
    title: "Liver Function Tests (LFT)",
    metaDescription:
      "Understand your LFT results: ALT 7–56 U/L, AST 10–40 U/L, ALP 44–147 U/L, bilirubin 0.1–1.2 mg/dL. Learn what elevated liver enzymes mean and why fatty liver disease affects 30–40% of UAE adults.",
    overview:
      "Liver function tests are a panel of blood markers assessing different aspects of liver health. ALT (alanine aminotransferase) and AST (aspartate aminotransferase) are enzymes released when liver cells are injured — ALT is more specific to the liver, AST also rises in heart and muscle injury. ALP (alkaline phosphatase) and GGT (gamma-glutamyl transferase) are elevated in bile duct obstruction and fatty liver disease. Bilirubin (the yellow pigment from haemoglobin breakdown) rises when liver processing or bile outflow is impaired, causing jaundice. Albumin and total protein reflect the liver's protein synthesis capacity — reduced in chronic liver failure.",
    normalRanges: [
      { parameter: "ALT (Alanine Aminotransferase)", range: "7–56", unit: "U/L", note: "Most liver-specific enzyme" },
      { parameter: "AST (Aspartate Aminotransferase)", range: "10–40", unit: "U/L", note: "Liver and muscle enzyme" },
      { parameter: "ALP (Alkaline Phosphatase)", range: "44–147", unit: "U/L", note: "Bile duct and bone" },
      { parameter: "GGT (Gamma-Glutamyl Transferase)", range: "0–51", unit: "U/L", note: "Elevated with alcohol, fatty liver" },
      { parameter: "Bilirubin (total)", range: "0.1–1.2", unit: "mg/dL", note: "Yellow pigment; jaundice above 2.5" },
      { parameter: "Albumin", range: "3.4–5.4", unit: "g/dL", note: "Liver synthetic function marker" },
    ],
    highMeaning:
      "Mildly elevated ALT and AST (up to 3x the upper limit of normal) are most commonly caused by non-alcoholic fatty liver disease (NAFLD), which affects an estimated 30–40% of UAE adults. Other causes include viral hepatitis B or C, alcohol-related liver disease, medication hepatotoxicity (paracetamol overdose, statins, antifungals, anti-TB drugs), and autoimmune hepatitis. ALT more than 10x the upper limit suggests acute hepatocellular injury — viral hepatitis, ischaemic hepatitis, or drug-induced liver injury. Isolated ALP and GGT elevation with normal ALT/AST points to bile duct obstruction (gallstones, cholangitis) or infiltrative liver disease. Elevated bilirubin with elevated transaminases indicates hepatocellular jaundice.",
    lowMeaning:
      "Low albumin (below 3.4 g/dL) is a significant finding indicating impaired liver synthetic function, as seen in cirrhosis or severe chronic liver disease. It can also be reduced in malnutrition, protein-losing enteropathy, or nephrotic syndrome. Very low ALP can occasionally be seen in hypothyroidism or zinc deficiency.",
    whenToWorry:
      "See a doctor promptly if ALT or AST exceed 3x normal (above approximately 170 U/L), if bilirubin rises above 2.5 mg/dL (causing visible yellowing of the skin or eyes), if albumin falls below 3.0 g/dL, or if you develop right upper abdominal pain, dark urine, pale stools, or unexplained weight loss alongside abnormal LFTs. Any jaundice in a previously well person is a medical emergency requiring same-day evaluation. Hepatitis B surface antigen testing should accompany LFTs in anyone with elevated transaminases without an obvious cause.",
    uaeContext:
      "NAFLD (non-alcoholic fatty liver disease) is the most prevalent liver condition in the UAE, directly driven by the high rates of obesity and type 2 diabetes. UAE studies report NAFLD in 25–40% of adults on ultrasound screening. Hepatitis B prevalence in South Asian and African expat populations is higher than in the general UAE population — Hepatitis B surface antigen testing is part of the UAE visa medical, but many adult expats who arrived before widespread vaccination carry chronic infection. Alcohol-related liver disease, while legally restricted in the UAE, is diagnosed in a proportion of the expat population accessing private healthcare.",
    nextSteps:
      "For mildly elevated ALT (up to 2x normal): a repeat LFT after 3 months with lifestyle modification (weight loss, reduced sugar and refined carbohydrates, alcohol reduction) is a reasonable first step. If persistently elevated, your doctor will likely order a liver ultrasound, hepatitis B and C serology, autoimmune markers, and a ferritin level. Significant elevation requires specialist gastroenterology or hepatology referral. Avoid hepatotoxic medications, high-dose paracetamol, and herbal remedies (many can be hepatotoxic) while awaiting investigation.",
    relatedTests: ["kft", "lipid-profile", "hba1c", "cbc", "iron-studies"],
    fastingRequired: false,
    howOften: "Annually as part of routine health screening. Every 3–6 months if managing liver disease or on hepatotoxic medications.",
  },

  kft: {
    testSlug: "kft",
    title: "Kidney Function Tests (KFT / RFT)",
    metaDescription:
      "Understand your KFT results: creatinine 0.7–1.3 mg/dL, BUN 7–20 mg/dL, eGFR >90 normal. Learn what declining eGFR means and why CKD is rising in the UAE alongside the diabetes epidemic.",
    overview:
      "Kidney Function Tests (also called Renal Function Tests or RFT) assess how well your kidneys filter waste products from the blood. Serum creatinine is a muscle metabolism waste product cleared exclusively by the kidneys — it rises as kidney filtration declines. eGFR (estimated glomerular filtration rate) is calculated from creatinine, age, sex, and sometimes ethnicity to give a standardised filtration capacity in mL/min/1.73m². BUN (blood urea nitrogen) is another waste marker. Electrolytes — sodium, potassium, bicarbonate, and chloride — reflect the kidneys' role in fluid and acid-base balance. Together these markers stage chronic kidney disease (CKD) and detect acute kidney injury.",
    normalRanges: [
      { parameter: "Creatinine — Men", range: "0.7–1.3", unit: "mg/dL" },
      { parameter: "Creatinine — Women", range: "0.6–1.1", unit: "mg/dL", note: "Lower due to less muscle mass" },
      { parameter: "BUN (Blood Urea Nitrogen)", range: "7–20", unit: "mg/dL" },
      { parameter: "BUN:Creatinine Ratio", range: "10–20", unit: "ratio", note: "Elevated in dehydration" },
      { parameter: "eGFR — Normal", range: "> 90", unit: "mL/min/1.73m²", note: "Normal kidney function" },
      { parameter: "eGFR — Mildly decreased", range: "60–89", unit: "mL/min/1.73m²", note: "Monitor annually" },
      { parameter: "eGFR — Moderate CKD", range: "30–59", unit: "mL/min/1.73m²", note: "Nephrology referral" },
      { parameter: "eGFR — Severe CKD", range: "< 30", unit: "mL/min/1.73m²", note: "Specialist care required" },
    ],
    highMeaning:
      "Elevated creatinine and a reduced eGFR indicate impaired kidney filtration. The rate of decline matters as much as the absolute value — a rapid rise in creatinine over days to weeks signals acute kidney injury (AKI), which may be due to dehydration, infection, nephrotoxic drugs (NSAIDs, contrast dye, aminoglycoside antibiotics), or obstruction. A gradual rise over months to years indicates chronic kidney disease (CKD), most commonly caused by diabetic nephropathy or hypertensive nephrosclerosis. High potassium (hyperkalaemia, above 5.5 mEq/L) is a dangerous complication of advanced kidney disease and can cause fatal cardiac arrhythmias. Elevated BUN with normal creatinine (high BUN:creatinine ratio above 20) often indicates dehydration rather than kidney disease.",
    lowMeaning:
      "Very low creatinine is usually seen in individuals with low muscle mass (elderly, malnourished, paraplegic) — in these cases, creatinine may be misleadingly normal even with significantly reduced kidney function. Cystatin C, a different filtration marker, is more reliable in low-muscle-mass patients. Low BUN (below 7 mg/dL) can indicate severe liver disease (the liver produces urea), low protein intake, or over-hydration.",
    whenToWorry:
      "Seek urgent medical care if creatinine rises acutely (by 0.3 mg/dL or more within 48 hours), if potassium exceeds 6.0 mEq/L (cardiac emergency), if urine output drops significantly, or if eGFR falls below 30 mL/min/1.73m² — this stage typically requires specialist nephrology care and planning for potential dialysis in the future. Any person with diabetes or hypertension and creatinine above the reference range should see a doctor, even if they feel well.",
    uaeContext:
      "CKD is a growing public health crisis in the UAE, directly linked to the world's highest diabetes and hypertension rates. The UAE Renal Registry reports approximately 1,200 new patients commencing dialysis annually, with diabetic nephropathy the leading cause. Dehydration — from the extreme heat, particularly among outdoor manual workers (predominantly South Asian) — is a significant and under-recognised cause of AKI in the UAE. NSAIDs such as ibuprofen and diclofenac are widely self-purchased over the counter at UAE pharmacies and are a common preventable cause of AKI. Uric acid is often added to KFT panels in UAE labs given the high rates of gout in the South Asian male expat population.",
    nextSteps:
      "For mildly reduced eGFR (60–89): increase water intake, avoid nephrotoxic drugs (NSAIDs, high-dose supplements), control blood pressure below 130/80 mmHg, and optimise diabetes control if relevant. Retest in 3–6 months. For eGFR 30–59: nephrology referral, urine albumin:creatinine ratio to quantify kidney damage, dietary protein moderation, and strict cardiovascular risk management. For eGFR below 30: specialist care, medication dose adjustments, AV fistula planning for possible dialysis, and discussion of renal replacement therapy options.",
    relatedTests: ["hba1c", "lft", "lipid-profile", "fasting-glucose", "iron-studies"],
    fastingRequired: false,
    howOften: "Annually for anyone with diabetes or hypertension. Every 3–6 months for known CKD.",
  },

  "iron-studies": {
    testSlug: "iron-studies",
    title: "Iron Studies (Iron Panel)",
    metaDescription:
      "Understand your iron studies results: serum iron 60–170 µg/dL, ferritin 12–150 ng/mL (women), TIBC 250–370 µg/dL. Learn the difference between iron deficiency and iron overload, and how to interpret each marker.",
    overview:
      "Iron studies go beyond a basic CBC to fully characterise your body's iron status. The panel includes four markers that together paint a complete picture: serum iron (iron currently circulating bound to transferrin), TIBC or total iron-binding capacity (how much transferrin is available to carry iron — rises when stores are depleted), transferrin saturation (the percentage of transferrin occupied by iron, the most direct measure of iron availability for tissues), and ferritin (the intracellular iron storage protein — the single best marker of total body iron stores). These markers work together: iron deficiency produces low ferritin, low serum iron, and high TIBC. Iron overload produces high ferritin, high serum iron, and low TIBC.",
    normalRanges: [
      { parameter: "Serum Iron", range: "60–170", unit: "µg/dL" },
      { parameter: "TIBC (Total Iron-Binding Capacity)", range: "250–370", unit: "µg/dL" },
      { parameter: "Transferrin Saturation", range: "20–50", unit: "%", note: "Below 15% = deficiency" },
      { parameter: "Ferritin — Men", range: "30–300", unit: "ng/mL" },
      { parameter: "Ferritin — Women (premenopausal)", range: "12–150", unit: "ng/mL" },
      { parameter: "Ferritin — Women (postmenopausal)", range: "30–200", unit: "ng/mL" },
    ],
    highMeaning:
      "High ferritin (above 300 ng/mL in men, above 150 ng/mL in women) requires careful interpretation. In most UAE cases, elevated ferritin is a non-specific acute phase reactant — it rises with inflammation, infection, metabolic syndrome, fatty liver disease, and obesity, without indicating true iron overload. Genuine iron overload (haemochromatosis) produces very high ferritin (above 1,000 ng/mL) combined with high transferrin saturation (above 45%). Primary haemochromatosis is a genetic condition more common in people of Northern European ancestry; secondary iron overload can result from multiple blood transfusions in thalassaemia patients.",
    lowMeaning:
      "Iron deficiency follows a predictable sequence: first, iron stores (ferritin) deplete; then, transport iron (serum iron, transferrin saturation) falls and TIBC rises; finally, haemoglobin drops and anaemia appears. Low ferritin below 12 ng/mL is the earliest and most sensitive indicator of iron store depletion, even if haemoglobin is still normal — this is called iron-depleted erythropoiesis, a pre-anaemic state where symptoms (fatigue, hair loss, reduced exercise tolerance) are already present in many people.",
    whenToWorry:
      "See a doctor if ferritin falls below 12 ng/mL, especially with symptoms (fatigue, hair loss, restless legs, pica — craving for non-food items like ice or clay). In menstruating women, investigate the cause of iron loss if ferritin is repeatedly low despite supplementation — heavy menstrual bleeding, fibroids, and gastrointestinal blood loss (from NSAIDs, gastric ulcers, or bowel disease) are common causes. Very high ferritin above 1,000 ng/mL requires specialist investigation to exclude haemochromatosis, malignancy, or Still's disease.",
    uaeContext:
      "Iron deficiency anaemia is the most common nutritional deficiency in the UAE, particularly among South Asian and Filipino women of reproductive age. DHA-affiliated hospital studies report iron deficiency in 15–30% of pregnant women in Dubai. Thalassaemia trait — common in UAE nationals and populations from the Indian subcontinent, Southeast Asia, and the Mediterranean — produces a CBC picture similar to iron deficiency (low MCV, low haemoglobin) but iron stores are normal or elevated. Iron studies distinguish these conditions: low ferritin confirms iron deficiency; normal or elevated ferritin in a person with microcytic anaemia suggests thalassaemia trait, which requires haemoglobin electrophoresis rather than iron supplementation.",
    nextSteps:
      "For iron deficiency anaemia: oral ferrous sulfate or ferrous gluconate 200–325 mg daily (taken with vitamin C to enhance absorption, not with tea, coffee, or calcium). Recheck haemoglobin and ferritin after 8–12 weeks. Continue supplementation for 3–6 months after haemoglobin normalises to replenish stores. For patients who cannot tolerate oral iron or have severe anaemia: intravenous iron infusion (ferric carboxymaltose is widely available in UAE hospitals). Always investigate and treat the source of blood loss — supplementation without addressing the cause will not maintain iron levels.",
    relatedTests: ["cbc", "vitamin-b12", "lft", "thyroid-panel"],
    fastingRequired: true,
    howOften: "Annually for women of reproductive age and frequent blood donors. Every 3–6 months when correcting iron deficiency.",
  },

  "fasting-glucose": {
    testSlug: "fasting-glucose",
    title: "Fasting Blood Glucose",
    metaDescription:
      "Understand your fasting glucose results: normal is below 100 mg/dL, pre-diabetes is 100–125, diabetes is 126+. Learn what your blood sugar result means in the UAE, where 17% of adults have diabetes.",
    overview:
      "Fasting plasma glucose measures the concentration of glucose in your blood after a minimum 8-hour fast, in milligrams per decilitre (mg/dL) or millimoles per litre (mmol/L). In the fasting state, blood glucose primarily reflects the liver's baseline glucose output and the pancreas's ability to secrete enough insulin to keep glucose in a normal range. It is the simplest and most direct test for diagnosing diabetes and pre-diabetes. Unlike HbA1c, fasting glucose reflects a single point in time and can be influenced by recent illness, stress, or medication — two abnormal fasting glucose results on different days are required to confirm a diabetes diagnosis.",
    normalRanges: [
      { parameter: "Normal fasting glucose", range: "< 100", unit: "mg/dL", note: "No impairment" },
      { parameter: "Pre-diabetes (IFG)", range: "100–125", unit: "mg/dL", note: "Impaired fasting glucose" },
      { parameter: "Diabetes (fasting)", range: "≥ 126", unit: "mg/dL", note: "Confirmed on two occasions" },
      { parameter: "Hypoglycaemia", range: "< 70", unit: "mg/dL", note: "Symptomatic below 54" },
      { parameter: "Normal (mmol/L)", range: "< 5.6", unit: "mmol/L", note: "Multiply mg/dL by 0.0555" },
    ],
    highMeaning:
      "Fasting glucose of 126 mg/dL (7.0 mmol/L) or above on two separate occasions confirms diabetes mellitus. A single very high reading (above 200 mg/dL with symptoms of hyperglycaemia — extreme thirst, frequent urination, blurred vision, fatigue) is sufficient for diagnosis without needing a second test. Pre-diabetes (100–125 mg/dL) indicates impaired fasting glucose — insulin resistance is present but the pancreas is still compensating partially. Without lifestyle intervention, approximately 25–30% of people with pre-diabetes progress to type 2 diabetes within 5 years. Persistently high fasting glucose is a direct driver of microvascular and macrovascular complications.",
    lowMeaning:
      "Fasting glucose below 70 mg/dL (3.9 mmol/L) is hypoglycaemia. In non-diabetic people, this is uncommon and warrants investigation for insulinoma (insulin-secreting tumour), adrenal insufficiency, or severe liver disease. In diabetic people on insulin or sulphonylurea medications, hypoglycaemia is a serious medication side effect. Symptoms include shakiness, sweating, confusion, palpitations, and — at very low levels (below 40 mg/dL) — seizures and loss of consciousness.",
    whenToWorry:
      "Any fasting glucose above 200 mg/dL with symptoms requires same-day medical attention. Confirmed fasting glucose of 126 mg/dL or above requires formal diabetes management. If you are a non-diabetic and experience symptoms of hypoglycaemia (shakiness, sweating, confusion during fasting), seek medical evaluation — spontaneous hypoglycaemia in non-diabetics is uncommon and requires investigation. Pre-diabetes at 100–125 mg/dL is a critical intervention window — structured lifestyle changes prevent or significantly delay diabetes onset.",
    uaeContext:
      "With a diabetes prevalence of approximately 17.3% and pre-diabetes approaching 25% of adults, the UAE is one of the most diabetes-affected countries in the world. Fasting glucose testing is part of UAE employer health mandates, visa medicals for certain categories, and the Abu Dhabi Weqaya cardiovascular screening programme. The test requires fasting, which can be challenging during Ramadan — healthcare providers typically advise pre-dawn (suhoor time) testing for accuracy during this period. Post-Ramadan glucose testing often reveals previously undiagnosed diabetes that was masked by inadvertent fasting during Ramadan.",
    nextSteps:
      "For pre-diabetes: structured lifestyle intervention targeting 5–7% weight loss and 150 minutes of moderate-intensity exercise weekly reduces diabetes progression by 58%. Dietary modification (reduce refined carbohydrates, increase fibre and vegetables, reduce sugar-sweetened drinks). Retest fasting glucose and HbA1c every 6 months. Metformin may be considered in high-risk individuals. For new diabetes diagnosis: see a general practitioner or endocrinologist for formal management — typically includes HbA1c, kidney and liver function, lipid profile, and urine albumin to assess for early complications.",
    relatedTests: ["hba1c", "lipid-profile", "kft", "lft", "insulin-fasting"],
    fastingRequired: true,
    howOften: "Annually for adults over 35 or with risk factors. Every 3 months when managing diabetes.",
  },

  testosterone: {
    testSlug: "testosterone",
    title: "Total Testosterone",
    metaDescription:
      "Understand your testosterone results: men normal 300–1,000 ng/dL; women 15–70 ng/dL. Learn what low testosterone in men and high testosterone in women means, and the best time to test.",
    overview:
      "Testosterone is the primary male sex hormone (androgen), produced mainly by the Leydig cells in the testes (and in smaller amounts by the adrenal glands in both sexes). The total testosterone test measures all testosterone in blood — free testosterone (biologically active, approximately 2–3%), albumin-bound (readily available), and SHBG-bound (tightly bound and inactive). For men, testosterone drives libido, muscle mass, bone density, red cell production, mood, and sperm production. For women, testosterone is produced in smaller amounts and is important for libido, energy, and bone density. Testosterone follows a diurnal (daily) rhythm, peaking between 7–10 AM — testing should always be in the morning.",
    normalRanges: [
      { parameter: "Men (adult)", range: "300–1,000", unit: "ng/dL", note: "Morning fasting sample" },
      { parameter: "Men (low threshold)", range: "< 300", unit: "ng/dL", note: "Hypogonadism if symptomatic" },
      { parameter: "Women (adult)", range: "15–70", unit: "ng/dL" },
      { parameter: "Women (high — investigate)", range: "> 80", unit: "ng/dL", note: "PCOS or adrenal source" },
    ],
    highMeaning:
      "In men, testosterone above 1,000 ng/dL on a natural (non-supplemented) sample warrants review — endogenous causes include a testosterone-secreting tumour, though this is rare. In men using testosterone replacement therapy (TRT) or anabolic steroids, high values indicate over-dosing and are associated with erythrocytosis (elevated haematocrit and haemoglobin), prostate stimulation, and suppression of natural sperm production. In women, elevated testosterone (above 70–80 ng/dL) is most commonly caused by polycystic ovary syndrome (PCOS) — associated with irregular periods, hirsutism, acne, and infertility. Adrenal tumours and congenital adrenal hyperplasia are less common causes.",
    lowMeaning:
      "In men, testosterone below 300 ng/dL combined with symptoms of hypogonadism constitutes clinical hypogonadism. Symptoms include reduced libido and erectile dysfunction, fatigue and reduced energy, loss of muscle mass, increased visceral fat, depression and poor concentration, and reduced bone density. Primary hypogonadism (the testes are failing) shows low testosterone with high LH and FSH. Secondary hypogonadism (the pituitary is not stimulating adequately) shows low testosterone with low or inappropriately normal LH and FSH — may indicate a pituitary tumour, opioid use, or significant obesity. In women, low testosterone causes reduced libido and fatigue but rarely warrants treatment.",
    whenToWorry:
      "Men with testosterone below 300 ng/dL and symptoms should see an endocrinologist or urologist. Two morning fasting samples on different days are needed to confirm hypogonadism. If LH and FSH are also low (secondary hypogonadism), pituitary MRI is often warranted to exclude a pituitary tumour. Women with testosterone above 80 ng/dL should have PCOS evaluation (pelvic ultrasound, LH, FSH, prolactin, DHEAS). Adolescent boys with delayed puberty and infertile men undergoing evaluation require specialist assessment.",
    uaeContext:
      "Men's health and testosterone testing is rapidly growing in the UAE, driven by increasing awareness of hypogonadism in middle-aged men and a thriving wellness and hormone optimisation sector in Dubai and Abu Dhabi. The high rates of obesity and metabolic syndrome in the UAE are significant drivers — adipose tissue aromatises testosterone to oestrogen, lowering free testosterone in obese men. Anabolic steroid use among gym-going expats — particularly bodybuilders — is a recognised clinical issue; anabolic steroids suppress the hypothalamic-pituitary-testicular axis, causing secondary hypogonadism that may persist for months to years after cessation. TRT requires an endocrinologist or urologist prescription in the UAE.",
    nextSteps:
      "Confirm with two morning fasting samples. Add LH, FSH, and prolactin to distinguish primary from secondary hypogonadism. For men with secondary hypogonadism, pituitary evaluation is essential before starting TRT. For PCOS in women: lifestyle modification (weight loss), hormonal contraception for menstrual regulation, metformin for insulin resistance, and fertility specialist referral if conception is desired. Do not start TRT without specialist assessment — it permanently suppresses natural testosterone production and causes azoospermia.",
    relatedTests: ["fsh", "amh", "thyroid-panel", "lipid-profile", "hba1c"],
    fastingRequired: true,
    howOften: "As clinically indicated. Men on TRT: every 3–6 months to monitor dose and haematocrit.",
  },

  amh: {
    testSlug: "amh",
    title: "AMH (Anti-Müllerian Hormone)",
    metaDescription:
      "Understand your AMH result: below 1.0 ng/mL means low ovarian reserve, 1.0–3.5 is normal, above 3.5 may indicate PCOS. Learn what AMH means for IVF, egg freezing, and fertility planning.",
    overview:
      "Anti-Müllerian Hormone (AMH) is secreted by the granulosa cells of small antral follicles in the ovaries. Because AMH levels are proportional to the number of remaining primordial follicles (eggs in reserve), it is the most accurate single-marker indicator of a woman's remaining egg supply — her ovarian reserve. Unlike FSH or oestradiol, AMH is relatively stable throughout the menstrual cycle and can be tested on any day. Levels are reported in pmol/L or ng/mL (multiply pmol/L by 0.14 to get ng/mL) and decline progressively from the mid-20s until the menopause, when they become undetectable.",
    normalRanges: [
      { parameter: "Low reserve (concern for fertility)", range: "< 1.0", unit: "ng/mL", note: "Seek fertility assessment" },
      { parameter: "Low-normal", range: "1.0–1.5", unit: "ng/mL", note: "Borderline; age-context important" },
      { parameter: "Normal reserve", range: "1.5–3.5", unit: "ng/mL", note: "Expected for most reproductive-age women" },
      { parameter: "High (possible PCOS)", range: "> 3.5", unit: "ng/mL", note: "Many small follicles" },
      { parameter: "Very high", range: "> 6.0", unit: "ng/mL", note: "Strong PCOS indicator" },
    ],
    highMeaning:
      "AMH above 3.5–4.0 ng/mL indicates a high ovarian reserve — a large number of antral follicles. While this sounds positive, very high AMH (above 6 ng/mL) is strongly associated with polycystic ovary syndrome (PCOS), where many small immature follicles fail to develop normally, causing irregular cycles and anovulation despite abundant follicle numbers. In IVF, high AMH predicts an exaggerated ovarian response to stimulation hormones — increasing the risk of ovarian hyperstimulation syndrome (OHSS), which can be severe and life-threatening. UAE fertility specialists adjust IVF protocols carefully based on AMH level to reduce this risk.",
    lowMeaning:
      "Low AMH (below 1.0 ng/mL) indicates diminished ovarian reserve — fewer remaining eggs than expected for age. This does not mean infertility is certain, but it does mean natural conception and IVF success rates are lower, and the window for fertility treatment may be shorter than anticipated. Causes of premature ovarian reserve decline include genetic factors (Fragile X premutation), autoimmune ovarian failure, prior ovarian surgery (endometrioma removal), chemotherapy, or simply early biological decline. Undetectable AMH (below 0.2 ng/mL) in women under 40 meets criteria for Premature Ovarian Insufficiency (POI).",
    whenToWorry:
      "See a fertility specialist promptly if AMH is below 1.0 ng/mL and you want to conceive — treatment windows are limited and waiting reduces options further. If AMH is undetectable before age 40 with irregular periods and menopausal symptoms (hot flashes, night sweats), seek evaluation for Premature Ovarian Insufficiency. If planning to delay pregnancy beyond your mid-30s, an AMH test in your late 20s or early 30s provides useful information for fertility planning, though it cannot predict when you will stop being fertile altogether.",
    uaeContext:
      "The UAE has a thriving fertility medicine sector, with internationally accredited IVF centres in Dubai and Abu Dhabi (Fakih IVF, Bourn Hall, Medcare, American Hospital IVF). UAE law permits IVF only within marriage, and the large community of married expat couples — many delaying childbearing due to career and financial reasons — drives substantial demand. AMH is a standard part of new patient workups at all UAE fertility centres. It is widely available at UAE diagnostic labs without a referral, and its affordability (AED 280–400) has made proactive ovarian reserve testing increasingly common among women in their late 20s and 30s living in the UAE.",
    nextSteps:
      "AMH should be interpreted alongside a day-2–4 antral follicle count (AFC) on pelvic ultrasound — these together give the most accurate picture of ovarian reserve. For women with low AMH seeking pregnancy: see a reproductive endocrinologist to discuss IVF options and the advisability of egg freezing before reserve declines further. For women with high AMH and PCOS: lifestyle modification (weight loss if overweight) improves ovulation rates; inositol supplementation has evidence for improving follicle quality in PCOS; specialist guidance for IVF stimulation protocols is essential.",
    relatedTests: ["thyroid-panel", "testosterone", "vitamin-d", "fsh"],
    fastingRequired: false,
    howOften: "As needed for fertility planning. No established routine screening interval.",
  },

  psa: {
    testSlug: "psa",
    title: "PSA (Prostate-Specific Antigen)",
    metaDescription:
      "Understand your PSA result: below 4.0 ng/mL is generally normal. Learn what elevated PSA means (it's not always cancer), the grey zone between 4–10 ng/mL, and when to see a urologist in the UAE.",
    overview:
      "PSA (prostate-specific antigen) is a serine protease enzyme produced by prostate gland epithelial cells. In healthy men, small amounts enter the bloodstream; elevated PSA signals disruption of the normal prostate architecture. PSA is not specific to cancer — benign prostatic hyperplasia (BPH, age-related enlargement), prostatitis (prostate infection), recent ejaculation, vigorous cycling, or DRE (digital rectal examination) all raise PSA. Consequently, an elevated PSA is a signal to investigate further, not an automatic cancer diagnosis. PSA can be measured as total PSA, or with the free PSA fraction — a low free-to-total PSA ratio (below 15–25%) increases the probability that an elevated total PSA reflects cancer rather than BPH.",
    normalRanges: [
      { parameter: "PSA < 40 years", range: "< 2.0", unit: "ng/mL" },
      { parameter: "PSA 40–49 years", range: "< 2.5", unit: "ng/mL" },
      { parameter: "PSA 50–59 years", range: "< 3.5", unit: "ng/mL" },
      { parameter: "PSA 60–69 years", range: "< 4.5", unit: "ng/mL" },
      { parameter: "PSA > 70 years", range: "< 6.5", unit: "ng/mL" },
      { parameter: "Grey zone (any age)", range: "4–10", unit: "ng/mL", note: "Requires urologist review" },
      { parameter: "High concern", range: "> 10", unit: "ng/mL", note: "Biopsy discussion warranted" },
    ],
    highMeaning:
      "PSA in the grey zone of 4–10 ng/mL requires urologist evaluation. In this range, approximately 25% of men have prostate cancer on biopsy — the other 75% have BPH or prostatitis. The free PSA ratio helps risk-stratify: free PSA below 10% of total PSA suggests higher cancer probability; above 25% suggests BPH. PSA above 10 ng/mL carries approximately 50% cancer probability and typically warrants biopsy discussion. PSA velocity (rate of rise over 1–2 years) is also important — a rise of more than 0.75 ng/mL per year is concerning even if absolute PSA is below 4.0 ng/mL.",
    lowMeaning:
      "PSA below the age-appropriate reference range is reassuring but does not completely exclude prostate cancer — approximately 15% of prostate cancers occur with PSA below 4.0 ng/mL. Finasteride and dutasteride (medications for BPH or hair loss) suppress PSA by approximately 50% — men on these drugs should have their PSA interpreted against a PSA×2 rule. A downward trend in PSA after prostate cancer treatment (surgery or radiation) is the desired response; any rise after nadir suggests recurrence.",
    whenToWorry:
      "See a urologist if PSA exceeds 4.0 ng/mL (or age-adjusted threshold), if PSA velocity exceeds 0.75 ng/mL per year, or if PSA is above 2.0 ng/mL in a man under 50 with a family history of prostate cancer. Any man with urinary symptoms (poor stream, frequency, nocturia, difficulty initiating urination) and elevated PSA warrants evaluation. African-origin men and those with BRCA2 mutations have elevated prostate cancer risk and should discuss earlier screening starting at age 40–45.",
    uaeContext:
      "Prostate cancer is among the top five cancers in UAE men, according to the UAE National Cancer Registry. Awareness has increased substantially through government cancer campaigns (including Movember initiatives supported by UAE health authorities). Many UAE corporate health plans include PSA in annual check-ups for men over 45. UAE men of South Asian origin have a lower baseline prostate cancer risk than Western populations, while African-origin men carry the highest risk globally. All major UAE diagnostic labs offer both total PSA and free PSA as standalone or bundled in men's health packages.",
    nextSteps:
      "Before retesting for an elevated PSA: abstain from ejaculation for 48 hours, avoid vigorous cycling or prostate massage, and ensure no urinary tract infection is present — these can all falsely elevate PSA. Confirm with a repeat test in 4–6 weeks if no urinary infection is present. Your urologist may order a multiparametric MRI (mpMRI) of the prostate before biopsy — this is now standard of care in the UAE's major centres (Cleveland Clinic Abu Dhabi, American Hospital, Mediclinic) to guide targeted biopsy and reduce unnecessary procedures.",
    relatedTests: ["testosterone", "kft", "cbc"],
    fastingRequired: false,
    howOften: "Annually from age 50 (or 45 for high-risk men) if baseline PSA is above 1.5 ng/mL. Every 2 years if baseline below 1.5 ng/mL.",
  },

  "hiv-test": {
    testSlug: "hiv-test",
    title: "HIV 1/2 Antigen/Antibody Test",
    metaDescription:
      "Understand your HIV test result: non-reactive means negative, reactive requires confirmatory testing. Learn about 4th generation HIV tests, window periods, and the UAE's mandatory HIV testing for visa applications.",
    overview:
      "The standard HIV screening test used in UAE labs is a 4th-generation combination antigen/antibody assay (Ag/Ab combo). This test simultaneously detects HIV-1 p24 antigen (present 11–16 days after infection, before antibodies form) and IgM/IgG antibodies to both HIV-1 and HIV-2. The 4th-generation test reduces the window period — the time between infection and a detectable result — to approximately 18–45 days, compared to 23–90 days for older 3rd-generation antibody-only tests. A reactive (positive) screening result is not diagnostic on its own — confirmatory testing by Western blot, HIV-1/2 antibody differentiation assay, or nucleic acid test (NAT) is required before a definitive HIV diagnosis is made.",
    normalRanges: [
      { parameter: "Screening result — Non-reactive", range: "Negative", unit: "", note: "HIV antibodies/antigen not detected" },
      { parameter: "Screening result — Reactive", range: "Positive", unit: "", note: "Requires confirmatory testing" },
      { parameter: "Window period (4th gen test)", range: "18–45 days", unit: "", note: "Post-exposure to reliable detection" },
    ],
    highMeaning:
      "A reactive (positive) 4th-generation HIV screening result means the test detected HIV antigen or antibodies. This requires a second confirmatory test — a positive screening result alone is not a diagnosis. Confirmatory tests include HIV-1/2 antibody differentiation assay and, if indeterminate, an HIV-1 RNA test (viral load). If both screening and confirmatory tests are positive, an HIV diagnosis is confirmed. HIV is a manageable chronic condition with antiretroviral therapy (ART) — modern treatment enables people with HIV to live near-normal lifespans and to reach an undetectable viral load (which also means they cannot sexually transmit the virus, known as U=U: Undetectable = Untransmittable).",
    lowMeaning:
      "A non-reactive result means HIV-1 p24 antigen and HIV-1/2 antibodies were not detected. This is reliably negative if tested more than 45 days after the last potential exposure. If tested within 45 days of a potential exposure, a false-negative is possible due to the window period — retesting at 45 days and again at 90 days post-exposure is recommended. A negative result does not protect against future infection — consistent condom use and, for high-risk individuals, PrEP (pre-exposure prophylaxis) are the most effective prevention strategies.",
    whenToWorry:
      "If you receive a reactive HIV screening result, do not panic — confirmatory testing is required. Contact your doctor or a DHA/DOH HIV clinic immediately for confirmatory testing and counselling. If you believe you had a high-risk exposure within the past 72 hours, seek emergency medical care immediately for PEP (post-exposure prophylaxis) — a 28-day antiretroviral course that can prevent HIV infection if started promptly. All pregnant women who are HIV positive require immediate antiretroviral therapy to prevent mother-to-child transmission.",
    uaeContext:
      "HIV testing is mandatory in the UAE for visa and residency permit applications. A confirmed positive result historically led to deportation — a policy that deterred voluntary testing among at-risk expat populations. UAE law and policy have evolved, and treatment is available at government hospitals; the DHA and DOH run HIV/AIDS treatment programmes. Testing is available at all major UAE labs and is included in visa medical packages conducted at DHA-authorised screening centres. Results are treated with strict confidentiality at licensed facilities. UAE public health campaigns have increasingly emphasised HIV testing as a routine health matter, and some private clinics offer anonymous testing.",
    nextSteps:
      "For a confirmed HIV diagnosis: see an infectious disease specialist or HIV physician immediately. Modern first-line antiretroviral therapy (ART) in the UAE typically consists of a single daily pill combining two or three agents (integrase inhibitor-based regimens). With treatment, most people reach an undetectable viral load within 3–6 months. Regular monitoring includes CD4 cell count, viral load, kidney and liver function, lipid profile, and screening for opportunistic infections. For HIV-negative high-risk individuals: discuss PrEP (Truvada or Descovy) with an infectious disease specialist — PrEP is available in the UAE by prescription.",
    relatedTests: ["cbc", "lft", "kft", "vitamin-b12"],
    fastingRequired: false,
    howOften: "At least once for all adults (15–65). Annually for those at elevated risk.",
  },

  crp: {
    testSlug: "crp",
    title: "C-Reactive Protein (CRP / hs-CRP)",
    metaDescription:
      "Understand your CRP result: below 1 mg/L is low cardiovascular risk, 1–3 is average, above 3 is high risk or inflammation. Learn the difference between standard CRP and high-sensitivity hs-CRP.",
    overview:
      "C-Reactive Protein (CRP) is produced by the liver in response to inflammation anywhere in the body. It is the most widely used blood marker of acute-phase inflammation. Two versions are clinically used: standard CRP (range 0–10 mg/L, used to detect significant infections and inflammatory conditions) and high-sensitivity CRP (hs-CRP, range 0–10 mg/L measured with greater precision, used to assess chronic low-grade inflammation and cardiovascular risk). For cardiac risk assessment, hs-CRP is the relevant test. CRP can rise within 6 hours of injury or infection, peak at 48 hours, and return to normal within days of resolution — making it a useful real-time inflammation tracker.",
    normalRanges: [
      { parameter: "Low cardiovascular risk (hs-CRP)", range: "< 1.0", unit: "mg/L" },
      { parameter: "Average cardiovascular risk (hs-CRP)", range: "1.0–3.0", unit: "mg/L" },
      { parameter: "High cardiovascular risk (hs-CRP)", range: "> 3.0", unit: "mg/L", note: "Exclude acute infection first" },
      { parameter: "Mild inflammation (standard CRP)", range: "1–10", unit: "mg/L" },
      { parameter: "Active infection / major inflammation", range: "10–100", unit: "mg/L" },
      { parameter: "Severe bacterial infection / major trauma", range: "> 100", unit: "mg/L" },
    ],
    highMeaning:
      "For cardiac risk (hs-CRP): values above 3 mg/L, once acute infection and illness are excluded, indicate elevated chronic low-grade inflammation — a recognised independent cardiovascular risk factor beyond LDL cholesterol. The JUPITER trial demonstrated that statin therapy in people with normal LDL but elevated hs-CRP reduced cardiac events by 44%. Elevated hs-CRP is strongly associated with metabolic syndrome, obesity, type 2 diabetes, and physical inactivity — all highly prevalent in the UAE. For acute inflammation (standard CRP): CRP above 100 mg/L typically indicates bacterial infection or major tissue injury; values above 300 mg/L are seen in severe sepsis, burns, and organ infarction.",
    lowMeaning:
      "CRP below 1 mg/L indicates minimal systemic inflammation and low cardiovascular risk contribution from the inflammatory pathway. Very low CRP is normal and healthy. In the context of a suspected infection where CRP remains normal, a bacterial cause is less likely — viral infections typically produce modest CRP elevation (5–30 mg/L), while bacterial infections commonly push CRP above 50 mg/L.",
    whenToWorry:
      "See a doctor promptly if CRP exceeds 100 mg/L — this level almost always indicates serious bacterial infection or major tissue damage requiring urgent evaluation. For hs-CRP consistently above 3 mg/L (with infection excluded by normal WBC and absence of acute symptoms): discuss cardiovascular risk optimisation with your doctor, including statin therapy consideration, intensive lifestyle modification, and addressing metabolic risk factors. CRP above 200 mg/L with fever, rigors, and localising symptoms is a medical emergency.",
    uaeContext:
      "Elevated CRP is common in the UAE population given the high prevalence of obesity, metabolic syndrome, type 2 diabetes, and physical inactivity — all conditions that drive chronic low-grade inflammation. hs-CRP is increasingly included in UAE corporate wellness panels and cardiovascular risk assessments. UAE cardiologists generally follow American Heart Association guidelines for hs-CRP interpretation in risk stratification. CRP is also ordered routinely in UAE emergency departments for assessment of febrile patients and suspected sepsis, where it guides antibiotic prescribing decisions.",
    nextSteps:
      "For elevated hs-CRP (1–3 mg/L): address modifiable inflammatory drivers — achieve a healthy weight, increase physical activity to 150 minutes weekly, adopt an anti-inflammatory diet (Mediterranean pattern, reduce processed foods and sugar), treat gum disease (a significant source of systemic inflammation), and optimise sleep. Retest after 3 months of lifestyle changes. For hs-CRP persistently above 3 mg/L: discuss statin therapy with your cardiologist regardless of LDL level — evidence supports treatment in this context. For high standard CRP during illness: it normalises spontaneously once the underlying infection or inflammation resolves.",
    relatedTests: ["cbc", "lipid-profile", "lft", "hba1c", "esr"],
    fastingRequired: false,
    howOften: "As part of annual cardiovascular risk assessment, or as clinically indicated during illness.",
  },
};

// ─── Static Routes ────────────────────────────────────────────────────────────

const RESULT_SLUGS = Object.keys(TEST_INTERPRETATIONS);

export function generateStaticParams() {
  return RESULT_SLUGS.map((test) => ({ test }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({ params }: { params: { test: string } }): Metadata {
  const interp = TEST_INTERPRETATIONS[params.test];
  if (!interp) return { title: "Test Results — Not Found" };

  const base = getBaseUrl();
  return {
    title: `${interp.title} Results Explained — Normal Ranges & What They Mean | UAE Lab Guide`,
    description: interp.metaDescription,
    alternates: { canonical: `${base}/labs/results/${params.test}` },
    openGraph: {
      title: `Understanding Your ${interp.title} Results`,
      description: interp.metaDescription,
      url: `${base}/labs/results/${params.test}`,
      type: "article",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LabResultsPage({ params }: { params: { test: string } }) {
  const interp = TEST_INTERPRETATIONS[params.test];
  if (!interp) notFound();

  const base = getBaseUrl();
  const labTest = getLabTest(interp.testSlug);
  const priceRange = labTest ? getPriceRange(interp.testSlug) : null;

  const faqs = [
    {
      question: `What is a normal ${interp.title} level?`,
      answer: `Normal ${interp.title} ranges vary by parameter. ${interp.normalRanges.map((r) => `${r.parameter}: ${r.range} ${r.unit}`).join("; ")}. Always compare your results against the reference range on your specific lab report, as ranges can vary slightly between laboratories.`,
    },
    {
      question: `What causes high ${interp.title}?`,
      answer: interp.highMeaning,
    },
    {
      question: `Do I need to fast before a ${interp.title} test?`,
      answer: interp.fastingRequired
        ? `Yes, fasting for 8–12 hours is required before this test. You may drink water during the fasting period. Morning appointments (7–10 AM) are recommended so you can fast overnight without disruption.`
        : `No, fasting is not required for this test. It can be done at any time of day without dietary restrictions.`,
    },
    {
      question: `How often should I get a ${interp.title} test?`,
      answer: interp.howOften,
    },
  ];

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Test Results Guide", url: `${base}/labs/results` },
    { name: interp.title },
  ];

  const medicalWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${interp.title} Results Explained`,
    description: interp.metaDescription,
    url: `${base}/labs/results/${params.test}`,
    lastReviewed: "2026-03-01",
    reviewedBy: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
    },
    about: {
      "@type": "MedicalTest",
      name: interp.title,
    },
    audience: {
      "@type": "PatientsAudience",
      audienceType: "Patients",
    },
  };

  return (
    <div className="container-tc py-8">
      {/* Structured Data */}
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block", ".result-summary"])} />
      <JsonLd data={medicalWebPageSchema} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Results Guide", href: "/labs/results" },
          { label: interp.title },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] bg-accent-muted text-accent-dark px-2 py-0.5 font-bold uppercase tracking-wide">
            Test Results Guide
          </span>
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3">
          Understanding Your {interp.title} Results
        </h1>

        {/* Answer block — AEO primary target */}
        <div className="answer-block result-summary bg-light-50 border-l-4 border-accent p-5 mb-6" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">{interp.overview}</p>
        </div>

        {/* Fasting notice */}
        {interp.fastingRequired && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Fasting required:</strong> Do not eat or drink (except water) for 8–12 hours before this test. Morning appointments are recommended.
            </p>
          </div>
        )}
      </div>

      {/* Normal Reference Ranges */}
      <section className="mb-8">
        <div className="section-header mb-4">
          <h2 className="text-base font-bold text-dark">Normal Reference Ranges</h2>
          <span className="arrows text-accent">&gt;&gt;&gt;</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-light-100">
                <th className="text-left text-xs font-bold text-dark px-4 py-3 border border-light-200">Parameter</th>
                <th className="text-left text-xs font-bold text-dark px-4 py-3 border border-light-200">Normal Range</th>
                <th className="text-left text-xs font-bold text-dark px-4 py-3 border border-light-200">Unit</th>
                <th className="text-left text-xs font-bold text-dark px-4 py-3 border border-light-200">Note</th>
              </tr>
            </thead>
            <tbody>
              {interp.normalRanges.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-light-50"}>
                  <td className="px-4 py-3 border border-light-200 font-medium text-dark text-xs">{row.parameter}</td>
                  <td className="px-4 py-3 border border-light-200 font-bold text-accent text-xs">{row.range}</td>
                  <td className="px-4 py-3 border border-light-200 text-muted text-xs">{row.unit}</td>
                  <td className="px-4 py-3 border border-light-200 text-muted text-xs">{row.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Reference ranges may vary slightly between laboratories. Always compare your result to the range printed on your specific lab report.
        </p>
      </section>

      {/* What High Results Mean */}
      <section className="answer-block mb-6" data-answer-block="true">
        <div className="bg-red-50 border-l-4 border-red-400 p-5">
          <h2 className="text-base font-bold text-dark mb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-red-500" />
            What High {interp.title} Results Mean
          </h2>
          <p className="text-sm text-muted leading-relaxed">{interp.highMeaning}</p>
        </div>
      </section>

      {/* What Low Results Mean */}
      <section className="answer-block mb-6" data-answer-block="true">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-5">
          <h2 className="text-base font-bold text-dark mb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-500" />
            What Low {interp.title} Results Mean
          </h2>
          <p className="text-sm text-muted leading-relaxed">{interp.lowMeaning}</p>
        </div>
      </section>

      {/* When to See a Doctor */}
      <section className="answer-block mb-6" data-answer-block="true">
        <div className="bg-orange-50 border-l-4 border-orange-400 p-5">
          <h2 className="text-base font-bold text-dark mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            When to See a Doctor
          </h2>
          <p className="text-sm text-muted leading-relaxed">{interp.whenToWorry}</p>
        </div>
      </section>

      {/* UAE Health Context */}
      <section className="answer-block mb-6" data-answer-block="true">
        <div className="bg-light-50 border border-light-200 p-5">
          <h2 className="text-base font-bold text-dark mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-accent" />
            UAE Health Context
          </h2>
          <p className="text-sm text-muted leading-relaxed">{interp.uaeContext}</p>
        </div>
      </section>

      {/* What to Do Next */}
      <section className="answer-block mb-8" data-answer-block="true">
        <div className="bg-green-50 border-l-4 border-green-400 p-5">
          <h2 className="text-base font-bold text-dark mb-2">What to Do Next</h2>
          <p className="text-sm text-muted leading-relaxed">{interp.nextSteps}</p>
        </div>
      </section>

      {/* Related Tests */}
      {interp.relatedTests.length > 0 && (
        <section className="mb-8">
          <div className="section-header mb-4">
            <h2 className="text-base font-bold text-dark">Related Tests Often Ordered Together</h2>
            <span className="arrows text-accent">&gt;&gt;&gt;</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {interp.relatedTests.map((slug) => {
              const relatedInterp = TEST_INTERPRETATIONS[slug];
              const relatedLabTest = getLabTest(slug);
              const label = relatedInterp?.title ?? relatedLabTest?.shortName ?? slug.toUpperCase();
              const hasResultsPage = !!relatedInterp;
              return (
                <Link
                  key={slug}
                  href={hasResultsPage ? `/labs/results/${slug}` : `/labs/test/${slug}`}
                  className="inline-flex items-center gap-1 text-xs bg-light-100 border border-light-200 text-dark px-3 py-1.5 hover:bg-accent-muted hover:text-accent-dark hover:border-accent transition-colors"
                >
                  {label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Compare Prices CTA */}
      {labTest && priceRange && (
        <section className="mb-8">
          <div className="bg-accent-muted border border-accent p-5">
            <h2 className="text-base font-bold text-dark mb-1">
              Compare Prices for This Test in the UAE
            </h2>
            <p className="text-sm text-muted mb-3">
              {interp.title} costs from{" "}
              <strong className="text-accent">{formatPrice(priceRange.min)}</strong> to{" "}
              <strong>{formatPrice(priceRange.max)}</strong> across UAE labs. Compare all prices and book directly.
            </p>
            <Link
              href={`/labs/test/${interp.testSlug}`}
              className="inline-flex items-center gap-2 bg-accent text-white text-xs font-bold px-4 py-2 hover:bg-accent-dark transition-colors"
            >
              See all prices for {labTest.shortName}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FaqSection title="Frequently Asked Questions" faqs={faqs} />

      {/* Medical Disclaimer */}
      <section className="mt-10 mb-6">
        <div className="bg-light-50 border border-light-200 p-5">
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-dark">Medical Disclaimer:</strong> The information on this page is provided for
            general educational purposes only and is not a substitute for professional medical advice, diagnosis, or
            treatment. Reference ranges are general guidelines — your doctor will interpret your results in the context
            of your full clinical picture, symptoms, and medical history. If you have concerns about your test results,
            always consult a licensed healthcare professional. Do not delay seeking medical advice or disregard
            professional medical guidance because of information on this page.
          </p>
        </div>
      </section>
    </div>
  );
}
