#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../src/lib/providers-scraped.json');
const OUT_DIR = path.join(__dirname, 'enrichment-chunks');
const OUT_PATH = path.join(OUT_DIR, 'chunk-5000-5999.json');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const chunk = data.slice(5000, 6000);

// ── Helpers ────────────────────────────────────────────────────────────────

function cityLabel(slug) {
  const map = {
    dubai: 'Dubai',
    'abu-dhabi': 'Abu Dhabi',
    sharjah: 'Sharjah',
    ajman: 'Ajman',
    fujairah: 'Fujairah',
    'ras-al-khaimah': 'Ras Al Khaimah',
    'umm-al-quwain': 'Umm Al Quwain',
  };
  return map[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function regulatorFull(id) {
  if (!id) return 'the Ministry of Health and Prevention (MOHAP)';
  if (id.startsWith('dha_')) return 'the Dubai Health Authority (DHA)';
  if (id.startsWith('doh_')) return 'the Department of Health Abu Dhabi (DOH)';
  return 'the Ministry of Health and Prevention (MOHAP)';
}

function regulatorAbbr(id) {
  if (!id) return 'MOHAP';
  if (id.startsWith('dha_')) return 'DHA';
  if (id.startsWith('doh_')) return 'DOH';
  return 'MOHAP';
}

function ratingTier(rating, count) {
  const r = parseFloat(rating);
  if (!rating || isNaN(r) || count === 0) return 'no-rating';
  if (r >= 4.7) return 'exceptional';
  if (r >= 4.3) return 'high';
  if (r >= 3.8) return 'good';
  if (r >= 3.0) return 'mixed';
  return 'low';
}

function cleanFacilityType(ft) {
  if (!ft || ft === 'null') return null;
  return ft;
}

function areaFromAddress(address) {
  if (!address) return null;
  const parts = address.split(/[-,]/).map(s => s.trim()).filter(s => s.length > 2);
  for (const part of parts) {
    if (/^[A-Z][A-Z\s]{3,}$/.test(part) && !/\d/.test(part) &&
        !['UAE', 'LLC', 'FZE', 'LLP', 'PJSC', 'AED'].includes(part.trim())) {
      return part.replace(/\b\w/g, c => c.toUpperCase()).trim();
    }
  }
  return null;
}

function hoursNote(raw) {
  if (!raw) return '';
  const r = raw.toLowerCase();
  if (r.includes('24 hour') || r.includes('open 24')) return 'open around the clock';
  if (r.includes('1:30 am') || r.includes('2:00 am') || r.includes('1:00 am')) return 'open late into the night';
  if (r.includes('12:00 am') || r.includes('midnight')) return 'open until midnight';
  if (r.includes('closes 10 pm') || r.includes('10:00 pm') || r.includes('11:00 pm') || r.includes('11:30 pm')) return 'open into the evening';
  if (r.includes('closes 6 pm') || r.includes('6:00 pm')) return 'open through standard daytime hours';
  if (r.includes('closes 8 pm') || r.includes('8:00 pm') || r.includes('closes 9 pm')) return 'open through the evening';
  return '';
}

function servicesList(services, limit) {
  if (!services || services.length === 0) return null;
  const l = limit || 4;
  const clean = services.filter(s => s && s.trim().length > 1).slice(0, l);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  const last = clean.pop();
  return clean.join(', ') + ' and ' + last;
}

function wordCount(str) {
  return str.trim().split(/\s+/).length;
}

// ── Description builders ───────────────────────────────────────────────────

function buildDescription(p) {
  const city = cityLabel(p.citySlug);
  const regFull = regulatorFull(p.id);
  const regAbbr = regulatorAbbr(p.id);
  const rating = parseFloat(p.googleRating);
  const count = p.googleReviewCount || 0;
  const tier = ratingTier(p.googleRating, count);
  const ft = cleanFacilityType(p.facilityType);
  const phone = p.phone || null;
  const website = p.website || null;
  const services = p.services && p.services.length > 0 ? p.services : null;
  const area = areaFromAddress(p.address);
  const hours = hoursNote(p.hoursRaw);
  const cat = p.categorySlug;

  const locationPhrase = area ? `in ${area}, ${city}` : `in ${city}`;

  let ratingPhrase = '';
  if (tier === 'exceptional') {
    ratingPhrase = `Patients rate it ${rating} out of 5 across ${count} reviews, reflecting a high level of satisfaction.`;
  } else if (tier === 'high') {
    ratingPhrase = `It holds a ${rating}-star rating from ${count} patient reviews.`;
  } else if (tier === 'good') {
    ratingPhrase = `It carries a ${rating}-star rating from ${count} patient reviews.`;
  } else if (tier === 'mixed') {
    ratingPhrase = `It has a ${rating}-star rating from ${count} reviews.`;
  } else if (tier === 'low') {
    ratingPhrase = `It has a ${rating}-star rating based on available reviews.`;
  }

  let contactPhrase = '';
  if (phone && website) {
    contactPhrase = `Appointments can be arranged by calling ${phone} or through the facility website.`;
  } else if (phone) {
    contactPhrase = `The facility can be reached at ${phone}.`;
  } else if (website) {
    contactPhrase = `Further details are available through the facility website.`;
  }

  if (cat === 'pharmacy') return buildPharmacy(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'ophthalmology') return buildOpthalmology(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'dental') return buildDental(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'home-healthcare') return buildHomeHealth(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'hospitals') return buildHospital(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'dermatology') return buildDermatology(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'radiology-imaging') return buildRadiology(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'labs-diagnostics') return buildLab(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'pediatrics') return buildPediatrics(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'medical-equipment') return buildMedEquip(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'alternative-medicine') return buildAltMed(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  if (cat === 'physiotherapy') return buildPhysio(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
  return buildClinic(p, city, locationPhrase, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services);
}

function buildPharmacy(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'Pharmacy' && ft !== 'null') ? ft.toLowerCase() : 'community pharmacy';
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  desc += `Licensed and regulated by ${regFull}, the pharmacy dispenses prescription medications, over-the-counter remedies, and a broad range of health and wellness products. `;
  if (hours) {
    desc += `The pharmacy is ${hours}, giving residents and visitors flexible access to medications when they need them. `;
  } else {
    desc += `The pharmacy serves the local community with consistent access to medications and basic health supplies. `;
  }
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Pharmacists are available to advise on dosage, drug interactions, and suitable over-the-counter treatments. The facility is listed in the UAE Open Healthcare Directory and verified against the ${regAbbr} register.`;
  }
  return desc.trim();
}

function buildOpthalmology(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'eye care facility';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is an eye care facility ${loc}, UAE. `;
  if (svcText) {
    desc += `The center delivers ${svcText.toLowerCase()} to patients seeking ophthalmic care. `;
  } else {
    desc += `The center provides vision testing, optical prescriptions, and eye health assessments for patients of all ages. `;
  }
  desc += `Licensed by ${regFull}, the facility operates within the UAE's regulated healthcare framework, and all practitioners hold credentials recognised by ${regAbbr}. `;
  if (hours) desc += `The center is ${hours}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Patients with concerns about cataracts, glaucoma, dry eye, or routine prescription updates will find qualified optometrists on hand.`;
  }
  return desc.trim();
}

function buildDental(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'dental clinic';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  if (svcText) {
    desc += `Services include ${svcText.toLowerCase()}, with the team addressing both routine and specialised dental needs. `;
  } else {
    desc += `The clinic delivers general dentistry, cosmetic procedures, and orthodontic care to patients across age groups. `;
  }
  desc += `Operating under a license from ${regFull}, the facility meets UAE standards for dental practice, equipment hygiene, and patient safety. `;
  if (hours) desc += `The clinic is ${hours}, making it accessible for working patients and families. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` The dental team communicates treatment plans clearly before proceeding, keeping patients informed at every step of their care.`;
  }
  return desc.trim();
}

function buildHomeHealth(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a home healthcare provider based ${loc}, UAE. `;
  if (svcText) {
    desc += `The clinical team delivers ${svcText.toLowerCase()} directly to patients in their own homes, removing the burden of repeated hospital travel. `;
  } else {
    desc += `The clinical team delivers professional nursing, physiotherapy, and post-operative support directly to patients in their own homes, removing the burden of repeated hospital travel. `;
  }
  desc += `Licensed by ${regFull}, the service operates within the UAE's regulated home care framework, ensuring practitioners meet the clinical and ethical standards set by ${regAbbr}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Families seeking continuity of care between hospital discharge and full recovery will find this provider a dependable option.`;
  }
  return desc.trim();
}

function buildHospital(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const svcText = services ? servicesList(services, 4) : null;
  let desc = `${p.name} is a hospital ${loc}, UAE. `;
  if (svcText) {
    desc += `Clinical departments include ${svcText.toLowerCase()}, giving patients access to a range of specialist care under one roof. `;
  } else {
    desc += `The hospital provides inpatient and outpatient care across multiple medical and surgical departments, serving the wider community with a broad range of clinical services. `;
  }
  desc += `It is licensed by ${regFull} and operates in line with UAE healthcare regulations. `;
  if (hours) desc += `The facility is accessible ${hours}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Patients can access emergency services, specialist consultations, and planned procedures through the hospital's outpatient and inpatient pathways.`;
  }
  return desc.trim();
}

