# Zavis Research Publish Ecosystem

An AI-orchestrated research publishing platform that transforms raw research into interactive reports, distributes them across social media and email, and tracks performance — all driven by Claude Code skills.

**Live at:** [research.zavis.ai](https://research.zavis.ai)

---

## What This Does

This ecosystem takes a research topic and runs it through a full pipeline:

1. **Research** — Gathers data from web sources, validates findings, scores topic viability
2. **Report** — Architects slide structure, generates visuals, writes copy, renders a self-contained interactive HTML report
3. **Publish** — Deploys the report to the live platform
4. **Distribute** — Creates LinkedIn carousel posts (screenshots of report slides), composes video versions via Remotion, sends email campaigns to clients
5. **Measure** — Collects engagement metrics from LinkedIn, GA4, Google Search Console, and email opens

Every step is handled by a Claude Code skill. A human approves at key gates (report review, social post QA, publish go/no-go).

---

## Architecture

```
Next.js 14 (App Router)
├── /data/reports/{slug}/          → Published reports (HTML + meta.json)
├── /public/reports/{slug}/        → Report image assets
├── /src/app/reports/[slug]/       → Report viewer page
├── /src/app/dashboard/            → Analytics, posts, emails, pipeline
├── /src/app/api/                  → Social posting, email, leads, auth
├── /src/lib/                      → Postiz gateway, Plunk client, DB
├── /remotion/                     → Video compositions (slides → MP4)
├── /scripts/                      → Puppeteer screenshots, video rendering
├── /.claude/skills/               → 60+ Claude Code skills
└── /references/                   → Generated carousel images, assets
```

### Key Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| **NeonDB** | PostgreSQL — leads, pipeline state | `DATABASE_URL` |
| **Postiz** | Social media scheduling (LinkedIn, Facebook) | `localhost:4007` (Docker) |
| **Plunk** | Transactional & marketing email | `PLUNK_API_KEY` |
| **EC2 + Cloudflare** | Hosting & edge routing | Branch-based deploy |
| **Remotion** | React-based video rendering | `npm run video:studio` |
| **ElevenLabs** | AI voiceover generation (5 narrator profiles) | `ELEVENLABS_API_KEY` |
| **Puppeteer** | Report slide screenshots | `scripts/screenshot-slides.mjs` |
| **Google APIs** | GA4, Search Console analytics | `GOOGLE_*` env vars |
| **Gemini (Nano Banana)** | AI image generation for report visuals | MCP server |

---

## Reports

Reports are **self-contained interactive HTML files** — no framework dependencies, no external JS. Each one is a full-viewport scroll-snap slideshow with:

- Contextual background images on every slide
- Animated data visualizations (bars, counters, stat cards)
- Keyboard navigation (arrows, space)
- Responsive design (desktop + mobile)
- Zavis branding with editorial design language (think Deloitte/McKinsey, not SaaS)

Published reports live in `/data/reports/{slug}/report.html` and are served at `research.zavis.ai/reports/{slug}`.

### Currently Published

| Report | Slug |
|--------|------|
| AI in UAE Healthcare | `ai-healthcare-uae` |
| Clinics & Aesthetics | `clinics-aesthetics` |
| Fintech & Banking UAE | `fintech-banking-uae` |
| Future of Retail AI | `future-retail-ai` |
| Hospitality Dubai | `hospitality-dubai` |
| Qatar Business Report | `qatar-business-report` |
| Real Estate PropTech | `real-estate-protech` |

---

## Social Media Pipeline

LinkedIn posts use **screenshots of actual report slides** as carousel images — not generated cover art.

### Flow

```
Published Report (HTML)
    ↓
Puppeteer screenshots all slides (1920x1080 @2x)
    ↓
Human curates 4-5 high-signal slides
    ↓
Images uploaded to Postiz media API
    ↓
Post created via safe gateway (src/lib/postiz.ts)
    ↓
QA check → Approval gate → Publish
```

### Postiz Safe Gateway

All social posting goes through `src/lib/postiz.ts` which enforces:

- **No duplicate content** within 60 minutes (fingerprint matching)
- **One queued post per integration** at a time
- **Blocks empty content**
- Returns `blocked: true` with a reason if any rule is violated

Never call the Postiz API directly — always use the gateway.

---

## Video Pipeline (Remotion)

Turns report slides into video content for LinkedIn and other platforms.

```
Report slides (PNG screenshots)
    ↓
Remotion composition (React components)
    ↓
Intro → Slide sequence with Ken Burns + transitions → Outro
    ↓
Rendered MP4 (1920x1080 or 1080x1920)
```

### Commands

```bash
npm run video:studio          # Open Remotion Studio (preview + edit)
npm run video:render           # Render video via CLI
node scripts/render-slide-video.mjs <slug>  # Render for a specific report
```

### Structure

```
/remotion/
├── Root.tsx                   → Remotion entry point
├── index.ts                   → Bundle entry
├── compositions/
│   └── SlideVideo.tsx         → Main composition (slides + audio → video)
└── components/
    ├── Intro.tsx              → Branded intro sequence
    ├── Slide.tsx              → Individual slide with animation
    └── Outro.tsx              → CTA + branding outro
```

---

## Voiceover Pipeline (ElevenLabs)

Adds professional narration to slide videos using ElevenLabs TTS.

### How It Works

```
Selected slides (from social-asset-generator)
    ↓
voiceover-script-writer skill (writes narration YAML)
    ↓
generate-voiceover.mjs (ElevenLabs TTS → MP3)
    ↓
Remotion composition (syncs audio to slides)
    ↓
Final video with narration
```

### Narrator Profiles

Different voices for different content types — each with tuned stability, style, and boost settings:

| Profile | Voice | Tone | Best For |
|---------|-------|------|----------|
| `authority` | Deep male (Adam) | Confident, measured | LinkedIn reports, market analysis |
| `storyteller` | Warm female (Bella) | Engaging, conversational | Case studies, patient journeys |
| `analyst` | Clear male (Arnold) | Precise, neutral | Data-heavy, competitive analysis |
| `presenter` | Energetic male (Antoni) | Upbeat, keynote energy | Shorts, Reels, TikTok, ads |
| `executive` | Polished female (Rachel) | C-suite, authoritative | Executive summaries, investor content |

### Commands

```bash
# Generate voiceover from script YAML (default: authority narrator)
node scripts/generate-voiceover.mjs <slug>

# Use a specific narrator
node scripts/generate-voiceover.mjs <slug> storyteller

# Render video (auto-detects voiceover.mp3 if present)
node scripts/render-slide-video.mjs <slug>
```

### Script Writing Rules

The voiceover is a **parallel narrative** — it adds insight, not a repeat of slide text:
- 10-15 words per slide (max 20)
- Never read slide text aloud
- Open with insight, not "This slide shows..."
- Numbers spoken naturally ("four billion" not "4B")
- CTA drives to research.zavis.ai

### File Locations

| Artifact | Path |
|----------|------|
| Script YAML | `references/linkedin-video-{slug}/voiceover_script.yaml` |
| Full narration | `references/linkedin-video-{slug}/voiceover.mp3` |
| Per-slide segments | `references/linkedin-video-{slug}/audio/slide-{n}.mp3` |
| Final video | `references/linkedin-video-{slug}/video.mp4` |

### Key Files

- **Client library:** `src/lib/elevenlabs.ts` — full ElevenLabs API client with narrator profiles, usage tracking
- **Generation script:** `scripts/generate-voiceover.mjs` — CLI tool for TTS generation
- **Skill:** `.claude/skills/voiceover-script-writer/SKILL.md` — narration script writing guide

---

## Email Infrastructure

Send research distribution emails to clients via Plunk.

- **Templates:** `src/lib/email-templates.ts` — branded HTML email templates
- **Send API:** `POST /api/emails/send` — sends via Plunk with duplicate prevention
- **Preview API:** `GET /api/emails/preview` — renders email in browser before sending
- **Dashboard:** `/dashboard/emails` — view sent emails and engagement

---

## Dashboard

Available at `/dashboard` (auth-protected):

| Page | Purpose |
|------|---------|
| `/dashboard` | Overview — recent reports, pipeline status |
| `/dashboard/analytics` | GA4 + GSC metrics for the platform |
| `/dashboard/posts` | Social media posts and engagement |
| `/dashboard/emails` | Email campaigns and open rates |
| `/dashboard/pipeline` | Research pipeline status and queue |

---

## Claude Code Skills (60+)

Skills are the orchestration layer. Each skill is a prompt that tells Claude Code how to perform a specific task within the ecosystem.

### Research Pipeline

| Skill | What It Does |
|-------|-------------|
| `deep-researcher` | Gathers data via web search, validates sources |
| `research-synthesizer` | Structures findings into narrative-ready synthesis |
| `research-scorer` | Scores report performance, recommends topics |
| `research-conductor` | Orchestrates the full research pipeline |

### Report Creation

| Skill | What It Does |
|-------|-------------|
| `report-architect` | Designs slide structure, image briefs, color maps |
| `content-writer` | Writes narrative copy per slide |
| `zavis-creative-director` | Generates background images via Gemini |
| `report-renderer` | Assembles final interactive HTML report |
| `report-cover-generator` | Creates editorial cover images |
| `report-preview-manager` | Manages preview links and feedback cycle |
| `research-publisher` | Publishes approved reports to production |

### Social Media

| Skill | What It Does |
|-------|-------------|
| `social-asset-generator` | Screenshots report slides for LinkedIn carousels |
| `social-post-composer` | Writes platform-optimized post copy |
| `social-qa-checker` | Pre-publish quality and brand check |
| `social-approval-gate` | Human approval before publishing |
| `social-publisher` | Publishes via Postiz gateway |
| `social-content-adapter` | Adapts posts across platforms |
| `social-calendar-manager` | Content calendar and scheduling |
| `social-analytics-reporter` | Post performance reporting |
| `social-platform-connector` | Platform integration health checks |
| `research-content-extractor` | Extracts hooks and stats from reports for posts |

### Video & Voiceover

| Skill | What It Does |
|-------|-------------|
| `video-producer` | Full video creation workflow (Remotion + AI tools) |
| `voiceover-script-writer` | Writes narration scripts, selects narrator voice profiles |
| `image-creator` | Static image content creation |
| `prompt-composer` | Crafts prompts for visual asset generation |

### Email

| Skill | What It Does |
|-------|-------------|
| `email-marketer` | Campaign creation and sending |
| `email-template-designer` | Branded HTML email templates |
| `email-content-composer` | Writes email copy from report content |

### Advertising

| Skill | What It Does |
|-------|-------------|
| `ad-manager` | Paid ad campaign management |
| `campaign-planner` | Campaign planning and calendar |
| `ads-optimization-loop` | Auto-optimization cycle for ad performance |

### Analytics & SEO

| Skill | What It Does |
|-------|-------------|
| `analytics-reporter` | GA4 + GSC performance reporting |
| `performance-collector` | Gathers post-publish metrics |
| `seo-optimizer` | SEO monitoring and optimization |
| `aeo-optimizer` | AI Engine Optimization |

### Platform & Brand

| Skill | What It Does |
|-------|-------------|
| `zavis-knowledge` | Company knowledge base |
| `zavis-master` | Platform context and content writing |
| `zavis-designer` | Design replication |
| `zavis-content-skill-set` | On-brand website content |
| `zavis-dashboards-frontend` | Dashboard UI components |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for Postiz)
- A `.env.local` file (see `.env.local.example`)

