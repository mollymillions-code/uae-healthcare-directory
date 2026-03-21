/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { ArrowLeft } from "lucide-react";

export function NotFoundPageClient() {
  return (
    <div className="bg-[#f8f8f6] min-h-[80vh] flex items-center justify-center px-4">
      <AnimatedSection className="text-center max-w-md">
        <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[80px] sm:text-[120px] leading-none text-[#006828]/10 mb-4">
          404
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-3xl sm:text-4xl text-black tracking-tight mb-4">
          Page Not Found
        </h1>
        <p className="font-['Geist',sans-serif] font-medium text-sm text-black/50 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-full font-['Bricolage_Grotesque',sans-serif] font-medium hover:bg-gray-800 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </AnimatedSection>
    </div>
  );
}
