# Deployment Instructions

## Production Environment
- **Domain:** zavis.ai
- **Hosting:** AWS EC2 instance
- **Framework:** Next.js 14 (standalone build)
- **NOT Vercel** — the `girish` remote was used for Vercel previously but is now deprecated for deployment

## How to Deploy

### Step 1: Push to both remotes
```bash
git push origin main
git push zavis-support main
```

### Step 2: Deployment is triggered automatically
Pushing to `zavis-support` (`https://github.com/zavis-support/zavis-landing.git`) triggers the EC2 deployment pipeline automatically.

### Remotes
| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/mollymillions-code/uae-healthcare-directory.git` | Source of truth |
| `zavis-support` | `https://github.com/zavis-support/zavis-landing.git` | **Deployment trigger** (EC2) |
| `girish` | `https://github.com/girish0120/zavis-ai_landing.git` | Legacy (was Vercel, now deprecated) |

### Common Issues

**zavis-support rejects push (fetch first):**
Another agent or process pushed to zavis-support. Pull first:
```bash
git pull zavis-support main --no-rebase --no-edit
git push zavis-support main
```

**Merge conflicts on pull:**
Resolve conflicts keeping the local (HEAD) version unless the remote change is clearly newer/better. Then:
```bash
git add <conflicted-files>
git commit --no-edit
git push zavis-support main
```

**Large file warnings:**
`providers-scraped.json` (~58MB) triggers GitHub warnings. This is expected — ignore the warning, the push still succeeds.

### Pre-deployment Checklist
1. `npx next build` passes with zero errors (warnings are OK)
2. All new pages generate in static output (check `✓ Generating static pages` count)
3. No secrets in committed files (.env.local is gitignored)
4. Push to `origin` first, then `zavis-support`
