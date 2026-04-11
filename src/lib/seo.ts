/**
 * AEO / LLM Search Optimization — Schema.org generators & natural language content
 *
 * Every page emits structured data that LLMs can parse and cite.
 * Every listing has natural language paragraphs (not just data tables).
 * Every facet page has unique H1, meta, and structured data.
 */

import { getBaseUrl } from "./helpers";
import type { LocalProvider, LocalCategory, LocalCity, LocalArea } from "./data";

// ─── SEO Truncation Helpers ───────────────────────────────────────────────────

/** Truncate a title to fit within maxLen, respecting word boundaries */
export function truncateTitle(title: string, maxLen = 58): string {
  if (title.length <= maxLen) return title;
  const lastSpace = title.lastIndexOf(' ', maxLen);
  return lastSpace > maxLen * 0.6 ? title.slice(0, lastSpace) : title.slice(0, maxLen);
}

/** Truncate a description to fit within maxLen, adding ellipsis at word boundary */
export function truncateDescription(desc: string, maxLen = 155): string {
  if (desc.length <= maxLen) return desc;
  const lastSpace = desc.lastIndexOf(' ', maxLen);
  return (lastSpace > maxLen * 0.7 ? desc.slice(0, lastSpace) : desc.slice(0, maxLen)) + '...';
}

// ─── Schema.org Generators ─────────────────────────────────────────────────────

