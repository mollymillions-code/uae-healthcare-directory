"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LeadStatus =
  | "pending"
  | "contacted"
  | "verified"
  | "portal_invited"
  | "completed"
  | "rejected";

interface OwnerLead {
  id: string;
  consumerEventId: string | null;
  providerId: string | null;
  providerName: string | null;
  action: "claim" | "edit" | "get_listed" | string;
  surface: string;
  entityType: string;
  entitySlug: string | null;
  entityName: string | null;
  pageUrl: string | null;
  ctaLabel: string | null;
  ownerRole: string | null;
  anonymousId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  metadata: Record<string, unknown>;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "verified", label: "Verified" },
  { value: "portal_invited", label: "Portal invited" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const ACTION_LABELS: Record<string, string> = {
  claim: "Claim listing",
  edit: "Edit listing",
  get_listed: "Get listed",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  contacted: "bg-blue-50 text-blue-800 border-blue-200",
  verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
  portal_invited: "bg-purple-50 text-purple-800 border-purple-200",
  completed: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<OwnerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState<LeadStatus | "all">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/owner-leads", {
        headers: { "x-dashboard-key": key },
      });
      if (!response.ok) throw new Error("Unauthorized or failed to fetch owner leads");
      const data = await response.json();
      setLeads(data.leads || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_key", key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch owner leads");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
      fetchLeads(storedKey);
    } else {
      setLoading(false);
    }
  }, [fetchLeads]);

  const filteredLeads = useMemo(
    () => leads.filter((lead) => filter === "all" || lead.status === filter),
    [filter, leads]
  );

  const counts = useMemo(() => {
    return {
      all: leads.length,
      pending: leads.filter((lead) => lead.status === "pending").length,
      contacted: leads.filter((lead) => lead.status === "contacted").length,
      verified: leads.filter((lead) => lead.status === "verified").length,
      portal_invited: leads.filter((lead) => lead.status === "portal_invited").length,
      completed: leads.filter((lead) => lead.status === "completed").length,
      rejected: leads.filter((lead) => lead.status === "rejected").length,
    };
  }, [leads]);

  const contactComplete = leads.filter(
    (lead) => lead.contactEmail || lead.contactPhone
  ).length;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!adminKey.trim()) return;
    await fetchLeads(adminKey.trim());
  }

  async function updateStatus(leadId: string, status: LeadStatus) {
    const key = sessionStorage.getItem("admin_key") || adminKey;
    try {
      setUpdatingId(leadId);
      setError(null);
      const response = await fetch("/api/admin/owner-leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-key": key,
        },
        body: JSON.stringify({ leadId, status }),
      });
      if (!response.ok) throw new Error("Failed to update lead status");
      await fetchLeads(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead status");
    } finally {
      setUpdatingId(null);
    }
  }

  function downloadCsv() {
    const headers = [
      "Created",
      "Status",
      "Action",
      "Clinic",
      "Contact name",
      "Email",
      "Phone",
      "Role",
      "Surface",
      "Page URL",
    ];
    const rows = filteredLeads.map((lead) => [
      lead.createdAt,
      lead.status,
      ACTION_LABELS[lead.action] || lead.action,
      lead.providerName || lead.entityName || "",
      lead.contactName || "",
      lead.contactEmail || "",
      lead.contactPhone || "",
      lead.ownerRole || "",
      lead.surface,
      lead.pageUrl || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zavis-owner-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm"
        >
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold text-[#1c1c1c]">
            Owner Leads
          </h1>
          <p className="mt-2 font-['Geist',sans-serif] text-sm text-black/45">
            Enter the dashboard key to view clinic owner lead requests.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Dashboard key"
            className="mt-6 w-full rounded-xl border border-black/[0.08] px-4 py-3 font-['Geist',sans-serif] text-sm outline-none focus:border-[#006828]/40 focus:ring-2 focus:ring-[#006828]/10"
            required
          />
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-['Geist',sans-serif] text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-[#006828] px-4 py-3 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#004d1c]"
          >
            Access leads
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-['Geist',sans-serif] text-xs font-bold uppercase tracking-[0.16em] text-[#006828]">
              Conversion operations
            </p>
            <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-4xl font-semibold tracking-tight text-[#1c1c1c]">
              Owner Leads
            </h1>
            <p className="mt-2 font-['Geist',sans-serif] text-sm text-black/50">
              Follow up clinic owners, managers, doctors, and agencies who ask to claim,
              edit, or list a profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchLeads(sessionStorage.getItem("admin_key") || adminKey)}
              className="rounded-full border border-black/[0.10] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:border-[#006828]/30 hover:text-[#006828]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={filteredLeads.length === 0}
              className="rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#004d1c] disabled:cursor-not-allowed disabled:bg-black/20"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wide text-black/40">
              Total leads
            </p>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#1c1c1c]">
              {counts.all}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wide text-black/40">
              Pending
            </p>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-amber-700">
              {counts.pending}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wide text-black/40">
              Contact captured
            </p>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#006828]">
              {contactComplete}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-wide text-black/40">
              Completed
            </p>
            <p className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#006828]">
              {counts.completed}
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["all", ...STATUS_OPTIONS.map((status) => status.value)] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1.5 font-['Geist',sans-serif] text-xs font-semibold ${
                filter === value
                  ? "border-[#006828] bg-[#006828] text-white"
                  : "border-black/[0.08] bg-white text-black/55 hover:border-[#006828]/30 hover:text-[#006828]"
              }`}
            >
              {value === "all"
                ? `All (${counts.all})`
                : `${STATUS_OPTIONS.find((status) => status.value === value)?.label} (${counts[value]})`}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 font-['Geist',sans-serif] text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006828]/20 border-t-[#006828]" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center font-['Geist',sans-serif] text-sm text-black/45">
              No owner leads match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] divide-y divide-black/[0.06]">
                <thead className="bg-[#f8f8f6]">
                  <tr>
                    <th className="px-4 py-3 text-left font-['Geist',sans-serif] text-xs font-bold uppercase tracking-wide text-black/45">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-left font-['Geist',sans-serif] text-xs font-bold uppercase tracking-wide text-black/45">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-['Geist',sans-serif] text-xs font-bold uppercase tracking-wide text-black/45">
                      Context
                    </th>
                    <th className="px-4 py-3 text-left font-['Geist',sans-serif] text-xs font-bold uppercase tracking-wide text-black/45">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-['Geist',sans-serif] text-xs font-bold uppercase tracking-wide text-black/45">
                      Page
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredLeads.map((lead) => {
                    const statusStyle =
                      STATUS_STYLES[lead.status] || "bg-black/[0.04] text-black/60 border-black/[0.08]";
                    return (
                      <tr key={lead.id} className="align-top hover:bg-[#f8f8f6]/60">
                        <td className="px-4 py-4 font-['Geist',sans-serif] text-sm">
                          <p className="font-semibold text-[#1c1c1c]">
                            {ACTION_LABELS[lead.action] || lead.action}
                          </p>
                          <p className="mt-1 text-xs text-black/45">{formatDate(lead.createdAt)}</p>
                          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
                            {STATUS_OPTIONS.find((status) => status.value === lead.status)?.label || lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-['Geist',sans-serif] text-sm">
                          <p className="font-semibold text-[#1c1c1c]">
                            {lead.contactName || "No name"}
                          </p>
                          {lead.contactEmail ? (
                            <a href={`mailto:${lead.contactEmail}`} className="mt-1 block text-[#006828] hover:underline">
                              {lead.contactEmail}
                            </a>
                          ) : null}
                          {lead.contactPhone ? (
                            <a href={`tel:${lead.contactPhone}`} className="mt-1 block text-[#006828] hover:underline">
                              {lead.contactPhone}
                            </a>
                          ) : null}
                          {!lead.contactEmail && !lead.contactPhone ? (
                            <p className="mt-1 text-xs text-red-600">No contact captured</p>
                          ) : null}
                          <p className="mt-2 text-xs text-black/45">
                            Role: {lead.ownerRole || "Unknown"}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-['Geist',sans-serif] text-sm">
                          <p className="max-w-[320px] font-semibold text-[#1c1c1c]">
                            {lead.providerName || lead.entityName || "Unknown clinic/listing"}
                          </p>
                          <p className="mt-1 text-xs text-black/45">
                            Surface: {lead.surface}
                          </p>
                          {lead.providerId ? (
                            <p className="mt-1 text-xs text-black/35">ID: {lead.providerId}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={lead.status}
                            disabled={updatingId === lead.id}
                            onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                            className="rounded-xl border border-black/[0.10] bg-white px-3 py-2 font-['Geist',sans-serif] text-sm text-[#1c1c1c] outline-none focus:border-[#006828]/40 focus:ring-2 focus:ring-[#006828]/10 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 font-['Geist',sans-serif] text-sm">
                          {lead.pageUrl ? (
                            <a
                              href={lead.pageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full border border-black/[0.10] px-3 py-1.5 text-xs font-semibold text-[#006828] hover:border-[#006828]/40"
                            >
                              Open page
                            </a>
                          ) : (
                            <span className="text-xs text-black/35">No page URL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
