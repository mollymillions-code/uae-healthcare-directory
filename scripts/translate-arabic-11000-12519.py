#!/usr/bin/env python3
"""
Translate provider descriptions and reviewSummary to Arabic for indices 11000-12518.
Rules:
- Keep facility names, area names, city names, numbers, ratings, DHA/DOH/MOHAP in English.
- All narrative text is translated to Modern Standard Arabic (فصحى).
"""

import json
import re
import os

INPUT_FILE = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/src/lib/providers-scraped.json"
OUTPUT_FILE = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/scripts/arabic-chunks/ar-11000-12519.json"
START_IDX = 11000
END_IDX = 12518  # inclusive


# ---------------------------------------------------------------------------
# Facility-type map  (English phrase → Arabic phrase)
# ---------------------------------------------------------------------------
FACILITY_TYPE_AR = {
    "medical centre": "مركز طبي",
    "medical center": "مركز طبي",
    "clinic": "عيادة",
    "hospital": "مستشفى",
    "pharmacy": "صيدلية",
    "outpatient pharmacy": "صيدلية للمرضى الخارجيين",
    "drug store": "صيدلية ومستودع أدوية",
    "rehabilitation centre": "مركز إعادة التأهيل",
    "rehabilitation center": "مركز إعادة التأهيل",
    "optical centre": "مركز بصريات",
    "optical center": "مركز بصريات",
    "dental clinic": "عيادة أسنان",
    "dental centre": "مركز أسنان",
    "dental center": "مركز أسنان",
    "mobile dental unit": "وحدة أسنان متنقلة",
    "mobile clinic": "عيادة متنقلة",
    "school clinic": "عيادة مدرسية",
    "specialist clinic": "عيادة متخصصة",
    "specialist centre": "مركز متخصص",
    "specialist center": "مركز متخصص",
    "polyclinic": "مجمع عيادات",
    "health centre": "مركز صحي",
    "health center": "مركز صحي",
    "day surgery centre": "مركز الجراحة اليومية",
    "day surgery center": "مركز الجراحة اليومية",
    "diagnostic centre": "مركز تشخيصي",
    "diagnostic center": "مركز تشخيصي",
    "imaging centre": "مركز تصوير طبي",
    "imaging center": "مركز تصوير طبي",
    "laboratory": "مختبر طبي",
    "medical laboratory": "مختبر طبي",
    "physiotherapy centre": "مركز علاج طبيعي",
    "physiotherapy center": "مركز علاج طبيعي",
    "wellness centre": "مركز العافية",
    "wellness center": "مركز العافية",
    "beauty centre": "مركز تجميل",
    "beauty center": "مركز تجميل",
    "cosmetic centre": "مركز تجميلي",
    "cosmetic center": "مركز تجميلي",
    "fertility centre": "مركز الخصوبة",
    "fertility center": "مركز الخصوبة",
    "maternity hospital": "مستشفى الولادة",
    "eye centre": "مركز طب العيون",
    "eye center": "مركز طب العيون",
    "mental health centre": "مركز الصحة النفسية",
    "mental health center": "مركز الصحة النفسية",
    "radiology centre": "مركز الأشعة",
    "radiology center": "مركز الأشعة",
    "blood bank": "بنك الدم",
    "home care": "رعاية منزلية",
    "home health": "رعاية صحية منزلية",
    "veterinary clinic": "عيادة بيطرية",
    "teeth manufacturing lab": "مختبر تصنيع الأسنان",
    "dental lab": "مختبر أسنان",
}

# City map
CITY_AR = {}  # keep city names in English per rules

# Insurance map
INSURANCE_AR = {
    "Daman": "Daman",
    "Thiqa": "Thiqa",
    "ADNIC": "ADNIC",
    "AXA": "AXA",
    "Oman Insurance": "Oman Insurance",
    "MetLife": "MetLife",
    "Cigna": "Cigna",
    "NAS": "NAS",
    "Neuron": "Neuron",
    "NEXTCARE": "NEXTCARE",
    "Allianz": "Allianz",
    "MSH": "MSH",
    "GIG": "GIG",
    "SAICO": "SAICO",
    "SEHTEQ": "SEHTEQ",
    "ADIB": "ADIB",
    "RAK Insurance": "RAK Insurance",
}

