#!/usr/bin/env node
// Direct Arabic translations for providers 9860-9999
// All translations written directly - no APIs, no scripts calling external services

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/providers-scraped.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(__dirname, 'arabic-chunks/ar-9000-9999.json'), 'utf8'));

// ============================================================
// UNIQUE REVIEW SUMMARY TRANSLATIONS (RS[0])
// ============================================================
const rs0Map = {
  "A reliable medical supplier with good stock levels and efficient order processing.": "مورد طبي موثوق به مع مستويات مخزون جيدة ومعالجة طلبات فعالة.",
  "Parents value having a qualified nurse on-site and available throughout school hours.": "يثمن أولياء الأمور وجود ممرضة مؤهلة في الموقع ومتاحة طوال ساعات الدوام المدرسي.",
  "A decent pharmacy for everyday needs, though it is worth calling ahead for less common medications.": "صيدلية جيدة للاحتياجات اليومية، وإن كان من الأفضل الاتصال مسبقاً للتحقق من توفر الأدوية غير الشائعة.",
  "Pharmacists explain medication instructions clearly and take time with each patient.": "يشرح الصيادلة تعليمات الأدوية بوضوح ويمنحون وقتاً كافياً لكل مريض.",
  "No patient reviews currently available for this facility.": "لا تتوفر تقييمات مرضى حالياً لهذه المنشأة.",
  "Patient feedback suggests variable service quality across different visits.": "تشير تقييمات المرضى إلى تفاوت في جودة الخدمة بين الزيارات المختلفة.",
  "On-site healthcare available for students and nursery children throughout the day.": "تتوفر الرعاية الصحية في الموقع للطلاب وأطفال الحضانة طوال اليوم.",
  "Attentive doctors who listen carefully and explain their clinical assessments clearly.": "أطباء منتبهون يستمعون بعناية ويشرحون تقييماتهم الطبية بوضوح.",
  "Good complementary medicine practitioners who take a clearly patient-centred approach.": "ممارسون جيدون للطب التكميلي يتبعون نهجاً يتمحور بوضوح حول المريض.",
  "Physiotherapists build personalised treatment plans that deliver visible results.": "يضع المعالجون الفيزيائيون خططاً علاجية مخصصة تحقق نتائج ملموسة.",
  "Medical equipment and supplies available for healthcare facilities across the UAE.": "معدات ومستلزمات طبية متاحة للمرافق الصحية في جميع أنحاء الإمارات العربية المتحدة.",
  "Professional medical staff who conduct thorough and unhurried consultations.": "كادر طبي محترف يجري استشارات شاملة دون استعجال.",
  "Reliable eye examinations with clear prescription explanations afterward.": "فحوصات عيون موثوقة مع شرح واضح للوصفة الطبية بعد الفحص.",
  "Good clinical care with professional and courteous medical staff.": "رعاية سريرية جيدة مع كادر طبي محترف ومهذب.",
  "Eye tests are thorough and optometrists explain findings in plain, accessible language.": "فحوصات العيون شاملة ويشرح أخصائيو البصريات النتائج بلغة واضحة وسهلة الفهم.",
  "Doctors are thorough and patients consistently feel their concerns are taken seriously.": "الأطباء دقيقون في عملهم ويشعر المرضى باستمرار بأن مخاوفهم تُؤخذ بجدية.",
  "Dental laboratories consistently produce well-fitting prosthetics that clinics rely on.": "تنتج مختبرات الأسنان بانتظام تركيبات جيدة الملاءمة تعتمد عليها العيادات.",
  "A licensed home healthcare provider bringing clinical care to patients in their residences.": "مزود رعاية صحية منزلية مرخص يقدم الرعاية السريرية للمرضى في منازلهم.",
  "Adequate care for routine medical needs; booking ahead is advisable to limit waiting.": "رعاية كافية للاحتياجات الطبية الروتينية؛ يُنصح بالحجز المسبق للحد من وقت الانتظار.",
  "Mixed patient feedback, with some noting inconsistent stock and varying wait times.": "تقييمات المرضى متباينة، إذ يلاحظ بعضهم عدم انتظام المخزون وتفاوت أوقات الانتظار.",
  "A licensed medical equipment supplier registered with UAE health authorities.": "مورد معدات طبية مرخص ومسجل لدى الجهات الصحية في الإمارات العربية المتحدة.",
  "No patient reviews yet for this pharmacy.": "لا تتوفر تقييمات مرضى بعد لهذه الصيدلية.",
  "Dentists put anxious patients at ease from the very first appointment.": "يعمل أطباء الأسنان على طمأنة المرضى القلقين منذ الموعد الأول.",
  "Generally efficient service with knowledgeable and courteous pharmacy staff.": "خدمة فعالة بشكل عام مع كادر صيدلاني متمكن ومهذب.",
  "Patients leave sessions feeling genuinely relaxed; practitioners are skilled and attentive.": "يغادر المرضى الجلسات وهم يشعرون باسترخاء حقيقي؛ الممارسون ذوو كفاءة ويُولون المريض اهتماماً.",
  "Patient experiences are mixed, with service quality varying by day and time of visit.": "تجارب المرضى متباينة، وتتفاوت جودة الخدمة بحسب يوم وساعة الزيارة.",
  "A professional healthcare management organization known for responsive service.": "منظمة إدارة رعاية صحية محترفة تُعرف باستجابتها السريعة.",
  "A licensed healthcare services provider registered with UAE health authorities.": "مزود خدمات رعاية صحية مرخص ومسجل لدى الجهات الصحية في الإمارات.",
  "Staff are quick to respond and reassuringly calm when patients arrive in distress.": "الموظفون سريعو الاستجابة وهادئون بشكل مطمئن عند وصول المرضى في حالات الضيق.",
  "Blood draws are quick and virtually painless, handled by clearly experienced staff.": "سحب الدم سريع وخالٍ من الألم تقريباً، ويتولاه كادر ذو خبرة واضحة.",
  "A convenient service that brings medical care directly to the community.": "خدمة مريحة تجلب الرعاية الطبية مباشرة إلى المجتمع.",
  "Adequate optical services for standard prescription and eyewear needs.": "خدمات بصرية كافية للاحتياجات الروتينية من وصفات طبية ونظارات.",
  "A first aid clinic providing immediate response to minor injuries and acute conditions.": "عيادة إسعافات أولية تقدم استجابة فورية للإصابات الطفيفة والحالات الحادة.",
  "Doctors and nurses here genuinely listen and patients feel heard rather than rushed.": "الأطباء والممرضون هنا يستمعون بصدق ويشعر المرضى بأنهم مسموعون لا مستعجَلون.",
  "Adequate diagnostic services for standard laboratory investigations.": "خدمات تشخيصية كافية للفحوصات المختبرية الروتينية.",
  "A good overall hospital experience with professional and responsive medical staff.": "تجربة مستشفى جيدة بشكل عام مع كادر طبي محترف وسريع الاستجابة.",
  "Good dental care with attentive staff who take patient questions seriously.": "رعاية أسنان جيدة مع كادر منتبه يأخذ أسئلة المرضى بجدية.",
  "The medical team is attentive and patients feel genuinely cared for at every stage.": "الفريق الطبي منتبه ويشعر المرضى بالرعاية الحقيقية في كل مرحلة.",
  "The surgical team is professional and explains procedures clearly before the operation.": "الفريق الجراحي محترف ويشرح الإجراءات بوضوح قبل العملية.",
  "Adequate hospital care with some variation in service quality across departments.": "رعاية مستشفى كافية مع بعض التفاوت في جودة الخدمة بين الأقسام.",
  "Nursing staff are attentive and patients feel well-monitored during each session.": "الكادر التمريضي منتبه ويشعر المرضى بمتابعة جيدة في كل جلسة.",
  "Reliable primary healthcare with doctors who get to know their regular patients.": "رعاية صحية أولية موثوقة مع أطباء يتعرفون على مرضاهم المنتظمين.",
  "A decent primary care option for the local neighbourhood, with advance booking recommended.": "خيار رعاية أولية جيد للحي المحلي، ويُنصح بالحجز المسبق.",
  "Satisfactory dental care for routine treatments such as cleanings and fillings.": "رعاية أسنان مُرضية للعلاجات الروتينية مثل التنظيف والحشو.",
  "Patient feedback is mixed, with some reporting waits longer than expected.": "تقييمات المرضى متباينة، ويبلغ بعضهم عن أوقات انتظار أطول مما هو متوقع.",
  "Patient feedback is mixed, with service quality varying by time of visit.": "تقييمات المرضى متباينة، وتتفاوت جودة الخدمة بحسب وقت الزيارة.",
  "Efficient laboratory service with reliable turnaround on test results.": "خدمة مختبرية فعالة مع أوقات استلام موثوقة لنتائج الفحوصات.",
  "Day surgery services are available for planned procedures not requiring overnight admission.": "خدمات الجراحة اليومية متاحة للإجراءات المخطط لها التي لا تستلزم الإقامة الليلية."
};

