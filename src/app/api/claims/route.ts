import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimRequests, providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getR2Client() {
  if (
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_ENDPOINT
  ) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function uploadProofToR2(
  file: File,
  claimId: string
): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2 || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
    console.warn("[claims] R2 not configured — skipping file upload");
    return null;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const key = `claims/${claimId}/proof.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
  return `${publicUrl}/${key}`;
}

async function sendNotification(claim: {
  id: string;
  providerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string | null;
  proofType: string | null;
  proofDocumentUrl: string | null;
  requestedChanges: Record<string, string> | null;
  notes: string | null;
}) {
  // HTML-escape all user-supplied fields before interpolating into the email body.
  // Without this, a malicious claim submission can inject <script> or phishing
  // links into internal notification emails sent to the team.
  const esc = (s: string | null | undefined): string => {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // Validate proofDocumentUrl is a safe URL (http/https only) before using as href
  const safeProofUrl = claim.proofDocumentUrl && /^https?:\/\//.test(claim.proofDocumentUrl)
    ? esc(claim.proofDocumentUrl)
    : null;

  const changesHtml = claim.requestedChanges
    ? Object.entries(claim.requestedChanges)
        .filter(([, v]) => v)
        .map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`)
        .join("")
    : "<li>No specific changes requested</li>";

  const emailBody = `
    <h2>New Listing Claim Request</h2>
    <p><strong>Facility:</strong> ${esc(claim.providerName)}</p>
    <p><strong>Claim ID:</strong> ${esc(claim.id)}</p>
    <hr>
    <h3>Contact Information</h3>
    <p><strong>Name:</strong> ${esc(claim.contactName)}</p>
    <p><strong>Email:</strong> ${esc(claim.contactEmail)}</p>
    <p><strong>Phone:</strong> ${esc(claim.contactPhone)}</p>
    <p><strong>Job Title:</strong> ${esc(claim.jobTitle) || "Not provided"}</p>
    <hr>
    <h3>Proof of Ownership</h3>
    <p><strong>Type:</strong> ${esc(claim.proofType) || "Not specified"}</p>
    ${safeProofUrl ? `<p><a href="${safeProofUrl}">View uploaded document</a></p>` : "<p>No document uploaded</p>"}
    <hr>
    <h3>Requested Changes</h3>
    <ul>${changesHtml}</ul>
    ${claim.notes ? `<h3>Notes</h3><p>${esc(claim.notes)}</p>` : ""}
    <hr>
    <p style="color: #666; font-size: 12px;">Review this claim at the admin dashboard or reply to this email.</p>
  `;

  const NOTIFY_EMAILS = [
    "syed@zavis.ai",
    "sayan@zavis.ai",
    "anuj@zavis.ai",
    "mohit@zavis.ai",
  ];

  // Try Plunk first (already used in codebase)
  if (process.env.PLUNK_SECRET_KEY) {
    try {
      const { sendEmail } = await import("@/lib/research/plunk");
      await sendEmail({
        to: NOTIFY_EMAILS,
        subject: `New Claim Request: ${claim.providerName}`,
        body: emailBody,
        from: "directory@zavis.ai",
        name: "Zavis Directory",
      });
      console.log(`[claims] Notification sent via Plunk for claim ${claim.id}`);
      return;
    } catch (err) {
      console.error("[claims] Plunk notification failed:", err);
    }
  }

  // Try Resend as second option
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Zavis Directory <directory@zavis.ai>",
        to: NOTIFY_EMAILS,
        subject: `New Claim Request: ${claim.providerName}`,
        html: emailBody,
      });
      console.log(`[claims] Notification sent via Resend for claim ${claim.id}`);
      return;
    } catch (err) {
      console.error("[claims] Resend notification failed:", err);
    }
  }

  // Fallback: POST to Zavis internal API (same as lead webhook)
  if (process.env.NEXT_PUBLIC_ZAVIS_API_URL && process.env.NEXT_PUBLIC_LEADS_WEBHOOK_SECRET) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_ZAVIS_API_URL}/api/leads/website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.NEXT_PUBLIC_LEADS_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          name: claim.contactName,
          email: claim.contactEmail,
          phone: claim.contactPhone,
          company: claim.providerName,
          team: `Claim Request (${claim.jobTitle || "Unknown role"})`,
          website: claim.proofDocumentUrl || "",
        }),
      });
      console.log(`[claims] Notification sent via leads webhook for claim ${claim.id}`);
    } catch (err) {
      console.error("[claims] Leads webhook notification failed:", err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let providerId: string;
    let contactName: string;
    let contactEmail: string;
    let contactPhone: string;
    let jobTitle: string | null = null;
    let proofType: string | null = null;
    let notes: string | null = null;
    let requestedChanges: Record<string, string> | null = null;
    let proofFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      providerId = formData.get("providerId") as string;
      contactName = formData.get("contactName") as string;
      contactEmail = formData.get("contactEmail") as string;
      contactPhone = formData.get("contactPhone") as string;
      jobTitle = (formData.get("jobTitle") as string) || null;
      proofType = (formData.get("proofType") as string) || null;
      notes = (formData.get("notes") as string) || null;
      proofFile = formData.get("proofDocument") as File | null;

      const changesStr = formData.get("requestedChanges") as string;
      if (changesStr) {
        try {
          requestedChanges = JSON.parse(changesStr);
        } catch {
          requestedChanges = null;
        }
      }
    } else {
      const body = await request.json();
      providerId = body.providerId;
      contactName = body.contactName;
      contactEmail = body.contactEmail;
      contactPhone = body.contactPhone;
      jobTitle = body.jobTitle || null;
      proofType = body.proofType || null;
      notes = body.notes || null;
      requestedChanges = body.requestedChanges || null;
    }

    if (!providerId || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Missing required fields: providerId, contactName, contactEmail, contactPhone" },
        { status: 400 }
      );
    }

    // Validate provider exists (try by ID first, then by slug)
    let providerRecord = (
      await db
        .select({ id: providers.id, name: providers.name })
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1)
    )[0];

    if (!providerRecord) {
      providerRecord = (
        await db
          .select({ id: providers.id, name: providers.name })
          .from(providers)
          .where(eq(providers.slug, providerId))
          .limit(1)
      )[0];
    }

    if (!providerRecord) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    providerId = providerRecord.id;
    const providerName = providerRecord.name;

    // Generate claim ID
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Upload proof document to R2 if provided
    let proofDocumentUrl: string | null = null;
    if (proofFile && proofFile.size > 0) {
      if (proofFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }
      // MIME type allowlist — only common document/image formats.
      // Prevents uploading HTML (XSS via R2 public URL), executables, or scripts.
      const allowedTypes = new Set([
        "application/pdf",
        "image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/heif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);
      const fileName = (proofFile.name || "").toLowerCase();
      const allowedExts = /\.(pdf|png|jpe?g|webp|heic|heif|doc|docx)$/i;
      if (!allowedTypes.has(proofFile.type) || !allowedExts.test(fileName)) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: PDF, PNG, JPG, WebP, HEIC, DOC, DOCX." },
          { status: 400 }
        );
      }
      proofDocumentUrl = await uploadProofToR2(proofFile, claimId);
    }

    // Insert into database
    await db.insert(claimRequests).values({
      id: claimId,
      providerId,
      contactName,
      contactEmail,
      contactPhone,
      jobTitle,
      proofType,
      proofDocumentUrl,
      requestedChanges,
      notes,
      status: "pending",
    });

    console.log(`[claims] New claim ${claimId} for provider ${providerName} by ${contactName} (${contactEmail})`);

    // Send notification (fire and forget)
    sendNotification({
      id: claimId,
      providerName,
      contactName,
      contactEmail,
      contactPhone,
      jobTitle,
      proofType,
      proofDocumentUrl,
      requestedChanges,
      notes,
    }).catch((err) => console.error("[claims] Notification error:", err));

    return NextResponse.json(
      {
        success: true,
        claimId,
        message: "Claim request submitted successfully. We will review your request within 2-3 business days.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[claims] Error processing claim:", err);
    return NextResponse.json(
      { error: "Failed to process claim request. Please try again." },
      { status: 500 }
    );
  }
}
