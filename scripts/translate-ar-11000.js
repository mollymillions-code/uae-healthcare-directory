// Direct Arabic translation script for providers 11000-12518
// All translations written directly - no API calls

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/providers-scraped.json'), 'utf8'));
const slice = data.slice(11000, 12519);

// ─── REVIEW SENTENCE TRANSLATIONS ──────────────────────────────────────────
const reviewMap = {
  "The medical team is professional, caring, and clearly experienced.":
    "الفريق الطبي محترف ومتعاطف وذو خبرة واضحة.",
  "Follow-up communication was prompt and genuinely helpful.":
    "كانت المتابعة سريعة ومفيدة حقاً.",
  "Staff speak Arabic and English fluently, which made communication easy.":
    "يتحدث الموظفون العربية والإنجليزية بطلاقة مما سهّل التواصل.",
  "Public reviews are still building at this stage; the facility is licensed and operational.":
    "لا تزال التقييمات العامة في مراحلها الأولى؛ المنشأة مرخصة وتعمل بشكل كامل.",
  "No patient reviews are available yet; contact the facility directly for details.":
    "لا تتوفر تقييمات مرضى حتى الآن؛ يُرجى التواصل مع المنشأة مباشرةً للمزيد من التفاصيل.",
  "Early stage for online reviews; confirmed as active and licensed by DOH Abu Dhabi.":
    "في مرحلة مبكرة من التقييمات الإلكترونية؛ مؤكد أنها نشطة ومرخصة من DOH أبوظبي.",
  "Community feedback is limited so far; verified by DOH Abu Dhabi.":
    "تقييمات المجتمع محدودة حتى الآن؛ تم التحقق منها من قِبل DOH أبوظبي.",
  "Always reliable for regular prescriptions and the team is genuinely welcoming.":
    "موثوقة دائماً للوصفات الطبية المعتادة والفريق ترحيبي بحق.",
  "The pharmacists answered every question clearly and patiently.":
    "أجاب الصيادلة على كل سؤال بوضوح وصبر.",
  "Staff are knowledgeable and take time to explain medications without rushing.":
    "الموظفون على دراية جيدة ويأخذون وقتهم في شرح الأدوية دون تسرع.",
  "Clean, organized space with helpful staff who speak both Arabic and English.":
    "مكان نظيف ومنظم وموظفون متعاونون يتحدثون العربية والإنجليزية.",
  "Quick service and well-stocked shelves, even for less common prescriptions.":
    "خدمة سريعة ورفوف مجهزة جيداً حتى للوصفات الطبية غير الشائعة.",
  "A dependable option for the local community with consistent quality.":
    "خيار موثوق لأبناء المجتمع المحلي مع جودة ثابتة.",
  "Doctors are attentive and take time to explain diagnoses clearly.":
    "الأطباء منتبهون ويأخذون الوقت الكافي لشرح التشخيص بوضوح.",
  "The eye test was thorough and the optometrist explained the results clearly.":
    "كان فحص النظر شاملاً وأوضح أخصائي البصريات النتائج بجلاء.",
  "Friendly staff helped find the right frames and got the prescription exactly right.":
    "ساعدنا الموظفون الودودون في اختيار الإطار المناسب وضبط الوصفة بدقة.",
  "Good selection of frames and lenses at fair, transparent prices.":
    "تشكيلة جيدة من الإطارات والعدسات بأسعار عادلة وشفافة.",
  "Glasses were ready sooner than expected and the fit is perfect.":
    "كانت النظارة جاهزة قبل الموعد المتوقع والمقاس مثالي.",
  "The team was patient and helped consider all the options without pressure.":
    "كان الفريق صبوراً وساعد في النظر في جميع الخيارات دون ضغط.",
  "Booking an appointment was straightforward and the team was punctual.":
    "حجز الموعد كان سهلاً والفريق كان منضبطاً في المواعيد.",
  "Reception staff are welcoming and the clinic runs smoothly.":
    "موظفو الاستقبال مرحّبون والعيادة تسير بانسيابية.",
  "Accurate, timely results that the doctor could act on right away.":
    "نتائج دقيقة وفي الوقت المناسب تمكّن الطبيب من التصرف فوراً.",
  "The lab team was professional and made the process comfortable.":
    "كان فريق المختبر محترفاً وجعل الإجراء مريحاً.",
  "Clean facility with courteous staff and an organized workflow.":
    "منشأة نظيفة بموظفين مهذبين وعمل منظم.",
  "Reassuring to know qualified medical help is present on campus.":
    "من المطمئن معرفة وجود مساعدة طبية مؤهلة داخل الحرم المدرسي.",
  "Fast, calm response when my child needed care during the school day.":
    "استجابة سريعة وهادئة حين احتاج طفلي للرعاية خلال اليوم الدراسي.",
  "Health assessments were handled efficiently with clear communication.":
    "جرى التعامل مع الفحوصات الصحية بكفاءة مع تواصل واضح.",
  "The dentist was gentle and thorough, explaining each step of the treatment.":
    "كان طبيب الأسنان لطيفاً ودقيقاً وشرح كل خطوة من خطوات العلاج.",
  "My child was made to feel comfortable throughout the whole visit.":
    "شعر طفلي بالارتياح التام طوال فترة الزيارة.",
  "Walked in anxious and left feeling completely reassured by the team.":
    "دخلت قلقاً وخرجت وأنا مطمئن تماماً بفضل الفريق.",
  "Results matched what was discussed and follow-up care was excellent.":
    "تطابقت النتائج مع ما نوقش وكانت متابعة الرعاية ممتازة.",
  "The nurse is caring, attentive, and keeps parents well informed.":
    "الممرضة عطوفة ومنتبهة وتُبقي الأهل على اطلاع دائم.",
  "The clinic managed an emergency calmly and the team was very reassuring.":
    "تعاملت العيادة مع الطارئ بهدوء وكان الفريق مطمئناً للغاية.",
  "The consultation was thorough and all our questions received real answers.":
    "كانت الاستشارة شاملة وتلقت جميع أسئلتنا إجابات حقيقية.",
  "Doctors explained every option clearly and helped us feel less overwhelmed.":
    "أوضح الأطباء كل الخيارات بجلاء وساعدونا على الشعور بتوتر أقل.",
  "A difficult journey made more manageable by a professional and caring team.":
    "رحلة صعبة أصبحت أكثر قابلية للتحمل بفضل فريق محترف ومتعاطف.",
  "Clean facilities and compassionate staff who genuinely care about outcomes.":
    "مرافق نظيفة وكادر متعاطف يهتم حقاً بنتائج المرضى.",
  "Staff explained every exercise and tracked progress carefully across visits.":
    "شرح الموظفون كل تمرين وتابعوا التقدم بعناية عبر الزيارات.",
  "The physiotherapist designed a program that made a real difference to recovery.":
    "صمّم أخصائي العلاج الطبيعي برنامجاً أحدث فرقاً حقيقياً في التعافي.",
  "A supportive environment that made the recovery process feel manageable.":
    "بيئة داعمة جعلت عملية التعافي تبدو قابلة للإدارة.",
  "Consistent, professional sessions that helped recovery progress faster than expected.":
    "جلسات ثابتة ومحترفة ساعدت على تسريع التعافي أكثر مما كان متوقعاً.",
  "Clean, well-organized facility with manageable waiting times.":
    "منشأة نظيفة ومنظمة جيداً مع أوقات انتظار معقولة.",
  "Professional staff with modern equipment and short waiting times.":
    "كادر محترف بمعدات حديثة وأوقات انتظار قصيرة.",
  "The most accessible clinic in the neighborhood for routine care.":
    "الأسهل وصولاً في الحي لرعاية الحالات الروتينية.",
  "Reasonable waiting times and consistently polite staff.":
    "أوقات انتظار معقولة وموظفون مهذبون باستمرار.",
  "Efficient referral process and doctors who clearly care about patients.":
    "إجراءات إحالة فعّالة وأطباء يهتمون بوضوح برفاهية المرضى.",
  "The GP took time to listen and never made the visit feel rushed.":
    "أخذ الطبيب العام وقته في الاستماع ولم يجعل الزيارة تبدو متسرعة أبداً.",
  "Great for regular checkups and chronic condition management.":
    "ممتاز للفحوصات الدورية وإدارة الأمراض المزمنة.",
  "Wait times can be long during peak hours; calling ahead is advisable.":
    "قد تطول أوقات الانتظار في أوقات الذروة؛ يُنصح بالاتصال مسبقاً.",
  "Service quality can vary; confirming appointment details in advance is wise.":
    "قد تتفاوت جودة الخدمة؛ يُستحسن تأكيد تفاصيل الموعد مسبقاً.",
  "The team is professional but the facility can get busy at certain times.":
    "الفريق محترف لكن المنشأة قد تكون مزدحمة في أوقات معينة.",
  "Post-operative home support made recovery far more comfortable.":
    "جعلت الرعاية المنزلية بعد العملية التعافي أكثر راحة بكثير.",
  "The nurses who visited were skilled, punctual, and kind throughout.":
    "الممرضات اللواتي زرن كنّ ماهرات ومنضبطات ولطيفات طوال الوقت.",
  "The physiotherapist who came to us was highly professional and encouraging.":
    "أخصائي العلاج الطبيعي الذي جاء إلينا كان محترفاً للغاية ومشجعاً.",
  "Care coordination was smooth and the team maintained regular contact.":
    "كان تنسيق الرعاية سلساً وحافظ الفريق على تواصل منتظم.",
  "Reliable service that avoided unnecessary hospital readmissions.":
    "خدمة موثوقة أسهمت في تجنب إعادة الدخول إلى المستشفى دون داعٍ.",
  "The program was adjusted as strength improved, keeping treatment on track.":
    "جرى تعديل البرنامج مع تحسن القدرة الجسدية للمحافظة على مسار العلاج.",
  "Some patients have noted room for improvement in scheduling and wait times.":
    "أشار بعض المرضى إلى إمكانية تحسين الجدولة وأوقات الانتظار.",
  "Mixed feedback online, though most patients mention accessible and helpful staff.":
    "تباينت التقييمات على الإنترنت، غير أن معظم المرضى يُشيرون إلى طاقم متاح ومتعاون.",
  "The lab produced excellent quality crowns with a fast turnaround.":
    "أنتج المختبر تيجاناً بجودة ممتازة في وقت تسليم قصير.",
  "A dependable partner for our dental practice with consistent finish quality.":
    "شريك موثوق لعيادتنا السنية مع جودة تشطيب ثابتة.",
  "Quality prosthetics delivered on schedule, meeting our clinical specifications.":
    "تعويضات تثبيت عالية الجودة سُلّمت في الموعد المحدد وفق مواصفاتنا السريرية.",
  "The specialist consultants were knowledgeable and took real time with patients.":
    "كان الاستشاريون المتخصصون على دراية واسعة وأولوا المرضى اهتماماً حقيقياً.",
  "Nursing staff were attentive and made a stressful situation much easier.":
    "كان طاقم التمريض يقظاً وجعل الموقف الضاغط أكثر سهولة بكثير.",
  "Post-discharge follow-up was proactive and genuinely reassuring.":
    "كانت متابعة ما بعد الخروج استباقية ومطمئنة بحق.",
  "Clean wards and well-organized processes from admission through discharge.":
    "أجنحة نظيفة وإجراءات منظمة جيداً من الدخول حتى الخروج.",
  "Easy to book, smooth from arrival to receiving the report.":
    "سهل الحجز وسلس من الوصول حتى استلام التقرير.",
  "Results were ready faster than expected and clearly communicated.":
    "كانت النتائج جاهزة أسرع مما كان متوقعاً وأُبلغت بوضوح.",
  "Coordination was efficient and the team responded quickly to requests.":
    "كان التنسيق فعّالاً واستجاب الفريق بسرعة للطلبات.",
  "The team kept all parties informed and resolved issues quickly.":
    "أبقى الفريق جميع الأطراف على اطلاع وحل المشكلات بسرعة.",
  "Scheduling and logistics were handled professionally throughout.":
    "جرى التعامل مع الجدولة واللوجستيات باحترافية طوال الوقت.",
  "The medical team acted quickly and explained every decision clearly.":
    "تصرف الفريق الطبي بسرعة وأوضح كل قرار بجلاء.",
  "A reliable provider that understands operational healthcare delivery.":
    "مزود موثوق يفهم طبيعة تقديم الرعاية الصحية التشغيلية.",
  "Noticeable improvement after just a few sessions.":
    "تحسن ملحوظ بعد جلسات قليلة فحسب.",
  "Clean, calm environment that genuinely feels therapeutic.":
    "بيئة نظيفة وهادئة تبث الشعور الحقيقي بالعلاج.",
  "Experienced practitioner who takes time to understand each patient's background.":
    "ممارس متمرس يأخذ وقته في فهم خلفية كل مريض.",
  "Precise workmanship and clear communication with our referring clinic.":
    "حِرفية دقيقة وتواصل واضح مع عيادتنا المُحيلة.",
  "The team kept us informed and supported at every stage of the process.":
    "أبقانا الفريق على اطلاع ودعمنا في كل مرحلة من مراحل العملية.",
  "The treatment was professional and the results were better than expected.":
    "كان العلاج احترافياً وكانت النتائج أفضل مما كان متوقعاً.",
  "Every step was explained and the practitioner checked comfort throughout.":
    "شُرحت كل خطوة وتحقق الممارس من مستوى الراحة طوال الجلسة.",
  "Finally found a centre that takes hearing concerns seriously.":
    "وجدت أخيراً مركزاً يتعامل مع مشكلات السمع بجدية.",
  "Follow-up appointments were easy to arrange and made a noticeable difference.":
    "كانت مواعيد المتابعة سهلة الترتيب وأحدثت فرقاً ملحوظاً.",
  "The audiologist was thorough and explained hearing test results very clearly.":
    "كان أخصائي السمع دقيقاً وشرح نتائج اختبار السمع بوضوح تام.",
  "Experienced in both adult and pediatric assessments, with no rush.":
    "متمرس في تقييمات البالغين والأطفال على حد سواء، دون أي تسرع.",
  "Hearing aid fitting was handled with real patience and genuine expertise.":
    "جرى تركيب المعينة السمعية بصبر حقيقي وخبرة أصيلة.",
  "The team arrived on time and made the whole experience easy.":
    "وصل الفريق في الوقت المحدد وجعل التجربة بأكملها سلسة.",
  "Appreciated getting checked without having to travel to a clinic.":
    "أقدّر إمكانية الفحص دون الحاجة إلى التنقل إلى عيادة.",
  "A welcome initiative that brings healthcare directly to the community.":
    "مبادرة مرحّب بها تجلب الرعاية الصحية مباشرة إلى المجتمع.",
  "The consultation was smooth and the doctor was genuinely attentive.":
    "سارت الاستشارة بسلاسة وكان الطبيب منتبهاً بحق.",
  "Spoke to a doctor within minutes and had a prescription the same day.":
    "تحدثت مع الطبيب خلال دقائق وحصلت على وصفة طبية في نفس اليوم.",
  "Saved hours of travel time with no drop in the quality of care received.":
    "وفّرت ساعات من وقت التنقل دون أي تراجع في جودة الرعاية.",
  "Very convenient for follow-ups that do not need an in-person clinic visit.":
    "مريح جداً للمتابعات التي لا تستلزم زيارة العيادة شخصياً.",
  "Easy to use and the medical advice was practical and specific.":
    "سهل الاستخدام والنصائح الطبية كانت عملية ومحددة.",
  "Staff were friendly and the process moved faster than expected.":
    "كان الموظفون ودودين وسار الإجراء أسرع مما كان متوقعاً.",
  "Efficient health screening with a professional and approachable team.":
    "فحص صحي فعّال مع فريق محترف وسهل التعامل."
};

