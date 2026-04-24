import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText, Clock, MapPin, DollarSign, CheckCircle, AlertTriangle,
  ArrowRight, FlaskConical, ChevronRight, Calendar, User, Users,
  Building2, Zap, Heart, Baby, Shield, Briefcase
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PackageCard } from "@/components/labs/PackageCard";
import {
  HEALTH_PACKAGES,
  getPriceRange,
  formatPrice,
  getLabTest,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideSection {
  heading: string;
  content: string;
}

interface LabGuide {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  heroText: string;
  quickFacts: { icon: string; label: string; value: string }[];
  sections: GuideSection[];
  relatedTests: string[];
  relatedPackages?: string[];
  faqs: { question: string; answer: string }[];
}

// ─── Guide Data ───────────────────────────────────────────────────────────────

const GUIDES: Record<string, LabGuide> = {
  "visa-medical": {
    slug: "visa-medical",
    title: "UAE Visa Medical Test — What's Included, Cost & Where to Get It",
    h1: "UAE Visa Medical Test: What's Included, Cost & Where to Go",
    metaDescription:
      "Everything you need to know about the UAE visa medical fitness test. Required tests, cost (AED 250–350), MOHAP-approved centres, processing time, and which labs offer the individual blood tests. Updated March 2026.",
    heroText:
      "Anyone applying for a UAE residence visa or renewing one must pass a medical fitness test at a MOHAP-approved medical fitness centre. The test checks for communicable diseases as required under Federal Law No. 6 of 1973 and its amendments. The full process typically takes 3–5 business days and costs AED 250–350 at government-approved centres.",
    quickFacts: [
      { icon: "DollarSign", label: "Typical Cost", value: "AED 250–350" },
      { icon: "Clock", label: "Processing Time", value: "3–5 business days" },
      { icon: "MapPin", label: "Where", value: "MOHAP-approved fitness centres" },
      { icon: "FileText", label: "Who Needs It", value: "All new/renewing residents" },
    ],
    sections: [
      {
        heading: "What Tests Are Required",
        content:
          "The UAE visa medical fitness test includes four components. First, a chest X-ray to screen for active pulmonary tuberculosis — the UAE uses digital X-ray technology and results are read by a radiologist on-site. Second, a blood draw covering: HIV 1 & 2 antigen/antibody (4th generation), Hepatitis B Surface Antigen (HBsAg), Hepatitis C Antibody (anti-HCV), and VDRL/RPR for syphilis. Third, a basic physical examination by a doctor — blood pressure, weight, and a general health assessment. Fourth, a leprosy skin examination. The results are uploaded directly to the MOHAP electronic health system and are not handed to you in paper form; your employer or PRO will access them via the MOHAP portal.\n\nNote: Some nationalities may face additional requirements. The MOHAP website publishes an updated country-specific list. If a positive result is returned for any communicable disease, the applicant is typically notified by the centre and referred for further evaluation. HIV-positive individuals are generally not granted a UAE residence visa under current federal policy.",
      },
      {
        heading: "Where to Get the Visa Medical Test Done",
        content:
          "The UAE has 26 MOHAP-approved medical fitness centres operating across all emirates as of 2026. In Dubai, AMER centres, ICA-approved typing centres with medical wings, and some DHA health centres handle visa medicals. In Abu Dhabi, Seha's health screening centres (including those in Al Ain) are the primary option for DOH-jurisdicted residents. In Sharjah, Ajman, Fujairah, Ras Al Khaimah, and Umm Al Quwain, MOHAP-accredited private polyclinics handle most visa medicals.\n\nImportant: You cannot get the visa medical at a standalone diagnostic lab, hospital, or clinic that is not specifically MOHAP-approved for medical fitness testing. If you attempt to do so, the results will not be accepted by the immigration system. Always verify the centre is listed on the MOHAP Tasheel portal before booking.\n\nSome approved centres offer walk-in service (7 AM–9 PM), while others require an appointment through the MOHAP online system. Bring your original passport, passport-sized photo, and Emirates ID (for renewals) or visa copy (for new applicants).",
      },
      {
        heading: "Cost Breakdown",
        content:
          "Government medical fitness centres charge a standardised fee of approximately AED 150–200 for the base medical test. Add the X-ray (AED 50–80), blood draw fees (AED 50–100), and the MOHAP e-platform fee (AED 10–30) and the total typically lands between AED 250 and AED 350. Private MOHAP-approved centres may charge up to AED 450.\n\nDomestic worker visa medicals are slightly different — employers typically arrange them through typing centres and the bundled cost is often AED 270–320 including the biometrics appointment. Company account holders (PROs) often get preferential rates at approved centres.\n\nIf you are doing the individual blood tests separately at a standalone lab prior to attending the fitness centre (which is not standard practice and generally not accepted), costs for the four blood tests individually would be: HIV test AED 80–120, Hepatitis B AED 60–100, Hepatitis C AED 70–110, VDRL/Syphilis AED 45–70. However, these private lab results are not accepted in lieu of the official medical fitness test.",
      },
      {
        heading: "Who Needs the Visa Medical",
        content:
          "The medical fitness test is mandatory for: all new residence visa applicants (employment, family, investor, retirement, student), all residence visa renewals (typically every 2–3 years), domestic worker visa applications, and golden visa applications. Tourists on visit visas and short-term business visitors are exempt.\n\nChildren under 18 are generally exempt from the full medical fitness test requirement when joining a parent on a family visa. The sponsoring parent's visa application covers the household.\n\nFor visa renewals, the test must be completed within 60 days of the renewal application date. Many employers schedule renewal medicals 90 days before visa expiry to allow time for reprocessing if any issues arise. Some free zones have their own approved medical providers — check with your free zone authority.",
      },
      {
        heading: "Processing Time and Results",
        content:
          "Most approved centres process standard visa medicals in 3–5 business days (not including weekends). Urgent processing (1–2 days) is available at some centres for an additional fee of AED 50–150. Results are uploaded electronically to the MOHAP system and are accessible to your employer, PRO, or typing centre immediately upon upload.\n\nYou will receive an SMS notification when your results are ready. If you passed, a medical fitness certificate is issued in the MOHAP portal. If there is a flag on any test result, you will receive a separate notification and may be referred to a government hospital for confirmatory testing.\n\nMedical fitness certificates are valid for 3 months from the date of issue. If your visa is not stamped within 3 months, you may need to redo the medical. This is particularly relevant for new recruits arriving from abroad.",
      },
      {
        heading: "Tips and Common Mistakes",
        content:
          "Arrive early on weekday mornings (7–8 AM) to avoid long queues. Many approved centres process 200–500 tests per day and queues can form by 9 AM. Wear comfortable clothing with easily rolled-up sleeves for the blood draw. If you are fasting (some centres require fasting for certain nationalities or test types), confirm with the centre in advance — the standard visa medical does not require fasting.\n\nDo not eat a heavy meal before the chest X-ray if possible, though fasting is not required. Inform the doctor if you are taking anti-TB medication, antiretroviral therapy, or hepatitis treatment — this will affect how your results are interpreted.\n\nBring original documents only — photocopies are typically not accepted at government-approved centres. Passport, visa (if renewal), Emirates ID (if renewal), and a passport photograph (usually 35x45mm white background).",
      },
    ],
    relatedTests: ["hiv-test", "hepatitis-b", "vdrl", "cbc"],
    relatedPackages: [],
    faqs: [
      {
        question: "Can I use a private lab blood test for the UAE visa medical?",
        answer:
          "No. Private lab results are not accepted for UAE visa medicals. You must attend a MOHAP-approved medical fitness centre where all tests are conducted under the official system and uploaded directly to the MOHAP Tasheel portal. Independent lab results cannot be substituted.",
      },
      {
        question: "How long is the UAE visa medical certificate valid?",
        answer:
          "The visa medical fitness certificate is valid for 3 months from the date of issue. If your visa application or renewal is not processed within that window, you will need to repeat the medical test.",
      },
      {
        question: "What happens if I test positive for HIV or Hepatitis B in the visa medical?",
        answer:
          "A positive HIV result typically results in visa denial under current UAE federal immigration policy. Hepatitis B carriers are evaluated on a case-by-case basis — chronic asymptomatic carriers have been granted visas in some emirates. You will be contacted confidentially by the centre and referred for confirmatory testing before any decision is finalised.",
      },
      {
        question: "Does the visa medical test require fasting?",
        answer:
          "The standard UAE visa medical test does not require fasting. The blood tests (HIV, Hepatitis B, Hepatitis C, VDRL) do not require fasting. You may eat normally before your appointment.",
      },
      {
        question: "How much does the UAE visa medical test cost in 2026?",
        answer:
          "The UAE visa medical test costs between AED 250 and AED 350 at government-approved centres. This covers the chest X-ray, blood draw, physical examination, and MOHAP e-platform fee. Private MOHAP-approved centres may charge up to AED 450 for the full package.",
      },
      {
        question: "Can I do the visa medical at any lab or clinic in the UAE?",
        answer:
          "No. You must attend a facility specifically approved by MOHAP for medical fitness testing. Regular clinics, hospitals, and diagnostic labs — even large chains like Al Borg or Thumbay — are not authorised to conduct official visa medicals unless they have a separate MOHAP-approved medical fitness wing.",
      },
    ],
  },

  "pre-marital-screening": {
    slug: "pre-marital-screening",
    title: "Pre-Marital Screening in the UAE — Required Tests, Cost & Labs",
    h1: "Pre-Marital Blood Screening in the UAE: Required Tests, Cost & Where to Go",
    metaDescription:
      "UAE pre-marital screening is mandatory by federal law since 2006. Full guide: required tests (blood group, CBC, sickle cell, thalassemia, HIV, hepatitis, syphilis, rubella), cost AED 200–500, certificate validity, and where to get tested. Updated March 2026.",
    heroText:
      "Pre-marital screening is compulsory in the UAE under Federal Law No. 22 of 2006, later reinforced by MOHAP Circular 34/2006. All UAE nationals and residents planning to marry in the UAE must complete the screening at an approved government health centre or licensed private laboratory. The certificate is valid for 3 months and must be presented to the court or marriage registrar.",
    quickFacts: [
      { icon: "DollarSign", label: "Cost", value: "AED 200–500" },
      { icon: "Clock", label: "Certificate Validity", value: "3 months" },
      { icon: "FileText", label: "Legal Basis", value: "Federal Law No. 22 of 2006" },
      { icon: "MapPin", label: "Where", value: "DHA/DOH/MOHAP health centres + approved private labs" },
    ],
    sections: [
      {
        heading: "Why Pre-Marital Screening is Mandatory in the UAE",
        content:
          "The UAE introduced mandatory pre-marital screening in 2006 primarily to reduce the incidence of hereditary blood disorders — particularly sickle cell anaemia and thalassemia — which have a high carrier prevalence in the Gulf population. The UAE Ministry of Health and Prevention (MOHAP) estimates that approximately 8–10% of UAE nationals carry the sickle cell trait, and thalassemia carrier rates in some communities exceed 5%. Without screening, couples who are both carriers of the same disorder have a 25% chance of having an affected child per pregnancy.\n\nThe screening also includes STD testing (HIV, hepatitis B/C, syphilis) to protect both partners and future children. Critically, a positive or incompatible result does not legally prevent marriage — the law requires informed disclosure, not prohibition. Couples are counselled by a genetic counsellor and given the choice to proceed with full knowledge of the risks.",
      },
      {
        heading: "Complete List of Required Tests",
        content:
          "The official UAE pre-marital screening panel includes: Blood Group (ABO) and Rh factor typing — to identify potential Rh incompatibility in pregnancy. Complete Blood Count (CBC) — to detect anaemia and haematological abnormalities. Sickle Cell screening (Haemoglobin Electrophoresis or HPLC) — mandatory; identifies HbS carriers. Beta Thalassemia screening (Haemoglobin Electrophoresis or HPLC) — same test as sickle cell. HIV 1 & 2 Antibody/Antigen test (4th generation). Hepatitis B Surface Antigen (HBsAg). Hepatitis C Antibody (anti-HCV). VDRL/RPR for syphilis. Rubella IgG antibody — to check immunity in women (rubella in early pregnancy causes congenital rubella syndrome).\n\nSome government centres may add G6PD enzyme deficiency screening for male applicants. Private laboratories that are licensed to conduct pre-marital testing offer the full panel as a bundled package.",
      },
      {
        heading: "Where to Get Pre-Marital Screening Done",
        content:
          "Government health centres operated by DHA (Dubai), DOH (Abu Dhabi), or MOHAP (other emirates) offer the complete pre-marital panel and provide the official certificate through the government health system. DHA health centres in Dubai such as Al Manara, Al Mizhar, and Rashidiya Centre offer this service. In Abu Dhabi, Seha primary care centres handle pre-marital screening. In Sharjah and the Northern Emirates, MOHAP-operated primary health care centres process these tests.\n\nApproved private laboratories — including Al Borg Diagnostics, Thumbay Labs, and MenaLabs — are licensed to conduct the tests and issue results that are fed into the national pre-marital screening database (MALAK system in some emirates). However, the formal certificate must often still be collected from the health authority system. Confirm with the private lab whether they can issue the full legal certificate or only the test results.\n\nThe process at a government centre is typically walk-in for sample collection (7 AM–11 AM is quietest), with results available in 3–5 business days. Certificate collection may require an appointment with a genetic counsellor.",
      },
      {
        heading: "Cost Breakdown",
        content:
          "At government DHA, DOH, or MOHAP health centres, the pre-marital screening panel costs approximately AED 200–300 for the full bundle. This is heavily subsidised for UAE nationals. Expat residents pay slightly more, typically AED 250–350.\n\nAt private licensed laboratories, the pre-marital bundle ranges from AED 350–500. Al Borg charges approximately AED 420–480 for the full panel. Thumbay Labs offers the panel at around AED 350–400. MenaLabs bundles it for approximately AED 390–450.\n\nIf you need to buy the tests separately at a private lab: CBC AED 69–120, Blood Group AED 30–50, Haemoglobin Electrophoresis AED 100–180, HIV test AED 80–120, Hepatitis B AED 60–100, Hepatitis C AED 70–100, VDRL AED 45–70, Rubella IgG AED 70–110.",
      },
      {
        heading: "Required Documents and Process",
        content:
          "To complete pre-marital screening you need: Original Emirates ID (both partners must be in the system as UAE residents), Passport copy, Visa page copy (for expat residents). Both partners need not attend simultaneously — each can go separately and the system links records via Emirates ID.\n\nThe genetic counselling session (mandatory at government centres) lasts 15–30 minutes. The counsellor explains any positive or carrier findings using a visual risk chart. For hereditary conditions, couples are classified as: Compatible (neither or only one carries the trait), Cautious (both carry traits for different conditions), Incompatible (both carry the same recessive condition, meaning 25% risk per child). The classification appears on the certificate but does not prevent marriage.\n\nAfter counselling and certificate issuance, present the certificate to the marriage registrar (court, DHA marriage section, or DIWAN office for nationals) at the time of marriage registration.",
      },
      {
        heading: "Special Considerations for Expat Couples",
        content:
          "Expat couples marrying in the UAE through a civil ceremony or embassy registration are typically required to present pre-marital screening certificates. This applies to marriages registered through UAE courts. However, couples marrying in their home country and simply celebrating in the UAE are not legally required to complete UAE pre-marital screening.\n\nFor expat couples who are already married (abroad) and holding residency visas, the requirement does not apply retroactively. It only applies to new marriages being registered within the UAE legal system.\n\nNon-Muslim expatriates marrying through their embassy may have different requirements — confirm directly with your embassy whether UAE pre-marital certificates are required for embassy-registered marriages. Some embassies accept private lab results; others require government centre certificates.",
      },
    ],
    relatedTests: ["cbc", "hiv-test", "hepatitis-b", "vdrl", "fsh", "estradiol"],
    relatedPackages: [],
    faqs: [
      {
        question: "Is pre-marital screening mandatory for all couples in the UAE?",
        answer:
          "Yes. Federal Law No. 22 of 2006 requires all couples planning to marry in the UAE — both nationals and resident expatriates — to complete the pre-marital screening and present the certificate to the marriage registrar.",
      },
      {
        question: "Can we still get married if the results show we are incompatible?",
        answer:
          "Yes. The UAE pre-marital screening law requires informed consent, not prohibition. Even if both partners are carriers of sickle cell anaemia or thalassemia (the 'incompatible' classification), you can proceed with marriage. The law's intent is to ensure both parties are fully informed of the genetic risks.",
      },
      {
        question: "How long does the pre-marital certificate take?",
        answer:
          "Test results are typically available within 3–5 business days. The genetic counselling session is often scheduled immediately after results are available at government centres. The certificate is typically issued on the same day as counselling.",
      },
      {
        question: "How long is the pre-marital certificate valid?",
        answer:
          "The pre-marital screening certificate is valid for 3 months from the date of issue. If the marriage is not registered within 3 months, the screening must be repeated.",
      },
      {
        question: "Can pre-marital screening be done at a private lab like Al Borg or Thumbay?",
        answer:
          "Yes, licensed private labs including Al Borg Diagnostics and Thumbay Labs can conduct the blood tests and submit results to the MOHAP/DHA system. However, the formal certificate may need to be collected from the health authority or genetic counselling centre. Confirm with the private lab whether they issue the full legal pre-marital certificate.",
      },
    ],
  },

  "pregnancy-tests": {
    slug: "pregnancy-tests",
    title: "Pregnancy & Prenatal Blood Tests in the UAE — Complete Guide",
    h1: "Prenatal & Pregnancy Blood Tests in the UAE: What to Get, When, and Where",
    metaDescription:
      "Complete guide to pregnancy blood tests in the UAE. First trimester (beta-hCG, CBC, rubella, thyroid), second trimester (GDM glucose test), third trimester (CBC, Group B Strep), NIPT (AED 2,500–4,000), and which labs offer home collection. Updated March 2026.",
    heroText:
      "Prenatal blood testing in the UAE follows internationally recognised guidelines (ACOG/WHO) with additional protocols recommended by DHA and DOH. Antenatal care begins with a confirmation visit at 6–8 weeks gestation, with structured blood panels at each trimester. NIPT (non-invasive prenatal testing) is widely available at UAE private labs starting from AED 2,500.",
    quickFacts: [
      { icon: "Calendar", label: "First Tests", value: "6–10 weeks gestation" },
      { icon: "DollarSign", label: "NIPT Cost", value: "AED 2,500–4,000" },
      { icon: "MapPin", label: "Home Collection", value: "Available via DarDoc, Healthchecks360" },
      { icon: "Clock", label: "Glucose Test", value: "24–28 weeks (1-hour OGTT)" },
    ],
    sections: [
      {
        heading: "First Trimester Blood Tests (Weeks 6–13)",
        content:
          "The first antenatal blood panel is typically ordered at 6–10 weeks gestation during the booking appointment with your OB-GYN. Standard tests include: Beta-hCG quantitative (to confirm viable pregnancy and track early progression). Blood Group (ABO) and Rh factor — critical for Rh-negative mothers who may need anti-D immunoglobulin. Complete Blood Count (CBC) — to check for anaemia, which is common in pregnancy and may require iron supplementation. Rubella IgG antibody — to check immunity; non-immune women should be counselled about risk avoidance (vaccination is contraindicated during pregnancy). HIV 1/2 test — recommended by MOHAP and DHA for all pregnant women. Hepatitis B Surface Antigen (HBsAg) — to plan neonatal vaccination at birth if mother is positive. VDRL/RPR for syphilis — congenital syphilis is preventable with early treatment. TSH (Thyroid Stimulating Hormone) — thyroid dysfunction affects foetal brain development; UAE guidelines recommend routine TSH in early pregnancy.",
      },
      {
        heading: "Second Trimester Tests (Weeks 14–27)",
        content:
          "At 15–20 weeks, your OB-GYN may order the Quad Screen (AFP, hCG, estriol, inhibin-A) — a serum screening test for Down syndrome (trisomy 21), Edwards syndrome (trisomy 18), and neural tube defects. This is a screening test, not diagnostic — a positive screen leads to referral for amniocentesis or NIPT.\n\nAt 24–28 weeks, the Gestational Diabetes Mellitus (GDM) screening is mandatory in standard UAE antenatal care due to the UAE's high diabetes prevalence (approximately 17% in the adult population). The one-hour Glucose Challenge Test (50g GCT) is the standard screen; a result above 7.8 mmol/L leads to the three-hour Oral Glucose Tolerance Test (OGTT) for confirmation. GDM affects approximately 15–20% of pregnant women in the UAE — significantly higher than the global average of 7–14%.\n\nCBC repeat at 24–28 weeks to check for anaemia progression. Iron studies (if CBC shows anaemia). Vitamin D level — UAE has a very high prevalence of Vitamin D deficiency; supplementation is commonly recommended from the first trimester.",
      },
      {
        heading: "Third Trimester Tests (Weeks 28–40)",
        content:
          "At 28 weeks, Rh-negative mothers receive anti-D prophylaxis after a blood test confirms Rh status and absence of antibodies (indirect Coombs test). A second anti-D dose is given at 34 weeks and again after delivery if the baby is Rh-positive.\n\nAt 35–37 weeks, Group B Streptococcus (GBS) screening is recommended by DHA and ACOG guidelines — a vaginal/rectal swab rather than blood draw, but included in the prenatal care pathway. Women who are GBS-positive receive intravenous antibiotics during labour.\n\nFinal CBC at 36–38 weeks to confirm haemoglobin levels before delivery. Platelet count is specifically reviewed for women with pregnancy-induced hypertension or pre-eclampsia. Coagulation studies (PT, APTT) may be ordered if caesarean section is planned.",
      },
      {
        heading: "NIPT (Non-Invasive Prenatal Testing) in the UAE",
        content:
          "NIPT analyses cell-free foetal DNA in the mother's blood to screen for chromosomal abnormalities including trisomy 21 (Down syndrome), trisomy 18 (Edwards syndrome), trisomy 13 (Patau syndrome), and sex chromosome abnormalities. It can be performed from 10 weeks gestation.\n\nNIPT is available at all major UAE private laboratories. Al Borg Diagnostics offers the NIPT through their Quest Diagnostics partnership, starting from AED 2,800. STAR Metropolis (Metropolis Healthcare) offers NIPT from AED 2,500. Unilabs Dubai offers NIPT with an expanded panel including microdeletions for AED 3,500–4,000. National Reference Laboratory (NRL) in Abu Dhabi offers NIPT from AED 2,700.\n\nNIPT has a detection rate of >99% for trisomy 21 with a false positive rate of <1%. It is a screening test — a positive NIPT result should be confirmed by amniocentesis or chorionic villus sampling (CVS) before any clinical decision. NIPT requires 5–7 days for results (blood is typically sent to partner labs in the US or Europe).",
      },
      {
        heading: "Fertility-Related Tests Before and After Pregnancy",
        content:
          "Women planning pregnancy often book a pre-conception panel that includes: AMH (Anti-Müllerian Hormone) — measures ovarian reserve; useful for women over 32 or those planning to delay conception. Results from any lab: AED 280–400. FSH and Estradiol (Day 2–3 of cycle) — combined with AMH for complete ovarian reserve assessment. Thyroid panel (TSH, FT3, FT4) — subclinical hypothyroidism affects fertility and early pregnancy. Vitamin D and B12 — supplementation before conception reduces neural tube defect risk. Folic acid blood level (folate) — UAE guidelines recommend 400–800 mcg/day supplementation pre-conception; blood folate confirms adequacy.\n\nHome collection for fertility-related tests is available through DarDoc (Dubai and Abu Dhabi) and Healthchecks360 (Dubai, Sharjah, Ajman). This is particularly useful for cycle-day-timed hormone tests when you may not want to travel to a lab on a specific morning.",
      },
    ],
    relatedTests: ["cbc", "tsh", "vitamin-d", "folate", "amh", "fsh", "estradiol", "hiv-test", "hepatitis-b", "vdrl"],
    relatedPackages: ["medsol-womens", "dardoc-athome-comprehensive"],
    faqs: [
      {
        question: "When should I get my first pregnancy blood tests in the UAE?",
        answer:
          "Your first prenatal blood panel should be ordered at your booking appointment, typically at 6–10 weeks gestation. Most UAE OB-GYNs request CBC, blood group, Rh factor, rubella IgG, TSH, HIV, hepatitis B, and syphilis (VDRL) at this visit.",
      },
      {
        question: "Is the gestational diabetes test mandatory in the UAE?",
        answer:
          "The GDM glucose challenge test at 24–28 weeks is standard practice in UAE antenatal care and recommended by both DHA and DOH guidelines. Given the UAE's high diabetes prevalence, most OB-GYNs order it routinely rather than selectively.",
      },
      {
        question: "Which labs in the UAE offer NIPT?",
        answer:
          "NIPT is available at Al Borg Diagnostics (from AED 2,800), STAR Metropolis (from AED 2,500), Unilabs Dubai (from AED 3,500 for expanded panel), and National Reference Laboratory in Abu Dhabi (from AED 2,700). Most NIPT samples are processed by partner labs internationally with 5–7 day turnaround.",
      },
      {
        question: "Can I get pregnancy blood tests with home collection in the UAE?",
        answer:
          "Yes. DarDoc operates in Dubai and Abu Dhabi (daily 7 AM–11 PM), and Healthchecks360 covers Dubai, Sharjah, and Ajman (daily 7 AM–10 PM). Both offer home collection for routine prenatal blood work. Note that NIPT samples and some specialised hormone tests may require in-lab collection at specific centres.",
      },
      {
        question: "What is the cost of a full prenatal blood panel in the UAE?",
        answer:
          "A first trimester prenatal panel (CBC, blood group, rubella, TSH, HIV, Hepatitis B, VDRL) costs AED 400–700 if tests are ordered individually. Some labs offer bundled prenatal packages — Medsol's Women's Health Panel at AED 399 covers most first trimester requirements. NIPT adds AED 2,500–4,000 separately.",
      },
    ],
  },

  "walk-in-labs": {
    slug: "walk-in-labs",
    title: "Walk-In Blood Test Labs in the UAE — No Appointment Needed",
    h1: "Walk-In Blood Test Labs in the UAE — No Appointment Needed",
    metaDescription:
      "Find walk-in labs in Dubai, Abu Dhabi, Sharjah, and across the UAE that accept patients without an appointment. Best times to visit, tips for fasting tests, and which labs are most walk-in friendly. Updated March 2026.",
    heroText:
      "Most standalone diagnostic laboratories in the UAE accept walk-in patients without prior appointments. Unlike hospital labs or polyclinic labs (which typically require a doctor's referral and appointment), independent labs like Medsol, Alpha Medical, Thumbay, and Al Borg operate on a first-come-first-served basis. Arrive early for the shortest waits.",
    quickFacts: [
      { icon: "Clock", label: "Best Time to Arrive", value: "7–9 AM (fasting tests)" },
      { icon: "FileText", label: "Bring", value: "Emirates ID + request form (if any)" },
      { icon: "DollarSign", label: "Walk-In CBC Cost", value: "AED 69–120" },
      { icon: "MapPin", label: "Busiest Branches", value: "Deira, Bur Dubai, Al Karama" },
    ],
    sections: [
      {
        heading: "Which Labs Accept Walk-Ins in the UAE",
        content:
          "Almost all standalone diagnostic labs in the UAE accept walk-in patients for standard blood tests. The most walk-in friendly chains are: Medsol Diagnostics (Dubai, Sharjah, Abu Dhabi) — no appointment, no referral required, open 7 AM–10 PM Saturday to Thursday. Alpha Medical Laboratory (Dubai, Bur Dubai and Al Karama) — walk-in priority system, open 7:30 AM–9:30 PM. Al Borg Diagnostics (17 branches across UAE) — walk-ins accepted at all branches; appointment available via their app for shorter waits. Thumbay Labs (Dubai, Ajman, Sharjah, Fujairah) — walk-ins accepted 7:30 AM onwards. STAR Metropolis (Dubai, three branches) — walk-ins accepted; Saturdays are the busiest day.\n\nHospital-based labs (e.g., Rashid Hospital, Mediclinic, Cleveland Clinic Abu Dhabi) generally do NOT accept external walk-in patients without a doctor's referral from within that hospital system.",
      },
      {
        heading: "Walk-In vs Appointment: What's the Difference",
        content:
          "Walk-in labs require no advance booking. You arrive, register at the front desk with your Emirates ID, present the tests you want (or get guidance from a phlebotomist on what you need), pay, give your sample, and leave. Results arrive via email, SMS, or their app/portal within 4–48 hours depending on the test type.\n\nAppointed visits reduce waiting time, especially during peak hours (8–10 AM on weekdays). Al Borg and DarDoc offer app-based appointment booking that typically guarantees you are seen within 15 minutes of your arrival slot. The trade-off is that you need to plan ahead.\n\nFor home collection services (DarDoc, Healthchecks360), you always book in advance — typically 2 hours to next-day availability. The nurse arrives at your home, conducts the draw, and results are delivered digitally. This is the most convenient but typically 20–40% more expensive than a walk-in lab visit.\n\nFor straightforward fasting tests (lipid profile, glucose, iron studies), walk-in is perfectly suitable. For specialised tests that require centrifuging and immediate processing (e.g., ionised calcium, some hormone tests), labs may ask you to arrive in the morning before 9 AM.",
      },
      {
        heading: "Best Times to Walk In",
        content:
          "Early morning (7:00–8:30 AM) is strongly recommended for fasting tests such as lipid profile, fasting glucose, iron studies, and insulin. Most labs process fasting samples first to avoid delays, and arriving early ensures your sample is drawn before the 9–10 AM rush of non-fasting patients. Waiting time at 7 AM is typically 5–15 minutes; by 10 AM it can be 45–90 minutes at popular branches.\n\nMid-morning to early afternoon (9 AM–12 PM) for non-fasting tests like CBC, thyroid (TSH), Vitamin D, B12, HIV screening, and urine tests. Relatively light queues during this window on Sundays and Mondays (the quietest weekdays).\n\nFriday is the most complex day. Most labs close in the morning for Friday prayers and reopen between 2:00 PM and 2:30 PM (some as late as 4 PM). If you need a fasting test on Friday, you must arrive as soon as the lab reopens — with a fast extended from the previous night's dinner. Saturday and Sunday mornings are the busiest of the week — arrive before 8 AM or expect long waits.\n\nRamadan hours shift significantly — most labs open 9 AM–2 PM and 8 PM–12 AM. Blood draws for non-fasting patients are allowed throughout the day.",
      },
      {
        heading: "What to Bring for a Walk-In Visit",
        content:
          "Emirates ID — required at all UAE labs for patient registration and for linking to the DHA/DOH/MOHAP electronic health record system. Without an Emirates ID, many labs cannot register you (some accept a passport for tourists or new arrivals still awaiting Emirates ID issuance).\n\nTest request form — if your doctor has requested specific tests, bring their printed or emailed request form. Without a doctor's request, you can self-request most routine tests (CBC, lipid profile, glucose, vitamins, thyroid), but some tests (e.g., tumour markers, certain hormone tests) may require a doctor's letter at specific labs.\n\nFasting status — if you know you need fasting tests, fast for 10–12 hours prior (water and plain black coffee are typically acceptable). If you are unsure whether your test requires fasting, check with the lab by phone before your visit.\n\nLoose-sleeved clothing — wear a shirt with sleeves that roll up easily above the elbow. Compression wear, tight long sleeves, or short-sleeved garments can make venepuncture difficult. Many UAE women wear abayas — simply roll the sleeve under the abaya at the lab.",
      },
      {
        heading: "Walk-In Labs by Area — Dubai",
        content:
          "Deira: Al Borg branch (near Gold Souk area) and Medsol Deira branch are both well-known walk-in labs serving the large expat population in Deira. Expect higher queues due to dense population. Al Borg Deira opens at 7 AM Saturday–Thursday.\n\nBur Dubai / Mankhool: Alpha Medical Laboratory operates two Bur Dubai walk-in branches with reputation for fast service and competitive pricing. Medsol also has a Bur Dubai branch.\n\nAl Karama: Multiple standalone labs accept walk-ins; Alpha Medical Karama branch and Thumbay Karama are popular with South Asian expat community due to competitive pricing.\n\nJumeirah / JBR / Marina: Al Borg JBR and Medsol JLT are the primary walk-in options in this corridor. Slightly more expensive than Deira/Bur Dubai branches but significantly shorter queues due to less density.\n\nDubai Healthcare City: Unilabs (premium, DHCC campus) and MenaLabs both accept walk-ins. Premium pricing, shorter queues, and specialised tests not available elsewhere.",
      },
    ],
    relatedTests: ["cbc", "vitamin-d", "lipid-profile", "hba1c", "tsh", "lft", "kft"],
    relatedPackages: ["medsol-basic", "thumbay-basic", "alborg-basic"],
    faqs: [
      {
        question: "Can I walk into a lab in the UAE without a doctor's referral?",
        answer:
          "Yes. Most standalone diagnostic labs in the UAE allow self-requested testing without a doctor's referral. Routine tests like CBC, Vitamin D, thyroid, lipid profile, liver and kidney function, and diabetes markers can be ordered directly. A few specialised tests (e.g., tumour markers, genetic tests) may require a doctor's request letter.",
      },
      {
        question: "Which UAE labs are the best for walk-in blood tests?",
        answer:
          "Medsol Diagnostics, Alpha Medical Laboratory, and Thumbay Labs are the most walk-in friendly with the shortest average waiting times. Al Borg Diagnostics (17 UAE branches) accepts walk-ins at all locations and offers an app-based appointment system to skip queues.",
      },
      {
        question: "How long do walk-in blood test results take in the UAE?",
        answer:
          "Routine tests (CBC, glucose, liver function, kidney function) are typically available within 4–6 hours of the blood draw. Vitamin D, B12, and hormone tests take 18–24 hours. Specialised tests (NIPT, food intolerance panel, genetic tests) can take 48–72 hours or more.",
      },
      {
        question: "Do I need my Emirates ID for a walk-in blood test?",
        answer:
          "Emirates ID is required at most UAE labs for patient registration and to link results to your electronic health record. Some labs accept a passport for tourists or new residents awaiting Emirates ID. Without any ID, labs may refuse to process your sample.",
      },
      {
        question: "What is the cheapest walk-in blood test lab in the UAE?",
        answer:
          "Medsol Diagnostics offers the lowest standard walk-in pricing: CBC from AED 69, Vitamin D from AED 85, lipid profile from AED 80, and full basic health check from AED 99. Alpha Medical Laboratory is comparably priced with free home collection in Dubai.",
      },
    ],
  },

  "weekend-labs": {
    slug: "weekend-labs",
    title: "Labs Open on Friday & Saturday in the UAE",
    h1: "Blood Test Labs Open on Friday and Saturday in the UAE",
    metaDescription:
      "Find UAE labs open on Fridays and Saturdays. Most labs close Friday morning for prayers and reopen 2–4 PM. Saturday is a full working day for most labs. 24/7 hospital labs and home collection services operate all week. Updated March 2026.",
    heroText:
      "Friday mornings are effectively closed across most UAE labs due to Jumu'ah prayers — typically from 11:30 AM to 1:30 PM with most labs simply closing for the full morning. Saturday is a standard working day at nearly all diagnostic labs. Home collection services like DarDoc operate 7 days a week including Friday mornings if you book in advance.",
    quickFacts: [
      { icon: "Calendar", label: "Friday Hours", value: "Most open 2:00 PM – 10:00 PM" },
      { icon: "Calendar", label: "Saturday Hours", value: "Normal hours (7 AM – 9 PM)" },
      { icon: "Clock", label: "24/7 Labs", value: "PureLab Abu Dhabi, Hospital labs" },
      { icon: "MapPin", label: "7-Day Home Collection", value: "DarDoc, Healthchecks360" },
    ],
    sections: [
      {
        heading: "Friday Hours Across UAE Labs",
        content:
          "The UAE working week runs Sunday through Thursday, with Friday being the Islamic holy day. Most standalone labs and health centres either close for the full morning or operate reduced hours. Here is a breakdown by lab:\n\nAl Borg Diagnostics: Friday 2:00 PM – 10:00 PM (some branches). Closed Friday morning.\nThumbay Labs: Friday 9:00 AM – 6:00 PM (unusual — one of the few chains open Friday morning). This is because Thumbay Labs primarily serves Ajman and Northern Emirates where competition requires extended hours.\nMedsol Diagnostics: Friday 2:00 PM – 10:00 PM.\nAlpha Medical Laboratory: Friday 9:00 AM – 5:00 PM (partial).\nUnilabs Dubai: Friday closed — not open.\nMenaLabs: Friday 9:00 AM – 5:00 PM.\nPureLab Abu Dhabi: Open 24/7 including Friday.\nDarDoc (home collection): Daily 7:00 AM – 11:00 PM including Fridays — book via the DarDoc app.\nHealthchecks360: Daily 7:00 AM – 10:00 PM including Fridays — book in advance.",
      },
      {
        heading: "Saturday Hours — Full Working Day",
        content:
          "Saturday is a full working day for virtually all UAE diagnostic labs. Expect the same hours as Sunday–Thursday at most chains:\n\nAl Borg Diagnostics: Saturday 7:00 AM – 10:00 PM. Note: Saturday mornings (especially 8–10 AM) are the single busiest time of the week as patients freed from workweek commitments come in for fasting tests. Arrive at 7 AM to beat the queue.\nThumbay Labs: Saturday 7:30 AM – 9:00 PM.\nMedsol Diagnostics: Saturday 7:00 AM – 10:00 PM.\nAlpha Medical Laboratory: Saturday 7:30 AM – 9:30 PM.\nUnilabs: Saturday 7:00 AM – 9:00 PM.\nMenaLabs: Saturday 7:30 AM – 8:00 PM.\nNational Reference Laboratory (NRL, Abu Dhabi): Saturday 8:00 AM – 4:00 PM. Note NRL is closed Sunday — different working week structure as a government-affiliated entity.\nPureLab (Abu Dhabi): 24/7 including Saturday.",
      },
      {
        heading: "24/7 Labs and Emergency Lab Access",
        content:
          "If you need blood tests outside standard hours — late at night, early Friday morning, or on public holidays — your options are:\n\nPureLab Abu Dhabi: The UAE's largest standalone lab at 70,000 sq ft processes samples 24 hours a day, 7 days a week including public holidays. Based in Abu Dhabi, it is the reference laboratory for Mubadala Health hospitals.\n\nHospital emergency departments: All major UAE hospitals (Rashid Hospital, Mediclinic, Cleveland Clinic Abu Dhabi, NMC) have 24-hour lab facilities for patients receiving emergency care. You cannot walk into a hospital lab for routine tests at 2 AM, but if you present to the emergency department, blood work can be drawn and processed overnight.\n\nDarDoc (app-based home collection, Dubai and Abu Dhabi): Daily 7 AM–11 PM including Fridays and public holidays. For urgent collection outside these hours, contact DarDoc support — they occasionally accommodate urgent cases by arrangement.\n\nPublic holiday closures: UAE national holidays (Eid Al Fitr, Eid Al Adha, UAE National Day, New Year's Day, Prophet's Birthday) result in full-day closures at most private labs. Hospital labs and PureLab continue to operate.",
      },
      {
        heading: "Tips for Friday Fasting Tests",
        content:
          "If you need a fasting test and can only go on a Friday, you have two primary options: (1) Go to a lab that opens Friday morning, such as Thumbay Labs (9 AM) or Alpha Medical (9 AM). These labs cover Dubai, Ajman, and Sharjah. (2) Book a home collection with DarDoc or Healthchecks360 — Friday morning home collection is available, and you remain fasting at home until the nurse arrives (typically 7–10 AM slot).\n\nFor labs that only open Friday afternoon (2 PM onwards), fasting tests become impractical — most patients cannot fast until 2 PM comfortably, especially in the UAE heat. If this is your situation, schedule your fasting test for a Saturday morning or use a home collection service.\n\nDuring Ramadan, Friday patterns shift significantly. Labs adjust hours to accommodate fasting Muslims — many open evening hours (8 PM–12 AM or later) when patients can come after breaking their fast. Blood draws during Ramadan fasting hours are technically possible for non-fasting patients; fasting Muslims typically wait until after iftar for non-mandatory tests.",
      },
      {
        heading: "Public Holidays and Ramadan Hours",
        content:
          "UAE public holidays that affect lab availability in 2026: Eid Al Fitr (approximately late March 2026; dates shift annually based on the Islamic lunar calendar), Eid Al Adha (approximately early June 2026), UAE National Day (December 2–3), New Year's Day (January 1). Most labs close for 2–4 days around Eid holidays.\n\nDuring Ramadan (approximately February–March 2026), standard UAE lab hours shift. Government health centres and hospital labs may operate reduced daytime hours (9 AM–2 PM) and add evening sessions (8 PM–12 AM). Private labs like Al Borg and Medsol similarly adjust hours — check their app or call ahead.\n\nHome collection services during Ramadan: DarDoc and Healthchecks360 typically operate evening hours during Ramadan for fasting patients. Morning slots (7–9 AM) remain available for non-fasting tests. Blood draws during the fasting period are permissible for medical necessity according to most Islamic scholars and are commonly performed in UAE labs throughout Ramadan.",
      },
    ],
    relatedTests: ["cbc", "lipid-profile", "fasting-glucose", "vitamin-d", "tsh"],
    relatedPackages: ["medsol-basic", "thumbay-basic", "dardoc-athome-basic"],
    faqs: [
      {
        question: "Which labs are open on Friday mornings in the UAE?",
        answer:
          "Thumbay Labs opens Friday at 9 AM (Dubai, Ajman, Sharjah branches). Alpha Medical Laboratory opens Friday at 9 AM in Dubai. MenaLabs opens Friday at 9 AM in Dubai and Abu Dhabi. PureLab in Abu Dhabi is open 24/7 including Friday mornings. DarDoc and Healthchecks360 offer home collection from 7 AM on Fridays.",
      },
      {
        question: "Are blood test labs open on Saturday in the UAE?",
        answer:
          "Yes. Saturday is a standard working day at virtually all UAE diagnostic labs. Al Borg, Thumbay, Medsol, Alpha Medical, Unilabs, and MenaLabs all operate full Saturday hours (typically 7–7:30 AM through 8–10 PM). Note that NRL in Abu Dhabi closes on Sunday instead.",
      },
      {
        question: "Can I get a fasting blood test on Friday in the UAE?",
        answer:
          "Yes, but you need to either find a lab open Friday morning (Thumbay, Alpha Medical, MenaLabs) or book a home collection service (DarDoc, Healthchecks360) that operates Friday mornings from 7 AM. Labs that only open Friday afternoon (2 PM) make fasting tests impractical for most patients.",
      },
      {
        question: "Are any UAE labs open 24 hours?",
        answer:
          "PureLab in Abu Dhabi operates 24/7. Hospital emergency department labs also process samples overnight, though they are for emergency patients only. DarDoc home collection operates daily from 7 AM to 11 PM and occasionally accommodates urgent requests outside these hours.",
      },
    ],
  },

  "same-day-results": {
    slug: "same-day-results",
    title: "Same-Day Blood Test Results in the UAE",
    h1: "Same-Day Blood Test Results in the UAE — Which Tests and Which Labs",
    metaDescription:
      "Which UAE blood tests give same-day results? CBC, glucose, LFT, and KFT results available in 4–6 hours. Vitamin D, hormones, and tumor markers take 24–48 hours. Labs with fastest turnaround: PureLab (12h), Medsol (18h). Updated March 2026.",
    heroText:
      "Turnaround time for blood tests in the UAE ranges from 2 hours for urgent troponin (cardiac emergency) to 72+ hours for specialised tests like food intolerance panels or genetic tests. For routine wellness tests, most UAE labs deliver results within 4–24 hours. PureLab Abu Dhabi offers the fastest routine turnaround at 12 hours.",
    quickFacts: [
      { icon: "Zap", label: "Fastest Tests", value: "CBC, Glucose: 4–6 hours" },
      { icon: "Clock", label: "Vitamin D", value: "24–48 hours" },
      { icon: "Clock", label: "Hormones / NIPT", value: "24–48 h / 5–7 days" },
      { icon: "MapPin", label: "Fastest Lab", value: "PureLab Abu Dhabi (12h routine)" },
    ],
    sections: [
      {
        heading: "Tests That Give Same-Day Results (4–6 Hours)",
        content:
          "The following tests are routinely processed within 4–6 hours of sample receipt at most UAE labs, making same-day results achievable if you arrive by 9 AM:\n\nComplete Blood Count (CBC): The most common same-day result. Processed by automated haematology analyser; 2–4 hours at most labs.\nFasting / Random Blood Glucose: Processed immediately alongside CBC; typically 2–4 hours.\nLiver Function Test (LFT — ALT, AST, ALP, GGT, bilirubin, albumin): 4–6 hours at most labs.\nKidney Function Test (KFT — creatinine, BUN, eGFR, electrolytes): 4–6 hours.\nUric Acid: 4–6 hours.\nCalcium and Magnesium: 4–6 hours.\nCRP (C-Reactive Protein): 4–6 hours.\nUrinalysis: 2–4 hours.\nESR (Erythrocyte Sedimentation Rate): 2–4 hours.\nTroponin (urgent/emergency): 2 hours or less — hospital emergency labs prioritise this.\n\nArriving before 9 AM at most UAE labs ensures your sample enters the morning batch run and results are available by early afternoon.",
      },
      {
        heading: "Tests That Take 12–24 Hours",
        content:
          "Several commonly ordered tests require overnight incubation, delayed processing batches, or external reference lab analysis:\n\nHbA1c (Glycated Haemoglobin): Most labs process in-house with 6–12 hour turnaround. PureLab delivers HbA1c in their 12-hour batch.\nTSH (Thyroid Stimulating Hormone): 12–24 hours at most labs. PureLab 12 hours; Medsol 18 hours; Al Borg 24 hours.\nThyroid Panel (TSH, FT3, FT4): 18–24 hours.\nTestosterone: 18–24 hours.\nCortisol: 18–24 hours.\nProlactin: 18–24 hours.\nFSH and Estradiol: 18–24 hours.\nVitamin B12: 18–24 hours.\nFolate: 18–24 hours.\nHIV Test: 18–24 hours (4th generation combined antigen/antibody). Urgent HIV results can be expedited at some labs to 2–4 hours for a higher fee.\nHepatitis B (HBsAg): 18–24 hours.\nVDRL/Syphilis: 18–24 hours.\nIron Studies (ferritin, TIBC, serum iron): 12–18 hours.",
      },
      {
        heading: "Tests That Take 24–72 Hours",
        content:
          "Vitamin D (25-Hydroxy): 24–48 hours at most UAE labs. Despite being one of the most commonly ordered tests in the UAE, Vitamin D is often processed in batches rather than continuously. Al Borg: 24 hours; Medsol: 24 hours; Unilabs: 24–36 hours.\n\nAMH (Anti-Müllerian Hormone): 48 hours. AMH is a relatively specialised assay and most labs batch it every 24–48 hours.\n\nTumour Markers (PSA, CA-125, CEA, AFP): 24–48 hours.\nInsulin (fasting): 24 hours.\nBNP/NT-proBNP (cardiac): 12–24 hours.\nStool Analysis: 24–48 hours (requires culture and microscopy).\nBlood Culture: 48–72 hours (minimum incubation time; negative results held for 5 days).\nIgE Panels (allergy screening): 24–48 hours.",
      },
      {
        heading: "Fastest Labs in the UAE by Turnaround Time",
        content:
          "PureLab (Abu Dhabi): Routine panel turnaround of 12 hours. The UAE's most technologically advanced standalone lab with automated robotic processing lines capable of 30 million samples per year. CBC, LFT, KFT results in 4 hours. TSH, Vitamin D results in 12 hours. Home collection available with free pickup.\n\nMedsol Diagnostics: 18-hour average turnaround for routine tests. Their Dubai branches offer same-day results for CBC and metabolic panels if samples arrive before 10 AM. Results delivered via email and WhatsApp.\n\nAlpha Medical Laboratory: Similar to Medsol — 18-hour routine turnaround. Results emailed and available on their portal.\n\nAl Borg Diagnostics: 24-hour standard turnaround with online results via their app. Express service (12-hour) available for a surcharge of approximately AED 50.\n\nUnilabs Dubai: 24-hour standard. Premium positioning with UKAS and CAP accreditation — precision over speed. Express service available for critical tests.\n\nDarDoc (home collection): Results delivered digitally within the lab partner's turnaround window (18–24 hours for routine). DarDoc partners with multiple DHA-licensed labs and results are accessible via their app.",
      },
      {
        heading: "How to Get Results Faster — Express Services",
        content:
          "Most UAE labs offer an express or urgent processing option at a premium. Al Borg Diagnostics charges approximately AED 50 for express processing (12 hours vs standard 24 hours). STAR Metropolis offers same-day processing on most routine tests for an additional AED 50–80.\n\nFor the absolute fastest results — if you are deciding about a medical issue on the same day — visit the lab before 8 AM, request express processing, and specify which tests are time-critical. Most labs will prioritise your sample in the morning batch run.\n\nResults delivery methods in the UAE: WhatsApp PDF delivery (Medsol, Alpha Medical, DarDoc), Email PDF (all major labs), App-based portals (Al Borg app, DarDoc app, Unilabs portal), SMS notification with portal link (most labs), Direct call from doctor if critical values are detected. Physical paper reports are still available on request at most walk-in labs but are increasingly being replaced by digital-first delivery.",
      },
    ],
    relatedTests: ["cbc", "lft", "kft", "hba1c", "tsh", "vitamin-d", "troponin"],
    relatedPackages: ["medsol-basic", "dardoc-athome-basic"],
    faqs: [
      {
        question: "Which blood tests give results on the same day in the UAE?",
        answer:
          "CBC, fasting glucose, liver function (LFT), kidney function (KFT), CRP, uric acid, and urinalysis typically deliver results within 4–6 hours. HbA1c and TSH are available within 12–18 hours at most labs.",
      },
      {
        question: "How long does a Vitamin D test take in the UAE?",
        answer:
          "Vitamin D (25-hydroxy) results take 24–48 hours at most UAE labs. Despite being one of the most commonly ordered tests in the country, it is processed in batches rather than in real-time. PureLab Abu Dhabi delivers Vitamin D results in 12 hours.",
      },
      {
        question: "Which UAE lab has the fastest blood test results?",
        answer:
          "PureLab Abu Dhabi has the fastest routine turnaround — 12 hours for most standard tests. For same-day results on specific tests, Medsol and Alpha Medical deliver CBC and metabolic panel results in 4–6 hours if samples arrive before 10 AM.",
      },
      {
        question: "How are blood test results delivered in the UAE?",
        answer:
          "Most UAE labs deliver results digitally via WhatsApp PDF, email, app portal, or SMS with a secure link. Physical paper reports are available on request. DarDoc delivers results exclusively via their app. Al Borg has their own patient portal accessible via the Al Borg app.",
      },
    ],
  },

  "mens-health-40-plus": {
    slug: "mens-health-40-plus",
    title: "Essential Blood Tests for Men Over 40 in the UAE",
    h1: "Essential Blood Tests for Men Over 40 in the UAE — Annual Health Checklist",
    metaDescription:
      "Men over 40 in the UAE: essential annual blood tests including CBC, lipid profile, HbA1c, LFT, KFT, TSH, Vitamin D, PSA, and testosterone. UAE-specific health risks, recommended frequency, and cheapest labs for each test. Updated March 2026.",
    heroText:
      "Cardiovascular disease risk rises sharply after 40, diabetes prevalence in the UAE reaches 17% in adults (IDF 2023), and testosterone levels decline approximately 1–2% per year from the mid-30s. Men over 40 living in the UAE face a specific combination of health risks shaped by diet, sedentary work environments, heat-driven indoor lifestyle, and high rates of Vitamin D deficiency. Annual blood testing is the single most cost-effective health investment available.",
    quickFacts: [
      { icon: "Calendar", label: "Recommended Frequency", value: "Annual comprehensive panel" },
      { icon: "DollarSign", label: "Full Panel Cost", value: "AED 350–900" },
      { icon: "Users", label: "UAE Diabetes Rate", value: "17% of adults (IDF 2023)" },
      { icon: "Heart", label: "PSA Screening Starts", value: "Age 50 (or 45 with risk factors)" },
    ],
    sections: [
      {
        heading: "Core Annual Tests Every Man Over 40 Should Get",
        content:
          "Complete Blood Count (CBC): Detects anaemia, infection, blood cell abnormalities. Price range in UAE: AED 69–120. Same-day results. Men with fatigue, shortness of breath, or persistent tiredness should prioritise this.\n\nLipid Profile (Total Cholesterol, LDL, HDL, Triglycerides, VLDL): Cardiovascular disease is the leading cause of death in UAE expats. LDL targets for men over 40 with no other risk factors: below 3.0 mmol/L. With diabetes or hypertension: below 1.8 mmol/L. Price range: AED 80–150. Must fast 10–12 hours.\n\nHbA1c (Glycated Haemoglobin): The UAE has one of the world's highest Type 2 diabetes rates. HbA1c above 5.7% indicates pre-diabetes; above 6.5% is diagnostic of diabetes. Unlike fasting glucose, HbA1c does not require fasting. Price range: AED 60–100.\n\nLiver Function Test (LFT): Non-alcoholic fatty liver disease (NAFLD) affects an estimated 30–40% of UAE adults. A rising ALT is often the first detectable sign. Price range: AED 65–120. Fasting not strictly required but recommended by some labs.\n\nKidney Function Test (KFT): Creatinine, eGFR, BUN, and electrolytes. Early CKD is often silent — regular monitoring catches it before symptoms appear. Price range: AED 60–110.",
      },
      {
        heading: "Additional Tests for Men Over 40 in the UAE",
        content:
          "TSH (Thyroid Stimulating Hormone): Hypothyroidism is underdiagnosed in men and presents as fatigue, weight gain, and decreased libido — easily attributed to ageing. TSH is the most sensitive first-line thyroid test. Price range: AED 60–100.\n\nVitamin D (25-Hydroxy): Despite living in one of the sunniest regions on Earth, Vitamin D deficiency affects 60–90% of UAE adults due to indoor work environments, sun avoidance, and cultural dress. Low Vitamin D accelerates muscle loss, impairs immune function, and is associated with increased cardiovascular risk. Price range: AED 85–150.\n\nVitamin B12: Common deficiency among South Asian expats following vegetarian or semi-vegetarian diets. B12 deficiency presents as fatigue, tingling in the hands and feet, and cognitive fog. Price range: AED 80–130.\n\nTestosterone (Total): Testosterone levels decline 1–2% per year after age 35 (ADAM — androgen deficiency in ageing males). Symptoms overlap with other conditions: fatigue, reduced muscle mass, mood changes, low libido, weight gain. Testing requires a morning blood draw (before 10 AM when levels are highest). Price range: AED 100–160.\n\nFasting Glucose: Alongside HbA1c, provides a snapshot of current blood sugar control. Particularly useful if HbA1c is borderline. Price range: AED 30–50.",
      },
      {
        heading: "PSA and Cancer Screening for Men",
        content:
          "Prostate-Specific Antigen (PSA): DHA and international guidelines (ACS, USPSTF) recommend PSA screening discussion with a doctor starting at age 50 for average-risk men. Men of African or Caribbean descent and those with a family history of prostate cancer should start at 45. In the UAE, PSA screening is included in many executive health packages and can be self-requested at any lab without a doctor's referral.\n\nPSA does not diagnose prostate cancer — it is a screening marker. A PSA above 4.0 ng/mL warrants urology referral; between 2.5–4.0 is a 'grey zone' that may warrant repeat testing or referral depending on age and family history. Price range at UAE labs: AED 75–120.\n\nCarcinoembryonic Antigen (CEA): Non-specific cancer marker primarily used to monitor colorectal cancer. For screening purposes in men over 50, particularly current or former smokers, it is sometimes included in executive packages. Price range: AED 90–150.\n\nNote: Cancer screening markers in blood tests are not diagnostic — they are screening tools that require clinical interpretation. Always review results with a physician.",
      },
      {
        heading: "UAE-Specific Health Context for Men",
        content:
          "The UAE's adult diabetes prevalence of approximately 17% (IDF Diabetes Atlas 2023) is among the highest globally. For men over 40, the annual HbA1c test is not optional — it is arguably the most important single test on this list. Early-stage Type 2 diabetes is often completely reversible with lifestyle changes; late-stage disease causes kidney failure, blindness, and neuropathy.\n\nCardiovascular disease accounts for approximately 30% of deaths in the UAE. The combination of high LDL cholesterol (common in South Asian expats due to dietary patterns), sedentary office work, and high stress creates significant coronary risk. A lipid profile plus hs-CRP (high-sensitivity CRP) is the most informative cardiovascular risk assessment available through blood testing.\n\nVitamin D deficiency is near-universal in the UAE despite the climate. Sun exposure for Vitamin D synthesis requires UV-B light (strongest 10 AM–2 PM) — precisely the hours most UAE residents spend indoors or in cars. Many UAE physicians now recommend empirical Vitamin D supplementation (1,000–2,000 IU/day) without testing; however, testing first avoids over-supplementation toxicity.",
      },
      {
        heading: "Recommended Packages for Men Over 40",
        content:
          "The most cost-effective approach for men over 40 is a comprehensive health package that bundles the core tests. Buying each test individually typically costs 30–50% more than a bundled package.\n\nAl Borg Comprehensive Wellness (AED 499): CBC, lipid profile, glucose, HbA1c, LFT, KFT, thyroid panel, Vitamin D, B12, iron studies, urinalysis. 85 biomarkers. Does not include PSA or testosterone — add those separately (approximately AED 130–230 additional).\n\nMedsol Standard Wellness (AED 230): Same core tests at significantly lower price. 68 biomarkers. Excellent value for self-paying patients. Add TSH, Vitamin D, and testosterone if not included in your chosen package.\n\nUnilabs Executive Diagnostics (AED 999): The most comprehensive option available at a single UAE lab. 150 biomarkers including cardiac troponin and full tumour marker panel. Suits men over 50 who want a single comprehensive annual screen including cancer markers.",
      },
    ],
    relatedTests: ["cbc", "lipid-profile", "hba1c", "lft", "kft", "tsh", "vitamin-d", "testosterone", "psa", "crp"],
    relatedPackages: ["alborg-comprehensive", "alborg-executive", "medsol-standard", "unilabs-executive"],
    faqs: [
      {
        question: "What blood tests should men over 40 get in the UAE?",
        answer:
          "Annual must-haves: CBC, lipid profile, HbA1c, fasting glucose, LFT, KFT, TSH, Vitamin D, and Vitamin B12. Add testosterone if you have symptoms of low energy, reduced libido, or muscle loss. Add PSA from age 50 (or 45 with risk factors). CRP adds cardiovascular risk context.",
      },
      {
        question: "What is the cheapest complete health check for men in the UAE?",
        answer:
          "Medsol Standard Wellness at AED 230 covers CBC, lipid profile, diabetes panel, liver, kidney, TSH, Vitamin D, B12, and iron studies — 68 biomarkers. Adding testosterone (AED 100) and PSA (AED 75) brings the total to AED 405 for a comprehensive screen.",
      },
      {
        question: "When should men in the UAE start PSA testing?",
        answer:
          "DHA guidelines and international consensus recommend PSA screening discussion with a doctor starting at age 50 for average-risk men. Men with African ancestry or family history of prostate cancer should start at 45. PSA screening before 40 is not recommended.",
      },
      {
        question: "How often should men over 40 get blood tests?",
        answer:
          "Annually is the minimum recommendation for the core panel (CBC, lipid, HbA1c, LFT, KFT, TSH, Vitamin D). Men with existing conditions like diabetes, hypertension, or known high cholesterol may need 3–6 monthly monitoring of specific markers under physician supervision.",
      },
      {
        question: "Does low testosterone require treatment?",
        answer:
          "Low testosterone (hypogonadism) is diagnosed when total testosterone falls below 300 ng/dL (10.4 nmol/L) on two separate morning blood tests, combined with clinical symptoms. Treatment (testosterone replacement therapy — TRT) is available in the UAE through endocrinologists and men's health clinics, but requires proper diagnosis by a licensed physician. Self-requesting a testosterone test is the first step.",
      },
    ],
  },

  "womens-health-30-plus": {
    slug: "womens-health-30-plus",
    title: "Essential Blood Tests for Women Over 30 in the UAE",
    h1: "Essential Blood Tests for Women Over 30 in the UAE — Complete Checklist",
    metaDescription:
      "Women over 30 in the UAE: essential blood tests including CBC, iron studies, thyroid panel, Vitamin D, B12, folate, calcium. Add AMH and lipid profile from 35+. PCOS screening and women's health packages. Updated March 2026.",
    heroText:
      "Women in the UAE over 30 face a distinctive health profile: iron deficiency anaemia is common due to menstrual blood loss and dietary patterns, Vitamin D deficiency is near-universal, thyroid disease is 5–8 times more common in women than men, and PCOS affects an estimated 10–15% of UAE women of reproductive age. Strategic annual blood testing catches these conditions early when they are most treatable.",
    quickFacts: [
      { icon: "Heart", label: "Thyroid Risk", value: "5–8x more common in women" },
      { icon: "DollarSign", label: "Women's Panel Cost", value: "AED 350–500" },
      { icon: "Baby", label: "AMH Testing", value: "Recommended from 32–35" },
      { icon: "Calendar", label: "CA-125 Screening", value: "From 40+ with risk factors" },
    ],
    sections: [
      {
        heading: "Core Annual Tests for Women Over 30",
        content:
          "Complete Blood Count (CBC): The foundational test for women of all ages. Detects iron-deficiency anaemia — particularly important for women with heavy periods (menorrhagia), which affects approximately 20–30% of reproductive-age women. Low haemoglobin causes fatigue, brain fog, and reduced immunity. Price range: AED 69–120.\n\nIron Studies (Serum Iron, Ferritin, TIBC): Ferritin is the most sensitive marker of iron stores — a normal haemoglobin does not rule out iron depletion if ferritin is low. Target ferritin for symptom-free women: above 30 ng/mL; ideal above 50 ng/mL. Price range: AED 140–220. Must fast 10–12 hours.\n\nThyroid Panel (TSH, FT3, FT4): Thyroid disease — primarily autoimmune hypothyroidism (Hashimoto's disease) — affects 5–10% of women by age 40. Symptoms (fatigue, weight gain, hair loss, cold intolerance, irregular periods) overlap with many other conditions, making thyroid testing essential. TSH alone (AED 60–100) is the standard first-line test; a full panel (AED 130–220) provides more detail.\n\nVitamin D (25-Hydroxy): Vitamin D deficiency is the most common nutritional deficiency in UAE women. Particularly important for women wearing full-coverage clothing who have minimal sun exposure. Chronic deficiency increases risk of osteoporosis, depression, and immune dysfunction. Price range: AED 85–150.\n\nVitamin B12: Deficiency risk is elevated in vegetarian women — a significant segment of UAE's South Asian expat community. Also relevant for women on metformin (for diabetes or PCOS) as it depletes B12. Price range: AED 80–130.",
      },
      {
        heading: "Tests to Add from Age 35: Cardiovascular and Metabolic",
        content:
          "From age 35, the risk profile shifts to include cardiovascular and metabolic concerns:\n\nLipid Profile: Cardiovascular disease risk begins climbing in women approaching perimenopause. Oestrogen has a protective effect on cholesterol metabolism; this advantage erodes as oestrogen levels decline. Target LDL below 3.0 mmol/L. Price range: AED 80–150. Fasting required.\n\nHbA1c: Insulin resistance is a hallmark of PCOS (the most common hormonal disorder in women of reproductive age in the UAE). Annual HbA1c screening catches pre-diabetes early. Price range: AED 60–100.\n\nAMH (Anti-Müllerian Hormone): From age 32–35, AMH becomes a clinically relevant marker of ovarian reserve for women considering future pregnancy. A declining AMH does not prevent pregnancy but indicates diminishing time to natural conception. Price range: AED 280–400. No fasting or cycle-day timing required.\n\nFolate (Folic Acid): Women planning pregnancy should have folate checked and supplemented (400–800 mcg/day) at least 3 months pre-conception. Women on oral contraceptives (which depletes folate) benefit from regular monitoring. Price range: AED 75–120.\n\nCalcium (Serum): Bone density peaks in the late 20s and begins declining from the mid-30s. Adequate calcium is essential. Serum calcium (AED 30–50) does not directly measure bone density but, combined with Vitamin D, guides supplementation decisions.",
      },
      {
        heading: "PCOS Screening: Key Blood Tests",
        content:
          "Polycystic Ovary Syndrome (PCOS) is estimated to affect 10–15% of women of reproductive age in the UAE — one of the highest rates globally, likely related to insulin resistance driven by dietary and lifestyle patterns. PCOS is frequently under-diagnosed because its symptoms (irregular periods, acne, hair thinning, weight gain) are often attributed to other causes.\n\nThe PCOS blood test panel includes: Total Testosterone (elevated in PCOS — typically above 0.7 ng/mL or 2.4 nmol/L). DHEAS (Dehydroepiandrosterone sulphate) — adrenal androgen. LH (Luteinising Hormone) and FSH — an LH:FSH ratio above 2:1 supports PCOS diagnosis (should be measured Day 2–4 of cycle). Fasting Insulin and Glucose (to assess insulin resistance — HOMA-IR calculation). AMH (elevated in PCOS — often above 4–5 ng/mL). Thyroid panel and prolactin (to exclude other causes of irregular periods).\n\nNone of these tests alone diagnoses PCOS — diagnosis requires the Rotterdam criteria (at least 2 of: irregular ovulation, clinical or biochemical hyperandrogenism, polycystic ovaries on ultrasound). Blood tests provide the 'biochemical hyperandrogenism' component and can prompt ultrasound referral.",
      },
      {
        heading: "Women Over 40: Additional Screening to Consider",
        content:
          "From age 40, the recommended panel expands:\n\nCA-125 (Cancer Antigen 125): Ovarian cancer marker. CA-125 is not recommended as a population-wide screening test (low specificity — elevated in endometriosis, fibroids, and other benign conditions) but is appropriate for women with a family history of ovarian cancer or BRCA mutation carriers. CA-125 above 35 U/mL in a postmenopausal woman warrants urgent gynaecology referral. Price range: AED 90–150.\n\nhs-CRP (High-Sensitivity CRP): Cardiovascular risk in women is often underestimated. hs-CRP above 3 mg/L indicates elevated inflammatory cardiovascular risk. In women, this test adds incremental risk prediction beyond lipid profile. Price range: AED 50–90.\n\nFSH (Follicle Stimulating Hormone): Rising FSH in women in their early-to-mid 40s indicates perimenopause. FSH above 25 IU/L (measured on day 2–3 of cycle) suggests diminished ovarian reserve; above 40 IU/L in the context of amenorrhoea suggests menopause. This guides discussion with an OB-GYN about fertility windows and HRT. Price range: AED 80–120.\n\nDEXA scan referral (bone density): Not a blood test, but a key step for women over 45 — request a referral from your GP. Low Vitamin D and calcium should be corrected before DEXA scan.",
      },
      {
        heading: "Women's Health Packages in UAE Labs",
        content:
          "Medsol Women's Health Panel (AED 399): The most comprehensive gender-specific package available at a budget lab. Includes CBC, lipid profile, glucose, LFT, KFT, full thyroid panel, Vitamin D, B12, iron studies, folate, FSH, estradiol, prolactin, and calcium — 82 biomarkers. Excellent value. Add AMH and testosterone separately if PCOS screening is needed.\n\nAl Borg Comprehensive Wellness (AED 499): Not gender-specific but covers the core panel well — CBC, lipid, diabetes, LFT, KFT, thyroid, Vitamin D, B12, iron studies. Does not include reproductive hormones (FSH, estradiol, AMH). Add fertility hormone tests for approximately AED 200–300 additional.\n\nDarDoc At-Home Comprehensive (AED 449): Ideal for women who prefer home collection. Covers the main metabolic panel with home nurse visit. Add-on tests can be requested at the time of booking.",
      },
    ],
    relatedTests: ["cbc", "iron-studies", "thyroid-panel", "vitamin-d", "vitamin-b12", "folate", "calcium", "amh", "fsh", "estradiol", "testosterone", "ca-125"],
    relatedPackages: ["medsol-womens", "alborg-comprehensive", "dardoc-athome-comprehensive"],
    faqs: [
      {
        question: "What blood tests should women over 30 get in the UAE?",
        answer:
          "Core annual tests: CBC, iron studies (ferritin, TIBC), thyroid panel (TSH at minimum), Vitamin D, and Vitamin B12. From 35+, add lipid profile, HbA1c, and AMH. From 40+, consider CA-125 and hs-CRP. PCOS screening should include testosterone, LH, FSH, AMH, and fasting insulin.",
      },
      {
        question: "What is the best women's health blood test package in the UAE?",
        answer:
          "Medsol Women's Health Panel (AED 399) offers the best value — 82 biomarkers including reproductive hormones, thyroid, vitamins, iron, and metabolic markers. For premium testing including cardiac markers, Unilabs Executive at AED 999 or Al Borg Comprehensive at AED 499 are good options.",
      },
      {
        question: "How do I test for PCOS in the UAE?",
        answer:
          "Blood tests for PCOS include total testosterone, DHEAS, LH, FSH (Day 2–4 of cycle), fasting insulin, fasting glucose, AMH, prolactin, and TSH. These can be self-requested at standalone labs. Diagnosis requires a doctor's assessment combining blood results with a pelvic ultrasound.",
      },
      {
        question: "When should women get AMH tested in the UAE?",
        answer:
          "AMH testing is most clinically useful from age 30–35 if you are planning to delay pregnancy, or at any age if you are concerned about fertility. AMH does not require cycle-day timing and can be drawn on any day. Most UAE labs charge AED 280–400 for AMH.",
      },
      {
        question: "Is iron deficiency common in UAE women?",
        answer:
          "Yes. Iron deficiency anaemia is one of the most common nutritional deficiencies in UAE women of reproductive age, particularly those with heavy menstrual periods. A normal haemoglobin does not rule out iron depletion — ferritin (part of the iron studies panel) is the most sensitive marker.",
      },
    ],
  },

  "senior-health-screening": {
    slug: "senior-health-screening",
    title: "Health Screening for Seniors (60+) in the UAE",
    h1: "Comprehensive Health Screening for Seniors (60+) in the UAE",
    metaDescription:
      "Senior health screening in the UAE: essential blood tests for adults over 60 including kidney function, cardiac markers, thyroid, Vitamin D, B12, PSA, CEA, CRP, and BNP. Which packages are suitable and what to watch for. Updated March 2026.",
    heroText:
      "Adults over 60 in the UAE face amplified versions of the same health risks present from age 40 — with kidney function, cardiac health, and bone health emerging as additional priorities. Proactive screening every 6–12 months (rather than annual) is recommended for seniors with established conditions. UAE's executive health packages are well-suited to this demographic.",
    quickFacts: [
      { icon: "Calendar", label: "Recommended Frequency", value: "Every 6–12 months" },
      { icon: "Heart", label: "Key Priority", value: "Kidney + cardiac function" },
      { icon: "DollarSign", label: "Executive Package Cost", value: "AED 499–999" },
      { icon: "Shield", label: "Cancer Markers", value: "PSA (men), CA-125 (women), CEA" },
    ],
    sections: [
      {
        heading: "Core Blood Tests for Adults Over 60",
        content:
          "Complete Blood Count (CBC): Anaemia of chronic disease becomes more prevalent over 60. CBC detects anaemia, thrombocytopenia (low platelets), and lymphocyte changes associated with immune ageing.\n\nComprehensive Metabolic Panel: LFT + KFT combined — essential baseline for medication dosing (many medications are hepatically or renally cleared, and both liver and kidney function decline with age). Monitor creatinine, eGFR, ALT, AST, and albumin annually.\n\nLipid Profile: Statin therapy is common in this age group; LFT monitoring alongside lipid control is necessary. Target LDL below 1.8 mmol/L for seniors with established cardiovascular disease.\n\nHbA1c: Diabetes is common and often under-diagnosed in seniors. HbA1c above 7.0% in a managed diabetic warrants medication review. For seniors over 75, HbA1c targets are less strict (7.5–8.0%) to avoid hypoglycaemia risk.\n\nTSH (Thyroid Stimulating Hormone): Both hypothyroidism and hyperthyroidism become more prevalent over 60. Subclinical hyperthyroidism in seniors carries specific risk of atrial fibrillation and bone density loss. Routine annual TSH is essential.",
      },
      {
        heading: "Kidney Function: The Critical Monitor for Seniors",
        content:
          "Chronic Kidney Disease (CKD) affects an estimated 13% of UAE adults over 60, driven by high rates of diabetes and hypertension. The key metrics are: eGFR (estimated Glomerular Filtration Rate) — calculated from serum creatinine, age, and sex. eGFR below 60 mL/min/1.73m² for more than 3 months indicates CKD Stage 3. Below 30 is advanced CKD requiring nephrology referral. Creatinine alone is insufficient — eGFR is the meaningful measure. Urea/BUN — elevated in both CKD and dehydration (common in UAE's heat). Electrolytes (sodium, potassium, bicarbonate) — disrupted in CKD and important for medication safety (ACE inhibitors and ARBs can elevate potassium).\n\nSeniors on NSAIDs (ibuprofen, diclofenac), which are commonly self-administered for pain, should have KFT checked every 6 months — NSAIDs reduce renal blood flow and can cause acute-on-chronic kidney injury.\n\nNRL (National Reference Laboratory) in Abu Dhabi specialises in complex renal panels and is the reference lab for M42/Mubadala Health. For seniors in Abu Dhabi with established CKD, NRL offers detailed urinary protein quantification (urine albumin:creatinine ratio) as part of extended CKD monitoring panels.",
      },
      {
        heading: "Cardiac Markers for Seniors",
        content:
          "Beyond the standard lipid profile and fasting glucose, seniors benefit from additional cardiac biomarkers:\n\nhs-CRP (High-Sensitivity CRP): The best blood-based cardiovascular risk predictor beyond lipid levels. hs-CRP above 3 mg/L significantly increases cardiac risk prediction. Price range: AED 50–90.\n\nBNP / NT-proBNP: Brain Natriuretic Peptide — a cardiac stress marker produced by the heart's ventricles under pressure. Elevated BNP (above 100 pg/mL) in a symptomatic senior suggests heart failure and warrants urgent cardiology referral. BNP is also used to monitor known heart failure treatment response. Price range: AED 200–300.\n\nHomocysteine: Elevated homocysteine is an independent cardiovascular risk factor linked to B12 and folate deficiency. Levels above 15 μmol/L indicate elevated risk. Easily corrected with B-vitamin supplementation. Not routinely included in standard panels but available as an add-on.\n\nTroponin (in the context of symptoms): High-sensitivity troponin is used in emergency settings to rule out myocardial infarction. A background low-level elevated troponin in a stable senior may indicate cardiac strain and warrants clinical review.",
      },
      {
        heading: "Cancer Screening Markers for Seniors",
        content:
          "PSA (Prostate-Specific Antigen) — Men over 60: Annual PSA is strongly recommended for men over 60. Between ages 65–75, the benefit of PSA screening is highest as prostate cancer is most prevalent. Above 75, the benefit of treatment for detected prostate cancer declines; discuss with your urologist whether continued screening is appropriate. Price range: AED 75–120.\n\nCA-125 (Ovarian Cancer Marker) — Women over 60: Ovarian cancer incidence peaks after menopause. CA-125 has poor specificity (elevated in many benign conditions) but is reasonable to include in a post-menopausal woman's annual screen, particularly with family history. Price range: AED 90–150.\n\nCEA (Carcinoembryonic Antigen) — Both sexes: CEA is primarily a colorectal and lung cancer marker. Annual CEA in adults over 60 (particularly former smokers) is included in most UAE executive health packages. A rising CEA is more meaningful than a single elevated value. Price range: AED 90–150.\n\nAFP (Alpha Fetoprotein): Liver cancer marker. Relevant for seniors with chronic hepatitis B or C, cirrhosis, or significant alcohol history.",
      },
      {
        heading: "Suitable Packages for Seniors in UAE Labs",
        content:
          "Al Borg Executive Health Screen (AED 899): 120 biomarkers including comprehensive metabolic, thyroid, vitamins, cardiac CRP, and tumour markers (PSA, CEA). Well-suited for seniors wanting a broad annual screen without individual test ordering. Does not include BNP — add separately if cardiac symptoms are present.\n\nUnilabs Executive Diagnostics (AED 999): The most comprehensive single-lab executive package in the UAE. 150 biomarkers including cardiac troponin, full tumour marker panel, and all standard metabolic tests. Particularly suitable for seniors with multiple conditions or on multiple medications who need a complete annual review.\n\nNational Reference Laboratory (NRL) Abu Dhabi: For seniors with established kidney disease, NRL offers specialised CKD monitoring panels not available at standard commercial labs. Contact NRL directly for their senior/chronic disease monitoring packages.",
      },
    ],
    relatedTests: ["cbc", "kft", "lft", "lipid-profile", "hba1c", "tsh", "vitamin-d", "vitamin-b12", "crp", "bnp", "psa", "ca-125", "cea"],
    relatedPackages: ["alborg-executive", "unilabs-executive", "medsol-standard"],
    faqs: [
      {
        question: "How often should seniors over 60 get blood tests in the UAE?",
        answer:
          "Seniors with no chronic conditions should get a comprehensive panel annually. Those with diabetes, hypertension, or CKD should repeat specific panels (KFT, glucose, HbA1c) every 3–6 months under physician supervision. An annual executive health check package covering 100+ biomarkers is the most efficient approach.",
      },
      {
        question: "What is BNP and why is it important for seniors?",
        answer:
          "BNP (Brain Natriuretic Peptide) is a cardiac stress marker secreted by the heart under pressure. Elevated BNP in seniors is an early indicator of heart failure and warrants cardiology referral. It is available at Al Borg (AED 250), Medsol (AED 200), and Unilabs (AED 300). It is particularly important for seniors with shortness of breath or ankle swelling.",
      },
      {
        question: "Should seniors get cancer marker blood tests in the UAE?",
        answer:
          "PSA for men over 60, CA-125 for women over 60 with risk factors, and CEA for all adults over 60 (especially former smokers) are reasonable to include in an annual screen. These are markers, not diagnostic tests — an elevated result requires clinical interpretation and follow-up, not immediate alarm.",
      },
      {
        question: "Is kidney function testing especially important for UAE seniors?",
        answer:
          "Yes. CKD affects approximately 13% of UAE adults over 60 due to high diabetes and hypertension rates. eGFR (derived from creatinine) is the key metric — below 60 mL/min/1.73m² for 3+ months indicates Stage 3 CKD. Early detection allows dietary and medication adjustment to slow progression.",
      },
    ],
  },

  "corporate-health-check": {
    slug: "corporate-health-check",
    title: "Corporate Health Screening in the UAE — Employer Guide",
    h1: "Corporate Health Screening in the UAE — What Employers Need to Know",
    metaDescription:
      "Guide to corporate health screening in the UAE. DHA/MOHAP occupational health requirements, standard employer check-up panels, B2B lab options (MenaLabs, Al Borg, Thumbay), on-site screening, and volume pricing (20–40% discount for 50+ employees). Updated March 2026.",
    heroText:
      "Corporate health screening in the UAE is both a regulatory requirement (for certain employee categories) and an increasingly common employee benefit across white-collar sectors. Labs like MenaLabs, Al Borg, and Thumbay offer dedicated B2B programmes with volume discounts, results portals, and on-site collection options. Group testing for 50+ employees typically commands 20–40% discounts off standard pricing.",
    quickFacts: [
      { icon: "Briefcase", label: "Volume Discount", value: "20–40% for 50+ employees" },
      { icon: "Building2", label: "B2B Labs", value: "MenaLabs, Al Borg, Thumbay, NRL" },
      { icon: "FileText", label: "Regulatory Basis", value: "DHA / MOHAP Occupational Health guidelines" },
      { icon: "MapPin", label: "On-Site Screening", value: "Available via DarDoc, MenaLabs" },
    ],
    sections: [
      {
        heading: "Regulatory Requirements for Occupational Health in the UAE",
        content:
          "The UAE requires pre-employment and periodic health screening for specific employee categories under Federal Law No. 8 of 1980 (UAE Labour Law) and MOHAP Occupational Health regulations. The Dubai Health Authority maintains separate DHA Occupational Health requirements for workers in certain sectors.\n\nFood handlers (restaurant staff, catering workers) must hold a valid Food Handler's Medical Certificate, renewed annually. This includes: CBC, HBsAg, stool analysis, VDRL, and a physical examination. The certificate is issued by approved MOHAP/DHA centres and is a condition of operating a food establishment under DED licence conditions.\n\nHealthcare workers (doctors, nurses, lab staff, allied health) must have pre-employment and annual occupational health screening as per DHA/DOH licensing requirements. This includes: HIV, Hepatitis B immunity (HBsAg, HBcAb, HBsAb), Hepatitis C, Tuberculosis screening (Chest X-ray ± Mantoux/IGRA), and a general fitness assessment.\n\nConstruction and industrial workers in some free zones require baseline audiometry, spirometry, and blood lead levels under specific site safety regulations. The MOHAP Occupational Health Department publishes sector-specific requirements.",
      },
      {
        heading: "Standard Corporate Health Check Panel",
        content:
          "Most UAE employers offering health screening as an employee benefit include the following standard panel:\n\nCBC (Complete Blood Count): Detects anaemia, infection, and haematological disorders — the most universally useful single test.\nLipid Profile: Cardiovascular risk assessment — particularly relevant for sedentary office workers and high-stress executives.\nFasting Glucose and HbA1c: Given the UAE's 17% diabetes prevalence, screening all employees is a sound investment in productivity and absence reduction.\nLFT (Liver Function): Baseline for employees on statins or other hepatically cleared medications.\nKFT (Kidney Function): Hypertension and diabetes screening downstream effect.\nTSH (Thyroid): Often undiagnosed, easily treated — common in female employees.\nUrinalysis: Simple screen for diabetes, kidney disease, UTI.\nChest X-ray: Required for food handlers; optional addition for comprehensive checks.\nVisual Acuity: Simple test, important for drivers, equipment operators, and screen workers.\nBlood Pressure and BMI: Measured on-site at the time of screening.",
      },
      {
        heading: "B2B Laboratory Options in the UAE",
        content:
          "MenaLabs (Cerba HealthCare): The most prominent B2B laboratory in the UAE, part of French diagnostic group Cerba. MenaLabs has a dedicated corporate health division offering: customisable panels, a corporate client portal for results management (HR teams can view aggregated anonymised data), on-site phlebotomy for groups of 20+, and pricing from approximately AED 150–250 per employee for a standard panel. Operates in Dubai and Abu Dhabi.\n\nAl Borg Diagnostics: UAE's largest private lab network with B2B account management. Al Borg offers corporate accounts with dedicated relationship managers, volume pricing, electronic results delivery, and branch access across all emirates. Their corporate Comprehensive Wellness at approximately AED 350–420 per employee (group rate) covers 85 biomarkers.\n\nThumbay Labs: Strong B2B presence in Ajman, Sharjah, and Northern Emirates. Particularly cost-effective for companies with significant staff in the Northern Emirates. Thumbay University Hospital connection means they can offer pre-employment medicals with radiology (chest X-ray) in one visit.\n\nNational Reference Laboratory (NRL, Abu Dhabi): The reference laboratory for M42/Mubadala Health, NRL serves 250+ B2B healthcare clients. For Abu Dhabi-based companies, NRL is the premium B2B option with the broadest test menu and advanced molecular diagnostics.",
      },
      {
        heading: "Volume Pricing and Group Discounts",
        content:
          "UAE labs typically apply tiered volume discounts for corporate bookings:\n\n10–49 employees: 10–20% discount off standard pricing.\n50–99 employees: 20–30% discount. This is the most common range for SME corporate programmes.\n100+ employees: 30–40% discount. Large enterprises can negotiate bespoke pricing.\n500+ employees: Bespoke enterprise agreements with dedicated account managers, on-site collection teams, and customised reporting.\n\nFor illustrative pricing: A standard Medsol basic panel at AED 99 walk-in would be approximately AED 75–85 per employee for a group of 50. An Al Borg Comprehensive Wellness at AED 499 walk-in would be approximately AED 300–380 per employee for a group of 100.\n\nMost corporate health programmes run in Q1 (January–March) after annual budget approvals. Scheduling mid-year (June–September) can yield better lab availability and sometimes additional discounts.",
      },
      {
        heading: "On-Site Screening and Logistics",
        content:
          "On-site corporate screening brings phlebotomists and basic diagnostic equipment to the employer's premises. This is increasingly popular with UAE employers seeking to minimise employee downtime.\n\nDarDoc offers on-site corporate phlebotomy for groups of 10+ in Dubai and Abu Dhabi. DHA-licensed nurses arrive at your office with mobile phlebotomy kits. Samples are transported to partner labs for processing and results delivered to employees digitally and to HR via the DarDoc corporate portal.\n\nMenaLabs deploys on-site screening teams for groups of 20+ anywhere in Dubai and Abu Dhabi. Their corporate offering includes a mobile unit option with portable ECG, blood pressure stations, BMI assessment, and blood draw — a full health screening station.\n\nFor large-scale annual health days (500+ employees), companies often engage health screening companies (not just labs) that manage the entire event including registration, flow management, physician consultations, and individualised reports. Companies like Activ8 Health and Avivo Group in the UAE specialise in corporate health screening events.\n\nLogistics considerations: Fasting tests require employees to fast from the evening before, creating scheduling complexity for large groups. Consider offering two sessions — a morning session for fasting test employees (arriving 7–9 AM before work), and a midday session for non-fasting employees.",
      },
    ],
    relatedTests: ["cbc", "lipid-profile", "hba1c", "lft", "kft", "tsh", "urinalysis", "hepatitis-b"],
    relatedPackages: ["alborg-basic", "alborg-comprehensive", "thumbay-basic", "metropolis-wellness"],
    faqs: [
      {
        question: "Are employers in the UAE legally required to provide health screenings?",
        answer:
          "Mandatory occupational health screening applies to specific categories: food handlers (annual medical certificate required by DED), healthcare workers (DHA/DOH licensing requirement), and certain industrial workers under MOHAP sector guidelines. For general white-collar employees, periodic health screening is not legally mandated but is strongly encouraged under UAE Labour Law duty-of-care provisions.",
      },
      {
        question: "Which UAE labs offer B2B corporate health screening?",
        answer:
          "MenaLabs (Cerba HealthCare), Al Borg Diagnostics, Thumbay Labs, and National Reference Laboratory (Abu Dhabi) all have dedicated B2B corporate programmes with account management, volume pricing, and results portals. For on-site corporate screening, DarDoc and MenaLabs offer mobile phlebotomy services.",
      },
      {
        question: "What discount can companies expect for bulk blood testing in the UAE?",
        answer:
          "Groups of 50+ employees typically receive 20–30% off standard lab pricing. Groups of 100+ can negotiate 30–40% discounts. Large enterprises (500+) negotiate bespoke contracts. Contact the lab's B2B team directly to get a formal quote — most labs have a corporate sales team.",
      },
      {
        question: "How long does a corporate health screening take per employee?",
        answer:
          "For a standard blood draw (CBC, metabolic panel, vitamins) with blood pressure and BMI measurement, allow 10–15 minutes per employee. For a full panel including chest X-ray and physical examination, allow 30–45 minutes. When planning a corporate health day, schedule capacity at 3–4 blood draws per phlebotomist per hour.",
      },
      {
        question: "Can on-site corporate blood testing be done at our office?",
        answer:
          "Yes. DarDoc and MenaLabs both offer on-site corporate phlebotomy at your premises for groups of 10–20+ employees. They arrive with all necessary equipment, draw blood on-site, and transport samples to licensed labs for processing. Results are delivered digitally to employees within 24 hours, with anonymised aggregate reports for HR.",
      },
    ],
  },
};

// ─── Static Params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return Object.keys(GUIDES).map((slug) => ({ guide: slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guide: string }>;
}): Promise<Metadata> {
  const { guide: guideSlug } = await params;
  const guide = GUIDES[guideSlug];
  if (!guide) return { title: "Guide Not Found" };

  const base = getBaseUrl();
  return {
    title: `${guide.title} | UAE Open Healthcare Directory`,
    description: guide.metaDescription,
    alternates: { canonical: `${base}/labs/guides/${guideSlug}` },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `${base}/labs/guides/${guideSlug}`,
      type: "article",
    },
  };
}

