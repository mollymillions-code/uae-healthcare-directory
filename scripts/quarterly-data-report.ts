/**
 * Quarterly Healthcare Data Report Generator
 *
 * Runs on EC2 quarterly (Jan, Apr, Jul, Oct). Queries the providers database
 * for aggregated insights, generates a data-rich intelligence article via
 * Claude CLI, and publishes to journal_articles.
 *
 * Usage: npx tsx scripts/quarterly-data-report.ts
 *
 * Reports generated:
 *  - Provider distribution by emirate
 *  - Category breakdown (which specialties dominate)
 *  - Average ratings by city
 *  - Insurance coverage landscape
 *  - 24-hour and emergency capacity
 *  - Quarter-over-quarter growth (new providers)
 */

import { Pool, QueryResult } from "pg";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ─── Tagged template SQL helper ───────────────────────────────────────────────

function createSql(pool: Pool) {
  return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> => {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) text += `$${i + 1}`;
    }
    const result: QueryResult = await pool.query(text, values);
    return result.rows;
  };
}

// ─── Quarter helpers ──────────────────────────────────────────────────────────

function getQuarterLabel(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

function getQuarterSlug(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `uae-healthcare-data-report-q${q}-${now.getFullYear()}`;
}

function getPreviousQuarterDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 3, 1);
}

// ─── Claude CLI Runner ────────────────────────────────────────────────────────

