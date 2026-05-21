"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { recordConsumerEvent } from "@/lib/consumer-intent-client";

const WHATSAPP_NUMBER = "971555312595";

type OwnerAction = "get_listed" | "claim" | "edit";
type OwnerRole =
  | "clinic_owner"
  | "clinic_manager"
  | "doctor"
  | "front_desk_admin"
  | "marketing_agency"
  | "other";

type ContactDetails = {
  name: string;
  email: string;
  phone: string;
};

const OWNER_ROLE_OPTIONS: Array<{ value: OwnerRole; label: string; helper: string }> = [
  {
    value: "clinic_owner",
    label: "Clinic owner",
    helper: "You legally own or co-own the clinic.",
  },
  {
    value: "clinic_manager",
    label: "Clinic manager",
    helper: "You manage operations or patient communications.",
  },
  {
    value: "doctor",
    label: "Doctor at this clinic",
    helper: "You practice at this clinic and can verify details.",
  },
  {
    value: "front_desk_admin",
    label: "Admin or reception team",
    helper: "You handle bookings, profiles, or clinic records.",
  },
  {
    value: "marketing_agency",
    label: "Agency or marketing partner",
    helper: "You are authorized to manage the clinic listing.",
  },
  {
    value: "other",
    label: "Other",
    helper: "You have another authorized role.",
  },
];

function roleLabel(role: OwnerRole | null): string {
  return OWNER_ROLE_OPTIONS.find((option) => option.value === role)?.label || "Not specified";
}

interface OwnerWhatsappCtaProps {
  action: OwnerAction;
  surface: string;
  label?: string;
  providerId?: string | null;
  providerName?: string | null;
  providerSlug?: string | null;
  doctorName?: string | null;
  doctorSlug?: string | null;
  citySlug?: string | null;
  categorySlug?: string | null;
  className?: string;
  /**
   * - `primary`   — green pill, white text. For light/cream backgrounds. Default.
   * - `secondary` — white pill, ink border + ink text. For light backgrounds with a softer call.
   * - `invert`    — white pill, brand-green text. For dark/coloured section backgrounds (e.g. dark hero, green section).
   * - `link`      — text-only, brand-green underlined.
   *
   * `invert` was added 2026-05-02 because callers were trying to express
   * the white-on-dark-section style by passing `className="bg-white text-[#006828]"`,
   * which collided with the primary variant's `bg-[#006828] text-white` in the
   * rendered className string. Tailwind doesn't dedupe colliding utilities, so
   * one of them won unpredictably and the CTA label rendered green-on-green
   * (invisible). Use `variant="invert"` instead of overriding colours via className.
   */
  variant?: "primary" | "secondary" | "invert" | "link";
  compact?: boolean;
}

function actionText(action: OwnerAction): string {
  if (action === "get_listed") return "get my clinic listed";
  if (action === "edit") return "edit a clinic listing";
  return "claim a clinic listing";
}

function defaultLabel(action: OwnerAction): string {
  if (action === "get_listed") return "Get listed";
  if (action === "edit") return "Edit clinic profile";
  return "Claim this clinic";
}

function buildMessage(
  props: OwnerWhatsappCtaProps,
  role: OwnerRole | null,
  contact: ContactDetails
): string {
  const lines = [
    `Hi Zavis, I want to ${actionText(props.action)} on Zavis.`,
    "",
  ];

  lines.push(`My role: ${roleLabel(role)}`);
  if (contact.name) lines.push(`My name: ${contact.name}`);
  if (contact.email) lines.push(`Email: ${contact.email}`);
  if (contact.phone) lines.push(`Phone/WhatsApp: ${contact.phone}`);
  if (props.providerName) lines.push(`Clinic: ${props.providerName}`);
  if (props.providerId) lines.push(`Listing ID: ${props.providerId}`);
  if (props.doctorName) lines.push(`Doctor page: ${props.doctorName}`);
  if (props.citySlug) lines.push(`City: ${props.citySlug}`);
  if (props.categorySlug) lines.push(`Category: ${props.categorySlug}`);
  if (typeof window !== "undefined") lines.push(`Page: ${window.location.href}`);
  lines.push(`CTA source: ${props.surface}`);
  lines.push("");
  lines.push("I confirm I am the owner or an authorized representative.");

  return lines.join("\n");
}