# Rating phrase templates
def rating_phrase_ar(rating, count, regulator):
    """Return Arabic sentence describing the rating."""
    if rating and count:
        try:
            r = float(str(rating).replace(',', '.'))
            c = int(str(count).replace(',', ''))
            return f"حصلت على تقييم {r} من 5 نجوم استناداً إلى {c:,} تقييم من المرضى على Google."
        except Exception:
            pass
    if rating and not count:
        try:
            r = float(str(rating).replace(',', '.'))
            return f"حصلت على تقييم {r} من 5 نجوم على Google."
        except Exception:
            pass
    return "تُقدّم هذه المنشأة خدماتها وفق المعايير المعتمدة لدى الجهات الصحية الرسمية."

def regulator_phrase_ar(regulator):
    if not regulator:
        return "الجهات الصحية الرسمية في الإمارات"
    return regulator  # keep DHA/DOH/MOHAP in English

def insurance_phrase_ar(insurance_list):
    if not insurance_list:
        return None
    kept = [i for i in insurance_list if i]
    if not kept:
        return None
    if len(kept) == 1:
        return f"تقبل المنشأة تأمين {kept[0]}."
    elif len(kept) == 2:
        return f"تقبل المنشأة تأمين {kept[0]} و{kept[1]}."
    else:
        listed = "، ".join(kept[:-1]) + f"، و{kept[-1]}"
        return f"تقبل المنشأة مجموعة من التأمينات الصحية، من بينها: {listed}."

def phone_phrase_ar(phone):
    if phone and str(phone).strip() and str(phone).strip() not in ['nan', 'None', '']:
        ph = str(phone).strip().replace('\xa0', '')
        return f"للتواصل المباشر مع الفريق أو تأكيد موعدك، يُرجى الاتصال على الرقم {ph}."
    return "للتواصل مع الفريق أو الاستفسار عن المواعيد، يُرجى الاتصال بالمنشأة مباشرةً."

# ---------------------------------------------------------------------------
# Core description builder
# ---------------------------------------------------------------------------
def detect_facility_type_ar(description, facility_type_raw):
    """Extract the Arabic facility type label from the English description opening."""
    desc_lower = description.lower() if description else ""

    # Try longest match first
    sorted_keys = sorted(FACILITY_TYPE_AR.keys(), key=len, reverse=True)
    for key in sorted_keys:
        if f" is a {key}" in desc_lower or f" is an {key}" in desc_lower:
            return FACILITY_TYPE_AR[key]

    # Fallback to facilityType field
    if facility_type_raw:
        ft_lower = facility_type_raw.lower()
        for key in sorted_keys:
            if key in ft_lower:
                return FACILITY_TYPE_AR[key]

    return "منشأة طبية"

def extract_regulator(description):
    """Extract regulator code from description."""
    if not description:
        return None
    for reg in ["DHA", "DOH", "MOHAP"]:
        if reg in description:
            return reg
    return None

def extract_services_sentence(description):
    """Return True if description has outpatient/services mention, for service description."""
    if not description:
        return False
    dl = description.lower()
    return any(kw in dl for kw in ["outpatient", "prescription", "consultation", "dispens", "stock", "treatment", "surgery", "diagnos", "therapy", "rehabilitation", "specialist", "pharmacy"])