// ============================================================
// UNIQUE REVIEW SUMMARY TRANSLATIONS (RS[1])
// ============================================================
const rs1Map = {
  "The team is knowledgeable about product specifications and regulatory requirements.": "الفريق على دراية بمواصفات المنتجات والمتطلبات التنظيمية.",
  "Responses to minor injuries and illnesses during the school day are prompt and calm.": "الاستجابات للإصابات والأمراض الطفيفة خلال اليوم الدراسي سريعة وهادئة.",
  "Service can slow during busy periods but staff remain polite throughout.": "قد تتباطأ الخدمة في أوقات الذروة لكن الموظفين يظلون مهذبين في جميع الأحوال.",
  "Fast dispensing service with rarely more than a few minutes wait for prescriptions.": "خدمة صرف سريعة نادراً ما تتجاوز دقائق قليلة في انتظار الوصفات.",
  "A licensed healthcare provider registered with UAE health authorities.": "مزود رعاية صحية مرخص ومسجل لدى الجهات الصحية في الإمارات.",
  "The facility covers basic healthcare needs for the local area.": "تغطي المنشأة الاحتياجات الصحية الأساسية للمنطقة المحلية.",
  "Qualified nursing staff respond to minor illnesses and injuries promptly.": "يستجيب الكادر التمريضي المؤهل للأمراض والإصابات الطفيفة بسرعة.",
  "Prompt service with little waiting time for patients with scheduled appointments.": "خدمة سريعة مع وقت انتظار قصير للمرضى الحاملين لمواعيد مسبقة.",
  "Sessions are personalised to individual needs rather than applying a generic formula.": "الجلسات مخصصة للاحتياجات الفردية بدلاً من تطبيق نموذج موحد.",
  "Many patients notice real improvement after only a handful of sessions.": "يلاحظ كثير من المرضى تحسناً حقيقياً بعد عدد قليل من الجلسات.",
  "Reach out directly for product listings, pricing structures, and delivery schedules.": "تواصل مباشرة للاستفسار عن قوائم المنتجات وهياكل الأسعار وجداول التسليم.",
  "The clinic is clean and appointments generally run within a reasonable time of schedule.": "العيادة نظيفة والمواعيد تسير عموماً في وقت معقول وفق الجدول.",
  "A reasonable frame selection with a quick turnaround on new glasses orders.": "تشكيلة إطارات معقولة مع تنفيذ سريع لطلبات النظارات الجديدة.",
  "Appointments are generally on time and the facility is well-maintained.": "المواعيد تسير عموماً في وقتها والمنشأة مُحافَظ عليها بشكل جيد.",
  "A good selection of frames at different price points to suit varied budgets.": "تشكيلة جيدة من الإطارات بأسعار متفاوتة تناسب مختلف الميزانيات.",
  "Short waiting times and a well-organized appointment scheduling system.": "أوقات انتظار قصيرة ونظام حجز مواعيد منظم بشكل جيد.",
  "Turnaround times are reliable, which helps clinics manage patient appointments smoothly.": "أوقات التسليم موثوقة مما يساعد العيادات على إدارة مواعيد المرضى بسلاسة.",
  "Ideal for post-surgical recovery, wound care, and chronic disease management at home.": "مثالي للتعافي بعد الجراحة والعناية بالجروح وإدارة الأمراض المزمنة في المنزل.",
  "Doctors are professional, though the clinic can get busy during peak hours.": "الأطباء محترفون، وإن كانت العيادة تزدحم في ساعات الذروة.",
  "Staff are generally polite and the pharmacy covers essential medication needs.": "الموظفون مهذبون بشكل عام والصيدلية تغطي الاحتياجات الدوائية الأساسية.",
  "Servicing hospitals and clinics with medical supplies and devices.": "تزويد المستشفيات والعيادات بالمستلزمات والأجهزة الطبية.",
  "A licensed pharmacy serving local prescription and medication needs.": "صيدلية مرخصة تخدم احتياجات الوصفات الطبية والأدوية المحلية.",
  "Treatments are thorough and each step of the procedure is explained clearly.": "العلاجات شاملة ويُشرح كل خطوة من خطوات الإجراء بوضوح.",
  "Good stock of common medications and personal care essentials.": "مخزون جيد من الأدوية الشائعة ومستلزمات العناية الشخصية.",
  "A solid choice for those looking to complement their conventional medical treatment.": "خيار جيد لمن يسعى إلى تكميل علاجه الطبي التقليدي.",
  "Suitable for straightforward consultations and standard medical needs.": "مناسب للاستشارات المباشرة والاحتياجات الطبية الروتينية.",
  "Clinical staff and administrators work smoothly together to support patient flow.": "يتعاون الكادر الطبي والإداريون بسلاسة لدعم تدفق المرضى.",
  "Working across clinical operations, staffing, and health system support functions.": "يعمل عبر العمليات السريرية والتوظيف ووظائف دعم النظام الصحي.",
  "Minor injuries and acute presentations are handled efficiently and professionally.": "تُعالَج الإصابات الطفيفة والحالات الحادة بكفاءة واحترافية.",
  "Test results are delivered on time and explained clearly when patients request it.": "تُسلَّم نتائج الفحوصات في الوقت المحدد وتُشرح بوضوح عند طلب المرضى.",
  "Staff are professional and well-equipped to handle on-site patient needs.": "الموظفون محترفون ومجهزون جيداً للتعامل مع احتياجات المرضى في الموقع.",
  "Frame selection is functional if not extensive, covering most customer requirements.": "تشكيلة الإطارات عملية وإن لم تكن واسعة، فهي تلبي معظم متطلبات العملاء.",
  "Qualified staff available to assess and treat patients or arrange onward referral.": "كادر مؤهل متاح لتقييم المرضى وعلاجهم أو ترتيب الإحالة اللازمة.",
  "One of the more reliable primary care choices in Abu Dhabi for families and working adults.": "من بين أكثر خيارات الرعاية الأولية موثوقية في أبوظبي للعائلات والبالغين العاملين.",
  "Turnaround on results can vary; asking staff for expected timelines is advisable.": "قد يتفاوت وقت استلام النتائج؛ يُنصح بسؤال الموظفين عن المواعيد المتوقعة.",
  "Admission and discharge processes are generally smooth and well-handled.": "إجراءات القبول والخروج سلسة بشكل عام ومُدارة بشكل جيد.",
  "Appointments are generally on time and the clinic is kept in good condition.": "المواعيد تسير عموماً في وقتها والعيادة محافَظ عليها في حالة جيدة.",
  "Among the more trusted hospital options in Al Ain based on patient feedback.": "من بين خيارات المستشفيات الأكثر ثقة في العين استناداً إلى تقييمات المرضى.",
  "One of the more reliable primary care choices in Al Ain for families and working adults.": "من بين أكثر خيارات الرعاية الأولية موثوقية في العين للعائلات والبالغين العاملين.",
  "Day-case procedures are organized efficiently with minimal waiting on the day.": "تُنظَّم إجراءات الجراحة اليومية بكفاءة مع انتظار محدود في يوم الإجراء.",
  "Among the more trusted hospital options in Abu Dhabi based on patient feedback.": "من بين خيارات المستشفيات الأكثر ثقة في أبوظبي استناداً إلى تقييمات المرضى.",
  "Emergency wait times can extend during busy periods, particularly on weekends.": "قد تطول أوقات انتظار الطوارئ في أوقات الذروة، لا سيما أيام العطل الأسبوعية.",
  "The center runs sessions on schedule, which patients managing chronic conditions greatly appreciate.": "يُدير المركز الجلسات وفق الجدول المحدد مما يُقدِّره مرضى الأمراض المزمنة كثيراً.",
  "A solid option for routine check-ups, vaccinations, and managing common conditions.": "خيار جيد للفحوصات الدورية والتطعيمات وإدارة الحالات الشائعة.",
  "Wait times can stretch during busy periods but the clinical care is adequate.": "قد تمتد أوقات الانتظار في فترات الازدحام لكن الرعاية السريرية كافية.",
  "Waiting times can extend on busy days, so booking ahead is advisable.": "قد تطول أوقات الانتظار في الأيام المزدحمة، لذا يُنصح بالحجز المسبق.",
  "The clinic is suited to basic dental treatments; complex cases may need onward referral.": "العيادة مناسبة للعلاجات السنية الأساسية؛ الحالات المعقدة قد تحتاج إلى إحالة.",
  "Covers basic primary care needs and referrals for the surrounding community.": "يغطي الاحتياجات الأولية الأساسية والإحالات للمجتمع المحيط.",
  "Staff are professional and the sample collection process is smooth and organized.": "الموظفون محترفون وعملية أخذ العينات سلسة ومنظمة.",
  "The clinical team provides pre-operative information and post-surgery instructions.": "يقدم الفريق السريري معلومات ما قبل الجراحة وتعليمات ما بعدها."
};

