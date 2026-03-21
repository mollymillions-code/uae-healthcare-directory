import { Metadata } from "next";
import { MobilePageClient } from "@/components/landing/pages/MobilePageClient";

export const metadata: Metadata = {
  title: "Mobile App for Healthcare Teams",
  description:
    "Manage patient conversations, bookings, and team tasks on the go with the Zavis mobile app for iOS and Android.",
};

export default function MobilePage() {
  return <MobilePageClient />;
}
