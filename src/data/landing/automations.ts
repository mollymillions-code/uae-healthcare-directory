import {
  CalendarCheck,
  PhoneMissed,
  HeartPulse,
  RefreshCw,
  Megaphone,
} from "lucide-react";

export const automationCategories = [
  {
    icon: CalendarCheck,
    title: "Booking Lifecycle",
    color: "bg-[#006828]",
    items: [
      "Instant WhatsApp confirmation when a booking is created",
      "24h and 12h reminders with one-tap reschedule link",
      "Auto-notify patient on any schedule change",
    ],
  },
  {
    icon: PhoneMissed,
    title: "Missed-Call Recovery",
    color: "bg-[#1c1c1c]",
    items: [
      "Missed call opens a thread, sends a template, captures preferred time",
      "Auto callback task with SLA timer on every missed call",
    ],
  },
  {
    icon: HeartPulse,
    title: "Post-Visit",
    color: "bg-[#006828]/80",
    items: [
      "Outcome check, care instructions, and review request after visit",
      "Procedure-specific follow-ups and medication reminders",
    ],
  },
  {
    icon: RefreshCw,
    title: "After-Care & Reactivation",
    color: "bg-[#006828]/60",
    items: [
      "2-month post-checkup message with symptom check and slot offer",
      "6-month recall for hygiene or follow-up package",
      "No-show next-day resend with quick rebook link",
    ],
  },
  {
    icon: Megaphone,
    title: "Campaigns & Personalization",
    color: "bg-[#1c1c1c]/80",
    items: [
      "Birthday greeting with health tip and optional offer",
      "Segment by service, doctor, branch, and language",
      "Reactivate inactive patients with tailored packages",
    ],
  },
];

export const useCases = [
  {
    title: "Cohort Broadcasts",
    desc: "Segment by service, branch, and language; send approved templates; track conversions.",
  },
  {
    title: "Website Widgets",
    desc: "Chat and booking widgets for self-service with AI lead qualification.",
  },
  {
    title: "Integrated Ops",
    desc: "Calls, chat, bookings, and history in one timeline for faster resolution.",
  },
  {
    title: "Coordinator Bookings",
    desc: "Live EMR schedules with two-way writeback and zero double entry.",
  },
  {
    title: "Attribution & Reporting",
    desc: "UTMs and call numbers stitched to bookings and revenue for full campaign ROI.",
  },
];
