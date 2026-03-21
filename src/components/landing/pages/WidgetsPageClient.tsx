"use client";

import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { ArrowRight } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { bookingWidgetFeatures, chatWidgetFeatures, widgetBenefits } from "@/data/landing/widgets";
import { ChannelIconGrid } from "@/components/landing/ChannelIconGrid";
import { channelPartners } from "@/data/landing/brand-partners";

export function WidgetsPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  Website Widgets
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-4xl mx-auto lg:mx-0">
                Turn your website into a{" "}
                <span className="text-[#006828]">booking engine</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto lg:mx-0 mb-8">
                Embedded booking and chat widgets connected to your EMR in real
                time. Patients self-serve without leaving your site.
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
                  src="/assets/widgets-hero.webp"
                  alt="Woman at home browsing clinic website on laptop with live chat widget booking conversation open"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-2xl mx-auto">
              Two widgets, one seamless experience
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedSection direction="left">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] h-full">
                <span className="inline-block bg-[#006828] text-white font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">
                  Booking Widget
                </span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-[#1c1c1c] mb-5">
                  Live scheduling from your EMR
                </h3>
                <div className="space-y-3.5">
                  {bookingWidgetFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-[#006828]" />
                      </div>
                      <div>
                        <span className="font-['Geist',sans-serif] font-semibold text-sm text-[#1c1c1c]">
                          {f.title}
                        </span>
                        <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] h-full">
                <span className="inline-block bg-[#1c1c1c] text-white font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">
                  Chat Widget
                </span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-[#1c1c1c] mb-5">
                  AI-powered conversations on your site
                </h3>
                <div className="space-y-3.5">
                  {chatWidgetFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-[#006828]" />
                      </div>
                      <div>
                        <span className="font-['Geist',sans-serif] font-semibold text-sm text-[#1c1c1c]">
                          {f.title}
                        </span>
                        <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Widget Channels */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-6">
            <p className="font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest text-black/40">
              Continue conversations on any channel
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <ChannelIconGrid channels={channelPartners.slice(0, 4)} />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Why healthcare teams choose Zavis widgets
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {widgetBenefits.map((b, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-4">
                    <b.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-lg sm:text-xl tracking-tight text-[#1c1c1c] mb-2">
                    {b.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {b.desc}
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
              Ready to turn your website into a booking engine?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis widgets can convert website visitors into booked patients.
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