// ============================================================
// UNIQUE REVIEW SUMMARY TRANSLATIONS (RS[2])
// ============================================================
const rs2Map = {
  "Many patients describe a genuinely pain-free experience that changed their outlook on dental visits.": "يصف كثير من المرضى تجربة خالية من الألم حقاً غيّرت نظرتهم إلى زيارات طبيب الأسنان.",
  "Doctors take a thorough approach to each consultation.": "يتبع الأطباء نهجاً شاملاً في كل استشارة.",
  "Children generally feel comfortable visiting the clinic when they feel unwell.": "يشعر الأطفال عموماً بالراحة عند زيارة العيادة حين يعانون من وعكة.",
  "Well-stocked with a broad range of branded and generic medications at fair prices.": "مخزون وافر من الأدوية الأصلية والجنيسة بأسعار معقولة.",
  "Appointments run on time and the check-in and registration process is straightforward.": "المواعيد تسير في وقتها وإجراءات تسجيل الوصول واضحة وسهلة.",
  "A convenient choice for residents needing general medical consultation in the area.": "خيار مريح للمقيمين الذين يحتاجون إلى استشارة طبية عامة في المنطقة.",
  "Staff are professional and the clinic environment is well-maintained and organized.": "الكادر محترف والبيئة العيادية محافَظ عليها ومنظمة بشكل جيد.",
  "Appointments run to schedule with minimal waiting between arrival and sample collection.": "المواعيد تسير وفق الجدول مع انتظار محدود بين الوصول وأخذ العينات.",
  "The clinic environment is well-kept and the reception team is welcoming.": "بيئة العيادة مُعتنى بها وفريق الاستقبال مرحِّب.",
  "Convenient for local residents picking up regular prescriptions.": "مريحة للمقيمين المحليين لاستلام وصفاتهم الدورية.",
  "Waiting times are manageable, particularly during off-peak hours.": "أوقات الانتظار قابلة للإدارة، لا سيما خارج ساعات الذروة.",
  "Doctors are thorough during consultations and address patient concerns directly.": "الأطباء شاملون في استشاراتهم ويتعاملون مع مخاوف المرضى بشكل مباشر.",
  "Emergency response is swift and clinical staff remain composed under pressure.": "الاستجابة للطوارئ سريعة ويظل الكادر السريري هادئاً تحت الضغط.",
  "Suits basic prescription requirements; specialists items are worth confirming ahead of visit.": "مناسبة للوصفات الأساسية؛ الأصناف المتخصصة يستحق التأكد منها قبل الزيارة.",
  "The clinic is clean and well-maintained with a calm and welcoming atmosphere.": "العيادة نظيفة ومُعتنى بها في أجواء هادئة وترحيبية.",
  "Parents are kept informed when their child needs medical attention.": "يُبقى أولياء الأمور على اطلاع حين يحتاج أطفالهم إلى عناية طبية.",
  "New glasses were ready quickly and fitted well with no follow-up adjustments needed.": "النظارات الجديدة كانت جاهزة بسرعة ومضبوطة بشكل جيد دون الحاجة إلى تعديلات.",
  "Booking ahead is recommended to avoid longer waiting times at peak periods.": "يُنصح بالحجز المسبق لتجنب أوقات انتظار أطول في فترات الذروة.",
  "Doctors take adequate time with patients and answer questions clearly.": "يمنح الأطباء وقتاً كافياً للمرضى ويجيبون على أسئلتهم بوضوح.",
  "Patients feel well-informed and prepared going into their planned procedures.": "يشعر المرضى بأنهم على دراية وعلى استعداد تام قبل الإجراءات المخطط لها.",
  "The lab team communicate clearly with referring dentists about specifications and timelines.": "يتواصل فريق المختبر بوضوح مع أطباء الأسنان المُحيلين حول المواصفات والجداول الزمنية.",
  "A reliable option for standard medical care within the local community.": "خيار موثوق للرعاية الطبية الروتينية في المجتمع المحلي.",
  "Dentists explain treatment options carefully before beginning any procedure.": "يشرح أطباء الأسنان خيارات العلاج بعناية قبل البدء بأي إجراء.",
  "A licensed laboratory suited to routine tests and clinician referrals.": "مختبر مرخص مناسب للفحوصات الروتينية وإحالات الأطباء.",
  "Results are dispatched promptly and the lab confirms receipt upon request.": "تُرسل النتائج في الوقت المحدد ويؤكد المختبر الاستلام عند الطلب.",
  "Staff are polite, though some patients would welcome more detailed explanations.": "الموظفون مهذبون، وإن كان بعض المرضى يرحبون بتفسيرات أكثر تفصيلاً.",
  "The team is knowledgeable about UAE health system requirements and compliance standards.": "الفريق على دراية بمتطلبات النظام الصحي في الإمارات ومعايير الامتثال.",
  "The team takes a detailed health history before recommending any course of treatment.": "يأخذ الفريق تاريخاً صحياً مفصلاً قبل التوصية بأي خطة علاجية.",
  "Patients appreciate having a reliable first-response clinic close to home or work.": "يُقدِّر المرضى وجود عيادة إسعاف أولية موثوقة قريبة من المنزل أو العمل."
};

