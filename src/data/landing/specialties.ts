import {
  Eye,
  Droplets,
  Bone,
  Ear,
  Clock,
  Brain,
  PawPrint,
  Home,
  Sparkles,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

export interface SpecialtyFeature {
  label: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  align: "left" | "right";
}

export interface SpecialtyData {
  slug: string;
  name: string;
  icon: LucideIcon;
  badge: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  heroImage: string;
  featureHeading: string;
  featureAccent: string;
  features: SpecialtyFeature[];
  resultBarText: string;
  resultHeading: string;
  results: { metric: string; description: string }[];
  ctaHeading: string;
  ctaDescription: string;
}

export const specialties: Record<string, SpecialtyData> = {
  dermatology: {
    slug: "dermatology",
    name: "Dermatology",
    icon: Droplets,
    badge: "Zavis for Dermatology",
    heroTitle: "Fill your clinic calendar with",
    heroAccent: "qualified skin consults",
    heroDescription:
      "From acne inquiries to cosmetic consultations, Zavis captures every lead across WhatsApp, Instagram, and web, qualifies with AI, and books directly into your EMR.",
    heroImage: "/assets/dermatology-hero.webp",
    featureHeading: "Everything your dermatology practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Omnichannel Patient Inbox",
        title: "Every Inquiry in One Thread",
        subtitle: "Instagram, WhatsApp, and calls in one view",
        description:
          "Every inquiry captured into a single timeline with full context. Your team never loses a lead across any channel.",
        image: "/assets/dermatology-omnichannel-patient-inbox.webp",
        align: "right",
      },
      {
        label: "AI Triage & Qualification",
        title: "Qualify Skin Consults Instantly",
        subtitle: "AI qualifies and routes to the right doctor",
        description:
          "AI asks about skin concerns and history, then routes to the right dermatologist with pre-qualified details. Staff focuses on complex cases.",
        image: "/assets/dermatology-ai-triage-qualification.webp",
        align: "left",
      },
      {
        label: "Smart Booking & Recall",
        title: "Fill Chairs with Automated Scheduling",
        subtitle: "Live EMR slots with one-tap confirmation",
        description:
          "Patients pick their time, confirm in one tap, and get WhatsApp reminders. Automated recall for peels, laser sessions, and follow-ups.",
        image: "/assets/dermatology-smart-booking-recall.webp",
        align: "right",
      },
      {
        label: "Revenue Attribution",
        title: "Track Every Campaign to Revenue",
        subtitle: "From Instagram ad to collected payment",
        description:
          "Track every ad and referral from click to collected revenue. Real CAC, ROAS, and conversion rates by procedure and doctor.",
        image: "/assets/dermatology-revenue-attribution.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your dermatology practice captures every lead, books more consultations, keeps patients on their treatment plans, and grows cosmetic revenue with less manual work from your front desk.",
    resultHeading: "What dermatology practices see with Zavis",
    results: [
      { metric: "More consultations booked", description: "from Instagram and WhatsApp leads that were previously lost" },
      { metric: "Fewer no-shows", description: "automated WhatsApp reminders and easy rescheduling keep patients on schedule" },
      { metric: "Full treatment series completion", description: "automated recall keeps patients on track across multiple sessions" },
      { metric: "Clear ad ROI", description: "every campaign tracked from click to revenue by procedure and doctor" },
    ],
    ctaHeading: "Ready to grow your dermatology practice?",
    ctaDescription: "See how Zavis helps dermatology clinics fill chairs and keep patients on track.",
  },

  optometry: {
    slug: "optometry",
    name: "Optometry",
    icon: Eye,
    badge: "Zavis for Optometry",
    heroTitle: "Never miss an annual exam with",
    heroAccent: "intelligent recall",
    heroDescription:
      "Automate annual exam reminders, contact lens reorders, and follow-ups so your optometry practice stays booked year-round.",
    heroImage: "/assets/optometry-hero.webp",
    featureHeading: "Everything your optometry practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Automated Annual Recall",
        title: "Never Miss an Annual Exam",
        subtitle: "WhatsApp reminders with one-tap booking",
        description:
          "Patients due for exams get automated WhatsApp reminders with one-tap booking. Recall rates improve significantly.",
        image: "/assets/optometry-automated-annual-recall.webp",
        align: "right",
      },
      {
        label: "Smart Scheduling",
        title: "Book Every Exam Type Correctly",
        subtitle: "Equipment-aware slot management",
        description:
          "Exams, contact fittings, and pediatric screenings all book correctly with the right equipment and duration. Zero conflicts.",
        image: "/assets/optometry-smart-scheduling.webp",
        align: "left",
      },
      {
        label: "Contact Lens Management",
        title: "Proactive Reorder Reminders",
        subtitle: "Catch patients before they lapse",
        description:
          "Automated outreach when lens supply runs low. Direct booking for fitting or pickup keeps patients with your practice.",
        image: "/assets/optometry-contact-lens-management.webp",
        align: "right",
      },
      {
        label: "Patient Lifecycle Tracking",
        title: "From First Exam to Lifetime Care",
        subtitle: "Full patient journey in one timeline",
        description:
          "Exam history, prescriptions, lens preferences, and insurance in one profile. Post-exam follow-ups and annual reminders run automatically.",
        image: "/assets/optometry-patient-lifecycle-tracking.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your optometry practice stays fully booked year-round with automated recall, eliminates scheduling conflicts, and builds lasting patient relationships without manual calling.",
    resultHeading: "What optometry practices see with Zavis",
    results: [
      { metric: "Higher annual recall rates", description: "automated reminders outperform manual calling" },
      { metric: "More contact lens reorders", description: "proactive reminders catch patients before they lapse" },
      { metric: "Zero scheduling conflicts", description: "smart slot management handles every appointment type" },
      { metric: "Full patient lifecycle tracked", description: "from first exam to annual recall, every touchpoint in one timeline" },
    ],
    ctaHeading: "Ready to fill your optometry schedule?",
    ctaDescription: "See how Zavis keeps patients coming back year after year.",
  },

  orthopedics: {
    slug: "orthopedics",
    name: "Orthopedics",
    icon: Bone,
    badge: "Zavis for Orthopedics",
    heroTitle: "Streamline complex patient journeys from",
    heroAccent: "consult to recovery",
    heroDescription:
      "Manage multi-visit treatment plans, surgical prep communications, and post-op follow-ups, all from one platform connected to your EMR.",
    heroImage: "/assets/orthopedics-hero.webp",
    featureHeading: "Everything your orthopedic practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Multi-Visit Journey Management",
        title: "Track from Consult to Full Recovery",
        subtitle: "One timeline across every department",
        description:
          "Track patients across consult, imaging, surgery, and recovery in one timeline. No switching between systems.",
        image: "/assets/orthopedics-multi-visit-journey-management.webp",
        align: "right",
      },
      {
        label: "Surgical Prep Automation",
        title: "Pre-Op Compliance Made Easy",
        subtitle: "Automated instructions and clearances",
        description:
          "Pre-op instructions, lab reminders, and clearance follow-ups sent automatically. Patients arrive prepared, procedures stay on schedule.",
        image: "/assets/orthopedics-surgical-prep-automation.webp",
        align: "left",
      },
      {
        label: "PT & Rehab Scheduling",
        title: "Keep Patients on Their Rehab Plan",
        subtitle: "Series booking with automated reminders",
        description:
          "PT series booked directly in your EMR. WhatsApp reminders keep patients on their rehab plan. Missed sessions drop significantly.",
        image: "/assets/orthopedics-pt-rehab-scheduling.webp",
        align: "right",
      },
      {
        label: "Instant Lead Response",
        title: "Respond to Injury Inquiries in Seconds",
        subtitle: "AI qualifies urgency and books instantly",
        description:
          "AI responds within seconds to sports injury and joint pain inquiries, qualifies the case, and books the first available consult.",
        image: "/assets/orthopedics-instant-lead-response.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your orthopedic practice delivers seamless patient journeys from first inquiry through full recovery, with automated prep, fewer missed PT sessions, and faster lead conversion.",
    resultHeading: "What orthopedic practices see with Zavis",
    results: [
      { metric: "Higher pre-op compliance", description: "automated prep workflows ensure patients arrive ready" },
      { metric: "Fewer missed PT sessions", description: "WhatsApp reminders keep patients on their rehab plan" },
      { metric: "Faster lead-to-consult", description: "AI responds in seconds to sports injury and joint pain inquiries" },
      { metric: "Complete surgical journey tracked", description: "from first inquiry through full recovery in one timeline" },
    ],
    ctaHeading: "Ready to streamline your orthopedic operations?",
    ctaDescription: "See how Zavis manages complex patient journeys from consult to recovery.",
  },

  ent: {
    slug: "ent",
    name: "ENT",
    icon: Ear,
    badge: "Zavis for ENT",
    heroTitle: "Manage seasonal surges and complex cases with",
    heroAccent: "intelligent automation",
    heroDescription:
      "From allergy season spikes to hearing evaluations and surgical follow-ups, Zavis automates patient communication and keeps your ENT practice running smoothly.",
    heroImage: "/assets/ent-hero.webp",
    featureHeading: "Everything your ENT practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Surge Capacity with AI",
        title: "Handle Seasonal Spikes Effortlessly",
        subtitle: "AI absorbs volume during peak periods",
        description:
          "AI qualifies allergies vs. infections, books the right appointment type, and routes urgent cases to staff during seasonal surges.",
        image: "/assets/ent-ai-seasonal-surge-capacity.webp",
        align: "right",
      },
      {
        label: "Specialized Scheduling",
        title: "Equipment-Aware Booking",
        subtitle: "Audiometry rooms always available",
        description:
          "Equipment-aware scheduling ensures audiometry rooms and tools are booked correctly. No conflicts, no manual coordination.",
        image: "/assets/ent-equipment-aware-booking.webp",
        align: "left",
      },
      {
        label: "Post-Surgical Care",
        title: "Structured Follow-Up Sequences",
        subtitle: "Procedure-specific check-ins automated",
        description:
          "Tonsillectomy, sinus surgery, and septoplasty recovery follow-ups run automatically with structured sequences for every procedure type.",
        image: "/assets/ent-post-surgical-follow-up.webp",
        align: "right",
      },
      {
        label: "Allergy Shot Series",
        title: "Keep Immunotherapy on Track",
        subtitle: "Automated reminders for every injection",
        description:
          "Automated reminders track injection adherence and alert for missed doses. Series completion rates improve consistently.",
        image: "/assets/ent-allergy-shot-series-tracking.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your ENT practice handles seasonal surges without extra staff, eliminates scheduling conflicts for specialized equipment, and ensures every surgical patient gets structured post-op care.",
    resultHeading: "What ENT practices see with Zavis",
    results: [
      { metric: "Handle peak volume without extra staff", description: "AI absorbs seasonal surges so your team stays focused" },
      { metric: "Better allergy shot series completion", description: "automated reminders keep immunotherapy patients on schedule" },
      { metric: "Zero equipment scheduling conflicts", description: "smart booking handles audiometry room requirements" },
      { metric: "Complete procedure follow-up", description: "every surgical patient gets structured post-op care" },
    ],
    ctaHeading: "Ready to handle your ENT practice's complexity?",
    ctaDescription: "See how Zavis manages seasonal surges, specialized scheduling, and surgical follow-ups.",
  },

  "urgent-care": {
    slug: "urgent-care",
    name: "Urgent Care",
    icon: Clock,
    badge: "Zavis for Urgent Care",
    heroTitle: "Convert walk-ins into",
    heroAccent: "long-term patients",
    heroDescription:
      "Capture every urgent care visit, follow up automatically, and build lasting patient relationships by turning one-time visits into ongoing care.",
    heroImage: "/assets/urgent-care-hero.webp",
    featureHeading: "Everything your urgent care center needs to",
    featureAccent: "grow",
    features: [
      {
        label: "24/7 AI-Powered Triage",
        title: "Respond Instantly, Even After Hours",
        subtitle: "AI qualifies urgency and books 24/7",
        description:
          "AI responds instantly via web chat or WhatsApp, qualifies urgency, and books visits or directs to ER for emergencies.",
        image: "/assets/urgent-care-ai-triage-24-7.webp",
        align: "right",
      },
      {
        label: "Walk-In Conversion",
        title: "Turn One-Time Visits into Ongoing Care",
        subtitle: "Automated follow-up builds loyalty",
        description:
          "Every walk-in is captured. Automated 48-hour follow-up offers ongoing care, turning one-time visits into returning patients.",
        image: "/assets/urgent-care-walk-in-conversion.webp",
        align: "left",
      },
      {
        label: "Wait Time Communication",
        title: "Proactive Patient Updates",
        subtitle: "Virtual queue and real-time estimates",
        description:
          "WhatsApp wait-time updates and virtual queue let patients plan their visit. Less lobby congestion, higher satisfaction.",
        image: "/assets/urgent-care-wait-time-communication.webp",
        align: "right",
      },
      {
        label: "Multi-Site Operations",
        title: "Real-Time Visibility Across Locations",
        subtitle: "Unified dashboard for all centers",
        description:
          "Patient volume, wait times, and staff utilization across all locations. Seasonal campaigns built in.",
        image: "/assets/urgent-care-multi-site-operations.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your urgent care centers respond 24/7, convert walk-ins into loyal patients, reduce wait-time complaints, and gain full operational visibility across every location.",
    resultHeading: "What urgent care centers see with Zavis",
    results: [
      { metric: "Walk-ins become returning patients", description: "automated follow-ups build ongoing relationships" },
      { metric: "24/7 patient response", description: "AI handles after-hours inquiries when competitors are closed" },
      { metric: "Referral loop closed", description: "PCP follow-up scheduling automated and tracked" },
      { metric: "Multi-site visibility", description: "real-time operations dashboard across all locations" },
    ],
    ctaHeading: "Ready to build patient loyalty at your urgent care?",
    ctaDescription: "See how Zavis converts walk-ins into lifelong patients.",
  },

  "mental-health": {
    slug: "mental-health",
    name: "Mental Health",
    icon: Brain,
    badge: "Zavis for Mental Health",
    heroTitle: "Sensitive, timely communication for",
    heroAccent: "every patient journey",
    heroDescription:
      "Handle intake, recurring sessions, medication check-ins, and crisis protocols with the care and privacy your patients deserve.",
    heroImage: "/assets/mental-health-hero.webp",
    featureHeading: "Everything your mental health practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Sensitive Intake Automation",
        title: "Empathetic First Contact",
        subtitle: "AI handles outreach with caring language",
        description:
          "AI collects concerns, insurance, and preferences privately, then matches patients to the right therapist by specialization and availability.",
        image: "/assets/mental-health-sensitive-intake-automation.webp",
        align: "right",
      },
      {
        label: "Recurring Session Management",
        title: "Automated Session Scheduling",
        subtitle: "Weekly, biweekly, or monthly with gap-fill",
        description:
          "Recurring appointments with automated reminders and easy rescheduling. Gap-fill on cancellations keeps your calendar full.",
        image: "/assets/mental-health-recurring-session-management.webp",
        align: "left",
      },
      {
        label: "Crisis Escalation Protocols",
        title: "Immediate Response When It Matters",
        subtitle: "Flagged keywords trigger instant escalation",
        description:
          "Immediate escalation to clinical staff with full patient context. Crisis response times drop dramatically.",
        image: "/assets/mental-health-crisis-escalation-protocols.webp",
        align: "right",
      },
      {
        label: "Medication Review Management",
        title: "Proactive Psychiatry Follow-Up",
        subtitle: "Automated medication review prompts",
        description:
          "Proactive prompts for patients due for medication reviews. Track adherence automatically. Compliance improves measurably.",
        image: "/assets/mental-health-medication-review-management.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your mental health practice responds faster, keeps patients consistently engaged in their care, handles crises with structured protocols, and maintains medication compliance, all with consent-first communication.",
    resultHeading: "What mental health practices see with Zavis",
    results: [
      { metric: "Faster intake to first session", description: "AI handles intake immediately, no callback wait" },
      { metric: "Higher session attendance", description: "automated reminders with easy reschedule reduce no-shows" },
      { metric: "Rapid crisis response", description: "escalation protocols ensure immediate clinical attention" },
      { metric: "Better medication review compliance", description: "proactive scheduling keeps patients on track" },
    ],
    ctaHeading: "Ready to improve your mental health practice?",
    ctaDescription: "See how Zavis handles sensitive patient communication with care and efficiency.",
  },

  veterinary: {
    slug: "veterinary",
    name: "Veterinary",
    icon: PawPrint,
    badge: "Zavis for Veterinary",
    heroTitle: "Keep every pet healthy with",
    heroAccent: "proactive care automation",
    heroDescription:
      "Vaccination reminders, wellness visit scheduling, multi-pet household management, and post-surgery follow-ups, all automated through WhatsApp.",
    heroImage: "/assets/veterinary-hero.webp",
    featureHeading: "Everything your veterinary practice needs to",
    featureAccent: "grow",
    features: [
      {
        label: "Vaccination Automation",
        title: "Never Miss a Shot",
        subtitle: "Reminders for every vaccine due date",
        description:
          "Pet owners get WhatsApp reminders with one-tap booking for shots. Vaccination compliance improves significantly.",
        image: "/assets/veterinary-vaccination-automation.webp",
        align: "right",
      },
      {
        label: "Multi-Pet Management",
        title: "Coordinate Household Scheduling",
        subtitle: "Multiple pets, one owner profile",
        description:
          "Coordinate appointments and send combined reminders across all pets. Families book everyone in one conversation.",
        image: "/assets/veterinary-multi-pet-management.webp",
        align: "left",
      },
      {
        label: "Post-Surgery Care",
        title: "Structured Recovery Follow-Up",
        subtitle: "Procedure-specific care instructions",
        description:
          "Post-op instructions and recovery check-ins for every procedure type. Structured follow-up catches complications early.",
        image: "/assets/veterinary-post-surgery-care.webp",
        align: "right",
      },
      {
        label: "Wellness Campaigns",
        title: "Drive Preventive Care Adoption",
        subtitle: "Targeted outreach for wellness packages",
        description:
          "Wellness packages and senior screenings promoted via WhatsApp. AI answers common questions, escalating medical concerns to vets.",
        image: "/assets/veterinary-wellness-campaigns.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your veterinary practice keeps pets healthy with proactive vaccination reminders, coordinates multi-pet households effortlessly, and catches post-surgery complications early, all while growing preventive care revenue.",
    resultHeading: "What veterinary practices see with Zavis",
    results: [
      { metric: "Higher vaccination compliance", description: "automated WhatsApp reminders outperform manual calling" },
      { metric: "Multi-pet bookings streamlined", description: "families book all pets in one conversation" },
      { metric: "Post-surgery complications reduced", description: "structured follow-up catches issues early" },
      { metric: "Growing wellness revenue", description: "targeted campaigns drive preventive care adoption" },
    ],
    ctaHeading: "Ready to grow your veterinary practice?",
    ctaDescription: "See how Zavis keeps pet parents engaged and pets healthy.",
  },

  homecare: {
    slug: "homecare",
    name: "Homecare",
    icon: Home,
    badge: "Zavis for Homecare",
    heroTitle: "Coordinate home visits without the",
    heroAccent: "scheduling chaos",
    heroDescription:
      "Your clinicians are on the road. Your coordinators are on the phone. Zavis connects them with automated visit scheduling, real-time route updates, and patient follow-ups that run without manual effort.",
    heroImage: "/assets/homecare-hero.webp",
    featureHeading: "Everything your homecare operation needs to",
    featureAccent: "scale",
    features: [
      {
        label: "Visit Scheduling & Coordination",
        title: "Fill Every Clinician's Schedule Without Phone Tag",
        subtitle: "Live availability, automated confirmations",
        description:
          "Real-time clinician availability with direct booking. WhatsApp confirmations include visit time and what to prepare. No phone tag.",
        image: "/assets/homecare-visit-scheduling-coordination.webp",
        align: "right",
      },
      {
        label: "Patient & Caregiver Communication",
        title: "Keep Families Informed Without Extra Staff",
        subtitle: "Updates to patients and caregivers",
        description:
          "Visit reminders, arrival notifications, and care instructions sent automatically to patients and caregivers via WhatsApp. No update calls needed.",
        image: "/assets/homecare-patient-caregiver-communication.webp",
        align: "left",
      },
      {
        label: "Post-Visit Follow-Up",
        title: "Every Visit Leads to Better Outcomes",
        subtitle: "Automated check-ins and satisfaction surveys",
        description:
          "Post-visit check-ins assess status, collect feedback, and flag issues. Medication reminders and next-visit scheduling run automatically.",
        image: "/assets/homecare-post-visit-follow-up.webp",
        align: "right",
      },
      {
        label: "Multi-Branch Operations",
        title: "Visibility Across Every Location and Team",
        subtitle: "One dashboard for all regions and teams",
        description:
          "Visit volume, clinician utilization, and scheduling gaps across all branches. Spot inefficiencies and fill more visits per day.",
        image: "/assets/homecare-multi-branch-operations.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your homecare operation schedules more visits per clinician, keeps families informed without extra staff, and catches post-visit issues early, all from one platform.",
    resultHeading: "What homecare providers see with Zavis",
    results: [
      { metric: "More visits per clinician per day", description: "automated scheduling eliminates phone tag and gaps" },
      { metric: "Families informed automatically", description: "visit updates and care instructions sent without coordinator calls" },
      { metric: "Post-visit issues caught early", description: "automated check-ins flag problems before they escalate" },
      { metric: "Full operational visibility", description: "one dashboard across all branches, clinicians, and patients" },
    ],
    ctaHeading: "Ready to scale your homecare operations?",
    ctaDescription: "See how Zavis helps homecare providers fill schedules, keep families informed, and improve outcomes.",
  },

  aesthetic: {
    slug: "aesthetic",
    name: "Aesthetic",
    icon: Sparkles,
    badge: "Zavis for Aesthetic Clinics",
    heroTitle: "Turn cosmetic inquiries into",
    heroAccent: "booked treatments",
    heroDescription:
      "Instagram DMs, WhatsApp consultations, and website inquiries all demand instant responses. Zavis captures every lead, qualifies with AI, and books treatments before competitors can reply.",
    heroImage: "/assets/aesthetic-hero.webp",
    featureHeading: "Everything your aesthetic clinic needs to",
    featureAccent: "grow revenue",
    features: [
      {
        label: "Instagram & Social Lead Capture",
        title: "Every DM Is a Revenue Opportunity",
        subtitle: "Instagram, WhatsApp, TikTok leads captured",
        description:
          "Every DM, comment inquiry, and ad click captured in one timeline. AI responds instantly before the lead goes cold.",
        image: "/assets/aesthetic-social-lead-capture.webp",
        align: "right",
      },
      {
        label: "AI Consultation Qualification",
        title: "Qualify Cosmetic Leads Without Wasting Staff Time",
        subtitle: "AI collects concerns and budget upfront",
        description:
          "AI pre-qualifies leads with treatment interest, budget, and timing. Consultants get full context. The majority of inquiries handled without staff.",
        image: "/assets/aesthetic-ai-consultation-qualification.webp",
        align: "left",
      },
      {
        label: "Treatment Series & Recall",
        title: "Patients Who Start Treatments Should Finish Them",
        subtitle: "Automated recall for multi-session treatments",
        description:
          "Botox, laser, peels, and filler schedules stay on track with automated WhatsApp reminders. Series completion drives revenue.",
        image: "/assets/aesthetic-treatment-series-recall.webp",
        align: "right",
      },
      {
        label: "Campaign & Promotion ROI",
        title: "Know Which Promotions Actually Drive Revenue",
        subtitle: "From social ad to treatment payment",
        description:
          "Track every ad and referral from click to collected payment. Know your CAC and ROAS by treatment type.",
        image: "/assets/aesthetic-campaign-promotion-roi.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your aesthetic clinic captures every social media lead, qualifies instantly with AI, keeps patients on their treatment plans, and knows exactly which campaigns drive revenue, with less manual effort from your team.",
    resultHeading: "What aesthetic clinics see with Zavis",
    results: [
      { metric: "More leads converted", description: "instant AI response on Instagram and WhatsApp before leads go cold" },
      { metric: "Better treatment series completion", description: "automated recall keeps patients on their multi-session plans" },
      { metric: "Less staff time on triage", description: "AI qualifies cosmetic leads before they reach your consultants" },
      { metric: "Full promotion ROI visibility", description: "every campaign tracked from social ad to collected payment" },
    ],
    ctaHeading: "Ready to grow your aesthetic practice?",
    ctaDescription: "See how Zavis turns social media interest into booked treatments and measurable revenue.",
  },

  "longevity-wellness": {
    slug: "longevity-wellness",
    name: "Longevity & Wellness",
    icon: HeartPulse,
    badge: "Zavis for Longevity & Wellness",
    heroTitle: "Build lifetime patient relationships with",
    heroAccent: "proactive engagement",
    heroDescription:
      "Longevity patients invest in ongoing health, not one-time visits. Zavis automates wellness program enrollment, recurring check-ins, and personalized outreach that keeps high-value patients engaged for years.",
    heroImage: "/assets/longevity-wellness-hero.webp",
    featureHeading: "Everything your longevity practice needs to",
    featureAccent: "retain and grow",
    features: [
      {
        label: "Wellness Program Management",
        title: "Enrollment to Completion, Fully Automated",
        subtitle: "Multi-session packages tracked automatically",
        description:
          "IV therapy, hormone cycles, and executive health packages tracked with automated scheduling and reminders. Revenue per patient climbs.",
        image: "/assets/longevity-wellness-program-management.webp",
        align: "right",
      },
      {
        label: "Proactive Health Check-Ins",
        title: "Patients Who Feel Looked After Come Back",
        subtitle: "Automated wellness check-ins between visits",
        description:
          "Post-treatment checks, supplement reminders, and quarterly prompts via WhatsApp. Premium concierge-level care, no added headcount.",
        image: "/assets/longevity-wellness-proactive-health-check-ins.webp",
        align: "left",
      },
      {
        label: "High-Value Patient Segmentation",
        title: "Your Best Patients Deserve Your Best Attention",
        subtitle: "Segment by program, spend, and engagement",
        description:
          "Identify top patients by lifetime spend and engagement. Targeted outreach for new services and VIP experiences drives retention.",
        image: "/assets/longevity-wellness-patient-segmentation.webp",
        align: "right",
      },
      {
        label: "Membership & Subscription Tracking",
        title: "Recurring Revenue, Automatically Managed",
        subtitle: "Renewal reminders and churn prevention",
        description:
          "Automated renewal reminders, in-chat payment collection, and churn-risk alerts. Proactive outreach keeps retention high and revenue predictable.",
        image: "/assets/longevity-wellness-membership-subscription-tracking.webp",
        align: "left",
      },
    ],
    resultBarText:
      "Result: Your longevity practice builds lasting patient relationships with automated wellness programs, proactive check-ins, and personalized outreach, driving higher lifetime value with less manual effort.",
    resultHeading: "What longevity & wellness practices see with Zavis",
    results: [
      { metric: "Higher program completion rates", description: "automated scheduling and reminders keep patients on track" },
      { metric: "Patient lifetime value increased", description: "proactive engagement drives repeat visits and upsell opportunities" },
      { metric: "Membership churn reduced", description: "renewal reminders and churn-risk alerts prevent lapses" },
      { metric: "Premium experience, no extra staff", description: "automated wellness check-ins deliver concierge-level care" },
    ],
    ctaHeading: "Ready to build lifetime patient relationships?",
    ctaDescription: "See how Zavis helps longevity and wellness practices retain high-value patients and grow recurring revenue.",
  },
};

export const specialtyList = Object.values(specialties);
