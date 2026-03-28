import { Metadata } from "next";
import { DentalPageClient } from "@/components/landing/pages/DentalPageClient";

export const metadata: Metadata = {
  title: "Dental Practice Patient Engagement",
  description:
    "Automate dental patient booking, recalls, and communication via WhatsApp. AI-powered scheduling, EMR integration, and campaign management for dental clinics.",
  alternates: {
    canonical: "https://www.zavis.ai/dental",
  },
};

export default function DentalPage() {
  return <DentalPageClient />;
}
