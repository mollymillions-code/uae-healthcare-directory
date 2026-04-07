"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { ArrowRight, Stethoscope, Link2, MessageSquare, CreditCard, CheckCircle2 } from "lucide-react";
import { paymentFeatures, paymentWorkflow, paymentStats } from "@/data/landing/payments";
import { LogoBar } from "@/components/landing/LogoBar";
import { VisualFlow } from "@/components/landing/VisualFlow";
import { paymentPartners } from "@/data/landing/brand-partners";

export function PaymentsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                Payment Collection
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto">
              Collect payments inside{" "}
              <span className="text-[#006828]">patient conversations</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              Payment links in chat, EMR-linked invoicing, and full revenue
              attribution from ad click to collected payment.
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

      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentStats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-3">
                    <stat.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium text-xs text-black/35 uppercase tracking-wide mb-1">
                    {stat.label}
                  </p>
                  <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base text-[#1c1c1c] tracking-tight">
                    {stat.value}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Payment Partner */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <LogoBar logos={paymentPartners} title="Payment Processing" iconSize="h-10 w-28" />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Payment features built for healthcare
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Secure, compliant collection that fits into your communication workflow.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paymentFeatures.map((f, i) => (
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
        <div className="max-w-[900px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              How payment collection works
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-white/50 max-w-[480px] mx-auto">
              From appointment to collected revenue, every step tracked.
            </p>
          </AnimatedSection>

          <AnimatedSection className="mb-10">
            <VisualFlow
              dark
              steps={[
                { icon: Stethoscope, label: "Appointment" },
                { icon: Link2, label: "Generate Link" },
                { icon: MessageSquare, label: "Send in Chat" },
                { icon: CreditCard, label: "Patient Pays" },
                { icon: CheckCircle2, label: "Synced" },
              ]}
            />
          </AnimatedSection>

          <StaggerContainer className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/10 hidden sm:block" />
            <div className="space-y-4">
              {paymentWorkflow.map((w, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 relative z-10">
                      <span className="font-['Geist',sans-serif] font-semibold text-sm text-white">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.08]">
                      <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base sm:text-lg tracking-tight text-white mb-1">
                        {w.step}
                      </h4>
                      <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/55 leading-relaxed">
                        {w.detail}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to collect payments in conversations?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis can streamline your payment collection workflow.
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
