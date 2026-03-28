import { Metadata } from "next";
import { CampaignsPageClient } from "@/components/landing/pages/CampaignsPageClient";

export const metadata: Metadata = {
  title: "WhatsApp Campaign Management",
  description:
    "Send targeted WhatsApp broadcast campaigns to patients. Track delivery, opens, and bookings with built-in analytics.",
  alternates: {
    canonical: "https://www.zavis.ai/campaigns",
  },
};

export default function CampaignsPage() {
  return <CampaignsPageClient />;
}
