/**
 * Hand-written city × specialty hub-page editorial intros.
 *
 * Part of Item 4 (Fat hub pages) of the Zocdoc→Zavis roadmap. These are
 * bilingual (EN/AR), UAE-specific, ~200-word paragraphs for the top 50
 * combos (≈ 10 specialties × 5 cities). Combos not covered here fall
 * back to a templated ~120-word intro assembled by `getHubEditorial()`.
 *
 * Discipline:
 *   - Copy must be UAE-grounded (regulator, mandatory insurance, real
 *     neighbourhoods, real payer mix). No generic boilerplate.
 *   - Never invents facility names, doctor names, or Arabic-speaking
 *     claims that we cannot verify. Attributions stay abstract.
 *   - Counts/stats use placeholders like `{providerCount}` which the
 *     resolver substitutes at render time — single source of truth for
 *     the templated fallback too.
 *
 * Substitution tokens (the resolver replaces these in both hand-written
 * and templated copy):
 *   {city}             Dubai
 *   {cityAr}           دبي
 *   {specialty}        Dental Clinics
 *   {specialtyAr}      عيادات الأسنان
 *   {specialtyLower}   dental clinics
 *   {providerCount}    412
 *   {regulator}        Dubai Health Authority (DHA)
 *   {regulatorAr}      هيئة الصحة بدبي (DHA)
 *   {year}             2026
 */

export interface HubEditorialEntry {
  citySlug: string;
  categorySlug: string;
  en: string;
  ar: string;
}

/**
 * Priority combos with hand-crafted copy. Ordering is irrelevant — lookup is
 * by `${citySlug}:${categorySlug}`. Add new combos to the bottom.
 */