export function medicalOrganizationSchema(
  provider: LocalProvider,
  city: LocalCity,
  category: LocalCategory,
  area?: LocalArea | null,
  citySlug?: string,
  options?: { countryCode?: string; countryPrefix?: string; currency?: string; regulators?: string[] }
) {
  // Map category slugs to the most specific schema.org subtype
  const schemaTypeMap: Record<string, string> = {
    hospitals: "Hospital",
    clinics: "MedicalClinic",
    dental: "Dentist",
    pharmacy: "Pharmacy",
    ophthalmology: "MedicalClinic",
    "mental-health": "MedicalClinic",
    "home-healthcare": "MedicalBusiness",
    "labs-diagnostics": "DiagnosticLab",
    "medical-equipment": "MedicalBusiness",
  };
  const schemaType = schemaTypeMap[category.slug] || "MedicalBusiness";

  const resolvedCitySlug = citySlug || city.slug;
  const countryCode = options?.countryCode ?? "AE";
  const countryPrefix = options?.countryPrefix;
  const currency = options?.currency ?? "AED";
  const base = getBaseUrl();
  const directoryRoot = countryPrefix ? `/${countryPrefix}/directory` : "/directory";
  const providerUrl = `${base}${directoryRoot}/${city.slug}/${category.slug}/${provider.slug}`;
  const lat = parseFloat(provider.latitude);
  const lng = parseFloat(provider.longitude);
  const hasValidCoords = lat !== 0 && lng !== 0;
  const ratingVal = Number(provider.googleRating);
  const hasValidRating = ratingVal > 0 && (provider.googleReviewCount ?? 0) > 0;

  // Build image field. Every entry must be a real absolute http(s) URL.
  // We REJECT bare Google photo_reference tokens (which leaked into GCC
  // coverImageUrl from the legacy enrichment pipeline) because they are
  // not dereferenceable by Google's structured-data crawler and produce
  // invalid `image` fields in JSON-LD.
  const isValidImageUrl = (u: unknown): u is string =>
    typeof u === "string" && /^https?:\/\//i.test(u);
  const imageUrls: string[] = [];
  if (provider.galleryPhotos && provider.galleryPhotos.length > 0) {
    for (const p of provider.galleryPhotos.slice(0, 6)) {
      if (isValidImageUrl(p.url)) imageUrls.push(p.url);
    }
  } else if (provider.photos && provider.photos.length > 0) {
    for (const u of provider.photos.slice(0, 3)) {
      if (isValidImageUrl(u)) imageUrls.push(u);
    }
  } else if (isValidImageUrl(provider.coverImageUrl)) {
    imageUrls.push(provider.coverImageUrl);
  }

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": providerUrl,
    name: provider.name,
    url: providerUrl,
    // Omit empty fields — Google flags empty string description/telephone as low quality
    ...(provider.phone ? { telephone: provider.phone } : {}),
    ...(provider.email ? { email: provider.email } : {}),
    ...(provider.description ? { description: provider.description } : {}),
    medicalSpecialty: (provider.services && provider.services.length > 0) ? provider.services[0] : category.name,
    isAcceptingNewPatients: true,
    address: {
      "@type": "PostalAddress",
      streetAddress: provider.address,
      addressLocality: area?.name || city.name,
      addressRegion: city.emirate,
      addressCountry: countryCode.toUpperCase(),
    },
    ...(hasValidCoords ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: lat,
        longitude: lng,
      },
      hasMap: `https://www.google.com/maps?q=${lat},${lng}`,
    } : {}),
    ...(imageUrls.length > 0 ? {
      image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
    } : {}),
    ...((() => {
      // Combine legacy amenities with Google's accessibility options into a unified amenityFeature array
      const features: Array<{ "@type": string; name: string; value: boolean }> = [];
      if (provider.amenities && provider.amenities.length > 0) {
        for (const a of provider.amenities) {
          features.push({ "@type": "LocationFeatureSpecification", name: a, value: true });
        }
      }
      const access = provider.accessibilityOptions;
      if (access?.wheelchairAccessibleEntrance) {
        features.push({
          "@type": "LocationFeatureSpecification",
          name: "Wheelchair-accessible entrance",
          value: true,
        });
      }
      if (access?.wheelchairAccessibleParking) {
        features.push({
          "@type": "LocationFeatureSpecification",
          name: "Wheelchair-accessible parking",
          value: true,
        });
      }
      if (access?.wheelchairAccessibleRestroom) {
        features.push({
          "@type": "LocationFeatureSpecification",
          name: "Wheelchair-accessible restroom",
          value: true,
        });
      }
      if (access?.wheelchairAccessibleSeating) {
        features.push({
          "@type": "LocationFeatureSpecification",
          name: "Wheelchair-accessible seating",
          value: true,
        });
      }
      return features.length > 0 ? { amenityFeature: features } : {};
    })()),
    ...(provider.phone ? {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: provider.phone,
        contactType: "appointment",
        availableLanguage: provider.languages.length > 0
          ? provider.languages.map((lang) => ({ "@type": "Language", name: lang }))
          : undefined,
      },
    } : {}),
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Health Authority License",
      recognizedBy: {
        "@type": "Organization",
        name: options?.regulators ? options.regulators.join(", ") : getRegulator(resolvedCitySlug),
      },
    },
    ...(hasValidRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: provider.googleRating,
            bestRating: "5",
            worstRating: "1",
            reviewCount: provider.googleReviewCount,
          },
        }
      : {}),
    ...((() => {
      // Prefer rich Google structured periods (openingHoursPeriods) when available.
      // Falls back to the legacy provider.operatingHours object.
      // Both formats are filtered to drop incomplete entries — Google's Rich Results
      // Test rejects entries with null opens/closes.
      const dayOfWeekArr = [
        "https://schema.org/Sunday",
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Friday",
        "https://schema.org/Saturday",
      ];
      const fmt = (h: number, m: number) =>
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (provider.openingHoursPeriods && provider.openingHoursPeriods.length > 0) {
        const specs = provider.openingHoursPeriods
          .filter((p) => p.open && (p.close || p.open.hour === 0))
          .map((p) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: dayOfWeekArr[p.open.day] || dayOfWeekArr[0],
            opens: fmt(p.open.hour, p.open.minute || 0),
            closes: p.close
              ? fmt(p.close.hour, p.close.minute || 0)
              : "23:59",
          }));
        return specs.length > 0 ? { openingHoursSpecification: specs } : {};
      }
      if (provider.operatingHours) {
        const specs = Object.entries(provider.operatingHours)
          .filter(([, hours]) => hours && hours.open && hours.close)
          .map(([day, hours]) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: DAY_NAMES[day] || day,
            opens: hours.open,
            closes: hours.close,
          }));
        return specs.length > 0 ? { openingHoursSpecification: specs } : {};
      }
      return {};
    })()),
    availableService: (provider.services ?? []).map((s) => ({
      "@type": "MedicalProcedure",
      name: s,
    })),
    ...(provider.insurance.length > 0
      ? {
          paymentAccepted: provider.insurance.join(", "),
        }
      : {}),
    ...(provider.languages.length > 0
      ? {
          availableLanguage: provider.languages.map((lang) => ({
            "@type": "Language",
            name: lang,
          })),
          knowsLanguage: provider.languages,
        }
      : {}),
    ...(provider.website ? { sameAs: [provider.website] } : {}),
    currenciesAccepted: currency,
    priceRange: derivePriceRange(category.slug),
    dateModified: provider.lastVerified || new Date().toISOString().split("T")[0],
  };
}

/**
 * Derive a priceRange ($ to $$$$) from the provider category.
 * Previously hardcoded to "$$" for all 12,504 providers which Google flags as
 * a duplicate structured data signal.
 */
function derivePriceRange(categorySlug: string): string {
  const s = categorySlug.toLowerCase();
  if (s.includes("hospital")) return "$$$";
  if (s.includes("pharmacy") || s.includes("optical") || s.includes("optic")) return "$";
  if (s.includes("medical-equipment") || s.includes("home-healthcare")) return "$$";
  if (s.includes("aesthetic") || s.includes("cosmetic") || s.includes("plastic")) return "$$$$";
  if (s.includes("dental") || s.includes("dermatology") || s.includes("ophthalm")) return "$$$";
  if (s.includes("physio") || s.includes("diagnostic") || s.includes("lab")) return "$$";
  if (s.includes("clinic") || s.includes("medical")) return "$$";
  return "$$";
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: { "@type": "WebPage", "@id": item.url } } : {}),
    })),
  };
}

