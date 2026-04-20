"use client";

import { useState, useEffect } from "react";

interface ChangeLogEntry {
  id: string;
  date: string;
  entity_type: "provider" | "medication" | "professional";
  entity_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  reason: string | null;
}

function getAdminKey(): string {
  return sessionStorage.getItem("admin_key") || "";
}

const ENTITY_COLORS: Record<string, { bg: string; text: string }> = {
  provider: { bg: "bg-green-50", text: "text-green-700" },
  medication: { bg: "bg-blue-50", text: "text-blue-700" },
  professional: { bg: "bg-purple-50", text: "text-purple-700" },
};

export default function ChangeLogAdminPage() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = getAdminKey();
    fetch(`/api/admin/changelog?limit=100&key=${key}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load change log");
        return res.json();
      })
      .then((data) => setEntries(data.entries || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold text-[#1c1c1c] mb-1">
          Change Log
        </h1>
        <p className="font-['Geist',sans-serif] text-sm text-black/40">
          Audit trail of all admin edits, newest first
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-[#006828]/30 border-t-[#006828] rounded-full animate-spin mx-auto mb-3" />
          <p className="font-['Geist',sans-serif] text-sm text-black/40">Loading change log...</p>
        </div>
      )}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full font-['Geist',sans-serif] text-sm">
              <thead>
                <tr className="bg-[#f8f8f6] border-b border-black/[0.06]">
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Entity Type</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Entity Name</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Field</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Old Value</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">New Value</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Changed By</th>
                  <th className="text-left px-4 py-3 font-medium text-black/60 whitespace-nowrap">Reason</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const colors = ENTITY_COLORS[entry.entity_type] || {
                    bg: "bg-gray-50",
                    text: "text-gray-600",
                  };
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-black/[0.03] hover:bg-[#f8f8f6]/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-black/60 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <div className="text-xs text-black/30 mt-0.5">
                          {new Date(entry.date).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colors.bg} ${colors.text}`}
                        >
                          {entry.entity_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1c1c1c] max-w-[200px] truncate">
                        {entry.entity_name}
                      </td>
                      <td className="px-4 py-3 text-black/60 font-mono text-xs">
                        {entry.field}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {entry.old_value ? (
                          <span className="text-red-600/70 text-xs bg-red-50 px-2 py-1 rounded inline-block max-w-full truncate">
                            {entry.old_value}
                          </span>
                        ) : (
                          <span className="text-black/20 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {entry.new_value ? (
                          <span className="text-green-700/70 text-xs bg-green-50 px-2 py-1 rounded inline-block max-w-full truncate">
                            {entry.new_value}
                          </span>
                        ) : (
                          <span className="text-black/20 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-black/60 whitespace-nowrap">
                        {entry.changed_by}
                      </td>
                      <td className="px-4 py-3 text-black/50 text-xs max-w-[200px] truncate">
                        {entry.reason || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-xl border border-black/[0.06]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ccc"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4"
          >
            <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            No changes recorded yet
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/25 mt-1">
            Edits made through the admin panel will appear here
          </p>
        </div>
      )}
    </div>
  );
}
