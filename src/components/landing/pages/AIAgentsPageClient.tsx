"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { MessageSquare, Phone, CheckCircle2, ArrowRight, Target, CalendarCheck, RefreshCw } from "lucide-react";
import { chatAgentFeatures, voiceAgentFeatures, agentCapabilities as capabilities } from "@/data/landing/ai-agents";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { VisualFlow } from "@/components/landing/VisualFlow";
import { channelPartners } from "@/data/landing/brand-partners";

export function AIAgentsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#006828]" />
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                AI Agents
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto">
              Custom AI employees for your{" "}
              <span className="text-[#006828]">healthcare brand</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              Brand-tuned Chat and Voice AI agents that qualify intent, book via live EMR schedules, and hand off to humans in under 10 seconds.
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
              src="/assets/ai-agents-hero.webp"
              alt="Healthcare clinic storefront at night with WhatsApp AI booking conversation and 24/7 availability"
              className="w-full h-auto object-cover aspect-[16/9]"
              loading="eager"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Capabilities Grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              What your AI agents can do
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[480px] mx-auto">
              Handle the majority of routine operations. Complex cases escalate to humans with full context instantly.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-2">{c.title}</h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">{c.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Channels AI Agents Work On */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[900px] mx-auto">
          <p className="text-center font-['Geist',sans-serif] font-medium text-xs text-black/30 uppercase tracking-widest mb-6">
            Channels AI Agents Operate On
          </p>
          <ChannelIconGrid channels={channelPartners.slice(0, 6)} />
        </AnimatedSection>
      </section>

      {/* Chat AI Agent + Voice AI Agent */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-2xl mx-auto">
              Two agent types, one platform
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedSection direction="left">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#006828] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-['Geist',sans-serif] font-medium text-xs text-[#006828] uppercase tracking-wider">Chat AI Agent</p>
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl tracking-tight text-[#1c1c1c]">Omnichannel messaging agent</h3>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {chatAgentFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#006828] mt-0.5 flex-shrink-0" />
                      <span className="font-['Geist',sans-serif] font-medium text-[13px] text-black/55 leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-gradient-to-br from-[#1c1c1c] to-[#111] rounded-2xl p-6 sm:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Phone className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="font-['Geist',sans-serif] font-medium text-xs text-white/50 uppercase tracking-wider">Voice AI Agent</p>
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl tracking-tight text-white">Intelligent call agent</h3>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {voiceAgentFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                      <span className="font-['Geist',sans-serif] font-medium text-[13px] text-white/70 leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto text-center">
          <AnimatedSection>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-12">
              How AI agents work
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <VisualFlow
              steps={[
                { icon: MessageSquare, label: "Patient reaches out" },
                { icon: Target, label: "AI qualifies intent" },
                { icon: CalendarCheck, label: "Books or hands off" },
                { icon: RefreshCw, label: "Follow-up automated" },
              ]}
            />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to deploy AI agents for your practice?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis AI agents can handle your routine operations.
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
