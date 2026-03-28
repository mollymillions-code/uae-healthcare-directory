import type { Metadata } from "next";
import { AIAgentsPageClient } from "@/components/landing/pages/AIAgentsPageClient";

export const metadata: Metadata = {
  title: "AI Agents for Patient Communication",
  description:
    "24/7 AI-powered agents that handle patient inquiries, book appointments, and manage follow-ups on WhatsApp — no human intervention needed.",
  alternates: {
    canonical: "https://www.zavis.ai/ai-agents",
  },
};

export default function AIAgentsPage() {
  return <AIAgentsPageClient />;
}
