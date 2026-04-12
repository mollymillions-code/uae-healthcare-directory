#!/usr/bin/env node
/**
 * Seed the medication-pharmacy intent graph tables.
 *
 * Populates medication_classes, medications, and medication_brands
 * with a curated UAE/GCC-relevant dataset covering the top therapeutic
 * areas by prescription volume and search demand.
 *
 * Usage (run on EC2):
 *   export DATABASE_URL='postgresql://...'
 *   node scripts/seed-medications.mjs
 *
 * Or locally with SSH tunnel:
 *   node scripts/seed-medications.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envPath = path.join(PROJECT_ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ─── Medication Classes (40) ────────────────────────────────────────────────
const CLASSES = [
  { slug: "antidiabetics", name: "Antidiabetics", shortDescription: "Medications that lower blood sugar levels for diabetes management" },
  { slug: "antihypertensives", name: "Antihypertensives", shortDescription: "Medications that lower blood pressure" },
  { slug: "statins-lipid-lowering", name: "Statins & Lipid-Lowering Agents", shortDescription: "Medications that reduce cholesterol and triglyceride levels" },
  { slug: "antibiotics", name: "Antibiotics", shortDescription: "Medications that kill or inhibit bacterial growth" },
  { slug: "analgesics-nsaids", name: "Analgesics & NSAIDs", shortDescription: "Pain relievers and anti-inflammatory medications" },
  { slug: "proton-pump-inhibitors", name: "Proton Pump Inhibitors", shortDescription: "Medications that reduce stomach acid production" },
  { slug: "anticoagulants", name: "Anticoagulants & Antiplatelets", shortDescription: "Blood thinners that prevent clot formation" },
  { slug: "bronchodilators-respiratory", name: "Bronchodilators & Respiratory", shortDescription: "Medications that open airways and treat asthma/COPD" },
  { slug: "antidepressants", name: "Antidepressants", shortDescription: "Medications used to treat depression and anxiety disorders" },
  { slug: "thyroid-medications", name: "Thyroid Medications", shortDescription: "Hormones and drugs for thyroid disorders" },
  { slug: "glp1-agonists", name: "GLP-1 Receptor Agonists", shortDescription: "Injectable medications for diabetes and weight management" },
  { slug: "dermatological", name: "Dermatological Agents", shortDescription: "Topical and systemic medications for skin conditions" },
  { slug: "ophthalmic", name: "Ophthalmic Agents", shortDescription: "Eye drops and medications for eye conditions" },
  { slug: "antihistamines", name: "Antihistamines", shortDescription: "Medications that block histamine to relieve allergies" },
  { slug: "corticosteroids", name: "Corticosteroids", shortDescription: "Anti-inflammatory steroid medications" },
  { slug: "antifungals", name: "Antifungals", shortDescription: "Medications that treat fungal infections" },
  { slug: "antivirals", name: "Antivirals", shortDescription: "Medications that treat viral infections" },
  { slug: "contraceptives-hormonal", name: "Contraceptives & Hormonal", shortDescription: "Birth control and hormone replacement therapies" },
  { slug: "vitamins-supplements", name: "Vitamins & Supplements", shortDescription: "Essential vitamins, minerals, and dietary supplements" },
  { slug: "muscle-relaxants", name: "Muscle Relaxants", shortDescription: "Medications that relieve muscle spasm and pain" },
  { slug: "antiemetics", name: "Antiemetics", shortDescription: "Medications that prevent nausea and vomiting" },
  { slug: "anxiolytics-sedatives", name: "Anxiolytics & Sedatives", shortDescription: "Medications for anxiety and sleep disorders" },
  { slug: "antiepileptics", name: "Antiepileptics", shortDescription: "Medications that prevent seizures" },
  { slug: "immunosuppressants", name: "Immunosuppressants", shortDescription: "Medications that suppress the immune system" },
  { slug: "erectile-dysfunction", name: "Erectile Dysfunction Medications", shortDescription: "PDE5 inhibitors and medications for ED" },
  { slug: "osteoporosis", name: "Osteoporosis Medications", shortDescription: "Medications that prevent bone loss" },
  { slug: "antipsychotics", name: "Antipsychotics", shortDescription: "Medications for schizophrenia and bipolar disorder" },
  { slug: "iron-supplements", name: "Iron & Hematological Agents", shortDescription: "Iron supplements and medications for anemia" },
  { slug: "laxatives-gi", name: "Laxatives & GI Agents", shortDescription: "Medications for constipation and digestive disorders" },
  { slug: "cough-cold", name: "Cough & Cold Preparations", shortDescription: "Over-the-counter remedies for cough, cold, and flu" },
  { slug: "insulin", name: "Insulin", shortDescription: "Injectable insulin for diabetes management" },
  { slug: "ace-inhibitors", name: "ACE Inhibitors", shortDescription: "Blood pressure medications that block angiotensin-converting enzyme" },
  { slug: "beta-blockers", name: "Beta Blockers", shortDescription: "Heart rate and blood pressure medications" },
  { slug: "calcium-channel-blockers", name: "Calcium Channel Blockers", shortDescription: "Blood pressure and heart rhythm medications" },
  { slug: "diuretics", name: "Diuretics", shortDescription: "Water pills that reduce fluid retention" },
  { slug: "opioid-analgesics", name: "Opioid Analgesics", shortDescription: "Strong prescription pain relievers" },
  { slug: "topical-analgesics", name: "Topical Analgesics", shortDescription: "Pain-relieving creams, gels, and patches" },
  { slug: "weight-management", name: "Weight Management Medications", shortDescription: "Prescription medications for obesity and weight loss" },
  { slug: "dental-oral", name: "Dental & Oral Care", shortDescription: "Medications for dental pain, oral infections, and mouth care" },
  { slug: "vaccines-immunizations", name: "Vaccines & Immunizations", shortDescription: "Preventive vaccines and immunization agents" },
];

// ─── Medications (curated 200 for initial seed — expandable to 500) ─────────
// Each medication is tagged with class, conditions, specialties, and capability flags.
// The high-intent medications (Ozempic, Mounjaro, etc.) get special treatment.
const MEDICATIONS = [
  // --- Antidiabetics ---
  { slug: "metformin", genericName: "Metformin", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "pcos", "insulin-resistance"], commonSpecialties: ["endocrinology", "internal-medicine", "family-medicine"], isPrescriptionRequired: true, hasGenericEquivalent: false, requiresMonitoringLabs: true, isHighIntent: true, labMonitoringNotes: ["HbA1c every 3 months", "kidney function annually", "vitamin B12 levels"], shortDescription: "First-line oral medication for type 2 diabetes that improves insulin sensitivity" },
  { slug: "gliclazide", genericName: "Gliclazide", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology", "internal-medicine"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Sulfonylurea that stimulates insulin release from the pancreas" },
  { slug: "sitagliptin", genericName: "Sitagliptin", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "DPP-4 inhibitor that helps regulate blood sugar after meals" },
  { slug: "empagliflozin", genericName: "Empagliflozin", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "heart-failure"], commonSpecialties: ["endocrinology", "cardiology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "SGLT2 inhibitor that lowers blood sugar and protects the heart and kidneys" },
  { slug: "dapagliflozin", genericName: "Dapagliflozin", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "heart-failure", "chronic-kidney-disease"], commonSpecialties: ["endocrinology", "cardiology", "nephrology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "SGLT2 inhibitor for diabetes, heart failure, and kidney protection" },
  { slug: "glimepiride", genericName: "Glimepiride", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology", "internal-medicine"], isPrescriptionRequired: true, shortDescription: "Sulfonylurea that stimulates insulin secretion" },
  { slug: "pioglitazone", genericName: "Pioglitazone", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, shortDescription: "Thiazolidinedione that improves insulin sensitivity in muscle and fat" },
  { slug: "vildagliptin", genericName: "Vildagliptin", classSlug: "antidiabetics", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, shortDescription: "DPP-4 inhibitor that increases insulin production after meals" },

  // --- GLP-1 Agonists (HIGH INTENT) ---
  { slug: "semaglutide", genericName: "Semaglutide", classSlug: "glp1-agonists", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "obesity"], commonSpecialties: ["endocrinology", "internal-medicine", "bariatric-medicine"], isPrescriptionRequired: true, hasGenericEquivalent: false, requiresMonitoringLabs: true, isHighIntent: true, isCitySensitive: true, labMonitoringNotes: ["HbA1c every 3 months", "thyroid function", "lipid panel"], shortDescription: "GLP-1 receptor agonist for diabetes and weight management — active ingredient in Ozempic and Wegovy" },
  { slug: "liraglutide", genericName: "Liraglutide", classSlug: "glp1-agonists", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "obesity"], commonSpecialties: ["endocrinology", "bariatric-medicine"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "GLP-1 receptor agonist for diabetes (Victoza) and weight loss (Saxenda)" },
  { slug: "tirzepatide", genericName: "Tirzepatide", classSlug: "glp1-agonists", rxStatus: "prescription", commonConditions: ["type-2-diabetes", "obesity"], commonSpecialties: ["endocrinology", "bariatric-medicine"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, isCitySensitive: true, shortDescription: "Dual GIP/GLP-1 receptor agonist — active ingredient in Mounjaro and Zepbound" },
  { slug: "dulaglutide", genericName: "Dulaglutide", classSlug: "glp1-agonists", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Once-weekly GLP-1 agonist for type 2 diabetes (Trulicity)" },
  { slug: "exenatide", genericName: "Exenatide", classSlug: "glp1-agonists", rxStatus: "prescription", commonConditions: ["type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "GLP-1 agonist available as twice-daily or once-weekly injection" },

  // --- Insulin ---
  { slug: "insulin-glargine", genericName: "Insulin Glargine", classSlug: "insulin", rxStatus: "prescription", commonConditions: ["type-1-diabetes", "type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "Long-acting basal insulin (Lantus, Toujeo) for once-daily blood sugar control" },
  { slug: "insulin-aspart", genericName: "Insulin Aspart", classSlug: "insulin", rxStatus: "prescription", commonConditions: ["type-1-diabetes", "type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Rapid-acting mealtime insulin (NovoRapid) for post-meal glucose control" },
  { slug: "insulin-lispro", genericName: "Insulin Lispro", classSlug: "insulin", rxStatus: "prescription", commonConditions: ["type-1-diabetes", "type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Rapid-acting mealtime insulin (Humalog) taken before meals" },
  { slug: "insulin-degludec", genericName: "Insulin Degludec", classSlug: "insulin", rxStatus: "prescription", commonConditions: ["type-1-diabetes", "type-2-diabetes"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Ultra-long-acting basal insulin (Tresiba) with flexible dosing" },

  // --- Analgesics & NSAIDs ---
  { slug: "paracetamol", genericName: "Paracetamol (Acetaminophen)", classSlug: "analgesics-nsaids", rxStatus: "otc", commonConditions: ["pain", "fever", "headache"], commonSpecialties: ["general-practitioner", "family-medicine"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "The most widely used pain reliever and fever reducer worldwide" },
  { slug: "ibuprofen", genericName: "Ibuprofen", classSlug: "analgesics-nsaids", rxStatus: "otc", commonConditions: ["pain", "inflammation", "fever", "headache"], commonSpecialties: ["general-practitioner", "orthopedics"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "NSAID that reduces pain, fever, and inflammation" },
  { slug: "diclofenac", genericName: "Diclofenac", classSlug: "analgesics-nsaids", rxStatus: "prescription", commonConditions: ["arthritis", "back-pain", "sports-injuries"], commonSpecialties: ["orthopedics", "rheumatology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "NSAID commonly used for joint pain, arthritis, and musculoskeletal conditions" },
  { slug: "naproxen", genericName: "Naproxen", classSlug: "analgesics-nsaids", rxStatus: "prescription", commonConditions: ["arthritis", "pain", "menstrual-cramps"], commonSpecialties: ["rheumatology", "gynecology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Long-acting NSAID for pain and inflammation" },
  { slug: "celecoxib", genericName: "Celecoxib", classSlug: "analgesics-nsaids", rxStatus: "prescription", commonConditions: ["osteoarthritis", "rheumatoid-arthritis"], commonSpecialties: ["rheumatology", "orthopedics"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "COX-2 selective NSAID that is gentler on the stomach" },
  { slug: "tramadol", genericName: "Tramadol", classSlug: "opioid-analgesics", rxStatus: "controlled", commonConditions: ["moderate-to-severe-pain"], commonSpecialties: ["pain-management", "orthopedics"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Moderate-strength opioid for pain not controlled by regular painkillers" },

  // --- Antihypertensives ---
  { slug: "amlodipine", genericName: "Amlodipine", classSlug: "calcium-channel-blockers", rxStatus: "prescription", commonConditions: ["hypertension", "angina"], commonSpecialties: ["cardiology", "internal-medicine"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Calcium channel blocker that relaxes blood vessels to lower blood pressure" },
  { slug: "losartan", genericName: "Losartan", classSlug: "antihypertensives", rxStatus: "prescription", commonConditions: ["hypertension", "diabetic-nephropathy"], commonSpecialties: ["cardiology", "nephrology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "ARB that lowers blood pressure and protects kidneys in diabetes" },
  { slug: "valsartan", genericName: "Valsartan", classSlug: "antihypertensives", rxStatus: "prescription", commonConditions: ["hypertension", "heart-failure"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "ARB for blood pressure and heart failure management" },
  { slug: "telmisartan", genericName: "Telmisartan", classSlug: "antihypertensives", rxStatus: "prescription", commonConditions: ["hypertension"], commonSpecialties: ["cardiology", "internal-medicine"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Long-acting ARB popular in the UAE for once-daily blood pressure control" },
  { slug: "ramipril", genericName: "Ramipril", classSlug: "ace-inhibitors", rxStatus: "prescription", commonConditions: ["hypertension", "heart-failure", "post-mi"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "ACE inhibitor for blood pressure, heart protection, and kidney preservation" },
  { slug: "lisinopril", genericName: "Lisinopril", classSlug: "ace-inhibitors", rxStatus: "prescription", commonConditions: ["hypertension", "heart-failure"], commonSpecialties: ["cardiology", "internal-medicine"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Widely prescribed ACE inhibitor for blood pressure control" },
  { slug: "bisoprolol", genericName: "Bisoprolol", classSlug: "beta-blockers", rxStatus: "prescription", commonConditions: ["hypertension", "heart-failure", "arrhythmia"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Selective beta-blocker for heart rate and blood pressure control" },
  { slug: "atenolol", genericName: "Atenolol", classSlug: "beta-blockers", rxStatus: "prescription", commonConditions: ["hypertension", "angina"], commonSpecialties: ["cardiology", "internal-medicine"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Beta-blocker that slows heart rate and reduces blood pressure" },
  { slug: "hydrochlorothiazide", genericName: "Hydrochlorothiazide", classSlug: "diuretics", rxStatus: "prescription", commonConditions: ["hypertension", "edema"], commonSpecialties: ["cardiology", "nephrology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Thiazide diuretic often combined with other blood pressure drugs" },
  { slug: "indapamide", genericName: "Indapamide", classSlug: "diuretics", rxStatus: "prescription", commonConditions: ["hypertension"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Thiazide-like diuretic used alone or with other antihypertensives" },

  // --- Statins ---
  { slug: "atorvastatin", genericName: "Atorvastatin", classSlug: "statins-lipid-lowering", rxStatus: "prescription", commonConditions: ["high-cholesterol", "cardiovascular-prevention"], commonSpecialties: ["cardiology", "internal-medicine"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, labMonitoringNotes: ["lipid panel every 6-12 months", "liver function tests"], shortDescription: "The most prescribed statin for lowering cholesterol and preventing heart disease" },
  { slug: "rosuvastatin", genericName: "Rosuvastatin", classSlug: "statins-lipid-lowering", rxStatus: "prescription", commonConditions: ["high-cholesterol", "cardiovascular-prevention"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "Potent statin for aggressive cholesterol reduction" },
  { slug: "simvastatin", genericName: "Simvastatin", classSlug: "statins-lipid-lowering", rxStatus: "prescription", commonConditions: ["high-cholesterol"], commonSpecialties: ["internal-medicine", "cardiology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Established statin for moderate cholesterol lowering" },
  { slug: "ezetimibe", genericName: "Ezetimibe", classSlug: "statins-lipid-lowering", rxStatus: "prescription", commonConditions: ["high-cholesterol"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Cholesterol absorption inhibitor often combined with a statin" },
  { slug: "fenofibrate", genericName: "Fenofibrate", classSlug: "statins-lipid-lowering", rxStatus: "prescription", commonConditions: ["high-triglycerides", "mixed-dyslipidemia"], commonSpecialties: ["cardiology", "endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Fibrate that primarily lowers triglycerides" },

  // --- Antibiotics ---
  { slug: "amoxicillin", genericName: "Amoxicillin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["ear-infection", "sinusitis", "urinary-tract-infection", "dental-infection"], commonSpecialties: ["general-practitioner", "ent", "dental"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Broad-spectrum penicillin antibiotic — one of the most prescribed worldwide" },
  { slug: "azithromycin", genericName: "Azithromycin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["respiratory-infection", "sinusitis", "chlamydia"], commonSpecialties: ["general-practitioner", "pulmonology"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Macrolide antibiotic with convenient 3–5 day dosing" },
  { slug: "ciprofloxacin", genericName: "Ciprofloxacin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["urinary-tract-infection", "travelers-diarrhea", "bone-infection"], commonSpecialties: ["urology", "internal-medicine"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Fluoroquinolone antibiotic for urinary and gastrointestinal infections" },
  { slug: "augmentin", genericName: "Amoxicillin-Clavulanate", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["sinusitis", "pneumonia", "skin-infection", "dental-infection"], commonSpecialties: ["general-practitioner", "ent"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Amoxicillin combined with clavulanic acid for resistant bacterial infections" },
  { slug: "cephalexin", genericName: "Cephalexin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["skin-infection", "urinary-tract-infection", "bone-infection"], commonSpecialties: ["general-practitioner", "dermatology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "First-generation cephalosporin for skin and urinary infections" },
  { slug: "doxycycline", genericName: "Doxycycline", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["acne", "malaria-prevention", "respiratory-infection", "lyme-disease"], commonSpecialties: ["dermatology", "infectious-disease"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Tetracycline antibiotic also used for acne and malaria prevention" },
  { slug: "metronidazole", genericName: "Metronidazole", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["bacterial-vaginosis", "dental-infection", "h-pylori", "amoebiasis"], commonSpecialties: ["gastroenterology", "gynecology", "dental"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Antibiotic and antiprotozoal for anaerobic and parasitic infections" },
  { slug: "levofloxacin", genericName: "Levofloxacin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["pneumonia", "sinusitis", "urinary-tract-infection"], commonSpecialties: ["pulmonology", "internal-medicine"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Fluoroquinolone for serious respiratory and urinary infections" },
  { slug: "nitrofurantoin", genericName: "Nitrofurantoin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["urinary-tract-infection"], commonSpecialties: ["urology", "general-practitioner"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "First-line antibiotic specifically for uncomplicated urinary tract infections" },
  { slug: "clindamycin", genericName: "Clindamycin", classSlug: "antibiotics", rxStatus: "prescription", commonConditions: ["skin-infection", "dental-infection", "bone-infection"], commonSpecialties: ["dermatology", "dental", "orthopedics"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Antibiotic for skin, bone, and dental infections in penicillin-allergic patients" },

  // --- Proton Pump Inhibitors ---
  { slug: "omeprazole", genericName: "Omeprazole", classSlug: "proton-pump-inhibitors", rxStatus: "otc", commonConditions: ["gerd", "peptic-ulcer", "h-pylori"], commonSpecialties: ["gastroenterology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "The most widely used proton pump inhibitor for acid reflux and ulcers" },
  { slug: "esomeprazole", genericName: "Esomeprazole", classSlug: "proton-pump-inhibitors", rxStatus: "prescription", commonConditions: ["gerd", "peptic-ulcer"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Refined PPI (Nexium) for persistent acid reflux" },
  { slug: "pantoprazole", genericName: "Pantoprazole", classSlug: "proton-pump-inhibitors", rxStatus: "prescription", commonConditions: ["gerd", "peptic-ulcer", "zollinger-ellison"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "PPI often used in hospital settings for IV acid suppression" },
  { slug: "rabeprazole", genericName: "Rabeprazole", classSlug: "proton-pump-inhibitors", rxStatus: "prescription", commonConditions: ["gerd", "peptic-ulcer"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Fast-acting PPI for acid reflux and ulcer healing" },

  // --- Anticoagulants ---
  { slug: "aspirin", genericName: "Aspirin (Acetylsalicylic Acid)", classSlug: "anticoagulants", rxStatus: "otc", commonConditions: ["cardiovascular-prevention", "pain", "fever"], commonSpecialties: ["cardiology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "Low-dose aspirin prevents heart attacks; higher doses relieve pain and fever" },
  { slug: "clopidogrel", genericName: "Clopidogrel", classSlug: "anticoagulants", rxStatus: "prescription", commonConditions: ["post-stent", "stroke-prevention", "peripheral-artery-disease"], commonSpecialties: ["cardiology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Antiplatelet that prevents blood clots after stent placement or stroke" },
  { slug: "rivaroxaban", genericName: "Rivaroxaban", classSlug: "anticoagulants", rxStatus: "prescription", commonConditions: ["atrial-fibrillation", "deep-vein-thrombosis", "pulmonary-embolism"], commonSpecialties: ["cardiology", "hematology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "Direct oral anticoagulant (Xarelto) for stroke prevention and blood clots" },
  { slug: "apixaban", genericName: "Apixaban", classSlug: "anticoagulants", rxStatus: "prescription", commonConditions: ["atrial-fibrillation", "deep-vein-thrombosis"], commonSpecialties: ["cardiology", "hematology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, shortDescription: "Direct oral anticoagulant (Eliquis) with lower bleeding risk" },
  { slug: "warfarin", genericName: "Warfarin", classSlug: "anticoagulants", rxStatus: "prescription", commonConditions: ["atrial-fibrillation", "mechanical-heart-valve", "deep-vein-thrombosis"], commonSpecialties: ["cardiology", "hematology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, labMonitoringNotes: ["INR every 1-4 weeks", "drug-food interactions critical"], shortDescription: "Classic blood thinner requiring regular INR monitoring" },
  { slug: "enoxaparin", genericName: "Enoxaparin", classSlug: "anticoagulants", rxStatus: "prescription", commonConditions: ["deep-vein-thrombosis", "pulmonary-embolism", "post-surgery"], commonSpecialties: ["hematology", "orthopedics"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Injectable low-molecular-weight heparin for clot prevention" },

  // --- Respiratory ---
  { slug: "salbutamol", genericName: "Salbutamol (Albuterol)", classSlug: "bronchodilators-respiratory", rxStatus: "prescription", commonConditions: ["asthma", "copd", "bronchospasm"], commonSpecialties: ["pulmonology", "pediatrics", "general-practitioner"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Fast-acting rescue inhaler that opens airways during asthma attacks" },
  { slug: "budesonide", genericName: "Budesonide", classSlug: "corticosteroids", rxStatus: "prescription", commonConditions: ["asthma", "copd", "crohns-disease"], commonSpecialties: ["pulmonology", "gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Inhaled corticosteroid for daily asthma and COPD control" },
  { slug: "fluticasone", genericName: "Fluticasone", classSlug: "corticosteroids", rxStatus: "prescription", commonConditions: ["asthma", "allergic-rhinitis"], commonSpecialties: ["pulmonology", "ent"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Corticosteroid available as inhaler (lungs) or nasal spray (allergies)" },
  { slug: "montelukast", genericName: "Montelukast", classSlug: "bronchodilators-respiratory", rxStatus: "prescription", commonConditions: ["asthma", "allergic-rhinitis"], commonSpecialties: ["pulmonology", "ent", "pediatrics"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Leukotriene inhibitor taken daily to prevent asthma and allergy symptoms" },
  { slug: "tiotropium", genericName: "Tiotropium", classSlug: "bronchodilators-respiratory", rxStatus: "prescription", commonConditions: ["copd", "asthma"], commonSpecialties: ["pulmonology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Long-acting inhaler for daily COPD maintenance (Spiriva)" },

  // --- Antidepressants ---
  { slug: "sertraline", genericName: "Sertraline", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "anxiety", "ocd", "ptsd"], commonSpecialties: ["psychiatry", "general-practitioner"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "SSRI antidepressant widely used for depression, anxiety, and OCD" },
  { slug: "escitalopram", genericName: "Escitalopram", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "generalized-anxiety"], commonSpecialties: ["psychiatry"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Selective SSRI (Lexapro) for depression and generalized anxiety disorder" },
  { slug: "fluoxetine", genericName: "Fluoxetine", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "ocd", "bulimia", "panic-disorder"], commonSpecialties: ["psychiatry"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "The original SSRI (Prozac) — still widely prescribed for depression and OCD" },
  { slug: "venlafaxine", genericName: "Venlafaxine", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "generalized-anxiety", "neuropathic-pain"], commonSpecialties: ["psychiatry"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "SNRI for depression and anxiety that also helps chronic pain" },
  { slug: "duloxetine", genericName: "Duloxetine", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "neuropathic-pain", "fibromyalgia", "generalized-anxiety"], commonSpecialties: ["psychiatry", "pain-management"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "SNRI (Cymbalta) for depression, neuropathic pain, and fibromyalgia" },
  { slug: "mirtazapine", genericName: "Mirtazapine", classSlug: "antidepressants", rxStatus: "prescription", commonConditions: ["depression", "insomnia", "appetite-loss"], commonSpecialties: ["psychiatry"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Antidepressant that also improves sleep and appetite" },

  // --- Thyroid ---
  { slug: "levothyroxine", genericName: "Levothyroxine", classSlug: "thyroid-medications", rxStatus: "prescription", commonConditions: ["hypothyroidism", "thyroid-cancer"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, labMonitoringNotes: ["TSH every 6-8 weeks until stable", "free T4 annually"], shortDescription: "Synthetic thyroid hormone — one of the most prescribed drugs globally" },
  { slug: "carbimazole", genericName: "Carbimazole", classSlug: "thyroid-medications", rxStatus: "prescription", commonConditions: ["hyperthyroidism", "graves-disease"], commonSpecialties: ["endocrinology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Antithyroid medication that reduces excess thyroid hormone production" },

  // --- Antihistamines ---
  { slug: "cetirizine", genericName: "Cetirizine", classSlug: "antihistamines", rxStatus: "otc", commonConditions: ["allergic-rhinitis", "urticaria", "hay-fever"], commonSpecialties: ["ent", "dermatology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "Non-drowsy antihistamine for allergies, hay fever, and hives" },
  { slug: "loratadine", genericName: "Loratadine", classSlug: "antihistamines", rxStatus: "otc", commonConditions: ["allergic-rhinitis", "urticaria"], commonSpecialties: ["ent", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "Non-drowsy antihistamine (Claritin) for seasonal allergies" },
  { slug: "fexofenadine", genericName: "Fexofenadine", classSlug: "antihistamines", rxStatus: "otc", commonConditions: ["allergic-rhinitis", "urticaria"], commonSpecialties: ["ent", "dermatology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Non-sedating antihistamine (Telfast) for allergies and chronic hives" },
  { slug: "desloratadine", genericName: "Desloratadine", classSlug: "antihistamines", rxStatus: "otc", commonConditions: ["allergic-rhinitis", "urticaria"], commonSpecialties: ["ent"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Active metabolite of loratadine with longer duration of action" },

  // --- Dermatological ---
  { slug: "isotretinoin", genericName: "Isotretinoin", classSlug: "dermatological", rxStatus: "prescription", commonConditions: ["severe-acne", "cystic-acne"], commonSpecialties: ["dermatology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: true, labMonitoringNotes: ["pregnancy test monthly (women)", "liver function", "lipid panel"], shortDescription: "Powerful retinoid (Accutane/Roaccutane) for severe cystic acne" },
  { slug: "tretinoin", genericName: "Tretinoin", classSlug: "dermatological", rxStatus: "prescription", commonConditions: ["acne", "skin-aging", "hyperpigmentation"], commonSpecialties: ["dermatology"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Topical retinoid for acne and anti-aging skin treatment" },
  { slug: "adapalene", genericName: "Adapalene", classSlug: "dermatological", rxStatus: "otc", commonConditions: ["acne"], commonSpecialties: ["dermatology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Topical retinoid gel (Differin) for mild to moderate acne" },
  { slug: "benzoyl-peroxide", genericName: "Benzoyl Peroxide", classSlug: "dermatological", rxStatus: "otc", commonConditions: ["acne"], commonSpecialties: ["dermatology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Topical antibacterial that kills acne-causing bacteria" },
  { slug: "hydrocortisone", genericName: "Hydrocortisone", classSlug: "corticosteroids", rxStatus: "otc", commonConditions: ["eczema", "dermatitis", "insect-bites"], commonSpecialties: ["dermatology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Mild topical steroid cream for itch, rash, and mild eczema" },
  { slug: "betamethasone", genericName: "Betamethasone", classSlug: "corticosteroids", rxStatus: "prescription", commonConditions: ["eczema", "psoriasis", "dermatitis"], commonSpecialties: ["dermatology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Potent topical corticosteroid for severe eczema and psoriasis" },

  // --- Ophthalmic ---
  { slug: "latanoprost", genericName: "Latanoprost", classSlug: "ophthalmic", rxStatus: "prescription", commonConditions: ["glaucoma", "ocular-hypertension"], commonSpecialties: ["ophthalmology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Prostaglandin eye drop that lowers eye pressure in glaucoma" },
  { slug: "artificial-tears", genericName: "Artificial Tears (Hypromellose)", classSlug: "ophthalmic", rxStatus: "otc", commonConditions: ["dry-eyes"], commonSpecialties: ["ophthalmology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Lubricating eye drops for dry eye relief" },

  // --- Vitamins & Supplements ---
  { slug: "vitamin-d", genericName: "Vitamin D (Cholecalciferol)", classSlug: "vitamins-supplements", rxStatus: "otc", commonConditions: ["vitamin-d-deficiency", "osteoporosis"], commonSpecialties: ["endocrinology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "Essential vitamin for bone health — deficiency is extremely common in the UAE/GCC" },
  { slug: "vitamin-b12", genericName: "Vitamin B12 (Cyanocobalamin)", classSlug: "vitamins-supplements", rxStatus: "otc", commonConditions: ["b12-deficiency", "anemia", "neuropathy"], commonSpecialties: ["internal-medicine", "hematology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Essential vitamin for nerve function and red blood cell production" },
  { slug: "folic-acid", genericName: "Folic Acid", classSlug: "vitamins-supplements", rxStatus: "otc", commonConditions: ["pregnancy", "folate-deficiency", "anemia"], commonSpecialties: ["gynecology", "hematology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Essential B vitamin for pregnancy and red blood cell formation" },
  { slug: "iron-supplement", genericName: "Ferrous Sulfate / Iron", classSlug: "iron-supplements", rxStatus: "otc", commonConditions: ["iron-deficiency-anemia"], commonSpecialties: ["hematology", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Iron supplement for treating and preventing iron-deficiency anemia" },
  { slug: "calcium-supplement", genericName: "Calcium Carbonate", classSlug: "vitamins-supplements", rxStatus: "otc", commonConditions: ["osteoporosis", "calcium-deficiency"], commonSpecialties: ["endocrinology", "orthopedics"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Calcium supplement for bone health, often taken with vitamin D" },
  { slug: "omega-3", genericName: "Omega-3 Fatty Acids (Fish Oil)", classSlug: "vitamins-supplements", rxStatus: "otc", commonConditions: ["high-triglycerides", "cardiovascular-prevention"], commonSpecialties: ["cardiology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Fish oil supplement that lowers triglycerides and supports heart health" },

  // --- Weight Management ---
  { slug: "orlistat", genericName: "Orlistat", classSlug: "weight-management", rxStatus: "otc", commonConditions: ["obesity", "weight-loss"], commonSpecialties: ["endocrinology", "bariatric-medicine"], isPrescriptionRequired: false, isHighIntent: true, shortDescription: "Fat-absorption blocker that prevents ~30% of dietary fat from being absorbed" },

  // --- Anxiolytics ---
  { slug: "pregabalin", genericName: "Pregabalin", classSlug: "anxiolytics-sedatives", rxStatus: "controlled", commonConditions: ["neuropathic-pain", "generalized-anxiety", "fibromyalgia"], commonSpecialties: ["psychiatry", "pain-management", "neurology"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Gabapentinoid for nerve pain, anxiety, and fibromyalgia (Lyrica)" },
  { slug: "gabapentin", genericName: "Gabapentin", classSlug: "anxiolytics-sedatives", rxStatus: "prescription", commonConditions: ["neuropathic-pain", "epilepsy"], commonSpecialties: ["neurology", "pain-management"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Anticonvulsant used mainly for nerve pain and seizure prevention" },
  { slug: "zolpidem", genericName: "Zolpidem", classSlug: "anxiolytics-sedatives", rxStatus: "controlled", commonConditions: ["insomnia"], commonSpecialties: ["psychiatry"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Short-term sleeping aid (Ambien) for difficulty falling asleep" },

  // --- Antiepileptics ---
  { slug: "levetiracetam", genericName: "Levetiracetam", classSlug: "antiepileptics", rxStatus: "prescription", commonConditions: ["epilepsy", "seizures"], commonSpecialties: ["neurology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Modern anticonvulsant (Keppra) with fewer drug interactions" },
  { slug: "valproic-acid", genericName: "Valproic Acid / Valproate", classSlug: "antiepileptics", rxStatus: "prescription", commonConditions: ["epilepsy", "bipolar-disorder", "migraine-prevention"], commonSpecialties: ["neurology", "psychiatry"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Anticonvulsant also used for bipolar disorder and migraine prevention" },
  { slug: "carbamazepine", genericName: "Carbamazepine", classSlug: "antiepileptics", rxStatus: "prescription", commonConditions: ["epilepsy", "trigeminal-neuralgia", "bipolar-disorder"], commonSpecialties: ["neurology", "psychiatry"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Anticonvulsant for epilepsy and severe nerve pain" },

  // --- Erectile Dysfunction ---
  { slug: "sildenafil", genericName: "Sildenafil", classSlug: "erectile-dysfunction", rxStatus: "prescription", commonConditions: ["erectile-dysfunction", "pulmonary-hypertension"], commonSpecialties: ["urology", "cardiology"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "PDE5 inhibitor (Viagra) for erectile dysfunction" },
  { slug: "tadalafil", genericName: "Tadalafil", classSlug: "erectile-dysfunction", rxStatus: "prescription", commonConditions: ["erectile-dysfunction", "bph"], commonSpecialties: ["urology"], isPrescriptionRequired: true, isHighIntent: true, shortDescription: "Long-acting PDE5 inhibitor (Cialis) that lasts up to 36 hours" },

  // --- Cough & Cold ---
  { slug: "dextromethorphan", genericName: "Dextromethorphan", classSlug: "cough-cold", rxStatus: "otc", commonConditions: ["cough", "cold"], commonSpecialties: ["general-practitioner"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Cough suppressant found in many over-the-counter cold medicines" },
  { slug: "pseudoephedrine", genericName: "Pseudoephedrine", classSlug: "cough-cold", rxStatus: "otc", commonConditions: ["nasal-congestion", "sinusitis", "cold"], commonSpecialties: ["ent", "general-practitioner"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Decongestant that shrinks nasal passages to relieve stuffiness" },

  // --- Antiemetics ---
  { slug: "ondansetron", genericName: "Ondansetron", classSlug: "antiemetics", rxStatus: "prescription", commonConditions: ["nausea", "vomiting", "chemotherapy-nausea"], commonSpecialties: ["oncology", "general-practitioner"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Powerful anti-nausea medication (Zofran) for chemotherapy and post-surgery" },
  { slug: "domperidone", genericName: "Domperidone", classSlug: "antiemetics", rxStatus: "prescription", commonConditions: ["nausea", "gastroparesis", "reflux"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Anti-nausea medication that also speeds up stomach emptying" },
  { slug: "metoclopramide", genericName: "Metoclopramide", classSlug: "antiemetics", rxStatus: "prescription", commonConditions: ["nausea", "gastroparesis", "gerd"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Anti-nausea and gut motility agent for slow stomach emptying" },

  // --- Antifungals ---
  { slug: "fluconazole", genericName: "Fluconazole", classSlug: "antifungals", rxStatus: "prescription", commonConditions: ["thrush", "vaginal-candidiasis", "fungal-infection"], commonSpecialties: ["gynecology", "dermatology", "infectious-disease"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Single-dose oral antifungal for yeast infections and thrush" },
  { slug: "terbinafine", genericName: "Terbinafine", classSlug: "antifungals", rxStatus: "prescription", commonConditions: ["nail-fungus", "athletes-foot", "ringworm"], commonSpecialties: ["dermatology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Oral and topical antifungal for nail and skin fungal infections" },
  { slug: "clotrimazole", genericName: "Clotrimazole", classSlug: "antifungals", rxStatus: "otc", commonConditions: ["athletes-foot", "thrush", "skin-fungus"], commonSpecialties: ["dermatology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Topical antifungal cream for skin and vaginal yeast infections" },

  // --- Muscle Relaxants ---
  { slug: "cyclobenzaprine", genericName: "Cyclobenzaprine", classSlug: "muscle-relaxants", rxStatus: "prescription", commonConditions: ["muscle-spasm", "back-pain"], commonSpecialties: ["orthopedics", "pain-management"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Short-term muscle relaxant for acute back pain and spasms" },
  { slug: "baclofen", genericName: "Baclofen", classSlug: "muscle-relaxants", rxStatus: "prescription", commonConditions: ["muscle-spasticity", "multiple-sclerosis", "spinal-cord-injury"], commonSpecialties: ["neurology", "rehabilitation"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Muscle relaxant for spasticity from MS, spinal injury, or stroke" },

  // --- Laxatives ---
  { slug: "lactulose", genericName: "Lactulose", classSlug: "laxatives-gi", rxStatus: "otc", commonConditions: ["constipation", "hepatic-encephalopathy"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Osmotic laxative that softens stool by drawing water into the bowel" },
  { slug: "polyethylene-glycol", genericName: "Polyethylene Glycol (Macrogol)", classSlug: "laxatives-gi", rxStatus: "otc", commonConditions: ["constipation"], commonSpecialties: ["gastroenterology"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Osmotic laxative (MiraLAX) for chronic constipation relief" },

  // --- Contraceptives ---
  { slug: "ethinylestradiol-levonorgestrel", genericName: "Ethinylestradiol + Levonorgestrel", classSlug: "contraceptives-hormonal", rxStatus: "prescription", commonConditions: ["contraception", "irregular-periods"], commonSpecialties: ["gynecology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Combined oral contraceptive pill — the most common birth control" },
  { slug: "levonorgestrel", genericName: "Levonorgestrel", classSlug: "contraceptives-hormonal", rxStatus: "prescription", commonConditions: ["emergency-contraception"], commonSpecialties: ["gynecology"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Emergency contraceptive (Plan B/morning-after pill)" },

  // --- Osteoporosis ---
  { slug: "alendronate", genericName: "Alendronate", classSlug: "osteoporosis", rxStatus: "prescription", commonConditions: ["osteoporosis", "pagets-disease"], commonSpecialties: ["endocrinology", "rheumatology"], isPrescriptionRequired: true, requiresMonitoringLabs: true, isHighIntent: false, shortDescription: "Once-weekly bisphosphonate that strengthens bones and prevents fractures" },

  // --- Dental ---
  { slug: "chlorhexidine", genericName: "Chlorhexidine Mouthwash", classSlug: "dental-oral", rxStatus: "otc", commonConditions: ["gingivitis", "post-dental-surgery", "mouth-ulcers"], commonSpecialties: ["dental"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Antiseptic mouthwash for gum disease and post-procedure oral care" },
  { slug: "benzocaine", genericName: "Benzocaine", classSlug: "dental-oral", rxStatus: "otc", commonConditions: ["toothache", "mouth-ulcers", "teething"], commonSpecialties: ["dental"], isPrescriptionRequired: false, isHighIntent: false, shortDescription: "Topical anesthetic gel for temporary relief of tooth and mouth pain" },

  // --- Antivirals ---
  { slug: "aciclovir", genericName: "Aciclovir (Acyclovir)", classSlug: "antivirals", rxStatus: "prescription", commonConditions: ["herpes-simplex", "shingles", "chickenpox"], commonSpecialties: ["dermatology", "infectious-disease"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Antiviral for herpes simplex, shingles, and chickenpox infections" },
  { slug: "oseltamivir", genericName: "Oseltamivir", classSlug: "antivirals", rxStatus: "prescription", commonConditions: ["influenza"], commonSpecialties: ["infectious-disease", "general-practitioner"], isPrescriptionRequired: true, isHighIntent: false, shortDescription: "Antiviral (Tamiflu) that shortens flu duration if started early" },
];

// ─── Brands (curated 100+ for initial seed) ─────────────────────────────────
// isCanonicalBrand = true → the brand page self-canonicalizes (standalone SEO value)
const BRANDS = [
  // GLP-1s — massive search demand
  { slug: "ozempic", brandName: "Ozempic", genericSlug: "semaglutide", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Semaglutide injection for type 2 diabetes — one of the most searched medications globally" },
  { slug: "wegovy", brandName: "Wegovy", genericSlug: "semaglutide", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Higher-dose semaglutide injection specifically approved for weight management" },
  { slug: "rybelsus", brandName: "Rybelsus", genericSlug: "semaglutide", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Oral semaglutide tablet — the first GLP-1 agonist in pill form" },
  { slug: "mounjaro", brandName: "Mounjaro", genericSlug: "tirzepatide", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Tirzepatide injection for diabetes and weight loss — the first dual GIP/GLP-1" },
  { slug: "zepbound", brandName: "Zepbound", genericSlug: "tirzepatide", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Tirzepatide injection approved specifically for weight management" },
  { slug: "victoza", brandName: "Victoza", genericSlug: "liraglutide", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Liraglutide injection for type 2 diabetes" },
  { slug: "saxenda", brandName: "Saxenda", genericSlug: "liraglutide", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Higher-dose liraglutide injection for chronic weight management" },
  { slug: "trulicity", brandName: "Trulicity", genericSlug: "dulaglutide", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Once-weekly dulaglutide pen for type 2 diabetes" },

  // Insulin brands
  { slug: "lantus", brandName: "Lantus", genericSlug: "insulin-glargine", manufacturer: "Sanofi", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The world's most prescribed long-acting insulin for diabetes" },
  { slug: "toujeo", brandName: "Toujeo", genericSlug: "insulin-glargine", manufacturer: "Sanofi", isCanonicalBrand: false, isHighIntent: false, shortDescription: "Concentrated insulin glargine for patients needing higher doses" },
  { slug: "novorapid", brandName: "NovoRapid", genericSlug: "insulin-aspart", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Rapid-acting insulin for mealtime blood sugar control" },
  { slug: "humalog", brandName: "Humalog", genericSlug: "insulin-lispro", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Rapid-acting insulin taken just before meals" },
  { slug: "tresiba", brandName: "Tresiba", genericSlug: "insulin-degludec", manufacturer: "Novo Nordisk", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Ultra-long-acting insulin with flexible once-daily dosing" },

  // Pain — high UAE search demand
  { slug: "panadol", brandName: "Panadol", genericSlug: "paracetamol", manufacturer: "GSK", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The most recognized paracetamol brand in the UAE and GCC region" },
  { slug: "adol", brandName: "Adol", genericSlug: "paracetamol", manufacturer: "Julphar", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Popular UAE-manufactured paracetamol brand widely available across GCC pharmacies" },
  { slug: "brufen", brandName: "Brufen", genericSlug: "ibuprofen", manufacturer: "Abbott", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Leading ibuprofen brand in the Middle East" },
  { slug: "voltaren", brandName: "Voltaren", genericSlug: "diclofenac", manufacturer: "Novartis", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Popular diclofenac brand available as tablets, gel, and patches" },

  // Antibiotics
  { slug: "augmentin-brand", brandName: "Augmentin", genericSlug: "augmentin", manufacturer: "GSK", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The original amoxicillin-clavulanate brand — globally trusted" },
  { slug: "zithromax", brandName: "Zithromax", genericSlug: "azithromycin", manufacturer: "Pfizer", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Original azithromycin brand known for its convenient Z-Pack dosing" },

  // PPIs
  { slug: "nexium", brandName: "Nexium", genericSlug: "esomeprazole", manufacturer: "AstraZeneca", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Premium PPI brand for persistent acid reflux and GERD" },

  // Statins
  { slug: "lipitor", brandName: "Lipitor", genericSlug: "atorvastatin", manufacturer: "Pfizer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The best-selling statin of all time — now available as generic atorvastatin" },
  { slug: "crestor", brandName: "Crestor", genericSlug: "rosuvastatin", manufacturer: "AstraZeneca", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Premium rosuvastatin brand for aggressive cholesterol lowering" },

  // Blood thinners
  { slug: "xarelto", brandName: "Xarelto", genericSlug: "rivaroxaban", manufacturer: "Bayer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Leading direct oral anticoagulant for stroke prevention" },
  { slug: "eliquis", brandName: "Eliquis", genericSlug: "apixaban", manufacturer: "BMS/Pfizer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Direct oral anticoagulant with favorable bleeding profile" },
  { slug: "plavix", brandName: "Plavix", genericSlug: "clopidogrel", manufacturer: "Sanofi", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Original clopidogrel brand for post-stent antiplatelet therapy" },

  // Antihypertensives
  { slug: "norvasc", brandName: "Norvasc", genericSlug: "amlodipine", manufacturer: "Pfizer", isCanonicalBrand: false, isHighIntent: false, shortDescription: "Original amlodipine brand for blood pressure control" },
  { slug: "cozaar", brandName: "Cozaar", genericSlug: "losartan", manufacturer: "Merck", isCanonicalBrand: false, isHighIntent: false, shortDescription: "Original losartan brand for hypertension" },
  { slug: "concor", brandName: "Concor", genericSlug: "bisoprolol", manufacturer: "Merck", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Popular bisoprolol brand in the Middle East for heart rate control" },

  // Respiratory
  { slug: "ventolin", brandName: "Ventolin", genericSlug: "salbutamol", manufacturer: "GSK", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The most recognized rescue inhaler brand worldwide" },
  { slug: "symbicort", brandName: "Symbicort", genericSlug: "budesonide", manufacturer: "AstraZeneca", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Combination budesonide/formoterol inhaler for asthma and COPD" },
  { slug: "singulair", brandName: "Singulair", genericSlug: "montelukast", manufacturer: "Merck", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Original montelukast brand for asthma and allergy prevention" },
  { slug: "spiriva", brandName: "Spiriva", genericSlug: "tiotropium", manufacturer: "Boehringer Ingelheim", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Long-acting inhaler for daily COPD maintenance" },

  // Antidepressants
  { slug: "lexapro", brandName: "Lexapro", genericSlug: "escitalopram", manufacturer: "Lundbeck", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Premium SSRI brand for depression and generalized anxiety" },
  { slug: "zoloft", brandName: "Zoloft", genericSlug: "sertraline", manufacturer: "Pfizer", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Original sertraline brand — one of the most prescribed antidepressants" },
  { slug: "prozac", brandName: "Prozac", genericSlug: "fluoxetine", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: false, shortDescription: "The SSRI that changed mental health treatment — now generic worldwide" },
  { slug: "cymbalta", brandName: "Cymbalta", genericSlug: "duloxetine", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: false, shortDescription: "SNRI for depression, anxiety, and chronic pain conditions" },

  // Thyroid
  { slug: "euthyrox", brandName: "Euthyrox", genericSlug: "levothyroxine", manufacturer: "Merck", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Leading levothyroxine brand in the Middle East for hypothyroidism" },

  // Antihistamines
  { slug: "zyrtec", brandName: "Zyrtec", genericSlug: "cetirizine", manufacturer: "UCB", isCanonicalBrand: true, isHighIntent: true, shortDescription: "One of the most popular antihistamine brands for allergies" },
  { slug: "claritin", brandName: "Claritin", genericSlug: "loratadine", manufacturer: "Bayer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Non-drowsy antihistamine brand for seasonal allergies" },
  { slug: "telfast", brandName: "Telfast", genericSlug: "fexofenadine", manufacturer: "Sanofi", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Premium non-sedating antihistamine popular in the Middle East" },

  // Dermatological
  { slug: "roaccutane", brandName: "Roaccutane", genericSlug: "isotretinoin", manufacturer: "Roche", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The iconic isotretinoin brand for severe acne — common search in UAE" },
  { slug: "differin", brandName: "Differin", genericSlug: "adapalene", manufacturer: "Galderma", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Adapalene gel now available over-the-counter for acne" },

  // ED
  { slug: "viagra", brandName: "Viagra", genericSlug: "sildenafil", manufacturer: "Pfizer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "The original PDE5 inhibitor for erectile dysfunction" },
  { slug: "cialis", brandName: "Cialis", genericSlug: "tadalafil", manufacturer: "Eli Lilly", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Long-acting ED medication that can work for up to 36 hours" },

  // Nerve pain
  { slug: "lyrica", brandName: "Lyrica", genericSlug: "pregabalin", manufacturer: "Pfizer", isCanonicalBrand: true, isHighIntent: true, shortDescription: "Leading pregabalin brand for nerve pain and anxiety" },

  // Weight
  { slug: "xenical", brandName: "Xenical", genericSlug: "orlistat", manufacturer: "Roche", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Prescription-strength orlistat for weight management" },
  { slug: "alli", brandName: "Alli", genericSlug: "orlistat", manufacturer: "GSK", isCanonicalBrand: false, isHighIntent: false, shortDescription: "Over-the-counter half-dose orlistat for weight loss support" },

  // Sleeping
  { slug: "ambien", brandName: "Ambien", genericSlug: "zolpidem", manufacturer: "Sanofi", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Best-known sleeping pill brand for short-term insomnia" },

  // Tamiflu
  { slug: "tamiflu", brandName: "Tamiflu", genericSlug: "oseltamivir", manufacturer: "Roche", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Antiviral brand for treating influenza within 48 hours of symptoms" },

  // Anti-nausea
  { slug: "zofran", brandName: "Zofran", genericSlug: "ondansetron", manufacturer: "GSK", isCanonicalBrand: true, isHighIntent: false, shortDescription: "Premium anti-nausea brand for chemotherapy and post-surgery" },
];

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Dynamic import pg
  const pg = await import("pg");
  const { Pool } = pg.default || pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Seeding medication classes...");
  for (const cls of CLASSES) {
    await pool.query(
      `INSERT INTO medication_classes (slug, name, name_ar, short_description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET name = $2, short_description = $4, updated_at = NOW()`,
      [cls.slug, cls.name, cls.nameAr || null, cls.shortDescription || null, CLASSES.indexOf(cls)]
    );
  }
  console.log(`  ${CLASSES.length} classes`);

  console.log("Seeding medications...");
  for (const med of MEDICATIONS) {
    await pool.query(
      `INSERT INTO medications (slug, generic_name, generic_name_ar, class_slug, rx_status, short_description,
        common_conditions, common_specialties, lab_monitoring_notes, generic_substitution_note, insurer_note,
        is_prescription_required, has_generic_equivalent, requires_monitoring_labs, is_high_intent, is_city_sensitive, page_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (slug) DO UPDATE SET
         generic_name=$2, class_slug=$4, rx_status=$5, short_description=$6,
         common_conditions=$7, common_specialties=$8, lab_monitoring_notes=$9,
         is_prescription_required=$12, has_generic_equivalent=$13, requires_monitoring_labs=$14,
         is_high_intent=$15, is_city_sensitive=$16, updated_at=NOW()`,
      [
        med.slug, med.genericName, med.genericNameAr || null, med.classSlug, med.rxStatus,
        med.shortDescription || null,
        JSON.stringify(med.commonConditions || []), JSON.stringify(med.commonSpecialties || []),
        JSON.stringify(med.labMonitoringNotes || []),
        med.genericSubstitutionNote || null, med.insurerNote || null,
        med.isPrescriptionRequired ?? true, med.hasGenericEquivalent ?? false,
        med.requiresMonitoringLabs ?? false, med.isHighIntent ?? false, med.isCitySensitive ?? false,
        med.pageState || "canonical",
      ]
    );
  }
  console.log(`  ${MEDICATIONS.length} medications`);

  console.log("Seeding brands...");
  for (const brand of BRANDS) {
    await pool.query(
      `INSERT INTO medication_brands (slug, brand_name, brand_name_ar, generic_slug, manufacturer, short_description,
        is_canonical_brand, is_high_intent, page_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (slug) DO UPDATE SET
         brand_name=$2, generic_slug=$4, manufacturer=$5, short_description=$6,
         is_canonical_brand=$7, is_high_intent=$8, updated_at=NOW()`,
      [
        brand.slug, brand.brandName, brand.brandNameAr || null, brand.genericSlug,
        brand.manufacturer || null, brand.shortDescription || null,
        brand.isCanonicalBrand ?? false, brand.isHighIntent ?? false,
        brand.pageState || "canonical",
      ]
    );
  }
  console.log(`  ${BRANDS.length} brands`);

  // Verify
  const counts = await pool.query(`
    SELECT 'classes' as tbl, COUNT(*) as cnt FROM medication_classes
    UNION ALL SELECT 'medications', COUNT(*) FROM medications
    UNION ALL SELECT 'brands', COUNT(*) FROM medication_brands
  `);
  console.log("\nFinal counts:");
  counts.rows.forEach(r => console.log(`  ${r.tbl}: ${r.cnt}`));

  // High-intent summary
  const hi = await pool.query(`
    SELECT COUNT(*) FILTER (WHERE is_high_intent) as high_meds FROM medications
  `);
  const hib = await pool.query(`
    SELECT COUNT(*) FILTER (WHERE is_high_intent) as high_brands FROM medication_brands
  `);
  console.log(`  high-intent medications: ${hi.rows[0].high_meds}`);
  console.log(`  high-intent brands: ${hib.rows[0].high_brands}`);

  await pool.end();
  console.log("\nDone.");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
