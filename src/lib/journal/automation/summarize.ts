/**
 * AI Content Pipeline — uses Gemini 3.1 Flash Lite for article generation
 * and Gemini 3.1 Flash Image for article images.
 *
 * All content passes through the skill tree before generation:
 *   1. News Story Writer skill (drafts with journalistic structure)
 *   2. Anti-AI-tells filter (rewrites any violations)
 *
 * Skills live in ./skills/news-story-writer.ts — single source of truth.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { JournalArticle } from "../types";
import type { RawFeedItem } from "./feeds";
import { classifyCategory } from "./feeds";
import {
  getArticleSystemPrompt,
  getReviewEditorSystemPrompt,
  getSocialDigestSystemPrompt,
} from "./skills/news-story-writer";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(key);
}

// ─── Article Generation ─────────────────────────────────────────────────────────

export async function generateArticle(
  item: RawFeedItem
): Promise<Omit<JournalArticle, "id"> | null> {
  const category = classifyCategory(item);

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: getArticleSystemPrompt(),
    });

    const prompt = `Transform this news item into a UAE Healthcare Journal article.

SOURCE: ${item.source}
TITLE: ${item.title}
DATE: ${item.pubDate}
LINK: ${item.link}
CONTENT: ${item.description}
${item.fullContent ? `FULL CONTENT: ${item.fullContent.slice(0, 3000)}` : ""}

Generate a JSON object with these exact fields (JSON only, no markdown fences):
{
  "slug": "url-friendly-slug-max-60-chars",
  "title": "Headline under 120 chars. Include a specific number. Name the entity. Sentence case.",
  "excerpt": "2-3 sentences, under 200 chars, includes the key fact and a number if available",
  "body": "Full HTML article body. 3-6 paragraphs with <p> tags. Use <h3> subheadings (sentence case) where appropriate. 200-500 words. Include specific UAE context. Every paragraph must pass all 21 anti-AI-tells rules.",
  "tags": ["5-8", "relevant", "lowercase", "tags"],
  "readTimeMinutes": 3
}

The body must be ORIGINAL writing based on the source facts. Add UAE healthcare market context. Write like a human journalist with 10 years covering UAE healthcare.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Pass 2: Review and improve before publishing
    const reviewed = await reviewAndImprove({
      slug: parsed.slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      body: parsed.body,
      tags: parsed.tags || [],
      readTimeMinutes: parsed.readTimeMinutes || 3,
    });

    return {
      slug: reviewed.slug,
      title: reviewed.title,
      excerpt: reviewed.excerpt,
      body: reviewed.body,
      category,
      tags: reviewed.tags,
      source: item.contentSource,
      sourceUrl: item.link,
      sourceName: item.source,
      author: { name: "Journal Staff", role: "Editorial" },
      publishedAt: new Date().toISOString(),
      isFeatured: false,
      isBreaking: false,
      readTimeMinutes: reviewed.readTimeMinutes,
    };
  } catch (error) {
    console.error(`[Summarize] Error generating article for: ${item.title}`, error);
    return null;
  }
}

// ─── Review Pass (Pass 2) ───────────────────────────────────────────────────────

async function reviewAndImprove(draft: {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  readTimeMinutes: number;
}): Promise<typeof draft> {
  try {
    const genAI = getGemini();
    const reviewer = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: getReviewEditorSystemPrompt(),
    });

    const prompt = `Review and improve this draft article. Fix all issues found.

DRAFT:
${JSON.stringify(draft, null, 2)}

Return the improved version as JSON with the same fields (slug, title, excerpt, body, tags, readTimeMinutes). JSON only, no markdown fences. If the draft is already strong, make targeted improvements — don't rewrite from scratch.`;

    const result = await reviewer.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const improved = JSON.parse(jsonStr);

    console.log(`[Review] Improved: "${draft.title}" → "${improved.title}"`);
    return {
      slug: improved.slug || draft.slug,
      title: improved.title || draft.title,
      excerpt: improved.excerpt || draft.excerpt,
      body: improved.body || draft.body,
      tags: improved.tags || draft.tags,
      readTimeMinutes: improved.readTimeMinutes || draft.readTimeMinutes,
    };
  } catch (error) {
    console.error("[Review] Review pass failed, using draft as-is:", error);
    return draft;
  }
}

// ─── Batch Processing ───────────────────────────────────────────────────────────

export async function generateArticleBatch(
  items: RawFeedItem[],
  maxConcurrent = 3
): Promise<Omit<JournalArticle, "id">[]> {
  const articles: Omit<JournalArticle, "id">[] = [];

  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const results = await Promise.allSettled(
      batch.map((item) => generateArticle(item))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        articles.push(result.value);
      }
    }

    if (i + maxConcurrent < items.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return articles;
}

// ─── Social Digest Generation ───────────────────────────────────────────────────

export async function generateSocialDigest(
  posts: { author: string; content: string; platform: string }[]
): Promise<string | null> {
  if (posts.length === 0) return null;

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: getSocialDigestSystemPrompt(),
    });

    const prompt = `Write a Social Pulse article summarizing these social media highlights from UAE healthcare leaders this week:

${posts.map((p, i) => `${i + 1}. [${p.platform}] ${p.author}: "${p.content}"`).join("\n\n")}

Write 3-5 paragraphs of HTML (<p>, <h3> tags). Weave the posts into a narrative. Use sentence case headings. No AI vocabulary.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("[Summarize] Error generating social digest:", error);
    return null;
  }
}

// ─── Image Generation (Gemini 3.1 Flash Image Preview) ──────────────────────────

export async function generateArticleImage(
  title: string,
  category: string
): Promise<string | null> {
  try {
    const genAI = getGemini();
    const imageModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-image-preview",
    });

    const prompt = `Generate a high-quality editorial photograph for a UAE healthcare journal article.

Article: "${title}"
Category: ${category}

Style: editorial photography, NOT stock photo. High contrast, scroll-stopping composition. UAE/Middle East healthcare context (modern architecture, diverse professionals, Gulf setting). Muted warm tones with one strong color accent. No text overlays, no watermarks, no logos. 16:9 aspect ratio. Financial Times or New York Times photo desk quality.`;

    const result = await imageModel.generateContent(prompt);
    const response = result.response;

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    console.log(`[Image] No image data returned for: ${title}`);
    return null;
  } catch (error) {
    console.error(`[Image] Error generating image for: ${title}`, error);
    return null;
  }
}
