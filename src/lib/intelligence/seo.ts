import { getBaseUrl } from "../helpers";
import type { JournalArticle } from "./types";
import { getJournalCategory } from "./categories";
import type { AuthorProfile, ReviewerProfile } from "./authors";

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildSameAs(
  ...urls: Array<string | undefined | null>
): string[] | undefined {
  const filtered = urls.filter((u): u is string => Boolean(u && u.length > 0));
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * `Person` JSON-LD for a Zavis editorial author profile page.
 *
 * Used by `/intelligence/author/[slug]` and as the `author` node embedded
 * inside the per-article schema stack (when `article.authorSlug` resolves
 * to a real `AuthorProfile` row).
 *
 * Notes:
 * - We always emit `@id` so other schema nodes (article, breadcrumb) can
 *   reference this person via `{ "@id": "..." }` instead of duplicating.
 * - `image` is only emitted when `photoConsent` is true — never serialise
 *   a photo URL the author has not consented to publish.
 * - `worksFor` and `publishingPrinciples` give Google the explicit
 *   institutional affiliation that Paper Gown's empty author archives lack.
 */
export function authorSchema(author: AuthorProfile, baseUrl?: string) {
  const base = baseUrl ?? getBaseUrl();
  const profileUrl = `${base}/intelligence/author/${author.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: author.name,
    ...(author.nameAr ? { alternateName: author.nameAr } : {}),
    url: profileUrl,
    jobTitle: author.role,
    description: author.bio,
    ...(author.email ? { email: `mailto:${author.email}` } : {}),
    ...(author.photoConsent && author.photoUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: author.photoUrl,
          },
        }
      : {}),
    sameAs: buildSameAs(
      author.linkedinUrl,
      author.twitterUrl,
      author.websiteUrl,
      author.orcidId
        ? `https://orcid.org/${author.orcidId.replace(/^https?:\/\/orcid\.org\//, "")}`
        : undefined
    ),
    worksFor: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis",
      url: base,
      publishingPrinciples: `${base}/editorial-policy`,
    },
    ...(author.expertise.length > 0
      ? { knowsAbout: author.expertise }
      : {}),
    publishingPrinciples: `${base}/editorial-policy`,
  };
}

/**
 * `Person` JSON-LD for an external clinical / policy / economic reviewer.
 *
 * Used by `/intelligence/reviewer/[slug]` and as the `reviewedBy` node
 * embedded inside `MedicalWebPage` schema on clinical Intelligence
 * articles. The licence-number identifier block is the single biggest
 * E-E-A-T leapfrog versus US competitors — no Zocdoc / Paper Gown
 * reviewer profile carries an emirate-issued licence identifier.
 */
export function reviewerSchema(
  reviewer: ReviewerProfile,
  baseUrl?: string
) {
  const base = baseUrl ?? getBaseUrl();
  const profileUrl = `${base}/intelligence/reviewer/${reviewer.slug}`;

  // Emit one `identifier` PropertyValue per licence the reviewer has
  // explicitly consented to publish. This is the structured-data signal
  // Google uses for medical-professional verification under YMYL rules.
  const identifiers: Array<{
    "@type": "PropertyValue";
    propertyID: string;
    value: string;
  }> = [];
  if (reviewer.dhaLicenseNumber) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "DHA License",
      value: reviewer.dhaLicenseNumber,
    });
  }
  if (reviewer.dohLicenseNumber) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "DOH License",
      value: reviewer.dohLicenseNumber,
    });
  }
  if (reviewer.mohapLicenseNumber) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "MOHAP License",
      value: reviewer.mohapLicenseNumber,
    });
  }

  // Use the more specific `Physician` type for medical reviewers — Google
  // treats this as a stronger expertise signal on YMYL queries — and fall
  // back to plain `Person` for industry / policy / economic reviewers.
  const isPhysician =
    reviewer.reviewerType === "medical" &&
    Boolean(reviewer.dhaLicenseNumber || reviewer.dohLicenseNumber || reviewer.mohapLicenseNumber);

  return {
    "@context": "https://schema.org",
    "@type": isPhysician ? "Physician" : "Person",
    "@id": `${profileUrl}#person`,
    name: reviewer.name,
    ...(reviewer.nameAr ? { alternateName: reviewer.nameAr } : {}),
    url: profileUrl,
    jobTitle: reviewer.title,
    description: reviewer.bio,
    ...(reviewer.specialty ? { medicalSpecialty: reviewer.specialty } : {}),
    ...(reviewer.photoConsent && reviewer.photoUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: reviewer.photoUrl,
          },
        }
      : {}),
    ...(reviewer.institution
      ? {
          affiliation: {
            "@type": "Organization",
            name: reviewer.institution,
          },
        }
      : {}),
    sameAs: buildSameAs(
      reviewer.linkedinUrl,
      reviewer.orcidId
        ? `https://orcid.org/${reviewer.orcidId.replace(/^https?:\/\/orcid\.org\//, "")}`
        : undefined
    ),
    ...(identifiers.length > 0 ? { identifier: identifiers } : {}),
    ...(reviewer.expertise.length > 0
      ? { knowsAbout: reviewer.expertise }
      : {}),
  };
}