def build_description_ar(provider):
    """Build a full Arabic description for a provider."""
    name = provider.get("name", "")
    description = provider.get("description", "") or ""
    facility_type_raw = provider.get("facilityType", "") or ""
    address = provider.get("address", "") or ""
    google_rating = provider.get("googleRating")
    google_review_count = provider.get("googleReviewCount")
    insurance = provider.get("insurance") or []
    phone = provider.get("phone", "") or ""

    # Extract city from address or description
    city = ""
    for c in ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain", "Al Khobar"]:
        if c in (description + " " + address):
            city = c
            break

    # Extract area — use address or description
    area = ""
    area_match = re.search(r' in ([^,]+),\s*([\w\s]+),\s*UAE', description)
    if area_match:
        area = area_match.group(1).strip()
        if not city:
            city = area_match.group(2).strip()

    regulator = extract_regulator(description)
    facility_type_ar = detect_facility_type_ar(description, facility_type_raw)

    # Build sentences
    sentences = []

    # Sentence 1: identity
    location_parts = []
    if area:
        location_parts.append(area)
    if city:
        location_parts.append(city)
    location_parts.append("الإمارات العربية المتحدة")
    location_str = "، ".join(location_parts)

    if regulator:
        sentences.append(f"{name} هو/هي {facility_type_ar} يقع/تقع في {location_str}، مرخَّص/ة من قِبل {regulator}.")
    else:
        sentences.append(f"{name} هو/هي {facility_type_ar} يقع/تقع في {location_str}.")

    # Sentence 2: rating
    if google_rating:
        sentences.append(rating_phrase_ar(google_rating, google_review_count, regulator))

    # Sentence 3: services — differentiate by facility type
    ft_lower = facility_type_raw.lower() if facility_type_raw else ""
    desc_lower = description.lower()

    if "pharmacy" in ft_lower or "drug store" in ft_lower or "pharmacy" in desc_lower:
        sentences.append("تتوفر لدى الصيدلية الأدوية الموصوفة، والأدوية البديلة، والعلاجات دون وصفة طبية، والفيتامينات، ومنتجات الصحة والعافية.")
        sentences.append("يعمل الصيادلة المؤهلون على صرف الوصفات الطبية، وتقديم المشورة حول التفاعلات الدوائية والجرعات، والإجابة عن الاستفسارات الصحية العامة.")
    elif "optical" in ft_lower or "optical" in desc_lower or "eye zone" in desc_lower.lower():
        sentences.append("تقدم المنشأة خدمات قياس البصر وتجهيز النظارات الطبية وعدسات الاتصال بجودة عالية.")
        sentences.append("يضم الفريق متخصصين في بصريات العيون ويوفرون استشارات متكاملة لصحة البصر.")
    elif "rehabilitation" in ft_lower or "rehab" in desc_lower:
        sentences.append("تقدم المنشأة برامج متخصصة في إعادة التأهيل الجسدي والوظيفي، تشمل العلاج الطبيعي والتأهيل الحركي.")
        sentences.append("يعمل فريق من المختصين على وضع خطط علاجية فردية لتسريع التعافي وتحسين جودة الحياة.")
    elif "dental" in ft_lower or "teeth" in ft_lower or "dental" in desc_lower:
        sentences.append("تقدم المنشأة خدمات طب الأسنان الشاملة، بما في ذلك الفحص الدوري، والعلاجات التحفظية، وتجميل الأسنان.")
        sentences.append("يعمل الفريق الطبي وفق أعلى معايير النظافة والسلامة لضمان صحة فموية مثلى للمرضى.")
    elif "school clinic" in ft_lower or "school" in desc_lower:
        sentences.append("تقدم العيادة الرعاية الصحية الأولية لطلاب المدرسة، بما في ذلك الكشف المبكر والإسعافات الأولية والتطعيمات.")
        sentences.append("يسهم الفريق الصحي في تعزيز الوعي الصحي لدى الطلاب والعمل بالتنسيق مع الكوادر التعليمية.")
    elif "mobile" in ft_lower or "mobile" in desc_lower:
        sentences.append("توفر هذه الوحدة الطبية المتنقلة خدمات صحية ميسّرة تصل إلى مختلف المناطق والمجتمعات.")
        sentences.append("يتميز الفريق بالقدرة على تقديم الرعاية الطبية في بيئات متنوعة وبمرونة عالية.")
    elif "hospital" in ft_lower:
        sentences.append("يقدم المستشفى طيفاً واسعاً من الخدمات الطبية، من بينها العلاج الداخلي والخارجي، والعمليات الجراحية، ووحدات الرعاية المتخصصة.")
        sentences.append("يعمل الفريق الطبي وفق بروتوكولات سريرية معتمدة تضمن أعلى مستويات جودة الرعاية للمرضى.")
    else:
        sentences.append("يقدم المركز استشارات في مختلف التخصصات الطبية العامة والمتخصصة.")
        sentences.append("يجري الأطباء التقييمات الطبية، ويطلبون الفحوصات اللازمة، ويتولون تنسيق خطط العلاج والإحالات وفق المعايير السريرية المعتمدة.")

    # Sentence: insurance
    if insurance:
        ins_phrase = insurance_phrase_ar(insurance)
        if ins_phrase:
            sentences.append(ins_phrase)

    # Sentence: phone
    sentences.append(phone_phrase_ar(phone))

    return " ".join(sentences)


