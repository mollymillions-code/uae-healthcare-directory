interface JsonLdProps {
  data: Record<string, unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeJsonLdValue(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "NaN") {
      return undefined;
    }
    if (/^http:\/\/(www\.)?zavis\.ai(\/|$)/i.test(trimmed)) {
      return trimmed.replace(/^http:\/\/(?:www\.)?zavis\.ai/i, "https://www.zavis.ai");
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => normalizeJsonLdValue(item))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, normalizeJsonLdValue(entry)] as const)
      .filter(([, entry]) => entry !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

export function JsonLd({ data }: JsonLdProps) {
  const normalized = normalizeJsonLdValue(data);
  if (!normalized) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(normalized) }}
    />
  );
}
