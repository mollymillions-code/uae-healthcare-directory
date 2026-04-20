"use client";

import { useState, useCallback } from "react";

interface Provider {
  id: string;
  name: string;
  city: string;
  category: string;
  googleRating: number | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  short_description: string | null;
  insurance: string[];
  services: string[];
  languages: string[];
  google_review_count: number | null;
  operating_hours: Record<string, string> | null;
  is_claimed: boolean;
  is_verified: boolean;
}

function getAdminKey(): string {
  return sessionStorage.getItem("admin_key") || "";
}

function TagEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-[#006828]/10 text-[#006828] text-xs px-2 py-1 rounded-md font-['Geist',sans-serif]"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="hover:text-red-600 ml-0.5"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
        />
        <button
          type="button"
          onClick={add}
          className="bg-[#006828] text-white rounded-lg px-3 py-2 text-sm hover:bg-[#005520]"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function ProvidersAdminPage() {
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [reason, setReason] = useState("");

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const key = getAdminKey();
      const res = await fetch(`/api/admin/providers?q=${encodeURIComponent(query)}&key=${key}`);
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const key = getAdminKey();
      const res = await fetch(`/api/admin/providers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ ...editing, reason }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("success", "Provider updated successfully");
      setEditing(null);
      setReason("");
      await search();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Provider>(field: K, value: Provider[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-['Geist',sans-serif] shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold text-[#1c1c1c] mb-1">
          Providers
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Search and edit healthcare provider records
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search by name, city, or category..."
          className="flex-1 border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] focus:outline-none focus:ring-2 focus:ring-[#006828]/30"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-[#006828] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#005520] disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* Results table */}
      {providers.length > 0 && (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden bg-white">
          <table className="w-full font-['Geist',sans-serif] text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left px-4 py-3 font-medium text-black/60">Name</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">City</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Category</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/[0.03] hover:bg-[#f8f8f6]/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1c1c1c]">{p.name}</td>
                  <td className="px-4 py-3 text-black/60 capitalize">{p.city}</td>
                  <td className="px-4 py-3 text-black/60 capitalize">{p.category}</td>
                  <td className="px-4 py-3">
                    {p.googleRating ? (
                      <span className="inline-flex items-center gap-1 text-[#006828] font-medium">
                        {p.googleRating}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#006828" stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-black/30">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-black/60">{p.phone || "--"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setEditing({ ...p });
                        setReason("");
                      }}
                      className="text-[#006828] hover:underline text-sm font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && providers.length === 0 && query && (
        <div className="text-center py-16 text-black/40 font-['Geist',sans-serif] text-sm">
          No providers found for &quot;{query}&quot;
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#1c1c1c]">
                Edit Provider
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-black/40 hover:text-black/70 text-xl leading-none"
              >
                x
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Name
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>

              {/* Phone + Phone Secondary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editing.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Phone Secondary
                  </label>
                  <input
                    type="text"
                    value={editing.phone_secondary || ""}
                    onChange={(e) => updateField("phone_secondary", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
              </div>

              {/* Email + Website */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editing.email || ""}
                    onChange={(e) => updateField("email", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editing.website || ""}
                    onChange={(e) => updateField("website", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Address
                </label>
                <input
                  type="text"
                  value={editing.address || ""}
                  onChange={(e) => updateField("address", e.target.value || null)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Description
                </label>
                <textarea
                  value={editing.description || ""}
                  onChange={(e) => updateField("description", e.target.value || null)}
                  rows={3}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] resize-y"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Short Description
                </label>
                <textarea
                  value={editing.short_description || ""}
                  onChange={(e) => updateField("short_description", e.target.value || null)}
                  rows={2}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] resize-y"
                />
              </div>

              {/* Tags: Insurance, Services, Languages */}
              <TagEditor
                label="Insurance"
                values={editing.insurance || []}
                onChange={(v) => updateField("insurance", v)}
              />
              <TagEditor
                label="Services"
                values={editing.services || []}
                onChange={(v) => updateField("services", v)}
              />
              <TagEditor
                label="Languages"
                values={editing.languages || []}
                onChange={(v) => updateField("languages", v)}
              />

              {/* Rating + Review Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Google Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editing.googleRating ?? ""}
                    onChange={(e) =>
                      updateField("googleRating", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Google Review Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editing.google_review_count ?? ""}
                    onChange={(e) =>
                      updateField("google_review_count", e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
              </div>

              {/* Operating Hours (JSON editor) */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Operating Hours (JSON)
                </label>
                <textarea
                  value={
                    editing.operating_hours
                      ? JSON.stringify(editing.operating_hours, null, 2)
                      : ""
                  }
                  onChange={(e) => {
                    try {
                      const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                      updateField("operating_hours", parsed);
                    } catch {
                      // Allow typing invalid JSON while editing
                    }
                  }}
                  rows={4}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-mono resize-y"
                  placeholder='{"monday": "9:00 AM - 5:00 PM", ...}'
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.is_claimed}
                    onChange={(e) => updateField("is_claimed", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  Claimed
                </label>
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.is_verified}
                    onChange={(e) => updateField("is_verified", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  Verified
                </label>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Reason for Change
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this change being made?"
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-black/[0.06] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditing(null)}
                className="border border-black/[0.06] rounded-lg px-4 py-2 text-sm font-['Geist',sans-serif] text-black/60 hover:bg-[#f8f8f6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-[#006828] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#005520] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
