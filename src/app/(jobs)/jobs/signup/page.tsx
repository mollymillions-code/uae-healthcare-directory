"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { UAE_CITIES } from "@/lib/jobs/format";
import { ROLE_LABELS, ROLE_ORDER, disciplinesByRole, type Role } from "@/lib/jobs/disciplines";

const TOTAL_STEPS = 7;

interface FormState {
  // Step 1 — role + discipline
  role: Role | "";
  disciplineSlug: string;
  // Step 2 — license + experience
  licenseStatus: string;
  experienceYears: string;
  // Step 3 — location + visa
  currentCitySlug: string;
  preferredCitySlugs: string[];
  willingToRelocate: boolean;
  visaStatus: string;
  // Step 4 — salary + employment
  salaryExpectationMinAed: string;
  salaryExpectationMaxAed: string;
  employmentTypePref: string[];
  // Step 5 — notification prefs
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  whatsappNumber: string;
  // Step 6 — visibility + recruiter consent
  visibility: "public" | "limited" | "private";
  consentRecruiterVisibility: boolean;
  // Step 7 — account + PDPL clickwrap
  email: string;
  password: string;
  name: string;
  consentTerms: boolean;
  consentDataProcessing: boolean;
  marketingOptIn: boolean;
}

const INITIAL_STATE: FormState = {
  role: "",
  disciplineSlug: "",
  licenseStatus: "",
  experienceYears: "",
  currentCitySlug: "",
  preferredCitySlugs: [],
  willingToRelocate: false,
  visaStatus: "",
  salaryExpectationMinAed: "",
  salaryExpectationMaxAed: "",
  employmentTypePref: [],
  notifyEmail: true,
  notifyWhatsapp: false,
  whatsappNumber: "",
  visibility: "limited",
  consentRecruiterVisibility: false,
  email: "",
  password: "",
  name: "",
  consentTerms: false,
  consentDataProcessing: false,
  marketingOptIn: false,
};

function SignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/jobs/profile";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleListItem(key: "preferredCitySlugs" | "employmentTypePref", value: string) {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function next() {
    setError("");
    // Validation per step
    if (step === 1 && !form.role) {
      setError("Pick the role family that best describes you.");
      return;
    }
    if (step === 7) {
      submit();
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function prev() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    if (!form.consentTerms || !form.consentDataProcessing) {
      setError("Please accept the Terms and PDPL data-processing notice to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          disciplineSlug: form.disciplineSlug || null,
          licenseStatus: form.licenseStatus || null,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
          currentCitySlug: form.currentCitySlug || null,
          preferredCitySlugs: form.preferredCitySlugs,
          willingToRelocate: form.willingToRelocate,
          visaStatus: form.visaStatus || null,
          salaryExpectationMinAed: form.salaryExpectationMinAed ? Number(form.salaryExpectationMinAed) : null,
          salaryExpectationMaxAed: form.salaryExpectationMaxAed ? Number(form.salaryExpectationMaxAed) : null,
          employmentTypePref: form.employmentTypePref,
          notifyEmail: form.notifyEmail,
          notifyWhatsapp: form.notifyWhatsapp,
          whatsappNumber: form.whatsappNumber || null,
          visibility: form.visibility,
          consentTerms: form.consentTerms,
          consentDataProcessing: form.consentDataProcessing,
          consentRecruiterVisibility: form.consentRecruiterVisibility,
          marketingOptIn: form.marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setSubmitting(false);
        return;
      }
      // Auto-sign in
      const signin = await signIn("candidate-credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signin?.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        router.push(`/jobs/login?redirect=${encodeURIComponent(redirect)}`);
      }
    } catch {
      setError("Could not create account.");
      setSubmitting(false);
    }
  }

  const disciplinesForRole = form.role ? disciplinesByRole(form.role) : [];

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6">
      <Link
        href="/jobs"
        className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]"
      >
        zavis<span className="text-[#006828]">.</span>
      </Link>

      <p className="mt-8 font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
        Candidate signup · step {step} of {TOTAL_STEPS}
      </p>

      <div className="mt-3 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-[#006828]" : "bg-black/[0.08]"}`}
          />
        ))}
      </div>

      <div className="mt-8">
        {step === 1 && (
          <Step1Role form={form} update={updateForm} disciplines={disciplinesForRole} />
        )}
        {step === 2 && <Step2License form={form} update={updateForm} />}
        {step === 3 && <Step3Location form={form} update={updateForm} toggle={toggleListItem} />}
        {step === 4 && <Step4SalaryEmployment form={form} update={updateForm} toggle={toggleListItem} />}
        {step === 5 && <Step5Notifications form={form} update={updateForm} />}
        {step === 6 && <Step6Visibility form={form} update={updateForm} />}
        {step === 7 && <Step7Account form={form} update={updateForm} />}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-[14px] font-medium text-black/55 hover:text-[#1c1c1c]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={next}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] transition-all hover:bg-[#005220] disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} /> Creating profile…
            </>
          ) : step === TOTAL_STEPS ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.25} /> Create my profile
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </>
          )}
        </button>
      </div>

      <p className="mt-10 font-['Geist',sans-serif] text-[12px] text-black/40">
        Already have an account?{" "}
        <Link href={`/jobs/login?redirect=${encodeURIComponent(redirect)}`} className="font-medium text-[#006828] underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Step1Role({
  form,
  update,
  disciplines,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  disciplines: { slug: string; name: string }[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          What kind of role do you do?
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          Pick the family that fits best — we&apos;ll narrow down the exact title in a moment.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ROLE_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => update("role", r)}
            className={`rounded-2xl border px-4 py-3 text-left font-['Geist',sans-serif] text-[13px] transition-colors ${
              form.role === r
                ? "border-[#006828] bg-[#006828]/[0.04] text-[#006828]"
                : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
            }`}
          >
            <span className="block font-medium">{ROLE_LABELS[r]}</span>
          </button>
        ))}
      </div>

      {disciplines.length > 0 && (
        <div>
          <p className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
            More specifically
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {disciplines.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => update("disciplineSlug", d.slug)}
                className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
                  form.disciplineSlug === d.slug
                    ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                    : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step2License({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const options = [
    { value: "dha", label: "DHA-licensed (Dubai)" },
    { value: "doh", label: "DOH-licensed (Abu Dhabi)" },
    { value: "mohap", label: "MOHAP-licensed (federal)" },
    { value: "dataflow_pending", label: "Dataflow / Prometric in process" },
    { value: "outside_uae", label: "Licensed outside the UAE" },
    { value: "none", label: "No clinical licence (non-clinical role)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          UAE licensing & experience
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          Helps us match you to the right openings — and surface roles that don&apos;t require a UAE licence yet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => update("licenseStatus", o.value)}
            className={`rounded-2xl border px-4 py-3 text-left font-['Geist',sans-serif] text-[14px] transition-colors ${
              form.licenseStatus === o.value
                ? "border-[#006828] bg-[#006828]/[0.04] text-[#006828]"
                : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Years of experience
        </span>
        <input
          type="number"
          min="0"
          max="60"
          value={form.experienceYears}
          onChange={(e) => update("experienceYears", e.target.value)}
          placeholder="e.g. 5"
          className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
      </label>
    </div>
  );
}

