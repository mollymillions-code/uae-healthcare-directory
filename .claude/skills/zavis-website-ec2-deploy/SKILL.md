---
name: zavis-website-ec2-deploy
description: "Zavis Website EC2 Deployment Skill — zero-downtime blue-green deployment for zavis.ai on EC2 (13.205.197.148). Use whenever the user asks to: deploy the Zavis website, SSH into the server, restart or check the app, tail PM2 or Nginx logs, debug a failed deploy, roll back, run DB migrations, check server health, verify the site is up, or anything requiring EC2 access. Triggers on: 'the server', 'production is down', 'deploy failed', 'check logs', 'PM2', 'restart the app', 'health check', 'Nginx', 'ssh in', 'check the server', 'zavis.ai is down', 'blue-green', 'rollback', or any reference to the live site."
---

# Zavis Website — EC2 Deployment (Blue-Green, Zero-Downtime)

## ABSOLUTE RULES

1. **NEVER deploy by SSH-ing into EC2 and running commands.** All deploys go through GitHub Actions by pushing to `live`. The only exception is `rollback.sh` for emergencies.
2. **NEVER stop, delete, or modify the live PM2 process or its directory**
3. **NEVER run `rm -rf .next` or `npm run build` on the live slot**
4. **NEVER pipe build output through `head`, `tail`, or any pipe-closing command** — SIGPIPE kills the build silently
5. **NEVER run two `next build` processes simultaneously** — they corrupt each other
6. **NEVER edit source files directly on EC2** — changes get wiped on next deploy
7. **NEVER use `appleboy/ssh-action`** — it opens dual SSH connections that race. Use raw SSH in workflows.
8. **If unsure whether an action affects the live site: STOP and ASK the user first**
9. **NEVER allow `2 old + 2 new` slot workers during deploy or rollback** — with the current PM2 shape, that is a known deploy-time OOM path
10. **ALWAYS read** `docs/ops/blue-green-deploy-oom-runbook.md`, `.claude/engineering-journal.md`, and `.claude/napkin.md` **before deploy debugging or EC2 changes**
11. **Do not mix incident classes** — provider sitemap CPU oscillation and deploy-time OOM are separate problems with separate fixes

---

## PRE-FLIGHT CHECK (Run Before Any Server Operation)

```bash
EC2="ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148"

ACTIVE=$($EC2 "cat /home/ubuntu/zavis-deploy/active-slot")
if [ "$ACTIVE" = "blue" ]; then LIVE_PORT=3200; else LIVE_PORT=3201; fi

# Both must return 200
$EC2 "curl -s -o /dev/null -w '%{http_code}' http://localhost:$LIVE_PORT/"
$EC2 "curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' http://localhost/"
```

---

## App Details

| Property | Value |
|---|---|
| Domain | `www.zavis.ai` |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Static pages | ~4,057 pre-rendered at build |
| Build time | ~4-5 minutes |
| DB pool | max 10 connections (in `src/lib/db/index.ts`) |
| Deploy branch | `live` |

**Git remotes (local):**
- `origin` → `mollymillions-code/uae-healthcare-directory` (dev repo, runs lint only)
- `zavis-support` → `zavis-support/zavis-landing` (EC2 pulls from here, runs deploy)

Push to **both** remotes. Only `zavis-support` triggers the actual deploy (guarded by `if: github.repository == 'zavis-support/zavis-landing'` in the workflow).

---

## Server Access

| IP | `13.205.197.148` |
|---|---|
| SSH user | `ubuntu` |
| PEM key | `~/.ssh/zavis-ec2.pem` |

```bash
EC2="ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148"
```

---

## Blue-Green Architecture

Two identical app copies. One is **live** (serving traffic), the other is **idle** (backup/build target).

Important:

- the historical deploy flow on EC2 starts the idle slot before stopping the old live slot
- that flow became unsafe after the PM2 fire-drill change to `instances: 2` and `max_memory_restart: "6G"`
- the required fix is documented in [blue-green-deploy-oom-runbook.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/docs/ops/blue-green-deploy-oom-runbook.md)
- the safe target is bounded overlap: build idle at `0`, start idle at `1`, swap, stop old live, then scale new live from `1 -> 2`
- on PM2 `6.0.14`, `pm2 start ecosystem.config.js --only <app> -i 1` was verified to ignore the CLI `-i 1` override and honor `instances` from the ecosystem file
- therefore, the `1`-worker start must come from a config-controlled override, not a bare CLI `-i 1` flag