// ─── DESCRIPTION SENTENCE TRANSLATIONS ────────────────────────────────────

function translateDescription(desc) {
  if (!desc) return '';

  let result = desc;

  // ── Facility type labels (include trailing " in" to avoid duplication) ────
  result = result.replace(/\bis a medical centre in\b/g, 'مركز طبي في');
  result = result.replace(/\bis a dental centre in\b/g, 'مركز طب أسنان في');
  result = result.replace(/\bis a dental clinic in\b/g, 'عيادة أسنان في');
  result = result.replace(/\bis a school clinic in\b/g, 'عيادة مدرسية في');
  result = result.replace(/\bis a outpatient pharmacy in\b/g, 'صيدلية للمرضى الخارجيين في');
  result = result.replace(/\bis a inpatient pharmacy in\b/g, 'صيدلية للمرضى الداخليين في');
  result = result.replace(/\bis a pharmacy and drug store in\b/g, 'صيدلية ومستودع أدوية في');
  result = result.replace(/\bis a 24-hour pharmacy in\b/g, 'صيدلية على مدار الساعة في');
  result = result.replace(/\bis a pharmacy in\b/g, 'صيدلية في');
  result = result.replace(/\bis a optical centre in\b/g, 'مركز بصريات في');
  result = result.replace(/\bis a day surgery centre in\b/g, 'مركز جراحة يوم في');
  result = result.replace(/\bis a dental laboratory in\b/g, 'مختبر أسنان في');
  result = result.replace(/\bis a first aid post in\b/g, 'نقطة إسعاف أولية في');
  result = result.replace(/\bis a diagnostic imaging and laboratory centre in\b/g, 'مركز تصوير تشخيصي ومختبر في');
  result = result.replace(/\bis a physiotherapy centre in\b/g, 'مركز علاج طبيعي في');
  result = result.replace(/\bis a specialist clinic in\b/g, 'عيادة متخصصة في');
  result = result.replace(/\bis a fertility centre in\b/g, 'مركز خصوبة في');
  result = result.replace(/\bis a home health care provider in\b/g, 'مزود رعاية صحية منزلية في');
  result = result.replace(/\bis a telemedicine provider in\b/g, 'مزود طب عن بُعد في');
  result = result.replace(/\bis a hearing centre in\b/g, 'مركز سمعيات في');
  result = result.replace(/\bis a polyclinic in\b/g, 'عيادة جامعة في');
  result = result.replace(/\bis a hospital in\b/g, 'مستشفى في');
  result = result.replace(/\bis a clinic in\b/g, 'عيادة في');
  result = result.replace(/\bis a health centre in\b/g, 'مركز صحي في');
  result = result.replace(/\bis a primary health care centre in\b/g, 'مركز رعاية صحية أولية في');
  result = result.replace(/\bis a community pharmacy in\b/g, 'صيدلية مجتمعية في');
  result = result.replace(/\bis a specialist medical centre in\b/g, 'مركز طبي متخصص في');
  result = result.replace(/\bis a rehabilitation centre in\b/g, 'مركز إعادة تأهيل في');
  result = result.replace(/\bis a dialysis centre in\b/g, 'مركز غسيل كلى في');
  result = result.replace(/\bis a radiology centre in\b/g, 'مركز أشعة في');
  result = result.replace(/\bis a blood bank in\b/g, 'بنك دم في');
  result = result.replace(/\bis a health screening centre in\b/g, 'مركز فحص صحي في');
  // Generic fallback for any remaining facility types
  result = result.replace(/\bis a ([^,\.]+?) in\b/g, (m, ftype) => ftype + ' في');

  // Keep: UAE, licensed by DOH Abu Dhabi / DOH / DHA / MOHAP
  // Keep ratings, phone numbers, insurance names

  // ── Rating sentences ──────────────────────────────────────────────────────
  result = result.replace(
    /It carries a ([\d.]+)-star rating from ([\d,]+) patient reviews on Google\./g,
    'حصلت على تقييم $1 نجوم من $2 تقييم مريض على Google.'
  );
  result = result.replace(
    /It carries a ([\d.]+)-star rating from ([\d,]+) patient reviews on Google\b/g,
    'حصلت على تقييم $1 نجوم من $2 تقييم مريض على Google'
  );
  result = result.replace(
    /A ([\d.]+)-star Google rating from ([\d,]+) patient reviews reflects consistent positive feedback\./g,
    'يعكس تقييم $1 نجوم على Google من $2 مريض إشادة إيجابية ثابتة.'
  );
  result = result.replace(
    /A ([\d.]+)-star Google rating from ([\d,]+) patient reviews reflects consistent positive feedback\b/g,
    'يعكس تقييم $1 نجوم على Google من $2 مريض إشادة إيجابية ثابتة'
  );
  result = result.replace(
    /With a ([\d.]+)-star rating from ([\d,]+) patient reviews on Google, it is among the most trusted facilities in the area\./g,
    'بتقييم $1 نجوم من $2 مريض على Google، تُعدّ من أكثر المنشآت موثوقيةً في المنطقة.'
  );
  result = result.replace(
    /With a ([\d.]+)-star rating from ([\d,]+) patient reviews on Google, it is among the most trusted facilities in the area\b/g,
    'بتقييم $1 نجوم من $2 مريض على Google، تُعدّ من أكثر المنشآت موثوقيةً في المنطقة'
  );
  result = result.replace(
    /It holds a strong ([\d.]+)-star rating from ([\d,]+) patient reviews on Google\./g,
    'تتمتع بتقييم قوي بلغ $1 نجوم من $2 مريض على Google.'
  );
  result = result.replace(
    /It holds a strong ([\d.]+)-star rating from ([\d,]+) patient reviews on Google\b/g,
    'تتمتع بتقييم قوي بلغ $1 نجوم من $2 مريض على Google'
  );
  result = result.replace(
    /It holds a ([\d.]+)-star rating on Google based on patient feedback\./g,
    'تحمل تقييماً بلغ $1 نجوم على Google بناءً على آراء المرضى.'
  );
  result = result.replace(
    /It holds a ([\d.]+)-star rating on Google based on patient feedback\b/g,
    'تحمل تقييماً بلغ $1 نجوم على Google بناءً على آراء المرضى'
  );
  result = result.replace(
    /Patients have rated it ([\d.]+) out of 5 stars on Google\./g,
    'قيّمها المرضى بـ $1 من 5 نجوم على Google.'
  );
  result = result.replace(
    /Patients have rated it ([\d.]+) out of 5 stars on Google\b/g,
    'قيّمها المرضى بـ $1 من 5 نجوم على Google'
  );
  result = result.replace(
    /Patients have rated it ([\d.]+) out of 5 from ([\d,]+) reviews on Google\./g,
    'قيّمها المرضى بـ $1 من 5 استناداً إلى $2 تقييم على Google.'
  );
  result = result.replace(
    /Patients have rated it ([\d.]+) out of 5 from ([\d,]+) reviews on Google\b/g,
    'قيّمها المرضى بـ $1 من 5 استناداً إلى $2 تقييم على Google'
  );
  result = result.replace(
    /Patients have given it ([\d.]+) out of 5 stars on Google\./g,
    'منح المرضى هذه المنشأة $1 من 5 نجوم على Google.'
  );
  result = result.replace(
    /Patients have given it ([\d.]+) out of 5 stars on Google\b/g,
    'منح المرضى هذه المنشأة $1 من 5 نجوم على Google'
  );
  result = result.replace(
    /Patients have given it ([\d.]+) out of 5 on Google\./g,
    'منح المرضى هذه المنشأة $1 من 5 على Google.'
  );
  result = result.replace(
    /Patients have given it ([\d.]+) out of 5 on Google\b/g,
    'منح المرضى هذه المنشأة $1 من 5 على Google'
  );

  // ── Medical centre sentences ──────────────────────────────────────────────
  result = result.replace(
    /Outpatient consultations are available across a range of general and specialist medical needs\./g,
    'تتوفر استشارات للمرضى الخارجيين في مجموعة من الاحتياجات الطبية العامة والتخصصية.'
  );
  result = result.replace(
    /Outpatient consultations are available across a range of general and specialist medical needs\b/g,
    'تتوفر استشارات للمرضى الخارجيين في مجموعة من الاحتياجات الطبية العامة والتخصصية'
  );
  result = result.replace(
    /Physicians conduct assessments, order investigations, and coordinate treatment and referrals in line with DOH Abu Dhabi clinical standards\./g,
    'يُجري الأطباء التقييمات ويطلبون الفحوصات وينسقون العلاج والإحالات وفقاً للمعايير السريرية لـ DOH أبوظبي.'
  );
  result = result.replace(
    /Physicians conduct assessments, order investigations, and coordinate treatment and referrals in line with DOH Abu Dhabi clinical standards\b/g,
    'يُجري الأطباء التقييمات ويطلبون الفحوصات وينسقون العلاج والإحالات وفقاً للمعايير السريرية لـ DOH أبوظبي'
  );
  result = result.replace(
    /Physicians conduct assessments, order investigations, and coordinate treatment and referrals in line with DHA clinical standards\./g,
    'يُجري الأطباء التقييمات ويطلبون الفحوصات وينسقون العلاج والإحالات وفقاً للمعايير السريرية لـ DHA.'
  );
  result = result.replace(
    /Physicians conduct assessments, order investigations, and coordinate treatment and referrals in line with DHA clinical standards\b/g,
    'يُجري الأطباء التقييمات ويطلبون الفحوصات وينسقون العلاج والإحالات وفقاً للمعايير السريرية لـ DHA'
  );
  result = result.replace(
    /The team works to ensure each patient leaves with a clear understanding of their diagnosis and next steps\./g,
    'يعمل الفريق على ضمان مغادرة كل مريض وهو يمتلك فهماً واضحاً لتشخيصه والخطوات التالية.'
  );
  result = result.replace(
    /The team works to ensure each patient leaves with a clear understanding of their diagnosis and next steps\b/g,
    'يعمل الفريق على ضمان مغادرة كل مريض وهو يمتلك فهماً واضحاً لتشخيصه والخطوات التالية'
  );

  // ── Pharmacy sentences ────────────────────────────────────────────────────
  result = result.replace(
    /The pharmacy stocks prescription medications, generic alternatives, over-the-counter treatments, vitamins, and a range of health and wellness products\./g,
    'تتوفر في الصيدلية الأدوية المستلزمة لوصفة طبية والبدائل الجنيسة والعلاجات المتاحة دون وصفة والفيتامينات ومنتجات الصحة والعافية.'
  );
  result = result.replace(
    /The pharmacy stocks prescription medications, generic alternatives, over-the-counter treatments, vitamins, and a range of health and wellness products\b/g,
    'تتوفر في الصيدلية الأدوية المستلزمة لوصفة طبية والبدائل الجنيسة والعلاجات المتاحة دون وصفة والفيتامينات ومنتجات الصحة والعافية'
  );
  result = result.replace(
    /Open around the clock every day of the week, the pharmacy stocks prescription medications, generic alternatives, over-the-counter treatments, vitamins, and a range of health and wellness products\./g,
    'مفتوحة على مدار الساعة طوال أيام الأسبوع، وتتوفر فيها الأدوية المستلزمة لوصفة طبية والبدائل الجنيسة والعلاجات المتاحة دون وصفة والفيتامينات ومنتجات الصحة والعافية.'
  );
  result = result.replace(
    /Open around the clock every day of the week, the pharmacy stocks prescription medications, generic alternatives, over-the-counter treatments, vitamins, and a range of health and wellness products\b/g,
    'مفتوحة على مدار الساعة طوال أيام الأسبوع، وتتوفر فيها الأدوية المستلزمة لوصفة طبية والبدائل الجنيسة والعلاجات المتاحة دون وصفة والفيتامينات ومنتجات الصحة والعافية'
  );
  result = result.replace(
    /Qualified pharmacists are on hand to dispense prescriptions, advise on drug interactions and dosage, and answer general health queries from patients and caregivers\./g,
    'يتوفر صيادلة مؤهلون لصرف الوصفات الطبية وتقديم المشورة بشأن التفاعلات الدوائية والجرعات والإجابة عن الاستفسارات الصحية العامة للمرضى ومقدمي الرعاية.'
  );
  result = result.replace(
    /Qualified pharmacists are on hand to dispense prescriptions, advise on drug interactions and dosage, and answer general health queries from patients and caregivers\b/g,
    'يتوفر صيادلة مؤهلون لصرف الوصفات الطبية وتقديم المشورة بشأن التفاعلات الدوائية والجرعات والإجابة عن الاستفسارات الصحية العامة للمرضى ومقدمي الرعاية'
  );
  result = result.replace(
    /The pharmacist team is available at any hour to dispense prescriptions, advise on drug interactions and dosage, and assist with urgent medication needs\./g,
    'يتوفر فريق الصيادلة في أي وقت لصرف الوصفات الطبية وتقديم المشورة بشأن التفاعلات الدوائية والجرعات ومعالجة الاحتياجات الدوائية العاجلة.'
  );
  result = result.replace(
    /The pharmacist team is available at any hour to dispense prescriptions, advise on drug interactions and dosage, and assist with urgent medication needs\b/g,
    'يتوفر فريق الصيادلة في أي وقت لصرف الوصفات الطبية وتقديم المشورة بشأن التفاعلات الدوائية والجرعات ومعالجة الاحتياجات الدوائية العاجلة'
  );
  result = result.replace(
    /The pharmacy serves inpatients at the associated hospital, dispensing prescribed medications accurately to support clinical care\./g,
    'تخدم الصيدلية مرضى الرقود في المستشفى المرتبطة به، وتصرف الأدوية الموصوفة بدقة لدعم الرعاية السريرية.'
  );
  result = result.replace(
    /The pharmacy serves inpatients at the associated hospital, dispensing prescribed medications accurately to support clinical care\b/g,
    'تخدم الصيدلية مرضى الرقود في المستشفى المرتبطة به، وتصرف الأدوية الموصوفة بدقة لدعم الرعاية السريرية'
  );
  result = result.replace(
    /The pharmacist team reviews medication orders for safety, checks for interactions, and advises clinical staff on drug selection and dosing throughout the admission\./g,
    'يراجع فريق الصيادلة طلبات الدواء للتحقق من السلامة ويفحص التفاعلات الدوائية ويستشير الطاقم السريري في اختيار الدواء وجرعاته طوال فترة الإقامة.'
  );
  result = result.replace(
    /The pharmacist team reviews medication orders for safety, checks for interactions, and advises clinical staff on drug selection and dosing throughout the admission\b/g,
    'يراجع فريق الصيادلة طلبات الدواء للتحقق من السلامة ويفحص التفاعلات الدوائية ويستشير الطاقم السريري في اختيار الدواء وجرعاته طوال فترة الإقامة'
  );

  // ── School clinic sentences ───────────────────────────────────────────────
  result = result.replace(
    /The clinic provides on-site first aid, routine health screenings, and medical referrals for enrolled students\./g,
    'تقدم العيادة الإسعافات الأولية في الموقع والفحوصات الصحية الروتينية والإحالات الطبية للطلاب المسجلين.'
  );
  result = result.replace(
    /The clinic provides on-site first aid, routine health screenings, and medical referrals for enrolled students\b/g,
    'تقدم العيادة الإسعافات الأولية في الموقع والفحوصات الصحية الروتينية والإحالات الطبية للطلاب المسجلين'
  );
  result = result.replace(
    /A licensed nurse or medical officer is present during school hours to manage minor injuries, acute illness, and parent communication\./g,
    'يتواجد ممرض أو ضابط طبي مرخص خلال ساعات الدراسة للتعامل مع الإصابات الطفيفة والأمراض الحادة والتواصل مع أولياء الأمور.'
  );
  result = result.replace(
    /A licensed nurse or medical officer is present during school hours to manage minor injuries, acute illness, and parent communication\b/g,
    'يتواجد ممرض أو ضابط طبي مرخص خلال ساعات الدراسة للتعامل مع الإصابات الطفيفة والأمراض الحادة والتواصل مع أولياء الأمور'
  );
  result = result.replace(
    /The clinic operates in line with DOH Abu Dhabi requirements for school health services in Abu Dhabi\./g,
    'تعمل العيادة وفق متطلبات DOH أبوظبي للخدمات الصحية المدرسية في أبوظبي.'
  );
  result = result.replace(
    /The clinic operates in line with DOH Abu Dhabi requirements for school health services in Abu Dhabi\b/g,
    'تعمل العيادة وفق متطلبات DOH أبوظبي للخدمات الصحية المدرسية في أبوظبي'
  );
  result = result.replace(
    /The clinic operates in line with DHA requirements for school health services in Dubai\./g,
    'تعمل العيادة وفق متطلبات DHA للخدمات الصحية المدرسية في دبي.'
  );
  result = result.replace(
    /The clinic operates in line with DHA requirements for school health services in Dubai\b/g,
    'تعمل العيادة وفق متطلبات DHA للخدمات الصحية المدرسية في دبي'
  );

  // ── First aid post sentences ──────────────────────────────────────────────
  result = result.replace(
    /The first aid post provides immediate care for minor injuries and acute medical events within the facility or venue it serves\./g,
    'تقدم نقطة الإسعاف الأولية رعاية فورية للإصابات الطفيفة والحوادث الطبية الحادة داخل المنشأة أو الموقع الذي تخدمه.'
  );
  result = result.replace(
    /The first aid post provides immediate care for minor injuries and acute medical events within the facility or venue it serves\b/g,
    'تقدم نقطة الإسعاف الأولية رعاية فورية للإصابات الطفيفة والحوادث الطبية الحادة داخل المنشأة أو الموقع الذي تخدمه'
  );
  result = result.replace(
    /Trained personnel manage initial assessments and stabilization before arranging transfer to a clinic or emergency department when required\./g,
    'يتولى الكادر المدرب التقييمات الأولية والإسعاف التثبيتي قبل ترتيب نقل المريض إلى عيادة أو قسم طوارئ عند الحاجة.'
  );
  result = result.replace(
    /Trained personnel manage initial assessments and stabilization before arranging transfer to a clinic or emergency department when required\b/g,
    'يتولى الكادر المدرب التقييمات الأولية والإسعاف التثبيتي قبل ترتيب نقل المريض إلى عيادة أو قسم طوارئ عند الحاجة'
  );

  // ── Optical centre sentences ──────────────────────────────────────────────
  result = result.replace(
    /The centre provides eye examinations, prescription glasses, contact lens fitting, and a wide selection of frames from established brands\./g,
    'يقدم المركز فحوصات العيون والنظارات الطبية وتركيب العدسات اللاصقة وتشكيلة واسعة من الإطارات من علامات تجارية رائدة.'
  );
  result = result.replace(
    /The centre provides eye examinations, prescription glasses, contact lens fitting, and a wide selection of frames from established brands\b/g,
    'يقدم المركز فحوصات العيون والنظارات الطبية وتركيب العدسات اللاصقة وتشكيلة واسعة من الإطارات من علامات تجارية رائدة'
  );
  result = result.replace(
    /Licensed optometrists conduct vision assessments and refer complex cases to ophthalmologists where clinically appropriate\./g,
    'يُجري أخصائيو البصريات المرخصون تقييمات الرؤية ويُحيلون الحالات المعقدة إلى أطباء العيون حين يقتضي الأمر سريرياً.'
  );
  result = result.replace(
    /Licensed optometrists conduct vision assessments and refer complex cases to ophthalmologists where clinically appropriate\b/g,
    'يُجري أخصائيو البصريات المرخصون تقييمات الرؤية ويُحيلون الحالات المعقدة إلى أطباء العيون حين يقتضي الأمر سريرياً'
  );
  result = result.replace(
    /The team offers follow-up support to ensure each prescription meets the patient's needs\./g,
    'يقدم الفريق دعم المتابعة لضمان توافق كل وصفة مع احتياجات المريض.'
  );
  result = result.replace(
    /The team offers follow-up support to ensure each prescription meets the patient's needs\b/g,
    'يقدم الفريق دعم المتابعة لضمان توافق كل وصفة مع احتياجات المريض'
  );

  // ── Dental sentences ──────────────────────────────────────────────────────
  result = result.replace(
    /The clinic delivers a full range of dental services including checkups, professional cleaning, fillings, extractions, root canal therapy, crowns, veneers, and teeth whitening\./g,
    'تقدم العيادة طيفاً كاملاً من خدمات طب الأسنان تشمل الفحوصات والتنظيف المهني والحشوات والخلع وعلاج قناة الجذر والتيجان والقشور وتبييض الأسنان.'
  );
  result = result.replace(
    /The clinic delivers a full range of dental services including checkups, professional cleaning, fillings, extractions, root canal therapy, crowns, veneers, and teeth whitening\b/g,
    'تقدم العيادة طيفاً كاملاً من خدمات طب الأسنان تشمل الفحوصات والتنظيف المهني والحشوات والخلع وعلاج قناة الجذر والتيجان والقشور وتبييض الأسنان'
  );
  result = result.replace(
    /Patients of all ages are welcome, from pediatric first visits to complex restorative cases\./g,
    'المرضى من جميع الأعمار مرحّب بهم، من أولى زيارات الأطفال إلى حالات الترميم المعقدة.'
  );
  result = result.replace(
    /Patients of all ages are welcome, from pediatric first visits to complex restorative cases\b/g,
    'المرضى من جميع الأعمار مرحّب بهم، من أولى زيارات الأطفال إلى حالات الترميم المعقدة'
  );
  result = result.replace(
    /Treatment options are discussed clearly with each patient before any procedure begins\./g,
    'تُناقَش خيارات العلاج بوضوح مع كل مريض قبل البدء بأي إجراء.'
  );
  result = result.replace(
    /Treatment options are discussed clearly with each patient before any procedure begins\b/g,
    'تُناقَش خيارات العلاج بوضوح مع كل مريض قبل البدء بأي إجراء'
  );

  // ── Lab / imaging sentences ───────────────────────────────────────────────
  result = result.replace(
    /Services cover medical imaging including digital X-ray and ultrasound, alongside a full clinical laboratory handling blood panels, cultures, and biochemistry\./g,
    'تشمل الخدمات التصوير الطبي بما في ذلك الأشعة السينية الرقمية والموجات فوق الصوتية، إلى جانب مختبر سريري متكامل يتولى تحليل الدم والمزارع والكيمياء الحيوية.'
  );
  result = result.replace(
    /Services cover medical imaging including digital X-ray and ultrasound, alongside a full clinical laboratory handling blood panels, cultures, and biochemistry\b/g,
    'تشمل الخدمات التصوير الطبي بما في ذلك الأشعة السينية الرقمية والموجات فوق الصوتية، إلى جانب مختبر سريري متكامل يتولى تحليل الدم والمزارع والكيمياء الحيوية'
  );
  result = result.replace(
    /Radiologists report all imaging studies and laboratory scientists process samples under strict quality controls, with results communicated promptly to referring doctors\./g,
    'يُصدر أخصائيو الأشعة تقارير جميع الدراسات التصويرية ويعالج علماء المختبر العينات وفق ضوابط جودة صارمة مع إبلاغ النتائج بسرعة للأطباء المُحيلين.'
  );
  result = result.replace(
    /Radiologists report all imaging studies and laboratory scientists process samples under strict quality controls, with results communicated promptly to referring doctors\b/g,
    'يُصدر أخصائيو الأشعة تقارير جميع الدراسات التصويرية ويعالج علماء المختبر العينات وفق ضوابط جودة صارمة مع إبلاغ النتائج بسرعة للأطباء المُحيلين'
  );

  // ── Physiotherapy sentences ───────────────────────────────────────────────
  result = result.replace(
    /The centre offers physiotherapy, manual therapy, and targeted rehabilitation programs for patients recovering from musculoskeletal injuries, post-surgical conditions, and chronic pain\./g,
    'يقدم المركز العلاج الطبيعي والعلاج اليدوي وبرامج إعادة التأهيل الموجهة للمرضى الذين يتعافون من إصابات الجهاز العضلي الهيكلي والحالات ما بعد الجراحة والألم المزمن.'
  );
  result = result.replace(
    /The centre offers physiotherapy, manual therapy, and targeted rehabilitation programs for patients recovering from musculoskeletal injuries, post-surgical conditions, and chronic pain\b/g,
    'يقدم المركز العلاج الطبيعي والعلاج اليدوي وبرامج إعادة التأهيل الموجهة للمرضى الذين يتعافون من إصابات الجهاز العضلي الهيكلي والحالات ما بعد الجراحة والألم المزمن'
  );
  result = result.replace(
    /Certified physiotherapists design individualized treatment plans and track outcomes across follow-up sessions, adjusting protocols as the patient's condition improves\./g,
    'يضع أخصائيو العلاج الطبيعي المعتمدون خططاً علاجية فردية ويتابعون النتائج عبر جلسات المتابعة، مع تعديل البروتوكولات بتحسن حالة المريض.'
  );
  result = result.replace(
    /Certified physiotherapists design individualized treatment plans and track outcomes across follow-up sessions, adjusting protocols as the patient's condition improves\b/g,
    'يضع أخصائيو العلاج الطبيعي المعتمدون خططاً علاجية فردية ويتابعون النتائج عبر جلسات المتابعة، مع تعديل البروتوكولات بتحسن حالة المريض'
  );

  // ── Specialist clinic sentences ───────────────────────────────────────────
  result = result.replace(
    /The clinic focuses on a defined medical specialty, providing outpatient consultations, targeted investigations, and treatment protocols managed by consultants in that field\./g,
    'تتخصص العيادة في تخصص طبي محدد وتقدم استشارات للمرضى الخارجيين وفحوصات موجهة وبروتوكولات علاجية يديرها مستشارون في هذا المجال.'
  );
  result = result.replace(
    /The clinic focuses on a defined medical specialty, providing outpatient consultations, targeted investigations, and treatment protocols managed by consultants in that field\b/g,
    'تتخصص العيادة في تخصص طبي محدد وتقدم استشارات للمرضى الخارجيين وفحوصات موجهة وبروتوكولات علاجية يديرها مستشارون في هذا المجال'
  );
  result = result.replace(
    /Physicians coordinate follow-up with referring doctors to ensure consistent management of each patient's condition\./g,
    'ينسق الأطباء المتابعة مع الأطباء المُحيلين لضمان الإدارة المتسقة لحالة كل مريض.'
  );
  result = result.replace(
    /Physicians coordinate follow-up with referring doctors to ensure consistent management of each patient's condition\b/g,
    'ينسق الأطباء المتابعة مع الأطباء المُحيلين لضمان الإدارة المتسقة لحالة كل مريض'
  );

  // ── Fertility sentences ───────────────────────────────────────────────────
  result = result.replace(
    /The centre provides a full range of fertility investigations and treatments including hormonal assessments, semen analysis, IUI, and IVF, supported by embryologists and reproductive specialists\./g,
    'يقدم المركز طيفاً كاملاً من فحوصات وعلاجات الخصوبة تشمل التقييمات الهرمونية وتحليل السائل المنوي والتلقيح الاصطناعي وأطفال الأنابيب، بدعم من أخصائيي الأجنة وخبراء الإنجاب.'
  );
  result = result.replace(
    /The centre provides a full range of fertility investigations and treatments including hormonal assessments, semen analysis, IUI, and IVF, supported by embryologists and reproductive specialists\b/g,
    'يقدم المركز طيفاً كاملاً من فحوصات وعلاجات الخصوبة تشمل التقييمات الهرمونية وتحليل السائل المنوي والتلقيح الاصطناعي وأطفال الأنابيب، بدعم من أخصائيي الأجنة وخبراء الإنجاب'
  );
  result = result.replace(
    /Patient counselling and emotional support are part of the care pathway from initial consultation through treatment completion\./g,
    'الإرشاد النفسي والدعم العاطفي جزء من مسار الرعاية من الاستشارة الأولى حتى اكتمال العلاج.'
  );
  result = result.replace(
    /Patient counselling and emotional support are part of the care pathway from initial consultation through treatment completion\b/g,
    'الإرشاد النفسي والدعم العاطفي جزء من مسار الرعاية من الاستشارة الأولى حتى اكتمال العلاج'
  );

  // ── Home care sentences ───────────────────────────────────────────────────
  result = result.replace(
    /The provider dispatches licensed nurses, physiotherapists, and care coordinators to patients' homes across the emirate, delivering post-discharge recovery support, chronic disease management, wound care, IV therapy, and rehabilitation\./g,
    'يُرسل المزود ممرضين مرخصين وأخصائيي علاج طبيعي ومنسقي رعاية إلى منازل المرضى في أرجاء الإمارة، لتقديم دعم التعافي بعد الخروج وإدارة الأمراض المزمنة ورعاية الجروح والعلاج الوريدي وإعادة التأهيل.'
  );
  result = result.replace(
    /The provider dispatches licensed nurses, physiotherapists, and care coordinators to patients' homes across the emirate, delivering post-discharge recovery support, chronic disease management, wound care, IV therapy, and rehabilitation\b/g,
    'يُرسل المزود ممرضين مرخصين وأخصائيي علاج طبيعي ومنسقي رعاية إلى منازل المرضى في أرجاء الإمارة، لتقديم دعم التعافي بعد الخروج وإدارة الأمراض المزمنة ورعاية الجروح والعلاج الوريدي وإعادة التأهيل'
  );
  result = result.replace(
    /All home care services are coordinated through a central team and delivered under the clinical oversight of licensed practitioners registered with the relevant health authority\./g,
    'تُنسَّق جميع خدمات الرعاية المنزلية عبر فريق مركزي وتُقدَّم تحت الإشراف السريري لممارسين مرخصين مسجلين لدى الجهة الصحية المختصة.'
  );
  result = result.replace(
    /All home care services are coordinated through a central team and delivered under the clinical oversight of licensed practitioners registered with the relevant health authority\b/g,
    'تُنسَّق جميع خدمات الرعاية المنزلية عبر فريق مركزي وتُقدَّم تحت الإشراف السريري لممارسين مرخصين مسجلين لدى الجهة الصحية المختصة'
  );

  // ── Telemedicine sentences ────────────────────────────────────────────────
  result = result.replace(
    /The platform connects patients with licensed doctors for video or phone consultations, enabling remote diagnosis, prescription issuance, and referrals without requiring an in-person clinic visit\./g,
    'تربط المنصة المرضى بأطباء مرخصين لإجراء استشارات عبر الفيديو أو الهاتف، مما يتيح التشخيص عن بُعد وإصدار الوصفات الطبية والإحالات دون الحاجة لزيارة العيادة شخصياً.'
  );
  result = result.replace(
    /The platform connects patients with licensed doctors for video or phone consultations, enabling remote diagnosis, prescription issuance, and referrals without requiring an in-person clinic visit\b/g,
    'تربط المنصة المرضى بأطباء مرخصين لإجراء استشارات عبر الفيديو أو الهاتف، مما يتيح التشخيص عن بُعد وإصدار الوصفات الطبية والإحالات دون الحاجة لزيارة العيادة شخصياً'
  );
  result = result.replace(
    /Consultations are conducted in Arabic and English and the service is accessible seven days a week\./g,
    'تُعقد الاستشارات باللغتين العربية والإنجليزية والخدمة متاحة سبعة أيام في الأسبوع.'
  );
  result = result.replace(
    /Consultations are conducted in Arabic and English and the service is accessible seven days a week\b/g,
    'تُعقد الاستشارات باللغتين العربية والإنجليزية والخدمة متاحة سبعة أيام في الأسبوع'
  );

  // ── Hearing centre sentences ──────────────────────────────────────────────
  result = result.replace(
    /The centre provides comprehensive hearing assessments, hearing aid fittings, and audiology services for patients of all ages, from pediatric screenings to adult audiological rehabilitation\./g,
    'يقدم المركز تقييمات سمعية شاملة وتركيب معينات سمعية وخدمات علم السمع لمرضى من جميع الأعمار، من الفحوصات الأطفال إلى إعادة التأهيل السمعي لدى البالغين.'
  );
  result = result.replace(
    /The centre provides comprehensive hearing assessments, hearing aid fittings, and audiology services for patients of all ages, from pediatric screenings to adult audiological rehabilitation\b/g,
    'يقدم المركز تقييمات سمعية شاملة وتركيب معينات سمعية وخدمات علم السمع لمرضى من جميع الأعمار، من الفحوصات الأطفال إلى إعادة التأهيل السمعي لدى البالغين'
  );
  result = result.replace(
    /Audiologists conduct diagnostic tests and fit and calibrate hearing aids, with follow-up sessions to ensure the device is performing optimally for each patient\./g,
    'يُجري أخصائيو السمع اختبارات تشخيصية ويُركّبون المعينات السمعية ويُعايرونها مع جلسات متابعة للتأكد من أداء الجهاز على النحو الأمثل لكل مريض.'
  );
  result = result.replace(
    /Audiologists conduct diagnostic tests and fit and calibrate hearing aids, with follow-up sessions to ensure the device is performing optimally for each patient\b/g,
    'يُجري أخصائيو السمع اختبارات تشخيصية ويُركّبون المعينات السمعية ويُعايرونها مع جلسات متابعة للتأكد من أداء الجهاز على النحو الأمثل لكل مريض'
  );

  // ── Dental lab sentences ──────────────────────────────────────────────────
  result = result.replace(
    /The laboratory produces dental prosthetics and restorations to order, including crowns, bridges, dentures, veneers, and implant components, for dental clinics and hospitals\./g,
    'ينتج المختبر تعويضات وترميمات الأسنان بناءً على الطلب، بما في ذلك التيجان والجسور والطقم الصناعي والقشور ومكونات الزرعات، لخدمة عيادات ومستشفيات طب الأسنان.'
  );
  result = result.replace(
    /The laboratory produces dental prosthetics and restorations to order, including crowns, bridges, dentures, veneers, and implant components, for dental clinics and hospitals\b/g,
    'ينتج المختبر تعويضات وترميمات الأسنان بناءً على الطلب، بما في ذلك التيجان والجسور والطقم الصناعي والقشور ومكونات الزرعات، لخدمة عيادات ومستشفيات طب الأسنان'
  );
  result = result.replace(
    /Dental technicians use precision materials and digital workflows to meet the clinical specifications provided by referring dentists\./g,
    'يستخدم تقنيو الأسنان مواد دقيقة وسير عمل رقمية لاستيفاء المواصفات السريرية التي يقدمها أطباء الأسنان المُحيلون.'
  );
  result = result.replace(
    /Dental technicians use precision materials and digital workflows to meet the clinical specifications provided by referring dentists\b/g,
    'يستخدم تقنيو الأسنان مواد دقيقة وسير عمل رقمية لاستيفاء المواصفات السريرية التي يقدمها أطباء الأسنان المُحيلون'
  );

  // ── Day surgery sentences ─────────────────────────────────────────────────
  result = result.replace(
    /The centre is equipped for a range of elective surgical procedures that do not require overnight admission, including minor orthopaedic, ophthalmic, general surgical, and endoscopic procedures\./g,
    'المركز مجهز لطيف من الإجراءات الجراحية الاختيارية التي لا تستلزم المبيت، بما في ذلك الإجراءات العظمية والعيون والجراحة العامة والتنظير البسيطة.'
  );
  result = result.replace(
    /The centre is equipped for a range of elective surgical procedures that do not require overnight admission, including minor orthopaedic, ophthalmic, general surgical, and endoscopic procedures\b/g,
    'المركز مجهز لطيف من الإجراءات الجراحية الاختيارية التي لا تستلزم المبيت، بما في ذلك الإجراءات العظمية والعيون والجراحة العامة والتنظير البسيطة'
  );
  result = result.replace(
    /Licensed surgeons, anaesthesiologists, and perioperative nurses deliver care from pre-assessment through to discharge and follow-up\./g,
    'يقدم الجراحون وأطباء التخدير والممرضون حول العملية الرعاية من التقييم السابق للعملية حتى الخروج والمتابعة.'
  );
  result = result.replace(
    /Licensed surgeons, anaesthesiologists, and perioperative nurses deliver care from pre-assessment through to discharge and follow-up\b/g,
    'يقدم الجراحون وأطباء التخدير والممرضون حول العملية الرعاية من التقييم السابق للعملية حتى الخروج والمتابعة'
  );

  // ── Primary health care sentences ─────────────────────────────────────────
  result = result.replace(
    /Services cover general medical consultations, preventive care, vaccination programs, antenatal health checks, chronic disease management, and community health initiatives\./g,
    'تشمل الخدمات الاستشارات الطبية العامة والرعاية الوقائية وبرامج التطعيم وفحوصات صحة الأمومة وإدارة الأمراض المزمنة والمبادرات الصحية المجتمعية.'
  );
  result = result.replace(
    /Services cover general medical consultations, preventive care, vaccination programs, antenatal health checks, chronic disease management, and community health initiatives\b/g,
    'تشمل الخدمات الاستشارات الطبية العامة والرعاية الوقائية وبرامج التطعيم وفحوصات صحة الأمومة وإدارة الأمراض المزمنة والمبادرات الصحية المجتمعية'
  );
  result = result.replace(
    /The centre plays a central role in primary care delivery for the surrounding community under the Abu Dhabi primary health care framework\./g,
    'يضطلع المركز بدور محوري في تقديم الرعاية الأولية لأبناء المجتمع المحيط في إطار منظومة الرعاية الصحية الأولية بأبوظبي.'
  );
  result = result.replace(
    /The centre plays a central role in primary care delivery for the surrounding community under the Abu Dhabi primary health care framework\b/g,
    'يضطلع المركز بدور محوري في تقديم الرعاية الأولية لأبناء المجتمع المحيط في إطار منظومة الرعاية الصحية الأولية بأبوظبي'
  );

  // ── Hospital sentences ────────────────────────────────────────────────────
  result = result.replace(
    /The hospital provides inpatient and outpatient medical and surgical services across multiple specialties, staffed by consultants and supported by a full range of diagnostic, pharmacy, and allied health services\./g,
    'تقدم المستشفى خدمات طبية وجراحية للمرضى الداخليين والخارجيين عبر تخصصات متعددة، يتولاها استشاريون بدعم من خدمات تشخيصية وصيدلانية وصحية مساعدة متكاملة.'
  );
  result = result.replace(
    /The hospital provides inpatient and outpatient medical and surgical services across multiple specialties, staffed by consultants and supported by a full range of diagnostic, pharmacy, and allied health services\b/g,
    'تقدم المستشفى خدمات طبية وجراحية للمرضى الداخليين والخارجيين عبر تخصصات متعددة، يتولاها استشاريون بدعم من خدمات تشخيصية وصيدلانية وصحية مساعدة متكاملة'
  );
  result = result.replace(
    /Emergency care is available around the clock and the hospital maintains close referral relationships with specialist centres for complex cases\./g,
    'الرعاية الطارئة متاحة على مدار الساعة وتحتفظ المستشفى بعلاقات إحالة وثيقة مع مراكز متخصصة للحالات المعقدة.'
  );
  result = result.replace(
    /Emergency care is available around the clock and the hospital maintains close referral relationships with specialist centres for complex cases\b/g,
    'الرعاية الطارئة متاحة على مدار الساعة وتحتفظ المستشفى بعلاقات إحالة وثيقة مع مراكز متخصصة للحالات المعقدة'
  );

  // ── Occupational health / corporate sentences ─────────────────────────────
  result = result.replace(
    /The provider delivers occupational health services including pre-employment medicals, periodic health assessments, fitness-to-work evaluations, and workplace injury management\./g,
    'يقدم المزود خدمات الصحة المهنية تشمل الفحوصات الطبية قبل التوظيف والتقييمات الصحية الدورية وتقييمات اللياقة للعمل وإدارة إصابات العمل.'
  );
  result = result.replace(
    /The provider delivers occupational health services including pre-employment medicals, periodic health assessments, fitness-to-work evaluations, and workplace injury management\b/g,
    'يقدم المزود خدمات الصحة المهنية تشمل الفحوصات الطبية قبل التوظيف والتقييمات الصحية الدورية وتقييمات اللياقة للعمل وإدارة إصابات العمل'
  );
  result = result.replace(
    /Services are conducted in line with UAE regulatory requirements and employer health standards, with reports issued to both the employee and the organisation\./g,
    'تُنفَّذ الخدمات وفق المتطلبات التنظيمية الإماراتية ومعايير صحة صاحب العمل، مع إصدار التقارير للموظف والمنظمة على حد سواء.'
  );
  result = result.replace(
    /Services are conducted in line with UAE regulatory requirements and employer health standards, with reports issued to both the employee and the organisation\b/g,
    'تُنفَّذ الخدمات وفق المتطلبات التنظيمية الإماراتية ومعايير صحة صاحب العمل، مع إصدار التقارير للموظف والمنظمة على حد سواء'
  );

  // ── Wellness / aesthetic sentences ────────────────────────────────────────
  result = result.replace(
    /The centre offers a range of wellness, aesthetic, and lifestyle medicine services including skin treatments, body contouring, nutritional counselling, and general health screening\./g,
    'يقدم المركز طيفاً من خدمات العافية والتجميل وطب نمط الحياة تشمل علاجات البشرة وتشكيل الجسم والاستشارة الغذائية والفحص الصحي العام.'
  );
  result = result.replace(
    /The centre offers a range of wellness, aesthetic, and lifestyle medicine services including skin treatments, body contouring, nutritional counselling, and general health screening\b/g,
    'يقدم المركز طيفاً من خدمات العافية والتجميل وطب نمط الحياة تشمل علاجات البشرة وتشكيل الجسم والاستشارة الغذائية والفحص الصحي العام'
  );
  result = result.replace(
    /All procedures are carried out by licensed practitioners in compliance with relevant health authority regulations\./g,
    'تُنفَّذ جميع الإجراءات من قِبل ممارسين مرخصين امتثالاً للوائح الجهة الصحية المختصة.'
  );
  result = result.replace(
    /All procedures are carried out by licensed practitioners in compliance with relevant health authority regulations\b/g,
    'تُنفَّذ جميع الإجراءات من قِبل ممارسين مرخصين امتثالاً للوائح الجهة الصحية المختصة'
  );

  // ── Insurance sentence ────────────────────────────────────────────────────
  result = result.replace(
    /Insurance accepted here includes Daman and Thiqa\./g,
    'التأمين المقبول هنا يشمل Daman و Thiqa.'
  );
  result = result.replace(
    /Insurance accepted here includes Daman and Thiqa\b/g,
    'التأمين المقبول هنا يشمل Daman و Thiqa'
  );
  result = result.replace(
    /Insurance accepted here includes Daman\./g,
    'التأمين المقبول هنا يشمل Daman.'
  );
  result = result.replace(
    /Insurance accepted here includes Daman\b/g,
    'التأمين المقبول هنا يشمل Daman'
  );
  result = result.replace(
    /Insurance accepted here includes Thiqa\./g,
    'التأمين المقبول هنا يشمل Thiqa.'
  );
  result = result.replace(
    /Insurance accepted here includes Thiqa\b/g,
    'التأمين المقبول هنا يشمل Thiqa'
  );

  // ── Call sentence ─────────────────────────────────────────────────────────
  result = result.replace(
    /Call ([\+\d\s\-]+) to reach the team directly or confirm appointment availability\./g,
    'اتصل على $1 للتواصل المباشر مع الفريق أو تأكيد توفر المواعيد.'
  );
  result = result.replace(
    /Call ([\+\d\s\-]+) to reach the team directly or confirm appointment availability\b/g,
    'اتصل على $1 للتواصل المباشر مع الفريق أو تأكيد توفر المواعيد'
  );

  // ── Licensed by ───────────────────────────────────────────────────────────
  result = result.replace(
    /UAE, licensed by DOH Abu Dhabi\./g,
    'الإمارات العربية المتحدة، مرخصة من DOH أبوظبي.'
  );
  result = result.replace(
    /UAE, licensed by DOH Abu Dhabi\b/g,
    'الإمارات العربية المتحدة، مرخصة من DOH أبوظبي'
  );
  result = result.replace(
    /UAE, licensed by DHA\./g,
    'الإمارات العربية المتحدة، مرخصة من DHA.'
  );
  result = result.replace(
    /UAE, licensed by DHA\b/g,
    'الإمارات العربية المتحدة، مرخصة من DHA'
  );
  result = result.replace(
    /UAE, licensed by MOHAP\./g,
    'الإمارات العربية المتحدة، مرخصة من MOHAP.'
  );
  result = result.replace(
    /UAE, licensed by MOHAP\b/g,
    'الإمارات العربية المتحدة، مرخصة من MOHAP'
  );

  return result;
}

