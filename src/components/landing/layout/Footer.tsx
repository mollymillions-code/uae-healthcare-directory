"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Globe2, Search, ShieldCheck, Users } from "lucide-react";
import { VideoFooterShell } from "@/components/layout/VideoFooterShell";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const footerLinks = [
  {
    title: "Directory",
    links: [
      { label: "Find a Doctor", href: "/find-a-doctor" },
      { label: "Top Rated", href: "/directory/dubai/top/hospitals" },
      { label: "Hospitals", href: "/directory/dubai/hospitals" },
      { label: "Clinics", href: "/directory/dubai/clinics" },
      { label: "Labs & Diagnostics", href: "/labs" },
      { label: "Insurance Navigator", href: "/insurance" },
      { label: "Medical Pricing", href: "/pricing" },
      { label: "Verified Reviews", href: "/verified-reviews" },
      { label: "Get Listed / Edit Profile", href: "/provider-portal" },
    ],
  },
  {
    title: "Cities",
    links: [
      { label: "Dubai", href: "/directory/dubai" },
      { label: "Abu Dhabi", href: "/directory/abu-dhabi" },
      { label: "Sharjah", href: "/directory/sharjah" },
      { label: "Ajman", href: "/directory/ajman" },
      { label: "Ras Al Khaimah", href: "/directory/ras-al-khaimah" },
      { label: "Al Ain", href: "/directory/al-ain" },
      { label: "Fujairah", href: "/directory/fujairah" },
      { label: "All Cities", href: "/directory" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "For Patients", href: "/directory" },
      { label: "For Providers", href: "/provider-portal" },
      { label: "AI Agents", href: "/ai-agents" },
      { label: "Bookings", href: "/bookings" },
      { label: "CRM", href: "/crm" },
      { label: "EMR Integration", href: "/emr" },
      { label: "Analytics", href: "/analytics" },
      { label: "Automations", href: "/automations" },
      { label: "Payments & Billing", href: "/payments" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Methodology", href: "/methodology" },
      { label: "Data Sources", href: "/data-sources" },
      { label: "Corrections Policy", href: "/about/corrections" },
      { label: "Masthead", href: "/intelligence/author" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Zavis", href: "/about" },
      { label: "Intelligence Reports", href: "/intelligence/reports" },
      { label: "Press Room", href: "/intelligence/press" },
      { label: "Careers", href: "/jobs" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const footerProof = [
  {
    icon: Search,
    text: "Find trusted doctors, clinics and hospitals across the GCC.",
  },
  {
    icon: ShieldCheck,
    text: "Verified data from official sources and Google Places.",
  },
  {
    icon: Users,
    text: "Built for patients. Designed for better care.",
  },
];

export function Footer() {
  return (
    <VideoFooterShell
      compact
      brand={
        <Link
          href="/"
          className="inline-flex rounded font-['Bricolage_Grotesque',sans-serif] text-[66px] font-bold leading-none tracking-normal text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006828] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f2] max-sm:text-5xl"
        >
          zavis<span className="text-[#00C853]">.</span>
        </Link>
      }
      description="Healthcare directory and patient access intelligence."
      social={
        <div>
          <div className="h-0.5 w-12 bg-[#16823b]" />
          <div className="mt-6 space-y-4">
            {footerProof.map(({ icon: Icon, text }) => (
              <div key={text} className="flex max-w-[300px] items-center gap-4 font-['Geist',sans-serif] text-[16px] leading-tight text-[#374151]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#16823b]/45 text-[#16823b]">
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-5">
            <a href="https://www.instagram.com/heyzavis" target="_blank" rel="noopener noreferrer" aria-label="Zavis on Instagram" className="text-[#16823b] transition-colors hover:text-[#006828]">
              <InstagramIcon />
            </a>
            <a href="https://www.linkedin.com/company/zavisai/" target="_blank" rel="noopener noreferrer" aria-label="Zavis on LinkedIn" className="text-[#16823b] transition-colors hover:text-[#006828]">
              <LinkedInIcon />
            </a>
            <a href="https://www.youtube.com/@zavis-ai" target="_blank" rel="noopener noreferrer" aria-label="Zavis on YouTube" className="text-[#16823b] transition-colors hover:text-[#006828]">
              <YouTubeIcon />
            </a>
          </div>
        </div>
      }
      bottom={
        <div className="flex flex-col gap-3 font-['Geist',sans-serif] text-sm text-[#374151] sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 Zavis. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <Globe2 className="size-4" />
            <span>English</span>
            <ChevronDown className="size-4" />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-12">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 font-['Geist',sans-serif] text-[17px] font-semibold text-[#16823b]">
                {section.title}
              </h4>
              <ul className="space-y-3 font-['Geist',sans-serif]">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[16px] leading-tight text-[#4b5563] transition-colors hover:text-[#16823b]">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {section.title === "Company" ? (
                  <li className="pt-2">
                    <Link href="/book-a-demo" className="inline-flex items-center gap-2 font-semibold text-[#16823b] transition-colors hover:text-[#006828]">
                      Book a Demo <ArrowRight className="size-4" />
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
      </div>
    </VideoFooterShell>
  );
}
