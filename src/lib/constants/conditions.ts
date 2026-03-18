export interface HealthCondition {
  slug: string;
  name: string;
  description: string;
  relatedCategories: string[];
}

/** Alias for convenience */
export type Condition = HealthCondition;

export const CONDITIONS: HealthCondition[] = [
  {
    slug: "back-pain",
    name: "Back Pain",
    description: "Chronic or acute back pain treatment including spinal assessment, physiotherapy, and surgical options.",
    relatedCategories: ["orthopedics", "physiotherapy", "hospitals"],
  },
  {
    slug: "dental-implants",
    name: "Dental Implants",
    description: "Permanent tooth replacement using titanium implants placed by oral surgeons or implant specialists.",
    relatedCategories: ["dental"],
  },
  {
    slug: "teeth-whitening",
    name: "Teeth Whitening",
    description: "Professional teeth whitening and bleaching procedures for a brighter, more confident smile.",
    relatedCategories: ["dental"],
  },
  {
    slug: "skin-care-acne",
    name: "Skin Care / Acne",
    description: "Dermatological treatment for acne, skin conditions, and cosmetic skin rejuvenation procedures.",
    relatedCategories: ["dermatology", "cosmetic-plastic"],
  },
  {
    slug: "hair-loss",
    name: "Hair Loss",
    description: "Hair restoration treatments including PRP therapy, hair transplants, and medical management of alopecia.",
    relatedCategories: ["dermatology", "cosmetic-plastic"],
  },
  {
    slug: "ivf-fertility",
    name: "IVF / Fertility",
    description: "In vitro fertilization and assisted reproductive technologies for couples facing infertility challenges.",
    relatedCategories: ["fertility-ivf", "ob-gyn"],
  },
  {
    slug: "lasik-eye-surgery",
    name: "LASIK / Eye Surgery",
    description: "Laser-assisted vision correction surgery to reduce dependence on glasses and contact lenses.",
    relatedCategories: ["ophthalmology"],
  },
  {
    slug: "knee-replacement",
    name: "Knee Replacement",
    description: "Total or partial knee arthroplasty for patients with severe arthritis or knee joint damage.",
    relatedCategories: ["orthopedics", "hospitals"],
  },
  {
    slug: "cosmetic-surgery",
    name: "Cosmetic Surgery",
    description: "Elective surgical procedures including rhinoplasty, liposuction, facelifts, and body contouring.",
    relatedCategories: ["cosmetic-plastic", "dermatology"],
  },
  {
    slug: "weight-loss-bariatric",
    name: "Weight Loss / Bariatric",
    description: "Bariatric surgery and medically supervised weight management programs for obesity treatment.",
    relatedCategories: ["hospitals", "gastroenterology", "nutrition-dietetics"],
  },
  {
    slug: "diabetes-management",
    name: "Diabetes Management",
    description: "Comprehensive diabetes care including monitoring, medication management, and lifestyle counseling.",
    relatedCategories: ["clinics", "hospitals", "nutrition-dietetics"],
  },
  {
    slug: "heart-disease-cardiology",
    name: "Heart Disease / Cardiology",
    description: "Diagnosis and treatment of cardiovascular conditions including hypertension, coronary artery disease, and arrhythmias.",
    relatedCategories: ["cardiology", "hospitals"],
  },
  {
    slug: "mental-health-anxiety",
    name: "Mental Health / Anxiety",
    description: "Psychiatric and psychological treatment for anxiety, depression, stress, and other mental health conditions.",
    relatedCategories: ["mental-health"],
  },
  {
    slug: "pediatric-care",
    name: "Pediatric Care",
    description: "Specialized healthcare for infants, children, and adolescents including vaccinations and developmental assessments.",
    relatedCategories: ["pediatrics", "hospitals", "clinics"],
  },
  {
    slug: "pregnancy-maternity",
    name: "Pregnancy / Maternity",
    description: "Prenatal care, delivery services, and postnatal support for expectant and new mothers.",
    relatedCategories: ["ob-gyn", "hospitals"],
  },
  {
    slug: "physiotherapy-rehabilitation",
    name: "Physiotherapy / Rehabilitation",
    description: "Physical therapy and rehabilitation services for injury recovery, post-surgical rehab, and chronic pain.",
    relatedCategories: ["physiotherapy", "hospitals"],
  },
  {
    slug: "allergy-testing",
    name: "Allergy Testing",
    description: "Diagnostic testing and treatment for food allergies, environmental allergies, and immunological conditions.",
    relatedCategories: ["clinics", "labs-diagnostics", "pediatrics"],
  },
  {
    slug: "cancer-treatment-oncology",
    name: "Cancer Treatment / Oncology",
    description: "Comprehensive cancer care including diagnosis, chemotherapy, radiation therapy, and surgical oncology.",
    relatedCategories: ["oncology", "hospitals", "radiology-imaging"],
  },
  {
    slug: "ent-ear-nose-throat",
    name: "ENT / Ear Nose Throat",
    description: "Diagnosis and treatment of ear, nose, and throat conditions including hearing loss, sinusitis, and tonsillitis.",
    relatedCategories: ["ent", "hospitals"],
  },
  {
    slug: "orthopedic-surgery",
    name: "Orthopedic Surgery",
    description: "Surgical treatment of musculoskeletal conditions including joint replacements, fractures, and sports injuries.",
    relatedCategories: ["orthopedics", "hospitals"],
  },
];
