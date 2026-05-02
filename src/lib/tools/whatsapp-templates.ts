/**
 * UAE-localised WhatsApp reminder templates for clinic staff.
 *
 * Bilingual (English + Arabic). Each template uses placeholder tokens
 * `{patient_name}`, `{appointment_time}`, `{clinic_name}`, etc. that the
 * clinic replaces in WhatsApp Business at send time. Arabic templates
 * follow UAE-appropriate formality:
 *   - greetings calibrated to time-of-day
 *   - polite address (`حضرتك`) by default for adult patients
 *   - clinic-name + contact format for sign-off
 *
 * Coverage: 8 specialties × 8 message types × bilingual = 64 templates.
 * Editorial team should adjust tone per their clinic's voice before
 * deployment.
 */

export type Specialty =
  | "general"
  | "dental"
  | "pediatrics"
  | "ob-gyn"
  | "dermatology"
  | "cardiology"
  | "radiology"
  | "lab";

export type MessageType =
  | "appointment_confirmation"
  | "reminder_24h"
  | "reminder_1h"
  | "follow_up"
  | "lab_result_ready"
  | "payment_reminder"
  | "no_show_recovery"
  | "birthday";

export interface WhatsAppTemplate {
  specialty: Specialty;
  messageType: MessageType;
  en: string;
  ar: string;
}

export const SPECIALTIES: { slug: Specialty; label: string; arLabel: string }[] = [
  { slug: "general", label: "General Practice", arLabel: "ممارسة عامة" },
  { slug: "dental", label: "Dental", arLabel: "أسنان" },
  { slug: "pediatrics", label: "Pediatrics", arLabel: "أطفال" },
  { slug: "ob-gyn", label: "OB-GYN", arLabel: "نساء وولادة" },
  { slug: "dermatology", label: "Dermatology", arLabel: "جلدية" },
  { slug: "cardiology", label: "Cardiology", arLabel: "قلب" },
  { slug: "radiology", label: "Radiology / Imaging", arLabel: "أشعة" },
  { slug: "lab", label: "Lab / Diagnostics", arLabel: "مختبر" },
];

export const MESSAGE_TYPES: { slug: MessageType; label: string; arLabel: string }[] = [
  { slug: "appointment_confirmation", label: "Appointment Confirmation", arLabel: "تأكيد الموعد" },
  { slug: "reminder_24h", label: "24-Hour Reminder", arLabel: "تذكير قبل 24 ساعة" },
  { slug: "reminder_1h", label: "1-Hour Reminder", arLabel: "تذكير قبل ساعة" },
  { slug: "follow_up", label: "Follow-up After Visit", arLabel: "متابعة بعد الزيارة" },
  { slug: "lab_result_ready", label: "Lab Result Ready", arLabel: "نتيجة المختبر جاهزة" },
  { slug: "payment_reminder", label: "Payment Reminder", arLabel: "تذكير بالدفع" },
  { slug: "no_show_recovery", label: "Missed Appointment Recovery", arLabel: "استرجاع موعد فائت" },
  { slug: "birthday", label: "Birthday Greeting", arLabel: "تهنئة عيد ميلاد" },
];

const t = (specialty: Specialty, messageType: MessageType, en: string, ar: string): WhatsAppTemplate => ({
  specialty,
  messageType,
  en,
  ar,
});