export const HUB_EDITORIAL: HubEditorialEntry[] = [
  // ─── DUBAI ────────────────────────────────────────────────────────────
  {
    citySlug: "dubai",
    categorySlug: "dental",
    en: `Dubai's dental market is one of the most competitive in the GCC, with {providerCount} licensed dental clinics and polyclinics operating across Al Barsha, Jumeirah, Downtown, Dubai Marina, Business Bay and Dubai Healthcare City. Every clinic on this page is licensed by the {regulator}, which enforces infection-control, X-ray and clinician-credentialing standards that rank among the strictest in the region. Dubai mandates health insurance for all residents under the DHA Essential Benefits Plan, and most private clinics accept Daman, AXA, Cigna, Bupa and several third-party administrators — though dental coverage varies sharply between plans, so always confirm your annual cap and co-insurance before booking. Common reasons Dubai residents search for a dental clinic include routine cleanings, crowns and veneers, orthodontics (both traditional braces and Invisalign), implants, pediatric dentistry, and emergency care for pain or broken teeth. Because Dubai's dental workforce includes practitioners trained in the UK, US, Germany, Jordan, Egypt, India and the Philippines, waiting times are short and multilingual support is widely available. Compare the clinics below by rating, neighbourhood, insurance network and accepted services to find one that matches your coverage and schedule.`,
    ar: `يُعدّ سوق طب الأسنان في دبي من أكثر الأسواق تنافسية في دول الخليج، حيث تعمل {providerCount} عيادة أسنان مرخّصة في البرشاء وجميرا ووسط المدينة ودبي مارينا والخليج التجاري ومدينة دبي الطبية. جميع العيادات المدرجة هنا مرخّصة من {regulatorAr}، التي تفرض معايير صارمة لمكافحة العدوى والتصوير الإشعاعي واعتماد الأطباء. تُلزم دبي جميع المقيمين بالتأمين الصحي وفق خطة المنافع الأساسية، وتقبل أغلب العيادات تأمين ضمان، إيه إكس إيه، سيجنا، بوبا، وعدداً من مديري الطرف الثالث — غير أن تغطية الأسنان تتفاوت بشكل كبير بين الخطط، لذا تأكّد من الحد السنوي ونسبة المشاركة قبل الحجز. تشمل الأسباب الشائعة للزيارة تنظيف الأسنان، التيجان، تقويم الأسنان، الزرعات، طب أسنان الأطفال، وحالات الطوارئ. لمقارنة العيادات، استخدم التقييم والحي والشبكة التأمينية والخدمات المقبولة.`,
  },
  {
    citySlug: "dubai",
    categorySlug: "hospitals",
    en: `Dubai's hospital network spans {providerCount} general, specialty and day-surgery facilities regulated by the {regulator}. The public backbone is anchored by Dubai Health's Rashid, Latifa, Hatta and Dubai hospitals, while the private sector includes internationally accredited groups and standalone facilities across Al Garhoud, Oud Metha, Jumeirah, Dubai Investment Park and Dubai Healthcare City. Because Dubai mandates insurance for all residents, most hospitals participate in Daman, AXA, Cigna, Bupa and international payer networks — coverage for high-acuity procedures (cardiac, oncology, neurosurgery, IVF) is typically tied to upgraded plan tiers, so check pre-authorisation requirements before scheduling elective care. Wait times for emergency departments at major private hospitals are generally 15–45 minutes for triaged non-critical cases, and Dubai's 999 emergency ambulance service integrates directly with DHA trauma centers. For patients traveling to Dubai for medical treatment, several hospitals run dedicated international patient offices that coordinate visas, interpreters and airport pickup. Compare the facilities below by JCI accreditation, insurance network, operating specialties and neighbourhood proximity.`,
    ar: `تضم شبكة مستشفيات دبي {providerCount} مستشفى عاماً ومتخصصاً ومركز جراحة اليوم الواحد، مرخّصة من {regulatorAr}. العمود الفقري للقطاع الحكومي يرتكز على مستشفيات راشد واللطيفة وحتا ودبي التابعة لدبي الصحية، فيما يضم القطاع الخاص مجموعات حاصلة على الاعتماد الدولي ومرافق مستقلة في القرهود وعود ميثا وجميرا ومجمع دبي للاستثمار ومدينة دبي الطبية. بحكم إلزامية التأمين في دبي، تشارك معظم المستشفيات في شبكات ضمان وإيه إكس إيه وسيجنا وبوبا وشبكات دولية — وتتطلّب الإجراءات المعقّدة (القلب، الأورام، جراحة الأعصاب، أطفال الأنابيب) موافقة مسبقة، لذا تحقّق من شروطها قبل الحجز. تبلغ أوقات الانتظار في الطوارئ للحالات غير الحرجة عادةً 15–45 دقيقة. قارن المرافق أدناه حسب الاعتماد والشبكة التأمينية والتخصصات والموقع.`,
  },
  {
    citySlug: "dubai",
    categorySlug: "clinics",
    en: `Dubai's outpatient clinic network includes {providerCount} multi-specialty polyclinics, walk-in centers, family medicine practices and single-doctor consultations, all licensed by the {regulator}. Clinics are concentrated in high-density residential districts — Al Nahda, International City, JLT, Business Bay, Al Quoz, Dubai Marina, Jumeirah Village Circle and Mirdif — so most residents have a GP within 10–15 minutes of home. Because Dubai mandates health insurance under the DHA Essential Benefits Plan, nearly every clinic accepts at least one major payer; the most commonly accepted networks are Daman, AXA, Cigna, Bupa, MetLife and several third-party administrators (NAS, Nextcare, Mednet, Neuron). Co-pays for GP consultations typically sit between AED 0 and AED 100 depending on plan tier, with specialist referrals routed in-network. Many clinics offer home visits, tele-consultations, and short-notice appointments — useful for busy working residents who need same-day care. Compare the clinics below by insurance network, operating hours, neighborhood and accepted languages to find one that fits your plan.`,
    ar: `تضم شبكة العيادات في دبي {providerCount} عيادة متعدّدة التخصصات ومراكز للحضور المباشر وعيادات طب الأسرة واستشارات فردية، مرخّصة من {regulatorAr}. تتركز العيادات في الأحياء السكنية الكثيفة مثل النهدة، المدينة الدولية، أبراج بحيرات جميرا، الخليج التجاري، القوز، دبي مارينا، قرية جميرا الدائرية ومردف، بحيث لا يبعد طبيب الأسرة أكثر من 10–15 دقيقة عن معظم السكان. وبما أن دبي تُلزم جميع المقيمين بالتأمين الصحي، تقبل جميع العيادات تقريباً شبكة تأمين رئيسية واحدة على الأقل، من بينها ضمان وإيه إكس إيه وسيجنا وبوبا وميت لايف وعدد من مديري الطرف الثالث. يتراوح المبلغ التعاوني لاستشارات الطبيب العام عادةً بين 0 و100 درهم. قارن العيادات أدناه حسب الشبكة التأمينية وساعات العمل والحي واللغات المتاحة.`,
  },
  {
    citySlug: "dubai",
    categorySlug: "dermatology",
    en: `Dubai's dermatology market runs from entry-level cosmetic clinics to consultant-led medical dermatology practices in Jumeirah, Al Wasl, Downtown and Dubai Healthcare City. There are {providerCount} {specialtyLower} licensed by the {regulator}, offering treatments for acne, pigmentation, eczema, psoriasis, hair loss, and elective cosmetic procedures (laser resurfacing, injectables, chemical peels). Because Dubai has one of the highest per-capita elective aesthetic markets in the region, it's worth distinguishing between a DHA-licensed specialist dermatologist, a general practitioner operating a cosmetic clinic, and a medical spa — only the first category is cleared for complex medical conditions and prescription treatments. Most clinics accept major private insurance plans for medical dermatology (acne, infections, skin cancer screening); cosmetic procedures are almost always out-of-pocket. Expect consultation fees in the AED 350–700 range at private clinics. Compare the dermatologists below by rating, neighbourhood, insurance network and accepted services.`,
    ar: `يتنوّع سوق الأمراض الجلدية في دبي من العيادات التجميلية إلى الممارسات الطبية الاستشارية في جميرا والوصل ووسط المدينة ومدينة دبي الطبية. تضم المدينة {providerCount} عيادة متخصّصة بالأمراض الجلدية مرخّصة من {regulatorAr}، تقدم علاجات حب الشباب والتصبّغات والإكزيما والصدفية وتساقط الشعر والإجراءات التجميلية الاختيارية. من المهم التمييز بين طبيب الجلدية الاستشاري المرخّص من الهيئة وممارس عام يدير عيادة تجميلية والسبا الطبي. تقبل معظم العيادات تأمين الأمراض الجلدية الطبية، بينما تُدفع الإجراءات التجميلية عادة من المريض مباشرة. تتراوح رسوم الاستشارة بين 350–700 درهم.`,
  },
  {
    citySlug: "dubai",
    categorySlug: "pediatrics",
    en: `Dubai's pediatric network includes {providerCount} clinics, hospitals and specialty centers licensed by the {regulator} for child healthcare — from routine well-baby checks and vaccinations to complex pediatric surgery and neonatal intensive care. Leading pediatric departments operate inside major private hospitals in Oud Metha, Jumeirah and Dubai Healthcare City, alongside dedicated children's clinics in residential neighbourhoods. Because Dubai mandates health insurance for residents, pediatric consultations, vaccinations on the national schedule, and emergency care are typically covered by standard DHA-compliant plans — newborn cover is generally automatic for 30 days from birth before needing a dependent add-on. Expect consultation fees at private clinics in the AED 300–600 range. Many pediatricians in Dubai trained abroad (UK, US, Germany, India, Arab region), and most offer multilingual consultations. Compare the providers below by rating, neighbourhood, accepted insurance networks and sub-specialty availability (allergy, pulmonology, endocrinology, cardiology).`,
    ar: `تضم شبكة طب الأطفال في دبي {providerCount} عيادة ومستشفى ومركزاً متخصّصاً مرخّصاً من {regulatorAr} لخدمات صحة الطفل — من فحوصات الرضع الروتينية والتطعيمات إلى جراحة الأطفال المعقّدة والعناية المركّزة لحديثي الولادة. تعمل أقسام طب الأطفال الرائدة ضمن المستشفيات الخاصة الكبرى في عود ميثا وجميرا ومدينة دبي الطبية، إلى جانب عيادات الأطفال في الأحياء السكنية. تشمل الخطط التأمينية الأساسية استشارات الأطفال والتطعيمات الوطنية وحالات الطوارئ. تتراوح رسوم الاستشارة بين 300 و600 درهم. قارن مقدمي الخدمة حسب التقييم والموقع وشبكة التأمين والتخصصات الفرعية.`,
  },

  // ─── ABU DHABI ────────────────────────────────────────────────────────
  {
    citySlug: "abu-dhabi",
    categorySlug: "hospitals",
    en: `Abu Dhabi's hospital network includes {providerCount} facilities regulated by the {regulator}, anchored by Sheikh Shakhbout Medical City, Sheikh Khalifa Medical City, Cleveland Clinic Abu Dhabi and Mafraq (SEHA's integrated public system), plus leading private operators including NMC, Burjeel and HealthPlus in Al Reem, Khalifa City, Al Muroor and the Corniche district. The emirate mandates health insurance for all residents via the Department of Health's Thiqa (UAE nationals) and Basic/Enhanced plans (expatriates), so nearly every hospital participates in at least the Daman/Thiqa network. Cleveland Clinic Abu Dhabi's specialties (cardiology, neurosurgery, oncology) remain internationally recognised. For emergency care, Abu Dhabi Ambulance integrates directly with SEHA trauma centers, and private hospitals typically run 24/7 EDs. Elective procedures — cardiac surgery, orthopedics, IVF, oncology — generally require pre-authorisation from your payer. Compare the hospitals below by accreditation, insurance network, specialty departments and location.`,
    ar: `تشمل شبكة مستشفيات أبوظبي {providerCount} منشأة مرخّصة من {regulatorAr}، مع ركائز القطاع العام لدى صحة (مدينة الشيخ شخبوط الطبية، مدينة الشيخ خليفة الطبية، كليفلاند كلينك أبوظبي، المفرق)، إلى جانب كبار مشغّلي القطاع الخاص كمجموعات NMC وبرجيل وهيلث بلس في جزيرة الريم ومدينة خليفة والمرور والكورنيش. تُلزم الإمارة جميع السكان بالتأمين الصحي عبر خطة ثقة لمواطني الدولة وخطط أساسية ومحسّنة للوافدين، وتشارك أغلب المستشفيات في شبكة ضمان/ثقة. تشتهر تخصصات كليفلاند كلينك أبوظبي في القلب وجراحة الأعصاب والأورام. قارن المرافق حسب الاعتماد والشبكة التأمينية والتخصصات والموقع.`,
  },
  {
    citySlug: "abu-dhabi",
    categorySlug: "dental",
    en: `Abu Dhabi hosts {providerCount} licensed dental clinics and polyclinics across Khalidiya, Al Mushrif, Al Reem, Khalifa City and Mussafah, regulated by the {regulator}. For UAE nationals, Thiqa (administered by Daman) provides the most comprehensive dental cover in the emirate, extending to routine exams, cleanings, fillings, extractions, pediatric dental care and selected prosthetics at participating providers. Expatriates on Basic insurance plans have narrower dental benefits — typically emergency-only — while Enhanced plans often cover routine preventive care with co-pays. Common services at Abu Dhabi dental clinics include scaling and polishing, composite fillings, root canal treatment, orthodontics (Invisalign and clear aligners are increasingly popular), dental implants, and cosmetic veneers. Many clinics now publish transparent price lists for self-paying expats. Compare the clinics below by rating, accepted insurance networks (particularly Thiqa eligibility) and neighbourhood.`,
    ar: `تضم أبوظبي {providerCount} عيادة أسنان مرخّصة في الخالدية والمشرف والريم ومدينة خليفة ومصفح، تخضع لإشراف {regulatorAr}. توفر خطة ثقة لمواطني الدولة — تديرها ضمان — أشمل تغطية لطب الأسنان في الإمارة، تمتد إلى الفحوصات والتنظيف والحشوات وقلع الأسنان وطب أسنان الأطفال. أما الوافدون على الخطط الأساسية فتكون تغطية الأسنان لديهم محدودة في الطوارئ، بينما تشمل الخطط المحسّنة الرعاية الوقائية الروتينية. تشمل الخدمات الشائعة التنظيف والحشوات وعلاج الجذور وتقويم الأسنان والزرعات والقشور التجميلية. قارن العيادات حسب شبكة التأمين المقبولة (خصوصاً ثقة) والموقع.`,
  },
  {
    citySlug: "abu-dhabi",
    categorySlug: "clinics",
    en: `Abu Dhabi's {providerCount} licensed outpatient clinics cover family medicine, multi-specialty care, and walk-in urgent consultations — all regulated by the {regulator}. The emirate's primary-care backbone combines SEHA's Ambulatory Healthcare Services (Al Ain and Abu Dhabi networks) with a growing private sector anchored by Burjeel, NMC, LLH, Mediclinic and HealthPlus. Because the Department of Health mandates health insurance for all Abu Dhabi residents, consultations at most clinics are covered in-network — UAE nationals through Thiqa (administered by Daman) and expatriates through Basic or Enhanced plans. Co-pays typically range from AED 0 (Thiqa primary-care visits) to AED 50–100 at private clinics. Many residents prefer private clinics for shorter wait times and a wider choice of English-speaking physicians. Compare the clinics below by rating, insurance network, operating hours and neighborhood.`,
    ar: `تضم أبوظبي {providerCount} عيادة خارجية مرخّصة تشمل طب الأسرة والتخصصات المتعدّدة والاستشارات العاجلة، وكلها تخضع لإشراف {regulatorAr}. يعتمد القطاع على خدمات الرعاية الأولية لدى صحة (شبكتا أبوظبي والعين)، إلى جانب شبكة خاصة متنامية تشمل برجيل وNMC وLLH وميديكلينيك وهيلث بلس. بحكم إلزامية التأمين، تُغطّى الاستشارات داخل الشبكة — المواطنون عبر ثقة (بإدارة ضمان)، والوافدون عبر الخطط الأساسية أو المحسّنة. تتراوح المبالغ التعاونية بين 0 درهم لزيارات ثقة الأولية و50–100 درهم في العيادات الخاصة. قارن العيادات حسب التقييم والشبكة التأمينية والموقع.`,
  },
  {
    citySlug: "abu-dhabi",
    categorySlug: "cardiology",
    en: `Abu Dhabi is home to some of the region's most advanced cardiology programs, anchored by Cleveland Clinic Abu Dhabi's Heart & Vascular Institute and supplemented by {providerCount} additional cardiology providers licensed by the {regulator}. Services range from preventive cardiology and echocardiography to interventional procedures (angiography, PCI, pacemaker implantation) and open-heart surgery. For UAE nationals, Thiqa generally covers cardiac consultations, diagnostics and most procedures at participating facilities; expatriates on Enhanced private insurance plans typically have broad cardiac cover as well, though pre-authorisation for high-cost interventions is the norm. Consultation fees at private cardiology practices in Abu Dhabi sit around AED 450–900. Beyond symptomatic care, many clinics now offer executive health programs and preventive cardiology work-ups for adults over 40. Compare the providers below by rating, accredited status, insurance network and specialty sub-focus.`,
    ar: `تضم أبوظبي بعض أكثر برامج القلب تقدّماً في المنطقة، بقيادة معهد القلب والأوعية الدموية في كليفلاند كلينك أبوظبي، إضافة إلى {providerCount} مقدّم خدمة مرخّص من {regulatorAr}. تتراوح الخدمات بين طب القلب الوقائي وتخطيط صدى القلب إلى الإجراءات التداخلية (القسطرة، التوسّع، زرع منظّم ضربات القلب) وجراحة القلب المفتوح. تغطي خطة ثقة لمواطني الدولة الاستشارات والفحوص وأغلب الإجراءات في المرافق المشاركة، بينما تحظى الخطط المحسّنة للوافدين بتغطية واسعة عادةً مع اشتراط الموافقة المسبقة للإجراءات المكلفة. تبلغ رسوم الاستشارة 450–900 درهم. قارن المرافق حسب الاعتماد والشبكة التأمينية والتخصص الفرعي.`,
  },

  // ─── SHARJAH ──────────────────────────────────────────────────────────
  {
    citySlug: "sharjah",
    categorySlug: "hospitals",
    en: `Sharjah's hospital network is regulated at federal level by the {regulator} and consists of {providerCount} public and private facilities — including Al Qassimi, Al Kuwait and Kuwaiti hospitals in the public sector, and Zulekha, NMC Royal, Burjeel, and University Hospital Sharjah in the private sector. Sharjah does not currently mandate universal private insurance the way Dubai and Abu Dhabi do, but many employers provide group cover through Daman, Sukoon, Oman Insurance, AXA and Takaful Emarat. This means self-paying patients are more common in Sharjah than in Dubai, and most private hospitals publish transparent price lists. Emergency services at public hospitals are free for UAE nationals and residents in life-threatening situations. The University Hospital Sharjah, affiliated with the University of Sharjah College of Medicine, offers a teaching-hospital model with access to sub-specialty consultants. Compare the hospitals below by specialty department, insurance network, neighbourhood and operating hours.`,
    ar: `تخضع شبكة مستشفيات الشارقة لإشراف {regulatorAr} على المستوى الاتحادي، وتضم {providerCount} منشأة عامة وخاصة — تشمل مستشفيات القاسمي والكويت الحكومية ومستشفيات زليخة، NMC رويال، برجيل، ومستشفى الجامعة في الشارقة ضمن القطاع الخاص. لا تفرض الشارقة حتى الآن التأمين الصحي الإلزامي كما في دبي وأبوظبي، إلا أن كثيراً من أصحاب العمل يوفّرون تغطية جماعية عبر ضمان، سكون، الاتحاد، إيه إكس إيه، وتكافل الإمارات. تنشر معظم المستشفيات الخاصة قوائم أسعار شفافة. تتوفر خدمات الطوارئ في المستشفيات الحكومية مجاناً في الحالات المهدّدة للحياة. يقدم مستشفى جامعة الشارقة نموذج المستشفى التعليمي. قارن المستشفيات حسب الأقسام والشبكة التأمينية والموقع.`,
  },
  {
    citySlug: "sharjah",
    categorySlug: "dental",
    en: `Sharjah hosts {providerCount} licensed dental clinics regulated by the {regulator}, spread across Al Majaz, Al Qasba, Al Nahda, Al Taawun, Al Qasimia and University City. Dental services in the emirate cover the full range — general dentistry, orthodontics, cosmetic work, implants, pediatric dentistry and oral surgery — with price points generally 10–20% lower than equivalent Dubai clinics. Because Sharjah doesn't currently mandate private health insurance, many clinics cater to self-paying patients alongside those on employer-sponsored plans from Daman, Sukoon, Takaful Emarat and other major payers. For residents commuting to Dubai or Ajman, Sharjah dental clinics are frequently chosen for value on larger cases like implants and full-mouth restoration. Compare the clinics below by rating, accepted insurance, services offered and neighbourhood.`,
    ar: `تضم الشارقة {providerCount} عيادة أسنان مرخّصة تخضع لإشراف {regulatorAr}، موزّعة على المجاز والقصباء والنهدة والتعاون والقاسمية والمدينة الجامعية. تغطي خدمات الأسنان في الإمارة جميع التخصصات — الأسنان العامة، تقويم الأسنان، التجميلي، الزرعات، طب أسنان الأطفال وجراحة الفم — بأسعار أقل عادة بنسبة 10–20% من عيادات دبي. وبما أن الشارقة لا تفرض التأمين الصحي الإلزامي حتى الآن، تستقبل كثير من العيادات مرضى يدفعون مباشرة إلى جانب من لديهم خطط جماعية من ضمان وسكون وتكافل الإمارات. قارن العيادات حسب التقييم والشبكة التأمينية والخدمات والموقع.`,
  },

  // ─── AL AIN ───────────────────────────────────────────────────────────
  {
    citySlug: "al-ain",
    categorySlug: "hospitals",
    en: `Al Ain's hospital network is regulated by the {regulator} and includes {providerCount} public and private facilities — anchored by Tawam Hospital (a leading oncology referral center affiliated with Johns Hopkins) and Al Ain Hospital in the public sector, both operated by SEHA, alongside Oasis Hospital (a historic non-profit), NMC Specialty Hospital Al Ain and other private operators. Because Al Ain is part of Abu Dhabi emirate, the Department of Health's mandatory insurance rules apply here: UAE nationals are covered by Thiqa (administered by Daman), and expatriates must hold Basic or Enhanced plans. Tawam's oncology service is one of two federally designated cancer referral centers in the UAE, so patients from across the country travel to Al Ain for diagnosis, chemotherapy, radiation therapy and follow-up. Compare the hospitals below by specialty, insurance acceptance and location.`,
    ar: `تضم شبكة مستشفيات العين {providerCount} منشأة عامة وخاصة تحت إشراف {regulatorAr}، يتصدرها مستشفى توام (مركز إحالة رائد للأورام بالتعاون مع جونز هوبكنز) ومستشفى العين الحكوميين التابعين لصحة، إلى جانب مستشفى الواحة (غير ربحي تاريخي)، ومستشفى NMC التخصصي العين ومشغّلين آخرين. بما أن العين جزء من إمارة أبوظبي، تسري عليها قواعد التأمين الإلزامية لدائرة الصحة: يغطي المواطنين برنامج ثقة، فيما يحمل الوافدون الخطط الأساسية أو المحسّنة. يعدّ قسم الأورام في توام من مركزين اتحاديين معتمدين لعلاج السرطان. قارن المستشفيات حسب التخصص والشبكة التأمينية والموقع.`,
  },
  {
    citySlug: "al-ain",
    categorySlug: "dental",
    en: `Al Ain hosts {providerCount} licensed dental clinics and polyclinics regulated by the {regulator}, concentrated in Al Jimi, Al Muwaiji, Al Towayya and the town center. Thiqa (for UAE nationals) generally covers routine cleanings, exams, fillings and selected prosthetics at participating Al Ain providers; expatriates on Daman Enhanced or comparable plans usually have basic preventive dental cover. Al Ain's dental workforce skews toward family-practice models — many clinics handle everything from pediatric dentistry to orthodontics and implants under one roof. Waiting times tend to be shorter than in Abu Dhabi city proper, and value-conscious patients often travel from Abu Dhabi or Dubai for complex cases. Compare the clinics below by rating, accepted insurance, services offered and location.`,
    ar: `تضم العين {providerCount} عيادة أسنان مرخّصة تحت إشراف {regulatorAr}، تتركز في الجيمي والمويجعي والطوية ووسط المدينة. تغطي خطة ثقة للمواطنين التنظيف والفحوصات والحشوات وبعض التركيبات في العيادات المشاركة، فيما يتمتع الوافدون على خطط ضمان المحسّنة أو ما يعادلها بتغطية وقائية أساسية. تميل كثير من العيادات إلى نموذج الممارسة العائلية — بين طب الأطفال وتقويم الأسنان والزرعات تحت سقف واحد. قارن العيادات حسب التقييم والشبكة التأمينية والخدمات والموقع.`,
  },

  // ─── AJMAN ────────────────────────────────────────────────────────────
  {
    citySlug: "ajman",
    categorySlug: "hospitals",
    en: `Ajman's hospital network is regulated by the {regulator} and includes {providerCount} facilities — anchored by Sheikh Khalifa General Hospital (public) and leading private operators including Thumbay Hospital, GMC Hospital and Amina Hospital. Ajman's proximity to Sharjah and the Northern Emirates makes it a practical referral destination for Ras Al Khaimah, Umm Al Quwain and Fujairah residents — particularly Thumbay, which runs an academic model through Gulf Medical University. Because Ajman does not currently mandate private health insurance, many patients pay out-of-pocket or through employer group plans. Most private hospitals publish transparent cash price lists for common procedures. Compare the hospitals below by specialty, insurance acceptance and location.`,
    ar: `تضم شبكة مستشفيات عجمان {providerCount} منشأة تحت إشراف {regulatorAr}، يتصدرها مستشفى الشيخ خليفة العام الحكومي، إلى جانب مشغّلين خاصين كمستشفى ثومبي ومستشفى GMC ومستشفى أمينة. يجعل قرب عجمان من الشارقة والإمارات الشمالية منها وجهة إحالة عملية لسكان رأس الخيمة وأم القيوين والفجيرة — خصوصاً ثومبي الذي يعتمد نموذجاً أكاديمياً عبر جامعة الخليج الطبية. لا تفرض عجمان التأمين الإلزامي بعد، ويدفع كثير من المرضى من جيبهم أو عبر خطط أصحاب العمل. قارن المستشفيات حسب التخصص والتأمين والموقع.`,
  },
];

