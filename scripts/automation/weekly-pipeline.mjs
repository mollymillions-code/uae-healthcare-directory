/**
 * Weekly Pipeline — Monday full research-to-publish cycle.
 *
 * 10 stages:
 * 1. Topic Selection    → Claude CLI (research-scorer)
 * 2. Pipeline Init      → POST /api/pipeline/runs
 * 3. Research           → Claude CLI (deep-researcher)
 * 4. Synthesis          → Claude CLI (research-synthesizer)
 * 5. Architecture       → Claude CLI (report-architect)
 * 6. Rendering          → Claude CLI (report-renderer)
 * 7. Quality Gate       → Node.js (score-slides.mjs)
 * 8. Publish            → PATCH /api/pipeline/runs/{id}
 * 9. Deploy             → git push + Vidyasagar trigger
 * 10. Post Seeding      → Claude CLI (research-content-extractor)
 */

import crypto from 'crypto';
import { execSync } from 'child_process';
import { runClaude, extractJson } from './lib/llm-runner.mjs';
import { getDb, updateAutomationRun } from './lib/db.mjs';
import { notify } from './lib/notifications.mjs';
import { evaluateReportQuality } from './lib/quality-gates.mjs';
import { CONFIG, PROJECT_ROOT } from './lib/config.mjs';

// ── Stage runner helper ─────────────────────────────────────────────

async function runStage(runId, stageName, stageLog, fn) {
  const entry = { stage: stageName, status: 'running', started_at: new Date().toISOString() };
  stageLog.push(entry);
  await updateAutomationRun(runId, { status: `stage_${stageName}`, currentStage: stageName, stageLog });

  console.log(`\n── Stage: ${stageName} ──────────────────────────`);

  try {
    const result = await fn();
    entry.status = 'completed';
    entry.completed_at = new Date().toISOString();
    entry.duration_ms = new Date(entry.completed_at) - new Date(entry.started_at);
    if (result?.summary) entry.output = result.summary;
    await updateAutomationRun(runId, { stageLog });
    console.log(`  [OK] ${stageName} (${(entry.duration_ms / 1000).toFixed(1)}s)`);
    return result;
  } catch (err) {
    entry.status = 'failed';
    entry.completed_at = new Date().toISOString();
    entry.error = err.message;
    await updateAutomationRun(runId, { stageLog, errorMessage: err.message });
    throw err;
  }
}

// ── Main pipeline ───────────────────────────────────────────────────

