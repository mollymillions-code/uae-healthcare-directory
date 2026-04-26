"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";

export type ClaimableProvider = {
  id: string;
  name: string;
  slug: string;
  address: string;
  citySlug: string;
  categorySlug: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
  isClaimed: boolean;
};

type ClaimFormProps = {
  provider: ClaimableProvider;
};

export function ClaimForm({ provider }: ClaimFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    jobTitle: "",
    proofType: "license",
    notes: "",
    phone: provider.phone || "",
    website: provider.website || "",
    description: "",
    operatingHours: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!authorityConfirmed) {
      setError("Confirm that you are authorised to manage this provider listing.");
      return;
    }

    setSubmitting(true);

    try {
      const body = new FormData();
      body.append("providerId", provider.id);
      body.append("contactName", formData.contactName);
      body.append("contactEmail", formData.contactEmail);
      body.append("contactPhone", formData.contactPhone);
      if (formData.jobTitle) body.append("jobTitle", formData.jobTitle);
      body.append("proofType", formData.proofType);
      if (formData.notes) body.append("notes", formData.notes);

      const requestedChanges: Record<string, string> = {};
      if (formData.phone) requestedChanges.phone = formData.phone;
      if (formData.website) requestedChanges.website = formData.website;
      if (formData.description) requestedChanges.description = formData.description;
      if (formData.operatingHours) {
        requestedChanges.operatingHours = formData.operatingHours;
      }
      if (authorityConfirmed) requestedChanges.authorityConfirmed = "true";
      if (Object.keys(requestedChanges).length > 0) {
        body.append("requestedChanges", JSON.stringify(requestedChanges));
      }

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setError("File too large. Maximum size is 10MB.");
          setSubmitting(false);
          return;
        }
        body.append("proofDocument", file);
      }

      const response = await fetch("/api/claims", {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-accent-dark" strokeWidth={1.75} />
            </div>
            <h1 className="font-display font-semibold text-ink text-display-md tracking-[-0.02em]">
              Claim request submitted.
            </h1>
            <p className="font-sans text-z-body text-ink-soft mt-3 leading-relaxed">
              Thanks. Our claims team will review your submission for{" "}
              <span className="text-ink font-medium">{provider.name}</span> and reply
              within 2-3 business days.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/directory")}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-z-pill px-5 py-3 font-sans font-semibold text-z-body-sm transition-colors"
              >
                Return to directory
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/claim"
                className="inline-flex items-center gap-2 bg-white border border-ink text-ink hover:bg-surface-cream rounded-z-pill px-5 py-3 font-sans font-medium text-z-body-sm transition-colors"
              >
                Claim another
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/claim" className="hover:text-ink transition-colors">
              Claim
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Submit claim</span>
          </nav>

          <div className="max-w-2xl">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verification
            </p>
            <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[48px] leading-[1.04] tracking-[-0.028em]">
              Claim this listing.
            </h1>
            <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 leading-relaxed">
              Confirm the provider below, share your contact info, and upload proof of
              affiliation. A regulator licence, business card, or official letterhead works best.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 rounded-z-lg bg-white border border-ink-line p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-z-sm bg-accent-muted flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-accent-deep" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-1">
                  Provider being claimed
                </p>
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  {provider.name}
                </h2>
                <p className="font-sans text-z-body-sm text-ink-muted mt-1 leading-relaxed">
                  {provider.address}
                </p>
                <p className="font-sans text-z-caption text-ink-muted mt-2">
                  {[provider.citySlug, provider.categorySlug, provider.licenseNumber ? `Licence ${provider.licenseNumber}` : ""]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="mb-6 rounded-z-md bg-white border border-red-200 p-4 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="font-sans text-z-body-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Your contact information</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Your contact information
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  We use this only for verification. It is not shown publicly.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Full name <span className="text-accent-dark">*</span>
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    value={formData.contactName}
                    onChange={(event) => setFormData({ ...formData, contactName: event.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactEmail" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                      Email <span className="text-accent-dark">*</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                      value={formData.contactEmail}
                      onChange={(event) => setFormData({ ...formData, contactEmail: event.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                      Phone <span className="text-accent-dark">*</span>
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      required
                      className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                      value={formData.contactPhone}
                      onChange={(event) => setFormData({ ...formData, contactPhone: event.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Job title
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="Clinic manager, owner, administrator"
                    value={formData.jobTitle}
                    onChange={(event) => setFormData({ ...formData, jobTitle: event.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Proof of authority</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Proof of authority
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  Upload a licence, letterhead, business card, or signed authorisation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="proofType" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Proof type <span className="text-accent-dark">*</span>
                  </label>
                  <select
                    id="proofType"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors cursor-pointer"
                    value={formData.proofType}
                    onChange={(event) => setFormData({ ...formData, proofType: event.target.value })}
                    disabled={submitting}
                  >
                    <option value="license">Regulator licence</option>
                    <option value="trade_license">Trade licence</option>
                    <option value="business_card">Business card</option>
                    <option value="letter">Official letterhead</option>
                    <option value="authorization">Signed authorisation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div
                  className="rounded-z-md border-2 border-dashed border-ink-hairline p-8 text-center cursor-pointer hover:border-ink-soft hover:bg-surface-cream/60 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <Upload className="h-8 w-8 text-ink-muted mx-auto mb-3" strokeWidth={1.75} />
                  <p className="font-sans text-z-body-sm text-ink-soft mb-1 font-medium">
                    {fileName || "Click to upload your proof document"}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted">
                    PDF, JPG, PNG, WebP, HEIC, DOC, or DOCX up to 10 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx"
                    className="hidden"
                    onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
                    disabled={submitting}
                  />
                </div>

                <label className="flex gap-3 rounded-z-md bg-surface-cream border border-ink-line p-4 font-sans text-z-body-sm text-ink-soft leading-relaxed">
                  <input
                    type="checkbox"
                    required
                    checked={authorityConfirmed}
                    onChange={(event) => setAuthorityConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-ink-hairline text-accent"
                    disabled={submitting}
                  />
                  <span>
                    I confirm I am authorised by {provider.name} to claim and manage this
                    listing, and the documents submitted are accurate.
                  </span>
                </label>
              </div>
            </fieldset>

            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Requested changes</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Requested changes{" "}
                  <span className="font-sans text-z-caption text-ink-muted font-normal">
                    optional
                  </span>
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  Flag information you want corrected as part of this claim.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="reqPhone" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Updated phone number
                  </label>
                  <input
                    id="reqPhone"
                    type="tel"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="reqWebsite" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Updated website
                  </label>
                  <input
                    id="reqWebsite"
                    type="url"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="https://"
                    value={formData.website}
                    onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="reqDescription" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Updated description
                  </label>
                  <textarea
                    id="reqDescription"
                    rows={3}
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                    Additional notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    value={formData.notes}
                    onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-z-pill px-6 py-3.5 font-sans font-semibold text-z-body-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit claim request
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
