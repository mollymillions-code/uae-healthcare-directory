import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Heart, Shield, MapPin, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "The UAE Open Healthcare Directory is a free, comprehensive healthcare provider directory for all UAE residents.",
};

export default function AboutPage() {
  return (
    <div className="container-tc py-8">
      <Breadcrumb items={[{ label: "About" }]} />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-dark mb-6">
          About the UAE Open Healthcare Directory
        </h1>

        <div className="max-w-none">
          <div className="answer-block mb-8" data-answer-block="true">
            <p className="text-muted leading-relaxed text-lg">
              The UAE Open Healthcare Directory is a free, open, and comprehensive directory of
              healthcare providers across all seven Emirates of the UAE. Our mission is to help
              every resident find the right healthcare provider based on their location, specialty
              needs, insurance coverage, and ratings.
            </p>
          </div>

          <div className="section-header">
            <h2>Why We Built This</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-muted leading-relaxed mb-8">
            UAE residents have long needed a unified place to search for healthcare providers
            across all Emirates. Information is scattered across multiple platforms, often outdated,
            and rarely comprehensive. We built this directory to be the single source of truth for
            healthcare in the UAE — sourced from official DHA, DOH, and MOH licensing data, enriched
            with Google ratings and reviews, and freely accessible to everyone.
          </p>

          <div className="section-header">
            <h2>Our Data Sources</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-muted leading-relaxed mb-6">
            All listings are sourced from official UAE health authority registers:
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Dubai Health Authority (DHA) — Licensed Facilities Register for Dubai",
              "Department of Health Abu Dhabi (DOH) — Licensed Facilities for Abu Dhabi and Al Ain",
              "Ministry of Health and Prevention (MOHAP) — Federal register for Sharjah, Ajman, RAK, Fujairah, and UAQ",
            ].map((source, i) => (
              <li key={i} className="flex items-start gap-3 text-muted">
                <Shield className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                {source}
              </li>
            ))}
          </ul>
          <p className="text-muted leading-relaxed mb-6">
            Ratings and reviews are sourced from Google Maps to give you real patient feedback.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
            {[
              { icon: <MapPin className="h-6 w-6" />, label: "8 Cities", desc: "All major UAE cities covered" },
              { icon: <Heart className="h-6 w-6" />, label: "26 Categories", desc: "Every healthcare specialty" },
              { icon: <Star className="h-6 w-6" />, label: "Google Reviews", desc: "Real patient feedback" },
            ].map((stat, i) => (
              <div key={i} className="border border-light-200 p-5 text-center">
                <div className="h-10 w-10 bg-accent-muted flex items-center justify-center mx-auto mb-3 text-accent">
                  {stat.icon}
                </div>
                <p className="font-bold text-dark">{stat.label}</p>
                <p className="text-xs text-muted">{stat.desc}</p>
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>For Healthcare Providers</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <p className="text-muted leading-relaxed mb-6">
            If you&apos;re a healthcare provider and want to update your listing information,
            you can claim your listing for free. Once verified, you can update your contact details,
            operating hours, services offered, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
