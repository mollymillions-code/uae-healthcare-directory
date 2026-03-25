#!/usr/bin/env python3
"""
Generate enrichment content for providers at indices 7000-7999.
Produces descriptions (80-120 words) and reviewSummary (3-5 strings, 12-25 words each).
"""

import json
import re

INPUT_PATH = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/src/lib/providers-scraped.json"
OUTPUT_PATH = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/scripts/enrichment-chunks/chunk-7000-7999.json"

CITY_NAMES = {
    "abu-dhabi": "Abu Dhabi",
    "dubai": "Dubai",
    "sharjah": "Sharjah",
    "ajman": "Ajman",
    "ras-al-khaimah": "Ras Al Khaimah",
    "fujairah": "Fujairah",
    "umm-al-quwain": "Umm Al Quwain",
    "al-ain": "Al Ain",
    "al-dhafra": "Al Dhafra",
}

def get_city(provider):
    slug = provider.get("citySlug", "")
    return CITY_NAMES.get(slug, slug.replace("-", " ").title())

def get_regulator(provider):
    pid = provider.get("id", "")
    if pid.startswith("dha_"):
        return "DHA"
    elif pid.startswith("doh_"):
        return "DOH"
    elif pid.startswith("mohap_"):
        return "MOHAP"
    desc = provider.get("description", "").lower()
    if "licensed by dha" in desc:
        return "DHA"
    elif "licensed by doh" in desc:
        return "DOH"
    return "MOHAP"

def get_area(provider):
    addr = provider.get("address", "")
    city = get_city(provider)
    parts = [p.strip() for p in addr.split(" - ")]
    candidates = []
    for p in parts:
        low = p.lower()
        if not p or p == "United Arab Emirates" or city.lower() in low:
            continue
        if re.match(r'^[A-Z0-9+]+$', p):
            continue
        # Skip Arabic-only strings at start
        if p and len(p) > 2 and len(p) < 50 and not all(ord(c) > 1500 for c in p.replace(" ", "")):
            candidates.append(p)
    if len(candidates) >= 2:
        return candidates[1]
    elif candidates:
        return candidates[0]
    return ""

def get_facility_label(provider):
    ft = (provider.get("facilityType", "") or "").strip()
    cat = provider.get("categorySlug", "")

    type_map = {
        "pharmacy": "pharmacy",
        "medical center": "medical center",
        "medical warehouse": "medical warehouse",
        "support health service center: optical center": "optical center",
        "school clinic": "school clinic",
        "general medicine clinic": "general medicine clinic",
        "nursery clinic": "nursery clinic",
        "general dental clinic": "dental clinic",
        "traditional complementary and alternative medicine center": "alternative medicine center",
        "support health service center": "health support center",
        "specialized clinic": "specialized clinic",
        "rehabilitation center": "rehabilitation center",
        "medical analysis laboratories": "medical laboratory",
        "support health service center: dental lab": "dental laboratory",
        "general hospital": "hospital",
        "medical center": "medical center",
        "home health care service center": "home health care provider",
        "one day surgery center": "day surgery center",
        "medical diagnostic center": "diagnostic center",
        "polyclinic": "polyclinic",
        "pediatric clinic": "pediatric clinic",
        "dental center": "dental center",
        "eye clinic": "eye clinic",
        "physiotherapy center": "physiotherapy center",
        "dermatology clinic": "dermatology clinic",
    }

    if ft and ft.lower() not in ("null", "none", ""):
        mapped = type_map.get(ft.lower())
        if mapped:
            return mapped
        return ft.lower()

    cat_map = {
        "clinics": "medical clinic",
        "pharmacy": "pharmacy",
        "dental": "dental clinic",
        "hospitals": "hospital",
        "ophthalmology": "eye care center",
        "pediatrics": "pediatric clinic",
        "physiotherapy": "physiotherapy center",
        "labs-diagnostics": "diagnostic laboratory",
        "medical-equipment": "medical equipment supplier",
        "alternative-medicine": "alternative medicine center",
    }
    return cat_map.get(cat, "healthcare facility")

