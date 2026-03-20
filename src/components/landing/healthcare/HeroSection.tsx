"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-backdrop.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 mx-auto container px-6 md:px-12 lg:px-16 py-16 lg:py-0 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center text-white max-w-4xl">
          <p className="text-xs md:text-sm font-medium tracking-widest mb-6 uppercase">
            ZAVIS FOR HEALTHCARE
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
            AI Powered<br />
            Patient Success<br />
            Platform
          </h1>
          <p className="text-lg md:text-xl leading-relaxed mb-10 opacity-90 max-w-2xl mx-auto">
            AI platform for patient acquisition, engagement, scheduling, automation, and care coordination across every channel at scale.
          </p>
          <Link
            href="/book-a-demo"
            className="inline-block bg-white hover:bg-gray-100 text-black px-10 py-4 text-lg font-semibold transition-colors duration-200 rounded-md"
          >
            Book A Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