// ============================================================
// UNIQUE REVIEW SUMMARY TRANSLATIONS (RS[3])
// ============================================================
const rs3Map = {
  "The clinic is clean, well-organized, and appointments run close to their scheduled times.": "العيادة نظيفة ومنظمة جيداً والمواعيد تسير قريباً من أوقاتها المحددة.",
  "Most patients find the experience straightforward and satisfactory.": "يجد معظم المرضى التجربة مباشرة ومُرضية.",
  "Parents receive timely communication when a child requires medical attention.": "يتلقى أولياء الأمور تواصلاً في الوقت المناسب عند احتياج الطفل للعناية الطبية.",
  "Helpful with over-the-counter recommendations when patients are unsure what they need.": "مفيدون في تقديم التوصيات للأدوية المتاحة دون وصفة عندما يكون المرضى غير متأكدين مما يحتاجونه.",
  "A good fit for managing ongoing conditions with regular follow-ups and medication reviews.": "مناسب لإدارة الحالات المستمرة مع متابعة دورية ومراجعة للأدوية.",
  "Reasonable option for check-ups and basic medical treatments.": "خيار معقول للفحوصات الدورية والعلاجات الطبية الأساسية.",
  "Most visits proceed smoothly from registration through to seeing the doctor.": "تسير معظم الزيارات بسلاسة من التسجيل وحتى مقابلة الطبيب.",
  "A clean and professionally managed environment that patients feel comfortable in.": "بيئة نظيفة تُدار باحترافية ويشعر فيها المرضى بالراحة.",
  "Patients leave with a clear understanding of their diagnosis and the next steps.": "يغادر المرضى وهم يفهمون تشخيصهم والخطوات التالية بوضوح.",
  "Stock availability varies, so confirming before visiting saves time.": "يتفاوت توفر المخزون، لذا يوفر التأكد قبل الزيارة الوقت.",
  "Staff willing to check alternatives if a specific medication is not available.": "الموظفون على استعداد للبحث عن بدائل إذا لم يكن دواء محدد متاحاً.",
  "Serves the local community well for day-to-day medical needs and referrals.": "يخدم المجتمع المحلي بشكل جيد للاحتياجات الطبية اليومية والإحالات.",
  "Rooms are clean and the nursing team checks in on patients consistently.": "الغرف نظيفة والفريق التمريضي يتفقد المرضى باستمرار.",
  "A dependable choice for families and working professionals in Abu Dhabi.": "خيار موثوق للعائلات والمهنيين العاملين في أبوظبي.",
  "Staff are friendly and never push unnecessary add-ons on customers.": "الموظفون ودودون ولا يفرضون إضافات غير ضرورية على العملاء.",
  "Clean facilities and a supportive nursing team throughout the patient stay.": "مرافق نظيفة وفريق تمريض داعم طوال فترة إقامة المريض.",
  "Post-operative support and discharge instructions are clearly communicated by staff.": "يُبلَّغ الموظفون بوضوح عن الدعم بعد العملية وتعليمات الخروج.",
  "A trusted technical partner for dental clinics across the region.": "شريك تقني موثوق للعيادات السنية في جميع أنحاء المنطقة.",
  "Patients report feeling listened to and appropriately treated during their visit.": "يُفيد المرضى بأنهم يشعرون بأنهم مسموعون ومُعالَجون بشكل مناسب أثناء زيارتهم.",
  "A dependable choice for families and working professionals in Al Ain.": "خيار موثوق للعائلات والمهنيين العاملين في العين.",
  "A comfortable experience for most patients, including those with dental anxiety.": "تجربة مريحة لمعظم المرضى بمن فيهم من يعانون من قلق تجاه طب الأسنان.",
  "A good choice for routine blood work, cultures, and diagnostic testing.": "خيار جيد لفحوصات الدم الروتينية والمزارع والاختبارات التشخيصية.",
  "A reasonable option for standard dental needs in the local area.": "خيار معقول للاحتياجات السنية الروتينية في المنطقة المحلية.",
  "A reliable partner for healthcare facilities seeking management and operational support.": "شريك موثوق للمرافق الصحية الباحثة عن دعم إداري وتشغيلي.",
  "Many patients report improvements in sleep quality, stress levels, and general wellbeing.": "يُفيد كثير من المرضى بتحسن في جودة النوم ومستويات التوتر والصحة العامة.",
  "Serious cases are identified quickly and referred to hospital when needed.": "يُكشف عن الحالات الخطيرة بسرعة وتُحال إلى المستشفى عند الحاجة."
};

