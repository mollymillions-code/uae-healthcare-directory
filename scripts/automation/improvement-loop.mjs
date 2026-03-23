/**
 * Improvement Loop — Friday performance review cycle.
 *
 * 5 stages:
 * 1. Collect Metrics     → Claude CLI (performance-collector)
 * 2. Score Report        → Composite scoring formula
 * 3. Analyze Posts       → Claude CLI (social-analytics-reporter)
 * 4. Pattern Recognition → Claude CLI (cross-week analysis)
 * 5. Recommend & Store   → Write performance_insights
 */

import { runClaude, extractJson } from './lib/llm-runner.mjs';
import { getDb, getLatestPublishedReport, updateAutomationRun } from './lib/db.mjs';
import { notify } from './lib/notifications.mjs';
import { CONFIG } from './lib/config.mjs';
import crypto from 'crypto';

export async function run(runId, opts) {
  const sql = getDb();

  // Find this week's published report
  const report = await getLatestPublishedReport();
  if (!report) {
    console.log('No published reports to review.');
    return;
  }

  console.log(`Reviewing: ${report.report_title} (published ${report.published_at})`);
  await updateAutomationRun(runId, { reportSlug: report.report_slug, topic: report.topic });

  // Get all posts for this report
  const posts = await sql`
    SELECT * FROM linkedin_posts WHERE run_id = ${report.id} ORDER BY posted_at ASC
  `;
  const postedQueue = await sql`
    SELECT * FROM post_queue WHERE report_slug = ${report.report_slug} AND status = 'posted'
  `;

  // ── Stage 1: Collect Metrics ──────────────────────────────────────

  console.log('\n── Stage 1: Collect Metrics ──────────────────');

  const metricsPrompt = `Using the performance-collector skill, collect post-publish metrics for the report "${report.report_title}" (slug: ${report.report_slug}).

Report published at: ${report.published_at}
Report URL: https://research.zavis.ai/reports/${report.report_slug}

LinkedIn posts associated with this report:
${posts.map(p => `- Postiz ID: ${p.postiz_post_id}, posted: ${p.posted_at}, account: ${p.account}`).join('\n')}

Collect data from:
1. GA4 (via zavis-analytics MCP): pageviews, users, session duration, traffic sources for /reports/${report.report_slug}
2. GSC (via zavis-analytics MCP): search impressions, clicks, queries for the report URL
3. For each LinkedIn post with a Postiz ID, check Postiz API at GET http://localhost:4007/api/posts/{postizPostId} for any available engagement metrics

Output a JSON object with this structure:
{
  "linkedin": { "total_impressions": N, "total_likes": N, "total_comments": N, "total_shares": N, "total_clicks": N, "posts": [...per-post metrics] },
  "website": { "pageviews": N, "unique_users": N, "avg_session_duration": N, "bounce_rate": N, "top_sources": [...] },
  "search": { "impressions": N, "clicks": N, "avg_position": N, "top_queries": [...] }
}

If a data source is unavailable, use null for those fields. Do NOT fabricate numbers.`;

  const metricsResult = await runClaude(metricsPrompt, { timeout: CONFIG.timeouts.metricsCollection });
  let rawMetrics = extractJson(metricsResult.output) || {};

  // ── Stage 2: Score Report ─────────────────────────────────────────

  console.log('\n── Stage 2: Score Report ─────────────────────');

  // Composite score formula
  const linkedin = rawMetrics.linkedin || {};
  const website = rawMetrics.website || {};
  const search = rawMetrics.search || {};

  const scores = {
    linkedin_engagement: Math.min((linkedin.total_likes || 0 + linkedin.total_comments || 0) / Math.max(linkedin.total_impressions || 1, 1) * 100, 10) * 2.5,
    linkedin_impressions: Math.min((linkedin.total_impressions || 0) / 1000, 10) * 1.5,
    website_traffic: Math.min((website.pageviews || 0) / 500, 10) * 2.0,
    email_ctr: 0, // No email data in this cycle
    search_impressions: Math.min((search.impressions || 0) / 100, 10) * 1.0,
    session_duration: Math.min((website.avg_session_duration || 0) / 300, 10) * 1.0,
    comment_quality: Math.min((linkedin.total_comments || 0) / 5, 10) * 0.5,
  };

  const compositeScore = Math.min(
    Object.values(scores).reduce((a, b) => a + b, 0) * 10 / 8.5, // normalize to 0-100
    100
  );

  // Store in performance_scores
  const scoreId = crypto.randomUUID();
  await sql`
    INSERT INTO performance_scores (id, run_id, composite_score, breakdown, linkedin_metrics, website_metrics, search_metrics)
    VALUES (${scoreId}, ${report.id}, ${compositeScore.toFixed(2)},
            ${JSON.stringify(scores)}, ${JSON.stringify(linkedin)},
            ${JSON.stringify(website)}, ${JSON.stringify(search)})
  `;

  console.log(`Composite score: ${compositeScore.toFixed(1)}/100`);

  // ── Stage 3: Analyze Posts ────────────────────────────────────────

  console.log('\n── Stage 3: Analyze Posts ────────────────────');

  const analysisPrompt = `Analyze the LinkedIn post performance for the report "${report.report_title}".

Posts data:
${postedQueue.map(p => JSON.stringify({
    number: p.post_number,
    angle: p.angle,
    media_type: p.media_type,
    posted_at: p.posted_at,
    slide_indices: p.slide_indices,
  })).join('\n')}

Metrics collected: ${JSON.stringify(rawMetrics.linkedin || {})}

Analyze:
1. Which angles got the most engagement?
2. Did video or image posts perform better?
3. Were morning or afternoon posts stronger?
4. What content length resonated?
5. Any hashtag patterns?

Output a JSON object:
{
  "best_angles": ["angle1", "angle2"],
  "worst_angles": ["angle3"],
  "video_vs_image": { "video_avg_engagement": N, "image_avg_engagement": N, "winner": "video|image" },
  "best_time_slot": "morning|afternoon",
  "optimal_length_range": [min, max],
  "hashtag_insights": "...",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

  const analysisResult = await runClaude(analysisPrompt, { timeout: CONFIG.timeouts.metricsCollection });
  const postAnalysis = extractJson(analysisResult.output) || {};

  // ── Stage 4: Pattern Recognition ──────────────────────────────────

  console.log('\n── Stage 4: Pattern Recognition ──────────────');

  // Get previous insights for cross-week comparison
  const previousInsights = await sql`
    SELECT * FROM performance_insights ORDER BY week_start DESC LIMIT 8
  `;

  const patternPrompt = `Analyze cross-week performance patterns for Zavis Research reports.

This week:
- Topic: ${report.topic}
- Category: ${report.report_category || 'Business'}
- Composite score: ${compositeScore.toFixed(1)}/100
- Post analysis: ${JSON.stringify(postAnalysis)}

Previous weeks:
${previousInsights.map(i => JSON.stringify({
    week: i.week_start,
    report: i.report_slug,
    topics: i.topic_scores,
    angles: i.angle_scores,
    recommendations: i.recommendations,
  })).join('\n')}

Identify:
1. Trending topic categories (which ones score consistently well?)
2. Optimal post angle distribution
3. Video vs image engagement trend over time
4. Content strategy adjustments needed

Output a JSON object:
{
  "topic_scores": { "Healthcare": N, "Technology": N, "Business": N, ... },
  "angle_scores": { "headline_stat": N, "contrarian": N, "listicle": N, "data_deep_dive": N, "video_summary": N },
  "timing_scores": { "morning": N, "afternoon": N },
  "content_patterns": { "optimal_length": N, "video_ratio": 0.X, "top_hashtags": [...] },
  "recommendations": {
    "next_topic_category": "...",
    "adjust_video_ratio": "increase|decrease|maintain",
    "posting_time_change": null | "shift morning to X",
    "content_adjustments": ["..."]
  }
}`;

  const patternResult = await runClaude(patternPrompt, { timeout: CONFIG.timeouts.metricsCollection });
  const patterns = extractJson(patternResult.output) || {};

  // ── Stage 5: Store Insights ───────────────────────────────────────

  console.log('\n── Stage 5: Store Insights ───────────────────');

  // Calculate week start (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const insightId = crypto.randomUUID();
  await sql`
    INSERT INTO performance_insights (id, week_start, report_slug, pipeline_run_id,
      topic_scores, angle_scores, timing_scores, content_patterns, recommendations, raw_metrics)
    VALUES (${insightId}, ${weekStartStr}, ${report.report_slug}, ${report.id},
      ${JSON.stringify(patterns.topic_scores || {})},
      ${JSON.stringify(patterns.angle_scores || {})},
      ${JSON.stringify(patterns.timing_scores || {})},
      ${JSON.stringify(patterns.content_patterns || {})},
      ${JSON.stringify(patterns.recommendations || {})},
      ${JSON.stringify(rawMetrics)})
  `;

  console.log(`Insights stored for week of ${weekStartStr}`);

  await notify({
    title: `Week review complete — Score: ${compositeScore.toFixed(0)}/100`,
    message: `${report.report_title}: ${compositeScore.toFixed(1)} composite. ${posts.length} posts analyzed. Insights stored for next week's topic selection.`,
    severity: 'info',
    automationRunId: runId,
    details: {
      compositeScore,
      breakdown: scores,
      postAnalysis,
      recommendations: patterns.recommendations,
    },
  });
}
