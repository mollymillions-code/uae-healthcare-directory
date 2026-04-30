"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, RefreshCw, X } from "lucide-react";

type EditRequest = {
  id: string;
  providerId: string;
  providerName: string;
  organizationName: string;
  requestedByName: string | null;
  requestedByEmail: string | null;
  status: string;
  payload: Record<string, unknown>;
  rejectionReason: string | null;
  createdAt: string;
};

function getAdminKey(): string {
  return sessionStorage.getItem("admin_key") || "";
}

export default function ProviderPortalAdminPage() {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inviteForm, setInviteForm] = useState({
    providerId: "",
    email: "",
    contactName: "",
    contactPhone: "",
    organizationName: "",
    role: "manager",
  });
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const key = getAdminKey();
      const res = await fetch(`/api/admin/provider-portal/edit-requests?status=${status}&key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("Could not load edit requests");
      const data = await res.json();
      setRequests(data.editRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load edit requests");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function reviewRequest(id: string, action: "approve" | "reject") {
    const rejectionReason =
      action === "reject" ? window.prompt("Reason for rejection?") || "" : "";
    if (action === "reject" && !rejectionReason.trim()) return;

    setActioningId(id);
    setError("");
    try {
      const key = getAdminKey();
      const res = await fetch(`/api/admin/provider-portal/edit-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-dashboard-key": key },
        body: JSON.stringify({ action, rejectionReason, reviewerName: "admin" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Review failed");
      }
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setActioningId(null);
    }
  }

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setInviteLoading(true);
    setInviteUrl("");
    setError("");
    try {
      const key = getAdminKey();
      const res = await fetch("/api/admin/provider-portal/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-key": key },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invite failed");
      setInviteUrl(data.invite.activationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviteLoading(false);
    }
  }

  function updateInvite(field: keyof typeof inviteForm, value: string) {
    setInviteForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold text-[#1c1c1c]">
            Provider Portal
          </h1>
          <p className="font-['Geist',sans-serif] text-sm text-black/40">
            Generate clinic-owner access and review submitted listing edits.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-black/60 hover:text-[#006828]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-['Geist',sans-serif] text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-black/[0.06] bg-white p-5">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
          Create clinic portal invite
        </h2>
        <form onSubmit={createInvite} className="mt-4 grid gap-3 lg:grid-cols-6">
          <input
            value={inviteForm.providerId}
            onChange={(event) => updateInvite("providerId", event.target.value)}
            placeholder="Provider ID"
            required
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm lg:col-span-2"
          />
          <input
            type="email"
            value={inviteForm.email}
            onChange={(event) => updateInvite("email", event.target.value)}
            placeholder="Owner email"
            required
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            value={inviteForm.role}
            onChange={(event) => updateInvite("role", event.target.value)}
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          >
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="doctor">Doctor</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviteLoading}
            className="rounded-lg bg-[#006828] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004d1c] disabled:opacity-60"
          >
            {inviteLoading ? "Creating..." : "Create"}
          </button>
          <input
            value={inviteForm.contactName}
            onChange={(event) => updateInvite("contactName", event.target.value)}
            placeholder="Contact name"
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm lg:col-span-2"
          />
          <input
            value={inviteForm.contactPhone}
            onChange={(event) => updateInvite("contactPhone", event.target.value)}
            placeholder="Contact phone"
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm lg:col-span-2"
          />
          <input
            value={inviteForm.organizationName}
            onChange={(event) => updateInvite("organizationName", event.target.value)}
            placeholder="Organization name override"
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm lg:col-span-2"
          />
        </form>
        {inviteUrl && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg bg-[#006828]/[0.04] p-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate text-xs text-[#006828]">{inviteUrl}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#006828]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-black/[0.06] bg-white">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-xl font-medium text-[#1c1c1c]">
              Listing edit requests
            </h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/40">
              Approving applies the submitted fields to the public provider profile.
            </p>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-black/40">Loading edit requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-black/40">No edit requests for this filter.</div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {requests.map((request) => (
              <article key={request.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] text-lg font-medium text-[#1c1c1c]">
                      {request.providerName}
                    </h3>
                    <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
                      {request.organizationName} · {request.requestedByName || request.requestedByEmail || "Clinic user"} · {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(request.payload || {}).map(([field, value]) => (
                        <div key={field} className="rounded-lg bg-[#f8f8f6] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/35">
                            {field}
                          </p>
                          <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-xs text-black/65">
                            {Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={actioningId === request.id}
                        onClick={() => reviewRequest(request.id, "approve")}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#006828] px-3 py-2 text-sm font-semibold text-white hover:bg-[#004d1c] disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actioningId === request.id}
                        onClick={() => reviewRequest(request.id, "reject")}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