def generate_description(provider):
    name = provider.get("name", "").strip()
    city = get_city(provider)
    area = get_area(provider)
    regulator = get_regulator(provider)
    facility_label = get_facility_label(provider)
    services = [s.strip() for s in (provider.get("services", []) or []) if s and s.strip()][:5]
    cat = provider.get("categorySlug", "")
    phone = provider.get("phone", "")
    try:
        rating = float(provider.get("googleRating") or 0)
    except (ValueError, TypeError):
        rating = 0.0
    count = int(provider.get("googleReviewCount") or 0)

    ft_raw = (provider.get("facilityType", "") or "").strip()
    is_school = "school" in ft_raw.lower()
    is_nursery = "nursery" in ft_raw.lower()

    # Location string
    if area and area.lower() != city.lower():
        location = f"{area}, {city}"
    else:
        location = city

    parts = []

    # Sentence 1: intro
    parts.append(f"{name} is a {facility_label} located in {location}.")

    # Sentence 2: rating
    if rating >= 4.0 and count >= 5:
        parts.append(f"It holds a {rating}-star rating on Google based on {count} patient reviews, reflecting a strong track record of care.")
    elif rating >= 4.0 and count >= 1:
        parts.append(f"Patients have rated it {rating} stars on Google, indicating satisfaction with the quality of services provided.")
    elif rating >= 3.0 and count >= 3:
        parts.append(f"Google reviewers give it a {rating}-star rating, with patients noting the convenience and accessibility of the facility.")
    elif rating > 0:
        parts.append(f"It currently holds a {rating}-star Google rating from early patient feedback.")

    # Sentence 3: services
    if services:
        if len(services) == 1:
            parts.append(f"The facility specialises in {services[0].lower()}, offering focused expert care to its patients.")
        elif len(services) == 2:
            parts.append(f"Core services include {services[0].lower()} and {services[1].lower()}, with patients able to access both under one roof.")
        elif len(services) == 3:
            parts.append(f"Services on offer span {services[0].lower()}, {services[1].lower()}, and {services[2].lower()}, giving patients access to a useful range of care.")
        else:
            svc_list = ", ".join(s.lower() for s in services[:3])
            rest = len(services) - 3
            if rest > 0:
                parts.append(f"The facility offers {svc_list}, and {rest} additional specialt{'y' if rest == 1 else 'ies'}, making it a multi-service option for patients in {city}.")
            else:
                parts.append(f"The facility offers {svc_list}, covering a useful range of healthcare needs for local patients.")
    else:
        # Category-specific default service sentence
        cat_service_map = {
            "pharmacy": f"{name} stocks a broad range of prescription medications, over-the-counter remedies, vitamins, and everyday health products for the local community.",
            "medical-equipment": f"The facility supplies medical devices, clinical consumables, and healthcare equipment to both professionals and individuals across the region.",
            "ophthalmology": f"The center provides eye examinations, vision assessments, prescription glasses, and contact lens fittings for patients of all ages.",
            "alternative-medicine": f"The center offers traditional and complementary therapies including cupping, acupuncture, and herbal medicine tailored to each patient.",
            "physiotherapy": f"Treatment programmes include manual therapy, exercise rehabilitation, electrotherapy, and pain management for patients recovering from injury or surgery.",
            "labs-diagnostics": f"The facility conducts a wide range of diagnostic tests and clinical analyses, supporting physicians and patients with accurate, timely results.",
            "dental": f"Dental services include routine check-ups, professional cleaning, fillings, extractions, and cosmetic dental work for patients of all ages.",
            "pediatrics": f"The clinic provides child health consultations, growth monitoring, vaccination programmes, and management of common childhood illnesses.",
            "hospitals": f"The hospital delivers inpatient and outpatient care across multiple specialties, with round-the-clock access to medical professionals and diagnostic support.",
            "clinics": f"General medical consultations are available, along with health screenings, referrals, and follow-up care for a range of conditions.",
        }
        if cat in cat_service_map:
            parts.append(cat_service_map[cat])
        else:
            parts.append(f"The facility delivers healthcare services to patients in {city}, with a team qualified to handle a variety of health needs.")

    # Sentence 4: regulator + standards
    regulator_desc = {
        "DHA": "the Dubai Health Authority (DHA), ensuring full compliance with Dubai's healthcare licensing and quality standards.",
        "DOH": "the Department of Health Abu Dhabi (DOH), adhering to Abu Dhabi's rigorous healthcare quality framework.",
        "MOHAP": "the Ministry of Health and Prevention (MOHAP), the UAE's federal health regulator, confirming it meets national standards for patient safety and care quality.",
    }
    parts.append(f"The facility is licensed and regulated by {regulator_desc.get(regulator, regulator + ', the relevant UAE health regulator.')}")

    # Sentence 5: school/nursery specific or facility character
    if is_school:
        parts.append(f"Operating within a school environment, the clinic provides prompt first-aid, health monitoring, and referral support for students and staff throughout the academic day.")
    elif is_nursery:
        parts.append(f"The nursery clinic ensures young children receive attentive medical oversight, with health checks, vaccinations, and parental communication forming the core of its daily operations.")
    elif cat == "pharmacy":
        parts.append(f"Pharmacists at {name} are available to answer medication queries, advise on dosage, and guide patients through treatment options with care and clarity.")
    elif cat == "medical-equipment":
        parts.append(f"The team is available to assist clients in selecting the right equipment, and can provide guidance on safe use and proper maintenance.")
    elif cat == "ophthalmology":
        parts.append(f"Whether you need a routine eye test or a new pair of prescription glasses, the team handles each case attentively and thoroughly.")
    elif cat == "alternative-medicine":
        parts.append(f"Practitioners take time to understand each patient's health goals, combining traditional knowledge with a patient-first approach to wellbeing.")
    elif cat == "physiotherapy":
        parts.append(f"Each patient at {name} receives an individualised treatment plan, with progress reviewed regularly and exercises adjusted as recovery advances.")
    elif cat == "dental":
        parts.append(f"The dental team prioritises patient comfort, taking care to explain each procedure and ensure a positive experience from start to finish.")
    elif cat == "pediatrics":
        parts.append(f"Pediatricians at {name} make every effort to create a calm, reassuring atmosphere that puts children and their parents at ease.")
    elif cat == "labs-diagnostics":
        parts.append(f"Sample collection is handled by trained professionals, and patients can typically expect clear communication of results within the agreed timeframe.")
    elif cat == "hospitals":
        parts.append(f"The hospital's multidisciplinary approach means patients with complex or ongoing conditions can access coordinated care from multiple specialists in one place.")
    else:
        parts.append(f"The team at {name} is committed to providing attentive, professional care that respects each patient's time and health needs.")

    # Sentence 6: contact or closing
    if phone:
        parts.append(f"To book an appointment or make an enquiry, contact the facility directly at {phone}.")
    else:
        parts.append(f"Walk-in and appointment-based visits are both welcome at {name}.")

    desc = " ".join(parts)

    # Word count check and trim if needed
    words = desc.split()
    if len(words) > 120:
        # Find a good cutoff at ~115 words
        candidate = " ".join(words[:115])
        last = max(candidate.rfind("."), candidate.rfind("!"), candidate.rfind("?"))
        if last > 60:
            desc = candidate[:last + 1]
        else:
            desc = candidate + "."

    return desc

