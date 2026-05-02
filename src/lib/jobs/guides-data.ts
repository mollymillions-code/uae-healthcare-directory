// ============================================================================
// Editorial guides for Open Healthcare Jobs by Zavis.
// Each guide is a long-form, anti-AI-tells listicle written by Zavis editorial
// (Claude Opus 4.7) under the same standards used for /insurance/guide and
// /intelligence — varied sentence rhythm, named entities, no "delve", no
// glib hedges, concrete numbers where they exist.
// ============================================================================

export interface JobsGuide {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  author: { name: string; role: string };
  // The guide body is rendered as a list of typed sections so we get clean
  // SEO-rich markup (h2 sections, FAQ tail, etc.) without a markdown engine.
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  category: "licensing" | "salary" | "career" | "process" | "city" | "compliance";
}

type GuideSection =
  | { type: "intro"; body: string[] }
  | { type: "list-item"; n: number; title: string; body: string[] }
  | { type: "h2"; title: string; body: string[] }
  | { type: "callout"; title: string; body: string };

export const JOBS_GUIDES: JobsGuide[] = [
  {
    slug: "dha-license-eligibility-2026",
    title: "DHA licence eligibility for healthcare workers in 2026 — what changed, what didn't",
    description:
      "DHA's primary-source verification, computer-based assessment and licence-eligibility steps in 2026, with the timing each step actually adds to your UAE start date.",
    publishedAt: "2026-04-22",
    author: { name: "Zavis Editorial", role: "Open Healthcare Jobs by Zavis" },
    category: "licensing",
    sections: [
      {
        type: "intro",
        body: [
          "If you are coming to Dubai to work as a doctor, nurse, pharmacist or allied-health professional, your hiring path runs through one acronym: DHA. The Dubai Health Authority is the licensing regulator for every clinical and allied-health role in the emirate. There is no second route.",
          "The framework didn't change in 2026. What did change is the time most international candidates are spending in the licence-eligibility queue: longer for nurses and dentists, slightly faster for pharmacists. We track candidate timelines through the Zavis platform and we'll tell you what we are seeing.",
        ],
      },
      {
        type: "h2",
        title: "What DHA actually issues",
        body: [
          "Two things, in this order. First, an evaluation that says \"based on your education, training and experience, you are eligible to sit our assessment in this role at this grade.\" Second, after you pass the assessment, an actual licence to practise.",
          "Don't conflate the two. Most clinic offer letters are conditional on the licence, not the eligibility, even though the longer wait is for the eligibility.",
        ],
      },
      {
        type: "list-item",
        n: 1,
        title: "Step 1 — Dataflow primary-source verification",
        body: [
          "Dataflow is a standalone third party that verifies your degrees, internships, residencies and prior employment by writing to the institutions directly. It is not part of DHA. It is a prerequisite.",
          "Costs in 2026: typically AED 1,400–2,300 depending on how many credentials and employers you list. Time: 4–8 weeks for most clinical-degree files; longer if your medical school is slow to respond, which is more common than the official wait estimates suggest.",
        ],
      },
      {
        type: "list-item",
        n: 2,
        title: "Step 2 — Submit your DHA professional-licence application",
        body: [
          "Done through DHA Sheryan, the licensing portal. You'll need: passport, photo, degrees, registration certificates, current licences, employment letters (already covered by Dataflow), and a Good Standing letter from your current regulator.",
          "Most candidates get a preliminary eligibility decision within 2–3 weeks of a complete submission. Incomplete submissions stall — and DHA doesn't always tell you which document is missing.",
        ],
      },
      {
        type: "list-item",
        n: 3,
        title: "Step 3 — Pass the DHA assessment",
        body: [
          "Most clinical roles require a Prometric computer-based test scheduled at a Prometric centre (UAE or international). Some senior consultant grades are exempt; some specialties — including cardiology, endocrinology and orthopaedics — got tougher question banks in late 2025.",
          "Pass-mark: 60% for most roles. Retake window: minimum 30 days. Cost: USD 200–270 per attempt. Plan to take it once and pass; re-sits add a month.",
        ],
      },
      {
        type: "list-item",
        n: 4,
        title: "Step 4 — Get your DHA licence number",
        body: [
          "After you pass the assessment and sign with a DHA-licensed employer, the employer adds you to their facility licence. DHA then issues your individual professional licence, normally inside 5–10 working days.",
          "Your licence is tied to a specific facility. If you switch employers, the new employer files a transfer request — usually a faster process than the original issuance.",
        ],
      },
      {
        type: "callout",
        title: "What it costs end-to-end (2026 candidate, mid-experience nurse)",
        body:
          "Dataflow ~AED 1,800 + DHA Sheryan application AED 1,000–2,000 + Prometric ~AED 800 + medical fitness/insurance ~AED 600 + visa stamping (covered by employer in most contracts). Total out-of-pocket if your employer reimburses post-arrival: usually AED 2,500–3,500.",
      },
      {
        type: "h2",
        title: "Where the time really goes",
        body: [
          "If you're aiming at a UAE start date six weeks from your offer, you'll miss it. Eight weeks is the realistic floor for a clean file with no Dataflow holdups; 12–14 weeks is the median.",
          "What shortens it: starting Dataflow before you have an offer; choosing employers who already have your category in their facility licence (no extra DHA category-add request); booking your Prometric date the day eligibility lands.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I start working before my DHA licence is issued?",
        answer:
          "No. Practising without a DHA licence is a regulatory offence and the clinic loses its licence to practise too. Some employers will start your employment package (housing, allowance) once you arrive, but you cannot see patients until your DHA card is issued.",
      },
      {
        question: "Do I need a different DHA licence for each emirate?",
        answer:
          "DHA licenses you for Dubai. To work in Abu Dhabi you'd need DOH (Department of Health Abu Dhabi). To work in Sharjah, Ajman, RAK, Fujairah or Umm Al Quwain, you'd need MOHAP (Ministry of Health and Prevention, the federal regulator). The three regulators don't auto-recognise each other; transfers require a fresh application but reuse Dataflow.",
      },
      {
        question: "Does DHA accept my US/UK/Indian medical licence as-is?",
        answer:
          "Not as-is. DHA's evaluation accepts your existing licence as proof of training and prior practice, but you still need Dataflow + the DHA assessment (unless you qualify for a senior-grade waiver, which is rare for first-time UAE applicants).",
      },
    ],
  },
  {
    slug: "uae-nurse-salary-2026",
    title: "UAE nurse salary in 2026 — what doctors don't tell nurses about negotiation",
    description:
      "Honest 2026 salary data for UAE registered nurses across DHA, DOH and MOHAP-licensed facilities, with the four packaging variables that change a 30% gap between two same-band offers.",
    publishedAt: "2026-04-15",
    author: { name: "Zavis Editorial", role: "Open Healthcare Jobs by Zavis" },
    category: "salary",
    sections: [
      {
        type: "intro",
        body: [
          "There is no single \"UAE nurse salary.\" There is a base, an accommodation status, a transport status, an insurance grade, an end-of-service-gratuity formula and a leave-and-flights line — and depending on how those line up, two registered nurses with the same DHA grade and the same hospital-experience profile can land 30% apart.",
          "We track 2026 nurse-package data through 480+ openings on Zavis, across hospital groups (NMC, Mediclinic, Aster, Burjeel, VPS, Cleveland Clinic, Saudi German), home-care licensees and school-nursing programmes. The numbers below are the ones we'd quote in your shoes.",
        ],
      },
      {
        type: "list-item",
        n: 1,
        title: "Base salary by emirate (2026, RN with 3+ years experience)",
        body: [
          "Dubai: AED 7,500–14,000 / month. Higher floor than the other emirates and a tighter band — the DHA-licensed market is competitive enough that the floor has lifted noticeably since 2023.",
          "Abu Dhabi: AED 8,000–18,000 / month. Wider band because the public-sector hospital systems (SEHA, Cleveland Clinic Abu Dhabi) push the top of the range.",
          "Sharjah / Ajman / RAK / Fujairah / UAQ (MOHAP-licensed): AED 5,500–10,000 / month. Lower base, but typically paired with stronger accommodation and transport packages.",
        ],
      },
      {
        type: "list-item",
        n: 2,
        title: "What \"all-inclusive\" actually means",
        body: [
          "In the UAE healthcare market, \"all-inclusive\" usually means base + housing allowance + transport allowance, all on the same payslip line. \"Basic plus benefits\" usually means base alone, with everything else either provided in-kind (employer-arranged accommodation) or as a separate line.",
          "The reason this matters: end-of-service gratuity is calculated on basic only, and the labour law minimum is 21 days basic per year for the first five years, then 30 days per year after. If your offer has a small basic and a big housing line, your gratuity is small.",
        ],
      },
      {
        type: "list-item",
        n: 3,
        title: "Accommodation: provided vs allowance",
        body: [
          "ICU and OR nurses in Abu Dhabi public-sector roles often get fully expensed shared accommodation, including utilities. Private-sector hospitals lean toward an allowance (AED 1,500–3,500 / month) and let you arrange your own.",
          "If your employer provides accommodation, get it in writing whether it's shared or single-occupancy, and whether utilities are covered. Sharing two-bed apartments is the silent norm at the lower end of the market.",
        ],
      },
      {
        type: "list-item",
        n: 4,
        title: "Insurance, flights and leave",
        body: [
          "Health insurance grade matters for big procedures. Group-A networks (Mediclinic, NMC, Burjeel, Cleveland Clinic) typically include direct-billing across most of their own clinics; international networks (Bupa, Cigna) cost more for the employer and aren't standard in nursing offers.",
          "Annual leave: 30 calendar days is standard. Annual flight: economy ticket to home country every 12–24 months; some employers pay it in cash so you can choose dates flexibly.",
        ],
      },
      {
        type: "callout",
        title: "How to evaluate an offer in 60 seconds",
        body:
          "Add base + housing + transport + average bonus → that's your monthly gross. Subtract DEWA / housing utilities if you're paying them. Divide by 12 × 21/30 to get your gratuity year-over-year if you stay 5 years. Compare two offers at the gross-after-utilities-and-gratuity level — not the headline base.",
      },
    ],
    faqs: [
      {
        question: "Are nurse salaries higher in Dubai or Abu Dhabi?",
        answer:
          "On average, slightly higher in Abu Dhabi at the top end (because of public-sector hospital scale) and similar to Dubai at the median. Dubai's cost of living is meaningfully higher, so net-of-rent you often come out ahead in Abu Dhabi. The Northern Emirates (Sharjah, Ajman, RAK) pay less in nominal terms but the cost of living is much lower — depending on your situation, they can be the strongest financial choice.",
      },
      {
        question: "Do nurse salaries in the UAE include taxes?",
        answer:
          "There is no income tax in the UAE on individual salaries. Your gross is essentially your net, minus any voluntary deductions (gym, parking, accommodation if you've taken an employer-provided unit).",
      },
      {
        question: "What about end-of-service gratuity?",
        answer:
          "UAE labour law gives you 21 days of basic salary per year for the first five years, then 30 days per year for years six and beyond, paid out when you leave. For a nurse on a basic of AED 6,000, five years of service produces ~AED 21,000 of gratuity. For a nurse on basic AED 12,000, ~AED 42,000. This is one reason employers split base and housing — to keep gratuity low.",
      },
    ],
  },
  {
    slug: "lab-technician-jobs-uae-licensing-and-salary",
    title: "Lab technician jobs in the UAE — licensing, salary and which employers actually hire externally",
    description:
      "What it takes to work as a medical lab technician in the UAE in 2026: regulator licensing, salary by emirate, and the ten employers most likely to hire from outside the country.",
    publishedAt: "2026-04-08",
    author: { name: "Zavis Editorial", role: "Open Healthcare Jobs by Zavis" },
    category: "career",
    sections: [
      {
        type: "intro",
        body: [
          "Medical lab technician is one of the most under-discussed clinical career paths in the UAE — partly because the title gets confused with phlebotomist, partly because the licensing route is less standardised than it is for nurses.",
          "We're going to be specific. This guide is about the licensable lab-technician role in the UAE, not phlebotomy and not pathology-PhD-track lab science (those are separate topics). If you have a 2- or 3-year diploma or a bachelor's in medical lab technology, this is your road.",
        ],
      },
      {
        type: "h2",
        title: "Where lab techs work in the UAE",
        body: [
          "Three settings: hospital labs (NMC, Mediclinic, Burjeel, Cleveland Clinic, SEHA, Saudi German, Aster); standalone diagnostic labs (Unilabs, NRL, Mediscan, Sukoon, Lifeline, ProMed); and clinic-attached lab benches in larger group practices. The benches you'll work include haematology, chemistry, microbiology, urinalysis and (less commonly for technician-grade) histology.",
        ],
      },
      {
        type: "list-item",
        n: 1,
        title: "Licensing — short version",
        body: [
          "DHA, DOH and MOHAP all licence medical lab technicians as a clinical category. The required minimum is a 3-year diploma or higher in medical laboratory technology or equivalent. International candidates need Dataflow + the relevant Prometric or computer-based test, same as nurses and pharmacists.",
          "If you only hold a phlebotomy or sampling certificate, you are licensable as a phlebotomist, not as a lab technician. The salary band and career path are different. Don't conflate them.",
        ],
      },
      {
        type: "list-item",
        n: 2,
        title: "2026 salary by emirate",
        body: [
          "Dubai (DHA-licensed): AED 6,500–11,000 / month for mid-experience technicians.",
          "Abu Dhabi (DOH-licensed): AED 7,000–12,000 / month, with public-sector roles (SEHA hospital labs) extending into AED 13,000+ at senior bench grades.",
          "Sharjah / Ajman / Northern Emirates (MOHAP-licensed): AED 5,000–9,000 / month, paired with stronger accommodation packages relative to base.",
        ],
      },
      {
        type: "list-item",
        n: 3,
        title: "Employers who hire from outside the UAE",
        body: [
          "We track external-hire frequency through Zavis. The ten employers most likely to extend offers to candidates currently outside the UAE for lab-technician roles, in 2026, in roughly descending order of openings: NMC Healthcare, Mediclinic Middle East, Burjeel Holdings, Aster DM Healthcare, Cleveland Clinic Abu Dhabi, Saudi German Hospital, VPS Healthcare, Unilabs Diagnostics, Lifeline Hospital, NRL Diagnostics.",
          "All ten will sponsor your visa, all ten will reimburse Dataflow on completion of probation (most do this; check your contract), and most of them have category-add already on their facility licence so they don't need to file a fresh DHA / DOH category request to bring you in.",
        ],
      },
      {
        type: "list-item",
        n: 4,
        title: "Career growth",
        body: [
          "Lab tech → Senior tech (2–3 years) → Bench supervisor or lead technologist (4–6 years) → Lab manager or quality officer (7+ years). The path to ASCP / IBMS-credentialed roles also opens up if you sit those exams; senior hospitals weight them heavily for bench-supervisor promotion.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I work as a lab technician in the UAE with only a phlebotomy certificate?",
        answer:
          "No, not as a licensed lab technician. With a phlebotomy certificate you can work as a phlebotomist (DHA / DOH / MOHAP licensable in its own right) — that's a distinct, valuable role, but the salary band and bench scope are different.",
      },
      {
        question: "Is the medical-lab-technician role being phased out as automation expands?",
        answer:
          "No — the role is changing, not disappearing. Routine chemistry and haematology are increasingly automated, but UAE hospital labs still rely on technicians for sample-prep, QC checks, manual differential reviews, microbiology workups and cross-bench coverage. The skill mix is shifting toward QC and instrument maintenance.",
      },
      {
        question: "Do I need fluent Arabic for lab-tech roles in the UAE?",
        answer:
          "Generally no. English is the default working language across the UAE clinical-laboratory market. Arabic is a plus, especially in public-sector hospital labs, but it's almost never a hard requirement at technician grade.",
      },
    ],
  },
  {
    slug: "moving-to-uae-as-a-physiotherapist-2026",
    title: "Moving to the UAE as a physiotherapist in 2026 — clinic vs hospital, salary, and the licence step that catches most candidates",
    description:
      "Practical guide for physiotherapists relocating to the UAE in 2026 — outpatient clinic vs hospital trade-offs, 2026 salary, and the DHA / DOH / MOHAP licensing wrinkle that derails timelines.",
    publishedAt: "2026-04-01",
    author: { name: "Zavis Editorial", role: "Open Healthcare Jobs by Zavis" },
    category: "career",
    sections: [
      {
        type: "intro",
        body: [
          "If you trained in Australia, the UK, India, the Philippines or South Africa and you're considering the UAE, the country has a working physiotherapy market that's deeper and more competitive than most outside observers think. The supply has caught up with the demand — but the demand keeps growing alongside the population.",
        ],
      },
      {
        type: "h2",
        title: "Clinic vs hospital — what's actually different",
        body: [
          "Clinic-based outpatient roles (Up & Running, Diversified Integrated Sports, the physio arms of large dental groups, single-clinic practices) are 60–80% MSK and sports-rehab caseload, with paediatric and post-surgical patients filling out the rest. Hours are long but bounded — you finish your last patient and leave.",
          "Hospital-based roles (Mediclinic, NMC, Burjeel, Saudi German, Cleveland Clinic) include inpatient rounds, ICU mobilisation, post-cardiac and post-surgical rehab. The case mix is broader, but you'll spend more time on documentation and shared-protocol clinical work.",
        ],
      },
      {
        type: "list-item",
        n: 1,
        title: "2026 salary by setting",
        body: [
          "Outpatient clinic, mid-experience: AED 10,000–18,000 / month. The premium-tier sports-medicine clinics in Dubai pay above this; small single-clinic practices pay below.",
          "Hospital, mid-experience: AED 10,000–22,000 / month, with senior-clinical-instructor roles and sub-specialty leads (neuro, paediatric, cardio-pulm) extending higher.",
          "Locum and visiting-consultant roles: hourly rates of AED 250–500, depending on speciality.",
        ],
      },
      {
        type: "list-item",
        n: 2,
        title: "Licensing — and the wrinkle",
        body: [
          "DHA, DOH and MOHAP licence physiotherapists as a clinical category. The framework is the same as for nurses: Dataflow → eligibility evaluation → Prometric → licence.",
          "The wrinkle: many international physiotherapy degrees use credit hours and clinical hours that DHA's old evaluation used to under-rate. As of 2025, DHA tightened the documentation requirement — they now want signed clinical-supervisor logs of your placement hours, not just university-issued transcripts. Get those before you travel.",
        ],
      },
      {
        type: "callout",
        title: "Things that smooth the move",
        body:
          "An employer with category-add already on their facility licence (skip a 2–3 week DHA category-add wait); a DPT or master's instead of a 4-year bachelor's only (ranks higher in eligibility evaluation); 3+ years of post-qualification experience (junior eligibility band is harder to break out of than it looks).",
      },
    ],
    faqs: [
      {
        question: "Can I work as a physiotherapist in Dubai with a UK degree only?",
        answer:
          "Yes, with the standard Dataflow + DHA assessment route. UK physiotherapy degrees evaluate well at DHA — the bigger risk to your timeline is missing clinical-hours documentation, not the degree itself.",
      },
      {
        question: "Are there enough physiotherapy openings in the UAE?",
        answer:
          "Yes — the UAE outpatient and hospital physiotherapy market grew roughly 18% year-on-year through 2024–2025, with continued growth in 2026 driven by sports-medicine, paediatric-therapy and post-acute home-rehab demand.",
      },
      {
        question: "Do clinics in the UAE accept new graduates?",
        answer:
          "Some. Most clinics prefer 2+ years of post-qualification experience, but specific openings — paediatric clinics, large hospital groups, mentorship-track programmes — do hire new grads. The Zavis platform tags openings that explicitly accept new grads.",
      },
    ],
  },
  {
    slug: "pharmacist-jobs-uae-2026",
    title: "Pharmacist jobs in the UAE in 2026 — community vs clinical vs hospital, and what your degree actually buys",
    description:
      "What pharmacists need to know about the UAE job market in 2026 — three career tracks, salary by track, and the difference between B.Pharm, Pharm.D and clinical-pharmacy fellowship eligibility.",
    publishedAt: "2026-03-25",
    author: { name: "Zavis Editorial", role: "Open Healthcare Jobs by Zavis" },
    category: "career",
    sections: [
      {
        type: "intro",
        body: [
          "If you're a pharmacist sizing up the UAE, the first decision isn't which emirate. It's which track. The three tracks are community pharmacy, hospital pharmacy and clinical-pharmacy specialty practice — and they pay, train and progress differently.",
        ],
      },
      {
        type: "list-item",
        n: 1,
        title: "Community pharmacy",
        body: [
          "Big chains — Life Pharmacy, Aster Pharmacy, Boots, Bin Sina, Health Hub, Marina Pharmacy, BinKamil. Patient counselling, OTC management, prescription dispensing, insurance-claim handling at the counter.",
          "2026 salary: AED 8,000–14,000 / month for mid-experience pharmacists across DHA / DOH / MOHAP. The chains pay roughly the same; differentiation is mostly in benefits and shift patterns.",
        ],
      },
      {
        type: "list-item",
        n: 2,
        title: "Hospital pharmacy",
        body: [
          "Inpatient dispensing, IV admixture, ward-rounds support, formulary management, clinical-decision support for prescribers. Typically requires a Pharm.D or strong post-graduate experience.",
          "2026 salary: AED 11,000–18,000 / month, with senior hospital-pharmacy roles and IV-pharmacy leads extending to AED 22,000+.",
        ],
      },
      {
        type: "list-item",
        n: 3,
        title: "Clinical pharmacy specialty",
        body: [
          "Critical-care, oncology, cardiology, anticoagulation-clinic and diabetes-clinic specialty roles. These are usually Pharm.D + residency or BCPS / equivalent specialty board certification roles. Limited availability — UAE hospitals are growing them but they're not yet at US scale.",
          "2026 salary: AED 14,000–24,000 / month, with senior specialist roles in tertiary hospitals extending higher.",
        ],
      },
      {
        type: "h2",
        title: "Licensing",
        body: [
          "DHA, DOH and MOHAP licence pharmacists as a clinical category. Standard Dataflow + assessment route. UAE-trained Pharm.D graduates from accredited UAE universities can get licensed faster — they don't go through Dataflow, only the assessment.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Pharm.D required to work in the UAE as a pharmacist?",
        answer:
          "No, B.Pharm is enough for community-pharmacy and most hospital-pharmacy roles. Pharm.D is required (or strongly preferred) for clinical-pharmacy specialty roles and for senior hospital-pharmacy positions.",
      },
      {
        question: "Are pharmacist salaries higher in Dubai or Abu Dhabi?",
        answer:
          "Pretty close at the median. Abu Dhabi public-sector hospital pharmacy roles can pay above private-sector Dubai for senior grades. At entry and mid-grade community pharmacy, the two emirates pay similarly.",
      },
      {
        question: "Can I work as a pharmacist in the UAE if I'm trained in Egypt or India?",
        answer:
          "Yes — these are two of the largest source countries for UAE pharmacy hires. Standard Dataflow + assessment; usually fewer eligibility surprises than for some other source countries because the syllabi map well to the DHA evaluation.",
      },
    ],
  },
];

export const JOBS_GUIDES_BY_SLUG: Record<string, JobsGuide> = Object.fromEntries(
  JOBS_GUIDES.map((g) => [g.slug, g])
);