// ============================================================
// FACILITY TYPE GENDER (m = masculine, f = feminine)
// ============================================================
const facilityTypeGender = {
  "عيادة": "f",
  "صيدلية خارجية": "f",
  "مركز طبي": "m",
  "عيادة مدرسية": "f",
  "عيادة إسعافات أولية": "f",
  "صيدلية": "f",
  "مركز أسنان": "m",
  "مركز رعاية صحية أولية": "m",
  "صيدلية أدوية": "f",
  "عيادة أسنان": "f",
  "مزود خدمات صحية": "m",
  "صيدلية على مدار الساعة": "f",
  "عيادة طب عام": "f",
  "مستشفى عام": "m",
  "مركز بصريات": "m",
  "عيادة طبية متخصصة": "f",
  "مستودع طبي": "m",
  "صيدلية للمرضى الداخليين": "f",
  "مركز إعادة تأهيل": "m",
  "مركز إعادة تأهيل مع خدمات بصرية": "m",
  "مركز تصوير تشخيصي ومختبر": "m",
  "مركز الطب التقليدي والتكميلي": "m",
  "مزود خدمات إدارة الرعاية الصحية": "m",
  "وحدة صحية متنقلة": "f",
  "مختبر طبي تشخيصي": "m",
  "مركز جراحة يومية": "m",
  "مركز إعادة تأهيل مع مختبر أسنان": "m",
  "منشأة رعاية صحية": "f",
  "مستشفى متخصص": "m",
  "عيادة حضانة": "f",
  "مركز خدمات الدعم الصحي": "m",
  "مختبر أسنان": "m",
  "عيادة متخصصة": "f",
  "مختبر طبي متنقل": "m",
  "مركز خدمات الرعاية الصحية المنزلية": "m",
  "وحدة صحية أسنان متنقلة": "f",
  "مزود خدمات رعاية صحية": "m",
  "عيادة صحية متنقلة": "f",
  "مكتب علمي": "m",
  "منشأة صحية لصاحب عمل خاص": "f",
  "مركز غسيل كلى": "m",
  "مزود خدمات التوظيف والدعم الصحي": "m",
  "مركز إعادة تأهيل السمع والبصر": "m",
  "مركز التصوير التشخيصي": "m",
  "مزود خدمات نقل ودعم الرعاية الصحية": "m"
};

