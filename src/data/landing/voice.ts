import {
  Phone,
  PhoneIncoming,
  BarChart3,
  Clock,
  ArrowRightLeft,
  Shield,
} from "lucide-react";

export const ctiFeatures = [
  { icon: Phone, title: "Native CTI Controls Built into Zavis", desc: "Answer, hold, mute, transfer, conference, and wrap codes inside Zavis. No separate call center software." },
  { icon: PhoneIncoming, title: "Screen Pop Delivers Instant Patient Context", desc: "Patient profile, open tasks, and prior conversations appear the moment a call connects." },
  { icon: BarChart3, title: "Every Call Tracked from Source to Booking", desc: "Campaign and branch numbers provide full attribution so you know which calls drive revenue." },
  { icon: Clock, title: "Missed-Call Recovery That Captures Every Inquiry", desc: "Missed calls auto-create a thread, send a template, and trigger a callback with SLA timer." },
  { icon: ArrowRightLeft, title: "Warm Transfers with Full Patient Context", desc: "Transfer with full audit trail and context so patients never repeat their story." },
  { icon: Shield, title: "Built-In Compliance at No Extra Cost", desc: "Recording, disposition, consent, and audit artifacts saved automatically." },
];

export const coordinatorSteps = [
  "Screen pop with patient profile and history on every incoming call",
  "Click-to-call from any thread with native CTI controls",
  "Book using live EMR schedules with auto-logged wrap codes",
  "Warm transfer with full audit trail and patient context",
  "Call recording in the same timeline with auto SLA timers",
];

export const aiAssistSteps = [
  "Real-time transcript with smart prompts coaching staff live",
  "Auto summary captures key points and next steps instantly",
  "Live Arabic-English translation on every bilingual call",
  "Sentiment analysis (beta) with intent polarity and confidence scores",
  "Missed calls trigger auto thread, callback task, and SLA timer",
  "Campaign and branch numbers preserved for full attribution",
];
