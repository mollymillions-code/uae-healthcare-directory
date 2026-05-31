# Claude Code Handoff — Zavis Logo Fix, Staging State, and Deployment Protocol

Date: 2026-05-23  
Repo: `/Users/kankanaray/Zavis UAE Healthcare Directory and Journal`  
Current working branch: `codex/seo-ctr-improvements-20260521`  
Latest pushed commit at handoff: `eda35ae3 Track RSC prefetch rate-limit exemption`

## Immediate User Complaint

The logo is still wrong. The site is rendering the Zavis wordmark as styled text in places instead of using the real logo asset.

Do not "fix" this by adjusting font weight, letter spacing, or rewriting the text. Use the real logo files.

Real logo assets in this repo:

- `public/zavis-logo-dark.svg`
- `public/zavis-logo-light.svg`
- `public/zavis-logo-dark.png`
- `public/zavis-logo-light.png`
- `public/zavis-icon-dark.svg`
- `public/zavis-icon-light.svg`

Likely wrong/current text-logo implementations:

- `src/components/landing/navbar/ZavisLogo.tsx`
  - Currently returns a styled text span: `zavis<span>.</span>`.
  - Replace with an actual image-based logo component using `/zavis-logo-dark.svg` or `/zavis-logo-light.svg`.
- `src/components/directory-v2/header/ZavisHeader.tsx`
  - Current brand area also renders styled text and has a comment saying it was intentionally text for baseline alignment.
  - That is now wrong per user instruction. Use the actual Zavis logo file. Keep `Healthcare Directory` as separate adjacent text, not baked into the logo.
- `src/components/research/header.tsx`
  - Current header renders `ZAVIS` and `RESEARCH` as text.
  - Use the actual Zavis logo file for the Zavis wordmark and keep `RESEARCH` as separate label text if needed.
  - The left logo/link must go to `/`, the main landing page.

Implementation guidance:

- Prefer `next/image` for the logo if it does not cause layout shift.
- Set explicit width/height or a stable CSS box so the navbar height does not jump.
- Preserve existing nav heights and visual alignment.
- For dark-on-light headers, use `/zavis-logo-dark.svg`.
- For any dark/footer context, use `/zavis-logo-light.svg` only if the background requires it.
- Do not generate a new SVG or type the logo manually.
- Verify desktop and mobile headers for landing, directory, and research surfaces.

## Current Site/Staging State

Production is still active on green. Do not assume the staged code is live.

Site server:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47
```

Current topology:

- Active production slot: `green`
- Active production PM2 app: `zavis-green`
- Active production port: `3201`
- Inactive/staged slot: `blue`
- Staged PM2 app: `zavis-blue`
- Staged port: `3200`
- Active marker: `/home/ubuntu/zavis-deploy/active-slot`
- Staged metadata: `/home/ubuntu/zavis-deploy/staged-slot`
- Shared Next static path: `/home/ubuntu/zavis-shared/_next/static`

Current staged commit:

```text
eda35ae
```

Current staged ref:

```text
codex/seo-ctr-improvements-20260521
```

Last staging tunnel from Codex was:

```text
https://trance-towers-factors-dealers.trycloudflare.com
```

This Cloudflare quick tunnel may expire. If it is dead, use direct-port checks or run the stage script again to create a fresh tunnel.

## What Codex Already Changed

### Commit `efb5b371 Fix legal links and privacy redirect`

Files changed:

- `next.config.mjs`
- `src/app/sitemap.ts`
- `src/components/layout/Footer.tsx`
- `src/app/(jobs)/jobs/signup/page.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/app/(directory)/signup/page.tsx`

Behavior:

- `/privacy` redirects permanently to `/privacy-policy`.
- `/terms` redirects permanently to `/terms-of-service`.
- Sitemap now exposes canonical legal URLs only:
  - `https://www.zavis.ai/privacy-policy`
  - `https://www.zavis.ai/terms-of-service`
- Internal legal links now point to canonical URLs.

### Commit `eda35ae3 Track RSC prefetch rate-limit exemption`

File changed:

- `scripts/ec2-deploy-infra/nginx-zavis-crawler-hardening-http.conf`

Why:

- Live Nginx logs showed `zavis_dynamic_per_ip` rate-limit blocks on legitimate Next.js RSC navigation prefetches like:
  - `/directory/dubai/language?_rsc=...`
  - `/directory/dubai/procedures?_rsc=...`
  - `/directory/dubai/24-hour?_rsc=...`
- Behind Cloudflare, multiple users can appear from the same egress IP, so RSC prefetch bursts were being falsely blocked.

What changed:

- Legitimate browser RSC requests with `Next-Router-State-Tree` are excluded from the dynamic per-IP rate-limit accounting.
- Forged/direct/crawler RSC requests remain protected by canonical redirect maps and crawler limits.
- The same hotfix was applied live on the site server and then mirrored into git so it is not lost later.

Live Nginx backup created before edit:

```text
/etc/nginx/conf.d/zavis-crawler-hardening-http.conf.bak.20260522193905-rsc-limit-key
```

Live verification already done:

- `sudo nginx -t` passed.
- `sudo systemctl reload nginx` succeeded.
- Burst test against active green RSC route returned `15/15` HTTP `200`.

## Staging QA Already Done

After staging `eda35ae` on blue:

