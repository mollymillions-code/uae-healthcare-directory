import { Metadata } from "next";
import { AnalyticsPageClient } from "@/components/landing/pages/AnalyticsPageClient";

export const metadata: Metadata = {
  title: "Healthcare Analytics & Reporting",
  description:
    "Track patient flow, campaign ROI, channel performance, and team productivity with real-time healthcare analytics dashboards.",
};

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}