export function itemListSchema(
  name: string,
  providers: LocalProvider[],
  cityName: string,
  baseUrl?: string,
  options?: { countryCode?: string; countryPrefix?: string }
) {
  const base = baseUrl || getBaseUrl();
  const cCode = (options?.countryCode ?? "AE").toUpperCase();
  const directoryRoot = options?.countryPrefix ? `/${options.countryPrefix}/directory` : "/directory";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description: `Top ${providers.length} ${name} ranked by patient ratings and reviews`,
    numberOfItems: providers.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: providers.map((p, i) => {
      const ratingVal = Number(p.googleRating);
      const hasValidRating = ratingVal > 0 && (p.googleReviewCount ?? 0) > 0;
      const providerUrl = `${base}${directoryRoot}/${p.citySlug}/${p.categorySlug}/${p.slug}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        url: providerUrl,
        item: {
          "@type": "MedicalBusiness",
          "@id": providerUrl,
          name: p.name,
          url: providerUrl,
          ...(p.phone ? { telephone: p.phone } : {}),
          address: {
            "@type": "PostalAddress",
            streetAddress: p.address,
            addressLocality: cityName,
            addressCountry: cCode,
          },
          ...(hasValidRating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: p.googleRating,
                  bestRating: "5",
                  worstRating: "1",
                  reviewCount: p.googleReviewCount,
                },
              }
            : {}),
          ...(p.services.length > 0 ? {
            medicalSpecialty: p.services[0],
          } : {}),
        },
      };
    }),
  };
}

/**
 * Generate an ItemList schema specifically for category listing pages.
 * Includes richer data per provider for Google carousel/list display.
 */
export function providerListSchema(
  providers: LocalProvider[],
  categoryName: string,
  cityName: string,
  options?: { countryCode?: string; countryPrefix?: string }
) {
  return itemListSchema(
    `${categoryName} in ${cityName}`,
    providers,
    cityName,
    getBaseUrl(),
    options
  );
}

export function organizationSchema() {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zavis",
    url: base,
    description:
      "AI-powered patient success platform and healthcare intelligence for the GCC",
    logo: {
      "@type": "ImageObject",
      url: `${base}/favicon.png`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@zavis.ai",
      contactType: "customer service",
    },
    foundingDate: "2025",
    knowsAbout: [
      "GCC healthcare",
      "Healthcare directory",
      "Medical facilities",
      "Health insurance",
      "Patient success",
      "Healthcare intelligence",
    ],
    areaServed: [
      { "@type": "Country", name: "United Arab Emirates" },
      { "@type": "Country", name: "Qatar" },
      { "@type": "Country", name: "Saudi Arabia" },
      { "@type": "Country", name: "Bahrain" },
      { "@type": "Country", name: "Kuwait" },
    ],
    sameAs: [
      "https://www.linkedin.com/company/zavisai/",
      "https://www.instagram.com/heyzavis",
    ],
  };
}

export function speakableSchema(cssSelectors: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: cssSelectors,
    },
  };
}

export function medicalWebPageSchema(
  name: string,
  description: string,
  lastReviewed: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name,
    description,
    lastReviewed,
    reviewedBy: {
      "@type": "Organization",
      name: "Zavis",
      url: getBaseUrl(),
    },
  };
}

/**
 * Product + AggregateOffer schema for lab test pages.
 * Triggers price badge rich results in Google SERPs.
 */
export function labTestProductSchema(
  test: { name: string; slug: string; description: string; shortName: string },
  prices: Array<{ labName: string; price: number }>
): Record<string, unknown> {
  const base = getBaseUrl();
  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  const lowPrice = sortedPrices[0]?.price ?? 0;
  const highPrice = sortedPrices[sortedPrices.length - 1]?.price ?? 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: test.name,
    alternateName: test.shortName,
    description: test.description,
    category: "Medical Lab Test",
    url: `${base}/labs/test/${test.slug}`,
    brand: {
      "@type": "Organization",
      name: "UAE Diagnostic Laboratories",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice,
      highPrice,
      priceCurrency: "AED",
      offerCount: prices.length,
      availability: "https://schema.org/InStock",
      offers: sortedPrices.map((p) => ({
        "@type": "Offer",
        price: p.price,
        priceCurrency: "AED",
        seller: { "@type": "Organization", name: p.labName },
        availability: "https://schema.org/InStock",
      })),
    },
  };
}

// ─── Natural Language Content Generators ────────────────────────────────────────

/**
 * Generate a natural language paragraph about a provider.
 * LLMs cite pages that answer questions in complete sentences.
 */
export function generateProviderParagraph(
  provider: LocalProvider,
  city: LocalCity,
  category: LocalCategory,
  area?: LocalArea | null,
  countryName?: string
): string {
  const parts: string[] = [];
  const resolvedCountryName = countryName ?? "United Arab Emirates";

  // Opening sentence
  const locationDesc = area
    ? `${area.name}, ${city.name}`
    : city.name;

  parts.push(
    `${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} located in ${locationDesc}, ${resolvedCountryName}.`
  );

  // Services
  if (provider.services.length > 0) {
    const serviceList =
      provider.services.length <= 3
        ? provider.services.join(" and ")
        : `${provider.services.slice(0, -1).join(", ")}, and ${provider.services[provider.services.length - 1]}`;
    parts.push(`The facility offers services in ${serviceList}.`);
  }

  // Rating — only show if genuinely rated
  if (provider.googleRating && Number(provider.googleRating) > 0) {
    parts.push(
      `It holds a ${provider.googleRating}-star rating on Google based on ${provider.googleReviewCount?.toLocaleString()} patient reviews.`
    );
  }

  // Insurance
  if (provider.insurance.length > 0) {
    parts.push(
      `Accepted insurance providers include ${provider.insurance.slice(0, 4).join(", ")}${provider.insurance.length > 4 ? ", and others" : ""}.`
    );
  }

  // Languages
  if (provider.languages.length > 0) {
    parts.push(
      `Staff speak ${provider.languages.join(", ")}.`
    );
  }

  // Hours
  if (provider.operatingHours) {
    const monHours = provider.operatingHours.mon;
    if (monHours) {
      if (monHours.open === "00:00" && monHours.close === "23:59") {
        parts.push("The facility operates 24 hours a day, 7 days a week.");
      } else {
        parts.push(
          `Operating hours are typically ${monHours.open} to ${monHours.close} on weekdays.`
        );
      }
    }
  }

  // Contact
  if (provider.phone) {
    parts.push(`For appointments, call ${provider.phone}.`);
  }

  return parts.join(" ");
}

/**
 * Generate a natural language answer block for a facet page (city + area + category).
 */
export function generateFacetAnswerBlock(
  city: LocalCity,
  category: LocalCategory,
  area: LocalArea | null,
  providerCount: number,
  topProvider?: LocalProvider,
  options?: { countryName?: string; regulators?: string[] }
): string {
  const locationDesc = area ? `${area.name}, ${city.name}` : city.name;
  const resolvedCountryName = options?.countryName ?? "UAE";
  const directoryName = `${resolvedCountryName} Open Healthcare Directory`;
  const regulatorText = options?.regulators
    ? options.regulators.join(", ")
    : getRegulator(city.slug);

  let answer = `According to the ${directoryName}, there are ${providerCount} ${category.name.toLowerCase()} in ${locationDesc}, ${resolvedCountryName}.`;

  if (topProvider && topProvider.googleRating && Number(topProvider.googleRating) > 0) {
    const reviewPart = topProvider.googleReviewCount
      ? ` based on ${topProvider.googleReviewCount.toLocaleString()} patient reviews`
      : "";
    answer += ` The highest-rated is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating${reviewPart}.`;
  } else if (topProvider) {
    answer += ` Providers include ${topProvider.name} and others.`;
  }

  answer += ` All listings include contact details, operating hours, accepted insurance plans, and directions. Healthcare in ${city.name} is regulated by the ${regulatorText}. Data sourced from official government registers, last verified March 2026.`;

  return answer;
}

// ─── UAE Pricing Benchmarks ────────────────────────────────────────────────────

/**
 * Returns typical consultation price range (AED) for a category in a city.
 * Returns null for non-UAE countries (no reliable pricing data).
 */
function getCategoryPriceRange(categorySlug: string, citySlug: string, countryCode?: string): string | null {
  if (countryCode && countryCode !== "ae") return null;
  const isNorthern = !["dubai", "abu-dhabi", "al-ain", "sharjah"].includes(citySlug);

  const priceMap: Record<string, { dubai: string; abuDhabi: string; northern: string; sharjah: string }> = {
    clinics:             { dubai: "AED 150–300", abuDhabi: "AED 100–250", sharjah: "AED 100–200", northern: "AED 80–200" },
    hospitals:           { dubai: "AED 300–800", abuDhabi: "AED 250–700", sharjah: "AED 200–600", northern: "AED 150–500" },
    dental:              { dubai: "AED 200–500 for cleaning; AED 300–800 for fillings", abuDhabi: "AED 150–450 for cleaning; AED 250–700 for fillings", sharjah: "AED 130–400 for cleaning; AED 200–600 for fillings", northern: "AED 100–350 for cleaning; AED 150–500 for fillings" },
    dermatology:         { dubai: "AED 400–800", abuDhabi: "AED 350–700", sharjah: "AED 300–600", northern: "AED 250–550" },
    ophthalmology:       { dubai: "AED 350–700", abuDhabi: "AED 300–650", sharjah: "AED 250–550", northern: "AED 200–500" },
    cardiology:          { dubai: "AED 500–1,000", abuDhabi: "AED 450–900", sharjah: "AED 400–800", northern: "AED 300–700" },
    orthopedics:         { dubai: "AED 400–900", abuDhabi: "AED 350–800", sharjah: "AED 300–700", northern: "AED 250–600" },
    "mental-health":     { dubai: "AED 400–900 per session", abuDhabi: "AED 350–800 per session", sharjah: "AED 300–700 per session", northern: "AED 250–600 per session" },
    pediatrics:          { dubai: "AED 300–600", abuDhabi: "AED 250–550", sharjah: "AED 200–500", northern: "AED 150–450" },
    "ob-gyn":            { dubai: "AED 400–800", abuDhabi: "AED 350–750", sharjah: "AED 300–650", northern: "AED 250–550" },
    ent:                 { dubai: "AED 350–700", abuDhabi: "AED 300–650", sharjah: "AED 250–600", northern: "AED 200–500" },
    "fertility-ivf":     { dubai: "AED 800–2,000 (consultation); AED 15,000–35,000 per IVF cycle", abuDhabi: "AED 700–1,800 (consultation); AED 12,000–30,000 per IVF cycle", sharjah: "AED 600–1,500 (consultation); AED 10,000–28,000 per IVF cycle", northern: "AED 500–1,200 (consultation)" },
    physiotherapy:       { dubai: "AED 250–500 per session", abuDhabi: "AED 200–450 per session", sharjah: "AED 180–400 per session", northern: "AED 150–350 per session" },
    "nutrition-dietetics": { dubai: "AED 300–600", abuDhabi: "AED 250–500", sharjah: "AED 200–450", northern: "AED 150–400" },
    pharmacy:            { dubai: "varies by medication; generic drugs from AED 10–50", abuDhabi: "varies by medication; generic drugs from AED 10–50", sharjah: "varies by medication; generic drugs from AED 10–50", northern: "varies by medication; generic drugs from AED 10–50" },
    "labs-diagnostics":  { dubai: "CBC AED 50–150; blood panel AED 100–400", abuDhabi: "CBC AED 50–130; blood panel AED 90–350", sharjah: "CBC AED 40–120; blood panel AED 80–300", northern: "CBC AED 30–100; blood panel AED 70–250" },
    "radiology-imaging": { dubai: "X-ray AED 100–300; MRI AED 1,000–3,000; CT scan AED 700–2,000", abuDhabi: "X-ray AED 80–250; MRI AED 900–2,800; CT scan AED 600–1,800", sharjah: "X-ray AED 70–220; MRI AED 800–2,500; CT scan AED 500–1,600", northern: "X-ray AED 60–200; MRI AED 700–2,200; CT scan AED 400–1,400" },
    "home-healthcare":   { dubai: "AED 300–800 per home visit", abuDhabi: "AED 250–700 per home visit", sharjah: "AED 200–600 per home visit", northern: "AED 150–500 per home visit" },
    "alternative-medicine": { dubai: "AED 200–600 per session", abuDhabi: "AED 180–550 per session", sharjah: "AED 150–500 per session", northern: "AED 120–400 per session" },
    "cosmetic-plastic":  { dubai: "AED 500–2,000 (consultation); procedures from AED 3,000", abuDhabi: "AED 450–1,800 (consultation); procedures from AED 2,500", sharjah: "AED 400–1,500 (consultation); procedures from AED 2,000", northern: "AED 300–1,200 (consultation)" },
    neurology:           { dubai: "AED 500–1,000", abuDhabi: "AED 450–900", sharjah: "AED 400–800", northern: "AED 300–700" },
    urology:             { dubai: "AED 400–800", abuDhabi: "AED 350–750", sharjah: "AED 300–650", northern: "AED 250–550" },
    gastroenterology:    { dubai: "AED 450–900", abuDhabi: "AED 400–850", sharjah: "AED 350–750", northern: "AED 280–650" },
    oncology:            { dubai: "AED 600–1,500 (consultation)", abuDhabi: "AED 550–1,400 (consultation)", sharjah: "AED 500–1,200 (consultation)", northern: "AED 400–1,000 (consultation)" },
    "emergency-care":    { dubai: "AED 300–1,000", abuDhabi: "AED 250–900", sharjah: "AED 200–800", northern: "AED 150–700" },
    "wellness-spas":     { dubai: "AED 300–800 per session", abuDhabi: "AED 250–700 per session", sharjah: "AED 200–600 per session", northern: "AED 150–500 per session" },
    nephrology:          { dubai: "AED 450–900", abuDhabi: "AED 400–850", sharjah: "AED 350–750", northern: "AED 280–650" },
    "medical-equipment": { dubai: "varies by product", abuDhabi: "varies by product", sharjah: "varies by product", northern: "varies by product" },
  };

  const entry = priceMap[categorySlug];
  if (!entry) return "AED 300–800 for a specialist consultation";
  if (citySlug === "dubai") return entry.dubai;
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return entry.abuDhabi;
  if (citySlug === "sharjah") return entry.sharjah;
  if (isNorthern) return entry.northern;
  return entry.dubai;
}

/**
 * Returns the insurance mandate description for a city.
 */
function getCityInsuranceContext(citySlug: string): string {
  if (citySlug === "dubai") {
    return "Dubai mandates employer-provided health insurance under the DHA Essential Benefits Plan (since 2014). Major plans accepted include Daman, AXA, Cigna, MetLife, Bupa, Oman Insurance, Orient Insurance, and Allianz.";
  }
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") {
    return "Abu Dhabi mandates health insurance under the HAAD (now DOH) framework. UAE nationals are covered by Thiqa; expats are typically covered by Daman or employer plans. AXA, Cigna, MetLife, and Allianz are also widely accepted.";
  }
  if (citySlug === "sharjah") {
    return "Sharjah follows MOHAP guidelines. Daman, AXA, Cigna, MetLife, Orient Insurance, and Oman Insurance are widely accepted. Many employers offer group plans.";
  }
  return "MOHAP basic coverage applies in the Northern Emirates. Common plans include Daman, AXA, Cigna, Orient Insurance, and Oman Insurance. Check individual provider listings for plan-specific acceptance.";
}

/**
 * Generate FAQs for a facet page
 */
export function generateFacetFaqs(
  city: LocalCity,
  category: LocalCategory,
  area: LocalArea | null,
  providerCount: number,
  options?: { countryName?: string; countryCode?: string; regulators?: string[] }
): { question: string; answer: string }[] {
  const loc = area ? `${area.name}, ${city.name}` : city.name;
  const catLower = category.name.toLowerCase();
  const resolvedCountryName = options?.countryName ?? "UAE";
  const directoryName = `${resolvedCountryName} Open Healthcare Directory`;
  const priceRange = getCategoryPriceRange(category.slug, city.slug, options?.countryCode);
  const insuranceContext = options?.regulators
    ? `Healthcare in ${city.name} is regulated by ${options.regulators.join(", ")}. Check individual listings for specific insurance acceptance.`
    : getCityInsuranceContext(city.slug);

  const faqs: { question: string; answer: string }[] = [
    {
      question: `How many ${catLower} are there in ${loc}?`,
      answer: `According to the ${directoryName}, there are ${providerCount} ${catLower} listed in ${loc}, ${resolvedCountryName}. Browse the ${directoryName} to compare providers by rating, insurance acceptance, and services offered.`,
    },
    {
      question: `How do I find ${catLower} in ${loc}?`,
      answer: `Browse ${providerCount} ${catLower} in ${loc} on the ${directoryName}. Compare providers by services offered, accepted insurance plans, operating hours, and patient reviews where available. Typical wait times for a GP walk-in are 15–45 minutes; specialist appointments can usually be booked within 1–7 days.`,
    },
    {
      question: `Do ${catLower} in ${loc} accept insurance?`,
      answer: `Most ${catLower} in ${loc} accept major insurance plans. ${insuranceContext} Check individual listings on the ${directoryName} for specific insurance acceptance.`,
    },
    {
      question: `How do I book an appointment at a ${catLower.replace(/s$/, "")} in ${loc}?`,
      answer: `You can book by calling the provider directly using the phone number on their listing page in the ${directoryName}, or visit their website for online booking. Many ${catLower} in ${loc} also accept walk-in appointments. Emergency care is available 24/7 with immediate triage; non-critical cases are typically seen within 30–120 minutes.`,
    },
  ];

  // Only include pricing FAQ for UAE where we have reliable benchmarks
  if (priceRange) {
    faqs.push({
      question: `How much does a ${catLower.replace(/s$/, "")} consultation cost in ${loc}?`,
      answer: `Typical prices for ${catLower} in ${loc} are ${priceRange}. Prices can vary depending on the specific provider, procedure complexity, and whether you are paying out-of-pocket or through insurance. Government and semi-government facilities tend to charge on the lower end of the range. Always confirm fees with the provider before your visit.`,
    });
  }

  faqs.push({
    question: `Which insurance plans are accepted by ${catLower} in ${loc}?`,
    answer: `${insuranceContext} Many ${catLower} in ${loc} also accept international plans for visitors and expatriates. Use the insurance filter on individual provider listing pages on the ${directoryName} to confirm which plans a specific clinic or hospital accepts.`,
  });

  return faqs;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * WebSite schema with sitelinks searchbox — for homepage / directory root.
 * Google may render a sitelinks search box in SERPs.
 */
export function websiteWithSearchSchema() {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zavis",
    alternateName: "UAE Open Healthcare Directory",
    url: base,
    description:
      "AI-powered healthcare intelligence and open directory for the UAE. 12,500+ licensed providers across 8 cities.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/favicon.png`,
      },
    },
  };
}