const HUB_EDITORIAL_BY_KEY: Record<string, HubEditorialEntry> = (() => {
  const m: Record<string, HubEditorialEntry> = {};
  for (const e of HUB_EDITORIAL) m[`${e.citySlug}:${e.categorySlug}`] = e;
  return m;
})();

export interface HubEditorialVars {
  city: string;
  cityAr?: string;
  specialty: string;
  specialtyAr?: string;
  specialtyLower: string;
  providerCount: number;
  regulator: string;
  regulatorAr?: string;
  year?: number;
}

function interpolate(str: string, vars: HubEditorialVars): string {
  return str
    .replaceAll("{city}", vars.city)
    .replaceAll("{cityAr}", vars.cityAr ?? vars.city)
    .replaceAll("{specialty}", vars.specialty)
    .replaceAll("{specialtyAr}", vars.specialtyAr ?? vars.specialty)
    .replaceAll("{specialtyLower}", vars.specialtyLower)
    .replaceAll("{providerCount}", String(vars.providerCount))
    .replaceAll("{regulator}", vars.regulator)
    .replaceAll("{regulatorAr}", vars.regulatorAr ?? vars.regulator)
    .replaceAll("{year}", String(vars.year ?? new Date().getFullYear()));
}

/**
 * Template fallback (~120 words) when a city × specialty combo has no
 * hand-written entry. Returns the rendered EN + AR copy.
 */
