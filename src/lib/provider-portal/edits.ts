import type { ProviderPortalEditPayload } from "@/lib/db/schema";

export const PROVIDER_PORTAL_EDITABLE_FIELDS = [
  "phone",
  "phoneSecondary",
  "whatsapp",
  "email",
  "website",
  "address",
  "shortDescription",
  "description",
  "services",
  "insurance",
  "languages",
  "operatingHours",
  "logoUrl",
  "coverImageUrl",
  "photos",
] as const;

export const PROVIDER_PORTAL_FIELD_LABELS: Record<string, string> = {
  phone: "Primary phone",
  phoneSecondary: "Secondary phone",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
  address: "Address",
  shortDescription: "Short description",
  description: "Full description",
  services: "Services",
  insurance: "Insurance",
  languages: "Languages",
  operatingHours: "Operating hours",
  logoUrl: "Logo URL",
  coverImageUrl: "Cover image URL",
  photos: "Gallery photos",
};

function cleanString(value: unknown, max = 2000): string | null | undefined {
  if (value == null) return value === null ? null : undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const cleaned = String(item || "").trim().slice(0, 120);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
    if (result.length >= 80) break;
  }
  return result;
}

function cleanRecord(value: unknown): Record<string, unknown> | null | undefined {
  if (value == null) return value === null ? null : undefined;
  if (typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function sanitizeProviderPortalEditPayload(
  input: Record<string, unknown>
): ProviderPortalEditPayload {
  const payload: ProviderPortalEditPayload = {};

  const stringFields: Array<keyof ProviderPortalEditPayload> = [
    "phone",
    "phoneSecondary",
    "whatsapp",
    "email",
    "website",
    "address",
    "shortDescription",
    "description",
    "logoUrl",
    "coverImageUrl",
  ];

  for (const field of stringFields) {
    if (!(field in input)) continue;
    const max = field === "description" ? 5000 : 2000;
    const value = cleanString(input[field], max);
    if (value !== undefined) {
      (payload as Record<string, unknown>)[field] = value;
    }
  }

  for (const field of ["services", "insurance", "languages", "photos"] as const) {
    if (!(field in input)) continue;
    const value = cleanStringArray(input[field]);
    if (value !== undefined) payload[field] = value;
  }

  if ("operatingHours" in input) {
    const operatingHours = cleanRecord(input.operatingHours);
    if (operatingHours !== undefined) payload.operatingHours = operatingHours;
  }

  return payload;
}

export function buildProviderUpdateFromPortalPayload(payload: ProviderPortalEditPayload) {
  const updates: Record<string, unknown> = {};
  for (const field of PROVIDER_PORTAL_EDITABLE_FIELDS) {
    if (field in payload) {
      updates[field] = payload[field as keyof ProviderPortalEditPayload];
    }
  }
  return updates;
}
