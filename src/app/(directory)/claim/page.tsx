import { Metadata } from "next";
import { SearchBar } from "@/components/search/SearchBar";
import { Shield, FileCheck, Edit, CheckCircle } from "lucide-react";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Claim Your Listing",
  description: "Healthcare providers can claim their listing to update information, add photos, and manage their presence in the UAE Open Healthcare Directory.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: `${getBaseUrl()}/claim`,
  },
  openGraph: {
    title: 'Claim Your Healthcare Listing',
    description: 'Healthcare providers can claim their listing to update information, add photos, and manage their presence in the UAE Open Healthcare Directory.',
    type: 'website',
    locale: 'en_AE',
    siteName: 'UAE Open Healthcare Directory',
  },
};

export default function ClaimPage() {
  const steps = [
    {
      icon: <Shield className="h-6 w-6 text-[#006828]" />,
      title: "Find Your Listing",
      description: "Search for your healthcare facility in our directory.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-[#006828]" />,
      title: "Verify Your Identity",
      description: "Upload proof of ownership such as a DHA/DOH license, business card, or official letterhead.",
    },
    {
      icon: <Edit className="h-6 w-6 text-[#006828]" />,
      title: "Update Your Information",
      description: "Request updates to your contact details, operating hours, services, and more.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-[#006828]" />,
      title: "Get Verified",
      description: "Once approved, your listing will show a verified badge and your updates will go live.",
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-4">
          Claim Your Healthcare Listing
        </h1>
        <p className="text-black/40 text-lg">
          Are you a healthcare provider? Claim your listing to update your information,
          add photos, and help patients find accurate details about your practice.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Search for your facility</h2>
        </div>
        <SearchBar compact />
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3 justify-center">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="border border-black/[0.06] rounded-2xl p-6 text-center hover:border-[#006828]/15 transition-colors">
              <div className="h-12 w-12 bg-[#006828]/[0.04] flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-[#006828] uppercase tracking-wide mb-1">
                Step {index + 1}
              </div>
              <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mb-2">{step.title}</h3>
              <p className="font-['Geist',sans-serif] text-sm text-black/40">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-3xl mx-auto mt-12">
        <div className="border border-black/[0.06] p-8 bg-[#006828]/[0.04]">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#006828] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Benefits of Claiming Your Listing</h2>
          </div>
          <ul className="space-y-3">
            {[
              "Display a verified badge to build patient trust",
              "Update your contact details, operating hours, and services",
              "Add photos of your facility",
              "Ensure patients find accurate information",
              "Improve your visibility in search results",
              "Free to claim and maintain",
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#1c1c1c]/80">
                <CheckCircle className="h-4 w-4 text-[#006828] mt-0.5 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
