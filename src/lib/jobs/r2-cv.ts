import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_PUBLIC_BASE = "https://pub-12b97f7acbe84e70aacc715287b58c72.r2.dev";
const R2_BUCKET = process.env.R2_BUCKET_NAME || "zavis-public";
const CV_PREFIX = "cv";

export const MAX_CV_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_CV_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function getR2Client(): S3Client | null {
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

function extensionFor(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/msword") return "doc";
  return "docx";
}

/**
 * Uploads a candidate CV blob to R2 and returns the public URL.
 * Returns null if R2 isn't configured (local dev fallback).
 */
export async function uploadCvToR2(
  candidateUserId: string,
  buffer: Buffer,
  mime: string
): Promise<string | null> {
  const client = getR2Client();
  if (!client) {
    console.warn("[cv-upload] R2 not configured — returning null URL");
    return null;
  }

  const ext = extensionFor(mime);
  const key = `${CV_PREFIX}/${candidateUserId}/cv-${Date.now()}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mime,
      // CVs are sensitive — set a private cache to dissuade casual share
      CacheControl: "private, max-age=0, no-store",
    })
  );

  return `${R2_PUBLIC_BASE}/${key}`;
}

/** Deletes a previously stored CV. Best-effort; logs and swallows errors. */
export async function deleteCvFromR2(url: string): Promise<void> {
  const client = getR2Client();
  if (!client) return;
  if (!url.startsWith(R2_PUBLIC_BASE)) return;
  const key = url.slice(R2_PUBLIC_BASE.length + 1);
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );
  } catch (err) {
    console.warn("[cv-upload] failed to delete previous CV:", err);
  }
}