```
/home/ubuntu/zavis-landing-blue/     ← Blue slot (port 3200, PM2: zavis-blue)
/home/ubuntu/zavis-landing-green/    ← Green slot (port 3201, PM2: zavis-green)
/home/ubuntu/zavis-landing-active    ← Symlink → live slot
/home/ubuntu/zavis-shared/           ← Shared .env.local + data/ (symlinked into both)
/home/ubuntu/zavis-deploy/           ← Deploy infra (ON EC2 ONLY, not in git)
  ├── active-slot                    ← "blue" or "green"
  ├── deploy.sh                      ← Called by GitHub Actions
  ├── rollback.sh                    ← Instant rollback
  └── ecosystem.config.js            ← PM2 config for both slots
```

### Nginx

```
/etc/nginx/conf.d/zavis-upstream.conf   ← upstream zavis_backend { server 127.0.0.1:<PORT>; }
/etc/nginx/sites-available/zavis.ai     ← Main domain config
```

Both site configs use the `zavis-landing-active` symlink for serving `/_next/static` directly from disk. **Do not change the Nginx config** — route groups with parentheses break when URL-encoded through proxy.

---

## How to Deploy

**Always push through GitHub Actions. Never SSH in to deploy manually.**

```bash
git push origin live
git push zavis-support live
```

GitHub Actions: lint → type check → SSH into EC2 → runs `deploy.sh`.

Important:

- until the bounded-overlap runbook is implemented on the server control plane, a normal push-to-`live` still uses the current EC2 `deploy.sh`
- that means the deployment path may still carry the known full-overlap OOM risk until the server-side deploy logic is updated

### Required reading before any deploy or deploy-debug work

- [blue-green-deploy-oom-runbook.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/docs/ops/blue-green-deploy-oom-runbook.md)
- [.claude/engineering-journal.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/.claude/engineering-journal.md:8)
- [.claude/napkin.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/.claude/napkin.md:19)

### Current server `deploy.sh` behavior

This is the historically documented server-side flow:

1. `flock` — acquires exclusive lock, exits if another deploy is running
2. Reads `active-slot` → determines LIVE (untouched) and IDLE (build target)
3. `git pull origin live` + `npm install` on IDLE slot
4. Symlinks `.env.local` and `data/` from `/home/ubuntu/zavis-shared/`
5. `rm -rf .next` → `npm run build` on IDLE slot (~4-5 min). If build fails → exit, live unaffected
6. `pm2 start` IDLE slot → health check (retries 30x, 60s). If fails → stop idle, exit
7. Swap Nginx upstream → `nginx -t` → `systemctl reload nginx`. If nginx -t fails → revert
8. Post-swap health check with `-H 'Host: www.zavis.ai'`. If fails → revert upstream, reload
9. Stop old live slot, update `active-slot`, `pm2 save`

With the current PM2 shape, that flow is **not** safe enough by itself because it can transiently create `2 old + 2 new` overlap. Treat it as the current state to inspect, not the target pattern to preserve.

### Required target deploy behavior

Future deploy control-plane work must converge to the bounded-overlap model from [blue-green-deploy-oom-runbook.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/docs/ops/blue-green-deploy-oom-runbook.md):

1. stop idle slot before build
2. build idle slot with `0` idle PM2 workers
3. verify no orphan `next build` workers remain
4. start idle slot at exactly `1` worker via a config-controlled override such as `ZAVIS_PM2_INSTANCES=1`
5. direct-port health check idle
6. switch Nginx upstream
7. post-swap edge health check with `Host: www.zavis.ai`
8. stop old live slot completely
9. scale new live slot from `1 -> 2`
10. `pm2 save`

The deploy path must never allow:

- `2 blue + 2 green`
- and must not rely on `pm2 start ecosystem.config.js --only <app> -i 1` unless that behavior has been proven on the installed PM2 version

