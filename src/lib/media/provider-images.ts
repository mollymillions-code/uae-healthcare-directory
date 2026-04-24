export interface ProviderImageInput {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  photos?: string[] | null;
  galleryPhotos?: Array<{ url?: string | null } | string> | null;
}

const ABSOLUTE_IMAGE_URL_RE = /^https?:\/\//i;
const LOCAL_IMAGE_URL_RE = /^\/(?:images|reports|cdn-cgi\/image)\//i;

export function isAbsoluteProviderImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return ABSOLUTE_IMAGE_URL_RE.test(value.trim());
}

export function isUsableProviderImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url) return false;
  return ABSOLUTE_IMAGE_URL_RE.test(url) || LOCAL_IMAGE_URL_RE.test(url);
}

export function collectProviderImageUrls(
  provider: ProviderImageInput,
  options: { limit?: number; includeLogo?: boolean; absoluteOnly?: boolean } = {},
): string[] {
  const urls: string[] = [];

  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const url = value.trim();
    const usable = options.absoluteOnly
      ? isAbsoluteProviderImageUrl(url)
      : isUsableProviderImageUrl(url);
    if (!usable) return;
    if (!urls.includes(url)) urls.push(url);
  };

  if (options.includeLogo) push(provider.logoUrl);
  push(provider.coverImageUrl);

  if (Array.isArray(provider.photos)) {
    for (const photo of provider.photos) push(photo);
  }

  if (Array.isArray(provider.galleryPhotos)) {
    for (const photo of provider.galleryPhotos) {
      push(typeof photo === "string" ? photo : photo?.url);
    }
  }

  return typeof options.limit === "number" ? urls.slice(0, options.limit) : urls;
}

export function getPrimaryProviderImageUrl(
  provider: ProviderImageInput,
  options: { absoluteOnly?: boolean } = {},
): string | null {
  return collectProviderImageUrls(provider, {
    limit: 1,
    absoluteOnly: options.absoluteOnly,
  })[0] ?? null;
}
