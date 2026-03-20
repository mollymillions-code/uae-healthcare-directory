"use client";

import { useState } from "react";
import Image from "next/image";

export default function FaqSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const content = {
    title: "FAQ",
    faqs: [
      {
        id: "what-is-zavis",
        question: "What is Zavis?",
        answer:
          "Zavis is an all-in-one WhatsApp suite built to 5x your sales. It helps businesses manage conversations, campaigns, and customer relationships through a unified dashboard, enabling seamless WhatsApp marketing and customer engagement.",
      },
      {
        id: "is-zavis-secure",
        question: "Is Zavis secure?",
        answer:
          "Yes, Zavis is built with enterprise-grade security. We use end-to-end encryption, comply with data protection regulations, and maintain the highest security standards to protect your business and customer data.",
      },
      {
        id: "zavis-cost",
        question: "How much does Zavis cost?",
        answer:
          "Zavis offers flexible pricing plans to suit businesses of all sizes. We have starter plans for small businesses and enterprise solutions for larger organizations. Contact our sales team for detailed pricing information.",
      },
      {
        id: "crm-integration",
        question: "Can I use Zavis with any CRM platform?",
        answer:
          "Yes, Zavis integrates with popular CRM platforms including Salesforce, HubSpot, and many others. Our API allows for seamless data synchronization and workflow automation across your existing tools.",
      },
      {
        id: "developer-automation",
        question: "Can I automate as a developer?",
        answer:
          "Zavis provides comprehensive APIs and developer tools that allow you to build custom automations, integrate with your existing systems, and create tailored solutions for your business needs.",
      },
      {
        id: "getting-started",
        question: "How quickly can I get started?",
        answer:
          "You can get started with Zavis in under 60 seconds. Simply sign up, connect your WhatsApp Business account, and start engaging with customers immediately through our intuitive dashboard.",
      },
      {
        id: "higher-quota",
        question: "How can I get a higher quota?",
        answer:
          "To increase your messaging quota, you can upgrade your plan or contact our support team. We offer scalable solutions that grow with your business needs and messaging volume requirements.",
      },
      {
        id: "crm-enterprise",
        question: "Can I use Zavis with my CRM Enterprise account?",
        answer:
          "Yes, Zavis fully supports enterprise CRM integrations. We offer dedicated enterprise features, custom integrations, and priority support to ensure seamless operation with your existing enterprise systems.",
      },
    ],
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-3xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-primary">
            {content.title}
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-0">
          {content.faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={
                index === 0 ? "border-y border-black" : "border-b border-black"
              }
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full py-6 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="min-w-[24px]">
                    {openItems.includes(faq.id) ? (
                      <Image
                        src="/images/landing/contract-ic.svg"
                        alt="Contract Icon"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <Image
                        src="/images/landing/expand-ic.svg"
                        alt="Expand Icon"
                        width={24}
                        height={24}
                      />
                    )}
                  </div>
                  <h3 className="text-2xl md:text-4xl font-semibold text-primary">
                    {faq.question}
                  </h3>
                </div>
              </button>

              {openItems.includes(faq.id) && (
                <div className="pb-6 pl-10">
                  <p className="text-primary ">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
