import type { Metadata } from "next";
import { ChatPageClient } from "@/components/landing/pages/ChatPageClient";

export const metadata: Metadata = {
  title: "Omnichannel Patient Inbox",
  description:
    "Manage WhatsApp, Instagram, Facebook, and web chat patient conversations in one unified inbox. AI-assisted replies and smart routing for healthcare teams.",
};

export default function ChatPage() {
  return <ChatPageClient />;
}