Route checks against `127.0.0.1:3200` with `Host: www.zavis.ai`:

```text
/                                                        200
/api/health                                              200
/directory/dubai                                         200
/directory/dubai/clinics/physio-cure-medical-center-fzco-dubai 200
/privacy                                                 308 -> /privacy-policy
/privacy-policy                                          200
/terms                                                   308 -> /terms-of-service
/terms-of-service                                        200
/sitemap.xml                                             200
/sitemap-tr.xml                                          200
```

Sitemap legal check:

```text
https://www.zavis.ai/privacy-policy
https://www.zavis.ai/terms-of-service
```

Static chunk check:

- Representative `/_next/static/chunks/...js` assets referenced by staged homepage returned `200`.

PM2/log check:

- `zavis-blue` had two online workers.
- `zavis-green` had four online workers.
- Blue PM2 log scan showed no matching `ERROR`, `TypeError`, `ReferenceError`, timeout, or ECONN lines.

Production health during staging:

```text
https://www.zavis.ai/api/health -> 200
```

Local validation:

- `npm run lint` passed with pre-existing warnings only.
- `git diff --check` passed.

Local dirty files not related to this work:

```text
.ai-collab/CHANGELOG.md
.ai-collab/STATUS.md
```

Do not commit, revert, or overwrite those unless explicitly asked.

## Mandatory Deployment Protocol

Before any public website deployment, read:

- `/Users/kankanaray/.codex/skills/zavis-website-deployment/SKILL.md`
- `/Users/kankanaray/.codex/skills/zavis-server-routing/SKILL.md`
- `~/Downloads/Zavis Servers.md`
- `~/Downloads/zavis-landing-2026-04-28-migration-and-ops.md`
- `docs/ops/deployment-mess-issue.md`
- `scripts/ec2-deploy-infra/stage.sh`
- `scripts/ec2-deploy-infra/promote-staged.sh`

Non-negotiable:

- Do not build in or patch the active production slot.
- Do not restart/mutate the active production slot for code changes.
- Build and repair only the inactive slot.
- Verify the staged slot before asking for approval.
- Do not promote/swap without explicit user approval.
- Promotion must use `/home/ubuntu/zavis-deploy/promote-staged.sh`.

Public website server:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47
```

Do not deploy the public website on `13.205.197.148`; that is the internal tools/MCP server.

## Safe Staging Command

After making the logo fix and pushing the branch, stage only:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 \
  'cd /home/ubuntu/zavis-deploy && DEPLOY_REF=codex/seo-ctr-improvements-20260521 ./stage.sh'
```

If Claude uses another branch, replace `DEPLOY_REF` with that exact branch or commit SHA.

## Required Checks After Logo Fix

Run local checks:

```bash
npm run lint
git diff --check
```

Run staged route checks:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 'bash -s' <<'EOF'
set -e
for p in / /directory /directory/dubai /research /intelligence /api/health; do
  printf "%s " "$p"
  curl -sS -H "Host: www.zavis.ai" -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3200$p"
done
EOF
```

Run staged static chunk check:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 'bash -s' <<'EOF'
set -e
html=$(mktemp)
curl -sS -H "Host: www.zavis.ai" http://127.0.0.1:3200/ > "$html"
grep -Eo '/_next/static/[^"[:space:]]+\.js' "$html" | sort -u | head -20 | while read -r asset; do
  code=$(curl -sS -H "Host: www.zavis.ai" -o /dev/null -w "%{http_code}" "http://127.0.0.1:3200$asset")
  printf "%s %s\n" "$code" "$asset"
done
rm -f "$html"
EOF
```

Run staged log scan:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 \
  'pm2 logs zavis-blue --lines 120 --nostream 2>/dev/null | grep -E "ERROR|Error|Timeout|timeout|ECONN|Unhandled|TypeError|ReferenceError" || true'
```

Run browser visual QA:

- Landing homepage desktop and mobile.
- Directory header desktop and mobile.
- Research header desktop and mobile.
- Confirm the Zavis mark is an image from `/zavis-logo-dark.svg` or `/zavis-logo-light.svg`, not text.
- Confirm the research/logo click goes to `/`.
- Confirm navbar height does not crop or shift.
- Confirm no `Application error`, chunk error, or console runtime exception.

## Promotion Gate

After staging and QA, stop and ask the user for approval.

Only after explicit approval:

```bash
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 \
  'cd /home/ubuntu/zavis-deploy && ./promote-staged.sh'
```

After promotion, verify:

```bash
curl -sS -I --max-time 15 https://www.zavis.ai/ | sed -n '1,20p'
curl -sS --max-time 15 https://www.zavis.ai/api/health
```

Then verify at least one current HTML-referenced JS chunk returns `200`, because past incidents included pages returning server-side `200` while browsers crashed from missing static chunks.

## Things Not To Do

- Do not suppress or noindex Turkey pages. The user explicitly rejected that direction.
- Do not remove `LLC` or otherwise change indexed provider URLs unless explicitly requested and redirected safely.
- Do not collapse provider routes, rewrite canonical logic, or alter sitemap generation while fixing the logo.
- Do not touch `.ai-collab/CHANGELOG.md` or `.ai-collab/STATUS.md`.
- Do not deploy from the internal tools server.
- Do not promote without explicit approval.

