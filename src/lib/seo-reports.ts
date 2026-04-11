/**
 * src/lib/seo-reports.ts
 *
 * Schema.org generators for the `/intelligence/reports/` route class.
 * Part of Zocdoc roadmap Item 6 — "What UAE Patients Want" annual report
 * scaffold. Kept in its own file so `src/lib/seo.ts` (the shared facility-
 * and directory-oriented SEO module) does not grow further. Also insulated
 * from Items 0 and 2 which are actively auditing `src/lib/seo.ts`.
 *
 * Emits a stacked set of JSON-LD nodes:
 *   - Report          (schema.org/Report, subtype of Article + CreativeWork)
 *   - Article         (fallback — Google still indexes on Article better
 *                      than Report; we emit both via @graph)
 *   - Organization    (Zavis as publisher)
 *   - BreadcrumbList  (Zavis > Intelligence > Reports > [title])
 *   - FAQPage         (methodology-oriented FAQs derived from the report's
 *                      data_source + sample_size + partner fields)
 *
 * All functions are pure — no DB access. Pass in a `ReportRow` shape and
 * the generated breadcrumb nodes can be consumed by the existing
 * <JsonLd /> injector at `src/components/seo/JsonLd.tsx`.
 *
 * Do NOT add fake fields (`isAcceptingNewPatients`-style overstatement).
 * See `docs/zocdoc-plans-reconciled.md` § Item 0. We only emit what the
 * report row actually has.
 */

export type ReportAuthorRef = {
  slug: string;
  name: string;
  role?: "author" | "editor" | "reviewer" | "data";
  jobTitle?: string;
};

export interface ReportRow {
  slug: string;
  title: string;
  titleAr?: string | null;
  subtitle?: string | null;
  subtitleAr?: string | null;
  headlineStat: string;
  headlineStatAr?: string | null;
  coverImageUrl?: string | null;
  pdfUrl?: string | null;
  releaseDate: string; // ISO YYYY-MM-DD
  methodology: string;
  methodologyAr?: string | null;
  dataSource: string;
  sampleSize?: string | null;
  pressReleaseUrl?: string | null;
  authors: ReportAuthorRef[];
  // Optional ISO timestamp for last edit — falls back to releaseDate.
  updatedAt?: string | null;
  // Optional ISO timestamp for original creation — falls back to releaseDate.
  createdAt?: string | null;
}

const PERIODICAL_NAME = "Zavis Intelligence Reports";
const PERIODICAL_ISSN_PLACEHOLDER: string | undefined = undefined; // TODO: assign once ISSN is issued.

function reportUrl(slug: string, baseUrl: string): string {
  return `${baseUrl}/intelligence/reports/${slug}`;
}

function toIsoDate(value: string): string {
  // Already an ISO date or full timestamp — trust it. Just trim to YYYY-MM-DD
  // when possible so Google sees a clean datePublished.
  if (!value) return value;
  if (value.length >= 10 && value[4] === "-" && value[7] === "-") {
    return value.slice(0, 10);
  }
  return value;
}

function methodologyFaqs(report: ReportRow) {
  const faqs: Array<{ question: string; answer: string }> = [];
  faqs.push({
    question: `What methodology did Zavis use for "${report.title}"?`,
    answer: report.methodology,
  });
  faqs.push({
    question: `What data sources back "${report.title}"?`,
    answer: report.dataSource,
  });
  if (report.sampleSize) {
    faqs.push({
      question: `What is the sample size for "${report.title}"?`,
      answer: `${report.sampleSize}. Zavis Intelligence Reports publish sample size disclosures alongside every release for full methodological transparency.`,
    });
  }
  faqs.push({
    question: `Is "${report.title}" free to download?`,
    answer:
      "Yes. Zavis Intelligence Reports are published open-access without a paywall, email gate, or registration. Journalists, researchers and healthcare operators can download the full PDF directly from the report page.",
  });
  faqs.push({
    question: `How can journalists cite "${report.title}"?`,
    answer: `Cite as: Zavis Intelligence Reports, "${report.title}", published ${toIsoDate(report.releaseDate)}. Press queries go to press@zavis.ai — the Zavis press team provides interview access, embedded analysts and embargo copies.`,
  });
  return faqs;
}

/**
 * Build the full stacked JSON-LD node list for a report page. Returns an
 * array so the page can splat it through <JsonLd data={node} /> in a loop,
 * or wrap it in a single @graph object (which is what Google prefers for
 * multi-entity pages).
 */
