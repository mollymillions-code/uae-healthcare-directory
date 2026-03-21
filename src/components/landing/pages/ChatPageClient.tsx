"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { channels, chatFeatures } from "@/data/landing/chat";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";

export function ChatPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  Omnichannel Inbox
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                One conversation per patient,{" "}
                <span className="text-[#006828]">every channel</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Seven channels unified in a single patient timeline with Google Ads and Meta lead forms auto-ingested.
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
                  src="/assets/shared-omnichannel-inbox.webp"
                  alt="Clinic coordinator at dental reception managing WhatsApp, Instagram, and web chat messages in unified inbox"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Channels Bar */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[900px] mx-auto">
          <p className="text-center font-['Geist',sans-serif] font-medium text-xs text-black/30 uppercase tracking-widest mb-6">
            Connected Channels
          </p>
          <ChannelIconGrid channels={channels} />
        </AnimatedSection>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Multi-branch, multi-number. One unified view
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Every interaction captured with source attribution, routed to the right team, and resolved with AI assistance.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {chatFeatures.map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg sm:text-xl tracking-tight text-[#1c1c1c] mb-2">
                    {f.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* AI Assistance Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-block text-white/50 font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest mb-4">
                Built-in AI
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-6">
                AI-powered assistance in every conversation
              </h2>
              <div className="space-y-4">
                {[
                  { title: "Smart Summaries", desc: "Long conversations condensed into actionable briefs for instant context." },
                  { title: "Drafted Replies", desc: "Context-aware responses ready for one-click sending." },
                  { title: "Answer Suggestions", desc: "Best reply recommended based on intent, history, and protocols." },
                  { title: "Automated Routing", desc: "Assigned to the right person by branch, department, language, and SLA." },
                  { title: "Team Efficiency Boost", desc: "Lower handle time and first-response time across every coordinator." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-['Geist',sans-serif] font-semibold text-sm text-white">
                        {item.title}
                      </span>
                      <span className="font-['Geist',sans-serif] font-medium text-sm text-white/60">
                        {" - "}{item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-2 bg-white/10 rounded-[36px] blur-lg" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-white/20">
                <ImageWithFallback
                  src="/assets/shared-team-collaboration.webp"
                  alt="Woman at home receiving automated patient recall WhatsApp message on her phone from healthcare clinic"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to unify every patient conversation?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis brings every channel and ad lead into one intelligent inbox.
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
