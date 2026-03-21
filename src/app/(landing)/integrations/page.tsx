import type { Metadata } from "next";
import { IntegrationsPageClient } from "@/components/landing/pages/IntegrationsPageClient";

export const metadata: Metadata = {
  title: "Healthcare Integrations & EMR Sync",
  description:
    "Connect Zavis with your EMR, payment gateway, and communication tools. Bidirectional sync with zero middleware.",
};

export default function IntegrationsPage() {
  return <IntegrationsPageClient />;
}