// ============================================================
// FACILITY TYPE TRANSLATIONS
// ============================================================
const facilityTypeMap = {
  "clinic": "عيادة",
  "outpatient pharmacy": "صيدلية خارجية",
  "medical center": "مركز طبي",
  "school clinic": "عيادة مدرسية",
  "first aid clinic": "عيادة إسعافات أولية",
  "pharmacy": "صيدلية",
  "dental center": "مركز أسنان",
  "primary healthcare center": "مركز رعاية صحية أولية",
  "drug store": "صيدلية أدوية",
  "dental clinic": "عيادة أسنان",
  "health services provider": "مزود خدمات صحية",
  "24-hour pharmacy": "صيدلية على مدار الساعة",
  "general medical clinic": "عيادة طب عام",
  "general hospital": "مستشفى عام",
  "optical center": "مركز بصريات",
  "specialized medical clinic": "عيادة طبية متخصصة",
  "medical warehouse": "مستودع طبي",
  "inpatient pharmacy": "صيدلية للمرضى الداخليين",
  "rehabilitation center": "مركز إعادة تأهيل",
  "general medicine clinic": "عيادة طب عام",
  "rehabilitation center with optical services": "مركز إعادة تأهيل مع خدمات بصرية",
  "diagnostic imaging and laboratory center": "مركز تصوير تشخيصي ومختبر",
  "traditional and complementary medicine center": "مركز الطب التقليدي والتكميلي",
  "healthcare management services provider": "مزود خدمات إدارة الرعاية الصحية",
  "mobile health unit": "وحدة صحية متنقلة",
  "diagnostic medical laboratory": "مختبر طبي تشخيصي",
  "day surgery center": "مركز جراحة يومية",
  "rehabilitation center with dental laboratory": "مركز إعادة تأهيل مع مختبر أسنان",
  "healthcare facility": "منشأة رعاية صحية",
  "specialized hospital": "مستشفى متخصص",
  "nursery clinic": "عيادة حضانة",
  "health support service center": "مركز خدمات الدعم الصحي",
  "dental laboratory": "مختبر أسنان",
  "specialized clinic": "عيادة متخصصة",
  "mobile medical laboratory": "مختبر طبي متنقل",
  "home healthcare service center": "مركز خدمات الرعاية الصحية المنزلية",
  "mobile dental health unit": "وحدة صحية أسنان متنقلة",
  "healthcare services provider": "مزود خدمات رعاية صحية",
  "mobile health clinic": "عيادة صحية متنقلة",
  "scientific office": "مكتب علمي",
  "private employer health facility": "منشأة صحية لصاحب عمل خاص",
  "dialysis center": "مركز غسيل كلى",
  "healthcare staffing and support services provider": "مزود خدمات التوظيف والدعم الصحي",
  "audiology and optical rehabilitation center": "مركز إعادة تأهيل السمع والبصر",
  "diagnostic imaging center": "مركز التصوير التشخيصي",
  "healthcare transport and support services provider": "مزود خدمات نقل ودعم الرعاية الصحية"
};

// ============================================================
// RATING SENTENCE PATTERNS -> Arabic
// ============================================================
function translateRatingSentence(text) {
  // Pattern: "Rated X/5 on Google."
  text = text.replace(/Rated (\d+(?:\.\d+)?)\/5 on Google\./g, (_, r) => `حاصل على تقييم ${r}/5 على Google.`);
  // Pattern: "Rated X/5 across N Google reviews, a strong indicator of patient satisfaction."
  text = text.replace(/Rated (\d+(?:\.\d+)?)\/5 across ([\d,]+) Google reviews, a strong indicator of patient satisfaction\./g,
    (_, r, n) => `حاصل على تقييم ${r}/5 عبر ${n} تقييم على Google، مؤشر قوي على رضا المرضى.`);
  // Pattern: "Rated X out of 5 by N patients on Google, reflecting consistently positive experiences."
  text = text.replace(/Rated (\d+(?:\.\d+)?) out of 5 by ([\d,]+) patients on Google, reflecting consistently positive experiences\./g,
    (_, r, n) => `حاصل على تقييم ${r} من 5 من قبل ${n} مريض على Google، يعكس تجارب إيجابية متسقة.`);
  // Pattern: "Holds a X/5 rating from N patient reviews on Google."
  text = text.replace(/Holds a (\d+(?:\.\d+)?)\/5 rating from ([\d,]+) patient reviews on Google\./g,
    (_, r, n) => `يحمل تقييم ${r}/5 بناءً على ${n} تقييم من المرضى على Google.`);
  // Pattern: "Holds a X/5 Google rating based on N patient reviews."
  text = text.replace(/Holds a (\d+(?:\.\d+)?)\/5 Google rating based on ([\d,]+) patient reviews\./g,
    (_, r, n) => `يحمل تقييم ${r}/5 على Google استناداً إلى ${n} تقييم من المرضى.`);
  // Pattern: "Rated X/5 by N patients on Google."
  text = text.replace(/Rated (\d+(?:\.\d+)?)\/5 by ([\d,]+) patients on Google\./g,
    (_, r, n) => `حاصل على تقييم ${r}/5 من قبل ${n} مريض على Google.`);
  // Pattern: "Rated X/5 on Google." (single number without N patients)
  text = text.replace(/Rated (\d+(?:\.\d+)?) out of 5 by ([\d,]+) patients on Google\./g,
    (_, r, n) => `حاصل على تقييم ${r} من 5 من قبل ${n} مريض على Google.`);
  // Pattern: "Rated X.X/5 across N Google reviews, a strong indicator..."
  text = text.replace(/Rated (\d+(?:\.\d+)?) out of 5 by ([\d,]+) patients on Google, reflecting consistently positive experiences\./g,
    (_, r, n) => `حاصل على تقييم ${r} من 5 بناءً على ${n} تقييم على Google، يعكس تجارب إيجابية باستمرار.`);
  return text;
}

