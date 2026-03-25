#!/usr/bin/env python3
"""
Translate provider descriptions and reviewSummary to Arabic for indices 7000-7999.
Output format: {"7000": {"descriptionAr": "...", "reviewSummaryAr": ["...", "..."]}, ...}

Rules:
- Keep facility names, area names, city names, numbers, ratings, DHA/DOH/MOHAP in English
- Translate all other prose to Arabic
- Process ALL 1000 providers
"""

import json
import re

INPUT_PATH = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/src/lib/providers-scraped.json"
OUTPUT_PATH = "/Users/kankanaray/Zavis UAE Healthcare Directory and Journal/scripts/arabic-chunks/ar-7000-7999.json"

# Arabic translations for common facility type labels
FACILITY_LABELS_AR = {
    "pharmacy": "صيدلية",
    "medical center": "مركز طبي",
    "medical warehouse": "مستودع طبي",
    "optical center": "مركز بصريات",
    "school clinic": "عيادة مدرسية",
    "general medicine clinic": "عيادة طب عام",
    "nursery clinic": "عيادة حضانة",
    "dental clinic": "عيادة أسنان",
    "alternative medicine center": "مركز الطب البديل",
    "health support center": "مركز دعم صحي",
    "specialized clinic": "عيادة متخصصة",
    "rehabilitation center": "مركز إعادة التأهيل",
    "medical laboratory": "مختبر طبي",
    "dental laboratory": "مختبر أسنان",
    "hospital": "مستشفى",
    "home health care provider": "مزود رعاية صحية منزلية",
    "day surgery center": "مركز جراحة اليوم الواحد",
    "diagnostic center": "مركز تشخيصي",
    "polyclinic": "عيادة متعددة التخصصات",
    "pediatric clinic": "عيادة أطفال",
    "dental center": "مركز أسنان",
    "eye clinic": "عيادة عيون",
    "physiotherapy center": "مركز علاج طبيعي",
    "dermatology clinic": "عيادة جلدية",
    "medical clinic": "عيادة طبية",
    "eye care center": "مركز رعاية العيون",
    "diagnostic laboratory": "مختبر تشخيصي",
    "medical equipment supplier": "مورد معدات طبية",
    "healthcare facility": "منشأة رعاية صحية",
}

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
    if "licensed by dha" in desc or "dubai health authority" in desc:
        return "DHA"
    elif "licensed by doh" in desc or "department of health abu dhabi" in desc:
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

def get_facility_label_ar(provider):
    label = get_facility_label(provider)
    return FACILITY_LABELS_AR.get(label, "منشأة رعاية صحية")