function callClaude(prompt: string, timeoutMs = 8 * 60 * 1000): string {
  const tmpFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`);
  try {
    writeFileSync(tmpFile, prompt, "utf-8");
    const result = execSync(
      `cat "${tmpFile}" | claude --print -p -`,
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        encoding: "utf-8",
        env: {
          ...process.env,
          PATH: process.env.PATH,
          CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN || "",
        },
      }
    );
    return result.trim();
  } catch (err) {
    const error = err as { stderr?: string; message?: string };
    console.error(`[Claude CLI] Error: ${(error.stderr || error.message || "").slice(0, 200)}`);
    return "";
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

function extractJson(output: string): Record<string, unknown> | null {
  const codeBlockMatch = output.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch { /* fall through */ }
  }
  const jsonMatch = output.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
  }
  return null;
}

// ─── Imagen 4.0 Image Generator ───────────────────────────────────────────────

const R2_PUBLIC = "https://pub-12b97f7acbe84e70aacc715287b58c72.r2.dev";

async function generateImage(title: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Professional editorial photograph for a healthcare data report titled "${title}". Scene: a modern data analytics dashboard showing healthcare statistics on multiple monitors in a glass-walled office overlooking a Middle Eastern cityscape at golden hour. Style: photojournalistic, cinematic lighting, shallow depth of field. NO text, NO watermarks, NO logos. 16:9 landscape.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "16:9" },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const prediction = data.predictions?.[0];
    if (prediction?.bytesBase64Encoded) {
      return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── R2 Upload ────────────────────────────────────────────────────────────────

async function uploadToR2(dataUri: string, slug: string): Promise<string | null> {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL || R2_PUBLIC;

  if (!endpoint || !accessKey || !secretKey || !bucket) return null;

  try {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const key = `intelligence/${slug}.png`;

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    }));

    return `${publicUrl}/${key}`;
  } catch {
    return null;
  }
}

// ─── Data Collection Queries ──────────────────────────────────────────────────

interface QuarterlyData {
  totalProviders: number;
  activeProviders: number;
  providersByCity: { city_slug: string; city_name: string; count: number }[];
  providersByCategory: { category_slug: string; count: number }[];
  avgRatingByCity: { city_slug: string; avg_rating: number; rated_count: number }[];
  topRatedProviders: { name: string; city_slug: string; category_slug: string; rating: number; review_count: number }[];
  insuranceCoverage: { insurer: string; provider_count: number }[];
  twentyFourHourCount: number;
  newProvidersSinceLastQ: number;
  totalArticles: number;
}

async function collectQuarterlyData(sql: ReturnType<typeof createSql>): Promise<QuarterlyData> {
  console.log("[Data] Collecting quarterly statistics...\n");

  // Total providers
  const totalRows = await sql`SELECT COUNT(*)::int as count FROM providers`;
  const totalProviders = totalRows[0].count as number;

  const activeRows = await sql`SELECT COUNT(*)::int as count FROM providers WHERE status = 'active'`;
  const activeProviders = activeRows[0].count as number;

  // By city (join cities table for name)
  const providersByCity = await sql`
    SELECT p.city_slug, c.name as city_name, COUNT(*)::int as count
    FROM providers p
    JOIN cities c ON p.city_id = c.id
    WHERE p.status = 'active'
    GROUP BY p.city_slug, c.name
    ORDER BY count DESC
  ` as { city_slug: string; city_name: string; count: number }[];

  // By category
  const providersByCategory = await sql`
    SELECT category_slug, COUNT(*)::int as count
    FROM providers
    WHERE status = 'active'
    GROUP BY category_slug
    ORDER BY count DESC
    LIMIT 20
  ` as { category_slug: string; count: number }[];

  // Average rating by city
  const avgRatingByCity = await sql`
    SELECT city_slug,
           ROUND(AVG(google_rating::numeric), 2) as avg_rating,
           COUNT(*)::int as rated_count
    FROM providers
    WHERE status = 'active' AND google_rating IS NOT NULL AND google_rating::numeric > 0
    GROUP BY city_slug
    ORDER BY avg_rating DESC
  ` as { city_slug: string; avg_rating: number; rated_count: number }[];

  // Top-rated providers
  const topRatedProviders = await sql`
    SELECT name, city_slug, category_slug,
           google_rating::numeric as rating,
           google_review_count as review_count
    FROM providers
    WHERE status = 'active'
      AND google_rating IS NOT NULL
      AND google_rating::numeric >= 4.5
      AND google_review_count >= 50
    ORDER BY google_rating DESC, google_review_count DESC
    LIMIT 10
  ` as { name: string; city_slug: string; category_slug: string; rating: number; review_count: number }[];

  // Insurance coverage — top insurers by provider acceptance
  const insuranceCoverage = await sql`
    SELECT elem as insurer, COUNT(DISTINCT p.id)::int as provider_count
    FROM providers p, jsonb_array_elements_text(p.insurance) elem
    WHERE p.status = 'active'
      AND jsonb_array_length(p.insurance) > 0
    GROUP BY elem
    ORDER BY provider_count DESC
    LIMIT 15
  ` as { insurer: string; provider_count: number }[];

  // 24-hour providers — matches is24HourProvider logic:
  // operating_hours has any day with open="00:00" AND close="23:59",
  // OR name contains "24"
  const twentyFourHourRows = await sql`
    SELECT COUNT(*)::int as count
    FROM providers
    WHERE status = 'active'
      AND (
        (operating_hours IS NOT NULL
         AND operating_hours::text LIKE '%"open":"00:00"%'
         AND operating_hours::text LIKE '%"close":"23:59"%')
        OR lower(name) LIKE '%24%'
      )
  `;
  const twentyFourHourCount = twentyFourHourRows[0].count as number;

  // New providers since last quarter
  const lastQDate = getPreviousQuarterDate();
  const newRows = await sql`
    SELECT COUNT(*)::int as count
    FROM providers
    WHERE created_at >= ${lastQDate.toISOString()}
  `;
  const newProvidersSinceLastQ = newRows[0].count as number;

  // Total articles
  const articleRows = await sql`SELECT COUNT(*)::int as count FROM journal_articles WHERE status = 'published'`;
  const totalArticles = articleRows[0].count as number;

  return {
    totalProviders,
    activeProviders,
    providersByCity,
    providersByCategory,
    avgRatingByCity,
    topRatedProviders,
    insuranceCoverage,
    twentyFourHourCount,
    newProvidersSinceLastQ,
    totalArticles,
  };
}

// ─── Article Generation ───────────────────────────────────────────────────────

function buildArticlePrompt(data: QuarterlyData): string {
  const quarter = getQuarterLabel();

  return `You are a senior healthcare data analyst writing for the Zavis Healthcare Industry Insights — the definitive source for healthcare industry data in the United Arab Emirates.

Write a quarterly healthcare data report for ${quarter}. This is a data-driven analysis based on the UAE Open Healthcare Directory's database of ${data.activeProviders} active healthcare providers.

AUDIENCE: Healthcare industry operators (CEOs, CFOs, COOs, investors) who make decisions based on market data.

VOICE: Financial Times data journalism. Every paragraph must contain at least one specific number. No fluff.

DATA TO ANALYZE:

1. PROVIDER DISTRIBUTION BY EMIRATE:
${data.providersByCity.map(c => `   - ${c.city_name}: ${c.count} providers`).join("\n")}

2. PROVIDER DISTRIBUTION BY SPECIALTY (top 20):
${data.providersByCategory.map(c => `   - ${c.category_slug.replace(/-/g, " ")}: ${c.count} providers`).join("\n")}

3. AVERAGE GOOGLE RATING BY CITY:
${data.avgRatingByCity.map(c => `   - ${c.city_slug}: ${c.avg_rating} avg rating (${c.rated_count} rated providers)`).join("\n")}

4. TOP-RATED PROVIDERS (4.5+ rating, 50+ reviews):
${data.topRatedProviders.map(p => `   - ${p.name} (${p.city_slug}, ${p.category_slug.replace(/-/g, " ")}): ${p.rating}★ (${p.review_count} reviews)`).join("\n")}

5. INSURANCE NETWORK SIZE (providers accepting each insurer):
${data.insuranceCoverage.map(i => `   - ${i.insurer}: ${i.provider_count} providers`).join("\n")}

6. KEY METRICS:
   - Total providers in directory: ${data.totalProviders}
   - Active providers: ${data.activeProviders}
   - 24-hour facilities: ${data.twentyFourHourCount}
   - New providers added since last quarter: ${data.newProvidersSinceLastQ}
   - Published intelligence articles: ${data.totalArticles}

ARTICLE REQUIREMENTS:
- Title: Include "${quarter}" and a specific number. Under 120 characters. Sentence case.
- Excerpt: 2-3 sentences with the key finding. Under 200 characters.
- Body: 600-900 words of rich HTML.
- Structure the body with:
  * Lead paragraph: the single most interesting finding
  * Section: Provider landscape (distribution by city + category)
  * Section: Quality benchmarks (ratings by city, top performers)
  * Section: Insurance coverage gaps or strengths
  * Section: Growth trends and what to watch
- Use <p>, <h3> (sentence case), <strong> for key numbers/names, <ul><li> for data lists, <blockquote> for key findings.
- Every section must have at least one <strong> bolded fact.
- Reference DHA, DOH, or MOHAP as the relevant regulators.
- End with a forward-looking "what to watch" paragraph.

Generate a JSON object with these exact fields (JSON only, no markdown fences):
{
  "slug": "${getQuarterSlug()}",
  "title": "...",
  "excerpt": "...",
  "body": "... full HTML ...",
  "tags": ["data-report", "quarterly", "uae-healthcare", "market-intelligence", "provider-distribution"],
  "readTimeMinutes": 5
}

Return ONLY the JSON object.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const quarter = getQuarterLabel();
  const slug = getQuarterSlug();

  console.log(`\n========================================`);
  console.log(`  Quarterly Data Report: ${quarter}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  // Verify Claude CLI
  try {
    execSync("which claude", { stdio: "pipe" });
    console.log("[Pipeline] Claude CLI: found");
  } catch {
    console.error("[Pipeline] FATAL: Claude CLI not installed.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 2,
    idleTimeoutMillis: 10000,
  });
  const sql = createSql(pool);

  // Check for duplicate
  const existing = await sql`SELECT id FROM journal_articles WHERE slug = ${slug}`;
  if (existing.length > 0) {
    console.log(`[Skip] Report for ${quarter} already exists (slug: ${slug}). Exiting.`);
    await pool.end();
    return;
  }

  // 1. Collect data
  const data = await collectQuarterlyData(sql);
  console.log(`[Data] Total: ${data.totalProviders} providers, ${data.activeProviders} active`);
  console.log(`[Data] Cities: ${data.providersByCity.length}, Categories: ${data.providersByCategory.length}`);
  console.log(`[Data] New since last quarter: ${data.newProvidersSinceLastQ}`);

  // 2. Generate article via Claude CLI (2-pass)
  console.log("\n[Draft] Generating article...");
  const prompt = buildArticlePrompt(data);
  const draftOutput = callClaude(prompt);
  if (!draftOutput) {
    console.error("[FATAL] Claude CLI returned empty output");
    await pool.end();
    process.exit(1);
  }

  const parsed = extractJson(draftOutput);
  if (!parsed || !parsed.title || !parsed.body) {
    console.error("[FATAL] Could not parse article JSON");
    console.error("Raw output:", draftOutput.slice(0, 500));
    await pool.end();
    process.exit(1);
  }

  // Pass 2: Review
  console.log("[Review] Editing article...");
  const reviewPrompt = `You are a senior editor at the Zavis Healthcare Industry Insights. Review and improve this quarterly data report draft.

DRAFT:
${JSON.stringify(parsed, null, 2)}

REVIEW CHECKLIST:
1. Does the title include a specific number and the quarter? Fix if not.
2. Is the excerpt under 200 characters and specific? Tighten if needed.
3. Does every paragraph contain at least one specific number? Add data if missing.
4. Are there <h3> subheadings breaking up the content? Add if missing.
5. Are key numbers and names wrapped in <strong>? Add if missing.
6. Is there at least one <ul><li> data list? Add if missing.
7. Is the tone authoritative and factual (Financial Times style)? Remove any fluff.
8. Does it end with a forward-looking "what to watch" section? Add if missing.

Return the improved version as JSON with the same fields (slug, title, excerpt, body, tags, readTimeMinutes). JSON only, no markdown fences.`;

  const reviewOutput = callClaude(reviewPrompt);
  const improved = reviewOutput ? extractJson(reviewOutput) : null;
  const final = improved && improved.body ? improved : parsed;

  console.log(`[Article] Title: ${(final.title as string).slice(0, 80)}`);

  // 3. Generate image
  console.log("[Image] Generating via Imagen 4.0...");
  let imageUrl: string | null = null;
  const genImage = await generateImage(final.title as string);
  if (genImage) {
    const r2Url = await uploadToR2(genImage, slug);
    if (r2Url) {
      imageUrl = r2Url;
      console.log(`[Image] Uploaded to R2: ${r2Url}`);
    }
  }
  if (!imageUrl) {
    imageUrl = `${R2_PUBLIC}/intelligence/gcc-medical-tourism-uae-market-share.webp`;
    console.log("[Image] Using fallback");
  }

  // 4. Persist to DB
  const id = `j-qdr-${nanoid(8)}`;
  try {
    await sql`
      INSERT INTO journal_articles (id, slug, title, excerpt, body, category, tags, source, source_url, source_name, author_name, author_role, image_url, is_featured, is_breaking, read_time_minutes, status, published_at)
      VALUES (${id}, ${final.slug as string}, ${final.title as string}, ${final.excerpt as string}, ${final.body as string}, ${"market-intelligence"}, ${JSON.stringify(final.tags || [])}, ${"original"}, ${null}, ${"UAE Open Healthcare Directory"}, ${"Data Intelligence Desk"}, ${"Quarterly Analysis"}, ${imageUrl}, ${true}, ${false}, ${(final.readTimeMinutes as number) || 5}, ${"published"}, NOW())
      ON CONFLICT (slug) DO NOTHING
    `;
    console.log(`\n[Published] ${final.title}`);
    console.log(`[Published] Slug: ${final.slug}`);
    console.log(`[Published] URL: https://www.zavis.ai/intelligence/${final.slug}`);
  } catch (err) {
    console.error(`[FATAL] DB insert failed:`, err);
    await pool.end();
    process.exit(1);
  }

  // 5. Trigger revalidation
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const secret = process.env.REVALIDATION_SECRET;
  if (baseUrl && secret) {
    try {
      await fetch(`${baseUrl}/api/revalidate?secret=${secret}&path=/intelligence`);
      console.log("[Revalidation] Triggered for /intelligence");
    } catch { /* best effort */ }
  }

  // 6. IndexNow notification
  const indexNowKey = process.env.INDEXNOW_KEY;
  if (baseUrl && indexNowKey) {
    try {
      await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: new URL(baseUrl).host,
          key: indexNowKey,
          keyLocation: `${baseUrl}/${indexNowKey}.txt`,
          urlList: [`${baseUrl}/intelligence/${final.slug}`],
        }),
      });
      console.log("[IndexNow] Notified search engines");
    } catch { /* best effort */ }
  }

  const finalCount = await sql`SELECT COUNT(*)::int as count FROM journal_articles WHERE status = 'published'`;
  console.log(`\n=== Done. Total published articles: ${finalCount[0].count} ===`);
  await pool.end();
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
