#!/usr/bin/env node
/**
 * Seed GCC country healthcare guide articles into the journal_articles table.
 *
 * Usage:  node scripts/seed-gcc-guides.mjs
 *
 * Inserts 4 cornerstone guide articles for Qatar, Saudi Arabia, Bahrain, and Kuwait.
 * Uses ON CONFLICT DO NOTHING on slug to avoid duplicates.
 *
 * Uses `pg` (node-postgres) — NOT @neondatabase/serverless.
 */

import pg from "pg";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(PROJECT_ROOT, ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables
  }
}

loadEnv();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function readTime(html) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

// ─── Article Definitions ──────────────────────────────────────────────────────

const articles = [
  // ── Article 1: Qatar ──────────────────────────────────────────────────────
  {
    slug: "healthcare-in-qatar-guide-2026",
    title: "Healthcare in Qatar: Complete Guide for Residents & Expats [2026]",
    excerpt:
      "Everything you need to know about Qatar's healthcare system — from the MOPH and Hamad Medical Corporation to mandatory health insurance, primary care networks, and emergency services.",
    category: "regulatory",
    tags: ["qatar", "gcc", "moph", "hamad medical", "health insurance", "expat healthcare", "guide"],
    authorName: "Zavis Intelligence",
    authorRole: "Healthcare Research",
    isFeatured: true,
    body: `
<h2>Overview of Qatar's Healthcare System</h2>
<p>Qatar operates one of the most generously funded healthcare systems in the Gulf region, consistently ranking among the top in the Middle East for quality of care. The Ministry of Public Health (MOPH) serves as the principal regulatory body, overseeing all public and private healthcare delivery across the country. With a population that is roughly 85% expatriate, the system has been designed from the ground up to serve a diverse, multilingual community.</p>
<p>Healthcare spending in Qatar exceeds QAR 20 billion annually, with the government subsidising the majority of public healthcare costs for citizens and providing substantial coverage for residents through mandatory insurance schemes.</p>

<h2>Key Institutions and Governance</h2>
<h3>Ministry of Public Health (MOPH)</h3>
<p>The <a href="https://www.moph.gov.qa" target="_blank" rel="noopener noreferrer">MOPH</a> sets national health strategy, licenses practitioners, regulates pharmaceuticals, and enforces quality standards across all facilities. It replaced the former Supreme Council of Health in 2014 and has since driven Qatar's National Health Strategy 2018–2022 and its successor framework through 2030.</p>

<h3>Hamad Medical Corporation (HMC)</h3>
<p>Hamad Medical Corporation is Qatar's primary public healthcare provider and one of the largest hospital networks in the region. HMC operates 12 hospitals across the country, including Hamad General Hospital, Al Wakra Hospital, Al Khor Hospital, and the Women's Wellness and Research Center. It holds Joint Commission International (JCI) accreditation across all its facilities — a distinction few hospital networks worldwide can claim.</p>
<p>HMC also runs the National Ambulance Service and Qatar's sole Level 1 trauma centre at Hamad General Hospital.</p>

<h3>Sidra Medicine</h3>
<p><a href="https://www.sidra.org" target="_blank" rel="noopener noreferrer">Sidra Medicine</a>, part of the Qatar Foundation, is an ultramodern women's and children's hospital that opened in 2018. It has rapidly become a referral hub for complex paediatric and maternal cases across the GCC, with particular strength in paediatric surgery, neonatal intensive care, and genomic medicine.</p>

<h3>Primary Health Care Corporation (PHCC)</h3>
<p>The <a href="https://www.phcc.gov.qa" target="_blank" rel="noopener noreferrer">PHCC</a> manages Qatar's network of 31 health centres spread across every municipality. These centres serve as the first point of contact for non-emergency care, offering general practice, dental services, maternal and child health, chronic disease management, and preventive screening. Registration with a local health centre is required for all residents.</p>

<h2>Health Insurance in Qatar</h2>
<h3>Mandatory Coverage</h3>
<p>Under Law No. 22 of 2021, health insurance is mandatory for all residents of Qatar. Employers are required to provide health coverage for their employees, while Qatari nationals receive comprehensive coverage through government schemes. The National Health Insurance Company (Daman Health, previously Seha) administers much of the public insurance infrastructure.</p>

<h3>Insurance for Expats</h3>
<p>Expatriate residents typically receive employer-sponsored health insurance. Plans vary widely — from basic packages covering outpatient visits and emergency care to premium plans with dental, optical, and international evacuation coverage. Most large employers provide family coverage, though some require employees to pay a supplement for dependants.</p>
<p>When selecting a plan, verify that your preferred hospitals and clinics are within the insurer's network. Most major private hospitals in Doha accept multiple insurance providers, but coverage at HMC facilities may follow different rules depending on your residency status.</p>

<h2>Qatar Council for Healthcare Practitioners (QCHP)</h2>
<p>The <a href="https://www.qchp.org.qa" target="_blank" rel="noopener noreferrer">QCHP</a> licenses and regulates all healthcare professionals practising in Qatar. It maintains a public registry of licensed doctors, nurses, pharmacists, and allied health professionals. Practitioners must complete a verification process, pass dataflow checks, and in many cases sit a professional examination before receiving their licence.</p>
<p>For patients, the QCHP registry is a useful tool for verifying that a practitioner is legitimately licensed to practise in Qatar.</p>

<h2>Emergency Services</h2>
<p>Qatar's emergency medical services are operated by HMC's Ambulance Service. In any medical emergency, dial <strong>999</strong> (or <strong>112</strong> from a mobile phone). Response times in Doha are typically under 12 minutes. The main emergency department at Hamad General Hospital operates around the clock and treats all patients regardless of nationality or insurance status.</p>
<p>For non-life-threatening emergencies, several private hospitals in Doha offer 24-hour urgent care centres, including Al Ahli Hospital, Aster DM Healthcare, and the Turkish Hospital.</p>

<h2>Private Healthcare</h2>
<p>Qatar's private healthcare sector has expanded substantially over the past decade. Major private hospital groups active in the country include Aster DM Healthcare, Al Emadi Hospital, Doha Clinic Hospital, and Al Ahli Hospital. Private providers are particularly strong in specialities such as dermatology, cosmetic surgery, ophthalmology, dentistry, and fertility treatment.</p>
<p>Private consultation fees in Doha typically range from QAR 200–600 for a specialist visit, though fees at premium facilities can be higher. Most private hospitals accept major insurance plans.</p>
<p>Browse the full list of healthcare providers across Qatar on the <a href="/qa/directory">Qatar Healthcare Directory</a>.</p>

<h2>Medical Tourism</h2>
<p>Qatar has invested heavily in positioning itself as a regional medical tourism destination. HMC and Sidra Medicine attract patients from across the Gulf and wider Middle East, particularly for cardiology, oncology, and paediatric care. The country's visa-free entry policy for nationals of over 80 countries, combined with world-class facilities and short wait times, makes it an increasingly attractive option.</p>

<h2>Costs Overview</h2>
<p>Public healthcare at HMC and PHCC facilities is free for Qatari nationals. Expatriate residents with valid health cards pay subsidised rates at public facilities — a typical GP visit at a PHCC health centre costs QAR 100, while specialist outpatient visits at HMC range from QAR 100–300.</p>
<p>In the private sector, expect to pay QAR 200–500 for a GP consultation, QAR 300–800 for specialist visits, and QAR 1,000–3,000 for dental procedures such as root canals or crowns. Prescription medications are available at pharmacies across the country, with prices regulated by the MOPH.</p>
<ul>
  <li><strong>GP visit (public):</strong> QAR 100</li>
  <li><strong>Specialist visit (public):</strong> QAR 100–300</li>
  <li><strong>GP visit (private):</strong> QAR 200–500</li>
  <li><strong>Specialist visit (private):</strong> QAR 300–800</li>
  <li><strong>Emergency room (public):</strong> Free for all residents</li>
</ul>

<h2>Useful Contacts</h2>
<ul>
  <li><strong>Emergency / Ambulance:</strong> 999 (landline) or 112 (mobile)</li>
  <li><strong>MOPH hotline:</strong> 16000</li>
  <li><strong>Hamad Medical Corporation:</strong> +974 4439 4444</li>
  <li><strong>Sidra Medicine:</strong> +974 4003 3333</li>
  <li><strong>PHCC appointment booking:</strong> 107</li>
</ul>

<p>For a comprehensive directory of hospitals, clinics, pharmacies, and specialists in <a href="/qa/directory/doha">Doha</a> and across Qatar, visit the <a href="/qa/directory">Zavis Qatar Healthcare Directory</a>.</p>
`,
  },

  // ── Article 2: Saudi Arabia ───────────────────────────────────────────────
  {
    slug: "saudi-arabia-healthcare-vision-2030-guide",
    title: "Saudi Arabia Healthcare System: Vision 2030 Transformation Guide",
    excerpt:
      "A deep dive into Saudi Arabia's healthcare transformation under Vision 2030 — from health cluster reform and CCHI mandatory insurance to medical cities, privatisation, and the Seha digital platform.",
    category: "market-intelligence",
    tags: ["saudi arabia", "gcc", "vision 2030", "moh", "cchi", "health clusters", "privatization", "guide"],
    authorName: "Zavis Intelligence",
    authorRole: "Healthcare Research",
    isFeatured: true,
    body: `
<h2>A System in Transformation</h2>
<p>Saudi Arabia is undertaking the most ambitious healthcare restructuring programme in the Gulf region. Under Vision 2030 and the Health Sector Transformation Program (HSTP), the Kingdom is moving from a centralised, government-run model to a decentralised, insurance-based system with a growing role for the private sector. Healthcare spending exceeded SAR 190 billion in 2025, representing roughly 7% of GDP — and the trajectory is sharply upward.</p>
<p>For residents, expats, and investors alike, understanding the current state of this transformation is essential. The system is in flux, and the experience of accessing care differs markedly depending on whether you are in Riyadh, Jeddah, or a secondary city.</p>

<h2>Ministry of Health (MOH)</h2>
<p>The <a href="https://www.moh.gov.sa" target="_blank" rel="noopener noreferrer">Ministry of Health</a> remains the dominant force in Saudi healthcare, operating over 280 hospitals and 2,300 primary healthcare centres across the Kingdom. The MOH employs approximately 350,000 healthcare workers and serves as both regulator and service provider — a dual role that the health cluster reform aims to eventually separate.</p>
<p>Under the HSTP, the MOH is shifting its focus toward regulation, policy, and oversight, while operational management of hospitals is being transferred to newly formed health clusters.</p>

<h2>Health Clusters: The New Operating Model</h2>
<p>The cornerstone of Vision 2030's healthcare reform is the establishment of 20 regional health clusters, each functioning as a semi-autonomous entity responsible for all public healthcare delivery within its geographic area. Five clusters were operationalised in the first phase (2021–2023), covering Riyadh, Makkah, Eastern Province, Madinah, and Qassim.</p>
<p>Each cluster integrates hospitals, primary care centres, and public health services under a single management structure, with its own CEO, board of directors, and budget. The goal is to create accountability, reduce bureaucracy, and eventually allow clusters to compete for patients — a model inspired by the UK's NHS trusts.</p>
<p>Cluster performance varies. Riyadh's First Health Cluster has moved fastest, with measurable improvements in appointment wait times and referral efficiency. Other clusters remain in earlier stages of transition.</p>

<h2>SCFHS: Practitioner Licensing</h2>
<p>The <a href="https://www.scfhs.org.sa" target="_blank" rel="noopener noreferrer">Saudi Commission for Health Specialties (SCFHS)</a> is the licensing body for all healthcare professionals in the Kingdom. It administers professional classification exams, manages continuing medical education requirements, and maintains the Saudi medical registry. Foreign-trained practitioners must complete a dataflow verification and, in most cases, pass the Saudi Licensing Examination (SLE) or the equivalent specialty exam.</p>

<h2>Mandatory Health Insurance (CCHI)</h2>
<p>Health insurance has been mandatory for private-sector employees and their dependants since 2006, regulated by the <a href="https://www.cchi.gov.sa" target="_blank" rel="noopener noreferrer">Council of Cooperative Health Insurance (CCHI)</a>. The system covers over 12 million residents through a cooperative insurance model.</p>
<p>Under the expanding mandate, coverage requirements are gradually being extended to additional population segments, including domestic workers, visitors on extended visas, and eventually Saudi nationals (who currently receive free care at MOH facilities). The Unified Mandatory Health Insurance (Daman) programme, announced in 2024, is expected to bring all residents under a single insurance framework.</p>
<p>The minimum benefits package defined by CCHI includes outpatient consultations, inpatient care, maternity, emergency treatment, and prescription medications. Many employers offer enhanced plans covering dental, optical, and wellness services.</p>

<h2>Medical Cities and Referral Centres</h2>
<h3>King Faisal Specialist Hospital & Research Centre (KFSH&RC)</h3>
<p>KFSH&RC in Riyadh is Saudi Arabia's premier tertiary and quaternary care hospital, consistently ranked among the top 200 hospitals globally. It leads in oncology, organ transplantation (the largest liver transplant programme in the Middle East), cardiology, and rare disease treatment.</p>

<h3>King Abdulaziz Medical City (KAMC)</h3>
<p>Operated by the Ministry of National Guard — Health Affairs, KAMC campuses in Riyadh, Jeddah, and Al Ahsa serve as major teaching hospitals and trauma centres. The Riyadh campus alone has over 1,500 beds.</p>

<h3>Other Key Facilities</h3>
<ul>
  <li><strong>King Fahad Medical City (KFMC):</strong> A 1,200-bed complex in Riyadh with specialised centres for neuroscience, cardiac care, and rehabilitation</li>
  <li><strong>Johns Hopkins Aramco Healthcare:</strong> Operating in the Eastern Province, serving Saudi Aramco employees and their families with American-standard care</li>
  <li><strong>Dr. Sulaiman Al Habib Medical Group:</strong> The largest private hospital chain, with 20+ facilities across the Kingdom</li>
  <li><strong>Mouwasat Medical Services:</strong> A publicly listed private healthcare group with hospitals in Dammam, Riyadh, Jubail, Qassim, and Madinah</li>
</ul>

<h2>The Seha Digital Platform</h2>
<p>The <a href="https://www.moh.gov.sa/en/eServices" target="_blank" rel="noopener noreferrer">Seha platform</a> is Saudi Arabia's national digital health gateway. It provides virtual consultations, appointment booking at MOH facilities, electronic prescriptions, medical record access, and COVID-19 vaccination certificates. During the pandemic, Seha processed over 40 million virtual consultations, establishing it as one of the most widely used telehealth platforms in the region.</p>
<p>The Tawakkalna app, initially developed for COVID-19, has evolved into a broader digital health identity tool, integrating with Seha for authentication and health status verification.</p>

<h2>Privatisation and Investment</h2>
<p>Vision 2030 targets increasing the private sector's share of healthcare spending from 25% to 35%. The Public Investment Fund (PIF) has taken stakes in multiple healthcare companies, and several MOH hospitals are being converted to private or public-private partnership models.</p>
<p>Major recent developments include the IPO of Dr. Sulaiman Al Habib Medical Group, the expansion of Nahdi Medical Company's retail pharmacy network, and the entry of international operators like Mediclinic, Cleveland Clinic, and Mayo Clinic through advisory partnerships.</p>
<p>For investors and operators, the opportunities are substantial — but navigating the regulatory landscape requires local expertise.</p>

<h2>Costs Overview</h2>
<p>At MOH public hospitals, care is free for Saudi nationals. Insured expatriates pay according to their plan terms, typically with co-pays of 10–20%. Uninsured patients at private facilities pay out of pocket.</p>
<ul>
  <li><strong>GP visit (private):</strong> SAR 150–400</li>
  <li><strong>Specialist visit (private):</strong> SAR 300–800</li>
  <li><strong>Emergency room (public):</strong> Free for nationals; covered by insurance for residents</li>
  <li><strong>Dental cleaning (private):</strong> SAR 200–500</li>
  <li><strong>MRI scan (private):</strong> SAR 1,500–3,500</li>
</ul>

<h2>Medical Tourism</h2>
<p>Saudi Arabia is actively courting medical tourists, particularly from other GCC and African countries. The Saudi Tourism Authority launched a dedicated medical tourism visa in 2023, and KFSH&RC has established an international patient department. The Kingdom targets 500,000 medical tourists annually by 2030.</p>
<p>Browse healthcare providers across Saudi Arabia — from <a href="/sa/directory/riyadh">Riyadh</a> to <a href="/sa/directory/jeddah">Jeddah</a> and <a href="/sa/directory/dammam">Dammam</a> — in the <a href="/sa/directory">Zavis Saudi Arabia Healthcare Directory</a>.</p>

<h2>Useful Contacts</h2>
<ul>
  <li><strong>Emergency / Ambulance:</strong> 997</li>
  <li><strong>MOH helpline (Sehha):</strong> 937</li>
  <li><strong>CCHI enquiries:</strong> 920001177</li>
  <li><strong>SCFHS:</strong> 920019393</li>
  <li><strong>Poison Control Centre:</strong> +966 11 411 1111</li>
</ul>
`,
  },

  // ── Article 3: Bahrain ────────────────────────────────────────────────────
  {
    slug: "bahrain-healthcare-nhra-guide",
    title: "Bahrain Healthcare Guide: NHRA Regulations & Provider Directory",
    excerpt:
      "A practical guide to Bahrain's healthcare system — covering the NHRA's regulatory role, SIO health coverage, key hospitals, dental tourism, and what expats need to know about accessing care.",
    category: "regulatory",
    tags: ["bahrain", "gcc", "nhra", "sio", "health insurance", "dental tourism", "guide"],
    authorName: "Zavis Intelligence",
    authorRole: "Healthcare Research",
    isFeatured: true,
    body: `
<h2>Healthcare in Bahrain: A Compact, Accessible System</h2>
<p>Bahrain's healthcare system punches well above its weight. For a nation of 1.5 million people, it delivers a remarkably broad range of medical services, with a mix of government-run hospitals, military medical facilities, and a vibrant private sector. Healthcare spending represents roughly 5% of GDP, and the government has maintained its commitment to providing free or heavily subsidised care for Bahraini nationals even as it works to expand insurance coverage and private-sector participation.</p>
<p>The country's small size is an advantage — no point on the island is more than 30 minutes from a major hospital, and most healthcare facilities are concentrated in and around Manama.</p>

<h2>National Health Regulatory Authority (NHRA)</h2>
<p>The <a href="https://www.nhra.bh" target="_blank" rel="noopener noreferrer">NHRA</a> is Bahrain's independent healthcare regulator, established under Royal Decree 38 of 2009. It licenses all healthcare facilities and practitioners, inspects facilities for compliance, handles patient complaints, and sets quality standards. The NHRA maintains a publicly searchable register of licensed healthcare professionals and facilities — a transparency measure that few countries in the region match.</p>
<p>All healthcare professionals practising in Bahrain must hold a valid NHRA licence, which requires credential verification, relevant experience, and in some cases a professional competency assessment.</p>

<h2>Health Insurance and the SIO</h2>
<h3>Social Insurance Organisation (SIO)</h3>
<p>The <a href="https://www.sio.gov.bh" target="_blank" rel="noopener noreferrer">SIO</a> administers Bahrain's social protection system, which includes a health benefit scheme. Bahraini nationals receive coverage for treatment at government hospitals and health centres through the SIO framework. The scheme covers outpatient consultations, inpatient care, medications, and most diagnostic procedures at public facilities.</p>

<h3>Expat Health Insurance</h3>
<p>For expatriates, health insurance is not yet universally mandatory in Bahrain, though legislation has been moving in that direction. Most employers provide health coverage as part of the employment package, and it is required for visa renewal. The private insurance market is competitive, with major providers including GIG Bahrain, Solidarity, BUPA Arabia, and MedGulf.</p>
<p>Expats without insurance can access government health centres for a fee (typically BD 7–15 per visit) or use the private sector at full rates.</p>

<h2>Key Hospitals and Medical Facilities</h2>
<h3>Salmaniya Medical Complex</h3>
<p>Salmaniya is Bahrain's largest government hospital, with over 1,000 beds and comprehensive services spanning 33 medical specialties. It serves as the main teaching hospital for the Arabian Gulf University and the RCSI-Bahrain medical school. The facility handles the majority of the country's emergency cases and complex surgical procedures.</p>

<h3>Bahrain Defence Force Hospital (BDF)</h3>
<p>The BDF Hospital, also known as the Royal Medical Services hospital, is a 400-bed military hospital that also serves civilian patients. It is particularly well-regarded for cardiac surgery, orthopaedics, and oncology. The hospital has JCI accreditation and operates a dedicated medical tourism unit.</p>

<h3>Royal Bahrain Hospital</h3>
<p>A leading private hospital in the Kingdom, Royal Bahrain Hospital offers a wide range of services including a 24-hour emergency department, advanced imaging, and specialised centres for cardiology, bariatric surgery, and IVF. It is part of the Bahrain Specialist Hospital Group.</p>

<h3>King Hamad University Hospital</h3>
<p>A modern government facility opened in 2012, King Hamad University Hospital provides secondary and tertiary care with 311 beds. It has invested heavily in digital health infrastructure and serves as a teaching facility.</p>

<h3>American Mission Hospital</h3>
<p>Founded in 1902, the American Mission Hospital is the oldest hospital in Bahrain and one of the oldest in the Gulf. It operates as a private hospital with strong community ties and a reputation for quality primary and secondary care.</p>

<h2>Primary Care</h2>
<p>Bahrain's government operates 28 health centres across the four governorates, providing primary care, maternal and child health, chronic disease management, dental services, and vaccinations. Registration is based on area of residence. These centres are staffed by general practitioners and nurses and serve as the first point of contact for non-emergency medical needs.</p>
<p>Private polyclinics and medical centres complement the government network, particularly for dental care, dermatology, and specialist consultations.</p>

<h2>Dental Tourism</h2>
<p>Bahrain has become a popular destination for dental tourism within the GCC, particularly for patients from Saudi Arabia's Eastern Province (a 25-minute drive across the King Fahd Causeway). Dental implants, veneers, and cosmetic dentistry are available at competitive prices — typically 30–50% less than equivalent procedures in the UAE, with short wait times and high-quality practitioners.</p>
<p>Many dental clinics in Bahrain cater specifically to GCC visitors, offering weekend appointments and Arabic-English bilingual staff.</p>

<h2>Costs Overview</h2>
<ul>
  <li><strong>GP visit (government health centre):</strong> Free for nationals; BD 7 for expats</li>
  <li><strong>Specialist visit (private):</strong> BD 15–40</li>
  <li><strong>Emergency room (Salmaniya):</strong> Free for all residents</li>
  <li><strong>Dental cleaning (private):</strong> BD 15–30</li>
  <li><strong>Dental implant (private):</strong> BD 350–700</li>
  <li><strong>MRI scan (private):</strong> BD 150–350</li>
</ul>

<h2>Useful Contacts</h2>
<ul>
  <li><strong>Emergency / Ambulance:</strong> 999</li>
  <li><strong>MOH helpline:</strong> 444 (within Bahrain)</li>
  <li><strong>Salmaniya Medical Complex:</strong> +973 1728 8888</li>
  <li><strong>BDF Hospital:</strong> +973 1776 6666</li>
  <li><strong>NHRA:</strong> +973 1789 5454</li>
</ul>

<p>Find hospitals, clinics, pharmacies, and specialists across Bahrain in the <a href="/bh/directory">Zavis Bahrain Healthcare Directory</a>, including providers in <a href="/bh/directory/manama">Manama</a>, <a href="/bh/directory/riffa">Riffa</a>, and <a href="/bh/directory/muharraq">Muharraq</a>.</p>
`,
  },

  // ── Article 4: Kuwait ─────────────────────────────────────────────────────
  {
    slug: "kuwait-healthcare-system-guide-2026",
    title: "Kuwait Healthcare System: Guide for Citizens & Expats [2026]",
    excerpt:
      "A practical guide to navigating Kuwait's healthcare system in 2026 — covering the MOH structure, AFIYA insurance, public vs. private care, key hospitals, expat health requirements, and emergency services.",
    category: "regulatory",
    tags: ["kuwait", "gcc", "moh", "afiya", "health insurance", "expat healthcare", "guide"],
    authorName: "Zavis Intelligence",
    authorRole: "Healthcare Research",
    isFeatured: true,
    body: `
<h2>Overview of Kuwait's Healthcare System</h2>
<p>Kuwait's healthcare system is built on a foundation of generous government provision. The Ministry of Health (MOH) operates the majority of hospitals and polyclinics in the country, and Kuwaiti citizens receive free or near-free care at public facilities. The private sector has grown substantially over the past decade, driven by demand from the country's 3.3 million expatriate population (who make up roughly 70% of total residents) and by Kuwaitis seeking shorter wait times and premium amenities.</p>
<p>Total healthcare spending in Kuwait exceeds KWD 2.5 billion annually. The government has been working to introduce structural reforms, including mandatory health insurance for expatriates, to improve efficiency and reduce the fiscal burden on the public system.</p>

<h2>Ministry of Health (MOH) Structure</h2>
<p>The <a href="https://www.moh.gov.kw" target="_blank" rel="noopener noreferrer">MOH</a> is the primary regulator, funder, and operator of public healthcare in Kuwait. It oversees six health regions corresponding to the country's six governorates (Capital, Hawalli, Farwaniya, Ahmadi, Jahra, and Mubarak Al-Kabeer), each with its own regional health directorate.</p>
<p>The MOH operates 17 public hospitals, over 100 primary healthcare centres (polyclinics), and several specialised centres. It also licenses all private healthcare facilities, pharmacies, and practitioners.</p>

<h2>AFIYA Health Insurance System</h2>
<p>Kuwait's AFIYA health insurance programme, launched for expatriates, requires all non-Kuwaiti residents to maintain valid health insurance. The programme was designed to shift the cost of expatriate healthcare away from the public purse and toward employer-funded insurance.</p>
<p>Under AFIYA, expatriates receive a health insurance card that grants access to a network of designated hospitals and clinics. Coverage includes outpatient visits, inpatient care, emergency treatment, maternity, and prescription medications. The annual premium is set by the government and is typically paid by the employer as part of the residency permit process.</p>
<p>Kuwaiti citizens continue to receive free healthcare at MOH facilities and are not required to participate in the AFIYA programme. Many Kuwaiti families also carry supplementary private insurance for access to premium private hospitals.</p>

<h2>Public vs. Private Healthcare</h2>
<h3>Public Sector</h3>
<p>MOH hospitals and polyclinics provide comprehensive care at no direct cost to Kuwaiti citizens. Expatriates with AFIYA coverage can access designated public facilities, though they may face longer wait times. The public system is strongest in emergency medicine, obstetrics, and chronic disease management.</p>
<p>Primary care is delivered through a network of over 100 polyclinics, with each residential area assigned to a specific centre. Patients register at their area polyclinic and are referred to hospitals for specialist or inpatient care as needed.</p>

<h3>Private Sector</h3>
<p>Kuwait's private healthcare market includes over 15 private hospitals, hundreds of polyclinics, and a growing number of specialist centres. The private sector attracts patients with shorter wait times, newer facilities, and a broader range of elective and cosmetic procedures.</p>
<p>Major private hospitals include Dar Al Shifa Hospital, Hadi Hospital, Taiba Hospital, Al Salam International Hospital, and New Mowasat Hospital. Several of these hold JCI accreditation.</p>

<h2>Key Hospitals</h2>
<h3>Al-Amiri Hospital</h3>
<p>Al-Amiri Hospital, located in Kuwait City, is one of the country's oldest and most respected public hospitals. It operates as a general hospital with strong departments in internal medicine, surgery, and cardiology.</p>

<h3>Mubarak Al-Kabeer Hospital</h3>
<p>Mubarak Al-Kabeer is a major teaching hospital affiliated with Kuwait University's Faculty of Medicine. It serves as a referral centre for complex cases and has well-established programmes in nephrology, gastroenterology, and haematology.</p>

<h3>Chest Diseases Hospital</h3>
<p>A specialised MOH facility focused on pulmonology, thoracic surgery, and respiratory medicine. It served as a key facility during the COVID-19 pandemic.</p>

<h3>Kuwait Cancer Control Centre (KCCC)</h3>
<p>The KCCC is the national referral centre for oncology, providing chemotherapy, radiation therapy, surgical oncology, and palliative care. It treats both Kuwaiti nationals and referred patients from across the public system.</p>

<h2>Health Requirements for Expats</h2>
<p>All expatriates entering Kuwait for employment must undergo a medical fitness examination, which includes blood tests (HIV, hepatitis B and C, syphilis), a chest X-ray for tuberculosis, and a general physical examination. This examination is conducted at government-designated medical centres and must be completed as part of the residency visa process.</p>
<p>The medical check is also required for residency renewal. Expats found to have certain communicable diseases may face deportation under Kuwaiti health law. Annual health check-ups are recommended for workers in food handling, education, and healthcare sectors.</p>

<h2>Emergency Services</h2>
<p>In any medical emergency, dial <strong>112</strong>. Kuwait's ambulance service, operated by the MOH, responds across all governorates. Public hospital emergency departments operate 24 hours a day and treat all patients regardless of nationality.</p>
<p>For non-emergency situations, the MOH operates a health hotline at <strong>151</strong> for medical advice and appointment booking.</p>
<p>Major private hospitals with 24-hour emergency departments include Dar Al Shifa, New Mowasat, and Al Salam International Hospital.</p>

<h2>Pharmacy Regulations</h2>
<p>Pharmacies in Kuwait are strictly regulated by the MOH. Prescription medications require a valid doctor's prescription, and the MOH maintains a list of controlled substances that cannot be imported or possessed without specific authorisation. This includes many medications that are available over the counter in Western countries — including codeine, tramadol, and certain psychiatric medications.</p>
<p>Travellers arriving in Kuwait with prescribed medications should carry the original prescription and a letter from their doctor. Failure to do so can result in confiscation of medications or, in some cases, legal complications.</p>
<p>Pharmacies are widely available across residential areas, and many operate extended hours. Major pharmacy chains include Al Mutawa Pharmacy, Salmiya Pharmacy, and branches of international chains.</p>

<h2>Costs Overview</h2>
<ul>
  <li><strong>GP visit (public polyclinic):</strong> Free for Kuwaitis; KWD 2 for AFIYA-covered expats</li>
  <li><strong>Specialist visit (private):</strong> KWD 15–40</li>
  <li><strong>Emergency room (public):</strong> Free for all</li>
  <li><strong>Dental cleaning (private):</strong> KWD 10–25</li>
  <li><strong>MRI scan (private):</strong> KWD 100–250</li>
</ul>

<h2>Useful Contacts</h2>
<ul>
  <li><strong>Emergency / Ambulance:</strong> 112</li>
  <li><strong>MOH Health Hotline:</strong> 151</li>
  <li><strong>MOH main switchboard:</strong> +965 2484 8075</li>
  <li><strong>Mubarak Al-Kabeer Hospital:</strong> +965 2531 2700</li>
  <li><strong>Al-Amiri Hospital:</strong> +965 2245 0005</li>
</ul>

<p>Explore the full range of healthcare providers across Kuwait — from hospitals in <a href="/kw/directory/kuwait-city">Kuwait City</a> to clinics in <a href="/kw/directory/hawalli">Hawalli</a> and <a href="/kw/directory/salmiya">Salmiya</a> — in the <a href="/kw/directory">Zavis Kuwait Healthcare Directory</a>.</p>
`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const connString =
    process.env.DATABASE_URL ||
    "postgresql://zavis_admin@localhost:5432/zavis_landing";
  const pool = new Pool({ connectionString: connString });

  try {
    console.log("Connecting to database...");
    await pool.query("SELECT 1");
    console.log("Connected.\n");

    let inserted = 0;
    let skipped = 0;

    for (const article of articles) {
      const id = `art_${generateId()}`;
      const readMinutes = readTime(article.body);

      console.log(`Inserting: ${article.title}`);
      console.log(`  Slug: ${article.slug}`);
      console.log(`  Category: ${article.category}`);
      console.log(`  Read time: ~${readMinutes} min`);

      const result = await pool.query(
        `INSERT INTO journal_articles (
          id, slug, title, excerpt, body, category, tags,
          source, author_name, author_role,
          is_featured, is_breaking, read_time_minutes,
          status, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, NOW(), NOW(), NOW()
        )
        ON CONFLICT (slug) DO NOTHING`,
        [
          id,
          article.slug,
          article.title,
          article.excerpt,
          article.body.trim(),
          article.category,
          JSON.stringify(article.tags),
          "original",
          article.authorName,
          article.authorRole,
          article.isFeatured || false,
          false,
          readMinutes,
          "published",
        ]
      );

      if (result.rowCount > 0) {
        inserted++;
        console.log("  -> Inserted successfully.\n");
      } else {
        skipped++;
        console.log("  -> Skipped (slug already exists).\n");
      }
    }

    console.log("─".repeat(60));
    console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
    console.log(`Total articles in table:`);
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM journal_articles WHERE status = 'published'"
    );
    console.log(`  ${rows[0].count} published articles`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
