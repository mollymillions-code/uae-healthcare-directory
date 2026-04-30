"use client";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/landing/ui/Button";

export default function CtaSection() {
  const content = {
    headline: "Ready to Transform Your WhatsApp Growth?",
    subtitle: "Join successful businesses scaling effortlessly with Zavis.",
    buttons: {
      primary: "Book A Call Today",
      secondary: "Start free on WhatsApp",
    },
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto container">
        {/* Header Content */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-primary mb-4 lg:mb-6 leading-none lg:max-w-3xl mx-auto">
            {content.headline}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-primary max-w-xs md:max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="grid md:grid-cols-2 gap-0">
          <Link
            // href="https://wa.me/971555312595?text=I%20checked%20the%20website%2C%20and%20I%20have%20a%20few%20questions%20to%20ask"
            // target="_blank"
              href="/book-a-demo"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              id="btn-ctasection-book-a-call"
              className="w-full bg-green-500 hover:bg-green-600 text-white px-2 md:px-8 py-4 md:py-12 !text-lg md:!text-3xl font-medium rounded-none border border-[#201515] transition-colors duration-200 h-auto"
            >
              {content.buttons.primary}
              <ArrowRight className="ml-1 md:ml-2 h-6 md:h-8 w-6 md:w-8" />
            </Button>
          </Link>

          <Button
            size="lg"
            className="bg-green-500 text-white/50 px-2 md:px-8 py-4 md:py-12 !text-lg md:!text-3xl font-medium rounded-none h-auto border border-[#201515] border-t-0 lg:border-t-1 lg:border-r-0"
            disabled={true}
          >
            {content.buttons.secondary}
            <Lock className="ml-1 md:ml-2 h-6 md:h-8 w-6 md:w-8" />
          </Button>
        </div>
      </div>
    </section>
  );
}
