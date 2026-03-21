import {
  MessageSquareText,
  FileText,
  FlaskConical,
  Inbox,
  Settings2,
  Sparkles,
  BookOpen,
  Brain,
  Shield,
  Languages,
} from "lucide-react";

export const captainFeatures = [
  {
    icon: MessageSquareText,
    title: "FAQ Knowledge Base",
    desc: "Auto-generate FAQs from resolved conversations that get smarter over time.",
  },
  {
    icon: FileText,
    title: "Document Training",
    desc: "Upload URLs, PDFs, and articles for accurate answers with citations.",
  },
  {
    icon: FlaskConical,
    title: "Playground Testing",
    desc: "Test and fine-tune AI responses before going live.",
  },
  {
    icon: Inbox,
    title: "Inbox-Specific Agents",
    desc: "Different AI personalities per channel, each tuned for its audience.",
  },
  {
    icon: Settings2,
    title: "Agent Configuration",
    desc: "Set personality, role, handoff behavior, and escalation triggers.",
  },
  {
    icon: Sparkles,
    title: "Auto-Learning",
    desc: "Captures conversation details to build a growing knowledge base.",
  },
];

export const captainCapabilities = [
  {
    icon: BookOpen,
    title: "Source Citations",
    desc: "AI responses include citations so patients know the source.",
  },
  {
    icon: Brain,
    title: "Memory System",
    desc: "Recalls patient details across conversations automatically.",
  },
  {
    icon: Shield,
    title: "Guardrails & Compliance",
    desc: "Medical disclaimers, scope limits, and escalation rules built in.",
  },
  {
    icon: Languages,
    title: "Multilingual Support",
    desc: "Detects and responds in Arabic, English, Hindi, and more.",
  },
];
