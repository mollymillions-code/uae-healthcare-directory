"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, Check, Trash2 } from "lucide-react";

interface Props {
  initialCvUrl: string | null;
  initialUploadedAt: Date | null;
}

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_MB = 10;

export function CvUpload({ initialCvUrl, initialUploadedAt }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(initialCvUrl);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(initialUploadedAt);
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`CV must be smaller than ${MAX_MB} MB.`);
      return;
    }

    const fd = new FormData();
    fd.append("cv", file);

    setBusy("upload");
    try {
      const res = await fetch("/api/jobs/profile/cv", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not upload your CV.");
      } else {
        setCvUrl(data.cvUrl);
        setUploadedAt(new Date());
        router.refresh();
      }
    } catch {
      setError("Could not upload your CV.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setError("");
    setBusy("delete");
    try {
      const res = await fetch("/api/jobs/profile/cv", { method: "DELETE" });
      if (res.ok) {
        setCvUrl(null);
        setUploadedAt(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not remove your CV.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            CV
          </p>
          <h2 className="mt-1 font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
            Your CV
          </h2>
        </div>
        {cvUrl && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#006828]/[0.08] px-3 py-1 font-['Geist_Mono',monospace] text-[11px] font-medium text-[#006828]">
            <Check className="h-3 w-3" strokeWidth={2.5} /> Uploaded
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700">
          {error}
        </p>
      )}

      {cvUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 font-['Geist',sans-serif] text-[13px] font-medium text-[#1c1c1c] hover:border-[#006828] hover:text-[#006828]"
          >
            <FileText className="h-4 w-4" strokeWidth={2.25} />
            View current CV
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {busy === "upload" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" strokeWidth={2.25} /> Replace CV
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] text-[13px] font-medium text-black/55 hover:text-red-600"
          >
            {busy === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            Remove
          </button>
          {uploadedAt && (
            <span className="font-['Geist',sans-serif] text-[12px] text-black/45">
              Uploaded {new Date(uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,104,40,0.45)] hover:bg-[#005220] disabled:opacity-60"
          >
            {busy === "upload" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} /> Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" strokeWidth={2.25} /> Upload your CV
              </>
            )}
          </button>
          <p className="mt-3 font-['Geist',sans-serif] text-[12px] text-black/55">
            PDF, DOC or DOCX · max {MAX_MB} MB · stored encrypted on Zavis storage. Most clinics expect a CV before they&apos;ll talk to you, so this is the highest-impact thing to add right after signup.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