def translate_description(provider):
    """
    Build an Arabic description that mirrors the English template logic.
    Facility names, area names, city names, numbers, ratings, DHA/DOH/MOHAP stay in English.
    """
    name = provider.get("name", "").strip()
    city = get_city(provider)
    area = get_area(provider)
    regulator = get_regulator(provider)
    facility_label_ar = get_facility_label_ar(provider)
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

    if area and area.lower() != city.lower():
        location = f"{area}، {city}"
    else:
        location = city

    parts = []

    # Sentence 1: intro
    parts.append(f"{name} هي {facility_label_ar} تقع في {location}.")

    # Sentence 2: rating
    if rating >= 4.0 and count >= 5:
        parts.append(f"تحمل تقييماً {rating} نجمة على Google استناداً إلى {count} مراجعة من المرضى، مما يعكس سجلاً قوياً في تقديم الرعاية.")
    elif rating >= 4.0 and count >= 1:
        parts.append(f"منح المرضى هذه المنشأة تقييم {rating} نجمات على Google، مما يشير إلى رضاهم عن جودة الخدمات المقدمة.")
    elif rating >= 3.0 and count >= 3:
        parts.append(f"يمنحها المراجعون على Google تقييم {rating} نجمات، حيث يشير المرضى إلى سهولة الوصول إليها ومرفقاتها المناسبة.")
    elif rating > 0:
        parts.append(f"تحمل حالياً تقييم {rating} نجمة على Google بناءً على تعليقات المرضى الأوائل.")

    # Sentence 3: services
    if services:
        if len(services) == 1:
            parts.append(f"تتخصص المنشأة في {services[0]}، وتقدم رعاية متخصصة ومركزة لمرضاها.")
        elif len(services) == 2:
            parts.append(f"تشمل الخدمات الأساسية {services[0]} و{services[1]}، ويمكن للمرضى الحصول عليهما في مكان واحد.")
        elif len(services) == 3:
            parts.append(f"تشمل الخدمات المتاحة {services[0]}، و{services[1]}، و{services[2]}، مما يتيح للمرضى الوصول إلى مجموعة متنوعة من الرعاية.")
        else:
            svc_list = "، ".join(s for s in services[:3])
            rest = len(services) - 3
            if rest > 0:
                parts.append(f"تقدم المنشأة {svc_list}، وعدداً من التخصصات الإضافية، مما يجعلها خياراً متعدد الخدمات للمرضى في {city}.")
            else:
                parts.append(f"تقدم المنشأة {svc_list}، لتغطية مجموعة واسعة من الاحتياجات الصحية للمرضى المحليين.")
    else:
        cat_service_map = {
            "pharmacy": f"يوفر {name} مجموعة واسعة من الأدوية الموصوفة والعلاجات المتاحة دون وصفة طبية والفيتامينات ومنتجات الصحة اليومية للمجتمع المحلي.",
            "medical-equipment": "توفر المنشأة الأجهزة الطبية والمستلزمات السريرية والمعدات الصحية للمتخصصين والأفراد في جميع أنحاء المنطقة.",
            "ophthalmology": "يقدم المركز فحوصات العيون وتقييمات البصر وصرف النظارات الطبية وتركيب العدسات اللاصقة للمرضى من جميع الأعمار.",
            "alternative-medicine": "يقدم المركز علاجات تقليدية وتكميلية تشمل الحجامة والوخز بالإبر والطب العشبي المصممة خصيصاً لكل مريض.",
            "physiotherapy": "تشمل برامج العلاج العلاج اليدوي وإعادة التأهيل بالتمارين والعلاج الكهربائي وإدارة الألم للمرضى المتعافين من الإصابات أو الجراحة.",
            "labs-diagnostics": "تُجري المنشأة مجموعة واسعة من الاختبارات التشخيصية والتحليلات السريرية، لدعم الأطباء والمرضى بنتائج دقيقة وفي الوقت المناسب.",
            "dental": "تشمل خدمات طب الأسنان الفحوصات الدورية والتنظيف المهني والحشوات والخلع وأعمال الأسنان التجميلية للمرضى من جميع الأعمار.",
            "pediatrics": "تقدم العيادة استشارات صحة الطفل ومراقبة النمو وبرامج التطعيم وعلاج الأمراض الشائعة عند الأطفال.",
            "hospitals": "يقدم المستشفى رعاية للمرضى الداخليين والخارجيين عبر تخصصات متعددة، مع إمكانية الوصول على مدار الساعة إلى المختصين الطبيين والدعم التشخيصي.",
            "clinics": "تتوفر استشارات طبية عامة، إلى جانب الفحوصات الصحية والإحالات وإجراءات المتابعة لمجموعة من الحالات.",
        }
        if cat in cat_service_map:
            parts.append(cat_service_map[cat])
        else:
            parts.append(f"تقدم المنشأة خدمات رعاية صحية للمرضى في {city}، بفريق مؤهل لمعالجة مجموعة متنوعة من الاحتياجات الصحية.")

    # Sentence 4: regulator
    regulator_desc = {
        "DHA": "هيئة الصحة في دبي (DHA)، مما يضمن الامتثال الكامل لمعايير الترخيص والجودة الصحية في دبي.",
        "DOH": "دائرة الصحة في أبوظبي (DOH)، والتزامها بإطار جودة الرعاية الصحية الصارم في أبوظبي.",
        "MOHAP": "وزارة الصحة ووقاية المجتمع (MOHAP)، الجهة الصحية الاتحادية في الإمارات، مما يؤكد استيفاءها للمعايير الوطنية لسلامة المرضى وجودة الرعاية.",
    }
    parts.append(f"المنشأة مرخصة ومنظمة من قِبَل {regulator_desc.get(regulator, regulator + '، الجهة الصحية المختصة في الإمارات.')}")

    # Sentence 5: category-specific closing
    if is_school:
        parts.append("تعمل ضمن البيئة المدرسية، وتقدم الإسعافات الأولية الفورية ومراقبة الصحة ودعم الإحالة للطلاب والمدرسين طوال اليوم الدراسي.")
    elif is_nursery:
        parts.append("تضمن عيادة الحضانة حصول الأطفال الصغار على رعاية طبية دقيقة، حيث تُشكّل الفحوصات الصحية والتطعيمات والتواصل مع الأهل جوهر عملياتها اليومية.")
    elif cat == "pharmacy":
        parts.append(f"يتوفر صيادلة {name} للإجابة على استفسارات الأدوية وتقديم المشورة بشأن الجرعات وإرشاد المرضى عبر خيارات العلاج بعناية ووضوح.")
    elif cat == "medical-equipment":
        parts.append("الفريق متاح لمساعدة العملاء في اختيار المعدات المناسبة، ويمكنه تقديم إرشادات حول الاستخدام الآمن والصيانة السليمة.")
    elif cat == "ophthalmology":
        parts.append("سواء كنت بحاجة إلى فحص روتيني للعيون أو نظارة طبية جديدة، يتعامل الفريق مع كل حالة باهتمام وشمولية.")
    elif cat == "alternative-medicine":
        parts.append("يتخذ المختصون وقتاً لفهم أهداف صحة كل مريض، جامعين بين المعرفة التقليدية ونهج يضع المريض في المقام الأول.")
    elif cat == "physiotherapy":
        parts.append(f"يتلقى كل مريض في {name} خطة علاجية فردية، مع مراجعة منتظمة للتقدم المُحرز وتعديل التمارين مع تقدم التعافي.")
    elif cat == "dental":
        parts.append("يولي الفريق الطبي أولوية لراحة المريض، ويحرص على شرح كل إجراء وضمان تجربة إيجابية من البداية إلى النهاية.")
    elif cat == "pediatrics":
        parts.append(f"يبذل أطباء الأطفال في {name} قصارى جهودهم لخلق أجواء هادئة ومطمئنة تريح الأطفال وذويهم.")
    elif cat == "labs-diagnostics":
        parts.append("يُعهد بجمع العينات إلى متخصصين مدربين، ويمكن للمرضى عادةً توقع التواصل الواضح بشأن النتائج في الإطار الزمني المتفق عليه.")
    elif cat == "hospitals":
        parts.append("يعني النهج متعدد التخصصات في المستشفى أن المرضى ذوي الحالات المعقدة أو المزمنة يمكنهم الوصول إلى رعاية منسقة من متخصصين متعددين في مكان واحد.")
    else:
        parts.append(f"يلتزم الفريق في {name} بتقديم رعاية احترافية ودودة تحترم وقت كل مريض واحتياجاته الصحية.")

    # Sentence 6: contact or closing
    if phone:
        parts.append(f"لحجز موعد أو الاستفسار، يمكن التواصل مع المنشأة مباشرة على {phone}.")
    else:
        parts.append(f"يرحب {name} بالمرضى بالحجز المسبق أو الزيارات المباشرة دون موعد.")

    return " ".join(parts)


