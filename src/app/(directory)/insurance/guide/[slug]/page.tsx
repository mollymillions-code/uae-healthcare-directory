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
      "Complete guide to health insurance for freelancers and self-sponsored residents in the UAE. DHA and DOH requirements, cheapest compliant plans, and how to apply.",
    datePublished: "2026-01-15",
    dateModified: "2026-03-25",
    faqs: [
      {
        question: "Do freelancers need health insurance in the UAE?",
        answer:
          "Yes. Health insurance is mandatory for all visa holders in Dubai and Abu Dhabi, including freelancers and self-sponsored residents. In Dubai, you must have a DHA-compliant plan. In Abu Dhabi, you need a DOH-compliant plan. Failure to maintain coverage can result in visa renewal rejection and fines.",
      },
      {
        question: "What is the cheapest health insurance for freelancers in UAE?",
        answer:
          "The cheapest DHA-compliant plans in Dubai start from approximately AED 2,200–2,800 per year for an individual. In Abu Dhabi, Daman Basic plans start from around AED 600–750 per year. These basic plans cover inpatient, outpatient, and emergency care but typically exclude dental, optical, and maternity.",
      },
      {
        question: "Can I buy health insurance individually in the UAE?",
        answer:
          "Yes. If you are self-sponsored, a freelancer, or your employer does not provide coverage, you can purchase an individual plan directly from insurers like Daman, AXA, Cigna, MetLife, or Orient Insurance. Many brokers also offer online comparison and purchase.",
      },
      {
        question: "What happens if a freelancer has no health insurance in Dubai?",
        answer:
          "In Dubai, not having health insurance can lead to fines when renewing your visa or Emirates ID. The DHA may flag your application, and you will need to purchase a compliant plan before proceeding. Medical costs without insurance can be extremely expensive.",
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
          "First, contact your insurer to understand the reason for rejection. Common reasons include missing documents, treatment not in your coverage, or lapsed policy. You can submit additional documentation and request a review. If the dispute is not resolved, you can escalate to DHA (Dubai), DOH (Abu Dhabi), or MOHAP (Northern Emirates) complaints department.",
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
          "Basic DHA-compliant plans for domestic workers in Dubai start from approximately AED 750–1,200 per year. These plans cover essential inpatient, outpatient, and emergency care. Daman also offers specific domestic worker plans in Abu Dhabi starting from around AED 600 per year.",
      },
      {
        question: "What happens if I don't insure my domestic worker?",
        answer:
          "Employers who fail to provide health insurance for domestic workers face penalties including fines, inability to renew the worker's visa, and potential labour complaints. In Dubai, the DHA can block visa-related transactions until compliant insurance is in place.",
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
          "Under DHA and DOH regulations, if you switch from one compliant plan to another without a gap in coverage, the new insurer must cover pre-existing conditions that were covered under your previous plan. This is called continuity of coverage. However, if there is a gap in coverage, waiting periods for pre-existing conditions may be re-imposed.",
      },
      {
        question: "When is the best time to switch insurance in the UAE?",
        answer:
          "The best time to switch is at your policy renewal date. Most individual plans are annual. Give yourself 2–4 weeks before renewal to compare plans, apply with a new insurer, and ensure there is no coverage gap. Avoid switching mid-policy unless your circumstances change significantly.",
      },
      {
        question: "Can my employer switch my health insurance without my consent?",
        answer:
          "Yes. Employers can change insurance providers at renewal as long as the new plan meets the minimum regulatory requirements (DHA Essential Benefits Plan in Dubai, DOH requirements in Abu Dhabi). You should receive advance notice and details of the new plan.",
      },
    ],
  },
];

/* ─── Static params ─── */

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

