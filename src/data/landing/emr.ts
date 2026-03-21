import {
  ArrowRightLeft,
  CalendarCheck,
  FileText,
  Stethoscope,
  Users,
  Shield,
  RefreshCw,
  Database,
  Zap,
  BarChart3,
} from "lucide-react";

export const emrFeatures = [
  {
    icon: ArrowRightLeft,
    title: "Bidirectional Sync",
    desc: "Bookings, cancellations, and reschedules sync both ways in real time.",
  },
  {
    icon: CalendarCheck,
    title: "Live Schedule Access",
    desc: "Real-time doctor availability pulled directly from your EMR.",
  },
  {
    icon: FileText,
    title: "MRN Matching",
    desc: "Auto-match patients to records by MRN, phone, or email.",
  },
  {
    icon: Stethoscope,
    title: "Department & Service Mapping",
    desc: "EMR departments and provider schedules mapped into Zavis.",
  },
  {
    icon: Users,
    title: "Patient Profile Sync",
    desc: "Demographics, visit history, and insurance flow automatically.",
  },
  {
    icon: Shield,
    title: "Compliance & Audit Trail",
    desc: "Every data exchange logged. HIPAA and DHA compliance built in.",
  },
];

export const emrCapabilities = [
  {
    icon: Database,
    title: "Multi-EMR Support",
    desc: "One integration layer for single clinics or multi-platform hospital groups.",
  },
  {
    icon: Zap,
    title: "Real-Time Webhooks",
    desc: "EMR events trigger instant Zavis actions with zero delay.",
  },
  {
    icon: RefreshCw,
    title: "Automated Writeback",
    desc: "Bookings from coordinators, AI, or patients write back automatically.",
  },
  {
    icon: BarChart3,
    title: "Revenue Attribution",
    desc: "UTM and campaign data travel with each booking into your EMR.",
  },
];
