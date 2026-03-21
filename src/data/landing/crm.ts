import {
  Target,
  Tag,
  Route,
  BarChart3,
  DollarSign,
  FileText,
} from "lucide-react";

export const crmFeatures = [
  "Ads auto-ingestion from CTWA, TikTok, Meta, and Google lead forms",
  "Full UTM, campaign, keyword, GCLID/FBCLID attribution on every lead",
  "Auto-enrichment with source, intent, service line, and language",
  "Auto-segmentation with tags and labels applied by rules",
  "Auto-routing to the right coordinator by segmentation and SLAs",
  "AI-assisted Smart Summaries, Drafted Replies, and Answer Suggestions",
  "Funnel-to-revenue analytics from lead to booking to collection",
  "Role-based access and audit trail built in from day one",
];

export const patient360Features = [
  {
    icon: Target,
    title: "Automatic Lead Capture Across Every Channel",
    desc: "All channels and lead forms auto-captured with full attribution. Every ad dollar tracked to a patient.",
  },
  {
    icon: Tag,
    title: "Auto-Enriched Patient Profiles",
    desc: "Source, intent, service line, doctor preference, branch, and language enriched automatically.",
  },
  {
    icon: Route,
    title: "Right Person, Right Away",
    desc: "Auto-routed to the right coordinator by segmentation and SLAs for faster response.",
  },
  {
    icon: BarChart3,
    title: "Lifecycle Tracked Automatically",
    desc: "New to Engaged to Qualified to Booked to Visited to Reactivation, auto-tracked by triggers.",
  },
  {
    icon: FileText,
    title: "One Timeline, One Truth",
    desc: "Chat, calls, bookings, invoices, and tasks on one record. Patients never repeat themselves.",
  },
  {
    icon: DollarSign,
    title: "Full Revenue Attribution",
    desc: "Lead to conversation to booking to revenue by source, doctor, service, and campaign.",
  },
];

export const revenueFeatures = [
  "Revenue summary: gross, net, discounts, and refunds at a glance",
  "Collections: collected vs pending with ageing buckets",
  "Breakdowns by doctor, department, branch, and service",
  "Source attribution from WhatsApp, calls, web chat, campaigns, and walk-ins",
  "Payment mix: card, cash, Stripe, Tabby, bank transfer, and wallet",
  "Filters by period, clinic, branch, doctor, and service",
  "Downloadable reports for finance and management reviews",
];
