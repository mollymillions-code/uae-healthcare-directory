"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function KnowledgeBaseSection() {
  const [activeFeature, setActiveFeature] = useState(
    "conversation-intelligence"
  );

  const content = {
    title: "Knowledge base",
    features: [
      {
        id: "conversation-intelligence",
        title: "AI-Powered Conversation Intelligence",
        description:
          "Zavis listens, learns, and adapts—extracting customer sentiment, tagging intents, and surfacing insights automatically from every chat or call.",
        image: "/images/landing/conversation-intelligence.png",
        bgColor: "bg-yellow-200",
      },
      {
        id: "autonomous-routing",
        title: "Autonomous AI Actions & Routing",
        description:
          "Let AI not just respond—but decide. Whether it's sending follow-ups, flagging escalations, or scheduling appointments, Zavis acts instantly on customer context without human involvement.",
        image: "/images/landing/autonomous-ai-actions-routing.png",
        bgColor: "bg-blue-200",
      },
      {
        id: "omnichannel-stack",
        title: "Enterprise-Grade Omnichannel Stack",
        description:
          "Handle WhatsApp, voice, SMS, Slack, Telegram, website widget email, and webchat on one seamless dashboard.",
        image: "/images/landing/enterprise-grade-omnichannel-stack.png",
        bgColor: "bg-purple-200",
      },
      {
        id: "crm-integration",
        title: "Plug & Play CRM Integration",
        description:
          "Out-of-the-box integrations with over 100 CRMs including HubSpot, Zoho, Salesforce, and Shopify.",
        image: "/images/landing/knowledge.png",
        bgColor: "bg-green-200",
      },
      {
        id: "workflow-builder",
        title: "No-Code Workflow Builder",
        description:
          "Automate entire customer journeys, from lead capture to post-sale feedback—without writing a single line of code.",
        image: "/images/landing/no-code-workflow-builder.png",
        bgColor: "bg-indigo-200",
      },
      {
        id: "adaptive-templates",
        title: "Industry-Adaptive Templates",
        description:
          "Whether you're a gym, real estate firm, clinic, or ecommerce store—we have prebuilt automations tailored to you.",
        image: "/images/landing/industry-adaptive-template.png",
        bgColor: "bg-pink-200",
      },
      {
        id: "campaign-automation",
        title: "Smart Campaign Automation",
        description:
          "Launch, schedule, and personalize large-scale campaigns with AI-led message optimization and trigger-based follow-ups.",
        image: "/images/landing/industry-adaptive-template-1.png",
        bgColor: "bg-teal-200",
      },
      {
        id: "intelligence-hub",
        title: "Performance Intelligence Hub",
        description:
          "See who clicked, who responded, which workflows convert, and how every team member is performing—instantly.",
        image: "/images/landing/industry-adaptive-template-2.png",
        bgColor: "bg-cyan-200",
      },
    ],
  };

  const activeFeatureData = content.features.find(
    (feature) => feature.id === activeFeature
  );

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto container">
        {/* Title */}
        <div className="pr-5">
          <h2 className="text-2xl font-medium text-primary py-3">
            {content.title}
          </h2>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Left Side - Navigation */}
          <div className="space-y-0">
            {content.features.map((feature) => (
              <div
                key={feature.id}
                className="border-b border-gray-400 first:border-t-1"
              >
                <button
                  onMouseEnter={() => setActiveFeature(feature.id)}
                  className={`w-full py-3 text-left transition-colors duration-200 font-medium cursor-pointer ${
                    activeFeature === feature.id
                      ? "text-[#006828] "
                      : "text-gray-400"
                  }`}
                >
                  <h3 className="text-2xl md:text-3xl lg:text-4xl">
                    {feature.title}
                  </h3>
                </button>
              </div>
            ))}
          </div>

          {/* Right Side - Image and Description */}
          <div className="space-y-6 flex flex-col items-center justify-center">
            {/* Image Container */}
            <div className="w-full h-full flex item-center justify-center relative">
              <img
                src={activeFeatureData?.image || "/placeholder.svg"}
                alt={`${activeFeatureData?.title} demonstration`}
                className="w-full h-full object-contain transition-opacity duration-500"
                key={activeFeature}
              />
            </div>

            {/* Description */}
            <div className="transition-all duration-500">
              <p className="text-lg text-primary mx-auto md:max-w-2xl">
                {activeFeatureData?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Accordion Layout */}
        <div className="lg:hidden space-y-0">
          {content.features.map((feature) => (
            <div key={feature.id} className="border-b border-gray-400">
              {/* Accordion Header */}
              <button
                onClick={() =>
                  setActiveFeature(
                    activeFeature === feature.id ? "" : feature.id
                  )
                }
                className="w-full py-4 text-left flex items-center justify-between transition-colors duration-200"
              >
                <h3
                  className={`text-xl font-medium ${
                    activeFeature === feature.id
                      ? "text-[#006828]"
                      : "text-gray-400"
                  }`}
                >
                  {feature.title}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    activeFeature === feature.id
                      ? "rotate-180 text-[#006828]"
                      : "text-gray-400"
                  }`}
                />
              </button>

              {/* Accordion Content */}
              {activeFeature === feature.id && (
                <div className="pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {/* Image */}
                  <div className="w-full flex justify-center">
                    <img
                      src={feature.image || "/placeholder.svg"}
                      alt={`${feature.title} demonstration`}
                      className="w-full max-w-sm h-auto object-contain"
                    />
                  </div>

                  {/* Description */}
                  <p className="text-base text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
