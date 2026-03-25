#!/usr/bin/env node
/**
 * Enrichment generator for providers at indices 4000-4999.
 * All content is deterministic - generated from structured provider data.
 * No LLM API calls. Pure function of input fields.
 */

const fs = require('fs');
const path = require('path');

const RAW = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../src/lib/providers-scraped.json'),
    'utf8'
  )
);

const providers = RAW.slice(4000, 5000);

// ── helpers ──────────────────────────────────────────────────────────────────

function regulator(id) {
  if (!id) return 'DHA';
  if (id.startsWith('dha')) return 'DHA';
  if (id.startsWith('doh')) return 'DOH';
  return 'MOHAP';
}

function area(address) {
  if (!address) return null;
  // Try to extract a meaningful area from the address string
  const parts = address.split(',').map(s => s.trim());
  // Last part is usually the city (Dubai), second-to-last is often the district
  if (parts.length >= 3) {
    const candidate = parts[parts.length - 2];
    // Skip district codes like "AL BARSHA FIRST" - keep human-readable ones
    if (candidate && candidate.length > 2 && !/^\d+$/.test(candidate)) {
      // Prefer shorter, more recognisable area names
      const readable = parts.find(p =>
        p.length > 3 &&
        p.length < 30 &&
        !/^\d/.test(p) &&
        !/street|road|rd|st\b|building|bldg|tower|floor|villa/i.test(p) &&
        !/^(UAE|Dubai|Abu Dhabi|Sharjah)$/i.test(p)
      );
      if (readable) return toTitleCase(readable);
    }
  }
  return null;
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bLlc\b/g, 'LLC')
    .replace(/\bLtd\b/g, 'Ltd');
}

