import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, Clock, Droplets, BookOpen, Users } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { TestPriceTable } from "@/components/labs/TestPriceTable";
import {
  LAB_TESTS,
  getLabTest,
  getTestPriceComparison,
  getTestsByCategory,
  getTestCategoryLabel,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema, labTestProductSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Medical Education Content ──────────────────────────────────────────────────

interface TestMedicalContent {
  whatItMeasures: string;
  whoShouldGetTested: string;
  uaeContext: string;
}

const TEST_MEDICAL_CONTENT: Record<string, TestMedicalContent> = {
  cbc: {
    whatItMeasures:
      "A Complete Blood Count measures three primary cell lines produced by bone marrow: red blood cells (which carry oxygen via haemoglobin), white blood cells (the immune system's frontline cells, broken down into neutrophils, lymphocytes, monocytes, eosinophils, and basophils), and platelets (tiny cell fragments critical for clot formation). The CBC also reports haematocrit (the percentage of blood volume occupied by red cells) and mean corpuscular volume (MCV), which helps classify the type of anaemia when present.",
    whoShouldGetTested:
      "A CBC is one of the most commonly ordered tests worldwide and is appropriate for almost any clinical situation: routine annual health screening, pre-operative assessment, investigation of persistent fatigue, unexplained weight loss, fever of unknown origin, or bruising/bleeding concerns. Children with recurrent infections, pregnant women (to screen for anaemia), and expats undergoing visa medicals in the UAE routinely have a CBC included in their workup.",
    uaeContext:
      "Iron-deficiency anaemia is highly prevalent in the UAE, particularly among South Asian and Filipino expat women, with some studies estimating rates above 30% in certain demographics. Thalassaemia trait is also more common in populations from the Indian subcontinent and Middle East — a CBC is the first step in identifying both conditions. UAE visa medical requirements for domestic workers and certain job categories mandate a CBC as part of the entry screening.",
  },
  "vitamin-d": {
    whatItMeasures:
      "The 25-hydroxyvitamin D (25-OH-D) test measures the total serum concentration of the main circulating form of vitamin D in nanomoles per litre (nmol/L) or nanograms per millilitre (ng/mL). This form, produced when the liver hydroxylates vitamin D3 (from sun exposure and diet), is the best clinical indicator of overall vitamin D status. It does not directly measure the active hormone form (1,25-dihydroxyvitamin D), but reflects the body's overall storage and recent input. Values below 50 nmol/L are generally classified as deficient; 50–75 nmol/L as insufficient; and above 75 nmol/L as sufficient.",
    whoShouldGetTested:
      "Adults with symptoms of deficiency — persistent fatigue, diffuse musculoskeletal aches, low mood, hair thinning, or frequent infections — should be tested. High-risk groups include those with limited outdoor exposure, darker skin tones (higher melanin reduces UV-driven synthesis), obesity, malabsorption disorders, and postmenopausal women concerned about bone density. Many UAE employers now include Vitamin D in annual corporate wellness panels due to the high regional prevalence.",
    uaeContext:
      "The UAE has one of the highest documented rates of vitamin D deficiency in the world, with studies finding deficiency (below 50 nmol/L) in 60–80% of UAE residents. Despite abundant sunlight, cultural dress practices, prolonged time indoors in air-conditioned environments, and the high UV index that discourages outdoor activity during summer months all contribute to this paradox. The UAE Ministry of Health mandates vitamin D fortification of certain dairy products, but supplementation remains widely recommended. Testing is inexpensive (AED 50–120 across UAE labs) relative to the health impact of undetected deficiency.",
  },
  "vitamin-b12": {
    whatItMeasures:
      "The Vitamin B12 test measures serum cobalamin levels, typically in picograms per millilitre (pg/mL) or picomoles per litre (pmol/L). B12 is a water-soluble vitamin essential for DNA synthesis, the maturation of red blood cells, and the maintenance of the myelin sheath that insulates nerve fibres. Low B12 disrupts these processes, causing megaloblastic anaemia (large, immature red cells) and progressive neurological damage — the latter of which can be irreversible if deficiency is prolonged. Reference ranges vary by lab but levels below 200 pg/mL are generally considered deficient.",
    whoShouldGetTested:
      "Vegetarians and vegans — who consume no B12-containing animal products — are at highest risk and should test annually. Others at risk include those over 60 (reduced gastric acid impairs B12 absorption), long-term metformin users (the drug reduces intestinal B12 uptake), people with autoimmune gastritis or Helicobacter pylori infection, and anyone with symptoms of peripheral neuropathy (numbness or tingling in hands/feet), unexplained fatigue, or mood changes.",
    uaeContext:
      "The UAE's large South Asian expat population — estimated at over 3 million individuals — includes a high proportion of lacto-vegetarians and vegans, making B12 deficiency a clinically significant concern in this demographic. Metformin is one of the most commonly prescribed drugs in the UAE given the high rates of type 2 diabetes (affecting approximately 17% of adults), meaning B12 monitoring is relevant for a large share of the diabetic population. B12 injections and high-dose oral supplementation are widely available over the counter at UAE pharmacies.",
  },
  "lipid-profile": {
    whatItMeasures:
      "A lipid profile measures four key lipid parameters in the blood: total cholesterol (the sum of all cholesterol carried in lipoproteins), LDL-cholesterol (low-density lipoprotein — the primary atherogenic lipoprotein that deposits in arterial walls), HDL-cholesterol (high-density lipoprotein — the cardioprotective 'reverse transport' particle), and triglycerides (fats derived from dietary carbohydrates and stored energy). Some labs also report non-HDL cholesterol and the total cholesterol-to-HDL ratio, both of which are stronger cardiovascular risk predictors than LDL alone.",
    whoShouldGetTested:
      "Adults over 35 (or over 25 with risk factors) should have a baseline lipid profile and repeat testing every 5 years if normal, or annually if on lipid-lowering therapy or managing cardiovascular risk factors. Higher priority individuals include those with a personal or family history of early heart disease, hypertension, diabetes, obesity, or smoking. Fasting for 9–12 hours before the test is required because recent food intake significantly elevates triglyceride levels and can affect calculated LDL.",
    uaeContext:
      "Cardiovascular disease is the leading cause of death in the UAE. Dyslipidaemia is highly prevalent — national studies report elevated LDL or total cholesterol in approximately 35–40% of UAE adults. The high-fat traditional Emirati diet, rapid urbanisation, physical inactivity, and the extreme heat that discourages outdoor exercise all contribute. The UAE's mandatory health insurance framework covers lipid testing for insured employees, and most corporate health plans include it in annual check-ups. Statins (rosuvastatin, atorvastatin) are among the most dispensed medications in UAE pharmacies.",
  },
  hba1c: {
    whatItMeasures:
      "HbA1c (glycated haemoglobin) measures the percentage of haemoglobin A molecules in red blood cells that have been irreversibly glycated — i.e., bound to glucose. Because red blood cells survive for approximately 90–120 days before being broken down, the HbA1c value reflects average blood glucose exposure over the preceding 2–3 months. It is expressed as a percentage (NGSP/DCCT standard) or in mmol/mol (IFCC standard). Values below 5.7% are normal; 5.7–6.4% indicates pre-diabetes; 6.5% and above is diagnostic of diabetes.",
    whoShouldGetTested:
      "Anyone with a fasting glucose above 100 mg/dL, symptoms of hyperglycaemia (polyuria, polydipsia, fatigue), obesity (BMI above 25), a family history of type 2 diabetes, gestational diabetes history, or polycystic ovarian syndrome (PCOS) should be tested. People diagnosed with diabetes use HbA1c every 3–6 months to assess treatment efficacy. Unlike fasting glucose, HbA1c does not require fasting, making it practical to test at any time of day.",
    uaeContext:
      "The UAE has one of the highest diabetes prevalence rates globally — approximately 17% of adults have diagnosed diabetes, and up to 25% have pre-diabetes, according to the International Diabetes Federation. A significant portion remains undiagnosed. UAE health authorities actively promote diabetes screening through the annual National Health Survey and employer wellness mandates. HbA1c is included in most UAE corporate health check packages and is covered under the Essential Benefits Plan for insured employees. The DHA's Dubai Diabetes Programme offers subsidised testing at primary health care centres.",
  },
  "thyroid-panel": {
    whatItMeasures:
      "A thyroid panel typically includes TSH (thyroid-stimulating hormone), Free T4 (thyroxine — the main hormone secreted by the thyroid gland), and Free T3 (triiodothyronine — the biologically active form produced by peripheral conversion of T4). TSH, secreted by the pituitary, is the most sensitive indicator of thyroid axis dysfunction — it rises when the thyroid is underactive (hypothyroidism) and falls when it is overactive (hyperthyroidism). Free T4 and T3 provide direct information about circulating thyroid hormone levels and help distinguish primary from secondary thyroid disorders.",
    whoShouldGetTested:
      "Women over 35 have a substantially higher lifetime risk of thyroid dysfunction and are commonly screened during routine check-ups. Indications for a full panel include unexplained weight gain or loss, cold or heat intolerance, persistent fatigue, palpitations, depression or anxiety without a clear psychiatric cause, hair loss, constipation or diarrhoea, irregular menstrual cycles, or infertility. Pregnant women should have TSH checked in the first trimester. People on thyroid hormone replacement (levothyroxine) typically check every 6–12 months.",
    uaeContext:
      "Thyroid disorders are among the most common endocrine conditions in the UAE. The South Asian expat population has a higher genetic predisposition to autoimmune thyroid disease (Hashimoto's thyroiditis), and iodine intake variability within the region has historically contributed to goitre in certain communities. Several UAE labs offer thyroid antibody testing (anti-TPO, anti-thyroglobulin) as an add-on to the standard panel, which helps distinguish autoimmune from non-autoimmune thyroid dysfunction — relevant for treatment decisions.",
  },
  tsh: {
    whatItMeasures:
      "TSH (thyroid-stimulating hormone) is a pituitary glycoprotein hormone that regulates thyroid gland activity. When circulating thyroid hormones are low, the pituitary releases more TSH to stimulate the thyroid to produce more T4 and T3. When thyroid hormones are high, TSH is suppressed by negative feedback. This inverse relationship means TSH is an extremely sensitive first-line test: even subtle thyroid dysfunction causes TSH to shift outside the normal range (approximately 0.4–4.0 mIU/L) before Free T4 levels become abnormal.",
    whoShouldGetTested:
      "A TSH alone is the recommended first-line test for most patients with suspected thyroid dysfunction when no complex secondary thyroid disorder is suspected. It is appropriate for routine screening in women over 35, for patients with fatigue, weight changes, hair loss, or palpitations, and for monitoring of patients on levothyroxine therapy (checked every 6–12 months once stable). TSH is also checked routinely in newborns in the UAE's national neonatal screening programme to detect congenital hypothyroidism.",
    uaeContext:
      "Subclinical hypothyroidism — elevated TSH with normal Free T4 — is particularly common in the UAE among middle-aged women, mirroring global trends. UAE endocrinologists generally follow American Thyroid Association guidelines for treatment thresholds. TSH testing is available at all major UAE labs; a standalone TSH costs AED 30–70, making it one of the most affordable and high-yield screening tests available. The UAE's high proportion of South Asian residents adds relevance given the higher population prevalence of autoimmune thyroid disease in this demographic.",
  },
  lft: {
    whatItMeasures:
      "Liver Function Tests (LFTs) are a panel of blood tests that assess different aspects of liver health. The key parameters are: ALT (alanine aminotransferase) and AST (aspartate aminotransferase) — enzymes released into the blood when liver cells are damaged; ALP (alkaline phosphatase) and GGT (gamma-glutamyl transferase) — enzymes elevated in cholestatic (bile-flow obstructive) conditions; bilirubin (total and direct) — the yellow pigment derived from haemoglobin breakdown, elevated in jaundice; and albumin and total protein — markers of the liver's synthetic function, reduced in chronic liver disease.",
    whoShouldGetTested:
      "LFTs are ordered for anyone with jaundice (yellow skin or eyes), right upper abdominal pain, unexplained fatigue, nausea, or dark urine. They are routinely checked before starting medications known to be hepatotoxic (statins, antifungals, anti-tuberculosis drugs, paracetamol at high doses) and periodically while on these drugs. People with alcohol use disorder, obesity, metabolic syndrome, or a history of hepatitis B or C infection require regular LFT monitoring.",
    uaeContext:
      "Non-alcoholic fatty liver disease (NAFLD) is highly prevalent in the UAE, with studies estimating it affects 25–35% of the adult population — driven by the high rates of obesity and type 2 diabetes. NAFLD frequently presents with mildly elevated ALT and AST, and is often discovered incidentally on an LFT panel ordered for another reason. Hepatitis B vaccination is mandatory in the UAE childhood immunisation schedule, but many adult expats who grew up before vaccination programmes may be Hepatitis B carriers — LFTs plus a Hepatitis B surface antigen test are recommended for this group.",
  },
  kft: {
    whatItMeasures:
      "Kidney Function Tests (KFTs) evaluate the kidneys' ability to filter waste from the blood. The core markers are: serum creatinine — a metabolic waste product of muscle activity cleared solely by the kidneys, rising as filtration falls; blood urea nitrogen (BUN) — another nitrogenous waste product, affected by protein intake and hydration as well as renal function; eGFR (estimated glomerular filtration rate) — calculated from creatinine, age, and sex to give a standardised measure of filtration capacity in mL/min/1.73m²; and electrolytes (sodium, potassium, bicarbonate, chloride) — reflecting the kidney's role in electrolyte and acid-base balance.",
    whoShouldGetTested:
      "Anyone with diabetes, hypertension, or a family history of kidney disease should have annual KFTs as both conditions are the leading causes of chronic kidney disease (CKD) globally. Additional indications include: recurrent urinary tract infections, kidney stones, swelling in the legs (oedema), reduced urine output, or symptoms of uraemia (nausea, confusion, itching). Patients on nephrotoxic drugs (NSAIDs, aminoglycoside antibiotics, contrast agents, certain chemotherapy agents) require monitoring.",
    uaeContext:
      "Chronic kidney disease is a growing concern in the UAE, directly linked to the high prevalence of diabetes and hypertension. The UAE Renal Registry reports approximately 1,200 new patients commencing dialysis annually, with diabetic nephropathy accounting for the largest share. The UAE national insurance mandate means KFTs are typically covered under corporate health plans, and early CKD detection is a priority in DHA and DOH primary care guidelines. Uric acid is often added to KFT panels in the UAE given high rates of gout in the South Asian male expat population.",
  },
  "iron-studies": {
    whatItMeasures:
      "Iron studies go beyond a basic CBC to characterise the body's iron stores and transport capacity. The standard panel includes: serum iron — the amount of iron currently circulating bound to transferrin; TIBC (total iron-binding capacity) — a measure of transferrin availability, which increases when iron stores are low; transferrin saturation — calculated as (serum iron / TIBC) × 100, the most direct indicator of how much iron is available for use; and ferritin — the primary intracellular iron storage protein, whose serum level is the single best marker of total body iron stores (low = depleted stores; very high = iron overload or inflammation).",
    whoShouldGetTested:
      "Iron studies are ordered when a CBC shows anaemia (particularly microcytic, low-MCV anaemia) to determine if iron deficiency is the cause, to distinguish iron deficiency from anaemia of chronic disease, or to assess response to iron supplementation. Women with heavy menstrual bleeding, vegans and vegetarians, endurance athletes, pregnant women, and frequent blood donors are at higher risk of iron depletion. Iron overload conditions (hereditary haemochromatosis) are detected by elevated ferritin and transferrin saturation.",
    uaeContext:
      "Iron deficiency anaemia is the most common nutritional deficiency in the UAE, particularly in South Asian and Filipino women of reproductive age. Studies from DHA-affiliated hospitals have reported iron deficiency in 15–30% of pregnant women in Dubai. Ferritin is increasingly included in UAE pre-marital screening packages and corporate women's health panels. Thalassaemia trait — common in UAE nationals and populations from the Indian subcontinent, Southeast Asia, and the Mediterranean — can mimic iron deficiency anaemia on a CBC; iron studies help distinguish them before prescribing iron supplementation unnecessarily.",
  },
  "fasting-glucose": {
    whatItMeasures:
      "Fasting plasma glucose measures the concentration of glucose in the blood after a minimum 8-hour fast, reported in mmol/L or mg/dL. In the fasting state, blood glucose reflects the baseline rate of hepatic glucose production (gluconeogenesis) and the pancreatic beta-cell's ability to secrete enough insulin to maintain euglycaemia. Normal fasting glucose is below 5.6 mmol/L (100 mg/dL). Values of 5.6–6.9 mmol/L (100–125 mg/dL) indicate impaired fasting glucose (pre-diabetes); 7.0 mmol/L (126 mg/dL) or above on two separate occasions confirms diabetes mellitus.",
    whoShouldGetTested:
      "Fasting glucose is appropriate as a first-line diabetes screen for any adult over 45, or younger adults with obesity, sedentary lifestyle, family history of diabetes, gestational diabetes history, PCOS, hypertension, or dyslipidaemia. It is also used to monitor glycaemic control in patients managing diabetes, though HbA1c has largely supplanted single-point fasting glucose for ongoing monitoring due to its independence from day-to-day variation.",
    uaeContext:
      "With a diabetes prevalence of approximately 17% and a pre-diabetes prevalence approaching 25%, the UAE is one of the most diabetes-affected countries in the world. Fasting glucose testing is mandated as part of routine UAE employer health checks and is included in visa medical assessments for certain worker categories. Abu Dhabi's Weqaya (the national cardiovascular screening programme) includes fasting glucose in its panel for all UAE nationals and long-term residents over 30. The test requires fasting, which can be challenging in the Ramadan period — healthcare providers typically adjust screening schedules accordingly.",
  },
  testosterone: {
    whatItMeasures:
      "Testosterone is the primary male androgen, synthesised mainly in the Leydig cells of the testes (and in smaller amounts by the adrenal glands in both sexes). The total testosterone test measures the sum of free testosterone (biologically active, approximately 2–3% of total), albumin-bound testosterone (weakly bound, readily available), and SHBG-bound testosterone (tightly bound, not bioavailable). For a more precise assessment of androgen activity — particularly in men with obesity or metabolic syndrome where SHBG may be distorted — free testosterone or bioavailable testosterone is calculated or directly measured.",
    whoShouldGetTested:
      "Men with symptoms of hypogonadism — reduced libido, erectile dysfunction, fatigue, loss of muscle mass, increased body fat, depression, or low bone density — should be tested with a morning fasting sample (testosterone follows a diurnal rhythm, peaking in early morning). Testosterone is also ordered in women with symptoms of excess androgens: hirsutism, acne, irregular periods, or infertility, where it forms part of a PCOS workup. Adolescent boys with delayed puberty and infertile men undergoing evaluation also require testosterone assessment.",
    uaeContext:
      "Testosterone testing is growing rapidly in the UAE's men's health and wellness market. Several Dubai and Abu Dhabi clinics now offer hormone optimisation programmes, reflecting a broader awareness of hypogonadism in middle-aged men — a trend partially driven by the high rates of obesity and metabolic syndrome in the UAE. UAE pharmacies require a prescription for testosterone replacement therapy (TRT), which must be prescribed by an endocrinologist or urologist, but the demand for testing has made it widely available across all major lab networks. Anabolic steroid use among gym-going expats can suppress the hypothalamic-pituitary-testicular axis, producing secondary hypogonadism that may present with low testosterone on testing.",
  },
  amh: {
    whatItMeasures:
      "Anti-Müllerian Hormone (AMH) is a glycoprotein secreted by the granulosa cells of small antral follicles in the ovaries. Because AMH levels are proportional to the number of remaining primordial follicles (the ovarian reserve), it is the most accurate single-marker indicator of a woman's remaining egg supply. Unlike FSH or oestradiol — which fluctuate with the menstrual cycle — AMH is relatively stable throughout the cycle and can be measured on any day. Levels are reported in pmol/L or ng/mL and decline progressively from the mid-20s until the menopause.",
    whoShouldGetTested:
      "AMH is primarily tested in women considering fertility treatment (IVF/ICSI), in those with irregular cycles, premature ovarian insufficiency symptoms (hot flashes, amenorrhoea under 40), or a personal or family history of early menopause. It is also ordered before chemotherapy or radiation therapy — treatments that can cause premature ovarian failure — and in women with PCOS (where AMH is paradoxically elevated due to the large number of small follicles). Women in their 30s who are not yet trying to conceive but wish to understand their reproductive timeline are increasingly testing AMH proactively.",
    uaeContext:
      "The UAE has a thriving fertility medicine sector, with Dubai and Abu Dhabi home to several internationally accredited IVF clinics (Fakih IVF, Bourn Hall, Medcare, American Hospital IVF centres). AMH testing is a standard part of the new patient workup at all major UAE fertility centres. UAE laws permit IVF only within marriage, and the community of married expat couples seeking fertility evaluation is large. AMH is widely available at UAE diagnostic labs without a doctor's referral, and its affordability (AED 80–200 across labs) has made self-initiated ovarian reserve testing increasingly common among women in their late 20s and 30s.",
  },
  psa: {
    whatItMeasures:
      "PSA (prostate-specific antigen) is a serine protease enzyme secreted by epithelial cells of the prostate gland. It is measured in nanograms per millilitre (ng/mL) in serum. Most PSA in the blood is bound to proteins (bound PSA), with a small fraction circulating freely (free PSA). A PSA above 4.0 ng/mL is conventionally flagged as elevated, though age-specific reference ranges are preferred — younger men warrant investigation at lower thresholds. Elevated PSA is not specific to cancer; benign prostatic hyperplasia (BPH) and prostatitis are common causes of raised PSA. The free-to-total PSA ratio can help distinguish cancer from benign causes.",
    whoShouldGetTested:
      "PSA screening remains a shared decision between patient and physician due to the risk of over-detection of indolent cancers. Most guidelines recommend discussing PSA screening with men at average risk from age 50, and from age 40–45 in higher-risk groups: men with a first-degree relative diagnosed with prostate cancer under 65, men of African ancestry (significantly higher risk), and known BRCA2 mutation carriers. PSA is also used to monitor known prostate cancer patients on active surveillance or post-treatment to detect recurrence.",
    uaeContext:
      "Prostate cancer is among the top five cancers diagnosed in UAE men, according to the UAE National Cancer Registry. The UAE's South Asian male expat population — a large demographic — has a lower baseline risk compared to Western populations, but African-origin males (including a proportion of the UAE's African expat community) carry elevated risk. Awareness of PSA screening has grown substantially with UAE government cancer awareness campaigns (such as Movember initiatives). Many UAE corporate health plans now include PSA in annual check-up panels for men over 45. All major UAE diagnostic labs offer both total PSA and free PSA as standalone tests or bundled in men's health packages.",
  },
  "hiv-test": {
    whatItMeasures:
      "The standard HIV screening test used in UAE labs is a 4th-generation HIV-1/2 combination antigen/antibody assay (Ag/Ab combo). This test simultaneously detects HIV-1 p24 antigen (present as early as 11–16 days post-exposure, before antibodies form) and IgM/IgG antibodies to both HIV-1 and HIV-2. This combination reduces the 'window period' — the time between infection and a detectable positive result — to approximately 18–45 days compared to 23–90 days for older 3rd-generation antibody-only tests. A reactive (positive) 4th-generation result requires confirmatory testing by Western blot or HIV-1/2 antibody differentiation assay.",
    whoShouldGetTested:
      "HIV testing is recommended for all adults aged 15–65 at least once as part of routine healthcare, and annually for those at higher risk: men who have sex with men (MSM), people with multiple sexual partners, injecting drug users, people with a diagnosed STI, and healthcare workers following potential occupational exposure. Testing is also indicated before any blood or organ donation and routinely included in antenatal care for pregnant women to prevent mother-to-child transmission.",
    uaeContext:
      "HIV testing is mandatory in the UAE for visa and residency permit applications — a positive result leads to deportation, which has historically made voluntary testing rates lower among at-risk expat populations due to fear of immigration consequences. The UAE government's position has shifted somewhat in recent years, with public health communications emphasising treatment as prevention. Testing is available at all major UAE labs and is included in visa medical packages conducted at DHA-authorised screening centres. Results are treated with strict confidentiality at licensed labs. UAE nationals and residents with HIV are entitled to treatment at government hospitals; the DHA and DOH both run HIV/AIDS treatment programmes.",
  },
};

// ─── Metadata ────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return LAB_TESTS.map((test) => ({ test: test.slug }));
}

