"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { LogoBar } from "@/components/landing/LogoBar";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { ZavisLogo } from "@/components/landing/navbar/ZavisLogo";
import { dentalFeatures as features, comparisonRows } from "@/data/landing/dental";
import { emrPartners } from "@/data/landing/brand-partners";

export function DentalPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                Zavis for Dental
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-3xl mx-auto">
              Turn every patient inquiry into a{" "}
              <span className="text-[#006828]">booked chair</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              Manage calls, texts, appointment requests, recalls, and payment
              follow-ups, so your front desk can focus on in-clinic care.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <ShimmerLink href="/book-a-demo" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)] mb-12">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </AnimatedSection>

          {/* Hero Image */}
          <AnimatedSection delay={0.4}>
            <div className="relative max-w-[1000px] mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-b from-black/10 to-transparent rounded-[36px] blur-lg" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
                <ImageWithFallback
                  src="/assets/dental-hero.webp"
                  alt="Dental team treating patient in modern clinic with WhatsApp booking confirmation chat overlay"
                  className="w-full h-auto object-cover aspect-[16/9]"
                  loading="eager"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* EMR Partners Logo Bar */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <LogoBar logos={emrPartners} title="EMR Partners" iconSize="h-10 w-36" />
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-14 lg:mb-20">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-3xl mx-auto">
              Everything your dental practice needs to{" "}
              <span className="text-[#006828]">grow</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-12 lg:space-y-20">
            {features.map((feature, index) => (
              <AnimatedSection
                key={index}
                direction={feature.align === "right" ? "left" : "right"}
              >
                <div
                  className={`flex flex-col ${
                    feature.align === "left"
                      ? "lg:flex-row-reverse"
                      : "lg:flex-row"
                  } gap-8 lg:gap-12 items-center`}
                >
                  {/* Text side */}
                  <div className="lg:w-[45%] flex flex-col justify-center">
                    <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] font-medium text-sm text-[#006828] mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006828]" />
                      {feature.label}
                    </span>
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[22px] sm:text-[26px] lg:text-[32px] leading-tight tracking-tight text-[#1c1c1c] mb-4">
                      {feature.title}
                    </h3>
                    <div className="border-l-2 border-[#006828]/20 pl-5">
                      <p className="font-['Geist',sans-serif] font-semibold text-black text-sm mb-2">
                        {feature.subtitle}
                      </p>
                      <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Image side */}
                  <div className="lg:w-[55%] relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#006828]/5 to-transparent rounded-[20px] blur-md" />
                    <div className="relative rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-lg aspect-[16/10]">
                      <ImageWithFallback
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Results bar */}
          <AnimatedSection className="mt-16">
            <div className="bg-[#006828] rounded-2xl p-6 sm:p-8 text-center">
              <p className="font-['Geist',sans-serif] font-medium text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Result: Your practice captures every lead, books more
                appointments, reduces no-shows, and grows revenue with{" "}
                <span className="text-white font-semibold">less manual work</span>{" "}
                from your front desk.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Zavis Is Safer */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-5 max-w-3xl mx-auto">
              How Zavis compares to the alternatives
            </h2>
            <div className="max-w-[600px] mx-auto">
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
                Traditional implementations take months. Zavis ships working
                software on Day 3. Smaller bets, faster feedback, lower risk.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <p className="text-center font-['Geist',sans-serif] text-xs text-black/30 mb-3 sm:hidden">
              Swipe to see full comparison &rarr;
            </p>
            <div className="overflow-x-auto rounded-2xl border border-black/[0.06] scrollbar-none shadow-sm">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="p-4 text-left bg-white font-['Geist',sans-serif] font-semibold text-sm text-black/40 w-[20%]">
                      Capability
                    </th>
                    <th className="p-4 text-left bg-[#006828] text-white font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm w-[20%]">
                      <div className="flex items-center justify-center">
                        <ZavisLogo color="white" />
                      </div>
                    </th>
                    <th className="p-4 text-center bg-white font-['Geist',sans-serif] font-semibold text-sm text-black/50 w-[20%]">
                      Traditional
                    </th>
                    <th className="p-4 text-center bg-white font-['Geist',sans-serif] font-semibold text-sm text-black/50 w-[20%]">
                      DIY / In-House
                    </th>
                    <th className="p-4 text-center bg-white font-['Geist',sans-serif] font-semibold text-sm text-black/50 w-[20%]">
                      Status Quo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr key={index} className="border-t border-black/5">
                      <td className="p-4 bg-white font-['Geist',sans-serif] font-semibold text-sm text-black">
                        {row.label}
                      </td>
                      <td className="p-4 bg-[#006828] font-['Geist',sans-serif] font-medium text-[13px] text-white/90 leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white/60 mt-0.5 flex-shrink-0" />
                          <span>{row.zavis}</span>
                        </div>
                      </td>
                      <td className="p-4 bg-white font-['Geist',sans-serif] font-medium text-[13px] text-black/40 leading-relaxed text-center">
                        {row.traditional}
                      </td>
                      <td className="p-4 bg-white font-['Geist',sans-serif] font-medium text-[13px] text-black/40 leading-relaxed text-center border-l border-r border-black/5">
                        {row.diy}
                      </td>
                      <td className="p-4 bg-white font-['Geist',sans-serif] font-medium text-[13px] text-black/30 leading-relaxed text-center">
                        {row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              Ready to modernize your dental practice?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis can help your clinic capture more leads, book more chairs, and grow revenue.
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
