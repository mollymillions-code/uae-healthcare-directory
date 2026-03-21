import {
  MessageSquare,
  Users,
  Globe,
  Zap,
} from "lucide-react";
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  WebChatIcon,
} from "@/components/landing/BrandIcons";

export const channels = [
  { name: "WhatsApp", icon: WhatsAppIcon, color: "#25D366" },
  { name: "Instagram", icon: InstagramIcon, color: "#E4405F" },
  { name: "Facebook", icon: FacebookIcon, color: "#1877F2" },
  { name: "TikTok", icon: TikTokIcon, color: "#010101" },
  { name: "Web Chat", icon: WebChatIcon, color: "#006828" },
];

export const chatFeatures = [
  {
    icon: MessageSquare,
    title: "Unified Patient Conversations Across All Channels",
    description:
      "One conversation per patient, every channel. Full context travels between departments so patients never repeat themselves.",
  },
  {
    icon: Users,
    title: "Multi-Branch, Multi-Number Patient Communication",
    description:
      "One team manages WhatsApp, Instagram, calls, and web chat from a single screen with multi-branch support.",
  },
  {
    icon: Globe,
    title: "Full Ad Attribution from Click to Revenue",
    description:
      "Google Ads and Meta lead forms auto-ingest with UTM, campaign, keyword, and GCLID/FBCLID on every lead.",
  },
  {
    icon: Zap,
    title: "AI-Assisted Responses with Smart Summaries",
    description:
      "Smart summaries, drafted replies, and answer suggestions cut response time so patients get faster, accurate answers.",
  },
];

export const chatHighlights = [
  "One inbox replaces five tools, cutting software spend",
  "Every ad lead auto-captured with full campaign attribution",
  "One team, one screen, all touchpoints",
  "Full patient history in a single timeline",
  "AI summaries and drafted replies speed up responses",
  "Every inquiry tracked so nothing goes unanswered",
];
