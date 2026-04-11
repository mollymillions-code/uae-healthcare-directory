/**
 * Condition-page JSON-LD helpers.
 *
 * Kept in a separate file from `src/lib/seo.ts` so Item 4 can ship
 * without touching the existing provider/facet helpers. Consumers are
 * the city × condition matching pages at
 * `src/app/(directory)/directory/[city]/condition/[condition]/page.tsx`
 * and its Arabic mirror.
 *
 * Discipline (Codex Rec 7 + Item 2 schema rules):
 *   - `MedicalCondition` populates `possibleTreatment`,
 *     `typicalTest`, `associatedAnatomy`, `riskFactor` ONLY when data
 *     is present. Never invent.
 *   - `ItemList` wraps the matched providers/doctors so Google can
 *     surface them as rich results.
 *   - `BreadcrumbList` items are `WebPage` objects with `@id`, not
 *     bare strings (Item 2 anchor discipline).
 *   - Every node carries an `@id` anchored to the canonical URL so
 *     the node graph references resolve.
 */

import type { LocalCity, LocalProvider } from "@/lib/data";
import type { ConditionSpecialtyDetail } from "@/lib/constants/condition-specialty-map";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export interface ConditionPageSchemaInput {
  detail: ConditionSpecialtyDetail;
  city: LocalCity;
  providers: LocalProvider[];
  faqs: { question: string; answer: string }[];
  breadcrumbs: { name: string; url?: string }[];
  canonicalUrl: string;
  /** Set when the page is an Arabic mirror — drives `inLanguage`. */
  locale?: "en-AE" | "ar-AE";
}

/**
 * Compose the full node graph for a condition matching page. Returns
 * an array of schema.org objects — caller injects each via `<JsonLd />`.
 *
 * Ordering convention (webpage first, entities last) matches the
 * `generateFullProviderSchema` shape in `src/lib/seo.ts`.
 */
