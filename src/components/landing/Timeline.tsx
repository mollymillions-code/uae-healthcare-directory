import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { timelineData } from "@/data/landing/timeline";

export function Timeline({
  heading,
  subheading,
}: { heading?: string; subheading?: string } = {}) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#f8f8f6]">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="flex justify-center mb-6">
          <span className="bg-[rgba(0,104,40,0.07)] text-[#006828] font-['Geist',sans-serif] font-medium text-sm px-6 py-2.5 rounded-full">
            Go live in days, not months.
          </span>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-center text-black tracking-tight mb-5 max-w-3xl mx-auto leading-[1.1]">
            {heading || "From signup to go-live in days, not months"}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="max-w-[600px] mx-auto mb-12 lg:mb-16">
          <p className="text-center font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
            {subheading || "We deploy alongside your team, starting with your most impactful workflow, then expanding channel by channel until every patient touchpoint is covered."}
          </p>
        </AnimatedSection>

        <StaggerContainer className="space-y-10 lg:space-y-16">
          {timelineData.map((item, index) => (
            <StaggerItem key={index}>
              <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
                <div className="flex lg:flex-col items-center gap-3 lg:w-[140px] flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-[#006828] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#006828]" />
                  </div>
                  <span className="border border-[#006828]/30 rounded-full px-3 py-1 font-['Geist',sans-serif] font-semibold text-xs text-[#006828] uppercase tracking-wide">
                    {item.day}
                  </span>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 items-center">
                  <div className="lg:w-[45%] text-center lg:text-left">
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[23px] sm:text-[24px] lg:text-[32px] tracking-tight text-[#1c1c1c] mb-1">
                      {item.title}<span className="text-[#006828]">.</span>
                    </h3>
                    <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base lg:text-lg tracking-tight text-[#1c1c1c] mb-3">
                      {item.subtitle}
                    </p>
                    <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/50 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="w-full lg:w-[55%] rounded-2xl lg:rounded-[32px] overflow-hidden aspect-[16/10]">
                    <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
