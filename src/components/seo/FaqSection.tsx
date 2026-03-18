"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { JsonLd } from "./JsonLd";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string;
  faqs: FaqItem[];
}

export function FaqSection({ title = "Questions", faqs }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="mt-12">
      <JsonLd data={faqJsonLd} />
      <div className="rule-thick" />
      <h2 className="font-serif text-2xl font-bold text-ink pt-4 pb-2">
        {title}
      </h2>
      <div>
        {faqs.map((faq, index) => (
          <div key={index} className="rule">
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="flex w-full items-start justify-between py-4 text-left group"
            >
              <span className="font-serif text-base text-ink pr-4 group-hover:text-warm transition-colors">
                {faq.question}
              </span>
              {openIndex === index ? (
                <Minus className="h-4 w-4 text-warm flex-shrink-0 mt-1" />
              ) : (
                <Plus className="h-4 w-4 text-ink-200 flex-shrink-0 mt-1" />
              )}
            </button>
            {openIndex === index && (
              <div className="pb-4 -mt-1">
                <p className="text-sm text-ink-400 leading-relaxed font-serif max-w-2xl">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
