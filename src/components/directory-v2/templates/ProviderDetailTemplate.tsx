import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Star, MapPin as MapPinIcon, BadgeCheck, Clock, Languages as LangIcon, ShieldCheck, Quote, Accessibility, Stethoscope } from "lucide-react";
import { PhotoMosaic } from "../detail/PhotoMosaic";
import { BookingCard } from "../detail/BookingCard";
import { StickyBottomBar } from "../detail/StickyBottomBar";
import { HostCard } from "../detail/HostCard";
import { AmenityGrid } from "../detail/AmenityGrid";
import { ReviewDistribution } from "../detail/ReviewDistribution";
import { ShareButton } from "../detail/ShareButton";
import { HeartButton } from "../cards/HeartButton";
import { FaqSection } from "@/components/seo/FaqSection";
import { collectProviderImageUrls } from "@/lib/media/provider-images";


const GoogleMapEmbed = dynamic(
  () => import("@/components/maps/GoogleMapEmbed").then((m) => m.GoogleMapEmbed),
  { ssr: false, loading: () => <div className="w-full h-80 bg-surface-cream animate-pulse rounded-z-md" /> }
);

export interface DetailProvider {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  subcategorySlug?: string;
  areaSlug?: string;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  googleMapsUri?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  googleRating?: string | null;
  googleReviewCount?: number | null;
  licenseNumber?: string | null;
  yearEstablished?: number | null;
  isClaimed?: boolean | null;
  isVerified?: boolean | null;
  facilityType?: string | null;
  languages?: string[] | null;
  insurance?: string[] | null;
  services?: string[] | null;
  amenities?: string[] | null;
  photos?: string[] | null;
  coverImageUrl?: string | null;
  galleryPhotos?: Array<{ url: string } | string> | null;
  reviewSummary?: string[] | null;
  reviewSummaryV2?: {
    overall_sentiment: string;
    what_stood_out: Array<{ theme: string; mention_count: number }>;
    snippets: Array<{ text_fragment: string; author_display: string; rating: number; relative_time?: string }>;
    google_maps_url?: string;
  } | null;
  operatingHours?: Record<string, { open: string; close: string }> | null;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  } | null;
  latitude?: string | null;
  longitude?: string | null;
}

interface Props {
  provider: DetailProvider;
  categoryName?: string | null;
  cityName?: string | null;
  areaName?: string | null;
  breadcrumbs: { label: string; href?: string }[];
  /** Pre-built schemas (medicalOrganization, breadcrumb, FAQ, speakable). */
  schemas?: React.ReactNode;
  /** Dynamic FAQ blocks (title + htmlAnswer). */
  faqs?: Array<{ question: string; answer: string }>;
  /** Related provider cross-link list (same category, same city). */
  relatedSection?: React.ReactNode;
  /** AEO answer block text. */
  aeoAnswer?: React.ReactNode;
  /** URL to the Arabic counterpart. */
  arabicHref?: string | null;
}

function dayOrder(key: string) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return days.indexOf(key.toLowerCase());
}

