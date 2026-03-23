/**
 * Daily Distributor — Posts 1 LinkedIn post per invocation.
 * Called twice daily (morning + afternoon) = 2 posts/day.
 *
 * Flow:
 * 1. Get next pending post from queue
 * 2. Claude: write full post text
 * 3. Validate content (quality gate)
 * 4. Prepare media (screenshot or Remotion video)
 * 5. Upload media to Postiz
 * 6. Post via safe gateway (ONE attempt)
 * 7. Update status
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { runClaude, extractJson } from './lib/llm-runner.mjs';
import { getDb, getLatestPublishedReport, getNextPendingPost, getPendingPostCount, updateAutomationRun } from './lib/db.mjs';
import { notify } from './lib/notifications.mjs';
import { validatePostContent } from './lib/quality-gates.mjs';
import { CONFIG, PROJECT_ROOT } from './lib/config.mjs';

export async function run(runId, opts) {
  const sql = getDb();
  const { slot = 'morning' } = opts;

  console.log(`Daily distributor — ${slot} slot`);

  // ── 1. Find the latest published report ───────────────────────────

  const report = await getLatestPublishedReport();
  if (!report) {
    console.log('No published reports found. Nothing to post.');
    return;
  }

  console.log(`Report: ${report.report_title} (${report.report_slug})`);
  await updateAutomationRun(runId, { reportSlug: report.report_slug, topic: report.topic });

  // ── 2. Get next pending post ──────────────────────────────────────

  const post = await getNextPendingPost(report.report_slug);
  if (!post) {
    const count = await getPendingPostCount(report.report_slug);
    if (count === 0) {
      await notify({
        title: 'Post queue empty',
        message: `No pending posts for ${report.report_slug}. All briefs consumed or need new report.`,
        severity: 'warning',
        automationRunId: runId,
      });
    }
    console.log('No pending posts in queue.');
    return;
  }

  console.log(`Post #${post.post_number}/${post.total_posts} — ${post.media_type} — ${post.angle}`);

  // Mark as in-progress
  await sql`UPDATE post_queue SET status = 'content_ready' WHERE id = ${post.id}`;

  // ── 3. Claude: Write full post text ───────────────────────────────

  const brief = post.brief || {};

  const prompt = `Using the social-post-composer skill and human-writing-standard skill, write a LinkedIn post for Hidayat's personal account.

BRIEF:
- Angle: ${post.angle}
- Hook: ${brief.hook || 'Create a compelling opening line'}
- Key points: ${JSON.stringify(brief.key_points || ['Share key insight from research'])}
- Report: ${report.report_title}
- Report URL: https://research.zavis.ai/reports/${report.report_slug}

RULES (MUST follow ALL):
- No em dashes (—)
- No emojis
- No question as first line
- First line must stop the scroll — bold claim or surprising stat
- Keep under 3000 characters
- Put the report link in the FIRST COMMENT instruction, not the body
- 3-5 relevant hashtags at the end
- Sound like a human founder sharing insights, NOT AI-generated
- No "delve", "landscape", "paradigm", "game-changer", "cutting-edge"
- Write in Hidayat's voice — direct, confident, data-driven
- End with a call to action (read the report, share thoughts, etc.)

OUTPUT FORMAT:
Return ONLY the post text. No explanation, no markdown, no code blocks.
After the post text, on a new line write "---FIRST_COMMENT---" followed by the first comment text (containing the report link).`;

  const result = await runClaude(prompt, { timeout: CONFIG.timeouts.postCompose });
  if (!result.success) {
    await sql`UPDATE post_queue SET status = 'failed', error_message = ${result.error} WHERE id = ${post.id}`;
    throw new Error(`Post composition failed: ${result.error}`);
  }

  // Parse post text and first comment
  let postText = result.output.trim();
  let firstComment = null;

  const commentSplit = postText.split('---FIRST_COMMENT---');
  if (commentSplit.length > 1) {
    postText = commentSplit[0].trim();
    firstComment = commentSplit[1].trim();
  }

  // ── 4. Validate content ───────────────────────────────────────────

  const mediaPaths = [];
  const validation = validatePostContent(postText, post.media_type, ['placeholder']);

  if (!validation.passed) {
    console.warn('Post validation failed:', validation.issues);
    // Skip this post, mark as skipped
    await sql`UPDATE post_queue SET status = 'skipped', error_message = ${validation.issues.join('; ')} WHERE id = ${post.id}`;
    console.log(`Skipped post #${post.post_number} — moving to next.`);
    return;
  }

  // ── 5. Prepare media ──────────────────────────────────────────────

  await sql`UPDATE post_queue SET content = ${postText}, status = 'assets_ready' WHERE id = ${post.id}`;

  const slideIndices = post.slide_indices || [];
  const carouselDir = join(PROJECT_ROOT, `references/linkedin-carousel-${report.report_slug}`);

  if (post.media_type === 'image') {
    // Ensure screenshots exist
    if (!existsSync(carouselDir)) {
      console.log('Generating slide screenshots...');
      try {
        execSync(`node scripts/screenshot-slides.mjs ${report.report_slug}`, {
          cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 120000,
        });
      } catch (e) {
        await sql`UPDATE post_queue SET status = 'failed', error_message = ${'Screenshot failed: ' + e.message} WHERE id = ${post.id}`;
        throw new Error(`Screenshot generation failed: ${e.message}`);
      }
    }

    // Select specific slides
    const allSlides = readdirSync(carouselDir).filter(f => /^slide-\d+\.png$/.test(f)).sort();
    for (const idx of slideIndices) {
      const slideName = `slide-${String(idx).padStart(2, '0')}.png`;
      const slidePath = join(carouselDir, slideName);
      if (existsSync(slidePath)) {
        mediaPaths.push(slidePath);
      }
    }

    // If no specific slides matched, use first 3
    if (mediaPaths.length === 0 && allSlides.length > 0) {
      mediaPaths.push(...allSlides.slice(0, 3).map(f => join(carouselDir, f)));
    }

  } else if (post.media_type === 'video') {
    const videoDir = join(PROJECT_ROOT, `references/linkedin-video-${report.report_slug}`);
    const videoPath = join(videoDir, `video-${post.post_number}.mp4`);

    if (!existsSync(videoPath)) {
      console.log('Generating video...');

      // Write voiceover script
      const voPrompt = `Using the voiceover-script-writer skill, write a voiceover narration for a LinkedIn video about "${report.report_title}".

Use slides ${slideIndices.join(', ')} from the report.
Narrator: authority (Bloomberg-style, professional)
Target duration: 30-45 seconds
Parallel narrative — add insight the slides don't show.

Output ONLY the voiceover text for each slide, separated by newlines.`;

      const voResult = await runClaude(voPrompt, { timeout: CONFIG.timeouts.voiceover });

      // Generate voiceover audio
      if (voResult.success) {
        try {
          execSync(
            `node scripts/generate-voiceover.mjs ${report.report_slug} authority --text "${voResult.output.replace(/"/g, '\\"').slice(0, 500)}"`,
            { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: CONFIG.timeouts.voiceover }
          );
        } catch { console.warn('Voiceover generation failed — rendering silent video'); }
      }

      // Render video
      try {
        const slideArg = slideIndices.length > 0 ? slideIndices.join(',') : '';
        execSync(
          `node scripts/render-slide-video.mjs ${report.report_slug} ${slideArg}`,
          { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: CONFIG.timeouts.videoRender }
        );

        // Rename to post-specific filename
        const defaultVideo = join(videoDir, 'video.mp4');
        if (existsSync(defaultVideo)) {
          const { renameSync } = await import('fs');
          renameSync(defaultVideo, videoPath);
        }
      } catch (e) {
        await sql`UPDATE post_queue SET status = 'failed', error_message = ${'Video render failed: ' + e.message} WHERE id = ${post.id}`;
        throw new Error(`Video render failed: ${e.message}`);
      }
    }

    if (existsSync(videoPath)) {
      mediaPaths.push(videoPath);
    }
  }

  // ── 6. Upload media and post ──────────────────────────────────────

  await sql`UPDATE post_queue SET status = 'posting' WHERE id = ${post.id}`;

  // Upload media via the postiz gateway
  let uploadedMedia = [];
  if (mediaPaths.length > 0) {
    try {
      // Use the uploadMedia function from postiz.ts via dynamic import
      // Since this is an .mjs script, we call the API route instead
      for (const mp of mediaPaths) {
        // Copy to public/assets/social for serving
        const { copyFileSync, mkdirSync } = await import('fs');
        const { basename } = await import('path');
        const assetsDir = join(PROJECT_ROOT, 'public', 'assets', 'social');
        if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

        const uniqueName = `${Date.now()}-${basename(mp)}`;
        const destPath = join(assetsDir, uniqueName);
        copyFileSync(mp, destPath);

        uploadedMedia.push({
          id: uniqueName,
          path: `/assets/social/${uniqueName}`,
        });
      }
    } catch (e) {
      console.warn('Media upload warning:', e.message);
    }
  }

  // Post via safe gateway — ONE attempt
  const integrationId = CONFIG.integrations.HIDAYAT_LINKEDIN;

  const postPayload = {
    content: postText,
    integrationId,
    publishNow: true,
  };

  if (post.media_type === 'video' && uploadedMedia.length > 0) {
    postPayload.video = uploadedMedia[0];
  } else if (uploadedMedia.length > 0) {
    postPayload.images = uploadedMedia;
  }

  console.log('Posting to LinkedIn...');
  const postRes = await fetch(`${CONFIG.api.local}/api/social/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postPayload),
  });

  const postData = await postRes.json();

  if (postData.blocked) {
    console.warn(`Post BLOCKED: ${postData.reason} — ${postData.error}`);
    await sql`UPDATE post_queue SET status = 'failed', error_message = ${postData.error || postData.reason} WHERE id = ${post.id}`;
    // Do NOT retry. Move on.
    return;
  }

  if (!postData.success) {
    console.error(`Post failed: ${postData.error}`);
    await sql`UPDATE post_queue SET status = 'failed', error_message = ${postData.error} WHERE id = ${post.id}`;
    return;
  }

  // ── 7. Record success ─────────────────────────────────────────────

  const postizPostId = postData.postId;

  // Create linkedin_posts record
  const linkedinPostId = crypto.randomUUID();
  await sql`
    INSERT INTO linkedin_posts (id, run_id, account, content, first_comment, hashtags, assets, status, postiz_post_id, posted_at)
    VALUES (${linkedinPostId}, ${report.id}, ${CONFIG.posting.defaultAccount}, ${postText},
            ${firstComment}, ${[]}, ${mediaPaths.map(p => p.split('/').pop())},
            'posted', ${postizPostId}, NOW())
  `;

  // Update post_queue
  await sql`
    UPDATE post_queue SET status = 'posted', linkedin_post_id = ${linkedinPostId},
    posted_at = NOW(), image_paths = ${mediaPaths} WHERE id = ${post.id}
  `;

  console.log(`Posted! Postiz ID: ${postizPostId}`);

  // Check remaining queue
  const remaining = await getPendingPostCount(report.report_slug);
  if (remaining <= 2) {
    await notify({
      title: 'Post queue running low',
      message: `Only ${remaining} posts remaining for ${report.report_slug}.`,
      severity: 'warning',
      automationRunId: runId,
    });
  }
}
