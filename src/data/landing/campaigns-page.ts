import {
  MessageCircle,
  Smartphone,
  Send,
  Users,
  Target,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";

export const campaignChannels = [
  {
    icon: MessageCircle,
    title: "WhatsApp Campaigns",
    desc: "Approved templates to segmented lists. Track delivery, reads, and booking conversions.",
    color: "bg-[#006828]",
  },
  {
    icon: Smartphone,
    title: "SMS Campaigns",
    desc: "Reminders, recalls, and promotions via SMS with full tracking.",
    color: "bg-[#1c1c1c]",
  },
  {
    icon: Send,
    title: "Live Chat Campaigns",
    desc: "Proactive website messages that convert browsing into bookings.",
    color: "bg-[#006828]/80",
  },
];

export const campaignFeatures = [
  {
    icon: Users,
    title: "Smart Segmentation",
    desc: "Segment by service history, doctor, branch, language, and custom tags.",
  },
  {
    icon: Target,
    title: "Template Management",
    desc: "Create and manage WhatsApp-approved templates directly in Zavis.",
  },
  {
    icon: Shield,
    title: "Consent Controls",
    desc: "Consent tracking, auto opt-out, quiet hours, and frequency caps.",
  },
  {
    icon: BarChart3,
    title: "Campaign ROI",
    desc: "Full attribution from campaign send to collected revenue.",
  },
  {
    icon: Zap,
    title: "Triggered Campaigns",
    desc: "Auto-send on post-visit, no-show, birthday, or custom triggers.",
  },
];

export const campaignUseCases = [
  { title: "Recall Campaigns", desc: "Automated hygiene, checkup, and booster recalls that fill your schedule." },
  { title: "Seasonal Promotions", desc: "Ramadan wellness, back-to-school, and flu shot drives to targeted segments." },
  { title: "Reactivation", desc: "Re-engage patients who have not visited in 6+ months." },
  { title: "New Service Launch", desc: "Announce new doctors or procedures to relevant segments." },
  { title: "Birthday & Wellness", desc: "Automated greetings that build loyalty and drive return visits." },
  { title: "Post-Visit Reviews", desc: "Request Google reviews timed after successful visits." },
];
