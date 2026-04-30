"use client";

import { useState } from "react";
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
  variant?: "primary" | "secondary" | "link";
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

function buildMessage(props: OwnerWhatsappCtaProps, role: OwnerRole | null): string {
  const lines = [
    `Hi Zavis, I want to ${actionText(props.action)} on Zavis.`,
    "",
  ];

  lines.push(`My role: ${roleLabel(role)}`);
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
  const [step, setStep] = useState<"role" | "confirm">("role");
  const [selectedRole, setSelectedRole] = useState<OwnerRole | null>(null);
  const label = props.label || defaultLabel(props.action);

  const variantClass =
    props.variant === "link"
      ? "text-[#006828] underline-offset-2 hover:underline"
      : props.variant === "secondary"
      ? "border border-black/[0.10] bg-white text-[#1c1c1c] hover:border-[#006828]/25 hover:text-[#006828]"
      : "bg-[#006828] text-white hover:bg-[#004d1c]";
  const sizeClass =
    props.variant === "link"
      ? "font-['Geist',sans-serif] text-sm font-medium"
      : props.compact
      ? "px-3 py-1.5 text-xs"
      : "px-4 py-2.5 text-sm";

  async function handleInitialClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await recordConsumerEvent({
      action: `owner_${props.action}_cta_click`,
      surface: props.surface,
      providerId: props.providerId,
      entityType: props.doctorSlug ? "doctor" : props.providerId ? "provider" : "directory",
      entitySlug: props.doctorSlug || props.providerSlug,
      entityName: props.doctorName || props.providerName,
      ctaLabel: label,
      metadata: { citySlug: props.citySlug, categorySlug: props.categorySlug },
    });
    setSelectedRole(null);
    setStep("role");
    setConfirmOpen(true);
  }

  async function handleRoleContinue() {
    if (!selectedRole) return;

    await recordConsumerEvent({
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
        ownerRole: selectedRole,
      },
    });
    setStep("confirm");
  }

  async function handleConfirm() {
    await recordConsumerEvent({
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
        ownerRole: selectedRole,
      },
    });

    const text = encodeURIComponent(buildMessage(props, selectedRole));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
    setConfirmOpen(false);
    setStep("role");
    setSelectedRole(null);
  }

  async function handleCancel() {
    await recordConsumerEvent({
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
        ownerRole: selectedRole,
        abandonedStep: step,
      },
    });
    setConfirmOpen(false);
    setStep("role");
    setSelectedRole(null);
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

      {confirmOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
                  {step === "role" ? "What is your role?" : "Are you sure you are authorized?"}
                </h2>
                <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/55">
                  {step === "role"
                    ? "Choose the option that best describes you. We will include this in the WhatsApp message so the team can verify your request faster."
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

            {step === "confirm" && (
              <div className="mt-5 rounded-xl border border-[#006828]/15 bg-[#006828]/[0.04] px-4 py-3">
                <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wide text-[#006828]">
                  Selected role
                </p>
                <p className="mt-1 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                  {roleLabel(selectedRole)}
                </p>
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
                onClick={step === "role" ? handleCancel : () => setStep("role")}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-black/[0.10] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] transition-colors hover:border-[#006828]/30 hover:text-[#006828]"
              >
                {step === "role" ? "Cancel" : "Change role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
