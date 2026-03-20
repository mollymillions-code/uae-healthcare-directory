import { Metadata } from "next";
import Link from "next/link";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Zavis | AI-Powered Healthcare Intelligence for the UAE",
  description:
    "Zavis brings AI-powered healthcare intelligence to the UAE. Open healthcare directory, industry insights, and data analytics for providers, payers, and policymakers.",
  alternates: {
    canonical: getBaseUrl(),
  },
};

export default function LandingHomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-[#FBFAF8] py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark tracking-tight mb-6">
            AI-Powered Healthcare<br />Intelligence for the UAE
          </h1>
          <p className="text-lg sm:text-xl text-dark/60 max-w-2xl mx-auto mb-10">
            The open data platform for healthcare providers, payers, and policymakers.
            Directory. Insights. Analytics.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/book-a-demo"
              className="inline-flex items-center bg-accent hover:bg-accent-dark text-white text-sm font-bold px-8 py-3 transition-colors"
            >
              Book a Demo
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center border-2 border-dark text-dark hover:bg-dark hover:text-white text-sm font-bold px-8 py-3 transition-colors"
            >
              Explore Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Products overview — placeholder */}
      <section id="product" className="py-20 border-t border-light-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dark text-center mb-4">
            What We Do
          </h2>
          <p className="text-dark/60 text-center max-w-xl mx-auto mb-12">
            Zavis combines open healthcare data with AI to deliver actionable intelligence.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-light-200 p-8">
              <h3 className="text-lg font-bold text-dark mb-2">Open Directory</h3>
              <p className="text-sm text-dark/60 mb-4">
                12,500+ licensed healthcare providers across all seven UAE emirates.
                Free, open, and sourced from official government registers.
              </p>
              <Link href="/directory" className="text-sm font-medium text-accent hover:underline">
                Browse directory &rarr;
              </Link>
            </div>
            <div className="border border-light-200 p-8">
              <h3 className="text-lg font-bold text-dark mb-2">Healthcare Intelligence</h3>
              <p className="text-sm text-dark/60 mb-4">
                Industry insights, market analysis, regulatory updates, and
                investment tracking for UAE healthcare.
              </p>
              <Link href="/intelligence" className="text-sm font-medium text-accent hover:underline">
                Read insights &rarr;
              </Link>
            </div>
            <div className="border border-light-200 p-8">
              <h3 className="text-lg font-bold text-dark mb-2">AI Analytics</h3>
              <p className="text-sm text-dark/60 mb-4">
                AI-powered analytics for healthcare operators: patient flow,
                market sizing, competitive intelligence, and more.
              </p>
              <Link href="/book-a-demo" className="text-sm font-medium text-accent hover:underline">
                Book a demo &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
