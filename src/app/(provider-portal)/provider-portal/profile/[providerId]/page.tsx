/**
 * Embeddable clinic profile.
 *
 * Iframe target hosted at zavis.ai/provider-portal/profile/[providerId] for
 * embedding inside crm.zavis.ai (or any frame-ancestor allowed in
 * `next.config.mjs`'s CSP). Auth-gated through the existing provider-portal
 * embed-session flow — only members of the clinic_organization that owns
 * this provider record can access it.
 *
 * NOT linked from the public /directory/* tree. The public consumer view
 * lives at /directory/[city]/[category]/[slug]; this profile is for the
 * clinic's CRM/embed surface only.
 */

import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { ProviderPortalLogoutButton } from "@/components/provider-portal/ProviderPortalLogoutButton";
import { getCurrentProviderPortalContext } from "@/lib/provider-portal/current-user";
import { getOwnedProvider } from "@/lib/provider-portal/access";
import { normalizeDayName } from "@/lib/hours-utils";

type GalleryPhoto = {
  url?: string;
  widthPx?: number;
  heightPx?: number;
  attributions?: { displayName?: string; uri?: string }[];
};

type GoogleReview = {
  rating?: number;
  text?: { text?: string } | null;
  originalText?: { text?: string } | null;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
    uri?: string;
  } | null;
  publishTime?: string | null;
  relativePublishTimeDescription?: string | null;
};

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function formatHours(
  hours: Record<string, { open?: string | null; close?: string | null }> | null
): { day: string; open: string | null; close: string | null }[] | null {
  if (!hours || typeof hours !== "object") return null;
  // Normalize keys (handle both PascalCase and lowercase)
  const normalized: Record<string, { open?: string | null; close?: string | null }> = {};
  for (const [k, v] of Object.entries(hours)) {
    const day = normalizeDayName(k);
    if (day) normalized[day] = v;
  }
  const out = DAYS_ORDER.map((day) => ({
    day,
    open: normalized[day]?.open ?? null,
    close: normalized[day]?.close ?? null,
  }));
  // If everything's empty, return null so we hide the section
  if (out.every((d) => !d.open && !d.close)) return null;
  return out;
}