def translate_review_summary(provider):
    """
    Build Arabic reviewSummary strings that mirror the English template logic.
    Facility names, city names, numbers stay in English.
    """
    name = provider.get("name", "").strip()
    city = get_city(provider)
    cat = provider.get("categorySlug", "")
    facility_label_ar = get_facility_label_ar(provider)
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
            f"تستجيب عيادة {name} المدرسية بسرعة لمخاوف صحة الطلاب طوال اليوم.",
            "يُبقي الممرضون الأهالي على اطلاع ويتعاملون مع الإصابات البسيطة والأمراض بهدوء ومهنية.",
            "يشعر الطلاب بالأمان عند وجود كوادر صحية مؤهلة في الموقع خلال ساعات الدراسة.",
            "تنسق العيادة بسلاسة مع الأهالي وإدارة المدرسة عند الحاجة إلى إحالة الحالات.",
            "منشأة مريحة ومُدارة بكفاءة تمنح الأسر ثقة بالرعاية الصحية المدرسية لأطفالهم.",
        ]
    elif is_nursery:
        pool = [
            f"يثق الأهالي بممرضي {name} في رعاية أطفالهم الصغار بدفء حقيقي.",
            "تُدار الفحوصات الصحية والتطعيمات بسلاسة، مع إحاطة الأهالي علماً بكل خطوة.",
            "تبدو عيادة الحضانة هادئة وملائمة للأطفال، مما يساعد الصغار على الاسترخاء أثناء الزيارات.",
            "يتواصل الطاقم بوضوح مع الأسر حول أي مخاوف صحية أو متابعة مطلوبة.",
            "عيادة حضانة بكوادر جيدة تمنح الآباء العاملين طمأنينة حقيقية تجاه رعاية أطفالهم.",
        ]
    elif cat == "pharmacy":
        if rating >= 4.5 and count >= 5:
            pool = [
                f"يتمتع صيادلة {name} بمعرفة واسعة ويأخذون وقتاً كافياً لشرح كل دواء بوضوح.",
                "تُصرف الوصفات الطبية بسرعة ودون أي تعقيد، مما يجعل كل زيارة سلسة وخالية من التوتر.",
                "يبذل الطاقم قصارى جهده للحصول على الأدوية النادرة لخدمة الزبائن المنتظمين.",
                "الرفوف نظيفة وممتلئة جيداً مما يعني ندرة مغادرة المرضى دون ما جاؤوا بحثاً عنه.",
                f"صيدلية ودودة بحق يتذكر فيها الطاقم الزبائن العائدين ويرحب بهم بحرارة.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يقدّر المرضى الطاقم المتعاون والصبور الذي يجيب على الأسئلة دون استعجال.",
                "الصيدلية سهلة الوصول وعادةً ما تكون الأدوية جاهزة في غضون دقائق.",
                f"صيدلية حي موثوقة للوصفات الطبية والمستلزمات الصحية اليومية في {city}.",
                "الطاقم مؤدب ومهني، مما يجعل كل زيارة فعّالة وممتعة حقاً.",
                "الأسعار المعقولة والمخزون الجيد هما ما يجعل المرضى الأوفياء يعودون بانتظام.",
            ]
        elif rating >= 3.0:
            pool = [
                f"{name} خيار عملي للوصفات الروتينية والمنتجات الصحية الأساسية في المنطقة.",
                "قد تتفاوت أوقات الانتظار، لكن الطاقم عموماً متعاون ومستعد للمساعدة.",
                "أسعار معقولة ومجموعة جيدة من منتجات الصيدلية المتاحة دون وصفة للاحتياجات اليومية.",
                "يؤدي المهمة بموثوقية للصيدلة الروتينية والوصفات في المنطقة المحلية.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات صيدلية أساسية للمجتمع المحلي في {city}.",
                "خيار مباشر وغير متكلف لاستلام الوصفات الطبية والمستلزمات الصحية الأساسية.",
                f"موقع مناسب للسكان الذين يحتاجون إلى خدمات صيدلية روتينية في {city}.",
                "يتولى الفريق صرف الوصفات والاستفسارات المتعلقة بالمنتجات الصحية الأساسية بكفاءة.",
            ]

    elif cat == "clinics":
        if rating >= 4.5 and count >= 10:
            pool = [
                f"يأخذ الأطباء في {name} وقتهم الكافي خلال الاستشارات ولا يشعر المرضى بالاستعجال أبداً.",
                "العيادة منظمة بشكل جيد مع أوقات انتظار قصيرة حتى في أكثر الأوقات ازدحاماً.",
                "الطاقم دافئ ومهني من طاولة الاستقبال وحتى غرفة الفحص.",
                "يعود المرضى مراراً لأن جودة الرعاية هنا تشعرهم بأنها شخصية ومهتمة حقاً.",
                f"مركز طبي موثوق في {city} اعتمد عليه المجتمع المحلي لسنوات.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يجد المرضى أن الأطباء في {name} منتبهون ومتأنون في تقييماتهم الصحية.",
                "تسير المواعيد في وقتها والطاقم الأمامي متجاوب وسهل التعامل معه.",
                f"خيار طبي عام موثوق للأسر والمقيمين في جميع أنحاء {city}.",
                "تخلق المرافق النظيفة والطاقم المهني تجربة مريحة ومطمئنة حقاً للمريض.",
                "تُعالج الإحالات ورعاية المتابعة بكفاءة، مما يجعل الرحلة الصحية بأكملها سلسة.",
            ]
        elif rating >= 3.0:
            pool = [
                f"يقدم {name} خدمات طب عام تغطي معظم الاحتياجات الصحية اليومية.",
                "الأطباء على دراية جيدة، وإن كانت أوقات الانتظار قد تطول في ساعات الذروة.",
                "عيادة مريحة وسهلة الوصول للفحوصات الروتينية والاستشارات الطبية المباشرة.",
                "يعالج الفريق الحالات الشائعة بكفاءة ويُحيل الحالات الأكثر تعقيداً بشكل مناسب.",
            ]
        else:
            pool = [
                f"يخدم {name} المجتمع المحلي بالاستشارات الطبية والرعاية الصحية العامة في {city}.",
                "تتوفر خدمات الرعاية الصحية الأساسية لكل من المرضى الحاضرين بموعد أو دون موعد.",
                f"خيار سهل الوصول وملائم للرعاية الطبية الروتينية في {city}.",
                "تتعامل العيادة مع الاحتياجات الصحية الشائعة لسكان الحي المحيط.",
            ]

    elif cat == "ophthalmology":
        if rating >= 4.5:
            pool = [
                f"يتمتع أطباء البصريات في {name} بالشمولية ويشرحون صحة العيون بمصطلحات واضحة وسهلة الفهم.",
                "مجموعة واسعة من الإطارات بأسعار عادلة، مع طاقم يساعد المرضى حقاً في إيجاد الخيار المناسب.",
                "حظيت دقة فحص العيون بثناء متسق، مع وصفات تعكس ملاحظات المرضى الفعلية.",
                "الخدمة الودية والتسليم السريع للنظارات الجديدة هما ما يجعل المرضى يعودون بانتظام.",
                "من بين أفضل مراكز البصريات في المنطقة من حيث جودة الخدمة وتنوع المنتجات.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يقدّر المرضى في {name} الوصفات الدقيقة والنصائح البصرية المفيدة حقاً.",
                "اختيار جيد من الإطارات مع طاقم يأخذ وقتاً لإيجاد خيارات تناسب كل وجه وميزانية.",
                "تُجرى فحوصات العيون بمهنية وتُشرح النتائج بوضوح بعد ذلك.",
                f"مركز بصريات موثوق وذو سمعة جيدة يخدم المجتمع في {city}.",
                "يوازن الفريق بين الكفاءة والاهتمام الشخصي، مما يجعل كل زيارة ذات قيمة حقيقية.",
            ]
        elif rating >= 3.0:
            pool = [
                f"يقدم {name} خدمات بصريات قياسية تشمل فحص العيون والنظارات الطبية.",
                "أسعار معقولة للإطارات والعدسات مع تشكيلة وظيفية لمعظم احتياجات البصر.",
                "يعالج الفريق احتياجات رعاية العيون الروتينية بشكل مناسب لغالبية الزوار.",
                "خيار عملي وسهل الوصول لاحتياجات رعاية البصر الأساسية في المنطقة المحلية.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات البصريات وطب العيون لسكان {city}.",
                "خيار محلي لمن يحتاجون إلى فحوصات بصرية ونظارات طبية.",
                "خدمات رعاية البصر الأساسية متاحة في هذا المركز البصري المرخص.",
                "يقدم الفريق دعم طب العيون الروتيني للمجتمع المحلي.",
            ]

    elif cat == "dental":
        if rating >= 4.5:
            pool = [
                f"أطباء الأسنان في {name} هادئون ومطمئنون، مما يجعل حتى المرضى المتوترين يشعرون بالراحة.",
                "الإجراءات غير المؤلمة والشرح الواضح للعلاج يميز هذه العيادة عن غيرها القريبة.",
                "أوقات انتظار قصيرة وفريق ودود حقاً يجعلان كل زيارة لطب الأسنان تجربة ممتعة.",
                "يثق المرضى بجودة العمل هنا ويعودون لجميع احتياجاتهم المستمرة لطب الأسنان.",
                "نصائح المتابعة الشاملة والدعم الموثوق بعد العلاج يحدثان فرقاً حقيقياً في النتائج.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يتسم فريق طب الأسنان في {name} بالمهنية ويقدم نتائج علاجية موثوقة باستمرار.",
                "المواعيد سهلة الحجز والعيادة تسير حسب الجدول في معظم الأوقات.",
                "يشرح أطباء الأسنان كل خطوة من خطوات الإجراء بوضوح محافظين على راحة المرضى طوال الوقت.",
                f"عيادة أسنان موثوقة للأسر والأفراد في {city} والمناطق المجاورة.",
                "المعايير السريرية الجيدة والمرافق المصانة جيداً تجعل هذا خياراً جديراً بالثقة لرعاية الأسنان.",
            ]
        elif rating >= 3.0:
            pool = [
                f"يعالج {name} احتياجات طب الأسنان الروتينية بما في ذلك الفحوصات والتنظيف والحشوات القياسية.",
                "الطاقم لطيف عموماً والعيادة مصانة وفق معايير نظافة وصحة جيدة.",
                "رعاية أسنان كافية للعلاجات المباشرة وصيانة صحة الفم الروتينية.",
                "خيار عملي ومناسب للخدمات الأساسية لطب الأسنان في المنطقة المحلية.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات طب الأسنان العامة للمرضى في {city}.",
                "خيار محلي للفحوصات الأساسية للأسنان والخلع وصيانة صحة الفم.",
                "خدمات طب الأسنان الروتينية متاحة لدعم صحة الفم للمجتمع المحلي.",
                "يتعامل الفريق مع إجراءات طب الأسنان القياسية بمهنية مع مراعاة احتياجات المريض.",
            ]

    elif cat == "pediatrics":
        if rating >= 4.5:
            pool = [
                f"يتمتع أطباء الأطفال في {name} بصبر رائع مع الأطفال من جميع الأعمار والمزاجات.",
                "يشعر الأهالي بأنهم مسموعون حقاً هنا، إذ يأخذ الأطباء مخاوفهم بجدية ويستجيبون بوضوح.",
                "غرفة الانتظار مصممة مع مراعاة الأطفال مما يساعد على تخفيف القلق قبل المواعيد.",
                "تُدار جداول التطعيم بعناية ويرسل الفريق تذكيرات مفيدة للأسر.",
                f"من أكثر عيادات الأطفال موثوقية في {city} للأسر ذات الأطفال الصغار.",
            ]
        elif rating >= 4.0:
            pool = [
                f"الأطباء في {name} على دراية واسعة ويتواصلون بوضوح واحترام مع الأهالي.",
                "تُدير العيادة الفحوصات الروتينية والتطعيمات وأمراض الطفولة الشائعة بفاعلية.",
                "الطاقم لطيف مع المرضى الصغار ويعمل على جعل كل زيارة أقل توتراً قدر الإمكان.",
                f"عيادة أطفال موثوقة ومفضلة لكثير من الأسر في {city}.",
                "رعاية المتابعة دقيقة والفريق يبقى متاحاً عندما يكون لدى الأهالي أسئلة بين الزيارات.",
            ]
        elif rating >= 3.0:
            pool = [
                f"يغطي {name} رعاية الأطفال القياسية للأطفال والرضع في المجتمع المحيط.",
                "الأطباء أكفاء والعيادة تتعامل مع الاحتياجات الصحية الروتينية للطفل بشكل مناسب لمعظم الأسر.",
                "قد تطول أوقات الانتظار أحياناً لكن جودة الرعاية الإجمالية مُرضية عموماً لمعظم الأسر.",
                "خيار عملي وسهل الوصول للآباء الذين يحتاجون إلى استشارات طب الأطفال الموثوقة قريباً.",
            ]
        else:
            pool = [
                f"يقدم {name} استشارات طب الأطفال وخدمات صحة الطفل للأسر في {city}.",
                "تتوفر خدمات صحة الطفل الأساسية بما في ذلك الفحوصات الروتينية والاستشارات العامة.",
                "خيار محلي للأسر التي تحتاج إلى رعاية طب أطفال سهلة الوصول بالقرب من المنزل.",
                "يعمل الفريق على ضمان حصول الأطفال على الاهتمام المناسب ودعم المتابعة.",
            ]

    elif cat == "physiotherapy":
        if rating >= 4.5:
            pool = [
                f"يضع المعالجون في {name} برامج تعافٍ تبدو مصممة حقاً لكل مريض على حدة.",
                "يُتتبع التقدم بعناية وتُعدَّل خطط العلاج مع تحسن حالة المريض مع مرور الوقت.",
                "يشرح الفريق كل تمرين بوضوح ويضمن فهم المرضى للغرض من كل تمرين.",
                "يُفيد كثير من المرضى بتحسن ملحوظ في الألم بعد عدد قليل فقط من الجلسات.",
                f"من خيارات العلاج الطبيعي الأكثر فاعلية المتاحة لسكان {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"المعالجون الفيزيائيون في {name} ممارسون ماهرون يأخذون إعادة تأهيل المريض بجدية.",
                "العيادة مجهزة جيداً وجلسات العلاج مركزة ومنظمة ومثمرة.",
                "المعالجون صبورون ومشجعون حقاً مما يساعد المرضى على الحفاظ على الحافز طوال التعافي.",
                f"خيار متين وذو سمعة جيدة للعلاج الطبيعي وخدمات إعادة التأهيل في {city}.",
                "يقدّر المرضى التواصل المتسق والواضح حول جدولهم الزمني للتعافي وتوقعاتهم.",
            ]
        else:
            pool = [
                f"يقدم {name} العلاج الطبيعي وإعادة تأهيل الحركة للمرضى المتعافين في {city}.",
                "يساعد المعالجون المرضى على التعامل مع الألم وتحديات الحركة خطوة بخطوة وبوتيرتهم.",
                "خيار عملي وسهل الوصول لمن يحتاجون إلى إعادة التأهيل البدني في المنطقة المحلية.",
                "جلسات العلاج مهنية ومركزة على تحسين وظيفة المريض وراحته.",
            ]

    elif cat == "labs-diagnostics":
        if rating >= 4.5:
            pool = [
                f"تصل نتائج {name} بسرعة والطاقم متاح لتوضيح أي نتائج للمرضى.",
                "المختبر نظيف ويُدار بكفاءة وجمع العينات يُعامَل بعناية وطمأنينة.",
                "أوقات الانتظار القصيرة والدقة الموثوقة يجعلان هذا خياراً مفضلاً للاختبارات التشخيصية.",
                "الطاقم مهني وهادئ مما يفيد بشكل خاص المرضى القلقين بشأن الاختبارات.",
                "مختبر منظم يتلقى باستمرار تعليقات إيجابية من الأطباء المحيلين.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يقدّر المرضى سرعة ودقة الاختبارات التشخيصية في {name}.",
                "المنشأة منظمة بكفاءة والفريق يتواصل بشأن النتائج بوضوح وسرعة.",
                f"مختبر تشخيصي موثوق يخدم المرضى والإحالات الطبية في {city}.",
                "جمع العينات مباشر والتجربة سلسة عموماً من الوصول إلى الحصول على النتائج.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات الاختبارات الطبية والتشخيص المخبري للمرضى في {city}.",
                "تُعالج الاختبارات المخبرية الروتينية بمهنية مع مشاركة النتائج في الأطر الزمنية المتوقعة.",
                "خيار مريح وسهل الوصول لاحتياجات الاختبارات التشخيصية والتحليلية القياسية.",
                "يدير الفريق جمع العينات وإعداد التقارير بعناية ودقة سريرية.",
            ]

    elif cat == "medical-equipment":
        if rating >= 4.0:
            pool = [
                f"يتمتع الفريق في {name} بمعرفة قوية بالمنتجات ويساعد العملاء على اختيار المعدات بثقة.",
                "مجموعة واسعة من المستلزمات الطبية متاحة بأسعار عادلة ودعم ما بعد البيع الموثوق.",
                f"مورد موثوق وجدير بالثقة للمعدات الطبية للعيادات والأفراد في {city}.",
                "يأخذ الطاقم وقتاً لشرح الاستخدام الصحيح للمنتج مما يقدّره المرضى ومقدمو الرعاية حقاً.",
                "خدمة التسليم والمتابعة تميز هذا المورد عن البدائل الأكثر مباشرة القريبة.",
            ]
        elif rating >= 3.0:
            pool = [
                f"يوفر {name} مجموعة عملية من المعدات الطبية والأجهزة والمستلزمات الصحية.",
                "مصدر موثوق للمستلزمات الطبية المحددة والمعدات السريرية في المنطقة المحلية.",
                "يمكن للفريق المساعدة في الاستفسارات الأساسية عن المنتجات ودعم قرارات الشراء المباشرة.",
                "توافر المخزون معقول وعملية الطلب غير معقدة عموماً.",
            ]
        else:
            pool = [
                f"يوفر {name} المعدات والمستلزمات الطبية لقطاع الرعاية الصحية في {city}.",
                "مورد محلي موثوق للأجهزة ذات المستوى السريري والمستلزمات الطبية للاستخدام المنزلي.",
                "المستلزمات والمعدات الطبية متاحة للاستخدام الصحي المهني والشخصي.",
                "تدعم المنشأة كلاً من المرضى الأفراد والمنظمات الصحية في احتياجاتهم من المستلزمات.",
            ]

    elif cat == "alternative-medicine":
        if rating >= 4.5:
            pool = [
                f"يمتلك المختصون في {name} معرفة عميقة ويتبنون نهجاً شاملاً حقيقياً في رعاية المرضى.",
                "يُفيد المرضى بتحسينات حقيقية في الصحة ومستويات الطاقة بعد جلسات منتظمة هنا.",
                "يشعر المركز بالهدوء والترحيب مما يسهل الاسترخاء والتفاعل الكامل مع العلاج.",
                "يستمع المختصون باهتمام ويصممون كل جلسة بتأنٍ وفقاً للأهداف الصحية الفردية.",
                f"مركز طب بديل ذو سمعة جيدة بين السكان المهتمين بالصحة في {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"المعالجون في {name} ماهرون ويخلقون بيئة علاجية هادئة ومركزة.",
                "يستمتع المرضى بالاهتمام الشخصي والنهج المدروس في العلاجات التقليدية.",
                f"خيار ذو سمعة جيدة لمن يبحثون عن الرعاية بالطب التكميلي والبديل في {city}.",
                "المختصون متدربون بشكل احترافي ومتحمسون بوضوح لأساليبهم العلاجية.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات العلاج التقليدي والتكميلي للمرضى في {city}.",
                "يقدم المختصون علاجات الطب البديل في بيئة نظيفة ومهنية.",
                "خيار محلي وسهل الوصول لمن يهتمون بالحجامة والوخز بالإبر والعلاجات الصحية بالأعشاب.",
                "يعالج المركز احتياجات العافية من خلال ممارسات الطب التقليدي المستندة إلى الأدلة.",
            ]

    elif cat == "hospitals":
        if rating >= 4.5:
            pool = [
                f"الفريق الطبي في {name} متجاوب للغاية ويجعل المرضى يشعرون بالاهتمام طوال الوقت.",
                "طاقم التمريض منتبه وفاعل ويتفقد المرضى بانتظام دون الحاجة لطلب ذلك.",
                "من الدخول إلى الخروج العملية سلسة ومنسقة وتُبلَّغ بوضوح.",
                "يأخذ المتخصصون وقتاً لشرح التشخيصات ويشركون المرضى فاعلياً في قرارات رعايتهم.",
                f"من خيارات المستشفيات الأكثر موثوقية للمجتمع في {city}.",
            ]
        elif rating >= 4.0:
            pool = [
                f"المرضى في {name} راضون عموماً عن المستوى الإجمالي للرعاية الطبية المقدمة.",
                "يدير المستشفى الحالات العاجلة بكفاءة ويبقى الطاقم هادئاً وفعّالاً تحت الضغط.",
                f"مستشفى جدير بالثقة لسكان {city} الذين يحتاجون إلى رعاية متخصصة داخلية أو خارجية.",
                "يعني التنسيق متعدد التخصصات ندرة اضطرار المرضى لتكرار تاريخهم المرضي لكل قسم.",
            ]
        else:
            pool = [
                f"يقدم {name} الرعاية للمرضى الداخليين والخارجيين في {city} والمجتمعات المجاورة.",
                "يقدم المستشفى مجموعة من الخدمات الطبية المتخصصة والعامة للسكان المحليين.",
                "رعاية المستشفى سهلة الوصول للمقيمين في المنطقة المحيطة وما هو أبعد من ذلك.",
                "يعمل الفريق عبر الأقسام لتقديم رعاية متسقة للمرضى في جميع مراحل العلاج.",
            ]

    else:
        if rating >= 4.5:
            pool = [
                f"يُشيد المرضى في {name} باستمرار بجودة الرعاية الاهتمامية والمهنية التي يتلقونها.",
                "الفريق شامل وتواصلي ومهتم بوضوح بصحة كل مريض.",
                f"مزود رعاية صحية ذو سمعة ممتازة في {city} مع سمعة جيدة مكتسبة للجودة.",
                "من تسجيل الوصول إلى المغادرة التجربة هنا سلسة ومطمئنة ومحترمة.",
                "يأخذ الطاقم وقتاً للاستماع والاستجابة بتأنٍ مما يجعل المرضى يشعرون بتقدير حقيقي.",
            ]
        elif rating >= 4.0:
            pool = [
                f"يقدّر زوار {name} جودة الرعاية والمهنية التي يُظهرها الفريق.",
                f"خيار ذو سمعة جيدة لخدمات الرعاية الصحية في {city} مع تعليقات إيجابية من المرضى.",
                "الطاقم متعاون والمنشأة نظيفة ومصانة جيداً في جميع الأوقات.",
                "يجد المرضى عملية الحجز سلسة والاستشارات شاملة ومفيدة.",
            ]
        else:
            pool = [
                f"يقدم {name} خدمات الرعاية الصحية للمجتمع المحلي في {city} وفق التراخيص الإماراتية.",
                f"خيار مريح وسهل الوصول للمرضى الذين يحتاجون إلى عناية طبية في {city}.",
                "يقدم الفريق رعاية مهنية للحي المحيط والمجتمعات المجاورة.",
                f"مرخص من قِبَل {regulator}، تستوفي هذه {facility_label_ar} المعايير الإماراتية لسلامة المريض والجودة.",
            ]

    return pool[:5]