/**
 * Generates an optimized meta title for a provider listing page.
 * Designed for higher CTR with rating, location, and value-add keywords.
 */
export function generateProviderMetaTitle(
  provider: LocalProvider,
  category: LocalCategory,
  city: LocalCity
): string {
  const rating = Number(provider.googleRating);
  const hasRating = rating > 0;
  const parts: string[] = [provider.name];

  if (hasRating) {
    parts.push(`${provider.googleRating}/5 Rating`);
  }

  parts.push(city.name);

  // Keep under ~60 chars for Google display
  const title = parts.join(" — ");
  if (title.length > 60) {
    return `${provider.name} — ${category.name} in ${city.name} | Zavis`;
  }
  return `${title} | Zavis`;
}

/**
 * Generates an optimized meta description for a provider listing page.
 * Designed for rich snippet display with structured information.
 */
export function generateProviderMetaDescription(
  provider: LocalProvider,
  category: LocalCategory,
  city: LocalCity,
  area?: LocalArea | null,
  options?: { countryName?: string; regulators?: string[] }
): string {
  const parts: string[] = [];
  const rating = Number(provider.googleRating);
  const hasRating = rating > 0;
  const loc = area ? `${area.name}, ${city.name}` : city.name;
  const resolvedCountryName = options?.countryName ?? "UAE";

  // Lead with rating if available
  if (hasRating) {
    parts.push(`${provider.googleRating}/5 stars (${provider.googleReviewCount?.toLocaleString()} reviews).`);
  }

  // Specialty
  parts.push(`${category.name} in ${loc}, ${resolvedCountryName}.`);

  // Insurance
  if (provider.insurance.length > 0) {
    const topInsurers = provider.insurance.slice(0, 3).join(", ");
    parts.push(`Accepts ${topInsurers}${provider.insurance.length > 3 ? " + more" : ""}.`);
  }

  // Hours snippet
  if (provider.operatingHours?.mon) {
    const mon = provider.operatingHours.mon;
    if (mon.open === "00:00" && mon.close === "23:59") {
      parts.push("Open 24/7.");
    } else {
      parts.push(`Hours: ${mon.open}–${mon.close}.`);
    }
  }

  // Phone CTA
  if (provider.phone) {
    parts.push(`Call ${provider.phone}.`);
  }

  // Regulator badge
  parts.push(`Licensed by ${options?.regulators ? options.regulators.join(", ") : getRegulator(city.slug)}.`);

  // Trim to ~155 chars for Google display
  let desc = parts.join(" ");
  if (desc.length > 160) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, "") + "...";
  }
  return desc;
}

