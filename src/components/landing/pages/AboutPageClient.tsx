"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/landing/AnimatedSection";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { CheckCircle2, MapPin, Shield, ArrowRight } from "lucide-react";
import { values, supportFeatures, complianceFeatures } from "@/data/landing/about";

export function AboutPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection
              className="flex-1 text-center lg:text-left"
              direction="left"
            >
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  About Zavis
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                Built for healthcare,{" "}
                <span className="text-[#006828]">from day one</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-6">
                One timeline for every conversation, booking, and outcome.
                Connected to your systems, built for scale.
              </p>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <MapPin className="w-4 h-4 text-[#006828]" />
                <span className="font-['Geist',sans-serif] font-medium text-sm text-[#006828]">
                  Based in the UAE
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#006828]/8 via-transparent to-[#006828]/4 rounded-[36px] blur-xl" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl">
                <ImageWithFallback
                  src="/assets/about-hero.webp"
                  alt="Diverse team collaborating around table in modern office with product roadmap on screen"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[700px] mx-auto text-center">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-5">
            Our Mission
          </h2>
          <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed">
            Every patient deserves instant, intelligent engagement across every
            channel. Every healthcare team deserves tools that work together.
          </p>
        </AnimatedSection>
      </section>

      {/* Values */}
      <section className="py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight">
              What drives us
            </h2>
          </AnimatedSection>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <StaggerItem key={i}>
                <div
                  className={`rounded-2xl p-6 border hover:shadow-card transition-all duration-300 h-full ${
                    i === 0
                      ? "bg-[#006828] text-white border-[#006828]"
                      : "bg-white border-black/[0.06]"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      i === 0
                        ? "bg-white/15"
                        : "bg-gradient-to-br from-[#006828]/10 to-[#006828]/5"
                    }`}
                  >
                    <v.icon
                      className={`w-5 h-5 ${i === 0 ? "text-white" : "text-[#006828]"}`}
                    />
                  </div>
                  <h3
                    className={`font-['Bricolage_Grotesque',sans-serif] font-medium text-lg tracking-tight mb-2 ${
                      i === 0 ? "text-white" : "text-[#1c1c1c]"
                    }`}
                  >
                    {v.title}
                  </h3>
                  <p
                    className={`font-['Geist',sans-serif] font-medium text-[13px] leading-relaxed ${
                      i === 0 ? "text-white/75" : "text-black/45"
                    }`}
                  >
                    {v.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Support */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] font-medium text-sm text-[#006828] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006828]" />
                Support
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4">
                Local, hands-on support
              </h2>
              <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 mb-6 leading-relaxed">
                Dedicated UAE-based Success team. Onsite when needed, structured
                training for your entire team.
              </p>
              <div className="space-y-2.5">
                {supportFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006828] mt-0.5 flex-shrink-0" />
                    <span className="font-['Geist',sans-serif] font-medium text-[13px] text-black/55 leading-relaxed">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-2 bg-gradient-to-br from-[#006828]/8 via-transparent to-transparent rounded-[36px] blur-lg" />
              <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-lg">
                <ImageWithFallback
                  src="/assets/about-support.webp"
                  alt="Support agent on video call with healthcare customer showing dedicated success manager overlay"
                  className="w-full h-auto object-cover"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1c1c1c] to-[#111]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1" direction="left">
              <span className="inline-block text-white/40 font-['Geist',sans-serif] font-medium text-xs uppercase tracking-widest mb-4">
                Compliance & Security
              </span>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-6">
                Healthcare-grade security, built in
              </h2>
              <div className="space-y-2.5">
                {complianceFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <span className="font-['Geist',sans-serif] font-medium text-[13px] text-white/70 leading-relaxed">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="absolute -inset-2 bg-white/5 rounded-[36px] blur-lg" />
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                <ImageWithFallback
                  src="/assets/about-compliance.webp"
                  alt="Two professionals reviewing security architecture diagram with HIPAA and SOC2 compliance badges"
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
              Ready to transform your healthcare operations?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis can help your organization deliver better patient
              outcomes.
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
