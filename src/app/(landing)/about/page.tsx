import { Metadata } from "next";
import { AboutPageClient } from "@/components/landing/pages/AboutPageClient";

export const metadata: Metadata = {
  title: "About Zavis",
  description:
    "Zavis is an AI-first patient success platform built in Dubai, helping healthcare organizations automate operations and grow.",
  alternates: {
    canonical: "https://www.zavis.ai/about",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
