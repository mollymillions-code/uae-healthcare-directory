import { Metadata } from "next";
import { HomePageClient } from "@/components/landing/pages/HomePageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteWithSearchSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Patient Operations Platform for UAE Clinics",
  description:
    "Zavis helps UAE clinics manage WhatsApp, calls, bookings, reminders, payments, recall campaigns, and patient follow-up with AI-supported workflows.",
  alternates: {
    canonical: "https://www.zavis.ai",
  },
};

export default function LandingHomePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteWithSearchSchema()} />
      <HomePageClient />
    </>
  );
}