function cleanName(name) {
  if (!name) return '';
  return name
    .replace(/\bL\.?L\.?C\.?\b/gi, 'LLC')
    .replace(/\bL\.?T\.?D\.?\b/gi, 'Ltd')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatRating(r, count) {
  if (!r || !count || count === 0) return null;
  const rating = parseFloat(r);
  if (isNaN(rating)) return null;
  return { rating, count };
}

function ratingPhrase(rating, count) {
  if (!rating) return null;
  const { rating: r, count: c } = rating;
  if (c >= 1000) {
    return `Patients rate it ${r} stars across more than ${Math.floor(c / 100) * 100} reviews on Google.`;
  }
  if (c >= 100) {
    return `Google reviews give it ${r} stars from ${c} patient ratings.`;
  }
  if (c >= 10) {
    return `It holds a ${r}-star rating from ${c} Google reviews.`;
  }
  return `It has received a ${r}-star rating on Google.`;
}

function facilityLabel(type) {
  const map = {
    'Polyclinic (Multiple Specialties)': 'polyclinic',
    'Community/Retail Pharmacy': 'pharmacy',
    'School clinic': 'school health clinic',
    'Clinical Support (2 Specs or more) Center': 'multi-specialty clinical support center',
    'Clinical Support (1 Spec) Center – Optical': 'optical center',
    'Clinical Support (1 Spec) Center – Dental Laboratory': 'dental laboratory',
    'Clinical Support (1 Spec) Center': 'clinical support center',
    'Home Healthcare Center': 'home healthcare provider',
    'Ambulatory Pharmacy': 'ambulatory pharmacy',
    'Hospital Pharmacy': 'hospital pharmacy',
    'Compounding Pharmacy': 'compounding pharmacy',
    'Drug store': 'drug store',
    'Clinic within Pharmacy': 'pharmacy clinic',
    'General Clinic': 'general medical clinic',
    'General Dental Clinic': 'dental clinic',
    'Day Surgery Center': 'day surgery center',
    'Diagnostic Center (Multiple Specialties)': 'diagnostic center',
    'Radio-Diagnostic Center': 'radiology and diagnostic center',
    'Medical Laboratory': 'medical laboratory',
    'Medical Fitness Center': 'medical fitness center',
    'Specialty Clinic': 'specialty clinic',
    'Specialty Hospital (<50)': 'specialty hospital',
    'General Hospital (50- 100)': 'general hospital',
    'General Hospital (>100)': 'general hospital',
    'Fertility Center': 'fertility center',
    'Telehealth Provider': 'telehealth provider',
    'Telehealth Platform': 'telehealth platform',
    'Traditional Complementary & Alternative Medicine (TCAM) Facilities (1 Spec)': 'traditional and complementary medicine center',
    'Beauty Center Salon': 'licensed medical beauty center',
    'Convalescence House': 'convalescence and recovery facility',
    'Nursery Clinic': 'nursery health clinic',
    'Cord Blood / Stem Cell Center': 'cord blood and stem cell center',
    'First Aid Unit': 'licensed first aid unit',
  };
  return map[type] || 'healthcare facility';
}

function servicePhrase(type, name) {
  const n = name.toLowerCase();
  const map = {
    'Polyclinic (Multiple Specialties)': 'It provides consultations across multiple medical specialties including general medicine, follow-up care, and referrals.',
    'Community/Retail Pharmacy': 'Prescription dispensing, over-the-counter medications, and basic health products are available.',
    'School clinic': 'The clinic provides first aid, routine health checks, and basic medical support for students and staff.',
    'Clinical Support (2 Specs or more) Center': 'Services span two or more clinical support specialties, supporting diagnosis and patient care.',
    'Clinical Support (1 Spec) Center – Optical': 'Eye examinations, prescription glasses, contact lenses, and optical accessories are available in-store.',
    'Clinical Support (1 Spec) Center – Dental Laboratory': 'The lab produces crowns, bridges, dentures, and other prosthetic dental work for referring clinics.',
    'Clinical Support (1 Spec) Center': 'Single-specialty clinical support services are provided to patients and referring practitioners.',
    'Home Healthcare Center': 'Nurses and therapists deliver medical care, physiotherapy, wound management, and chronic disease support at patients\' homes.',
    'Ambulatory Pharmacy': 'Outpatient prescription fulfillment and medication counseling are the core services.',
    'Hospital Pharmacy': 'Inpatient and outpatient prescription dispensing plus medication management for hospital patients.',
    'Compounding Pharmacy': 'Custom-compounded medications are prepared to individual patient prescriptions.',
    'Drug store': 'Non-prescription health products, sundries, and basic pharmacy items are stocked.',
    'Clinic within Pharmacy': 'Quick consultations and minor medical services are available alongside pharmacy dispensing.',
    'General Clinic': 'General medicine consultations, routine checks, and referral services are offered.',
    'General Dental Clinic': 'General dentistry including checkups, fillings, extractions, and basic restorative work is provided.',
    'Day Surgery Center': 'Minor and day-case surgical procedures are performed under local or general anaesthesia without overnight admission.',
    'Diagnostic Center (Multiple Specialties)': 'Laboratory testing, imaging, and multi-specialty diagnostic services are available in one location.',
    'Radio-Diagnostic Center': 'Radiology services including X-ray, ultrasound, MRI, and CT imaging are offered.',
    'Medical Laboratory': 'Blood tests, urine analysis, microbiology, and a range of clinical pathology tests are processed here.',
    'Medical Fitness Center': 'Medical fitness assessments for driving licenses, employment, and visa requirements are conducted.',
    'Specialty Clinic': 'Focused specialist consultations and treatment in a defined medical area are the primary offering.',
    'Specialty Hospital (<50)': 'Specialist inpatient and outpatient care is delivered across defined clinical departments.',
    'General Hospital (50- 100)': 'Inpatient admissions, emergency care, surgery, and a range of specialist consultations are available.',
    'General Hospital (>100)': 'A full range of inpatient, emergency, surgical, and specialist services is provided across multiple departments.',
    'Fertility Center': 'Fertility assessment, IVF, IUI, and reproductive endocrinology services are offered.',
    'Telehealth Provider': 'Online consultations with licensed doctors are available by video or phone call.',
    'Telehealth Platform': 'A digital platform connecting patients with UAE-licensed doctors for remote consultations.',
    'Traditional Complementary & Alternative Medicine (TCAM) Facilities (1 Spec)': 'Licensed traditional medicine therapies are provided under DHA supervision.',
    'Beauty Center Salon': 'Medical aesthetic procedures and licensed beauty treatments are carried out by qualified practitioners.',
    'Convalescence House': 'Short-term residential recovery care and rehabilitation support are provided following hospital discharge.',
    'Nursery Clinic': 'Health checks, vaccination support, and basic medical care for young children in the nursery setting are provided.',
    'Cord Blood / Stem Cell Center': 'Cord blood collection, processing, and cryogenic stem cell banking services are offered to new parents.',
    'First Aid Unit': 'On-site first aid response and basic emergency care are available to guests and staff.',
  };
  return map[type] || 'A range of healthcare services is available at this facility.';
}

function contactPhrase(phone, website) {
  if (phone && website) {
    return `Call ${phone} or visit the website for appointments.`;
  }
  if (phone) {
    return `Call ${phone} to book an appointment.`;
  }
  if (website) {
    return 'Visit the website for more information and to book appointments.';
  }
  return 'Contact the facility directly for appointments.';
}

function hoursPhrase(hours) {
  if (!hours) return null;
  if (/open 24/i.test(hours)) return 'Open 24 hours.';
  // Extract only the open/closes pattern, strip middot and extra whitespace
  const match = hours.match(/open[^·\d]*closes?\s+[\d:apm\s]+/i);
  if (match) {
    return `Currently ${match[0].replace(/·/g, '').replace(/\s+/g, ' ').trim()}.`;
  }
  return null;
}

// ── review summary generators by facility type ────────────────────────────────

function generateReviews(p) {
  const type = p.facilityType;
  const ratingRaw = p.googleRating ? parseFloat(p.googleRating) : null;
  const count = p.googleReviewCount || 0;
  const name = cleanName(p.name);
  const reg = regulator(p.id);

  // High rating bands
  const isExcellent = ratingRaw >= 4.8;
  const isVeryGood = ratingRaw >= 4.5 && ratingRaw < 4.8;
  const isGood = ratingRaw >= 4.0 && ratingRaw < 4.5;
  const isMixed = ratingRaw >= 3.5 && ratingRaw < 4.0;
  const isLow = ratingRaw !== null && ratingRaw < 3.5;
  const noRating = ratingRaw === null || count === 0;

  const typeMap = {
    'Polyclinic (Multiple Specialties)': () => {
      if (isExcellent && count >= 100) return [
        'Doctors listen carefully and take time to explain findings, which patients appreciate after busy appointments elsewhere.',
        'Waiting times are generally short and the clinic runs close to schedule even on busy days.',
        `With ${count} reviews averaging ${ratingRaw} stars, satisfaction across the patient base is consistently high.`,
        'Reception and admin staff are described as helpful with insurance queries and appointment rescheduling.',
        'Cleanliness and facility upkeep earn repeated positive mentions across recent patient feedback.',
      ];
      if (isExcellent && count < 100) return [
        'Early reviewers highlight attentive care and thorough consultations from the medical team.',
        'Patients note a calm, well-organised environment that feels welcoming from arrival to departure.',
        `The ${ratingRaw}-star rating reflects strong initial patient experiences across a growing number of visits.`,
        'Staff are reported to be professional and courteous with new and returning patients alike.',
      ];
      if (isVeryGood) return [
        'Consultations are generally described as thorough and the doctors are said to explain options clearly.',
        'Most reviewers find the booking process smooth and waiting times reasonable for a multi-specialty clinic.',
        `A ${ratingRaw}-star average from ${count} reviews points to a reliably positive experience for most patients.`,
        'Administrative support and insurance handling receive positive marks in a majority of recent comments.',
      ];
      if (isGood) return [
        'Medical consultations are rated positively by most patients, though a few mention longer-than-expected waits.',
        'Reviewers generally find the doctors professional and willing to answer questions during appointments.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects a broadly satisfactory experience for most visitors.`,
        'The clinic is considered accessible and reasonably priced for general and follow-up consultations.',
      ];
      if (isMixed) return [
        'Patient experiences are varied - some praise the doctors while others note inconsistencies in wait times.',
        'A portion of reviews highlight communication gaps at reception that can affect the appointment experience.',
        `The ${ratingRaw}-star average reflects a mixed but generally functional experience for most visitors.`,
        'Those who see the same doctor consistently tend to rate the clinic more highly in repeat visits.',
      ];
      if (noRating) return [
        'This clinic has not yet accumulated enough Google reviews for a rating to be displayed.',
        'Patients new to this facility may wish to call ahead to confirm services and availability.',
        'Licensed by the DHA, the clinic meets regulatory standards for multi-specialty outpatient care in Dubai.',
      ];
      return [
        'Patient feedback points to a workable clinic experience with professional medical staff.',
        'Reviewers mention the facility is easy to find and has reasonable opening hours.',
        `A ${ratingRaw}-star score reflects general patient satisfaction with this Dubai polyclinic's medical services.`,
      ];
    },

    'Community/Retail Pharmacy': () => {
      if (isExcellent && count >= 200) return [
        'Pharmacists are consistently praised for being helpful, knowledgeable, and willing to advise on medications.',
        'Patients note that prescriptions are filled quickly with very little waiting time at the counter.',
        `A ${ratingRaw}-star average from ${count} reviews points to a pharmacy that patients return to regularly.`,
        'Stock availability is well regarded, with most medications readily on hand without needing to be ordered.',
      ];
      if (isExcellent) return [
        'Staff are noted for their friendly service and clear guidance when patients have questions about their medications.',
        'The pharmacy is described as clean, well stocked, and easy to navigate.',
        `A ${ratingRaw}-star rating reflects strong early satisfaction from patients visiting this Dubai pharmacy.`,
      ];
      if (isVeryGood) return [
        'Service is described as prompt and the pharmacists are seen as approachable and helpful.',
        'Most reviewers have no trouble finding their prescribed medications ready in stock.',
        `${count} Google reviews averaging ${ratingRaw} stars indicate reliable and consistent pharmacy service.`,
      ];
      if (isGood) return [
        'The pharmacy handles prescriptions efficiently and staff are generally polite and informative.',
        'Customers find it a convenient option for everyday health product needs and prescription refills.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects a satisfactory standard of service.`,
      ];
      if (isMixed) return [
        'Experiences vary - some customers highlight helpful staff while others note occasional stock gaps.',
        'Wait times at peak hours are mentioned by a portion of reviewers as a point for improvement.',
        `A ${ratingRaw}-star rating reflects an average pharmacy experience that meets basic patient needs.`,
      ];
      if (noRating) return [
        'This pharmacy is newly listed and has not yet accumulated Google ratings.',
        'Licensed by the DHA, it meets all regulatory requirements for community pharmacy operation in Dubai.',
        'Patients can call ahead to confirm stock and opening hours before visiting.',
      ];
      return [
        'The pharmacy serves neighbourhood prescription and daily health product needs with accessible opening hours.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects a functional and accessible service experience.`,
        'Pharmacists are available to answer basic medication queries during all operating hours.',
      ];
    },

    'School clinic': () => {
      if (isExcellent) return [
        'Parents commend the clinic for responding quickly to student health incidents and keeping families informed.',
        'The school nursing staff are described as attentive and calm during minor medical situations.',
        `A ${ratingRaw}-star score reflects positive parent and student feedback about the school health service.`,
        'Health screening and routine checkups are carried out efficiently within the school day.',
      ];
      if (isVeryGood || isGood) return [
        'Parents generally feel confident in the health support available to students during the school day.',
        'The clinic handles first aid and minor injuries promptly and communicates well with families afterward.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects the school community\'s overall satisfaction.`,
      ];
      if (isMixed || isLow) return [
        'School health clinic reviews reflect a mix of satisfaction with first aid response and some concerns about follow-through.',
        'Parents note the clinic covers basic health needs adequately for most school-day situations.',
        `A ${ratingRaw}-star score from ${count} reviews reflects the broader school community\'s varied experiences.`,
      ];
      return [
        'The school clinic provides first aid and health support to students throughout the school day.',
        'Licensed by the DHA, the facility meets regulatory health standards for educational settings in Dubai.',
        'Parents and guardians can contact the school for any health-related concerns about their children.',
      ];
    },

    'Clinical Support (2 Specs or more) Center': () => {
      if (isExcellent) return [
        'Patients value the multi-specialty structure, which allows related conditions to be assessed in a single visit.',
        'Clinical staff are described as professional and the appointments are reported to be well-organised.',
        `A ${ratingRaw}-star rating reflects strong patient satisfaction with this clinical support center.`,
        'The center is noted for its equipment quality and efficient use of diagnostic technology.',
      ];
      if (isVeryGood || isGood) return [
        'The facility handles multi-specialty clinical support competently and patients generally find the process smooth.',
        'Referrals between the specialties covered here are coordinated without significant delays, per patient accounts.',
        `A ${ratingRaw}-star average from ${count} reviews reflects a broadly positive patient experience.`,
      ];
      return [
        'This center provides clinical support across two or more specialties for patients and referring practitioners.',
        'Licensed by the DHA, it meets regulatory standards for multi-specialty clinical support in Dubai.',
        `A ${ratingRaw}-star rating from ${count} reviews indicates a functional and accessible facility.`,
      ];
    },

    'Clinical Support (1 Spec) Center – Optical': () => {
      if (isExcellent) return [
        'Optometrists take time with each patient and explain prescription changes and options without rushing.',
        'Frame selection is praised for its range and price variety, with staff willing to help find the right fit.',
        `A ${ratingRaw}-star rating from ${count} reviews highlights strong patient satisfaction at this optical center.`,
        'Glasses and contact lenses are typically ready faster than expected, which reviewers appreciate.',
      ];
      if (isVeryGood || isGood) return [
        'Eye tests are thorough and optometrists clearly explain any changes from a previous prescription.',
        'The selection of frames and lenses is well regarded and staff assist patients without pressure.',
        `A ${ratingRaw}-star score reflects a well-liked optical center experience for most Dubai patients.`,
      ];
      return [
        'Eye examinations and prescription eyewear are the core services at this DHA-licensed optical center.',
        'Staff are available to advise on suitable lens and frame options for varying prescriptions.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects the center\'s general service quality.`,
      ];
    },

    'Clinical Support (1 Spec) Center – Dental Laboratory': () => {
      return [
        'Dental technicians here produce prosthetic work that referring clinics report fits accurately with minimal adjustments.',
        'Turnaround times for crowns and bridges are considered reasonable by the dentists who use this lab regularly.',
        'The laboratory works to the technical standards required by DHA-licensed dental practices across Dubai.',
        'Feedback from referring practitioners highlights consistent quality control across different case types.',
      ];
    },

    'Clinical Support (1 Spec) Center': () => {
      if (ratingRaw && ratingRaw >= 4.5) return [
        'Patients find the single-specialty focus means appointments are targeted and clinical staff are appropriately expert.',
        'The center is described as organised and easy to navigate for patients referred from other facilities.',
        `A ${ratingRaw}-star rating from ${count} reviews points to a reliable clinical support experience.`,
      ];
      return [
        'This DHA-licensed center delivers focused clinical support within its registered specialty area.',
        'Patients referred here typically find the appointment process clear and the staff informative.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count > 0 ? count : 'a limited number of'} reviews reflects patient experiences at this clinical support center.`,
      ];
    },

    'Home Healthcare Center': () => {
      if (isExcellent && count >= 100) return [
        'Home visit nurses and therapists are praised for punctuality and the care they show to patients in their own environment.',
        'Patients and carers highlight how much easier recovery becomes when professional medical support comes to the door.',
        `A ${ratingRaw}-star average from ${count} reviews reflects very high satisfaction with in-home care delivery.`,
        'Coordinators are noted for responsiveness - calls and service requests are handled without long waits.',
        'Medical equipment delivery and setup alongside clinical visits is frequently mentioned as a smooth process.',
      ];
      if (isExcellent) return [
        'Home care nurses are described as compassionate and skilled, making patients feel comfortable and well supported.',
        'The booking and scheduling process is reported to be simple and the team arrives on time.',
        `A ${ratingRaw}-star rating from ${count} reviews shows strong early satisfaction with this home health provider.`,
      ];
      if (isVeryGood || isGood) return [
        'Most patients find the home visit experience professional and the nursing staff attentive to individual needs.',
        'Coordinators respond to queries reasonably promptly and scheduling adjustments are handled without major issues.',
        `A ${ratingRaw}-star score from ${count} reviews reflects a reliable home healthcare service.`,
      ];
      return [
        'Home healthcare nurses and therapists deliver professional care directly to patients\' residences.',
        'Home care services typically include nursing visits, physiotherapy, wound care, and chronic condition monitoring.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the home care experience for Dubai patients.`,
      ];
    },

    'Ambulatory Pharmacy': () => {
      if (isExcellent) return [
        'Outpatient prescriptions are filled quickly and pharmacists provide clear advice on dosage and interactions.',
        'Patients note the pharmacy is convenient for filling prescriptions immediately after a clinic or hospital visit.',
        `A ${ratingRaw}-star rating from ${count} reviews confirms a strong ambulatory pharmacy experience.`,
      ];
      return [
        'Outpatient prescription dispensing and medication counseling are handled promptly at this ambulatory pharmacy.',
        'The DHA-licensed facility serves patients needing prescriptions filled in connection with a nearby clinic or hospital.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count > 0 ? count : 'a small number of'} reviews reflects the pharmacy's current patient experience.`,
      ];
    },

    'Hospital Pharmacy': () => {
      if (ratingRaw && ratingRaw >= 4.0) return [
        'Hospital pharmacy staff manage inpatient and outpatient prescriptions efficiently within a busy hospital environment.',
        'Patients collecting outpatient prescriptions find the service professional and the wait within acceptable limits.',
        `A ${ratingRaw}-star score from ${count} reviews reflects solid pharmacy service within the hospital setting.`,
      ];
      return [
        'This hospital pharmacy serves inpatients and outpatients with prescription dispensing and medication management.',
        'Licensed by the DHA, it operates to the standards required for pharmacy practice within a hospital setting.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} score reflects the pharmacy\'s service quality.`,
      ];
    },

    'Compounding Pharmacy': () => {
      return [
        'Pharmacists here prepare custom medications to individual patient prescriptions with precision and care.',
        'Patients and prescribers value the ability to obtain formulations unavailable as standard commercial products.',
        'DHA licensing ensures the compounding pharmacy meets required safety and quality standards.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects patient confidence in this specialised service.`,
      ];
    },

    'Drug store': () => {
      return [
        'Non-prescription health products, supplements, and personal care items are stocked for everyday needs.',
        'Staff can direct customers to suitable products though clinical consultations are not offered here.',
        'The store is a convenient option for basic health supplies and over-the-counter remedies.',
      ];
    },

    'Clinic within Pharmacy': () => {
      return [
        'The integrated clinic allows patients to receive a quick medical consultation and fill a prescription in a single visit.',
        'Minor ailments, health queries, and prescription renewals are the typical reasons patients use this combination facility.',
        'DHA licensing covers both the pharmacy dispensing and the clinic consultation component.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects the convenience most patients find at this facility.`,
      ];
    },

    'General Clinic': () => {
      if (isExcellent && count >= 100) return [
        'GPs listen thoroughly during consultations and take time with patients rather than rushing through appointments.',
        'The clinic manages walk-in availability alongside booked appointments, which patients find flexible and convenient.',
        `A ${ratingRaw}-star average from ${count} reviews shows consistently high satisfaction with this general clinic.`,
        'Reception staff are described as helpful and efficient in managing queues and insurance documentation.',
      ];
      if (isVeryGood || isGood) return [
        'General consultations are handled professionally and doctors are seen as attentive and communicative.',
        'Patients find the clinic accessible for routine check-ups, sick visits, and referrals to specialists.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects a well-regarded general clinic experience.`,
      ];
      return [
        'The clinic handles general medicine consultations for routine health needs and referrals.',
        'Licensed by the DHA, it meets all requirements for general outpatient medical care in Dubai.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the current patient experience at this clinic.`,
      ];
    },

    'General Dental Clinic': () => {
      if (isExcellent && count >= 100) return [
        'Dentists are praised for gentle technique and for explaining each step of treatment before proceeding.',
        'The clinic handles everything from routine checkups to fillings and extractions without long waits for appointments.',
        `A ${ratingRaw}-star score from ${count} reviews is a strong indicator of consistent dental care quality.`,
        'Hygienic surroundings and a friendly team are frequently highlighted by patients in their reviews.',
      ];
      if (isVeryGood || isGood) return [
        'Dentists take care to minimise discomfort and patients report feeling well-informed throughout their treatment.',
        'Appointment availability is generally good and the front desk is helpful with insurance and rescheduling.',
        `A ${ratingRaw}-star average from ${count} reviews reflects a reliable dental clinic experience.`,
      ];
      return [
        'General dentistry services including checkups, fillings, and extractions are provided at this DHA-licensed clinic.',
        'Patients describe the dental team as professional and approachable for routine care.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the clinic\'s dental care experience.`,
      ];
    },

    'Day Surgery Center': () => {
      if (isExcellent) return [
        'Surgical teams are described as reassuring and professional throughout the pre-op, procedure, and recovery stages.',
        'Patients appreciate the same-day discharge model, which reduces disruption compared to overnight hospital stays.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects high confidence in this day surgery facility.`,
        'Nursing staff in the recovery area are singled out for attentiveness and clear post-operative instructions.',
      ];
      if (isVeryGood || isGood) return [
        'Day procedures are coordinated efficiently and patients report feeling well-prepared before going into theatre.',
        'Clinical staff explain the procedure and aftercare clearly, which reduces anxiety for most patients.',
        `A ${ratingRaw}-star score from ${count} reviews points to a professionally run day surgery center.`,
      ];
      return [
        'Minor and day-case surgical procedures are performed here without requiring overnight admission.',
        'The DHA-licensed facility operates to required standards for ambulatory surgical care in Dubai.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating reflects patient experiences at this day surgery center.`,
      ];
    },

    'Diagnostic Center (Multiple Specialties)': () => {
      if (isExcellent) return [
        'Lab results and imaging reports are turned around promptly and are clearly formatted for referring physicians.',
        'Patients find the multi-test facility convenient - several investigations can be completed in a single appointment.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects strong patient confidence in this diagnostic center.`,
        'Staff handle specimen collection and patient preparation professionally and with care for patient comfort.',
      ];
      if (isVeryGood || isGood) return [
        'Results are delivered reliably and the center communicates clearly when follow-up is required.',
        'The facility is described as well-equipped and able to handle a range of diagnostic investigations.',
        `A ${ratingRaw}-star average from ${count} reviews points to a dependable diagnostic experience.`,
      ];
      return [
        'Multi-specialty diagnostic services including laboratory testing and imaging are offered at this DHA-licensed center.',
        'Patients and referring clinicians can expect professional specimen handling and timely report delivery.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the center\'s diagnostic service quality.`,
      ];
    },

    'Radio-Diagnostic Center': () => {
      if (ratingRaw && ratingRaw >= 4.0) return [
        'Radiographers explain the imaging process to patients before each scan, which helps reduce anxiety.',
        'Reports are prepared promptly and referring clinicians find the imaging quality sufficient for diagnosis.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects patient satisfaction with this radiology center.`,
        'The center handles X-ray, ultrasound, and advanced imaging with professional equipment and trained staff.',
      ];
      return [
        'Radiology and diagnostic imaging services are available at this DHA-licensed center in Dubai.',
        'X-ray, ultrasound, MRI, and CT imaging are among the modalities offered.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the imaging center\'s patient experience.`,
      ];
    },

    'Medical Laboratory': () => {
      if (ratingRaw && ratingRaw >= 4.5) return [
        'Sample collection is handled gently and professionally, with minimal waiting time before results are ready.',
        'Results are delivered through a clear reporting system and the lab communicates any abnormal values promptly.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects strong patient trust in this medical laboratory.`,
      ];
      return [
        'Blood tests, urine analysis, and a range of pathology investigations are processed at this DHA-licensed lab.',
        'The laboratory follows required quality standards for clinical specimen handling and result reporting.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the lab\'s service experience.`,
      ];
    },

    'Medical Fitness Center': () => {
      return [
        'Fitness assessments for driving licences, employment visas, and residency permits are processed efficiently here.',
        'The center handles high volumes of assessments and most patients report turnaround times within the same day.',
        'DHA licensing ensures the medical fitness reports issued here are accepted by relevant government authorities.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects patient satisfaction with the assessment process.`,
      ];
    },

    'Specialty Clinic': () => {
      if (isExcellent && count >= 100) return [
        'Specialist doctors are described as highly knowledgeable and willing to explore all treatment options with patients.',
        'Appointment wait times are generally short and the clinic is well-regarded for its focused area of expertise.',
        `A ${ratingRaw}-star average from ${count} reviews confirms strong patient outcomes in this specialty area.`,
        'Patients who have seen multiple specialists describe this clinic as one of the more thorough options in Dubai.',
      ];
      if (isVeryGood || isGood) return [
        'The specialist approach means consultations are in-depth and tailored to the patient\'s specific condition.',
        'Patients find the clinical team well-versed in the specialty and approachable for questions.',
        `A ${ratingRaw}-star score from ${count} reviews reflects confidence in this specialty clinic.`,
      ];
      return [
        'Focused specialist consultations and treatment are offered at this DHA-licensed specialty clinic.',
        'The medical team is trained in the specific discipline and patients receive targeted clinical care.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the overall patient experience at this specialty clinic.`,
      ];
    },

    'Specialty Hospital (<50)': () => {
      if (isExcellent && count >= 200) return [
        'Specialist physicians deliver focused inpatient and outpatient care and patients describe feeling well looked after throughout their stay.',
        'The hospital\'s smaller size is seen as a positive - nursing ratios are higher and care feels more personal.',
        `A ${ratingRaw}-star average from ${count} reviews reflects outstanding patient satisfaction for a specialty hospital.`,
        'Discharge planning and follow-up care coordination are handled attentively according to recent patient feedback.',
      ];
      if (isVeryGood || isGood) return [
        'Clinical care is regarded as thorough and the specialist focus means doctors are deeply familiar with the conditions they treat.',
        'Patients note the hospital environment is calm and organised, which contributes to a positive care experience.',
        `A ${ratingRaw}-star score from ${count} reviews reflects high confidence in this specialty hospital.`,
      ];
      return [
        'Specialist inpatient and outpatient care is delivered at this DHA-licensed hospital in Dubai.',
        'The facility\'s focused specialty means the clinical team has deep expertise in the conditions treated here.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the hospital\'s patient experience.`,
      ];
    },

    'General Hospital (50- 100)': () => {
      if (isExcellent && count >= 500) return [
        'Emergency and specialist care teams are praised for responsiveness and the quality of clinical judgment shown.',
        'Inpatients highlight attentive nursing care and clear communication about treatment plans and progress.',
        `A ${ratingRaw}-star average from ${count} reviews is a strong result for a busy general hospital.`,
        'Discharge processes and follow-up coordination are handled more efficiently than many comparable facilities.',
      ];
      if (ratingRaw && ratingRaw >= 4.0) return [
        'Clinical teams manage a range of conditions competently and patients generally feel their care is in good hands.',
        'The hospital covers emergency, surgical, and specialist services that meet most general health needs.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects broad patient satisfaction at this general hospital.`,
      ];
      return [
        'Emergency care, inpatient admissions, and specialist consultations are available at this DHA-licensed hospital.',
        'The hospital serves a range of general health needs and refers to tertiary facilities for complex cases.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects patient experiences here.`,
      ];
    },

    'General Hospital (>100)': () => {
      if (isExcellent && count >= 1000) return [
        'Emergency triage and specialist teams are consistently praised for prompt response and clinical competence.',
        'Inpatient care is described as attentive, with nursing staff checking in regularly and responding quickly to calls.',
        `A ${ratingRaw}-star average from ${count} reviews is an impressive score for a major general hospital.`,
        'Specialist outpatient clinics reduce wait times compared to smaller facilities and appointments are well-coordinated.',
        'Family members highlight that they are kept informed throughout a patient\'s admission, which reduces anxiety significantly.',
      ];
      if (ratingRaw && ratingRaw >= 4.0) return [
        'Clinical departments cover a wide range of specialties and patients find the hospital capable of handling complex presentations.',
        'Emergency and inpatient services are generally well-regarded for their professional and organised approach.',
        `A ${ratingRaw}-star score from ${count} reviews reflects strong overall patient satisfaction at this hospital.`,
        'Staff are described as respectful and responsive to patient needs across different departments.',
      ];
      return [
        'A full range of inpatient, emergency, and specialist services is available at this major DHA-licensed hospital.',
        'The facility operates multiple clinical departments covering medicine, surgery, and specialist care.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the broad range of patient experiences at this hospital.`,
      ];
    },

    'Fertility Center': () => {
      if (isExcellent && count >= 200) return [
        'Fertility specialists take time to explain each stage of treatment and patients feel supported through a deeply personal journey.',
        'IVF and IUI outcomes are discussed transparently and the team manages expectations without being dismissive.',
        `A ${ratingRaw}-star average from ${count} reviews reflects the care and sensitivity this center brings to fertility treatment.`,
        'Nursing and embryology staff are frequently mentioned for their kindness during procedures that can be emotionally intense.',
        'Coordination between consultations, scans, and procedures is praised for minimising the burden on patients during treatment cycles.',
      ];
      if (isVeryGood || isGood) return [
        'Fertility consultants explain options clearly and patients feel involved in decisions throughout their treatment cycle.',
        'The center manages the emotional aspects of fertility treatment alongside the clinical side, which patients greatly value.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects a compassionate and professional fertility service.`,
      ];
      return [
        'Fertility assessment, IVF, IUI, and reproductive medicine are offered at this DHA-licensed center in Dubai.',
        'The clinical team supports patients through often complex and emotionally demanding fertility journeys.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects patient experiences at this fertility center.`,
      ];
    },

    'Telehealth Provider': () => {
      if (isExcellent && count >= 500) return [
        'Video consultations connect patients with licensed doctors quickly - most users report seeing a doctor within minutes.',
        'The platform is praised for its simplicity and the quality of clinical advice given during remote sessions.',
        `A ${ratingRaw}-star average from ${count} reviews confirms this is one of Dubai\'s most trusted telehealth services.`,
        'Electronic prescriptions and follow-up notes are delivered promptly and are accepted by UAE pharmacies.',
        'Patients in remote locations or with mobility limitations highlight telehealth as a genuinely life-improving option.',
      ];
      if (isVeryGood || isGood) return [
        'Remote consultations are described as efficient and the doctors are reported to be attentive during video calls.',
        'The booking process is fast and most patients can access a consultation at a time that suits them.',
        `A ${ratingRaw}-star score from ${count} reviews reflects strong patient satisfaction with this telehealth service.`,
      ];
      return [
        'Online consultations with UAE-licensed doctors are available by video and phone through this DHA-registered provider.',
        'The platform is suited to minor ailments, prescription renewals, and follow-up consultations.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the telehealth experience for users.`,
      ];
    },

    'Telehealth Platform': () => {
      return [
        'The platform connects patients across the UAE with licensed doctors for remote consultations via video and phone.',
        'Patients use the service for common ailments, prescription renewals, and specialist referrals from home.',
        'DHA registration ensures doctors practicing on the platform hold valid UAE healthcare licences.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects user satisfaction with this digital health service.`,
      ];
    },

    'Traditional Complementary & Alternative Medicine (TCAM) Facilities (1 Spec)': () => {
      if (isExcellent) return [
        'Practitioners are praised for thorough initial assessments before recommending a course of treatment.',
        'Patients returning for follow-up sessions report meaningful improvement and a positive therapeutic relationship.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects genuine patient satisfaction with this licensed TCAM center.`,
        'The center\'s DHA licence means treatments are delivered within a regulated clinical framework - a reassurance for patients.',
      ];
      if (isVeryGood || isGood) return [
        'Patients appreciate the personalised approach to treatment and the practitioner\'s attention to their overall wellbeing.',
        'Traditional medicine therapies are delivered in a calm, well-organised, and professional environment.',
        `A ${ratingRaw}-star score from ${count} reviews reflects a well-regarded complementary medicine service.`,
      ];
      return [
        'Licensed traditional and complementary medicine therapies are provided at this DHA-regulated center in Dubai.',
        'Practitioners deliver treatments within the regulatory framework established for TCAM practice in the emirate.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects the therapeutic experience here.`,
      ];
    },

    'Beauty Center Salon': () => {
      if (isExcellent && count >= 200) return [
        'Clients describe the aesthetic practitioners as skilled, careful, and willing to discuss treatment goals thoroughly before starting.',
        'Results from treatments are praised for looking natural and well-suited to individual facial features.',
        `A ${ratingRaw}-star average from ${count} reviews confirms a consistently high standard of aesthetic and beauty care.`,
        'The center maintains a clean and welcoming environment that clients describe as relaxing and professional.',
      ];
      if (isVeryGood || isGood) return [
        'Aesthetic practitioners explain procedures clearly and clients feel comfortable asking questions before treatments.',
        'The quality of results and the hygiene standards of the facility earn consistent positive feedback.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects strong client satisfaction at this licensed beauty center.`,
      ];
      return [
        'Medical aesthetic treatments and licensed beauty services are offered at this DHA-regulated beauty center.',
        'Practitioners hold the required qualifications and the center meets regulatory standards for aesthetic practice.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects client experiences at this facility.`,
      ];
    },

    'Convalescence House': () => {
      if (isExcellent) return [
        'Residents and families describe the facility as a genuinely nurturing environment for post-hospital recovery.',
        'Nursing staff are attentive to both physical and emotional wellbeing during what can be a difficult period.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects exceptional satisfaction with the recovery care provided here.`,
        'Physiotherapy and dietary support are well-coordinated, helping patients regain strength more quickly after discharge.',
      ];
      return [
        'Short-term residential recovery care is provided at this DHA-licensed convalescence facility in Dubai.',
        'Patients transitioning from hospital to home benefit from nursing support, therapy, and a structured recovery environment.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects patient and family experiences here.`,
      ];
    },

    'Nursery Clinic': () => {
      return [
        'The nursery clinic provides health checks, basic first aid, and medical support to children throughout the nursery day.',
        'Parents appreciate knowing trained health staff are on hand to respond to minor incidents and illnesses.',
        'DHA licensing ensures the health provision meets the regulatory standard required for childcare settings in Dubai.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects overall parent satisfaction with the nursery.`,
      ];
    },

    'Cord Blood / Stem Cell Center': () => {
      if (isExcellent) return [
        'Parents describe the collection and banking process as seamless and the team as informative and reassuring.',
        'The center explains the science and long-term value of cord blood banking clearly, without resorting to pressure tactics.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects strong trust in this specialist stem cell banking service.`,
        'International accreditation and DHA licensing provide families with confidence in the storage standards maintained here.',
      ];
      return [
        'Cord blood collection, processing, and cryogenic stem cell banking are offered to new parents at this DHA-licensed center.',
        'The team works with birthing hospitals across the UAE to collect samples reliably at the time of delivery.',
        `A ${ratingRaw ? ratingRaw + '-star' : 'developing'} rating from ${count} reviews reflects parent confidence in this service.`,
      ];
    },

    'First Aid Unit': () => {
      return [
        'First aid staff are present on-site to respond promptly to medical incidents involving guests or staff.',
        'The unit is equipped to manage minor injuries and stabilise patients pending transfer to a hospital if required.',
        'DHA licensing ensures the first aid provision meets the regulatory standard for on-site medical facilities.',
        `A ${ratingRaw}-star rating from ${count} reviews reflects the overall guest experience at this venue.`,
      ];
    },
  };

  const fn = typeMap[type];
  if (fn) return fn();
  // Fallback
  return [
    `${name} is a DHA-licensed facility offering healthcare services to patients in Dubai.`,
    ratingRaw
      ? `A ${ratingRaw}-star rating from ${count} reviews reflects patient experience at this facility.`
      : 'Patient feedback on this facility is developing as it builds its online presence.',
    'Patients are encouraged to call ahead to confirm services, availability, and appointment options.',
  ];
}

// ── type-specific expansion sentences ────────────────────────────────────────

function expansionSentences(type, name, ratingRaw, count) {
  const expansions = {
    'Polyclinic (Multiple Specialties)': [
      'The clinic accepts walk-in patients alongside booked appointments and most consultations are conducted in English and Arabic.',
      'Patients can see general practitioners and specialist doctors within the same visit, depending on what the clinic offers.',
      'Multi-specialty polyclinics under the DHA are required to maintain qualified staff and proper equipment standards.',
      'Follow-up care, sick certificates, and insurance-approved referrals are typical requests handled at DHA polyclinics.',
    ],
    'Community/Retail Pharmacy': [
      'Pharmacists can answer questions about drug interactions, dosage, and over-the-counter alternatives.',
      'Prescription medications from DHA-licensed doctors can be dispensed here, and delivery options may be available.',
      'The pharmacy stocks a range of vitamins, supplements, baby products, and personal care items alongside dispensed medications.',
      'DHA community pharmacies are required to maintain a qualified pharmacist on site during all operating hours.',
    ],
    'School clinic': [
      'The clinic is staffed by a licensed nurse or medic who supports student health throughout the school day.',
      'Routine screenings, vaccination records management, and emergency first aid are typical clinic functions.',
      'Parents are contacted promptly in the event of any medical issue that requires attention beyond basic first aid.',
      'The DHA requires school clinics to meet minimum staffing and equipment standards for student health provision.',
    ],
    'Clinical Support (2 Specs or more) Center': [
      'The center works alongside referring clinics and hospitals to provide investigative and therapeutic support.',
      'Patients are typically referred here by their treating doctor rather than self-presenting.',
      'A multi-specialty clinical support license from the DHA requires the center to maintain qualified staff across all registered disciplines.',
    ],
    'Clinical Support (1 Spec) Center – Optical': [
      'Optometrists on site can detect early signs of conditions such as glaucoma, macular degeneration, and diabetic retinopathy during routine eye exams.',
      'Contact lens fittings and prescription updates are available with same-day or next-day lens options for many prescriptions.',
      'All optical frames and lenses meet UAE quality standards and are sourced from approved suppliers.',
    ],
    'Clinical Support (1 Spec) Center – Dental Laboratory': [
      'The lab serves dental clinics and practices across Dubai that need prosthetic work fabricated to clinical specifications.',
      'Digital scanning compatibility and CAD/CAM production are increasingly common at DHA-licensed dental labs.',
      'Quality materials and accurate bite registration are the foundation of reliable prosthetic outcomes.',
    ],
    'Clinical Support (1 Spec) Center': [
      'The center operates within a specific clinical discipline and is registered under that specialty with the DHA.',
      'Referrals from treating practitioners are the primary source of patients at this type of support facility.',
      'Quality standards for single-specialty clinical support centers are set and monitored by the DHA.',
    ],
    'Home Healthcare Center': [
      'Services are coordinated through a central office and home visits are scheduled based on the patient\'s care plan.',
      'Insurance coverage for home healthcare is increasingly accepted across Dubai, making it a practical option for long-term care needs.',
      'Home healthcare is regulated by the DHA and providers must hold active licences and employ qualified clinical staff.',
      'Common use cases include post-surgical recovery, palliative care, elderly patient support, and chronic disease monitoring.',
    ],
    'Ambulatory Pharmacy': [
      'Ambulatory pharmacies serve outpatient populations and are often located near clinics or hospital outpatient departments.',
      'Medication counseling and advice on proper administration are provided alongside prescription dispensing.',
      'The DHA licence covers pharmaceutical practice standards that all ambulatory pharmacies in Dubai must follow.',
    ],
    'Hospital Pharmacy': [
      'Hospital pharmacies manage complex medication regimens for inpatients and provide outpatient prescription services.',
      'Clinical pharmacists work alongside medical teams to review drug doses, monitor for interactions, and advise on substitutions.',
      'The pharmacy operates under DHA regulation and follows strict protocols for controlled drug handling and storage.',
    ],
    'Compounding Pharmacy': [
      'Custom preparations include modified-release formulations, alternative dosage forms, and medications not available commercially in the UAE.',
      'All compounding is carried out in compliance with DHA standards and uses pharmaceutical-grade ingredients.',
      'Prescribers across Dubai refer patients here when standard commercial products do not meet the specific clinical need.',
    ],
    'Drug store': [
      'Non-prescription items include vitamins, first aid products, hygiene essentials, and a selection of health supplements.',
      'Drug stores in Dubai operate under DHA oversight and must meet standards for product storage and labelling.',
      'Customers can also find baby care products, basic wound care supplies, and hygiene essentials in store.',
      'Staff are available to direct customers to suitable products, though clinical advice is outside the store\'s scope.',
    ],
    'Clinic within Pharmacy': [
      'The integrated model allows patients to consult a doctor and collect their prescription in one location.',
      'Minor illness consultations, blood pressure checks, and basic health screenings are common uses for this type of facility.',
      'DHA oversight applies to both the clinical and pharmaceutical components of this combined facility.',
    ],
    'General Clinic': [
      'The clinic handles routine consultations, sick notes, prescription renewals, and referrals to specialist care.',
      'Walk-in and appointment-based patients are typically both accepted, with shorter waits for those with pre-booked slots.',
      'General clinics licensed by the DHA are required to maintain a qualified doctor on site throughout all operating hours.',
      'Common presentations include respiratory infections, skin conditions, musculoskeletal pain, and chronic disease follow-up.',
    ],
    'General Dental Clinic': [
      'Routine checkups, professional cleaning, fillings, extractions, and basic cosmetic procedures are offered.',
      'Dental emergencies including toothache and broken restorations are typically seen on the same day when slots are available.',
      'DHA-licensed dental clinics are required to follow infection control protocols and maintain qualified dentists on site.',
      'Many dental clinics in Dubai accept major UAE health insurance plans for routine and restorative procedures.',
    ],
    'Day Surgery Center': [
      'Common procedures include minor orthopaedic, gastrointestinal, ophthalmological, and ENT surgeries performed on a same-day basis.',
      'Patients typically arrive, have their procedure, and are discharged with post-operative instructions within a few hours.',
      'The facility holds a DHA day surgery licence and is subject to regular compliance inspections.',
      'Anaesthesia and recovery nursing care are available on site as part of the day surgery process.',
    ],
    'Diagnostic Center (Multiple Specialties)': [
      'Patients can complete multiple investigations in one visit, which reduces the need for separate appointments at different facilities.',
      'Reports are typically available within hours for routine tests and within 24 to 48 hours for more complex panels.',
      'The center\'s DHA licence covers both laboratory and imaging services offered under one roof.',
      'Referral letters from treating doctors are accepted and the center can send reports directly to the referring physician.',
    ],
    'Radio-Diagnostic Center': [
      'Imaging services are conducted by qualified radiographers and reports are prepared by licensed radiologists.',
      'Patients can request urgent scans with same-day availability depending on the imaging modality and clinical priority.',
      'The DHA requires radiology centers to maintain calibrated equipment and employ appropriately credentialed imaging staff.',
    ],
    'Medical Laboratory': [
      'Home sample collection may be available for patients who find it difficult to visit the lab in person.',
      'Results are accessible through a patient portal or app in most cases, and abnormal values are communicated promptly.',
      'The laboratory operates under DHA quality standards and participates in external quality assurance programs.',
    ],
    'Medical Fitness Center': [
      'The center is authorised to issue medical fitness certificates accepted by the Roads and Transport Authority and federal immigration authorities.',
      'Assessment results are typically issued on the same day and can be processed digitally for government submission.',
      'Medical fitness centers in Dubai are required to be staffed by licensed physicians and to follow DHA protocols.',
    ],
    'Specialty Clinic': [
      'Patients are referred here by general practitioners or self-refer when they have been assessed and require specialist input.',
      'The specialist physicians hold credentials in their field and the clinic is equipped to support the specific treatments offered.',
      'DHA specialty clinic licences require practitioners to hold the relevant specialist qualifications and experience.',
    ],
    'Specialty Hospital (<50)': [
      'Despite its smaller size, the hospital offers a focused depth of expertise not always available at larger general hospitals.',
      'Inpatient beds and a dedicated nursing team support patients who require overnight or multi-day admission.',
      'The facility is licensed by the DHA and meets all required standards for specialist hospital operation in Dubai.',
    ],
    'General Hospital (50- 100)': [
      'The hospital provides inpatient and outpatient services and operates a dedicated emergency department.',
      'Specialist departments cover common areas of medicine including internal medicine, surgery, obstetrics, and paediatrics.',
      'DHA general hospital licences are subject to regular audit and compliance review to maintain operational standards.',
    ],
    'General Hospital (>100)': [
      'The hospital operates across multiple clinical floors and departments and is capable of managing complex and high-dependency cases.',
      'Specialist teams in surgery, medicine, intensive care, and diagnostics work alongside each other within a single facility.',
      'As a major DHA-licensed institution, the hospital undergoes regular accreditation reviews and regulatory inspections.',
      'Outpatient clinics run alongside inpatient services, giving patients access to specialist care without admission.',
    ],
    'Fertility Center': [
      'Fertility treatments are conducted by reproductive endocrinologists and embryologists with the support of specialised nursing staff.',
      'The center follows UAE regulations for assisted reproductive technology and operates under DHA licence.',
      'Initial consultations assess both partners where relevant and a personalised treatment pathway is agreed before starting.',
    ],
    'Telehealth Provider': [
      'Patients download an app or use a web portal to connect with a doctor, often within a few minutes of requesting a session.',
      'Consultations are legally equivalent to in-person visits for the purposes of prescription and sick note issuance under UAE regulations.',
      'The provider is registered with the DHA and all consulting doctors hold active UAE medical licences.',
    ],
    'Telehealth Platform': [
      'Doctors on the platform are licensed in the UAE and consultations comply with DHA telehealth regulations.',
      'The service covers a range of common health concerns and can issue digital prescriptions valid at UAE pharmacies.',
      'Patients in Dubai can access the platform via app or browser at any time, making it suited to busy schedules.',
    ],
    'Traditional Complementary & Alternative Medicine (TCAM) Facilities (1 Spec)': [
      'The DHA requires TCAM practitioners to hold recognised qualifications in their discipline and to operate within defined clinical boundaries.',
      'Treatments may include herbal medicine, acupuncture, cupping, or other modalities depending on the center\'s registered specialty.',
      'Patients are assessed before treatment and a therapeutic plan is agreed based on their individual health profile.',
    ],
    'Beauty Center Salon': [
      'Procedures are carried out by qualified practitioners who hold the licences required by the DHA for medical aesthetic services.',
      'Skin treatments, injectables, laser therapy, and body contouring may be available depending on the center\'s registered scope.',
      'A clinical consultation is required before most medical aesthetic procedures to confirm suitability and manage expectations.',
    ],
    'Convalescence House': [
      'Residents benefit from round-the-clock nursing care, physiotherapy, dietary supervision, and structured recovery activities.',
      'The facility is suitable for patients discharged from hospital who are not yet ready to manage independently at home.',
      'DHA licencing ensures the facility meets the residential care standards required for medically supervised convalescence.',
    ],
    'Nursery Clinic': [
      'The health clinic provides a safe first point of contact for minor illness, injury, and wellbeing concerns that arise during the nursery day.',
      'Vaccination records are maintained and health screening checks are incorporated into the nursery\'s regular programme.',
      'Parents are kept informed of any health incidents through the nursery\'s communication channels.',
    ],
    'Cord Blood / Stem Cell Center': [
      'Cord blood units are processed and cryogenically stored in accredited facilities to preserve their viability for future medical use.',
      'Banking cord blood is a one-time opportunity at birth and the center coordinates with the delivery hospital to ensure successful collection.',
      'Stored stem cells may be useful in the future treatment of certain blood, immune, and metabolic disorders.',
    ],
    'First Aid Unit': [
      'The unit is stocked with medical supplies and staffed by personnel trained to manage a range of first aid scenarios.',
      'For serious emergencies, the first aid team stabilises the patient and coordinates handover to ambulance services.',
      'DHA-licensed first aid units are required to maintain equipment to specified standards and to keep staff training current.',
    ],
  };
  return expansions[type] || [
    'The facility holds an active licence from the relevant UAE healthcare regulator.',
    'Patients are encouraged to call or check the website for the latest information on services and availability.',
  ];
}

// ── description generator ─────────────────────────────────────────────────────

function generateDescription(p) {
  const name = cleanName(p.name);
  const label = facilityLabel(p.facilityType);
  const reg = regulator(p.id);

  // Area extraction
  // Detect corrupted address fields (scraped review text leaking in)
  const rawAddr = p.address || '';
  const isCorruptAddr = rawAddr.length > 150 || /your\s+(kind|experience|words)/i.test(rawAddr) || rawAddr.includes('More');
  // Fall back to shortDescription for area when address is corrupted
  const addrSource = isCorruptAddr ? (p.shortDescription || '') : rawAddr;
  // Also sanitise any em-dashes from the address
  const addr = addrSource.replace(/\u2014/g, '-').replace(/\u2013/g, '-');

  let areaStr = null;
  const addrParts = addr.split(',').map(s => s.trim()).filter(Boolean);
  // Look for recognisable area candidates (not all-caps district codes, not street numbers)
  const areaCandidate = addrParts.find(part =>
    part.length > 3 &&
    !/^\d/.test(part) &&
    !/^(Dubai|UAE|Abu Dhabi|Sharjah)$/i.test(part) &&
    !/\b(street|road|rd|st)\b/i.test(part) &&
    !/Building|Tower|Floor|Villa|Centre|Center|Mall|Hotel/i.test(part) &&
    !part.includes(' Street ') &&
    !part.includes(' Road ') &&
    part !== part.toUpperCase()
  );
  if (areaCandidate) {
    areaStr = areaCandidate;
  } else {
    const idx = addrParts.indexOf('Dubai');
    if (idx > 1) areaStr = toTitleCase(addrParts[idx - 1]);
  }

  const city = 'Dubai';
  const ratingData = formatRating(p.googleRating, p.googleReviewCount);
  const rating = ratingPhrase(ratingData);
  const services = servicePhrase(p.facilityType, name);
  const contact = contactPhrase(p.phone, p.website);
  const expansions = expansionSentences(p.facilityType, name, p.googleRating ? parseFloat(p.googleRating) : null, p.googleReviewCount || 0);

  // Build the description
  let parts = [];

  // Sentence 1: Name + type + location
  if (areaStr && areaStr.toLowerCase() !== 'dubai') {
    parts.push(`${name} is a ${label} in ${areaStr}, ${city}, licensed by the ${reg}.`);
  } else {
    parts.push(`${name} is a ${label} in ${city}, licensed by the ${reg}.`);
  }

  // Sentence 2: Rating
  if (rating) parts.push(rating);

  // Sentence 3: Services
  parts.push(services);

  // Add expansion sentences until we hit 80-120 words
  let expIdx = 0;
  while (expIdx < expansions.length) {
    const candidate = parts.concat([expansions[expIdx], contact]).join(' ');
    const wordCount = candidate.split(/\s+/).length;
    if (wordCount <= 120) {
      parts.push(expansions[expIdx]);
      expIdx++;
      // Check if we are already at or past 80 words with contact
      const withContact = parts.concat([contact]).join(' ').split(/\s+/).length;
      if (withContact >= 80) break;
    } else {
      break;
    }
  }

  // Add contact last
  parts.push(contact);

  let desc = parts.join(' ');

  // Final safety trim if over 120
  let wc = desc.split(/\s+/).length;
  while (wc > 120 && parts.length > 3) {
    // Remove the last expansion (second-to-last part before contact)
    parts.splice(parts.length - 2, 1);
    desc = parts.join(' ');
    wc = desc.split(/\s+/).length;
  }

  return desc;
}

// ── main ──────────────────────────────────────────────────────────────────────

const result = {};
let count = 0;

for (let i = 0; i < providers.length; i++) {
  const p = providers[i];
  const globalIdx = 4000 + i;

  const description = generateDescription(p);
  const reviewSummary = generateReviews(p);

  result[String(globalIdx)] = { description, reviewSummary };
  count++;
}

const outPath = path.join(__dirname, 'enrichment-chunks/chunk-4000-4999.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log('Written:', count, 'entries to', outPath);
console.log('Sample 4000:', JSON.stringify(result['4000'], null, 2));
console.log('Sample 4021:', JSON.stringify(result['4021'], null, 2));
console.log('Sample 4049:', JSON.stringify(result['4049'], null, 2));
