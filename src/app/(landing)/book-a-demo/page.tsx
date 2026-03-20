import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo",
  description: "Schedule a demo to see how Zavis AI-powered healthcare intelligence can help your organization.",
};

export default function BookADemoPage() {
  return (
    <div className="min-h-screen bg-[#FBFAF8] py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-dark mb-4">Book a Demo</h1>
        <p className="text-dark/60 mb-8">
          See how Zavis can help your healthcare organization with AI-powered intelligence and analytics.
        </p>
        {/* Demo booking form or Calendly embed will go here */}
        <div className="border border-light-200 bg-white p-12 text-center">
          <p className="text-muted text-sm">Demo booking form coming soon.</p>
          <a
            href="https://wa.me/971555312595?text=I%20checked%20the%20website%2C%20and%20I%20have%20a%20few%20questions%20to%20ask"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-6 bg-accent hover:bg-accent-dark text-white text-sm font-bold px-8 py-3 transition-colors"
          >
            Contact Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
