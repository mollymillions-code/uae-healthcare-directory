/**
 * AI Content Pipeline — uses Gemini 2.0 Flash for article generation
 * and Imagen 3 for article images.
 *
 * All content passes through the anti-AI-tells filter before publishing.
 * Rules sourced from Wikipedia's "Signs of AI Writing" guide.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { JournalArticle } from "../types";
import type { RawFeedItem } from "./feeds";
import { classifyCategory } from "./feeds";

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(key);
}

// ─── Anti-AI-Tells System Prompt ────────────────────────────────────────────────
// Sourced from Wikipedia's "Signs of AI Writing" (222 pages, Jan 2026)

const ANTI_AI_TELLS_RULES = `You are a senior healthcare journalist. Your writing must pass as expert human journalism. Follow these 21 anti-AI-writing rules with zero exceptions:

1. NEVER use parallel negation — no "not X, it's Y" or "not only X but also Y"
2. NEVER inflate significance — cut "stands as a testament," "plays a vital role," "key turning point," "pivotal moment"
3. NEVER use superficial -ing analyses — cut "...ensuring seamless," "...highlighting the importance of," "...reflecting broader trends"
4. NEVER use promotional tone — cut "rich heritage," "breathtaking," "vibrant," "nestled in," "boasts"
5. MINIMIZE em dashes — max 1 per article, prefer commas or parentheses
6. NEVER use weasel attribution — no "experts say," "industry reports suggest" — name the source or drop the claim
7. NEVER editorialize — cut "It's important to note," "worth mentioning," "no discussion would be complete without"
8. NEVER pad with conjunctions — no "Moreover," "Furthermore," "Additionally" to start sentences
9. NEVER use bold-title bullet lists — write in prose paragraphs
10. NEVER default to rule of three — vary list lengths (use 2, 4, 5 items)
11. NEVER end sections with summaries — no "In summary," "Overall," "In conclusion"
12. NEVER use "not only... but also..." — state both points directly
13. NEVER use unearned flattering adjectives — no "fascinating," "remarkable," "groundbreaking" unless backed by specific evidence
14. PRIORITIZE substance — real numbers, real names, real dates over smooth empty prose
15. USE simple copulatives — write "is"/"are"/"has" not "serves as"/"features"/"offers"
16. NEVER cycle synonyms — if you said "DHA" don't switch to "the regulatory body" then "the health authority" — just say DHA again
17. NEVER use false ranges — no "from X to Y" unless X and Y are on a real measurable scale
18. NEVER use "despite challenges" formula — don't sandwich problems between promotional bookends
19. AVOID these AI vocabulary words: delve, pivotal, tapestry, landscape (abstract), underscore, foster, intricate, garner, showcase, testament, enduring, vibrant, crucial, enhance, align with, valuable
20. NO emoji in content
21. SENTENCE CASE in all headings — only capitalize first word and proper nouns

SELF-CHECK every paragraph: scan for parallel negation, inflated symbolism, -ing filler, promotional tone, weasel attribution, conjunctive padding, rule-of-three, AI vocabulary clusters, synonym cycling. If you find any, rewrite before outputting.

Your tone: factual, dry, authoritative. Write like the Financial Times health desk or The Economist. Specific numbers and names. Short sentences mixed with medium ones. Let facts carry weight, not adjectives.

HEADLINE OPTIMIZATION FOR CLICKS AND SHARES:
- Always include a specific number (AED amount, percentage, count, date)
- Name the specific entity (DHA not "regulators", Cleveland Clinic not "a hospital")
- Front-load the most surprising or consequential fact
- Max 120 characters for social sharing
- The specificity IS the hook — no clickbait phrases
- Headline formulas: "Specific number + consequence", "Money headline", "New thing + who it affects", "Tension/conflict", "Data reveal"

IMAGE PROMPTS: When asked for image descriptions, optimize for scroll-stopping editorial photography. High contrast, UAE context, no generic stock imagery.`;

// ─── Article Generation ─────────────────────────────────────────────────────────

export async function generateArticle(
  item: RawFeedItem
): Promise<Omit<JournalArticle, "id"> | null> {
  const category = classifyCategory(item);

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: ANTI_AI_TELLS_RULES,
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
  "title": "Headline under 100 chars. Factual, not clickbait. Sentence case.",
  "excerpt": "2-3 sentences, under 200 chars, includes the key fact and a number if available",
  "body": "Full HTML article body. 3-6 paragraphs with <p> tags. Use <h3> subheadings (sentence case) where appropriate. 200-500 words. Include specific UAE context — cite DHA/DOH/MOHAP where relevant. Every paragraph must pass the 21 anti-AI-tells rules.",
  "tags": ["5-8", "relevant", "lowercase", "tags"],
  "readTimeMinutes": 3
}

The body must be ORIGINAL writing based on the source facts. Add UAE healthcare market context and analysis. Write like a human journalist with deep knowledge of the UAE healthcare sector — not like a content mill.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      slug: parsed.slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      body: parsed.body,
      category,
      tags: parsed.tags || [],
      source: item.contentSource,
      sourceUrl: item.link,
      sourceName: item.source,
      author: { name: "Journal Staff", role: "Editorial" },
      publishedAt: new Date().toISOString(),
      isFeatured: false,
      isBreaking: false,
      readTimeMinutes: parsed.readTimeMinutes || 3,
    };
  } catch (error) {
    console.error(`[Summarize] Error generating article for: ${item.title}`, error);
    return null;
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
      systemInstruction: `${ANTI_AI_TELLS_RULES}

You write the weekly Social Pulse column for the UAE Healthcare Journal. Tone: informed, observational, slightly wry. You track what UAE healthcare leaders say on LinkedIn and X.`,
    });

    const prompt = `Write a Social Pulse article summarizing these social media highlights from UAE healthcare leaders this week:

${posts.map((p, i) => `${i + 1}. [${p.platform}] ${p.author}: "${p.content}"`).join("\n\n")}

Write 3-5 paragraphs of HTML (<p>, <h3> tags). Weave the posts into a narrative about what the industry is discussing. Don't just list them. Use sentence case headings. No AI vocabulary.`;

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

    // Use gemini-3.1-flash-image-preview for direct image generation
    const imageModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-image-preview",
    });

    const prompt = `Generate a high-quality editorial photograph for a UAE healthcare journal article.

Article: "${title}"
Category: ${category}

Style requirements:
- Editorial photography, NOT stock photo
- High contrast, scroll-stopping composition
- UAE/Middle East healthcare context (modern architecture, diverse professionals, Gulf setting)
- Muted warm tones with one strong color accent
- No text overlays, no watermarks, no logos
- 16:9 aspect ratio
- Think Financial Times or New York Times photo desk quality`;

    const result = await imageModel.generateContent(prompt);
    const response = result.response;

    // Extract base64 image data
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
