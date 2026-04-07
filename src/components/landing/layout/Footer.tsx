"use client";

import Link from "next/link";
import { ZavisLogo } from "./Navbar";

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
    title: "Solutions",
    links: [
      { label: "Dental", href: "/dental" },
      { label: "Dermatology", href: "/dermatology" },
      { label: "Optometry", href: "/optometry" },
      { label: "Orthopedics", href: "/orthopedics" },
      { label: "ENT", href: "/ent" },
      { label: "Urgent Care", href: "/urgent-care" },
      { label: "Mental Health", href: "/mental-health" },
      { label: "Veterinary", href: "/veterinary" },
      { label: "Homecare", href: "/homecare" },
      { label: "Aesthetic", href: "/aesthetic" },
      { label: "Longevity & Wellness", href: "/longevity-wellness" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Omnichannel Inbox", href: "/chat" },
      { label: "Voice", href: "/voice" },
      { label: "AI Agents", href: "/ai-agents" },
      { label: "Bookings", href: "/bookings" },
      { label: "EMR Integration", href: "/emr" },
      { label: "CRM", href: "/crm" },
      { label: "Analytics", href: "/analytics" },
      { label: "Automations", href: "/automations" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Payments", href: "/payments" },
      { label: "Integrations", href: "/integrations" },
      { label: "Widgets", href: "/widgets" },
      { label: "Mobile App", href: "/mobile" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "UAE Directory", href: "/directory" },
      { label: "Intelligence", href: "/intelligence" },
      { label: "Research", href: "/research" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Book a Demo", href: "/book-a-demo" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <ZavisLogo color="white" />
            </Link>
            <p className="mt-4 text-white/60 font-['Geist',sans-serif] text-sm leading-relaxed">
              AI-native Patient Success Platform for healthcare organizations.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.instagram.com/heyzavis" target="_blank" rel="noopener noreferrer" aria-label="Zavis on Instagram" className="text-white/40 hover:text-white transition-colors">
                <InstagramIcon />
              </a>
              <a href="https://www.linkedin.com/company/zavisai/" target="_blank" rel="noopener noreferrer" aria-label="Zavis on LinkedIn" className="text-white/40 hover:text-white transition-colors">
                <LinkedInIcon />
              </a>
              <a href="https://www.youtube.com/@zavis-ai" target="_blank" rel="noopener noreferrer" aria-label="Zavis on YouTube" className="text-white/40 hover:text-white transition-colors">
                <YouTubeIcon />
              </a>
            </div>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2 text-white/60 font-['Geist',sans-serif] text-sm">
                {section.links.map((link) => {
                  const isExternal = link.href.startsWith("/directory") || link.href.startsWith("/intelligence") || link.href.startsWith("/research");
                  return (
                    <li key={link.href}>
                      {isExternal ? (
                        <a href={link.href} className="hover:text-white transition-colors">{link.label}</a>
                      ) : (
                        <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 font-['Geist',sans-serif] text-sm">
          <span>&copy; 2026 Zavis. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
