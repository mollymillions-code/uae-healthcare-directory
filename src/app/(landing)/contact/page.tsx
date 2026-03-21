import { Metadata } from "next";
import { ContactPageClient } from "@/components/landing/pages/ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Zavis. Schedule a personalized 1-on-1 demo of our AI-powered patient engagement platform.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
