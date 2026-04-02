"use client";

import Image from "next/image";
import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { LogoBar } from "@/components/landing/LogoBar";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { specialties } from "@/data/landing/specialties";
import { emrPartners, channelPartners } from "@/data/landing/brand-partners";

interface SpecialtyPageClientProps {
  specialty: string;
}

export function SpecialtyPageClient({ specialty }: SpecialtyPageClientProps) {
  const data = specialties[specialty];

  if (!data) {
    return (
      <div className="bg-[#f8f8f6] min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-[#1c1c1c] mb-3">
            Specialty not found
          </h1>
          <Link href="/" className="text-[#006828] font-['Geist',sans-serif] font-medium text-sm hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                {data.badge}
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-3xl mx-auto">
              {data.heroTitle}{" "}
              <span className="text-[#006828]">{data.heroAccent}</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[560px] mx-auto mb-8">
              {data.heroDescription}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <ShimmerLink href="/contact" className="px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)] mb-12">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </ShimmerLink>
          </AnimatedSection>

          {/* Hero Image — outside AnimatedSection to avoid GSAP opacity:0 delaying LCP */}
          <div className="relative max-w-[1000px] mx-auto">
            <div className="absolute -inset-2 bg-gradient-to-b from-black/10 to-transparent rounded-[36px] blur-lg" />
            <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden ring-1 ring-black/10 shadow-xl aspect-[16/9]">
              <Image
                src={data.heroImage}
                alt={`${data.name} healthcare practice using AI patient engagement platform`}
                fill
                priority
                sizes="(max-width: 1000px) 100vw, 1000px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Logo Bar */}
      <AnimatedSection className="px-4 sm:px-6 lg:px-8 pb-8" delay={0.3}>
        <div className="max-w-[1200px] mx-auto">
          <LogoBar
            logos={[...emrPartners, ...channelPartners.slice(0, 4)]}
            title="Integrated with your tools"
            iconSize="h-10 w-28"
          />
        </div>
      </AnimatedSection>

      {/* Feature Cards - Alternating Zigzag */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-14 lg:mb-20">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-3xl mx-auto">
              {data.featureHeading}{" "}
              <span className="text-[#006828]">{data.featureAccent}</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-12 lg:space-y-20">
            {data.features.map((feature, index) => (
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
                {data.resultBarText}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Results Metrics */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              {data.resultHeading}
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data.results.map((r, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card transition-all duration-300">
                  <div className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl text-[#006828] mb-2">
                    {r.metric}
                  </div>
                  <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-[800px] mx-auto bg-gradient-to-br from-[#1c1c1c] to-[#2a2a2a] rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-white tracking-tight mb-4">
              {data.ctaHeading}
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              {data.ctaDescription}
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
