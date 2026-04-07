"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { mobileFeatures, mobileCapabilities, mobileHighlights } from "@/data/landing/mobile";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { channelPartners } from "@/data/landing/brand-partners";

export function MobilePageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                Mobile App
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto">
              Full Zavis in{" "}
              <span className="text-[#006828]">your pocket</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              Native iOS and Android apps with full access to conversations,
              reports, and team management.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <ShimmerLink href="/book-a-demo" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Everything you need, on the go
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Full Zavis optimized for mobile. Manage patient operations anywhere.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mobileFeatures.map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-2">
                    {f.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Channels on Mobile */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-6">
            <p className="font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest text-black/40">
              Every channel in your pocket
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <ChannelIconGrid channels={channelPartners.slice(0, 6)} />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1c1c1c] to-[#111]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-block text-white/50 font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest mb-4">
                Full Platform Access
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-6">
                Desktop power, mobile convenience
              </h2>
              <div className="space-y-4">
                {mobileCapabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <span className="font-['Geist',sans-serif] font-medium text-sm text-white/70 leading-relaxed">
                      {cap}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1" direction="right">
              <StaggerContainer className="grid grid-cols-1 gap-5">
                {mobileHighlights.map((h, i) => (
                  <StaggerItem key={i}>
                    <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.10] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                        <h.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                        {h.title}
                      </h3>
                      <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/60 leading-relaxed">
                        {h.desc}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to take Zavis on the go?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how the Zavis mobile app keeps your team connected everywhere.
            </p>
            <ShimmerLink href="/book-a-demo" background="rgba(255,255,255,1)" className="text-black px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.35)]">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
