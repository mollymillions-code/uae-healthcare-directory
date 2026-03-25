# Project Instructions — MANDATORY READING

This is the Zavis Landing production site (zavis.ai). Every push to `main` deploys directly to production. There is NO staging environment.

---

## ⛔ BEFORE YOU WRITE ANY CODE

1. **Run `npm run lint` before pushing.** Lint errors block deployment. Unused imports, unused variables, and type errors will fail the CI pipeline.
2. **Run `npm run build` locally before pushing** if you added/changed pages. The build generates 27k+ static pages. If it fails in CI, the deploy is blocked.
3. **Never import things you don't use.** This is the #1 cause of broken deploys. Every unused import is a lint error that blocks production deployment.

---

## Architecture

- **Framework:** Next.js 14.2.35 (App Router), React 18, TypeScript, Tailwind CSS
- **Database:** PostgreSQL 16 on EC2 (localhost:5432), database `zavis_landing`, user `zavis_admin`
- **ORM:** Drizzle ORM via `drizzle-orm/node-postgres` — schema at `src/lib/db/schema.ts`
- **Hosting:** AWS EC2 (13.205.197.148), PM2 process `zavis-landing` on port 3200, Nginx reverse proxy

## Database Driver — CRITICAL

**This project uses `pg` (node-postgres). NOT `@neondatabase/serverless`.**

Zero `@neondatabase/serverless` imports exist in this codebase. It was fully migrated. If you need DB access in a new file:

```typescript
// For Drizzle ORM queries — use the shared db instance:
import { db } from "@/lib/db";
import { someTable } from "@/lib/db/schema";
const rows = await db.select().from(someTable);

// For raw SQL in scripts:
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const result = await pool.query("SELECT ...");
await pool.end();
```

**NEVER do this:**
```typescript
// ❌ WRONG — will break everything
import { neon } from "@neondatabase/serverless";
```

## Deployment

- **Auto-deploy:** Push to `main` → GitHub Actions runs lint → deploys to EC2 via SSH
- **CI pipeline:** Lint & type-check must pass before deploy proceeds
- **Safe deploy:** Build failure → automatic rollback to last good build (site stays up)
- **Health check:** Post-deploy health check at `/api/health` — rollback if site doesn't respond
- **Verify:** Check https://github.com/zavis-support/zavis-landing/actions after pushing

## File Structure

```
src/app/(landing)/     — Marketing pages (home, about, pricing)
src/app/(directory)/   — Healthcare directory, intelligence, labs, dashboard
src/app/(research)/    — Research ecosystem
src/app/api/           — API routes
src/lib/db/            — Drizzle ORM (index.ts, schema.ts, seed.ts)
src/lib/research/      — Research platform DB + tools
src/lib/intelligence/  — Journal article automation
scripts/               — CLI scripts (ALL use pg, NOT neon)
scripts/automation/    — Cron orchestrator, daily/weekly pipelines
```

## Scripts & Workflows

All scripts run ON EC2 (not GitHub runners) because the DB is on localhost.

- **Deploy workflow:** `.github/workflows/deploy.yml` — SSH into EC2
- **Content pipeline:** `.github/workflows/journal-full-pipeline.yml` — SSH into EC2, every 2 hours
- **Shared DB module:** `scripts/automation/lib/db.mjs` — used by all automation scripts

If you add a new GitHub Actions workflow that needs the database, it MUST use `appleboy/ssh-action` to run on EC2.

## Nginx — Important

`_next/static` is served directly from disk by Nginx, NOT proxied through Next.js. This is required because route groups like `(directory)` create chunk paths with parentheses that break when URL-encoded. Do not change the Nginx config.

## Environment Variables

`.env.local` lives on EC2 at `/home/ubuntu/zavis-landing/.env.local`. It is NOT in git. Key vars:
- `DATABASE_URL` — local PostgreSQL connection string
- `GEMINI_API_KEY` — content generation
- `NEXT_PUBLIC_BASE_URL` — https://www.zavis.ai
- `R2_*` — Cloudflare R2 storage
- `DASHBOARD_KEY` — research dashboard auth

## Common Mistakes That Break Production

| Mistake | What happens | How to avoid |
|---------|-------------|--------------|
| Unused imports | Lint fails → deploy blocked | Remove imports you don't use |
| Using `@neondatabase/serverless` | DB queries fail silently | Use `pg` — see examples above |
| Editing files on EC2 via SSH | Changes wiped on next deploy | Always go through GitHub |
| Adding schema without granting permissions | Queries fail silently | Run `GRANT ALL` after schema changes |
| Not testing build locally | Build fails → deploy blocked | Run `npm run build` before pushing |

## Browser Usage
- Use `agent-browser` CLI for web browsing, screenshots, or page interaction tasks.
- Never start a Playwright session without asking the user first.