**Concurrency guards:**
- GitHub Actions: `concurrency: { group: deploy-live, cancel-in-progress: false }`
- deploy.sh: `flock` on `/tmp/zavis-deploy.lock` — rejects concurrent runs
- Workflow only fires from `zavis-support` repo (not `origin`)

### Monitor deploys

```bash
gh run list --limit 5
gh run watch
gh run view <run-id> --log
```

---

## Rollback

### Instant rollback (seconds)

```bash
$EC2 "/home/ubuntu/zavis-deploy/rollback.sh"
```

Starts the previous slot, health-checks it, swaps Nginx back, stops the broken slot.

Rollback must respect the same overlap budget as deploy:

- do not allow `2 broken + 2 restored`
- follow the bounded-overlap rollback shape from [blue-green-deploy-oom-runbook.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/docs/ops/blue-green-deploy-oom-runbook.md)

### Git revert (audit trail, ~5 min rebuild)

```bash
git revert HEAD
git push origin live && git push zavis-support live
```

---

## Emergency Recovery: Site Is Down

```bash
EC2="ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148"
ACTIVE=$($EC2 "cat /home/ubuntu/zavis-deploy/active-slot")
if [ "$ACTIVE" = "blue" ]; then PORT=3200; else PORT=3201; fi

# 1. Restart active slot
$EC2 "pm2 restart zavis-$ACTIVE"
sleep 10
$EC2 "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/"

# 2. Check logs
$EC2 "pm2 logs zavis-$ACTIVE --err --lines 50"

# 3. Rollback to other slot
$EC2 "/home/ubuntu/zavis-deploy/rollback.sh"

# 4. LAST RESORT: both broken — rebuild (use nohup, SSH times out)
$EC2 "cd /home/ubuntu/zavis-landing-$ACTIVE && rm -rf .next node_modules/.cache && nohup bash -c 'NODE_OPTIONS=\"--max-old-space-size=4096\" npm run build > /tmp/rebuild.log 2>&1' > /dev/null 2>&1 &"
$EC2 "tail -5 /tmp/rebuild.log"
```

---

## Hard-Won Lessons (April 2026 Deploy Session)

These cost 4+ hours of debugging. Do not repeat them.

| Lesson | Detail |
|---|---|
| **Health checks need Host header** | `curl localhost/` without `-H 'Host: www.zavis.ai'` hits Nginx default server → 404. Always include the Host header for Nginx-level checks. |
| **`appleboy/ssh-action` opens dual connections** | Two deploy.sh processes run concurrently, corrupt the build. Use raw SSH in workflows instead. |
| **Deploy webhook races with GitHub Actions** | `zavis-deploy-webhook` (PM2 process) also triggers deploy.sh on push. It's currently stopped/errored — leave it that way, or delete it. |
| **`generateStaticParams` exhausts DB pool** | Insurance pages with `generateStaticParams` opened too many connections during build. Fixed by removing static params and using `force-dynamic`. Watch for this pattern on any page with DB queries in static params. |
| **Two repos = two deploys** | Both `origin` and `zavis-support` had deploy workflows. Fixed with `if: github.repository == 'zavis-support/zavis-landing'`. Origin only runs lint. |
| **Always clear `node_modules/.cache`** | Before rebuilding after a failed build. Stale cache → `next-font-manifest.json` missing errors. |
| **Always use `nohup` for manual builds** | SSH times out in ~20 min. Without nohup, disconnect kills the build mid-way. |
| **Deploy-time OOM is overlap math, not crawler pressure** | The known April 2026 crash was `instances: 2` on both slots plus `6G` ceilings plus orphan build workers. Treat deploy OOM and sitemap CPU as separate problems. |
| **Use `MemAvailable`, not `free`, for deploy headroom** | `free -h` is not the decision metric. Check `MemAvailable` or `free -m` `available`, and follow the runbook threshold. |
| **PM2 cluster mode shows one row per worker** | Two `zavis-blue` rows can be legitimate siblings when `instances: 2`. Verify with `NODE_APP_INSTANCE`, `pm2 describe`, or timestamps before calling anything a duplicate. |
| **PM2 `-i 1` was ignored with the ecosystem file on PM2 6.0.14** | Verified during bounded-overlap testing: `pm2 start ecosystem.config.js --only zavis-green -i 1` still started both configured workers. Use a config-driven instance override instead. |

