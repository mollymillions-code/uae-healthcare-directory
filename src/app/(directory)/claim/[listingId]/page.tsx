"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CheckCircle, Upload } from "lucide-react";

interface ClaimFormPageProps {
  params: { listingId: string };
}

export default function ClaimFormPage({ params }: ClaimFormPageProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    jobTitle: "",
    proofType: "license",
    notes: "",
    // Requested changes
    phone: "",
    website: "",
    description: "",
    operatingHours: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would POST to /api/claims
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="h-16 w-16 bg-[#006828]/[0.04] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-[#006828]" />
          </div>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[22px] sm:text-[26px] text-[#1c1c1c] tracking-tight mb-4">
            Claim Request Submitted
          </h1>
          <p className="text-black/40 mb-6">
            Thank you for your claim request. Our team will review your submission
            and get back to you within 2-3 business days.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-accent"
          >
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: "Claim Listing", href: "/claim" },
          { label: "Submit Claim" },
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Claim This Listing
        </h1>
        <p className="text-black/40 mb-8">
          Fill in your details and provide proof of ownership to claim this listing.
          Listing ID: {params.listingId}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="border border-black/[0.06] rounded-2xl p-6">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mb-4">Your Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Full Name *
                </label>
                <input
                  id="contactName"
                  type="text"
                  required
                  className="input-tc"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                    Email *
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    className="input-tc"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                    Phone *
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    required
                    className="input-tc"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  className="input-tc"
                  placeholder="e.g., Clinic Manager, Owner, Administrator"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Proof of Ownership */}
          <div className="border border-black/[0.06] rounded-2xl p-6">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mb-4">Proof of Ownership</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="proofType" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Proof Type *
                </label>
                <select
                  id="proofType"
                  className="input-tc"
                  value={formData.proofType}
                  onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                >
                  <option value="license">DHA/DOH/MOH License</option>
                  <option value="business_card">Business Card</option>
                  <option value="letter">Official Letterhead</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-black/[0.06] p-8 text-center">
                <Upload className="h-8 w-8 text-black/40 mx-auto mb-3" />
                <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-1">
                  Upload your proof document
                </p>
                <p className="font-['Geist',sans-serif] text-xs text-black/40">
                  PDF, JPG, or PNG up to 10MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="mt-3 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Requested Changes */}
          <div className="border border-black/[0.06] rounded-2xl p-6">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight mb-2">Requested Changes</h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/40 mb-4">
              Optionally specify what information you&apos;d like to update.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reqPhone" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Updated Phone Number
                </label>
                <input
                  id="reqPhone"
                  type="tel"
                  className="input-tc"
                  placeholder="e.g., +971-4-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="reqWebsite" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Updated Website
                </label>
                <input
                  id="reqWebsite"
                  type="url"
                  className="input-tc"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="reqDescription" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Updated Description
                </label>
                <textarea
                  id="reqDescription"
                  className="input-tc"
                  rows={3}
                  placeholder="Describe your facility..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-[#1c1c1c] mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  className="input-tc"
                  rows={3}
                  placeholder="Any other changes or information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-accent w-full py-3 text-base">
            Submit Claim Request
          </button>
        </form>
      </div>
    </div>
  );
}
