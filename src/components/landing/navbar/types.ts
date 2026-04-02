import {
  Smile,
  Droplets,
  Eye,
  Bone,
  Ear,
  Clock,
  Brain,
  PawPrint,
  Home,
  Sparkles,
  HeartPulse,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SpecialtyItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type DescItem = {
  label: string;
  href: string;
  desc: string;
};

export type ComingSoonItem = {
  label: string;
  comingSoon: true;
};

export type CardItem = {
  label: string;
  href: string;
  desc: string;
  card: true;
};

export type ExternalItem = {
  label: string;
  externalHref: string;
  external?: boolean;
  dimmed?: boolean;
};

export type MegaColumn = {
  heading: string;
} & (
  | { type: "specialty"; items: SpecialtyItem[] }
  | { type: "desc"; items: DescItem[] }
  | { type: "coming-soon"; items: ComingSoonItem[] }
  | { type: "card"; items: CardItem[] }
  | { type: "mixed"; items: (ExternalItem | { label: string; href: string })[] }
);

export type MegaMenuData = {
  label: string;
  columns: MegaColumn[];
};

// ─── Data ───────────────────────────────────────────────────────────────────

const specialties: SpecialtyItem[] = [
  { label: "Dental", href: "/dental", icon: Smile },
  { label: "Dermatology", href: "/dermatology", icon: Droplets },
  { label: "Optometry", href: "/optometry", icon: Eye },
  { label: "Orthopedics", href: "/orthopedics", icon: Bone },
  { label: "ENT", href: "/ent", icon: Ear },
  { label: "Urgent Care", href: "/urgent-care", icon: Clock },
  { label: "Mental Health", href: "/mental-health", icon: Brain },
  { label: "Veterinary", href: "/veterinary", icon: PawPrint },
  { label: "Homecare", href: "/homecare", icon: Home },
  { label: "Aesthetic", href: "/aesthetic", icon: Sparkles },
  { label: "Longevity & Wellness", href: "/longevity-wellness", icon: HeartPulse },
];

export const megaMenus: MegaMenuData[] = [
  {
    label: "Solutions",
    columns: [
      {
        heading: "BY SPECIALTY",
        type: "specialty",
        items: specialties,
      },
      {
        heading: "KEY OPERATIONS",
        type: "desc",
        items: [
          { label: "CRM", href: "/crm", desc: "Native patient CRM & pipeline" },
          { label: "Analytics", href: "/analytics", desc: "Revenue attribution & reporting" },
          { label: "Automations", href: "/automations", desc: "Always-on patient journeys" },
          { label: "Campaigns", href: "/campaigns", desc: "Multi-channel broadcast campaigns" },
        ],
      },
      {
        heading: "RESOURCES",
        type: "coming-soon",
        items: [
          { label: "Case Studies", comingSoon: true },
          { label: "Blog", comingSoon: true },
        ],
      },
    ],
  },
  {
    label: "Platform",
    columns: [
      {
        heading: "COMMUNICATION",
        type: "desc",
        items: [
          {
            label: "Omnichannel Inbox",
            href: "/chat",
            desc: "WhatsApp, Instagram, Facebook, TikTok, web. One thread per patient",
          },
          {
            label: "Voice",
            href: "/voice",
            desc: "Native cloud calling with screen pop, recording & transcripts",
          },
          {
            label: "Website Widgets",
            href: "/widgets",
            desc: "Booking + chat widgets on your site with EMR writeback",
          },
        ],
      },
      {
        heading: "AI & AUTOMATION",
        type: "desc",
        items: [
          {
            label: "AI Agents",
            href: "/ai-agents",
            desc: "Brand-tuned chat & voice AI that qualifies, books, and follows up",
          },
          {
            label: "EMR Integration",
            href: "/emr",
            desc: "Bidirectional EMR sync. Zero double entry, one source of truth",
          },
          {
            label: "Integrations",
            href: "/integrations",
            desc: "Webhooks, OpenAI, Google Translate, Dyte & more",
          },
        ],
      },
      {
        heading: "OPERATIONS",
        type: "desc",
        items: [
          {
            label: "Bookings",
            href: "/bookings",
            desc: "Live EMR sync. Create, reschedule, cancel with writeback",
          },
          {
            label: "Payment Collection",
            href: "/payments",
            desc: "In-chat payment links with tracking & EMR-linked invoicing",
          },
          {
            label: "Mobile App",
            href: "/mobile",
            desc: "Full Zavis on iOS & Android. Conversations, reports, team management",
          },
        ],
      },
    ],
  },
  {
    label: "Company",
    columns: [
      {
        heading: "COMPANY",
        type: "card",
        items: [
          { label: "About", href: "/about", desc: "Our mission, values & UAE-based team", card: true },
        ],
      },
      {
        heading: "GET IN TOUCH",
        type: "card",
        items: [
          {
            label: "Contact",
            href: "/contact",
            desc: "Book a demo, get pricing, or ask anything",
            card: true,
          },
        ],
      },
      {
        heading: "MORE",
        type: "mixed",
        items: [
          { label: "Help Center", externalHref: "#", external: true, dimmed: true },
          { label: "Email Us", externalHref: "mailto:syed@zavis.ai" },
        ],
      },
    ],
  },
];
