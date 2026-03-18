import { Metadata } from "next";
import { SearchBar } from "@/components/search/SearchBar";
import { Shield, FileCheck, Edit, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Claim Your Listing",
  description: "Healthcare providers can claim their listing to update information, add photos, and manage their presence in the UAE Healthcare Directory.",
};

export default function ClaimPage() {
  const steps = [
    {
      icon: <Shield className="h-6 w-6 text-brand-600" />,
      title: "Find Your Listing",
      description: "Search for your healthcare facility in our directory.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-brand-600" />,
      title: "Verify Your Identity",
      description: "Upload proof of ownership such as a DHA/DOH license, business card, or official letterhead.",
    },
    {
      icon: <Edit className="h-6 w-6 text-brand-600" />,
      title: "Update Your Information",
      description: "Request updates to your contact details, operating hours, services, and more.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-brand-600" />,
      title: "Get Verified",
      description: "Once approved, your listing will show a verified badge and your updates will go live.",
    },
  ];

  return (
    <div className="container-tc py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Claim Your Healthcare Listing
        </h1>
        <p className="text-gray-600 text-lg">
          Are you a healthcare provider? Claim your listing to update your information,
          add photos, and help patients find accurate details about your practice.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Search for your facility
        </h2>
        <SearchBar compact />
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="card p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <div className="text-xs font-semibold text-brand-600 mb-1">
                Step {index + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-3xl mx-auto mt-12">
        <div className="card p-8 bg-brand-50 border-brand-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Benefits of Claiming Your Listing
          </h2>
          <ul className="space-y-3">
            {[
              "Display a verified badge to build patient trust",
              "Update your contact details, operating hours, and services",
              "Add photos of your facility",
              "Ensure patients find accurate information",
              "Improve your visibility in search results",
              "Free to claim and maintain",
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