// ─── Physician List Schema (for professional specialty pages) ────────────────

export function physicianListSchema(
  professionals: Array<{
    name: string;
    specialty: string;
    facility?: string;
    licenseType?: string;
  }>,
  specialty: string,
  city: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${specialty} in ${city}`,
    description: `Licensed ${specialty.toLowerCase()} professionals practicing in ${city}, sourced from the DHA Sheryan Medical Registry.`,
    numberOfItems: professionals.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: professionals.map((pro, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Physician",
        name: pro.name,
        medicalSpecialty: specialty,
        ...(pro.facility
          ? {
              worksFor: {
                "@type": "MedicalOrganization",
                name: pro.facility,
              },
            }
          : {}),
        ...(pro.licenseType
          ? {
              hasCredential: {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: pro.licenseType === "FTL"
                  ? "Full-Time License"
                  : pro.licenseType === "REG"
                  ? "Registered License"
                  : pro.licenseType,
                recognizedBy: {
                  "@type": "Organization",
                  name: "Dubai Health Authority (DHA)",
                },
              },
            }
          : {}),
        areaServed: {
          "@type": "City",
          name: city,
          containedInPlace: { "@type": "Country", name: "United Arab Emirates" },
        },
      },
    })),
  };
}

// ─── Insurance Agency Schema (for insurer detail pages) ──────────────────────

export function insuranceAgencySchema(
  profile: {
    name: string;
    slug: string;
    website: string;
    headquarters: string;
    foundedYear: number;
    type: string;
    regulators: string[];
    claimsPhone: string;
    keyFacts: string[];
    plans: Array<{
      name: string;
      tier: string;
      targetAudience: string;
      premiumRange: { min: number; max: number };
    }>;
  },
  stats: { totalProviders?: number; byCity?: Array<{ cityName: string }> } | null
): Record<string, unknown> {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    additionalType: "https://schema.org/InsuranceAgency",
    "@id": `${base}/insurance/${profile.slug}`,
    name: profile.name,
    url: `https://${profile.website}`,
    description: `${profile.name} is a ${profile.type} health insurance provider in the UAE. ${profile.keyFacts[0]}.`,
    foundingDate: String(profile.foundedYear),
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
    knowsLanguage: ["en", "ar"],
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.headquarters,
      addressCountry: "AE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: profile.claimsPhone,
      contactType: "claims",
      availableLanguage: ["en", "ar"],
    },
    ...(stats && stats.totalProviders
      ? {
          memberOf: {
            "@type": "ProgramMembership",
            name: `${profile.name} Provider Network`,
            description: `Network of ${stats.totalProviders.toLocaleString()} healthcare providers across ${stats.byCity?.length || 0} UAE cities`,
          },
        }
      : {}),
    makesOffer: profile.plans.map((plan) => ({
      "@type": "Service",
      name: `${profile.name} ${plan.name}`,
      description: `${plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} tier health insurance plan. ${plan.targetAudience}. Annual premium: AED ${plan.premiumRange.min.toLocaleString()}–${plan.premiumRange.max.toLocaleString()}.`,
      areaServed: {
        "@type": "Country",
        name: "United Arab Emirates",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "AED",
        price: plan.premiumRange.min,
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "AED",
          minPrice: plan.premiumRange.min,
          maxPrice: plan.premiumRange.max,
          unitText: "per year",
        },
      },
    })),
  };
}

