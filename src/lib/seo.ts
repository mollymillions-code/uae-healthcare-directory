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

  return [
    {
      question: `How many ${catLower} are there in ${loc}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${providerCount} ${catLower} listed in ${loc}, UAE. Browse the UAE Open Healthcare Directory to compare providers by rating, insurance acceptance, and services offered.`,
    },
    {
      question: `How do I find ${catLower} in ${loc}?`,
      answer: `Browse ${providerCount} ${catLower} in ${loc} on the UAE Open Healthcare Directory. Compare providers by services offered, accepted insurance plans, operating hours, and patient reviews where available.`,
    },
    {
      question: `Do ${catLower} in ${loc} accept insurance?`,
      answer: `Most ${catLower} in ${loc} accept major UAE insurance plans including Daman, Thiqa, AXA, Cigna, and Dubai Insurance Company. Check individual listings on the UAE Open Healthcare Directory for specific insurance acceptance.`,
    },
    {
      question: `How do I book an appointment at a ${catLower.replace(/s$/, "")} in ${loc}?`,
      answer: `You can book by calling the provider directly using the phone number on their listing page in the UAE Open Healthcare Directory, or visit their website for online booking. Many ${catLower} in ${loc} also accept walk-in appointments.`,
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
