import { Metadata } from "next";
import { AutomationsPageClient } from "@/components/landing/pages/AutomationsPageClient";

export const metadata: Metadata = {
  title: "Patient Journey Automations",
  description:
    "Build no-code automation workflows for patient recalls, follow-ups, appointment reminders, and re-engagement campaigns.",
  alternates: {
    canonical: "https://www.zavis.ai/automations",
  },
};

export default function AutomationsPage() {
  return <AutomationsPageClient />;
}