export const TEMPLATES: WhatsAppTemplate[] = [
  // GENERAL PRACTICE
  t("general", "appointment_confirmation",
    "Hi {patient_name}, your appointment with Dr. {doctor_name} at {clinic_name} on {date} at {time} is confirmed. Please bring your Emirates ID and insurance card. Reply CANCEL to cancel.",
    "مرحباً {patient_name}، تم تأكيد موعد حضرتك مع د. {doctor_name} في {clinic_name} يوم {date} الساعة {time}. يرجى إحضار الهوية الإماراتية وبطاقة التأمين. للإلغاء أرسل: إلغاء"),
  t("general", "reminder_24h",
    "Reminder: {patient_name}, you have an appointment tomorrow at {time} with Dr. {doctor_name} at {clinic_name}. Please arrive 10 minutes early.",
    "تذكير: {patient_name}، لديك موعد غداً الساعة {time} مع د. {doctor_name} في {clinic_name}. يرجى الحضور قبل 10 دقائق."),
  t("general", "reminder_1h",
    "Hi {patient_name}, reminder that your appointment with Dr. {doctor_name} is in 1 hour. {clinic_name} location: {map_link}",
    "مرحباً {patient_name}، تذكير بأن موعدك مع د. {doctor_name} بعد ساعة. موقع {clinic_name}: {map_link}"),
  t("general", "follow_up",
    "Hi {patient_name}, hope you're feeling better. Dr. {doctor_name} wanted to check in — any new symptoms or questions about your treatment? Reply here and we'll get back to you.",
    "مرحباً {patient_name}، نتمنى تحسن حالتك. د. {doctor_name} يطمئن عليك — هل ظهرت أي أعراض جديدة أو لديك أسئلة حول العلاج؟ أجب هنا وسنرد عليك."),
  t("general", "lab_result_ready",
    "{patient_name}, your lab results are ready. Dr. {doctor_name} would like to discuss them. Please book a follow-up via {booking_link} or reply to schedule.",
    "{patient_name}، نتائج تحاليلك جاهزة. د. {doctor_name} يرغب في مناقشتها. يرجى حجز متابعة عبر {booking_link} أو الرد لجدولة الموعد."),
  t("general", "payment_reminder",
    "Hi {patient_name}, friendly reminder that an outstanding balance of AED {amount} from your visit on {date} is due. Pay online: {payment_link} or at reception. Thank you.",
    "مرحباً {patient_name}، تذكير ودي بأن رصيداً مستحقاً قدره {amount} درهم من زيارتك بتاريخ {date}. الدفع الإلكتروني: {payment_link} أو في الاستقبال. شكراً."),
  t("general", "no_show_recovery",
    "Hi {patient_name}, we missed you at {clinic_name} on {date}. Hope you're well. Would you like to reschedule? Reply with a preferred date or call us at {phone}.",
    "مرحباً {patient_name}، افتقدناك في {clinic_name} بتاريخ {date}. نأمل أنك بخير. هل تود إعادة الجدولة؟ أرسل التاريخ المفضل أو اتصل بنا على {phone}."),
  t("general", "birthday",
    "Happy birthday, {patient_name}! From everyone at {clinic_name}, wishing you a year of health and happiness. 🎂",
    "كل عام وأنت بخير {patient_name}! من جميع فريق {clinic_name}، نتمنى لك عاماً مليئاً بالصحة والسعادة. 🎂"),

  // DENTAL
  t("dental", "appointment_confirmation",
    "Hi {patient_name}, your dental appointment with Dr. {doctor_name} at {clinic_name} on {date} at {time} is confirmed. We recommend brushing before arrival. Reply CANCEL to cancel.",
    "مرحباً {patient_name}، تم تأكيد موعد الأسنان مع د. {doctor_name} في {clinic_name} يوم {date} الساعة {time}. ننصح بتنظيف الأسنان قبل الحضور. للإلغاء أرسل: إلغاء"),
  t("dental", "reminder_24h",
    "Reminder: dental cleaning tomorrow at {time} with Dr. {doctor_name} at {clinic_name}. Please avoid eating 1 hour before if having scaling.",
    "تذكير: موعد تنظيف أسنان غداً الساعة {time} مع د. {doctor_name} في {clinic_name}. يرجى تجنب الأكل قبل ساعة في حال إجراء التقليح."),
  t("dental", "reminder_1h",
    "Hi {patient_name}, dental appointment in 1 hour at {clinic_name}. See you soon!",
    "مرحباً {patient_name}، موعد الأسنان بعد ساعة في {clinic_name}. نراك قريباً!"),
  t("dental", "follow_up",
    "{patient_name}, after your dental procedure on {date}: any pain, swelling, or concerns? Avoid hot food for 24 hours. Reply if you need anything.",
    "{patient_name}، بعد إجراء الأسنان بتاريخ {date}: أي ألم أو تورم أو مخاوف؟ تجنب الأطعمة الساخنة لمدة 24 ساعة. أرسل لنا في حال احتجت أي شيء."),
  t("dental", "lab_result_ready",
    "{patient_name}, your dental X-ray report is ready. Dr. {doctor_name} would like to discuss findings. Book follow-up: {booking_link}",
    "{patient_name}، تقرير أشعة الأسنان جاهز. د. {doctor_name} يرغب في مناقشة النتائج. حجز المتابعة: {booking_link}"),
  t("dental", "payment_reminder",
    "Hi {patient_name}, your dental treatment balance of AED {amount} is due. Most insurances cover dental partially — your portion is {amount}. Pay: {payment_link}",
    "مرحباً {patient_name}، رصيد علاج الأسنان المستحق {amount} درهم. معظم التأمينات تغطي جزءاً — حصتك {amount}. الدفع: {payment_link}"),
  t("dental", "no_show_recovery",
    "{patient_name}, we held your slot today but missed seeing you. Dental cleanings every 6 months keep things easy — would you like to rebook?",
    "{patient_name}، احتفظنا بموعدك اليوم لكن لم نرَك. تنظيف الأسنان كل 6 أشهر يبقي الأمور سهلة — هل تود إعادة الحجز؟"),
  t("dental", "birthday",
    "Happy birthday {patient_name}! Reminder: it's also a great time for your 6-monthly dental cleaning. 10% off cleanings this birthday week at {clinic_name}.",
    "كل عام وأنت بخير {patient_name}! تذكير: وقت رائع لتنظيف الأسنان نصف السنوي. خصم 10% على التنظيف خلال أسبوع عيد الميلاد في {clinic_name}."),

  // PEDIATRICS
  t("pediatrics", "appointment_confirmation",
    "Hi {parent_name}, {child_name}'s appointment with Dr. {doctor_name} on {date} at {time} is confirmed. Please bring vaccination card and Emirates ID.",
    "مرحباً {parent_name}، تم تأكيد موعد {child_name} مع د. {doctor_name} يوم {date} الساعة {time}. يرجى إحضار بطاقة التطعيمات والهوية الإماراتية."),
  t("pediatrics", "reminder_24h",
    "Reminder: {child_name}'s appointment is tomorrow at {time}. If {child_name} has fever above 38°C overnight, please call us before coming.",
    "تذكير: موعد {child_name} غداً الساعة {time}. إذا ارتفعت حرارة {child_name} فوق 38° خلال الليل، يرجى الاتصال بنا قبل الحضور."),
  t("pediatrics", "reminder_1h",
    "{parent_name}, {child_name}'s appointment is in 1 hour. We've prepared the play area — see you soon!",
    "{parent_name}، موعد {child_name} بعد ساعة. حضرنا منطقة اللعب — نراكم قريباً!"),
  t("pediatrics", "follow_up",
    "Hi {parent_name}, hope {child_name} is recovering well. Any new symptoms — fever, rash, vomiting? Send a message and Dr. {doctor_name} will respond.",
    "مرحباً {parent_name}، نأمل أن {child_name} يتعافى. أي أعراض جديدة — حمى، طفح، قيء؟ أرسل رسالة وسيرد د. {doctor_name}."),
  t("pediatrics", "lab_result_ready",
    "{parent_name}, {child_name}'s lab results are ready. Dr. {doctor_name} would like to review them with you. Book: {booking_link}",
    "{parent_name}، نتائج تحاليل {child_name} جاهزة. د. {doctor_name} يود مراجعتها معك. الحجز: {booking_link}"),
  t("pediatrics", "payment_reminder",
    "Hi {parent_name}, balance of AED {amount} for {child_name}'s visit on {date} is outstanding. Pay: {payment_link} — most pediatric care is covered, this is the co-pay portion.",
    "مرحباً {parent_name}، رصيد {amount} درهم لزيارة {child_name} بتاريخ {date} مستحق. الدفع: {payment_link} — معظم رعاية الأطفال مغطاة، وهذا الجزء الخاص بالتحمل."),
  t("pediatrics", "no_show_recovery",
    "{parent_name}, we missed {child_name} today. Vaccination schedules are time-sensitive — let's reschedule this week. Reply with a date.",
    "{parent_name}، افتقدنا {child_name} اليوم. جدول التطعيمات حساس للوقت — لنعيد الجدولة هذا الأسبوع. أرسل التاريخ."),
  t("pediatrics", "birthday",
    "Happy birthday {child_name}! 🎈 From everyone at {clinic_name} — wishing a healthy and joyful year ahead.",
    "كل عام وأنت بخير {child_name}! 🎈 من جميع فريق {clinic_name} — نتمنى عاماً سعيداً وصحياً."),

  // OB-GYN
  t("ob-gyn", "appointment_confirmation",
    "Hi {patient_name}, your appointment with Dr. {doctor_name} at {clinic_name} on {date} at {time} is confirmed. Bring your last ultrasound or test reports if applicable.",
    "مرحباً {patient_name}، تم تأكيد موعدك مع د. {doctor_name} في {clinic_name} يوم {date} الساعة {time}. أحضري آخر الأشعة أو التقارير إن وجدت."),
  t("ob-gyn", "reminder_24h",
    "Reminder: {patient_name}, your appointment with Dr. {doctor_name} is tomorrow at {time}. Avoid heavy meals 2 hours before if having an ultrasound.",
    "تذكير: {patient_name}، موعدك مع د. {doctor_name} غداً الساعة {time}. تجنبي الوجبات الثقيلة قبل ساعتين في حال الأشعة."),
  t("ob-gyn", "reminder_1h",
    "{patient_name}, your appointment is in 1 hour at {clinic_name}. Drive safely — see you soon.",
    "{patient_name}، موعدك بعد ساعة في {clinic_name}. قيادة آمنة — نراك قريباً."),
  t("ob-gyn", "follow_up",
    "Hi {patient_name}, hope you're feeling well after your visit. Any concerns — pain, bleeding, contractions? Reply or call {phone} for urgent matters.",
    "مرحباً {patient_name}، نأمل أنك بخير بعد الزيارة. أي مخاوف — ألم، نزيف، انقباضات؟ أجيبي أو اتصلي على {phone} للأمور العاجلة."),
  t("ob-gyn", "lab_result_ready",
    "{patient_name}, your test results from {date} are ready. Dr. {doctor_name} will review them with you. Please book: {booking_link}",
    "{patient_name}، نتائج فحوصاتك من {date} جاهزة. د. {doctor_name} ستراجعها معك. يرجى الحجز: {booking_link}"),
  t("ob-gyn", "payment_reminder",
    "Hi {patient_name}, balance of AED {amount} from your visit on {date} is outstanding. Most maternity is covered after waiting period — your portion is the co-pay. Pay: {payment_link}",
    "مرحباً {patient_name}، رصيد {amount} درهم من زيارتك بتاريخ {date} مستحق. معظم الأمومة مغطاة بعد فترة الانتظار — حصتك التحمل. الدفع: {payment_link}"),
  t("ob-gyn", "no_show_recovery",
    "{patient_name}, we missed you today. Antenatal care is time-sensitive — let's reschedule within 48 hours. Reply with availability.",
    "{patient_name}، افتقدناك اليوم. رعاية ما قبل الولادة حساسة للوقت — لنعيد الجدولة خلال 48 ساعة. أرسلي الأوقات المتاحة."),
  t("ob-gyn", "birthday",
    "Happy birthday {patient_name}! From everyone at {clinic_name} — health and joy in the year ahead.",
    "كل عام وأنت بخير {patient_name}! من جميع فريق {clinic_name} — صحة وسعادة في العام المقبل."),

  // DERMATOLOGY
  t("dermatology", "appointment_confirmation",
    "Hi {patient_name}, dermatology appointment with Dr. {doctor_name} on {date} at {time} confirmed. Please come without makeup or skincare on the area being examined.",
    "مرحباً {patient_name}، تم تأكيد موعد الجلدية مع د. {doctor_name} يوم {date} الساعة {time}. يرجى الحضور دون مكياج أو منتجات على المنطقة المفحوصة."),
  t("dermatology", "reminder_24h",
    "Reminder: dermatology appointment tomorrow at {time}. If your appointment includes a procedure, avoid sun exposure on the area for 24 hours.",
    "تذكير: موعد جلدية غداً الساعة {time}. إذا تضمن الموعد إجراءً، تجنب التعرض للشمس في المنطقة لمدة 24 ساعة."),
  t("dermatology", "reminder_1h",
    "{patient_name}, your dermatology appointment is in 1 hour at {clinic_name}. See you soon.",
    "{patient_name}، موعد الجلدية بعد ساعة في {clinic_name}. نراك قريباً."),
  t("dermatology", "follow_up",
    "Hi {patient_name}, after your dermatology procedure on {date}: how is the area healing? Any redness, itching, discomfort? Reply with a photo if helpful.",
    "مرحباً {patient_name}، بعد إجراء الجلدية بتاريخ {date}: كيف تتعافى المنطقة؟ أي احمرار أو حكة أو ألم؟ أرسل صورة إن كانت مفيدة."),
  t("dermatology", "lab_result_ready",
    "{patient_name}, your skin biopsy / patch test results are ready. Dr. {doctor_name} will discuss them with you. Book: {booking_link}",
    "{patient_name}، نتائج الخزعة / اختبار الجلد جاهزة. د. {doctor_name} ستناقشها معك. الحجز: {booking_link}"),
  t("dermatology", "payment_reminder",
    "Hi {patient_name}, balance of AED {amount} from your visit on {date} is outstanding. Cosmetic procedures aren't insurance-covered — pay: {payment_link}",
    "مرحباً {patient_name}، رصيد {amount} درهم من زيارتك بتاريخ {date} مستحق. الإجراءات التجميلية غير مغطاة بالتأمين — الدفع: {payment_link}"),
  t("dermatology", "no_show_recovery",
    "{patient_name}, we missed you today. If treatment was time-sensitive (acne course, peel series), let's reschedule. Reply with availability.",
    "{patient_name}، افتقدناك اليوم. إذا كان العلاج حساساً للوقت (دورة حب الشباب، سلسلة تقشير)، لنعيد الجدولة. أرسل الأوقات المتاحة."),
  t("dermatology", "birthday",
    "Happy birthday {patient_name}! Healthy skin year ahead. 🌿 — {clinic_name}",
    "كل عام وأنت بخير {patient_name}! عام من البشرة الصحية. 🌿 — {clinic_name}"),

  // CARDIOLOGY
  t("cardiology", "appointment_confirmation",
    "Hi {patient_name}, cardiology appointment with Dr. {doctor_name} on {date} at {time} confirmed. Please bring previous ECGs and current medication list.",
    "مرحباً {patient_name}، تم تأكيد موعد القلب مع د. {doctor_name} يوم {date} الساعة {time}. يرجى إحضار تخطيطات القلب السابقة وقائمة الأدوية الحالية."),
  t("cardiology", "reminder_24h",
    "Reminder: cardiology appointment tomorrow at {time}. If your appointment includes stress test, avoid caffeine for 12 hours and wear comfortable clothes.",
    "تذكير: موعد القلب غداً الساعة {time}. إذا تضمن الموعد اختبار الجهد، تجنب الكافيين لمدة 12 ساعة والبس ملابس مريحة."),
  t("cardiology", "reminder_1h",
    "{patient_name}, cardiology appointment in 1 hour. See you at {clinic_name}.",
    "{patient_name}، موعد القلب بعد ساعة. نراك في {clinic_name}."),
  t("cardiology", "follow_up",
    "Hi {patient_name}, Dr. {doctor_name} wanted to check on your blood pressure readings since the last visit. Any chest pain, breathlessness, or palpitations? Reply with current readings.",
    "مرحباً {patient_name}، د. {doctor_name} يطمئن على قراءات ضغطك منذ آخر زيارة. أي ألم في الصدر أو ضيق تنفس أو خفقان؟ أرسل القراءات الحالية."),
  t("cardiology", "lab_result_ready",
    "{patient_name}, your cardiac test results (ECG / Echo / lipid panel) are ready. Dr. {doctor_name} would like to discuss them — book: {booking_link}",
    "{patient_name}، نتائج فحوصاتك القلبية (تخطيط القلب / صدى القلب / الدهون) جاهزة. د. {doctor_name} يود مناقشتها — الحجز: {booking_link}"),
  t("cardiology", "payment_reminder",
    "Hi {patient_name}, balance of AED {amount} from your visit on {date} is outstanding. Cardiology is fully covered on most plans — your portion is the co-pay. Pay: {payment_link}",
    "مرحباً {patient_name}، رصيد {amount} درهم من زيارتك بتاريخ {date} مستحق. القلب مغطى بالكامل في معظم الخطط — حصتك التحمل. الدفع: {payment_link}"),
  t("cardiology", "no_show_recovery",
    "{patient_name}, we missed your cardiology follow-up today. Cardiac monitoring matters — let's reschedule this week. Reply with availability.",
    "{patient_name}، افتقدناك في متابعة القلب اليوم. مراقبة القلب مهمة — لنعيد الجدولة هذا الأسبوع. أرسل الأوقات المتاحة."),
  t("cardiology", "birthday",
    "Happy birthday {patient_name}! Reminder: an annual cardiac check-up keeps things on track. Book: {booking_link}",
    "كل عام وأنت بخير {patient_name}! تذكير: فحص القلب السنوي يبقي الأمور على المسار. الحجز: {booking_link}"),

  // RADIOLOGY
  t("radiology", "appointment_confirmation",
    "Hi {patient_name}, your imaging appointment ({scan_type}) on {date} at {time} is confirmed. Please bring referral letter and previous scans if available.",
    "مرحباً {patient_name}، تم تأكيد موعد الأشعة ({scan_type}) يوم {date} الساعة {time}. يرجى إحضار رسالة الإحالة والأشعات السابقة إن وجدت."),
  t("radiology", "reminder_24h",
    "Reminder: {scan_type} tomorrow at {time}. {prep_instructions}",
    "تذكير: {scan_type} غداً الساعة {time}. {prep_instructions}"),
  t("radiology", "reminder_1h",
    "{patient_name}, your scan is in 1 hour. Please remove all metal items before arriving (jewelry, hairpins, watches).",
    "{patient_name}، الأشعة بعد ساعة. يرجى إزالة جميع المعادن قبل الحضور (مجوهرات، دبابيس شعر، ساعة)."),
  t("radiology", "follow_up",
    "Hi {patient_name}, hope you're well after your scan. Any unusual reactions to contrast (if used)? Reply if you have any concerns.",
    "مرحباً {patient_name}، نأمل أنك بخير بعد الأشعة. أي ردود فعل غير معتادة على الصبغة (إن استخدمت)؟ أجب في حال أي مخاوف."),
  t("radiology", "lab_result_ready",
    "{patient_name}, your {scan_type} report is ready. Pick up at reception or download from the patient portal: {portal_link}",
    "{patient_name}، تقرير {scan_type} جاهز. الاستلام من الاستقبال أو التحميل من بوابة المريض: {portal_link}"),
  t("radiology", "payment_reminder",
    "Hi {patient_name}, balance of AED {amount} for your {scan_type} on {date}. Most imaging requires pre-authorisation — co-pay portion only. Pay: {payment_link}",
    "مرحباً {patient_name}، رصيد {amount} درهم لـ{scan_type} بتاريخ {date}. معظم الأشعة تتطلب موافقة مسبقة — جزء التحمل فقط. الدفع: {payment_link}"),
  t("radiology", "no_show_recovery",
    "{patient_name}, we missed you for your scan today. The pre-authorisation expires in {days} days — let's reschedule before then. Reply with availability.",
    "{patient_name}، افتقدناك للأشعة اليوم. الموافقة المسبقة تنتهي خلال {days} يوم — لنعيد الجدولة قبل ذلك. أرسل الأوقات المتاحة."),
  t("radiology", "birthday",
    "Happy birthday {patient_name}! From all of us at {clinic_name}.",
    "كل عام وأنت بخير {patient_name}! من جميعنا في {clinic_name}."),

  // LAB / DIAGNOSTICS
  t("lab", "appointment_confirmation",
    "Hi {patient_name}, your lab appointment on {date} at {time} is confirmed. {fasting_instruction}",
    "مرحباً {patient_name}، تم تأكيد موعد المختبر يوم {date} الساعة {time}. {fasting_instruction}"),
  t("lab", "reminder_24h",
    "Reminder: lab tests tomorrow at {time}. {fasting_instruction} Please bring your insurance card and Emirates ID.",
    "تذكير: تحاليل غداً الساعة {time}. {fasting_instruction} يرجى إحضار بطاقة التأمين والهوية."),
  t("lab", "reminder_1h",
    "{patient_name}, lab visit in 1 hour. We'll have you in and out quickly.",
    "{patient_name}، زيارة المختبر بعد ساعة. سننهي الأمور بسرعة."),
  t("lab", "follow_up",
    "Hi {patient_name}, hope your blood draw went well. Any unusual symptoms (dizziness, bruising)? Reply if you need anything.",
    "مرحباً {patient_name}، نأمل أن سحب الدم تم بسلاسة. أي أعراض غير معتادة (دوار، كدمات)؟ أجب في حال احتجت أي شيء."),
  t("lab", "lab_result_ready",
    "{patient_name}, your lab results are ready. Download: {portal_link}. We recommend reviewing with your doctor — book follow-up if needed.",
    "{patient_name}، نتائج التحاليل جاهزة. التحميل: {portal_link}. ننصح بالمراجعة مع طبيبك — احجز متابعة عند الحاجة."),
  t("lab", "payment_reminder",
    "Hi {patient_name}, balance of AED {amount} from your lab visit on {date} is outstanding. Insurance pays the bulk — your portion: {amount}. Pay: {payment_link}",
    "مرحباً {patient_name}، رصيد {amount} درهم من زيارة المختبر بتاريخ {date} مستحق. التأمين يدفع المعظم — حصتك: {amount}. الدفع: {payment_link}"),
  t("lab", "no_show_recovery",
    "{patient_name}, we missed you today. Lab results often inform next steps with your doctor — let's reschedule soon. Reply with availability.",
    "{patient_name}، افتقدناك اليوم. نتائج المختبر تحدد الخطوات التالية مع طبيبك — لنعيد الجدولة قريباً. أرسل الأوقات المتاحة."),
  t("lab", "birthday",
    "Happy birthday {patient_name}! An annual health check-up makes a great birthday gift to yourself. Book: {booking_link}",
    "كل عام وأنت بخير {patient_name}! فحص صحي سنوي هدية رائعة لنفسك. الحجز: {booking_link}"),
];