export function OwnerWhatsappCta(props: OwnerWhatsappCtaProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState<"role" | "contact" | "confirm">("role");
  const [selectedRole, setSelectedRole] = useState<OwnerRole | null>(null);
  const [contact, setContact] = useState<ContactDetails>({ name: "", email: "", phone: "" });
  const [contactError, setContactError] = useState("");
  const [mounted, setMounted] = useState(false);
  const label = props.label || defaultLabel(props.action);

  useEffect(() => setMounted(true), []);

  const variantClass =
    props.variant === "link"
      ? "text-[#006828] underline-offset-2 hover:underline"
      : props.variant === "secondary"
      ? "border border-black/[0.10] bg-white text-[#1c1c1c] hover:border-[#006828]/25 hover:text-[#006828]"
      : props.variant === "invert"
      ? "bg-white text-[#006828] hover:bg-white/90"
      : "bg-[#006828] text-white hover:bg-[#004d1c]";
  const sizeClass =
    props.variant === "link"
      ? "font-['Geist',sans-serif] text-sm font-medium"
      : props.compact
      ? "px-3 py-1.5 text-xs"
      : "px-4 py-2.5 text-sm";

  function handleInitialClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedRole(null);
    setContact({ name: "", email: "", phone: "" });
    setContactError("");
    setStep("role");
    setConfirmOpen(true);

    void recordConsumerEvent({
      action: `owner_${props.action}_cta_click`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: { citySlug: props.citySlug, categorySlug: props.categorySlug },
    }).catch(() => undefined);
  }

  function handleRoleContinue() {
    if (!selectedRole) return;

    const role = selectedRole;
    setStep("contact");

    void recordConsumerEvent({
      action: `owner_${props.action}_role_selected`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: {
        citySlug: props.citySlug,
        categorySlug: props.categorySlug,
        ownerRole: role,
      },
    }).catch(() => undefined);
  }

  function handleContactContinue() {
    const nextContact = {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
    };
    const hasEmail = nextContact.email.length > 0;
    const hasPhone = nextContact.phone.length > 0;

    if (!nextContact.name) {
      setContactError("Please add your name so the Zavis team knows who to contact.");
      return;
    }
    if (!hasEmail && !hasPhone) {
      setContactError("Please add either your email or WhatsApp number.");
      return;
    }
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextContact.email)) {
      setContactError("Please add a valid email address or leave it blank.");
      return;
    }

    setContact(nextContact);
    setContactError("");
    setStep("confirm");

    void recordConsumerEvent({
      action: `owner_${props.action}_contact_entered`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: {
        citySlug: props.citySlug,
        categorySlug: props.categorySlug,
        ownerRole: selectedRole,
        hasContactName: true,
        hasContactEmail: hasEmail,
        hasContactPhone: hasPhone,
      },
    }).catch(() => undefined);
  }

  function handleConfirm() {
    const role = selectedRole;
    const nextContact = {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
    };
    const text = encodeURIComponent(buildMessage(props, role, nextContact));
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    const openedWindow = window.open(whatsappUrl, "_blank");

    if (openedWindow) {
      openedWindow.opener = null;
    } else {
      window.location.href = whatsappUrl;
    }

    setConfirmOpen(false);
    setStep("role");
    setSelectedRole(null);
    setContact({ name: "", email: "", phone: "" });
    setContactError("");

    void recordConsumerEvent({
      action: `owner_${props.action}_cta_confirmed`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: {
        citySlug: props.citySlug,
        categorySlug: props.categorySlug,
        ownerRole: role,
        contactName: nextContact.name,
        contactEmail: nextContact.email || undefined,
        contactPhone: nextContact.phone || undefined,
      },
    }).catch(() => undefined);
  }

  function handleCancel() {
    const role = selectedRole;
    const abandonedStep = step;
    setConfirmOpen(false);
    setStep("role");
    setSelectedRole(null);
    setContact({ name: "", email: "", phone: "" });
    setContactError("");

    void recordConsumerEvent({
      action: `owner_${props.action}_cta_cancelled`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: {
        citySlug: props.citySlug,
        categorySlug: props.categorySlug,
        ownerRole: role,
        abandonedStep,
        hadContactName: Boolean(contact.name.trim()),
        hadContactEmail: Boolean(contact.email.trim()),
        hadContactPhone: Boolean(contact.phone.trim()),
      },
    }).catch(() => undefined);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInitialClick}
        className={`${props.variant === "link" ? "inline" : "inline-flex items-center justify-center gap-2 rounded-full font-['Geist',sans-serif] font-semibold transition-colors"} ${
          sizeClass
        } ${variantClass} ${props.className || ""}`}
      >
        {props.variant !== "link" && <MessageCircle className="h-4 w-4" aria-hidden="true" />}
        {label}
      </button>

      {confirmOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-20 sm:items-center sm:py-8" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
                  {step === "role"
                    ? "What is your role?"
                    : step === "contact"
                    ? "Where should we follow up?"
                    : "Are you sure you are authorized?"}
                </h2>
                <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/55">
                  {step === "role"
                    ? "Choose the option that best describes you. We will include this in the WhatsApp message so the team can verify your request faster."
                    : step === "contact"
                    ? "Add one contact method before WhatsApp opens. This keeps your request traceable even if the chat does not send."
                    : "Continue only if you own the clinic or are authorized to manage this listing. We will open WhatsApp with the page details included."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/[0.04] hover:text-black"
                aria-label="Close owner confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {step === "role" && (
              <div className="mt-5 grid gap-2">
                {OWNER_ROLE_OPTIONS.map((option) => {
                  const active = selectedRole === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedRole(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-[#006828] bg-[#006828]/[0.06]"
                          : "border-black/[0.08] bg-white hover:border-[#006828]/30"
                      }`}
                      aria-pressed={active}
                    >
                      <span className="block font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block font-['Geist',sans-serif] text-xs leading-relaxed text-black/45">
                        {option.helper}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === "contact" && (
              <div className="mt-5 grid gap-3">
                <div>
                  <label
                    htmlFor="owner-contact-name"
                    className="mb-1.5 block font-['Geist',sans-serif] text-xs font-semibold text-[#1c1c1c]"
                  >
                    Your name *
                  </label>
                  <input
                    id="owner-contact-name"
                    name="ownerContactName"
                    type="text"
                    autoComplete="name"
                    value={contact.name}
                    onChange={(event) => setContact({ ...contact, name: event.target.value })}
                    className="w-full rounded-xl border border-black/[0.10] px-3 py-2.5 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]/50 focus:ring-2 focus:ring-[#006828]/10"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="owner-contact-email"
                    className="mb-1.5 block font-['Geist',sans-serif] text-xs font-semibold text-[#1c1c1c]"
                  >
                    Business email
                  </label>
                  <input
                    id="owner-contact-email"
                    name="ownerContactEmail"
                    type="email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(event) => setContact({ ...contact, email: event.target.value })}
                    className="w-full rounded-xl border border-black/[0.10] px-3 py-2.5 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]/50 focus:ring-2 focus:ring-[#006828]/10"
                    placeholder="name@clinic.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="owner-contact-phone"
                    className="mb-1.5 block font-['Geist',sans-serif] text-xs font-semibold text-[#1c1c1c]"
                  >
                    WhatsApp or phone
                  </label>
                  <input
                    id="owner-contact-phone"
                    name="ownerContactPhone"
                    type="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                    className="w-full rounded-xl border border-black/[0.10] px-3 py-2.5 font-['Geist',sans-serif] text-sm outline-none transition-colors focus:border-[#006828]/50 focus:ring-2 focus:ring-[#006828]/10"
                    placeholder="+971..."
                  />
                </div>
                {contactError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-xs font-medium text-red-700">
                    {contactError}
                  </p>
                )}
              </div>
            )}

            {step === "confirm" && (
              <div className="mt-5 rounded-xl border border-[#006828]/15 bg-[#006828]/[0.04] px-4 py-3 font-['Geist',sans-serif]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#006828]">
                  Request summary
                </p>
                <dl className="mt-2 grid gap-1 text-sm text-[#1c1c1c]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-black/45">Role</dt>
                    <dd className="font-semibold text-right">{roleLabel(selectedRole)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-black/45">Name</dt>
                    <dd className="font-semibold text-right">{contact.name}</dd>
                  </div>
                  {(contact.email || contact.phone) && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-black/45">Contact</dt>
                      <dd className="font-semibold text-right">
                        {contact.email || contact.phone}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {step === "role" ? (
                <button
                  type="button"
                  onClick={handleRoleContinue}
                  disabled={!selectedRole}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c] disabled:cursor-not-allowed disabled:bg-black/20"
                >
                  Continue
                </button>
              ) : step === "contact" ? (
                <button
                  type="button"
                  onClick={handleContactContinue}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#004d1c]"
                >
                  Yes, continue to WhatsApp
                </button>
              )}
              <button
                type="button"
                onClick={step === "role" ? handleCancel : () => setStep(step === "contact" ? "role" : "contact")}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
              >
                {step === "role" ? "Cancel" : "Back"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