// ============================================================
// MAIN DESCRIPTION TRANSLATOR
// ============================================================
function translateDescription(desc, name) {
  let ar = desc;

  // Extract facility type
  const typeMatch = ar.match(/is an? (.+?) located in/);
  const facilityTypeEn = typeMatch ? typeMatch[1].trim() : '';
  const facilityTypeAr = facilityTypeMap[facilityTypeEn] || facilityTypeEn;

  // Extract location
  const locMatch = ar.match(/located in (.+?)\. /);
  const location = locMatch ? locMatch[1] : '';

  // Determine city - used in final sentences
  let cityAr = 'أبوظبي';
  if (location.includes('Al Ain') || location.includes('Al Khibeesi') || location.includes('Falaj Hazza') ||
      location.includes('Hai Al') || location.includes('Al Muwaij') || location.includes('Al Noud') ||
      location.includes('Al Rubainah') || location.includes('Al Jimi') || location.includes('Central District') ||
      location.includes('Al Mu\'tarid') || location.includes('Bani Yas, Al Ain') || location.includes('Al Ain')) {
    cityAr = 'العين';
  } else if (location.includes('Sharjah') || location.includes('Al Nahda') || location.includes('Al Shuwaih') ||
             location.includes('Muwaileh') || location.includes('Al Rawda 2') || location.includes('Al Rawda 1') ||
             location.includes('Al Naba') || location.includes('Industrial Area, Sharjah') ||
             location.includes('opposite to Sharjah') || location.includes('Sharjah')) {
    cityAr = 'الشارقة';
  } else if (location.includes('Ajman') || location.includes('Al Rawda 1, Ajman')) {
    cityAr = 'عجمان';
  } else if (location.includes('Ras Al Khaimah') || location.includes('Khor Khwair')) {
    cityAr = 'رأس الخيمة';
  } else if (location.includes('Fujairah')) {
    cityAr = 'الفجيرة';
  }

  // Translate rating sentences
  ar = translateRatingSentence(ar);

  // Common sentence replacements
  const sentenceMap = [
    // Staff communication
    [/Staff communicate in English and Arabic to serve the diverse patient community across the UAE\./g,
     'يتواصل الموظفون باللغتين الإنجليزية والعربية لخدمة مجتمع المرضى المتنوع في جميع أنحاء الإمارات.'],
    // Insurance sentences
    [/The facility accepts Daman, Thiqa insurance coverage\./g,
     'تقبل المنشأة تأمين Daman و Thiqa.'],
    // Opening hours
    [/Open throughout the week to serve patients at convenient times\./g,
     'مفتوح طوال أيام الأسبوع لخدمة المرضى في أوقات مناسبة.'],
    [/Open on weekdays with adjusted hours, following standard working week schedules\./g,
     'مفتوح أيام الأسبوع بساعات عمل معدّلة وفق جداول أسبوع العمل المعتادة.'],
    [/Open around the clock, seven days a week, for patients who need medication or advice at any hour\./g,
     'مفتوح على مدار الساعة سبعة أيام في الأسبوع للمرضى الذين يحتاجون إلى دواء أو مشورة في أي وقت.'],
    // License sentences - MOHAP
    [new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' is licensed and regulated by MOHAP, listed in the UAE Open Healthcare Directory as a verified provider\\.', 'g'),
     `${name} مرخص ومنظَّم من قِبل MOHAP، ومدرج في الدليل المفتوح للرعاية الصحية في الإمارات كمزود معتمد.`],
    // License sentences - DOH Abu Dhabi with license number
    [new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' is licensed and regulated by DOH Abu Dhabi \\(License ([^)]+)\\), listed in the UAE Open Healthcare Directory as a verified provider\\.', 'g'),
     (match, lic) => `${name} مرخص ومنظَّم من قِبل DOH Abu Dhabi (ترخيص ${lic})، ومدرج في الدليل المفتوح للرعاية الصحية في الإمارات كمزود معتمد.`],
    // License sentences - DHA with license number
    [new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' is licensed and regulated by DHA \\(License ([^)]+)\\), listed in the UAE Open Healthcare Directory as a verified provider\\.', 'g'),
     (match, lic) => `${name} مرخص ومنظَّم من قِبل DHA (ترخيص ${lic})، ومدرج في الدليل المفتوح للرعاية الصحية في الإمارات كمزود معتمد.`],
    // Phone
    [/Reachable by phone at ([+\d\s\-().]+)\./g,
     (match, phone) => `يمكن التواصل عبر الهاتف على ${phone}.`],
    // Specialty sentences
    [/Specialties available include ([^.]+)\./g,
     (match, specs) => `التخصصات المتاحة تشمل ${specs}.`],
    // Pharmacy dispensing sentences
    [/Dispensing both prescription and over-the-counter medications, the pharmacy serves patients and caregivers across the local community\./g,
     'يُصرف الدواء بوصفة طبية وبدونها، وتخدم الصيدلية المرضى ومرافقيهم في المجتمع المحلي.'],
    // Outpatient pharmacy sentence
    [/As an outpatient pharmacy, it fills prescriptions for patients visiting affiliated clinics and hospitals in the area\./g,
     'بوصفها صيدلية خارجية، تُنفِّذ وصفات المرضى الذين يترددون على العيادات والمستشفيات المنتسبة في المنطقة.'],
    // Inpatient pharmacy sentence
    [/Operating as an inpatient pharmacy, it supplies medications directly to hospital patients as part of their treatment and discharge plans\./g,
     'بوصفها صيدلية للمرضى الداخليين، تُزوِّد المرضى المقيمين بالأدوية مباشرةً كجزء من خطط علاجهم وخروجهم.'],
    // 24-hour pharmacy sentence
    [/As a 24-hour pharmacy, it provides round-the-clock access to prescription and over-the-counter medications for the surrounding community\./g,
     'بوصفها صيدلية تعمل على مدار الساعة، توفر إمكانية الوصول على مدار الساعة إلى الأدوية بوصفة طبية وبدونها للمجتمع المحيط.'],
    // School clinic sentence
    [/The clinic is staffed to manage minor illnesses, injuries, and general health monitoring for children throughout the school day\./g,
     'مزودة بكادر لإدارة الأمراض والإصابات الطفيفة والمراقبة الصحية العامة للأطفال طوال اليوم الدراسي.'],
    // Medical warehouse sentence
    [/The warehouse supplies medical devices, equipment, and consumables to healthcare facilities across the region, operating under strict quality and safety controls\./g,
     'يُزوِّد المستودع المرافق الصحية في المنطقة بالأجهزة والمعدات والمستهلكات الطبية، ويعمل وفق ضوابط صارمة للجودة والسلامة.'],
    // First aid clinic sentence
    [/Staffed with qualified medical professionals, the clinic handles minor injuries and acute presentations, redirecting more serious cases to hospital emergency departments\./g,
     'يُدار بكادر من المهنيين الطبيين المؤهلين، ويتعامل مع الإصابات الطفيفة والحالات الحادة، ويُحيل الحالات الأشد خطورة إلى أقسام الطوارئ في المستشفيات.'],
    // Medical center general sentence
    [/Providing quality medical care to patients across a range of clinical needs, with qualified staff available for consultations and treatment\./g,
     'يُقدِّم رعاية طبية عالية الجودة للمرضى عبر طيف من الاحتياجات السريرية، بكادر مؤهل متاح للاستشارات والعلاج.'],
    // Primary healthcare center sentence
    [/As a primary healthcare center, it acts as a first point of contact for patients seeking general consultations, preventive care, and chronic disease follow-up\./g,
     'بوصفه مركزاً للرعاية الصحية الأولية، يعمل كأول نقطة تواصل للمرضى الباحثين عن الاستشارات العامة والرعاية الوقائية ومتابعة الأمراض المزمنة.'],
    // Dental care sentence
    [/Providing dental care including check-ups, fillings, extractions, and cosmetic treatments in a professional clinical environment\./g,
     'يُقدِّم رعاية سنية تشمل الكشف والحشو والخلع والعلاجات التجميلية في بيئة سريرية احترافية.'],
    // Eye center sentence
    [/The center offers eye examinations, prescription glasses, contact lenses, and a range of optical accessories for patients of all ages\./g,
     'يُقدِّم المركز فحوصات العيون والنظارات الطبية وعدسات اللاصقة ومجموعة من الملحقات البصرية لمرضى من جميع الأعمار.'],
    // Diagnostic lab sentence
    [/The laboratory handles diagnostic blood tests, cultures, and clinical pathology investigations for referred patients\./g,
     'يُجري المختبر فحوصات الدم التشخيصية والمزارع والتحقيقات المرضية السريرية للمرضى المُحالين.'],
    // Diagnostic imaging and lab sentence
    [/The center combines diagnostic imaging and laboratory services, providing a range of investigative tests under one roof\./g,
     'يجمع المركز خدمات التصوير التشخيصي والمختبر، ويُقدِّم مجموعة من الفحوصات التشخيصية تحت سقف واحد.'],
    // Imaging sentence
    [/Diagnostic imaging services include X-ray and other radiology investigations to support clinical diagnosis and monitoring\./g,
     'تشمل خدمات التصوير التشخيصي الأشعة السينية وتحقيقات الأشعة الأخرى لدعم التشخيص السريري والمتابعة.'],
    // Day surgery sentence
    [/Operating as a day surgery center, it performs planned surgical procedures that do not require overnight hospital admission\./g,
     'بوصفه مركزاً للجراحة اليومية، يُجري إجراءات جراحية مخططة لا تستلزم الإقامة في المستشفى ليلاً.'],
    // Specialized hospital sentence
    [/Operating as a specialized hospital, it focuses on targeted clinical disciplines with dedicated medical teams and supporting infrastructure\./g,
     'بوصفه مستشفى متخصصاً، يُركِّز على التخصصات السريرية المحددة بفرق طبية متفانية وبنية تحتية داعمة.'],
    // General hospital sentence
    [/As a general hospital, it offers inpatient and outpatient care across a broad range of medical and surgical specialties\./g,
     'بوصفه مستشفى عاماً، يُقدِّم رعاية للمرضى الداخليين والخارجيين عبر طيف واسع من التخصصات الطبية والجراحية.'],
    // Healthcare management sentence
    [/The organization provides healthcare management and support services to the broader health system, working across clinical operations, staffing, and patient logistics\./g,
     'تُقدِّم المنظمة خدمات إدارة ودعم الرعاية الصحية للنظام الصحي الأشمل، وتعمل عبر العمليات السريرية والتوظيف ولوجستيات المرضى.'],
    // Contact sentence variants
    [/Patients and referring clinicians are welcome to contact the facility directly for service information and availability\./g,
     'يُرحَّب بالمرضى والأطباء المُحيلين للتواصل مع المنشأة مباشرةً للاستفسار عن الخدمات والإتاحة.'],
    [/The facility is open to new patients and accepts walk-in and scheduled appointments depending on service type\./g,
     'المنشأة مفتوحة لاستقبال مرضى جدد وتقبل الحضور المباشر والمواعيد المجدولة بحسب نوع الخدمة.'],
    // Routine dental check-ups
    [/Routine dental check-ups every six months are encouraged to maintain oral health and prevent issues before they develop\./g,
     'يُشجَّع على الفحص السني الدوري كل ستة أشهر للمحافظة على صحة الفم والوقاية من المشكلات قبل ظهورها.'],
    // Medication guidance sentence
    [/Patients can expect professional guidance on dosage, drug interactions, and safe storage of medications\./g,
     'يمكن للمرضى توقع إرشادات مهنية حول الجرعات والتفاعلات الدوائية والتخزين الآمن للأدوية.'],
    // Professional guidance
    [/Patients can contact the facility directly for service details and availability\./g,
     'يمكن للمرضى التواصل مع المنشأة مباشرةً للاستفسار عن تفاصيل الخدمات والإتاحة.']
  ];

  for (const [pattern, replacement] of sentenceMap) {
    if (typeof replacement === 'function') {
      ar = ar.replace(pattern, replacement);
    } else {
      ar = ar.replace(pattern, replacement);
    }
  }

  // Now replace the opening "[Name] is a [type] located in [location]." pattern
  const openingPattern = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' is an? (.+?) located in (.+?)\\.', '');
  const openingMatch = ar.match(openingPattern);
  if (openingMatch) {
    const typeEn = openingMatch[1].trim();
    const locEn = openingMatch[2].trim();
    const typeAr = facilityTypeMap[typeEn] || typeEn;
    ar = ar.replace(openingPattern, `${name} هو/هي ${typeAr} تقع في ${locEn}.`);
  }

  return ar;
}

