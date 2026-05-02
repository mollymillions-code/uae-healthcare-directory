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

const GENERIC_PROVIDER_QUERY_TOKENS = new Set([
  "al",
  "and",
  "br",
  "branch",
  "center",
  "centre",
  "clinic",
  "clinics",
  "hospital",
  "l",
  "llc",
  "medical",
  "of",
  "polyclinic",
  "the",
]);

const REMOVED_PROVIDER_SEARCH_PHRASES = new Set(
  REMOVED_PROVIDER_ENTRIES.flatMap((entry) => [
    entry.slug,
    ...(entry.aliases ?? []),
    ...(entry.names ?? []),
  ])
    .map(normalizeName)
    .filter(Boolean)
);

const REMOVED_PROVIDER_DISTINCTIVE_TOKENS = new Set(
  Array.from(REMOVED_PROVIDER_SEARCH_PHRASES)
    .flatMap((phrase) => phrase.split(" "))
    .filter(
      (token) =>
        token.length >= 4 && !GENERIC_PROVIDER_QUERY_TOKENS.has(token)
    )
);

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

export function isRemovedProviderSearchQuery(value: unknown): boolean {
  const query = normalizeName(value);
  if (!query) return false;
  if (REMOVED_PROVIDER_SEARCH_PHRASES.has(query)) return true;

  const queryTokens = new Set(query.split(" ").filter(Boolean));
  const hasDistinctiveRemovedToken = Array.from(queryTokens).some((token) =>
    REMOVED_PROVIDER_DISTINCTIVE_TOKENS.has(token)
  );

  for (const phrase of Array.from(REMOVED_PROVIDER_SEARCH_PHRASES)) {
    if (!phrase) continue;
    if (query.includes(phrase)) return true;
    if (hasDistinctiveRemovedToken && phrase.includes(query)) return true;
  }

  for (const token of Array.from(REMOVED_PROVIDER_DISTINCTIVE_TOKENS)) {
    if (queryTokens.has(token)) return true;
  }

  return false;
}
