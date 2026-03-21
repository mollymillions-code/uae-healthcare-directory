import {
  Webhook,
  LayoutDashboard,
  Bot,
  MessageSquare,
  Languages,
  Video,
  Stethoscope,
  Megaphone,
  CreditCard,
  Smartphone,
} from "lucide-react";

export const integrationCategories = [
  {
    title: "Communication Channels",
    desc: "Every patient touchpoint in one inbox with unified routing.",
    items: [
      { name: "WhatsApp Business API", desc: "Official API with template management" },
      { name: "Instagram DMs", desc: "Direct messages from your profile" },
      { name: "Facebook Messenger", desc: "Page messages with full history" },
      { name: "TikTok Lead Forms", desc: "Capture leads from campaigns" },
      { name: "SMS (Twilio)", desc: "Two-way SMS with templates" },
      { name: "Email", desc: "Email in the same timeline" },
      { name: "Website Live Chat", desc: "Embedded chat for your site" },
    ],
  },
  {
    title: "Healthcare Systems",
    desc: "Two-way EMR sync eliminates double entry and data errors.",
    items: [
      { name: "EMR / PMS Integration", desc: "Live schedules and booking writeback" },
      { name: "Lab & Imaging Systems", desc: "Order tracking and result notifications" },
      { name: "Billing & Invoicing", desc: "Payment links with revenue attribution" },
      { name: "Pharmacy Systems", desc: "Prescription and refill reminders" },
    ],
  },
  {
    title: "Ad & Marketing Platforms",
    desc: "Full attribution from ad click to collected revenue.",
    items: [
      { name: "Google Ads", desc: "Lead forms and GCLID tracking" },
      { name: "Meta Ads (Facebook & Instagram)", desc: "Lead forms and CTWA support" },
      { name: "TikTok Ads", desc: "Lead form integration" },
    ],
  },
];

export const nativeIntegrations = [
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Real-time event notifications with no middleware needed.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Apps",
    desc: "Embed custom apps displaying patient data directly in Zavis.",
  },
  {
    icon: Bot,
    title: "OpenAI",
    desc: "Reply suggestions, rephrasing, summaries, and smart labels.",
  },
  {
    icon: MessageSquare,
    title: "Dialogflow",
    desc: "Custom chatbot flows integrated into your Zavis inbox.",
  },
  {
    icon: Languages,
    title: "Google Translate",
    desc: "Real-time message translation across any language pair.",
  },
  {
    icon: Video,
    title: "Dyte Video",
    desc: "Video and voice calls directly from Zavis conversations.",
  },
];

export const integrationHighlights = [
  {
    icon: Stethoscope,
    title: "EMR Writeback",
    desc: "Bidirectional sync with zero double entry.",
  },
  {
    icon: Megaphone,
    title: "Ad Attribution",
    desc: "Full click-to-revenue tracking across all campaigns.",
  },
  {
    icon: CreditCard,
    title: "Payment Systems",
    desc: "In-chat payment links with revenue attribution.",
  },
  {
    icon: Smartphone,
    title: "API-First Platform",
    desc: "RESTful API for custom integrations, no middleware.",
  },
];
