import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demo Requested",
  description: "Thank you for requesting a demo. We will be in touch shortly.",
  robots: { index: false, follow: false },
};

export default function DemoRequestedPage() {
  return (
    <div className="min-h-screen bg-[#FBFAF8] py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-dark mb-4">Thank You</h1>
        <p className="text-dark/60 mb-8">
          Your demo request has been received. Our team will reach out within 24 hours to schedule a session.
        </p>
        <Link
          href="/"
          className="inline-flex items-center bg-accent hover:bg-accent-dark text-white text-sm font-bold px-8 py-3 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