// ============================================================
// PROCESS PROVIDERS 9860-9999
// ============================================================
const chunk = data.slice(9860, 10000);
const newEntries = {};

chunk.forEach((provider, i) => {
  const idx = (i + 9860).toString();
  const name = provider.name;
  const desc = provider.description;
  const rs = provider.reviewSummary;

  // Translate description
  const descAr = translateDescription(desc, name);

  // Translate reviewSummary
  const reviewSummaryAr = rs.map((s, j) => {
    if (!s || s === 'undefined') return null;
    const maps = [rs0Map, rs1Map, rs2Map, rs3Map];
    return maps[j] && maps[j][s] ? maps[j][s] : s;
  }).filter(s => s !== null);

  newEntries[idx] = {
    descriptionAr: descAr,
    reviewSummaryAr: reviewSummaryAr
  };
});

// Merge with existing
const merged = Object.assign({}, existing, newEntries);

// Sort by numeric key
const sorted = {};
Object.keys(merged).sort((a, b) => parseInt(a) - parseInt(b)).forEach(k => {
  sorted[k] = merged[k];
});

fs.writeFileSync(
  path.join(__dirname, 'arabic-chunks/ar-9000-9999.json'),
  JSON.stringify(sorted, null, 2),
  'utf8'
);

console.log('Done. Total entries:', Object.keys(sorted).length);
console.log('New entries added:', Object.keys(newEntries).length);
console.log('Sample 9860:', JSON.stringify(sorted['9860'], null, 2).substring(0, 300));
