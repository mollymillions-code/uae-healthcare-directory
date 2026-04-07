"use client";

import { ImageWithFallback } from "@/components/landing/ImageWithFallback";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/landing/AnimatedSection";
import {
  CalendarCheck,
  ArrowRight,
  Clock,
  RefreshCw,
  Bell,
  Users,
  FileText,
  Smartphone,
  MessageSquare,
  UserPlus,
  Database,
} from "lucide-react";
import { coordinatorSteps, aiSteps, bookingFlowSteps } from "@/data/landing/bookings";
import { LogoBar } from "@/components/landing/LogoBar";
import { ShimmerLink } from "@/components/landing/ui/shimmer-button";
import { VisualFlow } from "@/components/landing/VisualFlow";
import { emrPartners } from "@/data/landing/brand-partners";

export function BookingsPageClient() {
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
                  Bookings & Scheduling
                </span>
              </div>
              <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-6">
                Conversations that turn into{" "}
                <span className="text-[#006828]">bookings</span>
              </h1>
              <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Coordinators filter live EMR slots with MRN matching, or AI agents offer best slots with one-tap confirmation and EMR writeback.
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
                  src="/assets/bookings-hero.webp"
                  alt="Reception coordinator at clinic front desk helping patient with booking checklist overlay on screen"
                  className="w-full h-auto object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* EMR Partners */}
      <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="max-w-[600px] mx-auto">
          <LogoBar logos={emrPartners} title="Syncs with your EMR" iconSize="h-10 w-36" />
        </AnimatedSection>
      </section>

      {/* Booking Features */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-12 lg:mb-16">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight mb-4 max-w-2xl mx-auto">
              Live EMR schedules with conflict protection
            </h2>
            <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 max-w-[500px] mx-auto">
              Filter by doctor, department, service, and branch. One-click create, reschedule, or cancel with full two-way EMR writeback.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: CalendarCheck, title: "Live EMR Schedules", desc: "Real-time availability by doctor, department, service, and branch." },
              { icon: RefreshCw, title: "One-Click Create/Reschedule/Cancel", desc: "Two-way writeback with reason codes and conflict detection." },
              { icon: Users, title: "MRN Matching", desc: "Phone and MRN matching prevents duplicate patients automatically." },
              { icon: Clock, title: "Status Parity with EMR", desc: "Coordinators and front desk see the same truth in real time." },
              { icon: Bell, title: "WhatsApp Confirmations & Reminders", desc: "Sent from the same conversation thread automatically." },
              { icon: FileText, title: "Patient Profile with History", desc: "Booking history, preferences, and MRN visible during scheduling." },
            ].map((f, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-card hover:border-[#006828]/15 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center mb-3">
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

      {/* Coordinator vs AI Booking */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-[#1c1c1c] tracking-tight max-w-2xl mx-auto">
              Human-led or AI-powered. Your choice
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedSection direction="left">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] h-full">
                <span className="inline-block bg-black text-white font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">Coordinator Led</span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-[#1c1c1c] mb-5">Filter, select, confirm, with MRN and visit ID</h3>
                <div className="space-y-3.5">
                  {coordinatorSteps.map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#006828]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="font-['Geist',sans-serif] font-semibold text-xs text-[#006828]">{s.step}</span>
                      </div>
                      <p className="font-['Geist',sans-serif] font-medium text-sm text-black/60 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-[#006828] rounded-2xl p-6 sm:p-8 h-full">
                <span className="inline-block bg-white text-[#006828] font-['Geist',sans-serif] font-medium text-xs px-4 py-1.5 rounded-full mb-5">AI-Powered</span>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl tracking-tight text-white mb-5">AI offers slots, patient confirms, EMR updates</h3>
                <div className="space-y-3.5">
                  {aiSteps.map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="font-['Geist',sans-serif] font-semibold text-xs text-white">{s.step}</span>
                      </div>
                      <p className="font-['Geist',sans-serif] font-medium text-sm text-white/80 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Ad to Booking Flow */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[900px] mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] text-black tracking-tight mb-4 max-w-2xl mx-auto">
              From ad click to booked appointment
            </h2>
          </AnimatedSection>

          <AnimatedSection className="mb-10">
            <VisualFlow
              steps={[
                { icon: Smartphone, label: "Ad click" },
                { icon: MessageSquare, label: "WhatsApp chat" },
                { icon: UserPlus, label: "Lead created" },
                { icon: CalendarCheck, label: "AI books" },
                { icon: Database, label: "EMR synced" },
              ]}
            />
          </AnimatedSection>

          <StaggerContainer className="space-y-3">
            {bookingFlowSteps.map((s, i) => (
              <StaggerItem key={i}>
                <div className="flex items-start gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.06] hover:shadow-sm transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006828]/15 to-[#006828]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="font-['Geist',sans-serif] font-semibold text-sm text-[#006828]">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-base sm:text-lg tracking-tight text-[#1c1c1c] mb-1">{s.title}</h4>
                    <p className="font-['Geist',sans-serif] font-medium text-[13px] text-black/45 leading-relaxed">{s.desc}</p>
                  </div>
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
              Ready to turn conversations into bookings?
            </h2>
            <p className="font-['Geist',sans-serif] text-white/50 text-sm mb-8 max-w-md mx-auto">
              See how Zavis can automate your appointment scheduling.
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
