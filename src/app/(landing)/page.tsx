import { Metadata } from "next";
import { HomePageClient } from "@/components/landing/pages/HomePageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteWithSearchSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Patient Success Platform for Healthcare Providers",
  description:
    "Zavis is the AI patient success platform for healthcare providers. Automate patient engagement across WhatsApp, voice, and web with AI-powered booking, CRM, and campaign management.",
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
