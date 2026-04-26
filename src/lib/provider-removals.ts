import removals from "./provider-removals.json";

type RemovedProviderEntry = {
  slug: string;
  aliases?: string[];
  names?: string[];
  citySlug?: string;
  categorySlug?: string;
  paths?: string[];
};

type ProviderRemovalCandidate = {
  slug?: string;
  name?: string;
  citySlug?: string;
  city_slug?: string;
  categorySlug?: string;
  category_slug?: string;
};

const REMOVED_PROVIDER_ENTRIES =
  (removals.providers ?? []) as RemovedProviderEntry[];

function normalizeSlug(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcentre\b/g, "center")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcentre\b/g, "center")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePath(pathname: unknown): string {
  const value = String(pathname ?? "").split("?")[0] || "";
  const withoutTrailingSlash =
    value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return withoutTrailingSlash.toLowerCase();
}

export const REMOVED_PROVIDER_SLUGS = Array.from(
  new Set(
    REMOVED_PROVIDER_ENTRIES.flatMap((entry) => [
      entry.slug,
      ...(entry.aliases ?? []),
    ]).map(normalizeSlug)
  )
);

const REMOVED_PROVIDER_PATHS = new Set(
  REMOVED_PROVIDER_ENTRIES.flatMap((entry) => entry.paths ?? []).map(normalizePath)
);

const REMOVED_PROVIDER_NAME_KEYS = REMOVED_PROVIDER_ENTRIES.map((entry) => ({
  citySlug: normalizeSlug(entry.citySlug),
  categorySlug: normalizeSlug(entry.categorySlug),
  names: new Set((entry.names ?? []).map(normalizeName)),
}));

export function isRemovedProviderSlug(value: unknown): boolean {
  return REMOVED_PROVIDER_SLUGS.includes(normalizeSlug(value));
}

export function isRemovedProviderPath(pathname: unknown): boolean {
  return REMOVED_PROVIDER_PATHS.has(normalizePath(pathname));
}

export function isRemovedProviderRecord(
  provider: ProviderRemovalCandidate
): boolean {
  if (isRemovedProviderSlug(provider.slug)) return true;

  const providerCity = normalizeSlug(provider.citySlug ?? provider.city_slug);
  const providerCategory = normalizeSlug(
    provider.categorySlug ?? provider.category_slug
  );
  const providerName = normalizeName(provider.name);
  if (!providerCity || !providerName) return false;

  return REMOVED_PROVIDER_NAME_KEYS.some((entry) => {
    if (entry.citySlug && entry.citySlug !== providerCity) return false;
    if (
      entry.categorySlug &&
      providerCategory &&
      entry.categorySlug !== providerCategory
    ) {
      return false;
    }
    return entry.names.has(providerName);
  });
}
