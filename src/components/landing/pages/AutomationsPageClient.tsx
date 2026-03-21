"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { CheckCircle2, ArrowRight, Zap, Search, Send, BarChart3 } from "lucide-react";
import { automationCategories, useCases } from "@/data/landing/automations";
import { VisualFlow } from "@/components/landing/VisualFlow";

export function AutomationsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                Automations
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto">
              Always-on journeys that{" "}
              <span className="text-[#006828]">drive bookings</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              Booking lifecycle, missed-call recovery, follow-ups, reactivation, and campaigns triggered automatically with EMR writeback.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <ShimmerLink href="/contact" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </AnimatedSection>
        </div>
      </section>

      {/* Hero Image */}
      <AnimatedSection className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-[1000px] mx-auto relative">
          <div className="absolute -inset-2 bg-gradient-to-b from-black/10 to-transparent rounded-[36px] blur-lg" />
          <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
            <ImageWithFallback
              src="/assets/automations-hero.webp"
              alt="Presenter in boardroom explaining patient journey automation workflow on whiteboard to clinic staff"
              className="w-full h-auto object-cover aspect-[16/9]"
              loading="eager"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Automation Flow */}
      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[900px] mx-auto text-center">
          <p className="font-['Geist',sans-serif] font-medium text-xs text-black/30 uppercase tracking-widest mb-6">
            How every automation works
          </p>
          <VisualFlow
            steps={[
              { icon: Zap, label: "Trigger fires" },
              { icon: Search, label: "Condition checked" },
              { icon: Send, label: "Action executed" },
              { icon: BarChart3, label: "Result tracked" },
            ]}
          />
        </AnimatedSection>
      </section>

      {/* Automation Categories */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Five automation categories, always on
            </h2>
          </AnimatedSection>

          <StaggerContainer className="space-y-4">
            {automationCategories.map((cat, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.06] hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:w-[220px] flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                        <cat.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base sm:text-lg tracking-tight text-[#1c1c1c]">
                        {cat.title}
                      </h3>
                    </div>
                    <div className="flex-1 space-y-2">
                      {cat.items.map((item, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006828] mt-0.5 flex-shrink-0" />
                          <span className="font-['Geist',sans-serif] font-medium text-[13px] text-black/55 leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              What you can automate on day one
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((uc, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.12] transition-colors h-full">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                    {uc.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/65 leading-relaxed">
                    {uc.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to automate your patient operations?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis automations can run your workflows 24/7.
            </p>
            <ShimmerLink href="/contact" background="rgba(255,255,255,1)" className="text-black px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.35)]">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
