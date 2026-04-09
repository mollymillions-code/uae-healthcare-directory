"use client";

import { useState, useEffect, useCallback } from "react";

interface Claim {
  id: string;
  providerId: string;
  providerName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string | null;
  proofType: string | null;
  proofDocumentUrl: string | null;
  requestedChanges: Record<string, string> | null;
  notes: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  approved: { bg: "#D1FAE5", text: "#065F46", label: "Approved" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
};

const PROOF_LABELS: Record<string, string> = {
  license: "DHA/DOH/MOH License",
  business_card: "Business Card",
  letter: "Official Letterhead",
  other: "Other",
};

export default function ClaimsAdminPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchClaims = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/claims", {
        headers: { "x-api-key": key },
      });
      if (!res.ok) throw new Error("Unauthorized or failed to fetch");
      const data = await res.json();
      setClaims(data.claims || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_key", key);
    } catch {
      setError("Invalid key or failed to load claims");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_key");
    if (stored) {
      setAdminKey(stored);
      fetchClaims(stored);
    } else {
      setLoading(false);
    }
  }, [fetchClaims]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClaims(adminKey);
  };

  const handleAction = async (claimId: string, action: "approve" | "reject") => {
    const key = sessionStorage.getItem("admin_key") || adminKey;
    setActionLoading(claimId);
    try {
      const res = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({
          claimId,
          action,
          rejectionReason: action === "reject" ? rejectReason : undefined,
          reviewerName: "Admin",
        }),
      });
      if (!res.ok) throw new Error("Action failed");
      setRejectingId(null);
      setRejectReason("");
      await fetchClaims(key);
    } catch {
      setError("Failed to process action");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = claims.filter((c) => filter === "all" || c.status === filter);
  const counts = {
    all: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  };

  // ── Auth screen ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f8f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", borderRadius: 16, padding: 40, border: "1px solid #e5e5e5", maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, background: "#006828", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 600, color: "#1c1c1c", marginBottom: 8 }}>
            Claims Admin
          </h1>
          <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>Enter the dashboard key to continue</p>
          {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16, background: "#FEE2E2", padding: "8px 12px", borderRadius: 8 }}>{error}</p>}
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Dashboard Key"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "#006828", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
          >
            {loading ? "Checking..." : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  // ── Main dashboard ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#006828", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, fontWeight: 600, color: "#1c1c1c" }}>
            Claim Requests
          </h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("admin_key"); setIsAuthenticated(false); }}
          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, color: "#666", cursor: "pointer" }}
        >
          Log Out
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {(["all", "pending", "approved", "rejected"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                border: filter === key ? "2px solid #006828" : "1px solid #e5e5e5",
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: "#1c1c1c", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {counts[key]}
              </div>
              <div style={{ fontSize: 13, color: "#999", textTransform: "capitalize", marginTop: 2 }}>
                {key === "all" ? "Total" : key}
              </div>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 16px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Claims list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading claims...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p style={{ color: "#999", fontSize: 15 }}>
              {filter === "all" ? "No claim requests yet" : `No ${filter} claims`}
            </p>
            <p style={{ color: "#ccc", fontSize: 13, marginTop: 4 }}>
              Claims will appear here when providers submit ownership requests
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((claim) => {
              const expanded = expandedId === claim.id;
              const style = STATUS_STYLES[claim.status] || STATUS_STYLES.pending;
              const isActioning = actionLoading === claim.id;
              const isRejecting = rejectingId === claim.id;

              return (
                <div
                  key={claim.id}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid #e5e5e5",
                    overflow: "hidden",
                    transition: "box-shadow 0.15s",
                    boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {/* Row summary */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : claim.id)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "1fr 180px 140px 100px 32px",
                      alignItems: "center",
                      gap: 12,
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1c1c1c" }}>
                        {claim.providerName || claim.providerId}
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        by {claim.contactName} &middot; {claim.contactEmail}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {claim.proofType ? PROOF_LABELS[claim.proofType] || claim.proofType : "No proof"}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {new Date(claim.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: style.bg,
                          color: style.text,
                        }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div style={{ color: "#ccc", fontSize: 18, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                      &#9662;
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{ borderTop: "1px solid #f0f0f0", padding: "20px 20px 24px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                        {/* Contact */}
                        <div>
                          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Contact</h4>
                          <div style={{ fontSize: 14, color: "#1c1c1c", lineHeight: 1.8 }}>
                            <div><strong>{claim.contactName}</strong></div>
                            <div>{claim.contactEmail}</div>
                            <div>{claim.contactPhone}</div>
                            {claim.jobTitle && <div style={{ color: "#666" }}>{claim.jobTitle}</div>}
                          </div>
                        </div>

                        {/* Proof */}
                        <div>
                          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Proof of Ownership</h4>
                          <div style={{ fontSize: 14, color: "#1c1c1c" }}>
                            <div>{claim.proofType ? PROOF_LABELS[claim.proofType] || claim.proofType : "Not specified"}</div>
                            {claim.proofDocumentUrl ? (
                              <a
                                href={claim.proofDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#006828", textDecoration: "underline", fontSize: 13, marginTop: 4, display: "inline-block" }}
                              >
                                View Document
                              </a>
                            ) : (
                              <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>No document uploaded</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Requested changes */}
                      {claim.requestedChanges && Object.keys(claim.requestedChanges).length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Requested Changes</h4>
                          <div style={{ background: "#f8f8f6", borderRadius: 10, padding: 14 }}>
                            {Object.entries(claim.requestedChanges).map(([k, v]) => (
                              <div key={k} style={{ fontSize: 13, marginBottom: 6 }}>
                                <span style={{ color: "#999", textTransform: "capitalize" }}>{k}:</span>{" "}
                                <span style={{ color: "#1c1c1c" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {claim.notes && (
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Notes</h4>
                          <p style={{ fontSize: 13, color: "#666", background: "#f8f8f6", borderRadius: 10, padding: 14, lineHeight: 1.6 }}>
                            {claim.notes}
                          </p>
                        </div>
                      )}

                      {/* Review info (if already reviewed) */}
                      {claim.reviewedBy && (
                        <div style={{ marginBottom: 20, padding: "10px 14px", background: claim.status === "approved" ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, fontSize: 13 }}>
                          <strong>{claim.status === "approved" ? "Approved" : "Rejected"}</strong> by {claim.reviewedBy}
                          {claim.reviewedAt && <> on {new Date(claim.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>}
                          {claim.rejectionReason && <div style={{ marginTop: 4, color: "#991B1B" }}>Reason: {claim.rejectionReason}</div>}
                        </div>
                      )}

                      {/* Actions (only for pending) */}
                      {claim.status === "pending" && (
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleAction(claim.id, "approve")}
                            disabled={isActioning}
                            style={{
                              padding: "8px 20px",
                              borderRadius: 8,
                              background: "#006828",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 13,
                              border: "none",
                              cursor: isActioning ? "wait" : "pointer",
                              opacity: isActioning ? 0.6 : 1,
                            }}
                          >
                            {isActioning ? "Processing..." : "Approve & Mark Claimed"}
                          </button>

                          {!isRejecting ? (
                            <button
                              onClick={() => setRejectingId(claim.id)}
                              disabled={isActioning}
                              style={{
                                padding: "8px 20px",
                                borderRadius: 8,
                                background: "#fff",
                                color: "#dc2626",
                                fontWeight: 600,
                                fontSize: 13,
                                border: "1px solid #fca5a5",
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                              <input
                                type="text"
                                placeholder="Reason for rejection (optional)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 13, minWidth: 200 }}
                              />
                              <button
                                onClick={() => handleAction(claim.id, "reject")}
                                disabled={isActioning}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: 8,
                                  background: "#dc2626",
                                  color: "#fff",
                                  fontWeight: 600,
                                  fontSize: 13,
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: "pointer", color: "#666" }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
