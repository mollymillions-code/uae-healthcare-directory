"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem { question: string; answer: string; }
interface FaqSectionProps { title?: string; faqs: FaqItem[]; }

export function FaqSection({ title = "FAQ", faqs }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (faqs.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="bg-light-50 border border-light-200 p-6">
        <div className="section-header">
          <h2>{title}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div>
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-light-200 last:border-b-0">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-start justify-between py-4 text-left group"
              >
                <span className="text-sm font-bold text-dark pr-4 group-hover:text-accent transition-colors">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <Minus className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                ) : (
                  <Plus className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" />
                )}
              </button>
              {openIndex === index && (
                <div className="pb-4 -mt-1">
                  <p className="text-sm text-muted leading-relaxed max-w-2xl">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
