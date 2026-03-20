"use client";

import Link from "next/link";
import { Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  // Easy to edit content object
  const content = {
    logo: "ZAVIS",
    socialMedia: {
      title: "Follow us",
      links: [
        // { name: "Facebook", icon: Facebook, href: "#" },
        {
          name: "LinkedIn",
          icon: Linkedin,
          href: "https://www.linkedin.com/company/zavis",
        },
        // { name: "Twitter", icon: Twitter, href: "#" },
        {
          name: "YouTube",
          icon: Youtube,
          href: "https://www.youtube.com/@zavis-ai",
        },
        // { name: "RSS", icon: Rss, href: "#" },
      ],
    },
    navigation: [{ name: "Home", href: "/" }],
    legal: {
      copyright: "\u00A9 2026 Zavis Inc.",
      links: [
        { name: "Privacy", href: "/privacy-policy" },
        { name: "Terms", href: "/terms-of-service" },
      ],
    },
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto container">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          {/* Social Media */}
          <div className="flex flex-col mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-gray-600 text-lg">
                {content.socialMedia.title}
              </span>
              <div className="flex space-x-3">
                {content.socialMedia.links.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <Link
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      className="w-8 h-8 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center transition-colors duration-200"
                      aria-label={social.name}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {content.navigation.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-primary text-md transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6">
          {/* Logo */}
          <div className="mb-4 sm:mb-0">
            <Link href="/" className="text-4xl font-semibold text-black">
              <img src="/zavis-logo.svg" alt="Zavis Logo" className="h-8" />
            </Link>
          </div>

          {/* Copyright and Legal */}
          <div className="flex items-center space-x-4 text-gray-600">
            <span>{content.legal.copyright}</span>
            {content.legal.links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-primary transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
