import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo";
import {
  PROFESSIONAL_STATS,
  PHYSICIAN_SPECIALTIES,
  DENTIST_SPECIALTIES,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/constants/professionals";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
export const dynamicParams = true;

// ─── Guide Definitions ──────────────────────────────────────────────────────

interface GuideDefinition {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  publishedDate: string;
  faqs: { question: string; answer: string }[];
}

const GUIDES: GuideDefinition[] = [
  {
    slug: "specialist-vs-consultant",
    title: "Specialist vs Consultant in Dubai: What\u2019s the Difference?",
    subtitle: "Understanding the DHA\u2019s two senior clinical grades and what they mean for your care",
    description: "Learn the difference between a Specialist and Consultant in Dubai's healthcare system. Understand DHA licensing grades, experience requirements, and how to choose the right doctor for your needs.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "What is the difference between a Specialist and a Consultant in Dubai?", answer: `In Dubai's DHA system, a Specialist is a physician who has completed specialty training and holds a recognized qualification. A Consultant is the senior grade, requiring 8+ years of post-specialty experience and the ability to supervise specialists and lead departments. Of Dubai's ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, the majority are specialists, with consultants making up a smaller but highly experienced senior tier.` },
      { question: "Does a Consultant cost more than a Specialist in Dubai?", answer: "Generally yes. Consultant appointments typically cost 20-50% more than specialist consultations at the same facility. However, pricing varies by facility, insurance coverage, and the complexity of your condition. Many insurance plans cover both grades without additional out-of-pocket costs." },
      { question: "Can a Specialist perform surgery in Dubai?", answer: "Yes, specialists in surgical disciplines (e.g., orthopedic surgery, general surgery, plastic surgery) are fully qualified to perform surgeries independently. The specialist grade confirms they have completed the required surgical training. Consultants may handle more complex or high-risk procedures." },
      { question: "How do I verify if a doctor is a Specialist or Consultant?", answer: "You can verify any healthcare professional's grade through the DHA Sheryan portal (sheryan.dha.gov.ae). Search by name or license number to see their exact registration grade, specialty, and facility affiliation. The Zavis Professional Directory also displays this information for all 99,520 DHA-licensed professionals." },
      { question: "Should I always choose a Consultant over a Specialist?", answer: "Not necessarily. For routine specialty care, a specialist is fully qualified and often more accessible. Consultants are recommended for complex cases, second opinions, cases requiring multidisciplinary coordination, or when you want the most experienced physician available. Both grades are independently licensed to practice." },
    ],
  },
  {
    slug: "dha-licensing",
    title: "How DHA Medical Licensing Works in Dubai",
    subtitle: "A complete guide to the Dubai Health Authority\u2019s professional licensing framework",
    description: "Understand how medical licensing works in Dubai under the Dubai Health Authority. Learn about license types, eligibility requirements, the application process, and how DHA regulates healthcare professionals.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "What is DHA licensing?", answer: `DHA (Dubai Health Authority) licensing is the mandatory credentialing process for all healthcare professionals practicing in Dubai. Every physician, dentist, nurse, pharmacist, and allied health worker must hold a valid DHA license. Currently, ${PROFESSIONAL_STATS.total.toLocaleString()} professionals are licensed across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities.` },
      { question: "How long does it take to get a DHA license?", answer: "The DHA licensing process typically takes 4-8 weeks for straightforward applications. This includes document verification, dataflow primary source verification (PSV), and the DHA professional exam if required. Complex cases or applications requiring additional verification may take longer." },
      { question: "What is the difference between DHA, DOH, and MOHAP licenses?", answer: "DHA licenses are for Dubai, DOH (Department of Health) licenses are for Abu Dhabi, and MOHAP (Ministry of Health and Prevention) licenses cover the other five emirates. Each authority has its own licensing process, though there are mutual recognition agreements for certain qualifications." },
      { question: "Can a doctor with a DHA license practice in Abu Dhabi?", answer: "Not directly. A DHA license is valid only within Dubai's jurisdiction. To practice in Abu Dhabi, a separate DOH license is required. However, the UAE has been working on licensing portability, and some reciprocal arrangements exist for visiting consultants." },
      { question: "How do I check if a doctor is DHA-licensed?", answer: "Visit the DHA Sheryan portal (sheryan.dha.gov.ae) and search by name or license number. The Zavis Professional Directory also provides searchable access to all DHA-licensed professionals with their specialty, grade, and facility details." },
    ],
  },
  {
    slug: "ftl-vs-reg",
    title: "FTL vs REG License: What\u2019s the Difference?",
    subtitle: "Understanding full-time and registered license types in Dubai\u2019s healthcare system",
    description: "Learn the difference between FTL (Full-Time License) and REG (Registered) license types in Dubai's DHA system. Understand what each means for healthcare professionals and patients.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "What does FTL mean in DHA licensing?", answer: "FTL stands for Full-Time License. It is issued to healthcare professionals who are employed full-time at a specific facility in Dubai. FTL holders work exclusively at their designated facility and are the backbone of Dubai's healthcare workforce." },
      { question: "What does REG mean in DHA licensing?", answer: "REG stands for Registered license. It covers professionals who may work part-time, on a visiting basis, or across multiple facilities. REG license holders are often senior consultants who split time between facilities or international practitioners who visit Dubai periodically." },
      { question: "Is an FTL doctor better than a REG doctor?", answer: "No. The license type (FTL vs REG) indicates the employment arrangement, not clinical competence. A REG-licensed consultant may be a highly sought-after specialist who works across multiple hospitals. Both FTL and REG holders must meet the same DHA credentialing standards." },
      { question: "Can a REG-licensed doctor perform surgery?", answer: "Yes, if they hold the appropriate specialty qualification and their facility privileges include surgical procedures. The FTL/REG distinction relates to employment terms, not scope of practice. A surgeon with a REG license has the same clinical authority as one with an FTL license." },
      { question: "How many FTL vs REG professionals are in Dubai?", answer: `The Zavis Professional Directory tracks ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. The split between FTL and REG varies by specialty, but full-time licenses are more common overall, reflecting the large resident healthcare workforce in Dubai.` },
    ],
  },
  {
    slug: "how-to-verify-doctor",
    title: "How to Verify a Doctor\u2019s License in Dubai",
    subtitle: "Step-by-step guide to checking DHA credentials before your appointment",
    description: "Learn how to verify a doctor's license in Dubai using the DHA Sheryan portal. Step-by-step guide to checking credentials, specialty, and facility affiliation for any healthcare professional.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "How do I verify a doctor's license in Dubai?", answer: "Visit the DHA Sheryan portal at sheryan.dha.gov.ae, click 'Search Healthcare Professional', and enter the doctor's name or license number. The system will show their license status, specialty, grade (Specialist/Consultant), license type (FTL/REG), and facility. You can also use the Zavis Professional Directory for a searchable interface." },
      { question: "Is the DHA Sheryan portal free to use?", answer: "Yes, the DHA Sheryan portal is completely free and open to the public. Anyone can search for and verify healthcare professionals without creating an account. The portal covers all licensed professionals in Dubai." },
      { question: "What should I check when verifying a doctor?", answer: "Verify: (1) License status is active, (2) Specialty matches what they claim, (3) Grade matches (Specialist vs Consultant), (4) They are affiliated with the facility where you plan to visit them, and (5) The license hasn't expired. If any of these don't match, contact the facility or DHA directly." },
      { question: "Can I verify doctors from Abu Dhabi or other emirates?", answer: "DHA Sheryan only covers Dubai. For Abu Dhabi, use the DOH portal (doh.gov.ae). For other emirates, check the MOHAP portal (mohap.gov.ae). Each health authority maintains its own registry of licensed professionals." },
      { question: "How often is the DHA registry updated?", answer: `The DHA Sheryan registry is updated in real-time as licenses are issued, renewed, or revoked. The Zavis Professional Directory, which mirrors ${PROFESSIONAL_STATS.total.toLocaleString()} records from the DHA registry, is updated periodically to reflect the latest data.` },
    ],
  },
  {
    slug: "choosing-right-specialist",
    title: "How to Choose the Right Medical Specialist in Dubai",
    subtitle: "Practical advice for navigating Dubai\u2019s medical specialist landscape",
    description: "A practical guide to choosing the right medical specialist in Dubai. Learn how to evaluate credentials, compare specialists vs consultants, and find the best doctor for your condition.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "How do I choose a specialist in Dubai?", answer: `Start by getting a referral from your GP or checking your insurance network. Then verify the specialist's credentials on DHA Sheryan. Consider their grade (Specialist vs Consultant), facility reputation, and whether they speak your language. Dubai has ${PROFESSIONAL_STATS.physicians.toLocaleString()} licensed physicians across ${PHYSICIAN_SPECIALTIES.length} specialties, so there are many options.` },
      { question: "Should I see a GP first or go directly to a specialist?", answer: "For most conditions, seeing a GP first is recommended. GPs can assess whether you need specialist care and refer you to the right specialty. Many insurance plans also require a GP referral for specialist coverage. However, for clear specialty needs (e.g., pregnancy, skin conditions), direct specialist visits are common in Dubai." },
      { question: "Does it matter which hospital the specialist works at?", answer: "Yes, the facility matters. Larger hospitals often have better equipment, support staff, and multidisciplinary teams. However, a specialist at a smaller clinic may offer more personalized care and shorter wait times. Consider the facility's reputation in the specific specialty you need." },
      { question: "How do I know if a specialist is covered by my insurance?", answer: "Contact your insurance provider or check their online portal for the list of network providers. Most major insurers in Dubai maintain updated directories. You can also call the specialist's facility to confirm they accept your insurance plan before booking." },
      { question: "What questions should I ask a specialist at my first visit?", answer: "Ask about: (1) Their experience with your specific condition, (2) Treatment options and success rates, (3) Expected timeline and costs, (4) Whether they coordinate with other specialists if needed, and (5) What follow-up care looks like. A good specialist will welcome these questions." },
    ],
  },
  {
    slug: "healthcare-workforce",
    title: "Dubai\u2019s Healthcare Workforce: Key Statistics 2026",
    subtitle: "Data-driven analysis of who provides healthcare in Dubai",
    description: `Dubai has ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. Explore the key workforce statistics, specialty distribution, and trends shaping healthcare delivery in Dubai.`,
    publishedDate: "2026-04-03",
    faqs: [
      { question: "How many healthcare professionals are in Dubai?", answer: `As of ${PROFESSIONAL_STATS.scraped}, there are ${PROFESSIONAL_STATS.total.toLocaleString()} licensed healthcare professionals in Dubai, registered through the DHA Sheryan system. This includes ${PROFESSIONAL_STATS.physicians.toLocaleString()} physicians, ${PROFESSIONAL_STATS.dentists.toLocaleString()} dentists, ${PROFESSIONAL_STATS.nurses.toLocaleString()} nurses and midwives, and ${PROFESSIONAL_STATS.alliedHealth.toLocaleString()} allied health professionals.` },
      { question: "What is the largest healthcare facility in Dubai?", answer: `By staff count, the largest healthcare facilities in Dubai are ${PROFESSIONAL_STATS.topFacilities.slice(0, 3).map((f) => `${f.name} (${f.staff.toLocaleString()} staff)`).join(", ")}. These government and private hospitals employ thousands of professionals across all specialties.` },
      { question: "What are the most common medical specialties in Dubai?", answer: `The most common physician specialty in Dubai is General Practitioner with ${PHYSICIAN_SPECIALTIES[0].count.toLocaleString()} professionals, followed by Obstetrics & Gynecology (${PHYSICIAN_SPECIALTIES[1].count.toLocaleString()}), Pediatrics (${PHYSICIAN_SPECIALTIES[2].count.toLocaleString()}), and Family Medicine (${PHYSICIAN_SPECIALTIES[3].count.toLocaleString()}). Among dentists, General Dentistry leads with ${DENTIST_SPECIALTIES[0].count.toLocaleString()} practitioners.` },
      { question: "How many hospitals are in Dubai?", answer: `Dubai has ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} licensed healthcare facilities of all types, including hospitals, clinics, medical centers, dental practices, pharmacies, and diagnostic labs. The largest hospitals have over 1,000 staff members.` },
      { question: "Is Dubai's healthcare workforce growing?", answer: "Yes. Dubai's healthcare workforce has grown significantly over the past decade, driven by population growth, medical tourism, and government investment in healthcare infrastructure. The Dubai Health Authority continues to license new facilities and professionals each year." },
    ],
  },
  {
    slug: "medical-specialties-explained",
    title: "Medical Specialties in Dubai: Complete Guide",
    subtitle: "An overview of every major medical and dental specialty available in Dubai",
    description: `Dubai offers ${PHYSICIAN_SPECIALTIES.length} physician specialties and ${DENTIST_SPECIALTIES.length} dental specialties. Explore each specialty, what conditions they treat, and how many licensed professionals practice in Dubai.`,
    publishedDate: "2026-04-03",
    faqs: [
      { question: "How many medical specialties are available in Dubai?", answer: `Dubai has ${PHYSICIAN_SPECIALTIES.length} recognized physician specialties and ${DENTIST_SPECIALTIES.length} dental specialties licensed by the DHA. This covers everything from general practice and family medicine to highly specialized fields like interventional cardiology, neurosurgery, and reproductive medicine.` },
      { question: "What is the difference between a GP and a specialist?", answer: `A General Practitioner (GP) provides primary care and treats a wide range of conditions. A specialist has completed additional years of training in a specific area of medicine. Dubai has ${PHYSICIAN_SPECIALTIES[0].count.toLocaleString()} GPs and thousands more specialists across ${PHYSICIAN_SPECIALTIES.length - 1} other disciplines.` },
      { question: "Which specialty should I see for back pain?", answer: "For back pain, start with your GP or an Orthopedic Surgeon. Depending on the cause, you may be referred to a Neurosurgeon (for disc or nerve issues), a Physical Medicine & Rehabilitation specialist (for conservative management), or a Rheumatologist (for inflammatory conditions). Pain management clinics also treat chronic back pain." },
      { question: "What is the rarest medical specialty in Dubai?", answer: `Among physician specialties, the less common specialties include Reproductive Medicine & IVF (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "reproductive-medicine")?.count || 53} professionals), Physical Medicine & Rehabilitation (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "physical-rehabilitation")?.count || 53}), and Pediatric Surgery (${PHYSICIAN_SPECIALTIES.find((s) => s.slug === "pediatric-surgery")?.count || 61}). These niche specialties have fewer practitioners but serve critical roles.` },
      { question: "Can I see a specialist without a referral in Dubai?", answer: "In most cases, yes. Dubai allows direct access to specialists without a GP referral. However, some insurance plans require a referral for coverage, and seeing a GP first helps ensure you're directed to the right specialty. For clear-cut needs (e.g., pregnancy, eye problems, dental issues), going directly to a specialist is common." },
    ],
  },
  {
    slug: "international-doctors-dubai",
    title: "International Doctors in Dubai: What You Need to Know",
    subtitle: "How Dubai\u2019s international medical workforce serves a diverse population",
    description: "Dubai's healthcare workforce is one of the most internationally diverse in the world. Learn about where Dubai's doctors come from, how international qualifications are recognized, and what this means for patients.",
    publishedDate: "2026-04-03",
    faqs: [
      { question: "Are international doctors qualified to practice in Dubai?", answer: "Yes. All international doctors practicing in Dubai must pass the DHA licensing process, which includes primary source verification of their qualifications, professional exams (in some cases), and clinical assessment. Only doctors who meet DHA's standards receive a license, regardless of their country of training." },
      { question: "What countries do most doctors in Dubai come from?", answer: "Dubai's medical workforce is drawn from over 100 countries. The largest groups include physicians trained in India, Pakistan, the Philippines, Egypt, the UK, Ireland, Syria, Jordan, and other Arab countries. Many have also completed further training in the US, UK, Canada, or Australia." },
      { question: "Do international doctors in Dubai speak English?", answer: "Yes, English is the primary language of medical practice in Dubai. All DHA-licensed professionals must demonstrate English proficiency. Many also speak Arabic, Hindi, Urdu, Tagalog, or other languages, reflecting the diverse patient population." },
      { question: "How does DHA verify international medical qualifications?", answer: "DHA uses DataFlow Group for Primary Source Verification (PSV), which independently verifies every qualification, training certificate, and professional reference directly with the issuing institution. This process typically takes 2-4 weeks and is one of the most rigorous verification systems in the world." },
      { question: "Can I find a doctor who trained in my home country?", answer: `While the Zavis Professional Directory lists all ${PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed professionals with their facility and specialty, specific training backgrounds are listed on the DHA Sheryan portal. Many expat communities also maintain informal directories and recommendations for doctors from specific countries.` },
    ],
  },
];