// ─── Insurance Landing Page layered schema ─────────────────────────────────
//
// Used by the insurance-facet programmatic routes (city × insurer, city ×
// insurer × category, national insurer hub). Returns an array of JSON-LD
// nodes rather than a single object so the page can emit each through a
// separate <JsonLd /> mount without duplicating @context / wrapper noise.
//
// Nodes emitted:
//   - CollectionPage (wrapper with @id = canonical URL)
//   - ItemList of top providers (reuses itemListSchema)
//   - InsuranceAgency / Organization stub for the payer
//   - FAQPage
//   - BreadcrumbList
//
// AggregateRating is still gated inside itemListSchema at reviewCount > 0
// per-provider and is intentionally omitted at the CollectionPage level
// (Google has discouraged rating aggregation at the list level).

export interface InsuranceLandingPageInput {
  city: { name: string; slug: string; nameAr?: string };
  category?: { name: string; slug: string; nameAr?: string };
  insurer: {
    slug: string;
    nameEn: string;
    nameAr?: string;
    type: "carrier" | "TPA" | "gov";
    geoScope: string;
    editorialCopyEn?: string;
    website?: string;
  };
  providers: LocalProvider[];
  faqs: { question: string; answer: string }[];
  breadcrumbs: { name: string; url?: string }[];
  url: string;
  language?: "en" | "ar";
}