/* ─── Metadata ─── */

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = GUIDES.find((g) => g.slug === params.slug);
  if (!guide) return {};
  const base = getBaseUrl();

  return {
    title: `${guide.title} | Zavis`,
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
        If you hold a freelance permit, are self-sponsored on a family visa, or run a sole establishment in the UAE, you are responsible for arranging your own health insurance. Unlike employees whose employers must provide coverage, freelancers and self-sponsored residents must purchase and maintain a compliant plan independently. This applies whether you are in Dubai (DHA-regulated), Abu Dhabi (DOH-regulated), or the Northern Emirates (MOHAP-regulated).
      </p>
      <p>
        Since 2014, Dubai has required every visa holder to have health insurance. Abu Dhabi has had a similar mandate since 2006. The Northern Emirates are progressively adopting mandatory requirements under MOHAP. Without valid insurance, you may face difficulties renewing your visa, Emirates ID, or trade licence.
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
        In Dubai, the cheapest DHA-compliant plans start from approximately AED 2,200-2,800 per year for a single adult. These basic plans meet the Essential Benefits Plan (EBP) requirements, covering inpatient hospitalisation, outpatient consultations, emergency care, and prescribed medications. They typically exclude dental, optical, and maternity coverage.
      </p>
      <p>
        In Abu Dhabi, Daman Basic plans start from approximately AED 600-750 per year and meet DOH minimum requirements. These are the most affordable option for Abu Dhabi visa holders. For better coverage — including wider hospital networks, lower co-payments, and dental or maternity add-ons — expect premiums of AED 4,000-8,000 per year.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">DHA and DOH Requirements</h2>
      <p>
        In Dubai, the DHA Essential Benefits Plan (EBP) sets minimum standards that all health insurance plans must meet. This includes coverage for inpatient, outpatient, emergency, maternity (with waiting period), and prescribed medication. The annual premium cap for the most basic plan is set by DHA and reviewed periodically.
      </p>
      <p>
        In Abu Dhabi, the DOH (formerly HAAD) mandates a basic benefit package through its partnership with Daman. The Abu Dhabi scheme covers both UAE nationals (through Thiqa) and expatriates (through Daman Basic and enhanced plans). Freelancers in Abu Dhabi should ensure their plan is DOH-registered, as non-compliant plans will not be accepted for visa processing.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Tips for Freelancers</h2>
      <ul>
        <li>Always check that the plan is regulatory-compliant (DHA in Dubai, DOH in Abu Dhabi) before purchasing.</li>
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
        Maternity benefits are included in most DHA and DOH compliant health insurance plans in the UAE, but almost always subject to a waiting period. Understanding these waiting periods, coverage limits, and exclusions is critical before you plan a pregnancy — ideally, you should have your insurance in place at least 12 months before your expected delivery date.
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
        <li><strong>DHA Essential Benefits Plan</strong>: 12 months standard waiting period.</li>
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
        Under UAE insurance regulations (DHA and DOH), insurers are required to acknowledge receipt of a claim within 5 working days and settle or deny the claim within 30 days of receiving complete documentation. In practice, straightforward claims with complete documentation are often processed in 7-15 working days. Complex claims involving pre-authorisation, high-value procedures, or investigation may take the full 30 days.
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
        <li><strong>Escalate to the regulator</strong> if the insurer does not resolve the dispute. In Dubai, file a complaint with DHA. In Abu Dhabi, contact DOH. In the Northern Emirates, contact MOHAP. Each authority has a dedicated complaints portal.</li>
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
        In the UAE, employers (sponsors) of domestic workers are legally obligated to provide health insurance coverage. This requirement applies to all domestic workers including housemaids, nannies, private drivers, cooks, and gardeners. The mandate is enforced in Dubai by the DHA and in Abu Dhabi by the DOH. Failure to provide coverage can result in visa rejection, fines, and labour complaints.
      </p>
      <p>
        The requirement became more strictly enforced following the UAE Domestic Workers Law (Federal Law No. 10 of 2017), which established a comprehensive framework of rights for domestic workers including the right to healthcare. Insurance is now a prerequisite for issuing and renewing domestic worker visas in Dubai and Abu Dhabi.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Minimum Coverage Requirements</h2>
      <p>
        The minimum coverage for domestic workers mirrors the basic requirements for all visa holders. In Dubai, the plan must be DHA Essential Benefits Plan (EBP) compliant, covering inpatient hospitalisation, outpatient consultations, emergency care, prescribed medications, and basic diagnostics. In Abu Dhabi, the plan must meet DOH minimum standards as administered through Daman.
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
        Employers can purchase these plans online through insurer websites or through licensed brokers. Common providers offering domestic worker plans include Daman, <Link href="/insurance/orient" className="text-[#006828] hover:underline">Orient Insurance</Link>, <Link href="/insurance/oman-insurance" className="text-[#006828] hover:underline">Oman Insurance</Link>, and <Link href="/insurance/dubai-insurance-company" className="text-[#006828] hover:underline">Dubai Insurance Company</Link>. Comparison portals can help identify the cheapest option with an adequate network in your area.
      </p>

      <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Penalties for Non-Compliance</h2>
      <p>
        Employers who fail to insure their domestic workers face several consequences:
      </p>
      <ul>
        <li><strong>Visa rejection</strong>: Immigration authorities will not issue or renew a domestic worker&apos;s visa without proof of valid health insurance.</li>
        <li><strong>Fines</strong>: DHA and DOH can impose monetary penalties on employers found in violation. Fine amounts are reviewed periodically and can increase for repeat offenders.</li>
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
        This is the most critical concern when switching. Under DHA and DOH regulations, if you maintain continuous health insurance coverage in the UAE (no gap between your old and new policy), the new insurer <strong>must</strong> cover pre-existing conditions that were covered under your previous plan. This is known as the continuity of coverage rule and protects residents from losing coverage for ongoing conditions when they switch providers.
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
        The DHA and DOH require insurers to honour the following when coverage is continuous:
      </p>
      <ul>
        <li>No new waiting periods for conditions already covered under the previous plan.</li>
        <li>No exclusion of pre-existing conditions that were disclosed and covered.</li>
        <li>Maternity waiting periods carry over — if you have served 8 months of a 12-month waiting period, the new insurer must count those 8 months.</li>
        <li>Lifetime and annual limits reset with the new policy period but do not go backwards.</li>
      </ul>
      <p>
        These protections apply as long as the switch is between two DHA-compliant plans (in Dubai) or two DOH-compliant plans (in Abu Dhabi). Switching from a non-compliant or international-only plan may not carry the same protections.
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

/* ─── Map slug to content component ─── */

const GUIDE_CONTENT: Record<string, () => JSX.Element> = {
  "freelancer-health-insurance": FreelancerGuide,
  "maternity-insurance-uae": MaternityGuide,
  "how-to-claim-health-insurance": ClaimsGuide,
  "domestic-worker-insurance": DomesticWorkerGuide,
  "switching-health-insurance": SwitchingGuide,
};

/* ─── Page ─── */

export default function InsuranceGuidePage({ params }: { params: { slug: string } }) {
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
        url: `${base}/logo.png`,
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
