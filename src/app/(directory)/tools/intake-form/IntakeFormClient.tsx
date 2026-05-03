"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ZavisAIBadge } from "@/components/tools/ZavisAIBadge";
import { AIDisclaimer } from "@/components/tools/AIDisclaimer";

interface AIIntakeQuestion {
  id: string;
  labelEn: string;
  labelAr: string;
  type: string;
  required: boolean;
  placeholderEn?: string;
  placeholderAr?: string;
  options?: Array<{ valueEn: string; valueAr: string } | string>;
}
interface AIIntakeSection {
  id: string;
  titleEn: string;
  titleAr: string;
  questions: AIIntakeQuestion[];
}
interface AIIntakeResult {
  formName: string;
  formNameAr: string;
  introTextEn: string;
  introTextAr: string;
  sections: AIIntakeSection[];
  consentBlocks: Array<{ titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; required: boolean }>;
  regulatoryNotes: string[];
  tipsForClinic: string[];
}
import { Download, FileText, Mail, Check } from "lucide-react";
import { SECTIONS, SPECIALTY_LABELS, type Specialty, type Section } from "@/lib/tools/intake-form";

export function IntakeFormClient() {
  const [clinicName, setClinicName] = useState("Your clinic name");
  const [specialty, setSpecialty] = useState<Specialty>("general");
  const [includedSections, setIncludedSections] = useState<Set<string>>(
    () => new Set(SECTIONS.filter((s) => s.defaultIncluded).map((s) => s.id))
  );
  const [customQuestions, setCustomQuestions] = useState<string[]>([""]);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // AI generator state
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState<AIIntakeResult | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  async function runAIGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (aiDescription.trim().length < 20) {
      setAiError("Describe your clinic in at least 20 characters.");
      setAiStatus("error");
      return;
    }
    setAiStatus("loading");
    setAiError("");
    setAiResult(null);
    try {
      const res = await fetch("/api/tools/intake-form/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicDescription: aiDescription,
          specialty: specialty || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Could not generate. Try again.");
        setAiStatus("error");
        return;
      }
      setAiResult(data);
      setAiStatus("idle");
    } catch {
      setAiError("Network error. Try again.");
      setAiStatus("error");
    }
  }

  const activeSections = useMemo(
    () => SECTIONS.filter((s) => includedSections.has(s.id)),
    [includedSections]
  );

  function toggleSection(id: string) {
    setIncludedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadHtml() {
    const filteredCustom = customQuestions.filter((q) => q.trim());
    const html = generateHtml({ clinicName, specialty, sections: activeSections, customQuestions: filteredCustom });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clinicName.toLowerCase().replace(/\s+/g, "-")}-intake.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    const filteredCustom = customQuestions.filter((q) => q.trim());
    const config = {
      clinicName,
      specialty,
      sections: activeSections.map((s) => ({
        id: s.id,
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        questions: s.questions,
      })),
      customQuestions: filteredCustom,
      generatedAt: new Date().toISOString(),
      generatedBy: "Zavis Free Tools — zavis.ai/tools/intake-form",
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clinicName.toLowerCase().replace(/\s+/g, "-")}-intake.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/tools/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "tool-intake-form",
          context: { clinicName, specialty, sections: Array.from(includedSections) },
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      {/* ── AI generator (primary action) ─────────────────────────────── */}
      <div className="rounded-2xl border-2 border-[#006828]/15 bg-gradient-to-br from-[#006828]/[0.04] via-white to-white p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#006828]" strokeWidth={2.25} />
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c]">
              Generate a tailored intake form for your clinic
            </p>
          </div>
          <ZavisAIBadge />
        </div>
        <p className="mt-2 font-['Geist',sans-serif] text-[13px] text-black/55 leading-relaxed">
          Describe your clinic — specialty, patient mix, insurers accepted, anything specific. Zavis AI generates a complete bilingual (EN + AR) PDPL-compliant intake form: patient info, medical history, specialty-specific sections, insurance, and consent blocks.
        </p>

        <form onSubmit={runAIGenerate} className="mt-4 space-y-3">
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. 'OB/GYN clinic in Dubai Marina, mix of Daman + Thiqa + cash patients, accept Bupa Global for high-net-worth, want a form that captures OB history + last menstrual period + insurance pre-auth'"
            rows={4}
            maxLength={4000}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
          <button
            type="submit"
            disabled={aiStatus === "loading"}
            className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
          >
            {aiStatus === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Generate with Zavis AI
              </>
            )}
          </button>
          <p className="font-['Geist',sans-serif] text-[11px] text-black/40">
            Free · 5 generations per IP per hour. Output is yours to print, edit or paste into your EMR.
          </p>
        </form>

        {aiError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-[13px] text-red-700">
            {aiError}
          </p>
        )}

        {aiResult && (
          <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] text-[#1c1c1c]">
                {aiResult.formName}
              </p>
              <p className="mt-1 font-['Geist',sans-serif] text-[14px] text-black/65">
                {aiResult.introTextEn}
              </p>
            </div>
            {aiResult.sections?.map((sec) => (
              <div key={sec.id} className="border-t border-black/[0.05] pt-4">
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#006828]">
                  {sec.titleEn} <span className="text-black/30">·</span> <span dir="rtl">{sec.titleAr}</span>
                </p>
                <ul className="mt-2 space-y-1.5 font-['Geist',sans-serif] text-[13px] text-black/70">
                  {sec.questions.map((q) => (
                    <li key={q.id} className="flex gap-2">
                      <span className="font-['Geist_Mono',monospace] text-[10px] text-black/40 mt-0.5 flex-shrink-0">{q.type}</span>
                      <span>
                        {q.labelEn} {q.required && <span className="text-red-500">*</span>}
                        <span className="text-black/40 mx-2">·</span>
                        <span dir="rtl">{q.labelAr}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {aiResult.consentBlocks?.length > 0 && (
              <div className="border-t border-black/[0.05] pt-4">
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#006828]">
                  Consent blocks
                </p>
                {aiResult.consentBlocks.map((c, i) => (
                  <div key={i} className="mt-2">
                    <p className="font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c]">{c.titleEn}</p>
                    <p className="mt-1 font-['Geist',sans-serif] text-[12px] text-black/55">{c.bodyEn}</p>
                  </div>
                ))}
              </div>
            )}
            {aiResult.tipsForClinic?.length > 0 && (
              <div className="rounded-xl bg-[#006828]/[0.04] px-4 py-3 mt-4">
                <p className="font-['Geist_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#006828]">
                  Tips for rolling this out
                </p>
                <ul className="mt-1 space-y-1 font-['Geist',sans-serif] text-[12px] text-[#1c1c1c]">
                  {aiResult.tipsForClinic.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(aiResult, null, 2))}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 font-['Geist',sans-serif] text-xs font-medium text-[#1c1c1c] hover:border-[#006828]/30"
            >
              Copy form as JSON
            </button>
            <AIDisclaimer context="intake form" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-black/[0.08]" />
        <span className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-black/40">
          Or build manually with the section picker
        </span>
        <span className="h-px flex-1 bg-black/[0.08]" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      {/* Builder */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 lg:max-h-[80vh] lg:overflow-y-auto">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight mb-4">
          Configure
        </h3>

        <div className="space-y-4">
          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Clinic name</span>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            />
          </label>

          <label className="block">
            <span className="font-['Geist',sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/55">Specialty</span>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty)}
              className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            >
              {(Object.keys(SPECIALTY_LABELS) as Specialty[]).map((s) => (
                <option key={s} value={s}>{SPECIALTY_LABELS[s].en}</option>
              ))}
            </select>
          </label>
        </div>

        <h4 className="mt-6 font-['Bricolage_Grotesque',sans-serif] font-medium text-[14px] text-[#1c1c1c] tracking-tight mb-2">
          Sections to include
        </h4>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <label key={s.id} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includedSections.has(s.id)}
                onChange={() => toggleSection(s.id)}
                className="mt-0.5 h-4 w-4 rounded border-black/20 accent-[#006828]"
              />
              <span className="flex-1">
                <span className="font-['Geist',sans-serif] text-sm text-[#1c1c1c]">{s.titleEn}</span>
                <span className="block font-['Geist',sans-serif] text-xs text-black/40">{s.titleAr} — {s.questions.length} question{s.questions.length === 1 ? "" : "s"}</span>
              </span>
            </label>
          ))}
        </div>

        <h4 className="mt-6 font-['Bricolage_Grotesque',sans-serif] font-medium text-[14px] text-[#1c1c1c] tracking-tight mb-2">
          Custom questions (optional, max 5)
        </h4>
        <div className="space-y-2">
          {customQuestions.map((q, i) => (
            <input
              key={i}
              type="text"
              value={q}
              onChange={(e) => {
                const next = [...customQuestions];
                next[i] = e.target.value;
                setCustomQuestions(next);
              }}
              placeholder={`Custom question ${i + 1} (English)`}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]"
            />
          ))}
          {customQuestions.length < 5 && (
            <button
              type="button"
              onClick={() => setCustomQuestions([...customQuestions, ""])}
              className="text-[#006828] text-xs font-medium hover:underline"
            >
              + Add another question
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadHtml}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220]"
          >
            <FileText className="h-3.5 w-3.5" />
            Download HTML (printable)
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c] hover:border-[#006828]/30"
          >
            <Download className="h-3.5 w-3.5" />
            Download JSON config
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 lg:max-h-[80vh] lg:overflow-y-auto">
        <h3 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[18px] text-[#1c1c1c] tracking-tight mb-4">
          Preview
        </h3>
        <PreviewForm
          clinicName={clinicName}
          specialty={specialty}
          sections={activeSections}
          customQuestions={customQuestions.filter((q) => q.trim())}
        />
      </div>

      {/* Email capture */}
      <div className="lg:col-span-2 rounded-2xl border border-black/[0.06] bg-[#f8f8f6] p-6">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-[#006828] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
          <div className="flex-1">
            <p className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c]">
              Want this hosted as a digital form your patients fill on their phones?
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/55">
              Zavis platform hosts intake digitally, syncs into your appointment system, and exports submissions to your EMR. Free for the first 100 submissions.
            </p>
            {emailStatus === "sent" ? (
              <p className="mt-3 font-['Geist',sans-serif] text-sm text-[#006828] font-medium inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Sent. We&apos;ll reach out within 24 hours.
              </p>
            ) : (
              <form onSubmit={submitEmail} className="mt-3 flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.ae"
                  required
                  className="flex-1 min-w-[180px] rounded-full border border-black/[0.08] bg-white px-4 py-2.5 font-['Geist',sans-serif] text-sm text-[#1c1c1c] placeholder:text-black/30 outline-none focus:border-[#006828]"
                />
                <button
                  type="submit"
                  disabled={emailStatus === "sending"}
                  className="rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220] disabled:opacity-60"
                >
                  {emailStatus === "sending" ? "Sending…" : "Get demo"}
                </button>
              </form>
            )}
            {emailStatus === "error" && (
              <p className="mt-2 font-['Geist',sans-serif] text-xs text-red-600">Could not submit. Try again.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function PreviewForm({
  clinicName,
  sections,
  customQuestions,
}: {
  clinicName: string;
  specialty: Specialty;
  sections: Section[];
  customQuestions: string[];
}) {
  return (
    <div className="text-[13px] space-y-4">
      <div className="text-center pb-4 border-b border-black/[0.06]">
        <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c]">{clinicName}</p>
        <p className="font-['Geist',sans-serif] text-xs text-black/40">Patient Intake Form / استمارة استقبال المريض</p>
      </div>
      {sections.map((s) => (
        <div key={s.id} className="border border-black/[0.06] rounded-lg p-3">
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] text-sm">
            {s.titleEn} <span className="font-normal text-black/40">/ {s.titleAr}</span>
          </p>
          <ul className="mt-2 space-y-1">
            {s.questions.slice(0, 5).map((q) => (
              <li key={q.id} className="font-['Geist',sans-serif] text-[12px] text-black/65">
                <span dir="ltr">• {q.labelEn}</span>
                <span className="block text-black/40 text-[11px]" dir="rtl">• {q.labelAr}</span>
              </li>
            ))}
            {s.questions.length > 5 && (
              <li className="font-['Geist',sans-serif] text-[11px] text-black/40">
                + {s.questions.length - 5} more questions
              </li>
            )}
          </ul>
        </div>
      ))}
      {customQuestions.length > 0 && (
        <div className="border border-black/[0.06] rounded-lg p-3">
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] text-sm">
            Additional / إضافي
          </p>
          <ul className="mt-2 space-y-1">
            {customQuestions.map((q, i) => (
              <li key={i} className="font-['Geist',sans-serif] text-[12px] text-black/65">• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function generateHtml(opts: {
  clinicName: string;
  specialty: Specialty;
  sections: Section[];
  customQuestions: string[];
}): string {
  const fieldHtml = (q: Section["questions"][number]): string => {
    const required = q.required ? "required" : "";
    if (q.type === "select") {
      return `<select name="${q.id}" ${required}>
        <option value="">--</option>
        ${(q.options || []).map((o) => `<option value="${o.value}">${o.en} / ${o.ar}</option>`).join("")}
      </select>`;
    }
    if (q.type === "checkbox") {
      return `<input type="checkbox" name="${q.id}" ${required} />`;
    }
    if (q.type === "textarea") {
      return `<textarea name="${q.id}" rows="3" ${required}></textarea>`;
    }
    return `<input type="${q.type}" name="${q.id}" placeholder="${q.placeholderEn || ""}" ${required} />`;
  };

  const sectionsHtml = opts.sections.map((s) => `
    <fieldset>
      <legend>${s.titleEn} <span class="ar">/ ${s.titleAr}</span></legend>
      ${s.questions.map((q) => `
        <div class="row">
          <label>
            <span class="en">${q.labelEn}${q.required ? " *" : ""}</span>
            <span class="ar" dir="rtl">${q.labelAr}${q.required ? " *" : ""}</span>
          </label>
          ${fieldHtml(q)}
        </div>
      `).join("")}
    </fieldset>
  `).join("");

  const customHtml = opts.customQuestions.length > 0 ? `
    <fieldset>
      <legend>Additional / إضافي</legend>
      ${opts.customQuestions.map((q, i) => `
        <div class="row">
          <label><span class="en">${q}</span></label>
          <input type="text" name="custom_${i}" />
        </div>
      `).join("")}
    </fieldset>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${opts.clinicName} — Patient Intake Form</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1c1c1c; }
  h1 { font-size: 24px; text-align: center; margin: 0 0 0.5rem; }
  .subtitle { text-align: center; color: #555; font-size: 13px; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #1c1c1c; }
  fieldset { border: 1px solid #00000011; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
  legend { font-weight: 600; padding: 0 0.5rem; font-size: 14px; }
  .ar { color: #666; font-weight: normal; font-size: 12px; }
  .row { margin: 0.75rem 0; }
  .row label { display: block; margin-bottom: 0.25rem; }
  .row .en { font-size: 13px; color: #1c1c1c; display: inline-block; margin-right: 1rem; }
  .row .ar { font-size: 12px; color: #666; }
  input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select, textarea { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #00000020; border-radius: 8px; font-family: inherit; font-size: 13px; box-sizing: border-box; }
  textarea { min-height: 60px; resize: vertical; }
  input[type="checkbox"] { margin-right: 0.5rem; }
  .signature { margin-top: 2rem; border-top: 1px solid #00000020; padding-top: 1rem; display: flex; justify-content: space-between; gap: 2rem; font-size: 12px; }
  .signature div { flex: 1; border-bottom: 1px solid #1c1c1c; padding-bottom: 0.25rem; min-height: 2rem; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 1rem; }
  @media print { body { margin: 0; padding: 0; } fieldset { page-break-inside: avoid; } }
</style>
</head>
<body>
  <h1>${opts.clinicName}</h1>
  <p class="subtitle">Patient Intake Form / استمارة استقبال المريض</p>
  <form>
    ${sectionsHtml}
    ${customHtml}
    <div class="signature">
      <div>Patient signature / توقيع المريض</div>
      <div>Date / التاريخ</div>
    </div>
  </form>
  <p class="footer">Generated by Zavis Free Tools · zavis.ai/tools/intake-form</p>
</body>
</html>`;
}
