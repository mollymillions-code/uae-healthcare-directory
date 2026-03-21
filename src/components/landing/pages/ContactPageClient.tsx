/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const ZAVIS_API_URL = process.env.NEXT_PUBLIC_ZAVIS_API_URL || "https://zavis-onboarding.vercel.app";
const LEADS_WEBHOOK_SECRET = process.env.NEXT_PUBLIC_LEADS_WEBHOOK_SECRET || "";

const teamOptions = [
  "Marketing",
  "Sales",
  "Support",
  "Admin / Founder / Business Owner",
  "IT / Developer / Product Manager",
  "HR",
  "Others",
  "Interested in Zavis Partnership",
];

const demoBenefits = [
  {
    icon: UserCheck,
    text: "Personalized 1-on-1 guided tour, not a group webinar",
  },
  { icon: CalendarCheck, text: "See how Zavis fits your specific workflows" },
  { icon: Sparkles, text: "Get expert guidance from our healthcare ops team" },
  { icon: TrendingUp, text: "Discover growth opportunities for your practice" },
];

export function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    phone: "",
    team: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError(
        "Please agree to the Terms & Conditions and Privacy Policy to continue.",
      );
      return;
    }

    setSubmitting(true);

    fetch(`${ZAVIS_API_URL}/api/leads/website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": LEADS_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        website: formData.website || null,
        team: formData.team,
        phone: formData.phone,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Submission failed");
        return res.json();
      })
      .then(() => {
        setSubmitting(false);
        setSubmitted(true);
      })
      .catch(() => {
        setSubmitting(false);
        setError("Something went wrong. Please try again or email us at syed@zavis.ai.");
      });
  };

  return (
    <div className="bg-[#f8f8f6] min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#006828]/[0.04] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-[#006828]/[0.08] rounded-full px-4 py-1.5 mb-6">
              <span className="font-['Geist',sans-serif] font-medium text-[#006828] text-sm">
                Book a Demo
              </span>
            </div>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[32px] sm:text-[44px] lg:text-[58px] leading-[1.05] text-[#1c1c1c] tracking-[-0.04em] mb-5 max-w-3xl mx-auto">
              Enjoy a personalized{" "}
              <span className="text-[#006828]">guided tour</span>
            </h1>
            <p className="font-['Geist',sans-serif] font-medium text-sm sm:text-base text-black/50 leading-relaxed max-w-[500px] mx-auto">
              Not a group webinar. A 1-on-1 walkthrough tailored to your
              practice, your workflows, and your growth goals.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits + Form */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left - Benefits */}
            <AnimatedSection className="w-full lg:w-[40%]" direction="left">
              <div className="space-y-5">
                {demoBenefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006828]/10 to-[#006828]/5 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-5 h-5 text-[#006828]" />
                    </div>
                    <p className="font-['Geist',sans-serif] font-medium text-sm text-black/60 leading-relaxed pt-2.5">
                      {b.text}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Right - Form */}
            <AnimatedSection className="w-full lg:w-[60%]" direction="right">
              {submitted ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 border border-black/[0.06] text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#006828]/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-[#006828]" />
                  </div>
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-2xl text-[#1c1c1c] mb-3">
                    Demo Scheduled!
                  </h3>
                  <p className="font-['Geist',sans-serif] font-medium text-sm text-black/45 mb-6">
                    Thank you for your interest in Zavis. A member of our team
                    will reach out to you within 24 hours to confirm your demo.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setAgreedToTerms(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        website: "",
                        phone: "",
                        team: "",
                      });
                    }}
                    className="text-[#006828] font-['Geist',sans-serif] font-medium text-sm underline hover:text-[#004d1c] transition-colors"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] shadow-sm"
                >
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-xl sm:text-2xl text-[#1c1c1c] mb-6">
                    Schedule Your Demo
                  </h3>

                  {/* Name */}
                  <div className="mb-4">
                    <label
                      htmlFor="demo-name"
                      className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                    >
                      Name *
                    </label>
                    <input
                      id="demo-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Business Email */}
                  <div className="mb-4">
                    <label
                      htmlFor="demo-email"
                      className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                    >
                      Business Email *
                    </label>
                    <input
                      id="demo-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all"
                      placeholder="you@company.com"
                    />
                    <p className="mt-1 font-['Geist',sans-serif] text-xs text-black/30">
                      To book a 1-on-1 demo, please use your business email
                    </p>
                  </div>

                  {/* Company Name + Website */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="demo-company"
                        className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                      >
                        Company Name *
                      </label>
                      <input
                        id="demo-company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all"
                        placeholder="Your company or clinic"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="demo-website"
                        className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                      >
                        Company Website
                      </label>
                      <input
                        id="demo-website"
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all"
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="mb-4">
                    <label
                      htmlFor="demo-phone"
                      className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                    >
                      Your WhatsApp Number *
                    </label>
                    <input
                      id="demo-phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all"
                      placeholder="+971 50 123 4567"
                    />
                    <p className="mt-1 font-['Geist',sans-serif] text-xs text-black/30">
                      We'll reach out to you here
                    </p>
                  </div>

                  {/* Team Dropdown */}
                  <div className="mb-6">
                    <label
                      htmlFor="demo-team"
                      className="block font-['Geist',sans-serif] font-medium text-sm text-black/60 mb-1.5"
                    >
                      Which team or function will primarily use Zavis? *
                    </label>
                    <select
                      id="demo-team"
                      required
                      value={formData.team}
                      onChange={(e) =>
                        setFormData({ ...formData, team: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f8f8f6]/40 font-['Geist',sans-serif] text-sm focus:outline-none focus:ring-2 focus:ring-[#006828]/20 focus:border-[#006828]/40 transition-all appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 16px center",
                      }}
                    >
                      <option value="" disabled>
                        Select your team
                      </option>
                      {teamOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked);
                          if (e.target.checked) setError("");
                        }}
                        className="mt-1 w-4 h-4 rounded border-black/20 text-[#006828] focus:ring-[#006828]/30 accent-[#006828] flex-shrink-0"
                      />
                      <span className="font-['Geist',sans-serif] text-xs text-black/45 leading-relaxed">
                        By signing up, you agree to the{" "}
                        <Link
                          href="/terms-of-service"
                          className="text-[#006828] underline hover:text-[#004d1c]"
                        >
                          Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy-policy"
                          className="text-[#006828] underline hover:text-[#004d1c]"
                        >
                          Privacy Policy
                        </Link>
                        , and consent to receive marketing communications from
                        Zavis.
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="font-['Geist',sans-serif] text-sm text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white py-3.5 rounded-full font-['Bricolage_Grotesque',sans-serif] font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Schedule Demo"
                    )}
                  </button>

                  <p className="mt-4 font-['Geist',sans-serif] font-medium text-xs text-black/25 text-center">
                    We typically respond within 24 hours. Your data stays
                    private.
                  </p>
                </form>
              )}
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
