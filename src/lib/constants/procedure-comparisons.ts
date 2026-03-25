/**
 * Procedure-vs-Procedure Comparison Data
 *
 * Each entry pairs two procedures that patients commonly weigh against each other.
 * Used by /pricing/vs/[comparison] and /pricing/vs/[comparison]/[city] pages.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ProcedureComparison {
  slug: string;
  procedureASlug: string;
  procedureBSlug: string;
  title: string;
  description: string;
  /** Key differences between the two procedures */
  keyDifferences: {
    category: string;
    procedureA: string;
    procedureB: string;
  }[];
  /** When to choose procedure A */
  whenToChooseA: string[];
  /** When to choose procedure B */
  whenToChooseB: string[];
  searchTerms: string[];
  /** Grouping for the hub page */
  group: "diagnostic" | "dental" | "surgical" | "cosmetic" | "wellness";
  sortOrder: number;
}

// ─── Comparison Data ────────────────────────────────────────────────────────────

export const PROCEDURE_COMPARISONS: ProcedureComparison[] = [
  // ── Diagnostics ──
  {
    slug: "mri-scan-vs-ct-scan",
    procedureASlug: "mri-scan",
    procedureBSlug: "ct-scan",
    title: "MRI Scan vs CT Scan",
    description: "MRI and CT scans are the two most common advanced imaging techniques. MRI uses magnetic fields with no radiation, while CT uses X-rays and is faster. The choice depends on what your doctor needs to see — soft tissue detail favours MRI, while bone and emergency imaging favours CT.",
    keyDifferences: [
      { category: "Technology", procedureA: "Magnetic fields and radio waves — no ionising radiation", procedureB: "X-ray beams processed by computer — involves ionising radiation" },
      { category: "Scan Duration", procedureA: "30–60 minutes", procedureB: "10–30 minutes" },
      { category: "Best For", procedureA: "Soft tissues: brain, spine, joints, ligaments, tumours", procedureB: "Bones, lungs, abdomen, emergency trauma, bleeding" },
      { category: "Radiation", procedureA: "None — safe for repeated use", procedureB: "Low-dose ionising radiation per scan" },
      { category: "Noise", procedureA: "Loud — ear protection required", procedureB: "Quiet — minimal noise" },
      { category: "Claustrophobia", procedureA: "Enclosed tube — can trigger anxiety", procedureB: "Open ring design — less confining" },
      { category: "Contrast Dye", procedureA: "Gadolinium-based (if needed)", procedureB: "Iodine-based (if needed)" },
    ],
    whenToChooseA: [
      "Your doctor needs detailed images of soft tissues (brain, spine, joints)",
      "You need repeated imaging and want to avoid radiation exposure",
      "Evaluating ligament or tendon injuries (e.g., ACL tear, rotator cuff)",
      "Detecting tumours or brain abnormalities",
      "Pregnancy — MRI is safer as it uses no radiation",
    ],
    whenToChooseB: [
      "You need a quick result — CT scans take 10–30 minutes vs 30–60 for MRI",
      "Emergency situations: internal bleeding, stroke, trauma",
      "Evaluating bone fractures, chest infections, or kidney stones",
      "Your doctor needs to see the lungs (MRI is poor for lung imaging)",
      "You have metal implants (pacemaker, cochlear implant) that prevent MRI",
    ],
    searchTerms: ["MRI vs CT scan cost UAE", "MRI or CT scan which is better", "difference between MRI and CT scan", "MRI vs CT scan Dubai price", "should I get MRI or CT scan"],
    group: "diagnostic",
    sortOrder: 1,
  },
  {
    slug: "x-ray-vs-ultrasound",
    procedureASlug: "x-ray",
    procedureBSlug: "ultrasound",
    title: "X-Ray vs Ultrasound",
    description: "X-rays and ultrasounds are foundational diagnostic imaging tools. X-rays use radiation to visualise bones and dense structures, while ultrasounds use sound waves and are ideal for soft tissues and real-time imaging. Both are widely available and affordable across UAE clinics.",
    keyDifferences: [
      { category: "Technology", procedureA: "Ionising radiation passes through the body", procedureB: "High-frequency sound waves — no radiation" },
      { category: "Best For", procedureA: "Bones, fractures, chest (lungs, heart silhouette), dental", procedureB: "Soft tissues, pregnancy, abdominal organs, blood flow" },
      { category: "Radiation", procedureA: "Low-dose ionising radiation", procedureB: "None — completely safe, even during pregnancy" },
      { category: "Duration", procedureA: "5–15 minutes", procedureB: "15–30 minutes" },
      { category: "Image Type", procedureA: "Static 2D image", procedureB: "Real-time moving images" },
      { category: "Pain Level", procedureA: "None", procedureB: "None — gel on skin, gentle probe pressure" },
    ],
    whenToChooseA: [
      "Suspected bone fracture or dislocation",
      "Checking for pneumonia or lung conditions",
      "Dental assessment (panoramic X-ray)",
      "Screening for scoliosis or bone alignment issues",
      "Quick, low-cost initial assessment",
    ],
    whenToChooseB: [
      "Pregnancy monitoring (all trimesters)",
      "Evaluating abdominal organs (liver, kidneys, gallbladder)",
      "Checking for thyroid nodules or breast lumps",
      "Assessing blood flow in veins and arteries (Doppler)",
      "Guiding needle biopsies or joint injections in real time",
    ],
    searchTerms: ["X-ray vs ultrasound cost", "X-ray or ultrasound which is better", "difference between X-ray and ultrasound", "X-ray vs ultrasound UAE price"],
    group: "diagnostic",
    sortOrder: 10,
  },
  {
    slug: "endoscopy-vs-colonoscopy",
    procedureASlug: "endoscopy",
    procedureBSlug: "colonoscopy",
    title: "Endoscopy vs Colonoscopy",
    description: "Both procedures use a flexible camera (endoscope), but they examine different parts of the digestive tract. An upper endoscopy looks at the oesophagus, stomach, and upper small intestine, while a colonoscopy examines the large intestine (colon) and rectum.",
    keyDifferences: [
      { category: "Area Examined", procedureA: "Upper GI: oesophagus, stomach, duodenum", procedureB: "Lower GI: colon and rectum" },
      { category: "Entry Point", procedureA: "Through the mouth", procedureB: "Through the rectum" },
      { category: "Preparation", procedureA: "Fasting for 6–8 hours before", procedureB: "Full bowel prep (laxatives) 1–2 days before" },
      { category: "Duration", procedureA: "15–30 minutes", procedureB: "30–60 minutes" },
      { category: "Sedation", procedureA: "Light sedation or throat spray", procedureB: "Moderate to deep sedation" },
      { category: "Polyp Removal", procedureA: "Can biopsy or treat ulcers", procedureB: "Can remove polyps during the procedure (polypectomy)" },
    ],
    whenToChooseA: [
      "Persistent heartburn, acid reflux, or GERD symptoms",
      "Difficulty swallowing or unexplained nausea",
      "Suspected stomach ulcers or H. pylori infection",
      "Unexplained upper abdominal pain",
      "Monitoring Barrett's oesophagus",
    ],
    whenToChooseB: [
      "Routine colorectal cancer screening (recommended from age 45)",
      "Persistent change in bowel habits (diarrhoea, constipation)",
      "Rectal bleeding or blood in stool",
      "Family history of colon cancer or polyps",
      "Following up after previous polyp removal",
    ],
    searchTerms: ["endoscopy vs colonoscopy cost UAE", "endoscopy or colonoscopy", "difference between endoscopy and colonoscopy", "upper endoscopy vs colonoscopy price Dubai"],
    group: "surgical",
    sortOrder: 6,
  },
  {
    slug: "health-checkup-vs-blood-test",
    procedureASlug: "health-checkup",
    procedureBSlug: "blood-test",
    title: "Full Health Checkup vs Blood Test",
    description: "A full health checkup is a comprehensive screening that includes multiple tests (blood work, imaging, physical exam, ECG), while a standalone blood test targets specific markers. The checkup gives a broad picture; a blood test answers a focused question.",
    keyDifferences: [
      { category: "Scope", procedureA: "Comprehensive: blood, urine, imaging, ECG, physical exam", procedureB: "Targeted: specific blood markers (CBC, lipids, glucose, etc.)" },
      { category: "Duration", procedureA: "2–4 hours (full panel)", procedureB: "15–30 minutes (draw + wait)" },
      { category: "Fasting Required", procedureA: "Yes — typically 10–12 hours", procedureB: "Depends on test — lipid panel and glucose require fasting" },
      { category: "Results Timeline", procedureA: "1–3 days for full report", procedureB: "Same day to 24 hours for most tests" },
      { category: "What It Detects", procedureA: "Heart, liver, kidney, thyroid, diabetes, cancer markers, vitamin levels, and more", procedureB: "Specific conditions: anaemia, infection, cholesterol, diabetes, organ function" },
    ],
    whenToChooseA: [
      "Annual preventive health screening",
      "You have not had any medical tests in over a year",
      "Starting a new insurance policy and want a baseline",
      "Family history of chronic conditions (heart disease, diabetes, cancer)",
      "Over age 40 and want comprehensive screening",
    ],
    whenToChooseB: [
      "Your doctor ordered specific tests (e.g., thyroid, vitamin D, HbA1c)",
      "Monitoring an existing condition (e.g., diabetes, cholesterol)",
      "Quick check-up on one specific concern",
      "Budget-conscious — blood tests are much cheaper than full checkups",
      "Follow-up after a health checkup showed abnormal markers",
    ],
    searchTerms: ["health checkup vs blood test cost UAE", "full checkup or blood test", "comprehensive health screening vs blood work", "health checkup vs blood test Dubai price"],
    group: "wellness",
    sortOrder: 15,
  },

  // ── Dental ──
  {
    slug: "dental-implant-vs-dental-crown",
    procedureASlug: "dental-implant",
    procedureBSlug: "dental-crown",
    title: "Dental Implant vs Crown",
    description: "Dental implants replace a missing tooth entirely (root + crown), while dental crowns cap an existing damaged tooth. The choice depends on whether the tooth can be saved. Implants cost significantly more but last a lifetime; crowns are more affordable and preserve the natural root.",
    keyDifferences: [
      { category: "Purpose", procedureA: "Replaces a missing tooth (root + crown)", procedureB: "Caps and protects a damaged existing tooth" },
      { category: "Requires Natural Tooth", procedureA: "No — used when the tooth is already missing or unsalvageable", procedureB: "Yes — the natural tooth root must be intact" },
      { category: "Procedure Duration", procedureA: "3–6 months (implant placement + healing + crown)", procedureB: "2 visits over 1–2 weeks" },
      { category: "Longevity", procedureA: "20–30+ years (often lifetime with care)", procedureB: "10–15 years before replacement" },
      { category: "Surgery Required", procedureA: "Yes — minor oral surgery to place titanium post", procedureB: "No surgery — tooth is filed down and crown cemented" },
      { category: "Bone Requirement", procedureA: "Sufficient jawbone needed (bone graft if not)", procedureB: "No bone requirement" },
    ],
    whenToChooseA: [
      "The tooth is missing or cannot be saved",
      "You want the longest-lasting, most natural-feeling replacement",
      "You have sufficient jawbone density (or are willing to get a bone graft)",
      "You want to prevent bone loss in the jaw (implants preserve bone)",
      "Adjacent teeth are healthy and you do not want to alter them for a bridge",
    ],
    whenToChooseB: [
      "The natural tooth root is still healthy and intact",
      "The tooth is cracked, worn down, or has a large filling that needs protection",
      "After a root canal to strengthen the treated tooth",
      "You want a quicker, less invasive, and more affordable solution",
      "You need to restore a tooth for cosmetic reasons (shape, colour, alignment)",
    ],
    searchTerms: ["dental implant vs crown cost UAE", "implant or crown which is better", "dental implant vs crown Dubai", "should I get implant or crown", "dental implant vs dental crown price"],
    group: "dental",
    sortOrder: 4,
  },
  {
    slug: "root-canal-vs-tooth-extraction",
    procedureASlug: "root-canal",
    procedureBSlug: "tooth-extraction",
    title: "Root Canal vs Tooth Extraction",
    description: "A root canal saves an infected tooth by removing the diseased pulp and sealing it, while extraction removes the tooth entirely. Dentists generally prefer saving the natural tooth when possible, but extraction may be necessary when the tooth is too damaged.",
    keyDifferences: [
      { category: "Outcome", procedureA: "Tooth is saved — cleaned, sealed, and crowned", procedureB: "Tooth is permanently removed" },
      { category: "Duration", procedureA: "1–2 visits, 60–90 minutes each", procedureB: "Single visit, 20–40 minutes" },
      { category: "Recovery", procedureA: "2–3 days of mild discomfort", procedureB: "3–7 days; socket healing takes 1–2 weeks" },
      { category: "Follow-up Needed", procedureA: "Crown placement after root canal (additional cost)", procedureB: "May need implant or bridge to replace the tooth (additional cost)" },
      { category: "Pain Level", procedureA: "Minimal with local anaesthesia; mild soreness after", procedureB: "Minimal during; more post-operative swelling and discomfort" },
      { category: "Long-term Effect", procedureA: "Natural tooth preserved; no bone loss", procedureB: "Bone loss at extraction site over time; may affect adjacent teeth" },
    ],
    whenToChooseA: [
      "The tooth structure is strong enough to support a crown after treatment",
      "You want to preserve your natural tooth and bite alignment",
      "The infection is limited to the pulp and has not spread to the root",
      "You want to avoid bone loss that occurs after extraction",
      "Replacing the tooth (implant) would be more expensive than saving it",
    ],
    whenToChooseB: [
      "The tooth is severely cracked below the gum line or fractured vertically",
      "The infection has spread extensively and the tooth cannot be saved",
      "There is not enough healthy tooth structure remaining for a crown",
      "The tooth is a wisdom tooth causing problems",
      "Budget constraints — extraction is cheaper upfront (though replacement adds cost)",
    ],
    searchTerms: ["root canal vs extraction cost UAE", "root canal or pull tooth", "save tooth or extract", "root canal vs tooth extraction Dubai price", "is root canal worth it"],
    group: "dental",
    sortOrder: 5,
  },
  {
    slug: "dental-veneer-vs-dental-crown",
    procedureASlug: "dental-veneer",
    procedureBSlug: "dental-crown",
    title: "Dental Veneers vs Crowns",
    description: "Veneers are thin porcelain shells bonded to the front of teeth for cosmetic improvement, while crowns cover the entire tooth for structural protection. Veneers are conservative (less tooth reduction), while crowns are stronger and used when the tooth is significantly damaged.",
    keyDifferences: [
      { category: "Coverage", procedureA: "Front surface only (thin shell)", procedureB: "Entire tooth (360-degree cap)" },
      { category: "Tooth Reduction", procedureA: "Minimal — 0.3–0.7mm from the front", procedureB: "Significant — 1.5–2mm all around" },
      { category: "Primary Purpose", procedureA: "Cosmetic: colour, shape, minor alignment", procedureB: "Structural: protection, strength, restoration" },
      { category: "Strength", procedureA: "Moderate — not ideal for heavy biting", procedureB: "High — withstands full biting force" },
      { category: "Reversibility", procedureA: "Semi-reversible (minimal prep veneers)", procedureB: "Not reversible — too much tooth removed" },
      { category: "Lifespan", procedureA: "10–15 years", procedureB: "10–15 years (zirconia crowns can last 20+)" },
    ],
    whenToChooseA: [
      "Your teeth are structurally sound but you want to improve their appearance",
      "You want to fix discolouration, minor chips, or small gaps",
      "You want to preserve as much natural tooth as possible",
      "The teeth are front-facing (veneers are primarily for the 'smile zone')",
      "You want a smile makeover for cosmetic reasons",
    ],
    whenToChooseB: [
      "The tooth is significantly damaged, decayed, or has a large filling",
      "After a root canal — the tooth needs full structural support",
      "The tooth is a molar or premolar that bears heavy chewing force",
      "The tooth has severe structural weakness that a veneer cannot address",
      "You grind your teeth (bruxism) — veneers are more prone to chipping",
    ],
    searchTerms: ["veneer vs crown cost UAE", "veneers or crowns which is better", "dental veneer vs crown Dubai", "veneer vs crown price comparison", "should I get veneers or crowns"],
    group: "dental",
    sortOrder: 7,
  },
  {
    slug: "teeth-whitening-vs-dental-veneer",
    procedureASlug: "teeth-whitening",
    procedureBSlug: "dental-veneer",
    title: "Teeth Whitening vs Veneers",
    description: "Teeth whitening is a non-invasive procedure that bleaches natural teeth to remove stains, while veneers are porcelain shells that permanently change the colour, shape, and alignment of teeth. Whitening is affordable and reversible; veneers are a permanent cosmetic commitment.",
    keyDifferences: [
      { category: "Invasiveness", procedureA: "Non-invasive — no tooth alteration", procedureB: "Mildly invasive — thin layer of enamel removed" },
      { category: "Results", procedureA: "Whiter natural teeth (2–8 shades lighter)", procedureB: "Perfect colour, shape, and alignment" },
      { category: "Duration of Results", procedureA: "6–12 months before touch-up needed", procedureB: "10–15 years before replacement" },
      { category: "Procedure Time", procedureA: "60–90 minutes (in-clinic)", procedureB: "2 visits over 1–2 weeks" },
      { category: "Tooth Structure", procedureA: "Preserved — no permanent change", procedureB: "Enamel permanently reduced (0.3–0.7mm)" },
      { category: "Fixes Shape Issues", procedureA: "No — only changes colour", procedureB: "Yes — corrects chips, gaps, uneven teeth" },
    ],
    whenToChooseA: [
      "Your teeth are straight and well-shaped but stained or yellowed",
      "You want a quick, affordable cosmetic improvement",
      "You prefer a non-permanent, reversible option",
      "Stains are from coffee, tea, wine, or tobacco (extrinsic stains)",
      "You want to try cosmetic improvement before committing to veneers",
    ],
    whenToChooseB: [
      "You have permanent discolouration that whitening cannot fix (tetracycline stains, fluorosis)",
      "You want to fix the shape, size, or alignment of your teeth — not just colour",
      "You have chips, cracks, or gaps between front teeth",
      "You want long-lasting results (10–15 years vs 6–12 months)",
      "You want a complete smile transformation",
    ],
    searchTerms: ["teeth whitening vs veneers cost UAE", "whitening or veneers which is better", "teeth whitening vs veneer Dubai price", "should I whiten teeth or get veneers"],
    group: "dental",
    sortOrder: 13,
  },

  // ── Eye Care ──
  {
    slug: "lasik-vs-cataract-surgery",
    procedureASlug: "lasik",
    procedureBSlug: "cataract-surgery",
    title: "LASIK vs Cataract Surgery",
    description: "LASIK and cataract surgery are both eye procedures but serve very different purposes. LASIK reshapes the cornea to correct refractive errors (myopia, hyperopia, astigmatism), while cataract surgery removes a clouded natural lens and replaces it with an artificial one. LASIK is elective; cataract surgery is medically necessary.",
    keyDifferences: [
      { category: "Purpose", procedureA: "Corrects refractive errors — replaces glasses/contacts", procedureB: "Removes clouded lens (cataract) — restores clear vision" },
      { category: "Who Needs It", procedureA: "Healthy adults (18–45) with stable prescription", procedureB: "Typically adults 50+ with age-related lens clouding" },
      { category: "What Is Treated", procedureA: "Cornea is reshaped with a laser", procedureB: "Natural lens is removed and replaced with an artificial intraocular lens (IOL)" },
      { category: "Elective vs Medical", procedureA: "Elective / cosmetic — not medically urgent", procedureB: "Medically necessary when cataracts impair vision" },
      { category: "Recovery", procedureA: "1–2 days for most activities; stable vision in 1 week", procedureB: "1–2 weeks; full visual stabilisation in 4–6 weeks" },
      { category: "Reversibility", procedureA: "Not reversible — corneal tissue permanently removed", procedureB: "Not reversible — but IOL is permanent and does not cloud" },
    ],
    whenToChooseA: [
      "You are 18–45 with a stable glasses/contact prescription",
      "You want to eliminate dependence on glasses or contact lenses",
      "You have myopia (nearsightedness), hyperopia (farsightedness), or astigmatism",
      "Your corneas are thick enough and eyes are otherwise healthy",
      "You want a quick elective procedure with rapid recovery",
    ],
    whenToChooseB: [
      "You have been diagnosed with cataracts that impair your vision",
      "Night driving has become difficult due to glare or halos",
      "Glasses or contacts no longer adequately correct your vision",
      "Your ophthalmologist has recommended surgery based on cataract grade",
      "You are over 50 and experiencing progressive lens clouding",
    ],
    searchTerms: ["LASIK vs cataract surgery cost UAE", "LASIK or cataract surgery", "difference between LASIK and cataract surgery", "eye surgery comparison Dubai", "LASIK vs cataract surgery price"],
    group: "surgical",
    sortOrder: 2,
  },

  // ── Maternity ──
  {
    slug: "normal-delivery-vs-c-section",
    procedureASlug: "normal-delivery",
    procedureBSlug: "c-section",
    title: "Normal Delivery vs C-Section",
    description: "Normal (vaginal) delivery and Caesarean section are the two methods of childbirth. Vaginal delivery is the natural process with shorter recovery, while a C-section is a surgical procedure performed when vaginal delivery is not safe or possible. The UAE has one of the highest C-section rates globally (around 30%).",
    keyDifferences: [
      { category: "Procedure Type", procedureA: "Natural process — vaginal birth", procedureB: "Major abdominal surgery" },
      { category: "Recovery Time", procedureA: "1–2 weeks to resume normal activities", procedureB: "4–6 weeks; driving restricted for 2–3 weeks" },
      { category: "Hospital Stay", procedureA: "1–2 days", procedureB: "3–4 days" },
      { category: "Anaesthesia", procedureA: "Optional epidural or none", procedureB: "Spinal or general anaesthesia (required)" },
      { category: "Scarring", procedureA: "No surgical scar (possible minor tearing)", procedureB: "Horizontal incision scar on lower abdomen" },
      { category: "Future Pregnancies", procedureA: "No restrictions on future deliveries", procedureB: "VBAC possible but subsequent C-sections may be recommended" },
      { category: "Risk Profile", procedureA: "Lower infection risk; faster recovery", procedureB: "Higher surgical risks: infection, blood loss, adhesions" },
    ],
    whenToChooseA: [
      "The pregnancy is low-risk with no complications",
      "The baby is in a head-down position",
      "You want a faster recovery and shorter hospital stay",
      "You plan multiple future pregnancies",
      "You prefer to avoid surgery unless medically necessary",
    ],
    whenToChooseB: [
      "The baby is in breech or transverse position",
      "You have placenta previa or other complications",
      "Previous C-section (depending on type of uterine incision)",
      "The baby is in distress during labour",
      "Multiple births (twins or more) where vaginal delivery is risky",
    ],
    searchTerms: ["normal delivery vs C-section cost UAE", "vaginal delivery vs caesarean", "C-section cost Dubai", "natural birth vs C-section price UAE", "delivery cost comparison Dubai"],
    group: "surgical",
    sortOrder: 3,
  },

  // ── Orthopedic ──
  {
    slug: "knee-replacement-vs-hip-replacement",
    procedureASlug: "knee-replacement",
    procedureBSlug: "hip-replacement",
    title: "Knee Replacement vs Hip Replacement",
    description: "Both are major joint replacement surgeries that replace damaged joint surfaces with prosthetic components. They share similar recovery timelines but differ in surgical approach, rehabilitation demands, and typical patient profiles. Both are commonly performed in UAE hospitals with high success rates.",
    keyDifferences: [
      { category: "Joint Replaced", procedureA: "Knee joint — femur, tibia, and sometimes patella surfaces", procedureB: "Hip joint — femoral head and acetabulum (socket)" },
      { category: "Common Cause", procedureA: "Osteoarthritis, rheumatoid arthritis, post-trauma", procedureB: "Osteoarthritis, avascular necrosis, hip fracture" },
      { category: "Surgery Duration", procedureA: "1.5–2.5 hours", procedureB: "1–2 hours" },
      { category: "Hospital Stay", procedureA: "3–5 days", procedureB: "2–4 days" },
      { category: "Full Recovery", procedureA: "3–6 months; full range of motion takes longer", procedureB: "3–6 months; most patients walk with a cane by 4–6 weeks" },
      { category: "Physiotherapy", procedureA: "Intensive — 3–6 months of dedicated PT required", procedureB: "Important but typically less intensive than knee" },
      { category: "Implant Lifespan", procedureA: "15–25 years", procedureB: "15–25 years" },
    ],
    whenToChooseA: [
      "You have severe knee arthritis that limits walking, stair climbing, or daily activities",
      "Non-surgical treatments (medication, injections, PT) have failed",
      "X-rays show significant bone-on-bone contact in the knee",
      "Knee pain disrupts sleep and daily quality of life",
      "You are generally healthy enough for major surgery under anaesthesia",
    ],
    whenToChooseB: [
      "You have severe hip arthritis or avascular necrosis causing groin or thigh pain",
      "Hip pain limits walking, sitting, or getting dressed",
      "You have suffered a displaced hip fracture (emergency indication)",
      "Non-surgical treatments have not provided adequate relief",
      "Imaging shows significant joint space narrowing in the hip",
    ],
    searchTerms: ["knee replacement vs hip replacement cost UAE", "knee or hip replacement", "joint replacement cost Dubai", "knee replacement vs hip replacement price", "joint surgery comparison UAE"],
    group: "surgical",
    sortOrder: 9,
  },

  // ── Cosmetic ──
  {
    slug: "botox-vs-dermal-fillers",
    procedureASlug: "botox",
    procedureBSlug: "dermal-fillers",
    title: "Botox vs Dermal Fillers",
    description: "Botox and dermal fillers are both injectable aesthetic treatments, but they work differently. Botox relaxes muscles to reduce dynamic wrinkles (forehead lines, crow's feet), while fillers add volume to restore lost fullness (cheeks, lips, nasolabial folds). Many patients use both in the same session for comprehensive rejuvenation.",
    keyDifferences: [
      { category: "Mechanism", procedureA: "Relaxes muscles — blocks nerve signals to prevent contraction", procedureB: "Adds volume — fills in wrinkles and restores lost fullness" },
      { category: "Best For", procedureA: "Dynamic wrinkles: forehead lines, crow's feet, frown lines (11s)", procedureB: "Static wrinkles: nasolabial folds, lip lines; volume loss: cheeks, lips, under-eyes" },
      { category: "Active Ingredient", procedureA: "Botulinum toxin type A", procedureB: "Hyaluronic acid (most common), calcium hydroxylapatite, or poly-L-lactic acid" },
      { category: "Results Timeline", procedureA: "3–7 days to see full effect", procedureB: "Immediate results (minor swelling resolves in 1–3 days)" },
      { category: "Duration of Results", procedureA: "3–4 months", procedureB: "6–18 months (depending on product and area)" },
      { category: "Reversibility", procedureA: "Wears off naturally in 3–4 months", procedureB: "HA fillers can be dissolved with hyaluronidase if needed" },
    ],
    whenToChooseA: [
      "You have forehead lines, frown lines, or crow's feet caused by muscle movement",
      "You want to prevent wrinkles from deepening (preventive Botox from age 25–30)",
      "You want to slim the jawline (masseter Botox) or reduce excessive sweating",
      "You prefer a quick treatment with minimal downtime (10–15 minutes)",
      "You are looking for a lower-cost entry point into aesthetic treatments",
    ],
    whenToChooseB: [
      "You have lost volume in cheeks, temples, or under-eye hollows due to ageing",
      "You want fuller lips or a more defined lip border",
      "You have deep nasolabial folds (nose-to-mouth lines) or marionette lines",
      "You want to improve facial symmetry or contour (chin, jawline enhancement)",
      "You want results that last longer than Botox (6–18 months vs 3–4 months)",
    ],
    searchTerms: ["Botox vs fillers cost UAE", "Botox or fillers which is better", "Botox vs dermal fillers Dubai price", "difference between Botox and fillers", "should I get Botox or fillers"],
    group: "cosmetic",
    sortOrder: 8,
  },
  {
    slug: "rhinoplasty-vs-liposuction",
    procedureASlug: "rhinoplasty",
    procedureBSlug: "liposuction",
    title: "Rhinoplasty vs Liposuction",
    description: "Rhinoplasty (nose reshaping) and liposuction (fat removal) are two of the most popular cosmetic surgeries in the UAE. While they target completely different areas, patients often research both when considering elective cosmetic surgery. This comparison covers cost, recovery, and what to expect from each.",
    keyDifferences: [
      { category: "Target Area", procedureA: "Nose — reshaping bone and cartilage", procedureB: "Body — removing stubborn fat deposits (abdomen, thighs, arms, chin)" },
      { category: "Surgery Type", procedureA: "Open or closed rhinoplasty (through nostrils or small incision)", procedureB: "Minimally invasive — small incisions with cannula suction" },
      { category: "Anaesthesia", procedureA: "General anaesthesia", procedureB: "Local with sedation or general (depending on area and volume)" },
      { category: "Duration", procedureA: "1.5–3 hours", procedureB: "1–3 hours (depending on number of areas)" },
      { category: "Recovery", procedureA: "Splint for 1 week; swelling 2–4 weeks; final result at 12 months", procedureB: "Compression garment 2–4 weeks; swelling 1–3 months; final result at 6 months" },
      { category: "Scarring", procedureA: "Minimal — hidden inside nostrils or tiny columella scar", procedureB: "Minimal — small puncture scars (3–5mm) in hidden areas" },
    ],
    whenToChooseA: [
      "You want to change the shape, size, or proportions of your nose",
      "You have breathing difficulties due to a deviated septum (functional rhinoplasty)",
      "You are unhappy with a nasal hump, wide bridge, or bulbous tip",
      "You want facial balance and improved profile aesthetics",
      "You are over 18 and your nose has finished growing",
    ],
    whenToChooseB: [
      "You have stubborn fat deposits that do not respond to diet and exercise",
      "You want body contouring — more defined waist, thighs, or jawline",
      "You are at or near your ideal weight but have localised fat pockets",
      "You want a relatively quick recovery compared to other body surgeries",
      "You understand liposuction is not a weight-loss solution but a contouring tool",
    ],
    searchTerms: ["rhinoplasty vs liposuction cost UAE", "nose job vs liposuction Dubai", "cosmetic surgery comparison UAE", "rhinoplasty or liposuction price Dubai"],
    group: "cosmetic",
    sortOrder: 12,
  },

  // ── Wellness & Therapy ──
  {
    slug: "gp-consultation-vs-specialist-consultation",
    procedureASlug: "gp-consultation",
    procedureBSlug: "specialist-consultation",
    title: "GP Visit vs Specialist Consultation",
    description: "A GP (General Practitioner) is your first point of contact for most health concerns and can diagnose and treat a wide range of conditions. A specialist has advanced training in a specific field (cardiology, dermatology, etc.) and handles complex cases. In the UAE, you can see a specialist directly without a GP referral, but insurance plans may require one.",
    keyDifferences: [
      { category: "Scope", procedureA: "Broad — treats common illnesses, manages chronic conditions, referrals", procedureB: "Narrow — deep expertise in one specific medical field" },
      { category: "When to Visit", procedureA: "First point of contact for new symptoms, general illness, preventive care", procedureB: "When your condition requires expert diagnosis or advanced treatment" },
      { category: "Referral Needed", procedureA: "No — direct walk-in or appointment", procedureB: "Insurance may require GP referral; direct access possible as self-pay" },
      { category: "Wait Time", procedureA: "Same-day or next-day appointments widely available", procedureB: "1–7 days wait; popular specialists may have longer queues" },
      { category: "Consultation Length", procedureA: "10–20 minutes", procedureB: "20–45 minutes (more in-depth assessment)" },
    ],
    whenToChooseA: [
      "You have a common illness: cold, flu, fever, minor infections",
      "You need a general health check, vaccination, or sick leave certificate",
      "You are unsure which specialist you need — the GP can direct you",
      "Your insurance plan requires a GP referral before seeing a specialist",
      "You need prescription renewals or chronic disease management (diabetes, hypertension)",
    ],
    whenToChooseB: [
      "You have a specific, diagnosed condition that needs expert management",
      "Your GP has referred you for further investigation or treatment",
      "You need a procedure only a specialist can perform (e.g., endoscopy, surgery)",
      "You want a second opinion on a diagnosis from a subspecialist",
      "Your symptoms are persistent and have not responded to GP-level treatment",
    ],
    searchTerms: ["GP vs specialist cost UAE", "GP or specialist which should I see", "GP consultation vs specialist Dubai price", "when to see a specialist UAE", "doctor visit cost comparison"],
    group: "wellness",
    sortOrder: 11,
  },
  {
    slug: "physiotherapy-session-vs-psychology-session",
    procedureASlug: "physiotherapy-session",
    procedureBSlug: "psychology-session",
    title: "Physiotherapy vs Psychology Session",
    description: "Physiotherapy treats physical conditions (pain, mobility, rehabilitation), while psychology treats mental health conditions (anxiety, depression, trauma). Both are essential healthcare services priced similarly in the UAE. Some patients need both — for instance, chronic pain often has psychological components.",
    keyDifferences: [
      { category: "Focus", procedureA: "Physical: muscles, joints, nerves, movement, posture", procedureB: "Mental: thoughts, emotions, behaviour, coping strategies" },
      { category: "Conditions Treated", procedureA: "Back pain, sports injuries, post-surgery rehab, stroke recovery", procedureB: "Anxiety, depression, PTSD, relationship issues, stress, grief" },
      { category: "Session Format", procedureA: "Hands-on therapy: exercises, stretches, manual therapy, electrotherapy", procedureB: "Talk-based therapy: CBT, EMDR, psychodynamic, mindfulness" },
      { category: "Session Duration", procedureA: "30–60 minutes", procedureB: "45–60 minutes" },
      { category: "Treatment Course", procedureA: "6–12 sessions for most conditions", procedureB: "8–20+ sessions depending on condition severity" },
      { category: "Practitioner", procedureA: "Licensed physiotherapist (DPT or equivalent)", procedureB: "Licensed clinical psychologist or counsellor" },
    ],
    whenToChooseA: [
      "You have physical pain, stiffness, or limited mobility",
      "You are recovering from surgery (knee, hip, shoulder, spine)",
      "You have a sports injury (sprain, strain, tendinitis)",
      "You need post-stroke or post-accident rehabilitation",
      "You want to improve posture, flexibility, or physical function",
    ],
    whenToChooseB: [
      "You are experiencing anxiety, depression, or persistent low mood",
      "You have gone through a traumatic event and need support",
      "You want to improve coping strategies for stress or life transitions",
      "You are struggling with relationship issues, grief, or self-esteem",
      "You need help managing a diagnosed mental health condition",
    ],
    searchTerms: ["physiotherapy vs psychology session cost UAE", "physio or psychologist", "therapy session cost Dubai", "physiotherapy vs counselling price UAE", "physical therapy vs mental health therapy cost"],
    group: "wellness",
    sortOrder: 14,
  },
];

