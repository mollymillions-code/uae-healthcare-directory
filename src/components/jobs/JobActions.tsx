"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck, Send, Loader2, Check } from "lucide-react";

interface Props {
  jobId: string;
  initiallySaved: boolean;
  initiallyApplied: boolean;
  hasCv: boolean;
  candidateUserType: "candidate" | "consumer" | "clinic" | null;
}

export function JobActions({
  jobId,
  initiallySaved,
  initiallyApplied,
  hasCv,
  candidateUserType,
}: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [saved, setSaved] = useState(initiallySaved);
  const [applied, setApplied] = useState(initiallyApplied);
  const [busy, setBusy] = useState<"save" | "apply" | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [error, setError] = useState("");

  const isCandidate = candidateUserType === "candidate" && status === "authenticated";

  async function toggleSave() {
    if (!isCandidate) {
      router.push(`/jobs/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=save`);
      return;
    }
    setBusy("save");
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, {
        method: saved ? "DELETE" : "POST",
      });
      if (res.ok) setSaved(!saved);
      else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Could not update saved state.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function submitApply() {
    setBusy("apply");
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverNoteMd: coverNote }),
      });
      if (res.ok) {
        setApplied(true);
        setShowApply(false);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Could not submit your application.");
      }
    } finally {
      setBusy(null);
    }
  }

  function startApply() {
    if (!isCandidate) {
      router.push(`/jobs/login?redirect=${encodeURIComponent(window.location.pathname)}&intent=apply`);
      return;
    }
    setShowApply(true);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startApply}
          disabled={applied || busy === "apply"}
          className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] transition-all hover:bg-[#005220] disabled:cursor-default disabled:opacity-90"
        >
          {applied ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.5} /> Application sent
            </>
          ) : busy === "apply" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={2.25} /> Apply now
            </>
          )}
        </button>
        <button
          type="button"
          onClick={toggleSave}
          disabled={busy === "save"}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 font-['Geist',sans-serif] text-[14px] font-medium text-[#1c1c1c] transition-colors hover:border-[#006828] hover:text-[#006828]"
        >
          {saved ? (
            <>
              <BookmarkCheck className="h-4 w-4 text-[#006828]" strokeWidth={2.25} /> Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" strokeWidth={2.25} /> Save
            </>
          )}
        </button>
      </div>

      {showApply && !applied && (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
          <p className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
            Send a short message with your application
          </p>
          {!hasCv && (
            <p className="mt-2 font-['Geist',sans-serif] text-[12px] text-amber-700">
              You haven&apos;t uploaded a CV yet. The clinic can still see your profile, but most clinics expect a CV. You can add one from your profile after applying.
            </p>
          )}
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="A short note to the hiring team — your motivation, availability, anything they should know."
            maxLength={2000}
            rows={5}
            className="mt-3 w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 font-['Geist',sans-serif] text-[14px] text-[#1c1c1c] outline-none focus:border-[#006828] focus:ring-2 focus:ring-[#006828]/15"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submitApply}
              disabled={busy === "apply"}
              className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-[13px] font-semibold text-white"
            >
              {busy === "apply" ? "Sending…" : "Send application"}
            </button>
            <button
              type="button"
              onClick={() => setShowApply(false)}
              className="font-['Geist',sans-serif] text-[13px] text-black/55 hover:text-[#1c1c1c]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isCandidate && (
        <p className="font-['Geist',sans-serif] text-[12px] text-black/45">
          Apply or save jobs by{" "}
          <a href="/jobs/signup" className="font-medium text-[#006828] underline-offset-2 hover:underline">
            creating a free profile
          </a>
          .
        </p>
      )}
    </div>
  );
}
