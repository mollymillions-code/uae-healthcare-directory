import { trackEvent } from "@/lib/gtag";

const ANON_ID_KEY = "zavis_anonymous_id";
const SAVED_PROVIDER_IDS_KEY = "zavis_saved_provider_ids";

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(ANON_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(ANON_ID_KEY, id);
  return id;
}

export function getLocalSavedProviderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_PROVIDER_IDS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function setLocalSavedProviderIds(providerIds: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SAVED_PROVIDER_IDS_KEY,
    JSON.stringify(Array.from(new Set(providerIds)).slice(0, 100))
  );
}

export function addLocalSavedProviderId(providerId: string) {
  setLocalSavedProviderIds([...getLocalSavedProviderIds(), providerId]);
}

export function removeLocalSavedProviderId(providerId: string) {
  setLocalSavedProviderIds(getLocalSavedProviderIds().filter((id) => id !== providerId));
}

export async function syncLocalSavedProviders(): Promise<number> {
  const providerIds = getLocalSavedProviderIds();
  if (providerIds.length === 0) return 0;

  const res = await fetch("/api/account/saved-providers", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerIds }),
  });
  if (!res.ok) return 0;
  setLocalSavedProviderIds([]);
  const data = await res.json().catch(() => ({}));
  return Number(data.synced ?? 0);
}

export async function recordConsumerEvent(payload: {
  action: string;
  surface: string;
  providerId?: string | null;
  entityType?: string;
  entitySlug?: string | null;
  entityName?: string | null;
  pageUrl?: string | null;
  ctaLabel?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const anonymousId = getAnonymousId();
  trackEvent(payload.action, {
    surface: payload.surface,
    provider_id: payload.providerId,
    entity_type: payload.entityType,
    entity_slug: payload.entitySlug,
    entity_name: payload.entityName,
    cta_label: payload.ctaLabel,
    anonymous_id: anonymousId,
    ...(payload.metadata ?? {}),
  });

  await fetch("/api/account/provider-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      pageUrl: payload.pageUrl ?? (typeof window !== "undefined" ? window.location.href : null),
      anonymousId,
    }),
  }).catch(() => undefined);
}
