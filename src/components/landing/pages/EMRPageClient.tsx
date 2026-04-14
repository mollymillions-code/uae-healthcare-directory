"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { emrFeatures, emrCapabilities } from "@/data/landing/emr";
import { LogoBar } from "@/components/landing/LogoBar";
import { emrPartners } from "@/data/landing/brand-partners";
import { PractoIcon, MeDASIcon, UniteIcon, WhatsAppIcon, InstagramIcon, FacebookIcon, TelegramIcon, SMSIcon, WebChatIcon } from "@/components/landing/BrandIcons";

export function EMRPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  EMR &middot; Two-Way Integration
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto lg:mx-0">
                Your EMR and Zavis.{" "}
                <span className="text-[#006828]">One source of truth.</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto lg:mx-0 mb-8">
                Bidirectional sync gives every team member access to live
                schedules, patient records, and booking data. Zero extra work.
              </p>
              <ShimmerLink href="/book-a-demo" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </ShimmerLink>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#006828]/8 via-transparent to-[#006828]/4 rounded-[36px] blur-xl" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
                <ImageWithFallback
                  src="/assets/emr-hero.webp"
                  alt="Two healthcare professionals shaking hands in office with EMR sync status overlay on dual monitors"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* EMR Partners + Sync Flow */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="mb-14">
            <LogoBar logos={emrPartners} title="Integrated EMR Partners" iconSize="h-10 w-36" />
          </AnimatedSection>

          {/* Bidirectional Sync Diagram */}
          <AnimatedSection>
            <div className="max-w-[1000px] mx-auto">
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[22px] sm:text-[28px] lg:text-[32px] leading-tight tracking-tight text-[#1c1c1c] text-center mb-3">
                Bidirectional sync, <span className="text-[#006828]">zero middleware</span>
              </h3>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/40 text-center mb-10 max-w-md mx-auto">
                Zavis reads from and writes back to your EMR in real time — one source of truth for every team.
              </p>

              {/* Desktop: 3-column grid */}
              <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
                {/* Left card: EMR Partners */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 lg:p-8 flex flex-col">
                  <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-1">Your EMR</h4>
                  <p className="font-['Geist',sans-serif] text-[13px] text-black/40 leading-relaxed mb-5">
                    Schedules, patient records, billing data, clinical notes
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    {[
                      { Icon: PractoIcon, name: "Practo" },
                      { Icon: MeDASIcon, name: "MeDAS" },
                      { Icon: UniteIcon, name: "Unite" },
                    ].map(({ Icon, name }) => (
                      <div key={name} className="flex items-center gap-2.5 bg-[#f8f8f6] rounded-xl px-3 py-2.5">
                        <Icon className="w-8 h-8 shrink-0" />
                        <span className="font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c]">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center connector column */}
                <div className="flex flex-col items-center justify-center px-5 lg:px-8 gap-3">
                  {/* Top arrow: EMR -> Zavis (Reads) */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-['Geist',sans-serif] text-[10px] font-semibold text-[#006828]/50 uppercase tracking-widest">Reads</span>
                    <svg width="80" height="12" viewBox="0 0 80 12" fill="none">
                      <line x1="0" y1="6" x2="72" y2="6" stroke="#006828" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 3" />
                      <polygon points="72,2 80,6 72,10" fill="#006828" fillOpacity="0.3" />
                    </svg>
                  </div>

                  {/* Zavis hub */}
                  <div className="w-[72px] h-[72px] rounded-full bg-[#006828] flex items-center justify-center shadow-[0_0_32px_rgba(0,104,40,0.35)]">
                    <RefreshCw className="w-8 h-8 text-white" />
                  </div>

                  {/* Bottom arrow: Zavis -> EMR (Writes) */}
                  <div className="flex flex-col items-center gap-1">
                    <svg width="80" height="12" viewBox="0 0 80 12" fill="none">
                      <line x1="8" y1="6" x2="80" y2="6" stroke="#006828" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 3" />
                      <polygon points="8,2 0,6 8,10" fill="#006828" fillOpacity="0.3" />
                    </svg>
                    <span className="font-['Geist',sans-serif] text-[10px] font-semibold text-[#006828]/50 uppercase tracking-widest">Writes</span>
                  </div>
                </div>

                {/* Right card: Patient Channels */}
                <div className="bg-white rounded-2xl border border-black/[0.06] p-6 lg:p-8 flex flex-col">
                  <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight text-[#1c1c1c] mb-1">Patient Channels</h4>
                  <p className="font-['Geist',sans-serif] text-[13px] text-black/40 leading-relaxed mb-5">
                    Reminders, confirmations, follow-ups across every channel
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    {[
                      { Icon: WhatsAppIcon, name: "WhatsApp" },
                      { Icon: InstagramIcon, name: "Instagram" },
                      { Icon: FacebookIcon, name: "Facebook" },
                      { Icon: TelegramIcon, name: "Telegram" },
                      { Icon: SMSIcon, name: "SMS" },
                      { Icon: WebChatIcon, name: "Web Chat" },
                    ].map(({ Icon, name }) => (
                      <div key={name} className="flex items-center gap-2.5 bg-[#f8f8f6] rounded-xl px-3 py-2.5">
                        <Icon className="w-8 h-8 shrink-0" />
                        <span className="font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c]">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom feature pills */}
              <div className="hidden md:flex items-center justify-center gap-3 mt-8">
                {["Live schedule sync", "Booking writeback", "Patient record updates", "Zero double entry"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 bg-[#006828]/[0.06] rounded-full px-3.5 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006828]" />
                    <span className="font-['Geist',sans-serif] text-xs font-medium text-[#006828]">{item}</span>
                  </span>
                ))}
              </div>

              {/* Mobile: stacked cards */}
              <div className="flex md:hidden flex-col items-center gap-4">
                <div className="bg-white rounded-2xl border border-black/[0.06] p-5 w-full">
                  <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#1c1c1c] mb-1">Your EMR</h4>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">Schedules, records, billing, notes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { Icon: PractoIcon, name: "Practo" },
                      { Icon: MeDASIcon, name: "MeDAS" },
                      { Icon: UniteIcon, name: "Unite" },
                    ].map(({ Icon, name }) => (
                      <div key={name} className="flex items-center gap-2 bg-[#f8f8f6] rounded-lg px-2.5 py-2">
                        <Icon className="w-7 h-7 shrink-0" />
                        <span className="font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c]">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-12 h-12 rounded-full bg-[#006828] flex items-center justify-center shadow-[0_0_16px_rgba(0,104,40,0.25)]">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>

                <div className="bg-white rounded-2xl border border-black/[0.06] p-5 w-full">
                  <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#1c1c1c] mb-1">Patient Channels</h4>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">Reminders, confirmations, follow-ups</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { Icon: WhatsAppIcon, name: "WhatsApp" },
                      { Icon: InstagramIcon, name: "Instagram" },
                      { Icon: FacebookIcon, name: "Facebook" },
                      { Icon: TelegramIcon, name: "Telegram" },
                      { Icon: SMSIcon, name: "SMS" },
                      { Icon: WebChatIcon, name: "Web Chat" },
                    ].map(({ Icon, name }) => (
                      <div key={name} className="flex items-center gap-2 bg-[#f8f8f6] rounded-lg px-2.5 py-2">
                        <Icon className="w-7 h-7 shrink-0" />
                        <span className="font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c]">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {["Live sync", "Writeback", "Zero double entry"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 bg-[#006828]/[0.06] rounded-full px-3 py-1">
                      <CheckCircle2 className="w-3 h-3 text-[#006828]" />
                      <span className="font-['Geist',sans-serif] text-[11px] font-medium text-[#006828]">{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Zero double entry. Zero stale data.
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Every feature keeps your EMR and Zavis in sync so your team works from one source of truth.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {emrFeatures.map((f, i) => (
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

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1c1c1c] to-[#111]">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Built for real healthcare systems
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-white/50 max-w-[480px] mx-auto">
              One EMR or five across a hospital group, Zavis connects them all.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {emrCapabilities.map((c, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.10] transition-colors h-full">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                    {c.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/60 leading-relaxed">
                    {c.desc}
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
              Ready to connect your EMR?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how bidirectional EMR sync gives your team one source of truth.
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