---

## Common Operations

```bash
EC2="ssh -i ~/.ssh/zavis-ec2.pem ubuntu@13.205.197.148"
ACTIVE=$($EC2 "cat /home/ubuntu/zavis-deploy/active-slot")

# PM2
$EC2 "pm2 status"
$EC2 "pm2 logs zavis-$ACTIVE --lines 50"
$EC2 "pm2 restart zavis-$ACTIVE"

# Nginx
$EC2 "cat /etc/nginx/conf.d/zavis-upstream.conf"
$EC2 "sudo nginx -t && sudo systemctl reload nginx"
$EC2 "sudo tail -50 /var/log/nginx/error.log"

# Health
$EC2 "curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' http://localhost/"
curl -s -o /dev/null -w '%{http_code}' https://www.zavis.ai/api/health

# Env vars (shared, both slots use it)
$EC2 "cat /home/ubuntu/zavis-shared/.env.local"
# After editing, restart active slot to pick up changes

# DB
$EC2 "psql -U zavis_admin -d zavis_landing -c 'SELECT count(*) FROM providers;'"
# After schema changes: GRANT ALL ON ALL TABLES IN SCHEMA public TO zavis_admin;

# Server health
$EC2 "df -h && free -h"
$EC2 "grep -E 'MemAvailable|SwapFree' /proc/meminfo"
$EC2 "ps -ef | grep 'next/dist/compiled/jest-worker' | grep -v grep"
$EC2 "pm2 jlist"
```

### Manual Nginx Swap (Emergency Only)

```bash
# Switch to green
$EC2 "echo 'upstream zavis_backend { server 127.0.0.1:3201; }' | sudo tee /etc/nginx/conf.d/zavis-upstream.conf && sudo nginx -t && sudo systemctl reload nginx && echo green > /home/ubuntu/zavis-deploy/active-slot && ln -sfn /home/ubuntu/zavis-landing-green /home/ubuntu/zavis-landing-active && pm2 save"

# Switch to blue
$EC2 "echo 'upstream zavis_backend { server 127.0.0.1:3200; }' | sudo tee /etc/nginx/conf.d/zavis-upstream.conf && sudo nginx -t && sudo systemctl reload nginx && echo blue > /home/ubuntu/zavis-deploy/active-slot && ln -sfn /home/ubuntu/zavis-landing-blue /home/ubuntu/zavis-landing-active && pm2 save"
```

---

## Debugging Failed Deploys

```bash
gh run list --limit 5
gh run view <run-id> --log
```

| Symptom | Cause | Fix |
|---|---|---|
| Lint/type error in CI | Code issue | Fix locally, push again |
| Deploy-time OOM during swap | Unsafe `2 old + 2 new` overlap or orphan build workers | Follow [blue-green-deploy-oom-runbook.md](/Users/kankanaray/Zavis%20UAE%20Healthcare%20Directory%20and%20Journal/docs/ops/blue-green-deploy-oom-runbook.md) and do not preserve full-overlap transitions |
| Build memory pressure before swap | Low real headroom on box | Check `MemAvailable`, stop idle slot, clean orphan `next build` workers, fail closed if below threshold |
| `next-font-manifest.json` missing | Stale cache | `rm -rf node_modules/.cache .next` on idle slot |
| Static file 404 | Broken symlink | Check `readlink /home/ubuntu/zavis-landing-active` |
| Health check 404 through Nginx | Missing Host header | Use `-H 'Host: www.zavis.ai'` |
| DB pool exhaustion during build | `generateStaticParams` with DB queries | Remove static params, use `force-dynamic` |
| Two deploys running | Webhook + Actions race | Stop `zavis-deploy-webhook`, rely on `flock` guard |
| PM2 crash-looping | Bad build | `pm2 logs zavis-<slot> --err --lines 50` |
| `Permission denied` on git pull | SSH vs HTTPS remote | Use HTTPS: `git remote set-url origin <https-url>` |
