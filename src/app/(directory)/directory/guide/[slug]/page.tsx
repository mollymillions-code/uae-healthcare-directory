import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { sanitizeHtml } from "@/lib/sanitize";

/* ─── Guide article data ─── */

interface GuideArticle {
  slug: string;
  title: string;
  metaDescription: string;
  body: string[];
  faqs: { question: string; answer: string }[];
}

const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "how-uae-healthcare-works",
    title: "How UAE Healthcare Works",
    metaDescription:
      "A comprehensive overview of the UAE healthcare system — the three regulatory authorities (DHA, DOH, MOHAP), mandatory insurance, public vs private care, and healthcare free zones.",
    body: [
      "The United Arab Emirates operates a dual healthcare system comprising government-funded public facilities and a large private sector. Healthcare regulation is split between three main authorities: the Dubai Health Authority (DHA) governs Dubai, the Department of Health (DOH) oversees Abu Dhabi and Al Ain, and the Ministry of Health and Prevention (MOHAP) regulates the remaining five Northern Emirates — Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. Each authority independently licenses healthcare facilities and professionals within its jurisdiction.",
      "Public hospitals and clinics offer subsidised care to UAE nationals and, in many cases, to residents holding valid health insurance. The private sector accounts for the majority of outpatient visits, with thousands of licensed clinics, polyclinics, and hospitals operating across the country. Health insurance is mandatory for all residents in Abu Dhabi and Dubai, and the federal government is progressively extending mandatory coverage to the Northern Emirates. Employers are legally required to provide health insurance for their employees.",
      "The UAE has invested heavily in healthcare infrastructure over the past two decades, attracting internationally trained physicians and establishing world-class facilities. <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">Dubai</a> and <a href=\"/directory/abu-dhabi\" class=\"text-accent-dark hover:underline\">Abu Dhabi</a> are home to JCI-accredited hospitals, medical free zones like Dubai Healthcare City (DHCC), and research institutions. The country continues to pursue its goal of becoming a regional hub for medical tourism and specialised care.",
    ],
    faqs: [
      {
        question: "Is healthcare free in the UAE?",
        answer:
          "Public healthcare is free or heavily subsidised for UAE nationals. Residents and expatriates must have health insurance, which is mandatory in Abu Dhabi and Dubai. Employers are required to provide coverage.",
      },
      {
        question: "Which authority regulates healthcare in Dubai?",
        answer:
          "The Dubai Health Authority (DHA) is the primary regulator for all healthcare facilities and professionals operating in the Emirate of Dubai.",
      },
      {
        question: "How many healthcare providers are there in the UAE?",
        answer:
          "The UAE has thousands of licensed healthcare providers across all seven Emirates, including hospitals, clinics, pharmacies, dental practices, and specialist centres. The exact count changes as new facilities are licensed.",
      },
      {
        question: "Can tourists access healthcare in the UAE?",
        answer:
          "Yes. Tourists can access private healthcare facilities across the UAE. Emergency care is available to everyone. Travel insurance is strongly recommended as medical costs can be significant without coverage.",
      },
    ],
  },
  {
    slug: "health-insurance-uae",
    title: "Understanding Health Insurance in the UAE",
    metaDescription:
      "Everything about mandatory health insurance in the UAE — the law, major providers like Daman, Thiqa, AXA, and Cigna, how to check your coverage, and choosing the right plan.",
    body: [
      "Health insurance is mandatory for all residents in Abu Dhabi (since 2006) and Dubai (since 2014). The Abu Dhabi mandate is governed by DOH under the Thiqa programme for nationals and Daman regulations for expatriates, while Dubai's mandate falls under DHA Law No. 11 of 2013. In the Northern Emirates, MOHAP is progressively implementing insurance requirements, and most employers already provide coverage as standard practice. Major insurance providers operating in the UAE include Daman (National Health Insurance Company), Thiqa (for Abu Dhabi nationals), AXA, Cigna, MetLife, and Dubai Insurance Company.",
      "Insurance plans in the UAE range from basic essential benefit packages — which cover outpatient visits, emergency care, maternity, and prescribed medications — to comprehensive international plans that include dental, optical, and global coverage. The Essential Benefits Plan (EBP) in Dubai sets a minimum standard that all employer-sponsored policies must meet, with an annual premium cap and defined co-payment limits. Residents should verify that their plan covers their preferred providers by checking the insurer's network list.",
      "When choosing a health insurance plan, consider the network of hospitals and clinics included, co-payment amounts, annual coverage limits, and whether pre-existing conditions are covered. Most insurers in the UAE partner with major hospital groups and clinic chains. You can use the <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">directory</a> to find providers in your city and check which insurance networks they accept. To verify your coverage status, contact your insurer directly or check through the DHA or DOH online portals.",
    ],
    faqs: [
      {
        question: "Is health insurance mandatory in the UAE?",
        answer:
          "Yes, health insurance is mandatory in Abu Dhabi and Dubai. Employers must provide coverage for employees. The Northern Emirates are progressively adopting similar requirements.",
      },
      {
        question: "What does basic health insurance cover in Dubai?",
        answer:
          "Dubai's Essential Benefits Plan covers outpatient consultations, emergency treatment, maternity care, prescribed medications, and diagnostic tests, subject to co-payment limits set by DHA.",
      },
      {
        question: "Can I choose my own doctor with insurance?",
        answer:
          "Yes, but you must typically visit providers within your insurer's network to receive full coverage. Out-of-network visits may require higher co-payments or may not be covered.",
      },
      {
        question: "What happens if my employer does not provide insurance?",
        answer:
          "In Dubai, employers who fail to provide health insurance face fines and may have their trade licence renewal blocked. Employees can report non-compliance to DHA.",
      },
    ],
  },
  {
    slug: "what-is-dha",
    title: "What is DHA? Dubai Health Authority Explained",
    metaDescription:
      "Everything about the Dubai Health Authority (DHA) — what it regulates, how licensing works, its role in DHCC, and how it protects patients in Dubai.",
    body: [
      "The Dubai Health Authority (DHA) was established in 2007 as the government entity responsible for managing and overseeing the health sector in the Emirate of Dubai. DHA operates public hospitals and primary healthcare centres, licenses private healthcare facilities and professionals, and sets the regulatory framework for health insurance and patient safety standards across the emirate.",
      "DHA maintains the Dubai Licensed Facilities Register, a public database of all licensed hospitals, clinics, pharmacies, and other healthcare establishments. Every facility operating in <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">Dubai</a> must hold a valid DHA licence, and all healthcare professionals — physicians, nurses, pharmacists, and allied health workers — must be individually licensed through DHA's professional licensing system. DHA also enforces mandatory health insurance through Dubai Health Insurance Law No. 11 of 2013. The authority oversees Dubai Healthcare City (DHCC) through the Dubai Healthcare City Authority (DHCA).",
      "In addition to regulation, DHA directly operates several major public hospitals including Rashid Hospital, Dubai Hospital, and Latifa Hospital, along with a network of primary healthcare centres serving UAE nationals and eligible residents. DHA has been a leader in digital health initiatives, including the Salama electronic health record system and various telemedicine programmes launched during and after the COVID-19 pandemic.",
    ],
    faqs: [
      {
        question: "What does DHA stand for?",
        answer:
          "DHA stands for Dubai Health Authority. It is the government entity responsible for healthcare regulation, licensing, and public health services in the Emirate of Dubai.",
      },
      {
        question: "How do I verify a doctor's licence in Dubai?",
        answer:
          "You can verify a healthcare professional's licence through the DHA website or the DHA app. All licensed professionals are listed in the DHA Professional Licensing Register.",
      },
      {
        question: "Does DHA run hospitals?",
        answer:
          "Yes. DHA operates several public hospitals in Dubai, including Rashid Hospital, Dubai Hospital, and Latifa Hospital, as well as primary healthcare centres.",
      },
    ],
  },
  {
    slug: "what-is-doh",
    title: "What is DOH? Abu Dhabi Department of Health",
    metaDescription:
      "A guide to the Department of Health Abu Dhabi (DOH) — the HAAD legacy, Thiqa insurance for nationals, and how DOH regulates healthcare in Abu Dhabi and Al Ain.",
    body: [
      "The Department of Health Abu Dhabi (DOH), formerly known as the Health Authority Abu Dhabi (HAAD), is the regulatory body responsible for the healthcare sector in the Emirate of Abu Dhabi, including the city of <a href=\"/directory/al-ain\" class=\"text-accent-dark hover:underline\">Al Ain</a>. Established to ensure the highest standards of healthcare delivery, DOH licenses all healthcare facilities and professionals operating within the emirate and sets policy for public health, health insurance, and patient safety. The transition from HAAD to DOH occurred in 2018 as part of a broader government restructuring, though the regulatory functions remained the same.",
      "DOH oversees one of the most developed healthcare markets in the region. <a href=\"/directory/abu-dhabi\" class=\"text-accent-dark hover:underline\">Abu Dhabi</a> is home to major hospital groups including SEHA (Abu Dhabi Health Services Company), Cleveland Clinic Abu Dhabi, and numerous private hospital groups. The emirate was the first in the UAE to mandate health insurance for all residents, and DOH continues to regulate insurance through its partnership with the National Health Insurance Company (Daman). UAE nationals in Abu Dhabi receive coverage through the Thiqa programme, a comprehensive insurance plan funded by the government.",
      "The department maintains a comprehensive licensed facility register that the public can access to verify the licensing status of any healthcare provider. DOH has also been at the forefront of healthcare data initiatives, including the Malaffi health information exchange platform, which connects patient records across all providers in the emirate to improve care coordination and reduce duplicate testing.",
    ],
    faqs: [
      {
        question: "What is the difference between DOH and HAAD?",
        answer:
          "DOH (Department of Health Abu Dhabi) replaced HAAD (Health Authority Abu Dhabi) in 2018. The functions remained the same — regulating and licensing healthcare in Abu Dhabi — but the entity was restructured under the new name.",
      },
      {
        question: "Does DOH regulate Al Ain?",
        answer:
          "Yes. The Department of Health Abu Dhabi regulates all healthcare facilities and professionals in both Abu Dhabi city and Al Ain, as both fall within the Emirate of Abu Dhabi.",
      },
      {
        question: "What is Malaffi?",
        answer:
          "Malaffi is Abu Dhabi's health information exchange platform operated by DOH. It connects patient medical records across all healthcare providers in the emirate to improve care coordination.",
      },
      {
        question: "What is Thiqa insurance?",
        answer:
          "Thiqa is the health insurance programme for UAE nationals in the Emirate of Abu Dhabi. It provides comprehensive coverage and is funded by the Abu Dhabi government, administered in partnership with Daman.",
      },
    ],
  },
  {
    slug: "what-is-mohap",
    title: "What is MOHAP? Ministry of Health and Prevention",
    metaDescription:
      "Understanding MOHAP — the UAE's federal health authority that regulates healthcare in Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.",
    body: [
      "The Ministry of Health and Prevention (MOHAP) is the UAE's federal government body responsible for healthcare policy, regulation, and public health at the national level. While DHA and DOH handle healthcare regulation in Dubai and Abu Dhabi respectively, MOHAP directly regulates the healthcare sector in the five Northern Emirates: <a href=\"/directory/sharjah\" class=\"text-accent-dark hover:underline\">Sharjah</a>, <a href=\"/directory/ajman\" class=\"text-accent-dark hover:underline\">Ajman</a>, <a href=\"/directory/ras-al-khaimah\" class=\"text-accent-dark hover:underline\">Ras Al Khaimah</a>, <a href=\"/directory/fujairah\" class=\"text-accent-dark hover:underline\">Fujairah</a>, and <a href=\"/directory/umm-al-quwain\" class=\"text-accent-dark hover:underline\">Umm Al Quwain</a>.",
      "MOHAP licenses healthcare facilities and professionals in the Northern Emirates, operates federal hospitals and clinics, and leads national health campaigns including vaccination programmes, disease surveillance, and public health awareness initiatives. The ministry also plays a coordinating role across all emirates on matters of national health policy, pharmaceutical regulation, and emergency preparedness.",
      "In recent years, MOHAP has focused on expanding healthcare access in the Northern Emirates, improving the quality of primary care, and developing a robust pharmaceutical regulatory framework. The ministry maintains the federal licensed facility register, which serves as the authoritative source for verifying the licensing status of healthcare providers in the Northern Emirates.",
    ],
    faqs: [
      {
        question: "What does MOHAP stand for?",
        answer:
          "MOHAP stands for the Ministry of Health and Prevention. It is the UAE's federal health ministry responsible for national health policy and direct regulation of healthcare in the Northern Emirates.",
      },
      {
        question: "Which emirates does MOHAP regulate?",
        answer:
          "MOHAP directly regulates healthcare in Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain. It also sets national health policy that applies across all seven Emirates.",
      },
      {
        question: "Does MOHAP operate hospitals?",
        answer:
          "Yes. MOHAP operates several federal hospitals and healthcare centres across the Northern Emirates, providing both primary and secondary care services.",
      },
      {
        question: "How do I check if a clinic is licensed by MOHAP?",
        answer:
          "You can verify a facility's licence through the MOHAP website or the UAE Open Healthcare Directory. All licensed facilities are listed in MOHAP's official register.",
      },
    ],
  },
  {
    slug: "choosing-a-doctor-uae",
    title: "How to Choose a Doctor in the UAE",
    metaDescription:
      "Tips on choosing a doctor in the UAE — checking credentials via DHA/DOH licence lookup, verifying insurance networks, reading Google reviews, and getting referrals.",
    body: [
      "Finding the right doctor in the UAE starts with understanding your needs. If you require a general check-up, a general practitioner (GP) at a nearby clinic is usually sufficient. For specialist care — such as cardiology, orthopaedics, or dermatology — you will need a referral from your GP or can book directly with a specialist if your insurance plan allows direct access. Use the <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">UAE Open Healthcare Directory</a> to search by city, specialty, and area.",
      "Always verify that your chosen doctor is licensed by the relevant authority: DHA for <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">Dubai</a>, DOH for <a href=\"/directory/abu-dhabi\" class=\"text-accent-dark hover:underline\">Abu Dhabi</a> and <a href=\"/directory/al-ain\" class=\"text-accent-dark hover:underline\">Al Ain</a>, or MOHAP for the Northern Emirates. You can check licensing status through each authority's website or app. It is also important to confirm that the doctor and facility are within your insurance network — visiting an out-of-network provider can result in significantly higher out-of-pocket costs or no coverage at all.",
      "Patient ratings and Google reviews provide useful signals, but should be considered alongside credentials and experience. Look for doctors with relevant board certifications, adequate experience in your condition, and a communication style that makes you comfortable. Many UAE clinics now offer online appointment booking and telemedicine consultations, making it easier to access care without long waits.",
    ],
    faqs: [
      {
        question: "Do I need a referral to see a specialist in the UAE?",
        answer:
          "It depends on your insurance plan. Some plans require a GP referral before seeing a specialist, while others allow direct specialist access. Check your policy or call your insurer.",
      },
      {
        question: "How do I check if a doctor is licensed in the UAE?",
        answer:
          "You can verify a doctor's licence through the DHA website (Dubai), DOH website (Abu Dhabi/Al Ain), or MOHAP website (Northern Emirates). Each authority maintains a public register of licensed professionals.",
      },
      {
        question: "Can I see a doctor online in the UAE?",
        answer:
          "Yes. Many clinics and hospitals in the UAE offer telemedicine consultations. DHA and DOH have approved telehealth platforms, and most major hospital groups provide virtual appointment options.",
      },
      {
        question: "What if I am not satisfied with my doctor?",
        answer:
          "You can switch doctors at any time. If you have a complaint about care quality, you can file a formal complaint with the relevant health authority — DHA, DOH, or MOHAP — which will investigate.",
      },
    ],
  },
  {
    slug: "healthcare-free-zones-dubai",
    title: "Healthcare Free Zones in Dubai",
    metaDescription:
      "What Dubai Healthcare City (DHCC), Dubai Science Park, and other healthcare free zones mean for patients — 100% foreign ownership, JCI accreditation, and medical tourism.",
    body: [
      "Dubai Healthcare City (DHCC) is the world's largest healthcare free zone, established in 2002 as part of Dubai's strategy to become a regional hub for medical tourism and advanced healthcare. Located in the heart of <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">Dubai</a>, DHCC hosts over 170 clinical facilities and more than 4,000 licensed healthcare professionals. The free zone allows 100% foreign ownership, offers tax incentives, and provides a streamlined licensing process that attracts international healthcare providers and medical education institutions.",
      "DHCC is regulated by its own authority — the Dubai Healthcare City Authority (DHCA) — which operates under the umbrella of DHA but has its own licensing and regulatory framework. Facilities within DHCC must meet international accreditation standards, and many hold JCI (Joint Commission International) accreditation. For patients, this means access to a concentrated cluster of specialist clinics, diagnostic centres, and hospitals staffed by internationally trained physicians.",
      "Beyond DHCC, Dubai has other zones that host healthcare facilities, including Dubai Science Park and various mixed-use free zones. The free zone model has been successful in attracting medical tourism patients from the GCC, South Asia, Africa, and CIS countries. Patients considering treatment in a free zone facility should verify that their insurance covers the specific provider, as some free zone facilities operate outside standard insurance networks. What free zone status means for patients is primarily about quality standards — these facilities typically maintain higher accreditation requirements and attract internationally credentialled specialists.",
    ],
    faqs: [
      {
        question: "What is Dubai Healthcare City?",
        answer:
          "Dubai Healthcare City (DHCC) is the world's largest healthcare free zone, hosting over 170 clinical facilities and 4,000+ licensed professionals. It was established in 2002 to attract international healthcare providers.",
      },
      {
        question: "Who regulates healthcare in Dubai free zones?",
        answer:
          "Dubai Healthcare City is regulated by the Dubai Healthcare City Authority (DHCA), which operates under DHA. Other free zones with healthcare facilities follow standard DHA regulations.",
      },
      {
        question: "Does my insurance work in Dubai Healthcare City?",
        answer:
          "It depends on your plan. Many major insurers include DHCC facilities in their networks, but you should confirm with your insurer before booking. Some DHCC providers may be out-of-network.",
      },
      {
        question: "What is Dubai Science Park?",
        answer:
          "Dubai Science Park is a free zone focused on science, health, and pharmaceutical companies. While not exclusively healthcare, it hosts pharmaceutical firms, medical device companies, and some clinical facilities.",
      },
    ],
  },
  {
    slug: "emergency-services-uae",
    title: "Emergency Services in the UAE",
    metaDescription:
      "How UAE emergency healthcare works — call 998 for ambulance, Rashid Hospital trauma centre, emergency departments, and when to go to the ER vs an urgent care clinic.",
    body: [
      "In a medical emergency in the UAE, call 998 for ambulance services (or 999 for police and general emergencies). The national ambulance service operates across all seven Emirates, and response times in urban areas like <a href=\"/directory/dubai\" class=\"text-accent-dark hover:underline\">Dubai</a> and <a href=\"/directory/abu-dhabi\" class=\"text-accent-dark hover:underline\">Abu Dhabi</a> are among the fastest in the region. Dubai also operates the DHA-run Rashid Hospital Trauma Centre, one of the leading trauma facilities in the Middle East, specialising in road accident injuries, burns, and critical care.",
      "Emergency departments at government hospitals are open 24/7 and are required to treat all patients regardless of insurance status or nationality. Treatment costs may be billed after stabilisation, but no patient can be turned away in an emergency. Major private hospitals also operate 24-hour emergency departments, though they may require insurance verification for non-emergency follow-up care. If you are unsure whether your situation is a true emergency, you can call the DHA hotline (800 342) in Dubai or the DOH hotline in Abu Dhabi for guidance.",
      "For non-life-threatening urgent care, many private clinics and hospital chains operate walk-in urgent care centres with extended hours. These are often faster and less crowded than hospital emergency departments for conditions like minor injuries, high fevers, or acute pain. Know when to go to the ER vs a clinic: chest pain, difficulty breathing, severe bleeding, loss of consciousness, and suspected stroke or heart attack always require an emergency department. Pharmacies in the UAE also provide basic health advice and over-the-counter medications — many are open 24 hours in major cities.",
    ],
    faqs: [
      {
        question: "What is the emergency number in the UAE?",
        answer:
          "Call 998 for ambulance services in the UAE. You can also call 999 for police and general emergencies. In Dubai, the DHA hotline 800 342 provides health guidance.",
      },
      {
        question: "Can I go to any hospital in an emergency?",
        answer:
          "Yes. All government and private hospitals with emergency departments must treat emergency patients regardless of insurance status. Billing is handled after the patient is stabilised.",
      },
      {
        question: "Are ambulance services free in the UAE?",
        answer:
          "Government ambulance services are generally free for emergencies. Some private ambulance services may charge fees. Your health insurance may cover ambulance transport costs.",
      },
      {
        question: "Where should I go for non-emergency urgent care?",
        answer:
          "For non-life-threatening conditions, visit a walk-in urgent care centre or extended-hours clinic. These are faster than hospital emergency departments and are available in most major UAE cities.",
      },
    ],
  },
];