function Step3Location({
  form,
  update,
  toggle,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggle: (key: "preferredCitySlugs" | "employmentTypePref", value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          Where are you, and where could you work?
        </h2>
      </div>

      <div>
        <p className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Where are you based now?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {UAE_CITIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => update("currentCitySlug", c.slug)}
              className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
                form.currentCitySlug === c.slug
                  ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                  : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
              }`}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => update("currentCitySlug", "")}
            className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
              form.currentCitySlug === ""
                ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                : "border-black/[0.08] bg-white text-black/55 hover:border-[#006828]/40"
            }`}
          >
            Outside the UAE
          </button>
        </div>
      </div>

      <div>
        <p className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Where would you consider working?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {UAE_CITIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggle("preferredCitySlugs", c.slug)}
              className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
                form.preferredCitySlugs.includes(c.slug)
                  ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                  : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c]">
        <input
          type="checkbox"
          checked={form.willingToRelocate}
          onChange={(e) => update("willingToRelocate", e.target.checked)}
          className="h-4 w-4 rounded border-black/20 accent-[#006828]"
        />
        I&apos;m open to relocating within the UAE for the right role
      </label>

      <div>
        <p className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Visa status
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: "citizen", label: "UAE citizen" },
            { value: "residence", label: "UAE residence visa" },
            { value: "needs_sponsorship", label: "Needs sponsorship" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => update("visaStatus", o.value)}
              className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
                form.visaStatus === o.value
                  ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                  : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4SalaryEmployment({
  form,
  update,
  toggle,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggle: (key: "preferredCitySlugs" | "employmentTypePref", value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          What are you looking for?
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          We&apos;ll only show salary expectations to clinics if you choose to make them visible.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="font-['Geist',sans-serif] text-[12px] font-medium uppercase tracking-[0.06em] text-black/55">
            Min salary (AED / month)
          </span>
          <input
            type="number"
            min="0"
            value={form.salaryExpectationMinAed}
            onChange={(e) => update("salaryExpectationMinAed", e.target.value)}
            placeholder="8000"
            className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
        </label>
        <label className="block">
          <span className="font-['Geist',sans-serif] text-[12px] font-medium uppercase tracking-[0.06em] text-black/55">
            Max salary (AED / month)
          </span>
          <input
            type="number"
            min="0"
            value={form.salaryExpectationMaxAed}
            onChange={(e) => update("salaryExpectationMaxAed", e.target.value)}
            placeholder="15000"
            className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
        </label>
      </div>

      <div>
        <p className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Employment type
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: "full_time", label: "Full-time" },
            { value: "part_time", label: "Part-time" },
            { value: "locum", label: "Locum / temporary" },
            { value: "visiting", label: "Visiting / consulting" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle("employmentTypePref", o.value)}
              className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-[12px] transition-colors ${
                form.employmentTypePref.includes(o.value)
                  ? "border-[#006828] bg-[#006828]/[0.06] text-[#006828]"
                  : "border-black/[0.08] bg-white text-[#1c1c1c] hover:border-[#006828]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Notifications({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          How should we reach you?
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          We use these only for new-job alerts and recruiter messages — never for marketing.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={form.notifyEmail}
          onChange={(e) => update("notifyEmail", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-black/20 accent-[#006828]"
        />
        <span>
          <span className="block font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c]">
            Email alerts
          </span>
          <span className="block font-['Geist',sans-serif] text-[12px] text-black/55">
            New jobs matching your role + cities, weekly digest by default.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={form.notifyWhatsapp}
          onChange={(e) => update("notifyWhatsapp", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-black/20 accent-[#006828]"
        />
        <span>
          <span className="block font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c]">
            WhatsApp notifications (one-way)
          </span>
          <span className="block font-['Geist',sans-serif] text-[12px] text-black/55">
            Optional. Only for high-priority match notifications. We never use WhatsApp for marketing or chat — just a one-way ping when there&apos;s something worth your time.
          </span>
        </span>
      </label>

      {form.notifyWhatsapp && (
        <input
          type="tel"
          value={form.whatsappNumber}
          onChange={(e) => update("whatsappNumber", e.target.value)}
          placeholder="+971 XX XXX XXXX"
          className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
      )}
    </div>
  );
}

function Step6Visibility({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const options: { value: FormState["visibility"]; title: string; body: string }[] = [
    {
      value: "public",
      title: "Public",
      body: "Your profile (without contact info) appears in the public Zavis directory and search engines. Strongest signal that you&apos;re open. Recruiters see your full profile only if you&apos;ve also enabled recruiter visibility below.",
    },
    {
      value: "limited",
      title: "Limited (recommended)",
      body: "Your profile is visible only inside Zavis and only when you apply or when a recruiter you&apos;ve enabled visibility for views it. Default for most candidates.",
    },
    {
      value: "private",
      title: "Private",
      body: "Your profile is private to you. You apply manually; nobody can find or contact you through Zavis until you apply.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          Who can see your profile?
        </h2>
        <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/55">
          You can change this anytime from your profile settings.
        </p>
      </div>

      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => update("visibility", o.value)}
            className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
              form.visibility === o.value
                ? "border-[#006828] bg-[#006828]/[0.04]"
                : "border-black/[0.08] bg-white hover:border-[#006828]/40"
            }`}
          >
            <span className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
              {o.title}
            </span>
            <span className="mt-1 block font-['Geist',sans-serif] text-[13px] leading-relaxed text-black/55">
              {o.body}
            </span>
          </button>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={form.consentRecruiterVisibility}
          onChange={(e) => update("consentRecruiterVisibility", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-black/20 accent-[#006828]"
        />
        <span>
          <span className="block font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c]">
            Allow verified clinic recruiters to view my profile and reach out
          </span>
          <span className="block font-['Geist',sans-serif] text-[12px] text-black/55">
            Optional. We only let verified Zavis-platform clinics view profiles, and you control whether they can see your contact info or only message you through Zavis. Off by default.
          </span>
        </span>
      </label>
    </div>
  );
}

function Step7Account({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[24px] font-medium tracking-tight text-[#1c1c1c]">
          Create your account
        </h2>
      </div>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Full name (optional)
        </span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          autoComplete="name"
          placeholder="Your name"
          className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
      </label>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Email
        </span>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
      </label>

      <label className="block">
        <span className="font-['Geist',sans-serif] text-[13px] font-medium uppercase tracking-[0.06em] text-black/55">
          Password (8+ characters)
        </span>
        <input
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
        />
      </label>

      <div className="space-y-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-4">
        <label className="flex items-start gap-3 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c]">
          <input
            type="checkbox"
            checked={form.consentTerms}
            onChange={(e) => update("consentTerms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#006828]"
            required
          />
          <span>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="font-medium text-[#006828] underline-offset-2 hover:underline">
              Zavis Terms
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-[#006828] underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c]">
          <input
            type="checkbox"
            checked={form.consentDataProcessing}
            onChange={(e) => update("consentDataProcessing", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#006828]"
            required
          />
          <span>
            I consent to Zavis processing my personal data (including any sensitive professional and health data I provide) under UAE PDPL — Federal Decree-Law No. 45 of 2021 — for the purpose of running my candidate profile and presenting my profile to opportunities I apply to.
          </span>
        </label>
        <label className="flex items-start gap-3 font-['Geist',sans-serif] text-[13px] text-black/55">
          <input
            type="checkbox"
            checked={form.marketingOptIn}
            onChange={(e) => update("marketingOptIn", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#006828]"
          />
          <span>
            (Optional) I&apos;d like occasional Zavis newsletters about UAE healthcare careers, salary benchmarks and new tools.
          </span>
        </label>
      </div>
    </div>
  );
}

export default function CandidateSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f8f6]" />}>
      <SignupWizard />
    </Suspense>
  );
}
