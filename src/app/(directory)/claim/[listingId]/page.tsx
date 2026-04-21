"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Upload,
  Loader2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface ClaimFormPageProps {
  params: { listingId: string };
}

export default function ClaimFormPage({ params }: ClaimFormPageProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    jobTitle: "",
    proofType: "license",
    notes: "",
    phone: "",
    website: "",
    description: "",
    operatingHours: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const body = new FormData();
      body.append("providerId", params.listingId);
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
      if (formData.operatingHours)
        requestedChanges.operatingHours = formData.operatingHours;
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

      const res = await fetch("/api/claims", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
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
      <>
        <section className="relative overflow-hidden bg-surface-cream">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          </div>
          <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-lg mx-auto text-center">
              <div className="h-16 w-16 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-6">
                <CheckCircle2
                  className="h-8 w-8 text-accent-dark"
                  strokeWidth={1.75}
                />
              </div>
              <h1 className="font-display font-semibold text-ink text-display-md tracking-[-0.02em]">
                Claim request submitted.
              </h1>
              <p className="font-sans text-z-body text-ink-soft mt-3 leading-relaxed">
                Thanks — our claims team will review your submission and reply within
                2–3 business days. Keep an eye on{" "}
                <span className="text-ink font-medium">{formData.contactEmail || "your inbox"}</span>
                .
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
      </>
    );
  }

  return (
    <>
      {/* ─── Hero ─── */}
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
              Share your contact info and upload proof of affiliation — a DHA/DOH/MOHAP
              licence works best. Most claims are approved within 2–3 business days.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Form ─── */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto">
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
            {/* ─── Contact info card ─── */}
            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Your contact information</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Your contact information
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  We&apos;ll use this to reach you during verification. Never shown publicly.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Full name <span className="text-accent-dark">*</span>
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contactEmail"
                      className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                    >
                      Email <span className="text-accent-dark">*</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contactPhone"
                      className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                    >
                      Phone <span className="text-accent-dark">*</span>
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      required
                      className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="jobTitle"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Job title
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="e.g., Clinic manager, Owner, Administrator"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>
              </div>
            </fieldset>

            {/* ─── Proof of ownership card ─── */}
            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Proof of ownership</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Proof of ownership
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  A DHA/DOH/MOHAP licence is fastest. Business cards and letterheads also
                  work.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="proofType"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Proof type <span className="text-accent-dark">*</span>
                  </label>
                  <select
                    id="proofType"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors appearance-none cursor-pointer"
                    value={formData.proofType}
                    onChange={(e) =>
                      setFormData({ ...formData, proofType: e.target.value })
                    }
                    disabled={submitting}
                  >
                    <option value="license">DHA / DOH / MOHAP licence</option>
                    <option value="business_card">Business card</option>
                    <option value="letter">Official letterhead</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div
                  className="rounded-z-md border-2 border-dashed border-ink-hairline p-8 text-center cursor-pointer hover:border-ink-soft hover:bg-surface-cream/60 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <Upload
                    className="h-8 w-8 text-ink-muted mx-auto mb-3"
                    strokeWidth={1.75}
                  />
                  {fileName ? (
                    <p className="font-sans text-z-body-sm text-accent-dark font-semibold mb-1">
                      {fileName}
                    </p>
                  ) : (
                    <p className="font-sans text-z-body-sm text-ink-soft mb-1 font-medium">
                      Click to upload your proof document
                    </p>
                  )}
                  <p className="font-sans text-z-caption text-ink-muted">
                    PDF, JPG, or PNG — up to 10 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFileName(file?.name || "");
                    }}
                    disabled={submitting}
                  />
                </div>
              </div>
            </fieldset>

            {/* ─── Requested changes card ─── */}
            <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
              <legend className="sr-only">Requested changes</legend>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
                  Requested changes{" "}
                  <span className="font-sans text-z-caption text-ink-muted font-normal">
                    — optional
                  </span>
                </h2>
                <p className="font-sans text-z-caption text-ink-muted mt-1">
                  Flag any info you&apos;d like updated as part of this claim. You can edit
                  more later once verified.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="reqPhone"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Updated phone number
                  </label>
                  <input
                    id="reqPhone"
                    type="tel"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="+971 4 XXX XXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="reqWebsite"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Updated website
                  </label>
                  <input
                    id="reqWebsite"
                    type="url"
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="https://"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="reqDescription"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Updated description
                  </label>
                  <textarea
                    id="reqDescription"
                    rows={3}
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="Describe your facility — specialities, tone, what makes it yours."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5"
                  >
                    Additional notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink placeholder:text-ink-muted focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
                    placeholder="Anything else our claims team should know."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
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
                  Submitting…
                </>
              ) : (
                <>
                  Submit claim request
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="font-sans text-z-caption text-ink-muted text-center">
              By submitting, you confirm you have the authority to manage this listing.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
