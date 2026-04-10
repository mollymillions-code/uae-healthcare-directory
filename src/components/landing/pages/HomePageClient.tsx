"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import { Timeline } from "@/components/landing/Timeline";
import { LogoBar } from "@/components/landing/LogoBar";
import { homeTabs, homeTabContent, platformPillars } from "@/data/landing/home";
import { emrPartners, channelPartners } from "@/data/landing/brand-partners";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { trackEvent } from "@/lib/gtag";

export function HomePageClient() {
  const [activeTab, setActiveTab] = useState(0);

  const clientLogos = useMemo(
    () => [
      { src: "/assets/clients/dental-nation-logo.webp", name: "Dental Nation" },
      { src: "/assets/clients/kent-healthcare.webp", name: "Kent Healthcare" },
      { src: "/assets/clients/flowspace-logo.webp", name: "Flow Space" },
      { src: "/assets/clients/gs-poly-clinic-logo.webp", name: "GS Poly Clinic" },
      { src: "/assets/clients/my-london-skin-clinic-logo.webp", name: "My London Skin Clinic" },
      { src: "/assets/clients/modern-aesthetics-logo.webp", name: "Modern Aesthetics" },
    ],
    []
  );

  const integrationLogos = useMemo(
    () => [...channelPartners.slice(0, 5), ...emrPartners.slice(0, 3)],
    []
  );

  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 lg:pb-28 overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#006828]/[0.03] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <AnimatedSection className="flex-1 text-center lg:text-left z-10" direction="left">
              <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#006828]" />
                <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                  AI Patient Success Platform
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[34px] sm:text-[46px] lg:text-[60px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                The AI Patient Success Platform{" "}
                <span className="text-[#006828]">for Healthcare Providers</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-base sm:text-lg text-black/50 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                Zavis connects every patient channel into one platform,
                deploys AI agents that book appointments around the clock,
                and automates reminders, follow-ups, and recall campaigns.
                The result: more revenue per patient, fewer no-shows,
                and measurably higher satisfaction scores.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <ShimmerLink
                  href="/book-a-demo"
                  className="px-8 sm:px-10 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium gap-2 shadow-[0_0_24px_rgba(0,104,40,0.45)]"
                  onClick={() => trackEvent("cta_click", { location: "hero" })}
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </ShimmerLink>
                <span className="font-['Geist',sans-serif] text-sm text-black/40">
                  First AI workflow live by Day 3
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection className="flex-1 relative" direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-[#006828]/10 via-transparent to-[#006828]/5 rounded-[40px] blur-xl" />
                <div className="relative rounded-2xl lg:rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-black/10">
                  <ImageWithFallback
                    src="/assets/hero-platform-graphic.webp"
                    alt="Doctor in clinic reviewing Zavis patient inbox on laptop with floating chat and notification UI elements"
                    className="w-full h-auto object-cover aspect-[4/3]"
                    loading="eager"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Client Logo Ticker */}
          <div className="mt-16 lg:mt-24 bg-white/60 rounded-2xl sm:rounded-3xl border border-black/[0.06] py-8 sm:py-10 px-6">
            <p className="text-center font-['Bricolage_Grotesque',sans-serif] font-medium text-sm sm:text-base text-[#1c1c1c] tracking-tight mb-2">
              Trusted by leading healthcare brands across the UAE
            </p>
            <p className="text-center font-['Geist',sans-serif] text-xs text-black/40 mb-8">
              Dental chains, dermatology clinics, wellness centers, and multi-specialty hospitals
            </p>
            <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 lg:gap-x-14 gap-y-6">
              {clientLogos.map((logo) => (
                <img
                  key={logo.src}
                  src={logo.src}
                  alt={logo.name}
                  className="h-9 sm:h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                  draggable={false}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration Logo Bar */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-[1200px] mx-auto">
          <LogoBar
            logos={integrationLogos}
            title="Trusted integrations"
            iconSize="h-10 w-28"
          />
        </div>
      </section>

      {/* Dashboard Preview */}
      <AnimatedSection className="px-4 sm:px-6 lg:px-8 pb-16 lg:pb-28">
        <div className="max-w-[1100px] mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-black/20 to-black/5 rounded-3xl sm:rounded-[28px] blur-sm" />
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-black/10 shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.25)]">
              <ImageWithFallback
                src="/assets/home-dashboard-preview.webp"
                alt="Clinic manager viewing Zavis healthcare analytics dashboard with patient metrics on monitor"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Value Props - replaces generic "Chat | Voice | AI" */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-black tracking-tight mb-5 max-w-3xl mx-auto leading-[1.1]">
              Increase Revenue. Reduce No-Shows. Elevate Patient Satisfaction.
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-2xl mx-auto">
              AI agents that respond instantly and book appointments 24/7.
              Automated reminders that reduce no-shows consistently.
              Seamless omnichannel communication that makes patients feel
              known and cared for at every touchpoint.
            </p>
          </AnimatedSection>

          {/* Stats bar */}
          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { value: "24/7", label: "AI agents booking appointments around the clock" },
                { value: "Most", label: "Routine patient queries handled without staff" },
                { value: "Day 3", label: "First AI workflow live and booking patients" },
                { value: "Full", label: "Ad spend attributed to collected revenue" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.06] hover:border-[#006828]/20 transition-all group"
                >
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl lg:text-4xl text-[#006828] mb-2 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="font-['Geist',sans-serif] text-xs sm:text-sm text-black/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10 lg:mb-14">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-black tracking-tight leading-[1.1]">
              One Platform for the Entire Patient Journey
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {platformPillars.map((p) => (
              <StaggerItem key={p.title}>
                <Link
                  href={p.to}
                  className="group bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/20 transition-all duration-300 block h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-3 group-hover:from-[#006828]/20 group-hover:to-[#006828]/10 transition-all">
                    <p.icon className="w-5 h-5 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-sm tracking-tight text-[#1c1c1c] mb-1">
                    {p.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed">
                    {p.desc}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Tabs - Platform Deep Dive */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-center text-black tracking-tight mb-4 max-w-3xl mx-auto leading-[1.1]">
              How Each Capability Drives Your Outcomes
            </h2>
            <p className="text-center font-['Geist',sans-serif] font-medium text-sm text-black/40 mb-10 lg:mb-12">
              See how Zavis increases revenue, reduces no-shows, and improves satisfaction across every workflow.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="flex overflow-x-auto sm:justify-center gap-1 mb-10 px-2 pb-2 -mx-2 scrollbar-none">
              {homeTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  className={`px-3 sm:px-5 py-2.5 font-['Bricolage_Grotesque',sans-serif] font-semibold text-xs sm:text-sm uppercase tracking-wide transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === index
                      ? "text-[#006828] border-[#006828]"
                      : "text-black/30 border-transparent hover:text-black/50 hover:border-black/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </AnimatedSection>

          <div className="bg-white rounded-2xl lg:rounded-[32px] overflow-hidden shadow-sm border border-black/[0.06]">
            <div className="flex flex-col lg:flex-row">
              <div className="p-6 sm:p-8 lg:p-10 lg:w-[50%]">
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[22px] sm:text-[26px] lg:text-[32px] leading-tight tracking-tight text-[#1c1c1c] mb-3">
                  {homeTabContent[activeTab].title}
                </h3>
                <p className="font-['Geist',sans-serif] font-medium text-black/40 mb-6 sm:mb-8 text-sm">
                  {homeTabContent[activeTab].subtitle}
                </p>
                <div className="space-y-5 sm:space-y-6">
                  {homeTabContent[activeTab].features.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#006828] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-['Geist',sans-serif] font-semibold text-black tracking-tight mb-1.5">
                          {f.heading}
                        </h4>
                        <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">
                          {f.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-[50%] bg-gradient-to-br from-[#f8f9f4] to-[#f0f2ec] overflow-hidden border-t lg:border-t-0 lg:border-l border-black/[0.06] flex items-center justify-center">
                <ImageWithFallback
                  src={homeTabContent[activeTab].image}
                  alt={homeTabContent[activeTab].imageAlt}
                  className="w-full h-full object-cover min-h-[240px] sm:min-h-[300px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[900px] mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-black/[0.06]">
            <div className="grid md:grid-cols-2">
              {/* Today */}
              <div className="p-6 sm:p-8 bg-black/[0.02] border-b md:border-b-0 md:border-r border-black/[0.06]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-black/20" />
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xs text-black/40 uppercase tracking-wider">
                    Today
                  </p>
                </div>
                <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed">
                  Patient inquiries arrive across WhatsApp, Instagram, phone,
                  and web forms. Each channel lives in a separate tool. Leads
                  go cold before coordinators can respond. No-shows pile up
                  because reminders are manual. Ad spend cannot be traced to
                  actual revenue. Staff spend most of their day on routine
                  queries instead of complex patient care.
                </p>
              </div>
              {/* With Zavis */}
              <div className="p-6 sm:p-8 bg-[#006828]/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#006828]" />
                  <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xs text-[#006828] uppercase tracking-wider">
                    With Zavis
                  </p>
                </div>
                <p className="font-['Geist',sans-serif] font-medium text-sm text-black/70 leading-relaxed">
                  Every channel feeds into one patient timeline. AI agents
                  respond instantly, qualify intent, and book directly into
                  your EMR. Automated reminders at 24h and 12h cut no-shows.
                  Post-visit follow-ups and recall campaigns drive retention
                  and repeat revenue. Every booking is attributed from the
                  original ad click to collected payment. Staff focus on
                  complex care while AI handles the volume.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <Timeline />
    </div>
  );
}