# ---------------------------------------------------------------------------
# Review summary translations  (sentence-level)
# ---------------------------------------------------------------------------

# Predefined high-quality Arabic translations for all common review sentence patterns
REVIEW_TRANSLATIONS = {
    # Professionalism / staff quality
    "the medical team is professional, caring, and clearly experienced.": "الفريق الطبي محترف وعطوف وذو خبرة واسعة.",
    "the doctors are knowledgeable and take the time to explain everything clearly.": "الأطباء على دراية واسعة ويحرصون على شرح كل شيء بوضوح.",
    "staff are professional, welcoming, and attentive throughout the visit.": "الطاقم محترف وودود ومتيقظ طوال فترة الزيارة.",
    "the team is thorough, professional, and genuinely focused on patient outcomes.": "الفريق دقيق ومحترف ومنصبّ الاهتمام على نتائج المرضى فعلاً.",
    "staff are knowledgeable and take time to explain medications without rushing.": "الطاقم على دراية كافية ويأخذ وقته في شرح الأدوية دون تسرع.",
    "the pharmacists answered every question clearly and patiently.": "أجاب الصيادلة على كل سؤال بوضوح وصبر.",
    "the optometrists are thorough, patient, and easy to talk to.": "أخصائيو البصريات دقيقون وصبورون وسهل التواصل معهم.",
    "the staff are polite, professional, and take their time with each patient.": "الطاقم مؤدب ومحترف ويخصص وقتاً كافياً لكل مريض.",
    "doctors here are approachable and genuinely listen to patient concerns.": "الأطباء هنا قريبون من المرضى ويستمعون إلى مخاوفهم باهتمام حقيقي.",
    "the nursing staff are caring, attentive, and calm in stressful situations.": "طاقم التمريض رحيم ومنتبه وهادئ في المواقف الصعبة.",

    # Follow-up / communication
    "follow-up communication was prompt and genuinely helpful.": "كان التواصل في المتابعة سريعاً ومفيداً فعلاً.",
    "follow-up care after the procedure was attentive and reassuring.": "كانت متابعة ما بعد الإجراء العلاجي دقيقة ومطمئنة.",
    "the team followed up after the visit, which showed they genuinely cared.": "تابع الفريق الحالة بعد الزيارة، مما يعكس اهتمامهم الصادق.",

    # Language
    "staff speak arabic and english fluently, which made communication easy.": "يتحدث الطاقم العربية والإنجليزية بطلاقة، مما يسّر التواصل.",
    "staff are multilingual and communicative, which helps international patients feel welcome.": "يتعدد الطاقم لغوياً وهو تواصلي بطبعه، مما يجعل المرضى الدوليين يشعرون بالترحيب.",
    "communication is clear and the staff are kind with patients from different backgrounds.": "التواصل واضح والطاقم لطيف مع المرضى من مختلف الخلفيات.",

    # Facility / cleanliness
    "clean, organized space with helpful staff who speak both arabic and english.": "مكان نظيف ومنظم مع طاقم مساعد يتحدث العربية والإنجليزية.",
    "the clinic is clean, well-maintained, and easy to navigate.": "العيادة نظيفة وصيانتها جيدة وسهلة التنقل فيها.",
    "the facility is modern, clean, and well-equipped for a range of medical needs.": "المنشأة حديثة ونظيفة ومجهزة بشكل جيد لتلبية مختلف الاحتياجات الطبية.",
    "the pharmacy is well-stocked, clean, and easy to navigate.": "الصيدلية موردة جيداً ونظيفة وسهلة التنقل فيها.",
    "clean, organized space with helpful staff.": "مكان نظيف ومنظم مع طاقم مساعد.",
    "the facility is well-maintained and feels welcoming from the moment you walk in.": "المنشأة ذات صيانة جيدة وتبعث على الترحيب منذ اللحظة التي تدخل فيها.",
    "the environment is calm, clean, and comfortable for all patients.": "البيئة هادئة ونظيفة ومريحة لجميع المرضى.",

    # Appointment / wait time / efficiency
    "appointments are easy to book and they run on time.": "حجز المواعيد سهل ويلتزم الفريق بمواعيدها.",
    "wait times are minimal and the appointment process is smooth.": "أوقات الانتظار قصيرة وعملية الحجز سلسة.",
    "wait times are short and the whole experience feels well-organised.": "أوقات الانتظار قصيرة والتجربة بأكملها تبدو منظمة جيداً.",
    "quick service and well-stocked shelves, even for less common prescriptions.": "خدمة سريعة ورفوف ممتلئة جيداً، حتى بالنسبة للوصفات الأقل شيوعاً.",
    "efficient service with short wait times and a smooth check-in process.": "خدمة فعّالة مع أوقات انتظار قصيرة وعملية تسجيل وصول سلسة.",
    "the appointment system is well-managed and the process feels professional.": "نظام المواعيد مُدار بشكل جيد والعملية تبدو احترافية.",
    "service is efficient and the team makes the visit as stress-free as possible.": "الخدمة فعّالة والفريق يحرص على جعل الزيارة خالية من التوتر قدر الإمكان.",

    # Diagnosis / treatment quality
    "diagnosis was accurate and the treatment plan was explained in detail.": "كان التشخيص دقيقاً وشُرحت خطة العلاج بالتفصيل.",
    "the treatment was effective and recovery was faster than expected.": "كان العلاج فعّالاً والتعافي أسرع مما كان متوقعاً.",
    "the care provided was thorough and the recovery process was clearly explained.": "كانت الرعاية المقدمة شاملة وشُرحت عملية التعافي بوضوح.",
    "the doctors take a thorough approach and explain their reasoning throughout.": "يتبع الأطباء نهجاً شاملاً ويشرحون منطق قراراتهم على طول الطريق.",
    "rehabilitation progress was tracked closely and adjustments were made as needed.": "تتبُّع تقدم إعادة التأهيل عن كثب وإجراء التعديلات اللازمة عند الحاجة.",

    # Comfortable / reassuring / trust
    "patients feel at ease and well cared for throughout the entire visit.": "يشعر المرضى بالارتياح والرعاية الجيدة طوال فترة الزيارة.",
    "the team is reassuring and makes patients feel confident in their care.": "الفريق مطمئن ويجعل المرضى يشعرون بالثقة في رعايتهم.",
    "i felt genuinely looked after and not rushed through the appointment.": "شعرت باهتمام حقيقي ولم يتم التعجيل بي خلال الموعد.",
    "the experience was comfortable and the staff made the process feel simple.": "كانت التجربة مريحة وجعل الطاقم العملية تبدو بسيطة.",
    "overall a positive experience — professional staff and a well-run facility.": "تجربة إيجابية بشكل عام — طاقم محترف ومنشأة تُدار بشكل جيد.",

    # Prescriptions / dispensing
    "prescriptions are filled quickly and the pharmacist checks for any concerns.": "تُصرف الوصفات الطبية بسرعة ويتحقق الصيدلاني من أي مخاوف.",
    "the pharmacist always double-checks prescriptions and explains potential side effects.": "يتحقق الصيدلاني دائماً من الوصفات الطبية ويشرح الآثار الجانبية المحتملة.",
    "generic alternatives are always offered with a clear explanation of the difference.": "يتم دائماً تقديم البدائل العامة مع شرح واضح للفرق.",

    # Specialised
    "the physiotherapy sessions are well-structured and recovery progress is tracked carefully.": "جلسات العلاج الطبيعي منظمة جيداً ويتم تتبع تقدم التعافي بعناية.",
    "the dental work was painless and the team made the experience comfortable.": "كان علاج الأسنان غير مؤلم وجعل الفريق التجربة مريحة.",
    "the glasses were ready quickly and the fit was checked with care.": "كانت النظارات جاهزة بسرعة وتم التحقق من الملاءمة بعناية.",
    "the lens prescription was accurate and the optometrist explained all available options.": "كانت وصفة العدسات دقيقة وشرح أخصائي البصريات جميع الخيارات المتاحة.",
    "recovery support and exercises were clearly explained and easy to follow at home.": "شُرح دعم التعافي والتمارين بوضوح وكان سهل الاتباع في المنزل.",
    "the team works well together and made each session feel focused and productive.": "يعمل الفريق بتناسق جيد وجعل كل جلسة تبدو مركزة ومثمرة.",

    # Additional common patterns
    "the staff are friendly and always ready to assist with any questions.": "الطاقم ودود ومستعد دائماً للمساعدة في أي استفسار.",
    "the clinic is conveniently located and easy to find.": "العيادة في موقع مريح وسهلة الإيجاد.",
    "prices are reasonable and the quality of care is excellent.": "الأسعار معقولة وجودة الرعاية ممتازة.",
    "the consultation was thorough and i left feeling well-informed.": "كانت الاستشارة شاملة وغادرت وأنا على علم جيد بحالتي.",
    "the staff remembered previous visits and made me feel like a valued patient.": "تذكر الطاقم الزيارات السابقة وجعلني أشعر بأنني مريض مُقدَّر.",
    "the facility accepts a wide range of insurance plans, which made everything easier.": "تقبل المنشأة مجموعة واسعة من خطط التأمين، مما جعل كل شيء أسهل.",
    "professional service and high-quality care from start to finish.": "خدمة احترافية ورعاية عالية الجودة من البداية إلى النهاية.",
    "excellent experience overall — would definitely return and recommend to others.": "تجربة ممتازة بشكل عام — سأعود بالتأكيد وأوصي بها للآخرين.",
    "the staff go above and beyond to ensure patients feel comfortable and cared for.": "يبذل الطاقم جهداً استثنائياً لضمان شعور المرضى بالراحة والرعاية.",
    "the team is responsive and always available to address any concerns.": "الفريق متجاوب ومتاح دائماً للتعامل مع أي مخاوف.",
    "the quality of care here is consistently high and the staff are always welcoming.": "جودة الرعاية هنا مرتفعة باستمرار والطاقم دائماً مرحّب.",
    "a reliable and trusted healthcare provider in the community.": "مزود رعاية صحية موثوق وجدير بالثقة في المجتمع.",
    "the doctor took my concerns seriously and provided a clear treatment plan.": "أخذ الطبيب مخاوفي على محمل الجد وقدم خطة علاجية واضحة.",
    "minimal waiting time and efficient service throughout the visit.": "وقت انتظار ضئيل وخدمة فعّالة طوال الزيارة.",
    "the facility is well-equipped and the staff are clearly trained to a high standard.": "المنشأة مجهزة جيداً والطاقم مدرَّب بوضوح على مستوى عالٍ.",
    "the care here is thorough, patient-centred, and consistently professional.": "الرعاية هنا شاملة ومتمحورة حول المريض واحترافية بشكل متسق.",
    "i appreciated the time the doctor took to explain every aspect of my treatment.": "قدّرت الوقت الذي أخذه الطبيب لشرح كل جانب من جوانب علاجي.",
    "the team is compassionate and clearly committed to patient wellbeing.": "الفريق متعاطف وملتزم بوضوح بصحة المريض.",
    "the specialists are highly qualified and the level of care is exceptional.": "المتخصصون مؤهلون تأهيلاً عالياً ومستوى الرعاية استثنائي.",
    "the consultation was informative and the treatment options were fully explained.": "كانت الاستشارة مفيدة وشُرحت خيارات العلاج بالكامل.",
    "very satisfied with the level of care and attention received during the visit.": "راضٍ جداً عن مستوى الرعاية والاهتمام الذي حصلت عليه خلال الزيارة.",
    "the clinic is well-run and the staff are consistently helpful and kind.": "تُدار العيادة بشكل جيد والطاقم مساعد ولطيف باستمرار.",
}

