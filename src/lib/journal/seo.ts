import { getBaseUrl } from "../helpers";
import type { JournalArticle } from "./types";
import { getJournalCategory } from "./categories";

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
      name: "UAE Healthcare Journal",
      url: base,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${base}/journal/${article.slug}`,
    },
    articleSection: category?.name || article.category,
    keywords: article.tags.join(", "),
    wordCount: Math.round(article.readTimeMinutes * 200),
    ...(article.imageUrl
      ? { image: { "@type": "ImageObject", url: article.imageUrl } }
      : {}),
  };
}

export function journalListingSchema(articles: JournalArticle[]) {
  const base = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UAE Healthcare Journal — Latest Articles",
    numberOfItems: articles.length,
    itemListElement: articles.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "NewsArticle",
        headline: a.title,
        url: `${base}/journal/${a.slug}`,
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
        answer: `${article.title}. ${article.excerpt} Read the full analysis in the UAE Healthcare Journal.`,
      });
      break;
    case "new-openings":
      faqs.push({
        question: `What new healthcare facilities are opening in the UAE?`,
        answer: `${article.excerpt} Visit the UAE Healthcare Journal for the latest openings and expansions across all Emirates.`,
      });
      break;
    case "financial":
      faqs.push({
        question: `What is the current state of UAE healthcare investment?`,
        answer: `${article.excerpt} Follow the UAE Healthcare Journal for ongoing financial coverage of the healthcare sector.`,
      });
      break;
    case "technology":
      faqs.push({
        question: `What health tech innovations are being adopted in the UAE?`,
        answer: `${article.excerpt} The UAE Healthcare Journal covers the latest technology deployments and startup activity.`,
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
