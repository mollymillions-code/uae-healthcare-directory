import {
  CalendarCheck,
  MessageCircle,
  Stethoscope,
  MapPin,
  Clock,
  RefreshCw,
  Bot,
  ArrowRightLeft,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export const bookingWidgetFeatures = [
  {
    icon: Stethoscope,
    title: "Live EMR Schedules",
    desc: "Real-time doctor availability from your EMR. Patients always see accurate slots.",
  },
  {
    icon: MapPin,
    title: "Multi-Filter Selection",
    desc: "Select doctor, department, branch, and service from live EMR data.",
  },
  {
    icon: Clock,
    title: "Real-Time Actions",
    desc: "Confirm, reschedule, and cancel with full EMR writeback.",
  },
  {
    icon: RefreshCw,
    title: "WhatsApp Confirmations",
    desc: "Automated confirmations and reminders via WhatsApp.",
  },
];

export const chatWidgetFeatures = [
  {
    icon: Bot,
    title: "AI-Powered Responses",
    desc: "AI answers questions, qualifies intent, and proposes slots 24/7.",
  },
  {
    icon: CalendarCheck,
    title: "One-Tap Booking",
    desc: "One tap to confirm, with automatic EMR writeback.",
  },
  {
    icon: ArrowRightLeft,
    title: "Instant Human Handoff",
    desc: "Escalate to your team in seconds with full conversation context.",
  },
  {
    icon: MessageSquare,
    title: "Continue on WhatsApp",
    desc: "Move conversations to WhatsApp for ongoing engagement.",
  },
];

export const widgetBenefits = [
  {
    icon: Sparkles,
    title: "Self-Service That Saves You Money",
    desc: "Patients book without calling. Fewer inbound calls, lower operational cost.",
  },
  {
    icon: MessageCircle,
    title: "Revenue That Never Sleeps",
    desc: "AI widgets capture leads and book appointments 24/7.",
  },
];
