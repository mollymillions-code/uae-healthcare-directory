/**
 * AI Summarization Pipeline — uses Claude to transform raw feed items
 * into polished journal articles.
 *
 * Flow: RawFeedItem → Claude → JournalArticle (draft)
 */

import Anthropic from "@anthropic-ai/sdk";
import type { JournalArticle } from "../types";
import type { RawFeedItem } from "./feeds";
import { classifyCategory } from "./feeds";

const client = new Anthropic();

// ─── Article Generation ─────────────────────────────────────────────────────────

export async function generateArticle(
  item: RawFeedItem
): Promise<Omit<JournalArticle, "id"> | null> {
  const category = classifyCategory(item);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: `You are a senior healthcare journalist writing for the UAE Healthcare Journal — the definitive source for healthcare industry news in the United Arab Emirates.

Your audience: healthcare professionals (doctors, administrators, executives, investors, health tech founders) working in the UAE and Middle East.

Style: authoritative, factual, concise. No marketing language. Write like The Financial Times or The Economist health desk. Use specific numbers, names, and dates when available. Every claim should be attributable.

Output JSON only — no markdown, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Transform this news item into a UAE Healthcare Journal article.

SOURCE: ${item.source}
TITLE: ${item.title}
DATE: ${item.pubDate}
LINK: ${item.link}
CONTENT: ${item.description}
${item.fullContent ? `FULL CONTENT: ${item.fullContent.slice(0, 3000)}` : ""}

Generate a JSON object with these exact fields:
{
  "slug": "url-friendly-slug-max-60-chars",
  "title": "Compelling headline, max 100 chars, factual not clickbait",
  "excerpt": "2-3 sentence summary, max 200 chars, includes key facts",
  "body": "Full HTML article body, 3-6 paragraphs with <p> tags, include <h3> subheadings if appropriate. Must be 200-500 words. Include specific UAE context — cite DHA/DOH/MOHAP where relevant.",
  "tags": ["array", "of", "5-8", "relevant", "tags"],
  "readTimeMinutes": 3,
  "author": { "name": "Journal Staff", "role": "Editorial" }
}

Important: The body must be original writing based on the source facts — not a copy of the source text. Add UAE healthcare context and analysis.`,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    if (!textBlock) return null;

    // Parse JSON from response
    const jsonStr = textBlock.text.replace(/```json\n?|\n?```/g, "").trim();
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
      author: parsed.author || { name: "Journal Staff", role: "Editorial" },
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

  // Process in batches to respect rate limits
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

    // Brief pause between batches
    if (i + maxConcurrent < items.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return articles;
}

// ─── Social Post Summarization ──────────────────────────────────────────────────

export async function generateSocialDigest(
  posts: { author: string; content: string; platform: string }[]
): Promise<string | null> {
  if (posts.length === 0) return null;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      system:
        "You write the weekly Social Pulse column for the UAE Healthcare Journal. Tone: informed, observational, slightly wry. Summarize the most interesting conversations happening on social media among UAE healthcare leaders.",
      messages: [
        {
          role: "user",
          content: `Write a Social Pulse article summarizing these social media highlights from UAE healthcare leaders this week:

${posts.map((p, i) => `${i + 1}. [${p.platform}] ${p.author}: "${p.content}"`).join("\n\n")}

Write 3-5 paragraphs of HTML (<p>, <h3> tags). Highlight the most interesting conversations, debates, and insights. Don't just list posts — weave them into a narrative about what UAE healthcare leaders are talking about.`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    return textBlock?.text || null;
  } catch (error) {
    console.error("[Summarize] Error generating social digest:", error);
    return null;
  }
}
