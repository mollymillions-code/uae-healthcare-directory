import {
  CreditCard,
  Send,
  BarChart3,
  Link2,
  Clock,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";

export const paymentFeatures = [
  {
    icon: Link2,
    title: "In-Chat Payment Links",
    desc: "Send payment links in WhatsApp, SMS, or web chat conversations.",
  },
  {
    icon: Send,
    title: "Automated Payment Reminders",
    desc: "Overdue balances trigger WhatsApp follow-ups automatically.",
  },
  {
    icon: BarChart3,
    title: "Revenue Attribution",
    desc: "Every payment traced to its campaign, channel, and service.",
  },
  {
    icon: Stethoscope,
    title: "EMR-Linked Invoicing",
    desc: "Invoices sync with your EMR. Payment status flows back automatically.",
  },
  {
    icon: Clock,
    title: "Click Tracking",
    desc: "See when patients open links and where drop-offs occur.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Processing",
    desc: "PCI-compliant encrypted links with no card details over chat.",
  },
];

export const paymentWorkflow = [
  { step: "Appointment completed", detail: "Invoice synced from EMR automatically" },
  { step: "Payment link generated", detail: "One-click secure link creation" },
  { step: "Link sent in patient thread", detail: "WhatsApp message with one-tap pay button" },
  { step: "Patient pays securely", detail: "PCI-compliant card or digital wallet checkout" },
  { step: "Status updated everywhere", detail: "Zavis, EMR, and analytics updated in real time" },
];

export const paymentStats = [
  { icon: CreditCard, label: "In-Chat Payments", value: "Collect inside conversations with less friction" },
  { icon: TrendingUp, label: "Revenue Tracking", value: "Ad click to collected payment, every dirham traced" },
  { icon: Clock, label: "Faster Collection", value: "Automated reminders reduce accounts receivable" },
  { icon: ShieldCheck, label: "PCI Compliant", value: "Secure encrypted links, compliance built in" },
];