export function generateConditionPageSchema(
  input: ConditionPageSchemaInput,
): Record<string, unknown>[] {
  const { detail, city, providers, faqs, breadcrumbs, canonicalUrl, locale } = input;
  const base = getBaseUrl();
  const webpageId = `${canonicalUrl}#webpage`;
  const conditionId = `${canonicalUrl}#condition`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const itemListId = `${canonicalUrl}#providers`;
  const inLang = locale ?? "en-AE";

  const nodes: Record<string, unknown>[] = [];

  // 1. MedicalWebPage wrapper — declares the page, its language, and
  //    its `about` link to the condition entity.
  nodes.push({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: `${detail.name} Treatment in ${city.name}`,
    inLanguage: [inLang],
    about: { "@id": conditionId },
    breadcrumb: { "@id": breadcrumbId },
    mainContentOfPage: { "@id": itemListId },
    lastReviewed: new Date().toISOString().split("T")[0],
    reviewedBy: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
    },
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "UAE Open Healthcare Directory by Zavis",
      url: base,
    },
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
  });

  // 2. MedicalCondition entity — only emit fields with real data.
  const conditionNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    "@id": conditionId,
    name: detail.name,
    ...(detail.nameAr ? { alternateName: detail.nameAr } : {}),
    description: detail.introEn,
  };
  if (detail.possibleTreatments && detail.possibleTreatments.length > 0) {
    conditionNode.possibleTreatment = detail.possibleTreatments.map((t) => ({
      "@type": "MedicalTherapy",
      name: t,
    }));
  }
  if (detail.relatedTests && detail.relatedTests.length > 0) {
    conditionNode.typicalTest = detail.relatedTests.map((t) => ({
      "@type": "MedicalTest",
      name: t,
    }));
  }
  if (detail.anatomy) {
    conditionNode.associatedAnatomy = {
      "@type": "AnatomicalStructure",
      name: detail.anatomy,
    };
  }
  if (detail.riskFactors && detail.riskFactors.length > 0) {
    conditionNode.riskFactor = detail.riskFactors.map((r) => ({
      "@type": "MedicalRiskFactor",
      name: r,
    }));
  }
  if (detail.symptomsEn && detail.symptomsEn.length > 0) {
    conditionNode.signOrSymptom = detail.symptomsEn.map((s) => ({
      "@type": "MedicalSignOrSymptom",
      name: s,
    }));
  }
  nodes.push(conditionNode);

  // 3. ItemList of matched providers. Re-use the light-weight
  //    MedicalOrganization projection rather than the full schema so
  //    the page doesn't balloon past a reasonable JSON-LD size.
  if (providers.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": itemListId,
      name: `${detail.name} providers in ${city.name}`,
      numberOfItems: providers.length,
      itemListElement: providers.slice(0, 20).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${base}/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`,
        item: {
          "@type": "MedicalOrganization",
          name: p.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: p.address,
            addressLocality: city.name,
            addressCountry: "AE",
          },
          ...(p.googleRating && Number(p.googleRating) >= 3 && p.googleReviewCount >= 3
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: p.googleRating,
                  reviewCount: p.googleReviewCount,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        },
      })),
    });
  }

  // 4. BreadcrumbList — re-use existing helper, re-anchor @id.
  const bc = breadcrumbSchema(breadcrumbs) as Record<string, unknown>;
  bc["@id"] = breadcrumbId;
  nodes.push(bc);

  // 5. FAQPage — conditional.
  if (faqs.length > 0) {
    nodes.push(faqPageSchema(faqs));
  }

  return nodes;
}

/**
 * Helper for building the standard 8-question FAQ set Part C asks for.
 * Pure — derives every answer from the condition detail + live count.
 * Returns English; caller may build Arabic equivalents inline.
 */
export function generateConditionFaqs(
  detail: ConditionSpecialtyDetail,
  city: LocalCity,
  providerCount: number,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const specialtyLabels = detail.specialties.slice(0, 3).join(", ");

  faqs.push({
    question: `How many ${detail.name.toLowerCase()} specialists are there in ${city.name}?`,
    answer: `According to the UAE Open Healthcare Directory, there are approximately ${providerCount} verified providers in ${city.name} that treat ${detail.name.toLowerCase()}, spanning specialties such as ${specialtyLabels}. Data from official UAE health authority registers, last verified March 2026.`,
  });
  faqs.push({
    question: `Which specialists treat ${detail.name.toLowerCase()} in ${city.name}?`,
    answer: `${detail.name} is typically managed by ${specialtyLabels}. In ${city.name} you can browse all relevant providers filtered by specialty, rating, accepted insurance and neighbourhood.`,
  });
  if (detail.insuranceNotesEn) {
    faqs.push({
      question: `Does Thiqa or Daman cover ${detail.name.toLowerCase()} treatment in ${city.name}?`,
      answer: detail.insuranceNotesEn,
    });
  }
  if (detail.urgentSignsEn && detail.urgentSignsEn.length > 0) {
    faqs.push({
      question: `When should I go to the emergency room for ${detail.name.toLowerCase()}?`,
      answer: `Seek urgent care at the nearest ${city.name} emergency department (or call 999) if you experience: ${detail.urgentSignsEn.join("; ")}. All DHA/DOH-licensed emergency departments triage life-threatening symptoms immediately regardless of insurance status.`,
    });
  }
  if (detail.symptomsEn && detail.symptomsEn.length > 0) {
    faqs.push({
      question: `What are the common symptoms of ${detail.name.toLowerCase()}?`,
      answer: `Typical symptoms include: ${detail.symptomsEn.join("; ")}. A formal diagnosis requires evaluation by a licensed ${detail.specialties[0] ?? "healthcare"} provider.`,
    });
  }
  faqs.push({
    question: `How much does ${detail.name.toLowerCase()} treatment cost in ${city.name}?`,
    answer: `Treatment costs vary based on diagnosis, procedure complexity, provider tier and insurance coverage. Most providers in ${city.name} publish transparent cash-rate pricing alongside their insurance networks. Use each provider's listing to view services and contact details.`,
  });
  faqs.push({
    question: `Can I book an appointment online for ${detail.name.toLowerCase()} in ${city.name}?`,
    answer: `Many providers in ${city.name} accept phone, web or app-based booking. Walk-in appointments are available at urgent-care clinics and some multi-specialty centres. Call the provider directly using the contact details on their listing page.`,
  });
  if (detail.possibleTreatments && detail.possibleTreatments.length > 0) {
    faqs.push({
      question: `What are the treatment options for ${detail.name.toLowerCase()}?`,
      answer: `Common evidence-based options include ${detail.possibleTreatments.join(", ")}. Your consultant will recommend a plan based on clinical assessment, imaging and relevant test results.`,
    });
  }
  return faqs;
}