function getGuideBySlug(slug: string): GuideDefinition | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return {};

  const base = getBaseUrl();
  return {
    title: `${guide.title} | Zavis`,
    description: guide.description,
    alternates: {
      canonical: `${base}/professionals/guide/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${base}/professionals/guide/${guide.slug}`,
      type: "article",
      siteName: "UAE Open Healthcare Directory",
      publishedTime: guide.publishedDate,
    },
  };
}

// ─── Content Renderer ───────────────────────────────────────────────────────

function GuideContent({ guide }: { guide: GuideDefinition }) {
  switch (guide.slug) {
    case "specialist-vs-consultant":
      return <SpecialistVsConsultantContent />;
    case "dha-licensing":
      return <DhaLicensingContent />;
    case "ftl-vs-reg":
      return <FtlVsRegContent />;
    case "how-to-verify-doctor":
      return <HowToVerifyContent />;
    case "choosing-right-specialist":
      return <ChoosingSpecialistContent />;
    case "healthcare-workforce":
      return <HealthcareWorkforceContent />;
    case "medical-specialties-explained":
      return <MedicalSpecialtiesContent />;
    case "international-doctors-dubai":
      return <InternationalDoctorsContent />;
    default:
      return null;
  }
}

// ─── Section Component ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="border-b-2 border-[#1c1c1c] pb-3 mb-4">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          {title}
        </h2>
      </div>
      <div className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