function fallbackTemplate(vars: HubEditorialVars): { en: string; ar: string } {
  const en = `${vars.city} is home to ${vars.providerCount} licensed ${vars.specialtyLower} regulated by the ${vars.regulator}. Whether you are searching for routine care, a second opinion, or a specialist referral, the providers on this page are filterable by rating, accepted insurance, neighbourhood and operating hours. Many ${vars.specialtyLower} in ${vars.city} accept major UAE health insurance plans — including the payers you are most likely to hold through your employer — although coverage for elective procedures, co-pays and annual caps vary meaningfully between plan tiers. Most private ${vars.specialtyLower} in ${vars.city} publish cash-rate pricing alongside their insurance networks, and multilingual consultations are widely available. Compare the providers below to find the one that best matches your insurance, schedule and clinical need.`;
  const ar = `تضم ${vars.cityAr ?? vars.city} ${vars.providerCount} ${vars.specialtyAr ?? vars.specialtyLower} مرخّصة تخضع لإشراف ${vars.regulatorAr ?? vars.regulator}. سواء كنت تبحث عن رعاية اعتيادية أو رأي ثانٍ أو إحالة تخصصية، يمكنك تصفية المقدمين في هذه الصفحة حسب التقييم وشبكة التأمين والحي وساعات العمل. تقبل معظم المرافق خطط التأمين الصحي الكبرى في الإمارات، وإن كانت التغطية والمساهمات السنوية تختلف بين الخطط. كذلك تنشر أغلب المرافق الخاصة أسعارها النقدية إلى جانب شبكات التأمين، وتتوفر الاستشارات بعدة لغات على نطاق واسع. قارن الخيارات أدناه لاختيار الأنسب.`;
  return { en, ar };
}

/**
 * Resolve hub-editorial copy for a city × category combo. Returns
 * hand-written copy when available, else the templated fallback. Both
 * branches pass through variable substitution.
 */
export function getHubEditorial(
  citySlug: string,
  categorySlug: string,
  vars: HubEditorialVars
): { en: string; ar: string; handWritten: boolean } {
  const key = `${citySlug}:${categorySlug}`;
  const hand = HUB_EDITORIAL_BY_KEY[key];
  if (hand) {
    return {
      en: interpolate(hand.en, vars),
      ar: interpolate(hand.ar, vars),
      handWritten: true,
    };
  }
  const fb = fallbackTemplate(vars);
  return { ...fb, handWritten: false };
}
