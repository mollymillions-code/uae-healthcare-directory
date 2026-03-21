import { Metadata } from "next";
import { AboutPageClient } from "@/components/landing/pages/AboutPageClient";

export const metadata: Metadata = {
  title: "About Zavis",
  description:
    "Zavis is an AI-first patient success platform built in Dubai, helping healthcare organizations automate operations and grow.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