/**
 * `MedicalWebPage` JSON-LD stack for clinical / YMYL Intelligence articles.
 *
 * Emitted INSTEAD OF the plain `NewsArticle` schema when
 * `article.isClinical === true`. Carries:
 *  - `reviewedBy` → embedded `Person` / `Physician` node from `reviewerSchema()`
 *  - `lastReviewed` → honest `last_reviewed_at` (NOT `dateModified`)
 *  - `medicalAudience` → `Patient` (the public-facing audience)
 *  - `mainContentOfPage` → article body subject
 *  - `citation` → embedded ScholarlyArticle nodes for each numbered citation
 *
 * The legacy `articleSchema()` function below is unchanged for non-clinical
 * articles; clinical pages emit BOTH if you want belt-and-braces, but the
 * renderer only emits this one when `is_clinical=true`.
 */
export function clinicalArticleSchema(
  article: JournalArticle,
  author: AuthorProfile | null,
  reviewer: ReviewerProfile | null
) {
  const base = getBaseUrl();
  const category = getJournalCategory(article.category);
  const pageId = `${base}/intelligence/${article.slug}`;

  const citationNodes = (article.citations || []).map((c, i) => ({
    "@type": "ScholarlyArticle",
    "@id": `${pageId}#cite-${i + 1}`,
    name: c.label,
    url: c.url,
    ...(c.publisher
      ? {
          publisher: {
            "@type": "Organization",
            name: c.publisher,
          },
        }
      : {}),
    ...(c.doi ? { sameAs: `https://doi.org/${c.doi}` } : {}),
    ...(c.pubmedId
      ? {
          identifier: [
            {
              "@type": "PropertyValue",
              propertyID: "PubMed",
              value: c.pubmedId,
            },
          ],
        }
      : {}),
    ...(c.accessedAt ? { dateAccessed: c.accessedAt } : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${pageId}#webpage`,
    url: pageId,
    name: article.title,
    headline: article.title,
    description: article.excerpt,
    inLanguage: "en",
    isFamilyFriendly: true,
    datePublished: article.publishedAt,
    dateModified:
      article.lastReviewedAt ||
      article.updatedAt ||
      article.publishedAt,
    ...(article.lastReviewedAt
      ? { lastReviewed: article.lastReviewedAt }
      : {}),
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
    about: category?.name || article.category,
    keywords: article.tags.join(", "),
    ...(article.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: article.imageUrl,
            width: 1200,
            height: 630,
          },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: article.imageUrl,
          },
        }
      : {}),
    ...(author
      ? {
          author: authorSchema(author, base),
        }
      : {
          author: {
            "@type": "Person",
            name: article.author.name,
            ...(article.author.role ? { jobTitle: article.author.role } : {}),
          },
        }),
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis Healthcare Industry Insights",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/images/og-default.png`,
        width: 1200,
        height: 630,
      },
      publishingPrinciples: `${base}/editorial-policy`,
    },
    ...(reviewer
      ? {
          reviewedBy: reviewerSchema(reviewer, base),
        }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageId,
    },
    ...(citationNodes.length > 0 ? { citation: citationNodes } : {}),
  };
}

export function articleSchema(article: JournalArticle) {
  const base = getBaseUrl();
  const category = getJournalCategory(article.category);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author.name,
      ...(article.author.role ? { jobTitle: article.author.role } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Zavis Healthcare Industry Insights",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/images/og-default.png`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${base}/intelligence/${article.slug}`,
    },
    articleSection: category?.name || article.category,
    keywords: article.tags.join(", "),
    wordCount: Math.round(article.readTimeMinutes * 200),
    ...(article.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: article.imageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
  };
}

export function journalListingSchema(articles: JournalArticle[]) {
  const base = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Zavis Healthcare Industry Insights — Latest Articles",
    numberOfItems: articles.length,
    itemListElement: articles.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "NewsArticle",
        headline: a.title,
        url: `${base}/intelligence/${a.slug}`,
        datePublished: a.publishedAt,
        description: a.excerpt,
      },
    })),
  };
}

export function generateArticleFaqs(article: JournalArticle) {
  const category = getJournalCategory(article.category);
  const faqs: { question: string; answer: string }[] = [];

  // Generate contextual FAQs based on category
  switch (article.category) {
    case "regulatory":
      faqs.push({
        question: `What are the latest UAE healthcare regulations?`,
        answer: `${article.title}. ${article.excerpt} Read the full analysis on Zavis Healthcare Industry Insights.`,
      });
      break;
    case "new-openings":
      faqs.push({
        question: `What new healthcare facilities are opening in the UAE?`,
        answer: `${article.excerpt} Visit Zavis Healthcare Industry Insights for the latest openings and expansions across all Emirates.`,
      });
      break;
    case "financial":
      faqs.push({
        question: `What is the current state of UAE healthcare investment?`,
        answer: `${article.excerpt} Follow Zavis Healthcare Industry Insights for ongoing financial coverage of the healthcare sector.`,
      });
      break;
    case "technology":
      faqs.push({
        question: `What health tech innovations are being adopted in the UAE?`,
        answer: `${article.excerpt} Zavis Healthcare Industry Insights covers the latest technology deployments and startup activity.`,
      });
      break;
    default:
      faqs.push({
        question: `What is happening in UAE healthcare ${category?.name.toLowerCase() || "industry"}?`,
        answer: `${article.excerpt}`,
      });
  }

  return faqs;
}
