"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { CITIES } from "@/lib/constants/cities";

const COUNTRIES = [
  { code: "ae", name: "United Arab Emirates", regulator: "DHA, DOH, MOHAP, or relevant free-zone authority" },
  { code: "sa", name: "Saudi Arabia", regulator: "Saudi Ministry of Health, CBAHI, or SCFHS where applicable" },
  { code: "qa", name: "Qatar", regulator: "Ministry of Public Health Qatar" },
  { code: "bh", name: "Bahrain", regulator: "National Health Regulatory Authority Bahrain" },
  { code: "kw", name: "Kuwait", regulator: "Kuwait Ministry of Health" },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

export function ListingRequestForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    country: "ae" as CountryCode,
    city: "",
    category: "",
    practiceName: "",
    address: "",
    website: "",
    googleBusinessProfileUrl: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    jobTitle: "",
    regulator: "",
    regulatorLicenseNumber: "",
    tradeLicenseNumber: "",
    notes: "",
  });

  const cities = useMemo(
    () => CITIES.filter((city) => city.country === formData.country),
    [formData.country]
  );
  const country = COUNTRIES.find((item) => item.code === formData.country) || COUNTRIES[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!authorityConfirmed) {
      setError("Confirm you have authority to request this listing.");
      return;
    }

    const proofFile = fileInputRef.current?.files?.[0];
    if (!proofFile) {
      setError("Upload proof of authority, such as a trade licence or regulator licence.");
      return;
    }

    if (proofFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => body.append(key, value));
      body.append("authorityConfirmed", authorityConfirmed ? "true" : "false");
      body.append("proofDocument", proofFile);

      const response = await fetch("/api/listing-requests", {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center rounded-z-lg bg-white border border-ink-line p-8">
        <div className="h-16 w-16 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-accent-dark" strokeWidth={1.75} />
        </div>
        <h1 className="font-display font-semibold text-ink text-display-md tracking-[-0.02em]">
          Listing request submitted.
        </h1>
        <p className="font-sans text-z-body text-ink-soft mt-3 leading-relaxed">
          We will review the practice, licence details, and proof document before adding
          it to the directory.
        </p>
        <Link
          href="/claim"
          className="mt-7 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-z-pill px-5 py-3 font-sans font-semibold text-z-body-sm transition-colors"
        >
          Back to claim search
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-z-md bg-white border border-red-200 p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="font-sans text-z-body-sm text-red-700">{error}</p>
        </div>
      )}

      <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
        <legend className="sr-only">Practice details</legend>
        <div className="mb-5">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
            Practice details
          </h2>
          <p className="font-sans text-z-caption text-ink-muted mt-1">
            Add the public business and category details patients will use to identify the provider.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="practiceName" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Practice name <span className="text-accent-dark">*</span>
            </label>
            <input
              id="practiceName"
              required
              value={formData.practiceName}
              onChange={(event) => setFormData({ ...formData, practiceName: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="country" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Country <span className="text-accent-dark">*</span>
            </label>
            <select
              id="country"
              required
              value={formData.country}
              onChange={(event) =>
                setFormData({ ...formData, country: event.target.value as CountryCode, city: "", regulator: "" })
              }
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            >
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              City <span className="text-accent-dark">*</span>
            </label>
            <select
              id="city"
              required
              value={formData.city}
              onChange={(event) => setFormData({ ...formData, city: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            >
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Category <span className="text-accent-dark">*</span>
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="website" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Website
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://"
              value={formData.website}
              onChange={(event) => setFormData({ ...formData, website: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Address <span className="text-accent-dark">*</span>
            </label>
            <textarea
              id="address"
              rows={3}
              required
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="googleBusinessProfileUrl" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Google Business Profile link <span className="text-accent-dark">*</span>
            </label>
            <input
              id="googleBusinessProfileUrl"
              type="url"
              required
              placeholder="https://maps.google.com/..."
              value={formData.googleBusinessProfileUrl}
              onChange={(event) => setFormData({ ...formData, googleBusinessProfileUrl: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
        <legend className="sr-only">Licence and authority</legend>
        <div className="mb-5">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
            Licence and authority
          </h2>
          <p className="font-sans text-z-caption text-ink-muted mt-1">
            For {country.name}, include the regulator used by {country.regulator}.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="regulator" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Healthcare regulator <span className="text-accent-dark">*</span>
            </label>
            <input
              id="regulator"
              required
              placeholder={country.regulator}
              value={formData.regulator}
              onChange={(event) => setFormData({ ...formData, regulator: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="regulatorLicenseNumber" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                Regulator licence number <span className="text-accent-dark">*</span>
              </label>
              <input
                id="regulatorLicenseNumber"
                required
                value={formData.regulatorLicenseNumber}
                onChange={(event) => setFormData({ ...formData, regulatorLicenseNumber: event.target.value })}
                className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="tradeLicenseNumber" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
                Trade licence / commercial registration <span className="text-accent-dark">*</span>
              </label>
              <input
                id="tradeLicenseNumber"
                required
                value={formData.tradeLicenseNumber}
                onChange={(event) => setFormData({ ...formData, tradeLicenseNumber: event.target.value })}
                className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
              />
            </div>
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
            <FileUp className="h-8 w-8 text-ink-muted mx-auto mb-3" strokeWidth={1.75} />
            <p className="font-sans text-z-body-sm text-ink-soft mb-1 font-medium">
              {fileName || "Upload licence, registration, or authorisation proof"}
            </p>
            <p className="font-sans text-z-caption text-ink-muted">
              Proof is used only for review. PDF, JPG, PNG, WebP, HEIC, DOC, or DOCX up to 10 MB.
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
              I confirm I am authorised to request this listing and that Zavis may use
              the submitted proof to verify the practice with the relevant authority.
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-z-lg bg-white border border-ink-line p-6 sm:p-7">
        <legend className="sr-only">Requester contact</legend>
        <div className="mb-5">
          <h2 className="font-display font-semibold text-ink text-z-h2 tracking-[-0.012em]">
            Requester contact
          </h2>
          <p className="font-sans text-z-caption text-ink-muted mt-1">
            We use this to resolve verification questions before publication.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactName" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Full name <span className="text-accent-dark">*</span>
            </label>
            <input
              id="contactName"
              required
              value={formData.contactName}
              onChange={(event) => setFormData({ ...formData, contactName: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Job title
            </label>
            <input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(event) => setFormData({ ...formData, jobTitle: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Email <span className="text-accent-dark">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              value={formData.contactEmail}
              onChange={(event) => setFormData({ ...formData, contactEmail: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
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
              value={formData.contactPhone}
              onChange={(event) => setFormData({ ...formData, contactPhone: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block font-sans text-z-caption font-semibold text-ink-soft mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              className="w-full bg-white rounded-z-md border border-ink-hairline px-4 py-3 font-sans text-z-body text-ink focus:border-ink focus:ring-1 focus:ring-ink outline-none transition-colors"
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
            <ShieldCheck className="h-4 w-4" />
            Submit listing request
          </>
        )}
      </button>
    </form>
  );
}