export function ProviderDetailTemplate({
  provider: p,
  categoryName,
  cityName,
  areaName,
  breadcrumbs,
  schemas,
  faqs,
  relatedSection,
  aeoAnswer,
  arabicHref,
}: Props) {
  const uniqPhotos = collectProviderImageUrls(p).filter(
    (url) => !url.includes("/images/categories/") && !url.includes("placeholder-provider"),
  );

  const rating = p.googleRating ? Number(p.googleRating) : 0;
  const hasRating = rating > 0;

  const primaryCtaHref = p.phone
    ? `tel:${p.phone}`
    : p.whatsapp
      ? `https://wa.me/${p.whatsapp.replace(/[^\d]/g, "")}`
      : p.website ?? `/claim/${p.id}`;
  const primaryCtaLabel = p.phone
    ? "Call to book"
    : p.whatsapp
      ? "WhatsApp now"
      : p.website
        ? "Visit website"
        : "Claim this listing";

  const highlights: { icon: React.ReactNode; title: string; sub: string }[] = [];
  if (p.isVerified) highlights.push({ icon: <BadgeCheck className="h-5 w-5 text-accent-deep" />, title: "Verified by Zavis", sub: "Contact details reviewed and confirmed" });
  if (p.languages && p.languages.length > 0) highlights.push({ icon: <LangIcon className="h-5 w-5 text-accent-deep" />, title: `Speaks ${p.languages.slice(0, 3).join(", ")}`, sub: p.languages.length > 3 ? `+${p.languages.length - 3} more languages` : "Multilingual staff" });
  if (p.operatingHours && Object.keys(p.operatingHours).length > 0) highlights.push({ icon: <Clock className="h-5 w-5 text-accent-deep" />, title: "Published hours", sub: "Confirmed opening times" });
  if (p.insurance && p.insurance.length > 0) highlights.push({ icon: <ShieldCheck className="h-5 w-5 text-accent-deep" />, title: `${p.insurance.length} insurers accepted`, sub: "Direct billing on select plans" });

  return (
    <>
      {schemas}

      {/* Outer container — tight on mobile, generous on desktop */}
      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="inline-flex items-center gap-1.5">
                {b.href && !isLast ? (
                  <Link href={b.href} className="hover:text-ink transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-ink font-medium" : undefined}>{b.label}</span>
                )}
                {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            );
          })}
        </nav>

        {/* Title row */}
        <header className="flex items-start justify-between gap-6 mb-5">
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-ink text-display-md sm:text-[36px] lg:text-[40px] tracking-[-0.02em] leading-[1.1]">
              {p.name}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap font-sans text-z-body-sm text-ink-soft">
              {hasRating && (
                <span className="inline-flex items-center gap-1 text-ink font-semibold">
                  <Star className="h-3.5 w-3.5 fill-ink text-ink" />
                  {rating.toFixed(2)}
                </span>
              )}
              {p.googleReviewCount ? (
                <>
                  <span>·</span>
                  <a href="#reviews" className="underline decoration-1 underline-offset-2 hover:text-ink">
                    {p.googleReviewCount.toLocaleString()} {p.googleReviewCount === 1 ? "review" : "reviews"}
                  </a>
                </>
              ) : null}
              {categoryName && (
                <>
                  <span>·</span>
                  <Link href={`/directory/${p.citySlug}/${p.categorySlug}`} className="underline decoration-1 underline-offset-2 hover:text-ink">
                    {categoryName}
                  </Link>
                </>
              )}
              {(areaName || cityName) && (
                <>
                  <span>·</span>
                  <span>{areaName ? `${areaName}, ${cityName}` : cityName}</span>
                </>
              )}
            </div>
            {arabicHref && (
              <div className="mt-3">
                <Link
                  href={arabicHref}
                  lang="ar"
                  hrefLang="ar-AE"
                  dir="rtl"
                  className="inline-flex items-center gap-1.5 font-sans text-z-caption font-medium text-ink-soft hover:text-ink"
                >
                  اقرأ هذه الصفحة بالعربية
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <ShareButton title={p.name} text={`${p.name}${cityName ? ` in ${cityName}` : ""}`} />
            <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-z-pill hover:bg-surface-cream">
              <HeartButton size="sm" ariaLabel={`Save ${p.name}`} storageKey={`zavis:saved:${p.id || p.slug}`} />
              <span className="hidden sm:inline font-sans text-z-body-sm text-ink">Save</span>
            </div>
          </div>
        </header>

        {/* Photo mosaic */}
        <PhotoMosaic
          photos={uniqPhotos}
          alt={p.name}
          priorityCount={1}
          fallbackSrc={`/images/categories/${p.categorySlug}.webp`}
        />

        {/* Two-column layout */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16" id="detail-grid">
          {/* Left column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Hero block — type + licence strip */}
            <section className="pb-8 border-b border-ink-line">
              <h2 className="font-display font-semibold text-ink text-z-h1">
                {categoryName ? `${categoryName} · ` : ""}
                {cityName && `in ${cityName}`}
              </h2>
              <p className="font-sans text-z-body text-ink-soft mt-2">
                {p.licenseNumber ? `Licence ${p.licenseNumber}` : "Government-licensed facility"}
                {p.yearEstablished ? ` · Since ${p.yearEstablished}` : ""}
              </p>

              {highlights.length > 0 && (
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5">{h.icon}</span>
                      <div>
                        <p className="font-sans font-semibold text-ink text-z-body">{h.title}</p>
                        <p className="font-sans text-z-body-sm text-ink-muted">{h.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* AEO answer block */}
            {aeoAnswer && (
              <section className="answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 z-anchor" data-answer-block="true" id="aeo">
                <div className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">{aeoAnswer}</div>
              </section>
            )}

            {/* About */}
            {(p.description || p.shortDescription) && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="about">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">About</h2>
                <p className="font-sans text-z-body text-ink leading-relaxed whitespace-pre-line">
                  {p.description || p.shortDescription}
                </p>
              </section>
            )}

            {/* Services */}
            {p.services && p.services.length > 0 && (
              <AmenityGrid
                title="Services offered"
                items={p.services.map((s) => ({ label: s, icon: <Stethoscope className="h-4 w-4" strokeWidth={2.25} /> }))}
                maxVisible={12}
              />
            )}

            {/* Accessibility */}
            {p.accessibilityOptions && (
              <AmenityGrid
                title="Accessibility"
                items={[
                  { label: "Wheelchair-accessible entrance", available: !!p.accessibilityOptions.wheelchairAccessibleEntrance, icon: <Accessibility className="h-4 w-4" strokeWidth={2.25} /> },
                  { label: "Wheelchair-accessible parking", available: !!p.accessibilityOptions.wheelchairAccessibleParking, icon: <Accessibility className="h-4 w-4" strokeWidth={2.25} /> },
                  { label: "Wheelchair-accessible restroom", available: !!p.accessibilityOptions.wheelchairAccessibleRestroom, icon: <Accessibility className="h-4 w-4" strokeWidth={2.25} /> },
                  { label: "Wheelchair-accessible seating", available: !!p.accessibilityOptions.wheelchairAccessibleSeating, icon: <Accessibility className="h-4 w-4" strokeWidth={2.25} /> },
                ]}
                maxVisible={4}
              />
            )}

            {/* Operating hours */}
            {p.operatingHours && Object.keys(p.operatingHours).length > 0 && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="hours">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">Opening hours</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10">
                  {Object.entries(p.operatingHours)
                    .sort((a, b) => dayOrder(a[0]) - dayOrder(b[0]))
                    .map(([day, hrs]) => (
                      <div key={day} className="flex items-center justify-between py-1.5 border-b border-ink-line/50 last:border-0">
                        <dt className="font-sans text-z-body text-ink capitalize">{day}</dt>
                        <dd className="font-sans text-z-body text-ink-soft tabular-nums">
                          {hrs.open === "closed" ? "Closed" : `${hrs.open} – ${hrs.close}`}
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            )}

            {/* Insurance */}
            {p.insurance && p.insurance.length > 0 && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="insurance">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">Accepted insurance</h2>
                <ul className="flex flex-wrap gap-2">
                  {p.insurance.map((ins) => (
                    <li key={ins}>
                      <Link
                        href={`/directory/${p.citySlug}/insurance/${ins.toLowerCase().replace(/\s+/g, "-")}`}
                        className="inline-flex items-center rounded-z-pill bg-surface-cream border border-ink-line px-3 py-1.5 font-sans text-z-body-sm text-ink hover:border-ink transition-colors"
                      >
                        {ins}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Languages */}
            {p.languages && p.languages.length > 0 && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="languages">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">Languages spoken</h2>
                <ul className="flex flex-wrap gap-2">
                  {p.languages.map((lang) => (
                    <li key={lang}>
                      <span className="inline-flex items-center rounded-z-pill bg-surface-cream border border-ink-line px-3 py-1.5 font-sans text-z-body-sm text-ink">
                        {lang}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Reviews */}
            {hasRating && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="reviews">
                <ReviewDistribution
                  overallRating={rating}
                  reviewCount={p.googleReviewCount ?? 0}
                />

                {p.reviewSummaryV2?.what_stood_out && p.reviewSummaryV2.what_stood_out.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-display font-semibold text-ink text-z-h2 mb-4">What patients say</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {p.reviewSummaryV2.what_stood_out.slice(0, 6).map((t, i) => (
                        <li key={i} className="rounded-z-md bg-white border border-ink-line p-4">
                          <p className="font-sans font-semibold text-ink text-z-body">{t.theme}</p>
                          <p className="font-sans text-z-caption text-ink-muted mt-1">
                            Mentioned in {t.mention_count} {t.mention_count === 1 ? "review" : "reviews"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.reviewSummaryV2?.snippets && p.reviewSummaryV2.snippets.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {p.reviewSummaryV2.snippets.slice(0, 4).map((s, i) => (
                      <figure key={i} className="rounded-z-md bg-white border border-ink-line p-5">
                        <Quote className="h-5 w-5 text-ink-muted" />
                        <blockquote className="font-sans text-z-body text-ink mt-3 leading-relaxed">
                          &ldquo;{s.text_fragment}&rdquo;
                        </blockquote>
                        <figcaption className="font-sans text-z-caption text-ink-muted mt-3">
                          — {s.author_display}
                          {s.relative_time ? ` · ${s.relative_time}` : ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {p.reviewSummary && p.reviewSummary.length > 0 && !p.reviewSummaryV2 && (
                  <ul className="mt-6 space-y-2">
                    {p.reviewSummary.slice(0, 6).map((line, i) => (
                      <li key={i} className="font-sans text-z-body text-ink-soft leading-relaxed">
                        • {line}
                      </li>
                    ))}
                  </ul>
                )}

                {p.reviewSummaryV2?.google_maps_url && (
                  <div className="mt-5">
                    <a
                      href={p.reviewSummaryV2.google_maps_url}
                      target="_blank"
                      rel="noopener"
                      className="font-sans font-semibold text-z-body-sm text-accent-dark underline underline-offset-2 hover:text-accent"
                    >
                      Read all reviews on Google →
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* Location */}
            {p.latitude && p.longitude && (
              <section className="pb-8 border-b border-ink-line z-anchor" id="location">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">Location</h2>
                <p className="font-sans text-z-body text-ink-soft mb-4 inline-flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5" />
                  <span>{p.address}</span>
                </p>
                <div className="rounded-z-md overflow-hidden border border-ink-line">
                  <GoogleMapEmbed query={`${p.name} ${p.address ?? ""}`} />
                </div>
              </section>
            )}

            {/* Host / provider card */}
            <HostCard
              providerName={p.name}
              licenseNumber={p.licenseNumber ?? undefined}
              yearEstablished={p.yearEstablished ?? undefined}
              isClaimed={p.isClaimed}
              isVerified={p.isVerified}
              languages={p.languages}
              facilityType={p.facilityType ?? undefined}
            />

            {/* Things to know / FAQ */}
            {faqs && faqs.length > 0 && (
              <section className="pt-4 pb-8 z-anchor" id="faq">
                <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">Good to know</h2>
                <FaqSection faqs={faqs} />
              </section>
            )}

            {/* Related providers strip */}
            {relatedSection}
          </div>

          {/* Right column — sticky booking card */}
          <div className="lg:col-span-5 xl:col-span-4" id="booking-rail">
            <BookingCard
              providerName={p.name}
              providerId={p.id}
              providerSlug={p.slug}
              citySlug={p.citySlug}
              categorySlug={p.categorySlug}
              googleRating={p.googleRating}
              googleReviewCount={p.googleReviewCount}
              phone={p.phone}
              whatsapp={p.whatsapp}
              website={p.website}
              isClaimed={p.isClaimed}
              address={p.address}
              googleMapsUri={p.googleMapsUri}
              directionsUrl={
                p.address
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.address}`)}`
                  : undefined
              }
              primaryCtaLabel={primaryCtaLabel}
              primaryCtaHref={primaryCtaHref}
              primaryCtaType={p.phone ? "call" : p.whatsapp ? "whatsapp" : p.website ? "website" : "claim_listing"}
            />
          </div>
        </div>
      </div>

      <StickyBottomBar
        watchElementId="booking-rail"
        providerName={p.name}
        providerId={p.id}
        providerSlug={p.slug}
        citySlug={p.citySlug}
        categorySlug={p.categorySlug}
        isClaimed={p.isClaimed}
        googleRating={p.googleRating}
        googleReviewCount={p.googleReviewCount}
        ctaLabel={primaryCtaLabel}
        ctaHref={primaryCtaHref}
        ctaType={p.phone ? "call" : p.whatsapp ? "whatsapp" : p.website ? "website" : "claim_listing"}
      />
    </>
  );
}
