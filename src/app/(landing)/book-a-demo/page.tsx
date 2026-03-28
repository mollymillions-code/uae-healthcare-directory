import { Metadata } from "next";
import { ContactPageClient } from "@/components/landing/pages/ContactPageClient";

export const metadata: Metadata = {
  title: "Book a Demo",
  description:
    "Schedule a personalized 1-on-1 demo of Zavis. See how AI-powered patient engagement can transform your healthcare practice.",
  alternates: {
    canonical: "https://www.zavis.ai/book-a-demo",
  },
};

export default function BookADemoPage() {
  return <ContactPageClient />;
}
