import { Metadata } from "next";
import { BookingsPageClient } from "@/components/landing/pages/BookingsPageClient";

export const metadata: Metadata = {
  title: "Smart Appointment Scheduling",
  description:
    "Real-time EMR-synced appointment booking with AI-powered scheduling, WhatsApp confirmations, and one-click reschedule or cancel.",
  alternates: {
    canonical: "https://www.zavis.ai/bookings",
  },
};

export default function BookingsPage() {
  return <BookingsPageClient />;
}
