"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import {
  Phone,
  Mic,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Globe,
} from "lucide-react";
import { ctiFeatures, coordinatorSteps, aiAssistSteps } from "@/data/landing/voice";
import { LogoBar } from "@/components/landing/LogoBar";
import { telephonyPartners } from "@/data/landing/brand-partners";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";

export function VoicePageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  Cloud Voice
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                Voice built for{" "}
                <span className="text-[#006828]">healthcare</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Screen pop with patient profile on every call. Click-to-call, book into your EMR, and capture recordings in one timeline.
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
                  src="/assets/voice-hero.webp"
                  alt="Call center agent with headset at dual-monitor workstation handling live patient call with transcript overlay"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTI Features */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Native CTI controls, built into Zavis
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Full call controls with no third-party softphone. Map queues to clinics for routing and reporting.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ctiFeatures.map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-2">{f.title}</h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">{f.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Coordinator Led & AI Assist */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-2xl mx-auto">
              Human-first, AI-enhanced
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedSection direction="left">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] h-full">
                <span className="inline-block bg-black text-white font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">Coordinator Led</span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-[#1c1c1c] mb-5">Human-first call handling</h3>
                <div className="space-y-3.5">
                  {coordinatorSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#006828]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="font-['Geist',sans-serif] font-semibold text-xs text-[#006828]">{i + 1}</span>
                      </div>
                      <p className="font-['Geist',sans-serif] font-medium text-sm text-black/60 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-[#006828] rounded-2xl p-6 sm:p-8 h-full">
                <span className="inline-block bg-white text-[#006828] font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">AI Assist</span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-white mb-5">AI-enhanced call intelligence</h3>
                <div className="space-y-3.5">
                  {aiAssistSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
                      <p className="font-['Geist',sans-serif] font-medium text-sm text-white/80 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-black tracking-tight mb-4 max-w-2xl mx-auto">
              AI assist on every call
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[480px] mx-auto">
              Transcripts, summaries, translation, and sentiment analysis built into every call.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Real-time transcript", icon: Mic, desc: "Every word captured live with smart prompts" },
              { label: "Auto summary", icon: CheckCircle2, desc: "Key points and next steps extracted after each call" },
              { label: "Live translation", icon: Phone, desc: "On-the-fly Arabic-English translation" },
              { label: "Sentiment analysis (Beta)", icon: Volume2, desc: "Intent polarity and confidence scores on timeline" },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-xl p-5 border border-black/[0.06] text-center hover:shadow-card transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm text-black mb-1">{item.label}</p>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Multilingual Support */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 flex justify-center" direction="left">
              <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-[#006828]/10" />
                {/* Inner ring */}
                <div className="absolute inset-[60px] sm:inset-[72px] rounded-full border border-dashed border-[#006828]/15" />
                {/* Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#006828] flex items-center justify-center shadow-lg">
                    <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                {/* Inner ring -- MENA core */}
                {([
                  { code: "AE", label: "UAE", color: "#009639", angle: -90 },
                  { code: "SA", label: "Saudi", color: "#006C35", angle: 30 },
                  { code: "KW", label: "Kuwait", color: "#007A3D", angle: 150 },
                ] as const).map((f) => {
                  const r = 28;
                  const rad = (f.angle * Math.PI) / 180;
                  const x = 50 + r * Math.cos(rad);
                  const y = 50 + r * Math.sin(rad);
                  return (
                    <div
                      key={f.label}
                      className="absolute flex flex-col items-center gap-1"
                      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ring-1 ring-black/5 shadow-sm"
                        style={{ backgroundColor: f.color }}
                      >
                        <span className="font-['Geist',sans-serif] font-bold text-xs text-white">{f.code}</span>
                      </div>
                      <span className="font-['Geist',sans-serif] text-[10px] text-black/40 font-medium">{f.label}</span>
                    </div>
                  );
                })}
                {/* Outer ring -- Global */}
                {([
                  { code: "UK", label: "UK", color: "#012169", angle: -60 },
                  { code: "US", label: "USA", color: "#3C3B6E", angle: 0 },
                  { code: "IN", label: "India", color: "#FF9933", angle: 60 },
                  { code: "TR", label: "Turkey", color: "#E30A17", angle: 132 },
                  { code: "FR", label: "France", color: "#002395", angle: -132 },
                ] as const).map((f) => {
                  const r = 44;
                  const rad = (f.angle * Math.PI) / 180;
                  const x = 50 + r * Math.cos(rad);
                  const y = 50 + r * Math.sin(rad);
                  return (
                    <div
                      key={f.label}
                      className="absolute flex flex-col items-center gap-1"
                      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center ring-1 ring-black/5 shadow-sm"
                        style={{ backgroundColor: f.color }}
                      >
                        <span className="font-['Geist',sans-serif] font-bold text-[10px] text-white">{f.code}</span>
                      </div>
                      <span className="font-['Geist',sans-serif] text-[10px] text-black/40 font-medium">{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>

            <AnimatedSection className="flex-1 text-center lg:text-left" direction="right">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-5">
                Speak to patients in{" "}
                <span className="text-[#006828]">their language</span>
              </h2>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Native Arabic dialect support with real-time English translation. Your coordinators handle calls in any language while the system translates, transcribes, and logs everything.
              </p>
              <ShimmerLink href="/contact" className="px-8 py-3 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </ShimmerLink>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Telephony Partners */}
      <AnimatedSection className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto">
          <LogoBar logos={telephonyPartners} title="Works with your telephony provider" iconSize="h-10 w-36" />
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to upgrade your call operations?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis Voice can transform patient calls into bookings.
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