export function generateMetadata({ params }: { params: { test: string } }): Metadata {
  const test = getLabTest(params.test);
  if (!test) return { title: "Test Not Found" };

  const base = getBaseUrl();
  const comparison = getTestPriceComparison(test.slug);
  const range = comparison?.priceRange;

  return {
    title:
      `${test.name} Price in UAE — Compare ${comparison?.prices.length || 0} Labs ` +
      `${range ? `from ${formatPrice(range.min)}` : ""} | UAE Lab Test Comparison`,
    description:
      `Compare ${test.name} (${test.shortName}) prices across ${comparison?.prices.length || 0} UAE labs. ` +
      `${range ? `Prices range from ${formatPrice(range.min)} to ${formatPrice(range.max)} — save up to ${range.savingsPercent}%. ` : ""}` +
      `${test.fastingRequired ? "Fasting required. " : "No fasting needed. "}` +
      `${test.description}`,
    alternates: { canonical: `${base}/labs/test/${test.slug}` },
    openGraph: {
      title: `${test.shortName} Test Price in UAE — Compare Labs`,
      description: `${test.name} costs ${range ? `${formatPrice(range.min)} – ${formatPrice(range.max)}` : "varies"} across UAE labs. Compare and save.`,
      url: `${base}/labs/test/${test.slug}`,
      type: "website",
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function TestDetailPage({ params }: { params: { test: string } }) {
  const test = getLabTest(params.test);
  if (!test) notFound();

  const base = getBaseUrl();
  const comparison = getTestPriceComparison(test.slug);
  const range = comparison?.priceRange;
  const relatedTests = getTestsByCategory(test.category).filter((t) => t.slug !== test.slug).slice(0, 6);
  const medContent = TEST_MEDICAL_CONTENT[test.slug] ?? null;

  const sampleTypeLabel: Record<string, string> = {
    blood: "Blood sample (venipuncture)",
    urine: "Urine sample",
    stool: "Stool sample",
    swab: "Swab sample",
    imaging: "Imaging procedure",
    other: "Varies",
  };

  const faqs = [
    {
      question: `How much does a ${test.shortName} test cost in the UAE?`,
      answer:
        range
          ? `A ${test.name} costs between ${formatPrice(range.min)} and ${formatPrice(range.max)} in the UAE, ` +
            `depending on the laboratory. The cheapest option is ${comparison!.prices[0].labName} ` +
            `at ${formatPrice(comparison!.prices[0].price)}. By comparing ${comparison!.prices.length} labs, ` +
            `you can save up to ${formatPrice(range.savings)} (${range.savingsPercent}%).`
          : `${test.name} pricing varies by laboratory. Contact labs directly for current pricing.`,
    },
    {
      question: `Do I need to fast before a ${test.shortName} test?`,
      answer: test.fastingRequired
        ? `Yes, fasting for 8-12 hours is required before a ${test.name}. You may drink water during the fasting period. ` +
          `Morning appointments (7-9 AM) are recommended so you can fast overnight.`
        : `No, fasting is not required for a ${test.name}. You can have the test at any time of day without dietary restrictions.`,
    },
    {
      question: `How long does it take to get ${test.shortName} results?`,
      answer:
        `${test.name} results are typically available within ${test.turnaroundHours} hours. ` +
        `Walk-in labs may provide results faster than home collection services. ` +
        `Most labs in the UAE deliver results digitally via email or app within 24 hours.`,
    },
    {
      question: `Why is ${test.shortName} testing important?`,
      answer:
        `${test.description} Common reasons to order this test include: ${test.commonReasons.join(", ")}. ` +
        `Regular testing helps detect conditions early when they are most treatable.`,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Test Comparison", url: `${base}/labs` },
          { name: test.shortName },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalTest",
          name: test.name,
          alternateName: test.shortName,
          description: test.description,
          url: `${base}/labs/test/${test.slug}`,
          usedToDiagnose: test.commonReasons.join(", "),
          normalRange: test.fastingRequired ? "Fasting 8-12 hours required" : "No fasting required",
          ...(comparison && {
            offers: comparison.prices.map((p) => ({
              "@type": "Offer",
              price: p.price,
              priceCurrency: "AED",
              seller: { "@type": "MedicalBusiness", name: p.labName },
              availability: "https://schema.org/InStock",
            })),
          }),
        }}
      />

      {comparison && comparison.prices.length > 0 && (
        <JsonLd
          data={labTestProductSchema(test, comparison.prices.map((p) => ({ labName: p.labName, price: p.price })))}
        />
      )}

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Test Comparison", href: "/labs" },
          { label: test.shortName },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] bg-[#006828]/[0.04] text-[#006828]-dark px-2 py-0.5 font-bold uppercase">
            {getTestCategoryLabel(test.category)}
          </span>
        </div>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
          {test.name} — Price Comparison in the UAE
        </h1>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed mb-4">
            {test.description}
            {range && (
              <>
                {" "}In the UAE, a {test.shortName} test costs between{" "}
                <strong>{formatPrice(range.min)}</strong> and{" "}
                <strong>{formatPrice(range.max)}</strong> depending on the laboratory.
                {range.savingsPercent > 0 && (
                  <> You can save up to <strong>{range.savingsPercent}%</strong> by comparing {comparison!.prices.length} labs below.</>
                )}
              </>
            )}
          </p>
        </div>

        {/* Test details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {range && (
            <div className="bg-[#f8f8f6] rounded-xl border border-black/[0.06] p-4">
              <p className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#006828]">{formatPrice(range.min)}</p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">Cheapest price</p>
            </div>
          )}
          {range && range.savings > 0 && (
            <div className="bg-[#f8f8f6] rounded-xl border border-black/[0.06] p-4">
              <p className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#006828]">{formatPrice(range.savings)}</p>
              <p className="font-['Geist',sans-serif] text-[11px] text-black/40">Max savings ({range.savingsPercent}%)</p>
            </div>
          )}
          <div className="bg-[#f8f8f6] rounded-xl border border-black/[0.06] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-[#006828]" />
              <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c]">Turnaround</p>
            </div>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">{test.turnaroundHours} hours</p>
          </div>
          <div className="bg-[#f8f8f6] rounded-xl border border-black/[0.06] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="w-4 h-4 text-[#006828]" />
              <p className="font-['Bricolage_Grotesque',sans-serif] text-xs font-semibold text-[#1c1c1c]">Sample</p>
            </div>
            <p className="font-['Geist',sans-serif] text-[11px] text-black/40">{sampleTypeLabel[test.sampleType]}</p>
          </div>
        </div>

        {/* Fasting notice */}
        {test.fastingRequired && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Fasting required:</strong> Do not eat or drink (except water) for 8-12
              hours before this test. Morning appointments are recommended.
            </p>
          </div>
        )}
      </div>

      {/* Common reasons */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Common Reasons to Order</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {test.commonReasons.map((reason) => (
            <span key={reason} className="text-xs bg-[#f8f8f6] border border-black/[0.06] px-3 py-1.5 text-[#1c1c1c]">
              {reason}
            </span>
          ))}
        </div>
      </div>

      {/* Understanding Your Results — medical education */}
      {medContent && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Understanding Your {test.shortName} Results</h2>
          </div>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
            <div className="flex items-start gap-3 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5 mb-4">
              <BookOpen className="w-5 h-5 text-[#006828] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1">What This Test Measures</p>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
                  {medContent.whatItMeasures}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Who Should Get This Test */}
      {medContent && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Who Should Get This Test</h2>
          </div>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
            <div className="flex items-start gap-3 bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5 mb-4">
              <Users className="w-5 h-5 text-[#006828] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1">Recommended For</p>
                <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed mb-3">
                  {medContent.whoShouldGetTested}
                </p>
                <div className="border-t border-black/[0.06] pt-3">
                  <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-1">In the UAE Context</p>
                  <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">
                    {medContent.uaeContext}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price comparison */}
      {comparison && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Price Comparison — {test.shortName} Across UAE Labs</h2>
          </div>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-4" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-xs text-black/40">
              Comparing {test.shortName} prices across {comparison.prices.length} laboratories in the UAE.
              {comparison.prices[0] && (
                <> The cheapest option is <strong>{comparison.prices[0].labName}</strong> at{" "}
                <strong>{formatPrice(comparison.prices[0].price)}</strong>.
                {comparison.prices[0].homeCollection && " Home collection available."}</>
              )}
            </p>
          </div>
          <TestPriceTable comparison={comparison} />
        </div>
      )}

      {/* Related tests */}
      {relatedTests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related {getTestCategoryLabel(test.category)} Tests</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedTests.map((t) => (
              <Link
                key={t.slug}
                href={`/labs/test/${t.slug}`}
                className="p-3 border border-black/[0.06] hover:border-[#006828]/15 transition-colors group"
              >
                <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                  {t.shortName}
                </h3>
                <p className="text-[11px] text-black/40 line-clamp-2 mt-1">{t.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title={`${test.shortName} Test — FAQ`} />
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices for {test.name} are indicative and based on
          publicly available data from UAE diagnostic laboratories. Actual prices may vary
          by branch, insurance coverage, and current promotions. The medical information
          on this page is for educational purposes only and does not constitute medical advice.
          Consult a qualified physician to determine if this test is appropriate for your
          condition and to interpret your results. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
