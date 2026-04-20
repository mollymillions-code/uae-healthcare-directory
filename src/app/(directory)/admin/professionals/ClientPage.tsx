"use client";

import { useState, useCallback } from "react";

interface Professional {
  id: string;
  name: string;
  education: string | null;
  education_description: string | null;
  primary_facility_name: string | null;
  specialty: string | null;
  license_type: string | null;
  photo_url: string | null;
  photo_consent: boolean;
  status: "active" | "inactive";
}

function getAdminKey(): string {
  return sessionStorage.getItem("admin_key") || "";
}

export default function ProfessionalsAdminPage() {
  const [query, setQuery] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      const res = await fetch(`/api/admin/professionals?q=${encodeURIComponent(query)}&key=${key}`);
      if (!res.ok) throw new Error("Failed to fetch professionals");
      const data = await res.json();
      setProfessionals(data.professionals || []);
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
      const res = await fetch(`/api/admin/professionals/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("success", "Professional updated successfully");
      setEditing(null);
      await search();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Professional>(field: K, value: Professional[K]) => {
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
          Professionals
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Search and edit healthcare professional records
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search by name, specialty, or facility..."
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
      {professionals.length > 0 && (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden bg-white">
          <table className="w-full font-['Geist',sans-serif] text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left px-4 py-3 font-medium text-black/60">Name</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Specialty</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Facility</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">License Type</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Photo</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/[0.03] hover:bg-[#f8f8f6]/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1c1c1c]">{p.name}</td>
                  <td className="px-4 py-3 text-black/60">{p.specialty || "--"}</td>
                  <td className="px-4 py-3 text-black/60">{p.primary_facility_name || "--"}</td>
                  <td className="px-4 py-3 text-black/60">{p.license_type || "--"}</td>
                  <td className="px-4 py-3">
                    {p.photo_url ? (
                      <div className="w-8 h-8 rounded-full bg-[#f8f8f6] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.photo_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#f8f8f6] flex items-center justify-center text-black/30 text-xs">
                        --
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing({ ...p })}
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

      {!loading && professionals.length === 0 && query && (
        <div className="text-center py-16 text-black/40 font-['Geist',sans-serif] text-sm">
          No professionals found for &quot;{query}&quot;
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#1c1c1c]">
                Edit Professional
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

              {/* Education + Education Description */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Education
                </label>
                <input
                  type="text"
                  value={editing.education || ""}
                  onChange={(e) => updateField("education", e.target.value || null)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Education Description
                </label>
                <textarea
                  value={editing.education_description || ""}
                  onChange={(e) => updateField("education_description", e.target.value || null)}
                  rows={2}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] resize-y"
                />
              </div>

              {/* Facility + Specialty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Primary Facility Name
                  </label>
                  <input
                    type="text"
                    value={editing.primary_facility_name || ""}
                    onChange={(e) => updateField("primary_facility_name", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={editing.specialty || ""}
                    onChange={(e) => updateField("specialty", e.target.value || null)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
              </div>

              {/* License Type */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  License Type
                </label>
                <input
                  type="text"
                  value={editing.license_type || ""}
                  onChange={(e) => updateField("license_type", e.target.value || null)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={editing.photo_url || ""}
                  onChange={(e) => updateField("photo_url", e.target.value || null)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
                {editing.photo_url && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.photo_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border border-black/[0.06]"
                    />
                  </div>
                )}
              </div>

              {/* Photo Consent + Status */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.photo_consent}
                    onChange={(e) => updateField("photo_consent", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  Photo Consent
                </label>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Status
                  </label>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      updateField("status", e.target.value as Professional["status"])
                    }
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