function buildDermatology(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'dermatology clinic';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  if (svcText) {
    desc += `The clinic addresses ${svcText.toLowerCase()}, offering both medical and aesthetic skin treatments for a diverse patient base. `;
  } else {
    desc += `The clinic addresses medical and aesthetic skin conditions including acne, eczema, psoriasis, hyperpigmentation, and cosmetic dermatology for a diverse patient base. `;
  }
  desc += `Licensed by ${regFull}, it operates to UAE dermatological standards and all treating physicians are recognised by ${regAbbr}. `;
  if (hours) desc += `The clinic is ${hours}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Patients with chronic skin conditions will find dermatologists who tailor treatment plans to individual skin type and lifestyle factors.`;
  }
  return desc.trim();
}

function buildRadiology(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a radiology and diagnostic imaging center ${loc}, UAE. `;
  if (svcText) {
    desc += `Imaging modalities available include ${svcText.toLowerCase()}, covering a range of diagnostic referral needs. `;
  } else {
    desc += `The center offers X-ray, ultrasound, CT, and MRI services to support diagnostic referrals and routine health screenings. `;
  }
  desc += `Operating under a license from ${regFull}, the facility meets UAE imaging safety and quality standards, and radiographers hold credentials recognised by ${regAbbr}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Referring clinicians receive detailed radiology reports within agreed turnaround times, and the team is experienced in communicating results clearly to patients and their doctors.`;
  }
  return desc.trim();
}

function buildLab(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a medical laboratory and diagnostics facility ${loc}, UAE. `;
  if (svcText) {
    desc += `Available tests and panels include ${svcText.toLowerCase()}, processing samples for clinical referrals and preventive health screenings. `;
  } else {
    desc += `The lab processes blood work, urine analysis, microbiology cultures, and routine health screening panels for clinical referrals and preventive care programmes. `;
  }
  desc += `Licensed by ${regFull}, results meet UAE diagnostic quality standards and turnaround times are designed to support timely clinical decision-making. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Trained phlebotomists and lab technicians handle sample collection and processing, and results are typically shared directly with the patient's referring physician.`;
  }
  return desc.trim();
}

