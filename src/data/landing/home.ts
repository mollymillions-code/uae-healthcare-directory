import { MessageSquare, Phone, Bot, Calendar, BarChart3, Zap } from "lucide-react";

export const homeTabs = [
  "PATIENT ENGAGEMENT",
  "BOOKING MANAGEMENT",
  "AI-POWERED OPS",
  "BROADCAST & CAMPAIGN",
  "INTEGRATION & DATA",
];

export const homeTabContent = [
  {
    title: "Omnichannel Patient Communication Across Every Channel",
    subtitle: "WhatsApp, Instagram, phone, web chat, and more. One conversation thread per patient.",
    image: "/assets/shared-omnichannel-inbox.webp",
    imageAlt: "Clinic coordinator at dental reception managing WhatsApp, Instagram, and web chat patient messages in unified inbox",
    features: [
      { heading: "Unified Patient Inbox", text: "WhatsApp, Instagram, Facebook, TikTok, and web chat in one patient timeline. Every inquiry captured, every team member on the same page." },
      { heading: "Full Ad Attribution Built In", text: "Google Ads and Meta lead forms auto-ingest with UTM and campaign data preserved. Revenue tracked from first click to booked appointment." },
    ],
  },
  {
    title: "Intelligent Appointment Booking with Real-Time EMR Sync",
    subtitle: "From patient inquiry to confirmed appointment in seconds. Fully synced with your EMR.",
    image: "/assets/shared-patient-booking.webp",
    imageAlt: "Patient in waiting room smiling at phone with WhatsApp appointment booking confirmation overlay",
    features: [
      { heading: "Coordinator-Led Booking", text: "Filter live EMR slots by doctor, service, and branch. WhatsApp confirmation sent automatically. Zero double entry, zero scheduling conflicts." },
      { heading: "AI-Led Booking", text: "AI agents qualify intent, offer best slots, and book directly into your EMR. Automated 24h and 12h reminders reduce no-shows." },
    ],
  },
  {
    title: "AI Agents That Handle Patient Operations Around the Clock",
    subtitle: "Most routine patient queries handled without staff involvement.",
    image: "/assets/ai-agents-hero.webp",
    imageAlt: "Healthcare clinic storefront at night with WhatsApp AI booking conversation and 24/7 availability badge",
    features: [
      { heading: "Chat AI Agent", text: "Responds instantly on WhatsApp, Instagram, and web, 24/7, in the patient's language. Qualifies intent, books via EMR, and recaptures no-shows." },
      { heading: "Voice AI Agent", text: "Screen pop with patient context, real-time transcript, and live EMR booking. Missed calls trigger instant recovery workflows." },
    ],
  },
  {
    title: "Automated Patient Reactivation and Campaign Management",
    subtitle: "Reach dormant patients, drive recall visits, and measure campaign ROI across every channel.",
    image: "/assets/campaigns-hero.webp",
    imageAlt: "Marketing manager reviewing WhatsApp broadcast campaign performance analytics on presentation screen",
    features: [
      { heading: "Lifecycle Reactivation Campaigns", text: "6-month recall, inactive outreach, and post-visit follow-ups automated through WhatsApp. Revenue from your existing patient base, zero manual effort." },
      { heading: "Full Campaign Attribution", text: "Delivery, open, response, and booking conversion rates tracked per campaign. Measure ROI before allocating your next budget." },
    ],
  },
  {
    title: "Unified Healthcare Data with Full Revenue Attribution",
    subtitle: "EMR sync, ad platform ingestion, and end-to-end revenue tracking in one platform.",
    image: "/assets/integration-data-tab.webp",
    imageAlt: "Healthcare administrator viewing Zavis unified integration dashboard connecting EMR, payment, and communication systems",
    features: [
      { heading: "Bidirectional EMR Sync", text: "Bookings, cancellations, and patient data sync in real time with your EMR. One source of truth, no double entry, no middleware." },
      { heading: "Ad-to-Revenue Attribution", text: "Google Ads, Meta, and TikTok lead forms auto-ingest with full UTM data. Complete funnel visibility from click to collected revenue." },
    ],
  },
];

export const platformPillars = [
  { icon: MessageSquare, title: "Omnichannel Inbox", desc: "All channels, one patient timeline", to: "/chat" },
  { icon: Phone, title: "Cloud Voice", desc: "Native cloud calling with screen pop and recording", to: "/voice" },
  { icon: Bot, title: "AI Agents", desc: "24/7 patient engagement, chat and voice", to: "/ai-agents" },
  { icon: Calendar, title: "Bookings", desc: "Real-time EMR sync with WhatsApp confirmations", to: "/bookings" },
  { icon: BarChart3, title: "Analytics", desc: "Ad click to revenue, fully attributed", to: "/analytics" },
  { icon: Zap, title: "Automations", desc: "Reminders, follow-ups, and recall on autopilot", to: "/automations" },
];