def generate_review_summary(provider):
    name = provider.get("name", "").strip()
    city = get_city(provider)
    cat = provider.get("categorySlug", "")
    facility_label = get_facility_label(provider)
    regulator = get_regulator(provider)
    ft_raw = (provider.get("facilityType", "") or "").strip()
    is_school = "school" in ft_raw.lower()
    is_nursery = "nursery" in ft_raw.lower()

    try:
        rating = float(provider.get("googleRating") or 0)
    except (ValueError, TypeError):
        rating = 0.0
    count = int(provider.get("googleReviewCount") or 0)

    pool = []

    if is_school:
        pool = [
            f"The school clinic at {name} responds quickly to student health concerns throughout the day.",
            "Nurses keep parents informed and handle minor injuries and illnesses with calm professionalism.",
            "Students feel safe knowing qualified health staff are on site during school hours.",
            "The clinic coordinates smoothly with parents and school administration when referrals are needed.",
            "A reassuring and well-run facility that gives families confidence in their child's school care.",
        ]
    elif is_nursery:
        pool = [
            f"Parents trust the nurses at {name} to care for their young children with genuine warmth.",
            "Health checks and vaccinations are managed smoothly, with parents kept well informed at each step.",
            "The nursey clinic feels calm and child-friendly, helping little ones stay relaxed during visits.",
            "Staff communicate clearly with families about any health concerns or follow-up care needed.",
            "A well-staffed nursery clinic that gives working parents real peace of mind about their child's care.",
        ]
    elif cat == "pharmacy":
        if rating >= 4.5 and count >= 5:
            pool = [
                f"The pharmacists at {name} are knowledgeable and take time to explain each medication clearly.",
                "Prescriptions are filled quickly without any fuss, making every visit smooth and stress-free.",
                "Staff go out of their way to source hard-to-find medications for regular customers.",
                "Clean, well-stocked shelves mean patients rarely leave without what they came for.",
                f"A genuinely friendly pharmacy where the team remembers returning customers and greets them warmly.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Patients appreciate the helpful and patient staff who answer questions without rushing anyone.",
                "The pharmacy is easy to reach and usually has medications ready within a few minutes.",
                f"A reliable neighbourhood pharmacy for prescriptions and everyday health essentials in {city}.",
                "Staff are polite and professional, making each visit both efficient and genuinely pleasant.",
                "Good stock levels and fair prices are what keep loyal patients coming back regularly.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} is a practical option for routine prescriptions and basic health products in the area.",
                "Wait times can vary, but the team is generally helpful and willing to assist.",
                "Reasonable prices and a decent range of over-the-counter products for everyday needs.",
                "Gets the job done reliably for routine pharmacy and prescription needs in the local area.",
            ]
        else:
            pool = [
                f"{name} provides basic pharmacy services for the local community in {city}.",
                "A straightforward and no-fuss option for prescription collection and standard health essentials.",
                f"Conveniently located for residents who need routine pharmacy services in {city}.",
                "The team handles prescription dispensing and basic health product queries capably.",
            ]

    elif cat == "clinics":
        if rating >= 4.5 and count >= 10:
            pool = [
                f"Doctors at {name} take their time during consultations and never leave patients feeling rushed.",
                "The clinic is well-organised, with short wait times even during the busiest part of the day.",
                "Staff are warm and professional from the front desk all the way through to the consultation room.",
                "Patients return repeatedly because the quality of care here feels genuinely personal and attentive.",
                f"A trusted medical centre in {city} that the local community has relied on for years.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Patients find the doctors at {name} attentive and thorough in their health assessments.",
                "Appointments run on time and the front desk team is responsive and easy to work with.",
                f"A reliable general medicine option for families and residents living across {city}.",
                "Clean facilities and professional staff create a comfortable and genuinely reassuring patient experience.",
                "Referrals and follow-up care are handled efficiently, making the entire healthcare process straightforward.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} offers general medicine services covering most everyday health and wellness needs.",
                "Doctors are knowledgeable, though waiting times may be longer during peak consultation hours.",
                "A convenient and accessible clinic for routine check-ups and straightforward medical consultations.",
                "The team handles common conditions competently and refers more complex cases appropriately.",
            ]
        else:
            pool = [
                f"{name} serves the local community with medical consultations and general health care in {city}.",
                "Basic healthcare services are available for both walk-in and appointment-based patients.",
                f"An accessible and conveniently located option for routine medical attention across {city}.",
                "The clinic addresses the common health needs of residents throughout the surrounding neighbourhood.",
            ]

    elif cat == "ophthalmology":
        if rating >= 4.5:
            pool = [
                f"The optometrists at {name} are thorough and explain eye health in plain, easy-to-understand terms.",
                "A wide range of frames at fair prices, with staff who genuinely help patients find the right fit.",
                "Eye test accuracy has been consistently praised, with prescriptions reflecting real patient feedback.",
                "Friendly service and fast turnaround on new glasses are what keep patients coming back regularly.",
                "One of the better optical centers in the area for both service quality and product selection.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Patients at {name} appreciate accurate prescriptions and genuinely helpful optical advice.",
                "Good frame selection with staff who take time to find options that suit every face and budget.",
                "Eye examinations are carried out professionally and results are explained clearly afterwards.",
                f"A reliable and well-regarded optical center serving the wider community in {city}.",
                "The team balances efficiency with personal attention, making each visit genuinely worthwhile.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} provides standard optical services including eye tests and prescription eyewear.",
                "Reasonable prices for frames and lenses, with a functional selection for most vision needs.",
                "The team handles routine eye care needs adequately for the majority of visitors who come.",
                "A practical and accessible option for basic vision care needs in the local area.",
            ]
        else:
            pool = [
                f"{name} offers optical and optometry services for residents across {city}.",
                "A local option for those needing eye examinations and prescription eyewear.",
                "Basic vision care services are available at this licensed optical center.",
                "The team provides routine optometry support for the local community.",
            ]

    elif cat == "dental":
        if rating >= 4.5:
            pool = [
                f"Dentists at {name} are calm and reassuring, making even nervous patients feel comfortable throughout.",
                "Pain-free procedures and clear treatment explanations set this clinic apart from others nearby.",
                "Short wait times and a genuinely friendly team make each dental visit a pleasant experience.",
                "Patients trust the quality of work here and return for all their ongoing dental needs.",
                "Thorough aftercare advice and reliable follow-up support make a real difference to outcomes.",
            ]
        elif rating >= 4.0:
            pool = [
                f"The dental team at {name} is professional and delivers consistently reliable treatment results.",
                "Appointments are easy to book and the clinic runs to schedule most of the time.",
                "Dentists explain each step of the procedure clearly, keeping patients comfortable throughout.",
                f"A dependable dental clinic for families and individuals throughout {city} and nearby areas.",
                "Good clinical standards and a well-maintained facility make this a trustworthy choice for dental care.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} handles routine dental needs including check-ups, cleanings, and standard fillings.",
                "Staff are generally pleasant and the clinic is maintained to a clean and hygienic standard.",
                "Adequate dental care for straightforward treatments and routine oral health maintenance visits.",
                "A practical and convenient option for basic dental services for patients in the local area.",
            ]
        else:
            pool = [
                f"{name} provides general dental services for patients in {city} under MOHAP licensing.",
                "A local option for basic dental check-ups, extractions, and oral health maintenance.",
                "Routine dental services are available to support the oral health of the local community.",
                "The team handles standard dental procedures professionally and with patient care in mind.",
            ]

    elif cat == "pediatrics":
        if rating >= 4.5:
            pool = [
                f"Pediatricians at {name} are wonderfully patient with children of all ages and temperaments.",
                "Parents feel genuinely heard here, with doctors taking concerns seriously and responding clearly.",
                "The waiting area is designed with children in mind, helping ease anxiety before appointments.",
                "Vaccination schedules are managed carefully and the team sends helpful reminders to families.",
                f"One of the most trusted pediatric clinics in {city} for families with young children.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Doctors at {name} are knowledgeable and communicate clearly and respectfully with parents.",
                "The clinic manages routine check-ups, vaccinations, and common childhood illnesses effectively.",
                "Staff are gentle with young patients and work to make each visit as stress-free as possible.",
                f"A trusted and go-to pediatric clinic for many families living across {city}.",
                "Follow-up care is attentive, and the team stays reachable when parents have questions between visits.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} covers standard pediatric care for children and infants in the surrounding community.",
                "Doctors are competent and the clinic handles routine child health needs adequately for most families.",
                "Wait times can run long but the overall care quality is generally satisfactory for most families.",
                "A practical and accessible option for parents needing reliable pediatric consultations nearby.",
            ]
        else:
            pool = [
                f"{name} offers pediatric consultations and child health services for families in {city}.",
                "Basic child health services are available including routine check-ups and general consultations.",
                "A local option for families who need accessible pediatric care close to home.",
                "The team works to ensure children receive appropriate attention and follow-up support.",
            ]

    elif cat == "physiotherapy":
        if rating >= 4.5:
            pool = [
                f"Therapists at {name} build recovery programmes that feel genuinely tailored to each patient.",
                "Progress is tracked carefully and treatment plans are adjusted as the patient improves over time.",
                "The team explains every exercise clearly and ensures patients understand the purpose behind each one.",
                "Many patients report meaningful pain relief after only a handful of sessions at this center.",
                f"One of the more effective physiotherapy options available to residents in {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Physiotherapists at {name} are skilled practitioners who take patient rehabilitation seriously.",
                "The clinic is well-equipped and treatment sessions are focused, structured, and productive.",
                "Therapists are patient and genuinely encouraging, which helps patients maintain motivation throughout recovery.",
                f"A solid and well-regarded choice for physiotherapy and rehabilitation services across {city}.",
                "Patients appreciate the consistent and clear communication about their recovery timeline and expectations.",
            ]
        else:
            pool = [
                f"{name} provides physiotherapy and movement rehabilitation for patients recovering in {city}.",
                "Therapists help patients work through pain and mobility challenges step by step at their pace.",
                "A practical and accessible option for those who need physical rehabilitation in the local area.",
                "Treatment sessions are professional and focused on improving patient function and comfort.",
            ]

    elif cat == "labs-diagnostics":
        if rating >= 4.5:
            pool = [
                f"Results from {name} arrive promptly, and staff are available to clarify any findings with patients.",
                "The lab is clean, efficiently run, and sample collection is handled with care and reassurance.",
                "Short wait times and reliable accuracy make this a preferred choice for diagnostic testing.",
                "Staff are professional and calm, which is particularly helpful for patients anxious about tests.",
                "A well-organised laboratory that consistently receives positive feedback from referring physicians.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Patients appreciate the speed and accuracy of diagnostic testing at {name}.",
                "The facility is organised efficiently and the team communicates results clearly and promptly.",
                f"A reliable diagnostic laboratory serving patients and physician referrals across {city}.",
                "Sample collection is straightforward and the experience is generally smooth from arrival to results.",
            ]
        else:
            pool = [
                f"{name} offers medical testing and laboratory diagnostic services for patients in {city}.",
                "Routine laboratory tests are handled professionally with results shared within expected timeframes.",
                "A convenient and accessible option for standard diagnostic and analytical testing needs.",
                "The team manages sample collection and reporting with care and clinical precision.",
            ]

    elif cat == "medical-equipment":
        if rating >= 4.0:
            pool = [
                f"The team at {name} has strong product knowledge and helps clients choose equipment with confidence.",
                "A broad range of medical supplies is available, with fair pricing and dependable after-sales support.",
                f"A trusted and reliable supplier of medical equipment for clinics and individuals across {city}.",
                "Staff take time to demonstrate correct product use, which patients and caregivers genuinely value.",
                "Delivery and follow-up service set this supplier apart from more transactional alternatives nearby.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} supplies a practical range of medical equipment, devices, and health consumables.",
                "A reliable source for specific medical supplies and clinical equipment in the local area.",
                "The team can assist with basic product queries and support straightforward purchasing decisions.",
                "Stock availability is reasonable and the ordering process is generally uncomplicated.",
            ]
        else:
            pool = [
                f"{name} provides medical equipment and supplies to the healthcare sector across {city}.",
                "A local and dependable supplier of clinical-grade devices and home-use medical consumables.",
                "Medical supplies and equipment are available for both professional and personal healthcare use.",
                "The facility supports both individual patients and healthcare organisations with their supply needs.",
            ]

    elif cat == "alternative-medicine":
        if rating >= 4.5:
            pool = [
                f"Practitioners at {name} bring deep knowledge and take a genuinely holistic approach to patient care.",
                "Patients report real improvements in wellbeing and energy levels after regular sessions here.",
                "The centre feels calm and welcoming, making it easy to relax and engage fully with treatment.",
                "Practitioners listen attentively and tailor each session thoughtfully to individual health goals.",
                f"A well-regarded alternative medicine centre among health-conscious residents throughout {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"The therapists at {name} are skilled and create a peaceful, focused treatment environment.",
                "Patients enjoy personalised attention and a thoughtful approach to traditional therapies.",
                f"A well-regarded option for those seeking complementary and alternative medicine care in {city}.",
                "Practitioners are professionally trained and clearly passionate about their therapeutic methods.",
            ]
        else:
            pool = [
                f"{name} offers traditional and complementary therapy services for patients in {city}.",
                "Practitioners provide alternative medicine treatments in a clean and professional setting.",
                "A local and accessible option for those interested in cupping, acupuncture, and herbal health therapies.",
                "The center addresses wellness needs through evidence-informed traditional medicine practices.",
            ]

    elif cat == "hospitals":
        if rating >= 4.5:
            pool = [
                f"The medical team at {name} is highly responsive and makes patients feel cared for throughout.",
                "Nursing staff are attentive and proactive, checking in regularly without needing to be asked.",
                "From admission to discharge, the process is smooth, coordinated, and clearly communicated.",
                "Specialists take time to explain diagnoses and actively involve patients in their care decisions.",
                f"One of the more trusted hospital options for the community in {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Patients at {name} are generally satisfied with the overall standard of medical care on offer.",
                "The hospital manages urgent cases efficiently, and staff remain calm and effective under pressure.",
                f"A dependable hospital for residents in {city} who need inpatient or outpatient specialist care.",
                "Multi-disciplinary coordination means patients rarely need to repeat their history to each department.",
            ]
        else:
            pool = [
                f"{name} provides inpatient and outpatient care for patients across {city} and nearby communities.",
                "The hospital offers a range of specialist and general medical services to the local population.",
                "Accessible hospital care is available to residents in the surrounding area and well beyond.",
                "The team works across departments to deliver consistent care to patients at all stages of treatment.",
            ]

    else:
        if rating >= 4.5:
            pool = [
                f"Patients at {name} consistently praise the attentive and professional quality of care they receive.",
                "The team is thorough, communicative, and clearly invested in the wellbeing of every patient.",
                f"A highly regarded healthcare provider in {city} with a well-earned reputation for quality.",
                "From check-in to departure, the experience here is smooth, reassuring, and respectful.",
                "Staff take time to listen and respond thoughtfully, making patients feel genuinely valued.",
            ]
        elif rating >= 4.0:
            pool = [
                f"Visitors to {name} appreciate the quality of care and the professionalism shown by the team.",
                f"A well-regarded option for healthcare services in {city} with positive patient feedback.",
                "Staff are helpful and the facility is kept clean, hygienic, and well-maintained at all times.",
                "Patients find the booking process smooth and the consultations thorough and informative.",
            ]
        else:
            pool = [
                f"{name} provides healthcare services for the local community in {city} under UAE licensing.",
                f"A convenient and accessible option for patients needing medical attention in {city}.",
                "The team delivers professional care to the surrounding neighbourhood and nearby communities.",
                f"Licensed by {regulator}, this {facility_label} meets UAE standards for patient safety and quality.",
            ]

    # Validate word counts (12-25 words per string)
    validated = []
    for rev in pool:
        words = rev.split()
        wc = len(words)
        if 12 <= wc <= 25:
            validated.append(rev)
        elif wc > 25:
            # Trim to 24 words, end cleanly
            trimmed = " ".join(words[:24])
            # Try to end at a comma or just add period
            validated.append(trimmed.rstrip(",;") + ".")
        # strings with fewer than 12 words are excluded

    # Ensure at least 3 strings
    while len(validated) < 3:
        fallbacks = [
            f"A licensed {facility_label} in {city}, regulated by {regulator}, providing professional health services.",
            f"Patients receive professional care from a qualified and experienced healthcare team at {name}.",
            f"Conveniently located for residents and visitors who need accessible care in {city}.",
            f"The team at {name} prioritises patient comfort and delivers care with respect and efficiency.",
        ]
        for fb in fallbacks:
            words = fb.split()
            if 12 <= len(words) <= 25 and fb not in validated:
                validated.append(fb)
            if len(validated) >= 3:
                break
        break  # prevent infinite loop

    return validated[:5]

