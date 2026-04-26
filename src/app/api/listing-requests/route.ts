import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ALLOWED_COUNTRIES = new Set(["ae", "sa", "qa", "bh", "kw"]);
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadProofToR2(file: File, requestId: string): Promise<string | null> {
  const r2 = getR2Client();
  if (!r2 || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
    console.warn("[listing-requests] R2 not configured - skipping file upload");
    return null;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const key = `listing-requests/${requestId}/proof.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

function esc(value: FormDataEntryValue | string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendNotification(payload: {
  requestId: string;
  proofDocumentUrl: string | null;
  values: Record<string, string>;
}) {
  const proofLink =
    payload.proofDocumentUrl && /^https?:\/\//.test(payload.proofDocumentUrl)
      ? `<p><a href="${esc(payload.proofDocumentUrl)}">View uploaded proof</a></p>`
      : "<p>No proof URL was stored. Check server R2 configuration.</p>";

  const body = `
    <h2>New Listing Request</h2>
    <p><strong>Request ID:</strong> ${esc(payload.requestId)}</p>
    <hr>
    <h3>Practice</h3>
    <p><strong>Name:</strong> ${esc(payload.values.practiceName)}</p>
    <p><strong>Country:</strong> ${esc(payload.values.country)}</p>
    <p><strong>City:</strong> ${esc(payload.values.city)}</p>
    <p><strong>Category:</strong> ${esc(payload.values.category)}</p>
    <p><strong>Address:</strong> ${esc(payload.values.address)}</p>
    <p><strong>Website:</strong> ${esc(payload.values.website) || "Not provided"}</p>
    <p><strong>Google Business Profile:</strong> ${esc(payload.values.googleBusinessProfileUrl)}</p>
    <hr>
    <h3>Licence</h3>
    <p><strong>Regulator:</strong> ${esc(payload.values.regulator)}</p>
    <p><strong>Regulator licence:</strong> ${esc(payload.values.regulatorLicenseNumber)}</p>
    <p><strong>Trade licence / CR:</strong> ${esc(payload.values.tradeLicenseNumber)}</p>
    ${proofLink}
    <hr>
    <h3>Requester</h3>
    <p><strong>Name:</strong> ${esc(payload.values.contactName)}</p>
    <p><strong>Email:</strong> ${esc(payload.values.contactEmail)}</p>
    <p><strong>Phone:</strong> ${esc(payload.values.contactPhone)}</p>
    <p><strong>Job title:</strong> ${esc(payload.values.jobTitle) || "Not provided"}</p>
    <p><strong>Authority confirmed:</strong> ${esc(payload.values.authorityConfirmed)}</p>
    ${payload.values.notes ? `<h3>Notes</h3><p>${esc(payload.values.notes)}</p>` : ""}
  `;

  const notifyEmails = [
    "syed@zavis.ai",
    "sayan@zavis.ai",
    "anuj@zavis.ai",
    "mohit@zavis.ai",
  ];

  if (process.env.PLUNK_SECRET_KEY) {
    try {
      const { sendEmail } = await import("@/lib/research/plunk");
      await sendEmail({
        to: notifyEmails,
        subject: `New Listing Request: ${payload.values.practiceName}`,
        body,
        from: "directory@zavis.ai",
        name: "Zavis Directory",
      });
      return;
    } catch (err) {
      console.error("[listing-requests] Plunk notification failed:", err);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Zavis Directory <directory@zavis.ai>",
        to: notifyEmails,
        subject: `New Listing Request: ${payload.values.practiceName}`,
        html: body,
      });
    } catch (err) {
      console.error("[listing-requests] Resend notification failed:", err);
    }
  }
}

function getRequiredValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStringValue(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  }
  return "";
}

async function parseListingRequestBody(request: NextRequest): Promise<{
  values: Record<string, string>;
  proofFile: File | null;
}> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      proofFile: null,
      values: {
        country: getStringValue(json, "country"),
        city: getStringValue(json, "city"),
        category: getStringValue(json, "category"),
        practiceName: getStringValue(json, "practiceName", "providerName", "name"),
        address: getStringValue(json, "address"),
        website: getStringValue(json, "website"),
        googleBusinessProfileUrl: getStringValue(json, "googleBusinessProfileUrl", "googlePlacesUrl", "googleMapsUrl"),
        contactName: getStringValue(json, "contactName", "requesterName"),
        contactEmail: getStringValue(json, "contactEmail", "requesterEmail", "email"),
        contactPhone: getStringValue(json, "contactPhone", "requesterPhone", "phone"),
        jobTitle: getStringValue(json, "jobTitle", "title"),
        regulator: getStringValue(json, "regulator"),
        regulatorLicenseNumber: getStringValue(json, "regulatorLicenseNumber", "healthcareLicenseNumber"),
        tradeLicenseNumber: getStringValue(json, "tradeLicenseNumber", "commercialRegistrationNumber"),
        notes: getStringValue(json, "notes"),
        authorityConfirmed: getStringValue(json, "authorityConfirmed"),
      },
    };
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    return {
      proofFile: formData.get("proofDocument") instanceof File
        ? (formData.get("proofDocument") as File)
        : null,
      values: {
        country: getRequiredValue(formData, "country"),
        city: getRequiredValue(formData, "city"),
        category: getRequiredValue(formData, "category"),
        practiceName: getRequiredValue(formData, "practiceName"),
        address: getRequiredValue(formData, "address"),
        website: getRequiredValue(formData, "website"),
        googleBusinessProfileUrl: getRequiredValue(formData, "googleBusinessProfileUrl"),
        contactName: getRequiredValue(formData, "contactName"),
        contactEmail: getRequiredValue(formData, "contactEmail"),
        contactPhone: getRequiredValue(formData, "contactPhone"),
        jobTitle: getRequiredValue(formData, "jobTitle"),
        regulator: getRequiredValue(formData, "regulator"),
        regulatorLicenseNumber: getRequiredValue(formData, "regulatorLicenseNumber"),
        tradeLicenseNumber: getRequiredValue(formData, "tradeLicenseNumber"),
        notes: getRequiredValue(formData, "notes"),
        authorityConfirmed: getRequiredValue(formData, "authorityConfirmed"),
      },
    };
  }

  return {
    proofFile: null,
    values: {
      country: "",
      city: "",
      category: "",
      practiceName: "",
      address: "",
      website: "",
      googleBusinessProfileUrl: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      jobTitle: "",
      regulator: "",
      regulatorLicenseNumber: "",
      tradeLicenseNumber: "",
      notes: "",
      authorityConfirmed: "",
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { values, proofFile } = await parseListingRequestBody(request);

    const missing = [
      "country",
      "city",
      "category",
      "practiceName",
      "address",
      "googleBusinessProfileUrl",
      "contactName",
      "contactEmail",
      "contactPhone",
      "regulator",
      "regulatorLicenseNumber",
      "tradeLicenseNumber",
    ].filter((key) => !values[key as keyof typeof values]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_COUNTRIES.has(values.country)) {
      return NextResponse.json({ error: "Unsupported country." }, { status: 400 });
    }

    if (values.authorityConfirmed !== "true") {
      return NextResponse.json(
        { error: "Authority confirmation is required." },
        { status: 400 }
      );
    }

    if (!(proofFile instanceof File) || proofFile.size <= 0) {
      return NextResponse.json(
        { error: "Proof document is required." },
        { status: 400 }
      );
    }

    if (proofFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const allowedExts = /\.(pdf|png|jpe?g|webp|heic|heif|doc|docx)$/i;
    if (!ALLOWED_FILE_TYPES.has(proofFile.type) || !allowedExts.test(proofFile.name || "")) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, PNG, JPG, WebP, HEIC, DOC, DOCX." },
        { status: 400 }
      );
    }

    const requestId = `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const proofDocumentUrl = await uploadProofToR2(proofFile, requestId);

    console.log(
      `[listing-requests] ${requestId} ${values.practiceName} (${values.country}/${values.city}) by ${values.contactEmail}`
    );

    sendNotification({ requestId, proofDocumentUrl, values }).catch((err) => {
      console.error("[listing-requests] Notification error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: "Listing request submitted successfully.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[listing-requests] Error processing request:", err);
    return NextResponse.json(
      { error: "Failed to process listing request. Please try again." },
      { status: 500 }
    );
  }
}