/* ─── Static params for pre-generation ─── */

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

/* ─── Dynamic metadata ─── */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = GUIDE_ARTICLES.find((a) => a.slug === params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | UAE Open Healthcare Directory`,
    description: article.metaDescription,
    alternates: {
      canonical: `https://www.zavis.ai/directory/guide/${params.slug}`,
    },
  };
}

/* ─── Page component ─── */

export default function GuideArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = GUIDE_ARTICLES.find((a) => a.slug === params.slug);
  if (!article) notFound();

  const base = getBaseUrl();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guide", href: "/directory/guide" },
    { label: article.title },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Guide", url: `${base}/directory/guide` },
          { name: article.title },
        ])}
      />
      <JsonLd data={faqPageSchema(article.faqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">{b.label}</Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            UAE healthcare guide
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[52px] leading-[1.04] tracking-[-0.025em]">
            {article.title}
          </h1>

          <div className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl" data-answer-block="true">
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {article.body[0].replace(/<[^>]*>/g, "")}
            </p>
          </div>
        </div>
      </section>

      {/* Prose body */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="max-w-[720px]">
          <div className="space-y-6">
            {article.body.map((paragraph, idx) => (
              <p
                key={idx}
                className="font-sans text-z-body text-ink-soft leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(paragraph) }}
              />
            ))}
          </div>

          <p className="font-sans text-z-caption text-ink-muted mt-8">
            Last updated March 2026
          </p>

          <div className="mt-6 pt-6 border-t border-ink-line">
            <Link
              href="/directory/guide"
              className="inline-flex items-center font-sans text-z-body-sm font-semibold text-accent-dark hover:underline"
            >
              &larr; Back to Healthcare Guide
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <FaqSection faqs={article.faqs} />
        </div>
      </section>
    </>
  );
}