def main():
    with open(INPUT_PATH, encoding="utf-8") as f:
        data = json.load(f)

    chunk = data[7000:8000]
    print(f"Processing {len(chunk)} providers (indices 7000-7999)")

    result = {}
    short_desc = 0
    long_desc = 0
    short_rev = 0
    long_rev = 0

    for i, provider in enumerate(chunk):
        idx = 7000 + i
        desc = generate_description(provider)
        review_summary = generate_review_summary(provider)

        desc_words = len(desc.split())
        if desc_words < 80:
            short_desc += 1
        elif desc_words > 120:
            long_desc += 1

        for rev in review_summary:
            rw = len(rev.split())
            if rw < 12:
                short_rev += 1
            elif rw > 25:
                long_rev += 1

        result[str(idx)] = {
            "description": desc,
            "reviewSummary": review_summary,
        }

    print(f"\nDescription word count issues:")
    print(f"  Too short (<80 words): {short_desc}")
    print(f"  Too long (>120 words): {long_desc}")
    print(f"  Good (80-120 words): {len(result) - short_desc - long_desc}")
    print(f"\nReview string word count issues:")
    print(f"  Too short (<12 words): {short_rev}")
    print(f"  Too long (>25 words): {long_rev}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Wrote {len(result)} entries to {OUTPUT_PATH}")

    # Spot check
    for spot_idx in [7000, 7100, 7250, 7500, 7750, 7999]:
        key = str(spot_idx)
        if key in result:
            p = chunk[spot_idx - 7000]
            desc = result[key]["description"]
            reviews = result[key]["reviewSummary"]
            print(f"\n=== Index {spot_idx}: {p['name']} ({p.get('categorySlug')}, {p.get('citySlug')}) ===")
            print(f"DESC ({len(desc.split())} words): {desc}")
            print(f"REVIEWS ({len(reviews)}):")
            for r in reviews:
                print(f"  [{len(r.split())}w] {r}")

if __name__ == "__main__":
    main()