### Setup

```bash
npm install
cp .env.local.example .env.local   # Fill in your API keys
npm run dev                         # Start Next.js dev server
```

### Key Environment Variables

```
DATABASE_URL          → NeonDB connection string
PLUNK_API_KEY         → Plunk email API key
POSTIZ_JWT_SECRET     → JWT secret for Postiz auth
GOOGLE_CLIENT_EMAIL   → GA4/GSC service account
GOOGLE_PRIVATE_KEY    → GA4/GSC service account key
GA4_PROPERTY_ID       → Google Analytics 4 property
GSC_SITE_URL          → Google Search Console site
GEMINI_API_KEY        → Gemini API for image generation
ELEVENLABS_API_KEY    → ElevenLabs TTS for voiceover generation
```

### Common Workflows

**Publish a new report:**
```
/research-conductor → /deep-researcher → /research-synthesizer
→ /report-architect → /content-writer → /zavis-creative-director
→ /report-renderer → /report-preview-manager → /research-publisher
```

**Create a LinkedIn post from a report:**
```
/research-content-extractor → /social-asset-generator
→ /social-post-composer → /social-qa-checker
→ /social-approval-gate → /social-publisher
```

**Create a video with voiceover from report slides:**
```
/social-asset-generator (screenshot slides)
→ /voiceover-script-writer (write narration script)
→ node scripts/generate-voiceover.mjs <slug> [narrator]
→ node scripts/render-slide-video.mjs <slug>
```

**Send email campaign:**
```
/email-content-composer → /email-template-designer
→ /email-marketer (preview → approve → send)
```

---

## Design Philosophy

- **Editorial, not marketing.** The platform builds authority like Deloitte or McKinsey, not a SaaS landing page.
- **Every report is unique.** No templates — each report gets bespoke design thinking.
- **Data is real.** Never fabricate numbers. Every stat comes from the source material.
- **Safety first.** External actions (posts, emails) have duplicate prevention baked into the code, not just the prompts.
- **Human in the loop.** AI drafts, humans approve. Every publish and post has a gate.
