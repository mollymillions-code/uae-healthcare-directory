import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

/* ─── Guide data ─── */

interface InsuranceGuide {
  slug: string;
  title: string;
  metaDescription: string;
  datePublished: string;
  dateModified: string;
  faqs: { question: string; answer: string }[];
}

const GUIDES: InsuranceGuide[] = [
  {
    slug: "freelancer-health-insurance",
    title: "Health Insurance for Freelancers & Self-Sponsored Residents in UAE",
    metaDescription:
      "Complete guide to health insurance for freelancers and self-sponsored residents in the UAE. The UAE healthcare regulator and the UAE healthcare regulator requirements, cheapest compliant plans, and how to apply.",
    datePublished: "2026-01-15",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "Do freelancers need health insurance in the UAE?",
        answer:
          "Yes. Health insurance is mandatory for all visa holders in Dubai and Abu Dhabi, including freelancers and self-sponsored residents. In Dubai, you must have a UAE healthcare regulator-compliant plan. In Abu Dhabi, you need a UAE healthcare regulator-compliant plan. Failure to maintain coverage can result in visa renewal rejection and fines.",
      },
      {
        question: "What is the cheapest health insurance for freelancers in UAE?",
        answer:
          "The cheapest the UAE healthcare regulator-compliant plans in Dubai start from approximately AED 2,200–2,800 per year for an individual. In Abu Dhabi, Daman Basic plans start from around AED 600–750 per year. These basic plans cover inpatient, outpatient, and emergency care but typically exclude dental, optical, and maternity.",
      },
      {
        question: "Can I buy health insurance individually in the UAE?",
        answer:
          "Yes. If you are self-sponsored, a freelancer, or your employer does not provide coverage, you can purchase an individual plan directly from insurers like Daman, AXA, Cigna, MetLife, or Orient Insurance. Many brokers also offer online comparison and purchase.",
      },
      {
        question: "What happens if a freelancer has no health insurance in Dubai?",
        answer:
          "In Dubai, not having health insurance can lead to fines when renewing your visa or Emirates ID. The UAE healthcare regulator may flag your application, and you will need to purchase a compliant plan before proceeding. Medical costs without insurance can be extremely expensive.",
      },
    ],
  },
  {
    slug: "maternity-insurance-uae",
    title: "Maternity Health Insurance in UAE — What's Covered, Waiting Periods & Best Plans",
    metaDescription:
      "Everything about maternity health insurance in the UAE — waiting periods by insurer, what is covered and excluded, C-section coverage, newborn coverage, and the best plans.",
    datePublished: "2026-01-20",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "Is maternity covered by health insurance in the UAE?",
        answer:
          "Yes. Under Dubai's Essential Benefits Plan and Abu Dhabi's mandatory scheme, maternity is covered but typically subject to a waiting period of 12 months for normal delivery and C-section. Enhanced plans may have shorter waiting periods of 6–9 months. Emergency complications during pregnancy are covered from day one.",
      },
      {
        question: "What is the waiting period for maternity insurance in the UAE?",
        answer:
          "Most UAE health insurance plans impose a 12-month waiting period for maternity benefits. Some enhanced and premium plans reduce this to 6–9 months. During the waiting period, pregnancy-related consultations and delivery are not covered unless there is an emergency complication.",
      },
      {
        question: "Does UAE insurance cover C-sections?",
        answer:
          "Yes. Most plans that include maternity benefits cover both normal delivery and C-section (caesarean), subject to the same waiting period. However, elective C-sections without medical indication may not be covered by basic plans. Check your policy wording carefully.",
      },
      {
        question: "Is newborn coverage included in maternity insurance?",
        answer:
          "Newborns are typically covered under the mother's plan for the first 30 days after birth. After that, the baby must be added to a separate policy or to the family plan. Some premium plans extend newborn coverage to 60 or 90 days.",
      },
    ],
  },
  {
    slug: "how-to-claim-health-insurance",
    title: "How to File a Health Insurance Claim in UAE — Step by Step",
    metaDescription:
      "Step-by-step guide to filing a health insurance claim in the UAE. Direct billing vs reimbursement, required documents, timelines, and how to dispute a rejected claim.",
    datePublished: "2026-02-01",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "What is direct billing vs reimbursement in UAE health insurance?",
        answer:
          "Direct billing means the hospital or clinic bills your insurer directly — you only pay the co-pay at the time of treatment. Reimbursement means you pay the full amount upfront and submit a claim to your insurer afterwards to get the covered portion refunded. Most in-network visits use direct billing.",
      },
      {
        question: "What documents do I need to file a health insurance claim?",
        answer:
          "Typically you need: (1) the original itemised invoice or receipt, (2) the doctor's prescription or referral letter, (3) a completed claim form from your insurer, (4) your insurance card number, (5) medical reports or test results if applicable. Some insurers also accept digital submissions through their app.",
      },
      {
        question: "How long does a health insurance claim take in the UAE?",
        answer:
          "UAE insurance regulations require insurers to process and settle claims within 30 days of receiving complete documentation. In practice, straightforward claims are often settled in 7–15 working days. Complex claims involving pre-authorisation or investigation may take the full 30 days.",
      },
      {
        question: "What do I do if my health insurance claim is rejected?",
        answer:
          "First, contact your insurer to understand the reason for rejection. Common reasons include missing documents, treatment not in your coverage, or lapsed policy. You can submit additional documentation and request a review. If the dispute is not resolved, you can escalate to the UAE healthcare regulator (Dubai), the UAE healthcare regulator (Abu Dhabi), or the UAE healthcare regulator (Northern Emirates) complaints department.",
      },
    ],
  },
  {
    slug: "domestic-worker-insurance",
    title: "Health Insurance for Domestic Workers in UAE — Employer Requirements",
    metaDescription:
      "Employer guide to health insurance for domestic workers in the UAE. Legal requirements, minimum coverage, cheapest compliant plans, and penalties for non-compliance.",
    datePublished: "2026-02-10",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "Is health insurance for domestic workers mandatory in the UAE?",
        answer:
          "Yes. In Dubai and Abu Dhabi, employers (sponsors) are legally required to provide health insurance for their domestic workers, including housemaids, nannies, drivers, and cooks. This is a condition for visa issuance and renewal.",
      },
      {
        question: "What is the cheapest insurance for a domestic worker in Dubai?",
        answer:
          "Basic the UAE healthcare regulator-compliant plans for domestic workers in Dubai start from approximately AED 750–1,200 per year. These plans cover essential inpatient, outpatient, and emergency care. Daman also offers specific domestic worker plans in Abu Dhabi starting from around AED 600 per year.",
      },
      {
        question: "What happens if I don't insure my domestic worker?",
        answer:
          "Employers who fail to provide health insurance for domestic workers face penalties including fines, inability to renew the worker's visa, and potential labour complaints. In Dubai, the UAE healthcare regulator can block visa-related transactions until compliant insurance is in place.",
      },
      {
        question: "What does domestic worker health insurance cover?",
        answer:
          "Minimum compliant plans cover inpatient hospitalisation, outpatient consultations, emergency treatment, prescribed medications, and basic diagnostics. Most basic plans exclude dental, optical, maternity, and pre-existing conditions. Enhanced plans are available at higher premiums.",
      },
    ],
  },
  {
    slug: "switching-health-insurance",
    title: "How to Switch Health Insurance Providers in UAE",
    metaDescription:
      "Guide to switching health insurance providers in the UAE — when you can switch, pre-existing conditions, continuous coverage rules, and employer vs self-purchased plans.",
    datePublished: "2026-02-20",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "Can I switch health insurance providers in the UAE?",
        answer:
          "Yes. You can switch providers when your policy comes up for renewal (typically annually). If you are employer-sponsored, your employer controls the insurance selection, but you can request a change. Self-sponsored individuals can switch at any renewal period by purchasing a new policy before the old one expires.",
      },
      {
        question: "What happens to pre-existing conditions when I switch?",
        answer:
          "Under the UAE healthcare regulator and the UAE healthcare regulator regulations, if you switch from one compliant plan to another without a gap in coverage, the new insurer must cover pre-existing conditions that were covered under your previous plan. This is called continuity of coverage. However, if there is a gap in coverage, waiting periods for pre-existing conditions may be re-imposed.",
      },
      {
        question: "When is the best time to switch insurance in the UAE?",
        answer:
          "The best time to switch is at your policy renewal date. Most individual plans are annual. Give yourself 2–4 weeks before renewal to compare plans, apply with a new insurer, and ensure there is no coverage gap. Avoid switching mid-policy unless your circumstances change significantly.",
      },
      {
        question: "Can my employer switch my health insurance without my consent?",
        answer:
          "Yes. Employers can change insurance providers at renewal as long as the new plan meets the minimum regulatory requirements (Dubai mandatory health insurance plan in Dubai, the UAE healthcare regulator requirements in Abu Dhabi). You should receive advance notice and details of the new plan.",
      },
    ],
  },
  // ─── Phase 3 listicles (added 2026-05-02) ─────────────────────────────
  {
    slug: "walk-in-clinic-insurance",
    title: "Walk-In Clinic Insurance in the UAE — Direct Billing, Co-pays, Networks (2026)",
    metaDescription:
      "Which UAE health insurance plans cover walk-in consultations with direct billing? Co-pay structure, in-network walk-in chains, and what to expect at reception in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Does my UAE health insurance cover walk-in clinic visits?",
        answer:
          "Yes — every the UAE healthcare regulator-compliant policy covers walk-in (no-appointment) outpatient consultations at any in-network facility. The exception is policies with a referral-only structure (rare on UAE schemes), where you must first see a primary-care GP before specialist visits.",
      },
      {
        question: "How much will I pay at a walk-in clinic with insurance?",
        answer:
          "On most employer-funded plans you'll pay a 10–20% outpatient co-pay capped at AED 50–100 per visit, plus the cost of any prescribed medication. Premium tiers (Cigna Close Care, Bupa Lifeline, Allianz Premier Plus) often waive the co-pay in-network entirely.",
      },
      {
        question: "Which walk-in chains accept the most insurance plans?",
        answer:
          "Aster Clinic, NMC Royal Clinic, Mediclinic, Medeor 24x7, HealthPlus, and Burjeel Day Surgery accept direct billing from virtually every major UAE carrier (Daman, AXA, Cigna, MetLife, Allianz, Bupa, Aetna, Orient, Sukoon). Independent solo-practice clinics often have narrower direct-billing arrangements.",
      },
      {
        question: "Can I walk in without my physical insurance card?",
        answer:
          "Yes. UAE insurers issue digital cards via member apps (Cigna Wellbeing, Bupa Global, MyAXA, MetLife member portal, NEXtCARE app), and clinic receptions accept the digital card screenshot or a photo of the policy number plus Emirates ID.",
      },
      {
        question: "Are walk-in clinic visits subject to the maternity waiting period?",
        answer:
          "Routine walk-in visits aren't restricted by the maternity waiting period — but if you walk in for pregnancy-related care (antenatal consult, ultrasound, obstetric exam) before the 10-month maternity waiting period is satisfied, those specific services aren't covered. General GP visits during pregnancy for unrelated issues (a cold, blood pressure check) remain covered.",
      },
    ],
  },
  {
    slug: "direct-billing-insurance-uae",
    title: "Direct Billing Health Insurance in the UAE — How It Works, Networks, and What Goes Wrong (2026)",
    metaDescription:
      "Direct billing means no out-of-pocket payment at the clinic. Here's how UAE direct billing actually works, the carriers with the deepest networks, and the 5 most common reasons it fails at reception.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "What is direct billing in UAE health insurance?",
        answer:
          "Direct billing means the clinic invoices your insurer directly for the visit cost, and you only pay the co-pay portion at reception. No cash up front, no claim forms to file, no waiting weeks for reimbursement.",
      },
      {
        question: "Which UAE insurer has the largest direct-billing network?",
        answer:
          "MetLife (via NEXtCARE) and Daman each have 1,800+ direct-billing facilities — the broadest UAE networks. AXA Gulf and Sukoon (formerly Oman Insurance) follow at 1,500+. Cigna and Bupa Global have curated premium networks (~600–900 facilities) focused on JCI-accredited hospitals.",
      },
      {
        question: "Why does direct billing sometimes fail at the clinic?",
        answer:
          "The five most common failures are: (1) the policy isn't active yet (typically a 2–3 day delay between purchase and TPA system update); (2) the requested service is excluded from the policy (e.g. dental on a non-dental plan); (3) pre-authorisation wasn't obtained for an MRI or specialist procedure; (4) the clinic isn't actually in-network for your specific tier; (5) policy benefits exhausted for the year.",
      },
      {
        question: "What's the difference between direct billing and reimbursement?",
        answer:
          "Direct billing settles the bill between clinic and insurer at the time of service. Reimbursement means you pay the clinic in full, then submit receipts and the claim form to your insurer afterwards — they reimburse you within 7–21 working days. Direct billing is preferred for cost-flow reasons; reimbursement is used when you visit an out-of-network provider.",
      },
      {
        question: "Can I use direct billing at any pharmacy?",
        answer:
          "Most major UAE pharmacy chains (Aster, Life, BinSina, Boots, Medicom) have direct-billing arrangements with all major insurers. Smaller independent pharmacies may not. Always show your insurance card at the counter before the prescription is filled to confirm coverage.",
      },
    ],
  },
  {
    slug: "same-day-claims-insurance",
    title: "Same-Day Claims Insurance in the UAE — Carriers That Actually Settle Fast (2026)",
    metaDescription:
      "Which UAE insurers settle reimbursement claims within 24 hours? Real settlement timelines by carrier, the documents that speed up claims, and how to escalate when claims stall.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Which UAE insurer pays reimbursement claims fastest?",
        answer:
          "Cigna Close Care averages 7 working days for reimbursement claims (the fastest in the segment), followed by Bupa Global at 7–10 days, AXA Gulf at 10–14 days, MetLife at 10–15 days, and Allianz Care at 15–21 days. \"Same day\" is uncommon; 24–72 hours is realistic only for digital-only claims with all documents pre-submitted.",
      },
      {
        question: "What documents do I need for a same-day claim?",
        answer:
          "(1) Original itemised invoice, (2) prescription if pharmacy reimbursement, (3) doctor's report/medical letter, (4) lab results if applicable, (5) a completed claim form signed by the treating doctor, (6) a clear photo of your insurance card and Emirates ID. Missing any one of these typically adds 5–10 working days as the insurer requests follow-up.",
      },
      {
        question: "Can I submit claims through an app?",
        answer:
          "Yes. All major UAE insurers offer mobile app submission: Cigna Wellbeing, Bupa Global, MyAXA, MetLife member portal, NEXtCARE (used by MetLife and several local carriers), and Allianz MyHealth. App submissions are faster than email — they auto-validate documents and tag the claim into the priority queue.",
      },
      {
        question: "What can I do if my claim is taking too long?",
        answer:
          "If a claim has been pending more than 21 days, escalate via three channels in this order: (1) the carrier's member-services hotline, (2) the broker who placed the policy (if applicable — they have insurer-side leverage), (3) the UAE Insurance Authority complaint portal at iaeqa.gov.ae for regulatory escalation. Most stalled claims clear within 48 hours of broker escalation.",
      },
      {
        question: "Are there any insurers that offer real same-day claim settlement?",
        answer:
          "For very small reimbursement amounts (under AED 500) on app-submitted claims with all documents complete, Cigna and Bupa Global occasionally settle within 24 hours — but this isn't a published SLA. The fastest published commitment is Cigna's 7-working-day standard.",
      },
    ],
  },
  {
    slug: "dental-insurance-uae-2026",
    title: "Dental Insurance in the UAE — What's Covered, Sub-limits, and the Best Plans for 2026",
    metaDescription:
      "Dental coverage isn't standard on UAE basic insurance plans. This guide compares dental sub-limits across major UAE carriers, what's covered (and what isn't), and the best plans for routine + cosmetic dental in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Is dental included on UAE basic health insurance?",
        answer:
          "No. Dental is excluded from the Dubai mandatory health insurance plan (EBP) and from Daman Basic in Abu Dhabi. Dental coverage is only included on enhanced and premium plans, typically with a sub-limit between AED 2,000 and AED 10,000 per year.",
      },
      {
        question: "What dental sub-limit do major UAE carriers offer?",
        answer:
          "Typical sub-limits: AXA Enhanced AED 2,000–5,000, MetLife Gold AED 2,000–4,000, Allianz Care Premier AED 3,000–6,000, Cigna Close Care AED 3,000–5,000, Bupa Lifeline AED 5,000–10,000 (highest in the market), Aetna Pioneer/Summit AED 3,000–8,000.",
      },
      {
        question: "Are cosmetic dental treatments covered?",
        answer:
          "No — UAE dental insurance covers medically necessary treatment only: consultations, X-rays, cleanings, fillings, extractions, root canals, and emergency dental work. Cosmetic procedures (whitening, veneers, cosmetic orthodontics, smile design) are excluded from all major UAE plans.",
      },
      {
        question: "What about orthodontic treatment for children?",
        answer:
          "Orthodontic treatment for children is covered on a few enhanced UAE plans (AXA Premier, Bupa Lifeline Comprehensive, Cigna Global Gold+) usually with a separate orthodontic sub-limit of AED 5,000–10,000 per child and a 12-month qualifying period. Adult orthodontics is rarely covered.",
      },
      {
        question: "Can I add dental to a basic plan?",
        answer:
          "Yes — most carriers offer a standalone dental rider that you can add to a base medical plan. Standalone dental riders typically cost AED 800–2,000 per year for a single adult and provide AED 3,000–5,000 in annual benefits. Standalone dental insurance plans are also available from Daman, Sukoon, and several brokers.",
      },
    ],
  },
  {
    slug: "chronic-disease-coverage-uae",
    title: "Chronic Disease Coverage in UAE Health Insurance — Diabetes, Hypertension, Heart Disease (2026)",
    metaDescription:
      "How UAE health insurance covers chronic conditions like diabetes, hypertension, and heart disease. Disease management programs, sub-limits, exclusions, and the best plans for chronic-care patients in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Is diabetes covered by UAE health insurance?",
        answer:
          "Yes. All the UAE healthcare regulator and the UAE healthcare regulator compliant plans cover diabetes diagnosis, management consultations, prescription medication (metformin, insulin), and routine HbA1c testing. Many enhanced plans include diabetes nurse education and continuous glucose monitor (CGM) supplies.",
      },
      {
        question: "What is a chronic disease management programme?",
        answer:
          "A structured insurer-funded support track for ongoing conditions — typically diabetes, hypertension, heart disease, asthma. It covers regular specialist consults, medication, lab monitoring, and lifestyle counselling, often without the per-visit co-pay applied to other consultations. Cigna, Bupa, Allianz Care and Aetna include this on most variants.",
      },
      {
        question: "Are pre-existing chronic conditions covered?",
        answer:
          "On individual plans: pre-existing conditions are typically covered after a 12-month waiting period (sometimes shorter on premium tiers). On group employer plans: most insurers waive the pre-existing waiting period entirely — coverage from day one of employment.",
      },
      {
        question: "How much do chronic medications cost on UAE insurance?",
        answer:
          "Generic chronic medications (metformin, lisinopril, atorvastatin, levothyroxine) cost AED 30–100 per month at full price; with insurance most plans cover 80–100% of the cost subject to your outpatient co-pay. Branded specialty drugs (insulin pumps, biologics, oncology) require pre-authorisation and may have separate sub-limits.",
      },
      {
        question: "Which UAE carriers are best for chronic-disease patients?",
        answer:
          "Bupa Global Lifeline Comprehensive, Cigna Close Care, and Allianz Care Premier Plus include the most comprehensive chronic-disease management — no separate sub-limits, full medication cover, and dedicated nurse case-managers. AXA and MetLife cover chronic conditions adequately but with more sub-limits and tighter pre-authorisation requirements.",
      },
    ],
  },
  {
    slug: "outpatient-vs-inpatient-uae",
    title: "Outpatient vs Inpatient Health Insurance in the UAE — What's the Difference and What's Covered (2026)",
    metaDescription:
      "UAE health insurance terminology decoded: outpatient vs inpatient cover, day-care procedures, observation status, and how each affects your co-pay and benefit limits.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "What's the difference between outpatient and inpatient in UAE insurance?",
        answer:
          "Inpatient = admitted to a hospital bed (overnight or longer). Outpatient = treated and discharged the same day (consultations, lab tests, minor procedures). Day-case = surgery requiring no overnight stay (cataract, endoscopy). Each is treated separately under your policy with different co-pays and sub-limits.",
      },
      {
        question: "Why is inpatient co-pay usually 0% but outpatient has a co-pay?",
        answer:
          "Inpatient costs are higher and more predictable, so insurers underwrite them at 0% co-pay. Outpatient is high-frequency and lower-cost per visit, so insurers apply a 10–20% co-pay to discourage unnecessary visits. The outpatient co-pay is typically capped at AED 500–1,500 annually, after which all further outpatient is fully covered.",
      },
      {
        question: "Are surgeries always inpatient?",
        answer:
          "No. Many minor surgeries (cataract, endoscopy, colonoscopy, hernia repair, lump removal) are day-case — no overnight stay required. Day-case surgery is treated as inpatient for benefit purposes (0% co-pay, draws on inpatient sub-limit) but doesn't require an overnight admission.",
      },
      {
        question: "Does outpatient cover lab tests and X-rays?",
        answer:
          "Yes. Standard outpatient cover includes consultations, pharmacy, blood tests, urine tests, basic radiology (X-ray, ultrasound, ECG), and minor procedures. Advanced imaging (MRI, CT, PET) typically requires pre-authorisation but is still covered under outpatient cover.",
      },
      {
        question: "What is observation status?",
        answer:
          "An ambiguous status used by hospitals when a patient is held for monitoring without formal admission — usually 4–24 hours. Insurance treats observation as outpatient unless it converts to formal inpatient admission. Be careful: you can be billed at outpatient rates for what feels like a hospital stay.",
      },
    ],
  },
  {
    slug: "expat-vs-resident-insurance",
    title: "Expat vs Resident Health Insurance in the UAE — Why It Matters for Coverage (2026)",
    metaDescription:
      "What changes between expat-targeted and UAE-resident insurance? Network depth, international cover, family additions, and which carriers are best for each profile in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Is there a real difference between expat and resident UAE insurance?",
        answer:
          "Yes. \"Expat insurance\" usually means international plans (Cigna Global, Bupa Global, Allianz Care, Aetna International) with cover that follows you across countries. \"Resident insurance\" means UAE-only plans (Daman, AXA, MetLife, Sukoon, Orient) that cover you within the UAE network. Both are valid for visa compliance.",
      },
      {
        question: "Do I need international insurance as an expat in the UAE?",
        answer:
          "Not for visa compliance — any the UAE healthcare regulator or the UAE healthcare regulator compliant plan satisfies the requirement. International cover matters if you travel frequently, plan to deliver a baby outside the UAE, or want continuity if you relocate to another country. For an expat staying full-time in the UAE, a strong domestic plan often delivers better value.",
      },
      {
        question: "Which is better value: international or domestic UAE plans?",
        answer:
          "For UAE-only use cases, domestic plans deliver 30–50% better value: lower premiums, deeper UAE networks, faster claims (the TPAs are local). International plans command a premium for global cover most users don't fully utilise. The break-even is around 4+ international trips per year requiring medical care.",
      },
      {
        question: "Can I add my family to either type?",
        answer:
          "Yes. Both expat-international and UAE-resident plans support spouse and dependent additions. Premium varies — expat-international family additions are typically 60–80% of the principal's premium; UAE-resident family additions are 40–60%. Newborn additions usually require notification within 30 days of birth.",
      },
      {
        question: "What happens to my insurance if I leave the UAE permanently?",
        answer:
          "Domestic UAE plans terminate when your visa is cancelled (or at the next renewal). International expat plans (Cigna Global, Bupa Global, Allianz Care) can continue with no break in cover — you just notify the insurer of the move and they update the address/billing region. Pre-existing conditions accumulated during UAE residency remain covered without re-underwriting on the same policy.",
      },
    ],
  },
  {
    slug: "top-up-insurance-uae",
    title: "Top-Up Health Insurance in the UAE — When You Need It and How It Works (2026)",
    metaDescription:
      "Top-up plans extend the annual benefit limit on your existing employer cover. Here's when top-up is worth buying, how it stacks with employer-paid base cover, and the best providers in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "What is top-up health insurance?",
        answer:
          "Top-up is a supplemental policy that activates after your primary insurance benefit limit is exhausted. If your employer plan caps annual benefits at AED 1M and a major illness costs AED 1.5M, top-up covers the AED 500K excess. Premiums are low because top-up only triggers above a threshold.",
      },
      {
        question: "When is top-up insurance worth buying?",
        answer:
          "Three scenarios: (1) you're on a base plan with a cap below AED 2M and have family history of high-cost conditions (cancer, heart disease); (2) you're a freelancer with a basic compliance plan but want backup cover for serious illness; (3) you have a chronic condition that may exceed the base plan's annual limit. For most UAE residents on a strong employer plan (AED 1M+), top-up isn't necessary.",
      },
      {
        question: "How much does top-up insurance cost in the UAE?",
        answer:
          "AED 600–2,500 per year for a single adult, depending on the threshold (AED 1M, AED 2M, AED 5M) and the additional cover amount (AED 500K, AED 1M, AED 5M). Family top-up plans cost AED 2,000–6,000 per year. Significantly cheaper than upgrading the base plan, because top-up only triggers above a threshold most members never reach.",
      },
      {
        question: "Which UAE carriers offer top-up insurance?",
        answer:
          "Most major carriers offer top-up as a separate product: AXA Gulf, Sukoon (formerly Oman Insurance), Orient Insurance, MetLife, and several brokers (Yallacompare, Insurancemarket.ae). Independent broker products often deliver better pricing than direct-from-insurer top-ups.",
      },
      {
        question: "Does top-up insurance use the same network as my base plan?",
        answer:
          "Usually yes — top-up policies typically piggyback on whichever in-network claim triggers the policy. So if your base AXA plan covers a hospital and you exhaust the limit, the AXA top-up continues at the same in-network hospital. Top-ups from carriers different from your base may have a slightly different network — confirm before purchase.",
      },
    ],
  },
  {
    slug: "mandatory-health-insurance-emirates",
    title: "Mandatory Health Insurance in the UAE — Who Must Have It, Who Pays, and What Happens If You Don't (2026)",
    metaDescription:
      "UAE mandatory health insurance rules by emirate: Dubai the UAE healthcare regulator, Abu Dhabi the UAE healthcare regulator, Northern Emirates the UAE healthcare regulator. Who's required to have cover, who pays, and the consequences of non-compliance in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "Is health insurance mandatory in the UAE?",
        answer:
          "Yes — mandatory in Dubai (since 2014, the UAE healthcare regulator-regulated), Abu Dhabi (since 2006, the UAE healthcare regulator-regulated), and progressively across the Northern Emirates under the UAE healthcare regulator. Every UAE visa holder must have a compliant policy. Without it, visa renewal, Emirates ID issuance, and trade-licence renewal are blocked.",
      },
      {
        question: "Who pays for mandatory health insurance?",
        answer:
          "For employees, the employer pays. For self-sponsored residents (freelancers, sole-proprietors, dependent spouses on family visas), the principal pays. For UAE nationals in Abu Dhabi, the government provides Thiqa free of charge.",
      },
      {
        question: "What's the minimum compliant cover in Dubai?",
        answer:
          "The Dubai mandatory health insurance plan (EBP): AED 150,000 annual cap, covers inpatient, emergency, outpatient consultations, basic outpatient diagnostics, and prescribed medications. Excludes dental, optical, maternity (or has reduced maternity), and elective procedures. Premium: ~AED 600–800/year for a single adult.",
      },
      {
        question: "What's the minimum compliant cover in Abu Dhabi?",
        answer:
          "Daman Basic (the UAE healthcare regulator-mandated floor plan): AED 250,000 annual cap, covers inpatient, emergency, outpatient consultations, and basic medications. Network is restricted to public-sector and selected private clinics. Premium: ~AED 600–750/year for a single adult.",
      },
      {
        question: "What if I don't have insurance?",
        answer:
          "Visa renewal will be denied until you produce a valid policy. Fines for being out-of-cover apply (typically AED 500/month in Dubai, varies in Abu Dhabi). Hospitals can refuse non-emergency treatment if you can't pay up-front. In emergencies you'll receive treatment but face the full unsubsidised hospital bill — easily AED 50,000+ for a basic admission.",
      },
    ],
  },
  {
    slug: "insurance-claim-process-uae",
    title: "UAE Health Insurance Claim Process — Step-by-Step Guide for 2026",
    metaDescription:
      "How to file a UAE health insurance claim end-to-end: direct billing at the clinic, post-visit reimbursement, required documents, common rejections, and how to escalate disputes in 2026.",
    datePublished: "2026-05-02",
    dateModified: "2026-05-02",
    faqs: [
      {
        question: "How do I file a UAE health insurance claim?",
        answer:
          "Two paths: (1) Direct billing — the in-network clinic invoices the insurer directly, you pay only the co-pay portion. (2) Reimbursement — for out-of-network visits, you pay in full at the clinic, then submit the receipts and claim form to the insurer for reimbursement within 7–21 working days.",
      },
      {
        question: "What documents do I need to submit a reimbursement claim?",
        answer:
          "(1) Original itemised invoice from the clinic, (2) prescription if pharmacy reimbursement, (3) doctor's report or medical letter explaining the diagnosis and treatment, (4) lab results if applicable, (5) completed and signed claim form (downloadable from your insurer's app), (6) clear photo of insurance card and Emirates ID. Original receipts are required — insurers don't accept photocopies.",
      },
      {
        question: "What are the most common reasons claims get rejected?",
        answer:
          "(1) Service excluded from policy (most common — dental on a non-dental plan, cosmetic procedures, fertility treatments, etc.). (2) Pre-authorisation not obtained where required (MRI, CT, elective inpatient). (3) Pre-existing condition within waiting period. (4) Incomplete documentation. (5) Out-of-network provider on a network-only policy. (6) Late submission past the claim window (most insurers require submission within 60–90 days of treatment).",
      },
      {
        question: "How long does a UAE health insurance claim take to process?",
        answer:
          "Direct billing: instant (settled at the clinic). Reimbursement: 7–21 working days for most insurers. Cigna averages 7 days, Bupa Global 7–10, AXA 10–14, MetLife 10–15, Allianz Care 15–21. Complex claims requiring medical review can take 21–45 days.",
      },
      {
        question: "What can I do if my claim is denied?",
        answer:
          "(1) Read the denial letter carefully — it states the policy clause used. (2) Submit additional supporting documents (medical letter clarifying necessity, peer-reviewed treatment guidelines) within 30 days. (3) If still denied, escalate via the carrier's grievance process (every UAE insurer has one). (4) If unresolved, file a complaint with the UAE Insurance Authority at iaeqa.gov.ae. Most disputes are resolved at step 2 or 3 within 4–6 weeks.",
      },
    ],
  },
];

