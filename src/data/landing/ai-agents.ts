import {
  Bot,
  CalendarCheck,
  Languages,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";

export const chatAgentFeatures = [
  "Instant response on WhatsApp, Instagram, Facebook, TikTok, and web",
  "Qualifies intent and collects patient details automatically",
  "Books appointments via live EMR slots in the same conversation",
  "Human handoff in under 10 seconds with full context",
  "Missed-call and no-show recovery runs automatically",
  "Automated reminders with one-tap reschedule reduce no-shows",
  "Consent-aware templates on every interaction",
  "AI summaries and translations on every thread",
  "Full source and campaign attribution on every booking",
];

export const voiceAgentFeatures = [
  "Screen pop with patient profile and open tasks on every call",
  "Real-time transcript with smart prompts coaching staff live",
  "Bilingual Arabic-English handling with on-the-fly translation",
  "Live booking and reschedule directly in EMR",
  "Auto-summary captures key points, outcomes, and next steps",
  "Sentiment analysis with intent polarity and confidence scoring",
  "Warm transfer with full context at any point",
  "Emergency detection and priority routing in seconds",
  "Full audit trail, call recording, and compliance built in",
];

export const agentCapabilities = [
  { icon: Bot, title: "Intelligent Intent Recognition and Routing", desc: "Understands patient intent from natural conversation and routes to the right action instantly." },
  { icon: CalendarCheck, title: "Real-Time EMR Booking", desc: "Books into your EMR using live schedules with automatic WhatsApp confirmations." },
  { icon: Languages, title: "Multilingual, 24/7", desc: "Arabic and English with on-the-fly translation, day and night, no extra staffing." },
  { icon: AlertTriangle, title: "Emergency Escalation", desc: "Detects emergency intent and routes to priority queues with human handoff in under 10 seconds." },
  { icon: Clock, title: "AI Handles 60 to 90 Percent of Routine Queries", desc: "Routine queries, bookings, reminders, and follow-ups handled around the clock." },
  { icon: Shield, title: "Compliant by Design", desc: "Consent-aware templates, audit trails, and guardrails on every interaction." },
];