export async function run(runId, opts) {
  const sql = getDb();
  const stageLog = [];

  // ── Stage 1: Topic Selection ──────────────────────────────────────

  const topicResult = await runStage(runId, 'topic', stageLog, async () => {
    // Get past performance insights
    const insights = await sql`
      SELECT * FROM performance_insights ORDER BY week_start DESC LIMIT 8
    `;

    // Get published report slugs to avoid duplicates
    const published = await sql`
      SELECT report_slug, report_category, topic FROM pipeline_runs
      WHERE status IN ('published', 'distributing', 'complete')
      ORDER BY published_at DESC LIMIT 20
    `;

    const prompt = `You are the Zavis Research topic selector. Your job is to pick the single best topic for this week's research report.

CONTEXT:
- Published reports so far: ${JSON.stringify(published.map(r => ({ slug: r.report_slug, category: r.report_category, topic: r.topic })))}
- Performance insights from previous weeks: ${JSON.stringify(insights.map(i => ({ week: i.week_start, topics: i.topic_scores, angles: i.angle_scores, recommendations: i.recommendations })))}

RULES:
- Do NOT repeat a topic that was published in the last 90 days
- Pick a topic relevant to UAE/GCC healthcare, business, or technology
- Consider what performed well in past insights
- Must connect to at least one Zavis pillar (revenue growth, reduce no-shows, patient satisfaction)

OUTPUT: Return ONLY a JSON object with these fields:
{
  "topic": "The full topic title",
  "slug": "topic-slug-format",
  "category": "Healthcare|Technology|Business|Finance|Real Estate",
  "angle": "Brief description of the unique angle",
  "geography": "UAE|GCC|Middle East",
  "depth": "comprehensive",
  "reason": "Why this topic will perform well this week"
}`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.topicSelection });
    if (!result.success) throw new Error(`Topic selection failed: ${result.error}`);

    const topic = extractJson(result.output);
    if (!topic?.topic) throw new Error('Could not parse topic from Claude output');

    return { ...topic, summary: `Selected: ${topic.topic}` };
  });

  await updateAutomationRun(runId, { topic: topicResult.topic });

  // ── Stage 2: Pipeline Init ────────────────────────────────────────

  const pipelineRunId = crypto.randomUUID();

  await runStage(runId, 'init', stageLog, async () => {
    await sql`
      INSERT INTO pipeline_runs (id, topic, status, source, triggered_by, report_slug, report_category)
      VALUES (${pipelineRunId}, ${topicResult.topic}, 'research', 'automation', 'weekly-pipeline', ${topicResult.slug}, ${topicResult.category || 'Business'})
    `;
    await updateAutomationRun(runId, { pipelineRunId });
    return { summary: `Pipeline run ${pipelineRunId} created` };
  });

  // ── Stage 3: Research ─────────────────────────────────────────────

  await runStage(runId, 'research', stageLog, async () => {
    const prompt = `Using the deep-researcher skill, research the topic: "${topicResult.topic}".

Research angle: ${topicResult.angle || 'comprehensive analysis'}
Geography focus: ${topicResult.geography || 'UAE'}
Category: ${topicResult.category || 'Business'}

Gather 15-20 data points with verified sources. Focus on:
- Current market size and growth projections
- Key players and recent developments
- Regulatory landscape
- Technology adoption rates
- Connection to Zavis pillars (revenue, no-shows, patient satisfaction)

Save all findings by calling PUT http://localhost:3000/api/pipeline/runs/${pipelineRunId} with body:
{ "researchFindings": <your structured findings>, "status": "synthesis" }

Do NOT ask for approval. Execute the research autonomously.`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.research });
    if (!result.success) throw new Error(`Research failed: ${result.error}`);
    return { summary: 'Research completed and saved to pipeline' };
  });

  // ── Stage 4: Synthesis ────────────────────────────────────────────

  await runStage(runId, 'synthesis', stageLog, async () => {
    const prompt = `Using the research-synthesizer skill, synthesize the research findings for pipeline run ${pipelineRunId}.

Read the findings from GET http://localhost:3000/api/pipeline/runs/${pipelineRunId}.

Structure into:
1. Narrative arc (8-12 slides)
2. 5-8 headline statistics with sources
3. Key insights organized by theme
4. Zavis connection points

Save the synthesis by calling PUT http://localhost:3000/api/pipeline/runs/${pipelineRunId} with body:
{ "synthesis": <your structured synthesis>, "status": "rendering" }

Do NOT ask for approval. Proceed autonomously.`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.synthesis });
    if (!result.success) throw new Error(`Synthesis failed: ${result.error}`);
    return { summary: 'Synthesis completed' };
  });

  // ── Stage 5: Architecture ─────────────────────────────────────────

  await runStage(runId, 'architecture', stageLog, async () => {
    const prompt = `Using the report-architect skill, design the slide-by-slide visual structure for pipeline run ${pipelineRunId}.

Read the synthesis from GET http://localhost:3000/api/pipeline/runs/${pipelineRunId}.

CRITICAL RULES:
- This is NOT a template. Design unique visuals for this specific topic.
- Every slide MUST have a contextual background image.
- Design like Deloitte/McKinsey — editorial, not SaaS marketing.
- Plan animations: horizontal bars, waffle grids, counters, card grids.
- Include color palette and typography choices specific to this topic.

Output the complete slide blueprint with visualization types, data mappings, and image briefs.
Proceed autonomously without asking for approval.`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.architecture });
    if (!result.success) throw new Error(`Architecture failed: ${result.error}`);
    return { summary: 'Report architecture designed' };
  });

  // ── Stage 6: Rendering ────────────────────────────────────────────

  await runStage(runId, 'render', stageLog, async () => {
    const prompt = `Using the report-renderer skill, generate the full interactive HTML report for pipeline run ${pipelineRunId}.

Read all data from GET http://localhost:3000/api/pipeline/runs/${pipelineRunId}.

CRITICAL RULES:
- Single self-contained HTML file with all CSS and JS inline.
- Full-viewport scroll-snap slides (100vh each).
- Content MUST be visible without JavaScript (no opacity:0 defaults).
- Every slide needs a contextual background image (use generated or stock).
- Animated visualizations (bars, counters, waffles) triggered on scroll.
- Keyboard navigation (arrow keys, space).
- Design like Deloitte/HBR research report.

Save the complete report by calling PUT http://localhost:3000/api/pipeline/runs/${pipelineRunId} with body:
{
  "reportHtml": "<complete HTML>",
  "reportSlug": "${topicResult.slug}",
  "reportTitle": "<title>",
  "reportDescription": "<description>",
  "reportCategory": "${topicResult.category || 'Business'}",
  "status": "review"
}

Proceed autonomously without asking for approval.`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.rendering });
    if (!result.success) throw new Error(`Rendering failed: ${result.error}`);
    return { summary: 'Report HTML generated' };
  });

  await updateAutomationRun(runId, { reportSlug: topicResult.slug });

  // ── Stage 7: Quality Gate ─────────────────────────────────────────

  await runStage(runId, 'quality_gate', stageLog, async () => {
    // First, publish temporarily to filesystem so score-slides.mjs can access it
    const run = await sql`SELECT report_html FROM pipeline_runs WHERE id = ${pipelineRunId}`;
    if (!run[0]?.report_html) throw new Error('No report HTML found in pipeline run');

    // Write HTML temporarily for quality scoring
    const { writeFileSync, mkdirSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const reportDir = join(PROJECT_ROOT, 'data', 'reports', topicResult.slug);
    if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
    writeFileSync(join(reportDir, 'report.html'), run[0].report_html);

    const quality = evaluateReportQuality(topicResult.slug);

    if (!quality.passed) {
      await notify({
        title: `Report needs review: ${topicResult.topic}`,
        message: `Quality score: ${quality.avgScore.toFixed(1)}/100. ${quality.failedSlides} slides below threshold.`,
        severity: 'action_required',
        automationRunId: runId,
        details: quality.details,
      });
      await updateAutomationRun(runId, { status: 'needs_human' });
      throw new Error(`Quality gate failed: avg ${quality.avgScore.toFixed(1)}, ${quality.failedSlides} slides failed`);
    }

    // Auto-approve
    await sql`UPDATE pipeline_runs SET status = 'approved' WHERE id = ${pipelineRunId}`;

    return { summary: `Quality passed: ${quality.avgScore.toFixed(1)}/100, ${quality.slideCount} slides` };
  });

  // ── Stage 8: Publish ──────────────────────────────────────────────

  await runStage(runId, 'publish', stageLog, async () => {
    const res = await fetch(`${CONFIG.api.local}/api/pipeline/runs/${pipelineRunId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish' }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Publish failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return { summary: `Published at ${data.url || 'research.zavis.ai/reports/' + topicResult.slug}` };
  });

  // ── Stage 9: Deploy ───────────────────────────────────────────────

  await runStage(runId, 'deploy', stageLog, async () => {
    try {
      execSync(`git add data/reports/${topicResult.slug}/`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
      execSync(`git commit -m "Publish report: ${topicResult.topic}"`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
      execSync('git push', { cwd: PROJECT_ROOT, stdio: 'pipe' });

      // Trigger Vercel deployment
      execSync(
        'git commit --allow-empty --author="Vidyasagar Chamle <vidyasagar.chamle@gmail.com>" -m "Trigger Deployment"',
        { cwd: PROJECT_ROOT, stdio: 'pipe' }
      );
      execSync('git push', { cwd: PROJECT_ROOT, stdio: 'pipe' });

      return { summary: 'Deployed to Vercel' };
    } catch (e) {
      // Non-fatal — report is published locally, deploy can be retried
      console.warn('Deploy warning:', e.message);
      return { summary: `Deploy warning: ${e.message}` };
    }
  });

  // ── Stage 10: Post Seeding ────────────────────────────────────────

  await runStage(runId, 'seed_posts', stageLog, async () => {
    const totalBriefs = CONFIG.postQueue.totalBriefs;
    const videoCount = Math.round(totalBriefs * CONFIG.postQueue.videoPercentage);

    const prompt = `Using the research-content-extractor skill, extract social-ready content from the report at data/reports/${topicResult.slug}/report.html.

Generate exactly ${totalBriefs} LinkedIn post briefs for Hidayat's personal account.

For each brief, provide:
1. "angle": one of "headline_stat", "contrarian", "listicle", "data_deep_dive", "video_summary"
2. "hook": a compelling first line (no questions, no emojis, no em dashes)
3. "key_points": 3-5 bullet points to cover
4. "slide_indices": array of slide numbers (1-based) to use as images
5. "media_type": "image" or "video"

Make ${videoCount} of the ${totalBriefs} briefs have media_type "video" (for Remotion short clips).
The remaining ${totalBriefs - videoCount} should be "image" (slide screenshots).

Vary the angles across the briefs. Do NOT repeat the same angle more than 3 times.

Output as a JSON array of objects. No explanation, just the JSON.`;

    const result = await runClaude(prompt, { timeout: CONFIG.timeouts.postSeeding });
    if (!result.success) throw new Error(`Post seeding failed: ${result.error}`);

    const briefs = extractJson(result.output);
    if (!Array.isArray(briefs) || briefs.length === 0) {
      throw new Error('Could not parse post briefs from Claude output');
    }

    // Insert into post_queue
    for (let i = 0; i < briefs.length; i++) {
      const brief = briefs[i];
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO post_queue (id, automation_run_id, run_id, report_slug, post_number, total_posts, media_type, angle, brief, slide_indices)
        VALUES (${id}, ${runId}, ${pipelineRunId}, ${topicResult.slug}, ${i + 1}, ${briefs.length},
                ${brief.media_type || 'image'}, ${brief.angle || 'headline_stat'},
                ${JSON.stringify(brief)}, ${brief.slide_indices || []})
      `;
    }

    return { summary: `Seeded ${briefs.length} post briefs (${videoCount} video, ${briefs.length - videoCount} image)` };
  });

  // ── Complete ──────────────────────────────────────────────────────

  await notify({
    title: `Report published: ${topicResult.topic}`,
    message: `${topicResult.slug} is live on research.zavis.ai. ${CONFIG.postQueue.totalBriefs} post briefs queued.`,
    severity: 'info',
    automationRunId: runId,
  });
}
