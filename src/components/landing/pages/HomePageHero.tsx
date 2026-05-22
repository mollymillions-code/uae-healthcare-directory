import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomePageHero() {
  return (
    <div className="bg-[#f8f8f6] overflow-hidden">
      <section className="relative px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-[#006828]/[0.04] via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#006828]/[0.03] via-transparent to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-[1400px]">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
            <div className="z-10 flex-1 text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#006828]/[0.08] px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#006828]" />
                <span className="font-['Geist',sans-serif] text-sm font-medium text-[#006828]">
                  AI front desk for growing clinics
                </span>
              </div>
              <h1 className="mb-6 font-[system-ui,sans-serif] text-[34px] font-medium leading-[1.05] tracking-[-0.04em] text-[#1c1c1c] sm:font-display sm:text-[46px] lg:text-[60px]">
                Keep your schedule full with{" "}
                <span className="text-[#006828]">AI patient operations</span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl font-['Geist',sans-serif] text-base font-medium leading-relaxed text-black/50 lg:mx-0 sm:hidden">
                Zavis helps UAE clinics respond faster, book more visits,
                recover missed calls, and bring patients back for follow-up.
              </p>
              <p className="mx-auto mb-8 hidden max-w-xl font-['Geist',sans-serif] text-lg font-medium leading-relaxed text-black/50 lg:mx-0 sm:block">
                Zavis helps UAE clinics respond faster, book more visits,
                recover missed calls, send reminders, collect payments, and
                bring patients back for follow-up. Your team gets one place
                to manage the work around every appointment.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/book-a-demo"
                  prefetch={false}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-8 py-3.5 font-['Bricolage_Grotesque',sans-serif] font-medium text-white shadow-[0_0_24px_rgba(0,104,40,0.45)] transition-transform active:translate-y-px sm:px-10"
                >
                  Book a Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="font-['Geist',sans-serif] text-sm text-black/40">
                  First workflow live in days, not months
                </span>
              </div>
            </div>

            <div className="relative hidden min-h-[420px] flex-1 lg:block">
              <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-br from-[#006828]/10 via-transparent to-[#006828]/5 blur-xl" />
              <div className="relative overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-black/10">
                <Image
                  src="/assets/hero-platform-graphic.webp"
                  alt="Doctor in clinic reviewing Zavis patient inbox on laptop with floating chat and notification UI elements"
                  width={1600}
                  height={873}
                  className="h-auto w-full object-cover"
                  sizes="680px"
                  quality={65}
                  loading="lazy"
                  fetchPriority="low"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
