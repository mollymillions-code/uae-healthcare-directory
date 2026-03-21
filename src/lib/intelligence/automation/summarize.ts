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
  item: RawFeedItem,
  opts?: { skipReview?: boolean }
): Promise<Omit<JournalArticle, "id"> | null> {
  const category = classifyCategory(item);

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: getArticleSystemPrompt(),
    });

    const prompt = `Transform this news item into a Zavis Healthcare Industry Insights article.

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
  "body": "Full HTML article body. 400-700 words. RICH FORMATTING REQUIRED — this must look like STAT News or Bloomberg, not a text file. Use ALL of these HTML elements: <p> for paragraphs, <h3> for section subheadings (sentence case), <strong> to bold key numbers/names/dates/entities on first mention, <ul><li> or <ol><li> for data lists or key takeaways (2-5 items max), <blockquote> for direct quotes from named sources. Structure: lead paragraph (the news), then 2-3 sections each with an <h3> heading, then a forward-looking closing paragraph. Every section must contain at least one <strong> bolded fact and one specific number. Include specific UAE regulatory context (DHA/DOH/MOHAP). Every paragraph must pass all 21 anti-AI-tells rules.",
  "tags": ["5-8", "relevant", "lowercase", "tags"],
  "readTimeMinutes": 3
}

The body must be ORIGINAL writing based on the source facts. Add UAE healthcare market context. Write like a human journalist with 10 years covering UAE healthcare.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Pass 2: Review and improve (skippable for serverless timeout)
    const draft = {
      slug: parsed.slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      body: parsed.body,
      tags: parsed.tags || [],
      readTimeMinutes: parsed.readTimeMinutes || 3,
    };
    const final = opts?.skipReview ? draft : await reviewAndImprove(draft);

    return {
      slug: final.slug,
      title: final.title,
      excerpt: final.excerpt,
      body: final.body,
      category,
      tags: final.tags,
      source: item.contentSource,
      sourceUrl: item.link,
      sourceName: item.source,
      author: { name: "Journal Staff", role: "Editorial" },
      publishedAt: new Date().toISOString(),
      isFeatured: false,
      isBreaking: false,
      readTimeMinutes: final.readTimeMinutes,
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

CRITICAL FORMATTING REQUIREMENT — the body HTML must be visually rich:
1. Ensure 2-3 <h3> subheadings (sentence case) break up the content
2. Bold key numbers, entity names, and dates with <strong> tags
3. Add at least one <ul><li> list if there are 3+ comparable data points
4. Wrap direct quotes in <blockquote> tags
5. If the body is a wall of <p> paragraphs with no other elements, ADD formatting

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
  maxConcurrent = 3,
  opts?: { skipReview?: boolean }
): Promise<Omit<JournalArticle, "id">[]> {
  const articles: Omit<JournalArticle, "id">[] = [];

  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const results = await Promise.allSettled(
      batch.map((item) => generateArticle(item, opts))
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
//
// CRITICAL: Every image must be UNIQUE and CONTEXTUAL to the specific article.
// Never produce generic skyline/cityscape images. Extract the specific subject
// from the title and depict THAT subject.

export async function generateArticleImage(
  title: string,
  category: string
): Promise<string | null> {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return null;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a photo editor for a healthcare industry journal. Generate ONE unique photorealistic image for this specific article. The image MUST depict the specific subject of the article, NOT a generic cityscape or skyline.

ARTICLE TITLE: "${title}"
CATEGORY: ${category}

INSTRUCTIONS:
1. Read the title carefully. Identify the SPECIFIC subject: Is it about an IPO? Show a stock exchange. Insurance premiums? Show an insurance document or hospital billing desk. A nursing shortage? Show nurses. A drug law? Show a pharmacy or courtroom. An acquisition? Show a corporate handshake or boardroom.
2. The image must be DIFFERENT from any other article's image. No two articles should look the same.
3. Include contextual details from the title — if it mentions "Burjeel" show a hospital group setting, if it mentions "$50 billion" show financial scale, if it mentions "mental health" show a therapy or counseling setting.
4. Vary the composition: some close-ups, some wide shots, some overhead, some eye-level. Not everything should be the same framing.
5. Vary the color palette: warm for human stories, cool for tech, dark for financial, bright for openings, muted for regulatory.

HARD RULES:
- NO text, words, numbers, watermarks, or logos in the image
- NO generic Dubai/Abu Dhabi skyline unless the article is specifically about real estate
- 16:9 landscape aspect ratio
- Photorealistic, editorial quality
- Each image must be visually distinct from every other image on the site`,
            }],
          }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.log(`[Image] No image data returned for: ${title}`);
    return null;
  } catch (error) {
    console.error(`[Image] Error generating image for: ${title}`, error);
    return null;
  }
}
