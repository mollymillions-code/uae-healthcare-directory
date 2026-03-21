import {
  MessageSquare,
  Bot,
  Activity,
  Users,
  Megaphone,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export const reportCategories = [
  {
    icon: MessageSquare,
    title: "Conversation Reports",
    desc: "Volume trends, traffic heatmaps, payment-link clicks, and engagement patterns across every channel.",
    bgColor: "bg-[#006828]/10",
    textColor: "text-[#006828]",
  },
  {
    icon: Bot,
    title: "AI Agent Analytics",
    desc: "Resolution rate, handoff rate, bookings created, and campaign tracking for every AI agent.",
    bgColor: "bg-[#006828]/10",
    textColor: "text-[#006828]",
  },
  {
    icon: Activity,
    title: "Engagement Metrics",
    desc: "Response times, booking conversion, and resolution speeds showing patient progression.",
    bgColor: "bg-[#006828]/10",
    textColor: "text-[#006828]",
  },
  {
    icon: Users,
    title: "Team & Experience Metrics",
    desc: "Agent productivity, SLA tracking, CSAT/NPS, and wait times at a glance.",
    bgColor: "bg-[#006828]/10",
    textColor: "text-[#006828]",
  },
];

export const appointmentMetrics = [
  "Totals: appointments, confirmed rate, cancelled rate, and no-show rate",
  "Daily and weekly volume trends with peak analysis",
  "Status distribution: booked vs arrived vs completed vs no-show",
  "Doctor occupancy heatmap with hour-by-hour load",
  "Peak hour and peak day demand spikes for staffing",
  "Leakage tracking by source, service, and doctor",
  "Filters by period, branch, doctor, department, and service",
];

export const adsToRevenue = [
  {
    icon: Megaphone,
    title: "Connect Ad Platforms",
    desc: "Google Ads, Meta, TikTok, and CTWA auto-ingested.",
  },
  {
    icon: Target,
    title: "Full Attribution",
    desc: "UTM, campaign, ad set, keyword, GCLID/FBCLID preserved end to end.",
  },
  {
    icon: TrendingUp,
    title: "Funnel View",
    desc: "Click to lead to qualified to booking to revenue with drop-off visibility.",
  },
  {
    icon: BarChart3,
    title: "Campaign ROI",
    desc: "Cost-per-lead, cost-per-booking, and ROAS for every campaign.",
  },
];

export const mockStats = [
  { label: "Total Appointments", value: "12,847", change: "+18.3%" },
  { label: "Confirmed Rate", value: "87.4%", change: "+4.2%" },
  { label: "No-Show Rate", value: "6.1%", change: "-2.8%" },
  { label: "Avg. Revenue / Visit", value: "AED 485", change: "+12.1%" },
];
