import { Plus, Minus } from "lucide-react";

interface FaqItem { question: string; answer: string; }
interface FaqSectionProps { title?: string; faqs: FaqItem[]; }

export function FaqSection({ title = "FAQ", faqs }: FaqSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="bg-[#f8f8f6] border border-black/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{title}</h2>
        </div>
        <div>
          {faqs.map((faq, index) => (
            <details key={index} className="group border-b border-black/[0.06] last:border-b-0">
              <summary className="flex w-full cursor-pointer list-none items-start justify-between py-4 text-left [&::-webkit-details-marker]:hidden">
                <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-[#1c1c1c] pr-4 group-hover:text-[#006828] transition-colors tracking-tight">
                  {faq.question}
                </span>
                <Plus className="h-4 w-4 text-black/30 flex-shrink-0 mt-0.5 group-open:hidden" />
                <Minus className="hidden h-4 w-4 text-[#006828] flex-shrink-0 mt-0.5 group-open:block" />
              </summary>
              <div className="pb-4 -mt-1">
                <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed max-w-2xl">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