function formatTime(t: string | null): string {
  if (!t) return "Closed";
  // Accept "0900" or "09:00"; render as "9:00 AM" / "5:30 PM"
  const m = t.match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mm} ${ampm}`;
}

export const metadata = {
  title: "Clinic Profile | Zavis",
  robots: { index: false, follow: false },
};

export default async function ClinicProfilePage({
  params,
}: {
  params: { providerId: string };
}) {
  const context = await getCurrentProviderPortalContext();
  if (!context) {
    redirect(
      `/provider-portal/login?redirect=${encodeURIComponent(
        `/provider-portal/profile/${params.providerId}`
      )}`
    );
  }

  const provider = await getOwnedProvider(context, params.providerId);
  if (!provider) notFound();

  const galleryPhotos = (provider.galleryPhotos as GalleryPhoto[] | null) ?? [];
  const reviews = (provider.googleReviews as GoogleReview[] | null) ?? [];
  const hours = formatHours(
    provider.operatingHours as Record<string, { open?: string | null; close?: string | null }> | null
  );
  const services = Array.isArray(provider.services) ? (provider.services as string[]) : [];
  const insurance = Array.isArray(provider.insurance) ? (provider.insurance as string[]) : [];
  const languages = Array.isArray(provider.languages) ? (provider.languages as string[]) : [];
  const amenities = Array.isArray(provider.amenities) ? (provider.amenities as string[]) : [];

  const ratingNum =
    provider.googleRating != null ? Number(provider.googleRating) : null;
  const reviewCount = provider.googleReviewCount ?? 0;

  const heroImage =
    provider.coverImageUrl ||
    galleryPhotos[0]?.url ||
    null;

  return (
    <main className="mx-auto min-h-screen max-w-[960px] bg-white px-0 pb-16">
      {/* ─── Hero ─── */}
      <section className="relative">
        {heroImage ? (
          <div className="relative h-[200px] w-full overflow-hidden bg-[#1c1c1c] sm:h-[280px]">
            <Image
              src={heroImage}
              alt={provider.name}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 960px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
        ) : (
          <div className="h-[140px] w-full bg-gradient-to-br from-[#006828]/15 via-[#006828]/5 to-transparent" />
        )}

        <div className="relative -mt-12 px-5 sm:px-8">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[26px] font-medium leading-[1.15] tracking-tight text-[#1c1c1c] sm:text-[32px]">
                    {provider.name}
                  </h1>
                  {provider.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#006828]/10 px-2.5 py-1 font-['Geist',sans-serif] text-xs font-semibold text-[#006828]">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : null}
                </div>

                {provider.nameAr ? (
                  <p
                    dir="rtl"
                    lang="ar"
                    className="mt-1 font-['Geist',sans-serif] text-[15px] text-black/55"
                  >
                    {provider.nameAr}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-['Geist',sans-serif] text-sm text-black/65">
                  {ratingNum != null && ratingNum > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                      <strong className="text-[#1c1c1c]">{ratingNum.toFixed(1)}</strong>
                      <span className="text-black/45">({reviewCount.toLocaleString()} reviews)</span>
                    </span>
                  ) : null}
                  {provider.address ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-black/45" strokeWidth={1.5} />
                      <span className="line-clamp-1">{provider.address}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Contact action row */}
            <div className="mt-5 flex flex-wrap gap-2">
              {provider.phone ? (
                <a
                  href={`tel:${provider.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#006828] px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-white hover:bg-[#005220]"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              ) : null}
              {provider.whatsapp ? (
                <a
                  href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  <MessageCircle className="h-4 w-4 text-[#006828]" />
                  WhatsApp
                </a>
              ) : null}
              {provider.website ? (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  <Globe className="h-4 w-4 text-black/55" />
                  Website
                </a>
              ) : null}
              {provider.email ? (
                <a
                  href={`mailto:${provider.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  <Mail className="h-4 w-4 text-black/55" />
                  Email
                </a>
              ) : null}
              {provider.googleMapsUri ? (
                <a
                  href={provider.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:border-[#006828]/30"
                >
                  <MapPin className="h-4 w-4 text-black/55" />
                  Directions
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body grid ─── */}
      <div className="mt-6 grid gap-5 px-5 sm:px-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* About */}
          {(provider.description || provider.shortDescription) ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                About
              </h2>
              <p className="mt-3 font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/75">
                {provider.description || provider.shortDescription}
              </p>
              {provider.descriptionAr ? (
                <p
                  dir="rtl"
                  lang="ar"
                  className="mt-4 border-t border-black/[0.06] pt-4 font-['Geist',sans-serif] text-[15px] leading-relaxed text-black/75"
                >
                  {provider.descriptionAr}
                </p>
              ) : null}
            </section>
          ) : null}

          {/* Photo gallery */}
          {galleryPhotos.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                Photos
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {galleryPhotos.slice(0, 9).map((p, i) =>
                  p.url ? (
                    <div
                      key={`${p.url}-${i}`}
                      className="relative aspect-square overflow-hidden rounded-xl bg-black/5"
                    >
                      <Image
                        src={p.url}
                        alt={`${provider.name} photo ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 320px"
                        className="object-cover"
                      />
                    </div>
                  ) : null
                )}
              </div>
            </section>
          ) : null}

          {/* Services */}
          {services.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                Services
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {services.map((s) => (
                  <li
                    key={s}
                    className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-3 py-1 font-['Geist',sans-serif] text-sm text-[#1c1c1c]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Insurance */}
          {insurance.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                Insurance accepted
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {insurance.map((s) => (
                  <li
                    key={s}
                    className="inline-flex items-center rounded-full bg-[#006828]/[0.08] px-3 py-1 font-['Geist',sans-serif] text-sm font-medium text-[#006828]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
                  Recent reviews
                </h2>
                <span className="font-['Geist',sans-serif] text-xs text-black/40">
                  via Google
                </span>
              </div>
              <ul className="mt-4 space-y-4">
                {reviews.slice(0, 5).map((r, i) => {
                  const text =
                    r.text?.text || r.originalText?.text || "";
                  const author = r.authorAttribution?.displayName || "Patient";
                  const when =
                    r.relativePublishTimeDescription ||
                    (r.publishTime ? new Date(r.publishTime).toLocaleDateString() : "");
                  const rating = typeof r.rating === "number" ? r.rating : null;
                  if (!text) return null;
                  return (
                    <li
                      key={`${author}-${i}`}
                      className="border-b border-black/[0.06] pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        {rating != null ? (
                          <span className="inline-flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, k) => (
                              <Star
                                key={k}
                                className={`h-3.5 w-3.5 ${
                                  k < rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-black/20"
                                }`}
                                strokeWidth={1.5}
                              />
                            ))}
                          </span>
                        ) : null}
                        <span className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c]">
                          {author}
                        </span>
                        {when ? (
                          <span className="font-['Geist',sans-serif] text-xs text-black/40">
                            · {when}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/75">
                        {text}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          {/* Hours */}
          {hours ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006828]" strokeWidth={2} />
                <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                  Hours
                </h2>
              </div>
              <ul className="mt-3 space-y-1.5 font-['Geist',sans-serif] text-[14px]">
                {hours.map(({ day, open, close }) => (
                  <li key={day} className="flex items-center justify-between">
                    <span className="text-black/55">{day}</span>
                    <span className="text-[#1c1c1c]">
                      {open && close
                        ? `${formatTime(open)} – ${formatTime(close)}`
                        : "Closed"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Contact details */}
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
              Contact
            </h2>
            <dl className="mt-3 space-y-2.5 font-['Geist',sans-serif] text-[14px]">
              {provider.phone ? (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-black/45" strokeWidth={1.75} />
                  <dd className="text-[#1c1c1c]">{provider.phone}</dd>
                </div>
              ) : null}
              {provider.phoneSecondary ? (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-black/45" strokeWidth={1.75} />
                  <dd className="text-[#1c1c1c]">{provider.phoneSecondary}</dd>
                </div>
              ) : null}
              {provider.email ? (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-black/45" strokeWidth={1.75} />
                  <dd className="break-all text-[#1c1c1c]">{provider.email}</dd>
                </div>
              ) : null}
              {provider.address ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-black/45" strokeWidth={1.75} />
                  <dd className="text-[#1c1c1c]">{provider.address}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Languages */}
          {languages.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                Languages
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {languages.map((l) => (
                  <li
                    key={l}
                    className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 font-['Geist',sans-serif] text-xs text-[#1c1c1c]"
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Amenities */}
          {amenities.length > 0 ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                Amenities
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {amenities.map((a) => (
                  <li
                    key={a}
                    className="inline-flex items-center rounded-full border border-black/[0.08] bg-white px-2.5 py-0.5 font-['Geist',sans-serif] text-xs text-[#1c1c1c]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Edit + sign-out (only when NOT embedded) */}
          <section className="rounded-2xl border border-dashed border-black/[0.1] bg-white p-5">
            <p className="font-['Geist',sans-serif] text-xs text-black/45">
              Clinic admin tools
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href={`/provider-portal/listings/${provider.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-black/[0.08] px-3 py-2 font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c] hover:border-[#006828]/30"
              >
                Edit listing
              </Link>
              <ProviderPortalLogoutButton />
            </div>
          </section>
        </aside>
      </div>

      {/* Footer attribution */}
      <footer className="mt-10 px-5 sm:px-8">
        <p className="font-['Geist',sans-serif] text-xs text-black/35">
          Profile data verified by Zavis.
        </p>
      </footer>
    </main>
  );
}
