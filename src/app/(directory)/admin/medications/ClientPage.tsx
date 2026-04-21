"use client";

import { useState, useCallback } from "react";

interface Medication {
  id: string;
  generic_name: string;
  class_slug: string;
  rx_status: "prescription" | "otc" | "controlled";
  description: string | null;
  short_description: string | null;
  common_conditions: string[];
  common_specialties: string[];
  lab_monitoring_notes: string[];
  is_high_intent: boolean;
  is_prescription_required: boolean;
  requires_monitoring_labs: boolean;
}

function getAdminKey(): string {
  return sessionStorage.getItem("admin_key") || "";
}

function MedTagEditor({
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
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-['Geist',sans-serif]"
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

export default function MedicationsAdminPage() {
  const [query, setQuery] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Medication | null>(null);
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
      const res = await fetch(`/api/admin/medications?q=${encodeURIComponent(query)}&key=${key}`);
      if (!res.ok) throw new Error("Failed to fetch medications");
      const data = await res.json();
      setMedications(data.medications || []);
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
      const res = await fetch(`/api/admin/medications/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-dashboard-key": key },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("success", "Medication updated successfully");
      setEditing(null);
      await search();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Medication>(field: K, value: Medication[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const rxLabel = (status: string) => {
    switch (status) {
      case "prescription": return "Rx";
      case "otc": return "OTC";
      case "controlled": return "Ctrl";
      default: return status;
    }
  };

  const rxColor = (status: string) => {
    switch (status) {
      case "prescription": return "bg-amber-50 text-amber-700";
      case "otc": return "bg-green-50 text-green-700";
      case "controlled": return "bg-red-50 text-red-700";
      default: return "bg-gray-50 text-gray-600";
    }
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
          Medications
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Search and edit medication records
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search by generic name or class..."
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
      {medications.length > 0 && (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden bg-white">
          <table className="w-full font-['Geist',sans-serif] text-sm">
            <thead>
              <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                <th className="text-left px-4 py-3 font-medium text-black/60">Generic Name</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Class</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Rx Status</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">High Intent</th>
                <th className="text-left px-4 py-3 font-medium text-black/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-black/[0.03] hover:bg-[#f8f8f6]/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1c1c1c]">{m.generic_name}</td>
                  <td className="px-4 py-3 text-black/60">{m.class_slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rxColor(m.rx_status)}`}>
                      {rxLabel(m.rx_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.is_high_intent ? (
                      <span className="text-[#006828] font-medium">Yes</span>
                    ) : (
                      <span className="text-black/30">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing({ ...m })}
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

      {!loading && medications.length === 0 && query && (
        <div className="text-center py-16 text-black/40 font-['Geist',sans-serif] text-sm">
          No medications found for &quot;{query}&quot;
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-semibold text-[#1c1c1c]">
                Edit Medication
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
              {/* Generic Name */}
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                  Generic Name
                </label>
                <input
                  type="text"
                  value={editing.generic_name}
                  onChange={(e) => updateField("generic_name", e.target.value)}
                  className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                />
              </div>

              {/* Class Slug + Rx Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Class Slug
                  </label>
                  <input
                    type="text"
                    value={editing.class_slug}
                    onChange={(e) => updateField("class_slug", e.target.value)}
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1 font-['Geist',sans-serif]">
                    Rx Status
                  </label>
                  <select
                    value={editing.rx_status}
                    onChange={(e) =>
                      updateField("rx_status", e.target.value as Medication["rx_status"])
                    }
                    className="w-full border border-black/[0.06] rounded-lg px-3 py-2 text-sm font-['Geist',sans-serif] bg-white"
                  >
                    <option value="prescription">Prescription</option>
                    <option value="otc">OTC</option>
                    <option value="controlled">Controlled</option>
                  </select>
                </div>
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

              {/* Tag editors */}
              <MedTagEditor
                label="Common Conditions"
                values={editing.common_conditions || []}
                onChange={(v) => updateField("common_conditions", v)}
              />
              <MedTagEditor
                label="Common Specialties"
                values={editing.common_specialties || []}
                onChange={(v) => updateField("common_specialties", v)}
              />
              <MedTagEditor
                label="Lab Monitoring Notes"
                values={editing.lab_monitoring_notes || []}
                onChange={(v) => updateField("lab_monitoring_notes", v)}
              />

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.is_high_intent}
                    onChange={(e) => updateField("is_high_intent", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  High Intent
                </label>
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.is_prescription_required}
                    onChange={(e) => updateField("is_prescription_required", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  Prescription Required
                </label>
                <label className="flex items-center gap-2 text-sm font-['Geist',sans-serif] text-[#1c1c1c]">
                  <input
                    type="checkbox"
                    checked={editing.requires_monitoring_labs}
                    onChange={(e) => updateField("requires_monitoring_labs", e.target.checked)}
                    className="rounded border-black/[0.06] text-[#006828] focus:ring-[#006828]"
                  />
                  Requires Monitoring Labs
                </label>
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