// ─── Icon Helper ──────────────────────────────────────────────────────────────

function QuickFactIcon({ name }: { name: string }) {
  const props = { className: "w-4 h-4 text-[#006828] flex-shrink-0" };
  switch (name) {
    case "DollarSign": return <DollarSign {...props} />;
    case "Clock": return <Clock {...props} />;
    case "MapPin": return <MapPin {...props} />;
    case "FileText": return <FileText {...props} />;
    case "Calendar": return <Calendar {...props} />;
    case "User": return <User {...props} />;
    case "Users": return <Users {...props} />;
    case "Building2": return <Building2 {...props} />;
    case "Zap": return <Zap {...props} />;
    case "Heart": return <Heart {...props} />;
    case "Baby": return <Baby {...props} />;
    case "Shield": return <Shield {...props} />;
    case "Briefcase": return <Briefcase {...props} />;
    default: return <CheckCircle {...props} />;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LabGuidePage({
  params,
}: {
  params: Promise<{ guide: string }>;
}) {
  const { guide: guideSlug } = await params;
  const guide = GUIDES[guideSlug];
  if (!guide) notFound();

  const base = getBaseUrl();

  // Resolve related tests with price ranges
  const relatedTests = guide.relatedTests
    .map((slug) => {
      const test = getLabTest(slug);
      if (!test) return null;
      const range = getPriceRange(slug);
      return { test, range };
    })
    .filter(Boolean) as { test: NonNullable<ReturnType<typeof getLabTest>>; range: ReturnType<typeof getPriceRange> }[];

  // Resolve related packages
  const relatedPackages = (guide.relatedPackages ?? [])
    .map((id) => HEALTH_PACKAGES.find((p) => p.id === id))
    .filter(Boolean) as typeof HEALTH_PACKAGES;

  // Other guides for cross-linking
  const otherGuides = Object.values(GUIDES).filter((g) => g.slug !== guideSlug).slice(0, 5);

  // JSON-LD
  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Guides", url: `${base}/labs/guides` },
    { name: guide.title },
  ]);
  const faqSchema = faqPageSchema(guide.faqs);
  const speakable = speakableSchema([".answer-block", "h1", ".quick-facts-box"]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakable} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: guide.title,
          description: guide.metaDescription,
          lastReviewed: "2026-03-25",
          reviewedBy: { "@type": "Organization", name: "Zavis", url: base },
          url: `${base}/labs/guides/${guideSlug}`,
          breadcrumb: breadcrumbs,
        }}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Lab Tests", href: "/labs" },
            { label: "Guides", href: "/labs/guides" },
            { label: guide.title },
          ]}
        />

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-[#006828]" />
            <span className="text-xs font-bold text-[#006828] uppercase tracking-wider">
              UAE Lab Test Guide
            </span>
          </div>
          <h1 className="text-2xl md:font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight leading-tight mb-4">
            {guide.h1}
          </h1>

          {/* Answer Block */}
          <div
            className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 bg-[#f8f8f6] border-l-4 border-[#006828] p-4 md:p-5"
            data-answer-block="true"
          >
            <p className="text-sm md:text-base text-[#1c1c1c] leading-relaxed">
              {guide.heroText}
            </p>
          </div>
        </header>

        {/* Quick Facts Box */}
        <div className="quick-facts-box bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-5 mb-8">
          <p className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">
            Quick Facts
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {guide.quickFacts.map((fact) => (
              <div key={fact.label} className="flex items-start gap-2">
                <QuickFactIcon name={fact.icon} />
                <div>
                  <p className="text-[10px] text-black/40 uppercase tracking-wide font-bold">
                    {fact.label}
                  </p>
                  <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mt-0.5">{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Editorial Sections */}
            {guide.sections.map((section, i) => (
              <section key={i} className="bg-white border border-black/[0.06] p-5 md:p-6">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{section.heading}</h2>
                </div>
                <div className="space-y-3">
                  {section.content.split("\n\n").map((para, j) => (
                    <p key={j} className="text-sm text-[#1c1c1c] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* Related Tests */}
            {relatedTests.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Relevant Tests in Our Directory</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedTests.map(({ test, range }) => (
                    <Link
                      key={test.slug}
                      href={`/labs/test/${test.slug}`}
                      className="border border-black/[0.06] hover:border-[#006828]/15 p-4 transition-colors group block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors truncate">
                            {test.shortName}
                          </p>
                          <p className="text-[11px] text-black/40 mt-0.5 line-clamp-2">
                            {test.description}
                          </p>
                        </div>
                        {range && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-[#006828]">
                              {formatPrice(range.min)}
                            </p>
                            {range.max > range.min && (
                              <p className="text-[10px] text-black/40">
                                – {formatPrice(range.max)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-black/40">
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

            {/* Packages */}
            {relatedPackages.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-4">
                  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Recommended Packages</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPackages.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            <FaqSection title="Frequently Asked Questions" faqs={guide.faqs} />

            {/* Disclaimer */}
            <div className="border border-black/[0.06] bg-[#f8f8f6] p-4 text-xs text-black/40 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-black/40 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#1c1c1c]">Medical Disclaimer:</strong> This guide is for
                  informational purposes only and does not constitute medical advice. Test
                  recommendations, price ranges, and regulatory information are based on publicly
                  available UAE health authority data and lab pricing as of March 2026. Prices may
                  vary. Always consult a licensed physician before ordering medical tests or making
                  health decisions. Regulated by the Dubai Health Authority (DHA), Department of
                  Health Abu Dhabi (DOH), and Ministry of Health and Prevention (MOHAP).
                </p>
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Other Guides */}
            <div className="border border-black/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 mb-3">
                <h3 className="text-sm">More Guides</h3>
                <span className="arrows text-xs">&gt;&gt;&gt;</span>
              </div>
              <div className="space-y-2">
                {otherGuides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/labs/guides/${g.slug}`}
                    className="flex items-start gap-2 group py-1.5 border-b border-black/[0.06] last:border-b-0"
                  >
                    <ArrowRight className="w-3 h-3 text-[#006828] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-[#1c1c1c] group-hover:text-[#006828] transition-colors leading-tight">
                      {g.title}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/labs/guides"
                className="font-['Geist',sans-serif] text-[11px] font-bold text-[#006828] hover:text-[#006828]-dark mt-3 block transition-colors"
              >
                All lab guides →
              </Link>
            </div>

            {/* Browse All Labs */}
            <div className="border border-black/[0.06] bg-[#f8f8f6] p-4">
              <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-2">
                Compare Blood Test Prices
              </p>
              <p className="text-[11px] text-black/40 mb-3 leading-relaxed">
                Browse and compare prices for 30+ tests across 11 UAE labs.
              </p>
              <Link
                href="/labs"
                className="font-['Geist',sans-serif] text-[11px] font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
              >
                Browse all tests →
              </Link>
            </div>

            {/* Quick Links */}
            <div className="border border-black/[0.06] rounded-2xl p-5">
              <p className="text-xs font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] tracking-tight mb-3">Quick Links</p>
              <div className="space-y-1.5">
                {[
                  { href: "/labs/category/blood-routine", label: "Routine Blood Tests" },
                  { href: "/labs/category/vitamins-minerals", label: "Vitamins & Minerals" },
                  { href: "/labs/category/hormones", label: "Hormone Tests" },
                  { href: "/labs/category/std-screening", label: "STD Screening" },
                  { href: "/labs/category/fertility", label: "Fertility Tests" },
                  { href: "/labs/packages", label: "Health Packages" },
                  { href: "/labs/home-collection", label: "Home Collection" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 text-xs text-black/40 hover:text-[#006828] transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
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