/* ─── Static params ─── */

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return GUIDES.map((g) => ({ slug: g.slug }));
}

/* ─── Metadata ─── */

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const guide = GUIDES.find((g) => g.slug === params.slug);
  if (!guide) return {};
  const base = getBaseUrl();

  return {
    title: `${guide.title}`,
    description: guide.metaDescription,
    alternates: { canonical: `${base}/insurance/guide/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `${base}/insurance/guide/${guide.slug}`,
      type: "article",
    },
  };
}

/* ─── Guide content components ─── */

function FreelancerGuide() {
  return (
    <div className="prose-journal">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Who Needs Self-Sponsored Health Insurance?</h2>
      <p>
        If you hold a freelance permit, are self-sponsored on a family visa, or run a sole establishment in the UAE, you are responsible for arranging your own health insurance. Unlike employees whose employers must provide coverage, freelancers and self-sponsored residents must purchase and maintain a compliant plan independently. This applies whether you are in Dubai (the UAE healthcare regulator-regulated), Abu Dhabi (the UAE healthcare regulator-regulated), or the Northern Emirates (the UAE healthcare regulator-regulated).
      </p>
      <p>
        Since 2014, Dubai has required every visa holder to have health insurance. Abu Dhabi has had a similar mandate since 2006. The Northern Emirates are progressively adopting mandatory requirements under the UAE healthcare regulator. Without valid insurance, you may face difficulties renewing your visa, Emirates ID, or trade licence.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">How to Get Health Insurance as a Freelancer</h2>
      <p>
        The process is straightforward. You can purchase a plan directly from major insurers like <Link href="/insurance/daman" className="text-[#006828] hover:underline">Daman</Link>, <Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA</Link>, <Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna</Link>, <Link href="/insurance/metlife" className="text-[#006828] hover:underline">MetLife</Link>, or <Link href="/insurance/orient" className="text-[#006828] hover:underline">Orient Insurance</Link>, or through a licensed insurance broker. Many brokers offer online comparison tools where you can filter by budget, coverage needs, and preferred hospital network.
      </p>
      <p>
        To apply, you will typically need your Emirates ID, passport copy, visa copy, and freelance permit or trade licence. The insurer will issue your policy within 1-3 working days. Digital insurance cards are widely accepted at hospitals and clinics across the UAE.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Cheapest Compliant Plans for Freelancers</h2>
      <p>
        In Dubai, the cheapest the UAE healthcare regulator-compliant plans start from approximately AED 2,200-2,800 per year for a single adult. These basic plans meet the Essential Benefits Plan (EBP) requirements, covering inpatient hospitalisation, outpatient consultations, emergency care, and prescribed medications. They typically exclude dental, optical, and maternity coverage.
      </p>
      <p>
        In Abu Dhabi, Daman Basic plans start from approximately AED 600-750 per year and meet the UAE healthcare regulator minimum requirements. These are the most affordable option for Abu Dhabi visa holders. For better coverage — including wider hospital networks, lower co-payments, and dental or maternity add-ons — expect premiums of AED 4,000-8,000 per year.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">The UAE healthcare regulator and the UAE healthcare regulator Requirements</h2>
      <p>
        In Dubai, the Dubai mandatory health insurance plan (EBP) sets minimum standards that all health insurance plans must meet. This includes coverage for inpatient, outpatient, emergency, maternity (with waiting period), and prescribed medication. The annual premium cap for the most basic plan is set by the UAE healthcare regulator and reviewed periodically.
      </p>
      <p>
        In Abu Dhabi, the UAE healthcare regulator (formerly HAAD) mandates a basic benefit package through its partnership with Daman. The Abu Dhabi scheme covers both UAE nationals (through Thiqa) and expatriates (through Daman Basic and enhanced plans). Freelancers in Abu Dhabi should ensure their plan is the UAE healthcare regulator-registered, as non-compliant plans will not be accepted for visa processing.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Tips for Freelancers</h2>
      <ul>
        <li>Always check that the plan is regulatory-compliant (the UAE healthcare regulator in Dubai, the UAE healthcare regulator in Abu Dhabi) before purchasing.</li>
        <li>Compare network sizes — a cheaper plan with a small network may leave you without coverage at your preferred hospital.</li>
        <li>Consider adding dental and maternity riders if relevant to your situation.</li>
        <li>Set a calendar reminder 30 days before renewal to compare plans again — premiums and networks change annually.</li>
        <li>Keep digital copies of your insurance card and policy document on your phone for emergencies.</li>
      </ul>

      <p>
        Use the <Link href="/insurance" className="text-[#006828] hover:underline">Insurance Navigator</Link> to compare plans side by side and find the best option for your budget and needs.
      </p>
    </div>
  );
}

function MaternityGuide() {
  return (
    <div className="prose-journal">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Maternity Coverage in UAE Health Insurance</h2>
      <p>
        Maternity benefits are included in most the UAE healthcare regulator and the UAE healthcare regulator compliant health insurance plans in the UAE, but almost always subject to a waiting period. Understanding these waiting periods, coverage limits, and exclusions is critical before you plan a pregnancy — ideally, you should have your insurance in place at least 12 months before your expected delivery date.
      </p>
      <p>
        The UAE is one of the most popular destinations for expatriate families, and its healthcare system offers world-class maternity and obstetrics facilities. Major hospital groups such as Mediclinic, NMC, Aster, and Danat Al Emarat operate dedicated maternity units in Dubai and Abu Dhabi.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Waiting Periods by Insurer</h2>
      <p>
        Most UAE insurers impose a 12-month waiting period for maternity benefits on new policies. This means you must have held the policy for a full year before maternity-related costs (prenatal care, delivery, postnatal care) are covered. Some enhanced and premium plans reduce this to 6-9 months. Emergency complications during pregnancy are generally covered from day one regardless of the waiting period.
      </p>
      <p>
        Common waiting periods by insurer type:
      </p>
      <ul>
        <li><strong>Daman Basic (Abu Dhabi)</strong>: 12 months for normal delivery; emergency complications from day one.</li>
        <li><strong>Dubai mandatory health insurance plan</strong>: 12 months standard waiting period.</li>
        <li><strong>AXA SmartHealth Enhanced</strong>: 9-12 months depending on the plan tier.</li>
        <li><strong>Cigna Global/HealthGuard</strong>: 10-12 months on standard plans; 6 months on premium tiers.</li>
        <li><strong>Bupa</strong>: 12 months on most plans; some corporate group plans reduce this to 6 months.</li>
        <li><strong>MetLife</strong>: 12 months on individual plans; group schemes may negotiate lower periods.</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">What Is Covered vs Excluded</h2>
      <p>
        Once the waiting period is satisfied, maternity coverage typically includes: antenatal consultations, routine blood tests and ultrasounds, delivery (normal or C-section when medically necessary), postnatal check-ups, and medically required hospitalisation. Most plans set a sub-limit for maternity — for example, AED 10,000-30,000 per pregnancy for basic plans, and AED 30,000-70,000 for enhanced plans.
      </p>
      <p>
        Common exclusions include: elective C-sections without medical indication (on some basic plans), fertility treatments and IVF, surrogacy-related costs, doula services, cord blood banking, and non-medically necessary extras such as private rooms (unless your plan tier includes this).
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">C-Section Coverage</h2>
      <p>
        Medically indicated C-sections are covered by all compliant plans once the maternity waiting period is satisfied. The cost of a C-section delivery in the UAE ranges from AED 15,000-45,000 depending on the hospital and city. Dubai hospitals tend to charge at the higher end of this range. If a C-section is elective (patient-requested without medical need), some basic plans may not cover it or may cover it at a reduced rate.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Newborn Coverage</h2>
      <p>
        Newborns are typically covered under the mother&apos;s insurance policy for the first 30 days after birth. During this period, neonatal care, paediatric consultations, vaccinations, and any NICU admission are covered. After 30 days, the baby must be registered on a separate insurance policy or added to the family plan. Some premium plans extend automatic newborn coverage to 60 or 90 days — check your policy terms.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Choosing the Best Maternity Plan</h2>
      <p>
        If you are planning a pregnancy, consider these factors: (1) waiting period length, (2) maternity sub-limit amount, (3) which hospitals are in-network for maternity, (4) C-section coverage terms, (5) newborn coverage duration, and (6) whether postnatal physiotherapy or mental health support is included. Premium plans from insurers like <Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa</Link>, <Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna</Link>, and <Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA</Link> tend to offer the best maternity benefits.
      </p>
      <p>
        Use the <Link href="/insurance" className="text-[#006828] hover:underline">Insurance Navigator</Link> to filter plans by maternity coverage and compare sub-limits.
      </p>
    </div>
  );
}

function ClaimsGuide() {
  return (
    <div className="prose-journal">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Understanding Health Insurance Claims in the UAE</h2>
      <p>
        Filing a health insurance claim in the UAE is a standard process, but knowing the difference between direct billing and reimbursement — and having the right documents ready — can save you significant time and stress. This guide walks you through both methods, the required documentation, timelines, and what to do if your claim is rejected.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Direct Billing vs Reimbursement</h2>
      <p>
        <strong>Direct billing</strong> is the most common method in the UAE. When you visit an in-network hospital or clinic, you present your insurance card at reception. The facility verifies your coverage in real time, you pay only the co-pay or deductible at the point of treatment, and the provider bills the insurer directly for the covered amount. This is seamless and requires no claim filing from your side.
      </p>
      <p>
        <strong>Reimbursement</strong> applies when you visit an out-of-network provider, when direct billing fails due to a technical issue, or when you receive treatment abroad. You pay the full cost upfront, then submit a claim form with supporting documents to your insurer for reimbursement of the covered portion. Reimbursement rates for out-of-network visits are often lower (60-80% of the usual and customary rate) compared to in-network rates.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Required Documents for a Claim</h2>
      <p>
        To file a reimbursement claim, prepare the following documents:
      </p>
      <ul>
        <li><strong>Claim form</strong>: Download from your insurer&apos;s website or app. Complete all sections including your insurance card number, policy number, and details of the treatment.</li>
        <li><strong>Original itemised invoice</strong>: Must show the provider&apos;s name, date of service, CPT/ICD codes if available, and an itemised breakdown of charges.</li>
        <li><strong>Doctor&apos;s prescription or referral</strong>: Required for medication claims and specialist visits (if your plan requires GP referral).</li>
        <li><strong>Medical report or test results</strong>: Required for diagnostic tests, imaging, or procedures.</li>
        <li><strong>Payment receipt</strong>: Proof that you paid the full amount (bank statement, credit card receipt, or cash receipt).</li>
        <li><strong>Emirates ID or passport copy</strong>: For identity verification.</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Timelines</h2>
      <p>
        Under UAE insurance regulations (the UAE healthcare regulator and the UAE healthcare regulator), insurers are required to acknowledge receipt of a claim within 5 working days and settle or deny the claim within 30 days of receiving complete documentation. In practice, straightforward claims with complete documentation are often processed in 7-15 working days. Complex claims involving pre-authorisation, high-value procedures, or investigation may take the full 30 days.
      </p>
      <p>
        Reimbursement payments are typically made by bank transfer. Ensure your bank details are correctly recorded with your insurer to avoid delays.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">How to Dispute a Rejected Claim</h2>
      <p>
        If your claim is rejected, do not assume the decision is final. Common reasons for rejection include: incomplete documentation, treatment not covered under your plan, expired or lapsed policy, pre-existing condition waiting period not met, or failure to obtain pre-authorisation for procedures that require it.
      </p>
      <p>
        Steps to dispute a rejected claim:
      </p>
      <ol>
        <li><strong>Request the rejection reason</strong> in writing from your insurer. They must provide a specific explanation.</li>
        <li><strong>Review your policy terms</strong> to confirm whether the treatment should be covered.</li>
        <li><strong>Submit additional documentation</strong> if the rejection was due to missing information. Most insurers allow resubmission within 30-60 days.</li>
        <li><strong>File a formal appeal</strong> through your insurer&apos;s complaints or appeals process.</li>
        <li><strong>Escalate to the regulator</strong> if the insurer does not resolve the dispute. In Dubai, file a complaint with the UAE healthcare regulator. In Abu Dhabi, contact the UAE healthcare regulator. In the Northern Emirates, contact the UAE healthcare regulator. Each authority has a dedicated complaints portal.</li>
      </ol>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Insurer Claims Contact Information</h2>
      <p>
        Most major insurers in the UAE offer multiple channels for claims submission and enquiries:
      </p>
      <ul>
        <li><strong><Link href="/insurance/daman" className="text-[#006828] hover:underline">Daman</Link></strong>: App, website portal, or call 800 4 DAMAN (800 4 32626)</li>
        <li><strong><Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA</Link></strong>: MyAXA app, website portal, or email claims submission</li>
        <li><strong><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna</Link></strong>: myCigna app, website portal, or call their local UAE number</li>
        <li><strong><Link href="/insurance/metlife" className="text-[#006828] hover:underline">MetLife</Link></strong>: Website portal, email, or call centre</li>
        <li><strong><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa</Link></strong>: Bupa app, website, or dedicated claims email</li>
      </ul>
      <p>
        Always keep copies of all submitted documents and note the claim reference number for follow-up.
      </p>
    </div>
  );
}

function DomesticWorkerGuide() {
  return (
    <div className="prose-journal">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Legal Requirements for Domestic Worker Insurance</h2>
      <p>
        In the UAE, employers (sponsors) of domestic workers are legally obligated to provide health insurance coverage. This requirement applies to all domestic workers including housemaids, nannies, private drivers, cooks, and gardeners. The mandate is enforced in Dubai by the UAE healthcare regulator and in Abu Dhabi by the UAE healthcare regulator. Failure to provide coverage can result in visa rejection, fines, and labour complaints.
      </p>
      <p>
        The requirement became more strictly enforced following the UAE Domestic Workers Law (Federal Law No. 10 of 2017), which established a comprehensive framework of rights for domestic workers including the right to healthcare. Insurance is now a prerequisite for issuing and renewing domestic worker visas in Dubai and Abu Dhabi.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Minimum Coverage Requirements</h2>
      <p>
        The minimum coverage for domestic workers mirrors the basic requirements for all visa holders. In Dubai, the plan must be Dubai mandatory health insurance plan (EBP) compliant, covering inpatient hospitalisation, outpatient consultations, emergency care, prescribed medications, and basic diagnostics. In Abu Dhabi, the plan must meet the UAE healthcare regulator minimum standards as administered through Daman.
      </p>
      <p>
        Key coverage elements of compliant plans include:
      </p>
      <ul>
        <li>Inpatient hospitalisation including surgery and ICU</li>
        <li>Outpatient doctor consultations and follow-up visits</li>
        <li>Emergency treatment at any facility</li>
        <li>Prescribed medications from network pharmacies</li>
        <li>Basic laboratory tests and diagnostic imaging</li>
        <li>Maternity coverage (subject to 12-month waiting period)</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Cheapest Compliant Plans</h2>
      <p>
        The most affordable plans for domestic workers in Dubai start from approximately AED 750-1,200 per year. In Abu Dhabi, <Link href="/insurance/daman" className="text-[#006828] hover:underline">Daman</Link> offers specific domestic worker plans starting from approximately AED 600 per year. These plans meet minimum regulatory requirements but have limited networks and higher co-payments compared to enhanced plans.
      </p>
      <p>
        Employers can purchase these plans online through insurer websites or through licensed brokers. Common providers offering domestic worker plans include Daman, <Link href="/insurance/orient" className="text-[#006828] hover:underline">Orient Insurance</Link>, <Link href="/insurance/oman-insurance" className="text-[#006828] hover:underline">Oman Insurance</Link>, and <Link href="/insurance/dic" className="text-[#006828] hover:underline">Dubai Insurance Company</Link>. Comparison portals can help identify the cheapest option with an adequate network in your area.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Penalties for Non-Compliance</h2>
      <p>
        Employers who fail to insure their domestic workers face several consequences:
      </p>
      <ul>
        <li><strong>Visa rejection</strong>: Immigration authorities will not issue or renew a domestic worker&apos;s visa without proof of valid health insurance.</li>
        <li><strong>Fines</strong>: the UAE healthcare regulator and the UAE healthcare regulator can impose monetary penalties on employers found in violation. Fine amounts are reviewed periodically and can increase for repeat offenders.</li>
        <li><strong>Labour complaints</strong>: Domestic workers can file complaints with MOHRE (Ministry of Human Resources and Emiratisation) if their employer fails to provide legally required benefits, including health insurance.</li>
        <li><strong>Personal liability</strong>: Without insurance, the employer is personally liable for all medical costs incurred by the domestic worker. A single hospital admission can cost AED 10,000-50,000 or more.</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Practical Tips for Employers</h2>
      <ul>
        <li>Purchase insurance before applying for or renewing the domestic worker&apos;s visa — it is a prerequisite.</li>
        <li>Give your domestic worker a copy of their insurance card and explain how to use it at hospitals and clinics.</li>
        <li>Register the domestic worker with a nearby primary care clinic for routine health check-ups.</li>
        <li>Set a calendar reminder for policy renewal to avoid any coverage gap.</li>
        <li>Consider upgrading to an enhanced plan if your domestic worker has ongoing medical needs — the marginal cost is often modest.</li>
      </ul>
    </div>
  );
}

function SwitchingGuide() {
  return (
    <div className="prose-journal">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">When Can You Switch Health Insurance in the UAE?</h2>
      <p>
        The standard time to switch health insurance providers in the UAE is at your policy renewal date, which is typically annual. For employer-sponsored plans, the renewal date is set by your employer&apos;s HR department — usually aligned with the company&apos;s fiscal year or the employee&apos;s visa renewal. For individual (self-purchased) plans, the renewal date is 12 months from the policy start date.
      </p>
      <p>
        Mid-year switching is possible but uncommon. If you change employers, your new employer will provide new insurance, and your old policy is typically cancelled. If you move from employer-sponsored to self-sponsored (e.g., becoming a freelancer), you must purchase your own plan before the employer plan lapses to maintain continuous coverage.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Pre-Existing Conditions and Continuity of Coverage</h2>
      <p>
        This is the most critical concern when switching. Under the UAE healthcare regulator and the UAE healthcare regulator regulations, if you maintain continuous health insurance coverage in the UAE (no gap between your old and new policy), the new insurer <strong>must</strong> cover pre-existing conditions that were covered under your previous plan. This is known as the continuity of coverage rule and protects residents from losing coverage for ongoing conditions when they switch providers.
      </p>
      <p>
        However, if there is a gap in coverage — even a single day — the new insurer may re-impose waiting periods for pre-existing conditions. This can mean months without coverage for chronic conditions, maternity, or other ongoing treatments. To protect yourself:
      </p>
      <ul>
        <li>Ensure the new policy start date is the day after the old policy end date — no gap.</li>
        <li>Obtain a continuity certificate or coverage letter from your old insurer listing your covered conditions and policy dates.</li>
        <li>Provide this letter to your new insurer during the application process.</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Continuous Coverage Rules</h2>
      <p>
        The UAE healthcare regulator and the UAE healthcare regulator require insurers to honour the following when coverage is continuous:
      </p>
      <ul>
        <li>No new waiting periods for conditions already covered under the previous plan.</li>
        <li>No exclusion of pre-existing conditions that were disclosed and covered.</li>
        <li>Maternity waiting periods carry over — if you have served 8 months of a 12-month waiting period, the new insurer must count those 8 months.</li>
        <li>Lifetime and annual limits reset with the new policy period but do not go backwards.</li>
      </ul>
      <p>
        These protections apply as long as the switch is between two the UAE healthcare regulator-compliant plans (in Dubai) or two the UAE healthcare regulator-compliant plans (in Abu Dhabi). Switching from a non-compliant or international-only plan may not carry the same protections.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Employer-Sponsored vs Self-Purchased Plans</h2>
      <p>
        If your employer sponsors your insurance, the decision to switch providers rests with your employer. You can request a different plan or insurer, but the employer is not obligated to comply as long as the current plan meets regulatory minimum standards. If you want additional coverage beyond what your employer provides, you can purchase a supplementary individual plan.
      </p>
      <p>
        For self-purchased plans, you have full control. At renewal, compare plans using the <Link href="/insurance" className="text-[#006828] hover:underline">Insurance Navigator</Link> to evaluate premiums, network sizes, and coverage features. Key factors to compare include:
      </p>
      <ul>
        <li><strong>Network</strong>: Does the new plan include your preferred hospitals and clinics?</li>
        <li><strong>Premium</strong>: Is the new plan cheaper, and if so, does it sacrifice important coverage?</li>
        <li><strong>Co-payment</strong>: Will you pay more or less at each visit?</li>
        <li><strong>Coverage features</strong>: Does it include dental, optical, maternity, or mental health?</li>
        <li><strong>Annual limit</strong>: What is the maximum the insurer will pay per year?</li>
      </ul>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Step-by-Step Switching Process</h2>
      <ol>
        <li><strong>2-4 weeks before renewal</strong>: Compare plans using the <Link href="/insurance" className="text-[#006828] hover:underline">Insurance Navigator</Link> or a licensed broker.</li>
        <li><strong>Request a continuity certificate</strong> from your current insurer.</li>
        <li><strong>Apply for the new plan</strong> with your chosen insurer, providing the continuity certificate and any required medical declarations.</li>
        <li><strong>Confirm the start date</strong> aligns with your current policy end date (no gap).</li>
        <li><strong>Cancel the old policy</strong> once the new one is confirmed and active. Do not cancel before receiving confirmation of the new policy.</li>
        <li><strong>Update your Emirates ID records</strong> if required — some insurers handle this automatically.</li>
        <li><strong>Download your new insurance card</strong> and register on the new insurer&apos;s app or portal.</li>
      </ol>
    </div>
  );
}

/* ─── Phase 3 listicle content components (added 2026-05-02) ─── */

const H2 = "font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight";

function WalkInClinicGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>What &ldquo;walk-in&rdquo; means in UAE primary care</h2>
      <p>
        Most UAE outpatient care is walk-in. You don&apos;t need a referral, you don&apos;t need an appointment in advance, and you don&apos;t need pre-authorisation for a routine consultation. Show up at any in-network facility during operating hours, present your insurance card and Emirates ID at reception, and wait for the next available physician. Total time to consultation is typically 15–45 minutes at major chains like Aster Clinic and NMC Royal Clinic; 5–15 minutes at lower-volume independent practices.
      </p>
      <p>
        Walk-in cover is built into every the UAE healthcare regulator-compliant plan, including the most basic compliance-floor products like Daman Basic and the Dubai mandatory health insurance plan. The single exception is policies with a strict primary-care-first structure (which UAE plans almost never use) — those require you to see a GP first before specialist consultations are reimbursed.
      </p>

      <h2 className={H2}>What you&apos;ll pay at reception</h2>
      <p>
        On a typical employer-funded plan you&apos;ll pay a 10–20% co-pay portion at reception, capped at AED 50–100 per visit. The clinic invoices the insurer for the rest via direct billing — no claim forms, no waiting for reimbursement. Premium tiers (Cigna Close Care, Bupa Lifeline Comprehensive, Allianz Care Premier Plus, Aetna Summit) often waive the in-network co-pay entirely; in those cases you&apos;ll pay nothing at reception unless you fill a non-formulary prescription.
      </p>
      <p>
        For prescription medication, expect a separate co-pay at the pharmacy — usually 10–20% of the medication price. Most major UAE pharmacy chains (<Link href="/insurance/daman" className="text-[#006828] hover:underline">Daman</Link>-network Aster, Life, BinSina, Boots, Medicom) accept direct billing from every major carrier.
      </p>

      <h2 className={H2}>Walk-in chains with the deepest direct-billing networks</h2>
      <p>
        Six chains operate citywide walk-in networks that accept direct billing from virtually every major UAE carrier (Daman, AXA, Cigna, MetLife, Allianz, Bupa, Aetna, Orient, Sukoon): Aster Clinic, NMC Royal Clinic, Mediclinic Direct, Medeor 24x7, HealthPlus, and Burjeel Day Surgery. These chains have negotiated multilateral agreements with the major TPAs (NEXtCARE, Mednet, NAS, GlobeMed) so the direct-billing handshake at reception works regardless of which carrier issued your card.
      </p>
      <p>
        Independent solo-practice clinics often have narrower direct-billing arrangements — they may accept 3–5 major carriers but not the long tail. If you&apos;re unsure, call ahead and ask reception: &ldquo;Do you accept direct billing for [your insurer name]?&rdquo; The answer is binary and unambiguous.
      </p>

      <h2 className={H2}>Digital insurance card &amp; what to bring</h2>
      <p>
        UAE insurers issue digital cards via member apps (Cigna Wellbeing, Bupa Global, MyAXA, MetLife Member Portal, NEXtCARE, Allianz MyHealth). The digital card on your phone screen is accepted at every reception. Carry your Emirates ID — receptions cross-reference the card photo against the policy database.
      </p>
      <p>
        For first-time visits at a particular clinic, the receptionist may need 5–10 minutes to register you in their system. Subsequent visits are faster — your record is cached.
      </p>

      <h2 className={H2}>Walk-in vs urgent care vs emergency room</h2>
      <p>
        Walk-in clinics handle routine non-urgent issues: colds, allergies, stomach bugs, minor injuries, prescription refills, vaccinations, blood tests. Urgent-care centres (24x7 facilities like Medeor 24x7, NMC Royal Day Care, Aster 24x7) handle conditions that need same-day attention but aren&apos;t life-threatening: fevers, sprains, cuts requiring stitches, severe allergic reactions. Emergency rooms at major hospitals handle life-threatening conditions: chest pain, severe trauma, breathing difficulty, suspected stroke.
      </p>
      <p>
        Insurance treats all three the same way for cover purposes — outpatient consultation rates apply. The difference is wait time and severity-handling. Use <Link href="/directory/dubai" className="text-[#006828] hover:underline">the directory</Link> to find the nearest facility for your need.
      </p>
    </div>
  );
}

function DirectBillingGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>How direct billing actually works in the UAE</h2>
      <p>
        Direct billing is the financial arrangement that lets you visit a clinic, receive treatment, and walk out without paying the full bill in cash. The clinic invoices your insurer directly via a third-party administrator (TPA) — companies like NEXtCARE, Mednet, NAS, or GlobeMed handle the messaging layer between clinic billing systems and insurer claims systems.
      </p>
      <p>
        At reception, the clinic swipes your insurance card (digital or physical). The TPA system returns an instant authorisation: how much of the visit is covered, what your co-pay is, and what services are excluded. You pay only the co-pay portion. The clinic then submits the full invoice to the TPA within 24–48 hours, and the TPA reimburses the clinic on a 30-day or 60-day cycle. From your perspective: just the co-pay, instant.
      </p>

      <h2 className={H2}>Carriers with the largest direct-billing networks</h2>
      <p>
        UAE network depth in 2026:
      </p>
      <ul>
        <li><strong>MetLife (via NEXtCARE)</strong>: 1,800+ direct-billing facilities — broadest network in the segment.</li>
        <li><strong><Link href="/insurance/daman" className="text-[#006828] hover:underline">Daman</Link></strong>: 1,800+ facilities, especially deep in Abu Dhabi.</li>
        <li><strong><Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA Gulf</Link></strong>: 1,500+ facilities.</li>
        <li><strong>Sukoon (formerly Oman Insurance)</strong>: 1,500+, deepest in Dubai.</li>
        <li><strong><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna Close Care</Link></strong>: ~900 curated premium facilities.</li>
        <li><strong><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa Global</Link></strong>: ~600 premium-tier facilities.</li>
      </ul>
      <p>
        Network size matters less than network <em>fit</em>. A 600-facility curated premium network covers every hospital you&apos;d realistically choose. A 1,800-facility broad network includes many low-volume clinics you&apos;d never visit.
      </p>

      <h2 className={H2}>The five most common direct-billing failures</h2>
      <p>
        When direct billing fails at reception, it&apos;s almost always one of five things:
      </p>
      <ol>
        <li><strong>Policy not yet active in the TPA system</strong>: typically a 2–3 day delay between policy purchase and TPA system update. Workaround: pay cash, get an itemised receipt, submit reimbursement claim.</li>
        <li><strong>Service excluded from your policy</strong>: dental treatment on a non-dental plan, cosmetic procedures, fertility treatment on a basic plan. Reception will refuse direct billing because the line-item is listed as excluded.</li>
        <li><strong>Pre-authorisation not obtained</strong>: required for MRI, CT, PET scans, advanced imaging, elective surgery, specialist drugs. Without the pre-auth code, reception can&apos;t direct-bill.</li>
        <li><strong>Provider not actually in-network for your specific tier</strong>: some hospitals are in the network for premium tiers but not basic tiers. The TPA system rejects basic-tier cards at premium-tier facilities.</li>
        <li><strong>Annual benefit limit exhausted</strong>: rare but possible if you&apos;ve had heavy claims that year. Reception sees &ldquo;limit exhausted&rdquo; and can&apos;t direct-bill further.</li>
      </ol>

      <h2 className={H2}>How to escalate if direct billing fails wrongly</h2>
      <p>
        Sometimes direct billing fails for a reason that&apos;s incorrect — the TPA system has stale data, or a clinic-side billing code mismatch confuses the auth check. Before paying cash:
      </p>
      <ol>
        <li>Ask reception to call the TPA hotline (every TPA has a member-services line printed on the back of your card).</li>
        <li>Call your insurer&apos;s member-services line yourself — they often resolve in 5–10 minutes by re-authorising in real time.</li>
        <li>If unresolved, pay cash, get the itemised receipt, and submit reimbursement immediately. Most reimbursement claims for failed direct billing are settled in 7–14 days.</li>
      </ol>

      <h2 className={H2}>Direct billing vs reimbursement — when each makes sense</h2>
      <p>
        Direct billing is preferred for cost-flow reasons (you don&apos;t have to front the cash) and for high-cost procedures (a hospital stay can be AED 50,000–500,000). Reimbursement makes sense when you&apos;re visiting an out-of-network provider deliberately (a specific specialist not on your network), travelling outside the UAE on a domestic plan, or when direct billing fails and you need treatment immediately. Always keep itemised receipts and complete claim forms within 60–90 days of treatment — most insurers reject claims submitted past their window.
      </p>
    </div>
  );
}

function SameDayClaimsGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>Why &ldquo;same-day&rdquo; is mostly a myth</h2>
      <p>
        Reimbursement claims in the UAE are advertised by insurers as &ldquo;fast&rdquo; or &ldquo;efficient&rdquo; — but actual same-day settlement is rare. The published SLAs across major UAE carriers are 7–21 working days, not 24 hours. The phrase &ldquo;same-day claim&rdquo; usually refers to direct billing at the point of service, not post-visit reimbursement.
      </p>
      <p>
        That said, some claims do settle within 24–72 hours. The factors that compress timelines: a small claim amount (under AED 500), digital app submission with all documents complete, no pre-authorisation requirements, and the claim falling clearly within standard cover.
      </p>

      <h2 className={H2}>Real settlement timelines by carrier (2026)</h2>
      <ul>
        <li><strong><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna Close Care</Link></strong>: 7 working days average; fastest in the segment.</li>
        <li><strong><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa Global</Link></strong>: 7–10 working days.</li>
        <li><strong><Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA Gulf</Link></strong>: 10–14 working days.</li>
        <li><strong><Link href="/insurance/metlife" className="text-[#006828] hover:underline">MetLife</Link></strong>: 10–15 working days.</li>
        <li><strong><Link href="/insurance/allianz" className="text-[#006828] hover:underline">Allianz Care</Link></strong>: 15–21 working days.</li>
        <li><strong><Link href="/insurance/aetna" className="text-[#006828] hover:underline">Aetna International</Link></strong>: 10–14 working days.</li>
      </ul>
      <p>
        Complex claims (those requiring medical-board review, peer review, or pre-existing condition assessment) take 21–45 days regardless of insurer.
      </p>

      <h2 className={H2}>The seven documents that speed up your claim</h2>
      <ol>
        <li><strong>Original itemised invoice</strong> from the clinic — must be original, not a photocopy.</li>
        <li><strong>Prescription</strong> if claiming pharmacy costs — original from the prescribing doctor.</li>
        <li><strong>Doctor&apos;s report or medical letter</strong> explaining diagnosis, treatment, and necessity.</li>
        <li><strong>Lab/imaging results</strong> if applicable — confirms the medical necessity of related charges.</li>
        <li><strong>Completed and signed claim form</strong> — download from your insurer&apos;s app, sign, and have the treating doctor sign.</li>
        <li><strong>Clear photo of insurance card and Emirates ID</strong>.</li>
        <li><strong>Bank account details</strong> for direct-deposit reimbursement (much faster than cheque).</li>
      </ol>
      <p>
        Missing any one of these typically adds 5–10 working days to settlement as the insurer requests follow-up. Submit all seven on day one — even if some look unnecessary — to avoid back-and-forth.
      </p>

      <h2 className={H2}>App submission vs email submission</h2>
      <p>
        App submissions are faster than email by 3–5 working days. The reason: apps auto-validate documents (correct file types, photo clarity, required fields) and tag the claim into the priority digital queue. Email submissions go through manual triage and human keying, adding latency.
      </p>
      <p>
        Major UAE insurer apps: Cigna Wellbeing, Bupa Global, MyAXA, MetLife Member Portal, NEXtCARE (used by MetLife and several local carriers), Allianz MyHealth, Aetna International. Download before you submit — having the app ready cuts hours off the process.
      </p>

      <h2 className={H2}>How to escalate when claims stall</h2>
      <p>
        If a claim has been pending more than 21 working days with no movement, escalate in this order:
      </p>
      <ol>
        <li><strong>Carrier&apos;s member-services hotline</strong>: ask for the claim status and the specific reason for delay. Note the case-handler name.</li>
        <li><strong>The broker who placed the policy</strong> (if applicable): brokers have insurer-side leverage that members don&apos;t. Most stalled claims clear within 48 hours of broker escalation.</li>
        <li><strong>UAE Insurance Authority complaint portal</strong> at iaeqa.gov.ae for regulatory escalation. The IA takes complaints seriously and most regulated insurers will resolve within 5 working days of an IA notice.</li>
      </ol>
    </div>
  );
}

function DentalInsuranceGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>Dental is not in the UAE basic plan</h2>
      <p>
        UAE&apos;s mandatory minimum cover (Dubai mandatory health insurance plan in Dubai, Daman Basic in Abu Dhabi) excludes routine dental treatment. If you have only a compliance-floor plan, you&apos;ll pay full out-of-pocket cost for cleanings, fillings, root canals, and extractions. Emergency dental treatment is sometimes covered under the broader emergency benefit, but not always — read your policy wording carefully.
      </p>
      <p>
        Dental cover is included on enhanced and premium tiers, with a sub-limit between AED 2,000 and AED 10,000 per year. The sub-limit is separate from the policy&apos;s overall annual benefit limit — once you exhaust dental, you can&apos;t draw on the medical benefit pool for dental treatment.
      </p>

      <h2 className={H2}>Dental sub-limits across major UAE carriers (2026)</h2>
      <ul>
        <li><strong><Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA Enhanced</Link></strong>: AED 2,000–5,000 per year.</li>
        <li><strong><Link href="/insurance/metlife" className="text-[#006828] hover:underline">MetLife Gold</Link></strong>: AED 2,000–4,000 per year.</li>
        <li><strong><Link href="/insurance/allianz" className="text-[#006828] hover:underline">Allianz Care Premier</Link></strong>: AED 3,000–6,000 per year.</li>
        <li><strong><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna Close Care</Link></strong>: AED 3,000–5,000 per year.</li>
        <li><strong><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa Lifeline Comprehensive</Link></strong>: AED 5,000–10,000 per year (highest in market).</li>
        <li><strong><Link href="/insurance/aetna" className="text-[#006828] hover:underline">Aetna Pioneer/Summit</Link></strong>: AED 3,000–8,000 per year.</li>
      </ul>

      <h2 className={H2}>What dental insurance covers (and what it doesn&apos;t)</h2>
      <p>
        Covered: consultations, X-rays, scaling/cleaning twice per year, fillings, simple extractions, root canal treatment, periodontal cleaning, and emergency dental work. Covered subject to medical necessity: complex extractions (wisdom teeth), crowns, bridges, dentures.
      </p>
      <p>
        Excluded across virtually all UAE plans: cosmetic whitening, veneers (unless medically necessary post-trauma), cosmetic orthodontics, smile-design work, dental implants (rarely covered, never on basic plans), and any procedure marketed as &ldquo;aesthetic&rdquo; rather than &ldquo;therapeutic&rdquo;.
      </p>

      <h2 className={H2}>Children&apos;s orthodontic cover</h2>
      <p>
        Most UAE plans don&apos;t cover orthodontics, but a few enhanced tiers do — usually with a separate orthodontic sub-limit and a 12-month qualifying period. Cover usually applies only to children under 16 with a documented medical or developmental indication (not aesthetic preference). Expected sub-limit on plans that cover ortho: AED 5,000–10,000 per child per course.
      </p>
      <p>
        If your child needs braces and ortho isn&apos;t in your current cover, factor AED 12,000–25,000 cash cost over 18–24 months of treatment at major UAE orthodontic chains.
      </p>

      <h2 className={H2}>Adding dental to a basic plan: standalone riders</h2>
      <p>
        Most carriers offer a standalone dental rider you can add to a base medical plan. Pricing: AED 800–2,000 per year for a single adult, providing AED 3,000–5,000 in annual benefits. Family riders cost AED 2,500–5,000.
      </p>
      <p>
        Standalone dental insurance is also sold as a separate product by Daman, Sukoon, Orient Insurance, and several brokers. If you&apos;re a heavy dental user (multiple cleanings, occasional fillings, family plan with kids) the standalone often delivers better value than upgrading the base medical plan.
      </p>
    </div>
  );
}

function ChronicDiseaseGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>Chronic conditions are well-covered on UAE insurance</h2>
      <p>
        Diabetes, hypertension, heart disease, asthma, hypothyroidism, chronic kidney disease, and similar long-term conditions are explicitly included in the UAE healthcare regulator and the UAE healthcare regulator compliance benchmarks. Every compliant UAE plan covers diagnosis, ongoing specialist consultations, prescription medication, and routine lab monitoring. The differences across plans show up in the depth of disease-management programs, the breadth of formulary coverage, and how aggressively pre-existing waiting periods are applied.
      </p>

      <h2 className={H2}>Disease management programs — the underrated benefit</h2>
      <p>
        Cigna Close Care, Bupa Global Lifeline, Allianz Care Premier Plus, and Aetna Pioneer/Summit all include formal chronic-disease management programs. These wrap together: scheduled specialist consultations, medication adherence support, lab-monitoring at fixed intervals, lifestyle counselling (often delivered by a dedicated nurse case-manager), and educational content. Co-pay is typically waived on services delivered through the program.
      </p>
      <p>
        AXA, MetLife, Daman, and Sukoon cover chronic conditions but don&apos;t structure them into a named program — your benefit is the standard outpatient cover applied to whichever specialists you choose to see. Functional outcome is similar; experiential difference is significant.
      </p>

      <h2 className={H2}>Pre-existing conditions and waiting periods</h2>
      <p>
        On individual policies (purchased directly, not through an employer), pre-existing conditions are typically covered after a 12-month waiting period. Some premium plans reduce this to 6–9 months. During the waiting period, all chronic-condition treatment is paid out-of-pocket.
      </p>
      <p>
        On group employer plans, the pre-existing waiting period is almost always waived from day one. This is a real advantage of joining a corporate scheme over self-purchasing — coverage starts immediately for any condition you bring in. When you change employers, your new group plan typically also waives pre-existing if you joined within 30 days of leaving the old one.
      </p>

      <h2 className={H2}>Medication coverage: generic vs branded</h2>
      <p>
        Generic chronic medications (metformin for diabetes, lisinopril for hypertension, atorvastatin for cholesterol, levothyroxine for hypothyroidism) cost AED 30–100 per month at retail. Insurance covers 80–100% subject to your outpatient co-pay and any formulary rules. Branded specialty drugs (insulin pumps, biologics for autoimmune conditions, oncology agents, novel cardiovascular drugs) require pre-authorisation and may have separate sub-limits or be covered only on premium tiers.
      </p>
      <p>
        If you&apos;re managing a complex condition with multiple branded medications, check the formulary list before purchasing the policy. Cigna Global, Bupa Global, and Aetna Summit have the broadest formularies; basic and mid-tier plans (AXA Standard, MetLife Silver, Daman Basic) often require generic substitution.
      </p>

      <h2 className={H2}>Best UAE plans for chronic-disease patients</h2>
      <p>
        Three carriers are recognised as best-in-class for chronic-disease management:
      </p>
      <ul>
        <li><strong><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa Global Lifeline Comprehensive</Link></strong>: deepest disease-management program, full medication cover, dedicated nurse case-managers.</li>
        <li><strong><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna Close Care</Link></strong>: structured DM program, broad formulary, fastest claim experience.</li>
        <li><strong><Link href="/insurance/allianz" className="text-[#006828] hover:underline">Allianz Care Premier Plus</Link></strong>: comprehensive DM, geographic flexibility for relocating expats.</li>
      </ul>
      <p>
        For UAE-only domestic cover, AXA Enhanced and Daman&apos;s higher-tier plans cover chronic conditions adequately at significantly lower premiums than the international tier.
      </p>
    </div>
  );
}

function OutpatientInpatientGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>The basic distinction</h2>
      <p>
        UAE health insurance separates &ldquo;outpatient&rdquo; and &ldquo;inpatient&rdquo; cover into distinct benefit pools, with different co-pays, sub-limits, and pre-authorisation requirements. Understanding which category a service falls into determines what you&apos;ll pay.
      </p>
      <p>
        <strong>Outpatient</strong> = treated and discharged the same day. Includes consultations, blood tests, X-rays, ECG, basic ultrasound, prescription medications, minor procedures (skin tag removal, simple cyst drainage). <strong>Inpatient</strong> = admitted to a hospital bed (overnight or longer). Includes hospitalisation for treatment, surgery requiring overnight recovery, ICU admission, and labour/delivery. <strong>Day-case</strong> = surgery requiring no overnight stay (cataract, endoscopy, colonoscopy, hernia repair). Treated as inpatient for benefit purposes.
      </p>

      <h2 className={H2}>Why outpatient has co-pay and inpatient doesn&apos;t</h2>
      <p>
        Inpatient costs are higher per encounter (AED 5,000–500,000+) but more predictable and infrequent. Insurers underwrite at 0% co-pay because the insurer has tight control over inpatient utilisation through pre-authorisation requirements.
      </p>
      <p>
        Outpatient is high-frequency and lower-cost per visit (AED 100–800). Insurers apply a 10–20% co-pay to discourage trivial visits. The co-pay is typically capped at AED 500–1,500 annually — once you hit the cap, all further outpatient is fully covered.
      </p>

      <h2 className={H2}>Outpatient sub-limits and what they really cover</h2>
      <p>
        Standard outpatient cover includes consultations (specialist and GP), basic imaging (X-ray, ultrasound, ECG), routine blood and urine tests, prescription medication, vaccinations, and minor procedures. Most plans cover 100% subject to the co-pay and the overall annual benefit limit.
      </p>
      <p>
        Advanced outpatient services — MRI, CT, PET, advanced cardiac imaging, oncology infusions, dialysis, IVF — typically require pre-authorisation and may have separate sub-limits. Pre-auth means the doctor&apos;s office submits a treatment request to the insurer, who responds within 24–72 hours with an approval code that the clinic uses for direct billing.
      </p>

      <h2 className={H2}>Day-case surgery: outpatient or inpatient?</h2>
      <p>
        Day-case surgery is treated as inpatient for benefit purposes — 0% co-pay, draws on the inpatient sub-limit. Examples: cataract surgery, endoscopy, colonoscopy, simple hernia repair, lump excision, cosmetic-removal procedures. You&apos;re in and out the same day, but the surgery is invoiced under the inpatient benefit.
      </p>
      <p>
        Why this matters: if your plan has a small inpatient sub-limit (AED 100,000) and you have a major day-case (cataract = AED 8,000–15,000), the day-case eats into the same pool that would cover an emergency hospitalisation later in the year.
      </p>

      <h2 className={H2}>Observation status — the awkward category</h2>
      <p>
        &ldquo;Observation&rdquo; is hospital-speak for holding a patient for monitoring without formal admission, typically 4–24 hours. Insurance usually treats observation as outpatient — meaning the co-pay applies. If observation extends beyond 24 hours and converts to formal inpatient admission, the billing flips to inpatient (0% co-pay) but the original observation hours may stay on outpatient invoicing.
      </p>
      <p>
        Be careful: you can be billed at outpatient rates for what feels like a hospital stay. Ask the admission desk whether you&apos;re &ldquo;admitted as inpatient&rdquo; or &ldquo;held for observation&rdquo; — the words matter for your bill.
      </p>
    </div>
  );
}

function ExpatResidentGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>What &ldquo;expat insurance&rdquo; actually means in the UAE</h2>
      <p>
        In UAE healthcare-insurance vernacular, &ldquo;expat insurance&rdquo; usually refers to international plans (Cigna Global, Bupa Global, Allianz Care, Aetna International) where cover follows you across countries. &ldquo;Resident insurance&rdquo; usually means UAE-only plans (Daman, AXA Gulf, MetLife, Sukoon, Orient Insurance) that cover you within the UAE network only.
      </p>
      <p>
        Both categories are valid for UAE visa compliance. The distinction is functional: where you can use the policy, what you pay for it, and how it handles your future location changes.
      </p>

      <h2 className={H2}>Network depth: where each shines</h2>
      <p>
        UAE-resident plans have the deepest UAE networks (1,500–1,800+ direct-billing facilities for AXA, MetLife, Sukoon, Daman). They&apos;re built for the assumption that you treat in the UAE only. International plans have narrower UAE networks (600–900 facilities for Cigna, Bupa, Aetna) — curated to premium hospital tiers — but supplement with global cover.
      </p>
      <p>
        For a Dubai-based knowledge worker who treats only in the UAE, a domestic plan delivers more network depth at lower cost. For a frequently-travelling executive who might need treatment in London, Singapore, or NYC during the policy year, an international plan is worth the premium.
      </p>

      <h2 className={H2}>Cost comparison</h2>
      <p>
        Sample 2026 premium for a single adult age 35, comprehensive UAE cover:
      </p>
      <ul>
        <li>Domestic plan (AXA Enhanced): AED 7,000–12,000/year.</li>
        <li>Domestic plan (MetLife Gold): AED 6,500–11,000/year.</li>
        <li>International plan (Cigna Close Care): AED 12,000–20,000/year.</li>
        <li>International plan (Allianz Care Premier): AED 14,000–22,000/year.</li>
        <li>International plan (Bupa Lifeline Standard): AED 18,000–28,000/year.</li>
      </ul>
      <p>
        For UAE-only use cases, domestic plans deliver 30–50% better value: lower premiums, deeper UAE networks, faster claims (the TPAs are local). The break-even moves toward international cover at roughly 4+ international trips per year requiring medical care, or imminent relocation plans.
      </p>

      <h2 className={H2}>Family additions: how each handles them</h2>
      <p>
        Both expat-international and UAE-resident plans support spouse and dependent additions. Premium pricing differs:
      </p>
      <ul>
        <li>Expat-international family additions: 60–80% of the principal&apos;s premium per dependent.</li>
        <li>UAE-resident family additions: 40–60% per dependent.</li>
      </ul>
      <p>
        Newborn additions usually require notification within 30 days of birth. Some premium plans (Bupa Lifeline, Cigna Global) auto-cover newborns for 60–90 days before requiring formal addition.
      </p>

      <h2 className={H2}>What happens when you leave the UAE</h2>
      <p>
        Domestic UAE plans terminate when your visa is cancelled (or at the next renewal). There&apos;s no continuation option — you&apos;ll need to purchase fresh cover in your destination country.
      </p>
      <p>
        International expat plans (Cigna Global, Bupa Global, Allianz Care) can continue with no break in cover. You notify the insurer of the move; they update the address/billing region; pre-existing conditions accumulated during UAE residency remain covered without re-underwriting on the same policy. This is the structural advantage of an international plan: continuity. For families with chronic conditions or recent medical history, this matters.
      </p>
    </div>
  );
}

function TopUpGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>What top-up actually does</h2>
      <p>
        Top-up health insurance is a supplemental policy that activates after your primary insurance benefit limit is exhausted. If your employer plan caps annual benefits at AED 1M and a major illness (cancer, organ transplant, prolonged ICU) costs AED 1.5M, top-up covers the AED 500K excess. Premiums are low because the top-up only triggers above a threshold most members never reach.
      </p>

      <h2 className={H2}>When top-up is worth buying</h2>
      <p>
        Three common scenarios where top-up makes sense:
      </p>
      <ol>
        <li><strong>Base plan with low cap (under AED 2M)</strong> + family history of high-cost conditions: cancer, heart disease, organ transplant. The math: if your base caps at AED 1M and a year of cancer treatment can cost AED 800K–2M, you&apos;re one diagnosis away from out-of-pocket exposure.</li>
        <li><strong>Freelancer or self-sponsored</strong> with a basic compliance plan: Dubai mandatory plan and Daman Basic cap at AED 150K–250K. Anything serious wipes that out fast. AED 800/year on a top-up adds AED 5M of cover.</li>
        <li><strong>Chronic condition holder</strong>: certain conditions (multiple sclerosis, advanced cancer, end-stage renal disease) routinely consume AED 500K+ in annual treatment. Top-up keeps you out of the gap when the base plan exhausts.</li>
      </ol>
      <p>
        For most UAE residents on a strong employer plan (AED 1M+ cap, broad network), top-up isn&apos;t necessary. The base policy will cover almost any realistic illness profile.
      </p>

      <h2 className={H2}>Cost vs benefit: the math</h2>
      <p>
        Top-up premiums for a single adult in 2026:
      </p>
      <ul>
        <li>AED 500K threshold + AED 1M additional cover: AED 600–1,200/year.</li>
        <li>AED 1M threshold + AED 5M additional cover: AED 1,000–2,000/year.</li>
        <li>AED 2M threshold + AED 10M additional cover: AED 1,500–2,500/year.</li>
      </ul>
      <p>
        Family top-up plans cost AED 2,000–6,000/year. Significantly cheaper than upgrading the base plan to a higher tier — because top-up only triggers above a threshold most members never reach, the actuarial cost is low.
      </p>

      <h2 className={H2}>Carriers offering top-up in the UAE</h2>
      <p>
        Most major UAE carriers offer top-up as a standalone product:
      </p>
      <ul>
        <li><strong>AXA Gulf</strong>: Top-up Plus, available with AED 1M, 2M, 5M additional cover.</li>
        <li><strong>Sukoon (Oman Insurance)</strong>: Top-up at three threshold levels.</li>
        <li><strong>Orient Insurance</strong>: Top-up policy with AED 5M+ additional cover.</li>
        <li><strong>MetLife</strong>: Top-up rider on existing plans.</li>
        <li><strong>Insurance brokers</strong> (Yallacompare, Insurancemarket.ae, Souqalmal): often deliver better top-up pricing than direct-from-insurer purchases by aggregating across carriers.</li>
      </ul>

      <h2 className={H2}>How top-up uses the network</h2>
      <p>
        Top-up policies typically piggyback on whichever in-network claim triggers the policy. So if your base AXA plan covers a hospital and you exhaust the limit, the AXA top-up continues at the same in-network hospital. Top-ups from a different carrier than your base may have a slightly different network — confirm this before purchase. The pre-authorisation rules for the base plan typically continue to apply for top-up coverage as well.
      </p>
    </div>
  );
}

function MandatoryInsuranceGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>Mandatory cover by emirate</h2>
      <p>
        Health insurance is mandatory for every UAE visa holder. The specific requirements vary slightly by emirate, but the underlying principle is the same: no insurance, no visa renewal, no Emirates ID issuance, no trade-licence renewal.
      </p>
      <ul>
        <li><strong>Dubai</strong>: mandatory since 2014, regulated by the UAE healthcare regulator. Any the UAE healthcare regulator-compliant policy meets the requirement. The minimum standard is the Dubai mandatory health insurance plan (EBP).</li>
        <li><strong>Abu Dhabi</strong>: mandatory since 2006, regulated by the UAE healthcare regulator (formerly HAAD). Daman administers the basic scheme on behalf of the UAE healthcare regulator. UAE nationals automatically receive Thiqa free of charge.</li>
        <li><strong>Sharjah, Ajman, RAK, Fujairah, Umm Al Quwain</strong>: progressively adopting under the UAE healthcare regulator. Sharjah enforces strictly; the smaller emirates have ramping enforcement timelines.</li>
      </ul>

      <h2 className={H2}>Who pays?</h2>
      <p>
        For employees, the employer pays. UAE labour law makes employer-provided health insurance one of the mandatory employment benefits — it&apos;s not optional, not negotiable on the employee side, and not deductible from salary.
      </p>
      <p>
        For self-sponsored residents (freelancers, sole-proprietors, dependents on family visas), the principal pays. Family visa holders typically pay for their own and dependents&apos; cover. UAE nationals in Abu Dhabi receive Thiqa from the UAE healthcare regulator at no cost.
      </p>

      <h2 className={H2}>Minimum compliant cover by jurisdiction</h2>
      <p>
        <strong>Dubai Dubai mandatory health insurance plan (EBP)</strong>: AED 150,000 annual cap. Covers inpatient, emergency, outpatient consultations, basic outpatient diagnostics (X-ray, basic blood tests), and prescribed medications. Excludes dental, optical, maternity (or has limited maternity), elective procedures, and cosmetic treatments. Premium: ~AED 600–800/year for a single adult age 18–60.
      </p>
      <p>
        <strong>Abu Dhabi Daman Basic</strong>: AED 250,000 annual cap. Covers inpatient, emergency, outpatient consultations, basic medications. Network restricted to public-sector facilities (SEHA hospitals, government health centres) plus selected private clinics. Premium: ~AED 600–750/year for a single adult.
      </p>
      <p>
        <strong>Northern Emirates the UAE healthcare regulator</strong>: requirements vary by emirate. Sharjah enforces a minimum standard similar to Dubai mandatory plan; Ajman, RAK, Fujairah, UAQ are still rolling out.
      </p>

      <h2 className={H2}>What happens if you don&apos;t have insurance?</h2>
      <p>
        Three concrete consequences:
      </p>
      <ol>
        <li><strong>Visa renewal denied</strong>: until you produce a valid policy. Emirates ID issuance and trade-licence renewal also blocked.</li>
        <li><strong>Fines</strong>: typically AED 500/month in Dubai. Varies in other emirates; Abu Dhabi has historically levied AED 300–500/month equivalents through visa-renewal penalties.</li>
        <li><strong>Treatment refused or expensive</strong>: hospitals can refuse non-emergency treatment if you can&apos;t pay up-front. In emergencies you&apos;ll receive treatment but face the full unsubsidised hospital bill — easily AED 50,000+ for a basic admission, AED 200,000+ for a complex case.</li>
      </ol>

      <h2 className={H2}>Practical compliance tips</h2>
      <p>
        Set a renewal calendar reminder 60 days before your policy expires — gives time to compare alternatives and switch carriers if needed. Keep digital copies of your policy, insurance card, and receipts in cloud storage so you can produce them on demand at hospital reception or visa offices. If you change jobs, confirm the new employer&apos;s health insurance start date matches or precedes the previous policy&apos;s end date — gaps in cover can disqualify you for compliance and trigger pre-existing waiting periods.
      </p>
    </div>
  );
}

function ClaimProcessGuide() {
  return (
    <div className="prose-journal">
      <h2 className={H2}>The two claim paths</h2>
      <p>
        UAE health insurance claims happen through two paths: direct billing (clinic-to-insurer at point of service) and reimbursement (you pay the clinic, then claim the cost back from the insurer). Direct billing is the default for in-network visits. Reimbursement is for out-of-network visits, international care on a UAE-only plan, or when direct billing fails at reception for any reason.
      </p>

      <h2 className={H2}>Direct billing step-by-step</h2>
      <ol>
        <li><strong>At reception</strong>: present your insurance card (digital or physical) and Emirates ID.</li>
        <li><strong>Reception swipes the card</strong> or enters the policy number into the TPA system. The TPA returns instant authorisation: covered amount, your co-pay, any exclusions.</li>
        <li><strong>You pay the co-pay</strong> portion at reception (typically 10–20% of the service cost, capped at AED 50–100 per visit on most plans).</li>
        <li><strong>The clinic delivers treatment</strong> normally.</li>
        <li><strong>Behind the scenes</strong>: clinic submits the full invoice to the TPA within 24–48 hours; TPA reimburses the clinic on a 30–60 day cycle. From your perspective, the transaction ended at step 3.</li>
      </ol>

      <h2 className={H2}>Reimbursement step-by-step</h2>
      <ol>
        <li><strong>Pay the clinic in full</strong> at the time of service. Get an itemised invoice (not a summary receipt).</li>
        <li><strong>Get a doctor&apos;s report</strong> describing the diagnosis, treatment delivered, and clinical necessity.</li>
        <li><strong>Download the claim form</strong> from your insurer&apos;s app or website. Fill in your details and have the treating doctor sign the medical-section.</li>
        <li><strong>Submit via the insurer&apos;s app</strong> (faster than email) with: itemised invoice, prescription if applicable, doctor&apos;s report, lab/imaging results, signed claim form, photos of insurance card and Emirates ID, bank account details for direct deposit.</li>
        <li><strong>Wait 7–21 working days</strong> for settlement. Cigna averages 7 days; most others 10–21.</li>
      </ol>

      <h2 className={H2}>The most common claim rejections</h2>
      <ol>
        <li><strong>Service excluded from policy</strong>: e.g. dental on non-dental plan, fertility treatment on basic plan, cosmetic procedures on any plan. Read your policy schedule.</li>
        <li><strong>Pre-authorisation not obtained</strong>: required for MRI, CT, PET, advanced imaging, elective inpatient procedures, specialty drugs.</li>
        <li><strong>Pre-existing condition within waiting period</strong>: typically 12 months on individual policies. Group plans usually waive this.</li>
        <li><strong>Incomplete documentation</strong>: missing doctor&apos;s report, missing prescription, illegible invoice, unsigned claim form.</li>
        <li><strong>Out-of-network provider</strong> on a network-only policy: the visit is excluded entirely, not just at a higher co-pay.</li>
        <li><strong>Late submission</strong>: most insurers require submission within 60–90 days of treatment date.</li>
      </ol>

      <h2 className={H2}>How to dispute a denied claim</h2>
      <p>
        If your claim is denied:
      </p>
      <ol>
        <li><strong>Read the denial letter</strong> carefully. It cites the specific policy clause used to deny.</li>
        <li><strong>Submit additional supporting documents</strong> within 30 days: a medical letter from the doctor explaining clinical necessity, peer-reviewed treatment guidelines, evidence the service falls within cover. Most disputes are won at this step.</li>
        <li><strong>Escalate via the carrier&apos;s grievance process</strong>: every UAE insurer has a formal grievance channel, usually a specific email or portal accessed through member services.</li>
        <li><strong>File with the UAE Insurance Authority</strong> at iaeqa.gov.ae if grievance fails. Most disputes are resolved at step 2 or 3 within 4–6 weeks.</li>
      </ol>
      <p>
        Keep all correspondence, dates, case numbers, and document submission timestamps. Insurance Authority complaints are evaluated against the documented record.
      </p>

      <h2 className={H2}>Claim timelines by carrier (2026 averages)</h2>
      <p>
        Working-day averages from claim submission to reimbursement:
      </p>
      <ul>
        <li><Link href="/insurance/cigna" className="text-[#006828] hover:underline">Cigna Close Care</Link>: 7 days.</li>
        <li><Link href="/insurance/bupa" className="text-[#006828] hover:underline">Bupa Global</Link>: 7–10 days.</li>
        <li><Link href="/insurance/aetna" className="text-[#006828] hover:underline">Aetna International</Link>: 10–14 days.</li>
        <li><Link href="/insurance/axa" className="text-[#006828] hover:underline">AXA Gulf</Link>: 10–14 days.</li>
        <li><Link href="/insurance/metlife" className="text-[#006828] hover:underline">MetLife</Link>: 10–15 days.</li>
        <li><Link href="/insurance/allianz" className="text-[#006828] hover:underline">Allianz Care</Link>: 15–21 days.</li>
      </ul>
    </div>
  );
}

/* ─── Map slug to content component ─── */

const GUIDE_CONTENT: Record<string, () => JSX.Element> = {
  "freelancer-health-insurance": FreelancerGuide,
  "maternity-insurance-uae": MaternityGuide,
  "how-to-claim-health-insurance": ClaimsGuide,
  "domestic-worker-insurance": DomesticWorkerGuide,
  "switching-health-insurance": SwitchingGuide,
  // Phase 3 listicles (added 2026-05-02)
  "walk-in-clinic-insurance": WalkInClinicGuide,
  "direct-billing-insurance-uae": DirectBillingGuide,
  "same-day-claims-insurance": SameDayClaimsGuide,
  "dental-insurance-uae-2026": DentalInsuranceGuide,
  "chronic-disease-coverage-uae": ChronicDiseaseGuide,
  "outpatient-vs-inpatient-uae": OutpatientInpatientGuide,
  "expat-vs-resident-insurance": ExpatResidentGuide,
  "top-up-insurance-uae": TopUpGuide,
  "mandatory-health-insurance-emirates": MandatoryInsuranceGuide,
  "insurance-claim-process-uae": ClaimProcessGuide,
};

/* ─── Page ─── */

export default async function InsuranceGuidePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const guide = GUIDES.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  const GuideContent = GUIDE_CONTENT[guide.slug];
  if (!GuideContent) notFound();

  const base = getBaseUrl();

  // Article JSON-LD
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/favicon.png`,
      },
    },
    mainEntityOfPage: `${base}/insurance/guide/${guide.slug}`,
  };

  return (
    <>
      {/* JSON-LD: BreadcrumbList */}
      <JsonLd data={breadcrumbSchema([
        { name: "UAE", url: base },
        { name: "Insurance", url: `${base}/insurance` },
        { name: "Guides", url: `${base}/insurance/guide` },
        { name: guide.title },
      ])} />

      {/* JSON-LD: FAQPage */}
      <JsonLd data={faqPageSchema(guide.faqs)} />

      {/* JSON-LD: Article */}
      <JsonLd data={articleSchema} />

      {/* JSON-LD: SpeakableSpecification */}
      <JsonLd data={speakableSchema([".answer-block"])} />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "UAE", href: "/" },
          { label: "Insurance", href: "/insurance" },
          { label: "Guides", href: "/insurance/guide" },
          { label: guide.title },
        ]} />

        <div className="max-w-3xl">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">{guide.title}</h1>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-6">
            Published {guide.datePublished} · Updated {guide.dateModified}
          </p>

          {/* Answer block */}
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed text-lg">
              {guide.metaDescription}
            </p>
          </div>

          {/* Guide content */}
          <GuideContent />

          {/* Last updated note */}
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-8">
            Last updated March 2026. This guide is for informational purposes and does not constitute insurance advice. Always confirm details with your insurer and the relevant health authority.
          </p>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-black/[0.06] flex flex-wrap gap-4">
            <Link
              href="/insurance/guide"
              className="text-sm font-medium text-[#006828] hover:underline"
            >
              &larr; All Insurance Guides
            </Link>
            <Link
              href="/insurance"
              className="text-sm font-medium text-[#006828] hover:underline"
            >
              Insurance Navigator &rarr;
            </Link>
          </div>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl">
          <FaqSection faqs={guide.faqs} title={`${guide.title} — FAQ`} />
        </div>
      </div>
    </>
  );
}
