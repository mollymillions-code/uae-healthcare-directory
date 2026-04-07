"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { crmFeatures, patient360Features, revenueFeatures } from "@/data/landing/crm";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { channelPartners } from "@/data/landing/brand-partners";

export function CRMPageClient() {
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
                  Patient 360
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                Patient 360{" "}
                <span className="text-[#006828]">built in</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Automatic lead capture, enrichment, segmentation, and routing with full pipeline tracking from inquiry to reactivation.
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
                  src="/assets/crm-hero.webp"
                  alt="Front desk coordinator on phone with unified patient profile displayed on healthcare CRM screen"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Pipeline Features */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[900px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-black tracking-tight mb-4 max-w-2xl mx-auto">
              Full lead pipeline with ads auto-ingestion
            </h2>
          </AnimatedSection>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crmFeatures.map((f, i) => (
              <StaggerItem key={i}>
                <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-black/[0.06] hover:shadow-sm transition-shadow">
                  <CheckCircle2 className="w-5 h-5 text-[#006828] mt-0.5 flex-shrink-0" />
                  <span className="font-['Geist',sans-serif] font-medium text-sm text-black/60">
                    {f}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Lead Capture Channels */}
      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[900px] mx-auto">
          <p className="text-center font-['Geist',sans-serif] font-medium text-xs text-black/30 uppercase tracking-widest mb-6">
            Leads captured from every channel
          </p>
          <ChannelIconGrid channels={channelPartners} />
        </AnimatedSection>
      </section>

      {/* Patient 360 */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              One patient record, every interaction
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Chat, calls, bookings, invoices, and tasks on one timeline with full attribution from every source.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {patient360Features.map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-4">
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

      {/* Lifecycle Stages */}
      <AnimatedSection className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1000px] mx-auto">
          <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl text-center text-black tracking-tight mb-3">
            CRM stages, auto-tracked by triggers
          </h3>
          <p className="font-['Geist',sans-serif] font-medium text-sm text-black/40 text-center mb-8 max-w-[500px] mx-auto">
            Stages auto-advance on replies, call outcomes, bookings, payments, and visit changes.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {[
              { label: "New", active: false },
              { label: "Engaged", active: false },
              { label: "Qualified", active: false },
              { label: "Booked", active: true },
              { label: "Visited", active: false },
              { label: "Follow-up", active: false },
              { label: "Reactivation", active: false },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex items-center gap-2">
                <span
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-['Geist',sans-serif] font-medium text-xs sm:text-sm transition-all ${
                    stage.active
                      ? "bg-[#006828] text-white shadow-sm"
                      : "bg-white text-black/60 border border-black/[0.08] hover:border-black/15"
                  }`}
                >
                  {stage.label}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-black/15 text-sm hidden sm:inline">{"\u2192"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Revenue Analytics */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#006828]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-block text-white/40 font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest mb-4">
                Revenue Analytics
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
                Revenue visibility, built in
              </h2>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-white/70 mb-6 leading-relaxed">
                Revenue, collections, and outstanding balances synced with your EMR in one shared source of truth.
              </p>
              <div className="space-y-2.5">
                {revenueFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <span className="font-['Geist',sans-serif] font-medium text-[13px] text-white/70 leading-relaxed">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-2 bg-white/10 rounded-[36px] blur-lg" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-white/20">
                <ImageWithFallback
                  src="/assets/crm-revenue-analytics.webp"
                  alt="Clinic manager viewing monthly revenue analytics and patient metrics on laptop dashboard"
                  className="w-full h-auto object-cover"
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
              Ready to see Patient 360 in action?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis Patient 360 gives your team full pipeline visibility
              from ad click to revenue.
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