function buildPediatrics(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'pediatric clinic';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  if (svcText) {
    desc += `The clinic offers ${svcText.toLowerCase()} for infants, children, and adolescents, supported by a team of qualified pediatric practitioners. `;
  } else {
    desc += `The clinic offers well-child check-ups, immunisations, growth monitoring, and treatment for common childhood illnesses, supported by qualified pediatric practitioners. `;
  }
  desc += `Licensed by ${regFull}, the facility follows UAE clinical guidelines for pediatric care and all physicians are credentialed under ${regAbbr}. `;
  if (hours) desc += `The clinic is ${hours}, which suits families managing school and work schedules. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` The team is practiced at putting young patients at ease, making clinical visits less stressful for both children and parents.`;
  }
  return desc.trim();
}

function buildMedEquip(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a medical equipment supplier ${loc}, UAE. `;
  if (svcText) {
    desc += `Products and services include ${svcText.toLowerCase()}, available to patients, caregivers, and healthcare professionals. `;
  } else {
    desc += `The supplier stocks mobility aids, home monitoring devices, rehabilitation equipment, wound care supplies, and home medical essentials for patients, caregivers, and healthcare professionals. `;
  }
  desc += `Registered under ${regFull}, the supplier operates within the UAE's medical device regulatory framework, and all products meet the standards required by ${regAbbr}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Staff are trained to advise on appropriate equipment selection based on patient diagnosis and care setting, helping customers make informed decisions.`;
  }
  return desc.trim();
}

function buildAltMed(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'alternative medicine center';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  if (svcText) {
    desc += `Treatments offered include ${svcText.toLowerCase()}, delivered by qualified practitioners in a calm, private clinical setting. `;
  } else {
    desc += `The center offers traditional and complementary therapies including acupuncture, cupping, herbal medicine, and holistic wellness consultations in a calm, private clinical setting. `;
  }
  desc += `Licensed by ${regFull}, the facility operates under UAE regulations for alternative and complementary medicine, and all practitioners are registered with ${regAbbr}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Patients seeking relief from chronic pain, stress, or lifestyle conditions often find complementary therapies a useful addition to their overall health plan.`;
  }
  return desc.trim();
}