def main():
    with open(INPUT_PATH, encoding="utf-8") as f:
        data = json.load(f)

    chunk = data[7000:8000]
    print(f"Processing {len(chunk)} providers (indices 7000-7999)")

    result = {}

    for i, provider in enumerate(chunk):
        idx = 7000 + i
        desc_ar = translate_description(provider)
        review_summary_ar = translate_review_summary(provider)

        result[str(idx)] = {
            "descriptionAr": desc_ar,
            "reviewSummaryAr": review_summary_ar,
        }

        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/1000...")

    import os
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nDone. Wrote {len(result)} entries to {OUTPUT_PATH}")

    # Spot check
    for spot_idx in [7000, 7100, 7250, 7500, 7750, 7999]:
        key = str(spot_idx)
        if key in result:
            p = chunk[spot_idx - 7000]
            desc_ar = result[key]["descriptionAr"]
            reviews_ar = result[key]["reviewSummaryAr"]
            print(f"\n=== Index {spot_idx}: {p['name']} ({p.get('categorySlug')}, {p.get('citySlug')}) ===")
            print(f"DESC_AR: {desc_ar[:200]}...")
            print(f"REVIEWS_AR ({len(reviews_ar)}):")
            for r in reviews_ar[:2]:
                print(f"  {r}")

if __name__ == "__main__":
    main()
