"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ArrowRight } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { nativeIntegrations, integrationHighlights, integrationCategories } from "@/data/landing/integrations-page";
import { IntegrationHub } from "@/components/landing/IntegrationHub";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { LogoBar } from "@/components/landing/LogoBar";
import {
  allIntegrationPartners,
  channelPartners,
  emrPartners,
  adPlatforms,
  nativeToolPartners,
} from "@/data/landing/brand-partners";

export function IntegrationsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero with IntegrationHub visual */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  Integrations
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto lg:mx-0">
                Connect Zavis to{" "}
                <span className="text-[#006828]">everything you use</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto lg:mx-0 mb-8">
                Channels, EMRs, ad platforms, and custom APIs. One integration
                layer for your entire healthcare stack.
              </p>
              <ShimmerLink href="/book-a-demo" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </ShimmerLink>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <IntegrationHub partners={allIntegrationPartners} />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Communication Channels -- visual grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10 lg:mb-14">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-3 max-w-2xl mx-auto">
              Communication channels
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              {integrationCategories[0].desc}
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <ChannelIconGrid channels={channelPartners} />
          </AnimatedSection>
        </div>
      </section>

      {/* Healthcare Systems -- logo bar */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10 lg:mb-14">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-3 max-w-2xl mx-auto">
              Healthcare systems
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              {integrationCategories[1].desc}
            </p>
          </AnimatedSection>

          <AnimatedSection className="mb-8">
            <LogoBar logos={emrPartners} title="Integrated EMR Partners" iconSize="h-10 w-36" />
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {integrationCategories[1].items.map((item, j) => (
              <StaggerItem key={j}>
                <div className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 px-5 py-3.5">
                  <div className="w-2 h-2 rounded-full bg-[#006828] flex-shrink-0" />
                  <div>
                    <span className="font-['Geist',sans-serif] font-semibold text-[13px] text-[#1c1c1c]">
                      {item.name}
                    </span>
                    <span className="font-['Geist',sans-serif] font-medium text-[12px] text-black/40 ml-2">
                      {item.desc}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Ad Platforms -- logo bar */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10 lg:mb-14">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-3 max-w-2xl mx-auto">
              Ad &amp; marketing platforms
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              {integrationCategories[2].desc}
            </p>
          </AnimatedSection>

          <AnimatedSection className="mb-8">
            <LogoBar logos={adPlatforms} title="Ad Platform Integrations" />
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrationCategories[2].items.map((item, j) => (
              <StaggerItem key={j}>
                <div className="flex items-center gap-3 bg-white rounded-xl ring-1 ring-black/5 px-5 py-3.5">
                  <div className="w-2 h-2 rounded-full bg-[#006828] flex-shrink-0" />
                  <div>
                    <span className="font-['Geist',sans-serif] font-semibold text-[13px] text-[#1c1c1c]">
                      {item.name}
                    </span>
                    <span className="font-['Geist',sans-serif] font-medium text-[12px] text-black/40 ml-2">
                      {item.desc}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Native Integrations -- logo bar + card grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10 lg:mb-14">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-3 max-w-2xl mx-auto">
              Native integrations
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Built-in connectors for the platforms healthcare teams use most.
            </p>
          </AnimatedSection>

          <AnimatedSection className="mb-10">
            <LogoBar logos={nativeToolPartners} title="Native Tool Integrations" />
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nativeIntegrations.map((n, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-3">
                    <n.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-2">
                    {n.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {n.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Integration Highlights */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Integration highlights
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {integrationHighlights.map((h, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.12] transition-colors h-full text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4 mx-auto">
                    <h.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                    {h.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/65 leading-relaxed">
                    {h.desc}
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
              Ready to connect everything?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis integrates with your entire healthcare stack.
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
