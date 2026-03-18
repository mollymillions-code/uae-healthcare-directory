/**
 * Relevance Scoring Engine — ranks feed items by newsworthiness.
 *
 * Scores each item 0-100 across five dimensions:
 *   1. Virality potential (30%) — will it stir conversation, opinions, shares?
 *   2. Audience impact (25%) — how many C-suite roles does it affect?
 *   3. Specificity (20%) — does it have numbers, names, dates, money?
 *   4. Timeliness (15%) — how fresh is it?
 *   5. Category value (10%) — does it fill a content gap?
 *
 * Top 25 items by score get processed. Visual hierarchy on the page
 * follows the score: highest = hero, next = featured, rest = feed.
 */

import type { RawFeedItem } from "./feeds";

export interface ScoredItem {
  item: RawFeedItem;
  score: number;
  breakdown: {
    virality: number;
    audienceImpact: number;
    specificity: number;
    timeliness: number;
    categoryValue: number;
  };
  rank: number;
}

// ─── Virality Score (0-30) ──────────────────────────────────────────────────────
// Will this make someone stop, read, and share on LinkedIn?

function scoreVirality(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;

  // Conflict / tension / controversy (highest virality)
  if (/\b(ban|block|reject|suspend|fine|penalty|crack down|warning|risk|danger|scandal|fraud)\b/.test(text)) score += 10;
  if (/\b(debate|controversy|backlash|criticism|oppose|protest|concern|alarm)\b/.test(text)) score += 8;

  // Big numbers (money talks)
  if (/\b(billion|million|ipo|acquisition|merger)\b/.test(text)) score += 8;
  if (/\b\d+%/.test(text)) score += 5; // percentage = data point
  if (/aed\s*[\d,.]+|usd?\s*[\d,.]+|\$[\d,.]+/i.test(text)) score += 6;

  // Named entities (people care about people and brands)
  if (/\b(ceo|founder|minister|director|chairman|president)\b/.test(text)) score += 4;
  const namedOrgs = ["cleveland clinic", "mediclinic", "aster", "nmc", "burjeel", "pure health", "seha", "vps"];
  if (namedOrgs.some((org) => text.includes(org))) score += 5;

  // Firsts / records / milestones
  if (/\b(first|largest|record|milestone|breakthrough|unprecedented)\b/.test(text)) score += 7;

  // New / launch / change (news impulse)
  if (/\b(new|launch|announce|unveil|introduce|approve|mandate)\b/.test(text)) score += 4;

  // Questions / opinion hooks
  if (/\?/.test(title)) score += 3;
  if (/\b(opinion|should|why|how|what if)\b/.test(text)) score += 4;

  return Math.min(score, 30);
}

// ─── Audience Impact Score (0-25) ───────────────────────────────────────────────
// How many roles in a healthcare org does this affect?

function scoreAudienceImpact(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let rolesAffected = 0;

  // CEO / Owner
  if (/\b(ipo|acquisition|merger|strategy|expansion|market share|competitive)\b/.test(text)) rolesAffected++;
  // CFO / Finance
  if (/\b(revenue|cost|price|budget|reimbursement|penalty|fine|invest|valuation)\b/.test(text)) rolesAffected++;
  // COO / Operations
  if (/\b(compliance|deadline|mandate|requirement|license|accreditation|integration)\b/.test(text)) rolesAffected++;
  // CIO / IT
  if (/\b(digital|software|platform|ehr|system|data|cyber|interoperab|ai|tech)\b/.test(text)) rolesAffected++;
  // CMO / Marketing
  if (/\b(patient acquisition|brand|marketing|reputation|social media|review)\b/.test(text)) rolesAffected++;
  // Medical Director
  if (/\b(clinical|diagnosis|treatment|protocol|quality|safety|scope of practice)\b/.test(text)) rolesAffected++;
  // HR / Workforce
  if (/\b(nurse|workforce|staff|hire|recruit|salary|visa|retention|training)\b/.test(text)) rolesAffected++;
  // Startup founders
  if (/\b(startup|funding|venture|incubator|free zone|innovation|disrupt)\b/.test(text)) rolesAffected++;

  // Scale: 1 role = 5, 2 = 10, 3 = 15, 4+ = 20-25
  return Math.min(rolesAffected * 5, 25);
}

// ─── Specificity Score (0-20) ───────────────────────────────────────────────────
// Does it have real data or is it vague?

function scoreSpecificity(title: string, description: string): number {
  const text = `${title} ${description}`;
  let score = 0;

  // Numbers
  const numberCount = (text.match(/\d+/g) || []).length;
  score += Math.min(numberCount * 2, 8);

  // Named entities (proper nouns — rough heuristic)
  const capitalWords = (text.match(/[A-Z][a-z]{2,}/g) || []).length;
  score += Math.min(capitalWords, 6);

  // Specific UAE references
  if (/\b(dha|doh|mohap|sheryan|nabidh|haad)\b/i.test(text)) score += 3;

  // Date references
  if (/\b(2026|2027|q[1-4]|january|february|march|april|may|june)\b/i.test(text)) score += 3;

  return Math.min(score, 20);
}

// ─── Timeliness Score (0-15) ────────────────────────────────────────────────────

function scoreTimeliness(pubDate: string): number {
  const hoursAgo = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 2) return 15;
  if (hoursAgo < 6) return 13;
  if (hoursAgo < 12) return 11;
  if (hoursAgo < 24) return 9;
  if (hoursAgo < 48) return 6;
  if (hoursAgo < 72) return 3;
  return 1;
}

// ─── Category Value Score (0-10) ────────────────────────────────────────────────
// Does this fill a gap? We want category diversity.

const CATEGORY_WEIGHTS: Record<string, number> = {
  regulatory: 8,
  financial: 9,
  "new-openings": 7,
  technology: 8,
  workforce: 6,
  "market-intelligence": 9,
  events: 4,
  "thought-leadership": 7,
  "social-pulse": 3,
};

function scoreCategoryValue(category: string): number {
  return CATEGORY_WEIGHTS[category] || 5;
}

// ─── Main Scoring Function ──────────────────────────────────────────────────────

export function scoreItems(items: RawFeedItem[]): ScoredItem[] {
  const scored = items.map((item) => {
    const virality = scoreVirality(item.title, item.description);
    const audienceImpact = scoreAudienceImpact(item.title, item.description);
    const specificity = scoreSpecificity(item.title, item.description);
    const timeliness = scoreTimeliness(item.pubDate);
    const categoryValue = scoreCategoryValue(item.category);

    const score = virality + audienceImpact + specificity + timeliness + categoryValue;

    return {
      item,
      score,
      breakdown: { virality, audienceImpact, specificity, timeliness, categoryValue },
      rank: 0,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  scored.forEach((s, i) => { s.rank = i + 1; });

  return scored;
}

export function getTopItems(items: RawFeedItem[], limit = 25): ScoredItem[] {
  return scoreItems(items).slice(0, limit);
}
