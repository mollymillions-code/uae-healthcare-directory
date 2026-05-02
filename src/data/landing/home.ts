import { MessageSquare, Phone, Bot, Calendar, BarChart3, Zap } from "lucide-react";

export const homeTabs = [
  "PATIENT CONVERSATIONS",
  "APPOINTMENT FLOW",
  "AI FRONT DESK",
  "RECALL & CAMPAIGNS",
  "DATA & REVENUE",
];

export const homeTabContent = [
  {
    title: "Every patient message in one place",
    subtitle: "WhatsApp, Instagram, calls, forms, and web chat feed into one patient timeline.",
    image: "/assets/shared-omnichannel-inbox.webp",
    imageAlt: "Clinic coordinator at dental reception managing WhatsApp, Instagram, and web chat patient messages in unified inbox",
    features: [
      { heading: "One patient thread", text: "Front-desk teams see the full conversation history before they reply. New inquiries, follow-ups, missed calls, and ad leads stay tied to the same patient record." },
      { heading: "Source tracking from the first click", text: "Google, Meta, and TikTok leads arrive with campaign data intact, so the team can see which channels turn into booked visits." },
    ],
  },
  {
    title: "Booking that keeps the schedule moving",
    subtitle: "Give staff live slots, fast confirmations, and fewer manual updates.",
    image: "/assets/shared-patient-booking.webp",
    imageAlt: "Patient in waiting room smiling at phone with WhatsApp appointment booking confirmation overlay",
    features: [
      { heading: "Coordinator booking", text: "Filter available slots by doctor, service, branch, and patient need. Once a visit is booked, the patient gets the confirmation on WhatsApp." },
      { heading: "AI-assisted booking", text: "AI agents qualify the request, suggest suitable slots, and pass clean booking details to the team or EMR workflow." },
    ],
  },
  {
    title: "AI agents for routine front-desk work",
    subtitle: "Answer common questions, recover missed calls, and keep conversations moving after hours.",
    image: "/assets/ai-agents-hero.webp",
    imageAlt: "Healthcare clinic storefront at night with WhatsApp AI booking conversation and 24/7 availability badge",
    features: [
      { heading: "Chat AI agent", text: "Replies on WhatsApp, Instagram, and web chat in the patient's language. It can answer FAQs, collect intake details, and route complex cases to staff." },
      { heading: "Voice AI agent", text: "Missed calls can trigger instant follow-up. Live calls show patient context, transcripts, and booking notes for the team." },
    ],
  },
  {
    title: "Recall campaigns that bring patients back",
    subtitle: "Use WhatsApp, SMS, and email to fill gaps in the calendar without another spreadsheet.",
    image: "/assets/campaigns-hero.webp",
    imageAlt: "Marketing manager reviewing WhatsApp broadcast campaign performance analytics on presentation screen",
    features: [
      { heading: "Patient recall", text: "Send follow-ups after visits, remind dormant patients when they are due, and offer rebooking links before the schedule has empty hours." },
      { heading: "Campaign reporting", text: "Track delivery, replies, booked visits, and payment outcomes by campaign, branch, and channel." },
    ],
  },
  {
    title: "Data that connects ads, bookings, and payments",
    subtitle: "See where demand comes from and which interactions become revenue.",
    image: "/assets/integration-data-tab.webp",
    imageAlt: "Healthcare administrator viewing Zavis unified integration dashboard connecting EMR, payment, and communication systems",
    features: [
      { heading: "EMR and calendar sync", text: "Read appointment data, confirmation status, cancellations, and visit signals where the integration allows it." },
      { heading: "Revenue attribution", text: "Tie ad leads, patient conversations, bookings, reminders, and payment links into one operating view." },
    ],
  },
];

export const platformPillars = [
  { icon: MessageSquare, title: "Patient inbox", desc: "WhatsApp, social, web, and forms", to: "/chat" },
  { icon: Phone, title: "Voice", desc: "Calls, missed-call follow-up, and notes", to: "/voice" },
  { icon: Bot, title: "AI agents", desc: "Chat and voice support after hours", to: "/ai-agents" },
  { icon: Calendar, title: "Bookings", desc: "Slots, confirmations, and reminders", to: "/bookings" },
  { icon: BarChart3, title: "Analytics", desc: "Ad leads to booked and paid visits", to: "/analytics" },
  { icon: Zap, title: "Automations", desc: "Recall, feedback, and payment nudges", to: "/automations" },
];
