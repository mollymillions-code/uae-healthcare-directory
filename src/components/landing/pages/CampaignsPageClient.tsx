"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { ArrowRight, Target, PenLine, Send, BarChart3 } from "lucide-react";
import { campaignChannels, campaignFeatures, campaignUseCases } from "@/data/landing/campaigns-page";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { VisualFlow } from "@/components/landing/VisualFlow";
import { channelPartners } from "@/data/landing/brand-partners";

export function CampaignsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  Campaigns
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto lg:mx-0">
                Reach the right patients at the{" "}
                <span className="text-[#006828]">right moment</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto lg:mx-0 mb-8">
                Multi-channel campaigns with smart segmentation, tracked from
                send to booking.
              </p>
              <ShimmerLink href="/contact" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </ShimmerLink>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#006828]/8 via-transparent to-[#006828]/4 rounded-[36px] blur-xl" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
                <ImageWithFallback
                  src="/assets/campaigns-hero.webp"
                  alt="Marketing manager at whiteboard presenting WhatsApp broadcast campaign analytics to healthcare team"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Campaign Channels Visual */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <ChannelIconGrid channels={channelPartners.slice(0, 6)} />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Every channel, one platform
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaignChannels.map((ch, i) => (
              <StaggerItem key={i}>
                <div className={`${ch.color} rounded-2xl p-6 sm:p-7 h-full`}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <ch.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                    {ch.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/70 leading-relaxed">
                    {ch.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Built for healthcare campaigns
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Segmentation, compliance, and analytics for patient outreach at scale.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaignFeatures.map((f, i) => (
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

      {/* Campaign Flow */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <VisualFlow
              steps={[
                { icon: Target, label: "Segment" },
                { icon: PenLine, label: "Compose" },
                { icon: Send, label: "Send" },
                { icon: BarChart3, label: "Track ROI" },
              ]}
            />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Campaign use cases
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-white/70 max-w-[480px] mx-auto">
              Proven templates that fill schedules and re-engage patients.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaignUseCases.map((uc, i) => (
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

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to launch your first campaign?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis campaigns can fill your schedule and re-engage patients.
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
