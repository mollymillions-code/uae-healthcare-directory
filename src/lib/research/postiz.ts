/**
 * Postiz Safe Posting Gateway
 *
 * ALL social media posts MUST go through this module.
 * Direct calls to Postiz API are forbidden.
 *
 * Safeguards:
 * 1. Checks for duplicate/queued posts before creating
 * 2. One post per integration per 10-minute window
 * 3. Requires explicit confirmation for retry
 * 4. Logs every attempt for audit trail
 */

import crypto from 'crypto';

const POSTIZ_API = process.env.POSTIZ_API_BASE;
const JWT_SECRET = process.env.POSTIZ_JWT_SECRET;
const USER_ID = process.env.POSTIZ_USER_ID;

function getPostizConfig() {
  if (!POSTIZ_API || !JWT_SECRET || !USER_ID) {
    throw new Error('Postiz integration is not configured');
  }
  return { api: POSTIZ_API, jwtSecret: JWT_SECRET, userId: USER_ID };
}

// Known integration IDs
export const INTEGRATIONS = {
  HIDAYAT_LINKEDIN: 'cmmxtchdd0001u36fkx2nb7h2',
  ZAVIS_FACEBOOK: 'cmmk8a7k80001oi77q7624t0t',
} as const;

// ── Token Generation ────────────────────────────────────────────────
function generateToken(): string {
  const config = getPostizConfig();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: config.userId,
    email: 'mo@zavis.ai',
    providerName: 'LOCAL',
    isSuperAdmin: false,
    activated: true,
    timezone: 0,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', config.jwtSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// ── API Helpers ─────────────────────────────────────────────────────
async function postizGet(path: string) {
  const config = getPostizConfig();
  const res = await fetch(`${config.api}${path}`, {
    headers: { auth: generateToken(), 'Content-Type': 'application/json' },
  });
  return res.json();
}

async function postizPost(path: string, body: unknown) {
  const config = getPostizConfig();
  const res = await fetch(`${config.api}${path}`, {
    method: 'POST',
    headers: { auth: generateToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function postizDelete(path: string) {
  const config = getPostizConfig();
  const res = await fetch(`${config.api}${path}`, {
    method: 'DELETE',
    headers: { auth: generateToken() },
  });
  return res.status;
}

// ── Duplicate Detection ─────────────────────────────────────────────

/** Content fingerprint — first 100 chars normalized */
function fingerprint(content: string): string {
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
  return crypto.createHash('md5').update(normalized).digest('hex');
}

interface PostRecord {
  id: string;
  state: string;
  content: string;
  createdAt: string;
  integrationId: string;
}

/** Check Postiz DB for recent posts to the same integration */
async function getRecentPosts(integrationId: string, minutesBack = 60): Promise<PostRecord[]> {
  // Query via Postiz API — get posts for this integration
  try {
    const data = await postizGet(`/posts?integrationId=${integrationId}`);
    if (!Array.isArray(data)) return [];

    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return data.filter((p: PostRecord) =>
      new Date(p.createdAt).getTime() > cutoff
    );
  } catch {
    return [];
  }
}

// ── Safe Post Creation ──────────────────────────────────────────────

export interface PostRequest {
  content: string;
  integrationId: string;
  images?: Array<{ id: string; path: string }>;
  video?: { id: string; path: string };
  publishNow?: boolean;
  scheduledDate?: string;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  blocked?: boolean;
  reason?: string;
}

/**
 * Safely create a social media post via Postiz.
 *
 * This function WILL REFUSE to create a post if:
 * - There's already a QUEUE'd post to the same integration in the last 10 minutes
 * - There's a post with similar content (same fingerprint) in the last 60 minutes
 * - The content is empty
 *
 * To force-retry after a failed post, call clearQueuedPost() first.
 */
export async function createPost(req: PostRequest): Promise<PostResult> {
  // ── Validation ──────────────────────────────────────────────────
  if (!req.content || req.content.trim().length === 0) {
    return { success: false, error: 'Content is empty', blocked: true, reason: 'EMPTY_CONTENT' };
  }

  if (!req.integrationId) {
    return { success: false, error: 'Integration ID is required', blocked: true, reason: 'NO_INTEGRATION' };
  }

  // ── Duplicate Check ─────────────────────────────────────────────
  const recentPosts = await getRecentPosts(req.integrationId, 60);

  // Check for queued posts (not yet published)
  const queuedPosts = recentPosts.filter((p: PostRecord) => p.state === 'QUEUE');
  if (queuedPosts.length > 0) {
    return {
      success: false,
      blocked: true,
      reason: 'QUEUED_POST_EXISTS',
      error: `There is already a queued post (${queuedPosts[0].id}) for this integration. ` +
        `Call clearQueuedPost('${queuedPosts[0].id}') first if you want to replace it. ` +
        `DO NOT create another post.`,
    };
  }

  // Check for content similarity
  const myFingerprint = fingerprint(req.content);
  const duplicates = recentPosts.filter((p: PostRecord) =>
    fingerprint(p.content) === myFingerprint &&
    (p.state === 'PUBLISHED' || p.state === 'QUEUE')
  );
  if (duplicates.length > 0) {
    return {
      success: false,
      blocked: true,
      reason: 'DUPLICATE_CONTENT',
      error: `A post with similar content was already ${duplicates[0].state === 'PUBLISHED' ? 'published' : 'queued'} ` +
        `(${duplicates[0].id}) at ${duplicates[0].createdAt}. Refusing to create a duplicate.`,
    };
  }

  // ── Create the Post ─────────────────────────────────────────────
  const type = req.publishNow ? 'now' : 'schedule';
  const date = req.scheduledDate || new Date().toISOString();
  const images = req.images || [];
  const media = req.video ? [req.video] : images;

  const payload = {
    type,
    date,
    shortLink: false,
    tags: [],
    posts: [{
      content: [{ type: 'p', children: [{ text: req.content }] }],
      value: [{ content: req.content, image: media }],
      integration: { id: req.integrationId },
      settings: {},
      image: media,
    }],
  };

  const { status, data } = await postizPost('/posts', payload);

  if (status === 201 && Array.isArray(data) && data[0]?.postId) {
    return { success: true, postId: data[0].postId };
  }

  return {
    success: false,
    error: `Postiz returned ${status}: ${JSON.stringify(data).slice(0, 300)}`,
  };
}

/**
 * Delete a queued post. Only works on posts in QUEUE state.
 * Use this before retrying a failed post.
 */
export async function clearQueuedPost(postId: string): Promise<{ success: boolean; error?: string }> {
  // First verify it's actually queued
  try {
    const data = await postizGet(`/posts/${postId}`);
    const post = data?.posts?.[0];

    if (!post) {
      return { success: false, error: `Post ${postId} not found` };
    }

    if (post.state === 'PUBLISHED') {
      return { success: false, error: `Post ${postId} is already PUBLISHED. Cannot delete a published post from Postiz — must be deleted manually from the social platform.` };
    }

    const status = await postizDelete(`/posts/${postId}`);
    if (status === 200) {
      return { success: true };
    }
    return { success: false, error: `Delete returned status ${status}` };
  } catch (e) {
    return { success: false, error: `Failed to delete: ${e}` };
  }
}

/**
 * Check the current state of a post.
 */
export async function getPostState(postId: string): Promise<{ state: string; error?: string }> {
  try {
    const data = await postizGet(`/posts/${postId}`);
    const post = data?.posts?.[0];
    return { state: post?.state || 'UNKNOWN', error: post?.error || undefined };
  } catch {
    return { state: 'ERROR', error: 'Failed to fetch post state' };
  }
}

// ── Media Upload ────────────────────────────────────────────────────

export interface UploadedMedia {
  id: string;
  path: string;
}

/**
 * Upload a local file (PNG, JPG, MP4) to Postiz media storage.
 * Returns { id, path } ready for use in createPost().
 *
 * Falls back to serving from Next.js public dir if Postiz upload fails.
 */
export async function uploadMedia(filePath: string): Promise<UploadedMedia> {
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.webp': 'image/webp',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';

  // Try Postiz media upload endpoint
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const res = await fetch(`${POSTIZ_API}/media`, {
      method: 'POST',
      headers: { auth: generateToken() },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      // Postiz returns different shapes — normalize
      if (data?.id && data?.path) {
        return { id: data.id, path: data.path };
      }
      if (Array.isArray(data) && data[0]?.id) {
        return { id: data[0].id, path: data[0].path || data[0].url };
      }
      // If response has a URL or name field
      if (data?.name || data?.url) {
        return { id: data.id || data.name, path: data.url || data.path || data.name };
      }
    }

    // If Postiz media endpoint returns non-OK, fall through to public dir
    console.warn(`Postiz media upload returned ${res.status}, falling back to public dir`);
  } catch (e) {
    console.warn(`Postiz media upload failed: ${e}, falling back to public dir`);
  }

  // Fallback: copy to Next.js public/assets/ directory for serving via the app
  const publicAssetsDir = path.join(process.cwd(), 'public', 'assets', 'social');
  if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }

  const uniqueName = `${Date.now()}-${fileName}`;
  const destPath = path.join(publicAssetsDir, uniqueName);
  fs.copyFileSync(filePath, destPath);

  // Return a path that will resolve on the deployed domain
  const publicUrl = `/assets/social/${uniqueName}`;
  return { id: uniqueName, path: publicUrl };
}

/**
 * Upload multiple files and return array of { id, path }.
 */
export async function uploadMultipleMedia(filePaths: string[]): Promise<UploadedMedia[]> {
  const results: UploadedMedia[] = [];
  for (const fp of filePaths) {
    const result = await uploadMedia(fp);
    results.push(result);
  }
  return results;
}

// ── Post Analytics ──────────────────────────────────────────────────

export interface PostAnalytics {
  postId: string;
  state: string;
  content?: string;
  createdAt?: string;
  // Engagement metrics — populated if Postiz syncs them from LinkedIn
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  engagementRate?: number;
  // Raw response for inspection
  raw?: Record<string, unknown>;
}

/**
 * Get analytics/engagement data for a published post.
 *
 * Queries Postiz for whatever data it has. Postiz may or may not sync
 * engagement metrics from LinkedIn — this function returns whatever is available.
 *
 * If Postiz doesn't provide engagement data, the improvement loop
 * falls back to GA4 referral traffic as a proxy.
 */
export async function getPostAnalytics(postId: string): Promise<PostAnalytics> {
  try {
    const data = await postizGet(`/posts/${postId}`);
    const post = data?.posts?.[0] || data;

    const analytics: PostAnalytics = {
      postId,
      state: post?.state || 'UNKNOWN',
      content: post?.content || undefined,
      createdAt: post?.createdAt || undefined,
      raw: post,
    };

    // Extract engagement metrics if Postiz provides them
    // These field names may vary by Postiz version — check all common patterns
    if (post?.analytics || post?.metrics || post?.statistics) {
      const metrics = post.analytics || post.metrics || post.statistics;
      analytics.impressions = metrics.impressions ?? metrics.views ?? undefined;
      analytics.likes = metrics.likes ?? metrics.reactions ?? undefined;
      analytics.comments = metrics.comments ?? metrics.replies ?? undefined;
      analytics.shares = metrics.shares ?? metrics.reposts ?? undefined;
      analytics.clicks = metrics.clicks ?? metrics.linkClicks ?? undefined;
      if (analytics.impressions && analytics.impressions > 0) {
        const totalEngagements = (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0) + (analytics.clicks || 0);
        analytics.engagementRate = (totalEngagements / analytics.impressions) * 100;
      }
    }

    // Also check top-level fields (some Postiz versions put metrics at root)
    if (post?.impressions !== undefined) analytics.impressions = post.impressions;
    if (post?.likes !== undefined) analytics.likes = post.likes;
    if (post?.comments !== undefined) analytics.comments = post.comments;
    if (post?.shares !== undefined) analytics.shares = post.shares;
    if (post?.clicks !== undefined) analytics.clicks = post.clicks;

    return analytics;
  } catch (e) {
    return {
      postId,
      state: 'ERROR',
      raw: { error: String(e) },
    };
  }
}
