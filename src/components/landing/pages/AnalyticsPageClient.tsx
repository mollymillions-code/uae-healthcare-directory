"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { reportCategories, appointmentMetrics, adsToRevenue, mockStats } from "@/data/landing/analytics";
import { LogoBar } from "@/components/landing/LogoBar";
import { adPlatforms } from "@/data/landing/brand-partners";

export function AnalyticsPageClient() {
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
                  Analytics & Reporting
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                Track every interaction from{" "}
                <span className="text-[#006828]">click to revenue</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Funnel-to-revenue reporting by channel, clinic, doctor, and service, from first touch to collection.
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
                  src="/assets/analytics-hero.webp"
                  alt="Clinic operations manager reviewing patient flow funnel and channel breakdown analytics on large screen"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <p className="text-center font-['Geist',sans-serif] text-xs text-black/30 mb-4">
              Example dashboard metrics
            </p>
          </AnimatedSection>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {mockStats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-5 border border-black/[0.06] hover:shadow-sm transition-shadow">
                  <p className="font-['Geist',sans-serif] font-medium text-xs text-black/35 uppercase tracking-wide mb-2">
                    {stat.label}
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl text-[#1c1c1c] tracking-tight">
                      {stat.value}
                    </span>
                    <span
                      className={`font-['Geist',sans-serif] font-medium text-xs mb-1 ${
                        stat.change.startsWith("+")
                          ? "text-[#006828]"
                          : "text-black/40"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Report Categories */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Comprehensive reporting suite
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reportCategories.map((r, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className={`w-10 h-10 rounded-xl ${r.bgColor} flex items-center justify-center mb-4`}>
                    <r.icon className={`w-5 h-5 ${r.textColor}`} />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg sm:text-xl tracking-tight text-[#1c1c1c] mb-2">
                    {r.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Appointment Analytics */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] font-medium text-sm text-[#006828] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006828]" />
                Appointment Analytics
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4">
                Appointment analytics: demand, utilization, and leakage
              </h2>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 mb-6 leading-relaxed">
                Doctor occupancy heatmaps, peak hour analysis, and leakage tracking synced from your EMR.
              </p>
              <div className="space-y-2.5">
                {appointmentMetrics.map((m, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006828] mt-0.5 flex-shrink-0" />
                    <span className="font-['Geist',sans-serif] font-medium text-[13px] text-black/55 leading-relaxed">
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#006828]/8 via-transparent to-[#006828]/4 rounded-[36px] blur-xl" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
                <ImageWithFallback
                  src="/assets/analytics-section.webp"
                  alt="Boardroom meeting with campaign performance overview presentation on screen for healthcare team"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Ad Platform Attribution */}
      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[500px] mx-auto">
          <LogoBar logos={adPlatforms} title="Attribution from every platform" />
        </AnimatedSection>
      </section>

      {/* Ads to Revenue */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ads-to-Revenue: full funnel attribution
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-white/70 max-w-[480px] mx-auto">
              Track click to lead to booking to revenue with full campaign ROI across every ad platform.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {adsToRevenue.map((a, i) => (
              <StaggerItem key={i}>
                <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-6 border border-white/[0.08] hover:bg-white/[0.12] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg text-white mb-2">
                    {a.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-white/65 leading-relaxed">
                    {a.desc}
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
              Ready to see your data come to life?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis analytics can give you full funnel visibility.
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