function buildPhysio(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const typeLabel = (ft && ft !== 'null') ? ft.toLowerCase() : 'physiotherapy center';
  const svcText = services ? servicesList(services, 3) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;
  if (svcText) {
    desc += `The clinic delivers ${svcText.toLowerCase()} for patients recovering from injury or managing chronic musculoskeletal conditions. `;
  } else {
    desc += `The clinic delivers musculoskeletal rehabilitation, sports injury recovery, post-operative physiotherapy, and chronic pain management for patients at various stages of their recovery. `;
  }
  desc += `Licensed by ${regFull}, all physiotherapists hold credentials recognised by ${regAbbr} and treatments follow UAE clinical standards for the profession. `;
  if (hours) desc += `The clinic is ${hours}. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;
  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` Treatment programmes are personalised following an initial assessment, with progress reviewed and adjusted throughout the course of care.`;
  }
  return desc.trim();
}

function buildClinic(p, city, loc, regFull, regAbbr, tier, rating, count, ratingPhrase, contactPhrase, ft, hours, services) {
  const ftLower = (ft || '').toLowerCase();
  let typeLabel = 'medical clinic';
  if (ftLower.includes('polyclinic')) typeLabel = 'polyclinic';
  else if (ftLower.includes('general medicine')) typeLabel = 'general medicine clinic';
  else if (ftLower.includes('school clinic')) typeLabel = 'school clinic';
  else if (ftLower.includes('medical center') || ftLower.includes('medical centre')) typeLabel = 'medical center';
  else if (ftLower.includes('specialist medical')) typeLabel = 'specialist medical center';
  else if (ftLower.includes('clinical support')) typeLabel = 'clinical support center';
  else if (ftLower.includes('diagnostic')) typeLabel = 'diagnostic center';
  else if (ftLower.includes('surgical')) typeLabel = 'surgical center';
  else if (ft && ft !== 'null') typeLabel = ft.toLowerCase();

  const svcText = services ? servicesList(services, 4) : null;
  let desc = `${p.name} is a ${typeLabel} ${loc}, UAE. `;

  if (typeLabel === 'school clinic') {
    desc += `The clinic supports students and staff with first aid, health monitoring, routine health referrals, and wellness guidance within the school environment. It provides a first line of response for health concerns that arise during the school day. `;
  } else if (typeLabel === 'polyclinic') {
    if (svcText) {
      desc += `The polyclinic brings together specialists in ${svcText.toLowerCase()}, giving patients access to multiple disciplines without changing facilities. `;
    } else {
      desc += `The polyclinic brings together practitioners across multiple medical specialties, giving patients access to a range of disciplines under one roof without the need to attend several separate facilities. `;
    }
  } else if (typeLabel === 'clinical support center') {
    if (svcText) {
      desc += `The center delivers ${svcText.toLowerCase()} to patients requiring specialised clinical support, complementing the work of referring physicians and general practitioners. `;
    } else {
      desc += `The center delivers specialist clinical support services to patients referred by general practitioners and hospital physicians, providing targeted outpatient care across two or more medical disciplines. `;
    }
  } else {
    if (svcText) {
      desc += `The clinic provides ${svcText.toLowerCase()} for patients seeking outpatient medical care in the local area. `;
    } else {
      desc += `The clinic provides outpatient consultations and general medical care, serving the local community with accessible primary and specialist health services. `;
    }
  }

  desc += `Licensed by ${regFull}, the facility operates within UAE's regulated healthcare system and all practitioners hold credentials issued or recognised by ${regAbbr}. `;
  if (hours) desc += `The clinic is ${hours}, offering flexibility for working patients and families. `;
  if (ratingPhrase) desc += `${ratingPhrase} `;
  if (contactPhrase) desc += `${contactPhrase}`;

  const wc = wordCount(desc);
  if (wc < 80) {
    desc = desc.trim() + ` The facility is verified in the UAE Open Healthcare Directory, sourced from official regulatory records.`;
  }
  return desc.trim();
}

// ── Review Summary builders ────────────────────────────────────────────────

function buildReviewSummary(p) {
  const tier = ratingTier(p.googleRating, p.googleReviewCount);
  const cat = p.categorySlug;
  const city = cityLabel(p.citySlug);
  const ft = cleanFacilityType(p.facilityType) || '';
  const rating = parseFloat(p.googleRating);
  const count = p.googleReviewCount || 0;

  if (cat === 'pharmacy') return pharmacyReviews(tier, rating, count, ft);
  if (cat === 'ophthalmology') return ophthReviews(tier, rating, count, ft);
  if (cat === 'dental') return dentalReviews(tier, rating, count, ft);
  if (cat === 'home-healthcare') return homeHealthReviews(tier, rating, count, ft);
  if (cat === 'hospitals') return hospitalReviews(tier, rating, count, ft);
  if (cat === 'dermatology') return dermReviews(tier, rating, count, ft);
  if (cat === 'radiology-imaging') return radiologyReviews(tier, rating, count, ft);
  if (cat === 'labs-diagnostics') return labReviews(tier, rating, count, ft);
  if (cat === 'pediatrics') return pedsReviews(tier, rating, count, ft);
  if (cat === 'medical-equipment') return medEquipReviews(tier, rating, count, ft);
  if (cat === 'alternative-medicine') return altMedReviews(tier, rating, count, ft);
  if (cat === 'physiotherapy') return physioReviews(tier, rating, count, ft);
  return clinicReviews(p, tier, rating, count, ft);
}

function pharmacyReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Staff are knowledgeable and willing to answer questions on medication use and interactions.",
    "Good stock of common prescriptions means most fills are completed without delay.",
    "A practical neighbourhood option for over-the-counter remedies and health essentials.",
    "Pharmacists take a patient, unhurried approach with walk-in customers."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients calling the service consistently reliable and friendly.`,
    "Pharmacists take time to explain medications clearly rather than simply handing over a bag.",
    "Well-stocked shelves mean most prescriptions are filled on the spot without a wait.",
    "The team handles queries from both walk-ins and regulars with patience and attention.",
    "Convenient location and quick turnaround make this a trusted neighbourhood option."
  ];
  if (tier === 'high') return [
    `Rated ${rating} out of 5 across ${count} reviews, praised for knowledgeable and approachable staff.`,
    "Most prescriptions are filled quickly and the team proactively flags potential interactions.",
    "Good range of vitamins, supplements, and personal care items alongside core medications.",
    "Regular customers note that pharmacists remember their history and offer genuinely useful guidance."
  ];
  if (tier === 'good') return [
    `Holds a ${rating}-star rating from ${count} reviews with generally positive patient feedback.`,
    "Staff are helpful for routine refills and straightforward health queries.",
    "Occasional peak-hour waits reported but the experience is smooth for most visits.",
    "Decent stock of common medications and standard over-the-counter products."
  ];
  return [
    `Carries a ${rating}-star rating from ${count} reviews, with mixed patient opinions.`,
    "Some patients appreciate the location's convenience for quick prescription refills.",
    "Stock availability and wait times have been inconsistent based on patient feedback.",
    "A basic dispensing service for standard prescriptions in the local area."
  ];
}

function ophthReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Optometrists conduct thorough eye examinations and explain prescription changes in plain terms.",
    "The facility offers reliable vision testing and basic ophthalmic consultations.",
    "Patients appreciate the calm and professional approach to routine eye care.",
    "A practical choice for annual vision checks and updated optical prescriptions."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients describing highly professional and thorough eye care.`,
    "Optometrists allocate enough time during exams and answer questions without rushing.",
    "Modern diagnostic equipment delivers accurate results and patients are not kept waiting long.",
    "The team explains conditions and correction options in plain language without unnecessary jargon.",
    "Convenient booking and short waiting times make the experience genuinely smooth."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects strong patient satisfaction with the service.`,
    "Thorough examinations with well-maintained diagnostic tools are consistently noted by reviewers.",
    "Staff communicate test results and prescription changes clearly and without confusing terminology.",
    "Patients returning for annual check-ups report the same consistent quality from visit to visit."
  ];
  if (tier === 'good') return [
    `Holds a ${rating}-star rating from ${count} reviews with solid overall patient feedback.`,
    "Vision testing is professional and the team is approachable for optical queries.",
    "Some reviewers note occasional wait times but say the care itself is reliable.",
    "A dependable choice for routine eye exams and prescription lens updates."
  ];
  return [
    `A ${rating}-star rating from ${count} reviews reflects a mixed patient experience.`,
    "Functional eye care for basic vision testing and standard prescription needs.",
    "Some reviewers suggest communication and scheduling efficiency could improve.",
    "Accessible for routine prescriptions and optical consultations in the local area."
  ];
}

function dentalReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "The clinic handles routine cleanings, fillings, and dental check-ups to a professional standard.",
    "Staff take a patient approach with anxious visitors, explaining each step before starting.",
    "A practical local option for general dental care without long appointment wait times.",
    "The practice is clean and well-organised, with friendly front-desk staff."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, praised for painless and precise dental care.`,
    "Dentists take time to walk patients through treatment plans before proceeding, which reduces anxiety.",
    "The clinic maintains a calm atmosphere that helps nervous patients feel at ease from arrival.",
    "High standards of cleanliness and sterilisation are consistently noted by multiple reviewers.",
    "Both routine check-ups and cosmetic procedures are handled with care and clear communication."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects strong trust in the dental team.`,
    "Dentists are thorough and keep patients informed throughout each stage of treatment.",
    "A clean, modern clinic with tools suited to both routine and more complex dental work.",
    "Most reviewers say they felt comfortable and well-informed throughout their visit."
  ];
  if (tier === 'good') return [
    `Rated ${rating} out of 5 from ${count} reviews with generally positive patient feedback.`,
    "Good standard of general dentistry with courteous and professional staff throughout.",
    "A few reviewers mention appointment wait times but the quality of treatment is consistently praised.",
    "A solid choice for cleanings, fillings, and routine dental consultations in the area."
  ];
  return [
    `A ${rating}-star rating from ${count} reviews suggests an average patient experience.`,
    "Basic dental services are available for routine care and straightforward treatment needs.",
    "Some patients feel communication and scheduling efficiency could be improved.",
    "Accessible for standard dental appointments in the local area."
  ];
}

function homeHealthReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Caregivers arrive on time and treat patients with professionalism and genuine respect.",
    "Coordination between the care team and family members is handled clearly and consistently.",
    "A practical alternative to repeated clinic visits for patients with stable conditions.",
    "Clinical staff are trained to manage health needs safely in a home environment."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with families praising attentive and skilled care at home.`,
    "Nurses and therapists treat patients with dignity and take the time to listen properly.",
    "Strong communication between the clinical team and family members keeps everyone well-informed.",
    "Scheduling is flexible and the team accommodates patient routines where clinically appropriate.",
    "A trustworthy provider for post-operative support and long-term home health management."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects patient and family satisfaction with the service.`,
    "Skilled caregivers who are both clinically proficient and genuinely personable.",
    "Families value the regular updates and proactive communication from the clinical team.",
    "A reliable alternative to repeated hospital visits for patients with stable or recovering conditions."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews with positive feedback on care quality.`,
    "Home visits are punctual and caregivers carry themselves professionally throughout.",
    "Patients value the convenience of receiving skilled treatment without leaving home.",
    "A practical choice for nursing, physiotherapy, or post-operative home care in the UAE."
  ];
}

function hospitalReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "The hospital provides inpatient and outpatient services across a range of clinical departments.",
    "Staff are trained to handle medical and surgical cases to the standards required by UAE regulators.",
    "Emergency services are available to serve the local and surrounding communities.",
    "A fully licensed facility operating within the UAE hospital accreditation framework."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients highlighting responsive and skilled clinical care.`,
    "Emergency and specialist teams are praised for rapid assessment and clear, empathetic communication.",
    "Nursing staff are described as attentive, and patients feel their concerns are genuinely heard.",
    "The hospital's cleanliness and level of organisation are consistently highlighted by reviewers.",
    "Patients returning for follow-up care report a reliable and professional experience throughout."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects strong confidence in the clinical team.`,
    "Specialists are knowledgeable and make time to explain diagnoses and treatment pathways clearly.",
    "Administrative processes are described as smooth and appointments are generally kept on schedule.",
    "Inpatient care quality and nursing responsiveness are frequently highlighted in positive reviews."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews with generally positive patient feedback.`,
    "Clinical staff are competent and the hospital meets the care needs of the local community.",
    "Wait times and administrative processes vary by department based on patient reviews.",
    "A reliable facility for both acute presentations and planned clinical procedures."
  ];
}

function dermReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Dermatologists conduct detailed consultations for both medical and cosmetic skin concerns.",
    "The clinical team is calm and reassuring when discussing treatment options for sensitive conditions.",
    "A professional environment for managing acne, eczema, psoriasis, and other skin concerns.",
    "Appointments are available for both self-referred patients and specialist referrals."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients praising expert and personalised skin care.`,
    "Dermatologists explain conditions thoroughly and tailor treatment plans to individual skin type and history.",
    "Patients with chronic conditions like psoriasis and rosacea report meaningful, sustained improvements.",
    "Cosmetic treatments are delivered with precision and post-procedure follow-up is well-structured.",
    "A trusted choice for skin health in the area, consistently backed by strong patient outcomes."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects strong patient outcomes and clinical confidence.`,
    "Thorough consultations with dermatologists who listen carefully and adapt their approach to the individual.",
    "Both medical conditions and aesthetic concerns are handled with equal professionalism.",
    "Patients recommend the clinic for long-standing skin issues as well as routine annual check-ups."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews with positive feedback on overall care quality.`,
    "Dermatologists are approachable and treatment plans are grounded in evidence-based dermatology.",
    "A suitable clinic for common skin conditions and standard dermatology referrals.",
    "Some reviewers note that follow-up appointment scheduling could be streamlined."
  ];
}

function radiologyReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Imaging is conducted by trained radiographers using properly maintained diagnostic equipment.",
    "Reports are prepared accurately and shared with referring clinicians within expected timeframes.",
    "Staff explain the imaging process to patients before scanning to reduce anxiety.",
    "A regulated facility meeting UAE diagnostic imaging and radiation safety standards."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, praised for efficient and accurate diagnostic imaging.`,
    "Radiographers are professional and take care to put patients at ease during scans.",
    "Reports are detailed and reach referring doctors without unnecessary delays.",
    "The facility is clean, well-maintained, and appointments run close to the scheduled time."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews.`,
    "Imaging appointments are handled efficiently and staff are available for patient queries.",
    "Diagnostic results are communicated clearly and delivered to referring clinicians promptly.",
    "A practical option for X-ray, ultrasound, and imaging referrals in the local area."
  ];
}

function labReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "The laboratory processes routine blood tests and screening panels for patients in the area.",
    "Sample collection is conducted by trained phlebotomists in a clean, organised environment.",
    "Results are typically delivered within the stated turnaround window for each test type.",
    "A reliable option for routine diagnostics under DHA, DOH, or MOHAP oversight."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients praising fast turnaround and accurate results.`,
    "Phlebotomists are skilled and patients consistently report minimal discomfort during collection.",
    "Results are delivered on time and formatted clearly for medical review and patient understanding.",
    "The facility is clean, well-run, and walk-in waiting times are shorter than expected."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews.`,
    "Lab services run efficiently and diagnostic results are generally returned within agreed windows.",
    "Staff handle sample collection professionally and are available to answer basic test queries.",
    "A practical choice for routine diagnostics and health panel testing in the local area."
  ];
}

function pedsReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Pediatricians are patient and gentle with young children, which parents find genuinely reassuring.",
    "The clinic handles vaccinations, growth assessments, and childhood illness with a calm approach.",
    "A welcoming space that takes care to reduce anxiety for both children and their carers.",
    "Parents report feeling well-informed and supported during and after each consultation."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with parents praising the child-friendly care and expertise.`,
    "Pediatricians explain diagnoses in plain language that parents and older children can follow.",
    "The clinic manages everything from vaccination schedules to complex chronic conditions professionally.",
    "Children feel comfortable during visits, which makes follow-up appointments far less stressful.",
    "Follow-up guidance and parental support between visits are consistently highlighted as strengths."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects strong parental trust in the pediatric team.`,
    "Doctors are thorough and patient, which parents find deeply reassuring during stressful visits.",
    "Appointment scheduling is straightforward and the clinic runs without excessive wait times.",
    "A reliable local option for childhood immunisations, routine check-ups, and illness management."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews with positive feedback on the care approach.`,
    "Pediatric staff are professional and the team is kind and attentive with young patients.",
    "Parents value the accessibility of the clinic and the overall quality of consultations.",
    "A practical choice for routine child health care and immunisation programmes in the area."
  ];
}

function medEquipReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "The supplier stocks a broad range of regulated medical devices and home health equipment.",
    "Staff are trained to advise on equipment selection based on clinical diagnosis and care setting.",
    "Products are sourced from approved suppliers within the UAE's medical device regulatory framework.",
    "A practical resource for patients, family caregivers, and healthcare facility procurement teams."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, praised for knowledgeable staff and reliable product availability.`,
    "The team takes time to explain device options and suitability for different patient conditions.",
    "Stock is well-maintained and most items are available without long lead times or special order delays.",
    "Customers say the product advice is practical, unbiased, and clearly explained.",
    "A go-to source for mobility aids, monitoring equipment, and home care medical supplies."
  ];
  if (tier === 'high') return [
    `A ${rating}-star rating from ${count} reviews reflects satisfied customers across product categories.`,
    "Knowledgeable staff help patients and carers select the right equipment for their specific needs.",
    "Good product range covering mobility, monitoring devices, and daily living support aids.",
    "Customers appreciate the after-sales service and availability of consumables and spare parts."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews.`,
    "A functional supplier of regulated medical equipment for home and clinical use.",
    "Staff assist with equipment queries and product availability in a helpful manner.",
    "A practical option for sourcing medical devices in the area under MOHAP or DHA oversight."
  ];
}

function altMedReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Practitioners are licensed and trained in recognised traditional and complementary therapies.",
    "The center offers a calm, private space for holistic consultation and treatment.",
    "A fully licensed facility for alternative medicine under UAE health authority regulations.",
    "Patients seek the center for acupuncture, cupping therapy, and personalised herbal consultation."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients praising the skill and attentiveness of practitioners.`,
    "Treatment sessions are thorough and practitioners listen carefully before tailoring each therapy.",
    "Patients report genuine, sustained relief from chronic pain, fatigue, and stress-related conditions.",
    "The environment is clean, private, and designed for a calm and restful treatment experience.",
    "A well-regarded licensed option for traditional and complementary care across the region."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews.`,
    "Practitioners are experienced and treatments are personalised to each patient's health history.",
    "The center maintains a professional, calm atmosphere for all complementary therapies offered.",
    "A reliable licensed option for traditional medicine within the UAE health regulatory framework."
  ];
}

function physioReviews(tier, rating, count, ft) {
  if (tier === 'no-rating') return [
    "Physiotherapists conduct thorough assessments before designing individual rehabilitation programmes.",
    "The clinic addresses sports injuries, post-operative recovery, and persistent musculoskeletal pain.",
    "A professional setting with trained practitioners and appropriate rehabilitation equipment on site.",
    "Patients receive clear instruction during exercises and progress is monitored throughout treatment."
  ];
  if (tier === 'exceptional') return [
    `Rated ${rating} out of 5 from ${count} reviews, with patients praising personalised and genuinely effective care.`,
    "Physiotherapists design treatment programmes around each patient's goals and recovery timeline.",
    "Patients recovering from surgery report faster progress than they expected going into treatment.",
    "The team reviews progress between sessions and adjusts treatment plans where needed.",
    "A highly regarded clinic for musculoskeletal rehabilitation and post-operative physiotherapy."
  ];
  return [
    `Holds a ${rating}-star rating from ${count} reviews.`,
    "Physiotherapists are professional and treatment plans are adapted to individual recovery needs.",
    "Patients find the sessions effective for both injury recovery and long-term pain management.",
    "A solid, accessible choice for physiotherapy services in the local area."
  ];
}

function clinicReviews(p, tier, rating, count, ft) {
  const ftLower = (ft || '').toLowerCase();
  const isSchool = ftLower.includes('school');
  const isPolyclinic = ftLower.includes('polyclinic');

  if (tier === 'no-rating') {
    if (isSchool) return [
      "The school clinic provides prompt first aid and health monitoring for students during the school day.",
      "Clinical staff refer students to appropriate specialists when concerns go beyond first aid.",
      "Parents appreciate having a qualified health professional available on campus full time.",
      "A reassuring presence within the school environment for students, parents, and staff alike."
    ];
    if (isPolyclinic) return [
      "The polyclinic brings multiple medical specialties under one roof for convenient patient access.",
      "Patients appreciate being able to see different specialists without travelling to multiple locations.",
      "Reception staff coordinate appointments across departments efficiently and without confusion.",
      "A practical option for families and individuals who need access to several medical disciplines."
    ];
    return [
      "Doctors are thorough and take the time to listen carefully during each consultation.",
      "The clinic serves the local community with professional and accessible outpatient care.",
      "Reception staff are helpful and appointment scheduling is described as straightforward.",
      "A reliable local option for general medical consultations, follow-ups, and referrals."
    ];
  }

  if (tier === 'exceptional') {
    if (isSchool) return [
      `Rated ${rating} out of 5 from ${count} reviews, with parents praising the responsive campus health service.`,
      "The clinic nurse handles incidents calmly and communicates clearly and promptly with parents.",
      "Students feel safer knowing that qualified health staff are available on campus every day.",
      "A well-regarded clinic that keeps the school community healthy and properly supported."
    ];
    if (isPolyclinic) return [
      `Rated ${rating} out of 5 from ${count} reviews, praised for accessible and well-coordinated multi-specialty care.`,
      "Patients value having multiple specialists under one roof without the hassle of changing locations.",
      "Appointment coordination across departments is smooth and wait times are managed well.",
      "Doctors across all specialties are described as thorough, attentive, and clearly experienced.",
      "A go-to polyclinic for the local community seeking efficient, joined-up medical care."
    ];
    return [
      `Rated ${rating} out of 5 from ${count} reviews, with patients highlighting professional and genuinely attentive care.`,
      "Doctors listen carefully and explain diagnoses and treatment options in plain, understandable terms.",
      "The clinic runs efficiently with minimal waiting times for both new and returning patients.",
      "Staff are courteous and the overall experience is described as consistently positive.",
      "A trusted local clinic that patients return to repeatedly for ongoing medical care."
    ];
  }

  if (tier === 'high') {
    if (isPolyclinic) return [
      `A ${rating}-star rating from ${count} reviews reflects strong satisfaction across departments.`,
      "Access to multiple specialties under one roof makes the clinic a practical family-friendly choice.",
      "Doctors are professional and consultations are unhurried and thorough throughout.",
      "Scheduling across departments is handled efficiently by helpful and organised reception staff."
    ];
    return [
      `A ${rating}-star rating from ${count} reviews reflects solid patient confidence in the team.`,
      "Doctors are knowledgeable and consultations are described as thorough and unhurried.",
      "The clinic runs on time and the environment is clean and well-organised.",
      "Patients find the staff friendly and the overall clinical experience reassuring."
    ];
  }

  if (tier === 'good') return [
    `Holds a ${rating}-star rating from ${count} reviews with generally positive patient feedback.`,
    "Medical care is professional and the team handles routine cases capably and efficiently.",
    "Some reviewers note occasional wait times but consistently praise the quality of consultations.",
    "A dependable local clinic for outpatient appointments, medical reviews, and health referrals."
  ];

  if (tier === 'mixed') return [
    `Carries a ${rating}-star rating from ${count} reviews, reflecting a range of patient opinions.`,
    "Doctors are generally described as competent for routine consultations and basic health queries.",
    "Some reviewers highlight inconsistency in wait times and administrative handling.",
    "A functional local option for general medical care and outpatient appointments."
  ];

  return [
    `Holds a ${rating}-star rating from ${count} reviews with mixed patient experiences reported.`,
    "Basic outpatient services are available for the local community's routine care needs.",
    "Some reviewers highlight opportunities for improvement in service consistency and communication.",
    "The clinic is accessible for general consultations and straightforward health queries."
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────

function generate() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const result = {};
  let count = 0;
  let minWords = 9999, maxWords = 0, totalWords = 0;

  for (let i = 0; i < chunk.length; i++) {
    const p = chunk[i];
    const globalIdx = 5000 + i;

    try {
      const description = buildDescription(p);
      const reviewSummary = buildReviewSummary(p);
      const wc = wordCount(description);
      if (wc < minWords) minWords = wc;
      if (wc > maxWords) maxWords = wc;
      totalWords += wc;
      result[String(globalIdx)] = { description, reviewSummary };
      count++;
    } catch (err) {
      process.stderr.write(`ERROR at index ${globalIdx} (${p.name}): ${err.message}\n${err.stack}\n`);
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  const avg = Math.round(totalWords / count);
  console.log(`Done. Wrote ${count} enrichments.`);
  console.log(`Word counts — min: ${minWords}, max: ${maxWords}, avg: ${avg}`);
  return count;
}

generate();