function translateReviewSummary(arr) {
  return arr.map(s => {
    const translation = reviewMap[s.trim()];
    if (translation) return translation;
    // Fallback: return the original if no translation found
    return s;
  });
}

const result = slice.map(p => {
  const desc = p.description || '';
  const reviews = Array.isArray(p.reviewSummary) ? p.reviewSummary :
                  (p.reviewSummary ? [String(p.reviewSummary)] : []);
  return {
    id: p.id,
    descriptionAr: translateDescription(desc),
    reviewSummaryAr: translateReviewSummary(reviews)
  };
});

fs.writeFileSync(
  path.join(__dirname, 'arabic-chunks/ar-11000-12519.json'),
  JSON.stringify(result, null, 2),
  'utf8'
);

// Stats
const untranslated = result.filter(p => {
  const hasEnglish = /[A-Z][a-z]{3,}/.test(p.descriptionAr.replace(/DOH|DHA|MOHAP|Daman|Thiqa|Google|UAE|Abu Dhabi|Al |Dubai|\+971/g, ''));
  return hasEnglish;
});
console.log('Total translated:', result.length);
console.log('Possibly untranslated desc:', untranslated.length);

// Check for untranslated review sentences
const untranslatedReviews = new Set();
result.forEach(p => {
  p.reviewSummaryAr.forEach(r => {
    if (/^[A-Z]/.test(r) && !r.startsWith('DOH') && !r.startsWith('DHA')) {
      untranslatedReviews.add(r);
    }
  });
});
console.log('Untranslated review sentences:', untranslatedReviews.size);
if (untranslatedReviews.size > 0) {
  console.log([...untranslatedReviews]);
}