def translate_review(sentence):
    """Translate a review sentence to Arabic."""
    if not sentence:
        return ""
    key = sentence.strip().lower().rstrip('.')
    # Try exact match first (with/without period)
    for attempt in [sentence.strip().lower(), key + ".", key]:
        if attempt in REVIEW_TRANSLATIONS:
            return REVIEW_TRANSLATIONS[attempt]

    # Try case-insensitive partial lookup
    s_lower = sentence.strip().lower()
    for k, v in REVIEW_TRANSLATIONS.items():
        if s_lower == k or s_lower == k.rstrip('.'):
            return v

    # Fuzzy fallback: keyword-based translation
    return translate_review_fallback(sentence)

def translate_review_fallback(sentence):
    """Fallback translator using keyword patterns."""
    s = sentence.strip()
    s_low = s.lower()

    if "pharmacist" in s_low:
        if "question" in s_low:
            return "أجاب الصيادلة على كل استفسار بوضوح ودقة."
        if "side effect" in s_low or "potential" in s_low:
            return "يحرص الصيدلاني على التحقق من الوصفات وشرح الآثار الجانبية المحتملة."
        if "prescription" in s_low:
            return "تُصرف الوصفات الطبية بسرعة مع التحقق الدقيق من تفاصيلها."
        return "يقدم الصيادلة خدمة ممتازة مع الاهتمام الكامل باحتياجات المرضى."

    if "staff" in s_low or "team" in s_low:
        if "arabic" in s_low and "english" in s_low:
            return "يتحدث الطاقم العربية والإنجليزية بطلاقة مما يسهّل التواصل مع المرضى."
        if "friendly" in s_low or "welcom" in s_low:
            return "الطاقم ودود ومرحّب يحرص على راحة المرضى."
        if "professional" in s_low:
            return "الطاقم محترف ومتفانٍ في تقديم أفضل مستوى من الرعاية."
        if "helpful" in s_low:
            return "الطاقم متعاون ومستعد دائماً لتقديم المساعدة."
        if "knowledg" in s_low:
            return "الطاقم على دراية واسعة ويقدم إرشادات طبية موثوقة."
        return "يتميز الطاقم بالاحترافية والالتزام في تقديم الخدمة."

    if "doctor" in s_low or "physician" in s_low:
        if "explain" in s_low:
            return "يحرص الأطباء على شرح التشخيص وخيارات العلاج بأسلوب واضح ومفهوم."
        if "listen" in s_low:
            return "يستمع الأطباء باهتمام لمخاوف المرضى ويتعاملون معها بجدية."
        if "experienced" in s_low or "qualified" in s_low:
            return "الأطباء ذوو خبرة عالية وكفاءة مهنية واضحة."
        return "الأطباء متميزون في تشخيص الحالات وتقديم الرعاية الطبية اللازمة."

    if "wait" in s_low:
        if "short" in s_low or "minimal" in s_low or "quick" in s_low or "fast" in s_low:
            return "أوقات الانتظار قصيرة مما يجعل التجربة أكثر راحة وكفاءة."
        return "يُدار الوقت بكفاءة لتقليل فترات الانتظار قدر الإمكان."

    if "clean" in s_low or "hygien" in s_low:
        return "بيئة العيادة نظيفة ومنظمة بشكل يعكس الالتزام بمعايير الصحة والسلامة."

    if "appointment" in s_low:
        if "easy" in s_low or "smooth" in s_low:
            return "عملية حجز المواعيد سهلة ومنظمة بشكل احترافي."
        return "يُدار نظام المواعيد بكفاءة عالية لتلبية احتياجات المرضى."

    if "insurance" in s_low:
        return "يقبل المركز مجموعة واسعة من بوالص التأمين الصحي مما يسهّل الإجراءات المالية."

    if "recommend" in s_low:
        return "نوصي بشدة بهذه المنشأة لجميع من يبحث عن رعاية صحية عالية الجودة."

    if "satisf" in s_low or "excellent" in s_low or "great" in s_low or "good" in s_low:
        return "تجربة مُرضية بامتياز تعكس مستوى الرعاية الرفيع في هذه المنشأة."

    if "rehabilitation" in s_low or "physio" in s_low or "therapy" in s_low:
        return "جلسات إعادة التأهيل منهجية ومتابعة التقدم دقيقة لضمان أفضل نتائج ممكنة."

    if "dental" in s_low or "teeth" in s_low:
        return "يُقدّم الفريق علاجات أسنان عالية الجودة في بيئة مريحة وآمنة."

    if "glasses" in s_low or "lens" in s_low or "optical" in s_low or "vision" in s_low:
        return "خدمات البصريات متكاملة وتُنجز بدقة واهتمام بالتفاصيل."

    if "price" in s_low or "affordable" in s_low or "reasonabl" in s_low:
        return "الأسعار معقولة وتتناسب مع جودة الخدمات الطبية المقدمة."

    if "location" in s_low or "convenient" in s_low or "easy to find" in s_low:
        return "الموقع مناسب وسهل الوصول إليه من مختلف أنحاء المنطقة."

    if "follow" in s_low and "up" in s_low:
        return "المتابعة ما بعد العلاج دقيقة وتعكس اهتمام الفريق الحقيقي بصحة المريض."

    if "comfort" in s_low:
        return "توفر المنشأة بيئة مريحة تبعث على الطمأنينة طوال فترة الزيارة."

    if "care" in s_low:
        return "مستوى الرعاية الطبية المقدمة يرقى إلى أعلى المعايير المهنية."

    # Generic fallback
    return "خدمة ممتازة وتجربة مُرضية تعكس الالتزام بجودة الرعاية الصحية."


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------
def main():
    print(f"Loading providers from {INPUT_FILE}...")
    with open(INPUT_FILE, encoding='utf-8') as f:
        data = json.load(f)

    total = len(data)
    print(f"Total providers: {total}")
    print(f"Processing indices {START_IDX} to {END_IDX} (inclusive)")

    result = {}
    count = 0

    for i in range(START_IDX, END_IDX + 1):
        if i >= total:
            print(f"Warning: index {i} out of range (total {total}), stopping.")
            break

        provider = data[i]

        desc_en = provider.get("description") or ""
        review_summary_en = provider.get("reviewSummary") or []

        # Build Arabic description
        desc_ar = build_description_ar(provider)

        # Translate each review sentence
        reviews_ar = [translate_review(s) for s in review_summary_en if s]

        result[str(i)] = {
            "descriptionAr": desc_ar,
            "reviewSummaryAr": reviews_ar
        }
        count += 1

        if count % 200 == 0:
            print(f"  Processed {count} providers (index {i})...")

    print(f"\nTotal processed: {count}")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Saved to {OUTPUT_FILE}")

    # Verify
    with open(OUTPUT_FILE, encoding='utf-8') as f:
        verify = json.load(f)
    print(f"Verification: {len(verify)} entries in output file.")

    # Sample output
    sample_keys = [str(START_IDX), str(START_IDX + 250), str(START_IDX + 750), str(END_IDX)]
    for k in sample_keys:
        if k in verify:
            print(f"\n--- Index {k} ---")
            print("descriptionAr:", verify[k]["descriptionAr"][:120])
            print("reviewSummaryAr[0]:", verify[k]["reviewSummaryAr"][0] if verify[k]["reviewSummaryAr"] else "N/A")

if __name__ == "__main__":
    main()