// ─── Grouping metadata for hub page ────────────────────────────────────────────

export const COMPARISON_GROUPS: { slug: string; name: string; description: string }[] = [
  { slug: "diagnostic", name: "Diagnostic & Imaging", description: "Compare costs for MRI, CT, X-ray, ultrasound, and screening tests" },
  { slug: "dental", name: "Dental Procedures", description: "Implants vs crowns, root canals vs extractions, whitening vs veneers" },
  { slug: "surgical", name: "Surgical & Medical", description: "Eye surgery, deliveries, endoscopy, colonoscopy, joint replacements" },
  { slug: "cosmetic", name: "Cosmetic & Aesthetic", description: "Botox vs fillers, rhinoplasty vs liposuction comparisons" },
  { slug: "wellness", name: "Consultations & Wellness", description: "GP vs specialist visits, therapy sessions, health checkups" },
];

// ─── Utility Functions ──────────────────────────────────────────────────────────

export function getComparisonBySlug(slug: string): ProcedureComparison | undefined {
  return PROCEDURE_COMPARISONS.find((c) => c.slug === slug);
}

export function getAllComparisonSlugs(): string[] {
  return PROCEDURE_COMPARISONS.map((c) => c.slug);
}

export function getComparisonsByGroup(group: string): ProcedureComparison[] {
  return PROCEDURE_COMPARISONS.filter((c) => c.group === group).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}
