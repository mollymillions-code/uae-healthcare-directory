/**
 * AEO / LLM Search Optimization — Schema.org generators & natural language content
 *
 * Every page emits structured data that LLMs can parse and cite.
 * Every listing has natural language paragraphs (not just data tables).
 * Every facet page has unique H1, meta, and structured data.
 */

import { getBaseUrl } from "./helpers";
import type { LocalProvider, LocalCategory, LocalCity, LocalArea } from "./data";

// ─── Schema.org Generators ─────────────────────────────────────────────────────

export function medicalOrganizationSchema(
  provider: LocalProvider,
  city: LocalCity,
  category: LocalCategory,
  area?: LocalArea | null,
  citySlug?: string
) {
  const resolvedCitySlug = citySlug || city.slug;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${getBaseUrl()}/directory/${city.slug}/${category.slug}/${provider.slug}`,
    name: provider.name,
    url: `${getBaseUrl()}/directory/${city.slug}/${category.slug}/${provider.slug}`,
    telephone: provider.phone,
    email: provider.email || undefined,
    description: provider.description,
    medicalSpecialty: provider.services.length > 0 ? provider.services[0] : category.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: provider.address,
      addressLocality: area?.name || city.name,
      addressRegion: city.emirate,
      addressCountry: "AE",
    },
    ...(parseFloat(provider.latitude) !== 0 && parseFloat(provider.longitude) !== 0 ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: parseFloat(provider.latitude),
        longitude: parseFloat(provider.longitude),
      },
    } : {}),
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Health Authority License",
      recognizedBy: {
        "@type": "Organization",
        name: getRegulator(resolvedCitySlug),
      },
    },
    isBasedOn: "Official UAE health authority licensed facilities register",
    ...(provider.googleRating && Number(provider.googleRating) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: provider.googleRating,
            bestRating: "5",
            worstRating: "1",
            reviewCount: provider.googleReviewCount || 1,
          },
        }
      : {}),
    ...(provider.operatingHours
      ? {
          openingHoursSpecification: Object.entries(provider.operatingHours).map(
            ([day, hours]) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: DAY_NAMES[day] || day,
              opens: hours.open,
              closes: hours.close,
            })
          ),
        }
      : {}),
    availableService: provider.services.map((s) => ({
      "@type": "MedicalProcedure",
      name: s,
    })),
    ...(provider.insurance.length > 0
      ? {
          paymentAccepted: provider.insurance.join(", "),
        }
      : {}),
    dateModified: provider.lastVerified || new Date().toISOString().split("T")[0],
  };
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
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function itemListSchema(
  name: string,
  providers: LocalProvider[],
  cityName: string,
  baseUrl?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: providers.length,
    itemListElement: providers.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalBusiness",
        ...(baseUrl ? { "@id": `${baseUrl}/directory/${p.citySlug}/${p.categorySlug}/${p.slug}` } : {}),
        name: p.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: p.address,
          addressLocality: cityName,
          addressCountry: "AE",
        },
        ...(p.googleRating && Number(p.googleRating) > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: p.googleRating,
                reviewCount: p.googleReviewCount || 1,
              },
            }
          : {}),
      },
    })),
  };
}

export function organizationSchema() {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zavis",
    url: base,
    description:
      "AI-powered patient success platform and healthcare intelligence for the UAE",
    logo: {
      "@type": "ImageObject",
      url: `${base}/logo.png`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@zavis.ai",
      contactType: "customer service",
    },
    foundingDate: "2025",
    knowsAbout: [
      "UAE healthcare",
      "Dubai Health Authority",
      "Department of Health Abu Dhabi",
      "MOHAP",
      "UAE health insurance",
      "Healthcare directory",
      "Medical facilities UAE",
    ],
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
    sameAs: [base],
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

// ─── Natural Language Content Generators ────────────────────────────────────────

/**
 * Generate a natural language paragraph about a provider.
 * LLMs cite pages that answer questions in complete sentences.
 */
export function generateProviderParagraph(
  provider: LocalProvider,
  city: LocalCity,
  category: LocalCategory,
  area?: LocalArea | null
): string {
  const parts: string[] = [];

  // Opening sentence
  const locationDesc = area
    ? `${area.name}, ${city.name}`
    : city.name;

  parts.push(
    `${provider.name} is a ${provider.isVerified ? "verified " : ""}${category.name.toLowerCase().replace(/s$/, "")} located in ${locationDesc}, United Arab Emirates.`
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
  topProvider?: LocalProvider
): string {
  const locationDesc = area ? `${area.name}, ${city.name}` : city.name;

  let answer = `According to the UAE Open Healthcare Directory, there are ${providerCount} ${category.name.toLowerCase()} in ${locationDesc}, UAE.`;

  if (topProvider && topProvider.googleRating && Number(topProvider.googleRating) > 0) {
    const reviewPart = topProvider.googleReviewCount
      ? ` based on ${topProvider.googleReviewCount.toLocaleString()} patient reviews`
      : "";
    answer += ` The highest-rated is ${topProvider.name} with a ${topProvider.googleRating}-star Google rating${reviewPart}.`;
  } else if (topProvider) {
    answer += ` Providers include ${topProvider.name} and others.`;
  }

  answer += ` All listings include contact details, operating hours, accepted insurance plans, and directions. Healthcare in ${city.name} is regulated by the ${getRegulator(city.slug)}. Data sourced from official government registers, last verified March 2026.`;

  return answer;
}

// ─── UAE Pricing Benchmarks ────────────────────────────────────────────────────

/**
 * Returns typical consultation price range (AED) for a category in a city.
 */
function getCategoryPriceRange(categorySlug: string, citySlug: string): string {
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
  providerCount: number
): { question: string; answer: string }[] {
  const loc = area ? `${area.name}, ${city.name}` : city.name;
  const catLower = category.name.toLowerCase();
  const priceRange = getCategoryPriceRange(category.slug, city.slug);
  const insuranceContext = getCityInsuranceContext(city.slug);

  return [
    {
      question: `How many ${catLower} are there in ${loc}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${providerCount} ${catLower} listed in ${loc}, UAE. Browse the UAE Open Healthcare Directory to compare providers by rating, insurance acceptance, and services offered.`,
    },
    {
      question: `How do I find ${catLower} in ${loc}?`,
      answer: `Browse ${providerCount} ${catLower} in ${loc} on the UAE Open Healthcare Directory. Compare providers by services offered, accepted insurance plans, operating hours, and patient reviews where available. Typical wait times for a GP walk-in are 15–45 minutes; specialist appointments can usually be booked within 1–7 days.`,
    },
    {
      question: `Do ${catLower} in ${loc} accept insurance?`,
      answer: `Most ${catLower} in ${loc} accept major UAE insurance plans. ${insuranceContext} Check individual listings on the UAE Open Healthcare Directory for specific insurance acceptance.`,
    },
    {
      question: `How do I book an appointment at a ${catLower.replace(/s$/, "")} in ${loc}?`,
      answer: `You can book by calling the provider directly using the phone number on their listing page in the UAE Open Healthcare Directory, or visit their website for online booking. Many ${catLower} in ${loc} also accept walk-in appointments. Emergency care is available 24/7 with immediate triage; non-critical cases are typically seen within 30–120 minutes.`,
    },
    {
      question: `How much does a ${catLower.replace(/s$/, "")} consultation cost in ${loc}?`,
      answer: `Typical prices for ${catLower} in ${loc} are ${priceRange}. Prices can vary depending on the specific provider, procedure complexity, and whether you are paying out-of-pocket or through insurance. Government and semi-government facilities tend to charge on the lower end of the range. Always confirm fees with the provider before your visit.`,
    },
    {
      question: `Which insurance plans are accepted by ${catLower} in ${loc}?`,
      answer: `${insuranceContext} Many ${catLower} in ${loc} also accept international plans for visitors and expatriates. Use the insurance filter on individual provider listing pages on the UAE Open Healthcare Directory to confirm which plans a specific clinic or hospital accepts.`,
    },
  ];
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

function getRegulator(citySlug: string): string {
  if (citySlug === "dubai") return "Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "Department of Health Abu Dhabi (DOH)";
  return "Ministry of Health and Prevention (MOHAP)";
}