export function reportSchema(
  report: ReportRow,
  baseUrl: string
): Record<string, unknown>[] {
  const url = reportUrl(report.slug, baseUrl);
  const datePublished = toIsoDate(report.releaseDate);
  const dateModified = toIsoDate(report.updatedAt || report.releaseDate);
  const dateCreated = toIsoDate(report.createdAt || report.releaseDate);

  const publisher: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: "Zavis",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/favicon.png`,
    },
    sameAs: [
      "https://www.linkedin.com/company/zavis-ai",
      "https://twitter.com/zavis_ai",
    ],
  };

  const mainAuthors = report.authors.filter(
    (a) => !a.role || a.role === "author"
  );
  const authorNodes = (mainAuthors.length > 0 ? mainAuthors : report.authors).map(
    (a) => ({
      "@type": "Person",
      name: a.name,
      url: `${baseUrl}/intelligence/author/${a.slug}`,
      ...(a.jobTitle ? { jobTitle: a.jobTitle } : {}),
    })
  );

  const periodical: Record<string, unknown> = {
    "@type": "Periodical",
    name: PERIODICAL_NAME,
    publisher: { "@id": `${baseUrl}#organization` },
    ...(PERIODICAL_ISSN_PLACEHOLDER ? { issn: PERIODICAL_ISSN_PLACEHOLDER } : {}),
  };

  const datasetNode: Record<string, unknown> = {
    "@type": "Dataset",
    name: report.sampleSize || report.dataSource,
    description: report.dataSource,
    creator: { "@id": `${baseUrl}#organization` },
    license: `${baseUrl}/data-sources`,
  };

  // Primary node — schema.org/Report. Google indexes Report as a subtype
  // of Article, so this earns Article-style rich result eligibility.
  const reportNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Report",
    "@id": `${url}#report`,
    headline: report.title,
    name: report.title,
    ...(report.subtitle ? { alternativeHeadline: report.subtitle } : {}),
    description: report.headlineStat,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
      isPartOf: periodical,
    },
    author: authorNodes,
    publisher: { "@id": `${baseUrl}#organization` },
    creator: { "@id": `${baseUrl}#organization` },
    sourceOrganization: { "@id": `${baseUrl}#organization` },
    datePublished,
    dateCreated,
    dateModified,
    inLanguage: "en-AE",
    about: "UAE healthcare access, patient experience and provider supply",
    keywords: [
      "UAE healthcare",
      "UAE patient experience",
      "DHA",
      "DOH",
      "MOHAP",
      "Zavis Intelligence",
    ].join(", "),
    isBasedOn: datasetNode,
    ...(report.pdfUrl
      ? {
          encoding: {
            "@type": "MediaObject",
            contentUrl: report.pdfUrl,
            encodingFormat: "application/pdf",
          },
        }
      : {}),
    ...(report.coverImageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: report.coverImageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
    // Explicit publisher metadata so Google shows the imprint
    reportNumber: report.slug,
  };

  // Stacked Article node — Google + LLMs consume Article more reliably than
  // Report. Same fields, different @type.
  const articleNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: report.title,
    description: report.headlineStat,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: authorNodes,
    publisher: { "@id": `${baseUrl}#organization` },
    datePublished,
    dateModified,
    inLanguage: "en-AE",
    articleSection: "Reports",
    isPartOf: periodical,
    ...(report.coverImageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: report.coverImageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
  };

  // Breadcrumb
  const breadcrumbNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Zavis",
        item: { "@type": "WebPage", "@id": baseUrl },
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Intelligence",
        item: { "@type": "WebPage", "@id": `${baseUrl}/intelligence` },
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Reports",
        item: { "@type": "WebPage", "@id": `${baseUrl}/intelligence/reports` },
      },
      {
        "@type": "ListItem",
        position: 4,
        name: report.title,
        item: { "@type": "WebPage", "@id": url },
      },
    ],
  };

  // Methodology FAQs — Google rewards methodology transparency on data reports.
  const faqs = methodologyFaqs(report);
  const faqNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  // Publisher — standalone Organization node so the graph resolves.
  const publisherNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    ...publisher,
  };

  return [reportNode, articleNode, breadcrumbNode, faqNode, publisherNode];
}

/**
 * Schema for the `/intelligence/reports/` hub page — a CollectionPage listing
 * every published report, plus a BreadcrumbList.
 */
export function reportsHubSchema(
  reports: ReportRow[],
  baseUrl: string
): Record<string, unknown>[] {
  const hubUrl = `${baseUrl}/intelligence/reports`;

  const collectionNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": hubUrl,
    name: "Zavis Intelligence Reports",
    description:
      "Annual and quarterly data reports on UAE healthcare access, patient experience, insurance networks, and provider supply. Published open-access by Zavis — the AI-powered patient success platform for UAE healthcare.",
    url: hubUrl,
    inLanguage: "en-AE",
    isPartOf: {
      "@type": "WebSite",
      "@id": baseUrl,
      name: "Zavis",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: "Zavis",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: reports.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: reports.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: reportUrl(r.slug, baseUrl),
        item: {
          "@type": "Report",
          name: r.title,
          headline: r.title,
          description: r.headlineStat,
          url: reportUrl(r.slug, baseUrl),
          datePublished: toIsoDate(r.releaseDate),
          publisher: { "@id": `${baseUrl}#organization` },
        },
      })),
    },
  };

  const breadcrumbNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Zavis",
        item: { "@type": "WebPage", "@id": baseUrl },
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Intelligence",
        item: { "@type": "WebPage", "@id": `${baseUrl}/intelligence` },
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Reports",
        item: { "@type": "WebPage", "@id": hubUrl },
      },
    ],
  };

  return [collectionNode, breadcrumbNode];
}

/**
 * Schema for the `/intelligence/press/` page — a CollectionPage listing all
 * reports available for press, including embargo status.
 */
export function pressHubSchema(
  reports: ReportRow[],
  baseUrl: string
): Record<string, unknown>[] {
  const pressUrl = `${baseUrl}/intelligence/press`;

  const collectionNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pressUrl,
    name: "Zavis Press Room",
    description:
      "Zavis press kit: annual and quarterly reports on UAE healthcare, media contacts, embargo schedule and analyst access for journalists covering UAE and GCC healthcare.",
    url: pressUrl,
    inLanguage: "en-AE",
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      name: "Zavis",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: reports.length,
      itemListElement: reports.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: reportUrl(r.slug, baseUrl),
        item: {
          "@type": "Report",
          name: r.title,
          url: reportUrl(r.slug, baseUrl),
          datePublished: toIsoDate(r.releaseDate),
        },
      })),
    },
  };

  const breadcrumbNode: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Zavis",
        item: { "@type": "WebPage", "@id": baseUrl },
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Intelligence",
        item: { "@type": "WebPage", "@id": `${baseUrl}/intelligence` },
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Press",
        item: { "@type": "WebPage", "@id": pressUrl },
      },
    ],
  };

  return [collectionNode, breadcrumbNode];
}
