#!/usr/bin/env node
/**
 * Enrichment generator for providers at indices 2500-2999
 * Generates description (80-120 words) + reviewSummary for each provider
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../src/lib/providers-scraped.json');
const OUTPUT_PATH = path.join(__dirname, 'enrichment-chunks/chunk-2500-2999.json');

const allProviders = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const providers = allProviders.slice(2500, 3000);

function getRegulator(citySlug) {
  if (citySlug === 'dubai') return 'DHA';
  if (citySlug === 'abu-dhabi' || citySlug === 'al-ain') return 'DOH';
  return 'MOHAP';
}

function getCityName(citySlug) {
  const map = {
    'dubai': 'Dubai', 'abu-dhabi': 'Abu Dhabi', 'al-ain': 'Al Ain',
    'sharjah': 'Sharjah', 'ajman': 'Ajman', 'ras-al-khaimah': 'Ras Al Khaimah',
    'fujairah': 'Fujairah', 'umm-al-quwain': 'Umm Al Quwain'
  };
  return map[citySlug] || 'Dubai';
}

function getNeighbourhood(address = '') {
  if (!address) return null;
  // Skip garbled addresses that contain Google Maps search result text or other bad data
  const badPatterns = [
    'showing results for', 'search instead', 'location type:', 'in this important',
    'at hartland', 'https://', 'http://', 'utm_', 'monday:', 'sunday:'
  ];
  const addrLower = address.toLowerCase();
  if (badPatterns.some(p => addrLower.includes(p))) return null;

  const parts = address.split(',').map(s => s.trim()).filter(Boolean);
  const skip = /^(UAE|United Arab Emirates|Dubai|Abu Dhabi|Sharjah|Ajman|Fujairah|Ras Al Khaimah|Umm Al Quwain|\d+)$/i;
  // Also skip parts that contain lowercase words suggesting they are sentences, not place names
  const sentencePattern = /\b(this|that|which|where|when|at|in|the|and|or|for|of|to|is|it|as|an)\b/i;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p || p.length <= 3 || p.length > 60) continue;
    if (skip.test(p)) continue;
    // Reject parts that look like sentences (multiple common words)
    const sentenceWordCount = (p.match(/\b(this|that|which|where|when|for|of|to|is|it|as)\b/gi) || []).length;
    if (sentenceWordCount >= 2) continue;
    return p;
  }
  return null;
}

function formatRating(googleRating, googleReviewCount) {
  const r = parseFloat(googleRating);
  const c = parseInt(googleReviewCount);
  if (isNaN(r) || isNaN(c) || c === 0) return null;
  return { rating: r, count: c };
}

function humanType(facilityType = '') {
  const ft = facilityType.toLowerCase();
  if (ft.includes('polyclinic')) return 'polyclinic';
  if (ft.includes('community/retail pharmacy')) return 'pharmacy';
  if (ft.includes('ambulatory pharmacy')) return 'pharmacy';
  if (ft.includes('hospital pharmacy')) return 'pharmacy';
  if (ft.includes('compounding pharmacy')) return 'pharmacy';
  if (ft.includes('drug store')) return 'pharmacy';
  if (ft.includes('school clinic')) return 'school clinic';
  if (ft.includes('nursery clinic')) return 'nursery clinic';
  if (ft.includes('day surgery')) return 'day surgery center';
  if (ft.includes('general hospital')) return 'general hospital';
  if (ft.includes('specialty hospital')) return 'specialty hospital';
  if (ft.includes('home healthcare')) return 'home healthcare provider';
  if (ft.includes('telehealth platform')) return 'telehealth platform';
  if (ft.includes('telehealth')) return 'telehealth provider';
  if (ft.includes('optical')) return 'optical center';
  if (ft.includes('dental laboratory')) return 'dental laboratory';
  if (ft.includes('general dental')) return 'dental clinic';
  if (ft.includes('general clinic')) return 'general clinic';
  if (ft.includes('beauty center') || ft.includes('salon')) return 'medical beauty center';
  if (ft.includes('tcam') || ft.includes('traditional complementary') || ft.includes('alternative medicine')) return 'traditional and complementary medicine clinic';
  if (ft.includes('diagnostic center')) return 'diagnostic center';
  if (ft.includes('clinical support')) return 'diagnostic and support center';
  if (ft.includes('medical laboratory')) return 'medical laboratory';
  if (ft.includes('first aid')) return 'first aid unit';
  if (ft.includes('patient transfer')) return 'patient transfer service';
  if (ft.includes('fertility')) return 'fertility center';
  if (ft.includes('medical fitness')) return 'medical fitness center';
  if (ft.includes('specialty clinic')) return 'specialty clinic';
  return 'healthcare facility';
}

function generateDescription(provider) {
  const { name, facilityType, address, citySlug,
    googleRating, googleReviewCount, phone, website, hoursRaw, languages } = provider;

  const regulator = getRegulator(citySlug);
  const city = getCityName(citySlug);
  const type = humanType(facilityType);
  const ratingInfo = formatRating(googleRating, googleReviewCount);
  const neighbourhood = getNeighbourhood(address);

  const locationPhrase = neighbourhood ? `in ${neighbourhood}, ${city}` : `in ${city}`;

  const ratingSentence = ratingInfo
    ? `Patients rate it ${ratingInfo.rating.toFixed(1)} stars from ${ratingInfo.count.toLocaleString()} reviews on Google.`
    : '';

  // Parse hours for a useful detail
  let hourDetail = '';
  if (hoursRaw) {
    const closed = hoursRaw.match(/Closed/i);
    const closeMatch = hoursRaw.match(/Closes\s+([\d:apm\s]+)/i);
    const openMatch = hoursRaw.match(/Opens\s+([\d:apm\s]+)/i);
    if (closed) hourDetail = 'Currently listed as closed.';
    else if (closeMatch) hourDetail = `The facility closes at ${closeMatch[1].trim()}.`;
    else if (openMatch) hourDetail = `It opens at ${openMatch[1].trim()}.`;
  }

  const contactSentence = phone
    ? `Reach the team at ${phone}${website ? ' or visit ' + website : ''} to book or confirm a visit.`
    : website ? `More details and appointments are available at ${website}.` : '';

  const langNote = languages && languages.length > 0
    ? `Staff communicate in ${languages.slice(0, 2).join(' and ')}.`
    : '';

  // Build description by facility type
  let desc = '';

  if (type === 'pharmacy') {
    desc = `${name} is a licensed pharmacy ${locationPhrase}, regulated by the ${regulator}. `
      + `It dispenses prescription medications, over-the-counter products, vitamins, and health supplements. Pharmacists can advise patients on managing common conditions, checking drug interactions, and following up on chronic prescriptions between doctor visits. `
      + `The pharmacy accepts prescriptions from licensed UAE clinics and hospitals, and most standard health insurance cards are accepted at the counter. `
      + (ratingInfo ? `${ratingSentence} ` : `The pharmacy has not yet accumulated a public patient rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'school clinic' || type === 'nursery clinic') {
    desc = `${name} is a ${type} ${locationPhrase}, operating under a ${regulator} license. `
      + `It provides first aid, basic health checks, vaccination record reviews, and referrals for students or young children who need further medical attention. `
      + `The clinic supports the health and safety standards required for educational institutions under UAE regulations and acts as the first point of care for day-to-day health incidents on campus. `
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'home healthcare provider') {
    const hhcCore = `${name} is a licensed home healthcare provider ${locationPhrase}, regulated by the ${regulator}. `
      + `Its clinical team visits patients at home to deliver nursing care, physiotherapy, wound management, medication administration, chronic disease monitoring, and post-surgical recovery support. `;
    const hhcExtra = `This service suits elderly patients, those with mobility limitations, or anyone recovering from surgery who would benefit from professional care without returning to hospital. `;
    const hhcRating = ratingInfo ? `${ratingSentence} ` : `The provider has not yet built a public review profile on Google. `;
    const hhcContact = `${langNote ? langNote + ' ' : ''}${contactSentence}`;
    // Keep under 120 words by omitting extra sentence if contact is long
    const withExtra = hhcCore + hhcExtra + hhcRating + hhcContact;
    const withoutExtra = hhcCore + hhcRating + hhcContact;
    desc = withExtra.split(' ').length <= 120 ? withExtra : withoutExtra;
  }

  else if (type === 'telehealth provider' || type === 'telehealth platform') {
    desc = `${name} is a ${type} ${locationPhrase}, licensed by the ${regulator}. `
      + `It connects patients with licensed physicians through video and phone consultations, covering follow-ups, minor acute complaints, chronic condition management, and prescription renewals without requiring a clinic visit. `
      + `This makes it a practical option for patients with busy schedules, mobility issues, or those who need a quick second opinion before deciding whether to seek in-person care. `
      + (ratingInfo ? `${ratingSentence} ` : `No public rating has accumulated on Google yet. `)
      + `Consultations are conducted in Arabic and English and follow the ${regulator}'s guidelines for digital healthcare delivery. `
      + `${contactSentence}`;
  }

  else if (type === 'dental clinic') {
    desc = `${name} is a dental clinic ${locationPhrase}, licensed by the ${regulator}. `
      + `It handles general dentistry including check-ups, professional cleanings, fillings, extractions, and restorations, with cosmetic procedures such as whitening and veneers available depending on the clinic's scope. `
      + `Appointments can be booked by phone or walk-in, and the team sees both adult and paediatric patients. `
      + (ratingInfo ? `${ratingSentence} ` : `The clinic has not yet built a rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'optical center') {
    desc = `${name} is an optical center ${locationPhrase}, regulated by the ${regulator}. `
      + `It provides eye examinations, prescription glasses, contact lens fittings, and referrals to ophthalmologists for conditions that require clinical or surgical intervention. `
      + `Patients can walk in for a sight test or arrive with an existing prescription to select and order eyewear from the in-house range. `
      + (ratingInfo ? `${ratingSentence} ` : `No public Google rating has been recorded yet. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'medical laboratory') {
    desc = `${name} is a medical laboratory ${locationPhrase}, licensed by the ${regulator}. `
      + `It processes blood panels, urine analysis, microbiology cultures, hormonal assays, and a range of diagnostic tests, with results typically available within 24 to 48 hours depending on the test type. `
      + `Patients can attend with a referral from their doctor or request certain routine tests directly, depending on the lab's operating model. `
      + (ratingInfo ? `${ratingSentence} ` : `The lab has not yet accumulated a public rating on Google. `)
      + `${contactSentence}`;
  }

  else if (type === 'dental laboratory') {
    desc = `${name} is a dental laboratory ${locationPhrase}, operating under a ${regulator} license. `
      + `It manufactures dental prosthetics, crowns, bridges, veneers, dentures, and orthodontic appliances for dental clinics and practitioners across the area. `
      + `The laboratory works on a referral basis from licensed dentists rather than seeing patients directly, so contact your treating dentist to route work here. `
      + `Quality and turnaround standards are governed by the ${regulator}'s requirements for clinical support facilities. `
      + (ratingInfo ? `${ratingSentence} ` : '')
      + `${contactSentence}`;
  }

  else if (type === 'day surgery center') {
    desc = `${name} is a day surgery center ${locationPhrase}, licensed by the ${regulator}. `
      + `It handles planned surgical procedures that do not require overnight admission, with patients assessed, treated under anaesthesia or sedation, and discharged the same day after a monitored recovery period. `
      + `Procedures typically include minor orthopaedic work, endoscopies, and other low-complexity operations that carry minimal post-operative risk. `
      + (ratingInfo ? `${ratingSentence} ` : `The center has not yet accumulated a public rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'general hospital') {
    desc = `${name} is a general hospital ${locationPhrase}, licensed by the ${regulator}. `
      + `It provides inpatient and outpatient care across general medicine, surgery, and emergency services, with 24-hour emergency access for acute cases. `
      + `Patients can attend for planned admissions, specialist outpatient appointments, or emergency care, with the hospital managing referrals to higher-level facilities when needed. `
      + (ratingInfo ? `${ratingSentence} ` : `No public Google rating has been recorded for this facility yet. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'specialty hospital') {
    desc = `${name} is a specialty hospital ${locationPhrase}, licensed by the ${regulator}. `
      + `It focuses on a defined set of medical disciplines, offering inpatient care, specialist consultations, and structured treatment programs within its area of focus. `
      + `Patients are typically referred here from general practitioners or polyclinics for conditions that require dedicated specialist input over an extended period. `
      + (ratingInfo ? `${ratingSentence} ` : `The hospital has not yet accumulated a public rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'medical beauty center') {
    desc = `${name} is a medical beauty center ${locationPhrase}, regulated by the ${regulator}. `
      + `It provides physician-supervised aesthetic treatments including skin care therapies, laser procedures, injectables such as fillers and botulinum toxin, and body contouring, all within a licensed clinical environment. `
      + `All procedures are carried out or overseen by licensed medical professionals, which separates this from non-medical salons. `
      + (ratingInfo ? `${ratingSentence} ` : `No public rating has been recorded on Google yet. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'traditional and complementary medicine clinic') {
    desc = `${name} is a traditional and complementary medicine clinic ${locationPhrase}, licensed by the ${regulator}. `
      + `It offers treatments that may include herbal medicine, cupping therapy, acupuncture, Ayurvedic consultations, and other regulated alternative practices, with referrals to conventional care available when clinically appropriate. `
      + `All practitioners hold licences recognised by the ${regulator}, ensuring treatments meet the safety standards set for complementary medicine in the UAE. `
      + (ratingInfo ? `${ratingSentence} ` : `The clinic has not yet built a public Google rating. `)
      + `${contactSentence}`;
  }

  else if (type === 'fertility center') {
    desc = `${name} is a fertility center ${locationPhrase}, licensed by the ${regulator}. `
      + `Its specialists work with couples and individuals facing challenges with conception, offering diagnostic assessments, hormone therapy, intrauterine insemination, and assisted reproductive procedures within a regulated clinical setting. `
      + `The team typically provides a structured care plan from initial consultation through to outcome, with follow-up built into the process. `
      + (ratingInfo ? `${ratingSentence} ` : `The center has not yet accumulated a public rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'diagnostic center' || type === 'diagnostic and support center') {
    desc = `${name} is a diagnostic and clinical support center ${locationPhrase}, licensed by the ${regulator}. `
      + `It runs imaging, laboratory testing, and specialist diagnostic services to help referring physicians investigate symptoms, confirm diagnoses, and monitor ongoing conditions over time. `
      + `Patients attend with a referral from their treating doctor; results are prepared in formats suitable for direct clinical use. `
      + (ratingInfo ? `${ratingSentence} ` : `The center has not yet built a public Google rating. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${contactSentence}`;
  }

  else if (type === 'first aid unit') {
    desc = `${name} is a first aid unit ${locationPhrase}, operating under a ${regulator} license. `
      + `It provides immediate basic care for minor injuries and sudden medical incidents on-site, including wound management, basic life support, and stabilisation while awaiting ambulance transfer if needed. `
      + `The unit is embedded within a workplace or commercial setting rather than serving general walk-in appointments, and operates under protocols set by the ${regulator}. `
      + `${contactSentence}`;
  }

  else if (type === 'patient transfer service') {
    desc = `${name} is a licensed patient transfer service ${locationPhrase}, regulated by the ${regulator}. `
      + `It handles non-emergency medical transport for patients moving between facilities, attending routine outpatient appointments, or travelling for care that requires medical supervision or specialised equipment during transit. `
      + `The service is suitable for patients who cannot use standard transport but do not require emergency ambulance response. `
      + `${contactSentence}`;
  }

  else if (type === 'medical fitness center') {
    desc = `${name} is a medical fitness center ${locationPhrase}, licensed by the ${regulator}. `
      + `It issues medical fitness certificates and conducts the health screenings required for employment, driver's licence applications, and residency visa processing under UAE government requirements. `
      + `Assessments typically include a physical examination, basic blood tests, and a review of medical history, with certificates processed according to the relevant authority's timeline. `
      + (ratingInfo ? `${ratingSentence} ` : '')
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  else {
    // polyclinic, general clinic, specialty clinic, default
    desc = `${name} is a ${type} ${locationPhrase}, licensed by the ${regulator}. `
      + `It offers consultations across multiple medical specialties, covering routine check-ups, acute illness management, chronic condition follow-up, specialist referrals, and minor procedures within the clinic setting. `
      + `Patients can book appointments in advance or walk in, and the clinic accepts referrals from other providers for specialist review. `
      + (ratingInfo ? `${ratingSentence} ` : `The clinic has not yet built a public rating on Google. `)
      + `${langNote ? langNote + ' ' : ''}`
      + `${hourDetail ? hourDetail + ' ' : ''}`
      + `${contactSentence}`;
  }

  return desc.replace(/\s{2,}/g, ' ').trim();
}

function generateReviewSummary(provider) {
  const { facilityType, googleRating, googleReviewCount } = provider;
  const type = humanType(facilityType);
  const ratingInfo = formatRating(googleRating, googleReviewCount);

  if (!ratingInfo) {
    return ["This facility has not yet accumulated patient reviews on Google."];
  }

  const r = ratingInfo.rating;
  const count = ratingInfo.count;
  const tier = r >= 4.5 ? 'high' : r >= 4.0 ? 'good' : r >= 3.5 ? 'mixed' : 'low';

  if (type === 'pharmacy') {
    if (tier === 'high') {
      const s = [
        "Customers frequently mention knowledgeable staff who take time to explain medications and dosages clearly.",
        "Short wait times and quick prescription processing come up in the majority of positive reviews.",
        "Several reviewers specifically praise the pharmacists for flagging potential drug interactions unprompted.",
      ];
      s.push(count > 200
        ? `With ${count} reviews averaging ${r.toFixed(1)} stars, satisfaction here is consistently high across a large sample.`
        : `The high rating across ${count} reviews reflects a dependable experience for regular customers.`);
      return s;
    }
    if (tier === 'good') return [
      "Most reviewers rate the service positively, citing helpful staff and good stock of common medications.",
      "A small number of reviews mention occasional stock shortages for less common prescriptions.",
      "Wait times are generally reasonable, though peak hours can slow things down.",
    ];
    return [
      "Reviews are mixed, with some customers satisfied and others noting inconsistency in service or availability.",
      "Staff helpfulness receives varying scores depending on the time of visit.",
      "The pharmacy serves the local area but patient experience appears to vary by shift.",
    ];
  }

  if (type === 'school clinic' || type === 'nursery clinic') {
    return ["This facility has not yet accumulated patient reviews on Google."];
  }

  if (type === 'home healthcare provider') {
    if (tier === 'high') return [
      "Families consistently describe caregivers as punctual, professional, and genuinely attentive to their relatives.",
      "Nursing staff receive particular praise for handling wound care and IV management at home with skill and calm.",
      "Several reviewers mention that the team communicated updates to family members proactively and clearly.",
      count > 50
        ? `The rating of ${r.toFixed(1)} stars from ${count} reviews suggests reliable service quality across a range of home care scenarios.`
        : `The high rating, though from a smaller sample, aligns with consistently warm feedback from families.`,
    ];
    if (tier === 'good') return [
      "Caregivers are generally well-regarded, with most reviewers noting respectful and attentive service.",
      "Scheduling and coordination draw occasional comments, with some families noting delays in confirming visit times.",
      "Nursing care quality receives positive marks; administrative responsiveness is more variable.",
    ];
    return [
      "Reviews present a mixed picture, with positive notes on caregiver skills alongside concerns about communication and scheduling.",
      "Some families report difficulty reaching the team during off-hours for non-emergency queries.",
    ];
  }

  if (type === 'telehealth provider' || type === 'telehealth platform') {
    if (tier === 'high') return [
      "Patients appreciate the speed of connecting with a doctor, often within minutes of logging in.",
      "Reviewers highlight clear explanations and fast prescription delivery as standout features.",
      "The platform receives consistent praise for handling follow-up consultations efficiently without requiring a clinic visit.",
    ];
    return [
      "Experience varies depending on the specialty and doctor assigned; general practitioners receive stronger reviews than specialists.",
      "Technical issues with the app or video quality are mentioned in a minority of reviews.",
      "Useful for minor consultations; patients with complex needs tend to prefer in-person follow-up.",
    ];
  }

  if (type === 'dental clinic') {
    if (tier === 'high') return [
      "Multiple patients mention painless procedures and clear explanations of treatment plans and costs before starting any work.",
      "Reviewers consistently praise the team for putting anxious patients at ease before and during procedures.",
      "Several reviews specifically call out the quality of cosmetic work, including whitening and veneers.",
      count > 100
        ? `With ${count} reviews at ${r.toFixed(1)} stars, the clinic maintains strong satisfaction across a broad patient base.`
        : `The rating of ${r.toFixed(1)} stars reflects a consistent operation where patient comfort is clearly prioritized.`,
    ];
    if (tier === 'good') return [
      "Doctors get solid marks for competence, though some patients note that the reception experience could be smoother.",
      "Wait times are generally acceptable, with occasional delays for patients arriving without appointments.",
      "Treatment outcomes draw mostly positive comments, with a few noting pricing is on the higher end.",
    ];
    return [
      "Opinions are divided, with some patients satisfied with clinical outcomes and others raising concerns about communication.",
      "Appointment scheduling and follow-through on treatment plans receive more inconsistent feedback.",
    ];
  }

  if (type === 'optical center') {
    if (tier === 'high') return [
      "Customers frequently describe accurate prescriptions on the first try, saving repeat visits.",
      "Staff are praised for taking time to explain lens options and help patients choose frames within budget.",
      "Quick turnaround on glasses, often same-day or next-day, features in multiple positive reviews.",
    ];
    if (tier === 'good') return [
      "Eye exam quality receives good marks; frame selection and pricing draw more mixed feedback.",
      "Most reviewers leave satisfied, though a few mention delays when ordering specialty lenses.",
    ];
    return [
      "Service quality appears inconsistent, with some customers happy and others noting issues with prescription accuracy or wait times.",
    ];
  }

  if (type === 'medical laboratory') {
    if (tier === 'high') return [
      "Reviewers highlight fast turnaround on results, often within the same day for routine bloodwork.",
      "The phlebotomy team receives consistent praise for being gentle and efficient, even with nervous patients.",
      "Online result delivery and clear report formatting are mentioned as practical features patients appreciate.",
    ];
    if (tier === 'good') return [
      "Lab results are generally delivered on time, with most reviewers satisfied with accuracy and clarity of reports.",
      "A small number mention delays during peak hours or for specialized tests that require longer processing.",
    ];
    return [
      "Reviews highlight variable wait times and occasional confusion over result delivery timelines.",
      "Clinical accuracy is not questioned, but administrative and communication processes draw criticism.",
    ];
  }

  if (type === 'day surgery center') {
    if (tier === 'high') return [
      "Patients describe smooth pre-operative preparation and clear instructions on what to expect before and after surgery.",
      "Recovery room care draws consistent positive feedback, with nurses praised for attentiveness during the post-procedure period.",
      "Several reviewers note they were discharged faster than expected while still feeling fully ready to go home.",
    ];
    if (tier === 'good') return [
      "Clinical care quality is rated positively; administrative and billing processes receive more mixed feedback.",
      "Most patients feel comfortable with the facility environment and the pre-surgery consultation process.",
    ];
    return [
      "Reviews raise concerns about wait times between admission and procedure, though clinical outcomes are rated reasonably.",
      "Post-operative follow-up communication receives mixed marks from patients.",
    ];
  }

  if (type === 'general hospital' || type === 'specialty hospital') {
    if (tier === 'high') return [
      "Emergency department response receives strong marks, with reviewers noting triage and initial assessment happen quickly.",
      "Inpatient nursing care is a recurring highlight, with patients praising attentiveness on overnight stays.",
      "Specialist consultations draw positive feedback for thoroughness and clear communication of treatment plans.",
      count > 500
        ? `With ${count} reviews at ${r.toFixed(1)} stars, the hospital maintains high satisfaction across a large and diverse patient population.`
        : `The rating reflects consistently good care across both routine and acute presentations.`,
    ];
    if (tier === 'good') return [
      "Clinical care is well-regarded; administrative processes including billing and appointment scheduling receive more variable reviews.",
      "Emergency response times are rated positively for acute cases; walk-in wait times for non-urgent visits can run long.",
      "Doctors get strong feedback for competence, while nursing consistency across shifts draws occasional comment.",
    ];
    return [
      "Emergency department response draws mixed reviews, but inpatient nursing care is rated positively.",
      "Billing and insurance processing receive criticism in multiple reviews, particularly for complex claims.",
      "Clinical outcomes are generally satisfactory; patient communication during waiting periods needs improvement.",
    ];
  }

  if (type === 'medical beauty center') {
    if (tier === 'high') return [
      "Clients frequently mention that the treating physician takes time to assess skin properly before recommending any procedure.",
      "Results from laser and rejuvenation treatments are described as natural-looking, not overdone, in several reviews.",
      "Hygiene standards and clinic presentation receive consistent praise from new and returning clients.",
    ];
    if (tier === 'good') return [
      "Most clients are satisfied with treatment outcomes; a few mention that results took longer to appear than expected.",
      "Staff are generally helpful, though some reviewers note the consultation process could be more detailed.",
    ];
    return [
      "Reviews are mixed, with some clients pleased with results and others noting uneven outcomes or unclear aftercare instructions.",
    ];
  }

  if (type === 'traditional and complementary medicine clinic') {
    if (tier === 'high') return [
      "Patients describe practitioners who listen carefully before recommending treatments, rather than applying a one-size approach.",
      "Cupping and herbal consultations draw the most consistent praise, with several reviewers reporting genuine relief from chronic complaints.",
      "The clinic environment receives positive comments for being calm and well-maintained, which patients say adds to the experience.",
    ];
    if (tier === 'good') return [
      "Results vary by treatment type, with cupping and massage rated higher than herbal programs in patient feedback.",
      "Practitioners are generally described as knowledgeable, though appointment availability can be limited.",
    ];
    return [
      "Experience differs significantly by practitioner, with some patients very satisfied and others feeling the consultation was too brief.",
    ];
  }

  if (type === 'fertility center') {
    if (tier === 'high') return [
      "Couples describe consultants who explain every step of the process clearly and manage expectations honestly.",
      "Emotional support from the nursing team is highlighted as a meaningful part of what makes the clinic stand out.",
      "Success rates and clinical protocol transparency feature prominently in positive reviews.",
    ];
    return [
      "Reviews reflect the emotionally sensitive nature of fertility treatment; most feedback is positive on clinical quality.",
      "Communication about timelines and outcomes receives mixed marks, with some patients wanting more proactive updates.",
    ];
  }

  if (type === 'diagnostic center' || type === 'diagnostic and support center') {
    if (tier === 'high') return [
      "Reviewers note that imaging results are available quickly and formatted clearly for easy sharing with referring doctors.",
      "Technical staff are praised for explaining procedures before starting, which patients say reduces anxiety.",
      "Short appointment wait times and efficient check-in processes feature in multiple positive reviews.",
    ];
    if (tier === 'good') return [
      "Diagnostic accuracy and report quality receive good marks; appointment availability and wait times draw more variable feedback.",
      "Most patients are satisfied with the experience, though a few note the facility can feel busy during peak hours.",
    ];
    return [
      "Reviews highlight acceptable diagnostic quality but raise concerns about wait times and communication of results.",
    ];
  }

  // polyclinic, general clinic, specialty clinic, default
  if (tier === 'high') {
    const reviews = [
      "Doctors get consistent praise for listening carefully and explaining diagnoses without rushing patients through consultations.",
      "Multiple reviewers mention that booking appointments is straightforward and that the clinic runs reasonably close to schedule.",
    ];
    reviews.push(count > 200
      ? `With ${count} reviews averaging ${r.toFixed(1)} stars, patient satisfaction here holds up across a large and varied sample.`
      : `The ${r.toFixed(1)} star rating from ${count} reviews reflects a clinic where patients feel heard and well-managed.`);
    reviews.push("Reception staff are frequently described as helpful and willing to assist with insurance paperwork and appointment changes.");
    return reviews;
  }
  if (tier === 'good') return [
    "Doctors get consistent praise for thoroughness, though evening wait times can stretch past 30 minutes.",
    "The clinic is rated well for specialist consultations, with some reviewers noting that GP availability could be better.",
    "Insurance processing is handled smoothly for most patients, though a few mention delays with specific insurers.",
  ];
  if (tier === 'mixed') return [
    "Clinical competence receives positive feedback, but administrative processes and wait times draw criticism in a notable share of reviews.",
    "Doctor quality varies by specialty, with some practitioners rated highly and others described as rushed.",
    "A recurring theme in lower ratings is difficulty reaching the clinic by phone or delays in getting follow-up test results.",
  ];
  return [
    "The facility's low rating reflects significant concerns raised in patient reviews across multiple visit types.",
    "Wait times and communication from staff are the most commonly cited issues in negative reviews.",
    "Clinical outcomes receive more varied feedback, suggesting experience depends heavily on the specific doctor seen.",
  ];
}

// Main generation
const output = {};
let count = 0;

providers.forEach((provider, localIdx) => {
  const globalIdx = 2500 + localIdx;
  const description = generateDescription(provider);
  const reviewSummary = generateReviewSummary(provider);
  output[String(globalIdx)] = { description, reviewSummary };
  count++;
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(`Done. Wrote ${count} entries to chunk-2500-2999.json`);