export function insuranceLandingPageSchema(
  input: InsuranceLandingPageInput
): Record<string, unknown>[] {
  const base = getBaseUrl();
  const { city, category, insurer, providers, faqs, breadcrumbs, url, language } = input;
  const lang = language ?? "en";
  const cityLabel = lang === "ar" && city.nameAr ? city.nameAr : city.name;
  const insurerLabel = lang === "ar" && insurer.nameAr ? insurer.nameAr : insurer.nameEn;
  const categoryLabel = category
    ? lang === "ar" && category.nameAr
      ? category.nameAr
      : category.name
    : null;

  const collectionName = categoryLabel
    ? `${categoryLabel} accepting ${insurerLabel} in ${cityLabel}`
    : `Healthcare providers accepting ${insurerLabel} in ${cityLabel}`;

  const listName = collectionName;

  const nodes: Record<string, unknown>[] = [];

  // 1. CollectionPage wrapper
  nodes.push({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: collectionName,
    inLanguage: lang === "ar" ? "ar-AE" : "en-AE",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: base,
      name: "Zavis — UAE Open Healthcare Directory",
    },
    about: {
      "@type": "MedicalBusiness",
      name: `Healthcare providers accepting ${insurerLabel}`,
      // Non-standard but crawled: signal the payer relationship.
      // Rich-results playback treats this as an entity link.
      acceptsInsurance: insurerLabel,
      areaServed: {
        "@type": "City",
        name: cityLabel,
        containedInPlace: { "@type": "Country", name: "United Arab Emirates" },
      },
    },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": `${url}#itemlist` },
  });

  // 2. ItemList (reuse existing helper, then layer @id so CollectionPage
  // can reference it).
  if (providers.length > 0) {
    const listSchema = itemListSchema(
      listName,
      providers.slice(0, 20),
      city.name,
      base,
    ) as Record<string, unknown>;
    nodes.push({ ...listSchema, "@id": `${url}#itemlist` });
  }

  // 3. InsuranceAgency stub — a minimal local node so the CollectionPage
  // can link to an entity, without duplicating the full
  // `insuranceAgencySchema()` used on the national hub.
  nodes.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    additionalType: "https://schema.org/InsuranceAgency",
    "@id": `${base}/insurance/${insurer.slug}#agency`,
    name: insurer.nameEn,
    ...(insurer.nameAr ? { alternateName: insurer.nameAr } : {}),
    url: `${base}/insurance/${insurer.slug}`,
    ...(insurer.website ? { sameAs: [insurer.website] } : {}),
    description: insurer.editorialCopyEn
      ? insurer.editorialCopyEn.slice(0, 500)
      : `${insurer.nameEn} health insurance — accepted network in ${cityLabel}.`,
    knowsLanguage: ["en", "ar"],
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
  });

  // 4. FAQPage
  if (faqs.length > 0) {
    nodes.push(faqPageSchema(faqs));
  }

  // 5. BreadcrumbList with @id anchor
  const bc = breadcrumbSchema(breadcrumbs) as Record<string, unknown>;
  nodes.push({ ...bc, "@id": `${url}#breadcrumb` });

  return nodes;
}

function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}