// ─── Guide 1: Specialist vs Consultant ──────────────────────────────────────

function SpecialistVsConsultantContent() {
  return (
    <>
      <Section title="The Two Senior Clinical Grades in Dubai">
        <p>
          Dubai&apos;s healthcare system, regulated by the Dubai Health Authority (DHA), uses a
          structured grading system for physicians and dentists. The two most commonly
          encountered senior grades are <strong>Specialist</strong> and{" "}
          <strong>Consultant</strong>. Understanding the difference helps patients make
          informed choices about their care.
        </p>
        <p>
          Out of Dubai&apos;s {PROFESSIONAL_STATS.physicians.toLocaleString()} licensed
          physicians, the majority fall into one of these two grades. The system mirrors the
          UK/Gulf medical hierarchy, where clinical experience and qualifications determine
          a practitioner&apos;s grade.
        </p>
      </Section>

      <Section title="What Is a Specialist?">
        <p>
          A <strong>Specialist</strong> is a physician or dentist who has completed advanced
          postgraduate training in a specific medical discipline. To earn the Specialist grade,
          a doctor must hold a recognized specialty qualification, such as a board certification,
          fellowship, or equivalent credential from an accredited institution.
        </p>
        <p>
          Specialists are independently qualified to diagnose and treat conditions within their
          field. They form the core clinical workforce at most hospitals and specialty clinics in
          Dubai. Common specialist titles include Specialist Dermatology, Specialist Pediatrics,
          and Specialist Orthopedic Surgery.
        </p>
        <div className="bg-[#f8f8f6] p-4 mt-3">
          <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-2">
            Specialist Requirements
          </p>
          <ul className="list-disc list-inside text-sm text-black/60 space-y-1">
            <li>Medical degree (MBBS, MD, or equivalent)</li>
            <li>Completed specialty training program (typically 4-6 years)</li>
            <li>Recognized postgraduate qualification (board certification, MRCP, FRCS, etc.)</li>
            <li>DHA licensing exam (if required for their qualification pathway)</li>
          </ul>
        </div>
      </Section>

      <Section title="What Is a Consultant?">
        <p>
          A <strong>Consultant</strong> is the most senior clinical grade in the DHA system. It
          requires a minimum of 8 years of clinical experience after obtaining the specialist
          qualification, plus demonstrated expertise and leadership in the field.
        </p>
        <p>
          Consultants serve as the highest clinical authority in their specialty. They supervise
          specialists, lead departments, oversee complex cases, and are typically involved in
          training and research. The title carries significant weight in Gulf healthcare systems.
        </p>
        <div className="bg-[#f8f8f6] p-4 mt-3">
          <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-2">
            Consultant Requirements
          </p>
          <ul className="list-disc list-inside text-sm text-black/60 space-y-1">
            <li>All Specialist requirements, plus:</li>
            <li>Minimum 8 years post-specialty clinical experience</li>
            <li>Demonstrated leadership and supervisory capability</li>
            <li>Often involved in clinical research or education</li>
            <li>DHA review of full career portfolio</li>
          </ul>
        </div>
      </Section>

      <Section title="When to Choose a Specialist vs a Consultant">
        <p>
          For routine specialty care, check-ups, and straightforward conditions, a Specialist
          is fully qualified and often more readily available. Specialists tend to have shorter
          wait times and may be more cost-effective.
        </p>
        <p>
          Consider a Consultant when dealing with complex or rare conditions, when seeking a
          second opinion, when multidisciplinary coordination is needed, or when the case
          requires a surgeon with the most extensive experience. Consultants are also preferred
          for high-risk procedures.
        </p>
      </Section>

      <Section title="Browse Specialists and Consultants by Specialty">
        <p>
          The Zavis Professional Directory allows you to browse specialists and consultants
          separately for each medical and dental specialty in Dubai.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {PHYSICIAN_SPECIALTIES.slice(0, 10).map((spec) => (
            <Link
              key={spec.slug}
              href={`/professionals/${spec.category}/${spec.slug}`}
              className="text-sm text-[#006828] hover:underline"
            >
              {spec.name} ({spec.count.toLocaleString()}) &rarr;
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── Guide 2: DHA Licensing ─────────────────────────────────────────────────

function DhaLicensingContent() {
  return (
    <>
      <Section title="Overview of DHA Licensing">
        <p>
          The Dubai Health Authority (DHA) is the regulatory body responsible for licensing
          all healthcare professionals and facilities in the Emirate of Dubai. Every physician,
          dentist, nurse, pharmacist, and allied health worker must obtain a valid DHA license
          before practicing. As of {PROFESSIONAL_STATS.scraped},{" "}
          {PROFESSIONAL_STATS.total.toLocaleString()} professionals hold active DHA licenses
          across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities.
        </p>
      </Section>

      <Section title="Who Needs a DHA License?">
        <p>
          Every healthcare professional working in Dubai needs a DHA license. This includes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {PROFESSIONAL_CATEGORIES.map((cat) => (
            <div key={cat.slug} className="bg-[#f8f8f6] p-3">
              <Link
                href={`/professionals/${cat.slug}`}
                className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:text-[#006828]"
              >
                {cat.name}
              </Link>
              <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] mt-1">
                {cat.count.toLocaleString()} licensed
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="The Licensing Process">
        <p>
          The DHA licensing process involves several stages, each designed to verify that
          practitioners meet international standards of competence:
        </p>
        <div className="space-y-3 mt-3">
          {[
            { step: "1", title: "Eligibility Check", desc: "Review qualification requirements for your profession and grade. DHA maintains detailed eligibility matrices for each category." },
            { step: "2", title: "Primary Source Verification (PSV)", desc: "All qualifications are independently verified through DataFlow Group directly with issuing institutions. This takes 2-4 weeks." },
            { step: "3", title: "Professional Exam", desc: "Some applicants must pass the DHA professional exam (Prometric/Pearson VUE). Exemptions apply for certain qualifications and experience levels." },
            { step: "4", title: "License Issuance", desc: "Once verified, DHA issues the license with the appropriate grade (GP, Specialist, or Consultant) and license type (FTL or REG)." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828] shrink-0">
                {item.step}.
              </span>
              <div>
                <p className="font-semibold text-[#1c1c1c]">{item.title}</p>
                <p className="text-sm text-black/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="License Types: FTL and REG">
        <p>
          DHA issues two types of licenses: <strong>FTL (Full-Time License)</strong> for
          professionals employed full-time at a single facility, and{" "}
          <strong>REG (Registered)</strong> for those working part-time, visiting, or across
          multiple facilities. Both require the same credentialing standards.
        </p>
        <p>
          <Link href="/professionals/guide/ftl-vs-reg" className="text-[#006828] hover:underline">
            Read our detailed guide on FTL vs REG licenses &rarr;
          </Link>
        </p>
      </Section>

      <Section title="Regulatory Scope: DHA vs DOH vs MOHAP">
        <p>
          Each emirate in the UAE has its own health regulator. DHA covers Dubai,
          DOH covers Abu Dhabi, and MOHAP covers Sharjah, Ajman, Ras Al Khaimah,
          Umm Al Quwain, and Fujairah. Licenses are not automatically transferable
          between authorities, though there is ongoing work on UAE-wide portability.
        </p>
      </Section>
    </>
  );
}

// ─── Guide 3: FTL vs REG ───────────────────────────────────────────────────

function FtlVsRegContent() {
  return (
    <>
      <Section title="Two License Types, Same Standards">
        <p>
          When browsing Dubai&apos;s healthcare professional registry, you&apos;ll see two
          license types: <strong>FTL (Full-Time License)</strong> and{" "}
          <strong>REG (Registered)</strong>. These designations indicate the employment
          arrangement, not the clinical competence of the professional. Both types
          require identical credentialing, verification, and qualification standards.
        </p>
      </Section>

      <Section title="FTL: Full-Time License">
        <p>
          An FTL is issued to healthcare professionals who are employed full-time at a
          specific facility. They work standard hours at that facility and are integral
          members of the permanent staff. FTL holders make up the majority of Dubai&apos;s
          healthcare workforce.
        </p>
        <div className="bg-[#f8f8f6] p-4 mt-3">
          <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-2">
            FTL Characteristics
          </p>
          <ul className="list-disc list-inside text-sm text-black/60 space-y-1">
            <li>Full-time employment at one designated facility</li>
            <li>Cannot work at other facilities under the same license</li>
            <li>Subject to the facility&apos;s employment terms and hours</li>
            <li>Employer sponsors the visa and license renewal</li>
          </ul>
        </div>
      </Section>

      <Section title="REG: Registered License">
        <p>
          A REG license is issued to professionals who work part-time, on a visiting basis,
          or across multiple facilities. This is common among senior consultants who
          may hold positions at several hospitals, international visiting physicians,
          and professionals transitioning between roles.
        </p>
        <div className="bg-[#f8f8f6] p-4 mt-3">
          <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-2">
            REG Characteristics
          </p>
          <ul className="list-disc list-inside text-sm text-black/60 space-y-1">
            <li>Flexible employment arrangement (part-time, visiting, multi-site)</li>
            <li>May practice at multiple facilities under separate agreements</li>
            <li>Common among senior consultants and visiting specialists</li>
            <li>Requires periodic renewal and facility sponsorship</li>
          </ul>
        </div>
      </Section>

      <Section title="What This Means for Patients">
        <p>
          As a patient, the FTL/REG distinction should not influence your choice of
          doctor. A REG-licensed consultant may be one of the most experienced physicians
          in Dubai, splitting time between top hospitals. An FTL-licensed specialist
          is a dedicated member of their facility&apos;s team.
        </p>
        <p>
          The important factors to evaluate are the doctor&apos;s grade (Specialist vs
          Consultant), their specific specialty, the facility&apos;s reputation, and
          their track record with your condition.
        </p>
        <p>
          <Link href="/professionals/guide/specialist-vs-consultant" className="text-[#006828] hover:underline">
            Learn about Specialist vs Consultant grades &rarr;
          </Link>
        </p>
      </Section>

      <Section title="Verify License Type">
        <p>
          You can check any professional&apos;s license type on the{" "}
          <Link href="/professionals" className="text-[#006828] hover:underline">
            Zavis Professional Directory
          </Link>{" "}
          or the DHA Sheryan portal. Each professional listing shows their license type
          alongside their name, specialty, and facility.
        </p>
      </Section>
    </>
  );
}

// ─── Guide 4: How to Verify a Doctor ────────────────────────────────────────

function HowToVerifyContent() {
  return (
    <>
      <Section title="Why Verify Before Your Appointment">
        <p>
          With {PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals
          practicing across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}{" "}
          facilities in Dubai, verifying a doctor&apos;s credentials is both easy and
          important. The DHA maintains a public registry that anyone can access for free.
        </p>
        <p>
          Verification protects you from unlicensed practitioners, confirms the doctor&apos;s
          specialty matches your needs, and ensures they are actively affiliated with the
          facility you plan to visit.
        </p>
      </Section>

      <Section title="Step-by-Step: Using DHA Sheryan">
        <div className="space-y-4 mt-2">
          {[
            { step: "1", title: "Go to the DHA Sheryan Portal", desc: "Visit sheryan.dha.gov.ae in your browser. The portal is free and requires no login." },
            { step: "2", title: "Select 'Search Healthcare Professional'", desc: "Click the search option on the homepage. You can search by name, license number, or specialty." },
            { step: "3", title: "Enter the Doctor's Name", desc: "Type the full name as it appears on their business card or the facility's website. Use English transliteration." },
            { step: "4", title: "Review the Results", desc: "Check: license status (Active), specialty, grade (Specialist/Consultant), license type (FTL/REG), and affiliated facility." },
            { step: "5", title: "Cross-Reference with Facility", desc: "Confirm the doctor is listed at the facility where you plan to visit. If there's a mismatch, contact the facility directly." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="font-['Geist_Mono',monospace] text-lg font-bold text-[#006828] shrink-0 w-6">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-[#1c1c1c]">{item.title}</p>
                <p className="text-sm text-black/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Using the Zavis Professional Directory">
        <p>
          The{" "}
          <Link href="/professionals" className="text-[#006828] hover:underline">
            Zavis Professional Directory
          </Link>{" "}
          provides an alternative interface to browse all{" "}
          {PROFESSIONAL_STATS.total.toLocaleString()} DHA-licensed professionals. You can
          filter by specialty, category, facility, and area. Each listing shows the
          professional&apos;s name, grade, license type, and facility.
        </p>
      </Section>

      <Section title="Red Flags to Watch For">
        <p>Be cautious if:</p>
        <ul className="list-disc list-inside text-sm text-black/60 space-y-1 mt-2">
          <li>The doctor does not appear in the DHA Sheryan registry at all</li>
          <li>Their license status shows as inactive, expired, or suspended</li>
          <li>Their listed specialty doesn&apos;t match what they claim to practice</li>
          <li>They are not affiliated with the facility where you found them</li>
          <li>They refuse to provide their DHA license number when asked</li>
        </ul>
        <p className="mt-3">
          If you encounter any of these issues, report them to the DHA complaints line
          or visit the DHA website for the formal complaint process.
        </p>
      </Section>

      <Section title="Verification for Other Emirates">
        <p>
          DHA Sheryan only covers Dubai. For other emirates, use the respective portals:
        </p>
        <ul className="list-disc list-inside text-sm text-black/60 space-y-1 mt-2">
          <li><strong>Abu Dhabi:</strong> Department of Health (doh.gov.ae)</li>
          <li><strong>Sharjah, Ajman, RAK, UAQ, Fujairah:</strong> MOHAP (mohap.gov.ae)</li>
        </ul>
      </Section>
    </>
  );
}

// ─── Guide 5: Choosing the Right Specialist ─────────────────────────────────

function ChoosingSpecialistContent() {
  return (
    <>
      <Section title="Start with the Right Referral">
        <p>
          Dubai has {PROFESSIONAL_STATS.physicians.toLocaleString()} licensed physicians
          across {PHYSICIAN_SPECIALTIES.length} specialties. With this many options,
          choosing the right specialist starts with understanding your condition and
          getting proper guidance.
        </p>
        <p>
          If you&apos;re unsure which specialty you need, start with a General Practitioner
          (GP). Dubai has {PHYSICIAN_SPECIALTIES[0].count.toLocaleString()} licensed GPs
          who can assess your condition and refer you to the right specialist. Many
          insurance plans also require a GP referral for specialist coverage.
        </p>
      </Section>

      <Section title="Evaluate Credentials and Grade">
        <p>
          Once you know which specialty you need, evaluate the doctor&apos;s credentials.
          Key factors to check:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="bg-[#f8f8f6] p-3">
            <p className="font-semibold text-sm text-[#1c1c1c]">Grade</p>
            <p className="text-xs text-black/60 mt-1">
              Specialist vs Consultant. For complex cases, a Consultant&apos;s 8+ years of
              extra experience may be valuable.
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-3">
            <p className="font-semibold text-sm text-[#1c1c1c]">License Type</p>
            <p className="text-xs text-black/60 mt-1">
              FTL (full-time, dedicated to one facility) vs REG (may work across multiple
              facilities).
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-3">
            <p className="font-semibold text-sm text-[#1c1c1c]">Facility</p>
            <p className="text-xs text-black/60 mt-1">
              Larger hospitals have more support staff and equipment. Clinics offer
              convenience and personal attention.
            </p>
          </div>
          <div className="bg-[#f8f8f6] p-3">
            <p className="font-semibold text-sm text-[#1c1c1c]">Sub-Specialty Focus</p>
            <p className="text-xs text-black/60 mt-1">
              Some specialists focus on specific conditions within their broader field
              (e.g., a pediatrician specializing in allergies).
            </p>
          </div>
        </div>
      </Section>

      <Section title="Consider Practical Factors">
        <p>Beyond credentials, practical factors matter for your experience:</p>
        <ul className="list-disc list-inside text-sm text-black/60 space-y-1 mt-2">
          <li><strong>Location:</strong> Choose a facility near your home or office for follow-up visits</li>
          <li><strong>Insurance:</strong> Verify the specialist is in your insurance network before booking</li>
          <li><strong>Language:</strong> Dubai&apos;s diverse workforce means you can often find a specialist who speaks your language</li>
          <li><strong>Wait times:</strong> Popular consultants may have longer wait times; a specialist may be available sooner</li>
          <li><strong>Cost:</strong> Consultant fees are typically 20-50% higher than specialist fees at the same facility</li>
        </ul>
      </Section>

      <Section title="When to See a Consultant Instead">
        <p>
          Seek a Consultant (the senior grade) when:
        </p>
        <ul className="list-disc list-inside text-sm text-black/60 space-y-1 mt-2">
          <li>Your condition is complex, rare, or involves multiple organ systems</li>
          <li>You need a second opinion on a diagnosis or treatment plan</li>
          <li>Surgery is recommended and you want the most experienced surgeon</li>
          <li>Previous treatment by a specialist hasn&apos;t resolved the issue</li>
          <li>The case requires coordination across multiple specialties</li>
        </ul>
        <p className="mt-3">
          <Link href="/professionals/guide/specialist-vs-consultant" className="text-[#006828] hover:underline">
            Learn more about the Specialist vs Consultant distinction &rarr;
          </Link>
        </p>
      </Section>

      <Section title="Browse Specialties">
        <p>Explore the most common specialties in Dubai:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {PHYSICIAN_SPECIALTIES.slice(0, 8).map((spec) => (
            <Link
              key={spec.slug}
              href={`/professionals/${spec.category}/${spec.slug}`}
              className="text-sm text-[#006828] hover:underline"
            >
              {spec.name} ({spec.count.toLocaleString()}) &rarr;
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── Guide 6: Healthcare Workforce ──────────────────────────────────────────

function HealthcareWorkforceContent() {
  return (
    <>
      <Section title="Dubai's Healthcare Workforce at a Glance">
        <p>
          Dubai is home to one of the most dynamic healthcare workforces in the Middle East.
          With {PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals working
          across {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities, the
          emirate has built a comprehensive healthcare infrastructure to serve its diverse
          population of over 3.5 million residents and millions more annual visitors.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {PROFESSIONAL_CATEGORIES.map((cat) => (
            <div key={cat.slug} className="bg-[#f8f8f6] p-4 text-center">
              <p className="text-2xl font-bold text-[#006828]">
                {cat.count.toLocaleString()}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40">{cat.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Physician Specialty Distribution">
        <p>
          Among the {PROFESSIONAL_STATS.physicians.toLocaleString()} physicians in Dubai,
          the distribution of specialties reflects the population&apos;s healthcare needs.
          Primary care (GPs and Family Medicine) leads, followed by high-demand specialties
          like OB/GYN, Pediatrics, and Dermatology.
        </p>
        <div className="mt-3">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1c1c1c]">
                <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                  Specialty
                </th>
                <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                  Professionals
                </th>
              </tr>
            </thead>
            <tbody>
              {PHYSICIAN_SPECIALTIES.slice(0, 15).map((spec) => (
                <tr key={spec.slug} className="border-b border-black/[0.06]">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/professionals/${spec.category}/${spec.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c] hover:text-[#006828]"
                    >
                      {spec.name}
                    </Link>
                  </td>
                  <td className="py-2 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {spec.count.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Largest Healthcare Facilities">
        <p>
          Dubai&apos;s largest hospitals employ thousands of professionals across all
          disciplines. Government hospitals like Rashid Hospital and Dubai Hospital anchor
          the public sector, while private institutions like American Hospital and
          Mediclinic drive the private sector.
        </p>
        <div className="mt-3">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1c1c1c]">
                <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                  Facility
                </th>
                <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2">
                  Staff
                </th>
              </tr>
            </thead>
            <tbody>
              {PROFESSIONAL_STATS.topFacilities.map((fac, i) => (
                <tr key={i} className="border-b border-black/[0.06]">
                  <td className="py-2 pr-4">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-sm text-[#1c1c1c]">
                      {i + 1}. {fac.name}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {fac.staff.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Dental Workforce">
        <p>
          Dubai&apos;s {PROFESSIONAL_STATS.dentists.toLocaleString()} licensed dentists
          cover {DENTIST_SPECIALTIES.length} specialties, from general dentistry to
          specialized fields like orthodontics, endodontics, and oral surgery.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {DENTIST_SPECIALTIES.map((spec) => (
            <Link
              key={spec.slug}
              href={`/professionals/${spec.category}/${spec.slug}`}
              className="text-sm text-[#006828] hover:underline"
            >
              {spec.name} ({spec.count.toLocaleString()}) &rarr;
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Nursing and Allied Health">
        <p>
          Nurses and midwives form the largest category with{" "}
          {PROFESSIONAL_STATS.nurses.toLocaleString()} professionals, while the allied
          health sector ({PROFESSIONAL_STATS.alliedHealth.toLocaleString()} professionals)
          includes pharmacists, physiotherapists, lab technologists, psychologists, and
          more. Together, these groups provide the essential support infrastructure that
          enables hospitals and clinics to function.
        </p>
      </Section>
    </>
  );
}

// ─── Guide 7: Medical Specialties Explained ─────────────────────────────────

function MedicalSpecialtiesContent() {
  return (
    <>
      <Section title="Understanding Medical Specialties in Dubai">
        <p>
          Dubai&apos;s healthcare system recognizes {PHYSICIAN_SPECIALTIES.length} physician
          specialties and {DENTIST_SPECIALTIES.length} dental specialties through the DHA
          licensing framework. Each specialty represents a distinct area of medicine with
          its own training pathway, qualification requirements, and scope of practice.
        </p>
        <p>
          Below is a guide to the major specialty categories, what they treat, and how
          many practitioners are available in Dubai.
        </p>
      </Section>

      <Section title="Primary Care Specialties">
        <p>
          Primary care physicians are the first point of contact for most patients. They
          handle general health issues, preventive care, and referrals to specialists.
        </p>
        <div className="space-y-3 mt-3">
          {PHYSICIAN_SPECIALTIES.filter((s) =>
            ["general-practitioner", "family-medicine", "internal-medicine"].includes(s.slug)
          ).map((spec) => (
            <div key={spec.slug} className="border-l-2 border-[#006828] pl-4">
              <Link
                href={`/professionals/${spec.category}/${spec.slug}`}
                className="font-semibold text-sm text-[#1c1c1c] hover:text-[#006828]"
              >
                {spec.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] ml-2">
                {spec.count.toLocaleString()}
              </span>
              <p className="text-xs text-black/60 mt-1">
                {spec.searchTerms.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Surgical Specialties">
        <p>
          Surgical specialties involve operative procedures to diagnose or treat conditions.
          Dubai has a full range of surgical disciplines from general surgery to highly
          specialized microsurgery.
        </p>
        <div className="space-y-3 mt-3">
          {PHYSICIAN_SPECIALTIES.filter((s) =>
            ["general-surgery", "orthopedic-surgery", "plastic-surgery", "neurosurgery", "vascular-surgery", "pediatric-surgery"].includes(s.slug)
          ).map((spec) => (
            <div key={spec.slug} className="border-l-2 border-[#006828] pl-4">
              <Link
                href={`/professionals/${spec.category}/${spec.slug}`}
                className="font-semibold text-sm text-[#1c1c1c] hover:text-[#006828]"
              >
                {spec.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] ml-2">
                {spec.count.toLocaleString()}
              </span>
              <p className="text-xs text-black/60 mt-1">
                {spec.searchTerms.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Medical Specialties (Non-Surgical)">
        <p>
          Medical specialties focus on diagnosis and non-surgical treatment. These cover
          organ systems, age groups, and disease types.
        </p>
        <div className="space-y-3 mt-3">
          {PHYSICIAN_SPECIALTIES.filter((s) =>
            ["cardiology", "dermatology", "gastroenterology", "neurology", "endocrinology", "rheumatology", "pulmonary-disease", "nephrology"].includes(s.slug)
          ).map((spec) => (
            <div key={spec.slug} className="border-l-2 border-[#006828] pl-4">
              <Link
                href={`/professionals/${spec.category}/${spec.slug}`}
                className="font-semibold text-sm text-[#1c1c1c] hover:text-[#006828]"
              >
                {spec.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] ml-2">
                {spec.count.toLocaleString()}
              </span>
              <p className="text-xs text-black/60 mt-1">
                {spec.searchTerms.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Dental Specialties">
        <p>
          Beyond general dentistry, Dubai offers {DENTIST_SPECIALTIES.length} dental
          specialties covering everything from orthodontics to oral surgery.
        </p>
        <div className="space-y-3 mt-3">
          {DENTIST_SPECIALTIES.map((spec) => (
            <div key={spec.slug} className="border-l-2 border-[#006828] pl-4">
              <Link
                href={`/professionals/${spec.category}/${spec.slug}`}
                className="font-semibold text-sm text-[#1c1c1c] hover:text-[#006828]"
              >
                {spec.name}
              </Link>
              <span className="font-['Geist_Mono',monospace] text-xs text-[#006828] ml-2">
                {spec.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Full Specialty Directory">
        <p>
          Browse all specialties and their licensed professionals through the{" "}
          <Link href="/professionals" className="text-[#006828] hover:underline">
            Zavis Professional Directory
          </Link>. Each specialty page lists every licensed practitioner with their grade,
          license type, and facility affiliation.
        </p>
      </Section>
    </>
  );
}

// ─── Guide 8: International Doctors ─────────────────────────────────────────

function InternationalDoctorsContent() {
  return (
    <>
      <Section title="A Truly Global Medical Workforce">
        <p>
          Dubai&apos;s healthcare workforce is one of the most internationally diverse in
          the world. With {PROFESSIONAL_STATS.total.toLocaleString()} licensed professionals
          drawn from over 100 countries, the emirate has assembled a medical community
          that reflects its cosmopolitan population. This diversity is a deliberate result
          of Dubai&apos;s open immigration policies and the DHA&apos;s recognition of
          qualifications from major medical systems worldwide.
        </p>
      </Section>

      <Section title="Where Dubai's Doctors Come From">
        <p>
          Dubai&apos;s physicians are trained across a wide spectrum of medical education
          systems. The largest groups include graduates from the Indian subcontinent
          (India, Pakistan, Bangladesh), the Arab world (Egypt, Syria, Jordan, Iraq),
          the Philippines, and Western countries (UK, Ireland, US, Canada, Australia).
        </p>
        <p>
          Many physicians also hold additional qualifications from multiple countries.
          It is common to find a doctor trained in India who completed a fellowship in
          the UK and practiced in the US before coming to Dubai. This breadth of
          experience is a unique advantage of Dubai&apos;s medical system.
        </p>
      </Section>

      <Section title="How International Qualifications Are Verified">
        <p>
          The DHA uses a rigorous credentialing process for all international qualifications:
        </p>
        <div className="space-y-3 mt-3">
          {[
            { title: "Primary Source Verification (PSV)", desc: "Every degree, diploma, and training certificate is independently verified through DataFlow Group directly with the issuing institution. This prevents fraudulent qualifications from entering the system." },
            { title: "DHA Professional Exam", desc: "Depending on the qualification pathway and years of experience, some applicants must pass a DHA-administered professional exam (Prometric). Certain high-level qualifications (e.g., US/UK/Canadian board certifications) may be exempt." },
            { title: "Clinical Assessment", desc: "For some grades and specialties, a clinical assessment or interview may be required to evaluate hands-on competence in addition to paper qualifications." },
          ].map((item) => (
            <div key={item.title} className="bg-[#f8f8f6] p-4">
              <p className="font-semibold text-sm text-[#1c1c1c]">{item.title}</p>
              <p className="text-xs text-black/60 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Language Diversity">
        <p>
          English is the primary language of medical practice in Dubai, and all DHA-licensed
          professionals must demonstrate English proficiency. However, Dubai&apos;s diverse
          workforce means patients can often find specialists who speak their native language.
        </p>
        <p>
          Common languages spoken by healthcare professionals in Dubai include English,
          Arabic, Hindi, Urdu, Tagalog, Malayalam, Tamil, Farsi, French, German, and
          Russian. Many facilities specifically advertise multilingual staff to serve
          Dubai&apos;s expatriate communities.
        </p>
      </Section>

      <Section title="Implications for Patient Care">
        <p>
          The international diversity of Dubai&apos;s medical workforce has several
          practical benefits for patients:
        </p>
        <ul className="list-disc list-inside text-sm text-black/60 space-y-1 mt-2">
          <li>Access to physicians trained in different medical traditions and approaches</li>
          <li>Ability to find a doctor who speaks your language and understands your cultural background</li>
          <li>Exposure to best practices from healthcare systems around the world</li>
          <li>Multiple perspectives available for complex cases and second opinions</li>
        </ul>
        <p className="mt-3">
          Browse the full directory of {PROFESSIONAL_STATS.total.toLocaleString()}{" "}
          professionals on the{" "}
          <Link href="/professionals" className="text-[#006828] hover:underline">
            Zavis Professional Directory
          </Link>.
        </p>
      </Section>
    </>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function GuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const base = getBaseUrl();

  // Find related guides (exclude current)
  const relatedGuides = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Article JSON-LD */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          url: `${base}/professionals/guide/${guide.slug}`,
          datePublished: guide.publishedDate,
          dateModified: guide.publishedDate,
          author: {
            "@type": "Organization",
            name: "Zavis",
            url: base,
          },
          publisher: {
            "@type": "Organization",
            name: "Zavis",
            url: base,
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${base}/professionals/guide/${guide.slug}`,
          },
          about: {
            "@type": "MedicalSpecialty",
            name: "Healthcare Professionals",
          },
        }}
      />

      {/* FAQ JSON-LD */}
      <JsonLd data={faqPageSchema(guide.faqs)} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Directory", href: "/directory" },
          { label: "Professionals", href: "/professionals" },
          { label: "Guides", href: "/professionals" },
          { label: guide.title },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Professional Directory Guide
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          {guide.title}
        </h1>
        <p className="font-['Geist',sans-serif] text-base text-black/50 leading-relaxed max-w-[700px]">
          {guide.subtitle}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30 uppercase tracking-wider">
            Published {guide.publishedDate}
          </span>
          <span className="font-['Geist_Mono',monospace] text-[10px] text-black/30 uppercase tracking-wider">
            Source: {PROFESSIONAL_STATS.source}
          </span>
        </div>
      </div>

      {/* Key stats banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {PROFESSIONAL_STATS.total.toLocaleString()}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Total professionals</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {PROFESSIONAL_STATS.physicians.toLocaleString()}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Physicians</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Facilities</p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="text-2xl font-bold text-[#006828]">
            {PHYSICIAN_SPECIALTIES.length + DENTIST_SPECIALTIES.length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40">Specialties</p>
        </div>
      </div>

      {/* Guide Content */}
      <GuideContent guide={guide} />

      {/* FAQs */}
      <div className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-6">
          {guide.faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight mb-2">
                {faq.question}
              </h3>
              <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Related Guides */}
      <div className="mb-10">
        <div className="border-b-2 border-[#1c1c1c] pb-3 mb-6">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
            Related Guides
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedGuides.map((g) => (
            <Link
              key={g.slug}
              href={`/professionals/guide/${g.slug}`}
              className="border border-black/[0.06] p-4 hover:border-[#006828]/30 transition-colors group"
            >
              <p className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                {g.title}
              </p>
              <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-2">
                {g.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Data source info */}
      <div className="mb-6 bg-[#f8f8f6] p-4">
        <p className="font-['Geist_Mono',monospace] text-[10px] text-black/40 uppercase tracking-wider mb-1">
          Data Source
        </p>
        <p className="font-['Geist',sans-serif] text-xs text-black/50">
          {PROFESSIONAL_STATS.total.toLocaleString()} healthcare professionals across{" "}
          {PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. Last updated{" "}
          {PROFESSIONAL_STATS.scraped}. Source: {PROFESSIONAL_STATS.source}.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical Professional
          Registry. This guide is for informational purposes only and does not constitute
          medical advice. Verify professional credentials directly with DHA before making
          healthcare decisions.
        </p>
      </div>
    </div>
  );
}
